import React from 'react';
import { SyncStatus } from '../hooks/useSpreadsheet.js';

interface ToolbarProps {
  rows: number;
  cols: number;
  revision: number;
  syncStatus: SyncStatus;
  syncError: string | null;
  undoCount: number;
  redoCount: number;
  activeCellsCount: number;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  onLoadSample: () => void;
  onRetrySync: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  rows,
  cols,
  revision,
  syncStatus,
  syncError,
  undoCount,
  redoCount,
  activeCellsCount,
  onUndo,
  onRedo,
  onClear,
  onLoadSample,
  onRetrySync,
}) => {
  return (
    <header className="toolbar">
      <div className="toolbar-left">
        <div className="brand">
          <span className="brand-icon" aria-hidden="true">
            fx
          </span>
          <div>
            <h1 className="brand-title">Reactive Spreadsheet Engine</h1>
            <span className="brand-subtitle">
              {rows} × {cols} Grid · {activeCellsCount} active cell
              {activeCellsCount === 1 ? '' : 's'}
            </span>
          </div>
        </div>

        <div className="legend" aria-label="Dependency highlighting legend">
          <span className="legend-item">
            <span className="legend-swatch swatch-selected" />
            Selected
          </span>
          <span className="legend-item">
            <span className="legend-swatch swatch-ref" />
            Referenced (Inputs)
          </span>
          <span className="legend-item">
            <span className="legend-swatch swatch-dep" />
            Dependents (Outputs)
          </span>
          <span className="legend-item">
            <span className="legend-swatch swatch-error" />
            Error / Cycle
          </span>
        </div>
      </div>

      <div className="toolbar-actions">
        <div className="btn-group">
          <button
            type="button"
            className="btn"
            onClick={onUndo}
            disabled={undoCount === 0}
            title="Undo (Ctrl+Z / Cmd+Z)"
            data-testid="undo-button"
          >
            ↶ Undo
            {undoCount > 0 && <span className="btn-badge">{undoCount}</span>}
          </button>
          <button
            type="button"
            className="btn"
            onClick={onRedo}
            disabled={redoCount === 0}
            title="Redo (Ctrl+Y / Cmd+Shift+Z)"
            data-testid="redo-button"
          >
            ↷ Redo
            {redoCount > 0 && <span className="btn-badge">{redoCount}</span>}
          </button>
        </div>

        <div className="btn-group">
          <button
            type="button"
            className="btn"
            onClick={onLoadSample}
            title="Populate a multi-level demo workbook"
            data-testid="sample-button"
          >
            Load Sample
          </button>
          <button
            type="button"
            className="btn btn-danger-subtle"
            onClick={onClear}
            disabled={activeCellsCount === 0}
            title="Clear all cells (undoable)"
            data-testid="clear-button"
          >
            Clear
          </button>
        </div>

        <div
          className={`sync-pill sync-${syncStatus}`}
          title={syncError ?? `Backend workbook revision #${revision}`}
          data-testid="sync-status"
        >
          <span className="sync-dot" />
          {syncStatus === 'loading' && 'Loading…'}
          {syncStatus === 'saving' && 'Saving…'}
          {syncStatus === 'saved' && `Saved · rev ${revision}`}
          {syncStatus === 'error' && (
            <>
              <span>Sync failed</span>
              <button
                type="button"
                className="sync-retry"
                onClick={onRetrySync}
              >
                Retry
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
