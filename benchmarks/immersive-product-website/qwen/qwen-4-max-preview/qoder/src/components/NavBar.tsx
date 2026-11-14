import { useEffect, useRef, useState, type MouseEvent } from 'react';
import { BrandMark, IconMenu, IconSoundOff, IconSoundOn, IconX } from './icons';

const LINKS = [
  { id: 'brand', label: '品牌' },
  { id: 'sound', label: '声学' },
  { id: 'structure', label: '结构' },
  { id: 'specs', label: '规格' },
  { id: 'purchase', label: '购买' },
];

interface NavBarProps {
  muted: boolean;
  onToggleMute: () => void;
  onReserve: (e: MouseEvent<HTMLButtonElement>) => void;
}

export function NavBar({ muted, onToggleMute, onReserve }: NavBarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState('brand');
  const [menuOpen, setMenuOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const sentinel = document.getElementById('nav-sentinel');
    if (!sentinel) return;
    const io = new IntersectionObserver(([entry]) => setScrolled(!entry.isIntersecting), {
      threshold: 0,
    });
    io.observe(sentinel);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const sections = LINKS.map((l) => document.getElementById(l.id)).filter(
      (el): el is HTMLElement => el !== null,
    );
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id);
        }
      },
      { rootMargin: '-40% 0px -55% 0px', threshold: 0 },
    );
    sections.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    const onDown = (e: PointerEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onDown);
    };
  }, [menuOpen]);

  return (
    <header className="nav" data-scrolled={scrolled} ref={headerRef}>
      <div className="nav-inner glass">
        <a className="nav-brand" href="#brand" aria-label="NOCTURNE 首页">
          <BrandMark size={21} />
          NOCTURNE
        </a>
        <nav className="nav-links" aria-label="主导航">
          {LINKS.map((l) => (
            <a key={l.id} className="nav-link" href={`#${l.id}`} data-active={active === l.id}>
              {l.label}
            </a>
          ))}
        </nav>
        <div className="nav-actions">
          <button
            type="button"
            className="icon-btn"
            onClick={onToggleMute}
            aria-pressed={muted}
            aria-label={muted ? '取消静音' : '静音所有声音'}
            title={muted ? '取消静音' : '静音所有声音'}
          >
            {muted ? <IconSoundOff size={17} /> : <IconSoundOn size={17} />}
          </button>
          <button type="button" className="btn btn-primary btn-sm nav-cta" onClick={onReserve}>
            预约试听
          </button>
          <button
            type="button"
            className="icon-btn nav-menu-btn"
            aria-expanded={menuOpen}
            aria-controls="nav-mobile"
            aria-label={menuOpen ? '关闭菜单' : '打开菜单'}
            onClick={() => setMenuOpen((v) => !v)}
          >
            {menuOpen ? <IconX size={17} /> : <IconMenu size={17} />}
          </button>
        </div>
      </div>
      <div className="nav-mobile glass" id="nav-mobile" data-open={menuOpen}>
        {LINKS.map((l) => (
          <a
            key={l.id}
            className="nav-link"
            href={`#${l.id}`}
            data-active={active === l.id}
            onClick={() => setMenuOpen(false)}
            tabIndex={menuOpen ? 0 : -1}
          >
            {l.label}
          </a>
        ))}
        <button
          type="button"
          className="btn btn-primary"
          tabIndex={menuOpen ? 0 : -1}
          onClick={(e) => {
            setMenuOpen(false);
            onReserve(e);
          }}
        >
          预约试听
        </button>
      </div>
    </header>
  );
}