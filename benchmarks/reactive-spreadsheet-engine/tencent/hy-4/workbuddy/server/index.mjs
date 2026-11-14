/**
 * Zero-runtime-dependency HTTP server.
 *
 *  - GET  /api/workbook      -> persisted raw cells + server-side computed results
 *  - PUT  /api/workbook      -> { cells: { A1: "=..." } } persists atomically
 *  - GET  /api/health        -> service status
 *  - /*                      -> static files from dist/ (production build)
 *
 * On every write the server re-runs the SAME formula engine over the raw cells
 * and stores the independently computed results. The client compares those with
 * its own computation after a reload, so persistence of raw formulas AND
 * computed values is verifiable end to end.
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { Workbook } from '../src/engine/workbook.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA_DIR = path.join(ROOT, 'data');
const DATA_FILE = path.join(DATA_DIR, 'workbook.json');
const DIST_DIR = path.join(ROOT, 'dist');
const BASE_PORT = Number(process.env.PORT || 18787);
const MAX_BODY = 2 * 1024 * 1024;
const SERVICE_ID = 'reactive-spreadsheet-engine';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.map': 'application/json; charset=utf-8',
  '.woff2': 'font/woff2',
};

function emptyRecord() {
  return { cells: {}, computed: {}, version: 0, updatedAt: null };
}

function readRecord() {
  try {
    const parsed = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    if (!parsed || typeof parsed.cells !== 'object' || parsed.cells === null) return emptyRecord();
    return parsed;
  } catch {
    return emptyRecord();
  }
}

function validateCells(cells) {
  if (!cells || typeof cells !== 'object' || Array.isArray(cells)) return null;
  const entries = Object.entries(cells);
  if (entries.length > 2000) return null;
  const clean = {};
  for (const [id, value] of entries) {
    if (!/^(?:\$?)[A-Za-z]{1,3}(?:\$?)[1-9]\d*$/.test(id)) continue;
    if (typeof value !== 'string' && typeof value !== 'number') return null;
    const text = String(value);
    if (text.length > 10000) return null;
    clean[id.toUpperCase()] = text;
  }
  return clean;
}

function save(cells) {
  const record = readRecord();
  // Server-side independent recalculation using the shared engine.
  const wb = new Workbook();
  wb.load(cells);
  const next = {
    cells: wb.snapshot(),
    computed: wb.computedSnapshot(),
    version: (record.version || 0) + 1,
    updatedAt: new Date().toISOString(),
    engine: 'shared-engine/v1',
    stats: {
      cells: wb.raw.size,
      formulas: wb.formulaCells().length,
      errors: wb.errorCells().length,
      cycles: wb.lastChange.cycleNodes.length,
    },
  };
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const tmp = `${DATA_FILE}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(next, null, 2), 'utf8');
  fs.renameSync(tmp, DATA_FILE);
  return next;
}

function sendJson(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(payload),
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': '*',
  });
  res.end(payload);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY) {
        reject(new Error('payload too large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function serveStatic(req, res, pathname) {
  let rel = decodeURIComponent(pathname);
  if (rel === '/' || rel === '') rel = '/index.html';
  const target = path.resolve(DIST_DIR, `.${rel}`);
  if (target !== DIST_DIR && !target.startsWith(DIST_DIR + path.sep)) {
    res.writeHead(403).end('Forbidden');
    return;
  }

  let file = target;
  if (!fs.existsSync(file) || !fs.statSync(file).isFile()) {
    file = path.join(DIST_DIR, 'index.html'); // SPA fallback
  }

  if (!fs.existsSync(file)) {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`<!doctype html><html><body style="font:16px system-ui;padding:40px;max-width:680px">
      <h1>Reactive Spreadsheet Engine</h1>
      <p>后端已启动，但还没有生产构建产物。</p>
      <p>开发模式请运行 <code>npm run dev</code>，然后打开
      <a href="http://localhost:5173">http://localhost:5173</a>。</p>
      <p>生产模式请先运行 <code>npm run build</code>，再运行 <code>npm start</code>。</p>
      <p>持久化接口：<code>GET/PUT /api/workbook</code>。</p>
    </body></html>`);
    return;
  }

  const ext = path.extname(file).toLowerCase();
  res.writeHead(200, {
    'Content-Type': MIME[ext] || 'application/octet-stream',
    'Cache-Control': ext === '.html' ? 'no-store' : 'public, max-age=3600',
  });
  fs.createReadStream(file).pipe(res);
}

const handler = async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname;

  if (req.method === 'OPTIONS' && pathname.startsWith('/api/')) {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    return res.end();
  }

  if (pathname === '/api/health') {
    return sendJson(res, 200, {
      ok: true,
      service: SERVICE_ID,
      persisted: fs.existsSync(DATA_FILE),
      version: readRecord().version || 0,
    });
  }

  if (pathname === '/api/workbook') {
    if (req.method === 'GET') return sendJson(res, 200, readRecord());
    if (req.method === 'PUT') {
      try {
        const body = await readBody(req);
        const parsed = JSON.parse(body || '{}');
        const cells = validateCells(parsed.cells);
        if (!cells) return sendJson(res, 400, { ok: false, error: 'invalid cells payload' });
        const record = save(cells);
        return sendJson(res, 200, {
          ok: true,
          version: record.version,
          updatedAt: record.updatedAt,
          computed: record.computed,
          stats: record.stats,
        });
      } catch (e) {
        return sendJson(res, 400, { ok: false, error: String(e.message || e) });
      }
    }
    return sendJson(res, 405, { ok: false, error: 'method not allowed' });
  }

  if (pathname.startsWith('/api/')) {
    return sendJson(res, 404, { ok: false, error: 'unknown endpoint' });
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405).end('Method Not Allowed');
    return;
  }
  serveStatic(req, res, pathname);
};

/**
 * Verify that a request to 127.0.0.1:port actually reaches THIS server.
 * On Windows another process may hold a more specific loopback binding even
 * when our 0.0.0.0 bind succeeded; in that case we move to the next port.
 */
function selfCheck(port) {
  return new Promise((resolve) => {
    const req = http.get(
      { host: '127.0.0.1', port, path: '/api/health', timeout: 1200 },
      (res) => {
        let body = '';
        res.on('data', (chunk) => { body += chunk; });
        res.on('end', () => resolve(body.includes(SERVICE_ID)));
      },
    );
    req.on('error', () => resolve(false));
    req.on('timeout', () => { req.destroy(); resolve(false); });
  });
}

let attempts = 0;
function listen(port) {
  const instance = http.createServer(handler);
  instance.once('error', (err) => {
    if (err.code === 'EADDRINUSE' && attempts < 15) {
      attempts++;
      listen(port + 1);
      return;
    }
    console.error(`[spreadsheet] 无法监听端口 ${port}: ${err.message}`);
    process.exit(1);
  });

  instance.listen(port, '0.0.0.0', async () => {
    const ours = await selfCheck(port);
    if (!ours && attempts < 15) {
      attempts++;
      console.warn(`[spreadsheet] 端口 ${port} 被其它服务占用，尝试 ${port + 1}…`);
      instance.close(() => listen(port + 1));
      return;
    }
    console.log(`[spreadsheet] API + 静态服务已启动 → http://localhost:${port}`);
    try {
      fs.mkdirSync(DATA_DIR, { recursive: true });
      fs.writeFileSync(
        path.join(DATA_DIR, 'runtime-port.json'),
        JSON.stringify({ port, url: `http://localhost:${port}` }),
        'utf8',
      );
    } catch {
      // non-fatal: the port is still printed above
    }
  });
}

listen(BASE_PORT);
