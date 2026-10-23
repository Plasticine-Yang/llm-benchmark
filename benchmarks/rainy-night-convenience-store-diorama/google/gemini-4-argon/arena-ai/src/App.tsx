import { useEffect, useRef } from 'react';
import { Diorama } from './three/diorama';

export default function App() {
  const hostRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let diorama: Diorama | null = null;
    let booted = false;
    let cancelled = false;

    const boot = () => {
      if (booted || cancelled || !hostRef.current) return;
      booted = true;
      try {
        diorama = new Diorama(hostRef.current);
      } catch (err) {
        console.error('Failed to initialise the diorama', err);
      }
    };

    // Build the signage textures only once the rounded-gothic webfont is ready,
    // but never block the scene on a stalled font request.
    const fonts = (document as Document & { fonts?: FontFaceSet }).fonts;
    if (fonts && typeof fonts.ready?.then === 'function') {
      const guard = window.setTimeout(boot, 1500);
      fonts.ready.then(() => {
        window.clearTimeout(guard);
        boot();
      });
    } else {
      boot();
    }

    return () => {
      cancelled = true;
      diorama?.dispose();
      diorama = null;
    };
  }, []);

  return (
    <div
      ref={hostRef}
      className="stage"
      role="img"
      aria-label="雨夜のコンビニ街角 — 三渲二微缩景观模型，可拖拽旋转缩放"
      onContextMenu={(e) => e.preventDefault()}
    />
  );
}
