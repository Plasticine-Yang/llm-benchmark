// End-to-end acceptance scenario, exactly as described in the brief:
//
//   1. create at least three simultaneous transport jobs and watch robots pass
//      through the narrow aisles without colliding,
//   2. block a cell directly ahead of an active robot and verify immediate
//      replanning (the robot stops before the new obstacle),
//   3. disconnect, reconnect and verify that the snapshot plus the following
//      event sequence stay consistent (monotonic sequence numbers, no stale
//      reversion).
//
//   node scripts/acceptance.mjs
//
// It talks to a real server over HTTP + WebSocket, so it validates the whole
// stack instead of the engine in isolation.

import net from 'node:net';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createServer } from '../server/index.js';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const tmp = () => path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'warehouse-accept-')), 'state.json');

function wsClient(port) {
  return new Promise((resolve, reject) => {
    const key = crypto.randomBytes(16).toString('base64');
    const socket = net.connect(port, '127.0.0.1', () => {
      socket.write(
        ['GET /ws HTTP/1.1', `Host: 127.0.0.1:${port}`, 'Upgrade: websocket', 'Connection: Upgrade', `Sec-WebSocket-Key: ${key}`, 'Sec-WebSocket-Version: 13', '\r\n'].join('\r\n'),
      );
    });
    let buffer = Buffer.alloc(0);
    let ready = false;
    const messages = [];
    const waiters = [];
    const client = {
      messages,
      close: () => socket.destroy(),
      waitFor: (predicate, timeout = 6000) =>
        new Promise((res, rej) => {
          const hit = messages.find(predicate);
          if (hit) return res(hit);
          const timer = setTimeout(() => rej(new Error('timeout waiting for websocket message')), timeout);
          waiters.push({ predicate, resolve: (m) => { clearTimeout(timer); res(m); } });
        }),
    };
    socket.on('data', (chunk) => {
      buffer = Buffer.concat([buffer, chunk]);
      if (!ready) {
        const end = buffer.indexOf('\r\n\r\n');
        if (end === -1) return;
        buffer = buffer.subarray(end + 4);
        ready = true;
        resolve(client);
      }
      for (;;) {
        if (buffer.length < 2) return;
        let len = buffer[1] & 0x7f;
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
          if (waiters[i].predicate(msg)) waiters.splice(i, 1)[0].resolve(msg);
        }
      }
    });
    socket.on('error', reject);
  });
}

const check = (label, ok, detail = '') => {
  console.log(`   ${ok ? '\u2713' : '\u2717'} ${label}${detail ? ` — ${detail}` : ''}`);
  if (!ok) process.exitCode = 1;
};

