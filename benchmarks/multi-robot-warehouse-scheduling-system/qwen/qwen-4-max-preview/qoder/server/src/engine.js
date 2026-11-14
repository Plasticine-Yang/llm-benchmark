import { buildWarehouse, describeWarehouse, CELL, idx, xy, inBounds } from './warehouse.js';
import { planPath, spatialDistance, vkey, ekey } from './pathfind.js';
import { hashSeed } from './rng.js';

export const HORIZON = 140;
export const LOAD_TICKS = 6;
export const UNLOAD_TICKS = 5;
export const STUCK_TICKS = 10;
export const ESCALATE_TICKS = 45;
export const AGING_TICKS = 60;
export const MAX_LOGS = 400;
export const DEFAULT_TPS = 5;

const COLORS = ['#38bdf8', '#f472b6', '#a3e635', '#fbbf24', '#c084fc', '#2dd4bf', '#fb923c', '#60a5fa', '#f87171', '#34d399'];
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

const ACTIVE = new Set(['toPick', 'toDrop', 'relocating']);

export class Engine {
  constructor({ seed = 20261114, dataDir = null, onChange = null } = {}) {
    this.onChange = onChange;
    this.dataDir = dataDir;
    this.pendingLogs = [];
    this.timer = null;
    this.reset(seed, { silent: true });
  }

  // ---------------------------------------------------------------- lifecycle

  reset(seedInput, { silent = false } = {}) {
    const seed = typeof seedInput === 'string' ? hashSeed(seedInput) : (seedInput >>> 0);
    this.wh = buildWarehouse(seed);
    const prevRun = this.state ? this.state.runId : 0;
    const prevSeq = this.state ? this.state.seq : 0;
    this.state = {
      runId: prevRun + 1,
      seed,
      tick: 0,
      seq: prevSeq,
      logSeq: 0,
      running: true,
      tps: DEFAULT_TPS,
      blocked: [],
      robots: this.wh.homes.map((h, i) => ({
        id: `R${String(i + 1).padStart(2, '0')}`,
        color: COLORS[i % COLORS.length],
        x: h.x,
        y: h.y,
        home: { x: h.x, y: h.y },
        phase: 'idle',
        jobId: null,
        path: [{ x: h.x, y: h.y }],
        pathT0: 0,
        planWaits: {},
        planFailed: false,
        dwellUntil: 0,
        relocateTarget: null,
        stuckTicks: 0,
        waitingOn: null,
        waitReason: 'idle — awaiting assignment',
        distanceTravelled: 0,
        jobsDone: 0,
      })),
      jobs: [],
      logs: [],
      stats: {
        created: 0, completed: 0, cancelled: 0, replans: 0,
        deadlockResolutions: 0, yields: 0, violations: 0, invariantChecks: 0,
      },
      jobSeq: 0,
    };
    this.blockedSet = new Set();
    this.dirty = new Set();
    if (!silent) {
      this.log('info', `Simulation reset — seed ${seed}, run #${this.state.runId}, ${this.state.robots.length} robots, ${this.wh.shelves.length} shelves, ${this.wh.stations.length} workstations`);
      this.emit();
    }
    return this.state;
  }

  serialize() {
    const s = this.state;
    return {
      version: 1,
      runId: s.runId, seed: s.seed, tick: s.tick, seq: s.seq, logSeq: s.logSeq,
      running: s.running, tps: s.tps, blocked: s.blocked, robots: s.robots,
      jobs: s.jobs, logs: s.logs.slice(-MAX_LOGS), stats: s.stats, jobSeq: s.jobSeq,
    };
  }

  hydrate(data) {
    if (!data || data.version !== 1) return false;
    this.wh = buildWarehouse(data.seed);
    this.state = {
      ...data,
      logs: data.logs || [],
    };
    this.blockedSet = new Set(data.blocked);
    this.dirty = new Set();
    for (const r of this.state.robots) {
      if (!r.path || !r.path.length) r.path = [{ x: r.x, y: r.y }];
      r.planWaits = r.planWaits || {};
    }
    this.log('info', `Restored persisted run #${this.state.runId} at tick ${this.state.tick} (seed ${this.state.seed})`);
    return true;
  }

