import {
  DEFAULT_SEED,
  GridCell,
  Point,
  RobotState,
  ShelfInfo,
  WarehouseGrid,
  WorkstationInfo,
} from '../shared/types.js';
import { createPrng, SeededPrng } from './prng.js';

export const GRID_WIDTH = 24;
export const GRID_HEIGHT = 15;

const ROBOT_COLORS = [
  '#38BDF8', // R-01 Sky
  '#F59E0B', // R-02 Amber
  '#34D399', // R-03 Emerald
  '#A78BFA', // R-04 Violet
  '#FB7185', // R-05 Rose
  '#2DD4BF', // R-06 Teal
  '#FBBF24', // R-07 Gold
  '#60A5FA', // R-08 Blue
  '#E879F9', // R-09 Fuchsia
  '#4ADE80', // R-10 Lime
];

const SKU_CATALOG = [
  'Servo Actuators',
  'LiDAR Modules',
  'Controller PCBs',
  'Power Packs',
  'Optical Sensors',
  'Stepper Drives',
  'Thermal Paste',
  'Encoder Rings',
  'Relay Boards',
  'Chassis Brackets',
  'Cooling Fans',
  'Harness Kits',
  'Bearing Sets',
  'Gantry Belts',
  'Bus Couplers',
  'Gripper Pads',
  'RFID Scanners',
  'Safety Scanners',
  'DC Converters',
  'Aluminum Rails',
  'Torque Couplings',
  'Vision Cameras',
  'Limit Switches',
  'Dock Connectors',
];

const WORKSTATION_NAMES = [
  'Packing Line A',
  'Packing Line B',
  'QC Inspection',
  'Outbound Dock 1',
  'Outbound Dock 2',
  'Express Dispatch',
];

export interface GeneratedWarehouse {
  grid: WarehouseGrid;
  robots: RobotState[];
  prngState: number;
}

