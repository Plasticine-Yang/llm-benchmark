import { createContext, useContext, type ReactNode } from 'react';

/* ============================================================================
   Shared geometry + defs for the NOCTURNE ONE installation.
   Everything is CSS-variable driven so the colorway cross-fade happens in the
   compositor via registered custom properties — no re-render required.
   ========================================================================= */

export const VIEW_W = 860;
export const VIEW_H = 800;

/** Camera framing shared by every rendering of the product. */
const CONTENT_CX = 475;
const CONTENT_CY = 440;
const frame = (scale: number) =>
  `translate(-16 -8) translate(${CONTENT_CX} ${CONTENT_CY}) scale(${scale}) translate(${-CONTENT_CX} ${-CONTENT_CY})`;

/** Hero / colourway framing — the instrument, close up. */
export const FRAME_PRODUCT = frame(1.22);
/** Exploded framing — leaves room for the parts to travel apart. */
export const FRAME_EXPLODED = frame(1.05);

/**
 * The exploded view is framed separately: a box just large enough for the
 * parts to travel, so the drawing fills its stage instead of letterboxing
 * inside the full assembly viewBox.
 */
export const EXPLODED_BOX = { w: 700, h: 676 };
export const EXPLODED_VIEWBOX = `110 92 ${EXPLODED_BOX.w} ${EXPLODED_BOX.h}`;

/** Anchor points shared between the full assembly and the exploded view. */
export const ANCHOR = {
  farCup: { x: 300, y: 448, rx: 92, ry: 112, rot: -7 },
  nearCup: { x: 614, y: 462, rx: 120, ry: 146, rot: 9 },
  bandPath: 'M 296 334 C 306 186, 522 148, 640 302',
  bandTextPath: 'M 320 318 C 336 196, 520 166, 618 292',
  yoke: { x: 634, y: 306 },
} as const;

/* ---------------------------------------------------------------- id scope */
const IdCtx = createContext<(name: string) => string>((n) => n);

export function ProductIdProvider({
  uid,
  children,
}: {
  uid: string;
  children: ReactNode;
}) {
  return (
    <IdCtx.Provider value={(name: string) => `${uid}-${name}`}>
      {children}
    </IdCtx.Provider>
  );
}

export const useUid = () => useContext(IdCtx);

/* -------------------------------------------------------------- materials */
const WHITE = '#ffffff';

