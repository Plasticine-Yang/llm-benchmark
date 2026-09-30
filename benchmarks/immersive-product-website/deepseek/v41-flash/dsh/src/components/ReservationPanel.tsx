import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from 'react';
import { createPortal } from 'react-dom';
import {
  Check,
  CheckCircle,
  SpinnerGap,
  WarningCircle,
  X,
} from '@phosphor-icons/react';

type Status = 'idle' | 'submitting' | 'success';

type Fields = {
  name: string;
  phone: string;
  city: string;
  store: string;
  optIn: boolean;
};

type Errors = Partial<Record<keyof Fields, string>>;

const CITIES = ['深圳', '上海', '北京', '广州', '成都', '杭州', '其他'];

const STORES = [
  { id: 'sz', label: '深圳万象天地店', meta: '每日 10:00 – 22:00' },
  { id: 'sh', label: '上海静安嘉里中心店', meta: '每日 10:00 – 22:00' },
  { id: 'bj', label: '北京三里屯太古里店', meta: '每日 10:00 – 22:00' },
];

const initial: Fields = {
  name: '',
  phone: '',
  city: '深圳',
  store: 'sz',
  optIn: true,
};

function validate(f: Fields): Errors {
  const e: Errors = {};
  if (!f.name.trim()) e.name = '请填写你的称呼';
  else if (f.name.trim().length < 2) e.name = '至少 2 个字符';
  if (!f.phone.trim()) e.phone = '请填写手机号';
  else if (!/^1[3-9]\d{9}$/.test(f.phone.replace(/\s|-/g, '')))
    e.phone = '请填写有效的 11 位中国大陆手机号';
  if (!f.store) e.store = '请选择试听门店';
  return e;
}

function makeCode() {
  const s = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < 5; i++)
    out += s[Math.floor(Math.random() * s.length)];
  return `N1-${out}`;
}

