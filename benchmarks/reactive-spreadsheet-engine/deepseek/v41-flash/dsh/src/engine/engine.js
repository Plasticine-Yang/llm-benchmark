/**
 * The reactive core: dependency graph + incremental recalculation.
 *
 * Every cell stores:
 *   - raw         the text the user typed ("=A1+1", "12", "hello")
 *   - precedents  the set of cells its formula reads (its inputs)
 *   - value       the last computed {v,e}
 *
 * `dependents` is the reverse index, so a change to one cell can find every
 * cell that must be recalculated, directly or indirectly, without touching
 * unrelated cells.
 *
 * Recalculation of the dirty sub-graph is done in three steps:
 *   1. Tarjan's SCC algorithm finds cells that are part of a cycle -> #CYCLE!
 *   2. Kahn's topological sort orders the remaining dirty cells so that every
 *      formula is evaluated after all of its inputs
 *   3. cells are evaluated in that order; error values propagate as values
 */
import { ERR, blank, value, errValue, isCellError } from './errors.js';
import { parseFormula } from './parser.js';
import { evaluate } from './evaluator.js';
import { parseRef, refName, expandRange } from './refs.js';

export const CELL_KIND = Object.freeze({
  EMPTY: 'empty',
  NUMBER: 'number',
  TEXT: 'text',
  BOOLEAN: 'boolean',
  FORMULA: 'formula',
  ERROR: 'error',
});

const NUMBER_RE = /^[+-]?(?:\d+(?:\.\d+)?|\.\d+)(?:[eE][+-]?\d+)?$/;

/** Classify raw cell input the way a spreadsheet would. */
export function kindOfRaw(raw) {
  if (raw === undefined || raw === null || raw === '') return CELL_KIND.EMPTY;
  if (raw[0] === '=') return CELL_KIND.FORMULA;
  if (NUMBER_RE.test(raw.trim())) return CELL_KIND.NUMBER;
  const u = raw.trim().toUpperCase();
  if (u === 'TRUE' || u === 'FALSE') return CELL_KIND.BOOLEAN;
  return CELL_KIND.TEXT;
}

/** Turn raw non-formula input into a value. */
export function literalValue(raw) {
  const kind = kindOfRaw(raw);
  switch (kind) {
    case CELL_KIND.EMPTY:
      return blank();
    case CELL_KIND.NUMBER:
      return value(Number(raw.trim()));
    case CELL_KIND.BOOLEAN:
      return value(raw.trim().toUpperCase() === 'TRUE');
    case CELL_KIND.TEXT:
      // a leading apostrophe forces text, like Excel
      return value(raw[0] === "'" ? raw.slice(1) : raw);
    default:
      return value(raw);
  }
}

export class SpreadsheetEngine {
  constructor({ rows = 60, cols = 26 } = {}) {
    this.rows = rows;
    this.cols = cols;
    this.raw = new Map(); // ref -> raw text
    this.nodes = new Map(); // ref -> {ast, literal, error, precedents:Set}
    this.dependents = new Map(); // ref -> Set<ref>
    this.values = new Map(); // ref -> {v,e}
    this.cycles = new Set(); // refs known to be in a cycle (last recalc)
    this.lastRecalc = []; // ordered refs recalculated by the last edit
    this.recalcCount = 0;
  }

  /* ------------------------------------------------------------------ *
   * reading
   * ------------------------------------------------------------------ */

  getRaw(ref) {
    const r = this.raw.get(ref);
    return r === undefined ? '' : r;
  }

  getValue(ref) {
    const v = this.values.get(ref);
    return v === undefined ? blank() : v;
  }

  getKind(ref) {
    return kindOfRaw(this.getRaw(ref));
  }

  isFormula(ref) {
    return this.getKind(ref) === CELL_KIND.FORMULA;
  }

  getNode(ref) {
    return this.nodes.get(ref);
  }

  /** Direct inputs of a cell. */
  getPrecedents(ref) {
    const node = this.nodes.get(ref);
    return node ? [...node.precedents] : [];
  }

  /** Direct consumers of a cell. */
  getDependents(ref) {
    const set = this.dependents.get(ref);
    return set ? [...set] : [];
  }

  /** Every cell that must be recalculated when `ref` changes (excluding ref). */
  getRecalcClosure(ref) {
    const out = new Set();
    const stack = [ref];
    while (stack.length) {
      const cur = stack.pop();
      const deps = this.dependents.get(cur);
      if (!deps) continue;
      for (const d of deps) {
        if (out.has(d)) continue;
        out.add(d);
        stack.push(d);
      }
    }
    return out;
  }

