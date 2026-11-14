import { addressOrder, COLS, isValidAddress, normalizeAddress, ROWS } from './address.js';
import { ERRORS, errorValue, isError } from './errors.js';
import { parseFormula } from './parser.js';
import { evaluateNode } from './evaluator.js';

export const HISTORY_LIMIT = 60;
const PARSE_CACHE_LIMIT = 4000;
const parseCache = new Map();

function cachedParse(raw, rows, cols) {
  const key = `${rows}x${cols}|${raw}`;
  let entry = parseCache.get(key);
  if (!entry) {
    entry = parseFormula(raw, { rows, cols });
    if (parseCache.size >= PARSE_CACHE_LIMIT) parseCache.clear();
    parseCache.set(key, entry);
  }
  return entry;
}

const NUMBER_RE = /^[-+]?(\d+\.?\d*|\.\d+)([eE][-+]?\d+)?$/;

export function literalValue(raw) {
  const text = String(raw).trim();
  if (text === '') return null;
  if (NUMBER_RE.test(text)) {
    const num = Number(text);
    if (Number.isFinite(num)) return num;
  }
  const upper = text.toUpperCase();
  if (upper === 'TRUE') return true;
  if (upper === 'FALSE') return false;
  return String(raw);
}

export function rawKind(raw) {
  if (raw === null || raw === undefined || String(raw).trim() === '') return 'empty';
  if (String(raw).startsWith('=')) return 'formula';
  const value = literalValue(raw);
  if (typeof value === 'number') return 'number';
  if (typeof value === 'boolean') return 'boolean';
  return 'text';
}

export function formatValue(value) {
  if (value === null || value === undefined) return '';
  if (isError(value)) return value.error;
  if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return ERRORS.NUM;
    return String(Math.round(value * 1e10) / 1e10);
  }
  return String(value);
}

/** Iterative Tarjan SCC: returns every node that participates in a cycle. */
export function findCycleNodes(nodes, precedentsOf) {
  const indexOf = new Map();
  const low = new Map();
  const onStack = new Set();
  const stack = [];
  const cycles = new Set();
  let counter = 0;

  for (const root of nodes) {
    if (indexOf.has(root)) continue;
    indexOf.set(root, counter);
    low.set(root, counter);
    counter += 1;
    stack.push(root);
    onStack.add(root);
    const frames = [{ id: root, deps: precedentsOf(root), i: 0 }];

    while (frames.length > 0) {
      const frame = frames[frames.length - 1];
      if (frame.i < frame.deps.length) {
        const next = frame.deps[frame.i];
        frame.i += 1;
        if (!indexOf.has(next)) {
          indexOf.set(next, counter);
          low.set(next, counter);
          counter += 1;
          stack.push(next);
          onStack.add(next);
          frames.push({ id: next, deps: precedentsOf(next), i: 0 });
        } else if (onStack.has(next)) {
          low.set(frame.id, Math.min(low.get(frame.id), indexOf.get(next)));
        }
        continue;
      }

      frames.pop();
      if (frames.length > 0) {
        const parent = frames[frames.length - 1];
        low.set(parent.id, Math.min(low.get(parent.id), low.get(frame.id)));
      }
      if (low.get(frame.id) === indexOf.get(frame.id)) {
        const component = [];
        let member;
        do {
          member = stack.pop();
          onStack.delete(member);
          component.push(member);
        } while (member !== frame.id);
        if (component.length > 1) {
          component.forEach((id) => cycles.add(id));
        } else if (precedentsOf(component[0]).includes(component[0])) {
          cycles.add(component[0]);
        }
      }
    }
  }
  return cycles;
}

export class Workbook {
  constructor({ rows = ROWS, cols = COLS, cells = {} } = {}) {
    this.rows = rows;
    this.cols = cols;
    this.raw = new Map();
    this.parsed = new Map();
    this.values = new Map();
    this.deps = new Map();
    this.dependents = new Map();
    this.cycles = new Set();
    this.history = [];
    this.future = [];
    this.recalcId = 0;
    this.recalcLog = { id: 0, seed: [], order: [], cycles: [], evaluated: 0, at: 0 };
    this.load(cells);
  }

