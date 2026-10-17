import {
  ROBOT_BLUEPRINTS,
  cellKey,
  findNarrowCorridors,
  generateWarehouse,
  isStaticTraversable,
  manhattan,
  mulberry32,
  shuffleSeeded,
} from './warehouse.js';
import { ReservationTable, findSpaceTimePath, staticDistance } from './pathfinding.js';

export const AGING_TICKS = 32;
export const ROUTE_HORIZON = 190;
export const EVENT_LIMIT = 320;
export const PRIORITY_LABELS = { 1: 'LOW', 2: 'NORMAL', 3: 'HIGH' };
const PLAN_HORIZON = ROUTE_HORIZON;
const MAX_SEED = 0xffffffff;

const nowIso = () => new Date().toISOString();
const numericId = (id) => Number(String(id).replace(/[^0-9]/g, '')) || 0;
const seededJobs = (warehouse) => {
  const random = mulberry32((warehouse.seed ^ 0x51ed270b) >>> 0);
  const shelves = shuffleSeeded(warehouse.shelves, random);
  const stations = shuffleSeeded(warehouse.workstations, random);
  return [
    { shelf: shelves[0], station: stations[0], priority: 3 },
    { shelf: shelves[1], station: stations[1], priority: 2 },
    { shelf: shelves[2], station: stations[2], priority: 1 },
  ];
};

function robotRecord(blueprint) {
  return {
    id: blueprint.id,
    name: blueprint.name,
    color: blueprint.color,
    home: { ...blueprint.home },
    x: blueprint.home.x,
    y: blueprint.home.y,
    status: 'idle',
    jobId: null,
    carryingShelf: null,
    waiting: false,
    waitReason: null,
    waitCode: null,
    waitingOn: null,
    route: [],
    routeGoal: null,
    heading: 'E',
    completedJobs: 0,
    distanceTravelled: 0,
    consecutiveWaitTicks: 0,
    lastMoveTick: null,
    lastWaitLogReason: null,
  };
}

export class WarehouseSimulation {
  constructor({ seed = 20261017, restore = null } = {}) {
    this.seed = this.normalizeSeed(seed);
    this.seq = 0;
    this.tick = 0;
    this.running = true;
    this.runId = `RUN-${this.seed}`;
    this.onUpdate = null;
    this.eventCounter = 0;
    this.nextJobNumber = 1001;
    this.warehouse = generateWarehouse(this.seed);
    this.blocked = new Set();
    this.robots = [];
    this.jobs = [];
    this.events = [];
    this.counters = {};
    this._planOrder = [];

    if (restore) {
      this.hydrate(restore);
      this.planAll();
    } else {
      const initialEvents = this.initializeRun(this.seed, true);
      this.seq = 1;
      this.appendEvents(initialEvents);
      this.persistableSnapshot();
    }
  }

  normalizeSeed(seed) {
    const number = Number(seed);
    if (!Number.isInteger(number) || number < 0 || number > MAX_SEED) {
      throw new Error('Seed must be an integer between 0 and 4294967295.');
    }
    return number >>> 0;
  }

  initializeRun(seed, running) {
    this.seed = this.normalizeSeed(seed);
    this.warehouse = generateWarehouse(this.seed);
    this.tick = 0;
    this.running = running;
    this.runId = `RUN-${this.seed}-${Date.now().toString(36).toUpperCase()}`;
    this.nextJobNumber = 1001;
    this.blocked = new Set();
    this.jobs = [];
    this.events = [];
    this.eventCounter = 0;
    this.robots = ROBOT_BLUEPRINTS.map(robotRecord);
    this.counters = {
      replans: 0,
      waits: 0,
      safetyHolds: 0,
      aisleLocks: 0,
      jobsCreated: 0,
      jobsCompleted: 0,
      ticksRun: 0,
      noRoute: 0,
    };

    const events = [];
    this.push(events, 'system', `Warehouse topology generated — ${this.warehouse.width}×${this.warehouse.height} grid, seed ${this.seed}.`);
    this.push(events, 'system', 'Fleet online — 8 robots · 20 shelves · 4 workstations · 4 one-cell bottlenecks.');
    for (const spec of seededJobs(this.warehouse)) {
      const job = this.addJobRaw(spec.shelf, spec.station, spec.priority);
      this.push(events, 'job', `${job.id} queued from seed — ${job.shelfId} → ${job.workstationId} · ${PRIORITY_LABELS[job.priority]}.`, {
        jobId: job.id,
      });
    }
    this.assignQueuedJobs(events);
    this.planAll();
    this.push(
      events,
      'control',
      running ? 'Simulation running. Scheduler active.' : 'Run initialised at tick 0. Simulation paused.',
      { severity: 'info' },
    );
    return events;
  }

