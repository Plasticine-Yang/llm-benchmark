import { useEffect, useState } from 'react';
import { List, X } from '@phosphor-icons/react';
import { SECTIONS, scrollToSection, useReservation } from '../lib/reservation';
import { useSentinel } from '../lib/hooks';

function BrandMark() {
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true">
      <circle
        cx="13"
        cy="13"
        r="11.2"
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.32"
        strokeWidth="1"
      />
      <circle
        cx="13"
        cy="13"
        r="7.4"
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.55"
        strokeWidth="1"
      />
      <path
        d="M13 4.4 L13 21.6"
        stroke="currentColor"
        strokeOpacity="0.22"
        strokeWidth="1"
      />
      <circle cx="13" cy="13" r="2.6" fill="var(--amber-bright)" />
      <circle
        cx="13"
        cy="13"
        r="5.2"
        fill="none"
        stroke="var(--amber-bright)"
        strokeOpacity="0.4"
        strokeWidth="1"
      />
    </svg>
  );
}

export function Nav() {
  const [sentinel, scrolled] = useSentinel<HTMLDivElement>('0px');
  const [menu, setMenu] = useState(false);
  const { open } = useReservation();

  useEffect(() => {
    if (!menu) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenu(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menu]);

  const go = (id: string) => {
    setMenu(false);
    scrollToSection(id);
  };

  return (
    <>
      <div ref={sentinel} className="nav-sentinel" aria-hidden="true" />
      <header className="nav-wrap">
        <nav
          className="nav glass"
          data-scrolled={scrolled ? 'true' : 'false'}
          data-open={menu ? 'true' : 'false'}
          aria-label="主导航"
        >
          <a
            className="nav__brand"
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            <span className="nav__mark" aria-hidden="true">
              <BrandMark />
            </span>
            <span className="nav__wordmark">
              NOCTURNE
              <em>ONE</em>
            </span>
          </a>

          <ul className="nav__links">
            {SECTIONS.map((s) => (
              <li key={s.id}>
                <button type="button" className="nav__link" onClick={() => go(s.id)}>
                  <span className="nav__link-cn">{s.label}</span>
                  <span className="nav__link-en" aria-hidden="true">
                    {s.sub}
                  </span>
                </button>
              </li>
            ))}
          </ul>

          <div className="nav__actions">
            <button
              type="button"
              className="btn btn--ghost nav__cta"
              onClick={(e) => open(e.currentTarget)}
            >
              <span className="btn__label">预约试听</span>
            </button>
            <button
              type="button"
              className="nav__burger"
              aria-expanded={menu}
              aria-controls="nav-sheet"
              aria-label={menu ? '关闭菜单' : '打开菜单'}
              onClick={() => setMenu((v) => !v)}
            >
              {menu ? <X size={17} weight="light" /> : <List size={17} weight="light" />}
            </button>
          </div>
        </nav>

        <div id="nav-sheet" className="nav-sheet glass" data-open={menu ? 'true' : 'false'}>
          <ul>
            {SECTIONS.map((s, i) => (
              <li key={s.id}>
                <button type="button" onClick={() => go(s.id)} tabIndex={menu ? 0 : -1}>
                  <span className="mono nav-sheet__idx">
                    0{i + 1}
                  </span>
                  <span className="nav-sheet__label">{s.label}</span>
                  <span className="nav-sheet__sub mono">{s.sub}</span>
                </button>
              </li>
            ))}
          </ul>
          <button
            type="button"
            className="btn btn--primary nav-sheet__cta"
            tabIndex={menu ? 0 : -1}
            onClick={(e) => {
              setMenu(false);
              open(e.currentTarget);
            }}
          >
            <span className="btn__label">预约试听</span>
          </button>
        </div>
      </header>
    </>
  );
}
