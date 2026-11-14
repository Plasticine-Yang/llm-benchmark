# Multi-Robot Warehouse Scheduling System

A full-stack, real-time warehouse simulator: an authoritative backend scheduler drives 10 robots
across a deterministic 31×21 grid, moving shelves to workstations while avoiding space-time
conflicts. The browser is a pure view — it never decides where a robot ends up.

- **Backend**: Node.js + Express + `ws`, space-time A* with prioritized reservations
- **Frontend**: React 18 + TypeScript + Vite, canvas renderer
- **Transport**: WebSocket with automatic SSE fallback, monotonic sequence numbers
- **Persistence**: atomic JSON snapshots — reload the page or restart the server and the run continues

---

## Quick start

Requires **Node.js ≥ 20**.

```bash
npm run setup     # install server + client dependencies
npm run dev       # start backend (:8787) and Vite dev server (:5173)
```

Open **http://localhost:5173**.

### Production

```bash
npm run build     # type-checks and builds the client into client/dist
npm start         # serves API + WebSocket + the built UI on http://localhost:8787
```

Or do both in one command:

```bash
npm run serve
```

### Tests and type checking

```bash
npm test          # 11 engine tests (node:test, no extra dependencies)
npm run typecheck # tsc --noEmit on the client
```

### Configuration

| Variable    | Default   | Purpose                              |
| ----------- | --------- | ------------------------------------ |
| `PORT`      | `8787`    | Backend / production UI port         |
| `SEED`      | `20261114`| Initial warehouse seed               |
| `DATA_DIR`  | `./data`  | Where `state.json` is persisted      |

---

## The warehouse

Generated deterministically from the seed — the same seed always produces the same map,
the same robot home positions and the same pillar placement.

| Element        | Count | Notes                                                        |
| -------------- | ----- | ------------------------------------------------------------ |
| Grid           | 31×21 | Walled border                                                 |
| Robots         | 10    | `R01`…`R10`, seeded home positions                            |
| Shelves        | 25    | `S01`…`S25`, 3×2 racks in a 5×5 layout — **impassable**        |
| Workstations   | 4     | `W1 (27,4)`, `W2 (27,13)`, `W3 (5,18)`, `W4 (16,18)`           |
| Seed pillars   | 4     | Reverted automatically if they would disconnect the map       |

A wall at `x = 23` spans `y = 2…16` with a single gap at `y = 9`. This forces all traffic between
the rack field and the right-hand stations through the **one-cell-wide service corridor at `x = 22`**
— the main bottleneck. Corridor cells (traversable cells with ≤ 2 open neighbours) are tinted on the
map and carry a small A* cost penalty, so robots prefer wider aisles when one is available.

Map connectivity is validated with BFS at generation time.

---

## How scheduling works

### Space-time reservations

Pathfinding is A* over `(x, y, t)`, not over space alone. Two reservation tables are shared by
all robots in a planning pass:

- **Vertex** `x,y,t` — no two robots may occupy the same cell at the same tick
- **Directed edge** `x1,y1>x2,y2,t` — no two robots may swap cells in the same tick

Robots plan in priority order (prioritized planning). Each plan reserves its cells *and* the
loading/unloading dwell window at the goal, so two robots can never book overlapping service
time at the same shelf face or workstation. Waiting in place is a legal action with a slightly
higher cost than moving, which lets A* yield naturally instead of failing.

### Deadlock and starvation

- **Wait-for chains**: a robot blocked for `STUCK_TICKS` (10) triggers a chain walk. Idle robots
  sitting in the way are relocated to a free non-corridor cell so the aisle clears.
- **Escalation**: after `ESCALATE_TICKS` (45) the planner relaxes reservations for the stuck robot
  and forces a resolution, so a narrow-aisle head-on encounter can never become permanent.
- **Service queues are not deadlocks**: waiting behind a robot that is loading/unloading is
  expected and is excluded from deadlock handling.
