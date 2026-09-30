/**
 * Tokenizer + recursive-descent/precedence-climbing parser for spreadsheet
 * formulas. Written from scratch; no external parser library.
 *
 * Grammar (lowest to highest precedence):
 *   comparison  =  <>  <  <=  >  >=
 *   concat      &
 *   additive    +  -
 *   multiplicative * /
 *   unary       -x  +x
 *   power       ^   (right associative)
 *   postfix     %
 *   primary     number | "text" | A1 | A1:B2 | FUNC(args) | ( expr ) | error literal
 */
import { ERR } from './errors.js';
import { parseRef, expandRange } from './refs.js';

const NUM_RE = /^(?:\d+(?:\.\d+)?|\.\d+)(?:[eE][+-]?\d+)?/;
const REF_RE = /^\$?[A-Za-z]{1,3}\$?\d{1,7}/;
const NAME_RE = /^[A-Za-z_][A-Za-z0-9_.]*/;
const ERROR_LIT_RE = /^#[A-Z0-9/]+!?/;
const TWO_CHAR_OPS = ['<=', '>=', '<>'];
const ONE_CHAR_OPS = '+-*/^%()&,:=<>';

class FormulaError extends Error {
  constructor(code) {
    super(code);
    this.code = code;
  }
}

/** Split a formula body (without the leading "=") into tokens. */
export function tokenize(src) {
  const tokens = [];
  let i = 0;
  const n = src.length;

  while (i < n) {
    const ch = src[i];

    // whitespace is insignificant between tokens
    if (ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r') {
      i += 1;
      continue;
    }

    // string literal, "" escapes a quote
    if (ch === '"') {
      let out = '';
      let j = i + 1;
      let closed = false;
      while (j < n) {
        if (src[j] === '"') {
          if (src[j + 1] === '"') {
            out += '"';
            j += 2;
            continue;
          }
          closed = true;
          j += 1;
          break;
        }
        out += src[j];
        j += 1;
      }
      if (!closed) throw new FormulaError(ERR.PARSE);
      tokens.push({ type: 'str', value: out });
      i = j;
      continue;
    }

    // error literal such as #REF! or #DIV/0!
    if (ch === '#') {
      const m = ERROR_LIT_RE.exec(src.slice(i));
      if (!m) throw new FormulaError(ERR.PARSE);
      tokens.push({ type: 'err', value: m[0].toUpperCase() });
      i += m[0].length;
      continue;
    }

    // number (never starts a reference, so it is safe to try first)
    if (/[0-9]/.test(ch) || (ch === '.' && /[0-9]/.test(src[i + 1] || ''))) {
      const m = NUM_RE.exec(src.slice(i));
      if (!m) throw new FormulaError(ERR.PARSE);
      tokens.push({ type: 'num', value: Number(m[0]) });
      i += m[0].length;
      continue;
    }

    // reference or function name
    if (/[A-Za-z_$]/.test(ch)) {
      const refMatch = ch === '$' || /[A-Za-z]/.test(ch) ? REF_RE.exec(src.slice(i)) : null;
      const afterRef = refMatch ? src[i + refMatch[0].length] : '';
      // "LOG10(" is a function, not the cell LOG10
      if (refMatch && afterRef !== '(') {
        const parsed = parseRef(refMatch[0]);
        if (!parsed) throw new FormulaError(ERR.REF);
        i += refMatch[0].length;
        // range?
        if (src[i] === ':') {
          const r2 = REF_RE.exec(src.slice(i + 1));
          if (!r2) throw new FormulaError(ERR.REF);
          const parsed2 = parseRef(r2[0]);
          if (!parsed2) throw new FormulaError(ERR.REF);
          if (!expandRange(parsed.ref, parsed2.ref)) throw new FormulaError(ERR.REF);
          tokens.push({ type: 'range', from: parsed.ref, to: parsed2.ref });
          i += 1 + r2[0].length;
        } else {
          tokens.push({ type: 'ref', value: parsed.ref });
        }
        continue;
      }

      const m = NAME_RE.exec(src.slice(i));
      if (!m) throw new FormulaError(ERR.PARSE);
      const name = m[0];
      i += name.length;
      // "AAAA1" / "A0"-like identifiers that obviously meant a reference
      if (/^[A-Za-z]{1,5}\d{1,7}$/.test(name)) throw new FormulaError(ERR.REF);
      tokens.push({ type: 'name', value: name.toUpperCase() });
      continue;
    }

    // operators
    const two = src.slice(i, i + 2);
    if (TWO_CHAR_OPS.includes(two)) {
      tokens.push({ type: 'op', value: two });
      i += 2;
      continue;
    }
    if (ONE_CHAR_OPS.includes(ch)) {
      tokens.push({ type: 'op', value: ch });
      i += 1;
      continue;
    }

    throw new FormulaError(ERR.PARSE);
  }

  tokens.push({ type: 'eof', value: '' });
  return tokens;
}

