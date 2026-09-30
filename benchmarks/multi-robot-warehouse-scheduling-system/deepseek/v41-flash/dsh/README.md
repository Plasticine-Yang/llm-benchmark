# Multi-Robot Warehouse Scheduling System

A complete, runnable full-stack simulation of a multi-robot warehouse: **cooperative
space-time path planning**, **time-step path reservations**, **real-time replanning when
an aisle is blocked**, and a **live UI** that shows every robot's position, planned route,
current job and the exact reason it is waiting.

Zero runtime dependencies — only Node.js built-ins (`node:http`, `node:crypto`, a small
RFC6455 WebSocket implementation) and a dependency-free frontend.

```
      ┌───────────────────────────────────────────────────────────────────┐
      │  Node process                                                     │
      │  server/engine.js  ← authoritative fixed-step simulation          │
      │      • priority scheduler (jobs, aging, deadlock breaker)         │
      │      • space-time A* + reservation table (cells + directed edges) │
      │      • single-lane aisle mutual exclusion                         │
      │      • event stream with monotonic seq + full snapshots           │
      └───────────┬───────────────────────────────────────────────────────┘
                  │  REST (/api/*)      WS (/ws)  or  SSE (/api/stream)
      ┌───────────▼───────────────────────────────────────────────────────┐
      │  Browser (pure observer)  canvas map · job queue · robot states   │
      │                           · event log · block/unblock · controls   │
      └───────────────────────────────────────────────────────────────────┘
```

---

## Quick start

Requirements: **Node.js ≥ 18** (tested on Node 24). No `npm install` is needed — there are
no dependencies.

```bash
cd multi-robot-warehouse-scheduling-system/deepseek/v-4-1-flash/dsh

# 1. development: serve public/ directly (no build step)
node server/index.js                 # → http://127.0.0.1:8090
#   or: npm run dev   /  pnpm dev

# 2. production build + serve the built assets
node scripts/build.mjs               # npm run build
node server/index.js --prod          # npm start   → http://127.0.0.1:8090

# 3. tests
node scripts/test.mjs                # npm test             (21 unit/integration tests)
node scripts/ui-smoke.mjs            # npm run test:ui      (frontend booted against a DOM stub)
node scripts/acceptance.mjs          # npm run test:acceptance (the brief's scenario)
node scripts/build.mjs && node scripts/test.mjs && node scripts/ui-smoke.mjs && node scripts/acceptance.mjs
                                     # npm run verify       (everything above in one go)
```

Useful flags / environment variables:

| Flag / env | Meaning |
| --- | --- |
| `--port=9000` / `PORT=9000` | HTTP port (default `8090`) |
| `--seed=1234` | deterministic seed used for a fresh run |
| `--prod` / `NODE_ENV=production` | serve `dist/` instead of `public/` |
| `--fresh` / `FRESH=1` | ignore the persisted state file and start a clean run |
| `DSH_STATE_FILE=/tmp/state.json` | where jobs / map changes / simulation state are persisted |

Then open <http://127.0.0.1:8090>.

---

## The acceptance scenario, step by step

1. **Create at least three simultaneous transport jobs.**
   In *New transport job* pick a shelf, a destination workstation and a priority, then press
   **Create job** — or press **3 demo jobs** (that button creates three jobs including one
   priority-5 job). Assigning is automatic: the scheduler gives each pending job to the idle
   robot with the shortest estimated route; if every robot is busy the job stays queued with a
   visible waiting time.
   Watch the canvas: robots thread the one-cell-wide aisles (tinted blue when
   *single-lane aisles* is on) single file. No two robots ever share a cell and no pair ever
   swaps cells — both properties are enforced by the backend and asserted by the test suite.

2. **Block a cell directly ahead of an active robot.**
   Select a robot (click it on the map, or click its row in *Robot states*) and press
   **⛔ Block cell ahead of R…** — or switch on **block mode** and click any traversable cell.
   The affected robots' reservations are invalidated immediately; the engine replans *before*
   the next step, so the robot stops short of the new obstacle, and the event log records
   `CELL_BLOCKED` and a `REPLAN (map-change)` entry. Unblock the cell again to re-open the route.

