import { useEffect, useRef, useState } from 'react';
import { clamp, smoothstep, useReducedMotion } from '../lib/hooks';
import { Headphone } from './Headphone';
import { Reveal } from './Reveal';

const STEPS = [
  {
    no: '01',
    title: '航空铝头带',
    body: '一体成型 7 系铝梁，微弧氧化处理。312 g 的整机重量被摊薄到每一厘米头顶，夹持力经过 2,000 次头模标定。',
    specs: [
      ['材质', '7 系铝'],
      ['夹持力', '4.2 N'],
    ],
    callout: '头带 · HEADBAND',
  },
  {
    no: '02',
    title: '透明双腔体',
    body: '前腔导声，后腔调息。蓝宝石级透明腔体独立调音，让 38 mm 镀铍单元的每一次呼吸都可见、可闻、可验证。',
    specs: [
      ['单元', '38 mm 镀铍'],
      ['腔体', '双腔独立'],
    ],
    callout: '双腔体 · CHAMBER',
  },
  {
    no: '03',
    title: '记忆棉耳罩',
    body: '慢回弹记忆棉包裹蛋白皮，贴合耳廓曲线而非压迫它。磁吸快拆结构，替换只需三秒，被动隔音直达 -28 dB。',
    specs: [
      ['隔音', '-28 dB'],
      ['结构', '磁吸快拆'],
    ],
    callout: '耳罩 · CUSHION',
  },
];

export function Structure() {
  const reduced = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const visualRef = useRef<HTMLDivElement>(null);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [step, setStep] = useState(0);
  const stepRef = useRef(0);

  useEffect(() => {
    const section = sectionRef.current;
    const visual = visualRef.current;
    if (!section || !visual) return;

    const apply = (p1: number, p2: number, p3: number) => {
      visual.style.setProperty('--p1', p1.toFixed(4));
      visual.style.setProperty('--p2', p2.toFixed(4));
      visual.style.setProperty('--p3', p3.toFixed(4));
    };

    if (reduced) {
      apply(1, 1, 1);
      const io = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              const idx = Number((entry.target as HTMLElement).dataset.step);
              stepRef.current = idx;
              setStep(idx);
            }
          }
        },
        { threshold: 0.5 },
      );
      stepRefs.current.forEach((el) => el && io.observe(el));
      return () => io.disconnect();
    }

    const cur = { p1: 0, p2: 0, p3: 0 };
    let raf = 0;
    let running = false;

    const frame = () => {
      const rect = section.getBoundingClientRect();
      const span = rect.height - window.innerHeight;
      const p = span > 0 ? clamp(-rect.top / span) : 1;
      const t1 = smoothstep(clamp(p * 3));
      const t2 = smoothstep(clamp(p * 3 - 1));
      const t3 = smoothstep(clamp(p * 3 - 2));
      const k = 0.14;
      cur.p1 += (t1 - cur.p1) * k;
      cur.p2 += (t2 - cur.p2) * k;
      cur.p3 += (t3 - cur.p3) * k;
      apply(cur.p1, cur.p2, cur.p3);
      const idx = p < 1 / 3 ? 0 : p < 2 / 3 ? 1 : 2;
      if (idx !== stepRef.current) {
        stepRef.current = idx;
        setStep(idx);
      }
      if (running) raf = requestAnimationFrame(frame);
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !running) {
          running = true;
          raf = requestAnimationFrame(frame);
        } else if (!entry.isIntersecting && running) {
          running = false;
          cancelAnimationFrame(raf);
        }
      },
      { threshold: 0 },
    );
    io.observe(section);
    frame();

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      io.disconnect();
    };
  }, [reduced]);

  return (
    <section className="section" id="structure" ref={sectionRef}>
      <div className="section-inner">
        <Reveal className="section-head">
          <span className="eyebrow">结构 · Anatomy</span>
          <h2 className="section-title">把每一层，都交给耳朵检验。</h2>
          <p className="section-lede">
            向下滚动，NOCTURNE ONE 将在你眼前逐层展开——没有胶合的妥协，只有可被审视的声学。
          </p>
        </Reveal>
        <div className="structure-grid">
          <div className="structure-visual" ref={visualRef}>
            <div className="structure-glow" aria-hidden />
            <Headphone idPrefix="struct" />
            <div className="callout callout-band" data-on={step === 0}>
              <i />
              {STEPS[0].callout}
            </div>
            <div className="callout callout-chamber" data-on={step === 1}>
              <i />
              {STEPS[1].callout}
            </div>
            <div className="callout callout-cushion" data-on={step === 2}>
              <i />
              {STEPS[2].callout}
            </div>
          </div>
          <div className="structure-steps">
            {STEPS.map((s, i) => (
              <div
                key={s.no}
                className="structure-step"
                data-active={step === i}
                data-step={i}
                ref={(el) => {
                  stepRefs.current[i] = el;
                }}
              >
                <span className="step-no mono">{s.no}</span>
                <h3>{s.title}</h3>
                <p>{s.body}</p>
                <div className="step-spec">
                  {s.specs.map(([k, v]) => (
                    <span key={k}>
                      {k} <b>{v}</b>
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}