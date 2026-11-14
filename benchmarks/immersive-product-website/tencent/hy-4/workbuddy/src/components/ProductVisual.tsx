import { useId } from 'react'

const BAND = 'M 166 336 C 166 126 554 126 554 336'
const BAND_HI = 'M 170 322 C 170 116 550 116 550 322'
const CX = 520
const CY = 486
const FX = 186
const FY = 500

type Props = {
  className?: string
  sweep?: boolean
  title?: string
}

/** Hand-built vector instrument. No external imagery, no raster assets. */
export function ProductVisual({ className = '', sweep = true, title = 'NOCTURNE ONE 空间音频耳机' }: Props) {
  const raw = useId()
  const u = `hp${raw.replace(/[^a-zA-Z0-9]/g, '')}`
  const id = (n: string) => `${u}-${n}`
  const ref = (n: string) => `url(#${id(n)})`

  const spokes = Array.from({ length: 18 }, (_, i) => {
    const a = (i / 18) * Math.PI * 2
    return {
      x1: CX + Math.cos(a) * 17,
      y1: CY + Math.sin(a) * 23,
      x2: CX + Math.cos(a) * 57,
      y2: CY + Math.sin(a) * 76,
    }
  })

  return (
    <svg
      className={`hp-svg ${className}`}
      viewBox="0 0 720 780"
      role="img"
      aria-label={title}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={id('band')} x1="0" y1="0" x2="0.15" y2="1">
          <stop offset="0" className="hp-stop-edge" />
          <stop offset="0.2" className="hp-stop-1" />
          <stop offset="0.62" className="hp-stop-2" />
          <stop offset="1" className="hp-stop-dark" />
        </linearGradient>
        <linearGradient id={id('bandCore')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2b3234" />
          <stop offset="0.55" stopColor="#111617" />
          <stop offset="1" stopColor="#252c2e" />
        </linearGradient>
        <linearGradient id={id('yoke')} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" className="hp-stop-dark" />
          <stop offset="0.32" className="hp-stop-edge" />
          <stop offset="0.62" className="hp-stop-1" />
          <stop offset="1" className="hp-stop-2" />
        </linearGradient>
        <radialGradient id={id('cupOuter')} cx="0.3" cy="0.2" r="0.95">
          <stop offset="0" className="hp-stop-edge" />
          <stop offset="0.28" className="hp-stop-1" />
          <stop offset="0.72" className="hp-stop-2" />
          <stop offset="1" className="hp-stop-dark" />
        </radialGradient>
        <radialGradient id={id('cupFar')} cx="0.25" cy="0.18" r="0.95">
          <stop offset="0" stopColor="#4a5456" />
          <stop offset="0.5" stopColor="#252c2e" />
          <stop offset="1" stopColor="#0c1112" />
        </radialGradient>
        <radialGradient id={id('chamber')} cx="0.36" cy="0.28" r="0.86">
          <stop offset="0" className="hp-stop-chamber" stopOpacity="0.42" />
          <stop offset="0.55" className="hp-stop-chamber" stopOpacity="0.14" />
          <stop offset="1" stopColor="#0a0f10" stopOpacity="0.72" />
        </radialGradient>
        <radialGradient id={id('driver')} cx="0.38" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#3d4749" />
          <stop offset="0.55" stopColor="#1a2123" />
          <stop offset="1" stopColor="#090d0e" />
        </radialGradient>
        <radialGradient id={id('dome')} cx="0.35" cy="0.28" r="0.8">
          <stop offset="0" stopColor="#f0c697" />
          <stop offset="0.45" stopColor="#c08a50" />
          <stop offset="1" stopColor="#4b2f19" />
        </radialGradient>
        <linearGradient id={id('glassEdge')} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.62" />
          <stop offset="0.4" stopColor="#ffffff" stopOpacity="0.06" />
          <stop offset="0.75" className="hp-stop-chamber" stopOpacity="0.32" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0.34" />
        </linearGradient>
        <linearGradient id={id('sweep')} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.42" stopColor="#fff" stopOpacity="0.05" />
          <stop offset="0.5" stopColor="#fff3e2" stopOpacity="0.62" />
          <stop offset="0.58" stopColor="#fff" stopOpacity="0.05" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <filter id={id('soft')} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="22" />
        </filter>
        <filter id={id('glow')} x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="7" />
        </filter>
        <mask id={id('silhouette')}>
          <path d={BAND} fill="none" stroke="#fff" strokeWidth="38" strokeLinecap="round" />
          <path d="M 166 320 L 186 412" fill="none" stroke="#fff" strokeWidth="16" strokeLinecap="round" />
          <path d="M 554 320 L 534 412" fill="none" stroke="#fff" strokeWidth="16" strokeLinecap="round" />
          <ellipse cx={FX} cy={FY} rx="92" ry="118" transform={`rotate(-12 ${FX} ${FY})`} fill="#fff" />
          <ellipse cx={CX} cy={CY} rx="140" ry="170" transform={`rotate(8 ${CX} ${CY})`} fill="#fff" />
        </mask>
      </defs>

      {/* ground bloom */}
      <ellipse cx={CX} cy={CY + 24} rx="170" ry="190" fill={ref('dome')} opacity="0.11" filter={ref('soft')} />

      {/* ---- far earcup (receding, desaturated) ---- */}
      <g transform={`rotate(-12 ${FX} ${FY})`} opacity="0.82">
        <ellipse cx={FX} cy={FY + 7} rx="99" ry="125" fill="#0a0e0f" opacity="0.85" />
        <ellipse cx={FX} cy={FY} rx="92" ry="118" fill={ref('cupFar')} stroke="rgba(220,235,236,.16)" strokeWidth="1" />
        <ellipse cx={FX} cy={FY} rx="78" ry="101" fill="none" stroke="rgba(220,235,236,.14)" strokeWidth="1" />
        <ellipse cx={FX - 6} cy={FY - 4} rx="60" ry="80" fill="#0d1314" stroke="rgba(220,235,236,.1)" />
        <ellipse cx={FX - 6} cy={FY - 4} rx="40" ry="54" fill="none" stroke="rgba(220,235,236,.09)" />
        <path d={`M ${FX - 74} ${FY - 60} A 92 118 0 0 1 ${FX + 18} ${FY - 116}`} fill="none" stroke="rgba(255,255,255,.3)" strokeWidth="1.6" />
        <circle cx={FX - 6} cy={FY - 4} r="6" fill="#8a5c31" opacity="0.7" />
      </g>

      {/* ---- headband ---- */}
      <g>
        <path d={BAND} fill="none" stroke={ref('band')} strokeWidth="36" strokeLinecap="round" />
        <path d={BAND} fill="none" stroke={ref('bandCore')} strokeWidth="15" strokeLinecap="round" opacity="0.9" />
        <path d={BAND_HI} fill="none" stroke="rgba(255,255,255,.34)" strokeWidth="1.4" strokeLinecap="round" />
        <path d="M 196 258 C 250 178 470 178 524 258" fill="none" stroke="rgba(255,255,255,.07)" strokeWidth="1" />
        <path d="M 178 300 C 190 168 530 168 542 300" fill="none" stroke="rgba(0,0,0,.4)" strokeWidth="1" />
      </g>

      {/* ---- yokes / pivots ---- */}
      <g>
        <path d="M 166 320 L 186 412" stroke={ref('yoke')} strokeWidth="15" strokeLinecap="round" fill="none" />
        <path d="M 554 320 L 534 412" stroke={ref('yoke')} strokeWidth="15" strokeLinecap="round" fill="none" />
        <path d="M 166 320 L 186 412" stroke="rgba(255,255,255,.25)" strokeWidth="1" fill="none" />
        <path d="M 554 320 L 534 412" stroke="rgba(255,255,255,.25)" strokeWidth="1" fill="none" />
        <circle cx="186" cy="408" r="10" fill={ref('cupOuter')} stroke="rgba(255,255,255,.3)" />
        <circle cx="534" cy="408" r="10" fill={ref('cupOuter')} stroke="rgba(255,255,255,.3)" />
        <circle cx="186" cy="408" r="3" fill="#0a0e0f" />
        <circle cx="534" cy="408" r="3" fill="#0a0e0f" />
      </g>

      {/* ---- near earcup: the transparent dual chamber ---- */}
      <g transform={`rotate(8 ${CX} ${CY})`}>
        {/* cushion */}
        <ellipse cx={CX} cy={CY + 6} rx="142" ry="172" fill="#080c0d" />
        <ellipse cx={CX} cy={CY} rx="140" ry="170" fill="#111718" stroke="rgba(255,255,255,.1)" strokeWidth="1" />
        <ellipse cx={CX} cy={CY} rx="131" ry="161" fill="none" stroke="rgba(255,255,255,.07)" strokeWidth="10" />

        {/* anodised outer shell */}
        <ellipse cx={CX} cy={CY} rx="128" ry="158" fill={ref('cupOuter')} stroke="rgba(255,255,255,.28)" strokeWidth="1.2" />
        <ellipse cx={CX} cy={CY} rx="120" ry="150" fill="none" stroke="rgba(0,0,0,.42)" strokeWidth="1" />
        <ellipse cx={CX} cy={CY} rx="113" ry="142" fill="none" stroke="rgba(255,255,255,.06)" strokeWidth="1" />

        {/* machined concentric texture */}
        {[104, 108, 111, 114].map((r) => (
          <ellipse key={r} cx={CX} cy={CY} rx={r} ry={r * 1.235} fill="none" stroke="rgba(255,255,255,.035)" strokeWidth="0.7" />
        ))}

        {/* transparent acoustic chamber — glass with refraction rings */}
        <ellipse cx={CX} cy={CY} rx="102" ry="130" fill={ref('chamber')} stroke={ref('glassEdge')} strokeWidth="2" />
        <ellipse cx={CX} cy={CY} rx="95" ry="122" fill="none" stroke="rgba(255,255,255,.14)" strokeWidth="1" />
        <ellipse cx={CX} cy={CY} rx="86" ry="111" fill="none" stroke="rgba(255,255,255,.09)" strokeWidth="1" />

        {/* secondary chamber, visible through the glass */}
        <ellipse cx={CX - 34} cy={CY + 2} rx="40" ry="112" fill="none" stroke="rgba(190,225,230,.22)" strokeWidth="1.4" />
        <ellipse cx={CX - 34} cy={CY + 2} rx="30" ry="99" fill="none" stroke="rgba(190,225,230,.1)" strokeWidth="1" />
        <path d={`M ${CX - 76} ${CY - 62} Q ${CX - 4} ${CY - 108} ${CX + 68} ${CY - 58}`} fill="none" stroke="rgba(255,255,255,.13)" strokeWidth="1" />
        <path d={`M ${CX - 74} ${CY + 66} Q ${CX - 4} ${CY + 112} ${CX + 66} ${CY + 62}`} fill="none" stroke="rgba(255,255,255,.1)" strokeWidth="1" />
        <circle cx={CX - 76} cy={CY - 84} r="3.5" fill="rgba(255,255,255,.42)" />
        <circle cx={CX + 76} cy={CY + 84} r="3.5" fill="rgba(255,255,255,.42)" />

        {/* 38 mm beryllium driver */}
        <ellipse cx={CX + 6} cy={CY} rx="64" ry="84" fill={ref('driver')} stroke="rgba(255,255,255,.2)" strokeWidth="1.2" />
        {spokes.map((s, i) => (
          <line key={i} x1={s.x1 + 6} y1={s.y1} x2={s.x2 + 6} y2={s.y2} stroke="rgba(210,228,230,.11)" strokeWidth="1" />
        ))}
        <ellipse cx={CX + 6} cy={CY} rx="49" ry="64" fill="none" stroke="rgba(210,228,230,.16)" strokeWidth="1" />
        <ellipse cx={CX + 6} cy={CY} rx="36" ry="47" fill="none" stroke="rgba(210,228,230,.12)" strokeWidth="1" />
        <ellipse cx={CX + 6} cy={CY} rx="22" ry="29" fill={ref('dome')} stroke="rgba(255,225,190,.35)" strokeWidth="1" />
        <ellipse cx={CX + 1} cy={CY - 8} rx="9" ry="12" fill="rgba(255,255,255,.24)" filter={ref('glow')} />

        {/* specular highlights on glass */}
        <path d={`M ${CX - 96} ${CY - 62} A 102 130 0 0 1 ${CX + 4} ${CY - 130}`} fill="none" stroke="rgba(255,255,255,.5)" strokeWidth="2" strokeLinecap="round" />
        <path d={`M ${CX + 84} ${CY + 70} A 102 130 0 0 1 ${CX - 22} ${CY + 128}`} fill="none" stroke="rgba(230,180,124,.4)" strokeWidth="1.6" strokeLinecap="round" />
        <ellipse cx={CX - 58} cy={CY - 82} rx="34" ry="20" fill="rgba(255,255,255,.09)" filter={ref('glow')} transform={`rotate(-32 ${CX - 58} ${CY - 82})`} />
        <path d={`M ${CX - 120} ${CY + 34} A 128 158 0 0 0 ${CX - 40} ${CY + 148}`} fill="none" stroke="rgba(255,255,255,.18)" strokeWidth="1" />

        {/* etched marking */}
        <text x={CX + 74} y={CY - 108} fill="rgba(230,240,240,.5)" fontSize="9" letterSpacing="3" fontFamily="Outfit, sans-serif" transform={`rotate(90 ${CX + 74} ${CY - 108})`}>
          N°01 / SPATIAL
        </text>
        <circle cx={CX} cy={CY + 143} r="2" fill="rgba(230,180,124,.8)" />
      </g>

      {/* ---- travelling specular sweep, clipped to the instrument ---- */}
      {sweep && (
        <g mask={ref('silhouette')} style={{ mixBlendMode: 'screen' }}>
          <rect className="hp-sweep-rect" x="-720" y="60" width="720" height="660" fill={ref('sweep')} />
        </g>
      )}
    </svg>
  )
}
