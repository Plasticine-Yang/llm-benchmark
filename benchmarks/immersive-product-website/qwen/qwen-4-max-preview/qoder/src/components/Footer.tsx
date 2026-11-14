import type { MouseEvent } from 'react';
import { Reveal } from './Reveal';

const BARS = [3, 1, 2, 4, 1, 1, 3, 2, 1, 4, 2, 1, 1, 3, 1, 2, 4, 1, 3, 1, 1, 2, 3, 1, 4, 2, 1, 3, 1, 2];

interface FooterProps {
  onReserve: (e: MouseEvent<HTMLButtonElement>) => void;
}

export function Footer({ onReserve }: FooterProps) {
  let x = 0;
  const bars = BARS.map((w, i) => {
    const rect = <rect key={i} x={x} y={0} width={w} height={40} fill="#b9c1ca" />;
    x += w + 2;
    return rect;
  });

  return (
    <footer className="footer">
      <div className="footer-inner">
        <Reveal>
          <div className="footer-wordmark dispersion" aria-hidden>
            NOCTURNE
          </div>
          <div className="footer-edition">
            <span>ONE</span>
            <i aria-hidden />
            <span>声学笔记 · 卷一</span>
            <i aria-hidden />
            <span>2026 冬</span>
          </div>
        </Reveal>
        <Reveal delay={120}>
          <div className="footer-colophon">
            <div className="col-block">
              <h4>Colophon · 版权页</h4>
              <p>
                声学设计 · 上海
                <br />
                单元调音 · 京都实验室
                <br />
                本刊以屏幕印制，限量发行于每一位聆听者。
              </p>
            </div>
            <div className="col-block">
              <h4>Edition · 版本</h4>
              <p>
                第一版 · 2026 年 11 月
                <br />
                透明双腔体 / 个性化 HRTF / 42 h
                <br />
                定价 ¥3,499 · 全国试听空间预约开放
              </p>
            </div>
            <div className="col-block footer-barcode">
              <h4>Archive · 存档</h4>
              <svg viewBox={`0 0 ${x} 40`} width={x} height={40} aria-hidden>
                {bars}
              </svg>
              <span className="mono">NC-ONE · 2026-1114 · VOL.01</span>
            </div>
          </div>
        </Reveal>
        <div className="footer-bottom">
          <span>© 2026 NOCTURNE ACOUSTICS · 保留所有权利</span>
          <nav className="footer-links" aria-label="页脚导航">
            <a href="#sound">声学</a>
            <a href="#structure">结构</a>
            <a href="#specs">规格</a>
            <button type="button" onClick={onReserve}>
              预约试听
            </button>
          </nav>
        </div>
      </div>
    </footer>
  );
}