  hydrate(saved) {
    const seed = this.normalizeSeed(saved.seed ?? this.seed);
    this.seed = seed;
    this.warehouse = generateWarehouse(seed);
    this.seq = Number.isInteger(saved.seq) ? saved.seq : 1;
    this.tick = Number.isInteger(saved.tick) ? saved.tick : 0;
    this.running = Boolean(saved.running);
    this.runId = saved.runId ?? `RUN-${seed}`;
    this.nextJobNumber = Number.isInteger(saved.nextJobNumber) ? saved.nextJobNumber : 1001;
    this.eventCounter = Number.isInteger(saved.eventCounter) ? saved.eventCounter : 0;
    this.jobs = Array.isArray(saved.jobs) ? saved.jobs : [];
    this.events = Array.isArray(saved.events) ? saved.events.slice(-EVENT_LIMIT) : [];
    this.counters = {
      replans: 0,
      waits: 0,
      safetyHolds: 0,
      aisleLocks: 0,
      jobsCreated: 0,
      jobsCompleted: 0,
      ticksRun: 0,
      noRoute: 0,
      ...(saved.counters ?? {}),
    };
    this.blocked = new Set(
      Array.isArray(saved.blockedKeys)
        ? saved.blockedKeys.filter((key) => typeof key === 'string')
        : Array.isArray(saved.blocked)
          ? saved.blocked.map((cell) => cellKey(cell.x, cell.y))
          : [],
    );

    const savedRobots = new Map((saved.robots ?? []).map((robot) => [robot.id, robot]));
    this.robots = ROBOT_BLUEPRINTS.map((blueprint) => {
      const base = robotRecord(blueprint);
      const incoming = savedRobots.get(blueprint.id);
      if (!incoming) return base;
      const x = Number.isInteger(incoming.x) ? incoming.x : base.x;
      const y = Number.isInteger(incoming.y) ? incoming.y : base.y;
      return {
        ...base,
        x,
        y,
        status: ['idle', 'to_pickup', 'loaded', 'returning'].includes(incoming.status)
          ? incoming.status
          : 'idle',
        jobId: incoming.jobId ?? null,
        carryingShelf: incoming.carryingShelf ?? null,
        completedJobs: Number(incoming.completedJobs) || 0,
        distanceTravelled: Number(incoming.distanceTravelled) || 0,
        lastMoveTick: incoming.lastMoveTick ?? null,
      };
    });

    for (const robot of this.robots) {
      const job = this.jobs.find((candidate) => candidate.id === robot.jobId);
      if (robot.status !== 'idle' && !job) {
        robot.status = robot.x === robot.home.x && robot.y === robot.home.y ? 'idle' : 'returning';
        robot.jobId = null;
      }
      if (robot.status === 'idle') robot.jobId = null;
    }
    this.workersAssignedFromJobs();
    for (const job of this.jobs) {
      if (!job.createdAt) job.createdAt = nowIso();
      if (job.waitTicks == null) job.waitTicks = Math.max(0, this.tick - (job.createdAtTick ?? 0));
    }
  }

  workersAssignedFromJobs() {
    for (const job of this.jobs) {
      if ((job.status === 'assigned' || job.status === 'loaded') && job.robotId) {
        const robot = this.robots.find((candidate) => candidate.id === job.robotId);
        if (robot) {
          robot.jobId = job.id;
          robot.status = job.status === 'loaded' ? 'loaded' : 'to_pickup';
          robot.carryingShelf = job.status === 'loaded' ? job.shelfId : null;
        }
      }
    }
  }

  addJobRaw(shelf, station, priority) {
    const job = {
      id: `J${this.nextJobNumber++}`,
      shelfId: shelf.id,
      shelf: { x: shelf.x, y: shelf.y },
      pickup: { ...shelf.pickup },
      workstationId: station.id,
      workstationName: station.name,
      destination: { x: station.x, y: station.y },
      priority,
      priorityLabel: PRIORITY_LABELS[priority],
      status: 'queued',
      phase: 'pickup',
      robotId: null,
      createdAt: nowIso(),
      createdAtTick: this.tick,
      assignedAtTick: null,
      pickedAtTick: null,
      completedAtTick: null,
      waitTicks: 0,
      queueWaitTicks: null,
      aged: false,
      agingFlagged: false,
      reason: 'Awaiting a free robot.',
    };
    this.jobs.push(job);
    this.counters.jobsCreated += 1;
    return job;
  }

  push(events, type, message, extra = {}) {
    events.push({
      type,
      message,
      at: nowIso(),
      ...extra,
    });
  }

  appendEvents(events) {
    for (const event of events) {
      this.events.push({
        id: `E-${this.seq}-${this.eventCounter++}`,
        seq: this.seq,
        tick: this.tick,
        at: event.at ?? nowIso(),
        type: event.type ?? 'system',
        message: event.message,
        severity: event.severity ?? event.type ?? 'info',
        robotId: event.robotId ?? null,
        jobId: event.jobId ?? null,
      });
    }
    if (this.events.length > EVENT_LIMIT) this.events = this.events.slice(-EVENT_LIMIT);
  }

  commit(events = []) {
    this.seq += 1;
    this.appendEvents(events);
    this.updatedAt = nowIso();
    const snapshot = this.snapshot();
    this.onUpdate?.(snapshot);
    return snapshot;
  }

  getJob(jobId) {
    return this.jobs.find((job) => job.id === jobId) ?? null;
  }

  getRobot(robotId) {
    return this.robots.find((robot) => robot.id === robotId) ?? null;
  }

  isOpenLive(x, y) {
    return isStaticTraversable(this.warehouse, x, y) && !this.blocked.has(cellKey(x, y));
  }

  isOpenForDispatch(x, y) {
    return this.isOpenLive(x, y);
  }

