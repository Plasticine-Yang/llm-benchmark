import { useEffect, useState } from 'react'
import { ArrowUpRight, Close, Menu } from '../lib/icons'

const LINKS = [
  { id: 'sound', label: 'Sound', zh: '声场' },
  { id: 'structure', label: 'Structure', zh: '结构' },
  { id: 'specifications', label: 'Specifications', zh: '规格' },
  { id: 'purchase', label: 'Purchase', zh: '购买' },
]

type Props = {
  compact: boolean
  active: string
  onReserve: (origin: { x: number; y: number }) => void
}

export function GlassNav({ compact, active, onReserve }: Props) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  const go = (id: string) => {
    setOpen(false)
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <header className={`nav-wrap enter ${compact ? 'is-compact' : ''}`} style={{ animationDelay: '0ms' }}>
      <nav className={`nav glass ${compact ? 'nav--compact' : ''}`} aria-label="主导航">
        <a className="nav__brand" href="#top" aria-label="NOCTURNE 首页" onClick={(e) => { e.preventDefault(); go('top') }}>
          <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true" fill="none">
            <circle cx="13" cy="13" r="11.4" stroke="currentColor" strokeOpacity=".38" strokeWidth="1" />
            <path d="M4.5 13c2.6-4.6 5.2-4.6 7.8 0s5.2 4.6 7.8 0" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            <circle cx="13" cy="13" r="2" fill="var(--amber)" />
          </svg>
          <span className="nav__brand-text">NOCTURNE<span className="nav__brand-sup">®</span></span>
        </a>

        <ul className="nav__links">
          {LINKS.map((l) => (
            <li key={l.id}>
              <a
                href={`#${l.id}`}
                className={`nav__link ${active === l.id ? 'is-active' : ''}`}
                onClick={(e) => { e.preventDefault(); go(l.id) }}
              >
                <span>{l.label}</span>
                <small>{l.zh}</small>
              </a>
            </li>
          ))}
        </ul>

        <div className="nav__right">
          <button
            type="button"
            className="nav__cta"
            onClick={(e) => {
              const r = e.currentTarget.getBoundingClientRect()
              onReserve({ x: r.left + r.width / 2, y: r.top + r.height / 2 })
            }}
            aria-haspopup="dialog"
          >
            预约试听 <ArrowUpRight size={14} />
          </button>
          <button
            type="button"
            className="nav__menu icon-btn"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? '关闭菜单' : '打开菜单'}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <Close size={17} /> : <Menu size={17} />}
          </button>
        </div>
      </nav>

      <div id="mobile-menu" className={`nav__drawer glass ${open ? 'is-open' : ''}`} hidden={!open}>
        <ul>
          {LINKS.map((l, i) => (
            <li key={l.id}>
              <a href={`#${l.id}`} onClick={(e) => { e.preventDefault(); go(l.id) }}>
                <span className="section-index">0{i + 1}</span>
                <span>{l.label}</span>
                <small>{l.zh}</small>
                <ArrowUpRight size={16} />
              </a>
            </li>
          ))}
        </ul>
        <button
          type="button"
          className="btn btn--primary btn--wide"
          onClick={(e) => {
            const r = e.currentTarget.getBoundingClientRect()
            setOpen(false)
            onReserve({ x: r.left + r.width / 2, y: r.top + r.height / 2 })
          }}
        >
          <span className="btn__label">预约试听 <ArrowUpRight size={16} /></span>
        </button>
      </div>
    </header>
  )
}
