import http from 'node:http';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { COLS, isValidAddress, normalizeAddress, ROWS, Workbook } from '../shared/engine/index.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const DIST = path.join(ROOT, 'dist');
const DATA_DIR = path.join(HERE, 'data');
const DATA_FILE = path.join(DATA_DIR, 'workbook.json');
const PORT = Number(process.env.PORT ?? 4310);
const HOST = process.env.HOST ?? '127.0.0.1';
const MAX_BODY = 1024 * 1024;
const MAX_CELL_LENGTH = 2000;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.map': 'application/json; charset=utf-8',
};

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function sanitizeCells(input) {
  if (input === null || typeof input !== 'object' || Array.isArray(input)) {
    throw new HttpError(400, 'cells must be an object of { "A1": "raw value" }');
  }
  const cells = {};
  let count = 0;
  for (const [key, value] of Object.entries(input)) {
    const id = normalizeAddress(key);
    if (!id || !isValidAddress(id, ROWS, COLS)) {
      throw new HttpError(400, `invalid cell address "${key}" (grid is ${COLS}x${ROWS})`);
    }
    if (value !== null && typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'boolean') {
      throw new HttpError(400, `cell ${id} must be a string, number, boolean or null`);
    }
    const raw = value === null || value === undefined ? '' : String(value);
    if (raw.length > MAX_CELL_LENGTH) {
      throw new HttpError(400, `cell ${id} exceeds ${MAX_CELL_LENGTH} characters`);
    }
    if (raw !== '') cells[id] = raw;
    count += 1;
    if (count > ROWS * COLS) throw new HttpError(400, 'too many cells');
  }
  return cells;
}

function describe(workbook, savedAt) {
  const json = workbook.toJSON();
  let formulas = 0;
  let errors = 0;
  for (const id of Object.keys(json.cells)) {
    if (workbook.isFormula(id)) formulas += 1;
    if (workbook.getError(id)) errors += 1;
  }
  return {
    rows: workbook.rows,
    cols: workbook.cols,
    cells: json.cells,
    computed: json.computed,
    cycles: json.cycles,
    savedAt,
    stats: { populated: Object.keys(json.cells).length, formulas, errors },
  };
}

let workbook = new Workbook({ rows: ROWS, cols: COLS });
let savedAt = null;

async function persist() {
  await mkdir(DATA_DIR, { recursive: true });
  const payload = { version: 1, ...describe(workbook, savedAt) };
  const temp = `${DATA_FILE}.${process.pid}.tmp`;
  await writeFile(temp, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  await rename(temp, DATA_FILE);
}

async function loadFromDisk() {
  try {
    const text = await readFile(DATA_FILE, 'utf8');
    const data = JSON.parse(text);
    workbook = new Workbook({ rows: ROWS, cols: COLS, cells: sanitizeCells(data.cells ?? {}) });
    savedAt = data.savedAt ?? null;
    console.log(`[server] restored ${Object.keys(data.cells ?? {}).length} cells from ${DATA_FILE}`);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.warn(`[server] could not read saved workbook (${error.message}); starting empty`);
    }
    workbook = new Workbook({ rows: ROWS, cols: COLS });
    savedAt = null;
    await persist();
  }
}

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-store',
  });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY) {
        reject(new HttpError(413, 'request body too large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      if (chunks.length === 0) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      } catch {
        reject(new HttpError(400, 'request body must be valid JSON'));
      }
    });
    req.on('error', reject);
  });
}

async function serveStatic(req, res, pathname) {
  const relative = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
  const target = path.resolve(DIST, relative);
  if (target !== DIST && !target.startsWith(`${DIST}${path.sep}`)) {
    sendJson(res, 403, { error: 'forbidden path' });
    return;
  }
  let file = target;
  try {
    const data = await readFile(file);
    res.writeHead(200, {
      'Content-Type': MIME[path.extname(file).toLowerCase()] ?? 'application/octet-stream',
      'Content-Length': data.length,
      'Cache-Control': relative.startsWith('assets/') ? 'public, max-age=31536000, immutable' : 'no-cache',
    });
    res.end(data);
    return;
  } catch {
    // fall through to SPA index
  }
  try {
    const index = await readFile(path.join(DIST, 'index.html'));
    res.writeHead(200, { 'Content-Type': MIME['.html'], 'Content-Length': index.length });
    res.end(index);
  } catch {
    sendJson(res, 404, {
      error: 'production bundle not found — run `npm run build` first, or use `npm run dev`',
    });
  }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host ?? 'localhost'}`);
  const pathname = decodeURIComponent(url.pathname);

  try {
    if (pathname.startsWith('/api/')) {
      if (pathname === '/api/health' && req.method === 'GET') {
        sendJson(res, 200, { ok: true, rows: ROWS, cols: COLS, savedAt, ...describe(workbook, savedAt).stats });
        return;
      }
      if (pathname === '/api/workbook' && req.method === 'GET') {
        sendJson(res, 200, describe(workbook, savedAt));
        return;
      }
      if (pathname === '/api/workbook' && (req.method === 'PUT' || req.method === 'POST')) {
        const body = await readBody(req);
        const cells = sanitizeCells(body.cells);
        workbook = new Workbook({ rows: ROWS, cols: COLS, cells });
        savedAt = new Date().toISOString();
        await persist();
        sendJson(res, 200, { ok: true, ...describe(workbook, savedAt) });
        return;
      }
      if (pathname === '/api/workbook/clear' && req.method === 'POST') {
        workbook = new Workbook({ rows: ROWS, cols: COLS });
        savedAt = new Date().toISOString();
        await persist();
        sendJson(res, 200, { ok: true, ...describe(workbook, savedAt) });
        return;
      }
      sendJson(res, 404, { error: `unknown API route ${req.method} ${pathname}` });
      return;
    }

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      sendJson(res, 405, { error: 'method not allowed' });
      return;
    }
    await serveStatic(req, res, pathname);
  } catch (error) {
    const status = error instanceof HttpError ? error.status : 500;
    if (status === 500) console.error('[server]', error);
    sendJson(res, status, { error: error.message ?? 'internal server error' });
  }
});

await loadFromDisk();
server.listen(PORT, HOST, () => {
  console.log(`[server] reactive spreadsheet API + static host on http://${HOST}:${PORT}`);
  console.log(`[server] workbook file: ${DATA_FILE}`);
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 1500).unref();
  });
}