  // ------------------------------------------------------------------- helpers

  robot(id) { return this.state.robots.find((r) => r.id === id); }
  job(id) { return this.state.jobs.find((j) => j.id === id); }
  shelf(id) { return this.wh.shelves.find((s) => s.id === id); }
  station(id) { return this.wh.stations.find((s) => s.id === id); }

  cellAt(r, t) {
    const i = t - r.pathT0;
    if (i <= 0) return r.path[0];
    if (i >= r.path.length) return r.path[r.path.length - 1];
    return r.path[i];
  }

  passable(x, y) {
    if (!inBounds(x, y)) return false;
    const i = idx(x, y);
    const t = this.wh.cells[i];
    return (t === CELL.EMPTY || t === CELL.STATION) && !this.blockedSet.has(i);
  }

  occupied(x, y, exceptId) {
    return this.state.robots.some((r) => r.id !== exceptId && r.x === x && r.y === y);
  }

  log(level, text) {
    const s = this.state;
    s.logSeq += 1;
    const entry = { id: s.logSeq, tick: s.tick, level, text };
    s.logs.push(entry);
    if (s.logs.length > MAX_LOGS) s.logs.splice(0, s.logs.length - MAX_LOGS);
    this.pendingLogs.push(entry);
    return entry;
  }

  effectivePriority(job, T) {
    return job.priority * AGING_TICKS + Math.max(0, T - job.createdAtTick);
  }

  planningPriority(r, T) {
    const job = r.jobId ? this.job(r.jobId) : null;
    const base = job ? this.effectivePriority(job, T) : -1000;
    return base + r.stuckTicks * 3 + (r.phase === 'relocating' ? -400 : 0);
  }

  // ------------------------------------------------------------------ commands

  createJob({ shelfId, stationId, priority = 3 }) {
    const shelf = this.shelf(shelfId);
    const station = this.station(stationId);
    if (!shelf) throw new Error(`unknown shelf ${shelfId}`);
    if (!station) throw new Error(`unknown workstation ${stationId}`);
    const p = Math.max(1, Math.min(5, Math.round(Number(priority) || 3)));
    const s = this.state;
    s.jobSeq += 1;
    const job = {
      id: `J${String(s.jobSeq).padStart(3, '0')}`,
      shelfId, stationId, priority: p,
      status: 'queued',
      robotId: null,
      createdAtTick: s.tick,
      assignedAtTick: null,
      pickedAtTick: null,
      completedAtTick: null,
    };
    s.jobs.push(job);
    s.stats.created += 1;
    this.log('info', `Job ${job.id} created: shelf ${shelfId} → ${stationId}, priority ${p}`);
    this.emit();
    return job;
  }

  cancelJob(id) {
    const job = this.job(id);
    if (!job) throw new Error(`unknown job ${id}`);
    if (job.status === 'done' || job.status === 'cancelled') return job;
    if (job.robotId) {
      const r = this.robot(job.robotId);
      if (r) {
        r.phase = 'idle'; r.jobId = null; r.path = [{ x: r.x, y: r.y }];
        r.pathT0 = this.state.tick; r.planWaits = {}; r.stuckTicks = 0;
        r.waitReason = 'idle — job cancelled';
      }
    }
    job.status = 'cancelled';
    job.completedAtTick = this.state.tick;
    this.state.stats.cancelled += 1;
    this.log('warn', `Job ${id} cancelled`);
    this.emit();
    return job;
  }

