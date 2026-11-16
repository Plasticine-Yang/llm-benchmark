import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express, { Express, Request, Response } from 'express';
import { WorkbookStore } from './store.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function resolveClientDistDir(): string | null {
  const candidates = [
    path.resolve(__dirname, '../../client'),
    path.resolve(process.cwd(), 'dist/client'),
  ];
  for (const dir of candidates) {
    if (fs.existsSync(path.join(dir, 'index.html'))) {
      return dir;
    }
  }
  return null;
}

export function createApp(store: WorkbookStore): Express {
  const app = express();
  app.use(express.json({ limit: '2mb' }));

  app.get('/api/health', async (_req: Request, res: Response) => {
    await store.init();
    const wb = store.getWorkbook();
    res.json({
      ok: true,
      rows: wb.rows,
      cols: wb.cols,
      revision: wb.revision,
    });
  });

  app.get('/api/workbook', async (_req: Request, res: Response) => {
    try {
      await store.init();
      res.json(store.getWorkbook());
    } catch (err) {
      console.error('GET /api/workbook failed:', err);
      res.status(500).json({ error: 'Failed to load workbook' });
    }
  });

  app.patch('/api/workbook/cells', async (req: Request, res: Response) => {
    try {
      const body = req.body as { updates?: unknown };
      if (!body || typeof body.updates !== 'object' || body.updates === null || Array.isArray(body.updates)) {
        res.status(400).json({ error: 'Invalid payload: "updates" object is required' });
        return;
      }

      const sanitized: Record<string, string> = {};
      for (const [id, val] of Object.entries(body.updates as Record<string, unknown>)) {
        if (typeof val !== 'string') {
          res.status(400).json({ error: `Invalid value for cell ${id}: expected string` });
          return;
        }
        sanitized[id] = val;
      }

      const result = await store.patchCells(sanitized);
      res.json(result);
    } catch (err) {
      console.error('PATCH /api/workbook/cells failed:', err);
      res.status(500).json({ error: 'Failed to update cells' });
    }
  });

  app.put('/api/workbook', async (req: Request, res: Response) => {
    try {
      const body = req.body as { cells?: unknown };
      if (!body || typeof body.cells !== 'object' || body.cells === null || Array.isArray(body.cells)) {
        res.status(400).json({ error: 'Invalid payload: "cells" object is required' });
        return;
      }

      const sanitized: Record<string, string> = {};
      for (const [id, entry] of Object.entries(body.cells as Record<string, unknown>)) {
        if (typeof entry === 'string') {
          sanitized[id] = entry;
        } else if (
          entry &&
          typeof entry === 'object' &&
          typeof (entry as { raw?: unknown }).raw === 'string'
        ) {
          sanitized[id] = (entry as { raw: string }).raw;
        } else {
          res.status(400).json({ error: `Invalid cell entry for ${id}` });
          return;
        }
      }

      const result = await store.replaceWorkbook(sanitized);
      res.json(result);
    } catch (err) {
      console.error('PUT /api/workbook failed:', err);
      res.status(500).json({ error: 'Failed to save workbook' });
    }
  });

  app.post('/api/workbook/reset', async (_req: Request, res: Response) => {
    try {
      const workbook = await store.resetWorkbook();
      res.json({ workbook });
    } catch (err) {
      console.error('POST /api/workbook/reset failed:', err);
      res.status(500).json({ error: 'Failed to reset workbook' });
    }
  });

  const clientDistDir = resolveClientDistDir();
  if (clientDistDir && process.env.NODE_ENV === 'production') {
    app.use(express.static(clientDistDir));
    app.get('*', (req: Request, res: Response, next) => {
      if (req.path.startsWith('/api')) {
        next();
        return;
      }
      res.sendFile(path.join(clientDistDir, 'index.html'));
    });
  }

  return app;
}
