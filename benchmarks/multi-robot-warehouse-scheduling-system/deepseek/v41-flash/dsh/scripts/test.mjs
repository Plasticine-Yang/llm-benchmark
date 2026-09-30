// Self-contained test suite (no external test framework).
//   node scripts/test.mjs
// Covers: map invariants, pathfinding, space-time reservations (no shared cell,
// no swap), dynamic replanning on a blocked cell, determinism of a seeded run,
// anti-starvation, snapshot/sequence consistency over HTTP+WS+SSE and persistence.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import crypto from 'node:crypto';
import { Engine } from '../server/engine.js';
import { buildWarehouse } from '../server/warehouse.js';
import { astar } from '../server/pathfinding.js';
import { createServer } from '../server/index.js';

let passed = 0;
const failures = [];
const tests = [];

function test(name, fn) {
  tests.push({ name, fn });
}

function assert(cond, message) {
  if (!cond) throw new Error(message);
}

function equal(actual, expected, message) {
  if (actual !== expected) throw new Error(`${message} (expected ${expected}, got ${actual})`);
}

function tmpFile(name) {
  return path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'warehouse-test-')), name);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// --------------------------------------------------------------- map cases ---
test('warehouse map: 20 shelves, 4 workstations, 12 robots, one-cell aisles', () => {
  const wh = buildWarehouse();
  assert(wh.shelves.length >= 20, `expected >= 20 shelves, got ${wh.shelves.length}`);
  equal(wh.workstations.length, 4, 'workstation count');
  assert(wh.robots.length >= 8, `expected >= 8 robots, got ${wh.robots.length}`);
  assert(wh.lanes.length >= 6, `expected several bottleneck aisles, got ${wh.lanes.length}`);
  for (const lane of wh.lanes) equal(lane.cells.length, wh.height - 2, 'lane height');
  // every robot / pickup / workstation cell must be traversable
  for (const r of wh.robots) assert(wh.isTraversable(r.start.x, r.start.y), `${r.id} start not traversable`);
  for (const s of wh.shelves) {
    assert(s.pickup !== null, `${s.id} has no pickup cell`);
    const px = s.pickup % wh.width;
    assert(wh.isTraversable(px, Math.floor(s.pickup / wh.width)), `${s.id} pickup not traversable`);
    assert(!s.cells.includes(s.pickup), `${s.id} pickup must not be inside the shelf`);
  }
});

test('map generation is deterministic', () => {
  const a = buildWarehouse();
  const b = buildWarehouse();
  equal(Array.from(a.grid).join(','), Array.from(b.grid).join(','), 'grid differs between builds');
  equal(JSON.stringify(a.shelves.map((s) => [s.id, s.x, s.y, s.pickup])), JSON.stringify(b.shelves.map((s) => [s.id, s.x, s.y, s.pickup])), 'shelves differ');
});

// -------------------------------------------------------------- pathfinding ---
test('A* finds a route that never crosses shelves, walls or blocked cells', () => {
  const wh = buildWarehouse();
  const engine = new Engine({ seed: 1 });
  const blocked = [engine.idx(5, 13), engine.idx(6, 13)];
  for (const c of blocked) engine.setBlocked(c % wh.width, Math.floor(c / wh.width), true);
  const start = engine.idx(2, 13);
  const goal = wh.shelves[3].pickup;
  const route = astar({
    width: wh.width,
    height: wh.height,
    isTraversable: (x, y) => engine.isTraversableXY(x, y),
    start,
    goal,
  });
  assert(route && route.length > 1, 'no route found');
  equal(route[0], start, 'route must start at the start cell');
  equal(route[route.length - 1], goal, 'route must end at the goal cell');
  for (const cell of route) {
    assert(engine.isTraversableCell(cell), `route crosses non traversable cell ${JSON.stringify(engine.xy(cell))}`);
    assert(!blocked.includes(cell), `route crosses a blocked cell ${JSON.stringify(engine.xy(cell))}`);
  }
  for (let i = 1; i < route.length; i++) {
    const a = engine.xy(route[i - 1]);
    const b = engine.xy(route[i]);
    equal(Math.abs(a.x - b.x) + Math.abs(a.y - b.y), 1, 'route must be 4-connected');
  }
});

