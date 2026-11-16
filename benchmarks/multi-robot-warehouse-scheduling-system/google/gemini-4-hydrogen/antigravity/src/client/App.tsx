import React, { useState } from 'react';
import { AlertCircle, X } from 'lucide-react';
import { JobPriority } from '../shared/types';
import { EventLogPanel } from './components/EventLogPanel';
import { HeaderBar } from './components/HeaderBar';
import { JobComposer } from './components/JobComposer';
import { JobQueuePanel } from './components/JobQueuePanel';
import { RobotFleetPanel } from './components/RobotFleetPanel';
import { WarehouseMap } from './components/WarehouseMap';
import { useWarehouseSync } from './hooks/useWarehouseSync';

export const App: React.FC = () => {
  const {
    snapshot,
    connState,
    manualOffline,
    lastError,
    syncNotice,
    toggleManualDisconnect,
    actions,
  } = useWarehouseSync();

  const [selectedRobotId, setSelectedRobotId] = useState<string | null>(null);
  const [shelfId, setShelfId] = useState<string>('S-08');
  const [workstationId, setWorkstationId] = useState<string>('WS-1');
  const [priority, setPriority] = useState<JobPriority>('NORMAL');
  const [submitting, setSubmitting] = useState(false);

  if (!snapshot) {
    return (
      <div className="loading-screen">
        <div className="loading-card">
          <div className="spinner" />
          <h2>Connecting to AegisWMS Scheduler...</h2>
          <p className="muted">Fetching authoritative warehouse snapshot &amp; sequence stream</p>
        </div>
      </div>
    );
  }

  const handleCreateJob = async () => {
    setSubmitting(true);
    try {
      await actions.createJob(shelfId, workstationId, priority);
    } catch {
      // Error surfaced via lastError
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateDemoBatch = async () => {
    setSubmitting(true);
    try {
      await actions.createDemoBatch();
    } catch {
      // Error surfaced via lastError
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="app-shell">
      <HeaderBar
        snapshot={snapshot}
        connState={connState}
        manualOffline={manualOffline}
        onPause={() => void actions.pause()}
        onResume={() => void actions.resume()}
        onStep={() => void actions.step()}
        onReset={() => void actions.reset(snapshot.seed)}
        onSpeedChange={(ms) => void actions.setSpeed(ms)}
        onToggleDisconnect={toggleManualDisconnect}
      />

      {(lastError || syncNotice) && (
        <div className="banner-strip">
          {lastError && (
            <div className="alert-banner alert-error" role="alert">
              <AlertCircle size={15} />
              <span>{lastError}</span>
              <button
                type="button"
                className="icon-btn"
                onClick={actions.clearError}
                aria-label="Dismiss error"
              >
                <X size={14} />
              </button>
            </div>
          )}
          {syncNotice && (
            <div className="alert-banner alert-sync">
              <span>{syncNotice}</span>
            </div>
          )}
        </div>
      )}

      <main className="dashboard-grid">
        <div className="main-left-col">
          <WarehouseMap
            snapshot={snapshot}
            selectedRobotId={selectedRobotId}
            selectedShelfId={shelfId}
            selectedWorkstationId={workstationId}
            onSelectRobot={setSelectedRobotId}
            onSelectShelf={setShelfId}
            onSelectWorkstation={setWorkstationId}
            onToggleBlockCell={(x, y) => void actions.toggleBlockCell(x, y)}
          />
          <EventLogPanel events={snapshot.events} />
        </div>

        <aside className="main-right-col">
          <JobComposer
            shelves={snapshot.grid.shelves}
            workstations={snapshot.grid.workstations}
            shelfId={shelfId}
            workstationId={workstationId}
            priority={priority}
            onShelfChange={setShelfId}
            onWorkstationChange={setWorkstationId}
            onPriorityChange={setPriority}
            onCreateJob={() => void handleCreateJob()}
            onCreateDemoBatch={() => void handleCreateDemoBatch()}
            submitting={submitting}
          />
          <JobQueuePanel
            jobs={snapshot.jobs}
            robots={snapshot.robots}
            currentTick={snapshot.tick}
            onCancelJob={(id) => void actions.cancelJob(id)}
          />
          <RobotFleetPanel
            robots={snapshot.robots}
            selectedRobotId={selectedRobotId}
            onSelectRobot={setSelectedRobotId}
          />
        </aside>
      </main>
    </div>
  );
};
export default App;
