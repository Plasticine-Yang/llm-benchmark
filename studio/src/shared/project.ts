/**
 * 新建 benchmark 项目的命名规则。浏览器（新建弹窗的实时校验）、Vite 插件和 CLI 共用，只能依赖纯 TS。
 *
 * 一个 benchmark 就是 benchmarks/<id>/prompt.md，id 即目录名。
 */

export const PROJECT_ID_MAX = 64;
/** 小写字母 / 数字，用单个连字符分隔：rainy-night-convenience-store */
export const PROJECT_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
/** prompt.md 的大小上限，防止误粘贴巨型内容。 */
export const PROMPT_MAX_CHARS = 200_000;

/** 校验项目 id，合法时返回 null，否则返回给人看的原因。existing 用于查重。 */
export function validateProjectId(id: string, existing: Iterable<string> = []): string | null {
  if (!id) return '项目名不能为空';
  if (id.length > PROJECT_ID_MAX) return `项目名最长 ${PROJECT_ID_MAX} 个字符`;
  if (!PROJECT_ID_PATTERN.test(id)) return '只能用小写字母、数字和单个连字符，例如 rainy-night-store';
  for (const item of existing) {
    if (item === id) return `benchmarks/${id}/ 已经存在`;
  }
  return null;
}

/** 校验 prompt 正文，合法时返回 null。 */
export function validatePrompt(prompt: string): string | null {
  if (!prompt.trim()) return 'prompt 不能为空';
  if (prompt.length > PROMPT_MAX_CHARS) return `prompt 超过 ${PROMPT_MAX_CHARS.toLocaleString('en-US')} 字符`;
  return null;
}

/** 写入 prompt.md 前的规范化：统一换行、去掉首尾空白，末尾留一个换行。 */
export function normalizePrompt(prompt: string): string {
  return `${prompt.replace(/\r\n?/g, '\n').trim()}\n`;
}

/**
 * 从 prompt 首行推一个项目名候选：只在首行是英文标题时有效（现有英文题目都是这种写法），
 * 中文题目推不出来就返回空串，交给人起名。
 */
export function suggestProjectId(prompt: string): string {
  const firstLine = prompt.split(/\r?\n/).find((line) => line.trim())?.trim() ?? '';
  const title = firstLine.replace(/^#+\s*/, '').split(':')[0] ?? '';
  const slug = title
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  // 至少要有一半是 ASCII 字母数字，才算「首行是英文标题」
  const ascii = title.replace(/[^A-Za-z0-9]/g, '').length;
  const visible = title.replace(/\s/g, '').length;
  if (!slug || visible === 0 || ascii / visible < 0.5) return '';
  return slug.slice(0, PROJECT_ID_MAX).replace(/-+$/, '');
}