  /** Transitive inputs, with depth (1 = direct). */
  transitivePrecedents(ref) {
    const depth = new Map();
    const stack = [[ref, 0]];
    while (stack.length) {
      const [cur, d] = stack.pop();
      const node = this.nodes.get(cur);
      if (!node) continue;
      for (const p of node.precedents) {
        if (depth.has(p)) continue;
        depth.set(p, d + 1);
        stack.push([p, d + 1]);
      }
    }
    return depth;
  }

  /** Transitive consumers, with depth (1 = direct). */
  transitiveDependents(ref) {
    const depth = new Map();
    const stack = [[ref, 0]];
    while (stack.length) {
      const [cur, d] = stack.pop();
      const deps = this.dependents.get(cur);
      if (!deps) continue;
      for (const c of deps) {
        if (depth.has(c)) continue;
        depth.set(c, d + 1);
        stack.push([c, d + 1]);
      }
    }
    return depth;
  }

  /** Display text for a cell, exactly as the grid should render it. */
  getDisplay(ref) {
    const { v, e } = this.getValue(ref);
    if (e) return e;
    if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE';
    if (typeof v === 'number') return formatNumber(v);
    return v === null || v === undefined ? '' : String(v);
  }

  /* ------------------------------------------------------------------ *
   * writing
   * ------------------------------------------------------------------ */

  setRaw(ref, raw) {
    return this.setMany([[ref, raw]]);
  }

  clearAll() {
    this.raw.clear();
    this.nodes.clear();
    this.dependents.clear();
    this.values.clear();
    this.cycles.clear();
    this.lastRecalc = [];
  }

  /** Replace the whole workbook (used when loading from the server). */
  load(cells) {
    this.clearAll();
    const entries = [];
    for (const [ref, raw] of Object.entries(cells || {})) {
      if (!parseRef(ref)) continue;
      if (typeof raw !== 'string' || raw === '') continue;
      entries.push([ref, raw]);
    }
    const res = this.setMany(entries, { force: true });
    return res;
  }

  /** Export only non-empty raw values. */
  serialize() {
    const cells = {};
    for (const ref of [...this.raw.keys()].sort(compareRefs)) {
      const raw = this.raw.get(ref);
      if (raw !== undefined && raw !== '') cells[ref] = raw;
    }
    return cells;
  }

  /**
   * Apply a batch of raw edits, then recalculate only what they affect.
   * @param {Array<[string,string]>} entries
   * @returns {{changed:string[], recalculated:string[], cycles:string[]}}
   */
  setMany(entries, { force = false } = {}) {
    const changed = [];
    for (const [rawRef, rawInput] of entries) {
      const parsed = parseRef(rawRef);
      if (!parsed) continue;
      const ref = parsed.ref;
      const raw = rawInput === undefined || rawInput === null ? '' : String(rawInput);
      const prev = this.raw.get(ref);
      const prevRaw = prev === undefined ? '' : prev;
      if (!force && prevRaw === raw) continue;

      this.unlink(ref);
      if (raw === '') {
        this.raw.delete(ref);
        this.nodes.delete(ref);
        // forget the cache immediately: dependents must read this as blank
        this.values.delete(ref);
      } else {
        this.raw.set(ref, raw);
        this.parseCell(ref, raw);
      }
      changed.push(ref);
    }

    if (!changed.length) return { changed: [], recalculated: [], cycles: [] };

    const dirty = new Set(changed);
    for (const ref of changed) {
      for (const d of this.getRecalcClosure(ref)) dirty.add(d);
    }
    const { order, cycles } = this.recalculate(dirty);
    this.lastRecalc = order;
    this.cycles = cycles;
    this.recalcCount += 1;
    return { changed, recalculated: order, cycles: [...cycles] };
  }

  /** Recalculate everything from scratch. */
  recalculateAll() {
    const dirty = new Set([...this.raw.keys()]);
    const { order, cycles } = this.recalculate(dirty);
    this.lastRecalc = order;
    this.cycles = cycles;
    this.recalcCount += 1;
    return { recalculated: order, cycles: [...cycles] };
  }

  /* ------------------------------------------------------------------ *
   * graph maintenance
   * ------------------------------------------------------------------ */

  parseCell(ref, raw) {
    const kind = kindOfRaw(raw);
    if (kind === CELL_KIND.FORMULA) {
      const { ast, precedents, error } = parseFormula(raw.slice(1));
      this.nodes.set(ref, { ast, error, precedents });
      this.link(ref, precedents);
      return;
    }
    this.nodes.set(ref, {
      ast: null,
      error: null,
      literal: literalValue(raw),
      precedents: new Set(),
    });
  }

  link(ref, precedents) {
    for (const p of precedents) {
      let set = this.dependents.get(p);
      if (!set) {
        set = new Set();
        this.dependents.set(p, set);
      }
      set.add(ref);
    }
  }

  unlink(ref) {
    const node = this.nodes.get(ref);
    if (!node) return;
    for (const p of node.precedents) {
      const set = this.dependents.get(p);
      if (set) {
        set.delete(ref);
        if (set.size === 0) this.dependents.delete(p);
      }
    }
  }

