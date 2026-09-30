/**
 * The interface: editable grid, selection, keyboard model, clipboard,
 * undo/redo, dependency tracing and the inspector panel.
 *
 * Everything is created imperatively so the widget can be mounted into any
 * container (and into jsdom, which is how it is smoke-tested).
 */
import { SpreadsheetEngine, CELL_KIND, formatNumber } from '../engine/engine.js';
import { refName, parseRef, colName } from '../engine/refs.js';
import { ERR } from '../engine/errors.js';

const UNDO_LIMIT = 100;
const SAVE_DEBOUNCE_MS = 400;

const DEMO_CHAIN = {
  A1: '10',
  A2: '=A1*2',
  A3: '=A2+5',
  A4: '=SUM(A1:A3)',
  B1: '=AVG(A1:A4)',
  B2: '=A4-B1',
  C1: '=IF(A4>50,"big","small")',
  C2: '=ROUND(B1,2)',
  D1: '=SUM(A1:A4)*2-A2',
};

const DEMO_CYCLE = {
  E1: '=E2+1',
  E2: '=E1+1',
  E3: '=E1*2',
};

const DEMO_ERRORS = {
  F1: '=A1/0',
  F2: '=A0',
  F3: '="text"*2',
  F4: '=SUM(A1:A3)/0',
  F5: '=NOSUCHFN(1)',
};

