import { useEffect, useRef, useState } from 'react'
import { Check, Close } from './Icons'

type ReservationProps = {
  open: boolean
  origin: { x: number; y: number }
  onClose: () => void
}

type FormStatus = 'idle' | 'submitting' | 'success'

type FormErrors = { name?: string; contact?: string; consent?: string }

export function ReservationPanel({ open, origin, onClose }: ReservationProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [status, setStatus] = useState<FormStatus>('idle')
  const [errors, setErrors] = useState<FormErrors>({})

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) {
      setStatus('idle')
      setErrors({})
      dialog.showModal()
    } else if (!open && dialog.open) {
      dialog.close()
    }
  }, [open])

  const close = () => {
    if (status === 'submitting') return
    dialogRef.current?.close()
    onClose()
  }

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const name = String(data.get('name') ?? '').trim()
    const contact = String(data.get('contact') ?? '').trim()
    const nextErrors: FormErrors = {}
    if (name.length < 2) nextErrors.name = '请输入至少 2 个字符的称呼'
    if (!/^(?:1\d{10}|[^\s@]+@[^\s@]+\.[^\s@]+)$/.test(contact)) nextErrors.contact = '请输入有效的手机号或电子邮箱'
    if (data.get('consent') !== 'on') nextErrors.consent = '请先同意接收本次预约信息'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return
    setStatus('submitting')
    window.setTimeout(() => setStatus('success'), 1100)
  }

  return (
    <dialog
      ref={dialogRef}
      className="reservation-dialog"
      style={{ '--origin-x': `${origin.x}px`, '--origin-y': `${origin.y}px` } as React.CSSProperties}
      onCancel={(event) => { event.preventDefault(); close() }}
      onClose={() => open && onClose()}
      aria-labelledby="reservation-title"
    >
      <div className="dialog-material">
        <button className="icon-button dialog-close" type="button" onClick={close} disabled={status === 'submitting'} aria-label="关闭预约面板"><Close /></button>
        {status === 'success' ? (
          <div className="reservation-success" role="status">
            <div className="success-mark"><Check /></div>
            <span className="eyebrow">RESERVATION / RECEIVED</span>
            <h2 id="reservation-title">声场已为你保留。</h2>
            <p>试听顾问将在 24 小时内与你确认时间。到店时，只需报出你的称呼。</p>
            <div className="reservation-code"><span>预约序列</span><strong>N1—{new Date().getDate().toString().padStart(2, '0')}42</strong></div>
            <button className="button button-primary" type="button" onClick={close}>完成</button>
          </div>
        ) : (
          <form className="reservation-form" onSubmit={submit} noValidate>
            <span className="eyebrow">PRIVATE LISTENING / 01</span>
            <h2 id="reservation-title">预约一场私人声场。</h2>
            <p className="form-intro">留下联系方式，我们会为你安排 30 分钟沉浸式试听。</p>
            <div className="form-row">
              <label className={errors.name ? 'has-error' : ''}>
                <span>如何称呼你</span>
                <input name="name" autoComplete="name" placeholder="姓名" aria-invalid={!!errors.name} aria-describedby={errors.name ? 'name-error' : undefined} autoFocus />
                {errors.name && <small id="name-error">{errors.name}</small>}
              </label>
              <label className={errors.contact ? 'has-error' : ''}>
                <span>手机号或电子邮箱</span>
                <input name="contact" autoComplete="email" placeholder="用于确认试听时间" aria-invalid={!!errors.contact} aria-describedby={errors.contact ? 'contact-error' : undefined} />
                {errors.contact && <small id="contact-error">{errors.contact}</small>}
              </label>
            </div>
            <fieldset>
              <legend>偏好的城市</legend>
              <div className="city-options">
                {['上海', '北京', '深圳', '杭州'].map((city, index) => (
                  <label key={city}><input type="radio" name="city" value={city} defaultChecked={index === 0} /><span>{city}</span></label>
                ))}
              </div>
            </fieldset>
            <label className={`consent ${errors.consent ? 'has-error' : ''}`}><input type="checkbox" name="consent" aria-invalid={!!errors.consent} aria-describedby={errors.consent ? 'consent-error' : undefined} /><span>我同意接收本次预约相关信息</span></label>
            {errors.consent && <small className="consent-error" id="consent-error">{errors.consent}</small>}
            <button className="button button-primary form-submit" type="submit" disabled={status === 'submitting'}>
              <span>{status === 'submitting' ? '正在建立预约…' : '确认预约'}</span>
              {status === 'submitting' && <i className="spinner" aria-hidden="true" />}
            </button>
            <p className="privacy-note">你的信息只用于本次试听预约。</p>
          </form>
        )}
      </div>
    </dialog>
  )
}
