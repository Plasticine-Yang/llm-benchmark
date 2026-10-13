# Multi-Robot Warehouse Scheduling System

Full-stack, deterministic multi-robot warehouse simulator. A Node.js backend owns a fixed-time-step simulation (space-time A* + reservation table). A Vite/TypeScript frontend renders the authoritative state, which it receives over SSE.

## Setup & run

Requires Node.js ≥ 18 (tested with 22).

```bash
npm install
npm run build        # type-check + production build into dist/
npm start            # backend + built UI on http://localhost:8787
```

Development (hot reload UI on http://localhost:5173, proxied to backend on 8787):

```bash
npm run dev
```

Tests (collisions, swaps, obstacle crossing, dynamic replanning, determinism, sequence monotonicity):

```bash
npm test
```

Env vars: `PORT` (default 8787), `SEED` (initial seed, default 42), `DATA_FILE` (default `data/state.json`).
To start a completely fresh run, delete `data/`. The **Reset** button does the same with any seed you pick.

## Warehouse

30×18 grid with 10 robots, 80 shelves (S01–S80), 4 workstations (W1–W4, left wall) and 10 parking cells.
A horizontal wall band splits the warehouse. Four **one-cell-wide, three-cell-long bottleneck corridors** cross it (x = 3, 11, 19, 26), and they are highlighted yellow in the UI. The aisles between shelf pairs are one cell wide as well.

## How scheduling works (`server/sim.js`)

- **Assignment**: queued jobs are ordered by priority plus aging (`priority*100 + age/2`), then FIFO. Each job gets the closest idle robot by true BFS distance to the shelf's pickup cell. Jobs whose pickup cell is unreachable stay queued and show the reason.
- **Pathfinding**: windowed space-time A* (20-step horizon) with a BFS true-distance heuristic. Neighbours are restricted to cells that are passable: not a wall, shelf or blocked cell.
- **Reservations**: robots plan in a stable order (job priority, then assignment time). Each plan reserves `(cell, t)` vertices and `(a→b, t)` edges. Later robots cannot take a reserved vertex (no same-cell conflicts), and they cannot traverse the reverse of a reserved edge (no swaps). Loading/unloading robots reserve their cell for the whole window.
- **Deadlock avoidance**: if a robot has no conflict-free plan within the window, it is promoted to the front of the order and everyone replans. In a one-cell aisle this makes the opposing robot back out or step aside instead of the two meeting head-on. Replanning happens every tick, so waits are temporary. Because the order is stable (high priority first, then oldest), a high-priority job cannot starve, and aging stops low-priority starvation in the queue.
- **Execution guard**: before moving, the backend checks every move again. It rejects moves into obstacles, vertex conflicts and swaps, and any rejected move becomes a logged "Safety stop" (0 in all tests).
- **Wait reasons**: every robot that isn't progressing gets a human-readable `waitReason`, such as "Yielding to R3 (High priority) reserved at (11,9)", "Stepping aside / detouring around R5", "Destination unreachable: every route is blocked", or "Safety stop: …".
- **Dynamic obstacles**: `POST /api/cells` toggles a traversable cell. You cannot block a cell a robot currently stands on. All robots replan in the same request, so no robot enters the new obstacle on the next tick, and the event log records which robots replanned and how many steps ahead the obstacle was.
- **Determinism**: robot placement comes from the seed (mulberry32), and random jobs use the same seeded RNG stored in the state. Planning has deterministic tie-breaking. The same seed plus the same commands at the same ticks give an identical run (covered by a test).

## Real-time consistency

- The backend advances the simulation on a fixed-step clock (`tickMs`). The frontend never moves robots itself.
- `GET /api/stream` (SSE) first sends a full `snapshot` event (with `seq`) and then `update` events with `seq = previous + 1`. Snapshot and subscription happen in the same synchronous turn, so there is no gap.
- The client ignores any event whose `seq` ≤ its current seq (stale/duplicate). If it detects a gap, it resyncs from `GET /api/state`. Reset keeps seq monotonic.
- Reconnecting (automatic, or with the **Disconnect/Reconnect** button) gives a fresh snapshot and then newer events. The header shows `seq`, `tick` and a stale-drop counter.

## Persistence

The whole simulation state (jobs, blocked cells, robots, tick, seq, RNG, log) is written atomically to `data/state.json` after every change and on shutdown. Reloading the page or restarting the server continues the same run.

## API

| Method | Path | Body |
|---|---|---|
| GET | `/api/state` | full snapshot |
| GET | `/api/stream` | SSE: `snapshot` then `update` events |
| POST | `/api/jobs` | `{shelfId, stationId, priority: 1\|2\|3}` |
| POST | `/api/jobs/demo` | 4 jobs crossing the bottlenecks in opposite directions |
| POST | `/api/jobs/random` | `{count}` |
| POST | `/api/cells` | `{x, y, blocked?}` (omit `blocked` to toggle) |
| POST | `/api/control` | `{action: pause\|resume\|step\|reset\|speed, seed?, tickMs?}` |

## Acceptance walkthrough

1. Run `npm start`, open http://localhost:8787, click **Demo: 4 crossing jobs** (or create ≥3 jobs in the form), then click **Resume**.
2. Watch the robots move through the yellow one-cell corridors. Dashed lines show each planned path, ⏸/↯ badges mark waiting or detouring robots, and the Robots panel explains why.
3. Click an empty cell on a moving robot's dashed path. It turns red, the robot's route is redrawn around it immediately, and the log shows "R? replanned immediately…".
4. Click **Disconnect**, wait, then click **Reconnect** (or reload the page). The header `seq` jumps to the current value from the snapshot and keeps increasing by 1.
