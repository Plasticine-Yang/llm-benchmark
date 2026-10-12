import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type React from 'react';
import { Sheet, RawMap, addrCompare } from './engine/sheet';
import { NUM_ROWS, NUM_COLS, toAddr, colToLetters, parseAddr, CellCoord } from './engine/address';
import { isError, SUPPORTED_FUNCTIONS } from './engine/evaluator';
import { shiftFormula } from './engine/parser';
import { fetchWorkbook, SaveQueue, SaveInfo } from './api';

const HISTORY_LIMIT = 100; // requirement: at least 20

interface Edit {
  before: RawMap;
  after: RawMap;
  label: string;
}
interface Selection {
  anchor: CellCoord;
  focus: CellCoord;
}
interface Editing {
  addr: string;
  draft: string;
  /** 'enter': started by typing, arrows commit+move. 'edit': Enter/F2/dblclick, arrows move the caret. */
  mode: 'enter' | 'edit';
  origin: 'cell' | 'bar';
}
interface Clip {
  text: string;
  raws: string[][];
  origin: CellCoord;
  cut: boolean;
}
interface Verify {
  total: number;
  mismatches: string[];
}

const DEMO: RawMap = {
  A1: 'Root input',
  B1: '10',
  A2: 'Level 1: =B1*2',
  B2: '=B1*2',
  A3: 'Level 2: =B2+5',
  B3: '=B2+5',
  A4: 'Level 3: =B3*B2',
  B4: '=B3*B2',
  A5: 'Level 4: SUM',
  B5: '=SUM(B1:B4)',
  A6: 'AVG + arithmetic',
  B6: '=AVG(B1:B4)*2-(B2+1)/3',
  D1: 'Forward ref =F1*3',
  E1: '=F1*3',
  D3: '#DIV/0!',
  E3: '=B1/(B2-20)',
  D4: '#REF! (off-grid)',
  E4: '=Z99+1',
  D5: '#VALUE! (text)',
  E5: '=A1*2',
  D6: 'Propagated',
  E6: '=SUM(E3:E5)',
};

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

function rectOf(sel: Selection) {
  return {
    r0: Math.min(sel.anchor.row, sel.focus.row),
    r1: Math.max(sel.anchor.row, sel.focus.row),
    c0: Math.min(sel.anchor.col, sel.focus.col),
    c1: Math.max(sel.anchor.col, sel.focus.col),
  };
}

