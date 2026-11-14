'use strict';

/**
 * Multi-robot warehouse scheduling engine (authoritative simulation state).
 *
 * Planning model: prioritized cooperative A* over a time-expanded graph.
 * For every tick every robot plans its COMPLETE remaining route (pickup ->
 * workstation -> home). Higher effective-priority robots commit first and
 * own:
 *   - vertex reservations  (x,y,t)          -> no two robots share a cell
 *   - edge reservations    (u->v at t)      -> no head-on swaps
 *   - static reservations  (cell, from t)   -> parked robots are obstacles
 *   - aisle-segment locks  (segment, window) -> no two robots occupy the same
 *                                              one-cell-wide aisle at once,
 *                                              which prevents permanent
 *                                              head-on deadlocks in tunnels
 *
 * A robot that cannot obtain a conflict-free plan is promoted to a static
 * obstacle and ALL robots are replanned (bounded iterations). Anti-starvation
 * comes from priority aging plus an emergency boost after 45 idle ticks.
 */

const fs = require('fs');
const path = require('path');

const GRID_W = 35;
const GRID_H = 23;
const HORIZON = 200;
const MAX_EXPANSIONS = 30000;
const ESCAPE_HORIZON = 40;
const DEFAULT_SEED = 20261114;

const TUNNEL_ROWS = [5, 11, 17];
const DIVIDER_XS = [16, 17, 18];
const SHELF_XS_LEFT = [2, 6, 10, 13];
const SHELF_XS_RIGHT = [20, 24, 28, 31];
const SHELF_YS = [3, 9, 15];

const STATIONS = [
  { id: 'W1', x: 1, y: 1, label: 'Dock A (NW)' },
  { id: 'W2', x: 1, y: 21, label: 'Dock B (SW)' },
  { id: 'W3', x: 33, y: 1, label: 'Dock C (NE)' },
  { id: 'W4', x: 33, y: 21, label: 'Dock D (SE)' },
];

const HOMES = [
  { x: 4, y: 2 }, { x: 8, y: 2 }, { x: 12, y: 2 }, { x: 15, y: 2 },
  { x: 19, y: 2 }, { x: 23, y: 2 }, { x: 27, y: 2 }, { x: 31, y: 2 },
];

const ROBOT_COLORS = [
  '#dc2626', '#16a34a', '#2563eb', '#ea580c',
  '#7c3aed', '#0891b2', '#a16207', '#db2777',
];

const PRIORITY_LABELS = { 1: 'Low', 2: 'Normal', 3: 'Medium', 4: 'High', 5: 'Urgent' };
const idx = (x, y) => y * GRID_W + x;
const key = (x, y) => `${x},${y}`;
const manhattan = (ax, ay, bx, by) => Math.abs(ax - bx) + Math.abs(ay - by);

// ---------------------------------------------------------------------------
// Deterministic warehouse map
// ---------------------------------------------------------------------------

