import { createServer } from 'node:http';
import { mkdir, readFile, rename, stat, writeFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const port = Number(process.env.PORT || 4173);
const publicDirectory = fileURLToPath(new URL('./public/', import.meta.url));
const dataDirectory = join(process.cwd(), 'data');
const dataFile = join(dataDirectory, 'workbook.json');
const maxBodyBytes = 1024 * 1024;

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml'
};

function sendJson(response, status, body) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  response.end(JSON.stringify(body));
}

async function readWorkbook() {
  try {
    const content = await readFile(dataFile, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    if (error.code === 'ENOENT') return { version: 1, cells: {} };
    throw error;
  }
}

async function saveWorkbook(workbook) {
  await mkdir(dataDirectory, { recursive: true });
  const temporaryFile = `${dataFile}.tmp`;
  await writeFile(temporaryFile, `${JSON.stringify(workbook, null, 2)}\n`, 'utf8');
  await rename(temporaryFile, dataFile);
}

async function readRequestBody(request) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > maxBodyBytes) throw new Error('PAYLOAD_TOO_LARGE');
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

async function serveStatic(pathname, response, headOnly = false) {
  const requested = pathname === '/' ? 'index.html' : pathname.slice(1);
  const safePath = normalize(requested).replace(/^(\.\.(\/|\\|$))+/, '');
  const filePath = join(publicDirectory, safePath);
  try {
    const details = await stat(filePath);
    if (!details.isFile()) throw Object.assign(new Error('Not found'), { code: 'ENOENT' });
    const body = await readFile(filePath);
    response.writeHead(200, {
      'Content-Type': mimeTypes[extname(filePath)] || 'application/octet-stream',
      'Cache-Control': 'no-cache'
    });
    response.end(headOnly ? undefined : body);
  } catch (error) {
    if (error.code === 'ENOENT') {
      response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end('Not found');
      return;
    }
    throw error;
  }
}

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`);
    if (url.pathname === '/api/workbook' && request.method === 'GET') {
      sendJson(response, 200, await readWorkbook());
      return;
    }
    if (url.pathname === '/api/workbook' && request.method === 'POST') {
      const workbook = await readRequestBody(request);
      if (!workbook || typeof workbook !== 'object' || !workbook.cells || typeof workbook.cells !== 'object') {
        sendJson(response, 400, { error: 'Invalid workbook payload' });
        return;
      }
      await saveWorkbook(workbook);
      sendJson(response, 200, { ok: true, savedAt: new Date().toISOString() });
      return;
    }
    if (url.pathname === '/api/health') {
      sendJson(response, 200, { ok: true });
      return;
    }
    if (request.method === 'GET' || request.method === 'HEAD') {
      await serveStatic(url.pathname, response, request.method === 'HEAD');
      return;
    }
    sendJson(response, 405, { error: 'Method not allowed' });
  } catch (error) {
    const status = error.message === 'PAYLOAD_TOO_LARGE' ? 413 : 500;
    console.error(error);
    sendJson(response, status, { error: status === 413 ? 'Payload too large' : 'Internal server error' });
  }
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Reactive Spreadsheet running at http://127.0.0.1:${port}`);
});
