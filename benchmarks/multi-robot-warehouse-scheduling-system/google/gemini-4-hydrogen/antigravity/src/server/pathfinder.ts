import { GridCell, Point, TimePoint, WarehouseGrid } from '../shared/types.js';

export const DEFAULT_MAX_HORIZON = 140;

class MinHeap<T> {
  private items: T[] = [];
  constructor(private readonly compare: (a: T, b: T) => number) {}

  get size(): number {
    return this.items.length;
  }

  push(item: T): void {
    this.items.push(item);
    this.bubbleUp(this.items.length - 1);
  }

  pop(): T | undefined {
    if (this.items.length === 0) return undefined;
    const top = this.items[0];
    const last = this.items.pop()!;
    if (this.items.length > 0) {
      this.items[0] = last;
      this.sinkDown(0);
    }
    return top;
  }

  private bubbleUp(idx: number): void {
    while (idx > 0) {
      const parent = (idx - 1) >> 1;
      if (this.compare(this.items[idx], this.items[parent]) >= 0) break;
      [this.items[idx], this.items[parent]] = [this.items[parent], this.items[idx]];
      idx = parent;
    }
  }

  private sinkDown(idx: number): void {
    const len = this.items.length;
    while (true) {
      let smallest = idx;
      const left = (idx << 1) + 1;
      const right = left + 1;
      if (left < len && this.compare(this.items[left], this.items[smallest]) < 0) {
        smallest = left;
      }
      if (right < len && this.compare(this.items[right], this.items[smallest]) < 0) {
        smallest = right;
      }
      if (smallest === idx) break;
      [this.items[idx], this.items[smallest]] = [this.items[smallest], this.items[idx]];
      idx = smallest;
    }
  }
}

export function isCellTraversable(cell: GridCell | undefined): boolean {
  if (!cell) return false;
  return cell.type !== 'WALL' && cell.type !== 'SHELF' && !cell.blocked;
}

export function isTraversable(grid: WarehouseGrid, x: number, y: number): boolean {
  if (x < 0 || x >= grid.width || y < 0 || y >= grid.height) return false;
  return isCellTraversable(grid.cells[y][x]);
}

export function cellIndex(width: number, x: number, y: number): number {
  return y * width + x;
}

/**
 * Computes exact 2D obstacle-aware shortest path distances from every cell to `goal`
 * using reverse BFS. Returns a Float64Array of size width * height (Infinity if unreachable).
 */
export function computeReverseBfsMap(grid: WarehouseGrid, goal: Point): Float64Array {
  const total = grid.width * grid.height;
  const dist = new Float64Array(total);
  dist.fill(Infinity);

  if (!isTraversable(grid, goal.x, goal.y)) {
    return dist;
  }

  const queue = new Int32Array(total);
  let head = 0;
  let tail = 0;

  const goalIdx = cellIndex(grid.width, goal.x, goal.y);
  dist[goalIdx] = 0;
  queue[tail++] = goalIdx;

  const dirs = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ];

  while (head < tail) {
    const curr = queue[head++];
    const cx = curr % grid.width;
    const cy = Math.floor(curr / grid.width);
    const nextDist = dist[curr] + 1;

    for (let d = 0; d < 4; d++) {
      const nx = cx + dirs[d][0];
      const ny = cy + dirs[d][1];
      if (!isTraversable(grid, nx, ny)) continue;
      const nIdx = cellIndex(grid.width, nx, ny);
      if (dist[nIdx] > nextDist) {
        dist[nIdx] = nextDist;
        queue[tail++] = nIdx;
      }
    }
  }

  return dist;
}

export class ReservationTable {
  private readonly vertex = new Map<number, Map<number, string>>();
  private readonly edge = new Map<number, Map<string, string>>();
  private readonly terminal = new Map<number, { robotId: string; fromTime: number }>();
  private maxTime = 0;

  constructor(private readonly width: number) {}

  clear(): void {
    this.vertex.clear();
    this.edge.clear();
    this.terminal.clear();
    this.maxTime = 0;
  }

