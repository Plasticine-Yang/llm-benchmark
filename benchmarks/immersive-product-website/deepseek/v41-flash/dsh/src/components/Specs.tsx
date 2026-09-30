import { useInView } from '../lib/hooks';

const GROUPS = [
  {
    key: 'A',
    title: '声学',
    en: 'ACOUSTICS',
    rows: [
      ['驱动单元', '38 mm 铍振膜动圈'],
      ['频率响应', '8 Hz – 40 kHz'],
      ['阻抗', '32 Ω'],
      ['总谐波失真', '< 0.02% · 1 kHz / 90 dB'],
    ],
  },
  {
    key: 'B',
    title: '无线',
    en: 'WIRELESS',
    rows: [
      ['蓝牙', 'Bluetooth 5.4'],
      ['编解码', 'LDAC / aptX Lossless / AAC / SBC'],
      ['多点连接', '同时保持 2 台设备在线'],
      ['空间音频', '个性化 HRTF + 头部动态追踪'],
    ],
  },
  {
    key: 'C',
    title: '电源',
    en: 'POWER',
    rows: [
      ['续航', '42 h（空间音频开启 34 h）'],
      ['快充', '10 min / 6 h'],
      ['完整充电', '1.5 h · USB-C'],
      ['待机', '180 h'],
    ],
  },
  {
    key: 'D',
    title: '物理',
    en: 'PHYSICAL',
    rows: [
      ['重量', '312 g'],
      ['麦克风', '6 麦克风阵列 + 骨传导拾音'],
      ['防护', 'IPX4 生活防水'],
      ['首发价', '¥3,499'],
    ],
  },
] as const;

/* A restrained orthographic line drawing with dimension call-outs. */
function TechDrawing() {
  return (
    <svg
      className="tech"
      viewBox="0 0 860 800"
      role="img"
      aria-label="NOCTURNE ONE 正视线稿与尺寸标注"
    >
      <g
        fill="none"
        stroke="rgba(206, 216, 230, 0.4)"
        strokeWidth="1.1"
        strokeLinecap="round"
      >
        {/* headband outline pair */}
        <path d="M 300 330 C 308 190, 522 152, 636 300" strokeWidth="1.4" />
        <path
          d="M 300 330 C 308 190, 522 152, 636 300"
          transform="translate(0 -23)"
          strokeOpacity="0.45"
        />
        <path
          d="M 300 330 C 308 190, 522 152, 636 300"
          transform="translate(0 23)"
          strokeOpacity="0.45"
          strokeDasharray="7 6"
        />
        {/* far earcup */}
        <rect x="208" y="336" width="184" height="224" rx="82" />
        <rect
          x="222"
          y="352"
          width="156"
          height="192"
          rx="70"
          strokeOpacity="0.4"
          strokeDasharray="6 6"
        />
        {/* near earcup */}
        <rect x="494" y="316" width="240" height="292" rx="106" strokeWidth="1.4" />
        <rect
          x="511"
          y="336"
          width="206"
          height="252"
          rx="92"
          strokeOpacity="0.55"
        />
        {/* centre lines */}
        <path
          d="M 430 120 L 430 690"
          strokeOpacity="0.16"
          strokeDasharray="14 5 3 5"
        />
        <path
          d="M 614 470 L 700 470"
          strokeOpacity="0.16"
          strokeDasharray="14 5 3 5"
        />
      </g>

      {/* driver annotation */}
      <g fill="none" stroke="var(--amber)" strokeOpacity="0.85" strokeWidth="1.2">
        <circle cx="614" cy="462" r="52" strokeDasharray="4 5" />
        <path d="M 614 462 L 726 396" />
        <circle cx="614" cy="462" r="2.4" fill="var(--amber-bright)" stroke="none" />
      </g>
      <text
        x="736"
        y="392"
        fill="var(--silver-200)"
        fontSize="15"
        letterSpacing="0.4"
        style={{ fontFamily: "'SF Mono', ui-monospace, Menlo, monospace" }}
      >
        ø 38 mm
      </text>

      {/* weight annotation */}
      <g fill="none" stroke="rgba(206,216,230,0.5)" strokeWidth="1">
        <path d="M 208 448 L 132 448" />
        <path d="M 132 430 L 132 466" />
        <path d="M 216 448 L 204 443 L 204 453 Z" fill="rgba(206,216,230,0.5)" />
      </g>
      <text
        x="118"
        y="436"
        textAnchor="end"
        fill="var(--silver-300)"
        fontSize="14"
        letterSpacing="0.4"
        style={{ fontFamily: "'SF Mono', ui-monospace, Menlo, monospace" }}
      >
        312 g
      </text>

      {/* battery annotation */}
      <g fill="none" stroke="rgba(206,216,230,0.5)" strokeWidth="1">
        <path d="M 734 560 L 782 626" />
        <circle cx="734" cy="560" r="2.2" fill="rgba(206,216,230,0.6)" stroke="none" />
      </g>
      <text
        x="788"
        y="636"
        fill="var(--silver-300)"
        fontSize="14"
        letterSpacing="0.4"
        style={{ fontFamily: "'SF Mono', ui-monospace, Menlo, monospace" }}
      >
        42 h
      </text>

      {/* ground reference */}
      <g stroke="rgba(206,216,230,0.22)" strokeWidth="1" strokeDasharray="10 8">
        <path d="M 150 676 L 810 676" />
      </g>
    </svg>
  );
}

export function Specs() {
  const [ref, shown] = useInView<HTMLElement>({ threshold: 0.1 });

  return (
    <section className="specs section" id="specs" ref={ref}>
      <div className="shell">
        <header className="specs__head">
          <div>
            <p className="t-eyebrow section__eyebrow reveal" data-shown={shown}>
              <span className="section__idx mono">05</span> 规格 / SPECIFICATIONS
            </p>
            <h2 className="t-h2 section__title reveal" data-shown={shown} data-delay="1">
              每个数字，
              <br />
              都测过三遍。
            </h2>
          </div>
          <p className="t-body specs__note reveal" data-shown={shown} data-delay="2">
            以下数据在 25 °C、50% 湿度、开启主动降噪与空间音频的条件下测得。
            续航随音量、编解码与空间音频状态浮动。
          </p>
        </header>

        <div className="specs__grid">
          <figure className="specs__figure reveal" data-shown={shown} data-delay="2">
            <TechDrawing />
            <figcaption className="mono">
              图 1 — 正视轮廓与关键标注 · 单位 mm
            </figcaption>
          </figure>

          <div className="specs__table">
            {GROUPS.map((g, gi) => (
              <div
                className="specs__group reveal"
                key={g.key}
                data-shown={shown}
                data-delay={String(Math.min(gi + 1, 4)) as '1'}
              >
                <h3 className="specs__group-head">
                  <span className="specs__group-key mono">{g.key}</span>
                  <span className="specs__group-cn">{g.title}</span>
                  <span className="specs__group-en mono">{g.en}</span>
                </h3>
                <dl className="specs__rows">
                  {g.rows.map(([k, v]) => (
                    <div className="spec-row" key={k}>
                      <dt className="spec-row__k mono">{k}</dt>
                      <dd className="spec-row__v">{v}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
