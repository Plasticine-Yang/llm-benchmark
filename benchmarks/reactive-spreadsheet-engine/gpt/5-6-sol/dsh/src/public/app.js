import {
  DEFAULT_COLS,
  DEFAULT_ROWS,
  SpreadsheetEngine,
  columnName,
  makeCellId,
  parseCellId
} from './engine.js';

const engine = new SpreadsheetEngine(DEFAULT_ROWS, DEFAULT_COLS);
const elements = {
  grid: document.querySelector('#spreadsheet-grid'),
  gridScroll: document.querySelector('#grid-scroll'),
  formulaInput: document.querySelector('#formula-input'),
  nameBox: document.querySelector('#name-box'),
  valueChip: document.querySelector('#value-chip strong'),
  saveStatus: document.querySelector('#save-status'),
  undo: document.querySelector('#undo-button'),
  redo: document.querySelector('#redo-button'),
  recalcCount: document.querySelector('#recalc-count'),
  inspectorCell: document.querySelector('#inspector-cell'),
  cellType: document.querySelector('#cell-type'),
  raw: document.querySelector('#raw-display'),
  computed: document.querySelector('#computed-display'),
  error: document.querySelector('#error-display'),
  referenceCount: document.querySelector('#reference-count'),
  referenceList: document.querySelector('#reference-list'),
  dependentCount: document.querySelector('#dependent-count'),
  dependentList: document.querySelector('#dependent-list'),
  toast: document.querySelector('#toast')
};

const cellElements = new Map();
const rowHeaders = new Map();
const columnHeaders = new Map();
let selectedId = 'A1';
let editingId = null;
let undoStack = [];
let redoStack = [];
let saveRequested = false;
let saving = false;
let toastTimer;

function buildGrid() {
  const corner = document.createElement('div');
  corner.className = 'corner';
  corner.setAttribute('aria-hidden', 'true');
  elements.grid.append(corner);

  for (let col = 0; col < DEFAULT_COLS; col += 1) {
    const header = document.createElement('div');
    header.className = 'column-header';
    header.textContent = columnName(col);
    header.dataset.col = String(col);
    header.setAttribute('role', 'columnheader');
    columnHeaders.set(col, header);
    elements.grid.append(header);
  }

  for (let row = 0; row < DEFAULT_ROWS; row += 1) {
    const rowHeader = document.createElement('div');
    rowHeader.className = 'row-header';
    rowHeader.textContent = String(row + 1);
    rowHeader.dataset.row = String(row);
    rowHeader.setAttribute('role', 'rowheader');
    rowHeaders.set(row, rowHeader);
    elements.grid.append(rowHeader);

    for (let col = 0; col < DEFAULT_COLS; col += 1) {
      const id = makeCellId(row, col);
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'cell';
      button.dataset.cellId = id;
      button.setAttribute('role', 'gridcell');
      button.setAttribute('aria-label', id);
      button.tabIndex = id === selectedId ? 0 : -1;
      cellElements.set(id, button);
      elements.grid.append(button);
    }
  }
}

function displayValue(value) {
  if (typeof value === 'number') {
    if (Object.is(value, -0)) return '0';
    return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(10)));
  }
  return String(value ?? '');
}

function renderCells(ids = engine.cells.keys()) {
  for (const id of ids) {
    const cell = engine.getCell(id);
    const element = cellElements.get(id);
    if (!cell || !element || id === editingId) continue;
    element.textContent = displayValue(cell.value);
    element.classList.toggle('formula', cell.formula);
    element.classList.toggle('number', typeof cell.value === 'number');
    element.classList.toggle('error', Boolean(cell.error));
    element.title = cell.raw && cell.formula ? `${cell.raw} → ${displayValue(cell.value)}` : cell.raw;
    element.setAttribute('aria-label', `${id}: ${cell.raw || 'empty'}${cell.formula ? `, result ${displayValue(cell.value)}` : ''}`);
  }
}

