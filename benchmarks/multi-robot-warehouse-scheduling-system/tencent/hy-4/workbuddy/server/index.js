'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const { Engine } = require('./engine');

const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const PUBLIC = path.join(ROOT, 'public');
const STATIC_ROOT = fs.existsSync(path.join(DIST, 'index.html')) ? DIST : PUBLIC;
const DATA_DIR = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.join(ROOT, 'data');

const PORT = Number(process.env.PORT || 4173);
const HOST = process.env.HOST || '0.0.0.0';
let tickMs = Number(process.env.TICK_MS || 320);
if (!Number.isFinite(tickMs) || tickMs < 60) tickMs = 320;

fs.mkdirSync(DATA_DIR, { recursive: true });
const engine = new Engine({ dataDir: DATA_DIR, seed: Number(process.env.SEED || 20261114) });
engine.speedMs = tickMs;

const clients = new Set();
const history = []; // {seq, payload} - used only to report missed events on reconnect

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

function json(res, code, body) {
  const data = JSON.stringify(body);
  res.writeHead(code, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(data),
    'Cache-Control': 'no-store',
  });
  res.end(data);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (c) => {
      raw += c;
      if (raw.length > 65536) { reject(new Error('body too large')); req.destroy(); }
    });
    req.on('end', () => {
      if (!raw) return resolve({});
      try { resolve(JSON.parse(raw)); } catch (e) { reject(new Error('invalid JSON body')); }
    });
    req.on('error', reject);
  });
}

/** Publish the authoritative state with a new (or current) sequence number. */
function publish(type, extra = {}) {
  const state = engine.snapshot();
  const message = {
    type,
    seq: state.seq,
    state,
    speedMs: tickMs,
    ...extra,
  };
  const payload = JSON.stringify(message);
  history.push({ seq: state.seq, payload });
  if (history.length > 400) history.shift();
  const frame = `id: ${state.seq}\nevent: state\ndata: ${payload}\n\n`;
  for (const res of clients) {
    try { res.write(frame); } catch (_) { clients.delete(res); }
  }
  engine.persist();
  return message;
}

function serveStatic(req, res, urlPath) {
  let rel = decodeURIComponent(urlPath.split('?')[0]);
  if (rel === '/' || rel === '') rel = '/index.html';
  const full = path.resolve(STATIC_ROOT, '.' + rel);
  if (!full.startsWith(STATIC_ROOT)) { json(res, 403, { error: 'forbidden' }); return; }
  fs.readFile(full, (err, buf) => {
    if (err) { json(res, 404, { error: 'not found', path: rel }); return; }
    res.writeHead(200, {
      'Content-Type': MIME[path.extname(full)] || 'application/octet-stream',
      'Cache-Control': 'no-cache',
    });
    res.end(buf);
  });
}

const server = http.createServer(async (req, res) => {
  const u = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const p = u.pathname;

  try {
    if (req.method === 'GET' && p === '/api/health') {
      return json(res, 200, {
        ok: true, seq: engine.seq, tick: engine.tick, paused: engine.paused,
        clients: clients.size, seed: engine.seed, tickMs,
      });
    }

    if (req.method === 'GET' && p === '/api/state') {
      return json(res, 200, { seq: engine.seq, state: engine.snapshot() });
    }

    if (req.method === 'GET' && p === '/api/stream') {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no',
      });
      res.write('retry: 1000\n\n');

      const lastSeq = Number(u.searchParams.get('lastSeq') || req.headers['last-event-id'] || 0) || 0;
      const state = engine.snapshot();
      // A COMPLETE snapshot is always sent first. Its seq is the watermark;
      // the client discards any event with seq <= this value.
      const snapshotMsg = {
        type: 'snapshot',
        seq: state.seq,
        state,
        speedMs: tickMs,
        resumedFrom: lastSeq,
        missed: history.filter((h) => h.seq > lastSeq).length,
        note: 'complete authoritative snapshot; client will only apply newer seq',
      };
      res.write(`id: ${state.seq}\nevent: snapshot\ndata: ${JSON.stringify(snapshotMsg)}\n\n`);
      clients.add(res);
      req.on('close', () => clients.delete(res));
      return;
    }

    if (req.method === 'POST' && p === '/api/jobs') {
      const body = await readBody(req);
      const job = engine.createJob(body);
      publish('job', { created: job.id });
      return json(res, 201, { ok: true, seq: engine.seq, job });
    }

    if (req.method === 'POST' && p === '/api/cells') {
      const body = await readBody(req);
      const result = engine.toggleCell(body.x, body.y, body.blocked);
      publish('map', result);
      return json(res, 200, { ok: true, seq: engine.seq, ...result });
    }

    if (req.method === 'POST' && p === '/api/block-ahead') {
      const body = await readBody(req);
      const result = engine.blockAhead(body.robotId);
      publish('map', result);
      return json(res, 200, { ok: true, seq: engine.seq, ...result });
    }

    if (req.method === 'POST' && p === '/api/control') {
      const body = await readBody(req);
      const action = String(body.action || '');
      if (action === 'pause') engine.paused = true;
      else if (action === 'resume') engine.paused = false;
      else if (action === 'step') engine.advance();
      else if (action === 'speed') {
        const ms = Number(body.ms);
        if (!Number.isFinite(ms) || ms < 60 || ms > 5000) throw new Error('ms must be 60..5000');
        tickMs = ms; engine.speedMs = ms;
      } else if (action === 'reset') {
        engine.reset(body.seed === undefined ? engine.seed : body.seed, { keepSeq: true });
        engine.emit('system', `Manual reset with seed ${engine.seed}; sequence continues at ${engine.seq}`);
      } else {
        throw new Error(`unknown action: ${action}`);
      }
      if (action !== 'step') engine.seq++;
      const msg = publish('control', { action });
      return json(res, 200, { ok: true, seq: msg.seq, paused: engine.paused, tick: engine.tick, tickMs });
    }

    if (req.method === 'GET') return serveStatic(req, res, p);
    return json(res, 405, { error: 'method not allowed' });
  } catch (err) {
    return json(res, 400, { ok: false, error: err.message || String(err) });
  }
});

// Fixed time steps. The backend is the only place that advances robot positions.
let last = Date.now();
const timer = setInterval(() => {
  const now = Date.now();
  if (now - last < tickMs) return;
  last = now;
  if (engine.paused) return;
  try {
    engine.advance();
    publish('tick');
  } catch (err) {
    engine.emit('system', `tick error: ${err.message}`);
    publish('error', { error: err.message });
  }
}, 25);

const heartbeat = setInterval(() => {
  for (const res of clients) {
    try { res.write(': heartbeat\n\n'); } catch (_) { clients.delete(res); }
  }
}, 15000);

function shutdown() {
  clearInterval(timer);
  clearInterval(heartbeat);
  engine.persist();
  for (const res of clients) { try { res.end(); } catch (_) {} }
  server.close(() => process.exit(0));
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

server.listen(PORT, HOST, () => {
  console.log(`[warehouse] http://localhost:${PORT}`);
  console.log(`[warehouse] static: ${STATIC_ROOT}`);
  console.log(`[warehouse] seed=${engine.seed} seq=${engine.seq} tick=${engine.tick} tickMs=${tickMs}`);
  console.log(`[warehouse] restored=${fs.existsSync(path.join(DATA_DIR, 'state.json'))}`);
});
