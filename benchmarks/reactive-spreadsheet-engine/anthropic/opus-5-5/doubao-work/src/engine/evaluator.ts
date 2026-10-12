// Evaluator for parsed formula ASTs.

import { Node, ErrorCode, expandRange, parseFormula, FormulaSyntaxError } from './parser';

export class CellError {
  constructor(public readonly code: ErrorCode, public readonly detail?: string) {}
  toString(): string {
    return this.code;
  }
}

export type Scalar = number | string | boolean | null; // null = empty cell
export type CellValue = Scalar | CellError;

export function isError(v: unknown): v is CellError {
  return v instanceof CellError;
}

type Lookup = (addr: string) => CellValue;

/** A range argument evaluates to a flat list of cell values. */
type EvalResult = CellValue | { range: CellValue[] };

function isRange(v: EvalResult): v is { range: CellValue[] } {
  return typeof v === 'object' && v !== null && !(v instanceof CellError) && 'range' in v;
}

function toNumber(v: CellValue): number | CellError {
  if (isError(v)) return v;
  if (v === null) return 0;
  if (typeof v === 'number') return v;
  if (typeof v === 'boolean') return v ? 1 : 0;
  const t = v.trim();
  if (t !== '' && !isNaN(Number(t))) return Number(t);
  return new CellError('#VALUE!', `"${v}" is not a number`);
}

function toText(v: Scalar): string {
  if (v === null) return '';
  if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE';
  if (typeof v === 'number') return formatNumber(v);
  return v;
}

function toBool(v: CellValue): boolean | CellError {
  if (isError(v)) return v;
  if (typeof v === 'boolean') return v;
  if (v === null) return false;
  if (typeof v === 'number') return v !== 0;
  const u = v.trim().toUpperCase();
  if (u === 'TRUE') return true;
  if (u === 'FALSE') return false;
  return new CellError('#VALUE!', `"${v}" is not a boolean`);
}

export function formatNumber(n: number): string {
  if (Number.isInteger(n) && Math.abs(n) < 1e15) return String(n);
  const abs = Math.abs(n);
  if (abs !== 0 && (abs >= 1e15 || abs < 1e-9)) return n.toExponential(6).replace(/\.?0+e/, 'e');
  return String(Number(n.toPrecision(12)));
}

function finite(n: number): CellValue {
  if (Number.isNaN(n) || !Number.isFinite(n)) return new CellError('#VALUE!', 'Result is not a finite number');
  return n;
}

/** Collects numbers from function arguments: ranges skip text/empty; direct scalars are coerced. */
function collectNumbers(args: EvalResult[]): number[] | CellError {
  const nums: number[] = [];
  for (const a of args) {
    if (isRange(a)) {
      for (const v of a.range) {
        if (isError(v)) return v;
        if (typeof v === 'number') nums.push(v);
      }
    } else {
      if (a === null) continue;
      const n = toNumber(a);
      if (isError(n)) return n;
      nums.push(n);
    }
  }
  return nums;
}

function scalarArg(a: EvalResult): CellValue {
  if (isRange(a)) {
    // A multi-cell range used where a single value is expected.
    return a.range.length === 1 ? a.range[0] : new CellError('#VALUE!', 'Range used where a single value is expected');
  }
  return a;
}

const FUNCTIONS: Record<string, (args: EvalResult[]) => CellValue> = {
  SUM: (args) => {
    const nums = collectNumbers(args);
    return isError(nums) ? nums : finite(nums.reduce((s, x) => s + x, 0));
  },
  AVG: (args) => {
    const nums = collectNumbers(args);
    if (isError(nums)) return nums;
    if (nums.length === 0) return new CellError('#DIV/0!', 'AVG of no numeric values');
    return finite(nums.reduce((s, x) => s + x, 0) / nums.length);
  },
  MIN: (args) => {
    const nums = collectNumbers(args);
    return isError(nums) ? nums : nums.length ? Math.min(...nums) : 0;
  },
  MAX: (args) => {
    const nums = collectNumbers(args);
    return isError(nums) ? nums : nums.length ? Math.max(...nums) : 0;
  },
  COUNT: (args) => {
    let n = 0;
    for (const a of args) {
      if (isRange(a)) n += a.range.filter((v) => typeof v === 'number').length;
      else if (typeof a === 'number') n++;
    }
    return n;
  },
  PRODUCT: (args) => {
    const nums = collectNumbers(args);
    return isError(nums) ? nums : finite(nums.reduce((s, x) => s * x, 1));
  },
  ABS: (args) => {
    if (args.length !== 1) return new CellError('#VALUE!', 'ABS expects 1 argument');
    const n = toNumber(scalarArg(args[0]));
    return isError(n) ? n : Math.abs(n);
  },
  ROUND: (args) => {
    if (args.length < 1 || args.length > 2) return new CellError('#VALUE!', 'ROUND expects 1 or 2 arguments');
    const n = toNumber(scalarArg(args[0]));
    if (isError(n)) return n;
    const d = args.length > 1 ? toNumber(scalarArg(args[1])) : 0;
    if (isError(d)) return d;
    const f = Math.pow(10, Math.trunc(d));
    return finite(Math.round(n * f) / f);
  },
  IF: (args) => {
    if (args.length < 2 || args.length > 3) return new CellError('#VALUE!', 'IF expects 2 or 3 arguments');
    const cond = toBool(scalarArg(args[0]));
    if (isError(cond)) return cond;
    if (cond) return scalarArg(args[1]);
    return args.length > 2 ? scalarArg(args[2]) : false;
  },
};
FUNCTIONS.AVERAGE = FUNCTIONS.AVG;

