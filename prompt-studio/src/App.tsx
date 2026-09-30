import { useCallback, useEffect, useMemo, useState } from 'react';
import { CopyButton } from './components/CopyButton';
import { Picker } from './components/Picker';
import type { PickerItem } from './components/Picker';
import { PromptPreview } from './components/PromptPreview';
import { composeForSelection, resolveChoice, selectCombo } from './shared/compose';
import type { Choice } from './shared/compose';
import type { Manifest } from './types';

const STORAGE_KEY = 'prompt-studio/selection';

/** 从 URL hash 读取组合，例如 #/pelican/gpt/astra/codex（方便收藏和分享）。 */
function parseHash(): Partial<Choice> | null {
  const raw = window.location.hash.replace(/^#\/?/, '').trim();
  if (!raw) return null;
  const parts = raw.split('/').filter(Boolean);
  const project = parts[0];
  if (!project) return null;

  // 四层都写全时最准确；只写了项目也能用，其余层回退到第一个可选项。
  const partial: Partial<Choice> = { project };
  if (parts.length >= 4) {
    const family = parts[1];
    const model = parts[2];
    const harness = parts[3];
    if (family) partial.family = family;
    if (model) partial.model = model;
    if (harness) partial.harness = harness;
  }
  return partial;
}

function readStored(): Partial<Choice> | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      const candidate = parsed as Partial<Choice>;
      if (typeof candidate.project === 'string') return candidate;
    }
    return null;
  } catch {
    return null;
  }
}

export function App() {
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [choice, setChoice] = useState<Choice | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    fetch('/api/manifest', { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error(`/api/manifest 返回 HTTP ${response.status}`);
        return (await response.json()) as Manifest;
      })
      .then((data) => {
        setManifest(data);
        setChoice((prev) => resolveChoice(data, prev ?? parseHash() ?? readStored()));
        setLoading(false);
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        setError(cause instanceof Error ? cause.message : String(cause));
        setLoading(false);
      });
    return () => controller.abort();
  }, [reloadToken]);

  // 选中的组合同步到 URL hash 与 localStorage，刷新后保持。
  useEffect(() => {
    if (!choice) return;
    const hash = `#/${choice.project}/${choice.family}/${choice.model}/${choice.harness}`;
    if (window.location.hash !== hash) window.history.replaceState(null, '', hash);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(choice));
    } catch {
      /* 隐私模式下写不进去，忽略 */
    }
  }, [choice]);

  // 支持手工改 hash / 浏览器前进后退。
  useEffect(() => {
    if (!manifest) return;
    const onHashChange = () => {
      const wanted = parseHash();
      if (!wanted) return;
      setChoice((prev) => resolveChoice(manifest, wanted) ?? prev);
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, [manifest]);

  const rescan = useCallback(() => setReloadToken((token) => token + 1), []);

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            PS
          </span>
          <span className="brand-text">
            <span className="brand-title">Prompt Studio</span>
            <span className="brand-sub">
              项目 × 厂商 × 模型 × harness → 可直接粘贴的 prompt
            </span>
          </span>
        </div>
        <div className="topbar-right">
          {manifest && (
            <code className="repo-path" title={manifest.repoRoot}>
              {manifest.repoRoot}
            </code>
          )}
          <button type="button" className="btn btn-ghost" onClick={rescan} disabled={loading}>
            {loading ? '扫描中…' : '重新扫描'}
          </button>
        </div>
      </header>

      {error && <p className="notice notice-error">扫描失败：{error}</p>}
      {!error && !manifest && <p className="notice">正在扫描 benchmarks/ …</p>}
      {manifest && choice && <Studio manifest={manifest} choice={choice} onChoice={setChoice} />}
      {manifest && !choice && (
        <p className="notice notice-error">
          benchmarks/catalog.txt 里没有可用的组合，或 benchmarks/ 下没有带 prompt.md 的项目。
        </p>
      )}
    </div>
  );
}

