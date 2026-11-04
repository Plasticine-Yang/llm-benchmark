import { build } from 'esbuild';
import { readFile, writeFile, mkdir } from 'node:fs/promises';

await mkdir('dist', { recursive: true });

await build({
  entryPoints: ['src/main.js'],
  bundle: true,
  format: 'iife',
  minify: true,
  sourcemap: false,
  target: 'es2020',
  outfile: 'dist/app.js',
});

const js = await readFile('dist/app.js', 'utf8');
const tpl = await readFile('index.template.html', 'utf8');
await writeFile('index.html', tpl.replace('/*BUNDLE*/', () => js));
console.log('built index.html', (js.length / 1024).toFixed(1) + 'KB');
