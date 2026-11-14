import './styles.css';
import { Workbook } from './engine/workbook.js';
import {
  ROWS,
  COLS,
  colLettersFromIndex,
  makeCellId,
  parseCellRef,
  inBounds,
  shiftFormula,
} from './engine/cells.js';
import { displayValue } from './engine/evaluator.js';

const $ = (id) => document.getElementById(id);
const grid = $('grid');
const gridScroll = $('grid-scroll');
const formulaInput = $('formula-input');
const cellEls = new Map(); // id -> <td>

const wb = new Workbook();
const state = {
  selected: 'A1',
  anchor: 'A1',
  dragging: false,
  showFormulas: false,
  editing: null,
  clipboard: null,
  serverComputed: {},
  verifyText: '正在校验…',
  saveVersion: 0,
  saveMode: 'connecting',
  flashIds: new Set(),
  flashToken: 0,
};

const DEMO = {
  A1: '100',
  A2: '3',
  A3: '7',
  A5: '2',
  B1: '=A1*2', // level 1
  C1: '=B1+10', // level 2
  C2: '=AVG(A1:A5)',
  C3: '=5',
  D1: '=SUM(C1:C3)/2', // level 3
  E1: '=D1+C1', // additional branch
  F1: '=1/0',
  F2: '=F1*3',
  G1: '=A100',
  G2: '=G1+1',
  H1: 'hello',
  H2: '=H1+1',
  I1: '=ROUND(SUM(A1:A3)/3,2)',
  J1: '提示：修改 A1 观察三级级联重算',
};

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function selectionRect() {
  const a = parseCellRef(state.anchor);
  const b = parseCellRef(state.selected);
  return {
    r1: Math.min(a.row, b.row),
    r2: Math.max(a.row, b.row),
    c1: Math.min(a.col, b.col),
    c2: Math.max(a.col, b.col),
  };
}

function inRect(id, rect) {
  const ref = parseCellRef(id);
  return ref.row >= rect.r1 && ref.row <= rect.r2 && ref.col >= rect.c1 && ref.col <= rect.c2;
}

// ------------------------------------------------------------------ grid DOM

function buildGrid() {
  const thead = document.createElement('thead');
  const headRow = document.createElement('tr');
  const corner = document.createElement('th');
  corner.className = 'corner';
  headRow.appendChild(corner);
  for (let c = 0; c < COLS; c++) {
    const th = document.createElement('th');
    th.textContent = colLettersFromIndex(c);
    headRow.appendChild(th);
  }
  thead.appendChild(headRow);

  const tbody = document.createElement('tbody');
  for (let r = 1; r <= ROWS; r++) {
    const tr = document.createElement('tr');
    const rh = document.createElement('th');
    rh.className = 'row-head';
    rh.textContent = String(r);
    tr.appendChild(rh);
    for (let c = 0; c < COLS; c++) {
      const id = makeCellId(r, c);
      const td = document.createElement('td');
      td.className = 'cell';
      td.dataset.id = id;
      const div = document.createElement('div');
      div.className = 'cell-text';
      td.appendChild(div);
      tr.appendChild(td);
      cellEls.set(id, td);
    }
    tbody.appendChild(tr);
  }
  grid.append(thead, tbody);
  $('badge-grid').textContent = `${ROWS} × ${COLS}`;
}

// ------------------------------------------------------------------ rendering

