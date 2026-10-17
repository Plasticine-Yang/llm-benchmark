import test from 'node:test';
import assert from 'node:assert/strict';
import { WarehouseSimulation } from '../server/simulation.js';
import { cellKey, findNarrowCorridors, isStaticTraversable } from '../server/warehouse.js';

const key = (robot) => `${robot.x},${robot.y}`;

function robotsInSameCell(robots) {
  const seen = new Map();
  const conflicts = [];
  for (const robot of robots) {
    const k = key(robot);
    if (seen.has(k)) conflicts.push([seen.get(k), robot.id, k]);
    seen.set(k, robot.id);
  }
  return conflicts;
}

function validateRoutes(state) {
  const blocked = new Set(state.blockedCells.map((cell) => cellKey(cell.x, cell.y)));
  for (const robot of state.robots) {
    for (const step of robot.route) {
      const terrain = state.warehouse.terrain[step.y]?.[step.x];
      assert.ok(terrain && terrain !== '#' && terrain !== 'S', `${robot.id} route crosses a shelf/wall at ${step.x},${step.y}`);
      assert.ok(!blocked.has(cellKey(step.x, step.y)), `${robot.id} route crosses a blocked cell at ${step.x},${step.y}`);
    }
  }
}

function atMostOneRobotPerBottleneck(state) {
  const blocked = new Set(state.blockedCells.map((cell) => cellKey(cell.x, cell.y)));
  const corridors = findNarrowCorridors(
    { ...state.warehouse, seed: state.seed },
    blocked,
  );
  const counts = new Map();
  for (const robot of state.robots) {
    const corridor = corridors.byCell.get(cellKey(robot.x, robot.y));
    if (!corridor) continue;
    counts.set(corridor.id, (counts.get(corridor.id) ?? 0) + 1);
  }
  for (const [corridorId, count] of counts) {
    assert.ok(count <= 1, `two robots occupied narrow corridor ${corridorId}`);
  }
}

test('multi-robot run keeps vertex and swap safety, then drains the queue', () => {
  const sim = new WarehouseSimulation({ seed: 424242 });
  const extra = [
    ['S01', 'WS-A', 3],
    ['S05', 'WS-B', 3],
    ['S09', 'WS-C', 2],
    ['S13', 'WS-D', 2],
    ['S17', 'WS-A', 1],
    ['S20', 'WS-B', 1],
  ];
  for (const [shelfId, workstationId, priority] of extra) {
    sim.createJob({ shelfId, workstationId, priority });
  }

  let previous = new Map(sim.robots.map((robot) => [robot.id, { x: robot.x, y: robot.y }]));
  let collisionChecks = 0;
  let corridorChecks = 0;
  for (let step = 0; step < 240; step += 1) {
    sim.advanceTick();
    const state = sim.snapshot();
    assert.deepEqual(robotsInSameCell(state.robots), [], 'two robots occupied one cell');
    validateRoutes(state);
    atMostOneRobotPerBottleneck(state);
    corridorChecks += 1;

    const current = new Map(state.robots.map((robot) => [robot.id, { x: robot.x, y: robot.y }]));
    for (const a of state.robots) {
      for (const b of state.robots) {
        if (a.id >= b.id) continue;
        const beforeA = previous.get(a.id);
        const beforeB = previous.get(b.id);
        const nowA = current.get(a.id);
        const nowB = current.get(b.id);
        assert.ok(
          !(beforeA.x === nowB.x && beforeA.y === nowB.y && beforeB.x === nowA.x && beforeB.y === nowA.y),
          `swap occurred between ${a.id} and ${b.id}`,
        );
      }
    }
    previous = current;
    collisionChecks += 1;
  }

  const final = sim.snapshot();
  const completed = final.jobs.filter((job) => job.status === 'completed');
  assert.equal(completed.length, final.jobs.length, 'all jobs should eventually complete');
  assert.ok(collisionChecks > 0 && corridorChecks > 0);
  assert.ok(final.stats.completedJobs >= 9);
});

