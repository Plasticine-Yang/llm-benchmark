import { useCallback, useEffect, useRef, useState } from 'react';
import { cx } from '../lib/text';
import { Icon } from './Icon';

export type ToastTone = 'ok' | 'error';
type ToastState = { message: string; tone: ToastTone } | null;

export function useToast() {
  const [toast, setToast] = useState<ToastState>(null);
  const [visible, setVisible] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  const notify = useCallback((message: string, tone: ToastTone = 'ok') => {
    setToast({ message, tone });
    setVisible(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setVisible(false), 2200);
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
        </>
      )}
    </div>
  );
}
