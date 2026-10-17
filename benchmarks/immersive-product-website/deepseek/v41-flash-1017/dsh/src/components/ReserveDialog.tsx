import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { MagneticButton } from './MagneticButton'
import { ArrowUpRight, CheckIcon, ChevronDownIcon, CloseIcon } from './Icons'
import './ReserveDialog.css'

export type ReserveOrigin = { x: number; y: number } | null

type ReserveDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  origin: ReserveOrigin
}

type FormValues = {
  name: string
  phone: string
  city: string
  time: string
  consent: boolean
}

type FormErrors = Partial<Record<keyof FormValues, string>>
type FormStatus = 'default' | 'submitting' | 'success' | 'error'

const initialValues: FormValues = {
  name: '',
  phone: '',
  city: '',
  time: '',
  consent: false,
}

const cities = ['上海', '北京', '深圳', '成都', '杭州', '广州']
const timeSlots = [
  { value: '本周内', label: '本周内' },
  { value: '两周内', label: '两周内' },
  { value: '任意时间', label: '任意时间' },
]

const maskPhone = (phone: string) => {
  if (phone.length !== 11) return phone
  return `${phone.slice(0, 3)} ${phone.slice(3, 7).replace(/\d/g, '·')} ${phone.slice(7)}`
}

export function ReserveDialog({ open, onOpenChange, origin }: ReserveDialogProps) {
  const [values, setValues] = useState<FormValues>(initialValues)
  const [errors, setErrors] = useState<FormErrors>({})
  const [status, setStatus] = useState<FormStatus>('default')
  const [ticket, setTicket] = useState('')
  const [submitted, setSubmitted] = useState<FormValues>(initialValues)
  const contentRef = useRef<HTMLDivElement>(null)
  const nameRef = useRef<HTMLInputElement>(null)
  const successRef = useRef<HTMLDivElement>(null)
  const submitTimer = useRef<number | null>(null)

  useEffect(() => {
    if (!open) {
      if (submitTimer.current) window.clearTimeout(submitTimer.current)
      return
    }
    setValues(initialValues)
    setErrors({})
    setStatus('default')
    setTicket('')
    setSubmitted(initialValues)
  }, [open])

  useEffect(() => {
    if (status === 'success') {
      window.requestAnimationFrame(() => successRef.current?.focus({ preventScroll: true }))
    }
  }, [status])

  useEffect(() => {
    return () => {
      if (submitTimer.current) window.clearTimeout(submitTimer.current)
    }
  }, [])

  useLayoutEffect(() => {
    if (!open || !contentRef.current) return
    const rect = contentRef.current.getBoundingClientRect()
    const originX = origin ? Math.min(Math.max(origin.x - rect.left, 18), rect.width - 18) : rect.width / 2
    const originY = origin ? Math.min(Math.max(origin.y - rect.top, 18), rect.height - 18) : rect.height / 2
    contentRef.current.style.setProperty('--reveal-x', `${originX}px`)
    contentRef.current.style.setProperty('--reveal-y', `${originY}px`)
  }, [open, origin])

  const updateField = <K extends keyof FormValues>(key: K, value: FormValues[K]) => {
    setValues((current) => ({ ...current, [key]: value }))
    setErrors((current) => {
      if (!current[key]) return current
      const next = { ...current }
      delete next[key]
      return next
    })
    if (status === 'error') setStatus('default')
  }

  const validate = () => {
    const nextErrors: FormErrors = {}
    if (values.name.trim().length < 2) nextErrors.name = '请填写至少 2 个字符的称呼。'
    if (!/^1[3-9]\d{9}$/.test(values.phone)) nextErrors.phone = '请输入 11 位有效手机号码。'
    if (!values.city) nextErrors.city = '请选择试听城市。'
    if (!values.time) nextErrors.time = '请选择方便的时间。'
    if (!values.consent) nextErrors.consent = '请确认同意我们联系你安排试听。'
    return nextErrors
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (status === 'submitting') return
    const nextErrors = validate()
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      setStatus('error')
      const firstKey = Object.keys(nextErrors)[0]
      const field =
        firstKey === 'consent'
          ? contentRef.current?.querySelector<HTMLElement>('.reserve-consent input')
          : contentRef.current?.querySelector<HTMLElement>(
              `[data-field="${firstKey}"] input, [data-field="${firstKey}"] select, [data-field="${firstKey}"] button`,
            )
      field?.focus()
      return
    }

    setErrors({})
    setStatus('submitting')
    setSubmitted(values)
    if (submitTimer.current) window.clearTimeout(submitTimer.current)
    submitTimer.current = window.setTimeout(() => {
      const serial = String(Date.now()).slice(-6)
      setTicket(`N1-26-${serial}`)
      setStatus('success')
    }, 1250)
  }

  const hasErrors = Object.keys(errors).length > 0

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="reserve-overlay" />
        <Dialog.Content
          ref={contentRef}
          className="reserve-panel"
          onOpenAutoFocus={(event) => {
            if (status !== 'success') {
              event.preventDefault()
              nameRef.current?.focus()
            }
          }}
          aria-describedby="reservation-description"
        >
          <div className="reserve-panel__backdrop" aria-hidden="true" />
          <div className="reserve-panel__top">
            <div className="reserve-panel__mark">
              <span className="reserve-panel__mark-ring" aria-hidden="true" />
              <span className="mono">PRIVATE LISTENING / N° 001</span>
            </div>
            <Dialog.Close asChild>
              <button type="button" className="reserve-panel__close" aria-label="关闭预约面板">
                <CloseIcon width={18} height={18} />
              </button>
            </Dialog.Close>
          </div>

          {status !== 'success' ? (
            <>
              <div className="reserve-panel__heading">
                <Dialog.Title className="reserve-panel__title">把十分钟，留给一副耳机。</Dialog.Title>
                <Dialog.Description asChild>
                  <p id="reservation-description" className="reserve-panel__intro">
                    填写以下信息，我们会联系你确认一次一对一试听。没有推销，只有音乐。
                  </p>
                </Dialog.Description>
              </div>

              <div className="reserve-panel__meta">
                <span>试听时长 · 10 分钟</span>
                <span>可选城市 · {cities.length} 座</span>
                <span className="reserve-panel__meta-dot" aria-hidden="true" />
              </div>

              <form className="reserve-form" noValidate onSubmit={handleSubmit} aria-busy={status === 'submitting'}>
                <div className="reserve-form__row">
                  <div className="reserve-field" data-field="name">
                    <label htmlFor="reserve-name">如何称呼你</label>
                    <input
                      ref={nameRef}
                      id="reserve-name"
                      name="name"
                      type="text"
                      autoComplete="name"
                      placeholder="你的姓名"
                      value={values.name}
                      onChange={(event) => updateField('name', event.target.value)}
                      aria-invalid={Boolean(errors.name)}
                      aria-describedby={errors.name ? 'error-name' : undefined}
                      disabled={status === 'submitting'}
                    />
                    {errors.name ? (
                      <p className="reserve-field__error" id="error-name">
                        {errors.name}
                      </p>
                    ) : null}
                  </div>

                  <div className="reserve-field" data-field="phone">
                    <label htmlFor="reserve-phone">手机号码</label>
                    <input
                      id="reserve-phone"
                      name="phone"
                      type="tel"
                      inputMode="numeric"
                      autoComplete="tel"
                      placeholder="11 位手机号"
                      maxLength={11}
                      value={values.phone}
                      onChange={(event) => updateField('phone', event.target.value.replace(/\D/g, ''))}
                      aria-invalid={Boolean(errors.phone)}
                      aria-describedby={errors.phone ? 'error-phone' : undefined}
                      disabled={status === 'submitting'}
                    />
                    {errors.phone ? (
                      <p className="reserve-field__error" id="error-phone">
                        {errors.phone}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="reserve-form__row reserve-form__row--city">
                  <div className="reserve-field reserve-field--select" data-field="city">
                    <label htmlFor="reserve-city">试听城市</label>
                    <div className="reserve-select">
                      <select
                        id="reserve-city"
                        name="city"
                        value={values.city}
                        onChange={(event) => updateField('city', event.target.value)}
                        aria-invalid={Boolean(errors.city)}
                        aria-describedby={errors.city ? 'error-city' : undefined}
                        disabled={status === 'submitting'}
                      >
                        <option value="" disabled>
                          选择一座城市
                        </option>
                        {cities.map((city) => (
                          <option value={city} key={city}>
                            {city}
                          </option>
                        ))}
                      </select>
                      <ChevronDownIcon width={17} height={17} aria-hidden="true" />
                    </div>
                    {errors.city ? (
                      <p className="reserve-field__error" id="error-city">
                        {errors.city}
                      </p>
                    ) : null}
                  </div>
                  <div className="reserve-field reserve-field--times" data-field="time">
                    <span className="reserve-field__label" id="time-label">
                      方便的时间
                    </span>
                    <div className="reserve-time-options" role="group" aria-labelledby="time-label">
                      {timeSlots.map((slot) => (
                        <button
                          key={slot.value}
                          type="button"
                          data-active={values.time === slot.value}
                          aria-pressed={values.time === slot.value}
                          onClick={() => updateField('time', slot.value)}
                          disabled={status === 'submitting'}
                        >
                          {slot.label}
                        </button>
                      ))}
                    </div>
                    {errors.time ? (
                      <p className="reserve-field__error" id="error-time">
                        {errors.time}
                      </p>
                    ) : null}
                  </div>
                </div>

                <label className="reserve-consent" data-error={Boolean(errors.consent)}>
                  <input
                    type="checkbox"
                    checked={values.consent}
                    onChange={(event) => updateField('consent', event.target.checked)}
                    aria-invalid={Boolean(errors.consent)}
                    aria-describedby={errors.consent ? 'error-consent' : undefined}
                    disabled={status === 'submitting'}
                  />
                  <span className="reserve-consent__box" aria-hidden="true">
                    <CheckIcon width={11} height={11} />
                  </span>
                  <span>
                    我同意 NOCTURNE 通过电话或短信联系我，仅用于确认本次试听安排。
                  </span>
                </label>
                {errors.consent ? (
                  <p className="reserve-field__error reserve-consent__error" id="error-consent">
                    {errors.consent}
                  </p>
                ) : null}

                {hasErrors ? (
                  <p className="reserve-form__summary" role="alert">
                    请检查上方标注的信息后再提交。
                  </p>
                ) : null}

                <div className="reserve-form__footer">
                  <MagneticButton
                    type="submit"
                    className="btn--primary btn--full"
                    magnetic={false}
                    fullWidth
                    disabled={status === 'submitting'}
                  >
                    {status === 'submitting' ? (
                      <>
                        <span className="reserve-form__submitting">
                          <span className="reserve-spinner" aria-hidden="true" />
                          正在提交预约
                        </span>
                        <span className="btn__orb" aria-hidden="true">
                          <span className="reserve-pulse" />
                        </span>
                      </>
                    ) : (
                      <>
                        提交预约
                        <span className="btn__orb" aria-hidden="true">
                          <ArrowUpRight />
                        </span>
                      </>
                    )}
                  </MagneticButton>
                  <p className="reserve-form__privacy">
                    你的信息仅用于本次试听预约，我们会在 1 个工作日内联系你。
                  </p>
                </div>
              </form>
            </>
          ) : (
            <div className="reserve-success" ref={successRef} tabIndex={-1}>
              <div className="reserve-success__glyph" aria-hidden="true">
                <span className="reserve-success__orbit" />
                <span className="reserve-success__check">
                  <CheckIcon width={28} height={28} />
                </span>
              </div>
              <span className="mono reserve-success__eyebrow">RESERVATION CONFIRMED</span>
              <Dialog.Title asChild>
                <h3>已经为你留好位置。</h3>
              </Dialog.Title>
              <Dialog.Description className="sr-only" id="reservation-description">
                你的预约信息已收到。
              </Dialog.Description>
              <p className="reserve-success__intro">
                我们会在 1 个工作日内联系 {submitted.name.trim()}，确认 {submitted.city} 的试听时间。
              </p>

              <div className="reserve-receipt">
                <div>
                  <span>预约编号</span>
                  <strong className="mono">{ticket}</strong>
                </div>
                <div>
                  <span>联系方式</span>
                  <strong className="mono">{maskPhone(submitted.phone)}</strong>
                </div>
                <div>
                  <span>试听时间</span>
                  <strong>{submitted.time}</strong>
                </div>
                <div>
                  <span>试听地点</span>
                  <strong>{submitted.city} · NOCTURNE 私人声学空间</strong>
                </div>
              </div>

              <p className="reserve-success__note">
                凭预约编号到店即可。如需调整时间，直接回复确认短信即可。
              </p>

              <Dialog.Close asChild>
                <button type="button" className="btn btn--ink reserve-success__close">
                  完成
                  <span className="btn__orb" aria-hidden="true">
                    <ArrowUpRight />
                  </span>
                </button>
              </Dialog.Close>
            </div>
          )}

          <div className="reserve-panel__foot" aria-hidden="true">
            <span className="mono">NOCTURNE / RESERVATION DESK</span>
            <span className="reserve-panel__foot-line" />
            <span className="mono">BERLIN · SHANGHAI</span>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
