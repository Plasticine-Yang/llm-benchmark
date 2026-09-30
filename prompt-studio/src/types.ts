/** 全集里的一个模型：<family>/<model>，带它可用的 harness 列表。 */
export type CatalogModel = {
  /** 具体模型名，例如 astra、5-6-sol、v41-flash */
  id: string;
  harnesses: string[];
};

export type CatalogFamily = {
  /** 厂商 / 系列，例如 gpt、deepseek、glm、grok、seed */
  id: string;
  models: CatalogModel[];
};

/** 一个「模型 + harness」的产出目录：benchmarks/<project>/<family>/<model>/<harness> */
export type Harness = {
  /** 绝对产出路径；拼 prompt 时会替换 shared-prompt.md 里的 /path/to/target */
  targetPath: string;
  /** 相对仓库根的路径，便于展示 */
  relPath: string;
  /** 这个组合在当前项目下是否已经有产出目录 */
  exists: boolean;
};

export type Benchmark = {
  id: string;
  promptPath: string;
  prompt: string;
  /** 该项目已有的产出，元素形如 "gpt/astra/codex" */
  produced: string[];
};

export type Manifest = {
  repoRoot: string;
  benchmarksRoot: string;
  catalogPath: string;
  sharedPromptPath: string;
  sharedPrompt: string;
  /** 组合全集：厂商 → 模型 → harness */
  catalog: CatalogFamily[];
  /** 全集条目总数（各项目产出数不会超过它） */
  catalogSize: number;
  benchmarks: Benchmark[];
  /** 不符合约定的目录，UI 里会提示 */
  warnings: string[];
  scannedAt: string;
};
