/**
 * End-to-end acceptance test.
 *
 * 1. runs the real production build
 * 2. starts the real production server against a temporary workbook file
 * 3. loads the built bundle in jsdom (the same code a browser runs)
 * 4. verifies a 3+ level dependency chain recalculates on the client
 * 5. verifies the edit was persisted by the backend (survives a reload)
 * 6. verifies undo/redo and circular reference rendering in the bundle
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { JSDOM } from 'jsdom';

import { createServer } from '../server/index.mjs';

const run = promisify(execFile);
const ROOT = path.resolve(import.meta.dirname, '..');

async function waitFor(fn, { timeout = 5000, interval = 25 } = {}) {
  const start = Date.now();
  for (;;) {
    let ok = false;
    try {
      ok = await fn();
    } catch {
      ok = false;
    }
    if (ok) return true;
    if (Date.now() - start > timeout) throw new Error('timed out waiting for condition');
    await new Promise((resolve) => setTimeout(resolve, interval));
  }
}

test('production bundle works end to end against the real server', async () => {
  // 1. build
  await run(process.execPath, [path.join(ROOT, 'scripts', 'build.mjs')], { cwd: ROOT });
  const distIndex = path.join(ROOT, 'dist', 'index.html');
  const html = await fs.readFile(distIndex, 'utf8');
  assert.match(html, /\/assets\/app\.js/, 'the shell points at the built bundle');
  assert.doesNotMatch(html, /\/src\/main\.js/, 'the dev entry point is gone');
  const bundle = await fs.readFile(path.join(ROOT, 'dist', 'assets', 'app.js'), 'utf8');

  // 2. production server with a 3-level chain already stored
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'rse-e2e-'));
  const dataFile = path.join(dir, 'workbook.json');
  await fs.writeFile(dataFile, JSON.stringify({
    version: 1,
    cells: { A1: '10', A2: '=A1*2', A3: '=A2+5', A4: '=SUM(A1:A3)' },
  }), 'utf8');

  const server = await createServer({ production: true, dataFile });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const dom = new JSDOM(html, { url: `${base}/`, runScripts: 'dangerously' });
  const { window } = dom;

  try {
    window.fetch = (input, init) => globalThis.fetch(new URL(input, base).toString(), init);

    // 4. run the bundle exactly like a browser would
    window.eval(bundle);

    const textOf = (ref) => window.document.querySelector(`td[data-ref="${ref}"]`).textContent;
    await waitFor(() => textOf('A4') === '55');
    assert.equal(textOf('A2'), '20');
    assert.equal(textOf('A3'), '25');

    // 5. edit the root value; the cascade must reach A4
    const app = window.__sheet;
    assert.ok(app, 'bundle exposes the app for debugging');
    app.applyChanges([{ ref: 'A1', before: '10', after: '100' }]);
    assert.equal(textOf('A2'), '200');
    assert.equal(textOf('A3'), '205');
    assert.equal(textOf('A4'), '505');

    // the backend must have received it (this is what survives a reload)
    await waitFor(async () => {
      const doc = await (await globalThis.fetch(`${base}/api/workbook`)).json();
      return doc.cells.A1 === '100';
    });

    // reload: a fresh page load must show the same computed values
    const reloaded = new JSDOM(html, { url: `${base}/`, runScripts: 'dangerously' });
    reloaded.window.fetch = (input, init) => globalThis.fetch(new URL(input, base).toString(), init);
    reloaded.window.eval(bundle);
    const reloadedText = (ref) => reloaded.window.document.querySelector(`td[data-ref="${ref}"]`).textContent;
    await waitFor(() => reloadedText('A4') === '505');
    assert.equal(reloadedText('A2'), '200');
    reloaded.window.close();

    // undo / redo through the keyboard model
    window.document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'z', ctrlKey: true, bubbles: true }));
    assert.equal(textOf('A4'), '55');
    window.document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'z', ctrlKey: true, shiftKey: true, bubbles: true }));
    assert.equal(textOf('A4'), '505');

    // circular reference renders #CYCLE! everywhere in the loop
    app.loadSample({ E1: '=E2+1', E2: '=E1+1', E3: '=E1*2' });
    assert.equal(textOf('E1'), '#CYCLE!');
    assert.equal(textOf('E2'), '#CYCLE!');
    assert.equal(textOf('E3'), '#CYCLE!');

    // error propagation
    app.loadSample({ F1: '=A1/0', F2: '=A0', F3: '="t"*2' });
    assert.equal(textOf('F1'), '#DIV/0!');
    assert.equal(textOf('F2'), '#REF!');
    assert.equal(textOf('F3'), '#VALUE!');

    // the built asset really is served, with a javascript content type
    const asset = await globalThis.fetch(`${base}/assets/app.js`);
    assert.equal(asset.status, 200);
    assert.match(asset.headers.get('content-type'), /javascript/);
    const css = await globalThis.fetch(`${base}/assets/styles.css`);
    assert.equal(css.status, 200);
  } finally {
    window.close();
    await new Promise((resolve) => server.close(resolve));
    await fs.rm(dir, { recursive: true, force: true });
  }
});
