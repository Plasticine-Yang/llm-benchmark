import { useEffect, useRef, useState } from 'react'
import { ArrowUpRight } from './Icons'

type NavigationProps = { onReserve: (element: HTMLElement) => void }

export function Navigation({ onReserve }: NavigationProps) {
  const sentinelRef = useRef<HTMLDivElement>(null)
  const [compact, setCompact] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return
    const observer = new IntersectionObserver(([entry]) => setCompact(!entry.isIntersecting), { threshold: 0 })
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [])

  const closeMenu = () => setMenuOpen(false)

  return (
    <>
      <div className="nav-sentinel" ref={sentinelRef} />
      <header className={`floating-nav glass-surface ${compact ? 'is-compact' : ''} ${menuOpen ? 'menu-open' : ''}`}>
        <a href="#top" className="brand" onClick={closeMenu} aria-label="NOCTURNE 首页">
          <span className="brand-glyph"><i /><i /></span>
          <span>NOCTURNE</span>
        </a>
        <button className="menu-toggle" type="button" aria-expanded={menuOpen} aria-label={menuOpen ? '关闭导航菜单' : '打开导航菜单'} onClick={() => setMenuOpen((value) => !value)}>
          <span /><span />
        </button>
        <nav className="nav-links" aria-label="主要导航">
          <a href="#sound" onClick={closeMenu}>声音</a>
          <a href="#structure" onClick={closeMenu}>结构</a>
          <a href="#specifications" onClick={closeMenu}>规格</a>
        </nav>
        <button className="nav-purchase" type="button" onClick={(event) => { closeMenu(); onReserve(event.currentTarget) }}>
          预约试听 <ArrowUpRight width={15} height={15} />
        </button>
      </header>
    </>
  )
}
