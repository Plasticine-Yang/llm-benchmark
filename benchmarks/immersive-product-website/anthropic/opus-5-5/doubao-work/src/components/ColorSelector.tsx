import { memo } from 'react'
import { FINISHES, type FinishId } from '../data'
import { setFinish, useFinish } from '../store'
import { Headphones } from './Headphones'

/**
 * Finish selector. The product colours and ambient light are CSS custom properties on :root,
 * registered with @property, so a single data-attribute change crossfades everything on the page.
 */
export function ColorSelector() {
  const finish = useFinish()
  const current = FINISHES.find((f) => f.id === finish)!

  return (
    <section id="finish" aria-labelledby="finish-title" className="relative isolate overflow-hidden border-t border-white/[0.05] py-28 md:py-36">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-[30%] top-1/2 h-[110vmin] w-[110vmin] -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ background: 'radial-gradient(circle, var(--ambient) 0%, transparent 58%)', filter: 'blur(50px)' }} />
      </div>
      <div className="mx-auto grid max-w-[1280px] grid-cols-1 items-center gap-12 px-5 sm:px-8 lg:grid-cols-12 lg:px-10">
        <div className="relative order-2 lg:order-1 lg:col-span-7">
          <FinishStage />
          <p className="mono pointer-events-none absolute bottom-0 left-0 select-none text-[clamp(3rem,10vw,8.5rem)] font-semibold leading-none tracking-[-0.05em] text-white/[0.035]" aria-hidden="true">
            {current.name.toUpperCase()}
          </p>
        </div>
        <div className="order-1 lg:order-2 lg:col-span-5">
          <p className="eyebrow reveal">03 — Finish</p>
          <h2 id="finish-title" className="reveal mt-5 text-[clamp(2rem,4vw,3.2rem)] font-semibold leading-[1.1] tracking-[-0.03em] text-ice-50" style={{ ['--rd' as string]: '0.08s' }}>
            三种材质，<br /><span className="text-ice-400">三种夜色。</span>
          </h2>
          <fieldset className="reveal mt-10" style={{ ['--rd' as string]: '0.16s' }}>
            <legend className="sr-only">选择配色</legend>
            <div className="flex flex-col gap-2.5">
              {FINISHES.map((f) => (
                <label key={f.id} className="relative block">
                  <input
                    type="radio"
                    name="finish"
                    value={f.id}
                    className="swatch-input"
                    checked={finish === f.id}
                    onChange={() => setFinish(f.id as FinishId)}
                  />
                  <span className="swatch">
                    <span className="swatch-dot" style={{ background: f.swatch }} aria-hidden="true" />
                    <span className="flex-1">
                      <span className="block text-[15px] font-medium text-ice-50">{f.name}</span>
                      <span className="mt-0.5 block text-[12.5px] text-ice-500">{f.cn}</span>
                    </span>
                    <span className="mono text-[11px] text-ice-500">¥3,499</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
          <p className="reveal mt-6 min-h-[3.6em] max-w-[30em] text-[14.5px] leading-[1.8] text-ice-300" aria-live="polite" style={{ ['--rd' as string]: '0.22s' }}>
            {current.note}
          </p>
        </div>
      </div>
    </section>
  )
}

const FinishStage = memo(function FinishStage() {
  return (
    <div className="relative mx-auto aspect-[5/4] w-full max-w-[680px]">
      {/* turntable */}
      <div aria-hidden="true" className="absolute bottom-[4%] left-1/2 h-[18%] w-[78%] -translate-x-1/2 rounded-[50%]" style={{ background: 'radial-gradient(closest-side, rgba(240,245,249,0.07), transparent)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)' }} />
      <div aria-hidden="true" className="absolute bottom-[10%] left-1/2 h-[6%] w-[46%] -translate-x-1/2 rounded-[50%] bg-black/70 blur-md" />
      <div className="absolute inset-[2%_12%_8%_12%]">
        <div className="levitate h-full w-full" style={{ animationDuration: '9s', filter: 'drop-shadow(0 30px 34px rgba(0,0,0,0.5)) drop-shadow(0 0 70px var(--ambient))' }}>
          <Headphones sweep className="h-full w-full" title="NOCTURNE ONE 当前配色预览" />
        </div>
      </div>
    </div>
  )
})
