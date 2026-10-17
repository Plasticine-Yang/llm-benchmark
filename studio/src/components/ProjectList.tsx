import { useEffect, useRef, type ReactNode } from 'react';
import { cx, pad2 } from '../lib/text';
import type { Benchmark } from '../types';
import { Icon } from './Icon';

type Props = {
  benchmarks: Benchmark[];
  /** 全集组合键，按 catalog.txt 顺序；用来画覆盖度点阵 */
  catalogKeys: string[];
  /** 项目 → 该项目已产出、且在全集内的组合 */
  coverage: Map<string, Set<string>>;
  activeId: string;
  onPick: (id: string) => void;
  /** 打开「新建 benchmark」弹窗 */
  onCreate: () => void;
  /** 导航栏是否已收起为窄轨 */
  collapsed: boolean;
  onToggle: () => void;
  /** 展开时，组合列表作为 children 跟在项目 chips 下面 */
  children?: ReactNode;
};

/** 收起态窄轨上的单个项目按钮：序号 + 悬浮名。 */
function RailItem({
  benchmark,
  index,
  doneCount,
  total,
  active,
  onPick,
}: {
  benchmark: Benchmark;
  index: number;
  doneCount: number;
  total: number;
  active: boolean;
  onPick: () => void;
}) {
  const complete = total > 0 && doneCount === total;
  return (
    <button
      type="button"
      aria-current={active ? 'true' : undefined}
      className={cx('rail-item', active && 'is-active', complete && 'is-complete')}
      onClick={onPick}
      title={`${benchmark.title}\n${benchmark.id}\n已产出 ${doneCount} / ${total} 个组合`}
    >
      <span className="rail-index">{pad2(index + 1)}</span>
      <i className="rail-dot" aria-hidden="true" />
    </button>
  );
}

export function NavPanel({
  benchmarks,
  catalogKeys,
  coverage,
  activeId,
  onPick,
  onCreate,
  collapsed,
  onToggle,
  children,
}: Props) {
  const chipsRef = useRef<HTMLDivElement>(null);
  const total = catalogKeys.length;

  // 切换项目时，收起态以外也让激活 chip 滚进可见区。
  useEffect(() => {
    const node = chipsRef.current?.querySelector<HTMLElement>(`[data-id="${CSS.escape(activeId)}"]`);
    node?.scrollIntoView({ inline: 'nearest', block: 'nearest' });
  }, [activeId, collapsed]);

  if (collapsed) {
    return (
      <aside className="nav is-collapsed" aria-label="导航">
        <button
          type="button"
          className="rail-toggle"
          onClick={onToggle}
          title="展开导航"
          aria-label="展开导航"
        >
          <Icon name="panelRight" size={15} />
        </button>
        <div className="rail-list">
          {benchmarks.map((benchmark, index) => (
            <RailItem
              key={benchmark.id}
              benchmark={benchmark}
              index={index}
              doneCount={(coverage.get(benchmark.id) ?? new Set<string>()).size}
              total={total}
              active={benchmark.id === activeId}
              onPick={() => onPick(benchmark.id)}
            />
          ))}
          <button
            type="button"
            className="rail-item rail-add"
            onClick={onCreate}
            title="新建 benchmark（N）"
            aria-label="新建 benchmark"
          >
            <Icon name="plus" size={15} />
          </button>
        </div>
      </aside>
    );
  }

  return (
    <aside className="nav is-open" aria-label="导航">
      <div className="nav-projects">
        <header className="nav-projects-head">
          <h2 className="nav-projects-title">项目</h2>
          <span className="nav-projects-sub">{benchmarks.length} 个 benchmark</span>
          <button
            type="button"
            className="icon-btn nav-add"
            onClick={onCreate}
            title="新建 benchmark（N）"
            aria-label="新建 benchmark"
          >
            <Icon name="plus" size={14} />
          </button>
          <button
            type="button"
            className="icon-btn nav-collapse"
            onClick={onToggle}
            title="收起导航"
            aria-label="收起导航"
          >
            <Icon name="panelLeft" size={15} />
          </button>
        </header>

        <div className="project-chips" ref={chipsRef}>
          {benchmarks.map((benchmark, index) => {
            const done = coverage.get(benchmark.id) ?? new Set<string>();
            const active = benchmark.id === activeId;
            const complete = total > 0 && done.size === total;
            return (
              <button
                key={benchmark.id}
                type="button"
                data-id={benchmark.id}
                aria-current={active ? 'true' : undefined}
                className={cx('chip-card', active && 'is-active', complete && 'is-complete')}
                onClick={() => onPick(benchmark.id)}
                title={`${benchmark.title}\n${benchmark.id}\n已产出 ${done.size} / ${total} 个组合`}
              >
                <span className="chip-card-index">{pad2(index + 1)}</span>
                <span className="chip-card-name">{benchmark.title}</span>
                <span className="chip-card-strip" aria-hidden="true">
                  {catalogKeys.map((key) => (
                    <i key={key} className={done.has(key) ? 'on' : undefined} />
                  ))}
                </span>
                <span className="chip-card-count">
                  <b>{done.size}</b>/{total}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {children}
    </aside>
  );
}
