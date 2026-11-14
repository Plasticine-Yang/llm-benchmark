import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useDialog, useReducedMotion } from '../lib/hooks';
import { drawStory, STORY_CHAPTERS, STORY_DURATION } from '../lib/story';
import { IconPause, IconPlay, IconReplay, IconX } from './icons';

interface StoryDialogProps {
  open: boolean;
  onClose: () => void;
}

const fmt = (t: number) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;

export function StoryDialog({ open, onClose }: StoryDialogProps) {
  const reduced = useReducedMotion();
  const panelRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const trackRef = useRef<HTMLInputElement>(null);
  const timeLabelRef = useRef<HTMLSpanElement>(null);

  const [entered, setEntered] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [chapter, setChapter] = useState(0);
  const [ended, setEnded] = useState(false);

  const playingRef = useRef(false);
  const tRef = useRef(0);
  const dirtyRef = useRef(true);
  const chapterRef = useRef(0);

  useDialog(open, onClose, panelRef);

  useLayoutEffect(() => {
    if (!open) {
      setEntered(false);
      return;
    }
    tRef.current = 0;
    chapterRef.current = 0;
    dirtyRef.current = true;
    setChapter(0);
    setEnded(false);
    const shouldPlay = !reduced;
    playingRef.current = shouldPlay;
    setPlaying(shouldPlay);
    const r = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(r);
  }, [open, reduced]);

  useEffect(() => {
    if (!open) return;
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    if (!stage || !canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let w = 0;
    let h = 0;
    const resize = () => {
      const rect = stage.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      w = rect.width;
      h = rect.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      dirtyRef.current = true;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(stage);

    let raf = 0;
    let lastTs = 0;
    const frame = (ts: number) => {
      const dt = lastTs ? Math.min(0.05, (ts - lastTs) / 1000) : 0.016;
      lastTs = ts;
      if (playingRef.current) {
        tRef.current = Math.min(STORY_DURATION, tRef.current + dt);
        dirtyRef.current = true;
        if (tRef.current >= STORY_DURATION) {
          playingRef.current = false;
          setPlaying(false);
          setEnded(true);
        }
      }
      if (dirtyRef.current && w > 0) {
        dirtyRef.current = false;
        drawStory(ctx, w, h, tRef.current);
        const idx = Math.min(4, Math.floor(tRef.current / 18));
        if (idx !== chapterRef.current) {
          chapterRef.current = idx;
          setChapter(idx);
        }
        if (trackRef.current && document.activeElement !== trackRef.current) {
          trackRef.current.value = tRef.current.toFixed(1);
        }
        trackRef.current?.style.setProperty('--progress', String(tRef.current / STORY_DURATION));
        if (timeLabelRef.current) {
          timeLabelRef.current.textContent = `${fmt(tRef.current)} / ${fmt(STORY_DURATION)}`;
        }
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [open]);

  const togglePlay = () => {
    if (ended) {
      tRef.current = 0;
      dirtyRef.current = true;
      setEnded(false);
      playingRef.current = true;
      setPlaying(true);
      return;
    }
    playingRef.current = !playingRef.current;
    setPlaying(playingRef.current);
  };

  const seek = (v: number, autoplay = false) => {
    tRef.current = Math.min(STORY_DURATION, Math.max(0, v));
    dirtyRef.current = true;
    if (tRef.current < STORY_DURATION) setEnded(false);
    if (autoplay && !reduced) {
      playingRef.current = true;
      setPlaying(true);
    }
  };

  if (!open) return null;

  const ch = STORY_CHAPTERS[chapter];

  return (
    <>
      <div className={`dialog-backdrop ${entered ? 'is-open' : ''}`} onClick={onClose} aria-hidden />
      <div className="dialog-shell">
        <div
          ref={panelRef}
          className={`dialog-panel story-panel glass ${entered ? 'is-open' : ''}`}
          role="dialog"
          aria-modal="true"
          aria-label="NOCTURNE ONE 90 秒设计故事"
        >
          <div className="story-stage" ref={stageRef}>
            <canvas ref={canvasRef} aria-hidden />
            <button type="button" className="icon-btn story-close" onClick={onClose} aria-label="关闭设计故事" data-autofocus>
              <IconX size={16} />
            </button>
            <div className="story-caption" key={chapter} aria-live="polite">
              <div className="chapter-no mono">CHAPTER {ch.no} / 05</div>
              <h3>{ch.title}</h3>
              <p>{ch.text}</p>
            </div>
            {ended && (
              <div className="story-ended">
                <button type="button" className="btn btn-primary" onClick={togglePlay}>
                  <IconReplay size={16} />
                  重新播放
                </button>
              </div>
            )}
          </div>
          <div className="story-controls">
            <button
              type="button"
              className="icon-btn"
              onClick={togglePlay}
              aria-label={playing ? '暂停' : '播放'}
            >
              {playing ? <IconPause size={15} /> : <IconPlay size={15} />}
            </button>
            <span className="story-time" ref={timeLabelRef}>
              0:00 / 1:30
            </span>
            <input
              ref={trackRef}
              className="story-track"
              type="range"
              min={0}
              max={STORY_DURATION}
              step={0.1}
              defaultValue={0}
              aria-label="故事播放进度（秒）"
              onInput={(e) => seek(Number(e.currentTarget.value))}
            />
            <div className="story-chapters" role="group" aria-label="章节跳转">
              {STORY_CHAPTERS.map((c, i) => (
                <button
                  key={c.no}
                  type="button"
                  className="story-chapter-dot"
                  data-active={chapter === i}
                  aria-label={`跳转到第 ${i + 1} 章：${c.title}`}
                  onClick={() => seek(c.start + 0.01, true)}
                >
                  {c.no}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}