  getMaxReservedTime(): number {
    return this.maxTime;
  }

  reserveVertex(robotId: string, x: number, y: number, t: number): void {
    const idx = cellIndex(this.width, x, y);
    let tMap = this.vertex.get(t);
    if (!tMap) {
      tMap = new Map<number, string>();
      this.vertex.set(t, tMap);
    }
    tMap.set(idx, robotId);
    if (t > this.maxTime) this.maxTime = t;
  }

  reserveEdge(robotId: string, fromX: number, fromY: number, toX: number, toY: number, fromT: number): void {
    if (fromX === toX && fromY === toY) return;
    const fromIdx = cellIndex(this.width, fromX, fromY);
    const toIdx = cellIndex(this.width, toX, toY);
    let eMap = this.edge.get(fromT);
    if (!eMap) {
      eMap = new Map<string, string>();
      this.edge.set(fromT, eMap);
    }
    eMap.set(`${fromIdx}->${toIdx}`, robotId);
    if (fromT + 1 > this.maxTime) this.maxTime = fromT + 1;
  }

  reserveTerminal(robotId: string, x: number, y: number, fromTime: number): void {
    const idx = cellIndex(this.width, x, y);
    this.terminal.set(idx, { robotId, fromTime });
    if (fromTime > this.maxTime) this.maxTime = fromTime;
  }

  reservePath(robotId: string, path: TimePoint[], holdTerminal = true): void {
    if (path.length === 0) return;
    for (let i = 0; i < path.length; i++) {
      const wp = path[i];
      this.reserveVertex(robotId, wp.x, wp.y, wp.t);
      if (i > 0) {
        const prev = path[i - 1];
        this.reserveEdge(robotId, prev.x, prev.y, wp.x, wp.y, prev.t);
      }
    }
    if (holdTerminal) {
      const last = path[path.length - 1];
      this.reserveTerminal(robotId, last.x, last.y, last.t);
    }
  }

  getTerminalHolder(x: number, y: number): { robotId: string; fromTime: number } | null {
    const idx = cellIndex(this.width, x, y);
    return this.terminal.get(idx) ?? null;
  }

  getVertexBlocker(robotId: string, x: number, y: number, t: number): string | null {
    const idx = cellIndex(this.width, x, y);
    const vOcc = this.vertex.get(t)?.get(idx);
    if (vOcc && vOcc !== robotId) return vOcc;
    const hold = this.terminal.get(idx);
    if (hold && hold.robotId !== robotId && t >= hold.fromTime) {
      return hold.robotId;
    }
    return null;
  }

  getEdgeSwapBlocker(
    robotId: string,
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    fromT: number
  ): string | null {
    if (fromX === toX && fromY === toY) return null;
    const fromIdx = cellIndex(this.width, fromX, fromY);
    const toIdx = cellIndex(this.width, toX, toY);
    const occ = this.edge.get(fromT)?.get(`${toIdx}->${fromIdx}`);
    if (occ && occ !== robotId) return occ;
    return null;
  }

  canTransition(
    robotId: string,
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    fromT: number
  ): boolean {
    const toT = fromT + 1;
    if (this.getVertexBlocker(robotId, toX, toY, toT) !== null) return false;
    if (this.getEdgeSwapBlocker(robotId, fromX, fromY, toX, toY, fromT) !== null) return false;
    return true;
  }

  /**
   * Checks whether `robotId` can safely remain indefinitely at `(x, y)` starting at `fromTime`
   * without colliding with any future reservation by another robot.
   */
  canHoldTerminally(robotId: string, x: number, y: number, fromTime: number): boolean {
    const idx = cellIndex(this.width, x, y);
    const hold = this.terminal.get(idx);
    if (hold && hold.robotId !== robotId) {
      return false;
    }
    for (let t = fromTime; t <= this.maxTime; t++) {
      const vOcc = this.vertex.get(t)?.get(idx);
      if (vOcc && vOcc !== robotId) {
        return false;
      }
    }
    return true;
  }
}

