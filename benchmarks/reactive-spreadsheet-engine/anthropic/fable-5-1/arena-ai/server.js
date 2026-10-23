/* ============================================================
   Warehouse Fleet Control — authoritative simulation server
   Zero runtime dependencies. Node >= 16.
   ============================================================ */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 8080;
const DATA_DIR = path.join(__dirname, 'data');
const STATE_FILE = path.join(DATA_DIR, 'state.json');
const SAVE_VERSION = 3;

/* ---------------- deterministic map ---------------- */
const W = 28, H = 17, CELLS = W * H;
const FLOOR = 0, WALL = 1, SHELF = 2, STATION = 3;
const idx = (x, y) => y * W + x;
const inB = (x, y) => x >= 0 && y >= 0 && x < W && y < H;

const ROBOT_COLORS = ['#f5a524', '#2dd4bf', '#a3e635', '#f472b6', '#60a5fa', '#c084fc', '#fb7185', '#34d399'];
const HORIZON = 60;
const DWELL = 3;

function buildMap() {
  const cells = new Array(CELLS).fill(FLOOR);
  const shelves = [];           // {id, x, y}
  const shelfById = new Map();
  for (let x = 0; x < W; x++) { cells[idx(x, 0)] = WALL; cells[idx(x, H - 1)] = WALL; }
  for (let y = 0; y < H; y++) { cells[idx(0, y)] = WALL; cells[idx(W - 1, y)] = WALL; }

  // shelf columns (2 wide) with 1-cell aisles between them, two bands
  const cols = [[5, 6], [8, 9], [11, 12], [14, 15], [17, 18]];
  const bands = [[3, 5], [10, 12]];
  let sn = 0;
  for (const [y0, y1] of bands)
    for (const [cx0, cx1] of cols)
      for (let y = y0; y <= y1; y++)
        for (let x = cx0; x <= cx1; x++) {
          cells[idx(x, y)] = SHELF;
          const s = { id: 'S' + String(++sn).padStart(2, '0'), x, y };
          shelves.push(s); shelfById.set(s.id, s);
        }

  // bottleneck wall across the middle corridor: single-cell gaps at x=7 and x=16
  for (let x = 5; x <= 18; x++) if (x !== 7 && x !== 16) cells[idx(x, 8)] = WALL;
  // staging-area pillars
  cells[idx(22, 6)] = WALL; cells[idx(24, 10)] = WALL;

  // 4 workstations on the west wall, approach cell to the east
  const stations = [3, 6, 10, 13].map((y, i) => {
    cells[idx(1, y)] = STATION;
    return { id: i + 1, name: 'W' + (i + 1), x: 1, y, ax: 2, ay: y };
  });

  // 8 robot home docks in the staging area
  const docks = [[21, 3], [23, 3], [25, 3], [21, 7], [23, 7], [25, 7], [21, 12], [23, 12]]
    .map(([x, y], i) => ({ robot: i, x, y }));

  return { cells, shelves, shelfById, stations, docks };
}

/* narrow (1-wide corridor) segments — recomputed when blocks change */
function computeSegments(cells, blocked) {
  const open = (x, y) => inB(x, y) && cells[idx(x, y)] === FLOOR && !blocked.has(idx(x, y));
  const segOf = new Array(CELLS).fill(-1);
  const segments = [];
  const narrow = new Array(CELLS).fill(null);
  for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
    if (!open(x, y)) continue;
    const l = open(x - 1, y), r = open(x + 1, y), u = open(x, y - 1), d = open(x, y + 1);
    const n = (l ? 1 : 0) + (r ? 1 : 0) + (u ? 1 : 0) + (d ? 1 : 0);
    if (n === 2 && l && r) narrow[idx(x, y)] = 'h';
    else if (n === 2 && u && d) narrow[idx(x, y)] = 'v';
  }
  for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
    const i = idx(x, y);
    if (!narrow[i] || segOf[i] !== -1) continue;
    const axis = narrow[i]; const seg = { id: segments.length, axis, cells: [] };
    let cx = x, cy = y;
    while (inB(cx, cy) && narrow[idx(cx, cy)] === axis && segOf[idx(cx, cy)] === -1) {
      segOf[idx(cx, cy)] = seg.id; seg.cells.push(idx(cx, cy));
      if (axis === 'h') cx++; else cy++;
    }
    segments.push(seg);
  }
  return { segOf, segments };
}

