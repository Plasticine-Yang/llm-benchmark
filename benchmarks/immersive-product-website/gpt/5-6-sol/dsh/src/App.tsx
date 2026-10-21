import { useEffect, useRef, useState } from 'react'
import { ArrowRight, ArrowUpRight, Battery, Bluetooth, Charge, HeadphonesIcon, Play, SoundWave, Weight } from './components/Icons'
import { HeadphoneProduct, type Finish } from './components/HeadphoneProduct'
import { Navigation } from './components/Navigation'
import { ReservationPanel } from './components/ReservationPanel'
import { Soundstage } from './components/Soundstage'
import { StoryPanel } from './components/StoryPanel'

const finishes: { id: Finish; name: string; code: string; label: string }[] = [
  { id: 'obsidian', name: 'Obsidian', code: '01', label: '曜石黑' },
  { id: 'silver', name: 'Mist Silver', code: '02', label: '雾银' },
  { id: 'amber', name: 'Burnt Amber', code: '03', label: '灼琥珀' },
]

function useReveals() {
  useEffect(() => {
    const elements = Array.from(document.querySelectorAll<HTMLElement>('.reveal'))
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible')
          observer.unobserve(entry.target)
        }
      })
    }, { rootMargin: '0px 0px -10% 0px', threshold: .12 })
    elements.forEach((element) => observer.observe(element))
    return () => observer.disconnect()
  }, [])
}

type MagneticButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { children: React.ReactNode }

function MagneticButton({ children, className = '', ...props }: MagneticButtonProps) {
  const ref = useRef<HTMLButtonElement>(null)
  const frame = useRef<number | null>(null)

  const move = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (event.pointerType === 'touch' || !ref.current || frame.current) return
    const { clientX, clientY } = event
    frame.current = requestAnimationFrame(() => {
      const button = ref.current
      if (!button) return
      const rect = button.getBoundingClientRect()
      button.style.setProperty('--mag-x', `${(clientX - rect.left - rect.width / 2) * .14}px`)
      button.style.setProperty('--mag-y', `${(clientY - rect.top - rect.height / 2) * .18}px`)
      frame.current = null
    })
  }

  const reset = () => {
    ref.current?.style.setProperty('--mag-x', '0px')
    ref.current?.style.setProperty('--mag-y', '0px')
  }

  return <button ref={ref} className={`magnetic ${className}`} onPointerMove={move} onPointerLeave={reset} onBlur={reset} {...props}>{children}</button>
}

function SectionIndex({ number, title }: { number: string; title: string }) {
  return <div className="section-index"><span>{number}</span><i /><strong>{title}</strong></div>
}

