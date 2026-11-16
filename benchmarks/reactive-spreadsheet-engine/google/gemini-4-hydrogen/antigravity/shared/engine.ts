import { compareCellIds, expandRangeIds, parseCellId } from './coords.js';
import { ASTNode, parseFormula, ParseResult } from './parser.js';
import {
  CellSnapshot,
  DEFAULT_COLS,
  DEFAULT_ROWS,
  GridDimensions,
  PersistedCell,
  RecalcResult,
  SpreadsheetErrorCode,
} from './types.js';

type EvalValue =
  | { kind: 'number'; value: number }
  | { kind: 'text'; value: string }
  | { kind: 'empty' }
  | { kind: 'error'; code: SpreadsheetErrorCode; detail: string };

const NUMERIC_LITERAL_REGEX = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/;

export function formatNumberDisplay(value: number): string {
  if (Object.is(value, -0) || value === 0) return '0';
  const cleaned = Number(value.toPrecision(12));
  return String(cleaned);
}

export class SpreadsheetEngine {
  readonly dims: GridDimensions;
  private rawCells = new Map<string, string>();
  private parseCache = new Map<string, ParseResult>();
  private deps = new Map<string, Set<string>>();
  private revDeps = new Map<string, Set<string>>();
  private snapshots = new Map<string, CellSnapshot>();

  constructor(
    initialCells?: Record<string, string | PersistedCell>,
    dims: GridDimensions = { rows: DEFAULT_ROWS, cols: DEFAULT_COLS }
  ) {
    this.dims = dims;
    if (initialCells) {
      this.loadCells(initialCells);
    }
  }

  loadCells(cells: Record<string, string | PersistedCell>): RecalcResult {
    this.rawCells.clear();
    this.parseCache.clear();
    this.deps.clear();
    this.revDeps.clear();
    this.snapshots.clear();

    const updates: Record<string, string> = {};
    for (const [id, entry] of Object.entries(cells)) {
      const normalized = id.toUpperCase();
      if (!parseCellId(normalized, this.dims)) continue;
      const raw = typeof entry === 'string' ? entry : entry.raw;
      if (raw !== '') {
        updates[normalized] = raw;
      }
    }
    return this.setCells(updates);
  }

  setCell(id: string, raw: string): RecalcResult {
    return this.setCells({ [id]: raw });
  }

  setCells(updates: Record<string, string>): RecalcResult {
    const start = performance.now();
    const changedIds: string[] = [];

    for (const [rawId, rawValue] of Object.entries(updates)) {
      const id = rawId.trim().toUpperCase();
      if (!parseCellId(id, this.dims)) {
        continue;
      }
      const prevRaw = this.rawCells.get(id) ?? '';
      if (prevRaw === rawValue && this.snapshots.has(id) === (rawValue !== '')) {
        continue;
      }
      changedIds.push(id);
      this.updateCellDefinition(id, rawValue);
    }

    if (changedIds.length === 0) {
      return {
        changedIds: [],
        recalculatedIds: [],
        cycleCells: [],
        durationMs: 0,
      };
    }

    const { recalculatedIds, cycleCells } = this.recalculateAffected(changedIds);
    const durationMs = Math.max(0, performance.now() - start);
    return {
      changedIds,
      recalculatedIds,
      cycleCells,
      durationMs,
    };
  }

  clear(): RecalcResult {
    const allIds = Array.from(this.rawCells.keys());
    const updates: Record<string, string> = {};
    for (const id of allIds) {
      updates[id] = '';
    }
    return this.setCells(updates);
  }

  getRaw(id: string): string {
    return this.rawCells.get(id.toUpperCase()) ?? '';
  }

  getCell(id: string): CellSnapshot {
    const normalized = id.toUpperCase();
    const dependents = this.getDirectDependents(normalized);
    const existing = this.snapshots.get(normalized);
    if (existing) {
      return {
        ...existing,
        dependents,
      };
    }
    return {
      id: normalized,
      raw: '',
      isFormula: false,
      valueType: 'empty',
      computed: null,
      display: '',
      error: null,
      errorDetail: null,
      inCycle: false,
      cyclePath: null,
      dependencies: [],
      dependents,
    };
  }

  getDirectDependencies(id: string): string[] {
    const set = this.deps.get(id.toUpperCase());
    return set ? Array.from(set).sort(compareCellIds) : [];
  }

  getDirectDependents(id: string): string[] {
    const set = this.revDeps.get(id.toUpperCase());
    return set ? Array.from(set).sort(compareCellIds) : [];
  }

