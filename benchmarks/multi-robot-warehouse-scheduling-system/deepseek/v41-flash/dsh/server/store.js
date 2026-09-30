// Tiny JSON persistence layer (no external dependencies).
// Jobs, map changes and the current simulation state are stored so a page reload
// (or a server restart) can continue observing exactly the same run.

import fs from 'node:fs';
import path from 'node:path';

export class Store {
  constructor(file) {
    this.file = file;
    this.tmp = `${file}.tmp`;
    this.dirty = false;
    this.timer = null;
    this.writes = 0;
    try {
      fs.mkdirSync(path.dirname(file), { recursive: true });
    } catch {
      /* ignore */
    }
  }

  load() {
    try {
      if (!fs.existsSync(this.file)) return null;
      const raw = fs.readFileSync(this.file, 'utf8');
      if (!raw.trim()) return null;
      return JSON.parse(raw);
    } catch (err) {
      console.error(`[store] could not read ${this.file}: ${err.message}`);
      return null;
    }
  }

  saveNow(payload) {
    try {
      fs.writeFileSync(this.tmp, JSON.stringify(payload), 'utf8');
      fs.renameSync(this.tmp, this.file);
      this.writes += 1;
      this.dirty = false;
      return true;
    } catch (err) {
      console.error(`[store] could not write ${this.file}: ${err.message}`);
      return false;
    }
  }

  /** Debounced save: at most one write per `delay` ms. */
  save(payload, delay = 900) {
    this.dirty = true;
    if (this.timer) return;
    this.timer = setTimeout(() => {
      this.timer = null;
      if (this.dirty) this.saveNow(payload());
    }, delay);
  }

  flush(payload) {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    if (this.dirty) this.saveNow(payload());
  }
}
