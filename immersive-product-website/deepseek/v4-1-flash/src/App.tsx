import { useEffect, useMemo, useRef, useState } from 'react';
import { Nav } from './components/Nav';
import { Hero } from './components/Hero';
import { Soundstage } from './components/Soundstage';
import { Structure } from './components/Structure';
import { COLORWAYS, Colorways, type ColorwayId } from './components/Colorways';
import { Specs } from './components/Specs';
import { Purchase } from './components/Purchase';
import { Footer } from './components/Footer';
import { ReservationPanel } from './components/ReservationPanel';
import { ReservationCtx, type ReservationApi } from './lib/reservation';
import { useEntered, useReducedMotion } from './lib/hooks';

type Reservation = { id: number; origin: DOMRect | null };

export default function App() {
  const [colorway, setColorway] = useState<ColorwayId>('obsidian');
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const trigger = useRef<HTMLElement | null>(null);
  const entered = useEntered(90);
  const reduced = useReducedMotion();

  /* the colorway drives registered custom properties on <html>, so the whole
     page cross-fades without a single extra render */
  useEffect(() => {
    document.documentElement.dataset.colorway = colorway;
  }, [colorway]);

  const api = useMemo<ReservationApi>(
    () => ({
      open: (el) => {
        trigger.current = el ?? null;
        setReservation({
          id: performance.now(),
          origin: el ? el.getBoundingClientRect() : null,
        });
      },
    }),
    [],
  );

  /* Return focus after the panel has unmounted — it marks the app shell
     `inert`, so an earlier focus() call would be ignored. */
  useEffect(() => {
    if (reservation) return;
    const el = trigger.current;
    trigger.current = null;
    el?.focus();
  }, [reservation]);

  const label =
    COLORWAYS.find((c) => c.id === colorway)?.cn ?? COLORWAYS[0].cn;

  return (
    <ReservationCtx.Provider value={api}>
      <div className="nocturne" id="app-shell" data-entered={entered ? 'true' : 'false'}>
        <div className="ambient" aria-hidden="true">
          <span className="ambient__pool ambient__pool--key" />
          <span className="ambient__pool ambient__pool--fill" />
          <span className="ambient__pool ambient__pool--beam" />
        </div>
        <div className="vignette" aria-hidden="true" />
        <div className="grain" aria-hidden="true" />
        <div className="grain--fine" aria-hidden="true" />

        <a className="skip" href="#sound">
          跳到主要内容
        </a>

        <Nav />

        <main id="main">
          <Hero entered={entered} />
          <Soundstage />
          <Structure />
          <Colorways value={colorway} onChange={setColorway} />
          <Specs />
          <Purchase />
        </main>

        <Footer />
      </div>

      {reservation && (
        <ReservationPanel
          key={reservation.id}
          origin={reservation.origin}
          colorwayLabel={label}
          onClose={() => setReservation(null)}
        />
      )}

      {/* keep the reduced-motion flag in the tree so it is observable */}
      <span hidden data-reduced-motion={reduced ? 'true' : 'false'} />
    </ReservationCtx.Provider>
  );
}
