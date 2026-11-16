import { Stack } from '@phosphor-icons/react'
import { useEffect, useId, useRef, useState } from 'react'
import { FINISHES, STRUCTURE_CHAPTERS } from '../data/productData'
import type { FinishId } from '../types/product'

interface StructureSectionProps {
  finish: FinishId
}

export function StructureSection({ finish }: StructureSectionProps) {
  const uid = useId().replace(/:/g, '')
  const sectionRef = useRef<HTMLElement | null>(null)
  const stageRef = useRef<HTMLDivElement | null>(null)
  const [activeChapter, setActiveChapter] = useState(0)
  const [manualOverride, setManualOverride] = useState<number | null>(null)
  const profile = FINISHES[finish]

  // Scroll-driven CSS variable (--explode) strictly animating transform and opacity
  useEffect(() => {
    const section = sectionRef.current
    const stage = stageRef.current
    if (!section || !stage) return

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reducedMotion) {
      stage.style.setProperty('--explode', '0.78')
      return
    }

    let isVisible = false
    let rafPending = false

    const computeScrollProgress = () => {
      rafPending = false
      if (manualOverride !== null) return
      const rect = section.getBoundingClientRect()
      const totalScrollable = Math.max(1, rect.height - window.innerHeight * 0.65)
      const progressed = Math.min(1, Math.max(0, (window.innerHeight * 0.38 - rect.top) / totalScrollable))
      stage.style.setProperty('--explode', progressed.toFixed(4))
    }

    const onScroll = () => {
      if (!isVisible || rafPending) return
      rafPending = true
      requestAnimationFrame(computeScrollProgress)
    }

    const visObserver = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting
        if (isVisible) {
          computeScrollProgress()
          window.addEventListener('scroll', onScroll, { passive: true })
        } else {
          window.removeEventListener('scroll', onScroll)
        }
      },
      { rootMargin: '120px 0px' },
    )

    visObserver.observe(section)

    return () => {
      visObserver.disconnect()
      window.removeEventListener('scroll', onScroll)
    }
  }, [manualOverride])

  // Track which chapter card is in center viewport
  useEffect(() => {
    const cards = Array.from(
      document.querySelectorAll<HTMLElement>('[data-structure-chapter]'),
    )
    if (cards.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = Number((entry.target as HTMLElement).dataset.structureChapter ?? '0')
            setActiveChapter(idx)
          }
        })
      },
      { rootMargin: '-38% 0px -42% 0px', threshold: 0.1 },
    )

    cards.forEach((c) => observer.observe(c))
    return () => observer.disconnect()
  }, [])

  const handleSelectChapter = (idx: number) => {
    setActiveChapter(idx)
    const targetProgress = [0.18, 0.5, 0.78, 1][idx] ?? 0.5
    setManualOverride(targetProgress)
    if (stageRef.current) {
      stageRef.current.style.setProperty('--explode', String(targetProgress))
    }
    const card = document.querySelector<HTMLElement>(`[data-structure-chapter="${idx}"]`)
    if (card && window.innerWidth >= 1024) {
      card.scrollIntoView({ behavior: 'smooth', block: 'center' })
      window.setTimeout(() => setManualOverride(null), 900)
    }
  }

  const layerTransition =
    manualOverride !== null
      ? 'transform 540ms cubic-bezier(0.22, 1, 0.36, 1)'
      : 'none'

  return (
    <section
      ref={sectionRef}
      id="structure"
      className="relative scroll-mt-20 py-24 sm:py-32 lg:py-36 border-t border-[rgba(220,232,248,0.06)]"
    >
      <div className="mx-auto max-w-[1320px] px-5 sm:px-8 lg:px-12">
        {/* Section Intro */}
        <div className="max-w-2xl mb-14 lg:mb-20">
          <div className="inline-flex items-center gap-2 text-xs text-[#C98A4B]">
            <Stack size={16} weight="light" aria-hidden="true" />
            <span className="tabular-tech tracking-[0.18em] uppercase">
              03 // Internal Acoustic Architecture
            </span>
          </div>
          <h2 className="mt-4 text-3xl font-medium leading-[1.16] tracking-[-0.025em] text-[#EEF3FA] sm:text-4xl">
            层层剥离外壳，看见空气如何被精密导引。
          </h2>
          <p className="mt-4 text-[15px] leading-[1.75] text-[#A8B4C4]">
            向下浏览时，头梁、蛋白皮耳垫、38 mm 铍振膜单元与透明双腔体将沿着声学中轴逐步分离；亦可点击右侧任一层级独立检视。
          </p>
        </div>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-12 items-start">
          {/* STICKY STAGE: Axial Exploded Acoustic Schematic */}
          <div className="lg:col-span-7 lg:sticky lg:top-24">
            <div
              ref={stageRef}
              style={{ '--explode': '0.15' } as React.CSSProperties}
              className="liquid-glass relative overflow-hidden rounded-3xl px-4 py-8 sm:px-8 sm:py-10"
            >
              {/* Subtle precision grid */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 opacity-25"
                style={{
                  backgroundImage:
                    'linear-gradient(rgba(220,232,248,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(220,232,248,0.04) 1px, transparent 1px)',
                  backgroundSize: '42px 42px',
                }}
              />

              {/* Top Schematic Header */}
              <div className="relative z-10 mb-4 flex items-center justify-between text-[11px] text-[#8D99AA]">
                <span className="tabular-tech tracking-[0.14em]">
                  AXIAL DISASSEMBLY // {profile.serialCode}
                </span>
                <span className="tabular-tech text-[#D8A26A]">
                  LAYER {String(activeChapter + 1).padStart(2, '0')} / 04
                </span>
              </div>

              {/* Exploded SVG Layers (Each layer strictly animated via transform + opacity) */}
              <div className="relative mx-auto aspect-[16/11] w-full max-w-[660px]">
                <svg
                  viewBox="0 0 680 460"
                  className="h-full w-full overflow-visible"
                  role="img"
                  aria-label="NOCTURNE ONE 爆炸结构拆解示意图"
                >
                  <defs>
                    <linearGradient id={`exp-metal-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor={profile.metalLight} />
                      <stop offset="55%" stopColor={profile.metalMid} />
                      <stop offset="100%" stopColor={profile.metalDark} />
                    </linearGradient>
                    <radialGradient id={`exp-glass-${uid}`} cx="36%" cy="32%" r="70%">
                      <stop offset="0%" stopColor={profile.chamberGlassTop} />
                      <stop offset="100%" stopColor={profile.chamberGlassBottom} />
                    </radialGradient>
                    <radialGradient id={`exp-cone-${uid}`} cx="40%" cy="40%" r="65%">
                      <stop offset="0%" stopColor={profile.driverConeLight} />
                      <stop offset="100%" stopColor="#12161D" />
                    </radialGradient>
                  </defs>

                  {/* Axial Acoustic Guide Line */}
                  <line
                    x1="150"
                    y1="300"
                    x2="540"
                    y2="180"
                    stroke="rgba(216, 162, 106, 0.35)"
                    strokeWidth="1"
                    strokeDasharray="4 6"
                    style={{ opacity: 'calc(0.2 + var(--explode) * 0.7)' }}
                  />

                  {/* LAYER 01: Headband & Yoke Bridge */}
                  <g
                    style={{
                      transform:
                        'translate3d(calc(var(--explode) * -18px), calc(var(--explode) * -44px), 0)',
                      transition: layerTransition,
                    }}
                  >
                    <path
                      d="M 164 205 C 194 64, 434 52, 466 196"
                      fill="none"
                      stroke={`url(#exp-metal-${uid})`}
                      strokeWidth="22"
                      strokeLinecap="round"
                    />
                    <path
                      d="M 182 198 C 210 82, 418 72, 448 192"
                      fill="none"
                      stroke={profile.cushionOuter}
                      strokeWidth="14"
                      strokeLinecap="round"
                    />
                    <path
                      d="M 162 198 C 194 56, 434 44, 468 188"
                      fill="none"
                      stroke="rgba(232, 240, 252, 0.38)"
                      strokeWidth="1.1"
                    />
                    {/* Left Yoke fork */}
                    <path
                      d="M 166 206 L 176 266"
                      stroke={`url(#exp-metal-${uid})`}
                      strokeWidth="10"
                      strokeLinecap="round"
                    />
                    <text
                      x="316"
                      y="52"
                      textAnchor="middle"
                      fill="rgba(220,232,248,0.6)"
                      fontSize="10"
                      fontFamily="var(--font-mono)"
                      style={{ opacity: 'calc(0.25 + var(--explode) * 0.75)' }}
                    >
                      01 // TITANIUM TORSION YOKE
                    </text>
                  </g>

                  {/* LAYER 04: Micro-Perforated Acoustic Ear Cushion (Back-Left along axis) */}
                  <g
                    style={{
                      transform:
                        'translate3d(calc(var(--explode) * -96px), calc(var(--explode) * 34px), 0)',
                      transition: layerTransition,
                    }}
                  >
                    <ellipse
                      cx="310"
                      cy="265"
                      rx="72"
                      ry="92"
                      transform="rotate(-18 310 265)"
                      fill={profile.cushionOuter}
                      stroke="rgba(232, 240, 252, 0.22)"
                      strokeWidth="1.2"
                    />
                    <ellipse
                      cx="310"
                      cy="265"
                      rx="42"
                      ry="58"
                      transform="rotate(-18 310 265)"
                      fill="#0D1015"
                      stroke="rgba(232, 240, 252, 0.14)"
                      strokeWidth="1"
                    />
                    <text
                      x="255"
                      y="386"
                      textAnchor="middle"
                      fill="rgba(220,232,248,0.6)"
                      fontSize="10"
                      fontFamily="var(--font-mono)"
                      style={{ opacity: 'calc(0.2 + var(--explode) * 0.8)' }}
                    >
                      04 // ACOUSTIC SEAL
                    </text>
                  </g>

                  {/* LAYER 03: 38 mm Beryllium Driver & Spatial Engine Core (Center Anchor) */}
                  <g
                    style={{
                      transform:
                        'translate3d(calc(var(--explode) * -12px), calc(var(--explode) * 6px), 0)',
                      transition: layerTransition,
                    }}
                  >
                    {/* Main anodized carrier baffle */}
                    <ellipse
                      cx="330"
                      cy="258"
                      rx="72"
                      ry="90"
                      transform="rotate(-18 330 258)"
                      fill={`url(#exp-metal-${uid})`}
                      stroke={profile.metalStroke}
                      strokeWidth="1.2"
                    />
                    {/* 38 mm Beryllium cone */}
                    <ellipse
                      cx="332"
                      cy="258"
                      rx="44"
                      ry="56"
                      transform="rotate(-18 332 258)"
                      fill={`url(#exp-cone-${uid})`}
                      stroke={profile.driverRing}
                      strokeWidth="2.2"
                    />
                    <ellipse
                      cx="332"
                      cy="258"
                      rx="18"
                      ry="23"
                      transform="rotate(-18 332 258)"
                      fill="#1F2530"
                      stroke={profile.driverRing}
                      strokeWidth="1"
                    />
                    {/* Spatial Engine IMU PCB chip */}
                    <rect
                      x="306"
                      y="194"
                      width="20"
                      height="13"
                      rx="2"
                      fill="#141820"
                      stroke="#D8A26A"
                      strokeWidth="1"
                    />
                    <text
                      x="342"
                      y="376"
                      textAnchor="middle"
                      fill="#D8A26A"
                      fontSize="10"
                      fontFamily="var(--font-mono)"
                      style={{ opacity: 'calc(0.35 + var(--explode) * 0.65)' }}
                    >
                      03 // 38MM BERYLLIUM + IMU
                    </text>
                  </g>

                  {/* LAYER 02A: Helmholtz Damping Sub-Chamber Ring */}
                  <g
                    style={{
                      transform:
                        'translate3d(calc(var(--explode) * 64px), calc(var(--explode) * -18px), 0)',
                      transition: layerTransition,
                    }}
                  >
                    <ellipse
                      cx="346"
                      cy="252"
                      rx="66"
                      ry="84"
                      transform="rotate(-18 346 252)"
                      fill="rgba(18, 22, 30, 0.55)"
                      stroke="rgba(220, 232, 248, 0.35)"
                      strokeWidth="1.4"
                      strokeDasharray="6 4"
                    />
                    <ellipse
                      cx="346"
                      cy="252"
                      rx="48"
                      ry="62"
                      transform="rotate(-18 346 252)"
                      fill="none"
                      stroke={profile.driverRing}
                      strokeOpacity="0.65"
                      strokeWidth="1.2"
                    />
                  </g>

                  {/* LAYER 02B: Transparent Polycarbonate Outer Chamber Dome */}
                  <g
                    style={{
                      transform:
                        'translate3d(calc(var(--explode) * 142px), calc(var(--explode) * -42px), 0)',
                      transition: layerTransition,
                    }}
                  >
                    <ellipse
                      cx="360"
                      cy="248"
                      rx="68"
                      ry="86"
                      transform="rotate(-18 360 248)"
                      fill={`url(#exp-glass-${uid})`}
                      stroke={profile.chamberRim}
                      strokeWidth="1.4"
                    />
                    {/* Chromatic edge accent on transparent dome */}
                    <ellipse
                      cx="359"
                      cy="247"
                      rx="68.5"
                      ry="86.5"
                      transform="rotate(-18 359 247)"
                      fill="none"
                      stroke={profile.chamberDispersionCool}
                      strokeWidth="0.9"
                    />
                    <path
                      d="M 318 202 C 334 166, 382 162, 404 190"
                      fill="none"
                      stroke="rgba(242, 247, 255, 0.62)"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                    />
                    <text
                      x="385"
                      y="362"
                      textAnchor="middle"
                      fill="rgba(220,232,248,0.68)"
                      fontSize="10"
                      fontFamily="var(--font-mono)"
                      style={{ opacity: 'calc(0.2 + var(--explode) * 0.8)' }}
                    >
                      02 // DUAL TRANSPARENT CHAMBER
                    </text>
                  </g>
                </svg>
              </div>

              {/* Mobile & Quick Interactive Separation Control */}
              <div className="relative z-10 mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[rgba(220,232,248,0.08)] pt-4">
                <span className="text-xs text-[#8D99AA]">
                  切换层级检视独立声学部件
                </span>
                <div className="flex items-center gap-1.5">
                  {STRUCTURE_CHAPTERS.map((chap, idx) => (
                    <button
                      key={chap.id}
                      type="button"
                      onClick={() => handleSelectChapter(idx)}
                      className={`tabular-tech rounded-full px-3 py-1 text-[11px] transition-all cursor-pointer ${
                        activeChapter === idx
                          ? 'bg-[#C98A4B] text-[#111318] font-medium'
                          : 'border border-[rgba(220,232,248,0.14)] text-[#A8B4C4] hover:border-[rgba(220,232,248,0.34)] hover:text-[#EEF3FA]'
                      }`}
                    >
                      {chap.index}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* SCROLLING CHAPTERS: Offset Architectural Notes */}
          <div className="lg:col-span-5 space-y-6 lg:space-y-24 lg:py-8">
            {STRUCTURE_CHAPTERS.map((chapter, idx) => {
              const isCurrent = activeChapter === idx
              return (
                <article
                  key={chapter.id}
                  data-structure-chapter={idx}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleSelectChapter(idx)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      handleSelectChapter(idx)
                    }
                  }}
                  className={`rounded-3xl p-6 sm:p-7 transition-all duration-500 cursor-pointer ${
                    isCurrent
                      ? 'liquid-glass'
                      : 'border border-[rgba(220,232,248,0.08)] bg-[rgba(20,24,32,0.35)] opacity-75 hover:opacity-100'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="tabular-tech text-xs tracking-[0.14em] text-[#C98A4B]">
                      {chapter.index} // {chapter.enTitle}
                    </span>
                    <span className="tabular-tech shrink-0 whitespace-nowrap rounded-full border border-[rgba(220,232,248,0.12)] px-2.5 py-0.5 text-[10px] text-[#A8B4C4]">
                      {chapter.specTag}
                    </span>
                  </div>
                  <h3 className="mt-3 text-xl font-medium text-[#EEF3FA]">
                    {chapter.title}
                  </h3>
                  <p className="mt-3 text-sm leading-[1.75] text-[#A8B4C4]">
                    {chapter.description}
                  </p>
                </article>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
