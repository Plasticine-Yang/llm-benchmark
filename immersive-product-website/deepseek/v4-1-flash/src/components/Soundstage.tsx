import { useEffect, useRef } from 'react';
import { CursorClick, Waveform, HandPointing } from '@phosphor-icons/react';
import { useInView, useReducedMotion } from '../lib/hooks';

/* ============================================================================
   Interactive soundstage. All animation lives in one rAF loop inside this
   component; React never re-renders while the field is alive.
   ========================================================================= */

const SOURCES = 18;
const RING_LAYERS = 3;

export function Soundstage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const frameRef = useRef<HTMLDivElement | null>(null);
  const azimuthRef = useRef<HTMLSpanElement | null>(null);
  const widthRef = useRef<HTMLSpanElement | null>(null);
  const sourceRef = useRef<HTMLSpanElement | null>(null);
  const reduced = useReducedMotion();
  const [sectionRef, inView] = useInView<HTMLElement>({ threshold: 0.12 });

  useEffect(() => {
    const canvas = canvasRef.current;
    const frame = frameRef.current;
    if (!canvas || !frame) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let w = 0;
    let h = 0;
    let cx = 0;
    let cy = 0;
    let R = 0;
    let raf = 0;
    let last = 0;
    let t = 0;
    let alive = true;

    // raw pointer target + eased aim, kept out of React entirely
    const ptr = { x: 0, y: 0, active: false };
    const aim = { angle: 0, spread: 0, focus: 0, mix: 0 };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = frame.getBoundingClientRect();
      w = Math.max(rect.width, 1);
      h = Math.max(rect.height, 1);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cx = w / 2;
      cy = h * 0.52;
      R = Math.min(w, h) * 0.4;
      ptr.x = cx;
      ptr.y = cy - R * 0.1;
    };

    const ro = new ResizeObserver(resize);
    ro.observe(frame);
    resize();

    const onMove = (e: PointerEvent) => {
      // offsetX/Y are relative to the canvas box: no layout read per event
      ptr.x = e.offsetX;
      ptr.y = e.offsetY;
      ptr.active = true;
    };
    const onLeave = () => {
      ptr.active = false;
      ptr.x = cx;
      ptr.y = cy - R * 0.1;
    };

    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerdown', onMove);
    canvas.addEventListener('pointerleave', onLeave);

    /* ------------------------------------------------------------ painting */
    const ringAt = (rx: number, ry: number, alpha: number, lw = 1) => {
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(206, 216, 230, ${alpha})`;
      ctx.lineWidth = lw;
      ctx.stroke();
    };

    const draw = (dt: number) => {
      if (!reduced) t += dt;

      // ease the aim toward the pointer
      const targetAngle = ptr.active
        ? Math.atan2((ptr.y - cy) / 0.42, ptr.x - cx)
        : -Math.PI / 2;
      const targetDist = ptr.active
        ? Math.min(
            1,
            Math.hypot(ptr.x - cx, (ptr.y - cy) / 0.42) / Math.max(R * 1.25, 1),
          )
        : 0.42;

      let d = targetAngle - aim.angle;
      while (d > Math.PI) d -= Math.PI * 2;
      while (d < -Math.PI) d += Math.PI * 2;
      const k = reduced ? 1 : Math.min(1, dt * 3.4);
      aim.angle += d * k;
      aim.spread += (targetDist - aim.spread) * k;
      aim.mix += ((ptr.active ? 1 : 0) - aim.mix) * Math.min(1, dt * 2.4);

      ctx.clearRect(0, 0, w, h);

      const swayX = Math.sin(aim.angle) * R * 0.06;
      const baseX = cx + swayX;

      // ---- stage bed
      const bed = ctx.createRadialGradient(
        baseX,
        cy,
        R * 0.08,
        baseX,
        cy,
        R * 1.5,
      );
      bed.addColorStop(0, 'rgba(226, 171, 97, 0.09)');
      bed.addColorStop(0.42, 'rgba(120, 138, 165, 0.05)');
      bed.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = bed;
      ctx.fillRect(0, 0, w, h);

      // ---- field rotation follows the pointer
      const rot = aim.angle * 0.22;

      // ---- outer rings (perspective ellipses)
      const rx = R * (1 + aim.spread * 0.09);
      const ry = rx * 0.42;
      ringAt(rx, ry, 0.16);
      ringAt(rx * 0.78, ry * 0.78, 0.1);
      ringAt(rx * 0.55, ry * 0.55, 0.07);

      // ---- degree ticks
      const TICKS = 72;
      for (let i = 0; i < TICKS; i++) {
        const a = (i / TICKS) * Math.PI * 2 + rot;
        const major = i % 6 === 0;
        const r1 = rx * (major ? 1.0 : 1.035);
        const r2 = rx * (major ? 1.075 : 1.055);
        ctx.beginPath();
        ctx.moveTo(baseX + Math.cos(a) * r1, cy + Math.sin(a) * r1 * 0.42);
        ctx.lineTo(baseX + Math.cos(a) * r2, cy + Math.sin(a) * r2 * 0.42);
        ctx.strokeStyle = major
          ? 'rgba(206, 216, 230, 0.34)'
          : 'rgba(206, 216, 230, 0.13)';
        ctx.lineWidth = major ? 1.1 : 0.8;
        ctx.stroke();
      }

      // ---- sources
      const step = (Math.PI * 2) / SOURCES;
      let focusIdx = 0;
      let best = Infinity;
      for (let i = 0; i < SOURCES; i++) {
        const a = i * step + rot;
        const delta = Math.abs(Math.atan2(Math.sin(a - aim.angle), Math.cos(a - aim.angle)));
        if (delta < best) {
          best = delta;
          focusIdx = i;
        }
      }

      for (let i = 0; i < SOURCES; i++) {
        const a = i * step + rot;
        const delta = Math.atan2(
          Math.sin(a - aim.angle),
          Math.cos(a - aim.angle),
        );
        const w0 = Math.exp(-(delta * delta) / (2 * 0.3 * 0.3));
        const strength = w0 * (0.35 + 0.65 * aim.mix);
        const wobble = reduced ? 0 : Math.sin(t * 1.1 + i * 0.7) * 0.035;
        const rad = rx * (0.6 + wobble) * (1 + aim.spread * 0.05);
        const sx = baseX + Math.cos(a) * rad;
        const sy = cy + Math.sin(a) * rad * 0.42;
        const size = 1.5 + strength * 3.6;

        ctx.beginPath();
        ctx.arc(sx, sy, size, 0, Math.PI * 2);
        if (strength > 0.5) {
          ctx.fillStyle = `rgba(226, 171, 97, ${0.35 + strength * 0.6})`;
        } else {
          ctx.fillStyle = `rgba(214, 224, 238, ${0.14 + strength * 0.5})`;
        }
        ctx.fill();

        if (strength > 0.32) {
          ctx.beginPath();
          ctx.arc(sx, sy, size + 4.5, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(226, 171, 97, ${strength * 0.32})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }

      // ---- wavefronts radiating from the focused source
      if (aim.mix > 0.02) {
        for (let l = 0; l < RING_LAYERS; l++) {
          const phase = reduced
            ? (l + 1) / (RING_LAYERS + 1)
            : (t * 0.34 + l / RING_LAYERS) % 1;
          const rr = rx * (0.62 + phase * 0.46);
          ctx.beginPath();
          ctx.ellipse(baseX, cy, rr, rr * 0.42, 0, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(226, 171, 97, ${
            (1 - phase) * (1 - phase) * 0.34 * aim.mix
          })`;
          ctx.lineWidth = 1.1;
          ctx.stroke();
        }
      }

      // ---- beam from the head to the focused source
      const fa = focusIdx * step + rot;
      const fr = rx * 0.6;
      const fx = baseX + Math.cos(fa) * fr;
      const fy = cy + Math.sin(fa) * fr * 0.42;
      const beam = ctx.createLinearGradient(baseX, cy, fx, fy);
      beam.addColorStop(0, 'rgba(226, 171, 97, 0.02)');
      beam.addColorStop(1, `rgba(226, 171, 97, ${0.42 * aim.mix})`);
      ctx.beginPath();
      ctx.moveTo(baseX, cy);
      ctx.lineTo(fx, fy);
      ctx.strokeStyle = beam;
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 5]);
      ctx.stroke();
      ctx.setLineDash([]);

      // travelling transient
      const travel = reduced ? 0.7 : (t * 0.5) % 1;
      ctx.beginPath();
      ctx.arc(
        baseX + (fx - baseX) * travel,
        cy + (fy - cy) * travel,
        2.4,
        0,
        Math.PI * 2,
      );
      ctx.fillStyle = `rgba(240, 205, 150, ${0.85 * aim.mix})`;
      ctx.fill();

      // ---- listener head at the centre
      const headR = R * 0.13;
      ctx.beginPath();
      ctx.arc(baseX, cy, headR, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(16, 19, 24, 0.92)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(214, 224, 238, 0.34)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // ears
      for (const s of [-1, 1]) {
        ctx.beginPath();
        ctx.arc(baseX + s * headR, cy, headR * 0.26, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(10, 12, 15, 0.95)';
        ctx.fill();
        ctx.strokeStyle = `rgba(226, 171, 97, ${0.2 + aim.mix * 0.45})`;
        ctx.stroke();
      }

      // forward axis
      ctx.beginPath();
      ctx.moveTo(baseX, cy);
      ctx.lineTo(
        baseX + Math.cos(-Math.PI / 2) * headR * 2.1,
        cy + Math.sin(-Math.PI / 2) * headR * 2.1,
      );
      ctx.strokeStyle = `rgba(226, 171, 97, ${0.28 + aim.mix * 0.3})`;
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // ---- readouts (throttled, written straight to the DOM)
      if (nowTick % 6 === 0) {
        const deg = ((aim.angle * 180) / Math.PI + 450) % 360;
        if (azimuthRef.current) {
          azimuthRef.current.textContent = `${deg.toFixed(0).padStart(3, '0')}°`;
        }
        if (widthRef.current) {
          widthRef.current.textContent = `${(118 + aim.spread * 46).toFixed(0)} cm`;
        }
        if (sourceRef.current) {
          sourceRef.current.textContent = `S${String(focusIdx + 1).padStart(2, '0')}`;
        }
      }
    };

    let nowTick = 0;
    const loop = (now: number) => {
      if (!alive) return;
      const dt = last ? Math.min((now - last) / 1000, 0.05) : 0.016;
      last = now;
      nowTick++;
      draw(dt);
      raf = requestAnimationFrame(loop);
    };

    const start = () => {
      if (raf || !alive) return;
      last = 0;
      raf = requestAnimationFrame(loop);
    };
    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };

    // static frame for reduced-motion visitors
    if (reduced) {
      draw(0);
      const onStaticMove = () => draw(0);
      canvas.addEventListener('pointermove', onStaticMove);
      return () => {
        alive = false;
        canvas.removeEventListener('pointermove', onStaticMove);
        canvas.removeEventListener('pointermove', onMove);
        canvas.removeEventListener('pointerdown', onMove);
        canvas.removeEventListener('pointerleave', onLeave);
        ro.disconnect();
      };
    }

    if (inView) start();

    return () => {
      alive = false;
      stop();
      ro.disconnect();
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerdown', onMove);
      canvas.removeEventListener('pointerleave', onLeave);
    };
  }, [reduced, inView]);

  return (
    <section className="sound section" id="sound" ref={sectionRef}>
      <div className="shell sound__grid">
        <div className="sound__copy">
          <p className="t-eyebrow section__eyebrow reveal" data-shown={inView}>
            <span className="section__idx mono">02</span> 声音 / SOUND
          </p>
          <h2 className="t-h2 section__title reveal" data-shown={inView} data-delay="1">
            一个只属于
            <br />
            你的声场。
          </h2>
          <p className="t-body section__lede reveal" data-shown={inView} data-delay="2">
            NOCTURNE ONE 采集耳廓与耳道特征，在耳机内实时演算专属 HRTF 传递函数。
            声音不再贴在耳朵上，而是被放置在你周围的坐标里 —— 转头，它留在原地。
          </p>

          <ul className="sound__list">
            {[
              {
                n: '01',
                t: '透明双腔体',
                d: '前后腔体独立调谐，消除驻波，让低频有下潜而没有轰鸣。',
              },
              {
                n: '02',
                t: '头部动态追踪',
                d: '六轴姿态采样，端到端延迟低于 20 ms，空间锚点几乎不漂移。',
              },
              {
                n: '03',
                t: '个性化 HRTF',
                d: '3 分钟听力与耳廓建模，生成只对你这副耳朵成立的声场曲线。',
              },
            ].map((f, i) => (
              <li
                key={f.n}
                className="sound__item reveal"
                data-shown={inView}
                data-delay={String(i + 1) as '1'}
              >
                <span className="sound__item-n mono">{f.n}</span>
                <div>
                  <h3 className="t-h3 sound__item-t">{f.t}</h3>
                  <p className="sound__item-d">{f.d}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="sound__viz reveal" data-shown={inView} data-delay="2">
          <div className="viz glass" ref={frameRef}>
            <canvas ref={canvasRef} className="viz__canvas" aria-hidden="true" />
            <div className="viz__hint mono">
              <HandPointing size={13} weight="light" />
              移动光标 · 感受声场指向
            </div>

            <div className="viz__readout">
              <div className="viz__stat">
                <span className="viz__stat-k mono">方位角</span>
                <span className="viz__stat-v num" ref={azimuthRef}>
                  270°
                </span>
              </div>
              <span className="viz__stat-sep" />
              <div className="viz__stat">
                <span className="viz__stat-k mono">声场宽度</span>
                <span className="viz__stat-v num" ref={widthRef}>
                  138 cm
                </span>
              </div>
              <span className="viz__stat-sep" />
              <div className="viz__stat">
                <span className="viz__stat-k mono">锁定声源</span>
                <span className="viz__stat-v num viz__stat-v--accent" ref={sourceRef}>
                  S01
                </span>
              </div>
            </div>

            <div className="viz__legend mono">
              <span className="viz__legend-item">
                <Waveform size={12} weight="light" /> 18 声道虚拟阵列
              </span>
              <span className="viz__legend-item">
                <CursorClick size={12} weight="light" /> 实时 HRTF 演算
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
