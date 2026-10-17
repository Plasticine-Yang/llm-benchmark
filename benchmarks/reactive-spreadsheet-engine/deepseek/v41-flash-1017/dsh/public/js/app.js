import {
  ReactiveWorkbook,
  ROWS,
  COLS,
  columnLabel,
  cellAddress,
  addressToCoords,
  normalizeAddress,
  isInGrid,
  compareAddresses,
  formatNumber,
  formatResult,
} from "./engine.js";

const HISTORY_LIMIT = 100;

const dom = {
  nameBox: document.querySelector("#nameBox"),
  formulaInput: document.querySelector("#formulaInput"),
  formulaToggle: document.querySelector("#formulaToggle"),
  undoBtn: document.querySelector("#undoBtn"),
  redoBtn: document.querySelector("#redoBtn"),
  saveStatus: document.querySelector("#saveStatus"),
  saveText: document.querySelector("#saveText"),
  headerStats: document.querySelector("#headerStats"),
  sheet: document.querySelector("#sheet"),
  sheetHead: document.querySelector("#sheetHead"),
  sheetBody: document.querySelector("#sheetBody"),
  sheetViewport: document.querySelector("#sheetViewport"),
  selectionStatus: document.querySelector("#selectionStatus"),
  recalcStatus: document.querySelector("#recalcStatus"),
  inspector: document.querySelector("#inspector"),
  inspectorBody: document.querySelector("#inspectorBody"),
  toastStack: document.querySelector("#toastStack"),
};

const state = {
  wb: new ReactiveWorkbook(),
  active: { row: 0, col: 0 },
  anchor: { row: 0, col: 0 },
  editing: null,
  loaded: false,
  showFormulas: readFormulaPreference(),
  undoStack: [],
  redoStack: [],
  saveQueued: false,
  saveRunning: false,
  dirty: false,
  saveErrorShown: false,
  lastSavedAt: null,
  editVersion: 0,
  formulaTarget: null,
  dragging: false,
  lastCellPointer: null,
  flashTimer: null,
};

const liveRegion = document.createElement("div");
liveRegion.className = "sr-only";
liveRegion.setAttribute("aria-live", "polite");
document.body.append(liveRegion);

/* ------------------------------------------------------------------ */
/* Small helpers                                                       */
/* ------------------------------------------------------------------ */

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[char]);
}

function activeAddress() {
  return cellAddress(state.active.row, state.active.col);
}

function sameCoords(a, b) {
  return a.row === b.row && a.col === b.col;
}

function clampCoords(coords) {
  return {
    row: Math.max(0, Math.min(ROWS - 1, Number(coords.row))),
    col: Math.max(0, Math.min(COLS - 1, Number(coords.col))),
  };
}

function coordsFor(address) {
  const coords = addressToCoords(address);
  if (!coords) return null;
  if (!isInGrid(address)) return null;
  return coords;
}

function selectionBounds() {
  return {
    top: Math.min(state.active.row, state.anchor.row),
    bottom: Math.max(state.active.row, state.anchor.row),
    left: Math.min(state.active.col, state.anchor.col),
    right: Math.max(state.active.col, state.anchor.col),
  };
}

function boundsSize(bounds) {
  return (bounds.bottom - bounds.top + 1) * (bounds.right - bounds.left + 1);
}

function rangeLabel(bounds) {
  const start = cellAddress(bounds.top, bounds.left);
  const end = cellAddress(bounds.bottom, bounds.right);
  return start === end ? start : `${start}:${end}`;
}

function isTypingTarget(target) {
  if (!(target instanceof Element)) return false;
  return target.isContentEditable || target.matches("input, textarea, select");
}

function readFormulaPreference() {
  try {
    return window.localStorage.getItem("lattice.showFormulas") === "1";
  } catch {
    return false;
  }
}

function writeFormulaPreference(value) {
  try {
    window.localStorage.setItem("lattice.showFormulas", value ? "1" : "0");
  } catch {
    /* localStorage can be unavailable; the toggle still works for this tab. */
  }
}

function announce(message) {
  liveRegion.textContent = "";
  window.setTimeout(() => {
    liveRegion.textContent = message;
  }, 25);
}

function formatClock(date = new Date()) {
  return new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(date);
}

function plural(count, singular, pluralForm = `${singular}s`) {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}

function kindName(kind) {
  if (kind === "formula") return "Formula";
  if (kind === "number") return "Number";
  if (kind === "text") return "Text";
  return "Empty";
}

function kindShort(addr) {
  if (workbookCycle(addr)) return "cycle";
  const kind = state.wb.getKind(addr);
  if (kind === "formula") return "ƒ";
  if (kind === "number") return "num";
  if (kind === "text") return "txt";
  return "blank";
}

function workbookCycle(addr) {
  return state.wb.isCycleCell(addr);
}

function resultPreview(result, limit = 40) {
  if (!result) return "";
  const text = formatResult(result) || (result.type === "empty" ? "blank" : "");
  if (text.length <= limit) return text;
  return `${text.slice(0, limit - 1)}…`;
}

function showToast(message, type = "info") {
  const toast = document.createElement("div");
  toast.className = `toast${type === "error" ? " is-error" : ""}`;
  toast.textContent = message;
  dom.toastStack.append(toast);
  while (dom.toastStack.children.length > 3) dom.toastStack.firstElementChild?.remove();
  requestAnimationFrame(() => toast.classList.add("is-visible"));
  window.setTimeout(() => {
    toast.classList.remove("is-visible");
    window.setTimeout(() => toast.remove(), 220);
  }, type === "error" ? 4200 : 2300);
}

function focusGrid() {
  try {
    dom.sheetViewport.focus({ preventScroll: true });
  } catch {
    dom.sheetViewport.focus();
  }
}

