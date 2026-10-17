# NOCTURNE ONE

A launch site for a fictional flagship spatial-audio headphone. Built as a single React + TypeScript page with a custom SVG product installation, liquid-glass materials, a pointer-reactive soundstage, a pinned exploded-structure sequence, a live finish selector and a complete reservation flow.

## Run

```bash
pnpm install
pnpm dev        # http://127.0.0.1:4173
```

Or build and serve the static output:

```bash
pnpm build
pnpm start      # http://127.0.0.1:4173
```

Requires Node 20.19+ (or Node 22.12+). A production build is also included in `dist/`; `pnpm start` serves it without a dev server.

## Design direction

The north star is **a precision acoustic instrument in a dark room**: deep graphite surfaces, ice-silver typography, one muted amber signal colour, and technical annotations borrowed from product dossiers rather than software landing pages.

- The hero is an asymmetric editorial split. The installation is hand-built from layered SVG paths, gradients, masks and CSS light, not an external image.
- Liquid glass appears only where it has a job: the floating navigation, the three HUD instruments, and the reservation / film panels. Every pane uses layered transmission, variable 1px edge light, inner bevels and real backdrop blur.
- The page moves between dark, warm and pale sections. The technical specifications read like a printed dossier; the footer is a publication back cover rather than a link grid.
- Typography is Geist Variable / Geist Mono with system Chinese sans fallbacks (PingFang SC, Noto Sans SC, Microsoft YaHei).

## Interaction and motion

- Session-based entry choreography: nav → copy → product → HUDs.
- Magnetic primary CTA. Pointer animation is written directly to CSS custom properties from a rAF loop; it never re-renders React.
- `观看 90 秒设计故事` opens an actual 90-second, four-act code-driven design film with play/pause, chapter jump, close and focus management.
- `预约试听` opens a glass reservation panel that reveals from the clicked button origin. The form has default, submitting, validation-error and success states. The submitted state is a front-end simulation; no data leaves the page.
- The soundstage responds to pointer position with a rotating beam, moving source, live azimuth/distance and a subtle 3D tilt. It is keyboard operable with arrow keys; sound modes are toggle buttons.
- Structure is a pinned desktop sequence. The scroll trigger separates earcups, glass chambers and the titanium band, with the copy updating alongside. Tablet and mobile use a stable single-column, non-sticky reading layout.
- Finish selection transitions the SVG material stops and the ambient light between Obsidian, Mist Silver and Burnt Amber without reloading.
- `prefers-reduced-motion` disables the entrance, levitation, sweeps and ambient loops; the film starts paused and the main content is immediately readable.
- All interactive controls have hover, active, focus-visible and disabled treatments. Modals use Radix Dialog for focus trapping, Escape handling and focus restoration.

## Stack

React 19 · TypeScript · Vite 7 · GSAP ScrollTrigger · Radix Dialog · self-hosted Geist fonts · custom inline SVG/CSS artwork. No external images, no Unsplash, no icon package.

## Evidence

Preview captures and viewport notes are in `evidence/`. They were captured with Chrome via the Oil UI screenshot tool against the production build. The desktop full-page image is an overview only; fixed navigation and sticky structure are frozen in that capture.

## Note

NOCTURNE ONE is a concept product and this is a front-end prototype. The reservation confirmation is generated locally; there is no backend, payment or delivery service behind it.

## Verification

- `tsc -b` and the Vite production build pass.
- Production screenshots were checked in Chrome at 1440 × 900, 1366 × 768, 1024 × 768, 768 × 1024, 390 × 844 and 320 × 700; no horizontal overflow, console errors or failed assets were reported.
- Reservation flow was exercised at default, submitting, validation-error and success states.
- Reduced-motion rendering was checked with Chrome's forced reduced-motion preference; content is immediately visible and autoplay/levitation are disabled.
- Keyboard checks covered the skip link, mobile menu focus, soundstage arrow controls and the dialog focus trap.