export function mountApp(root, options = {}) {
  const engine = options.engine || new SpreadsheetEngine({ rows: options.rows || 60, cols: options.cols || 26 });
  const api = options.api || null;
  const onEngineEvent = options.onEngineEvent || (() => {});

  const state = {
    anchor: { r: 0, c: 0 },
    focus: { r: 0, c: 0 },
    editing: null, // {ref, original}
    clipboard: '',
    undo: [],
    redo: [],
    trace: true,
    saveTimer: null,
    saveStatus: 'local',
    lastTouched: [],
  };

  root.innerHTML = '';
  root.classList.add('rse-app');

  /* ------------------------------------------------------------------ *
   * chrome
   * ------------------------------------------------------------------ */
  const toolbar = el('header', 'toolbar');
  const brand = el('div', 'brand');
  brand.innerHTML = '<span class="dot"></span>Reactive Sheet';
  toolbar.appendChild(brand);

  const btnUndo = button('Undo', 'undo', 'Ctrl+Z');
  const btnRedo = button('Redo', 'redo', 'Ctrl+Shift+Z');
  const btnDemo = button('Demo chain', 'demo', 'fill a 4-level dependency chain');
  const btnCycle = button('Inject cycle', 'cycle', 'create an indirect circular reference');
  const btnErrors = button('Inject errors', 'errors', 'create #DIV/0!, #REF!, #VALUE!, #NAME?');
  const btnClear = button('Clear', 'clear', 'empty the sheet');
  const traceLabel = el('label', 'toggle');
  const traceBox = document.createElement('input');
  traceBox.type = 'checkbox';
  traceBox.checked = true;
  traceBox.addEventListener('change', () => {
    state.trace = traceBox.checked;
    render();
  });
  traceLabel.appendChild(traceBox);
  traceLabel.appendChild(document.createTextNode('Trace deps'));

  toolbar.append(btnUndo, btnRedo, sep(), btnDemo, btnCycle, btnErrors, btnClear, sep(), traceLabel);
  const spacer = el('div', 'spacer');
  const saveStatus = el('div', 'save-status');
  saveStatus.textContent = 'local';
  toolbar.append(spacer, saveStatus);

  /* formula bar */
  const bar = el('div', 'formula-bar');
  const addr = el('div', 'addr');
  const fx = el('div', 'fx');
  fx.textContent = 'fx';
  const formulaInput = document.createElement('input');
  formulaInput.className = 'formula-input';
  formulaInput.spellcheck = false;
  formulaInput.autocomplete = 'off';
  formulaInput.addEventListener('keydown', (e) => {
    e.stopPropagation();
    if (e.key === 'Enter') {
      e.preventDefault();
      commitFormulaBar();
      moveSelection(1, 0);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      formulaInput.value = engine.getRaw(activeRef());
      formulaInput.blur();
    }
  });
  formulaInput.addEventListener('blur', () => {
    if (formulaInput.value !== engine.getRaw(activeRef())) commitFormulaBar();
  });
  bar.append(addr, fx, formulaInput);

  /* body */
  const body = el('main', 'body');
  const gridWrap = el('div', 'grid-wrap');
  const inspector = el('aside', 'inspector');
  body.append(gridWrap, inspector);

  const statusbar = el('footer', 'statusbar');
  root.append(toolbar, bar, body, statusbar);

  /* ------------------------------------------------------------------ *
   * grid
   * ------------------------------------------------------------------ */
  const cellNodes = new Map(); // ref -> td
  const colHeaders = new Map();
  const rowHeaders = new Map();

  const table = document.createElement('table');
  table.className = 'grid';
  const thead = document.createElement('thead');
  const headRow = document.createElement('tr');
  const corner = document.createElement('th');
  corner.className = 'corner';
  headRow.appendChild(corner);
  for (let c = 0; c < engine.cols; c += 1) {
    const th = document.createElement('th');
    th.className = 'col-head';
    th.textContent = colName(c);
    colHeaders.set(c, th);
    headRow.appendChild(th);
  }
  thead.appendChild(headRow);

  const tbody = document.createElement('tbody');
  for (let r = 0; r < engine.rows; r += 1) {
    const tr = document.createElement('tr');
    const th = document.createElement('th');
    th.className = 'row-head';
    th.textContent = String(r + 1);
    rowHeaders.set(r, th);
    tr.appendChild(th);
    for (let c = 0; c < engine.cols; c += 1) {
      const ref = refName(c, r);
      const td = document.createElement('td');
      td.className = 'cell';
      td.dataset.ref = ref;
      td.dataset.r = String(r);
      td.dataset.c = String(c);
      const span = document.createElement('span');
      span.className = 'cell-text';
      td.appendChild(span);
      cellNodes.set(ref, td);
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  }
  table.append(thead, tbody);
  gridWrap.appendChild(table);

  gridWrap.addEventListener('mousedown', (e) => {
    const td = e.target.closest ? e.target.closest('td.cell') : null;
    if (!td) return;
    if (state.editing) commitEdit();
    const r = Number(td.dataset.r);
    const c = Number(td.dataset.c);
    if (e.shiftKey) {
      state.focus = { r, c };
    } else {
      state.anchor = { r, c };
      state.focus = { r, c };
    }
    render();
  });

  gridWrap.addEventListener('dblclick', (e) => {
    const td = e.target.closest ? e.target.closest('td.cell') : null;
    if (!td) return;
    startEdit(td.dataset.ref);
  });

  /* ------------------------------------------------------------------ *
   * helpers
   * ------------------------------------------------------------------ */
  function el(tag, className) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    return node;
  }

  function sep() {
    return el('div', 'sep');
  }

  function button(label, act, title) {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = label;
    b.dataset.act = act;
    if (title) b.title = title;
    b.addEventListener('click', () => runAction(act));
    return b;
  }

  function activeRef() {
    return refName(state.anchor.c, state.anchor.r);
  }

  function selRect() {
    return {
      r0: Math.min(state.anchor.r, state.focus.r),
      r1: Math.max(state.anchor.r, state.focus.r),
      c0: Math.min(state.anchor.c, state.focus.c),
      c1: Math.max(state.anchor.c, state.focus.c),
    };
  }

  function clamp(r, c) {
    return {
      r: Math.max(0, Math.min(engine.rows - 1, r)),
      c: Math.max(0, Math.min(engine.cols - 1, c)),
    };
  }

  function moveSelection(dr, dc, extend = false) {
    const base = extend ? state.focus : state.anchor;
    const next = clamp(base.r + dr, base.c + dc);
    if (extend) {
      state.focus = next;
    } else {
      state.anchor = next;
      state.focus = { ...next };
    }
    render();
    scrollIntoView();
  }

  function scrollIntoView() {
    const td = cellNodes.get(activeRef());
    if (td && td.scrollIntoView) {
      try {
        td.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      } catch {
        /* jsdom has no layout */
      }
    }
  }

  /* ------------------------------------------------------------------ *
   * editing
   * ------------------------------------------------------------------ */
  function startEdit(ref, initial, { replace = false } = {}) {
    if (state.editing) commitEdit();
    const td = cellNodes.get(ref);
    if (!td) return;
    const original = engine.getRaw(ref);
    const input = document.createElement('input');
    input.className = 'cell-editor';
    input.spellcheck = false;
    input.value = replace ? (initial || '') : (initial !== undefined ? initial : original);
    td.appendChild(input);
    td.classList.add('editing');
    state.editing = { ref, original, input };
    input.focus();
    if (replace) {
      input.setSelectionRange(input.value.length, input.value.length);
    } else {
      input.select();
    }

    input.addEventListener('keydown', (e) => {
      e.stopPropagation();
      if (e.key === 'Enter') {
        e.preventDefault();
        commitEdit();
        moveSelection(e.shiftKey ? -1 : 1, 0);
      } else if (e.key === 'Tab') {
        e.preventDefault();
        commitEdit();
        moveSelection(0, e.shiftKey ? -1 : 1);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        cancelEdit();
      }
    });
    input.addEventListener('blur', () => {
      if (state.editing && state.editing.ref === ref) commitEdit();
    });
  }

  function commitEdit() {
    const editing = state.editing;
    if (!editing) return;
    const value = editing.input.value;
    teardownEditor();
    if (value !== editing.original) {
      applyChanges([{ ref: editing.ref, before: editing.original, after: value }]);
    } else {
      render();
    }
  }

  function cancelEdit() {
    teardownEditor();
    render();
  }

  function teardownEditor() {
    const editing = state.editing;
    if (!editing) return;
    if (editing.input.parentNode) editing.input.parentNode.removeChild(editing.input);
    const td = cellNodes.get(editing.ref);
    if (td) td.classList.remove('editing');
    state.editing = null;
  }

  function commitFormulaBar() {
    const ref = activeRef();
    const before = engine.getRaw(ref);
    const after = formulaInput.value;
    if (before !== after) applyChanges([{ ref, before, after }]);
    else render();
  }

  /* ------------------------------------------------------------------ *
   * mutations / undo / redo
   * ------------------------------------------------------------------ */
  function applyChanges(changes, { record = true } = {}) {
    if (!changes.length) return null;
    const result = engine.setMany(changes.map((ch) => [ch.ref, ch.after]));
    if (record) {
      state.undo.push({ changes, at: Date.now() });
      if (state.undo.length > UNDO_LIMIT) state.undo.shift();
      state.redo.length = 0;
    }
    state.lastTouched = result.recalculated;
    scheduleSave();
    render();
    onEngineEvent({ type: 'change', changes, result });
    return result;
  }

  function undo() {
    const entry = state.undo.pop();
    if (!entry) return;
    teardownEditor();
    engine.setMany(entry.changes.map((ch) => [ch.ref, ch.before]));
    state.redo.push(entry);
    state.lastTouched = [];
    scheduleSave();
    render();
    onEngineEvent({ type: 'undo', entry });
  }

  function redo() {
    const entry = state.redo.pop();
    if (!entry) return;
    teardownEditor();
    engine.setMany(entry.changes.map((ch) => [ch.ref, ch.after]));
    state.undo.push(entry);
    state.lastTouched = entry.changes.map((ch) => ch.ref);
    scheduleSave();
    render();
    onEngineEvent({ type: 'redo', entry });
  }

  function runAction(act) {
    switch (act) {
      case 'undo': undo(); break;
      case 'redo': redo(); break;
      case 'demo': loadSample(DEMO_CHAIN); break;
      case 'cycle': loadSample(DEMO_CYCLE); break;
      case 'errors': loadSample(DEMO_ERRORS); break;
      case 'clear': clearAll(); break;
      default: break;
    }
  }

  function loadSample(sample) {
    const changes = [];
    for (const [ref, after] of Object.entries(sample)) {
      const before = engine.getRaw(ref);
      if (before !== after) changes.push({ ref, before, after });
    }
    applyChanges(changes);
    selectRef(Object.keys(sample)[0]);
  }

  function clearAll() {
    const changes = [];
    for (const ref of engine.serialize ? Object.keys(engine.serialize()) : []) {
      changes.push({ ref, before: engine.getRaw(ref), after: '' });
    }
    applyChanges(changes);
  }

  function selectRef(ref) {
    const p = parseRef(ref);
    if (!p) return;
    state.anchor = { r: p.row, c: p.col };
    state.focus = { ...state.anchor };
    render();
    scrollIntoView();
  }

  /* ------------------------------------------------------------------ *
   * clipboard
   * ------------------------------------------------------------------ */
  function selectionMatrix() {
    const { r0, r1, c0, c1 } = selRect();
    const rows = [];
    for (let r = r0; r <= r1; r += 1) {
      const row = [];
      for (let c = c0; c <= c1; c += 1) row.push(engine.getRaw(refName(c, r)));
      rows.push(row);
    }
    return rows;
  }

  function toTSV(matrix) {
    return matrix.map((row) => row.join('\t')).join('\n');
  }

  function onCopy(e) {
    if (isTextInput(e.target)) return;
    const tsv = toTSV(selectionMatrix());
    state.clipboard = tsv;
    if (e.clipboardData) {
      e.clipboardData.setData('text/plain', tsv);
      e.preventDefault();
    }
  }

  function onCut(e) {
    if (isTextInput(e.target)) return;
    onCopy(e);
    clearSelection();
  }

  function onPaste(e) {
    if (isTextInput(e.target)) return;
    let text = '';
    if (e.clipboardData) text = e.clipboardData.getData('text/plain') || '';
    if (!text) text = state.clipboard;
    if (!text) return;
    e.preventDefault();
    pasteText(text);
  }

  function isTextInput(node) {
    return Boolean(node && node.tagName && (node.tagName === 'INPUT' || node.tagName === 'TEXTAREA'));
  }

  function pasteText(text) {
    const rows = String(text).replace(/\r\n?/g, '\n').split('\n');
    if (rows.length && rows[rows.length - 1] === '') rows.pop();
    const changes = [];
    const start = state.anchor;
    rows.forEach((line, dr) => {
      const cols = line.split('\t');
      cols.forEach((cellText, dc) => {
        const r = start.r + dr;
        const c = start.c + dc;
        if (r >= engine.rows || c >= engine.cols) return;
        const ref = refName(c, r);
        const before = engine.getRaw(ref);
        if (before === cellText) return;
        changes.push({ ref, before, after: cellText });
      });
    });
    state.anchor = clamp(start.r + rows.length - 1, start.c);
    state.focus = { ...state.anchor };
    applyChanges(changes);
  }

  function clearSelection() {
    const { r0, r1, c0, c1 } = selRect();
    const changes = [];
    for (let r = r0; r <= r1; r += 1) {
      for (let c = c0; c <= c1; c += 1) {
        const ref = refName(c, r);
        const before = engine.getRaw(ref);
        if (before !== '') changes.push({ ref, before, after: '' });
      }
    }
    applyChanges(changes);
  }

  function selectAll() {
    state.anchor = { r: 0, c: 0 };
    state.focus = { r: engine.rows - 1, c: engine.cols - 1 };
    render();
  }

  /* ------------------------------------------------------------------ *
   * events
   * ------------------------------------------------------------------ */
  function onKeyDown(e) {
    if (state.editing) return;
    if (isTextInput(e.target)) return;
    const mod = e.ctrlKey || e.metaKey;
    const key = e.key;

    if (mod && (key === 'z' || key === 'Z')) {
      e.preventDefault();
      if (e.shiftKey) redo(); else undo();
      return;
    }
    if (mod && (key === 'y' || key === 'Y')) {
      e.preventDefault();
      redo();
      return;
    }
    if (mod && (key === 'a' || key === 'A')) {
      e.preventDefault();
      selectAll();
      return;
    }
    if (mod && (key === 'c' || key === 'C' || key === 'x' || key === 'X' || key === 'v' || key === 'V')) {
      // handled by copy/cut/paste events, but keep an internal copy fallback
      if (key === 'c' || key === 'C') state.clipboard = toTSV(selectionMatrix());
      return;
    }

    switch (key) {
      case 'ArrowUp': e.preventDefault(); moveSelection(-1, 0, e.shiftKey); return;
      case 'ArrowDown': e.preventDefault(); moveSelection(1, 0, e.shiftKey); return;
      case 'ArrowLeft': e.preventDefault(); moveSelection(0, -1, e.shiftKey); return;
      case 'ArrowRight': e.preventDefault(); moveSelection(0, 1, e.shiftKey); return;
      case 'Tab': e.preventDefault(); moveSelection(0, e.shiftKey ? -1 : 1); return;
      case 'Home': e.preventDefault(); state.anchor = { r: state.anchor.r, c: 0 }; state.focus = { ...state.anchor }; render(); return;
      case 'End': e.preventDefault(); state.anchor = { r: state.anchor.r, c: engine.cols - 1 }; state.focus = { ...state.anchor }; render(); return;
      case 'PageDown': e.preventDefault(); moveSelection(10, 0, e.shiftKey); return;
      case 'PageUp': e.preventDefault(); moveSelection(-10, 0, e.shiftKey); return;
      case 'Enter': e.preventDefault(); startEdit(activeRef(), engine.getRaw(activeRef())); return;
      case 'F2': e.preventDefault(); startEdit(activeRef(), engine.getRaw(activeRef())); return;
      case 'Delete':
      case 'Backspace': e.preventDefault(); clearSelection(); return;
      case 'Escape': e.preventDefault(); render(); return;
      default: break;
    }

    if (key.length === 1 && !mod && !e.altKey) {
      e.preventDefault();
      startEdit(activeRef(), key, { replace: true });
    }
  }

  document.addEventListener('keydown', onKeyDown);
  document.addEventListener('copy', onCopy);
  document.addEventListener('cut', onCut);
  document.addEventListener('paste', onPaste);

  /* ------------------------------------------------------------------ *
   * rendering
   * ------------------------------------------------------------------ */
  function render() {
    const rect = selRect();
    const active = activeRef();
    const showTrace = state.trace;
    const precDepths = showTrace ? engine.transitivePrecedents(active) : new Map();
    const depDepths = showTrace ? engine.transitiveDependents(active) : new Map();
    const cycleSet = engine.cycles;

    for (const [ref, td] of cellNodes) {
      const text = engine.getDisplay(ref);
      const span = td.firstChild;
      if (span.textContent !== text) span.textContent = text;

      const kind = engine.getKind(ref);
      const value = engine.getValue(ref);
      const classes = ['cell'];
      if (kind === CELL_KIND.FORMULA) classes.push('formula');
      if (kind === CELL_KIND.NUMBER) classes.push('number');
      if (value.e) classes.push('error');
      if (cycleSet.has(ref)) classes.push('cycle');

      const p = parseRef(ref);
      if (p.row >= rect.r0 && p.row <= rect.r1 && p.col >= rect.c0 && p.col <= rect.c1) {
        classes.push('selected');
        if (ref === active) classes.push('active');
      }
      if (showTrace && ref !== active) {
        if (precDepths.has(ref)) {
          classes.push('trace-prec');
          if (precDepths.get(ref) === 1) classes.push('trace-direct');
        } else if (depDepths.has(ref)) {
          classes.push('trace-dep');
          if (depDepths.get(ref) === 1) classes.push('trace-direct');
        }
      }
      const cls = classes.join(' ');
      if (td.className !== cls) td.className = cls;
      const title = value.e
        ? `${ref} = ${engine.getRaw(ref) || '(empty)'}  ->  ${value.e}`
        : `${ref} = ${engine.getRaw(ref) || '(empty)'}`;
      if (td.title !== title) td.title = title;
    }

    // header highlight
    for (const [c, th] of colHeaders) {
      const on = c >= rect.c0 && c <= rect.c1;
      const cls = on ? 'col-head on' : 'col-head';
      if (th.className !== cls) th.className = cls;
    }
    for (const [r, th] of rowHeaders) {
      const on = r >= rect.r0 && r <= rect.r1;
      const cls = on ? 'row-head on' : 'row-head';
      if (th.className !== cls) th.className = cls;
    }

    addr.textContent = active;
    if (document.activeElement !== formulaInput) {
      formulaInput.value = engine.getRaw(active);
    }
    btnUndo.disabled = state.undo.length === 0;
    btnRedo.disabled = state.redo.length === 0;

    renderInspector(precDepths, depDepths);
    renderStatus(active);
  }

  function renderStatus(active) {
    let formulas = 0;
    let errors = 0;
    for (const ref of engine.raw.keys()) {
      const v = engine.getValue(ref);
      if (engine.getKind(ref) === CELL_KIND.FORMULA) formulas += 1;
      if (v.e) errors += 1;
    }
    const parts = [
      `${engine.raw.size} filled`,
      `${formulas} formulas`,
      `${engine.lastRecalc.length} recalculated last pass`,
    ];
    if (errors) parts.push(`${errors} error cell${errors === 1 ? '' : 's'}`);
    if (engine.cycles.size) parts.push(`${engine.cycles.size} in cycle`);
    parts.push(`undo ${state.undo.length}/${UNDO_LIMIT}`);
    const text = parts.join(' · ');
    if (statusbar.textContent !== text) statusbar.textContent = text;
    statusbar.dataset.active = active;
  }

  function renderInspector(precDepths, depDepths) {
    const ref = activeRef();
    const raw = engine.getRaw(ref);
    const kind = engine.getKind(ref);
    const cell = engine.getValue(ref);
    const valueText = cell.e ? cell.e : engine.getDisplay(ref);
    const directPrec = engine.getPrecedents(ref);
    const directDep = engine.getDependents(ref);

    const chips = (refs, cls) => (refs.length
      ? refs.map((r) => `<span class="chip ${cls}" data-goto="${r}">${r}</span>`).join('')
      : '<span class="muted">none</span>');

    const recalcList = state.lastTouched.length
      ? state.lastTouched.slice(0, 40).map((r, i) => `<span class="chip order" data-goto="${r}">${i + 1}. ${r}</span>`).join('')
      : '<span class="muted">no recalculation yet</span>';

    inspector.innerHTML = `
      <section class="ins-block">
        <h3>Cell ${escapeHtml(ref)}</h3>
        <div class="kv"><span>raw</span><code>${escapeHtml(raw === '' ? '(empty)' : raw)}</code></div>
        <div class="kv"><span>type</span><code>${kind}</code></div>
        <div class="kv"><span>value</span><code class="${cell.e ? 'err' : 'val'}">${escapeHtml(valueText)}</code></div>
        ${engine.cycles.has(ref) ? '<div class="warn">This cell participates in a circular reference.</div>' : ''}
      </section>
      <section class="ins-block">
        <h3>References <em>(${directPrec.length} direct · ${precDepths.size} transitive)</em></h3>
        <div class="chips">${chips(directPrec, 'prec')}</div>
      </section>
      <section class="ins-block">
        <h3>Dependents <em>(${directDep.length} direct · ${depDepths.size} transitive)</em></h3>
        <div class="chips">${chips(directDep, 'dep')}</div>
      </section>
      <section class="ins-block">
        <h3>Last recalculation order</h3>
        <div class="chips">${recalcList}</div>
      </section>
    `;

    for (const chip of inspector.querySelectorAll('[data-goto]')) {
      chip.addEventListener('click', () => selectRef(chip.dataset.goto));
    }
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (ch) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[ch]));
  }

  /* ------------------------------------------------------------------ *
   * persistence
   * ------------------------------------------------------------------ */
  function scheduleSave() {
    if (!api) return;
    setSaveStatus('saving…');
    if (state.saveTimer) clearTimeout(state.saveTimer);
    state.saveTimer = setTimeout(() => {
      state.saveTimer = null;
      persist();
    }, SAVE_DEBOUNCE_MS);
  }

  async function persist() {
    if (!api) return;
    try {
      await api.save(engine.serialize());
      setSaveStatus(`saved ${new Date().toLocaleTimeString()}`);
    } catch (err) {
      setSaveStatus(`save failed: ${err.message}`);
    }
  }

  function setSaveStatus(text) {
    state.saveStatus = text;
    saveStatus.textContent = text;
  }

  async function loadFromServer() {
    if (!api) return;
    setSaveStatus('loading…');
    try {
      const data = await api.load();
      engine.load((data && data.cells) || {});
      engine.recalculateAll();
      setSaveStatus(`loaded ${new Date().toLocaleTimeString()}`);
      render();
    } catch (err) {
      setSaveStatus(`load failed: ${err.message}`);
    }
  }

  /* ------------------------------------------------------------------ *
   * public surface
   * ------------------------------------------------------------------ */
  const app = {
    engine,
    state,
    render,
    selectRef,
    startEdit,
    commitEdit,
    cancelEdit,
    applyChanges,
    undo,
    redo,
    pasteText,
    loadSample,
    clearAll,
    loadFromServer,
    persist,
    moveSelection,
    getActiveRef: activeRef,
    destroy() {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('copy', onCopy);
      document.removeEventListener('cut', onCut);
      document.removeEventListener('paste', onPaste);
    },
  };

  render();
  if (api && options.autoLoad !== false) loadFromServer();

  return app;
}

export { formatNumber, ERR };
