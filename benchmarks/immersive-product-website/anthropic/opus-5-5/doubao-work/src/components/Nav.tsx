import { useEffect, useRef, useState } from 'react'
import { List, X } from '@phosphor-icons/react'
import { SECTIONS } from '../data'
import { openReservation } from '../store'

export function Nav() {
  const shellRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState<string>('')
  const [menuOpen, setMenuOpen] = useState(false)
  const menuBtnRef = useRef<HTMLButtonElement>(null)

  // Scrolled state via a sentinel — no native scroll listener.
  useEffect(() => {
    const sentinel = document.getElementById('top-sentinel')
    if (!sentinel) return
    const io = new IntersectionObserver(([e]) => {
      if (shellRef.current) shellRef.current.dataset.scrolled = String(!e.isIntersecting)
    })
    io.observe(sentinel)
    return () => io.disconnect()
  }, [])

  // Active section tracking.
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id)
      },
      { rootMargin: '-45% 0px -50% 0px' },
    )
    SECTIONS.forEach((s) => {
      const el = document.getElementById(s.id)
      if (el) io.observe(el)
    })
    const hero = document.getElementById('brand')
    if (hero) io.observe(hero)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    if (!menuOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenuOpen(false)
        menuBtnRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [menuOpen])

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-5 sm:pt-4">
      <div ref={shellRef} className="nav-shell intro mx-auto max-w-[1180px]" style={{ ['--d' as string]: '0.1s', ['--intro-anim' as string]: 'intro-drop' }} data-scrolled="false">
        <nav aria-label="主导航" className="nav-pill glass flex items-center justify-between gap-4" style={{ ['--r' as string]: '999px' }}>
          <a href="#brand" className="flex items-center gap-2.5 rounded-full py-1 pr-2 text-ice-50" aria-label="NOCTURNE 品牌首页" aria-current={active === 'brand' ? 'true' : undefined}>
            <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true">
              <circle cx="11" cy="11" r="9.5" fill="none" stroke="currentColor" strokeOpacity="0.5" />
              <circle cx="11" cy="11" r="5" fill="none" stroke="#c99a64" strokeWidth="1.4" />
              <circle cx="11" cy="11" r="1.4" fill="currentColor" />
            </svg>
            <span className="mono text-[12.5px] font-medium tracking-[0.3em]">NOCTURNE</span>
            <span className="sr-only">Brand</span>
          </a>
          <ul className="hidden items-center gap-0.5 md:flex">
            {SECTIONS.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="nav-link" aria-current={active === s.id ? 'true' : undefined}>
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
          <div className="flex items-center gap-1.5">
            <button type="button" className="btn btn-glass hidden !min-h-[38px] !px-4 !text-[13.5px] sm:inline-flex" onClick={(e) => openReservation(e.currentTarget)}>
              预约试听
            </button>
            <button
              ref={menuBtnRef}
              type="button"
              className="btn btn-ghost btn-icon md:hidden"
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              aria-label={menuOpen ? '关闭菜单' : '打开菜单'}
              onClick={() => setMenuOpen((v) => !v)}
            >
              {menuOpen ? <X size={20} weight="light" /> : <List size={20} weight="light" />}
            </button>
          </div>
        </nav>
        <div
          id="mobile-menu"
          className="glass glass-dense mt-2 overflow-hidden md:hidden"
          hidden={!menuOpen}
          style={{ ['--r' as string]: '22px' }}
        >
          <ul className="flex flex-col p-2">
            {SECTIONS.map((s, i) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-baseline justify-between rounded-2xl px-4 py-3.5 text-ice-100 transition-colors hover:bg-white/5 active:bg-white/10"
                >
                  <span className="text-[17px]">{s.label}</span>
                  <span className="mono text-[11px] text-ice-500">0{i + 1} · {s.cn}</span>
                </a>
              </li>
            ))}
            <li className="p-2 pt-3">
              <button type="button" className="btn btn-primary w-full" onClick={(e) => { setMenuOpen(false); openReservation(e.currentTarget) }}>
                预约试听
              </button>
            </li>
          </ul>
        </div>
      </div>
    </header>
  )
}