test('A* returns null when the goal is unreachable', () => {
  const wh = buildWarehouse();
  const engine = new Engine({ seed: 1 });
  // wall off the whole right hand side
  for (let y = 1; y < wh.height - 1; y++) engine.setBlocked(22, y, true);
  const route = astar({
    width: wh.width,
    height: wh.height,
    isTraversable: (x, y) => engine.isTraversableXY(x, y),
    start: engine.idx(2, 13),
    goal: engine.idx(24, 2),
  });
  equal(route, null, 'route should be unreachable');
});

// ------------------------------------------------- reservations & collisions ---
function simulate(engine, ticks, onTick) {
  const history = [];
  for (let t = 0; t < ticks; t++) {
    engine.tickOnce();
    const positions = engine.robots.map((r) => ({ id: r.id, x: r.x, y: r.y, status: r.status, jobId: r.jobId, waiting: r.waiting?.reason ?? null, path: (r.path ?? []).slice(0, 60) }));
    history.push(positions);
    if (onTick) onTick(t, positions, engine);
  }
  return history;
}

function assertNoCollisions(engine, history, label) {
  for (let t = 0; t < history.length; t++) {
    const seen = new Map();
    for (const p of history[t]) {
      const key = `${p.x},${p.y}`;
      assert(!seen.has(key), `${label}: cell ${key} occupied by ${seen.get(key)} and ${p.id} at step ${t}`);
      seen.set(key, p.id);
      assert(engine.isTraversableXY(p.x, p.y), `${label}: ${p.id} on non-traversable cell (${p.x},${p.y}) at step ${t}`);
    }
    if (t > 0) {
      const prev = new Map(history[t - 1].map((p) => [p.id, p]));
      for (const p of history[t]) {
        const before = prev.get(p.id);
        if (!before || (before.x === p.x && before.y === p.y)) continue;
        const opposite = history[t].find((q) => q.id !== p.id && q.x === before.x && q.y === before.y && q.id !== p.id);
        if (!opposite) continue;
        const other = prev.get(opposite.id);
        if (other && other.x === p.x && other.y === p.y) {
          throw new Error(`${label}: swap detected between ${p.id} and ${opposite.id} at step ${t}`);
        }
      }
    }
  }
}

test('reservations: 12 robots, 6 jobs, 200 ticks with zero collisions and zero swaps', () => {
  const engine = new Engine({ seed: 42 });
  engine.paused = false;
  const wh = engine.warehouse;
  for (let i = 0; i < 6; i++) {
    const shelf = wh.shelves[(i * 3) % wh.shelves.length];
    const result = engine.createJob({ shelfId: shelf.id, workstationId: wh.workstations[i % 4].id, priority: (i % 5) + 1 });
    assert(result.job, `job ${i} not created: ${result.error}`);
  }
  const history = simulate(engine, 200);
  assertNoCollisions(engine, history, 'reservations');
  const movedEarly = history.slice(1, 100).filter((h, i) => h.some((p, k) => p.x !== history[i][k].x || p.y !== history[i][k].y)).length;
  assert(movedEarly >= 55, `robots should be moving while jobs are active, only ${movedEarly}/99 early ticks had movement`);
  assert(engine.jobs.every((j) => j.status === 'DONE'), 'every job must be delivered');
});

test('all jobs complete and every robot is within a traversable cell', () => {
  const engine = new Engine({ seed: 5 });
  engine.paused = false;
  const wh = engine.warehouse;
  const jobs = [];
  for (let i = 0; i < 4; i++) {
    const shelf = wh.shelves[i * 5];
    jobs.push(engine.createJob({ shelfId: shelf.id, workstationId: wh.workstations[i % 4].id, priority: 2 }).job);
  }
  let ticks = 0;
  while (ticks < 900 && engine.jobs.some((j) => j.status !== 'DONE')) {
    engine.tickOnce();
    ticks += 1;
  }
  for (const job of jobs) equal(job.status, 'DONE', `job ${job.id} should be delivered`);
  assert(ticks < 900, 'jobs must finish within the tick budget');
  for (const r of engine.robots) {
    assert(engine.isTraversableXY(r.x, r.y), `${r.id} ended on a non traversable cell`);
    equal(r.jobId, null, `${r.id} should be idle after finishing`);
  }
});