  /* ------------------------------------------------------------------ *
   * recalculation
   * ------------------------------------------------------------------ */

  evaluateCell(ref) {
    const node = this.nodes.get(ref);
    if (!node) return blank();
    if (node.literal) return node.literal;
    if (node.error) return errValue(node.error);
    const ctx = {
      get: (r) => this.getValue(r),
      area: (from, to) => (expandRange(from, to) || []).map((r) => this.getValue(r)),
    };
    return evaluate(node.ast, ctx);
  }

  /**
   * Recalculate the given set of cells in dependency order.
   * @returns {{order:string[], cycles:Set<string>}}
   */
  recalculate(dirty) {
    const nodes = [...dirty].filter((ref) => this.nodes.has(ref) || this.raw.has(ref));
    const inDirty = new Set(nodes);

    // deps within the dirty set: node -> [precedents that are dirty]
    const deps = new Map();
    for (const ref of nodes) {
      const node = this.nodes.get(ref);
      const list = [];
      if (node) {
        for (const p of node.precedents) if (inDirty.has(p)) list.push(p);
      }
      deps.set(ref, list);
    }

    const cycles = findCycleNodes(nodes, deps);

    // Cells inside a cycle can never produce a value.
    for (const ref of cycles) this.values.set(ref, errValue(ERR.CYCLE));

    const rest = nodes.filter((ref) => !cycles.has(ref));
    const restSet = new Set(rest);

    // Kahn topological sort over the acyclic remainder.
    const indegree = new Map();
    const consumers = new Map();
    for (const ref of rest) {
      let deg = 0;
      for (const p of deps.get(ref)) {
        if (!restSet.has(p)) continue; // cycle members / outside dirty set
        deg += 1;
        let list = consumers.get(p);
        if (!list) {
          list = [];
          consumers.set(p, list);
        }
        list.push(ref);
      }
      indegree.set(ref, deg);
    }

    const queue = rest.filter((ref) => indegree.get(ref) === 0);
    const order = [];
    while (queue.length) {
      const ref = queue.shift();
      order.push(ref);
      this.values.set(ref, this.evaluateCell(ref));
      for (const c of consumers.get(ref) || []) {
        const left = indegree.get(c) - 1;
        indegree.set(c, left);
        if (left === 0) queue.push(c);
      }
    }

    // Defensive: anything left over is entangled with a cycle.
    const done = new Set(order);
    for (const ref of rest) {
      if (!done.has(ref)) {
        order.push(ref);
        this.values.set(ref, errValue(ERR.CYCLE));
        cycles.add(ref);
      }
    }

    // drop cached values for cells that no longer exist
    for (const ref of [...this.values.keys()]) {
      if (!this.raw.has(ref)) this.values.delete(ref);
    }

    return { order: [...cycles, ...order], cycles };
  }
}

/** Tarjan's strongly connected components -> set of cells inside a cycle. */
function findCycleNodes(nodes, deps) {
  const index = new Map();
  const low = new Map();
  const onStack = new Set();
  const stack = [];
  const out = new Set();
  let counter = 0;

  const strongConnect = (v) => {
    index.set(v, counter);
    low.set(v, counter);
    counter += 1;
    stack.push(v);
    onStack.add(v);

    for (const w of deps.get(v) || []) {
      if (!index.has(w)) {
        strongConnect(w);
        low.set(v, Math.min(low.get(v), low.get(w)));
      } else if (onStack.has(w)) {
        low.set(v, Math.min(low.get(v), index.get(w)));
      }
    }

    if (low.get(v) === index.get(v)) {
      const comp = [];
      let w;
      do {
        w = stack.pop();
        onStack.delete(w);
        comp.push(w);
      } while (w !== v && stack.length);
      if (comp.length > 1) {
        for (const c of comp) out.add(c);
      } else if ((deps.get(v) || []).includes(v)) {
        out.add(v); // self reference
      }
    }
  };

  for (const n of nodes) if (!index.has(n)) strongConnect(n);
  return out;
}

function compareRefs(a, b) {
  const ra = parseRef(a);
  const rb = parseRef(b);
  if (!ra || !rb) return a < b ? -1 : 1;
  if (ra.row !== rb.row) return ra.row - rb.row;
  return ra.col - rb.col;
}

/** Compact number formatting for the grid. */
export function formatNumber(n) {
  if (!Number.isFinite(n)) return String(n);
  if (Number.isInteger(n) && Math.abs(n) < 1e15) return String(n);
  const rounded = Math.round(n * 1e10) / 1e10;
  let s = String(rounded);
  if (s.includes('e')) s = rounded.toExponential(6).replace(/\.?0+e/, 'e');
  return s;
}

export { refName, parseRef, expandRange };
