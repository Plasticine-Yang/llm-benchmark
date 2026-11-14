import { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  cellId,
  COLS,
  colName,
  formatValue,
  isError,
  parseAddress,
  refsInFormula,
  ROWS,
} from '../../shared/engine/index.js';

function toTsv(ids, rect, workbook) {
  const rows = [];
  for (let row = rect.r0; row <= rect.r1; row += 1) {
    const line = [];
    for (let col = rect.c0; col <= rect.c1; col += 1) {
      line.push(workbook.getRaw(cellId(col, row)));
    }
    rows.push(line.join('\t'));
  }
  return rows.join('\n');
}

export default function Grid({ sheet }) {
  const {
    workbook,
    version,
    selection,
    rect,
    editing,
    recalcLog,
    move,
    select,
    selectAll,
    startEdit,
    updateDraft,
    cancelEdit,
    commitEdit,
    applyCells,
    clearSelection,
    undo,
    redo,
  } = sheet;

  const containerRef = useRef(null);
  const draggingRef = useRef(false);
  const focus = selection.focus;

  const precedents = useMemo(
    () => new Set(workbook.getPrecedents(focus)),
    [workbook, focus, version],
  );
  const dependents = useMemo(
    () => new Set(workbook.getDependents(focus)),
    [workbook, focus, version],
  );
  const liveRefs = useMemo(() => {
    if (!editing || !editing.draft.startsWith('=')) return new Set();
    return new Set(refsInFormula(editing.draft, { rows: ROWS, cols: COLS }));
  }, [editing]);
  const recalculated = useMemo(() => new Set(recalcLog.order), [recalcLog]);
  const flashName = recalcLog.id % 2 === 0 ? 'flash-a' : 'flash-b';

  useEffect(() => {
    const stopDrag = () => {
      draggingRef.current = false;
    };
    window.addEventListener('mouseup', stopDrag);
    return () => window.removeEventListener('mouseup', stopDrag);
  }, []);

  const copySelection = useCallback(() => {
    const text = toTsv(null, rect, workbook);
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(text).catch(() => {});
    return text;
  }, [rect, workbook]);

  const pasteAt = useCallback((id, text) => {
    const origin = parseAddress(id);
    if (!origin || !text) return;
    const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
    if (lines.length > 1 && lines[lines.length - 1] === '') lines.pop();
    const entries = [];
    let lastCol = origin.col;
    let lastRow = origin.row;
    lines.forEach((line, rowOffset) => {
      const row = origin.row + rowOffset;
      if (row >= ROWS) return;
      line.split('\t').forEach((raw, colOffset) => {
        const col = origin.col + colOffset;
        if (col >= COLS) return;
        entries.push([cellId(col, row), raw]);
        lastCol = Math.max(lastCol, col);
        lastRow = Math.max(lastRow, row);
      });
    });
    if (entries.length === 0) return;
    applyCells(entries);
    select(cellId(origin.col, origin.row));
    select(cellId(lastCol, lastRow), true);
  }, [applyCells, select]);

  const onKeyDown = (event) => {
    if (editing) return;
    const { key, ctrlKey, metaKey, shiftKey, altKey } = event;
    const mod = ctrlKey || metaKey;
    const lower = key.toLowerCase();

    if (mod && lower === 'z') {
      event.preventDefault();
      if (shiftKey) redo();
      else undo();
      return;
    }
    if (mod && lower === 'y') {
      event.preventDefault();
      redo();
      return;
    }
    if (mod && lower === 'a') {
      event.preventDefault();
      selectAll();
      return;
    }
    if (mod && lower === 'x') {
      event.preventDefault();
      copySelection();
      clearSelection();
      return;
    }
    if (mod) return;

    switch (key) {
      case 'ArrowUp': event.preventDefault(); move(0, -1, shiftKey); return;
      case 'ArrowDown': event.preventDefault(); move(0, 1, shiftKey); return;
      case 'ArrowLeft': event.preventDefault(); move(-1, 0, shiftKey); return;
      case 'ArrowRight': event.preventDefault(); move(1, 0, shiftKey); return;
      case 'Tab': event.preventDefault(); move(shiftKey ? -1 : 1, 0); return;
      case 'Enter': event.preventDefault(); startEdit(focus, undefined, 'grid'); return;
      case 'F2': event.preventDefault(); startEdit(focus, undefined, 'grid'); return;
      case 'Delete':
      case 'Backspace': event.preventDefault(); clearSelection(); return;
      case 'Escape': event.preventDefault(); select(focus); return;
      case 'Home': {
        event.preventDefault();
        const address = parseAddress(focus);
        select(cellId(0, address.row));
        return;
      }
      case 'PageDown': event.preventDefault(); move(0, 10, shiftKey); return;
      case 'PageUp': event.preventDefault(); move(0, -10, shiftKey); return;
      default:
        if (!altKey && key.length === 1) {
          event.preventDefault();
          startEdit(focus, key, 'grid');
        }
    }
  };

  const onEditorKeyDown = (event) => {
    event.stopPropagation();
    const { key, shiftKey } = event;
    if (key === 'Enter') {
      event.preventDefault();
      commitEdit(shiftKey ? 'up' : 'down');
    } else if (key === 'Tab') {
      event.preventDefault();
      commitEdit(shiftKey ? 'left' : 'right');
    } else if (key === 'Escape') {
      event.preventDefault();
      cancelEdit();
    } else if (key === 'ArrowUp') {
      event.preventDefault();
      commitEdit('up');
    } else if (key === 'ArrowDown') {
      event.preventDefault();
      commitEdit('down');
    }
  };

  const onCellMouseDown = (id, event) => {
    if (event.button !== 0) return;
    event.preventDefault();
    if (editing && editing.id !== id) commitEdit();
    containerRef.current?.focus({ preventScroll: true });
    select(id, event.shiftKey);
    draggingRef.current = true;
  };

  const onCellMouseEnter = (id) => {
    if (draggingRef.current) select(id, true);
  };

  const selectColumn = (col) => {
    select(cellId(col, 0));
    select(cellId(col, ROWS - 1), true);
    containerRef.current?.focus({ preventScroll: true });
  };

  const selectRow = (row) => {
    select(cellId(0, row));
    select(cellId(COLS - 1, row), true);
    containerRef.current?.focus({ preventScroll: true });
  };

  const rows = [];
  for (let row = 0; row < ROWS; row += 1) {
    const cells = [];
    for (let col = 0; col < COLS; col += 1) {
      const id = cellId(col, row);
      const value = workbook.getValue(id);
      const display = formatValue(value);
      const kind = workbook.getKind(id);
      const inRange = col >= rect.c0 && col <= rect.c1 && row >= rect.r0 && row <= rect.r1;
      const isFocus = id === focus;
      const isEditing = editing?.id === id;
      const error = isError(value);
      const classes = ['cell'];
      if (inRange) classes.push('in-range');
      if (isFocus) classes.push('is-focus');
      if (!isFocus && precedents.has(id)) classes.push('is-precedent');
      if (!isFocus && dependents.has(id)) classes.push('is-dependent');
      if (liveRefs.has(id)) classes.push('is-live-ref');
      if (workbook.cycles.has(id)) classes.push('is-cycle');
      if (error) classes.push('is-error');
      if (kind === 'formula') classes.push('is-formula');
      if (typeof value === 'number') classes.push('is-number');
      if (typeof value === 'boolean') classes.push('is-boolean');
      if (recalculated.has(id) && !isEditing) classes.push(flashName);

      cells.push(
        <td
          key={id}
          className={classes.join(' ')}
          data-cell={id}
          onMouseDown={(event) => onCellMouseDown(id, event)}
          onMouseEnter={() => onCellMouseEnter(id)}
          onDoubleClick={() => startEdit(id, undefined, 'grid')}
          title={workbook.getRaw(id) ? `${id} raw: ${workbook.getRaw(id)}` : id}
        >
          {isEditing ? (
            <input
              className="cell-editor"
              value={editing.draft}
              autoFocus={editing.source === 'grid'}
              spellCheck={false}
              onChange={(event) => updateDraft(event.target.value)}
              onKeyDown={onEditorKeyDown}
              onBlur={() => commitEdit()}
            />
          ) : (
            <span className="cell-text">{display}</span>
          )}
        </td>,
      );
    }
    rows.push(
      <tr key={row}>
        <th
          className={`row-head${row >= rect.r0 && row <= rect.r1 ? ' active' : ''}`}
          onMouseDown={(event) => {
            event.preventDefault();
            selectRow(row);
          }}
        >
          {row + 1}
        </th>
        {cells}
      </tr>,
    );
  }

  return (
    <div
      className="grid-scroll"
      ref={containerRef}
      tabIndex={0}
      onKeyDown={onKeyDown}
      onCopy={(event) => {
        if (editing) return;
        event.preventDefault();
        event.clipboardData.setData('text/plain', toTsv(null, rect, workbook));
      }}
      onCut={(event) => {
        if (editing) return;
        event.preventDefault();
        event.clipboardData.setData('text/plain', toTsv(null, rect, workbook));
        clearSelection();
      }}
      onPaste={(event) => {
        if (editing) return;
        const text = event.clipboardData?.getData('text/plain');
        if (!text) return;
        event.preventDefault();
        pasteAt(focus, text);
      }}
    >
      <table className="grid">
        <thead>
          <tr>
            <th className="corner" />
            {Array.from({ length: COLS }, (_, col) => (
              <th
                key={col}
                className={`col-head${col >= rect.c0 && col <= rect.c1 ? ' active' : ''}`}
                onMouseDown={(event) => {
                  event.preventDefault();
                  selectColumn(col);
                }}
              >
                {colName(col)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{rows}</tbody>
      </table>
    </div>
  );
}