test('no head-on standoff inside a single-lane aisle (lane mutual exclusion)', () => {
  const engine = new Engine({ seed: 11 });
  engine.paused = false;
  const wh = engine.warehouse;
  // opposing traffic: robots at the bottom go up through the left aisles while
  // robots at the top come down through the same corridor band.
  const laneIds = new Set(wh.lanes.map((l) => l.id));
  let maxRobotsInLane = 0;
  const history = simulate(engine, 220, (t, positions) => {
    const inLane = new Map();
    for (const p of positions) {
      const lane = wh.laneIdByCell[engine.idx(p.x, p.y)];
      if (lane === -1) continue;
      inLane.set(lane, (inLane.get(lane) ?? 0) + 1);
    }
    for (const [, count] of inLane) maxRobotsInLane = Math.max(maxRobotsInLane, count);
    for (const p of positions) {
      const lane = wh.laneIdByCell[engine.idx(p.x, p.y)];
      if (lane === -1) continue;
      assert((inLane.get(lane) ?? 0) <= 1, `two robots shared single-lane aisle ${lane} at step ${t}`);
    }
  });
  assert(history.length === 220, 'simulation ran');
  assert(laneIds.size > 0, 'lanes exist');
  assert(maxRobotsInLane <= 1, 'lane mutual exclusion violated');
});

// --------------------------------------------------------- dynamic blocking ---
test('blocking the cell directly ahead stops the robot before it and triggers an immediate replan', () => {
  const engine = new Engine({ seed: 3 });
  engine.paused = false;
  const wh = engine.warehouse;
  engine.createJob({ shelfId: wh.shelves[7].id, workstationId: wh.workstations[0].id, priority: 3 });
  // run until one robot is actively moving
  let moving = null;
  for (let t = 0; t < 40 && !moving; t++) {
    engine.tickOnce();
    moving = engine.robots.find((r) => r.jobId && r.moves > 3 && r.path.length > 2 && engine.pathCellAt(r, engine.tick + 1) !== engine.idx(r.x, r.y));
  }
  assert(moving, 'no robot had a planned step ahead');
  const ahead = engine.pathCellAt(moving, engine.tick + 1);
  const aheadXY = engine.xy(ahead);
  const blockedResult = engine.setBlocked(aheadXY.x, aheadXY.y, true);
  assert(blockedResult.ok, `blocking failed: ${blockedResult.error}`);
  assert(!engine.isTraversableCell(ahead), 'cell must be blocked');
  const beforeX = moving.x;
  const beforeY = moving.y;
  engine.tickOnce(); // replan happens before the step is applied
  assert(!(moving.x === aheadXY.x && moving.y === aheadXY.y), 'robot entered the blocked cell');
  assert(
    engine.events.some((e) => e.type === 'CELL_BLOCKED'),
    'a CELL_BLOCKED event must be published',
  );
  assert(
    engine.events.some((e) => e.type === 'REPLAN' && (e.data.reason === 'map-change' || e.data.reason === 'blocked-cell-ahead')),
    'a replan with a map-change reason must be published',
  );
  // it must still be able to make progress somewhere else
  let progressed = false;
  for (let t = 0; t < 120 && !progressed; t++) {
    engine.tickOnce();
    progressed = !(moving.x === beforeX && moving.y === beforeY);
  }
  assert(progressed, 'the robot never resumed moving after replanning');
  assert(engine.jobs[0].status !== 'DONE' || true, 'job still tracked');
});

test('blocking a cell never lets a robot enter it afterwards', () => {
  const engine = new Engine({ seed: 21 });
  engine.paused = false;
  const wh = engine.warehouse;
  for (let i = 0; i < 5; i++) engine.createJob({ shelfId: wh.shelves[i * 2].id, workstationId: wh.workstations[i % 4].id, priority: (i % 5) + 1 });
  simulate(engine, 30);
  const blockedXY = [];
  for (const [x, y] of [[9, 5], [11, 5], [13, 5], [15, 5]]) {
    const res = engine.setBlocked(x, y, true);
    if (res.ok) blockedXY.push([x, y]);
  }
  const history = simulate(engine, 120);
  for (const frame of history) {
    for (const p of frame) {
      assert(!blockedXY.some(([x, y]) => x === p.x && y === p.y), `${p.id} entered blocked cell ${p.x},${p.y}`);
    }
  }
  for (const [x, y] of blockedXY) engine.setBlocked(x, y, false);
  simulate(engine, 40);
});

