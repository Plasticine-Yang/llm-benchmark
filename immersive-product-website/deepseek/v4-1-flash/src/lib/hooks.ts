import { useCallback, useEffect, useRef, useState } from 'react';

export const clamp = (v: number, min = 0, max = 1) =>
  v < min ? min : v > max ? max : v;

/** True when the visitor asks for reduced motion. Reactive to OS changes. */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() =>
    typeof window === 'undefined'
      ? false
      : window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const on = () => setReduced(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);

  return reduced;
}

/** Reactive media query, used to switch the layout into its static form. */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() =>
    typeof window === 'undefined' ? false : window.matchMedia(query).matches,
  );

  useEffect(() => {
    const mq = window.matchMedia(query);
    const on = () => setMatches(mq.matches);
    on();
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, [query]);

  return matches;
}

/** One-shot reveal observer. Animates transform + opacity via CSS only. */
export function useInView<T extends HTMLElement>(
  { threshold = 0.2, rootMargin = '0px 0px -12% 0px' } = {},
) {
  const ref = useRef<T | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setShown(true);
            io.disconnect();
          }
        }
      },
      { threshold, rootMargin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold, rootMargin]);

  return [ref, shown] as const;
}

/**
 * Progress of an element through the viewport, 0 → 1, delivered on a single
 * rAF-gated scroll listener. The callback receives the raw number so callers
 * can write CSS custom properties directly instead of re-rendering React.
 */
export function useRangeProgress<T extends HTMLElement>(
  ref: React.RefObject<T | null>,
  onChange: (p: number) => void,
  { enabled = true, mode = 'sticky' }: { enabled?: boolean; mode?: 'sticky' | 'enter' } = {},
) {
  const cb = useRef(onChange);
  cb.current = onChange;

  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return;

    let raf = 0;
    const measure = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      const span = mode === 'sticky' ? r.height - vh : vh + r.height;
      const travelled = mode === 'sticky' ? -r.top : vh - r.top;
      cb.current(clamp(span > 0 ? travelled / span : 0));
    };
    const request = () => {
      if (!raf) raf = requestAnimationFrame(measure);
    };

    window.addEventListener('scroll', request, { passive: true });
    window.addEventListener('resize', request);
    measure();

    return () => {
      window.removeEventListener('scroll', request);
      window.removeEventListener('resize', request);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [ref, enabled, mode]);
}

/**
 * Magnetic follow for the primary CTA. Writes transforms straight to the DOM
 * inside a rAF — no React state, so pointer movement never re-renders.
 */
export function useMagnetic<T extends HTMLElement>(strength = 0.28, max = 16) {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (window.matchMedia('(hover: none)').matches) return;

    let raf = 0;
    let tx = 0;
    let ty = 0;
    let cx = 0;
    let cy = 0;
    let active = false;

    const tick = () => {
      cx += (tx - cx) * 0.16;
      cy += (ty - cy) * 0.16;
      el.style.setProperty('--mx', `${cx.toFixed(2)}px`);
      el.style.setProperty('--my', `${cy.toFixed(2)}px`);
      const settled = Math.abs(tx - cx) < 0.08 && Math.abs(ty - cy) < 0.08;
      if (settled && !active) {
        el.style.setProperty('--mx', `${tx.toFixed(2)}px`);
        el.style.setProperty('--my', `${ty.toFixed(2)}px`);
        raf = 0;
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };

    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      tx = Math.max(-max, Math.min(max, dx * strength));
      ty = Math.max(-max, Math.min(max, dy * strength * 0.7));
      active = true;
      kick();
    };
    const onLeave = () => {
      tx = 0;
      ty = 0;
      active = false;
      kick();
    };

    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerleave', onLeave);
    el.addEventListener('blur', onLeave);

    return () => {
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
      el.removeEventListener('blur', onLeave);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [strength, max]);

  return ref;
}

/** IntersectionObserver toggle, used for the "nav has scrolled" state. */
export function useSentinel<T extends HTMLElement>(rootMargin = '0px') {
  const ref = useRef<T | null>(null);
  const [passed, setPassed] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(
      ([entry]) => setPassed(!entry.isIntersecting),
      { rootMargin, threshold: 0 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [rootMargin]);

  return [ref, passed] as const;
}

/** Runs `fn` after paint + fonts settle, for the entrance choreography. */
export function useEntered(delay = 60) {
  const [entered, setEntered] = useState(false);
  useEffect(() => {
    let raf = 0;
    const t = window.setTimeout(() => {
      raf = requestAnimationFrame(() => setEntered(true));
    }, delay);
    return () => {
      window.clearTimeout(t);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [delay]);
  return entered;
}

/** Stable event handler identity for inline callbacks. */
export function useStable<T extends (...args: never[]) => unknown>(fn: T): T {
  const ref = useRef(fn);
  ref.current = fn;
  return useCallback(((...args: never[]) => ref.current(...args)) as T, []);
}
