import { CELL, GRID_W, GRID_H, idx, xy, inBounds } from './warehouse.js';

export const vkey = (x, y, t) => `${x},${y},${t}`;
export const ekey = (x1, y1, x2, y2, t) => `${x1},${y1}>${x2},${y2},${t}`;

const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const N = GRID_W * GRID_H;

class Heap {
  constructor() { this.a = []; }
  get size() { return this.a.length; }
  push(node) {
    const a = this.a;
    a.push(node);
    let i = a.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (a[p].f <= a[i].f) break;
      [a[p], a[i]] = [a[i], a[p]];
      i = p;
    }
  }
  pop() {
    const a = this.a;
    const top = a[0];
    const last = a.pop();
    if (a.length) {
      a[0] = last;
      let i = 0;
      for (;;) {
        const l = i * 2 + 1;
        const r = l + 1;
        let m = i;
        if (l < a.length && a[l].f < a[m].f) m = l;
        if (r < a.length && a[r].f < a[m].f) m = r;
        if (m === i) break;
        [a[m], a[i]] = [a[i], a[m]];
        i = m;
      }
    }
    return top;
  }
}

/**
 * Space-time A* over (x, y, t).
 *
 * Hard constraints, checked against the reservation table of every other robot:
 *  - vertex: no two robots in the same cell at the same tick
 *  - edge/swap: no two robots exchanging cells during the same tick
 *  - static: walls, shelves and user-blocked cells are never entered
 * Waiting in place is a legal action, so a robot can yield instead of colliding.
 */
export function planPath(opts) {
  const {
    wh, blocked, start, goals, t0, horizon,
    res, edge, selfId,
    waitCost = 1.25, corridorPenalty = 0.45, dwell = 0,
  } = opts;

  const passable = new Uint8Array(N);
  for (let i = 0; i < N; i++) {
    const t = wh.cells[i];
    passable[i] = (t === CELL.EMPTY || t === CELL.STATION) && !blocked.has(i) ? 1 : 0;
  }

  const startIdx = idx(start.x, start.y);
  if (!passable[startIdx]) return null;

  const goalIdxs = [];
  for (const g of goals) {
    const gi = idx(g.x, g.y);
    if (passable[gi]) goalIdxs.push(gi);
  }
  if (!goalIdxs.length) return null;
  const goalSet = new Set(goalIdxs);

  const maxT = t0 + horizon;

  // Necessary condition: the goal must be free at some point in the window.
  // Rejecting here avoids expanding the whole space-time graph for a goal that
  // is permanently occupied.
  const usable = goalIdxs.some((gi) => {
    const g = xy(gi);
    for (let t = t0; t <= maxT; t++) {
      const o = res.get(vkey(g.x, g.y, t));
      if (o === undefined || o === selfId) return true;
    }
    return false;
  });
  if (!usable) return null;

  const h = (i) => {
    const { x, y } = xy(i);
    let best = Infinity;
    for (const gi of goalIdxs) {
      const g = xy(gi);
      const d = Math.abs(g.x - x) + Math.abs(g.y - y);
      if (d < best) best = d;
    }
    return best;
  };

  const gScore = new Map();
  const parent = new Map();
  const open = new Heap();
  const closed = new Set();

  const sKey = t0 * N + startIdx;
  gScore.set(sKey, 0);
  open.push({ f: h(startIdx), g: 0, t: t0, i: startIdx, key: sKey });

  let foundKey = -1;
  let foundT = t0;
  let expansions = 0;
  const MAX_EXPANSIONS = 70000;

  while (open.size) {
    const cur = open.pop();
    if (closed.has(cur.key)) continue;
    closed.add(cur.key);
    if (goalSet.has(cur.i)) {
      // The robot occupies the goal for `dwell` ticks after arriving, so the whole
      // dwell window must be reservable, not just the arrival tick.
      const g = xy(cur.i);
      let ok = true;
      for (let k = 1; k <= dwell; k++) {
        const o = res.get(vkey(g.x, g.y, cur.t + k));
        if (o !== undefined && o !== selfId) { ok = false; break; }
      }
      if (ok) { foundKey = cur.key; foundT = cur.t; break; }
    }
    if (cur.t >= maxT) continue;
    if (++expansions > MAX_EXPANSIONS) break;

    const { x, y } = xy(cur.i);
    const nt = cur.t + 1;

    for (let d = -1; d < 4; d++) {
      let nx = x;
      let ny = y;
      let stepCost;
      if (d === -1) {
        stepCost = waitCost;
      } else {
        nx = x + DIRS[d][0];
        ny = y + DIRS[d][1];
        if (!inBounds(nx, ny)) continue;
        stepCost = 1 + (wh.corridor[idx(nx, ny)] ? corridorPenalty : 0);
      }
      const ni = idx(nx, ny);
      if (!passable[ni]) continue;

      const owner = res.get(vkey(nx, ny, nt));
      if (owner !== undefined && owner !== selfId) continue;

      if (d !== -1) {
        const swapper = edge.get(ekey(nx, ny, x, y, cur.t));
        if (swapper !== undefined && swapper !== selfId) continue;
      }

      const nKey = nt * N + ni;
      if (closed.has(nKey)) continue;
      const ng = cur.g + stepCost;
      const prev = gScore.get(nKey);
      if (prev !== undefined && prev <= ng) continue;
      gScore.set(nKey, ng);
      parent.set(nKey, cur.key);
      open.push({ f: ng + h(ni), g: ng, t: nt, i: ni, key: nKey });
    }
  }

  if (foundKey < 0) return null;

  const chain = [];
  let k = foundKey;
  while (k !== undefined) {
    chain.push(k);
    k = parent.get(k);
  }
  chain.reverse();

  const cells = chain.map((key) => xy(key % N));
  const goalCell = cells[cells.length - 1];
  for (let k = 0; k < dwell; k++) cells.push({ x: goalCell.x, y: goalCell.y });
  const waits = new Map();
  for (let i = 1; i < cells.length; i++) {
    const a = cells[i - 1];
    const b = cells[i];
    if (a.x === b.x && a.y === b.y) {
      const owner = res.get(vkey(b.x, b.y, t0 + i));
      if (owner !== undefined && owner !== selfId) waits.set(i, owner);
    }
  }
  return { cells, t0, waits, expansions, arrivalTick: foundT };
}

/** Plain spatial A* used for idle-robot relocation targets and distance estimates. */
export function spatialDistance(wh, blocked, from, to) {
  const passable = (x, y) => {
    if (!inBounds(x, y)) return false;
    const i = idx(x, y);
    const t = wh.cells[i];
    return (t === CELL.EMPTY || t === CELL.STATION) && !blocked.has(i);
  };
  if (!passable(to.x, to.y)) return Infinity;
  const start = idx(from.x, from.y);
  const goal = idx(to.x, to.y);
  if (start === goal) return 0;
  const dist = new Int32Array(N).fill(-1);
  dist[start] = 0;
  const q = [start];
  for (let head = 0; head < q.length; head++) {
    const cur = q[head];
    if (cur === goal) return dist[cur];
    const { x, y } = xy(cur);
    for (const [ox, oy] of DIRS) {
      const nx = x + ox;
      const ny = y + oy;
      if (!passable(nx, ny)) continue;
      const ni = idx(nx, ny);
      if (dist[ni] >= 0) continue;
      dist[ni] = dist[cur] + 1;
      q.push(ni);
    }
  }
  return Infinity;
}