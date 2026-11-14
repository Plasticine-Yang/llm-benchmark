import { useCallback, useState, type CSSProperties, type MouseEvent } from 'react';
import { Finishes } from './components/Finishes';
import { Footer } from './components/Footer';
import { Hero } from './components/Hero';
import { NavBar } from './components/NavBar';
import {
  ReservationDialog,
  type DialogOrigin,
  type ReservationResult,
} from './components/ReservationDialog';
import { Soundstage } from './components/Soundstage';
import { Specs } from './components/Specs';
import { StoryDialog } from './components/StoryDialog';
import { Structure } from './components/Structure';
import { finishByKey, type FinishKey } from './lib/finishes';

export default function App() {
  const [finish, setFinish] = useState<FinishKey>('obsidian');
  const [muted, setMuted] = useState(false);
  const [reserveOpen, setReserveOpen] = useState(false);
  const [reserveOrigin, setReserveOrigin] = useState<DialogOrigin | null>(null);
  const [reservation, setReservation] = useState<ReservationResult | null>(null);
  const [storyOpen, setStoryOpen] = useState(false);

  const openReserve = useCallback((e: MouseEvent<HTMLButtonElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    setReserveOrigin({ x: r.left, y: r.top, w: r.width, h: r.height });
    setReserveOpen(true);
  }, []);

  const vars = finishByKey(finish).vars as CSSProperties;

  return (
    <div className="app" style={vars} data-finish={finish}>
      <div className="grain" aria-hidden />
      <div className="page-rules" aria-hidden>
        <span /><span /><span />
      </div>
      <div id="nav-sentinel" style={{ position: 'absolute', top: 0, height: 1, width: 1 }} aria-hidden />

      <NavBar muted={muted} onToggleMute={() => setMuted((v) => !v)} onReserve={openReserve} />

      <main>
        <Hero onReserve={openReserve} onStory={() => setStoryOpen(true)} reserved={reservation !== null} />
        <div className="divider" aria-hidden>
          <i />
          <span>01 · SOUND</span>
          <i />
        </div>
        <Soundstage muted={muted} />
        <div className="divider" aria-hidden>
          <i />
          <span>02 · ANATOMY</span>
          <i />
        </div>
        <Structure />
        <div className="divider" aria-hidden>
          <i />
          <span>03 · FINISHES</span>
          <i />
        </div>
        <Finishes finish={finish} onChange={setFinish} />
        <div className="divider" aria-hidden>
          <i />
          <span>04 · SPECIFICATIONS</span>
          <i />
        </div>
        <Specs finish={finish} reserved={reservation !== null} onReserve={openReserve} />
      </main>

      <Footer onReserve={openReserve} />

      <ReservationDialog
        open={reserveOpen}
        origin={reserveOrigin}
        existing={reservation}
        defaultFinish={finish}
        onClose={() => setReserveOpen(false)}
        onReserved={setReservation}
        onReset={() => setReservation(null)}
      />
      <StoryDialog open={storyOpen} onClose={() => setStoryOpen(false)} />
    </div>
  );
}