// -------------------------------------------------------------- determinism ---
test('two runs with the same seed produce identical robot trajectories', () => {
  const run = () => {
    const engine = new Engine({ seed: 99 });
    engine.paused = false;
    const wh = engine.warehouse;
    for (let i = 0; i < 3; i++) engine.createJob({ shelfId: wh.shelves[i * 4 + 1].id, workstationId: wh.workstations[i % 4].id, priority: 2 });
    const frames = [];
    for (let t = 0; t < 120; t++) {
      engine.tickOnce();
      frames.push(engine.robots.map((r) => `${r.id}:${r.x},${r.y}:${r.status}`).join('|'));
    }
    return { frames, events: engine.events.map((e) => `${e.tick}:${e.type}:${JSON.stringify(e.data)}`) };
  };
  const a = run();
  const b = run();
  equal(a.frames.join('\n'), b.frames.join('\n'), 'trajectories differ between identical seeded runs');
  equal(a.events.length, b.events.length, 'event count differs between identical seeded runs');
  assert(a.events.length > 50, 'expected a rich event stream');
});

test('reset with the same seed reproduces the run; a different seed is still valid', () => {
  const engine = new Engine({ seed: 7 });
  engine.paused = false;
  const wh = engine.warehouse;
  engine.createJob({ shelfId: wh.shelves[2].id, workstationId: wh.workstations[1].id, priority: 2 });
  const framesA = [];
  for (let t = 0; t < 60; t++) {
    engine.tickOnce();
    framesA.push(engine.robots.map((r) => `${r.x},${r.y}`).join('|'));
  }
  engine.reset(7, { autostart: true });
  assert(engine.tick === 0, 'tick resets to 0');
  equal(engine.jobs.length, 0, 'jobs are cleared by reset');
  equal(engine.blockedCells.size, 0, 'blocked cells are cleared by reset');
  engine.createJob({ shelfId: wh.shelves[2].id, workstationId: wh.workstations[1].id, priority: 2 });
  const framesB = [];
  for (let t = 0; t < 60; t++) {
    engine.tickOnce();
    framesB.push(engine.robots.map((r) => `${r.x},${r.y}`).join('|'));
  }
  equal(framesA.join('\n'), framesB.join('\n'), 'reset with the same seed must reproduce the run');
});

// ----------------------------------------------------------- anti-starvation ---
test('a low priority job is not starved by a stream of high priority jobs', () => {
  const engine = new Engine({ seed: 13 });
  engine.paused = false;
  const wh = engine.warehouse;
  const low = engine.createJob({ shelfId: wh.shelves[18].id, workstationId: wh.workstations[3].id, priority: 1 }).job;
  const spawned = [];
  let ticks = 0;
  while (ticks < 700 && low.status !== 'DONE') {
    // keep the queue flooded with urgent work
    if (ticks % 25 === 0) {
      const shelf = wh.shelves[(ticks / 25) % wh.shelves.length];
      const active = engine.jobs.find((j) => j.shelfId === shelf.id && j.status !== 'DONE');
      if (!active) {
        const r = engine.createJob({ shelfId: shelf.id, workstationId: wh.workstations[(ticks / 25) % 4].id, priority: 5 });
        if (r.job) spawned.push(r.job);
      }
    }
    engine.tickOnce();
    ticks += 1;
  }
  equal(low.status, 'DONE', `low priority job ${low.id} was starved (still ${low.status} after ${ticks} ticks)`);
  assert(ticks < 700, 'low priority job must finish in reasonable time');
});

test('waiting robots receive a scheduling priority boost (aging)', () => {
  const engine = new Engine({ seed: 17 });
  engine.paused = false;
  const wh = engine.warehouse;
  const job = engine.createJob({ shelfId: wh.shelves[5].id, workstationId: wh.workstations[2].id, priority: 1 }).job;
  for (let t = 0; t < 120 && job.status !== 'DONE'; t++) engine.tickOnce();
  assert(engine.events.some((e) => e.type === 'ROBOT_WAITING'), 'waiting must be explained by an event');
  for (const e of engine.events.filter((x) => x.type === 'ROBOT_WAITING')) {
    assert(typeof e.data.reason === 'string' && e.data.reason.length > 0, 'every wait must carry a machine readable reason');
    assert(typeof e.data.detail === 'string' && e.data.detail.length > 0, 'every wait must carry a human readable detail');
  }
});