  getIndirectDependencies(id: string): string[] {
    return this.collectTransitive(id.toUpperCase(), this.deps);
  }

  getIndirectDependents(id: string): string[] {
    return this.collectTransitive(id.toUpperCase(), this.revDeps);
  }

  getAllActiveSnapshots(): Record<string, CellSnapshot> {
    const result: Record<string, CellSnapshot> = {};
    for (const id of this.rawCells.keys()) {
      result[id] = this.getCell(id);
    }
    return result;
  }

  exportPersistedCells(): Record<string, PersistedCell> {
    const result: Record<string, PersistedCell> = {};
    const sortedIds = Array.from(this.rawCells.keys()).sort(compareCellIds);
    for (const id of sortedIds) {
      const snap = this.getCell(id);
      result[id] = {
        raw: snap.raw,
        valueType: snap.valueType,
        computed: snap.computed,
        display: snap.display,
        error: snap.error,
        inCycle: snap.inCycle,
      };
    }
    return result;
  }

  exportRawMap(): Record<string, string> {
    const result: Record<string, string> = {};
    for (const [id, raw] of this.rawCells.entries()) {
      result[id] = raw;
    }
    return result;
  }

  private collectTransitive(
    startId: string,
    graph: Map<string, Set<string>>
  ): string[] {
    const direct = graph.get(startId) ?? new Set<string>();
    const visited = new Set<string>([startId]);
    const queue: string[] = [];

    for (const n of direct) {
      if (!visited.has(n)) {
        visited.add(n);
        queue.push(n);
      }
    }

    const indirect = new Set<string>();
    for (let i = 0; i < queue.length; i++) {
      const curr = queue[i];
      const nexts = graph.get(curr);
      if (!nexts) continue;
      for (const nxt of nexts) {
        if (!visited.has(nxt)) {
          visited.add(nxt);
          queue.push(nxt);
          indirect.add(nxt);
        } else if (!direct.has(nxt) && nxt !== startId) {
          indirect.add(nxt);
        }
      }
    }

    return Array.from(indirect).sort(compareCellIds);
  }

  private updateCellDefinition(id: string, raw: string): void {
    const oldDeps = this.deps.get(id);
    if (oldDeps) {
      for (const dep of oldDeps) {
        const rev = this.revDeps.get(dep);
        if (rev) {
          rev.delete(id);
          if (rev.size === 0) {
            this.revDeps.delete(dep);
          }
        }
      }
      this.deps.delete(id);
    }

    if (raw === '') {
      this.rawCells.delete(id);
      this.parseCache.delete(id);
      return;
    }

    this.rawCells.set(id, raw);

    if (raw.startsWith('=')) {
      const parsed = parseFormula(raw, this.dims);
      this.parseCache.set(id, parsed);
      if (parsed.dependencies.length > 0) {
        const depSet = new Set(parsed.dependencies);
        this.deps.set(id, depSet);
        for (const dep of depSet) {
          let rev = this.revDeps.get(dep);
          if (!rev) {
            rev = new Set<string>();
            this.revDeps.set(dep, rev);
          }
          rev.add(id);
        }
      }
    } else {
      this.parseCache.delete(id);
    }
  }

  private recalculateAffected(seeds: string[]): {
    recalculatedIds: string[];
    cycleCells: string[];
  } {
    const affected = new Set<string>();
    const queue: string[] = [];

    for (const seed of seeds) {
      if (!affected.has(seed)) {
        affected.add(seed);
        queue.push(seed);
      }
    }

    for (let i = 0; i < queue.length; i++) {
      const curr = queue[i];
      const dependents = this.revDeps.get(curr);
      if (!dependents) continue;
      for (const dep of dependents) {
        if (!affected.has(dep)) {
          affected.add(dep);
          queue.push(dep);
        }
      }
    }

    // Tarjan SCC on induced subgraph of `affected` along `deps` edges
    // Emits SCCs in dependency-first (topological) order.
    const sccs = this.computeTarjanSCCs(affected);

    const recalculatedIds: string[] = [];
    const cycleCells: string[] = [];

    for (const scc of sccs) {
      const isCycle =
        scc.length > 1 ||
        (scc.length === 1 && (this.deps.get(scc[0])?.has(scc[0]) ?? false));

      if (isCycle) {
        const sccSet = new Set(scc);
        for (const id of scc) {
          const cyclePath = this.findCyclePath(id, sccSet);
          const raw = this.rawCells.get(id) ?? '';
          const dependencies = this.getDirectDependencies(id);
          this.snapshots.set(id, {
            id,
            raw,
            isFormula: raw.startsWith('='),
            valueType: 'error',
            computed: null,
            display: '#CYCLE!',
            error: '#CYCLE!',
            errorDetail: `Circular reference detected: ${cyclePath.join(' -> ')}`,
            inCycle: true,
            cyclePath,
            dependencies,
            dependents: this.getDirectDependents(id),
          });
          recalculatedIds.push(id);
          cycleCells.push(id);
        }
      } else {
        const id = scc[0];
        this.evaluateSingleCell(id);
        recalculatedIds.push(id);
      }
    }

    return { recalculatedIds, cycleCells };
  }

