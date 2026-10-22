# Pelican Pedal Club

A sunny, playable coastal cycling game. All game art is original Canvas 2D drawing; sound is synthesized with Web Audio. No framework, runtime dependency, image downloads, or API key is needed.

## Run

```sh
npm run dev
```

Open `http://localhost:5173`. A different port can be selected with `npm run dev -- --port 3000`.

## Build

```sh
npm run build
```

Serve the resulting `dist/` directory with any static web server. Google Fonts is an optional visual enhancement; system fonts work when offline. Gameplay, illustrations, audio, and saved rides work without an external service.

## Controls

| Action | Keyboard | Touch / mouse |
| --- | --- | --- |
| Start / retry | Space or R | Let’s ride / One more ride |
| Hop / double jump | Space, ↑, or W | Tap the coast or HOP |
| Float a little longer | Hold the jump key | Hold a jump touch |
| Boost | Hold Shift or → | Hold BOOST |
| Pause / resume | P or Escape | Pause / Keep rolling |
| Restart instantly | R | Start a fresh ride |
| Toggle audio | M | Speaker button |

Auto-pedal, collect fish, and jump over beach gear. Each fish earns 25 points times the current multiplier. Five consecutive fish increase the multiplier, up to ×4. Miss a fish or hit an obstacle to lose the streak. Clean jumps earn 15 bonus points, and distance adds two points per meter. Three collisions end a ride. After a collision, a short grace period prevents repeated damage.

Your five highest scores and three-character rider initials are saved on this browser with `localStorage`. If storage is unavailable, scores still work for the current visit. Leaving the tab or changing orientation pauses the game automatically.

## Implementation

- Fixed 120 Hz simulation with `requestAnimationFrame` rendering.
- Pixel ratio capped at 2; bounded particles and offscreen entity cleanup.
- Responsive world, obstacle scale, and speed for desktop and mobile.
- Pointer capture supports simultaneous boost and jump touches.
- Reduced-motion preference disables screen shake and idle motion.
- Accessible HTML controls, keyboard navigation, native help and leaderboard dialogs.

Files: `index.html` contains the screens, `style.css` the layout, `game.js` the gameplay and audio, and `art.js` the illustrations.