  robotGoal(robot) {
    if (robot.status === 'to_pickup') {
      const job = this.getJob(robot.jobId);
      return job
        ? {
            point: job.pickup,
            label: `pickup ${job.shelfId}`,
            kind: 'pickup',
            job,
          }
        : null;
    }
    if (robot.status === 'loaded') {
      const job = this.getJob(robot.jobId);
      return job
        ? {
            point: job.destination,
            label: job.workstationId,
            kind: 'dropoff',
            job,
          }
        : null;
    }
    if (robot.status === 'returning') {
      return { point: robot.home, label: 'home bay', kind: 'home', job: null };
    }
    return null;
  }

  queuedSort(a, b) {
    const boostedA = a.waitTicks >= AGING_TICKS ? 1 : 0;
    const boostedB = b.waitTicks >= AGING_TICKS ? 1 : 0;
    if (boostedA !== boostedB) return boostedB - boostedA;
    if (a.priority !== b.priority) return b.priority - a.priority;
    if (a.waitTicks !== b.waitTicks) return b.waitTicks - a.waitTicks;
    if (a.createdAtTick !== b.createdAtTick) return a.createdAtTick - b.createdAtTick;
    return numericId(a.id) - numericId(b.id);
  }

  updateQueuedAging(events) {
    for (const job of this.jobs) {
      if (job.status !== 'queued') continue;
      job.waitTicks = Math.max(0, this.tick - job.createdAtTick);
      job.aged = job.waitTicks >= AGING_TICKS;
      if (job.aged && !job.agingFlagged) {
        job.agingFlagged = true;
        this.push(
          events,
          'aging',
          `${job.id} crossed the ${AGING_TICKS}-tick aging threshold — starvation safeguard applied; it now outranks fresh work.`,
          { jobId: job.id, severity: 'warning' },
        );
      }
    }
  }

  setQueuedReasons() {
    for (const job of this.jobs) {
      if (job.status !== 'queued') continue;
      const pickupOpen = this.isOpenForDispatch(job.pickup.x, job.pickup.y);
      const stationOpen = this.isOpenForDispatch(job.destination.x, job.destination.y);
      if (!pickupOpen) job.reason = `Pickup bay (${job.pickup.x},${job.pickup.y}) is blocked.`;
      else if (!stationOpen) job.reason = `${job.workstationId} dock is blocked.`;
      else if (this.robots.every((robot) => robot.status !== 'idle')) job.reason = 'Awaiting a free robot.';
      else job.reason = 'Awaiting dispatch.';
    }
  }

  assignQueuedJobs(events) {
    const idleRobots = this.robots.filter((robot) => robot.status === 'idle');
    const queued = this.jobs.filter((job) => job.status === 'queued').sort((a, b) => this.queuedSort(a, b));

    for (const job of queued) {
      if (idleRobots.length === 0) break;
      if (!this.isOpenForDispatch(job.pickup.x, job.pickup.y)) {
        job.reason = `Pickup bay (${job.pickup.x},${job.pickup.y}) is blocked.`;
        continue;
      }
      if (!this.isOpenForDispatch(job.destination.x, job.destination.y)) {
        job.reason = `${job.workstationId} dock is blocked.`;
        continue;
      }

      let best = null;
      for (const robot of idleRobots) {
        const distance = staticDistance({
          width: this.warehouse.width,
          height: this.warehouse.height,
          start: { x: robot.x, y: robot.y },
          goal: job.pickup,
          isOpen: (x, y) => this.isOpenForDispatch(x, y),
        });
        if (!Number.isFinite(distance)) continue;
        if (
          !best ||
          distance < best.distance ||
          (distance === best.distance && numericId(robot.id) < numericId(best.robot.id))
        ) {
          best = { robot, distance };
        }
      }

      if (!best) {
        job.reason = 'No traversable route from a free robot to the pickup bay.';
        continue;
      }

      const robot = best.robot;
      const index = idleRobots.findIndex((candidate) => candidate.id === robot.id);
      if (index >= 0) idleRobots.splice(index, 1);
      job.status = 'assigned';
      job.phase = 'pickup';
      job.robotId = robot.id;
      job.assignedAtTick = this.tick;
      job.queueWaitTicks = Math.max(0, this.tick - job.createdAtTick);
      job.reason = `Assigned to ${robot.id}.`;
      robot.status = 'to_pickup';
      robot.jobId = job.id;
      robot.waiting = false;
      robot.waitReason = null;
      robot.waitCode = null;
      robot.waitingOn = null;
      robot.carryingShelf = null;
      robot.routeGoal = {
        kind: 'pickup',
        label: `pickup ${job.shelfId}`,
        point: { ...job.pickup },
      };
      robot.lastWaitLogReason = null;
      const boosted = job.waitTicks >= AGING_TICKS ? ' · aged priority' : '';
      this.push(
        events,
        'dispatch',
        `${robot.id} ${robot.name} dispatched to ${job.id} · ${PRIORITY_LABELS[job.priority]}${boosted} · ${job.shelfId} → ${job.workstationId} (waited ${job.waitTicks}t).`,
        { robotId: robot.id, jobId: job.id, severity: 'success' },
      );
    }

    this.setQueuedReasons();
  }

