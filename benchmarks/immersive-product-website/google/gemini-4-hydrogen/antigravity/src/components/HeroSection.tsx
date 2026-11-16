import { ArrowUpRight, Play } from '@phosphor-icons/react'
import { FINISHES } from '../data/productData'
import type { FinishId, ReservationOrigin } from '../types/product'
import { HeadphoneSculpture } from './HeadphoneSculpture'
import { MagneticButton } from './MagneticButton'

interface HeroSectionProps {
  finish: FinishId
  onOpenReservation: (origin: ReservationOrigin) => void
  onOpenDesignStory: () => void
}

const HUD_ITEMS = [
  {
    value: '42h',
    label: '连续空间声场续航',
    code: 'BATTERY',
    desktopPos: 'md:top-[16%] md:left-[2%] lg:left-[0%]',
    animClass: 'anim-hud-1',
  },
  {
    value: 'Spatial Engine',
    label: '1000 Hz 个性化 HRTF',
    code: 'ACOUSTIC CORE',
    desktopPos: 'md:top-[12%] md:right-[0%] lg:right-[-2%]',
    animClass: 'anim-hud-2',
  },
  {
    value: '38 mm',
    label: '纯铍振膜透明双腔体',
    code: 'TRANSDUCER',
    desktopPos: 'md:bottom-[14%] md:left-[4%] lg:left-[2%]',
    animClass: 'anim-hud-3',
  },
] as const