test('operator block invalidates routes immediately and is never entered', () => {
  const sim = new WarehouseSimulation({ seed: 20261017 });
  sim.pause();
  sim.advanceTick();
  sim.advanceTick();

  const initial = sim.snapshot();
  const active = initial.robots.find((robot) => robot.route.length > 1 && robot.status !== 'idle');
  assert.ok(active, 'expected an active route to test');
  const future = active.route[Math.min(3, active.route.length - 1)];
  const blocksBefore = initial.blockedCells.length;
  sim.setCellBlocked(future.x, future.y, true);
  const replanned = sim.snapshot();
  assert.equal(replanned.blockedCells.length, blocksBefore + 1);
  assert.ok(replanned.seq > initial.seq, 'block must produce a newer authoritative sequence');
  assert.ok(replanned.events.some((event) => event.type === 'blocked'));

  const blockedKey = `${future.x},${future.y}`;
  for (const robot of replanned.robots) {
    assert.ok(
      !robot.route.some((cell) => `${cell.x},${cell.y}` === blockedKey),
      `${robot.id} retained a route through the new obstacle`,
    );
  }

  for (let i = 0; i < 14; i += 1) {
    sim.advanceTick();
    const state = sim.snapshot();
    const occupant = state.robots.find((robot) => `${robot.x},${robot.y}` === blockedKey);
    assert.equal(occupant, undefined, 'a robot entered the blocked cell');
    for (const robot of state.robots) {
      assert.ok(!robot.route.some((cell) => `${cell.x},${cell.y}` === blockedKey));
    }
  }

  sim.setCellBlocked(future.x, future.y, false);
  const cleared = sim.snapshot();
  assert.equal(cleared.blockedCells.length, blocksBefore);
  assert.ok(cleared.events.some((event) => event.type === 'blocked' && event.message.includes('cleared')));
});

test('identical seeds and inputs reproduce the same run', () => {
  const seed = 777001;
  const a = new WarehouseSimulation({ seed });
  const b = new WarehouseSimulation({ seed });
  const specs = [
    ['S04', 'WS-C', 3],
    ['S12', 'WS-A', 2],
    ['S19', 'WS-D', 1],
  ];

  for (let step = 0; step < 24; step += 1) {
    a.advanceTick();
    b.advanceTick();
  }
  for (const [shelfId, workstationId, priority] of specs) {
    a.createJob({ shelfId, workstationId, priority });
    b.createJob({ shelfId, workstationId, priority });
  }
  for (let step = 0; step < 18; step += 1) {
    a.advanceTick();
    b.advanceTick();
  }

  const summary = (sim) => ({
    tick: sim.tick,
    robots: sim.robots.map((robot) => [robot.id, robot.x, robot.y, robot.status, robot.jobId]),
    jobs: sim.jobs.map((job) => [job.id, job.shelfId, job.workstationId, job.status, job.robotId, job.completedAtTick]),
  });
  assert.deepEqual(summary(a), summary(b));

  a.reset(seed);
  b.reset(seed);
  assert.equal(a.running, false);
  assert.equal(b.running, false);
  assert.deepEqual(summary(a), summary(b));
  assert.equal(a.snapshot().blockedCells.length, 0);

  for (let step = 0; step < 16; step += 1) {
    a.advanceTick();
    b.advanceTick();
  }
  assert.deepEqual(summary(a), summary(b));
});

test('warehouse topology includes required resources and narrow aisles', () => {
  const sim = new WarehouseSimulation({ seed: 1 });
  assert.ok(sim.warehouse.shelves.length >= 20);
  assert.equal(sim.warehouse.workstations.length, 4);
  assert.equal(sim.robots.length, 8);
  assert.ok(sim.warehouse.narrowAisles.length >= 4);
  const traversableCells = sim.warehouse.terrain.flat().filter((cell) => cell !== '#' && cell !== 'S').length;
  assert.ok(traversableCells > 100);
  for (const shelf of sim.warehouse.shelves) {
    assert.ok(isStaticTraversable(sim.warehouse, shelf.pickup.x, shelf.pickup.y));
  }
});
