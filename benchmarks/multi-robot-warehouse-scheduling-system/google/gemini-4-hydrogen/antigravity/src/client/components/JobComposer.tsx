import React from 'react';
import { PlusCircle, Sparkles } from 'lucide-react';
import { JobPriority, ShelfInfo, WorkstationInfo } from '../../shared/types';

interface JobComposerProps {
  shelves: ShelfInfo[];
  workstations: WorkstationInfo[];
  shelfId: string;
  workstationId: string;
  priority: JobPriority;
  onShelfChange: (id: string) => void;
  onWorkstationChange: (id: string) => void;
  onPriorityChange: (p: JobPriority) => void;
  onCreateJob: () => void;
  onCreateDemoBatch: () => void;
  submitting: boolean;
}

const PRIORITIES: JobPriority[] = ['LOW', 'NORMAL', 'HIGH', 'URGENT'];

export const JobComposer: React.FC<JobComposerProps> = ({
  shelves,
  workstations,
  shelfId,
  workstationId,
  priority,
  onShelfChange,
  onWorkstationChange,
  onPriorityChange,
  onCreateJob,
  onCreateDemoBatch,
  submitting,
}) => {
  return (
    <section className="panel composer-panel">
      <div className="panel-header">
        <div className="panel-title-group">
          <PlusCircle size={16} className="panel-icon" />
          <h2 className="panel-title">Create Transport Job</h2>
        </div>
        <button
          type="button"
          className="btn btn-xs btn-primary-soft"
          onClick={onCreateDemoBatch}
          disabled={submitting}
          title="Dispatch 3 simultaneous jobs across bottleneck aisles"
        >
          <Sparkles size={13} />
          <span>+3 Concurrent Jobs</span>
        </button>
      </div>

      <form
        className="composer-form"
        onSubmit={(e) => {
          e.preventDefault();
          onCreateJob();
        }}
      >
        <div className="form-row">
          <label className="form-field">
            <span>Source Shelf</span>
            <select
              value={shelfId}
              onChange={(e) => onShelfChange(e.target.value)}
            >
              {shelves.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.id} · {s.sku} ({s.zone})
                </option>
              ))}
            </select>
          </label>

          <label className="form-field">
            <span>Workstation</span>
            <select
              value={workstationId}
              onChange={(e) => onWorkstationChange(e.target.value)}
            >
              {workstations.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.id} · {w.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="form-actions-row">
          <div className="priority-pills" role="group" aria-label="Job priority">
            {PRIORITIES.map((p) => (
              <button
                key={p}
                type="button"
                className={`prio-pill prio-${p.toLowerCase()} ${priority === p ? 'active' : ''}`}
                onClick={() => onPriorityChange(p)}
              >
                {p}
              </button>
            ))}
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitting}
          >
            Dispatch Job
          </button>
        </div>
      </form>
    </section>
  );
};
