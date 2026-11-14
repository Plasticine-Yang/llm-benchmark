import { makeRng, shuffled } from './rng.js';

export const CELL = { EMPTY: 0, WALL: 1, SHELF: 2, STATION: 3 };

export const GRID_W = 31;
export const GRID_H = 21;

const RACK_COLS = [3, 7, 11, 15, 19];
const RACK_ROWS = [3, 6, 9, 12, 15];
const RACK_W = 3;
const RACK_H = 2;

// Single-cell-wide service corridor behind the racks, pierced by exactly one gap.
const DIVIDER_X = 23;
const DIVIDER_GAP_Y = 9;

const STATION_SPOTS = [
  { id: 'W1', x: 27, y: 4 },
  { id: 'W2', x: 27, y: 13 },
  { id: 'W3', x: 5, y: 18 },
  { id: 'W4', x: 16, y: 18 },
];

const HOME_CANDIDATES = [
  [1, 2], [1, 6], [1, 10], [1, 14], [1, 18],
  [2, 1], [2, 19], [22, 1], [28, 1], [29, 2],
  [28, 19], [26, 18], [24, 18], [10, 18],
];

export const ROBOT_COUNT = 10;

export const idx = (x, y) => y * GRID_W + x;
export const xy = (i) => ({ x: i % GRID_W, y: Math.floor(i / GRID_W) });
export const inBounds = (x, y) => x >= 0 && y >= 0 && x < GRID_W && y < GRID_H;

const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

export function buildWarehouse(seed) {
  const rng = makeRng(seed);
  const cells = new Uint8Array(GRID_W * GRID_H).fill(CELL.EMPTY);

  for (let x = 0; x < GRID_W; x++) {
    cells[idx(x, 0)] = CELL.WALL;
    cells[idx(x, GRID_H - 1)] = CELL.WALL;
  }
  for (let y = 0; y < GRID_H; y++) {
    cells[idx(0, y)] = CELL.WALL;
    cells[idx(GRID_W - 1, y)] = CELL.WALL;
  }

  const shelves = [];
  let n = 0;
  for (const ry of RACK_ROWS) {
    for (const rx of RACK_COLS) {
      n += 1;
      const id = `S${String(n).padStart(2, '0')}`;
      for (let dy = 0; dy < RACK_H; dy++) {
        for (let dx = 0; dx < RACK_W; dx++) {
          cells[idx(rx + dx, ry + dy)] = CELL.SHELF;
        }
      }
      shelves.push({ id, x: rx, y: ry, w: RACK_W, h: RACK_H, faces: [] });
    }
  }

  for (let y = 2; y <= 16; y++) {
    if (y === DIVIDER_GAP_Y) continue;
    cells[idx(DIVIDER_X, y)] = CELL.WALL;
  }

  const stations = STATION_SPOTS.map((s) => ({ ...s }));
  for (const s of stations) cells[idx(s.x, s.y)] = CELL.STATION;

  // Seed-dependent pillars in the open staging area; never allowed to disconnect the map.
  const pillarCandidates = shuffled(
    [[25, 7], [25, 16], [27, 9], [26, 11], [24, 5], [28, 15], [8, 18], [13, 18], [20, 18], [3, 18]],
    rng,
  );
  for (const [px, py] of pillarCandidates.slice(0, 4)) {
    if (cells[idx(px, py)] !== CELL.EMPTY) continue;
    cells[idx(px, py)] = CELL.WALL;
    if (!isConnected(cells)) cells[idx(px, py)] = CELL.EMPTY;
  }

  const traversable = (x, y) =>
    inBounds(x, y) && (cells[idx(x, y)] === CELL.EMPTY || cells[idx(x, y)] === CELL.STATION);

  for (const shelf of shelves) {
    const seen = new Set();
    for (let dy = 0; dy < shelf.h; dy++) {
      for (let dx = 0; dx < shelf.w; dx++) {
        for (const [ox, oy] of DIRS) {
          const fx = shelf.x + dx + ox;
          const fy = shelf.y + dy + oy;
          if (!traversable(fx, fy)) continue;
          const k = idx(fx, fy);
          if (seen.has(k)) continue;
          seen.add(k);
          shelf.faces.push({ x: fx, y: fy });
        }
      }
    }
  }

  // A cell with <= 2 open neighbours is a bottleneck: entering it is penalised by the planner.
  const corridor = new Uint8Array(GRID_W * GRID_H);
  for (let y = 0; y < GRID_H; y++) {
    for (let x = 0; x < GRID_W; x++) {
      if (!traversable(x, y)) continue;
      let open = 0;
      for (const [ox, oy] of DIRS) if (traversable(x + ox, y + oy)) open++;
      corridor[idx(x, y)] = open <= 2 ? 1 : 0;
    }
  }

  const homes = shuffled(HOME_CANDIDATES, rng)
    .filter(([x, y]) => traversable(x, y))
    .slice(0, ROBOT_COUNT)
    .map(([x, y]) => ({ x, y }));

  const warehouse = {
    seed,
    w: GRID_W,
    h: GRID_H,
    cells,
    shelves,
    stations,
    homes,
    corridor,
    traversable,
  };
  if (!isConnected(cells)) throw new Error('generated warehouse is disconnected');
  return warehouse;
}

export function isConnected(cells) {
  let start = -1;
  let total = 0;
  for (let i = 0; i < cells.length; i++) {
    if (cells[i] === CELL.EMPTY || cells[i] === CELL.STATION) {
      total++;
      if (start < 0) start = i;
    }
  }
  if (start < 0) return false;
  const seen = new Uint8Array(cells.length);
  const queue = [start];
  seen[start] = 1;
  let count = 0;
  while (queue.length) {
    const cur = queue.pop();
    count++;
    const { x, y } = xy(cur);
    for (const [ox, oy] of DIRS) {
      const nx = x + ox;
      const ny = y + oy;
      if (!inBounds(nx, ny)) continue;
      const ni = idx(nx, ny);
      if (seen[ni]) continue;
      if (cells[ni] !== CELL.EMPTY && cells[ni] !== CELL.STATION) continue;
      seen[ni] = 1;
      queue.push(ni);
    }
  }
  return count === total;
}

export function isBlockedType(t) {
  return t === CELL.WALL || t === CELL.SHELF;
}

// Static public description of the map (sent once to the client).
export function describeWarehouse(wh) {
  return {
    w: wh.w,
    h: wh.h,
    cells: Array.from(wh.cells),
    corridor: Array.from(wh.corridor),
    shelves: wh.shelves.map((s) => ({ id: s.id, x: s.x, y: s.y, w: s.w, h: s.h, faces: s.faces })),
    stations: wh.stations.map((s) => ({ id: s.id, x: s.x, y: s.y })),
    homes: wh.homes,
    robotCount: wh.homes.length,
    cellTypes: CELL,
  };
}