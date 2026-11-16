import { useRef, type ButtonHTMLAttributes, type ReactNode } from 'react'

interface MagneticButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary'
  magneticStrength?: number
  onActivateWithRect?: (rect: DOMRect) => void
  children: ReactNode
}

export function MagneticButton({
  variant = 'primary',
  magneticStrength = 9,
  onActivateWithRect,
  onClick,
  className = '',
  children,
  disabled,
  type = 'button',
  ...rest
}: MagneticButtonProps) {
  const btnRef = useRef<HTMLButtonElement | null>(null)

  const handlePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    const el = btnRef.current
    if (!el || disabled || e.pointerType === 'touch') return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const rect = el.getBoundingClientRect()
    const relX = (e.clientX - rect.left) / rect.width - 0.5
    const relY = (e.clientY - rect.top) / rect.height - 0.5

    // Direct DOM CSS variable update: zero React state rerenders per pointer frame
    el.style.setProperty('--tx', `${(relX * magneticStrength).toFixed(2)}px`)
    el.style.setProperty('--ty', `${(relY * magneticStrength * 0.78).toFixed(2)}px`)
    el.style.setProperty('--mx', `${(e.clientX - rect.left).toFixed(1)}px`)
    el.style.setProperty('--my', `${(e.clientY - rect.top).toFixed(1)}px`)
  }

  const handlePointerLeave = () => {
    const el = btnRef.current
    if (!el) return
    el.style.setProperty('--tx', '0px')
    el.style.setProperty('--ty', '0px')
    el.style.setProperty('--mx', '50%')
    el.style.setProperty('--my', '50%')
  }

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return
    if (onActivateWithRect && btnRef.current) {
      onActivateWithRect(btnRef.current.getBoundingClientRect())
    }
    onClick?.(e)
  }

  const variantClass =
    variant === 'primary' ? 'cta-primary-glass' : 'cta-secondary-glass'

  return (
    <button
      ref={btnRef}
      type={type}
      disabled={disabled}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      onClick={handleClick}
      className={`${variantClass} inline-flex items-center justify-center gap-2.5 rounded-full px-6 py-3.5 text-sm font-medium tracking-[0.02em] select-none cursor-pointer ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}