interface AStarNode {
  x: number;
  y: number;
  t: number;
  dir: number; // 0: wait/none, 1..4: N/S/E/W
  g: number;
  f: number;
  parent: AStarNode | null;
}

const MOVES: Array<{ dx: number; dy: number; dir: number }> = [
  { dx: 1, dy: 0, dir: 1 },
  { dx: -1, dy: 0, dir: 2 },
  { dx: 0, dy: 1, dir: 3 },
  { dx: 0, dy: -1, dir: 4 },
  { dx: 0, dy: 0, dir: 0 }, // wait in place
];

export interface PathSearchResult {
  path: TimePoint[] | null;
  staticReachable: boolean;
  blockedByRobots: Set<string>;
}

/**
 * Space-Time A* pathfinder avoiding walls, shelves, blocked cells, vertex conflicts,
 * edge-swap conflicts, and terminal resting holds.
 */
export function findSpaceTimePath(
  grid: WarehouseGrid,
  reservations: ReservationTable,
  robotId: string,
  start: Point,
  goal: Point,
  startTime: number,
  options?: {
    maxHorizon?: number;
    holdGoalTerminally?: boolean;
    extraDwellTicks?: number;
    distMap?: Float64Array;
  }
): PathSearchResult {
  const holdGoalTerminally = options?.holdGoalTerminally ?? true;
  const extraDwellTicks = options?.extraDwellTicks ?? 0;

  const distMap = options?.distMap ?? computeReverseBfsMap(grid, goal);
  const startIdx = cellIndex(grid.width, start.x, start.y);
  const staticDist = distMap[startIdx];

  if (!isTraversable(grid, start.x, start.y) || !Number.isFinite(staticDist)) {
    return { path: null, staticReachable: false, blockedByRobots: new Set() };
  }

  // O(1) bailout: if goal has an indefinite terminal hold by another robot, no future t can hold it
  if (holdGoalTerminally) {
    const holder = reservations.getTerminalHolder(goal.x, goal.y);
    if (holder && holder.robotId !== robotId) {
      return {
        path: null,
        staticReachable: true,
        blockedByRobots: new Set([holder.robotId]),
      };
    }
  }

  const blockedByRobots = new Set<string>();
  const smartHorizon = options?.maxHorizon ?? Math.max(45, Math.min(DEFAULT_MAX_HORIZON, Math.ceil(staticDist) + 45));
  const maxTime = startTime + smartHorizon;

  const canFinishAt = (x: number, y: number, t: number): boolean => {
    if (x !== goal.x || y !== goal.y) return false;
    // Ensure dwell ticks at goal are conflict-free
    for (let dt = 1; dt <= extraDwellTicks; dt++) {
      if (reservations.getVertexBlocker(robotId, x, y, t + dt) !== null) {
        return false;
      }
    }
    if (holdGoalTerminally) {
      return reservations.canHoldTerminally(robotId, x, y, t + extraDwellTicks);
    }
    return true;
  };

  // Early check if already at goal and can hold
  if (canFinishAt(start.x, start.y, startTime)) {
    const path: TimePoint[] = [{ x: start.x, y: start.y, t: startTime }];
    for (let dt = 1; dt <= extraDwellTicks; dt++) {
      path.push({ x: start.x, y: start.y, t: startTime + dt });
    }
    return { path, staticReachable: true, blockedByRobots };
  }

  const open = new MinHeap<AStarNode>((a, b) => {
    if (a.f !== b.f) return a.f - b.f;
    if (a.t !== b.t) return a.t - b.t;
    return a.g - b.g;
  });

  // Key: `${x},${y},${t}` -> best g
  const bestG = new Map<string, number>();

  const root: AStarNode = {
    x: start.x,
    y: start.y,
    t: startTime,
    dir: 0,
    g: 0,
    f: staticDist,
    parent: null,
  };
  open.push(root);
  bestG.set(`${start.x},${start.y},${startTime}`, 0);

  while (open.size > 0) {
    const curr = open.pop()!;
    const currKey = `${curr.x},${curr.y},${curr.t}`;
    const recorded = bestG.get(currKey);
    if (recorded !== undefined && curr.g > recorded) continue;

    if (canFinishAt(curr.x, curr.y, curr.t)) {
      const path: TimePoint[] = [];
      let trace: AStarNode | null = curr;
      while (trace) {
        path.push({ x: trace.x, y: trace.y, t: trace.t });
        trace = trace.parent;
      }
      path.reverse();
      for (let dt = 1; dt <= extraDwellTicks; dt++) {
        path.push({ x: curr.x, y: curr.y, t: curr.t + dt });
      }
      return { path, staticReachable: true, blockedByRobots };
    }

    if (curr.t >= maxTime) continue;

    const nextT = curr.t + 1;

    for (let m = 0; m < MOVES.length; m++) {
      const move = MOVES[m];
      const nx = curr.x + move.dx;
      const ny = curr.y + move.dy;

      if (!isTraversable(grid, nx, ny)) continue;
      const h = distMap[cellIndex(grid.width, nx, ny)];
      if (!Number.isFinite(h)) continue;

      // Pruning: cannot possibly reach goal before maxTime
      if (nextT + h > maxTime) continue;

      // Check space-time reservations
      const vBlocker = reservations.getVertexBlocker(robotId, nx, ny, nextT);
      if (vBlocker !== null) {
        blockedByRobots.add(vBlocker);
        continue;
      }
      const eBlocker = reservations.getEdgeSwapBlocker(robotId, curr.x, curr.y, nx, ny, curr.t);
      if (eBlocker !== null) {
        blockedByRobots.add(eBlocker);
        continue;
      }

      // Cost is 1 time unit per step, plus tiny (<1e-3) tie-breakers for smooth movement
      let stepPenalty = 0;
      if (move.dir === 0) {
        stepPenalty = 0.0004; // slight preference to move rather than wait needlessly
      } else if (curr.dir !== 0 && curr.dir !== move.dir) {
        stepPenalty = 0.0002; // slight preference for straight aisles over zigzags
      }

      const nextG = curr.g + 1 + stepPenalty;
      const nextKey = `${nx},${ny},${nextT}`;
      const prevBest = bestG.get(nextKey);
      if (prevBest !== undefined && prevBest <= nextG) continue;

      bestG.set(nextKey, nextG);
      open.push({
        x: nx,
        y: ny,
        t: nextT,
        dir: move.dir,
        g: nextG,
        f: nextG + h,
        parent: curr,
      });
    }
  }

  return { path: null, staticReachable: true, blockedByRobots };
}

