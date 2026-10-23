# 🏭 Fleet Control — Multi-Robot Warehouse Scheduling & Simulation

A full-stack, real-time warehouse scheduler: **8 robots**, **60 shelves**, **4 workstations**, one-cell-wide bottleneck aisles, space-time conflict-free planning, live replanning around dynamic obstacles, and an authoritative fixed-step backend streamed to the browser over SSE.

## Quick start

```bash
npm install        # installs Vite (build tool only — the server has ZERO runtime deps)
npm start          # → http://localhost:8080  (works immediately, no build required)
```

### Production build

```bash
npm run build      # Vite production build → dist/
npm start          # server automatically serves dist/ when it exists
```

### Development (optional, with Vite HMR)

```bash
npm start          # terminal 1 — backend on :8080
npx vite           # terminal 2 — frontend on :5173, /api proxied to :8080
```

Requires Node ≥ 16. State persists to `data/state.json` (delete it or press **Reset** for a fresh run).

## Acceptance walkthrough

1. **Dispatch 3+ jobs** — click shelves on the map (or use the dropdown), pick W1–W4 and a priority, press *Dispatch*. Watch robots thread the 1-wide aisles: paths are time-reserved, so you will see robots *yield at aisle mouths* with explicit reasons instead of colliding.
2. **Block a cell ahead of a moving robot** — switch to **Block cells** mode and click a floor cell on its dashed route. The server replans *immediately* (even while paused); the robot stops before the obstacle and detours, with the event logged.
3. **Disconnect / reconnect** — kill your network tab or restart the browser. On reconnect the server sends a full snapshot with the current sequence number; only strictly newer events are applied, so state never reverts. Refreshing the page resumes the *same persisted run*.
4. **Determinism** — pause, note the seed, press **Reset** with the same seed and issue the same actions at the same ticks: identical scheduling.

## Architecture

| Layer | Implementation |
|---|---|
| Simulation | `server.js` — authoritative fixed-tick loop (default 450 ms, adjustable). The client only interpolates *between* server positions for display. |
| Pathfinding | Space-time A* (x, y, t) with wait actions over a 60-step horizon; Manhattan heuristic, binary heap. |
| Collision safety | Per-tick reservation table: cell-time occupancy **and** directed edge reservations (no head-on swaps). All robots replan every tick in priority order; earlier plans are hard constraints for later ones. |
| Deadlock prevention | One-wide corridor segments are detected automatically (re-derived when blocks change) and get **direction locks**: opposing robots wait at the mouth; a robot already inside may always reverse out. |
| Fairness | Effective priority = job priority × 10000 + waiting-tick aging, so urgent jobs preempt routing conflicts while nobody starves. Every wait exposes a human-readable reason (`Yielding to R3`, `Aisle held by R2 (one-way)`, `Obstacle ahead — rerouting`…). |
| Streaming | SSE `/api/stream`. Every event carries a monotonically increasing `seq`. Each (re)connect receives a complete snapshot; the client drops stale events and re-syncs on any gap. |
| Persistence | Jobs, blocked cells, robot state, tick, seq and log are checkpointed to `data/state.json`; boot resumes the run. |
| Frontend | Vite + vanilla JS canvas renderer, Tailwind CSS, Font Awesome. Map + paths + queue + fleet table + event log visible simultaneously; responsive down to phone width. |

## REST API

```
GET  /api/state                 full snapshot (map, robots, jobs, log, seq)
GET  /api/stream                SSE: snapshot, then tick / state / log events
POST /api/jobs                  { shelf:"S07", station:2, priority:"high" }
POST /api/block                 { x:10, y:4, blocked:true }   → instant replan
POST /api/control               { action:"pause"|"resume"|"step"|"reset"|"speed", seed?, ms? }
```

## Map legend

Amber blocks = shelves (click to target) · teal pads = workstations W1–W4 · dashed teal squares = delivery approach cells · green rings = robot docks · rose ✕ = blocked cells · dashed colored lines = time-reserved planned routes · pulsing amber ring + `!` = waiting robot (hover for the reason).