function buildMap() {
  const cells = new Uint8Array(GRID_W * GRID_H).fill(1); // 0 wall, 1 floor, 2 shelf, 3 station, 4 home
  const set = (x, y, v) => { cells[idx(x, y)] = v; };

  for (let x = 0; x < GRID_W; x++) { set(x, 0, 0); set(x, GRID_H - 1, 0); }
  for (let y = 0; y < GRID_H; y++) { set(0, y, 0); set(GRID_W - 1, y, 0); }

  // A three-column divider splits the warehouse into two halves. Only three
  // 1-cell-wide, 3-cell-long tunnels (rows 5, 11, 17) connect them.
  for (let y = 1; y < GRID_H - 1; y++) {
    for (const x of DIVIDER_XS) set(x, y, 0);
  }
  for (const y of TUNNEL_ROWS) {
    for (const x of DIVIDER_XS) set(x, y, 1);
  }

  const shelves = [];
  for (const xs of [SHELF_XS_LEFT, SHELF_XS_RIGHT]) {
    for (const oy of SHELF_YS) {
      for (const ox of xs) {
        for (let dy = 0; dy < 2; dy++) {
          for (let dx = 0; dx < 2; dx++) set(ox + dx, oy + dy, 2);
        }
        shelves.push({
          id: `S${String(shelves.length + 1).padStart(2, '0')}`,
          ox, oy,
          access: { x: ox - 1, y: oy }, // guaranteed traversable 1-wide aisle
          side: ox < 16 ? 'L' : 'R',
        });
      }
    }
  }

  for (const s of STATIONS) set(s.x, s.y, 3);
  for (const h of HOMES) set(h.x, h.y, 4);

  const staticPassable = (x, y) =>
    x >= 0 && y >= 0 && x < GRID_W && y < GRID_H &&
    cells[idx(x, y)] !== 0 && cells[idx(x, y)] !== 2;

  // Detect one-cell-wide aisles: cells with blocked neighbours on two opposite
  // sides and open neighbours on the other two. Group them into chains.
  const orient = new Int8Array(GRID_W * GRID_H); // 1 horizontal, 2 vertical
  for (let y = 1; y < GRID_H - 1; y++) {
    for (let x = 1; x < GRID_W - 1; x++) {
      if (!staticPassable(x, y)) continue;
      const l = staticPassable(x - 1, y), r = staticPassable(x + 1, y);
      const u = staticPassable(x, y - 1), d = staticPassable(x, y + 1);
      if (!u && !d && l && r) orient[idx(x, y)] = 1;
      else if (!l && !r && u && d) orient[idx(x, y)] = 2;
    }
  }

  const corridorId = new Int32Array(GRID_W * GRID_H).fill(-1);
  const segments = [];
  const seen = new Uint8Array(GRID_W * GRID_H);
  for (let y = 1; y < GRID_H - 1; y++) {
    for (let x = 1; x < GRID_W - 1; x++) {
      const o = orient[idx(x, y)];
      if (!o || seen[idx(x, y)]) continue;
      const dx = o === 1 ? 1 : 0;
      const dy = o === 2 ? 1 : 0;
      let sx = x, sy = y;
      while (sx - dx >= 0 && sy - dy >= 0 &&
             orient[idx(sx - dx, sy - dy)] === o && !seen[idx(sx - dx, sy - dy)]) {
        sx -= dx; sy -= dy;
      }
      const chain = [];
      let cx = sx, cy = sy;
      while (cx < GRID_W && cy < GRID_H && orient[idx(cx, cy)] === o) {
        chain.push({ x: cx, y: cy });
        seen[idx(cx, cy)] = 1;
        cx += dx; cy += dy;
      }
      if (chain.length >= 2) {
        const id = segments.length;
        segments.push({ id, cells: chain, orientation: o === 1 ? 'horizontal' : 'vertical' });
        for (const c of chain) corridorId[idx(c.x, c.y)] = id;
      }
    }
  }

  return {
    W: GRID_W, H: GRID_H,
    cells: Array.from(cells),
    shelves, stations: STATIONS, homes: HOMES,
    segments,
    corridorId,
  };
}

// ---------------------------------------------------------------------------
// Small binary heap
// ---------------------------------------------------------------------------

class MinHeap {
  constructor(cmp) { this.a = []; this.cmp = cmp; }
  get size() { return this.a.length; }
  push(v) {
    const a = this.a; a.push(v);
    let i = a.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (this.cmp(a[i], a[p]) >= 0) break;
      [a[i], a[p]] = [a[p], a[i]]; i = p;
    }
  }
  pop() {
    const a = this.a;
    if (!a.length) return undefined;
    const top = a[0], last = a.pop();
    if (a.length) {
      a[0] = last;
      let i = 0;
      for (;;) {
        const l = 2 * i + 1, r = l + 1;
        let m = i;
        if (l < a.length && this.cmp(a[l], a[m]) < 0) m = l;
        if (r < a.length && this.cmp(a[r], a[m]) < 0) m = r;
        if (m === i) break;
        [a[i], a[m]] = [a[m], a[i]]; i = m;
      }
    }
    return top;
  }
}

// ---------------------------------------------------------------------------
// Space-time reservation table
// ---------------------------------------------------------------------------

class Reservations {
  constructor(corridorId) {
    this.corridorId = corridorId;
    this.v = new Map();     // "x|y|t" -> owner
    this.e = new Map();     // "fx|fy>tx|ty@t" -> owner
    this.s = new Map();     // "x,y" -> [{owner, from}]
    this.locks = new Map(); // segmentId -> [{owner, from, to, provisional}]
  }

  vk(x, y, t) { return `${x}|${y}|${t}`; }
  ownerAt(x, y, t) { return this.v.get(this.vk(x, y, t)); }

  occupiedBy(x, y, t, self) {
    const v = this.v.get(this.vk(x, y, t));
    if (v !== undefined && v !== self) return v;
    const arr = this.s.get(key(x, y));
    if (arr) {
      for (const e of arr) if (e.owner !== self && e.from <= t) return e.owner;
    }
    return null;
  }

  swapOwner(fx, fy, tx, ty, t, self) {
    const o = this.e.get(`${tx}|${ty}>${fx}|${fy}@${t}`);
    return o !== undefined && o !== self ? o : null;
  }

