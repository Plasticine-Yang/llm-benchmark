import { useCallback, useEffect, useMemo, useState } from 'react';
import WarehouseMap from './components/WarehouseMap';
import { DispatchConsole, JobQueuePanel } from './components/JobPanels';
import { EventLogPanel, FleetPanel } from './components/FleetAndEvents';
import { useSimulation } from './useSimulation';
import {
  clearBlocks,
  createJob,
  pauseSimulation,
  resetSimulation,
  resumeSimulation,
  setCellBlocked,
  stepSimulation,
} from './api';
import { formatClock, formatTick, robotStatus } from './format';

const CONNECTION_COPY = {
  live: { label: 'LIVE', detail: 'WebSocket' },
  connecting: { label: 'CONNECTING', detail: 'opening stream' },
  reconnecting: { label: 'RESYNCING', detail: 'reconnecting' },
  offline: { label: 'OFFLINE', detail: 'no stream' },
};

function BrandMark() {
  return (
    <span className="brand-mark" aria-hidden="true">
      <svg viewBox="0 0 38 38" width="38" height="38">
        <path d="M19 2.5 33.5 10v18L19 35.5 4.5 28V10L19 2.5Z" fill="none" stroke="currentColor" strokeWidth="1.3" />
        <path d="M19 9 27.5 13.5v10L19 28l-8.5-4.5v-10L19 9Z" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.72" />
        <circle cx="19" cy="18.5" r="4.2" fill="currentColor" />
        <path d="M19 3v5M19 30v5M5.5 10.8l4.8 3M27.7 24.2l4.8 3M32.5 10.8l-4.8 3M10.3 24.2l-4.8 3" stroke="currentColor" strokeWidth="1.1" opacity="0.65" />
      </svg>
    </span>
  );
}

