import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
export const defaultDataFile = path.join(here, 'data', 'state.json');

export class StateStore {
  constructor(filePath = process.env.DATA_FILE || defaultDataFile) {
    this.filePath = path.resolve(filePath);
    this.pending = null;
    this.writing = false;
    this.lastError = null;
  }

  load() {
    try {
      if (!fs.existsSync(this.filePath)) return null;
      const text = fs.readFileSync(this.filePath, 'utf8');
      if (!text.trim()) return null;
      return JSON.parse(text);
    } catch (error) {
      this.lastError = error;
      console.error(`[store] Could not read ${this.filePath}:`, error.message);
      return null;
    }
  }

  save(data) {
    this.pending = data;
    if (!this.writing) void this.flushLoop();
  }

  async flushLoop() {
    if (this.writing) return;
    this.writing = true;
    while (this.pending) {
      const next = this.pending;
      this.pending = null;
      try {
        await fsp.mkdir(path.dirname(this.filePath), { recursive: true });
        const temp = `${this.filePath}.${process.pid}.tmp`;
        await fsp.writeFile(temp, JSON.stringify(next), 'utf8');
        await fsp.rename(temp, this.filePath);
        this.lastError = null;
      } catch (error) {
        this.lastError = error;
        console.error(`[store] Could not persist state:`, error.message);
      }
    }
    this.writing = false;
  }

  async flushNow() {
    if (this.pending) await this.flushLoop();
    while (this.writing) {
      await new Promise((resolve) => setTimeout(resolve, 10));
      if (!this.pending) break;
      await this.flushLoop();
    }
  }
}