- **Priority aging**: `effectivePriority = priority × 60 + (tick − createdAtTick)`. A low-priority
  job eventually outranks a fresh high-priority one, so nothing starves.
- **Post-job parking**: after unloading, a robot relocates off the workstation instead of idling on
  it, keeping stations and corridors available.

### Plan consistency is verified, not assumed

After every planning pass the engine re-checks all reservations for vertex and swap overlaps.
Conflicting plans are requeued and repaired (up to 5 passes); if a conflict still cannot be
resolved, the offending robots are **frozen in place** — a guaranteed-safe fallback rather than
an unsafe move. Every tick also asserts the invariants directly against the resulting positions:

- no two robots share a cell
- no robot occupies a wall, shelf or blocked cell
- no pair of robots swapped cells

Counters for `invariantChecks` and `violations` are shown live in the UI. **Violations stay at 0.**

### Why is a robot waiting?

Every robot always exposes a human-readable reason, surfaced in the robot list, in the map
tooltip and in the event log: `loading`, `unloading`, `waiting for R07 at (22,9)`,
`yielding — relocating to clear the aisle`, `no conflict-free route`, `deadlock resolution pending`.

---

## Real-time state consistency

The backend advances fixed ticks (`1…30 t/s`, default 5) and is the single source of truth.

- Every snapshot and delta carries a **monotonically increasing `seq`**. `seq` is never reset,
  even across a simulation reset; a reset instead increments `runId`.
- On connect (and on reconnect) the server sends a **complete snapshot** first.
- The client drops any delta whose `seq` is not newer than what it already has, and forces a
  resync if `runId` changes — stale events can never roll the view backwards.
- WebSocket is primary; after repeated failures the client falls back to **SSE** (`/api/stream`)
  with exponential backoff. The badge in the top bar shows which transport is live.
- Job queue, robot states, planned paths and the event log all update from the same stream.

State (jobs, blocked cells, tick, seed, robot positions, stats, logs) is written to
`data/state.json` atomically (temp file + rename) with a 750 ms debounce, and flushed on
`SIGINT`/`SIGTERM`. Reloading the page **or restarting the server** resumes the same run.

---

## Using the UI

Everything is visible at once: map + planned routes on the left, job composer / job queue /
robot list / event log on the right, metrics and controls in the top bar.

**Map toolbar modes**

| Mode              | Click behaviour                                        |
| ----------------- | ------------------------------------------------------ |
| Inspect           | Hover for cell / shelf / robot details                  |
| Block / Unblock   | Toggle an obstacle on any floor or workstation cell     |
| Pick shelf        | Select the job source                                   |
| Pick station      | Select the job destination                              |

**Controls**: Pause · Resume · Step (single tick, works while paused) · Speed · Reset with a seed ·
Resync (force a fresh snapshot). Toggle `planned paths` to show/hide routes; click a robot in the
list to highlight only its route.

Blocking a cell immediately invalidates every route that reserved it. Affected robots stop before
the obstacle and replan on the next tick — the event log records both the block and each replan.

---

## Acceptance walkthrough

1. **Concurrent jobs through the bottleneck** — click **`3 mixed jobs`** (or **`8 stress jobs`**).
   Three or more robots are assigned at once and route through the `x = 22` corridor. Watch them
   yield rather than collide; `VIOLATIONS` stays `0`.
2. **Block a cell directly ahead of a moving robot** — click **Pause**, then **Step** a few times so
   a robot is mid-route. Switch to **Block / Unblock** and click the next cell on its dashed path.
   Press **Step**: the robot reroutes around the obstacle on that very tick and never enters it.
   The log shows `Cell (x,y) BLOCKED by operator` followed by `Rxx replanning: obstacle appeared on
   its reserved route`.
3. **Disconnect / reconnect** — reload the page. The run continues (`RUN` and `SEED` unchanged,
   tick and `SEQ` keep climbing, jobs and blocked cells preserved). The client receives a full
   snapshot and then only newer deltas. Killing the WebSocket mid-run shows `RECONNECTING`, then
   `LIVE · WebSocket` again with no state regression; if WebSocket stays unavailable it switches to
   `LIVE · SSE`.
