# Orbit — Multi-Robot Warehouse Scheduling

A complete dependency-free full-stack app. Node.js is the authoritative simulation server; the browser renders snapshots through Server-Sent Events. The deterministic warehouse has **8 robots, 24 shelves, 4 workstations and 4 one-cell-wide crossings**.

## Start

Requires **Node.js 20 or newer**. No package installation is necessary.

```sh
cd multi-robot-warehouse-scheduling-system/gpt/6-1-sol/codex
npm run build
npm start
```

Open **http://localhost:3000**. Alternatively run `node scripts/build.js` and `node server/index.js`. `npm run dev` starts the same server. Before a build, it serves `public/`; after a build it serves `dist/`. Rebuild after changing the client.

```sh
npm test                  # engine and HTTP/SSE integration tests
PORT=3001 npm start       # optional alternate port
```

On the challenge machine Node is bundled, rather than on the default shell PATH:

```sh
export PATH="/Users/bytedance/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH"
node scripts/build.js
node server/index.js
```

## Acceptance walkthrough

1. Click **Run demo** to create three simultaneous cross-warehouse jobs and resume. Or select a shelf, destination and Low/Normal/High priority, create three jobs, then click **Resume**.
2. Select a robot on the map or in the fleet. Its planned complete route, current job, position, remaining reserved steps and waiting reason appear below the map. Purple, mint and other route colors match individual robots.
3. Press **Pause**, select an active robot, then **Block next cell** (visible on larger desktop screens), or use **Edit obstacles** to click the cell ahead. The backend changes the map and replans atomically. Resume or single-step to verify that no robot enters the obstacle. Clicking the obstacle in edit mode reopens it. Walls and shelves cannot be blocked.
4. Click **Live** in the header to disconnect. The backend continues running, while the visible tick and sequence freeze. Click **Disconnected** to reconnect: the latest complete snapshot replaces the stale view, followed by strictly newer sequences. Reloading the page has the same snapshot-first behavior.
5. **Pause** + **Single step** advances exactly one fixed step. **Reset run** clears jobs and map edits using seed **7429**, while retaining monotonically increasing sequence numbers. Repeat the same job creation / obstacle / step sequence to reproduce the same scheduling decisions.

## Scheduling and safety

- Backend **space-time A\*** searches `(cell, relative time)` states using a reverse BFS distance heuristic. It includes explicit waits and rejects shelves, walls and blocked cells.
- Reservations cover **vertices**, **reverse edges** (preventing swaps), and **exclusive narrow corridors**. An exit has one additional clearance step. Opposite-direction robots cannot enter a crossing together.
- The scheduler commits a **complete itinerary**: pickup → one-step service → workstation → one-step delivery → private parking bay. Every route's final cell is reserved indefinitely within the planning horizon, including stationary robots. This avoids planning into a cell where a robot will stop and prevents narrow-aisle head-on deadlocks during normal operation.
- The rolling planning horizon is **320 steps**. Committed plans remain stable until a map edit; waiting plans retry after movements. On a map edit all active itineraries are discarded and rebuilt against current occupancy before the next tick. A robot on a newly blocked cell may exit; no robot may enter it.
- Robots can yield into a reserved roomy refuge to clear traffic. Waiting reasons distinguish disconnected geometry from conflicts. Arbitrary obstacles can disconnect the warehouse; those jobs remain waiting until connectivity is restored.
- Queued jobs use **priority plus one aging point per 24 simulation ticks**, then FIFO ties. The nearest idle robot is assigned deterministically. Existing finite reservations finish before waiting jobs acquire the space; high-priority jobs cannot be repeatedly passed over by newer lower-priority arrivals. Progress presumes a reachable route; disconnected jobs cannot physically complete.
- Before every simultaneous move, the engine checks unique destination cells, adjacency, obstacle entry and reverse-edge swaps. A failed check pauses the server with a visible safety event.

## State, streaming and persistence

Each mutation and tick increments a persisted sequence number. `GET /api/events` sends a complete `snapshot` SSE event immediately, even if `Last-Event-ID` is old, followed by complete newer snapshots. Full snapshots make gaps harmless. The client accepts only snapshots whose sequence is greater than its current sequence; an older HTTP response or SSE event cannot revert it. Initial SSE subscription and ongoing publication are serialized by Node's event loop.

`data/simulation.json` stores the map, blocked cells, jobs, robot positions and full reserved routes, tick, running flag, event log and sequence. Writes use a temporary file and atomic rename before publication. Reloads and server restarts continue the same run. An invalid state file causes a clear startup error instead of silently resetting. `DATA_DIR` can override the persistence directory. Only run one server against a given data directory.

## API

| Endpoint | Purpose |
|---|---|
| `GET /api/state` | Complete authoritative snapshot |
| `GET /api/events` | SSE stream; event `snapshot`, id = sequence |
| `GET /api/health` | Health, tick and sequence |
| `POST /api/jobs` | `{shelfId:"S01",stationId:"W3",priority:3}` |
| `POST /api/obstacles` | `{x:9,y:5,blocked:true}` |
| `POST /api/control` | `{action:"pause"|"resume"|"step"|"reset"}` |
| `POST /api/control` | `{action:"speed",speed:250|650|1200}` milliseconds per tick |

The client has no position simulation or animation that invents intermediate robot coordinates. All map positions come directly from the backend. The UI is responsive and stacks panels on small screens. Fonts use Google Fonts when available and system font fallbacks otherwise. The production client requires no CDN JavaScript or external runtime dependencies.
