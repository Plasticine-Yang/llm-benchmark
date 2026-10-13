import { useCallback, useId, useRef, useState, type FormEvent } from 'react'
import { ArrowRight, CheckCircle, WarningCircle } from '@phosphor-icons/react'
import { CITIES, FINISHES } from '../data'
import { closeReservation, reserveStore, useDialogRequest, useFinish } from '../store'
import { GlassDialog } from './GlassDialog'

type Status = 'idle' | 'submitting' | 'success' | 'error'
type Errors = Partial<Record<'name' | 'phone' | 'city' | 'slot' | 'consent' | 'form', string>>

const SLOTS = ['工作日 · 白天', '工作日 · 晚间', '周末']

function validate(fd: FormData): Errors {
  const e: Errors = {}
  const name = String(fd.get('name') ?? '').trim()
  const phone = String(fd.get('phone') ?? '').replace(/\s|-/g, '')
  if (name.length < 2) e.name = '请填写至少 2 个字的称呼'
  if (!/^1[3-9]\d{9}$/.test(phone)) e.phone = '请输入 11 位中国大陆手机号'
  if (!fd.get('city')) e.city = '请选择一间聆听室'
  if (!fd.get('slot')) e.slot = '请选择一个时段'
  if (!fd.get('consent')) e.consent = '需要同意后我们才能联系你'
  return e
}

/** Simulated network call; a phone number ending in 0000 exercises the server-error path. */
function submitReservation(phone: string) {
  return new Promise<{ code: string }>((resolve, reject) => {
    window.setTimeout(() => {
      if (phone.endsWith('0000')) reject(new Error('该时段名额已满，请换一个时段或城市再试。'))
      else resolve({ code: `NC-${Math.random().toString(36).slice(2, 6).toUpperCase()}` })
    }, 1400)
  })
}

export function ReservationPanel() {
  const req = useDialogRequest(reserveStore)
  const [formKey, setFormKey] = useState(0)

  // Reset the form after the close animation, so reopening always starts fresh.
  const onClosed = useCallback(() => setFormKey((k) => k + 1), [])

  return (
    <GlassDialog open={req.open} origin={req.origin} onClose={closeReservation} labelledBy="reserve-title" onClosed={onClosed} className="max-w-[520px]">
      <ReservationForm key={formKey} />
    </GlassDialog>
  )
}

