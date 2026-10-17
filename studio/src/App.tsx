import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { ComboList } from './components/ComboList';
import type { FilterMode } from './components/ComboList';
import { CopyButton } from './components/CopyButton';
import { Icon } from './components/Icon';
import { NewBenchmarkDialog } from './components/NewBenchmarkDialog';
import { NavPanel } from './components/ProjectList';
import { PreviewPane } from './components/PreviewPane';
import { PromptDocument } from './components/PromptDocument';
import { Toast, useToast } from './components/Toast';
import { TopBar } from './components/TopBar';
import { writeClipboard } from './lib/clipboard';
import { catalogKeys, groupCombos } from './lib/combos';
import type { ComboRow } from './lib/combos';
import { startRun, stopRun, useRuns } from './lib/runs';
import { cx, MOD_KEY } from './lib/text';
import { useTheme } from './lib/theme';
import { composeForSelection, resolveChoice, selectCombo, TARGET_PLACEHOLDER } from './shared/compose';
import type { Choice } from './shared/compose';
import type { RunState } from './shared/launch';
import type { Manifest } from './types';

const STORAGE_KEY = 'bench-studio/selection';
const VIEW_KEY = 'bench-studio/view';
const NAV_KEY = 'bench-studio/nav-collapsed';

function readNavCollapsed(): boolean {
  try {
    return window.localStorage.getItem(NAV_KEY) === '1';
  } catch {
    return false;
  }
}

/** URL hash 里的 ?nav=collapsed/open 优先于本地记忆，方便分享固定布局的链接。 */
function parseNavCollapsed(): boolean | null {
  const query = window.location.hash.split('?')[1] ?? '';
  const value = new URLSearchParams(query).get('nav');
  return value === 'collapsed' ? true : value === 'open' ? false : null;
}

export type View = 'prompt' | 'preview';

/** 视图跟着 hash 的 ?view= 走，没写时用上次的选择。 */
function parseView(): View | null {
  const query = window.location.hash.split('?')[1] ?? '';
  const value = new URLSearchParams(query).get('view');
  return value === 'prompt' || value === 'preview' ? value : null;
}

function readStoredView(): View {
  try {
    const value = window.localStorage.getItem(VIEW_KEY);
    return value === 'preview' ? 'preview' : 'prompt';
  } catch {
    return 'prompt';
  }
}

