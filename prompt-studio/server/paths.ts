import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

/**
 * 从任意起点向上找到仓库根：同时含有 benchmarks/ 与 shared-prompt.md 的目录。
 * 这样 prompt-studio 从哪个 cwd 启动都能定位到数据。
 */
export function findRepoRoot(start: string): string {
  let dir = resolve(start);
  for (;;) {
    if (existsSync(resolve(dir, 'benchmarks')) && existsSync(resolve(dir, 'shared-prompt.md'))) {
      return dir;
    }
    const parent = dirname(dir);
    if (parent === dir) {
      throw new Error(
        `找不到仓库根（需要同时存在 benchmarks/ 和 shared-prompt.md），起点：${resolve(start)}`,
      );
    }
    dir = parent;
  }
}
