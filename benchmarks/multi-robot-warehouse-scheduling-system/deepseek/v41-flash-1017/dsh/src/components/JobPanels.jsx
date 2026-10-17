import { useEffect, useMemo, useState } from 'react';
import { formatJobStatus, formatTick, priorityOf } from '../format';

export function DispatchConsole({ state, onCreate, pending }) {
  const { warehouse, jobs } = state;
  const [shelfId, setShelfId] = useState(warehouse.shelves[0]?.id ?? '');
  const [workstationId, setWorkstationId] = useState(warehouse.workstations[0]?.id ?? '');
  const [priority, setPriority] = useState(2);

  useEffect(() => {
    if (!warehouse.shelves.some((shelf) => shelf.id === shelfId)) {
      setShelfId(warehouse.shelves[0]?.id ?? '');
    }
    if (!warehouse.workstations.some((station) => station.id === workstationId)) {
      setWorkstationId(warehouse.workstations[0]?.id ?? '');
    }
  }, [warehouse, shelfId, workstationId]);

  const shelf = warehouse.shelves.find((candidate) => candidate.id === shelfId);
  const station = warehouse.workstations.find((candidate) => candidate.id === workstationId);
  const queued = jobs.filter((job) => job.status === 'queued').length;
  const busy = pending !== null;

  const submit = async (event) => {
    event.preventDefault();
    if (!shelf || !station) return;
    await onCreate({ shelfId: shelf.id, workstationId: station.id, priority });
  };

  return (
    <section className="panel dispatch-panel" aria-labelledby="dispatch-title">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">TRANSPORT REQUEST</span>
          <h2 id="dispatch-title">Dispatch console</h2>
        </div>
        <span className="queue-count">{queued} queued</span>
      </div>
      <form className="dispatch-form" onSubmit={submit}>
        <label className="field">
          <span className="field-label">Source shelf</span>
          <span className="select-wrap">
            <select value={shelfId} onChange={(event) => setShelfId(event.target.value)} disabled={busy}>
              {warehouse.shelves.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.id} · Rack {option.rack} / Row {option.row}
                </option>
              ))}
            </select>
          </span>
        </label>

        <label className="field">
          <span className="field-label">Destination</span>
          <span className="select-wrap">
            <select
              value={workstationId}
              onChange={(event) => setWorkstationId(event.target.value)}
              disabled={busy}
            >
              {warehouse.workstations.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.id} · {option.name}
                </option>
              ))}
            </select>
          </span>
        </label>

        <fieldset className="priority-field">
          <legend className="field-label">Priority</legend>
          <div className="priority-options">
            {[1, 2, 3].map((level) => (
              <button
                type="button"
                key={level}
                className={`priority-option ${priority === level ? 'selected' : ''} ${priorityOf(level).tone}`}
                onClick={() => setPriority(level)}
                aria-pressed={priority === level}
                disabled={busy}
              >
                {priorityOf(level).label}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="route-preview">
          <div>
            <span className="route-coord">
              {shelf ? `${shelf.id} · ${shelf.x},${shelf.y}` : '—'}
            </span>
            <span className="route-caption">pickup {shelf ? `${shelf.pickup.x},${shelf.pickup.y}` : '—'}</span>
          </div>
          <span className="route-arrow" aria-hidden="true">
            <span />
            <svg width="12" height="8" viewBox="0 0 12 8"><path d="M0 4h10M7 1l3 3-3 3" fill="none" stroke="currentColor" strokeWidth="1.3" /></svg>
          </span>
          <div>
            <span className="route-coord">
              {station ? `${station.id} · ${station.x},${station.y}` : '—'}
            </span>
            <span className="route-caption">{station?.name ?? 'workstation'}</span>
          </div>
          <span className="auto-assign">AUTO-ASSIGN</span>
        </div>

        <button className="primary-button dispatch-button" type="submit" disabled={busy || !shelf || !station}>
          <svg width="15" height="15" viewBox="0 0 16 16" aria-hidden="true">
            <path d="M2 8h9M8 4l4 4-4 4M13 2v12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {pending === 'create-job' ? 'Dispatching…' : 'Create transport job'}
        </button>
        <p className="form-note">
          The scheduler selects the nearest available robot. Priority 3 is served first; every job ages after {state.config.agingTicks} ticks.
        </p>
      </form>
    </section>
  );
}

function JobCard({ job, robot, onSelectRobot }) {
  const priority = priorityOf(job.priority);
  const status = formatJobStatus(job);
  const isQueued = job.status === 'queued';
  const isLoaded = job.status === 'loaded';
  const isCompleted = job.status === 'completed';
  const progress = isCompleted ? 3 : isLoaded ? 2 : job.status === 'assigned' ? 1 : 0;
  return (
    <article className={`job-card ${isQueued ? 'is-queued' : ''} ${isCompleted ? 'is-completed' : ''}`}>
      <div className="job-topline">
        <div className="job-id-row">
          <span className={`priority-rail ${priority.tone}`} aria-hidden="true" />
          <strong>{job.id}</strong>
          <span className={`priority-badge ${priority.tone}`}>{priority.label}</span>
        </div>
        <span className={`job-status ${status.tone}`}>
          {job.waitCode && !isCompleted ? <span className="status-warning-dot" /> : null}
          {status.label}
        </span>
      </div>

      <div className="job-route">
        <div className="job-node">
          <span className="job-node-dot shelf" />
          <strong>{job.shelfId}</strong>
          <span>{job.pickup.x},{job.pickup.y}</span>
        </div>
        <span className="job-route-line" aria-hidden="true">
          <i className="done" />
          <i className={progress >= 2 ? 'done' : ''} />
          <i className={progress >= 3 ? 'done' : ''} />
        </span>
        <div className="job-node align-right">
          <span className="job-node-dot station" />
          <strong>{job.workstationId}</strong>
          <span>{job.workstationName}</span>
        </div>
      </div>

      <div className="job-meta">
        {job.robotId ? (
          <button
            type="button"
            className="robot-chip"
            onClick={() => onSelectRobot(job.robotId)}
            title={`Select ${job.robotId}`}
          >
            <span style={{ background: robot?.color ?? '#8ba0b4' }} />
            {job.robotId} {robot?.name ?? ''}
          </button>
        ) : (
          <span className="robot-chip is-unassigned">UNASSIGNED</span>
        )}
        <span className="job-age">
          {isCompleted
            ? `done T${job.completedAtTick}`
            : isQueued
              ? `waited ${job.waitTicks}t${job.aged ? ' · AGED' : ''}`
              : `queue ${job.queueWaitTicks ?? 0}t`}
        </span>
      </div>

      {isCompleted ? (
        <div className="job-reason is-muted">Delivered to {job.workstationName} · {Math.max(0, (job.completedAtTick ?? 0) - job.createdAtTick)}t end-to-end.</div>
      ) : job.reason ? (
        <div className={`job-reason ${isQueued ? '' : 'is-active-reason'}`}>{job.reason}</div>
      ) : null}
    </article>
  );
}

export function JobQueuePanel({ state, selectedRobotId, onSelectRobot }) {
  const robotsById = useMemo(
    () => new Map(state.robots.map((robot) => [robot.id, robot])),
    [state.robots],
  );
  const jobs = useMemo(() => {
    const statusRank = { loaded: 0, assigned: 1, queued: 2, completed: 3 };
    return [...state.jobs].sort((a, b) => {
      const rank = statusRank[a.status] - statusRank[b.status];
      if (rank !== 0) return rank;
      if (a.status === 'completed') return (b.completedAtTick ?? 0) - (a.completedAtTick ?? 0);
      if (a.status === 'queued') {
        if (b.priority !== a.priority) return b.priority - a.priority;
        return (b.waitTicks ?? 0) - (a.waitTicks ?? 0);
      }
      return a.createdAtTick - b.createdAtTick;
    });
  }, [state.jobs]);

  const active = state.stats.activeJobs;
  const queued = state.stats.queuedJobs;

  return (
    <section className="panel queue-panel" aria-labelledby="queue-title">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">SCHEDULER</span>
          <h2 id="queue-title">Job queue</h2>
        </div>
        <div className="heading-metrics">
          <span><b>{active}</b> active</span>
          <span><b>{queued}</b> waiting</span>
        </div>
      </div>
      <div className="job-list scroll-area">
        {jobs.length === 0 ? (
          <div className="empty-state">
            <span className="empty-glyph">⌁</span>
            <strong>No transport jobs</strong>
            <p>Create a job above. The scheduler auto-assigns the nearest free robot.</p>
          </div>
        ) : (
          jobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              robot={robotsById.get(job.robotId)}
              onSelectRobot={onSelectRobot}
            />
          ))
        )}
      </div>
      <div className="panel-footer">
        <span>{formatTick(state.tick)} · aging safeguard {state.config.agingTicks}t</span>
        <span>{state.stats.completedJobs} delivered</span>
      </div>
    </section>
  );
}
