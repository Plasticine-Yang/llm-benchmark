import { readFileSync } from 'node:fs';
import type { CatalogFamily, CatalogModel } from '../src/types.ts';

export type CatalogResult = {
  catalog: CatalogFamily[];
  /** 全集条目总数（family/model/harness 三元组数） */
  size: number;
  /** 清单本身写错的地方 */
  problems: string[];
};

/**
 * 解析 benchmarks/catalog.txt —— 组合全集。
 *
 * 每行：<family>/<model>    <harness>[, <harness>...]
 * 以 # 开头为注释。展示顺序沿用文件里的书写顺序。
 */
export function parseCatalog(path: string): CatalogResult {
  const families: CatalogFamily[] = [];
  const problems: string[] = [];
  let size = 0;

  const lines = readFileSync(path, 'utf8').split('\n');
  lines.forEach((rawLine, index) => {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) return;

    const fields = line.split(/\s+/);
    const key = fields[0] ?? '';
    const harnesses = fields
      .slice(1)
      .join(' ')
      .split(',')
      .map((harness) => harness.trim())
      .filter(Boolean);

    const segments = key.split('/').filter(Boolean);
    if (segments.length !== 2) {
      problems.push(`catalog.txt 第 ${index + 1} 行：「${key}」应为 <family>/<model>`);
      return;
    }
    if (harnesses.length === 0) {
      problems.push(`catalog.txt 第 ${index + 1} 行：「${key}」没有列出任何 harness`);
      return;
    }

    const [familyId, modelId] = segments as [string, string];
    let family = families.find((item) => item.id === familyId);
    if (!family) {
      family = { id: familyId, models: [] };
      families.push(family);
    }

    let model = family.models.find((item) => item.id === modelId);
    if (!model) {
      model = { id: modelId, harnesses: [] } satisfies CatalogModel;
      family.models.push(model);
    }

    for (const harness of harnesses) {
      if (!model.harnesses.includes(harness)) {
        model.harnesses.push(harness);
        size += 1;
      }
    }
  });

  if (families.length === 0) problems.push('catalog.txt 里没有解析出任何组合');

  return { catalog: families, size, problems };
}
