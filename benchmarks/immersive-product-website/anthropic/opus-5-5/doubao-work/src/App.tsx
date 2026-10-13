import { useEffect } from 'react'
import { Nav } from './components/Nav'
import { Hero } from './components/Hero'
import { Soundstage } from './components/Soundstage'
import { Structure } from './components/Structure'
import { ColorSelector } from './components/ColorSelector'
import { SpecsPurchase } from './components/SpecsPurchase'
import { Footer } from './components/Footer'
import { ReservationPanel } from './components/ReservationPanel'
import { StoryPlayer } from './components/StoryPlayer'
import { useRevealAll } from './hooks'

const VISITED_KEY = 'nocturne:visited'

export default function App() {
  useRevealAll()

  // Entrance choreography: full sequence on first visit, compressed on return visits.
  useEffect(() => {
    const root = document.documentElement
    let visited = false
    try {
      visited = localStorage.getItem(VISITED_KEY) === '1'
      localStorage.setItem(VISITED_KEY, '1')
    } catch { /* storage unavailable: treat as first visit */ }
    root.style.setProperty('--intro-k', visited ? '0.35' : '1')
    const start = () => requestAnimationFrame(() => root.classList.add('is-ready'))
    if (document.fonts?.ready) {
      const timeout = window.setTimeout(start, 700)
      document.fonts.ready.then(() => { window.clearTimeout(timeout); start() })
    } else start()
  }, [])

  return (
    <>
      <a href="#main" className="skip-link">跳到主要内容</a>
      <Nav />
      <main id="main" tabIndex={-1} className="outline-none">
        <Hero />
        <Soundstage />
        <Structure />
        <ColorSelector />
        <SpecsPurchase />
      </main>
      <Footer />
      <ReservationPanel />
      <StoryPlayer />
      <div className="grain" aria-hidden="true" />
    </>
  )
}
