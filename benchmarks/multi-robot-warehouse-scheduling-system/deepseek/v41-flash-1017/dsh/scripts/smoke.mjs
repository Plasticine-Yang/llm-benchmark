#!/usr/bin/env node
/**
 * End-to-end smoke test.
 * Boots an isolated server, exercises three concurrent jobs, blocks a route
 * cell, and validates snapshot → newer update sequencing across a reconnect.
 */
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import WebSocket from 'ws';

const PORT = Number(process.env.SMOKE_PORT || 8899);
const base = `http://127.0.0.1:${PORT}`;
const wsBase = `ws://127.0.0.1:${PORT}/ws`;
const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'tessera-smoke-'));
const dataFile = path.join(tmp, 'state.json');

const child = spawn(process.execPath, ['server/index.js'], {
  env: {
    ...process.env,
    PORT: String(PORT),
    DATA_FILE: dataFile,
    RESET_STATE: '1',
  },
  stdio: ['ignore', 'pipe', 'pipe'],
});
let serverLog = '';
child.stdout.on('data', (chunk) => {
  serverLog += chunk;
});
child.stderr.on('data', (chunk) => {
  serverLog += chunk;
});

async function waitForServer() {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    try {
      const response = await fetch(`${base}/api/health`);
      if (response.ok) return response.json();
    } catch {
      // not ready
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Server did not become healthy.\n${serverLog}`);
}

async function api(method, endpoint, body) {
  const response = await fetch(`${base}${endpoint}`, {
    method,
    headers: { 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const payload = await response.json();
  if (!response.ok || !payload.ok) throw new Error(payload.error || `HTTP ${response.status}`);
  return payload;
}

function openSocket() {
  const socket = new WebSocket(wsBase);
  const messages = [];
  const waiters = [];
  socket.on('message', (raw) => {
    const message = JSON.parse(String(raw));
    messages.push(message);
    for (const waiter of [...waiters]) {
      if (waiter.predicate(message)) {
        waiter.resolve(message);
        waiters.splice(waiters.indexOf(waiter), 1);
      }
    }
  });
  const waitFor = (predicate, timeout = 6000) =>
    new Promise((resolve, reject) => {
      const existing = messages.find(predicate);
      if (existing) return resolve(existing);
      const waiter = { predicate, resolve };
      waiters.push(waiter);
      setTimeout(() => {
        const index = waiters.indexOf(waiter);
        if (index >= 0) waiters.splice(index, 1);
        reject(new Error('Timed out waiting for WebSocket message.'));
      }, timeout).unref();
    });
  return { socket, messages, waitFor };
}

function closeSocket(socket) {
  return new Promise((resolve) => {
    if (socket.readyState >= 2) return resolve();
    socket.once('close', resolve);
    socket.close();
  });
}

let socketA;
let socketB;
try {
  await waitForServer();

  socketA = openSocket();
  const firstSnapshot = await socketA.waitFor((message) => message.type === 'snapshot');
  assert.ok(firstSnapshot.seq > 0);
  assert.equal(firstSnapshot.state.seq, firstSnapshot.seq);
  let lastSeq = firstSnapshot.seq;

  const state = (await api('GET', '/api/state')).state;
  const shelfPicks = ['S01', 'S08', 'S15'];
  const stationPicks = ['WS-B', 'WS-D', 'WS-A'];
  for (let i = 0; i < 3; i += 1) {
    await api('POST', '/api/jobs', {
      shelfId: shelfPicks[i],
      workstationId: stationPicks[i],
      priority: [3, 2, 1][i],
    });
  }
  await api('POST', '/api/sim/resume');

  const update = await socketA.waitFor(
    (message) => message.type === 'update' && message.seq > lastSeq,
  );
  lastSeq = update.seq;
  assert.equal(update.state.seq, update.seq);
  assert.ok(update.seq > firstSnapshot.seq);

  // Let a few fixed ticks accumulate while the client is disconnected.
  await closeSocket(socketA.socket);
  await new Promise((resolve) => setTimeout(resolve, 1500));

  socketB = openSocket();
  const reconnectSnapshot = await socketB.waitFor((message) => message.type === 'snapshot');
  assert.equal(reconnectSnapshot.state.seq, reconnectSnapshot.seq);
  assert.ok(
    reconnectSnapshot.seq >= lastSeq,
    `reconnect snapshot ${reconnectSnapshot.seq} must not be older than ${lastSeq}`,
  );
  const postReconnectUpdate = await socketB.waitFor(
    (message) => message.type === 'update' && message.seq > reconnectSnapshot.seq,
  );
  assert.ok(postReconnectUpdate.seq > reconnectSnapshot.seq);

  // Freeze time, then choose a cell 2–4 route steps ahead of any active robot.
  await api('POST', '/api/sim/pause');
  const frozen = await api('GET', '/api/state');
  const active = frozen.state.robots.find(
    (robot) => robot.route.length > 3 && !robot.waiting && robot.status !== 'idle',
  );
  assert.ok(active, 'expected an active planned route');
  const target = active.route[Math.min(active.route.length - 1, 4)];
  await api('POST', '/api/block', { x: target.x, y: target.y, blocked: true });
  const blocked = await api('GET', '/api/state');
  assert.ok(blocked.state.blockedCells.some((cell) => cell.x === target.x && cell.y === target.y));
  for (const robot of blocked.state.robots) {
    assert.ok(
      !robot.route.some((cell) => cell.x === target.x && cell.y === target.y),
      `${robot.id} retained a path through the new obstacle`,
    );
  }
  await api('POST', '/api/sim/step');
  const stepped = await api('GET', '/api/state');
  assert.ok(stepped.state.tick > frozen.state.tick);
  assert.ok(stepped.state.seq > blocked.state.seq);

  // Send a fresh snapshot after a second reconnect and ensure later updates
  // are strictly newer than it.
  await api('POST', '/api/sim/resume');
  await closeSocket(socketB.socket);
  await new Promise((resolve) => setTimeout(resolve, 350));
  const socketC = openSocket();
  const finalSnapshot = await socketC.waitFor((message) => message.type === 'snapshot');
  const newer = await socketC.waitFor(
    (message) => message.type === 'update' && message.seq > finalSnapshot.seq,
  );
  assert.ok(newer.seq > finalSnapshot.seq);
  await closeSocket(socketC.socket);

  console.log('SMOKE PASS');
  console.log(
    JSON.stringify(
      {
        snapshotSeq: firstSnapshot.seq,
        reconnectSnapshotSeq: reconnectSnapshot.seq,
        postReconnectSeq: postReconnectUpdate.seq,
        blockedCell: target,
        finalSeq: newer.seq,
        activeJobs: stepped.state.stats.activeJobs,
        queue: stepped.state.stats.queuedJobs,
      },
      null,
      2,
    ),
  );
} finally {
  try {
    if (socketA?.socket?.readyState < 2) await closeSocket(socketA.socket);
  } catch {}
  try {
    if (socketB?.socket?.readyState < 2) await closeSocket(socketB.socket);
  } catch {}
  child.kill('SIGTERM');
  await Promise.race([once(child, 'exit'), new Promise((resolve) => setTimeout(resolve, 2000))]);
  if (child.exitCode === null) child.kill('SIGKILL');
  await fs.rm(tmp, { recursive: true, force: true });
}
