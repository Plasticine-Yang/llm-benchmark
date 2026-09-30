import { useEffect, useRef, useState } from "react";
import { Icon } from "./Icon";

export function Soundstage() {
  const stage = useRef<HTMLDivElement>(null);
  const audio = useRef<{ context: AudioContext; pan: StereoPannerNode } | null>(
    null,
  );
  const [playing, setPlaying] = useState(false);
  const [direction, setDirection] = useState(0);
  const [audioError, setAudioError] = useState("");
  const move = (x: number, y: number) => {
    stage.current?.style.setProperty("--sx", `${x * 42}px`);
    stage.current?.style.setProperty("--sy", `${y * 42}px`);
    stage.current?.style.setProperty(
      "--angle",
      `${(Math.atan2(y, x) * 180) / Math.PI + 90}deg`,
    );
    if (audio.current)
      audio.current.pan.pan.setTargetAtTime(
        x,
        audio.current.context.currentTime,
        0.1,
      );
  };
  useEffect(
    () => () => {
      void audio.current?.context.close();
    },
    [],
  );
  async function toggleAudio() {
    if (audio.current) {
      await audio.current.context.close();
      audio.current = null;
      setPlaying(false);
      return;
    }
    try {
      const context = new AudioContext();
      await context.resume();
      const gain = context.createGain();
      gain.gain.value = 0.025;
      const pan = context.createStereoPanner();
      pan.pan.value = direction / 90;
      gain.connect(pan);
      pan.connect(context.destination);
      [174.61, 261.63, 349.23].forEach((frequency, i) => {
        const oscillator = context.createOscillator();
        oscillator.type = "sine";
        oscillator.frequency.value = frequency + i * 0.6;
        oscillator.connect(gain);
        oscillator.start();
      });
      audio.current = { context, pan };
      setPlaying(true);
      setAudioError("");
    } catch {
      setAudioError(
        "当前浏览器无法播放试听音频，请使用支持 Web Audio 的浏览器。",
      );
    }
  }
  return (
    <section className="sound-section section-shell" id="sound">
      <div className="section-topline">
        <span>01 / THE SOUND</span>
        <span>BEYOND LEFT & RIGHT</span>
      </div>
      <div className="sound-layout">
        <div className="sound-visual reveal">
          <div
            className={`soundstage ${playing ? "is-playing" : ""}`}
            ref={stage}
            onPointerMove={(e) => {
              const b = e.currentTarget.getBoundingClientRect();
              move(
                (e.clientX - b.left - b.width / 2) / (b.width / 2),
                (e.clientY - b.top - b.height / 2) / (b.height / 2),
              );
            }}
            onPointerLeave={() => move(direction / 90, -1)}
          >
            <div className="stage-grid" />
            <div className="stage-orbit orbit-one" />
            <div className="stage-orbit orbit-two" />
            <div className="stage-orbit orbit-three" />
            <div className="stage-cross horizontal" />
            <div className="stage-cross vertical" />
            <div className="stage-ray" />
            <div className="sound-source">
              <i />
              <span>音源</span>
            </div>
            <div className="wave-ring wave-one" />
            <div className="wave-ring wave-two" />
            <div className="wave-ring wave-three" />
            <div className="listener">
              <svg viewBox="0 0 40 50" aria-hidden="true">
                <path
                  d="M10 33V20C10 5 30 5 30 20v13M7 25h6v13H7zM27 25h6v13h-6z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <path
                  d="M16 28c0 6 8 6 8 0M17 22v2m6-2v2"
                  stroke="currentColor"
                  fill="none"
                />
              </svg>
              <span>YOU</span>
            </div>
            <span className="stage-north">FRONT</span>
            <span className="stage-west">L</span>
            <span className="stage-east">R</span>
            <span className="stage-south">REAR</span>
            <span className="stage-coordinate">PERSONAL HRTF · 360°</span>
          </div>
          <div className="stage-controls" role="group" aria-label="声场方向">
            {[-90, 0, 90].map((d, i) => (
              <button
                className={direction === d ? "selected" : ""}
                aria-pressed={direction === d}
                onClick={() => {
                  setDirection(d);
                  move(d / 90, -1);
                }}
                key={d}
              >
                {["左侧", "正前方", "右侧"][i]}
              </button>
            ))}
            <span>移动指针，探索声场</span>
          </div>
        </div>
        <div className="sound-copy reveal">
          <p className="eyebrow">
            <span className="amber-dot" /> SPATIAL ENGINE
          </p>
          <h2>
            声音，有了
            <br />
            自己的坐标。
          </h2>
          <p className="body-copy">
            不止左耳与右耳。让一把吉他在身旁响起，让一场雨从远处靠近。个性化
            HRTF 将声音安放在三维空间里，构建只属于你的聆听视角。
          </p>
          <div className="sound-metrics">
            <div>
              <strong>
                360<span>°</span>
              </strong>
              <span>沉浸空间声场</span>
            </div>
            <div>
              <strong>HRTF</strong>
              <span>个性化声学映射</span>
            </div>
          </div>
          <button
            className="text-button audio-button"
            onClick={() => void toggleAudio()}
            aria-pressed={playing}
          >
            <span className="round-icon">
              <Icon name={playing ? "pause" : "sound"} size={16} />
            </span>
            {playing ? "暂停声场试听" : "聆听声场演示"}
            <span className="small-note">建议佩戴耳机</span>
          </button>
          {audioError && (
            <p role="alert" className="form-error">
              {audioError}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
