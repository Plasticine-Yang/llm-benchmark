import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';
import { mutateCatalog, undoCatalog } from '../lib/catalog-api';
import type { CatalogMutation } from '../lib/catalog-api';
import { cx, isTypingTarget, pad2 } from '../lib/text';
import { writeClipboard } from '../lib/clipboard';
import type { CatalogOp } from '../shared/catalog';
import { harnessUniverse, validateCatalogId } from '../shared/catalog';
import type { CatalogFamily, CatalogModel, Manifest } from '../types';
import { AddEntryDialog, ConfirmDialog } from './CatalogDialogs';
import { Icon } from './Icon';
import { Toast, useToast } from './Toast';

type FilterMode = 'all' | 'produced' | 'empty';

type RenameTarget =
  | { kind: 'family'; family: string }
  | { kind: 'model'; family: string; model: string };

type DialogState =
  | { kind: 'add-family' }
  | { kind: 'add-model'; family: string }
  | {
      kind: 'confirm';
      title: string;
      lines: ReactNode[];
      confirmLabel: string;
      op: CatalogOp;
      message: string;
    };

const MODES: Array<{ id: FilterMode; label: string }> = [
  { id: 'all', label: '全部' },
  { id: 'produced', label: '有产出' },
  { id: 'empty', label: '未产出' },
];

/** 行内改名输入框：Enter 提交，Esc 取消，失焦时合法就提交、否则还原并提示。 */
function RenameInput({
  initial,
  label,
  validate,
  onCommit,
  onCancel,
  onInvalid,
}: {
  initial: string;
  label: string;
  validate: (value: string) => string | null;
  onCommit: (value: string) => void;
  onCancel: () => void;
  onInvalid: (message: string) => void;
}) {
  const [value, setValue] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    ref.current?.focus();
    ref.current?.select();
  }, []);

  const commit = () => {
    const next = value.trim();
    if (next === initial) {
      onCancel();
      return;
    }
    const invalid = validate(next);
    if (invalid) {
      setError(invalid);
      return false;
    }
    onCommit(next);
    return true;
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    event.stopPropagation();
    if (event.key === 'Enter') {
      event.preventDefault();
      commit();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      onCancel();
    }
  };

  return (
    <span className="cat-rename">
      <input
        ref={ref}
        className={cx('cat-rename-input', error && 'is-invalid')}
        value={value}
        aria-label={label}
        aria-invalid={error ? true : undefined}
        spellCheck={false}
        autoComplete="off"
        onChange={(event) => {
          setValue(event.target.value);
          if (error) setError(null);
        }}
        onKeyDown={onKeyDown}
        onBlur={() => {
          const next = value.trim();
          if (next === initial) {
            onCancel();
            return;
          }
          const invalid = validate(next);
          if (invalid) {
            onInvalid(invalid);
            onCancel();
          } else {
            onCommit(next);
          }
        }}
      />
      {error && <span className="cat-rename-error">{error}</span>}
    </span>
  );
}

/** 行内「+ harness」：输入 + 现有 harness 点选，可以连续加多个。 */
function HarnessAdder({
  existing,
  suggestions,
  busy,
  onAdd,
  onClose,
}: {
  existing: string[];
  suggestions: string[];
  busy: boolean;
  onAdd: (name: string) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    ref.current?.focus();
  }, []);

  const commit = (raw: string): boolean => {
    const name = raw.trim().replace(/,+$/, '');
    if (!name || busy) return false;
    const invalid = validateCatalogId(name, 'harness 名');
    if (invalid) {
      setError(invalid);
      return false;
    }
    if (existing.includes(name)) {
      setError(`这个模型已经有「${name}」了`);
      return false;
    }
    setError(null);
    setDraft('');
    onAdd(name);
    return true;
  };

  return (
    <span className="cat-adder">
      <span className="cat-adder-box">
        <Icon name="plus" size={11} />
        <input
          ref={ref}
          className="cat-adder-input"
          value={draft}
          placeholder="harness 名，回车添加"
          spellCheck={false}
          autoComplete="off"
          aria-label="新增 harness"
          onChange={(event) => {
            setDraft(event.target.value);
            if (error) setError(null);
          }}
          onKeyDown={(event) => {
            event.stopPropagation();
            if (event.key === 'Enter' || event.key === ',') {
              event.preventDefault();
              commit(draft);
            } else if (event.key === 'Escape') {
              event.preventDefault();
              onClose();
            }
          }}
          onBlur={() => {
            if (draft.trim()) commit(draft);
            onClose();
          }}
        />
      </span>
      {suggestions.length > 0 && (
        <span className="cat-adder-suggestions">
          {suggestions.map((name) => (
            <button
              key={name}
              type="button"
              className="hp-suggest"
              disabled={busy}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                setError(null);
                onAdd(name);
                ref.current?.focus();
              }}
            >
              <Icon name="plus" size={10} />
              {name}
            </button>
          ))}
        </span>
      )}
      {error && <span className="cat-rename-error">{error}</span>}
    </span>
  );
}

