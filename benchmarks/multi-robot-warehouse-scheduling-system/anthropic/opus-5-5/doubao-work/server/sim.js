// Authoritative multi-robot warehouse simulation.
// Windowed Hierarchical Cooperative A* (space-time A*) with a reservation table,
// stable priority ordering, and an execution-level collision guard.

export const WINDOW = 20; // planning horizon in time steps
export const WORK_TICKS = 2; // ticks spent loading / unloading
const PRIORITY_NAME = { 3: 'High', 2: 'Normal', 1: 'Low' };
const COLORS = ['#e6194b', '#3cb44b', '#4363d8', '#f58231', '#911eb4', '#42d4f4', '#f032e6', '#9a6324', '#469990', '#808000'];

// ---------------------------------------------------------------- map
export function createMap() {
  const w = 30, h = 18;
  const types = new Array(w * h).fill('floor');
  const set = (x, y, t) => { types[y * w + x] = t; };
  for (let x = 0; x < w; x++) { set(x, 0, 'wall'); set(x, h - 1, 'wall'); }
  for (let y = 0; y < h; y++) { set(0, y, 'wall'); set(w - 1, y, 'wall'); }
  // Wall band (rows 8-10) with four one-cell-wide bottleneck corridors.
  const corridors = [3, 11, 19, 26];
  for (let y = 8; y <= 10; y++) for (let x = 1; x < w - 1; x++) if (!corridors.includes(x)) set(x, y, 'wall');
  const shelves = [];
  const pairs = [4, 7, 10, 13, 16, 19, 22];
  const addBlock = (rows, cols) => {
    for (const y of rows) for (const px of cols) for (const x of [px, px + 1]) {
      set(x, y, 'shelf');
      const top = y === rows[0];
      shelves.push({ id: `S${String(shelves.length + 1).padStart(2, '0')}`, x, y, access: { x, y: top ? y - 1 : y + 1 } });
    }
  };
  addBlock([2, 3], pairs);
  addBlock([5, 6], pairs);
  addBlock([12, 13], pairs.slice(0, 6));
  const stations = [4, 7, 11, 14].map((y, i) => { set(1, y, 'station'); return { id: `W${i + 1}`, x: 1, y }; });
  const parks = [];
  for (let x = 3; x <= 12; x++) { set(x, 16, 'park'); parks.push({ x, y: 16 }); }
  return { w, h, types, shelves, stations, parks, corridors };
}

// ---------------------------------------------------------------- rng
export function rngNext(s) {
  const t = (s + 0x6d2b79f5) >>> 0;
  let r = Math.imul(t ^ (t >>> 15), 1 | t);
  r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
  return [((r ^ (r >>> 14)) >>> 0) / 4294967296, t];
}

// ---------------------------------------------------------------- heap
class Heap {
  constructor(less) { this.a = []; this.less = less; }
  get size() { return this.a.length; }
  push(v) { const a = this.a; a.push(v); let i = a.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (!this.less(a[i], a[p])) break; [a[i], a[p]] = [a[p], a[i]]; i = p; } }
  pop() {
    const a = this.a; const top = a[0]; const last = a.pop();
    if (a.length) { a[0] = last; let i = 0; for (;;) { const l = 2 * i + 1, r = l + 1; let m = i; if (l < a.length && this.less(a[l], a[m])) m = l; if (r < a.length && this.less(a[r], a[m])) m = r; if (m === i) break; [a[i], a[m]] = [a[m], a[i]]; i = m; } }
    return top;
  }
}