  lockOwner(seg, t, self) {
    const arr = this.locks.get(seg);
    if (!arr) return null;
    for (const l of arr) {
      if (l.owner !== self && l.from <= t && t <= l.to) return l.owner;
    }
    return null;
  }

  addStatic(x, y, from, owner) {
    const k = key(x, y);
    if (!this.s.has(k)) this.s.set(k, []);
    this.s.get(k).push({ owner, from });
  }

  claim(seg, owner) {
    if (!this.locks.has(seg)) this.locks.set(seg, []);
    this.locks.get(seg).push({ owner, from: 0, to: HORIZON, provisional: true });
  }

  finalize(owner, path) {
    for (const [seg, arr] of this.locks) {
      const kept = arr.filter((l) => !(l.provisional && l.owner === owner));
      if (kept.length) this.locks.set(seg, kept);
      else this.locks.delete(seg);
    }
    const ranges = new Map();
    for (let t = 0; t < path.length; t++) {
      const seg = this.corridorId[idx(path[t].x, path[t].y)];
      if (seg >= 0) {
        const r = ranges.get(seg) || { min: t, max: t };
        r.min = Math.min(r.min, t); r.max = Math.max(r.max, t);
        ranges.set(seg, r);
      }
    }
    for (const [seg, r] of ranges) {
      if (!this.locks.has(seg)) this.locks.set(seg, []);
      this.locks.get(seg).push({
        owner, from: Math.max(0, r.min - 1), to: r.max + 1, provisional: false,
      });
    }
  }

  commit(path, owner, finalStatic) {
    for (let t = 0; t < path.length; t++) {
      this.v.set(this.vk(path[t].x, path[t].y, t), owner);
      if (t > 0) {
        const p = path[t - 1], q = path[t];
        this.e.set(`${p.x}|${p.y}>${q.x}|${q.y}@${t - 1}`, owner);
      }
    }
    const last = path[path.length - 1];
    if (finalStatic) {
      this.addStatic(last.x, last.y, path.length - 1, owner);
    } else {
      for (let t = path.length - 1; t <= HORIZON; t++) {
        this.v.set(this.vk(last.x, last.y, t), owner);
      }
    }
    this.finalize(owner, path);
  }
}

// ---------------------------------------------------------------------------
// Space-time A*
// ---------------------------------------------------------------------------

const MOVES = [[0, -1], [1, 0], [0, 1], [-1, 0]];

function advanceWi(x, y, wi, goals) {
  let w = wi;
  while (w < goals.length && goals[w].x === x && goals[w].y === y) w++;
  return w;
}

function heuristic(x, y, wi, goals) {
  let h = 0, cx = x, cy = y;
  for (let j = wi; j < goals.length; j++) {
    h += manhattan(cx, cy, goals[j].x, goals[j].y);
    cx = goals[j].x; cy = goals[j].y;
  }
  return h;
}

function stateKey(x, y, t, wi) { return `${x}|${y}|${t}|${wi}`; }

function reconstruct(node) {
  const rev = [];
  let cur = node;
  while (cur) { rev.push(cur); cur = cur.prev; }
  rev.reverse();
  const path = rev.map((n) => ({ x: n.x, y: n.y }));
  let waitReason = null;
  if (path.length > 1 && path[0].x === path[1].x && path[0].y === path[1].y) {
    waitReason = rev[1].reason || 'waiting for a conflict-free time slot';
  }
  return { path, waitReason, ok: true };
}

