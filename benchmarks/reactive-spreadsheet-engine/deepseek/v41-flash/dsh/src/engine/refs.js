/**
 * A1-style reference helpers, shared by the parser, the evaluator and the UI.
 */

/** Absolute addressable space. The visible grid is smaller; refs outside the
 *  visible grid are still legal and simply read as blank, like Excel. */
export const MAX_COLS = 702; // A..ZZ
export const MAX_ROWS = 100000;

const REF_RE = /^\$?([A-Za-z]{1,3})\$?(\d{1,7})$/;

/** 0 -> "A", 25 -> "Z", 26 -> "AA" */
export function colName(col) {
  let c = Math.floor(col);
  let s = '';
  while (c >= 0) {
    s = String.fromCharCode(65 + (c % 26)) + s;
    c = Math.floor(c / 26) - 1;
  }
  return s;
}

/** "A" -> 0, "AA" -> 26, invalid -> -1 */
export function colIndex(name) {
  const s = String(name).toUpperCase();
  if (!/^[A-Z]{1,3}$/.test(s)) return -1;
  let n = 0;
  for (const ch of s) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n - 1;
}

/** (0, 0) -> "A1" */
export function refName(col, row) {
  return colName(col) + (row + 1);
}

/**
 * Parse "A1" / "$A$1" into {col,row,ref}.
 * Returns null for references that cannot exist (#REF! candidates):
 * "A0", "A-1", "AAAA1", "" ...
 */
export function parseRef(text) {
  const m = REF_RE.exec(String(text));
  if (!m) return null;
  const col = colIndex(m[1]);
  const row = parseInt(m[2], 10) - 1;
  if (col < 0 || row < 0 || col >= MAX_COLS || row >= MAX_ROWS) return null;
  return { col, row, ref: refName(col, row) };
}

/** Normalise a rectangular range and list every address inside it. */
export function expandRange(from, to) {
  const a = parseRef(from);
  const b = parseRef(to);
  if (!a || !b) return null;
  const c0 = Math.min(a.col, b.col);
  const c1 = Math.max(a.col, b.col);
  const r0 = Math.min(a.row, b.row);
  const r1 = Math.max(a.row, b.row);
  const count = (c1 - c0 + 1) * (r1 - r0 + 1);
  if (count > 200000) return null; // absurd range -> #REF!
  const out = [];
  for (let r = r0; r <= r1; r += 1) {
    for (let c = c0; c <= c1; c += 1) out.push(refName(c, r));
  }
  return out;
}

/** "A1:B3" -> {from,to} or null */
export function parseRangeText(text) {
  const i = String(text).indexOf(':');
  if (i < 0) return null;
  const a = parseRef(text.slice(0, i));
  const b = parseRef(text.slice(i + 1));
  if (!a || !b) return null;
  return { from: a.ref, to: b.ref };
}