function wantsReference(draft: string): boolean {
  if (!draft.startsWith('=')) return false;
  const t = draft.trimEnd();
  return t === '=' || /[=+\-*/^(,:<>&]$/.test(t);
}

export default function App() {
  const sheetRef = useRef<Sheet>(new Sheet());
  const sheet = sheetRef.current;
  const [, setTick] = useState(0);
  const rerender = useCallback(() => setTick((t) => t + 1), []);

  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [sel, setSel] = useState<Selection>({ anchor: { row: 0, col: 0 }, focus: { row: 0, col: 0 } });
  const [editing, setEditing] = useState<Editing | null>(null);
  const [showFormulas, setShowFormulas] = useState(false);
  const [recalc, setRecalc] = useState<{ id: number; order: string[]; label: string } | null>(null);
  const [saveInfo, setSaveInfo] = useState<SaveInfo>({ state: 'idle' });
  const [verify, setVerify] = useState<Verify | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const historyRef = useRef<{ undo: Edit[]; redo: Edit[] }>({ undo: [], redo: [] });
  const clipRef = useRef<Clip | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLInputElement | null>(null);
  const draggingRef = useRef(false);
  const pasteExpectedRef = useRef(false);

  const verifyAgainst = useCallback(
    (values: Record<string, string>) => {
      const local = sheet.toValueMap();
      const keys = new Set([...Object.keys(local), ...Object.keys(values)]);
      const mismatches = [...keys].filter((k) => local[k] !== values[k]).sort(addrCompare);
      setVerify({ total: keys.size, mismatches });
    },
    [sheet],
  );

  const queueRef = useRef<SaveQueue | null>(null);
  if (!queueRef.current) {
    queueRef.current = new SaveQueue((info) => {
      setSaveInfo(info);
      if (info.state === 'saved' && info.values && !queueRef.current?.busy) verifyAgainst(info.values);
    });
  }
  const queue = queueRef.current;

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast((t) => (t === msg ? null : t)), 2200);
  }, []);

  // ------------------------------------------------------------- load
  useEffect(() => {
    let cancelled = false;
    fetchWorkbook()
      .then((p) => {
        if (cancelled) return;
        const r = sheet.load(p.cells);
        verifyAgainst(p.values);
        setSaveInfo({ state: 'saved', version: p.version, updatedAt: p.updatedAt });
        setRecalc({ id: 1, order: r.order, label: 'Initial load' });
        setLoaded(true);
      })
      .catch((e: unknown) => {
        if (!cancelled) setLoadError(e instanceof Error ? e.message : String(e));
      });
    return () => {
      cancelled = true;
    };
  }, [sheet, verifyAgainst]);

  useEffect(() => {
    const onUnload = (e: BeforeUnloadEvent) => {
      if (queue.busy) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', onUnload);
    return () => window.removeEventListener('beforeunload', onUnload);
  }, [queue]);

  const focusGrid = useCallback(() => {
    window.setTimeout(() => gridRef.current?.focus({ preventScroll: true }), 0);
  }, []);

  // ------------------------------------------------------------- edits & history
  const applyChanges = useCallback(
    (after: RawMap, label: string, record = true): boolean => {
      const before: RawMap = {};
      const effective: RawMap = {};
      for (const [addr, raw] of Object.entries(after)) {
        const prev = sheet.getRaw(addr);
        if (prev === raw) continue;
        before[addr] = prev;
        effective[addr] = raw;
      }
      if (Object.keys(effective).length === 0) return false;
      const r = sheet.setCells(effective);
      if (record) {
        const h = historyRef.current;
        h.undo.push({ before, after: effective, label });
        if (h.undo.length > HISTORY_LIMIT) h.undo.shift();
        h.redo = [];
      }
      queue.enqueue(effective);
      setRecalc((prev) => ({ id: (prev?.id ?? 0) + 1, order: r.order, label }));
      rerender();
      return true;
    },
    [sheet, queue, rerender],
  );

  const undo = useCallback(() => {
    const h = historyRef.current;
    const e = h.undo.pop();
    if (!e) return showToast('Nothing to undo');
    h.redo.push(e);
    const r = sheet.setCells(e.before);
    queue.enqueue(e.before);
    setRecalc((prev) => ({ id: (prev?.id ?? 0) + 1, order: r.order, label: `Undo: ${e.label}` }));
    selectAddr(Object.keys(e.before).sort(addrCompare)[0]);
    rerender();
    showToast(`Undo: ${e.label}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sheet, queue, rerender, showToast]);

  const redo = useCallback(() => {
    const h = historyRef.current;
    const e = h.redo.pop();
    if (!e) return showToast('Nothing to redo');
    h.undo.push(e);
    const r = sheet.setCells(e.after);
    queue.enqueue(e.after);
    setRecalc((prev) => ({ id: (prev?.id ?? 0) + 1, order: r.order, label: `Redo: ${e.label}` }));
    selectAddr(Object.keys(e.after).sort(addrCompare)[0]);
    rerender();
    showToast(`Redo: ${e.label}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sheet, queue, rerender, showToast]);

  function selectAddr(addr: string | undefined) {
    if (!addr) return;
    const c = parseAddr(addr);
    if (c) setSel({ anchor: c, focus: c });
  }

  // ------------------------------------------------------------- editing
  const focusAddr = toAddr(sel.focus.row, sel.focus.col);

  const startEdit = (mode: Editing['mode'], initial?: string, origin: Editing['origin'] = 'cell') => {
    setEditing({ addr: focusAddr, draft: initial ?? sheet.getRaw(focusAddr), mode, origin });
  };

  const moveFocus = useCallback((dr: number, dc: number, extend = false) => {
    setSel((s) => {
      const f = { row: clamp(s.focus.row + dr, 0, NUM_ROWS - 1), col: clamp(s.focus.col + dc, 0, NUM_COLS - 1) };
      return extend ? { anchor: s.anchor, focus: f } : { anchor: f, focus: f };
    });
  }, []);

  const commitEdit = (move?: [number, number]) => {
    if (!editing) return;
    setEditing(null);
    applyChanges({ [editing.addr]: editing.draft }, `Edit ${editing.addr}`);
    if (move) moveFocus(move[0], move[1]);
    focusGrid();
  };

  const cancelEdit = () => {
    setEditing(null);
    focusGrid();
  };

  const onEditorKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      commitEdit(editing?.origin === 'bar' ? undefined : [e.shiftKey ? -1 : 1, 0]);
    } else if (e.key === 'Tab') {
      e.preventDefault();
      commitEdit([0, e.shiftKey ? -1 : 1]);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelEdit();
    } else if (editing?.mode === 'enter' && editing.origin === 'cell') {
      const dirs: Record<string, [number, number]> = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] };
      if (dirs[e.key]) {
        e.preventDefault();
        commitEdit(dirs[e.key]);
      }
    }
  };

  useEffect(() => {
    if (editing && editing.origin === 'cell' && editorRef.current && document.activeElement !== editorRef.current) {
      const el = editorRef.current;
      el.focus();
      el.setSelectionRange(el.value.length, el.value.length);
    }
  }, [editing]);

  // Keep the focused cell visible.
  useEffect(() => {
    document.querySelector(`[data-addr="${focusAddr}"]`)?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [focusAddr]);

  // ------------------------------------------------------------- clipboard
  const stateRef = useRef({ sel, editing, loaded });
  stateRef.current = { sel, editing, loaded };

  const buildClip = useCallback(
    (cut: boolean): Clip => {
      const { r0, r1, c0, c1 } = rectOf(stateRef.current.sel);
      const raws: string[][] = [];
      const shown: string[] = [];
      for (let r = r0; r <= r1; r++) {
        const rowRaw: string[] = [];
        const rowShown: string[] = [];
        for (let c = c0; c <= c1; c++) {
          const a = toAddr(r, c);
          rowRaw.push(sheet.getRaw(a));
          rowShown.push(sheet.getDisplay(a));
        }
        raws.push(rowRaw);
        shown.push(rowShown.join('\t'));
      }
      return { text: shown.join('\n'), raws, origin: { row: r0, col: c0 }, cut };
    },
    [sheet],
  );

  const pasteBlock = useCallback(
    (raws: string[][], source: Clip | null) => {
      const { r0, r1, c0, c1 } = rectOf(stateRef.current.sel);
      const changes: RawMap = {};
      const single = raws.length === 1 && raws[0].length === 1;
      const height = single ? r1 - r0 + 1 : raws.length;
      const width = single ? c1 - c0 + 1 : Math.max(...raws.map((r) => r.length));
      for (let i = 0; i < height; i++) {
        for (let j = 0; j < width; j++) {
          const r = r0 + i;
          const c = c0 + j;
          if (r >= NUM_ROWS || c >= NUM_COLS) continue;
          let raw = single ? raws[0][0] : raws[i]?.[j] ?? '';
          if (source && !source.cut) {
            const srcRow = source.origin.row + (single ? 0 : i);
            const srcCol = source.origin.col + (single ? 0 : j);
            raw = shiftFormula(raw, r - srcRow, c - srcCol);
          }
          changes[toAddr(r, c)] = raw;
        }
      }
      if (source?.cut) {
        // Move: clear source cells that are not overwritten by the destination.
        source.raws.forEach((row, i) =>
          row.forEach((_, j) => {
            const a = toAddr(source.origin.row + i, source.origin.col + j);
            if (!(a in changes)) changes[a] = '';
          }),
        );
        clipRef.current = null;
      }
      const n = Object.keys(changes).length;
      if (applyChanges(changes, `Paste ${n} cell${n === 1 ? '' : 's'} at ${toAddr(r0, c0)}`)) {
        setSel({ anchor: { row: r0, col: c0 }, focus: { row: Math.min(r0 + height - 1, NUM_ROWS - 1), col: Math.min(c0 + width - 1, NUM_COLS - 1) } });
      }
    },
    [applyChanges],
  );

  useEffect(() => {
    const isForeignInput = (t: EventTarget | null) =>
      t instanceof HTMLElement && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA') && t !== gridRef.current;

    const onCopy = (e: ClipboardEvent, cut: boolean) => {
      if (!stateRef.current.loaded || stateRef.current.editing || isForeignInput(e.target)) return;
      const clip = buildClip(cut);
      clipRef.current = clip;
      e.clipboardData?.setData('text/plain', clip.text);
      e.preventDefault();
      const n = clip.raws.length * clip.raws[0].length;
      showToast(`${cut ? 'Cut' : 'Copied'} ${n} cell${n === 1 ? '' : 's'}`);
    };
    const copy = (e: ClipboardEvent) => onCopy(e, false);
    const cut = (e: ClipboardEvent) => onCopy(e, true);
    const paste = (e: ClipboardEvent) => {
      if (!stateRef.current.loaded || stateRef.current.editing || isForeignInput(e.target)) return;
      pasteExpectedRef.current = false;
      e.preventDefault();
      const text = e.clipboardData?.getData('text/plain') ?? '';
      const clip = clipRef.current;
      if (clip && text.replace(/\r/g, '') === clip.text) return pasteBlock(clip.raws, clip);
      if (!text) return;
      const rows = text.replace(/\r\n?/g, '\n').replace(/\n$/, '').split('\n').map((l) => l.split('\t'));
      pasteBlock(rows, null);
    };
    document.addEventListener('copy', copy);
    document.addEventListener('cut', cut);
    document.addEventListener('paste', paste);
    return () => {
      document.removeEventListener('copy', copy);
      document.removeEventListener('cut', cut);
      document.removeEventListener('paste', paste);
    };
  }, [buildClip, pasteBlock, showToast]);

  // ------------------------------------------------------------- grid keyboard
  const onGridKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!loaded || editing) return;
    const mod = e.ctrlKey || e.metaKey;
    const key = e.key;
    if (mod && key.toLowerCase() === 'z') {
      e.preventDefault();
      return e.shiftKey ? redo() : undo();
    }
    if (mod && key.toLowerCase() === 'y') {
      e.preventDefault();
      return redo();
    }
    if (mod && key === '`') {
      e.preventDefault();
      return setShowFormulas((s) => !s);
    }
    if (mod && key.toLowerCase() === 'v') {
      // Fallback for browsers that do not dispatch "paste" to a non-editable element.
      pasteExpectedRef.current = true;
      window.setTimeout(() => {
        if (pasteExpectedRef.current && clipRef.current) pasteBlock(clipRef.current.raws, clipRef.current);
        pasteExpectedRef.current = false;
      }, 120);
      return;
    }
    if (mod && key.toLowerCase() === 'a') {
      e.preventDefault();
      return setSel({ anchor: { row: 0, col: 0 }, focus: { row: NUM_ROWS - 1, col: NUM_COLS - 1 } });
    }
    if (mod) return; // let the browser handle copy/cut and other shortcuts

    const arrows: Record<string, [number, number]> = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] };
    if (arrows[key]) {
      e.preventDefault();
      const [dr, dc] = arrows[key];
      return moveFocus(dr, dc, e.shiftKey);
    }
    switch (key) {
      case 'Enter':
        e.preventDefault();
        return e.shiftKey ? moveFocus(-1, 0) : startEdit('edit');
      case 'F2':
        e.preventDefault();
        return startEdit('edit');
      case 'Tab':
        e.preventDefault();
        return moveFocus(0, e.shiftKey ? -1 : 1);
      case 'Home':
        e.preventDefault();
        return moveFocus(0, -NUM_COLS, e.shiftKey);
      case 'End':
        e.preventDefault();
        return moveFocus(0, NUM_COLS, e.shiftKey);
      case 'Escape':
        return setSel((s) => ({ anchor: s.focus, focus: s.focus }));
      case 'Delete':
      case 'Backspace': {
        e.preventDefault();
        const { r0, r1, c0, c1 } = rectOf(sel);
        const changes: RawMap = {};
        for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) changes[toAddr(r, c)] = '';
        applyChanges(changes, r0 === r1 && c0 === c1 ? `Clear ${toAddr(r0, c0)}` : `Clear ${toAddr(r0, c0)}:${toAddr(r1, c1)}`);
        return;
      }
    }
    if (key.length === 1 && !e.altKey) {
      e.preventDefault();
      startEdit('enter', key);
    }
  };

  // ------------------------------------------------------------- mouse
  const onCellMouseDown = (e: React.MouseEvent, row: number, col: number) => {
    if (!loaded) return;
    const addr = toAddr(row, col);
    if (editing && addr !== editing.addr && wantsReference(editing.draft)) {
      // Point mode: clicking a cell while typing a formula inserts its reference.
      e.preventDefault();
      setEditing({ ...editing, draft: editing.draft + addr });
      window.setTimeout(() => {
        const el = editing.origin === 'bar' ? (document.getElementById('formula-input') as HTMLInputElement | null) : editorRef.current;
        el?.focus();
      }, 0);
      return;
    }
    if (editing && addr === editing.addr) return;
    if (editing) commitEdit();
    e.preventDefault();
    const c = { row, col };
    setSel((s) => (e.shiftKey ? { anchor: s.anchor, focus: c } : { anchor: c, focus: c }));
    draggingRef.current = true;
    gridRef.current?.focus({ preventScroll: true });
  };

  const onCellMouseEnter = (row: number, col: number) => {
    if (draggingRef.current) setSel((s) => ({ anchor: s.anchor, focus: { row, col } }));
  };

  useEffect(() => {
    const up = () => (draggingRef.current = false);
    window.addEventListener('mouseup', up);
    return () => window.removeEventListener('mouseup', up);
  }, []);

  // ------------------------------------------------------------- derived view data
  const rect = rectOf(sel);
  const deps = useMemo(() => {
    return {
      directPrec: new Set(sheet.directPrecedents(focusAddr)),
      allPrec: new Set(sheet.allPrecedents(focusAddr)),
      directDep: new Set(sheet.directDependents(focusAddr)),
      allDep: new Set(sheet.allDependents(focusAddr)),
    };
    // recalc.id changes on every edit, so the graph snapshot stays fresh.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sheet, focusAddr, recalc?.id, loaded]);

  const recalcSet = useMemo(() => new Set(recalc?.order ?? []), [recalc]);
  const flashClass = recalc && recalc.id > 1 ? (recalc.id % 2 ? 'flash-a' : 'flash-b') : '';

  const rec = sheet.getRecord(focusAddr);
  const focusValue = sheet.getValue(focusAddr);
  const focusRaw = sheet.getRaw(focusAddr);
  const focusType = !rec
    ? 'Empty'
    : rec.raw.startsWith('=')
      ? 'Formula'
      : typeof rec.value === 'number'
        ? 'Number'
        : typeof rec.value === 'boolean'
          ? 'Boolean'
          : 'Text';
  const cycleMembers = sheet.isInCycle(focusAddr) && isError(focusValue) ? focusValue.detail : null;
  const h = historyRef.current;
  const nonEmpty = Object.keys(sheet.toRawMap()).length;

  const chip = (a: string, cls: string) => (
    <button key={a} className={`chip ${cls}`} onClick={() => selectAddr(a)} title={`${a}: ${sheet.getRaw(a) || '(empty)'} → ${sheet.getDisplay(a)}`}>
      {a}
    </button>
  );

  const barValue = editing ? editing.draft : focusRaw;

  return (
    <div className="app">
      <header className="toolbar">
        <div className="brand">
          <span className="logo">Σ</span>
          <div>
            <h1>Reactive Spreadsheet</h1>
            <p>Formula engine · dependency graph · persistent backend</p>
          </div>
        </div>
        <div className="actions">
          <button onClick={undo} disabled={!h.undo.length} title="Undo (Ctrl/Cmd+Z)">
            Undo <span className="count">{h.undo.length}</span>
          </button>
          <button onClick={redo} disabled={!h.redo.length} title="Redo (Ctrl/Cmd+Shift+Z or Ctrl+Y)">
            Redo <span className="count">{h.redo.length}</span>
          </button>
          <label className="toggle" title="Show raw formulas in the grid (Ctrl/Cmd+`)">
            <input type="checkbox" checked={showFormulas} onChange={(e) => setShowFormulas(e.target.checked)} /> Show formulas
          </label>
          <button onClick={() => applyChanges(DEMO, 'Load demo')} disabled={!loaded}>
            Load demo
          </button>
          <button
            className="danger"
            disabled={!loaded || nonEmpty === 0}
            onClick={() => {
              const all: RawMap = {};
              Object.keys(sheet.toRawMap()).forEach((a) => (all[a] = ''));
              applyChanges(all, 'Clear sheet');
            }}
          >
            Clear sheet
          </button>
          <SaveBadge info={saveInfo} />
        </div>
      </header>

      <div className="formula-bar">
        <span className="name-box">{rect.r0 === rect.r1 && rect.c0 === rect.c1 ? focusAddr : `${toAddr(rect.r0, rect.c0)}:${toAddr(rect.r1, rect.c1)}`}</span>
        <span className="fx">fx</span>
        <input
          id="formula-input"
          value={barValue}
          disabled={!loaded}
          placeholder="Type a number, text, or a formula starting with ="
          spellCheck={false}
          onFocus={() => {
            if (!editing) setEditing({ addr: focusAddr, draft: focusRaw, mode: 'edit', origin: 'bar' });
            else if (editing.origin !== 'bar') setEditing({ ...editing, origin: 'bar', mode: 'edit' });
          }}
          onChange={(e) => editing && setEditing({ ...editing, draft: e.target.value })}
          onKeyDown={onEditorKeyDown}
          onBlur={() => {
            if (editing?.origin === 'bar') commitEdit();
          }}
        />
        <span className="computed" title="Computed value">
          = <b className={isError(focusValue) ? 'err' : ''}>{sheet.getDisplay(focusAddr) || '—'}</b>
        </span>
      </div>

      <main className="body">
        <div className="grid-wrap">
          {!loaded && <div className="overlay">{loadError ? `Could not reach the backend: ${loadError}. Is the server running (npm run dev)?` : 'Loading workbook…'}</div>}
          <div className="grid" ref={gridRef} tabIndex={0} onKeyDown={onGridKeyDown} aria-label="Spreadsheet grid" role="grid">
            <table>
              <thead>
                <tr>
                  <th className="corner" />
                  {Array.from({ length: NUM_COLS }, (_, c) => (
                    <th key={c} className={c >= rect.c0 && c <= rect.c1 ? 'hdr-active' : ''}>
                      {colToLetters(c)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: NUM_ROWS }, (_, r) => (
                  <tr key={r}>
                    <th className={r >= rect.r0 && r <= rect.r1 ? 'hdr-active' : ''}>{r + 1}</th>
                    {Array.from({ length: NUM_COLS }, (_, c) => {
                      const addr = toAddr(r, c);
                      const value = sheet.getValue(addr);
                      const raw = sheet.getRaw(addr);
                      const isFocus = r === sel.focus.row && c === sel.focus.col;
                      const inRange = r >= rect.r0 && r <= rect.r1 && c >= rect.c0 && c <= rect.c1;
                      const err = isError(value);
                      const cls = [
                        'cell',
                        isFocus ? 'focus' : '',
                        inRange && !isFocus ? 'in-range' : '',
                        deps.directPrec.has(addr) ? 'prec-direct' : deps.allPrec.has(addr) ? 'prec-indirect' : '',
                        deps.directDep.has(addr) ? 'dep-direct' : deps.allDep.has(addr) ? 'dep-indirect' : '',
                        sheet.isInCycle(addr) ? 'cycle' : '',
                        err ? 'error' : '',
                        typeof value === 'number' && !(showFormulas && raw.startsWith('=')) ? 'num' : '',
                        raw.startsWith('=') ? 'formula' : '',
                        recalcSet.has(addr) ? flashClass : '',
                      ]
                        .filter(Boolean)
                        .join(' ');
                      const isEditingHere = editing?.addr === addr && editing.origin === 'cell';
                      const text = showFormulas && raw.startsWith('=') ? raw : sheet.getDisplay(addr);
                      const title = raw ? `${addr}: ${raw}${err && value.detail ? `\n${value.detail}` : ''}` : addr;
                      return (
                        <td
                          key={c}
                          data-addr={addr}
                          className={cls}
                          title={title}
                          onMouseDown={(e) => onCellMouseDown(e, r, c)}
                          onMouseEnter={() => onCellMouseEnter(r, c)}
                          onDoubleClick={() => {
                            setSel({ anchor: { row: r, col: c }, focus: { row: r, col: c } });
                            setEditing({ addr, draft: raw, mode: 'edit', origin: 'cell' });
                          }}
                        >
                          {isEditingHere ? (
                            <input
                              ref={editorRef}
                              className="cell-editor"
                              value={editing.draft}
                              spellCheck={false}
                              onChange={(e) => setEditing({ ...editing, draft: e.target.value })}
                              onKeyDown={onEditorKeyDown}
                              onBlur={(e) => {
                                // Ignore blur caused by moving focus to the formula bar.
                                if (e.relatedTarget && (e.relatedTarget as HTMLElement).id === 'formula-input') return;
                                if (editingStill(addr)) commitEdit();
                              }}
                            />
                          ) : (
                            <span className="cell-text">{text}</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="inspector">
          <section>
            <h2>
              Cell <code>{focusAddr}</code> <span className="type">{focusType}</span>
            </h2>
            <dl>
              <dt>Raw</dt>
              <dd>
                <code className="raw">{focusRaw || '(empty)'}</code>
              </dd>
              <dt>Value</dt>
              <dd className={isError(focusValue) ? 'err' : ''}>{sheet.getDisplay(focusAddr) || '(empty)'}</dd>
              {isError(focusValue) && (
                <>
                  <dt>Error</dt>
                  <dd className="err-detail">{focusValue.detail ?? 'Propagated from a referenced cell'}</dd>
                </>
              )}
              {cycleMembers && (
                <>
                  <dt>Cycle</dt>
                  <dd className="err-detail">{cycleMembers}</dd>
                </>
              )}
            </dl>
          </section>

          <section>
            <h3>
              <span className="swatch prec" /> References ({deps.directPrec.size} direct, {deps.allPrec.size} total)
            </h3>
            <div className="chips">
              {deps.allPrec.size === 0 && <span className="muted">None</span>}
              {[...deps.allPrec].sort(addrCompare).map((a) => chip(a, deps.directPrec.has(a) ? 'prec' : 'prec-light'))}
            </div>
            <h3>
              <span className="swatch dep" /> Dependents ({deps.directDep.size} direct, {deps.allDep.size} total)
            </h3>
            <div className="chips">
              {deps.allDep.size === 0 && <span className="muted">None</span>}
              {[...deps.allDep].sort(addrCompare).map((a) => chip(a, deps.directDep.has(a) ? 'dep' : 'dep-light'))}
            </div>
            <p className="legend">
              Strong colour = direct, light = indirect (transitive). Red cells are members of a circular reference.
            </p>
          </section>

          <section>
            <h3>Last recalculation</h3>
            {recalc ? (
              <>
                <p className="muted">
                  {recalc.label}: {recalc.order.length} cell{recalc.order.length === 1 ? '' : 's'} evaluated (of {nonEmpty} non-empty) in dependency order
                </p>
                <div className="order">
                  {recalc.order.slice(0, 60).map((a, i) => (
                    <span key={a}>
                      {i > 0 && <span className="arrow">→</span>}
                      {chip(a, sheet.isInCycle(a) ? 'cyc' : 'plain')}
                    </span>
                  ))}
                  {recalc.order.length > 60 && <span className="muted"> … +{recalc.order.length - 60}</span>}
                </div>
              </>
            ) : (
              <p className="muted">No edits yet.</p>
            )}
          </section>

          <section>
            <h3>Workbook</h3>
            <p className="muted">
              Circular references:{' '}
              {sheet.cycleCells.length ? <span className="err">{sheet.cycleCells.join(', ')}</span> : 'none'}
            </p>
            <p className="muted">
              Server check:{' '}
              {verify ? (
                verify.mismatches.length === 0 ? (
                  <span className="ok">all {verify.total} stored values match the client engine</span>
                ) : (
                  <span className="err">mismatch at {verify.mismatches.slice(0, 8).join(', ')}</span>
                )
              ) : (
                '—'
              )}
            </p>
            <h3>History</h3>
            <ol className="history">
              {h.undo.length === 0 && <li className="muted">No edits yet</li>}
              {h.undo
                .slice(-8)
                .reverse()
                .map((e, i) => (
                  <li key={h.undo.length - i}>{e.label}</li>
                ))}
            </ol>
            <p className="muted small">Keeps the last {HISTORY_LIMIT} edits.</p>
          </section>
        </aside>
      </main>

      <footer className="help">
        <span>
          <kbd>Arrows</kbd> move · <kbd>Shift</kbd>+arrows select · <kbd>Enter</kbd>/<kbd>F2</kbd> edit · type to replace · <kbd>Del</kbd> clear ·{' '}
          <kbd>Ctrl/⌘ C X V</kbd> copy/cut/paste · <kbd>Ctrl/⌘ Z</kbd> undo · <kbd>Ctrl/⌘ Shift Z</kbd>/<kbd>Ctrl Y</kbd> redo · click a cell while typing a
          formula to insert its reference
        </span>
        <span className="muted">Functions: {SUPPORTED_FUNCTIONS.join(', ')} · operators + - * / ^ &amp; = &lt;&gt; &lt; &gt; &lt;= &gt;=</span>
      </footer>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );

  function editingStill(addr: string) {
    return stateRef.current.editing?.addr === addr;
  }
}

function SaveBadge({ info }: { info: SaveInfo }) {
  const label =
    info.state === 'saving'
      ? 'Saving…'
      : info.state === 'error'
        ? `Save failed – retrying (${info.error})`
        : info.state === 'saved'
          ? `Saved · v${info.version ?? 0}`
          : 'Not saved yet';
  return <span className={`save-badge ${info.state}`}>{label}</span>;
}
