import { Compass, SpeakerHigh, Waveform } from '@phosphor-icons/react'
import { memo, useCallback, useEffect, useRef, useState } from 'react'
import type { SoundstagePreset } from '../types/product'

interface PresetConfig {
  id: SoundstagePreset
  name: string
  zhName: string
  stageMeters: number
  harmonics: number
  spread: number
  description: string
}

const PRESETS: Record<SoundstagePreset, PresetConfig> = {
  studio: {
    id: 'studio',
    name: 'Studio Reference',
    zhName: '母带监听声场',
    stageMeters: 2.4,
    harmonics: 4,
    spread: 0.72,
    description: '平直近场相位响应，还原录音棚监听音箱的精确结像边界。',
  },
  concert: {
    id: 'concert',
    name: 'Concert Hall',
    zhName: '穹顶音乐厅',
    stageMeters: 8.6,
    harmonics: 6,
    spread: 1.0,
    description: '模拟维也纳金色大厅早反射路径，声场纵深自然向外延展。',
  },
  binaural: {
    id: 'binaural',
    name: 'Intimate Binaural',
    zhName: '私密人头录音',
    stageMeters: 1.3,
    harmonics: 3,
    spread: 0.56,
    description: '强化近距耳廓衍射与细微呼吸瞬态，贴近耳畔却毫无压迫感。',
  },
}

interface SoundstageCanvasProps {
  preset: SoundstagePreset
  onVectorReport?: (azimuthDeg: number, depthNorm: number) => void
  vectorRef: React.MutableRefObject<{ x: number; y: number }>
}