  blockCell(x, y) {
    if (!inBounds(x, y)) throw new Error('cell out of bounds');
    const i = idx(x, y);
    const t = this.wh.cells[i];
    if (t === CELL.WALL) throw new Error('cannot block a wall');
    if (t === CELL.SHELF) throw new Error('cannot block a shelf — shelves are permanent obstacles');
    if (this.blockedSet.has(i)) return { changed: false };
    if (this.occupied(x, y)) throw new Error(`cell (${x},${y}) is currently occupied by a robot`);
    this.blockedSet.add(i);
    this.state.blocked = Array.from(this.blockedSet);
    this.log('warn', `Cell (${x},${y}) BLOCKED by operator — invalidating affected routes`);
    this.invalidateThrough(x, y);
    this.emit();
    return { changed: true };
  }

  unblockCell(x, y) {
    const i = idx(x, y);
    if (!this.blockedSet.has(i)) return { changed: false };
    this.blockedSet.delete(i);
    this.state.blocked = Array.from(this.blockedSet);
    this.log('info', `Cell (${x},${y}) unblocked — replanning waiting robots`);
    for (const r of this.state.robots) {
      if (ACTIVE.has(r.phase) || r.planFailed) this.dirty.add(r.id);
    }
    this.emit();
    return { changed: true };
  }

  invalidateThrough(x, y) {
    const T = this.state.tick;
    for (const r of this.state.robots) {
      if (r.phase === 'loading' || r.phase === 'unloading') continue;
      const from = Math.max(0, T - r.pathT0);
      let hit = false;
      for (let i = from; i < r.path.length; i++) {
        if (r.path[i].x === x && r.path[i].y === y) { hit = true; break; }
      }
      // A blocked pick face / destination also invalidates the plan.
      if (!hit && r.jobId) {
        const job = this.job(r.jobId);
        if (job) {
          if (r.phase === 'toPick') {
            const shelf = this.shelf(job.shelfId);
            hit = shelf.faces.some((f) => f.x === x && f.y === y) && r.path.length <= 1;
          } else if (r.phase === 'toDrop') {
            const st = this.station(job.stationId);
            hit = st.x === x && st.y === y;
          }
        }
      }
      if (hit) {
        this.dirty.add(r.id);
        this.log('info', `${r.id} replanning: obstacle appeared on its reserved route at (${x},${y})`);
      }
    }
  }

  setRunning(v) {
    this.state.running = !!v;
    this.log('info', v ? 'Simulation resumed' : 'Simulation paused');
    this.emit();
  }

  setSpeed(tps) {
    const v = Math.max(1, Math.min(30, Number(tps) || DEFAULT_TPS));
    this.state.tps = v;
    this.log('info', `Tick rate set to ${v} ticks/s`);
    this.emit();
  }

  singleStep() {
    this.step();
    this.emit();
  }

  // ----------------------------------------------------------------- the tick

  step() {
    const s = this.state;
    const T = s.tick;

    this.assignJobs(T);
    this.advanceDwell(T);
    const cleared = this.resolveStuck(T);
    this.replanDirty(T, cleared);

    const T1 = T + 1;
    const before = s.robots.map((r) => ({ id: r.id, x: r.x, y: r.y }));

    for (const r of s.robots) {
      const c = this.cellAt(r, T1);
      if (c.x !== r.x || c.y !== r.y) r.distanceTravelled += 1;
      r.x = c.x;
      r.y = c.y;
    }

    this.verifyInvariants(before, T1);
    this.handleArrivals(T1);

    for (const r of s.robots) {
      const prev = before.find((b) => b.id === r.id);
      const moved = prev.x !== r.x || prev.y !== r.y;
      if (ACTIVE.has(r.phase)) {
        if (moved) { r.stuckTicks = 0; s.stats.yields += 0; }
        else { r.stuckTicks += 1; s.stats.yields += 1; }
      } else {
        r.stuckTicks = 0;
      }
      r.waitReason = this.describeWait(r, T1);
      const i = T1 - r.pathT0;
      r.waitingOn = r.planWaits[String(i + 1)] || null;
    }

    s.tick = T1;
    this.emit();
  }

