import { build } from 'esbuild';
import { mkdir } from 'node:fs/promises';

await mkdir('dist', { recursive: true });
await build({
  entryPoints: ['src/main.js'],
  bundle: true,
  format: 'iife',
  target: ['chrome100', 'safari16'],
  outfile: 'bundle.js',
  minify: true,
  charset: 'utf8',
  sourcemap: false,
  legalComments: 'none',
  logLevel: 'info',
});
