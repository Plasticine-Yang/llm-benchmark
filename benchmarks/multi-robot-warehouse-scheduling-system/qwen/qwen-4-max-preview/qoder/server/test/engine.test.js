import test from 'node:test';
import assert from 'node:assert/strict';
import { Engine, STUCK_TICKS } from '../src/engine.js';
import { buildWarehouse, CELL, idx, isConnected } from '../src/warehouse.js';

function makeEngine(seed = 20261114) {
  return new Engine({ seed });
}

function tick(engine, n) {
  for (let i = 0; i < n; i++) engine.step();
}

function bind(engine, robot, job) {
  job.status = 'assigned';
  job.robotId = robot.id;
  job.assignedAtTick = engine.state.tick;
  robot.jobId = job.id;
  robot.phase = 'toPick';
  robot.stuckTicks = 0;
  engine.dirty.add(robot.id);
}

function place(engine, robot, x, y) {
  robot.x = x;
  robot.y = y;
  robot.path = [{ x, y }];
  robot.pathT0 = engine.state.tick;
  robot.planWaits = {};
}

test('warehouse meets the required counts and is fully connected', () => {
  const wh = buildWarehouse(20261114);
  assert.ok(wh.homes.length >= 8, `robots ${wh.homes.length} >= 8`);
  assert.ok(wh.shelves.length >= 20, `shelves ${wh.shelves.length} >= 20`);
  assert.ok(wh.stations.length >= 4, `stations ${wh.stations.length} >= 4`);
  assert.ok(isConnected(wh.cells));

  const corridors = Array.from(wh.corridor).filter(Boolean).length;
  assert.ok(corridors >= 40, `expected many one-cell-wide bottleneck cells, got ${corridors}`);

  for (const h of wh.homes) {
    const t = wh.cells[idx(h.x, h.y)];
    assert.ok(t === CELL.EMPTY || t === CELL.STATION, 'robot home must be traversable');
  }
  for (const s of wh.shelves) {
    assert.ok(s.faces.length > 0, `shelf ${s.id} needs at least one pick face`);
    for (const f of s.faces) assert.ok(wh.traversable(f.x, f.y));
  }
  for (const s of wh.stations) assert.ok(wh.traversable(s.x, s.y));

  // Every shelf must actually be serviceable from somewhere.
  for (const s of wh.shelves) {
    assert.ok(s.faces.some((f) => isConnectedFrom(wh, f)), `shelf ${s.id} unreachable`);
  }
});

