# Pelican Pedal

A seaside endless-rider arcade game. A pelican on a bicycle, a sunset pier, a
lot of fish, and absolutely no brakes.

## Run

Open `index.html` directly, or serve the folder:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

No build step, network requests, fonts, or image assets are required. The whole
scene is drawn procedurally on a single canvas.

## Controls

| Action | Keyboard | Touch |
| --- | --- | --- |
| Hop / double-hop | `Space`, `↑`, `W` | Tap the playfield or **HOP** |
| Tuck / fast-fall | `↓`, `S` | Hold **TUCK** |
| Pause / resume | `P`, `Esc` | Pause button |
| Instant restart | `R` (or `Space` after a run) | **RIDE AGAIN** |
| Mute | `M` | Speaker button |

Hold jump for a higher hop. Press again in the air for a feather-powered double
jump. Tuck under swooping gulls or slam down to land faster.

## The loop

- Chain fish to raise the combo multiplier and fill the FRENZY meter.
- FRENZY makes you invincible, magnetises fish, doubles their points, and lets
  you smash straight through obstacles.
- After a frenzy there is a short cooldown, so keep your timing sharp.
- Three hearts. Runs are short, restarts are instant, and the top five local
  scores are saved in `localStorage`.
