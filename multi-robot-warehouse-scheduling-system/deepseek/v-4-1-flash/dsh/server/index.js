// HTTP + WebSocket / SSE server. The engine is the single authoritative state
// source; every client receives a complete snapshot on connect and then a stream
// of monotonically sequenced events.

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';
import { Engine } from './engine.js';
import { Store } from './store.js';
import { attachWebSocket, attachSse } from './ws.js';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
export const ROOT = path.resolve(__dirname, '..');

const args = process.argv.slice(2);
const getArg = (name, fallback) => {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  if (hit) return hit.split('=').slice(1).join('=');
  const idx = args.indexOf(`--${name}`);
  if (idx !== -1 && args[idx + 1] && !args[idx + 1].startsWith('--')) return args[idx + 1];
  return fallback;
};
const PROD = args.includes('--prod') || process.env.NODE_ENV === 'production';
const PORT = Number(process.env.PORT ?? getArg('port', 8090));
const DATA_FILE = process.env.DSH_STATE_FILE ?? path.join(ROOT, 'data', 'simulation-state.json');
const RESET_ON_BOOT = args.includes('--fresh') || process.env.FRESH === '1';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.map': 'application/json; charset=utf-8',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
};

export function createServer({ seed = 7, dataFile = DATA_FILE, persist = true, autostart = false } = {}) {
  const store = new Store(dataFile);
  const saved = persist && !RESET_ON_BOOT ? store.load() : null;
  const engine = saved ? Engine.fromSerialized(saved) : new Engine({ seed });
  if (!saved && autostart) engine.paused = false;
  const clients = new Set();

  const publicDir = PROD && fs.existsSync(path.join(ROOT, 'dist')) ? path.join(ROOT, 'dist') : path.join(ROOT, 'public');

  const broadcast = (message) => {
    for (const client of clients) {
      if (client.closed) continue;
      const ok = client.send(JSON.stringify(message));
      if (ok === false) client.closed = true;
    }
  };

  engine.subscribe((event) => {
    for (const client of clients) {
      if (client.closed || event.seq <= client.lastSeq) continue;
      client.lastSeq = event.seq;
      client.send(JSON.stringify({ type: 'event', seq: event.seq, tick: event.tick, event }));
    }
  });

  const schedulePersist = () => {
    if (!persist) return;
    store.save(() => engine.serialize());
  };

  const attach = (client) => {
    clients.add(client);
    client.lastSeq = 0;
    const snapshot = engine.snapshot();
    client.lastSeq = snapshot.seq;
    client.send(
      JSON.stringify({
        type: 'snapshot',
        seq: snapshot.seq,
        tick: snapshot.tick,
        snapshot,
        config: engine.config(),
        server: { prod: PROD, dataFile: persist ? dataFile : null, publicDir },
      }),
    );
    // catch-up: replay any event that happened after the snapshot was taken
    for (const event of engine.events) {
      if (event.seq > client.lastSeq) {
        client.lastSeq = event.seq;
        client.send(JSON.stringify({ type: 'event', seq: event.seq, tick: event.tick, event }));
      }
    }
    return () => clients.delete(client);
  };

  const readBody = (req) =>
    new Promise((resolve, reject) => {
      let raw = '';
      req.on('data', (chunk) => {
        raw += chunk;
        if (raw.length > 1e6) reject(new Error('payload too large'));
      });
      req.on('end', () => {
        if (!raw) return resolve({});
        try {
          resolve(JSON.parse(raw));
        } catch (err) {
          reject(new Error(`invalid JSON body: ${err.message}`));
        }
      });
      req.on('error', reject);
    });

  const json = (res, status, payload) => {
    const body = JSON.stringify(payload);
    res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Content-Length': Buffer.byteLength(body), 'Cache-Control': 'no-store' });
    res.end(body);
  };

  const serveStatic = (req, res, pathname) => {
    let rel = decodeURIComponent(pathname);
    if (rel === '/' || rel === '') rel = '/index.html';
    const target = path.join(publicDir, path.normalize(rel).replace(/^([/\\])+/, ''));
    if (!target.startsWith(publicDir)) {
      res.writeHead(403).end('forbidden');
      return;
    }
    fs.stat(target, (err, stat) => {
      if (err || !stat.isFile()) {
        if (!path.extname(rel)) {
          // SPA-ish fallback for unknown routes
          const fallback = path.join(publicDir, 'index.html');
          if (fs.existsSync(fallback)) {
            const out = fs.readFileSync(fallback);
            res.writeHead(200, { 'Content-Type': MIME['.html'], 'Content-Length': out.length });
            res.end(out);
            return;
          }
        }
        res.writeHead(404, { 'Content-Type': 'text/plain' }).end('not found');
        return;
      }
      res.writeHead(200, {
        'Content-Type': MIME[path.extname(target)] ?? 'application/octet-stream',
        'Content-Length': stat.size,
        'Cache-Control': PROD ? 'public, max-age=60' : 'no-store',
      });
      fs.createReadStream(target).pipe(res);
    });
  };

  const server = http.createServer(async (req, res) => {
    const parsed = new URL(req.url, `http://${req.headers.host ?? 'localhost'}`);
    const pathname = parsed.pathname;

    try {
      if (attachSse(req, res, { onConnection: (client) => attach(client) })) {
        return;
      }
      if (pathname === '/api/health') {
        return json(res, 200, { ok: true, tick: engine.tick, seq: engine.eventSeq, paused: engine.paused, clients: clients.size, uptime: process.uptime() });
      }
      if (pathname === '/api/config') {
        return json(res, 200, { config: engine.config() });
      }
      if (pathname === '/api/state') {
        return json(res, 200, { seq: engine.eventSeq, snapshot: engine.snapshot() });
      }
      if (pathname === '/api/events') {
        const since = Number(parsed.searchParams.get('since') ?? 0);
        return json(res, 200, {
          seq: engine.eventSeq,
          events: engine.events.filter((e) => e.seq > since),
        });
      }
      if (pathname === '/api/jobs' && req.method === 'POST') {
        const body = await readBody(req);
        const result = engine.createJob({
          shelfId: body.shelfId,
          workstationId: body.workstationId,
          priority: body.priority,
        });
        if (result.error) return json(res, 400, { error: result.error });
        schedulePersist();
        return json(res, 200, { job: result.job, seq: engine.eventSeq });
      }
      if (pathname === '/api/jobs' && req.method === 'GET') {
        return json(res, 200, { jobs: engine.jobs, seq: engine.eventSeq });
      }
      if (pathname === '/api/sim' && req.method === 'POST') {
        const body = await readBody(req);
        const action = body.action;
        if (action === 'pause') engine.pause();
        else if (action === 'resume') engine.resume();
        else if (action === 'step') engine.step();
        else if (action === 'speed') engine.setTps(body.tps);
        else if (action === 'reset') {
          engine.reset(body.seed ?? engine.seed, { autostart: body.autostart ?? true });
        } else {
          return json(res, 400, { error: `unknown action ${action}` });
        }
        schedulePersist();
        return json(res, 200, { ok: true, snapshot: engine.snapshot(), seq: engine.eventSeq });
      }
      if (pathname === '/api/cells' && req.method === 'POST') {
        const body = await readBody(req);
        const x = Number(body.x);
        const y = Number(body.y);
        if (!Number.isInteger(x) || !Number.isInteger(y)) return json(res, 400, { error: 'x and y must be integers' });
        const result = engine.setBlocked(x, y, body.blocked !== false);
        if (result.error) return json(res, 409, { error: result.error });
        schedulePersist();
        return json(res, 200, { ok: true, x, y, blocked: body.blocked !== false, affected: engine.affectedRobots(engine.idx(x, y)), seq: engine.eventSeq });
      }
      if (pathname === '/api/robots/block-ahead' && req.method === 'POST') {
        const body = await readBody(req);
        const result = engine.blockAheadOf(body.robotId);
        if (result.error) return json(res, 409, { error: result.error });
        schedulePersist();
        return json(res, 200, { ok: true, ...result, seq: engine.eventSeq });
      }
      if (pathname === '/api/demo' && req.method === 'POST') {
        const created = [];
        for (let i = 0; i < 3; i++) {
          const shelf = engine.warehouse.shelves[(i * 3 + 1) % engine.warehouse.shelves.length];
          const ws = engine.warehouse.workstations[(i + 1) % engine.warehouse.workstations.length];
          const active = engine.jobs.find((j) => j.shelfId === shelf.id && j.status !== 'DONE');
          if (active) continue;
          const result = engine.createJob({ shelfId: shelf.id, workstationId: ws.id, priority: i === 1 ? 5 : 2 });
          if (result.job) created.push(result.job);
        }
        schedulePersist();
        return json(res, 200, { created, seq: engine.eventSeq });
      }
      if (pathname.startsWith('/api/') || req.method !== 'GET') {
        return json(res, 404, { error: `no route for ${req.method} ${pathname}` });
      }
      return serveStatic(req, res, pathname);
    } catch (err) {
      return json(res, 500, { error: err.message });
    }
  });

  attachWebSocket(server, {
    onConnection: (ws) => {
      const detach = attach({
        kind: 'ws',
        send: (text) => ws.send(text),
        close: () => ws.close(),
        closed: false,
      });
      ws.on('message', (text) => {
        try {
          const msg = JSON.parse(text);
          if (msg.type === 'ping') ws.send(JSON.stringify({ type: 'pong', seq: engine.eventSeq, tick: engine.tick }));
          if (msg.type === 'resync') ws.send(JSON.stringify({ type: 'snapshot', seq: engine.eventSeq, tick: engine.tick, snapshot: engine.snapshot() }));
        } catch {
          /* ignore malformed client messages */
        }
      });
      ws.on('close', detach);
    },
  });

  // ---- fixed-step simulation loop -------------------------------------------
  let stopped = false;
  let lastPersist = Date.now();
  const loop = () => {
    if (stopped) return;
    if (!engine.paused) {
      engine.tickOnce();
      if (Date.now() - lastPersist > 3000) {
        lastPersist = Date.now();
        schedulePersist();
      }
    }
    setTimeout(loop, Math.max(15, Math.round(1000 / engine.tps))).unref?.();
  };
  loop();

  const shutdown = () => {
    stopped = true;
    if (persist) store.flush(() => engine.serialize());
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 300).unref?.();
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  server.on('listening', () => {
    const addr = server.address();
    console.log(`[warehouse] multi-robot warehouse scheduling system`);
    console.log(`[warehouse] engine: seed=${engine.seed} tick=${engine.tick} paused=${engine.paused} robots=${engine.robots.length} shelves=${engine.warehouse.shelves.length} lanes=${engine.warehouse.lanes.length}`);
    console.log(`[warehouse] persistence: ${persist ? dataFile : 'disabled'}`);
    console.log(`[warehouse] serving ${publicDir} (${PROD ? 'production' : 'development'})`);
    console.log(`[warehouse] http://127.0.0.1:${addr.port}/  (ws://127.0.0.1:${addr.port}/ws, sse /api/stream)`);
  });

  return { server, engine, store, publicDir };
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(url.fileURLToPath(import.meta.url));
if (isMain) {
  const { server } = createServer({ seed: Number(getArg('seed', 7)) });
  server.listen(PORT, () => {});
}
