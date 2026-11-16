import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  colIndexToLetter,
  formatCellId,
  isCoordInBounds,
} from '../../shared/coords.js';
import { SpreadsheetEngine } from '../../shared/engine.js';
import { shiftFormulaReferences } from '../../shared/parser.js';
import {
  CellCoord,
  CellSnapshot,
  DEFAULT_COLS,
  DEFAULT_ROWS,
  RecalcResult,
  WorkbookData,
} from '../../shared/types.js';

const MAX_HISTORY = 100;

export interface SelectionRect {
  minCol: number;
  maxCol: number;
  minRow: number;
  maxRow: number;
}

export interface HistoryEntry {
  id: number;
  label: string;
  timestamp: string;
  before: Record<string, string>;
  after: Record<string, string>;
  selectionBefore: CellCoord;
  selectionAfter: CellCoord;
}

export interface ClipboardData {
  origin: CellCoord;
  width: number;
  height: number;
  cells: Array<{ dc: number; dr: number; raw: string; display: string }>;
  tsv: string;
}

export type SyncStatus = 'loading' | 'saving' | 'saved' | 'error';

export function useSpreadsheet() {
  const engineRef = useRef<SpreadsheetEngine>(
    new SpreadsheetEngine(undefined, { rows: DEFAULT_ROWS, cols: DEFAULT_COLS })
  );
  const syncChainRef = useRef<Promise<void>>(Promise.resolve());
  const nextHistoryIdRef = useRef(1);

  const [rows, setRows] = useState(DEFAULT_ROWS);
  const [cols, setCols] = useState(DEFAULT_COLS);
  const [version, setVersion] = useState(0);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('loading');
  const [syncError, setSyncError] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);

  const [activeCell, setActiveCell] = useState<CellCoord>({ col: 0, row: 0 });
  const [selectionAnchor, setSelectionAnchor] = useState<CellCoord>({ col: 0, row: 0 });
  const [editingCell, setEditingCell] = useState<string | null>(null);
  const [draftValue, setDraftValue] = useState('');

  const [undoStack, setUndoStack] = useState<HistoryEntry[]>([]);
  const [redoStack, setRedoStack] = useState<HistoryEntry[]>([]);
  const [clipboard, setClipboard] = useState<ClipboardData | null>(null);
  const [lastRecalc, setLastRecalc] = useState<RecalcResult | null>(null);
  const [lastActionLabel, setLastActionLabel] = useState<string>('Ready');

  const dims = useMemo(() => ({ rows, cols }), [rows, cols]);

  const activeId = useMemo(
    () => formatCellId(activeCell.col, activeCell.row),
    [activeCell]
  );

  const selectionRect: SelectionRect = useMemo(
    () => ({
      minCol: Math.min(selectionAnchor.col, activeCell.col),
      maxCol: Math.max(selectionAnchor.col, activeCell.col),
      minRow: Math.min(selectionAnchor.row, activeCell.row),
      maxRow: Math.max(selectionAnchor.row, activeCell.row),
    }),
    [selectionAnchor, activeCell]
  );

  const persistPatch = useCallback((updates: Record<string, string>) => {
    if (Object.keys(updates).length === 0) return;
    setSyncStatus('saving');
    setSyncError(null);

    syncChainRef.current = syncChainRef.current
      .catch(() => {})
      .then(async () => {
        const res = await fetch('/api/workbook/cells', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ updates }),
          keepalive: true,
        });
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const data = (await res.json()) as { workbook: WorkbookData };
        setRevision(data.workbook.revision);
        setSyncStatus('saved');
      })
      .catch((err) => {
        console.error('Failed to persist workbook changes:', err);
        setSyncStatus('error');
        setSyncError(
          err instanceof Error ? err.message : 'Failed to reach backend server'
        );
      });
  }, []);

  const loadFromBackend = useCallback(async () => {
    setSyncStatus('loading');
    setSyncError(null);
    try {
      const res = await fetch('/api/workbook');
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data = (await res.json()) as WorkbookData;
      const engine = new SpreadsheetEngine(data.cells, {
        rows: data.rows,
        cols: data.cols,
      });
      engineRef.current = engine;
      setRows(data.rows);
      setCols(data.cols);
      setRevision(data.revision);
      setVersion((v) => v + 1);
      setSyncStatus('saved');
      setLastActionLabel('Loaded workbook from backend');
    } catch (err) {
      console.error('Failed to load workbook:', err);
      setSyncStatus('error');
      setSyncError(
        err instanceof Error ? err.message : 'Could not load workbook from backend'
      );
    }
  }, []);

  useEffect(() => {
    void loadFromBackend();
  }, [loadFromBackend]);

  const selectCoord = useCallback(
    (coord: CellCoord, extendSelection = false) => {
      const clamped: CellCoord = {
        col: Math.max(0, Math.min(cols - 1, coord.col)),
        row: Math.max(0, Math.min(rows - 1, coord.row)),
      };
      setActiveCell(clamped);
      if (!extendSelection) {
        setSelectionAnchor(clamped);
      }
    },
    [cols, rows]
  );

  const selectCellById = useCallback(
    (id: string) => {
      const upper = id.trim().toUpperCase();
      const match = /^([A-Z]+)([0-9]+)$/.exec(upper);
      if (!match) return;
      const letters = match[1];
      let col = 0;
      for (let i = 0; i < letters.length; i++) {
        col = col * 26 + (letters.charCodeAt(i) - 64);
      }
      col -= 1;
      const row = Number.parseInt(match[2], 10) - 1;
      if (!isCoordInBounds(col, row, dims)) return;
      setEditingCell(null);
      selectCoord({ col, row }, false);
    },
    [dims, selectCoord]
  );

  const commitUpdates = useCallback(
    (
      updates: Record<string, string>,
      label: string,
      nextSelection?: CellCoord
    ) => {
      const engine = engineRef.current;
      const before: Record<string, string> = {};
      const after: Record<string, string> = {};

      for (const [rawId, nextRaw] of Object.entries(updates)) {
        const id = rawId.toUpperCase();
        const prevRaw = engine.getRaw(id);
        if (prevRaw !== nextRaw) {
          before[id] = prevRaw;
          after[id] = nextRaw;
        }
      }

      if (Object.keys(after).length === 0) {
        return;
      }

      const recalc = engine.setCells(after);
      setLastRecalc(recalc);
      setLastActionLabel(label);
      setVersion((v) => v + 1);

      const entry: HistoryEntry = {
        id: nextHistoryIdRef.current++,
        label,
        timestamp: new Date().toLocaleTimeString(),
        before,
        after,
        selectionBefore: activeCell,
        selectionAfter: nextSelection ?? activeCell,
      };

      setUndoStack((prev) => {
        const next = [...prev, entry];
        return next.length > MAX_HISTORY ? next.slice(next.length - MAX_HISTORY) : next;
      });
      setRedoStack([]);
      persistPatch(after);
    },
    [activeCell, persistPatch]
  );

  const startEditing = useCallback(
    (cellId?: string, initialDraft?: string) => {
      const id = (cellId ?? activeId).toUpperCase();
      const raw = initialDraft !== undefined ? initialDraft : engineRef.current.getRaw(id);
      setEditingCell(id);
      setDraftValue(raw);
    },
    [activeId]
  );

  const commitEdit = useCallback(
    (moveDelta?: { dCol: number; dRow: number }) => {
      if (!editingCell) return;
      const targetId = editingCell;
      const nextRaw = draftValue;
      setEditingCell(null);

      const nextCoord: CellCoord = moveDelta
        ? {
            col: Math.max(0, Math.min(cols - 1, activeCell.col + moveDelta.dCol)),
            row: Math.max(0, Math.min(rows - 1, activeCell.row + moveDelta.dRow)),
          }
        : activeCell;

      commitUpdates({ [targetId]: nextRaw }, `Edit ${targetId}`, nextCoord);

      if (moveDelta) {
        selectCoord(nextCoord, false);
      }
    },
    [activeCell, cols, commitUpdates, draftValue, editingCell, rows, selectCoord]
  );

  const cancelEdit = useCallback(() => {
    setEditingCell(null);
    setDraftValue(engineRef.current.getRaw(activeId));
  }, [activeId]);

  const deleteSelection = useCallback(() => {
    const updates: Record<string, string> = {};
    for (let r = selectionRect.minRow; r <= selectionRect.maxRow; r++) {
      for (let c = selectionRect.minCol; c <= selectionRect.maxCol; c++) {
        const id = formatCellId(c, r);
        if (engineRef.current.getRaw(id) !== '') {
          updates[id] = '';
        }
      }
    }
    if (Object.keys(updates).length === 0) return;
    const label =
      Object.keys(updates).length === 1
        ? `Clear ${Object.keys(updates)[0]}`
        : `Clear ${formatCellId(selectionRect.minCol, selectionRect.minRow)}:${formatCellId(
            selectionRect.maxCol,
            selectionRect.maxRow
          )}`;
    commitUpdates(updates, label);
  }, [commitUpdates, selectionRect]);

  const undo = useCallback(() => {
    if (undoStack.length === 0) return;
    setEditingCell(null);
    const entry = undoStack[undoStack.length - 1];
    const recalc = engineRef.current.setCells(entry.before);
    setLastRecalc(recalc);
    setLastActionLabel(`Undo: ${entry.label}`);
    setUndoStack((prev) => prev.slice(0, -1));
    setRedoStack((prev) => [...prev, entry]);
    selectCoord(entry.selectionBefore, false);
    setVersion((v) => v + 1);
    persistPatch(entry.before);
  }, [persistPatch, selectCoord, undoStack]);

  const redo = useCallback(() => {
    if (redoStack.length === 0) return;
    setEditingCell(null);
    const entry = redoStack[redoStack.length - 1];
    const recalc = engineRef.current.setCells(entry.after);
    setLastRecalc(recalc);
    setLastActionLabel(`Redo: ${entry.label}`);
    setRedoStack((prev) => prev.slice(0, -1));
    setUndoStack((prev) => {
      const next = [...prev, entry];
      return next.length > MAX_HISTORY ? next.slice(next.length - MAX_HISTORY) : next;
    });
    selectCoord(entry.selectionAfter, false);
    setVersion((v) => v + 1);
    persistPatch(entry.after);
  }, [persistPatch, redoStack, selectCoord]);

  const copySelection = useCallback(
    (isCut = false) => {
      const engine = engineRef.current;
      const cells: ClipboardData['cells'] = [];
      const tsvRows: string[] = [];
      const cutUpdates: Record<string, string> = {};

      for (let r = selectionRect.minRow; r <= selectionRect.maxRow; r++) {
        const rowDisplay: string[] = [];
        for (let c = selectionRect.minCol; c <= selectionRect.maxCol; c++) {
          const id = formatCellId(c, r);
          const snap = engine.getCell(id);
          cells.push({
            dc: c - selectionRect.minCol,
            dr: r - selectionRect.minRow,
            raw: snap.raw,
            display: snap.display,
          });
          rowDisplay.push(snap.display || snap.raw);
          if (isCut && snap.raw !== '') {
            cutUpdates[id] = '';
          }
        }
        tsvRows.push(rowDisplay.join('\t'));
      }

      const tsv = tsvRows.join('\n');
      const data: ClipboardData = {
        origin: { col: selectionRect.minCol, row: selectionRect.minRow },
        width: selectionRect.maxCol - selectionRect.minCol + 1,
        height: selectionRect.maxRow - selectionRect.minRow + 1,
        cells,
        tsv,
      };
      setClipboard(data);

      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(tsv).catch(() => {});
      }

      if (isCut && Object.keys(cutUpdates).length > 0) {
        commitUpdates(cutUpdates, `Cut ${formatCellId(selectionRect.minCol, selectionRect.minRow)}`);
      } else {
        setLastActionLabel(
          `Copied ${formatCellId(selectionRect.minCol, selectionRect.minRow)}${
            cells.length > 1
              ? `:${formatCellId(selectionRect.maxCol, selectionRect.maxRow)}`
              : ''
          }`
        );
      }
    },
    [commitUpdates, selectionRect]
  );

  const pasteAtSelection = useCallback(
    async (externalText?: string) => {
      let textToCheck = externalText;
      if (
        textToCheck === undefined &&
        typeof navigator !== 'undefined' &&
        navigator.clipboard?.readText
      ) {
        try {
          textToCheck = await navigator.clipboard.readText();
        } catch {
          textToCheck = undefined;
        }
      }

      const targetCol = selectionRect.minCol;
      const targetRow = selectionRect.minRow;
      const updates: Record<string, string> = {};

      if (
        clipboard &&
        (textToCheck === undefined || textToCheck === clipboard.tsv)
      ) {
        const dCol = targetCol - clipboard.origin.col;
        const dRow = targetRow - clipboard.origin.row;

        for (const item of clipboard.cells) {
          const destCol = targetCol + item.dc;
          const destRow = targetRow + item.dr;
          if (!isCoordInBounds(destCol, destRow, dims)) continue;
          const destId = formatCellId(destCol, destRow);
          const nextRaw = item.raw.startsWith('=')
            ? shiftFormulaReferences(item.raw, dCol, dRow, dims)
            : item.raw;
          updates[destId] = nextRaw;
        }

        const endCol = Math.min(cols - 1, targetCol + clipboard.width - 1);
        const endRow = Math.min(rows - 1, targetRow + clipboard.height - 1);
        commitUpdates(
          updates,
          `Paste into ${formatCellId(targetCol, targetRow)}`,
          { col: targetCol, row: targetRow }
        );
        setActiveCell({ col: targetCol, row: targetRow });
        setSelectionAnchor({ col: endCol, row: endRow });
        return;
      }

      if (textToCheck !== undefined && textToCheck.length > 0) {
        const normalized = textToCheck.replace(/\r\n/g, '\n').replace(/\n$/, '');
        const gridRows = normalized.split('\n').map((r) => r.split('\t'));
        let maxC = targetCol;
        let maxR = targetRow;

        for (let dr = 0; dr < gridRows.length; dr++) {
          for (let dc = 0; dc < gridRows[dr].length; dc++) {
            const c = targetCol + dc;
            const r = targetRow + dr;
            if (!isCoordInBounds(c, r, dims)) continue;
            updates[formatCellId(c, r)] = gridRows[dr][dc];
            maxC = Math.max(maxC, c);
            maxR = Math.max(maxR, r);
          }
        }
        commitUpdates(
          updates,
          `Paste external into ${formatCellId(targetCol, targetRow)}`,
          { col: targetCol, row: targetRow }
        );
        setActiveCell({ col: targetCol, row: targetRow });
        setSelectionAnchor({ col: maxC, row: maxR });
      }
    },
    [clipboard, cols, commitUpdates, dims, rows, selectionRect]
  );

  const clearWorkbook = useCallback(() => {
    setEditingCell(null);
    const rawMap = engineRef.current.exportRawMap();
    const updates: Record<string, string> = {};
    for (const id of Object.keys(rawMap)) {
      updates[id] = '';
    }
    if (Object.keys(updates).length === 0) return;
    commitUpdates(updates, 'Clear workbook');
  }, [commitUpdates]);

  const loadSampleWorkbook = useCallback(() => {
    setEditingCell(null);
    const sample: Record<string, string> = {
      A1: 'Product',
      B1: 'Q1',
      C1: 'Q2',
      D1: 'Q3',
      E1: 'Total',
      F1: 'Average',
      G1: 'Tax (8%)',
      A2: 'Widgets',
      B2: '120',
      C2: '150',
      D2: '180',
      E2: '=SUM(B2:D2)',
      F2: '=AVG(B2:D2)',
      G2: '=E2 * 0.08',
      A3: 'Gadgets',
      B3: '90',
      C3: '110',
      D3: '140',
      E3: '=SUM(B3:D3)',
      F3: '=AVG(B3:D3)',
      G3: '=E3 * 0.08',
      A4: 'Services',
      B4: '200',
      C4: '210',
      D4: '250',
      E4: '=SUM(B4:D4)',
      F4: '=AVG(B4:D4)',
      G4: '=E4 * 0.08',
      A5: 'Summary',
      B5: '=SUM(B2:B4)',
      C5: '=SUM(C2:C4)',
      D5: '=SUM(D2:D4)',
      E5: '=SUM(E2:E4)',
      F5: '=AVG(F2:F4)',
      G5: '=SUM(G2:G4)',
      A7: 'Grand Net',
      B7: '=E5 - G5',
    };

    const currentRaw = engineRef.current.exportRawMap();
    const updates: Record<string, string> = {};
    for (const id of Object.keys(currentRaw)) {
      if (!(id in sample)) {
        updates[id] = '';
      }
    }
    for (const [id, val] of Object.entries(sample)) {
      updates[id] = val;
    }
    commitUpdates(updates, 'Load sample model');
  }, [commitUpdates]);

  // Derived snapshots & highlight sets recomputed on every version/selection change
  const activeSnapshot: CellSnapshot = useMemo(
    () => engineRef.current.getCell(activeId),
    [activeId, version]
  );

  const directReferences = useMemo(
    () => new Set(engineRef.current.getDirectDependencies(activeId)),
    [activeId, version]
  );

  const indirectReferences = useMemo(
    () => new Set(engineRef.current.getIndirectDependencies(activeId)),
    [activeId, version]
  );

  const directDependents = useMemo(
    () => new Set(engineRef.current.getDirectDependents(activeId)),
    [activeId, version]
  );

  const indirectDependents = useMemo(
    () => new Set(engineRef.current.getIndirectDependents(activeId)),
    [activeId, version]
  );

  const columnLabels = useMemo(
    () => Array.from({ length: cols }, (_, i) => colIndexToLetter(i)),
    [cols]
  );

  const activeCellsCount = useMemo(
    () => Object.keys(engineRef.current.exportRawMap()).length,
    [version]
  );

  const getCellSnapshot = useCallback(
    (id: string): CellSnapshot => engineRef.current.getCell(id),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [version]
  );

  return {
    rows,
    cols,
    columnLabels,
    version,
    revision,
    syncStatus,
    syncError,
    activeCell,
    activeId,
    selectionAnchor,
    selectionRect,
    editingCell,
    draftValue,
    setDraftValue,
    activeSnapshot,
    directReferences,
    indirectReferences,
    directDependents,
    indirectDependents,
    undoStack,
    redoStack,
    clipboard,
    lastRecalc,
    lastActionLabel,
    activeCellsCount,
    getCellSnapshot,
    selectCoord,
    selectCellById,
    startEditing,
    commitEdit,
    cancelEdit,
    deleteSelection,
    undo,
    redo,
    copySelection,
    pasteAtSelection,
    clearWorkbook,
    loadSampleWorkbook,
    reloadFromBackend: loadFromBackend,
  };
}