  private computeTarjanSCCs(affected: Set<string>): string[][] {
    let nextIndex = 0;
    const indices = new Map<string, number>();
    const lowlink = new Map<string, number>();
    const onStack = new Set<string>();
    const tarjanStack: string[] = [];
    const sccs: string[][] = [];

    interface Frame {
      node: string;
      neighbors: string[];
      cursor: number;
    }

    const callStack: Frame[] = [];

    for (const startNode of affected) {
      if (indices.has(startNode)) continue;

      const startNeighbors = this.getAffectedDeps(startNode, affected);
      indices.set(startNode, nextIndex);
      lowlink.set(startNode, nextIndex);
      nextIndex++;
      tarjanStack.push(startNode);
      onStack.add(startNode);
      callStack.push({ node: startNode, neighbors: startNeighbors, cursor: 0 });

      while (callStack.length > 0) {
        const frame = callStack[callStack.length - 1];
        const u = frame.node;

        if (frame.cursor < frame.neighbors.length) {
          const v = frame.neighbors[frame.cursor++];
          if (!indices.has(v)) {
            indices.set(v, nextIndex);
            lowlink.set(v, nextIndex);
            nextIndex++;
            tarjanStack.push(v);
            onStack.add(v);
            callStack.push({
              node: v,
              neighbors: this.getAffectedDeps(v, affected),
              cursor: 0,
            });
          } else if (onStack.has(v)) {
            lowlink.set(u, Math.min(lowlink.get(u)!, indices.get(v)!));
          }
        } else {
          callStack.pop();
          if (callStack.length > 0) {
            const parent = callStack[callStack.length - 1].node;
            lowlink.set(parent, Math.min(lowlink.get(parent)!, lowlink.get(u)!));
          }

          if (lowlink.get(u) === indices.get(u)) {
            const component: string[] = [];
            while (true) {
              const w = tarjanStack.pop()!;
              onStack.delete(w);
              component.push(w);
              if (w === u) break;
            }
            sccs.push(component);
          }
        }
      }
    }

    return sccs;
  }

  private getAffectedDeps(id: string, affected: Set<string>): string[] {
    const d = this.deps.get(id);
    if (!d) return [];
    const out: string[] = [];
    for (const dep of d) {
      if (affected.has(dep)) {
        out.push(dep);
      }
    }
    return out;
  }

  private findCyclePath(startId: string, sccSet: Set<string>): string[] {
    if (this.deps.get(startId)?.has(startId)) {
      return [startId, startId];
    }

    const parent = new Map<string, string>();
    const visited = new Set<string>();
    const queue: string[] = [];

    const firstDeps = this.deps.get(startId);
    if (firstDeps) {
      for (const next of firstDeps) {
        if (sccSet.has(next)) {
          visited.add(next);
          parent.set(next, startId);
          queue.push(next);
        }
      }
    }

    let found = false;
    for (let i = 0; i < queue.length; i++) {
      const curr = queue[i];
      if (curr === startId) {
        found = true;
        break;
      }
      const nexts = this.deps.get(curr);
      if (!nexts) continue;
      for (const nxt of nexts) {
        if (!sccSet.has(nxt)) continue;
        if (nxt === startId) {
          parent.set(startId, curr);
          found = true;
          break;
        }
        if (!visited.has(nxt)) {
          visited.add(nxt);
          parent.set(nxt, curr);
          queue.push(nxt);
        }
      }
      if (found) break;
    }

    if (!found) {
      return Array.from(sccSet);
    }

    const path: string[] = [startId];
    let curr = parent.get(startId);
    let guard = 0;
    while (curr && curr !== startId && guard <= sccSet.size + 1) {
      path.push(curr);
      curr = parent.get(curr);
      guard++;
    }
    path.push(startId);
    path.reverse();
    return path;
  }

