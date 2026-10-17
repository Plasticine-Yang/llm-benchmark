import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { HeadphoneArt } from './HeadphoneArt'
import './Structure.css'

gsap.registerPlugin(ScrollTrigger)

const chapters = [
  {
    number: '01',
    label: '耳罩 / 双腔结构',
    title: '双腔耳罩',
    accent: '不是封闭，\n是给低频留出呼吸。',
    copy: '外壳与压力环彼此独立，两层阻尼之间留出一段可控空气。低频因此有重量，却不拖住任何细节。',
    spec: 'CNC 铝壳 · 记忆棉 · 磁吸耳垫',
  },
  {
    number: '02',
    label: '声学腔体 / 透明层',
    title: '透明声学腔体',
    accent: '把声音的结构，\n留在看得见的地方。',
    copy: '38 mm 铍振膜悬浮在双层硼硅玻璃之间。共振被约束，瞬态被放开——你能直接看见声音的边界。',
    spec: '双层硼硅玻璃 · 38 mm 铍振膜 · 0.3 mm 气密层',
  },
  {
    number: '03',
    label: '头梁 / 钛合金悬臂',
    title: '一体式头梁',
    accent: '把重量交给结构，\n而不是耳朵。',
    copy: '一根 β 钛合金悬臂贯穿头顶，三档自适应张力沿最轻的路径分散压力。312 g，在佩戴后安静消失。',
    spec: 'β 钛合金 · 三档张力 · 312 g',
  },
]

export function Structure() {
  const sectionRef = useRef<HTMLElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const chapterRefs = useRef<HTMLElement[]>([])

  useLayoutEffect(() => {
    const section = sectionRef.current
    if (!section) return

    const triggers: ScrollTrigger[] = []

    const setStep = (step: number) => {
      if (stageRef.current) stageRef.current.dataset.step = String(step)
      chapterRefs.current.forEach((chapter, index) => {
        chapter.dataset.active = index + 1 === step ? 'true' : 'false'
      })
    }

    setStep(0)

    const ctx = gsap.context(() => {
      const intro = section.querySelector<HTMLElement>('.structure__intro')
      if (intro) {
        ScrollTrigger.create({
          trigger: intro,
          start: 'top 70%',
          end: 'bottom 35%',
          onEnter: () => setStep(0),
          onEnterBack: () => setStep(0),
        })
      }

      chapterRefs.current.forEach((chapter, index) => {
        triggers.push(
          ScrollTrigger.create({
            trigger: chapter,
            start: 'top 62%',
            end: 'bottom 45%',
            onEnter: () => setStep(index + 1),
            onEnterBack: () => setStep(index + 1),
            onLeaveBack: () => {
              if (index === 0) setStep(0)
            },
          }),
        )
      })
    }, section)

    requestAnimationFrame(() => ScrollTrigger.refresh())

    return () => {
      triggers.forEach((trigger) => trigger.kill())
      ctx.revert()
    }
  }, [])

  return (
    <section id="structure" className="structure" aria-labelledby="structure-title" ref={sectionRef}>
      <div className="structure__ambient" aria-hidden="true" />
      <span className="structure__watermark" aria-hidden="true">
        解
      </span>

      <div className="structure__intro shell">
        <div className="section-index" data-reveal>
          <span>03</span>
          <span aria-hidden="true">—</span>
          <strong>结构解构</strong>
        </div>
        <div className="structure__intro-grid">
          <h2 className="section-heading structure__title" id="structure-title" data-reveal data-reveal-delay="0.08">
            拆开之后，
            <br />
            才听得见<span className="accent">全部</span>。
          </h2>
          <div className="structure__intro-side" data-reveal data-reveal-delay="0.16">
            <p className="section-copy">
              三层结构，各自承担不同的沉默。将每一个部件推离原位，看见声音在抵达耳朵之前，经过了什么。
            </p>
            <div className="structure__scroll-note">
              <span className="structure__scroll-thread" aria-hidden="true" />
              <span>继续滚动，逐层拆解</span>
              <span className="mono">SCROLL / 03</span>
            </div>
          </div>
        </div>
      </div>

      <div className="structure__scroller">
        <div className="structure__grid shell">
          <div className="structure__stage-wrap">
            <div className="structure__stage" data-step="0" ref={stageRef}>
              <div className="structure__stage-chrome" aria-hidden="true">
                <span className="structure__chrome-top mono">FIG. 03 / EXPLODED ASSEMBLY</span>
                <span className="structure__chrome-side mono">0—312 G</span>
                <div className="structure__stage-axis structure__stage-axis--x" />
                <div className="structure__stage-axis structure__stage-axis--y" />
                <div className="structure__orbit-line structure__orbit-line--outer" />
                <div className="structure__orbit-line structure__orbit-line--inner" />
                <span className="structure__crosshair structure__crosshair--tl" />
                <span className="structure__crosshair structure__crosshair--br" />
                <div className="structure__scale-marks" />
              </div>

              <div className="structure__art">
                <HeadphoneArt
                  animated={false}
                  className="structure__headphone"
                  ariaLabel="NOCTURNE ONE 结构分解视图，展示耳罩、透明声学腔体与钛合金头梁"
                />
              </div>

              <div className="structure__stage-state mono" aria-hidden="true">
                <span>装配状态</span>
                <span className="structure__stage-state-slash">/</span>
                <span>分解中</span>
              </div>

              <div className="structure__callout structure__callout--01" data-callout="1" aria-hidden="true">
                <span className="structure__callout-index mono">01</span>
                <span className="structure__callout-line" />
                <div>
                  <strong>双腔耳罩</strong>
                  <small>独立压力环 / 记忆棉</small>
                </div>
              </div>

              <div className="structure__callout structure__callout--02" data-callout="2" aria-hidden="true">
                <span className="structure__callout-index mono">02</span>
                <span className="structure__callout-line" />
                <div>
                  <strong>透明声学腔体</strong>
                  <small>双层玻璃 / 38 mm</small>
                </div>
              </div>

              <div className="structure__callout structure__callout--03" data-callout="3" aria-hidden="true">
                <span className="structure__callout-index mono">03</span>
                <span className="structure__callout-line" />
                <div>
                  <strong>钛合金头梁</strong>
                  <small>三档张力 / β 钛</small>
                </div>
              </div>

              <div className="structure__stage-legend" aria-hidden="true">
                <span className="mono">ASSEMBLY / 01—03</span>
                <span className="structure__legend-rule" />
                <span className="mono">NOCTURNE ONE</span>
              </div>
            </div>
          </div>

          <div className="structure__chapters">
            {chapters.map((chapter, index) => (
              <article
                key={chapter.number}
                className="structure__chapter"
                data-active="false"
                ref={(element) => {
                  if (element) chapterRefs.current[index] = element
                }}
              >
                <div className="structure__chapter-top">
                  <span className="mono structure__chapter-number">{chapter.number}</span>
                  <span className="structure__chapter-label">{chapter.label}</span>
                  <span className="structure__chapter-progress" aria-hidden="true">
                    <i />
                    <i />
                    <i />
                  </span>
                </div>
                <h3 className="structure__chapter-title">
                  {chapter.title.slice(0, 2)}
                  <span>{chapter.title.slice(2)}</span>
                </h3>
                <p className="structure__chapter-accent">{chapter.accent}</p>
                <p className="structure__chapter-copy">{chapter.copy}</p>
                <p className="structure__chapter-spec mono">{chapter.spec}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