  verifyInvariants(before, T1) {
    const s = this.state;
    const seen = new Map();
    for (const r of s.robots) {
      const k = `${r.x},${r.y}`;
      s.stats.invariantChecks += 1;
      if (seen.has(k)) {
        s.stats.violations += 1;
        this.log('critical', `VERTEX CONFLICT at (${r.x},${r.y}) t=${T1}: ${seen.get(k)} and ${r.id}`);
      } else seen.set(k, r.id);
      if (!this.passable(r.x, r.y)) {
        s.stats.violations += 1;
        this.log('critical', `${r.id} entered non-traversable cell (${r.x},${r.y}) at t=${T1}`);
      }
    }
    for (let i = 0; i < before.length; i++) {
      for (let j = i + 1; j < before.length; j++) {
        const a = before[i];
        const b = before[j];
        const ra = this.robot(a.id);
        const rb = this.robot(b.id);
        if (a.x === rb.x && a.y === rb.y && b.x === ra.x && b.y === ra.y && (a.x !== b.x || a.y !== b.y)) {
          s.stats.violations += 1;
          this.log('critical', `SWAP CONFLICT t=${T1}: ${a.id} and ${b.id} exchanged cells`);
        }
      }
    }
  }

  assignJobs(T) {
    const s = this.state;
    const queued = s.jobs.filter((j) => j.status === 'queued');
    if (!queued.length) return;
    queued.sort((a, b) => this.effectivePriority(b, T) - this.effectivePriority(a, T) || a.id.localeCompare(b.id));
    const idle = s.robots.filter((r) => r.phase === 'idle');
    for (const job of queued) {
      if (!idle.length) break;
      const shelf = this.shelf(job.shelfId);
      let best = null;
      let bestD = Infinity;
      for (const r of idle) {
        let d = Infinity;
        for (const f of shelf.faces) {
          if (!this.passable(f.x, f.y)) continue;
          const dd = spatialDistance(this.wh, this.blockedSet, { x: r.x, y: r.y }, f);
          if (dd < d) d = dd;
        }
        if (d < bestD || (d === bestD && best && r.id < best.id)) { bestD = d; best = r; }
      }
      if (!best || bestD === Infinity) continue;
      idle.splice(idle.indexOf(best), 1);
      job.status = 'assigned';
      job.robotId = best.id;
      job.assignedAtTick = T;
      best.jobId = job.id;
      best.phase = 'toPick';
      best.stuckTicks = 0;
      this.dirty.add(best.id);
      this.log('info', `Scheduler assigned ${job.id} (p${job.priority}) to ${best.id} — ${bestD} cells to shelf ${job.shelfId}`);
    }
  }

  advanceDwell(T) {
    const s = this.state;
    for (const r of s.robots) {
      if (r.phase === 'loading' && T >= r.dwellUntil) {
        const job = this.job(r.jobId);
        r.phase = 'toDrop';
        this.dirty.add(r.id);
        this.log('info', `${r.id} loaded shelf ${job.shelfId} — heading to ${job.stationId}`);
      } else if (r.phase === 'unloading' && T >= r.dwellUntil) {
        const job = this.job(r.jobId);
        if (job) {
          job.status = 'done';
          job.completedAtTick = T;
          s.stats.completed += 1;
          this.log('success', `Job ${job.id} completed by ${r.id} at ${job.stationId} (tick ${T})`);
        }
        r.jobsDone += 1;
        r.phase = 'idle';
        r.jobId = null;
        r.path = [{ x: r.x, y: r.y }];
        r.pathT0 = T;
        r.planWaits = {};
        r.stuckTicks = 0;
        // Never leave a finished robot standing on a workstation: it would block
        // every later delivery to that station.
        this.assignRelocation(r, T);
      }
    }
  }

