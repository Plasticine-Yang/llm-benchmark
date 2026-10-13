import { memo, useEffect, useRef } from 'react'
import { ArrowRight, Play } from '@phosphor-icons/react'
import { Headphones } from './Headphones'
import { MagneticButton } from './MagneticButton'
import { openReservation, openStory } from '../store'
import { prefersReducedMotion } from '../hooks'

const d = (s: number) => ({ ['--d' as string]: `${s}s` })

export function Hero() {
  return (
    <section id="brand" aria-labelledby="hero-title" className="relative isolate min-h-[100dvh] overflow-hidden">
      <div id="top-sentinel" className="absolute left-0 top-0 h-6 w-px" aria-hidden="true" />
      <HeroAtmosphere />
      <div className="relative mx-auto grid min-h-[100dvh] max-w-[1280px] grid-cols-1 items-center gap-6 px-5 pb-16 pt-28 sm:px-8 md:pt-32 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-4 lg:px-10 lg:pb-10">
        <HeroCopy />
        <ProductStage />
      </div>
      <ScrollCue />
    </section>
  )
}

function HeroAtmosphere() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
      {/* Volumetric key light falling on the product side */}
      <div
        className="intro absolute right-[-10%] top-[-20%] h-[130%] w-[70%] origin-top"
        style={{
          ...d(0.4),
          ['--intro-anim' as string]: 'intro-light',
          ['--intro-dur' as string]: '2.4s',
          background: 'conic-gradient(from 196deg at 62% 0%, transparent 0deg, rgba(226,231,235,0.07) 10deg, rgba(226,231,235,0.02) 22deg, transparent 34deg)',
          filter: 'blur(18px)',
        }}
      />
      <div className="absolute right-[6%] top-[18%] h-[62vmin] w-[62vmin] rounded-full" style={{ background: 'radial-gradient(circle, var(--ambient) 0%, transparent 62%)', filter: 'blur(30px)' }} />
      <div className="absolute left-[-10%] bottom-[-20%] h-[60vmin] w-[80vmin] rounded-full" style={{ background: 'radial-gradient(circle, var(--ambient-2) 0%, transparent 65%)', filter: 'blur(40px)' }} />
      {/* faint engineering grid */}
      <div
        className="absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage: 'linear-gradient(rgba(226,231,235,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(226,231,235,0.035) 1px, transparent 1px)',
          backgroundSize: '88px 88px',
          maskImage: 'radial-gradient(70% 60% at 68% 45%, #000 0%, transparent 75%)',
          WebkitMaskImage: 'radial-gradient(70% 60% at 68% 45%, #000 0%, transparent 75%)',
        }}
      />
    </div>
  )
}

