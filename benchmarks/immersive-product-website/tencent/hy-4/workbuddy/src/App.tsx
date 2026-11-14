import { useCallback, useMemo, useState } from 'react'
import { GlassNav } from './components/GlassNav'
import { LaunchScene } from './components/LaunchScene'
import { SoundSection } from './components/SoundSection'
import { Structure } from './components/Structure'
import { ColorSelector } from './components/ColorSelector'
import { Specifications } from './components/Specifications'
import { Footer } from './components/Footer'
import { ReservationPanel } from './components/ReservationPanel'
import { StoryOverlay } from './components/StoryOverlay'
import { useActiveSection, useScrolledPast } from './lib/hooks'
import { FINISHES } from './lib/theme'
import type { FinishId } from './lib/theme'

const SECTION_IDS = ['sound', 'structure', 'specifications', 'purchase']

export default function App() {
  const [finish, setFinish] = useState<FinishId>('obsidian')
  const [reservation, setReservation] = useState({ open: false, x: 0, y: 0 })
  const [storyOpen, setStoryOpen] = useState(false)
  const compact = useScrolledPast(56)
  const active = useActiveSection(SECTION_IDS)

  const themeVars = useMemo(() => {
    const found = FINISHES.find((f) => f.id === finish) ?? FINISHES[0]
    return found.vars
  }, [finish])

  const openReservation = useCallback((origin: { x: number; y: number }) => {
    document.documentElement.style.setProperty('--morph-x', `${origin.x}px`)
    document.documentElement.style.setProperty('--morph-y', `${origin.y}px`)
    setReservation({ open: true, ...origin })
  }, [])

  const closeReservation = useCallback(() => setReservation((r) => ({ ...r, open: false })), [])
  const closeStory = useCallback(() => setStoryOpen(false), [])

  return (
    <div className="site" style={themeVars}>
      <div className="atmosphere" aria-hidden="true" />
      <div className="atmosphere__glow atmosphere__glow--one" aria-hidden="true" />
      <div className="atmosphere__glow atmosphere__glow--two" aria-hidden="true" />
      <div className="grain" aria-hidden="true" />

      <a className="skip-link" href="#sound">跳到主要内容</a>

      <GlassNav compact={compact} active={active} onReserve={openReservation} />

      <main>
        <LaunchScene onReserve={openReservation} onStory={() => setStoryOpen(true)} />
        <SoundSection />
        <Structure />
        <ColorSelector value={finish} onChange={setFinish} />
        <Specifications onReserve={openReservation} />
      </main>

      <Footer onReserve={openReservation} />

      <ReservationPanel open={reservation.open} onClose={closeReservation} />
      <StoryOverlay open={storyOpen} onClose={closeStory} />
    </div>
  )
}