function planRobot(robot, goals, res, ctx) {
  const wi0 = advanceWi(robot.x, robot.y, 0, goals);
  if (wi0 >= goals.length) {
    return { path: [{ x: robot.x, y: robot.y }], waitReason: null, ok: true };
  }

  const h0 = heuristic(robot.x, robot.y, wi0, goals);
  const heap = new MinHeap((a, b) => a.f - b.f || a.h - b.h || a.order - b.order);
  heap.push({
    x: robot.x, y: robot.y, t: 0, wi: wi0,
    h: h0, f: h0, order: 0, prev: null, reason: null, wait: false,
  });
  const best = new Map([[stateKey(robot.x, robot.y, 0, wi0), 0]]);
  const visited = new Set();
  let order = 1;
  let expansions = 0;

  while (heap.size && expansions < MAX_EXPANSIONS) {
    const n = heap.pop();
    const nk = stateKey(n.x, n.y, n.t, n.wi);
    if (visited.has(nk)) continue;
    visited.add(nk);
    expansions++;

    if (n.wi >= goals.length) return reconstruct(n);
    if (n.t >= HORIZON) continue;

    const target = goals[n.wi];
    const actions = MOVES.map(([dx, dy]) => ({
      dx, dy, wait: false,
      d: manhattan(n.x + dx, n.y + dy, target.x, target.y),
    })).sort((a, b) => a.d - b.d || (a.dx + 2 * a.dy) - (b.dx + 2 * b.dy));
    actions.push({ dx: 0, dy: 0, wait: true, d: 999 });

    let firstRejected = null;
    for (const a of actions) {
      const nx = n.x + a.dx, ny = n.y + a.dy, nt = n.t + 1;
      let reason = null;

      if (!ctx.isPassable(nx, ny)) {
        reason = `cell (${nx},${ny}) is a wall, shelf or newly blocked cell`;
      } else if (a.wait && !ctx.isPassable(n.x, n.y)) {
        reason = 'standing on a newly blocked cell - must move out';
      } else {
        const occ = res.occupiedBy(nx, ny, nt, robot.id);
        if (occ) {
          const p = ctx.priorityOf(occ);
          reason = `${occ} (job P${p}) reserves cell (${nx},${ny}) at t+${nt}`;
        } else if (!a.wait) {
          const sw = res.swapOwner(n.x, n.y, nx, ny, n.t, robot.id);
          if (sw) reason = `head-on swap with ${sw} prevented by edge reservation`;
        }
        if (!reason && !a.wait) {
          const toSeg = ctx.map.corridorId[idx(nx, ny)];
          const fromSeg = ctx.map.corridorId[idx(n.x, n.y)];
          if (toSeg >= 0 && toSeg !== fromSeg) {
            const lo = res.lockOwner(toSeg, nt, robot.id);
            if (lo) reason = `aisle C${toSeg} is locked by ${lo} (head-on deadlock prevention)`;
          }
        }
      }

      if (reason) {
        if (!firstRejected) firstRejected = reason;
        continue;
      }

      const nwi = advanceWi(nx, ny, n.wi, goals);
      const h = heuristic(nx, ny, nwi, goals);
      const k = stateKey(nx, ny, nt, nwi);
      if (best.has(k) && best.get(k) <= nt) continue;
      best.set(k, nt);
      heap.push({
        x: nx, y: ny, t: nt, wi: nwi,
        h, f: nt + h, order: order++,
        prev: n,
        reason: a.wait ? (firstRejected || 'waiting for a conflict-free time slot') : null,
        wait: a.wait,
      });
    }
  }
  return null;
}

