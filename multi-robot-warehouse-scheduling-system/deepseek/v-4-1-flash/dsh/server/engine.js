// The authoritative simulation engine.
//
// Fixed time steps. Every tick the engine
//   1. assigns pending jobs to idle robots (priority + aging, no starvation),
//   2. replans trajectories with a time-expanded A* that reserves (cell, time)
//      pairs and directed edges (no shared cells, no swaps, one robot per
//      one-cell-wide aisle),
//   3. applies exactly one step per robot with a final safety check against the
//      *live* authoritative positions,
//   4. publishes events (monotonically increasing seq) and snapshots.
//
// The frontend never decides a robot position; it only renders what the engine
// streams.

import { buildWarehouse } from './warehouse.js';
import { planSpaceTime, manhattan } from './pathfinding.js';

export const PRIORITY_NAMES = { 1: 'low', 2: 'normal', 3: 'high', 4: 'urgent', 5: 'critical' };

const GLOBAL_REPLAN_INTERVAL = 6; // periodic coordinated replan (ticks)
const PLAN_HORIZON = 220; // time-expanded A* horizon (ticks)
const WAIT_EVENT_COOLDOWN = 8; // do not spam ROBOT_WAITING for the same reason
const DEADLOCK_NO_MOVE_TICKS = 22; // every robot frozen this long -> breaker
const DEADLOCK_WAIT_TICKS = 45; // a single robot waiting this long -> breaker
const JOB_AGING_TICKS = 25; // pending job gains an effective priority level
const MAX_EVENTS = 1500;

