import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { MouseEvent } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Navigation } from './components/Navigation'
import { Hero } from './components/Hero'
import { Soundstage } from './components/Soundstage'
import { Structure } from './components/Structure'
import { ColorLab } from './components/ColorLab'
import { SpecsPurchase } from './components/SpecsPurchase'
import { Footer } from './components/Footer'
import { ReserveDialog } from './components/ReserveDialog'
import type { ReserveOrigin } from './components/ReserveDialog'
import { FilmDialog } from './components/FilmDialog'
import './styles/app.css'

gsap.registerPlugin(ScrollTrigger)

function App() {
  const rootRef = useRef<HTMLDivElement>(null)
  const [reserveOpen, setReserveOpen] = useState(false)
  const [reserveOrigin, setReserveOrigin] = useState<ReserveOrigin>(null)
  const [filmOpen, setFilmOpen] = useState(false)

  const openReserve = useCallback((event?: MouseEvent<HTMLButtonElement>) => {
    const anchor =
      event?.currentTarget ??
      (document.activeElement instanceof HTMLElement ? document.activeElement : null)
    if (anchor) {
      const rect = anchor.getBoundingClientRect()
      setReserveOrigin({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 })
    } else {
      setReserveOrigin({ x: window.innerWidth / 2, y: window.innerHeight * 0.6 })
    }
    setReserveOpen(true)
  }, [])

  const openFilm = useCallback(() => setFilmOpen(true), [])

  useEffect(() => {
    if (!document.documentElement.classList.contains('intro')) return
    const timeout = window.setTimeout(() => {
      document.documentElement.classList.remove('intro')
    }, 2600)
    return () => window.clearTimeout(timeout)
  }, [])

  useLayoutEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach((element) => {
        const delay = window.parseFloat(element.dataset.revealDelay ?? '0')
        gsap.fromTo(
          element,
          { y: 28, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.95,
            delay,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: element,
              start: 'top 88%',
              once: true,
            },
          },
        )
      })
    }, rootRef)

    const refreshId = window.setTimeout(() => ScrollTrigger.refresh(), 450)
    document.fonts?.ready.then(() => ScrollTrigger.refresh())

    return () => {
      window.clearTimeout(refreshId)
      ctx.revert()
    }
  }, [])

  return (
    <div className="site" ref={rootRef}>
      <div className="page-grain" aria-hidden="true" />
      <div className="page-vignette" aria-hidden="true" />
      <span id="nav-sentinel" className="nav-sentinel" aria-hidden="true" />
      <Navigation onReserve={openReserve} />
      <main id="main-content">
        <Hero onReserve={openReserve} onWatchFilm={openFilm} />
        <Soundstage />
        <Structure />
        <ColorLab />
        <SpecsPurchase onReserve={openReserve} />
      </main>
      <Footer />
      <ReserveDialog open={reserveOpen} onOpenChange={setReserveOpen} origin={reserveOrigin} />
      <FilmDialog open={filmOpen} onOpenChange={setFilmOpen} />
    </div>
  )
}

export default App