function renderGrid() {
  const selected = state.selected;
  const directPrec = new Set(wb.getDeps(selected));
  const transPrec = new Set(wb.getTransitiveDeps(selected));
  const directDep = new Set(wb.getDependents(selected));
  const transDep = new Set(wb.getTransitiveDependents(selected));
  const rect = selectionRect();

  for (const [id, td] of cellEls) {
    if (state.editing && state.editing.id === id) continue;
    let textEl = td.querySelector('.cell-text');
    if (!textEl) {
      td.innerHTML = '';
      textEl = document.createElement('div');
      textEl.className = 'cell-text';
      td.appendChild(textEl);
    }

    const raw = wb.getRaw(id);
    const computed = wb.getComputed(id);
    textEl.textContent = state.showFormulas ? raw : displayValue(computed);

    const classes = ['cell'];
    if (id === selected) classes.push('selected');
    else if (inRect(id, rect)) classes.push('in-range');
    if (computed.type === 'error') classes.push('is-error');
    if (computed.type === 'number') classes.push('numeric');
    if (wb.isFormula(raw)) classes.push('is-formula');
    if (id !== selected) {
      if (directPrec.has(id)) classes.push('hl-prec', 'direct');
      else if (transPrec.has(id)) classes.push('hl-prec', 'indirect');
      if (directDep.has(id)) classes.push('hl-dep', 'direct');
      else if (transDep.has(id)) classes.push('hl-dep', 'indirect');
    }
    if (state.flashIds.has(id)) classes.push('flash');
    td.className = classes.join(' ');
    td.title = wb.isFormula(raw)
      ? `${id}  ${raw}  →  ${displayValue(computed)}`
      : `${id}${raw ? `  ${raw}` : ''}`;
  }
}

function renderFormulaBar() {
  $('active-cell').textContent = state.selected;
  if (document.activeElement !== formulaInput) {
    formulaInput.value = wb.getRaw(state.selected);
  }
}

function renderInspector() {
  const id = state.selected;
  const raw = wb.getRaw(id);
  const computed = wb.getComputed(id);
  $('inspect-tag').textContent = id;
  $('inspect-type').textContent = wb.isFormula(raw)
    ? '公式'
    : raw === ''
      ? '空'
      : computed.type === 'number'
        ? '数字'
        : '文本';
  $('inspect-raw').textContent = raw === '' ? '（空）' : raw;
  const valueEl = $('inspect-value');
  valueEl.textContent = displayValue(computed) || '（空）';
  valueEl.className = computed.type === 'error' ? 'value-error' : '';
  const errorEl = $('inspect-error');
  errorEl.textContent = computed.error || '—';
  errorEl.className = computed.error ? 'value-error' : '';

  renderDepMap();
  renderDepLists();
  renderFormulaTable();
  renderRecalcLog();
}

