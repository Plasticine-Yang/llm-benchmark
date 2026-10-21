import type { Point, WarehouseMap } from "../shared/types.js";
import { manhattan, pointKey, samePoint } from "./map.js";

const DIRECTIONS: Point[] = [
  { x: 1, y: 0 },
  { x: 0, y: 1 },
  { x: -1, y: 0 },
  { x: 0, y: -1 },
];

export function staticObstacles(map: WarehouseMap): Set<string> {
  return new Set([
    ...map.walls.map(pointKey),
    ...map.shelves.map((shelf) => pointKey(shelf.position)),
    ...map.blocked.map(pointKey),
  ]);
}

export function isTraversable(map: WarehouseMap, point: Point): boolean {
  return point.x > 0
    && point.y > 0
    && point.x < map.width - 1
    && point.y < map.height - 1
    && !staticObstacles(map).has(pointKey(point));
}

export function findPath(map: WarehouseMap, start: Point, goal: Point): Point[] | null {
  if (samePoint(start, goal)) return [{ ...start }];
  const blocked = staticObstacles(map);
  blocked.delete(pointKey(start));
  const frontier: Point[] = [{ ...start }];
  const cameFrom = new Map<string, Point | null>([[pointKey(start), null]]);

  while (frontier.length > 0) {
    // Deterministic A*: stable tie-break by insertion order, then coordinates.
    frontier.sort((a, b) => {
      const score = manhattan(a, goal) - manhattan(b, goal);
      return score || a.y - b.y || a.x - b.x;
    });
    const current = frontier.shift()!;
    if (samePoint(current, goal)) {
      const result: Point[] = [];
      let cursor: Point | null = current;
      while (cursor) {
        result.push(cursor);
        cursor = cameFrom.get(pointKey(cursor)) ?? null;
      }
      return result.reverse();
    }

    for (const direction of DIRECTIONS) {
      const next = { x: current.x + direction.x, y: current.y + direction.y };
      const nextKey = pointKey(next);
      if (
        next.x <= 0 || next.y <= 0 || next.x >= map.width - 1 || next.y >= map.height - 1
        || blocked.has(nextKey) || cameFrom.has(nextKey)
      ) continue;
      cameFrom.set(nextKey, current);
      frontier.push(next);
    }
  }
  return null;
}

export function routeIsValid(map: WarehouseMap, route: Point[]): boolean {
  const blocked = staticObstacles(map);
  return route.every((point, index) => {
    if (blocked.has(pointKey(point))) return false;
    if (index === 0) return true;
    return manhattan(route[index - 1], point) === 1;
  });
}