  handleArrivals(T1) {
    const s = this.state;
    for (const r of s.robots) {
      if (r.phase === 'toPick') {
        const job = this.job(r.jobId);
        if (!job) { r.phase = 'idle'; continue; }
        const shelf = this.shelf(job.shelfId);
        if (shelf.faces.some((f) => f.x === r.x && f.y === r.y)) {
          r.phase = 'loading';
          r.dwellUntil = T1 + LOAD_TICKS;
          r.path = Array.from({ length: LOAD_TICKS + 1 }, () => ({ x: r.x, y: r.y }));
          r.pathT0 = T1;
          r.planWaits = {};
          r.planFailed = false;
          job.pickedAtTick = T1;
          job.status = 'carrying';
          this.log('info', `${r.id} reached shelf ${job.shelfId} at (${r.x},${r.y}) — loading ${LOAD_TICKS} ticks`);
        }
      } else if (r.phase === 'toDrop') {
        const job = this.job(r.jobId);
        if (!job) { r.phase = 'idle'; continue; }
        const st = this.station(job.stationId);
        if (st.x === r.x && st.y === r.y) {
          r.phase = 'unloading';
          r.dwellUntil = T1 + UNLOAD_TICKS;
          r.path = Array.from({ length: UNLOAD_TICKS + 1 }, () => ({ x: r.x, y: r.y }));
          r.pathT0 = T1;
          r.planWaits = {};
          r.planFailed = false;
          this.log('info', `${r.id} delivered ${job.id} to ${st.id} — unloading ${UNLOAD_TICKS} ticks`);
        }
      } else if (r.phase === 'relocating') {
        const t = r.relocateTarget;
        if (t && t.x === r.x && t.y === r.y) {
          r.phase = 'idle';
          r.relocateTarget = null;
          r.path = [{ x: r.x, y: r.y }];
          r.pathT0 = T1;
          r.planWaits = {};
          this.log('info', `${r.id} parked at (${r.x},${r.y}) — corridor cleared`);
        }
      }
    }
  }

  // ------------------------------------------------------- deadlock handling

  // Queueing behind a robot that is loading/unloading is normal service, not a
  // deadlock; escalating it would cause endless pointless replanning.
  isServiceQueue(r) {
    const blocker = r.waitingOn ? this.robot(r.waitingOn) : null;
    if (blocker && (blocker.phase === 'loading' || blocker.phase === 'unloading')) return true;
    if (r.planFailed) {
      for (const g of this.goalsFor(r)) {
        const o = this.state.robots.find((x) => x.id !== r.id && x.x === g.x && x.y === g.y);
        if (o && (o.phase === 'loading' || o.phase === 'unloading')) return true;
      }
    }
    return false;
  }

  resolveStuck(T) {
    const s = this.state;
    const cleared = new Set();
    const waiters = s.robots
      .filter((r) => ACTIVE.has(r.phase) && r.stuckTicks >= STUCK_TICKS && !this.isServiceQueue(r))
      .sort((a, b) => this.planningPriority(b, T) - this.planningPriority(a, T));
    if (!waiters.length) return cleared;

    const involved = new Set();
    for (const r of waiters) {
      const chain = new Set([r.id]);
      let cur = r.waitingOn;
      let guard = 0;
      while (cur && guard++ < s.robots.length + 2 && !chain.has(cur)) {
        chain.add(cur);
        const b = this.robot(cur);
        if (!b) break;
        if (b.phase === 'idle') this.assignRelocation(b, T);
        cur = b.waitingOn;
      }
      if (r.stuckTicks >= ESCALATE_TICKS) {
        const mine = this.planningPriority(r, T);
        for (const o of s.robots) {
          if (o.id !== r.id && this.planningPriority(o, T) < mine) chain.add(o.id);
        }
      }
      for (const id of chain) involved.add(id);
      this.dirty.add(r.id);
    }

    const leader = waiters[0];
    for (const id of involved) {
      if (id === leader.id) continue;
      const r = this.robot(id);
      if (!r) continue;
      if (r.phase === 'loading' || r.phase === 'unloading') continue;
      cleared.add(id);
      this.dirty.add(id);
    }
    // A robot may only be treated as a "soft" obstacle if it is actually going to
    // move. An idle robot with nowhere to go stays a hard reservation, otherwise a
    // higher-priority planner would route straight through it.
    for (const id of Array.from(cleared)) {
      const r = this.robot(id);
      if (!r || this.goalsFor(r).length === 0) {
        cleared.delete(id);
        this.dirty.delete(id);
      }
    }
    s.stats.deadlockResolutions += 1;
    const cycle = involved.size > 1 ? `wait-cycle ${Array.from(involved).join(' → ')}` : 'congestion';
    this.log('warn', `Deadlock avoidance: ${leader.id} stuck ${leader.stuckTicks} ticks (${cycle}); replanning ${cleared.size + 1} robots with ${leader.id} first`);
    return cleared;
  }

