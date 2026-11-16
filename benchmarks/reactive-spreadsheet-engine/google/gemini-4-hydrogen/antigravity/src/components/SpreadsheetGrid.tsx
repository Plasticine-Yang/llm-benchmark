import React, { useEffect, useRef } from 'react';
import { formatCellId } from '../../shared/coords.js';
import { CellCoord, CellSnapshot } from '../../shared/types.js';
import { SelectionRect } from '../hooks/useSpreadsheet.js';

interface SpreadsheetGridProps {
  gridContainerRef: React.RefObject<HTMLDivElement | null>;
  rows: number;
  cols: number;
  columnLabels: string[];
  activeCell: CellCoord;
  activeId: string;
  selectionRect: SelectionRect;
  editingCell: string | null;
  draftValue: string;
  directReferences: Set<string>;
  indirectReferences: Set<string>;
  directDependents: Set<string>;
  indirectDependents: Set<string>;
  getCellSnapshot: (id: string) => CellSnapshot;
  onDraftChange: (val: string) => void;
  onSelectCoord: (coord: CellCoord, extend?: boolean) => void;
  onStartEdit: (cellId?: string, initialDraft?: string) => void;
  onCommit: (moveDelta?: { dCol: number; dRow: number }) => void;
  onCancel: () => void;
  onDeleteSelection: () => void;
  onCopy: (isCut?: boolean) => void;
  onPaste: (externalText?: string) => Promise<void>;
  onUndo: () => void;
  onRedo: () => void;
}

