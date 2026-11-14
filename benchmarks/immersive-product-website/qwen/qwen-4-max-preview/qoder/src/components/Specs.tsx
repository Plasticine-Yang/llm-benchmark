import type { MouseEvent } from 'react';
import { finishByKey, type FinishKey } from '../lib/finishes';
import { MagneticButton } from './MagneticButton';
import { Reveal } from './Reveal';
import { IconArrowRight, IconCheck, IconDownload } from './icons';

const SPECS: [string, string, string?][] = [
  ['重量', '312 g', '含耳罩与头带垫'],
  ['蓝牙', '5.4', 'LDAC · LC3 · 双设备多点'],
  ['续航', '42 h', 'ANC 开启 · 50% 音量'],
  ['快充', '10 min → 6 h', 'USB-C · 支持边充边听'],
  ['驱动单元', '38 mm', '镀铍振膜 · 双腔独立调音'],
  ['空间引擎', 'HRTF', '个性化耳廓扫描 · 头部追踪'],
  ['被动隔音', '-28 dB', '记忆棉耳罩 · 磁吸快拆'],
  ['延迟', '38 ms', '低延迟游戏模式'],
];

interface SpecsProps {
  finish: FinishKey;
  reserved: boolean;
  onReserve: (e: MouseEvent<HTMLButtonElement>) => void;
}

export function Specs({ finish, reserved, onReserve }: SpecsProps) {
  const downloadSpecs = () => {
    const lines = [
      'NOCTURNE ONE — 技术规格',
      '听见空间，而不只是声音。',
      '',
      ...SPECS.map(([k, v, note]) => `${k}：${v}${note ? `（${note}）` : ''}`),
      '',
      `当前配色：${finishByKey(finish).name} ${finishByKey(finish).en}`,
      '首发价：¥3,499',
      '发售：2026 年 12 月起陆续发货',
      '',
      '© 2026 NOCTURNE ACOUSTICS',
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'NOCTURNE-ONE-规格书.txt';
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 2000);
  };

  return (
    <section className="section" id="specs">
      <div className="section-inner">
        <Reveal className="section-head">
          <span className="eyebrow">规格 · Specifications</span>
          <h2 className="section-title">参数，是另一种诚实。</h2>
        </Reveal>
        <div className="specs-grid">
          <Reveal delay={80}>
            <dl className="spec-table">
              {SPECS.map(([k, v, note]) => (
                <div className="spec-row" key={k}>
                  <dt>{k}</dt>
                  <dd>
                    {v}
                    {note && <small>{note}</small>}
                  </dd>
                </div>
              ))}
            </dl>
          </Reveal>
          <Reveal delay={160}>
            <div className="purchase glass" id="purchase">
              <div className="purchase-eyebrow">首发 · First Edition</div>
              <h3>NOCTURNE ONE</h3>
              <div className="purchase-price">
                <span className="amount">¥3,499</span>
                <span className="note">首发限定 · 2026.12 发货</span>
              </div>
              <ul className="purchase-benefits">
                <li>
                  <IconCheck size={15} />
                  30 天无理由试听，往返运费我们承担
                </li>
                <li>
                  <IconCheck size={15} />
                  2 年质保 · 腔体终身免费校准
                </li>
                <li>
                  <IconCheck size={15} />
                  首发免费镌刻（12 字符以内）
                </li>
              </ul>
              <div className="purchase-ctas">
                <MagneticButton className="btn-primary" onClick={onReserve}>
                  {reserved ? '已预约 · 查看凭证' : '预约试听'}
                  <IconArrowRight size={17} />
                </MagneticButton>
                <button type="button" className="btn btn-ghost" onClick={downloadSpecs}>
                  <IconDownload size={16} />
                  下载规格书
                </button>
              </div>
              <p className="purchase-fine">预约不收取任何费用 · 试听后决定是否购买</p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}