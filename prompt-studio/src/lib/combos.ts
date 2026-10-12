import type { CatalogFamily } from '../types';

/** 矩阵里的一行：全集中的一个 family/model/harness 组合。 */
export type ComboRow = {
  /** "family/model/harness" */
  key: string;
  family: string;
  model: string;
  harness: string;
  /** 筛选后该行在所属模型里的序号；0 表示模型的第一行，只有这一行显示模型名 */
  nth: number;
  /** 筛选后是否为所属模型的最后一行（画树形连线用） */
  last: boolean;
};

export type ComboGroup = {
  family: string;
  /** 筛选后本组可见的模型数 */
  modelCount: number;
  rows: ComboRow[];
};

/**
 * 把全集按厂商分组并摊平成行，顺序沿用 catalog.txt 的书写顺序。
 *
 * query 按空白切成多个词，组合键里必须同时包含全部词才算命中，
 * 例如 "gpt codex" 只留下 gpt 家族里 harness 为 codex 的组合。
 * keep 是额外的过滤条件（例如只看已跑 / 待跑）。
 */
export function groupCombos(
  catalog: CatalogFamily[],
  query: string,
  keep: (key: string) => boolean = () => true,
): ComboGroup[] {
  const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
  const groups: ComboGroup[] = [];

  for (const family of catalog) {
    const rows: ComboRow[] = [];
    let modelCount = 0;

    for (const model of family.models) {
      const modelRows: ComboRow[] = [];
      for (const harness of model.harnesses) {
        const key = `${family.id}/${model.id}/${harness}`;
        const haystack = key.toLowerCase();
        if (!tokens.every((token) => haystack.includes(token))) continue;
        if (!keep(key)) continue;
        modelRows.push({
          key,
          family: family.id,
          model: model.id,
          harness,
          nth: modelRows.length,
          last: false,
        });
      }
      const tail = modelRows[modelRows.length - 1];
      if (tail) {
        tail.last = true;
        modelCount += 1;
        rows.push(...modelRows);
      }
    }

    if (rows.length > 0) groups.push({ family: family.id, modelCount, rows });
  }

  return groups;
}

/** 全集里所有组合键（按 catalog.txt 书写顺序）。 */
export function catalogKeys(catalog: CatalogFamily[]): string[] {
  const keys: string[] = [];
  for (const family of catalog) {
    for (const model of family.models) {
      for (const harness of model.harnesses) keys.push(`${family.id}/${model.id}/${harness}`);
    }
  }
  return keys;
}