/**
 * Finds the best unconstrained 2D next step toward `goal` so we can accurately explain
 * WHICH robot/reservation caused a robot to wait in place at `currPos`.
 */
export function inferWaitBlocker(
  grid: WarehouseGrid,
  reservations: ReservationTable,
  robotId: string,
  currPos: Point,
  goal: Point,
  currentTime: number,
  distMap?: Float64Array
): { blockerId: string | null; desiredCell: Point | null } {
  const map = distMap ?? computeReverseBfsMap(grid, goal);
  const currDist = map[cellIndex(grid.width, currPos.x, currPos.y)];

  let bestNeighbor: Point | null = null;
  let bestDist = currDist;

  for (let m = 0; m < 4; m++) {
    const nx = currPos.x + MOVES[m].dx;
    const ny = currPos.y + MOVES[m].dy;
    if (!isTraversable(grid, nx, ny)) continue;
    const nd = map[cellIndex(grid.width, nx, ny)];
    if (nd < bestDist) {
      bestDist = nd;
      bestNeighbor = { x: nx, y: ny };
    }
  }

  if (!bestNeighbor) {
    return { blockerId: null, desiredCell: null };
  }

  const vBlocker = reservations.getVertexBlocker(
    robotId,
    bestNeighbor.x,
    bestNeighbor.y,
    currentTime + 1
  );
  if (vBlocker) {
    return { blockerId: vBlocker, desiredCell: bestNeighbor };
  }

  const eBlocker = reservations.getEdgeSwapBlocker(
    robotId,
    currPos.x,
    currPos.y,
    bestNeighbor.x,
    bestNeighbor.y,
    currentTime
  );
  if (eBlocker) {
    return { blockerId: eBlocker, desiredCell: bestNeighbor };
  }

  return { blockerId: null, desiredCell: bestNeighbor };
}

