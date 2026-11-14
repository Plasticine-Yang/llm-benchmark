import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  SimState, SimMessage, ConnectionStatus, Transport, LogEntry,
} from './types';

const MAX_LOGS = 300;

const EMPTY_STATE: SimState = {
  seq: 0, runId: 0, tick: 0, running: false, tps: 5, seed: 0,
  blocked: [], robots: [], jobs: [], logs: [],
  stats: {
    created: 0, completed: 0, cancelled: 0, replans: 0,
    deadlockResolutions: 0, yields: 0, violations: 0, invariantChecks: 0,
  },
  meta: null, constants: null,
};

function mergeLogs(prev: LogEntry[], incoming: LogEntry[], lastId: number): LogEntry[] {
  const fresh = incoming.filter((l) => l.id > lastId);
  if (!fresh.length) return prev;
  const combined = prev.concat(fresh);
  return combined.length > MAX_LOGS ? combined.slice(combined.length - MAX_LOGS) : combined;
}

export function useSim() {
  const [state, setState] = useState<SimState>(EMPTY_STATE);
  const [status, setStatus] = useState<ConnectionStatus>('connecting');
  const [transport, setTransport] = useState<Transport>('none');
  const [reconnects, setReconnects] = useState(0);

  const seqRef = useRef(0);
  const runRef = useRef(0);
  const logIdRef = useRef(0);
  const wsRef = useRef<WebSocket | null>(null);
  const esRef = useRef<EventSource | null>(null);
  const attemptsRef = useRef(0);
  const timerRef = useRef<number | null>(null);
  const closedRef = useRef(false);

  const resync = useCallback(() => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'hello', lastSeq: seqRef.current }));
      return;
    }
    const es = esRef.current;
    if (es) { es.close(); esRef.current = null; }
    attemptsRef.current = 0;
    connectRef.current?.();
  }, []);

  const apply = useCallback((msg: SimMessage) => {
    if (!msg || typeof msg.seq !== 'number') return;

    if (msg.type === 'snapshot') {
      // Authoritative full state. Everything older than this seq is discarded.
      seqRef.current = msg.seq;
      runRef.current = msg.runId;
      logIdRef.current = msg.logs.reduce((m, l) => Math.max(m, l.id), 0);
      setState({
        seq: msg.seq, runId: msg.runId, tick: msg.tick, running: msg.running,
        tps: msg.tps, seed: msg.seed, blocked: msg.blocked, robots: msg.robots,
        jobs: msg.jobs, logs: msg.logs.slice(-MAX_LOGS), stats: msg.stats,
        meta: msg.meta, constants: msg.constants,
      });
      return;
    }

    if (msg.seq <= seqRef.current) return;
    if (msg.runId !== runRef.current) { resync(); return; }

    seqRef.current = msg.seq;
    const lastLog = logIdRef.current;
    logIdRef.current = msg.logs.reduce((m, l) => Math.max(m, l.id), lastLog);
    setState((prev) => ({
      ...prev,
      seq: msg.seq, runId: msg.runId, tick: msg.tick, running: msg.running,
      tps: msg.tps, seed: msg.seed, blocked: msg.blocked, robots: msg.robots,
      jobs: msg.jobs, stats: msg.stats,
      logs: mergeLogs(prev.logs, msg.logs, lastLog),
    }));
  }, [resync]);

  const connectRef = useRef<(() => void) | null>(null);

  const scheduleReconnect = useCallback(() => {
    if (closedRef.current) return;
    setStatus('reconnecting');
    setReconnects((n) => n + 1);
    attemptsRef.current += 1;
    const delay = Math.min(8000, 350 * 2 ** Math.min(attemptsRef.current, 5));
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => connectRef.current?.(), delay);
  }, []);

  const connectSSE = useCallback(() => {
    if (closedRef.current) return;
    setStatus(attemptsRef.current === 0 ? 'connecting' : 'reconnecting');
    let es: EventSource;
    try { es = new EventSource('/api/stream'); } catch { scheduleReconnect(); return; }
    esRef.current = es;
    es.onopen = () => {
      attemptsRef.current = 0;
      setTransport('sse');
      setStatus('live');
    };
    es.onmessage = (ev) => {
      try { apply(JSON.parse(ev.data) as SimMessage); } catch { /* ignore malformed frame */ }
    };
    es.onerror = () => {
      es.close();
      if (esRef.current === es) esRef.current = null;
      scheduleReconnect();
    };
  }, [apply, scheduleReconnect]);

  const connectWS = useCallback(() => {
    if (closedRef.current) return;
    setStatus(attemptsRef.current === 0 ? 'connecting' : 'reconnecting');
    const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
    let ws: WebSocket;
    try { ws = new WebSocket(`${proto}://${window.location.host}/ws`); } catch { connectSSE(); return; }
    wsRef.current = ws;
    ws.onopen = () => {
      attemptsRef.current = 0;
      setTransport('websocket');
      setStatus('live');
      ws.send(JSON.stringify({ type: 'hello', lastSeq: seqRef.current }));
    };
    ws.onmessage = (ev) => {
      try { apply(JSON.parse(ev.data) as SimMessage); } catch { /* ignore malformed frame */ }
    };
    ws.onerror = () => { try { ws.close(); } catch { /* noop */ } };
    ws.onclose = () => {
      if (wsRef.current === ws) wsRef.current = null;
      if (closedRef.current) return;
      if (attemptsRef.current >= 3) connectSSE();
      else scheduleReconnect();
    };
  }, [apply, connectSSE, scheduleReconnect]);

  useEffect(() => {
    connectRef.current = () => {
      if (attemptsRef.current >= 4 && transport === 'sse') connectSSE();
      else connectWS();
    };
  }, [connectWS, connectSSE, transport]);

  useEffect(() => {
    closedRef.current = false;
    connectRef.current = connectWS;
    connectWS();
    const onVisible = () => { if (document.visibilityState === 'visible') resync(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      closedRef.current = true;
      document.removeEventListener('visibilitychange', onVisible);
      if (timerRef.current) window.clearTimeout(timerRef.current);
      wsRef.current?.close();
      esRef.current?.close();
      wsRef.current = null;
      esRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { state, status, transport, reconnects, resync };
}

// ------------------------------------------------------------------ REST API

async function request<T>(url: string, method = 'GET', body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`);
  return data as T;
}

export const api = {
  createJob: (shelfId: string, stationId: string, priority: number) =>
    request<{ job: unknown }>('/api/jobs', 'POST', { shelfId, stationId, priority }),
  autoJobs: (count: number) => request<{ jobs: unknown[] }>('/api/jobs/auto', 'POST', { count }),
  cancelJob: (id: string) => request(`/api/jobs/${id}`, 'DELETE'),
  block: (x: number, y: number) => request('/api/cells/block', 'POST', { x, y }),
  unblock: (x: number, y: number) => request('/api/cells/unblock', 'POST', { x, y }),
  pause: () => request('/api/sim/pause', 'POST'),
  resume: () => request('/api/sim/resume', 'POST'),
  step: () => request('/api/sim/step', 'POST'),
  speed: (tps: number) => request('/api/sim/speed', 'POST', { tps }),
  reset: (seed?: string) => request('/api/sim/reset', 'POST', { seed }),
};