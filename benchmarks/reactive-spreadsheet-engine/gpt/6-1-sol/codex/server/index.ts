import express from 'express';
import { readFile, writeFile, rename, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Workbook, validId, type Edit } from '../src/engine.ts';
import { demoCells } from '../src/demo.ts';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const storage = process.env.WORKBOOK_FILE ?? path.join(root, 'data', 'workbook.json');
await mkdir(path.dirname(storage), { recursive: true });
let revision = 0;
let workbook: Workbook;
try {
  const saved = JSON.parse(await readFile(storage, 'utf8'));
  workbook = new Workbook(saved.cells);
  revision = saved.revision ?? 0;
} catch (error: any) {
  if (error.code !== 'ENOENT') { console.error('Unable to read workbook:', error.message); process.exit(1); }
  workbook = new Workbook(demoCells);
}
const snapshot = () => ({ revision, cells: workbook.rawCells(), computed: Object.fromEntries([...workbook.cells].filter(([, cell]) => cell.raw).map(([id, cell]) => [id, { value: cell.value, error: cell.error }])) });
async function persist() {
  const temporary = `${storage}.tmp`;
  await writeFile(temporary, JSON.stringify(snapshot(), null, 2), 'utf8');
  await rename(temporary, storage);
}
await persist();
const app = express();
app.use(express.json({ limit: '1mb' }));
app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.get('/api/workbook', (_req, res) => res.json(snapshot()));
// Serialize mutations, so overlapping autosaves cannot overwrite newer edits.
let writes = Promise.resolve();
app.patch('/api/workbook', (req, res) => {
  const edits = req.body?.edits as Edit[];
  if (!Array.isArray(edits) || edits.length > 240 || edits.some(e => !e || !validId(e.id) || typeof e.raw !== 'string' || e.raw.length > 8192)) {
    res.status(400).json({ error: 'Expected up to 240 valid cell edits (A1:J24, maximum 8192 characters).' }); return;
  }
  const expected = req.body.revision;
  writes = writes.then(async () => {
    if (expected !== revision) { res.status(409).json({ error: 'Workbook changed in another tab. Reload to get the latest version.', revision }); return; }
    const previous = workbook.rawCells(), oldRevision = revision;
    try {
      workbook.applyEdits(edits); revision++;
      await persist();
      res.json({ revision, recalculated: workbook.lastRecalculated });
    } catch (error) {
      workbook = new Workbook(previous); revision = oldRevision;
      console.error(error); res.status(500).json({ error: 'Unable to save workbook. Please retry.' });
    }
  }).catch(error => { console.error(error); if (!res.headersSent) res.status(500).json({ error: 'Save failed.' }); });
});
app.use(express.static(path.join(root, 'dist')));
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) { res.status(404).json({ error: 'Unknown API route' }); return; }
  res.sendFile(path.join(root, 'dist', 'index.html'));
});
const port = Number(process.env.PORT ?? 3001);
app.listen(port, '0.0.0.0', () => console.log(`Forma ready at http://localhost:${port}`));