/* ---------------- seeded RNG ---------------- */
function mulberry32(a) { return function () { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

/* ---------------- game state ---------------- */
let MAP = buildMap();
let G = null;
let SEG = null;
const clients = new Set();
let dirty = false;

function freshState(seed) {
  const rng = mulberry32(seed);
  const order = [...Array(8).keys()];
  for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
  const robots = order.map((dockIdx, i) => {
    const d = MAP.docks[dockIdx];
    return {
      id: i, name: 'R' + (i + 1), color: ROBOT_COLORS[i],
      x: d.x, y: d.y, px: d.x, py: d.y, home: { x: d.x, y: d.y },
      phase: 'idle', jobId: null, path: [{ x: d.x, y: d.y }], reason: 'Idle at dock',
      waitTicks: 0, dwell: 0, lastDir: 0, stuck: 0, jobsDone: 0
    };
  });
  return {
    seed, tick: 0, seq: 0, running: true, speedMs: 450,
    robots, jobs: [], nextJob: 1, blocked: new Set(), log: [],
    aisleLocks: {}, blockVersion: 0
  };
}

function log(kind, msg) {
  const entry = { tick: G.tick, kind, msg, t: Date.now() };
  G.log.push(entry); if (G.log.length > 250) G.log.shift();
  broadcast({ type: 'log', entry });
  dirty = true;
}

/* ---------------- pathfinding: space-time A* ---------------- */
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1], [0, 0]]; // last = wait

function makeReservations() {
  return { cell: new Map(), edge: new Set() };
}
function reservePath(res, path, rid) {
  for (let t = 0; t < path.length; t++) res.cell.set(t * CELLS + idx(path[t].x, path[t].y), rid);
  const g = path[path.length - 1];
  for (let t = path.length; t <= HORIZON; t++) res.cell.set(t * CELLS + idx(g.x, g.y), rid);
  for (let t = 1; t < path.length; t++)
    res.edge.add(t + ':' + idx(path[t - 1].x, path[t - 1].y) + ':' + idx(path[t].x, path[t].y));
}

function traversable(x, y) {
  return inB(x, y) && MAP.cells[idx(x, y)] === FLOOR && !G.blocked.has(idx(x, y));
}

function segEnterDir(seg, from, to) {
  return seg.axis === 'v' ? Math.sign(to.y - from.y) : Math.sign(to.x - from.x);
}

function planPath(robot, goal, res, locks) {
  const start = idx(robot.x, robot.y), goalI = idx(goal.x, goal.y);
  if (start === goalI) return { path: [{ x: robot.x, y: robot.y }] };
  const size = CELLS * (HORIZON + 1);
  const gScore = new Float64Array(size).fill(Infinity);
  const parent = new Int32Array(size).fill(-1);
  const closed = new Uint8Array(size);
  const h = (i) => Math.abs((i % W) - goal.x) + Math.abs(((i / W) | 0) - goal.y);
  // binary heap keyed by f
  const heap = [];
  const push = (f, s) => { heap.push([f, s]); let i = heap.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (heap[p][0] <= heap[i][0]) break; [heap[p], heap[i]] = [heap[i], heap[p]]; i = p; } };
  const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let i = 0; for (;;) { let l = 2 * i + 1, r = l + 1, m = i; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === i) break; [heap[m], heap[i]] = [heap[i], heap[m]]; i = m; } } return top; };

  gScore[start] = 0; push(h(start), start);
  let found = -1;
  while (heap.length) {
    const [, s] = pop();
    if (closed[s]) continue;
    closed[s] = 1;
    const t = (s / CELLS) | 0, ci = s % CELLS;
    if (ci === goalI) { found = s; break; }
    if (t >= HORIZON) continue;
    const cx = ci % W, cy = (ci / W) | 0;
    const mySeg = SEG.segOf[ci];
    for (const [dx, dy] of DIRS) {
      const nx = cx + dx, ny = cy + dy;
      if (!traversable(nx, ny)) continue;
      const ni = idx(nx, ny), nt = t + 1, ns = nt * CELLS + ni;
      if (closed[ns]) continue;
      if (res.cell.has(ns)) continue;                              // cell occupied at that time
      if (dx || dy) { if (res.edge.has(nt + ':' + ni + ':' + ci)) continue; } // no head-on swap
      // aisle direction lock (skip if robot is already inside this segment → may escape)
      const nSeg = SEG.segOf[ni];
      if (nSeg !== -1 && nSeg !== mySeg && (dx || dy)) {
        const lock = locks[nSeg];
        const dir = segEnterDir(SEG.segments[nSeg], { x: cx, y: cy }, { x: nx, y: ny });
        if (lock && lock.by !== robot.id && lock.dir !== dir) continue;
      }
      const wait = dx === 0 && dy === 0;
      const ng = gScore[s] + 1 + (wait ? 0.25 : 0);
      if (ng < gScore[ns]) { gScore[ns] = ng; parent[ns] = s; push(ng + h(ni), ns); }
    }
  }
  if (found === -1) return null;
  const path = [];
  for (let s = found; s !== -1; s = parent[s]) { const ci = s % CELLS; path.push({ x: ci % W, y: (ci / W) | 0 }); }
  path.reverse();
  // register tentative aisle locks for this planning round
  for (let k = 1; k < path.length; k++) {
    const a = idx(path[k - 1].x, path[k - 1].y), b = idx(path[k].x, path[k].y);
    const sb = SEG.segOf[b];
    if (sb !== -1 && SEG.segOf[a] !== sb && !locks[sb])
      locks[sb] = { dir: segEnterDir(SEG.segments[sb], path[k - 1], path[k]), by: robot.id };
  }
  return { path };
}

