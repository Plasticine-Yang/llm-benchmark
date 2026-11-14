import { useEffect, useRef, useState } from 'react';
import { api } from '../net';
import type {
  ConnectionStatus, Constants, Job, LogEntry, MapMode, Meta, RobotView, SimState, Stats, Transport,
} from '../types';

const PHASE_LABEL: Record<string, string> = {
  idle: 'IDLE',
  toPick: 'TO PICK',
  loading: 'LOADING',
  toDrop: 'TO DROP',
  unloading: 'UNLOADING',
  relocating: 'YIELDING',
};

export function TopBar(props: {
  sim: SimState;
  status: ConnectionStatus;
  transport: Transport;
  reconnects: number;
  onResync: () => void;
  onAction: (label: string, fn: () => Promise<unknown>) => void;
  busy: boolean;
}) {
  const { sim, status, transport, reconnects, onResync, onAction, busy } = props;
  const [seed, setSeed] = useState('');

  useEffect(() => {
    if (sim.seed && !seed) setSeed(String(sim.seed));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sim.seed]);

  const statusText = status === 'live'
    ? `LIVE · ${transport === 'sse' ? 'SSE' : 'WebSocket'}`
    : status.toUpperCase();

  return (
    <header className="topbar">
      <div className="brand">
        <span className="brand-mark">▦</span>
        <div>
          <h1>Multi-Robot Warehouse Scheduling</h1>
          <p>Space-time reservations · dynamic replanning · authoritative backend</p>
        </div>
      </div>

      <div className="topbar-metrics">
        <Metric label="tick" value={sim.tick} />
        <Metric label="seq" value={sim.seq} />
        <Metric label="run" value={`#${sim.runId}`} />
        <Metric label="seed" value={sim.seed || '—'} />
        <Metric label="done" value={`${sim.stats.completed}/${sim.stats.created}`} />
        <span className={`conn conn-${status}`} title={`transport: ${transport}, reconnects: ${reconnects}`}>
          <i className="dot" />{statusText}
        </span>
      </div>

      <div className="topbar-actions">
        {sim.running ? (
          <button className="btn" disabled={busy} onClick={() => onAction('pause', () => api.pause())}>
            ❚❚ Pause
          </button>
        ) : (
          <button className="btn btn-primary" disabled={busy} onClick={() => onAction('resume', () => api.resume())}>
            ▶ Resume
          </button>
        )}
        <button className="btn" disabled={busy} onClick={() => onAction('step', () => api.step())}>
          ⏭ Step
        </button>
        <label className="speed">
          <span>speed</span>
          <select
            value={sim.tps}
            disabled={busy}
            onChange={(e) => onAction('speed', () => api.speed(Number(e.target.value)))}
          >
            {[1, 2, 5, 10, 15, 20].map((v) => <option key={v} value={v}>{v} t/s</option>)}
          </select>
        </label>
        <input
          className="seed-input"
          value={seed}
          placeholder="seed"
          onChange={(e) => setSeed(e.target.value)}
          title="Reset with this seed to reproduce a run exactly"
        />
        <button
          className="btn btn-danger"
          disabled={busy}
          onClick={() => onAction('reset', () => api.reset(seed))}
        >
          ⟲ Reset
        </button>
        <button className="btn" onClick={onResync} title="Force a fresh snapshot from the server">
          ⇄ Resync
        </button>
      </div>
    </header>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="metric">
      <span className="metric-label">{label}</span>
      <span className="metric-value">{value}</span>
    </div>
  );
}

export function MapToolbar(props: {
  mode: MapMode;
  setMode: (m: MapMode) => void;
  showPaths: boolean;
  setShowPaths: (v: boolean) => void;
  blockedCount: number;
}) {
  const { mode, setMode, showPaths, setShowPaths, blockedCount } = props;
  const modes: Array<[MapMode, string, string]> = [
    ['inspect', 'Inspect', 'Hover cells for details'],
    ['block', 'Block / Unblock', 'Click any floor or workstation cell to toggle an obstacle'],
    ['shelf', 'Pick shelf', 'Click a shelf to select it as the job source'],
    ['station', 'Pick station', 'Click a workstation to select it as the job destination'],
  ];
  return (
    <div className="map-toolbar">
      <div className="seg">
        {modes.map(([m, label, title]) => (
          <button key={m} className={`seg-btn ${mode === m ? 'active' : ''}`} title={title} onClick={() => setMode(m)}>
            {label}
          </button>
        ))}
      </div>
      <label className="check">
        <input type="checkbox" checked={showPaths} onChange={(e) => setShowPaths(e.target.checked)} />
        planned paths
      </label>
      <span className="toolbar-note">{blockedCount} blocked cell{blockedCount === 1 ? '' : 's'}</span>
    </div>
  );
}

