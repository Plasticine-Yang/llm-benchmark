# Multi-Robot Warehouse Scheduling System

A deterministic, full-stack multi-robot warehouse scheduling and simulation system.
Robots pick up goods at shelves, deliver them to workstations, plan routes through
one-cell-wide aisles, avoid collisions with a **space-time reservation table**, and
replan immediately when a cell is blocked. The Node.js backend is the single
authoritative state source; the browser only renders what the backend streams.

**Zero runtime dependencies** — Node.js 18+ built-ins only. No `npm install` needed.

---

## 1. Setup and start

```bash
# Node.js >= 18
cd <this-directory>

# (optional) there are no dependencies to install
npm install

# run the app (server + UI)
npm start
# or: node server/index.js
```

Open **http://localhost:4173**.

Optional environment variables:

| Variable | Default | Meaning |
| --- | --- | --- |
| `PORT` | `4173` | HTTP port |
| `HOST` | `0.0.0.0` | bind address |
| `SEED` | `20261114` | deterministic seed for a fresh run |
| `TICK_MS` | `320` | fixed time-step length in ms |
| `DATA_DIR` | `./data` | where `state.json` is persisted |

Other commands:

```bash
npm run build   # production bundle into dist/ (hashed assets + manifest + syntax validation)
npm test        # unit + end-to-end acceptance tests (node:test)
npm run check   # syntax-check every shipped JS file
```

`npm start` serves `dist/` when it exists, otherwise `public/`. Run `npm run build`
before deploying.

---

## 2. Warehouse layout (deterministic)

A `35 x 23` grid generated from the seed:

- **8 robots** (`R1`–`R8`) with distinct home/parking cells.
- **24 shelves** (`S01`–`S24`) as 2x2 solid blocks. Each shelf has one adjacent
  *access cell* — a one-cell-wide aisle — used as the pickup point.
- **4 workstations** (`W1`–`W4`) at the four corners.
- A solid 3-column divider splits the warehouse into west and east halves. They
  are connected by exactly **three 1-cell-wide, 3-cell-long tunnels** at rows 5, 11, 17.
- 21 additional one-cell-wide aisle segments between shelf blocks are detected
  automatically and treated as mutual-exclusion corridor resources.

Everything is derived from `buildMap()` in `server/engine.js`; the seed controls
the PRNG used for deterministic assignment tie-breaking.

---

## 3. Scheduling algorithm (backend)

Every fixed time step the engine recomputes cooperative plans in priority order
(**prioritized space-time A\*** on the `(x, y, t, waypoint)` graph):

1. Each robot plans its **complete remaining route**: `pickup -> workstation -> home`.
   Because the full route (not just the next step) is reserved, a lower-priority
   robot can never commit to being inside a narrow aisle at the same time a
   higher-priority robot needs it from the opposite end.
2. Committing a plan reserves:
   - **vertices** `(x,y,t)` → two robots can never occupy one cell at one time;
   - **directed edges** `(u->v at t)` → a move is rejected if another robot
     reserved the reverse edge `v->u` at `t`, preventing head-on swaps;
   - the **final cell forever** → parked/idle robots are permanent obstacles;
   - **aisle-segment locks** over the whole traversal window → only one robot may
     occupy a one-cell-wide aisle at a time, which prevents permanent head-on deadlock.
3. A robot with no conflict-free route waits **or replans**; if it still cannot
   move it is promoted to a static obstacle and all robots are replanned
   (bounded iterations). An escape search lets a robot back out of a tunnel
   when a new obstacle appears behind it.
4. **Anti-starvation**: effective priority = `job.priority * 1000 + waitingTicks * 25`,
   plus an emergency boost after 45 idle ticks. Pending jobs also age in the queue,
   so an old low-priority job eventually outranks a fresh high-priority one.
5. `resolveMoves()` is a final safety net that re-checks vertex and swap conflicts
   on the single step actually executed.

Wait reasons are produced by the planner itself (e.g.
`R3 (job P5) reserves cell (17,11) at t+6`, `aisle C4 is locked by R2
(head-on deadlock prevention)`, `cell (17,5) is a wall, shelf or newly blocked cell`)
and are shown in the robot table and the event log. This is not a cosmetic label —
it is the actual reason the A\* expansion rejected that action.

**Blocking a cell** (`POST /api/cells` or click the map) immediately:
finds every robot whose reserved route used that cell, logs a `replan` event with
the reason, and recomputes all plans before the next step, so no robot enters it.

---

## 4. Real-time consistency (SSE)

