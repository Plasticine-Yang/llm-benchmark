import express from 'express';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { WebSocket, WebSocketServer } from 'ws';
import { WarehouseSimulation, validateRestore } from './simulation.js';
import { StateStore } from './store.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const dist = path.join(root, 'dist');
const port = Number(process.env.PORT || 8787);
const host = process.env.HOST || '0.0.0.0';
const requestedSeed = process.env.SEED !== undefined ? Number(process.env.SEED) : 20261017;
const store = new StateStore();

function createSimulation() {
  let restore = null;
  if (process.env.RESET_STATE !== '1') {
    const loaded = store.load();
    if (validateRestore(loaded)) {
      restore = loaded;
      console.log(`[state] Restored run ${loaded.runId} at tick ${loaded.tick} (seq ${loaded.seq}).`);
    } else if (loaded) {
      console.warn('[state] Persisted state is incomplete; starting a fresh run.');
    }
  }
  try {
    return new WarehouseSimulation({ seed: requestedSeed, restore });
  } catch (error) {
    console.error('[state] Restore failed, falling back to a fresh run:', error.message);
    return new WarehouseSimulation({ seed: requestedSeed });
  }
}

const sim = createSimulation();
const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });
const clients = new Set();
let lastTickStarted = 0;

app.disable('x-powered-by');
app.use(express.json({ limit: '24kb' }));
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  next();
});

function serializeState(state) {
  return JSON.stringify(state);
}

function broadcastState(snapshot) {
  const message = JSON.stringify({ type: 'update', seq: snapshot.seq, state: snapshot, serverTime: new Date().toISOString() });
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  }
}

sim.onUpdate = (snapshot) => {
  broadcastState(snapshot);
  store.save(sim.persistableSnapshot());
};

wss.on('connection', (socket, request) => {
  clients.add(socket);
  socket.isAlive = true;
  socket.on('pong', () => {
    socket.isAlive = true;
  });
  socket.on('close', () => clients.delete(socket));
  socket.on('error', () => clients.delete(socket));
  // Snapshot is generated and written synchronously before this socket can
  // receive any broadcast, guaranteeing snapshot → contiguous newer updates.
  const snapshot = sim.snapshot();
  socket.send(
    JSON.stringify({
      type: 'snapshot',
      seq: snapshot.seq,
      state: snapshot,
      serverTime: new Date().toISOString(),
    }),
  );
  console.log(`[ws] Client connected (${request.socket.remoteAddress}) at seq ${snapshot.seq}; ${clients.size} live.`);
});

const heartbeat = setInterval(() => {
  for (const client of clients) {
    if (client.isAlive === false) {
      client.terminate();
      clients.delete(client);
      continue;
    }
    client.isAlive = false;
    try {
      client.ping();
    } catch {
      client.terminate();
      clients.delete(client);
    }
  }
}, 25000);
heartbeat.unref?.();

// The browser never advances the simulation. A single fixed-step driver on the
// server is authoritative; requests mutate state between ticks.
const tickTimer = setInterval(() => {
  if (!sim.running) return;
  if (Date.now() - lastTickStarted < sim.warehouse.tickMs * 0.7) return;
  lastTickStarted = Date.now();
  try {
    sim.advanceTick();
  } catch (error) {
    console.error('[sim] Tick failed:', error);
  }
}, sim.warehouse.tickMs);
tickTimer.unref?.();

function stateResponse(res, status = 200) {
  return res.status(status).json({ ok: true, state: sim.snapshot() });
}

function fail(res, status, error) {
  return res.status(status).json({ ok: false, error: error instanceof Error ? error.message : String(error) });
}

app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    uptimeSeconds: Math.round(process.uptime()),
    seq: sim.seq,
    tick: sim.tick,
    running: sim.running,
    seed: sim.seed,
    wsClients: clients.size,
    persistence: {
      file: path.relative(root, store.filePath),
      lastError: store.lastError?.message ?? null,
    },
  });
});

app.get('/api/state', (req, res) => stateResponse(res));

app.get('/api/meta', (req, res) => {
  res.json({
    ok: true,
    protocol: 'tessera.warehouse.v1',
    seed: sim.seed,
    algorithms: {
      pathfinding: 'Time-expanded A* with wait actions',
      scheduling: 'Priority dispatch with aging + space-time reservations',
      deadlock: 'One-cell aisle exclusive locks + edge/vertex reservations',
    },
  });
});

