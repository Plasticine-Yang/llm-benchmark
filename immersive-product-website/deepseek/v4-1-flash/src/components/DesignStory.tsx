import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { Pause, Play, X, ArrowCounterClockwise } from '@phosphor-icons/react';
import { Headphones } from './product/Headphones';

/* ============================================================================
   The 90-second design story. Self-contained: five chapters, each reframing
   the same SVG instrument. The timeline runs on one rAF loop that writes a
   single custom property and the clock text straight to the DOM.
   ========================================================================= */

const CHAPTER_SECONDS = 18;

type Chapter = {
  t: string;
  head: string;
  body: string;
  /** viewBox framing of the near earcup for this chapter */
  view: string;
  /** 0 = assembled, 1 = pulled apart */
  tilt: number;
};

const CHAPTERS: Chapter[] = [
  {
    t: '00:00',
    head: '一间没有反射的房间',
    body: '我们在消声室里坐了 400 个小时。不是听音乐，是听空白——直到确认腔体本身不会说话，才允许它开始发声。',
    view: '0 0 860 800',
    tilt: 0,
  },
  {
    t: '00:18',
    head: '透明，是因为没什么好藏的',
    body: '前后腔体解耦之后，低频有了泄压的出口。把外壳做成透明，是想让你看见声音被组织的过程，而不是相信一句广告语。',
    view: '392 250 420 400',
    tilt: 0.2,
  },
  {
    t: '00:36',
    head: '38 毫米的铍',
    body: '铍的刚性是铝的六倍。振膜越不容易变形，你听到的就越是录音里的那一次振动，而不是它变形之后的样子。',
    view: '500 356 232 216',
    tilt: 0.45,
  },
  {
    t: '00:54',
    head: '42 小时，是因为忘了充电',
    body: '我们把待机功耗压到 0.4 毫瓦。目标不是续航数字好看，而是让你摘下耳机时，不必记得上一次充电是哪一天。',
    view: '150 120 700 640',
    tilt: 0.65,
  },
  {
    t: '01:12',
    head: '你的耳朵，不是平均值',
    body: '每个人的耳廓都不同，所以每个人的声场也不同。三分钟建模，一条只对你这副耳朵成立的传递函数。',
    view: '0 0 860 800',
    tilt: 1,
  },
];

const TOTAL = CHAPTERS.length * CHAPTER_SECONDS;
const fmt = (s: number) =>
  `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(
    Math.floor(s % 60),
  ).padStart(2, '0')}`;

