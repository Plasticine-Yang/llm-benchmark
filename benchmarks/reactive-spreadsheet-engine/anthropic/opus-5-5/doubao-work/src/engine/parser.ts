// Hand-written tokenizer + recursive-descent parser for spreadsheet formulas.
//
// Grammar (lowest -> highest precedence):
//   comparison := additive (( '=' | '<>' | '<' | '>' | '<=' | '>=' ) additive)*
//   concat     := additive ( '&' additive )*
//   additive   := term (( '+' | '-' ) term)*
//   term       := power (( '*' | '/' ) power)*
//   power      := unary ( '^' unary )*          (left-associative, like Excel)
//   unary      := ( '+' | '-' ) unary | primary
//   primary    := NUMBER | STRING | BOOL | ERROR | REF [':' REF]
//               | IDENT '(' [comparison (',' comparison)*] ')' | '(' comparison ')'

import { parseAddr, inBounds, toAddr } from './address';

export type ErrorCode = '#DIV/0!' | '#REF!' | '#VALUE!' | '#CYCLE!' | '#NAME?' | '#ERROR!';
export const ERROR_CODES: readonly ErrorCode[] = ['#DIV/0!', '#REF!', '#VALUE!', '#CYCLE!', '#NAME?', '#ERROR!'];

export type TokenType = 'num' | 'str' | 'ref' | 'ident' | 'op' | 'lparen' | 'rparen' | 'comma' | 'colon' | 'error';

export interface Token {
  type: TokenType;
  value: string;
  start: number; // offset in the source expression
  end: number;
}

export class FormulaSyntaxError extends Error {}

const REF_RE = /^\$?[A-Za-z]{1,3}\$?[0-9]+/;
const IDENT_RE = /^[A-Za-z_][A-Za-z0-9_.]*/;
const NUM_RE = /^(?:[0-9]+(?:\.[0-9]*)?|\.[0-9]+)(?:[eE][+-]?[0-9]+)?/;

export function tokenize(src: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < src.length) {
    const ch = src[i];
    if (ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r') {
      i++;
      continue;
    }
    const rest = src.slice(i);
    // Error literal such as #REF! (produced when shifting references off-grid).
    if (ch === '#') {
      const code = ERROR_CODES.find((c) => rest.toUpperCase().startsWith(c));
      if (!code) throw new FormulaSyntaxError(`Unexpected '#' at ${i}`);
      tokens.push({ type: 'error', value: code, start: i, end: i + code.length });
      i += code.length;
      continue;
    }
    const num = NUM_RE.exec(rest);
    if (num) {
      tokens.push({ type: 'num', value: num[0], start: i, end: i + num[0].length });
      i += num[0].length;
      continue;
    }
    if (ch === '"') {
      let j = i + 1;
      let out = '';
      for (;;) {
        if (j >= src.length) throw new FormulaSyntaxError('Unterminated string literal');
        if (src[j] === '"') {
          if (src[j + 1] === '"') {
            out += '"';
            j += 2;
            continue;
          }
          break;
        }
        out += src[j++];
      }
      tokens.push({ type: 'str', value: out, start: i, end: j + 1 });
      i = j + 1;
      continue;
    }
    const ref = REF_RE.exec(rest);
    if (ref) {
      // Something like LOG10( is a function name, not a reference.
      const after = rest.slice(ref[0].length);
      const isFunc = /^\s*\(/.test(after) && !ref[0].includes('$');
      const continuesIdent = /^[A-Za-z0-9_.]/.test(after);
      if (!isFunc && !continuesIdent) {
        tokens.push({ type: 'ref', value: ref[0].toUpperCase(), start: i, end: i + ref[0].length });
        i += ref[0].length;
        continue;
      }
    }
    const ident = IDENT_RE.exec(rest);
    if (ident) {
      tokens.push({ type: 'ident', value: ident[0].toUpperCase(), start: i, end: i + ident[0].length });
      i += ident[0].length;
      continue;
    }
    const two = rest.slice(0, 2);
    if (two === '<>' || two === '<=' || two === '>=') {
      tokens.push({ type: 'op', value: two, start: i, end: i + 2 });
      i += 2;
      continue;
    }
    if ('+-*/^=<>&'.includes(ch)) {
      tokens.push({ type: 'op', value: ch, start: i, end: i + 1 });
      i++;
      continue;
    }
    if (ch === '(') tokens.push({ type: 'lparen', value: ch, start: i, end: i + 1 });
    else if (ch === ')') tokens.push({ type: 'rparen', value: ch, start: i, end: i + 1 });
    else if (ch === ',' || ch === ';') tokens.push({ type: 'comma', value: ',', start: i, end: i + 1 });
    else if (ch === ':') tokens.push({ type: 'colon', value: ch, start: i, end: i + 1 });
    else throw new FormulaSyntaxError(`Unexpected character '${ch}' at ${i}`);
    i++;
  }
  return tokens;
}

