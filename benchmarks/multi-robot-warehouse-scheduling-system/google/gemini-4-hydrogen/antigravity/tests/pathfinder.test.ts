import { describe, expect, it } from 'vitest';
import { DEFAULT_SEED } from '../src/shared/types.js';
import {
  computeReverseBfsMap,
  findSpaceTimePath,
  isTraversable,
  ReservationTable,
} from '../src/server/pathfinder.js';
import { generateWarehouse } from '../src/server/warehouseGenerator.js';

describe('Warehouse Generator & Space-Time Pathfinder', () => {
  it('generates deterministic warehouse meeting all structural minimums', () => {
    const w1 = generateWarehouse(DEFAULT_SEED);
    const w2 = generateWarehouse(DEFAULT_SEED);

    expect(w1.robots.length).toBeGreaterThanOrEqual(8);
    expect(w1.grid.shelves.length).toBeGreaterThanOrEqual(20);
    expect(w1.grid.workstations.length).toBeGreaterThanOrEqual(4);
    expect(w1.grid.bottleneckCells.length).toBeGreaterThan(0);

    // Every shelf has a traversable adjacent pickup pad and shelf cell itself is non-traversable
    for (const shelf of w1.grid.shelves) {
      expect(isTraversable(w1.grid, shelf.cell.x, shelf.cell.y)).toBe(false);
      expect(isTraversable(w1.grid, shelf.pickupCell.x, shelf.pickupCell.y)).toBe(true);
      const dist =
        Math.abs(shelf.cell.x - shelf.pickupCell.x) + Math.abs(shelf.cell.y - shelf.pickupCell.y);
      expect(dist).toBe(1);
    }

    // Same seed produces identical layout and robot starting bays
    expect(w1.robots.map((r) => r.pos)).toEqual(w2.robots.map((r) => r.pos));
    expect(w1.grid.shelves).toEqual(w2.grid.shelves);
    expect(w1.grid.workstations).toEqual(w2.grid.workstations);
  });

  it('never crosses walls, shelves, or blocked cells', () => {
    const { grid } = generateWarehouse(DEFAULT_SEED);
    // Block central tunnel (4,7)
    grid.cells[7][4].blocked = true;

    const table = new ReservationTable(grid.width);
    const res = findSpaceTimePath(grid, table, 'R-01', { x: 2, y: 7 }, { x: 6, y: 7 }, 0);
    expect(res.staticReachable).toBe(true);
    expect(res.path).not.toBeNull();

    for (const wp of res.path!) {
      expect(isTraversable(grid, wp.x, wp.y)).toBe(true);
      expect(wp.x === 4 && wp.y === 7).toBe(false);
    }
  });

  it('prevents head-on vertex and swap conflicts inside a 1-cell-wide bottleneck aisle', () => {
    const { grid } = generateWarehouse(DEFAULT_SEED);
    const table = new ReservationTable(grid.width);

    // R-01 goes West -> East through central narrow tunnel (3,7)-(4,7)-(5,7)
    const r1 = findSpaceTimePath(grid, table, 'R-01', { x: 2, y: 7 }, { x: 6, y: 7 }, 0);
    expect(r1.path).not.toBeNull();
    table.reservePath('R-01', r1.path!, true);

    // R-02 goes East -> West through the same region starting at t=0
    const r2 = findSpaceTimePath(grid, table, 'R-02', { x: 6, y: 7 }, { x: 2, y: 7 }, 0);
    expect(r2.path).not.toBeNull();
    table.reservePath('R-02', r2.path!, true);

    // Verify no vertex or edge-swap collision across entire timeline
    const maxT = Math.max(
      r1.path![r1.path!.length - 1].t,
      r2.path![r2.path!.length - 1].t
    );
    const posAt = (path: NonNullable<typeof r1.path>, t: number) => {
      if (t >= path[path.length - 1].t) return path[path.length - 1];
      return path.find((p) => p.t === t)!;
    };

    for (let t = 0; t <= maxT; t++) {
      const p1 = posAt(r1.path!, t);
      const p2 = posAt(r2.path!, t);
      expect(p1.x === p2.x && p1.y === p2.y).toBe(false);

      if (t > 0) {
        const prev1 = posAt(r1.path!, t - 1);
        const prev2 = posAt(r2.path!, t - 1);
        const swapped =
          p1.x === prev2.x && p1.y === prev2.y && p2.x === prev1.x && p2.y === prev1.y;
        expect(swapped).toBe(false);
      }
    }
  });

  it('detects topological unreachability cleanly when goal is sealed off', () => {
    const { grid } = generateWarehouse(DEFAULT_SEED);
    // Seal off (22, 2) by blocking (21,2), (22,1), (22,3)
    grid.cells[2][21].blocked = true;
    grid.cells[1][22].blocked = true;
    grid.cells[3][22].blocked = true;

    const dist = computeReverseBfsMap(grid, { x: 22, y: 2 });
    expect(Number.isFinite(dist[7 * grid.width + 2])).toBe(false);

    const table = new ReservationTable(grid.width);
    const res = findSpaceTimePath(grid, table, 'R-01', { x: 2, y: 7 }, { x: 22, y: 2 }, 0);
    expect(res.staticReachable).toBe(false);
    expect(res.path).toBeNull();
  });
});
