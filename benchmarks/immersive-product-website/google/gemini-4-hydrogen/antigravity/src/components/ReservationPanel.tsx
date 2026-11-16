import {
  Check,
  CheckCircle,
  WarningCircle,
  X,
} from '@phosphor-icons/react'
import { useEffect, useId, useRef, useState } from 'react'
import {
  FINISHES,
  FINISH_ORDER,
  LISTENING_STUDIOS,
  TIME_SLOTS,
} from '../data/productData'
import type {
  FinishId,
  ReservationMode,
  ReservationOrigin,
} from '../types/product'

interface ReservationPanelProps {
  isOpen: boolean
  mode: ReservationMode
  originRect: ReservationOrigin | null
  initialFinish: FinishId
  onClose: () => void
  onSwitchMode?: (mode: ReservationMode) => void
}

type FormStatus = 'default' | 'validation-error' | 'submitting' | 'success'

interface FieldErrors {
  name?: string
  contact?: string
}

const DELIVERY_CITIES = [
  '上海市 · 优先顺丰专送',
  '北京市 · 优先顺丰专送',
  '深圳市 · 优先顺丰专送',
  '广州市 · 优先顺丰专送',
  '杭州市 · 优先顺丰专送',
  '成都市 · 优先顺丰专送',
  '其他城市 · 全国直邮',
]