function renderDepMap() {
  const id = state.selected;
  const prec = wb.getDeps(id);
  const dep = wb.getDependents(id);
  const shownPrec = prec.slice(0, 6);
  const shownDep = dep.slice(0, 6);
  const n = Math.max(shownPrec.length, shownDep.length, 1);
  const W = 320;
  const H = Math.max(110, 34 * (n + 1));
  const nodeW = 74;
  const nodeH = 24;
  const centerX = W / 2;
  const centerY = H / 2;
  const leftX = 10;
  const rightX = W - 10 - nodeW;
  const yAt = (i) => (H * (i + 1)) / (n + 1);

  let svg = `<svg viewBox="0 0 ${W} ${H}" width="100%" height="${H}" role="img" aria-label="依赖关系图">`;
  svg += '<defs><marker id="arrow-prec" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0,0 L7,3.5 L0,7 z" fill="#3b82f6"/></marker>';
  svg += '<marker id="arrow-dep" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0,0 L7,3.5 L0,7 z" fill="#f59e0b"/></marker></defs>';

  shownPrec.forEach((p, i) => {
    const y = yAt(i);
    svg += `<path d="M ${leftX + nodeW} ${y} C ${leftX + nodeW + 30} ${y}, ${centerX - nodeW / 2 - 30} ${centerY}, ${centerX - nodeW / 2 - 3} ${centerY}" fill="none" stroke="#3b82f6" stroke-width="1.4" marker-end="url(#arrow-prec)"/>`;
  });
  shownDep.forEach((d, i) => {
    const y = yAt(i);
    svg += `<path d="M ${centerX + nodeW / 2} ${centerY} C ${centerX + nodeW / 2 + 30} ${centerY}, ${rightX - 30} ${y}, ${rightX - 3} ${y}" fill="none" stroke="#f59e0b" stroke-width="1.4" marker-end="url(#arrow-dep)"/>`;
  });

  shownPrec.forEach((p, i) => {
    const y = yAt(i) - nodeH / 2;
    svg += `<rect x="${leftX}" y="${y}" width="${nodeW}" height="${nodeH}" rx="5" fill="#dbeafe" stroke="#3b82f6"/>`;
    svg += `<text x="${leftX + nodeW / 2}" y="${y + nodeH / 2}" text-anchor="middle" dominant-baseline="central" font-size="11" font-family="ui-monospace,monospace" fill="#1e3a8a">${escapeHtml(p)}</text>`;
  });
  shownDep.forEach((d, i) => {
    const y = yAt(i) - nodeH / 2;
    svg += `<rect x="${rightX}" y="${y}" width="${nodeW}" height="${nodeH}" rx="5" fill="#fef3c7" stroke="#f59e0b"/>`;
    svg += `<text x="${rightX + nodeW / 2}" y="${y + nodeH / 2}" text-anchor="middle" dominant-baseline="central" font-size="11" font-family="ui-monospace,monospace" fill="#92400e">${escapeHtml(d)}</text>`;
  });

  svg += `<rect x="${centerX - nodeW / 2}" y="${centerY - nodeH / 2}" width="${nodeW}" height="${nodeH}" rx="5" fill="#1d4ed8"/>`;
  svg += `<text x="${centerX}" y="${centerY}" text-anchor="middle" dominant-baseline="central" font-size="12" font-weight="700" font-family="ui-monospace,monospace" fill="#ffffff">${escapeHtml(id)}</text>`;
  const extra = Math.max(0, prec.length - 6) + Math.max(0, dep.length - 6);
  if (extra) {
    svg += `<text x="${W / 2}" y="${H - 5}" text-anchor="middle" font-size="10" fill="#64748b">另有 ${extra} 个关系见下方列表</text>`;
  }
  svg += '</svg>';

  $('dep-map').innerHTML = prec.length === 0 && dep.length === 0
    ? `${svg}<p class="empty-note">该单元格当前没有依赖或被依赖关系</p>`
    : svg;
}

function chipList(containerId, ids, emptyText) {
  const el = $(containerId);
  if (ids.length === 0) {
    el.innerHTML = `<span class="empty-note">${escapeHtml(emptyText)}</span>`;
    return;
  }
  el.innerHTML = ids
    .map((id) => `<button class="chip" data-goto="${escapeHtml(id)}">${escapeHtml(id)}</button>`)
    .join('');
}

function renderDepLists() {
  const id = state.selected;
  const prec = wb.getDeps(id);
  const dep = wb.getTransitiveDependents(id);
  $('prec-count').textContent = String(prec.length);
  $('dep-count').textContent = String(dep.length);
  chipList('prec-list', prec, '无');
  chipList('dep-list', dep, '无');
}

function renderFormulaTable() {
  const cells = wb.formulaCells();
  $('formula-count').textContent = String(cells.length);
  const rows = cells
    .map((id) => {
      const raw = wb.getRaw(id);
      const value = displayValue(wb.getComputed(id));
      const isError = wb.getComputed(id).type === 'error';
      return `<tr data-goto="${escapeHtml(id)}"><td class="mono">${escapeHtml(id)}</td><td class="mono raw-cell" title="${escapeHtml(raw)}">${escapeHtml(raw)}</td><td class="mono ${isError ? 'value-error' : ''}">${escapeHtml(value)}</td></tr>`;
    })
    .join('');
  $('formula-rows').innerHTML = rows ||
    '<tr><td colspan="3" class="empty-note">还没有公式。试试在 A1 输入 =1+2</td></tr>';
}

