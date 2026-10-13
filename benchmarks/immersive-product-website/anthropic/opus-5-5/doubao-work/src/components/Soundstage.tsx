import { memo, useEffect, useRef, useState } from 'react'
import { prefersReducedMotion } from '../hooks'

type Mode = 'stereo' | 'spatial' | 'tracked'

const MODES: { id: Mode; label: string; desc: string; width: number }[] = [
  { id: 'stereo', label: '立体声', desc: '传统双声道：声像被压在两耳之间的一条线上。', width: 0.35 },
  { id: 'spatial', label: '空间音频', desc: '个性化 HRTF 把声源放回房间里，有前后、有高低。', width: 1 },
  { id: 'tracked', label: '头部追踪', desc: '转头时声场锚定在原地，像真的坐在乐队面前。', width: 1.15 },
]

const SOURCES = [
  { name: 'Vocal', base: -90, r: 0.62 },
  { name: 'Strings', base: -150, r: 0.82 },
  { name: 'Piano', base: -30, r: 0.78 },
  { name: 'Bass', base: 150, r: 0.5 },
  { name: 'Room', base: 60, r: 0.92 },
]

export function Soundstage() {
  const [mode, setMode] = useState<Mode>('spatial')
  const current = MODES.find((m) => m.id === mode)!

  return (
    <section id="sound" aria-labelledby="sound-title" className="relative scroll-mt-20 overflow-hidden py-28 md:py-40">
      <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[90vmin] w-[90vmin] -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ background: 'radial-gradient(circle, var(--ambient-2), transparent 60%)', filter: 'blur(40px)' }} />
      <div className="mx-auto grid max-w-[1280px] grid-cols-1 gap-14 px-5 sm:px-8 lg:grid-cols-12 lg:gap-8 lg:px-10">
        <div className="lg:col-span-4 lg:pt-10">
          <p className="eyebrow reveal">01 — Sound</p>
          <h2 id="sound-title" className="reveal mt-5 text-[clamp(2rem,4vw,3.4rem)] font-semibold leading-[1.1] tracking-[-0.03em] text-ice-50" style={{ ['--rd' as string]: '0.08s' }}>
            声音有了<br />
            <span className="text-ice-400">方向与距离。</span>
          </h2>
          <p className="reveal mt-6 max-w-[26em] text-[15.5px] leading-[1.9] text-ice-300" style={{ ['--rd' as string]: '0.16s' }}>
            Spatial Engine 以每秒 1,000 次的频率重新计算 5 路声源的位置。移动指针，或用方向键，引导声场的朝向——你会注意到乐器不再"贴"在耳边。
          </p>
          <div className="reveal mt-10" style={{ ['--rd' as string]: '0.24s' }}>
            <div role="group" aria-label="声场模式" className="glass glass-thin inline-flex gap-1 p-1" style={{ ['--r' as string]: '999px' }}>
              {MODES.map((m) => (
                <button key={m.id} type="button" className="segmented-btn" aria-pressed={mode === m.id} onClick={() => setMode(m.id)}>
                  {m.label}
                </button>
              ))}
            </div>
            <p className="mt-4 min-h-[3.4em] max-w-[26em] text-[14px] leading-[1.7] text-ice-400" aria-live="polite">
              {current.desc}
            </p>
          </div>
          <dl className="reveal mt-10 grid grid-cols-2 gap-x-6 gap-y-6 border-t border-white/[0.07] pt-8" style={{ ['--rd' as string]: '0.32s' }}>
            {[
              ['HRTF 建模', '耳廓扫描 · 60 秒'],
              ['追踪延迟', '< 8 ms'],
              ['声道', '7.1.4 虚拟'],
              ['频响', '4 Hz – 40 kHz'],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="text-[12px] text-ice-500">{k}</dt>
                <dd className="mono mt-1.5 text-[14px] text-ice-100">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="reveal lg:col-span-8" style={{ ['--rd' as string]: '0.12s' }}>
          <SoundField width={current.width} tracked={mode === 'tracked'} />
        </div>
      </div>
    </section>
  )
}