  private evaluateSingleCell(id: string): void {
    const raw = this.rawCells.get(id);
    if (raw === undefined || raw === '') {
      this.snapshots.delete(id);
      return;
    }

    if (!raw.startsWith('=')) {
      const trimmed = raw.trim();
      if (NUMERIC_LITERAL_REGEX.test(trimmed)) {
        const num = Number(trimmed);
        if (Number.isFinite(num)) {
          const normalized = Object.is(num, -0) ? 0 : num;
          this.snapshots.set(id, {
            id,
            raw,
            isFormula: false,
            valueType: 'number',
            computed: normalized,
            display: formatNumberDisplay(normalized),
            error: null,
            errorDetail: null,
            inCycle: false,
            cyclePath: null,
            dependencies: [],
            dependents: this.getDirectDependents(id),
          });
          return;
        }
      }

      this.snapshots.set(id, {
        id,
        raw,
        isFormula: false,
        valueType: 'text',
        computed: raw,
        display: raw,
        error: null,
        errorDetail: null,
        inCycle: false,
        cyclePath: null,
        dependencies: [],
        dependents: this.getDirectDependents(id),
      });
      return;
    }

    const parsed = this.parseCache.get(id) ?? parseFormula(raw, this.dims);
    const dependencies = this.getDirectDependencies(id);

    if (!parsed.ok) {
      this.snapshots.set(id, {
        id,
        raw,
        isFormula: true,
        valueType: 'error',
        computed: null,
        display: parsed.error,
        error: parsed.error,
        errorDetail: parsed.detail,
        inCycle: false,
        cyclePath: null,
        dependencies,
        dependents: this.getDirectDependents(id),
      });
      return;
    }

    const result = this.evaluateNode(parsed.ast);

    if (result.kind === 'error') {
      this.snapshots.set(id, {
        id,
        raw,
        isFormula: true,
        valueType: 'error',
        computed: null,
        display: result.code,
        error: result.code,
        errorDetail: result.detail,
        inCycle: false,
        cyclePath: null,
        dependencies,
        dependents: this.getDirectDependents(id),
      });
      return;
    }

    if (result.kind === 'text') {
      this.snapshots.set(id, {
        id,
        raw,
        isFormula: true,
        valueType: 'text',
        computed: result.value,
        display: result.value,
        error: null,
        errorDetail: null,
        inCycle: false,
        cyclePath: null,
        dependencies,
        dependents: this.getDirectDependents(id),
      });
      return;
    }

    const numValue = result.kind === 'empty' ? 0 : result.value;
    const normalized = Object.is(numValue, -0) ? 0 : numValue;

    this.snapshots.set(id, {
      id,
      raw,
      isFormula: true,
      valueType: 'number',
      computed: normalized,
      display: formatNumberDisplay(normalized),
      error: null,
      errorDetail: null,
      inCycle: false,
      cyclePath: null,
      dependencies,
      dependents: this.getDirectDependents(id),
    });
  }

