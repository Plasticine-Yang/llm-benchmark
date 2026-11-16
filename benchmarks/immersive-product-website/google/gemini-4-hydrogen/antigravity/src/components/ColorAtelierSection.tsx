import { Palette } from '@phosphor-icons/react'
import { FINISHES, FINISH_ORDER } from '../data/productData'
import type { FinishId } from '../types/product'
import { HeadphoneSculpture } from './HeadphoneSculpture'

interface ColorAtelierSectionProps {
  finish: FinishId
  onSelectFinish: (finish: FinishId) => void
}

export function ColorAtelierSection({
  finish,
  onSelectFinish,
}: ColorAtelierSectionProps) {
  const active = FINISHES[finish]

  const handleRadioKeyDown = (
    e: React.KeyboardEvent<HTMLButtonElement>,
    currentIndex: number,
  ) => {
    let nextIndex = currentIndex
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      nextIndex = (currentIndex + 1) % FINISH_ORDER.length
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      nextIndex = (currentIndex - 1 + FINISH_ORDER.length) % FINISH_ORDER.length
    } else {
      return
    }
    e.preventDefault()
    onSelectFinish(FINISH_ORDER[nextIndex])
  }

  return (
    <section
      aria-labelledby="atelier-heading"
      className="relative py-24 sm:py-32 lg:py-36 border-t border-[rgba(220,232,248,0.06)] overflow-hidden"
    >
      {/* Smooth Room Ambient Lighting Shift */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 transition-all duration-700"
        style={{
          background: `radial-gradient(ellipse 64% 58% at 32% 52%, ${active.ambientPrimary} 0%, ${active.ambientSecondary} 38%, transparent 74%)`,
        }}
      />

      <div className="relative z-10 mx-auto max-w-[1320px] px-5 sm:px-8 lg:px-12">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-12">
          {/* Left Stage: Studio Plinth Sculpture */}
          <div className="lg:col-span-7">
            <div className="liquid-glass relative overflow-hidden rounded-[2rem] px-4 py-8 sm:px-10 sm:py-10">
              {/* Studio ambient vignette */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 transition-all duration-700"
                style={{
                  background: `radial-gradient(circle at 52% 46%, ${active.ambientRim} 0%, transparent 62%)`,
                  opacity: 0.48,
                }}
              />

              {/* Top Atelier Readout */}
              <div className="relative z-10 flex items-center justify-between text-[11px]">
                <span className="tabular-tech tracking-[0.18em] text-[#A8B4C4] uppercase">
                  FINISH ATELIER // {active.serialCode}
                </span>
                <span className="tabular-tech rounded-full border border-[rgba(220,232,248,0.16)] bg-[rgba(18,22,30,0.65)] px-3 py-1 text-[#EEF3FA]">
                  {active.name} · {active.zhName}
                </span>
              </div>

              {/* Product Sculpture responding smoothly to finish selection */}
              <div className="relative z-10 mx-auto max-w-[460px] py-2">
                <HeadphoneSculpture finish={finish} compact animateFloat={false} />
              </div>

              {/* Material caption footer */}
              <div className="relative z-10 mt-2 flex flex-col gap-1 border-t border-[rgba(220,232,248,0.08)] pt-4 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-xs text-[#9BA7B8]">
                  {active.materialSummary}
                </span>
                <span className="tabular-tech text-[11px] text-[#D8A26A]">
                  ANODIZED EDITION
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Three Tactile Color Options */}
          <div className="lg:col-span-5">
            <div className="inline-flex items-center gap-2 text-xs text-[#C98A4B]">
              <Palette size={16} weight="light" aria-hidden="true" />
              <span className="tabular-tech tracking-[0.18em] uppercase">
                04 // Surface & Optics
              </span>
            </div>

            <h2
              id="atelier-heading"
              className="mt-4 text-3xl font-medium leading-[1.16] tracking-[-0.025em] text-[#EEF3FA] sm:text-4xl"
            >
              三种暗室质感，随光线流转呼吸。
            </h2>

            <p className="mt-4 text-[15px] leading-[1.75] text-[#A8B4C4]">
              阳极氧化铝机身与光学级透明腔体经过多道表面处理，切换不同配色时，机身金属反光与暗室环境光色温将同步过渡。
            </p>

            {/* Radio Selector: Obsidian, Mist Silver, Burnt Amber */}
            <div
              role="radiogroup"
              aria-label="选择 NOCTURNE ONE 机身配色"
              className="mt-8 space-y-3"
            >
              {FINISH_ORDER.map((id, index) => {
                const item = FINISHES[id]
                const isSelected = finish === id

                return (
                  <button
                    key={item.id}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => onSelectFinish(item.id)}
                    onKeyDown={(e) => handleRadioKeyDown(e, index)}
                    className={`group flex w-full items-center gap-4 rounded-2xl p-4 text-left transition-all duration-300 cursor-pointer ${
                      isSelected
                        ? 'liquid-glass'
                        : 'border border-[rgba(220,232,248,0.09)] bg-[rgba(20,24,32,0.38)] hover:border-[rgba(220,232,248,0.22)] active:scale-[0.99]'
                    }`}
                  >
                    {/* Precision Anodized Swatch Ring */}
                    <span
                      aria-hidden="true"
                      className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-transform duration-300 group-hover:scale-105"
                      style={{
                        background: `radial-gradient(circle at 32% 30%, ${item.swatchRing} 0%, ${item.swatchCore} 68%)`,
                        boxShadow: isSelected
                          ? `0 0 0 2px #14171E, 0 0 0 3.5px ${item.driverRing}`
                          : 'inset 0 1px 1px rgba(255,255,255,0.24), 0 4px 12px rgba(0,0,0,0.45)',
                      }}
                    >
                      <span
                        className="h-3 w-3 rounded-full border border-white/25"
                        style={{ backgroundColor: item.driverRing }}
                      />
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-baseline gap-2.5">
                          <span className="text-base font-medium text-[#EEF3FA]">
                            {item.name}
                          </span>
                          <span className="text-xs text-[#9AA6B7]">
                            {item.zhName}
                          </span>
                        </div>
                        <span className="tabular-tech text-[11px] text-[#7D8898]">
                          {item.serialCode}
                        </span>
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-[#8D99AA]">
                        {item.tagline}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
