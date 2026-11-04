# Pelican Pedal

A one-button seaside bike game. A pelican rides a bicycle down a boardwalk, hops beach junk, and snaps up fish for combo points. Runs entirely in the browser with no build step and no external assets.

## Run

Open `index.html` directly, or serve the folder:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## Controls

| Action | Keyboard | Touch |
| --- | --- | --- |
| Start / restart | `Space`, `Enter`, or the button | Tap the button |
| Jump | `Space` / `↑` / `W` | Tap anywhere |
| Flap (double jump) | Press again in mid-air | Tap again in mid-air |
| Higher jump | Hold the key / keep the finger down | Keep the finger down |
| Pause / resume | `P` or `Esc` | Pause button |
| Mute | `M` or the ♪ button | ♪ button |

## What is in it

- Endless side-scrolling run with a distance-based score and a fish combo multiplier (up to ×8).
- Tight jump feel: variable jump height, double-jump flap, and a small pre-landing jump buffer.
- Juice: screen shake, crash flash, slow-motion wipeout, feather/dust/spark particles, squash and stretch, floating score popups, speed lines, and a scrolling parallax seaside.
- Start screen with a live animated scene, pause screen, game-over screen with instant restart, and a local top-5 high-score table (with the current run highlighted).
- Day → golden hour → dusk → night sky cycle driven by distance travelled.
- Synthesized Web Audio sound effects (no audio files), with a persisted mute setting.
- Responsive layout: separate tuning for desktop, portrait phones, and short landscape screens. DPR capped at 2, pooled particles, cached glow sprite, fixed 120 Hz physics with a capped accumulator.

## Files

- `index.html` — markup, HUD, and overlays
- `style.css` — theme, panel and HUD styling, responsive rules
- `js/core.js` — state, physics, spawning, collision, audio, localStorage
- `js/render.js` — canvas scene, parallax, characters, particles
- `js/ui.js` — input, overlay flow, HUD sync, game loop

High scores and the mute preference are stored under the `pelican-pedal-v1` localStorage key.