/** 从 URL hash 读取组合，例如 #/pelican/gpt/astra/codex（方便收藏和分享）。 */
function parseHash(): Partial<Choice> | null {
  const raw = (window.location.hash.split('?')[0] ?? '').replace(/^#\/?/, '').trim();
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
  const [view, setView] = useState<View>(() => parseView() ?? readStoredView());
  const [navCollapsed, setNavCollapsed] = useState<boolean>(() => parseNavCollapsed() ?? readNavCollapsed());
  const [theme, toggleTheme] = useTheme();

  useEffect(() => {
    try {
      window.localStorage.setItem(NAV_KEY, navCollapsed ? '1' : '0');
    } catch {
      /* 隐私模式下写不进去，忽略 */
    }
  }, [navCollapsed]);

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
    const base = `#/${choice.project}/${choice.family}/${choice.model}/${choice.harness}`;
    const hash = view === 'preview' ? `${base}?view=preview` : base;
    if (window.location.hash !== hash) window.history.replaceState(null, '', hash);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(choice));
      window.localStorage.setItem(VIEW_KEY, view);
    } catch {
      /* 隐私模式下写不进去，忽略 */
    }
  }, [choice, view]);

  // 支持手工改 hash / 浏览器前进后退。
  useEffect(() => {
    if (!manifest) return;
    const onHashChange = () => {
      const nextView = parseView();
      if (nextView) setView(nextView);
      const wanted = parseHash();
      if (!wanted) return;
      setChoice((prev) => resolveChoice(manifest, wanted) ?? prev);
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, [manifest]);

  const rescan = useCallback(() => setReloadToken((token) => token + 1), []);

  /** 新建 benchmark 后：记下要选中的项目，重新扫盘，扫完由 resolveChoice 选中它。 */
  const openProject = useCallback((project: string) => {
    setChoice((prev) => (prev ? { ...prev, project } : prev));
    setView('prompt');
    setReloadToken((token) => token + 1);
  }, []);

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
      {manifest && choice && (
        <Studio
          manifest={manifest}
          choice={choice}
          onChoice={setChoice}
          view={view}
          onView={setView}
          onOpenProject={openProject}
          navCollapsed={navCollapsed}
          onToggleNav={() => setNavCollapsed((value) => !value)}
        />
      )}
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

/** 页签右侧：当前所有运行中的产出，点一下跳过去，也能直接停掉。 */
function RunTray({
  runs,
  current,
  onJump,
  onStop,
}: {
  runs: RunState[];
  current: string;
  onJump: (id: string) => void;
  onStop: (id: string) => void;
}) {
  return (
    <div className="run-tray">
      {runs.length > 0 && (
        <details className="tray">
          <summary className="tray-pill">
            <i aria-hidden="true" />
            {runs.length} 个运行中
          </summary>
          <div className="tray-panel">
            {runs.map((item) => {
              const port = Object.values(item.ports)[0];
              return (
                <div key={item.id} className={cx('tray-row', item.id === current && 'is-current')}>
                  <button type="button" className="tray-jump" onClick={() => onJump(item.id)} title="跳到这个产出的预览">
                    <span className={cx('tray-dot', item.phase !== 'running' && 'is-busy')} aria-hidden="true" />
                    <code>{item.id}</code>
                    {port !== undefined && <span className="tray-port">:{port}</span>}
                  </button>
                  <button type="button" className="icon-btn tray-stop" onClick={() => onStop(item.id)} title="停止" aria-label={`停止 ${item.id}`}>
                    <Icon name="stop" size={12} />
                  </button>
                </div>
              );
            })}
          </div>
        </details>
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
  view,
  onView,
  onOpenProject,
  navCollapsed,
  onToggleNav,
}: {
  manifest: Manifest;
  choice: Choice;
  onChoice: (next: Choice) => void;
  view: View;
  onView: (view: View) => void;
  onOpenProject: (project: string) => void;
  navCollapsed: boolean;
  onToggleNav: () => void;
}) {
  const { toast, visible, notify } = useToast();
  const [creating, setCreating] = useState(false);
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<FilterMode>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const copiedTimer = useRef<number | undefined>(undefined);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => () => window.clearTimeout(copiedTimer.current), []);

  const selection = useMemo(() => selectCombo(manifest, choice), [manifest, choice]);
  const { byId: runs, active: activeRuns, refresh: refreshRuns } = useRuns();
  const [busy, setBusy] = useState(false);
  const comboId = selection ? `${selection.benchmarkId}/${selection.key}` : '';
  const benchmark = manifest.benchmarks.find((item) => item.id === choice.project);
  const launch = selection ? benchmark?.launch[selection.key] : undefined;
  const run = comboId ? runs.get(comboId) : undefined;
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

  const runAction = useCallback(
    (action: 'start' | 'stop' | 'restart') => {
      if (!comboId || busy) return;
      setBusy(true);
      void (async () => {
        try {
          if (action !== 'start') await stopRun(comboId);
          if (action !== 'stop') {
            const result = await startRun(comboId);
            if (result.evicted) notify(`同时运行数已满，已停止 ${result.evicted}`);
          }
        } catch (error) {
          notify(error instanceof Error ? error.message : String(error), 'error');
        } finally {
          setBusy(false);
          refreshRuns();
        }
      })();
    },
    [comboId, busy, notify, refreshRuns],
  );

  const stopById = useCallback(
    (id: string) => {
      void stopRun(id)
        .catch((error: unknown) => notify(error instanceof Error ? error.message : String(error), 'error'))
        .finally(refreshRuns);
    },
    [notify, refreshRuns],
  );

  /** 从顶栏的运行列表跳到某个产出。 */
  const jumpTo = useCallback(
    (id: string) => {
      const [project, family, model, harness] = id.split('/');
      if (!project || !family || !model || !harness) return;
      const next = resolveChoice(manifest, { project, family, model, harness });
      if (next) onChoice(next);
      onView('preview');
    },
    [manifest, onChoice, onView],
  );

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

      if (event.key === 'n') {
        event.preventDefault();
        setCreating(true);
        return;
      }

      if (event.key === 'p' || event.key === 'v') {
        event.preventDefault();
        onView(event.key === 'p' ? 'prompt' : 'preview');
        return;
      }

      if (view === 'preview' && launch?.spec === 'process') {
        const running = run && (run.phase === 'running' || run.phase === 'starting' || run.phase === 'setup');
        if (event.key === 'r' && !running) {
          event.preventDefault();
          runAction('start');
          return;
        }
        if (event.key === 's' && running) {
          event.preventDefault();
          runAction('stop');
          return;
        }
      }

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
  }, [copyFull, visibleRows, activeKey, pickRow, pick, manifest, projectIndex, onView, view, launch, run, runAction]);

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
    <main className={cx('workspace', navCollapsed && 'is-nav-collapsed')}>
      <NavPanel
        benchmarks={manifest.benchmarks}
        catalogKeys={keys}
        coverage={coverage}
        activeId={choice.project}
        onPick={(id) => pick({ project: id })}
        onCreate={() => setCreating(true)}
        collapsed={navCollapsed}
        onToggle={onToggleNav}
      >
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
          launch={benchmark?.launch ?? {}}
          runs={runs}
          project={choice.project}
        />
      </NavPanel>

      {creating && (
        <NewBenchmarkDialog
          existing={manifest.benchmarks.map((item) => item.id)}
          onClose={() => setCreating(false)}
          onCreated={(id, chars) => {
            setCreating(false);
            notify(`已创建 benchmarks/${id}/prompt.md · ${chars.toLocaleString('en-US')} 字符`);
            onOpenProject(id);
          }}
        />
      )}

      <section className="column column-doc" aria-label={view === 'prompt' ? 'Prompt' : '预览'}>
        <nav className="doc-tabs" role="tablist" aria-label="视图">
          {(
            [
              ['prompt', 'Prompt', 'P'],
              ['preview', '预览', 'V'],
            ] as const
          ).map(([id, label, key]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={view === id}
              className={cx('doc-tab', view === id && 'is-active')}
              onClick={() => onView(id)}
            >
              {label}
              {id === 'preview' && run && (run.phase === 'running' || run.phase === 'starting' || run.phase === 'setup') && (
                <i className={cx('tab-live', run.phase !== 'running' && 'is-busy')} aria-label="运行中" />
              )}
              <kbd className="kbd">{key}</kbd>
            </button>
          ))}
          <RunTray runs={activeRuns} current={comboId} onJump={jumpTo} onStop={stopById} />
        </nav>

        {selection && view === 'preview' ? (
          <PreviewPane
            key={comboId}
            selection={selection}
            comboId={comboId}
            launch={launch}
            run={run}
            busy={busy}
            projectTitle={benchmark?.title ?? choice.project}
            onStart={() => runAction('start')}
            onStop={() => runAction('stop')}
            onRestart={() => runAction('restart')}
            onReveal={reveal}
            onShowPrompt={() => onView('prompt')}
          />
        ) : selection ? (
          <>
            <div className="doc-scroll">
              <div className="doc-anim" key={`${selection.benchmarkId}:${selection.key}`}>
                <PromptDocument
                  repoRoot={manifest.repoRoot}
                  selection={selection}
                  sharedPrompt={manifest.sharedPrompt}
                  benchmarkTitle={benchmark?.title ?? choice.project}
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
