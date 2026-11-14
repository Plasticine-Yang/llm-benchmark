import { ERRORS, errorValue, isError, isRangeValue } from './errors.js';

export function flatten(args) {
  const out = [];
  for (const arg of args) {
    if (isRangeValue(arg)) out.push(...arg.values);
    else out.push(arg);
  }
  return out;
}

export function firstError(values) {
  for (const value of values) if (isError(value)) return value;
  return null;
}

export function coerceNumber(value) {
  if (isError(value)) return value;
  if (isRangeValue(value)) return errorValue(ERRORS.VALUE);
  if (value === null || value === undefined || value === '') return 0;
  if (typeof value === 'boolean') return value ? 1 : 0;
  if (typeof value === 'number') return Number.isFinite(value) ? value : errorValue(ERRORS.NUM);
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed !== '' && /^[-+]?(\d+\.?\d*|\.\d+)([eE][-+]?\d+)?$/.test(trimmed)) {
      const num = Number(trimmed);
      return Number.isFinite(num) ? num : errorValue(ERRORS.NUM);
    }
    return errorValue(ERRORS.VALUE);
  }
  return errorValue(ERRORS.VALUE);
}

export function stringify(value) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
  return String(value);
}

function numbers(values) {
  return values.filter((value) => typeof value === 'number' && Number.isFinite(value));
}

function unary(name, min, max, fn) {
  return { name, min, max, fn };
}

function mathFn(fn, min = 1, max = 1) {
  return unary('math', min, max, (args) => {
    const values = flatten(args);
    const error = firstError(values);
    if (error) return error;
    const nums = [];
    for (const value of values) {
      const num = coerceNumber(value);
      if (isError(num)) return num;
      nums.push(num);
    }
    return fn(...nums);
  });
}

function guardFinite(result) {
  return Number.isFinite(result) ? result : errorValue(ERRORS.NUM);
}

export const FUNCTIONS = {
  SUM: unary('SUM', 1, Infinity, (args) => {
    const values = flatten(args);
    const error = firstError(values);
    if (error) return error;
    return numbers(values).reduce((total, n) => total + n, 0);
  }),
  AVG: unary('AVG', 1, Infinity, (args) => {
    const values = flatten(args);
    const error = firstError(values);
    if (error) return error;
    const nums = numbers(values);
    if (nums.length === 0) return errorValue(ERRORS.DIV0);
    return nums.reduce((total, n) => total + n, 0) / nums.length;
  }),
  MIN: unary('MIN', 1, Infinity, (args) => {
    const values = flatten(args);
    const error = firstError(values);
    if (error) return error;
    const nums = numbers(values);
    return nums.length ? Math.min(...nums) : 0;
  }),
  MAX: unary('MAX', 1, Infinity, (args) => {
    const values = flatten(args);
    const error = firstError(values);
    if (error) return error;
    const nums = numbers(values);
    return nums.length ? Math.max(...nums) : 0;
  }),
  COUNT: unary('COUNT', 1, Infinity, (args) => {
    const values = flatten(args);
    const error = firstError(values);
    if (error) return error;
    return numbers(values).length;
  }),
  COUNTA: unary('COUNTA', 1, Infinity, (args) => {
    const values = flatten(args);
    const error = firstError(values);
    if (error) return error;
    return values.filter((value) => value !== null && value !== undefined && value !== '').length;
  }),
  PRODUCT: unary('PRODUCT', 1, Infinity, (args) => {
    const values = flatten(args);
    const error = firstError(values);
    if (error) return error;
    return numbers(values).reduce((total, n) => total * n, 1);
  }),
  ABS: mathFn((n) => Math.abs(n)),
  INT: mathFn((n) => Math.floor(n)),
  SIGN: mathFn((n) => Math.sign(n)),
  SQRT: mathFn((n) => (n < 0 ? errorValue(ERRORS.NUM) : Math.sqrt(n))),
  ROUND: mathFn((n, digits = 0) => {
    const factor = 10 ** Math.trunc(digits);
    return guardFinite(Math.round((n + Number.EPSILON) * factor) / factor);
  }, 1, 2),
  POWER: mathFn((a, b) => guardFinite(a ** b), 2, 2),
  MOD: mathFn((a, b) => (b === 0 ? errorValue(ERRORS.DIV0) : guardFinite(a - b * Math.floor(a / b))), 2, 2),
  PI: mathFn(() => Math.PI, 0, 0),
  CONCAT: unary('CONCAT', 1, Infinity, (args) => {
    const values = flatten(args);
    const error = firstError(values);
    if (error) return error;
    return values.map(stringify).join('');
  }),
  LEN: unary('LEN', 1, 1, (args) => {
    const values = flatten(args);
    const error = firstError(values);
    if (error) return error;
    if (isRangeValue(values[0])) return errorValue(ERRORS.VALUE);
    return stringify(values[0]).length;
  }),
  UPPER: unary('UPPER', 1, 1, (args) => {
    const values = flatten(args);
    const error = firstError(values);
    if (error) return error;
    return stringify(values[0]).toUpperCase();
  }),
  LOWER: unary('LOWER', 1, 1, (args) => {
    const values = flatten(args);
    const error = firstError(values);
    if (error) return error;
    return stringify(values[0]).toLowerCase();
  }),
  TRIM: unary('TRIM', 1, 1, (args) => {
    const values = flatten(args);
    const error = firstError(values);
    if (error) return error;
    return stringify(values[0]).trim();
  }),
  AND: unary('AND', 1, Infinity, (args) => {
    const values = flatten(args);
    const error = firstError(values);
    if (error) return error;
    return values.every((value) => truthy(value));
  }),
  OR: unary('OR', 1, Infinity, (args) => {
    const values = flatten(args);
    const error = firstError(values);
    if (error) return error;
    return values.some((value) => truthy(value));
  }),
  NOT: unary('NOT', 1, 1, (args) => {
    const values = flatten(args);
    const error = firstError(values);
    if (error) return error;
    return !truthy(values[0]);
  }),
};

FUNCTIONS.AVERAGE = FUNCTIONS.AVG;
FUNCTIONS.CONCATENATE = FUNCTIONS.CONCAT;

export function truthy(value) {
  if (isError(value)) return value;
  if (value === null || value === undefined || value === '') return false;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'string') {
    const upper = value.trim().toUpperCase();
    if (upper === 'TRUE') return true;
    if (upper === 'FALSE') return false;
    const num = Number(value);
    return Number.isFinite(num) ? num !== 0 : true;
  }
  return true;
}

export const LAZY_FUNCTIONS = new Set(['IF', 'IFERROR']);