  load(cells) {
    this.raw.clear();
    this.parsed.clear();
    this.values.clear();
    this.deps.clear();
    this.dependents.clear();
    this.cycles.clear();
    const ids = [];
    for (const [key, value] of Object.entries(cells ?? {})) {
      const id = normalizeAddress(key);
      if (!id || !isValidAddress(id, this.rows, this.cols)) continue;
      const raw = value === null || value === undefined ? '' : String(value);
      if (raw === '') continue;
      this.raw.set(id, raw);
      ids.push(id);
    }
    for (const id of ids) this.prepareCell(id);
    this.recalculate(ids);
    this.history = [];
    this.future = [];
  }

  prepareCell(id) {
    const raw = this.raw.get(id) ?? '';
    const kind = rawKind(raw);
    if (kind === 'formula') {
      const parsed = cachedParse(raw, this.rows, this.cols);
      this.parsed.set(id, { kind, ...parsed });
      this.linkDependencies(id, parsed.refs);
    } else {
      this.parsed.set(id, { kind, ast: null, refs: [], error: null, literal: literalValue(raw) });
      this.linkDependencies(id, []);
    }
  }

  linkDependencies(id, refs) {
    const previous = this.deps.get(id);
    if (previous) {
      for (const ref of previous) {
        const set = this.dependents.get(ref);
        if (set) {
          set.delete(id);
          if (set.size === 0) this.dependents.delete(ref);
        }
      }
    }
    const next = new Set(refs);
    if (next.size === 0) this.deps.delete(id);
    else this.deps.set(id, next);
    for (const ref of next) {
      if (!this.dependents.has(ref)) this.dependents.set(ref, new Set());
      this.dependents.get(ref).add(id);
    }
  }

  getRaw(id) {
    return this.raw.get(id) ?? '';
  }

  getValue(id) {
    return this.values.has(id) ? this.values.get(id) : null;
  }

  getDisplay(id) {
    return formatValue(this.getValue(id));
  }

  getKind(id) {
    return this.parsed.get(id)?.kind ?? 'empty';
  }

  getError(id) {
    const value = this.getValue(id);
    return isError(value) ? value.error : null;
  }

  getPrecedents(id) {
    return [...(this.deps.get(id) ?? [])].sort((a, b) => addressOrder(a, this.cols) - addressOrder(b, this.cols));
  }

  getDependents(id) {
    return [...(this.dependents.get(id) ?? [])].sort((a, b) => addressOrder(a, this.cols) - addressOrder(b, this.cols));
  }

  isFormula(id) {
    return this.getKind(id) === 'formula';
  }

  /** Transitive closure of dependents — the only cells that need recomputation. */
  affectedCells(seedIds) {
    const dirty = new Set();
    const queue = [...seedIds];
    while (queue.length > 0) {
      const id = queue.pop();
      if (dirty.has(id)) continue;
      dirty.add(id);
      for (const dependent of this.dependents.get(id) ?? []) {
        if (!dirty.has(dependent)) queue.push(dependent);
      }
    }
    return dirty;
  }

