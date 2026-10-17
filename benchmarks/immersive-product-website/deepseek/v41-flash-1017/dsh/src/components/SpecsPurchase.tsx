import type { MouseEvent } from 'react'
import { MagneticButton } from './MagneticButton'
import { ArrowUpRight } from './Icons'
import './SpecsPurchase.css'

type SpecsPurchaseProps = {
  onReserve: (event?: MouseEvent<HTMLButtonElement>) => void
}

const highlights = [
  { label: '重量', value: '312', unit: 'g', note: '含记忆棉耳垫', wide: false },
  { label: '无线连接', value: '5.4', unit: 'Bluetooth', note: 'LE Audio / 多点连接', wide: false },
  { label: '续航', value: '42', unit: 'h', note: '主动降噪开启', wide: false, featured: true },
  { label: '快充', value: '10', unit: 'min', note: '可播放 6 h', wide: true },
]

const specs = [
  ['声学架构', '透明双腔体 · 封闭式', '左右独立阻尼腔'],
  ['驱动单元', '38 mm 铍振膜', '悬浮式内磁路'],
  ['频率响应', '5 Hz – 40 kHz', '±3 dB 工程实测'],
  ['阻抗', '32 Ω', '1 kHz / 1 mW'],
  ['蓝牙', 'Bluetooth 5.4', 'LE Audio / 双设备'],
  ['编解码', 'LDAC · aptX Lossless', '同时支持 AAC / SBC'],
  ['空间音频', '个性化 HRTF', '动态头部追踪 / 1,000 Hz'],
  ['续航', '42 h', 'ANC 开启 / 60 h 关闭'],
  ['充电', 'USB-C · 10 min / 6 h', '完整充电约 1.8 h'],
  ['重量', '312 g', '不含线材'],
  ['随附', '硬质旅行盒 · USB-C 线 · 3.5 mm 线', '两个磁吸耳垫'],
]

