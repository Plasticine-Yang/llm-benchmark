'use strict';

/**
 * End-to-end acceptance test: starts the real server, drives the real REST +
 * SSE API, and verifies the full scenario from the brief.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const net = require('net');

const ROOT = path.resolve(__dirname, '..');

function freePort() {
  return new Promise((resolve, reject) => {
    const s = net.createServer();
    s.on('error', reject);
    s.listen(0, '127.0.0.1', () => {
      const p = s.address().port;
      s.close(() => resolve(p));
    });
  });
}

function start(port, dataDir) {
  const child = spawn(process.execPath, [path.join(ROOT, 'server', 'index.js')], {
    cwd: ROOT,
    env: {
      ...process.env,
      PORT: String(port), HOST: '127.0.0.1', DATA_DIR: dataDir, TICK_MS: '1000',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let logs = '';
  child.stdout.on('data', (d) => { logs += d.toString(); });
  child.stderr.on('data', (d) => { logs += d.toString(); });
  return { child, logs: () => logs };
}

async function waitHealthy(base, timeoutMs = 10000) {
  const end = Date.now() + timeoutMs;
  while (Date.now() < end) {
    try {
      const r = await fetch(`${base}/api/health`);
      if (r.ok) return (await r.json());
    } catch (_) { /* starting up */ }
    await new Promise((r) => setTimeout(r, 60));
  }
  throw new Error('server did not become healthy');
}

function stop(child) {
  return new Promise((resolve) => {
    if (child.exitCode !== null) return resolve();
    child.once('exit', () => resolve());
    child.kill('SIGTERM');
    setTimeout(resolve, 2500);
  });
}

async function collectFrames(reader, count, timeoutMs = 9000) {
  const dec = new TextDecoder();
  let buf = '';
  const frames = [];
  const deadline = Date.now() + timeoutMs;
  while (frames.length < count && Date.now() < deadline) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    let cut;
    while ((cut = buf.indexOf('\n\n')) >= 0) {
      const raw = buf.slice(0, cut);
      buf = buf.slice(cut + 2);
      const ev = (raw.match(/^event: (.+)$/m) || [])[1] || 'message';
      const dm = raw.match(/^data: (.+)$/m);
      if (dm) frames.push({ event: ev, data: JSON.parse(dm[1]) });
    }
  }
  return frames;
}

