import { ArrowUpRight, Check, SlidersHorizontal } from '@phosphor-icons/react'
import {
  CORE_HIGHLIGHTS,
  FINISHES,
  FINISH_ORDER,
  SPEC_GROUPS,
} from '../data/productData'
import type { FinishId, ReservationMode, ReservationOrigin } from '../types/product'
import { MagneticButton } from './MagneticButton'

interface SpecificationsSectionProps {
  finish: FinishId
  onSelectFinish: (finish: FinishId) => void
  onOpenPanel: (mode: ReservationMode, origin: ReservationOrigin) => void
}

export function SpecificationsSection({
  finish,
  onSelectFinish,
  onOpenPanel,
}: SpecificationsSectionProps) {
  const activeFinish = FINISHES[finish]

  return (
    <section
      id="specifications"
      className="relative scroll-mt-20 py-24 sm:py-32 lg:py-36 border-t border-[rgba(220,232,248,0.06)]"
    >
      <div className="mx-auto max-w-[1320px] px-5 sm:px-8 lg:px-12">
        {/* Technical Header */}
        <div className="flex flex-col justify-between gap-6 border-b border-[rgba(220,232,248,0.1)] pb-10 md:flex-row md:items-end">
          <div>
            <div className="inline-flex items-center gap-2 text-xs text-[#C98A4B]">
              <SlidersHorizontal size={16} weight="light" aria-hidden="true" />
              <span className="tabular-tech tracking-[0.18em] uppercase">
                05 // Technical Specifications
              </span>
            </div>
            <h2 className="mt-4 text-3xl font-medium leading-[1.16] tracking-[-0.025em] text-[#EEF3FA] sm:text-4xl">
              精密声学工程规格一览
            </h2>
          </div>
          <p className="max-w-md text-sm leading-relaxed text-[#9AA6B7]">
            每一项声学与供电数据均经过独立消声室校验，呈现客观可测的参考级表现。
          </p>
        </div>

        {/* 5-Column Core Telemetry Strip: 312 g, Bluetooth 5.4, 42 h, 10 min / 6 h, ¥3,499 */}
        <div className="grid grid-cols-2 border-b border-[rgba(220,232,248,0.1)] sm:grid-cols-3 lg:grid-cols-5">
          {CORE_HIGHLIGHTS.map((metric, idx) => (
            <div
              key={metric.code}
              className={`py-7 pr-4 sm:py-8 ${
                idx < CORE_HIGHLIGHTS.length - 1
                  ? 'lg:border-r lg:border-[rgba(220,232,248,0.08)] lg:px-6 lg:first:pl-0'
                  : 'lg:pl-6'
              } ${idx === 4 ? 'col-span-2 sm:col-span-1' : ''}`}
            >
              <div className="tabular-tech text-[10px] tracking-[0.18em] text-[#7D8898]">
                {metric.code}
              </div>
              <div
                className={`tabular-tech mt-2.5 whitespace-nowrap text-xl font-medium tracking-[-0.02em] sm:text-2xl xl:text-[26px] ${
                  metric.code === 'LAUNCH PRICE'
                    ? 'text-[#D8A26A]'
                    : 'text-[#EEF3FA]'
                }`}
              >
                {metric.value}
              </div>
              <div className="mt-1.5 text-xs text-[#9AA6B7]">{metric.label}</div>
            </div>
          ))}
        </div>

        {/* Architectural Two-Column Engineering Sheet */}
        <div className="mt-12 grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-14">
          {SPEC_GROUPS.map((group) => (
            <div key={group.code}>
              <div className="flex items-center justify-between border-b border-[rgba(220,232,248,0.12)] pb-3">
                <h3 className="text-base font-medium text-[#EEF3FA]">
                  {group.title}
                </h3>
                <span className="tabular-tech text-[10px] tracking-[0.16em] text-[#7D8898]">
                  {group.code}
                </span>
              </div>

              <dl className="divide-y divide-[rgba(220,232,248,0.07)]">
                {group.entries.map((entry) => (
                  <div
                    key={entry.label}
                    className="flex flex-col justify-between gap-1 py-4 sm:flex-row sm:items-baseline sm:gap-6"
                  >
                    <dt className="text-xs text-[#8D99AA] shrink-0">
                      {entry.label}
                    </dt>
                    <dd className="tabular-tech text-sm text-[#E2E8F2] sm:text-right">
                      {entry.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </div>

        {/* PURCHASE ACQUISITION MODULE (#purchase) */}
        <div
          id="purchase"
          className="mt-20 scroll-mt-28 liquid-glass rounded-[2rem] p-6 sm:p-10 lg:p-12"
        >
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-2 text-xs text-[#C98A4B]">
                <span className="tabular-tech tracking-[0.18em] uppercase">
                  06 // Acquisition & Private Audition
                </span>
              </div>
              <h3 className="mt-3 text-2xl font-medium tracking-[-0.02em] text-[#EEF3FA] sm:text-3xl">
                NOCTURNE ONE 首发典藏版
              </h3>
              <p className="mt-3 max-w-xl text-sm leading-[1.75] text-[#A8B4C4]">
                随附定制声学硬壳收纳盒、编织 USB-C 数字无损音频线与 3.5 mm 镀银平衡转接线。支持两年官方声学质保与线下静谧空间试听。
              </p>

              {/* Inline Finish Choice */}
              <div className="mt-6">
                <div className="mb-2.5 text-xs text-[#8D99AA]">
                  当前选择配色：<span className="text-[#EEF3FA]">{activeFinish.name}（{activeFinish.zhName}）</span>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  {FINISH_ORDER.map((id) => {
                    const item = FINISHES[id]
                    const selected = finish === id
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => onSelectFinish(id)}
                        className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs transition-all cursor-pointer ${
                          selected
                            ? 'border border-[#C98A4B]/70 bg-[rgba(201,138,75,0.14)] text-[#F2F6FC]'
                            : 'border border-[rgba(220,232,248,0.14)] bg-[rgba(18,22,29,0.55)] text-[#A8B4C4] hover:border-[rgba(220,232,248,0.32)] hover:text-[#EEF3FA]'
                        }`}
                      >
                        <span
                          aria-hidden="true"
                          className="h-2.5 w-2.5 rounded-full border border-white/25"
                          style={{ backgroundColor: item.swatchCore }}
                        />
                        <span>{item.name}</span>
                        {selected && (
                          <Check size={12} weight="bold" className="text-[#D8A26A]" aria-hidden="true" />
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Right Price & Action Block */}
            <div className="lg:col-span-5 lg:border-l lg:border-[rgba(220,232,248,0.1)] lg:pl-10">
              <div className="flex items-baseline justify-between gap-4">
                <span className="tabular-tech text-xs tracking-[0.14em] text-[#8D99AA]">
                  LAUNCH EDITION
                </span>
                <span className="tabular-tech text-xs text-[#D8A26A]">
                  首批编号现货预订中
                </span>
              </div>
              <div className="tabular-tech mt-2 text-4xl font-medium tracking-[-0.03em] text-[#EEF3FA] sm:text-5xl">
                ¥3,499
              </div>
              <div className="mt-2 text-xs text-[#7D8898]">
                312 g · Bluetooth 5.4 · 42 h · 10 min / 6 h
              </div>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row lg:flex-col">
                <MagneticButton
                  variant="primary"
                  onActivateWithRect={(rect) =>
                    onOpenPanel('preorder', {
                      x: rect.left,
                      y: rect.top,
                      width: rect.width,
                      height: rect.height,
                    })
                  }
                  className="w-full"
                >
                  <span>立即预订 · ¥3,499</span>
                  <ArrowUpRight size={16} weight="bold" aria-hidden="true" />
                </MagneticButton>

                <MagneticButton
                  variant="secondary"
                  magneticStrength={6}
                  onActivateWithRect={(rect) =>
                    onOpenPanel('audition', {
                      x: rect.left,
                      y: rect.top,
                      width: rect.width,
                      height: rect.height,
                    })
                  }
                  className="w-full"
                >
                  <span>预约线下私享试听</span>
                </MagneticButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
