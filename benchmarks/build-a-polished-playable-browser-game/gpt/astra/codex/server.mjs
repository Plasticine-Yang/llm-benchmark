import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, extname, sep } from 'node:path';

const root = fileURLToPath(new URL('.', import.meta.url));
const argumentsList = process.argv.slice(2);
const portIndex = argumentsList.indexOf('--port');
const hostIndex = argumentsList.indexOf('--host');
const port = Number(portIndex >= 0 ? argumentsList[portIndex + 1] : process.env.PORT || 5173);
const host = hostIndex >= 0 && argumentsList[hostIndex + 1] && !argumentsList[hostIndex + 1].startsWith('--') ? argumentsList[hostIndex + 1] : '0.0.0.0';
const contentTypes = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.json': 'application/json' };

createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const file = resolve(root, `.${pathname === '/' ? '/index.html' : pathname}`);
    if (!file.startsWith(`${root.replace(/\/$/, '')}${sep}`)) {
      response.writeHead(403).end('Forbidden');
      return;
    }
    const body = await readFile(file);
    response.writeHead(200, { 'Content-Type': contentTypes[extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    response.end(body);
  } catch {
    response.writeHead(404, { 'Content-Type': 'text/plain' }).end('Not found');
  }
}).listen(port, host, () => console.log(`Pelican Pedal Club is ready at http://localhost:${port}`));
