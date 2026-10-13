// Persistence: atomically writes the authoritative state to disk.
import fs from 'node:fs';
import path from 'node:path';

export class Store {
  constructor(file) { this.file = file; fs.mkdirSync(path.dirname(file), { recursive: true }); this.timer = null; }
  load() {
    try { const s = JSON.parse(fs.readFileSync(this.file, 'utf8')); return s && s.version === 1 ? s : null; } catch { return null; }
  }
  saveNow(state) {
    const tmp = `${this.file}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(state));
    fs.renameSync(tmp, this.file);
  }
  saveSoon(getState) {
    if (this.timer) return;
    this.timer = setTimeout(() => { this.timer = null; try { this.saveNow(getState()); } catch (e) { console.error('persist failed', e); } }, 250);
  }
}