  handleArrivals(events) {
    for (const robot of this.robots) {
      if (robot.status === 'to_pickup') {
        const job = this.getJob(robot.jobId);
        if (!job) {
          robot.status = robot.x === robot.home.x && robot.y === robot.home.y ? 'idle' : 'returning';
          robot.jobId = null;
          continue;
        }
        if (robot.x === job.pickup.x && robot.y === job.pickup.y) {
          job.status = 'loaded';
          job.phase = 'dropoff';
          job.pickedAtTick = this.tick;
          job.reason = `Loaded at ${job.shelfId}. Routing to ${job.workstationId}.`;
          robot.status = 'loaded';
          robot.carryingShelf = job.shelfId;
          this.push(
            events,
            'pickup',
            `${robot.id} confirmed pickup of ${job.shelfId} for ${job.id} — now routing to ${job.workstationId}.`,
            { robotId: robot.id, jobId: job.id, severity: 'success' },
          );
        }
      } else if (robot.status === 'loaded') {
        const job = this.getJob(robot.jobId);
        if (!job) {
          robot.status = 'returning';
          robot.jobId = null;
          robot.carryingShelf = null;
          continue;
        }
        if (robot.x === job.destination.x && robot.y === job.destination.y) {
          job.status = 'completed';
          job.phase = 'done';
          job.completedAtTick = this.tick;
          job.reason = 'Delivered.';
          this.counters.jobsCompleted += 1;
          robot.completedJobs += 1;
          robot.jobId = null;
          robot.carryingShelf = null;
          robot.status = 'returning';
          robot.routeGoal = { kind: 'home', label: 'home bay', point: { ...robot.home } };
          this.push(
            events,
            'delivery',
            `${robot.id} delivered ${job.id} to ${job.workstationId} — task complete in ${this.tick - job.createdAtTick} ticks. Returning to bay.`,
            { robotId: robot.id, jobId: job.id, severity: 'success' },
          );
        }
      } else if (robot.status === 'returning' && robot.x === robot.home.x && robot.y === robot.home.y) {
        if (robot.waiting || robot.route.length > 1) {
          this.push(events, 'robot', `${robot.id} docked at home bay (${robot.x},${robot.y}) and is available.`, {
            robotId: robot.id,
          });
        }
        robot.status = 'idle';
        robot.route = [];
        robot.routeGoal = null;
        robot.waiting = false;
        robot.waitReason = null;
        robot.waitCode = null;
        robot.waitingOn = null;
        robot.lastWaitLogReason = null;
      }
    }
  }

  activeRobots() {
    return this.robots.filter((robot) => robot.status !== 'idle');
  }

  planAll() {
    const corridors = findNarrowCorridors(this.warehouse, this.blocked);
    const active = this.activeRobots();
    const idleCells = this.robots
      .filter((robot) => robot.status === 'idle')
      .map((robot) => ({ x: robot.x, y: robot.y }));

    const priorityOf = (robot) => {
      if (robot.status === 'to_pickup' || robot.status === 'loaded') {
        return this.getJob(robot.jobId)?.priority ?? 0;
      }
      return 0;
    };
    const waitOf = (robot) => this.getJob(robot.jobId)?.waitTicks ?? 0;

    const startCorridor = (robot) => corridors.byCell.get(cellKey(robot.x, robot.y)) ?? null;
    const ordered = [...active].sort((a, b) => {
      const aInside = startCorridor(a) ? 1 : 0;
      const bInside = startCorridor(b) ? 1 : 0;
      if (aInside !== bInside) return bInside - aInside;
      const priorityDiff = priorityOf(b) - priorityOf(a);
      if (priorityDiff !== 0) return priorityDiff;
      const waitDiff = waitOf(b) - waitOf(a);
      if (waitDiff !== 0) return waitDiff;
      return numericId(a.id) - numericId(b.id);
    });

    const reservations = new ReservationTable(this.warehouse.width);
    for (const robot of this.robots) {
      reservations.reserve(robot.x, robot.y, 0, robot.id, 'start');
    }

    const lockedCorridors = new Map();
    for (const robot of this.robots) {
      const corridor = startCorridor(robot);
      if (corridor && !lockedCorridors.has(corridor.id)) {
        lockedCorridors.set(corridor.id, robot.id);
      }
    }

    const blockedByUser = this.blocked;
    const idleCellKeys = new Set(idleCells.map((cell) => cellKey(cell.x, cell.y)));
    const corridorMeta = new Map(corridors.groups.map((group) => [group.id, group]));
    this._planOrder = ordered.map((robot) => robot.id);

    for (const robot of active) {
      for (const field of [
        'route',
        'waiting',
        'waitReason',
        'waitCode',
        'waitingOn',
        'heading',
      ]) {
        robot[field] = field === 'route' ? [] : null;
      }
      robot.waiting = false;
    }

    for (const robot of ordered) {
      const goalInfo = this.robotGoal(robot);
      if (!goalInfo) {
        robot.status = robot.x === robot.home.x && robot.y === robot.home.y ? 'idle' : 'returning';
        robot.route = [];
        robot.waiting = false;
        continue;
      }
      const goal = goalInfo.point;
      const forbidden = new Set();
      for (const [corridorId, ownerId] of lockedCorridors) {
        if (ownerId === robot.id) continue;
        const group = corridorMeta.get(corridorId);
        for (const cell of group.cells) forbidden.add(cellKey(cell.x, cell.y));
      }
      const hardBlocked = new Set(blockedByUser);
      for (const key of idleCellKeys) hardBlocked.add(key);

      const result = findSpaceTimePath({
        width: this.warehouse.width,
        height: this.warehouse.height,
        start: { x: robot.x, y: robot.y },
        goal,
        isOpen: (x, y) => isStaticTraversable(this.warehouse, x, y),
        blocked: hardBlocked,
        forbidden,
        reservations,
        robotId: robot.id,
        horizon: PLAN_HORIZON,
      });

      robot.routeGoal = {
        ...goalInfo,
        point: { ...goalInfo.point },
      };

      if (!result.path) {
        robot.route = [{ x: robot.x, y: robot.y, t: 0 }];
        robot.waiting = true;
        robot.waitCode = result.reason === 'GOAL_BLOCKED' ? 'OBSTACLE' : 'NO_ROUTE';
        const goalName =
          goalInfo.kind === 'pickup'
            ? `pickup bay (${goal.x},${goal.y})`
            : goalInfo.kind === 'dropoff'
              ? `${goalInfo.label} dock (${goal.x},${goal.y})`
              : `home bay (${goal.x},${goal.y})`;
        if (result.reason === 'GOAL_BLOCKED') {
          robot.waitReason = `${goalName} is blocked or closed — replanning suspended until it clears.`;
        } else if (forbidden.size > 0) {
          const owner = [...lockedCorridors.values()].find((id) => id !== robot.id);
          robot.waitingOn = owner ?? null;
          robot.waitReason = owner
            ? `No conflict-free route — narrow aisle reserved by ${owner}.`
            : 'No conflict-free route through the aisle network.';
          robot.waitCode = 'CORRIDOR';
        } else {
          robot.waitReason = `No conflict-free route to ${goalName} within ${PLAN_HORIZON} ticks.`;
        }
        this.counters.noRoute = (this.counters.noRoute ?? 0) + 1;
        continue;
      }

      // Reserve the entire visible route. This makes the displayed path a
      // concrete space-time claim, not just an eventually-valid static route.
      for (const step of result.path) {
        reservations.reserve(step.x, step.y, step.t, robot.id, 'route');
      }

      for (const step of result.path) {
        const corridor = corridors.byCell.get(cellKey(step.x, step.y));
        if (corridor && !lockedCorridors.has(corridor.id)) {
          lockedCorridors.set(corridor.id, robot.id);
          this.counters.aisleLocks += 1;
        }
      }

      robot.route = result.path;
      const waitingAtStart =
        result.path.length > 1 && result.path[1].x === robot.x && result.path[1].y === robot.y;
      robot.waiting = Boolean(waitingAtStart);
      if (waitingAtStart) {
        const explanation = this.explainWait(robot, goalInfo, {
          reservations,
          corridors,
          lockedCorridors,
          blocked: blockedByUser,
        });
        robot.waitReason = explanation.reason;
        robot.waitCode = explanation.code;
        robot.waitingOn = explanation.waitingOn;
      } else {
        robot.waitReason = null;
        robot.waitCode = null;
        robot.waitingOn = null;
      }
    }

    for (const robot of this.robots) {
      if (robot.status === 'idle') {
        robot.route = [];
        robot.routeGoal = null;
        robot.waiting = false;
        robot.waitReason = null;
        robot.waitCode = null;
        robot.waitingOn = null;
      }
    }
    this.counters.replans += 1;
    this.lastPlannedTick = this.tick;
    this.liveCorridorCount = corridors.groups.length;
  }

