import { useCallback, useEffect, useLayoutEffect, useRef, type ReactNode } from 'react'
import { X } from '@phosphor-icons/react'
import { prefersReducedMotion } from '../hooks'

interface Props {
  open: boolean
  origin: HTMLElement | null
  onClose: () => void
  labelledBy: string
  children: ReactNode
  className?: string
  /** Called once the close animation has finished. */
  onClosed?: () => void
}

/**
 * Native <dialog> (focus trap, Esc, inert background) with a WAAPI morph: the panel starts
 * at the trigger's rect and radius and expands into place. Only transform/opacity/clip are animated.
 */
export function GlassDialog({ open, origin, onClose, labelledBy, children, className = '', onClosed }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const animating = useRef<Animation | null>(null)

  const frames = useCallback((): Keyframe[] | null => {
    const panel = panelRef.current
    if (!panel || !origin || !origin.isConnected) return null
    const o = origin.getBoundingClientRect()
    const p = panel.getBoundingClientRect()
    if (!p.width || !p.height || !o.width) return null
    const sx = o.width / p.width
    const sy = o.height / p.height
    const dx = o.left + o.width / 2 - (p.left + p.width / 2)
    const dy = o.top + o.height / 2 - (p.top + p.height / 2)
    return [
      { transform: `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`, opacity: 0.2, borderRadius: `${o.height / 2 / sy}px / ${o.height / 2 / sy}px` },
      { opacity: 1, offset: 0.35 },
      { transform: 'none', opacity: 1, borderRadius: '28px' },
    ]
  }, [origin])

  useLayoutEffect(() => {
    const dlg = dialogRef.current
    const panel = panelRef.current
    if (!dlg || !panel) return
    if (open && !dlg.open) {
      dlg.showModal()
      dlg.dataset.state = 'open'
      document.documentElement.style.overflow = 'hidden'
      animating.current?.cancel()
      const f = prefersReducedMotion() ? null : frames()
      animating.current = f
        ? panel.animate(f, { duration: 640, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' })
        : panel.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200 })
      const content = panel.querySelector<HTMLElement>('[data-dialog-content]')
      content?.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], {
        duration: 420, delay: f ? 220 : 0, easing: 'cubic-bezier(0.16, 1, 0.3, 1)', fill: 'backwards',
      })
    } else if (!open && dlg.open) {
      dlg.dataset.state = 'closing'
      animating.current?.cancel()
      const f = prefersReducedMotion() ? null : frames()
      const anim = f
        ? panel.animate([...f].reverse().map((k, i, arr) => ({ ...k, offset: i === 0 ? 0 : i === arr.length - 1 ? 1 : 0.65 })), { duration: 420, easing: 'cubic-bezier(0.7, 0, 0.84, 0)' })
        : panel.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 160 })
      animating.current = anim
      anim.onfinish = () => {
        dlg.close()
        delete dlg.dataset.state
        document.documentElement.style.overflow = ''
        if (origin?.isConnected) origin.focus({ preventScroll: true })
        onClosed?.()
      }
    }
  }, [open, frames, origin, onClosed])

  useEffect(() => () => { document.documentElement.style.overflow = '' }, [])

  return (
    <dialog
      ref={dialogRef}
      className="sheet"
      aria-labelledby={labelledBy}
      onCancel={(e) => { e.preventDefault(); onClose() }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="grid h-full w-full place-items-center overflow-y-auto p-3 sm:p-6" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
        <div ref={panelRef} className={`glass glass-dense relative w-full overflow-hidden will-change-transform ${className}`} style={{ ['--r' as string]: '28px' }}>
          <button type="button" onClick={onClose} className="btn btn-ghost btn-icon absolute right-3 top-3 z-20 !rounded-full" aria-label="关闭">
            <X size={18} weight="light" />
          </button>
          <div data-dialog-content>{children}</div>
        </div>
      </div>
    </dialog>
  )
}
