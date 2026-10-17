import { cellKey } from './warehouse.js';

class MinHeap {
  constructor(compare) {
    this.items = [];
    this.compare = compare;
  }

  get size() {
    return this.items.length;
  }

  push(value) {
    const items = this.items;
    items.push(value);
    let index = items.length - 1;
    while (index > 0) {
      const parent = (index - 1) >> 1;
      if (this.compare(items[parent], value) <= 0) break;
      items[index] = items[parent];
      index = parent;
    }
    items[index] = value;
  }

  pop() {
    const items = this.items;
    if (items.length === 0) return undefined;
    const top = items[0];
    const last = items.pop();
    if (items.length === 0 || last === undefined) return top;
    let index = 0;
    while (true) {
      const left = index * 2 + 1;
      const right = left + 1;
      if (left >= items.length) break;
      let child = left;
      if (right < items.length && this.compare(items[right], items[left]) < 0) child = right;
      if (this.compare(last, items[child]) <= 0) break;
      items[index] = items[child];
      index = child;
    }
    items[index] = last;
    return top;
  }
}

/**
 * Time-expanded reservations. A reservation is the claim "robotId occupies
 * cell (x,y) at simulation offset t". Offsets are relative to the planning
 * pass and never escape it.
 */
export class ReservationTable {
  constructor(width) {
    this.width = width;
    this.times = new Map();
  }

  reserve(x, y, t, robotId, kind = 'route') {
    let layer = this.times.get(t);
    if (!layer) {
      layer = new Map();
      this.times.set(t, layer);
    }
    layer.set(y * this.width + x, { robotId, kind });
  }

  holder(x, y, t) {
    return this.times.get(t)?.get(y * this.width + x) ?? null;
  }

  hasOther(x, y, t, robotId) {
    const holder = this.holder(x, y, t);
    return Boolean(holder && holder.robotId !== robotId);
  }

  countClaims() {
    let total = 0;
    for (const layer of this.times.values()) total += layer.size;
    return total;
  }
}

const DIRECTIONS = [
  { dx: 0, dy: -1, name: 'N' },
  { dx: 1, dy: 0, name: 'E' },
  { dx: 0, dy: 1, name: 'S' },
  { dx: -1, dy: 0, name: 'W' },
];

/**
 * Space-time A*.
 *
 * Constraints enforced at every candidate timestep:
 *   1. no static obstacle / user block / locked corridor
 *   2. no vertex conflict with an existing reservation at t
 *   3. no entry into a cell occupied at t-1 (safe following distance; also
 *      makes an opposite-direction edge swap impossible)
 *
 * Waiting is a legal action with a small penalty. This means routes may
 * contain deliberate hold positions instead of colliding, and a route always
 * has a concrete cell for every sim tick.
 */
