import { forwardRef, useEffect, useImperativeHandle, useRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { prefersReducedMotion } from '../hooks'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  strength?: number
}

/**
 * Primary CTA with a restrained magnetic pull. Pointer data is written straight to CSS
 * variables inside a single rAF — React never re-renders during pointer movement.
 */
export const MagneticButton = forwardRef<HTMLButtonElement, Props>(function MagneticButton(
  { children, className = '', strength = 0.22, ...rest },
  forwarded,
) {
  const ref = useRef<HTMLButtonElement>(null)
  useImperativeHandle(forwarded, () => ref.current as HTMLButtonElement)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (prefersReducedMotion() || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return
    let raf = 0
    let tx = 0, ty = 0, hx = 50, hy = 50
    const write = () => {
      raf = 0
      el.style.setProperty('--bx', `${tx}px`)
      el.style.setProperty('--by', `${ty}px`)
      el.style.setProperty('--hx', `${hx}%`)
      el.style.setProperty('--hy', `${hy}%`)
    }
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect()
      const dx = e.clientX - (r.left + r.width / 2)
      const dy = e.clientY - (r.top + r.height / 2)
      const max = 9
      tx = Math.max(-max, Math.min(max, dx * strength))
      ty = Math.max(-max, Math.min(max, dy * strength))
      hx = ((e.clientX - r.left) / r.width) * 100
      hy = ((e.clientY - r.top) / r.height) * 100
      if (!raf) raf = requestAnimationFrame(write)
    }
    const leave = () => {
      tx = 0; ty = 0; hx = 50; hy = 50
      if (!raf) raf = requestAnimationFrame(write)
    }
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerleave', leave)
    return () => {
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerleave', leave)
      cancelAnimationFrame(raf)
    }
  }, [strength])

  return (
    <button ref={ref} className={`btn btn-primary ${className}`} {...rest}>
      <span className="btn-label">{children}</span>
    </button>
  )
})
