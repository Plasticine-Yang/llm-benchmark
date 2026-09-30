import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { ArrowDown, ArrowRight, ArrowUpRight, Check, ChevronDown, CircleHelp, Clock3, Code2, Download, GitBranch, Grid2X2, Keyboard, Link2, Loader2, Plus, Redo2, RotateCcw, Trash2, Undo2, X, Zap } from 'lucide-react';
import { Workbook, ROWS, COLS, cellId, position, displayValue, validId, type Edit, type RawCells } from './engine';
import { demoCells } from './demo';
type Change = { before: Edit[]; after: Edit[] };
type Editor = { id: string; draft: string; source: 'cell' | 'bar' };
type SaveJob = { edits: Edit[] };
const sorted = (ids: Iterable<string>) => [...ids].sort((a, b) => { const [ar, ac] = position(a), [br, bc] = position(b); return ar - br || ac - bc; });
export default function App() {
  const book = useRef(new Workbook());
  const [version, render] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [selected, setSelected] = useState('D12');
  const [anchor, setAnchor] = useState('D12');
  const [editor, setEditor] = useState<Editor | null>(null);
  const editorRef = useRef<Editor | null>(null);
  const [showFormulas, setShowFormulas] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [dialog, setDialog] = useState<'clear' | 'demo' | null>(null);
  const [inspectorTab, setInspectorTab] = useState<'cell' | 'activity'>('cell');
  const [saveState, setSaveState] = useState<'saved' | 'saving' | 'error'>('saved');
  const [saveError, setSaveError] = useState('');
  const [loadError, setLoadError] = useState('');
  const [lastEdit, setLastEdit] = useState<null | { changed: string[]; recalculated: string[]; milliseconds: number }>(null);
  const [events, setEvents] = useState<{ ids: string[]; affected: number; time: string }[]>([]);
  const history = useRef<Change[]>([]), future = useRef<Change[]>([]);
  const revision = useRef(0), jobs = useRef<SaveJob[]>([]), saving = useRef(false), blocked = useRef(false);
  const gridRef = useRef<HTMLDivElement>(null), inputRef = useRef<HTMLInputElement>(null), formulaRef = useRef<HTMLInputElement>(null);
  const drag = useRef(false);
  const load = async () => {
    setLoadError('');
    try {
      const res = await fetch('/api/workbook');
      if (!res.ok) throw new Error('The workbook server is unavailable.');
      const data = await res.json();
      book.current = new Workbook(data.cells); revision.current = data.revision;
      setLoaded(true); render(v => v + 1);
    } catch (error) { setLoadError(String((error as Error).message)); }
  };
  useEffect(() => { void load(); }, []);
  useEffect(() => {
    const up = () => { drag.current = false; };
    window.addEventListener('pointerup', up);
    const unload = (event: BeforeUnloadEvent) => {
      if (jobs.current.length || editorRef.current) { event.preventDefault(); event.returnValue = ''; }
    };
    window.addEventListener('beforeunload', unload);
    return () => { window.removeEventListener('pointerup', up); window.removeEventListener('beforeunload', unload); };
  }, []);
  useEffect(() => {
    if (editor?.source === 'cell') { inputRef.current?.focus(); inputRef.current?.setSelectionRange(editor.draft.length, editor.draft.length); }
  }, [editor?.id, editor?.source]);
  useEffect(() => {
    gridRef.current?.querySelector(`[data-cell="${selected}"]`)?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [selected]);
  async function drain() {
    if (saving.current || blocked.current) return;
    saving.current = true; setSaveState('saving');
    while (jobs.current.length) {
      try {
        const response = await fetch('/api/workbook', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ edits: jobs.current[0].edits, revision: revision.current }) });
        const result = await response.json();
        if (!response.ok) {
          if (response.status === 409) blocked.current = true;
          throw new Error(result.error ?? 'Could not save workbook.');
        }
        revision.current = result.revision; jobs.current.shift();
      } catch (error) {
        setSaveError((error as Error).message); setSaveState('error'); saving.current = false; return;
      }
    }
    saving.current = false; setSaveState('saved'); setSaveError('');
  }
  function apply(edits: Edit[], record = true) {
    const after = edits.filter(e => book.current.get(e.id).raw !== e.raw);
    if (!after.length) return;
    const before = after.map(e => ({ id: e.id, raw: book.current.get(e.id).raw }));
    const start = performance.now();
    book.current.applyEdits(after);
    const recalculated = [...book.current.lastRecalculated];
    setLastEdit({ changed: after.map(e => e.id), recalculated, milliseconds: performance.now() - start });
    setEvents(old => [{ ids: after.map(e => e.id), affected: recalculated.length, time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }) }, ...old].slice(0, 30));
    if (record) { history.current.push({ before, after }); if (history.current.length > 100) history.current.shift(); future.current = []; }
    jobs.current.push({ edits: after }); void drain(); render(v => v + 1);
  }
  function setEditing(next: Editor | null) { editorRef.current = next; setEditor(next); }
  function startEditing(source: 'cell' | 'bar' = 'cell', draft?: string) {
    setEditing({ id: selected, draft: draft ?? book.current.get(selected).raw, source });
  }
  function move(rowDelta: number, colDelta: number, extend = false) {
    const [row, col] = position(selected);
    const next = cellId(Math.max(0, Math.min(ROWS - 1, row + rowDelta)), Math.max(0, Math.min(COLS - 1, col + colDelta)));
    setSelected(next); if (!extend) setAnchor(next);
  }
  function finish(moveDown = false, cancel = false) {
    const current = editorRef.current;
    if (!current) return;
    setEditing(null);
    if (!cancel) apply([{ id: current.id, raw: current.draft }]);
    if (moveDown) move(1, 0);
  }
  function focusGrid() { requestAnimationFrame(() => gridRef.current?.focus({ preventScroll: true })); }
  function select(id: string, extend = false) {
    finish(); setSelected(id); if (!extend) setAnchor(id); focusGrid();
  }
  function undo() {
    finish();
    const change = history.current.pop();
    if (change) { future.current.push(change); apply(change.before, false); }
    focusGrid();
  }
  function redo() {
    finish();
    const change = future.current.pop();
    if (change) { history.current.push(change); apply(change.after, false); }
    focusGrid();
  }
  const [sr, sc] = position(selected), [ar, ac] = position(anchor);
  const range = () => {
    const ids: string[] = [];
    for (let r = Math.min(sr, ar); r <= Math.max(sr, ar); r++) for (let c = Math.min(sc, ac); c <= Math.max(sc, ac); c++) ids.push(cellId(r, c));
    return ids;
  };
  const rangeIds = new Set(range());
  const rangeLabel = selected === anchor ? selected : `${cellId(Math.min(sr, ar), Math.min(sc, ac))}:${cellId(Math.max(sr, ar), Math.max(sc, ac))}`;
  const references = book.current.relations(selected, 'references');
  const dependents = book.current.relations(selected, 'dependents');
  const cell = book.current.get(selected);
  const occupied = [...book.current.cells.values()].filter(c => c.raw).length;
  const formulaCount = [...book.current.cells.values()].filter(c => c.raw.trimStart().startsWith('=')).length;
  const errorCount = [...book.current.cells.values()].filter(c => c.error).length;
  function onGridKey(event: KeyboardEvent<HTMLDivElement>) {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') { event.preventDefault(); event.shiftKey ? redo() : undo(); return; }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'y') { event.preventDefault(); redo(); return; }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'a' && !editorRef.current) { event.preventDefault(); setAnchor('A1'); setSelected(cellId(ROWS - 1, COLS - 1)); return; }
    if (editorRef.current) return;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
      event.preventDefault(); move(event.key === 'ArrowDown' ? 1 : event.key === 'ArrowUp' ? -1 : 0, event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0, event.shiftKey);
    } else if (event.key === 'Enter' || event.key === 'F2') { event.preventDefault(); startEditing(); }
    else if (event.key === 'Tab') { event.preventDefault(); move(0, event.shiftKey ? -1 : 1); }
    else if (event.key === 'Delete' || event.key === 'Backspace') { event.preventDefault(); apply(range().map(id => ({ id, raw: '' }))); }
    else if (event.key === 'Escape') { setAnchor(selected); }
    else if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) { event.preventDefault(); startEditing('cell', event.key); }
  }
  function onEditorKey(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') { event.preventDefault(); event.stopPropagation(); finish(true); focusGrid(); }
    if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); finish(false, true); focusGrid(); }
    if (event.key === 'Tab') { event.preventDefault(); event.stopPropagation(); finish(); move(0, event.shiftKey ? -1 : 1); focusGrid(); }
  }
  function exportCsv() {
    finish();
    const csv = Array.from({ length: ROWS }, (_, r) => Array.from({ length: COLS }, (_, c) => `"${String(book.current.get(cellId(r, c)).value).replaceAll('"', '""')}"`).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const link = document.createElement('a'); link.href = url; link.download = 'forma-workbook.csv'; link.click(); URL.revokeObjectURL(url);
  }
  function replaceSheet(raws: RawCells) {
    finish(); apply([...book.current.cells.keys()].map(id => ({ id, raw: raws[id] ?? '' }))); setDialog(null); select('A1');
  }
  const copyText = () => Array.from({ length: Math.abs(sr - ar) + 1 }, (_, r) => Array.from({ length: Math.abs(sc - ac) + 1 }, (_, c) => book.current.get(cellId(Math.min(sr, ar) + r, Math.min(sc, ac) + c)).raw).join('\t')).join('\n');
  const relatedSection = (kind: 'references' | 'dependents') => {
    const ids = kind === 'references' ? references : dependents;
    const direct = kind === 'references' ? cell.deps : book.current.dependents.get(selected)!;
    return <section className={`relations ${kind}`}>
      <div className="section-label"><span className="legend-dot" /><span>{kind === 'references' ? 'References' : 'Dependents'}</span><span className="count">{ids.size}</span></div>
      <p className="section-description">{kind === 'references' ? 'Cells that feed into this cell' : 'Cells affected when this cell changes'}</p>
      {ids.size ? <div className="relation-list">{sorted(ids).map(id => <button key={id} onClick={() => select(id)} className="relation-item"><span className="cell-chip">{id}</span><span className="relation-value">{displayValue(book.current.get(id).value) || 'Empty'}</span><span className="relation-kind">{direct.has(id) ? 'Direct' : 'Indirect'}</span><ArrowUpRight size={13} /></button>)}</div> : <div className="empty-relation">{kind === 'references' ? 'No cell references' : 'No dependent cells'}</div>}
    </section>;
  };
  void version;
  return <div className="app">
    <header className="app-header">
      <a className="brand" href="/" aria-label="Forma home"><span className="brand-mark"><Grid2X2 size={20} strokeWidth={2.5} /></span><span>forma<span className="brand-period">.</span></span></a>
      <div className="header-divider" /><span className="header-label">WORKSPACE</span>
      <div className={`save-indicator ${saveState}`} role="status">{saveState === 'saved' ? <Check size={14} /> : saveState === 'saving' ? <Loader2 size={14} className="spin" /> : <CircleHelp size={14} />}<span>{saveState === 'saved' ? 'All changes saved' : saveState === 'saving' ? 'Saving changes…' : 'Changes not saved'}</span></div>
      <button className="icon-button help-button" title="Keyboard shortcuts & formula guide" aria-label="Open help" onClick={() => setShowHelp(true)}><CircleHelp size={19} /></button><div className="avatar">YO</div>
    </header>
    <main className="workspace">
      <div className="page-heading"><div><div className="eyebrow">YOUR WORKBOOK</div><h1>Reactive playground <span className="live-badge"><span />Live</span></h1><p>A little spreadsheet. Everything connected.</p></div><button className="button export-button" onClick={exportCsv} disabled={!loaded}><Download size={15} />Export CSV</button></div>
      {saveState === 'error' && <div className="error-banner" role="alert">{saveError}<button onClick={() => blocked.current ? window.location.reload() : void drain()}>{blocked.current ? 'Reload workbook' : 'Retry save'}</button></div>}
      <div className="editor-layout">
        <section className="sheet-panel" aria-label="Workbook">
          <div className="sheet-toolbar"><div className="toolbar-title"><Grid2X2 size={16} /><span>Sheet 1</span><ChevronDown size={13} /></div><div className="toolbar-separator" /><button className="icon-button" title="Undo (⌘/Ctrl Z)" aria-label="Undo" onClick={undo} disabled={!history.current.length || !loaded}><Undo2 size={17} /></button><button className="icon-button" title="Redo (⌘/Ctrl Shift Z)" aria-label="Redo" onClick={redo} disabled={!future.current.length || !loaded}><Redo2 size={17} /></button><div className="toolbar-separator" /><button className={`formula-toggle ${showFormulas ? 'active' : ''}`} onClick={() => setShowFormulas(v => !v)} aria-pressed={showFormulas} title="Toggle raw formulas"><Code2 size={16} /><span>Show formulas</span></button><div className="toolbar-spacer" /><button className="icon-button" title="Restore example workbook" aria-label="Restore example" onClick={() => setDialog('demo')} disabled={!loaded}><RotateCcw size={16} /></button><button className="icon-button" title="Clear workbook" aria-label="Clear workbook" onClick={() => setDialog('clear')} disabled={!loaded}><Trash2 size={16} /></button></div>
          <div className="formula-bar"><span className="address-box" aria-label="Selected cell">{rangeLabel}<ChevronDown size={12} /></span><span className="fx">ƒx</span><input ref={formulaRef} aria-label="Formula bar" disabled={!loaded} value={editor?.id === selected ? editor.draft : cell.raw} placeholder="Enter a value or a formula…" onFocus={() => startEditing('bar')} onChange={e => setEditing({ id: selected, source: 'bar', draft: e.target.value })} onKeyDown={onEditorKey} onBlur={() => finish()} /><span className="formula-bar-hint">{editor ? '↵ to apply' : cell.ast ? 'FORMULA' : 'VALUE'}</span></div>
          {!loaded ? <div className="loading-state">{loadError ? <><CircleHelp size={24} /><p>{loadError}</p><button className="button" onClick={() => void load()}>Retry connection</button></> : <><Loader2 size={24} className="spin" /><p>Opening your workbook…</p></>}</div> : <div className="grid-scroll" ref={gridRef} tabIndex={0} role="region" aria-label="Editable spreadsheet. Use arrows to navigate and Enter to edit." onKeyDown={onGridKey}
            onCopy={event => { if (editorRef.current) return; event.preventDefault(); event.clipboardData.setData('text/plain', copyText()); }}
            onCut={event => { if (editorRef.current) return; event.preventDefault(); event.clipboardData.setData('text/plain', copyText()); apply(range().map(id => ({ id, raw: '' }))); }}
            onPaste={event => {
              if (editorRef.current) return;
              event.preventDefault();
              const text = event.clipboardData.getData('text/plain').replace(/\r\n?/g, '\n').replace(/\n$/, '');
              const lines = text.split('\n').map(row => row.split('\t'));
              const edits: Edit[] = [];
              lines.forEach((line, dr) => line.forEach((raw, dc) => { if (sr + dr < ROWS && sc + dc < COLS) edits.push({ id: cellId(sr + dr, sc + dc), raw }); }));
              apply(edits); setAnchor(selected); setSelected(cellId(Math.min(ROWS - 1, sr + lines.length - 1), Math.min(COLS - 1, sc + Math.max(...lines.map(l => l.length)) - 1)));
            }}>
            <table className="spreadsheet" role="grid" aria-rowcount={ROWS} aria-colcount={COLS} aria-label="Sheet 1"><colgroup><col className="row-number-col" />{Array.from({ length: COLS }, (_, col) => <col key={col} />)}</colgroup><thead><tr><th className="corner"><span /></th>{Array.from({ length: COLS }, (_, col) => <th key={col} className={col === sc ? 'selected-header' : ''} scope="col">{String.fromCharCode(65 + col)}</th>)}</tr></thead><tbody>{Array.from({ length: ROWS }, (_, row) => <tr key={row}><th scope="row" className={row === sr ? 'selected-header' : ''}>{row + 1}</th>{Array.from({ length: COLS }, (_, col) => {
              const id = cellId(row, col), c = book.current.get(id);
              const active = id === selected, isEditing = editor?.id === id && editor.source === 'cell';
              let overflow = 1;
              if (!showFormulas && typeof c.value === 'string' && !c.error && c.raw && !isEditing) while (col + overflow < COLS && !book.current.get(cellId(row, col + overflow)).raw && cellId(row, col + overflow) !== selected) overflow++;
              const heading = ['A1', 'A17', 'G4'].includes(id);
              return <td key={id} data-cell={id} role="gridcell" aria-label={`${id}: ${String(c.value) || 'empty'}${c.ast ? `, formula ${c.raw}` : ''}`} aria-selected={rangeIds.has(id)} className={[active ? 'selected-cell' : '', rangeIds.has(id) && !active && selected !== anchor ? 'range-selected' : '', references.has(id) ? 'reference-cell' : '', dependents.has(id) ? 'dependent-cell' : '', c.error ? 'error-cell' : '', typeof c.value === 'number' && !showFormulas ? 'number-cell' : '', c.ast ? 'formula-cell' : '', row === 3 && col < 4 || row === 11 && col < 4 && c.raw ? 'emphasis-cell' : '', heading ? 'heading-cell' : '', ['A2', 'G10', 'G11', 'A18', 'A19', 'A20'].includes(id) ? 'muted-cell' : ''].filter(Boolean).join(' ')}
                title={`${id}${c.ast ? ` · ${c.raw}` : ''}${c.error ? ` · ${c.error}` : ''}`}
                onPointerDown={event => { if (isEditing) return; event.preventDefault(); select(id, event.shiftKey); drag.current = true; }} onPointerEnter={() => { if (drag.current) setSelected(id); }} onDoubleClick={() => { setSelected(id); setAnchor(id); startEditing('cell', c.raw); }}>
                {isEditing ? <input ref={inputRef} className="cell-input" aria-label={`Edit ${id}`} value={editor.draft} onChange={event => setEditing({ ...editor, draft: event.target.value })} onKeyDown={onEditorKey} onBlur={() => finish()} /> : <><span className="cell-content" style={overflow > 1 ? { width: `calc(${overflow * 100}% + ${(overflow - 1)}px - 16px)` } : undefined}>{showFormulas && c.ast ? c.raw : displayValue(c.value)}</span>{c.ast && !showFormulas && <span className="formula-corner" />}{c.error && <span className="error-corner" />}</>}
                {active && !isEditing && <span className="selection-handle" />}
              </td>;
            })}</tr>)}</tbody></table>
          </div>}
          <div className="sheet-bottom"><div className="sheet-tab"><Grid2X2 size={13} />Sheet 1<span className="tab-dot" /></div><span className="sheet-dimensions">{ROWS} rows × {COLS} columns</span><span className="selection-summary">{rangeIds.size > 1 ? `${rangeIds.size} cells selected` : `${selected} selected`}</span></div>
        </section>
        <aside className="inspector"><div className="inspector-tabs"><button className={inspectorTab === 'cell' ? 'active' : ''} onClick={() => setInspectorTab('cell')}><GitBranch size={15} />Cell inspector</button><button className={inspectorTab === 'activity' ? 'active' : ''} onClick={() => setInspectorTab('activity')}><Clock3 size={15} />Activity</button></div>
          {inspectorTab === 'cell' ? <div className="inspector-content"><div className="inspector-cell-heading"><span className="selected-cell-label">{selected}</span><span className={`cell-type ${cell.error ? 'error' : ''}`}>{cell.error ? 'Error' : cell.ast ? 'Formula' : typeof cell.value === 'number' ? 'Number' : cell.raw ? 'Text' : 'Empty'}</span></div><div className={`computed-card ${cell.error ? 'has-error' : ''}`}><div className="section-label">COMPUTED VALUE</div><div className="computed-value">{displayValue(cell.value) || '—'}</div>{cell.error && <p className="error-explanation">{cell.error === '#CYCLE!' ? 'A circular dependency was detected in this calculation.' : cell.error === '#DIV/0!' ? 'This calculation divides by zero or averages an empty range.' : cell.error === '#REF!' ? 'A reference points outside A1:J24.' : 'This formula contains invalid syntax or a nonnumeric value.'}</p>}</div><div className="raw-section"><div className="section-label">{cell.ast || cell.raw.trimStart().startsWith('=') ? 'RAW FORMULA' : 'RAW VALUE'}</div><button className="raw-value" onClick={() => { formulaRef.current?.focus(); }} title="Click to edit in formula bar"><span className="raw-fx">ƒx</span><code>{cell.raw || 'Empty cell'}</code></button></div>
          <div className="dependency-heading"><Link2 size={15} /><span>Dependency map</span><span className="mini-badge">LIVE</span></div>
          {references.size || dependents.size ? <div className="connection-map"><span className="map-count refs">{references.size}<small>upstream</small></span><ArrowRight size={14} /><span className="map-selected">{selected}</span><ArrowRight size={14} /><span className="map-count deps">{dependents.size}<small>downstream</small></span></div> : <div className="no-connections"><GitBranch size={21} /><p>This cell stands on its own.</p><span>Add a formula to connect it.</span></div>}
          {relatedSection('references')}{relatedSection('dependents')}
          <div className="inspector-tip"><Zap size={15} /><p>Only affected cells recalculate.<br />Connections update as you edit.</p></div></div> : <div className="activity-content"><div className="section-label">RECALCULATION LOG</div><p className="activity-intro">Every edit, and the cells it updates.</p>{!events.length ? <div className="activity-empty"><Clock3 size={28} /><h3>Ready when you are</h3><p>Edit any cell to watch the engine work.</p></div> : events.map((entry, index) => <div className="activity-entry" key={`${entry.time}-${index}`}><span className="activity-dot" /><div><strong>{entry.ids.slice(0, 3).join(', ')}{entry.ids.length > 3 ? ` +${entry.ids.length - 3}` : ''} updated</strong><p>{entry.affected} cells recalculated</p><time>{entry.time}</time></div></div>)}{lastEdit && <div className="recalc-order"><div className="section-label">LAST EVALUATION ORDER</div><p>{lastEdit.recalculated.join(' → ')}</p><small>{lastEdit.milliseconds.toFixed(2)} ms · unaffected cells kept cached</small></div>}</div>}
        </aside>
      </div>
      <div className="under-grid"><div className="legend"><span><i className="legend-dot references" />References</span><span><i className="legend-dot dependents" />Dependents</span><span><i className="legend-dot selection" />Selected cell</span></div><button className="shortcut-link" onClick={() => setShowHelp(true)}><Keyboard size={15} />Keyboard shortcuts<kbd>?</kbd></button></div>
      <div className="engine-status"><span className="engine-ready"><Zap size={14} />Reactive engine ready</span><span className="status-divider" /><span>{occupied} filled cells</span><span>{formulaCount} formulas</span>{errorCount > 0 && <span className="status-errors">{errorCount} errors</span>}<span className="status-spacer" /><span>{lastEdit ? `${lastEdit.recalculated.length} cells recalculated · ${lastEdit.milliseconds.toFixed(2)} ms` : 'Dependencies tracked. Changes connected.'}</span></div>
    </main>
    {showHelp && <div className="modal-backdrop" onClick={() => setShowHelp(false)}><section className="modal help-modal" role="dialog" aria-modal="true" aria-label="Spreadsheet guide" onClick={e => e.stopPropagation()}><button className="modal-close icon-button" onClick={() => setShowHelp(false)} aria-label="Close help"><X size={20} /></button><span className="modal-icon"><Keyboard size={24} /></span><h2>A few useful shortcuts</h2><p>Small grid. Familiar controls.</p><div className="shortcut-list">{[['Move between cells', '↑ ↓ ← →'], ['Edit selected cell', 'Enter / F2'], ['Commit and move down', 'Enter'], ['Commit and move right', 'Tab'], ['Cancel editing', 'Esc'], ['Extend selection', 'Shift + arrows'], ['Copy / paste / cut', '⌘ / Ctrl + C / V / X'], ['Undo / redo', '⌘ / Ctrl + Z / Shift Z'], ['Clear selected cells', 'Delete / Backspace']].map(([label, key]) => <div key={label}><span>{label}</span><kbd>{key}</kbd></div>)}</div><h3>Make a connection</h3><div className="formula-examples"><code>=A1 * 2 + (B1 / 4)</code><code>=SUM(A1:A5) + AVG(B1:B5)</code></div><p className="guide-note">References use A1:J24. SUM and AVG ignore text and blank cells in ranges. Errors propagate through formulas. Circular references display #CYCLE!.</p><button className="button primary" onClick={() => { setShowHelp(false); focusGrid(); }}>Got it<ArrowRight size={15} /></button></section></div>}
    {dialog && <div className="modal-backdrop" onClick={() => setDialog(null)}><section className="modal confirm-modal" role="dialog" aria-modal="true" aria-label={dialog === 'clear' ? 'Clear workbook' : 'Restore example'} onClick={e => e.stopPropagation()}><button className="modal-close icon-button" onClick={() => setDialog(null)} aria-label="Cancel"><X size={20} /></button><span className="modal-icon">{dialog === 'clear' ? <Trash2 size={24} /> : <RotateCcw size={24} />}</span><h2>{dialog === 'clear' ? 'Start with a clean sheet?' : 'Bring back the example?'}</h2><p>{dialog === 'clear' ? 'Clear all values and formulas in this workbook.' : 'Replace the current sheet with the launch budget and dependency playground.'} You can undo this change.</p><div className="modal-actions"><button className="button" onClick={() => setDialog(null)}>Cancel</button><button className="button primary" onClick={() => replaceSheet(dialog === 'clear' ? {} : demoCells)}>{dialog === 'clear' ? 'Clear sheet' : 'Restore example'}</button></div></section></div>}
  </div>;
}
