import path from 'node:path';
import { createApp } from './app.js';
import { WorkbookStore } from './store.js';

const PORT = Number(process.env.PORT ?? 3001);
const WORKBOOK_FILE =
  process.env.WORKBOOK_FILE ?? path.resolve(process.cwd(), 'data/workbook.json');

async function main() {
  const store = new WorkbookStore(WORKBOOK_FILE);
  await store.init();
  const app = createApp(store);

  app.listen(PORT, () => {
    console.log(
      `Reactive Spreadsheet server listening on http://localhost:${PORT} (storage: ${WORKBOOK_FILE})`
    );
  });
}

main().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
