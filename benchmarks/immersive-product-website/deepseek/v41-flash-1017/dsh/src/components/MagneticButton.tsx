import { useEffect, useRef } from 'react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import './MagneticButton.css'

type MagneticButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode
  magnetic?: boolean
  strength?: number
  fullWidth?: boolean
}

export function MagneticButton({
  children,
  className = '',
  magnetic = true,
  strength = 7,
  fullWidth = false,
  ...buttonProps
}: MagneticButtonProps) {
  const wrapRef = useRef<HTMLSpanElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const wrap = wrapRef.current
    const button = buttonRef.current
    if (!wrap || !button || !magnetic) return
    if (!window.matchMedia('(pointer: fine)').matches) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let frame = 0
    let targetX = 0
    let targetY = 0
    let currentX = 0
    let currentY = 0
    let hovered = false

    const render = () => {
      frame = 0
      currentX += (targetX - currentX) * 0.24
      currentY += (targetY - currentY) * 0.24
      wrap.style.setProperty('--mag-x', `${currentX.toFixed(2)}px`)
      wrap.style.setProperty('--mag-y', `${currentY.toFixed(2)}px`)
      if (hovered || Math.abs(currentX - targetX) > 0.05 || Math.abs(currentY - targetY) > 0.05) {
        frame = requestAnimationFrame(render)
      }
    }

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(render)
    }

    const onMove = (event: PointerEvent) => {
      if (button.disabled) return
      const rect = wrap.getBoundingClientRect()
      const px = (event.clientX - rect.left) / rect.width
      const py = (event.clientY - rect.top) / rect.height
      targetX = (px - 0.5) * strength * 2
      targetY = (py - 0.5) * strength * 1.2
      wrap.style.setProperty('--cursor-x', `${(px * 100).toFixed(1)}%`)
      wrap.style.setProperty('--cursor-y', `${(py * 100).toFixed(1)}%`)
      schedule()
    }

    const onEnter = () => {
      hovered = true
      wrap.dataset.hovered = 'true'
      schedule()
    }

    const onLeave = () => {
      hovered = false
      targetX = 0
      targetY = 0
      wrap.dataset.hovered = 'false'
      wrap.style.setProperty('--cursor-x', '50%')
      wrap.style.setProperty('--cursor-y', '50%')
      schedule()
    }

    wrap.addEventListener('pointerenter', onEnter)
    wrap.addEventListener('pointermove', onMove)
    wrap.addEventListener('pointerleave', onLeave)

    return () => {
      cancelAnimationFrame(frame)
      wrap.removeEventListener('pointerenter', onEnter)
      wrap.removeEventListener('pointermove', onMove)
      wrap.removeEventListener('pointerleave', onLeave)
    }
  }, [magnetic, strength])

  return (
    <span
      ref={wrapRef}
      className={`magnetic${fullWidth ? ' magnetic--full' : ''}`}
      data-hovered="false"
    >
      <button ref={buttonRef} type="button" className={`btn ${className}`} {...buttonProps}>
        {children}
      </button>
    </span>
  )
}
