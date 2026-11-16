import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { WorkbookStore } from './store.js';
import { createApp } from './app.js';

async function withTestServer(
  fn: (baseUrl: string, filePath: string) => Promise<void>
): Promise<void> {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sheet-server-test-'));
  const filePath = path.join(tmpDir, 'workbook.json');
  const store = new WorkbookStore(filePath);
  await store.init();
  const app = createApp(store);
  const server = http.createServer(app);

  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve());
  });

  const addr = server.address();
  assert.ok(addr && typeof addr === 'object');
  const baseUrl = `http://127.0.0.1:${addr.port}`;

  try {
    await fn(baseUrl, filePath);
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
    await fs.rm(tmpDir, { recursive: true, force: true });
  }
}

test('persists cells, multi-level formulas, cycles, and reloads cleanly from disk', async () => {
  await withTestServer(async (baseUrl, filePath) => {
    // 1. Initial GET returns empty 25x12 workbook
    const res1 = await fetch(`${baseUrl}/api/workbook`);
    assert.equal(res1.status, 200);
    const wb1 = await res1.json();
    assert.equal(wb1.rows, 25);
    assert.equal(wb1.cols, 12);
    assert.deepEqual(wb1.cells, {});

    // 2. Patch 3-level formula chain
    const res2 = await fetch(`${baseUrl}/api/workbook/cells`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        updates: {
          A1: '10',
          B1: '=A1 * 2',
          C1: '=B1 + 5',
          D1: '=SUM(A1:C1)',
        },
      }),
    });
    assert.equal(res2.status, 200);
    const body2 = await res2.json();
    assert.equal(body2.workbook.cells.D1.computed, 10 + 20 + 25);

    // 3. Re-instantiate fresh WorkbookStore reading from the same file (simulates server restart)
    const freshStore = new WorkbookStore(filePath);
    await freshStore.init();
    const reloaded = freshStore.getWorkbook();
    assert.equal(reloaded.cells.A1.raw, '10');
    assert.equal(reloaded.cells.B1.raw, '=A1 * 2');
    assert.equal(reloaded.cells.B1.computed, 20);
    assert.equal(reloaded.cells.C1.computed, 25);
    assert.equal(reloaded.cells.D1.computed, 55);

    // 4. Create cycle via PATCH and verify persisted #CYCLE!
    const res3 = await fetch(`${baseUrl}/api/workbook/cells`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        updates: {
          A1: '=C1 + 1',
        },
      }),
    });
    assert.equal(res3.status, 200);
    const body3 = await res3.json();
    assert.equal(body3.workbook.cells.A1.error, '#CYCLE!');
    assert.equal(body3.workbook.cells.B1.error, '#CYCLE!');
    assert.equal(body3.workbook.cells.C1.error, '#CYCLE!');
    assert.equal(body3.workbook.cells.D1.error, '#CYCLE!');

    // 5. Reset clears workbook
    const res4 = await fetch(`${baseUrl}/api/workbook/reset`, { method: 'POST' });
    assert.equal(res4.status, 200);
    const body4 = await res4.json();
    assert.deepEqual(body4.workbook.cells, {});
  });
});

test('rejects invalid PATCH payloads with HTTP 400', async () => {
  await withTestServer(async (baseUrl) => {
    const res = await fetch(`${baseUrl}/api/workbook/cells`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ updates: { A1: 123 } }),
    });
    assert.equal(res.status, 400);
  });
});
