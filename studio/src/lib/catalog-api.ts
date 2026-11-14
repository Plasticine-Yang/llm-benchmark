import type { CatalogOp } from '../shared/catalog';
import type { CatalogFamily } from '../types';

export type CatalogMutation = {
  catalog: CatalogFamily[];
  catalogSize: number;
  problems: string[];
  text: string;
};

async function post(path: string, body?: unknown): Promise<CatalogMutation> {
  const response = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Bench-Studio': '1' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = (await response.json().catch(() => null)) as
    | (CatalogMutation & { error?: string })
    | null;
  if (!response.ok || !data?.catalog) {
    throw new Error(data?.error ?? `HTTP ${response.status}`);
  }
  return data;
}

export function mutateCatalog(op: CatalogOp): Promise<CatalogMutation> {
  return post('/api/catalog/mutate', op);
}

export function undoCatalog(): Promise<CatalogMutation> {
  return post('/api/catalog/undo');
}