import fs from 'node:fs';
import path from 'node:path';

export class Store {
  constructor(dir) {
    this.dir = dir;
    this.file = path.join(dir, 'state.json');
    this.tmp = path.join(dir, 'state.json.tmp');
    this.lastWrite = 0;
    this.pending = null;
    fs.mkdirSync(dir, { recursive: true });
  }

  load() {
    try {
      if (!fs.existsSync(this.file)) return null;
      return JSON.parse(fs.readFileSync(this.file, 'utf8'));
    } catch {
      return null;
    }
  }

  // Debounced atomic write; the simulation never blocks on disk for long.
  save(state, { force = false } = {}) {
    const now = Date.now();
    this.pending = state;
    if (!force && now - this.lastWrite < 750) return;
    this.flush();
  }

  flush() {
    if (!this.pending) return;
    const data = this.pending;
    this.pending = null;
    this.lastWrite = Date.now();
    try {
      fs.writeFileSync(this.tmp, JSON.stringify(data));
      fs.renameSync(this.tmp, this.file);
    } catch (err) {
      console.error('[store] persist failed:', err.message);
    }
  }
}