import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const viteBin = path.join(ROOT, 'node_modules', 'vite', 'bin', 'vite.js');

const children = [
  spawn(process.execPath, [path.join(ROOT, 'server', 'index.mjs')], { cwd: ROOT, stdio: 'inherit' }),
  spawn(process.execPath, [viteBin, '--host'], { cwd: ROOT, stdio: 'inherit' }),
];

let shuttingDown = false;
function shutdown() {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of children) child.kill('SIGTERM');
  setTimeout(() => process.exit(0), 500).unref();
}

for (const child of children) {
  child.on('exit', (code) => {
    if (!shuttingDown) {
      console.log(`[dev] a process exited with code ${code}; shutting down`);
      shutdown();
    }
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);