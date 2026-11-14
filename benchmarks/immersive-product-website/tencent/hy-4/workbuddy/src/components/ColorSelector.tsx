import { useInView } from '../lib/hooks'
import { FINISHES } from '../lib/theme'
import type { FinishId } from '../lib/theme'
import { ProductVisual } from './ProductVisual'

type Props = {
  value: FinishId
  onChange: (id: FinishId) => void
}

export function ColorSelector({ value, onChange }: Props) {
  const ref = useInView<HTMLDivElement>()
  const active = FINISHES.find((f) => f.id === value) ?? FINISHES[0]

  return (
    <section className="finish section" id="finish" aria-labelledby="finish-title">
      <div className="shell finish__inner" ref={ref}>
        <div className="finish__copy reveal">
          <span className="section-index">03 / FINISH</span>
          <h2 className="section-title display" id="finish-title">三种表面，<br /><span className="text-dim">同一片黑暗。</span></h2>
          <p className="body-sm">阳极氧化与喷砂在冷光下呈现不同深度。选择一种，整间房间会跟着改变色温。</p>

          <fieldset className="finish__picker">
            <legend className="mono-label">SELECT FINISH / 选择饰面</legend>
            {FINISHES.map((f) => (
              <label key={f.id} className={`finish__option ${value === f.id ? 'is-selected' : ''}`}>
                <input
                  type="radio"
                  name="finish"
                  value={f.id}
                  checked={value === f.id}
                  onChange={() => onChange(f.id)}
                />
                <span className="finish__swatch" style={{ background: f.swatch }} aria-hidden="true" />
                <span className="finish__option-text">
                  <strong>{f.name}</strong>
                  <span className="mono-label">{f.en.toUpperCase()}</span>
                </span>
                <span className="finish__option-code num">{f.code}</span>
                <span className="finish__option-check" aria-hidden="true" />
              </label>
            ))}
          </fieldset>

          <div className="finish__note">
            <span className="mono-label">MATERIAL NOTE</span>
            <p key={active.id} className="finish__note-text">{active.note}</p>
          </div>
        </div>

        <div className="finish__stage reveal" style={{ transitionDelay: '160ms' }}>
          <div className="finish__stage-glow" />
          <div className="finish__stage-disc" />
          <div className="finish__stage-product">
            <ProductVisual sweep={false} title={`${active.name} 配色的 NOCTURNE ONE`} />
          </div>
          <div className="finish__stage-hud glass">
            <span className="mono-label">CURRENT FINISH</span>
            <strong>{active.name}</strong>
            <span className="num">{active.code}</span>
          </div>
          <span className="finish__stage-caption mono-label">FIG. 04 — SURFACE &amp; LIGHT / STUDIO 02</span>
          <div className="finish__stage-ruler" aria-hidden="true">
            {Array.from({ length: 13 }, (_, i) => <i key={i} />)}
          </div>
        </div>
      </div>
    </section>
  )
}
