import type { Point, Robot, WarehouseMap } from "../shared/types.js";

const key = (point: Point) => `${point.x},${point.y}`;

export function createWarehouse(seed = 73421): { map: WarehouseMap; robots: Robot[] } {
  const width = 26;
  const height = 18;
  const walls: Point[] = [];

  for (let x = 0; x < width; x += 1) {
    walls.push({ x, y: 0 }, { x, y: height - 1 });
  }
  for (let y = 1; y < height - 1; y += 1) {
    walls.push({ x: 0, y }, { x: width - 1, y });
  }

  // Zone dividers have one-cell gates. These gates are deliberate bottlenecks.
  const gateRows = new Set([4, 9, 14]);
  for (const x of [10, 17]) {
    for (let y = 2; y <= 15; y += 1) {
      if (!gateRows.has(y)) walls.push({ x, y });
    }
  }

  const shelfPositions: Point[] = [];
  for (const y of [3, 6, 10, 13]) {
    for (const x of [3, 6, 13, 20, 23]) shelfPositions.push({ x, y });
  }
  const shelves = shelfPositions.map((position, index) => ({
    id: `S-${String(index + 1).padStart(2, "0")}`,
    label: `S${String(index + 1).padStart(2, "0")}`,
    position,
    pickup: { x: position.x, y: position.y + 1 },
  }));

  const workstationData = [
    { x: 4, label: "PACK A", color: "#53e6b4" },
    { x: 9, label: "PACK B", color: "#78a8ff" },
    { x: 18, label: "PACK C", color: "#ffb85c" },
    { x: 23, label: "PACK D", color: "#dd88ff" },
  ];
  const workstations = workstationData.map((item, index) => ({
    id: `W-${index + 1}`,
    label: item.label,
    position: { x: item.x, y: 16 },
    color: item.color,
  }));

  const homes: Point[] = [
    { x: 2, y: 1 }, { x: 5, y: 1 }, { x: 8, y: 1 }, { x: 11, y: 1 },
    { x: 14, y: 1 }, { x: 18, y: 1 }, { x: 21, y: 1 }, { x: 24, y: 1 },
  ];
  const colors = ["#53e6b4", "#79a8ff", "#ffbd66", "#e888ff", "#ff718b", "#63d7ff", "#dbef63", "#ff8d55"];
  const robots: Robot[] = homes.map((home, index) => ({
    id: `R-${String(index + 1).padStart(2, "0")}`,
    name: `R${String(index + 1).padStart(2, "0")}`,
    color: colors[index],
    position: { ...home },
    home: { ...home },
    mode: "IDLE",
    jobId: null,
    goal: null,
    route: [{ ...home }],
    waitingReason: null,
    completedJobs: 0,
    distance: 0,
  }));

  const blockedSet = new Set(walls.map(key));
  if (shelves.some((shelf) => blockedSet.has(key(shelf.position)))) {
    throw new Error(`Seed ${seed} produced an invalid shelf layout`);
  }

  return {
    map: {
      width,
      height,
      walls,
      shelves,
      workstations,
      bottlenecks: [10, 17].flatMap((x) => [...gateRows].map((y) => ({ x, y }))),
      blocked: [],
    },
    robots,
  };
}

export const pointKey = key;
export const samePoint = (a: Point, b: Point) => a.x === b.x && a.y === b.y;
export const manhattan = (a: Point, b: Point) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
