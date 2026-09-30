import { useEffect, useRef, useState } from "react";
import { Icon } from "./Icon";

export function Navigation() {
  const nav = useRef<HTMLElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) =>
      nav.current?.classList.toggle("scrolled", !entry.isIntersecting),
    );
    const sentinel = document.querySelector(".top-sentinel");
    if (sentinel) observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!open) return;
    const close = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        menuButton.current?.focus();
      }
    };
    const outside = (e: PointerEvent) => {
      if (!nav.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", close);
    document.addEventListener("pointerdown", outside);
    return () => {
      document.removeEventListener("keydown", close);
      document.removeEventListener("pointerdown", outside);
    };
  }, [open]);
  return (
    <header className="floating-nav glass" ref={nav}>
      <a
        className="brand"
        href="#"
        aria-label="NOCTURNE 首页"
        onClick={() => setOpen(false)}
      >
        <span className="brand-symbol">
          <i />
          <i />
          <i />
        </span>
        NOCTURNE<span className="brand-period">®</span>
      </a>
      <nav
        id="main-navigation"
        className={`main-nav ${open ? "menu-open" : ""}`}
        aria-label="主导航"
      >
        <a href="#sound" onClick={() => setOpen(false)}>
          Sound
        </a>
        <a href="#structure" onClick={() => setOpen(false)}>
          Structure
        </a>
        <a href="#specifications" onClick={() => setOpen(false)}>
          Specifications
        </a>
      </nav>
      <div className="nav-actions">
        <a
          className="nav-purchase"
          href="#purchase"
          onClick={() => setOpen(false)}
        >
          Purchase
          <Icon size={15} />
        </a>
        <button
          ref={menuButton}
          className="mobile-menu icon-button"
          aria-label={open ? "关闭导航菜单" : "打开导航菜单"}
          aria-expanded={open}
          aria-controls="main-navigation"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? (
            <Icon name="close" size={17} />
          ) : (
            <svg
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
              aria-hidden="true"
            >
              <path d="M5 8h14M5 16h14" />
            </svg>
          )}
        </button>
      </div>
    </header>
  );
}
