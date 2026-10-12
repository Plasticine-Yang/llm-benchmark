import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { ComboList } from './components/ComboList';
import type { FilterMode } from './components/ComboList';
import { CopyButton } from './components/CopyButton';
import { Icon } from './components/Icon';
import { ProjectList } from './components/ProjectList';
import { PromptDocument } from './components/PromptDocument';
import { Toast, useToast } from './components/Toast';
import { TopBar } from './components/TopBar';
import { writeClipboard } from './lib/clipboard';
import { catalogKeys, groupCombos } from './lib/combos';
import type { ComboRow } from './lib/combos';
import { MOD_KEY } from './lib/text';
import { useTheme } from './lib/theme';
import { composeForSelection, resolveChoice, selectCombo, TARGET_PLACEHOLDER } from './shared/compose';
import type { Choice } from './shared/compose';
import type { Manifest } from './types';

const STORAGE_KEY = 'prompt-studio/selection';

/** 从 URL hash 读取组合，例如 #/pelican/gpt/astra/codex（方便收藏和分享）。 */
function parseHash(): Partial<Choice> | null {
  const raw = window.location.hash.replace(/^#\/?/, '').trim();
  if (!raw) return null;
  const parts = raw.split('/').filter(Boolean).map((part) => decodeURIComponent(part));
  const project = parts[0];
  if (!project) return null;

  // 四层都写全时最准确；只写了项目也能用，其余层回退到第一个可选项。
  const partial: Partial<Choice> = { project };
  if (parts.length >= 4) {
    const [, family, model, harness] = parts;
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

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
}

export function App() {
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [choice, setChoice] = useState<Choice | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [reloadToken, setReloadToken] = useState(0);
  const [theme, toggleTheme] = useTheme();

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
      <TopBar
        manifest={manifest}
        loading={loading}
        theme={theme}
        onToggleTheme={toggleTheme}
        onRescan={rescan}
      />

      {error && (
        <State tone="error" title="扫描失败" detail={error}>
          <button type="button" className="btn" onClick={rescan}>
            <Icon name="refresh" size={14} />
            <span className="btn-label">重试</span>
          </button>
        </State>
      )}
      {!error && !manifest && <State tone="loading" title="正在扫描 benchmarks/ …" />}
      {manifest && choice && <Studio manifest={manifest} choice={choice} onChoice={setChoice} />}
      {manifest && !choice && (
        <State
          tone="error"
          title="没有可用的组合"
          detail="benchmarks/catalog.txt 里没有可用的组合，或 benchmarks/ 下没有带 prompt.md 的项目。"
        />
      )}
    </div>
  );
}

function State({
  tone,
  title,
  detail,
  children,
}: {
  tone: 'error' | 'loading';
  title: string;
  detail?: string;
  children?: ReactNode;
}) {
  return (
    <div className={`state state-${tone}`}>
      <div className="state-card">
        {tone === 'loading' ? <span className="state-spinner" aria-hidden="true" /> : <Icon name="alert" size={18} />}
        <p className="state-title">{title}</p>
        {detail && <p className="state-detail">{detail}</p>}
        {children}
      </div>
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
  const { toast, visible, notify } = useToast();
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<FilterMode>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const copiedTimer = useRef<number | undefined>(undefined);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => () => window.clearTimeout(copiedTimer.current), []);

  const selection = useMemo(() => selectCombo(manifest, choice), [manifest, choice]);
  const prompt = useMemo(
    () => (selection ? composeForSelection(manifest, selection) : ''),
    [manifest, selection],
  );

  const keys = useMemo(() => catalogKeys(manifest.catalog), [manifest]);

  // 只统计全集内的产出：清单外的目录会在顶栏的扫描提示里单独列出。
  const coverage = useMemo(() => {
    const known = new Set(keys);
    const map = new Map<string, Set<string>>();
    for (const benchmark of manifest.benchmarks) {
      map.set(benchmark.id, new Set(benchmark.produced.filter((key) => known.has(key))));
    }
    return map;
  }, [manifest, keys]);

  const done = useMemo(() => coverage.get(choice.project) ?? new Set<string>(), [coverage, choice.project]);

  const groups = useMemo(
    () =>
      groupCombos(manifest.catalog, query, (key) =>
        mode === 'all' ? true : mode === 'done' ? done.has(key) : !done.has(key),
      ),
    [manifest, query, mode, done],
  );
  const visibleRows = useMemo(() => groups.flatMap((group) => group.rows), [groups]);

  const pick = useCallback(
    (patch: Partial<Choice>) => {
      const next = resolveChoice(manifest, { ...choice, ...patch });
      if (next) onChoice(next);
    },
    [manifest, choice, onChoice],
  );

  const pickRow = useCallback(
    (row: ComboRow) => pick({ family: row.family, model: row.model, harness: row.harness }),
    [pick],
  );

  const copy = useCallback(
    (id: string, text: string, message: string) => {
      void (async () => {
        const ok = await writeClipboard(text);
        if (!ok) {
          notify('复制失败，请手动选择文本', 'error');
          return;
        }
        setCopiedId(id);
        window.clearTimeout(copiedTimer.current);
        copiedTimer.current = window.setTimeout(() => setCopiedId(null), 1600);
        notify(message);
      })();
    },
    [notify],
  );

  const copyFull = useCallback(() => {
    if (!prompt) return;
    copy('full', prompt, `已复制完整 prompt · ${prompt.length.toLocaleString('en-US')} 字符`);
  }, [copy, prompt]);

  const activeKey = selection?.key ?? '';
  const projectIndex = manifest.benchmarks.findIndex((item) => item.id === choice.project);

  // 键盘：↑↓ 切组合，←→ 切项目，/ 聚焦筛选，⌘/Ctrl + ↵ 复制完整 prompt。
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
        event.preventDefault();
        copyFull();
        return;
      }
      if (event.metaKey || event.ctrlKey || event.altKey) return;

      const typing = isTypingTarget(event.target);
      const inSearch = event.target === searchRef.current;

      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        if (typing && !inSearch) return;
        if (visibleRows.length === 0) return;
        event.preventDefault();
        const current = visibleRows.findIndex((row) => row.key === activeKey);
        const step = event.key === 'ArrowDown' ? 1 : -1;
        const nextIndex =
          current === -1
            ? step > 0
              ? 0
              : visibleRows.length - 1
            : (current + step + visibleRows.length) % visibleRows.length;
        const next = visibleRows[nextIndex];
        if (next) pickRow(next);
        return;
      }

      if (typing) return;

      if (event.key === '/') {
        event.preventDefault();
        searchRef.current?.focus();
        searchRef.current?.select();
        return;
      }

      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        const total = manifest.benchmarks.length;
        if (total === 0) return;
        event.preventDefault();
        const step = event.key === 'ArrowRight' ? 1 : -1;
        const next = manifest.benchmarks[(Math.max(projectIndex, 0) + step + total) % total];
        if (next) pick({ project: next.id });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [copyFull, visibleRows, activeKey, pickRow, pick, manifest, projectIndex]);

  const reveal = useCallback(() => {
    if (!selection) return;
    fetch(`/api/reveal?path=${encodeURIComponent(selection.targetPath)}`)
      .then(async (response) => {
        if (response.ok) return;
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        notify(body?.error ?? `访达打开失败（HTTP ${response.status}）`, 'error');
      })
      .catch(() => notify('访达打开失败', 'error'));
  }, [selection, notify]);

  const lineCount = prompt ? prompt.replace(/\n$/, '').split('\n').length : 0;

  return (
    <main className="workspace">
      <ProjectList
        benchmarks={manifest.benchmarks}
        catalogKeys={keys}
        coverage={coverage}
        activeId={choice.project}
        onPick={(id) => pick({ project: id })}
      />

      <ComboList
        groups={groups}
        activeKey={activeKey}
        done={done}
        total={keys.length}
        doneCount={done.size}
        query={query}
        onQuery={setQuery}
        mode={mode}
        onMode={setMode}
        searchRef={searchRef}
        onPick={pickRow}
      />

      <section className="column column-doc" aria-label="Prompt">
        {selection ? (
          <>
            <div className="doc-scroll">
              <div className="doc-anim" key={`${selection.benchmarkId}:${selection.key}`}>
                <PromptDocument
                  repoRoot={manifest.repoRoot}
                  selection={selection}
                  sharedPrompt={manifest.sharedPrompt}
                  projectIndex={Math.max(projectIndex, 0)}
                  projectTotal={manifest.benchmarks.length}
                  doneCount={done.size}
                  total={keys.length}
                  copiedId={copiedId}
                  onCopy={copy}
                  onReveal={reveal}
                />
              </div>
            </div>

            <footer className="dock">
              <div className="dock-stats">
                <span>
                  <b>{prompt.length.toLocaleString('en-US')}</b> 字符
                </span>
                <span className="dock-dot" aria-hidden="true" />
                <span>
                  <b>{lineCount}</b> 行
                </span>
              </div>
              <div className="dock-actions">
                <CopyButton
                  size="sm"
                  label="题目 prompt"
                  copied={copiedId === 'benchmark'}
                  onClick={() =>
                    copy('benchmark', selection.benchmarkPrompt, '已复制题目 prompt（原文）')
                  }
                  title={`只复制 benchmarks/${selection.benchmarkId}/prompt.md 原文`}
                />
                <CopyButton
                  size="sm"
                  label="shared-prompt"
                  copied={copiedId === 'shared'}
                  onClick={() => copy('shared', manifest.sharedPrompt, '已复制 shared-prompt（原文）')}
                  title={`只复制 shared-prompt.md 原文（保留 ${TARGET_PLACEHOLDER} 占位符）`}
                />
                <CopyButton
                  variant="primary"
                  label="复制完整 Prompt"
                  copied={copiedId === 'full'}
                  onClick={copyFull}
                  kbd={[MOD_KEY, '↵']}
                  title="题目 prompt + 空行 + 替换好路径的 shared-prompt"
                />
              </div>
            </footer>
          </>
        ) : (
          <State tone="error" title="这个组合已不在全集里" detail="请在左侧重新选择。" />
        )}
        <Toast toast={toast} visible={visible} />
      </section>
    </main>
  );
}
