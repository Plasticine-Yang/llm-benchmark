// Headless verification: loads dist/index.html in Chrome, collects console errors, saves screenshots.
// usage: node tools/shot.mjs [view ...]
import puppeteer from 'puppeteer-core';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const out = path.join(root, 'screenshots');
fs.mkdirSync(out, { recursive: true });
const views = process.argv.slice(2).length ? process.argv.slice(2) : ['default'];
const url = 'file://' + path.join(root, 'dist', 'index.html');

const browser = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: 'new',
  args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist', '--enable-webgl'],
});
const errors = [];
for (const v of views) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 1000, deviceScaleFactor: 1 });
  page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) errors.push(`[${v}] ${m.type()}: ${m.text()}`); });
  page.on('pageerror', (e) => errors.push(`[${v}] pageerror: ${e.message}`));
  const q = v === 'default' ? '' : `?view=${v}`;
  await page.goto(url + q, { waitUntil: 'load' });
  await page.waitForFunction('window.__ready === true', { timeout: 30000 }).catch(() => errors.push(`[${v}] not ready`));
  await new Promise((r) => setTimeout(r, 2500));
  const fps = await page.evaluate(() => new Promise((res) => { let n = 0; const t0 = performance.now(); const f = () => { n++; if (performance.now() - t0 < 1000) requestAnimationFrame(f); else res(n); }; requestAnimationFrame(f); }));
  await page.screenshot({ path: path.join(out, `${v}.png`) });
  console.log(`${v}: saved, ~${fps} fps (headless)`);
  await page.close();
}
await browser.close();
console.log(errors.length ? errors.join('\n') : 'no console errors');