// ---------------------------------------------------------------- sim
export function initialState(map, seed) {
  seed = (Number(seed) >>> 0) || 1;
  let rng = seed;
  const order = map.parks.map((_, i) => i);
  for (let i = order.length - 1; i > 0; i--) { let v; [v, rng] = rngNext(rng); const j = Math.floor(v * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
  const robots = order.map((pi, i) => {
    const p = map.parks[pi];
    return { id: `R${i + 1}`, color: COLORS[i % COLORS.length], x: p.x, y: p.y, home: { ...p }, state: 'idle', jobId: null, path: [[p.x, p.y]], timer: 0, status: 'idle', waitReason: null, waitTicks: 0, totalWait: 0, moves: 0 };
  });
  return {
    version: 1, seed, rng, tick: 0, seq: 0, running: false, tickMs: 500,
    robots, jobs: [], blocked: [], log: [], nextJobId: 1,
    stats: { completed: 0, guardStops: 0, replans: 0, waits: 0 },
  };
}

export class Sim {
  constructor(map, state) {
    this.map = map;
    this.N = map.w * map.h;
    this.state = state;
    this.listeners = new Set();
    this.pendingLogs = [];
    this.changedJobs = new Set();
    this.distCache = new Map();
    this.mapVersion = 0;
    this.blockedSet = new Set(state.blocked);
    this.shelfById = new Map(map.shelves.map((s) => [s.id, s]));
    this.stationById = new Map(map.stations.map((s) => [s.id, s]));
  }

  // ---------- helpers
  idx(x, y) { return y * this.map.w + x; }
  xy(i) { return [i % this.map.w, Math.floor(i / this.map.w)]; }
  traversableType(i) { const t = this.map.types[i]; return t !== 'wall' && t !== 'shelf'; }
  passable(i) { return this.traversableType(i) && !this.blockedSet.has(i); }
  neighbors(i) {
    const [x, y] = this.xy(i); const out = [];
    if (x > 0) out.push(i - 1); if (x < this.map.w - 1) out.push(i + 1);
    if (y > 0) out.push(i - this.map.w); if (y < this.map.h - 1) out.push(i + this.map.w);
    return out;
  }
  distMap(goal) {
    const key = `${goal}|${this.mapVersion}`;
    let d = this.distCache.get(key);
    if (d) return d;
    d = new Float64Array(this.N).fill(Infinity);
    if (this.passable(goal)) {
      d[goal] = 0; const q = [goal];
      for (let h = 0; h < q.length; h++) { const c = q[h]; for (const n of this.neighbors(c)) if (d[n] === Infinity && this.passable(n)) { d[n] = d[c] + 1; q.push(n); } }
    }
    if (this.distCache.size > 400) this.distCache.clear();
    this.distCache.set(key, d);
    return d;
  }
  robot(id) { return this.state.robots.find((r) => r.id === id); }
  job(id) { return this.state.jobs.find((j) => j.id === id); }
  log(msg, level = 'info', robotId = null) {
    const e = { tick: this.state.tick, level, msg, robotId };
    this.state.log.push(e);
    if (this.state.log.length > 400) this.state.log.splice(0, this.state.log.length - 400);
    this.pendingLogs.push(e);
  }
  touchJob(j) { this.changedJobs.add(j.id); }
  goalOf(r) {
    if (r.state === 'to_pickup' || r.state === 'loading') { const j = this.job(r.jobId); const s = this.shelfById.get(j.shelfId); return this.idx(s.access.x, s.access.y); }
    if (r.state === 'to_station' || r.state === 'unloading') { const j = this.job(r.jobId); const s = this.stationById.get(j.stationId); return this.idx(s.x, s.y); }
    return this.idx(r.home.x, r.home.y);
  }
  robotRank(r) {
    // Stable ordering (no oscillation): job priority first, then FIFO by assignment tick.
    if (!r.jobId) return [0, 0];
    const j = this.job(r.jobId);
    return [j.priority, -(j.assignedTick ?? 0)];
  }
  sortedForPlanning() {
    return [...this.state.robots].sort((a, b) => {
      const ra = this.robotRank(a), rb = this.robotRank(b);
      if (ra[0] !== rb[0]) return rb[0] - ra[0];
      if (ra[1] !== rb[1]) return rb[1] - ra[1];
      return Number(a.id.slice(1)) - Number(b.id.slice(1));
    });
  }

  // ---------- events
  subscribe(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); }
  emit(kind, opts = {}) {
    const s = this.state;
    s.seq += 1;
    const ev = {
      seq: s.seq, kind, tick: s.tick, running: s.running, tickMs: s.tickMs, seed: s.seed,
      robots: s.robots,
      jobs: [...this.changedJobs].map((id) => this.job(id)).filter(Boolean),
      blocked: opts.mapChanged ? s.blocked : undefined,
      logs: this.pendingLogs, stats: s.stats,
    };
    if (kind === 'reset') ev.snapshot = this.snapshot();
    this.pendingLogs = []; this.changedJobs = new Set();
    for (const fn of this.listeners) fn(ev);
    return ev;
  }
  snapshot() {
    const s = this.state;
    return {
      seq: s.seq, tick: s.tick, running: s.running, tickMs: s.tickMs, seed: s.seed,
      map: { w: this.map.w, h: this.map.h, types: this.map.types, shelves: this.map.shelves, stations: this.map.stations, parks: this.map.parks },
      robots: s.robots, jobs: s.jobs, blocked: s.blocked, log: s.log.slice(-200), stats: s.stats,
    };
  }

  // ---------- commands
  createJob({ shelfId, stationId, priority }) {
    const shelf = this.shelfById.get(shelfId); const st = this.stationById.get(stationId);
    priority = Number(priority);
    if (!shelf) throw new Error(`Unknown shelf ${shelfId}`);
    if (!st) throw new Error(`Unknown workstation ${stationId}`);
    if (![1, 2, 3].includes(priority)) throw new Error('Priority must be 1 (Low), 2 (Normal) or 3 (High)');
    const s = this.state;
    const job = { id: `J${s.nextJobId++}`, shelfId, stationId, priority, status: 'queued', createdTick: s.tick, assignedTick: null, doneTick: null, robotId: null, note: 'Waiting for assignment' };
    s.jobs.push(job); this.touchJob(job);
    this.log(`${job.id} created: ${shelfId} → ${stationId} (${PRIORITY_NAME[priority]})`);
    this.assignJobs();
    this.planAll();
    this.emit('job');
    return job;
  }
  demoJobs() {
    // Deterministic scenario that forces traffic through the narrow corridors in opposite directions.
    const specs = [
      { shelfId: 'S03', stationId: 'W4', priority: 3 },
      { shelfId: 'S63', stationId: 'W1', priority: 2 },
      { shelfId: 'S40', stationId: 'W3', priority: 2 },
      { shelfId: 'S70', stationId: 'W2', priority: 1 },
    ];
    return specs.map((sp) => this.createJob(sp));
  }
  randomJobs(n = 5) {
    const out = [];
    for (let i = 0; i < n; i++) {
      let v; [v, this.state.rng] = rngNext(this.state.rng); const shelf = this.map.shelves[Math.floor(v * this.map.shelves.length)];
      [v, this.state.rng] = rngNext(this.state.rng); const st = this.map.stations[Math.floor(v * this.map.stations.length)];
      [v, this.state.rng] = rngNext(this.state.rng); const pr = v < 0.25 ? 3 : v < 0.75 ? 2 : 1;
      out.push(this.createJob({ shelfId: shelf.id, stationId: st.id, priority: pr }));
    }
    return out;
  }
  setBlocked(x, y, blocked) {
    x = Number(x); y = Number(y);
    if (!Number.isInteger(x) || !Number.isInteger(y) || x < 0 || y < 0 || x >= this.map.w || y >= this.map.h) throw new Error('Cell out of bounds');
    const i = this.idx(x, y);
    if (!this.traversableType(i)) throw new Error(`Cell (${x},${y}) is a ${this.map.types[i]} and cannot be toggled`);
    const isBlocked = this.blockedSet.has(i);
    if (blocked === undefined) blocked = !isBlocked;
    if (blocked === isBlocked) return { changed: false };
    if (blocked) {
      const occ = this.state.robots.find((r) => r.x === x && r.y === y);
      if (occ) throw new Error(`Cell (${x},${y}) is occupied by ${occ.id}; block a free cell`);
      this.blockedSet.add(i);
    } else this.blockedSet.delete(i);
    this.state.blocked = [...this.blockedSet].sort((a, b) => a - b);
    this.mapVersion++; this.distCache.clear();
    this.log(`Cell (${x},${y}) ${blocked ? 'BLOCKED' : 'unblocked'}`, blocked ? 'warn' : 'info');
    const before = new Map(this.state.robots.map((r) => [r.id, r.path.map(([px, py]) => this.idx(px, py))]));
    this.assignJobs();
    this.planAll();
    for (const r of this.state.robots) {
      const old = before.get(r.id);
      if (blocked && old.includes(i)) {
        this.state.stats.replans++;
        const ahead = old.indexOf(i);
        this.log(`${r.id} replanned immediately: its route entered (${x},${y}) in ${ahead} step(s)`, 'warn', r.id);
      } else if (!blocked && r.path.length && JSON.stringify(old) !== JSON.stringify(r.path.map(([px, py]) => this.idx(px, py)))) {
        this.state.stats.replans++;
        this.log(`${r.id} replanned: shorter route available after unblock`, 'info', r.id);
      }
    }
    this.emit('map', { mapChanged: true });
    return { changed: true };
  }
  setRunning(running) { this.state.running = running; this.log(running ? 'Simulation resumed' : 'Simulation paused'); this.emit('control'); }
  setSpeed(ms) { ms = Math.max(100, Math.min(3000, Number(ms) || 500)); this.state.tickMs = ms; this.emit('control'); }
  reset(seed) {
    const keepSeq = this.state.seq;
    const st = initialState(this.map, seed ?? this.state.seed);
    st.seq = keepSeq; // sequence numbers stay monotonic across resets
    this.state = st; this.blockedSet = new Set(); this.mapVersion++; this.distCache.clear();
    this.changedJobs = new Set(); this.pendingLogs = [];
    this.log(`Simulation reset with seed ${st.seed}`);
    this.planAll();
    this.emit('reset', { mapChanged: true });
  }

  // ---------- scheduling
  assignJobs() {
    const s = this.state;
    const queued = s.jobs.filter((j) => j.status === 'queued');
    // Priority with aging so low priority jobs cannot starve either.
    queued.sort((a, b) => (b.priority * 100 + (s.tick - b.createdTick) / 2) - (a.priority * 100 + (s.tick - a.createdTick) / 2) || a.createdTick - b.createdTick || Number(a.id.slice(1)) - Number(b.id.slice(1)));
    for (const job of queued) {
      const shelf = this.shelfById.get(job.shelfId);
      const goal = this.idx(shelf.access.x, shelf.access.y);
      const d = this.distMap(goal);
      let best = null;
      let anyIdle = false;
      for (const r of s.robots) {
        if (r.state !== 'idle') continue;
        anyIdle = true;
        const dist = d[this.idx(r.x, r.y)];
        if (dist === Infinity) continue;
        if (!best || dist < best.dist) best = { r, dist };
      }
      if (!best) {
        const note = anyIdle ? `Shelf ${job.shelfId} pickup cell unreachable (blocked)` : 'Waiting for a free robot';
        if (job.note !== note) { job.note = note; this.touchJob(job); }
        continue;
      }
      const r = best.r;
      job.status = 'assigned'; job.robotId = r.id; job.assignedTick = s.tick; job.note = `Robot ${r.id} heading to ${job.shelfId}`;
      r.state = 'to_pickup'; r.jobId = job.id; r.waitTicks = 0;
      this.touchJob(job);
      this.log(`${job.id} assigned to ${r.id} (distance ${best.dist})`, 'info', r.id);
    }
  }

  spaceTimeAStar(r, goal, resV, resE) {
    const N = this.N, W = WINDOW;
    const dist = this.distMap(goal);
    const start = this.idx(r.x, r.y);
    if (dist[start] === Infinity) return null;
    const closed = new Uint8Array((W + 1) * N);
    const heap = new Heap((a, b) => a.f < b.f || (a.f === b.f && (a.g > b.g || (a.g === b.g && a.order < b.order))));
    let order = 0;
    heap.push({ cell: start, t: 0, g: 0, f: dist[start], parent: null, order: order++ });
    while (heap.size) {
      const n = heap.pop();
      const key = n.t * N + n.cell;
      if (closed[key]) continue;
      closed[key] = 1;
      if (n.t === W) {
        const path = []; for (let c = n; c; c = c.parent) path.push(c.cell);
        return path.reverse();
      }
      const nt = n.t + 1;
      const cands = [n.cell, ...this.neighbors(n.cell)];
      for (const nb of cands) {
        if (nb !== n.cell && !this.passable(nb)) continue;
        if (dist[nb] === Infinity) continue;
        if (closed[nt * N + nb]) continue;
        const holder = resV.get(nt * N + nb);
        if (holder !== undefined && holder !== r.id) continue;
        if (nb !== n.cell && resE.has(`${n.t}:${nb}:${n.cell}`)) continue; // swap conflict
        const cost = nb === n.cell && n.cell === goal ? 0 : 1;
        const g = n.g + cost;
        heap.push({ cell: nb, t: nt, g, f: g + dist[nb], parent: n, order: order++ });
      }
    }
    return null;
  }

  planAll() {
    const N = this.N, W = WINDOW;
    const resV = new Map(); const resE = new Set(); const edgeOwner = new Map();
    const reserve = (r, cells) => {
      for (let t = 1; t <= W; t++) { const c = cells[Math.min(t, cells.length - 1)]; if (!resV.has(t * N + c)) resV.set(t * N + c, r.id); }
      for (let t = 0; t < W; t++) { const a = cells[Math.min(t, cells.length - 1)], b = cells[Math.min(t + 1, cells.length - 1)]; if (a !== b) { resE.add(`${t}:${a}:${b}`); edgeOwner.set(`${t}:${a}:${b}`, r.id); } }
    };
    const robots = this.state.robots;
    const working = (r) => r.state === 'loading' || r.state === 'unloading';
    let order = this.sortedForPlanning().filter((r) => !working(r));
    // Prioritized planning with restart: if a robot is boxed in by higher-ranked
    // reservations it is promoted to the front and everyone replans. This breaks
    // head-on situations in one-cell aisles instead of letting them deadlock.
    for (let attempt = 0; attempt <= robots.length; attempt++) {
      resV.clear(); resE.clear(); edgeOwner.clear();
      for (const r of robots) if (working(r)) {
        const c = this.idx(r.x, r.y); reserve(r, [c]); r.path = [[r.x, r.y]]; r.plannedGoal = c;
      }
      let failed = null;
      for (const r of order) {
        const goal = this.goalOf(r);
        r.plannedGoal = goal;
        const reachable = this.distMap(goal)[this.idx(r.x, r.y)] !== Infinity;
        const cells = reachable ? this.spaceTimeAStar(r, goal, resV, resE) : null;
        if (!cells) {
          reserve(r, [this.idx(r.x, r.y)]); r.path = [[r.x, r.y]]; r.planFailed = reachable;
          if (reachable && failed === null && order[0] !== r) failed = r;
          continue;
        }
        r.planFailed = false;
        let end = cells.length;
        while (end > 1 && cells[end - 1] === goal && cells[end - 2] === goal) end--;
        reserve(r, cells);
        r.path = cells.slice(0, end).map((c) => this.xy(c));
      }
      if (!failed) break;
      order = [failed, ...order.filter((r) => r !== failed)];
      if (!this._promoLogged || this._promoLogged !== `${this.state.tick}:${failed.id}`) {
        this._promoLogged = `${this.state.tick}:${failed.id}`;
      }
    }
    // 3) Explain every robot that is not progressing.
    for (const r of robots) this.explain(r, resV, resE, edgeOwner);
  }

  explain(r, resV, resE, edgeOwner) {
    const N = this.N;
    if (r.state === 'loading') { r.status = 'working'; r.waitReason = null; r.note = `Loading at shelf (${WORK_TICKS - r.timer + 1}/${WORK_TICKS})`; return; }
    if (r.state === 'unloading') { r.status = 'working'; r.waitReason = null; r.note = `Unloading at workstation`; return; }
    const here = this.idx(r.x, r.y); const goal = r.plannedGoal;
    const next = r.path.length > 1 ? this.idx(r.path[1][0], r.path[1][1]) : here;
    if (here === goal) { r.status = 'idle'; r.waitReason = null; r.note = r.state === 'idle' ? 'Parked at home' : 'At destination'; return; }
    const d = this.distMap(goal);
    if (d[here] === Infinity) {
      r.status = 'waiting';
      r.waitReason = r.state === 'idle' ? 'Home unreachable: route blocked by obstacles' : 'Destination unreachable: every route is blocked';
      return;
    }
    // greedy ideal next step
    let ideal = null;
    for (const n of this.neighbors(here)) if (this.passable(n) && (ideal === null || d[n] < d[ideal])) ideal = n;
    const [ix, iy] = this.xy(ideal);
    const holder = resV.get(1 * N + ideal);
    const swapper = edgeOwner.get(`0:${ideal}:${here}`);
    const blocker = holder && holder !== r.id ? holder : swapper;
    const who = blocker ? this.robot(blocker) : null;
    const whoDesc = who ? `${who.id}${who.jobId ? ` (${PRIORITY_NAME[this.job(who.jobId).priority]} priority${who.state === 'loading' || who.state === 'unloading' ? ', working' : ''})` : ' (idle)'}` : '';
    if (next === here) {
      r.status = 'waiting';
      if (r.planFailed) r.waitReason = `Boxed in: no conflict-free move in the next ${WINDOW} steps`;
      else if (who) r.waitReason = `Yielding to ${whoDesc} reserved at (${ix},${iy})`;
      else r.waitReason = `Waiting for reserved cells ahead to clear`;
    } else if (d[next] >= d[here]) {
      r.status = 'detour';
      r.waitReason = who ? `Stepping aside / detouring around ${whoDesc}` : 'Detouring around reserved cells';
    } else { r.status = 'moving'; r.waitReason = null; }
    r.note = r.state === 'to_pickup' ? `To pickup of ${this.job(r.jobId).shelfId}` : r.state === 'to_station' ? `Carrying to ${this.job(r.jobId).stationId}` : 'Returning home';
  }

  // ---------- time step
  step() {
    const s = this.state;
    s.tick += 1;
    // 1) progress work
    for (const r of s.robots) {
      if (r.state !== 'loading' && r.state !== 'unloading') continue;
      r.timer -= 1;
      if (r.timer > 0) continue;
      const job = this.job(r.jobId);
      if (r.state === 'loading') {
        r.state = 'to_station'; job.status = 'delivering'; job.note = `${r.id} carrying ${job.shelfId} to ${job.stationId}`; this.touchJob(job);
        this.log(`${r.id} picked up ${job.shelfId} for ${job.id}`, 'info', r.id);
      } else {
        r.state = 'idle'; r.jobId = null; job.status = 'done'; job.doneTick = s.tick; job.note = `Delivered in ${s.tick - job.createdTick} ticks`; this.touchJob(job);
        s.stats.completed++;
        this.log(`${r.id} delivered ${job.id} to ${job.stationId} (${s.tick - job.createdTick} ticks)`, 'success', r.id);
      }
    }
    // 2) assign and plan
    this.assignJobs();
    this.planAll();
    // 3) execute with collision guard (authoritative safety net)
    this.execute();
    // 4) arrivals
    for (const r of s.robots) {
      const here = this.idx(r.x, r.y);
      if (r.state === 'to_pickup' && here === this.goalOf(r)) {
        r.state = 'loading'; r.timer = WORK_TICKS; const j = this.job(r.jobId); j.status = 'picking'; j.note = `${r.id} loading ${j.shelfId}`; this.touchJob(j);
        r.path = [[r.x, r.y]]; r.status = 'working'; r.waitReason = null; r.note = 'Loading';
      } else if (r.state === 'to_station' && here === this.goalOf(r)) {
        r.state = 'unloading'; r.timer = WORK_TICKS; const j = this.job(r.jobId); j.note = `${r.id} unloading at ${j.stationId}`; this.touchJob(j);
        r.path = [[r.x, r.y]]; r.status = 'working'; r.waitReason = null; r.note = 'Unloading';
      }
    }
    this.emit('tick');
  }

  execute() {
    const s = this.state;
    const robots = s.robots;
    const cur = robots.map((r) => this.idx(r.x, r.y));
    const nxt = robots.map((r, i) => (r.path.length > 1 ? this.idx(r.path[1][0], r.path[1][1]) : cur[i]));
    const rank = new Map(this.sortedForPlanning().map((r, i) => [r.id, i]));
    const stopReason = new Array(robots.length).fill(null);
    const stop = (i, why) => { if (nxt[i] !== cur[i]) { nxt[i] = cur[i]; stopReason[i] = why; } };
    for (let i = 0; i < robots.length; i++) {
      if (nxt[i] !== cur[i] && (!this.passable(nxt[i]) || !this.neighbors(cur[i]).includes(nxt[i]))) stop(i, 'Next cell became an obstacle');
    }
    let changed = true;
    while (changed) {
      changed = false;
      for (let i = 0; i < robots.length; i++) {
        if (nxt[i] === cur[i]) continue;
        for (let j = 0; j < robots.length; j++) {
          if (i === j) continue;
          if (nxt[j] === nxt[i]) { // vertex conflict
            const loser = nxt[j] === cur[j] ? i : (rank.get(robots[i].id) > rank.get(robots[j].id) ? i : j);
            stop(loser, `Cell occupied by ${robots[loser === i ? j : i].id}`); changed = true; break;
          }
          if (nxt[i] === cur[j] && nxt[j] === cur[i]) { // swap conflict
            stop(i, `Head-on with ${robots[j].id}`); stop(j, `Head-on with ${robots[i].id}`); changed = true; break;
          }
        }
      }
    }
    for (let i = 0; i < robots.length; i++) {
      const r = robots[i];
      if (stopReason[i]) {
        s.stats.guardStops++;
        r.status = 'waiting'; r.waitReason = `Safety stop: ${stopReason[i]}`;
        this.log(`${r.id} safety stop: ${stopReason[i]}`, 'warn', r.id);
      }
      const moved = nxt[i] !== cur[i];
      const [nx, ny] = this.xy(nxt[i]);
      r.x = nx; r.y = ny;
      if (moved) { r.moves++; r.path = r.path.slice(1); if (!r.path.length) r.path = [[nx, ny]]; }
      const waiting = !moved && r.status === 'waiting';
      if (waiting) {
        if (r.waitTicks === 0) { s.stats.waits++; this.log(`${r.id} waiting: ${r.waitReason}`, 'wait', r.id); }
        r.waitTicks++; r.totalWait++;
        if (r.waitTicks % 25 === 0) this.log(`${r.id} has waited ${r.waitTicks} ticks: ${r.waitReason}`, 'warn', r.id);
      } else r.waitTicks = 0;
      if (moved && r.path.length > 1) { /* path already shifted */ }
    }
  }
}
