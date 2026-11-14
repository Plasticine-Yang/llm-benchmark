'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { Engine, GRID_W, GRID_H, buildMap, idx } = require('../server/engine');

const fresh = (seed = 42) => new Engine({ dataDir: null, seed });

function assertNoConflicts(engine, before) {
  const after = engine.robots.map((r) => ({ id: r.id, x: r.x, y: r.y }));

  // 1. no two robots occupy the same cell at the same time
  const occupied = new Map();
  for (const r of after) {
    const k = `${r.x},${r.y}`;
    assert.ok(!occupied.has(k), `vertex collision at ${k}: ${occupied.get(k)} and ${r.id}`);
    occupied.set(k, r.id);
  }

  // 2. no two robots swap cells during the same step
  for (let i = 0; i < after.length; i++) {
    for (let j = i + 1; j < after.length; j++) {
      const swapped = after[i].x === before[j].x && after[i].y === before[j].y &&
                      after[j].x === before[i].x && after[j].y === before[i].y;
      assert.ok(!swapped, `head-on swap between ${after[i].id} and ${after[j].id}`);
    }
  }

  // 3. no robot ever stands on a wall, shelf or blocked cell
  for (const r of after) {
    const t = engine.map.cells[idx(r.x, r.y)];
    assert.notEqual(t, 0, `${r.id} entered a wall at (${r.x},${r.y})`);
    assert.notEqual(t, 2, `${r.id} entered a shelf at (${r.x},${r.y})`);
    assert.ok(!engine.blocked.has(`${r.x},${r.y}`), `${r.id} entered blocked cell (${r.x},${r.y})`);
  }
  return after;
}

const snapshotPositions = (before) => before.map((r) => ({ id: r.id, x: r.x, y: r.y }));

test('deterministic grid: >=8 robots, >=20 shelves, 4 stations, narrow aisles', () => {
  const map = buildMap();
  assert.equal(map.W, GRID_W);
  assert.equal(map.H, GRID_H);
  assert.ok(map.shelves.length >= 20, `only ${map.shelves.length} shelves`);
  assert.equal(map.stations.length, 4);
  assert.equal(map.homes.length, 8);
  assert.ok(map.segments.length >= 3, 'expected several one-cell-wide bottleneck aisles');

  const e = fresh();
  assert.equal(e.robots.length, 8);
  const homes = new Set(e.robots.map((r) => `${r.x},${r.y}`));
  assert.equal(homes.size, 8, 'robot home cells must be distinct');
  for (const s of map.shelves) {
    assert.ok(e.isStaticPassable(s.access.x, s.access.y), `${s.id} access cell must be traversable`);
  }
  for (const st of map.stations) assert.ok(e.isStaticPassable(st.x, st.y));
  // tunnels really are the only cells connecting the two halves
  for (let y = 1; y < GRID_H - 1; y++) {
    const open = [16, 17, 18].filter((x) => e.isStaticPassable(x, y));
    assert.ok(open.length === 0 || open.length === 3);
  }
});

test('same seed + same command sequence reproduces the identical run', () => {
  const a = fresh(777), b = fresh(777);
  const jobs = [
    { shelfId: 'S03', stationId: 'W4', priority: 5 },
    { shelfId: 'S07', stationId: 'W3', priority: 3 },
    { shelfId: 'S16', stationId: 'W2', priority: 1 },
  ];
  for (const j of jobs) { a.createJob(j); b.createJob(j); }
  for (let i = 0; i < 140; i++) {
    if (i === 40) { a.toggleCell(17, 11, true); b.toggleCell(17, 11, true); }
    a.advance(); b.advance();
  }
  assert.deepEqual(
    a.snapshot().robots.map((r) => [r.id, r.x, r.y, r.phase, r.jobId]),
    b.snapshot().robots.map((r) => [r.id, r.x, r.y, r.phase, r.jobId]),
  );
  assert.deepEqual(a.snapshot().jobs, b.snapshot().jobs);
  assert.equal(a.seq, b.seq);
});

