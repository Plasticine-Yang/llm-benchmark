import { createContext, useContext } from 'react';

export type ReservationApi = {
  open: (origin?: HTMLElement | null) => void;
};

export const ReservationCtx = createContext<ReservationApi>({ open: () => {} });

export const useReservation = () => useContext(ReservationCtx);

export const SECTIONS = [
  { id: 'sound', label: '声音', sub: 'Sound' },
  { id: 'structure', label: '结构', sub: 'Structure' },
  { id: 'specs', label: '规格', sub: 'Specifications' },
  { id: 'purchase', label: '购买', sub: 'Purchase' },
] as const;

export function scrollToSection(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
}