- `GET /api/stream?lastSeq=N` sends **a complete snapshot first**
  (`event: snapshot`) carrying the current monotonic `seq`, the entire map,
  all robots with their reserved routes, jobs, dynamic blocks, and event log.
  It also reports `resumedFrom` and how many events were missed.
- Every subsequent state change is `event: state`, `id: <seq>`, with a
  strictly increasing `seq`.
- The client keeps a **watermark**: it applies a `state` frame only when
  `seq > watermark`, otherwise it logs `IGNORED stale event`. A reconnect snapshot
  is authoritative and always adopted, so the UI can never revert to stale state.
- `Last-Event-ID` / `lastSeq` are honoured, `retry: 1000` is sent, and heartbeats
  keep the connection alive.

The engine is persisted to `data/state.json` after **every** state change
(ticks, job creation, map changes, controls). Jobs, map changes, robot positions,
phase, seed and RNG state are all stored, so a page reload — or a full server
restart — continues the same run. `seq` is deliberately **never reset**, including
on `Reset`.

---

## 5. HTTP API

| Method | Path | Body | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/health` | — | seq, tick, paused, clients, seed |
| `GET` | `/api/state` | — | full authoritative snapshot |
| `GET` | `/api/stream?lastSeq=N` | — | SSE snapshot + live state |
| `POST` | `/api/jobs` | `{shelfId, stationId, priority}` | create job; scheduler assigns a robot |
| `POST` | `/api/cells` | `{x, y, blocked?}` | block / unblock / toggle any traversable cell |
| `POST` | `/api/block-ahead` | `{robotId}` | convenience: block the robot's next planned cell |
| `POST` | `/api/control` | `{action, seed?, ms?}` | `pause`, `resume`, `step`, `reset`, `speed` |

`priority` is 1 (Low) … 5 (Urgent). Cell coordinates are 0-based `(x, y)`.

---

## 6. Using the UI

The single screen shows the map, planned paths, job queue, robot states/wait
reasons, and event log at the same time. The layout collapses to a single column
on narrow screens.

- **Create transport job** — pick a shelf, a workstation and a priority; an
  available robot is assigned immediately (otherwise the job stays in the queue).
- **+ 3 demo jobs** — creates three simultaneous jobs (P5/P3/P1) that deliberately
  force robots through the narrow tunnels in both directions.
- **Click a map cell** — block/unblock it live.
- **Block ahead of** — choose a robot and block its next planned cell in one click.
- **Pause / Single step / Reset (same seed)** — deterministic reproduction;
  speed buttons change the fixed step length.
- **Disconnect / Reconnect** — close the SSE stream while the server keeps
  ticking, then reconnect. The stream panel shows the snapshot, `resumedFrom`,
  missed events and the watermark. The **Stream consistency** log demonstrates
  that stale frames are ignored.
- Colours: dashed lines are backend-reserved routes; rings mark current job
  targets; red crossed cells are blocked; orange cells are one-cell-wide aisles.

---

## 7. Acceptance scenario (also automated in `tests/e2e.test.js`)

1. Click **+ 3 demo jobs**. Three robots are auto-assigned; watch them cross the
   tunnels at rows 5/11/17. The robot table shows `MOVE` and the next cell.
2. Click **Block ahead of R1** (or click a cell just in front of a robot). The
   event log immediately shows `MAP: Cell (...) blocked` and `REPLAN: R?
   replanning: blocked cell (...) was on its reserved route`. The dashed route
   visibly detours and the robot stops before the obstacle.
3. Click **Disconnect**, wait a few seconds, click **Reconnect**. A `SNAPSHOT`
   frame with a fresh `seq` and `resumedFrom` is applied, subsequent `state`
   frames have strictly larger seq, and the tick counter never goes backwards.
4. Reload the page (or restart the server): the same jobs, blocked cells, tick
   and robots are still there.

`npm test` additionally verifies, over hundreds of fixed steps:
zero vertex collisions, zero head-on swaps, no robot ever entering a wall/shelf/
blocked cell, deterministic replay from the same seed, immediate replanning,
no starvation, and 8 concurrent bidirectional tunnel crossings all completing.

---

## 8. Files

```
server/engine.js    deterministic map, space-time A*, reservations, scheduler, persistence
server/index.js     HTTP server, REST API, SSE stream, fixed-step ticker
public/index.html   single-screen dashboard
public/styles.css   responsive light-theme layout
public/app.js       canvas renderer, seq watermark guard, controls, forms
scripts/build.js    zero-dependency production build (hashed assets + manifest)
tests/engine.test.js  simulation correctness tests
tests/e2e.test.js     full acceptance scenario against a real server
data/state.json       created at runtime; persisted run
dist/                 production build output
```
