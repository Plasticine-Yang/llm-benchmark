import type { MouseEvent } from 'react'
import { HeadphoneArt } from './HeadphoneArt'
import { MagneticButton } from './MagneticButton'
import { ArrowUpRight, PlayIcon } from './Icons'
import './Hero.css'

type HeroProps = {
  onReserve: (event?: MouseEvent<HTMLButtonElement>) => void
  onWatchFilm: () => void
}

function SpatialGlyph() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className="hud__glyph">
      <circle cx="16" cy="16" r="2.4" fill="none" stroke="currentColor" strokeWidth=".9" />
      <circle cx="16" cy="16" r="8.5" fill="none" stroke="currentColor" strokeWidth=".75" opacity=".42" />
      <circle cx="16" cy="16" r="13" fill="none" stroke="currentColor" strokeWidth=".65" opacity=".18" />
      <circle cx="23.2" cy="10.2" r="1.35" fill="var(--amber-300)" />
      <path d="M16 3v4M16 25v4M3 16h4M25 16h4" stroke="currentColor" strokeWidth=".65" opacity=".3" />
    </svg>
  )
}

export function Hero({ onReserve, onWatchFilm }: HeroProps) {
  return (
    <section id="brand" className="hero" aria-labelledby="hero-title">
      <div className="hero__atmosphere" aria-hidden="true">
        <div className="hero__wash" />
        <div className="hero__grainline" />
      </div>

      <div className="hero__layout shell">
        <div className="hero__copy">
          <div className="hero__eyebrow" data-intro="eyebrow">
            <span className="hero__eyebrow-mark" aria-hidden="true" />
            <span className="mono">NOCTURNE ONE</span>
            <span className="hero__eyebrow-sep" aria-hidden="true" />
            <span>空间声学系统</span>
          </div>

          <h1 className="hero__title" id="hero-title">
            <span className="hero__line">
              <span className="hero__line-inner" data-intro="line-1">
                听见<span className="hero__accent">空间</span>，
              </span>
            </span>
            <span className="hero__line">
              <span className="hero__line-inner" data-intro="line-2">
                而不只是声音。
              </span>
            </span>
          </h1>

          <p className="hero__support" data-intro="support">
            NOCTURNE ONE 以透明双腔体、个性化 HRTF 与 42 小时续航，重新定义私人声场。
          </p>

          <div className="hero__actions" data-intro="actions">
            <MagneticButton type="button" className="btn--primary" aria-haspopup="dialog" onClick={onReserve}>
              预约试听
              <span className="btn__orb" aria-hidden="true">
                <ArrowUpRight />
              </span>
            </MagneticButton>
            <button type="button" className="btn btn--ghost" aria-haspopup="dialog" onClick={onWatchFilm}>
              <span className="play-orb" aria-hidden="true">
                <PlayIcon width={16} height={16} />
              </span>
              观看 90 秒设计故事
              <span className="btn__duration">01:30</span>
            </button>
          </div>

          <div className="hero__meta" data-intro="meta">
            <span className="hero__meta-rule" aria-hidden="true" />
            <p>
              为私人声场重新调音
              <span>柏林声学实验室 · 2026</span>
            </p>
            <span className="mono hero__meta-code">N° 001</span>
          </div>
        </div>

        <div className="hero__stage" data-intro="stage">
          <div className="stage__aura" aria-hidden="true" />
          <div className="stage__halo" aria-hidden="true" />
          <div className="stage__orbit" aria-hidden="true">
            <svg viewBox="0 0 800 800">
              <defs>
                <linearGradient id="orbit-fade" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#e6ece7" stopOpacity=".24" />
                  <stop offset="40%" stopColor="#e6ece7" stopOpacity=".06" />
                  <stop offset="100%" stopColor="#c79863" stopOpacity=".18" />
                </linearGradient>
              </defs>
              <circle cx="400" cy="414" r="290" fill="none" stroke="url(#orbit-fade)" strokeWidth=".8" />
              <circle
                cx="400"
                cy="414"
                r="336"
                fill="none"
                stroke="rgba(223,231,225,.075)"
                strokeWidth=".65"
                strokeDasharray="1 9"
              />
              <path d="M400 72v26M400 730v26M58 414h26M716 414h26" stroke="rgba(227,235,228,.18)" strokeWidth=".7" />
              <path
                d="M108 414a292 292 0 0 1 584 0"
                fill="none"
                stroke="rgba(219,228,221,.06)"
                strokeWidth="20"
                strokeDasharray="0.5 13"
              />
              <circle cx="541" cy="174" r="2.2" fill="var(--amber-400)" opacity=".8" />
              <circle cx="690" cy="414" r="1.5" fill="rgba(228,236,229,.4)" />
              <path d="M721 384v60M691 414h60" stroke="rgba(228,236,229,.1)" strokeWidth=".7" />
            </svg>
          </div>

          <div className="stage__horizon" aria-hidden="true">
            <span />
          </div>

          <div className="stage__topline" aria-hidden="true">
            <span className="mono">FIG. 01 / 悬浮声学体</span>
            <span className="mono">SCALE — 1 : 1.4</span>
          </div>

          <div className="stage__levitate">
            <HeadphoneArt
              className="hero__headphone"
              ariaLabel="NOCTURNE ONE 石墨色空间音频耳机，透明双腔体悬浮展示"
            />
          </div>

          <div className="stage__leader-lines" aria-hidden="true">
            <svg viewBox="0 0 800 800">
              <path d="M636 125 L602 165 L535 188" fill="none" stroke="rgba(230,238,232,.18)" strokeWidth=".8" />
              <circle cx="636" cy="125" r="2.2" fill="rgba(230,238,232,.4)" />
              <path d="M168 316 L234 350 L300 380" fill="none" stroke="rgba(230,238,232,.16)" strokeWidth=".8" />
              <circle cx="168" cy="316" r="2.2" fill="rgba(230,238,232,.36)" />
              <path d="M614 648 L562 610 L516 585" fill="none" stroke="rgba(230,238,232,.16)" strokeWidth=".8" />
              <circle cx="614" cy="648" r="2.2" fill="rgba(199,151,99,.55)" />
            </svg>
          </div>

          <figure className="hud hud--battery glass" data-intro="hud-1">
            <div className="hud__head">
              <span className="mono hud__kicker">BATTERY / 01</span>
              <span className="hud__signal" aria-hidden="true">
                <i />
                <i />
                <i />
              </span>
            </div>
            <div className="hud__value-row">
              <strong className="hud__value">42</strong>
              <span className="hud__unit">h</span>
            </div>
            <figcaption className="hud__caption">主动降噪开启</figcaption>
          </figure>

          <figure className="hud hud--spatial glass" data-intro="hud-2">
            <div className="hud__head">
              <span className="mono hud__kicker">SPATIAL ENGINE</span>
              <SpatialGlyph />
            </div>
            <p className="hud__title">空间引擎</p>
            <figcaption className="hud__caption">
              实时 HRTF <span aria-hidden="true">/</span> 动态头部追踪
            </figcaption>
          </figure>

          <figure className="hud hud--driver glass" data-intro="hud-3">
            <div className="hud__head">
              <span className="mono hud__kicker">DRIVER / 03</span>
              <span className="hud__dot" aria-hidden="true" />
            </div>
            <div className="hud__value-row">
              <strong className="hud__value hud__value--small">38</strong>
              <span className="hud__unit">mm</span>
            </div>
            <figcaption className="hud__caption">铍振膜 · 悬浮腔体</figcaption>
          </figure>

          <div className="stage__footer">
            <a className="stage__scroll" href="#sound">
              <span className="stage__scroll-line" aria-hidden="true" />
              <span>向下，进入声场</span>
              <span className="mono">02</span>
            </a>
            <span className="mono stage__serial" aria-hidden="true">
              52.5200° N / 13.4050° E
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