function scrollActiveIntoView() {
  const cell = dom.sheetBody.querySelector(`td.cell[data-address="${activeAddress()}"]`);
  if (cell) cell.scrollIntoView({ block: "nearest", inline: "nearest" });
}

function setSaveState(kind, text) {
  dom.saveStatus.dataset.state = kind;
  dom.saveText.textContent = text;
}

function downstreamStats(startAddress) {
  const upstreamSeen = new Set([startAddress]);
  const upstreamQueue = [startAddress];
  while (upstreamQueue.length) {
    const current = upstreamQueue.shift();
    for (const next of state.wb.getDependencies(current)) {
      if (!upstreamSeen.has(next)) {
        upstreamSeen.add(next);
        upstreamQueue.push(next);
      }
    }
  }
  const downstreamSeen = new Set([startAddress]);
  const downstreamQueue = [startAddress];
  while (downstreamQueue.length) {
    const current = downstreamQueue.shift();
    for (const next of state.wb.getDependents(current)) {
      if (!downstreamSeen.has(next)) {
        downstreamSeen.add(next);
        downstreamQueue.push(next);
      }
    }
  }
  return {
    upstream: upstreamSeen.size - 1,
    downstream: downstreamSeen.size - 1,
  };
}

/* ------------------------------------------------------------------ */
/* Rendering                                                           */
/* ------------------------------------------------------------------ */

function cellView(addr) {
  const raw = state.wb.getRaw(addr);
  const kind = state.wb.getKind(addr);
  const result = state.wb.getResult(addr);
  let text;
  let alignment;

  if (state.showFormulas) {
    text = raw;
    if (kind === "formula") alignment = "formula";
    else if (result.type === "error") alignment = "error";
    else if (kind === "number") alignment = "number";
    else alignment = "text";
  } else if (result.type === "error") {
    text = result.error;
    alignment = "error";
  } else if (result.type === "empty") {
    text = "";
    alignment = "empty";
  } else if (result.type === "number") {
    text = formatNumber(result.value);
    alignment = "number";
  } else {
    text = result.value;
    alignment = "text";
  }

  return { raw, kind, result, text, alignment };
}

function buildCellTitle(addr, view) {
  const pieces = [addr];
  if (view.raw) pieces.push(view.raw);
  if (view.kind === "formula" && !state.showFormulas) {
    pieces.push(`→ ${formatResult(view.result) || "blank"}`);
  }
  if (view.result.type === "error" && view.result.message) pieces.push(view.result.message);
  return pieces.join("  ·  ");
}

function renderGrid() {
  const bounds = selectionBounds();
  const active = activeAddress();
  const dependencies = new Set(state.wb.getDependencies(active));
  const dependents = new Set(state.wb.getDependents(active));
  const editingAddress = state.editing?.address || null;

  dom.sheet.classList.toggle("is-formulas-mode", state.showFormulas);

  let head = '<tr><th class="corner" aria-hidden="true"></th>';
  for (let col = 0; col < COLS; col += 1) {
    const activeHead = col === state.active.col ? " is-active-head" : "";
    head += `<th class="col-header${activeHead}" data-col="${col}" scope="col" title="Select column ${columnLabel(col)}">${columnLabel(col)}</th>`;
  }
  head += "</tr>";
  dom.sheetHead.innerHTML = head;

  const rows = [];
  for (let row = 0; row < ROWS; row += 1) {
    const activeRowHead = row === state.active.row ? " is-active-head" : "";
    let rowHtml = `<tr><th class="row-header${activeRowHead}" data-row="${row}" scope="row" title="Select row ${row + 1}">${row + 1}</th>`;
    for (let col = 0; col < COLS; col += 1) {
      const addr = cellAddress(row, col);
      const view = cellView(addr);
      const inRange = row >= bounds.top && row <= bounds.bottom && col >= bounds.left && col <= bounds.right;
      const isActive = addr === active;
      const isEditing = addr === editingAddress;
      const isSource = dependencies.has(addr);
      const isTarget = dependents.has(addr);
      const classes = ["cell"];

      if (inRange) classes.push("is-range");
      if (isActive) classes.push("is-active");
      if (isSource) classes.push("is-ref-source");
      if (isTarget) classes.push("is-ref-target");
      if (isSource && isTarget) classes.push("is-ref-both");
      if (workbookCycle(addr)) classes.push("is-cycle");
      if (view.result.type === "error") classes.push("is-error");
      classes.push(`cell-${view.alignment}`);
      if (view.kind === "formula") classes.push("cell-formula");
      if (view.raw === "") classes.push("cell-empty");
      if (isEditing) classes.push("is-editing");

      const title = escapeHtml(buildCellTitle(addr, view));
      const aria = escapeHtml(
        `${addr}, ${kindName(view.kind)}, ${view.result.type === "error" ? view.result.error : resultPreview(view.result) || "blank"}`,
      );
      const flag = view.kind === "formula" ? '<span class="formula-flag" aria-hidden="true"></span>' : "";
      let content;
      if (isEditing) {
        content = `<input class="cell-editor" data-cell-editor="${addr}" value="${escapeHtml(state.editing.draft)}" aria-label="Edit ${addr}" autocomplete="off" autocapitalize="off" spellcheck="false" />`;
      } else {
        content = `<span class="cell-value">${escapeHtml(view.text)}</span>${flag}`;
      }

      rowHtml += `<td class="${classes.join(" ")}" data-address="${addr}" data-row="${row}" data-col="${col}" role="gridcell" aria-selected="${inRange}" aria-label="${aria}" title="${title}">${content}</td>`;
    }
    rowHtml += "</tr>";
    rows.push(rowHtml);
  }
  dom.sheetBody.innerHTML = rows.join("");
}

