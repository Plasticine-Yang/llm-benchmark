import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { MapMode, Meta, Pt, RobotView } from '../types';

interface Props {
  meta: Meta;
  robots: RobotView[];
  blocked: number[];
  tick: number;
  mode: MapMode;
  selectedShelf: string | null;
  selectedStation: string | null;
  showPaths: boolean;
  onCellClick: (x: number, y: number) => void;
}

interface Hover { x: number; y: number; px: number; py: number }

const FLOOR = '#111a2e';
const FLOOR_ALT = '#0e1626';
const CORRIDOR = '#16233c';
const WALL_FILL = '#263449';
const SHELF = '#3d4d68';
const SHELF_TOP = '#f0b429';
const STATION = '#0f766e';
const BLOCKED = '#7f1d1d';

export default function MapCanvas({
  meta, robots, blocked, tick, mode, selectedShelf, selectedStation, showPaths, onCellClick,
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [width, setWidth] = useState(900);
  const [hover, setHover] = useState<Hover | null>(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0].contentRect.width;
      if (w > 0) setWidth(w);
    });
    ro.observe(el);
    setWidth(el.clientWidth || 900);
    return () => ro.disconnect();
  }, []);

  const cell = Math.max(9, Math.min(34, Math.floor(width / meta.w)));
  const cw = cell * meta.w;
  const ch = cell * meta.h;

  const blockedSet = useMemo(() => new Set(blocked), [blocked]);
  const shelfAt = useMemo(() => {
    const m = new Map<number, string>();
    for (const s of meta.shelves) {
      for (let dy = 0; dy < s.h; dy++) for (let dx = 0; dx < s.w; dx++) m.set((s.y + dy) * meta.w + (s.x + dx), s.id);
    }
    return m;
  }, [meta]);
  const stationAt = useMemo(() => {
    const m = new Map<number, string>();
    for (const s of meta.stations) m.set(s.y * meta.w + s.x, s.id);
    return m;
  }, [meta]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(cw * dpr);
    canvas.height = Math.round(ch * dpr);
    canvas.style.width = `${cw}px`;
    canvas.style.height = 'auto';
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cw, ch);

    const { EMPTY: T_EMPTY, WALL: T_WALL, SHELF: T_SHELF, STATION: T_STATION } = meta.cellTypes;

    for (let y = 0; y < meta.h; y++) {
      for (let x = 0; x < meta.w; x++) {
        const i = y * meta.w + x;
        const t = meta.cells[i];
        const px = x * cell;
        const py = y * cell;
        let fill = FLOOR;
        if (t === T_WALL) fill = WALL_FILL;
        else if (t === T_SHELF) fill = SHELF;
        else if (t === T_STATION) fill = STATION;
        else if (meta.corridor[i]) fill = CORRIDOR;
        else fill = (x + y) % 2 === 0 ? FLOOR : FLOOR_ALT;
        ctx.fillStyle = fill;
        ctx.fillRect(px, py, cell, cell);

        if (t === T_EMPTY || t === T_STATION) {
          ctx.strokeStyle = 'rgba(148,163,184,0.07)';
          ctx.lineWidth = 1;
          ctx.strokeRect(px + 0.5, py + 0.5, cell - 1, cell - 1);
        }
        if (t === T_SHELF) {
          ctx.fillStyle = SHELF_TOP;
          ctx.fillRect(px, py, cell, Math.max(2, cell * 0.14));
        }
        if (blockedSet.has(i)) {
          ctx.fillStyle = BLOCKED;
          ctx.fillRect(px, py, cell, cell);
          ctx.strokeStyle = '#fca5a5';
          ctx.lineWidth = Math.max(1.5, cell * 0.09);
          ctx.beginPath();
          ctx.moveTo(px + cell * 0.24, py + cell * 0.24);
          ctx.lineTo(px + cell * 0.76, py + cell * 0.76);
          ctx.moveTo(px + cell * 0.76, py + cell * 0.24);
          ctx.lineTo(px + cell * 0.24, py + cell * 0.76);
          ctx.stroke();
        }
      }
    }

    if (cell >= 15) {
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `600 ${Math.round(cell * 0.34)}px ui-monospace, monospace`;
      for (const s of meta.shelves) {
        ctx.fillStyle = 'rgba(226,232,240,0.82)';
        ctx.fillText(s.id, (s.x + s.w / 2) * cell, (s.y + s.h / 2) * cell + cell * 0.08);
      }
      ctx.font = `700 ${Math.round(cell * 0.4)}px ui-monospace, monospace`;
      for (const s of meta.stations) {
        ctx.fillStyle = '#ccfbf1';
        ctx.fillText(s.id, (s.x + 0.5) * cell, (s.y + 0.5) * cell);
      }
    }

    const highlight = (x: number, y: number, w: number, h: number, color: string) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.strokeRect(x * cell + 1, y * cell + 1, w * cell - 2, h * cell - 2);
    };
    for (const s of meta.shelves) if (s.id === selectedShelf) highlight(s.x, s.y, s.w, s.h, '#f0b429');
    for (const s of meta.stations) if (s.id === selectedStation) highlight(s.x, s.y, 1, 1, '#2dd4bf');

    if (showPaths) {
      for (const r of robots) {
        if (r.path.length < 2) continue;
        ctx.strokeStyle = r.color;
        ctx.globalAlpha = r.phase === 'idle' ? 0.18 : 0.5;
        ctx.lineWidth = Math.max(1.5, cell * 0.13);
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.setLineDash([cell * 0.3, cell * 0.22]);
        ctx.beginPath();
        ctx.moveTo((r.x + 0.5) * cell, (r.y + 0.5) * cell);
        for (const p of r.path) ctx.lineTo((p.x + 0.5) * cell, (p.y + 0.5) * cell);
        ctx.stroke();
        ctx.setLineDash([]);
        const end = r.path[r.path.length - 1];
        ctx.globalAlpha = 0.85;
        ctx.fillStyle = r.color;
        ctx.beginPath();
        ctx.arc((end.x + 0.5) * cell, (end.y + 0.5) * cell, Math.max(2, cell * 0.12), 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    }

    for (const r of robots) {
      const cx = (r.x + 0.5) * cell;
      const cy = (r.y + 0.5) * cell;
      const rad = cell * 0.33;
      const waiting = !!r.waitReason && r.phase !== 'idle' && r.phase !== 'loading' && r.phase !== 'unloading';

      if (waiting) {
        ctx.strokeStyle = tick % 2 === 0 ? '#fbbf24' : '#f59e0b';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy, rad + cell * 0.16, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.fillStyle = 'rgba(2,6,23,0.55)';
      ctx.beginPath();
      ctx.arc(cx + 1, cy + 1.5, rad, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = r.phase === 'idle' ? '#64748b' : r.color;
      ctx.beginPath();
      ctx.arc(cx, cy, rad, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(2,6,23,0.85)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      if (r.phase === 'loading' || r.phase === 'unloading') {
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(cx - rad * 0.45, cy - rad * 0.45, rad * 0.9, rad * 0.9);
      }

      if (cell >= 14) {
        ctx.fillStyle = '#0b1220';
        ctx.font = `700 ${Math.round(cell * 0.3)}px ui-monospace, monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(r.id.replace('R', ''), cx, cy + 0.5);
      }
    }

    if (hover) {
      ctx.strokeStyle = mode === 'block' ? '#f87171' : '#e2e8f0';
      ctx.lineWidth = 2;
      ctx.strokeRect(hover.x * cell + 1, hover.y * cell + 1, cell - 2, cell - 2);
    }
  }, [meta, robots, blockedSet, tick, mode, selectedShelf, selectedStation, showPaths, cell, cw, ch, hover]);

  useEffect(() => {
    const id = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(id);
  }, [draw]);

  const cellFromEvent = (e: React.MouseEvent<HTMLCanvasElement>): Pt | null => {
    const rect = e.currentTarget.getBoundingClientRect();
    if (!rect.width) return null;
    // The canvas is scaled down by max-width on narrow screens.
    const size = (rect.width / cw) * cell;
    const x = Math.floor((e.clientX - rect.left) / size);
    const y = Math.floor((e.clientY - rect.top) / size);
    if (x < 0 || y < 0 || x >= meta.w || y >= meta.h) return null;
    return { x, y };
  };

  const tooltip = useMemo(() => {
    if (!hover) return null;
    const i = hover.y * meta.w + hover.x;
    const t = meta.cells[i];
    const names = ['floor', 'wall', 'shelf', 'workstation'];
    const parts = [`(${hover.x}, ${hover.y})`, names[t] ?? 'unknown'];
    const sid = shelfAt.get(i);
    const wid = stationAt.get(i);
    if (sid) parts.push(sid);
    if (wid) parts.push(wid);
    if (blockedSet.has(i)) parts.push('BLOCKED');
    if (meta.corridor[i] && t === meta.cellTypes.EMPTY) parts.push('bottleneck aisle');
    const here = robots.filter((r) => r.x === hover.x && r.y === hover.y);
    for (const r of here) parts.push(`${r.id}: ${r.waitReason ?? r.phase}`);
    return parts.join(' · ');
  }, [hover, meta, shelfAt, stationAt, blockedSet, robots]);

  return (
    <div className="map-wrap" ref={wrapRef}>
      <canvas
        ref={canvasRef}
        className={`map-canvas mode-${mode}`}
        onMouseMove={(e) => {
          const c = cellFromEvent(e);
          if (!c) { setHover(null); return; }
          const rect = e.currentTarget.getBoundingClientRect();
          setHover({ x: c.x, y: c.y, px: e.clientX - rect.left, py: e.clientY - rect.top });
        }}
        onMouseLeave={() => setHover(null)}
        onClick={(e) => {
          const c = cellFromEvent(e);
          if (c) onCellClick(c.x, c.y);
        }}
      />
      {tooltip && hover && (
        <div
          className="map-tooltip"
          style={{
            left: Math.min(Math.max(4, hover.px + 14), Math.max(4, cw - 260)),
            top: Math.max(4, hover.py - 34),
          }}
        >
          {tooltip}
        </div>
      )}
    </div>
  );
}