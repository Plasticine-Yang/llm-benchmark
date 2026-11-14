export const ROWS = 20;
export const COLS = 10;

export function colName(col) {
  let n = col + 1;
  let out = '';
  while (n > 0) {
    const rem = (n - 1) % 26;
    out = String.fromCharCode(65 + rem) + out;
    n = Math.floor((n - 1) / 26);
  }
  return out;
}

export function colIndex(name) {
  let n = 0;
  const upper = String(name).toUpperCase();
  for (let i = 0; i < upper.length; i += 1) {
    n = n * 26 + (upper.charCodeAt(i) - 64);
  }
  return n - 1;
}

export function cellId(col, row) {
  return `${colName(col)}${row + 1}`;
}

export function parseAddress(id) {
  const match = /^\$?([A-Za-z]{1,3})\$?([0-9]{1,5})$/.exec(String(id).trim());
  if (!match) return null;
  return { col: colIndex(match[1]), row: Number.parseInt(match[2], 10) - 1 };
}

export function inBounds(col, row, rows = ROWS, cols = COLS) {
  return Number.isInteger(col) && Number.isInteger(row) && col >= 0 && col < cols && row >= 0 && row < rows;
}

export function normalizeAddress(id) {
  const parsed = parseAddress(id);
  return parsed ? cellId(parsed.col, parsed.row) : null;
}

export function addressOrder(id, cols = COLS) {
  const parsed = parseAddress(id);
  return parsed ? parsed.row * cols + parsed.col : Number.MAX_SAFE_INTEGER;
}

export function isValidAddress(id, rows = ROWS, cols = COLS) {
  const parsed = parseAddress(id);
  return !!parsed && inBounds(parsed.col, parsed.row, rows, cols);
}

export function expandRange(fromId, toId, rows = ROWS, cols = COLS) {
  const from = parseAddress(fromId);
  const to = parseAddress(toId);
  if (!from || !to) return { valid: false, cells: [] };
  const c0 = Math.min(from.col, to.col);
  const c1 = Math.max(from.col, to.col);
  const r0 = Math.min(from.row, to.row);
  const r1 = Math.max(from.row, to.row);
  if (!inBounds(c0, r0, rows, cols) || !inBounds(c1, r1, rows, cols)) {
    return { valid: false, cells: [] };
  }
  const cells = [];
  for (let r = r0; r <= r1; r += 1) {
    for (let c = c0; c <= c1; c += 1) cells.push(cellId(c, r));
  }
  return { valid: true, cells, bounds: { c0, r0, c1, r1 } };
}

export function allAddresses(rows = ROWS, cols = COLS) {
  const out = [];
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) out.push(cellId(c, r));
  }
  return out;
}