function buildRefChip(addr, relation) {
  const result = state.wb.getResult(addr);
  const raw = state.wb.getRaw(addr);
  const error = result.type === "error";
  const preview = error ? result.error : formatResult(result) || "blank";
  const chipClasses = ["ref-chip"];
  if (relation === "target") chipClasses.push("ref-target");
  if (workbookCycle(addr)) chipClasses.push("ref-cycle");
  const title = raw ? `${addr}: ${raw}` : `${addr}: blank cell`;
  return `<button type="button" class="${chipClasses.join(" ")}" data-jump="${addr}" title="${escapeHtml(title)}">
    <span class="chip-address">${addr}</span>
    <span class="chip-value${error ? " is-error" : ""}">${escapeHtml(preview)}</span>
    <span class="chip-kind">${escapeHtml(kindShort(addr))}</span>
  </button>`;
}

function buildRefList(addresses, relation) {
  return `<div class="ref-list">${addresses.map((addr) => buildRefChip(addr, relation)).join("")}</div>`;
}

function renderInspector() {
  const address = activeAddress();
  const raw = state.wb.getRaw(address);
  const kind = state.wb.getKind(address);
  const result = state.wb.getResult(address);
  const deps = state.wb.getDependencies(address);
  const dependents = state.wb.getDependents(address);
  const bounds = selectionBounds();
  const count = boundsSize(bounds);
  const multi = count > 1;
  const cycleGroup = state.wb.getCycleGroupFor(address);
  const cycleError = result.type === "error" && result.error === "#CYCLE!";
  const isError = result.type === "error";
  const stats = state.wb.getStats();
  const traversal = downstreamStats(address);

  const actualType = isError ? "error" : result.type;
  const kindClass = isError ? "is-error" : kind === "formula" ? "is-formula" : kind === "number" ? "is-number" : kind === "text" ? "is-text" : "";
  const kindLabel = kind === "formula" && isError ? "Formula · error" : kindName(kind);
  const resultText = result.type === "empty" ? "—" : formatResult(result) || "blank";
  const formulaBlock = kind === "formula"
    ? `<code class="formula-code">${escapeHtml(raw)}</code>`
    : raw
      ? `<code class="formula-code is-plain">${escapeHtml(raw)}</code>`
      : `<span class="empty-note" style="padding:0;border:0;background:transparent">This cell is empty.</span>`;

  let resultMain;
  if (isError) {
    resultMain = `<div class="result-value is-error">${escapeHtml(result.error)}</div>`;
  } else if (result.type === "number") {
    resultMain = `<div class="result-value is-number">${escapeHtml(formatNumber(result.value))}</div>`;
  } else if (result.type === "text") {
    resultMain = `<div class="result-value is-text">${escapeHtml(result.value)}</div>`;
  } else {
    resultMain = `<div class="result-value is-empty">—</div>`;
  }

  let html = "";
  if (multi) {
    html += `<div class="range-banner"><span>${rangeLabel(bounds)} selected</span><code>${plural(count, "cell")}</code></div>`;
  }

  html += `<section class="hero-card${isError ? " is-error" : ""}${cycleGroup ? " is-cycle" : ""}">
    <div class="hero-top">
      <span class="address-badge">${address}</span>
      <span class="kind-pill ${kindClass}"><i></i>${escapeHtml(kindLabel)}</span>
    </div>
    <div class="result-label">${kind === "formula" ? "Computed value" : "Cell value"}</div>
    ${resultMain}
    ${isError
      ? `<div class="result-sub">${escapeHtml(result.message || "This formula produced an error.")}</div>`
      : result.type === "empty"
        ? '<div class="result-sub">Blank cells evaluate as zero inside arithmetic.</div>'
        : kind === "formula"
          ? `<div class="result-sub">Calculated from ${plural(deps.length, "input")} · ${plural(dependents.length, "dependent")}</div>`
          : `<div class="result-sub">${kind === "number" ? "Numeric literal" : "Text literal"} · ${plural(dependents.length, "formula")} ${dependents.length === 1 ? "depends" : "depend"} on this cell.</div>`}
  </section>`;

  html += `<div class="inspector-section">
    <div class="formula-block">
      <div class="raw-label"><span>${kind === "formula" ? "Raw formula" : "Raw value"}</span><span>${kind === "formula" ? "ƒ" : "Aa"}</span></div>
      ${formulaBlock}
    </div>
    ${kind !== "formula" ? '<div class="formula-hint">Type <code>=</code> before a value to create a formula. Try <code>=SUM(A1:A5)</code>.</div>' : ""}
  </div>`;

  if (cycleGroup) {
    const members = cycleGroup
      .map((member) => `<button type="button" class="cycle-member" data-jump="${member}">${member}</button>`)
      .join("");
    html += `<div class="cycle-panel">
      <div class="cycle-title">
        <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 2.5a5.5 5.5 0 1 1-5.2 7.3M2 3.5v4h4"/></svg>
        Circular reference
      </div>
      <p>This cell is part of a ${cycleGroup.length}-cell cycle. Every participant is marked <strong>#CYCLE!</strong> and propagation stops.</p>
      <div class="cycle-list">${members}</div>
    </div>`;
  } else if (isError) {
    html += `<div class="error-panel">
      <strong>${escapeHtml(result.error)}</strong>
      ${escapeHtml(result.message || "This formula could not be evaluated.")}
      ${cycleError ? " This formula depends on cells caught in a cycle." : ""}
    </div>`;
  }

  html += `<section class="inspector-section">
    <div class="section-heading"><h3>Reads from</h3><span class="count-badge">${deps.length}</span></div>
    ${deps.length
      ? buildRefList(deps, "source")
      : `<div class="empty-note">${kind === "formula"
        ? "No cell references were registered for this formula. If it has a syntax error, fix the formula first."
        : "This cell is a literal, so it doesn't read from any other cell."}</div>`}
    ${traversal.upstream > deps.length
      ? `<div class="transitive-note">↳ <b>${traversal.upstream}</b> total cells upstream through the dependency chain.</div>`
      : ""}
  </section>`;

  html += `<section class="inspector-section">
    <div class="section-heading"><h3>Feeds into</h3><span class="count-badge">${dependents.length}</span></div>
    ${dependents.length
      ? buildRefList(dependents, "target")
      : '<div class="empty-note">No formulas depend on this cell yet. Reference it from another cell to build a chain.</div>'}
    ${traversal.downstream > dependents.length
      ? `<div class="transitive-note">↳ <b>${traversal.downstream}</b> total cells downstream through the dependency chain.</div>`
      : ""}
  </section>`;

  html += `<div class="mini-stats">
    <div class="mini-stat"><strong>${stats.formulas}</strong><span>formulas</span></div>
    <div class="mini-stat"><strong>${stats.links}</strong><span>links</span></div>
    <div class="mini-stat"><strong>${stats.cycles ? stats.cycles : stats.errors}</strong><span>${stats.cycles ? "in cycle" : "errors"}</span></div>
  </div>`;

  if (stats.nonEmpty === 0) {
    html += `<aside class="quick-guide">
      <h3>Build a live chain</h3>
      <p>Change the root and every downstream formula recalculates in order.</p>
      <div class="guide-steps">
        <div class="guide-step"><span>1</span><div><code>A1</code> → <code>10</code></div></div>
        <div class="guide-step"><span>2</span><div><code>B1</code> → <code>=A1*2</code></div></div>
        <div class="guide-step"><span>3</span><div><code>C1</code> → <code>=B1+5</code></div></div>
        <div class="guide-step"><span>4</span><div><code>D1</code> → <code>=SUM(A1:C1)</code></div></div>
      </div>
      <div class="shortcut-strip">
        <span><kbd>Enter</kbd> edit</span>
        <span><kbd>⌘Z</kbd> undo</span>
        <span><kbd>⌘V</kbd> paste</span>
      </div>
    </aside>`;
  }

  dom.inspectorBody.innerHTML = html;
}