export function ProductDefs() {
  const u = useUid();
  return (
    <defs>
      {/* machined shell body */}
      <linearGradient id={u('body')} x1="0.12" y1="0" x2="0.88" y2="1">
        <stop offset="0%" style={{ stopColor: 'var(--shell-hi)' }} />
        <stop offset="34%" style={{ stopColor: 'var(--shell-mid)' }} />
        <stop offset="100%" style={{ stopColor: 'var(--shell-lo)' }} />
      </linearGradient>

      {/* far cup: pushed back by atmospheric falloff, not by going black */}
      <linearGradient id={u('body-far')} x1="0.1" y1="0" x2="0.9" y2="1">
        <stop offset="0%" style={{ stopColor: 'var(--shell-hi)' }} stopOpacity="0.85" />
        <stop offset="48%" style={{ stopColor: 'var(--shell-mid)' }} />
        <stop offset="100%" style={{ stopColor: 'var(--shell-lo)' }} />
      </linearGradient>

      {/* interior of the transparent acoustic chamber */}
      <radialGradient id={u('cavity')} cx="0.5" cy="0.34" r="0.78">
        <stop offset="0%" stopColor="#2b313a" />
        <stop offset="46%" stopColor="#1a1e24" />
        <stop offset="100%" stopColor="#0a0c0f" />
      </radialGradient>

      {/* warm bloom from the driver sitting behind the glass */}
      <radialGradient id={u('bloom')} cx="0.5" cy="0.5" r="0.5">
        <stop offset="0%" style={{ stopColor: 'var(--glow)' }} />
        <stop offset="55%" style={{ stopColor: 'var(--glow)' }} stopOpacity="0.25" />
        <stop offset="100%" style={{ stopColor: 'var(--glow)' }} stopOpacity="0" />
      </radialGradient>

      {/* driver dome */}
      <radialGradient id={u('dome')} cx="0.34" cy="0.28" r="0.86">
        <stop offset="0%" stopColor="#818b97" />
        <stop offset="34%" stopColor="#39404a" />
        <stop offset="72%" stopColor="#1a1e23" />
        <stop offset="100%" stopColor="#0c0e11" />
      </radialGradient>

      {/* driver surround ring */}
      <linearGradient id={u('surround')} x1="0" y1="0" x2="0.7" y2="1">
        <stop offset="0%" stopColor="#5a626d" />
        <stop offset="45%" stopColor="#22262c" />
        <stop offset="100%" stopColor="#0d0f12" />
      </linearGradient>

      {/* headband metal */}
      <linearGradient id={u('band')} x1="0" y1="0" x2="1" y2="0.35">
        <stop offset="0%" style={{ stopColor: 'var(--shell-lo)' }} />
        <stop offset="22%" style={{ stopColor: 'var(--shell-mid)' }} />
        <stop offset="52%" style={{ stopColor: 'var(--shell-hi)' }} />
        <stop offset="78%" style={{ stopColor: 'var(--shell-mid)' }} />
        <stop offset="100%" style={{ stopColor: 'var(--shell-lo)' }} />
      </linearGradient>

      <linearGradient id={u('band-edge')} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#05070a" />
        <stop offset="50%" stopColor="#0d1014" />
        <stop offset="100%" stopColor="#04060a" />
      </linearGradient>

      <linearGradient id={u('yoke')} x1="0.2" y1="0" x2="0.8" y2="1">
        <stop offset="0%" stopColor="#545c67" />
        <stop offset="40%" stopColor="#1d2126" />
        <stop offset="100%" stopColor="#0b0d10" />
      </linearGradient>

      {/* variable edge brightness — brightest where the key light lands */}
      <linearGradient id={u('edge')} x1="0.05" y1="0" x2="0.95" y2="1">
        <stop offset="0%" style={{ stopColor: WHITE }} stopOpacity="0.66" />
        <stop offset="16%" style={{ stopColor: WHITE }} stopOpacity="0.1" />
        <stop offset="44%" style={{ stopColor: WHITE }} stopOpacity="0.015" />
        <stop offset="70%" style={{ stopColor: WHITE }} stopOpacity="0.09" />
        <stop offset="100%" style={{ stopColor: 'var(--ring)' }} stopOpacity="0.7" />
      </linearGradient>

      <linearGradient id={u('edge-inner')} x1="0.2" y1="0" x2="0.8" y2="1">
        <stop offset="0%" style={{ stopColor: WHITE }} stopOpacity="0.34" />
        <stop offset="30%" style={{ stopColor: WHITE }} stopOpacity="0.05" />
        <stop offset="100%" style={{ stopColor: WHITE }} stopOpacity="0.14" />
      </linearGradient>

      {/* glass top-coat laid over the chamber window */}
      <linearGradient id={u('coat')} x1="0.1" y1="0" x2="0.75" y2="1">
        <stop offset="0%" style={{ stopColor: WHITE }} stopOpacity="0.13" />
        <stop offset="26%" style={{ stopColor: WHITE }} stopOpacity="0.02" />
        <stop offset="62%" style={{ stopColor: WHITE }} stopOpacity="0.008" />
        <stop offset="100%" style={{ stopColor: WHITE }} stopOpacity="0.07" />
      </linearGradient>

      {/* the refraction smear that crosses the chamber */}
      <linearGradient id={u('smear')} x1="0" y1="0" x2="1" y2="0.4">
        <stop offset="0%" style={{ stopColor: WHITE }} stopOpacity="0.02" />
        <stop offset="36%" style={{ stopColor: WHITE }} stopOpacity="0.13" />
        <stop offset="52%" style={{ stopColor: WHITE }} stopOpacity="0.03" />
        <stop offset="100%" style={{ stopColor: WHITE }} stopOpacity="0" />
      </linearGradient>

      {/* light passing through the cover glass */}
      <linearGradient id={u('shaft')} x1="0.05" y1="0" x2="0.95" y2="1">
        <stop offset="0%" style={{ stopColor: WHITE }} stopOpacity="0.12" />
        <stop offset="52%" style={{ stopColor: WHITE }} stopOpacity="0.03" />
        <stop offset="100%" style={{ stopColor: WHITE }} stopOpacity="0" />
      </linearGradient>

      <radialGradient id={u('spec')} cx="0.5" cy="0.5" r="0.5">
        <stop offset="0%" style={{ stopColor: WHITE }} stopOpacity="0.3" />
        <stop offset="60%" style={{ stopColor: WHITE }} stopOpacity="0.05" />
        <stop offset="100%" style={{ stopColor: WHITE }} stopOpacity="0" />
      </radialGradient>

      {/* perforated driver grille */}
      <pattern
        id={u('mesh')}
        width="7"
        height="7"
        patternUnits="userSpaceOnUse"
      >
        <circle cx="3.5" cy="3.9" r="1.5" fill="#05070a" fillOpacity="0.85" />
        <circle cx="3.5" cy="2.85" r="1.4" fill="#8f98a4" fillOpacity="0.12" />
      </pattern>

      <filter id={u('f-dof')} x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="1.9" />
      </filter>
      <filter id={u('f-soft')} x="-40%" y="-40%" width="180%" height="180%">
        <feGaussianBlur stdDeviation="1.3" />
      </filter>
      <filter id={u('f-glow')} x="-120%" y="-120%" width="340%" height="340%">
        <feGaussianBlur stdDeviation="11" />
      </filter>
      <filter id={u('f-shadow')} x="-60%" y="-200%" width="220%" height="500%">
        <feGaussianBlur stdDeviation="26" />
      </filter>
      <filter id={u('f-inner')} x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="7" />
      </filter>
    </defs>
  );
}

