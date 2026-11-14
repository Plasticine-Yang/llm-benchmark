import { useCallback, useEffect, useMemo, useState } from 'react';
import { api, useSim } from './net';
import MapCanvas from './components/MapCanvas';
import {
  EventLog, JobComposer, JobQueue, Legend, MapToolbar, RobotList, StatsBar, TopBar,
} from './components/Panels';
import type { MapMode } from './types';

export default function App() {
  const { state, status, transport, reconnects, resync } = useSim();
  const [mode, setMode] = useState<MapMode>('block');
  const [showPaths, setShowPaths] = useState(true);
  const [shelfId, setShelfId] = useState('');
  const [stationId, setStationId] = useState('');
  const [priority, setPriority] = useState(3);
  const [selectedRobot, setSelectedRobot] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{ kind: string; text: string } | null>(null);

  const notify = useCallback((kind: string, text: string) => {
    setToast({ kind, text });
    window.setTimeout(() => setToast(null), 3600);
  }, []);

  const onAction = useCallback(async (label: string, fn: () => Promise<unknown>) => {
    setBusy(true);
    try {
      await fn();
    } catch (err) {
      notify('error', `${label}: ${(err as Error).message}`);
    } finally {
      setBusy(false);
    }
  }, [notify]);

  useEffect(() => {
    if (!state.meta) return;
    setShelfId((cur) => cur || state.meta!.shelves[0]?.id || '');
    setStationId((cur) => cur || state.meta!.stations[0]?.id || '');
  }, [state.meta]);

  const onCellClick = useCallback((x: number, y: number) => {
    const meta = state.meta;
    if (!meta) return;
    const i = y * meta.w + x;
    const t = meta.cells[i];

    if (mode === 'block') {
      if (t === meta.cellTypes.WALL || t === meta.cellTypes.SHELF) {
        notify('error', 'Walls and shelves are permanent obstacles — click a floor or workstation cell');
        return;
      }
      const isBlocked = state.blocked.includes(i);
      onAction(isBlocked ? 'unblock' : 'block', () => (isBlocked ? api.unblock(x, y) : api.block(x, y)));
      return;
    }
    if (mode === 'shelf') {
      const s = meta.shelves.find((sh) => x >= sh.x && x < sh.x + sh.w && y >= sh.y && y < sh.y + sh.h);
      if (s) { setShelfId(s.id); notify('ok', `Source shelf ${s.id} selected`); }
      else notify('error', 'That cell is not a shelf');
      return;
    }
    if (mode === 'station') {
      const s = meta.stations.find((st) => st.x === x && st.y === y);
      if (s) { setStationId(s.id); notify('ok', `Destination ${s.id} selected`); }
      else notify('error', 'That cell is not a workstation');
      return;
    }
    const r = state.robots.find((rb) => rb.x === x && rb.y === y);
    setSelectedRobot(r ? r.id : null);
  }, [mode, state.meta, state.blocked, state.robots, notify, onAction]);

  const canvasRobots = useMemo(() => {
    if (!selectedRobot) return state.robots;
    return state.robots.map((r) => (r.id === selectedRobot ? r : { ...r, path: [{ x: r.x, y: r.y }] }));
  }, [state.robots, selectedRobot]);

  const createJob = () => onAction('create job', async () => {
    await api.createJob(shelfId, stationId, priority);
    notify('ok', `Job queued: ${shelfId} → ${stationId} (p${priority})`);
  });

  const autoJobs = (n: number) => onAction('auto jobs', async () => {
    await api.autoJobs(n);
    notify('ok', `${n} jobs queued with mixed priorities`);
  });

  return (
    <div className="app">
      <TopBar
        sim={state}
        status={status}
        transport={transport}
        reconnects={reconnects}
        onResync={resync}
        onAction={onAction}
        busy={busy}
      />

      {toast && <div className={`toast toast-${toast.kind}`}>{toast.text}</div>}

      <main className="layout">
        <section className="map-col">
          <MapToolbar
            mode={mode}
            setMode={setMode}
            showPaths={showPaths}
            setShowPaths={setShowPaths}
            blockedCount={state.blocked.length}
          />
          {state.meta ? (
            <MapCanvas
              meta={state.meta}
              robots={canvasRobots}
              blocked={state.blocked}
              tick={state.tick}
              mode={mode}
              selectedShelf={shelfId || null}
              selectedStation={stationId || null}
              showPaths={showPaths}
              onCellClick={onCellClick}
            />
          ) : (
            <div className="map-loading">
              {status === 'reconnecting' ? 'Reconnecting — fetching a fresh snapshot…' : 'Connecting to simulation…'}
            </div>
          )}
          <Legend />
          <StatsBar stats={state.stats} constants={state.constants} />
          {selectedRobot && (
            <p className="hint">
              Showing route for <strong className="mono">{selectedRobot}</strong> only —{' '}
              <button className="link" onClick={() => setSelectedRobot(null)}>show all routes</button>
            </p>
          )}
        </section>

        <aside className="side-col">
          <JobComposer
            meta={state.meta}
            shelfId={shelfId}
            stationId={stationId}
            priority={priority}
            setShelfId={setShelfId}
            setStationId={setStationId}
            setPriority={setPriority}
            onCreate={createJob}
            onAuto={autoJobs}
            busy={busy}
          />
          <JobQueue
            jobs={state.jobs}
            tick={state.tick}
            constants={state.constants}
            onCancel={(id) => onAction('cancel', () => api.cancelJob(id))}
            busy={busy}
          />
          <RobotList robots={state.robots} selected={selectedRobot} onSelect={setSelectedRobot} />
          <EventLog logs={state.logs} />
        </aside>
      </main>
    </div>
  );
}