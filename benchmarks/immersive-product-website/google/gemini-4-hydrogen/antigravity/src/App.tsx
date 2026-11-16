import { useCallback, useEffect, useState } from 'react'
import { ColorAtelierSection } from './components/ColorAtelierSection'
import { DesignStoryModal } from './components/DesignStoryModal'
import { Footer } from './components/Footer'
import { HeroSection } from './components/HeroSection'
import { Navbar } from './components/Navbar'
import { ReservationPanel } from './components/ReservationPanel'
import { SoundstageSection } from './components/SoundstageSection'
import { SpecificationsSection } from './components/SpecificationsSection'
import { StructureSection } from './components/StructureSection'
import { FINISHES, NAV_ITEMS } from './data/productData'
import type {
  FinishId,
  NavItem,
  ReservationMode,
  ReservationOrigin,
} from './types/product'

export default function App() {
  const [finish, setFinish] = useState<FinishId>('obsidian')
  const [activeSection, setActiveSection] = useState<NavItem['id']>('brand')
  const [storyOpen, setStoryOpen] = useState(false)
  const [reservation, setReservation] = useState<{
    open: boolean
    mode: ReservationMode
    origin: ReservationOrigin | null
  }>({
    open: false,
    mode: 'audition',
    origin: null,
  })

  // Sync subtle room ambient CSS custom properties when switching product finishes
  useEffect(() => {
    const profile = FINISHES[finish]
    const root = document.documentElement
    root.style.setProperty('--room-ambient-1', profile.ambientPrimary)
    root.style.setProperty('--room-ambient-2', profile.ambientSecondary)
    root.style.setProperty('--room-ambient-rim', profile.ambientRim)
  }, [finish])

  // Track active navigation anchor via IntersectionObserver (zero scroll listener cost)
  useEffect(() => {
    const sections = NAV_ITEMS.map((item) => document.getElementById(item.id)).filter(
      (el): el is HTMLElement => el !== null,
    )
    if (sections.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id as NavItem['id'])
          }
        }
      },
      { rootMargin: '-36% 0px -48% 0px', threshold: 0.05 },
    )

    sections.forEach((sec) => observer.observe(sec))
    return () => observer.disconnect()
  }, [])

  const handleOpenReservation = useCallback(
    (mode: ReservationMode, origin: ReservationOrigin) => {
      setReservation({ open: true, mode, origin })
    },
    [],
  )

  const handleCloseReservation = useCallback(() => {
    setReservation((prev) => ({ ...prev, open: false }))
  }, [])

  return (
    <div className="relative min-h-screen bg-[#0F1116] text-[#E8EEF6]">
      {/* Subtle dark-room film grain texture */}
      <div className="dark-room-grain" aria-hidden="true" />

      {/* Top 48px sentinel for floating glass navbar morphing */}
      <div
        id="nav-scroll-sentinel"
        aria-hidden="true"
        className="pointer-events-none absolute top-0 left-0 h-12 w-px"
      />

      <Navbar activeSection={activeSection} />

      <main>
        <HeroSection
          finish={finish}
          onOpenReservation={(origin) =>
            handleOpenReservation('audition', origin)
          }
          onOpenDesignStory={() => setStoryOpen(true)}
        />

        <SoundstageSection />

        <StructureSection finish={finish} />

        <ColorAtelierSection finish={finish} onSelectFinish={setFinish} />

        <SpecificationsSection
          finish={finish}
          onSelectFinish={setFinish}
          onOpenPanel={handleOpenReservation}
        />
      </main>

      <Footer
        onOpenReservation={(origin) =>
          handleOpenReservation('audition', origin)
        }
        onOpenDesignStory={() => setStoryOpen(true)}
      />

      {reservation.open && (
        <ReservationPanel
          isOpen={reservation.open}
          mode={reservation.mode}
          originRect={reservation.origin}
          initialFinish={finish}
          onClose={handleCloseReservation}
          onSwitchMode={(mode) =>
            setReservation((prev) => ({ ...prev, mode }))
          }
        />
      )}

      {storyOpen && (
        <DesignStoryModal
          isOpen={storyOpen}
          onClose={() => setStoryOpen(false)}
        />
      )}
    </div>
  )
}
