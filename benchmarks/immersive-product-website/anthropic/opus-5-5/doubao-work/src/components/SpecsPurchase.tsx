import { ArrowRight, ArrowsClockwise, Package, ShieldCheck } from '@phosphor-icons/react'
import { FINISHES } from '../data'
import { openReservation, useFinish } from '../store'
import { MagneticButton } from './MagneticButton'

const SPECS: { label: string; value: string; unit?: string; note: string }[] = [
  { label: 'Weight', value: '312', unit: 'g', note: '重量 · 含耳垫' },
  { label: 'Bluetooth', value: '5.4', note: 'LE Audio · LC3 / LDAC' },
  { label: 'Battery', value: '42', unit: 'h', note: '续航 · 空间音频开启' },
  { label: 'Fast charge', value: '10', unit: 'min', note: '快充 10 分钟 → 播放 6 h' },
]

const DETAILS = [
  ['驱动单元', '38 mm 铍涂层动圈'],
  ['频率响应', '4 Hz – 40 kHz'],
  ['主动降噪', '自适应 · 8 麦克风'],
  ['空间音频', '个性化 HRTF · 头部追踪'],
  ['充电接口', 'USB-C · 支持有线音频'],
  ['多点连接', '同时 2 台设备'],
]

export function SpecsPurchase() {
  return (
    <>
      <section id="specs" aria-labelledby="specs-title" className="relative scroll-mt-20 border-t border-white/[0.05] py-28 md:py-36">
        <div className="mx-auto max-w-[1280px] px-5 sm:px-8 lg:px-10">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
            <p className="eyebrow reveal md:col-span-3">04 — Specifications</p>
            <h2 id="specs-title" className="reveal text-[clamp(2rem,4vw,3.4rem)] font-semibold leading-[1.1] tracking-[-0.03em] text-ice-50 md:col-span-9" style={{ ['--rd' as string]: '0.08s' }}>
              用数字说话，<span className="text-ice-400">但不止于数字。</span>
            </h2>
          </div>

          {/* Instrument-panel spec grid */}
          <dl className="mt-16 grid grid-cols-1 border-y border-white/[0.08] sm:grid-cols-2 lg:grid-cols-4">
            {SPECS.map((s, i) => (
              <div
                key={s.label}
                className={`reveal group relative px-1 py-10 sm:px-6 lg:py-14 ${i > 0 ? 'border-t border-white/[0.08] sm:border-t-0' : ''} ${i % 2 === 1 ? 'sm:border-l sm:border-white/[0.08]' : ''} ${i >= 2 ? 'sm:border-t sm:border-white/[0.08] lg:border-t-0' : ''} ${i > 0 ? 'lg:border-l lg:border-white/[0.08]' : ''}`}
                style={{ ['--rd' as string]: `${i * 0.08}s` }}
              >
                <dt className="mono flex items-center justify-between text-[10.5px] uppercase tracking-[0.22em] text-ice-500">
                  {s.label}
                  <span className="text-ice-600">0{i + 1}</span>
                </dt>
                <dd className="mt-8">
                  <span className="mono tabular text-[clamp(3rem,6vw,5rem)] font-extralight leading-none tracking-[-0.04em] text-ice-50">{s.value}</span>
                  {s.unit && <span className="mono ml-1.5 text-[18px] text-amber-soft">{s.unit}</span>}
                  <span className="mt-4 block text-[13.5px] text-ice-400">{s.note}</span>
                </dd>
              </div>
            ))}
          </dl>

          <div className="mt-14 grid grid-cols-1 gap-x-14 gap-y-0 md:grid-cols-2">
            {DETAILS.map(([k, v], i) => (
              <div key={k} className="reveal flex items-baseline justify-between gap-6 border-b border-white/[0.06] py-4" style={{ ['--rd' as string]: `${(i % 2) * 0.06}s` }}>
                <span className="text-[14px] text-ice-500">{k}</span>
                <span className="text-right text-[14.5px] text-ice-100">{v}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
      <Purchase />
    </>
  )
}

function Purchase() {
  const finish = useFinish()
  const f = FINISHES.find((x) => x.id === finish)!
  return (
    <section id="purchase" aria-labelledby="purchase-title" className="relative isolate scroll-mt-20 overflow-hidden py-24 md:py-32">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute right-[10%] top-[40%] h-[80vmin] w-[80vmin] rounded-full" style={{ background: 'radial-gradient(circle, var(--ambient), transparent 60%)', filter: 'blur(50px)' }} />
      </div>
      <div className="mx-auto max-w-[1280px] px-5 sm:px-8 lg:px-10">
        <div className="reveal glass glass-orbit grid grid-cols-1 overflow-hidden lg:grid-cols-12" style={{ ['--r' as string]: '32px' }}>
          <div className="p-7 sm:p-10 lg:col-span-7 lg:p-14">
            <p className="eyebrow">05 — Purchase</p>
            <h2 id="purchase-title" className="mt-5 text-[clamp(1.9rem,3.6vw,3rem)] font-semibold leading-[1.12] tracking-[-0.03em] text-ice-50">
              先听，再决定。
            </h2>
            <p className="mt-5 max-w-[32em] text-[15px] leading-[1.85] text-ice-300">
              在六座城市的 NOCTURNE 聆听室，预约 30 分钟的私人试听。我们会为你扫描耳廓、生成个性化 HRTF，并保存到你的账户。
            </p>
            <ul className="mt-9 grid grid-cols-1 gap-4 text-[13.5px] text-ice-300 sm:grid-cols-3">
              <li className="flex items-center gap-2.5"><Package size={18} weight="light" className="text-amber-soft" aria-hidden="true" />11 月 11 日首批发货</li>
              <li className="flex items-center gap-2.5"><ArrowsClockwise size={18} weight="light" className="text-amber-soft" aria-hidden="true" />30 天无理由退换</li>
              <li className="flex items-center gap-2.5"><ShieldCheck size={18} weight="light" className="text-amber-soft" aria-hidden="true" />2 年整机保修</li>
            </ul>
          </div>
          <div className="relative flex flex-col justify-between gap-10 border-t border-white/[0.08] bg-black/10 p-7 sm:p-10 lg:col-span-5 lg:border-l lg:border-t-0 lg:p-14">
            <div>
              <p className="text-[13px] text-ice-500">首发价</p>
              <p className="mt-2 flex items-baseline gap-3">
                <span className="mono tabular text-[clamp(2.8rem,5vw,4rem)] font-light leading-none tracking-[-0.04em] text-ice-50">¥3,499</span>
              </p>
              <p className="mt-4 flex items-center gap-2.5 text-[13.5px] text-ice-300">
                <span className="h-3.5 w-3.5 rounded-full" style={{ background: f.swatch, boxShadow: '0 0 0 1px rgba(255,255,255,.15)' }} aria-hidden="true" />
                当前配色 · {f.name}（{f.cn}）
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
              <MagneticButton type="button" className="flex-1" onClick={(e) => openReservation(e.currentTarget)}>
                预约试听
                <ArrowRight size={16} className="arrow" aria-hidden="true" />
              </MagneticButton>
              <button type="button" className="btn btn-glass flex-1" disabled title="11 月 1 日 10:00 开放">
                立即购买 · 11.01 开放
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
