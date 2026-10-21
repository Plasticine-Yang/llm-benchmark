import assert from "node:assert/strict";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import type { Point } from "../shared/types.js";
import { SimulationEngine } from "./engine.js";
import { pointKey, samePoint } from "./map.js";
import { findPath, routeIsValid } from "./pathfinding.js";

const makeEngine = () => {
  const directory = mkdtempSync(join(tmpdir(), "warehouse-engine-"));
  return { engine: new SimulationEngine(join(directory, "state.json")), statePath: join(directory, "state.json") };
};

function assertConflictFree(before: ReturnType<SimulationEngine["getState"]>, after: ReturnType<SimulationEngine["getState"]>) {
  const occupied = new Set<string>();
  for (const robot of after.robots) {
    assert(!occupied.has(pointKey(robot.position)), `vertex collision at ${pointKey(robot.position)}`);
    occupied.add(pointKey(robot.position));
  }
  for (const a of after.robots) {
    for (const b of after.robots) {
      if (a.id >= b.id) continue;
      const previousA = before.robots.find((robot) => robot.id === a.id)!.position;
      const previousB = before.robots.find((robot) => robot.id === b.id)!.position;
      assert(!(samePoint(previousA, b.position) && samePoint(previousB, a.position)), `${a.id}/${b.id} swapped cells`);
    }
  }
}

test("deterministic map contains required assets and valid A* routes", () => {
  const { engine } = makeEngine();
  const state = engine.getState();
  assert.equal(state.robots.length, 8);
  assert.equal(state.map.shelves.length, 20);
  assert.equal(state.map.workstations.length, 4);
  assert(state.map.bottlenecks.length >= 6);
  const route = findPath(state.map, state.robots[0].position, state.map.shelves[19].pickup);
  assert(route);
  assert(routeIsValid(state.map, route));
  engine.shutdown();
});

test("three simultaneous jobs execute without vertex collisions or edge swaps", () => {
  const { engine } = makeEngine();
  engine.createJob("S-20", "W-1", 3);
  engine.createJob("S-01", "W-4", 5);
  engine.createJob("S-11", "W-2", 4);
  const assigned = engine.getState().jobs.map((job) => job.robotId);
  assert.equal(new Set(assigned).size, 3);

  for (let tick = 0; tick < 120; tick += 1) {
    const before = engine.getState();
    engine.singleStep();
    const after = engine.getState();
    assertConflictFree(before, after);
  }
  assert.equal(engine.getState().jobs.filter((job) => job.status === "COMPLETED").length, 3);
  engine.shutdown();
});

test("reset preserves the monotonic event sequence", () => {
  const { engine } = makeEngine();
  engine.createJob("S-01", "W-1", 2);
  const before = engine.getState().sequence;
  engine.reset();
  const after = engine.getState();
  assert(after.sequence > before);
  assert.equal(after.tick, 0);
  assert.equal(after.jobs.length, 0);
  engine.shutdown();
});

test("new block invalidates an active route immediately and persists", () => {
  const { engine, statePath } = makeEngine();
  engine.createJob("S-20", "W-1", 5);
  const active = engine.getState().robots.find((robot) => robot.jobId)!;
  const target: Point | undefined = active.route.slice(1).find((point) => !engine.getState().robots.some((robot) => samePoint(robot.position, point)));
  assert(target);
  engine.setBlocked(target, true);
  const state = engine.getState();
  assert(state.map.blocked.some((point) => samePoint(point, target)));
  assert(!state.robots.some((robot) => robot.route.slice(1).some((point) => samePoint(point, target))));
  const persisted = JSON.parse(readFileSync(statePath, "utf8"));
  assert.equal(persisted.sequence, state.sequence);
  assert(persisted.map.blocked.some((point: Point) => samePoint(point, target)));
  engine.shutdown();
});
