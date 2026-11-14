export const ERRORS = {
  DIV0: '#DIV/0!',
  REF: '#REF!',
  VALUE: '#VALUE!',
  CYCLE: '#CYCLE!',
  NAME: '#NAME?',
  NUM: '#NUM!',
};

export function errorValue(code) {
  return { error: code };
}

export function isError(value) {
  return !!value && typeof value === 'object' && typeof value.error === 'string';
}

export function isRangeValue(value) {
  return !!value && typeof value === 'object' && value.__range === true;
}

export function rangeValue(values) {
  return { __range: true, values };
}

export class FormulaSyntaxError extends Error {
  constructor(message, code = ERRORS.VALUE) {
    super(message);
    this.name = 'FormulaSyntaxError';
    this.code = code;
  }
}