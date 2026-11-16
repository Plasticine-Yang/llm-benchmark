import { Pause, Play, SpeakerHigh, SpeakerSlash, X } from '@phosphor-icons/react'
import { memo, useEffect, useRef, useState } from 'react'
import { DESIGN_STORY_CHAPTERS } from '../data/productData'

interface DesignStoryModalProps {
  isOpen: boolean
  onClose: () => void
}

const TOTAL_SECONDS = 90

function formatTimecode(sec: number): string {
  const clamped = Math.max(0, Math.min(TOTAL_SECONDS, Math.floor(sec)))
  const mins = Math.floor(clamped / 60)
  const secs = clamped % 60
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

interface StoryCanvasProps {
  progressRef: React.MutableRefObject<number>
  playing: boolean
}

const StoryCanvas = memo(function StoryCanvas({
  progressRef,
  playing,
}: StoryCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

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
      canvas.width = Math.max(1, Math.floor(rect.width * dpr))
      canvas.height = Math.max(1, Math.floor(rect.height * dpr))
    }
    resize()
    const obs = new ResizeObserver(resize)
    obs.observe(canvas)

    const draw = () => {
      if (!active) return
      const w = canvas.width
      const h = canvas.height
      const cx = w * 0.5
      const cy = h * 0.5
      const t = progressRef.current
      const norm = t / TOTAL_SECONDS

      if (playing && !reducedMotion) {
        phase += 0.025
      }

      ctx.clearRect(0, 0, w, h)

      // Subtle atmospheric backdrop
      const grad = ctx.createRadialGradient(cx, cy, 10, cx, cy, Math.max(w, h) * 0.65)
      grad.addColorStop(0, 'rgba(201, 138, 75, 0.14)')
      grad.addColorStop(0.5, 'rgba(176, 196, 222, 0.05)')
      grad.addColorStop(1, 'rgba(12, 14, 18, 0)')
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, w, h)

      // Act-dependent precision schematic artwork
      const baseR = Math.min(w, h) * 0.34

      // Anechoic reference grid lines
      ctx.strokeStyle = 'rgba(220, 232, 248, 0.06)'
      ctx.lineWidth = 1
      const step = Math.max(28, Math.floor(w / 14))
      for (let x = step; x < w; x += step) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, h)
        ctx.stroke()
      }

      // Evolving concentric rings
      const rings = 5
      for (let i = 1; i <= rings; i++) {
        const r = baseR * (0.28 + (i / rings) * 0.82)
        ctx.beginPath()
        const segments = 96
        for (let s = 0; s <= segments; s++) {
          const a = (s / segments) * Math.PI * 2
          const mod =
            Math.sin(a * (2 + (i % 3)) + phase + norm * 8) *
            (baseR * 0.035 * (0.4 + Math.sin(norm * Math.PI)))
          const px = cx + Math.cos(a) * (r + mod)
          const py = cy + Math.sin(a) * (r + mod)
          if (s === 0) ctx.moveTo(px, py)
          else ctx.lineTo(px, py)
        }
        ctx.closePath()
        ctx.strokeStyle =
          i === 2
            ? 'rgba(216, 162, 106, 0.65)'
            : `rgba(226, 236, 248, ${0.28 - i * 0.04})`
        ctx.lineWidth = i === 2 ? 1.5 : 1
        ctx.stroke()
      }

      // Horizontal precision dual-chamber waveform
      ctx.beginPath()
      for (let i = 0; i <= 120; i++) {
        const u = i / 120
        const x = w * 0.12 + u * w * 0.76
        const env = Math.sin(u * Math.PI)
        const y =
          cy +
          Math.sin(u * Math.PI * (6 + norm * 8) - phase * 1.7) *
            (h * 0.13) *
            env
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.strokeStyle = 'rgba(232, 240, 252, 0.45)'
      ctx.lineWidth = 1.4
      ctx.stroke()

      if (playing && !reducedMotion) {
        rafId = requestAnimationFrame(draw)
      }
    }

    rafId = requestAnimationFrame(draw)
    return () => {
      active = false
      cancelAnimationFrame(rafId)
      obs.disconnect()
    }
  }, [playing, progressRef])

  return <canvas ref={canvasRef} className="h-full w-full" aria-hidden="true" />
})

