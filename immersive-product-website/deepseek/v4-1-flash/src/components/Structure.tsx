import { useCallback, useRef } from 'react';
import { Exploded } from './product/Exploded';
import { useMediaQuery, useRangeProgress, useReducedMotion } from '../lib/hooks';

const STAGES = [
  {
    n: 'A',
    t: '头梁与滑轨',
    d: '一体成型镁铝合金头梁，内嵌记忆棉衬垫。滑轨以 2 mm 步进无级调节，夹持力恒定在 4.2 N，戴满 42 小时也不会留下压痕。',
    meta: ['镁铝合金', '4.2 N 夹持力', '2 mm 无级滑轨'],
  },
  {
    n: 'B',
    t: '透明声学腔体',
    d: '前后腔体彼此独立：38 mm 铍振膜驱动单元居中，后方腔体负责低频泄压，前方腔体抑制驻波。你能直接看到声音被组织的过程。',
    meta: ['38 mm 铍振膜', '双腔体解耦', '0.02% 谐波失真'],
  },
  {
    n: 'C',
    t: '耳罩外壳',
    d: 'CNC 切削的铝合金外壳，阳极氧化后逐件抛光。内侧包覆慢回弹记忆棉与蛋白皮耳垫，形成被动的第一道隔音层。',
    meta: ['CNC 阳极氧化', '慢回弹耳垫', '-32 dB 被动隔音'],
  },
];

export function Structure() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const reduced = useReducedMotion();
  const compact = useMediaQuery('(max-width: 767px)');
  // on phones and for reduced-motion the section renders fully exploded
  const staticMode = reduced || compact;

  const onProgress = useCallback((p: number) => {
    const el = sectionRef.current;
    if (el) el.style.setProperty('--p', p.toFixed(4));
  }, []);

  useRangeProgress(sectionRef, onProgress, {
    enabled: !staticMode,
    mode: 'sticky',
  });

  return (
    <section
      className="structure section"
      id="structure"
      ref={sectionRef}
      style={{ '--p': staticMode ? 1 : 0 } as React.CSSProperties}
    >
      <div className="structure__sticky">
        <div className="shell structure__inner">
          <header className="structure__head">
            <p className="t-eyebrow section__eyebrow">
              <span className="section__idx mono">03</span> 结构 / STRUCTURE
            </p>
            <h2 className="t-h2 structure__title">
              拆开看，
              <br />
              它才说得通。
            </h2>
          </header>

          <div className="structure__body">
            <div className="structure__rail" aria-hidden="true">
              <span className="structure__rail-line">
                <span className="structure__rail-fill" />
              </span>
              {STAGES.map((s, i) => (
                <span
                  key={s.n}
                  className={`structure__rail-node structure__rail-node--${i + 1}`}
                >
                  <b className="mono">{s.n}</b>
                </span>
              ))}
            </div>

            <div className="structure__stage">
              <Exploded />
            </div>

            <div className="structure__copy">
              {STAGES.map((s, i) => (
                <article
                  key={s.n}
                  className={`structure__copy-item structure__copy-item--${i + 1}`}
                >
                  <p className="structure__copy-idx mono">
                    <b>{s.n}</b> / 0{STAGES.length}
                  </p>
                  <h3 className="t-h3 structure__copy-title">{s.t}</h3>
                  <p className="t-body structure__copy-body">{s.d}</p>
                  <ul className="structure__meta">
                    {s.meta.map((m) => (
                      <li key={m} className="mono">
                        {m}
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
