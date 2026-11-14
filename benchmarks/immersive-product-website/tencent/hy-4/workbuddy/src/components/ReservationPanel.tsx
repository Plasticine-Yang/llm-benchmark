import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { useDialog } from '../lib/hooks'
import { ArrowRight, Check, Close, Spinner } from '../lib/icons'
import { MagneticButton } from './MagneticButton'

type Status = 'default' | 'error' | 'submitting' | 'success'
type Fields = { name: string; contact: string; city: string; slot: string }
type Errors = Partial<Record<keyof Fields, string>>

const EMPTY: Fields = { name: '', contact: '', city: '', slot: '' }
const CITIES = ['上海 · 安福路听音室', '北京 · 三里屯听音室', '深圳 · 万象天地', '成都 · 太古里']
const SLOTS = ['工作日下午', '工作日晚间', '周末']

function validate(f: Fields): Errors {
  const e: Errors = {}
  if (f.name.trim().length < 2) e.name = '请填写至少 2 个字的称呼'
  const phone = /^1[3-9]\d{9}$/
  const mail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!phone.test(f.contact.trim()) && !mail.test(f.contact.trim())) e.contact = '请填写有效的手机号或邮箱'
  if (!f.city) e.city = '请选择试听城市'
  if (!f.slot) e.slot = '请选择方便的时段'
  return e
}

