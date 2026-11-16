import { DEFAULT_COLS, DEFAULT_ROWS, GridDimensions } from './types.js';

export interface ParsedCellRef {
  raw: string;
  col: number;
  row: number;
  colAbs: boolean;
  rowAbs: boolean;
  normalizedId: string;
  inBounds: boolean;
}

export function colIndexToLetter(col: number): string {
  if (col < 0) return '';
  let n = col;
  let result = '';
  while (n >= 0) {
    result = String.fromCharCode((n % 26) + 65) + result;
    n = Math.floor(n / 26) - 1;
  }
  return result;
}

export function colLetterToIndex(letters: string): number {
  const upper = letters.toUpperCase();
  let col = 0;
  for (let i = 0; i < upper.length; i++) {
    const code = upper.charCodeAt(i);
    if (code < 65 || code > 90) return -1;
    col = col * 26 + (code - 64);
  }
  return col - 1;
}

export function formatCellId(col: number, row: number): string {
  return `${colIndexToLetter(col)}${row + 1}`;
}

export function isCoordInBounds(
  col: number,
  row: number,
  dims: GridDimensions = { rows: DEFAULT_ROWS, cols: DEFAULT_COLS }
): boolean {
  return col >= 0 && col < dims.cols && row >= 0 && row < dims.rows;
}

const CELL_REF_REGEX = /^(\$?)([A-Za-z]+)(\$?)([0-9]+)$/;

export function parseCellRef(
  token: string,
  dims: GridDimensions = { rows: DEFAULT_ROWS, cols: DEFAULT_COLS }
): ParsedCellRef | null {
  const match = CELL_REF_REGEX.exec(token.trim());
  if (!match) return null;

  const [, colDollar, letters, rowDollar, rowStr] = match;
  const col = colLetterToIndex(letters);
  const rowOneBased = Number.parseInt(rowStr, 10);
  if (!Number.isFinite(rowOneBased) || rowOneBased <= 0 || col < 0) {
    return {
      raw: token,
      col,
      row: rowOneBased - 1,
      colAbs: colDollar === '$',
      rowAbs: rowDollar === '$',
      normalizedId: `${letters.toUpperCase()}${rowStr}`,
      inBounds: false,
    };
  }

  const row = rowOneBased - 1;
  return {
    raw: token,
    col,
    row,
    colAbs: colDollar === '$',
    rowAbs: rowDollar === '$',
    normalizedId: formatCellId(col, row),
    inBounds: isCoordInBounds(col, row, dims),
  };
}

export function parseCellId(
  id: string,
  dims: GridDimensions = { rows: DEFAULT_ROWS, cols: DEFAULT_COLS }
): { col: number; row: number } | null {
  const parsed = parseCellRef(id, dims);
  if (!parsed || !parsed.inBounds || parsed.colAbs || parsed.rowAbs) return null;
  return { col: parsed.col, row: parsed.row };
}

export function expandRangeIds(
  start: ParsedCellRef,
  end: ParsedCellRef,
  dims: GridDimensions = { rows: DEFAULT_ROWS, cols: DEFAULT_COLS }
): string[] | null {
  if (!start.inBounds || !end.inBounds) {
    return null;
  }
  const minCol = Math.min(start.col, end.col);
  const maxCol = Math.max(start.col, end.col);
  const minRow = Math.min(start.row, end.row);
  const maxRow = Math.max(start.row, end.row);

  if (
    !isCoordInBounds(minCol, minRow, dims) ||
    !isCoordInBounds(maxCol, maxRow, dims)
  ) {
    return null;
  }

  const ids: string[] = [];
  for (let r = minRow; r <= maxRow; r++) {
    for (let c = minCol; c <= maxCol; c++) {
      ids.push(formatCellId(c, r));
    }
  }
  return ids;
}

export function compareCellIds(a: string, b: string): number {
  const pa = parseCellRef(a);
  const pb = parseCellRef(b);
  if (!pa || !pb) return a.localeCompare(b);
  if (pa.col !== pb.col) return pa.col - pb.col;
  return pa.row - pb.row;
}