function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class Engine {
  constructor(options = {}) {
    this.seed = options.seed ?? 7;
    this.warehouse = options.warehouse ?? buildWarehouse();
    this.tps = options.tps ?? 4;
    this.listeners = new Set();
    this.forceGlobalReplan = null;
    this.buildWorld();
  }

  // ---------------------------------------------------------------- world ---
  buildWorld() {
    const wh = this.warehouse;
    this.N = wh.width * wh.height;
    this.blocked = new Uint8Array(this.N);
    this.blockedCells = new Set();
    this.tick = 0;
    this.eventSeq = 0;
    this.events = [];
    this.paused = true;
    this.jobs = [];
    this.jobSeq = 0;
    this.rng = mulberry32(this.seed);
    this.rngState = this.seed;
    this.noMoveTicks = 0;
    this.lastMovedCount = 0;
    this.deadlockBreakerRobot = null;
    this.dirty = new Set();
    this.reservations = new Map();
    this.stats = { jobsCreated: 0, jobsCompleted: 0, replans: 0, blockedEvents: 0, laneYields: 0, deadlockBreaks: 0 };
    this.robots = wh.robots.map((def) => ({
      id: def.id,
      label: def.label,
      index: def.index,
      x: def.start.x,
      y: def.start.y,
      home: def.home,
      status: 'IDLE',
      jobId: null,
      carrying: null,
      path: [def.home],
      pathStartTick: 0,
      waitTicks: 0,
      waiting: null,
      moves: 0,
      replanCount: 0,
      lastMoveTick: 0,
      lastWaitEventTick: -999,
    }));
    this.emit('SIM_READY', `warehouse ready: ${wh.shelves.length} shelves, ${wh.workstations.length} workstations, ${this.robots.length} robots, ${wh.lanes.length} single-lane aisles`, {
      seed: this.seed,
    });
  }

  reset(seed = this.seed, { autostart = true } = {}) {
    this.seed = seed;
    this.buildWorld();
    this.paused = !autostart;
    this.emit('SIM_RESET', `simulation reset with deterministic seed ${seed}`, { seed, tick: 0 });
  }

  // -------------------------------------------------------------- helpers ---
  idx(x, y) {
    return y * this.warehouse.width + x;
  }

  xy(cell) {
    const x = cell % this.warehouse.width;
    return { x, y: (cell - x) / this.warehouse.width };
  }

  /** [x, y] pair — the wire format used by the frontend. */
  xyPair(cell) {
    const x = cell % this.warehouse.width;
    return [x, (cell - x) / this.warehouse.width];
  }

  isTraversableCell(cell) {
    if (cell < 0 || cell >= this.N) return false;
    if (this.blocked[cell]) return false;
    const x = cell % this.warehouse.width;
    const y = (cell - x) / this.warehouse.width;
    return this.warehouse.isStaticTraversable(x, y);
  }

  isTraversableXY(x, y) {
    if (x < 0 || y < 0 || x >= this.warehouse.width || y >= this.warehouse.height) return false;
    return this.isTraversableCell(this.idx(x, y));
  }

  robotAt(cell) {
    for (const r of this.robots) if (this.idx(r.x, r.y) === cell) return r;
    return null;
  }

  shelf(id) {
    return this.warehouse.shelves.find((s) => s.id === id) ?? null;
  }

  workstation(id) {
    return this.warehouse.workstations.find((w) => w.id === id) ?? null;
  }

  job(id) {
    return this.jobs.find((j) => j.id === id) ?? null;
  }

  emit(type, message, data = {}) {
    const event = {
      seq: ++this.eventSeq,
      tick: this.tick,
      type,
      message,
      data,
      ts: Date.now(),
    };
    this.events.push(event);
    if (this.events.length > MAX_EVENTS) this.events.splice(0, this.events.length - MAX_EVENTS);
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch {
        /* a broken client must not break the simulation */
      }
    }
    return event;
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // ------------------------------------------------------------- planning ---
  jobEffectivePriority(job) {
    const boost = Math.floor((job.waitTicks ?? 0) / JOB_AGING_TICKS);
    return Math.min(5 + 2, job.priority + Math.min(boost, 3));
  }

  planScore(robot) {
    if (robot.index === this.deadlockBreakerRobot) return 1e9 + robot.waitTicks;
    const job = robot.jobId ? this.job(robot.jobId) : null;
    const base = job ? this.jobEffectivePriority(job) * 1000 : 0;
    const waitBoost = Math.min(robot.waitTicks, 120) * 20; // aging: a waiting robot must eventually win
    const carrying = robot.status === 'CARRYING' ? 60 : 0;
    return base + waitBoost + carrying;
  }

  planOrder() {
    return [...this.robots].sort((a, b) => {
      const sa = this.planScore(a);
      const sb = this.planScore(b);
      if (sb !== sa) return sb - sa;
      if (b.waitTicks !== a.waitTicks) return b.waitTicks - a.waitTicks;
      return a.id < b.id ? -1 : 1;
    });
  }

  pickupCandidates(shelf) {
    const wh = this.warehouse;
    const cells = [];
    const push = (x, y) => {
      if (!wh.isStaticTraversable(x, y)) return;
      const c = this.idx(x, y);
      if (!cells.includes(c)) cells.push(c);
    };
    if (shelf.pickup !== null) cells.push(shelf.pickup);
    push(shelf.x, shelf.y + shelf.h);
    push(shelf.x, shelf.y - 1);
    push(shelf.x + shelf.w, shelf.y);
    push(shelf.x - 1, shelf.y);
    return cells;
  }

  /** Which cell should this robot drive to right now? null => park where you are. */
  goalFor(robot, reservations) {
    const job = robot.jobId ? this.job(robot.jobId) : null;
    if (job && (job.status === 'ASSIGNED' || job.status === 'CARRYING')) {
      if (job.status === 'CARRYING') {
        const ws = this.workstation(job.workstationId);
        return ws ? ws.cell : null;
      }
      const shelf = this.shelf(job.shelfId);
      if (!shelf) return null;
      const candidates = this.pickupCandidates(shelf);
      if (candidates.length === 0) return null;
      // prefer a pickup cell that is not reserved by another robot right now
      const free = candidates.filter((c) => (reservations ? reservations(this.planBase ?? this.tick, c, robot.id) === null : true) && !this.blocked[c]);
      const pool = free.length > 0 ? free : candidates;
      return pool[0];
    }
    if (robot.status === 'IDLE' && this.idx(robot.x, robot.y) !== robot.home && !this.blocked[robot.home]) {
      return robot.home;
    }
    return null;
  }

  commitPath(robot, cells) {
    const prev = robot.path;
    const base = this.planBase ?? this.tick;
    const changed =
      !prev ||
      prev.length !== cells.length ||
      robot.pathStartTick !== base ||
      cells.slice(0, 12).some((c, i) => prev[i] !== c);
    robot.path = cells;
    robot.pathStartTick = base;
    robot.replanCount += 1;
    return changed;
  }

  pathCellAt(robot, tick) {
    const k = tick - robot.pathStartTick;
    if (!robot.path || k < 0 || k >= robot.path.length) return null;
    return robot.path[k];
  }

  /**
   * Full coordinated replan: robots are planned one after another in strict
   * priority order; each committed trajectory is immediately written into the
   * reservation table, so later (lower priority) robots must yield.
   */
  replanAll(reason) {
    const t = this.planBase ?? this.tick;
    const N = this.N;
    const map = new Map(); // t*N + cell -> robot id
    const laneIdByCell = this.warehouse.laneIdByCell;
    const laneCells = this.warehouse.lanes.map((l) => l.cells);

    const occ = (absTick, cell, selfId) => {
      const owner = map.get(absTick * N + cell);
      if (owner === undefined || owner === selfId) return null;
      return owner;
    };
    const laneOccupiedAt = (absTick, laneId, selfId) => {
      if (laneId < 0) return false;
      const cells = laneCells[laneId];
      for (let i = 0; i < cells.length; i++) {
        const owner = map.get(absTick * N + cells[i]);
        if (owner !== undefined && owner !== selfId) return true;
      }
      return false;
    };

    // Conservative hold: nobody may plan to enter a cell another robot stands on
    // during the first step, even if that robot is about to move away.
    for (const r of this.robots) {
      const c = this.idx(r.x, r.y);
      map.set(t * N + c, r.id);
      map.set((t + 1) * N + c, r.id);
    }

    const order = this.planOrder();
    let planned = 0;
    let partial = 0;
    const pathUpdates = [];

    for (const r of order) {
      const current = this.idx(r.x, r.y);
      map.delete(t * N + current);
      map.delete((t + 1) * N + current);
      const goal = this.goalFor(r, occ);
      let cells;
      let reached = true;
      if (goal === null || goal === current) {
        cells = new Array(PLAN_HORIZON + 1).fill(current);
      } else {
        const result = planSpaceTime({
          width: this.warehouse.width,
          height: this.warehouse.height,
          isTraversable: (x, y) => this.isTraversableCell(this.idx(x, y)),
          start: current,
          goal,
          startTick: t,
          selfId: r.id,
          occ,
          laneIdOf: (cell) => laneIdByCell[cell],
          laneOccupiedAt,
          maxT: PLAN_HORIZON,
        });
        cells = result.cells;
        reached = result.reached;
        if (!reached) partial += 1;
      }
      for (let k = 0; k < cells.length; k++) map.set((t + k) * N + cells[k], r.id);
      if (this.commitPath(r, cells)) pathUpdates.push(r);
      if (reached) planned += 1;
      this.updateWaitState(r, cells);
    }

    this.reservations = map;
    this.dirty = new Set();
    this.stats.replans += 1;
    this.emit('REPLAN', `coordinated replan (${reason}): ${planned}/${this.robots.length} robots have a full trajectory${partial ? `, ${partial} make best-effort progress` : ''}`, {
      reason,
      planned,
      partial,
      order: order.map((r) => r.id),
    });
    for (const r of pathUpdates) {
      this.emit('PATH_SET', `${r.label} trajectory updated (${r.path.length} steps reserved)`, {
        robotId: r.id,
        pathStartTick: r.pathStartTick,
        path: this.encodePath(r, 96, this.planBase),
      });
    }
    return { planned, partial };
  }

  /** Explains *why* a robot's next step is a wait — surfaced in the UI. */
  updateWaitState(robot, cells) {
    const t = this.planBase ?? this.tick;
    const current = this.idx(robot.x, robot.y);
    const next = cells.length > 1 ? cells[1] : current;
    robot.planWaitReason = null;
    if (next !== current) {
      return;
    }
    const job = robot.jobId ? this.job(robot.jobId) : null;
    if (!job && robot.status === 'IDLE' && current === robot.home) {
      robot.planWaitReason = { reason: 'idle', detail: 'parked at home, no job assigned' };
      return;
    }
    const N = this.N;
    const map = this.reservations;
    const ownerAt = (absTick, cell) => {
      const owner = map.get(absTick * N + cell);
      return owner === undefined || owner === robot.id ? null : owner;
    };
    const blockers = [];
    const w = this.warehouse.width;
    const x = current % w;
    const y = (current - x) / w;
    const myLane = this.warehouse.laneIdByCell[current];
    for (const [dx, dy] of [[0, -1], [1, 0], [0, 1], [-1, 0]]) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= w || ny >= this.warehouse.height) continue;
      const nc = this.idx(nx, ny);
      if (this.blocked[nc]) {
        blockers.push({ kind: 'blocked', detail: `cell (${nx},${ny}) is blocked` });
        continue;
      }
      if (!this.warehouse.isStaticTraversable(nx, ny)) continue;
      const owner = ownerAt(t + 1, nc);
      if (owner) {
        blockers.push({ kind: 'occupied', detail: `${owner} reserved cell (${nx},${ny}) at t=${t + 1}` });
        continue;
      }
      const blockerNow = ownerAt(t, nc);
      if (blockerNow && ownerAt(t + 1, current) === blockerNow) {
        blockers.push({ kind: 'swap', detail: `swap with ${blockerNow} prevented` });
        continue;
      }
      const nLane = this.warehouse.laneIdByCell[nc];
      if (nLane !== -1 && nLane !== myLane) {
        blockers.push({ kind: 'lane', detail: `single-lane aisle ${nLane} busy or reserved` });
      }
    }
    const priority = blockers.some((b) => b.kind === 'blocked')
      ? blockers.find((b) => b.kind === 'blocked')
      : blockers.find((b) => b.kind === 'lane') ?? blockers.find((b) => b.kind === 'occupied') ?? blockers[0];
    robot.planWaitReason = priority
      ? {
          reason: priority.kind === 'lane' ? 'single-lane-aisle-occupied' : priority.kind === 'swap' ? 'swap-prevented' : priority.kind === 'blocked' ? 'blocked-cell' : 'cell-reserved-ahead',
          detail: priority.detail,
        }
      : { reason: 'no-route', detail: 'no collision-free trajectory available within the planning horizon' };
    if (robot.planWaitReason.reason === 'single-lane-aisle-occupied') this.stats.laneYields += 1;
  }

  // -------------------------------------------------------------- execution ---
  applyMoves() {
    const t = this.planBase ?? this.tick;
    const order = this.planOrder();
    const claimed = new Map(); // cell -> robot id
    const intents = new Map();
    for (const r of this.robots) {
      const next = this.pathCellAt(r, t + 1);
      intents.set(r.id, next === null ? this.idx(r.x, r.y) : next);
    }

    let movedCount = 0;
    let waitingCount = 0;
    for (const r of order) {
      const current = this.idx(r.x, r.y);
      let target = intents.get(r.id);
      let blockedReason = null;
      // a planned hold (the committed trajectory itself says "stay") is not a
      // deviation: the trajectory stays valid and no replan is forced.
      const plannedHold = target === current;

      if (target === current) {
        blockedReason = r.planWaitReason ?? { reason: 'holding', detail: 'trajectory holds position this step' };
      } else if (!this.isTraversableCell(target)) {
        blockedReason = { reason: 'blocked-cell', detail: `cell ahead ${JSON.stringify(this.xy(target))} became untraversable — replanning` };
      } else {
        const occupant = this.robotAt(target);
        const claimedBy = claimed.get(target);
        if ((occupant && occupant.id !== r.id) || (claimedBy && claimedBy !== r.id)) {
          const who = occupant ? occupant.id : claimedBy;
          blockedReason = { reason: 'cell-reserved-ahead', detail: `cell ${JSON.stringify(this.xy(target))} still held by ${who}` };
        } else {
          const other = this.robotAt(target);
          if (other && intents.get(other.id) === current) {
            blockedReason = { reason: 'swap-prevented', detail: `simultaneous swap with ${other.id} refused` };
          }
        }
      }

      if (blockedReason) {
        target = current;
        r.waitTicks += 1;
        r.waiting = { reason: blockedReason.reason, detail: blockedReason.detail, sinceTick: r.waiting?.reason === blockedReason.reason ? r.waiting.sinceTick : t };
        r.waitingSince = r.waiting.sinceTick;
        waitingCount += 1;
        if (!plannedHold) {
          // the committed trajectory is no longer valid -> force a replan
          r.path = [current];
          r.pathStartTick = t;
          this.forceGlobalReplan = this.forceGlobalReplan ?? (blockedReason.reason === 'blocked-cell' ? 'blocked-cell-ahead' : 'execution-conflict');
        }
        this.maybeEmitWait(r, blockedReason);
      } else {
        const from = this.xy(current);
        const to = this.xy(target);
        r.x = to.x;
        r.y = to.y;
        r.moves += 1;
        r.waitTicks = 0;
        r.waiting = null;
        r.lastMoveTick = t;
        movedCount += 1;
        this.emit('ROBOT_MOVED', `${r.label} ${JSON.stringify(from)} -> ${JSON.stringify(to)}`, {
          robotId: r.id,
          from,
          to,
          x: to.x,
          y: to.y,
          status: r.status,
        });
      }
      claimed.set(this.idx(r.x, r.y), r.id);
      // keep the reservation table in sync with reality for the next replan
      if (this.reservations) {
        const c = this.idx(r.x, r.y);
        this.reservations.set((t + 1) * this.N + c, r.id);
      }
    }
    this.lastMovedCount = movedCount;
    this.lastWaitingCount = waitingCount;
    return { movedCount, waitingCount };
  }

  maybeEmitWait(robot, blockedReason) {
    const t = this.tick; // world clock of the step being executed
    if (t - robot.lastWaitEventTick < WAIT_EVENT_COOLDOWN) return;
    robot.lastWaitEventTick = t;
    const job = robot.jobId ? this.job(robot.jobId) : null;
    this.emit('ROBOT_WAITING', `${robot.label} waits: ${blockedReason.reason} — ${blockedReason.detail}`, {
      robotId: robot.id,
      reason: blockedReason.reason,
      detail: blockedReason.detail,
      waitTicks: robot.waitTicks,
      jobId: job?.id ?? null,
      status: robot.status,
    });
  }

  postMove() {
    for (const r of this.robots) {
      const job = r.jobId ? this.job(r.jobId) : null;
      if (!job) {
        if (r.status === 'IDLE' && this.idx(r.x, r.y) !== r.home) this.dirty.add(r.id);
        continue;
      }
      const cell = this.idx(r.x, r.y);
      if (job.status === 'ASSIGNED') {
        const shelf = this.shelf(job.shelfId);
        const next = this.pathCellAt(r, this.tick);
        const atPickup = shelf && (cell === shelf.pickup || this.pickupCandidates(shelf).includes(cell));
        if (atPickup) {
          job.status = 'CARRYING';
          job.pickedTick = this.tick;
          r.status = 'CARRYING';
          r.carrying = job.shelfId;
          if (shelf) shelf.state = 'in_transit';
          this.emit('JOB_PICKED', `${r.label} picked up shelf ${job.shelfId} for job ${job.id}`, {
            jobId: job.id,
            robotId: r.id,
            shelfId: job.shelfId,
            tick: this.tick,
          });
          this.dirty.add(r.id);
        } else if (next === null) {
          this.dirty.add(r.id);
        }
      } else if (job.status === 'CARRYING') {
        const ws = this.workstation(job.workstationId);
        if (ws && cell === ws.cell) {
          job.status = 'DONE';
          job.completedTick = this.tick;
          r.status = 'IDLE';
          r.jobId = null;
          r.carrying = null;
          r.waitTicks = 0;
          r.waiting = null;
          const shelf = this.shelf(job.shelfId);
          if (shelf) shelf.state = 'available';
          this.stats.jobsCompleted += 1;
          const waitTotal = this.tick - job.createdAtTick;
          this.emit('JOB_DONE', `job ${job.id} delivered shelf ${job.shelfId} to ${job.workstationId} in ${waitTotal} ticks`, {
            jobId: job.id,
            robotId: r.id,
            shelfId: job.shelfId,
            workstationId: job.workstationId,
            tick: this.tick,
            totalTicks: waitTotal,
          });
          this.dirty.add(r.id);
        }
      }
    }
  }

  detectDeadlock() {
    if (this.lastMovedCount === 0) this.noMoveTicks += 1;
    else this.noMoveTicks = 0;

    const stuck = this.robots.filter((r) => r.jobId && r.waitTicks >= DEADLOCK_WAIT_TICKS);
    if (this.noMoveTicks >= DEADLOCK_NO_MOVE_TICKS || stuck.length > 0) {
      const candidates = (stuck.length > 0 ? stuck : this.robots.filter((r) => r.jobId)).sort((a, b) => (b.waitTicks !== a.waitTicks ? b.waitTicks - a.waitTicks : a.id < b.id ? -1 : 1));
      const chosen = candidates[0];
      if (chosen) {
        this.deadlockBreakerRobot = chosen.index;
        this.forceGlobalReplan = 'deadlock-breaker';
        this.stats.deadlockBreaks += 1;
        this.emit('DEADLOCK_BREAKER', `deadlock breaker: ${chosen.label} gets absolute scheduling priority (waited ${chosen.waitTicks} ticks, ${this.noMoveTicks} ticks without any movement)`, {
          robotId: chosen.id,
          waitTicks: chosen.waitTicks,
          noMoveTicks: this.noMoveTicks,
        });
        this.noMoveTicks = 0;
      }
    } else if (this.deadlockBreakerRobot !== null) {
      const r = this.robots[this.deadlockBreakerRobot];
      if (!r || r.waitTicks === 0) this.deadlockBreakerRobot = null;
    }
  }

  // ------------------------------------------------------------------ jobs ---
  assignJobs() {
    for (const job of this.jobs) {
      if (job.status !== 'PENDING' && job.status !== 'WAITING_SHELF') continue;
      job.waitTicks = this.tick - job.createdAtTick;
      const before = job.effectivePriority;
      job.effectivePriority = this.jobEffectivePriority(job);
      if (job.effectivePriority > before && job.priority < 5) {
        this.emit('JOB_AGED', `job ${job.id} aged: effective priority ${before} -> ${job.effectivePriority} (waiting ${job.waitTicks} ticks)`, {
          jobId: job.id,
          priority: job.priority,
          effectivePriority: job.effectivePriority,
          waitTicks: job.waitTicks,
        });
      }
    }
    const pending = this.jobs
      .filter((j) => j.status === 'PENDING')
      .sort((a, b) => (b.effectivePriority !== a.effectivePriority ? b.effectivePriority - a.effectivePriority : a.createdAtTick !== b.createdAtTick ? a.createdAtTick - b.createdAtTick : a.id < b.id ? -1 : 1));

    for (const job of pending) {
      const shelf = this.shelf(job.shelfId);
      if (!shelf || shelf.state !== 'available') {
        if (job.status === 'PENDING') {
          job.status = 'WAITING_SHELF';
          job.note = `shelf ${job.shelfId} is currently being transported`;
          this.emit('JOB_QUEUED_SHELF', `job ${job.id} waits: shelf ${job.shelfId} is in transit`, { jobId: job.id, shelfId: job.shelfId });
        }
        continue;
      }
      const idle = this.robots.filter((r) => r.status === 'IDLE' && !r.jobId);
      if (idle.length === 0) break;
      const candidates = this.pickupCandidates(shelf);
      const scored = idle
        .map((r) => {
          const dist = Math.min(...candidates.map((c) => manhattan(this.idx(r.x, r.y), c, this.warehouse.width)));
          return { robot: r, dist, queued: r.waitTicks };
        })
        .sort((a, b) => (a.dist !== b.dist ? a.dist - b.dist : a.robot.id < b.robot.id ? -1 : 1));
      const winner = scored[0].robot;
      this.assign(winner, job);
    }
  }

  assign(robot, job) {
    job.status = 'ASSIGNED';
    job.robotId = robot.id;
    job.assignedTick = this.tick;
    job.effectivePriority = this.jobEffectivePriority(job);
    robot.jobId = job.id;
    robot.status = 'ASSIGNED';
    robot.waitTicks = 0;
    robot.waiting = null;
    const shelf = this.shelf(job.shelfId);
    if (shelf) shelf.state = 'reserved';
    this.dirty.add(robot.id);
    this.emit('JOB_ASSIGNED', `job ${job.id} -> ${robot.label} (priority ${job.priority} ${PRIORITY_NAMES[job.priority] ?? ''}, shelf ${job.shelfId} -> ${job.workstationId})`, {
      jobId: job.id,
      robotId: robot.id,
      priority: job.priority,
      effectivePriority: job.effectivePriority,
      shelfId: job.shelfId,
      workstationId: job.workstationId,
    });
  }

  createJob({ shelfId, workstationId, priority = 2, note = null }) {
    const shelf = this.shelf(shelfId);
    if (!shelf) return { error: `unknown shelf ${shelfId}` };
    const ws = this.workstation(workstationId);
    if (!ws) return { error: `unknown workstation ${workstationId}` };
    const p = Math.max(1, Math.min(5, Math.round(Number(priority) || 2)));
    const active = this.jobs.find((j) => j.shelfId === shelfId && j.status !== 'DONE');
    if (active) return { error: `shelf ${shelfId} is already claimed by job ${active.id}` };
    const job = {
      id: `JOB-${String(++this.jobSeq).padStart(3, '0')}`,
      shelfId,
      workstationId,
      priority: p,
      effectivePriority: p,
      status: 'PENDING',
      robotId: null,
      createdAtTick: this.tick,
      assignedTick: null,
      pickedTick: null,
      completedTick: null,
      waitTicks: 0,
      note,
    };
    this.jobs.push(job);
    this.stats.jobsCreated += 1;
    this.emit('JOB_CREATED', `job ${job.id}: shelf ${shelfId} -> ${ws.id} (priority ${p} ${PRIORITY_NAMES[p] ?? ''})`, {
      job,
      priority: p,
      shelfId,
      workstationId,
    });
    return { job };
  }

  // ------------------------------------------------------------------ map ---
  setBlocked(x, y, blocked) {
    if (x < 0 || y < 0 || x >= this.warehouse.width || y >= this.warehouse.height) return { error: 'cell out of bounds' };
    const cell = this.idx(x, y);
    if (!this.warehouse.isStaticTraversable(x, y)) return { error: `cell (${x},${y}) is a ${this.warehouse.cellName(cell)} and cannot be blocked` };
    const occupant = this.robotAt(cell);
    if (occupant && blocked) return { error: `cell (${x},${y}) is occupied by ${occupant.id}` };
    if (blocked) {
      if (this.blocked[cell]) return { ok: true, already: true };
      this.blocked[cell] = 1;
      this.blockedCells.add(cell);
      this.stats.blockedEvents += 1;
      this.emit('CELL_BLOCKED', `cell (${x},${y}) blocked — ${this.affectedRobots(cell).length} robot(s) must replan`, {
        x,
        y,
        cell,
        affected: this.affectedRobots(cell),
      });
    } else {
      if (!this.blocked[cell]) return { ok: true, already: true };
      this.blocked[cell] = 0;
      this.blockedCells.delete(cell);
      this.emit('CELL_UNBLOCKED', `cell (${x},${y}) unblocked — ${this.affectedRobots(cell).length} robot(s) may replan`, {
        x,
        y,
        cell,
        affected: this.affectedRobots(cell),
      });
    }
    // any robot whose reserved trajectory crosses the changed cell replans now
    this.forceGlobalReplan = 'map-change';
    for (const r of this.robots) {
      if (r.path && r.path.slice(Math.max(0, this.tick - r.pathStartTick)).includes(cell)) this.dirty.add(r.id);
    }
    return { ok: true };
  }

  affectedRobots(cell) {
    const affected = [];
    for (const r of this.robots) {
      const k = Math.max(0, this.tick - r.pathStartTick);
      if (r.path && r.path.slice(k, k + 80).includes(cell)) affected.push(r.id);
    }
    return affected;
  }

  /** Convenience for the acceptance scenario: block the cell a robot is about to enter. */
  blockAheadOf(robotId) {
    const robot = this.robots.find((r) => r.id === robotId);
    if (!robot) return { error: `unknown robot ${robotId}` };
    const next = this.pathCellAt(robot, this.tick + 1);
    if (next === null || next === this.idx(robot.x, robot.y)) {
      // robot is holding: pick the first step of its remaining path that is a move
      let k = Math.max(0, this.tick - robot.pathStartTick) + 1;
      const start = this.idx(robot.x, robot.y);
      while (k < robot.path.length && robot.path[k] === start) k += 1;
      if (k >= robot.path.length) return { error: `${robotId} has no planned cell ahead (it is parked)` };
      const { x, y } = this.xy(robot.path[k]);
      const res = this.setBlocked(x, y, true);
      return { ...res, x, y, robotId };
    }
    const { x, y } = this.xy(next);
    const res = this.setBlocked(x, y, true);
    return { ...res, x, y, robotId };
  }

  // ------------------------------------------------------------------ loop ---
  tickOnce() {
    if (this.paused) return { skipped: true };
    // `planBase` is the time-stamp of the *current* robot positions: the step
    // executed during this tick moves every robot from `planBase` to `planBase + 1`.
    // `this.tick` is the world clock at the end of the step, so events and paths
    // always share one consistent time base.
    const base = this.tick;
    this.planBase = base;
    this.tick = base + 1;
    const started = Date.now();

    this.assignJobs();

    let replanReason = null;
    if (this.forceGlobalReplan) {
      replanReason = this.forceGlobalReplan;
      this.forceGlobalReplan = null;
    } else if (this.dirty && this.dirty.size > 0) {
      replanReason = 'dirty-robots';
    } else if (this.tick % GLOBAL_REPLAN_INTERVAL === 0) {
      replanReason = 'periodic';
    }
    if (replanReason) this.replanAll(replanReason);

    const { movedCount, waitingCount } = this.applyMoves();
    this.postMove();
    this.detectDeadlock();

    this.emit('TICK', `t=${this.tick} moving=${movedCount} waiting=${waitingCount}`, {
      tick: this.tick,
      moving: movedCount,
      waiting: waitingCount,
      paused: this.paused,
      robots: this.robots.map((r) => ({
        id: r.id,
        x: r.x,
        y: r.y,
        status: r.status,
        jobId: r.jobId,
        carrying: r.carrying,
        waitTicks: r.waitTicks,
        waitingReason: r.waiting?.reason ?? r.planWaitReason?.reason ?? null,
        waitingDetail: r.waiting?.detail ?? r.planWaitReason?.detail ?? null,
      })),
      jobs: {
        pending: this.jobs.filter((j) => j.status === 'PENDING' || j.status === 'WAITING_SHELF').length,
        active: this.jobs.filter((j) => j.status === 'ASSIGNED' || j.status === 'CARRYING').length,
        done: this.jobs.filter((j) => j.status === 'DONE').length,
      },
      durationMs: Date.now() - started,
      seq: this.eventSeq,
    });
  }

  step() {
    const wasPaused = this.paused;
    this.paused = false;
    const result = this.tickOnce();
    this.paused = true;
    this.emit('SIM_STEP', `single step executed (tick ${this.tick})`, { tick: this.tick, wasPaused });
    return result;
  }

  pause() {
    if (this.paused) return { ok: true, already: true };
    this.paused = true;
    this.emit('SIM_PAUSED', `simulation paused at tick ${this.tick}`, { tick: this.tick });
    return { ok: true };
  }

  resume() {
    if (!this.paused) return { ok: true, already: true };
    this.paused = false;
    this.emit('SIM_RESUMED', `simulation resumed at tick ${this.tick}`, { tick: this.tick });
    return { ok: true };
  }

  setTps(tps) {
    const v = Math.max(0.5, Math.min(30, Number(tps) || this.tps));
    this.tps = v;
    this.emit('SIM_SPEED', `simulation speed set to ${v} ticks/s`, { tps: v });
    return { ok: true, tps: v };
  }

  // ----------------------------------------------------------- serialisation ---
  encodePath(robot, limit = 96, base = this.tick) {
    const from = Math.max(0, base - robot.pathStartTick);
    const out = [];
    for (let k = from; k < robot.path.length; k++) {
      const pair = this.xyPair(robot.path[k]);
      const last = out[out.length - 1];
      const prev = out[out.length - 2];
      // the trajectory is padded with a "hold" to the planning horizon: collapse a
      // long stationary tail (but keep one repeated cell so a planned wait is visible)
      if (last && prev && last[0] === pair[0] && last[1] === pair[1] && prev[0] === pair[0] && prev[1] === pair[1]) break;
      out.push(pair);
      if (out.length >= limit) break;
    }
    return out;
  }

  snapshot() {
    return {
      seq: this.eventSeq,
      tick: this.tick,
      paused: this.paused,
      seed: this.seed,
      tps: this.tps,
      stats: { ...this.stats, pending: this.jobs.filter((j) => j.status === 'PENDING' || j.status === 'WAITING_SHELF').length, active: this.jobs.filter((j) => j.status === 'ASSIGNED' || j.status === 'CARRYING').length, done: this.jobs.filter((j) => j.status === 'DONE').length },
      robots: this.robots.map((r) => ({
        id: r.id,
        label: r.label,
        x: r.x,
        y: r.y,
        home: r.home,
        status: r.status,
        jobId: r.jobId,
        carrying: r.carrying,
        waitTicks: r.waitTicks,
        moves: r.moves,
        replanCount: r.replanCount,
        waiting: r.waiting,
        waitingReason: r.waiting?.reason ?? r.planWaitReason?.reason ?? null,
        waitingDetail: r.waiting?.detail ?? r.planWaitReason?.detail ?? null,
        path: this.encodePath(r),
        pathStartTick: r.pathStartTick,
      })),
      jobs: this.jobs.map((j) => ({ ...j })),
      blocked: [...this.blockedCells].map((c) => this.xyPair(c)),
    };
  }

  config() {
    const wh = this.warehouse;
    return {
      width: wh.width,
      height: wh.height,
      grid: Array.from(wh.grid),
      shelves: wh.shelves.map((s) => ({ id: s.id, label: s.label, x: s.x, y: s.y, w: s.w, h: s.h, cells: s.cells.map((c) => this.xy(c)), pickup: this.xyPair(s.pickup), state: s.state })),
      workstations: wh.workstations.map((w) => ({ id: w.id, label: w.label, x: w.x, y: w.y })),
      lanes: wh.lanes.map((l) => ({ id: l.id, axis: l.axis, x: l.x, name: l.name, cells: l.cells.map((c) => this.xyPair(c)) })),
      robots: this.robots.map((r) => ({ id: r.id, label: r.label, home: this.xyPair(r.home) })),
      priorities: PRIORITY_NAMES,
      limits: {
        horizon: PLAN_HORIZON,
        globalReplanInterval: GLOBAL_REPLAN_INTERVAL,
        jobAgingTicks: JOB_AGING_TICKS,
        deadlockNoMoveTicks: DEADLOCK_NO_MOVE_TICKS,
        deadlockWaitTicks: DEADLOCK_WAIT_TICKS,
      },
    };
  }

  serialize() {
    return {
      version: 1,
      seed: this.seed,
      tick: this.tick,
      paused: this.paused,
      tps: this.tps,
      eventSeq: this.eventSeq,
      jobSeq: this.jobSeq,
      rngState: this.rngState,
      jobs: this.jobs,
      blocked: [...this.blockedCells],
      stats: this.stats,
      events: this.events.slice(-250),
      robots: this.robots.map((r) => ({
        id: r.id,
        x: r.x,
        y: r.y,
        status: r.status,
        jobId: r.jobId,
        carrying: r.carrying,
        path: Array.from(r.path ?? []),
        pathStartTick: r.pathStartTick,
        waitTicks: r.waitTicks,
        moves: r.moves,
        replanCount: r.replanCount,
        waiting: r.waiting,
      })),
    };
  }

  static fromSerialized(data, options = {}) {
    const engine = new Engine({ seed: data.seed ?? options.seed ?? 7, tps: data.tps ?? 4 });
    engine.tick = data.tick ?? 0;
    engine.paused = data.paused ?? true;
    engine.eventSeq = data.eventSeq ?? 0;
    engine.jobSeq = data.jobSeq ?? 0;
    engine.rngState = data.rngState ?? engine.seed;
    engine.jobs = Array.isArray(data.jobs) ? data.jobs : [];
    engine.stats = { ...engine.stats, ...(data.stats ?? {}) };
    engine.events = Array.isArray(data.events) ? data.events.slice(-MAX_EVENTS) : [];
    engine.blocked = new Uint8Array(engine.N);
    engine.blockedCells = new Set();
    for (const cell of data.blocked ?? []) {
      if (cell >= 0 && cell < engine.N && engine.warehouse.isStaticTraversable(cell % engine.warehouse.width, Math.floor(cell / engine.warehouse.width))) {
        engine.blocked[cell] = 1;
        engine.blockedCells.add(cell);
      }
    }
    for (const saved of data.robots ?? []) {
      const robot = engine.robots.find((r) => r.id === saved.id);
      if (!robot) continue;
      robot.x = saved.x;
      robot.y = saved.y;
      robot.status = saved.status;
      robot.jobId = saved.jobId;
      robot.carrying = saved.carrying;
      robot.path = Array.isArray(saved.path) && saved.path.length > 0 ? saved.path : [engine.idx(saved.x, saved.y)];
      robot.pathStartTick = saved.pathStartTick ?? engine.tick;
      robot.waitTicks = saved.waitTicks ?? 0;
      robot.moves = saved.moves ?? 0;
      robot.replanCount = saved.replanCount ?? 0;
      robot.waiting = saved.waiting ?? null;
    }
    // shelf ownership is derived from the restored jobs
    for (const shelf of engine.warehouse.shelves) shelf.state = 'available';
    for (const job of engine.jobs) {
      if (job.status === 'DONE') continue;
      const shelf = engine.shelf(job.shelfId);
      if (!shelf) continue;
      shelf.state = job.status === 'CARRYING' ? 'in_transit' : job.status === 'ASSIGNED' ? 'reserved' : shelf.state;
    }
    if (engine.paused) engine.paused = true;
    engine.forceGlobalReplan = 'restore-snapshot';
    return engine;
  }
}