test('end-to-end: 3 jobs, narrow aisles, dynamic block, SSE snapshot + seq, persistence', async (t) => {
  const port = await freePort();
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'warehouse-e2e-'));
  let srv = start(port, dataDir);
  t.after(async () => { await stop(srv.child); fs.rmSync(dataDir, { recursive: true, force: true }); });

  const base = `http://127.0.0.1:${port}`;
  await waitHealthy(base);
  const get = async (p) => (await fetch(base + p)).json();
  const post = async (p, body) => {
    const r = await fetch(base + p, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return r.json();
  };

  // Deterministic stepping (pause the wall-clock ticker).
  await post('/api/control', { action: 'pause' });

  // --- 3 simultaneous transport jobs, auto-assigned -------------------------
  for (const j of [
    { shelfId: 'S03', stationId: 'W4', priority: 5 },
    { shelfId: 'S07', stationId: 'W3', priority: 3 },
    { shelfId: 'S16', stationId: 'W2', priority: 1 },
  ]) {
    const r = await post('/api/jobs', j);
    assert.equal(r.ok, true, `job creation failed: ${JSON.stringify(r)}`);
  }
  let snap = (await get('/api/state')).state;
  assert.equal(snap.jobs.length, 3);
  assert.ok(snap.jobs.every((j) => j.status === 'assigned' && j.robotId),
    'scheduler must auto-assign an available robot to every new job');
  assert.equal(new Set(snap.jobs.map((j) => j.robotId)).size, 3, 'jobs must go to distinct robots');

  for (let i = 0; i < 28; i++) await post('/api/control', { action: 'step' });
  snap = (await get('/api/state')).state;
  assert.equal(snap.stats.collisions, 0);
  assert.ok(snap.robots.some((r) => r.plan.length > 4), 'robots must have reserved multi-step routes');

  // --- block the cell directly ahead of an active robot ---------------------
  const active = snap.robots.find((r) => r.jobId && r.plan.length > 1 && (r.plan[1].x !== r.x || r.plan[1].y !== r.y));
  assert.ok(active, 'need a robot with a forward move');
  const ahead = active.plan[1];
  const blk = await post('/api/block-ahead', { robotId: active.id });
  assert.equal(blk.ok, true);
  assert.ok(blk.affected.includes(active.id), 'affected robot must be reported');

  const afterBlock = (await get('/api/state')).state;
  const replanned = afterBlock.robots.find((r) => r.id === active.id);
  assert.ok(!replanned.plan.some((c) => c.x === ahead.x && c.y === ahead.y),
    'the new route must not cross the new obstacle');
  assert.ok(afterBlock.events.some((e) => e.type === 'replan'),
    'a replan reason must be exposed in the event log');
  assert.ok(afterBlock.blocked.includes(`${ahead.x},${ahead.y}`));

  for (let i = 0; i < 6; i++) await post('/api/control', { action: 'step' });
  const movedState = (await get('/api/state')).state;
  assert.ok(!movedState.robots.some((r) => r.x === ahead.x && r.y === ahead.y),
    'no robot may enter the newly blocked cell');

  // --- SSE: complete snapshot first, then only newer seq --------------------
  const beforeStream = (await get('/api/state')).seq;
  const ctrl = new AbortController();
  const resp = await fetch(`${base}/api/stream?lastSeq=${beforeStream}`, { signal: ctrl.signal });
  assert.equal(resp.headers.get('content-type').includes('text/event-stream'), true);
  const reader = resp.body.getReader();
  const framesPromise = collectFrames(reader, 3);
  await post('/api/control', { action: 'step' });
  await post('/api/control', { action: 'step' });
  const frames = await framesPromise;
  ctrl.abort();

  assert.ok(frames.length >= 3, `expected snapshot + 2 state frames, got ${frames.length}`);
  assert.equal(frames[0].event, 'snapshot');
  assert.equal(frames[0].data.type, 'snapshot');
  assert.equal(frames[0].data.resumedFrom, beforeStream);
  assert.equal(frames[0].data.state.map.cells.length, snap.map.cells.length,
    'snapshot must contain the complete warehouse map');
  assert.equal(frames[0].data.state.robots.length, 8);
  assert.ok(frames[0].data.seq >= beforeStream);

  // Emulate the client's monotonic watermark guard.
  let watermark = frames[0].data.seq;
  let applied = 0;
  for (const f of frames.slice(1)) {
    assert.equal(f.event, 'state');
    if (f.data.seq > watermark) { watermark = f.data.seq; applied++; }
  }
  assert.equal(applied, 2, 'both newer events must be applied, none may revert state');
  assert.ok(frames[2].data.seq > frames[1].data.seq, 'sequence numbers must strictly increase');
  assert.ok(frames[2].data.state.tick >= frames[1].data.state.tick, 'tick must never go backwards');

  // --- stale replay protection: reconnect with an old lastSeq ---------------
  const oldSeq = Math.max(0, watermark - 6);
  const ctrl2 = new AbortController();
  const resp2 = await fetch(`${base}/api/stream?lastSeq=${oldSeq}`, { signal: ctrl2.signal });
  const reconnectFrames = await collectFrames(resp2.body.getReader(), 1, 5000);
  ctrl2.abort();
  assert.equal(reconnectFrames[0].event, 'snapshot');
  assert.equal(reconnectFrames[0].data.resumedFrom, oldSeq);
  assert.ok(reconnectFrames[0].data.missed > 0, 'server must report missed events');
  assert.ok(reconnectFrames[0].data.seq >= watermark,
    'reconnect snapshot must be at least as fresh as the last applied event (no stale revert)');

  // --- persistence --------------------------------------------------------
  const persisted = JSON.parse(fs.readFileSync(path.join(dataDir, 'state.json'), 'utf8'));
  const live = (await get('/api/state')).state;
  assert.equal(persisted.tick, live.tick);
  assert.equal(persisted.seq, live.seq);
  assert.equal(persisted.jobs.length, 3);
  assert.equal(persisted.robots.length, 8);
  assert.ok(persisted.blocked.includes(`${ahead.x},${ahead.y}`));

  // Restart the process: the same run must be restored from disk.
  await stop(srv.child);
  srv = start(port, dataDir);
  await waitHealthy(base);
  const restored = (await get('/api/state')).state;
  assert.equal(restored.tick, live.tick, 'page reload / server restart must continue the same run');
  assert.equal(restored.jobs.length, 3);
  assert.ok(restored.blocked.includes(`${ahead.x},${ahead.y}`));
  assert.ok(restored.seq >= live.seq, 'sequence must remain monotonic after restore');
});