function recalcSummary() {
  if (!state.loaded) return "Connecting to workbook…";
  const recalc = state.wb.lastRecalc;
  const total = ROWS * COLS;
  if (!recalc || recalc.reason === "init") return "Ready";
  if (recalc.reason === "load") {
    return `${plural(recalc.evaluated, "formula")} evaluated · full workbook graph loaded`;
  }
  if (!recalc.affected?.length) return "No recalculation needed";
  let text = `Only ${recalc.affected.length} of ${total} cells recalculated · ${recalc.skipped} untouched · ${recalc.durationMs} ms`;
  if (recalc.cycleCells?.length) text += ` · cycle active`;
  return text;
}

function renderChrome() {
  const address = state.editing?.address || activeAddress();
  const bounds = selectionBounds();
  const count = boundsSize(bounds);
  const stats = state.wb.getStats();
  const recalc = state.wb.lastRecalc;
  const undoEntry = state.undoStack[state.undoStack.length - 1];
  const redoEntry = state.redoStack[state.redoStack.length - 1];

  if (state.editing) {
    dom.nameBox.textContent = state.editing.address;
    dom.selectionStatus.textContent = `Editing ${state.editing.address}`;
  } else {
    dom.nameBox.textContent = address;
    dom.selectionStatus.textContent = count > 1 ? `${rangeLabel(bounds)} selected · ${plural(count, "cell")}` : `${address} selected`;
  }

  if (document.activeElement !== dom.formulaInput) {
    dom.formulaInput.value = state.editing ? state.editing.draft : state.wb.getRaw(address);
  }

  dom.formulaToggle.setAttribute("aria-pressed", String(state.showFormulas));
  dom.formulaToggle.title = state.showFormulas ? "Showing raw formulas — click to show values" : "Show raw formulas";

  dom.undoBtn.disabled = !state.loaded || state.undoStack.length === 0;
  dom.redoBtn.disabled = !state.loaded || state.redoStack.length === 0;
  dom.undoBtn.title = undoEntry ? `Undo: ${undoEntry.label} (⌘Z)` : "Nothing to undo";
  dom.redoBtn.title = redoEntry ? `Redo: ${redoEntry.label} (⇧⌘Z)` : "Nothing to redo";

  dom.headerStats.textContent = `${ROWS} × ${COLS} · ${plural(stats.formulas, "formula")}${stats.cycles ? ` · ${stats.cycles} in cycle` : ""}`;

  dom.recalcStatus.querySelector("span:last-child").textContent = recalcSummary();
  dom.recalcStatus.title = recalc?.affected?.length
    ? `Recalculated: ${recalc.affected.join(", ")}${recalc.skipped ? ` (${recalc.skipped} cells untouched)` : ""}`
    : "";
  dom.recalcStatus.classList.toggle("has-cycles", Boolean(stats.cycles));
}

function renderAll({ scroll = true } = {}) {
  renderGrid();
  renderInspector();
  renderChrome();
  if (scroll) scrollActiveIntoView();
}

function flashRecalc() {
  if (state.flashTimer) window.clearTimeout(state.flashTimer);
  dom.recalcStatus.classList.remove("is-flashing");
  void dom.recalcStatus.offsetWidth;
  dom.recalcStatus.classList.add("is-flashing");
  state.flashTimer = window.setTimeout(() => dom.recalcStatus.classList.remove("is-flashing"), 700);
}

/* ------------------------------------------------------------------ */
/* History                                                             */
/* ------------------------------------------------------------------ */