export function JobComposer(props: {
  meta: Meta | null;
  shelfId: string;
  stationId: string;
  priority: number;
  setShelfId: (v: string) => void;
  setStationId: (v: string) => void;
  setPriority: (v: number) => void;
  onCreate: () => void;
  onAuto: (n: number) => void;
  busy: boolean;
}) {
  const { meta, shelfId, stationId, priority, setShelfId, setStationId, setPriority, onCreate, onAuto, busy } = props;
  return (
    <section className="panel">
      <h2>Create transport job</h2>
      <div className="form-grid">
        <label>
          <span>Shelf</span>
          <select value={shelfId} onChange={(e) => setShelfId(e.target.value)}>
            <option value="">select shelf…</option>
            {meta?.shelves.map((s) => <option key={s.id} value={s.id}>{s.id} ({s.x},{s.y})</option>)}
          </select>
        </label>
        <label>
          <span>Workstation</span>
          <select value={stationId} onChange={(e) => setStationId(e.target.value)}>
            <option value="">select station…</option>
            {meta?.stations.map((s) => <option key={s.id} value={s.id}>{s.id} ({s.x},{s.y})</option>)}
          </select>
        </label>
        <label>
          <span>Priority</span>
          <select value={priority} onChange={(e) => setPriority(Number(e.target.value))}>
            {[5, 4, 3, 2, 1].map((p) => <option key={p} value={p}>{p} — {['', 'lowest', 'low', 'normal', 'high', 'critical'][p]}</option>)}
          </select>
        </label>
      </div>
      <div className="row">
        <button className="btn btn-primary" disabled={busy || !shelfId || !stationId} onClick={onCreate}>
          + Queue job
        </button>
        <button className="btn" disabled={busy} onClick={() => onAuto(3)}>3 mixed jobs</button>
        <button className="btn" disabled={busy} onClick={() => onAuto(8)}>8 stress jobs</button>
      </div>
      <p className="hint">
        Click a shelf on the map in “Pick shelf” mode, or use the dropdowns. The scheduler assigns the nearest
        available robot; queued jobs age so low priority never starves.
      </p>
    </section>
  );
}

