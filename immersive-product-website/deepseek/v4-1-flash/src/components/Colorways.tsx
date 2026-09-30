import { memo } from 'react';
import { Check } from '@phosphor-icons/react';
import { Headphones } from './product/Headphones';
import { useInView } from '../lib/hooks';

export type ColorwayId = 'obsidian' | 'mist' | 'amber';

export const COLORWAYS: {
  id: ColorwayId;
  cn: string;
  en: string;
  code: string;
  note: string;
}[] = [
  {
    id: 'obsidian',
    cn: '曜石黑',
    en: 'OBSIDIAN',
    code: 'N1-OB',
    note: '深邃石墨，几乎不反光。留给声音本身。',
  },
  {
    id: 'mist',
    cn: '雾银',
    en: 'MIST SILVER',
    code: 'N1-MS',
    note: '冷调铝银，像清晨还没被照亮的金属。',
  },
  {
    id: 'amber',
    cn: '燃琥珀',
    en: 'BURNT AMBER',
    code: 'N1-BA',
    note: '阳极氧化的暖铜色，整机唯一一处彩色。',
  },
];

const ColorStage = memo(function ColorStage() {
  return (
    <div className="colors__stage">
      <span className="colors__wash" aria-hidden="true" />
      <div className="colors__pod">
        <Headphones className="colors__product" />
      </div>
      <span className="colors__plate" aria-hidden="true" />
    </div>
  );
});

export function Colorways({
  value,
  onChange,
}: {
  value: ColorwayId;
  onChange: (v: ColorwayId) => void;
}) {
  const [ref, shown] = useInView<HTMLElement>({ threshold: 0.16 });
  const active = COLORWAYS.find((c) => c.id === value) ?? COLORWAYS[0];

  return (
    <section className="colors section" id="colorways" ref={ref}>
      <div className="shell">
        <header className="colors__head">
          <p className="t-eyebrow section__eyebrow reveal" data-shown={shown}>
            <span className="section__idx mono">04</span> 配色 / COLOURWAYS
          </p>
          <h2 className="t-h2 section__title reveal" data-shown={shown} data-delay="1">
            三种质感，同一种安静。
          </h2>
        </header>

        <div className="colors__body reveal" data-shown={shown} data-delay="2">
          <div className="colors__visual">
            <ColorStage key={value} />
            <span className="colors__flash" key={`f-${value}`} aria-hidden="true" />
          </div>

          <div className="colors__panel">
            <p className="colors__note">{active.note}</p>

            <div
              className="colors__picker"
              role="radiogroup"
              aria-label="选择配色"
            >
              {COLORWAYS.map((c) => {
                const selected = c.id === value;
                return (
                  <button
                    key={c.id}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    className="swatch"
                    data-active={selected ? 'true' : 'false'}
                    data-cw={c.id}
                    onClick={() => onChange(c.id)}
                  >
                    <span className="swatch__disc" aria-hidden="true">
                      <span className="swatch__disc-inner" />
                    </span>
                    <span className="swatch__text">
                      <span className="swatch__cn">{c.cn}</span>
                      <span className="swatch__en mono">{c.en}</span>
                    </span>
                    <span className="swatch__code mono">{c.code}</span>
                    <span className="swatch__tick" aria-hidden="true">
                      <Check size={12} weight="bold" />
                    </span>
                  </button>
                );
              })}
            </div>

            <p className="colors__hint mono">
              切换配色 · 材质与氛围光同步过渡
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
