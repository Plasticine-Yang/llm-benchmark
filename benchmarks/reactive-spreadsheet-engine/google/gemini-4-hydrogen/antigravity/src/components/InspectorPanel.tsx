import React from 'react';
import { CellSnapshot, RecalcResult } from '../../shared/types.js';
import { HistoryEntry } from '../hooks/useSpreadsheet.js';

interface InspectorPanelProps {
  activeId: string;
  snapshot: CellSnapshot;
  directReferences: string[];
  indirectReferences: string[];
  directDependents: string[];
  indirectDependents: string[];
  getCellSnapshot: (id: string) => CellSnapshot;
  lastRecalc: RecalcResult | null;
  lastActionLabel: string;
  undoStack: HistoryEntry[];
  redoStack: HistoryEntry[];
  onJumpToCell: (id: string) => void;
}

export const InspectorPanel: React.FC<InspectorPanelProps> = ({
  activeId,
  snapshot,
  directReferences,
  indirectReferences,
  directDependents,
  indirectDependents,
  getCellSnapshot,
  lastRecalc,
  lastActionLabel,
  undoStack,
  redoStack,
  onJumpToCell,
}) => {
  const renderCellChip = (id: string, variant: 'ref' | 'ref-indirect' | 'dep' | 'dep-indirect') => {
    const snap = getCellSnapshot(id);
    const valLabel = snap.valueType === 'empty' ? '∅' : snap.display;
    return (
      <button
        key={id}
        type="button"
        className={`dep-chip chip-${variant} ${snap.error ? 'chip-has-error' : ''}`}
        onClick={() => onJumpToCell(id)}
        title={snap.raw ? `${id}: ${snap.raw} → ${valLabel}` : `${id} (empty)`}
      >
        <span className="chip-id">{id}</span>
        <span className="chip-val">{valLabel}</span>
      </button>
    );
  };

  return (
    <aside className="inspector-panel" aria-label="Cell and dependency inspector">
      <section className="inspector-card">
        <div className="card-header">
          <h2>Cell Inspector · {activeId}</h2>
          <span className={`type-pill type-${snapshot.error ? 'error' : snapshot.valueType}`}>
            {snapshot.error ? snapshot.error : snapshot.isFormula ? 'formula' : snapshot.valueType}
          </span>
        </div>

        <dl className="kv-list">
          <div className="kv-row">
            <dt>Raw Input</dt>
            <dd className="mono" data-testid="inspector-raw">
              {snapshot.raw !== '' ? snapshot.raw : <span className="muted">(empty)</span>}
            </dd>
          </div>
          <div className="kv-row">
            <dt>Computed</dt>
            <dd
              className={`mono ${snapshot.error ? 'text-error' : ''}`}
              data-testid="inspector-computed"
            >
              {snapshot.valueType === 'empty' ? (
                <span className="muted">—</span>
              ) : (
                snapshot.display
              )}
            </dd>
          </div>
        </dl>

        {snapshot.error && (
          <div className="error-box" data-testid="inspector-error-detail">
            <div className="error-box-title">
              {snapshot.error} {snapshot.inCycle ? '(Cycle Participant)' : ''}
            </div>
            <div className="error-box-desc">{snapshot.errorDetail}</div>
            {snapshot.cyclePath && snapshot.cyclePath.length > 0 && (
              <div className="cycle-path">
                {snapshot.cyclePath.map((cid, idx) => (
                  <React.Fragment key={`${cid}-${idx}`}>
                    {idx > 0 && <span className="cycle-arrow">→</span>}
                    <button
                      type="button"
                      className="cycle-node"
                      onClick={() => onJumpToCell(cid)}
                    >
                      {cid}
                    </button>
                  </React.Fragment>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      <section className="inspector-card">
        <div className="card-header">
          <h2>Dependencies</h2>
          <span className="muted-count">
            {directReferences.length} in · {directDependents.length} out
          </span>
        </div>

        <div className="dep-section">
          <div className="dep-label">
            <span className="dot dot-ref" />
            References (reads from)
          </div>
          {directReferences.length === 0 && indirectReferences.length === 0 ? (
            <p className="empty-note">No upstream references</p>
          ) : (
            <div className="chip-grid" data-testid="inspector-references">
              {directReferences.map((id) => renderCellChip(id, 'ref'))}
              {indirectReferences.map((id) => renderCellChip(id, 'ref-indirect'))}
            </div>
          )}
        </div>

        <div className="dep-section">
          <div className="dep-label">
            <span className="dot dot-dep" />
            Dependents (updates when {activeId} changes)
          </div>
          {directDependents.length === 0 && indirectDependents.length === 0 ? (
            <p className="empty-note">No downstream dependents</p>
          ) : (
            <div className="chip-grid" data-testid="inspector-dependents">
              {directDependents.map((id) => renderCellChip(id, 'dep'))}
              {indirectDependents.map((id) => renderCellChip(id, 'dep-indirect'))}
            </div>
          )}
        </div>
      </section>

      <section className="inspector-card">
        <div className="card-header">
          <h2>Reactive Engine Trace</h2>
        </div>
        <div className="trace-action">{lastActionLabel}</div>
        {lastRecalc ? (
          <div className="trace-metrics" data-testid="recalc-trace">
            <div className="trace-stat">
              <span className="stat-val">{lastRecalc.recalculatedIds.length}</span>
              <span className="stat-lbl">cells recalculated</span>
            </div>
            <div className="trace-stat">
              <span className="stat-val">{lastRecalc.durationMs.toFixed(2)} ms</span>
              <span className="stat-lbl">eval time</span>
            </div>
            {lastRecalc.recalculatedIds.length > 0 && (
              <div className="trace-cells">
                Order:{' '}
                <span className="mono">
                  {lastRecalc.recalculatedIds.slice(0, 14).join(' → ')}
                  {lastRecalc.recalculatedIds.length > 14
                    ? ` (+${lastRecalc.recalculatedIds.length - 14} more)`
                    : ''}
                </span>
              </div>
            )}
          </div>
        ) : (
          <p className="empty-note">Edit any cell to trace incremental recalculation.</p>
        )}
      </section>

      <section className="inspector-card">
        <div className="card-header">
          <h2>History Stack</h2>
          <span className="muted-count">
            {undoStack.length} undo · {redoStack.length} redo
          </span>
        </div>
        {undoStack.length === 0 ? (
          <p className="empty-note">No edits recorded yet (retains up to 100 edits).</p>
        ) : (
          <ul className="history-list">
            {undoStack
              .slice(-6)
              .reverse()
              .map((item) => (
                <li key={item.id} className="history-item">
                  <span>{item.label}</span>
                  <span className="history-time">{item.timestamp}</span>
                </li>
              ))}
          </ul>
        )}
      </section>

      <section className="inspector-card shortcuts-card">
        <div className="card-header">
          <h2>Shortcuts &amp; Formulas</h2>
        </div>
        <div className="shortcut-grid">
          <span>
            <kbd>Enter</kbd> / <kbd>F2</kbd>
          </span>
          <span>Edit / Commit cell</span>
          <span>
            <kbd>Arrows</kbd> / <kbd>Tab</kbd>
          </span>
          <span>Navigate cells</span>
          <span>
            <kbd>Ctrl/Cmd</kbd>+<kbd>C</kbd>/<kbd>V</kbd>
          </span>
          <span>Copy / Paste (shifts refs)</span>
          <span>
            <kbd>Ctrl/Cmd</kbd>+<kbd>Z</kbd>/<kbd>Y</kbd>
          </span>
          <span>Undo / Redo</span>
        </div>
        <div className="formula-examples mono">
          =A1+B2*3 · =(A1+B1)/C1 · =SUM(A1:A5) · =AVG(B1:B5)
        </div>
      </section>
    </aside>
  );
};
