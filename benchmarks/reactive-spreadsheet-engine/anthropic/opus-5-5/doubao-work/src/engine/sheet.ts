// Workbook model: raw cell contents, a real dependency graph, and incremental recalculation.
//
//  - precedents[A]  = cells A's formula reads   (A -> P edges)
//  - dependents[P]  = cells whose formulas read P (reverse edges). Edges exist even when P is
//                     empty, so forward references recalculate as soon as P gets a value.
//
// On every edit we collect the edited cells plus all their transitive dependents, run Tarjan's
// SCC algorithm on that sub-graph (which emits precedents before dependents = a valid evaluation
// order) and flag every strongly-connected component of size > 1, or any self-loop, as #CYCLE!.
// Because every member of a cycle is reachable from any other member, a cycle touching an affected
// cell always lies completely inside the affected set, so the sub-graph analysis is exact.

import { Node, parseFormula, collectReferences, FormulaSyntaxError } from './parser';
import { CellError, CellValue, evaluate, isError, displayValue } from './evaluator';
import { isValidAddr } from './address';

export interface CellRecord {
  raw: string;
  ast: Node | null; // only for formulas that parsed successfully
  parseError: string | null;
  value: CellValue;
}

export interface RecalcResult {
  /** Cells whose value was (re)computed, in evaluation order. */
  order: string[];
  /** Cells currently flagged as members of a circular reference (whole sheet). */
  cycles: string[];
}

export type RawMap = Record<string, string>;

export function parseLiteral(raw: string): CellValue {
  if (raw === '') return null;
  if (raw.startsWith("'")) return raw.slice(1); // forced text
  const t = raw.trim();
  if (t !== '' && /^[+-]?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?$/.test(t)) return Number(t);
  const u = t.toUpperCase();
  if (u === 'TRUE') return true;
  if (u === 'FALSE') return false;
  return raw;
}

export class Sheet {
  private cells = new Map<string, CellRecord>();
  private precedents = new Map<string, Set<string>>();
  private dependents = new Map<string, Set<string>>();
  private cycleSet = new Set<string>();

  constructor(initial?: RawMap) {
    if (initial) this.load(initial);
  }

  // ------------------------------------------------------------------ reads

  getRaw(addr: string): string {
    return this.cells.get(addr)?.raw ?? '';
  }

  getValue(addr: string): CellValue {
    return this.cells.get(addr)?.value ?? null;
  }

  getDisplay(addr: string): string {
    return displayValue(this.getValue(addr));
  }

  getRecord(addr: string): CellRecord | undefined {
    return this.cells.get(addr);
  }

  isFormula(addr: string): boolean {
    return this.getRaw(addr).startsWith('=');
  }

  isInCycle(addr: string): boolean {
    return this.cycleSet.has(addr);
  }

  get cycleCells(): string[] {
    return [...this.cycleSet].sort(addrCompare);
  }

  /** Cells this cell's formula reads directly. */
  directPrecedents(addr: string): string[] {
    return [...(this.precedents.get(addr) ?? [])].sort(addrCompare);
  }

  /** Cells whose formulas read this cell directly. */
  directDependents(addr: string): string[] {
    return [...(this.dependents.get(addr) ?? [])].sort(addrCompare);
  }

  allPrecedents(addr: string): string[] {
    return this.closure(addr, this.precedents);
  }

  allDependents(addr: string): string[] {
    return this.closure(addr, this.dependents);
  }

  /** Raw contents of every non-empty cell. */
  toRawMap(): RawMap {
    const out: RawMap = {};
    for (const [addr, rec] of this.cells) if (rec.raw !== '') out[addr] = rec.raw;
    return out;
  }

  /** Display values of every non-empty cell. */
  toValueMap(): Record<string, string> {
    const out: Record<string, string> = {};
    for (const [addr, rec] of this.cells) if (rec.raw !== '') out[addr] = displayValue(rec.value);
    return out;
  }

  // ----------------------------------------------------------------- writes

  /** Replaces the whole workbook and recomputes everything. */
  load(raws: RawMap): RecalcResult {
    for (const addr of [...this.cells.keys()]) this.setRawNoRecalc(addr, '');
    const changed: string[] = [];
    for (const [addr, raw] of Object.entries(raws)) {
      if (!isValidAddr(addr)) continue;
      this.setRawNoRecalc(addr, raw);
      changed.push(addr);
    }
    return this.recalc(changed);
  }

  setCell(addr: string, raw: string): RecalcResult {
    return this.setCells({ [addr]: raw });
  }

  /** Applies a batch of edits atomically and recalculates only affected cells. */
  setCells(changes: RawMap): RecalcResult {
    const changed: string[] = [];
    for (const [addr, raw] of Object.entries(changes)) {
      if (!isValidAddr(addr)) continue;
      this.setRawNoRecalc(addr, raw ?? '');
      changed.push(addr);
    }
    return this.recalc(changed);
  }

  // --------------------------------------------------------------- internals