3. **Disconnect and reconnect.**
   Reload the page (or toggle your network). On reconnect the client receives a **complete
   snapshot** whose `seq` is at least as new as anything it had applied, then continues with
   strictly newer events. Stale events are dropped and logged
   (`snapshot applied: seq N … (discarded M stale events)`), so the view never jumps backwards.
   The simulation keeps running while the page is away — it is driven by the server only.

---

## What the UI shows

| Region | Contents |
| --- | --- |
| Header | connection state/transport, tick, sequence number, robot counters, moving/waiting counts, job counters, pause/resume, single step, reset (seed), speed slider |
| Map | walls, shelves, workstations, pickup points, blocked cells (red ✕), single-lane aisles, **every robot's planned route** (dashed when that robot is currently waiting), robots with id, status ring, carried-shelf marker and a `!` wait badge; hover tooltip for cell/robot details |
| New transport job | shelf → workstation → priority form, *3 demo jobs* |
| Job queue | id, route, priority (with aging boost `↑n`), status, assigned robot, waiting time |
| Robot states | state, job, position + remaining reserved steps, **waiting reason**, move count |
| Event log | sequenced, colour-coded event stream with filters (*key events / waits / moves / all*), auto-scroll and a *resync* button |
| Selected | details of the selected robot/cell, **Block cell ahead** and *block/unblock this cell* actions |

Keyboard: `space` pause/resume, `s` single step, `b` toggle block mode.

The layout is a three-zone desktop grid (map + side panels, event log below) and collapses to a
single column below 900 px, so nothing visibly breaks on a small screen.

---

## Scheduling, reservations and reasons

* **Map** — deterministic 28 × 18 warehouse: 20 shelves (1 × 2 blocks), 4 workstations, 12 robots
  and **12 one-cell-wide aisles** (every odd column between the shelf rows) plus pickup points
  adjacent to each shelf. The same seed always rebuilds a bit-identical world.
* **Pathfinding** — 4-connected A* over the static grid (never crosses shelves, walls or blocked
  cells) for estimates, and a **time-expanded A\*** (`planSpaceTime`) for execution. A state is
  `(cell, timestep)`; a move from `A@t` to `B@t+1` is only allowed when
  1. `B` is not reserved by another robot at `t+1` (no shared cell),
  2. the robot standing on `B` at `t` is not moving into `A` at `t+1` (no swap),
  3. entering a one-cell-wide aisle happens only when that aisle is empty of other robots
     (no head-on standoff — one vehicle per narrow aisle).
* **Reservations** — each robot commits a trajectory (a cell per absolute tick, padded with a
  hold at the end), which is written into a reservation table keyed `(tick, cell)`. Planning runs
  in strict priority order, so a lower-priority robot plans *around* already-committed traffic.
* **Waits are explained** — every wait carries a machine-readable `reason` plus a human `detail`,
  e.g. `cell-reserved-ahead`, `single-lane-aisle-occupied`, `swap-prevented`, `blocked-cell`,
  `no-route`, `holding`, `idle`. They appear on the map (dashed route + `!`), in the robot table
  and in the event log (`ROBOT_WAITING`).
* **No starvation** — pending jobs age: every 25 waiting ticks they gain an effective priority
  level (capped at +3, logged as `JOB_AGED`). Waiting robots also gain planning priority the
  longer they wait, so any robot eventually wins its cell.
* **Deadlock breaker** — if the fleet makes no progress for 22 ticks, or a single job robot has
  waited 45 ticks, the longest-waiting robot receives absolute scheduling priority for one
  coordinated replan (`DEADLOCK_BREAKER`), which provably breaks cyclic waits.
* **Replanning cadence** — a coordinated replan happens when the map changes, when a committed
  trajectory becomes invalid, when a robot's target changes, and at least every 6 ticks.
* **Pause / resume / single step / reset** — the engine only advances in `tickOnce()`; `step`
  advances exactly one tick. `reset(seed)` rebuilds the world from that seed, so an identical
  sequence of jobs reproduces an identical run (asserted by the test suite).

## State streaming, sequencing and persistence

* REST (`/api/state`, `/api/jobs`, `/api/sim`, `/api/cells`, …) and WebSocket `/ws`
  (SSE fallback `/api/stream`).
* Every event has a **strictly increasing `seq`**. On connect the server sends
  `{type:"snapshot", seq, snapshot, config}` and then replays any event with `seq > snapshot.seq`,
  so a client can join mid-run without a gap.
