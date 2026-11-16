import React from 'react';
import { Bot, AlertTriangle, Clock } from 'lucide-react';
import { RobotState } from '../../shared/types';

interface RobotFleetPanelProps {
  robots: RobotState[];
  selectedRobotId: string | null;
  onSelectRobot: (id: string | null) => void;
}

export const RobotFleetPanel: React.FC<RobotFleetPanelProps> = ({
  robots,
  selectedRobotId,
  onSelectRobot,
}) => {
  return (
    <section className="panel fleet-panel">
      <div className="panel-header">
        <div className="panel-title-group">
          <Bot size={16} className="panel-icon" />
          <h2 className="panel-title">Robot Fleet Status</h2>
          <span className="count-pill">{robots.length}</span>
        </div>
        <span className="panel-subtitle">Click a robot to focus its route</span>
      </div>

      <div className="panel-scroll fleet-list">
        {robots.map((robot) => {
          const isSelected = selectedRobotId === robot.id;
          const remainingSteps = Math.max(0, robot.plannedPath.length - 1);
          const isAlert = robot.status === 'BLOCKED';
          const isWait = robot.status === 'WAITING';

          return (
            <div
              key={robot.id}
              className={`robot-card ${isSelected ? 'selected' : ''} ${isAlert ? 'is-blocked' : isWait ? 'is-waiting' : ''}`}
              onClick={() => onSelectRobot(isSelected ? null : robot.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectRobot(isSelected ? null : robot.id);
                }
              }}
            >
              <div className="robot-card-top">
                <div className="robot-identity">
                  <span className="robot-dot" style={{ backgroundColor: robot.color }} />
                  <strong className="mono">{robot.id}</strong>
                  <span className="mono muted">
                    ({robot.pos.x},{robot.pos.y})
                  </span>
                </div>
                <span className={`status-pill robot-status-${robot.status.toLowerCase()}`}>
                  {robot.status}
                </span>
              </div>

              <div className="robot-card-mid">
                {robot.currentJobId ? (
                  <span>
                    Job <strong className="mono">{robot.currentJobId}</strong> ·{' '}
                    {robot.targetShelfId} → {robot.targetWorkstationId}
                    {robot.carryingShelfId ? ' [CARGO]' : ''}
                  </span>
                ) : (
                  <span className="muted">
                    {robot.phase === 'RETURNING' ? 'Returning to staging bay' : 'Standby at bay'}
                  </span>
                )}
                <span className="mono muted">
                  {remainingSteps > 0 ? `${remainingSteps} steps` : '—'} · done:{robot.completedJobs}
                </span>
              </div>

              {robot.waitReason && (
                <div
                  className={`robot-reason ${isAlert ? 'reason-alert' : isWait ? 'reason-warn' : 'reason-info'}`}
                >
                  {isAlert ? <AlertTriangle size={12} /> : <Clock size={12} />}
                  <span>{robot.waitReason}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};
