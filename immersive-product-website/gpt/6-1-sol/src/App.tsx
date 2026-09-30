import { useEffect, useState } from "react";
import type { MouseEvent } from "react";
import { Headphones } from "./components/Headphones";
import { Icon } from "./components/Icon";
import { MagneticButton } from "./components/MagneticButton";
import { Soundstage } from "./components/Soundstage";
import { Structure } from "./components/Structure";
import { Reservation } from "./components/Reservation";
import type { ReservationRequest } from "./components/Reservation";
import { DesignStory } from "./components/DesignStory";
import { Navigation } from "./components/Navigation";

const colors = [
  {
    name: "Obsidian",
    chinese: "曜石黑",
    className: "obsidian",
    hex: "#48504f",
  },
  { name: "Mist Silver", chinese: "雾银", className: "silver", hex: "#bac2bd" },
  {
    name: "Burnt Amber",
    chinese: "灼琥珀",
    className: "amber",
    hex: "#a9805d",
  },
];

export default function App() {
  const [color, setColor] = useState(1);
  const [request, setRequest] = useState<ReservationRequest | null>(null);
  const [story, setStory] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) =>
          entry.target.classList.toggle("visible", entry.isIntersecting),
        ),
      { threshold: 0.12 },
    );
    document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
  function reserve(
    e: MouseEvent<HTMLButtonElement>,
    mode: "reserve" | "purchase" = "reserve",
  ) {
    const b = e.currentTarget.getBoundingClientRect();
    setRequest({ x: b.left + b.width / 2, y: b.top + b.height / 2, mode });
  }
  return (
    <div className={`site color-${colors[color].className}`}>
      <a className="skip-link" href="#main">
        跳至主要内容
      </a>
      <div className="top-sentinel" />
      <Navigation />
      <main id="main">
        <section className="hero min-h-[100dvh]" aria-labelledby="hero-heading">
          <div className="hero-atmosphere" />
          <span className="hero-watermark" aria-hidden="true">
            N / 01
          </span>
          <div className="hero-copy">
            <div className="launch-label entrance">
              <span className="amber-dot" /> A NEW DIMENSION OF LISTENING
              <span className="label-rule" />
            </div>
            <p className="hero-product-name entrance">
              NOCTURNE <span>ONE</span>
            </p>
            <h1 className="entrance" id="hero-heading">
              听见空间，
              <br />
              <span>而不只是声音。</span>
            </h1>
            <p className="hero-description entrance">
              NOCTURNE ONE 以透明双腔体、个性化 HRTF 与 42
              小时续航，重新定义私人声场。
            </p>
            <div className="hero-actions entrance">
              <MagneticButton onClick={reserve}>预约试听</MagneticButton>
              <button className="story-button" onClick={() => setStory(true)}>
                <span className="round-icon">
                  <Icon name="play" size={15} />
                </span>
                <span>观看 90 秒设计故事</span>
              </button>
            </div>
            <div className="hero-edition entrance">
              <span>DESIGNED FOR THE WAY YOU HEAR.</span>
              <span>首发限量 / 2026</span>
            </div>
          </div>
          <div className="hero-installation entrance">
            <div className="installation-orbit orbit-back" />
            <div className="installation-orbit orbit-front" />
            <div className="product-shadow" />
            <div className="levitating-product">
              <Headphones />
              <div className="light-sweep" />
            </div>
            <div className="hud hud-battery glass">
              <div className="hud-top">
                <span className="battery-icon" /> ALL-DAY FREEDOM
              </div>
              <strong>
                42<span>h</span>
              </strong>
              <span className="hud-caption">让时间，慢下来。</span>
              <div className="battery-line">
                <i />
                <i />
                <i />
                <i />
                <i />
                <i />
                <i />
                <i />
                <i />
                <i />
              </div>
            </div>
            <div className="hud hud-spatial glass">
              <div className="hud-spatial-icon">
                <i />
                <i />
                <i />
              </div>
              <div>
                <span className="hud-top">PERSONALIZED HRTF</span>
                <strong>Spatial Engine</strong>
                <span className="hud-caption">
                  <span className="amber-dot" /> 沉浸式空间音频
                </span>
              </div>
            </div>
            <div className="hud hud-driver glass">
              <span className="hud-top">ACOUSTIC PRECISION</span>
              <strong>
                38<span>mm</span>
              </strong>
              <span className="hud-caption">高解析动圈单元</span>
            </div>
            <div className="installation-caption">
              <span className="cross-mark">+</span>
              <span>TRANSPARENT DUAL CHAMBER</span>
              <span>FIG. 01</span>
            </div>
          </div>
          <div className="hero-bottom">
            <a className="scroll-cue" href="#sound">
              <span className="scroll-line" />
              向下探索<span>SCROLL TO DISCOVER</span>
            </a>
            <span className="hero-bottom-note">
              EXPERIENCE SOUND. IN A NEW LIGHT.
            </span>
            <span className="hero-index">01 — 04</span>
          </div>
        </section>
        <div className="manifesto-strip">
          <span>LESS NOISE.</span>
          <span className="strip-line" />
          <p>
            把世界调低。<span>把自己听清。</span>
          </p>
          <span className="strip-line" />
          <span>MORE FEELING.</span>
        </div>
        <Soundstage />
        <Structure />
        <section className="finish-section section-shell" id="purchase">
          <div className="section-topline">
            <span>03 / THE EXPRESSION</span>
            <span>YOUR SOUND. YOUR SHADE.</span>
          </div>
          <div className="finish-layout">
            <div className="finish-visual reveal">
              <span className="finish-large-number">ONE.</span>
              <div className="finish-ambient" />
              <Headphones />
              <div className="finish-caption">
                <span>NOCTURNE ONE</span>
                <span>0{color + 1} / 03</span>
              </div>
            </div>
            <div className="finish-copy reveal">
              <p className="eyebrow">THREE SHADES. ONE PHILOSOPHY.</p>
              <h2>
                你的声音。
                <br />
                你的表达。
              </h2>
              <p className="body-copy">
                三种色彩，同一种克制。让精密工艺融入你的日常，也让每一次聆听，都带着你的个性。
              </p>
              <div
                className="color-options"
                role="group"
                aria-label="选择耳机配色"
              >
                {colors.map((c, i) => (
                  <button
                    key={c.name}
                    onClick={() => setColor(i)}
                    aria-label={`${c.name} ${c.chinese}`}
                    aria-pressed={color === i}
                    className={`color-option ${color === i ? "selected" : ""}`}
                  >
                    <span
                      className="color-swatch"
                      style={{ background: c.hex }}
                    >
                      {color === i && <Icon name="check" size={17} />}
                    </span>
                    <span>{c.name}</span>
                  </button>
                ))}
              </div>
              <div className="selected-finish" aria-live="polite">
                <span>{colors[color].chinese}</span>
                <span>精密阳极氧化铝 / 透明声学腔体</span>
              </div>
              <div className="purchase-line">
                <div>
                  <span className="eyebrow">LAUNCH PRICE</span>
                  <strong>¥3,499</strong>
                </div>
                <MagneticButton onClick={(e) => reserve(e, "purchase")}>
                  预约购买
                </MagneticButton>
              </div>
              <p className="purchase-note">
                含专属收纳盒、USB-C 充电线与 2 年有限保修
              </p>
            </div>
          </div>
        </section>
        <section className="spec-section section-shell" id="specifications">
          <div className="section-topline">
            <span>04 / THE SPECIFICATIONS</span>
            <span>PRECISION, IN NUMBERS.</span>
          </div>
          <div className="spec-layout">
            <div className="spec-heading reveal">
              <p className="eyebrow">EVERY DETAIL MATTERS.</p>
              <h2>
                每一个数字，
                <br />
                都有回响。
              </h2>
              <p>为日常而设计。为声音而精密。</p>
              <div className="spec-mark">
                N<span>01</span>
              </div>
            </div>
            <dl className="spec-table reveal">
              <div>
                <dt>
                  <span>01</span>驱动单元
                </dt>
                <dd>
                  38 <small>mm</small>
                  <span>高解析动圈</span>
                </dd>
              </div>
              <div>
                <dt>
                  <span>02</span>耳机重量
                </dt>
                <dd>
                  312 <small>g</small>
                </dd>
              </div>
              <div>
                <dt>
                  <span>03</span>无线连接
                </dt>
                <dd>
                  Bluetooth <small>5.4</small>
                </dd>
              </div>
              <div>
                <dt>
                  <span>04</span>电池续航
                </dt>
                <dd>
                  42 <small>h</small>
                  <span>音乐，不间断</span>
                </dd>
              </div>
              <div>
                <dt>
                  <span>05</span>快速充电
                </dt>
                <dd>
                  10 <small>min</small>
                  <span>续听 6 小时</span>
                </dd>
              </div>
              <div>
                <dt>
                  <span>06</span>空间音频
                </dt>
                <dd>
                  Personal HRTF<span>你的专属声场</span>
                </dd>
              </div>
            </dl>
          </div>
          <p className="spec-footnote">
            *
            续航与快充数据基于实验室测试环境。实际表现因音量、连接方式与使用环境而异。
          </p>
        </section>
        <section className="closing-section">
          <span className="eyebrow">THE WORLD CAN WAIT.</span>
          <h2>此刻，只为聆听。</h2>
          <MagneticButton onClick={reserve}>开启你的试听</MagneticButton>
          <div className="closing-lines" />
        </section>
      </main>
      <footer className="footer section-shell">
        <div className="footer-top">
          <div>
            <span className="eyebrow">AN INSTRUMENT FOR YOUR INNER WORLD.</span>
            <p>
              给声音以空间。
              <br />
              给自己以片刻。
            </p>
          </div>
          <div className="footer-edition">
            <span>THE NOCTURNE JOURNAL</span>
            <strong>VOL. 001</strong>
            <span>SHANGHAI · EST. 2026</span>
          </div>
        </div>
        <a className="footer-wordmark" href="#" aria-label="回到顶部">
          NOCTURNE<span>®</span>
        </a>
        <div className="footer-bottom">
          <span>© 2026 NOCTURNE AUDIO</span>
          <span>精于声。简于形。</span>
          <a href="#">
            BACK TO TOP <span>↗</span>
          </a>
        </div>
      </footer>
      <Reservation
        request={request}
        onClose={() => setRequest(null)}
        color={colors[color].name}
      />
      <DesignStory open={story} onClose={() => setStory(false)} />
    </div>
  );
}