4. **Reproducibility** — note the seed, click **Reset** with the same seed: identical map, identical
   robot homes, identical schedule.

---

## REST API

| Method   | Endpoint             | Body                          | Purpose                     |
| -------- | -------------------- | ----------------------------- | --------------------------- |
| `GET`    | `/api/health`        | —                             | Liveness + tick/seq         |
| `GET`    | `/api/meta`          | —                             | Warehouse geometry          |
| `GET`    | `/api/state`         | —                             | Full authoritative snapshot |
| `POST`   | `/api/jobs`          | `{shelfId, stationId, priority}` | Create a transport job   |
| `POST`   | `/api/jobs/auto`     | `{count}`                     | Create random valid jobs    |
| `DELETE` | `/api/jobs/:id`      | —                             | Cancel a job                |
| `POST`   | `/api/cells/block`   | `{x, y}`                      | Add an obstacle             |
| `POST`   | `/api/cells/unblock` | `{x, y}`                      | Remove an obstacle          |
| `POST`   | `/api/sim/pause`     | —                             | Pause                       |
| `POST`   | `/api/sim/resume`    | —                             | Resume                      |
| `POST`   | `/api/sim/step`      | —                             | Advance exactly one tick    |
| `POST`   | `/api/sim/speed`     | `{tps}`                       | Set ticks per second (1–30) |
| `POST`   | `/api/sim/reset`     | `{seed}`                      | Reset with a seed           |
| `GET`    | `/api/stream`        | —                             | SSE fallback stream         |
| `WS`     | `/ws`                | `{type:"hello", lastSeq}`     | Primary stream              |

---

## Tuning constants

Defined in `server/src/engine.js` and reported to the client in `state.constants`:

| Constant          | Value | Meaning                                        |
| ----------------- | ----- | ---------------------------------------------- |
| `HORIZON`         | 140   | Space-time planning horizon (ticks)             |
| `LOAD_TICKS`      | 6     | Dwell at a shelf face                           |
| `UNLOAD_TICKS`    | 5     | Dwell at a workstation                          |
| `STUCK_TICKS`     | 10    | Blocked ticks before deadlock handling starts   |
| `ESCALATE_TICKS`  | 45    | Blocked ticks before forced resolution          |
| `AGING_TICKS`     | 60    | Priority aging weight                           |

---

## Project layout

```
server/
  src/
    rng.js         deterministic PRNG (mulberry32) + seed hashing
    warehouse.js   seeded map generation, corridor detection, connectivity
    pathfind.js    space-time A*, vertex/edge reservation keys, BFS distance
    engine.js      authoritative tick loop, assignment, replanning, invariants
    store.js       atomic debounced JSON persistence
    index.js       Express REST + WebSocket + SSE + static hosting
  test/
    engine.test.js 11 tests: determinism, collisions, deadlock, blocking,
                   starvation, persistence, sequence monotonicity, controls
client/
  src/
    net.ts         useSim() stream hook (seq/runId guards, WS→SSE fallback) + REST
    App.tsx        layout and interaction modes
    components/    MapCanvas (canvas renderer), Panels (all UI panels)
    types.ts       shared payload types
    styles.css     dark theme, responsive down to small screens
scripts/dev.mjs    runs backend + Vite together
data/state.json    persisted run (created at runtime)
```

## Test coverage

`npm test` runs 11 tests against the real engine:

warehouse shape & connectivity · same-seed determinism · heavy-load collision freedom over
1400 ticks · block-ahead immediate replan · head-on encounter in a narrow aisle · idle robot
yielding from a workstation · low-priority non-starvation · wait reasons always exposed ·
bit-identical persistence resume · monotonic `seq` across snapshots, deltas and resets ·
pause / step / reset semantics.