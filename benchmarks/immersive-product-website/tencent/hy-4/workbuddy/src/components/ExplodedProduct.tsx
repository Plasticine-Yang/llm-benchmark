import { useId } from 'react'

const CX = 380
const CY = 360
const RX = 186
const RY = 60

/** Each layer separates using the single --explode custom property. */
export function ExplodedProduct() {
  const raw = useId()
  const u = `ex${raw.replace(/[^a-zA-Z0-9]/g, '')}`
  const id = (n: string) => `${u}-${n}`
  const ref = (n: string) => `url(#${id(n)})`

  const bottomArc = (depth: number) =>
    `M ${CX - RX} ${CY} A ${RX} ${RY} 0 0 0 ${CX + RX} ${CY} L ${CX + RX} ${CY + depth} A ${RX} ${RY} 0 0 1 ${CX - RX} ${CY + depth} Z`

  const spokes = Array.from({ length: 24 }, (_, i) => {
    const a = (i / 24) * Math.PI * 2
    return {
      x1: CX + Math.cos(a) * 38,
      y1: CY + Math.sin(a) * 12,
      x2: CX + Math.cos(a) * (RX - 16),
      y2: CY + Math.sin(a) * (RY - 6),
    }
  })

  return (
    <svg className="exploded" viewBox="0 0 760 720" role="img" aria-label="NOCTURNE ONE 分解结构：头梁、铝合金外罩、透明双腔体、38 毫米驱动单元与耳垫">
      <defs>
        <linearGradient id={id('metal')} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" className="hp-stop-edge" />
          <stop offset="0.38" className="hp-stop-1" />
          <stop offset="1" className="hp-stop-2" />
        </linearGradient>
        <linearGradient id={id('metalSide')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" className="hp-stop-2" />
          <stop offset="1" stopColor="#090d0e" />
        </linearGradient>
        <radialGradient id={id('glass')} cx="0.35" cy="0.2" r="0.9">
          <stop offset="0" className="hp-stop-chamber" stopOpacity="0.38" />
          <stop offset="0.7" stopColor="#4b6b70" stopOpacity="0.12" />
          <stop offset="1" stopColor="#0b1011" stopOpacity="0.55" />
        </radialGradient>
        <radialGradient id={id('driver')} cx="0.4" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#e2b07c" />
          <stop offset="0.42" stopColor="#8a5c31" />
          <stop offset="1" stopColor="#181d1e" />
        </radialGradient>
        <linearGradient id={id('foam')} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#3a4244" />
          <stop offset="0.5" stopColor="#171c1e" />
          <stop offset="1" stopColor="#2c3335" />
        </linearGradient>
        <filter id={id('blur')} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="16" />
        </filter>
      </defs>

      {/* assembly axis */}
      <path d={`M ${CX} 26 L ${CX} 700`} stroke="rgba(203,220,222,.09)" strokeWidth="1" strokeDasharray="3 9" className="exploded__axis" />
      <ellipse cx={CX} cy={CY + 40} rx={RX + 30} ry={RY + 16} fill="rgba(208,150,90,.09)" filter={ref('blur')} />

      {/* 00 — headband */}
      <g className="exploded__layer exploded__layer--band">
        <path d={`M ${CX - 168} ${CY + 6} C ${CX - 168} ${CY - 120} ${CX + 168} ${CY - 120} ${CX + 168} ${CY + 6}`}
          fill="none" stroke={ref('metal')} strokeWidth="26" strokeLinecap="round" />
        <path d={`M ${CX - 168} ${CY + 6} C ${CX - 168} ${CY - 120} ${CX + 168} ${CY - 120} ${CX + 168} ${CY + 6}`}
          fill="none" stroke="rgba(0,0,0,.5)" strokeWidth="9" strokeLinecap="round" />
        <path d={`M ${CX - 164} ${CY - 4} C ${CX - 164} ${CY - 130} ${CX + 164} ${CY - 130} ${CX + 164} ${CY - 4}`}
          fill="none" stroke="rgba(255,255,255,.3)" strokeWidth="1.2" />
        <text x={CX} y={CY - 34} textAnchor="middle" className="exploded__etch">00 / HEADBAND</text>
      </g>

      {/* 01 — outer shell */}
      <g className="exploded__layer exploded__layer--shell">
        <path d={bottomArc(26)} fill={ref('metalSide')} stroke="rgba(255,255,255,.08)" />
        <ellipse cx={CX} cy={CY} rx={RX} ry={RY} fill={ref('metal')} stroke="rgba(255,255,255,.3)" strokeWidth="1.2" />
        <ellipse cx={CX} cy={CY} rx={RX - 15} ry={RY - 5} fill="none" stroke="rgba(0,0,0,.35)" />
        {[26, 38, 50].map((d) => (
          <ellipse key={d} cx={CX} cy={CY} rx={RX - d} ry={(RY - d * 0.32)} fill="none" stroke="rgba(255,255,255,.055)" />
        ))}
        <path d={`M ${CX - RX + 12} ${CY - 18} A ${RX} ${RY} 0 0 1 ${CX + 30} ${CY - RY}`} fill="none" stroke="rgba(255,255,255,.45)" strokeWidth="1.5" />
        <text x={CX} y={CY + 5} textAnchor="middle" className="exploded__etch">01 / ALUMINIUM SHELL</text>
      </g>

      {/* 02 — dual chamber glass */}
      <g className="exploded__layer exploded__layer--chamber">
        <path d={bottomArc(20)} fill="rgba(120,165,170,.09)" stroke="rgba(190,225,230,.16)" />
        <ellipse cx={CX} cy={CY} rx={RX - 14} ry={RY - 5} fill={ref('glass')} stroke="rgba(210,238,240,.42)" strokeWidth="1.6" />
        <ellipse cx={CX} cy={CY} rx={RX - 42} ry={RY - 16} fill="none" stroke="rgba(210,238,240,.24)" strokeDasharray="4 7" />
        <ellipse cx={CX - 52} cy={CY} rx={54} ry={RY - 24} fill="none" stroke="rgba(210,238,240,.2)" />
        <ellipse cx={CX + 52} cy={CY} rx={54} ry={RY - 24} fill="none" stroke="rgba(210,238,240,.2)" />
        <path d={`M ${CX - RX + 22} ${CY - 14} A ${RX - 14} ${RY - 5} 0 0 1 ${CX + 10} ${CY - RY + 5}`} fill="none" stroke="rgba(255,255,255,.6)" strokeWidth="2" />
        <text x={CX} y={CY + 5} textAnchor="middle" className="exploded__etch">02 / DUAL CHAMBER</text>
      </g>

      {/* 03 — driver */}
      <g className="exploded__layer exploded__layer--driver">
        <path d={bottomArc(16)} fill="rgba(20,25,26,.9)" stroke="rgba(255,255,255,.1)" />
        <ellipse cx={CX} cy={CY} rx={RX - 30} ry={RY - 12} fill="#141a1b" stroke="rgba(255,255,255,.22)" />
        {spokes.map((s, i) => (
          <line key={i} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} stroke="rgba(203,220,222,.1)" strokeWidth="1" />
        ))}
        <ellipse cx={CX} cy={CY} rx={RX - 62} ry={RY - 22} fill="none" stroke="rgba(203,220,222,.2)" />
        <ellipse cx={CX} cy={CY} rx={78} ry={25} fill={ref('driver')} stroke="rgba(240,200,155,.45)" />
        <ellipse cx={CX} cy={CY - 5} rx={44} ry={13} fill="rgba(255,255,255,.14)" />
        <text x={CX} y={CY + 42} textAnchor="middle" className="exploded__etch">03 / 38 MM BERYLLIUM DRIVER</text>
      </g>

      {/* 04 — cushion */}
      <g className="exploded__layer exploded__layer--cushion">
        <path d={bottomArc(22)} fill={ref('metalSide')} stroke="rgba(255,255,255,.06)" />
        <ellipse cx={CX} cy={CY} rx={RX + 4} ry={RY + 2} fill={ref('foam')} stroke="rgba(255,255,255,.2)" />
        <ellipse cx={CX} cy={CY} rx={RX - 46} ry={RY - 17} fill="#0b0f10" stroke="rgba(255,255,255,.14)" strokeWidth="10" />
        <ellipse cx={CX} cy={CY} rx={RX - 46} ry={RY - 17} fill="none" stroke="rgba(0,0,0,.7)" strokeWidth="1" />
        <path d={`M ${CX - RX} ${CY - 6} A ${RX} ${RY} 0 0 1 ${CX - 10} ${CY - RY}`} fill="none" stroke="rgba(255,255,255,.26)" strokeWidth="1.5" />
        <text x={CX} y={CY + 5} textAnchor="middle" className="exploded__etch">04 / MEMORY FOAM CUSHION</text>
      </g>

      {/* separation guides */}
      <g className="exploded__guides">
        <path d={`M ${CX + RX + 28} 110 L ${CX + RX + 28} 640`} />
        <circle cx={CX + RX + 28} cy="110" r="2.5" />
        <circle cx={CX + RX + 28} cy="640" r="2.5" />
        <text x={CX + RX + 44} y="380" className="exploded__scale">ASSEMBLY AXIS / 5 LAYERS</text>
      </g>
    </svg>
  )
}
