import { useId, type ReactNode } from 'react';
import {
  AcousticChamber,
  EarcupShell,
  EXPLODED_VIEWBOX,
  FRAME_EXPLODED,
  Headband,
  ProductDefs,
  ProductIdProvider,
} from './parts';
import { Headphones } from './Headphones';

/* Each layer is its own SVG sharing the same viewBox, stacked in CSS. That
   keeps the separation animation on plain HTML transforms (compositor only). */

function Layer({
  className,
  children,
  label,
}: {
  className: string;
  children: ReactNode;
  label: string;
}) {
  const uid = `x${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  return (
    <ProductIdProvider uid={uid}>
      <svg
        className={`ex__layer ${className}`}
        viewBox={EXPLODED_VIEWBOX}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label={label}
      >
        <ProductDefs />
        <g transform={FRAME_EXPLODED}>{children}</g>
      </svg>
    </ProductIdProvider>
  );
}

const CUP = `translate(614 462) rotate(9)`;

export function Exploded() {
  return (
    <div className="ex">
      {/* blueprint plate the parts are drawn on */}
      <div className="ex__plate" aria-hidden="true">
        <span className="ex__axis ex__axis--v" />
        <span className="ex__axis ex__axis--h" />
      </div>

      {/* ghosted reference assembly */}
      <div className="ex__ghost" aria-hidden="true">
        <Headphones className="ex__ghost-svg" viewBox={EXPLODED_VIEWBOX} />
      </div>

      <Layer className="ex__band" label="头梁与滑轨">
        <Headband />
      </Layer>

      <Layer className="ex__chamber" label="透明声学腔体与 38 毫米驱动单元">
        <g transform={CUP}>
          <AcousticChamber />
        </g>
      </Layer>

      <Layer className="ex__shell" label="CNC 耳罩外壳">
        <g transform={CUP}>
          <EarcupShell />
        </g>
      </Layer>

      {/* callouts ride along with each stage */}
      <div className="ex__callouts" aria-hidden="true">
        <span className="ex__callout glass ex__callout--band">
          <b className="mono">A</b> 头梁 · 镁铝合金
        </span>
        <span className="ex__callout glass ex__callout--chamber">
          <b className="mono">B</b> 声学腔体 · 38 mm 铍振膜
        </span>
        <span className="ex__callout glass ex__callout--shell">
          <b className="mono">C</b> 耳罩外壳 · 阳极氧化
        </span>
      </div>
    </div>
  );
}
