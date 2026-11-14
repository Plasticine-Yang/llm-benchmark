/** Hand-written tokenizer for the formula language. */

export class FormulaSyntaxError extends Error {
  constructor(message, code = '#PARSE!') {
    super(message);
    this.name = 'FormulaSyntaxError';
    this.code = code;
  }
}

const OPERATORS = new Set(['+', '-', '*', '/', '^', '(', ')', ',', ':']);

export function tokenize(input) {
  const src = String(input);
  const tokens = [];
  let i = 0;

  while (i < src.length) {
    const ch = src[i];

    if (/\s/.test(ch)) {
      i++;
      continue;
    }

    if (/[0-9.]/.test(ch)) {
      const m = /^(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?/.exec(src.slice(i));
      if (!m) throw new FormulaSyntaxError(`无法解析数字（位置 ${i}）`);
      tokens.push({ type: 'number', value: Number(m[0]), pos: i });
      i += m[0].length;
      continue;
    }

    if (/[A-Za-z_$]/.test(ch)) {
      const m = /^[A-Za-z_$][A-Za-z0-9_$]*/.exec(src.slice(i));
      // Uppercase so identifiers such as a1 / sum / $a$1 behave like Excel.
      tokens.push({ type: 'ident', value: m[0].toUpperCase(), pos: i });
      i += m[0].length;
      continue;
    }

    if (ch === '"') {
      let j = i + 1;
      let value = '';
      let closed = false;
      while (j < src.length) {
        if (src[j] === '"') {
          if (src[j + 1] === '"') {
            value += '"';
            j += 2;
            continue;
          }
          j++;
          closed = true;
          break;
        }
        value += src[j++];
      }
      if (!closed) throw new FormulaSyntaxError('字符串常量缺少结束引号');
      tokens.push({ type: 'string', value, pos: i });
      i = j;
      continue;
    }

    if (OPERATORS.has(ch)) {
      tokens.push({ type: 'op', value: ch, pos: i });
      i++;
      continue;
    }

    throw new FormulaSyntaxError(`非法字符 "${ch}"（位置 ${i}）`);
  }

  tokens.push({ type: 'eof', value: '', pos: i });
  return tokens;
}
