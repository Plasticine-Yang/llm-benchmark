import test from 'node:test';
import assert from 'node:assert/strict';
import { createMap, initialState, Sim } from './sim.js';

function checkStep(sim, prev) {
  const rs = sim.state.robots;
  const cells = new Set();
  for (const r of rs) {
    const i = sim.idx(r.x, r.y);
    assert.ok(sim.traversableType(i), `${r.id} on non-traversable cell at tick ${sim.state.tick}`);
    assert.ok(!cells.has(i), `vertex collision at (${r.x},${r.y}) tick ${sim.state.tick}`);
    cells.add(i);
    const p = prev.get(r.id);
    assert.ok(Math.abs(p[0] - r.x) + Math.abs(p[1] - r.y) <= 1, `${r.id} teleported`);
  }
  for (const a of rs) for (const b of rs) {
    if (a === b) continue;
    const pa = prev.get(a.id), pb = prev.get(b.id);
    const swapped = pa[0] === b.x && pa[1] === b.y && pb[0] === a.x && pb[1] === a.y && (pa[0] !== a.x || pa[1] !== a.y);
    assert.ok(!swapped, `swap between ${a.id} and ${b.id} at tick ${sim.state.tick}`);
  }
}
const snapPos = (sim) => new Map(sim.state.robots.map((r) => [r.id, [r.x, r.y]]));

test('map meets requirements', () => {
  const m = createMap();
  assert.ok(m.shelves.length >= 20); assert.ok(m.stations.length >= 4); assert.ok(m.parks.length >= 8);
  const sim = new Sim(m, initialState(m, 42));
  assert.ok(sim.state.robots.length >= 8);
  for (const s of m.shelves) assert.ok(sim.passable(sim.idx(s.access.x, s.access.y)), `${s.id} access`);
});

test('demo + random jobs complete with no collisions, swaps or obstacle crossing', () => {
  const m = createMap();
  const sim = new Sim(m, initialState(m, 7));
  sim.planAll();
  sim.demoJobs(); sim.randomJobs(16);
  let maxWait = 0;
  for (let t = 0; t < 1500; t++) {
    const prev = snapPos(sim);
    sim.step();
    checkStep(sim, prev);
    for (const r of sim.state.robots) maxWait = Math.max(maxWait, r.waitTicks);
    if (sim.state.jobs.every((j) => j.status === 'done') && sim.state.robots.every((r) => r.state === 'idle')) break;
  }
  const pending = sim.state.jobs.filter((j) => j.status !== 'done');
  assert.equal(pending.length, 0, `unfinished: ${JSON.stringify(pending.map((j) => [j.id, j.status, j.robotId]))} tick ${sim.state.tick}`);
  assert.ok(maxWait < 60, `max consecutive wait ${maxWait}`);
  console.log(`done at tick ${sim.state.tick}, guardStops=${sim.state.stats.guardStops}, maxWait=${maxWait}`);
});

test('blocking a cell ahead triggers immediate replan, never entering the obstacle', () => {
  const m = createMap();
  const sim = new Sim(m, initialState(m, 42));
  sim.planAll();
  sim.createJob({ shelfId: 'S03', stationId: 'W4', priority: 3 });
  for (let t = 0; t < 3; t++) sim.step();
  const r = sim.state.robots.find((x) => x.jobId);
  const [bx, by] = r.path[2];
  sim.setBlocked(bx, by, true);
  const bi = sim.idx(bx, by);
  assert.ok(!r.path.some(([x, y]) => sim.idx(x, y) === bi), 'new path avoids blocked cell');
  for (let t = 0; t < 400 && sim.state.jobs[0].status !== 'done'; t++) {
    const prev = snapPos(sim); sim.step(); checkStep(sim, prev);
    for (const rr of sim.state.robots) assert.notEqual(sim.idx(rr.x, rr.y), bi);
  }
  assert.equal(sim.state.jobs[0].status, 'done');
});

test('random blocks/unblocks during heavy traffic stay safe', () => {
  const m = createMap();
  for (const seed of [1, 2, 3]) {
    const sim = new Sim(m, initialState(m, seed));
    sim.planAll(); sim.randomJobs(20);
    let rng = seed * 99;
    const rand = () => { rng = (rng * 1103515245 + 12345) % 2147483648; return rng / 2147483648; };
    for (let t = 0; t < 800; t++) {
      if (t % 15 === 5) {
        const x = 1 + Math.floor(rand() * 28), y = 1 + Math.floor(rand() * 16);
        try { sim.setBlocked(x, y); } catch {}
      }
      if (t === 400) for (const b of [...sim.state.blocked]) { const [x, y] = sim.xy(b); sim.setBlocked(x, y, false); }
      const prev = snapPos(sim); sim.step(); checkStep(sim, prev);
      for (const r of sim.state.robots) assert.ok(!sim.blockedSet.has(sim.idx(r.x, r.y)));
    }
    const done = sim.state.jobs.filter((j) => j.status === 'done').length;
    assert.equal(done, 20, `seed ${seed}: ${done}/20 done`);
  }
});

test('determinism: same seed and commands reproduce identical runs', () => {
  const run = () => {
    const m = createMap(); const sim = new Sim(m, initialState(m, 99)); sim.planAll(); sim.randomJobs(10);
    for (let t = 0; t < 120; t++) { if (t === 20) sim.setBlocked(11, 9, true); sim.step(); }
    return JSON.stringify(sim.state.robots.map((r) => [r.x, r.y, r.state])) + sim.state.seq;
  };
  assert.equal(run(), run());
});

test('sequence numbers increase monotonically, including across reset', () => {
  const m = createMap(); const sim = new Sim(m, initialState(m, 5)); sim.planAll();
  let last = 0; sim.subscribe((e) => { assert.ok(e.seq > last); last = e.seq; });
  sim.randomJobs(3); for (let i = 0; i < 5; i++) sim.step(); sim.reset(); sim.step();
  assert.ok(last > 5);
});
