/**
 * Production build.
 *
 *   node scripts/build.mjs
 *
 * Prefers esbuild (single minified bundle). If esbuild is not installed — the
 * runtime itself has zero dependencies — it falls back to a "source build" that
 * copies the ES modules into dist/, which the production server can serve as-is.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const ASSETS = path.join(DIST, 'assets');
const SRC = path.join(ROOT, 'src');
const PUBLIC = path.join(ROOT, 'public');

async function copyTree(from, to) {
  await fs.mkdir(to, { recursive: true });
  for (const entry of await fs.readdir(from, { withFileTypes: true })) {
    const src = path.join(from, entry.name);
    const dst = path.join(to, entry.name);
    if (entry.isDirectory()) await copyTree(src, dst);
    else await fs.copyFile(src, dst);
  }
}

async function main() {
  await fs.rm(DIST, { recursive: true, force: true });
  await fs.mkdir(ASSETS, { recursive: true });
  await fs.copyFile(path.join(PUBLIC, 'styles.css'), path.join(ASSETS, 'styles.css'));

  let esbuild = null;
  try {
    esbuild = await import('esbuild');
  } catch {
    esbuild = null;
  }

  const shell = await fs.readFile(path.join(PUBLIC, 'index.html'), 'utf8');
  let built;
  let report = [];

  if (esbuild) {
    const result = await esbuild.build({
      entryPoints: [path.join(SRC, 'main.js')],
      outfile: path.join(ASSETS, 'app.js'),
      bundle: true,
      format: 'iife',
      globalName: 'ReactiveSheet',
      platform: 'browser',
      target: ['es2020'],
      minify: true,
      sourcemap: true,
      legalComments: 'none',
      banner: { js: '/* reactive-spreadsheet-engine - built bundle */' },
      metafile: true,
      logLevel: 'warning',
    });
    const jsStat = await fs.stat(path.join(ASSETS, 'app.js'));
    const gz = gzipSync(await fs.readFile(path.join(ASSETS, 'app.js'))).length;
    built = shell
      .replace('/styles.css', '/assets/styles.css')
      .replace('<script type="module" src="/src/main.js"></script>', '<script defer src="/assets/app.js"></script>');
    if (built.includes('/src/main.js')) {
      throw new Error('build: could not rewrite the script tag in index.html');
    }
    report = [
      `mode             esbuild bundle`,
      `assets/app.js    ${(jsStat.size / 1024).toFixed(1)} kB  (${(gz / 1024).toFixed(1)} kB gzip)`,
    ];
    for (const warning of result.warnings || []) report.push(`warning: ${warning.text}`);
  } else {
    // no dev dependencies available: ship the module sources as-is
    await copyTree(SRC, path.join(DIST, 'src'));
    built = shell.replace('/styles.css', '/assets/styles.css');
    report = [
      'mode             source build (esbuild not installed)',
      'dist/src/        ES modules copied verbatim',
    ];
  }

  await fs.writeFile(path.join(DIST, 'index.html'), built, 'utf8');
  const cssStat = await fs.stat(path.join(ASSETS, 'styles.css'));

  console.log('build complete -> dist/');
  for (const line of report) console.log(`  ${line}`);
  console.log(`  assets/styles.css ${(cssStat.size / 1024).toFixed(1)} kB`);
  console.log(`  index.html       ${(built.length / 1024).toFixed(1)} kB`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
