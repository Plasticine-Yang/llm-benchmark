/** One-command dev mode: API server + Vite dev server (no extra dependencies). */

import { spawn } from 'node:child_process';
import net from 'node:net';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const serverEntry = path.join(ROOT, 'server', 'index.mjs');
const viteEntry = path.join(ROOT, 'node_modules', 'vite', 'bin', 'vite.js');

if (!fs.existsSync(viteEntry)) {
  console.error('缺少依赖，请先运行 npm install');
  process.exit(1);
}

function isFree(port) {
  return new Promise((resolve) => {
    const probe = net.createServer();
    probe.once('error', () => resolve(false));
    probe.once('listening', () => probe.close(() => resolve(true)));
    probe.listen(port, '127.0.0.1');
  });
}

async function findPort(start) {
  for (let p = start; p < start + 30; p++) {
    if (await isFree(p)) return p;
  }
  throw new Error(`在 ${start}..${start + 29} 范围内找不到空闲端口`);
}

const PORT = await findPort(Number(process.env.PORT || 18787));

const children = [];
let shuttingDown = false;

function start(name, args) {
  const child = spawn(process.execPath, args, {
    cwd: ROOT,
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'development', PORT: String(PORT) },
  });
  child.on('exit', (code) => {
    if (!shuttingDown) {
      console.log(`\n[${name}] 已退出 (code=${code})，关闭另一个进程…`);
      shutdown(code || 0);
    }
  });
  children.push(child);
  return child;
}

function shutdown(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of children) {
    if (!child.killed) child.kill('SIGTERM');
  }
  setTimeout(() => process.exit(code), 150).unref();
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

start('api', [serverEntry]);
start('vite', [viteEntry, '--host', '127.0.0.1']);

console.log('\n  开发环境已启动 → http://localhost:5173');
console.log(`  API 服务        → http://localhost:${PORT}/api/workbook\n`);