  recalculate(seedIds) {
    const dirty = this.affectedCells(seedIds);
    const nodes = [...dirty].sort((a, b) => addressOrder(a, this.cols) - addressOrder(b, this.cols));
    const inDirty = (id) => dirty.has(id);
    const precedentsOf = (id) => (this.deps.get(id) ? [...this.deps.get(id)].filter(inDirty) : []);

    const cycleNodes = findCycleNodes(nodes, precedentsOf);
    for (const id of nodes) {
      if (cycleNodes.has(id)) this.cycles.add(id);
      else this.cycles.delete(id);
    }

    const localDependents = new Map();
    const indegree = new Map();
    const acyclic = nodes.filter((id) => !cycleNodes.has(id));
    for (const id of acyclic) {
      indegree.set(id, 0);
      localDependents.set(id, []);
    }
    for (const id of acyclic) {
      for (const precedent of precedentsOf(id)) {
        if (cycleNodes.has(precedent)) continue;
        indegree.set(id, indegree.get(id) + 1);
        localDependents.get(precedent).push(id);
      }
    }

    const ready = acyclic.filter((id) => indegree.get(id) === 0);
    const order = [];
    while (ready.length > 0) {
      const id = ready.shift();
      order.push(id);
      for (const dependent of localDependents.get(id) ?? []) {
        const remaining = indegree.get(dependent) - 1;
        indegree.set(dependent, remaining);
        if (remaining === 0) ready.push(dependent);
      }
    }

    for (const id of cycleNodes) this.values.set(id, errorValue(ERRORS.CYCLE));

    const ctx = { getValue: (ref) => this.getValue(ref) };
    for (const id of order) {
      const entry = this.parsed.get(id);
      if (!entry) {
        this.values.delete(id);
        continue;
      }
      if (entry.kind !== 'formula') {
        this.values.set(id, entry.literal);
        continue;
      }
      if (entry.error) {
        this.values.set(id, entry.error);
        continue;
      }
      let value;
      try {
        value = evaluateNode(entry.ast, ctx);
      } catch {
        value = errorValue(ERRORS.VALUE);
      }
      this.values.set(id, value === undefined ? null : value);
    }

    this.recalcId += 1;
    this.recalcLog = {
      id: this.recalcId,
      seed: [...seedIds],
      order,
      cycles: [...cycleNodes],
      evaluated: order.length + cycleNodes.size,
      at: Date.now(),
    };
    return this.recalcLog;
  }

  applyChanges(changes, { record = true } = {}) {
    const patch = [];
    for (const change of changes) {
      const id = normalizeAddress(change.id ?? change.cell);
      if (!id || !isValidAddress(id, this.rows, this.cols)) continue;
      const after = change.raw === null || change.raw === undefined ? '' : String(change.raw);
      const before = this.raw.get(id) ?? '';
      if (before === after) continue;
      patch.push({ id, before, after });
    }
    if (patch.length === 0) return { changed: false, patch: [] };

    if (record) {
      this.history.push(patch);
      if (this.history.length > HISTORY_LIMIT) this.history.shift();
      this.future = [];
    }

    for (const { id, after } of patch) {
      if (after === '') {
        this.raw.delete(id);
        this.parsed.delete(id);
        this.values.delete(id);
        this.linkDependencies(id, []);
        this.cycles.delete(id);
      } else {
        this.raw.set(id, after);
        this.prepareCell(id);
      }
    }

    this.recalculate(patch.map((entry) => entry.id));
    return { changed: true, patch };
  }

  setCell(id, raw, options) {
    return this.applyChanges([{ id, raw }], options);
  }

  setCells(entries, options) {
    return this.applyChanges(entries.map(([id, raw]) => ({ id, raw })), options);
  }

  get canUndo() {
    return this.history.length > 0;
  }

  get canRedo() {
    return this.future.length > 0;
  }

  undo() {
    const patch = this.history.pop();
    if (!patch) return false;
    this.future.push(patch);
    this.applyChanges(patch.map(({ id, before }) => ({ id, raw: before })), { record: false });
    return true;
  }

  redo() {
    const patch = this.future.pop();
    if (!patch) return false;
    this.history.push(patch);
    this.applyChanges(patch.map(({ id, after }) => ({ id, raw: after })), { record: false });
    return true;
  }

  clear() {
    const changes = [...this.raw.keys()].map((id) => ({ id, raw: '' }));
    return this.applyChanges(changes);
  }

  toJSON() {
    const cells = {};
    for (const [id, raw] of this.raw) cells[id] = raw;
    const computed = {};
    for (const [id, value] of this.values) computed[id] = value === undefined ? null : value;
    return { rows: this.rows, cols: this.cols, cells, computed, cycles: [...this.cycles] };
  }

  static fromJSON(data) {
    return new Workbook({
      rows: data?.rows ?? ROWS,
      cols: data?.cols ?? COLS,
      cells: data?.cells ?? {},
    });
  }
}