/* ---------------- goals & reasons ---------------- */
function pickupCellFor(job, robot) {
  const s = MAP.shelfById.get(job.shelf);
  const opts = [[1, 0], [-1, 0], [0, 1], [0, -1]]
    .map(([dx, dy]) => ({ x: s.x + dx, y: s.y + dy }))
    .filter(p => traversable(p.x, p.y));
  if (!opts.length) return null;
  opts.sort((a, b) => (Math.abs(a.x - robot.x) + Math.abs(a.y - robot.y)) - (Math.abs(b.x - robot.x) + Math.abs(b.y - robot.y)));
  return opts[0];
}
function goalFor(robot) {
  const job = robot.jobId != null ? G.jobs.find(j => j.id === robot.jobId) : null;
  if (robot.phase === 'toPickup' && job) return pickupCellFor(job, robot);
  if (robot.phase === 'toDropoff' && job) { const st = MAP.stations[job.station - 1]; return { x: st.ax, y: st.ay }; }
  if (robot.phase === 'returning') return robot.home;
  return null;
}
function explainWait(robot, goal, res, locks) {
  if (!goal) return 'Idle';
  const cx = robot.x, cy = robot.y;
  const cand = DIRS.slice(0, 4)
    .map(([dx, dy]) => ({ x: cx + dx, y: cy + dy }))
    .filter(p => inB(p.x, p.y))
    .sort((a, b) => (Math.abs(a.x - goal.x) + Math.abs(a.y - goal.y)) - (Math.abs(b.x - goal.x) + Math.abs(b.y - goal.y)));
  for (const p of cand) {
    const pi = idx(p.x, p.y);
    if (MAP.cells[pi] === SHELF || MAP.cells[pi] === WALL) continue;
    if (G.blocked.has(pi)) return 'Obstacle ahead — rerouting';
    const seg = SEG.segOf[pi];
    if (seg !== -1 && seg !== SEG.segOf[idx(cx, cy)]) {
      const lock = locks[seg];
      const dir = SEG.segments[seg].axis === 'v' ? Math.sign(p.y - cy) : Math.sign(p.x - cx);
      if (lock && lock.by !== robot.id && lock.dir !== dir) return `Aisle held by ${G.robots[lock.by].name} (one-way)`;
    }
    const owner = res.cell.get(1 * CELLS + pi);
    if (owner !== undefined && owner !== robot.id) return `Yielding to ${G.robots[owner].name}`;
  }
  return 'Waiting for traffic to clear';
}

/* ---------------- scheduler tick ---------------- */
const PRIO = { low: 1, normal: 2, high: 3, urgent: 4 };

function assignJobs() {
  const queued = G.jobs.filter(j => j.state === 'queued')
    .sort((a, b) => PRIO[b.priority] - PRIO[a.priority] || a.createdAt - b.createdAt);
  for (const job of queued) {
    const idle = G.robots.filter(r => r.phase === 'idle');
    if (!idle.length) break;
    const s = MAP.shelfById.get(job.shelf);
    idle.sort((a, b) => (Math.abs(a.x - s.x) + Math.abs(a.y - s.y)) - (Math.abs(b.x - s.x) + Math.abs(b.y - s.y)));
    const r = idle[0];
    r.jobId = job.id; r.phase = 'toPickup'; r.stuck = 0;
    job.state = 'assigned'; job.robotId = r.id;
    log('assign', `${r.name} assigned job ${jobLabel(job)} → ${MAP.stations[job.station - 1].name} [${job.priority}]`);
  }
}
const jobLabel = j => '#' + String(j.id).padStart(3, '0') + ' ' + j.shelf;

