import { useRef } from 'react';
import { FINISHES, finishByKey, type FinishKey } from '../lib/finishes';
import { Headphone } from './Headphone';
import { Reveal } from './Reveal';

interface FinishesProps {
  finish: FinishKey;
  onChange: (key: FinishKey) => void;
}

export function Finishes({ finish, onChange }: FinishesProps) {
  const current = finishByKey(finish);
  const groupRef = useRef<HTMLDivElement>(null);

  const onKeyDown = (e: React.KeyboardEvent) => {
    const idx = FINISHES.findIndex((f) => f.key === finish);
    let next = -1;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (idx + 1) % FINISHES.length;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (idx - 1 + FINISHES.length) % FINISHES.length;
    if (next < 0) return;
    e.preventDefault();
    onChange(FINISHES[next].key);
    const btn = groupRef.current?.querySelectorAll<HTMLButtonElement>('[role="radio"]')[next];
    btn?.focus();
  };

  return (
    <section className="section" id="finishes">
      <div className="section-inner">
        <Reveal className="section-head" style={{ textAlign: 'center' }}>
          <span className="eyebrow" style={{ justifyContent: 'center' }}>配色 · Finishes</span>
          <h2 className="section-title">三种夜色，一种质感。</h2>
        </Reveal>
        <Reveal delay={100}>
          <div className="finishes-stage">
            <div className="finishes-glow" aria-hidden />
            <Headphone idPrefix="finish" />
          </div>
          <div className="finish-name" aria-live="polite">
            <div className="mono">{current.en}</div>
            <h3>{current.name}</h3>
            <p key={current.key}>{current.desc}</p>
          </div>
        </Reveal>
        <Reveal delay={180}>
          <div
            className="swatches"
            role="radiogroup"
            aria-label="选择配色"
            ref={groupRef}
            onKeyDown={onKeyDown}
          >
            {FINISHES.map((f) => (
              <button
                key={f.key}
                type="button"
                role="radio"
                aria-checked={finish === f.key}
                tabIndex={finish === f.key ? 0 : -1}
                className="swatch"
                onClick={() => onChange(f.key)}
              >
                <span className="swatch-dot" style={{ background: f.swatch }} aria-hidden />
                <span className="swatch-label">
                  {f.name} · {f.en}
                </span>
              </button>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}