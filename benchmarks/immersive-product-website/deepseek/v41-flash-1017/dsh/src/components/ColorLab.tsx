import { useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import type { HeadphoneTone } from './HeadphoneArt'
import { HeadphoneArt } from './HeadphoneArt'
import './ColorLab.css'

type Finish = {
  id: HeadphoneTone
  name: string
  cn: string
  code: string
  finish: string
  desc: string
  swatch: string
}

const finishes: Finish[] = [
  {
    id: 'obsidian',
    name: 'Obsidian',
    cn: '黑曜石',
    code: 'N° 01',
    finish: '深石墨阳极氧化 / 细喷砂',
    desc: '把所有反光收进材料里。冷静、低照度，像暗室里等待启动的仪器。',
    swatch: 'radial-gradient(circle at 32% 24%, #545a5b 0%, #24292a 42%, #0d0f10 100%)',
  },
  {
    id: 'mist',
    name: 'Mist Silver',
    cn: '雾银',
    code: 'N° 02',
    finish: '微珠喷砂铝 / 冰银阳极',
    desc: '一种被雾化过的金属。光线落在表面，只剩很薄的冷辉与克制的反差。',
    swatch: 'radial-gradient(circle at 32% 24%, #f1f4ef 0%, #b8c0bc 44%, #737d78 100%)',
  },
  {
    id: 'amber',
    name: 'Burnt Amber',
    cn: '焦琥珀',
    code: 'N° 03',
    finish: '铜阳极氧化 / 手工拉丝',
    desc: '暖色被压到金属深处。它不发光，只在光线掠过时，露出一点被灼烧过的金棕。',
    swatch: 'radial-gradient(circle at 32% 24%, #d5a275 0%, #966039 44%, #40281a 100%)',
  },
]

export function ColorLab() {
  const [selected, setSelected] = useState<HeadphoneTone>('obsidian')
  const [hasChanged, setHasChanged] = useState(false)
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([])
  const active = finishes.find((item) => item.id === selected) ?? finishes[0]

  const choose = (tone: HeadphoneTone) => {
    setSelected(tone)
    setHasChanged(true)
  }

  const onOptionKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (
      event.key !== 'ArrowRight' &&
      event.key !== 'ArrowDown' &&
      event.key !== 'ArrowLeft' &&
      event.key !== 'ArrowUp'
    ) {
      return
    }
    event.preventDefault()
    const direction = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : -1
    const next = (index + direction + finishes.length) % finishes.length
    choose(finishes[next].id)
    buttonRefs.current[next]?.focus()
  }

  return (
    <section id="finish" className="finish" data-tone={selected} aria-labelledby="finish-title">
      <div className="finish__ambient" aria-hidden="true">
        <div className="finish__light finish__light--obsidian" />
        <div className="finish__light finish__light--mist" />
        <div className="finish__light finish__light--amber" />
        <span className="finish__ghost" aria-hidden="true">
          FORM
        </span>
        <div className="finish__grain" />
      </div>

      <div className="finish__inner shell">
        <div className="finish__intro">
          <div className="section-index" data-reveal>
            <span>04</span>
            <span aria-hidden="true">—</span>
            <strong>表面与材质</strong>
          </div>
          <h2 className="section-heading finish__title" id="finish-title" data-reveal data-reveal-delay="0.08">
            同一种声音，
            <br />
            三种<span className="accent">温度</span>。
          </h2>
          <p className="section-copy finish__copy" data-reveal data-reveal-delay="0.16">
            每一枚耳罩都在柏林完成最后一次阳极氧化与手工拉丝。材料改变光，也改变你与声音相处的方式。
          </p>
        </div>

        <div className="finish__stage" data-reveal data-reveal-delay="0.14">
          <div className="finish__stage-light" aria-hidden="true" />
          <div className="finish__stage-rings" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <div className="finish__art">
            <HeadphoneArt
              tone={selected}
              ariaLabel={`NOCTURNE ONE 空间音频耳机，${active.cn} ${active.name} 表面`}
            />
          </div>
          <div className="finish__stage-shadow" aria-hidden="true" />
          <div className="finish__caption">
            <span className="mono">{active.code} / {active.name.toUpperCase()}</span>
            <span className="finish__caption-rule" aria-hidden="true" />
            <span>{active.finish}</span>
          </div>
        </div>

        <div className="finish__controls" data-reveal data-reveal-delay="0.22">
          <div className="finish__controls-head">
            <span>选择表面</span>
            <span className="mono">03 FINISHES</span>
          </div>

          <div className="finish__options" role="group" aria-label="选择耳机表面颜色">
            {finishes.map((finish, index) => (
              <button
                key={finish.id}
                ref={(element) => {
                  buttonRefs.current[index] = element
                }}
                type="button"
                className="finish-option"
                data-active={selected === finish.id}
                aria-pressed={selected === finish.id}
                onClick={() => choose(finish.id)}
                onKeyDown={(event) => onOptionKeyDown(event, index)}
              >
                <span className="finish-option__swatch" style={{ background: finish.swatch }} aria-hidden="true">
                  <span />
                </span>
                <span className="finish-option__text">
                  <strong>{finish.name}</strong>
                  <small>{finish.cn} · {finish.finish.split(' / ')[0]}</small>
                </span>
                <span className="finish-option__code mono">{finish.code}</span>
                <span className="finish-option__indicator" aria-hidden="true">
                  <span />
                </span>
              </button>
            ))}
          </div>

          <div className="finish__description" key={active.id} aria-live="polite">
            <p>{active.desc}</p>
            {hasChanged ? <span className="sr-only">已选择 {active.name}，{active.cn}</span> : null}
          </div>
        </div>
      </div>
    </section>
  )
}
