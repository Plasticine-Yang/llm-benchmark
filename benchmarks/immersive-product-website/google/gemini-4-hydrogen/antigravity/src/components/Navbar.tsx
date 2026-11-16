import { List, X } from '@phosphor-icons/react'
import { useEffect, useState } from 'react'
import { NAV_ITEMS } from '../data/productData'
import type { NavItem } from '../types/product'

interface NavbarProps {
  activeSection: NavItem['id']
}

export function Navbar({ activeSection }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const sentinel = document.getElementById('nav-scroll-sentinel')
    if (!sentinel) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setScrolled(!entry.isIntersecting)
      },
      { threshold: 0 },
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!mobileOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [mobileOpen])

  const handleLinkClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    id: NavItem['id'],
  ) => {
    e.preventDefault()
    setMobileOpen(false)
    const target = document.getElementById(id)
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <header className="anim-nav-enter fixed inset-x-0 top-0 z-50 px-4 pt-3 sm:px-6 sm:pt-4 pointer-events-none">
      <nav
        aria-label="主导航"
        className={`liquid-glass-nav pointer-events-auto mx-auto flex items-center justify-between rounded-full ${
          scrolled
            ? 'liquid-glass-nav--scrolled max-w-[900px] px-4 py-2 sm:px-5 sm:py-2.5'
            : 'max-w-[1160px] px-5 py-3 sm:px-6 sm:py-3.5'
        }`}
      >
        {/* Brand Monogram */}
        <a
          href="#brand"
          onClick={(e) => handleLinkClick(e, 'brand')}
          className="group flex items-center gap-2.5 rounded-full py-1 pr-2 text-left transition-opacity hover:opacity-90 active:opacity-75"
        >
          <span
            aria-hidden="true"
            className={`relative flex items-center justify-center rounded-full border border-[rgba(232,240,252,0.32)] bg-[#141820]/80 transition-all duration-300 ${
              scrolled ? 'h-6 w-6' : 'h-7 w-7'
            }`}
          >
            <span className="h-2.5 w-2.5 rounded-full border border-[#C98A4B]/80" />
            <span className="absolute h-1 w-1 rounded-full bg-[#D8A26A]" />
          </span>
          <span className="flex items-baseline gap-2">
            <span
              className={`font-medium tracking-[0.18em] text-[#E8EEF6] transition-all duration-300 ${
                scrolled ? 'text-xs' : 'text-[13px]'
              }`}
            >
              NOCTURNE ONE
            </span>
          </span>
        </a>

        {/* Desktop Links: Brand, Sound, Structure, Specifications, Purchase */}
        <ul className="hidden md:flex items-center gap-1 lg:gap-2">
          {NAV_ITEMS.map((item) => {
            const isActive = activeSection === item.id
            return (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  onClick={(e) => handleLinkClick(e, item.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`group relative inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] tracking-[0.04em] transition-all duration-200 ${
                    isActive
                      ? 'text-[#F2F6FC] bg-[rgba(232,240,252,0.08)] shadow-[inset_0_1px_0_rgba(232,240,252,0.16)]'
                      : 'text-[#A8B4C4] hover:text-[#E8EEF6] hover:bg-[rgba(232,240,252,0.04)] active:scale-[0.97]'
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`h-1 w-1 rounded-full transition-all duration-300 ${
                      isActive
                        ? 'bg-[#C98A4B] scale-100 opacity-100'
                        : 'bg-[#C98A4B] scale-0 opacity-0'
                    }`}
                  />
                  <span>{item.label}</span>
                </a>
              </li>
            )
          })}
        </ul>

        {/* Mobile Menu Trigger */}
        <button
          type="button"
          onClick={() => setMobileOpen((prev) => !prev)}
          aria-expanded={mobileOpen}
          aria-controls="mobile-nav-drawer"
          aria-label={mobileOpen ? '关闭导航菜单' : '打开导航菜单'}
          className="inline-flex md:hidden items-center justify-center rounded-full border border-[rgba(232,240,252,0.18)] bg-[rgba(24,28,36,0.72)] p-2 text-[#E8EEF6] transition-all hover:border-[rgba(232,240,252,0.34)] active:scale-95"
        >
          {mobileOpen ? <X size={18} weight="light" /> : <List size={18} weight="light" />}
        </button>
      </nav>

      {/* Mobile Glass Drawer */}
      {mobileOpen && (
        <div
          id="mobile-nav-drawer"
          className="liquid-glass pointer-events-auto mx-auto mt-2.5 max-w-[440px] rounded-2xl p-3 md:hidden anim-glass-expand"
        >
          <ul className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => {
              const isActive = activeSection === item.id
              return (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    onClick={(e) => handleLinkClick(e, item.id)}
                    className={`flex items-center justify-between rounded-xl px-4 py-3 text-sm transition-colors ${
                      isActive
                        ? 'bg-[rgba(232,240,252,0.08)] text-[#F2F6FC]'
                        : 'text-[#A8B4C4] hover:bg-[rgba(232,240,252,0.04)] hover:text-[#E8EEF6]'
                    }`}
                  >
                    <span className="tracking-[0.04em]">{item.label}</span>
                    <span className="text-xs text-[#6C7788]">{item.zhLabel}</span>
                  </a>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </header>
  )
}
