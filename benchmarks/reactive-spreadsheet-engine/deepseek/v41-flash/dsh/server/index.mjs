/**
 * Zero-dependency persistence + static file server.
 *
 *   node server/index.mjs            # development (serves public/ + src/ ESM)
 *   node server/index.mjs --production   # serves the built dist/ bundle
 *
 * API
 *   GET  /api/health      -> {ok:true}
 *   GET  /api/workbook    -> {cells:{A1:"=B1+1",...}, updatedAt, meta}
 *   PUT  /api/workbook    -> {cells} persists atomically, returns the saved doc
 *   POST /api/workbook/reset -> restores the seeded default workbook
 */
import http from 'node:http';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(HERE, '..');
const PUBLIC_DIR = path.join(ROOT, 'public');
const SRC_DIR = path.join(ROOT, 'src');
const DIST_DIR = path.join(ROOT, 'dist');

const MAX_BODY_BYTES = 5 * 1024 * 1024;
const MAX_CELLS = 20000;
const REF_RE = /^\$?[A-Za-z]{1,3}\$?\d{1,7}$/;

/** Small workbook shown on a brand new install: a 4-level dependency chain. */
export const DEFAULT_WORKBOOK = {
  cells: {
    A1: '10',
    A2: '=A1*2',
    A3: '=A2+5',
    A4: '=SUM(A1:A3)',
    B1: '=AVG(A1:A4)',
    B2: '=A4-B1',
    C1: '=IF(A4>50,"big","small")',
    D1: '=SUM(A1:A4)*2-A2',
  },
};

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.map': 'application/json; charset=utf-8',
};

function send(res, status, body, headers = {}) {
  const payload = typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body);
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    ...headers,
  });
  res.end(payload);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
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

/** Reject anything that is not a plausible A1 address / raw string pair. */
export function sanitizeCells(input) {
  const out = {};
  if (!input || typeof input !== 'object') return out;
  let count = 0;
  for (const [key, val] of Object.entries(input)) {
    if (count >= MAX_CELLS) break;
    const ref = String(key).toUpperCase();
    if (!REF_RE.test(ref)) continue;
    if (typeof val !== 'string') continue;
    if (val === '' || val.length > 4000) continue;
    out[ref] = val;
    count += 1;
  }
  return out;
}

/** A tiny file-backed store with atomic writes and serialized access. */
export class WorkbookStore {
  constructor(file) {
    this.file = file;
    this.queue = Promise.resolve();
  }

  async init() {
    // touch the parent directory but leave the file absent so the default shows
    await fsp.mkdir(path.dirname(this.file), { recursive: true });
  }

  async read() {
    try {
      const text = await fsp.readFile(this.file, 'utf8');
      const parsed = JSON.parse(text);
      return {
        cells: sanitizeCells(parsed.cells),
        updatedAt: parsed.updatedAt || null,
        meta: parsed.meta || { rows: 60, cols: 26 },
        source: 'disk',
      };
    } catch (err) {
      if (err.code !== 'ENOENT') {
        // corrupted file: keep serving rather than crashing
        console.error(`[store] could not read ${this.file}: ${err.message}`);
      }
      return {
        cells: { ...DEFAULT_WORKBOOK.cells },
        updatedAt: null,
        meta: { rows: 60, cols: 26 },
        source: 'default',
      };
    }
  }

  async write(cells) {
    const doc = {
      version: 1,
      updatedAt: new Date().toISOString(),
      meta: { rows: 60, cols: 26 },
      cells: sanitizeCells(cells),
    };
    const run = async () => {
      const tmp = `${this.file}.${process.pid}.tmp`;
      await fsp.mkdir(path.dirname(this.file), { recursive: true });
      await fsp.writeFile(tmp, JSON.stringify(doc, null, 2), 'utf8');
      await fsp.rename(tmp, this.file);
    };
    this.queue = this.queue.then(run, run);
    await this.queue;
    return doc;
  }

  async reset() {
    return this.write({ ...DEFAULT_WORKBOOK.cells });
  }
}