export function ReservationPanel({
  isOpen,
  mode,
  originRect,
  initialFinish,
  onClose,
  onSwitchMode,
}: ReservationPanelProps) {
  const titleId = useId()
  const panelRef = useRef<HTMLDivElement | null>(null)
  const nameInputRef = useRef<HTMLInputElement | null>(null)
  const contactInputRef = useRef<HTMLInputElement | null>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  const [status, setStatus] = useState<FormStatus>('default')
  const [name, setName] = useState('')
  const [contact, setContact] = useState('')
  const [selectedFinish, setSelectedFinish] = useState<FinishId>(initialFinish)
  const [studio, setStudio] = useState(LISTENING_STUDIOS[0])
  const [city, setCity] = useState(DELIVERY_CITIES[0])
  const [slot, setSlot] = useState(TIME_SLOTS[0])
  const [engraving, setEngraving] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})
  const [passCode, setPassCode] = useState('NC1-2026-0842')

  // Focus management & scroll lock while panel is mounted
  useEffect(() => {
    if (!isOpen) return

    previousFocusRef.current = document.activeElement as HTMLElement | null

    const focusTimer = window.setTimeout(() => {
      nameInputRef.current?.focus()
    }, 60)

    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      window.clearTimeout(focusTimer)
      document.body.style.overflow = prevOverflow
      previousFocusRef.current?.focus?.()
    }
  }, [isOpen])

  // Keyboard navigation: Escape to close + focus trap inside panel
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        if (status !== 'submitting') {
          onClose()
        }
        return
      }

      if (e.key === 'Tab' && panelRef.current) {
        const focusables = Array.from(
          panelRef.current.querySelectorAll<HTMLElement>(
            'button:not(:disabled), input:not(:disabled), select:not(:disabled), [tabindex]:not([tabindex="-1"])',
          ),
        )
        if (focusables.length === 0) return
        const first = focusables[0]
        const last = focusables[focusables.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose, status])

  if (!isOpen) return null

  // Compute transform origin offset relative to viewport center so panel expands from trigger button
  let originDx = 0
  let originDy = 24
  if (originRect && typeof window !== 'undefined') {
    const btnCenterX = originRect.x + originRect.width / 2
    const btnCenterY = originRect.y + originRect.height / 2
    originDx = Math.round(btnCenterX - window.innerWidth / 2)
    originDy = Math.round(btnCenterY - window.innerHeight / 2)
  }

  const validateForm = (): FieldErrors => {
    const nextErrors: FieldErrors = {}
    const trimmedName = name.trim()
    const trimmedContact = contact.trim()

    if (trimmedName.length < 2) {
      nextErrors.name = '请填写您的称呼（至少 2 个字符）'
    }

    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedContact)
    const cleanPhone = trimmedContact.replace(/[\s-]/g, '')
    const isPhone =
      /^1[3-9]\d{9}$/.test(cleanPhone) || /^\+?\d{8,15}$/.test(cleanPhone)

    if (!trimmedContact) {
      nextErrors.contact = '请填写手机号或电子邮箱以便接收确认函'
    } else if (!isEmail && !isPhone) {
      nextErrors.contact = '格式无效，请输入正确的 11 位手机号或邮箱地址'
    }

    return nextErrors
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (status === 'submitting') return

    const nextErrors = validateForm()
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      setStatus('validation-error')
      if (nextErrors.name) {
        nameInputRef.current?.focus()
      } else if (nextErrors.contact) {
        contactInputRef.current?.focus()
      }
      return
    }

    setErrors({})
    setStatus('submitting')

    window.setTimeout(() => {
      const randomNum = Math.floor(1000 + Math.random() * 8999)
      setPassCode(
        mode === 'preorder' ? `N1-ORD-${randomNum}` : `N1-AUD-${randomNum}`,
      )
      setStatus('success')
    }, 880)
  }

  const isDisabled = status === 'submitting'
  const finishProfile = FINISHES[selectedFinish]

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      {/* Dimmed Refractive Backdrop */}
      <div
        onClick={() => {
          if (!isDisabled) onClose()
        }}
        className="anim-backdrop-in fixed inset-0 bg-[#07090D]/76 backdrop-blur-md"
        aria-hidden="true"
      />

      {/* Expanding Liquid Glass Reservation Card */}
      <div
        ref={panelRef}
        style={
          {
            '--origin-dx': `${originDx}px`,
            '--origin-dy': `${originDy}px`,
          } as React.CSSProperties
        }
        className="anim-glass-expand liquid-glass relative z-10 w-full max-w-[540px] max-h-[90dvh] overflow-y-auto rounded-[1.75rem] p-6 sm:p-8"
      >
        {/* Top Bar & Mode Toggle */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="tabular-tech text-[10px] tracking-[0.18em] text-[#C98A4B] uppercase">
              {mode === 'audition'
                ? 'PRIVATE LISTENING SESSION'
                : 'LAUNCH EDITION PRE-ORDER'}
            </div>
            <h2
              id={titleId}
              className="mt-1.5 text-xl font-medium tracking-[-0.02em] text-[#EEF3FA] sm:text-2xl"
            >
              {mode === 'audition'
                ? '预约线下静谧声场试听'
                : '预订 NOCTURNE ONE 首发版'}
            </h2>
          </div>

          <button
            type="button"
            disabled={isDisabled}
            onClick={onClose}
            aria-label="关闭面板"
            className="rounded-full border border-[rgba(220,232,248,0.16)] bg-[rgba(24,28,36,0.65)] p-2 text-[#A8B4C4] transition-all hover:border-[rgba(220,232,248,0.34)] hover:text-[#EEF3FA] active:scale-95 disabled:opacity-40 cursor-pointer"
          >
            <X size={16} weight="light" aria-hidden="true" />
          </button>
        </div>

        {/* Optional Mode Switch Pill when in form mode */}
        {status !== 'success' && onSwitchMode && (
          <div className="mt-5 inline-flex rounded-full border border-[rgba(220,232,248,0.12)] bg-[rgba(15,18,24,0.55)] p-1">
            <button
              type="button"
              disabled={isDisabled}
              onClick={() => {
                onSwitchMode('audition')
                setStatus('default')
                setErrors({})
              }}
              className={`rounded-full px-3.5 py-1 text-xs transition-all cursor-pointer ${
                mode === 'audition'
                  ? 'bg-[rgba(220,232,248,0.12)] text-[#EEF3FA]'
                  : 'text-[#8D99AA] hover:text-[#E8EEF6]'
              }`}
            >
              预约试听
            </button>
            <button
              type="button"
              disabled={isDisabled}
              onClick={() => {
                onSwitchMode('preorder')
                setStatus('default')
                setErrors({})
              }}
              className={`rounded-full px-3.5 py-1 text-xs transition-all cursor-pointer ${
                mode === 'preorder'
                  ? 'bg-[rgba(201,138,75,0.22)] text-[#D8A26A]'
                  : 'text-[#8D99AA] hover:text-[#E8EEF6]'
              }`}
            >
              首发预订 · ¥3,499
            </button>
          </div>
        )}

        {/* SUCCESS CONFIRMATION PASS */}
        {status === 'success' ? (
          <div className="mt-6 space-y-6">
            <div className="rounded-2xl border border-[#C98A4B]/35 bg-[rgba(201,138,75,0.08)] p-5">
              <div className="flex items-center gap-2.5 text-[#D8A26A]">
                <CheckCircle size={20} weight="fill" aria-hidden="true" />
                <span className="text-sm font-medium">
                  {mode === 'audition'
                    ? '试听席位已确认保留'
                    : '首发典藏编号预订已锁定'}
                </span>
              </div>

              <div className="mt-4 flex items-baseline justify-between border-y border-[rgba(220,232,248,0.1)] py-3">
                <span className="tabular-tech text-[11px] tracking-[0.14em] text-[#8D99AA]">
                  PASS REFERENCE
                </span>
                <span className="tabular-tech text-base font-medium text-[#EEF3FA]">
                  {passCode}
                </span>
              </div>

              <dl className="mt-4 space-y-2.5 text-xs">
                <div className="flex justify-between gap-4">
                  <dt className="text-[#8D99AA]">贵宾姓名</dt>
                  <dd className="text-[#EEF3FA]">{name.trim()}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-[#8D99AA]">联系方式</dt>
                  <dd className="tabular-tech text-[#EEF3FA]">{contact.trim()}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-[#8D99AA]">
                    {mode === 'audition' ? '试听空间' : '配送区域'}
                  </dt>
                  <dd className="text-right text-[#EEF3FA]">
                    {mode === 'audition' ? studio : city}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-[#8D99AA]">机身版本</dt>
                  <dd className="text-[#EEF3FA]">
                    {finishProfile.name}（{finishProfile.zhName}）
                  </dd>
                </div>
                {mode === 'audition' ? (
                  <div className="flex justify-between gap-4">
                    <dt className="text-[#8D99AA]">预约时段</dt>
                    <dd className="text-[#EEF3FA]">{slot}</dd>
                  </div>
                ) : (
                  <div className="flex justify-between gap-4">
                    <dt className="text-[#8D99AA]">首发定价</dt>
                    <dd className="tabular-tech text-[#D8A26A]">¥3,499</dd>
                  </div>
                )}
              </dl>
            </div>

            <p className="text-xs leading-relaxed text-[#8D99AA]">
              声学顾问将通过您留下的联系方式发送专属入场坐标与个性化 HRTF 预校准指南。
            </p>

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setStatus('default')}
                className="cta-secondary-glass rounded-full px-5 py-2.5 text-xs font-medium cursor-pointer"
              >
                修改预约信息
              </button>
              <button
                type="button"
                onClick={onClose}
                className="cta-primary-glass rounded-full px-6 py-2.5 text-xs font-medium cursor-pointer"
              >
                完成并关闭
              </button>
            </div>
          </div>
        ) : (
          /* DEFAULT / VALIDATION-ERROR / SUBMITTING FORM */
          <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
            {status === 'validation-error' && (
              <div
                role="alert"
                className="flex items-center gap-2.5 rounded-xl border border-[#C98A4B]/50 bg-[rgba(201,138,75,0.12)] px-3.5 py-2.5 text-xs text-[#E8C094]"
              >
                <WarningCircle size={16} weight="fill" className="shrink-0" aria-hidden="true" />
                <span>请检查标有提示的必填字段后重新提交。</span>
              </div>
            )}

            {/* Name */}
            <div>
              <label
                htmlFor="res-name"
                className="mb-1.5 block text-xs text-[#B8C3D2]"
              >
                您的称呼 <span className="text-[#C98A4B]">*</span>
              </label>
              <input
                ref={nameInputRef}
                id="res-name"
                type="text"
                disabled={isDisabled}
                value={name}
                aria-invalid={Boolean(errors.name)}
                aria-describedby={errors.name ? 'res-name-err' : undefined}
                placeholder="例如：林先生 / Alex"
                onChange={(e) => {
                  setName(e.target.value)
                  if (errors.name) {
                    setErrors((prev) => ({ ...prev, name: undefined }))
                  }
                }}
                className={`w-full rounded-xl border bg-[rgba(14,17,22,0.72)] px-3.5 py-2.5 text-sm text-[#EEF3FA] placeholder-[#5A6577] transition-colors disabled:opacity-50 ${
                  errors.name
                    ? 'border-[#D8A26A]'
                    : 'border-[rgba(220,232,248,0.14)] focus:border-[#C98A4B]'
                }`}
              />
              {errors.name && (
                <p
                  id="res-name-err"
                  className="mt-1.5 flex items-center gap-1.5 text-[11px] text-[#E0AA70]"
                >
                  <WarningCircle size={13} aria-hidden="true" />
                  <span>{errors.name}</span>
                </p>
              )}
            </div>

            {/* Contact */}
            <div>
              <label
                htmlFor="res-contact"
                className="mb-1.5 block text-xs text-[#B8C3D2]"
              >
                手机号或电子邮箱 <span className="text-[#C98A4B]">*</span>
              </label>
              <input
                ref={contactInputRef}
                id="res-contact"
                type="text"
                disabled={isDisabled}
                value={contact}
                aria-invalid={Boolean(errors.contact)}
                aria-describedby={errors.contact ? 'res-contact-err' : undefined}
                placeholder="138 0013 8000 或 name@domain.com"
                onChange={(e) => {
                  setContact(e.target.value)
                  if (errors.contact) {
                    setErrors((prev) => ({ ...prev, contact: undefined }))
                  }
                }}
                className={`tabular-tech w-full rounded-xl border bg-[rgba(14,17,22,0.72)] px-3.5 py-2.5 text-sm text-[#EEF3FA] placeholder-[#5A6577] transition-colors disabled:opacity-50 ${
                  errors.contact
                    ? 'border-[#D8A26A]'
                    : 'border-[rgba(220,232,248,0.14)] focus:border-[#C98A4B]'
                }`}
              />
              {errors.contact && (
                <p
                  id="res-contact-err"
                  className="mt-1.5 flex items-center gap-1.5 text-[11px] text-[#E0AA70]"
                >
                  <WarningCircle size={13} aria-hidden="true" />
                  <span>{errors.contact}</span>
                </p>
              )}
            </div>

            {/* Finish Selector */}
            <div>
              <span className="mb-1.5 block text-xs text-[#B8C3D2]">
                期望体验配色
              </span>
              <div className="grid grid-cols-3 gap-2">
                {FINISH_ORDER.map((id) => {
                  const item = FINISHES[id]
                  const active = selectedFinish === id
                  return (
                    <button
                      key={id}
                      type="button"
                      disabled={isDisabled}
                      onClick={() => setSelectedFinish(id)}
                      className={`flex items-center justify-center gap-1.5 rounded-xl border px-2.5 py-2 text-xs transition-all cursor-pointer disabled:opacity-50 ${
                        active
                          ? 'border-[#C98A4B]/75 bg-[rgba(201,138,75,0.14)] text-[#EEF3FA]'
                          : 'border-[rgba(220,232,248,0.12)] bg-[rgba(14,17,22,0.52)] text-[#9AA6B7] hover:border-[rgba(220,232,248,0.28)]'
                      }`}
                    >
                      <span
                        aria-hidden="true"
                        className="h-2.5 w-2.5 rounded-full border border-white/25"
                        style={{ backgroundColor: item.swatchCore }}
                      />
                      <span className="truncate">{item.name}</span>
                      {active && (
                        <Check size={11} className="shrink-0 text-[#D8A26A]" aria-hidden="true" />
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Location / Studio */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="res-location"
                  className="mb-1.5 block text-xs text-[#B8C3D2]"
                >
                  {mode === 'audition' ? '声学体验空间' : '收货城市'}
                </label>
                <select
                  id="res-location"
                  disabled={isDisabled}
                  value={mode === 'audition' ? studio : city}
                  onChange={(e) =>
                    mode === 'audition'
                      ? setStudio(e.target.value)
                      : setCity(e.target.value)
                  }
                  className="w-full rounded-xl border border-[rgba(220,232,248,0.14)] bg-[#11151D] px-3 py-2.5 text-xs text-[#EEF3FA] focus:border-[#C98A4B] disabled:opacity-50"
                >
                  {(mode === 'audition' ? LISTENING_STUDIOS : DELIVERY_CITIES).map(
                    (loc) => (
                      <option key={loc} value={loc}>
                        {loc}
                      </option>
                    ),
                  )}
                </select>
              </div>

              <div>
                <label
                  htmlFor="res-slot"
                  className="mb-1.5 block text-xs text-[#B8C3D2]"
                >
                  {mode === 'audition' ? '偏好时段' : '头梁激光刻字（可选）'}
                </label>
                {mode === 'audition' ? (
                  <select
                    id="res-slot"
                    disabled={isDisabled}
                    value={slot}
                    onChange={(e) => setSlot(e.target.value)}
                    className="w-full rounded-xl border border-[rgba(220,232,248,0.14)] bg-[#11151D] px-3 py-2.5 text-xs text-[#EEF3FA] focus:border-[#C98A4B] disabled:opacity-50"
                  >
                    {TIME_SLOTS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    id="res-slot"
                    type="text"
                    maxLength={10}
                    disabled={isDisabled}
                    value={engraving}
                    onChange={(e) => setEngraving(e.target.value)}
                    placeholder="最多 10 个字母或数字"
                    className="tabular-tech w-full rounded-xl border border-[rgba(220,232,248,0.14)] bg-[rgba(14,17,22,0.72)] px-3 py-2.5 text-xs text-[#EEF3FA] placeholder-[#5A6577] focus:border-[#C98A4B] disabled:opacity-50"
                  />
                )}
              </div>
            </div>

            {/* Submit Actions */}
            <div className="flex flex-col-reverse gap-3 border-t border-[rgba(220,232,248,0.08)] pt-5 sm:flex-row sm:items-center sm:justify-between">
              <span className="tabular-tech text-[11px] text-[#7D8898]">
                {mode === 'audition'
                  ? '30 分钟独立声学室试听 · 无需费用'
                  : '首发定价 ¥3,499 · 发货前随时可退'}
              </span>
              <div className="flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  disabled={isDisabled}
                  onClick={onClose}
                  className="cta-secondary-glass rounded-full px-4 py-2.5 text-xs font-medium cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={isDisabled}
                  className="cta-primary-glass rounded-full px-6 py-2.5 text-xs font-medium cursor-pointer"
                >
                  {isDisabled
                    ? '正在确认席位...'
                    : mode === 'audition'
                      ? '确认预约试听'
                      : '提交首发预订'}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