/* ==========================================================================
   Near earcup shell — the outermost machined body (explodes to the right)
   ========================================================================= */
export function EarcupShell() {
  const u = useUid();
  const { rx, ry } = ANCHOR.nearCup;
  const outline = {
    x: -rx,
    y: -ry,
    width: rx * 2,
    height: ry * 2,
    rx: 76,
  };
  return (
    <g>
      {/* cast shadow inside the silhouette for material weight */}
      <rect {...outline} fill="#05070a" filter={`url(#${u('f-inner')})`} />
      <rect {...outline} fill={`url(#${u('body')})`} />
      {/* cylindrical falloff: bright upper-left shoulder, dark lower-right */}
      <ellipse
        cx={-30}
        cy={-104}
        rx={112}
        ry={62}
        fill={`url(#${u('spec')})`}
        transform="rotate(-26 -30 -104)"
        opacity="0.85"
      />
      <ellipse
        cx={62}
        cy={118}
        rx={96}
        ry={64}
        fill="#04060a"
        opacity="0.5"
        filter={`url(#${u('f-inner')})`}
      />
      {/* machined seam under the chamber lip */}
      <rect
        x={-rx + 4}
        y={-ry + 4}
        width={rx * 2 - 8}
        height={ry * 2 - 8}
        rx={73}
        fill="none"
        stroke="#04060a"
        strokeOpacity="0.65"
        strokeWidth="2.6"
      />
      <rect
        {...outline}
        fill="none"
        stroke={`url(#${u('edge')})`}
        strokeWidth="1.6"
      />
      {/* 1px inner highlight, top-left arc only */}
      <path
        d={`M ${-rx + 46} ${-ry + 8} A ${rx} ${ry} 0 0 1 ${rx - 30} ${-ry + 66}`}
        fill="none"
        stroke={WHITE}
        strokeOpacity="0.42"
        strokeWidth="1"
        strokeLinecap="round"
      />
      {/* etched brand mark on the outer rim */}
      <text
        transform={`translate(${-rx + 21} ${ry - 96}) rotate(-90)`}
        fontSize="10.5"
        letterSpacing="5.4"
        fill={WHITE}
        fillOpacity="0.3"
        style={{ fontFamily: "'SF Mono', ui-monospace, Menlo, monospace" }}
      >
        NOCTURNE
      </text>
      <text
        transform={`translate(${-rx + 21} ${ry - 40}) rotate(-90)`}
        fontSize="9"
        letterSpacing="3.6"
        fill={WHITE}
        fillOpacity="0.16"
        style={{ fontFamily: "'SF Mono', ui-monospace, Menlo, monospace" }}
      >
        ONE
      </text>
    </g>
  );
}

