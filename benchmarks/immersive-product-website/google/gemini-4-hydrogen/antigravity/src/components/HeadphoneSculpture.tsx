import { memo, useId } from 'react'
import { FINISHES } from '../data/productData'
import type { FinishId } from '../types/product'

interface HeadphoneSculptureProps {
  finish: FinishId
  compact?: boolean
  animateFloat?: boolean
  className?: string
}

export const HeadphoneSculpture = memo(function HeadphoneSculpture({
  finish,
  compact = false,
  animateFloat = true,
  className = '',
}: HeadphoneSculptureProps) {
  const uid = useId().replace(/:/g, '')
  const profile = FINISHES[finish]

  return (
    <div className={`relative select-none ${className}`}>
      {/* Volumetric dark-room ambient spotlight behind the installation */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-10 rounded-full blur-3xl transition-all duration-700"
        style={{
          background: `radial-gradient(ellipse 68% 60% at 54% 46%, ${profile.ambientPrimary} 0%, ${profile.ambientSecondary} 44%, transparent 76%)`,
        }}
      />

      {/* Precision volumetric light cone */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-0 h-[86%] w-[78%] -translate-x-1/2 opacity-70 transition-all duration-700"
        style={{
          background: `conic-gradient(from 180deg at 52% 0%, transparent 152deg, ${profile.ambientRim} 178deg, rgba(255,255,255,0.03) 186deg, transparent 214deg)`,
          filter: 'blur(24px)',
        }}
      />

      {/* Floating product body */}
      <div className={animateFloat ? 'anim-levitate relative z-10' : 'relative z-10'}>
        <svg
          viewBox="0 0 640 620"
          className="h-auto w-full drop-shadow-[0_32px_60px_rgba(4,6,10,0.75)]"
          role="img"
          aria-label={`NOCTURNE ONE ${profile.name} 透明双腔体头戴式耳机三维结构渲染`}
        >
          <defs>
            {/* Metallic chassis gradients with smooth finish transition */}
            <linearGradient id={`band-${uid}`} x1="15%" y1="5%" x2="85%" y2="88%">
              <stop
                offset="0%"
                stopColor={profile.metalLight}
                style={{ transition: 'stop-color 550ms ease' }}
              />
              <stop
                offset="48%"
                stopColor={profile.metalMid}
                style={{ transition: 'stop-color 550ms ease' }}
              />
              <stop
                offset="100%"
                stopColor={profile.metalDark}
                style={{ transition: 'stop-color 550ms ease' }}
              />
            </linearGradient>

            <linearGradient id={`cup-bezel-${uid}`} x1="12%" y1="8%" x2="88%" y2="94%">
              <stop
                offset="0%"
                stopColor={profile.metalLight}
                style={{ transition: 'stop-color 550ms ease' }}
              />
              <stop
                offset="45%"
                stopColor={profile.metalMid}
                style={{ transition: 'stop-color 550ms ease' }}
              />
              <stop
                offset="100%"
                stopColor={profile.metalDark}
                style={{ transition: 'stop-color 550ms ease' }}
              />
            </linearGradient>

            <linearGradient id={`cushion-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop
                offset="0%"
                stopColor={profile.cushionOuter}
                style={{ transition: 'stop-color 550ms ease' }}
              />
              <stop
                offset="100%"
                stopColor={profile.cushionInner}
                style={{ transition: 'stop-color 550ms ease' }}
              />
            </linearGradient>

            {/* Transparent acoustic chamber refractive dome */}
            <radialGradient id={`dome-${uid}`} cx="36%" cy="28%" r="74%">
              <stop
                offset="0%"
                stopColor={profile.chamberGlassTop}
                style={{ transition: 'stop-color 550ms ease' }}
              />
              <stop offset="56%" stopColor="rgba(22, 27, 36, 0.34)" />
              <stop
                offset="100%"
                stopColor={profile.chamberGlassBottom}
                style={{ transition: 'stop-color 550ms ease' }}
              />
            </radialGradient>

            {/* Beryllium 38 mm driver diaphragm */}
            <radialGradient id={`driver-${uid}`} cx="42%" cy="38%" r="64%">
              <stop
                offset="0%"
                stopColor={profile.driverConeLight}
                style={{ transition: 'stop-color 550ms ease' }}
              />
              <stop offset="68%" stopColor={profile.driverConeDark} />
              <stop offset="100%" stopColor="#0D1015" />
            </radialGradient>

            {/* Specular highlight band for headband crown */}
            <linearGradient id={`crown-spec-${uid}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(255,255,255,0)" />
              <stop offset="32%" stopColor="rgba(235,242,252,0.45)" />
              <stop offset="52%" stopColor="rgba(201,138,75,0.22)" />
              <stop offset="72%" stopColor="rgba(235,242,252,0.28)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0)" />
            </linearGradient>

            {/* Passing light sweep beam gradient */}
            <linearGradient id={`sweep-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(255,255,255,0)" />
              <stop offset="45%" stopColor="rgba(232,240,252,0.06)" />
              <stop offset="50%" stopColor="rgba(244,248,255,0.34)" />
              <stop offset="55%" stopColor="rgba(216,162,106,0.16)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0)" />
            </linearGradient>

            {/* Subtle background depth-of-field blur for rear earcup */}
            <filter id={`rear-dof-${uid}`} x="-12%" y="-12%" width="124%" height="124%">
              <feGaussianBlur stdDeviation="0.95" />
            </filter>

            {/* Clip path for transparent foreground dome light sweep */}
            <clipPath id={`dome-clip-${uid}`}>
              <ellipse cx="386" cy="368" rx="94" ry="116" transform="rotate(-11 386 368)" />
            </clipPath>
          </defs>

          {/* ==========================================================
              BACKGROUND PLANE: Receding Rear Left Earcup (Depth of Field)
              ========================================================== */}
          <g filter={`url(#rear-dof-${uid})`} opacity="0.72">
            {/* Rear cushion & chassis */}
            <ellipse
              cx="198"
              cy="346"
              rx="82"
              ry="104"
              transform="rotate(9 198 346)"
              fill={`url(#cushion-${uid})`}
              stroke="rgba(220,230,245,0.14)"
              strokeWidth="1"
            />
            <ellipse
              cx="188"
              cy="346"
              rx="64"
              ry="86"
              transform="rotate(9 188 346)"
              fill={`url(#cup-bezel-${uid})`}
              stroke={profile.metalStroke}
              strokeWidth="1"
            />
            {/* Rear subtle smoked glass glimpse */}
            <ellipse
              cx="182"
              cy="346"
              rx="46"
              ry="65"
              transform="rotate(9 182 346)"
              fill="rgba(16, 20, 27, 0.72)"
              stroke="rgba(210, 224, 240, 0.2)"
              strokeWidth="0.9"
            />
            {/* Rear yoke stem */}
            <path
              d="M 186 244 C 184 218, 198 188, 220 162"
              fill="none"
              stroke={`url(#band-${uid})`}
              strokeWidth="12"
              strokeLinecap="round"
            />
          </g>

          {/* ==========================================================
              MIDGROUND: Precision Forged Headband & Stitched Crown Pad
              ========================================================== */}
          <g>
            {/* Inner underside memory-foam crown cushion */}
            <path
              d="M 206 184 C 242 104, 392 98, 428 192"
              fill="none"
              stroke={`url(#cushion-${uid})`}
              strokeWidth="26"
              strokeLinecap="round"
            />
            <path
              d="M 218 186 C 254 114, 384 108, 418 194"
              fill="none"
              stroke="rgba(230, 238, 250, 0.09)"
              strokeWidth="1.2"
              strokeDasharray="3 5"
            />

            {/* Main sculpted forged aluminum/titanium outer arch */}
            <path
              d="M 184 222 C 192 92, 434 78, 444 226"
              fill="none"
              stroke={`url(#band-${uid})`}
              strokeWidth="28"
              strokeLinecap="round"
            />
            {/* Outer 1px machined top specular edge */}
            <path
              d="M 182 216 C 194 82, 434 68, 446 218"
              fill="none"
              stroke={`url(#crown-spec-${uid})`}
              strokeWidth="1.6"
              strokeLinecap="round"
            />
            {/* Subtle engraved inner headband hairline */}
            <path
              d="M 196 218 C 206 102, 422 88, 432 222"
              fill="none"
              stroke={profile.metalStroke}
              strokeWidth="0.9"
            />

            {/* Right foreground articulated slider block + engraved scale ticks */}
            <rect
              x="426"
              y="206"
              width="28"
              height="48"
              rx="9"
              transform="rotate(-8 440 230)"
              fill={`url(#cup-bezel-${uid})`}
              stroke={profile.metalStroke}
              strokeWidth="1"
            />
            {/* Calibration notches */}
            <g stroke="rgba(232, 240, 252, 0.35)" strokeWidth="0.9">
              <line x1="433" y1="218" x2="442" y2="217" />
              <line x1="434" y1="226" x2="440" y2="225" />
              <line x1="435" y1="234" x2="444" y2="233" />
              <line x1="436" y1="242" x2="442" y2="241" />
            </g>

            {/* Foreground CNC yoke arm cradling the hero earcup */}
            <path
              d="M 438 250 C 446 274, 476 286, 488 338"
              fill="none"
              stroke={`url(#band-${uid})`}
              strokeWidth="12"
              strokeLinecap="round"
            />
            <path
              d="M 438 250 C 446 274, 476 286, 488 338"
              fill="none"
              stroke={profile.metalStroke}
              strokeWidth="1"
              strokeLinecap="round"
            />
            {/* Precision anodized gimbal pivot pin */}
            <circle
              cx="488"
              cy="346"
              r="11"
              fill={`url(#cup-bezel-${uid})`}
              stroke={profile.metalStroke}
              strokeWidth="1"
            />
            <circle cx="488" cy="346" r="4" fill={profile.driverRing} opacity="0.88" />
          </g>

          {/* ==========================================================
              FOREGROUND HERO: Transparent Dual Acoustic Chamber Earcup
              ========================================================== */}
          <g>
            {/* Contoured memory-foam earpad cushion (rear side of hero cup) */}
            <ellipse
              cx="354"
              cy="374"
              rx="108"
              ry="134"
              transform="rotate(-11 354 374)"
              fill={`url(#cushion-${uid})`}
              stroke="rgba(220, 230, 245, 0.16)"
              strokeWidth="1.1"
            />
            {/* Inner earpad acoustic seam */}
            <ellipse
              cx="342"
              cy="376"
              rx="92"
              ry="116"
              transform="rotate(-11 342 376)"
              fill="none"
              stroke="rgba(255, 255, 255, 0.06)"
              strokeWidth="1"
              strokeDasharray="2 4"
            />

            {/* Machined metallic outer chassis ring */}
            <ellipse
              cx="382"
              cy="368"
              rx="108"
              ry="132"
              transform="rotate(-11 382 368)"
              fill={`url(#cup-bezel-${uid})`}
              stroke={profile.metalStroke}
              strokeWidth="1.2"
            />

            {/* Subtle recessed dark-room inner chamber base */}
            <ellipse
              cx="386"
              cy="368"
              rx="94"
              ry="116"
              transform="rotate(-11 386 368)"
              fill="#11141B"
              stroke="rgba(228, 236, 248, 0.18)"
              strokeWidth="0.9"
            />

            {/* Internal Helmholtz resonance baffle ring & 12 acoustic vents */}
            <g transform="translate(386, 368) rotate(-11)">
              {/* Outer radial Helmholtz damping vents */}
              {Array.from({ length: 12 }).map((_, idx) => {
                const angle = (idx * 30 * Math.PI) / 180
                const rx = Math.cos(angle) * 76
                const ry = Math.sin(angle) * 94
                return (
                  <ellipse
                    key={idx}
                    cx={rx}
                    cy={ry}
                    rx="3.4"
                    ry="6.5"
                    transform={`rotate(${idx * 30} ${rx} ${ry})`}
                    fill="#0A0C10"
                    stroke="rgba(220, 232, 246, 0.14)"
                    strokeWidth="0.6"
                  />
                )
              })}

              {/* Secondary internal acoustic partition ring (Dual Chamber Wall) */}
              <ellipse
                cx="0"
                cy="0"
                rx="64"
                ry="80"
                fill="rgba(16, 20, 27, 0.9)"
                stroke="rgba(222, 232, 246, 0.2)"
                strokeWidth="1"
              />

              {/* Micro acoustic PCB / Spatial Engine IMU trace detail */}
              <path
                d="M -48 -36 L -34 -48 L 12 -48 M -52 12 L -36 28 L -14 28"
                fill="none"
                stroke={profile.driverRing}
                strokeOpacity="0.48"
                strokeWidth="0.9"
              />
              <rect
                x="-42"
                y="-54"
                width="14"
                height="10"
                rx="2"
                fill="#191E28"
                stroke={profile.driverRing}
                strokeOpacity="0.65"
                strokeWidth="0.7"
              />

              {/* 38 mm Beryllium Dynamic Transducer Core */}
              <ellipse
                cx="0"
                cy="0"
                rx="46"
                ry="57"
                fill={`url(#driver-${uid})`}
                stroke={profile.driverRing}
                strokeWidth="2.2"
                style={{ transition: 'stroke 550ms ease' }}
              />
              {/* Precision acoustic concentric diaphragm ribs */}
              <ellipse
                cx="0"
                cy="0"
                rx="35"
                ry="43"
                fill="none"
                stroke="rgba(232, 240, 250, 0.22)"
                strokeWidth="0.8"
              />
              <ellipse
                cx="0"
                cy="0"
                rx="24"
                ry="30"
                fill="none"
                stroke="rgba(232, 240, 250, 0.16)"
                strokeWidth="0.7"
              />
              {/* Center Beryllium acoustic phase dome */}
              <ellipse
                cx="-2"
                cy="-2"
                rx="14"
                ry="17"
                fill={`url(#cup-bezel-${uid})`}
                stroke={profile.driverRing}
                strokeOpacity="0.75"
                strokeWidth="1"
              />
              {/* Precision micro-dot center */}
              <circle cx="-2" cy="-2" r="2.8" fill={profile.driverRing} />

              {/* 4 CNC Torx fasteners holding the inner acoustic ring */}
              {[
                [-46, -58],
                [46, -58],
                [-46, 58],
                [46, 58],
              ].map(([fx, fy], i) => (
                <g key={i} transform={`translate(${fx}, ${fy})`}>
                  <circle
                    r="3.2"
                    fill="#262D3A"
                    stroke="rgba(232, 240, 252, 0.36)"
                    strokeWidth="0.7"
                  />
                  <line
                    x1="-1.5"
                    y1="0"
                    x2="1.5"
                    y2="0"
                    stroke="rgba(232, 240, 252, 0.45)"
                    strokeWidth="0.6"
                  />
                </g>
              ))}

              {/* Subtle precision typography engraved inside the chamber ring */}
              {!compact && (
                <text
                  x="0"
                  y="71"
                  textAnchor="middle"
                  fill="rgba(226, 234, 246, 0.42)"
                  fontSize="6.5"
                  letterSpacing="2.2"
                  fontFamily="var(--font-mono)"
                >
                  NOCTURNE · 38MM BERYLLIUM
                </text>
              )}
            </g>

            {/* ========================================================
                TRANSPARENT SAPPHIRE-GRADE DOME & CHROMATIC EDGE REFRACTION
                ======================================================== */}
            {/* Smoked transparent dome body */}
            <ellipse
              cx="386"
              cy="368"
              rx="94"
              ry="116"
              transform="rotate(-11 386 368)"
              fill={`url(#dome-${uid})`}
            />

            {/* Subtle chromatic dispersion: cool ice-silver edge shift */}
            <ellipse
              cx="385"
              cy="367"
              rx="94.5"
              ry="116.5"
              transform="rotate(-11 385 367)"
              fill="none"
              stroke={profile.chamberDispersionCool}
              strokeWidth="0.9"
              style={{ transition: 'stroke 550ms ease' }}
            />
            {/* Subtle chromatic dispersion: warm muted amber opposite edge shift */}
            <ellipse
              cx="387"
              cy="369"
              rx="94.5"
              ry="116.5"
              transform="rotate(-11 387 369)"
              fill="none"
              stroke={profile.chamberDispersionWarm}
              strokeWidth="0.8"
              style={{ transition: 'stroke 550ms ease' }}
            />

            {/* Crisp 1px top-left inner glass specular bevel arc */}
            <path
              d="M 314 316 C 328 264, 396 244, 444 282"
              fill="none"
              stroke="rgba(242, 247, 255, 0.56)"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <path
              d="M 326 446 C 362 486, 434 472, 464 416"
              fill="none"
              stroke="rgba(216, 228, 246, 0.18)"
              strokeWidth="1.1"
              strokeLinecap="round"
            />

            {/* Animated passing diagonal light sweep clipped to transparent dome */}
            <g clipPath={`url(#dome-clip-${uid})`}>
              <rect
                x="250"
                y="220"
                width="96"
                height="300"
                fill={`url(#sweep-${uid})`}
                className="anim-light-sweep"
              />
            </g>

            {/* Primary crisp dome outer rim */}
            <ellipse
              cx="386"
              cy="368"
              rx="94"
              ry="116"
              transform="rotate(-11 386 368)"
              fill="none"
              stroke={profile.chamberRim}
              strokeWidth="1.1"
              style={{ transition: 'stroke 550ms ease' }}
            />

            {/* Physical tactile rotary dial / volume crown on lower metallic rim */}
            <rect
              x="448"
              y="444"
              width="14"
              height="24"
              rx="4"
              transform="rotate(28 455 456)"
              fill={`url(#cup-bezel-${uid})`}
              stroke={profile.metalStroke}
              strokeWidth="0.9"
            />
          </g>
        </svg>
      </div>

      {/* Synchronized floating contact shadow beneath product */}
      <div
        aria-hidden="true"
        className={`${animateFloat ? 'anim-shadow-breathe' : ''} mx-auto -mt-6 h-7 w-[58%] rounded-full blur-xl transition-colors duration-700`}
        style={{
          background: `radial-gradient(ellipse at center, rgba(6, 8, 12, 0.85) 0%, ${profile.ambientSecondary} 48%, transparent 78%)`,
        }}
      />
    </div>
  )
})
