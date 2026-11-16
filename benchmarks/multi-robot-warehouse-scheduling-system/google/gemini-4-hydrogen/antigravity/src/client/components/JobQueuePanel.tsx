import React, { useState } from 'react';
import { ListOrdered, X } from 'lucide-react';
import { RobotState, TransportJob } from '../../shared/types';

interface JobQueuePanelProps {
  jobs: TransportJob[];
  robots: RobotState[];
  currentTick: number;
  onCancelJob: (jobId: string) => void;
}

export const JobQueuePanel: React.FC<JobQueuePanelProps> = ({
  jobs,
  robots,
  currentTick,
  onCancelJob,
}) => {
  const [filter, setFilter] = useState<'ACTIVE' | 'ALL'>('ACTIVE');

  const robotMap = new Map(robots.map((r) => [r.id, r]));

  const filtered = jobs
    .filter((j) =>
      filter === 'ACTIVE' ? j.status !== 'COMPLETED' && j.status !== 'CANCELLED' : true
    )
    .sort((a, b) => {
      // Queued & active first, sorted by effectiveScore desc; completed at bottom
      const aDone = a.status === 'COMPLETED' || a.status === 'CANCELLED';
      const bDone = b.status === 'COMPLETED' || b.status === 'CANCELLED';
      if (aDone !== bDone) return aDone ? 1 : -1;
      if (!aDone && b.effectiveScore !== a.effectiveScore) {
        return b.effectiveScore - a.effectiveScore;
      }
      return b.createdTick - a.createdTick;
    });

  return (
    <section className="panel queue-panel">
      <div className="panel-header">
        <div className="panel-title-group">
          <ListOrdered size={16} className="panel-icon" />
          <h2 className="panel-title">Job Queue</h2>
          <span className="count-pill">{jobs.length}</span>
        </div>
        <div className="filter-tabs">
          <button
            type="button"
            className={`tab-btn ${filter === 'ACTIVE' ? 'active' : ''}`}
            onClick={() => setFilter('ACTIVE')}
          >
            Active
          </button>
          <button
            type="button"
            className={`tab-btn ${filter === 'ALL' ? 'active' : ''}`}
            onClick={() => setFilter('ALL')}
          >
            All
          </button>
        </div>
      </div>

      <div className="panel-scroll queue-list">
        {filtered.length === 0 ? (
          <div className="empty-state">
            {filter === 'ACTIVE'
              ? 'No active or queued jobs. Create a job above or click "+3 Concurrent Jobs".'
              : 'No jobs dispatched yet.'}
          </div>
        ) : (
          filtered.map((job) => {
            const robot = job.assignedRobotId ? robotMap.get(job.assignedRobotId) : null;
            const waitAge =
              job.status === 'QUEUED' ? Math.max(0, currentTick - job.createdTick) : null;
            return (
              <div key={job.id} className={`job-row job-status-${job.status.toLowerCase()}`}>
                <div className="job-row-main">
                  <span className="mono job-id">{job.id}</span>
                  <span className={`prio-badge prio-${job.priority.toLowerCase()}`}>
                    {job.priority}
                  </span>
                  <span className="job-route">
                    <strong>{job.shelfId}</strong> → <strong>{job.workstationId}</strong>
                  </span>
                  <span className={`status-pill status-${job.status.toLowerCase()}`}>
                    {job.status}
                  </span>
                </div>

                <div className="job-row-meta">
                  <span>
                    {robot ? (
                      <span className="robot-chip">
                        <i className="robot-dot" style={{ backgroundColor: robot.color }} />
                        {robot.id}
                      </span>
                    ) : (
                      <span className="muted">Unassigned</span>
                    )}
                  </span>
                  <span className="muted mono">
                    score:{job.effectiveScore}
                    {waitAge !== null ? ` · wait:${waitAge}t` : ''}
                    {job.completedTick !== null ? ` · done@t${job.completedTick}` : ''}
                  </span>
                  {job.status === 'QUEUED' && (
                    <button
                      type="button"
                      className="icon-btn"
                      title="Cancel queued job"
                      onClick={() => onCancelJob(job.id)}
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
};