function effPriority(r) {
  const job = r.jobId != null ? G.jobs.find(j => j.id === r.jobId) : null;
  const p = job ? PRIO[job.priority] : 0;
  return p * 10000 + r.waitTicks * 25 + r.stuck * 40 - r.id; // aging prevents starvation
}

function planAll() {
  const res = makeReservations();
  const locks = { ...G.aisleLocks };
  // stationary robots reserve their cell for the whole horizon first
  for (const r of G.robots)
    if (['idle', 'picking', 'dropping'].includes(r.phase)) {
      reservePath(res, [{ x: r.x, y: r.y }], r.id);
      r.path = [{ x: r.x, y: r.y }];
    }
  const movers = G.robots.filter(r => ['toPickup', 'toDropoff', 'returning'].includes(r.phase))
    .sort((a, b) => effPriority(b) - effPriority(a));
  for (const r of movers) {
    const goal = goalFor(r);
    if (!goal) { r.path = [{ x: r.x, y: r.y }]; r.reason = 'No target — holding'; reservePath(res, r.path, r.id); continue; }
    const result = planPath(r, goal, res, locks);
    if (!result) {
      r.path = [{ x: r.x, y: r.y }];
      r.reason = explainWait(r, goal, res, locks);
      if (r.reason.startsWith('Yielding') || r.reason.startsWith('Waiting')) r.reason = 'No conflict-free route yet — holding';
      r.waitTicks++; r.stuck++;
    } else {
      r.path = result.path;
      if (result.path.length === 1) {
        if (idx(r.x, r.y) === idx(goal.x, goal.y)) r.reason = 'At target';
        else { r.reason = explainWait(r, goal, res, locks); r.waitTicks++; r.stuck++; }
      } else {
        const manh = Math.abs(goal.x - r.x) + Math.abs(goal.y - r.y);
        const steps = result.path.length - 1;
        r.reason = steps > manh + 2 ? 'Detour: avoiding traffic / obstacles' :
          (r.waitTicks > 0 ? 'Resuming after yield' : 'En route');
        r.waitTicks = 0; r.stuck = 0;
      }
    }
    reservePath(res, r.path, r.id);
  }
  G._locks = locks;
}

function updateAisleLocks() {
  const locks = {};
  for (const seg of SEG.segments) {
    for (const r of G.robots) {
      const si = SEG.segOf[idx(r.x, r.y)];
      if (si === seg.id) {
        const prev = G.aisleLocks[seg.id];
        // direction from the robot's ACTUAL last movement along this aisle's axis
        let dir = seg.axis === 'v' ? Math.sign(r.my || 0) : Math.sign(r.mx || 0);
        if (!dir && prev && prev.by === r.id) dir = prev.dir;   // dwelling inside: keep lock
        locks[seg.id] = { dir: dir || 1, by: r.id };
        break;
      }
    }
  }
  G.aisleLocks = locks;
}

function tick() {
  G.tick++;
  assignJobs();
  // dwell phases
  for (const r of G.robots) {
    if (r.phase === 'picking' || r.phase === 'dropping') {
      r.dwell--;
      r.reason = r.phase === 'picking' ? 'Picking at shelf…' : 'Unloading at workstation…';
      if (r.dwell <= 0) {
        const job = G.jobs.find(j => j.id === r.jobId);
        if (r.phase === 'picking') {
          r.phase = 'toDropoff'; if (job) job.state = 'delivering';
          log('pick', `${r.name} picked ${job ? job.shelf : ''} (job ${job ? '#' + job.id : ''})`);
        } else {
          if (job) { job.state = 'done'; job.doneAt = G.tick; }
          r.jobsDone++;
          log('done', `${r.name} completed ${job ? jobLabel(job) : 'job'} → ${job ? MAP.stations[job.station - 1].name : ''} ✔`);
          r.jobId = null; r.phase = 'returning';
        }
      }
    }
  }
  updateAisleLocks();
  planAll();
  // apply simultaneous moves (conflict-free by construction)
  for (const r of G.robots) {
    r.px = r.x; r.py = r.y; r.mx = 0; r.my = 0;
    if (['toPickup', 'toDropoff', 'returning'].includes(r.phase) && r.path.length > 1) {
      const n = r.path[1];
      if (traversable(n.x, n.y)) { r.mx = n.x - r.x; r.my = n.y - r.y; r.x = n.x; r.y = n.y; }
      else { r.reason = 'Stopped: cell blocked ahead'; r.waitTicks++; }
    }
  }
  updateAisleLocks();   // refresh locks from real movement for the next planning round
  // arrivals
  for (const r of G.robots) {
    const goal = goalFor(r);
    if (!goal || r.x !== goal.x || r.y !== goal.y) continue;
    if (r.phase === 'toPickup') { r.phase = 'picking'; r.dwell = DWELL; }
    else if (r.phase === 'toDropoff') { r.phase = 'dropping'; r.dwell = DWELL; }
    else if (r.phase === 'returning') { r.phase = 'idle'; r.reason = 'Idle at dock'; r.path = [{ x: r.x, y: r.y }]; }
  }
  dirty = true;
  broadcastState('tick');
}

