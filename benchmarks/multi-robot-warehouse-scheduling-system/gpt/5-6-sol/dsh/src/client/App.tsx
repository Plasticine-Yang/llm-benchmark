import { FormEvent, useEffect, useMemo, useState } from "react";
import type { Point, Priority, SimulationState, StreamEnvelope } from "../shared/types";
import { api } from "./api";
import { WarehouseMap } from "./WarehouseMap";

const priorityName = (priority: Priority) => ["", "LOW", "NORMAL", "HIGH", "URGENT", "CRITICAL"][priority];
const modeName: Record<string, string> = {
  IDLE: "AVAILABLE",
  TO_PICKUP: "EN ROUTE / PICKUP",
  TO_WORKSTATION: "EN ROUTE / DELIVERY",
  RETURNING: "RETURNING TO BAY",
};
const jobStatusName: Record<string, string> = {
  QUEUED: "QUEUED",
  TO_PICKUP: "PICKUP",
  TO_WORKSTATION: "DELIVERY",
  COMPLETED: "COMPLETE",
};

function App() {
  const [state, setState] = useState<SimulationState | null>(null);
  const [connected, setConnected] = useState(false);
  const [selectedRobotId, setSelectedRobotId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let source: EventSource | null = null;
    let cancelled = false;
    api.state().then((snapshot) => !cancelled && setState(snapshot)).catch((err) => setError(err.message));

    source = new EventSource("/api/events");
    const apply = (event: MessageEvent) => {
      const envelope = JSON.parse(event.data) as StreamEnvelope;
      setState((current) => (!current || envelope.sequence >= current.sequence ? envelope.state : current));
      setConnected(true);
    };
    source.addEventListener("snapshot", apply);
    source.addEventListener("update", apply);
    source.onopen = () => setConnected(true);
    source.onerror = () => setConnected(false);
    return () => {
      cancelled = true;
      source?.close();
    };
  }, []);

  const activeJobs = useMemo(() => state?.jobs.filter((job) => job.status !== "COMPLETED") ?? [], [state]);
  const selectedRobot = state?.robots.find((robot) => robot.id === selectedRobotId) ?? null;

  const execute = async (operation: () => Promise<unknown>) => {
    setBusy(true);
    setError(null);
    try { await operation(); }
    catch (err) { setError(err instanceof Error ? err.message : "Operation failed"); }
    finally { setBusy(false); }
  };

  if (!state) return <main className="loading"><span className="loader" />CONNECTING TO FLOOR CONTROL…</main>;

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand-mark">R<span>/</span>O</div>
        <div className="brand-copy">
          <p className="eyebrow">AUTONOMOUS MATERIAL FLOW</p>
          <h1>ROUTE/OPS <span>warehouse control</span></h1>
        </div>
        <div className="system-strip">
          <Metric label="TICK" value={String(state.tick).padStart(4, "0")} />
          <Metric label="ROBOTS" value={`${state.robots.filter((r) => r.jobId).length}/${state.robots.length}`} />
          <Metric label="THROUGHPUT" value={String(state.metrics.completedJobs).padStart(2, "0")} />
          <div className={`link-state ${connected ? "online" : "offline"}`}><i />{connected ? "LIVE LINK" : "RECONNECTING"}<small>SEQ {state.sequence}</small></div>
        </div>
      </header>

      <div className="controlbar">
        <div className="control-state"><i className={state.running ? "running" : "paused"} />{state.running ? "SIMULATION RUNNING" : "SIMULATION PAUSED"}<span>650 MS / STEP</span></div>
        <div className="control-actions">
          <button className="button primary" disabled={busy} onClick={() => execute(() => api.control(state.running ? "pause" : "resume"))}>
            {state.running ? "Ⅱ  PAUSE" : "▶  RESUME"}
          </button>
          <button className="button" disabled={busy || state.running} onClick={() => execute(() => api.control("step"))}>STEP +1</button>
          <button className="button danger" disabled={busy} onClick={() => window.confirm("Reset this deterministic run and clear all jobs?") && execute(() => api.control("reset"))}>↺ RESET</button>
        </div>
      </div>

      {error && <div className="error-banner"><span>!</span>{error}<button onClick={() => setError(null)}>×</button></div>}

      <div className="workspace">
        <div className="main-column">
          <WarehouseMap
            state={state}
            selectedRobotId={selectedRobotId}
            onSelectRobot={setSelectedRobotId}
            onToggleCell={(point: Point, blocked: boolean) => execute(() => api.setBlocked(point.x, point.y, blocked))}
          />
          <div className="bottom-grid">
            <RobotFleet state={state} selectedId={selectedRobotId} onSelect={setSelectedRobotId} />
            <EventLog state={state} />
          </div>
        </div>
        <aside className="side-column">
          <JobComposer state={state} busy={busy} onSubmit={(shelfId, stationId, priority) => execute(() => api.createJob(shelfId, stationId, priority))} />
          <JobQueue state={state} jobs={activeJobs} />
          <SelectionCard state={state} robotId={selectedRobot?.id ?? null} />
        </aside>
      </div>
      <footer><span>SEED {state.seed}</span><span>AUTHORITATIVE SERVER CLOCK</span><span>A* + SPACE–TIME RESERVATIONS</span><span>{state.map.blocked.length} DYNAMIC BLOCKS</span></footer>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="metric"><span>{label}</span><b>{value}</b></div>;
}