export function DesignStoryModal({ isOpen, onClose }: DesignStoryModalProps) {
  const [playing, setPlaying] = useState(true)
  const [elapsed, setElapsed] = useState(0)
  const [soundEnabled, setSoundEnabled] = useState(false)
  const elapsedRef = useRef(0)
  const audioNodesRef = useRef<{
    ctx: AudioContext
    gain: GainNode
    osc: OscillatorNode
  } | null>(null)
  const closeBtnRef = useRef<HTMLButtonElement | null>(null)
  const prevFocusRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    elapsedRef.current = elapsed
  }, [elapsed])

  useEffect(() => {
    if (!isOpen) return

    prevFocusRef.current = document.activeElement as HTMLElement | null
    const timer = window.setTimeout(() => closeBtnRef.current?.focus(), 60)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }
    window.addEventListener('keydown', onKey)

    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
      if (audioNodesRef.current) {
        try {
          audioNodesRef.current.osc.stop()
          void audioNodesRef.current.ctx.close()
        } catch {
          // ignore audio cleanup error
        }
        audioNodesRef.current = null
      }
      prevFocusRef.current?.focus?.()
    }
  }, [isOpen, onClose])

  // 90-second playback ticker
  useEffect(() => {
    if (!isOpen || !playing) return
    const interval = window.setInterval(() => {
      setElapsed((prev) => {
        if (prev + 0.25 >= TOTAL_SECONDS) {
          setPlaying(false)
          return TOTAL_SECONDS
        }
        return prev + 0.25
      })
    }, 250)
    return () => window.clearInterval(interval)
  }, [isOpen, playing])

  const toggleAmbientSound = () => {
    if (soundEnabled && audioNodesRef.current) {
      audioNodesRef.current.gain.gain.setTargetAtTime(
        0.0001,
        audioNodesRef.current.ctx.currentTime,
        0.15,
      )
      setSoundEnabled(false)
      return
    }

    try {
      const AudioContextCtor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext
      if (!AudioContextCtor) return

      if (!audioNodesRef.current) {
        const ctx = new AudioContextCtor()
        const osc = ctx.createOscillator()
        const filter = ctx.createBiquadFilter()
        const gain = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.value = 110
        filter.type = 'lowpass'
        filter.frequency.value = 320
        gain.gain.value = 0.035
        osc.connect(filter)
        filter.connect(gain)
        gain.connect(ctx.destination)
        osc.start()
        audioNodesRef.current = { ctx, gain, osc }
      } else {
        void audioNodesRef.current.ctx.resume()
        audioNodesRef.current.gain.gain.setTargetAtTime(
          0.035,
          audioNodesRef.current.ctx.currentTime,
          0.2,
        )
      }
      setSoundEnabled(true)
    } catch {
      setSoundEnabled(false)
    }
  }

  if (!isOpen) return null

  const activeChapter =
    DESIGN_STORY_CHAPTERS.find(
      (c) => elapsed >= c.startTime && elapsed < c.endTime,
    ) ?? DESIGN_STORY_CHAPTERS[DESIGN_STORY_CHAPTERS.length - 1]

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="NOCTURNE ONE 90 秒设计故事"
    >
      <div
        onClick={onClose}
        className="anim-backdrop-in fixed inset-0 bg-[#07090D]/82 backdrop-blur-md"
        aria-hidden="true"
      />

      <div className="anim-glass-expand liquid-glass relative z-10 w-full max-w-[760px] overflow-hidden rounded-[2rem] p-5 sm:p-8">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <span className="tabular-tech text-[10px] tracking-[0.2em] text-[#C98A4B]">
              90-SECOND DESIGN MONOGRAPH FILM
            </span>
            <h2 className="mt-1 text-lg font-medium text-[#EEF3FA] sm:text-xl">
              {activeChapter.title}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleAmbientSound}
              aria-label={soundEnabled ? '静音声景音频' : '开启声景音频'}
              className="rounded-full border border-[rgba(220,232,248,0.16)] bg-[rgba(20,24,32,0.7)] p-2 text-[#A8B4C4] transition-colors hover:text-[#EEF3FA] cursor-pointer"
            >
              {soundEnabled ? (
                <SpeakerHigh size={16} weight="light" className="text-[#D8A26A]" />
              ) : (
                <SpeakerSlash size={16} weight="light" />
              )}
            </button>
            <button
              ref={closeBtnRef}
              type="button"
              onClick={onClose}
              aria-label="关闭 90 秒设计故事"
              className="rounded-full border border-[rgba(220,232,248,0.16)] bg-[rgba(20,24,32,0.7)] p-2 text-[#A8B4C4] transition-colors hover:text-[#EEF3FA] cursor-pointer"
            >
              <X size={16} weight="light" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Visual Cinema Stage */}
        <div className="relative mt-5 aspect-[16/9] w-full overflow-hidden rounded-2xl border border-[rgba(220,232,248,0.1)] bg-[#0E1117]">
          <StoryCanvas progressRef={elapsedRef} playing={playing} />

          {/* Overlay telemetry & subtitles */}
          <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between px-4 py-3 text-[10px] text-[#8D99AA]">
            <span className="tabular-tech tracking-[0.16em]">
              {activeChapter.subtitle}
            </span>
            <span className="tabular-tech text-[#D8A26A]">
              {activeChapter.telemetry}
            </span>
          </div>

          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#0B0D12]/90 via-[#0B0D12]/55 to-transparent px-5 pt-10 pb-4">
            <p className="max-w-2xl text-xs leading-relaxed text-[#E6ECF4] sm:text-sm">
              {activeChapter.narration}
            </p>
          </div>
        </div>

        {/* Controls & 90s Scrubber */}
        <div className="mt-5 space-y-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                if (elapsed >= TOTAL_SECONDS) setElapsed(0)
                setPlaying((p) => !p)
              }}
              aria-label={playing ? '暂停播放' : '继续播放'}
              className="cta-primary-glass flex h-9 w-9 shrink-0 items-center justify-center rounded-full cursor-pointer"
            >
              {playing ? (
                <Pause size={14} weight="fill" />
              ) : (
                <Play size={14} weight="fill" />
              )}
            </button>

            <input
              type="range"
              min={0}
              max={TOTAL_SECONDS}
              step={0.5}
              value={elapsed}
              aria-label="设计故事时间轴"
              onChange={(e) => setElapsed(Number(e.target.value))}
              className="h-1.5 w-full cursor-pointer accent-[#C98A4B]"
            />

            <span className="tabular-tech shrink-0 text-xs text-[#9AA6B7]">
              {formatTimecode(elapsed)} / 01:30
            </span>
          </div>

          {/* 4 Chapter Jump Pills */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {DESIGN_STORY_CHAPTERS.map((chap) => {
              const active = chap.id === activeChapter.id
              return (
                <button
                  key={chap.id}
                  type="button"
                  onClick={() => {
                    setElapsed(chap.startTime)
                    setPlaying(true)
                  }}
                  className={`rounded-xl border px-3 py-2 text-left transition-all cursor-pointer ${
                    active
                      ? 'border-[#C98A4B]/65 bg-[rgba(201,138,75,0.12)] text-[#EEF3FA]'
                      : 'border-[rgba(220,232,248,0.1)] bg-[rgba(18,22,29,0.5)] text-[#8D99AA] hover:border-[rgba(220,232,248,0.24)] hover:text-[#EEF3FA]'
                  }`}
                >
                  <div className="tabular-tech text-[10px] text-[#C98A4B]">
                    {chap.timecode}
                  </div>
                  <div className="mt-0.5 truncate text-xs font-medium">
                    {chap.title.replace(/^第.幕 · /, '')}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
