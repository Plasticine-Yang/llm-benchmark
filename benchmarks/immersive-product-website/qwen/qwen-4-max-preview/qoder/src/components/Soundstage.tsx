import { memo, useEffect, useRef, useState } from 'react';
import { SpatialAudioEngine } from '../lib/audio';
import { clamp, useReducedMotion } from '../lib/hooks';
import { Reveal } from './Reveal';
import { IconPause, IconPlay } from './icons';

const SOURCE_NAMES = ['前置', '右前', '右侧', '右后', '后置', '左后', '左侧', '左前'];
const TAU = Math.PI * 2;

interface SoundstageProps {
  muted: boolean;
}

export const Soundstage = memo(function Soundstage({ muted }: SoundstageProps) {
  const reduced = useReducedMotion();
  const [playing, setPlaying] = useState(false);
  const [spatial, setSpatial] = useState(true);
  const [visible, setVisible] = useState(false);

  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const azOutRef = useRef<HTMLElement | null>(null);
  const elOutRef = useRef<HTMLElement | null>(null);
  const sliderRef = useRef<HTMLInputElement>(null);

  const engineRef = useRef<SpatialAudioEngine | null>(null);
  const playingRef = useRef(playing);
  const spatialRef = useRef(spatial);
  const reducedRef = useRef(reduced);
  playingRef.current = playing;
  spatialRef.current = spatial;
  reducedRef.current = reduced;

  const facing = useRef({ cur: 0, target: 0 });
  const elev = useRef({ cur: 0, target: 0 });
  const orbit = useRef(0);
  const time = useRef(0);
  const lastPointer = useRef(0);
  const sizeRef = useRef(0);
  const lastAz = useRef(-1);
  const lastEl = useRef(-999);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const io = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), {
      threshold: 0.15,
    });
    io.observe(wrap);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!visible && playingRef.current) {
      setPlaying(false);
      engineRef.current?.stop();
    }
  }, [visible]);

  useEffect(() => {
    engineRef.current?.setMuted(muted);
  }, [muted]);

  useEffect(() => () => engineRef.current?.dispose(), []);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const s = wrap.clientWidth;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      sizeRef.current = s;
      canvas.width = Math.round(s * dpr);
      canvas.height = Math.round(s * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    let raf = 0;
    let lastTs = 0;

    const frame = (ts: number) => {
      const dt = lastTs ? Math.min(0.05, (ts - lastTs) / 1000) : 0.016;
      lastTs = ts;
      const S = sizeRef.current;
      if (S > 0) {
        if (!reducedRef.current) time.current += dt;
        const now = performance.now();
        if (!reducedRef.current && !playingRef.current && now - lastPointer.current > 3200) {
          facing.current.target += dt * 0.055;
        }
        const damp = Math.min(1, dt * 6);
        const delta = ((facing.current.target - facing.current.cur + Math.PI * 3) % TAU) - Math.PI;
        facing.current.cur += delta * damp;
        elev.current.cur += (elev.current.target - elev.current.cur) * damp;
        if (playingRef.current) {
          orbit.current = (orbit.current + dt * 0.55) % TAU;
          engineRef.current?.setAngle(orbit.current, elev.current.cur * 0.6);
        }
        draw(ctx, S);
        updateReadouts();
      }
      raf = requestAnimationFrame(frame);
    };

    const updateReadouts = () => {
      const deg = Math.round((((facing.current.cur * 180) / Math.PI) % 360 + 360) % 360) % 360;
      const elDeg = Math.round((elev.current.cur * 180) / Math.PI);
      if (deg !== lastAz.current) {
        lastAz.current = deg;
        if (azOutRef.current) azOutRef.current.textContent = `${String(deg).padStart(3, '0')}°`;
        if (sliderRef.current && document.activeElement !== sliderRef.current) {
          sliderRef.current.value = String(deg);
        }
      }
      if (elDeg !== lastEl.current) {
        lastEl.current = elDeg;
        if (elOutRef.current) {
          elOutRef.current.textContent = `${elDeg >= 0 ? '+' : ''}${elDeg}°`;
        }
      }
    };

    const draw = (c: CanvasRenderingContext2D, S: number) => {
      const R = S * 0.42;
      const cx = S / 2;
      const cy = S / 2;
      const f = facing.current.cur;
      const t = time.current;
      const isSpatial = spatialRef.current;

      c.clearRect(0, 0, S, S);
      c.save();
      c.translate(cx, cy);

      const bg = c.createRadialGradient(0, -S * 0.07, S * 0.04, 0, 0, S * 0.56);
      bg.addColorStop(0, '#1e222a');
      bg.addColorStop(0.72, '#121419');
      bg.addColorStop(1, '#0d0e11');
      c.fillStyle = bg;
      c.fillRect(-cx, -cy, S, S);

      // range rings
      c.strokeStyle = 'rgba(207,217,228,0.06)';
      c.lineWidth = 1;
      for (const k of [0.3, 0.55, 0.8]) {
        c.beginPath();
        c.arc(0, 0, R * k, 0, TAU);
        c.stroke();
      }

      // outer ring + ticks
      c.strokeStyle = 'rgba(207,217,228,0.12)';
      c.beginPath();
      c.arc(0, 0, R, 0, TAU);
      c.stroke();
      for (let i = 0; i < 72; i++) {
        const a = (i * TAU) / 72 - Math.PI / 2;
        const long = i % 9 === 0;
        const r0 = R - (long ? 11 : 5);
        c.strokeStyle = long ? 'rgba(207,217,228,0.3)' : 'rgba(207,217,228,0.12)';
        c.beginPath();
        c.moveTo(Math.cos(a) * r0, Math.sin(a) * r0);
        c.lineTo(Math.cos(a) * R, Math.sin(a) * R);
        c.stroke();
      }

      // cardinal labels
      c.font = '11px "Outfit Variable", "Microsoft YaHei", sans-serif';
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillStyle = 'rgba(131,140,151,0.95)';
      const lr = R * 0.875;
      c.fillText('前', 0, -lr);
      c.fillText('后', 0, lr);
      c.fillText('右', lr, 0);
      c.fillText('左', -lr, 0);

      // listening beam
      const half = isSpatial ? 0.4 : 0.62;
      const beam = c.createRadialGradient(0, 0, 4, 0, 0, R * 0.88);
      beam.addColorStop(0, 'rgba(226,172,100,0.16)');
      beam.addColorStop(1, 'rgba(226,172,100,0)');
      c.fillStyle = beam;
      c.beginPath();
      c.moveTo(0, 0);
      c.arc(0, 0, R * 0.88, f - half - Math.PI / 2, f + half - Math.PI / 2);
      c.closePath();
      c.fill();

      // sources + wavefronts
      const count = isSpatial ? 8 : 2;
      const sr = R * 0.62;
      let activeIdx = 0;
      let best = -2;
      const azs: number[] = [];
      for (let i = 0; i < count; i++) {
        const az = isSpatial ? (i * TAU) / 8 : i === 0 ? -Math.PI / 6 : Math.PI / 6;
        azs.push(az);
        const d = Math.cos(az - f);
        if (d > best) {
          best = d;
          activeIdx = i;
        }
      }
      for (let i = 0; i < count; i++) {
        const az = azs[i];
        const x = Math.sin(az) * sr;
        const y = -Math.cos(az) * sr;
        const align = 0.3 + 0.7 * Math.max(0, Math.cos(az - f));
        const active = i === activeIdx;
        for (let k = 0; k < 2; k++) {
          const phase = (t * 0.45 + i * 0.13 + k * 0.5) % 1;
          const rr = 5 + phase * R * 0.3;
          const alpha = (1 - phase) * 0.42 * align;
          c.strokeStyle = active
            ? `rgba(226,172,100,${alpha.toFixed(3)})`
            : `rgba(207,217,228,${(alpha * 0.8).toFixed(3)})`;
          c.lineWidth = active ? 1.4 : 1;
          c.beginPath();
          c.arc(x, y, rr, 0, TAU);
          c.stroke();
        }
        c.fillStyle = active ? '#e2ac64' : 'rgba(207,217,228,0.8)';
        c.beginPath();
        c.arc(x, y, active ? 4.4 : 3, 0, TAU);
        c.fill();
        c.strokeStyle = active ? 'rgba(226,172,100,0.3)' : 'rgba(207,217,228,0.16)';
        c.beginPath();
        c.arc(x, y, active ? 9 : 7, 0, TAU);
        c.stroke();
        if (active) {
          c.fillStyle = 'rgba(238,241,245,0.9)';
          c.font = '10.5px "IBM Plex Mono", "Microsoft YaHei", monospace';
          const name = isSpatial ? SOURCE_NAMES[i] : i === 0 ? '左声道' : '右声道';
          const lx = Math.sin(az) * (sr + 22);
          const ly = -Math.cos(az) * (sr + 22);
          c.fillText(name, lx, ly);
        }
      }

      // orbiting demo source
      if (playingRef.current) {
        const o = orbit.current;
        c.strokeStyle = 'rgba(226,172,100,0.35)';
        c.lineWidth = 2;
        c.beginPath();
        c.arc(0, 0, sr, o - 1.1 - Math.PI / 2, o - Math.PI / 2);
        c.stroke();
        const ox = Math.sin(o) * sr;
        const oy = -Math.cos(o) * sr;
        for (let k = 0; k < 2; k++) {
          const phase = (t * 0.8 + k * 0.5) % 1;
          c.strokeStyle = `rgba(226,172,100,${((1 - phase) * 0.5).toFixed(3)})`;
          c.lineWidth = 1.4;
          c.beginPath();
          c.arc(ox, oy, 6 + phase * R * 0.26, 0, TAU);
          c.stroke();
        }
        c.fillStyle = '#f0c084';
        c.beginPath();
        c.arc(ox, oy, 5, 0, TAU);
        c.fill();
        c.strokeStyle = 'rgba(240,192,132,0.35)';
        c.beginPath();
        c.arc(ox, oy, 11, 0, TAU);
        c.stroke();
      }

      // listener
      c.strokeStyle = 'rgba(207,217,228,0.16)';
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(-R * 0.07, 0);
      c.lineTo(R * 0.07, 0);
      c.moveTo(0, -R * 0.07);
      c.lineTo(0, R * 0.07);
      c.stroke();
      c.fillStyle = '#14161a';
      c.strokeStyle = 'rgba(207,217,228,0.55)';
      c.lineWidth = 1.5;
      c.beginPath();
      c.arc(0, 0, 15, 0, TAU);
      c.fill();
      c.stroke();
      c.save();
      c.rotate(f);
      c.fillStyle = '#e2ac64';
      c.beginPath();
      c.moveTo(0, -15);
      c.lineTo(-4.4, -23);
      c.lineTo(4.4, -23);
      c.closePath();
      c.fill();
      c.restore();
      c.fillStyle = 'rgba(207,217,228,0.85)';
      c.beginPath();
      c.arc(0, 0, 3, 0, TAU);
      c.fill();

      c.restore();
    };

    if (visible) {
      raf = requestAnimationFrame(frame);
    }
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [visible, reduced, azOutRef, elOutRef]);

  const steer = (clientX: number, clientY: number) => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const r = wrap.getBoundingClientRect();
    const nx = (clientX - r.left - r.width / 2) / (r.width / 2);
    const ny = (clientY - r.top - r.height / 2) / (r.height / 2);
    facing.current.target = Math.atan2(nx, -ny);
    elev.current.target = clamp(-ny, -1, 1) * 0.6;
    lastPointer.current = performance.now();
  };

  const togglePlay = () => {
    const engine = engineRef.current ?? (engineRef.current = new SpatialAudioEngine());
    if (playing) {
      engine.stop();
      setPlaying(false);
    } else {
      engine.setMuted(muted);
      void engine.start();
      setPlaying(true);
    }
  };

  return (
    <section className="section" id="sound">
      <div className="section-inner">
        <div className="sound-grid">
          <div>
            <Reveal>
              <span className="eyebrow">声学 · Soundstage</span>
              <h2 className="section-title">一个可以走进去的声场。</h2>
              <p className="section-lede">
                个性化 HRTF 扫描你的耳廓与头型，把双声道还原成有方向、有距离、有高度的空间。
                下面的声场由你掌控——移动指针，即为转头。
              </p>
            </Reveal>
            <Reveal delay={120}>
              <div className="sound-controls">
                <div className="sound-row">
                  <button
                    type="button"
                    className="toggle"
                    aria-pressed={spatial}
                    onClick={() => setSpatial((v) => !v)}
                  >
                    空间引擎
                    <span className="toggle-dot" aria-hidden />
                  </button>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={togglePlay}>
                    {playing ? <IconPause size={14} /> : <IconPlay size={14} />}
                    {playing ? '暂停演示' : '播放空间演示'}
                  </button>
                </div>
                <div className="sound-readouts" aria-live="off">
                  <span>
                    方位<b ref={azOutRef} className="mono">000°</b>
                  </span>
                  <span>
                    仰角<b ref={elOutRef} className="mono">+0°</b>
                  </span>
                  <span>
                    模式<b className="mono">{spatial ? 'HRTF' : 'STEREO'}</b>
                  </span>
                </div>
                <div className="sound-slider">
                  <label htmlFor="sound-dir">方向</label>
                  <input
                    id="sound-dir"
                    ref={sliderRef}
                    type="range"
                    min={0}
                    max={359}
                    defaultValue={0}
                    aria-label="聆听方向（度）"
                    onInput={(e) => {
                      facing.current.target = (Number(e.currentTarget.value) * Math.PI) / 180;
                      lastPointer.current = performance.now();
                    }}
                  />
                </div>
                <p className="sound-hint">
                  {muted
                    ? '声音已静音——演示以视觉模式运行。'
                    : '播放后声源将绕你一周，建议佩戴耳机体验 HRTF 定位。'}
                </p>
              </div>
            </Reveal>
          </div>
          <Reveal delay={160} className="sound-visual">
            <div
              className="sound-canvas-wrap"
              ref={wrapRef}
              tabIndex={0}
              role="img"
              aria-label="交互式空间声场可视化：移动指针或使用左右方向键改变聆听方向，上下方向键改变仰角"
              onPointerMove={(e) => steer(e.clientX, e.clientY)}
              onPointerDown={(e) => steer(e.clientX, e.clientY)}
              onKeyDown={(e) => {
                const step = Math.PI / 30;
                if (e.key === 'ArrowLeft') {
                  facing.current.target -= step;
                } else if (e.key === 'ArrowRight') {
                  facing.current.target += step;
                } else if (e.key === 'ArrowUp') {
                  elev.current.target = clamp(elev.current.target + 0.08, -0.6, 0.6);
                } else if (e.key === 'ArrowDown') {
                  elev.current.target = clamp(elev.current.target - 0.08, -0.6, 0.6);
                } else {
                  return;
                }
                e.preventDefault();
                lastPointer.current = performance.now();
              }}
            >
              <canvas ref={canvasRef} />
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
});