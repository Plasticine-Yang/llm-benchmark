import { existsSync, mkdirSync, readdirSync, rmdirSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { normalizePrompt, validateProjectId, validatePrompt } from '../src/shared/project.ts';

export type CreateResult =
  | { ok: true; id: string; dir: string; promptPath: string; chars: number }
  | { ok: false; error: string };

/** benchmarks/ 下已有的项目目录名（含还没写 prompt.md 的目录，避免撞名）。 */
export function existingProjects(repoRoot: string): string[] {
  try {
    return readdirSync(join(repoRoot, 'benchmarks'), { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name);
  } catch {
    return [];
  }
}

/**
 * 新建一个 benchmark：创建 benchmarks/<id>/ 并写入 prompt.md。
 * Studio 的「新建 benchmark」弹窗和 `pnpm bench new` 都走这里，只此一处实现。
 * 目录已存在就拒绝，不会覆盖任何已有内容。
 */
export function createBenchmark(repoRoot: string, id: string, prompt: string): CreateResult {
  const idError = validateProjectId(id, existingProjects(repoRoot));
  if (idError) return { ok: false, error: idError };
  const promptError = validatePrompt(prompt);
  if (promptError) return { ok: false, error: promptError };

  const dir = join(repoRoot, 'benchmarks', id);
  const promptPath = join(dir, 'prompt.md');
  const content = normalizePrompt(prompt);
  try {
    // 不带 recursive：目录已存在（比如并发创建）时直接抛错，不会落到别人的目录里
    mkdirSync(dir);
  } catch (error) {
    return {
      ok: false,
      error: existsSync(dir) ? `benchmarks/${id}/ 已经存在` : error instanceof Error ? error.message : String(error),
    };
  }
  try {
    writeFileSync(promptPath, content, { encoding: 'utf8', flag: 'wx' });
  } catch (error) {
    try {
      rmdirSync(dir);
    } catch {
      /* 目录非空就留着，交给人看 */
    }
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
  return { ok: true, id, dir, promptPath: relative(repoRoot, promptPath), chars: content.length };
}
