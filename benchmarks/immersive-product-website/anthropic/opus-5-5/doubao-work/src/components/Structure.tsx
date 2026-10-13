import { useEffect, useRef, useState } from 'react'
import { Headphones } from './Headphones'

const STEPS = [
  {
    k: '00',
    title: '一体，静默',
    en: 'Assembled',
    body: '312 g 的整机，重心落在头顶正中。外观没有一颗可见螺丝，所有结构都藏在下面三层里。',
  },
  {
    k: '01',
    title: '耳罩，向外打开',
    en: 'Earcups',
    body: '记忆蛋白皮耳垫与外壳分离，磁吸固定，可在 3 秒内更换。内侧 18 mm 深度，耳廓不接触驱动单元。',
  },
  {
    k: '02',
    title: '透明声学腔，浮出',
    en: 'Acoustic Chambers',
    body: '双腔体由光学级聚碳酸酯一次成型，前腔负责细节，后腔释放低频压力。38 mm 铍涂层振膜置于正中，你可以直接看见它。',
  },
  {
    k: '03',
    title: '头梁，最后升起',
    en: 'Headband',
    body: '航空铝骨架外覆单层鞣制皮革，内部悬浮带分散压力。滑轨 14 档阻尼，每一档都有可感知的段落感。',
  },
] as const

export function Structure() {
  const [step, setStep] = useState(0)
  const refs = useRef<(HTMLElement | null)[]>([])

  useEffect(() => {
    // On stacked layouts the product is pinned to the top half, so steps activate lower down.
    const stacked = window.matchMedia('(max-width: 1023px)').matches
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setStep(Number((e.target as HTMLElement).dataset.step))
        }
      },
      { rootMargin: stacked ? '-76% 0px -22% 0px' : '-48% 0px -48% 0px' },
    )
    refs.current.forEach((el) => el && io.observe(el))
    return () => io.disconnect()
  }, [])

  return (
    <section id="structure" aria-labelledby="structure-title" className="relative scroll-mt-20 border-t border-white/[0.05]">
      <div className="mx-auto max-w-[1280px] px-5 pt-28 sm:px-8 md:pt-36 lg:px-10">
        <div className="grid grid-cols-1 items-end gap-6 md:grid-cols-12">
          <p className="eyebrow reveal md:col-span-3">02 — Structure</p>
          <h2 id="structure-title" className="reveal text-[clamp(2rem,4.4vw,3.8rem)] font-semibold leading-[1.08] tracking-[-0.03em] text-ice-50 md:col-span-9" style={{ ['--rd' as string]: '0.08s' }}>
            拆开它，<span className="text-ice-400">每一层都值得被看见。</span>
          </h2>
        </div>
      </div>

      <div className="mx-auto grid max-w-[1280px] grid-cols-1 px-5 sm:px-8 lg:grid-cols-12 lg:gap-10 lg:px-10">
        {/* Sticky product */}
        <div className="sticky top-14 z-0 h-[48svh] md:top-20 md:h-[56svh] lg:order-2 lg:col-span-7 lg:top-0 lg:h-[100dvh]">
          <div className="relative flex h-full items-center justify-center">
            <div aria-hidden="true" className="absolute inset-[12%] rounded-full" style={{ background: 'radial-gradient(circle, var(--ambient), transparent 64%)', filter: 'blur(30px)', opacity: 0.8 }} />
            <div className="relative aspect-square h-full max-h-[640px] max-w-full" style={{ filter: 'drop-shadow(0 30px 40px rgba(0,0,0,.5))' }}>
              <Headphones explode={step as 0 | 1 | 2 | 3} className="h-full w-full" title={`NOCTURNE ONE 结构分解：${STEPS[step].title}`} />
              {/* callouts */}
              <Callout on={step >= 1} className="left-[0%] top-[78%]" label="Earcup" value="磁吸 · 18 mm" />
              <Callout on={step >= 2} className="right-[0%] top-[42%]" label="Chamber" value="双腔 · 38 mm" align="right" />
              <Callout on={step >= 3} className="left-1/2 top-[0%] -translate-x-1/2" label="Headband" value="14 档阻尼" />
            </div>
            {/* progress rail */}
            <ol className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-2 lg:bottom-10" aria-label="结构分解进度">
              {STEPS.map((s, i) => (
                <li key={s.k} className="h-[3px] w-8 overflow-hidden rounded-full bg-white/10">
                  <span className="block h-full origin-left bg-amber transition-transform duration-700" style={{ transform: `scaleX(${i <= step ? 1 : 0})` }} />
                  <span className="sr-only">{s.en}{i === step ? '（当前）' : ''}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* Steps */}
        <div className="relative z-10 lg:order-1 lg:col-span-5">
          {STEPS.map((s, i) => (
            <article
              key={s.k}
              ref={(el) => { refs.current[i] = el }}
              data-step={i}
              data-active={step === i}
              className="step flex min-h-[64svh] flex-col justify-end pb-[6svh] pt-10 lg:min-h-[100dvh] lg:justify-center lg:py-10"
            >
              <div className={`glass max-w-[440px] p-6 sm:p-8 lg:bg-transparent ${i % 2 ? 'lg:ml-10' : ''}`} style={{ ['--r' as string]: '26px' }}>
                <p className="mono flex items-center gap-3 text-[11px] tracking-[0.2em] text-amber-soft">
                  <span>{s.k}</span>
                  <span className="h-px w-6 bg-amber/50" />
                  <span className="uppercase text-ice-400">{s.en}</span>
                </p>
                <h3 className="mt-4 text-[clamp(1.4rem,2.2vw,1.9rem)] font-medium tracking-[-0.02em] text-ice-50">{s.title}</h3>
                <p className="mt-3 text-[15px] leading-[1.85] text-ice-300">{s.body}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

function Callout({ on, className, label, value, align = 'left' }: { on: boolean; className: string; label: string; value: string; align?: 'left' | 'right' }) {
  return (
    <div className={`callout absolute ${className}`} data-on={on} aria-hidden={!on}>
      <div className={`glass glass-thin px-3 py-2 ${align === 'right' ? 'text-right' : ''}`} style={{ ['--r' as string]: '12px' }}>
        <p className="eyebrow !text-[9px]">{label}</p>
        <p className="mt-0.5 text-[12.5px] text-ice-50">{value}</p>
      </div>
    </div>
  )
}
