import { ERRORS, FormulaSyntaxError } from './errors.js';

const CELL_RE = /^\$?[A-Za-z]{1,3}\$?[0-9]{1,5}$/;
const ERROR_LITERALS = new Map(Object.values(ERRORS).map((code) => [code.toUpperCase(), code]));
const OPERATORS = new Set(['+', '-', '*', '/', '^', '&', '=', '<', '>', '<=', '>=', '<>']);

export function tokenize(input) {
  const tokens = [];
  let i = 0;
  const src = String(input);

  while (i < src.length) {
    const ch = src[i];

    if (ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r') {
      i += 1;
      continue;
    }

    if (ch >= '0' && ch <= '9') {
      const start = i;
      while (i < src.length && src[i] >= '0' && src[i] <= '9') i += 1;
      if (src[i] === '.') {
        i += 1;
        while (i < src.length && src[i] >= '0' && src[i] <= '9') i += 1;
      }
      if (src[i] === 'e' || src[i] === 'E') {
        const save = i;
        i += 1;
        if (src[i] === '+' || src[i] === '-') i += 1;
        if (src[i] >= '0' && src[i] <= '9') {
          while (i < src.length && src[i] >= '0' && src[i] <= '9') i += 1;
        } else {
          i = save;
        }
      }
      tokens.push({ type: 'number', value: Number(src.slice(start, i)), pos: start });
      continue;
    }

    if (ch === '"') {
      const start = i;
      i += 1;
      let out = '';
      while (i < src.length) {
        if (src[i] === '"') {
          if (src[i + 1] === '"') {
            out += '"';
            i += 2;
            continue;
          }
          i += 1;
          break;
        }
        out += src[i];
        i += 1;
      }
      tokens.push({ type: 'string', value: out, pos: start });
      continue;
    }

    if (ch === '#') {
      const start = i;
      i += 1;
      while (i < src.length && /[A-Za-z0-9/!?]/.test(src[i])) i += 1;
      const literal = src.slice(start, i).toUpperCase();
      const code = ERROR_LITERALS.get(literal);
      if (!code) throw new FormulaSyntaxError(`Unknown error literal "${src.slice(start, i)}"`);
      tokens.push({ type: 'error', value: code, pos: start });
      continue;
    }

    if (/[A-Za-z_$]/.test(ch)) {
      const start = i;
      while (i < src.length && /[A-Za-z0-9_.$]/.test(src[i])) i += 1;
      const text = src.slice(start, i);
      const upper = text.toUpperCase();
      if (CELL_RE.test(text)) {
        tokens.push({ type: 'cell', value: text, pos: start });
      } else if (upper === 'TRUE' || upper === 'FALSE') {
        tokens.push({ type: 'bool', value: upper === 'TRUE', pos: start });
      } else {
        tokens.push({ type: 'ident', value: text, pos: start });
      }
      continue;
    }

    if (ch === '(' || ch === ')' || ch === ',' || ch === ':' || ch === ';') {
      tokens.push({ type: ch === ';' ? ',' : ch, value: ch, pos: i });
      i += 1;
      continue;
    }

    const two = src.slice(i, i + 2);
    if (OPERATORS.has(two)) {
      tokens.push({ type: 'op', value: two, pos: i });
      i += 2;
      continue;
    }
    if (OPERATORS.has(ch)) {
      tokens.push({ type: 'op', value: ch, pos: i });
      i += 1;
      continue;
    }

    throw new FormulaSyntaxError(`Unexpected character "${ch}" at position ${i}`);
  }

  tokens.push({ type: 'eof', value: null, pos: src.length });
  return tokens;
}