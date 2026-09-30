// Deterministic warehouse map generation.
//
// Layout (28 x 18 cells):
//   - solid wall ring
//   - 20 shelves, each a 1x2 cell block, placed in two bands (y=3..4 and y=9..10)
//     at even columns x = 2,4,...,20
//   - the columns between shelves (x = 1,3,5,...,21) are entirely floor: they form
//     twelve ONE-CELL-WIDE bottleneck aisles running the full height of the map
//   - 4 workstations on the right hand side (x = 24)
//   - 12 robots parked along the bottom apron (y = 13)
//
// Everything is a pure function of the constants below, so every run with the same
// seed rebuilds a bit-identical world.

export const CELL_FLOOR = 0;
export const CELL_WALL = 1;
export const CELL_SHELF = 2;
export const CELL_WORKSTATION = 3;

export const MAP_WIDTH = 28;
export const MAP_HEIGHT = 18;

export const ROBOT_COUNT = 12;
export const SHELF_BANDS = [3, 9];
export const SHELVES_PER_BAND = 10;
export const WORKSTATION_CELLS = [
  [24, 2],
  [24, 6],
  [24, 11],
  [24, 15],
];
export const ROBOT_START_CELLS = [
  [2, 13],
  [4, 13],
  [6, 13],
  [8, 13],
  [10, 13],
  [12, 13],
  [14, 13],
  [16, 13],
  [18, 13],
  [20, 13],
  [23, 13],
  [25, 13],
];

export const CELL_NAMES = {
  [CELL_FLOOR]: 'floor',
  [CELL_WALL]: 'wall',
  [CELL_SHELF]: 'shelf',
  [CELL_WORKSTATION]: 'workstation',
};

export function cellIndex(x, y, width = MAP_WIDTH) {
  return y * width + x;
}

export function buildWarehouse() {
  const width = MAP_WIDTH;
  const height = MAP_HEIGHT;
  const grid = new Uint8Array(width * height); // CELL_FLOOR
  const index = (x, y) => y * width + x;

  for (let x = 0; x < width; x++) {
    grid[index(x, 0)] = CELL_WALL;
    grid[index(x, height - 1)] = CELL_WALL;
  }
  for (let y = 0; y < height; y++) {
    grid[index(0, y)] = CELL_WALL;
    grid[index(width - 1, y)] = CELL_WALL;
  }

  const shelves = [];
  let shelfNo = 0;
  for (const baseY of SHELF_BANDS) {
    for (let i = 0; i < SHELVES_PER_BAND; i++) {
      const x = 2 + i * 2;
      shelfNo += 1;
      const shelf = {
        id: `SH-${String(shelfNo).padStart(2, '0')}`,
        label: `S${shelfNo}`,
        x,
        y: baseY,
        w: 1,
        h: 2,
        cells: [index(x, baseY), index(x, baseY + 1)],
        state: 'available',
        pickup: null,
      };
      for (let dy = 0; dy < 2; dy++) grid[index(x, baseY + dy)] = CELL_SHELF;
      shelves.push(shelf);
    }
  }

  const workstations = [];
  WORKSTATION_CELLS.forEach(([x, y], i) => {
    grid[index(x, y)] = CELL_WORKSTATION;
    workstations.push({ id: `WS-${String(i + 1).padStart(2, '0')}`, label: `W${i + 1}`, x, y, w: 1, h: 1, cell: index(x, y) });
  });

  const staticTraversable = (x, y) => {
    const c = grid[index(x, y)];
    return c === CELL_FLOOR || c === CELL_WORKSTATION;
  };

  // One-cell-wide vertical aisles: a whole column of floor cells that touches a
  // shelf on the left or on the right.
  const laneIdByCell = new Int16Array(width * height).fill(-1);
  const lanes = [];
  for (let x = 1; x < width - 1; x++) {
    let allFloor = true;
    for (let y = 1; y < height - 1; y++) {
      if (grid[index(x, y)] !== CELL_FLOOR) {
        allFloor = false;
        break;
      }
    }
    if (!allFloor) continue;
    const touchesShelf =
      (x > 1 && shelves.some((s) => s.x === x - 1)) || (x < width - 2 && shelves.some((s) => s.x === x + 1));
    if (!touchesShelf) continue;
    const lane = { id: lanes.length, axis: 'v', x, cells: [], name: `aisle-${x}` };
    for (let y = 1; y < height - 1; y++) {
      const c = index(x, y);
      laneIdByCell[c] = lane.id;
      lane.cells.push(c);
    }
    lanes.push(lane);
  }

  // Pickup cells: a deterministic free cell adjacent to each shelf, preferring a
  // non-lane cell (below, above, right, left).
  for (const shelf of shelves) {
    const candidates = [
      [shelf.x, shelf.y + shelf.h],
      [shelf.x, shelf.y - 1],
      [shelf.x + shelf.w, shelf.y],
      [shelf.x - 1, shelf.y],
      [shelf.x + shelf.w, shelf.y + shelf.h - 1],
      [shelf.x - 1, shelf.y + shelf.h - 1],
    ];
    let chosen = null;
    for (const preferNonLane of [true, false]) {
      for (const [cx, cy] of candidates) {
        if (cx < 0 || cy < 0 || cx >= width || cy >= height) continue;
        if (!staticTraversable(cx, cy)) continue;
        const c = index(cx, cy);
        if (preferNonLane && laneIdByCell[c] !== -1) continue;
        chosen = c;
        break;
      }
      if (chosen !== null) break;
    }
    shelf.pickup = chosen;
    if (chosen === null) throw new Error(`Shelf ${shelf.id} has no reachable pickup cell`);
  }

  const robots = ROBOT_START_CELLS.slice(0, ROBOT_COUNT).map(([x, y], i) => ({
    id: `R${String(i + 1).padStart(2, '0')}`,
    label: `R${i + 1}`,
    index: i,
    start: { x, y },
    home: cellIndex(x, y),
  }));

  return {
    width,
    height,
    grid,
    shelves,
    workstations,
    lanes,
    laneIdByCell,
    robots,
    cellIndex: (x, y) => index(x, y),
    cellName: (c) => CELL_NAMES[grid[c]] ?? 'floor',
    isStaticTraversable: staticTraversable,
    isTraversable: (x, y) => x >= 0 && y >= 0 && x < width && y < height && staticTraversable(x, y),
    shelfByCell: (() => {
      const map = new Map();
      for (const s of shelves) for (const c of s.cells) map.set(c, s);
      return map;
    })(),
  };
}
