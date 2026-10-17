/**
 * Lattice formula engine — dependency graph, incremental recalculation,
 * cycle detection, and Excel-style errors. Pure ESM: runs in the browser
 * and in Node (the dev server can use it for smoke checks).
 */

export const ROWS = 20;
export const COLS = 10;
export const ERROR_CODES = ["#CYCLE!", "#DIV/0!", "#REF!", "#VALUE!"];

export function columnLabel(index) {
  let n = index + 1;
  let out = "";
  while (n > 0) {
    const rem = (n - 1) % 26;
    out = String.fromCharCode(65 + rem) + out;
    n = Math.floor((n - 1) / 26);
  }
  return out;
}

export function cellAddress(row, col) {
  return `${columnLabel(col)}${row + 1}`;
}

export function addressToCoords(address) {
  const match = /^([A-Za-z]+)([1-9][0-9]*)$/.exec(String(address));
  if (!match) return null;
  let col = 0;
  for (const char of match[1].toUpperCase()) {
    col = col * 26 + (char.charCodeAt(0) - 64);
  }
  return { row: Number(match[2]) - 1, col: col - 1 };
}

export function isInGrid(address, rows = ROWS, cols = COLS) {
  const coords = addressToCoords(address);
  return Boolean(coords && coords.row >= 0 && coords.row < rows && coords.col >= 0 && coords.col < cols);
}

export function normalizeAddress(address) {
  const coords = addressToCoords(address);
  return coords ? cellAddress(coords.row, coords.col) : null;
}

export function compareAddresses(a, b) {
  const ca = addressToCoords(a);
  const cb = addressToCoords(b);
  if (!ca || !cb) return String(a).localeCompare(String(b));
  return ca.row - cb.row || ca.col - cb.col;
}

const NUMBER_RE = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/;
const REF_RE = /^([A-Za-z]+)([1-9][0-9]*)$/;

export class FormulaSyntaxError extends Error {
  constructor(message) {
    super(message);
    this.name = "FormulaSyntaxError";
    this.code = "#VALUE!";
  }
}

/* ------------------------------------------------------------------ */
/* Tokenizer + parser                                                  */
/* ------------------------------------------------------------------ */

