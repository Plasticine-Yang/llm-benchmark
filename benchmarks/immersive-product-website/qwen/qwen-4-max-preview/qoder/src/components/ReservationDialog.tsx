import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type FormEvent,
} from 'react';
import { FINISHES, finishByKey, type FinishKey } from '../lib/finishes';
import { useDialog, useReducedMotion } from '../lib/hooks';
import { IconAlert, IconArrowRight, IconCheck, IconX } from './icons';

export interface ReservationResult {
  code: string;
  name: string;
  city: string;
  finish: FinishKey;
}

export interface DialogOrigin {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface ReservationDialogProps {
  open: boolean;
  origin: DialogOrigin | null;
  existing: ReservationResult | null;
  defaultFinish: FinishKey;
  onClose: () => void;
  onReserved: (r: ReservationResult) => void;
  onReset: () => void;
}

const CITIES = ['上海', '北京', '深圳', '成都', '杭州', '广州', '其他城市'];

type Status = 'idle' | 'submitting' | 'success';
type Errors = Partial<Record<'name' | 'phone' | 'city', string>>;

export function ReservationDialog({
  open,
  origin,
  existing,
  defaultFinish,
  onClose,
  onReserved,
  onReset,
}: ReservationDialogProps) {
  const reduced = useReducedMotion();
  const panelRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const cityRef = useRef<HTMLSelectElement>(null);
  const timerRef = useRef(0);

  const [entered, setEntered] = useState(false);
  const [closing, setClosing] = useState(false);
  const [status, setStatus] = useState<Status>('idle');
  const [result, setResult] = useState<ReservationResult | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [finish, setFinish] = useState<FinishKey>(defaultFinish);
  const [errors, setErrors] = useState<Errors>({});

  useDialog(open && !closing, onClose, panelRef);

  useLayoutEffect(() => {
    if (!open) {
      setEntered(false);
      return;
    }
    setClosing(false);
    setErrors({});
    setFinish(defaultFinish);
    if (existing) {
      setResult(existing);
      setStatus('success');
    } else {
      setStatus('idle');
      setResult(null);
    }
    const panel = panelRef.current;
    if (!panel) return;
    if (origin && !reduced) {
      const rect = panel.getBoundingClientRect();
      const dx = origin.x + origin.w / 2 - (rect.left + rect.width / 2);
      const dy = origin.y + origin.h / 2 - (rect.top + rect.height / 2);
      const sx = Math.max(origin.w / rect.width, 0.04);
      const sy = Math.max(origin.h / rect.height, 0.04);
      panel.style.transition = 'none';
      panel.style.transform = `translate(${dx}px, ${dy}px) scale(${sx.toFixed(3)}, ${sy.toFixed(3)})`;
      panel.style.opacity = '0';
      void panel.offsetWidth;
      requestAnimationFrame(() => {
        panel.style.transition = '';
        panel.style.transform = '';
        panel.style.opacity = '';
        setEntered(true);
      });
    } else {
      setEntered(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => () => window.clearTimeout(timerRef.current), []);

  const requestClose = () => {
    if (closing) return;
    const panel = panelRef.current;
    if (reduced || !panel) {
      onClose();
      return;
    }
    setClosing(true);
    if (origin) {
      const rect = panel.getBoundingClientRect();
      const dx = origin.x + origin.w / 2 - (rect.left + rect.width / 2);
      const dy = origin.y + origin.h / 2 - (rect.top + rect.height / 2);
      const sx = Math.max(origin.w / rect.width, 0.04);
      const sy = Math.max(origin.h / rect.height, 0.04);
      panel.style.transform = `translate(${dx}px, ${dy}px) scale(${sx.toFixed(3)}, ${sy.toFixed(3)})`;
    } else {
      panel.style.transform = 'scale(0.95)';
    }
    timerRef.current = window.setTimeout(() => {
      setClosing(false);
      onClose();
    }, 380);
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (status === 'submitting') return;
    const next: Errors = {};
    if (!name.trim()) next.name = '请输入你的称呼';
    if (!/^1[3-9]\d{9}$/.test(phone.trim())) next.phone = '请输入有效的 11 位手机号';
    if (!city) next.city = '请选择试听城市';
    setErrors(next);
    if (Object.keys(next).length > 0) {
      if (next.name) nameRef.current?.focus();
      else if (next.phone) phoneRef.current?.focus();
      else cityRef.current?.focus();
      return;
    }
    setStatus('submitting');
    timerRef.current = window.setTimeout(() => {
      const r: ReservationResult = {
        code: `NC-${String(Math.floor(100000 + Math.random() * 900000))}`,
        name: name.trim(),
        city,
        finish,
      };
      setResult(r);
      setStatus('success');
      onReserved(r);
    }, 1400);
  };

  const startOver = () => {
    onReset();
    setResult(null);
    setStatus('idle');
    setName('');
    setPhone('');
    setCity('');
    setErrors({});
    window.setTimeout(() => nameRef.current?.focus(), 60);
  };

  if (!open) return null;

  const busy = status === 'submitting';

  return (
    <>
      <div
        className={`dialog-backdrop ${entered && !closing ? 'is-open' : ''}`}
        onClick={requestClose}
        aria-hidden
      />
      <div className="dialog-shell">
        <div
          ref={panelRef}
          className={`dialog-panel glass ${entered ? 'is-open' : ''} ${closing ? 'is-closing' : ''}`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="reserve-title"
        >
          <button type="button" className="icon-btn dialog-close" onClick={requestClose} aria-label="关闭预约面板">
            <IconX size={16} />
          </button>

          {status === 'success' && result ? (
            <div className="success">
              <svg className="success-mark" viewBox="0 0 74 74" fill="none" aria-hidden>
                <circle cx="37" cy="37" r="33" stroke="#86b092" strokeWidth="1.6" />
                <path d="M24 38.5 33.5 48 51 28" stroke="#86b092" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <h3 id="reserve-title">预约成功</h3>
              <p>
                {result.name}，我们已为你预留{result.city}试听空间 ·{' '}
                {finishByKey(result.finish).name}。顾问将在 24 小时内致电确认。
              </p>
              <div className="success-code">{result.code}</div>
              <button type="button" className="btn btn-primary" onClick={requestClose} data-autofocus>
                <IconCheck size={16} />
                完成
              </button>
              <button type="button" className="success-again" onClick={startOver}>
                重新预约
              </button>
            </div>
          ) : (
            <>
              <h3 className="dialog-title" id="reserve-title">预约试听</h3>
              <p className="dialog-sub">
                留下联系方式，我们将在 24 小时内为你安排最近的试听空间。
              </p>
              <form className="form" onSubmit={submit} noValidate>
                <div className="field" data-error={Boolean(errors.name)}>
                  <label htmlFor="rv-name">称呼</label>
                  <input
                    id="rv-name"
                    ref={nameRef}
                    type="text"
                    value={name}
                    maxLength={20}
                    autoComplete="name"
                    placeholder="怎么称呼你？"
                    disabled={busy}
                    data-autofocus
                    aria-invalid={Boolean(errors.name)}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (errors.name) setErrors((p) => ({ ...p, name: undefined }));
                    }}
                  />
                  {errors.name && (
                    <span className="field-error">
                      <IconAlert />
                      {errors.name}
                    </span>
                  )}
                </div>
                <div className="field" data-error={Boolean(errors.phone)}>
                  <label htmlFor="rv-phone">手机号</label>
                  <input
                    id="rv-phone"
                    ref={phoneRef}
                    type="tel"
                    inputMode="numeric"
                    value={phone}
                    maxLength={11}
                    autoComplete="tel"
                    placeholder="11 位手机号"
                    disabled={busy}
                    aria-invalid={Boolean(errors.phone)}
                    onChange={(e) => {
                      setPhone(e.target.value.replace(/\D/g, ''));
                      if (errors.phone) setErrors((p) => ({ ...p, phone: undefined }));
                    }}
                  />
                  {errors.phone && (
                    <span className="field-error">
                      <IconAlert />
                      {errors.phone}
                    </span>
                  )}
                </div>
                <div className="field" data-error={Boolean(errors.city)}>
                  <label htmlFor="rv-city">试听城市</label>
                  <select
                    id="rv-city"
                    ref={cityRef}
                    value={city}
                    disabled={busy}
                    aria-invalid={Boolean(errors.city)}
                    onChange={(e) => {
                      setCity(e.target.value);
                      if (errors.city) setErrors((p) => ({ ...p, city: undefined }));
                    }}
                  >
                    <option value="" disabled>
                      请选择城市
                    </option>
                    {CITIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  {errors.city && (
                    <span className="field-error">
                      <IconAlert />
                      {errors.city}
                    </span>
                  )}
                </div>
                <div className="field">
                  <label htmlFor="rv-finish">意向配色</label>
                  <select
                    id="rv-finish"
                    value={finish}
                    disabled={busy}
                    onChange={(e) => setFinish(e.target.value as FinishKey)}
                  >
                    {FINISHES.map((f) => (
                      <option key={f.key} value={f.key}>
                        {f.name} · {f.en}
                      </option>
                    ))}
                  </select>
                </div>
                <button type="submit" className="btn btn-primary form-submit" disabled={busy}>
                  {busy ? (
                    <>
                      <span className="spinner" aria-hidden />
                      正在提交…
                    </>
                  ) : (
                    <>
                      提交预约
                      <IconArrowRight size={16} />
                    </>
                  )}
                </button>
                <p className="form-note">信息仅用于试听安排 · 不会用于任何营销推送</p>
              </form>
            </>
          )}
        </div>
      </div>
    </>
  );
}