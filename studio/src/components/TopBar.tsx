import { useEffect, useRef } from 'react';
import { cx } from '../lib/text';
import type { Theme } from '../lib/theme';
import type { Manifest } from '../types';
import { Icon } from './Icon';

type Props = {
  manifest: Manifest | null;
  loading: boolean;
  theme: Theme;
  onToggleTheme: () => void;
  onRescan: () => void;
};

/** 品牌标：两条横杠 = 「题目 prompt」+「shared-prompt」拼在一起。 */
function BrandMark() {
  return (
    <svg className="brand-mark" width="26" height="26" viewBox="0 0 26 26" aria-hidden="true">
      <rect className="brand-mark-bg" width="26" height="26" rx="7.5" />
      <rect className="brand-mark-a" x="6.5" y="8" width="13" height="3" rx="1.5" />
      <rect className="brand-mark-b" x="6.5" y="15" width="7.5" height="3" rx="1.5" />
      <circle className="brand-mark-b" cx="18" cy="16.5" r="1.6" />
    </svg>
  );
}

function Warnings({ list }: { list: string[] }) {
  const ref = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    const close = (event: Event) => {
      const element = ref.current;
      if (!element?.open) return;
      if (event instanceof KeyboardEvent) {
        if (event.key === 'Escape') element.open = false;
        return;
      }
      if (!element.contains(event.target as Node)) element.open = false;
    };
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', close);
    return () => {
      document.removeEventListener('pointerdown', close);
      document.removeEventListener('keydown', close);
    };
  }, []);

  return (
    <details className="warnings" ref={ref}>
      <summary className="warn-pill">
        <Icon name="alert" size={13} />
        {list.length} 条扫描提示
      </summary>
      <div className="warn-panel">
        <p className="warn-title">目录结构或 catalog.txt 有不符合约定的地方</p>
        <ul>
          {list.map((warning) => (
            <li key={warning}>{warning}</li>
          ))}
        </ul>
      </div>
    </details>
  );
}

export function TopBar({ manifest, loading, theme, onToggleTheme, onRescan }: Props) {
  const repoName = manifest?.repoRoot.split('/').filter(Boolean).pop();
  const scanned = manifest
    ? new Date(manifest.scannedAt).toLocaleTimeString('zh-CN', { hour12: false })
    : null;

  return (
    <header className="topbar">
      <div className="brand">
        <BrandMark />
        <span className="wordmark">
          Benchmark <em>Studio</em>
        </span>
        {manifest && repoName && (
          <>
            <span className="brand-divider" aria-hidden="true" />
            <code className="brand-repo" title={manifest.repoRoot}>
              {repoName}
            </code>
          </>
        )}
      </div>

      <div className="topbar-actions">
        {manifest && manifest.warnings.length > 0 && <Warnings list={manifest.warnings} />}
        {scanned && (
          <span className="scan-time" title={manifest?.scannedAt}>
            扫描于 {scanned}
          </span>
        )}
        <button
          type="button"
          className={cx('icon-btn', loading && 'is-spinning')}
          onClick={onRescan}
          disabled={loading}
          title="重新扫描 benchmarks/ 与 catalog.txt"
          aria-label="重新扫描"
        >
          <Icon name="refresh" />
        </button>
        <button
          type="button"
          className="icon-btn"
          onClick={onToggleTheme}
          title={theme === 'dark' ? '切换到浅色' : '切换到深色'}
          aria-label={theme === 'dark' ? '切换到浅色' : '切换到深色'}
        >
          <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
        </button>
      </div>
    </header>
  );
}
