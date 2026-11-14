import { useState } from 'react'
import { useInView } from '../lib/hooks'
import { MagneticButton } from './MagneticButton'
import { ArrowUpRight, Check, Plus } from '../lib/icons'

const SPECS = [
  { n: '01', label: '整机重量', en: 'WEIGHT', value: '312', unit: 'g', note: '含耳垫，均衡配重' },
  { n: '02', label: '无线连接', en: 'BLUETOOTH', value: '5.4', unit: '', note: 'LE Audio / LC3plus / 多点连接' },
  { n: '03', label: '续航时间', en: 'BATTERY LIFE', value: '42', unit: 'h', note: '空间音频与降噪同时开启' },
  { n: '04', label: '快速充电', en: 'FAST CHARGE', value: '10 / 6', unit: 'min / h', note: 'USB-C，充电 10 分钟播放 6 小时' },
]

const MINOR = [
  ['驱动单元', '38 mm 铍振膜'],
  ['频率响应', '5 Hz – 40 kHz'],
  ['腔体结构', '透明双腔体'],
  ['空间引擎', 'HRTF / 头部追踪'],
]

export function Specifications({ onReserve }: { onReserve: (origin: { x: number; y: number }) => void }) {
  const ref = useInView<HTMLDivElement>()
  const [bag, setBag] = useState(false)
  const [details, setDetails] = useState(false)

  return (
    <section className="spec section" id="specifications" aria-label="技术规格与购买">
      <div className="shell" ref={ref}>
        <div className="spec__grid">
          <aside className="spec__aside reveal">
            <span className="section-index">04 / SPECIFICATIONS</span>
            <h2 className="section-title display">技术档案<span className="amber">.</span></h2>
            <p className="body-sm">所有数字均为量产机实测值，非实验室理想条件下取得。</p>
            <div className="spec__aside-block">
              <span className="mono-label">DOCUMENT</span>
              <strong className="num">N01 / TDS-2026.11</strong>
              <span className="mono-label">REVISION 03 · SHANGHAI</span>
            </div>
            <div className="spec__seal" aria-hidden="true">
              <span>N</span>
              <small>ACOUSTIC<br />INSTRUMENT</small>
            </div>
          </aside>

          <div className="spec__main">
            <div className="spec__rows reveal">
              {SPECS.map((s, i) => (
                <div className="spec__row" key={s.n} style={{ transitionDelay: `${i * 70}ms` }}>
                  <span className="section-index">{s.n}</span>
                  <div className="spec__row-name">
                    <strong>{s.label}</strong>
                    <span className="mono-label">{s.en}</span>
                  </div>
                  <div className="spec__row-value num">
                    {s.value}<small>{s.unit}</small>
                  </div>
                  <span className="spec__row-note">{s.note}</span>
                </div>
              ))}
            </div>
            <div className="spec__minor reveal">
              {MINOR.map(([k, v]) => (
                <div key={k}><span className="mono-label">{k}</span><strong>{v}</strong></div>
              ))}
            </div>
          </div>
        </div>

        <div id="purchase" className="purchase glass reveal">
          <div className="purchase__left">
            <div className="eyebrow"><span className="eyebrow__dot" /><span>AVAILABLE NOW</span><span className="eyebrow__rule" /><span>首批限量</span></div>
            <h3 className="display">把一整个声场，<br />带回家。</h3>
            <p className="body-sm">每台 NOCTURNE ONE 附赠一次一对一 HRTF 耳廓校准，以及 30 天无理由试听。</p>
            <div className="purchase__includes">
              <span><Check size={14} /> 定制收纳盒</span>
              <span><Check size={14} /> 3.5 mm 无氧铜线</span>
              <span><Check size={14} /> HRTF 校准服务</span>
            </div>
          </div>

          <div className="purchase__right">
            <div className="purchase__price">
              <span className="mono-label">LAUNCH PRICE / 首发价</span>
              <div className="purchase__price-value num"><small>¥</small>3,499</div>
              <span className="purchase__price-note">含税 · 顺丰包邮 · 两年保修</span>
            </div>
            <MagneticButton className="btn--wide" onActivate={onReserve} aria-haspopup="dialog">
              预约试听 <ArrowUpRight size={17} />
            </MagneticButton>
            <button
              type="button"
              className={`purchase__bag btn btn--ghost btn--wide ${bag ? 'is-added' : ''}`}
              onClick={() => setBag((v) => !v)}
              aria-pressed={bag}
            >
              <span className="btn__label">{bag ? <><Check size={16} /> 已加入清单</> : <><Plus size={16} /> 加入购物清单</>}</span>
            </button>
            <button
              type="button"
              className="purchase__disclosure"
              aria-expanded={details}
              onClick={() => setDetails((v) => !v)}
            >
              配送与保修详情 <span>{details ? '−' : '+'}</span>
            </button>
            {details && (
              <p className="purchase__details">
                下单后 48 小时内由上海声学工作室发出；中国大陆地区顺丰包邮，预计 2–4 个工作日送达。
                整机两年有限保修，耳垫与线材一年。30 天内可申请上门取件退货。
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
