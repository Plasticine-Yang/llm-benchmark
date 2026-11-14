import type { CatalogFamily } from '../types.ts';

/**
 * catalog.txt 的编辑规则。浏览器（管理界面的实时校验）和 Vite 插件共用，只能依赖纯 TS。
 *
 * 厂商 / 模型 / harness 三段都会成为产出目录名，所以 id 规则与目录名规则一致：
 * 字母或数字开头，后接字母、数字、.、_、-。
 */

export const CATALOG_ID_MAX = 64;
export const CATALOG_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;

/** 校验一个厂商 / 模型 / harness id，合法时返回 null。existing 用于查重。 */
export function validateCatalogId(
  id: string,
  label: string,
  existing: Iterable<string> = [],
): string | null {
  if (!id) return `${label}不能为空`;
  if (id.length > CATALOG_ID_MAX) return `${label}最长 ${CATALOG_ID_MAX} 个字符`;
  if (!CATALOG_ID_PATTERN.test(id)) {
    return `${label}只能用字母、数字和 . _ -，并以字母或数字开头（会成为目录名）`;
  }
  for (const item of existing) {
    if (item === id) return `${label}「${id}」已存在`;
  }
  return null;
}

/** 校验一个模型的 harness 列表：非空、每项合法、不重复。 */
export function validateHarnesses(harnesses: string[]): string | null {
  if (harnesses.length === 0) return '至少要保留一个 harness';
  const seen = new Set<string>();
  for (const harness of harnesses) {
    const error = validateCatalogId(harness, 'harness 名');
    if (error) return error;
    if (seen.has(harness)) return `harness「${harness}」重复了`;
    seen.add(harness);
  }
  return null;
}

/** 对 catalog.txt 的一次编辑。改动的只有清单本身，产出目录不会被触碰。 */
export type CatalogOp =
  | { type: 'add-family'; family: string; model: string; harnesses: string[] }
  | { type: 'rename-family'; family: string; to: string }
  | { type: 'remove-family'; family: string }
  | { type: 'move-family'; family: string; dir: -1 | 1 }
  | { type: 'add-model'; family: string; model: string; harnesses: string[] }
  | { type: 'rename-model'; family: string; model: string; to: string }
  | { type: 'remove-model'; family: string; model: string }
  | { type: 'move-model'; family: string; model: string; dir: -1 | 1 }
  | { type: 'set-harnesses'; family: string; model: string; harnesses: string[] };

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(isString);
}

function isDir(value: unknown): value is -1 | 1 {
  return value === -1 || value === 1;
}

/** 把请求体解析成 CatalogOp；形状不对返回 null（具体合法性由 applyOp 再校验）。 */
export function parseCatalogOp(body: unknown): CatalogOp | null {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return null;
  const op = body as Record<string, unknown>;
  switch (op.type) {
    case 'add-family':
      return isString(op.family) && isString(op.model) && isStringArray(op.harnesses)
        ? { type: 'add-family', family: op.family, model: op.model, harnesses: op.harnesses }
        : null;
    case 'rename-family':
      return isString(op.family) && isString(op.to)
        ? { type: 'rename-family', family: op.family, to: op.to }
        : null;
    case 'remove-family':
      return isString(op.family) ? { type: 'remove-family', family: op.family } : null;
    case 'move-family':
      return isString(op.family) && isDir(op.dir)
        ? { type: 'move-family', family: op.family, dir: op.dir }
        : null;
    case 'add-model':
      return isString(op.family) && isString(op.model) && isStringArray(op.harnesses)
        ? { type: 'add-model', family: op.family, model: op.model, harnesses: op.harnesses }
        : null;
    case 'rename-model':
      return isString(op.family) && isString(op.model) && isString(op.to)
        ? { type: 'rename-model', family: op.family, model: op.model, to: op.to }
        : null;
    case 'remove-model':
      return isString(op.family) && isString(op.model)
        ? { type: 'remove-model', family: op.family, model: op.model }
        : null;
    case 'move-model':
      return isString(op.family) && isString(op.model) && isDir(op.dir)
        ? { type: 'move-model', family: op.family, model: op.model, dir: op.dir }
        : null;
    case 'set-harnesses':
      return isString(op.family) && isString(op.model) && isStringArray(op.harnesses)
        ? { type: 'set-harnesses', family: op.family, model: op.model, harnesses: op.harnesses }
        : null;
    default:
      return null;
  }
}

/** 全集里出现过的 harness，按被多少模型使用排序（建议列表用）。 */
export function harnessUniverse(catalog: CatalogFamily[]): Array<{ id: string; count: number }> {
  const counts = new Map<string, number>();
  for (const family of catalog) {
    for (const model of family.models) {
      for (const harness of model.harnesses) {
        counts.set(harness, (counts.get(harness) ?? 0) + 1);
      }
    }
  }
  return [...counts.entries()]
    .map(([id, count]) => ({ id, count }))
    .sort((a, b) => b.count - a.count || a.id.localeCompare(b.id, 'en'));
}