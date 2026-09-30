import { memo, useId } from "react";

export const Headphones = memo(function Headphones({
  className = "",
  exploded = 0,
}: {
  className?: string;
  exploded?: number;
}) {
  const id = useId().replace(/:/g, "");
  const g = (name: string) => `url(#${id}-${name})`;
  return (
    <svg
      className={`headphones ${className} exploded-${exploded}`}
      viewBox="0 0 620 660"
      role="img"
      aria-label="NOCTURNE ONE：冰银金属头梁与透明双腔体耳机"
    >
      <defs>
        <linearGradient id={`${id}-metal`} x1="0" y1="0" x2="1" y2=".5">
          <stop stopColor="#eeeff0" />
          <stop offset=".18" stopColor="#aaabac" />
          <stop offset=".4" stopColor="var(--product-metal, #a6a7a8)" />
          <stop offset=".55" stopColor="#e9eaeb" />
          <stop offset=".72" stopColor="var(--product-dark, #595a5b)" />
          <stop offset="1" stopColor="#232b2d" />
        </linearGradient>
        <linearGradient id={`${id}-edge`} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#f1f2f3" />
          <stop offset=".23" stopColor="#6e7c7e" />
          <stop offset=".5" stopColor="#d4d5d6" />
          <stop offset=".73" stopColor="#343e40" />
          <stop offset="1" stopColor="#c0c1c2" />
        </linearGradient>
        <linearGradient id={`${id}-glass`} x1="0" y1="0" x2=".9" y2="1">
          <stop stopColor="#dddedf" stopOpacity=".52" />
          <stop offset=".26" stopColor="#909192" stopOpacity=".12" />
          <stop offset=".52" stopColor="#bbbcbd" stopOpacity=".24" />
          <stop offset="1" stopColor="#2c2d2e" stopOpacity=".76" />
        </linearGradient>
        <linearGradient id={`${id}-reflection`} x1="0" y1="0" x2="1" y2=".5">
          <stop stopColor="white" stopOpacity="0" />
          <stop offset=".4" stopColor="white" stopOpacity="0" />
          <stop offset=".48" stopColor="#eeeff0" stopOpacity=".3" />
          <stop offset=".55" stopColor="white" stopOpacity="0" />
          <stop offset="1" stopColor="white" stopOpacity="0" />
        </linearGradient>
        <radialGradient id={`${id}-leather`} cx=".3" cy=".22" r=".8">
          <stop stopColor="#4f5051" />
          <stop offset=".45" stopColor="#252b2c" />
          <stop offset=".85" stopColor="#14191a" />
          <stop offset="1" stopColor="#434445" />
        </radialGradient>
        <radialGradient id={`${id}-driver`} cx=".4" cy=".3">
          <stop stopColor="#78797a" />
          <stop offset=".35" stopColor="#2d2e2f" />
          <stop offset=".73" stopColor="#171819" />
          <stop offset="1" stopColor="#707172" />
        </radialGradient>
        <pattern
          id={`${id}-mesh`}
          width="5"
          height="5"
          patternUnits="userSpaceOnUse"
        >
          <circle cx="2" cy="2" r=".7" fill="#acadae" opacity=".33" />
        </pattern>
        <filter
          id={`${id}-shadow`}
          x="-50%"
          y="-40%"
          width="200%"
          height="200%"
        >
          <feDropShadow
            dx="8"
            dy="16"
            stdDeviation="13"
            floodColor="#0b1011"
            floodOpacity=".7"
          />
        </filter>
        <filter id={`${id}-soft`}>
          <feGaussianBlur stdDeviation="1.2" />
        </filter>
      </defs>
      <g className="band-part" filter={g("shadow")}>
        <path
          d="M153 348C102 228 107 105 216 68C343 21 480 91 482 262L477 332"
          fill="none"
          stroke="#101719"
          strokeWidth="42"
        />
        <path
          d="M143 330C106 223 120 113 220 77C344 33 466 100 467 270L466 319"
          fill="none"
          stroke={g("metal")}
          strokeWidth="29"
        />
        <path
          d="M129 290C102 180 151 95 227 70C357 29 485 112 483 270"
          fill="none"
          stroke="#dddedf"
          strokeWidth="2"
          opacity=".76"
        />
        <path
          d="M163 291C136 189 161 127 234 103C337 68 434 123 437 252"
          fill="none"
          stroke={g("leather")}
          strokeWidth="22"
        />
        <path
          d="M174 231C164 161 204 117 263 111"
          fill="none"
          stroke="#8c8d8e"
          strokeWidth="1"
          opacity=".35"
        />
        <path
          d="m139 296 22 66M466 270l-5 95"
          stroke={g("edge")}
          strokeWidth="18"
          strokeLinecap="round"
        />
        <path
          d="m145 301 18 55M472 279l-5 54"
          stroke="#d9dadb"
          strokeWidth="2"
          opacity=".8"
        />
        <text
          x="252"
          y="69"
          transform="rotate(7 252 69)"
          fontSize="9"
          letterSpacing="3"
          fill="#4c4d4e"
          fontFamily="Outfit, sans-serif"
        >
          NOCTURNE
        </text>
      </g>
      <g
        className="rear-cup"
        transform="rotate(-17 176 396)"
        filter={g("shadow")}
      >
        <ellipse cx="173" cy="396" rx="70" ry="112" fill={g("edge")} />
        <ellipse cx="166" cy="396" rx="65" ry="105" fill={g("leather")} />
        <ellipse
          cx="162"
          cy="396"
          rx="44"
          ry="82"
          fill="#11191a"
          stroke="#6e6f70"
          strokeWidth="1.5"
        />
        <ellipse
          cx="162"
          cy="396"
          rx="32"
          ry="68"
          fill={g("mesh")}
          opacity=".7"
        />
        <path
          d="M139 299c-34 28-47 108-19 160"
          stroke="#bbbcbd"
          strokeWidth="1.2"
          fill="none"
          opacity=".6"
        />
        <rect x="181" y="490" width="17" height="4" rx="2" fill="#161718" />
      </g>
      <g transform="rotate(-17 414 410)">
        <g className="cushion-part" filter={g("shadow")}>
          <ellipse cx="392" cy="413" rx="105" ry="144" fill={g("leather")} />
          <ellipse
            cx="390"
            cy="413"
            rx="84"
            ry="120"
            fill="#1b1c1d"
            stroke="#606162"
            strokeWidth="2"
          />
          <path
            d="M335 299c-36 38-48 105-29 171"
            fill="none"
            stroke="#9d9e9f"
            strokeWidth="1"
            opacity=".6"
          />
        </g>
        <g className="driver-part" filter={g("shadow")}>
          <ellipse
            cx="420"
            cy="410"
            rx="105"
            ry="142"
            fill={g("metal")}
            stroke={g("edge")}
            strokeWidth="2"
          />
          <ellipse
            cx="424"
            cy="408"
            rx="97"
            ry="132"
            fill="#222324"
            stroke="#bdbebf"
            strokeWidth="1"
          />
          <ellipse
            cx="424"
            cy="408"
            rx="88"
            ry="121"
            fill="#2c2d2e"
            stroke="#757677"
            strokeWidth="2"
          />
          <path
            d="M371 325h30v20h38v-22h34M352 397h29v43h-26M472 395h24v36h-24M374 484h23v-16h52v19h26"
            fill="none"
            stroke="#9d9780"
            strokeWidth="1.3"
            opacity=".8"
          />
          <path
            d="M364 348h18v13h-23M468 355h14v17M387 494v-16M451 487v13"
            fill="none"
            stroke="#b5b6b7"
            strokeWidth="3"
            opacity=".5"
          />
          <ellipse
            cx="425"
            cy="411"
            rx="64"
            ry="85"
            fill={g("driver")}
            stroke="#959697"
            strokeWidth="2"
          />
          {[56, 49, 42, 35, 28].map((r, i) => (
            <ellipse
              key={r}
              cx="425"
              cy="411"
              rx={r}
              ry={r * 1.31}
              fill="none"
              stroke={i % 2 ? "#7e7f80" : "#141516"}
              strokeWidth={i % 2 ? 1 : 4}
              opacity=".65"
            />
          ))}
          <ellipse cx="425" cy="411" rx="53" ry="70" fill={g("mesh")} />
          <ellipse
            cx="425"
            cy="411"
            rx="22"
            ry="30"
            fill={g("metal")}
            stroke="#abacad"
            strokeWidth="1"
          />
          <ellipse cx="425" cy="411" rx="17" ry="24" fill="#5d5e5f" />
          <path
            d="m385 333 3 11m72-5-5 9m-97 84 11-1m97 50-5-7"
            stroke="#d3cbb3"
            strokeWidth="4"
          />
          {[
            [403, 294],
            [488, 366],
            [443, 520],
            [351, 440],
          ].map(([x, y]) => (
            <g key={x}>
              <circle cx={x} cy={y} r="3" fill="#cecfd0" />
              <path d={`M${x - 1.5} ${y}h3`} stroke="#434445" strokeWidth="1" />
            </g>
          ))}
        </g>
        <g className="glass-part">
          <ellipse
            cx="433"
            cy="406"
            rx="96"
            ry="130"
            fill={g("glass")}
            stroke={g("edge")}
            strokeWidth="2"
          />
          <ellipse
            cx="434"
            cy="405"
            rx="90"
            ry="124"
            fill={g("reflection")}
            stroke="#dfe0e1"
            strokeOpacity=".16"
          />
          <path
            d="M383 303c-24 19-38 52-41 78M476 507c25-29 43-72 43-107"
            fill="none"
            stroke="#eff0f1"
            strokeWidth="2"
            opacity=".75"
          />
          <path
            d="M382 312c-21 20-31 41-34 62"
            fill="none"
            stroke="#cecfd0"
            strokeWidth="5"
            opacity=".13"
            filter={g("soft")}
          />
          <text
            x="406"
            y="490"
            fontSize="8"
            letterSpacing="2.2"
            fill="#d3d4d5"
            fontFamily="Outfit, sans-serif"
          >
            N / 01
          </text>
          <path d="M405 505h35" stroke="#c6c7c8" opacity=".5" />
        </g>
      </g>
    </svg>
  );
});