/* ---------------- streaming ---------------- */
function dynamicPayload(type) {
  return {
    type, seq: ++G.seq, tick: G.tick, running: G.running, speedMs: G.speedMs, seed: G.seed,
    blockVersion: G.blockVersion,
    blocked: [...G.blocked],
    robots: G.robots.map(r => ({
      id: r.id, name: r.name, color: r.color, x: r.x, y: r.y, px: r.px, py: r.py,
      phase: r.phase, jobId: r.jobId, reason: r.reason, waitTicks: r.waitTicks, jobsDone: r.jobsDone,
      path: r.path
    })),
    jobs: G.jobs.slice(-80)
  };
}
function snapshot() {
  return {
    ...dynamicPayload('snapshot'),
    map: {
      w: W, h: H, cells: MAP.cells,
      shelves: MAP.shelves, stations: MAP.stations, docks: MAP.docks
    },
    log: G.log.slice(-120)
  };
}
function send(res, obj) { res.write(`data: ${JSON.stringify(obj)}\n\n`); }
function broadcast(obj) {
  obj.seq = ++G.seq;
  for (const c of clients) send(c, obj);
  dirty = true;
}
function broadcastState(type) {
  const p = dynamicPayload(type);
  for (const c of clients) send(c, p);
}

/* ---------------- persistence ---------------- */
function save() {
  if (!dirty) return;
  dirty = false;
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    const out = {
      v: SAVE_VERSION, seed: G.seed, tick: G.tick, seq: G.seq, running: G.running, speedMs: G.speedMs,
      nextJob: G.nextJob, blocked: [...G.blocked], blockVersion: G.blockVersion,
      aisleLocks: G.aisleLocks, jobs: G.jobs, log: G.log.slice(-200),
      robots: G.robots.map(r => ({ ...r }))
    };
    fs.writeFileSync(STATE_FILE, JSON.stringify(out));
  } catch (e) { console.error('save failed', e.message); }
}
function load() {
  try {
    const raw = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    if (raw.v !== SAVE_VERSION) return false;
    G = {
      seed: raw.seed, tick: raw.tick, seq: raw.seq, running: raw.running, speedMs: raw.speedMs,
      nextJob: raw.nextJob, blocked: new Set(raw.blocked), blockVersion: raw.blockVersion || 0,
      aisleLocks: raw.aisleLocks || {}, jobs: raw.jobs, log: raw.log || [], robots: raw.robots
    };
    return true;
  } catch { return false; }
}

/* ---------------- HTTP API + static ---------------- */
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.woff2': 'font/woff2' };
const DIST = path.join(__dirname, 'dist');
const ROOT = fs.existsSync(path.join(DIST, 'index.html')) ? DIST : __dirname;