  assignRelocation(r, T) {
    const s = this.state;
    const faceSet = new Set();
    for (const sh of this.wh.shelves) for (const f of sh.faces) faceSet.add(idx(f.x, f.y));
    for (const st of this.wh.stations) faceSet.add(idx(st.x, st.y));

    const start = idx(r.x, r.y);
    const dist = new Int32Array(this.wh.w * this.wh.h).fill(-1);
    dist[start] = 0;
    const q = [start];
    let target = null;
    for (let head = 0; head < q.length && !target; head++) {
      const cur = q[head];
      const { x, y } = xy(cur);
      for (const [ox, oy] of DIRS) {
        const nx = x + ox;
        const ny = y + oy;
        if (!this.passable(nx, ny)) continue;
        const ni = idx(nx, ny);
        if (dist[ni] >= 0) continue;
        dist[ni] = dist[cur] + 1;
        q.push(ni);
        if (dist[ni] >= 3 && !this.wh.corridor[ni] && !faceSet.has(ni) && !this.occupied(nx, ny, r.id)) {
          target = { x: nx, y: ny };
          break;
        }
      }
    }
    if (!target) return false;
    r.phase = 'relocating';
    r.relocateTarget = target;
    r.stuckTicks = 0;
    this.dirty.add(r.id);
    this.log('info', `${r.id} yielding — relocating to (${target.x},${target.y}) to keep the aisle and workstation clear`);
    return true;
  }

  // -------------------------------------------------------------- planning

  reserveLimit(r, T, end, soft) {
    if (soft) return T;
    if (r.phase === 'idle' || r.planFailed) return end;
    return Math.max(T, Math.min(end, r.pathT0 + r.path.length - 1));
  }

  buildReservations(T, excludeId, cleared) {
    const res = new Map();
    const edge = new Map();
    const end = T + HORIZON;
    for (const r of this.state.robots) {
      if (r.id === excludeId) continue;
      const limit = this.reserveLimit(r, T, end, cleared.has(r.id));
      let prev = this.cellAt(r, T);
      res.set(vkey(prev.x, prev.y, T), r.id);
      for (let t = T + 1; t <= limit; t++) {
        const c = this.cellAt(r, t);
        res.set(vkey(c.x, c.y, t), r.id);
        if (c.x !== prev.x || c.y !== prev.y) edge.set(ekey(prev.x, prev.y, c.x, c.y, t - 1), r.id);
        prev = c;
      }
    }
    return { res, edge };
  }

  goalsFor(r) {
    if (r.phase === 'relocating') return r.relocateTarget ? [r.relocateTarget] : [];
    const job = this.job(r.jobId);
    if (!job) return [];
    if (r.phase === 'toPick') {
      const shelf = this.shelf(job.shelfId);
      return shelf.faces.filter((f) => this.passable(f.x, f.y));
    }
    if (r.phase === 'toDrop') {
      const st = this.station(job.stationId);
      return this.passable(st.x, st.y) ? [{ x: st.x, y: st.y }] : [];
    }
    return [];
  }

  freeGoalBlockers(r, goals, T) {
    const goalKeys = new Set(goals.map((g) => `${g.x},${g.y}`));
    for (const o of this.state.robots) {
      if (o.id === r.id || o.phase !== 'idle') continue;
      if (goalKeys.has(`${o.x},${o.y}`)) this.assignRelocation(o, T);
    }
  }