function renderRecalcLog() {
  const ch = wb.lastChange;
  if (!ch) {
    $('recalc-log').innerHTML = '<span class="empty-note">尚未编辑</span>';
    return;
  }
  const changed = ch.changed.length ? ch.changed.join(', ') : '载入工作簿';
  const affected = ch.affected;
  const chips = affected
    .slice(0, 26)
    .map((id) => `<span class="log-chip">${escapeHtml(id)}</span>`)
    .join('');
  const more = affected.length > 26 ? `<span class="log-chip">+${affected.length - 26}</span>` : '';
  const cycle = ch.cycleNodes.length
    ? `<div class="log-cycle">循环单元：${escapeHtml(ch.cycleNodes.join(', '))} → #CYCLE!</div>`
    : '';
  $('recalc-log').innerHTML = `
    <div class="log-line">触发单元格：<strong>${escapeHtml(changed)}</strong></div>
    <div class="log-line">本次仅重算 <strong>${ch.recomputed}</strong> 个单元格${ch.full ? '（全量校验）' : '（依赖闭包）'}</div>
    <div class="log-chips">${chips}${more}</div>
    ${cycle}`;
}

function renderStatus() {
  $('stat-cells').textContent = `单元格 ${wb.raw.size}`;
  $('stat-formulas').textContent = `公式 ${wb.formulaCells().length}`;
  $('stat-errors').textContent = `错误 ${wb.errorCells().length}`;
  const ch = wb.lastChange;
  $('stat-recalc').textContent = ch ? `上次重算 ${ch.recomputed} 格` : '上次重算 —';
  $('stat-verify').textContent = state.verifyText;
  $('btn-undo').disabled = !wb.canUndo();
  $('btn-redo').disabled = !wb.canRedo();
}

function setSaveMode(mode, detail = '') {
  state.saveMode = mode;
  const el = $('save-status');
  el.className = `save-status ${mode}`;
  const labels = {
    connecting: '连接后端…',
    saving: '保存中…',
    saved: '已保存',
    offline: '离线（仅内存）',
    error: '保存失败',
  };
  el.textContent = `${labels[mode] || mode}${detail ? ` · ${detail}` : ''}`;
}

function renderAll() {
  renderGrid();
  renderFormulaBar();
  renderInspector();
  renderStatus();
}

function toast(message) {
  const el = $('toast');
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => el.classList.remove('show'), 2800);
}

function flash(ids) {
  state.flashIds = new Set(ids);
  const token = ++state.flashToken;
  renderAll();
  setTimeout(() => {
    if (token !== state.flashToken) return;
    state.flashIds = new Set();
    renderAll();
  }, 750);
}

// ------------------------------------------------------------------ editing

function scrollIntoView(id) {
  const td = cellEls.get(id);
  if (td) td.scrollIntoView({ block: 'nearest', inline: 'nearest' });
}

function selectCell(id, extend = false) {
  if (!cellEls.has(id)) return;
  state.selected = id;
  if (!extend) state.anchor = id;
  renderAll();
}

function moveSelection(dRow, dCol, extend = false) {
  const ref = parseCellRef(state.selected);
  const id = makeCellId(clamp(ref.row + dRow, 1, ROWS), clamp(ref.col + dCol, 0, COLS - 1));
  selectCell(id, extend);
  scrollIntoView(id);
}

function startEdit(id, initialValue) {
  if (state.editing) finishEdit(true);
  const td = cellEls.get(id);
  if (!td) return;
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'cell-editor';
  input.spellcheck = false;
  input.autocomplete = 'off';
  input.value = initialValue !== undefined ? initialValue : wb.getRaw(id);
  td.innerHTML = '';
  td.appendChild(input);
  td.classList.add('editing');
  state.editing = { id, input };
  input.focus();
  input.setSelectionRange(input.value.length, input.value.length);
  input.addEventListener('keydown', onEditorKeydown);
  input.addEventListener('blur', () => {
    if (state.editing && state.editing.input === input) finishEdit(true);
  });
}

