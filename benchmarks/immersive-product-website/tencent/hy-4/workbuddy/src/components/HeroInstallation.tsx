import type { CSSProperties } from 'react'
import { ProductVisual } from './ProductVisual'
import { usePrefersReducedMotion } from '../lib/hooks'

/** All continuous motion here is pure CSS; this component never re-renders. */
export function HeroInstallation() {
  const reduced = usePrefersReducedMotion()
  return (
    <div className="install" aria-hidden="false">
      <div className="install__volumetric" />
      <div className="install__ambient" />
      <div className="install__backdrop-ring" />
      <div className="install__backdrop-ring install__backdrop-ring--two" />

      <svg className="install__orbits" viewBox="0 0 720 780" aria-hidden="true">
        <g className="install__orbit-group" style={{ transformOrigin: '360px 430px' }}>
          <ellipse cx="360" cy="430" rx="306" ry="132" transform="rotate(-16 360 430)" fill="none" stroke="rgba(206,224,226,.11)" strokeWidth="1" strokeDasharray="2 9" />
          <ellipse cx="360" cy="430" rx="258" ry="212" transform="rotate(24 360 430)" fill="none" stroke="rgba(206,224,226,.07)" strokeWidth="1" />
          {!reduced && <circle cx="666" cy="430" r="3" fill="var(--amber)" />}
        </g>
        <ellipse cx="360" cy="430" rx="306" ry="132" transform="rotate(-16 360 430)" fill="none" stroke="rgba(206,224,226,.06)" strokeWidth="1" />
      </svg>

      <div className="install__enter enter--product" style={{ '--d': '240ms' } as CSSProperties}>
        <div className="install__float">
          <ProductVisual className="install__product" />
        </div>
      </div>

      <div className="install__floor" />
      <div className="install__floor-line" />

      <svg className="install__leaders" viewBox="0 0 720 780" preserveAspectRatio="none" aria-hidden="true">
        <path d="M 122 176 L 216 176 L 300 244" />
        <path d="M 640 372 L 574 372 L 546 404" />
        <path d="M 148 622 L 246 622 L 332 574" />
        <circle cx="300" cy="244" r="3" />
        <circle cx="546" cy="404" r="3" />
        <circle cx="332" cy="574" r="3" />
      </svg>

      <div className="install__huds">
        <div className="hud hud--a glass enter" style={{ '--d': '1080ms' } as CSSProperties}>
          <div className="hud__top"><span className="hud__pulse" />LIVE TELEMETRY</div>
          <div className="hud__value num">42<span>h</span></div>
          <div className="hud__label">单次充电续航</div>
        </div>

        <div className="hud hud--b glass enter" style={{ '--d': '1220ms' } as CSSProperties}>
          <div className="hud__top"><span className="hud__pulse" />SPATIAL ENGINE</div>
          <div className="hud__value hud__value--text">HRTF</div>
          <div className="hud__label">个性化头部传递函数</div>
        </div>

        <div className="hud hud--c glass enter" style={{ '--d': '1360ms' } as CSSProperties}>
          <div className="hud__top"><span className="hud__pulse" />ACOUSTIC CORE</div>
          <div className="hud__value num">38<span>mm</span></div>
          <div className="hud__label">铍振膜驱动单元</div>
        </div>
      </div>

      <div className="install__serial mono-label enter" style={{ '--d': '1600ms' } as CSSProperties}>
        FIG. 01 — DUAL CHAMBER ASSEMBLY / SCALE 1:1
      </div>
    </div>
  )
}