  /**
   * Detect any residual space-time conflict between the committed plans.
   * A robot that was allowed to be "soft" during prioritised planning may have
   * failed to find a route and stayed put, which invalidates plans made before it.
   */
  findPlanConflicts(T) {
    const end = T + HORIZON;
    const vertex = new Map();
    const edges = new Map();
    const offenders = new Set();
    for (const r of this.state.robots) {
      const limit = this.reserveLimit(r, T, end, false);
      let prev = this.cellAt(r, T);
      const k0 = vkey(prev.x, prev.y, T);
      const o0 = vertex.get(k0);
      if (o0 !== undefined && o0 !== r.id) { offenders.add(o0); offenders.add(r.id); }
      else vertex.set(k0, r.id);
      for (let t = T + 1; t <= limit; t++) {
        const c = this.cellAt(r, t);
        const k = vkey(c.x, c.y, t);
        const o = vertex.get(k);
        if (o !== undefined && o !== r.id) { offenders.add(o); offenders.add(r.id); }
        else vertex.set(k, r.id);
        if (c.x !== prev.x || c.y !== prev.y) {
          const rev = ekey(c.x, c.y, prev.x, prev.y, t - 1);
          const so = edges.get(rev);
          if (so !== undefined && so !== r.id) { offenders.add(so); offenders.add(r.id); }
          edges.set(ekey(prev.x, prev.y, c.x, c.y, t - 1), r.id);
        }
        prev = c;
      }
    }
    return offenders;
  }

  freeze(r, T) {
    r.path = [{ x: r.x, y: r.y }];
    r.pathT0 = T;
    r.planWaits = {};
    r.planFailed = true;
  }

  replanDirty(T, cleared) {
    const s = this.state;
    const MAX_PASSES = 5;

    for (let pass = 0; pass < MAX_PASSES; pass++) {
      const list = Array.from(this.dirty)
        .map((id) => this.robot(id))
        .filter((r) => r && ACTIVE.has(r.phase));
      this.dirty.clear();
      list.sort((a, b) => this.planningPriority(b, T) - this.planningPriority(a, T) || a.id.localeCompare(b.id));

      for (const r of list) {
        const goals = this.goalsFor(r);
        if (!goals.length) {
          this.freeze(r, T);
          cleared.delete(r.id);
          continue;
        }
        const { res, edge } = this.buildReservations(T, r.id, cleared);
        const dwell = r.phase === 'toPick' ? LOAD_TICKS : r.phase === 'toDrop' ? UNLOAD_TICKS : 0;
        const out = planPath({
          wh: this.wh, blocked: this.blockedSet,
          start: { x: r.x, y: r.y }, goals, t0: T, horizon: HORIZON,
          res, edge, selfId: r.id, dwell,
        });
        s.stats.replans += 1;
        if (out) {
          r.path = out.cells;
          r.pathT0 = T;
          r.planWaits = {};
          for (const [i, owner] of out.waits) r.planWaits[String(i)] = owner;
          r.planFailed = false;
        } else {
          this.freeze(r, T);
          this.dirty.add(r.id);
          this.freeGoalBlockers(r, goals, T);
        }
        // Once replanned, this robot is a hard constraint for the rest of the queue.
        cleared.delete(r.id);
      }

      const offenders = this.findPlanConflicts(T);
      if (!offenders.size) return;

      if (pass === MAX_PASSES - 1) {
        // Last resort: freeze every offender. All robots then hold their current
        // (unique) cells, which is trivially conflict-free; the deadlock resolver
        // will restart progress on a later tick.
        for (const id of offenders) this.freeze(this.robot(id), T);
        this.dirty.clear();
        if (this.findPlanConflicts(T).size) {
          for (const r of s.robots) if (ACTIVE.has(r.phase)) this.freeze(r, T);
        }
        s.stats.deadlockResolutions += 1;
        this.log('warn', `Plan repair fallback at tick ${T}: froze ${offenders.size} robots to guarantee collision freedom`);
        return;
      }

      cleared.clear();
      for (const id of offenders) this.dirty.add(id);
    }
  }

