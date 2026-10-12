import { breakable, cx, highlight, pad2 } from '../lib/text';
import { TARGET_PLACEHOLDER } from '../shared/compose';
import type { Selection } from '../shared/compose';
import { CopyButton } from './CopyButton';
import { Icon } from './Icon';

type Props = {
  repoRoot: string;
  selection: Selection;
  sharedPrompt: string;
  projectIndex: number;
  projectTotal: number;
  doneCount: number;
  total: number;
  copiedId: string | null;
  onCopy: (id: string, text: string, message: string) => void;
  onReveal: () => void;
};

const fmt = (value: number) => value.toLocaleString('en-US');

export function PromptDocument({
  repoRoot,
  selection,
  sharedPrompt,
  projectIndex,
  projectTotal,
  doneCount,
  total,
  copiedId,
  onCopy,
  onReveal,
}: Props) {
  const { family, model, harness, targetPath, relPath } = selection;
  const benchmarkText = selection.benchmarkPrompt.trim();
  const placeholderHits = sharedPrompt.split(TARGET_PLACEHOLDER).length - 1;
  const sharedText = sharedPrompt.split(TARGET_PLACEHOLDER).join(targetPath).trim();

  const prefix = `${repoRoot}/`;
  const splitPath = targetPath === `${prefix}${relPath}`;
  const percent = total > 0 ? Math.round((doneCount / total) * 100) : 0;

  return (
    <div className="doc">
      <header className="hero">
        <div className="hero-main">
          <p className="eyebrow">
            项目 {pad2(projectIndex + 1)}
            <span className="eyebrow-of">/ {pad2(projectTotal)}</span>
          </p>
          <h1 className="hero-title">{breakable(selection.benchmarkId)}</h1>
          <div className="hero-combo">
            <span className="chip">{family.id}</span>
            <span className="chip-sep">/</span>
            <span className="chip">{model.id}</span>
            <span className="chip-sep">/</span>
            <span className="chip is-accent">{harness}</span>
            <span className={cx('status', selection.exists ? 'is-done' : 'is-todo')}>
              <i aria-hidden="true" />
              {selection.exists ? '已有产出' : '还没跑过，复制即可开跑'}
            </span>
          </div>
        </div>

        <div className="meter" title={`本项目已产出 ${doneCount} / 全集 ${total} 个组合`}>
          <span className="meter-label">本项目覆盖</span>
          <span className="meter-value">
            <b>{doneCount}</b>
            <span>/ {total}</span>
          </span>
          <span className="meter-bar" aria-hidden="true">
            <i style={{ width: `${percent}%` }} />
          </span>
        </div>
      </header>

      <div className="target">
        <span className="target-label">Target</span>
        <code className="target-path" title={targetPath}>
          {splitPath ? (
            <>
              <span>{breakable(prefix)}</span>
              <b>{breakable(relPath)}</b>
            </>
          ) : (
            breakable(targetPath)
          )}
        </code>
        <div className="target-actions">
          <CopyButton
            size="sm"
            label="复制"
            copied={copiedId === 'target'}
            onClick={() => onCopy('target', targetPath, '已复制 target 路径')}
            title="复制产出目录的绝对路径"
          />
          {selection.exists && (
            <button type="button" className="btn btn-sm" onClick={onReveal} title="在访达中显示">
              <Icon name="reveal" size={13} />
              <span className="btn-label">访达</span>
            </button>
          )}
        </div>
      </div>

      <article className="paper" aria-label="合成预览">
        <header className="paper-head">
          <span className="paper-title">合成预览</span>
          <span className="paper-note">
            题目 prompt <span className="op">+</span> 空行 <span className="op">+</span>{' '}
            shared-prompt
          </span>
        </header>

        <section className="part">
          <div className="part-gutter">
            <div className="part-gutter-inner">
              <span className="part-no">01</span>
              <span className="part-label">{breakable(`benchmarks/${selection.benchmarkId}/prompt.md`)}</span>
              <span className="part-size">{fmt(benchmarkText.length)} 字符</span>
            </div>
          </div>
          <pre className="part-body">{benchmarkText}</pre>
        </section>

        <div className="joint" aria-hidden="true">
          <span>空行</span>
        </div>

        <section className="part">
          <div className="part-gutter">
            <div className="part-gutter-inner">
              <span className="part-no">02</span>
              <span className="part-label">shared-prompt.md</span>
              <span className="part-size">{fmt(sharedText.length)} 字符</span>
              {placeholderHits > 0 ? (
                <span className="part-flag">
                  <i aria-hidden="true" />
                  {TARGET_PLACEHOLDER} → target ×{placeholderHits}
                </span>
              ) : (
                <span className="part-flag is-warn">未找到 {TARGET_PLACEHOLDER} 占位符</span>
              )}
            </div>
          </div>
          <pre className="part-body">{highlight(sharedText, targetPath)}</pre>
        </section>
      </article>
    </div>
  );
}
