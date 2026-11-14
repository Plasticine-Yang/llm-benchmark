import http from 'node:http';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { WebSocketServer } from 'ws';
import { Engine, DEFAULT_TPS } from './engine.js';
import { Store } from './store.js';
import { describeWarehouse } from './warehouse.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const PORT = Number(process.env.PORT || 8787);
const DATA_DIR = process.env.DATA_DIR || path.join(ROOT, 'data');
const CLIENT_DIST = path.join(ROOT, 'client', 'dist');

const store = new Store(DATA_DIR);
const engine = new Engine({ seed: Number(process.env.SEED || 20261114) });

const persisted = store.load();
if (persisted && engine.hydrate(persisted)) {
  console.log(`[boot] restored run #${persisted.runId} at tick ${persisted.tick}`);
} else {
  console.log('[boot] no persisted run found — starting fresh');
}

const wsClients = new Set();
const sseClients = new Set();

function broadcast(msg) {
  const text = JSON.stringify(msg);
  for (const ws of wsClients) {
    if (ws.readyState === 1) ws.send(text);
  }
  for (const res of sseClients) {
    res.write(`data: ${text}\n\n`);
  }
  store.save(engine.serialize());
}

engine.onChange = broadcast;

const app = express();
app.use(express.json({ limit: '256kb' }));

const wrap = (fn) => (req, res) => {
  try {
    const out = fn(req, res);
    if (out !== undefined && !res.headersSent) res.json(out);
  } catch (err) {
    if (!res.headersSent) res.status(400).json({ error: err.message });
  }
};

app.get('/api/health', (req, res) => res.json({ ok: true, tick: engine.state.tick, seq: engine.state.seq }));
app.get('/api/meta', (req, res) => res.json({ meta: describeWarehouse(engine.wh) }));
app.get('/api/state', (req, res) => res.json(engine.snapshot()));

app.post('/api/jobs', wrap((req) => {
  const { shelfId, stationId, priority } = req.body || {};
  return { job: engine.createJob({ shelfId, stationId, priority }) };
}));

app.post('/api/jobs/auto', wrap((req) => {
  const count = Math.max(1, Math.min(12, Number(req.body?.count) || 3));
  const created = [];
  const shelves = engine.wh.shelves;
  const stations = engine.wh.stations;
  const base = engine.state.jobSeq;
  for (let i = 0; i < count; i++) {
    const shelf = shelves[(base * 3 + i * 7) % shelves.length];
    const station = stations[(base + i * 2) % stations.length];
    const priority = 5 - (i % 5);
    created.push(engine.createJob({ shelfId: shelf.id, stationId: station.id, priority }));
  }
  return { jobs: created };
}));

app.delete('/api/jobs/:id', wrap((req) => ({ job: engine.cancelJob(req.params.id) })));

app.post('/api/cells/block', wrap((req) => {
  const { x, y } = req.body || {};
  return engine.blockCell(Number(x), Number(y));
}));

app.post('/api/cells/unblock', wrap((req) => {
  const { x, y } = req.body || {};
  return engine.unblockCell(Number(x), Number(y));
}));

app.post('/api/sim/pause', wrap(() => { engine.setRunning(false); return { running: false }; }));
app.post('/api/sim/resume', wrap(() => { engine.setRunning(true); return { running: true }; }));
app.post('/api/sim/step', wrap(() => { engine.singleStep(); return { tick: engine.state.tick }; }));
app.post('/api/sim/speed', wrap((req) => { engine.setSpeed(req.body?.tps); return { tps: engine.state.tps }; }));
app.post('/api/sim/reset', wrap((req) => {
  const seed = req.body?.seed;
  engine.reset(seed === undefined || seed === null || seed === '' ? engine.state.seed : seed);
  store.save(engine.serialize(), { force: true });
  return { runId: engine.state.runId, seed: engine.state.seed };
}));

app.get('/api/stream', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.write(`data: ${JSON.stringify(engine.snapshot())}\n\n`);
  sseClients.add(res);
  const ping = setInterval(() => res.write(': ping\n\n'), 15000);
  req.on('close', () => { clearInterval(ping); sseClients.delete(res); });
});

if (fs.existsSync(CLIENT_DIST)) {
  app.use(express.static(CLIENT_DIST));
  app.use((req, res, next) => {
    if (req.method !== 'GET' || req.path.startsWith('/api')) return next();
    res.sendFile(path.join(CLIENT_DIST, 'index.html'));
  });
} else {
  app.get('/', (req, res) => res.type('text/plain').send(
    'API is running. Build the client (npm run build) or use the Vite dev server (npm run dev).',
  ));
}

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

wss.on('connection', (ws) => {
  wsClients.add(ws);
  // Reconnect contract: a complete snapshot first, then only newer deltas.
  ws.send(JSON.stringify(engine.snapshot()));
  ws.on('message', (raw) => {
    let msg;
    try { msg = JSON.parse(raw.toString()); } catch { return; }
    if (msg?.type === 'hello') ws.send(JSON.stringify(engine.snapshot()));
    if (msg?.type === 'ping') ws.send(JSON.stringify({ type: 'pong', seq: engine.state.seq }));
  });
  ws.on('close', () => wsClients.delete(ws));
  ws.on('error', () => wsClients.delete(ws));
});

engine.start();

server.listen(PORT, () => {
  console.log(`[boot] warehouse server on http://localhost:${PORT}  (ws://localhost:${PORT}/ws)`);
  console.log(`[boot] seed=${engine.state.seed} robots=${engine.state.robots.length} shelves=${engine.wh.shelves.length} stations=${engine.wh.stations.length} tps=${DEFAULT_TPS}`);
});

function shutdown() {
  console.log('[shutdown] flushing state');
  engine.stop();
  store.save(engine.serialize(), { force: true });
  store.flush();
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 1500).unref();
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);