// ---------------------------------------------------------------- AST

export interface RefInfo {
  text: string; // as written, without $ (e.g. "B3")
  row: number;
  col: number;
  valid: boolean; // inside the grid
  addr: string; // canonical address (only meaningful when valid)
}

export type Node =
  | { kind: 'num'; value: number }
  | { kind: 'str'; value: string }
  | { kind: 'bool'; value: boolean }
  | { kind: 'error'; code: ErrorCode }
  | { kind: 'ref'; ref: RefInfo }
  | { kind: 'range'; from: RefInfo; to: RefInfo }
  | { kind: 'unary'; op: string; arg: Node }
  | { kind: 'binary'; op: string; left: Node; right: Node }
  | { kind: 'call'; name: string; args: Node[] };

function refInfo(tokenValue: string): RefInfo {
  const text = tokenValue.replace(/\$/g, '');
  const c = parseAddr(text);
  if (!c) return { text, row: -1, col: -1, valid: false, addr: text };
  const valid = inBounds(c.row, c.col);
  return { text, row: c.row, col: c.col, valid, addr: valid ? toAddr(c.row, c.col) : text };
}

export function parseFormula(expr: string): Node {
  const tokens = tokenize(expr);
  let pos = 0;
  const peek = (): Token | undefined => tokens[pos];
  const next = (): Token => {
    const t = tokens[pos++];
    if (!t) throw new FormulaSyntaxError('Unexpected end of formula');
    return t;
  };
  const isOp = (...ops: string[]) => {
    const t = peek();
    return !!t && t.type === 'op' && ops.includes(t.value);
  };

  function comparison(): Node {
    let left = concat();
    while (isOp('=', '<>', '<', '>', '<=', '>=')) {
      const op = next().value;
      left = { kind: 'binary', op, left, right: concat() };
    }
    return left;
  }
  function concat(): Node {
    let left = additive();
    while (isOp('&')) {
      next();
      left = { kind: 'binary', op: '&', left, right: additive() };
    }
    return left;
  }
  function additive(): Node {
    let left = term();
    while (isOp('+', '-')) {
      const op = next().value;
      left = { kind: 'binary', op, left, right: term() };
    }
    return left;
  }
  function term(): Node {
    let left = power();
    while (isOp('*', '/')) {
      const op = next().value;
      left = { kind: 'binary', op, left, right: power() };
    }
    return left;
  }
  // Excel semantics: negation binds tighter than '^' (-2^2 = 4) and '^' is left-associative (2^3^2 = 64).
  function power(): Node {
    let left = unary();
    while (isOp('^')) {
      next();
      left = { kind: 'binary', op: '^', left, right: unary() };
    }
    return left;
  }
  function unary(): Node {
    if (isOp('+', '-')) {
      const op = next().value;
      return { kind: 'unary', op, arg: unary() };
    }
    return primary();
  }
  function primary(): Node {
    const t = next();
    switch (t.type) {
      case 'num':
        return { kind: 'num', value: parseFloat(t.value) };
      case 'str':
        return { kind: 'str', value: t.value };
      case 'error':
        return { kind: 'error', code: t.value as ErrorCode };
      case 'ref': {
        const from = refInfo(t.value);
        const p = peek();
        if (p && p.type === 'colon') {
          next();
          const t2 = next();
          if (t2.type !== 'ref') throw new FormulaSyntaxError('Expected a cell reference after ":"');
          return { kind: 'range', from, to: refInfo(t2.value) };
        }
        return { kind: 'ref', ref: from };
      }
      case 'ident': {
        const p = peek();
        if (p && p.type === 'lparen') {
          next();
          const args: Node[] = [];
          if (peek()?.type !== 'rparen') {
            for (;;) {
              args.push(comparison());
              const sep = next();
              if (sep.type === 'rparen') break;
              if (sep.type !== 'comma') throw new FormulaSyntaxError('Expected "," or ")" in argument list');
            }
          } else {
            next();
          }
          return { kind: 'call', name: t.value, args };
        }
        if (t.value === 'TRUE' || t.value === 'FALSE') return { kind: 'bool', value: t.value === 'TRUE' };
        // Unknown bare identifier (e.g. a typo) -> #NAME? at evaluation.
        return { kind: 'call', name: `#NAME:${t.value}`, args: [] };
      }
      case 'lparen': {
        const inner = comparison();
        const close = next();
        if (close.type !== 'rparen') throw new FormulaSyntaxError('Missing ")"');
        return inner;
      }
      default:
        throw new FormulaSyntaxError(`Unexpected token '${t.value}'`);
    }
  }

  if (tokens.length === 0) throw new FormulaSyntaxError('Empty formula');
  const ast = comparison();
  if (pos < tokens.length) throw new FormulaSyntaxError(`Unexpected token '${tokens[pos].value}'`);
  return ast;
}

