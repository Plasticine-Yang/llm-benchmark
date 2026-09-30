/**
 * Evaluator: turns a parsed AST into a cell value {v, e}.
 *
 * Values are one of:
 *   number            -> {v: 3,     e: null}
 *   string            -> {v: "hi",  e: null}
 *   boolean           -> {v: true,  e: null}
 *   blank             -> {v: "",    e: null}
 *   error             -> {v: "",    e: "#DIV/0!"}
 *
 * Errors are ordinary values so they propagate naturally: any operand that is
 * an error makes the whole expression that error (first error wins).
 */
import { ERR, blank, value, errValue, isCellError } from './errors.js';
import { expandRange } from './refs.js';

/** Coerce a cell value to a number for arithmetic. */
export function toNumber(cell) {
  if (isCellError(cell)) return { e: cell.e };
  const v = cell ? cell.v : '';
  if (typeof v === 'number') return { n: v };
  if (typeof v === 'boolean') return { n: v ? 1 : 0 };
  if (v === '' || v === null || v === undefined) return { n: 0 };
  const s = String(v).trim();
  if (s === '') return { n: 0 };
  const num = Number(s);
  if (Number.isFinite(num)) return { n: num };
  return { e: ERR.VALUE };
}

function toText(cell) {
  if (isCellError(cell)) return { e: cell.e };
  const v = cell ? cell.v : '';
  if (typeof v === 'boolean') return { s: v ? 'TRUE' : 'FALSE' };
  return { s: v === null || v === undefined ? '' : String(v) };
}

function toBool(cell) {
  if (isCellError(cell)) return { e: cell.e };
  const v = cell ? cell.v : '';
  if (typeof v === 'boolean') return { b: v };
  if (typeof v === 'number') return { b: v !== 0 };
  if (v === '') return { b: false };
  const s = String(v).trim().toUpperCase();
  if (s === 'TRUE') return { b: true };
  if (s === 'FALSE') return { b: false };
  const num = Number(s);
  if (Number.isFinite(num)) return { b: num !== 0 };
  return { e: ERR.VALUE };
}

function compare(cop, a, b) {
  const bothNum = typeof a === 'number' && typeof b === 'number';
  const x = bothNum ? a : String(a).toUpperCase();
  const y = bothNum ? b : String(b).toUpperCase();
  switch (cop) {
    case '=': return x === y;
    case '<>': return x !== y;
    case '<': return x < y;
    case '<=': return x <= y;
    case '>': return x > y;
    case '>=': return x >= y;
    default: return false;
  }
}

/** Flatten call arguments: ranges expand, scalars stay as one value. */
function flatten(args, node) {
  const out = [];
  const visit = (n) => {
    if (n.t === 'range') {
      const cells = expandRange(n.from, n.to) || [];
      for (const ref of cells) out.push(node.ctx.get(ref));
      return;
    }
    out.push(evaluate(n, node.ctx));
  };
  for (const a of args) visit(a);
  return out;
}

const FUNCTIONS = {
  SUM(args, node) {
    let total = 0;
    for (const cell of flatten(args, node)) {
      if (isCellError(cell)) return errValue(cell.e);
      const v = cell ? cell.v : '';
      if (typeof v === 'number') { total += v; continue; }
      if (typeof v === 'boolean') { total += v ? 1 : 0; continue; }
      if (typeof v === 'string' && v.trim() !== '') {
        const num = Number(v);
        // like Excel, non-numeric text inside an aggregate is ignored
        if (Number.isFinite(num)) total += num;
      }
    }
    return value(total);
  },
  AVG(args, node) {
    let total = 0;
    let count = 0;
    for (const cell of flatten(args, node)) {
      if (isCellError(cell)) return errValue(cell.e);
      const v = cell ? cell.v : '';
      if (typeof v === 'number') { total += v; count += 1; continue; }
      if (typeof v === 'boolean') { total += v ? 1 : 0; count += 1; continue; }
      if (typeof v === 'string' && v.trim() !== '') {
        const num = Number(v);
        if (Number.isFinite(num)) {
          total += num;
          count += 1;
        }
      }
    }
    if (count === 0) return errValue(ERR.DIV0);
    return value(total / count);
  },
  MIN(args, node) {
    const nums = numericList(args, node);
    if (nums.e) return errValue(nums.e);
    if (!nums.list.length) return value(0);
    return value(Math.min(...nums.list));
  },
  MAX(args, node) {
    const nums = numericList(args, node);
    if (nums.e) return errValue(nums.e);
    if (!nums.list.length) return value(0);
    return value(Math.max(...nums.list));
  },
  COUNT(args, node) {
    const nums = numericList(args, node);
    if (nums.e) return errValue(nums.e);
    return value(nums.list.length);
  },
  COUNTA(args, node) {
    let count = 0;
    for (const cell of flatten(args, node)) {
      if (isCellError(cell)) return errValue(cell.e);
      const v = cell ? cell.v : '';
      if (v !== '' && v !== null && v !== undefined) count += 1;
    }
    return value(count);
  },
  ABS(args, node) {
    const r = unaryNumeric(args, node, 'ABS');
    return r.e ? errValue(r.e) : value(Math.abs(r.n));
  },
  SQRT(args, node) {
    const r = unaryNumeric(args, node, 'SQRT');
    if (r.e) return errValue(r.e);
    if (r.n < 0) return errValue(ERR.NUM);
    return value(Math.sqrt(r.n));
  },
  ROUND(args, node) {
    if (args.length < 1) return errValue(ERR.VALUE);
    const first = evaluate(args[0], node.ctx);
    const n1 = toNumber(first);
    if (n1.e) return errValue(n1.e);
    let digits = 0;
    if (args.length > 1) {
      const n2 = toNumber(evaluate(args[1], node.ctx));
      if (n2.e) return errValue(n2.e);
      digits = Math.trunc(n2.n);
    }
    const f = 10 ** digits;
    return value(Math.round((n1.n + Number.EPSILON) * f) / f);
  },
  POWER(args, node) {
    if (args.length !== 2) return errValue(ERR.VALUE);
    const a = toNumber(evaluate(args[0], node.ctx));
    if (a.e) return errValue(a.e);
    const b = toNumber(evaluate(args[1], node.ctx));
    if (b.e) return errValue(b.e);
    const r = a.n ** b.n;
    return Number.isFinite(r) ? value(r) : errValue(ERR.NUM);
  },
  IF(args, node) {
    if (args.length < 2) return errValue(ERR.VALUE);
    const cond = toBool(evaluate(args[0], node.ctx));
    if (cond.e) return errValue(cond.e);
    if (cond.b) return evaluate(args[1], node.ctx);
    if (args.length > 2) return evaluate(args[2], node.ctx);
    return value(false);
  },
  AND(args, node) {
    let any = false;
    for (const a of args) {
      const c = toBool(evaluate(a, node.ctx));
      if (c.e) return errValue(c.e);
      any = true;
      if (!c.b) return value(false);
    }
    return any ? value(true) : errValue(ERR.VALUE);
  },
  OR(args, node) {
    let any = false;
    for (const a of args) {
      const c = toBool(evaluate(a, node.ctx));
      if (c.e) return errValue(c.e);
      any = true;
      if (c.b) return value(true);
    }
    return any ? value(false) : errValue(ERR.VALUE);
  },
  NOT(args, node) {
    if (args.length !== 1) return errValue(ERR.VALUE);
    const c = toBool(evaluate(args[0], node.ctx));
    if (c.e) return errValue(c.e);
    return value(!c.b);
  },
};

