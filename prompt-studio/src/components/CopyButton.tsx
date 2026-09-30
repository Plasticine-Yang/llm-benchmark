import { useCallback, useEffect, useRef, useState } from 'react';
import { writeClipboard } from '../lib/clipboard';

type Props = {
  text: string;
  label: string;
  copiedLabel?: string;
  variant?: 'primary' | 'ghost';
  disabled?: boolean;
};

export function CopyButton({
  text,
  label,
  copiedLabel = '已复制 ✓',
  variant = 'ghost',
  disabled = false,
}: Props) {
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const onClick = useCallback(() => {
    void (async () => {
      const ok = await writeClipboard(text);
      setFailed(!ok);
      if (!ok) return;
      setCopied(true);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setCopied(false), 1600);
    })();
  }, [text]);

  const isDisabled = disabled || text.length === 0;

  return (
    <button
      type="button"
      className={`btn btn-${variant}${copied ? ' is-copied' : ''}`}
      onClick={onClick}
      disabled={isDisabled}
      title={failed ? '复制失败，请手动选择文本' : undefined}
    >
      {copied ? copiedLabel : failed ? '复制失败' : label}
    </button>
  );
}