const SoundstageCanvas = memo(function SoundstageCanvas({
  preset,
  vectorRef,
}: SoundstageCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const padRef = useRef<HTMLDivElement | null>(null)
  const azimuthReadoutRef = useRef<HTMLSpanElement | null>(null)
  const depthReadoutRef = useRef<HTMLSpanElement | null>(null)
  const itdReadoutRef = useRef<HTMLSpanElement | null>(null)

  const currentPosRef = useRef({ x: 0.36, y: -0.28 })
  const presetRef = useRef(preset)

  useEffect(() => {
    presetRef.current = preset
  }, [preset])

  const updateDomReadouts = useCallback((vx: number, vy: number) => {
    const angleRad = Math.atan2(vx, -vy)
    let deg = Math.round((angleRad * 180) / Math.PI)
    if (deg < 0) deg += 360
    const mag = Math.min(1, Math.hypot(vx, vy))
    const cfg = PRESETS[presetRef.current]
    const meters = (0.4 + mag * cfg.stageMeters).toFixed(1)
    const itd = (Math.abs(Math.sin(angleRad)) * 0.68 * mag).toFixed(2)

    if (azimuthReadoutRef.current) {
      azimuthReadoutRef.current.textContent = `${String(deg).padStart(3, '0')}°`
    }
    if (depthReadoutRef.current) {
      depthReadoutRef.current.textContent = `${meters} m`
    }
    if (itdReadoutRef.current) {
      itdReadoutRef.current.textContent = `${itd} ms`
    }
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let rafId = 0
    let active = true
    let phase = 0

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const w = Math.max(1, Math.floor(rect.width * dpr))
      const h = Math.max(1, Math.floor(rect.height * dpr))
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w
        canvas.height = h
      }
    }

    resize()
    const resizeObs = new ResizeObserver(resize)
    resizeObs.observe(canvas)

    const renderFrame = () => {
      if (!active) return

      const w = canvas.width
      const h = canvas.height
      const cx = w * 0.5
      const cy = h * 0.5
      const maxR = Math.min(w, h) * 0.42
      const cfg = PRESETS[presetRef.current]

      // Smoothly interpolate toward target pointer vector
      const target = vectorRef.current
      const cur = currentPosRef.current
      const ease = reducedMotion ? 0.35 : 0.085
      cur.x += (target.x - cur.x) * ease
      cur.y += (target.y - cur.y) * ease

      if (!reducedMotion) {
        phase += 0.022
      }

      updateDomReadouts(cur.x, cur.y)

      ctx.clearRect(0, 0, w, h)

      // Subtle radial dark stage glow shifted toward focus node
      const focusX = cx + cur.x * maxR * 0.78
      const focusY = cy + cur.y * maxR * 0.78
      const bgGlow = ctx.createRadialGradient(focusX, focusY, maxR * 0.04, cx, cy, maxR * 1.15)
      bgGlow.addColorStop(0, 'rgba(201, 138, 75, 0.16)')
      bgGlow.addColorStop(0.45, 'rgba(176, 194, 218, 0.06)')
      bgGlow.addColorStop(1, 'rgba(15, 17, 22, 0)')
      ctx.fillStyle = bgGlow
      ctx.fillRect(0, 0, w, h)

      // Concentric acoustic chamber rings
      const ringCount = 4
      for (let i = 1; i <= ringCount; i++) {
        const ratio = i / ringCount
        const offsetScale = (1 - ratio) * 0.22
        const rx = cx + cur.x * maxR * offsetScale
        const ry = cy + cur.y * maxR * offsetScale
        const r = maxR * ratio

        ctx.beginPath()
        ctx.arc(rx, ry, r, 0, Math.PI * 2)
        ctx.strokeStyle =
          i === ringCount
            ? 'rgba(220, 232, 248, 0.22)'
            : 'rgba(200, 214, 234, 0.09)'
        ctx.lineWidth = i === ringCount ? 1.4 : 1
        ctx.stroke()
      }

      // Degree ticks along outer acoustic compass
      const tickCount = 72
      for (let i = 0; i < tickCount; i++) {
        const a = (i / tickCount) * Math.PI * 2
        const isCardinal = i % 18 === 0
        const isMajor = i % 6 === 0
        const innerR = maxR * (isCardinal ? 0.94 : isMajor ? 0.965 : 0.982)
        const outerR = maxR
        ctx.beginPath()
        ctx.moveTo(cx + Math.cos(a) * innerR, cy + Math.sin(a) * innerR)
        ctx.lineTo(cx + Math.cos(a) * outerR, cy + Math.sin(a) * outerR)
        ctx.strokeStyle = isCardinal
          ? 'rgba(216, 162, 106, 0.72)'
          : isMajor
            ? 'rgba(220, 232, 248, 0.28)'
            : 'rgba(220, 232, 248, 0.1)'
        ctx.lineWidth = isCardinal ? 1.8 : 1
        ctx.stroke()
      }

      // Crosshair reference axes
      ctx.beginPath()
      ctx.moveTo(cx - maxR, cy)
      ctx.lineTo(cx + maxR, cy)
      ctx.moveTo(cx, cy - maxR)
      ctx.lineTo(cx, cy + maxR)
      ctx.strokeStyle = 'rgba(220, 232, 248, 0.06)'
      ctx.lineWidth = 1
      ctx.stroke()

      // Dynamic directional sound wave lobes responding to pointer vector
      const sourceAngle = Math.atan2(cur.y, cur.x)
      const sourceMag = Math.min(1, Math.hypot(cur.x, cur.y))

      for (let wave = 0; wave < cfg.harmonics; wave++) {
        const waveRatio = 0.34 + (wave / cfg.harmonics) * 0.58
        const waveRadius = maxR * waveRatio
        ctx.beginPath()

        const steps = 128
        for (let s = 0; s <= steps; s++) {
          const theta = (s / steps) * Math.PI * 2
          const delta = Math.cos(theta - sourceAngle)
          const directionalPull = delta * sourceMag * maxR * 0.14 * cfg.spread
          const harmonicRipple =
            Math.sin(theta * (3 + (wave % 3)) + phase + wave * 0.9) *
            (maxR * 0.018 * (0.4 + sourceMag * 0.8))
          const directionalRipple =
            Math.pow(Math.max(0, delta), 2) *
            Math.sin(phase * 1.4 - wave * 0.8) *
            maxR *
            0.032 *
            sourceMag

          const r = waveRadius + directionalPull + harmonicRipple + directionalRipple
          const px = cx + Math.cos(theta) * r
          const py = cy + Math.sin(theta) * r
          if (s === 0) ctx.moveTo(px, py)
          else ctx.lineTo(px, py)
        }
        ctx.closePath()
        const alpha = 0.32 - wave * (0.22 / cfg.harmonics)
        ctx.strokeStyle =
          wave === 0
            ? `rgba(216, 162, 106, ${Math.min(0.62, alpha + 0.16)})`
            : `rgba(216, 228, 244, ${Math.max(0.08, alpha)})`
        ctx.lineWidth = wave === 0 ? 1.6 : 1.05
        ctx.stroke()
      }

      // Binaural L / R equatorial waveform ribbon
      ctx.beginPath()
      const ribPoints = 96
      const ribWidth = maxR * 1.64
      for (let i = 0; i <= ribPoints; i++) {
        const t = i / ribPoints
        const x = cx - ribWidth * 0.5 + t * ribWidth
        const envelope = Math.sin(t * Math.PI)
        const lrBalance = 1 + (t - 0.5) * cur.x * 1.25
        const amp =
          Math.sin(t * Math.PI * 10 - phase * 1.8) *
          Math.cos(t * Math.PI * 4 + phase * 0.7) *
          maxR *
          0.065 *
          envelope *
          lrBalance
        const y = cy + amp + cur.y * maxR * 0.08 * envelope
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.strokeStyle = 'rgba(232, 240, 252, 0.34)'
      ctx.lineWidth = 1.2
      ctx.stroke()

      // Vector ray from listener head center to spatial sound focus
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.lineTo(focusX, focusY)
      const rayGrad = ctx.createLinearGradient(cx, cy, focusX, focusY)
      rayGrad.addColorStop(0, 'rgba(220, 232, 248, 0.12)')
      rayGrad.addColorStop(1, 'rgba(216, 162, 106, 0.78)')
      ctx.strokeStyle = rayGrad
      ctx.lineWidth = 1.5
      ctx.stroke()

      // Listener head center aperture (Spatial Engine Origin)
      ctx.beginPath()
      ctx.arc(cx, cy, maxR * 0.068, 0, Math.PI * 2)
      ctx.fillStyle = '#141820'
      ctx.fill()
      ctx.strokeStyle = 'rgba(232, 240, 252, 0.55)'
      ctx.lineWidth = 1.5
      ctx.stroke()

      ctx.beginPath()
      ctx.arc(cx, cy, maxR * 0.022, 0, Math.PI * 2)
      ctx.fillStyle = '#E8EEF6'
      ctx.fill()

      // Active Virtual Sound Source Node
      const pulseRing = reducedMotion
        ? maxR * 0.11
        : maxR * (0.09 + ((Math.sin(phase * 1.6) + 1) * 0.5) * 0.045)
      ctx.beginPath()
      ctx.arc(focusX, focusY, pulseRing, 0, Math.PI * 2)
      ctx.strokeStyle = 'rgba(216, 162, 106, 0.38)'
      ctx.lineWidth = 1.1
      ctx.stroke()

      ctx.beginPath()
      ctx.arc(focusX, focusY, maxR * 0.036, 0, Math.PI * 2)
      ctx.fillStyle = '#D8A26A'
      ctx.fill()
      ctx.strokeStyle = 'rgba(255, 244, 232, 0.8)'
      ctx.lineWidth = 1.2
      ctx.stroke()

      if (!reducedMotion) {
        rafId = requestAnimationFrame(renderFrame)
      }
    }

    rafId = requestAnimationFrame(renderFrame)
    return () => {
      active = false
      cancelAnimationFrame(rafId)
      resizeObs.disconnect()
    }
  }, [preset, updateDomReadouts, vectorRef])

  const updatePointerVector = (clientX: number, clientY: number) => {
    const el = padRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const nx = ((clientX - rect.left) / rect.width - 0.5) * 2
    const ny = ((clientY - rect.top) / rect.height - 0.5) * 2
    const mag = Math.hypot(nx, ny)
    const clampedX = mag > 0.92 ? (nx / mag) * 0.92 : nx
    const clampedY = mag > 0.92 ? (ny / mag) * 0.92 : ny
    vectorRef.current = { x: clampedX, y: clampedY }

    // For reduced motion, trigger single redraw by dispatching synthetic resize-free update?
    // Even simpler: update DOM readouts immediately; rAF handles continuous updates
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const angleRad = Math.atan2(clampedX, -clampedY)
      let deg = Math.round((angleRad * 180) / Math.PI)
      if (deg < 0) deg += 360
      updateDomReadouts(clampedX, clampedY)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const step = 0.14
    let { x, y } = vectorRef.current
    if (e.key === 'ArrowLeft') x -= step
    else if (e.key === 'ArrowRight') x += step
    else if (e.key === 'ArrowUp') y -= step
    else if (e.key === 'ArrowDown') y += step
    else return

    e.preventDefault()
    const mag = Math.hypot(x, y)
    if (mag > 0.92) {
      x = (x / mag) * 0.92
      y = (y / mag) * 0.92
    }
    vectorRef.current = { x, y }
    updateDomReadouts(x, y)
  }

  return (
    <div className="relative flex flex-col items-center">
      <div
        ref={padRef}
        tabIndex={0}
        role="application"
        aria-label="交互式空间声场仪：移动指针或使用方向键调节声源方位与景深"
        onPointerMove={(e) => updatePointerVector(e.clientX, e.clientY)}
        onPointerDown={(e) => updatePointerVector(e.clientX, e.clientY)}
        onKeyDown={handleKeyDown}
        className="liquid-glass relative aspect-square w-full max-w-[520px] rounded-full p-2 cursor-crosshair touch-none select-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#D8A26A]"
      >
        <canvas
          ref={canvasRef}
          className="h-full w-full rounded-full"
          aria-hidden="true"
        />

        {/* Subtle cardinal direction markers */}
        <span className="tabular-tech pointer-events-none absolute top-4 left-1/2 -translate-x-1/2 text-[10px] tracking-[0.18em] text-[#9AA6B7]">
          000° FRONT
        </span>
        <span className="tabular-tech pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 text-[10px] tracking-[0.18em] text-[#6C7788]">
          180° REAR
        </span>
        <span className="tabular-tech pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[10px] tracking-[0.14em] text-[#6C7788]">
          L
        </span>
        <span className="tabular-tech pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[10px] tracking-[0.14em] text-[#6C7788]">
          R
        </span>
      </div>

      {/* Zero-rerender live telemetry bar */}
      <div className="mt-5 grid w-full max-w-[520px] grid-cols-3 gap-2.5">
        <div className="liquid-glass-hud rounded-xl px-3.5 py-2.5">
          <div className="tabular-tech text-[10px] tracking-[0.14em] text-[#7D8898]">
            AZIMUTH
          </div>
          <span
            ref={azimuthReadoutRef}
            className="tabular-tech mt-0.5 block text-sm font-medium text-[#EEF3FA]"
          >
            052°
          </span>
        </div>
        <div className="liquid-glass-hud rounded-xl px-3.5 py-2.5">
          <div className="tabular-tech text-[10px] tracking-[0.14em] text-[#7D8898]">
            STAGE DEPTH
          </div>
          <span
            ref={depthReadoutRef}
            className="tabular-tech mt-0.5 block text-sm font-medium text-[#EEF3FA]"
          >
            1.5 m
          </span>
        </div>
        <div className="liquid-glass-hud rounded-xl px-3.5 py-2.5">
          <div className="tabular-tech text-[10px] tracking-[0.14em] text-[#7D8898]">
            HRTF ITD
          </div>
          <span
            ref={itdReadoutRef}
            className="tabular-tech mt-0.5 block text-sm font-medium text-[#D8A26A]"
          >
            0.24 ms
          </span>
        </div>
      </div>
    </div>
  )
})

