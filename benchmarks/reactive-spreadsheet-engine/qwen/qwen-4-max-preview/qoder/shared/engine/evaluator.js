import { ERRORS, errorValue, isError, isRangeValue, rangeValue } from './errors.js';
import { coerceNumber, firstError, flatten, FUNCTIONS, LAZY_FUNCTIONS, stringify, truthy } from './functions.js';

function finite(result) {
  return Number.isFinite(result) ? result : errorValue(ERRORS.NUM);
}

function compareValues(op, left, right) {
  if (isRangeValue(left) || isRangeValue(right)) return errorValue(ERRORS.VALUE);
  let a = left;
  let b = right;
  if (a === null || a === undefined) a = typeof b === 'string' ? '' : 0;
  if (b === null || b === undefined) b = typeof a === 'string' ? '' : 0;
  if (typeof a === 'boolean') a = a ? 1 : 0;
  if (typeof b === 'boolean') b = b ? 1 : 0;

  let result;
  if (typeof a === 'number' && typeof b === 'number') {
    result = a === b ? 0 : a < b ? -1 : 1;
  } else if (typeof a === 'string' && typeof b === 'string') {
    result = a === b ? 0 : a < b ? -1 : 1;
  } else {
    const sa = stringify(a);
    const sb = stringify(b);
    result = sa === sb ? 0 : sa < sb ? -1 : 1;
  }

  switch (op) {
    case '=': return result === 0;
    case '<>': return result !== 0;
    case '<': return result < 0;
    case '>': return result > 0;
    case '<=': return result <= 0;
    case '>=': return result >= 0;
    default: return errorValue(ERRORS.VALUE);
  }
}

export function applyBinary(op, left, right) {
  if (isError(left)) return left;
  if (isError(right)) return right;

  if (op === '&') {
    if (isRangeValue(left) || isRangeValue(right)) return errorValue(ERRORS.VALUE);
    return stringify(left) + stringify(right);
  }

  if (['=', '<>', '<', '>', '<=', '>='].includes(op)) return compareValues(op, left, right);

  if (isRangeValue(left) || isRangeValue(right)) return errorValue(ERRORS.VALUE);
  const a = coerceNumber(left);
  if (isError(a)) return a;
  const b = coerceNumber(right);
  if (isError(b)) return b;

  switch (op) {
    case '+': return finite(a + b);
    case '-': return finite(a - b);
    case '*': return finite(a * b);
    case '/': return b === 0 ? errorValue(ERRORS.DIV0) : finite(a / b);
    case '^': return finite(a ** b);
    default: return errorValue(ERRORS.VALUE);
  }
}

function evaluateCall(node, ctx) {
  const { name, args } = node;

  if (name === 'IF') {
    if (args.length < 2 || args.length > 3) return errorValue(ERRORS.VALUE);
    const condition = evaluateNode(args[0], ctx);
    if (isError(condition)) return condition;
    const branch = truthy(condition) ? args[1] : args[2];
    if (!branch) return false;
    return evaluateNode(branch, ctx);
  }

  if (name === 'IFERROR') {
    if (args.length !== 2) return errorValue(ERRORS.VALUE);
    const value = evaluateNode(args[0], ctx);
    return isError(value) ? evaluateNode(args[1], ctx) : value;
  }

  const fn = FUNCTIONS[name];
  if (!fn) return errorValue(ERRORS.NAME);
  if (args.length < fn.min || args.length > fn.max) return errorValue(ERRORS.VALUE);

  const values = args.map((arg) => evaluateNode(arg, ctx));
  const error = firstError(values);
  if (error && !LAZY_FUNCTIONS.has(name)) return error;
  return fn.fn(values, ctx);
}

export function evaluateNode(node, ctx) {
  if (!node) return errorValue(ERRORS.VALUE);
  switch (node.type) {
    case 'number':
    case 'string':
    case 'bool':
      return node.value;
    case 'error':
      return errorValue(node.value);
    case 'name':
      return errorValue(ERRORS.NAME);
    case 'cell':
      return node.valid ? ctx.getValue(node.id) : errorValue(ERRORS.REF);
    case 'range': {
      if (!node.valid) return errorValue(ERRORS.REF);
      return rangeValue(node.cells.map((id) => ctx.getValue(id)));
    }
    case 'unary': {
      const value = evaluateNode(node.operand, ctx);
      if (isError(value)) return value;
      const num = coerceNumber(value);
      if (isError(num)) return num;
      return node.op === '-' ? -num : num;
    }
    case 'binary': {
      const left = evaluateNode(node.left, ctx);
      if (isError(left)) return left;
      const right = evaluateNode(node.right, ctx);
      return applyBinary(node.op, left, right);
    }
    case 'call':
      return evaluateCall(node, ctx);
    default:
      return errorValue(ERRORS.VALUE);
  }
}

export function evaluateAst(ast, ctx) {
  return evaluateNode(ast, ctx);
}