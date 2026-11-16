import { useCallback, useEffect, useRef, useState } from 'react';
import {
  GridCell,
  JobPriority,
  Point,
  SimEvent,
  SimulationSnapshot,
  SimulationUpdatePayload,
  WsServerMessage,
} from '../../shared/types';

export type ConnectionState =
  | 'CONNECTING'
  | 'CONNECTED'
  | 'RECONNECTING'
  | 'DISCONNECTED';

function applyBlockedCellsToGrid(
  prevGrid: SimulationSnapshot['grid'],
  blockedCells: Point[]
): SimulationSnapshot['grid'] {
  const blockedSet = new Set(blockedCells.map((p) => `${p.x},${p.y}`));
  let anyChanged = false;

  const newCells: GridCell[][] = prevGrid.cells.map((row, y) =>
    row.map((cell, x) => {
      const shouldBlock = blockedSet.has(`${x},${y}`);
      if (cell.blocked !== shouldBlock) {
        anyChanged = true;
        return { ...cell, blocked: shouldBlock };
      }
      return cell;
    })
  );

  if (!anyChanged) return prevGrid;
  return { ...prevGrid, cells: newCells };
}

export function useWarehouseSync() {
  const [snapshot, setSnapshot] = useState<SimulationSnapshot | null>(null);
  const [connState, setConnState] = useState<ConnectionState>('CONNECTING');
  const [manualOffline, setManualOffline] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const lastSeqRef = useRef<number>(0);
  const reconnectTimerRef = useRef<number | null>(null);
  const attemptRef = useRef<number>(0);
  const manualOfflineRef = useRef<boolean>(false);

  manualOfflineRef.current = manualOffline;

  const applySnapshot = useCallback((incoming: SimulationSnapshot, source: string) => {
    // Allow snapshot if newer/equal seq OR if runId changed on reset
    setSnapshot((prev) => {
      if (
        prev &&
        incoming.seq < lastSeqRef.current &&
        incoming.runId === prev.runId
      ) {
        return prev;
      }
      lastSeqRef.current = incoming.seq;
      setSyncNotice(`Synced snapshot (${source}) at seq #${incoming.seq}`);
      return incoming;
    });
  }, []);

  const applyUpdate = useCallback((msg: Extract<WsServerMessage, { type: 'STATE_UPDATE' }>) => {
    // Drop stale out-of-order updates
    if (msg.seq <= lastSeqRef.current) {
      return;
    }

    // Detect sequence gap and request full snapshot recovery
    if (lastSeqRef.current > 0 && msg.seq > lastSeqRef.current + 1) {
      setSyncNotice(
        `Sequence gap detected (${lastSeqRef.current} → ${msg.seq}); requesting snapshot resync`
      );
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'REQUEST_SNAPSHOT' }));
      }
      return;
    }

    lastSeqRef.current = msg.seq;
    const data: SimulationUpdatePayload = msg.data;

    setSnapshot((prev) => {
      if (!prev) return prev;
      const nextGrid = data.grid
        ? data.grid
        : applyBlockedCellsToGrid(prev.grid, data.blockedCells);

      const seen = new Set(prev.events.map((e) => e.id));
      const mergedEvents: SimEvent[] = [...prev.events];
      for (const ev of data.newEvents) {
        if (!seen.has(ev.id)) {
          mergedEvents.push(ev);
          seen.add(ev.id);
        }
      }
      const boundedEvents =
        mergedEvents.length > 200 ? mergedEvents.slice(-180) : mergedEvents;

      return {
        ...prev,
        runId: data.runId,
        seed: data.seed,
        seq: data.seq,
        tick: data.tick,
        running: data.running,
        tickIntervalMs: data.tickIntervalMs,
        grid: nextGrid,
        robots: data.robots,
        jobs: data.jobs,
        events: boundedEvents,
        stats: data.stats,
      };
    });
  }, []);

  const connect = useCallback(() => {
    if (manualOfflineRef.current) return;
    if (reconnectTimerRef.current !== null) {
      window.clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.onclose = null;
      wsRef.current.close();
      wsRef.current = null;
    }

    setConnState(attemptRef.current > 0 ? 'RECONNECTING' : 'CONNECTING');

    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${proto}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      attemptRef.current = 0;
      setConnState('CONNECTED');
      setLastError(null);
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data as string) as WsServerMessage;
        if (msg.type === 'SNAPSHOT') {
          applySnapshot(msg.data, 'WS');
        } else if (msg.type === 'STATE_UPDATE') {
          applyUpdate(msg);
        } else if (msg.type === 'ERROR') {
          setLastError(msg.message);
        }
      } catch {
        // Ignore malformed frame
      }
    };

    ws.onclose = () => {
      wsRef.current = null;
      if (manualOfflineRef.current) {
        setConnState('DISCONNECTED');
        return;
      }
      setConnState('RECONNECTING');
      const delay = Math.min(3000, 400 * Math.pow(1.6, attemptRef.current));
      attemptRef.current += 1;
      reconnectTimerRef.current = window.setTimeout(() => {
        connect();
      }, delay);
    };

    ws.onerror = () => {
      // onclose handles retry
    };
  }, [applySnapshot, applyUpdate]);

  useEffect(() => {
    // Initial HTTP bootstrap + WS stream
    fetch('/api/state')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Failed to fetch initial state'))))
      .then((data: SimulationSnapshot) => {
        if (data.seq > lastSeqRef.current) {
          applySnapshot(data, 'HTTP');
        }
      })
      .catch((err: Error) => setLastError(err.message));

    connect();

    return () => {
      if (reconnectTimerRef.current !== null) {
        window.clearTimeout(reconnectTimerRef.current);
      }
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
      }
    };
  }, [applySnapshot, connect]);

  const toggleManualDisconnect = useCallback(() => {
    if (!manualOfflineRef.current) {
      setManualOffline(true);
      manualOfflineRef.current = true;
      if (reconnectTimerRef.current !== null) {
        window.clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      setConnState('DISCONNECTED');
      setSyncNotice(`Stream disconnected locally at seq #${lastSeqRef.current}`);
    } else {
      setManualOffline(false);
      manualOfflineRef.current = false;
      attemptRef.current = 1;
      connect();
    }
  }, [connect]);

  const postAction = useCallback(
    async (url: string, options?: RequestInit) => {
      setLastError(null);
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        ...options,
      });
      const body = (await res.json().catch(() => ({}))) as {
        error?: string;
        snapshot?: SimulationSnapshot;
      };
      if (!res.ok) {
        const msg = body.error ?? `Request failed (${res.status})`;
        setLastError(msg);
        throw new Error(msg);
      }
      if (body.snapshot && body.snapshot.seq > lastSeqRef.current && !manualOfflineRef.current) {
        applySnapshot(body.snapshot, 'API');
      }
      return body;
    },
    [applySnapshot]
  );

  const actions = {
    createJob: (shelfId: string, workstationId: string, priority: JobPriority) =>
      postAction('/api/jobs', {
        body: JSON.stringify({ shelfId, workstationId, priority }),
      }),
    createDemoBatch: () =>
      postAction('/api/jobs/batch', {
        body: JSON.stringify({
          jobs: [
            { shelfId: 'S-08', workstationId: 'WS-1', priority: 'NORMAL' },
            { shelfId: 'S-10', workstationId: 'WS-3', priority: 'HIGH' },
            { shelfId: 'S-17', workstationId: 'WS-6', priority: 'URGENT' },
          ],
        }),
      }),
    cancelJob: (jobId: string) =>
      postAction(`/api/jobs/${encodeURIComponent(jobId)}`, { method: 'DELETE' }),
    toggleBlockCell: (x: number, y: number, blocked?: boolean) =>
      postAction('/api/grid/block', { body: JSON.stringify({ x, y, blocked }) }),
    pause: () => postAction('/api/sim/pause'),
    resume: () => postAction('/api/sim/resume'),
    step: () => postAction('/api/sim/step'),
    setSpeed: (tickIntervalMs: number) =>
      postAction('/api/sim/speed', { body: JSON.stringify({ tickIntervalMs }) }),
    reset: (seed?: string) =>
      postAction('/api/sim/reset', { body: JSON.stringify({ seed }) }),
    clearError: () => setLastError(null),
  };

  return {
    snapshot,
    connState,
    manualOffline,
    lastError,
    syncNotice,
    toggleManualDisconnect,
    actions,
  };
}