export function ReservationPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [phase, setPhase] = useState<'idle' | 'enter' | 'exit'>('idle')
  const [status, setStatus] = useState<Status>('default')
  const [fields, setFields] = useState<Fields>(EMPTY)
  const [errors, setErrors] = useState<Errors>({})
  const [code, setCode] = useState('')
  const panelRef = useRef<HTMLDivElement>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const timerRef = useRef<number>(0)

  useDialog(open, onClose, panelRef)

  useEffect(() => {
    if (open) {
      setPhase('enter')
      setStatus('default')
      setFields(EMPTY)
      setErrors({})
    } else {
      setPhase((p) => (p === 'idle' ? 'idle' : 'exit'))
      const t = window.setTimeout(() => setPhase('idle'), 520)
      return () => window.clearTimeout(t)
    }
  }, [open])

  useEffect(() => () => window.clearTimeout(timerRef.current), [])

  // The panel mounts one render after `open` flips, so focus it explicitly.
  useEffect(() => {
    if (!open || phase !== 'enter') return
    const t = window.setTimeout(() => {
      const target = panelRef.current?.querySelector<HTMLElement>('[name="name"]') ?? panelRef.current
      target?.focus()
    }, 90)
    return () => window.clearTimeout(t)
  }, [open, phase, status])

  const set = (key: keyof Fields, value: string) => {
    setFields((f) => ({ ...f, [key]: value }))
    setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev))
  }

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (status === 'submitting') return
    const found = validate(fields)
    setErrors(found)
    if (Object.keys(found).length) {
      setStatus('error')
      const first = Object.keys(found)[0]
      formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus()
      return
    }
    setStatus('submitting')
    timerRef.current = window.setTimeout(() => {
      setCode(`NO-2026-${Math.floor(1000 + Math.random() * 9000)}`)
      setStatus('success')
    }, 1350)
  }

  if (phase === 'idle') return null

  return (
    <div
      className={`overlay ${phase === 'enter' ? 'is-open' : ''} ${phase === 'exit' ? 'is-closing' : ''}`}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="overlay__veil" onClick={onClose} aria-hidden="true" />
      <div
        className="overlay__panel glass glass--deep"
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="reserve-title"
        tabIndex={-1}
      >
        <div className="overlay__head">
          <div>
            <span className="mono-label">PRIVATE LISTENING / 预约试听</span>
            <h2 className="display" id="reserve-title">留一段安静给你。</h2>
          </div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="关闭预约面板" disabled={status === 'submitting'}>
            <Close size={17} />
          </button>
        </div>

        {status === 'success' ? (
          <div className="reserve__success" role="status" aria-live="polite">
            <div className="reserve__success-mark"><Check size={30} /></div>
            <h3>预约已确认</h3>
            <p>我们会在 24 小时内与你联系，确认试听时间与座位。</p>
            <div className="reserve__ticket">
              <div><span className="mono-label">RESERVATION CODE</span><strong className="num">{code}</strong></div>
              <div><span className="mono-label">LOCATION</span><strong>{fields.city}</strong></div>
              <div><span className="mono-label">PREFERRED TIME</span><strong>{fields.slot}</strong></div>
            </div>
            <div className="reserve__success-actions">
              <MagneticButton className="btn--wide" onClick={onClose}>完成 <ArrowRight size={16} /></MagneticButton>
              <button
                type="button"
                className="btn btn--ghost btn--wide"
                onClick={() => { setStatus('default'); setFields(EMPTY); setErrors({}) }}
              >
                <span className="btn__label">再预约一位</span>
              </button>
            </div>
          </div>
        ) : (
          <form className="reserve" onSubmit={onSubmit} ref={formRef} noValidate>
            <p className="reserve__intro">
              留下联系方式，我们将在 NOCTURNE 听音室为你预留 30 分钟，只放一张椅子，只播放你熟悉的音乐。
            </p>

            <div className="reserve__grid">
              <label className="field">
                <span className="field__label">称呼 <i>*</i></span>
                <input
                  name="name"
                  type="text"
                  autoComplete="name"
                  placeholder="如何称呼你"
                  value={fields.name}
                  onChange={(e) => set('name', e.target.value)}
                  aria-invalid={!!errors.name}
                  aria-describedby={errors.name ? 'err-name' : undefined}
                  disabled={status === 'submitting'}
                />
                {errors.name && <span className="field__error" id="err-name">{errors.name}</span>}
              </label>

              <label className="field">
                <span className="field__label">手机号 / 邮箱 <i>*</i></span>
                <input
                  name="contact"
                  type="text"
                  inputMode="text"
                  autoComplete="email"
                  placeholder="用于确认预约"
                  value={fields.contact}
                  onChange={(e) => set('contact', e.target.value)}
                  aria-invalid={!!errors.contact}
                  aria-describedby={errors.contact ? 'err-contact' : undefined}
                  disabled={status === 'submitting'}
                />
                {errors.contact && <span className="field__error" id="err-contact">{errors.contact}</span>}
              </label>

              <label className="field field--full">
                <span className="field__label">试听地点 <i>*</i></span>
                <select
                  name="city"
                  value={fields.city}
                  onChange={(e) => set('city', e.target.value)}
                  aria-invalid={!!errors.city}
                  disabled={status === 'submitting'}
                >
                  <option value="">选择一间听音室</option>
                  {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                {errors.city && <span className="field__error">{errors.city}</span>}
              </label>

              <fieldset className="field field--full slot-field">
                <legend className="field__label">方便时段 <i>*</i></legend>
                <div className="slot-field__options">
                  {SLOTS.map((s) => (
                    <label key={s} className={`slot ${fields.slot === s ? 'is-active' : ''}`}>
                      <input
                        type="radio"
                        name="slot"
                        value={s}
                        checked={fields.slot === s}
                        onChange={() => set('slot', s)}
                        disabled={status === 'submitting'}
                      />
                      {s}
                    </label>
                  ))}
                </div>
                {errors.slot && <span className="field__error">{errors.slot}</span>}
              </fieldset>
            </div>

            <div className="reserve__status" aria-live="polite">
              {status === 'error' && <span className="reserve__status-error">请检查标记的 {Object.keys(errors).length} 处信息后再提交。</span>}
              {status === 'submitting' && <span className="reserve__status-info"><Spinner size={14} /> 正在为你锁定听音室…</span>}
              {status === 'default' && <span className="mono-label">30 MIN / ONE SEAT / ONE PAIR OF HEADPHONES</span>}
            </div>

            <div className="reserve__actions">
              <button type="button" className="btn btn--ghost" onClick={onClose} disabled={status === 'submitting'}>
                <span className="btn__label">稍后再说</span>
              </button>
              <MagneticButton type="submit" disabled={status === 'submitting'} magnetic={status !== 'submitting'}>
                {status === 'submitting' ? <><Spinner size={16} /> 提交中…</> : <>确认预约 <ArrowRight size={16} /></>}
              </MagneticButton>
            </div>
          </form>
        )}

        <div className="overlay__foot mono-label">
          <span>NOCTURNE ACOUSTICS / SHANGHAI</span>
          <span>YOUR INFORMATION STAYS PRIVATE</span>
        </div>
      </div>
    </div>
  )
}