export function ReservationPanel({
  origin,
  colorwayLabel,
  onClose,
}: {
  origin: DOMRect | null;
  colorwayLabel: string;
  onClose: () => void;
}) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const firstFieldRef = useRef<HTMLInputElement | null>(null);
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [status, setStatus] = useState<Status>('idle');
  const [fields, setFields] = useState<Fields>(initial);
  const [errors, setErrors] = useState<Errors>({});
  const [submitted, setSubmitted] = useState(false);
  const [code, setCode] = useState('');

  const storeLabel = useMemo(
    () => STORES.find((s) => s.id === fields.store)?.label ?? '',
    [fields.store],
  );

  /* --- position the reveal so it grows out of the button that opened it --- */
  useLayoutEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    const r = panel.getBoundingClientRect();
    const ox = origin ? origin.left + origin.width / 2 - r.left : r.width / 2;
    const oy = origin ? origin.top + origin.height / 2 - r.top : r.height / 2;
    panel.style.setProperty('--ox', `${ox.toFixed(1)}px`);
    panel.style.setProperty('--oy', `${oy.toFixed(1)}px`);
    const raf = requestAnimationFrame(() => setOpen(true));
    return () => cancelAnimationFrame(raf);
  }, [origin]);

  const close = useCallback(() => {
    setClosing(true);
    window.setTimeout(onClose, 260);
  }, [onClose]);

  /* ---------------------------------------- scroll lock + inert background */
  useEffect(() => {
    const app = document.getElementById('app-shell');
    document.body.dataset.locked = 'true';
    app?.setAttribute('aria-hidden', 'true');
    app?.setAttribute('inert', '');
    return () => {
      delete document.body.dataset.locked;
      app?.removeAttribute('aria-hidden');
      app?.removeAttribute('inert');
    };
  }, []);

  /* --------------------------------------------- focus + keyboard handling */
  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    const t = window.setTimeout(() => firstFieldRef.current?.focus(), 240);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        close();
        return;
      }
      if (e.key !== 'Tab') return;
      const nodes = Array.from(
        panel.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), select:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((n) => n.offsetParent !== null);
      if (!nodes.length) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      } else if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      }
    };

    document.addEventListener('keydown', onKey);
    return () => {
      window.clearTimeout(t);
      document.removeEventListener('keydown', onKey);
    };
  }, [close]);

  /* --------------------------------------------------------------- submit */
  const set = <K extends keyof Fields>(k: K, v: Fields[K]) => {
    setFields((prev) => ({ ...prev, [k]: v }));
    if (submitted) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[k];
        return next;
      });
    }
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    const found = validate(fields);
    setErrors(found);

    if (Object.keys(found).length) {
      setStatus('idle');
      const firstKey = (Object.keys(found) as (keyof Fields)[])[0];
      panelRef.current
        ?.querySelector<HTMLElement>(`[data-field="${firstKey}"]`)
        ?.focus();
      return;
    }

    setStatus('submitting');
    await new Promise((r) => window.setTimeout(r, 1400));
    setCode(makeCode());
    setStatus('success');
  };

  const reset = () => {
    setFields(initial);
    setErrors({});
    setSubmitted(false);
    setStatus('idle');
    setCode('');
    requestAnimationFrame(() => firstFieldRef.current?.focus());
  };

  const busy = status === 'submitting';

  return createPortal(
    <div
      className="rsv"
      data-open={open ? 'true' : 'false'}
      data-closing={closing ? 'true' : 'false'}
    >
      <button
        type="button"
        className="rsv__scrim"
        aria-label="关闭预约面板"
        tabIndex={-1}
        onClick={close}
      />

      <div
        className="rsv__panel glass"
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="rsv-title"
        aria-describedby="rsv-desc"
      >
        <div className="rsv__grip" aria-hidden="true" />

        <header className="rsv__head">
          <div>
            <p className="rsv__eyebrow mono">预约试听 / RESERVATION</p>
            <h2 className="rsv__title" id="rsv-title">
              {status === 'success' ? '预约成功。' : '留个联系方式。'}
            </h2>
          </div>
          <button
            type="button"
            className="rsv__close"
            onClick={close}
            aria-label="关闭预约面板"
          >
            <X size={16} weight="light" />
          </button>
        </header>

        {status === 'success' ? (
          <div className="rsv__success">
            <span className="rsv__seal" aria-hidden="true">
              <CheckCircle size={34} weight="light" />
            </span>
            <p className="rsv__success-lede" id="rsv-desc">
              我们已经为你保留了 <b>{storeLabel}</b> 的试听席位。
              试听顾问将在 24 小时内致电确认。
            </p>

            <dl className="rsv__summary">
              <div>
                <dt className="mono">预约编号</dt>
                <dd className="num rsv__code">{code}</dd>
              </div>
              <div>
                <dt className="mono">姓名</dt>
                <dd>{fields.name}</dd>
              </div>
              <div>
                <dt className="mono">手机号</dt>
                <dd className="num">
                  {fields.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')}
                </dd>
              </div>
              <div>
                <dt className="mono">门店</dt>
                <dd>{storeLabel}</dd>
              </div>
              <div>
                <dt className="mono">试听机型</dt>
                <dd>NOCTURNE ONE · {colorwayLabel}</dd>
              </div>
            </dl>

            <div className="rsv__success-actions">
              <button type="button" className="btn btn--primary" onClick={close}>
                <span className="btn__label">完成</span>
              </button>
              <button type="button" className="btn btn--ghost" onClick={reset}>
                <span className="btn__label">再预约一次</span>
              </button>
            </div>
          </div>
        ) : (
          <form className="rsv__form" onSubmit={onSubmit} noValidate>
            <p className="rsv__lede" id="rsv-desc">
              NOCTURNE ONE · 首批 500 台 · 试听免费，约 30 分钟。
            </p>

            <div className="field" data-invalid={errors.name ? 'true' : 'false'}>
              <label htmlFor="rsv-name">
                称呼 <span className="field__req">必填</span>
              </label>
              <input
                id="rsv-name"
                data-field="name"
                ref={firstFieldRef}
                type="text"
                autoComplete="name"
                placeholder="怎么称呼你"
                value={fields.name}
                disabled={busy}
                aria-invalid={errors.name ? 'true' : 'false'}
                aria-describedby={errors.name ? 'rsv-name-err' : undefined}
                onChange={(e) => set('name', e.target.value)}
                onBlur={() => submitted && setErrors(validate(fields))}
              />
              {errors.name && (
                <p className="field__error" id="rsv-name-err" role="alert">
                  <WarningCircle size={12} weight="fill" />
                  {errors.name}
                </p>
              )}
            </div>

            <div className="field" data-invalid={errors.phone ? 'true' : 'false'}>
              <label htmlFor="rsv-phone">
                手机号 <span className="field__req">必填</span>
              </label>
              <input
                id="rsv-phone"
                data-field="phone"
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                placeholder="11 位手机号"
                value={fields.phone}
                disabled={busy}
                aria-invalid={errors.phone ? 'true' : 'false'}
                aria-describedby={errors.phone ? 'rsv-phone-err' : undefined}
                onChange={(e) =>
                  set('phone', e.target.value.replace(/[^\d\s-]/g, '').slice(0, 15))
                }
                onBlur={() => submitted && setErrors(validate(fields))}
              />
              {errors.phone && (
                <p className="field__error" id="rsv-phone-err" role="alert">
                  <WarningCircle size={12} weight="fill" />
                  {errors.phone}
                </p>
              )}
            </div>

            <div className="rsv__row">
              <div className="field">
                <label htmlFor="rsv-city">所在城市</label>
                <div className="field__select">
                  <select
                    id="rsv-city"
                    data-field="city"
                    value={fields.city}
                    disabled={busy}
                    onChange={(e) => set('city', e.target.value)}
                  >
                    {CITIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="field">
                <label htmlFor="rsv-opt">产品资讯</label>
                <label className="check" htmlFor="rsv-opt">
                  <input
                    id="rsv-opt"
                    type="checkbox"
                    checked={fields.optIn}
                    disabled={busy}
                    onChange={(e) => set('optIn', e.target.checked)}
                  />
                  <span className="check__box" aria-hidden="true">
                    <Check size={10} weight="bold" />
                  </span>
                  <span className="check__label">接收新品与活动信息</span>
                </label>
              </div>
            </div>

            <fieldset
              className="field rsv__stores"
              data-invalid={errors.store ? 'true' : 'false'}
              disabled={busy}
            >
              <legend>
                试听门店 <span className="field__req">必填</span>
              </legend>
              <div className="rsv__store-list">
                {STORES.map((s) => (
                  <label
                    key={s.id}
                    className="store"
                    data-active={fields.store === s.id ? 'true' : 'false'}
                  >
                    <input
                      type="radio"
                      name="store"
                      data-field="store"
                      value={s.id}
                      checked={fields.store === s.id}
                      disabled={busy}
                      onChange={() => set('store', s.id)}
                    />
                    <span className="store__radio" aria-hidden="true" />
                    <span className="store__text">
                      <span className="store__label">{s.label}</span>
                      <span className="store__meta mono">{s.meta}</span>
                    </span>
                  </label>
                ))}
              </div>
              {errors.store && (
                <p className="field__error" role="alert">
                  <WarningCircle size={12} weight="fill" />
                  {errors.store}
                </p>
              )}
            </fieldset>

            <div className="rsv__submit">
              <button
                type="submit"
                className="btn btn--primary rsv__submit-btn"
                disabled={busy}
              >
                <span className="btn__label">
                  {busy ? (
                    <>
                      <SpinnerGap
                        size={15}
                        weight="bold"
                        className="rsv__spinner"
                        aria-hidden="true"
                      />
                      提交中…
                    </>
                  ) : (
                    '提交预约'
                  )}
                </span>
              </button>
              <button
                type="button"
                className="btn btn--quiet"
                onClick={close}
                disabled={busy}
              >
                <span className="btn__label">稍后再说</span>
              </button>
            </div>

            <p className="rsv__legal mono">
              提交即表示同意我们通过电话或短信与你联系。信息仅用于本次预约。
            </p>
          </form>
        )}
      </div>
    </div>,
    document.body,
  );
}
