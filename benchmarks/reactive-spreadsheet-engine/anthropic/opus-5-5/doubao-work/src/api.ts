// Backend client + a small save queue that coalesces edits, retries on failure,
// and survives page unload (keepalive) so edits are not lost on reload.

import type { RawMap } from './engine/sheet';

export interface WorkbookPayload {
  cells: RawMap;
  values: Record<string, string>;
  cycles: string[];
  version: number;
  updatedAt: string;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init.headers ?? {}) },
  });
  const data = (await res.json().catch(() => ({}))) as { error?: string };
  if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
  return data as T;
}

export function fetchWorkbook(): Promise<WorkbookPayload> {
  return request<WorkbookPayload>('/api/workbook', { cache: 'no-store' });
}

export function patchCells(changes: RawMap): Promise<WorkbookPayload> {
  const body = JSON.stringify({ changes });
  // keepalive lets an in-flight save finish even if the user reloads immediately (64 KB limit).
  return request<WorkbookPayload>('/api/workbook/cells', { method: 'PATCH', body, keepalive: body.length < 60_000 });
}

export type SaveState = 'idle' | 'saving' | 'saved' | 'error';

export interface SaveInfo {
  state: SaveState;
  error?: string;
  version?: number;
  updatedAt?: string;
  /** Server-computed display values after the save (used to cross-check the client engine). */
  values?: Record<string, string>;
}

export class SaveQueue {
  private pending: RawMap = {};
  private inflight = false;
  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor(private readonly onChange: (info: SaveInfo) => void) {}

  get busy(): boolean {
    return this.inflight || Object.keys(this.pending).length > 0;
  }

  enqueue(changes: RawMap): void {
    Object.assign(this.pending, changes);
    void this.flush();
  }

  async flush(): Promise<void> {
    if (this.inflight) return;
    const batch = this.pending;
    if (Object.keys(batch).length === 0) return;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.pending = {};
    this.inflight = true;
    this.onChange({ state: 'saving' });
    try {
      const res = await patchCells(batch);
      this.inflight = false;
      if (Object.keys(this.pending).length) {
        void this.flush();
      } else {
        this.onChange({ state: 'saved', version: res.version, updatedAt: res.updatedAt, values: res.values });
      }
    } catch (e) {
      this.inflight = false;
      // Newer edits made meanwhile win over the failed batch.
      this.pending = { ...batch, ...this.pending };
      this.onChange({ state: 'error', error: e instanceof Error ? e.message : 'Save failed' });
      this.timer = setTimeout(() => void this.flush(), 3000);
    }
  }
}
