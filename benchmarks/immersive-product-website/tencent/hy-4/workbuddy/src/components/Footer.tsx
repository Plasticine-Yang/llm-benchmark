import { ArrowUpRight } from '../lib/icons'

export function Footer({ onReserve }: { onReserve: (origin: { x: number; y: number }) => void }) {
  const go = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  return (
    <footer className="cover" aria-label="品牌封底">
      <div className="cover__top mono-label">
        <span>NOCTURNE ACOUSTICS</span>
        <span>VOL. 01 — THE QUIET ISSUE</span>
        <span>SHANGHAI / 2026</span>
      </div>

      <div className="cover__wordmark" aria-hidden="true">NOCTURNE</div>

      <div className="cover__center">
        <div className="cover__seal" aria-hidden="true">
          <span>01</span>
          <small>FIRST<br />EDITION</small>
        </div>
        <p className="cover__statement display">为安静而造。<br /><span className="text-dim">为空间而生。</span></p>
        <p className="cover__sub">MADE FOR THE ROOM BETWEEN THE NOTES.</p>
        <button
          type="button"
          className="cover__cta"
          onClick={(e) => {
            const r = e.currentTarget.getBoundingClientRect()
            onReserve({ x: r.left + r.width / 2, y: r.top + r.height / 2 })
          }}
          aria-haspopup="dialog"
        >
          预约一次私人试听 <ArrowUpRight size={16} />
        </button>
      </div>

      <div className="cover__rule" />
      <div className="cover__bottom">
        <div className="cover__mark">
          <svg width="22" height="22" viewBox="0 0 26 26" aria-hidden="true" fill="none">
            <circle cx="13" cy="13" r="11.4" stroke="currentColor" strokeOpacity=".38" />
            <path d="M4.5 13c2.6-4.6 5.2-4.6 7.8 0s5.2 4.6 7.8 0" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            <circle cx="13" cy="13" r="2" fill="var(--amber)" />
          </svg>
          <span>NOCTURNE®</span>
        </div>
        <nav className="cover__nav" aria-label="页脚导航">
          <button type="button" onClick={() => go('sound')}>Sound</button>
          <button type="button" onClick={() => go('structure')}>Structure</button>
          <button type="button" onClick={() => go('specifications')}>Specifications</button>
          <button type="button" onClick={() => go('purchase')}>Purchase</button>
        </nav>
        <div className="cover__legal mono-label">
          <span>© 2026 NOCTURNE ACOUSTICS</span>
          <span>ALL SPECIFICATIONS MEASURED, NOT IMAGINED</span>
        </div>
      </div>
    </footer>
  )
}
