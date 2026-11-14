/**
 * Reactive workbook: raw cell text, a bidirectional dependency graph,
 * incremental recalculation, cycle detection, and undo/redo history.
 *
 * This module is pure JavaScript ESM with no DOM or Node-specific imports,
 * so the SAME engine runs in the browser and on the server (verification).
 */

import {
  ROWS,
  COLS,
  makeCellId,
  parseCellRef,
  inBounds,
  cellSortKey,
} from './cells.js';
import { parseFormula } from './parser.js';
import { evaluateAst, evaluateLiteral, displayValue, err, blank } from './evaluator.js';
import { orderForRecompute } from './graph.js';

export const HISTORY_LIMIT = 50; // >= 20 requested edits

export class Workbook {
  constructor() {
    this.raw = new Map(); // id -> raw text (only non-empty cells)
    this.parsed = new Map(); // id -> { ast, deps, error } for formula cells
    this.results = new Map(); // id -> computed Value
    this.deps = new Map(); // id (formula) -> Set<id> cells it reads
    this.rdeps = new Map(); // id -> Set<id> formula cells that read it
    this.undoStack = [];
    this.redoStack = [];
    this.listeners = new Set();
    this.lastChange = null; // { changed, affected, recomputed, cycleNodes }
  }

  subscribe(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  emit(event) {
    for (const fn of this.listeners) fn(event);
  }

  isFormula(raw) {
    return typeof raw === 'string' && raw.trimStart().startsWith('=');
  }

  // ---------------------------------------------------------------- indexing

  /** Remove a cell's outgoing graph edges. */
  _unindex(id) {
    const old = this.deps.get(id) || new Set();
    for (const dep of old) {
      const set = this.rdeps.get(dep);
      if (set) {
        set.delete(id);
        if (set.size === 0) this.rdeps.delete(dep);
      }
    }
    this.deps.delete(id);
    this.parsed.delete(id);
  }

  /** Parse a cell and register its outgoing graph edges. */
  _index(id, raw) {
    if (!this.isFormula(raw)) return;
    const info = parseFormula(raw);
    this.parsed.set(id, info);
    if (info.deps.size === 0) return;
    this.deps.set(id, new Set(info.deps));
    for (const dep of info.deps) {
      if (!this.rdeps.has(dep)) this.rdeps.set(dep, new Set());
      this.rdeps.get(dep).add(id);
    }
  }

  // -------------------------------------------------------------- loading

  /** Replace the entire workbook from a { id: rawText } map. */
  load(cells = {}, { clearHistory = true } = {}) {
    this.raw = new Map();
    this.parsed = new Map();
    this.results = new Map();
    this.deps = new Map();
    this.rdeps = new Map();

    if (cells && typeof cells === 'object') {
      for (const [key, value] of Object.entries(cells)) {
        const ref = parseCellRef(key);
        if (!ref || !inBounds(ref.row, ref.col)) continue;
        const raw = value == null ? '' : String(value);
        if (raw === '') continue;
        this.raw.set(ref.id, raw);
        this._index(ref.id, raw);
      }
    }

    this.fullRecompute();
    if (clearHistory) {
      this.undoStack = [];
      this.redoStack = [];
    }
    this.emit({ type: 'load' });
  }

  fullRecompute() {
    this.results = new Map();
    const all = new Set(this.raw.keys());
    const info = this._recompute(all);
    this.lastChange = {
      changed: [],
      affected: [...all],
      recomputed: info.recomputed,
      cycleNodes: [...info.cycleNodes],
      full: true,
    };
    return this.lastChange;
  }

  snapshot() {
    const out = {};
    for (const id of [...this.raw.keys()].sort((a, b) => cellSortKey(a) - cellSortKey(b))) {
      out[id] = this.raw.get(id);
    }
    return out;
  }

  /** Serializable computed results (used by the server for verification). */
  computedSnapshot() {
    const out = {};
    for (const id of [...this.raw.keys()].sort((a, b) => cellSortKey(a) - cellSortKey(b))) {
      const v = this.getComputed(id);
      out[id] = {
        display: displayValue(v),
        error: v.error || null,
        type: v.type,
      };
    }
    return out;
  }

  // -------------------------------------------------------------- editing

  /**
   * Apply one or more cell edits as a single undoable transaction.
   * @param {Record<string,string>|Map<string,string>} changes
   */
  commit(changes, { history = true } = {}) {
    const entries = changes instanceof Map ? [...changes.entries()] : Object.entries(changes || {});
    const normalized = [];
    for (const [key, value] of entries) {
      const ref = parseCellRef(key);
      if (!ref || !inBounds(ref.row, ref.col)) continue;
      const raw = value == null ? '' : String(value);
      if ((this.raw.get(ref.id) || '') === raw) continue; // no-op edit
      normalized.push([ref.id, raw]);
    }
    if (normalized.length === 0) return null;

    const before = history ? this.snapshot() : null;

    for (const [id, raw] of normalized) {
      this._unindex(id);
      if (raw === '') {
        this.raw.delete(id);
        this.results.delete(id);
      } else {
        this.raw.set(id, raw);
        this._index(id, raw);
      }
    }

    // Only the changed cells and their transitive dependents are recalculated.
    const affected = this._affected(normalized.map(([id]) => id));
    const info = this._recompute(affected);

    if (history) {
      this.undoStack.push(before);
      if (this.undoStack.length > HISTORY_LIMIT) this.undoStack.shift();
      this.redoStack = [];
    }

    const change = {
      changed: normalized.map(([id]) => id),
      affected: [...affected],
      recomputed: info.recomputed,
      cycleNodes: [...info.cycleNodes],
      full: false,
    };
    this.lastChange = change;
    this.emit({ type: 'change', change });
    return change;
  }

  /** Breadth-first walk over reverse dependencies (forward references included). */
  _affected(changedIds) {
    const affected = new Set();
    const queue = [...changedIds];
    while (queue.length) {
      const id = queue.shift();
      if (affected.has(id)) continue;
      affected.add(id);
      const dependents = this.rdeps.get(id);
      if (dependents) {
        for (const d of dependents) if (!affected.has(d)) queue.push(d);
      }
    }
    return affected;
  }

  _recompute(affected) {
    const { steps, cycleNodes } = orderForRecompute(affected, (id) => this.deps.get(id) || []);
    const ctx = { get: (id) => this.getComputed(id) };

    for (const step of steps) {
      if (step.cycle) {
        // Every cell participating in a cycle is marked explicitly.
        this.results.set(step.id, err('#CYCLE!'));
        continue;
      }
      const raw = this.raw.get(step.id) || '';
      const info = this.parsed.get(step.id);
      if (!info) {
        this.results.set(step.id, evaluateLiteral(raw));
        continue;
      }
      if (info.error) {
        this.results.set(step.id, err(info.error));
        continue;
      }
      let value;
      try {
        value = evaluateAst(info.ast, ctx);
        if (value.type === 'range') value = err('#VALUE!'); // range outside a function
      } catch (e) {
        value = err(e && e.code ? e.code : '#VALUE!');
      }
      this.results.set(step.id, value);
    }

    return { recomputed: steps.length, cycleNodes };
  }

  // -------------------------------------------------------------- history

  undo() {
    if (this.undoStack.length === 0) return false;
    const previous = this.undoStack.pop();
    this.redoStack.push(this.snapshot());
    this.load(previous, { clearHistory: false });
    this.emit({ type: 'history', action: 'undo' });
    return true;
  }

  redo() {
    if (this.redoStack.length === 0) return false;
    const next = this.redoStack.pop();
    this.undoStack.push(this.snapshot());
    this.load(next, { clearHistory: false });
    this.emit({ type: 'history', action: 'redo' });
    return true;
  }

  canUndo() {
    return this.undoStack.length > 0;
  }

  canRedo() {
    return this.redoStack.length > 0;
  }

  // -------------------------------------------------------------- queries

  getRaw(id) {
    return this.raw.get(id) || '';
  }

  getComputed(id) {
    return this.results.get(id) || blank();
  }

  getDisplay(id) {
    return displayValue(this.getComputed(id));
  }

  /** Direct precedents (cells this formula reads). */
  getDeps(id) {
    return [...(this.deps.get(id) || [])].sort((a, b) => cellSortKey(a) - cellSortKey(b));
  }

  /** Direct dependents (formula cells reading this cell). */
  getDependents(id) {
    return [...(this.rdeps.get(id) || [])].sort((a, b) => cellSortKey(a) - cellSortKey(b));
  }

  /** All cells that transitively depend on id. */
  getTransitiveDependents(id) {
    const seen = new Set();
    const queue = [id];
    while (queue.length) {
      const cur = queue.shift();
      for (const d of this.rdeps.get(cur) || []) {
        if (!seen.has(d)) {
          seen.add(d);
          queue.push(d);
        }
      }
    }
    return [...seen].sort((a, b) => cellSortKey(a) - cellSortKey(b));
  }

  getTransitiveDeps(id) {
    const seen = new Set();
    const queue = [id];
    while (queue.length) {
      const cur = queue.shift();
      for (const d of this.deps.get(cur) || []) {
        if (!seen.has(d)) {
          seen.add(d);
          queue.push(d);
        }
      }
    }
    return [...seen].sort((a, b) => cellSortKey(a) - cellSortKey(b));
  }

  formulaCells() {
    return [...this.parsed.keys()].sort((a, b) => cellSortKey(a) - cellSortKey(b));
  }

  errorCells() {
    return [...this.raw.keys()]
      .filter((id) => this.getComputed(id).type === 'error')
      .sort((a, b) => cellSortKey(a) - cellSortKey(b));
  }

  /** Grid metadata, handy for the UI. */
  static get geometry() {
    return { rows: ROWS, cols: COLS, lastCell: makeCellId(ROWS, COLS - 1) };
  }
}
