import {
  colIndexToLetter,
  compareCellIds,
  expandRangeIds,
  isCoordInBounds,
  parseCellRef,
  ParsedCellRef,
} from './coords.js';
import {
  DEFAULT_COLS,
  DEFAULT_ROWS,
  GridDimensions,
  SpreadsheetErrorCode,
} from './types.js';

export type TokenType =
  | 'NUMBER'
  | 'STRING'
  | 'ERROR'
  | 'CELL_REF'
  | 'IDENT'
  | 'PLUS'
  | 'MINUS'
  | 'STAR'
  | 'SLASH'
  | 'LPAREN'
  | 'RPAREN'
  | 'COLON'
  | 'COMMA'
  | 'EOF';

export interface Token {
  type: TokenType;
  value: string;
  start: number;
  end: number;
  numValue?: number;
}

export type ASTNode =
  | { kind: 'Number'; value: number }
  | { kind: 'String'; value: string }
  | { kind: 'Error'; code: SpreadsheetErrorCode; detail: string }
  | { kind: 'CellRef'; ref: ParsedCellRef }
  | { kind: 'Range'; start: ParsedCellRef; end: ParsedCellRef }
  | { kind: 'Unary'; op: '+' | '-'; operand: ASTNode }
  | { kind: 'Binary'; op: '+' | '-' | '*' | '/'; left: ASTNode; right: ASTNode }
  | { kind: 'Call'; name: string; args: ASTNode[] };

export type ParseResult =
  | { ok: true; ast: ASTNode; dependencies: string[] }
  | { ok: false; error: SpreadsheetErrorCode; detail: string; dependencies: string[] };

export class FormulaSyntaxError extends Error {
  readonly code: SpreadsheetErrorCode;
  constructor(detail: string, code: SpreadsheetErrorCode = '#VALUE!') {
    super(detail);
    this.code = code;
  }
}