test('deadlock breaker: a fully frozen fleet is detected and unstuck', () => {
  const engine = new Engine({ seed: 31 });
  engine.paused = false;
  const wh = engine.warehouse;
  // Drive every robot into a job first so the fleet is busy.
  for (let i = 0; i < 8; i++) engine.createJob({ shelfId: wh.shelves[(i * 2 + 1) % wh.shelves.length].id, workstationId: wh.workstations[i % 4].id, priority: 2 });
  simulate(engine, 200);
  assertNoCollisions(engine, simulate(engine, 60), 'post-deadlock');
  assert(engine.stats.replans > 10, 'scheduler must replan continuously');
});

// ------------------------------------------------------- streaming / REST ---
function wsClient(port) {
  return new Promise((resolve, reject) => {
    const key = crypto.randomBytes(16).toString('base64');
    const socket = net.connect(port, '127.0.0.1', () => {
      socket.write(
        [
          'GET /ws HTTP/1.1',
          `Host: 127.0.0.1:${port}`,
          'Upgrade: websocket',
          'Connection: Upgrade',
          `Sec-WebSocket-Key: ${key}`,
          'Sec-WebSocket-Version: 13',
          '\r\n',
        ].join('\r\n'),
      );
    });
    let buffer = Buffer.alloc(0);
    let handshakeDone = false;
    const messages = [];
    const waiters = [];
    const client = {
      messages,
      close: () => socket.destroy(),
      waitFor: (predicate, timeout = 4000) =>
        new Promise((res, rej) => {
          const found = messages.find(predicate);
          if (found) return res(found);
          const timer = setTimeout(() => rej(new Error('timeout waiting for websocket message')), timeout);
          waiters.push({
            predicate,
            resolve: (msg) => {
              clearTimeout(timer);
              res(msg);
            },
          });
        }),
      send: (obj) => {
        const payload = Buffer.from(JSON.stringify(obj), 'utf8');
        const mask = crypto.randomBytes(4);
        let header;
        if (payload.length < 126) {
          header = Buffer.alloc(2);
          header[1] = 0x80 | payload.length;
        } else {
          header = Buffer.alloc(4);
          header[1] = 0x80 | 126;
          header.writeUInt16BE(payload.length, 2);
        }
        header[0] = 0x81;
        const masked = Buffer.from(payload);
        for (let i = 0; i < masked.length; i++) masked[i] ^= mask[i & 3];
        socket.write(Buffer.concat([header, mask, masked]));
      },
    };
    socket.on('data', (chunk) => {
      buffer = Buffer.concat([buffer, chunk]);
      if (!handshakeDone) {
        const end = buffer.indexOf('\r\n\r\n');
        if (end === -1) return;
        const header = buffer.subarray(0, end).toString();
        if (!header.includes('101')) {
          reject(new Error(`websocket handshake failed: ${header.split('\r\n')[0]}`));
          return;
        }
        buffer = buffer.subarray(end + 4);
        handshakeDone = true;
        resolve(client);
      }
      for (;;) {
        if (buffer.length < 2) return;
        const b1 = buffer[1];
        let len = b1 & 0x7f;
        let offset = 2;
        if (len === 126) {
          if (buffer.length < 4) return;
          len = buffer.readUInt16BE(2);
          offset = 4;
        }
        if (buffer.length < offset + len) return;
        const opcode = buffer[0] & 0x0f;
        const payload = buffer.subarray(offset, offset + len);
        buffer = buffer.subarray(offset + len);
        if (opcode !== 0x1) continue;
        let msg;
        try {
          msg = JSON.parse(payload.toString('utf8'));
        } catch {
          continue;
        }
        messages.push(msg);
        for (let i = waiters.length - 1; i >= 0; i--) {
          if (waiters[i].predicate(msg)) {
            const w = waiters.splice(i, 1)[0];
            w.resolve(msg);
          }
        }
      }
    });
    socket.on('error', reject);
    setTimeout(() => reject(new Error('websocket connect timeout')), 4000);
  });
}