export function SoundstageSection() {
  const [preset, setPreset] = useState<SoundstagePreset>('studio')
  const [pingPlaying, setPingPlaying] = useState(false)
  const vectorRef = useRef<{ x: number; y: number }>({ x: 0.36, y: -0.28 })
  const audioCtxRef = useRef<AudioContext | null>(null)

  const handleAuditionPulse = () => {
    if (pingPlaying) return
    try {
      const AudioContextCtor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext
      if (!AudioContextCtor) return

      const ctx = audioCtxRef.current ?? new AudioContextCtor()
      audioCtxRef.current = ctx
      if (ctx.state === 'suspended') {
        void ctx.resume()
      }

      const now = ctx.currentTime
      const panner = ctx.createStereoPanner()
      panner.pan.setValueAtTime(
        Math.max(-0.92, Math.min(0.92, vectorRef.current.x)),
        now,
      )

      const gain = ctx.createGain()
      const distFactor = Math.max(
        0.25,
        1 - Math.hypot(vectorRef.current.x, vectorRef.current.y) * 0.45,
      )
      gain.gain.setValueAtTime(0.0001, now)
      gain.gain.exponentialRampToValueAtTime(0.11 * distFactor, now + 0.06)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.25)

      // Pure warm harmonic triad chord resembling acoustic calibration chime
      const freqs = preset === 'concert' ? [220, 329.63, 440] : [261.63, 392, 523.25]
      freqs.forEach((f, idx) => {
        const osc = ctx.createOscillator()
        osc.type = idx === 0 ? 'sine' : 'triangle'
        osc.frequency.setValueAtTime(f, now)
        const voiceGain = ctx.createGain()
        voiceGain.gain.value = idx === 0 ? 0.5 : 0.22
        osc.connect(voiceGain)
        voiceGain.connect(gain)
        osc.start(now + idx * 0.04)
        osc.stop(now + 1.3)
      })

      gain.connect(panner)
      panner.connect(ctx.destination)

      setPingPlaying(true)
      window.setTimeout(() => setPingPlaying(false), 1250)
    } catch {
      setPingPlaying(false)
    }
  }

  const activePreset = PRESETS[preset]

  return (
    <section
      id="sound"
      className="relative scroll-mt-20 py-24 sm:py-32 lg:py-36 border-t border-[rgba(220,232,248,0.06)]"
    >
      <div className="mx-auto max-w-[1320px] px-5 sm:px-8 lg:px-12">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-14">
          {/* Left: Circular Spatial Soundstage Instrument */}
          <div className="lg:col-span-7 order-2 lg:order-1">
            <SoundstageCanvas preset={preset} vectorRef={vectorRef} />
          </div>

          {/* Right: Editorial Acoustic Explanation & Spatial Presets */}
          <div className="lg:col-span-5 order-1 lg:order-2">
            <div className="inline-flex items-center gap-2 text-xs text-[#C98A4B]">
              <Compass size={16} weight="light" aria-hidden="true" />
              <span className="tabular-tech tracking-[0.18em] uppercase">
                02 // Spatial Engine Soundstage
              </span>
            </div>

            <h2 className="mt-4 text-3xl font-medium leading-[1.16] tracking-[-0.025em] text-[#EEF3FA] sm:text-4xl">
              声场随视线呼吸，而非固定在颅内。
            </h2>

            <p className="mt-4 text-[15px] leading-[1.78] text-[#A8B4C4]">
              移动指针或使用方向键，轻触左侧圆形声场仪：双腔体相位波形与 HRTF 声像轴线会随方位实时偏转，直观呈现耳廓外空间结像。
            </p>

            {/* Acoustic Field Mode Switcher */}
            <div
              className="mt-8 space-y-2.5"
              role="radiogroup"
              aria-label="声场调音模式"
            >
              {(Object.keys(PRESETS) as SoundstagePreset[]).map((key) => {
                const item = PRESETS[key]
                const selected = preset === key
                return (
                  <button
                    key={item.id}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setPreset(item.id)}
                    className={`w-full rounded-2xl px-4 py-3.5 text-left transition-all duration-300 cursor-pointer ${
                      selected
                        ? 'liquid-glass border-[#C98A4B]/30 text-[#F2F6FC]'
                        : 'border border-[rgba(220,232,248,0.08)] bg-[rgba(20,24,32,0.36)] text-[#9BA7B8] hover:border-[rgba(220,232,248,0.2)] hover:text-[#E8EEF6] active:scale-[0.99]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <Waveform
                          size={16}
                          weight={selected ? 'regular' : 'light'}
                          className={selected ? 'text-[#D8A26A]' : 'text-[#7D8898]'}
                          aria-hidden="true"
                        />
                        <span className="text-sm font-medium">{item.zhName}</span>
                      </div>
                      <span className="tabular-tech text-[11px] tracking-[0.1em] text-[#7D8898]">
                        {item.name}
                      </span>
                    </div>
                    <p className="mt-1.5 pl-6 text-xs leading-relaxed text-[#8D99AA]">
                      {item.description}
                    </p>
                  </button>
                )
              })}
            </div>

            {/* Interactive WebAudio Spatial Impulse Trigger */}
            <div className="mt-6 flex items-center gap-4">
              <button
                type="button"
                onClick={handleAuditionPulse}
                disabled={pingPlaying}
                className="cta-secondary-glass inline-flex items-center gap-2.5 rounded-full px-5 py-2.5 text-xs font-medium tracking-[0.04em] cursor-pointer"
              >
                <SpeakerHigh
                  size={15}
                  weight="light"
                  className="text-[#D8A26A]"
                  aria-hidden="true"
                />
                <span>
                  {pingPlaying
                    ? `正在发射 ${activePreset.zhName} 定位脉冲...`
                    : '试听当前方位声波脉冲'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