/* ==========================================================================
   Transparent acoustic chamber — driver, cavity, glass (explodes left)
   ========================================================================= */
export function AcousticChamber() {
  const u = useUid();
  const { rx, ry } = ANCHOR.nearCup;
  const wx = rx - 30;
  const wy = ry - 32;
  const WR = 64; // window corner radius
  const inner = 'scale(0.92)'; // optics inside the glass

  const ticks = Array.from({ length: 72 }, (_, i) => i);

  return (
    <g>
      <clipPath id={u('clip-window')}>
        <rect x={-wx} y={-wy} width={wx * 2} height={wy * 2} rx={WR} />
      </clipPath>

      <g clipPath={`url(#${u('clip-window')})`}>
        <rect
          x={-wx}
          y={-wy}
          width={wx * 2}
          height={wy * 2}
          rx={WR}
          fill={`url(#${u('cavity')})`}
        />
        {/* driver bloom behind the glass */}
        <circle cx="0" cy="-6" r="104" fill={`url(#${u('bloom')})`} />

        <g transform={inner}>
          {/* machined cavity rings */}
          {[104, 88, 70, 52].map((r) => (
            <circle
              key={r}
              cx="0"
              cy="-6"
              r={r}
              fill="none"
              stroke={WHITE}
              strokeOpacity={r > 90 ? 0.05 : 0.09}
              strokeWidth="1.2"
            />
          ))}

          {/* precision tick ring */}
          <g opacity="0.55">
            {ticks.map((i) => {
              const a = (i / ticks.length) * Math.PI * 2;
              const long = i % 6 === 0;
              const r1 = 96;
              const r2 = long ? 104 : 100;
              const cx = Math.cos(a) * r1;
              const cy = -6 + Math.sin(a) * r1;
              const dx = Math.cos(a) * r2;
              const dy = -6 + Math.sin(a) * r2;
              return (
                <line
                  key={i}
                  x1={cx}
                  y1={cy}
                  x2={dx}
                  y2={dy}
                  stroke={long ? 'var(--ring)' : WHITE}
                  strokeOpacity={long ? 0.5 : 0.18}
                  strokeWidth={long ? 1.3 : 1}
                />
              );
            })}
          </g>

          {/* acoustic ports */}
          {[-1, 0, 1].map((k) => (
            <rect
              key={k}
              x={-9}
              y={-92}
              width={18}
              height={9}
              rx={4.5}
              fill="#05070a"
              fillOpacity="0.7"
              transform={`rotate(${k * 34} 0 -6)`}
            />
          ))}

          {/* driver assembly */}
          <g>
            <circle cx="0" cy="-6" r="56" fill={`url(#${u('surround')})`} />
            <circle
              cx="0"
              cy="-6"
              r="56"
              fill="none"
              stroke={WHITE}
              strokeOpacity="0.18"
              strokeWidth="1.2"
            />
            <circle cx="0" cy="-6" r="47" fill="#0a0c0f" />
            <circle cx="0" cy="-6" r="47" fill={`url(#${u('mesh')})`} />
            <circle cx="0" cy="-6" r="47" fill={`url(#${u('coat')})`} />
            {/* amber suspension ring */}
            <circle
              cx="0"
              cy="-6"
              r="52.5"
              fill="none"
              stroke="var(--amber)"
              strokeOpacity="0.8"
              strokeWidth="1.6"
            />
            <circle
              cx="0"
              cy="-6"
              r="47.5"
              fill="none"
              stroke="#05070a"
              strokeOpacity="0.9"
              strokeWidth="3.5"
            />
            {/* dome + coil */}
            <circle cx="0" cy="-6" r="19" fill={`url(#${u('dome')})`} />
            <circle
              cx="0"
              cy="-6"
              r="19"
              fill="none"
              stroke={WHITE}
              strokeOpacity="0.24"
              strokeWidth="1"
            />
            <path
              d="M -12 -14 A 19 19 0 0 1 4 -25"
              fill="none"
              stroke={WHITE}
              strokeOpacity="0.55"
              strokeWidth="1.3"
              strokeLinecap="round"
            />
            <circle cx="0" cy="-6" r="4.8" fill="#0c0e11" />
            <circle
              cx="0"
              cy="-7"
              r="4.8"
              fill="none"
              stroke={WHITE}
              strokeOpacity="0.16"
            />
          </g>

          {/* faint internal wiring: two hairlines from the coil to the port block */}
          <path
            d="M -4 4 C -8 40, -34 52, -52 74"
            fill="none"
            stroke="var(--amber)"
            strokeOpacity="0.24"
            strokeWidth="1.2"
          />
          <path
            d="M 4 4 C 10 38, 38 54, 58 72"
            fill="none"
            stroke={WHITE}
            strokeOpacity="0.11"
            strokeWidth="1.2"
          />

          {/* specular caught on the cover glass */}
          <ellipse
            cx="-48"
            cy="-96"
            rx="62"
            ry="34"
            fill={`url(#${u('spec')})`}
            transform="rotate(-30 -48 -96)"
          />
        </g>

        {/* refraction smear across the glass */}
        <rect
          x={-wx}
          y={-wy}
          width={wx * 2}
          height={wy * 2}
          fill={`url(#${u('smear')})`}
          transform="rotate(-19 0 0)"
        />
        {/* machined grooves on the cavity floor */}
        {[52, 72, 92, 112].map((yy) => (
          <path
            key={yy}
            d={`M ${-wx + 8} ${yy} Q 0 ${yy + 11} ${wx - 8} ${yy}`}
            fill="none"
            stroke="#ffffff"
            strokeOpacity="0.055"
            strokeWidth="1"
          />
        ))}
        {/* light travelling through the glass */}
        <rect
          x={-wx}
          y={-wy}
          width={wx * 2}
          height={wy * 2}
          fill={`url(#${u('shaft')})`}
        />
        {/* inner shadow: the chamber walls falling into darkness */}
        <rect
          x={-wx}
          y={-wy}
          width={wx * 2}
          height={wy * 2}
          rx={WR}
          fill="none"
          stroke="#000000"
          strokeOpacity="0.6"
          strokeWidth="26"
          filter={`url(#${u('f-inner')})`}
        />
      </g>

      {/* glass top-coat + rim */}
      <rect
        x={-wx}
        y={-wy}
        width={wx * 2}
        height={wy * 2}
        rx={WR}
        fill={`url(#${u('coat')})`}
      />
      <rect
        x={-wx}
        y={-wy}
        width={wx * 2}
        height={wy * 2}
        rx={WR}
        fill="none"
        stroke={`url(#${u('edge-inner')})`}
        strokeWidth="1.4"
      />
      {/* 1px highlight riding the top edge of the glass */}
      <path
        d={`M ${-wx + 40} ${-wy + 6} A ${wx} ${wy} 0 0 1 ${wx - 34} ${-wy + 52}`}
        fill="none"
        stroke={WHITE}
        strokeOpacity="0.5"
        strokeWidth="1"
        strokeLinecap="round"
      />

      {/* chromatic dispersion on the glass rim */}
      <path
        d={`M ${-wx + 30} ${-wy + 2} A ${wx} ${wy} 0 0 1 ${wx - 20} ${-wy + 40}`}
        fill="none"
        stroke="var(--amber)"
        strokeOpacity="0.3"
        strokeWidth="0.9"
        transform="translate(-1.6 -1.2)"
        style={{ mixBlendMode: 'screen' }}
      />
      <path
        d={`M ${-wx + 38} ${-wy + 4} A ${wx} ${wy} 0 0 1 ${wx - 26} ${-wy + 52}`}
        fill="none"
        stroke="#9fd0ff"
        strokeOpacity="0.26"
        strokeWidth="0.9"
        transform="translate(1.6 1.2)"
        style={{ mixBlendMode: 'screen' }}
      />
    </g>
  );
}