function ControlIcon({ kind }) {
  if (kind === 'pause') {
    return (
      <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
        <rect x="3.5" y="3" width="3" height="10" rx="0.8" fill="currentColor" />
        <rect x="9.5" y="3" width="3" height="10" rx="0.8" fill="currentColor" />
      </svg>
    );
  }
  if (kind === 'play') {
    return (
      <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
        <path d="M4 2.8 13 8l-9 5.2V2.8Z" fill="currentColor" />
      </svg>
    );
  }
  if (kind === 'step') {
    return (
      <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
        <path d="M3 3.2 10 8l-7 4.8V3.2Z" fill="currentColor" />
        <rect x="11.5" y="3" width="2" height="10" rx="0.7" fill="currentColor" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
      <path d="M13.2 8a5.2 5.2 0 1 1-1.7-3.86M13.2 2.7v3.6H9.6" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Stat({ label, value, tone }) {
  return (
    <div className={`stat ${tone ? `stat-${tone}` : ''}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export default function App() {
  const {
    state,
    connection,
    syncNotice,
    error,
    pending,
    run,
    clearError,
    clearSyncNotice,
  } = useSimulation();
  const [selectedRobotId, setSelectedRobotId] = useState(null);
  const [localNotice, setLocalNotice] = useState(null);
  const [noticeTimer, setNoticeTimer] = useState(null);

  const selectedRobot = useMemo(() => {
    if (!state) return null;
    return (
      state.robots.find((robot) => robot.id === selectedRobotId) ??
      state.robots.find((robot) => robot.status !== 'idle') ??
      state.robots[0] ??
      null
    );
  }, [state, selectedRobotId]);

  useEffect(() => {
    if (!state || selectedRobotId) return;
    const first = state.robots.find((robot) => robot.waiting) ?? state.robots.find((robot) => robot.status !== 'idle') ?? state.robots[0];
    if (first) setSelectedRobotId(first.id);
  }, [state, selectedRobotId]);

  const flash = useCallback((message) => {
    setLocalNotice(message);
    if (noticeTimer) window.clearTimeout(noticeTimer);
    const timer = window.setTimeout(() => setLocalNotice(null), 3600);
    setNoticeTimer(timer);
  }, [noticeTimer]);

  const handleCreateJob = useCallback(
    async (payload) => {
      try {
        await run('create-job', () => createJob(payload));
        flash('Transport request accepted — scheduler re-evaluated instantly.');
      } catch {
        // Error is rendered by the connection hook.
      }
    },
    [flash, run],
  );

  const handleToggleBlock = useCallback(
    async (x, y) => {
      if (!state) return;
      const currentlyBlocked = state.blockedCells.some((cell) => cell.x === x && cell.y === y);
      try {
        await run('block', () => setCellBlocked(x, y, !currentlyBlocked));
      } catch {
        // Error is rendered by the connection hook.
      }
    },
    [run, state],
  );

  const handleClearBlocks = useCallback(async () => {
    if (!state || state.blockedCells.length === 0) return;
    try {
      await run('clear-blocks', clearBlocks);
      flash('All operator obstacles cleared. Fleet is replanning.');
    } catch {
      // handled
    }
  }, [flash, run, state]);

  const handlePause = useCallback(async () => {
    try {
      await run('pause', pauseSimulation);
    } catch {
      // handled
    }
  }, [run]);

  const handleResume = useCallback(async () => {
    try {
      await run('resume', resumeSimulation);
    } catch {
      // handled
    }
  }, [run]);

  const handleStep = useCallback(async () => {
    try {
      await run('step', stepSimulation);
    } catch {
      // handled
    }
  }, [run]);

  const handleReset = useCallback(async () => {
    if (!state) return;
    const confirmed = window.confirm(
      `Reset this run with seed ${state.seed}? Jobs and obstacle edits will be cleared; the deterministic seed is preserved.`,
    );
    if (!confirmed) return;
    try {
      await run('reset', () => resetSimulation(state.seed));
      flash(`Run reset with seed ${state.seed}. Paused at tick 0.`);
    } catch {
      // handled
    }
  }, [flash, run, state]);

  useEffect(() => {
    if (!error) return;
    const timer = window.setTimeout(() => clearError(), 8000);
    return () => window.clearTimeout(timer);
  }, [error, clearError]);

  useEffect(() => {
    if (!syncNotice) return;
    const timer = window.setTimeout(() => clearSyncNotice(), 4000);
    return () => window.clearTimeout(timer);
  }, [syncNotice, clearSyncNotice]);

  useEffect(() => () => {
    if (noticeTimer) window.clearTimeout(noticeTimer);
  }, [noticeTimer]);

  if (!state) {
    return (
      <main className="boot-screen">
        <div className="boot-grid" aria-hidden="true" />
        <div className="boot-card">
          <div className="boot-brand">
            <BrandMark />
            <div>
              <span className="brand-name">TESSERA</span>
              <span className="brand-sub">WAREHOUSE OS</span>
            </div>
          </div>
          <div className="boot-status">
            <span className={`connection-dot ${connection}`} />
            <span>Linking to authoritative warehouse state…</span>
          </div>
          <div className="boot-progress"><i /></div>
          <p className="boot-note">Space-time reservations · fixed-step simulation · one-way state stream</p>
          {error ? <div className="boot-error">{error}</div> : null}
        </div>
      </main>
    );
  }

  const copy = CONNECTION_COPY[connection] ?? CONNECTION_COPY.offline;
  const live = connection === 'live';
  const busy = pending !== null;
  const blockedCount = state.blockedCells.length;

  return (
    <div className="app-shell">
      <div className="ambient ambient-a" aria-hidden="true" />
      <div className="ambient ambient-b" aria-hidden="true" />

      <header className="topbar">
        <div className="brand-lockup">
          <BrandMark />
          <div className="brand-copy">
            <div className="brand-title-row">
              <span className="brand-name">TESSERA</span>
              <span className="brand-divider">/</span>
              <span className="brand-product">WAREHOUSE OS</span>
            </div>
            <span className="brand-sub">MULTI-ROBOT FULFILMENT CONTROL · SECTOR 07</span>
          </div>
        </div>

        <div className="topbar-metrics">
          <Stat label="TICK" value={formatTick(state.tick)} />
          <Stat label="SEQ" value={state.seq} tone="accent" />
          <Stat label="QUEUE" value={String(state.stats.queuedJobs).padStart(2, '0')} />
          <Stat label="HELD" value={String(state.stats.waitingRobots).padStart(2, '0')} tone={state.stats.waitingRobots ? 'warn' : undefined} />
          <Stat label="DONE" value={String(state.stats.completedJobs).padStart(2, '0')} />
        </div>

        <div className="topbar-actions">
          <div className={`connection-badge ${connection}`}>
            <span className={`connection-dot ${connection}`} />
            <span className="connection-label">{copy.label}</span>
            <span className="connection-detail">{copy.detail}</span>
          </div>
          <div className="control-cluster" role="group" aria-label="Simulation controls">
            {state.running ? (
              <button type="button" className="control-button primary" onClick={handlePause} disabled={busy} title="Pause fixed-step simulation">
                <ControlIcon kind="pause" />
                <span>Pause</span>
              </button>
            ) : (
              <button type="button" className="control-button primary run" onClick={handleResume} disabled={busy} title="Resume fixed-step simulation">
                <ControlIcon kind="play" />
                <span>Resume</span>
              </button>
            )}
            <button
              type="button"
              className="control-button"
              onClick={handleStep}
              disabled={busy}
              title="Pause and execute exactly one fixed tick"
              aria-label="Single step"
            >
              <ControlIcon kind="step" />
              <span>Step</span>
            </button>
            <button
              type="button"
              className="control-button"
              onClick={handleReset}
              disabled={busy}
              title={`Reset run with seed ${state.seed}`}
              aria-label="Reset run"
            >
              <ControlIcon kind="reset" />
              <span>Reset</span>
            </button>
          </div>
        </div>
      </header>

      <div className="run-strip">
        <div className="run-state">
          <span className={`run-indicator ${state.running ? 'running' : 'paused'}`}>
            <i />
            {state.running ? 'SIMULATION RUNNING' : 'SIMULATION PAUSED'}
          </span>
          <span className="strip-separator" />
          <span className="strip-item">SEED <b>{state.seed}</b></span>
          <span className="strip-item">STEP <b>{state.config.tickMs} ms</b></span>
          <span className="strip-item">REPLANS <b>{state.counters.replans}</b></span>
          <span className="strip-item">SAFETY HOLDS <b>{state.counters.safetyHolds}</b></span>
          <span className="strip-item">UPDATED <b>{formatClock(state.updatedAt)}</b></span>
        </div>
        <div className="algorithm-tags" aria-label="Scheduler algorithms">
          <span>SPACE-TIME A*</span>
          <span>RESERVATION TABLE</span>
          <span>1-LANE EXCLUSIVITY</span>
          <span>AGING {state.config.agingTicks}T</span>
        </div>
      </div>

      <main className="dashboard">
        <section className="panel map-panel" aria-labelledby="map-title">
          <div className="panel-heading map-heading">
            <div>
              <span className="eyebrow">FLOOR 07 · LIVE TOPOLOGY</span>
              <h2 id="map-title">Warehouse map</h2>
            </div>
            <div className="map-heading-actions">
              <span className={`map-state-chip ${state.running ? 'running' : 'paused'}`}>
                <i />
                {state.running ? 'LIVE' : 'FROZEN'}
              </span>
              <span className="blocked-count">{blockedCount} obstacles</span>
              <button
                type="button"
                className="ghost-button"
                onClick={handleClearBlocks}
                disabled={blockedCount === 0 || busy}
              >
                Clear blocks
              </button>
            </div>
          </div>
          <div className="map-frame">
            <WarehouseMap
              state={state}
              selectedRobotId={selectedRobot?.id ?? null}
              onSelectRobot={setSelectedRobotId}
              onToggleBlock={handleToggleBlock}
              busy={busy}
            />
            {!state.running && (
              <div className="frozen-ribbon">
                <span>PAUSED</span>
                Fixed at tick {state.tick}. Step or resume to advance.
              </div>
            )}
          </div>
          <div className="map-legend">
            <div className="legend-items" aria-label="Map legend">
              <span><i className="legend-swatch shelf" />Shelf</span>
              <span><i className="legend-swatch pickup" />Pickup bay</span>
              <span><i className="legend-swatch station" />Workstation</span>
              <span><i className="legend-swatch blocked" />Blocked</span>
              <span><i className="legend-swatch route" />Planned route</span>
              <span><i className="legend-swatch robot" />Robot</span>
            </div>
            <span className="legend-hint">CLICK ANY CELL = BLOCK / UNBLOCK · CLICK ROBOT MARKER = INSPECT</span>
          </div>
        </section>

        <div className="center-stack">
          <DispatchConsole state={state} onCreate={handleCreateJob} pending={pending} />
          <JobQueuePanel
            state={state}
            selectedRobotId={selectedRobot?.id ?? null}
            onSelectRobot={setSelectedRobotId}
          />
        </div>

        <div className="right-stack">
          <FleetPanel
            state={state}
            selectedRobotId={selectedRobot?.id ?? null}
            onSelectRobot={setSelectedRobotId}
          />
          <EventLogPanel state={state} />
        </div>
      </main>

      <footer className="app-footer">
        <span><i className={`connection-dot ${connection}`} /> STREAM SEQ {state.seq} · RUN {state.runId}</span>
        <span>{selectedRobot ? `${selectedRobot.id} ${selectedRobot.name} · ${robotStatus(selectedRobot).label}` : 'NO ROBOT SELECTED'}</span>
        <span>Space-time reservations prevent vertex collisions and cell swaps · blocking triggers immediate replan.</span>
      </footer>

      {(error || localNotice || syncNotice) && (
        <div className="toast-stack" aria-live="assertive">
          {syncNotice && (
            <div className="toast toast-success">
              <span className="toast-icon">↻</span>
              <div><strong>Stream resynchronised</strong><p>{syncNotice}</p></div>
              <button type="button" onClick={clearSyncNotice} aria-label="Dismiss">×</button>
            </div>
          )}
          {localNotice && (
            <div className="toast toast-info">
              <span className="toast-icon">✓</span>
              <div><strong>Command accepted</strong><p>{localNotice}</p></div>
              <button type="button" onClick={() => setLocalNotice(null)} aria-label="Dismiss">×</button>
            </div>
          )}
          {error && (
            <div className="toast toast-error">
              <span className="toast-icon">!</span>
              <div><strong>Command rejected</strong><p>{error}</p></div>
              <button type="button" onClick={clearError} aria-label="Dismiss">×</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