const BIN_PREC = {
  '=': 1, '<>': 1, '<': 1, '<=': 1, '>': 1, '>=': 1,
  '&': 2,
  '+': 3, '-': 3,
  '*': 4, '/': 4,
  '^': 6,
};
const RIGHT_ASSOC = new Set(['^']);
const UNARY_PREC = 5;
const POSTFIX_PREC = 7;

class Parser {
  constructor(tokens) {
    this.tokens = tokens;
    this.i = 0;
    this.precedents = new Set();
  }

  peek(k = 0) {
    return this.tokens[this.i + k] || { type: 'eof', value: '' };
  }

  next() {
    const t = this.tokens[this.i] || { type: 'eof', value: '' };
    this.i += 1;
    return t;
  }

  isOp(value) {
    const t = this.peek();
    return t.type === 'op' && t.value === value;
  }

  expectOp(value) {
    if (!this.isOp(value)) throw new FormulaError(ERR.PARSE);
    this.next();
  }

  addPrecedent(ref) {
    this.precedents.add(ref);
  }

  parseProgram() {
    const ast = this.parseExpr(0);
    if (this.peek().type !== 'eof') throw new FormulaError(ERR.PARSE);
    return ast;
  }

  parseExpr(minPrec) {
    let left = this.parseUnary();

    for (;;) {
      const t = this.peek();
      if (t.type !== 'op') break;

      // postfix percent
      if (t.value === '%' && POSTFIX_PREC >= minPrec) {
        this.next();
        left = { t: 'post', op: '%', arg: left };
        continue;
      }

      const prec = BIN_PREC[t.value];
      if (prec === undefined || prec < minPrec) break;
      this.next();
      const nextMin = RIGHT_ASSOC.has(t.value) ? prec : prec + 1;
      const right = this.parseExpr(nextMin);
      left = { t: 'bin', op: t.value, l: left, r: right };
    }
    return left;
  }

  parseUnary() {
    const t = this.peek();
    if (t.type === 'op' && (t.value === '-' || t.value === '+')) {
      this.next();
      const arg = this.parseExpr(UNARY_PREC);
      return { t: 'un', op: t.value, arg };
    }
    return this.parsePrimary();
  }

  parsePrimary() {
    const t = this.next();

    if (t.type === 'num') return { t: 'num', v: t.value };
    if (t.type === 'str') return { t: 'str', v: t.value };
    if (t.type === 'err') return { t: 'errlit', v: t.value };
    if (t.type === 'ref') {
      this.addPrecedent(t.value);
      return { t: 'ref', ref: t.value };
    }
    if (t.type === 'range') {
      const cells = expandRange(t.from, t.to);
      if (!cells) throw new FormulaError(ERR.REF);
      for (const c of cells) this.addPrecedent(c);
      return { t: 'range', from: t.from, to: t.to };
    }
    if (t.type === 'name') {
      if (this.isOp('(')) {
        this.next();
        const args = [];
        if (!this.isOp(')')) {
          for (;;) {
            args.push(this.parseExpr(0));
            if (this.isOp(',')) {
              this.next();
              continue;
            }
            break;
          }
        }
        this.expectOp(')');
        return { t: 'call', name: t.value, args };
      }
      throw new FormulaError(ERR.NAME);
    }
    if (t.type === 'op' && t.value === '(') {
      const inner = this.parseExpr(0);
      this.expectOp(')');
      return inner;
    }
    throw new FormulaError(ERR.PARSE);
  }
}

/**
 * Parse a formula body (the text after "=").
 * @returns {{ast: object|null, precedents: Set<string>, error: string|null}}
 */
export function parseFormula(body) {
  try {
    const tokens = tokenize(body);
    const parser = new Parser(tokens);
    const ast = parser.parseProgram();
    return { ast, precedents: parser.precedents, error: null };
  } catch (e) {
    const code = e instanceof FormulaError ? e.code : ERR.PARSE;
    return { ast: null, precedents: new Set(), error: code };
  }
}

/** Precedents of a formula *source* without keeping the AST (used for tests). */
export function precedentsOf(body) {
  return parseFormula(body).precedents;
}

export { FormulaError };
