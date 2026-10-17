import { useEffect, useRef } from 'react';
import { breakable, cx, pad2 } from '../lib/text';
import type { Benchmark } from '../types';

type Props = {
  benchmarks: Benchmark[];
  /** 全集组合键，按 catalog.txt 顺序；用来画覆盖度点阵 */
  catalogKeys: string[];
  /** 项目 → 该项目已产出、且在全集内的组合 */
  coverage: Map<string, Set<string>>;
  activeId: string;
  onPick: (id: string) => void;
};

export function ProjectList({ benchmarks, catalogKeys, coverage, activeId, onPick }: Props) {
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = listRef.current?.querySelector<HTMLElement>(
      `[data-id="${CSS.escape(activeId)}"]`,
    );
    node?.scrollIntoView({ block: 'nearest' });
  }, [activeId]);

  const total = catalogKeys.length;

  return (
    <aside className="column column-projects" aria-label="项目">
      <header className="column-head">
        <h2 className="column-title">项目</h2>
        <span className="column-sub">{benchmarks.length} 个 benchmark</span>
      </header>

      <div className="column-scroll" ref={listRef}>
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
              className={cx('project', active && 'is-active')}
              onClick={() => onPick(benchmark.id)}
              title={`${benchmark.id}\n已产出 ${done.size} / 全集 ${total} 个组合`}
            >
              <span className="project-index">{pad2(index + 1)}</span>
              <span className="project-body">
                <span className="project-name">{breakable(benchmark.id)}</span>
                <span className="project-meta">
                  <span className="strip" aria-hidden="true">
                    {catalogKeys.map((key) => (
                      <i key={key} className={done.has(key) ? 'on' : undefined} />
                    ))}
                  </span>
                  <span className={cx('project-count', complete && 'is-complete')}>
                    <b>{done.size}</b>/{total}
                  </span>
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <footer className="column-foot">
        <span>
          全集 <b>{total}</b> 个组合
        </span>
        <code>benchmarks/catalog.txt</code>
      </footer>
    </aside>
  );
}
