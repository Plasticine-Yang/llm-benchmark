import { ArrowUp } from '@phosphor-icons/react'
import type { ReservationOrigin } from '../types/product'

interface FooterProps {
  onOpenReservation: (origin: ReservationOrigin) => void
  onOpenDesignStory: () => void
}

export function Footer({ onOpenReservation, onOpenDesignStory }: FooterProps) {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <footer className="relative border-t border-[rgba(220,232,248,0.08)] bg-[#0C0E12] pt-20 pb-12 sm:pt-28 sm:pb-16">
      <div className="mx-auto max-w-[1320px] px-5 sm:px-8 lg:px-12">
        {/* Monograph Back Cover Spread */}
        <div className="flex flex-col justify-between gap-12 border-b border-[rgba(220,232,248,0.08)] pb-16 lg:flex-row lg:items-end">
          <div>
            <div className="tabular-tech text-[11px] tracking-[0.24em] text-[#7D8898] uppercase">
              MONOGRAPH 01 // ACOUSTIC REFERENCE INSTRUMENT
            </div>
            <div
              aria-hidden="true"
              className="mt-4 text-[clamp(2.5rem,7.8vw,6.2rem)] font-medium leading-[0.94] tracking-[-0.04em] text-[#E8EEF6]/14 select-none"
            >
              NOCTURNE ONE
            </div>
            <p className="mt-6 max-w-md text-sm leading-[1.8] text-[#9AA6B7]">
              “于静默之境，还原声音的建筑尺度。”
              <br />
              专为深夜工作室、母带监听与沉浸式空间声场爱好者校准。
            </p>
          </div>

          <div className="flex flex-col items-start gap-5 lg:items-end lg:text-right">
            <div className="tabular-tech text-xs tracking-[0.16em] text-[#8D99AA]">
              LISTENING GALLERIES
            </div>
            <div className="tabular-tech text-xs leading-relaxed text-[#B6C2D2]">
              SHANGHAI · BEIJING · SHENZHEN · CHENGDU
              <br />
              31°13&apos;N 121°27&apos;E // CALIBRATION FLOOR -118 dB
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect()
                  onOpenReservation({
                    x: rect.left,
                    y: rect.top,
                    width: rect.width,
                    height: rect.height,
                  })
                }}
                className="rounded-full border border-[rgba(220,232,248,0.16)] bg-[rgba(24,28,36,0.6)] px-4 py-2 text-xs text-[#E8EEF6] transition-all hover:border-[#C98A4B]/60 hover:text-[#D8A26A] active:scale-95 cursor-pointer"
              >
                预约声学室试听
              </button>
              <button
                type="button"
                onClick={onOpenDesignStory}
                className="rounded-full border border-[rgba(220,232,248,0.12)] px-4 py-2 text-xs text-[#9AA6B7] transition-all hover:border-[rgba(220,232,248,0.28)] hover:text-[#E8EEF6] active:scale-95 cursor-pointer"
              >
                90 秒设计故事
              </button>
            </div>
          </div>
        </div>

        {/* Publication Back-Cover Colophon Folio */}
        <div className="mt-8 flex flex-col items-start justify-between gap-4 text-[11px] text-[#6C7788] sm:flex-row sm:items-center">
          <div className="tabular-tech tracking-[0.12em]">
            © 2026 NOCTURNE ACOUSTICS LAB. ALL RIGHTS RESERVED.
          </div>
          <div className="flex items-center gap-6">
            <span className="tabular-tech tracking-[0.12em]">
              EDITION 01 · PRINT SPEC 312G-N1
            </span>
            <button
              type="button"
              onClick={scrollToTop}
              aria-label="回到页面顶部"
              className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(220,232,248,0.12)] px-3 py-1.5 text-[#A8B4C4] transition-colors hover:border-[rgba(220,232,248,0.3)] hover:text-[#EEF3FA] active:scale-95 cursor-pointer"
            >
              <span>返回序章</span>
              <ArrowUp size={12} weight="bold" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  )
}