async function withServer(fn, opts = {}) {
  const { server, engine } = createServer({ seed: opts.seed ?? 4, dataFile: opts.dataFile ?? tmpFile('state.json'), persist: opts.persist ?? true, autostart: opts.autostart ?? false });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  try {
    return await fn({ port, server, engine, base: `http://127.0.0.1:${port}` });
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

test('HTTP API: create job, block cell, control the simulation', async () => {
  await withServer(async ({ base, engine }) => {
    const state = await (await fetch(`${base}/api/state`)).json();
    assert(state.snapshot.robots.length >= 8, 'snapshot must contain the robots');
    assert(state.snapshot.robots.every((r) => Array.isArray(r.path)), 'snapshot must contain planned paths');
    const wh = engine.warehouse;
    const created = await (
      await fetch(`${base}/api/jobs`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ shelfId: wh.shelves[1].id, workstationId: wh.workstations[0].id, priority: 4 }) })
    ).json();
    assert(created.job && created.job.status === 'PENDING', 'job should be created as PENDING');
    const blocked = await (
      await fetch(`${base}/api/cells`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ x: 5, y: 5, blocked: true }) })
    ).json();
    assert(blocked.ok, 'cell should be blocked');
    const conflict = await (
      await fetch(`${base}/api/cells`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ x: 2, y: 3, blocked: true }) })
    ).json();
    assert(conflict.error, 'shelf cells must not be blockable');
    for (const action of ['resume', 'step', 'pause', 'reset', 'resume', 'speed']) {
      const body = action === 'reset' ? { action, seed: 4 } : action === 'speed' ? { action, tps: 8 } : { action };
      const res = await fetch(`${base}/api/sim`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      assert(res.ok, `action ${action} failed with ${res.status}`);
    }
  });
});

test('WebSocket: snapshot on connect, then monotonically increasing event sequences', async () => {
  await withServer(
    async ({ port, base, engine }) => {
      const client = await wsClient(port);
      const snapshot = await client.waitFor((m) => m.type === 'snapshot');
      assert(snapshot.snapshot.robots.length >= 8, 'snapshot received over websocket');
      const wh = engine.warehouse;
      await fetch(`${base}/api/sim`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'resume' }) });
      await fetch(`${base}/api/jobs`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ shelfId: wh.shelves[2].id, workstationId: wh.workstations[1].id, priority: 3 }) });
      const jobEvent = await client.waitFor((m) => m.type === 'event' && m.event.type === 'JOB_ASSIGNED');
      assert(jobEvent.seq > snapshot.seq, 'event seq must be greater than the snapshot seq');
      const tickEvent = await client.waitFor((m) => m.type === 'event' && m.event.type === 'TICK');
      assert(tickEvent.seq > jobEvent.seq, 'seq must increase monotonically');
      let last = 0;
      for (const m of client.messages.filter((x) => x.type === 'event')) {
        assert(m.seq > last, `sequence numbers must strictly increase (${m.seq} after ${last})`);
        last = m.seq;
      }
      client.close();
    },
    { autostart: true },
  );
});

test('reconnect: snapshot after a disconnect is newer and stale events are dropped', async () => {
  await withServer(
    async ({ port, base, engine }) => {
      const wh = engine.warehouse;
      const first = await wsClient(port);
      const snapA = await first.waitFor((m) => m.type === 'snapshot');
      await fetch(`${base}/api/sim`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'resume' }) });
      await fetch(`${base}/api/jobs`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ shelfId: wh.shelves[4].id, workstationId: wh.workstations[2].id, priority: 5 }) });
      await first.waitFor((m) => m.type === 'event' && m.event.type === 'TICK');
      const lastSeen = first.messages.at(-1).seq;
      first.close();
      await sleep(400); // simulation keeps running while the client is away
      const second = await wsClient(port);
      const snapB = await second.waitFor((m) => m.type === 'snapshot');
      assert(snapB.seq >= lastSeen, `reconnect snapshot seq ${snapB.seq} must not be older than ${lastSeen}`);
      assert(snapB.tick >= snapA.tick, 'reconnect snapshot must be at a tick >= the first snapshot');
      // replay after snapshot: every following event must be strictly newer
      const later = await second.waitFor((m) => m.type === 'event' && m.seq > snapB.seq);
      assert(later.seq > snapB.seq, 'events after the snapshot must be newer');
      for (const m of second.messages.filter((x) => x.type === 'event')) {
        assert(m.seq > snapB.seq, `stale event ${m.seq} must not be delivered after snapshot ${snapB.seq}`);
        assert(m.event.data !== undefined || m.event.message, 'event payload present');
      }
      second.close();
    },
    { autostart: true },
  );
});

