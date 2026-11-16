import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { WebSocketServer } from 'ws';
import { JobPriority } from '../shared/types.js';
import { SimManager } from './simManager.js';
import { WarehouseStore } from './store.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface ServerHandle {
  app: express.Express;
  server: http.Server;
  wss: WebSocketServer;
  sim: SimManager;
  store: WarehouseStore;
  close: () => Promise<void>;
}

const VALID_PRIORITIES = new Set<JobPriority>(['LOW', 'NORMAL', 'HIGH', 'URGENT']);

export function createWarehouseServer(options?: {
  dbPath?: string;
  staticDir?: string;
  defaultSeed?: string;
}): ServerHandle {
  const dbPath =
    options?.dbPath ??
    process.env.WAREHOUSE_DB_PATH ??
    path.resolve(process.cwd(), 'data', 'warehouse.db');

  const store = new WarehouseStore(dbPath);
  const sim = new SimManager(store, options?.defaultSeed);

  const app = express();
  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, seq: sim.getSeq(), clients: sim.getClientCount() });
  });

  app.get('/api/state', (_req, res) => {
    res.json(sim.getSnapshot());
  });

  app.post('/api/jobs', (req, res) => {
    const { shelfId, workstationId, priority } = req.body as {
      shelfId?: string;
      workstationId?: string;
      priority?: JobPriority;
    };
    if (!shelfId || !workstationId) {
      res.status(400).json({ error: 'shelfId and workstationId are required' });
      return;
    }
    const prio: JobPriority = priority && VALID_PRIORITIES.has(priority) ? priority : 'NORMAL';
    const result = sim.createJob(shelfId, workstationId, prio);
    if (!result.ok) {
      res.status(400).json({ error: result.error });
      return;
    }
    res.status(201).json({ jobId: result.jobId, snapshot: result.snapshot });
  });

  app.post('/api/jobs/batch', (req, res) => {
    const { jobs } = req.body as {
      jobs?: Array<{ shelfId: string; workstationId: string; priority?: JobPriority }>;
    };
    if (!Array.isArray(jobs) || jobs.length === 0) {
      res.status(400).json({ error: 'jobs array is required' });
      return;
    }
    const normalized = jobs.map((j) => ({
      shelfId: j.shelfId,
      workstationId: j.workstationId,
      priority: j.priority && VALID_PRIORITIES.has(j.priority) ? j.priority : ('NORMAL' as JobPriority),
    }));
    const result = sim.createJobBatch(normalized);
    if (!result.ok) {
      res.status(400).json({ error: result.error });
      return;
    }
    res.status(201).json({ jobIds: result.jobIds, snapshot: result.snapshot });
  });

  app.delete('/api/jobs/:jobId', (req, res) => {
    const result = sim.cancelJob(req.params.jobId);
    if (!result.ok) {
      res.status(400).json({ error: result.error });
      return;
    }
    res.json({ snapshot: result.snapshot });
  });

  app.post('/api/grid/block', (req, res) => {
    const { x, y, blocked } = req.body as { x?: number; y?: number; blocked?: boolean };
    if (typeof x !== 'number' || typeof y !== 'number') {
      res.status(400).json({ error: 'Numeric x and y are required' });
      return;
    }
    const result = sim.toggleBlockCell(x, y, blocked);
    if (!result.ok) {
      res.status(400).json({ error: result.error });
      return;
    }
    res.json({ blocked: result.blocked, snapshot: result.snapshot });
  });

  app.post('/api/sim/pause', (_req, res) => {
    res.json({ snapshot: sim.pause() });
  });

  app.post('/api/sim/resume', (_req, res) => {
    res.json({ snapshot: sim.resume() });
  });

  app.post('/api/sim/step', (_req, res) => {
    res.json({ snapshot: sim.stepSingle() });
  });

  app.post('/api/sim/speed', (req, res) => {
    const { tickIntervalMs } = req.body as { tickIntervalMs?: number };
    if (typeof tickIntervalMs !== 'number') {
      res.status(400).json({ error: 'tickIntervalMs number is required' });
      return;
    }
    res.json({ snapshot: sim.setSpeed(tickIntervalMs) });
  });

  app.post('/api/sim/reset', (req, res) => {
    const { seed, autoStart } = (req.body ?? {}) as { seed?: string; autoStart?: boolean };
    res.json({ snapshot: sim.reset(seed, autoStart) });
  });

  // Serve built client static assets in production
  const candidateDirs = [
    options?.staticDir,
    path.resolve(process.cwd(), 'dist', 'client'),
    path.resolve(__dirname, '..', '..', 'client'),
  ].filter(Boolean) as string[];

  const staticDir = candidateDirs.find((d) => fs.existsSync(path.join(d, 'index.html')));
  if (staticDir) {
    app.use(express.static(staticDir));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api/') || req.path.startsWith('/ws')) {
        next();
        return;
      }
      res.sendFile(path.join(staticDir, 'index.html'));
    });
  }

  const server = http.createServer(app);
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws) => {
    sim.attachClient(ws);
  });

  const close = async (): Promise<void> => {
    sim.stopLoop();
    for (const client of wss.clients) {
      client.terminate();
    }
    await new Promise<void>((resolve) => wss.close(() => resolve()));
    await new Promise<void>((resolve) => server.close(() => resolve()));
    store.close();
  };

  return { app, server, wss, sim, store, close };
}

// Entry point when invoked directly
const isDirectRun =
  process.argv[1] &&
  (path.resolve(process.argv[1]) === path.resolve(__filename) ||
    path.resolve(process.argv[1]).endsWith('server/index.js') ||
    path.resolve(process.argv[1]).endsWith('server/index.ts'));

if (isDirectRun && process.env.VITEST !== 'true') {
  const port = Number(process.env.PORT ?? 3001);
  const handle = createWarehouseServer();
  handle.server.listen(port, () => {
    handle.sim.startLoop();
    console.log(`AegisWMS server listening on http://localhost:${port}`);
  });

  const shutdown = () => {
    void handle.close().then(() => process.exit(0));
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}
