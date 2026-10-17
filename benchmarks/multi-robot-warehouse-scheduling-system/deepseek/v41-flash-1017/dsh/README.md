# TESSERA — Warehouse OS

A runnable full-stack multi-robot warehouse scheduling and simulation system. The backend owns time, movement, reservations and every final robot position. The React dashboard is a live, one-way view of that authoritative state.

The deterministic warehouse contains **8 robots**, **20 shelves**, **4 workstations**, and **4 one-cell-wide bottleneck aisles** arranged around the rack field. Three demo jobs are generated from the run seed so the scheduler is visible immediately.

---

## Setup & run

Requires **Node.js 18+** and **pnpm 9+**.

```bash
# from the project root
pnpm install

# development: API on :8787 + Vite UI on :5173
pnpm dev
# open http://localhost:5173
```

Production build and start:

```bash
pnpm build
pnpm start
# open http://localhost:8787
```

`pnpm start` serves the built frontend and the WebSocket endpoint from the same process. The build uses `@rollup/wasm-node` through `pnpm-workspace.yaml` so production builds do not depend on a platform-specific Rollup native binary.

Useful environment variables:

| Variable | Default | Meaning |
| --- | --- | --- |
| `PORT` | `8787` | HTTP + WebSocket port |
| `SEED` | `20261017` | Seed used for a brand-new run |
| `DATA_FILE` | `server/data/state.json` | Persistence file |
| `RESET_STATE` | unset | Set to `1` to ignore persisted state and start fresh |

For a clean slate, delete `server/data/state.json` (or set `RESET_STATE=1`).

---

## Verify

```bash
pnpm test     # scheduler invariants, blocking, determinism, topology
pnpm smoke    # boots an isolated server; tests WS snapshot/reconnect sequencing
```

The smoke test starts its own server on port `8899` with a temporary state file. Override with `SMOKE_PORT` if necessary.

---

## Acceptance walkthrough

1. **Concurrent jobs**
   - In *Dispatch console*, create at least three jobs (for example `S03 → WS-B`, `S07 → WS-C`, `S14 → WS-A`). These pickups sit in three different narrow aisles.
   - The right-hand *Job queue* shows each job; the *Robot states* panel shows the assigned robot, current task, route claim, and any hold reason. Planned routes are drawn on the map in each robot's colour.
   - Watch the robots move through the one-cell aisles. Corridor exclusivity means two robots cannot meet head-on; a robot that cannot yet enter shows a reason such as `Holding at aisle entrance — C2 is locked by R5`.
2. **Block a route cell**
   - Click any traversable map cell to add/remove an obstacle. Workstation docks, pickup cells and even an occupied cell can be toggled. The full authoritative route set is invalidated and replanned immediately (the event log records the edit and the new sequence number).
   - The affected robot will never enter the new obstacle. If no conflict-free route exists, it holds with its reason visible in the fleet, job card, map inspector and event log.
   - *Clear blocks* removes all operator obstacles at once.
3. **Disconnect / reconnect**
   - Reload the page, or use browser DevTools → Network → Offline and back online. The client reconnects the WebSocket and installs a complete snapshot at the server's current `seq`; every subsequent update must have a strictly greater `seq`. A "Stream resynchronised" toast reports the snapshot sequence.
   - State, jobs and map edits are persisted to `server/data/state.json`, so a reload (or a backend restart) continues the same run.

---

## Controls

- **Pause / Resume** — stop or restart the fixed server-side clock (`650 ms` per tick by default).
- **Step** — pause and execute exactly one tick. Useful for inspecting reservations and waits one time step at a time.
- **Reset** — rebuilds the run with the **same seed**, clears jobs/map edits, and starts paused at tick 0. Deterministic seed → identical initial fleet, jobs and scheduling decisions.
- **Map** — click any traversable cell to toggle an obstacle; click a robot marker (or a fleet row) to inspect that robot and its claimed route.
- **Priority** — Low / Normal / High. The dispatcher serves higher priority first, ties by wait time, and applies an aging safeguard after **32 ticks** so queued work cannot starve indefinitely.