function App() {
  useReveals()
  const [finish, setFinish] = useState<Finish>('obsidian')
  const [reservationOpen, setReservationOpen] = useState(false)
  const [reservationOrigin, setReservationOrigin] = useState({ x: 0, y: 0 })
  const [storyOpen, setStoryOpen] = useState(false)

  const openReservation = (element: HTMLElement) => {
    const rect = element.getBoundingClientRect()
    setReservationOrigin({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 })
    setReservationOpen(true)
  }

  return (
    <>
      <a className="skip-link" href="#main-content">跳至主要内容</a>
      <Navigation onReserve={openReservation} />
      <main id="main-content">
        <section className="hero" id="top">
          <div className="hero-noise" />
          <div className="hero-beam hero-beam-a" /><div className="hero-beam hero-beam-b" />
          <div className="hero-copy">
            <div className="hero-kicker entrance entrance-1"><span>FLAGSHIP SPATIAL HEADPHONES</span><i>2026 / N° 01</i></div>
            <h1 className="entrance entrance-2">听见空间，<br /><em>而不只是声音。</em></h1>
            <p className="hero-description entrance entrance-3">NOCTURNE ONE 以透明双腔体、个性化 HRTF 与 42 小时续航，重新定义私人声场。</p>
            <div className="hero-actions entrance entrance-4">
              <MagneticButton className="button button-primary" type="button" onClick={(event) => openReservation(event.currentTarget)}>
                <span>预约试听</span><ArrowRight />
              </MagneticButton>
              <button className="button button-secondary" type="button" onClick={() => setStoryOpen(true)}>
                <span className="play-mark"><Play width={15} height={15} /></span>
                观看 90 秒设计故事
              </button>
            </div>
            <div className="hero-meta entrance entrance-5">
              <span><i>01</i> 个性化 HRTF</span>
              <span><i>02</i> 透明双腔体</span>
              <span><i>03</i> 自适应降噪</span>
            </div>
          </div>

          <div className="hero-installation entrance entrance-product">
            <div className="installation-disc"><i /><i /><i /></div>
            <div className="installation-depth depth-back">NOCTURNE / NOCTURNE /</div>
            <div className="hero-product-wrap"><HeadphoneProduct finish={finish} labelled /></div>
            <div className="hud hud-battery glass-surface entrance entrance-hud-1"><span>ENDURANCE</span><strong>42<small>h</small></strong><i className="hud-meter"><b /></i></div>
            <div className="hud hud-spatial glass-surface entrance entrance-hud-2"><span className="hud-wave"><i /><i /><i /><i /><i /></span><div><strong>SPATIAL ENGINE</strong><small>PERSONALIZED HRTF</small></div></div>
            <div className="hud hud-driver glass-surface entrance entrance-hud-3"><span>DRIVER</span><strong>38<small>mm</small></strong><i>BERYLLIUM COATED</i></div>
            <div className="installation-caption"><span>01</span><i />ACOUSTIC OBJECT</div>
          </div>
          <a className="scroll-cue entrance entrance-5" href="#sound"><span>SCROLL TO EXPLORE</span><i /></a>
        </section>

        <section className="sound-section section-shell" id="sound">
          <div className="sound-heading reveal">
            <SectionIndex number="01" title="SOUND / 声场" />
            <div>
              <span className="eyebrow">PERSONAL SPATIAL FIELD</span>
              <h2>声音不再靠近耳朵。<br /><em>它存在于空间。</em></h2>
            </div>
            <p>NOCTURNE Spatial Engine 每秒追踪头部姿态 1,000 次。配合个性化 HRTF，声源被精准固定在三维空间中。</p>
          </div>
          <div className="soundstage-wrap reveal"><Soundstage /></div>
          <div className="sound-footnotes reveal">
            <div><span>360°</span><p>全域头部追踪<br />声像稳定无漂移</p></div>
            <div><span>1 kHz</span><p>姿态采样速率<br />低至 0.7 ms 延迟</p></div>
            <div><span>HRTF</span><p>根据耳廓特征<br />生成私人听觉模型</p></div>
          </div>
        </section>

        <section className="structure-section" id="structure">
          <div className="structure-sticky">
            <div className="structure-copy">
              <SectionIndex number="02" title="STRUCTURE / 结构" />
              <span className="eyebrow">FORM FOLLOWS ACOUSTICS</span>
              <h2>拆开，<br /><em>才能看见纯粹。</em></h2>
              <p>每一层材料只承担一种声学职责。结构被精简，声音因此完整。</p>
              <div className="structure-progress"><i /><span>向下滚动，解构 NOCTURNE ONE</span></div>
            </div>
            <div className="exploded-stage">
              <div className="exploded-product"><HeadphoneProduct finish={finish} mode="exploded" /></div>
              <div className="structure-callout callout-band"><b>01</b><i /><div><strong>一体式悬浮头梁</strong><span>均匀分散 312 g 重量</span></div></div>
              <div className="structure-callout callout-chamber"><b>02</b><i /><div><strong>透明压力腔</strong><span>独立管理反射与气流</span></div></div>
              <div className="structure-callout callout-driver"><b>03</b><i /><div><strong>38 mm 铍镀层单元</strong><span>0.02 mm 精密振膜</span></div></div>
              <div className="exploded-axis"><span>ASSEMBLY AXIS</span><i /></div>
            </div>
          </div>
        </section>

        <section className={`finish-section finish-theme-${finish}`} id="finishes">
          <div className="finish-ambient" />
          <div className="finish-header reveal">
            <SectionIndex number="03" title="MATERIAL / 表面" />
            <span className="eyebrow">THREE INTERPRETATIONS</span>
            <h2>光线落下，<br /><em>性格浮现。</em></h2>
          </div>
          <div className="finish-composition reveal">
            <div className="finish-product"><HeadphoneProduct finish={finish} mode="mini" /></div>
            <div className="finish-name" aria-live="polite">
              <span>{finishes.find((item) => item.id === finish)?.code} / 03</span>
              <strong>{finishes.find((item) => item.id === finish)?.name}</strong>
              <i>{finishes.find((item) => item.id === finish)?.label}</i>
            </div>
            <div className="finish-selector" role="radiogroup" aria-label="选择耳机颜色">
              {finishes.map((item) => (
                <button key={item.id} type="button" role="radio" aria-checked={finish === item.id} className={`finish-option finish-option-${item.id} ${finish === item.id ? 'is-selected' : ''}`} onClick={() => setFinish(item.id)}>
                  <i /><span><strong>{item.name}</strong><small>{item.label}</small></span><b>{item.code}</b>
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="specs-section section-shell" id="specifications">
          <div className="specs-heading reveal">
            <SectionIndex number="04" title="SPECIFICATIONS / 规格" />
            <h2>精准至每一克，<br /><em>强大于每一小时。</em></h2>
            <p>为长时间专注而设计。没有冗余的功能，只有每一次佩戴都能感受到的精确。</p>
          </div>
          <div className="spec-ledger reveal">
            <div className="spec-feature spec-weight"><Weight /><span>WEIGHT</span><strong>312<small>g</small></strong><p>铝镁合金骨架<br />压力均匀分布</p><i>01</i></div>
            <div className="spec-feature spec-bluetooth"><Bluetooth /><span>CONNECTION</span><strong>5.4</strong><p>Bluetooth<br />多点设备连接</p><i>02</i></div>
            <div className="spec-feature spec-battery"><Battery /><span>BATTERY LIFE</span><strong>42<small>h</small></strong><p>开启空间音频<br />单次充电续航</p><i>03</i></div>
            <div className="spec-feature spec-charge"><Charge /><span>FAST CHARGE</span><strong>10<small>min</small></strong><p>获得 6 小时播放<br />USB-C 快速充电</p><i>04</i></div>
          </div>
          <div className="technical-strip reveal">
            <span><b>DRIVER</b>38 mm Beryllium-coated</span>
            <span><b>RESPONSE</b>5 Hz — 40 kHz</span>
            <span><b>CODEC</b>LC3 / LDAC / AAC</span>
            <span><b>ANC</b>Adaptive 8-mic array</span>
          </div>
        </section>

        <section className="purchase-section" id="purchase">
          <div className="purchase-beam" />
          <div className="purchase-product reveal"><HeadphoneProduct finish={finish} mode="mini" /></div>
          <div className="purchase-copy reveal">
            <span className="eyebrow">NOCTURNE ONE / FOUNDERS EDITION</span>
            <h2>你的私人声场，<br />从此刻开始。</h2>
            <div className="purchase-price"><span>首发价格</span><strong>¥3,499</strong><i>含两年有限保修</i></div>
            <MagneticButton className="button button-primary purchase-button" type="button" onClick={(event) => openReservation(event.currentTarget)}>
              <span>预约试听</span><ArrowUpRight />
            </MagneticButton>
            <div className="purchase-notes"><span><i /><b>2026 年春季交付</b></span><span><i /><b>14 天无理由退货</b></span></div>
          </div>
        </section>
      </main>

      <footer className="publication-footer">
        <div className="footer-masthead"><span>NOCTURNE</span><i>ONE</i></div>
        <div className="footer-edition">
          <div><span>ISSUE</span><strong>N° 01</strong></div>
          <p>为那些认真聆听的人，<br />制造一件安静的精密仪器。</p>
          <div><span>DESIGNED</span><strong>SHANGHAI<br />2026</strong></div>
        </div>
        <div className="footer-bottom"><span>© 2026 NOCTURNE AUDIO</span><span>声音属于你。空间也是。</span><a href="#top">BACK TO TOP <ArrowUpRight width={14} /></a></div>
      </footer>

      <ReservationPanel open={reservationOpen} origin={reservationOrigin} onClose={() => setReservationOpen(false)} />
      <StoryPanel open={storyOpen} onClose={() => setStoryOpen(false)} />
    </>
  )
}

export default App