function onEditorKeydown(e) {
  if (e.key === 'Enter') {
    e.preventDefault();
    finishEdit(true, [1, 0]);
  } else if (e.key === 'Tab') {
    e.preventDefault();
    finishEdit(true, [0, e.shiftKey ? -1 : 1]);
  } else if (e.key === 'Escape') {
    e.preventDefault();
    finishEdit(false);
  }
}

function finishEdit(shouldCommit, move) {
  const ed = state.editing;
  if (!ed) return;
  const { id, input } = ed;
  const value = input.value;
  state.editing = null;
  const td = cellEls.get(id);
  td.classList.remove('editing');
  td.innerHTML = '';
  const div = document.createElement('div');
  div.className = 'cell-text';
  td.appendChild(div);

  if (shouldCommit) applyCells({ [id]: value });
  else renderAll();
  if (move) moveSelection(move[0], move[1]);
  gridScroll.focus({ preventScroll: true });
}

function applyCells(changes) {
  const result = wb.commit(changes);
  if (!result) renderAll(); // no-op edits still refresh the UI
  return result;
}

function clearSelection() {
  const rect = selectionRect();
  const changes = {};
  for (let r = rect.r1; r <= rect.r2; r++) {
    for (let c = rect.c1; c <= rect.c2; c++) {
      changes[makeCellId(r, c)] = '';
    }
  }
  applyCells(changes);
}

// ------------------------------------------------------------------ clipboard

function copySelection() {
  const rect = selectionRect();
  const lines = [];
  for (let r = rect.r1; r <= rect.r2; r++) {
    const row = [];
    for (let c = rect.c1; c <= rect.c2; c++) {
      row.push(wb.getRaw(makeCellId(r, c)));
    }
    lines.push(row.join('\t'));
  }
  const tsv = lines.join('\n');
  state.clipboard = { tsv, r1: rect.r1, c1: rect.c1 };
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(tsv).catch(() => {});
  }
  return tsv;
}

function pasteText(text) {
  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = normalized.split('\n');
  while (lines.length > 1 && lines[lines.length - 1] === '') lines.pop();
  const matrix = lines.map((line) => line.split('\t'));
  const dest = selectionRect();
  const internal = state.clipboard && state.clipboard.tsv === normalized;
  const dRow = internal ? dest.r1 - state.clipboard.r1 : 0;
  const dCol = internal ? dest.c1 - state.clipboard.c1 : 0;

  const changes = {};
  let count = 0;
  for (let i = 0; i < matrix.length; i++) {
    for (let j = 0; j < matrix[i].length; j++) {
      const r = dest.r1 + i;
      const c = dest.c1 + j;
      if (!inBounds(r, c)) continue;
      let value = matrix[i][j];
      if (value.trimStart().startsWith('=')) value = shiftFormula(value, dRow, dCol);
      changes[makeCellId(r, c)] = value;
      count++;
    }
  }
  applyCells(changes);
  toast(`已粘贴 ${count} 个单元格${dRow || dCol ? '（相对引用已平移）' : ''}`);
}

// ------------------------------------------------------------------ persistence

let saveTimer = null;

function computeDiffs(serverComputed) {
  const local = wb.computedSnapshot();
  const ids = new Set([...Object.keys(local), ...Object.keys(serverComputed || {})]);
  const diffs = [];
  for (const id of ids) {
    const a = local[id] ? local[id].display : '';
    const b = serverComputed[id] ? serverComputed[id].display : '';
    if (a !== b) diffs.push(id);
  }
  return diffs;
}

function scheduleSave() {
  setSaveMode('saving');
  clearTimeout(saveTimer);
  saveTimer = setTimeout(save, 350);
}

