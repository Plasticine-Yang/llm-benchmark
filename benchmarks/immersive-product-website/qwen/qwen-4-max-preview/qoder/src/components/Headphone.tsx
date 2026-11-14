import { memo } from 'react';

interface HeadphoneProps {
  idPrefix: string;
  className?: string;
}

const GRILLE_ANGLES = Array.from({ length: 12 }, (_, i) => (i * Math.PI) / 6);

function Cup({ p, side }: { p: string; side: 'l' | 'r' }) {
  return (
    <g className={`cup-${side}-g`}>
      {/* cushion */}
      <g className={`cushion-${side}-g`}>
        <ellipse rx="92" ry="110" fill={`url(#${p}-cushion)`} />
        <ellipse rx="92" ry="110" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
        <ellipse rx="74" ry="92" fill="#0a0b0d" opacity="0.9" />
        <ellipse rx="74" ry="92" fill="none" stroke="rgba(0,0,0,0.6)" strokeWidth="2" />
      </g>
      {/* shell */}
      <g>
        <ellipse rx="86" ry="104" fill={`url(#${p}-shell)`} />
        <ellipse rx="86" ry="104" fill="none" stroke={`url(#${p}-edge)`} strokeWidth="1.3" />
        <path
          d="M -60 -70 A 84 102 0 0 1 22 -100"
          fill="none"
          stroke="rgba(255,255,255,0.26)"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
        <path
          d="M -44 94 A 84 102 0 0 0 54 80"
          fill="none"
          stroke="rgba(255,255,255,0.07)"
          strokeWidth="2"
          strokeLinecap="round"
        />
        {[
          [0, -96],
          [0, 96],
          [-78, 0],
          [78, 0],
        ].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="2.1" fill="#0a0b0d" stroke="rgba(255,255,255,0.12)" strokeWidth="0.6" />
        ))}
        <circle className="hp-led" cx="0" cy="88" r="2.3" fill="#e2ac64" />
      </g>
      {/* transparent acoustic chamber + driver */}
      <g className={`chamber-${side}-g`}>
        <ellipse rx="63" ry="83" fill={`url(#${p}-glass)`} />
        <ellipse rx="63" ry="83" fill="none" stroke="rgba(207,217,228,0.3)" strokeWidth="1" />
        <ellipse rx="59" ry="79" fill="none" stroke="rgba(0,0,0,0.42)" strokeWidth="1.4" />
        <path
          d="M -42 -64 A 60 80 0 0 1 32 -76"
          fill="none"
          stroke="rgba(255,255,255,0.4)"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
        <circle r="41" fill={`url(#${p}-driver)`} stroke="rgba(0,0,0,0.55)" strokeWidth="1" />
        {GRILLE_ANGLES.map((a, i) => (
          <line
            key={i}
            x1={Math.cos(a) * 17}
            y1={Math.sin(a) * 17}
            x2={Math.cos(a) * 37}
            y2={Math.sin(a) * 37}
            stroke="rgba(207,217,228,0.13)"
            strokeWidth="1"
          />
        ))}
        <circle r="41" fill="none" stroke={`url(#${p}-amber)`} strokeWidth="1.8" opacity="0.95" />
        <circle r="29" fill="none" stroke="rgba(207,217,228,0.12)" strokeWidth="0.8" />
        <circle r="12.5" fill={`url(#${p}-dome)`} stroke="rgba(255,255,255,0.22)" strokeWidth="0.8" />
        <path
          d="M -3.4 4 L -3.4 -4 L 3.4 4 L 3.4 -4"
          fill="none"
          stroke="rgba(16,18,22,0.85)"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </g>
  );
}

