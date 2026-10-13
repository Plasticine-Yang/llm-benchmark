import { useCallback, useEffect, useRef, useState } from 'react'
import { Pause, Play, SkipBack, SkipForward } from '@phosphor-icons/react'
import { closeStory, storyStore, useDialogRequest } from '../store'
import { GlassDialog } from './GlassDialog'
import { Headphones } from './Headphones'
import { prefersReducedMotion } from '../hooks'

const TOTAL = 90
const CHAPTERS = [
  { t: 0, title: '一间暗室', body: '设计从一个问题开始：在没有光的房间里，声音应该从哪里来？', explode: 0 as const },
  { t: 18, title: '把腔体做成透明', body: '我们拆掉了不透明外壳，让振膜在光学聚碳酸酯后面被看见——结构即是外观。', explode: 2 as const },
  { t: 36, title: '312 克的平衡', body: '137 次头模迭代后，重心被移到头顶正中，佩戴两小时后的压力下降 31%。', explode: 1 as const },
  { t: 54, title: '为每一对耳朵建模', body: '60 秒的耳廓扫描生成个性化 HRTF，声源第一次稳稳落在你面前。', explode: 0 as const },
  { t: 72, title: '42 小时之后', body: '一次充电，陪你穿过一个完整的周末。剩下的，交给安静。', explode: 3 as const },
]

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`

export function StoryPlayer() {
  const req = useDialogRequest(storyStore)
  return (
    <GlassDialog open={req.open} origin={req.origin} onClose={closeStory} labelledBy="story-title" className="max-w-[960px]">
      {req.open && <Story />}
    </GlassDialog>
  )
}

function Story() {
  const [playing, setPlaying] = useState(!prefersReducedMotion())
  const [chapter, setChapter] = useState(0)
  const time = useRef(0)
  const barRef = useRef<HTMLDivElement>(null)
  const clockRef = useRef<HTMLSpanElement>(null)
  const sliderRef = useRef<HTMLInputElement>(null)

  const paint = useCallback(() => {
    const t = time.current
    if (barRef.current) barRef.current.style.transform = `scaleX(${t / TOTAL})`
    if (clockRef.current) clockRef.current.textContent = fmt(t)
    if (sliderRef.current) {
      sliderRef.current.value = String(Math.round(t))
      sliderRef.current.setAttribute('aria-valuetext', `${fmt(t)} / 1:30`)
    }
    let idx = 0
    CHAPTERS.forEach((c, i) => { if (t >= c.t) idx = i })
    setChapter((prev) => (prev === idx ? prev : idx))
  }, [])

  useEffect(() => {
    if (!playing) return
    let raf = 0
    let last = performance.now()
    const loop = (now: number) => {
      time.current = Math.min(TOTAL, time.current + (now - last) / 1000)
      last = now
      paint()
      if (time.current >= TOTAL) { setPlaying(false); return }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [playing, paint])

  const seek = (t: number) => { time.current = Math.max(0, Math.min(TOTAL, t)); paint() }
  const jump = (dir: 1 | -1) => {
    const target = Math.max(0, Math.min(CHAPTERS.length - 1, chapter + dir))
    seek(CHAPTERS[target].t + 0.01)
  }
  const toggle = () => {
    if (time.current >= TOTAL) seek(0)
    setPlaying((p) => !p)
  }

  const c = CHAPTERS[chapter]

  return (
    <div>
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-[radial-gradient(80%_70%_at_60%_40%,#1d2226,#0f1113)] sm:aspect-video">
        <div aria-hidden="true" className="absolute inset-0" style={{ background: 'radial-gradient(40% 50% at 70% 50%, var(--ambient), transparent 70%)' }} />
        <div className="absolute inset-y-[6%] right-[2%] w-[58%] sm:right-[4%] sm:w-[52%]" style={{ filter: 'drop-shadow(0 24px 30px rgba(0,0,0,.6))' }}>
          <div className="levitate h-full w-full">
            <Headphones explode={c.explode} sweep className="h-full w-full" title={`设计故事画面：${c.title}`} />
          </div>
        </div>
        <div className="absolute bottom-6 left-6 right-[46%] sm:bottom-10 sm:left-10" aria-live="polite">
          <p key={`k-${chapter}`} className="mono text-[11px] tracking-[0.2em] text-amber-soft" style={{ animation: 'intro-rise .8s var(--ease-out-expo) both' }}>
            CHAPTER 0{chapter + 1} / 05
          </p>
          <h2 id="story-title" key={`t-${chapter}`} className="mt-3 text-[clamp(1.3rem,3vw,2.3rem)] font-semibold leading-[1.15] tracking-[-0.02em] text-ice-50" style={{ animation: 'intro-rise .9s .08s var(--ease-out-expo) both' }}>
            {c.title}
          </h2>
          <p key={`b-${chapter}`} className="mt-3 hidden max-w-[28em] text-[14px] leading-[1.75] text-ice-300 sm:block" style={{ animation: 'intro-rise .9s .16s var(--ease-out-expo) both' }}>
            {c.body}
          </p>
        </div>
        <p className="mono absolute left-6 top-6 text-[10.5px] tracking-[0.3em] text-ice-500 sm:left-10 sm:top-8">NOCTURNE ONE · 设计故事</p>
      </div>
      <p className="px-6 pt-5 text-[14px] leading-[1.7] text-ice-300 sm:hidden">{c.body}</p>

      <div className="px-5 pb-6 pt-5 sm:px-8">
        <div className="relative h-[3px] w-full rounded-full bg-white/10">
          <div ref={barRef} className="absolute inset-0 origin-left rounded-full bg-amber" style={{ transform: 'scaleX(0)' }} />
          {CHAPTERS.slice(1).map((ch) => (
            <span key={ch.t} className="absolute top-1/2 h-2 w-px -translate-y-1/2 bg-white/30" style={{ left: `${(ch.t / TOTAL) * 100}%` }} aria-hidden="true" />
          ))}
          <input
            ref={sliderRef}
            type="range"
            min={0}
            max={TOTAL}
            step={1}
            defaultValue={0}
            aria-label="播放进度"
            className="absolute -inset-y-3 inset-x-0 w-full cursor-pointer opacity-0"
            onInput={(e) => seek(Number(e.currentTarget.value))}
          />
        </div>
        <div className="mt-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-1">
            <button type="button" className="btn btn-ghost btn-icon" onClick={() => jump(-1)} disabled={chapter === 0} aria-label="上一章">
              <SkipBack size={18} weight="fill" />
            </button>
            <button type="button" className="btn btn-glass btn-icon" onClick={toggle} aria-label={playing ? '暂停' : '播放'}>
              {playing ? <Pause size={18} weight="fill" /> : <Play size={18} weight="fill" />}
            </button>
            <button type="button" className="btn btn-ghost btn-icon" onClick={() => jump(1)} disabled={chapter === CHAPTERS.length - 1} aria-label="下一章">
              <SkipForward size={18} weight="fill" />
            </button>
          </div>
          <p className="mono tabular text-[12px] text-ice-400"><span ref={clockRef}>0:00</span> / 1:30</p>
        </div>
      </div>
    </div>
  )
}