  describeWait(r, T) {
    if (r.phase === 'idle') return 'idle — awaiting assignment';
    if (r.phase === 'loading') {
      const job = this.job(r.jobId);
      return `loading at shelf ${job ? job.shelfId : '?'} (${Math.max(0, r.dwellUntil - T)} ticks left)`;
    }
    if (r.phase === 'unloading') {
      const job = this.job(r.jobId);
      return `unloading at ${job ? job.stationId : '?'} (${Math.max(0, r.dwellUntil - T)} ticks left)`;
    }
    if (r.planFailed) return 'no conflict-free route yet — retrying every tick';
    const i = T - r.pathT0;
    const next = r.path[i + 1];
    if (!next) return 'holding position — plan complete, awaiting next phase';
    if (next.x !== r.x || next.y !== r.y) return null;
    const blocker = r.planWaits[String(i + 1)];
    if (blocker) {
      const why = r.stuckTicks >= STUCK_TICKS ? 'deadlock resolution pending' : 'space-time reservation';
      return `waiting for ${blocker} at (${r.x},${r.y}) — ${why}`;
    }
    return `yielding at (${r.x},${r.y}) — reserved by higher-priority traffic`;
  }

  // ------------------------------------------------------------- projections

  robotView(r) {
    const T = this.state.tick;
    const from = Math.max(0, T - r.pathT0);
    const remaining = r.path.slice(from).map((c) => ({ x: c.x, y: c.y }));
    const job = r.jobId ? this.job(r.jobId) : null;
    return {
      id: r.id, color: r.color, x: r.x, y: r.y, home: r.home,
      phase: r.phase, jobId: r.jobId, priority: job ? job.priority : null,
      shelfId: job ? job.shelfId : null, stationId: job ? job.stationId : null,
      path: remaining, stuckTicks: r.stuckTicks, waitingOn: r.waitingOn,
      waitReason: r.waitReason, planFailed: r.planFailed,
      distanceTravelled: r.distanceTravelled, jobsDone: r.jobsDone,
      relocateTarget: r.relocateTarget,
    };
  }

  snapshot() {
    const s = this.state;
    s.seq += 1;
    return {
      type: 'snapshot',
      seq: s.seq,
      runId: s.runId,
      tick: s.tick,
      running: s.running,
      tps: s.tps,
      seed: s.seed,
      blocked: s.blocked,
      robots: s.robots.map((r) => this.robotView(r)),
      jobs: s.jobs,
      logs: s.logs.slice(-200),
      stats: s.stats,
      meta: describeWarehouse(this.wh),
      constants: { HORIZON, LOAD_TICKS, UNLOAD_TICKS, STUCK_TICKS, ESCALATE_TICKS, AGING_TICKS },
    };
  }

  emit() {
    if (!this.onChange) return;
    const s = this.state;
    s.seq += 1;
    const msg = {
      type: 'delta',
      seq: s.seq,
      runId: s.runId,
      tick: s.tick,
      running: s.running,
      tps: s.tps,
      seed: s.seed,
      blocked: s.blocked,
      robots: s.robots.map((r) => this.robotView(r)),
      jobs: s.jobs,
      stats: s.stats,
      logs: this.pendingLogs,
    };
    this.pendingLogs = [];
    this.onChange(msg);
  }

  // -------------------------------------------------------------- tick loop

  start() {
    const loop = () => {
      const delay = Math.max(20, Math.round(1000 / this.state.tps));
      this.timer = setTimeout(() => {
        if (this.state.running) {
          try {
            this.step();
          } catch (err) {
            this.log('critical', `engine error: ${err.message}`);
            this.state.running = false;
            this.emit();
          }
        }
        loop();
      }, delay);
    };
    loop();
  }

  stop() {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
  }
}