function tokenize(source) {
  const tokens = [];
  let i = 0;
  while (i < source.length) {
    const char = source[i];
    if (/\s/.test(char)) {
      i += 1;
      continue;
    }
    if (/\d/.test(char) || (char === "." && /\d/.test(source[i + 1] || ""))) {
      const rest = source.slice(i);
      const match = /^(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?/.exec(rest);
      if (!match) throw new FormulaSyntaxError(`Invalid number near "${source.slice(i, i + 8)}"`);
      tokens.push({ type: "number", value: Number(match[0]) });
      i += match[0].length;
      continue;
    }
    if (/[A-Za-z]/.test(char)) {
      let j = i;
      while (j < source.length && /[A-Za-z]/.test(source[j])) j += 1;
      while (j < source.length && /\d/.test(source[j])) j += 1;
      tokens.push({ type: "ident", value: source.slice(i, j) });
      i = j;
      continue;
    }
    if (char === '"') {
      let value = "";
      let j = i + 1;
      let closed = false;
      while (j < source.length) {
        if (source[j] === '"') {
          if (source[j + 1] === '"') {
            value += '"';
            j += 2;
            continue;
          }
          closed = true;
          j += 1;
          break;
        }
        value += source[j];
        j += 1;
      }
      if (!closed) throw new FormulaSyntaxError("Unterminated text string");
      tokens.push({ type: "string", value });
      i = j;
      continue;
    }
    if ("+-*/():,".includes(char)) {
      tokens.push({ type: char });
      i += 1;
      continue;
    }
    throw new FormulaSyntaxError(`Unexpected character "${char}"`);
  }
  tokens.push({ type: "eof" });
  return tokens;
}

class FormulaParser {
  constructor(source) {
    this.source = source;
    this.tokens = tokenize(source);
    this.pos = 0;
  }

  peek() {
    return this.tokens[this.pos];
  }

  next() {
    return this.tokens[this.pos++];
  }

  match(type) {
    if (this.peek().type === type) {
      this.pos += 1;
      return true;
    }
    return false;
  }

  expect(type, label = type) {
    if (!this.match(type)) {
      const found = this.peek().type === "eof" ? "end of formula" : `"${this.peek().value ?? this.peek().type}"`;
      throw new FormulaSyntaxError(`Expected ${label}, found ${found}`);
    }
  }

  parse() {
    if (this.peek().type === "eof") throw new FormulaSyntaxError("Formula is empty");
    const ast = this.parseExpression();
    if (this.peek().type !== "eof") {
      throw new FormulaSyntaxError(`Unexpected token "${this.peek().value ?? this.peek().type}"`);
    }
    return ast;
  }

  parseExpression() {
    return this.parseAdditive();
  }

  parseAdditive() {
    let node = this.parseMultiplicative();
    while (this.peek().type === "+" || this.peek().type === "-") {
      const op = this.next().type;
      node = { type: "binary", op, left: node, right: this.parseMultiplicative() };
    }
    return node;
  }

  parseMultiplicative() {
    let node = this.parseUnary();
    while (this.peek().type === "*" || this.peek().type === "/") {
      const op = this.next().type;
      node = { type: "binary", op, left: node, right: this.parseUnary() };
    }
    return node;
  }

  parseUnary() {
    if (this.peek().type === "+" || this.peek().type === "-") {
      const op = this.next().type;
      return { type: "unary", op, operand: this.parseUnary() };
    }
    return this.parsePrimary();
  }

  parsePrimary() {
    const token = this.peek();
    if (token.type === "number") {
      this.next();
      return { type: "number", value: token.value };
    }
    if (token.type === "string") {
      this.next();
      return { type: "string", value: token.value };
    }
    if (token.type === "(") {
      this.next();
      const node = this.parseExpression();
      this.expect(")", '")"');
      return node;
    }
    if (token.type === "ident") {
      this.next();
      if (this.peek().type === "(") {
        this.next();
        const args = [];
        if (this.peek().type !== ")") {
          args.push(this.parseExpression());
          while (this.match(",")) args.push(this.parseExpression());
        }
        this.expect(")", '")" after function arguments');
        return { type: "call", name: token.value.toUpperCase(), args };
      }
      const ref = REF_RE.exec(token.value);
      if (!ref) {
        throw new FormulaSyntaxError(`"${token.value}" is not a cell reference or function`);
      }
      let col = 0;
      for (const char of ref[1].toUpperCase()) col = col * 26 + char.charCodeAt(0) - 64;
      const endpoint = { row: Number(ref[2]) - 1, col: col - 1 };
      if (this.match(":")) {
        const endToken = this.next();
        const endRef = endToken.type === "ident" ? REF_RE.exec(endToken.value) : null;
        if (!endRef) throw new FormulaSyntaxError("A range must end with a cell reference");
        let endCol = 0;
        for (const char of endRef[1].toUpperCase()) endCol = endCol * 26 + char.charCodeAt(0) - 64;
        return {
          type: "range",
          start: endpoint,
          end: { row: Number(endRef[2]) - 1, col: endCol - 1 },
        };
      }
      return { type: "ref", ...endpoint };
    }
    const found = token.type === "eof" ? "end of formula" : `"${token.value ?? token.type}"`;
    throw new FormulaSyntaxError(`Expected a value, found ${found}`);
  }
}

export function parseFormula(source) {
  return new FormulaParser(source).parse();
}

export function extractDependencies(ast, rows = ROWS, cols = COLS) {
  const deps = new Set();
  const inGrid = (row, col) => row >= 0 && row < rows && col >= 0 && col < cols;
  const walk = (node) => {
    if (!node) return;
    if (node.type === "ref") {
      if (inGrid(node.row, node.col)) deps.add(cellAddress(node.row, node.col));
      return;
    }
    if (node.type === "range") {
      const rowStart = Math.max(0, Math.min(node.start.row, node.end.row));
      const rowEnd = Math.min(rows - 1, Math.max(node.start.row, node.end.row));
      const colStart = Math.max(0, Math.min(node.start.col, node.end.col));
      const colEnd = Math.min(cols - 1, Math.max(node.start.col, node.end.col));
      for (let row = rowStart; row <= rowEnd; row += 1) {
        for (let col = colStart; col <= colEnd; col += 1) deps.add(cellAddress(row, col));
      }
      return;
    }
    if (node.type === "binary") {
      walk(node.left);
      walk(node.right);
      return;
    }
    if (node.type === "unary") {
      walk(node.operand);
      return;
    }
    if (node.type === "call") {
      for (const arg of node.args) walk(arg);
    }
  };
  walk(ast);
  return deps;
}

/* ------------------------------------------------------------------ */
/* Results and evaluation                                              */
/* ------------------------------------------------------------------ */

const numberResult = (value) => ({ type: "number", value });
const textResult = (value) => ({ type: "text", value });
const emptyResult = () => ({ type: "empty" });
const errorResult = (error, message) => ({ type: "error", error, message });

const isError = (result) => result.type === "error";

function coerceNumber(result) {
  if (isError(result)) return result;
  if (result.type === "number") return result;
  if (result.type === "empty") return numberResult(0);
  return errorResult("#VALUE!", "Text cannot be used in an arithmetic operation");
}

function arithmetic(op, left, right) {
  const a = coerceNumber(left);
  if (isError(a)) return a;
  const b = coerceNumber(right);
  if (isError(b)) return b;
  let value;
  switch (op) {
    case "+":
      value = a.value + b.value;
      break;
    case "-":
      value = a.value - b.value;
      break;
    case "*":
      value = a.value * b.value;
      break;
    case "/":
      if (b.value === 0) return errorResult("#DIV/0!", "Division by zero");
      value = a.value / b.value;
      break;
    default:
      return errorResult("#VALUE!", `Unknown operator ${op}`);
  }
  if (!Number.isFinite(value)) return errorResult("#VALUE!", "The result is not a finite number");
  return numberResult(value);
}

function evaluateNode(node, readCell) {
  switch (node.type) {
    case "number":
      return numberResult(node.value);
    case "string":
      return textResult(node.value);
    case "ref": {
      if (node.row < 0 || node.col < 0 || node.row >= ROWS || node.col >= COLS) {
        return errorResult("#REF!", "Cell reference is outside this sheet");
      }
      return readCell(cellAddress(node.row, node.col));
    }
    case "range":
      return errorResult("#VALUE!", "A range can only be used inside SUM or AVG");
    case "unary": {
      const value = coerceNumber(evaluateNode(node.operand, readCell));
      if (isError(value)) return value;
      return numberResult(node.op === "-" ? -value.value : value.value);
    }
    case "binary":
      return arithmetic(node.op, evaluateNode(node.left, readCell), evaluateNode(node.right, readCell));
    case "call": {
      const name = node.name;
      if (name !== "SUM" && name !== "AVG") {
        return errorResult("#VALUE!", `Unknown function ${name}() — try SUM or AVG`);
      }
      let total = 0;
      let count = 0;
      for (const arg of node.args) {
        if (arg.type === "range") {
          const startRow = Math.min(arg.start.row, arg.end.row);
          const endRow = Math.max(arg.start.row, arg.end.row);
          const startCol = Math.min(arg.start.col, arg.end.col);
          const endCol = Math.max(arg.start.col, arg.end.col);
          if (startRow < 0 || startCol < 0 || endRow >= ROWS || endCol >= COLS) {
            return errorResult("#REF!", "Range extends outside this sheet");
          }
          for (let row = startRow; row <= endRow; row += 1) {
            for (let col = startCol; col <= endCol; col += 1) {
              const item = readCell(cellAddress(row, col));
              if (isError(item)) return item;
              if (item.type === "number") {
                total += item.value;
                count += 1;
              }
            }
          }
        } else {
          const item = evaluateNode(arg, readCell);
          if (isError(item)) return item;
          if (item.type === "number") {
            total += item.value;
            count += 1;
          }
        }
      }
      if (name === "AVG") {
        if (count === 0) return errorResult("#DIV/0!", "AVG has no numeric values to average");
        return numberResult(total / count);
      }
      return numberResult(total);
    }
    default:
      return errorResult("#VALUE!", "Invalid formula expression");
  }
}

/* ------------------------------------------------------------------ */
/* Cycle detection                                                     */
/* ------------------------------------------------------------------ */

function findCycles(formulas) {
  let index = 0;
  const indices = new Map();
  const lowLinks = new Map();
  const stack = [];
  const onStack = new Set();
  const groups = [];

  const strongConnect = (address) => {
    indices.set(address, index);
    lowLinks.set(address, index);
    index += 1;
    stack.push(address);
    onStack.add(address);

    const dependencies = formulas.get(address)?.deps || new Set();
    for (const dep of dependencies) {
      if (!formulas.has(dep)) continue;
      if (!indices.has(dep)) {
        strongConnect(dep);
        lowLinks.set(address, Math.min(lowLinks.get(address), lowLinks.get(dep)));
      } else if (onStack.has(dep)) {
        lowLinks.set(address, Math.min(lowLinks.get(address), indices.get(dep)));
      }
    }

    if (lowLinks.get(address) === indices.get(address)) {
      const component = [];
      let member;
      do {
        member = stack.pop();
        onStack.delete(member);
        component.push(member);
      } while (member !== address);
      const selfReference = formulas.get(address)?.deps?.has(address);
      if (component.length > 1 || selfReference) groups.push(component.sort(compareAddresses));
    }
  };

  for (const address of [...formulas.keys()].sort(compareAddresses)) {
    if (!indices.has(address)) strongConnect(address);
  }
  groups.sort((a, b) => compareAddresses(a[0], b[0]));
  return groups;
}

/* ------------------------------------------------------------------ */
/* Reactive workbook                                                   */
/* ------------------------------------------------------------------ */

function now() {
  return typeof performance !== "undefined" ? performance.now() : Date.now();
}

export class ReactiveWorkbook {
  constructor({ rows = ROWS, cols = COLS, cells = {} } = {}) {
    this.rows = rows;
    this.cols = cols;
    this.raw = new Map();
    this.parsed = new Map();
    this.values = new Map();
    this.dependents = new Map();
    this.cycleGroups = [];
    this.cycleCells = new Set();
    this.lastRecalc = {
      affected: [],
      order: [],
      evaluated: 0,
      durationMs: 0,
      cycleGroups: [],
      timestamp: 0,
      reason: "init",
    };
    this.load(cells);
  }

  load(cells = {}) {
    this.raw.clear();
    this.parsed.clear();
    this.values.clear();
    this.dependents.clear();
    for (const [key, value] of Object.entries(cells || {})) {
      const address = normalizeAddress(key);
      if (!address || typeof value !== "string" || value.length === 0) continue;
      if (!isInGrid(address, this.rows, this.cols)) continue;
      this.raw.set(address, value);
    }
    for (const address of [...this.raw.keys()].sort(compareAddresses)) {
      this.parsed.set(address, this.parseRaw(this.raw.get(address)));
    }
    this.rebuildAllDependents();
    const affected = new Set([...this.raw.keys()]);
    this.recalculate(affected, "load");
    return this.lastRecalc;
  }

  parseRaw(raw) {
    if (raw.startsWith("=")) {
      const source = raw.slice(1);
      try {
        const ast = parseFormula(source);
        return {
          kind: "formula",
          raw,
          ast,
          deps: extractDependencies(ast, this.rows, this.cols),
          parseError: null,
        };
      } catch (error) {
        return {
          kind: "formula",
          raw,
          ast: null,
          deps: new Set(),
          parseError: error.message || "Invalid formula",
        };
      }
    }
    if (NUMBER_RE.test(raw.trim())) {
      const value = Number(raw.trim());
      if (Number.isFinite(value)) return { kind: "number", raw, value };
    }
    return { kind: "text", raw };
  }

  rebuildAllDependents() {
    this.dependents.clear();
    for (const [address, info] of this.parsed) {
      if (info.kind !== "formula") continue;
      for (const dep of info.deps) {
        if (!this.dependents.has(dep)) this.dependents.set(dep, new Set());
        this.dependents.get(dep).add(address);
      }
    }
  }

  removeDependentsFrom(address) {
    const old = this.parsed.get(address);
    if (!old || old.kind !== "formula") return;
    for (const dep of old.deps) {
      const set = this.dependents.get(dep);
      if (set) {
        set.delete(address);
        if (set.size === 0) this.dependents.delete(dep);
      }
    }
  }

  addDependentsFrom(address) {
    const info = this.parsed.get(address);
    if (!info || info.kind !== "formula") return;
    for (const dep of info.deps) {
      if (!this.dependents.has(dep)) this.dependents.set(dep, new Set());
      this.dependents.get(dep).add(address);
    }
  }

  setCells(updates) {
    const entries = updates instanceof Map ? [...updates.entries()] : Object.entries(updates || {});
    const changed = new Set();
    for (const [key, incoming] of entries) {
      const address = normalizeAddress(key);
      if (!address || !isInGrid(address, this.rows, this.cols)) continue;
      const value = incoming == null ? "" : String(incoming);
      const previous = this.raw.get(address) || "";
      if (previous === value) continue;
      changed.add(address);
      this.removeDependentsFrom(address);
      if (value === "") {
        this.raw.delete(address);
        this.parsed.delete(address);
      } else {
        this.raw.set(address, value);
        const info = this.parseRaw(value);
        this.parsed.set(address, info);
        this.addDependentsFrom(address);
      }
    }

    if (changed.size === 0) {
      return { ...this.lastRecalc, affected: [], order: [], evaluated: 0, durationMs: 0, reason: "noop" };
    }

    const affected = new Set(changed);
    const queue = [...changed];
    while (queue.length > 0) {
      const address = queue.shift();
      for (const dependent of this.dependents.get(address) || []) {
        if (!affected.has(dependent)) {
          affected.add(dependent);
          queue.push(dependent);
        }
      }
    }
    this.recalculate(affected, "edit");
    return this.lastRecalc;
  }

  recalculate(affected, reason) {
    const started = now();
    this.cycleGroups = findCycles(
      new Map([...this.parsed].filter(([, info]) => info.kind === "formula")),
    );
    this.cycleCells = new Set(this.cycleGroups.flat());

    // Every member of every active cycle is poisoned, including cells outside
    // the current cascade (they were already poisoned by a previous edit).
    for (const address of this.cycleCells) {
      this.values.set(address, errorResult("#CYCLE!", "Circular reference"));
    }

    const done = new Set();
    const visiting = new Set();
    const order = [];

    const visit = (address) => {
      if (done.has(address)) return;
      if (visiting.has(address)) return;
      visiting.add(address);
      const info = this.parsed.get(address);
      if (!info) {
        this.values.set(address, emptyResult());
      } else if (info.kind !== "formula") {
        if (info.kind === "number") this.values.set(address, numberResult(info.value));
        else this.values.set(address, textResult(info.raw));
      } else if (this.cycleCells.has(address)) {
        this.values.set(address, errorResult("#CYCLE!", "Circular reference"));
      } else if (info.parseError) {
        this.values.set(address, errorResult("#VALUE!", info.parseError));
      } else {
        // Literal cells in the cascade must be materialized before dependent
        // formulas read them, not merely formula dependencies. Visit every
        // affected input in dependency order.
        for (const dep of info.deps) {
          if (affected.has(dep) && !this.cycleCells.has(dep)) visit(dep);
        }
        const readCell = (cell) => this.values.get(cell) || emptyResult();
        const result = evaluateNode(info.ast, readCell);
        this.values.set(address, result.type === "empty" ? numberResult(0) : result);
      }
      visiting.delete(address);
      done.add(address);
      order.push(address);
    };

    for (const address of [...affected].sort(compareAddresses)) visit(address);

    const durationMs = Math.round((now() - started) * 1000) / 1000;
    const evaluated = order.filter((address) => this.parsed.get(address)?.kind === "formula").length;
    this.lastRecalc = {
      affected: [...affected].sort(compareAddresses),
      order,
      evaluated,
      durationMs,
      cycleGroups: this.cycleGroups.map((group) => [...group]),
      cycleCells: [...this.cycleCells].sort(compareAddresses),
      timestamp: Date.now(),
      reason,
      skipped: this.rows * this.cols - affected.size,
    };
  }

  getRaw(address) {
    return this.raw.get(address) ?? "";
  }

  getResult(address) {
    return this.values.get(address) || emptyResult();
  }

  getKind(address) {
    return this.parsed.get(address)?.kind || "empty";
  }

  getParseError(address) {
    return this.parsed.get(address)?.parseError || null;
  }

  getDependencies(address) {
    const info = this.parsed.get(address);
    if (!info || info.kind !== "formula") return [];
    return [...info.deps].sort(compareAddresses);
  }

  getDependents(address) {
    return [...(this.dependents.get(address) || [])].sort(compareAddresses);
  }

  getCycleGroupFor(address) {
    return this.cycleGroups.find((group) => group.includes(address)) || null;
  }

  isCycleCell(address) {
    return this.cycleCells.has(address);
  }

  getStats() {
    let formulas = 0;
    let numbers = 0;
    let text = 0;
    let errors = 0;
    let links = 0;
    for (const [address, info] of this.parsed) {
      if (info.kind === "formula") {
        formulas += 1;
        links += info.deps.size;
      } else if (info.kind === "number") numbers += 1;
      else text += 1;
      if (this.getResult(address).type === "error") errors += 1;
    }
    return {
      rows: this.rows,
      cols: this.cols,
      nonEmpty: this.raw.size,
      formulas,
      numbers,
      text,
      errors,
      links,
      cycles: this.cycleCells.size,
    };
  }

  getTrace(address, direction, depth = 8) {
    const seen = new Set();
    const collect = (current, level) => {
      const neighbors = direction === "up" ? this.getDependencies(current) : this.getDependents(current);
      return neighbors
        .filter((cell) => !seen.has(cell))
        .map((cell) => {
          seen.add(cell);
          return {
            address: cell,
            depth: level,
            result: this.getResult(cell),
            raw: this.getRaw(cell),
            next: level < depth ? collect(cell, level + 1) : [],
          };
        });
    };
    return collect(address, 1);
  }

  toJSON() {
    const cells = {};
    for (const address of [...this.raw.keys()].sort(compareAddresses)) {
      cells[address] = this.raw.get(address);
    }
    return cells;
  }
}

export function formatNumber(value) {
  if (!Number.isFinite(value)) return String(value);
  if (Object.is(value, -0)) return "0";
  const absolute = Math.abs(value);
  if (absolute !== 0 && (absolute >= 1e12 || absolute < 1e-9)) return value.toExponential(6).replace(/\.?0+e/, "e");
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 10, useGrouping: true }).format(value);
}

export function formatResult(result) {
  if (!result) return "";
  if (result.type === "empty") return "";
  if (result.type === "number") return formatNumber(result.value);
  if (result.type === "text") return result.value;
  if (result.type === "error") return result.error;
  return "";
}
