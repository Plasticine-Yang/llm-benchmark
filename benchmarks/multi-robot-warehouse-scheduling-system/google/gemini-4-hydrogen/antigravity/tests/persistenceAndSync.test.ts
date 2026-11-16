import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { WebSocket } from 'ws';
import { DEFAULT_SEED, WsServerMessage } from '../src/shared/types.js';
import { createWarehouseServer } from '../src/server/index.js';
import { SimManager } from '../src/server/simManager.js';
import { WarehouseStore } from '../src/server/store.js';

function createTempDbPath(name: string): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'aegis-wms-test-'));
  return path.join(dir, `${name}.db`);
}

function connectWs(url: string): Promise<{
  ws: WebSocket;
  messages: WsServerMessage[];
  waitForCount: (n: number) => Promise<WsServerMessage[]>;
}> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url);
    const messages: WsServerMessage[] = [];
    const waiters: Array<{ count: number; done: (msgs: WsServerMessage[]) => void }> = [];

    ws.on('message', (raw) => {
      const parsed = JSON.parse(raw.toString()) as WsServerMessage;
      messages.push(parsed);
      for (let i = waiters.length - 1; i >= 0; i--) {
        if (messages.length >= waiters[i].count) {
          waiters[i].done([...messages]);
          waiters.splice(i, 1);
        }
      }
    });

    ws.on('open', () => {
      resolve({
        ws,
        messages,
        waitForCount: (n: number) => {
          if (messages.length >= n) return Promise.resolve([...messages]);
          return new Promise((res) => {
            waiters.push({ count: n, done: res });
          });
        },
      });
    });

    ws.on('error', reject);
  });
}

describe('SQLite Persistence & WebSocket Reconnect Consistency', () => {
  it('persists jobs, obstacles, and simulation state across store reload', () => {
    const dbPath = createTempDbPath('persist');

    // Boot 1
    const store1 = new WarehouseStore(dbPath);
    const sim1 = new SimManager(store1, DEFAULT_SEED);
    sim1.pause();
    sim1.createJob('S-03', 'WS-2', 'HIGH');
    sim1.createJob('S-14', 'WS-5', 'URGENT');
    sim1.toggleBlockCell(5, 7, true);
    for (let i = 0; i < 8; i++) {
      sim1.stepSingle();
    }
    const snapBeforeReload = sim1.getSnapshot();
    store1.close();

    // Boot 2 (simulated server restart / reload)
    const store2 = new WarehouseStore(dbPath);
    const sim2 = new SimManager(store2, DEFAULT_SEED);
    const snapAfterReload = sim2.getSnapshot();
    store2.close();

    expect(snapAfterReload.tick).toBe(snapBeforeReload.tick);
    expect(snapAfterReload.seq).toBe(snapBeforeReload.seq);
    expect(snapAfterReload.running).toBe(snapBeforeReload.running);
    expect(snapAfterReload.grid.cells[7][5].blocked).toBe(true);
    expect(snapAfterReload.jobs).toEqual(snapBeforeReload.jobs);
    expect(snapAfterReload.robots.map((r) => ({ id: r.id, pos: r.pos, status: r.status }))).toEqual(
      snapBeforeReload.robots.map((r) => ({ id: r.id, pos: r.pos, status: r.status }))
    );
  });

  it('streams monotonic seq numbers and recovers cleanly with snapshot on WS reconnect', async () => {
    const dbPath = createTempDbPath('ws-sync');
    const handle = createWarehouseServer({ dbPath, defaultSeed: DEFAULT_SEED });

    await new Promise<void>((resolve) => {
      handle.server.listen(0, '127.0.0.1', () => resolve());
    });

    const address = handle.server.address();
    const port = typeof address === 'object' && address ? address.port : 0;
    const wsUrl = `ws://127.0.0.1:${port}/ws`;

    try {
      // Client 1 connects and gets initial SNAPSHOT
      const c1 = await connectWs(wsUrl);
      const msgs1 = await c1.waitForCount(1);
      const firstMsg = msgs1[0];
      expect(firstMsg.type).toBe('SNAPSHOT');
      if (firstMsg.type !== 'SNAPSHOT') throw new Error('Expected SNAPSHOT');
      let lastSeq = firstMsg.seq;

      // Create 3 simultaneous jobs and step several ticks
      handle.sim.createJobBatch([
        { shelfId: 'S-01', workstationId: 'WS-1', priority: 'NORMAL' },
        { shelfId: 'S-08', workstationId: 'WS-3', priority: 'HIGH' },
        { shelfId: 'S-18', workstationId: 'WS-6', priority: 'URGENT' },
      ]);
      handle.sim.advanceOneTick();
      handle.sim.advanceOneTick();

      const msgsAfterUpdates = await c1.waitForCount(4);
      for (let i = 1; i < msgsAfterUpdates.length; i++) {
        const updateMsg = msgsAfterUpdates[i];
        expect(updateMsg.type).toBe('STATE_UPDATE');
        if (updateMsg.type !== 'STATE_UPDATE') throw new Error('Expected STATE_UPDATE');
        expect(updateMsg.seq).toBe(lastSeq + 1);
        lastSeq = updateMsg.seq;
      }

      // Disconnect client
      c1.ws.close();

      // Advance simulation & toggle obstacle while client is disconnected
      handle.sim.advanceOneTick();
      handle.sim.advanceOneTick();
      handle.sim.toggleBlockCell(16, 7, true);
      handle.sim.advanceOneTick();
      const serverSeqBeforeReconnect = handle.sim.getSeq();
      expect(serverSeqBeforeReconnect).toBeGreaterThan(lastSeq);

      // Reconnect client -> must receive complete SNAPSHOT at serverSeqBeforeReconnect
      const c2 = await connectWs(wsUrl);
      const msgs2 = await c2.waitForCount(1);
      const snapMsg = msgs2[0];
      expect(snapMsg.type).toBe('SNAPSHOT');
      if (snapMsg.type !== 'SNAPSHOT') throw new Error('Expected SNAPSHOT');
      expect(snapMsg.seq).toBe(serverSeqBeforeReconnect);
      expect(snapMsg.data.grid.cells[7][16].blocked).toBe(true);
      expect(snapMsg.data.jobs.length).toBe(3);

      // Subsequent updates must strictly continue from snapshot.seq + 1
      handle.sim.advanceOneTick();
      const msgs2Next = await c2.waitForCount(2);
      const nextMsg = msgs2Next[1];
      expect(nextMsg.type).toBe('STATE_UPDATE');
      if (nextMsg.type !== 'STATE_UPDATE') throw new Error('Expected STATE_UPDATE');
      expect(nextMsg.seq).toBe(serverSeqBeforeReconnect + 1);

      c2.ws.close();
    } finally {
      await handle.close();
    }
  });
});
