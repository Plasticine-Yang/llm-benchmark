// Production build (zero dependencies).
//
//   node scripts/build.mjs
//
//  * validates every server module and the frontend bundle with `node --check`
//  * cross-checks that every `$('id')` used by the frontend exists in index.html
//  * minifies the CSS and strips comments/blank lines from the JS (string-aware)
//  * fingerprints the assets and rewrites dist/index.html
//  * writes dist/build-info.json and reports raw + gzip sizes
//
// The output in dist/ is what `node server/index.js --prod` serves.

import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import url from 'node:url';

const root = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..');
const publicDir = path.join(root, 'public');
const distDir = path.join(root, 'dist');
const problems = [];

function read(file) {
  return fs.readFileSync(file, 'utf8');
}

function hash(content) {
  return crypto.createHash('sha256').update(content).digest('hex').slice(0, 10);
}

function checkSyntax(file, source) {
  const tmp = path.join(distDir, `.syntax-${path.basename(file)}`);
  fs.writeFileSync(tmp, source);
  try {
    execFileSync(process.execPath, ['--check', tmp], { stdio: 'pipe' });
  } catch (err) {
    problems.push(`${file}: syntax error\n${err.stderr?.toString() ?? err.message}`);
  } finally {
    fs.rmSync(tmp, { force: true });
  }
}

/** Remove // and /* *\/ comments without touching strings or template literals. */
function stripJsComments(source) {
  let out = '';
  let mode = 'code';
  for (let i = 0; i < source.length; i++) {
    const ch = source[i];
    const next = source[i + 1];
    if (mode === 'code') {
      if (ch === '/' && next === '/') {
        mode = 'line';
        i++;
        continue;
      }
      if (ch === '/' && next === '*') {
        mode = 'block';
        i++;
        continue;
      }
      if (ch === '"' || ch === "'" || ch === '`') {
        mode = ch;
        out += ch;
        continue;
      }
      out += ch;
      continue;
    }
    if (mode === 'line') {
      if (ch === '\n') {
        mode = 'code';
        out += ch;
      }
      continue;
    }
    if (mode === 'block') {
      if (ch === '*' && next === '/') {
        mode = 'code';
        i++;
      }
      continue;
    }
    // inside a string / template literal
    out += ch;
    if (ch === '\\') {
      out += next ?? '';
      i++;
      continue;
    }
    if (ch === mode) mode = 'code';
    else if (mode === '`' && ch === '$' && next === '{') {
      // keep template expressions verbatim (simple nesting-free handling)
      let depth = 1;
      out += next;
      i++;
      while (i + 1 < source.length && depth > 0) {
        const c = source[++i];
        out += c;
        if (c === '{') depth++;
        else if (c === '}') depth--;
      }
      i--;
    }
  }
  return out;
}

function minifyJs(source) {
  return stripJsComments(source)
    .split('\n')
    .map((line) => line.replace(/[ \t]+$/, ''))
    .filter((line) => line.trim().length > 0)
    .join('\n');
}

function minifyCss(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s*\n\s*/g, '\n')
    .replace(/\n{2,}/g, '\n')
    .replace(/\s*([{}:;,>])\s*/g, '$1')
    .replace(/;}/g, '}')
    .trim();
}

function gzipSize(text) {
  return zlib.gzipSync(Buffer.from(text)).length;
}

function kb(bytes) {
  return `${(bytes / 1024).toFixed(1)} kB`;
}

// ------------------------------------------------------------------ validate ---
const html = read(path.join(publicDir, 'index.html'));
const css = read(path.join(publicDir, 'styles.css'));
const js = read(path.join(publicDir, 'app.js'));

fs.mkdirSync(distDir, { recursive: true });
// drop stale fingerprinted assets from previous builds
for (const file of fs.readdirSync(distDir)) {
  if (/^(app|styles)\.[0-9a-f]{8,}\.(js|css)$/.test(file)) fs.rmSync(path.join(distDir, file), { force: true });
}
checkSyntax('public/app.js', js);
for (const file of fs.readdirSync(path.join(root, 'server'))) {
  if (file.endsWith('.js')) checkSyntax(`server/${file}`, read(path.join(root, 'server', file)));
}
for (const file of fs.readdirSync(path.join(root, 'scripts'))) {
  if (file.endsWith('.mjs')) checkSyntax(`scripts/${file}`, read(path.join(root, 'scripts', file)));
}

// every element id used by the frontend must exist in the markup
const ids = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]));
// ids the frontend renders itself (injected through innerHTML) count as declared
const dynamicIds = new Set([...js.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]));
const used = new Set([...js.matchAll(/\$\('([^']+)'\)/g)].map((m) => m[1]));
for (const id of used) {
  if (!ids.has(id) && !dynamicIds.has(id)) problems.push(`public/app.js references #${id} which is neither declared in index.html nor rendered dynamically`);
}
for (const id of ids) {
  if (!used.has(id)) problems.push(`index.html declares #${id} but the frontend never uses it`);
}

// the frontend must never fabricate robot positions
if (/robots\[[^\]]+\]\.(x|y)\s*=(?!=)/.test(js)) problems.push('public/app.js assigns robot coordinates directly — the backend must stay authoritative');

if (problems.length > 0) {
  console.error('build failed:\n' + problems.map((p) => `  - ${p}`).join('\n'));
  process.exit(1);
}

// --------------------------------------------------------------------- emit ---
const minJs = minifyJs(js);
const minCss = minifyCss(css);
const jsName = `app.${hash(minJs)}.js`;
const cssName = `styles.${hash(minCss)}.css`;

fs.writeFileSync(path.join(distDir, jsName), minJs);
fs.writeFileSync(path.join(distDir, cssName), minCss);

const outHtml = html
  .replace('./styles.css', `./${cssName}`)
  .replace('./app.js', `./${jsName}`)
  .replace('<head>', `<head>\n    <!-- production build ${new Date().toISOString()} -->`);
fs.writeFileSync(path.join(distDir, 'index.html'), outHtml);

for (const file of fs.readdirSync(publicDir)) {
  if (['index.html', 'app.js', 'styles.css'].includes(file)) continue;
  fs.cpSync(path.join(publicDir, file), path.join(distDir, file), { recursive: true });
}

const info = {
  builtAt: new Date().toISOString(),
  node: process.version,
  assets: {
    js: { file: jsName, bytes: Buffer.byteLength(minJs), gzip: gzipSize(minJs), source: 'public/app.js' },
    css: { file: cssName, bytes: Buffer.byteLength(minCss), gzip: gzipSize(minCss), source: 'public/styles.css' },
    html: { file: 'index.html', bytes: Buffer.byteLength(outHtml), gzip: gzipSize(outHtml) },
  },
  modules: fs.readdirSync(path.join(root, 'server')).filter((f) => f.endsWith('.js')),
  notes: 'zero runtime dependencies; served by `node server/index.js --prod`',
};
fs.writeFileSync(path.join(distDir, 'build-info.json'), `${JSON.stringify(info, null, 2)}\n`);

console.log('production build complete');
console.log(`  dist/index.html      ${kb(info.assets.html.bytes)} (gzip ${kb(info.assets.html.gzip)})`);
console.log(`  dist/${cssName}  ${kb(info.assets.css.bytes)} (gzip ${kb(info.assets.css.gzip)})`);
console.log(`  dist/${jsName}  ${kb(info.assets.js.bytes)} (gzip ${kb(info.assets.js.gzip)})`);
console.log(`  validated: ${info.modules.length} server modules, frontend ids (${ids.size}), syntax checks passed`);
console.log('  start with: node server/index.js --prod');
