/**
 * Backend tests: persistence round-trip, validation, restart survival,
 * default workbook and static serving.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { createServer, sanitizeCells, DEFAULT_WORKBOOK } from '../server/index.mjs';

async function listen(server) {
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  return `http://127.0.0.1:${server.address().port}`;
}

async function close(server) {
  await new Promise((resolve) => server.close(resolve));
}

test('sanitizeCells drops malformed addresses and non-string values', () => {
  const clean = sanitizeCells({
    a1: '1',
    'B2': '=A1+1',
    'not-a-ref': 'x',
    'AAAA1': 'x',
    C3: 5,
    D4: '',
  });
  assert.deepEqual(clean, { A1: '1', B2: '=A1+1' });
});

test('workbook round-trips through the API and survives a restart', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'rse-store-'));
  const file = path.join(dir, 'workbook.json');
  let server;
  let server2;

  try {
    server = await createServer({ dataFile: file });
    const base = await listen(server);

    // fresh install serves the seeded default workbook
    let doc = await (await fetch(`${base}/api/workbook`)).json();
    assert.deepEqual(doc.cells, DEFAULT_WORKBOOK.cells);
    assert.equal(doc.source, 'default');

    // write a chain
    const cells = { A1: '10', A2: '=A1*2', A3: '=A2+5', A4: '=SUM(A1:A3)' };
    let res = await fetch(`${base}/api/workbook`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ cells }),
    });
    assert.equal(res.status, 200);
    doc = await res.json();
    assert.deepEqual(doc.cells, cells);
    assert.ok(doc.updatedAt);

    await close(server);
    server = null;

    // a brand new server process reads the same file
    server2 = await createServer({ dataFile: file });
    const base2 = await listen(server2);
    doc = await (await fetch(`${base2}/api/workbook`)).json();
    assert.deepEqual(doc.cells, cells);
    assert.equal(doc.source, 'disk');

    // static dev shell is served
    const html = await (await fetch(`${base2}/`)).text();
    assert.match(html, /<div id="app">/);
    assert.match(html, /src\/main\.js/);

    // the ES module source is served for the dev shell
    const mod = await fetch(`${base2}/src/engine/engine.js`);
    assert.equal(mod.status, 200);
    assert.match(mod.headers.get('content-type'), /javascript/);

    // path traversal is refused
    const evil = await fetch(`${base2}/src/../../../../etc/passwd`);
    assert.notEqual(evil.status, 200);

    // reset restores the default workbook
    res = await fetch(`${base2}/api/workbook/reset`, { method: 'POST' });
    doc = await res.json();
    assert.deepEqual(doc.cells, DEFAULT_WORKBOOK.cells);
  } finally {
    if (server) await close(server);
    if (server2) await close(server2);
    await fs.rm(dir, { recursive: true, force: true });
  }
});

test('unknown routes and bad payloads are reported cleanly', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'rse-store-'));
  const server = await createServer({ dataFile: path.join(dir, 'w.json') });
  try {
    const base = await listen(server);

    assert.equal((await fetch(`${base}/api/nope`)).status, 404);
    const bad = await fetch(`${base}/api/workbook`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: '{not json',
    });
    assert.equal(bad.status, 400);
    const health = await (await fetch(`${base}/api/health`)).json();
    assert.equal(health.ok, true);
  } finally {
    await close(server);
    await fs.rm(dir, { recursive: true, force: true });
  }
});
