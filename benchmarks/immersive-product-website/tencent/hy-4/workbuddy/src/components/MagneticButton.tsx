import { useCallback, useEffect, useRef } from 'react'
import type { ButtonHTMLAttributes, MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent, ReactNode } from 'react'
import { usePrefersReducedMotion } from '../lib/hooks'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost'
  magnetic?: boolean
  size?: 'default' | 'small'
  children: ReactNode
  onActivate?: (origin: { x: number; y: number }) => void
}

/**
 * Pointer animation writes straight to DOM nodes inside a single rAF.
 * React never re-renders on pointer movement.
 */
export function MagneticButton({
  variant = 'primary',
  magnetic = true,
  size = 'default',
  className = '',
  children,
  onClick,
  onActivate,
  disabled,
  ...rest
}: Props) {
  const ref = useRef<HTMLButtonElement>(null)
  const labelRef = useRef<HTMLSpanElement>(null)
  const frame = useRef(0)
  const reduced = usePrefersReducedMotion()

  useEffect(() => () => cancelAnimationFrame(frame.current), [])

  const onPointerMove = useCallback(
    (e: ReactPointerEvent<HTMLButtonElement>) => {
      if (!magnetic || reduced || disabled || e.pointerType === 'touch') return
      const el = ref.current
      const label = labelRef.current
      if (!el || !label) return
      const rect = el.getBoundingClientRect()
      const px = e.clientX - rect.left
      const py = e.clientY - rect.top
      const nx = (px / rect.width - 0.5) * 2
      const ny = (py / rect.height - 0.5) * 2
      cancelAnimationFrame(frame.current)
      frame.current = requestAnimationFrame(() => {
        el.style.setProperty('--mx', `${px}px`)
        el.style.setProperty('--my', `${py}px`)
        label.style.transform = `translate3d(${(nx * 5).toFixed(2)}px, ${(ny * 3.5).toFixed(2)}px, 0)`
      })
    },
    [magnetic, reduced, disabled],
  )

  const onPointerLeave = useCallback(() => {
    cancelAnimationFrame(frame.current)
    if (labelRef.current) labelRef.current.style.transform = 'translate3d(0, 0, 0)'
    if (ref.current) {
      ref.current.style.setProperty('--mx', '50%')
      ref.current.style.setProperty('--my', '50%')
    }
  }, [])

  const handleClick = (e: ReactMouseEvent<HTMLButtonElement>) => {
    if (disabled) return
    if (onActivate && ref.current) {
      const rect = ref.current.getBoundingClientRect()
      onActivate({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 })
    }
    onClick?.(e)
  }

  return (
    <button
      ref={ref}
      type="button"
      disabled={disabled}
      className={`btn btn--${variant} ${size === 'small' ? 'btn--small' : ''} ${className}`}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      onClick={handleClick}
      {...rest}
    >
      <span className="btn__label" ref={labelRef}>{children}</span>
    </button>
  )
}