export function DesignStory({
  origin,
  onClose,
}: {
  origin: DOMRect | null;
  onClose: () => void;
}) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const clockRef = useRef<HTMLSpanElement | null>(null);
  const playBtnRef = useRef<HTMLButtonElement | null>(null);

  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [playing, setPlaying] = useState(true);
  const [chapter, setChapter] = useState(0);
  const [ended, setEnded] = useState(false);

  const raf = useRef(0);
  const origin_ts = useRef(0);
  const elapsedBefore = useRef(0);
  const elapsed = useRef(0);

  /* --------------------------------------------------- grow out of the CTA */
  useLayoutEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    const r = panel.getBoundingClientRect();
    const ox = origin ? origin.left + origin.width / 2 - r.left : r.width / 2;
    const oy = origin ? origin.top + origin.height / 2 - r.top : r.height / 2;
    panel.style.setProperty('--ox', `${ox.toFixed(1)}px`);
    panel.style.setProperty('--oy', `${oy.toFixed(1)}px`);
    const id = requestAnimationFrame(() => setOpen(true));
    return () => cancelAnimationFrame(id);
  }, [origin]);

  const close = useCallback(() => {
    setClosing(true);
    window.setTimeout(onClose, 240);
  }, [onClose]);

  /* ------------------------------------------- scroll lock + inert backdrop */
  useEffect(() => {
    const app = document.getElementById('app-shell');
    document.body.dataset.locked = 'true';
    app?.setAttribute('aria-hidden', 'true');
    app?.setAttribute('inert', '');
    return () => {
      delete document.body.dataset.locked;
      app?.removeAttribute('aria-hidden');
      app?.removeAttribute('inert');
    };
  }, []);

  /* ----------------------------------------------------- focus + keyboard */
  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    const id = window.setTimeout(() => playBtnRef.current?.focus(), 220);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        close();
        return;
      }
      if (e.key === ' ' || e.key === 'k') {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === 'BUTTON') return;
        e.preventDefault();
        setPlaying((v) => !v);
        return;
      }
      if (e.key !== 'Tab') return;
      const nodes = Array.from(
        panel.querySelectorAll<HTMLElement>('button:not([disabled])'),
      ).filter((n) => n.offsetParent !== null);
      if (!nodes.length) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      } else if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      }
    };

    document.addEventListener('keydown', onKey);
    return () => {
      window.clearTimeout(id);
      document.removeEventListener('keydown', onKey);
    };
  }, [close]);

  /* ---------------------------------------------------------- the timeline */
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const paint = (value: number) => {
      root.style.setProperty('--t', (value / TOTAL).toFixed(4));
      if (clockRef.current) clockRef.current.textContent = fmt(value);
    };

    if (!playing) {
      elapsedBefore.current = elapsed.current;
      paint(elapsed.current);
      return;
    }

    origin_ts.current = performance.now() - elapsedBefore.current * 1000;

    const step = (now: number) => {
      const value = Math.min((now - origin_ts.current) / 1000, TOTAL);
      elapsed.current = value;
      paint(value);

      const idx = Math.min(
        CHAPTERS.length - 1,
        Math.floor(value / CHAPTER_SECONDS),
      );
      setChapter((prev) => (prev === idx ? prev : idx));

      if (value >= TOTAL) {
        setEnded(true);
        setPlaying(false);
        return;
      }
      raf.current = requestAnimationFrame(step);
    };

    raf.current = requestAnimationFrame(step);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
      raf.current = 0;
    };
  }, [playing]);

  const jump = (i: number) => {
    const value = i * CHAPTER_SECONDS;
    elapsed.current = value;
    elapsedBefore.current = value;
    origin_ts.current = performance.now() - value * 1000;
    setChapter(i);
    setEnded(false);
    setPlaying(true);
  };

  const toggle = () => {
    if (ended) {
      elapsed.current = 0;
      elapsedBefore.current = 0;
      setChapter(0);
      setEnded(false);
      setPlaying(true);
      return;
    }
    setPlaying((v) => !v);
  };

  const active = CHAPTERS[chapter];
  const pct = ((chapter + 1) / CHAPTERS.length) * 100;

  return createPortal(
    <div
      className="story"
      data-open={open ? 'true' : 'false'}
      data-closing={closing ? 'true' : 'false'}
      data-playing={playing ? 'true' : 'false'}
      ref={rootRef}
    >
      <button
        type="button"
        className="story__scrim"
        aria-label="关闭设计故事"
        tabIndex={-1}
        onClick={close}
      />

      <div
        className="story__panel glass"
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="story-title"
      >
        <header className="story__head">
          <p className="story__eyebrow mono">设计故事 / THE DESIGN STORY</p>
          <h2 className="story__heading" id="story-title">
            {active.head}
          </h2>
          <button
            type="button"
            className="story__close"
            onClick={close}
            aria-label="关闭设计故事"
          >
            <X size={16} weight="light" />
          </button>
        </header>

        <div className="story__frame">
          <span className="story__wash" aria-hidden="true" />
          <span
            className="story__bars"
            aria-hidden="true"
            style={{ ['--tilt' as string]: active.tilt }}
          />

          <div className="story__stage">
            <span className="story__index mono" aria-hidden="true">
              {String(chapter + 1).padStart(2, '0')} /{' '}
              {String(CHAPTERS.length).padStart(2, '0')}
            </span>
            <div className="story__product" key={`v-${chapter}`}>
              <Headphones className="story__svg" viewBox={active.view} />
            </div>
          </div>

          <div className="story__caption">
            <span className="story__stamp mono">{active.t}</span>
            <p className="story__body" key={`b-${chapter}`}>
              {active.body}
            </p>
            <span className="story__rule" aria-hidden="true" />
          </div>
        </div>

        <div className="story__transport">
          <button
            type="button"
            className="story__play"
            onClick={toggle}
            ref={playBtnRef}
            aria-label={ended ? '重播设计故事' : playing ? '暂停' : '播放'}
          >
            {ended ? (
              <ArrowCounterClockwise size={15} weight="bold" />
            ) : playing ? (
              <Pause size={15} weight="fill" />
            ) : (
              <Play size={15} weight="fill" />
            )}
          </button>

          <div className="story__track" role="group" aria-label="章节">
            <span className="story__track-rail" aria-hidden="true">
              <span className="story__track-fill" />
            </span>
            {CHAPTERS.map((c, i) => (
              <button
                key={c.t}
                type="button"
                className="story__tick"
                data-active={i === chapter ? 'true' : 'false'}
                data-passed={i < chapter ? 'true' : 'false'}
                style={{ left: `${(i / (CHAPTERS.length - 1)) * 100}%` }}
                onClick={() => jump(i)}
                aria-label={`跳到第 ${i + 1} 章 · ${c.head}`}
                aria-current={i === chapter ? 'true' : undefined}
              >
                <span className="story__tick-dot" aria-hidden="true" />
                <span className="story__tick-label mono">{c.t}</span>
              </button>
            ))}
          </div>

          <span className="story__clock mono">
            <span ref={clockRef}>00:00</span> / {fmt(TOTAL)}
          </span>
        </div>

        <p className="story__foot mono">
          无声预览 · 完整影片随首批耳机一同发布 ·{' '}
          <span className="story__pct">{Math.round(pct)}%</span> 章节进度
        </p>
      </div>
    </div>,
    document.body,
  );
}