function numericList(args, node) {
  const list = [];
  for (const cell of flatten(args, node)) {
    if (isCellError(cell)) return { e: cell.e };
    const v = cell ? cell.v : '';
    if (typeof v === 'number') { list.push(v); continue; }
    if (typeof v === 'boolean') { list.push(v ? 1 : 0); continue; }
    if (typeof v === 'string' && v.trim() !== '') {
      const num = Number(v);
      if (Number.isFinite(num)) list.push(num);
    }
  }
  return { list };
}

function unaryNumeric(args, node, name) {
  if (args.length !== 1) return { e: ERR.VALUE };
  const n = toNumber(evaluate(args[0], node.ctx));
  if (n.e) return { e: n.e };
  return { n: n.n };
}

/**
 * Evaluate an AST node.
 * @param {object} ast
 * @param {{get: (ref:string)=>{v:any,e:string|null}}} ctx
 */
export function evaluate(ast, ctx) {
  if (!ast) return blank();

  switch (ast.t) {
    case 'num':
      return value(ast.v);
    case 'str':
      return value(ast.v);
    case 'errlit':
      return errValue(ast.v);
    case 'ref': {
      const cell = ctx.get(ast.ref) || blank();
      if (isCellError(cell)) return errValue(cell.e);
      return cell;
    }
    case 'range':
      // A bare range in scalar position resolves to its top-left cell.
      return ctx.get(ast.from) || blank();

    case 'un': {
      const n = toNumber(evaluate(ast.arg, ctx));
      if (n.e) return errValue(n.e);
      return value(ast.op === '-' ? -n.n : n.n);
    }

    case 'post': {
      const n = toNumber(evaluate(ast.arg, ctx));
      if (n.e) return errValue(n.e);
      return value(n.n / 100);
    }

    case 'bin': {
      const op = ast.op;
      if (op === '&') {
        const a = toText(evaluate(ast.l, ctx));
        if (a.e) return errValue(a.e);
        const b = toText(evaluate(ast.r, ctx));
        if (b.e) return errValue(b.e);
        return value(a.s + b.s);
      }
      if (['=', '<>', '<', '<=', '>', '>='].includes(op)) {
        const a = evaluate(ast.l, ctx);
        if (isCellError(a)) return errValue(a.e);
        const b = evaluate(ast.r, ctx);
        if (isCellError(b)) return errValue(b.e);
        const numL = typeof a.v === 'number';
        const numR = typeof b.v === 'number';
        if (numL && numR) return value(compare(op, a.v, b.v));
        return value(compare(op, a.v === '' ? '' : String(a.v), b.v === '' ? '' : String(b.v)));
      }

      const a = toNumber(evaluate(ast.l, ctx));
      if (a.e) return errValue(a.e);
      const b = toNumber(evaluate(ast.r, ctx));
      if (b.e) return errValue(b.e);

      switch (op) {
        case '+': return value(a.n + b.n);
        case '-': return value(a.n - b.n);
        case '*': return value(a.n * b.n);
        case '/':
          if (b.n === 0) return errValue(ERR.DIV0);
          return value(a.n / b.n);
        case '^': {
          const r = a.n ** b.n;
          return Number.isFinite(r) ? value(r) : errValue(ERR.NUM);
        }
        default:
          return errValue(ERR.PARSE);
      }
    }

    case 'call': {
      const fn = FUNCTIONS[ast.name];
      if (!fn) return errValue(ERR.NAME);
      const node = { ctx };
      return fn(ast.args, node);
    }

    default:
      return errValue(ERR.PARSE);
  }
}

export const FUNCTION_NAMES = Object.keys(FUNCTIONS);
