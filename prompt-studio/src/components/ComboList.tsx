import type { RefObject } from 'react';
import { useEffect, useRef } from 'react';
import type { ComboGroup, ComboRow } from '../lib/combos';
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
};

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
                  title={`${row.key}\n${produced ? '本项目已有产出' : '本项目还没跑过'}`}
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
                  <span className="combo-dot" aria-label={produced ? '已有产出' : '未跑'} />
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
