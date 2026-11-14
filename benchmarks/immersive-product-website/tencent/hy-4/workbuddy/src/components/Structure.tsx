import { useEffect, useRef } from 'react'
import type { CSSProperties } from 'react'
import { ExplodedProduct } from './ExplodedProduct'

const STEPS = [
  {
    n: '01',
    en: 'SUSPENDED HEADBAND',
    title: '一副不施加压力的骨架',
    text: '一体成型铝合金头梁，内衬液态硅胶。压力被分散到 240 mm 的接触弧上，长时间佩戴仍然忘记它的存在。',
    spec: '312 g / 均衡配重',
  },
  {
    n: '02',
    en: 'TRANSPARENT DUAL CHAMBER',
    title: '让空气有两条出路',
    text: '前后腔以 0.4 mm 声学导管独立相连，透明蓝宝石复合腔壁让驻波被看见，也被拆散。低频下潜至 5 Hz，却不带一丝浑浊。',
    spec: '5 Hz – 40 kHz / 双腔独立调谐',
  },
  {
    n: '03',
    en: '38 MM BERYLLIUM DRIVER',
    title: '极轻的振膜，极快的安静',
    text: '铍振膜厚度不足人发的十分之一，瞬态响应快到可以分辨录音室里椅子轻微的移动。声音停止时，房间立刻安静下来。',
    spec: '38 mm / 铍振膜 / 0.02 mm',
  },
]

export function Structure() {
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const section = sectionRef.current
    if (!section) return
    let raf = 0
    let inView = false

    const update = () => {
      raf = 0
      if (!inView || window.innerWidth < 768) return
      const rect = section.getBoundingClientRect()
      const total = rect.height - window.innerHeight
      const p = total > 0 ? Math.min(1, Math.max(0, -rect.top / total)) : 0
      section.style.setProperty('--explode', (0.3 + p * 0.7).toFixed(4))
      const s = p < 0.34 ? 0 : p < 0.68 ? 1 : 2
      if (section.dataset.stage !== String(s)) section.dataset.stage = String(s)
    }
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update) }
    const io = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting
      if (inView) onScroll()
    })
    io.observe(section)
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    update()
    return () => {
      io.disconnect()
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <section className="structure" id="structure" ref={sectionRef} data-stage="0" style={{ '--explode': 0.3 } as CSSProperties} aria-labelledby="structure-title">
      <div className="structure__sticky">
        <div className="shell structure__inner">
          <div className="structure__left">
            <div className="structure__head">
              <span className="section-index">02 / STRUCTURE</span>
              <h2 className="section-title display" id="structure-title">拆开，<br /><span className="text-dim">才看得见安静。</span></h2>
              <p className="body-sm">五层结构，逐层分离。向下滚动，观察每一个被精密安放的部件。</p>
            </div>

            <div className="structure__steps">
              {STEPS.map((s, i) => (
                <article className={`structure__step step--${i}`} key={s.n}>
                  <div className="structure__step-top">
                    <span className="section-index">{s.n}</span>
                    <span className="mono-label">{s.en}</span>
                  </div>
                  <h3>{s.title}</h3>
                  <p>{s.text}</p>
                  <span className="structure__step-spec mono-label">{s.spec}</span>
                </article>
              ))}
            </div>

            <div className="structure__progress" aria-hidden="true">
              <span className="mono-label">ASSEMBLY / DISASSEMBLY</span>
              <div className="structure__progress-track"><i /></div>
            </div>
          </div>

          <div className="structure__stage">
            <div className="structure__stage-frame">
              <ExplodedProduct />
              <span className="structure__stage-tag mono-label">FIG. 03 — EXPLODED VIEW / 1:1</span>
              <span className="structure__stage-code mono-label">N01-ASM-05</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