function currentSnapshot(label) {
  return {
    cells: state.wb.toJSON(),
    active: { ...state.active },
    anchor: { ...state.anchor },
    label,
  };
}

function pushHistory(label) {
  state.undoStack.push(currentSnapshot(label));
  if (state.undoStack.length > HISTORY_LIMIT) state.undoStack.shift();
  state.redoStack = [];
}

function applySnapshot(entry) {
  const target = entry.cells || {};
  const current = state.wb.toJSON();
  const keys = new Set([...Object.keys(current), ...Object.keys(target)]);
  const changes = {};
  let changed = false;
  for (const key of keys) {
    const before = current[key] ?? "";
    const after = target[key] ?? "";
    if (before !== after) {
      changes[key] = after;
      changed = true;
    }
  }

  if (changed) state.wb.setCells(changes);
  if (entry.active) state.active = clampCoords(entry.active);
  if (entry.anchor) state.anchor = clampCoords(entry.anchor);
  state.editing = null;
  state.formulaTarget = null;
  state.lastCellPointer = null;
  renderAll();
  if (changed) {
    queueSave();
    flashRecalc();
  }
}

function undo() {
  if (!state.loaded) return;
  flushPendingEditors();
  const entry = state.undoStack.pop();
  if (!entry) return;
  const redoEntry = currentSnapshot(entry.label);
  state.redoStack.push(redoEntry);
  applySnapshot(entry);
  showToast(`Undo · ${entry.label}`);
  announce(`Undid ${entry.label}`);
}

function redo() {
  if (!state.loaded) return;
  flushPendingEditors();
  const entry = state.redoStack.pop();
  if (!entry) return;
  const undoEntry = currentSnapshot(entry.label);
  state.undoStack.push(undoEntry);
  if (state.undoStack.length > HISTORY_LIMIT) state.undoStack.shift();
  applySnapshot(entry);
  showToast(`Redo · ${entry.label}`);
  announce(`Redid ${entry.label}`);
}

/* ------------------------------------------------------------------ */
/* Mutations                                                           */
/* ------------------------------------------------------------------ */

function applyChanges(updates, label, { active = null, anchor = null } = {}) {
  if (!state.loaded) return false;
  const changes = {};
  for (const [rawAddress, incoming] of Object.entries(updates)) {
    const address = normalizeAddress(rawAddress);
    if (!address || !isInGrid(address)) continue;
    const next = incoming == null ? "" : String(incoming);
    if (state.wb.getRaw(address) !== next) changes[address] = next;
  }

  const changedCount = Object.keys(changes).length;
  if (changedCount === 0) {
    if (active) state.active = clampCoords(active);
    if (anchor) state.anchor = clampCoords(anchor);
    renderAll();
    return false;
  }

  pushHistory(label);
  state.wb.setCells(changes);
  if (active) state.active = clampCoords(active);
  if (anchor) state.anchor = clampCoords(anchor);
  renderAll();
  queueSave();
  flashRecalc();
  return true;
}

function beginEdit(initialValue = null, { selectAll = false } = {}) {
  if (!state.loaded || state.editing) return;
  if (document.activeElement === dom.formulaInput) dom.formulaInput.blur();

  const { row, col } = state.active;
  const address = cellAddress(row, col);
  const original = state.wb.getRaw(address);
  const draft = initialValue == null ? original : String(initialValue);
  state.active = { row, col };
  state.anchor = { row, col };
  state.lastCellPointer = null;
  state.editing = { address, original, draft };
  renderAll({ scroll: false });

  const input = dom.sheetBody.querySelector(`.cell-editor[data-cell-editor="${address}"]`);
  if (!input) {
    state.editing = null;
    return;
  }
  input.focus({ preventScroll: true });
  input.scrollIntoView({ block: "nearest", inline: "nearest" });
  if (selectAll) input.select();
  else {
    const end = input.value.length;
    input.setSelectionRange(end, end);
  }
  dom.formulaInput.value = draft;

  input.addEventListener("input", () => {
    if (!state.editing || state.editing.address !== address) return;
    state.editing.draft = input.value;
    dom.formulaInput.value = input.value;
  });

  input.addEventListener("keydown", (event) => {
    if (event.isComposing) return;
    if (event.key === "Enter") {
      event.preventDefault();
      event.stopPropagation();
      commitEdit({ rowDelta: event.shiftKey ? -1 : 1, focusAfter: true });
    } else if (event.key === "Tab") {
      event.preventDefault();
      event.stopPropagation();
      commitEdit({ tabDirection: event.shiftKey ? -1 : 1, focusAfter: true });
    } else if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      cancelEdit();
    }
  });

  input.addEventListener("blur", () => {
    if (state.editing && state.editing.address === address) commitEdit({});
  });

  announce(`Editing ${address}. Press Enter to commit or Escape to cancel.`);
}

function cancelEdit() {
  if (!state.editing) return;
  const address = state.editing.address;
  state.editing = null;
  renderAll();
  focusGrid();
  announce(`Edit canceled for ${address}.`);
}

function commitEdit({ rowDelta = 0, tabDirection = 0, focusAfter = false } = {}) {
  if (!state.editing) return;
  const { address, draft, original } = state.editing;
  const coords = coordsFor(address) || { ...state.active };
  const changed = draft !== original;
  state.editing = null;

  if (changed) {
    pushHistory(`Edit ${address}`);
    state.wb.setCells({ [address]: draft });
    queueSave();
  }

  let next = { ...coords };
  if (tabDirection) {
    next.col += tabDirection;
    if (next.col >= COLS) {
      next.col = 0;
      next.row = Math.min(ROWS - 1, next.row + 1);
    } else if (next.col < 0) {
      next.col = COLS - 1;
      next.row = Math.max(0, next.row - 1);
    }
  } else if (rowDelta) {
    next.row = Math.max(0, Math.min(ROWS - 1, next.row + rowDelta));
  }
  state.active = next;
  state.anchor = { ...next };
  renderAll();
  if (changed) {
    flashRecalc();
    announce(`${address} ${state.wb.getResult(address).type === "error" ? `set to ${state.wb.getResult(address).error}` : "updated"}.`);
  }
  if (focusAfter) focusGrid();
}