  explainWait(robot, goalInfo, { reservations, corridors, lockedCorridors, blocked }) {
    const directions = [
      { dx: 0, dy: -1, name: 'north' },
      { dx: 1, dy: 0, name: 'east' },
      { dx: 0, dy: 1, name: 'south' },
      { dx: -1, dy: 0, name: 'west' },
    ];
    const candidates = [];
    for (const dir of directions) {
      const nx = robot.x + dir.dx;
      const ny = robot.y + dir.dy;
      if (!isStaticTraversable(this.warehouse, nx, ny)) continue;
      if (blocked.has(cellKey(nx, ny)) && cellKey(nx, ny) !== cellKey(robot.x, robot.y)) {
        candidates.push({
          dir,
          reason: `Operator block ahead at (${nx},${ny}) — route is being rebuilt.`,
          code: 'OBSTACLE',
          holder: null,
        });
        continue;
      }
      const currentHolder = reservations.holder(nx, ny, 1) ?? reservations.holder(nx, ny, 0);
      if (currentHolder && currentHolder.robotId !== robot.id) {
        candidates.push({
          dir,
          reason: `Yielding to ${currentHolder.robotId} — cell (${nx},${ny}) is reserved for the next step.`,
          code: 'TRAFFIC',
          holder: currentHolder.robotId,
        });
        continue;
      }
      const corridor = corridors.byCell.get(cellKey(nx, ny));
      if (corridor && lockedCorridors.has(corridor.id) && lockedCorridors.get(corridor.id) !== robot.id) {
        candidates.push({
          dir,
          reason: `Holding at aisle entrance — ${corridor.id} is locked by ${lockedCorridors.get(corridor.id)}.`,
          code: 'CORRIDOR',
          holder: lockedCorridors.get(corridor.id),
        });
      }
    }

    if (candidates.length > 0) {
      const priority = (candidate) => {
        const goal = goalInfo.point;
        const targetX = robot.x + candidate.dir.dx;
        const targetY = robot.y + candidate.dir.dy;
        return manhattan({ x: targetX, y: targetY }, goal);
      };
      candidates.sort((a, b) => priority(a) - priority(b));
      const chosen = candidates[0];
      return { reason: chosen.reason, code: chosen.code, waitingOn: chosen.holder };
    }

    const lockedElsewhere = [...lockedCorridors.entries()].find(([, owner]) => owner !== robot.id);
    if (lockedElsewhere) {
      return {
        reason: `Holding for a safe time slot — ${lockedElsewhere[0]} is exclusively reserved by ${lockedElsewhere[1]}.`,
        code: 'CORRIDOR',
        waitingOn: lockedElsewhere[1],
      };
    }
    return {
      reason: 'Holding briefly for a conflict-free reservation window.',
      code: 'TRAFFIC',
      waitingOn: null,
    };
  }