export const SUPPORTED_FUNCTIONS = Object.keys(FUNCTIONS).sort();

function evalNode(node: Node, lookup: Lookup): EvalResult {
  switch (node.kind) {
    case 'num':
      return node.value;
    case 'str':
      return node.value;
    case 'bool':
      return node.value;
    case 'error':
      return new CellError(node.code, 'Invalid reference');
    case 'ref':
      if (!node.ref.valid) return new CellError('#REF!', `${node.ref.text} is outside the sheet`);
      return lookup(node.ref.addr);
    case 'range': {
      const cells = expandRange(node.from, node.to);
      if (!cells) return new CellError('#REF!', `${node.from.text}:${node.to.text} is outside the sheet`);
      return { range: cells.map(lookup) };
    }
    case 'unary': {
      const v = toNumber(scalarArg(evalNode(node.arg, lookup)));
      if (isError(v)) return v;
      return node.op === '-' ? -v : v;
    }
    case 'binary': {
      const l = scalarArg(evalNode(node.left, lookup));
      const r = scalarArg(evalNode(node.right, lookup));
      if (isError(l)) return l;
      if (isError(r)) return r;
      if (node.op === '&') return toText(l) + toText(r);
      if (['=', '<>', '<', '>', '<=', '>='].includes(node.op)) return compare(node.op, l, r);
      const a = toNumber(l);
      if (isError(a)) return a;
      const b = toNumber(r);
      if (isError(b)) return b;
      switch (node.op) {
        case '+':
          return finite(a + b);
        case '-':
          return finite(a - b);
        case '*':
          return finite(a * b);
        case '/':
          if (b === 0) return new CellError('#DIV/0!', 'Division by zero');
          return finite(a / b);
        case '^':
          return finite(Math.pow(a, b));
      }
      return new CellError('#VALUE!', `Unknown operator ${node.op}`);
    }
    case 'call': {
      if (node.name.startsWith('#NAME:')) return new CellError('#NAME?', `Unknown name ${node.name.slice(6)}`);
      const fn = FUNCTIONS[node.name];
      if (!fn) return new CellError('#NAME?', `Unknown function ${node.name}`);
      if (node.name === 'IF') {
        // Lazy: only evaluate the taken branch (errors in the other branch don't matter).
        if (node.args.length < 2 || node.args.length > 3) return new CellError('#VALUE!', 'IF expects 2 or 3 arguments');
        const cond = toBool(scalarArg(evalNode(node.args[0], lookup)));
        if (isError(cond)) return cond;
        if (cond) return scalarArg(evalNode(node.args[1], lookup));
        return node.args.length > 2 ? scalarArg(evalNode(node.args[2], lookup)) : false;
      }
      return fn(node.args.map((a) => evalNode(a, lookup)));
    }
  }
}

function compare(op: string, l: Scalar, r: Scalar): boolean {
  let a: number | string;
  let b: number | string;
  const ln = l === null ? (typeof r === 'string' ? '' : 0) : l;
  const rn = r === null ? (typeof l === 'string' ? '' : 0) : r;
  if (typeof ln === 'string' || typeof rn === 'string') {
    a = toText(ln).toUpperCase();
    b = toText(rn).toUpperCase();
  } else {
    a = Number(ln);
    b = Number(rn);
  }
  switch (op) {
    case '=':
      return a === b;
    case '<>':
      return a !== b;
    case '<':
      return a < b;
    case '>':
      return a > b;
    case '<=':
      return a <= b;
    default:
      return a >= b;
  }
}

export function evaluate(node: Node, lookup: Lookup): CellValue {
  try {
    const v = scalarArg(evalNode(node, lookup));
    return v;
  } catch (e) {
    return new CellError('#ERROR!', e instanceof Error ? e.message : 'Evaluation failed');
  }
}

export function displayValue(v: CellValue): string {
  if (isError(v)) return v.code;
  return toText(v);
}

export { parseFormula, FormulaSyntaxError };