/* ------------------------------------------------------------------ */
/* Selection and pointer interactions                                  */
/* ------------------------------------------------------------------ */

function selectCell(coords, { extend = false } = {}) {
  const next = clampCoords(coords);
  state.active = next;
  if (!extend) state.anchor = { ...next };
  state.lastCellPointer = null;
  renderAll();
  focusGrid();
}

function selectAllCells() {
  state.anchor = { row: 0, col: 0 };
  state.active = { row: ROWS - 1, col: COLS - 1 };
  state.lastCellPointer = null;
  renderAll();
  focusGrid();
}

function selectRange(anchor, active) {
  state.anchor = clampCoords(anchor);
  state.active = clampCoords(active);
  state.lastCellPointer = null;
  renderAll();
  focusGrid();
}

function handleSheetMouseDown(event) {
  if (event.button !== 0) return;
  if (event.target.closest(".cell-editor")) return;
  const cell = event.target.closest("td.cell");
  const colHeader = event.target.closest("th.col-header");
  const rowHeader = event.target.closest("th.row-header");
  if (!cell && !colHeader && !rowHeader) return;

  const coords = cell
    ? { row: Number(cell.dataset.row), col: Number(cell.dataset.col) }
    : colHeader
      ? { row: 0, col: Number(colHeader.dataset.col) }
      : { row: Number(rowHeader.dataset.row), col: 0 };
  const address = cellAddress(coords.row, coords.col);
  const now = Date.now();
  const isDoubleClick = Boolean(
    cell &&
    !event.shiftKey &&
    state.lastCellPointer &&
    state.lastCellPointer.address === address &&
    now - state.lastCellPointer.time < 380,
  );

  event.preventDefault();

  if (isDoubleClick) {
    state.lastCellPointer = null;
    flushPendingEditors();
    state.active = coords;
    state.anchor = { ...coords };
    beginEdit(null, { selectAll: false });
    return;
  }

  state.lastCellPointer = cell ? { address, time: now } : null;
  flushPendingEditors();

  if (cell) {
    const anchor = event.shiftKey ? { ...state.anchor } : { ...coords };
    state.anchor = anchor;
    state.active = coords;
    state.dragging = true;
  } else if (colHeader) {
    const col = Number(colHeader.dataset.col);
    state.anchor = { row: ROWS - 1, col };
    state.active = { row: 0, col };
    state.dragging = false;
  } else {
    const row = Number(rowHeader.dataset.row);
    state.anchor = { row, col: COLS - 1 };
    state.active = { row, col: 0 };
    state.dragging = false;
  }

  renderAll({ scroll: false });
  focusGrid();
  scrollActiveIntoView();
}

function handleDocumentMouseMove(event) {
  if (!state.dragging) return;
  const element = document.elementFromPoint(event.clientX, event.clientY);
  const cell = element?.closest?.("td.cell");
  if (!cell) return;
  const coords = { row: Number(cell.dataset.row), col: Number(cell.dataset.col) };
  if (sameCoords(coords, state.active)) return;
  state.active = coords;
  state.lastCellPointer = null;
  renderAll({ scroll: false });
}

function stopDragging() {
  state.dragging = false;
}

function flushPendingEditors() {
  if (state.editing) commitEdit({});
  if (document.activeElement === dom.formulaInput) dom.formulaInput.blur();
}

/* ------------------------------------------------------------------ */
/* Keyboard navigation                                                 */
/* ------------------------------------------------------------------ */

function moveActive(rowDelta, colDelta, extend = false) {
  const next = {
    row: Math.max(0, Math.min(ROWS - 1, state.active.row + rowDelta)),
    col: Math.max(0, Math.min(COLS - 1, state.active.col + colDelta)),
  };
  state.active = next;
  if (!extend) state.anchor = { ...next };
  state.lastCellPointer = null;
  renderAll();
  focusGrid();
}

function tabMove(direction) {
  const next = { ...state.active };
  next.col += direction;
  if (next.col >= COLS) {
    next.col = 0;
    next.row = Math.min(ROWS - 1, next.row + 1);
  } else if (next.col < 0) {
    next.col = COLS - 1;
    next.row = Math.max(0, next.row - 1);
  }
  state.active = next;
  state.anchor = { ...next };
  state.lastCellPointer = null;
  renderAll();
  focusGrid();
}

function clearSelection() {
  const bounds = selectionBounds();
  const updates = {};
  let count = 0;
  for (let row = bounds.top; row <= bounds.bottom; row += 1) {
    for (let col = bounds.left; col <= bounds.right; col += 1) {
      const addr = cellAddress(row, col);
      if (state.wb.getRaw(addr) !== "") {
        updates[addr] = "";
        count += 1;
      }
    }
  }
  if (count === 0) return;
  applyChanges(updates, `Clear ${rangeLabel(bounds)}`, { active: { ...state.active }, anchor: { ...state.anchor } });
  showToast(`Cleared ${plural(count, "cell")}`);
  announce(`Cleared ${plural(count, "cell")}.`);
}