  applyPlannedMoves(events) {
    const occupancy = new Map(this.robots.map((robot) => [cellKey(robot.x, robot.y), robot.id]));
    const active = this._planOrder
      .map((id) => this.getRobot(id))
      .filter((robot) => robot && robot.status !== 'idle');
    const intended = new Map();
    const accepted = new Map();

    for (const robot of active) {
      const next = robot.route[1];
      if (!next) continue;
      if (next.x === robot.x && next.y === robot.y) continue;
      intended.set(robot.id, { robot, next });
    }

    for (const robot of active) {
      const plan = intended.get(robot.id);
      if (!plan) continue;
      const targetKey = cellKey(plan.next.x, plan.next.y);
      const occupiedBy = occupancy.get(targetKey);
      if (occupiedBy && occupiedBy !== robot.id) {
        robot.waiting = true;
        robot.waitCode = 'SAFETY';
        robot.waitReason = `Safety interlock — ${occupiedBy} has not cleared (${plan.next.x},${plan.next.y}).`;
        robot.waitingOn = occupiedBy;
        robot.route = [{ x: robot.x, y: robot.y, t: 0 }];
        this.counters.safetyHolds += 1;
        this.push(
          events,
          'safety',
          `Safety interlock held ${robot.id} before (${plan.next.x},${plan.next.y}); ${occupiedBy} still occupies the cell.`,
          { robotId: robot.id, severity: 'warning' },
        );
        continue;
      }

      let conflict = null;
      for (const [otherId, otherPlan] of intended) {
        if (otherId === robot.id) continue;
        if (
          otherPlan.next.x === plan.next.x &&
          otherPlan.next.y === plan.next.y &&
          accepted.has(otherId)
        ) {
          conflict = `Cell (${plan.next.x},${plan.next.y}) already assigned to ${otherId} this tick.`;
          break;
        }
        // Explicit swap guard. The reservation planner already forbids this,
        // but this final authority check protects the actual simultaneous move.
        if (
          otherPlan.next.x === robot.x &&
          otherPlan.next.y === robot.y &&
          plan.next.x === otherPlan.robot.x &&
          plan.next.y === otherPlan.robot.y
        ) {
          conflict = `Opposite-direction swap with ${otherId} prevented.`;
          break;
        }
      }
      if (conflict) {
        robot.waiting = true;
        robot.waitCode = 'SAFETY';
        robot.waitReason = `Safety interlock — ${conflict}`;
        robot.route = [{ x: robot.x, y: robot.y, t: 0 }];
        this.counters.safetyHolds += 1;
        this.push(events, 'safety', `${robot.id} held: ${conflict}`, {
          robotId: robot.id,
          severity: 'warning',
        });
        continue;
      }
      accepted.set(robot.id, plan);
    }

    for (const robot of active) {
      const plan = accepted.get(robot.id);
      if (plan) {
        const dx = plan.next.x - robot.x;
        const dy = plan.next.y - robot.y;
        robot.heading = dx > 0 ? 'E' : dx < 0 ? 'W' : dy > 0 ? 'S' : 'N';
        robot.x = plan.next.x;
        robot.y = plan.next.y;
        robot.distanceTravelled += 1;
        robot.lastMoveTick = this.tick;
        robot.consecutiveWaitTicks = 0;
        robot.waiting = false;
        robot.waitReason = null;
        robot.waitCode = null;
        robot.waitingOn = null;
        robot.lastWaitLogReason = null;
        robot.route = robot.route.slice(1).map((step, index) => ({ ...step, t: index }));
        if (robot.route.length === 0) {
          robot.route = [{ x: robot.x, y: robot.y, t: 0 }];
        }
      } else {
        const next = robot.route[1];
        const stillScheduledWait = next && next.x === robot.x && next.y === robot.y;
        robot.consecutiveWaitTicks += 1;
        robot.waiting = true;
        if (!robot.waitReason) {
          robot.waitReason = stillScheduledWait
            ? 'Holding for a conflict-free time slot.'
            : 'No safe next move this tick.';
          robot.waitCode = robot.waitCode ?? 'TRAFFIC';
        }
        if (robot.route.length > 1) {
          robot.route = robot.route.slice(1).map((step, index) => ({ ...step, t: index }));
        }
        this.counters.waits += 1;
      }
    }

    const finalOccupancy = new Set();
    for (const robot of this.robots) {
      const key = cellKey(robot.x, robot.y);
      if (finalOccupancy.has(key)) {
        // This should be unreachable, but we surface and log it rather than
        // hiding an authoritative-state bug.
        this.counters.safetyHolds += 1;
        this.push(events, 'safety', `Critical: duplicate occupancy detected at (${robot.x},${robot.y}). Simulation halted.`, {
          severity: 'error',
          robotId: robot.id,
        });
        this.running = false;
      }
      finalOccupancy.add(key);
    }

    for (const job of this.jobs) {
      if (job.status !== 'assigned' && job.status !== 'loaded') continue;
      const robot = this.getRobot(job.robotId);
      if (!robot) continue;
      job.reason = robot.waiting
        ? robot.waitReason
        : robot.status === 'loaded'
          ? `En route to ${job.workstationId}.`
          : `En route to pickup ${job.shelfId}.`;
      job.waitCode = robot.waitCode ?? null;
    }

    this.logWaitChanges(events);
  }