async function save() {
  const payload = { cells: wb.snapshot() };
  try {
    const response = await fetch('/api/workbook', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok || !data.ok) throw new Error(data.error || `HTTP ${response.status}`);
    state.saveVersion = data.version;
    state.serverComputed = data.computed || {};
    const diffs = computeDiffs(state.serverComputed);
    state.verifyText = diffs.length
      ? `⚠ 客户端 / 服务端计算不一致：${diffs.slice(0, 3).join(', ')}`
      : `服务端独立复算一致 ✓ · v${data.version}`;
    setSaveMode('saved', `v${data.version}`);
    renderStatus();
  } catch (e) {
    state.verifyText = '持久化失败（修改仍在内存中）';
    setSaveMode('error', String(e.message || e));
    renderStatus();
  }
}

async function boot() {
  try {
    const response = await fetch('/api/workbook');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    state.serverComputed = data.computed || {};
    state.saveVersion = data.version || 0;
    wb.load(data.cells || {});
    const diffs = computeDiffs(state.serverComputed);
    state.verifyText = diffs.length
      ? `⚠ 重载后计算值不一致：${diffs.slice(0, 3).join(', ')}`
      : data.version
        ? `重载校验通过 ✓ · 原始值与计算值一致 (v${data.version})`
        : '空工作簿已就绪';
    setSaveMode('saved', `v${data.version || 0}`);
  } catch (e) {
    state.verifyText = '后端不可用（离线模式）';
    setSaveMode('offline');
    toast('无法连接后端：修改暂时只保存在内存中');
  }
  renderAll();
}

// ------------------------------------------------------------------ demo data

function loadDemo() {
  const changes = {};
  for (const id of Object.keys(wb.snapshot())) changes[id] = '';
  Object.assign(changes, DEMO);
  applyCells(changes);
  selectCell('A1');
  toast('示例已载入：修改 A1 观察 B1 → C1 → D1 → E1 级联重算');
}

function cycleDemo() {
  applyCells({
    K1: '=K2+1',
    K2: '=K3+1',
    K3: '=K1+1',
    K4: '=K1*2',
  });
  selectCell('K1');
  toast('已制造 K1→K2→K3→K1 三级间接循环，全部显示 #CYCLE!');
}

// ------------------------------------------------------------------ events

function isTextInputFocused() {
  const el = document.activeElement;
  return !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);
}

