// Real pathfinding on the backend.
//
//  * `astar`           – plain 4-connected A* on the static grid (never crosses
//                        shelves, walls or dynamically blocked cells).
//  * `planSpaceTime`    – time-expanded A* over (cell, timestep) states, used by
//                        the scheduler to build *reserved* trajectories. It can
//                        never enter a cell that another robot holds at the same
//                        timestep and it never swaps two robots between steps.
//  * `oracleLaneGuard`  – single-lane aisle mutual exclusion (one robot per
//                        one-cell-wide aisle) applied while entering a lane.

class MinHeap {
  constructor() {
    this.items = [];
  }

  get size() {
    return this.items.length;
  }

  push(f, g, t, cell) {
    const item = { f, g, t, cell };
    const items = this.items;
    items.push(item);
    let i = items.length - 1;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (items[parent].f <= items[i].f) break;
      [items[parent], items[i]] = [items[i], items[parent]];
      i = parent;
    }
  }

  pop() {
    const items = this.items;
    const top = items[0];
    const last = items.pop();
    if (items.length > 0) {
      items[0] = last;
      let i = 0;
      for (;;) {
        const l = 2 * i + 1;
        const r = l + 1;
        let best = i;
        if (l < items.length && items[l].f < items[best].f) best = l;
        if (r < items.length && items[r].f < items[best].f) best = r;
        if (best === i) break;
        [items[best], items[i]] = [items[i], items[best]];
        i = best;
      }
    }
    return top;
  }
}

const NEIGHBOURS = [
  [0, -1],
  [1, 0],
  [0, 1],
  [-1, 0],
];

export function manhattan(a, b, width) {
  const ax = a % width;
  const ay = (a - ax) / width;
  const bx = b % width;
  const by = (b - bx) / width;
  return Math.abs(ax - bx) + Math.abs(ay - by);
}

/**
 * Static A* over the grid. `isTraversable(x, y)` decides cell validity, so
 * shelves / walls / blocked cells are never crossed.
 * Returns an array of cell indices from start to goal (inclusive) or null.
 */
export function astar({ width, height, isTraversable, start, goal, maxExpansions = 200000 }) {
  if (start === goal) return [start];
  const gScore = new Map([[start, 0]]);
  const parent = new Map();
  const closed = new Set();
  const heap = new MinHeap();
  heap.push(manhattan(start, goal, width), 0, start, start);
  let expansions = 0;

  while (heap.size > 0) {
    const node = heap.pop();
    const cell = node.cell;
    if (closed.has(cell)) continue;
    closed.add(cell);
    if (cell === goal) {
      const path = [];
      let cur = cell;
      while (cur !== undefined) {
        path.push(cur);
        cur = parent.get(cur);
      }
      return path.reverse();
    }
    if (++expansions > maxExpansions) break;
    const x = cell % width;
    const y = (cell - x) / width;
    for (const [dx, dy] of NEIGHBOURS) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
      if (!isTraversable(nx, ny)) continue;
      const nc = ny * width + nx;
      if (closed.has(nc)) continue;
      const ng = node.g + 1;
      const prev = gScore.get(nc);
      if (prev !== undefined && prev <= ng) continue;
      gScore.set(nc, ng);
      parent.set(nc, cell);
      heap.push(ng + manhattan(nc, goal, width), ng, nc, nc);
    }
  }
  return null;
}

/**
 * Time-expanded A* with reservations.
 *
 *  occ(t, cell, selfId)        -> ownerId | null : who reserves `cell` at absolute tick t
 *  laneIdOf(cell)              -> lane id or -1
 *  laneOccupiedAt(t, lane, selfId) -> true when another robot is inside that lane
 *
 * Guarantees enforced on every generated transition:
 *   1. no two robots share a cell at the same time-step
 *   2. no two robots swap cells during one time-step
 *   3. a one-cell-wide aisle is entered only when it is empty (no head-on standoff)
 *
 * If the goal is unreachable within the horizon the planner returns the best
 * partial trajectory (max progress towards the goal), so a robot always keeps
 * inching forward instead of parking in place.
 */
export function planSpaceTime({
  width,
  height,
  isTraversable,
  start,
  goal,
  startTick,
  selfId,
  occ,
  laneIdOf,
  laneOccupiedAt,
  maxT = 260,
  waitCost = 2,
  maxExpansions = 150000,
}) {
  const N = width * height;
  const key = (t, cell) => t * N + cell;
  const gScore = new Map();
  const parent = new Map();
  const closed = new Set();
  const heap = new MinHeap();
  const startKey = key(0, start);
  gScore.set(startKey, 0);
  heap.push(manhattan(start, goal, width), 0, 0, start);

  let best = { h: manhattan(start, goal, width), t: 0, cell: start };
  let foundKey = null;
  let foundT = -1;
  let expansions = 0;

  while (heap.size > 0) {
    const node = heap.pop();
    const t = node.t;
    const cell = node.cell;
    const k = key(t, cell);
    if (closed.has(k)) continue;
    closed.add(k);
    const g = gScore.get(k);
    if (g === undefined) continue;

    if (cell === goal) {
      foundKey = k;
      foundT = t;
      break;
    }
    const h = manhattan(cell, goal, width);
    if (h < best.h || (h === best.h && t < best.t)) best = { h, t, cell, key: k };
    if (++expansions > maxExpansions) break;
    if (t >= maxT) continue;

    const x = cell % width;
    const y = (cell - x) / width;

    // wait in place
    if (occ(startTick + t + 1, cell, selfId) === null) {
      const kk = key(t + 1, cell);
      const ng = g + waitCost;
      const prev = gScore.get(kk);
      if (prev === undefined || ng < prev) {
        gScore.set(kk, ng);
        parent.set(kk, k);
        heap.push(ng + h, ng, t + 1, cell);
      }
    }

    const myLane = laneIdOf(cell);
    for (const [dx, dy] of NEIGHBOURS) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
      if (!isTraversable(nx, ny)) continue;
      const nc = ny * width + nx;

      // (1) cell occupancy at the arrival time-step
      if (occ(startTick + t + 1, nc, selfId) !== null) continue;

      // (2) swap prevention: the robot standing on `nc` right now must not be
      //     moving into our current cell during the very same time-step.
      const blocker = occ(startTick + t, nc, selfId);
      if (blocker !== null && occ(startTick + t + 1, cell, selfId) === blocker) continue;

      // (3) single-lane aisle mutual exclusion on entry
      const nLane = laneIdOf(nc);
      if (nLane !== -1 && nLane !== myLane && laneOccupiedAt(startTick + t + 1, nLane, selfId)) continue;

      const kk = key(t + 1, nc);
      const ng = g + 1;
      const prev = gScore.get(kk);
      if (prev === undefined || ng < prev) {
        gScore.set(kk, ng);
        parent.set(kk, k);
        heap.push(ng + manhattan(nc, goal, width), ng, t + 1, nc);
      }
    }
  }

  const endKey = foundKey !== null ? foundKey : best.key ?? startKey;
  const cells = [];
  let cur = endKey;
  while (cur !== undefined) {
    cells.push(cur % N);
    cur = parent.get(cur);
  }
  cells.reverse();
  while (cells.length < maxT + 1) cells.push(cells[cells.length - 1]);

  return {
    cells,
    reached: foundKey !== null,
    arrivalTick: foundT >= 0 ? startTick + foundT : null,
    goalCell: goal,
  };
}