  logWaitChanges(events) {
    for (const robot of this.robots) {
      if (!robot.waiting) {
        robot.lastWaitLogReason = null;
        continue;
      }
      const reason = robot.waitReason ?? 'Holding.';
      if (reason !== robot.lastWaitLogReason) {
        this.push(events, 'wait', `${robot.id} holding — ${reason}`, {
          robotId: robot.id,
          jobId: robot.jobId,
          severity: 'warning',
        });
        robot.lastWaitLogReason = reason;
      }
    }
  }

  advanceTick({ manual = false } = {}) {
    const events = [];
    this.tick += 1;
    this.counters.ticksRun = (this.counters.ticksRun ?? 0) + 1;
    if (manual) {
      this.push(events, 'control', `Manual single step executed — advanced to tick ${this.tick}.`, { severity: 'info' });
    }
    this.updateQueuedAging(events);
    this.handleArrivals(events);
    this.assignQueuedJobs(events);
    this.planAll();
    this.applyPlannedMoves(events);
    this.setQueuedReasons();
    return this.commit(events);
  }

  pause() {
    if (!this.running) return this.snapshot();
    this.running = false;
    return this.commit([
      {
        type: 'control',
        message: 'Simulation paused by operator. State remains authoritative.',
        severity: 'info',
      },
    ]);
  }

  resume() {
    if (this.running) return this.snapshot();
    this.running = true;
    return this.commit([
      {
        type: 'control',
        message: 'Simulation resumed by operator.',
        severity: 'success',
      },
    ]);
  }

  step() {
    this.running = false;
    return this.advanceTick({ manual: true });
  }

  reset(seed = this.seed) {
    const nextSeed = this.normalizeSeed(seed);
    const events = this.initializeRun(nextSeed, false);
    this.push(events, 'control', `Run reset with seed ${nextSeed}. Cleared map edits and jobs. State paused at tick 0.`, {
      severity: 'warning',
    });
    return this.commit(events);
  }

  createJob({ shelfId, workstationId, priority = 2 }) {
    const shelf = this.warehouse.shelves.find((candidate) => candidate.id === shelfId);
    const station = this.warehouse.workstations.find((candidate) => candidate.id === workstationId);
    const level = Number(priority);
    if (!shelf) throw new Error('Unknown shelf.');
    if (!station) throw new Error('Unknown workstation.');
    if (!Number.isInteger(level) || level < 1 || level > 3) {
      throw new Error('Priority must be 1 (low), 2 (normal), or 3 (high).');
    }
    const job = this.addJobRaw(shelf, station, level);
    const events = [];
    this.push(
      events,
      'job',
      `${job.id} created by operator — ${job.shelfId} → ${job.workstationId} · ${PRIORITY_LABELS[level]}.`,
      { jobId: job.id, severity: 'info' },
    );
    this.assignQueuedJobs(events);
    this.planAll();
    this.logWaitChanges(events);
    this.commit(events);
    return this.getJob(job.id);
  }

  setCellBlocked(x, y, blocked) {
    const nx = Number(x);
    const ny = Number(y);
    if (!Number.isInteger(nx) || !Number.isInteger(ny)) throw new Error('Cell coordinates must be integers.');
    if (!isStaticTraversable(this.warehouse, nx, ny)) {
      throw new Error('Only traversable floor, pickup, or workstation cells can be toggled.');
    }
    const key = cellKey(nx, ny);
    const currentlyBlocked = this.blocked.has(key);
    const shouldBlock = Boolean(blocked);
    if (currentlyBlocked === shouldBlock) return this.snapshot();

    const events = [];
    const occupants = this.robots.filter((robot) => robot.x === nx && robot.y === ny);
    if (shouldBlock) {
      this.blocked.add(key);
      this.push(
        events,
        'blocked',
        `Obstacle added at (${nx},${ny}). All live routes invalidated and replanned${occupants.length ? `; ${occupants.map((robot) => robot.id).join(', ')} now on a blocked cell.` : '.'}`,
        { severity: 'danger' },
      );
    } else {
      this.blocked.delete(key);
      this.push(events, 'blocked', `Obstacle cleared at (${nx},${ny}). Replanning affected routes.`, {
        severity: 'success',
      });
    }

    this.assignQueuedJobs(events);
    this.planAll();
    this.logWaitChanges(events);
    this.commit(events);
    return this.snapshot();
  }

  clearBlocks() {
    if (this.blocked.size === 0) return this.snapshot();
    const count = this.blocked.size;
    this.blocked.clear();
    const events = [
      {
        type: 'blocked',
        message: `All ${count} operator obstacles cleared. Replanning fleet.`,
        severity: 'success',
        at: nowIso(),
      },
    ];
    this.assignQueuedJobs(events);
    this.planAll();
    this.logWaitChanges(events);
    this.commit(events);
    return this.snapshot();
  }

