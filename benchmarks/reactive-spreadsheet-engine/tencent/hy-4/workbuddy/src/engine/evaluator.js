/** Value model + AST evaluator with typed spreadsheet error propagation. */

import { inBounds, expandRange, parseNumber } from './cells.js';

/*
 * A Value is a plain object:
 *   { type: 'number'|'text'|'blank'|'error'|'range', value, error }
 * `error` is one of #DIV/0!, #REF!, #VALUE!, #CYCLE!, #NAME?, #PARSE!, #NUM!
 */
export function num(value) {
  if (!Number.isFinite(value)) return err('#NUM!');
  return { type: 'number', value, error: null };
}
export function text(value) {
  return { type: 'text', value: String(value), error: null };
}
export function blank() {
  return { type: 'blank', value: null, error: null };
}
export function err(code) {
  return { type: 'error', value: null, error: code };
}
function range(items) {
  return { type: 'range', value: items, error: null };
}

/** A non-formula cell is a blank, a number literal, or plain text. */
export function evaluateLiteral(raw) {
  const s = raw == null ? '' : String(raw);
  if (s.trim() === '') return blank();
  const n = parseNumber(s);
  if (n !== null) return num(n);
  return text(s);
}

/** Excel-like number rendering without floating point noise. */
export function formatNumber(n) {
  if (!Number.isFinite(n)) return '#NUM!';
  if (Number.isInteger(n)) return String(n);
  const rounded = Number(n.toFixed(10));
  return String(rounded);
}

export function displayValue(v) {
  if (!v || v.type === 'blank') return '';
  if (v.type === 'error') return v.error;
  if (v.type === 'number') return formatNumber(v.value);
  if (v.type === 'range') return '#VALUE!';
  return String(v.value ?? '');
}

/** Convert a scalar Value to a number, or return an error Value. */
function toNumber(v) {
  switch (v.type) {
    case 'error':
      return v;
    case 'blank':
      return num(0); // empty cells behave as 0 in arithmetic
    case 'number':
      return v;
    case 'text': {
      const n = parseNumber(v.value);
      return n === null ? err('#VALUE!') : num(n);
    }
    default:
      return err('#VALUE!'); // a range used as a scalar
  }
}

function firstError(values) {
  for (const v of values) {
    if (v.type === 'error') return v;
    if (v.type === 'range') {
      const inner = firstError(v.value);
      if (inner) return inner;
    }
  }
  return null;
}

/** Collect numeric operands: ranges ignore text/blank cells (like Excel), scalars do not. */
function numericOperands(args) {
  const numbers = [];
  for (const arg of args) {
    if (arg.type === 'range') {
      for (const item of arg.value) {
        if (item.type === 'number') numbers.push(item.value);
        // blank and text inside a range are skipped, errors were checked earlier
      }
    } else {
      const n = toNumber(arg);
      if (n.type === 'error') return n;
      numbers.push(n.value);
    }
  }
  return numbers;
}

/**
 * @param {object} node AST node
 * @param {{get: (id:string) => object}} ctx resolves another cell's Value
 */
export function evaluateAst(node, ctx) {
  switch (node.type) {
    case 'number':
      return num(node.value);

    case 'string':
      return text(node.value);

    case 'group':
      return evaluateAst(node.arg, ctx);

    case 'ref': {
      if (!inBounds(node.row, node.col)) return err('#REF!');
      return ctx.get(node.id);
    }

    case 'range': {
      if (
        !inBounds(node.from.row, node.from.col) ||
        !inBounds(node.to.row, node.to.col)
      ) {
        return err('#REF!');
      }
      return range(expandRange(node.from, node.to).map((id) => ctx.get(id)));
    }

    case 'unary': {
      const v = evaluateAst(node.arg, ctx);
      if (v.type === 'error') return v;
      const n = toNumber(v);
      if (n.type === 'error') return n;
      return num(node.op === '-' ? -n.value : n.value);
    }

    case 'binary': {
      const left = evaluateAst(node.left, ctx);
      if (left.type === 'error') return left;
      const right = evaluateAst(node.right, ctx);
      if (right.type === 'error') return right;
      const a = toNumber(left);
      if (a.type === 'error') return a;
      const b = toNumber(right);
      if (b.type === 'error') return b;
      switch (node.op) {
        case '+':
          return num(a.value + b.value);
        case '-':
          return num(a.value - b.value);
        case '*':
          return num(a.value * b.value);
        case '/':
          if (b.value === 0) return err('#DIV/0!');
          return num(a.value / b.value);
        case '^':
          return num(Math.pow(a.value, b.value));
        default:
          return err('#VALUE!');
      }
    }

    case 'call': {
      const args = node.args.map((arg) => evaluateAst(arg, ctx));
      const bad = firstError(args);
      if (bad) return bad;

      switch (node.name) {
        case 'SUM': {
          const values = numericOperands(args);
          if (!Array.isArray(values)) return values; // an error Value
          return num(values.reduce((s, n) => s + n, 0));
        }
        case 'AVG': {
          const values = numericOperands(args);
          if (!Array.isArray(values)) return values; // an error Value
          if (values.length === 0) return err('#DIV/0!');
          return num(values.reduce((s, n) => s + n, 0) / values.length);
        }
        case 'COUNT': {
          const values = numericOperands(args);
          if (!Array.isArray(values)) return values; // an error Value
          return num(values.length);
        }
        case 'MIN':
        case 'MAX': {
          const values = numericOperands(args);
          if (!Array.isArray(values)) return values; // an error Value
          if (values.length === 0) return num(0);
          return num(node.name === 'MIN' ? Math.min(...values) : Math.max(...values));
        }
        case 'ABS': {
          if (args.length !== 1) return err('#VALUE!');
          const n = toNumber(args[0]);
          if (n.type === 'error') return n;
          return num(Math.abs(n.value));
        }
        case 'ROUND': {
          if (args.length < 1 || args.length > 2) return err('#VALUE!');
          const n = toNumber(args[0]);
          if (n.type === 'error') return n;
          const digits = args.length === 2 ? toNumber(args[1]) : num(0);
          if (digits.type === 'error') return digits;
          const factor = Math.pow(10, Math.trunc(digits.value));
          return num(Math.round(n.value * factor) / factor);
        }
        default:
          return err('#NAME?');
      }
    }

    default:
      return err('#VALUE!');
  }
}
