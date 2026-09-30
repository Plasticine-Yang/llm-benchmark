/** A handwritten expression parser and incremental dependency graph. No eval. */
export const ROWS = 24;
export const COLS = 10;
export const ERRORS = ['#DIV/0!', '#REF!', '#VALUE!', '#CYCLE!'] as const;
export type ErrorCode = typeof ERRORS[number];
export type CellValue = number | string;
export type RawCells = Record<string, string>;
export type Edit = { id: string; raw: string };
type Expr =
  | { type: 'number'; value: number }
  | { type: 'ref'; id: string }
  | { type: 'range'; from: string; to: string }
  | { type: 'unary'; op: string; arg: Expr }
  | { type: 'binary'; op: string; left: Expr; right: Expr }
  | { type: 'call'; name: string; args: Expr[] };
type Token = { kind: 'number' | 'name' | 'symbol' | 'end'; value: string };
export type Cell = { raw: string; value: CellValue; error: ErrorCode | null; deps: Set<string>; ast?: Expr; parseError?: ErrorCode };
type Result = { value: CellValue; error: ErrorCode | null };
const fail = (error: ErrorCode): Result => ({ value: error, error });
export function cellId(row: number, col: number) { return `${String.fromCharCode(65 + col)}${row + 1}`; }
export function position(id: string): [number, number] {
  const match = /^([A-Z]+)(\d+)$/.exec(id.toUpperCase());
  if (!match) return [-1, -1];
  let col = 0;
  for (const char of match[1]) col = col * 26 + char.charCodeAt(0) - 64;
  return [Number(match[2]) - 1, col - 1];
}
export function validId(id: string) {
  const [row, col] = position(id);
  return row >= 0 && row < ROWS && col >= 0 && col < COLS && id === cellId(row, col);
}
function rangeIds(from: string, to: string): string[] | null {
  if (!validId(from) || !validId(to)) return null;
  const [r1, c1] = position(from), [r2, c2] = position(to);
  const result = [];
  for (let r = Math.min(r1, r2); r <= Math.max(r1, r2); r++)
    for (let c = Math.min(c1, c2); c <= Math.max(c1, c2); c++) result.push(cellId(r, c));
  return result;
}
class FormulaFault extends Error {
  constructor(public code: ErrorCode) { super(code); }
}
function tokenize(source: string): Token[] {
  if (source.length > 8192) throw new FormulaFault('#VALUE!');
  const tokens: Token[] = [];
  let index = 0;
  while (index < source.length) {
    if (/\s/.test(source[index])) { index++; continue; }
    const rest = source.slice(index);
    const num = /^(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?/.exec(rest);
    const name = /^[A-Za-z_][A-Za-z_0-9]*/.exec(rest);
    if (num) { tokens.push({ kind: 'number', value: num[0] }); index += num[0].length; }
    else if (name) { tokens.push({ kind: 'name', value: name[0].toUpperCase() }); index += name[0].length; }
    else if ('+-*/():,'.includes(source[index])) { tokens.push({ kind: 'symbol', value: source[index++] }); }
    else throw new FormulaFault('#VALUE!');
    if (tokens.length > 2048) throw new FormulaFault('#VALUE!');
  }
  return [...tokens, { kind: 'end', value: '' }];
}
export function parseFormula(source: string): Expr {
  const tokens = tokenize(source.startsWith('=') ? source.slice(1) : source);
  let at = 0, depth = 0;
  const peek = () => tokens[at];
  const consume = (value: string) => {
    if (peek().value !== value) throw new FormulaFault('#VALUE!');
    at++;
  };
  function expression(min = 0): Expr {
    if (++depth > 128) throw new FormulaFault('#VALUE!');
    let left = primary();
    const precedence: Record<string, number> = { '+': 1, '-': 1, '*': 2, '/': 2 };
    while (peek().kind === 'symbol' && (precedence[peek().value] ?? 0) > min) {
      const op = tokens[at++].value;
      left = { type: 'binary', op, left, right: expression(precedence[op]) };
    }
    depth--;
    return left;
  }
  function primary(): Expr {
    const token = tokens[at++];
    if (token.kind === 'number') return { type: 'number', value: Number(token.value) };
    if (token.value === '+' || token.value === '-') return { type: 'unary', op: token.value, arg: expression(2) };
    if (token.value === '(') { const expr = expression(); consume(')'); return expr; }
    if (token.kind === 'name') {
      if (peek().value === '(') {
        at++;
        const args: Expr[] = [];
        if (peek().value !== ')') {
          args.push(expression());
          while (peek().value === ',') { at++; args.push(expression()); }
        }
        consume(')');
        return { type: 'call', name: token.value, args };
      }
      if (!/^[A-Z]+\d+$/.test(token.value)) throw new FormulaFault('#VALUE!');
      if (peek().value === ':') {
        at++;
        const end = tokens[at++];
        if (end.kind !== 'name' || !/^[A-Z]+\d+$/.test(end.value)) throw new FormulaFault('#REF!');
        return { type: 'range', from: token.value, to: end.value };
      }
      return { type: 'ref', id: token.value };
    }
    throw new FormulaFault('#VALUE!');
  }
  const ast = expression();
  if (peek().kind !== 'end') throw new FormulaFault('#VALUE!');
  return ast;
}
function references(expr: Expr, refs = new Set<string>()): Set<string> {
  if (expr.type === 'ref' && validId(expr.id)) refs.add(expr.id);
  if (expr.type === 'range') for (const id of rangeIds(expr.from, expr.to) ?? []) refs.add(id);
  if (expr.type === 'unary') references(expr.arg, refs);
  if (expr.type === 'binary') { references(expr.left, refs); references(expr.right, refs); }
  if (expr.type === 'call') for (const arg of expr.args) references(arg, refs);
  return refs;
}
const numeric = (value: CellValue): number | null => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (!value.trim()) return 0;
  return Number.isFinite(Number(value)) ? Number(value) : null;
};
function evaluate(expr: Expr, read: (id: string) => Result): Result {
  if (expr.type === 'number') return Number.isFinite(expr.value) ? { value: expr.value, error: null } : fail('#VALUE!');
  if (expr.type === 'ref') return validId(expr.id) ? read(expr.id) : fail('#REF!');
  if (expr.type === 'range') return fail(rangeIds(expr.from, expr.to) ? '#VALUE!' : '#REF!');
  if (expr.type === 'call') {
    if (!['SUM', 'AVG'].includes(expr.name) || !expr.args.length) return fail('#VALUE!');
    const numbers: number[] = [];
    for (const arg of expr.args) {
      if (arg.type === 'range') {
        const ids = rangeIds(arg.from, arg.to);
        if (!ids) return fail('#REF!');
        for (const id of ids) {
          const result = read(id);
          if (result.error) return result;
          // Like Excel, aggregate ranges ignore text and empty cells.
          if (typeof result.value === 'number') numbers.push(result.value);
        }
      } else {
        const result = evaluate(arg, read);
        if (result.error) return result;
        const num = numeric(result.value);
        if (num === null) return fail('#VALUE!');
        numbers.push(num);
      }
    }
    if (expr.name === 'AVG' && !numbers.length) return fail('#DIV/0!');
    const sum = numbers.reduce((a, b) => a + b, 0);
    const value = expr.name === 'SUM' ? sum : sum / numbers.length;
    return Number.isFinite(value) ? { value, error: null } : fail('#VALUE!');
  }
  if (expr.type === 'unary') {
    const result = evaluate(expr.arg, read);
    if (result.error) return result;
    const num = numeric(result.value);
    return num === null ? fail('#VALUE!') : { value: expr.op === '-' ? -num : num, error: null };
  }
  const left = evaluate(expr.left, read), right = evaluate(expr.right, read);
  if (left.error) return left;
  if (right.error) return right;
  const a = numeric(left.value), b = numeric(right.value);
  if (a === null || b === null) return fail('#VALUE!');
  if (expr.op === '/' && b === 0) return fail('#DIV/0!');
  const value = expr.op === '+' ? a + b : expr.op === '-' ? a - b : expr.op === '*' ? a * b : a / b;
  return Number.isFinite(value) ? { value, error: null } : fail('#VALUE!');
}
export class Workbook {
  cells = new Map<string, Cell>();
  dependents = new Map<string, Set<string>>();
  lastRecalculated: string[] = [];
  version = 0;
  constructor(raws: RawCells = {}) {
    for (let row = 0; row < ROWS; row++) for (let col = 0; col < COLS; col++) {
      const id = cellId(row, col);
      this.cells.set(id, { raw: '', value: '', error: null, deps: new Set() });
      this.dependents.set(id, new Set());
    }
    this.applyEdits(Object.entries(raws).filter(([id]) => validId(id)).map(([id, raw]) => ({ id, raw })));
  }
  get(id: string): Cell { return this.cells.get(id)!; }
  rawCells(): RawCells { return Object.fromEntries([...this.cells].filter(([, c]) => c.raw !== '').map(([id, c]) => [id, c.raw])); }
  relations(id: string, direction: 'references' | 'dependents'): Set<string> {
    const found = new Set<string>();
    const visit = (next: string) => {
      const adjacent = direction === 'references' ? this.get(next).deps : this.dependents.get(next)!;
      for (const child of adjacent) if (!found.has(child)) { found.add(child); visit(child); }
    };
    visit(id); found.delete(id); return found;
  }
  applyEdits(edits: Edit[]) {
    const changed = new Set<string>();
    for (const { id, raw } of edits) {
      if (!validId(id) || typeof raw !== 'string') throw new Error(`Invalid cell edit: ${id}`);
      const old = this.get(id);
      if (old.raw === raw) continue;
      for (const dep of old.deps) this.dependents.get(dep)!.delete(id);
      const cell: Cell = { raw, value: '', error: null, deps: new Set() };
      if (raw.trimStart().startsWith('=')) {
        try { cell.ast = parseFormula(raw.trim()); cell.deps = references(cell.ast); }
        catch (error) { cell.parseError = error instanceof FormulaFault ? error.code : '#VALUE!'; }
      }
      this.cells.set(id, cell);
      for (const dep of cell.deps) this.dependents.get(dep)!.add(id);
      changed.add(id);
    }
    // Walk reverse edges only: unrelated formulas retain their cached values.
    const affected = new Set(changed), queue = [...changed];
    for (let i = 0; i < queue.length; i++) for (const dependent of this.dependents.get(queue[i])!)
      if (!affected.has(dependent)) { affected.add(dependent); queue.push(dependent); }
    const cycles = this.findCycles();
    const complete = new Set<string>();
    this.lastRecalculated = [];
    const calculate = (id: string): Result => {
      const cell = this.get(id);
      if (!affected.has(id) || complete.has(id)) return { value: cell.value, error: cell.error };
      let result: Result;
      if (cycles.has(id)) result = fail('#CYCLE!');
      else if (cell.parseError) result = fail(cell.parseError);
      else if (cell.ast) result = evaluate(cell.ast, calculate);
      else {
        const trimmed = cell.raw.trim();
        result = { value: trimmed !== '' && Number.isFinite(Number(trimmed)) ? Number(trimmed) : cell.raw, error: null };
      }
      cell.value = result.value; cell.error = result.error;
      complete.add(id); this.lastRecalculated.push(id);
      return result;
    };
    for (const id of affected) calculate(id);
    if (changed.size) this.version++;
    return this.lastRecalculated;
  }
  /** Tarjan SCC marks every participant, including non-leading nodes in a cycle. */
  private findCycles(): Set<string> {
    let nextIndex = 0;
    const indices = new Map<string, number>(), low = new Map<string, number>();
    const stack: string[] = [], onStack = new Set<string>(), cycles = new Set<string>();
    const visit = (id: string) => {
      indices.set(id, nextIndex); low.set(id, nextIndex++); stack.push(id); onStack.add(id);
      for (const dep of this.get(id).deps) {
        if (!indices.has(dep)) { visit(dep); low.set(id, Math.min(low.get(id)!, low.get(dep)!)); }
        else if (onStack.has(dep)) low.set(id, Math.min(low.get(id)!, indices.get(dep)!));
      }
      if (low.get(id) === indices.get(id)) {
        const component: string[] = [];
        let member: string;
        do { member = stack.pop()!; onStack.delete(member); component.push(member); } while (member !== id);
        if (component.length > 1 || this.get(id).deps.has(id)) for (const node of component) cycles.add(node);
      }
    };
    for (const id of this.cells.keys()) if (!indices.has(id)) visit(id);
    return cycles;
  }
}
export function displayValue(value: CellValue): string {
  return typeof value === 'number' ? Number(value.toPrecision(12)).toLocaleString('en-US', { maximumFractionDigits: 10 }) : value;
}
