# AegisWMS — Multi-Robot Warehouse Scheduling System

A full-stack multi-robot warehouse scheduling and simulation system with deterministic map generation, Space-Time A* pathfinding, space-time conflict/deadlock avoidance, dynamic obstacle replanning, SQLite persistence, and real-time WebSocket streaming.

## Key Capabilities

- **Deterministic Warehouse Grid**: Generates a reproducible `24×15` warehouse (`warehouse-alpha-2026` default seed) featuring **10 autonomous robots** (`R-01`..`R-10`), **24 shelves** (`S-01`..`S-24`) with dedicated adjacent pickup pads, **6 workstations** (`WS-1`..`WS-6`), and multiple **1-cell-wide bottleneck aisles** (west/east divider tunnels, shelf picking aisles, and central cross-aisle).
- **Space-Time A* Pathfinding & Reservations**: Backend plans full space-time trajectories `(x, y, t)` with reverse-BFS obstacle-aware heuristics, vertex conflict prevention `(x, y, t)`, edge-swap conflict prevention `(u ↔ v, t → t+1)`, terminal resting holds, and Escape-Priority promotion to prevent permanent head-on deadlocks in narrow aisles.
- **Priority Scheduling & Anti-Starvation**: Transport jobs support `LOW`, `NORMAL`, `HIGH`, and `URGENT` priorities with automatic robot dispatch, wait-tick priority aging (`+2` score per queued tick), and priority preemption for delayed high-priority jobs.
- **Dynamic Obstacle Replanning**: Clicking any traversable cell toggles an obstacle immediately, halting affected robots before entry and computing detour paths (or exposing `BLOCKED` / `WAITING` status with explicit reasons).
- **Authoritative Fixed-Timestep Backend & SQLite Persistence**: All simulation ticks, job states, map obstacles, and event logs are committed atomically to SQLite (`data/warehouse.db` via Node's built-in `node:sqlite`) so page reloads and server restarts continue the same run seamlessly.
- **Monotonic WebSocket Streaming**: Streams `SNAPSHOT` and `STATE_UPDATE` messages with strictly monotonically increasing `seq` numbers, ignoring stale frames and recovering automatically with a full snapshot on reconnect.

## Prerequisites

- **Node.js `>= 22.13` / `24.x`** (uses built-in `node:sqlite`)
- **npm `>= 10`**

## Setup & Running

### 1. Install Dependencies

```bash
npm install
```

### 2. Development Mode (Backend + Vite HMR Frontend)

```bash
npm run dev
```

- Frontend UI: `http://localhost:5173` (proxies `/api` and `/ws` to backend on port `3001`)
- Backend API / WS: `http://localhost:3001`

### 3. Production Build & Start

```bash
npm run build
npm start
```

- Serves the compiled React frontend and backend HTTP/WebSocket API on `http://localhost:3001` (override port with `PORT=8080 npm start`).
- Persistence file defaults to `./data/warehouse.db` (override with `WAREHOUSE_DB_PATH=/path/to/warehouse.db`).

### 4. Tests & Typecheck

```bash
npm run typecheck
npm test
```

## API Overview

| Method & Endpoint | Purpose |
| --- | --- |
| `GET /api/state` | Fetch complete authoritative simulation snapshot |
| `POST /api/jobs` | Create job `{ shelfId, workstationId, priority }` |
| `POST /api/jobs/batch` | Dispatch multiple simultaneous jobs `{ jobs: [...] }` |
| `DELETE /api/jobs/:jobId` | Cancel a `QUEUED` job |
| `POST /api/grid/block` | Block/unblock cell `{ x, y, blocked? }` and replan immediately |
| `POST /api/sim/pause` | Pause fixed-timestep loop |
| `POST /api/sim/resume` | Resume fixed-timestep loop |
| `POST /api/sim/step` | Advance exactly 1 discrete time step |
| `POST /api/sim/speed` | Set tick interval `{ tickIntervalMs }` |
| `POST /api/sim/reset` | Reset simulation to tick 0 with deterministic `{ seed? }` |
| `WS /ws` | Streams `SNAPSHOT` on connect/resync and monotonic `STATE_UPDATE` frames |
