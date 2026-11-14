/** Grid geometry and A1-style address helpers (pure, environment agnostic). */

export const ROWS = 30;
export const COLS = 12; // A .. L

export function colIndexFromLetters(letters) {
  const s = letters.toUpperCase();
  let n = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i) - 64;
    if (c < 1 || c > 26) return -1;
    n = n * 26 + c;
  }
  return n - 1;
}

export function colLettersFromIndex(index) {
  let n = index + 1;
  let s = '';
  while (n > 0) {
    const rem = (n - 1) % 26;
    s = String.fromCharCode(65 + rem) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

export function makeCellId(row, col) {
  return colLettersFromIndex(col) + row;
}

const CELL_RE = /^(\$?)([A-Za-z]{1,3})(\$?)([1-9]\d*)$/;

/** Returns { id, row, col, absCol, absRow } or null when the token is not a cell reference. */
export function parseCellRef(text) {
  const m = CELL_RE.exec(String(text).trim());
  if (!m) return null;
  const col = colIndexFromLetters(m[2]);
  const row = Number(m[4]);
  if (col < 0 || !Number.isSafeInteger(row) || row < 1) return null;
  return {
    id: makeCellId(row, col),
    row,
    col,
    absCol: m[1] === '$',
    absRow: m[3] === '$',
  };
}

export function inBounds(row, col) {
  return row >= 1 && row <= ROWS && col >= 0 && col < COLS;
}

/** Expand a rectangular range to a flat list of cell ids, clipped to the grid. */
export function expandRange(a, b, clip = true) {
  let r1 = Math.min(a.row, b.row);
  let r2 = Math.max(a.row, b.row);
  let c1 = Math.min(a.col, b.col);
  let c2 = Math.max(a.col, b.col);
  if (clip) {
    r1 = Math.max(1, r1);
    r2 = Math.min(ROWS, r2);
    c1 = Math.max(0, c1);
    c2 = Math.min(COLS - 1, c2);
  }
  const ids = [];
  for (let r = r1; r <= r2; r++) {
    for (let c = c1; c <= c2; c++) ids.push(makeCellId(r, c));
  }
  return ids;
}

/** Strict numeric literal recognition (no trailing junk, no hex, no Infinity). */
export function parseNumber(text) {
  const t = String(text).trim();
  if (t === '') return null;
  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(t)) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

/** Stable human-friendly ordering for cell ids (A1, A2, ... B1, B2 ...). */
export function cellSortKey(id) {
  const ref = parseCellRef(id);
  return ref ? ref.row * 1000 + ref.col : Number.MAX_SAFE_INTEGER;
}

/**
 * Translate relative A1 references inside a formula when a cell is copied.
 * Absolute parts ($A$1) are preserved. References that would leave the grid
 * are left untouched instead of producing an unparsable token.
 */
export function shiftFormula(formula, deltaRow, deltaCol) {
  if (deltaRow === 0 && deltaCol === 0) return formula;
  return formula.replace(
    /(\$?)([A-Za-z]{1,3})(\$?)([1-9]\d*)/g,
    (full, dollarCol, letters, dollarRow, digits) => {
      const ref = parseCellRef(full);
      if (!ref) return full;
      const col = dollarCol === '$' ? ref.col : ref.col + deltaCol;
      const row = dollarRow === '$' ? ref.row : ref.row + deltaRow;
      if (!inBounds(row, col)) return full;
      return `${dollarCol}${colLettersFromIndex(col)}${dollarRow}${row}`;
    },
  );
}
