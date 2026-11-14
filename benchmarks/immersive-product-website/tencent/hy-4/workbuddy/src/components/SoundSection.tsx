import { useInView } from '../lib/hooks'
import { Soundstage } from './Soundstage'

const PRINCIPLES = [
  { n: '01', title: '个性化 HRTF', en: 'PERSONALISED HRTF', text: '以耳廓扫描建立专属头部传递函数，让方位不再依赖预设。' },
  { n: '02', title: '双腔体导流', en: 'DUAL CHAMBER', text: '前后腔独立调谐，把驻波拆散，只留下干净的瞬态。' },
  { n: '03', title: '动态头部追踪', en: 'HEAD TRACKING', text: '转头时声像保持稳定，舞台始终固定在房间，而非固定在耳边。' },
]

export function SoundSection() {
  const ref = useInView<HTMLDivElement>()

  return (
    <section className="sound section" id="sound" aria-labelledby="sound-title">
      <div className="shell sound__inner" ref={ref}>
        <div className="section-head reveal">
          <span className="section-index">01 / SOUND</span>
          <h2 className="section-title display" id="sound-title">声音有坐标。<br /><span className="text-dim">让位置被听见。</span></h2>
        </div>

        <div className="sound__grid">
          <div className="sound__copy reveal" style={{ transitionDelay: '120ms' }}>
            <p className="body-lg">
              传统立体声只给你左右。NOCTURNE ONE 在透明腔体内重建了三维声场：
              人声有距离，混响有体积，寂静有方向。
            </p>
            <p className="body-sm">
              Spatial Engine 每秒 240 次重算头部姿态与房间响应，把每一轨重新安放到它本该在的位置。
            </p>
            <ul className="sound__list">
              {PRINCIPLES.map((p) => (
                <li key={p.n} tabIndex={0}>
                  <span className="section-index">{p.n}</span>
                  <div>
                    <div className="sound__list-head"><strong>{p.title}</strong><span className="mono-label">{p.en}</span></div>
                    <p>{p.text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="sound__stage-wrap reveal" style={{ transitionDelay: '220ms' }}>
            <Soundstage />
            <div className="sound__stage-foot mono-label">
              <span>FIG. 02 — 360° SPATIAL FIELD</span>
              <span>REALTIME RENDER / 240 HZ</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
