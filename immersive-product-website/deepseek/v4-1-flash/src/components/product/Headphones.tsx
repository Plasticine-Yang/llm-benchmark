import { useId, memo } from 'react';
import {
  AcousticChamber,
  ANCHOR,
  EarcupShell,
  FRAME_PRODUCT,
  Headband,
  ProductDefs,
  ProductIdProvider,
  VIEW_H,
  VIEW_W,
  Yoke,
  useUid,
} from './parts';

/* Far earcup: simplified, defocused, pushed into the background. */
function FarCup() {
  const u = useUid();
  const { rx, ry } = ANCHOR.farCup;
  const wx = rx - 14;
  const wy = ry - 16;
  return (
    <g filter={`url(#${u('f-dof')})`}>
      <rect
        x={-rx}
        y={-ry}
        width={rx * 2}
        height={ry * 2}
        rx="82"
        fill="#04060a"
        filter={`url(#${u('f-inner')})`}
      />
      <rect
        x={-rx}
        y={-ry}
        width={rx * 2}
        height={ry * 2}
        rx="82"
        fill={`url(#${u('body-far')})`}
      />
      {/* rim light separating the cup from the void */}
      <path
        d={`M ${-rx + 4} ${-ry + 64} A ${rx} ${ry} 0 0 0 ${-rx + 46} ${-ry + 4}`}
        fill="none"
        stroke="var(--ring)"
        strokeOpacity="0.6"
        strokeWidth="1.4"
      />
      <path
        d={`M ${-rx + 26} ${-ry + 2} A ${rx} ${ry} 0 0 1 ${rx - 30} ${-ry + 48}`}
        fill="none"
        stroke="#ffffff"
        strokeOpacity="0.28"
        strokeWidth="1.1"
      />
      <rect
        x={-wx}
        y={-wy}
        width={wx * 2}
        height={wy * 2}
        rx="70"
        fill={`url(#${u('cavity')})`}
      />
      <rect
        x={-wx}
        y={-wy}
        width={wx * 2}
        height={wy * 2}
        rx="70"
        fill="none"
        stroke="#000"
        strokeOpacity="0.62"
        strokeWidth="22"
        filter={`url(#${u('f-inner')})`}
      />
      {[70, 52, 34].map((r) => (
        <circle
          key={r}
          cx="0"
          cy="-4"
          r={r}
          fill="none"
          stroke="#ffffff"
          strokeOpacity="0.07"
          strokeWidth="1"
        />
      ))}
      <circle cx="0" cy="-4" r="30" fill={`url(#${u('dome')})`} opacity="0.7" />
      <ellipse
        cx="-30"
        cy="-62"
        rx="42"
        ry="24"
        fill={`url(#${u('spec')})`}
        transform="rotate(-30 -30 -62)"
      />
      <rect
        x={-rx}
        y={-ry}
        width={rx * 2}
        height={ry * 2}
        rx="82"
        fill={`url(#${u('coat')})`}
      />
      {/* atmospheric falloff — just enough to seat the cup behind */}
      <rect
        x={-rx}
        y={-ry}
        width={rx * 2}
        height={ry * 2}
        rx="82"
        fill="#0a0b0d"
        fillOpacity="0.16"
      />
    </g>
  );
}

function Assembly() {
  const u = useUid();
  const { nearCup, farCup, yoke } = ANCHOR;
  return (
    <>
      {/* contact shadow */}
      <ellipse
        cx="470"
        cy="684"
        rx="286"
        ry="30"
        fill="#000000"
        fillOpacity="0.85"
        filter={`url(#${u('f-shadow')})`}
      />

      <g transform={`translate(${farCup.x} ${farCup.y}) rotate(${farCup.rot})`}>
        <FarCup />
      </g>

      <Headband />

      {/* slider brackets sit in front of the rail so the band visibly
          terminates into each earcup */}
      <Yoke x={farCup.x + 4} y={farCup.y - farCup.ry - 18} scale={0.9} />
      <Yoke x={yoke.x} y={yoke.y} />

      <g transform={`translate(${nearCup.x} ${nearCup.y}) rotate(${nearCup.rot})`}>
        <EarcupShell />
        <AcousticChamber />
        {/* status LED */}
        <circle
          cx="0"
          cy={nearCup.ry - 32}
          r="9"
          fill="var(--glow)"
          filter={`url(#${u('f-glow')})`}
        />
        <circle cx="0" cy={nearCup.ry - 32} r="2.6" fill="var(--amber-bright)" />
      </g>
    </>
  );
}

export const Headphones = memo(function Headphones({
  className,
  viewBox,
}: {
  className?: string;
  viewBox?: string;
}) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  return (
    <ProductIdProvider uid={`n${uid}`}>
      <svg
        className={className}
        viewBox={viewBox ?? `0 0 ${VIEW_W} ${VIEW_H}`}
        role="img"
        aria-label="NOCTURNE ONE 空间音频耳机，透明双腔体与 38 毫米驱动单元"
        preserveAspectRatio="xMidYMid meet"
      >
        <ProductDefs />
        <g transform={FRAME_PRODUCT}>
          <Assembly />
        </g>
      </svg>
    </ProductIdProvider>
  );
});