export const Headphone = memo(function Headphone({ idPrefix: p, className }: HeadphoneProps) {
  return (
    <svg className={`hp ${className ?? ''}`} viewBox="0 0 600 620" role="img" aria-label="NOCTURNE ONE 旗舰空间声场耳机">
      <defs>
        <linearGradient id={`${p}-band`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style={{ stopColor: 'var(--fp-band-hi)' }} />
          <stop offset="1" style={{ stopColor: 'var(--fp-band-lo)' }} />
        </linearGradient>
        <radialGradient id={`${p}-shell`} cx="0.35" cy="0.28" r="0.9">
          <stop offset="0" style={{ stopColor: 'var(--fp-shell-hi)' }} />
          <stop offset="0.55" style={{ stopColor: 'var(--fp-shell-mid)' }} />
          <stop offset="1" style={{ stopColor: 'var(--fp-shell-lo)' }} />
        </radialGradient>
        <radialGradient id={`${p}-cushion`} cx="0.4" cy="0.35" r="0.85">
          <stop offset="0" style={{ stopColor: 'var(--fp-cushion-hi)' }} />
          <stop offset="1" style={{ stopColor: 'var(--fp-cushion-lo)' }} />
        </radialGradient>
        <linearGradient id={`${p}-metal`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style={{ stopColor: 'var(--fp-metal-hi)' }} />
          <stop offset="1" style={{ stopColor: 'var(--fp-metal-lo)' }} />
        </linearGradient>
        <radialGradient id={`${p}-dome`} cx="0.35" cy="0.3" r="0.9">
          <stop offset="0" style={{ stopColor: 'var(--fp-metal-hi)' }} />
          <stop offset="1" style={{ stopColor: 'var(--fp-metal-lo)' }} />
        </radialGradient>
        <linearGradient id={`${p}-glass`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="rgba(255,255,255,0.16)" />
          <stop offset="0.35" stopColor="rgba(255,255,255,0.04)" />
          <stop offset="0.62" stopColor="rgba(255,255,255,0.015)" />
          <stop offset="1" stopColor="rgba(255,255,255,0.09)" />
        </linearGradient>
        <linearGradient id={`${p}-edge`} x1="0" y1="0" x2="0.7" y2="1">
          <stop offset="0" stopColor="rgba(238,241,245,0.6)" />
          <stop offset="0.45" stopColor="rgba(238,241,245,0.08)" />
          <stop offset="1" stopColor="rgba(238,241,245,0.32)" />
        </linearGradient>
        <radialGradient id={`${p}-driver`} cx="0.4" cy="0.35" r="0.85">
          <stop offset="0" stopColor="#2f343b" />
          <stop offset="1" stopColor="#0f1114" />
        </radialGradient>
        <linearGradient id={`${p}-amber`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#e2ac64" />
          <stop offset="1" stopColor="#8a5f2e" />
        </linearGradient>
      </defs>

      {/* headband */}
      <g className="band-g">
        <path
          d="M 165 238 C 165 92, 435 92, 435 238"
          fill="none"
          stroke={`url(#${p}-band)`}
          strokeWidth="27"
          strokeLinecap="round"
        />
        <path
          d="M 165 244 C 165 106, 435 106, 435 244"
          fill="none"
          stroke="var(--fp-cushion-lo)"
          strokeWidth="11"
          strokeLinecap="round"
          opacity="0.9"
          className="hp-solid"
        />
        <path
          d="M 172 230 C 172 100, 428 100, 428 230"
          fill="none"
          stroke="rgba(255,255,255,0.22)"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        <path
          d="M 165 238 C 165 92, 435 92, 435 238"
          fill="none"
          stroke="rgba(0,0,0,0.32)"
          strokeWidth="1"
          strokeDasharray="3 5"
        />
        <text
          x="300"
          y="132"
          textAnchor="middle"
          fontSize="8.5"
          letterSpacing="4"
          fill="rgba(238,241,245,0.42)"
          fontFamily="'IBM Plex Mono', monospace"
        >
          NOCTURNE
        </text>
      </g>

      {/* slider arms */}
      <g className="arm-l-g">
        <rect x="157.5" y="230" width="15" height="78" rx="7.5" fill={`url(#${p}-metal)`} stroke="rgba(255,255,255,0.15)" strokeWidth="0.8" />
        {[246, 256, 266].map((y) => (
          <line key={y} x1="160.5" y1={y} x2="169.5" y2={y} stroke="rgba(0,0,0,0.4)" strokeWidth="1" />
        ))}
        <circle cx="165" cy="308" r="7" fill={`url(#${p}-metal)`} stroke="rgba(0,0,0,0.5)" strokeWidth="1" />
      </g>
      <g className="arm-r-g">
        <rect x="427.5" y="230" width="15" height="78" rx="7.5" fill={`url(#${p}-metal)`} stroke="rgba(255,255,255,0.15)" strokeWidth="0.8" />
        {[246, 256, 266].map((y) => (
          <line key={y} x1="430.5" y1={y} x2="439.5" y2={y} stroke="rgba(0,0,0,0.4)" strokeWidth="1" />
        ))}
        <circle cx="435" cy="308" r="7" fill={`url(#${p}-metal)`} stroke="rgba(0,0,0,0.5)" strokeWidth="1" />
      </g>

      {/* earcups */}
      <g transform="translate(165 408)">
        <Cup p={p} side="l" />
      </g>
      <g transform="translate(435 408)">
        <Cup p={p} side="r" />
      </g>
    </svg>
  );
});