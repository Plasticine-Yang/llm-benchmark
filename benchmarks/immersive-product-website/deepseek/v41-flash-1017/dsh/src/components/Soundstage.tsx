import { useEffect, useRef, useState } from 'react'
import type { KeyboardEvent, PointerEvent } from 'react'
import { HeadIcon, MoveIcon } from './Icons'
import './Soundstage.css'

type Mode = 'music' | 'cinema' | 'focus'

const modes: { id: Mode; label: string; note: string }[] = [
  { id: 'music', label: '音乐', note: '全景声场' },
  { id: 'cinema', label: '影院', note: '前置声像' },
  { id: 'focus', label: '专注', note: '窄场监听' },
]

const initialAngle = 38
const initialDistance = 0.62

function polar(radius: number, degrees: number) {
  const radians = ((degrees - 90) * Math.PI) / 180
  return { x: 320 + Math.cos(radians) * radius, y: 320 + Math.sin(radians) * radius }
}

function arcPath(radius: number, start: number, end: number) {
  const from = polar(radius, start)
  const to = polar(radius, end)
  const large = end - start > 180 ? 1 : 0
  return `M ${from.x.toFixed(2)} ${from.y.toFixed(2)} A ${radius} ${radius} 0 ${large} 1 ${to.x.toFixed(2)} ${to.y.toFixed(2)}`
}

const tickMarks = Array.from({ length: 72 }, (_, index) => {
  const angle = index * 5
  const major = index % 6 === 0
  const cardinal = index % 18 === 0
  const inner = polar(cardinal ? 278 : major ? 282 : 287, angle)
  const outer = polar(296, angle)
  return { angle, major, cardinal, inner, outer }
})

const waveBars = Array.from({ length: 96 }, (_, index) => {
  const angle = index * 3.75
  const wave =
    (Math.sin((index / 96) * Math.PI * 6 + 0.5) * 0.5 + 0.5) * 13 +
    (Math.sin((index / 96) * Math.PI * 14 + 2.3) * 0.5 + 0.5) * 5 +
    (index % 8 === 0 ? 8 : 0)
  const inner = 211
  const outer = 211 + 5 + wave
  const accent = angle > 16 && angle < 62
  return { angle, inner, outer, accent, opacity: 0.16 + (wave / 32) * 0.28 }
})

const sources = [
  { label: '人声', angle: 38, radius: 142 },
  { label: '弦乐', angle: 112, radius: 176 },
  { label: '低频', angle: 218, radius: 155 },
  { label: '空间', angle: 302, radius: 196 },
]

const formatAngle = (angle: number) => {
  const rounded = Math.round(angle) % 360
  return `${rounded < 0 ? '' : '+'}${String(rounded).padStart(3, '0')}°`
}