export const SpreadsheetGrid: React.FC<SpreadsheetGridProps> = ({
  gridContainerRef,
  rows,
  cols,
  columnLabels,
  activeCell,
  activeId,
  selectionRect,
  editingCell,
  draftValue,
  directReferences,
  indirectReferences,
  directDependents,
  indirectDependents,
  getCellSnapshot,
  onDraftChange,
  onSelectCoord,
  onStartEdit,
  onCommit,
  onCancel,
  onDeleteSelection,
  onCopy,
  onPaste,
  onUndo,
  onRedo,
}) => {
  const inlineInputRef = useRef<HTMLInputElement | null>(null);
  const isDraggingRef = useRef(false);
  const cancelingRef = useRef(false);
  const committedViaKeyRef = useRef(false);

  useEffect(() => {
    const handleMouseUp = () => {
      isDraggingRef.current = false;
    };
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, []);

  useEffect(() => {
    if (!editingCell) return;
    const activeEl = document.activeElement as HTMLElement | null;
    if (activeEl?.dataset?.formulaBar === 'true') {
      return;
    }
    const input = inlineInputRef.current;
    if (input) {
      input.focus();
      const len = input.value.length;
      input.setSelectionRange(len, len);
    }
  }, [editingCell]);

  // Keep active cell scrolled into view on keyboard navigation
  useEffect(() => {
    if (editingCell) return;
    const container = gridContainerRef.current;
    if (!container) return;
    const cellEl = container.querySelector(
      `[data-cell-id="${activeId}"]`
    ) as HTMLElement | null;
    cellEl?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [activeId, editingCell, gridContainerRef]);

  const handleGridKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (editingCell !== null) return;

    const isMod = e.ctrlKey || e.metaKey;
    const lowerKey = e.key.toLowerCase();

    if (isMod) {
      if (lowerKey === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          onRedo();
        } else {
          onUndo();
        }
        return;
      }
      if (lowerKey === 'y') {
        e.preventDefault();
        onRedo();
        return;
      }
      if (lowerKey === 'c') {
        e.preventDefault();
        onCopy(false);
        return;
      }
      if (lowerKey === 'x') {
        e.preventDefault();
        onCopy(true);
        return;
      }
      if (lowerKey === 'v') {
        e.preventDefault();
        void onPaste();
        return;
      }
    }

    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        onSelectCoord({ col: activeCell.col, row: activeCell.row - 1 }, e.shiftKey);
        return;
      case 'ArrowDown':
        e.preventDefault();
        onSelectCoord({ col: activeCell.col, row: activeCell.row + 1 }, e.shiftKey);
        return;
      case 'ArrowLeft':
        e.preventDefault();
        onSelectCoord({ col: activeCell.col - 1, row: activeCell.row }, e.shiftKey);
        return;
      case 'ArrowRight':
        e.preventDefault();
        onSelectCoord({ col: activeCell.col + 1, row: activeCell.row }, e.shiftKey);
        return;
      case 'Tab':
        e.preventDefault();
        onSelectCoord(
          { col: activeCell.col + (e.shiftKey ? -1 : 1), row: activeCell.row },
          false
        );
        return;
      case 'Enter':
      case 'F2':
        e.preventDefault();
        onStartEdit(activeId);
        return;
      case 'Backspace':
      case 'Delete':
        e.preventDefault();
        onDeleteSelection();
        return;
      case 'Escape':
        e.preventDefault();
        onSelectCoord(activeCell, false);
        return;
      default:
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
          e.preventDefault();
          onStartEdit(activeId, e.key);
        }
    }
  };

  return (
    <div
      ref={gridContainerRef}
      className="grid-scroll"
      tabIndex={0}
      role="grid"
      aria-label="Spreadsheet grid"
      data-testid="spreadsheet-grid"
      onKeyDown={handleGridKeyDown}
      onPaste={(e) => {
        if (editingCell !== null) return;
        const text = e.clipboardData?.getData('text/plain');
        if (text !== undefined) {
          e.preventDefault();
          void onPaste(text);
        }
      }}
    >
      <table className="sheet-table">
        <thead>
          <tr>
            <th className="corner-header" aria-label="Corner">
              #
            </th>
            {columnLabels.map((label, colIdx) => {
              const isColSelected =
                colIdx >= selectionRect.minCol && colIdx <= selectionRect.maxCol;
              return (
                <th
                  key={label}
                  className={`col-header ${isColSelected ? 'header-active' : ''}`}
                  scope="col"
                >
                  {label}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }, (_, rowIdx) => {
            const isRowSelected =
              rowIdx >= selectionRect.minRow && rowIdx <= selectionRect.maxRow;
            return (
              <tr key={rowIdx}>
                <th
                  className={`row-header ${isRowSelected ? 'header-active' : ''}`}
                  scope="row"
                >
                  {rowIdx + 1}
                </th>
                {Array.from({ length: cols }, (_, colIdx) => {
                  const cellId = formatCellId(colIdx, rowIdx);
                  const snap = getCellSnapshot(cellId);
                  const isActive = cellId === activeId;
                  const isEditingThis = editingCell === cellId;
                  const inSelection =
                    colIdx >= selectionRect.minCol &&
                    colIdx <= selectionRect.maxCol &&
                    rowIdx >= selectionRect.minRow &&
                    rowIdx <= selectionRect.maxRow;

                  const refKind = directReferences.has(cellId)
                    ? 'direct'
                    : indirectReferences.has(cellId)
                    ? 'indirect'
                    : 'none';

                  const depKind = directDependents.has(cellId)
                    ? 'direct'
                    : indirectDependents.has(cellId)
                    ? 'indirect'
                    : 'none';

                  const isBoth = refKind !== 'none' && depKind !== 'none';

                  const classes = ['sheet-cell'];
                  if (isActive) classes.push('cell-active');
                  else if (inSelection) classes.push('cell-in-range');

                  if (!isActive) {
                    if (isBoth) {
                      classes.push('cell-rel-both');
                    } else {
                      if (refKind === 'direct') classes.push('cell-ref-direct');
                      else if (refKind === 'indirect') classes.push('cell-ref-indirect');
                      if (depKind === 'direct') classes.push('cell-dep-direct');
                      else if (depKind === 'indirect') classes.push('cell-dep-indirect');
                    }
                  }

                  if (snap.error) classes.push('cell-error');
                  if (snap.valueType === 'number') classes.push('cell-number');
                  if (snap.isFormula) classes.push('cell-formula');

                  let tooltip = snap.raw ? `${cellId}: ${snap.raw}` : cellId;
                  if (snap.errorDetail) {
                    tooltip = `${cellId} (${snap.error}): ${snap.errorDetail}`;
                  } else if (snap.isFormula) {
                    tooltip = `${cellId}: ${snap.raw} = ${snap.display}`;
                  }

                  return (
                    <td
                      key={cellId}
                      className={classes.join(' ')}
                      title={tooltip}
                      data-cell-id={cellId}
                      data-selected={isActive ? 'true' : 'false'}
                      data-ref-kind={refKind}
                      data-dep-kind={depKind}
                      data-error={snap.error ?? 'none'}
                      onMouseDown={(e) => {
                        if (editingCell === cellId) {
                          return;
                        }
                        if (editingCell !== null) {
                          committedViaKeyRef.current = true;
                          onCommit();
                        }
                        if (e.shiftKey) {
                          onSelectCoord({ col: colIdx, row: rowIdx }, true);
                        } else {
                          isDraggingRef.current = true;
                          onSelectCoord({ col: colIdx, row: rowIdx }, false);
                        }
                        gridContainerRef.current?.focus();
                      }}
                      onMouseEnter={() => {
                        if (isDraggingRef.current && editingCell === null) {
                          onSelectCoord({ col: colIdx, row: rowIdx }, true);
                        }
                      }}
                      onDoubleClick={() => {
                        onStartEdit(cellId);
                      }}
                    >
                      {snap.isFormula && !isEditingThis && (
                        <span className="formula-corner" aria-hidden="true" />
                      )}

                      {!isActive && !isEditingThis && (isBoth || refKind === 'direct' || depKind === 'direct') && (
                        <span
                          className={`rel-badge ${
                            isBoth
                              ? 'rel-badge-both'
                              : refKind === 'direct'
                              ? 'rel-badge-ref'
                              : 'rel-badge-dep'
                          }`}
                        >
                          {isBoth ? 'CYCLE' : refKind === 'direct' ? 'REF' : 'DEP'}
                        </span>
                      )}

                      {isEditingThis ? (
                        <input
                          ref={inlineInputRef}
                          type="text"
                          className="cell-inline-input"
                          data-inline-editor="true"
                          data-testid={`cell-input-${cellId}`}
                          value={draftValue}
                          onChange={(e) => onDraftChange(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              e.stopPropagation();
                              committedViaKeyRef.current = true;
                              onCommit({ dCol: 0, dRow: 1 });
                              gridContainerRef.current?.focus();
                              return;
                            }
                            if (e.key === 'Tab') {
                              e.preventDefault();
                              e.stopPropagation();
                              committedViaKeyRef.current = true;
                              onCommit({ dCol: e.shiftKey ? -1 : 1, dRow: 0 });
                              gridContainerRef.current?.focus();
                              return;
                            }
                            if (e.key === 'Escape') {
                              e.preventDefault();
                              e.stopPropagation();
                              cancelingRef.current = true;
                              onCancel();
                              gridContainerRef.current?.focus();
                              return;
                            }
                            e.stopPropagation();
                          }}
                          onBlur={(e) => {
                            if (cancelingRef.current) {
                              cancelingRef.current = false;
                              return;
                            }
                            if (committedViaKeyRef.current) {
                              committedViaKeyRef.current = false;
                              return;
                            }
                            const nextTarget = e.relatedTarget as HTMLElement | null;
                            if (nextTarget?.dataset?.formulaBar === 'true') {
                              return;
                            }
                            onCommit();
                          }}
                        />
                      ) : (
                        <span
                          className="cell-display"
                          data-testid={`cell-display-${cellId}`}
                        >
                          {snap.display}
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