function JobComposer({ state, busy, onSubmit }: { state: SimulationState; busy: boolean; onSubmit: (s: string, w: string, p: Priority) => void }) {
  const [shelfId, setShelfId] = useState(state.map.shelves[0].id);
  const [stationId, setStationId] = useState(state.map.workstations[0].id);
  const [priority, setPriority] = useState<Priority>(3);
  const submit = (event: FormEvent) => {
    event.preventDefault();
    onSubmit(shelfId, stationId, priority);
  };
  return (
    <section className="panel composer">
      <div className="panel-heading"><div><p className="eyebrow">DISPATCH CONSOLE</p><h2>Create transport job</h2></div><span className="panel-index">01</span></div>
      <form onSubmit={submit}>
        <label>SOURCE SHELF<select value={shelfId} onChange={(e) => setShelfId(e.target.value)}>{state.map.shelves.map((shelf) => <option key={shelf.id} value={shelf.id}>{shelf.id} · pickup {shelf.pickup.x},{shelf.pickup.y}</option>)}</select></label>
        <label>DESTINATION<select value={stationId} onChange={(e) => setStationId(e.target.value)}>{state.map.workstations.map((station) => <option key={station.id} value={station.id}>{station.label}</option>)}</select></label>
        <fieldset><legend>PRIORITY</legend><div className="priority-selector">{([1, 2, 3, 4, 5] as Priority[]).map((value) => <button type="button" className={priority === value ? "active" : ""} key={value} onClick={() => setPriority(value)}><b>P{value}</b><small>{priorityName(value)}</small></button>)}</div></fieldset>
        <button className="dispatch-button" disabled={busy} type="submit">DISPATCH JOB <span>↗</span></button>
      </form>
      <p className="composer-note"><i /> Nearest available robot is assigned automatically. Queue priority ages over time.</p>
    </section>
  );
}

function JobQueue({ state, jobs }: { state: SimulationState; jobs: SimulationState["jobs"] }) {
  return (
    <section className="panel queue-panel">
      <div className="panel-heading"><div><p className="eyebrow">ACTIVE MANIFEST</p><h2>Job queue <span className="count">{jobs.length}</span></h2></div><span className="panel-index">02</span></div>
      <div className="queue-list">
        {jobs.length === 0 && <div className="empty-state">NO ACTIVE JOBS<br/><span>Dispatch a shelf movement above.</span></div>}
        {jobs.slice().sort((a, b) => b.priority - a.priority || a.createdTick - b.createdTick).map((job) => {
          const robot = state.robots.find((item) => item.id === job.robotId);
          const station = state.map.workstations.find((item) => item.id === job.workstationId);
          return <article className="job-row" key={job.id}>
            <div className={`priority-chip p${job.priority}`}>P{job.priority}</div>
            <div className="job-data"><b>{job.id}</b><span>{job.shelfId} <i>→</i> {station?.label}</span><small>WAIT {state.tick - job.createdTick} TICKS</small></div>
            <div className="job-assignment"><span className={`status ${job.status.toLowerCase()}`}>{jobStatusName[job.status]}</span><b>{robot?.name ?? "UNASSIGNED"}</b></div>
          </article>;
        })}
      </div>
    </section>
  );
}