export function Soundstage() {
  const [mode, setMode] = useState<Mode>('music')
  const stageRef = useRef<HTMLDivElement>(null)
  const angleRef = useRef(initialAngle)
  const distanceRef = useRef(initialDistance)
  const azimuthRef = useRef<HTMLSpanElement>(null)
  const distanceReadoutRef = useRef<HTMLSpanElement>(null)
  const sourceRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef(0)
  const pendingRef = useRef<{ angle: number; distance: number; tiltX: number; tiltY: number } | null>(null)
  const liveRef = useRef<HTMLParagraphElement>(null)

  const paint = (angle: number, distance: number, tiltX = 0, tiltY = 0) => {
    const stage = stageRef.current
    const source = sourceRef.current
    if (!stage) return
    stage.style.setProperty('--azimuth', `${angle}deg`)
    stage.style.setProperty('--tilt-x', `${tiltX}deg`)
    stage.style.setProperty('--tilt-y', `${tiltY}deg`)

    const size = Math.min(stage.clientWidth, 660)
    const sourceRadius = size * 0.36 * distance
    if (source) {
      source.style.transform = `translate(-50%, -50%) rotate(${angle}deg) translateY(${-sourceRadius}px) rotate(${-angle}deg)`
    }
    if (azimuthRef.current) azimuthRef.current.textContent = formatAngle(angle)
    if (distanceReadoutRef.current) {
      distanceReadoutRef.current.textContent = `${distance.toFixed(2)} m`
    }
  }

  const schedulePaint = (next: { angle: number; distance: number; tiltX: number; tiltY: number }) => {
    pendingRef.current = next
    if (rafRef.current) return
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = 0
      const value = pendingRef.current
      if (!value) return
      angleRef.current = value.angle
      distanceRef.current = value.distance
      paint(value.angle, value.distance, value.tiltX, value.tiltY)
    })
  }

  const reset = (announce = false) => {
    angleRef.current = initialAngle
    distanceRef.current = initialDistance
    paint(initialAngle, initialDistance)
    if (announce && liveRef.current) {
      liveRef.current.textContent = `声源方位 ${formatAngle(initialAngle)}，距离 ${initialDistance.toFixed(2)} 米`
    }
  }

  useEffect(() => {
    paint(initialAngle, initialDistance)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const stage = stageRef.current
    if (!stage) return
    const rect = stage.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height * 0.505
    const dx = event.clientX - centerX
    const dy = event.clientY - centerY
    const length = Math.hypot(dx, dy)
    if (length < 24) return
    let angle = (Math.atan2(dy, dx) * 180) / Math.PI + 90
    if (angle < 0) angle += 360
    const maxRadius = Math.min(rect.width, rect.height) * 0.42
    const distance = Math.min(0.92, Math.max(0.24, length / maxRadius))
    const nx = (event.clientX - rect.left) / rect.width - 0.5
    const ny = (event.clientY - rect.top) / rect.height - 0.5
    schedulePaint({
      angle,
      distance,
      tiltX: -ny * 4.2,
      tiltY: nx * 5.6,
    })
  }

  const handlePointerLeave = () => {
    reset(false)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const step = event.shiftKey ? 15 : 5
    let changed = true
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      const direction = event.key === 'ArrowLeft' ? -1 : 1
      const nextAngle = (angleRef.current + direction * step + 360) % 360
      angleRef.current = nextAngle
      paint(nextAngle, distanceRef.current)
    } else if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      const direction = event.key === 'ArrowUp' ? 1 : -1
      distanceRef.current = Math.min(0.92, Math.max(0.24, distanceRef.current + direction * 0.05))
      paint(angleRef.current, distanceRef.current)
    } else if (event.key === 'Home' || event.key === '0') {
      reset(true)
    } else {
      changed = false
    }

    if (changed) {
      event.preventDefault()
      if (liveRef.current) {
        liveRef.current.textContent = `声源方位 ${formatAngle(angleRef.current)}，距离 ${distanceRef.current.toFixed(2)} 米`
      }
    }
  }

  return (
    <section id="sound" className="sound-section" aria-labelledby="sound-title">
      <div className="sound-section__ambient" aria-hidden="true" />
      <div className="sound-section__inner shell">
        <div className="sound-copy">
          <div className="section-index" data-reveal>
            <span>02</span>
            <span aria-hidden="true">—</span>
            <strong>空间声场</strong>
          </div>
          <h2 className="section-heading sound-copy__heading" id="sound-title" data-reveal data-reveal-delay="0.08">
            让声音，回到它
            <br />
            发生的<span className="accent">房间</span>。
          </h2>
          <p className="section-copy sound-copy__body" data-reveal data-reveal-delay="0.16">
            不是环绕，是定位。双耳接收的微小时间差被实时还原，每一件乐器都拥有明确的方向、距离与空气感。
          </p>

          <div className="sound-metrics" data-reveal data-reveal-delay="0.24">
            <div className="sound-metric">
              <span className="sound-metric__value">±180°</span>
              <span className="sound-metric__label">水平声像定位</span>
            </div>
            <div className="sound-metric">
              <span className="sound-metric__value">12<span>ms</span></span>
              <span className="sound-metric__label">头动追踪延迟</span>
            </div>
            <div className="sound-metric">
              <span className="sound-metric__value">1,000<span>Hz</span></span>
              <span className="sound-metric__label">HRTF 校准频率</span>
            </div>
          </div>

          <div className="sound-copy__note" data-reveal data-reveal-delay="0.3">
            <span className="mono">SPATIAL ENGINE</span>
            <span className="sound-copy__note-rule" aria-hidden="true" />
            <span>个性化 HRTF 会在 8 秒内完成耳廓建模。</span>
          </div>
        </div>

        <div
          ref={stageRef}
          className="soundstage"
          data-mode={mode}
          onPointerMove={handlePointerMove}
          onPointerLeave={handlePointerLeave}
          onKeyDown={handleKeyDown}
          tabIndex={0}
          role="group"
          aria-label="可交互声场。移动指针探索声源方向，或使用左右方向键调整方位、上下方向键调整距离。"
          aria-describedby="soundstage-help"
          data-reveal
          data-reveal-delay="0.12"
        >
          <div className="soundstage__grid" aria-hidden="true" />
          <div className="soundstage__dial">
            <div className="soundstage__backlight" aria-hidden="true" />
            <div className="soundstage__beam" aria-hidden="true">
              <span className="soundstage__beam-line" />
              <span className="soundstage__beam-point" />
            </div>

            <svg
              className="soundstage__diagram"
              viewBox="0 0 640 640"
              aria-hidden="true"
              focusable="false"
            >
              <defs>
                <radialGradient id="sound-disc" cx="50%" cy="46%" r="50%">
                  <stop offset="0%" stopColor="#0f1211" stopOpacity=".3" />
                  <stop offset="64%" stopColor="#0b0d0d" stopOpacity=".72" />
                  <stop offset="100%" stopColor="#0a0c0c" stopOpacity=".96" />
                </radialGradient>
                <linearGradient id="sound-arc" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#d6ded8" stopOpacity=".6" />
                  <stop offset="50%" stopColor="#89948d" stopOpacity=".15" />
                  <stop offset="100%" stopColor="#c99864" stopOpacity=".6" />
                </linearGradient>
                <linearGradient id="sound-wave" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#dfe9e1" stopOpacity=".5" />
                  <stop offset="100%" stopColor="#8f9b93" stopOpacity=".18" />
                </linearGradient>
              </defs>

              <circle cx="320" cy="320" r="302" fill="none" stroke="rgba(225,234,226,.045)" strokeWidth=".7" />
              <circle cx="320" cy="320" r="252" fill="url(#sound-disc)" stroke="rgba(225,234,226,.1)" strokeWidth=".8" />
              <circle cx="320" cy="320" r="214" fill="none" stroke="rgba(225,234,226,.06)" strokeWidth="1" />
              <circle cx="320" cy="320" r="154" fill="none" stroke="rgba(225,234,226,.055)" strokeWidth="1" />
              <circle cx="320" cy="320" r="94" fill="none" stroke="rgba(225,234,226,.07)" strokeWidth="1" />
              <path d={arcPath(252, 18, 76)} fill="none" stroke="url(#sound-arc)" strokeWidth="1.3" />
              <path d={arcPath(252, 188, 244)} fill="none" stroke="rgba(216,226,218,.22)" strokeWidth=".9" strokeDasharray="1 7" />
              <path d={arcPath(252, 286, 324)} fill="none" stroke="url(#sound-arc)" strokeWidth="1.3" />

              {tickMarks.map((tick) => (
                <line
                  key={tick.angle}
                  x1={tick.inner.x}
                  y1={tick.inner.y}
                  x2={tick.outer.x}
                  y2={tick.outer.y}
                  stroke={tick.cardinal ? 'rgba(229,237,230,.45)' : tick.major ? 'rgba(225,234,226,.24)' : 'rgba(225,234,226,.12)'}
                  strokeWidth={tick.cardinal ? 1.2 : 0.7}
                />
              ))}

              {waveBars.map((bar, index) => {
                const start = polar(bar.inner, bar.angle)
                const end = polar(bar.outer, bar.angle)
                return (
                  <line
                    key={index}
                    x1={start.x}
                    y1={start.y}
                    x2={end.x}
                    y2={end.y}
                    stroke={bar.accent ? '#d0a06e' : 'url(#sound-wave)'}
                    strokeOpacity={bar.accent ? 0.58 : Math.min(0.62, bar.opacity + 0.13)}
                    strokeWidth={bar.accent ? 1.2 : 0.9}
                    strokeLinecap="round"
                  />
                )
              })}

              <g className="soundstage__axis-labels">
                <text x="320" y="37" textAnchor="middle">0°</text>
                <text x="609" y="324" textAnchor="middle">90°</text>
                <text x="320" y="612" textAnchor="middle">180°</text>
                <text x="30" y="324" textAnchor="middle">270°</text>
              </g>

              {sources.map((source) => {
                const point = polar(source.radius, source.angle)
                return (
                  <g key={source.label} className="soundstage__source-label">
                    <circle cx={point.x} cy={point.y} r="2.1" fill="#cda16f" opacity=".7" />
                    <circle cx={point.x} cy={point.y} r="7" fill="none" stroke="rgba(205,161,111,.17)" strokeWidth=".7" />
                    <text
                      x={point.x + (source.angle > 180 ? -12 : 12)}
                      y={point.y + 3}
                      textAnchor={source.angle > 180 ? 'end' : 'start'}
                    >
                      {source.label}
                    </text>
                  </g>
                )
              })}
            </svg>

            <div className="soundstage__center" aria-hidden="true">
              <div className="soundstage__center-ring" />
              <HeadIcon width={27} height={27} />
              <span className="soundstage__center-pulse" />
            </div>

            <div ref={sourceRef} className="soundstage__source" aria-hidden="true">
              <span className="soundstage__source-core" />
              <span className="soundstage__source-halo" />
            </div>
          </div>

          <div className="soundstage__readout">
            <div className="soundstage__readout-cell">
              <span className="soundstage__readout-label">方位角</span>
              <span className="soundstage__readout-value mono" ref={azimuthRef}>
                +038°
              </span>
            </div>
            <div className="soundstage__readout-cell">
              <span className="soundstage__readout-label">声源距离</span>
              <span className="soundstage__readout-value mono" ref={distanceReadoutRef}>
                0.62 m
              </span>
            </div>
            <div className="soundstage__readout-cell soundstage__readout-cell--status">
              <span className="soundstage__readout-label">状态</span>
              <span className="soundstage__status">
                <i aria-hidden="true" />
                动态锁定
              </span>
            </div>
          </div>

          <div className="soundstage__modes" role="group" aria-label="声场模式">
            {modes.map((item) => (
              <button
                key={item.id}
                type="button"
                className="soundstage__mode"
                data-active={mode === item.id}
                aria-pressed={mode === item.id}
                onClick={() => setMode(item.id)}
              >
                <span>{item.label}</span>
                <small>{item.note}</small>
              </button>
            ))}
          </div>

          <p id="soundstage-help" className="soundstage__hint">
            <span aria-hidden="true">
              <MoveIcon width={14} height={14} />
            </span>
            移动指针探索声场 · 方向键定位
          </p>
          <p ref={liveRef} className="sr-only" aria-live="polite" />
          <div className="soundstage__corner soundstage__corner--tl mono" aria-hidden="true">
            HRTF / 360
          </div>
          <div className="soundstage__corner soundstage__corner--br mono" aria-hidden="true">
            FIELD ACTIVE
          </div>
        </div>
      </div>
    </section>
  )
}
