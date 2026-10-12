// Grid geometry and A1-style address helpers.

export const NUM_ROWS = 30;
export const NUM_COLS = 12; // A..L

export interface CellCoord {
  row: number; // 0-based
  col: number; // 0-based
}

export function colToLetters(col: number): string {
  let n = col + 1;
  let s = '';
  while (n > 0) {
    const rem = (n - 1) % 26;
    s = String.fromCharCode(65 + rem) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

export function lettersToCol(letters: string): number {
  let n = 0;
  const up = letters.toUpperCase();
  for (let i = 0; i < up.length; i++) {
    n = n * 26 + (up.charCodeAt(i) - 64);
    if (n > 1e6) return Number.MAX_SAFE_INTEGER; // absurdly large -> out of bounds
  }
  return n - 1;
}

export function toAddr(row: number, col: number): string {
  return `${colToLetters(col)}${row + 1}`;
}

export function inBounds(row: number, col: number): boolean {
  return row >= 0 && row < NUM_ROWS && col >= 0 && col < NUM_COLS;
}

const ADDR_RE = /^([A-Za-z]+)([0-9]+)$/;

/** Parses "B7" into coordinates (no bounds check). */
export function parseAddr(addr: string): CellCoord | null {
  const m = ADDR_RE.exec(addr.trim());
  if (!m) return null;
  return { row: parseInt(m[2], 10) - 1, col: lettersToCol(m[1]) };
}

export function isValidAddr(addr: string): boolean {
  const c = parseAddr(addr);
  return !!c && inBounds(c.row, c.col) && toAddr(c.row, c.col) === addr;
}
