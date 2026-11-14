/** Recursive-descent parser producing an AST plus the set of referenced cells. */

import { tokenize, FormulaSyntaxError } from './tokenizer.js';
import { parseCellRef, expandRange, inBounds } from './cells.js';

export const FUNCTIONS = new Set([
  'SUM',
  'AVG',
  'AVERAGE',
  'COUNT',
  'MIN',
  'MAX',
  'ABS',
  'ROUND',
]);

class Parser {
  constructor(tokens) {
    this.tokens = tokens;
    this.i = 0;
  }

  peek() {
    return this.tokens[this.i];
  }

  next() {
    return this.tokens[this.i++];
  }

  isOp(value) {
    const t = this.peek();
    return t.type === 'op' && t.value === value;
  }

  consumeOp(value) {
    if (this.isOp(value)) {
      this.i++;
      return true;
    }
    return false;
  }

  expectOp(value) {
    if (!this.consumeOp(value)) {
      const t = this.peek();
      throw new FormulaSyntaxError(`期望 "${value}"，实际为 "${t.value || 'EOF'}"`);
    }
  }

  parse() {
    const ast = this.parseAddSub();
    if (this.peek().type !== 'eof') {
      throw new FormulaSyntaxError(`表达式末尾存在多余内容 "${this.peek().value}"`);
    }
    return ast;
  }

  // + - (lowest precedence, left associative)
  parseAddSub() {
    let node = this.parseMulDiv();
    while (this.isOp('+') || this.isOp('-')) {
      const op = this.next().value;
      node = { type: 'binary', op, left: node, right: this.parseMulDiv() };
    }
    return node;
  }

  // * /
  parseMulDiv() {
    let node = this.parseUnary();
    while (this.isOp('*') || this.isOp('/')) {
      const op = this.next().value;
      node = { type: 'binary', op, left: node, right: this.parseUnary() };
    }
    return node;
  }

  // unary + / -
  parseUnary() {
    if (this.isOp('+') || this.isOp('-')) {
      const op = this.next().value;
      return { type: 'unary', op, arg: this.parseUnary() };
    }
    return this.parsePower();
  }

  // ^ (right associative, binds tighter than unary minus on its base)
  parsePower() {
    const base = this.parsePrimary();
    if (this.consumeOp('^')) {
      return { type: 'binary', op: '^', left: base, right: this.parseUnary() };
    }
    return base;
  }

  parsePrimary() {
    const t = this.peek();

    if (t.type === 'number') {
      this.next();
      return { type: 'number', value: t.value };
    }

    if (t.type === 'string') {
      this.next();
      return { type: 'string', value: t.value };
    }

    if (this.consumeOp('(')) {
      const inner = this.parseAddSub();
      this.expectOp(')');
      return { type: 'group', arg: inner };
    }

    if (t.type === 'ident') {
      const name = this.next().value;

      if (this.isOp('(')) {
        if (!FUNCTIONS.has(name)) {
          throw new FormulaSyntaxError(`未知函数 ${name}`, '#NAME?');
        }
        this.next();
        const args = [];
        if (!this.isOp(')')) {
          do {
            args.push(this.parseAddSub());
          } while (this.consumeOp(','));
        }
        this.expectOp(')');
        return {
          type: 'call',
          name: name === 'AVERAGE' ? 'AVG' : name,
          args,
        };
      }

      if (this.consumeOp(':')) {
        const end = this.peek();
        if (end.type !== 'ident') {
          throw new FormulaSyntaxError('范围缺少终点单元格', '#REF!');
        }
        this.next();
        const from = parseCellRef(name);
        const to = parseCellRef(end.value);
        if (!from || !to) throw new FormulaSyntaxError(`无效范围 ${name}:${end.value}`, '#REF!');
        return { type: 'range', from, to };
      }

      const ref = parseCellRef(name);
      if (!ref) {
        const looksLikeCell = /^(?:\$?)[A-Z]{1,3}(?:\$?)\d+$/.test(name);
        throw new FormulaSyntaxError(
          `无法识别的名称或引用 ${name}`,
          looksLikeCell ? '#REF!' : '#NAME?',
        );
      }
      return { type: 'ref', id: ref.id, row: ref.row, col: ref.col };
    }

    throw new FormulaSyntaxError(`意外的记号 "${t.value || 'EOF'}"`);
  }
}

/** Walk an AST and collect every cell id the formula reads (ranges expanded). */
export function extractDependencies(ast) {
  const deps = new Set();

  function visit(node) {
    if (!node || typeof node !== 'object') return;
    switch (node.type) {
      case 'ref':
        deps.add(node.id);
        break;
      case 'range':
        for (const id of expandRange(node.from, node.to)) {
          if (inBounds(node.from.row, node.from.col) && inBounds(node.to.row, node.to.col)) {
            deps.add(id);
          }
        }
        break;
      case 'group':
        visit(node.arg);
        break;
      case 'unary':
        visit(node.arg);
        break;
      case 'binary':
        visit(node.left);
        visit(node.right);
        break;
      case 'call':
        for (const arg of node.args) visit(arg);
        break;
      default:
        break;
    }
  }

  visit(ast);
  return deps;
}

/**
 * Parse the complete raw text of a cell.
 * Returns { ast, deps, error }. A parse failure never throws: the error code
 * becomes the cell's computed value so dependents can propagate it.
 */
export function parseFormula(raw) {
  const text = String(raw).trimStart();
  try {
    const ast = new Parser(tokenize(text.slice(1))).parse();
    return { ast, deps: extractDependencies(ast), error: null };
  } catch (e) {
    return {
      ast: null,
      deps: new Set(),
      error: e instanceof FormulaSyntaxError ? e.code : '#PARSE!',
      message: e instanceof Error ? e.message : String(e),
    };
  }
}
