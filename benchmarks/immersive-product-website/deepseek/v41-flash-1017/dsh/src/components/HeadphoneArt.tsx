import { useId } from 'react'
import './HeadphoneArt.css'

export type HeadphoneTone = 'obsidian' | 'mist' | 'amber'

type HeadphoneArtProps = {
  tone?: HeadphoneTone
  className?: string
  ariaLabel?: string
  animated?: boolean
}

export function HeadphoneArt({
  tone = 'obsidian',
  className = '',
  ariaLabel = 'NOCTURNE ONE 空间音频耳机，悬浮正视结构',
  animated = true,
}: HeadphoneArtProps) {
  const rawId = useId()
  const uid = rawId.replace(/[^a-zA-Z0-9_-]/g, '')
  const ids = {
    band: `${uid}-band`,
    shell: `${uid}-shell`,
    cupFace: `${uid}-cup-face`,
    rim: `${uid}-rim`,
    pad: `${uid}-pad`,
    glass: `${uid}-glass`,
    glassDome: `${uid}-glass-dome`,
    accent: `${uid}-accent`,
    pivot: `${uid}-pivot`,
    driver: `${uid}-driver`,
    highlight: `${uid}-highlight`,
    sweep: `${uid}-sweep`,
    sweepMask: `${uid}-sweep-mask`,
    leftFaceClip: `${uid}-left-face-clip`,
    rightFaceClip: `${uid}-right-face-clip`,
    leftDriverClip: `${uid}-left-driver-clip`,
    rightDriverClip: `${uid}-right-driver-clip`,
    blur: `${uid}-blur`,
    soft: `${uid}-soft`,
  }

  const driverRays = Array.from({ length: 56 }, (_, index) => {
    const angle = (index / 56) * Math.PI * 2
    const inner = 61
    const outer = 84
    return {
      x1: Math.cos(angle) * inner,
      y1: Math.sin(angle) * inner,
      x2: Math.cos(angle) * outer,
      y2: Math.sin(angle) * outer,
      opacity: index % 4 === 0 ? 0.26 : 0.12,
    }
  })

  const coilDots = Array.from({ length: 12 }, (_, index) => {
    const angle = (index / 12) * Math.PI * 2
    return {
      cx: Math.cos(angle) * 41,
      cy: Math.sin(angle) * 52,
    }
  })

  return (
    <div className={`headphone-art tone-${tone} ${className}`} data-animated={animated}>
      <svg
        viewBox="0 0 840 840"
        role="img"
        aria-label={ariaLabel}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id={ids.band} x1="17%" y1="0%" x2="78%" y2="100%">
            <stop className="hp-stop-band-a" offset="0%" />
            <stop className="hp-stop-band-b" offset="38%" />
            <stop className="hp-stop-band-c" offset="78%" />
            <stop className="hp-stop-band-d" offset="100%" />
          </linearGradient>

          <linearGradient id={ids.shell} x1="18%" y1="2%" x2="88%" y2="96%">
            <stop className="hp-stop-shell-a" offset="0%" />
            <stop className="hp-stop-shell-b" offset="30%" />
            <stop className="hp-stop-shell-c" offset="72%" />
            <stop className="hp-stop-shell-d" offset="100%" />
          </linearGradient>

          <radialGradient id={ids.cupFace} cx="35%" cy="25%" r="82%">
            <stop className="hp-stop-face-a" offset="0%" />
            <stop className="hp-stop-face-b" offset="48%" />
            <stop className="hp-stop-face-c" offset="100%" />
          </radialGradient>

          <linearGradient id={ids.rim} x1="15%" y1="0%" x2="88%" y2="100%">
            <stop className="hp-stop-metal-light" offset="0%" />
            <stop className="hp-stop-metal-mid" offset="26%" />
            <stop className="hp-stop-metal-dark" offset="58%" />
            <stop className="hp-stop-metal-light" offset="88%" />
            <stop className="hp-stop-metal-mid" offset="100%" />
          </linearGradient>

          <linearGradient id={ids.pad} x1="20%" y1="0%" x2="78%" y2="100%">
            <stop className="hp-stop-pad-a" offset="0%" />
            <stop className="hp-stop-pad-b" offset="36%" />
            <stop className="hp-stop-pad-c" offset="100%" />
          </linearGradient>

          <radialGradient id={ids.glass} cx="36%" cy="28%" r="74%">
            <stop className="hp-stop-glass-a" offset="0%" />
            <stop className="hp-stop-glass-b" offset="46%" />
            <stop className="hp-stop-glass-c" offset="100%" />
          </radialGradient>

          <radialGradient id={ids.glassDome} cx="38%" cy="30%" r="67%">
            <stop stopColor="#ffffff" stopOpacity=".16" offset="0%" />
            <stop stopColor="#cddbd7" stopOpacity=".035" offset="50%" />
            <stop stopColor="#040505" stopOpacity=".34" offset="100%" />
          </radialGradient>

          <linearGradient id={ids.accent} x1="20%" y1="0%" x2="80%" y2="100%">
            <stop className="hp-stop-accent-a" offset="0%" />
            <stop className="hp-stop-accent-b" offset="48%" />
            <stop className="hp-stop-accent-c" offset="100%" />
          </linearGradient>

          <linearGradient id={ids.pivot} x1="15%" y1="0%" x2="86%" y2="100%">
            <stop className="hp-stop-metal-light" offset="0%" />
            <stop className="hp-stop-metal-mid" offset="34%" />
            <stop className="hp-stop-metal-dark" offset="70%" />
            <stop className="hp-stop-metal-mid" offset="100%" />
          </linearGradient>

          <radialGradient id={ids.driver} cx="34%" cy="24%" r="82%">
            <stop className="hp-stop-driver-a" offset="0%" />
            <stop className="hp-stop-driver-b" offset="54%" />
            <stop className="hp-stop-driver-c" offset="100%" />
          </radialGradient>

          <linearGradient id={ids.highlight} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop stopColor="#ffffff" stopOpacity=".65" offset="0%" />
            <stop stopColor="#ffffff" stopOpacity=".16" offset="46%" />
            <stop stopColor="#ffffff" stopOpacity="0" offset="100%" />
          </linearGradient>

          <linearGradient id={ids.sweep} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop stopColor="#fff" stopOpacity="0" offset="0%" />
            <stop stopColor="#e9f3f0" stopOpacity=".13" offset="42%" />
            <stop stopColor="#fff6ea" stopOpacity=".3" offset="52%" />
            <stop stopColor="#e9f3f0" stopOpacity=".1" offset="64%" />
            <stop stopColor="#fff" stopOpacity="0" offset="100%" />
          </linearGradient>

          <clipPath id={ids.leftFaceClip}>
            <ellipse cx="278" cy="530" rx="110" ry="133" transform="rotate(-6 278 530)" />
          </clipPath>
          <clipPath id={ids.rightFaceClip}>
            <ellipse cx="562" cy="520" rx="102" ry="123" transform="rotate(7 562 520)" />
          </clipPath>
          <clipPath id={ids.leftDriverClip}>
            <ellipse cx="278" cy="530" rx="78" ry="98" transform="rotate(-6 278 530)" />
          </clipPath>
          <clipPath id={ids.rightDriverClip}>
            <ellipse cx="562" cy="520" rx="72" ry="90" transform="rotate(7 562 520)" />
          </clipPath>

          <mask id={ids.sweepMask} maskUnits="userSpaceOnUse" x="0" y="0" width="840" height="840">
            <path
              d="M218 380 C224 230 310 140 420 140 C530 140 616 230 622 380 L572 380 C568 265 510 196 420 196 C330 196 272 265 268 380 Z"
              fill="#fff"
            />
            <ellipse cx="278" cy="530" rx="148" ry="169" fill="#fff" />
            <ellipse cx="562" cy="520" rx="140" ry="160" fill="#fff" />
            <path d="M226 362 C204 393 198 430 206 468" fill="none" stroke="#fff" strokeWidth="18" />
            <path d="M614 362 C636 393 642 430 634 468" fill="none" stroke="#fff" strokeWidth="18" />
          </mask>

          <filter id={ids.blur} x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="21" />
          </filter>
          <filter id={ids.soft} x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="22" stdDeviation="18" floodColor="#000" floodOpacity=".48" />
          </filter>
        </defs>

        <g className="hp-world">
          <ellipse
            className="hp-ambient-shadow"
            cx="420"
            cy="717"
            rx="234"
            ry="33"
            fill="#000"
            opacity=".55"
            filter={`url(#${ids.blur})`}
          />

          {/* Titanium suspension band */}
          <g className="hp-part hp-band">
            <path
              className="hp-band-body"
              d="M218 380 C224 230 310 140 420 140 C530 140 616 230 622 380 L572 380 C568 265 510 196 420 196 C330 196 272 265 268 380 Z"
              fill={`url(#${ids.band})`}
              stroke="rgba(240,244,239,.21)"
              strokeWidth="1"
            />
            <path
              className="hp-band-inner-light"
              d="M268 380 C272 265 330 196 420 196 C510 196 568 265 572 380"
              fill="none"
              stroke="rgba(0,0,0,.48)"
              strokeWidth="5"
            />
            <path
              d="M234 360 C241 248 308 167 410 159 C518 151 591 240 606 358"
              fill="none"
              stroke={`url(#${ids.highlight})`}
              strokeWidth="1.4"
              opacity=".7"
            />
            <path
              d="M316 152 C367 130 471 130 523 152"
              fill="none"
              stroke="rgba(255,255,255,.17)"
              strokeWidth="1"
              strokeLinecap="round"
            />

            <path
              className="hp-cushion"
              d="M285 381 C288 279 344 218 420 218 C496 218 552 279 555 381"
              fill="none"
              stroke={`url(#${ids.pad})`}
              strokeWidth="31"
              strokeLinecap="round"
            />
            <path
              className="hp-cushion-stitch"
              d="M294 373 C298 285 348 231 420 231 C492 231 542 285 546 373"
              fill="none"
              stroke="rgba(205,188,161,.24)"
              strokeWidth=".85"
              strokeDasharray="1.5 5"
              strokeLinecap="round"
            />

            <text
              x="420"
              y="178"
              textAnchor="middle"
              className="hp-wordmark"
              fill="rgba(237,240,235,.62)"
            >
              NOCTURNE
            </text>
            <circle cx="576" cy="321" r="2.1" fill="var(--hp-accent)" opacity=".8" />

            {/* Outboard fork arms */}
            <g className="hp-yokes" fill="none" strokeLinecap="round">
              <path
                d="M225 361 C200 392 195 430 206 469"
                stroke={`url(#${ids.pivot})`}
                strokeWidth="16"
              />
              <path
                d="M221 366 C205 395 202 426 210 454"
                stroke="rgba(255,255,255,.17)"
                strokeWidth="1.1"
              />
              <path
                d="M615 361 C640 392 645 430 634 469"
                stroke={`url(#${ids.pivot})`}
                strokeWidth="16"
              />
              <path
                d="M619 366 C635 395 638 426 630 454"
                stroke="rgba(255,255,255,.13)"
                strokeWidth="1.1"
              />
            </g>
          </g>

          {/* Right earcup, seen at a slightly shallower angle */}
          <g className="hp-part hp-cup hp-cup--right">
            <g transform="rotate(7 562 520)">
              <ellipse cx="562" cy="533" rx="143" ry="161" fill={`url(#${ids.pad})`} />
              <ellipse
                cx="562"
                cy="532"
                rx="137"
                ry="154"
                fill="none"
                stroke="rgba(216,198,172,.2)"
                strokeWidth=".85"
                strokeDasharray="1.4 6.5"
              />
              <ellipse
                className="hp-shell"
                cx="562"
                cy="520"
                rx="129"
                ry="148"
                fill={`url(#${ids.shell})`}
                stroke="rgba(244,246,240,.26)"
                strokeWidth="1.1"
              />
              <path
                d="M453 471 C467 409 512 378 564 376 C603 375 644 394 669 433"
                fill="none"
                stroke="rgba(255,255,255,.16)"
                strokeWidth="2.1"
                strokeLinecap="round"
              />
              <ellipse
                cx="562"
                cy="520"
                rx="116"
                ry="134"
                fill="none"
                stroke={`url(#${ids.rim})`}
                strokeWidth="4.2"
              />
              <ellipse
                cx="562"
                cy="520"
                rx="108"
                ry="126"
                fill={`url(#${ids.cupFace})`}
                stroke="rgba(3,4,4,.7)"
                strokeWidth="5"
              />
              <ellipse cx="562" cy="520" rx="102" ry="123" fill={`url(#${ids.glass})`} opacity=".42" />

              <g className="hp-part hp-chamber hp-chamber--right">
                <ellipse
                  cx="562"
                  cy="520"
                  rx="91"
                  ry="108"
                  fill="none"
                  stroke={`url(#${ids.rim})`}
                  strokeWidth="2.1"
                  opacity=".84"
                />
                <ellipse
                  cx="562"
                  cy="520"
                  rx="85"
                  ry="102"
                  fill="#080a0a"
                  fillOpacity=".73"
                  stroke="rgba(227,236,231,.15)"
                  strokeWidth=".8"
                />
                <g clipPath={`url(#${ids.rightDriverClip})`}>
                  <ellipse cx="562" cy="520" rx="72" ry="90" fill={`url(#${ids.driver})`} />
                  <g transform="translate(562 520)">
                    {driverRays.map((ray, index) => (
                      <line
                        key={index}
                        x1={ray.x1}
                        y1={ray.y1}
                        x2={ray.x2}
                        y2={ray.y2}
                        stroke="#cfd9d2"
                        strokeWidth=".55"
                        opacity={ray.opacity}
                      />
                    ))}
                    <circle r="63" fill="none" stroke="rgba(222,232,226,.16)" strokeWidth=".7" />
                    <ellipse
                      rx="49"
                      ry="63"
                      fill="none"
                      stroke={`url(#${ids.accent})`}
                      strokeWidth="1.4"
                      opacity=".88"
                    />
                    <ellipse rx="35" ry="46" fill="rgba(5,6,6,.74)" stroke="rgba(232,239,234,.17)" strokeWidth=".7" />
                    <ellipse rx="12" ry="17" fill="rgba(201,156,111,.18)" stroke="var(--hp-accent)" strokeWidth=".9" />
                  </g>
                  <path
                    d="M480 470 C498 430 532 408 579 406"
                    fill="none"
                    stroke="rgba(255,255,255,.23)"
                    strokeWidth="10"
                    opacity=".48"
                  />
                </g>
              </g>
              <ellipse cx="562" cy="520" rx="110" ry="130" fill={`url(#${ids.glassDome})`} opacity=".45" />
              <g clipPath={`url(#${ids.rightFaceClip})`} opacity=".85">
                <path
                  d="M463 503 C481 447 528 407 586 399"
                  fill="none"
                  stroke={`url(#${ids.highlight})`}
                  strokeWidth="6"
                  opacity=".4"
                />
                <path
                  d="M492 618 C543 634 609 614 647 565"
                  fill="none"
                  stroke="rgba(212,225,219,.16)"
                  strokeWidth="1.2"
                />
              </g>
              <path
                d="M563 654 a22 22 0 0 0 44 0"
                fill="none"
                stroke="rgba(255,255,255,.12)"
                strokeWidth=".8"
              />
            </g>
          </g>

          {/* Left earcup, front plane */}
          <g className="hp-part hp-cup hp-cup--left">
            <g transform="rotate(-6 278 530)">
              <ellipse
                cx="278"
                cy="544"
                rx="152"
                ry="171"
                fill="#020303"
                opacity=".55"
                filter={`url(#${ids.blur})`}
              />
              <ellipse cx="278" cy="533" rx="150" ry="170" fill={`url(#${ids.pad})`} />
              <ellipse
                cx="278"
                cy="532"
                rx="143"
                ry="163"
                fill="none"
                stroke="rgba(216,198,172,.23)"
                strokeWidth=".9"
                strokeDasharray="1.5 7"
              />
              <ellipse cx="278" cy="530" rx="124" ry="140" fill="none" stroke="rgba(0,0,0,.4)" strokeWidth="7" />
              <ellipse
                className="hp-shell"
                cx="278"
                cy="530"
                rx="137"
                ry="156"
                fill={`url(#${ids.shell})`}
                stroke="rgba(247,249,244,.3)"
                strokeWidth="1.2"
                filter={`url(#${ids.soft})`}
              />
              <path
                d="M157 476 C174 405 225 370 288 368 C347 367 397 397 422 449"
                fill="none"
                stroke="rgba(255,255,255,.19)"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
              <path
                d="M408 604 C390 638 353 668 312 676"
                fill="none"
                stroke="rgba(0,0,0,.4)"
                strokeWidth="9"
                strokeLinecap="round"
                opacity=".6"
              />

              <ellipse
                cx="278"
                cy="530"
                rx="124"
                ry="146"
                fill="none"
                stroke={`url(#${ids.rim})`}
                strokeWidth="5.2"
              />
              <ellipse
                cx="278"
                cy="530"
                rx="117"
                ry="139"
                fill="none"
                stroke="rgba(3,4,4,.9)"
                strokeWidth="2"
              />
              <ellipse
                cx="278"
                cy="530"
                rx="112"
                ry="134"
                fill={`url(#${ids.cupFace})`}
                stroke="rgba(2,3,3,.82)"
                strokeWidth="4.5"
              />
              <ellipse cx="278" cy="530" rx="110" ry="133" fill={`url(#${ids.glass})`} opacity=".56" />

              <g className="hp-part hp-chamber hp-chamber--left">
                <ellipse
                  cx="278"
                  cy="530"
                  rx="99"
                  ry="119"
                  fill="rgba(4,5,5,.22)"
                  stroke={`url(#${ids.rim})`}
                  strokeWidth="2.4"
                />
                <ellipse
                  cx="278"
                  cy="530"
                  rx="93"
                  ry="112"
                  fill="#070909"
                  fillOpacity=".8"
                  stroke="rgba(230,239,233,.18)"
                  strokeWidth=".9"
                />
                <g clipPath={`url(#${ids.leftDriverClip})`}>
                  <ellipse cx="278" cy="530" rx="78" ry="98" fill={`url(#${ids.driver})`} />
                  <g transform="translate(278 530)">
                    {driverRays.map((ray, index) => (
                      <line
                        key={index}
                        x1={ray.x1}
                        y1={ray.y1}
                        x2={ray.x2}
                        y2={ray.y2}
                        stroke="#d3ded7"
                        strokeWidth=".6"
                        opacity={ray.opacity + 0.03}
                      />
                    ))}
                    <circle r="83" fill="none" stroke="rgba(232,240,234,.18)" strokeWidth=".75" />
                    <ellipse
                      rx="54"
                      ry="69"
                      fill="none"
                      stroke={`url(#${ids.accent})`}
                      strokeWidth="1.55"
                      opacity=".93"
                    />
                    {coilDots.map((dot, index) => (
                      <circle
                        key={index}
                        cx={dot.cx}
                        cy={dot.cy}
                        r=".95"
                        fill="var(--hp-accent)"
                        opacity=".72"
                      />
                    ))}
                    <ellipse
                      rx="38"
                      ry="50"
                      fill="rgba(5,6,6,.76)"
                      stroke="rgba(233,241,235,.2)"
                      strokeWidth=".8"
                    />
                    <ellipse
                      rx="14"
                      ry="19"
                      fill="rgba(201,156,111,.18)"
                      stroke="var(--hp-accent)"
                      strokeWidth="1"
                    />
                    <circle r="2.2" fill="var(--hp-accent)" opacity=".8" />
                  </g>
                  <path
                    d="M191 481 C207 433 243 402 290 391"
                    fill="none"
                    stroke="rgba(255,255,255,.28)"
                    strokeWidth="12"
                    opacity=".5"
                  />
                  <path
                    d="M361 572 C347 612 316 641 279 649"
                    fill="none"
                    stroke="rgba(195,150,102,.13)"
                    strokeWidth="16"
                  />
                </g>
                <ellipse cx="278" cy="530" rx="84" ry="104" fill="none" stroke="rgba(238,244,239,.16)" strokeWidth=".9" />
                <path
                  d="M242 643 a36 36 0 0 0 72 0"
                  fill="none"
                  stroke="rgba(230,239,233,.18)"
                  strokeWidth=".7"
                />
                <text x="278" y="651" textAnchor="middle" className="hp-chamber-label" fill="rgba(220,229,222,.45)">
                  38 MM · Be
                </text>
              </g>

              <ellipse cx="278" cy="530" rx="111" ry="134" fill={`url(#${ids.glassDome})`} opacity=".6" />
              <g clipPath={`url(#${ids.leftFaceClip})`} opacity=".92">
                <path
                  d="M168 506 C183 445 234 399 296 389"
                  fill="none"
                  stroke={`url(#${ids.highlight})`}
                  strokeWidth="7"
                  opacity=".48"
                />
                <path
                  d="M408 547 C409 593 390 629 355 652"
                  fill="none"
                  stroke="rgba(233,242,236,.16)"
                  strokeWidth="1.3"
                />
                <path
                  d="M182 583 C218 632 276 656 332 644"
                  fill="none"
                  stroke="rgba(227,237,231,.11)"
                  strokeWidth="1"
                />
              </g>

              <text x="278" y="695" textAnchor="middle" className="hp-serial" fill="rgba(233,238,233,.44)">
                N° 001 / NOCTURNE
              </text>
            </g>
          </g>

          {/* Pivot caps visually tie the cups back to the band */}
          <g className="hp-pivots">
            <g>
              <path
                d="M239 351 C239 364 240 375 244 384"
                stroke={`url(#${ids.pivot})`}
                strokeWidth="13"
                strokeLinecap="round"
                fill="none"
              />
              <circle cx="245" cy="390" r="17.5" fill={`url(#${ids.pivot})`} stroke="rgba(255,255,255,.25)" strokeWidth=".8" />
              <circle cx="245" cy="390" r="10.5" fill="#161a1a" stroke="rgba(255,255,255,.16)" strokeWidth=".6" />
              <path d="M240 390h10" stroke="rgba(233,240,234,.45)" strokeWidth=".8" strokeLinecap="round" />
              <circle cx="245" cy="390" r="2.6" fill="var(--hp-accent)" opacity=".75" />
            </g>
            <g>
              <path
                d="M601 351 C601 364 600 375 596 384"
                stroke={`url(#${ids.pivot})`}
                strokeWidth="13"
                strokeLinecap="round"
                fill="none"
              />
              <circle cx="595" cy="390" r="16.5" fill={`url(#${ids.pivot})`} stroke="rgba(255,255,255,.21)" strokeWidth=".8" />
              <circle cx="595" cy="390" r="9.5" fill="#161a1a" stroke="rgba(255,255,255,.14)" strokeWidth=".6" />
              <path d="M590 390h10" stroke="rgba(233,240,234,.4)" strokeWidth=".8" strokeLinecap="round" />
              <circle cx="595" cy="390" r="2.4" fill="var(--hp-accent)" opacity=".68" />
            </g>
          </g>

          <g className="hp-sweep" mask={`url(#${ids.sweepMask})`} transform="rotate(16 420 420)">
            <g className="hp-sweep-motion">
              <rect x="-380" y="-220" width="170" height="1280" fill={`url(#${ids.sweep})`} />
            </g>
          </g>
        </g>
      </svg>
    </div>
  )
}