/**
 * Finds the nearest reachable safe resting cell (preferring homeBay, then open non-bottleneck floor/staging)
 * when a robot must evacuate a bottleneck or wait safely while its target is unreachable.
 */
export function findSafeHoldPath(
  grid: WarehouseGrid,
  reservations: ReservationTable,
  robotId: string,
  start: Point,
  preferredBays: Point[],
  startTime: number
): TimePoint[] | null {
  // Try preferred staging bays first
  for (const bay of preferredBays) {
    if (!isTraversable(grid, bay.x, bay.y)) continue;
    const res = findSpaceTimePath(grid, reservations, robotId, start, bay, startTime, {
      maxHorizon: 80,
      holdGoalTerminally: true,
    });
    if (res.path) return res.path;
  }

  // Fallback: BFS outward from start for any non-bottleneck traversable FLOOR/STAGING cell we can terminally hold
  const visited = new Set<number>();
  const queue: Point[] = [start];
  visited.add(cellIndex(grid.width, start.x, start.y));

  while (queue.length > 0) {
    const p = queue.shift()!;
    const cell = grid.cells[p.y][p.x];
    if (!cell.bottleneck && (cell.type === 'FLOOR' || cell.type === 'STAGING')) {
      const res = findSpaceTimePath(grid, reservations, robotId, start, p, startTime, {
        maxHorizon: 60,
        holdGoalTerminally: true,
      });
      if (res.path) return res.path;
    }

    for (let m = 0; m < 4; m++) {
      const nx = p.x + MOVES[m].dx;
      const ny = p.y + MOVES[m].dy;
      if (!isTraversable(grid, nx, ny)) continue;
      const idx = cellIndex(grid.width, nx, ny);
      if (!visited.has(idx)) {
        visited.add(idx);
        queue.push({ x: nx, y: ny });
      }
    }
  }

  return null;
}

/**
 * Finds the nearest reachable non-bottleneck FLOOR/STAGING cell near `target`
 * that has no conflicting terminal reservation, used when `target` (e.g. a workstation)
 * is temporarily claimed by another robot.
 */
export function findNearestStagingNearTarget(
  grid: WarehouseGrid,
  reservations: ReservationTable,
  robotId: string,
  start: Point,
  target: Point,
  startTime: number,
  targetDistMap?: Float64Array
): TimePoint[] | null {
  const distToTarget = targetDistMap ?? computeReverseBfsMap(grid, target);
  const candidates: Array<{ pt: Point; dist: number }> = [];

  for (let y = 0; y < grid.height; y++) {
    for (let x = 0; x < grid.width; x++) {
      if (x === target.x && y === target.y) continue;
      const cell = grid.cells[y][x];
      if (!isTraversable(grid, x, y)) continue;
      if (cell.bottleneck || cell.type === 'WORKSTATION' || cell.type === 'PICKUP') continue;
      const d = distToTarget[cellIndex(grid.width, x, y)];
      if (!Number.isFinite(d)) continue;
      const holder = reservations.getTerminalHolder(x, y);
      if (holder && holder.robotId !== robotId) continue;
      candidates.push({ pt: { x, y }, dist: d });
    }
  }

  candidates.sort((a, b) => a.dist - b.dist);

  // Try top 12 closest staging cells around target
  const limit = Math.min(12, candidates.length);
  for (let i = 0; i < limit; i++) {
    const res = findSpaceTimePath(grid, reservations, robotId, start, candidates[i].pt, startTime, {
      maxHorizon: 80,
      holdGoalTerminally: true,
    });
    if (res.path) return res.path;
  }

  return null;
}