export function HeroSection({
  finish,
  onOpenReservation,
  onOpenDesignStory,
}: HeroSectionProps) {
  const activeFinish = FINISHES[finish]

  return (
    <section
      id="brand"
      className="relative flex min-h-[100dvh] items-center pt-22 pb-12 sm:pt-28 sm:pb-18 lg:pt-24 lg:pb-12"
    >
      {/* Subtle architectural dark-room spotlight backdrop */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div
          className="absolute -top-32 right-[-12%] h-[78vh] w-[72vw] rounded-full blur-[120px] transition-all duration-700"
          style={{
            background: `radial-gradient(circle at center, ${activeFinish.ambientPrimary} 0%, ${activeFinish.ambientSecondary} 45%, transparent 74%)`,
          }}
        />
        <div
          className="absolute bottom-[-18%] left-[-10%] h-[44vh] w-[52vw] rounded-full blur-[110px]"
          style={{
            background:
              'radial-gradient(circle at center, rgba(164, 180, 202, 0.06) 0%, transparent 72%)',
          }}
        />
        {/* Restraint hairline vertical axis */}
        <div className="mx-auto h-full max-w-[1320px] px-5 sm:px-8 lg:px-12">
          <div className="h-full w-full border-x border-[rgba(220,232,248,0.03)]" />
        </div>
      </div>

      <div className="relative z-10 mx-auto w-full max-w-[1320px] px-5 sm:px-8 lg:px-12">
        <div className="grid grid-cols-1 items-center gap-7 sm:gap-10 md:gap-12 lg:grid-cols-12 lg:gap-8">
          {/* LEFT COLUMN: Asymmetric Editorial Copy & Tactile CTAs */}
          <div className="lg:col-span-5 flex flex-col items-start">
            <div className="anim-copy-1 mb-4 sm:mb-5 inline-flex items-center gap-2.5 rounded-full border border-[rgba(232,240,252,0.12)] bg-[rgba(24,28,36,0.52)] px-3.5 py-1.5 backdrop-blur-md">
              <span
                aria-hidden="true"
                className="h-1.5 w-1.5 rounded-full bg-[#C98A4B]"
              />
              <span className="tabular-tech text-[11px] tracking-[0.16em] text-[#B8C3D2] uppercase">
                NOCTURNE ONE · {activeFinish.name}
              </span>
            </div>

            <h1 className="anim-copy-2 text-[clamp(2rem,4.5vw,3.9rem)] font-medium leading-[1.12] tracking-[-0.03em] text-[#EEF3FA]">
              <span className="block">听见空间，</span>
              <span className="block">而不只是声音。</span>
            </h1>

            <p className="anim-copy-3 mt-4 sm:mt-5 max-w-[33rem] text-[14.5px] leading-[1.72] text-[#A8B4C4] sm:text-base lg:text-[17px]">
              NOCTURNE ONE 以透明双腔体、个性化 HRTF 与 42 小时续航，重新定义私人声场。
            </p>

            {/* Primary & Secondary CTAs */}
            <div className="anim-copy-4 mt-6 sm:mt-8 flex w-full flex-col items-stretch gap-3 sm:w-auto sm:flex-row sm:items-center sm:gap-3.5">
              <MagneticButton
                variant="primary"
                onActivateWithRect={(rect) =>
                  onOpenReservation({
                    x: rect.left,
                    y: rect.top,
                    width: rect.width,
                    height: rect.height,
                  })
                }
                className="w-full sm:w-auto"
              >
                <span>预约试听</span>
                <ArrowUpRight size={16} weight="bold" aria-hidden="true" />
              </MagneticButton>

              <MagneticButton
                variant="secondary"
                magneticStrength={6}
                onClick={onOpenDesignStory}
                className="w-full sm:w-auto"
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-full border border-[rgba(232,240,252,0.28)] bg-[rgba(232,240,252,0.06)]">
                  <Play size={10} weight="fill" aria-hidden="true" />
                </span>
                <span>观看 90 秒设计故事</span>
              </MagneticButton>
            </div>

            {/* Quiet Acoustic Baseline Strip */}
            <div className="anim-copy-4 mt-6 sm:mt-9 flex flex-wrap items-center gap-x-4 sm:gap-x-6 gap-y-2 border-t border-[rgba(220,232,248,0.09)] pt-4 sm:pt-5 text-xs text-[#7D8898]">
              <span className="tabular-tech tracking-[0.08em]">312 g 精密平衡</span>
              <span aria-hidden="true" className="text-[#3C4452]">
                /
              </span>
              <span className="tabular-tech tracking-[0.08em]">Bluetooth 5.4</span>
              <span aria-hidden="true" className="text-[#3C4452]">
                /
              </span>
              <span className="tabular-tech tracking-[0.08em] text-[#D8A26A]">
                首发 ¥3,499
              </span>
            </div>
          </div>

          {/* RIGHT COLUMN: Dominant Headphone Installation + Depth HUDs */}
          <div className="lg:col-span-7 relative flex flex-col items-center">
            <div className="relative w-full max-w-[460px] md:max-w-[500px] lg:max-w-[650px]">
              {/* Subtle atmospheric background calibration ring (depth layer 0) */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-[10%] rounded-full border border-[rgba(220,232,248,0.05)]"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-[20%] rounded-full border border-dashed border-[rgba(201,138,75,0.12)]"
              />

              {/* Main Product Sculpture (depth layer 1) */}
              <div className="anim-product-enter relative z-10 px-2 sm:px-6">
                <HeadphoneSculpture finish={finish} />
              </div>

              {/* Desktop & Tablet Floating Liquid Glass HUD Elements (depth layer 2) */}
              <div className="hidden md:block">
                {HUD_ITEMS.map((hud) => (
                  <div
                    key={hud.value}
                    className={`${hud.animClass} ${hud.desktopPos} liquid-glass-hud absolute z-20 rounded-2xl px-4 py-3`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        aria-hidden="true"
                        className="h-1.5 w-1.5 rounded-full bg-[#C98A4B]"
                      />
                      <span className="tabular-tech text-[10px] tracking-[0.18em] text-[#8B97A8]">
                        {hud.code}
                      </span>
                    </div>
                    <div className="tabular-tech mt-1 text-base font-medium tracking-[-0.01em] text-[#EEF3FA] lg:text-[17px]">
                      {hud.value}
                    </div>
                    <div className="mt-0.5 text-[11px] text-[#9AA6B7]">
                      {hud.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Mobile HUD Array (< 768px): clean 3-column instrument bar with zero overlap */}
            <div className="mt-3 grid w-full grid-cols-3 gap-2 md:hidden">
              {HUD_ITEMS.map((hud) => (
                <div
                  key={hud.value}
                  className={`${hud.animClass} liquid-glass-hud rounded-xl px-2.5 py-2.5`}
                >
                  <div className="tabular-tech text-[9px] tracking-[0.14em] text-[#8B97A8]">
                    {hud.code}
                  </div>
                  <div className="tabular-tech mt-1 truncate text-xs font-medium text-[#EEF3FA]">
                    {hud.value}
                  </div>
                  <div className="mt-0.5 truncate text-[10px] text-[#8B97A8]">
                    {hud.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
