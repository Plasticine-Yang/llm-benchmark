import type { CatalogFamily, CatalogModel, Manifest } from '../types.ts';

/** shared-prompt.md 里等待被替换成具体产出目录的占位符。 */
export const TARGET_PLACEHOLDER = '/path/to/target';

/**
 * 拼 prompt 的唯一实现（浏览器和 CLI 共用）：
 *
 *   benchmarks/<project>/prompt.md  +  空行  +  shared-prompt.md（占位符已替换）
 *
 * 顺序按约定固定为「项目 prompt 在前，shared prompt 在后」。
 */
export function composePrompt(input: {
  benchmarkPrompt: string;
  sharedPrompt: string;
  targetPath: string;
}): string {
  const shared = input.sharedPrompt.split(TARGET_PLACEHOLDER).join(input.targetPath).trim();
  return `${input.benchmarkPrompt.trim()}\n\n${shared}\n`;
}

export type Choice = {
  project: string;
  family: string;
  model: string;
  harness: string;
};

export type Selection = {
  /** 组合在全集里的键："family/model/harness" */
  key: string;
  benchmarkId: string;
  benchmarkPrompt: string;
  family: CatalogFamily;
  model: CatalogModel;
  harness: string;
  targetPath: string;
  relPath: string;
  /** 该组合在当前项目下是否已经有产出目录 */
  exists: boolean;
};

export function comboKey(choice: Pick<Choice, 'family' | 'model' | 'harness'>): string {
  return `${choice.family}/${choice.model}/${choice.harness}`;
}

/** 由「项目 + 全集里的组合」推出产出目录的绝对路径。 */
export function targetPathFor(manifest: Manifest, choice: Choice): string {
  return [
    manifest.benchmarksRoot,
    choice.project,
    choice.family,
    choice.model,
    choice.harness,
  ].join('/');
}

/** 相对仓库根的展示路径。 */
export function relPathFor(choice: Choice): string {
  return `benchmarks/${choice.project}/${choice.family}/${choice.model}/${choice.harness}`;
}

/**
 * 把选择贴到实际存在的选项上：某层缺失或不合法就回退到该层的第一个可选项。
 *
 * 注意「厂商 / 模型 / harness」三列都来自全集，与当前项目已有的产出无关 ——
 * 所以选出来的组合允许还没有产出目录，这正是跑新组合的入口。
 */
export function resolveChoice(
  manifest: Manifest,
  wanted: Partial<Choice> | null | undefined,
): Choice | null {
  const project =
    manifest.benchmarks.find((item) => item.id === wanted?.project) ?? manifest.benchmarks[0];
  if (!project) return null;

  const family = manifest.catalog.find((item) => item.id === wanted?.family) ?? manifest.catalog[0];
  if (!family) return null;

  const model = family.models.find((item) => item.id === wanted?.model) ?? family.models[0];
  if (!model) return null;

  const harness =
    wanted?.harness && model.harnesses.includes(wanted.harness)
      ? wanted.harness
      : model.harnesses[0];
  if (!harness) return null;

  return { project: project.id, family: family.id, model: model.id, harness };
}

/** 组装出拼 prompt 需要的全部信息。 */
export function selectCombo(manifest: Manifest, choice: Choice): Selection | null {
  const benchmark = manifest.benchmarks.find((item) => item.id === choice.project);
  if (!benchmark) return null;

  const family = manifest.catalog.find((item) => item.id === choice.family);
  if (!family) return null;

  const model = family.models.find((item) => item.id === choice.model);
  if (!model) return null;
  if (!model.harnesses.includes(choice.harness)) return null;

  return {
    key: comboKey(choice),
    benchmarkId: benchmark.id,
    benchmarkPrompt: benchmark.prompt,
    family,
    model,
    harness: choice.harness,
    targetPath: targetPathFor(manifest, choice),
    relPath: relPathFor(choice),
    exists: benchmark.produced.includes(comboKey(choice)),
  };
}

/** 用 manifest 里的内容，把某个组合拼成最终 prompt。 */
export function composeForSelection(manifest: Manifest, selection: Selection): string {
  return composePrompt({
    benchmarkPrompt: selection.benchmarkPrompt,
    sharedPrompt: manifest.sharedPrompt,
    targetPath: selection.targetPath,
  });
}
