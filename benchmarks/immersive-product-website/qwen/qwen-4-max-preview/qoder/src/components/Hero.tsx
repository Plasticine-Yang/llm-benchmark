import type { MouseEvent } from 'react';
import { MagneticButton } from './MagneticButton';
import { ProductStage } from './ProductStage';
import { IconArrowRight, IconPlay } from './icons';

interface HeroProps {
  onReserve: (e: MouseEvent<HTMLButtonElement>) => void;
  onStory: () => void;
  reserved: boolean;
}

export function Hero({ onReserve, onStory, reserved }: HeroProps) {
  return (
    <section className="hero" id="brand">
      <div className="hero-beams" aria-hidden>
        <div className="beam beam-a" />
        <div className="beam beam-b" />
      </div>

      <div className="hero-copy">
        <span className="eyebrow hero-eyebrow">NOCTURNE · 旗舰空间声场耳机</span>
        <h1 className="hero-title dispersion">
          <span className="line">
            <span>听见空间，</span>
          </span>
          <span className="line">
            <span>而不只是<em>声音</em>。</span>
          </span>
        </h1>
        <p className="hero-sub">
          NOCTURNE ONE 以透明双腔体、个性化 HRTF 与 42 小时续航，重新定义私人声场。
        </p>
        <div className="hero-ctas">
          <MagneticButton className="btn-primary" onClick={onReserve}>
            {reserved ? '已预约 · 查看凭证' : '预约试听'}
            <IconArrowRight size={17} />
          </MagneticButton>
          <button type="button" className="btn btn-ghost" onClick={onStory}>
            <IconPlay size={15} />
            观看 90 秒设计故事
          </button>
        </div>
        <div className="hero-meta">
          <span><b>42 h</b> 续航</span>
          <span><b>38 mm</b> 镀铍单元</span>
          <span><b>312 g</b> 均衡配重</span>
          <span><b>¥3,499</b> 首发</span>
        </div>
      </div>

      <ProductStage />
    </section>
  );
}