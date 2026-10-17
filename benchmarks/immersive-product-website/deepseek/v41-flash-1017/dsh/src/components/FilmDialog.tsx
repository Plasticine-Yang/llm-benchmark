import { useEffect, useRef, useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { CloseIcon, PauseIcon, PlayIcon } from './Icons'
import './FilmDialog.css'

type FilmDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const DURATION = 90
const ACT_LENGTH = 22.5

const acts = [
  {
    code: '01',
    time: '00:00',
    label: '空间',
  },
  {
    code: '02',
    time: '00:22',
    label: '透明',
  },
  {
    code: '03',
    time: '00:45',
    label: '时间',
  },
  {
    code: '04',
    time: '01:07',
    label: 'NOCTURNE',
  },
]

function formatTime(value: number) {
  const whole = Math.min(DURATION, Math.floor(value))
  const minutes = Math.floor(whole / 60)
  const seconds = whole % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

export function FilmDialog({ open, onOpenChange }: FilmDialogProps) {
  const [playing, setPlaying] = useState(false)
  const [act, setAct] = useState(0)
  const elapsedRef = useRef(0)
  const actRef = useRef(0)
  const rafRef = useRef(0)
  const progressRef = useRef<HTMLSpanElement>(null)
  const timeRef = useRef<HTMLSpanElement>(null)
  const playButtonRef = useRef<HTMLButtonElement>(null)

  const paintProgress = () => {
    if (progressRef.current) {
      progressRef.current.style.transform = `scaleX(${Math.min(1, elapsedRef.current / DURATION)})`
    }
    if (timeRef.current) {
      timeRef.current.textContent = `${formatTime(elapsedRef.current)} / 01:30`
    }
  }

  useEffect(() => {
    if (!open) {
      setPlaying(false)
      return
    }
    elapsedRef.current = 0
    actRef.current = 0
    setAct(0)
    paintProgress()
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    setPlaying(!reduce)
  }, [open])

  useEffect(() => {
    if (!open || !playing) return
    let previous = performance.now()
    let frame = 0

    const tick = (now: number) => {
      const delta = Math.min(0.1, (now - previous) / 1000)
      previous = now
      elapsedRef.current = Math.min(DURATION, elapsedRef.current + delta)
      paintProgress()

      const nextAct = Math.min(acts.length - 1, Math.floor(elapsedRef.current / ACT_LENGTH))
      if (nextAct !== actRef.current) {
        actRef.current = nextAct
        setAct(nextAct)
      }

      if (elapsedRef.current >= DURATION) {
        setPlaying(false)
        return
      }
      frame = requestAnimationFrame(tick)
      rafRef.current = frame
    }

    frame = requestAnimationFrame(tick)
    rafRef.current = frame
    return () => cancelAnimationFrame(frame)
  }, [open, playing])

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  const togglePlayback = () => {
    if (elapsedRef.current >= DURATION - 0.05) {
      elapsedRef.current = 0
      actRef.current = 0
      setAct(0)
      paintProgress()
    }
    setPlaying((value) => !value)
  }

  const jumpToAct = (index: number) => {
    elapsedRef.current = index * ACT_LENGTH
    actRef.current = index
    setAct(index)
    paintProgress()
    if (!playing) setPlaying(true)
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="film-overlay" />
        <Dialog.Content
          className="film-panel"
          aria-describedby="film-description"
          onOpenAutoFocus={(event) => {
            event.preventDefault()
            playButtonRef.current?.focus()
          }}
        >
          <div className="film-panel__glass" aria-hidden="true" />
          <header className="film-header">
            <div className="film-header__title">
              <span className="film-header__mark" aria-hidden="true" />
              <span>NOCTURNE ONE</span>
              <span className="film-header__divider" aria-hidden="true" />
              <span>一部关于空间的设计故事</span>
            </div>
            <span className="film-header__meta mono">DESIGN FILM / 01:30</span>
            <Dialog.Close asChild>
              <button type="button" className="film-close" aria-label="关闭设计故事">
                <CloseIcon width={19} height={19} />
              </button>
            </Dialog.Close>
          </header>

          <Dialog.Title className="sr-only">NOCTURNE ONE 90 秒设计故事</Dialog.Title>
          <Dialog.Description id="film-description" className="sr-only">
            四幕设计故事，从空间声场、透明腔体、42 小时续航到 NOCTURNE ONE 的最终形态。
          </Dialog.Description>

          <div className="film-viewport" data-act={act}>
            <div className="film-viewport__grain" aria-hidden="true" />
            <div className="film-viewport__vignette" aria-hidden="true" />
            <span className="film-viewport__frame film-viewport__frame--tl" aria-hidden="true" />
            <span className="film-viewport__frame film-viewport__frame--tr" aria-hidden="true" />
            <span className="film-viewport__frame film-viewport__frame--bl" aria-hidden="true" />
            <span className="film-viewport__frame film-viewport__frame--br" aria-hidden="true" />

            <section className="film-scene film-scene--one" data-active={act === 0} aria-hidden={act !== 0}>
              <div className="film-ripple film-ripple--one" aria-hidden="true" />
              <div className="film-ripple film-ripple--two" aria-hidden="true" />
              <div className="film-ripple film-ripple--three" aria-hidden="true" />
              <span className="film-scene__eyebrow mono">SCENE 01 / SPACE</span>
              <h3>
                先听见<span>空间</span>。
              </h3>
              <p>在声音之前，房间先存在。NOCTURNE 做的，是让房间和音乐一起抵达。</p>
              <div className="film-scene__coordinates mono" aria-hidden="true">
                <span>52.5200° N</span>
                <span>13.4050° E</span>
              </div>
            </section>

            <section className="film-scene film-scene--two" data-active={act === 1} aria-hidden={act !== 1}>
              <div className="film-scene__half-copy">
                <span className="film-scene__eyebrow mono">SCENE 02 / ACOUSTIC CHAMBER</span>
                <h3>
                  透明，
                  <br />
                  不是一种风格。
                </h3>
                <p>它是结构本身。双层硼硅玻璃之间，38 mm 铍振膜把空气推成可被看见的弧线。</p>
              </div>
              <div className="film-chamber" aria-hidden="true">
                <span className="film-chamber__ring film-chamber__ring--one" />
                <span className="film-chamber__ring film-chamber__ring--two" />
                <span className="film-chamber__ring film-chamber__ring--three" />
                <span className="film-chamber__ring film-chamber__ring--four" />
                <span className="film-chamber__axis film-chamber__axis--x" />
                <span className="film-chamber__axis film-chamber__axis--y" />
                <span className="film-chamber__core">38</span>
                <span className="film-chamber__unit mono">MM / Be</span>
                <span className="film-chamber__measure mono">CHAMBER Ø 76 MM</span>
              </div>
            </section>

            <section className="film-scene film-scene--three" data-active={act === 2} aria-hidden={act !== 2}>
              <span className="film-scene__eyebrow mono">SCENE 03 / TIME</span>
              <div className="film-time">
                <span className="film-time__value">42</span>
                <span className="film-time__unit">h</span>
                <div className="film-time__line" aria-hidden="true" />
              </div>
              <div className="film-scene__half-copy film-scene__half-copy--right">
                <h3>让声音，拥有自己的时间。</h3>
                <p>续航不是待机时长。是 42 小时不间断的主动降噪与空间音频，从柏林到下一次日落。</p>
              </div>
              <span className="film-time__note mono">ACTIVE NOISE CANCELLING / SPATIAL ON</span>
            </section>

            <section className="film-scene film-scene--four" data-active={act === 3} aria-hidden={act !== 3}>
              <span className="film-scene__eyebrow mono">SCENE 04 / NOCTURNE ONE</span>
              <div className="film-lockup">
                <span>NOCTURNE</span>
                <em>ONE</em>
              </div>
              <p className="film-lockup__claim">听见空间，而不只是声音。</p>
              <div className="film-lockup__details" aria-hidden="true">
                <span>SPATIAL AUDIO</span>
                <span>42 H</span>
                <span>38 MM Be</span>
                <span>312 G</span>
              </div>
            </section>
          </div>

          <div className="film-controls">
            <button
              ref={playButtonRef}
              type="button"
              className="film-play"
              onClick={togglePlayback}
              aria-label={playing ? '暂停设计故事' : '播放设计故事'}
            >
              <span className="film-play__icon" aria-hidden="true">
                {playing ? <PauseIcon width={18} height={18} /> : <PlayIcon width={18} height={18} />}
              </span>
              <span>{playing ? '暂停' : '播放'}</span>
            </button>

            <div className="film-timeline">
              <div className="film-progress" aria-hidden="true">
                <span ref={progressRef} className="film-progress__fill" />
              </div>
              <div className="film-chapters" role="group" aria-label="故事章节">
                {acts.map((item, index) => (
                  <button
                    key={item.code}
                    type="button"
                    className="film-chapter"
                    data-active={act === index}
                    aria-label={`跳至第 ${index + 1} 幕，${item.label}，${item.time}`}
                    aria-pressed={act === index}
                    onClick={() => jumpToAct(index)}
                  >
                    <span className="mono">{item.code}</span>
                    <span>{item.label}</span>
                    <span className="mono film-chapter__time">{item.time}</span>
                  </button>
                ))}
              </div>
            </div>

            <span ref={timeRef} className="film-timecode mono" aria-live="off">
              00:00 / 01:30
            </span>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
