import { ArrowUp } from '@phosphor-icons/react';
import { scrollToSection } from '../lib/reservation';

const LINKS = [
  { label: '技术白皮书', href: '#' },
  { label: '声音实验室', href: '#' },
  { label: '线下门店', href: '#' },
  { label: '加入我们', href: '#' },
  { label: '隐私政策', href: '#' },
  { label: '服务条款', href: '#' },
];

export function Footer() {
  return (
    <footer className="foot">
      <div className="foot__rule" />
      <div className="shell foot__cover">
        <div className="foot__colophon">
          <p className="foot__issue mono">
            NOCTURNE — 品牌刊物 · 第一版 · 2025 年秋季
          </p>
          <p className="foot__statement">
            NOCTURNE 由一群声学工程师与工业设计师在深圳与哥本哈根共同创立。
            我们花了四年时间，只为让空间音频听起来不像一项功能，
            而像你本来就在的那个房间。
          </p>
          <address className="foot__contact">
            <span className="mono">声音实验室</span>
            <span>深圳市南山区科苑南路 3099 号 A 座 21 层</span>
            <span className="mono">hi@nocturne.audio · 400-820-1987</span>
          </address>
        </div>

        <div className="foot__barcode" aria-hidden="true">
          <svg viewBox="0 0 120 68" className="foot__barcode-svg">
            {[
              2, 1, 3, 1, 1, 2, 4, 1, 2, 1, 1, 3, 2, 1, 1, 4, 1, 2, 3, 1, 2, 1,
              1, 2, 1, 3, 1, 1, 2, 4, 1, 1, 3, 2, 1, 1,
            ].map((w, i, arr) => {
              const gap = 2.2;
              const prev = arr.slice(0, i).reduce((a, b) => a + b + gap, 4);
              return (
                <rect
                  key={i}
                  x={prev}
                  y={i % 5 === 0 ? 4 : 8}
                  width={w}
                  height={i % 5 === 0 ? 46 : 42}
                  fill="currentColor"
                />
              );
            })}
          </svg>
          <span className="mono">N1-2025-CN · 500</span>
        </div>
      </div>

      <nav className="shell foot__links" aria-label="页脚导航">
        {LINKS.map((l) => (
          <a key={l.label} href={l.href} className="foot__link">
            {l.label}
          </a>
        ))}
      </nav>

      <div className="foot__imprint" aria-hidden="true">
        <span>NOCTURNE</span>
      </div>

      <div className="shell foot__base">
        <p className="mono">
          © 2025 NOCTURNE ACOUSTICS · 保留所有权利 · 设计与制造于中国
        </p>
        <div className="foot__base-right">
          <span className="mono">听感因人而异 · 建议到店试听</span>
          <button
            type="button"
            className="btn btn--quiet foot__top"
            onClick={() => scrollToSection('top')}
          >
            <span className="btn__icon" aria-hidden="true">
              <ArrowUp size={13} weight="bold" />
            </span>
            <span className="btn__label mono">回到顶部</span>
          </button>
        </div>
      </div>
    </footer>
  );
}