/** If no route to the goal exists, at least try to clear a narrow aisle. */
function findEscape(robot, res, ctx) {
  const startSeg = ctx.map.corridorId[idx(robot.x, robot.y)];
  const queue = [{ x: robot.x, y: robot.y, t: 0, prev: null }];
  const seen = new Set([`${robot.x}|${robot.y}|0`]);
  let head = 0;
  while (head < queue.length) {
    const n = queue[head++];
    if (n.t >= ESCAPE_HORIZON) continue;
    const outside = startSeg < 0 || ctx.map.corridorId[idx(n.x, n.y)] !== startSeg;
    if (n.t >= 1 && outside) {
      const rev = [];
      let c = n;
      while (c) { rev.push(c); c = c.prev; }
      rev.reverse();
      return { path: rev.map((z) => ({ x: z.x, y: z.y })), ok: true };
    }
    for (const [dx, dy] of [...MOVES, [0, 0]]) {
      const nx = n.x + dx, ny = n.y + dy, nt = n.t + 1;
      if (!ctx.isPassable(nx, ny)) continue;
      if (res.occupiedBy(nx, ny, nt, robot.id)) continue;
      if (dx || dy) {
        if (res.swapOwner(n.x, n.y, nx, ny, n.t, robot.id)) continue;
        const ts = ctx.map.corridorId[idx(nx, ny)];
        const fs = ctx.map.corridorId[idx(n.x, n.y)];
        if (ts >= 0 && ts !== fs && res.lockOwner(ts, nt, robot.id)) continue;
      }
      const k = `${nx}|${ny}|${nt}`;
      if (seen.has(k)) continue;
      seen.add(k);
      queue.push({ x: nx, y: ny, t: nt, prev: n });
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

class Engine {
  constructor(opts = {}) {
    this.map = buildMap();
    this.dataDir = opts.dataDir || null;
    this.seq = 0;
    this.plans = {};
    this.robots = [];
    this.speedMs = 320;
    this.loadOrInit(opts.seed || DEFAULT_SEED);
  }

  // -- persistence ---------------------------------------------------------

  loadOrInit(seed) {
    if (this.dataDir) {
      const file = path.join(this.dataDir, 'state.json');
      if (fs.existsSync(file)) {
        try {
          const d = JSON.parse(fs.readFileSync(file, 'utf8'));
          this.reset(d.seed, { silent: true, keepSeq: true });
          this.seq = Number(d.seq) || 0;
          this.rngState = Number(d.rngState) || 0;
          this.tick = Number(d.tick) || 0;
          this.paused = !!d.paused;
          this.blocked = new Set(d.blocked || []);
          this.jobs = d.jobs || [];
          this.jobCounter = d.jobCounter || 0;
          this.robots = (d.robots || []).map((r) => ({ ...r }));
          this.events = d.events || [];
          this.stats = d.stats || this.stats;
          this.planAll();
          this.emit('system', `Restored persisted run at tick ${this.tick}, seq ${this.seq}`);
          return;
        } catch (err) {
          this.emitError = String(err && err.message || err);
        }
      }
    }
    this.reset(seed, { silent: false, keepSeq: false });
  }

  persist() {
    if (!this.dataDir) return;
    const data = {
      version: 1,
      seed: this.seed, rngState: this.rngState, seq: this.seq,
      tick: this.tick, paused: this.paused,
      blocked: [...this.blocked],
      jobs: this.jobs, jobCounter: this.jobCounter,
      robots: this.robots.map((r) => ({
        id: r.id, x: r.x, y: r.y, home: r.home, color: r.color,
        jobId: r.jobId, phase: r.phase, waitTicks: r.waitTicks,
        lastMovedTick: r.lastMovedTick, waitReason: r.waitReason,
        replanReason: r.replanReason, lastLoggedReason: r.lastLoggedReason,
      })),
      events: this.events.slice(-300),
      stats: this.stats,
    };
    try {
      fs.mkdirSync(this.dataDir, { recursive: true });
      const tmp = path.join(this.dataDir, 'state.tmp.json');
      fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
      fs.renameSync(tmp, path.join(this.dataDir, 'state.json'));
    } catch (err) {
      this.emitError = String(err && err.message || err);
    }
  }

  // -- helpers -------------------------------------------------------------

  random() {
    this.rngState = (this.rngState + 0x6D2B79F5) | 0;
    let t = this.rngState;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  isStaticPassable(x, y) {
    if (x < 0 || y < 0 || x >= GRID_W || y >= GRID_H) return false;
    const t = this.map.cells[idx(x, y)];
    return t !== 0 && t !== 2;
  }

  isPassable(x, y) {
    return this.isStaticPassable(x, y) && !this.blocked.has(key(x, y));
  }

  jobById(id) { return this.jobs.find((j) => j.id === id); }
  shelfById(id) { return this.map.shelves.find((s) => s.id === id); }
  stationById(id) { return this.map.stations.find((s) => s.id === id); }

  priorityOf(robotId) {
    const r = this.robots.find((z) => z.id === robotId);
    if (!r || !r.jobId) return 0;
    const j = this.jobById(r.jobId);
    return j ? j.priority : 0;
  }

  effPriority(r) {
    const job = r.jobId ? this.jobById(r.jobId) : null;
    const base = job ? job.priority : 1;
    const age = Math.min(this.tick - r.lastMovedTick, 300);
    let e = base * 1000 + age * 25;
    if (age >= 45) e += 100000; // emergency anti-starvation boost
    return e;
  }

  homeGoal(r) {
    if (this.isPassable(r.home.x, r.home.y)) return r.home;
    // deterministic BFS fallback when the home cell itself is blocked
    const q = [{ x: r.home.x, y: r.home.y }];
    const seen = new Set([key(r.home.x, r.home.y)]);
    let head = 0;
    while (head < q.length) {
      const c = q[head++];
      if (this.isPassable(c.x, c.y)) return { x: c.x, y: c.y };
      for (const [dx, dy] of MOVES) {
        const nx = c.x + dx, ny = c.y + dy, k = key(nx, ny);
        if (!this.isStaticPassable(nx, ny) || seen.has(k)) continue;
        seen.add(k); q.push({ x: nx, y: ny });
      }
    }
    return r.home;
  }

  goalsFor(r) {
    const home = this.homeGoal(r);
    if (!r.jobId) return [home];
    const j = this.jobById(r.jobId);
    if (!j) return [home];
    const sh = this.shelfById(j.shelfId), st = this.stationById(j.stationId);
    if (!sh || !st) return [home];
    if (r.phase === 'to_pickup') return [sh.access, { x: st.x, y: st.y }, home];
    if (r.phase === 'to_dropoff') return [{ x: st.x, y: st.y }, home];
    return [home];
  }

  emit(type, message, robotId, jobId) {
    this.events.push({
      id: this.events.length ? this.events[this.events.length - 1].id + 1 : 1,
      seq: this.seq, tick: this.tick, type,
      message, robotId: robotId || null, jobId: jobId || null,
    });
    if (this.events.length > 400) this.events.splice(0, this.events.length - 400);
  }

  // -- commands ------------------------------------------------------------

  reset(seed, opts = {}) {
    const s = Number.isFinite(Number(seed)) && Number(seed) > 0 ? Number(seed) : DEFAULT_SEED;
    this.seed = s;
    this.rngState = s >>> 0;
    this.seq = opts.keepSeq ? this.seq + 1 : 0;
    this.tick = 0;
    this.paused = false;
    this.blocked = new Set();
    this.jobs = [];
    this.jobCounter = 0;
    this.events = [];
    this.stats = { ticks: 0, delivered: 0, replans: 0, waitsAvoided: 0, collisions: 0 };
    this.robots = HOMES.map((h, i) => ({
      id: `R${i + 1}`, x: h.x, y: h.y, home: { ...h }, color: ROBOT_COLORS[i],
      jobId: null, phase: 'idle', waitTicks: 0, lastMovedTick: 0,
      waitReason: null, replanReason: null, lastLoggedReason: null,
    }));
    this.planAll();
    if (!opts.silent) this.emit('system', `Simulation initialised with deterministic seed ${s}`);
  }

  createJob({ shelfId, stationId, priority }) {
    const sh = this.shelfById(shelfId), st = this.stationById(stationId);
    if (!sh) throw new Error(`unknown shelf: ${shelfId}`);
    if (!st) throw new Error(`unknown workstation: ${stationId}`);
    let p = Math.round(Number(priority));
    if (!Number.isFinite(p)) p = 3;
    p = Math.max(1, Math.min(5, p));
    const job = {
      id: `J${String(++this.jobCounter).padStart(3, '0')}`,
      shelfId, stationId, priority: p,
      status: 'pending', robotId: null,
      createdTick: this.tick, assignedTick: null, pickedTick: null, completedTick: null,
    };
    this.jobs.push(job);
    this.seq++;
    this.emit('job', `Job ${job.id} created: ${shelfId} -> ${stationId}, priority ${p} (${PRIORITY_LABELS[p]})`, null, job.id);
    this.assignPendingJobs();
    this.planAll();
    return job;
  }

  toggleCell(x, y, force) {
    x = Math.round(Number(x)); y = Math.round(Number(y));
    if (!this.isStaticPassable(x, y)) throw new Error(`cell (${x},${y}) is not traversable`);
    const k = key(x, y);
    const now = this.blocked.has(k);
    const target = force === undefined ? !now : !!force;
    if (target === now) return { changed: false, affected: [] };

    const affected = this.robots.filter((r) =>
      (this.plans[r.id] && this.plans[r.id].path || []).some((c) => c.x === x && c.y === y));

    if (target) this.blocked.add(k); else this.blocked.delete(k);
    this.seq++;
    const verb = target ? 'blocked' : 'unblocked';
    this.emit('map', `Cell (${x},${y}) ${verb}. ${affected.length ? `${affected.map((r) => r.id).join(', ')} replan immediately` : 'no active route affected'}`);
    for (const r of affected) {
      r.replanReason = `cell (${x},${y}) ${verb}`;
      this.emit('replan', `${r.id} replanning: ${verb} cell (${x},${y}) was on its reserved route`, r.id, r.jobId);
    }
    this.stats.replans += affected.length;
    this.planAll();
    return { changed: true, affected: affected.map((r) => r.id) };
  }

  blockAhead(robotId) {
    const r = this.robots.find((z) => z.id === robotId);
    if (!r) throw new Error(`unknown robot: ${robotId}`);
    const p = this.plans[r.id] && this.plans[r.id].path;
    if (!p || p.length < 2) throw new Error(`${robotId} has no planned next cell`);
    return this.toggleCell(p[1].x, p[1].y, true);
  }

  // -- scheduler -----------------------------------------------------------

  assignPendingJobs() {
    const pending = this.jobs.filter((j) => j.status === 'pending').sort((a, b) => {
      const ea = a.priority * 1000 + (this.tick - a.createdTick) * 20;
      const eb = b.priority * 1000 + (this.tick - b.createdTick) * 20;
      return eb - ea || a.id.localeCompare(b.id);
    });
    let assigned = 0;
    for (const j of pending) {
      const avail = this.robots.filter((r) => !r.jobId);
      if (!avail.length) break;
      const sh = this.shelfById(j.shelfId);
      let best = null, bestScore = Infinity;
      for (const r of avail) {
        const d = manhattan(r.x, r.y, sh.access.x, sh.access.y);
        const score = d + this.random() * 0.5 + (r.phase === 'idle' ? 0 : 0.25);
        if (score < bestScore) { bestScore = score; best = r; }
      }
      j.status = 'assigned'; j.robotId = best.id; j.assignedTick = this.tick;
      best.jobId = j.id; best.phase = 'to_pickup';
      best.waitReason = null; best.lastLoggedReason = null;
      assigned++;
      this.emit('assign', `Job ${j.id} (P${j.priority}) assigned to ${best.id}`, best.id, j.id);
    }
    return assigned;
  }

  planAll() {
    const stuck = new Set();
    let result = {};
    const maxIter = this.robots.length + 2;

    for (let iter = 0; iter < maxIter; iter++) {
      const res = new Reservations(this.map.corridorId);
      const plans = {};
      const newStuck = [];

      // Static obstacles first: promoted stuck robots and idle parked robots.
      const staticRobots = this.robots.filter((r) =>
        stuck.has(r.id) || (!r.jobId && r.phase === 'idle'));
      const active = this.robots.filter((r) =>
        !stuck.has(r.id) && !(!r.jobId && r.phase === 'idle'))
        .sort((a, b) => this.effPriority(b) - this.effPriority(a) || a.id.localeCompare(b.id));
      const order = [...staticRobots, ...active];

      for (const r of order) {
        if (stuck.has(r.id)) {
          res.addStatic(r.x, r.y, 0, r.id);
          const seg = this.map.corridorId[idx(r.x, r.y)];
          if (seg >= 0) res.claim(seg, r.id);
          plans[r.id] = {
            path: [{ x: r.x, y: r.y }],
            waitReason: 'no conflict-free route available; holding position',
            ok: false,
          };
          continue;
        }

        const goals = this.goalsFor(r);
        const startSeg = this.map.corridorId[idx(r.x, r.y)];
        let mustEscape = false;
        if (startSeg >= 0) {
          if (res.lockOwner(startSeg, 0, r.id)) mustEscape = true;
          else res.claim(startSeg, r.id);
        }

        let planned = null;
        if (!mustEscape) planned = planRobot(r, goals, res, this);
        if (!planned) {
          // Only back out when actually stuck inside a one-cell-wide aisle or
          // standing on a freshly blocked cell. Otherwise hold position with a
          // precise reason (e.g. the destination itself is blocked).
          const needEscape = startSeg >= 0 || !this.isPassable(r.x, r.y);
          const esc = needEscape ? findEscape(r, res, this) : null;
          if (esc) {
            res.commit(esc.path, r.id, false);
            plans[r.id] = {
              path: esc.path,
              waitReason: 'no route to target yet - clearing the aisle and replanning',
              ok: true,
            };
            continue;
          }
          newStuck.push(r.id);
          res.addStatic(r.x, r.y, 0, r.id);
          if (startSeg >= 0 && !res.lockOwner(startSeg, 0, r.id)) res.claim(startSeg, r.id);
          const blockedGoal = goals.find((g) => !this.isPassable(g.x, g.y));
          plans[r.id] = {
            path: [{ x: r.x, y: r.y }],
            waitReason: blockedGoal
              ? `target cell (${blockedGoal.x},${blockedGoal.y}) is blocked - waiting for it to be unblocked`
              : 'no conflict-free route within the planning horizon; holding position and replanning each tick',
            ok: false,
          };
          continue;
        }

        res.commit(planned.path, r.id, true);
        plans[r.id] = {
          path: planned.path, waitReason: planned.waitReason, ok: true,
        };
      }

      result = plans;
      if (!newStuck.length) break;
      for (const id of newStuck) stuck.add(id);
    }
    this.plans = result;
  }

  /** Final safety net: enforce vertex and swap conflicts on the executed move. */
  resolveMoves() {
    const order = [...this.robots].sort((a, b) =>
      this.effPriority(b) - this.effPriority(a) || a.id.localeCompare(b.id));
    const decided = new Map();
    for (const r of order) {
      const p = (this.plans[r.id] && this.plans[r.id].path) || [];
      let to = p[1] ? { x: p[1].x, y: p[1].y } : { x: r.x, y: r.y };
      let conflict = false;
      for (const [oid, d] of decided) {
        const o = this.robots.find((z) => z.id === oid);
        if (d.x === to.x && d.y === to.y) { conflict = true; break; }
        if (d.x === r.x && d.y === r.y && to.x === o.x && to.y === o.y) { conflict = true; break; }
      }
      if (conflict) to = { x: r.x, y: r.y };
      if (!this.isPassable(to.x, to.y)) to = { x: r.x, y: r.y };
      decided.set(r.id, to);
    }
    return decided;
  }

  updatePhase(r) {
    if (!r.jobId) {
      const h = this.homeGoal(r);
      if (r.x === h.x && r.y === h.y && r.phase !== 'idle') {
        r.phase = 'idle';
        this.emit('idle', `${r.id} parked at home and available for a new job`, r.id, null);
      }
      return;
    }
    const j = this.jobById(r.jobId);
    if (!j) return;
    const sh = this.shelfById(j.shelfId), st = this.stationById(j.stationId);
    if (r.phase === 'to_pickup' && r.x === sh.access.x && r.y === sh.access.y) {
      r.phase = 'to_dropoff';
      j.pickedTick = this.tick;
      this.emit('pickup', `${r.id} picked up ${j.shelfId} for ${j.id} (P${j.priority})`, r.id, j.id);
    } else if (r.phase === 'to_dropoff' && r.x === st.x && r.y === st.y) {
      j.status = 'done';
      j.completedTick = this.tick;
      this.stats.delivered++;
      this.emit('delivered', `${r.id} delivered ${j.id} to ${j.stationId} (${this.tick - j.createdTick} ticks)`, r.id, j.id);
      r.jobId = null;
      r.phase = 'returning';
      r.replanReason = null;
    }
  }

  advance() {
    this.seq++;
    this.tick++;
    // Plans are always relative to the CURRENT authoritative positions.
    // They are produced at the end of the previous tick (or by a command).
    // Only a fresh assignment invalidates them before this step executes.
    if (this.assignPendingJobs() > 0) this.planAll();
    const priorPlans = this.plans;
    const decided = this.resolveMoves();

    for (const r of this.robots) {
      const d = decided.get(r.id);
      const moved = d.x !== r.x || d.y !== r.y;
      r.x = d.x; r.y = d.y;
      if (moved) { r.lastMovedTick = this.tick; r.waitTicks = 0; }
      else r.waitTicks++;
      this.updatePhase(r);
    }

    // Wait reasons come from the plan that was actually executed this step.
    for (const r of this.robots) {
      const plan = priorPlans[r.id] || {};
      if (r.waitTicks === 0) r.waitReason = null;
      else if (r.jobId) r.waitReason = plan.waitReason || 'yielding to a higher-priority reservation';
      else if (r.phase === 'idle') r.waitReason = 'idle at home — available for dispatch';
      else r.waitReason = plan.waitReason || 'returning to home parking cell';
      if (!r.waitTicks && r.replanReason) r.replanReason = null;
    }

    // Rebuild conflict-free routes from the NEW positions. These are the
    // routes streamed to clients and used by the next fixed time step.
    this.planAll();

    for (const r of this.robots) {
      if (r.waitReason && r.waitReason !== r.lastLoggedReason) {
        this.emit('wait', `${r.id}: ${r.waitReason}`, r.id, r.jobId);
        r.lastLoggedReason = r.waitReason;
        this.stats.waitsAvoided++;
      } else if (!r.waitReason) {
        r.lastLoggedReason = null;
      }
    }
    this.stats.ticks++;
  }

  // -- output --------------------------------------------------------------

  snapshot() {
    const pending = this.jobs.filter((j) => j.status === 'pending').length;
    const assigned = this.jobs.filter((j) => j.status === 'assigned').length;
    return {
      seq: this.seq, tick: this.tick, paused: this.paused,
      seed: this.seed, speedMs: this.speedMs,
      map: {
        W: GRID_W, H: GRID_H,
        cells: this.map.cells,
        shelves: this.map.shelves,
        stations: this.map.stations,
        homes: this.map.homes,
        segments: this.map.segments,
      },
      blocked: [...this.blocked],
      robots: this.robots.map((r) => ({
        id: r.id, x: r.x, y: r.y, home: r.home, color: r.color,
        jobId: r.jobId, phase: r.phase, waitTicks: r.waitTicks,
        waitReason: r.waitReason, replanReason: r.replanReason,
        effPriority: this.effPriority(r),
        plan: (this.plans[r.id] && this.plans[r.id].path) || [{ x: r.x, y: r.y }],
        planOk: !!(this.plans[r.id] && this.plans[r.id].ok),
      })),
      jobs: this.jobs,
      events: this.events.slice(-140),
      stats: { ...this.stats, pending, assigned, active: assigned, collisions: 0 },
    };
  }
}

module.exports = {
  Engine, buildMap, GRID_W, GRID_H, HORIZON, DEFAULT_SEED,
  STATIONS, HOMES, PRIORITY_LABELS, idx, key,
};
