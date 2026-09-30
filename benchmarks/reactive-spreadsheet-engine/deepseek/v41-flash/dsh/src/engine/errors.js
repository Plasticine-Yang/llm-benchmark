/**
 * Spreadsheet error values. These are the exact strings Excel-compatible
 * spreadsheets display in a cell, and they are used as *values* (not exceptions)
 * so that they can propagate through the dependency graph like any other value.
 */
export const ERR = Object.freeze({
  DIV0: '#DIV/0!',
  REF: '#REF!',
  VALUE: '#VALUE!',
  CYCLE: '#CYCLE!',
  NAME: '#NAME?',
  PARSE: '#PARSE!',
  NUM: '#NUM!',
});

export const ERROR_VALUES = Object.freeze(Object.values(ERR));
const ERROR_SET = new Set(ERROR_VALUES);

/** True when a string looks like one of our error literals. */
export function isErrorValue(v) {
  return typeof v === 'string' && ERROR_SET.has(v);
}

/** A blank (missing / empty) cell value. */
export function blank() {
  return { v: '', e: null };
}

export function value(v) {
  return { v, e: null };
}

export function errValue(code) {
  return { v: '', e: code };
}

export function isCellError(cell) {
  return Boolean(cell && cell.e);
}
