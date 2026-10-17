import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import type { Benchmark, CatalogFamily, Manifest } from '../src/types.ts';
import { readLaunchInfo } from './spec.ts';
import { parseCatalog } from './catalog.ts';
import { findRepoRoot } from './paths.ts';

/** 这些目录只承载依赖或工具，不算产出内容。 */
const IGNORED_DIRS = new Set(['node_modules', '.pnpm-store', '.tools', '.git']);
const IGNORED_FILES = new Set(['.DS_Store']);

function readDir(dir: string) {
  try {
    return readdirSync(dir, { withFileTypes: true });
  } catch {
    return [];
  }
}

/** 子目录名，天然排序，跳过隐藏目录与依赖目录。 */
function listDirs(dir: string): string[] {
  return readDir(dir)
    .filter(
      (entry) => entry.isDirectory() && !entry.name.startsWith('.') && !IGNORED_DIRS.has(entry.name),
    )
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b, 'en'));
}

/** 读 benchmarks/<id>/meta.json 里的展示名；文件不存在、JSON 不合法或 title 为空都回退到目录名。 */
function readBenchmarkTitle(projectDir: string, fallback: string): string {
  const metaPath = join(projectDir, 'meta.json');
  if (!existsSync(metaPath)) return fallback;
  try {
    const parsed = JSON.parse(readFileSync(metaPath, 'utf8')) as unknown;
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      const title = (parsed as { title?: unknown }).title;
      if (typeof title === 'string' && title.trim()) return title.trim();
    }
  } catch {
    /* meta.json 坏了不致命，回退目录名 */
  }
  return fallback;
}

/** 该目录里直接放着的文件（不含子目录里的）。 */
function directFiles(dir: string): string[] {
  return readDir(dir)
    .filter((entry) => !entry.isDirectory() && !IGNORED_FILES.has(entry.name))
    .map((entry) => entry.name);
}

/** 全集的所有 "family/model/harness" 三元组。 */
function catalogTriples(catalog: CatalogFamily[]): string[] {
  const triples: string[] = [];
  for (const family of catalog) {
    for (const model of family.models) {
      for (const harness of model.harnesses) {
        triples.push(`${family.id}/${model.id}/${harness}`);
      }
    }
  }
  return triples;
}

/** 供 /api/reveal 判断路径是否在 benchmarks/ 内。 */
export function isInsideBenchmarks(target: string, repoRoot: string): boolean {
  const rel = relative(join(repoRoot, 'benchmarks'), target);
  return rel === '' || (!rel.startsWith('..') && !rel.startsWith('/'));
}

/**
 * 实时扫描并返回：
 *   * catalog.txt 定义的全集 —— 页面上的「厂商 / 模型 / Harness」三列
 *   * benchmarks/<project>/prompt.md 与该项目已产出的组合 —— 用于显示覆盖度
 *
 * 每次请求都重新扫盘，所以新建目录或改 catalog.txt 后刷新页面即可生效。
 * 层级写错、或出现全集之外的组合，都会进 warnings，不会静默丢掉。
 */
export function scanManifest(startDir: string = process.cwd()): Manifest {
  const repoRoot = findRepoRoot(startDir);
  const benchmarksRoot = join(repoRoot, 'benchmarks');
  const catalogPath = join(benchmarksRoot, 'catalog.txt');
  const sharedPromptPath = join(repoRoot, 'shared-prompt.md');
  const warnings: string[] = [];

  const { catalog, size: catalogSize, problems } = parseCatalog(catalogPath);
  warnings.push(...problems);

  const known = new Set(catalogTriples(catalog));
  const benchmarks: Benchmark[] = [];

  for (const projectId of listDirs(benchmarksRoot)) {
    const projectDir = join(benchmarksRoot, projectId);
    const promptPath = join(projectDir, 'prompt.md');
    if (!existsSync(promptPath)) {
      warnings.push(`benchmarks/${projectId}/ 缺少 prompt.md，已跳过`);
      continue;
    }

    const produced: string[] = [];
    const launch: Benchmark['launch'] = {};

    for (const family of listDirs(projectDir)) {
      const familyDir = join(projectDir, family);

      const strayInFamily = directFiles(familyDir);
      if (strayInFamily.length > 0) {
        warnings.push(
          `benchmarks/${projectId}/${family}/ 直接放了 ${strayInFamily.length} 个文件，缺 <model>/<harness> 层级`,
        );
      }

      for (const model of listDirs(familyDir)) {
        const modelDir = join(familyDir, model);

        const strayInModel = directFiles(modelDir);
        if (strayInModel.length > 0) {
          warnings.push(
            `benchmarks/${projectId}/${family}/${model}/ 直接放了 ${strayInModel.length} 个文件，缺 harness 层级`,
          );
        }

        for (const harness of listDirs(modelDir)) {
          const triple = `${family}/${model}/${harness}`;
          produced.push(triple);
          launch[triple] = readLaunchInfo(join(modelDir, harness));
          if (!known.has(triple)) {
            warnings.push(`benchmarks/${projectId}/${triple}/ 不在 catalog.txt 的全集里`);
          }
        }
      }
    }

    benchmarks.push({
      id: projectId,
      title: readBenchmarkTitle(projectDir, projectId),
      promptPath,
      prompt: readFileSync(promptPath, 'utf8'),
      produced,
      launch,
    });
  }

  return {
    repoRoot,
    benchmarksRoot,
    catalogPath,
    sharedPromptPath,
    sharedPrompt: readFileSync(sharedPromptPath, 'utf8'),
    catalog,
    catalogSize,
    benchmarks,
    warnings,
    scannedAt: new Date().toISOString(),
  };
}