  private evaluateNode(node: ASTNode): EvalValue {
    switch (node.kind) {
      case 'Number':
        return { kind: 'number', value: node.value };

      case 'String':
        return { kind: 'text', value: node.value };

      case 'Error':
        return { kind: 'error', code: node.code, detail: node.detail };

      case 'CellRef': {
        if (!node.ref.inBounds) {
          return {
            kind: 'error',
            code: '#REF!',
            detail: `Cell reference "${node.ref.raw}" is out of bounds`,
          };
        }
        const snap = this.snapshots.get(node.ref.normalizedId);
        if (!snap || snap.valueType === 'empty') {
          return { kind: 'empty' };
        }
        if (snap.valueType === 'error') {
          return {
            kind: 'error',
            code: snap.error!,
            detail: `Propagated ${snap.error} from ${node.ref.normalizedId}`,
          };
        }
        if (snap.valueType === 'number') {
          return { kind: 'number', value: snap.computed as number };
        }
        return { kind: 'text', value: snap.computed as string };
      }

      case 'Range': {
        if (!node.start.inBounds || !node.end.inBounds) {
          return {
            kind: 'error',
            code: '#REF!',
            detail: `Range "${node.start.raw}:${node.end.raw}" is out of bounds`,
          };
        }
        return {
          kind: 'error',
          code: '#VALUE!',
          detail: 'Range cannot be evaluated outside a range function (e.g. SUM or AVG)',
        };
      }

      case 'Unary': {
        const val = this.evaluateNode(node.operand);
        if (val.kind === 'error') return val;
        if (val.kind === 'text') {
          return {
            kind: 'error',
            code: '#VALUE!',
            detail: `Cannot apply unary "${node.op}" to text "${val.value}"`,
          };
        }
        const num = val.kind === 'empty' ? 0 : val.value;
        const res = node.op === '-' ? -num : num;
        return { kind: 'number', value: Object.is(res, -0) ? 0 : res };
      }

      case 'Binary': {
        const left = this.evaluateNode(node.left);
        if (left.kind === 'error') return left;
        const right = this.evaluateNode(node.right);
        if (right.kind === 'error') return right;

        if (left.kind === 'text' || right.kind === 'text') {
          return {
            kind: 'error',
            code: '#VALUE!',
            detail: `Cannot perform "${node.op}" with a text value`,
          };
        }

        const a = left.kind === 'empty' ? 0 : left.value;
        const b = right.kind === 'empty' ? 0 : right.value;

        let res: number;
        switch (node.op) {
          case '+':
            res = a + b;
            break;
          case '-':
            res = a - b;
            break;
          case '*':
            res = a * b;
            break;
          case '/':
            if (b === 0) {
              return {
                kind: 'error',
                code: '#DIV/0!',
                detail: 'Division by zero',
              };
            }
            res = a / b;
            break;
        }

        if (!Number.isFinite(res)) {
          return {
            kind: 'error',
            code: '#VALUE!',
            detail: 'Arithmetic result is not finite',
          };
        }

        return { kind: 'number', value: Object.is(res, -0) ? 0 : res };
      }

      case 'Call':
        return this.evaluateCall(node.name, node.args);
    }
  }

  private evaluateCall(name: string, args: ASTNode[]): EvalValue {
    const fn = name.toUpperCase();
    const supported = new Set(['SUM', 'AVG', 'AVERAGE', 'MIN', 'MAX', 'COUNT']);
    if (!supported.has(fn)) {
      return {
        kind: 'error',
        code: '#VALUE!',
        detail: `Unknown function "${fn}"`,
      };
    }

    if (args.length === 0) {
      return {
        kind: 'error',
        code: '#VALUE!',
        detail: `${fn}() requires at least one argument`,
      };
    }

    const nums: number[] = [];

    for (const arg of args) {
      if (arg.kind === 'Range') {
        const ids = expandRangeIds(arg.start, arg.end, this.dims);
        if (!ids) {
          return {
            kind: 'error',
            code: '#REF!',
            detail: `Range "${arg.start.raw}:${arg.end.raw}" is out of bounds`,
          };
        }
        for (const cellId of ids) {
          const snap = this.snapshots.get(cellId);
          if (!snap || snap.valueType === 'empty' || snap.valueType === 'text') {
            continue;
          }
          if (snap.valueType === 'error') {
            return {
              kind: 'error',
              code: snap.error!,
              detail: `Propagated ${snap.error} from ${cellId}`,
            };
          }
          nums.push(snap.computed as number);
        }
      } else if (arg.kind === 'CellRef') {
        const val = this.evaluateNode(arg);
        if (val.kind === 'error') return val;
        if (val.kind === 'number') {
          nums.push(val.value);
        }
      } else {
        const val = this.evaluateNode(arg);
        if (val.kind === 'error') return val;
        if (val.kind === 'text') {
          return {
            kind: 'error',
            code: '#VALUE!',
            detail: `Text value "${val.value}" cannot be passed directly to ${fn}()`,
          };
        }
        if (val.kind === 'number') {
          nums.push(val.value);
        }
      }
    }

    switch (fn) {
      case 'SUM':
        return {
          kind: 'number',
          value: nums.reduce((acc, x) => acc + x, 0),
        };
      case 'AVG':
      case 'AVERAGE': {
        if (nums.length === 0) {
          return {
            kind: 'error',
            code: '#DIV/0!',
            detail: `${fn}() cannot average zero numeric values`,
          };
        }
        const sum = nums.reduce((acc, x) => acc + x, 0);
        return { kind: 'number', value: sum / nums.length };
      }
      case 'COUNT':
        return { kind: 'number', value: nums.length };
      case 'MIN':
        return {
          kind: 'number',
          value: nums.length === 0 ? 0 : Math.min(...nums),
        };
      case 'MAX':
        return {
          kind: 'number',
          value: nums.length === 0 ? 0 : Math.max(...nums),
        };
      default:
        return {
          kind: 'error',
          code: '#VALUE!',
          detail: `Unsupported function "${fn}"`,
        };
    }
  }
}
