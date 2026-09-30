import { memo } from 'react';
import { Headphones } from './product/Headphones';

/* ============================================================================
   The installation. Everything that moves forever lives in here and is CSS
   driven, so the hero never re-renders while the product levitates.
   ========================================================================= */

type Hud = {
  id: string;
  value: string;
  label: string;
  className: string;
  delay: number;
};

const HUD: Hud[] = [
  {
    id: 'hud-battery',
    value: '42h',
    label: '续航 · 单次充电',
    className: 'hud--battery',
    delay: 780,
  },
  {
    id: 'hud-engine',
    value: 'Spatial Engine',
    label: '个性化 HRTF 渲染',
    className: 'hud--engine',
    delay: 940,
  },
  {
    id: 'hud-driver',
    value: '38 mm',
    label: '铍振膜驱动单元',
    className: 'hud--driver',
    delay: 1100,
  },
];

export const ProductStage = memo(function ProductStage() {
  return (
    <div className="stage">
      {/* volumetric key light behind the product */}
      <div className="stage__halo" aria-hidden="true" />
      <div className="stage__grid-floor" aria-hidden="true" />

      <div className="stage__float">
        <div className="stage__drift">
          <Headphones className="stage__product" />
        </div>
      </div>

      {/* light sweep passing across the product */}
      <div className="stage__sweep" aria-hidden="true" />

      {/* foreground lens: a slab of glass in front of the product */}
      <div className="stage__lens" aria-hidden="true">
        <span />
      </div>

      {/* glass HUD readouts */}
      <div className="stage__hud" aria-hidden="true">
        {HUD.map((h) => (
          <div
            key={h.id}
            className={`hud glass ${h.className}`}
            style={{ animationDelay: `${h.delay}ms` }}
          >
            <span className="hud__lead" />
            <span className="hud__value num">{h.value}</span>
            <span className="hud__label mono">{h.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
});
