# NOCTURNE ONE — 空间音频耳机

An immersive product-launch site for a fictional flagship pair of over-ear headphones:
transparent dual acoustic chambers, personalised HRTF, 42-hour battery.

The whole product is drawn in the browser — SVG geometry with CSS custom properties,
no photography, no external image hosts.

```bash
pnpm install
pnpm dev        # http://127.0.0.1:5273
```

| script | what it does |
| --- | --- |
| `pnpm dev` | Vite dev server on `127.0.0.1:5273` |
| `pnpm build` | typecheck, then production bundle into `dist/` |
| `pnpm preview` | serve the production bundle |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm verify` | headless-Chromium pass: console errors, overflow, all interaction states, screenshots |

> `pnpm verify` drives a real browser. Point it at your own build with
> `CHROME_PATH=/path/to/Chrome pnpm verify`.

---

## Design direction

**A precision acoustic instrument in a dark room.** Deep graphite ground, ice-silver
metal, and a single muted amber accent reserved for what matters: the primary action,
the active state, the one lit detail inside each earcup.

No pure black (`#0a0b0d` is the floor), no neon, no rainbow gradients, no emoji.

### The material system

Glass here is a stack, not a `backdrop-filter` one-liner. Every glass surface (`.glass`)
composes:

- a tinted diagonal fill so the surface catches light from one direction,
- `backdrop-filter` for genuine refraction of what sits behind it,
- a **1 px masked rim gradient** (`.glass::before`) that is bright where the key light
  lands and dim opposite — variable edge brightness, not an even border,
- a wide, very soft interior smear (`.glass::after`) standing in for refraction,
- an inset top highlight and an inset bottom shadow, so the pane has thickness.

Atmosphere is layered behind the content: two drifting volumetric pools and a light
beam, a vignette, plus two film-grain passes (coarse soft-light, fine overlay).

### Type

[Outfit](https://fonts.google.com/specimen/Outfit) variable, self-hosted from
`public/fonts` (latin + latin-ext subsets, ~47 kB total, preloaded). Chinese copy falls
back to PingFang SC / Microsoft YaHei / Noto Sans SC. Technical micro-labels use a
system monospace stack with tabular numerals. Inter is not used.

---

## How it is built

```
src/
  App.tsx                     page composition, colourway state, reservation state
  components/
    Nav.tsx                   floating glass nav, mobile sheet
    Hero.tsx                  asymmetric launch scene
    ProductStage.tsx          the installation: levitation, sweep, HUD
    Soundstage.tsx            canvas soundstage (pointer-reactive)
    Structure.tsx             sticky, scroll-driven exploded assembly
    Colorways.tsx             Obsidian / Mist Silver / Burnt Amber
    Specs.tsx                 technical drawing + specification table
    Purchase.tsx              price plinth and service row
    Footer.tsx                back cover of a brand publication
    DesignStory.tsx           90-second chapter sequence
    ReservationPanel.tsx      glass panel + form state machine
    product/
      parts.tsx               shared geometry, gradients, filters
      Headphones.tsx          the assembled instrument
      Exploded.tsx            the same parts as three independent layers
  lib/hooks.ts                scroll / motion / pointer plumbing
  styles/                     fonts, tokens, base, then one file per area
```

Tailwind is not used. The material language needs layered pseudo-elements, masked
rims and `@property`-driven cross-fades, which hand-written CSS expresses directly.

### Performance rules this codebase follows

- **React never renders per frame.** The magnetic CTA, the soundstage canvas and the
  structure progress all keep live values in refs and write to the DOM inside a single
  `requestAnimationFrame`. A pointer move cannot trigger a React update.
- **Scroll work is rAF-gated.** One passive `scroll` listener per scroll-driven section,
  coalesced into one `requestAnimationFrame`, which writes a single custom property
  (`--p`). Nothing is measured inside the event itself.
- **Scroll animation is transform and opacity only.** `--p` fans out through CSS into
  `translate3d`, `rotate`, `scale` and `opacity` — including the progress rail, which
  scales rather than resizing.
- **Continuous animation is isolated.** Everything that moves forever lives in a leaf
  component wrapped in `memo`, driven by CSS keyframes, so it can never re-render the
  page.
- The soundstage canvas pauses when it scrolls out of view (`IntersectionObserver`) and
  caps device pixel ratio at 2.

### Colourway switching without a re-render

The nine finish colours are registered custom properties (`@property --shell-hi` etc.)
on `<html>`. The SVG gradient stops, the ambient light pools and the HUD glow all read
those variables, so `data-colorway="mist"` cross-fades the entire page in the
compositor. The `<Headphones>` component is `memo`-ised and never re-renders for a
colour change.

### Motion and accessibility

- A full entrance choreography plays once: nav → eyebrow → headline → copy → CTAs →
  installation → HUD readouts, as staggered CSS animations behind one `data-entered`
  flag.
- `prefers-reduced-motion: reduce` removes the choreography, stops the ambient drift,
  freezes the soundstage on a still frame, and **unrolls the sticky structure section
  into one static annotated drawing** rather than making anyone scrub 340vh.
- Full keyboard operation: skip link, visible focus rings on every control, Escape to
  close the nav sheet and the reservation panel, a focus trap inside the dialog,
  focus restored on close, and `inert` + `aria-hidden` on the background while it is
  open.

### The reservation flow

`预约试听` opens a panel that grows out of the button that was pressed: the button's
rect is captured on click, converted into `--ox` / `--oy` on the panel, and the reveal
is a `clip-path: circle()` expanding from exactly that point with the panel scaling
from the same origin. Below 620 px it becomes a bottom sheet that rises instead.

The form has four real states — **default → validation-error → submitting → success** —
with inline Chinese validation, focus sent to the first invalid field, disabled inputs
while in flight, and a reservation code on the confirmation screen.

### The design story

`观看 90 秒设计故事` opens a five-chapter, 90-second sequence built from the same SVG
instrument — each chapter reframes the near earcup through a different `viewBox` and
rewrites its own caption. The timeline is one rAF loop that writes a single custom
property (`--t`) plus the clock text; only a chapter *change* touches React state.
Chapters can be scrubbed from the timeline, paused (button or `Space`), and replayed;
the whole overlay traps focus, closes on Escape, and returns focus to the button that
opened it.

---

## Note on `scripts/with-node.sh`

Some macOS runtimes ship Node signed with the hardened-runtime flag, which enables
library validation. Node then refuses to load Rollup's prebuilt native binding (it is
linker-signed with no team ID) and `vite` exits with `ERR_DLOPEN_FAILED` before it
starts. The wrapper detects that signature, makes a private ad-hoc re-signed copy of
the same Node under `.tools/`, and runs the command with it. On any other setup it is a
transparent pass-through.
