import { cx } from '../lib/text';
import { Icon } from './Icon';

type Props = {
  label: string;
  onClick: () => void;
  copied: boolean;
  copiedLabel?: string;
  variant?: 'primary' | 'ghost';
  size?: 'md' | 'sm';
  /** 按钮里附带的快捷键提示，例如 ["⌘", "↵"] */
  kbd?: string[];
  title?: string;
  disabled?: boolean;
};

/** 纯展示的复制按钮：复制动作与「已复制」状态由上层统一管理（快捷键复用同一套）。 */
export function CopyButton({
  label,
  onClick,
  copied,
  copiedLabel = '已复制',
  variant = 'ghost',
  size = 'md',
  kbd,
  title,
  disabled = false,
}: Props) {
  return (
    <button
      type="button"
      className={cx(
        'btn',
        variant === 'primary' && 'btn-primary',
        size === 'sm' && 'btn-sm',
        copied && 'is-copied',
      )}
      onClick={onClick}
      disabled={disabled}
      title={title}
    >
      <Icon name={copied ? 'check' : 'copy'} size={size === 'sm' ? 13 : 14} />
      {/* 两个文案叠放在同一格里，按钮宽度取较长者，切换「已复制」时不跳动 */}
      <span className="btn-label">
        <span className={cx(copied && 'is-hidden')}>{label}</span>
        <span className={cx(!copied && 'is-hidden')} aria-hidden={!copied}>
          {copiedLabel}
        </span>
      </span>
      {kbd && (
        <span className="btn-kbd" aria-hidden="true">
          {kbd.map((key) => (
            <kbd key={key} className="kbd">
              {key}
            </kbd>
          ))}
        </span>
      )}
    </button>
  );
}
