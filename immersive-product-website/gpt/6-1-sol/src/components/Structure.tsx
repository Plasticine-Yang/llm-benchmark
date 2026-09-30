import { useEffect, useRef, useState } from "react";
import { Headphones } from "./Headphones";

const layers = [
  {
    number: "01",
    label: "THE TRANSPARENT CHAMBER",
    title: "让声音，自由呼吸。",
    copy: "透明双腔体将驱动与气流精密分区。以可见的秩序，释放不可见的声学潜能。",
    detail: "双腔体声学结构 / 精密气流控制",
  },
  {
    number: "02",
    label: "THE ACOUSTIC CORE",
    title: "细节，不必大声。",
    copy: "38 mm 高解析驱动单元，呈现细腻的人声与有分寸的低频。每一次振动，都忠于录音本身。",
    detail: "38 mm 动圈单元 / 高解析振膜",
  },
  {
    number: "03",
    label: "THE HUMAN CONNECTION",
    title: "存在，却没有负担。",
    copy: "轻量金属头梁与柔软环抱式耳垫，精准分配每一克重量。戴得更久，才能听得更远。",
    detail: "312 g 精密配重 / 环抱式记忆耳垫",
  },
];
export function Structure() {
  const root = useRef<HTMLElement>(null);
  const [layer, setLayer] = useState(0);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting)
            setLayer(Number((entry.target as HTMLElement).dataset.layer));
        }),
      { rootMargin: "-30% 0px -35% 0px", threshold: 0 },
    );
    root.current
      ?.querySelectorAll("[data-layer]")
      .forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
  return (
    <section
      className="structure-section section-shell"
      id="structure"
      ref={root}
    >
      <div className="section-topline">
        <span>02 / THE STRUCTURE</span>
        <span>NOTHING TO HIDE.</span>
      </div>
      <div className="structure-layout">
        <div className="structure-sticky">
          <div className="structure-title">
            <p className="eyebrow">ENGINEERED TO BE SEEN</p>
            <h2>
              精密，
              <br />
              不止于表面。
            </h2>
          </div>
          <div className="structure-installation">
            <div className="technical-grid" />
            <Headphones exploded={layer + 1} />
            <span className="structure-tag">EXPLODED VIEW — 0{layer + 1}</span>
          </div>
          <div
            className="layer-indicators"
            role="group"
            aria-label="产品结构分层"
          >
            {layers.map((l, i) => (
              <button
                aria-label={l.title}
                aria-pressed={layer === i}
                key={l.number}
                className={layer === i ? "selected" : ""}
                onClick={() => {
                  setLayer(i);
                  root.current
                    ?.querySelector(`[data-layer="${i}"]`)
                    ?.scrollIntoView({
                      behavior: matchMedia("(prefers-reduced-motion: reduce)")
                        .matches
                        ? "instant"
                        : "smooth",
                      block: "center",
                    });
                }}
              >
                {l.number}
              </button>
            ))}
          </div>
        </div>
        <div className="structure-steps">
          {layers.map((l) => (
            <article
              className="structure-step"
              data-layer={Number(l.number) - 1}
              key={l.number}
            >
              <span className="step-number">{l.number}</span>
              <p className="eyebrow">{l.label}</p>
              <h3>{l.title}</h3>
              <p className="body-copy">{l.copy}</p>
              <div className="structure-detail">
                <span className="amber-dot" />
                {l.detail}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
