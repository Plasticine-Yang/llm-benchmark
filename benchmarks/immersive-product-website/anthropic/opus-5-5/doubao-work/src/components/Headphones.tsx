import { memo, useId } from 'react'

interface Props {
  /** 0 assembled · 1 earcups · 2 chambers · 3 headband */
  explode?: 0 | 1 | 2 | 3
  sweep?: boolean
  className?: string
  title?: string
}

/**
 * NOCTURNE ONE, drawn in SVG. Finish colours come from CSS custom properties on :root
 * (registered with @property), so switching finish interpolates without re-rendering.
 * Each part sits in its own <g> so the structure section can separate them with CSS transforms.
 */
function HeadphonesBase({ explode = 0, sweep = false, className, title = 'NOCTURNE ONE 头戴式耳机' }: Props) {
  const uid = useId().replace(/:/g, '')
  const id = (n: string) => `${uid}-${n}`

  return (
    <svg
      viewBox="0 0 600 600"
      className={`hp ${className ?? ''}`}
      data-explode={explode}
      role="img"
      aria-label={title}
    >
      <defs>
        <linearGradient id={id('band')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style={{ stopColor: 'var(--shell-hi)' }} stopOpacity="0.9" />
          <stop offset="0.18" style={{ stopColor: 'var(--shell-1)' }} />
          <stop offset="1" style={{ stopColor: 'var(--band)' }} />
        </linearGradient>
        <linearGradient id={id('shell')} x1="0.2" y1="0" x2="0.8" y2="1">
          <stop offset="0" style={{ stopColor: 'var(--shell-hi)' }} />
          <stop offset="0.28" style={{ stopColor: 'var(--shell-1)' }} />
          <stop offset="0.78" style={{ stopColor: 'var(--shell-2)' }} />
          <stop offset="1" style={{ stopColor: 'var(--shell-2)' }} />
        </linearGradient>
        <radialGradient id={id('shellShade')} cx="0.7" cy="0.75" r="0.75">
          <stop offset="0.4" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.55" />
        </radialGradient>
        <linearGradient id={id('cushion')} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#000" stopOpacity="0.6" />
          <stop offset="0.5" style={{ stopColor: 'var(--cushion)' }} />
          <stop offset="1" stopColor="#000" stopOpacity="0.7" />
        </linearGradient>
        <radialGradient id={id('glass')} cx="0.38" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#f4f8fb" stopOpacity="0.32" />
          <stop offset="0.45" stopColor="#b9c4cd" stopOpacity="0.08" />
          <stop offset="1" stopColor="#0c0e10" stopOpacity="0.55" />
        </radialGradient>
        <radialGradient id={id('driver')} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#3a3f45" />
          <stop offset="0.55" stopColor="#1a1d21" />
          <stop offset="1" stopColor="#0f1113" />
        </radialGradient>
        <radialGradient id={id('core')} cx="0.4" cy="0.35" r="0.6">
          <stop offset="0" stopColor="#f0d3ab" />
          <stop offset="0.5" stopColor="#c99a64" />
          <stop offset="1" stopColor="#5c4127" />
        </radialGradient>
        <linearGradient id={id('metal')} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#5b636b" />
          <stop offset="0.45" stopColor="#e6ebef" />
          <stop offset="0.6" stopColor="#9aa3ab" />
          <stop offset="1" stopColor="#3b4147" />
        </linearGradient>
        <linearGradient id={id('sweep')} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0.55" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <mask id={id('silhouette')} maskUnits="userSpaceOnUse">
          <path d="M118 268 C118 122 200 60 300 60 C400 60 482 122 482 268" fill="none" stroke="#fff" strokeWidth="26" />
          <ellipse cx="146" cy="390" rx="80" ry="114" fill="#fff" />
          <ellipse cx="454" cy="390" rx="80" ry="114" fill="#fff" />
        </mask>
        <filter id={id('soft')} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="0.6" />
        </filter>
      </defs>

      {/* Headband */}
      <g className="hp-band">
        <path d="M118 268 C118 122 200 60 300 60 C400 60 482 122 482 268" fill="none" stroke={`url(#${id('band')})`} strokeWidth="24" strokeLinecap="round" />
        <path d="M118 268 C118 122 200 60 300 60 C400 60 482 122 482 268" fill="none" stroke="#fff" strokeOpacity="0.28" strokeWidth="1" transform="translate(0,-11.5)" />
        {/* inner suspension strap */}
        <path d="M142 262 C146 150 214 96 300 96 C386 96 454 150 458 262" fill="none" stroke="#0d0f11" strokeOpacity="0.7" strokeWidth="16" strokeLinecap="round" />
        <path d="M142 262 C146 150 214 96 300 96 C386 96 454 150 458 262" fill="none" stroke="#c99a64" strokeOpacity="0.55" strokeWidth="0.8" strokeDasharray="2 6" />
        <text x="300" y="54" textAnchor="middle" fill="#fff" fillOpacity="0.32" fontSize="7" letterSpacing="3" fontFamily="var(--font-mono)">NOCTURNE · ONE</text>
      </g>

      {[0, 1].map((side) => (
        <g key={side} transform={side ? 'translate(600 0) scale(-1 1)' : undefined}>
          {/* Slider + yoke */}
          <g className="hp-slider">
            <rect x="139" y="236" width="14" height="40" rx="3" fill={`url(#${id('metal')})`} />
            <rect x="139" y="246" width="14" height="1" fill="#000" fillOpacity="0.4" />
            <rect x="139" y="254" width="14" height="1" fill="#000" fillOpacity="0.4" />
            <path d="M84 340 C84 286 110 268 146 268 C182 268 208 286 208 340" fill="none" stroke={`url(#${id('metal')})`} strokeWidth="5" strokeLinecap="round" />
          </g>

          {/* Cushion (inner side) */}
          <g className="hp-cushion-l">
            <ellipse cx="196" cy="392" rx="40" ry="104" fill={`url(#${id('cushion')})`} />
            <ellipse cx="196" cy="392" rx="40" ry="104" fill="none" stroke="#fff" strokeOpacity="0.06" />
            <path d="M206 300 C222 340 222 444 206 484" fill="none" stroke="#fff" strokeOpacity="0.1" strokeWidth="1" />
          </g>

          {/* Cup shell */}
          <g className="hp-cup-l">
            <ellipse cx="146" cy="390" rx="80" ry="114" fill={`url(#${id('shell')})`} />
            <ellipse cx="146" cy="390" rx="80" ry="114" fill={`url(#${id('shellShade')})`} />
            <ellipse cx="146" cy="390" rx="79.5" ry="113.5" fill="none" stroke="#fff" strokeOpacity="0.35" strokeWidth="1" strokeDasharray="120 600" strokeDashoffset="-470" />
            {/* chamber seat */}
            <ellipse cx="146" cy="390" rx="60" ry="90" fill="#0b0d0f" fillOpacity="0.85" />
            <ellipse cx="146" cy="390" rx="60" ry="90" fill="none" stroke="#fff" strokeOpacity="0.12" />
            {/* control details */}
            <rect x="74" y="430" width="3" height="18" rx="1.5" fill="#c99a64" fillOpacity="0.8" />
            <circle cx="80" cy="356" r="2" fill="#fff" fillOpacity="0.3" />
          </g>

          {/* Ghost outline revealed when the chamber lifts away */}
          <g className="hp-ghost" aria-hidden="true">
            <ellipse cx="146" cy="390" rx="60" ry="90" fill="none" stroke="#c99a64" strokeOpacity="0.6" strokeDasharray="3 5" />
          </g>

          {/* Transparent acoustic chamber */}
          <g className="hp-chamber-l">
            <ellipse cx="146" cy="390" rx="56" ry="85" fill={`url(#${id('driver')})`} />
            {[46, 38, 30, 22].map((r, i) => (
              <ellipse key={r} cx="146" cy="390" rx={r * 0.66} ry={r} fill="none" stroke="#dfe6ec" strokeOpacity={0.08 + i * 0.05} strokeWidth="0.8" />
            ))}
            {Array.from({ length: 12 }).map((_, i) => {
              const a = (i / 12) * Math.PI * 2
              return (
                <line key={i} x1={146 + Math.cos(a) * 10} y1={390 + Math.sin(a) * 15} x2={146 + Math.cos(a) * 34} y2={390 + Math.sin(a) * 52} stroke="#dfe6ec" strokeOpacity="0.07" strokeWidth="0.8" />
              )
            })}
            <ellipse cx="146" cy="390" rx="12" ry="18" fill={`url(#${id('core')})`} />
            <ellipse cx="146" cy="390" rx="40" ry="60" fill="none" stroke="#c99a64" strokeOpacity="0.75" strokeWidth="1" />
            {/* glass dome */}
            <ellipse cx="146" cy="390" rx="56" ry="85" fill={`url(#${id('glass')})`} />
            <path d="M104 350 C110 322 128 306 150 304" fill="none" stroke="#fff" strokeOpacity="0.65" strokeWidth="1" strokeLinecap="round" filter={`url(#${id('soft')})`} />
            <ellipse cx="146" cy="390" rx="55.5" ry="84.5" fill="none" stroke="#fff" strokeOpacity="0.22" strokeWidth="0.8" />
            {/* dispersion fringe */}
            <ellipse cx="145.4" cy="390" rx="56" ry="85" fill="none" stroke="#ff8a6a" strokeOpacity="0.16" strokeWidth="0.6" />
            <ellipse cx="146.6" cy="390" rx="56" ry="85" fill="none" stroke="#7fb3ff" strokeOpacity="0.16" strokeWidth="0.6" />
          </g>
        </g>
      ))}

      {sweep && (
        <g mask={`url(#${id('silhouette')})`} style={{ mixBlendMode: 'overlay' }} aria-hidden="true">
          <g className="hp-sweep">
            <rect x="0" y="-60" width="110" height="720" fill={`url(#${id('sweep')})`} transform="skewX(-18)" />
          </g>
        </g>
      )}
    </svg>
  )
}

export const Headphones = memo(HeadphonesBase)