const CELL_REF_LOOKAHEAD = /^\$?[A-Za-z]+\$?[0-9]+(?![A-Za-z0-9_(])/;
const ERROR_LOOKAHEAD = /^#(DIV\/0!|REF!|VALUE!|CYCLE!)/i;
const IDENT_LOOKAHEAD = /^[A-Za-z_][A-Za-z0-9_]*/;
const NUMBER_LOOKAHEAD = /^(?:[0-9]+(?:\.[0-9]*)?|\.[0-9]+)(?:[eE][+-]?[0-9]+)?/;

export function tokenizeFormula(expr: string): Token[] {
  const tokens: Token[] = [];
  let pos = 0;

  while (pos < expr.length) {
    const ch = expr[pos];

    if (ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r') {
      pos++;
      continue;
    }

    if (ch === '+') {
      tokens.push({ type: 'PLUS', value: '+', start: pos, end: pos + 1 });
      pos++;
      continue;
    }
    if (ch === '-') {
      tokens.push({ type: 'MINUS', value: '-', start: pos, end: pos + 1 });
      pos++;
      continue;
    }
    if (ch === '*') {
      tokens.push({ type: 'STAR', value: '*', start: pos, end: pos + 1 });
      pos++;
      continue;
    }
    if (ch === '/') {
      tokens.push({ type: 'SLASH', value: '/', start: pos, end: pos + 1 });
      pos++;
      continue;
    }
    if (ch === '(') {
      tokens.push({ type: 'LPAREN', value: '(', start: pos, end: pos + 1 });
      pos++;
      continue;
    }
    if (ch === ')') {
      tokens.push({ type: 'RPAREN', value: ')', start: pos, end: pos + 1 });
      pos++;
      continue;
    }
    if (ch === ':') {
      tokens.push({ type: 'COLON', value: ':', start: pos, end: pos + 1 });
      pos++;
      continue;
    }
    if (ch === ',') {
      tokens.push({ type: 'COMMA', value: ',', start: pos, end: pos + 1 });
      pos++;
      continue;
    }

    if (ch === '"') {
      const start = pos;
      pos++;
      let str = '';
      let closed = false;
      while (pos < expr.length) {
        const c = expr[pos];
        if (c === '\\' && pos + 1 < expr.length) {
          str += expr[pos + 1];
          pos += 2;
          continue;
        }
        if (c === '"') {
          if (pos + 1 < expr.length && expr[pos + 1] === '"') {
            str += '"';
            pos += 2;
            continue;
          }
          closed = true;
          pos++;
          break;
        }
        str += c;
        pos++;
      }
      if (!closed) {
        throw new FormulaSyntaxError('Unterminated string literal in formula');
      }
      tokens.push({ type: 'STRING', value: str, start, end: pos });
      continue;
    }

    const slice = expr.slice(pos);

    if (ch === '#') {
      const errMatch = ERROR_LOOKAHEAD.exec(slice);
      if (!errMatch) {
        throw new FormulaSyntaxError(`Unrecognized error token near "${slice.slice(0, 10)}"`);
      }
      const rawErr = errMatch[0].toUpperCase() as SpreadsheetErrorCode;
      tokens.push({
        type: 'ERROR',
        value: rawErr,
        start: pos,
        end: pos + errMatch[0].length,
      });
      pos += errMatch[0].length;
      continue;
    }

    if ((ch >= '0' && ch <= '9') || (ch === '.' && pos + 1 < expr.length && expr[pos + 1] >= '0' && expr[pos + 1] <= '9')) {
      const numMatch = NUMBER_LOOKAHEAD.exec(slice);
      if (!numMatch) {
        throw new FormulaSyntaxError(`Invalid numeric literal near "${slice.slice(0, 10)}"`);
      }
      const numText = numMatch[0];
      const numValue = Number(numText);
      if (!Number.isFinite(numValue)) {
        throw new FormulaSyntaxError(`Numeric literal out of range: ${numText}`);
      }
      tokens.push({
        type: 'NUMBER',
        value: numText,
        start: pos,
        end: pos + numText.length,
        numValue,
      });
      pos += numText.length;
      continue;
    }

    const cellMatch = CELL_REF_LOOKAHEAD.exec(slice);
    if (cellMatch) {
      const text = cellMatch[0];
      tokens.push({
        type: 'CELL_REF',
        value: text,
        start: pos,
        end: pos + text.length,
      });
      pos += text.length;
      continue;
    }

    const identMatch = IDENT_LOOKAHEAD.exec(slice);
    if (identMatch) {
      const text = identMatch[0];
      tokens.push({
        type: 'IDENT',
        value: text.toUpperCase(),
        start: pos,
        end: pos + text.length,
      });
      pos += text.length;
      continue;
    }

    throw new FormulaSyntaxError(`Unexpected character "${ch}" at position ${pos + 1}`);
  }

  tokens.push({ type: 'EOF', value: '', start: expr.length, end: expr.length });
  return tokens;
}

class RecursiveDescentParser {
  private readonly tokens: Token[];
  private readonly dims: GridDimensions;
  private cursor = 0;

  constructor(tokens: Token[], dims: GridDimensions) {
    this.tokens = tokens;
    this.dims = dims;
  }

  private peek(): Token {
    return this.tokens[this.cursor];
  }

  private consume(): Token {
    const tok = this.tokens[this.cursor];
    this.cursor++;
    return tok;
  }

  private match(type: TokenType): boolean {
    if (this.peek().type === type) {
      this.consume();
      return true;
    }
    return false;
  }

  parse(): ASTNode {
    if (this.peek().type === 'EOF') {
      throw new FormulaSyntaxError('Empty formula expression');
    }
    const expr = this.parseExpression();
    if (this.peek().type !== 'EOF') {
      throw new FormulaSyntaxError(`Unexpected token "${this.peek().value || this.peek().type}"`);
    }
    return expr;
  }

  private parseExpression(): ASTNode {
    let left = this.parseTerm();
    while (this.peek().type === 'PLUS' || this.peek().type === 'MINUS') {
      const opToken = this.consume();
      const op = opToken.type === 'PLUS' ? '+' : '-';
      const right = this.parseTerm();
      left = { kind: 'Binary', op, left, right };
    }
    return left;
  }

  private parseTerm(): ASTNode {
    let left = this.parseUnary();
    while (this.peek().type === 'STAR' || this.peek().type === 'SLASH') {
      const opToken = this.consume();
      const op = opToken.type === 'STAR' ? '*' : '/';
      const right = this.parseUnary();
      left = { kind: 'Binary', op, left, right };
    }
    return left;
  }

  private parseUnary(): ASTNode {
    if (this.peek().type === 'PLUS' || this.peek().type === 'MINUS') {
      const opToken = this.consume();
      const op = opToken.type === 'PLUS' ? '+' : '-';
      const operand = this.parseUnary();
      return { kind: 'Unary', op, operand };
    }
    return this.parsePrimary();
  }

  private parsePrimary(): ASTNode {
    const tok = this.peek();

    if (tok.type === 'NUMBER') {
      this.consume();
      return { kind: 'Number', value: tok.numValue ?? Number(tok.value) };
    }

    if (tok.type === 'STRING') {
      this.consume();
      return { kind: 'String', value: tok.value };
    }

    if (tok.type === 'ERROR') {
      this.consume();
      const code = tok.value as SpreadsheetErrorCode;
      if (this.match('COLON')) {
        // Handle shifted/broken range like #REF!:A2
        const rhs = this.peek();
        if (rhs.type === 'CELL_REF' || rhs.type === 'ERROR') {
          this.consume();
          return {
            kind: 'Error',
            code: code === '#REF!' || rhs.value === '#REF!' ? '#REF!' : code,
            detail: 'Range contains invalid reference',
          };
        }
        throw new FormulaSyntaxError('Expected cell reference after ":"');
      }
      return { kind: 'Error', code, detail: `Literal error ${code}` };
    }

    if (tok.type === 'CELL_REF') {
      this.consume();
      const startRef = parseCellRef(tok.value, this.dims);
      if (!startRef) {
        throw new FormulaSyntaxError(`Invalid cell reference "${tok.value}"`, '#REF!');
      }
      if (this.match('COLON')) {
        const endTok = this.peek();
        if (endTok.type === 'ERROR') {
          this.consume();
          return {
            kind: 'Error',
            code: endTok.value === '#REF!' ? '#REF!' : (endTok.value as SpreadsheetErrorCode),
            detail: 'Range contains invalid reference',
          };
        }
        if (endTok.type !== 'CELL_REF') {
          throw new FormulaSyntaxError('Expected cell reference after ":"');
        }
        this.consume();
        const endRef = parseCellRef(endTok.value, this.dims);
        if (!endRef) {
          throw new FormulaSyntaxError(`Invalid cell reference "${endTok.value}"`, '#REF!');
        }
        return { kind: 'Range', start: startRef, end: endRef };
      }
      return { kind: 'CellRef', ref: startRef };
    }

    if (tok.type === 'IDENT') {
      this.consume();
      if (!this.match('LPAREN')) {
        throw new FormulaSyntaxError(`Unknown identifier "${tok.value}" (wrap text in quotes)`);
      }
      const args: ASTNode[] = [];
      if (this.peek().type !== 'RPAREN') {
        args.push(this.parseExpression());
        while (this.match('COMMA')) {
          args.push(this.parseExpression());
        }
      }
      if (!this.match('RPAREN')) {
        throw new FormulaSyntaxError(`Expected ")" after arguments to ${tok.value}`);
      }
      return { kind: 'Call', name: tok.value, args };
    }

    if (tok.type === 'LPAREN') {
      this.consume();
      const inner = this.parseExpression();
      if (!this.match('RPAREN')) {
        throw new FormulaSyntaxError('Missing closing parenthesis ")"');
      }
      return inner;
    }

    throw new FormulaSyntaxError(
      tok.type === 'EOF'
        ? 'Unexpected end of formula'
        : `Unexpected token "${tok.value}"`
    );
  }
}

export function extractDependencies(
  node: ASTNode,
  dims: GridDimensions = { rows: DEFAULT_ROWS, cols: DEFAULT_COLS }
): string[] {
  const deps = new Set<string>();

  function walk(n: ASTNode): void {
    switch (n.kind) {
      case 'Number':
      case 'String':
      case 'Error':
        return;
      case 'CellRef':
        if (n.ref.inBounds) {
          deps.add(n.ref.normalizedId);
        }
        return;
      case 'Range': {
        const ids = expandRangeIds(n.start, n.end, dims);
        if (ids) {
          for (const id of ids) deps.add(id);
        }
        return;
      }
      case 'Unary':
        walk(n.operand);
        return;
      case 'Binary':
        walk(n.left);
        walk(n.right);
        return;
      case 'Call':
        for (const arg of n.args) {
          walk(arg);
        }
        return;
    }
  }

  walk(node);
  return Array.from(deps).sort(compareCellIds);
}

export function parseFormula(
  rawFormula: string,
  dims: GridDimensions = { rows: DEFAULT_ROWS, cols: DEFAULT_COLS }
): ParseResult {
  const expr = rawFormula.startsWith('=') ? rawFormula.slice(1) : rawFormula;
  try {
    const tokens = tokenizeFormula(expr);
    const parser = new RecursiveDescentParser(tokens, dims);
    const ast = parser.parse();
    const dependencies = extractDependencies(ast, dims);
    return { ok: true, ast, dependencies };
  } catch (err) {
    if (err instanceof FormulaSyntaxError) {
      return {
        ok: false,
        error: err.code,
        detail: err.message,
        dependencies: [],
      };
    }
    return {
      ok: false,
      error: '#VALUE!',
      detail: err instanceof Error ? err.message : 'Invalid formula',
      dependencies: [],
    };
  }
}

export function shiftFormulaReferences(
  raw: string,
  deltaCol: number,
  deltaRow: number,
  dims: GridDimensions = { rows: DEFAULT_ROWS, cols: DEFAULT_COLS }
): string {
  if (!raw.startsWith('=') || (deltaCol === 0 && deltaRow === 0)) {
    return raw;
  }
  const expr = raw.slice(1);
  let tokens: Token[];
  try {
    tokens = tokenizeFormula(expr);
  } catch {
    return raw;
  }

  let output = '=';
  let cursor = 0;

  for (const tok of tokens) {
    if (tok.type !== 'CELL_REF') continue;
    output += expr.slice(cursor, tok.start);
    const parsed = parseCellRef(tok.value, dims);
    if (!parsed || !parsed.inBounds) {
      output += '#REF!';
    } else {
      const nextCol = parsed.colAbs ? parsed.col : parsed.col + deltaCol;
      const nextRow = parsed.rowAbs ? parsed.row : parsed.row + deltaRow;
      if (!isCoordInBounds(nextCol, nextRow, dims)) {
        output += '#REF!';
      } else {
        output += `${parsed.colAbs ? '$' : ''}${colIndexToLetter(nextCol)}${
          parsed.rowAbs ? '$' : ''
        }${nextRow + 1}`;
      }
    }
    cursor = tok.end;
  }

  output += expr.slice(cursor);
  return output;
}