  getStats() {
    const queued = this.jobs.filter((job) => job.status === 'queued');
    const activeJobs = this.jobs.filter((job) => job.status === 'assigned' || job.status === 'loaded');
    const completedJobs = this.jobs.filter((job) => job.status === 'completed');
    const queueWaits = completedJobs
      .map((job) => job.queueWaitTicks)
      .filter((value) => Number.isFinite(value));
    return {
      queuedJobs: queued.length,
      activeJobs: activeJobs.length,
      completedJobs: completedJobs.length,
      totalJobs: this.jobs.length,
      activeRobots: this.robots.filter((robot) => robot.status !== 'idle').length,
      idleRobots: this.robots.filter((robot) => robot.status === 'idle').length,
      waitingRobots: this.robots.filter((robot) => robot.waiting).length,
      blockedCells: this.blocked.size,
      averageQueueWaitTicks:
        queueWaits.length > 0
          ? Math.round((queueWaits.reduce((sum, value) => sum + value, 0) / queueWaits.length) * 10) / 10
          : 0,
      throughputPer100Ticks:
        this.tick > 0 ? Math.round((completedJobs.length / this.tick) * 1000) / 10 : 0,
    };
  }

  publicRobot(robot) {
    const job = robot.jobId ? this.getJob(robot.jobId) : null;
    return {
      id: robot.id,
      name: robot.name,
      color: robot.color,
      home: robot.home,
      x: robot.x,
      y: robot.y,
      status: robot.status,
      jobId: robot.jobId,
      jobLabel: job ? `${job.shelfId} → ${job.workstationId}` : null,
      jobPriority: job?.priority ?? null,
      carryingShelf: robot.carryingShelf,
      waiting: robot.waiting,
      waitReason: robot.waitReason,
      waitCode: robot.waitCode,
      waitingOn: robot.waitingOn,
      route: robot.route,
      routeGoal: robot.routeGoal
        ? {
            kind: robot.routeGoal.kind,
            label: robot.routeGoal.label,
            point: robot.routeGoal.point,
          }
        : null,
      heading: robot.heading,
      completedJobs: robot.completedJobs,
      distanceTravelled: robot.distanceTravelled,
      consecutiveWaitTicks: robot.consecutiveWaitTicks,
      lastMoveTick: robot.lastMoveTick,
    };
  }

  snapshot() {
    const corridors = findNarrowCorridors(this.warehouse, this.blocked);
    return {
      protocol: 'tessera.warehouse.v1',
      seq: this.seq,
      runId: this.runId,
      tick: this.tick,
      running: this.running,
      seed: this.seed,
      updatedAt: this.updatedAt ?? nowIso(),
      config: {
        tickMs: this.warehouse.tickMs,
        agingTicks: AGING_TICKS,
        routeHorizon: ROUTE_HORIZON,
        algorithm: 'Prioritized space-time A*',
      },
      warehouse: {
        width: this.warehouse.width,
        height: this.warehouse.height,
        terrain: this.warehouse.terrain,
        shelves: this.warehouse.shelves,
        workstations: this.warehouse.workstations,
        pickupByShelf: this.warehouse.pickupByShelf,
        pickupPoints: this.warehouse.pickupPoints,
        homes: this.warehouse.homes,
        narrowAisles: this.warehouse.narrowAisles,
        liveNarrowCorridors: corridors.groups.map((group) => ({
          id: group.id,
          orientation: group.orientation,
          cells: group.cells,
        })),
      },
      blockedCells: [...this.blocked].map((key) => {
        const [x, y] = key.split(',').map(Number);
        return { x, y };
      }),
      robots: this.robots.map((robot) => this.publicRobot(robot)),
      jobs: this.jobs.map((job) => ({
        ...job,
        queueWaitTicks:
          job.queueWaitTicks ??
          (job.status === 'queued' ? Math.max(0, this.tick - job.createdAtTick) : null),
      })),
      stats: this.getStats(),
      counters: { ...this.counters },
      events: this.events,
      scheduler: {
        queues: {
          queued: this.jobs.filter((job) => job.status === 'queued').map((job) => job.id),
          active: this.jobs
            .filter((job) => job.status === 'assigned' || job.status === 'loaded')
            .map((job) => job.id),
        },
      },
    };
  }

  persistableSnapshot() {
    return {
      version: 2,
      savedAt: nowIso(),
      seed: this.seed,
      seq: this.seq,
      runId: this.runId,
      tick: this.tick,
      running: this.running,
      nextJobNumber: this.nextJobNumber,
      eventCounter: this.eventCounter,
      blockedKeys: [...this.blocked],
      jobs: this.jobs,
      robots: this.robots.map((robot) => ({
        id: robot.id,
        x: robot.x,
        y: robot.y,
        status: robot.status,
        jobId: robot.jobId,
        carryingShelf: robot.carryingShelf,
        completedJobs: robot.completedJobs,
        distanceTravelled: robot.distanceTravelled,
        lastMoveTick: robot.lastMoveTick,
      })),
      events: this.events,
      counters: this.counters,
    };
  }
}

export function validateRestore(data) {
  return Boolean(
    data &&
      typeof data === 'object' &&
      Number.isInteger(data.seed) &&
      Number.isInteger(data.tick) &&
      Array.isArray(data.jobs) &&
      Array.isArray(data.robots) &&
      Number.isInteger(data.seq),
  );
}