function renderSelection() {
  const selected = engine.getCell(selectedId);
  const references = new Set(engine.getDependencies(selectedId));
  const directDependents = new Set(engine.getDependents(selectedId));
  const allDependents = new Set(engine.getDependents(selectedId, true));

  for (const [id, element] of cellElements) {
    element.classList.toggle('selected', id === selectedId);
    element.classList.toggle('reference', references.has(id));
    element.classList.toggle('dependent', allDependents.has(id) && id !== selectedId);
    element.tabIndex = id === selectedId ? 0 : -1;
  }
  for (const header of rowHeaders.values()) header.classList.remove('selected-header', 'related-reference', 'related-dependent');
  for (const header of columnHeaders.values()) header.classList.remove('selected-header', 'related-reference', 'related-dependent');
  const position = parseCellId(selectedId);
  rowHeaders.get(position.row)?.classList.add('selected-header');
  columnHeaders.get(position.col)?.classList.add('selected-header');

  elements.nameBox.textContent = selectedId;
  elements.formulaInput.value = selected.raw;
  elements.valueChip.textContent = selected.raw === '' ? '—' : displayValue(selected.value);
  elements.inspectorCell.textContent = selectedId;
  elements.raw.textContent = selected.raw || 'Empty cell';
  elements.raw.classList.toggle('muted', !selected.raw);
  elements.computed.textContent = selected.raw === '' ? '—' : displayValue(selected.value);
  elements.computed.classList.toggle('error', Boolean(selected.error));
  elements.error.textContent = selected.error || 'Ready';
  elements.error.className = `status-pill ${selected.error ? 'bad' : 'ok'}`;

  let type = 'EMPTY';
  if (selected.error) type = 'ERROR';
  else if (selected.formula) type = 'FORMULA';
  else if (typeof selected.value === 'number') type = 'NUMBER';
  else if (selected.raw) type = 'TEXT';
  elements.cellType.textContent = type;
  elements.cellType.className = `type-badge ${selected.error ? 'error' : selected.formula ? 'formula' : ''}`;

  renderCellList(elements.referenceList, [...references], new Set(), 'No references');
  renderCellList(elements.dependentList, [...allDependents], directDependents, 'No dependents');
  elements.referenceCount.textContent = String(references.size);
  elements.dependentCount.textContent = String(allDependents.size);
}

function renderCellList(container, ids, directSet, emptyText) {
  container.replaceChildren();
  container.classList.toggle('empty-list', ids.length === 0);
  if (ids.length === 0) {
    container.textContent = emptyText;
    return;
  }
  for (const id of ids.sort(compareCellIds)) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = id;
    button.dataset.navigate = id;
    if (directSet.size > 0 && !directSet.has(id)) {
      button.classList.add('indirect');
      button.title = 'Indirect dependent';
    }
    container.append(button);
  }
}

function compareCellIds(left, right) {
  const a = parseCellId(left);
  const b = parseCellId(right);
  return a.row - b.row || a.col - b.col;
}

function selectCell(id, focus = true) {
  if (!engine.has(id)) return;
  if (editingId) finishCellEdit(true);
  selectedId = id;
  renderSelection();
  if (focus) cellElements.get(id)?.focus({ preventScroll: false });
}

function moveSelection(rowDelta, colDelta) {
  const position = parseCellId(selectedId);
  const row = Math.max(0, Math.min(DEFAULT_ROWS - 1, position.row + rowDelta));
  const col = Math.max(0, Math.min(DEFAULT_COLS - 1, position.col + colDelta));
  selectCell(makeCellId(row, col));
}

function beginCellEdit(initialText = null) {
  if (editingId) return;
  editingId = selectedId;
  const cell = engine.getCell(editingId);
  const host = cellElements.get(editingId);
  const input = document.createElement('input');
  input.className = 'cell-editor';
  input.value = initialText === null ? cell.raw : initialText;
  input.setAttribute('aria-label', `Edit ${editingId}`);
  host.append(input);
  input.focus();
  if (initialText === null) input.select();
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === 'Tab') {
      event.preventDefault();
      const rowDelta = event.key === 'Enter' ? (event.shiftKey ? -1 : 1) : 0;
      const colDelta = event.key === 'Tab' ? (event.shiftKey ? -1 : 1) : 0;
      finishCellEdit(true);
      moveSelection(rowDelta, colDelta);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      finishCellEdit(false);
    }
    event.stopPropagation();
  });
  input.addEventListener('blur', () => {
    if (editingId) finishCellEdit(true);
  });
}

