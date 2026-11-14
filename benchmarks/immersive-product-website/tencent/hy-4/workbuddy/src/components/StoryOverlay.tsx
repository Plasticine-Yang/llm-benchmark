import { useEffect, useRef, useState } from 'react'
import type { KeyboardEvent as ReactKeyboardEvent, MouseEvent as ReactMouseEvent } from 'react'
import { useDialog } from '../lib/hooks'
import { ArrowRight, Close, Pause, Play, Skip } from '../lib/icons'
import { ProductVisual } from './ProductVisual'

const DURATION = 90
const CHAPTER_LENGTH = 15
const CHAPTERS = [
  { t: '一切从一段安静开始。', d: '2023 年冬天，消音室里只留下一张椅子和一支麦克风。', tag: 'ORIGIN' },
  { t: '我们拆掉了耳机的外壳。', d: '透明不是为了被看见，而是为了让空气终于有路径。', tag: 'TRANSPARENCY' },
  { t: '两个腔体，一条 0.4 mm 的通道。', d: '驻波被分开处理，低频下潜到 5 Hz，仍然干净。', tag: 'DUAL CHAMBER' },
  { t: '38 毫米，比静止更轻。', d: '铍振膜让声音在开始与结束的地方都不留拖尾。', tag: 'DRIVER' },
  { t: '让声音记得自己在哪里。', d: 'Spatial Engine 每秒重算 240 次头部姿态与房间响应。', tag: 'SPATIAL ENGINE' },
  { t: 'NOCTURNE ONE。', d: '听见空间，而不只是声音。', tag: 'FINAL' },
]

const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`

export function StoryOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [phase, setPhase] = useState<'idle' | 'enter' | 'exit'>('idle')
  const [playing, setPlaying] = useState(true)
  const [chapter, setChapter] = useState(0)
  const timeRef = useRef(0)
  const chapterRef = useRef(0)
  const barRef = useRef<HTMLDivElement>(null)
  const timeRefEl = useRef<HTMLSpanElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)

  useDialog(open, onClose, panelRef)

  useEffect(() => {
    if (open) {
      setPhase('enter')
      timeRef.current = 0
      chapterRef.current = 0
      setChapter(0)
      setPlaying(true)
    } else {
      setPhase((p) => (p === 'idle' ? 'idle' : 'exit'))
      const t = window.setTimeout(() => setPhase('idle'), 480)
      return () => window.clearTimeout(t)
    }
  }, [open])

  const paint = () => {
    if (barRef.current) barRef.current.style.transform = `scaleX(${timeRef.current / DURATION})`
    if (timeRefEl.current) timeRefEl.current.textContent = fmt(timeRef.current)
  }

  useEffect(() => {
    if (!open || !playing) return
    let raf = 0
    let last = performance.now()
    const tick = (now: number) => {
      const dt = (now - last) / 1000
      last = now
      timeRef.current = Math.min(DURATION, Math.max(0, timeRef.current + dt))
      paint()
      const ch = Math.max(0, Math.min(CHAPTERS.length - 1, Math.floor(timeRef.current / CHAPTER_LENGTH)))
      if (ch !== chapterRef.current) {
        chapterRef.current = ch
        setChapter(ch)
      }
      if (timeRef.current >= DURATION) {
        setPlaying(false)
        return
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [open, playing])

  const seek = (seconds: number) => {
    timeRef.current = Math.min(DURATION, Math.max(0, seconds))
    const ch = Math.max(0, Math.min(CHAPTERS.length - 1, Math.floor(timeRef.current / CHAPTER_LENGTH)))
    chapterRef.current = ch
    setChapter(ch)
    paint()
  }

  const onTrackClick = (e: ReactMouseEvent<HTMLDivElement>) => {
    const rect = trackRef.current?.getBoundingClientRect()
    if (!rect) return
    seek(((e.clientX - rect.left) / rect.width) * DURATION)
  }

  const onKey = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key === ' ' || e.key === 'Spacebar') {
      e.preventDefault()
      if (timeRef.current >= DURATION) seek(0)
      setPlaying((v) => !v)
    }
    if (e.key === 'ArrowRight') { e.preventDefault(); seek(timeRef.current + 5) }
    if (e.key === 'ArrowLeft') { e.preventDefault(); seek(timeRef.current - 5) }
  }

  const close = () => { setPlaying(false); onClose() }
  const current = CHAPTERS[chapter] ?? CHAPTERS[0]

  if (phase === 'idle') return null

  return (
    <div className={`overlay story-overlay ${phase === 'enter' ? 'is-open' : ''} ${phase === 'exit' ? 'is-closing' : ''}`}>
      <div className="overlay__veil story__veil" onClick={close} aria-hidden="true" />
      <div
        className="story glass--deep"
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="story-title"
        tabIndex={-1}
        onKeyDown={onKey}
      >
        <div className="story__head">
          <div className="eyebrow"><span className="eyebrow__dot" /><span>DESIGN STORY</span><span className="eyebrow__rule" /><span>90 SECONDS</span></div>
          <button type="button" className="icon-btn" onClick={close} aria-label="关闭设计故事"><Close size={17} /></button>
        </div>

        <div className="story__scene" data-chapter={chapter}>
          <div className="story__scene-glow" />
          <svg className="story__rings" viewBox="0 0 600 600" aria-hidden="true">
            {[110, 165, 220, 275].map((r, i) => <circle key={r} cx="300" cy="300" r={r} style={{ animationDelay: `${i * 320}ms` }} />)}
            <path d="M 40 300 Q 150 210 300 300 T 560 300" className="story__wave" />
            <path d="M 40 320 Q 150 250 300 320 T 560 320" className="story__wave story__wave--two" />
          </svg>
          <div className="story__product"><ProductVisual sweep={false} title="设计故事中的 NOCTURNE ONE" /></div>
          <div className="story__scene-index num">0{chapter + 1}<span>/ 06</span></div>
        </div>

        <div className="story__caption" key={chapter}>
          <span className="mono-label">{current.tag}</span>
          <h2 className="display" id="story-title">{current.t}</h2>
          <p>{current.d}</p>
        </div>

        <div className="story__controls">
          <button
            type="button"
            className="story__play icon-btn"
            onClick={() => { if (timeRef.current >= DURATION) seek(0); setPlaying((v) => !v) }}
            aria-label={playing ? '暂停' : '播放'}
          >
            {playing ? <Pause size={16} /> : <Play size={16} />}
          </button>
          <span className="story__time num" ref={timeRefEl}>00:00</span>
          <div className="story__track" ref={trackRef} onClick={onTrackClick} role="slider" tabIndex={0}
            aria-label="播放进度" aria-valuemin={0} aria-valuemax={90} aria-valuenow={Math.round(timeRef.current)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowRight') seek(timeRef.current + 5)
              if (e.key === 'ArrowLeft') seek(timeRef.current - 5)
            }}>
            <div className="story__track-fill" ref={barRef} />
            {CHAPTERS.map((_, i) => <i key={i} style={{ left: `${((i + 1) / CHAPTERS.length) * 100}%` }} />)}
          </div>
          <span className="story__time num">01:30</span>
          <button type="button" className="icon-btn" onClick={() => seek(DURATION)} aria-label="跳到结尾"><Skip size={16} /></button>
          <button type="button" className="story__finish" onClick={close}>结束放映 <ArrowRight size={15} /></button>
        </div>
      </div>
    </div>
  )
}
