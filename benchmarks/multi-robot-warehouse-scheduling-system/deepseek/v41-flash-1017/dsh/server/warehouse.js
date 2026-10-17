/**
 * Deterministic warehouse topology.
 *
 * The map is intentionally hand-built rather than fully random so that every
 * seed produces a valid operationally useful warehouse with:
 *   - 20 shelves in two-deep rack stacks
 *   - 4 one-cell-wide vertical aisles (the bottlenecks)
 *   - 4 workstations, 8 robot home bays
 *
 * The simulation seed still deterministically drives initial demo jobs and
 * every scheduling tie-break, so a reset with the same seed is reproducible.
 */

export const WIDTH = 18;
export const HEIGHT = 16;
export const TICK_MS = 650;

export const ROBOT_BLUEPRINTS = [
  { id: 'R1', name: 'ATLAS', color: '#5ee7c4', home: { x: 2, y: 4 } },
  { id: 'R2', name: 'VELA', color: '#6eb6ff', home: { x: 3, y: 10 } },
  { id: 'R3', name: 'ORION', color: '#ffb260', home: { x: 5, y: 10 } },
  { id: 'R4', name: 'MICA', color: '#c79bff', home: { x: 7, y: 10 } },
  { id: 'R5', name: 'NOVA', color: '#ff81a8', home: { x: 9, y: 10 } },
  { id: 'R6', name: 'JUNO', color: '#a8e063', home: { x: 11, y: 10 } },
  { id: 'R7', name: 'ECHO', color: '#66d9e8', home: { x: 13, y: 10 } },
  { id: 'R8', name: 'KITE', color: '#f2d76b', home: { x: 15, y: 4 } },
];

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function random() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffleSeeded(values, random) {
  const result = [...values];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export const cellKey = (x, y) => `${x},${y}`;
export const parseCellKey = (key) => {
  const [x, y] = key.split(',').map(Number);
  return { x, y };
};
export const manhattan = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);

export function generateWarehouse(rawSeed = 20261017) {
  const seed = Number.isFinite(Number(rawSeed)) ? Number(rawSeed) >>> 0 : 20261017;
  const terrain = Array.from({ length: HEIGHT }, (_, y) =>
    Array.from({ length: WIDTH }, (_, x) =>
      x === 0 || y === 0 || x === WIDTH - 1 || y === HEIGHT - 1 ? '#' : '.',
    ),
  );

  // The rack field. Five shelf columns with exactly one traversable cell
  // between them. The narrow lanes run vertically for four rows.
  const shelfColumns = [4, 6, 8, 10, 12];
  const shelfRows = [5, 6, 7, 8];
  const shelves = [];
  let shelfNumber = 0;
  for (const y of shelfRows) {
    for (const x of shelfColumns) {
      shelfNumber += 1;
      const id = `S${String(shelfNumber).padStart(2, '0')}`;
      // Pickup bays deliberately include narrow aisles.
      const pickupDx = x === 4 || x === 6 ? -1 : 1;
      shelves.push({
        id,
        x,
        y,
        rack: shelfColumns.indexOf(x) + 1,
        row: y - shelfRows[0] + 1,
        pickup: { x: x + pickupDx, y },
      });
      terrain[y][x] = 'S';
    }
  }

  const workstations = [
    { id: 'WS-A', name: 'ALPHA', x: 2, y: 2, accent: '#5ee7c4' },
    { id: 'WS-B', name: 'BRAVO', x: 15, y: 2, accent: '#6eb6ff' },
    { id: 'WS-C', name: 'CHARLIE', x: 2, y: 13, accent: '#ffb260' },
    { id: 'WS-D', name: 'DELTA', x: 15, y: 13, accent: '#c79bff' },
  ];
  for (const station of workstations) terrain[station.y][station.x] = 'W';

  const pickupByShelf = Object.fromEntries(
    shelves.map((shelf) => [shelf.id, shelf.pickup]),
  );
  const pickupPoints = shelves.map((shelf) => ({
    x: shelf.pickup.x,
    y: shelf.pickup.y,
    shelfId: shelf.id,
  }));

  const homes = ROBOT_BLUEPRINTS.map((robot) => ({ ...robot.home }));
  const narrowAisles = shelfColumns.slice(0, -1).map((column, index) => {
    const x = column + 1;
    return {
      id: `AISLE-${String.fromCharCode(65 + index)}`,
      name: `AISLE ${String.fromCharCode(65 + index)}`,
      x,
      yStart: shelfRows[0],
      yEnd: shelfRows[shelfRows.length - 1],
      orientation: 'vertical',
      cells: shelfRows.map((y) => ({ x, y })),
    };
  });

  return {
    version: 1,
    seed,
    width: WIDTH,
    height: HEIGHT,
    tickMs: TICK_MS,
    terrain,
    shelves,
    workstations,
    pickupByShelf,
    pickupPoints,
    homes,
    narrowAisles,
    robotBlueprints: ROBOT_BLUEPRINTS,
  };
}

export function isInside(warehouse, x, y) {
  return x >= 0 && y >= 0 && x < warehouse.width && y < warehouse.height;
}

export function isStaticTraversable(warehouse, x, y) {
  if (!isInside(warehouse, x, y)) return false;
  const cell = warehouse.terrain[y][x];
  return cell !== '#' && cell !== 'S';
}

/** Compute narrow-corridor components against the *live* traversable map. */
export function findNarrowCorridors(warehouse, blockedSet = new Set()) {
  const traversable = (x, y) =>
    isStaticTraversable(warehouse, x, y) && !blockedSet.has(cellKey(x, y));
  const narrow = [];
  for (let y = 1; y < warehouse.height - 1; y += 1) {
    for (let x = 1; x < warehouse.width - 1; x += 1) {
      if (!traversable(x, y)) continue;
      const left = traversable(x - 1, y);
      const right = traversable(x + 1, y);
      const up = traversable(x, y - 1);
      const down = traversable(x, y + 1);
      const vertical = !left && !right && up && down;
      const horizontal = !up && !down && left && right;
      if (vertical || horizontal) narrow.push({ x, y, orientation: vertical ? 'vertical' : 'horizontal' });
    }
  }

  const inNarrow = new Map(narrow.map((cell) => [cellKey(cell.x, cell.y), cell]));
  const groups = [];
  const visited = new Set();
  for (const start of narrow) {
    const sk = cellKey(start.x, start.y);
    if (visited.has(sk)) continue;
    const queue = [start];
    visited.add(sk);
    const cells = [];
    while (queue.length) {
      const current = queue.shift();
      cells.push({ x: current.x, y: current.y });
      for (const [dx, dy] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ]) {
        const nk = cellKey(current.x + dx, current.y + dy);
        if (inNarrow.has(nk) && !visited.has(nk)) {
          visited.add(nk);
          queue.push(inNarrow.get(nk));
        }
      }
    }
    cells.sort((a, b) => a.y - b.y || a.x - b.x);
    groups.push({
      id: `C${groups.length + 1}`,
      orientation: cells.length > 1 && cells[0].x === cells[cells.length - 1].x ? 'vertical' : 'horizontal',
      cells,
    });
  }
  const byCell = new Map();
  for (const group of groups) {
    for (const cell of group.cells) byCell.set(cellKey(cell.x, cell.y), group);
  }
  return { groups, byCell };
}