test('space-time reservations: zero vertex collisions and zero swaps over 400 ticks', () => {
  const e = fresh(1234);
  const jobs = [
    { shelfId: 'S03', stationId: 'W4', priority: 5 },
    { shelfId: 'S07', stationId: 'W3', priority: 4 },
    { shelfId: 'S16', stationId: 'W2', priority: 3 },
    { shelfId: 'S20', stationId: 'W1', priority: 2 },
    { shelfId: 'S11', stationId: 'W4', priority: 1 },
  ];
  for (const j of jobs) e.createJob(j);
  let before = snapshotPositions(e.robots);
  for (let i = 0; i < 400; i++) {
    e.advance();
    assertNoConflicts(e, before);
    before = snapshotPositions(e.robots);
  }
  assert.equal(e.snapshot().stats.collisions, 0);
  assert.ok(e.stats.delivered >= 4, `expected jobs to complete, delivered=${e.stats.delivered}`);
});

test('dynamic obstacle inside a bottleneck: no collisions and no escapes into blocked cells', () => {
  const e = fresh(2026);
  for (const j of [
    { shelfId: 'S02', stationId: 'W4', priority: 5 },
    { shelfId: 'S10', stationId: 'W3', priority: 4 },
    { shelfId: 'S15', stationId: 'W1', priority: 3 },
    { shelfId: 'S22', stationId: 'W2', priority: 2 },
  ]) e.createJob(j);

  let before = snapshotPositions(e.robots);
  for (let i = 0; i < 240; i++) {
    if (i === 25) e.toggleCell(17, 11, true);
    if (i === 90) e.toggleCell(17, 5, true);
    if (i === 150) e.toggleCell(17, 11, false);
    e.advance();
    assertNoConflicts(e, before);
    before = snapshotPositions(e.robots);
  }
  assert.ok(e.stats.replans > 0, 'blocking a cell on a reserved route must trigger replanning');
});

test('blocking the cell directly ahead forces an immediate replan before the next move', () => {
  const e = fresh(99);
  e.createJob({ shelfId: 'S03', stationId: 'W4', priority: 5 });
  const robot = e.robots.find((r) => r.jobId);
  assert.ok(robot, 'scheduler must auto-assign an available robot');
  const next = e.plans[robot.id].path[1];
  assert.ok(next && (next.x !== robot.x || next.y !== robot.y), 'robot should have a forward move planned');

  const beforePlan = JSON.stringify(e.plans[robot.id].path);
  const result = e.toggleCell(next.x, next.y, true);
  assert.equal(result.changed, true);
  assert.ok(result.affected.includes(robot.id), 'affected robot must be reported');

  const afterPlan = e.plans[robot.id].path;
  assert.notEqual(JSON.stringify(afterPlan), beforePlan, 'plan must change immediately');
  assert.ok(!afterPlan.some((c) => c.x === next.x && c.y === next.y),
    'new route must not cross the new obstacle');
  assert.ok(e.events.some((ev) => ev.type === 'replan' || ev.type === 'map'));

  e.advance();
  assert.ok(!(robot.x === next.x && robot.y === next.y), 'robot must stop before the new obstacle');
  e.toggleCell(next.x, next.y, false);
  assert.equal(e.blocked.has(`${next.x},${next.y}`), false, 'unblock must restore the cell');
});

test('priority with aging: urgent and low-priority jobs both finish (no starvation)', () => {
  const e = fresh(555);
  e.createJob({ shelfId: 'S17', stationId: 'W1', priority: 1 }); // create low priority first
  e.createJob({ shelfId: 'S04', stationId: 'W3', priority: 5 }); // urgent arrives later
  let maxActiveWait = 0;
  for (let i = 0; i < 420; i++) {
    e.advance();
    for (const r of e.robots) if (r.jobId) maxActiveWait = Math.max(maxActiveWait, r.waitTicks);
  }
  const done = e.jobs.filter((j) => j.status === 'done');
  assert.equal(done.length, 2, `all jobs must eventually complete, got ${JSON.stringify(e.jobs.map(j => [j.id, j.priority, j.status]))}`);
  assert.ok(maxActiveWait < 120, `an active job must not starve; max wait was ${maxActiveWait} ticks`);
});

