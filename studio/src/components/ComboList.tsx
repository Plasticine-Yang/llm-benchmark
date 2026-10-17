import type { RefObject } from 'react';
import { useEffect, useRef } from 'react';
import type { ComboGroup, ComboRow } from '../lib/combos';
import { ACTIVE_PHASES } from '../shared/launch';
import type { LaunchInfo, RunState } from '../shared/launch';
import { cx, MOD_KEY } from '../lib/text';
import { Icon } from './Icon';

export type FilterMode = 'all' | 'done' | 'todo';

type Props = {
  groups: ComboGroup[];
  activeKey: string;
  /** 当前项目已产出的组合 */
  done: Set<string>;
  total: number;
  doneCount: number;
  query: string;
  onQuery: (value: string) => void;
  mode: FilterMode;
  onMode: (mode: FilterMode) => void;
  searchRef: RefObject<HTMLInputElement | null>;
  onPick: (row: ComboRow) => void;
  /** 当前项目各产出的启动规范 */
  launch: Record<string, LaunchInfo>;
  /** 全部运行状态，键是 <project>/<family>/<model>/<harness> */
  runs: Map<string, RunState>;
  project: string;
};

type Mark = { cls: string; label: string };

/** 行尾的小标：没产出 / 待规范 / 可看（静态、可启动）/ 运行中 / 失败 */
function markFor(produced: boolean, info: LaunchInfo | undefined, run: RunState | undefined): Mark {
  if (!produced) return { cls: 'is-todo', label: '未跑' };
  if (run && ACTIVE_PHASES.has(run.phase)) {
    return run.phase === 'running'
      ? { cls: 'is-live', label: '运行中' }
      : { cls: 'is-live is-busy', label: '启动中' };
  }
  if (run?.phase === 'failed') return { cls: 'is-failed', label: '上次启动失败' };
  if (!info || info.spec === 'missing') return { cls: 'is-raw', label: info?.empty ? '已产出 · 空目录' : '已产出 · 待规范启动方式' };
  if (info.spec === 'invalid') return { cls: 'is-failed', label: 'bench.json 有误' };
  if (info.spec === 'unavailable') return { cls: 'is-raw', label: '已规范 · 无法预览' };
  return { cls: 'is-ready', label: info.spec === 'static' ? '可预览 · 静态页面' : '可预览 · 需启动服务' };
}

const MODES: Array<{ id: FilterMode; label: string }> = [
  { id: 'all', label: '全部' },
  { id: 'done', label: '已跑' },
  { id: 'todo', label: '待跑' },
];

export function ComboList({
  groups,
  activeKey,
  done,
  total,
  doneCount,
  query,
  onQuery,
  mode,
  onMode,
  searchRef,
  onPick,
  launch,
  runs,
  project,
}: Props) {
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = listRef.current?.querySelector<HTMLElement>(
      `[data-key="${CSS.escape(activeKey)}"]`,
    );
    node?.scrollIntoView({ block: 'nearest' });
  }, [activeKey, groups]);

  const counts: Record<FilterMode, number> = {
    all: total,
    done: doneCount,
    todo: total - doneCount,
  };
  const filtered = query.trim() !== '' || mode !== 'all';

  return (
    <section className="column column-combos" aria-label="组合">
      <header className="column-head">
        <h2 className="column-title">组合</h2>
        <span className="column-sub">厂商 / 模型 / Harness</span>
      </header>

      <div className="combo-tools">
        <label className="search">
          <Icon name="search" size={14} />
          <input
            ref={searchRef}
            type="search"
            value={query}
            placeholder="筛选，如 gpt codex"
            spellCheck={false}
            autoComplete="off"
            aria-label="筛选组合"
            onChange={(event) => onQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                event.preventDefault();
                onQuery('');
                event.currentTarget.blur();
              }
            }}
          />
          {query ? (
            <button
              type="button"
              className="search-clear"
              aria-label="清空筛选"
              onClick={() => {
                onQuery('');
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
              onClick={() => onMode(item.id)}
            >
              {item.label}
              <span className="segmented-n">{counts[item.id]}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="column-scroll combo-scroll" ref={listRef}>
        {groups.length === 0 && (
          <div className="combo-empty">
            <p>没有符合条件的组合</p>
            {filtered && (
              <button
                type="button"
                className="btn btn-sm"
                onClick={() => {
                  onQuery('');
                  onMode('all');
                }}
              >
                清除筛选
              </button>
            )}
          </div>
        )}

        {groups.map((group) => (
          <div className="group" key={group.family}>
            <div className="group-head">
              <span className="group-name">{group.family}</span>
              <span className="group-meta">
                {group.modelCount} 模型 · {group.rows.length}
              </span>
            </div>
            {group.rows.map((row) => {
              const active = row.key === activeKey;
              const produced = done.has(row.key);
              const mark = markFor(produced, launch[row.key], runs.get(`${project}/${row.key}`));
              return (
                <button
                  key={row.key}
                  type="button"
                  data-key={row.key}
                  aria-current={active ? 'true' : undefined}
                  className={cx(
                    'combo',
                    active && 'is-active',
                    produced && 'is-done',
                    row.nth === 0 && 'is-model-start',
                  )}
                  onClick={() => onPick(row)}
                  title={`${row.key}\n${mark.label}`}
                >
                  <span
                    className={cx(
                      'combo-model',
                      row.nth > 0 && 'is-cont',
                      row.nth > 0 && row.last && 'is-last',
                    )}
                  >
                    {row.nth === 0 ? row.model : null}
                  </span>
                  <span className="combo-harness">{row.harness}</span>
                  <span className={cx('combo-dot', mark.cls)} aria-label={mark.label} />
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <footer className="column-foot hints">
        <span>
          <kbd className="kbd">↑</kbd>
          <kbd className="kbd">↓</kbd>
          组合
        </span>
        <span>
          <kbd className="kbd">←</kbd>
          <kbd className="kbd">→</kbd>
          项目
        </span>
        <span>
          <kbd className="kbd">{MOD_KEY}</kbd>
          <kbd className="kbd">↵</kbd>
          复制
        </span>

      </footer>
    </section>
  );
}
