import { useRef } from 'react'

export function Soundstage() {
  const stageRef = useRef<HTMLDivElement>(null)
  const frameRef = useRef<number | null>(null)

  const updatePointer = (event: React.PointerEvent<HTMLDivElement>) => {
    const stage = stageRef.current
    if (!stage || frameRef.current) return
    const { clientX, clientY } = event
    frameRef.current = requestAnimationFrame(() => {
      const rect = stage.getBoundingClientRect()
      const x = ((clientX - rect.left) / rect.width - 0.5) * 2
      const y = ((clientY - rect.top) / rect.height - 0.5) * 2
      stage.style.setProperty('--pointer-x', x.toFixed(3))
      stage.style.setProperty('--pointer-y', y.toFixed(3))
      frameRef.current = null
    })
  }

  const resetPointer = () => {
    const stage = stageRef.current
    if (!stage) return
    stage.style.setProperty('--pointer-x', '0')
    stage.style.setProperty('--pointer-y', '0')
  }

  return (
    <div className="soundstage" ref={stageRef} onPointerMove={updatePointer} onPointerLeave={resetPointer}>
      <div className="stage-ambient" />
      <svg className="stage-visual" viewBox="0 0 760 760" role="img" aria-label="可交互的三维声场示意图">
        <defs>
          <radialGradient id="stageFill">
            <stop offset="0" stopColor="#d39a55" stopOpacity=".18" />
            <stop offset=".55" stopColor="#b4c0c5" stopOpacity=".05" />
            <stop offset="1" stopColor="#b4c0c5" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="waveStroke" x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#e3e8e9" stopOpacity=".62" />
            <stop offset=".48" stopColor="#b9c2c4" stopOpacity=".08" />
            <stop offset="1" stopColor="#c88d4b" stopOpacity=".52" />
          </linearGradient>
          <filter id="softBlur"><feGaussianBlur stdDeviation="10" /></filter>
        </defs>
        <circle cx="380" cy="380" r="310" fill="url(#stageFill)" />
        <g className="stage-grid">
          <ellipse cx="380" cy="380" rx="310" ry="112" />
          <ellipse cx="380" cy="380" rx="310" ry="210" />
          <ellipse cx="380" cy="380" rx="218" ry="310" />
          <ellipse cx="380" cy="380" rx="95" ry="310" />
          <circle cx="380" cy="380" r="310" />
          <circle cx="380" cy="380" r="238" />
          <circle cx="380" cy="380" r="164" />
        </g>
        <g className="wave-lines">
          <path d="M116 394c82-6 103-116 176-116 82 0 82 207 172 207 75 0 94-109 181-119" />
          <path d="M111 423c92 0 99-78 178-78 89 0 88 102 170 102 68 0 108-72 190-72" />
          <path d="M121 359c62 0 100-46 158-46 93 0 102 148 187 148 78 0 103-76 172-80" />
        </g>
        <g className="source source-a"><circle r="19" /><circle r="5" /><path d="M0-38v18M-38 0h18M20 0h18M0 20v18" /></g>
        <g className="source source-b"><circle r="15" /><circle r="4" /></g>
        <g className="source source-c"><circle r="11" /><circle r="3" /></g>
        <g className="listener" transform="translate(380 380)">
          <circle r="78" className="listener-aura" />
          <path d="M-37-5c0-49 74-49 74 0v22M-36 2v22c0 17 23 17 23 0V2c0-14-23-14-23 0ZM36 2v22c0 17-23 17-23 0V2c0-14 23-14 23 0Z" />
          <circle r="5" />
        </g>
      </svg>
      <div className="stage-label stage-label--front"><span />FRONT / 0°</div>
      <div className="stage-label stage-label--left"><span />SOURCE / L</div>
      <div className="stage-label stage-label--right"><span />SOURCE / R</div>
      <div className="stage-readout glass-surface">
        <span>HEAD TRACKING</span>
        <strong>0.7 ms</strong>
        <i>LATENCY</i>
      </div>
      <p className="stage-instruction">移动指针，改变声源方位</p>
    </div>
  )
}
