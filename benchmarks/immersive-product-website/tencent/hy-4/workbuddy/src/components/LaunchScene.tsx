import type { CSSProperties } from 'react'
import { HeroInstallation } from './HeroInstallation'
import { MagneticButton } from './MagneticButton'
import { ArrowDown, ArrowUpRight, Play } from '../lib/icons'

type Props = {
  onReserve: (origin: { x: number; y: number }) => void
  onStory: () => void
}

export function LaunchScene({ onReserve, onStory }: Props) {
  const goStructure = () => document.getElementById('structure')?.scrollIntoView({ behavior: 'smooth' })

  return (
    <section className="launch" id="top" aria-labelledby="launch-title">
      <div className="launch__ghost" aria-hidden="true">NOCTURNE</div>
      <div className="launch__grid" aria-hidden="true">
        <span /><span /><span /><span />
      </div>

      <div className="launch__inner shell">
        <div className="launch__copy">
          <div className="eyebrow enter" style={{ '--d': '120ms' } as CSSProperties}>
            <span className="eyebrow__dot" />
            <span>NOCTURNE ONE</span>
            <span className="eyebrow__rule" />
            <span>EDITION 01 / 2026</span>
          </div>

          <h1 className="launch__title display" id="launch-title">
            <span className="enter--mask"><span style={{ animationDelay: '300ms' }}>听见空间，</span></span>
            <span className="enter--mask"><span style={{ animationDelay: '430ms' }}>而不只是<em>声音</em>。</span></span>
          </h1>

          <p className="launch__lede enter" style={{ '--d': '620ms' } as CSSProperties}>
            NOCTURNE ONE 以透明双腔体、个性化 HRTF 与 42 小时续航，重新定义私人声场。
          </p>

          <div className="launch__actions enter" style={{ '--d': '780ms' } as CSSProperties}>
            <MagneticButton onActivate={onReserve} aria-haspopup="dialog">
              预约试听 <ArrowUpRight size={17} />
            </MagneticButton>
            <button type="button" className="btn btn--ghost" onClick={onStory} aria-haspopup="dialog">
              <span className="btn__label"><Play size={14} /> 观看 90 秒设计故事</span>
            </button>
          </div>

          <div className="launch__meta enter" style={{ '--d': '940ms' } as CSSProperties}>
            <div className="launch__meta-item">
              <span className="mono-label">ACOUSTIC ARCHITECTURE</span>
              <strong>透明双腔体</strong>
            </div>
            <div className="launch__meta-item">
              <span className="mono-label">SPATIAL RENDERING</span>
              <strong>个性化 HRTF</strong>
            </div>
            <div className="launch__meta-item">
              <span className="mono-label">ENDURANCE</span>
              <strong>42 小时</strong>
            </div>
          </div>
        </div>

        <div className="launch__visual">
          <HeroInstallation />
        </div>
      </div>

      <button type="button" className="launch__scroll enter" style={{ '--d': '1700ms' } as CSSProperties} onClick={goStructure}>
        <span className="mono-label">SCROLL TO EXPLORE</span>
        <span className="launch__scroll-line"><ArrowDown size={14} /></span>
      </button>

      <div className="launch__corner mono-label" aria-hidden="true">N° 01 / 04 SECTIONS</div>
    </section>
  )
}