export function JobQueue(props: {
  jobs: Job[];
  tick: number;
  constants: Constants | null;
  onCancel: (id: string) => void;
  busy: boolean;
}) {
  const { jobs, tick, constants, onCancel, busy } = props;
  const aging = constants?.AGING_TICKS ?? 60;
  const rank = (j: Job) => (j.status === 'queued' ? 0 : j.status === 'done' || j.status === 'cancelled' ? 2 : 1);
  const sorted = jobs.slice().sort((a, b) => {
    const r = rank(a) - rank(b);
    if (r !== 0) return r;
    if (rank(a) === 0) return (b.priority * aging + (tick - b.createdAtTick)) - (a.priority * aging + (tick - a.createdAtTick));
    return b.createdAtTick - a.createdAtTick;
  });
  const shown = sorted.slice(0, 60);

  return (
    <section className="panel panel-scroll">
      <h2>Job queue <span className="count">{jobs.filter((j) => j.status === 'queued').length} queued</span></h2>
      <div className="scroll">
        <table className="table">
          <thead>
            <tr><th>Job</th><th>Route</th><th>P</th><th>Status</th><th>Robot</th><th>Age</th><th /></tr>
          </thead>
          <tbody>
            {shown.map((j) => (
              <tr key={j.id} className={`st-${j.status}`}>
                <td className="mono">{j.id}</td>
                <td className="mono">{j.shelfId}→{j.stationId}</td>
                <td><span className={`pri pri-${j.priority}`}>{j.priority}</span></td>
                <td><span className={`badge badge-${j.status}`}>{j.status}</span></td>
                <td className="mono">{j.robotId ?? '—'}</td>
                <td className="mono">{j.completedAtTick !== null ? j.completedAtTick - j.createdAtTick : tick - j.createdAtTick}</td>
                <td>
                  {(j.status === 'queued' || j.status === 'assigned') && (
                    <button className="link" disabled={busy} onClick={() => onCancel(j.id)}>cancel</button>
                  )}
                </td>
              </tr>
            ))}
            {!shown.length && <tr><td colSpan={7} className="empty">No jobs yet — create one above.</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function RobotList(props: {
  robots: RobotView[];
  selected: string | null;
  onSelect: (id: string | null) => void;
}) {
  const { robots, selected, onSelect } = props;
  return (
    <section className="panel panel-scroll">
      <h2>Robots <span className="count">{robots.filter((r) => r.phase !== 'idle').length}/{robots.length} active</span></h2>
      <div className="scroll robot-scroll">
        {robots.map((r) => (
          <button
            key={r.id}
            className={`robot-card ${selected === r.id ? 'selected' : ''} ${r.waitReason && r.phase !== 'idle' ? 'waiting' : ''}`}
            onClick={() => onSelect(selected === r.id ? null : r.id)}
          >
            <span className="robot-swatch" style={{ background: r.color }} />
            <div className="robot-body">
              <div className="robot-head">
                <strong className="mono">{r.id}</strong>
                <span className={`badge phase-${r.phase}`}>{PHASE_LABEL[r.phase] ?? r.phase}</span>
                <span className="mono robot-pos">({r.x},{r.y})</span>
                {r.priority !== null && <span className={`pri pri-${r.priority}`}>p{r.priority}</span>}
                {r.stuckTicks > 0 && <span className="stuck">stuck {r.stuckTicks}t</span>}
              </div>
              <div className="robot-sub mono">
                {r.jobId ? `${r.jobId} · ${r.shelfId} → ${r.stationId}` : 'no job'}
                {' · '}{r.path.length - 1} steps planned · {r.jobsDone} done
              </div>
              <div className={`robot-wait ${r.waitReason ? '' : 'moving'}`}>
                {r.waitReason ?? 'moving along reserved route'}
              </div>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}

export function EventLog({ logs }: { logs: LogEntry[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const stick = useRef(true);
  useEffect(() => {
    const el = ref.current;
    if (el && stick.current) el.scrollTop = el.scrollHeight;
  }, [logs]);
  return (
    <section className="panel panel-scroll">
      <h2>
        Event log
        <label className="check inline">
          <input type="checkbox" defaultChecked onChange={(e) => { stick.current = e.target.checked; }} />
          follow
        </label>
      </h2>
      <div
        className="scroll log"
        ref={ref}
        onScroll={(e) => {
          const el = e.currentTarget;
          stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 24;
        }}
      >
        {logs.map((l) => (
          <div key={l.id} className={`log-line log-${l.level}`}>
            <span className="log-tick mono">t{l.tick}</span>
            <span className="log-text">{l.text}</span>
          </div>
        ))}
        {!logs.length && <div className="empty">Waiting for events…</div>}
      </div>
    </section>
  );
}

export function StatsBar({ stats, constants }: { stats: Stats; constants: Constants | null }) {
  const items: Array<[string, string | number, string]> = [
    ['replans', stats.replans, 'Space-time A* runs'],
    ['deadlock breaks', stats.deadlockResolutions, 'Wait-cycle / congestion resolutions'],
    ['yield ticks', stats.yields, 'Ticks robots waited instead of colliding'],
    ['invariant checks', stats.invariantChecks, 'Per-tick vertex + swap + terrain assertions'],
    ['violations', stats.violations, 'Must stay 0'],
    ['horizon', constants?.HORIZON ?? '—', 'Reservation look-ahead (ticks)'],
  ];
  return (
    <div className="stats-bar">
      {items.map(([label, value, title]) => (
        <div key={label} className={`stat ${label === 'violations' && Number(value) > 0 ? 'stat-bad' : ''}`} title={title}>
          <span className="stat-value mono">{value}</span>
          <span className="stat-label">{label}</span>
        </div>
      ))}
    </div>
  );
}

export function Legend() {
  const items: Array<[string, string]> = [
    ['#3d4d68', 'shelf (obstacle)'],
    ['#0f766e', 'workstation'],
    ['#263449', 'wall'],
    ['#16233c', 'bottleneck aisle'],
    ['#7f1d1d', 'blocked cell'],
    ['#64748b', 'idle robot'],
  ];
  return (
    <div className="legend">
      {items.map(([color, label]) => (
        <span key={label} className="legend-item"><i style={{ background: color }} />{label}</span>
      ))}
      <span className="legend-item"><i className="legend-ring" />waiting / yielding</span>
      <span className="legend-item"><i className="legend-dash" />planned route</span>
    </div>
  );
}