function json(res, code, obj) { res.writeHead(code, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(obj)); }
function readBody(req) { return new Promise(r => { let b = ''; req.on('data', c => b += c); req.on('end', () => { try { r(JSON.parse(b || '{}')); } catch { r({}); } }); }); }

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  const p = url.pathname;

  if (p === '/api/state') return json(res, 200, snapshot());

  if (p === '/api/stream') {
    res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' });
    res.write('retry: 1500\n\n');
    clients.add(res);
    send(res, snapshot());                       // full snapshot on every (re)connect
    const hb = setInterval(() => res.write(': hb\n\n'), 15000);
    req.on('close', () => { clearInterval(hb); clients.delete(res); });
    return;
  }

  if (p === '/api/jobs' && req.method === 'POST') {
    const b = await readBody(req);
    const shelf = MAP.shelfById.get(b.shelf);
    const station = Number(b.station);
    const priority = ['low', 'normal', 'high', 'urgent'].includes(b.priority) ? b.priority : 'normal';
    if (!shelf) return json(res, 400, { error: 'Unknown shelf' });
    if (!(station >= 1 && station <= 4)) return json(res, 400, { error: 'Station must be 1–4' });
    const job = { id: G.nextJob++, shelf: b.shelf, station, priority, state: 'queued', robotId: null, createdAt: G.tick };
    G.jobs.push(job);
    log('job', `Job ${jobLabel(job)} → W${station} created [${priority}]`);
    broadcastState('state'); save();
    return json(res, 200, { ok: true, job });
  }

  if (p === '/api/block' && req.method === 'POST') {
    const b = await readBody(req);
    const x = Number(b.x), y = Number(b.y);
    if (!inB(x, y)) return json(res, 400, { error: 'Out of bounds' });
    const i = idx(x, y);
    if (MAP.cells[i] !== FLOOR) return json(res, 400, { error: 'Only open floor cells can be blocked' });
    const wantBlock = !!b.blocked;
    if (wantBlock && G.robots.some(r => r.x === x && r.y === y))
      return json(res, 409, { error: 'Cell occupied by a robot' });
    if (wantBlock) G.blocked.add(i); else G.blocked.delete(i);
    G.blockVersion++;
    SEG = computeSegments(MAP.cells, G.blocked);
    log('block', `Cell (${x},${y}) ${wantBlock ? 'BLOCKED — robots replanning' : 'reopened'}`);
    planAll();                                   // immediate replan even while paused
    broadcastState('state'); save();
    return json(res, 200, { ok: true });
  }

  if (p === '/api/control' && req.method === 'POST') {
    const b = await readBody(req);
    if (b.action === 'pause') { G.running = false; log('ctl', 'Simulation paused'); }
    else if (b.action === 'resume') { G.running = true; log('ctl', 'Simulation resumed'); }
    else if (b.action === 'step') { G.running = false; tick(); log('ctl', `Single step → tick ${G.tick}`); }
    else if (b.action === 'speed') { G.speedMs = Math.min(1200, Math.max(150, Number(b.ms) || 450)); log('ctl', `Tick interval ${G.speedMs} ms`); }
    else if (b.action === 'reset') {
      const seed = Number.isFinite(Number(b.seed)) ? Number(b.seed) : G.seed;
      G = freshState(seed); SEG = computeSegments(MAP.cells, G.blocked);
      log('ctl', `Reset — deterministic seed ${seed}`);
      try { fs.rmSync(STATE_FILE, { force: true }); } catch {}
      // seq restarts on reset → force every viewer to take a fresh snapshot
      for (const c of clients) { try { c.end(); } catch {} }
      clients.clear();
    }
    else return json(res, 400, { error: 'Unknown action' });
    broadcastState('state'); save();
    return json(res, 200, { ok: true });
  }

  // static files
  let fp = path.normalize(path.join(ROOT, p === '/' ? 'index.html' : p));
  if (!fp.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
  if (!fs.existsSync(fp) || fs.statSync(fp).isDirectory()) fp = path.join(ROOT, 'index.html');
  const ext = path.extname(fp);
  try {
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    fs.createReadStream(fp).pipe(res);
  } catch { res.writeHead(404); res.end('not found'); }
});

/* ---------------- boot ---------------- */
if (!load()) { G = freshState(1337); log('ctl', 'Fresh run — seed 1337'); }
else console.log(`Resumed persisted run: tick ${G.tick}, seq ${G.seq}`);
SEG = computeSegments(MAP.cells, G.blocked);
planAll();

let timer = null;
function loop() {
  clearTimeout(timer);
  timer = setTimeout(() => { if (G.running) tick(); loop(); }, G.speedMs);
}
loop();
setInterval(save, 1500);
process.on('SIGINT', () => { save(); process.exit(0); });
process.on('SIGTERM', () => { save(); process.exit(0); });

server.listen(PORT, () => {
  console.log(`\n  🏭 Warehouse Fleet Control`);
  console.log(`  → http://localhost:${PORT}   (serving ${ROOT === DIST ? 'production build /dist' : 'source (run "npm run build" for production)'})`);
  console.log(`  → SSE stream: /api/stream · state persisted to data/state.json\n`);
});