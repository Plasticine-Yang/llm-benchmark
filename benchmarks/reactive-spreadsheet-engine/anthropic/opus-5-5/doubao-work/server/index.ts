// Minimal dependency-free backend: persists the workbook as JSON and serves the built frontend.
//
//   GET    /api/workbook          -> { cells, values, cycles, version, updatedAt }
//   PUT    /api/workbook          body { cells }            replace whole workbook
//   PATCH  /api/workbook/cells    body { changes, baseVersion? }  merge cell edits ("" clears)
//   POST   /api/workbook/reset    clear the workbook
//   GET    /api/health
//
// The server re-evaluates every write with the same engine the browser uses, so the stored
// computed values are authoritative and can be compared with the client after a reload.

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Sheet, RawMap } from '../src/engine/sheet';
import { isValidAddr } from '../src/engine/address';

const here = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(here, '..');
const PORT = Number(process.env.PORT ?? 3001);
const DATA_FILE = path.resolve(process.env.DATA_FILE ?? path.join(ROOT, 'data', 'workbook.json'));
const STATIC_DIR = path.join(ROOT, 'dist');
const MAX_BODY = 2 * 1024 * 1024;
const MAX_RAW_LEN = 10_000;

interface StoredWorkbook {
  version: number;
  updatedAt: string;
  cells: RawMap;
  values: Record<string, string>;
}

function emptyWorkbook(): StoredWorkbook {
  return { version: 0, updatedAt: new Date().toISOString(), cells: {}, values: {} };
}

function loadFromDisk(): StoredWorkbook {
  try {
    const parsed = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')) as Partial<StoredWorkbook>;
    const cells = sanitizeCells(parsed.cells ?? {});
    return { version: Number(parsed.version) || 0, updatedAt: parsed.updatedAt ?? new Date().toISOString(), cells, values: {} };
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code !== 'ENOENT') console.error('[store] could not read workbook, starting empty:', e);
    return emptyWorkbook();
  }
}

function sanitizeCells(input: unknown): RawMap {
  const out: RawMap = {};
  if (!input || typeof input !== 'object') return out;
  for (const [addr, raw] of Object.entries(input as Record<string, unknown>)) {
    if (!isValidAddr(addr) || typeof raw !== 'string') continue;
    if (raw === '') continue;
    out[addr] = raw.slice(0, MAX_RAW_LEN);
  }
  return out;
}

const sheet = new Sheet();
let workbook = loadFromDisk();
sheet.load(workbook.cells);
workbook.values = sheet.toValueMap();

let writeChain: Promise<void> = Promise.resolve();
function persist(): Promise<void> {
  const snapshot = JSON.stringify(workbook, null, 2);
  writeChain = writeChain.then(async () => {
    await fs.promises.mkdir(path.dirname(DATA_FILE), { recursive: true });
    const tmp = `${DATA_FILE}.${process.pid}.tmp`;
    await fs.promises.writeFile(tmp, snapshot, 'utf8');
    await fs.promises.rename(tmp, DATA_FILE); // atomic replace
  });
  return writeChain;
}

function commit(): StoredWorkbook {
  workbook.cells = sheet.toRawMap();
  workbook.values = sheet.toValueMap();
  workbook.version += 1;
  workbook.updatedAt = new Date().toISOString();
  return workbook;
}

function payload() {
  return { ...workbook, cycles: sheet.cycleCells };
}

function send(res: http.ServerResponse, status: number, body: unknown) {
  const data = JSON.stringify(body);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(data);
}

function readJson(req: http.IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks: Buffer[] = [];
    req.on('data', (c: Buffer) => {
      size += c.length;
      if (size > MAX_BODY) {
        reject(new HttpError(413, 'Payload too large'));
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on('end', () => {
      if (!chunks.length) return resolve({});
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      } catch {
        reject(new HttpError(400, 'Invalid JSON body'));
      }
    });
    req.on('error', reject);
  });
}

class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
  '.ico': 'image/x-icon',
  '.png': 'image/png',
};

function serveStatic(req: http.IncomingMessage, res: http.ServerResponse) {
  if (!fs.existsSync(STATIC_DIR)) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Frontend not built. Run "npm run build" (or use "npm run dev" for development).');
    return;
  }
  const urlPath = decodeURIComponent(new URL(req.url ?? '/', 'http://x').pathname);
  let file = path.normalize(path.join(STATIC_DIR, urlPath));
  if (!file.startsWith(STATIC_DIR)) file = path.join(STATIC_DIR, 'index.html'); // path traversal guard
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(STATIC_DIR, 'index.html');
  res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] ?? 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', 'http://localhost');
  try {
    if (url.pathname === '/api/health') return send(res, 200, { ok: true, version: workbook.version });

    if (url.pathname === '/api/workbook') {
      if (req.method === 'GET') return send(res, 200, payload());
      if (req.method === 'PUT') {
        const body = (await readJson(req)) as { cells?: unknown };
        sheet.load(sanitizeCells(body.cells));
        commit();
        await persist();
        return send(res, 200, payload());
      }
      throw new HttpError(405, 'Method not allowed');
    }

    if (url.pathname === '/api/workbook/cells') {
      if (req.method !== 'PATCH' && req.method !== 'POST') throw new HttpError(405, 'Method not allowed');
      const body = (await readJson(req)) as { changes?: unknown };
      if (!body.changes || typeof body.changes !== 'object') throw new HttpError(400, 'Body must be { changes: { A1: "raw" } }');
      const changes: RawMap = {};
      for (const [addr, raw] of Object.entries(body.changes as Record<string, unknown>)) {
        if (!isValidAddr(addr)) throw new HttpError(400, `Invalid cell address: ${addr}`);
        if (typeof raw !== 'string') throw new HttpError(400, `Value for ${addr} must be a string`);
        changes[addr] = raw.slice(0, MAX_RAW_LEN);
      }
      sheet.setCells(changes);
      commit();
      await persist();
      return send(res, 200, payload());
    }

    if (url.pathname === '/api/workbook/reset' && req.method === 'POST') {
      sheet.load({});
      commit();
      await persist();
      return send(res, 200, payload());
    }

    if (url.pathname.startsWith('/api/')) throw new HttpError(404, 'Not found');
    if (req.method === 'GET' || req.method === 'HEAD') return serveStatic(req, res);
    throw new HttpError(405, 'Method not allowed');
  } catch (e) {
    const status = e instanceof HttpError ? e.status : 500;
    if (status === 500) console.error(e);
    send(res, status, { error: e instanceof Error ? e.message : 'Internal error' });
  }
});

server.listen(PORT, () => {
  console.log(`[server] spreadsheet API on http://localhost:${PORT}  (data: ${DATA_FILE})`);
});
