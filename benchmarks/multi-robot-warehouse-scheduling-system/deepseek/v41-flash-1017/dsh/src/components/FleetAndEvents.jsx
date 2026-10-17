import { useMemo } from 'react';
import { formatClock, formatTick, priorityOf, robotStatus, WAIT_LABEL } from '../format';

export function FleetPanel({ state, selectedRobotId, onSelectRobot }) {
  const activeJobs = useMemo(() => {
    const map = new Map();
    for (const job of state.jobs) {
      if ((job.status === 'assigned' || job.status === 'loaded') && job.robotId) map.set(job.robotId, job);
    }
    return map;
  }, [state.jobs]);

  return (
    <section className="panel fleet-panel" aria-labelledby="fleet-title">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">AUTONOMOUS FLEET</span>
          <h2 id="fleet-title">Robot states</h2>
        </div>
        <div className="heading-metrics">
          <span><b>{state.stats.activeRobots}</b> active</span>
          <span className={state.stats.waitingRobots > 0 ? 'warn-text' : ''}><b>{state.stats.waitingRobots}</b> held</span>
        </div>
      </div>
      <div className="fleet-list scroll-area">
        {state.robots.map((robot) => {
          const status = robotStatus(robot);
          const job = activeJobs.get(robot.id);
          const priority = job ? priorityOf(job.priority) : null;
          const selected = robot.id === selectedRobotId;
          return (
            <button
              type="button"
              key={robot.id}
              className={`fleet-row ${selected ? 'is-selected' : ''} ${robot.waiting ? 'is-waiting' : ''}`}
              onClick={() => onSelectRobot(robot.id)}
              aria-pressed={selected}
            >
              <span className="fleet-identity">
                <span className="robot-swatch" style={{ background: robot.color }} />
                <span className="fleet-id-stack">
                  <strong>{robot.id}</strong>
                  <em>{robot.name}</em>
                </span>
              </span>
              <span className="fleet-main">
                <span className="fleet-main-top">
                  <span className={`status-pill ${status.tone}`}>{status.label}</span>
                  {robot.jobId ? (
                    <span className="fleet-job">
                      {job ? `${job.shelfId} → ${job.workstationId}` : robot.jobId}
                      {priority ? <i className={`mini-priority ${priority.tone}`}>{priority.short}</i> : null}
                    </span>
                  ) : robot.status === 'returning' ? (
                    <span className="fleet-job">RETURN TO BAY</span>
                  ) : (
                    <span className="fleet-job muted">AT BAY</span>
                  )}
                  <span className="fleet-coord">{robot.x},{robot.y}</span>
                </span>
                {robot.waitReason ? (
                  <span className="fleet-wait" title={robot.waitReason}>
                    <i>{robot.waitCode ? WAIT_LABEL[robot.waitCode] ?? robot.waitCode : 'HOLD'}</i>
                    {robot.waitReason}
                  </span>
                ) : (
                  <span className="fleet-sub">
                    {robot.route.length > 1 ? (
                      <>route claim · {robot.route.length - 1}t</>
                    ) : (
                      <>completed {robot.completedJobs} · travelled {robot.distanceTravelled}</>
                    )}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>
      <div className="panel-footer">
        <span>Priority dispatch · aging safeguard</span>
        <span>{state.stats.idleRobots} idle</span>
      </div>
    </section>
  );
}

export function EventLogPanel({ state }) {
  const events = useMemo(() => [...state.events].slice(-140).reverse(), [state.events]);
  return (
    <section className="panel log-panel" aria-labelledby="log-title">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">AUTHORITATIVE TIMELINE</span>
          <h2 id="log-title">Event log</h2>
        </div>
        <span className="live-tag"><i /> stream</span>
      </div>
      <div className="event-list scroll-area" role="log" aria-live="polite">
        {events.length === 0 ? (
          <div className="empty-state compact">
            <strong>Waiting for events</strong>
          </div>
        ) : (
          events.map((event) => (
            <div className={`event-row event-${event.type}`} key={event.id}>
              <div className="event-gutter">
                <span className="event-dot" />
                <span className="event-tick">{formatTick(event.tick)}</span>
                <span className="event-time">{formatClock(event.at)}</span>
              </div>
              <div className="event-content">
                <div className="event-type-line">
                  <span className="event-type">{event.type}</span>
                  {event.robotId ? <span className="event-ref">{event.robotId}</span> : null}
                  {event.jobId ? <span className="event-ref">{event.jobId}</span> : null}
                </div>
                <p>{event.message}</p>
              </div>
            </div>
          ))
        )}
      </div>
      <div className="panel-footer">
        <span>newest first · {state.events.length} retained</span>
        <span>seq {state.seq}</span>
      </div>
    </section>
  );
}