export function generateWarehouse(seed: string = DEFAULT_SEED): GeneratedWarehouse {
  const prng: SeededPrng = createPrng(seed);

  // Initialize 24x15 grid with FLOOR inside and WALL on perimeter
  const cells: GridCell[][] = [];
  for (let y = 0; y < GRID_HEIGHT; y++) {
    const row: GridCell[] = [];
    for (let x = 0; x < GRID_WIDTH; x++) {
      const isBorder = x === 0 || x === GRID_WIDTH - 1 || y === 0 || y === GRID_HEIGHT - 1;
      row.push({
        x,
        y,
        type: isBorder ? 'WALL' : 'FLOOR',
        blocked: false,
        bottleneck: false,
      });
    }
    cells.push(row);
  }

  // Deterministic bottleneck tunnel rows (1-cell-wide, 3-cells-long corridors)
  const westNorthTunnelY = seed === DEFAULT_SEED ? 3 : prng.nextInt(2, 3);
  const westMidTunnelY = 7;
  const westSouthTunnelY = seed === DEFAULT_SEED ? 11 : prng.nextInt(11, 12);

  const eastNorthTunnelY = seed === DEFAULT_SEED ? 2 : prng.nextInt(1, 3);
  const eastMidTunnelY = 7;
  const eastSouthTunnelY = seed === DEFAULT_SEED ? 12 : prng.nextInt(11, 13);

  const bottleneckCells: Point[] = [];

  // West Bottleneck Divider Wall (x = 3..5)
  const westOpenRows = new Set([westNorthTunnelY, westMidTunnelY, westSouthTunnelY]);
  for (let y = 1; y < GRID_HEIGHT - 1; y++) {
    for (let x = 3; x <= 5; x++) {
      if (westOpenRows.has(y)) {
        cells[y][x].type = 'FLOOR';
        cells[y][x].bottleneck = true;
        bottleneckCells.push({ x, y });
      } else {
        cells[y][x].type = 'WALL';
      }
    }
  }

  // East Bottleneck Divider Wall (x = 15..17)
  const eastOpenRows = new Set([eastNorthTunnelY, eastMidTunnelY, eastSouthTunnelY]);
  for (let y = 1; y < GRID_HEIGHT - 1; y++) {
    for (let x = 15; x <= 17; x++) {
      if (eastOpenRows.has(y)) {
        cells[y][x].type = 'FLOOR';
        cells[y][x].bottleneck = true;
        bottleneckCells.push({ x, y });
      } else {
        cells[y][x].type = 'WALL';
      }
    }
  }

  // Shuffle SKU catalog deterministically (keep S-01..S-24 order stable, vary SKU assignment deterministically)
  const skus = [...SKU_CATALOG];
  for (let i = skus.length - 1; i > 0; i--) {
    const j = prng.nextInt(0, i);
    [skus[i], skus[j]] = [skus[j], skus[i]];
  }

  // 24 Shelves in 4 rows x 6 columns (Left bank x=7..9, Right bank x=11..13)
  // Row 1 (y=2) -> pickup at y=1
  // Row 2 (y=4) -> pickup at y=3 (1-cell-wide North picking aisle)
  // Row 3 (y=10) -> pickup at y=11 (1-cell-wide South picking aisle)
  // Row 4 (y=12) -> pickup at y=13
  const shelfSpecs: Array<{ y: number; pickupY: number; xs: number[] }> = [
    { y: 2, pickupY: 1, xs: [7, 8, 9, 11, 12, 13] },
    { y: 4, pickupY: 3, xs: [7, 8, 9, 11, 12, 13] },
    { y: 10, pickupY: 11, xs: [7, 8, 9, 11, 12, 13] },
    { y: 12, pickupY: 13, xs: [7, 8, 9, 11, 12, 13] },
  ];

  const shelves: ShelfInfo[] = [];
  let shelfNum = 1;

  for (const spec of shelfSpecs) {
    for (const x of spec.xs) {
      const id = `S-${String(shelfNum).padStart(2, '0')}`;
      const zone: ShelfInfo['zone'] =
        spec.y < 7 ? (x < 10 ? 'NW' : 'NE') : x < 10 ? 'SW' : 'SE';
      const sku = skus[(shelfNum - 1) % skus.length];

      cells[spec.y][x].type = 'SHELF';
      cells[spec.y][x].shelfId = id;

      cells[spec.pickupY][x].type = 'PICKUP';
      cells[spec.pickupY][x].pickupForShelfId = id;

      shelves.push({
        id,
        sku,
        cell: { x, y: spec.y },
        pickupCell: { x, y: spec.pickupY },
        zone,
      });
      shelfNum++;
    }
  }

  // Mark 1-cell-wide picking aisles (y=3 and y=11 between shelf rows) and central cross-aisle (x=10) as bottleneck cells
  for (const x of [7, 8, 9, 11, 12, 13]) {
    for (const y of [3, 11]) {
      if (!cells[y][x].bottleneck) {
        cells[y][x].bottleneck = true;
        bottleneckCells.push({ x, y });
      }
    }
  }
  for (const y of [2, 3, 4, 10, 11, 12]) {
    if (!cells[y][10].bottleneck) {
      cells[y][10].bottleneck = true;
      bottleneckCells.push({ x: 10, y });
    }
  }

  // 6 Workstations at x=22, y=2, 4, 6, 8, 10, 12
  const workstationYs = [2, 4, 6, 8, 10, 12];
  const workstations: WorkstationInfo[] = workstationYs.map((y, idx) => {
    const id = `WS-${idx + 1}`;
    cells[y][22].type = 'WORKSTATION';
    cells[y][22].workstationId = id;
    return {
      id,
      name: WORKSTATION_NAMES[idx],
      cell: { x: 22, y },
    };
  });

  // 10 Robot Staging Bays at x=1, y=1..5 and y=9..13
  const bayYs = [1, 2, 3, 4, 5, 9, 10, 11, 12, 13];
  const stagingBays: Point[] = bayYs.map((y) => ({ x: 1, y }));

  const robots: RobotState[] = stagingBays.map((bay, idx) => {
    const id = `R-${String(idx + 1).padStart(2, '0')}`;
    cells[bay.y][bay.x].type = 'STAGING';
    cells[bay.y][bay.x].stagingForRobotId = id;
    return {
      id,
      color: ROBOT_COLORS[idx % ROBOT_COLORS.length],
      pos: { ...bay },
      homeBay: { ...bay },
      heading: 'E',
      phase: 'IDLE',
      status: 'IDLE',
      currentJobId: null,
      targetShelfId: null,
      targetWorkstationId: null,
      carryingShelfId: null,
      dwellRemaining: 0,
      plannedPath: [{ x: bay.x, y: bay.y, t: 0 }],
      waitReason: null,
      waitReasonCode: 'NONE',
      waitTicks: 0,
      totalWaitTicks: 0,
      totalDistance: 0,
      completedJobs: 0,
      replannedAtTick: null,
    };
  });

  return {
    grid: {
      width: GRID_WIDTH,
      height: GRID_HEIGHT,
      cells,
      shelves,
      workstations,
      stagingBays,
      bottleneckCells,
    },
    robots,
    prngState: prng.getState(),
  };
}
