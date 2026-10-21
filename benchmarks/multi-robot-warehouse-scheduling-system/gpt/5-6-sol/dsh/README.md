# ROUTE/OPS — Multi-Robot Warehouse Scheduling

A complete full-stack warehouse simulation with an authoritative fixed-step backend, deterministic map, real pathfinding, cooperative space-time reservations, dynamic obstacle replanning, persistent state, and a live operations console.

## Quick start

Requires Node.js 20 or newer.

```bash
npm install
npm run dev
```

Open **http://127.0.0.1:5173**. The backend runs on `127.0.0.1:3001` and Vite proxies `/api` while developing.

For a production build and single-process deployment:

```bash
npm run build
npm start
```

Open **http://127.0.0.1:3001**. Override the port with `PORT=8080 npm start`.

Useful checks:

```bash
npm test
npm run typecheck
npm run build
```

## Operating the simulation

1. Choose a source shelf, destination workstation, and priority (P1–P5), then select **Dispatch job**. The scheduler assigns the closest available robot with a valid route.
2. Select any robot on the map or in the fleet list to display its reserved path, current assignment, next cells, and explicit waiting reason.
3. Click any open floor or workstation cell to block it. Click a blocked cell to reopen it. An affected route is invalidated synchronously on the server and replanned before another movement step.
4. Use **Pause**, **Resume**, **Step +1**, and **Reset**. Reset uses the same seed (`73421`) and retains a monotonically increasing stream sequence.
5. Reloading the page resumes the persisted run. A new SSE connection always receives a complete snapshot before newer updates.

## Scheduling and safety model

The 26×18 deterministic warehouse contains 8 robots, 20 shelves, 4 workstations, two structural dividers, and six one-cell gates that force traffic through bottlenecks.

Each active route is planned server-side with cooperative space-time A* over `(x, y, time)`. The reservation table records:

- vertex reservations, preventing two robots from occupying the same cell at one time;
- directed edge reservations, rejecting the reverse edge in the same step and therefore preventing swaps;
- held destination cells, so another route cannot enter a stationary robot;
- wait actions, allowing a robot to yield before a bottleneck instead of entering a head-on deadlock.

Robots are planned in effective-priority order. Queue priority gains a large aging bonus every 12 ticks, so old low-priority jobs eventually outrank new high-priority jobs. A waiting robot also gets a short-term planning bonus. Every wait exposes a human-readable reason in robot state and in the route inspector.

The backend alone advances positions at fixed 650 ms steps. The browser only renders authoritative snapshots. Each mutation is atomically written to `data/state.json` (temporary file + rename) and published with an increasing sequence number. The client discards any envelope older than its current sequence. Runtime data is intentionally git-ignored.

## API overview

- `GET /api/state` — complete current state
- `GET /api/events` — SSE stream; every connection starts with a full `snapshot`
- `POST /api/jobs` — `{ shelfId, workstationId, priority }`
- `POST /api/control/pause|resume|step|reset`
- `POST /api/cells/:x/:y` — `{ blocked: boolean }`
- `GET /api/health`

Set `WAREHOUSE_STATE_PATH=/path/to/state.json` to place persistence elsewhere.

## Project layout

```text
src/shared/          Shared wire/state types
src/server/map.ts    Deterministic topology
src/server/pathfinding.ts  Static A* and route validation
src/server/engine.ts Scheduler, simulation, reservations, persistence
src/server/index.ts  REST/SSE server and production asset hosting
src/client/          React operations console
```
