'use strict';

/**
 * Zero-dependency production build.
 * Emits a self-contained dist/ with content-hashed assets, an asset manifest,
 * and syntax validation of every shipped JavaScript file.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'public');
const DIST = path.join(ROOT, 'dist');
const ASSETS = path.join(DIST, 'assets');

function mustExist(p) {
  if (!fs.existsSync(p)) throw new Error(`missing build input: ${p}`);
}
function hash(s) { return crypto.createHash('sha256').update(s).digest('hex').slice(0, 10); }

function main() {
  const html = fs.readFileSync(path.join(SRC, 'index.html'), 'utf8');
  const css = fs.readFileSync(path.join(SRC, 'styles.css'), 'utf8');
  const js = fs.readFileSync(path.join(SRC, 'app.js'), 'utf8');
  mustExist(path.join(ROOT, 'server', 'index.js'));
  mustExist(path.join(ROOT, 'server', 'engine.js'));

  fs.rmSync(DIST, { recursive: true, force: true });
  fs.mkdirSync(ASSETS, { recursive: true });

  const cssName = `styles.${hash(css)}.css`;
  const jsName = `app.${hash(js)}.js`;
  fs.writeFileSync(path.join(ASSETS, cssName), css);
  fs.writeFileSync(path.join(ASSETS, jsName), js);

  let out = html
    .replace('href="styles.css"', `href="assets/${cssName}"`)
    .replace('src="app.js"', `src="assets/${jsName}"`);
  if (out.includes('styles.css') || out.includes('src="app.js"')) {
    throw new Error('index.html asset references could not be rewritten');
  }
  fs.writeFileSync(path.join(DIST, 'index.html'), out);

  const manifest = {
    name: 'multi-robot-warehouse-scheduling-system',
    builtAt: new Date().toISOString(),
    entry: 'index.html',
    assets: {
      'index.html': hash(out),
      [cssName]: hash(css),
      [jsName]: hash(js),
    },
    server: ['server/index.js', 'server/engine.js'],
  };
  fs.writeFileSync(path.join(DIST, 'manifest.json'), JSON.stringify(manifest, null, 2));

  // Validate all JavaScript that ships / runs in production.
  for (const f of [
    path.join(ROOT, 'server', 'engine.js'),
    path.join(ROOT, 'server', 'index.js'),
    path.join(ASSETS, jsName),
    path.resolve(__dirname, 'build.js'),
  ]) {
    execFileSync(process.execPath, ['--check', f], { stdio: 'pipe' });
  }

  console.log('[build] production bundle written to dist/');
  console.log(`[build] index.html  ${hash(out)}`);
  console.log(`[build] ${cssName}  ${hash(css)}`);
  console.log(`[build] ${jsName}  ${hash(js)}`);
  console.log('[build] syntax validation: OK');
}

try { main(); } catch (err) {
  console.error('[build] FAILED:', err.message);
  process.exit(1);
}