function handleGlobalKeyDown(event) {
  if (!state.loaded || state.editing || isTypingTarget(event.target)) return;
  if (event.isComposing) return;

  const modifier = event.metaKey || event.ctrlKey;
  if (modifier && !event.altKey) {
    const key = event.key.toLowerCase();
    if (key === "z") {
      event.preventDefault();
      if (event.shiftKey) redo();
      else undo();
      return;
    }
    if (key === "y") {
      event.preventDefault();
      redo();
      return;
    }
    if (key === "a") {
      event.preventDefault();
      selectAllCells();
      return;
    }
    return;
  }

  if (event.altKey) return;
  if (event.target.closest?.("button, a") && (event.key === "Enter" || event.key === " ")) return;

  switch (event.key) {
    case "ArrowUp":
      event.preventDefault();
      moveActive(-1, 0, event.shiftKey);
      return;
    case "ArrowDown":
      event.preventDefault();
      moveActive(1, 0, event.shiftKey);
      return;
    case "ArrowLeft":
      event.preventDefault();
      moveActive(0, -1, event.shiftKey);
      return;
    case "ArrowRight":
      event.preventDefault();
      moveActive(0, 1, event.shiftKey);
      return;
    case "PageUp":
      event.preventDefault();
      moveActive(-8, 0, event.shiftKey);
      return;
    case "PageDown":
      event.preventDefault();
      moveActive(8, 0, event.shiftKey);
      return;
    case "Home":
      event.preventDefault();
      if (modifier) selectCell({ row: 0, col: 0 });
      else moveActive(0, -state.active.col, event.shiftKey);
      return;
    case "End":
      event.preventDefault();
      moveActive(0, COLS - 1 - state.active.col, event.shiftKey);
      return;
    case "Tab":
      event.preventDefault();
      tabMove(event.shiftKey ? -1 : 1);
      return;
    case "Enter":
      event.preventDefault();
      beginEdit(null, { selectAll: true });
      return;
    case "F2":
      event.preventDefault();
      beginEdit(null, { selectAll: false });
      return;
    case "Delete":
    case "Backspace":
      event.preventDefault();
      clearSelection();
      return;
    case "Escape":
      if (state.active.row !== state.anchor.row || state.active.col !== state.anchor.col) {
        state.anchor = { ...state.active };
        state.lastCellPointer = null;
        renderAll();
      }
      return;
    default:
      break;
  }

  if (event.key.length === 1) {
    event.preventDefault();
    beginEdit(event.key, { selectAll: false });
  }
}

/* ------------------------------------------------------------------ */
/* Formula bar                                                         */
/* ------------------------------------------------------------------ */

function commitFormulaBar() {
  if (!state.loaded) return false;
  const address = state.formulaTarget || activeAddress();
  const next = dom.formulaInput.value;
  state.formulaTarget = null;
  if (state.wb.getRaw(address) === next) {
    renderChrome();
    return false;
  }
  const coords = coordsFor(address);
  const applied = applyChanges({ [address]: next }, `Edit ${address}`, coords ? { active: coords, anchor: coords } : {});
  if (applied) {
    flashRecalc();
    announce(`${address} updated.`);
  }
  return applied;
}

function handleFormulaFocus() {
  if (!state.loaded) return;
  state.formulaTarget = activeAddress();
  dom.formulaInput.select();
}

function handleFormulaKeyDown(event) {
  if (event.isComposing) return;
  if (event.key === "Enter") {
    event.preventDefault();
    event.stopPropagation();
    commitFormulaBar();
    dom.formulaInput.blur();
    focusGrid();
  } else if (event.key === "Escape") {
    event.preventDefault();
    event.stopPropagation();
    dom.formulaInput.value = state.wb.getRaw(state.formulaTarget || activeAddress());
    state.formulaTarget = null;
    dom.formulaInput.blur();
    focusGrid();
  }
}

function handleFormulaBlur() {
  if (!state.formulaTarget) return;
  commitFormulaBar();
}

/* ------------------------------------------------------------------ */
/* Clipboard                                                           */
/* ------------------------------------------------------------------ */

function clipboardText() {
  const bounds = selectionBounds();
  const lines = [];
  for (let row = bounds.top; row <= bounds.bottom; row += 1) {
    const cells = [];
    for (let col = bounds.left; col <= bounds.right; col += 1) {
      cells.push(state.wb.getRaw(cellAddress(row, col)));
    }
    lines.push(cells.join("\t"));
  }
  return lines.join("\n");
}

function copySelection(event) {
  if (state.editing || document.activeElement === dom.formulaInput || isTypingTarget(event.target)) return;
  const text = clipboardText();
  if (event.clipboardData) {
    event.preventDefault();
    event.clipboardData.setData("text/plain", text);
  }
  const bounds = selectionBounds();
  const count = boundsSize(bounds);
  showToast(`Copied ${rangeLabel(bounds)}${count > 1 ? ` · ${plural(count, "cell")}` : ""}`);
  announce("Selection copied to clipboard.");
}

function cutSelection(event) {
  if (state.editing || document.activeElement === dom.formulaInput || isTypingTarget(event.target)) return;
  if (event.clipboardData) {
    event.preventDefault();
    event.clipboardData.setData("text/plain", clipboardText());
  }
  const bounds = selectionBounds();
  clearSelection();
  showToast(`Cut ${rangeLabel(bounds)}`);
}

