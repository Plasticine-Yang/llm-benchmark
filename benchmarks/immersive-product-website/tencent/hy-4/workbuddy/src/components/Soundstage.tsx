import { useEffect, useRef } from 'react'
import { usePrefersReducedMotion } from '../lib/hooks'

const SOURCES = [
  { a: -Math.PI / 2, label: 'C' },
  { a: -Math.PI / 2 - 0.62, label: 'L' },
  { a: -Math.PI / 2 + 0.62, label: 'R' },
  { a: -Math.PI / 2 - 1.72, label: 'Ls' },
  { a: -Math.PI / 2 + 1.72, label: 'Rs' },
]

/**
 * Isolated continuously animated component.
 * Pointer + rAF write to refs and canvas only — React state is never touched.
 */
export function Soundstage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fieldRef = useRef<HTMLDivElement>(null)
  const readoutRef = useRef<HTMLSpanElement>(null)
  const levelRef = useRef<HTMLSpanElement>(null)
  const reduced = usePrefersReducedMotion()
  const reducedRef = useRef(reduced)
  const pointer = useRef({ nx: 0.5, ny: 0.5, active: false, angle: -Math.PI / 2, amp: 0.42 })
  const keyboard = useRef(false)

  useEffect(() => { reducedRef.current = reduced }, [reduced])

  useEffect(() => {
    const canvas = canvasRef.current
    const field = fieldRef.current
    if (!canvas || !field) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let w = 0
    let h = 0
    let raf = 0
    let start = performance.now()
    const state = { angle: -Math.PI / 2, amp: 0.42 }
    let lastReadout = -999

    function draw(now: number) {
      if (!ctx) return
      const t = reducedRef.current ? 0.8 : (now - start) / 1000
      const cx = w / 2
      const cy = h / 2
      const R = Math.min(w, h) * 0.425

      // eased directional response
      const p = pointer.current
      const targetAngle = p.active
        ? Math.atan2((p.ny - 0.5) * h, (p.nx - 0.5) * w)
        : -Math.PI / 2 + Math.sin(t * 0.22) * 0.28
      let delta = targetAngle - state.angle
      while (delta > Math.PI) delta -= Math.PI * 2
      while (delta < -Math.PI) delta += Math.PI * 2
      state.angle += delta * (reducedRef.current ? 1 : 0.055)
      const targetAmp = p.active
        ? 0.32 + Math.min(1, Math.hypot((p.nx - 0.5) * w, (p.ny - 0.5) * h) / R) * 0.72
        : 0.5 + Math.sin(t * 0.5) * 0.1
      state.amp += (targetAmp - state.amp) * (reducedRef.current ? 1 : 0.05)

      ctx.clearRect(0, 0, w, h)

      // ambient field
      const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 1.25)
      bg.addColorStop(0, 'rgba(208,150,90,0.055)')
      bg.addColorStop(0.55, 'rgba(120,150,152,0.022)')
      bg.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, w, h)

      // radial grid
      ctx.save()
      ctx.strokeStyle = 'rgba(203,220,222,0.05)'
      ctx.lineWidth = 1
      for (let i = 0; i < 36; i++) {
        const a = (i / 36) * Math.PI * 2
        ctx.beginPath()
        ctx.moveTo(cx + Math.cos(a) * R * 0.17, cy + Math.sin(a) * R * 0.17)
        ctx.lineTo(cx + Math.cos(a) * R * 1.03, cy + Math.sin(a) * R * 1.03)
        ctx.stroke()
      }
      ctx.restore()

      // concentric range rings
      const rings = [0.26, 0.48, 0.7, 0.9, 1]
      rings.forEach((k, i) => {
        ctx.beginPath()
        ctx.arc(cx, cy, R * k, 0, Math.PI * 2)
        ctx.strokeStyle = i === rings.length - 1 ? 'rgba(203,220,222,0.2)' : 'rgba(203,220,222,0.09)'
        ctx.lineWidth = i === rings.length - 1 ? 1 : 0.8
        if (i === 3) ctx.setLineDash([2, 7])
        ctx.stroke()
        ctx.setLineDash([])
      })

      // expanding ripples
      for (let k = 0; k < 3; k++) {
        const phase = ((t * 0.19 + k / 3) % 1)
        ctx.beginPath()
        ctx.arc(cx, cy, R * (0.16 + phase * 0.84), 0, Math.PI * 2)
        ctx.strokeStyle = `rgba(208,150,90,${(1 - phase) * 0.16})`
        ctx.lineWidth = 1
        ctx.stroke()
      }

      // directional energy lobe
      const lobe = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 1.06)
      lobe.addColorStop(0, 'rgba(208,150,90,0.22)')
      lobe.addColorStop(0.45, 'rgba(208,150,90,0.085)')
      lobe.addColorStop(1, 'rgba(208,150,90,0)')
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.arc(cx, cy, R * 1.06, state.angle - 0.34, state.angle + 0.34)
      ctx.closePath()
      ctx.fillStyle = lobe
      ctx.fill()

      // polar waveform
      const wave = (scale: number, phase: number) => {
        ctx.beginPath()
        const steps = 220
        for (let i = 0; i <= steps; i++) {
          const a = (i / steps) * Math.PI * 2
          const harmonics =
            Math.sin(a * 3 + t * 0.9 + phase) * 15 +
            Math.sin(a * 7 - t * 1.35 + phase) * 8 +
            Math.sin(a * 11 + t * 0.62) * 4
          const direction = R * 0.15 * Math.pow(Math.max(0, Math.cos(a - state.angle)), 8) * state.amp
          const r = R * scale + (harmonics * (0.5 + state.amp * 0.9) + direction)
          const x = cx + Math.cos(a) * r
          const y = cy + Math.sin(a) * r
          if (i === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.closePath()
      }

      wave(0.53, 0)
      ctx.fillStyle = 'rgba(208,150,90,0.045)'
      ctx.fill()
      ctx.strokeStyle = 'rgba(230,180,124,0.6)'
      ctx.lineWidth = 1.4
      ctx.stroke()

      wave(0.42, 2.1)
      ctx.strokeStyle = 'rgba(201,212,214,0.28)'
      ctx.lineWidth = 1
      ctx.stroke()

      // spatial source nodes
      SOURCES.forEach((s, i) => {
        const x = cx + Math.cos(s.a) * R * 0.78
        const y = cy + Math.sin(s.a) * R * 0.78
        const pulse = 0.5 + Math.sin(t * 1.5 + i * 1.1) * 0.5
        const near = Math.pow(Math.max(0, Math.cos(s.a - state.angle)), 6)
        ctx.beginPath()
        ctx.moveTo(cx, cy)
        ctx.lineTo(x, y)
        ctx.strokeStyle = `rgba(203,220,222,${0.05 + near * 0.12})`
        ctx.setLineDash([2, 6])
        ctx.lineWidth = 1
        ctx.stroke()
        ctx.setLineDash([])

        ctx.beginPath()
        ctx.arc(x, y, 10 + pulse * 9 + near * 8, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(208,150,90,${0.025 + near * 0.05})`
        ctx.fill()

        ctx.beginPath()
        ctx.arc(x, y, 3.2 + near * 1.6, 0, Math.PI * 2)
        ctx.fillStyle = near > 0.35 ? '#e6b47c' : '#8b9b9c'
        ctx.fill()
      })

      // listener at centre
      ctx.beginPath()
      ctx.arc(cx, cy, 26, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(13,17,18,0.85)'
      ctx.fill()
      ctx.strokeStyle = 'rgba(203,220,222,0.3)'
      ctx.lineWidth = 1
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(cx, cy - 5, 5.5, 0, Math.PI * 2)
      ctx.strokeStyle = 'rgba(228,234,235,0.8)'
      ctx.lineWidth = 1.3
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(cx, cy + 17, 13, Math.PI * 1.16, Math.PI * 1.84)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(cx, cy + 26)
      ctx.lineTo(cx, cy - 18)
      ctx.strokeStyle = 'rgba(208,150,90,0.55)'
      ctx.stroke()

      // DOM readout, throttled
      const deg = Math.round((((state.angle * 180) / Math.PI) + 90 + 360) % 360)
      if (Math.abs(deg - lastReadout) >= 2) {
        lastReadout = deg
        if (readoutRef.current) readoutRef.current.textContent = `${String(deg).padStart(3, '0')}°`
        if (levelRef.current) levelRef.current.textContent = `${Math.round(state.amp * 100)}%`
      }
    }

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = rect.width
      h = rect.height
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      draw(performance.now())
    }

    const loop = (now: number) => {
      draw(now)
      raf = requestAnimationFrame(loop)
    }

    const ro = new ResizeObserver(resize)
    ro.observe(canvas)
    resize()

    if (!reduced) raf = requestAnimationFrame(loop)

    const onMove = (e: PointerEvent) => {
      const rect = field.getBoundingClientRect()
      pointer.current.nx = (e.clientX - rect.left) / rect.width
      pointer.current.ny = (e.clientY - rect.top) / rect.height
      pointer.current.active = true
      keyboard.current = false
      if (reducedRef.current) draw(performance.now())
    }
    const onLeave = () => {
      pointer.current.active = false
      if (reducedRef.current) draw(performance.now())
    }
    const onKey = (e: KeyboardEvent) => {
      if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return
      e.preventDefault()
      keyboard.current = true
      const p = pointer.current
      p.active = true
      const step = 0.035
      if (e.key === 'ArrowLeft') p.nx = Math.max(0, p.nx - step)
      if (e.key === 'ArrowRight') p.nx = Math.min(1, p.nx + step)
      if (e.key === 'ArrowUp') p.ny = Math.max(0, p.ny - step)
      if (e.key === 'ArrowDown') p.ny = Math.min(1, p.ny + step)
      if (reducedRef.current) draw(performance.now())
    }

    field.addEventListener('pointermove', onMove)
    field.addEventListener('pointerleave', onLeave)
    field.addEventListener('keydown', onKey)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      field.removeEventListener('pointermove', onMove)
      field.removeEventListener('pointerleave', onLeave)
      field.removeEventListener('keydown', onKey)
    }
  }, [reduced])

  return (
    <div className="stage__field" ref={fieldRef} tabIndex={0} role="img"
      aria-label="交互式环形声场可视化。移动指针或使用方向键可改变声场方向与强度。">
      <canvas ref={canvasRef} className="stage__canvas" />
      <span className="stage__axis stage__axis--n mono-label">FRONT / 前</span>
      <span className="stage__axis stage__axis--e mono-label">RIGHT / 右</span>
      <span className="stage__axis stage__axis--s mono-label">REAR / 后</span>
      <span className="stage__axis stage__axis--w mono-label">LEFT / 左</span>
      <div className="stage__center">
        <span className="mono-label">LISTENER</span>
        <strong>聆听位</strong>
      </div>
      <div className="stage__readout glass">
        <div><span className="mono-label">AZIMUTH</span><span className="num" ref={readoutRef}>000°</span></div>
        <div><span className="mono-label">FIELD LEVEL</span><span className="num" ref={levelRef}>50%</span></div>
      </div>
      <span className="stage__hint mono-label">移动指针或使用方向键 · MOVE / ARROW KEYS</span>
    </div>
  )
}