function bindEvents() {
  gridScroll.addEventListener('mousedown', (e) => {
    const td = e.target.closest('td[data-id]');
    if (!td) return;
    // Clicking inside the active editor (e.g. to move the caret) must not commit it.
    if (state.editing && state.editing.id === td.dataset.id) return;
    if (state.editing) finishEdit(true);
    state.dragging = true;
    selectCell(td.dataset.id, e.shiftKey);
    gridScroll.focus({ preventScroll: true });
  });

  gridScroll.addEventListener('mousemove', (e) => {
    if (!state.dragging) return;
    const td = e.target.closest('td[data-id]');
    if (td && td.dataset.id !== state.selected) selectCell(td.dataset.id, true);
  });

  document.addEventListener('mouseup', () => {
    state.dragging = false;
  });

  gridScroll.addEventListener('dblclick', (e) => {
    if (state.editing) return;
    const td = e.target.closest('td[data-id]');
    if (td) startEdit(td.dataset.id);
  });

  document.addEventListener('keydown', (e) => {
    if (e.target === formulaInput) return; // handled separately
    if (isTextInputFocused()) return; // the cell editor handles its own keys

    const mod = e.ctrlKey || e.metaKey;
    const key = e.key.toLowerCase();

    if (mod && key === 's') {
      e.preventDefault();
      save();
      return;
    }
    if (mod && key === 'z') {
      e.preventDefault();
      if (e.shiftKey) wb.redo();
      else wb.undo();
      return;
    }
    if (mod && key === 'y') {
      e.preventDefault();
      wb.redo();
      return;
    }
    if (mod && key === 'x') {
      e.preventDefault();
      copySelection();
      clearSelection();
      toast('已剪切选区');
      return;
    }
    if (mod && (key === 'c' || key === 'v')) return; // let copy/paste events run

    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        moveSelection(-1, 0, e.shiftKey);
        break;
      case 'ArrowDown':
        e.preventDefault();
        moveSelection(1, 0, e.shiftKey);
        break;
      case 'ArrowLeft':
        e.preventDefault();
        moveSelection(0, -1, e.shiftKey);
        break;
      case 'ArrowRight':
        e.preventDefault();
        moveSelection(0, 1, e.shiftKey);
        break;
      case 'Tab':
        e.preventDefault();
        moveSelection(0, e.shiftKey ? -1 : 1);
        break;
      case 'Enter':
      case 'F2':
        e.preventDefault();
        startEdit(state.selected);
        break;
      case 'Delete':
      case 'Backspace':
        e.preventDefault();
        clearSelection();
        break;
      case 'Escape':
        state.anchor = state.selected;
        renderAll();
        break;
      default:
        if (e.key.length === 1 && !e.altKey && !mod) {
          e.preventDefault();
          startEdit(state.selected, e.key);
        }
        break;
    }
  });

  document.addEventListener('copy', (e) => {
    if (isTextInputFocused()) return;
    const tsv = copySelection();
    e.clipboardData.setData('text/plain', tsv);
    e.preventDefault();
    toast(`已复制 ${selectionRect().r2 - selectionRect().r1 + 1} 行 × ${selectionRect().c2 - selectionRect().c1 + 1} 列`);
  });

  document.addEventListener('paste', async (e) => {
    if (isTextInputFocused()) return;
    let text = e.clipboardData ? e.clipboardData.getData('text/plain') : '';
    if (!text && state.clipboard) text = state.clipboard.tsv;
    e.preventDefault();
    if (text) {
      pasteText(text);
    } else if (navigator.clipboard && window.isSecureContext) {
      try {
        const fallback = await navigator.clipboard.readText();
        if (fallback) pasteText(fallback);
      } catch {
        toast('剪贴板不可读，请先使用页面内复制');
      }
    }
  });

  formulaInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const id = state.selected;
      applyCells({ [id]: formulaInput.value });
      formulaInput.blur();
      gridScroll.focus({ preventScroll: true });
      renderAll();
    } else if (e.key === 'Escape') {
      formulaInput.value = wb.getRaw(state.selected);
      formulaInput.blur();
    }
  });

  document.querySelector('.inspector').addEventListener('click', onGotoClick);

  $('btn-undo').addEventListener('click', () => {
    if (!wb.undo()) toast('没有可撤销的操作');
  });
  $('btn-redo').addEventListener('click', () => {
    if (!wb.redo()) toast('没有可重做的操作');
  });
  $('toggle-formulas').addEventListener('change', (e) => {
    state.showFormulas = e.target.checked;
    renderAll();
  });
  $('btn-demo').addEventListener('click', loadDemo);
  $('btn-cycle').addEventListener('click', cycleDemo);
  $('btn-save').addEventListener('click', () => save());
  $('btn-clear').addEventListener('click', () => {
    if (!window.confirm('确定清空整个工作簿吗？该操作可以用撤销恢复。')) return;
    const changes = {};
    for (const id of Object.keys(wb.snapshot())) changes[id] = '';
    if (Object.keys(changes).length) applyCells(changes);
  });
}

function onGotoClick(e) {
  const target = e.target.closest('[data-goto]');
  if (!target) return;
  const id = target.dataset.goto;
  selectCell(id);
  scrollIntoView(id);
}

wb.subscribe((event) => {
  if (event.type === 'change') {
    flash(event.change.affected);
    scheduleSave();
  } else {
    renderAll();
    if (event.type === 'history') scheduleSave();
  }
});

buildGrid();
bindEvents();
setSaveMode('connecting');
renderAll();
boot();