* The client applies a snapshot only when `snapshot.seq >= lastAppliedSeq` and ignores events
  with `seq <= lastAppliedSeq` — this is what makes reload/reconnect safe.
* Jobs, map changes and the current simulation state are written to
  `data/simulation-state.json` (atomic tmp+rename, debounced, flushed on `SIGINT`/`SIGTERM`).
  Restarting the server (or reloading the page) continues the same run, and sequence numbers
  keep increasing across the restart.

## REST API

| Method & path | Body | Result |
| --- | --- | --- |
| `GET /api/health` | – | liveness, tick, seq, clients |
| `GET /api/config` | – | grid, shelves, workstations, lanes, robots, planning limits |
| `GET /api/state` | – | `{seq, snapshot}` (full authoritative state incl. planned paths) |
| `GET /api/events?since=N` | – | event log replay |
| `GET /api/jobs` | – | job list |
| `POST /api/jobs` | `{shelfId, workstationId, priority}` | creates a job and schedules it |
| `POST /api/sim` | `{action: pause\|resume\|step\|speed\|reset, seed?, tps?, autostart?}` | simulation control |
| `POST /api/cells` | `{x, y, blocked}` | block/unblock a traversable cell (rejects shelves, walls and robot-occupied cells) |
| `POST /api/robots/block-ahead` | `{robotId}` | blocks the cell that robot is about to enter |
| `POST /api/demo` | – | creates three demo jobs |
| `GET /ws` (upgrade) · `GET /api/stream` | – | sequenced live stream |

## Project layout

```
server/warehouse.js    deterministic map generation (grid, shelves, workstations, aisles, pickup cells)
server/pathfinding.js  static A* + time-expanded A* with reservations, heap
server/engine.js       fixed-step simulation: scheduler, reservations, replanning, jobs, events, snapshot
server/store.js        atomic JSON persistence
server/ws.js           RFC6455 WebSocket server + SSE fallback
server/index.js        HTTP server, REST API, static files, simulation loop
public/                frontend (index.html, styles.css, app.js) — canvas renderer + live panels
scripts/build.mjs      production build: validation, minify, fingerprint, dist/
scripts/test.mjs       21 unit + integration tests
scripts/acceptance.mjs end-to-end run of this README's acceptance scenario
scripts/ui-smoke.mjs   boots the frontend on a DOM stub and asserts rendering + sequence rules
dist/                  build output (created by scripts/build.mjs)
data/                  persisted simulation state (git-ignored)
```

## Tests

`npm test` covers, among others:

* map invariants (20 shelves / 4 workstations / 12 robots / one-cell aisles, determinism);
* A* correctness: 4-connected, never crosses shelves/walls/blocked cells, `null` when unreachable;
* 12 robots + 6 jobs for 200 ticks with **zero shared cells and zero swaps**;
* every job delivered, robots always on traversable cells;
* no two robots inside one single-lane aisle;
* blocking the cell ahead → the robot never enters it, replans immediately, and resumes progress;
* identical seeded runs produce identical trajectories; `reset(seed)` reproduces a run;
* a priority-1 job finishes even while priority-5 jobs flood the queue (no starvation);
* WebSocket snapshot + strictly increasing sequence numbers; reconnect never goes stale;
* SSE fallback; persistence across a restart; pause/step semantics.

`npm run test:ui` boots the real frontend module against a DOM stub, applies a burst of
engine events through the same code path the socket uses, and asserts that stale events and
stale snapshots are ignored while a newer snapshot is accepted.

## Troubleshooting

* **Port already in use** → `node server/index.js --port=8123`.
* **Want a clean slate** → `node server/index.js --fresh` (or press *Reset* in the UI, which
  clears jobs and blocked cells and restarts the deterministic run with the entered seed).
* **Only floor and workstation cells can be blocked** — shelves and walls are structural; cells
  currently occupied by a robot are rejected with an explanatory error.
* **Simulation seems idle** → one robot per narrow aisle is intentional (mutual exclusion, visible
  in the event log as `single-lane-aisle-occupied`); add jobs and the queue keeps flowing.
* **WebSockets blocked by a proxy** → the page automatically falls back to SSE (`/api/stream`)
  and shows the transport in the header chip.
