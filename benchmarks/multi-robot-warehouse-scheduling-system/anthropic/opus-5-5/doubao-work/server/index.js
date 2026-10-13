// HTTP + SSE server. The backend owns the fixed-step simulation clock.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createMap, initialState, Sim } from './sim.js';
import { Store } from './store.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.PORT) || 8787;
const DATA = process.env.DATA_FILE || path.join(ROOT, 'data', 'state.json');
const DIST = path.join(ROOT, 'dist');

const map = createMap();
const store = new Store(DATA);
const saved = store.load();
const sim = new Sim(map, saved || initialState(map, Number(process.env.SEED) || 42));
if (!saved) sim.planAll(); else console.log(`Restored run: tick ${saved.tick}, seq ${saved.seq}, ${saved.jobs.length} jobs`);
sim.subscribe(() => store.saveSoon(() => sim.state));
store.saveNow(sim.state);

// Fixed time-step clock (self-correcting, no drift accumulation).
let nextAt = Date.now();
function loop() {
  const now = Date.now();
  if (sim.state.running) {
    if (now >= nextAt) { try { sim.step(); } catch (e) { console.error('step failed', e); } nextAt = Math.max(nextAt + sim.state.tickMs, now - sim.state.tickMs); }
  } else nextAt = now + sim.state.tickMs;
  setTimeout(loop, Math.max(10, Math.min(50, nextAt - Date.now())));
}
loop();

// SSE clients
const clients = new Set();
sim.subscribe((ev) => {
  const data = `id: ${ev.seq}\nevent: update\ndata: ${JSON.stringify(ev)}\n\n`;
  for (const res of clients) res.write(data);
});
setInterval(() => { for (const res of clients) res.write(`: ping\n\n`); }, 15000);

function send(res, code, obj) { res.writeHead(code, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(obj)); }
function body(req) {
  return new Promise((resolve, reject) => {
    let b = ''; req.on('data', (c) => { b += c; if (b.length > 1e5) reject(new Error('Body too large')); });
    req.on('end', () => { try { resolve(b ? JSON.parse(b) : {}); } catch { reject(new Error('Invalid JSON')); } });
  });
}
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.json': 'application/json' };

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  const p = url.pathname;
  try {
    if (p === '/api/stream') {
      res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' });
      // Snapshot first, then live events with seq > snapshot.seq (same synchronous turn: no gap).
      const snap = sim.snapshot();
      res.write(`retry: 1000\nid: ${snap.seq}\nevent: snapshot\ndata: ${JSON.stringify(snap)}\n\n`);
      clients.add(res);
      req.on('close', () => clients.delete(res));
      return;
    }
    if (p === '/api/state' && req.method === 'GET') return send(res, 200, sim.snapshot());
    if (req.method === 'POST' && p.startsWith('/api/')) {
      const b = await body(req);
      switch (p) {
        case '/api/jobs': return send(res, 200, { job: sim.createJob(b), seq: sim.state.seq });
        case '/api/jobs/demo': return send(res, 200, { jobs: sim.demoJobs(), seq: sim.state.seq });
        case '/api/jobs/random': return send(res, 200, { jobs: sim.randomJobs(Math.min(20, Number(b.count) || 5)), seq: sim.state.seq });
        case '/api/cells': return send(res, 200, { ...sim.setBlocked(b.x, b.y, b.blocked), seq: sim.state.seq });
        case '/api/control': {
          const a = b.action;
          if (a === 'pause') sim.setRunning(false);
          else if (a === 'resume') sim.setRunning(true);
          else if (a === 'step') { if (sim.state.running) sim.setRunning(false); sim.step(); }
          else if (a === 'reset') sim.reset(b.seed !== undefined && b.seed !== '' ? Number(b.seed) : undefined);
          else if (a === 'speed') sim.setSpeed(b.tickMs);
          else return send(res, 400, { error: `Unknown action ${a}` });
          store.saveNow(sim.state);
          return send(res, 200, { ok: true, seq: sim.state.seq, tick: sim.state.tick });
        }
        default: return send(res, 404, { error: 'Not found' });
      }
    }
    // static (production build)
    let f = path.join(DIST, path.normalize(p).replace(/^(\.\.[/\\])+/, ''));
    if (!f.startsWith(DIST)) return send(res, 403, { error: 'Forbidden' });
    if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(DIST, 'index.html');
    if (!fs.existsSync(f)) { res.writeHead(200, { 'Content-Type': 'text/plain' }); return res.end('Frontend not built. Run `npm run build` or use `npm run dev`.'); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
    fs.createReadStream(f).pipe(res);
  } catch (e) {
    send(res, 400, { error: e.message });
  }
});
server.listen(PORT, () => console.log(`Warehouse scheduler backend on http://localhost:${PORT}`));
const shutdown = () => { try { store.saveNow(sim.state); } catch {} process.exit(0); };
process.on('SIGINT', shutdown); process.on('SIGTERM', shutdown);