function RobotFleet({ state, selectedId, onSelect }: { state: SimulationState; selectedId: string | null; onSelect: (id: string) => void }) {
  return (
    <section className="panel fleet-panel">
      <div className="panel-heading"><div><p className="eyebrow">MOBILE ASSETS</p><h2>Robot fleet</h2></div><span className="panel-index">03</span></div>
      <div className="robot-list">
        {state.robots.map((robot) => <button key={robot.id} className={`robot-row ${selectedId === robot.id ? "selected" : ""}`} onClick={() => onSelect(robot.id)}>
          <i className="robot-swatch" style={{ background: robot.color }} />
          <span className="robot-name"><b>{robot.name}</b><small>POS {robot.position.x}:{robot.position.y}</small></span>
          <span className="robot-mode">{modeName[robot.mode]}<small>{robot.jobId ?? `${robot.completedJobs} DONE`}</small></span>
          <span className="route-length"><b>{Math.max(robot.route.length - 1, 0)}</b><small>STEPS</small></span>
          <i className={`state-light ${robot.waitingReason ? "waiting" : robot.jobId ? "active" : "idle"}`} />
        </button>)}
      </div>
    </section>
  );
}

function EventLog({ state }: { state: SimulationState }) {
  return (
    <section className="panel log-panel">
      <div className="panel-heading"><div><p className="eyebrow">SYSTEM TELEMETRY</p><h2>Event stream</h2></div><span className="panel-index">04</span></div>
      <div className="event-list">
        {state.events.length === 0 && <div className="empty-state">AWAITING EVENTS</div>}
        {state.events.slice(0, 30).map((entry) => <div className={`event-row event-${entry.type.toLowerCase()}`} key={entry.id}>
          <time>T+{String(entry.tick).padStart(4, "0")}</time><span>{entry.type}</span><p>{entry.message}</p>
        </div>)}
      </div>
    </section>
  );
}

function SelectionCard({ state, robotId }: { state: SimulationState; robotId: string | null }) {
  const robot = state.robots.find((item) => item.id === robotId);
  if (!robot) return <section className="panel selection-card"><p className="eyebrow">ROUTE INSPECTOR</p><div className="selection-empty"><span>⌖</span><b>SELECT A ROBOT</b><p>Inspect its live assignment, planned path and wait cause.</p></div></section>;
  const job = state.jobs.find((item) => item.id === robot.jobId);
  return <section className="panel selection-card" style={{ "--robot-color": robot.color } as React.CSSProperties}>
    <div className="selection-head"><div className="selection-icon">{robot.name.slice(1)}</div><div><p className="eyebrow">ROUTE INSPECTOR</p><h2>{robot.name}</h2></div><span>{modeName[robot.mode]}</span></div>
    <div className="selection-stats"><div><small>POSITION</small><b>{robot.position.x},{robot.position.y}</b></div><div><small>ROUTE</small><b>{Math.max(robot.route.length - 1, 0)} steps</b></div><div><small>DISTANCE</small><b>{robot.distance}</b></div></div>
    <div className="assignment-line"><small>CURRENT ASSIGNMENT</small><b>{job ? `${job.id} · ${job.shelfId} → ${job.workstationId}` : robot.mode === "RETURNING" ? "RETURN TO BAY" : "NONE"}</b></div>
    <div className={`wait-reason ${robot.waitingReason ? "visible" : ""}`}><small>{robot.waitingReason ? "WHY WAITING" : "MOTION STATUS"}</small><b>{robot.waitingReason ?? (robot.goal ? "Conflict-free route reserved" : "Parked and available")}</b></div>
    <div className="route-preview"><small>NEXT RESERVED CELLS</small><p>{robot.route.slice(0, 8).map((point) => `${point.x}:${point.y}`).join(" → ") || "—"}</p></div>
  </section>;
}

export default App;
