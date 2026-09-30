import { useEffect, useRef, useState } from 'react';
import { Play, ArrowRight, ArrowDown } from '@phosphor-icons/react';
import { useMagnetic } from '../lib/hooks';
import { useReservation } from '../lib/reservation';
import { ProductStage } from './ProductStage';
import { DesignStory } from './DesignStory';

export function Hero({ entered }: { entered: boolean }) {
  const magnetic = useMagnetic<HTMLSpanElement>(0.24, 14);
  const { open } = useReservation();
  const [story, setStory] = useState<{ id: number; origin: DOMRect } | null>(null);
  const storyBtn = useRef<HTMLButtonElement | null>(null);

  const openStory = () => {
    const el = storyBtn.current;
    setStory({
      id: performance.now(),
      origin: el
        ? el.getBoundingClientRect()
        : new DOMRect(window.innerWidth / 2, window.innerHeight / 2, 0, 0),
    });
  };

  const closeStory = () => setStory(null);

  /* Restore focus only once the overlay has unmounted: the story sets
     `inert` on the app shell, so focusing any earlier would silently fail. */
  const hadStory = useRef(false);
  useEffect(() => {
    if (story) {
      hadStory.current = true;
      return;
    }
    if (hadStory.current) {
      hadStory.current = false;
      storyBtn.current?.focus();
    }
  }, [story]);

  return (
    <section className="hero" id="top" data-entered={entered ? 'true' : 'false'}>
      <div className="hero__grid shell">
        <div className="hero__copy">
          <p className="hero__eyebrow anim anim--1">
            <span className="hero__eyebrow-line" />
            <span className="mono">NOCTURNE ONE — 空间音频耳机</span>
          </p>

          <h1 className="hero__title t-display metal-text">
            <span className="anim anim--2">听见空间，</span>
            <span className="anim anim--3">而不只是声音。</span>
          </h1>

          <p className="hero__lede t-lede anim anim--4">
            NOCTURNE ONE 以透明双腔体、个性化 HRTF 与 42 小时续航，重新定义私人声场。
          </p>

          <div className="hero__cta">
            <span className="magnetic anim anim--5" ref={magnetic}>
              <button
                type="button"
                className="btn btn--primary hero__primary"
                onClick={(e) => open(e.currentTarget)}
              >
                <span className="btn__label">预约试听</span>
                <span className="btn__icon" aria-hidden="true">
                  <ArrowRight size={15} weight="bold" />
                </span>
              </button>
            </span>

            <button
              type="button"
              className="btn btn--ghost hero__secondary anim anim--6"
              ref={storyBtn}
              onClick={openStory}
              aria-haspopup="dialog"
            >
              <span className="btn__icon" aria-hidden="true">
                <Play size={13} weight="fill" />
              </span>
              <span className="btn__label">观看 90 秒设计故事</span>
            </button>
          </div>
        </div>

        <div className="hero__stage anim anim--stage">
          <ProductStage />
        </div>
      </div>

      <div className="hero__foot shell">
        <div className="hero__facts anim anim--7">
          <div className="fact">
            <span className="fact__k mono">首发价</span>
            <span className="fact__v num">¥3,499</span>
          </div>
          <span className="fact__sep" />
          <div className="fact">
            <span className="fact__k mono">首批限量</span>
            <span className="fact__v num">500 台</span>
          </div>
          <span className="fact__sep" />
          <div className="fact">
            <span className="fact__k mono">发售</span>
            <span className="fact__v">2025 秋季</span>
          </div>
        </div>

        <a className="hero__scroll anim anim--8" href="#sound" aria-label="向下滚动至声音章节">
          <span className="mono">向下滚动</span>
          <span className="hero__scroll-track" aria-hidden="true">
            <span className="hero__scroll-dot" />
          </span>
          <ArrowDown size={12} weight="light" aria-hidden="true" />
        </a>
      </div>

      {story && (
        <DesignStory key={story.id} origin={story.origin} onClose={closeStory} />
      )}
    </section>
  );
}