const { server, engine } = createServer({ seed: 2024, dataFile: tmp(), persist: true, autostart: true });
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const port = server.address().port;
const base = `http://127.0.0.1:${port}`;
const post = async (url, body) => (await fetch(`${base}${url}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })).json();
const wh = engine.warehouse;

console.log(`\nMulti-robot warehouse acceptance run (seed ${engine.seed})\n`);
console.log(`map ${wh.width}x${wh.height} · ${wh.shelves.length} shelves · ${wh.workstations.length} workstations · ${wh.lanes.length} single-lane aisles · ${engine.robots.length} robots`);

// ---------------------------------------------------------------- scenario 1 ---
console.log('\n1) three simultaneous transport jobs through the narrow aisles');
const client = await wsClient(port);
const snap = await client.waitFor((m) => m.type === 'snapshot');
check('snapshot on connect', snap.snapshot.robots.length === engine.robots.length, `seq ${snap.seq}, tick ${snap.tick}`);
const jobs = [];
for (const [i, shelf] of [wh.shelves[1], wh.shelves[12], wh.shelves[17]].entries()) {
  const res = await post('/api/jobs', { shelfId: shelf.id, workstationId: wh.workstations[(i + 1) % 4].id, priority: i === 1 ? 5 : 2 + i });
  if (res.job) jobs.push(res.job);
}
check('three jobs created', jobs.length === 3, jobs.map((j) => `${j.id}(${j.priority})`).join(', '));

// watch the fleet for a while, verifying the reservations hold on every frame
let violations = 0;
let laneEntries = 0;
let swaps = 0;
let previous = new Map();
for (let i = 0; i < 90; i++) {
  await sleep(120);
  const state = await (await fetch(`${base}/api/state`)).json();
  const occupied = new Map();
  for (const robot of state.snapshot.robots) {
    const key = `${robot.x},${robot.y}`;
    if (occupied.has(key)) violations += 1;
    occupied.set(key, robot.id);
    const before = previous.get(robot.id);
    if (before && (before.x !== robot.x || before.y !== robot.y)) {
      const other = occupied.get(`${before.x},${before.y}`);
      if (other && other !== robot.id) {
        const otherBefore = previous.get(other);
        if (otherBefore && otherBefore.x === robot.x && otherBefore.y === robot.y) swaps += 1;
      }
    }
    if (wh.laneIdByCell[engine.idx(robot.x, robot.y)] !== -1) laneEntries += 1;
  }
  previous = new Map(state.snapshot.robots.map((r) => [r.id, { x: r.x, y: r.y }]));
  for (const r of state.snapshot.robots) {
    if (!engine.isTraversableXY(r.x, r.y)) violations += 1;
  }
  if (state.snapshot.jobs.every((j) => j.status === 'DONE')) break;
}
const finalState = await (await fetch(`${base}/api/state`)).json();
check('no cell ever shared by two robots', violations === 0, `${violations} violations observed`);
check('no cell swap between two robots', swaps === 0, `${swaps} swaps observed`);
check('robots used the one-cell-wide aisles', laneEntries > 0, `${laneEntries} robot-in-aisle samples`);
check(
  'jobs finished',
  finalState.snapshot.jobs.filter((j) => j.status === 'DONE').length >= 2,
  `${finalState.snapshot.jobs.filter((j) => j.status === 'DONE').length}/${finalState.snapshot.jobs.length} delivered in ${finalState.snapshot.tick} ticks`,
);

// ---------------------------------------------------------------- scenario 2 ---
console.log('\n2) block the cell directly ahead of an active robot');
let target = null;
for (let i = 0; i < 60 && !target; i++) {
  await post('/api/jobs', { shelfId: wh.shelves[(i * 3) % wh.shelves.length].id, workstationId: wh.workstations[i % 4].id, priority: 3 });
  await sleep(200);
  const state = await (await fetch(`${base}/api/state`)).json();
  target = state.snapshot.robots.find((r) => r.jobId && r.path.length > 3);
}
check('found an active robot with a planned route', Boolean(target), target ? `${target.id} at (${target.x},${target.y})` : 'none');
if (target) {
  const ahead = target.path[1];
  const blocked = await post('/api/robots/block-ahead', { robotId: target.id });
  check('cell ahead blocked', blocked.ok === true, `(${ahead[0]},${ahead[1]})`);
  const blockedKey = `${ahead[0]},${ahead[1]}`;
  let entered = false;
  let replanSeen = false;
  for (let i = 0; i < 40; i++) {
    await sleep(120);
    const state = await (await fetch(`${base}/api/state`)).json();
    const robot = state.snapshot.robots.find((r) => r.id === target.id);
    if (!robot) break;
    if (`${robot.x},${robot.y}` === blockedKey) entered = true;
    if (robot.path.every(([x, y]) => `${x},${y}` !== blockedKey)) replanSeen = true;
  }
  check('robot never entered the blocked cell', !entered);
  check('robot replanned around the obstacle', replanSeen);
  check(
    'the wait/block reason was published',
    engine.events.some((e) => e.type === 'CELL_BLOCKED') && engine.events.some((e) => e.type === 'REPLAN'),
    `${engine.stats.replans} coordinated replans so far`,
  );
}

// ---------------------------------------------------------------- scenario 3 ---
console.log('\n3) disconnect, reconnect, verify snapshot + sequence consistency');
const before = client.messages.filter((m) => m.type === 'event').at(-1);
client.close();
await sleep(900); // the simulation keeps running while the page is away
const second = await wsClient(port);
const snap2 = await second.waitFor((m) => m.type === 'snapshot');
const later = await second.waitFor((m) => m.type === 'event' && m.seq > snap2.seq);
const allSeqs = second.messages.filter((m) => m.type === 'event').map((m) => m.seq);
check('reconnected snapshot is not older than the last seen event', snap2.seq >= (before?.seq ?? 0), `last seen ${before?.seq ?? 0} -> snapshot ${snap2.seq}`);
check('snapshot is authoritative (robots + paths included)', snap2.snapshot.robots.length === engine.robots.length && snap2.snapshot.robots.every((r) => Array.isArray(r.path)));
check('post-snapshot events are strictly newer', later.seq > snap2.seq, `first newer event seq ${later.seq}`);
check('sequence numbers strictly increase', allSeqs.every((seq, i) => i === 0 || seq > allSeqs[i - 1]), `${allSeqs.length} events replayed`);
check(
  'no stale reversion after reconnect',
  engine.tick >= (snap?.tick ?? 0),
  `tick ${snap?.tick ?? 0} -> ${snap2.tick} -> ${engine.tick}`,
);
second.close();

console.log(`\nengine stats: ${JSON.stringify(engine.stats)}`);
console.log(process.exitCode ? '\nacceptance FAILED\n' : '\nacceptance PASSED\n');
server.close();
server.closeAllConnections?.();
setTimeout(() => process.exit(process.exitCode ?? 0), 150);
