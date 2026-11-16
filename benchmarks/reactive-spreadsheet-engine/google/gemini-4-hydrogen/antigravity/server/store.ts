import fs from 'node:fs/promises';
import path from 'node:path';
import { SpreadsheetEngine } from '../shared/engine.js';
import {
  DEFAULT_COLS,
  DEFAULT_ROWS,
  PersistedCell,
  RecalcResult,
  WorkbookData,
} from '../shared/types.js';

export class WorkbookStore {
  private readonly filePath: string;
  private readonly engine: SpreadsheetEngine;
  private revision = 0;
  private updatedAt = new Date().toISOString();
  private writeChain: Promise<unknown> = Promise.resolve();
  private initialized = false;

  constructor(filePath: string) {
    this.filePath = filePath;
    this.engine = new SpreadsheetEngine(undefined, {
      rows: DEFAULT_ROWS,
      cols: DEFAULT_COLS,
    });
  }

  async init(): Promise<void> {
    if (this.initialized) return;
    await fs.mkdir(path.dirname(this.filePath), { recursive: true });
    try {
      const raw = await fs.readFile(this.filePath, 'utf8');
      const parsed = JSON.parse(raw) as Partial<WorkbookData>;
      if (parsed && typeof parsed === 'object' && parsed.cells) {
        this.engine.loadCells(parsed.cells as Record<string, PersistedCell>);
        this.revision = typeof parsed.revision === 'number' ? parsed.revision : 1;
        this.updatedAt =
          typeof parsed.updatedAt === 'string'
            ? parsed.updatedAt
            : new Date().toISOString();
      }
    } catch (err: unknown) {
      const code = (err as NodeJS.ErrnoException)?.code;
      if (code !== 'ENOENT') {
        console.warn('Could not read workbook file, starting fresh:', err);
      }
      await this.persistAtomic();
    }
    this.initialized = true;
  }

  getWorkbook(): WorkbookData {
    return {
      id: 'default',
      name: 'Reactive Workbook',
      rows: this.engine.dims.rows,
      cols: this.engine.dims.cols,
      revision: this.revision,
      updatedAt: this.updatedAt,
      cells: this.engine.exportPersistedCells(),
    };
  }

  patchCells(
    updates: Record<string, string>
  ): Promise<{ workbook: WorkbookData; recalc: RecalcResult }> {
    return this.enqueue(async () => {
      await this.init();
      const recalc = this.engine.setCells(updates);
      this.revision += 1;
      this.updatedAt = new Date().toISOString();
      await this.persistAtomic();
      return {
        workbook: this.getWorkbook(),
        recalc,
      };
    });
  }

  replaceWorkbook(
    cells: Record<string, string>
  ): Promise<{ workbook: WorkbookData; recalc: RecalcResult }> {
    return this.enqueue(async () => {
      await this.init();
      const recalc = this.engine.loadCells(cells);
      this.revision += 1;
      this.updatedAt = new Date().toISOString();
      await this.persistAtomic();
      return {
        workbook: this.getWorkbook(),
        recalc,
      };
    });
  }

  resetWorkbook(): Promise<WorkbookData> {
    return this.enqueue(async () => {
      await this.init();
      this.engine.clear();
      this.revision += 1;
      this.updatedAt = new Date().toISOString();
      await this.persistAtomic();
      return this.getWorkbook();
    });
  }

  private enqueue<T>(op: () => Promise<T>): Promise<T> {
    const next = this.writeChain.then(op, op);
    this.writeChain = next.catch(() => {});
    return next;
  }

  private async persistAtomic(): Promise<void> {
    const data = this.getWorkbook();
    const tmpPath = `${this.filePath}.${process.pid}.${Date.now()}.tmp`;
    await fs.writeFile(tmpPath, JSON.stringify(data, null, 2), 'utf8');
    await fs.rename(tmpPath, this.filePath);
  }
}