test('bidirectional traffic through 1-wide tunnels never deadlocks permanently', () => {
  const e = fresh(31337);
  // 8 concurrent jobs: west shelves -> east docks and east shelves -> west docks.
  // Every robot must cross one of the three single-cell-wide tunnels.
  for (const j of [
    { shelfId: 'S01', stationId: 'W4', priority: 5 },
    { shelfId: 'S05', stationId: 'W3', priority: 4 },
    { shelfId: 'S09', stationId: 'W4', priority: 3 },
    { shelfId: 'S11', stationId: 'W3', priority: 2 },
    { shelfId: 'S13', stationId: 'W2', priority: 5 },
    { shelfId: 'S17', stationId: 'W1', priority: 4 },
    { shelfId: 'S21', stationId: 'W2', priority: 3 },
    { shelfId: 'S24', stationId: 'W1', priority: 2 },
  ]) e.createJob(j);

  assert.equal(e.robots.filter((r) => r.jobId).length, 8, 'all 8 robots should be busy');
  let before = snapshotPositions(e.robots);
  for (let i = 0; i < 600; i++) {
    e.advance();
    assertNoConflicts(e, before);
    before = snapshotPositions(e.robots);
  }
  assert.equal(e.jobs.filter((j) => j.status === 'done').length, 8,
    `all 8 crossing jobs must finish; statuses=${JSON.stringify(e.jobs.map((j) => [j.id, j.status]))}`);
  // Every active robot must have moved recently at the end (no frozen head-on pair).
  assert.ok(e.robots.every((r) => r.lastMovedTick > 0));
});

test('sequence numbers are monotonic and every snapshot is self-contained', () => {
  const e = fresh(31);
  let last = e.seq;
  const bump = () => { assert.ok(e.seq > last, `seq must increase: ${last} -> ${e.seq}`); last = e.seq; };
  e.createJob({ shelfId: 'S01', stationId: 'W4', priority: 4 }); bump();
  e.advance(); bump();
  e.toggleCell(17, 11, true); bump();
  e.advance(); bump();

  const s = e.snapshot();
  assert.equal(s.seq, e.seq);
  assert.equal(s.map.cells.length, GRID_W * GRID_H);
  assert.equal(s.robots.length, 8);
  assert.ok(s.robots.every((r) => Array.isArray(r.plan) && r.plan.length >= 1));
  assert.ok(Array.isArray(s.jobs) && Array.isArray(s.events));
  assert.ok(Array.isArray(s.blocked));
  assert.ok(s.events.every((ev) => typeof ev.message === 'string'));

  e.paused = true;
  assert.equal(e.snapshot().paused, true);
});

test('reset with the same seed restarts the exact same initial state', () => {
  const e = fresh(808);
  for (const j of [
    { shelfId: 'S03', stationId: 'W4', priority: 5 },
    { shelfId: 'S16', stationId: 'W2', priority: 1 },
  ]) e.createJob(j);
  for (let i = 0; i < 60; i++) e.advance();
  const seqBefore = e.seq;
  e.reset(808, { keepSeq: true });
  assert.equal(e.tick, 0);
  assert.equal(e.jobs.length, 0);
  assert.equal(e.blocked.size, 0);
  assert.ok(e.seq > seqBefore, 'seq must stay monotonic across a reset');
  assert.deepEqual(
    e.robots.map((r) => [r.id, r.x, r.y]),
    fresh(808).robots.map((r) => [r.id, r.x, r.y]),
  );
});
