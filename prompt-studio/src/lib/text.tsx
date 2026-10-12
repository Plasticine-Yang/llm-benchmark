import type { ReactNode } from 'react';

/** 在 - _ / 之后插入 <wbr>，让很长的项目名 / 路径只在分隔符处折行。 */
export function breakable(text: string): ReactNode[] {
  const parts = text.split(/(?<=[-_/])/);
  return parts.flatMap((part, index) =>
    index < parts.length - 1 ? [part, <wbr key={`wbr-${index}`} />] : [part],
  );
}

/** 把文本里出现的 needle 包成 <mark>，用于高亮替换进去的 target 路径。 */
export function highlight(text: string, needle: string): ReactNode[] {
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

export function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

export function cx(...names: Array<string | false | null | undefined>): string {
  return names.filter(Boolean).join(' ');
}

/** 快捷键提示里显示 ⌘ 还是 Ctrl。 */
export const MOD_KEY =
  typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.userAgent) ? '⌘' : 'Ctrl';
