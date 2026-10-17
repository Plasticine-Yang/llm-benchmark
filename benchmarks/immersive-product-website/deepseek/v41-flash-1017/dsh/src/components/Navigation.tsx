import { useEffect, useRef, useState } from 'react'
import type { MouseEvent } from 'react'
import { ArrowUpRight, CloseIcon, MenuIcon } from './Icons'
import './Navigation.css'

type NavigationProps = {
  onReserve: (event?: MouseEvent<HTMLButtonElement>) => void
}

const navItems = [
  { id: 'brand', label: '品牌' },
  { id: 'sound', label: '声音' },
  { id: 'structure', label: '结构' },
  { id: 'specs', label: '规格' },
  { id: 'purchase', label: '购买' },
] as const

export function Navigation({ onReserve }: NavigationProps) {
  const [scrolled, setScrolled] = useState(false)
  const [active, setActive] = useState('brand')
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const reserveTimer = useRef<number | null>(null)

  useEffect(() => {
    const sentinel = document.getElementById('nav-sentinel')
    if (!sentinel) return
    const observer = new IntersectionObserver(
      ([entry]) => setScrolled(!entry.isIntersecting),
      { rootMargin: '0px', threshold: 0 },
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const sectionIds = [...navItems.map(({ id }) => id), 'finish']
    const sections = sectionIds
      .map((id) => document.getElementById(id))
      .filter((section): section is HTMLElement => Boolean(section))

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id === 'finish' ? '' : entry.target.id)
        })
      },
      { rootMargin: '-44% 0px -50% 0px', threshold: 0 },
    )
    sections.forEach((section) => observer.observe(section))
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!menuOpen) return

    const previousOverflow = document.body.style.overflow
    const previousFocus = document.activeElement as HTMLElement | null
    document.body.style.overflow = 'hidden'
    const menu = menuRef.current

    const focusable = () =>
      menu
        ? Array.from(
            menu.querySelectorAll<HTMLElement>(
              'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
            ),
          ).filter((el) => el.offsetParent !== null && el.tabIndex >= 0)
        : []

    const firstFrame = window.requestAnimationFrame(() => {
      menu?.querySelector<HTMLElement>('.mobile-menu__close')?.focus()
    })

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        setMenuOpen(false)
        return
      }
      if (event.key !== 'Tab') return
      const items = focusable()
      if (!items.length) return
      const first = items[0]
      const last = items[items.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      window.cancelAnimationFrame(firstFrame)
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
      if (previousFocus) previousFocus.focus({ preventScroll: true })
    }
  }, [menuOpen])

  useEffect(() => {
    const query = window.matchMedia('(min-width: 900px)')
    const closeOnDesktop = (event: MediaQueryListEvent) => {
      if (event.matches) setMenuOpen(false)
    }
    query.addEventListener('change', closeOnDesktop)
    return () => query.removeEventListener('change', closeOnDesktop)
  }, [])

  useEffect(() => {
    return () => {
      if (reserveTimer.current) window.clearTimeout(reserveTimer.current)
    }
  }, [])

  const closeMenu = () => setMenuOpen(false)

  const reserveFromMenu = () => {
    closeMenu()
    reserveTimer.current = window.setTimeout(() => {
      onReserve()
      triggerRef.current?.focus({ preventScroll: true })
    }, 240)
  }

  return (
    <>
      <a className="skip-link" href="#main-content">
        跳至主要内容
      </a>
      <header className="nav" data-scrolled={scrolled}>
        <div className="nav__shell glass">
          <a className="brand" href="#brand" aria-label="NOCTURNE 首页">
            <span className="brand__mark" aria-hidden="true">
              <svg viewBox="0 0 28 28">
                <circle cx="14" cy="14" r="9.5" fill="none" stroke="currentColor" strokeWidth=".9" opacity=".65" />
                <circle cx="14" cy="14" r="5.2" fill="none" stroke="currentColor" strokeWidth=".8" />
                <path d="M14 1.5v4M26.5 14h-4M14 26.5v-4M1.5 14h4" stroke="currentColor" strokeWidth=".8" opacity=".55" />
                <circle cx="14" cy="8.8" r="1.05" fill="var(--amber-300)" />
              </svg>
            </span>
            <span className="brand__word">
              NOCTURNE
              <span className="brand__one">ONE</span>
            </span>
          </a>

          <nav className="nav__links" aria-label="页面章节">
            {navItems.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className="nav__link"
                data-active={active === item.id}
                aria-current={active === item.id ? 'location' : undefined}
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="nav__actions">
            <button type="button" className="nav__reserve" aria-haspopup="dialog" onClick={(event) => onReserve(event)}>
              <span>预约试听</span>
              <span className="nav__reserve-icon" aria-hidden="true">
                <ArrowUpRight width={14} height={14} />
              </span>
            </button>
            <button
              ref={triggerRef}
              type="button"
              className="nav__menu-trigger"
              aria-expanded={menuOpen}
              aria-controls="mobile-navigation"
              aria-label={menuOpen ? '关闭导航菜单' : '打开导航菜单'}
              tabIndex={menuOpen ? -1 : 0}
              onClick={() => setMenuOpen((value) => !value)}
            >
              {menuOpen ? <CloseIcon width={20} height={20} /> : <MenuIcon width={22} height={22} />}
            </button>
          </div>
        </div>
      </header>

      <div
        id="mobile-navigation"
        ref={menuRef}
        className={`mobile-menu${menuOpen ? ' is-open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="移动端导航"
        inert={!menuOpen}
      >
        <button
          type="button"
          className="mobile-menu__scrim"
          aria-label="关闭导航菜单"
          tabIndex={-1}
          onClick={closeMenu}
        />
        <div className="mobile-menu__panel glass">
          <div className="mobile-menu__top">
            <span className="mono mobile-menu__code">N° 001 / MENU</span>
            <button type="button" className="mobile-menu__close" onClick={closeMenu} aria-label="关闭菜单">
              <CloseIcon />
            </button>
          </div>
          <nav className="mobile-menu__links" aria-label="页面章节">
            {navItems.map((item, index) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className="mobile-menu__link"
                onClick={closeMenu}
                tabIndex={menuOpen ? 0 : -1}
              >
                <span className="mono mobile-menu__index">0{index + 1}</span>
                <span>{item.label}</span>
                <ArrowUpRight width={18} height={18} />
              </a>
            ))}
          </nav>
          <div className="mobile-menu__bottom">
            <p>一次关于空间、材料与静默的重新调音。</p>
            <button
              type="button"
              className="mobile-menu__cta"
              aria-haspopup="dialog"
              onClick={reserveFromMenu}
              tabIndex={menuOpen ? 0 : -1}
            >
              预约试听 <ArrowUpRight width={17} height={17} />
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
