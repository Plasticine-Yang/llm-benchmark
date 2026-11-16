import React from 'react';
import { Terminal } from 'lucide-react';
import { SimEvent } from '../../shared/types';

interface EventLogPanelProps {
  events: SimEvent[];
}

export const EventLogPanel: React.FC<EventLogPanelProps> = ({ events }) => {
  const ordered = [...events].reverse();

  return (
    <section className="panel log-panel">
      <div className="panel-header">
        <div className="panel-title-group">
          <Terminal size={16} className="panel-icon" />
          <h2 className="panel-title">Scheduler &amp; Replan Event Log</h2>
          <span className="count-pill">{events.length}</span>
        </div>
        <span className="panel-subtitle">Authoritative server sequence stream</span>
      </div>

      <div className="panel-scroll log-list">
        {ordered.length === 0 ? (
          <div className="empty-state">Waiting for simulation events...</div>
        ) : (
          ordered.map((ev) => (
            <div key={ev.id} className={`log-row log-${ev.severity}`}>
              <span className="mono log-seq">seq#{ev.seq}</span>
              <span className="mono log-tick">t{ev.tick}</span>
              <span className={`log-kind kind-${ev.severity}`}>{ev.kind}</span>
              <span className="log-msg">{ev.message}</span>
            </div>
          ))
        )}
      </div>
    </section>
  );
};