app.post('/api/sim/pause', (req, res) => {
  try {
    sim.pause();
    return stateResponse(res);
  } catch (error) {
    return fail(res, 500, error);
  }
});

app.post('/api/sim/resume', (req, res) => {
  try {
    sim.resume();
    return stateResponse(res);
  } catch (error) {
    return fail(res, 500, error);
  }
});

app.post('/api/sim/step', (req, res) => {
  try {
    sim.step();
    return stateResponse(res);
  } catch (error) {
    return fail(res, 500, error);
  }
});

app.post('/api/sim/reset', (req, res) => {
  try {
    const seed = req.body?.seed === undefined || req.body.seed === '' ? sim.seed : req.body.seed;
    sim.reset(seed);
    return stateResponse(res);
  } catch (error) {
    return fail(res, 400, error);
  }
});

app.post('/api/jobs', (req, res) => {
  try {
    const { shelfId, workstationId, priority } = req.body ?? {};
    if (!shelfId || !workstationId) throw new Error('shelfId and workstationId are required.');
    sim.createJob({ shelfId, workstationId, priority });
    return stateResponse(res, 201);
  } catch (error) {
    return fail(res, 400, error);
  }
});

app.post('/api/jobs/demo', (req, res) => {
  try {
    const shelves = [...sim.warehouse.shelves].sort((a, b) => a.id.localeCompare(b.id));
    const stations = [...sim.warehouse.workstations];
    const cursor = sim.jobs.length % shelves.length;
    for (let index = 0; index < 3; index += 1) {
      sim.createJob({
        shelfId: shelves[(cursor + index * 5) % shelves.length].id,
        workstationId: stations[index % stations.length].id,
        priority: [3, 2, 1][index],
      });
    }
    return stateResponse(res, 201);
  } catch (error) {
    return fail(res, 400, error);
  }
});

app.post('/api/block', (req, res) => {
  try {
    const { x, y, blocked = true } = req.body ?? {};
    if (x === undefined || y === undefined) throw new Error('x and y are required.');
    const snapshot = sim.setCellBlocked(x, y, blocked);
    return res.status(200).json({ ok: true, state: snapshot });
  } catch (error) {
    return fail(res, 400, error);
  }
});

app.post('/api/blocks/clear', (req, res) => {
  try {
    sim.clearBlocks();
    return stateResponse(res);
  } catch (error) {
    return fail(res, 500, error);
  }
});

if (fs.existsSync(dist)) {
  app.use(express.static(dist, { index: false, maxAge: '1h' }));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/ws')) return next();
    return res.sendFile(path.join(dist, 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.status(200).send(`
      <!doctype html><html><head><meta charset="utf-8"><title>Tessera API</title>
      <style>body{font-family:ui-monospace,monospace;background:#090d13;color:#d7e2ef;padding:40px;line-height:1.6}a{color:#5ee7c4}</style></head>
      <body><h1>TESSERA / WAREHOUSE OS</h1><p>The API is running on port ${port}. The frontend bundle has not been built yet.</p>
      <p>Run <code>pnpm build</code> then <code>pnpm start</code>, or use <code>pnpm dev</code> and open the Vite URL (port 5173).</p>
      <p><a href="/api/state">GET /api/state</a> · <a href="/api/health">GET /api/health</a></p></body></html>
    `);
  });
}

app.use((error, req, res, next) => {
  console.error('[http] Unhandled error:', error);
  if (res.headersSent) return next(error);
  return fail(res, 500, error);
});

server.listen(port, host, () => {
  console.log(`[tessera] Warehouse OS listening on http://localhost:${port}`);
  console.log(`[tessera] WebSocket endpoint ws://localhost:${port}/ws`);
  console.log(`[tessera] Run seed ${sim.seed} · seq ${sim.seq} · tick ${sim.tick} · ${sim.running ? 'RUNNING' : 'PAUSED'}`);
  store.save(sim.persistableSnapshot());
});

let shuttingDown = false;
async function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`[tessera] ${signal} — saving authoritative state.`);
  clearInterval(tickTimer);
  clearInterval(heartbeat);
  for (const client of clients) {
    try {
      client.close(1001, 'server shutting down');
    } catch {
      // no-op
    }
  }
  wss.close();
  store.save(sim.persistableSnapshot());
  await store.flushNow();
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 1500).unref?.();
}

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));
