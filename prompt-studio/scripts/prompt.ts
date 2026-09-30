import { composeForSelection, selectCombo } from '../src/shared/compose.ts';
import { scanManifest } from '../server/scan.ts';
import type { Manifest } from '../src/types.ts';

/**
 * 用法：
 *   pnpm prompt                                       列出全集里的全部组合
 *   pnpm prompt <project> <family> <model> <harness>   输出某个组合的完整 prompt
 *   pnpm prompt <project> <family>/<model> <harness>   同上，模型可合并写
 *
 * 例：pnpm prompt pelican gpt astra codex
 */
function usage(manifest: Manifest, code: number): never {
  const lines = [
    '用法: pnpm prompt <project> <family> <model> <harness>',
    '     pnpm prompt <project> <family>/<model> <harness>',
    '',
    `项目（组合全集 ${manifest.catalogSize} 条，来自 benchmarks/catalog.txt）:`,
    '',
  ];
  for (const benchmark of manifest.benchmarks) {
    lines.push(`  ${benchmark.id}  已跑 ${benchmark.produced.length}/${manifest.catalogSize}`);
  }
  lines.push('', '全集组合:');
  for (const family of manifest.catalog) {
    for (const model of family.models) {
      for (const harness of model.harnesses) {
        lines.push(`  pnpm prompt <project> ${family.id} ${model.id} ${harness}`);
      }
    }
  }
  console.error(lines.join('\n'));
  process.exit(code);
}

/** 解析位置参数 → 项目 + 全集里的组合。 */
function parseArgs(
  args: string[],
): { project: string; family: string; model: string; harness: string } | null {
  const [project, ...rest] = args;
  if (!project) return null;

  if (rest.length === 3) {
    const [family, model, harness] = rest;
    if (!family || !model || !harness) return null;
    return { project, family, model, harness };
  }

  if (rest.length === 2) {
    const [familyModel, harness] = rest;
    if (!familyModel || !harness) return null;
    const segments = familyModel.split('/').filter(Boolean);
    if (segments.length !== 2) return null;
    const [family, model] = segments as [string, string];
    return { project, family, model, harness };
  }

  return null;
}

const manifest = scanManifest();
const args = process.argv.slice(2).filter(Boolean);

if (args.length === 0) usage(manifest, 1);

const parsed = parseArgs(args);
if (!parsed) usage(manifest, 1);

const selection = selectCombo(manifest, parsed);
if (!selection) {
  console.error(
    `找不到组合: ${parsed.project} / ${parsed.family} / ${parsed.model} / ${parsed.harness}\n` +
      '（项目和组合必须分别存在于 benchmarks/ 与 catalog.txt 中）\n',
  );
  usage(manifest, 1);
}

if (!selection.exists) {
  console.error(`注意: ${selection.relPath}/ 还没有产出目录，target 就指向该路径。\n`);
}

process.stdout.write(composeForSelection(manifest, selection));