The first three jobs are seeded demo jobs. Reset reproduces them from the same seed; creating new jobs does not mutate the seed.

---

## Architecture

```text
server/
  warehouse.js     deterministic grid, shelves, pickups, stations, narrow aisles
  pathfinding.js   time-expanded A*, ReservationTable, static BFS dispatch distance
  simulation.js    authoritative fixed-step scheduler, jobs, routes, aging, blocks
  store.js         atomic JSON persistence
  index.js         Express API + WebSocket broadcast + static production build
src/
  App.jsx          operations dashboard
  components/      map, dispatch/job queue, fleet, event log
  useSimulation.js sequence-gated WS client with snapshot reconnect
test/              scheduling invariants
scripts/smoke.mjs  end-to-end API + WS reconnect test
```

### Scheduling model

1. **Priority dispatch.** Queued jobs are sorted by a starvation-aware key: jobs past the aging threshold first, then priority, then longest wait. The nearest idle robot with a traversable pickup route is assigned.
2. **Space-time A\***. Every planning pass builds routes over `(x, y, time)` with wait actions. Static shelves/walls and operator obstacles are impassable. Each route claims one cell at each tick.
3. **Reservations.** A `ReservationTable` claims cells for each route and tick. A robot may not enter a cell claimed at the same tick, nor a cell occupied in the immediately previous tick. The latter enforces a safe following gap and makes a same-tick cell swap impossible. A final authoritative move check independently rejects duplicate targets, occupied targets and opposite-direction swaps before positions are committed.
4. **Head-on prevention.** Narrow corridors (one-cell-wide, detected dynamically from the live traversable map) are exclusive resources. A robot currently inside a corridor is planned first and owns that corridor for the pass; other routes may not use any of its cells. Corridors entered by a planned route are locked for the remainder of that pass. This removes the possibility of two robots entering a permanent head-on standoff in a one-lane aisle.
5. **Replanning.** Every tick replans from the current positions, so an operator block, prioritisation change, completion or route invalidation instantly produces a fresh conflict-free plan. Only the first move of each plan is committed; the remaining claimed route is shown in the UI.
6. **Fixed steps.** A single server timer advances ticks. The browser never advances time or computes positions; commands are API calls and all rendered state arrives from the server.

### Real-time protocol

- `GET /api/state` returns a full authoritative snapshot.
- `GET /api/health` reports process and stream health.
- `POST /api/jobs` with `{ shelfId, workstationId, priority }`.
- `POST /api/block` with `{ x, y, blocked }`; `POST /api/blocks/clear`.
- `POST /api/sim/pause`, `/api/sim/resume`, `/api/sim/step`, `/api/sim/reset` (`{ seed }` optional).

WebSocket `/ws` sends:
- `{ type: "snapshot", seq, state }` once per connection, then
- `{ type: "update", seq, state }` for every authoritative commit.
- `seq` is strictly increasing for the process and survives page reloads. Reset keeps the sequence monotonic. Updates are full states so even a skipped frame cannot create divergence, and the client additionally ignores any state with `seq` not greater than the last applied state.
- Heartbeat pings remove dead clients.

### Persistence

Every committed tick and command is written atomically to the JSON store. Jobs, map edits, robot positions/tasks, event log, seed, tick, sequence number and running/paused state are restored on boot. On a page reload the in-memory authoritative simulation simply reconnects; on a backend restart it is hydrated from disk and plans are rebuilt.

---

## Notes

- Demo jobs are automatically seeded; additional jobs can be created at any time while running or paused.
- All scheduling tie-breaks are deterministic for a given seed and sequence of user inputs. Wall-clock timestamps in the event log are informational.
- The event log retains the latest 320 entries; completed jobs remain in the queue card so the run can be audited.