function finishCellEdit(commit) {
  if (!editingId) return;
  const id = editingId;
  const input = cellElements.get(id)?.querySelector('.cell-editor');
  const value = input?.value ?? engine.getCell(id).raw;
  editingId = null;
  input?.remove();
  if (commit) applyEdits([[id, value]], true);
  else renderCells([id]);
  renderSelection();
}

function applyEdits(entries, recordHistory) {
  const changes = [];
  for (const [id, value] of entries) {
    const cell = engine.getCell(id);
    const next = String(value ?? '');
    if (cell && cell.raw !== next) changes.push({ id: cell.id, before: cell.raw, after: next });
  }
  if (changes.length === 0) return;
  const affected = engine.setCells(changes.map(({ id, after }) => [id, after]));
  if (recordHistory) {
    undoStack.push(changes);
    if (undoStack.length > 100) undoStack.shift();
    redoStack = [];
  }
  renderCells(affected);
  elements.recalcCount.textContent = String(engine.lastRecalculated.length);
  renderSelection();
  updateHistoryButtons();
  requestSave();
}

function undo() {
  const changes = undoStack.pop();
  if (!changes) return;
  redoStack.push(changes);
  applyEdits(changes.map(({ id, before }) => [id, before]), false);
  showToast(`Undid ${changes.length === 1 ? changes[0].id : `${changes.length} cells`}`);
}

function redo() {
  const changes = redoStack.pop();
  if (!changes) return;
  undoStack.push(changes);
  applyEdits(changes.map(({ id, after }) => [id, after]), false);
  showToast(`Redid ${changes.length === 1 ? changes[0].id : `${changes.length} cells`}`);
}

function updateHistoryButtons() {
  elements.undo.disabled = undoStack.length === 0;
  elements.redo.disabled = redoStack.length === 0;
  elements.undo.title = `Undo (${undoStack.length} available)`;
  elements.redo.title = `Redo (${redoStack.length} available)`;
}

function requestSave() {
  saveRequested = true;
  setSaveStatus('saving', 'Saving…');
  void runSaveLoop();
}

async function runSaveLoop() {
  if (saving) return;
  saving = true;
  while (saveRequested) {
    saveRequested = false;
    const payload = engine.serialize();
    try {
      const response = await fetch('/api/workbook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error(`Save failed (${response.status})`);
      if (!saveRequested) setSaveStatus('saved', 'All changes saved');
    } catch (error) {
      console.error(error);
      setSaveStatus('failed', 'Save failed — retrying');
      window.setTimeout(requestSave, 1500);
      break;
    }
  }
  saving = false;
}

function setSaveStatus(state, text) {
  elements.saveStatus.className = `save-status ${state}`;
  elements.saveStatus.innerHTML = '<i></i>';
  elements.saveStatus.append(document.createTextNode(text));
}

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => elements.toast.classList.remove('visible'), 1600);
}

function pasteText(text) {
  const rows = text.replace(/\r/g, '').replace(/\n$/, '').split('\n').map((row) => row.split('\t'));
  const origin = parseCellId(selectedId);
  const entries = [];
  rows.forEach((values, rowOffset) => {
    values.forEach((value, colOffset) => {
      const row = origin.row + rowOffset;
      const col = origin.col + colOffset;
      if (row < DEFAULT_ROWS && col < DEFAULT_COLS) entries.push([makeCellId(row, col), value]);
    });
  });
  applyEdits(entries, true);
  showToast(`Pasted ${entries.length} cell${entries.length === 1 ? '' : 's'}`);
}