/** Canvas field. Own rAF loop, paused offscreen; pointer state lives in refs only. */
const SoundField = memo(function SoundField({ width, tracked }: { width: number; tracked: boolean }) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const readoutRef = useRef<HTMLSpanElement>(null)
  const params = useRef({ width, tracked })
  params.current = { width, tracked }
  const target = useRef({ angle: -90, dist: 0.5 })

  useEffect(() => {
    const wrap = wrapRef.current!
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    const reduced = prefersReducedMotion()
    let w = 0, h = 0, dpr = 1
    let raf = 0
    let running = false
    let t = 0
    let last = performance.now()
    const state = { angle: -90, dist: 0.5, width: params.current.width }

    const resize = () => {
      const r = wrap.getBoundingClientRect()
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = r.width; h = r.height
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr)
      if (!running) draw(0)
    }

    const toRad = (deg: number) => (deg * Math.PI) / 180

    const draw = (dt: number) => {
      const p = params.current
      const k = reduced ? 1 : 1 - Math.pow(0.0025, dt)
      let da = target.current.angle - state.angle
      da = ((da + 540) % 360) - 180
      state.angle += da * k
      state.dist += (target.current.dist - state.dist) * k
      state.width += (p.width - state.width) * (reduced ? 1 : 1 - Math.pow(0.02, dt))
      if (readoutRef.current) {
        const deg = Math.round(((state.angle + 90 + 360) % 360))
        readoutRef.current.textContent = `${String(deg).padStart(3, '0')}°`
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, w, h)
      const cx = w / 2, cy = h / 2
      const R = Math.min(w, h) * 0.44

      // Rings
      for (let i = 1; i <= 5; i++) {
        ctx.beginPath()
        ctx.arc(cx, cy, (R * i) / 5, 0, Math.PI * 2)
        ctx.strokeStyle = i === 5 ? 'rgba(226,231,235,0.14)' : 'rgba(226,231,235,0.05)'
        ctx.lineWidth = 1
        ctx.stroke()
      }
      // Ticks
      for (let i = 0; i < 72; i++) {
        const a = (i / 72) * Math.PI * 2
        const long = i % 6 === 0
        const r1 = R + 6, r2 = R + (long ? 16 : 10)
        ctx.beginPath()
        ctx.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1)
        ctx.lineTo(cx + Math.cos(a) * r2, cy + Math.sin(a) * r2)
        ctx.strokeStyle = long ? 'rgba(226,231,235,0.3)' : 'rgba(226,231,235,0.1)'
        ctx.stroke()
      }

      // Directional beam
      const a = toRad(state.angle)
      const beamW = 0.32 + 0.2 * (1 - state.dist)
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, R)
      g.addColorStop(0, 'rgba(201,154,100,0.28)')
      g.addColorStop(1, 'rgba(201,154,100,0)')
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.arc(cx, cy, R, a - beamW, a + beamW)
      ctx.closePath()
      ctx.fillStyle = g
      ctx.fill()

      // Propagating wavefronts, stretched toward the beam
      for (let i = 0; i < 6; i++) {
        const phase = ((t * 0.22 + i / 6) % 1)
        const rr = phase * R
        ctx.beginPath()
        const steps = 120
        for (let s = 0; s <= steps; s++) {
          const th = (s / steps) * Math.PI * 2
          let diff = th - a
          diff = Math.atan2(Math.sin(diff), Math.cos(diff))
          const focus = Math.exp(-(diff * diff) / 0.5)
          const wobble = Math.sin(th * 6 + t * 2 + i) * 2.2 * (1 - phase)
          const r = rr * (0.82 + 0.26 * focus * state.width) + wobble
          const x = cx + Math.cos(th) * r
          const y = cy + Math.sin(th) * r
          s === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
        }
        ctx.strokeStyle = `rgba(226,231,235,${0.22 * (1 - phase)})`
        ctx.lineWidth = 1
        ctx.stroke()
      }

      // Sources
      const rot = p.tracked ? 0 : (state.angle + 90) * 0.35
      for (const src of SOURCES) {
        const sa = toRad(-90 + (src.base + 90) * state.width + rot)
        const sr = R * src.r * (0.55 + 0.45 * Math.min(1, state.width))
        const x = cx + Math.cos(sa) * sr
        const y = cy + Math.sin(sa) * sr
        let diff = sa - a
        diff = Math.atan2(Math.sin(diff), Math.cos(diff))
        const lit = Math.exp(-(diff * diff) / 0.35)
        const pulse = 1 + Math.sin(t * 3 + src.base) * 0.12
        ctx.beginPath()
        ctx.arc(x, y, 12 * pulse + lit * 8, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(201,154,100,${0.06 + lit * 0.16})`
        ctx.fill()
        ctx.beginPath()
        ctx.arc(x, y, 3.2, 0, Math.PI * 2)
        ctx.fillStyle = lit > 0.4 ? '#e0bd90' : 'rgba(226,231,235,0.75)'
        ctx.fill()
        ctx.font = '500 10.5px "Geist Mono Variable", ui-monospace, monospace'
        ctx.fillStyle = `rgba(226,231,235,${0.35 + lit * 0.55})`
        ctx.textAlign = 'center'
        ctx.fillText(src.name.toUpperCase(), x, y - 18)
      }

      // Listener (top view of head)
      ctx.save()
      ctx.translate(cx, cy)
      ctx.rotate(a + Math.PI / 2)
      ctx.beginPath()
      ctx.ellipse(0, 0, 15, 18, 0, 0, Math.PI * 2)
      ctx.fillStyle = '#1c2024'
      ctx.fill()
      ctx.strokeStyle = 'rgba(226,231,235,0.4)'
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(0, -26); ctx.lineTo(-4, -20); ctx.lineTo(4, -20); ctx.closePath()
      ctx.fillStyle = '#c99a64'
      ctx.fill()
      ctx.fillStyle = 'rgba(226,231,235,0.55)'
      ctx.fillRect(-19, -5, 4, 10)
      ctx.fillRect(15, -5, 4, 10)
      ctx.restore()
    }

    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      t += dt
      draw(dt)
      raf = requestAnimationFrame(loop)
    }
    const start = () => {
      if (running) return
      running = true
      last = performance.now()
      raf = requestAnimationFrame(loop)
    }
    const stop = () => {
      running = false
      cancelAnimationFrame(raf)
    }

    const ro = new ResizeObserver(resize)
    ro.observe(wrap)
    resize()

    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !reduced) start()
      else stop()
      if (reduced) draw(1)
    })
    io.observe(wrap)

    const onMove = (e: PointerEvent) => {
      const r = wrap.getBoundingClientRect()
      const dx = e.clientX - (r.left + r.width / 2)
      const dy = e.clientY - (r.top + r.height / 2)
      target.current.angle = (Math.atan2(dy, dx) * 180) / Math.PI
      target.current.dist = Math.min(1, Math.hypot(dx, dy) / (Math.min(r.width, r.height) * 0.5))
      if (reduced) draw(1)
    }
    wrap.addEventListener('pointermove', onMove)
    const onVis = () => (document.hidden ? stop() : io.takeRecords())
    document.addEventListener('visibilitychange', onVis)

    return () => {
      stop()
      ro.disconnect()
      io.disconnect()
      wrap.removeEventListener('pointermove', onMove)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [])

  const onKey = (e: React.KeyboardEvent) => {
    const step = e.shiftKey ? 45 : 15
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') target.current.angle -= step
    else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') target.current.angle += step
    else if (e.key === 'Home') target.current.angle = -90
    else return
    e.preventDefault()
  }

  return (
    <div className="relative">
      <div
        ref={wrapRef}
        tabIndex={0}
        role="application"
        aria-label="交互式声场：移动指针或使用左右方向键改变聆听方向，Home 键复位"
        onKeyDown={onKey}
        className="glass glass-thin relative mx-auto aspect-square w-full max-w-[720px] touch-pan-y cursor-crosshair overflow-hidden"
        style={{ ['--r' as string]: '50%' }}
      >
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden="true" />
      </div>
      <div className="pointer-events-none absolute left-0 top-2 sm:left-4">
        <p className="eyebrow !text-[10px]">Heading</p>
        <p className="mono tabular mt-1 text-[22px] font-light text-ice-50"><span ref={readoutRef}>000°</span></p>
      </div>
      <div className="pointer-events-none absolute bottom-2 right-0 text-right sm:right-4">
        <p className="eyebrow !text-[10px]">Sources</p>
        <p className="mono tabular mt-1 text-[22px] font-light text-ice-50">05</p>
      </div>
    </div>
  )
})
