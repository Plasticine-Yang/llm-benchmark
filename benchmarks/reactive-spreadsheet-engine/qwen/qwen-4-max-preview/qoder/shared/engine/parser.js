import { tokenize } from './tokenizer.js';
import { addressOrder, cellId, expandRange, inBounds, parseAddress, ROWS, COLS } from './address.js';
import { ERRORS, FormulaSyntaxError, errorValue } from './errors.js';

class Parser {
  constructor(tokens, rows, cols) {
    this.tokens = tokens;
    this.i = 0;
    this.rows = rows;
    this.cols = cols;
  }

  peek(offset = 0) {
    return this.tokens[Math.min(this.i + offset, this.tokens.length - 1)];
  }

  next() {
    const token = this.peek();
    this.i += 1;
    return token;
  }

  is(type, value) {
    const token = this.peek();
    return token.type === type && (value === undefined || token.value === value);
  }

  expect(type, value) {
    if (!this.is(type, value)) {
      const token = this.peek();
      throw new FormulaSyntaxError(`Expected ${value ?? type} but found "${token.value ?? token.type}"`);
    }
    return this.next();
  }

  parseExpression() {
    return this.parseComparison();
  }

  parseComparison() {
    let left = this.parseConcat();
    while (this.is('op') && ['=', '<>', '<', '>', '<=', '>='].includes(this.peek().value)) {
      const op = this.next().value;
      left = { type: 'binary', op, left, right: this.parseConcat() };
    }
    return left;
  }

  parseConcat() {
    let left = this.parseAdditive();
    while (this.is('op', '&')) {
      this.next();
      left = { type: 'binary', op: '&', left, right: this.parseAdditive() };
    }
    return left;
  }

  parseAdditive() {
    let left = this.parseMultiplicative();
    while (this.is('op') && (this.peek().value === '+' || this.peek().value === '-')) {
      const op = this.next().value;
      left = { type: 'binary', op, left, right: this.parseMultiplicative() };
    }
    return left;
  }

  parseMultiplicative() {
    let left = this.parseUnary();
    while (this.is('op') && (this.peek().value === '*' || this.peek().value === '/')) {
      const op = this.next().value;
      left = { type: 'binary', op, left, right: this.parseUnary() };
    }
    return left;
  }

  parseUnary() {
    if (this.is('op') && (this.peek().value === '-' || this.peek().value === '+')) {
      const op = this.next().value;
      return { type: 'unary', op, operand: this.parseUnary() };
    }
    return this.parsePower();
  }

  parsePower() {
    const base = this.parsePrimary();
    if (this.is('op', '^')) {
      this.next();
      return { type: 'binary', op: '^', left: base, right: this.parseUnary() };
    }
    return base;
  }

  parsePrimary() {
    const token = this.peek();

    if (token.type === 'number') {
      this.next();
      return { type: 'number', value: token.value };
    }
    if (token.type === 'string') {
      this.next();
      return { type: 'string', value: token.value };
    }
    if (token.type === 'bool') {
      this.next();
      return { type: 'bool', value: token.value };
    }
    if (token.type === 'error') {
      this.next();
      return { type: 'error', value: token.value };
    }
    if (token.type === 'cell') {
      this.next();
      const address = parseAddress(token.value);
      const valid = inBounds(address.col, address.row, this.rows, this.cols);
      const id = valid ? cellId(address.col, address.row) : token.value.toUpperCase();
      if (this.is(':')) {
        this.next();
        const endToken = this.expect('cell');
        const end = parseAddress(endToken.value);
        const endValid = inBounds(end.col, end.row, this.rows, this.cols);
        const endId = endValid ? cellId(end.col, end.row) : endToken.value.toUpperCase();
        const expansion = valid && endValid
          ? expandRange(id, endId, this.rows, this.cols)
          : { valid: false, cells: [] };
        return { type: 'range', from: id, to: endId, valid: expansion.valid, cells: expansion.cells };
      }
      return { type: 'cell', id, valid };
    }
    if (token.type === 'ident') {
      this.next();
      const name = token.value.toUpperCase();
      if (this.is('(')) {
        this.next();
        const args = [];
        if (!this.is(')')) {
          args.push(this.parseExpression());
          while (this.is(',')) {
            this.next();
            args.push(this.parseExpression());
          }
        }
        this.expect(')');
        return { type: 'call', name, args };
      }
      return { type: 'name', name };
    }
    if (token.type === '(') {
      this.next();
      const inner = this.parseExpression();
      this.expect(')');
      return inner;
    }
    throw new FormulaSyntaxError(`Unexpected token "${token.value ?? token.type}"`);
  }
}

export function collectRefs(node, out = new Set()) {
  if (!node) return out;
  switch (node.type) {
    case 'cell':
      if (node.valid) out.add(node.id);
      break;
    case 'range':
      if (node.valid) node.cells.forEach((id) => out.add(id));
      break;
    case 'unary':
      collectRefs(node.operand, out);
      break;
    case 'binary':
      collectRefs(node.left, out);
      collectRefs(node.right, out);
      break;
    case 'call':
      node.args.forEach((arg) => collectRefs(arg, out));
      break;
    default:
      break;
  }
  return out;
}

export function parseFormula(raw, { rows = ROWS, cols = COLS } = {}) {
  const source = String(raw).slice(1);
  if (!source.trim()) {
    return { ast: null, refs: [], error: errorValue(ERRORS.VALUE) };
  }
  try {
    const parser = new Parser(tokenize(source), rows, cols);
    const ast = parser.parseExpression();
    parser.expect('eof');
    const refs = [...collectRefs(ast)].sort((a, b) => addressOrder(a, cols) - addressOrder(b, cols));
    return { ast, refs, error: null };
  } catch (err) {
    const code = err instanceof FormulaSyntaxError ? err.code : ERRORS.VALUE;
    return { ast: null, refs: [], error: errorValue(code) };
  }
}

export function refsInFormula(raw, options) {
  if (typeof raw !== 'string' || !raw.startsWith('=')) return [];
  return parseFormula(raw, options).refs;
}