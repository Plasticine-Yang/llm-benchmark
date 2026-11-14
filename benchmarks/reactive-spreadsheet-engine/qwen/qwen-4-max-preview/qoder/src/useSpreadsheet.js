import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { cellId, COLS, parseAddress, ROWS, Workbook } from '../shared/engine/index.js';
import { fetchWorkbook, putWorkbook } from './api.js';
import { CHAIN_DEMO, CYCLE_DEMO, ERROR_DEMO } from './demo.js';

const SAVE_DELAY = 300;
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export function useSpreadsheet() {
  const workbookRef = useRef(null);
  if (!workbookRef.current) workbookRef.current = new Workbook({ rows: ROWS, cols: COLS });
  const workbook = workbookRef.current;

  const [version, setVersion] = useState(0);
  const [status, setStatus] = useState({ phase: 'loading', savedAt: null, message: '' });
  const [selection, setSelection] = useState({ anchor: 'A1', focus: 'A1' });
  const [editing, setEditing] = useState(null);
  const editingRef = useRef(null);
  const saveTimer = useRef(null);

  const bump = useCallback(() => setVersion((value) => value + 1), []);

  const writeEditing = useCallback((next) => {
    editingRef.current = next;
    setEditing(next);
  }, []);

  const scheduleSave = useCallback(() => {
    setStatus((prev) => ({ ...prev, phase: 'saving' }));
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      const cells = {};
      for (const [id, raw] of workbook.raw) cells[id] = raw;
      try {
        const result = await putWorkbook(cells);
        setStatus({ phase: 'saved', savedAt: result.savedAt, message: '' });
      } catch (error) {
        setStatus({ phase: 'error', savedAt: null, message: error.message });
      }
    }, SAVE_DELAY);
  }, [workbook]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchWorkbook();
        if (cancelled) return;
        workbook.load(data.cells ?? {});
        setStatus({ phase: 'saved', savedAt: data.savedAt ?? null, message: '' });
        bump();
      } catch (error) {
        if (!cancelled) {
          setStatus({ phase: 'error', savedAt: null, message: `backend unreachable: ${error.message}` });
          bump();
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [workbook, bump]);

  useEffect(() => () => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
  }, []);

  const rect = useMemo(() => {
    const anchor = parseAddress(selection.anchor) ?? { col: 0, row: 0 };
    const focus = parseAddress(selection.focus) ?? anchor;
    return {
      c0: Math.min(anchor.col, focus.col),
      c1: Math.max(anchor.col, focus.col),
      r0: Math.min(anchor.row, focus.row),
      r1: Math.max(anchor.row, focus.row),
    };
  }, [selection]);

  const selectedIds = useMemo(() => {
    const ids = [];
    for (let row = rect.r0; row <= rect.r1; row += 1) {
      for (let col = rect.c0; col <= rect.c1; col += 1) ids.push(cellId(col, row));
    }
    return ids;
  }, [rect]);

  const move = useCallback((dx, dy, extend = false) => {
    setSelection((prev) => {
      const base = parseAddress(prev.focus) ?? { col: 0, row: 0 };
      const focus = cellId(clamp(base.col + dx, 0, COLS - 1), clamp(base.row + dy, 0, ROWS - 1));
      return { anchor: extend ? prev.anchor : focus, focus };
    });
  }, []);

  const select = useCallback((id, extend = false) => {
    setSelection((prev) => ({ anchor: extend ? prev.anchor : id, focus: id }));
  }, []);

  const selectAll = useCallback(() => {
    setSelection({ anchor: 'A1', focus: cellId(COLS - 1, ROWS - 1) });
  }, []);

  const startEdit = useCallback((id, draft, source = 'grid') => {
    writeEditing({ id, draft: draft ?? workbook.getRaw(id), source });
  }, [workbook, writeEditing]);

  const updateDraft = useCallback((draft) => {
    if (!editingRef.current) return;
    writeEditing({ ...editingRef.current, draft });
  }, [writeEditing]);

  const cancelEdit = useCallback(() => writeEditing(null), [writeEditing]);

  const commitEdit = useCallback((direction = null) => {
    const current = editingRef.current;
    if (!current) return;
    const result = workbook.setCell(current.id, current.draft);
    writeEditing(null);
    if (result.changed) {
      bump();
      scheduleSave();
    }
    if (direction === 'down') move(0, 1);
    else if (direction === 'up') move(0, -1);
    else if (direction === 'right') move(1, 0);
    else if (direction === 'left') move(-1, 0);
  }, [workbook, writeEditing, bump, scheduleSave, move]);

  const applyCells = useCallback((entries) => {
    const result = workbook.setCells(entries);
    if (result.changed) {
      bump();
      scheduleSave();
    }
    return result;
  }, [workbook, bump, scheduleSave]);

  const replaceWorkbook = useCallback((cells) => {
    const ids = new Set([...workbook.raw.keys(), ...Object.keys(cells)]);
    const changes = [...ids].map((id) => ({ id, raw: cells[id] ?? '' }));
    const result = workbook.applyChanges(changes);
    if (result.changed) {
      bump();
      scheduleSave();
    }
  }, [workbook, bump, scheduleSave]);

  const undo = useCallback(() => {
    if (workbook.undo()) {
      bump();
      scheduleSave();
    }
  }, [workbook, bump, scheduleSave]);

  const redo = useCallback(() => {
    if (workbook.redo()) {
      bump();
      scheduleSave();
    }
  }, [workbook, bump, scheduleSave]);

  const clearSelection = useCallback(() => {
    applyCells(selectedIds.map((id) => [id, '']));
  }, [applyCells, selectedIds]);

  const clearAll = useCallback(() => replaceWorkbook({}), [replaceWorkbook]);

  const loadDemo = useCallback((name) => {
    if (name === 'chain') replaceWorkbook(CHAIN_DEMO);
    else if (name === 'errors') replaceWorkbook(ERROR_DEMO);
    else if (name === 'cycle') applyCells(Object.entries(CYCLE_DEMO));
  }, [replaceWorkbook, applyCells]);

  const stats = useMemo(() => {
    let formulas = 0;
    let errors = 0;
    for (const id of workbook.raw.keys()) {
      if (workbook.isFormula(id)) formulas += 1;
      if (workbook.getError(id)) errors += 1;
    }
    return {
      populated: workbook.raw.size,
      formulas,
      errors,
      cycles: workbook.cycles.size,
      history: workbook.history.length,
      future: workbook.future.length,
    };
  }, [workbook, version]);

  return {
    workbook,
    version,
    status,
    selection,
    rect,
    selectedIds,
    editing,
    stats,
    recalcLog: workbook.recalcLog,
    canUndo: workbook.canUndo,
    canRedo: workbook.canRedo,
    move,
    select,
    selectAll,
    startEdit,
    updateDraft,
    cancelEdit,
    commitEdit,
    applyCells,
    clearSelection,
    clearAll,
    loadDemo,
    undo,
    redo,
    retrySave: scheduleSave,
  };
}