/** Expands a range node into canonical in-grid addresses, or null if any corner is off-grid. */
export function expandRange(from: RefInfo, to: RefInfo): string[] | null {
  if (!from.valid || !to.valid) return null;
  const r0 = Math.min(from.row, to.row);
  const r1 = Math.max(from.row, to.row);
  const c0 = Math.min(from.col, to.col);
  const c1 = Math.max(from.col, to.col);
  const out: string[] = [];
  for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) out.push(toAddr(r, c));
  return out;
}

/** All cell addresses (in-grid) a formula AST reads from. */
export function collectReferences(node: Node, out: Set<string> = new Set()): Set<string> {
  switch (node.kind) {
    case 'ref':
      if (node.ref.valid) out.add(node.ref.addr);
      break;
    case 'range': {
      const cells = expandRange(node.from, node.to);
      if (cells) cells.forEach((a) => out.add(a));
      break;
    }
    case 'unary':
      collectReferences(node.arg, out);
      break;
    case 'binary':
      collectReferences(node.left, out);
      collectReferences(node.right, out);
      break;
    case 'call':
      node.args.forEach((a) => collectReferences(a, out));
      break;
  }
  return out;
}

/**
 * Rewrites relative references in a formula when it is pasted dRow/dCol cells away
 * (Excel semantics: $ marks an absolute row/column). Off-grid results become #REF!.
 */
export function shiftFormula(raw: string, dRow: number, dCol: number): string {
  if (!raw.startsWith('=') || (dRow === 0 && dCol === 0)) return raw;
  const expr = raw.slice(1);
  let tokens: Token[];
  try {
    tokens = tokenize(expr);
  } catch {
    return raw;
  }
  let out = '';
  let last = 0;
  for (const t of tokens) {
    if (t.type !== 'ref') continue;
    const original = expr.slice(t.start, t.end);
    const m = /^(\$?)([A-Za-z]+)(\$?)([0-9]+)$/.exec(original);
    if (!m) continue;
    const c = parseAddr(m[2] + m[4]);
    if (!c) continue;
    const col = m[1] ? c.col : c.col + dCol;
    const row = m[3] ? c.row : c.row + dRow;
    let replacement: string;
    if (row < 0 || col < 0 || !inBounds(row, col)) replacement = '#REF!';
    else {
      const a = toAddr(row, col);
      const letters = a.replace(/[0-9]+$/, '');
      replacement = `${m[1]}${letters}${m[3]}${row + 1}`;
    }
    out += expr.slice(last, t.start) + replacement;
    last = t.end;
  }
  out += expr.slice(last);
  return '=' + out;
}
