import { ArrowUpIcon, ArrowUpRight } from './Icons'
import './Footer.css'

const footerLinks = [
  { href: '#brand', label: '品牌' },
  { href: '#sound', label: '声音' },
  { href: '#structure', label: '结构' },
  { href: '#specs', label: '规格' },
  { href: '#purchase', label: '购买' },
]

export function Footer() {
  const backToTop = () => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' })
  }

  return (
    <footer className="footer" aria-labelledby="footer-title">
      <div className="footer__ambient" aria-hidden="true" />
      <div className="footer__inner shell">
        <div className="footer__topline">
          <span className="mono">NOCTURNE / BACK COVER</span>
          <span className="mono">ISSUE N° 01 — 2026</span>
          <span className="mono">52.5200° N / 13.4050° E</span>
        </div>

        <div className="footer__main">
          <div className="footer__statement">
            <span className="footer__kicker">
              <span aria-hidden="true" />
              为安静的耳朵而作
            </span>
            <h2 id="footer-title">
              <span>声音不是被制造出来的。</span>
              <span>它只是被放回了空间。</span>
            </h2>
          </div>

          <div className="footer__side">
            <p>
              一次关于空间、材料与静默的重新调音。
              <br />
              NOCTURNE 是来自柏林与上海的私人声学品牌。
            </p>
            <a href="mailto:hello@nocturne.audio" className="footer__contact">
              hello@nocturne.audio
              <ArrowUpRight width={16} height={16} />
            </a>
          </div>
        </div>

        <div className="footer__rule">
          <span />
          <i />
        </div>

        <div className="footer__lower">
          <nav className="footer__links" aria-label="页脚导航">
            {footerLinks.map((link) => (
              <a key={link.href} href={link.href}>
                {link.label}
              </a>
            ))}
          </nav>
          <div className="footer__colophon">
            <span>声音设计 · NOCTURNE Acoustic Lab</span>
            <span className="mono">© 2026 NOCTURNE AUDIO</span>
          </div>
          <button type="button" className="footer__top" onClick={backToTop}>
            回到顶端
            <span aria-hidden="true">
              <ArrowUpIcon width={12} height={12} />
            </span>
          </button>
        </div>
      </div>

      <div className="footer__wordmark" aria-hidden="true">
        <span>NOCTURNE</span>
        <em>ONE</em>
      </div>
      <div className="footer__baseline">
        <span className="mono">DESIGNED IN BERLIN / TUNED FOR SILENCE</span>
        <span className="mono">N° 001</span>
      </div>
    </footer>
  )
}
