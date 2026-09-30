import { useEffect, useRef, useState } from "react";
import { Headphones } from "./Headphones";
import { Icon } from "./Icon";

const chapters = [
  {
    title: "从安静开始。",
    copy: "我们相信，好的设计先懂得克制。用最少的线条，为声音腾出空间。",
    label: "01 / THE SILENCE",
  },
  {
    title: "让内部，成为外观。",
    copy: "透明双腔体让精密结构不再隐藏。每一个看得见的细节，都为听得见的不同。",
    label: "02 / THE STRUCTURE",
  },
  {
    title: "把世界，放回声音里。",
    copy: "个性化空间音频，让声音超越耳机的边界。NOCTURNE ONE，属于你的私人声场。",
    label: "03 / THE SPACE",
  },
];
export function DesignStory({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(true);
  useEffect(() => {
    if (open) {
      setTime(0);
      setPlaying(true);
      ref.current?.showModal();
    } else ref.current?.close();
  }, [open]);
  useEffect(() => {
    if (!open || !playing || time >= 90) return;
    const t = setInterval(() => setTime((v) => Math.min(v + 1, 90)), 1000);
    return () => clearInterval(t);
  }, [open, playing, time]);
  const chapter = Math.min(Math.floor(time / 30), 2);
  return (
    <dialog
      className="story-dialog glass"
      ref={ref}
      aria-labelledby="story-title"
      onCancel={onClose}
    >
      <button
        className="icon-button dialog-close"
        aria-label="关闭设计故事"
        onClick={onClose}
      >
        <Icon name="close" />
      </button>
      <div className="story-scene">
        <div className="story-halo" />
        <Headphones exploded={chapter} />
        <span className="eyebrow">DESIGN IN EVERY DETAIL.</span>
      </div>
      <div className="story-copy" key={chapter}>
        <p className="eyebrow">{chapters[chapter].label}</p>
        <h2 id="story-title">{chapters[chapter].title}</h2>
        <p>{chapters[chapter].copy}</p>
      </div>
      <div className="story-controls">
        <button
          className="icon-button"
          aria-label={
            time === 90 ? "重新播放" : playing ? "暂停故事" : "播放故事"
          }
          onClick={() => {
            if (time === 90) setTime(0);
            setPlaying((v) => (time === 90 ? true : !v));
          }}
        >
          <Icon name={playing && time < 90 ? "pause" : "play"} />
        </button>
        <input
          aria-label="设计故事播放进度"
          type="range"
          min="0"
          max="90"
          value={time}
          onChange={(e) => setTime(Number(e.target.value))}
        />
        <span>
          {String(Math.floor(time / 60)).padStart(2, "0")}:
          {String(time % 60).padStart(2, "0")} / 01:30
        </span>
      </div>
    </dialog>
  );
}