function pasteSelection(event) {
  if (!state.loaded || state.editing || document.activeElement === dom.formulaInput || isTypingTarget(event.target)) return;
  const text = event.clipboardData?.getData("text/plain");
  if (text == null) return;
  event.preventDefault();
  if (text === "") return;

  const normalized = text.replace(/\r\n?/g, "\n").replace(/\n$/, "");
  const rows = normalized.split("\n").map((line) => line.split("\t"));
  const bounds = selectionBounds();
  const start = { row: bounds.top, col: bounds.left };
  const updates = {};
  let pasted = 0;
  let lastRow = start.row;
  let lastCol = start.col;

  for (let r = 0; r < rows.length; r += 1) {
    for (let c = 0; c < rows[r].length; c += 1) {
      const row = start.row + r;
      const col = start.col + c;
      if (row >= ROWS || col >= COLS) continue;
      const address = cellAddress(row, col);
      updates[address] = rows[r][c];
      pasted += 1;
      lastRow = Math.max(lastRow, row);
      lastCol = Math.max(lastCol, col);
    }
  }

  applyChanges(updates, "Paste", {
    active: { row: lastRow, col: lastCol },
    anchor: { ...start },
  });
  showToast(`Pasted ${plural(pasted, "cell")} at ${cellAddress(start.row, start.col)}`);
  announce(`${plural(pasted, "cell")} pasted.`);
}

/* ------------------------------------------------------------------ */
/* Server persistence                                                  */
/* ------------------------------------------------------------------ */

async function loadWorkbook() {
  try {
    const response = await fetch("/api/workbook", { headers: { Accept: "application/json" }, cache: "no-store" });
    if (!response.ok) throw new Error(`Workbook endpoint returned ${response.status}`);
    const payload = await response.json();
    state.wb.load(payload.cells || {});
    state.loaded = true;
    state.undoStack = [];
    state.redoStack = [];
    state.dirty = false;
    state.lastSavedAt = payload.updatedAt ? new Date(payload.updatedAt) : null;
    state.editVersion = Number.isSafeInteger(payload.revision) ? payload.revision : 0;
    setSaveState("saved", state.lastSavedAt ? `Saved ${formatClock(state.lastSavedAt)}` : "Workbook ready");
    renderAll();
    announce("Workbook loaded. Use arrow keys to move, Enter to edit.");
  } catch (error) {
    state.loaded = true;
    setSaveState("error", "Backend unavailable");
    showToast(`Could not load the workbook: ${error.message}`, "error");
    renderAll();
  }
}

function queueSave() {
  if (!state.loaded) return;
  state.editVersion = Math.max(Date.now(), state.editVersion + 1);
  state.dirty = true;
  state.saveQueued = true;
  if (!state.saveRunning) void drainSaveQueue();
}

async function drainSaveQueue() {
  if (state.saveRunning) return;
  state.saveRunning = true;
  while (state.saveQueued) {
    state.saveQueued = false;
    setSaveState("saving", "Saving…");
    try {
      const response = await fetch("/api/workbook", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ cells: state.wb.toJSON(), version: state.editVersion }),
      });
      if (!response.ok) throw new Error(`Save failed (${response.status})`);
      await response.json().catch(() => ({}));
      state.lastSavedAt = new Date();
      state.saveErrorShown = false;
      if (!state.saveQueued) {
        state.dirty = false;
        setSaveState("saved", `Saved ${formatClock(state.lastSavedAt)}`);
      }
    } catch (error) {
      if (!state.saveQueued) {
        setSaveState("error", "Save failed");
        if (!state.saveErrorShown) {
          showToast("Changes could not be saved. Check the server connection.", "error");
          state.saveErrorShown = true;
        }
        break;
      }
    }
  }
  state.saveRunning = false;
  if (state.saveQueued) void drainSaveQueue();
}

function sendBeaconSnapshot() {
  if (!state.loaded || (!state.dirty && !state.saveQueued && !state.saveRunning)) return;
  try {
    const blob = new Blob([JSON.stringify({ cells: state.wb.toJSON(), version: state.editVersion })], {
      type: "application/json",
    });
    navigator.sendBeacon?.("/api/workbook", blob);
  } catch {
    /* Best effort on page departure. */
  }
}

/* ------------------------------------------------------------------ */
/* Events                                                              */
/* ------------------------------------------------------------------ */

function jumpToAddress(address) {
  const coords = coordsFor(address);
  if (!coords) return;
  flushPendingEditors();
  state.active = coords;
  state.anchor = { ...coords };
  state.lastCellPointer = null;
  renderAll();
  focusGrid();
}

function bindEvents() {
  dom.undoBtn.addEventListener("click", undo);
  dom.redoBtn.addEventListener("click", redo);

  dom.formulaToggle.addEventListener("click", () => {
    state.showFormulas = !state.showFormulas;
    writeFormulaPreference(state.showFormulas);
    renderAll();
    announce(state.showFormulas ? "Showing raw formulas." : "Showing computed values.");
  });

  dom.sheetViewport.addEventListener("mousedown", handleSheetMouseDown);
  document.addEventListener("mousemove", handleDocumentMouseMove);
  document.addEventListener("mouseup", stopDragging);
  document.addEventListener("keydown", handleGlobalKeyDown);

  dom.formulaInput.addEventListener("focus", handleFormulaFocus);
  dom.formulaInput.addEventListener("keydown", handleFormulaKeyDown);
  dom.formulaInput.addEventListener("blur", handleFormulaBlur);

  dom.inspector.addEventListener("mousedown", (event) => {
    const target = event.target.closest("[data-jump]");
    if (!target) return;
    event.preventDefault();
    jumpToAddress(target.dataset.jump);
  });

  dom.inspector.addEventListener("click", (event) => {
    const target = event.target.closest("[data-jump]");
    if (!target) return;
    jumpToAddress(target.dataset.jump);
  });

  dom.inspector.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    const target = event.target.closest("[data-jump]");
    if (!target) return;
    event.preventDefault();
    jumpToAddress(target.dataset.jump);
  });

  document.addEventListener("copy", copySelection);
  document.addEventListener("cut", cutSelection);
  document.addEventListener("paste", pasteSelection);
  window.addEventListener("pagehide", sendBeaconSnapshot);

}

function init() {
  bindEvents();
  renderAll();
  loadWorkbook();
}

init();