export function SpecsPurchase({ onReserve }: SpecsPurchaseProps) {
  return (
    <>
      <section id="specs" className="specs" aria-labelledby="specs-title">
        <div className="specs__grain" aria-hidden="true" />
        <div className="specs__inner shell">
          <header className="specs__header">
            <div className="specs__topline" data-reveal>
              <span className="specs__index mono">05 / 工程规格</span>
              <span className="specs__doc-code mono">NOCTURNE ONE — SPEC SHEET / REV. 03</span>
            </div>
            <div className="specs__header-grid">
              <h2 className="specs__title" id="specs-title" data-reveal data-reveal-delay="0.08">
                每一项数字，
                <br />
                都听得见。
              </h2>
              <div className="specs__header-side" data-reveal data-reveal-delay="0.16">
                <p>
                  参数不是终点，而是声音抵达耳朵之前必须经过的每一道关。所有数据来自在柏林完成的工程样机实测。
                </p>
                <div className="specs__header-mark">
                  <span className="mono">DESIGNED TO BE MEASURED</span>
                  <span className="specs__header-rule" aria-hidden="true" />
                  <span className="mono">52.5200° N</span>
                </div>
              </div>
            </div>
          </header>

          <div className="specs__highlights" data-reveal data-reveal-delay="0.08">
            {highlights.map((item) => (
              <div
                key={item.label}
                className={`specs__highlight${item.wide ? ' specs__highlight--wide' : ''}`}
                data-featured={item.featured ? 'true' : undefined}
              >
                <span className="specs__highlight-label">{item.label}</span>
                <div className="specs__highlight-value">
                  <strong>{item.value}</strong>
                  <span>{item.unit}</span>
                  {item.wide ? (
                    <>
                      <i aria-hidden="true">/</i>
                      <strong>6</strong>
                      <span>h</span>
                    </>
                  ) : null}
                </div>
                <p>{item.note}</p>
              </div>
            ))}
          </div>

          <div className="specs__details">
            <aside className="specs__aside" data-reveal>
              <div className="specs__aside-figure" aria-hidden="true">
                <span className="specs__aside-orbit specs__aside-orbit--outer" />
                <span className="specs__aside-orbit specs__aside-orbit--inner" />
                <span className="specs__aside-figure-number">38</span>
                <span className="specs__aside-figure-unit mono">mm</span>
                <span className="specs__aside-figure-axis" />
                <span className="specs__aside-figure-dot" />
              </div>
              <p className="specs__aside-note">
                测量条件：1 kHz / 94 dB SPL / LDAC / 主动降噪开启。续航数据基于 50% 音量，环境温度 23 °C。
              </p>
              <p className="specs__aside-foot mono">SPECIFICATIONS / 2026.10</p>
            </aside>

            <dl className="specs__table">
              {specs.map(([label, value, note], index) => (
                <div className="specs__row" key={label} data-reveal data-reveal-delay={`${0.02 + index * 0.015}`}>
                  <dt>
                    <span className="mono">{String(index + 1).padStart(2, '0')}</span>
                    {label}
                  </dt>
                  <dd>{value}</dd>
                  <dd className="specs__row-note">{note}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="specs__footnote" data-reveal>
            <span className="mono">ALL NUMBERS ARE ENGINEERING SAMPLE RESULTS</span>
            <span>实际数据可能因使用环境与批次略有差异。</span>
          </div>
        </div>
      </section>

      <section id="purchase" className="purchase" aria-labelledby="purchase-title">
        <div className="purchase__ambient" aria-hidden="true">
          <span className="purchase__ring purchase__ring--one" />
          <span className="purchase__ring purchase__ring--two" />
          <span className="purchase__ring purchase__ring--three" />
          <span className="purchase__glow" />
        </div>
        <div className="purchase__inner shell">
          <div className="purchase__topline" data-reveal>
            <span className="mono">06 / 购买</span>
            <span className="purchase__availability">
              <i aria-hidden="true" />
              首发预约开放中
            </span>
          </div>

          <div className="purchase__main">
            <div className="purchase__copy" data-reveal data-reveal-delay="0.08">
              <h2 id="purchase-title">
                把空间，
                <br />
                留在身边。
              </h2>
              <p>
                NOCTURNE ONE 首发版。每一副耳机在柏林完成最终调音与表面处理，交付期约 4–6 周。
              </p>
            </div>

            <div className="purchase__price-block" data-reveal data-reveal-delay="0.16">
              <span className="purchase__price-label">首发价</span>
              <strong className="purchase__price">
                <span>¥</span>3,499
              </strong>
              <span className="purchase__price-note">含硬质旅行盒与 3.5 mm 模拟线</span>
            </div>
          </div>

          <div className="purchase__action-row" data-reveal data-reveal-delay="0.22">
            <MagneticButton type="button" className="btn--primary" aria-haspopup="dialog" onClick={onReserve}>
              预约试听
              <span className="btn__orb" aria-hidden="true">
                <ArrowUpRight />
              </span>
            </MagneticButton>
            <div className="purchase__action-note">
              <span>预约不产生任何费用</span>
              <span>上海 · 北京 · 深圳 · 成都</span>
            </div>
            <div className="purchase__finish-note">
              <span className="mono">03 FINISHES</span>
              <div className="purchase__swatches" aria-hidden="true">
                <span className="purchase__swatch purchase__swatch--obsidian" />
                <span className="purchase__swatch purchase__swatch--mist" />
                <span className="purchase__swatch purchase__swatch--amber" />
              </div>
            </div>
          </div>

          <div className="purchase__metadata" data-reveal>
            <div>
              <span className="mono">NOCTURNE ONE / N° 001</span>
              <span>空间音频耳机 · 2026 首发版</span>
            </div>
            <div>
              <span className="mono">DELIVERY</span>
              <span>2026 年 11 月起，按预约顺序交付</span>
            </div>
            <div>
              <span className="mono">SERVICE</span>
              <span>两年国际联保 · 30 天声音适应期</span>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