function safeJoin(base, urlPath) {
  const decoded = decodeURIComponent(urlPath.split('?')[0]);
  const target = path.resolve(base, `.${path.posix.normalize(decoded)}`);
  if (!target.startsWith(path.resolve(base))) return null;
  return target;
}

/** Where ES module sources live: dist/src for a source build, otherwise src/. */
function srcBase(production) {
  const inDist = path.join(DIST_DIR, 'src');
  if (production && fs.existsSync(inDist)) return inDist;
  return SRC_DIR;
}

function serveFile(res, file) {
  return fsp.readFile(file).then((buf) => {
    const ext = path.extname(file).toLowerCase();
    res.writeHead(200, {
      'content-type': MIME[ext] || 'application/octet-stream',
      'content-length': buf.length,
      'cache-control': 'no-store',
    });
    res.end(buf);
  });
}

export function createRequestHandler({ production = false, store }) {
  return async function handle(req, res) {
    const url = req.url || '/';
    const pathname = url.split('?')[0];

    try {
      /* ---------------- API ---------------- */
      if (pathname === '/api/health') {
        send(res, 200, { ok: true, production });
        return;
      }

      if (pathname === '/api/workbook' && req.method === 'GET') {
        const doc = await store.read();
        send(res, 200, doc);
        return;
      }

      if (pathname === '/api/workbook' && req.method === 'PUT') {
        const raw = await readBody(req);
        let parsed;
        try {
          parsed = JSON.parse(raw || '{}');
        } catch {
          send(res, 400, { error: 'invalid JSON body' });
          return;
        }
        const doc = await store.write(parsed.cells || parsed);
        send(res, 200, doc);
        return;
      }

      if (pathname === '/api/workbook/reset' && req.method === 'POST') {
        const doc = await store.reset();
        send(res, 200, doc);
        return;
      }

      /* ---------------- static ---------------- */
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        send(res, 405, { error: 'method not allowed' });
        return;
      }

      if (pathname === '/' || pathname === '/index.html') {
        const shell = production
          ? path.join(DIST_DIR, 'index.html')
          : path.join(PUBLIC_DIR, 'index.html');
        if (fs.existsSync(shell)) {
          await serveFile(res, shell);
          return;
        }
        send(res, 500, { error: 'index.html not found - run `npm run build` first' });
        return;
      }

      if (pathname.startsWith('/assets/')) {
        const file = safeJoin(DIST_DIR, pathname);
        if (file && fs.existsSync(file)) {
          await serveFile(res, file);
          return;
        }
        send(res, 404, { error: 'not found' });
        return;
      }

      if (pathname.startsWith('/src/')) {
        const file = safeJoin(srcBase(production), pathname.slice('/src'.length));
        if (file && fs.existsSync(file) && fs.statSync(file).isFile()) {
          await serveFile(res, file);
          return;
        }
        send(res, 404, { error: 'not found' });
        return;
      }

      const pubFile = safeJoin(PUBLIC_DIR, pathname);
      if (pubFile && fs.existsSync(pubFile) && fs.statSync(pubFile).isFile()) {
        await serveFile(res, pubFile);
        return;
      }

      send(res, 404, { error: 'not found' });
    } catch (err) {
      send(res, 500, { error: err.message });
    }
  };
}

export async function createServer(options = {}) {
  const store = options.store
    || new WorkbookStore(options.dataFile || process.env.DATA_FILE || path.join(ROOT, 'data', 'workbook.json'));
  await store.init();
  const server = http.createServer(createRequestHandler({ production: Boolean(options.production), store }));
  server.store = store;
  return server;
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (isMain) {
  const production = process.argv.includes('--production') || process.env.NODE_ENV === 'production';
  const port = Number(process.env.PORT || 5173);
  const server = await createServer({ production });
  server.listen(port, () => {
    const mode = production ? 'production (dist/)' : 'development (public/ + src/)';
    console.log(`reactive-spreadsheet-engine listening on http://127.0.0.1:${port}  [${mode}]`);
    console.log(`workbook file: ${server.store.file}`);
  });
}
