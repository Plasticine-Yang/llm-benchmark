export const ERROR = Object.freeze({
  CYCLE: '#CYCLE!',
  DIV_ZERO: '#DIV/0!',
  REF: '#REF!',
  VALUE: '#VALUE!'
});

export const DEFAULT_ROWS = 20;
export const DEFAULT_COLS = 10;

const CELL_PATTERN = /^([A-Z]+)([1-9]\d*)$/;
const NUMBER_PATTERN = /^(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$/;

export function columnName(index) {
  let value = index + 1;
  let name = '';
  while (value > 0) {
    const remainder = (value - 1) % 26;
    name = String.fromCharCode(65 + remainder) + name;
    value = Math.floor((value - 1) / 26);
  }
  return name;
}

export function columnIndex(name) {
  let value = 0;
  for (const character of name) value = value * 26 + character.charCodeAt(0) - 64;
  return value - 1;
}

export function parseCellId(id) {
  const match = String(id).toUpperCase().match(CELL_PATTERN);
  if (!match) return null;
  return { col: columnIndex(match[1]), row: Number(match[2]) - 1 };
}

export function makeCellId(row, col) {
  return `${columnName(col)}${row + 1}`;
}

class FormulaError extends Error {
  constructor(code) {
    super(code);
    this.code = code;
  }
}

class Lexer {
  constructor(input) {
    this.input = input;
    this.index = 0;
  }

  next() {
    while (/\s/.test(this.input[this.index] ?? '')) this.index += 1;
    if (this.index >= this.input.length) return { type: 'eof' };

    const rest = this.input.slice(this.index);
    const number = rest.match(/^(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/);
    if (number) {
      this.index += number[0].length;
      return { type: 'number', value: Number(number[0]) };
    }

    const word = rest.match(/^[A-Za-z]+\d*/);
    if (word) {
      this.index += word[0].length;
      const value = word[0].toUpperCase();
      return CELL_PATTERN.test(value)
        ? { type: 'cell', value }
        : { type: 'name', value };
    }

    const character = this.input[this.index++];
    if ('+-*/():,'.includes(character)) return { type: character };
    throw new FormulaError(ERROR.VALUE);
  }
}

class Parser {
  constructor(source) {
    this.lexer = new Lexer(source);
    this.current = this.lexer.next();
  }

  parse() {
    const expression = this.expression();
    if (this.current.type !== 'eof') throw new FormulaError(ERROR.VALUE);
    return expression;
  }

  advance(type) {
    if (this.current.type !== type) throw new FormulaError(ERROR.VALUE);
    const token = this.current;
    this.current = this.lexer.next();
    return token;
  }

  expression() {
    let node = this.term();
    while (this.current.type === '+' || this.current.type === '-') {
      const operator = this.current.type;
      this.advance(operator);
      node = { type: 'binary', operator, left: node, right: this.term() };
    }
    return node;
  }

  term() {
    let node = this.unary();
    while (this.current.type === '*' || this.current.type === '/') {
      const operator = this.current.type;
      this.advance(operator);
      node = { type: 'binary', operator, left: node, right: this.unary() };
    }
    return node;
  }

  unary() {
    if (this.current.type === '+' || this.current.type === '-') {
      const operator = this.current.type;
      this.advance(operator);
      return { type: 'unary', operator, value: this.unary() };
    }
    return this.primary();
  }

  primary() {
    if (this.current.type === 'number') {
      return { type: 'number', value: this.advance('number').value };
    }
    if (this.current.type === 'cell') {
      const start = this.advance('cell').value;
      if (this.current.type === ':') {
        this.advance(':');
        const end = this.advance('cell').value;
        return { type: 'range', start, end };
      }
      return { type: 'reference', id: start };
    }
    if (this.current.type === 'name') {
      const name = this.advance('name').value;
      this.advance('(');
      const args = [];
      if (this.current.type !== ')') {
        do {
          args.push(this.expression());
          if (this.current.type !== ',') break;
          this.advance(',');
        } while (true);
      }
      this.advance(')');
      return { type: 'function', name, args };
    }
    if (this.current.type === '(') {
      this.advance('(');
      const node = this.expression();
      this.advance(')');
      return node;
    }
    throw new FormulaError(ERROR.VALUE);
  }
}

export function parseFormula(source) {
  try {
    return { ast: new Parser(source).parse(), error: null };
  } catch (error) {
    return { ast: null, error: error instanceof FormulaError ? error.code : ERROR.VALUE };
  }
}

function expandRange(start, end, rows, cols) {
  const from = parseCellId(start);
  const to = parseCellId(end);
  if (!from || !to) throw new FormulaError(ERROR.REF);
  if (from.row >= rows || to.row >= rows || from.col >= cols || to.col >= cols) {
    throw new FormulaError(ERROR.REF);
  }
  const ids = [];
  for (let row = Math.min(from.row, to.row); row <= Math.max(from.row, to.row); row += 1) {
    for (let col = Math.min(from.col, to.col); col <= Math.max(from.col, to.col); col += 1) {
      ids.push(makeCellId(row, col));
    }
  }
  return ids;
}

function collectDependencies(node, dependencies, rows, cols) {
  if (!node) return;
  if (node.type === 'reference') {
    const position = parseCellId(node.id);
    if (position && position.row < rows && position.col < cols) dependencies.add(node.id);
    return;
  }
  if (node.type === 'range') {
    try {
      for (const id of expandRange(node.start, node.end, rows, cols)) dependencies.add(id);
    } catch {
      // Invalid references are evaluated as #REF! and cannot be graph vertices.
    }
    return;
  }
  if (node.type === 'binary') {
    collectDependencies(node.left, dependencies, rows, cols);
    collectDependencies(node.right, dependencies, rows, cols);
  } else if (node.type === 'unary') {
    collectDependencies(node.value, dependencies, rows, cols);
  } else if (node.type === 'function') {
    for (const argument of node.args) collectDependencies(argument, dependencies, rows, cols);
  }
}

function numeric(value) {
  if (value === '') return 0;
  if (typeof value !== 'number' || !Number.isFinite(value)) throw new FormulaError(ERROR.VALUE);
  return value;
}

function evaluateAst(node, resolve, rows, cols) {
  if (node.type === 'number') return node.value;
  if (node.type === 'reference') {
    const position = parseCellId(node.id);
    if (!position || position.row >= rows || position.col >= cols) throw new FormulaError(ERROR.REF);
    return resolve(node.id);
  }
  if (node.type === 'range') {
    return { range: expandRange(node.start, node.end, rows, cols).map(resolve) };
  }
  if (node.type === 'unary') {
    const value = numeric(evaluateAst(node.value, resolve, rows, cols));
    return node.operator === '-' ? -value : value;
  }
  if (node.type === 'binary') {
    const left = numeric(evaluateAst(node.left, resolve, rows, cols));
    const right = numeric(evaluateAst(node.right, resolve, rows, cols));
    if (node.operator === '+') return left + right;
    if (node.operator === '-') return left - right;
    if (node.operator === '*') return left * right;
    if (right === 0) throw new FormulaError(ERROR.DIV_ZERO);
    return left / right;
  }
  if (node.type === 'function') {
    if (node.name !== 'SUM' && node.name !== 'AVG') throw new FormulaError(ERROR.VALUE);
    const values = [];
    for (const argument of node.args) {
      const evaluated = evaluateAst(argument, resolve, rows, cols);
      if (evaluated && Array.isArray(evaluated.range)) values.push(...evaluated.range);
      else values.push(evaluated);
    }
    const numbers = values.filter((value) => typeof value === 'number' && Number.isFinite(value));
    const total = numbers.reduce((sum, value) => sum + value, 0);
    if (node.name === 'AVG' && numbers.length === 0) throw new FormulaError(ERROR.DIV_ZERO);
    return node.name === 'SUM' ? total : total / numbers.length;
  }
  throw new FormulaError(ERROR.VALUE);
}

function createCell(id) {
  return {
    id,
    raw: '',
    value: '',
    error: null,
    formula: false,
    ast: null,
    parseError: null,
    deps: new Set()
  };
}

export class SpreadsheetEngine {
  constructor(rows = DEFAULT_ROWS, cols = DEFAULT_COLS) {
    this.rows = rows;
    this.cols = cols;
    this.cells = new Map();
    this.reverse = new Map();
    this.cycles = new Set();
    this.lastRecalculated = [];
    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        const id = makeCellId(row, col);
        this.cells.set(id, createCell(id));
        this.reverse.set(id, new Set());
      }
    }
  }

  has(id) {
    return this.cells.has(String(id).toUpperCase());
  }

  getCell(id) {
    return this.cells.get(String(id).toUpperCase()) ?? null;
  }

  setCell(id, raw) {
    return this.setCells([[id, raw]]);
  }

  setCells(entries) {
    const changed = [];
    const previousCycles = new Set(this.cycles);
    const oldAffected = new Set();
    for (const [id] of entries) {
      const normalized = String(id).toUpperCase();
      if (this.cells.has(normalized)) {
        for (const dependent of this.dependentClosure(new Set([normalized]))) oldAffected.add(dependent);
      }
    }
    for (const [id, raw] of entries) {
      const cell = this.getCell(id);
      if (!cell || cell.raw === String(raw ?? '')) continue;
      this.detachDependencies(cell);
      this.prepareCell(cell, String(raw ?? ''));
      this.attachDependencies(cell);
      changed.push(cell.id);
    }
    if (changed.length === 0) return [];
    this.cycles = this.findCycles();
    const seeds = new Set([...oldAffected, ...changed, ...previousCycles, ...this.cycles]);
    const affected = this.dependentClosure(seeds);
    this.recalculate(affected);
    return [...affected];
  }

  prepareCell(cell, raw) {
    cell.raw = raw;
    cell.formula = raw.trimStart().startsWith('=');
    cell.ast = null;
    cell.parseError = null;
    cell.deps = new Set();
    if (cell.formula) {
      const parsed = parseFormula(raw.trimStart().slice(1));
      cell.ast = parsed.ast;
      cell.parseError = parsed.error;
      collectDependencies(cell.ast, cell.deps, this.rows, this.cols);
    }
  }

  detachDependencies(cell) {
    for (const dependency of cell.deps) this.reverse.get(dependency)?.delete(cell.id);
  }

  attachDependencies(cell) {
    for (const dependency of cell.deps) this.reverse.get(dependency)?.add(cell.id);
  }

  dependentClosure(seeds) {
    const result = new Set(seeds);
    const queue = [...seeds];
    while (queue.length > 0) {
      const id = queue.shift();
      for (const dependent of this.reverse.get(id) ?? []) {
        if (!result.has(dependent)) {
          result.add(dependent);
          queue.push(dependent);
        }
      }
    }
    return result;
  }

  findCycles() {
    let index = 0;
    const indices = new Map();
    const lowLinks = new Map();
    const stack = [];
    const onStack = new Set();
    const cycles = new Set();

    const connect = (id) => {
      indices.set(id, index);
      lowLinks.set(id, index);
      index += 1;
      stack.push(id);
      onStack.add(id);
      for (const dependency of this.cells.get(id).deps) {
        if (!indices.has(dependency)) {
          connect(dependency);
          lowLinks.set(id, Math.min(lowLinks.get(id), lowLinks.get(dependency)));
        } else if (onStack.has(dependency)) {
          lowLinks.set(id, Math.min(lowLinks.get(id), indices.get(dependency)));
        }
      }
      if (lowLinks.get(id) === indices.get(id)) {
        const component = [];
        let member;
        do {
          member = stack.pop();
          onStack.delete(member);
          component.push(member);
        } while (member !== id);
        if (component.length > 1 || this.cells.get(id).deps.has(id)) {
          for (const cycleId of component) cycles.add(cycleId);
        }
      }
    };

    for (const id of this.cells.keys()) if (!indices.has(id)) connect(id);
    return cycles;
  }

  recalculate(affected) {
    const completed = new Set();
    const evaluating = new Set();
    const order = [];

    const evaluateCell = (id) => {
      const cell = this.cells.get(id);
      if (!cell) throw new FormulaError(ERROR.REF);
      if (!affected.has(id) || completed.has(id)) {
        if (cell.error) throw new FormulaError(cell.error);
        return cell.value;
      }
      if (this.cycles.has(id) || evaluating.has(id)) {
        cell.value = ERROR.CYCLE;
        cell.error = ERROR.CYCLE;
        completed.add(id);
        order.push(id);
        throw new FormulaError(ERROR.CYCLE);
      }

      evaluating.add(id);
      cell.error = null;
      try {
        if (!cell.formula) {
          const trimmed = cell.raw.trim();
          cell.value = trimmed !== '' && NUMBER_PATTERN.test(trimmed) ? Number(trimmed) : cell.raw;
        } else if (cell.parseError || !cell.ast) {
          throw new FormulaError(cell.parseError ?? ERROR.VALUE);
        } else {
          cell.value = evaluateAst(cell.ast, evaluateCell, this.rows, this.cols);
          if (cell.value && Array.isArray(cell.value.range)) throw new FormulaError(ERROR.VALUE);
        }
      } catch (error) {
        cell.error = error instanceof FormulaError ? error.code : ERROR.VALUE;
        cell.value = cell.error;
      } finally {
        evaluating.delete(id);
        if (!completed.has(id)) {
          completed.add(id);
          order.push(id);
        }
      }
      if (cell.error) throw new FormulaError(cell.error);
      return cell.value;
    };

    for (const id of affected) {
      try {
        evaluateCell(id);
      } catch {
        // Errors live on their cells and are propagated through references.
      }
    }
    this.lastRecalculated = order;
  }

  getDependencies(id) {
    return [...(this.getCell(id)?.deps ?? [])];
  }

  getDependents(id, transitive = false) {
    const normalized = String(id).toUpperCase();
    if (!transitive) return [...(this.reverse.get(normalized) ?? [])];
    const closure = this.dependentClosure(new Set([normalized]));
    closure.delete(normalized);
    return [...closure];
  }

  rawSnapshot() {
    const snapshot = {};
    for (const [id, cell] of this.cells) if (cell.raw !== '') snapshot[id] = cell.raw;
    return snapshot;
  }

  loadRaw(snapshot = {}) {
    for (const cell of this.cells.values()) this.detachDependencies(cell);
    for (const cell of this.cells.values()) this.prepareCell(cell, String(snapshot[cell.id] ?? ''));
    for (const cell of this.cells.values()) this.attachDependencies(cell);
    this.cycles = this.findCycles();
    this.recalculate(new Set(this.cells.keys()));
  }

  serialize() {
    const cells = {};
    for (const [id, cell] of this.cells) {
      if (cell.raw !== '') cells[id] = { raw: cell.raw, value: cell.value, error: cell.error };
    }
    return { version: 1, rows: this.rows, cols: this.cols, cells };
  }
}