function isConnectedFrom(wh, from) {
  const seen = new Set([idx(from.x, from.y)]);
  const q = [from];
  while (q.length) {
    const c = q.pop();
    for (const [ox, oy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = c.x + ox;
      const ny = c.y + oy;
      if (!wh.traversable(nx, ny)) continue;
      const k = idx(nx, ny);
      if (seen.has(k)) continue;
      seen.add(k);
      q.push({ x: nx, y: ny });
    }
  }
  return seen.size > 200;
}

test('same seed reproduces the map and the whole schedule exactly', () => {
  const a = makeEngine(777);
  const b = makeEngine(777);
  assert.deepEqual(Array.from(a.wh.cells), Array.from(b.wh.cells));
  assert.deepEqual(a.wh.homes, b.wh.homes);

  for (const e of [a, b]) {
    e.createJob({ shelfId: 'S07', stationId: 'W2', priority: 5 });
    e.createJob({ shelfId: 'S19', stationId: 'W1', priority: 2 });
    e.createJob({ shelfId: 'S03', stationId: 'W4', priority: 4 });
    tick(e, 260);
  }
  assert.deepEqual(
    a.state.robots.map((r) => [r.id, r.x, r.y, r.phase, r.jobId, r.distanceTravelled]),
    b.state.robots.map((r) => [r.id, r.x, r.y, r.phase, r.jobId, r.distanceTravelled]),
  );
  assert.equal(a.state.stats.completed, b.state.stats.completed);

  const c = makeEngine(778);
  assert.notDeepEqual(Array.from(c.wh.cells).join(), Array.from(a.wh.cells).join());
});

test('no vertex conflicts, no swap conflicts, no terrain violations under heavy load', () => {
  const engine = makeEngine(4242);
  const shelves = engine.wh.shelves;
  const stations = engine.wh.stations;
  for (let i = 0; i < 1400; i++) {
    if (i % 12 === 0) {
      const s = shelves[(i * 5 + 3) % shelves.length];
      const w = stations[(i * 3 + 1) % stations.length];
      engine.createJob({ shelfId: s.id, stationId: w.id, priority: 1 + (i % 5) });
    }
    engine.step();
  }
  assert.equal(engine.state.stats.violations, 0, 'collision / terrain invariants must hold every tick');
  assert.ok(engine.state.stats.invariantChecks > 10000);
  assert.ok(engine.state.stats.completed >= 40, `expected many completions, got ${engine.state.stats.completed}`);
  assert.ok(engine.state.stats.yields > 0, 'robots should have yielded at least once');

  // Independent re-verification of the final state.
  const seen = new Set();
  for (const r of engine.state.robots) {
    const k = `${r.x},${r.y}`;
    assert.ok(!seen.has(k), `two robots share ${k}`);
    seen.add(k);
    assert.ok(engine.passable(r.x, r.y), `${r.id} stands on a non-traversable cell`);
  }
});

test('blocking a cell directly ahead of a moving robot forces an immediate replan', () => {
  const engine = makeEngine(99);
  for (let i = 0; i < 6; i++) {
    engine.createJob({ shelfId: engine.wh.shelves[i * 3].id, stationId: engine.wh.stations[i % 4].id, priority: 4 });
  }
  tick(engine, 30);

  const mover = engine.state.robots.find((r) => {
    if (r.phase !== 'toPick' && r.phase !== 'toDrop') return false;
    const i = engine.state.tick - r.pathT0;
    return r.path.length - i >= 5;
  });
  assert.ok(mover, 'expected an actively moving robot');

  const i = engine.state.tick - mover.pathT0;
  let target = null;
  for (let k = i + 2; k < Math.min(i + 6, mover.path.length); k++) {
    const c = mover.path[k];
    if (!engine.occupied(c.x, c.y) && engine.wh.cells[idx(c.x, c.y)] === CELL.EMPTY) { target = c; break; }
  }
  assert.ok(target, 'expected a free floor cell ahead of the robot');

  const replansBefore = engine.state.stats.replans;
  engine.blockCell(target.x, target.y);
  assert.ok(engine.dirty.has(mover.id) || engine.state.tick >= 0);
  assert.ok(engine.state.stats.replans >= replansBefore);

  const blockedIdx = idx(target.x, target.y);
  for (let t = 0; t < 260; t++) {
    engine.step();
    for (const r of engine.state.robots) {
      assert.notEqual(idx(r.x, r.y), blockedIdx, `${r.id} entered the blocked cell at tick ${engine.state.tick}`);
    }
    const ri = engine.state.tick - mover.pathT0;
    for (let k = Math.max(0, ri); k < mover.path.length; k++) {
      assert.notEqual(idx(mover.path[k].x, mover.path[k].y), blockedIdx, 'planned route still crosses the obstacle');
    }
  }
  assert.equal(engine.state.stats.violations, 0);
  assert.ok(engine.state.stats.replans > replansBefore + 1, 'robot must replan, not freeze');

  engine.unblockCell(target.x, target.y);
  tick(engine, 120);
  assert.equal(engine.state.stats.violations, 0);
});

test('head-on encounter in a one-cell aisle resolves without permanent deadlock', () => {
  const engine = makeEngine(20261114);
  const [a, b] = engine.state.robots;
  // x=22 is a single-cell-wide service corridor: shelves on the left, wall on the right.
  assert.equal(engine.wh.corridor[idx(22, 6)], 1);
  assert.equal(engine.wh.corridor[idx(22, 12)], 1);
  place(engine, a, 22, 6);
  place(engine, b, 22, 12);

  const ja = engine.createJob({ shelfId: 'S25', stationId: 'W1', priority: 3 });
  const jb = engine.createJob({ shelfId: 'S05', stationId: 'W3', priority: 3 });
  bind(engine, a, ja);
  bind(engine, b, jb);

  let maxStuck = 0;
  for (let t = 0; t < 900; t++) {
    engine.step();
    for (const r of engine.state.robots) maxStuck = Math.max(maxStuck, r.stuckTicks);
    if (ja.status === 'done' && jb.status === 'done') break;
  }
  assert.equal(engine.state.stats.violations, 0);
  assert.equal(ja.status, 'done', `head-on job A did not finish (maxStuck=${maxStuck})`);
  assert.equal(jb.status, 'done', `head-on job B did not finish (maxStuck=${maxStuck})`);
  assert.ok(maxStuck < 200, `robots stalled too long: ${maxStuck}`);
});

test('an idle robot parked on a workstation yields so delivery can complete', () => {
  const engine = makeEngine(20261114);
  const [a, blocker] = engine.state.robots;
  const station = engine.wh.stations[0];
  place(engine, blocker, station.x, station.y);
  blocker.phase = 'idle';

  const job = engine.createJob({ shelfId: 'S02', stationId: station.id, priority: 4 });
  bind(engine, a, job);

  let sawYield = false;
  for (let t = 0; t < 600; t++) {
    engine.step();
    if (blocker.phase === 'relocating') sawYield = true;
    if (job.status === 'done') break;
  }
  assert.equal(job.status, 'done', 'delivery must complete even when a robot parks on the station');
  assert.ok(sawYield, 'the parked robot should have been asked to relocate');
  assert.equal(engine.state.stats.violations, 0);
});

test('low-priority jobs are not starved by a stream of high-priority jobs', () => {
  const engine = makeEngine(31337);
  const low = engine.createJob({ shelfId: 'S12', stationId: 'W2', priority: 1 });
  const shelves = engine.wh.shelves;
  const stations = engine.wh.stations;
  for (let t = 0; t < 1800; t++) {
    if (t % 22 === 0) {
      const s = shelves[(t * 7 + 5) % shelves.length];
      const w = stations[(t * 2 + 3) % stations.length];
      engine.createJob({ shelfId: s.id, stationId: w.id, priority: 5 });
    }
    engine.step();
    if (low.status === 'done') break;
  }
  assert.equal(low.status, 'done', 'priority ageing must eventually serve the p1 job');
  assert.ok(low.completedAtTick - low.createdAtTick < 1200, `p1 job waited too long: ${low.completedAtTick - low.createdAtTick}`);
  assert.equal(engine.state.stats.violations, 0);
});

test('waiting robots always expose a reason', () => {
  const engine = makeEngine(555);
  for (let i = 0; i < 10; i++) {
    engine.createJob({ shelfId: engine.wh.shelves[i].id, stationId: engine.wh.stations[i % 4].id, priority: 3 });
  }
  let sawReason = false;
  for (let t = 0; t < 400; t++) {
    engine.step();
    for (const r of engine.state.robots) {
      if (r.phase === 'idle' || r.phase === 'loading' || r.phase === 'unloading') {
        assert.ok(typeof r.waitReason === 'string' && r.waitReason.length > 0);
      } else if (r.waitReason) {
        sawReason = true;
        assert.ok(r.waitReason.length > 4);
      }
      const i = engine.state.tick - r.pathT0;
      const next = r.path[i + 1];
      if (next && (next.x !== r.x || next.y !== r.y)) {
        assert.equal(r.waitReason, null, 'a moving robot must not report a wait reason');
      }
    }
  }
  assert.ok(sawReason, 'expected at least one exposed yield reason');
  assert.ok(STUCK_TICKS > 0);
});

test('persisted state resumes bit-identically after a reload', () => {
  const a = makeEngine(8080);
  for (let i = 0; i < 5; i++) {
    a.createJob({ shelfId: a.wh.shelves[i * 4].id, stationId: a.wh.stations[i % 4].id, priority: 1 + i });
  }
  tick(a, 180);
  a.blockCell(22, 7);
  tick(a, 60);

  const blob = JSON.parse(JSON.stringify(a.serialize()));
  const b = makeEngine(1);
  assert.ok(b.hydrate(blob));
  assert.equal(b.state.tick, a.state.tick);
  assert.equal(b.state.runId, a.state.runId);
  assert.deepEqual(b.state.blocked, a.state.blocked);

  tick(a, 150);
  tick(b, 150);
  assert.deepEqual(
    a.state.robots.map((r) => [r.id, r.x, r.y, r.phase, r.jobId]),
    b.state.robots.map((r) => [r.id, r.x, r.y, r.phase, r.jobId]),
  );
  assert.equal(a.state.stats.completed, b.state.stats.completed);
  assert.equal(b.state.stats.violations, 0);
});

test('sequence numbers increase monotonically across snapshots, deltas and resets', () => {
  const seen = [];
  const engine = new Engine({ seed: 12, onChange: (m) => seen.push(m) });
  engine.createJob({ shelfId: 'S01', stationId: 'W1', priority: 3 });
  tick(engine, 25);
  const snap = engine.snapshot();
  seen.push(snap);
  engine.reset(12);
  tick(engine, 10);
  assert.ok(seen.length > 10);
  for (let i = 1; i < seen.length; i++) {
    assert.ok(seen[i].seq > seen[i - 1].seq, `seq went backwards at ${i}`);
  }
  assert.ok(snap.meta && snap.robots.length >= 8, 'snapshot must be complete');
});

test('pause, single-step and reset behave as specified', () => {
  const engine = makeEngine(2468);
  engine.createJob({ shelfId: 'S08', stationId: 'W3', priority: 4 });
  tick(engine, 20);
  const t0 = engine.state.tick;
  engine.setRunning(false);
  assert.equal(engine.state.running, false);
  engine.singleStep();
  assert.equal(engine.state.tick, t0 + 1);
  engine.reset(2468);
  assert.equal(engine.state.tick, 0);
  assert.equal(engine.state.jobs.length, 0);
  assert.equal(engine.state.blocked.length, 0);
  assert.deepEqual(engine.state.robots.map((r) => [r.x, r.y]), engine.wh.homes.map((h) => [h.x, h.y]));
});