import { useCallback, useEffect, useRef, useState } from 'react';
import { cx } from '../lib/text';
import { Icon } from './Icon';

export type ToastTone = 'ok' | 'error';
export type ToastAction = { label: string; onClick: () => void };
type ToastState = { message: string; tone: ToastTone; action?: ToastAction } | null;

export function useToast() {
  const [toast, setToast] = useState<ToastState>(null);
  const [visible, setVisible] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  const notify = useCallback((message: string, tone: ToastTone = 'ok', action?: ToastAction) => {
    setToast({ message, tone, action });
    setVisible(true);
    window.clearTimeout(timer.current);
    // 带撤销动作的提示多留一会儿，给人反应时间
    timer.current = window.setTimeout(() => setVisible(false), action ? 6000 : 2200);
  }, []);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  return { toast, visible, notify };
}

export function Toast({ toast, visible }: { toast: ToastState; visible: boolean }) {
  return (
    <div
      className={cx('toast', visible && 'is-visible', toast?.tone === 'error' && 'is-error')}
      role="status"
      aria-live="polite"
    >
      {toast && (
        <>
          <Icon name={toast.tone === 'error' ? 'alert' : 'check'} size={14} />
          <span>{toast.message}</span>
          {toast.action && (
            <button
              type="button"
              className="toast-action"
              onClick={() => toast.action?.onClick()}
            >
              {toast.action.label}
            </button>
          )}
        </>
      )}
    </div>
  );
}