export function findSpaceTimePath({
  width,
  height,
  start,
  goal,
  isOpen,
  blocked = new Set(),
  forbidden = new Set(),
  reservations,
  robotId,
  horizon = 180,
  waitAllowed = true,
}) {
  if (!goal) return { path: null, reason: 'NO_GOAL', expanded: 0 };
  if (goal.x !== start.x || goal.y !== start.y) {
    if (!isOpen(goal.x, goal.y) || blocked.has(cellKey(goal.x, goal.y))) {
      return { path: null, reason: 'GOAL_BLOCKED', expanded: 0 };
    }
  }
  if (blocked.has(cellKey(goal.x, goal.y))) {
    return { path: null, reason: 'GOAL_BLOCKED', expanded: 0 };
  }
  if (forbidden.has(cellKey(goal.x, goal.y))) {
    return { path: null, reason: 'GOAL_LOCKED', expanded: 0 };
  }

  const h = (x, y) => Math.abs(x - goal.x) + Math.abs(y - goal.y);
  const startNode = {
    x: start.x,
    y: start.y,
    t: 0,
    g: 0,
    f: h(start.x, start.y),
    parent: null,
  };
  const heap = new MinHeap((a, b) => a.f - b.f || a.h - b.h || a.t - b.t || a.y - b.y || a.x - b.x);
  const startWithH = { ...startNode, h: h(start.x, start.y) };
  heap.push(startWithH);
  const best = new Map();
  best.set(`${start.x},${start.y},0`, 0);
  let expanded = 0;
  let lastNode = null;

  while (heap.size > 0) {
    const node = heap.pop();
    if (!node) break;
    const nodeKey = `${node.x},${node.y},${node.t}`;
    if (node.g > (best.get(nodeKey) ?? Infinity)) continue;
    expanded += 1;
    lastNode = node;
    if (node.x === goal.x && node.y === goal.y) {
      const path = [];
      let cursor = node;
      while (cursor) {
        path.push({ x: cursor.x, y: cursor.y, t: cursor.t });
        cursor = cursor.parent;
      }
      path.reverse();
      return { path, reason: 'FOUND', expanded };
    }
    if (node.t >= horizon) continue;

    const nt = node.t + 1;
    const candidates = [];
    for (const dir of DIRECTIONS) {
      const nx = node.x + dir.dx;
      const ny = node.y + dir.dy;
      if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
      if (!isOpen(nx, ny)) continue;
      if (blocked.has(cellKey(nx, ny))) continue;
      if (forbidden.has(cellKey(nx, ny))) continue;
      candidates.push({ x: nx, y: ny, wait: false });
    }
    if (waitAllowed) candidates.push({ x: node.x, y: node.y, wait: true });

    for (const candidate of candidates) {
      const key = cellKey(candidate.x, candidate.y);
      if (!candidate.wait) {
        if (forbidden.has(key)) continue;
      }
      // Vertex conflict at the target time.
      if (reservations.hasOther(candidate.x, candidate.y, nt, robotId)) continue;
      // Entering a just-vacated cell is forbidden for one tick. It prevents
      // bumper-to-bumper following and therefore cannot produce a swap.
      if (reservations.hasOther(candidate.x, candidate.y, nt - 1, robotId)) continue;
      if (candidate.wait && forbidden.has(key) && !(node.x === start.x && node.y === start.y)) continue;

      const stepCost = candidate.wait ? 1.18 : 1;
      const g = node.g + stepCost;
      const nextKey = `${candidate.x},${candidate.y},${nt}`;
      if (g >= (best.get(nextKey) ?? Infinity)) continue;
      best.set(nextKey, g);
      const hh = h(candidate.x, candidate.y);
      heap.push({
        x: candidate.x,
        y: candidate.y,
        t: nt,
        g,
        h: hh,
        f: g + hh,
        parent: node,
      });
    }
  }

  return {
    path: null,
    reason: forbidden.size > 0 ? 'GOAL_LOCKED' : expanded > 0 && lastNode ? 'HORIZON_EXHAUSTED' : 'NO_ROUTE',
    expanded,
  };
}

/** Static BFS used for job dispatch (nearest idle robot), ignoring traffic. */
export function staticDistance({ width, height, start, goal, isOpen }) {
  if (!goal || !isOpen(goal.x, goal.y)) return Infinity;
  if (start.x === goal.x && start.y === goal.y) return 0;
  const queue = [{ x: start.x, y: start.y, distance: 0 }];
  const seen = new Set([cellKey(start.x, start.y)]);
  let cursor = 0;
  while (cursor < queue.length) {
    const node = queue[cursor];
    cursor += 1;
    for (const dir of DIRECTIONS) {
      const nx = node.x + dir.dx;
      const ny = node.y + dir.dy;
      if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
      const key = cellKey(nx, ny);
      if (seen.has(key) || !isOpen(nx, ny)) continue;
      if (nx === goal.x && ny === goal.y) return node.distance + 1;
      seen.add(key);
      queue.push({ x: nx, y: ny, distance: node.distance + 1 });
    }
  }
  return Infinity;
}