  private setRawNoRecalc(addr: string, raw: string): void {
    // Drop old outgoing edges.
    for (const p of this.precedents.get(addr) ?? []) {
      const deps = this.dependents.get(p);
      if (deps) {
        deps.delete(addr);
        if (deps.size === 0) this.dependents.delete(p);
      }
    }
    this.precedents.delete(addr);

    if (raw === '') {
      this.cells.delete(addr);
      return;
    }

    let ast: Node | null = null;
    let parseError: string | null = null;
    if (raw.startsWith('=')) {
      try {
        ast = parseFormula(raw.slice(1));
      } catch (e) {
        parseError = e instanceof FormulaSyntaxError ? e.message : 'Invalid formula';
      }
    }
    this.cells.set(addr, { raw, ast, parseError, value: null });

    if (ast) {
      const refs = collectReferences(ast);
      if (refs.size) {
        this.precedents.set(addr, refs);
        for (const p of refs) {
          let deps = this.dependents.get(p);
          if (!deps) this.dependents.set(p, (deps = new Set()));
          deps.add(addr);
        }
      }
    }
  }

  private closure(start: string, edges: Map<string, Set<string>>): string[] {
    const seen = new Set<string>();
    const stack = [...(edges.get(start) ?? [])];
    while (stack.length) {
      const a = stack.pop()!;
      if (seen.has(a)) continue;
      seen.add(a);
      for (const n of edges.get(a) ?? []) if (!seen.has(n)) stack.push(n);
    }
    seen.delete(start);
    return [...seen].sort(addrCompare);
  }

  private recalc(changed: string[]): RecalcResult {
    // 1. Affected set = changed cells + transitive dependents.
    const affected = new Set<string>();
    const stack = [...changed];
    while (stack.length) {
      const a = stack.pop()!;
      if (affected.has(a)) continue;
      affected.add(a);
      for (const d of this.dependents.get(a) ?? []) if (!affected.has(d)) stack.push(d);
    }

    // 2. Tarjan SCC on the affected sub-graph (edges: cell -> its precedents), iterative.
    const order: string[][] = [];
    const index = new Map<string, number>();
    const low = new Map<string, number>();
    const onStack = new Set<string>();
    const sccStack: string[] = [];
    let counter = 0;

    const succ = (a: string) => [...(this.precedents.get(a) ?? [])].filter((p) => affected.has(p));

    for (const root of [...affected].sort(addrCompare)) {
      if (index.has(root)) continue;
      const work: { node: string; it: string[]; i: number }[] = [];
      const visit = (n: string) => {
        index.set(n, counter);
        low.set(n, counter);
        counter++;
        sccStack.push(n);
        onStack.add(n);
        work.push({ node: n, it: succ(n), i: 0 });
      };
      visit(root);
      while (work.length) {
        const frame = work[work.length - 1];
        if (frame.i < frame.it.length) {
          const w = frame.it[frame.i++];
          if (!index.has(w)) visit(w);
          else if (onStack.has(w)) low.set(frame.node, Math.min(low.get(frame.node)!, index.get(w)!));
          continue;
        }
        work.pop();
        if (work.length) {
          const parent = work[work.length - 1].node;
          low.set(parent, Math.min(low.get(parent)!, low.get(frame.node)!));
        }
        if (low.get(frame.node) === index.get(frame.node)) {
          const comp: string[] = [];
          let w: string;
          do {
            w = sccStack.pop()!;
            onStack.delete(w);
            comp.push(w);
          } while (w !== frame.node);
          order.push(comp);
        }
      }
    }

    // 3. Evaluate components in order (precedents first).
    const evaluated: string[] = [];
    const lookup = (a: string): CellValue => this.cells.get(a)?.value ?? null;
    for (const comp of order) {
      const isCycle = comp.length > 1 || (this.precedents.get(comp[0])?.has(comp[0]) ?? false);
      for (const addr of comp.sort(addrCompare)) {
        this.cycleSet.delete(addr);
        const rec = this.cells.get(addr);
        if (!rec) continue; // empty cell that had dependents
        evaluated.push(addr);
        if (isCycle && rec.ast) {
          this.cycleSet.add(addr);
          rec.value = new CellError('#CYCLE!', `Circular reference: ${comp.sort(addrCompare).join(' → ')}`);
        } else if (rec.parseError) {
          rec.value = new CellError('#ERROR!', rec.parseError);
        } else if (rec.ast) {
          rec.value = evaluate(rec.ast, lookup);
        } else {
          rec.value = parseLiteral(rec.raw);
        }
      }
    }
    return { order: evaluated, cycles: this.cycleCells };
  }
}

export function addrCompare(a: string, b: string): number {
  const ma = /^([A-Z]+)(\d+)$/.exec(a);
  const mb = /^([A-Z]+)(\d+)$/.exec(b);
  if (!ma || !mb) return a < b ? -1 : a > b ? 1 : 0;
  const ra = parseInt(ma[2], 10);
  const rb = parseInt(mb[2], 10);
  if (ra !== rb) return ra - rb;
  if (ma[1].length !== mb[1].length) return ma[1].length - mb[1].length;
  return ma[1] < mb[1] ? -1 : ma[1] > mb[1] ? 1 : 0;
}

export { isError, displayValue };
export type { CellValue };
