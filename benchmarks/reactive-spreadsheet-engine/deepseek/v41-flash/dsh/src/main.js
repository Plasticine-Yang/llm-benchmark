import { SpreadsheetEngine } from './engine/engine.js';
import { mountApp } from './ui/app.js';

/** Thin REST client for the persistence backend. */
const api = {
  async load() {
    const res = await fetch('/api/workbook', { headers: { accept: 'application/json' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },
  async save(cells) {
    const res = await fetch('/api/workbook', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ cells }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },
};

const engine = new SpreadsheetEngine({ rows: 60, cols: 26 });
const root = document.getElementById('app');
const app = mountApp(root, { engine, api });

// handy for debugging from the console
if (typeof window !== 'undefined') window.__sheet = app;

export default app;