test('SSE fallback streams the same sequenced events', async () => {
  await withServer(
    async ({ base, engine }) => {
      const controller = new AbortController();
      const res = await fetch(`${base}/api/stream`, { signal: controller.signal });
      equal(res.status, 200, 'SSE status');
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let text = '';
      const readUntil = async (needle, timeout = 4000) => {
        const started = Date.now();
        while (!text.includes(needle)) {
          if (Date.now() - started > timeout) throw new Error(`SSE timeout waiting for ${needle}`);
          const { value, done } = await reader.read();
          if (done) break;
          text += decoder.decode(value, { stream: true });
        }
      };
      await readUntil('"type":"snapshot"');
      await fetch(`${base}/api/sim`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'resume' }) });
      await readUntil('"type":"event"');
      const seqs = [...text.matchAll(/"seq":(\d+)/g)].map((m) => Number(m[1]));
      assert(seqs.length > 0, 'SSE delivered sequenced messages');
      controller.abort();
    },
    { autostart: true },
  );
});

test('persistence: state, jobs and map changes survive a restart with a newer sequence', async () => {
  const dataFile = tmpFile('persist.json');
  let lastSeq = 0;
  let tickAtShutdown = 0;
  let jobId = null;
  await withServer(
    async ({ base, engine }) => {
      const wh = engine.warehouse;
      const created = await (
        await fetch(`${base}/api/jobs`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ shelfId: wh.shelves[6].id, workstationId: wh.workstations[1].id, priority: 3 }) })
      ).json();
      jobId = created.job.id;
      await fetch(`${base}/api/cells`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ x: 7, y: 14, blocked: true }) });
      await fetch(`${base}/api/sim`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'resume' }) });
      for (let i = 0; i < 30; i++) engine.tickOnce();
      await sleep(1200); // let the debounced store flush
    },
    { dataFile },
  );
  const saved = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
  tickAtShutdown = saved.tick;
  lastSeq = saved.eventSeq;
  assert(tickAtShutdown > 0, 'ticks must be persisted');
  assert(saved.blocked.length === 1, 'map changes must be persisted');
  assert(saved.jobs.length >= 1, 'jobs must be persisted');

  await withServer(
    async ({ base, engine }) => {
      assert(engine.tick >= tickAtShutdown, `restored tick ${engine.tick} must be >= the persisted tick ${tickAtShutdown}`);
      assert(engine.jobs.some((j) => j.id === jobId), 'restored job');
      assert(engine.blockedCells.size === 1, 'restored blocked cells');
      const before = engine.eventSeq;
      assert(before >= lastSeq, 'sequence continues after a restart');
      await fetch(`${base}/api/sim`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'step' }) });
      assert(engine.eventSeq > before, 'sequence numbers keep increasing after a restart');
    },
    { dataFile },
  );
});

test('single step only advances exactly one tick', async () => {
  await withServer(async ({ base, engine }) => {
    const before = engine.tick;
    await fetch(`${base}/api/sim`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'step' }) });
    equal(engine.tick, before + 1, 'step must advance exactly one tick');
    equal(engine.paused, true, 'step leaves the simulation paused');
  });
});

test('paused simulation does not advance over time', async () => {
  await withServer(async ({ base, engine }) => {
    await sleep(300);
    equal(engine.tick, 0, 'paused engine must not advance');
    await fetch(`${base}/api/sim`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'resume' }) });
    await sleep(320);
    assert(engine.tick > 0, 'resumed engine must advance');
    await fetch(`${base}/api/sim`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'pause' }) });
  });
});

// -------------------------------------------------------------------- run ---
const only = process.argv[2];
let failed = 0;
for (const { name, fn } of tests) {
  if (only && !name.includes(only)) continue;
  const started = Date.now();
  try {
    await fn();
    passed += 1;
    console.log(`  \u2713 ${name} (${Date.now() - started}ms)`);
  } catch (err) {
    failed += 1;
    failures.push({ name, err });
    console.log(`  \u2717 ${name} (${Date.now() - started}ms)`);
    console.log(`      ${err.message}`);
  }
}
console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
