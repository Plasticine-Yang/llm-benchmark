import React, { useRef } from 'react';
import { formatCellId } from '../../shared/coords.js';
import { CellSnapshot } from '../../shared/types.js';
import { SelectionRect } from '../hooks/useSpreadsheet.js';

interface FormulaBarProps {
  activeId: string;
  selectionRect: SelectionRect;
  snapshot: CellSnapshot;
  isEditing: boolean;
  draftValue: string;
  onDraftChange: (val: string) => void;
  onStartEdit: () => void;
  onCommit: (moveDelta?: { dCol: number; dRow: number }) => void;
  onCancel: () => void;
  onReturnFocusToGrid: () => void;
}

export const FormulaBar: React.FC<FormulaBarProps> = ({
  activeId,
  selectionRect,
  snapshot,
  isEditing,
  draftValue,
  onDraftChange,
  onStartEdit,
  onCommit,
  onCancel,
  onReturnFocusToGrid,
}) => {
  const cancelingRef = useRef(false);
  const committedViaKeyRef = useRef(false);

  const isMulti =
    selectionRect.minCol !== selectionRect.maxCol ||
    selectionRect.minRow !== selectionRect.maxRow;

  const selectionLabel = isMulti
    ? `${formatCellId(selectionRect.minCol, selectionRect.minRow)}:${formatCellId(
        selectionRect.maxCol,
        selectionRect.maxRow
      )}`
    : activeId;

  const kindBadge = snapshot.error
    ? 'ERROR'
    : snapshot.isFormula
    ? 'FORMULA'
    : snapshot.valueType.toUpperCase();

  return (
    <div className="formula-bar">
      <div className="formula-address" data-testid="active-cell-address">
        {selectionLabel}
      </div>

      <span className={`kind-badge kind-${kindBadge.toLowerCase()}`}>
        {kindBadge}
      </span>

      <div className="formula-input-wrap">
        <span className="formula-fx" aria-hidden="true">
          fx
        </span>
        <input
          type="text"
          className="formula-input"
          data-formula-bar="true"
          data-testid="formula-bar-input"
          aria-label={`Formula or value for cell ${activeId}`}
          placeholder="Enter text, number, or =formula (e.g. =SUM(A1:A5) + B1 * 2)"
          value={isEditing ? draftValue : snapshot.raw}
          onFocus={() => {
            if (!isEditing) {
              onStartEdit();
            }
          }}
          onChange={(e) => onDraftChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              committedViaKeyRef.current = true;
              onCommit({ dCol: 0, dRow: 1 });
              onReturnFocusToGrid();
            } else if (e.key === 'Tab') {
              e.preventDefault();
              committedViaKeyRef.current = true;
              onCommit({ dCol: e.shiftKey ? -1 : 1, dRow: 0 });
              onReturnFocusToGrid();
            } else if (e.key === 'Escape') {
              e.preventDefault();
              cancelingRef.current = true;
              onCancel();
              onReturnFocusToGrid();
            }
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
            if (nextTarget?.dataset?.inlineEditor === 'true') {
              return;
            }
            if (isEditing) {
              onCommit();
            }
          }}
        />
      </div>

      <div
        className={`formula-preview ${snapshot.error ? 'preview-error' : ''}`}
        title={snapshot.errorDetail ?? 'Computed value'}
        data-testid="formula-bar-preview"
      >
        <span className="preview-label">Value</span>
        <span className="preview-value">
          {snapshot.valueType === 'empty' ? '—' : snapshot.display}
        </span>
      </div>
    </div>
  );
};