function Studio({
  manifest,
  choice,
  onChoice,
}: {
  manifest: Manifest;
  choice: Choice;
  onChoice: (next: Choice) => void;
}) {
  const selection = useMemo(() => selectCombo(manifest, choice), [manifest, choice]);
  const prompt = useMemo(
    () => (selection ? composeForSelection(manifest, selection) : ''),
    [manifest, selection],
  );

  const pick = useCallback(
    (patch: Partial<Choice>) => {
      const next = resolveChoice(manifest, { ...choice, ...patch });
      if (next) onChoice(next);
    },
    [manifest, choice, onChoice],
  );

  if (!selection) {
    return <p className="notice notice-error">这个组合已不在全集里，请重新选择。</p>;
  }

  const { family, model, harness } = selection;
  const lineCount = prompt.split('\n').length;

  const projectItems: PickerItem[] = manifest.benchmarks.map((item) => ({
    id: item.id,
    caption: `${item.produced.length}/${manifest.catalogSize}`,
    title: `${item.id}\n已产出 ${item.produced.length} / 全集 ${manifest.catalogSize} 个组合`,
  }));
  const familyItems: PickerItem[] = manifest.catalog.map((item) => ({
    id: item.id,
    caption: `${item.models.length}`,
    title: `${item.id}：${item.models.length} 个模型`,
  }));
  const modelItems: PickerItem[] = family.models.map((item) => ({
    id: item.id,
    caption: `${item.harnesses.length}`,
    title: `${item.id}：${item.harnesses.length} 个 harness`,
  }));
  // harness 列不再显示文件数等信息，只列名字。
  const harnessItems: PickerItem[] = model.harnesses.map((id) => ({ id }));

  const reveal = () => {
    void fetch(`/api/reveal?path=${encodeURIComponent(selection.targetPath)}`).catch(
      () => undefined,
    );
  };

  return (
    <main className="layout">
      <Picker
        title="项目"
        hint={`${manifest.benchmarks.length}`}
        items={projectItems}
        activeId={choice.project}
        onPick={(id) => pick({ project: id })}
      />
      <Picker
        title="厂商"
        hint={`${manifest.catalog.length}`}
        items={familyItems}
        activeId={family.id}
        onPick={(id) => pick({ family: id })}
      />
      <Picker
        title="模型"
        hint={`${family.models.length}`}
        items={modelItems}
        activeId={model.id}
        onPick={(id) => pick({ model: id })}
      />
      <Picker
        title="Harness"
        hint={`${model.harnesses.length}`}
        items={harnessItems}
        activeId={harness}
        onPick={(id) => pick({ harness: id })}
      />

      <section className="panel">
        <header className="panel-head">
          <div className="crumb">
            <span className="crumb-part">{choice.project}</span>
            <span className="crumb-sep">/</span>
            <span className="crumb-part">{family.id}</span>
            <span className="crumb-sep">/</span>
            <span className="crumb-part">{model.id}</span>
            <span className="crumb-sep">/</span>
            <span className="crumb-part is-accent">{harness}</span>
          </div>
          {selection.exists ? (
            <button type="button" className="btn btn-ghost" onClick={reveal}>
              在访达中显示
            </button>
          ) : (
            <span className="badge">此项目还没跑过这个组合</span>
          )}
        </header>

        <div className="path-row">
          <span className="path-label">target</span>
          <code className="path-value">{selection.targetPath}</code>
          <CopyButton text={selection.targetPath} label="复制" />
        </div>

        <div className="meta-row">
          <span className={`badge${selection.exists ? ' badge-filled' : ''}`}>
            {selection.exists ? '已有产出' : '尚无产出目录'}
          </span>
          <span className="meta">
            全集 {manifest.catalogSize} 条 · 本项目已跑 {manifest.benchmarks.find((b) => b.id === choice.project)?.produced.length ?? 0} 条
          </span>
          <span className="meta">
            {prompt.length} 字符 · {lineCount} 行
          </span>
        </div>

        <PromptPreview
          benchmarkId={selection.benchmarkId}
          benchmarkPrompt={selection.benchmarkPrompt}
          sharedPrompt={manifest.sharedPrompt}
          targetPath={selection.targetPath}
        />

        <footer className="panel-foot">
          <CopyButton variant="primary" text={prompt} label="复制完整 Prompt" />
          <CopyButton text={selection.benchmarkPrompt} label="只复制项目 prompt" />
          <CopyButton text={manifest.sharedPrompt} label="只复制 shared-prompt" />
        </footer>

        {manifest.warnings.length > 0 && (
          <details className="warnings">
            <summary>{manifest.warnings.length} 条目录结构提示</summary>
            <ul>
              {manifest.warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          </details>
        )}
      </section>
    </main>
  );
}