function handleGridKeydown(event) {
  if (editingId) return;
  if (event.key === 'ArrowUp') { event.preventDefault(); moveSelection(-1, 0); }
  else if (event.key === 'ArrowDown') { event.preventDefault(); moveSelection(1, 0); }
  else if (event.key === 'ArrowLeft') { event.preventDefault(); moveSelection(0, -1); }
  else if (event.key === 'ArrowRight') { event.preventDefault(); moveSelection(0, 1); }
  else if (event.key === 'Enter' || event.key === 'F2') { event.preventDefault(); beginCellEdit(); }
  else if (event.key === 'Backspace' || event.key === 'Delete') { event.preventDefault(); applyEdits([[selectedId, '']], true); }
  else if (!event.metaKey && !event.ctrlKey && !event.altKey && event.key.length === 1) {
    event.preventDefault();
    beginCellEdit(event.key);
  }
}

function handleGlobalShortcut(event) {
  const modifier = event.metaKey || event.ctrlKey;
  if (modifier && event.key.toLowerCase() === 'z') {
    event.preventDefault();
    event.shiftKey ? redo() : undo();
  } else if (modifier && event.key.toLowerCase() === 'y') {
    event.preventDefault();
    redo();
  }
}

async function loadWorkbook() {
  try {
    const response = await fetch('/api/workbook', { cache: 'no-store' });
    if (!response.ok) throw new Error(`Load failed (${response.status})`);
    const workbook = await response.json();
    const raw = {};
    for (const [id, cell] of Object.entries(workbook.cells ?? {})) {
      if (engine.has(id)) raw[id] = typeof cell === 'object' && cell !== null ? cell.raw : cell;
    }
    engine.loadRaw(raw);
    renderCells();
    renderSelection();
    elements.recalcCount.textContent = String(Object.keys(raw).length);
    setSaveStatus('saved', 'All changes saved');
  } catch (error) {
    console.error(error);
    renderCells();
    renderSelection();
    setSaveStatus('failed', 'Could not load workbook');
    showToast('Started a blank local workbook');
  }
}

buildGrid();
renderCells();
renderSelection();

// Event delegation keeps all 200 cells lightweight.
elements.grid.addEventListener('click', (event) => {
  const cell = event.target.closest('[data-cell-id]');
  if (cell && !event.target.classList.contains('cell-editor')) selectCell(cell.dataset.cellId);
});
elements.grid.addEventListener('dblclick', (event) => {
  const cell = event.target.closest('[data-cell-id]');
  if (cell) {
    selectCell(cell.dataset.cellId, false);
    beginCellEdit();
  }
});
elements.grid.addEventListener('keydown', handleGridKeydown);

elements.formulaInput.addEventListener('focus', () => {
  elements.formulaInput.value = engine.getCell(selectedId).raw;
});
elements.formulaInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    event.preventDefault();
    applyEdits([[selectedId, elements.formulaInput.value]], true);
    cellElements.get(selectedId)?.focus();
  } else if (event.key === 'Escape') {
    elements.formulaInput.value = engine.getCell(selectedId).raw;
    cellElements.get(selectedId)?.focus();
  }
});
elements.formulaInput.addEventListener('change', () => applyEdits([[selectedId, elements.formulaInput.value]], true));

elements.undo.addEventListener('click', undo);
elements.redo.addEventListener('click', redo);
document.addEventListener('keydown', handleGlobalShortcut);
document.addEventListener('copy', (event) => {
  if (editingId || document.activeElement === elements.formulaInput) return;
  event.preventDefault();
  event.clipboardData.setData('text/plain', engine.getCell(selectedId).raw);
  showToast(`Copied ${selectedId}`);
});
document.addEventListener('paste', (event) => {
  if (editingId || document.activeElement === elements.formulaInput) return;
  event.preventDefault();
  pasteText(event.clipboardData.getData('text/plain'));
});
document.querySelector('.inspector').addEventListener('click', (event) => {
  const target = event.target.closest('[data-navigate]');
  if (target) selectCell(target.dataset.navigate);
});

void loadWorkbook();