function ReservationForm() {
  const finish = useFinish()
  const finishName = FINISHES.find((f) => f.id === finish)!.name
  const [status, setStatus] = useState<Status>('idle')
  const [errors, setErrors] = useState<Errors>({})
  const [result, setResult] = useState<{ code: string; city: string; slot: string; name: string } | null>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const uid = useId()
  const fid = (n: string) => `${uid}-${n}`
  const submitting = status === 'submitting'

  const onSubmit = async (ev: FormEvent<HTMLFormElement>) => {
    ev.preventDefault()
    if (submitting) return
    const fd = new FormData(ev.currentTarget)
    const errs = validate(fd)
    setErrors(errs)
    if (Object.keys(errs).length) {
      setStatus('error')
      const first = Object.keys(errs)[0]
      const el = formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)
      el?.focus()
      return
    }
    setStatus('submitting')
    try {
      const phone = String(fd.get('phone')).replace(/\s|-/g, '')
      const { code } = await submitReservation(phone)
      setResult({ code, city: String(fd.get('city')), slot: String(fd.get('slot')), name: String(fd.get('name')).trim() })
      setStatus('success')
    } catch (err) {
      setErrors({ form: (err as Error).message })
      setStatus('error')
    }
  }

  const clearError = (k: keyof Errors) => {
    if (errors[k] || errors.form) setErrors((e) => ({ ...e, [k]: undefined, form: undefined }))
  }

  if (status === 'success' && result) {
    return (
      <div className="p-7 sm:p-10" role="status" aria-live="polite">
        <CheckCircle size={40} weight="light" className="text-amber-soft" aria-hidden="true" />
        <h2 id="reserve-title" className="mt-5 text-[26px] font-semibold tracking-[-0.02em] text-ice-50">已为你保留席位</h2>
        <p className="mt-3 text-[14.5px] leading-[1.8] text-ice-300">{result.name}，我们会在 24 小时内通过短信确认具体时间。试听时请佩戴日常使用的眼镜或耳饰，以便 HRTF 扫描更准确。</p>
        <dl className="mt-7 divide-y divide-white/[0.07] border-y border-white/[0.07] text-[14px]">
          {[
            ['预约编号', result.code],
            ['聆听室', result.city],
            ['时段', result.slot],
            ['试听配色', finishName],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between py-3">
              <dt className="text-ice-500">{k}</dt>
              <dd className={k === '预约编号' ? 'mono text-amber-soft' : 'text-ice-100'}>{v}</dd>
            </div>
          ))}
        </dl>
        <button type="button" className="btn btn-glass mt-8 w-full" onClick={closeReservation}>完成</button>
      </div>
    )
  }

  return (
    <form ref={formRef} noValidate onSubmit={onSubmit} className="p-7 sm:p-10" aria-busy={submitting}>
      <p className="eyebrow">Private Listening</p>
      <h2 id="reserve-title" className="mt-3 text-[26px] font-semibold tracking-[-0.02em] text-ice-50">预约试听</h2>
      <p className="mt-2 text-[14px] leading-[1.7] text-ice-400">30 分钟一对一聆听，含个性化 HRTF 耳廓扫描。免费。</p>

      {errors.form && (
        <div role="alert" className="mt-6 flex items-start gap-2.5 rounded-2xl border border-[rgba(232,128,104,0.35)] bg-[rgba(232,128,104,0.07)] px-4 py-3 text-[13.5px] text-[#f0b6a6]">
          <WarningCircle size={18} className="mt-px flex-none" aria-hidden="true" />
          {errors.form}
        </div>
      )}

      <fieldset disabled={submitting} className="mt-7 grid gap-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field id={fid('name')} label="称呼" error={errors.name}>
            <input id={fid('name')} name="name" className="field" autoComplete="name" placeholder="例如：林先生" aria-invalid={!!errors.name} aria-describedby={errors.name ? fid('name-err') : undefined} onInput={() => clearError('name')} />
          </Field>
          <Field id={fid('phone')} label="手机号" error={errors.phone}>
            <input id={fid('phone')} name="phone" className="field mono tabular" type="tel" inputMode="numeric" autoComplete="tel" placeholder="138 0000 0000" maxLength={13} aria-invalid={!!errors.phone} aria-describedby={errors.phone ? fid('phone-err') : undefined} onInput={() => clearError('phone')} />
          </Field>
        </div>
        <Field id={fid('city')} label="聆听室" error={errors.city}>
          <select id={fid('city')} name="city" className="field" defaultValue="" aria-invalid={!!errors.city} aria-describedby={errors.city ? fid('city-err') : undefined} onChange={() => clearError('city')}>
            <option value="" disabled>选择城市</option>
            {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </Field>
        <fieldset aria-describedby={errors.slot ? fid('slot-err') : undefined}>
          <legend className="mb-2 text-[13px] text-ice-400">偏好时段</legend>
          <div className="grid grid-cols-3 gap-2">
            {SLOTS.map((s) => (
              <label key={s} className="relative">
                <input type="radio" name="slot" value={s} className="chip-input" onChange={() => clearError('slot')} />
                <span className="chip w-full text-center text-[13px]">{s}</span>
              </label>
            ))}
          </div>
          {errors.slot && <p id={fid('slot-err')} className="mt-2 text-[12.5px] text-[#f0a28f]">{errors.slot}</p>}
        </fieldset>
        <div>
          <label className="flex cursor-pointer items-start gap-3 text-[13px] leading-[1.6] text-ice-400">
            <input type="checkbox" name="consent" className="mt-0.5 h-4 w-4 flex-none accent-[#c99a64]" aria-invalid={!!errors.consent} aria-describedby={errors.consent ? fid('consent-err') : undefined} onChange={() => clearError('consent')} />
            同意 NOCTURNE 通过短信联系我确认预约，信息仅用于本次试听。
          </label>
          {errors.consent && <p id={fid('consent-err')} className="mt-2 text-[12.5px] text-[#f0a28f]">{errors.consent}</p>}
        </div>
      </fieldset>

      <button type="submit" className="btn btn-primary mt-8 w-full !min-h-[52px]" disabled={submitting}>
        <span className="btn-label">
          {submitting ? (<><span className="spinner" aria-hidden="true" />正在提交…</>) : (<>确认预约<ArrowRight size={16} className="arrow" aria-hidden="true" /></>)}
        </span>
      </button>
      <p className="sr-only" aria-live="assertive">{submitting ? '正在提交预约' : status === 'error' ? '表单有错误，请检查' : ''}</p>
      <p className="mt-4 text-center text-[11.5px] text-ice-500">提示：尾号 0000 可体验名额已满的提交失败流程。</p>
    </form>
  )
}

function Field({ id, label, error, children }: { id: string; label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-[13px] text-ice-400">{label}</label>
      {children}
      {error && <p id={`${id}-err`} className="mt-2 text-[12.5px] text-[#f0a28f]">{error}</p>}
    </div>
  )
}