export function CatalogManager({
  manifest,
  onCatalogChange,
  onExit,
}: {
  manifest: Manifest;
  onCatalogChange: (result: CatalogMutation) => void;
  onExit: () => void;
}) {
  const { toast, visible, notify } = useToast();
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<FilterMode>('all');
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const [renaming, setRenaming] = useState<RenameTarget | null>(null);
  const [adding, setAdding] = useState<{ family: string; model: string } | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const flashTimer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(flashTimer.current), []);

  const catalog = manifest.catalog;

  /** 每个组合键有多少个项目已经产出（跨项目计数）。 */
  const producedCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const benchmark of manifest.benchmarks) {
      for (const key of benchmark.produced) {
        counts.set(key, (counts.get(key) ?? 0) + 1);
      }
    }
    return counts;
  }, [manifest.benchmarks]);

  const modelProduced = useCallback(
    (family: string, model: CatalogModel) =>
      model.harnesses.reduce((sum, harness) => sum + (producedCounts.get(`${family}/${model.id}/${harness}`) ?? 0), 0),
    [producedCounts],
  );

  const familyProduced = useCallback(
    (family: CatalogFamily) => family.models.reduce((sum, model) => sum + modelProduced(family.id, model), 0),
    [modelProduced],
  );

  const universe = useMemo(() => harnessUniverse(catalog), [catalog]);
  const suggestions = useMemo(() => universe.map((item) => item.id), [universe]);

  const stats = useMemo(() => {
    const models = catalog.reduce((sum, family) => sum + family.models.length, 0);
    const producedModels = catalog.reduce(
      (sum, family) => sum + family.models.filter((model) => modelProduced(family.id, model) > 0).length,
      0,
    );
    const known = new Set(
      catalog.flatMap((family) =>
        family.models.flatMap((model) => model.harnesses.map((harness) => `${family.id}/${model.id}/${harness}`)),
      ),
    );
    const producedCombos = [...producedCounts.keys()].filter((key) => known.has(key)).length;
    return { families: catalog.length, models, combos: manifest.catalogSize, producedModels, producedCombos };
  }, [catalog, manifest.catalogSize, modelProduced, producedCounts]);

  const tokens = useMemo(() => query.trim().toLowerCase().split(/\s+/).filter(Boolean), [query]);
  const filtered = tokens.length > 0 || mode !== 'all';

  const groups = useMemo(() => {
    const match = (...parts: string[]) => {
      const haystack = parts.join('/').toLowerCase();
      return tokens.every((token) => haystack.includes(token));
    };
    return catalog
      .map((family) => {
        const familyHit = tokens.length === 0 || match(family.id);
        const models = family.models.filter((model) => {
          const hit =
            familyHit ||
            match(family.id, model.id) ||
            model.harnesses.some((harness) => match(family.id, model.id, harness));
          if (!hit) return false;
          const produced = modelProduced(family.id, model) > 0;
          return mode === 'all' || (mode === 'produced' ? produced : !produced);
        });
        return { family, models };
      })
      .filter((group) => group.models.length > 0);
  }, [catalog, tokens, mode, modelProduced]);

  const undo = useCallback(async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    try {
      const result = await undoCatalog();
      onCatalogChange(result);
      notify('已撤销上一步改动');
    } catch (error) {
      notify(error instanceof Error ? error.message : String(error), 'error');
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }, [notify, onCatalogChange]);

  const runOp = useCallback(
    async (op: CatalogOp, message: string): Promise<string | null> => {
      if (busyRef.current) return '正在写入，请稍候';
      busyRef.current = true;
      setBusy(true);
      try {
        const result = await mutateCatalog(op);
        onCatalogChange(result);
        notify(message, 'ok', { label: '撤销', onClick: () => void undo() });
        return null;
      } catch (error) {
        const text = error instanceof Error ? error.message : String(error);
        notify(text, 'error');
        return text;
      } finally {
        busyRef.current = false;
        setBusy(false);
      }
    },
    [notify, onCatalogChange, undo],
  );

  const flashFamily = useCallback((family: string) => {
    setFlash(family);
    window.clearTimeout(flashTimer.current);
    flashTimer.current = window.setTimeout(() => setFlash(null), 1600);
    requestAnimationFrame(() => {
      bodyRef.current
        ?.querySelector(`[data-family="${CSS.escape(family)}"]`)
        ?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    });
  }, []);

  const addHarness = useCallback(
    (family: CatalogFamily, model: CatalogModel, name: string) => {
      if (model.harnesses.includes(name)) return;
      void runOp(
        { type: 'set-harnesses', family: family.id, model: model.id, harnesses: [...model.harnesses, name] },
        `已给 ${family.id}/${model.id} 加上 ${name}`,
      );
    },
    [runOp],
  );

  const removeHarness = useCallback(
    (family: CatalogFamily, model: CatalogModel, harness: string) => {
      const produced = producedCounts.get(`${family.id}/${model.id}/${harness}`) ?? 0;
      const op: CatalogOp = {
        type: 'set-harnesses',
        family: family.id,
        model: model.id,
        harnesses: model.harnesses.filter((item) => item !== harness),
      };
      const message = `已从 ${family.id}/${model.id} 移除 ${harness}`;
      if (produced > 0) {
        setDialog({
          kind: 'confirm',
          title: `移除 harness「${harness}」？`,
          lines: [
            <>
              <code>{family.id}/{model.id}</code> 将不再包含 <code>{harness}</code>。
            </>,
            <>
              {produced} 个项目已有这个组合的产出，移除后会变成清单外组合（顶栏扫描提示里列出），
              <b>产出目录不会被删除</b>。
            </>,
          ],
          confirmLabel: '移除',
          op,
          message,
        });
      } else {
        void runOp(op, message);
      }
    },
    [producedCounts, runOp],
  );

  const removeFamily = useCallback(
    (family: CatalogFamily) => {
      const produced = familyProduced(family);
      const combos = family.models.reduce((sum, model) => sum + model.harnesses.length, 0);
      setDialog({
        kind: 'confirm',
        title: `删除厂商 ${family.id}？`,
        lines: [
          <>
            清单里 <code>{family.id}</code> 的 {family.models.length} 个模型、{combos} 个组合会被移除。
          </>,
          produced > 0 ? (
            <>
              {produced} 个已有产出会变成清单外组合（顶栏扫描提示里列出），<b>产出目录不会被删除</b>。
            </>
          ) : (
            '这个厂商名下还没有任何产出。'
          ),
        ],
        confirmLabel: '删除厂商',
        op: { type: 'remove-family', family: family.id },
        message: `已删除厂商 ${family.id}`,
      });
    },
    [familyProduced],
  );

  const removeModel = useCallback(
    (family: CatalogFamily, model: CatalogModel) => {
      const produced = modelProduced(family.id, model);
      setDialog({
        kind: 'confirm',
        title: `删除模型 ${family.id}/${model.id}？`,
        lines: [
          <>
            它的 {model.harnesses.length} 个 harness（{model.harnesses.join('、')}）会一起从清单移除。
          </>,
          produced > 0 ? (
            <>
              {produced} 个已有产出会变成清单外组合（顶栏扫描提示里列出），<b>产出目录不会被删除</b>。
            </>
          ) : (
            '这个模型还没有任何产出。'
          ),
        ],
        confirmLabel: '删除模型',
        op: { type: 'remove-model', family: family.id, model: model.id },
        message: `已删除模型 ${family.id}/${model.id}`,
      });
    },
    [modelProduced],
  );

  const commitRename = useCallback(
    (target: RenameTarget, to: string) => {
      setRenaming(null);
      if (target.kind === 'family') {
        const family = catalog.find((item) => item.id === target.family);
        if (!family) return;
        const produced = familyProduced(family);
        const op: CatalogOp = { type: 'rename-family', family: target.family, to };
        const message = `厂商 ${target.family} → ${to}`;
        if (produced > 0) {
          setDialog({
            kind: 'confirm',
            title: `重命名厂商 ${target.family} → ${to}？`,
            lines: [
              <>
                {produced} 个已有产出仍在 <code>{target.family}/</code> 目录下，重命名后会变成清单外组合。
              </>,
              <>产出目录不会跟着改名；想保留对应关系，需要之后手工把目录也改名。</>,
            ],
            confirmLabel: '仍然重命名',
            op,
            message,
          });
        } else {
          void runOp(op, message);
        }
      } else {
        const family = catalog.find((item) => item.id === target.family);
        const model = family?.models.find((item) => item.id === target.model);
        if (!family || !model) return;
        const produced = modelProduced(family.id, model);
        const op: CatalogOp = { type: 'rename-model', family: target.family, model: target.model, to };
        const message = `模型 ${target.family}/${target.model} → ${to}`;
        if (produced > 0) {
          setDialog({
            kind: 'confirm',
            title: `重命名模型 ${target.model} → ${to}？`,
            lines: [
              <>
                {produced} 个已有产出仍在 <code>{target.family}/{target.model}/</code> 目录下，重命名后会变成清单外组合。
              </>,
              <>产出目录不会跟着改名；想保留对应关系，需要之后手工把目录也改名。</>,
            ],
            confirmLabel: '仍然重命名',
            op,
            message,
          });
        } else {
          void runOp(op, message);
        }
      }
    },
    [catalog, familyProduced, modelProduced, runOp],
  );

  const move = useCallback(
    (op: CatalogOp, message: string) => {
      void runOp(op, message);
    },
    [runOp],
  );

  // 键盘：Esc 返回工作台，/ 聚焦筛选，N 新增厂商。编辑行内输入时让位。
  useEffect(() => {
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (dialog) return;
      if (event.key === 'Escape') {
        if (renaming || adding) return;
        event.preventDefault();
        onExit();
        return;
      }
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (isTypingTarget(event.target)) return;
      if (event.key === '/') {
        event.preventDefault();
        searchRef.current?.focus();
        searchRef.current?.select();
      } else if (event.key === 'n') {
        event.preventDefault();
        setDialog({ kind: 'add-family' });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dialog, renaming, adding, onExit]);

  const copyRaw = useCallback(() => {
    void writeClipboard(manifest.catalogText).then((ok) => {
      notify(ok ? '已复制 catalog.txt 原文' : '复制失败，请手动选择文本', ok ? 'ok' : 'error');
    });
  }, [manifest.catalogText, notify]);

  const rawLines = manifest.catalogText.replace(/\r?\n$/, '').split(/\r?\n/).length;
  const families = manifest.catalog.map((family) => family.id);

  return (
    <section className="catalog" aria-label="组合全集管理">
      <header className="cat-head">
        <div className="cat-head-top">
          <div className="cat-title-wrap">
            <p className="cat-kicker">
              <Icon name="layers" size={12} />
              benchmarks/catalog.txt
              {busy && <span className="cat-saving">写入中…</span>}
            </p>
            <h1 className="cat-title">组合全集</h1>
          </div>
          <dl className="cat-stats">
            <div className="cat-stat">
              <dt>厂商</dt>
              <dd>{stats.families}</dd>
            </div>
            <div className="cat-stat">
              <dt>模型</dt>
              <dd>{stats.models}</dd>
            </div>
            <div className="cat-stat">
              <dt>组合</dt>
              <dd>{stats.combos}</dd>
            </div>
            <div className="cat-stat">
              <dt>Harness</dt>
              <dd>{universe.length}</dd>
            </div>
            <div className="cat-stat is-ok">
              <dt>有产出</dt>
              <dd>
                {stats.producedCombos}
                <small>/{stats.combos}</small>
              </dd>
            </div>
          </dl>
        </div>

        <div className="cat-tools">
          <label className="search">
            <Icon name="search" size={14} />
            <input
              ref={searchRef}
              type="search"
              value={query}
              placeholder="筛选厂商 / 模型 / harness"
              spellCheck={false}
              autoComplete="off"
              aria-label="筛选全集"
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Escape') {
                  event.preventDefault();
                  event.stopPropagation();
                  if (query) setQuery('');
                  else event.currentTarget.blur();
                }
              }}
            />
            {query ? (
              <button
                type="button"
                className="search-clear"
                aria-label="清空筛选"
                onClick={() => {
                  setQuery('');
                  searchRef.current?.focus();
                }}
              >
                <Icon name="close" size={12} />
              </button>
            ) : (
              <kbd className="kbd">/</kbd>
            )}
          </label>

          <div className="segmented" role="radiogroup" aria-label="按产出状态筛选">
            {MODES.map((item) => (
              <button
                key={item.id}
                type="button"
                role="radio"
                aria-checked={mode === item.id}
                className={cx(mode === item.id && 'is-active')}
                onClick={() => setMode(item.id)}
              >
                {item.label}
                <span className="segmented-n">
                  {item.id === 'all' ? stats.models : item.id === 'produced' ? stats.producedModels : stats.models - stats.producedModels}
                </span>
              </button>
            ))}
          </div>

          <div className="cat-tools-right">
            <button
              type="button"
              className="btn btn-primary btn-sm"
              disabled={busy}
              onClick={() => setDialog({ kind: 'add-family' })}
              title="新增厂商（N）"
            >
              <Icon name="plus" size={13} />
              新增厂商
            </button>
            <button type="button" className="btn btn-sm" onClick={onExit} title="返回工作台（Esc）">
              <Icon name="panelRight" size={13} />
              返回工作台
              <kbd className="kbd">Esc</kbd>
            </button>
          </div>
        </div>
      </header>

      <div className="cat-body column-scroll" ref={bodyRef}>
        <div className="cat-inner">
          {catalog.length === 0 && (
            <div className="cat-empty">
              <Icon name="layers" size={28} />
              <p className="cat-empty-title">清单还是空的</p>
              <p className="cat-empty-detail">
                catalog.txt 里没有任何组合。新增第一个厂商，之后就能在 Prompt 页选组合、拼 prompt 了。
              </p>
              <button
                type="button"
                className="btn btn-primary"
                disabled={busy}
                onClick={() => setDialog({ kind: 'add-family' })}
              >
                <Icon name="plus" size={14} />
                新增厂商
              </button>
            </div>
          )}

          {catalog.length > 0 && groups.length === 0 && (
            <div className="cat-empty">
              <p className="cat-empty-title">没有匹配的条目</p>
              <button
                type="button"
                className="btn btn-sm"
                onClick={() => {
                  setQuery('');
                  setMode('all');
                }}
              >
                清除筛选
              </button>
            </div>
          )}

          {groups.map(({ family, models }, familyIndex) => {
            const produced = familyProduced(family);
            const combos = family.models.reduce((sum, model) => sum + model.harnesses.length, 0);
            const isRenamingFamily = renaming?.kind === 'family' && renaming.family === family.id;
            const familyIndexInCatalog = catalog.findIndex((item) => item.id === family.id);
            return (
              <section
                key={family.id}
                data-family={family.id}
                className={cx('cat-family', flash === family.id && 'is-flash')}
                style={{ animationDelay: `${Math.min(familyIndex * 35, 350)}ms` }}
              >
                <header className="cat-family-head">
                  <span className="cat-family-index">{pad2(familyIndexInCatalog + 1)}</span>
                  {isRenamingFamily ? (
                    <RenameInput
                      initial={family.id}
                      label={`重命名厂商 ${family.id}`}
                      validate={(value) =>
                        validateCatalogId(value, '厂商名', families.filter((item) => item !== family.id))
                      }
                      onCommit={(value) => commitRename({ kind: 'family', family: family.id }, value)}
                      onCancel={() => setRenaming(null)}
                      onInvalid={(message) => notify(message, 'error')}
                    />
                  ) : (
                    <span className="cat-family-name" title={family.id}>
                      {family.id}
                    </span>
                  )}
                  <span className="cat-family-meta">
                    {family.models.length} 模型 · {combos} 组合
                    {produced > 0 && <span className="cat-produced">{produced} 产出</span>}
                  </span>
                  <span className="cat-actions">
                    <button
                      type="button"
                      className="btn btn-sm"
                      disabled={busy}
                      onClick={() => setDialog({ kind: 'add-model', family: family.id })}
                      title={`给 ${family.id} 新增模型`}
                    >
                      <Icon name="plus" size={12} />
                      模型
                    </button>
                    <button
                      type="button"
                      className="icon-btn cat-act"
                      disabled={busy || isRenamingFamily}
                      onClick={() => setRenaming({ kind: 'family', family: family.id })}
                      title="重命名厂商"
                      aria-label={`重命名厂商 ${family.id}`}
                    >
                      <Icon name="pencil" size={14} />
                    </button>
                    <button
                      type="button"
                      className="icon-btn cat-act"
                      disabled={busy || filtered || familyIndexInCatalog === 0}
                      onClick={() =>
                        move(
                          { type: 'move-family', family: family.id, dir: -1 },
                          `已上移厂商 ${family.id}`,
                        )
                      }
                      title={filtered ? '筛选时不能调整顺序' : '上移厂商'}
                      aria-label={`上移厂商 ${family.id}`}
                    >
                      <Icon name="arrowUp" size={14} />
                    </button>
                    <button
                      type="button"
                      className="icon-btn cat-act"
                      disabled={busy || filtered || familyIndexInCatalog === catalog.length - 1}
                      onClick={() =>
                        move(
                          { type: 'move-family', family: family.id, dir: 1 },
                          `已下移厂商 ${family.id}`,
                        )
                      }
                      title={filtered ? '筛选时不能调整顺序' : '下移厂商'}
                      aria-label={`下移厂商 ${family.id}`}
                    >
                      <Icon name="arrowDown" size={14} />
                    </button>
                    <button
                      type="button"
                      className="icon-btn cat-act is-danger"
                      disabled={busy}
                      onClick={() => removeFamily(family)}
                      title="删除厂商"
                      aria-label={`删除厂商 ${family.id}`}
                    >
                      <Icon name="trash" size={14} />
                    </button>
                  </span>
                </header>

                <div className="cat-models">
                  {models.map((model) => {
                    const modelIndexInFamily = family.models.findIndex((item) => item.id === model.id);
                    const isRenamingModel =
                      renaming?.kind === 'model' &&
                      renaming.family === family.id &&
                      renaming.model === model.id;
                    const isAdding = adding?.family === family.id && adding.model === model.id;
                    const producedHere = modelProduced(family.id, model);
                    const adderSuggestions = suggestions.filter((name) => !model.harnesses.includes(name));
                    return (
                      <div key={model.id} className="cat-model">
                        <div className="cat-model-key">
                          {isRenamingModel ? (
                            <RenameInput
                              initial={model.id}
                              label={`重命名模型 ${family.id}/${model.id}`}
                              validate={(value) =>
                                validateCatalogId(
                                  value,
                                  '模型名',
                                  family.models.map((item) => item.id).filter((item) => item !== model.id),
                                )
                              }
                              onCommit={(value) =>
                                commitRename({ kind: 'model', family: family.id, model: model.id }, value)
                              }
                              onCancel={() => setRenaming(null)}
                              onInvalid={(message) => notify(message, 'error')}
                            />
                          ) : (
                            <span className="cat-model-name" title={`${family.id}/${model.id}`}>
                              {model.id}
                            </span>
                          )}
                          {producedHere > 0 && (
                            <span className="cat-produced is-model">{producedHere} 产出</span>
                          )}
                        </div>
                        <span className="cat-actions">
                          <button
                            type="button"
                            className="icon-btn cat-act"
                            disabled={busy || isRenamingModel}
                            onClick={() => setRenaming({ kind: 'model', family: family.id, model: model.id })}
                            title="重命名模型"
                            aria-label={`重命名模型 ${family.id}/${model.id}`}
                          >
                            <Icon name="pencil" size={13} />
                          </button>
                          <button
                            type="button"
                            className="icon-btn cat-act"
                            disabled={busy || filtered || modelIndexInFamily === 0}
                            onClick={() =>
                              move(
                                { type: 'move-model', family: family.id, model: model.id, dir: -1 },
                                `已上移模型 ${family.id}/${model.id}`,
                              )
                            }
                            title={filtered ? '筛选时不能调整顺序' : '上移模型'}
                            aria-label={`上移模型 ${family.id}/${model.id}`}
                          >
                            <Icon name="arrowUp" size={13} />
                          </button>
                          <button
                            type="button"
                            className="icon-btn cat-act"
                            disabled={busy || filtered || modelIndexInFamily === family.models.length - 1}
                            onClick={() =>
                              move(
                                { type: 'move-model', family: family.id, model: model.id, dir: 1 },
                                `已下移模型 ${family.id}/${model.id}`,
                              )
                            }
                            title={filtered ? '筛选时不能调整顺序' : '下移模型'}
                            aria-label={`下移模型 ${family.id}/${model.id}`}
                          >
                            <Icon name="arrowDown" size={13} />
                          </button>
                          <button
                            type="button"
                            className="icon-btn cat-act is-danger"
                            disabled={busy}
                            onClick={() => removeModel(family, model)}
                            title="删除模型"
                            aria-label={`删除模型 ${family.id}/${model.id}`}
                          >
                            <Icon name="trash" size={13} />
                          </button>
                        </span>
                        <div className="cat-harnesses">
                          {model.harnesses.map((harness) => {
                            const count = producedCounts.get(`${family.id}/${model.id}/${harness}`) ?? 0;
                            const last = model.harnesses.length === 1;
                            return (
                              <span
                                key={harness}
                                className={cx('cat-chip', count > 0 && 'is-produced')}
                                title={
                                  count > 0
                                    ? `${count} 个项目已产出这个组合`
                                    : '还没有项目产出这个组合'
                                }
                              >
                                <i className="cat-chip-dot" aria-hidden="true" />
                                {harness}
                                <button
                                  type="button"
                                  className="cat-chip-x"
                                  disabled={busy || last}
                                  aria-label={`从 ${family.id}/${model.id} 移除 ${harness}`}
                                  title={last ? '至少保留一个 harness；要清空请删除整个模型' : `移除 ${harness}`}
                                  onClick={() => removeHarness(family, model, harness)}
                                >
                                  <Icon name="close" size={10} />
                                </button>
                              </span>
                            );
                          })}
                          {isAdding ? (
                            <HarnessAdder
                              existing={model.harnesses}
                              suggestions={adderSuggestions}
                              busy={busy}
                              onAdd={(name) => addHarness(family, model, name)}
                              onClose={() => setAdding(null)}
                            />
                          ) : (
                            <button
                              type="button"
                              className="cat-chip is-add"
                              disabled={busy}
                              onClick={() => setAdding({ family: family.id, model: model.id })}
                              title={`给 ${family.id}/${model.id} 加一个 harness`}
                            >
                              <Icon name="plus" size={11} />
                              harness
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}

          {catalog.length > 0 && (
            <details className="cat-raw">
              <summary>
                <Icon name="terminal" size={13} />
                catalog.txt 原文
                <span className="cat-raw-meta">{rawLines} 行 · 改动即时写入，注释与顺序保留</span>
              </summary>
              <div className="cat-raw-body">
                <pre>{manifest.catalogText}</pre>
                <button type="button" className="btn btn-sm cat-raw-copy" onClick={copyRaw}>
                  <Icon name="copy" size={13} />
                  复制原文
                </button>
              </div>
            </details>
          )}
        </div>
      </div>

      <footer className="cat-foot hints">
        <span>
          <kbd className="kbd">Esc</kbd> 返回工作台
        </span>
        <span>
          <kbd className="kbd">/</kbd> 筛选
        </span>
        <span>
          <kbd className="kbd">N</kbd> 新增厂商
        </span>
        <span className="cat-foot-note">只改清单，不动任何产出目录</span>
      </footer>

      {dialog?.kind === 'add-family' && (
        <AddEntryDialog
          mode="family"
          families={families}
          models={[]}
          suggestions={suggestions}
          onClose={() => setDialog(null)}
          onSubmit={async (op) => {
            if (op.type !== 'add-family') return '操作类型不对';
            const error = await runOp(op, `已新增厂商 ${op.family}（首个模型 ${op.model}）`);
            if (!error) {
              setDialog(null);
              flashFamily(op.family);
            }
            return error;
          }}
        />
      )}
      {dialog?.kind === 'add-model' && (
        <AddEntryDialog
          mode="model"
          family={dialog.family}
          families={families}
          models={catalog.find((item) => item.id === dialog.family)?.models.map((item) => item.id) ?? []}
          suggestions={suggestions}
          onClose={() => setDialog(null)}
          onSubmit={async (op) => {
            if (op.type !== 'add-model') return '操作类型不对';
            const error = await runOp(op, `已在 ${op.family} 下新增模型 ${op.model}`);
            if (!error) {
              setDialog(null);
              flashFamily(op.family);
            }
            return error;
          }}
        />
      )}
      {dialog?.kind === 'confirm' && (
        <ConfirmDialog
          title={dialog.title}
          lines={dialog.lines}
          confirmLabel={dialog.confirmLabel}
          busy={busy}
          onConfirm={() => {
            void runOp(dialog.op, dialog.message).then((error) => {
              if (!error) setDialog(null);
            });
          }}
          onClose={() => setDialog(null)}
        />
      )}

      <Toast toast={toast} visible={visible} />
    </section>
  );
}