function HeroCopy() {
  return (
    <div className="relative z-10 max-w-[560px] lg:pb-10">
      <p className="eyebrow intro flex items-center gap-3" style={d(0.45)}>
        <span className="inline-block h-px w-8 bg-amber/70" />
        Spatial Audio · Over-Ear · 2026
      </p>
      <h1 id="hero-title" className="mt-6 text-[clamp(2.5rem,6.2vw,5.2rem)] font-semibold leading-[1.04] tracking-[-0.035em] text-ice-50">
        <span className="intro-line">
          <span className="intro text-metal dispersion" style={d(0.6)}>听见空间，</span>
        </span>
        <span className="intro-line">
          <span className="intro" style={d(0.78)}>
            <span className="text-ice-400">而不只是</span>
            <span className="text-metal">声音。</span>
          </span>
        </span>
      </h1>
      <p className="intro mt-7 max-w-[30em] text-[clamp(15px,1.25vw,17px)] leading-[1.85] text-ice-300" style={d(1.0)}>
        NOCTURNE ONE 以透明双腔体、个性化 HRTF 与 42 小时续航，重新定义私人声场。
      </p>
      <div className="intro mt-10 flex flex-wrap items-center gap-3" style={d(1.15)}>
        <MagneticButton type="button" className="!min-h-[54px] !px-7 !text-[15.5px]" onClick={(e) => openReservation(e.currentTarget)}>
          预约试听
          <ArrowRight size={17} weight="regular" className="arrow" aria-hidden="true" />
        </MagneticButton>
        <button type="button" className="btn btn-glass !min-h-[54px] !pl-2.5 !pr-5" onClick={(e) => openStory(e.currentTarget)}>
          <span className="grid h-9 w-9 place-items-center rounded-full bg-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,.25)]">
            <Play size={13} weight="fill" aria-hidden="true" />
          </span>
          观看 90 秒设计故事
        </button>
      </div>
      <dl className="intro mt-14 grid max-w-[460px] grid-cols-3 gap-4 border-t border-white/[0.07] pt-6" style={d(1.3)}>
        {[
          ['首发价', '¥3,499'],
          ['重量', '312 g'],
          ['开售', '11 · 11'],
        ].map(([k, v]) => (
          <div key={k}>
            <dt className="text-[12px] text-ice-500">{k}</dt>
            <dd className="mono tabular mt-1.5 text-[15px] text-ice-100">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

/** Isolated, continuously animated product installation. Pointer parallax writes CSS vars via rAF. */
const ProductStage = memo(function ProductStage() {
  const stageRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = stageRef.current
    if (!el || prefersReducedMotion() || !window.matchMedia('(pointer: fine)').matches) return
    let raf = 0
    let x = 0, y = 0
    const write = () => {
      raf = 0
      el.style.setProperty('--px', x.toFixed(3))
      el.style.setProperty('--py', y.toFixed(3))
    }
    const move = (e: PointerEvent) => {
      x = (e.clientX / window.innerWidth - 0.5) * 2
      y = (e.clientY / window.innerHeight - 0.5) * 2
      if (!raf) raf = requestAnimationFrame(write)
    }
    window.addEventListener('pointermove', move, { passive: true })
    return () => {
      window.removeEventListener('pointermove', move)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <div ref={stageRef} className="relative mx-auto aspect-square w-full max-w-[min(720px,92vw)] lg:-mr-6 lg:max-w-none" aria-label="NOCTURNE ONE 产品装置">
      {/* Background depth: concentric rings + blurred far plate */}
      <div className="par absolute inset-0" style={{ ['--depth' as string]: -6 }} aria-hidden="true">
        <div className="intro absolute inset-[4%]" style={{ ...d(0.9), ['--intro-dur' as string]: '2s', ['--intro-anim' as string]: 'intro-hud' }}>
          <svg viewBox="0 0 600 600" className="spin-slow h-full w-full">
            <circle cx="300" cy="300" r="290" fill="none" stroke="rgba(226,231,235,0.07)" />
            <circle cx="300" cy="300" r="290" fill="none" stroke="rgba(201,154,100,0.55)" strokeDasharray="1 14" />
            <circle cx="300" cy="300" r="236" fill="none" stroke="rgba(226,231,235,0.05)" />
            <path d="M300 10 A290 290 0 0 1 560 172" fill="none" stroke="rgba(226,231,235,0.35)" strokeWidth="1" />
          </svg>
        </div>
        <div className="absolute inset-[22%] rounded-full" style={{ background: 'radial-gradient(circle at 50% 40%, rgba(226,231,235,0.07), transparent 65%)', filter: 'blur(8px)' }} />
      </div>

      {/* Plinth reflection */}
      <div className="par absolute bottom-[6%] left-1/2 h-[9%] w-[58%] -translate-x-1/2" style={{ ['--depth' as string]: 2 }} aria-hidden="true">
        <div className="levitate-shadow h-full w-full rounded-[50%]" style={{ background: 'radial-gradient(closest-side, rgba(0,0,0,0.75), transparent)', filter: 'blur(6px)' }} />
      </div>

      {/* Product */}
      <div className="par absolute inset-[8%_6%_10%_6%]" style={{ ['--depth' as string]: 10 }}>
        <div className="intro h-full w-full" style={{ ...d(0.95), ['--intro-anim' as string]: 'intro-product', ['--intro-dur' as string]: '1.8s' }}>
          <div className="levitate h-full w-full" style={{ filter: 'drop-shadow(0 40px 40px rgba(0,0,0,0.55)) drop-shadow(0 0 60px var(--ambient))' }}>
            <Headphones sweep className="h-full w-full" />
          </div>
        </div>
      </div>

      {/* HUD — glass instruments at three depths */}
      <div className="par absolute left-[0%] top-[15%] sm:left-[2%]" style={{ ['--depth' as string]: 18 }}>
        <div className="intro" style={{ ...d(1.55), ['--intro-anim' as string]: 'intro-hud' }}>
          <div className="drift glass glass-orbit px-4 py-3 sm:px-5 sm:py-4" style={{ ['--r' as string]: '20px' }}>
            <p className="eyebrow !text-[9.5px]">Battery</p>
            <p className="mono tabular mt-1 text-[clamp(22px,3vw,34px)] font-light leading-none text-ice-50">
              42<span className="ml-0.5 text-[0.5em] text-amber-soft">h</span>
            </p>
            <div className="mt-2.5 flex gap-[3px]" aria-hidden="true">
              {Array.from({ length: 10 }).map((_, i) => (
                <span key={i} className="h-[3px] w-[7px] rounded-full" style={{ background: i < 9 ? 'rgba(224,189,144,0.85)' : 'rgba(226,231,235,0.15)' }} />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="par absolute right-[0%] top-[44%] sm:right-[1%]" style={{ ['--depth' as string]: 26 }}>
        <div className="intro" style={{ ...d(1.7), ['--intro-anim' as string]: 'intro-hud' }}>
          <div className="drift glass flex items-center gap-3 px-4 py-3 sm:px-5" style={{ ['--r' as string]: '18px', animationDelay: '-4s' }}>
            <div className="flex h-7 items-end gap-[3px]" aria-hidden="true">
              {[0.6, 1, 0.75, 0.9, 0.5].map((h, i) => (
                <span key={i} className="eq-bar w-[3px] rounded-full bg-ice-200/80" style={{ height: `${h * 100}%`, animationDelay: `${i * -0.23}s` }} />
              ))}
            </div>
            <div>
              <p className="eyebrow !text-[9.5px]">Engine</p>
              <p className="mt-0.5 text-[14px] font-medium tracking-tight text-ice-50 sm:text-[15px]">Spatial Engine</p>
            </div>
          </div>
        </div>
      </div>

      <div className="par absolute bottom-[10%] left-[8%] sm:left-[12%]" style={{ ['--depth' as string]: 34 }}>
        <div className="intro" style={{ ...d(1.85), ['--intro-anim' as string]: 'intro-hud' }}>
          <div className="drift glass glass-thin flex items-center gap-3 px-4 py-3" style={{ ['--r' as string]: '16px', animationDelay: '-7s' }}>
            <svg width="30" height="30" viewBox="0 0 30 30" aria-hidden="true">
              <circle cx="15" cy="15" r="13" fill="none" stroke="rgba(226,231,235,0.3)" />
              <circle cx="15" cy="15" r="8" fill="none" stroke="#c99a64" />
              <circle cx="15" cy="15" r="2.5" fill="#e2e7eb" />
            </svg>
            <div>
              <p className="eyebrow !text-[9.5px]">Driver</p>
              <p className="mono tabular mt-0.5 text-[16px] text-ice-50">38 mm</p>
            </div>
          </div>
        </div>
      </div>

      {/* Foreground depth-of-field element: out-of-focus glass lens drifting in front */}
      <div className="par pointer-events-none absolute -bottom-[4%] right-[6%] hidden h-[22%] w-[22%] sm:block" style={{ ['--depth' as string]: 60 }} aria-hidden="true">
        <div className="drift h-full w-full rounded-full" style={{ animationDelay: '-2s', background: 'radial-gradient(circle at 35% 30%, rgba(240,245,249,0.16), rgba(240,245,249,0.03) 55%, transparent 70%)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.18)', filter: 'blur(7px)' }} />
      </div>
      <div className="par pointer-events-none absolute right-[30%] top-[2%] h-[6%] w-[6%]" style={{ ['--depth' as string]: 48 }} aria-hidden="true">
        <div className="h-full w-full rounded-full bg-amber/30" style={{ filter: 'blur(9px)' }} />
      </div>
    </div>
  )
})

function ScrollCue() {
  return (
    <a
      href="#sound"
      className="intro absolute bottom-6 left-1/2 hidden -translate-x-1/2 items-center gap-3 rounded-full px-3 py-2 text-ice-500 transition-colors hover:text-ice-200 lg:flex"
      style={d(2.1)}
    >
      <span className="mono text-[10.5px] tracking-[0.3em]">SCROLL</span>
      <span className="relative block h-8 w-px overflow-hidden bg-white/10" aria-hidden="true">
        <span className="absolute inset-x-0 top-0 h-3 bg-amber" style={{ animation: 'cue 2.2s var(--ease-in-out-quint) infinite' }} />
      </span>
      <style>{`@keyframes cue{0%{transform:translateY(-12px)}100%{transform:translateY(32px)}}`}</style>
    </a>
  )
}
