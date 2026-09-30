import type { ReactNode } from 'react';
import { TARGET_PLACEHOLDER } from '../shared/compose';

/** 把 shared prompt 里替换进去的产出路径高亮出来，让拼装结果一眼可核对。 */
function highlight(text: string, needle: string): ReactNode[] {
  if (!needle || !text.includes(needle)) return [text];
  const nodes: ReactNode[] = [];
  text.split(needle).forEach((part, index) => {
    if (index > 0) {
      nodes.push(
        <mark key={`hit-${index}`} className="hl">
          {needle}
        </mark>,
      );
    }
    nodes.push(part);
  });
  return nodes;
}

type Props = {
  benchmarkId: string;
  benchmarkPrompt: string;
  sharedPrompt: string;
  targetPath: string;
};

export function PromptPreview({
  benchmarkId,
  benchmarkPrompt,
  sharedPrompt,
  targetPath,
}: Props) {
  const resolvedShared = sharedPrompt.split(TARGET_PLACEHOLDER).join(targetPath);

  return (
    <div className="preview">
      <article className="preview-part">
        <header className="preview-part-head">
          <span>
            ① benchmarks/{benchmarkId}/prompt.md
          </span>
          <span className="preview-part-len">{benchmarkPrompt.trim().length} 字符</span>
        </header>
        <pre className="preview-body">{benchmarkPrompt.trim()}</pre>
      </article>

      <article className="preview-part">
        <header className="preview-part-head">
          <span>② shared-prompt.md（{TARGET_PLACEHOLDER} 已替换）</span>
          <span className="preview-part-len">{resolvedShared.trim().length} 字符</span>
        </header>
        <pre className="preview-body">{highlight(resolvedShared.trim(), targetPath)}</pre>
      </article>
    </div>
  );
}
