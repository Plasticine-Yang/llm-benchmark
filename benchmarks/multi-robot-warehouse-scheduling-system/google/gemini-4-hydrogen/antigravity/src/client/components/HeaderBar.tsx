import React from 'react';
import {
  Pause,
  Play,
  RotateCcw,
  StepForward,
  Wifi,
  WifiOff,
  Activity,
} from 'lucide-react';
import { SimulationSnapshot } from '../../shared/types';
import { ConnectionState } from '../hooks/useWarehouseSync';

interface HeaderBarProps {
  snapshot: SimulationSnapshot;
  connState: ConnectionState;
  manualOffline: boolean;
  onPause: () => void;
  onResume: () => void;
  onStep: () => void;
  onReset: () => void;
  onSpeedChange: (ms: number) => void;
  onToggleDisconnect: () => void;
}

const SPEED_OPTIONS = [
  { label: '0.5x', ms: 700 },
  { label: '1x', ms: 350 },
  { label: '2x', ms: 175 },
  { label: '4x', ms: 90 },
];

export const HeaderBar: React.FC<HeaderBarProps> = ({
  snapshot,
  connState,
  manualOffline,
  onPause,
  onResume,
  onStep,
  onReset,
  onSpeedChange,
  onToggleDisconnect,
}) => {
  const connLabel =
    connState === 'CONNECTED'
      ? `LIVE · seq #${snapshot.seq}`
      : connState === 'RECONNECTING'
        ? 'RECONNECTING...'
        : connState === 'DISCONNECTED'
          ? `OFFLINE (last seq #${snapshot.seq})`
          : 'CONNECTING...';

  return (
    <header className="header-bar">
      <div className="header-brand">
        <div className="brand-icon">
          <Activity size={18} />
        </div>
        <div>
          <h1 className="brand-title">AegisWMS Fleet Scheduler</h1>
          <div className="brand-meta">
            <span>Seed: <code>{snapshot.seed}</code></span>
            <span className="dot-sep">·</span>
            <span>Tick <strong>#{snapshot.tick}</strong></span>
            <span className="dot-sep">·</span>
            <span>Seq <strong>#{snapshot.seq}</strong></span>
          </div>
        </div>
      </div>

      <div className="header-stats">
        <div className="stat-chip">
          <span className="stat-label">Active</span>
          <span className="stat-value accent-cyan">{snapshot.stats.activeJobs}</span>
        </div>
        <div className="stat-chip">
          <span className="stat-label">Queued</span>
          <span className="stat-value accent-amber">{snapshot.stats.queuedJobs}</span>
        </div>
        <div className="stat-chip">
          <span className="stat-label">Done</span>
          <span className="stat-value accent-green">{snapshot.stats.completedJobs}</span>
        </div>
        <div className="stat-chip">
          <span className="stat-label">Blocked Cells</span>
          <span className="stat-value accent-red">{snapshot.stats.blockedCellsCount}</span>
        </div>
        <div className="stat-chip">
          <span className="stat-label">Replans</span>
          <span className="stat-value">{snapshot.stats.replanCount}</span>
        </div>
      </div>

      <div className="header-controls">
        <div className="btn-group">
          {snapshot.running ? (
            <button
              type="button"
              className="btn btn-warning"
              onClick={onPause}
              title="Pause fixed-step simulation"
            >
              <Pause size={15} />
              <span>Pause</span>
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-primary"
              onClick={onResume}
              title="Resume fixed-step simulation"
            >
              <Play size={15} />
              <span>Resume</span>
            </button>
          )}
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onStep}
            title="Advance simulation by exactly 1 tick"
          >
            <StepForward size={15} />
            <span>Step</span>
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onReset}
            title={`Reset simulation with deterministic seed "${snapshot.seed}"`}
          >
            <RotateCcw size={15} />
            <span>Reset</span>
          </button>
        </div>

        <div className="speed-group" aria-label="Simulation speed">
          {SPEED_OPTIONS.map((opt) => (
            <button
              key={opt.ms}
              type="button"
              className={`speed-btn ${snapshot.tickIntervalMs === opt.ms ? 'active' : ''}`}
              onClick={() => onSpeedChange(opt.ms)}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          className={`conn-pill conn-${connState.toLowerCase()}`}
          onClick={onToggleDisconnect}
          title={
            manualOffline
              ? 'Click to reconnect WebSocket stream and recover snapshot'
              : 'Click to test WebSocket disconnect / reconnect recovery'
          }
        >
          {connState === 'CONNECTED' ? <Wifi size={14} /> : <WifiOff size={14} />}
          <span>{connLabel}</span>
        </button>
      </div>
    </header>
  );
};