/* ==========================================================================
   Headband + yoke
   ========================================================================= */
export function Headband() {
  const u = useUid();
  const p = ANCHOR.bandPath;
  return (
    <g>
      {/* inner cushion — the padded underside of the band */}
      <path
        d={p}
        fill="none"
        stroke="#080a0d"
        strokeWidth="32"
        strokeLinecap="round"
        transform="translate(0 19)"
      />
      <path
        d={p}
        fill="none"
        stroke="#1a1e24"
        strokeWidth="24"
        strokeLinecap="round"
        transform="translate(0 21)"
      />
      <path
        d={p}
        fill="none"
        stroke="#2b3138"
        strokeWidth="6"
        strokeLinecap="round"
        transform="translate(0 26)"
        opacity="0.6"
        filter={`url(#${u('f-soft')})`}
      />
      {/* outer rail */}
      <path
        d={p}
        fill="none"
        stroke={`url(#${u('band-edge')})`}
        strokeWidth="68"
        strokeLinecap="round"
      />
      {/* metal body */}
      <path
        d={p}
        fill="none"
        stroke={`url(#${u('band')})`}
        strokeWidth="58"
        strokeLinecap="round"
      />
      {/* top specular */}
      <path
        d={p}
        fill="none"
        stroke={WHITE}
        strokeOpacity="0.42"
        strokeWidth="9"
        strokeLinecap="round"
        transform="translate(0 -17)"
        filter={`url(#${u('f-soft')})`}
      />
      <path
        d={p}
        fill="none"
        stroke={WHITE}
        strokeOpacity="0.6"
        strokeWidth="1.2"
        strokeLinecap="round"
        transform="translate(0 -28)"
      />
      {/* amber seam along the lower edge */}
      <path
        d={p}
        fill="none"
        stroke="var(--amber)"
        strokeOpacity="0.42"
        strokeWidth="1.2"
        strokeLinecap="round"
        transform="translate(0 26)"
      />
      {/* engraved text following the rail */}
      <path id={u('band-text')} d={ANCHOR.bandTextPath} fill="none" />
      <text
        fontSize="10"
        letterSpacing="7"
        fill={WHITE}
        fillOpacity="0.34"
        style={{ fontFamily: "'SF Mono', ui-monospace, Menlo, monospace" }}
      >
        <textPath href={`#${u('band-text')}`} startOffset="8%">
          NOCTURNE ONE — SPATIAL ENGINE
        </textPath>
      </text>
    </g>
  );
}

export function Yoke({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  const u = useUid();
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <rect
        x="-21"
        y="-14"
        width="42"
        height="62"
        rx="10"
        fill={`url(#${u('yoke')})`}
      />
      <rect
        x="-21"
        y="-14"
        width="42"
        height="62"
        rx="10"
        fill="none"
        stroke={`url(#${u('edge-inner')})`}
        strokeWidth="1"
      />
      <circle cx="0" cy="4" r="7.5" fill="#0d1014" />
      <circle
        cx="0"
        cy="4"
        r="7.5"
        fill="none"
        stroke="var(--ring)"
        strokeOpacity="0.55"
        strokeWidth="1.1"
      />
      <circle cx="-2" cy="2" r="2" fill={WHITE} fillOpacity="0.28" />
    </g>
  );
}
