#!/usr/bin/env node
import { createServer } from 'node:http'
import { createReadStream, existsSync, statSync } from 'node:fs'
import { extname, join, normalize, resolve } from 'node:path'

const root = resolve(process.argv[2] ?? 'dist')
const port = Number(process.env.PORT ?? 4173)
const host = process.env.HOST ?? '127.0.0.1'

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ico': 'image/x-icon',
}

if (!existsSync(root)) {
  console.error(`Build directory not found: ${root}\nRun "pnpm build" first.`)
  process.exit(1)
}

const server = createServer((request, response) => {
  const rawPath = decodeURIComponent((request.url ?? '/').split('?')[0])
  const safePath = normalize(rawPath).replace(/^(\.\.(\/|\\|$))+/, '')
  let filePath = join(root, safePath)
  if (existsSync(filePath) && statSync(filePath).isDirectory()) filePath = join(filePath, 'index.html')
  if (!existsSync(filePath)) filePath = join(root, 'index.html')

  try {
    const stat = statSync(filePath)
    response.writeHead(200, {
      'Content-Type': mime[extname(filePath).toLowerCase()] ?? 'application/octet-stream',
      'Content-Length': stat.size,
      'Cache-Control': 'no-cache',
    })
    createReadStream(filePath).pipe(response)
  } catch {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
    response.end('Not found')
  }
})

server.listen(port, host, () => {
  console.log(`NOCTURNE ONE → http://${host}:${port}/`)
})
