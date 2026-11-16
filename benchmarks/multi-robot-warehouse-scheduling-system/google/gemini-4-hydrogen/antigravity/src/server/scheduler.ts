import {
  DEFAULT_SEED,
  DROPOFF_DWELL_TICKS,
  EventKind,
  Heading,
  JobPriority,
  PICKUP_DWELL_TICKS,
  Point,
  RobotState,
  ShelfInfo,
  SimEvent,
  SimStats,
  TimePoint,
  TransportJob,
  WarehouseGrid,
  WorkstationInfo,
} from '../shared/types.js';
import {
  cellIndex,
  computeReverseBfsMap,
  findNearestStagingNearTarget,
  findSafeHoldPath,
  findSpaceTimePath,
  inferWaitBlocker,
  isTraversable,
  ReservationTable,
} from './pathfinder.js';
import { createPrng } from './prng.js';
import { generateWarehouse } from './warehouseGenerator.js';

const PRIORITY_BASE_WEIGHT: Record<JobPriority, number> = {
  URGENT: 400,
  HIGH: 200,
  NORMAL: 100,
  LOW: 40,
};

const AGING_PER_TICK = 2;

export interface EngineState {
  runId: string;
  seed: string;
  tick: number;
  prngState: number;
  nextJobNum: number;
  replanCount: number;
  grid: WarehouseGrid;
  robots: RobotState[];
  jobs: TransportJob[];
}

export interface PendingEvent {
  kind: EventKind;
  severity: SimEvent['severity'];
  message: string;
  robotId?: string;
  jobId?: string;
  cell?: Point;
}

function samePoint(a: Point, b: Point): boolean {
  return a.x === b.x && a.y === b.y;
}

function computeHeading(from: Point, to: Point): Heading {
  if (to.x > from.x) return 'E';
  if (to.x < from.x) return 'W';
  if (to.y > from.y) return 'S';
  if (to.y < from.y) return 'N';
  return 'NONE';
}

export function computeEffectiveScore(job: TransportJob, currentTick: number): number {
  const waitTicks = Math.max(0, currentTick - job.createdTick);
  return PRIORITY_BASE_WEIGHT[job.priority] + waitTicks * AGING_PER_TICK;
}

export function getShelfById(grid: WarehouseGrid, shelfId: string): ShelfInfo | undefined {
  return grid.shelves.find((s) => s.id === shelfId);
}

export function getWorkstationById(
  grid: WarehouseGrid,
  workstationId: string
): WorkstationInfo | undefined {
  return grid.workstations.find((w) => w.id === workstationId);
}

export function createInitialEngineState(
  seed: string = DEFAULT_SEED,
  runId: string = `run-${Date.now()}`
): EngineState {
  const generated = generateWarehouse(seed);
  return {
    runId,
    seed,
    tick: 0,
    prngState: generated.prngState,
    nextJobNum: 1,
    replanCount: 0,
    grid: generated.grid,
    robots: generated.robots,
    jobs: [],
  };
}

function getGoalCellForRobot(state: EngineState, robot: RobotState): Point {
  if (robot.phase === 'TO_PICKUP' && robot.targetShelfId) {
    const shelf = getShelfById(state.grid, robot.targetShelfId);
    if (shelf) return shelf.pickupCell;
  }
  if (robot.phase === 'TO_DROPOFF' && robot.targetWorkstationId) {
    const ws = getWorkstationById(state.grid, robot.targetWorkstationId);
    if (ws) return ws.cell;
  }
  if (robot.phase === 'RETURNING') {
    if (isTraversable(state.grid, robot.homeBay.x, robot.homeBay.y)) {
      return robot.homeBay;
    }
    const freeBay = state.grid.stagingBays.find(
      (bay) =>
        isTraversable(state.grid, bay.x, bay.y) &&
        !state.robots.some((other) => other.id !== robot.id && samePoint(other.pos, bay))
    );
    if (freeBay) return freeBay;
  }
  return robot.pos;
}

function getJobForRobot(state: EngineState, robot: RobotState): TransportJob | undefined {
  if (!robot.currentJobId) return undefined;
  return state.jobs.find((j) => j.id === robot.currentJobId);
}

function getRobotPlanningScore(state: EngineState, robot: RobotState): number {
  const job = getJobForRobot(state, robot);
  const jobScore = job ? computeEffectiveScore(job, state.tick) : 0;
  const phaseBonus =
    robot.phase === 'TO_DROPOFF' ? 1000 : robot.phase === 'TO_PICKUP' ? 500 : 0;
  const inBottleneckBonus = state.grid.cells[robot.pos.y][robot.pos.x].bottleneck ? 120 : 0;
  const starvationBonus = robot.waitTicks * 3;
  return phaseBonus + jobScore + inBottleneckBonus + starvationBonus;
}

function pathTouchesBlockedCell(grid: WarehouseGrid, path: TimePoint[]): boolean {
  for (let i = 0; i < path.length; i++) {
    if (!isTraversable(grid, path[i].x, path[i].y)) return true;
  }
  return false;
}

function pathHasPrefixAtCurrentTick(robot: RobotState, tick: number, goal: Point): boolean {
  if (robot.plannedPath.length === 0) return false;
  const first = robot.plannedPath[0];
  if (first.t !== tick || first.x !== robot.pos.x || first.y !== robot.pos.y) return false;
  const last = robot.plannedPath[robot.plannedPath.length - 1];
  return last.x === goal.x && last.y === goal.y;
}

/**
 * Builds a ReservationTable populated with fixed/dwelling/idle robots and returns the
 * joint plan for all mobile robots, resolving traps via Escape-Priority promotion.
 */
export function replanAllRobots(
  state: EngineState,
  options?: {
    onlyRobots?: Set<string>;
    events?: PendingEvent[];
    reason?: 'OBSTACLE' | 'PREEMPT' | 'REPAIR' | 'NORMAL';
  }
): void {
  const events = options?.events ?? [];
  const tick = state.tick;

  // Update effective scores on active/queued jobs
  for (const job of state.jobs) {
    if (job.status !== 'COMPLETED' && job.status !== 'CANCELLED') {
      job.effectiveScore = computeEffectiveScore(job, tick);
    }
  }

  // Ensure any IDLE robot not on an open staging bay transitions to RETURNING
  for (const robot of state.robots) {
    if (robot.phase === 'IDLE' && !samePoint(robot.pos, robot.homeBay)) {
      robot.phase = 'RETURNING';
      robot.status = 'RETURNING';
    }
  }

  // Classify robots into stationary-locked vs mobile-needing-paths
  const dwellingRobots: RobotState[] = [];
  const idleHomeRobots: RobotState[] = [];
  const mobileRobots: RobotState[] = [];

  for (const robot of state.robots) {
    if (robot.phase === 'PICKING_UP' || robot.phase === 'DROPPING_OFF') {
      const dwellPath: TimePoint[] = [{ x: robot.pos.x, y: robot.pos.y, t: tick }];
      for (let d = 1; d <= robot.dwellRemaining; d++) {
        dwellPath.push({ x: robot.pos.x, y: robot.pos.y, t: tick + d });
      }
      robot.plannedPath = dwellPath;
      robot.status = robot.phase;
      robot.waitReasonCode = robot.phase === 'PICKING_UP' ? 'PICKUP_DWELL' : 'DROPOFF_DWELL';
      robot.waitReason =
        robot.phase === 'PICKING_UP'
          ? `Loading item from ${robot.targetShelfId} (${robot.dwellRemaining}t)`
          : `Unloading at ${robot.targetWorkstationId} (${robot.dwellRemaining}t)`;
      dwellingRobots.push(robot);
    } else if (robot.phase === 'IDLE') {
      robot.plannedPath = [{ x: robot.pos.x, y: robot.pos.y, t: tick }];
      robot.status = 'IDLE';
      robot.waitReason = null;
      robot.waitReasonCode = 'NONE';
      idleHomeRobots.push(robot);
    } else {
      mobileRobots.push(robot);
    }
  }

  if (mobileRobots.length === 0) return;

  // Determine if we can do incremental planning (only planning robots without valid paths)
  // vs full joint replan.
  const needsPlanSet = new Set<string>(options?.onlyRobots ?? []);
  for (const r of mobileRobots) {
    const goal = getGoalCellForRobot(state, r);
    if (
      !pathHasPrefixAtCurrentTick(r, tick, goal) ||
      pathTouchesBlockedCell(state.grid, r.plannedPath)
    ) {
      needsPlanSet.add(r.id);
    }
  }

  if (needsPlanSet.size === 0) {
    // Still refresh wait reasons if robot is waiting on next step
    const table = buildReservationTableFromState(state);
    refreshWaitReasons(state, table);
    return;
  }

  // Try incremental planning first when requested/applicable
  const canTryIncremental =
    options?.reason !== 'PREEMPT' &&
    options?.reason !== 'OBSTACLE' &&
    needsPlanSet.size < mobileRobots.length;

  if (canTryIncremental) {
    const table = new ReservationTable(state.grid.width);
    for (const r of dwellingRobots) {
      table.reservePath(r.id, r.plannedPath, true);
    }
    for (const r of idleHomeRobots) {
      table.reservePath(r.id, r.plannedPath, true);
    }
    const keepRobots = mobileRobots.filter((r) => !needsPlanSet.has(r.id));
    for (const r of keepRobots) {
      table.reservePath(r.id, r.plannedPath, true);
    }

    const planOrder = mobileRobots
      .filter((r) => needsPlanSet.has(r.id))
      .sort((a, b) => {
        const diff = getRobotPlanningScore(state, b) - getRobotPlanningScore(state, a);
        return diff !== 0 ? diff : a.id.localeCompare(b.id);
      });

    let incrementalOk = true;
    const tentative = new Map<
      string,
      { path: TimePoint[]; blocked: boolean; stagingForHolder?: string }
    >();

    for (const r of planOrder) {
      const goal = getGoalCellForRobot(state, r);

      if (!isTraversable(state.grid, goal.x, goal.y)) {
        const safePath = findSafeHoldPath(state.grid, table, r.id, r.pos, [r.homeBay], tick);
        if (safePath) {
          table.reservePath(r.id, safePath, true);
          tentative.set(r.id, { path: safePath, blocked: true });
          continue;
        }
        incrementalOk = false;
        break;
      }

      const terminalHolder = table.getTerminalHolder(goal.x, goal.y);
      if (terminalHolder && terminalHolder.robotId !== r.id) {
        const stagePath = findNearestStagingNearTarget(state.grid, table, r.id, r.pos, goal, tick);
        if (stagePath) {
          table.reservePath(r.id, stagePath, true);
          tentative.set(r.id, {
            path: stagePath,
            blocked: false,
            stagingForHolder: terminalHolder.robotId,
          });
          continue;
        }
        incrementalOk = false;
        break;
      }

      const res = findSpaceTimePath(state.grid, table, r.id, r.pos, goal, tick, {
        holdGoalTerminally: true,
      });
      if (res.path) {
        table.reservePath(r.id, res.path, true);
        tentative.set(r.id, { path: res.path, blocked: false });
      } else if (!res.staticReachable) {
        // Goal walled off in 2D; try safe hold/evacuation
        const safePath = findSafeHoldPath(state.grid, table, r.id, r.pos, [r.homeBay], tick);
        if (safePath) {
          table.reservePath(r.id, safePath, true);
          tentative.set(r.id, { path: safePath, blocked: true });
        } else {
          incrementalOk = false;
          break;
        }
      } else {
        // Dynamic reservation conflict with an existing path — escalate to joint replan!
        incrementalOk = false;
        break;
      }
    }

    if (incrementalOk) {
      for (const r of planOrder) {
        const entry = tentative.get(r.id)!;
        applyPlannedPathToRobot(
          state,
          r,
          entry.path,
          entry.blocked,
          table,
          events,
          entry.stagingForHolder
        );
      }
      refreshWaitReasons(state, table);
      return;
    }
  }

  // Full Joint Priority Replan with Escape-Priority Resolver
  runJointReplanWithEscape(state, dwellingRobots, idleHomeRobots, mobileRobots, events);
}

function collectCurrentCellBlockers(
  table: ReservationTable,
  robotId: string,
  pos: Point,
  tick: number,
  out: Set<string>
): void {
  const maxT = table.getMaxReservedTime();
  for (let t = tick + 1; t <= maxT; t++) {
    const b = table.getVertexBlocker(robotId, pos.x, pos.y, t);
    if (b) out.add(b);
  }
}

function runJointReplanWithEscape(
  state: EngineState,
  dwellingRobots: RobotState[],
  idleHomeRobots: RobotState[],
  mobileRobots: RobotState[],
  events: PendingEvent[]
): void {
  const tick = state.tick;
  let order = [...mobileRobots].sort((a, b) => {
    const diff = getRobotPlanningScore(state, b) - getRobotPlanningScore(state, a);
    return diff !== 0 ? diff : a.id.localeCompare(b.id);
  });

  const promotedCounts = new Map<string, number>();
  const maxAttempts = mobileRobots.length * 2 + 2;

  let finalTable = new ReservationTable(state.grid.width);
  let finalPlans = new Map<
    string,
    { path: TimePoint[]; blocked: boolean; stagingForHolder?: string }
  >();

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const table = new ReservationTable(state.grid.width);

    for (const r of dwellingRobots) {
      table.reservePath(r.id, r.plannedPath, true);
    }
    for (const r of idleHomeRobots) {
      table.reservePath(r.id, r.plannedPath, true);
    }

    // Reserve every mobile robot's immutable current position at t = tick
    for (const r of order) {
      table.reserveVertex(r.id, r.pos.x, r.pos.y, tick);
    }

    const plans = new Map<
      string,
      { path: TimePoint[]; blocked: boolean; stagingForHolder?: string }
    >();
    let promoteRobotId: string | null = null;
    let promoteBeforeRobotId: string | null = null;

    for (let i = 0; i < order.length; i++) {
      const r = order[i];
      const goal = getGoalCellForRobot(state, r);

      // Fast check 1: goal itself blocked
      if (!isTraversable(state.grid, goal.x, goal.y)) {
        const safePath = findSafeHoldPath(state.grid, table, r.id, r.pos, [r.homeBay], tick);
        if (safePath) {
          table.reservePath(r.id, safePath, true);
          plans.set(r.id, { path: safePath, blocked: true });
          continue;
        }
        if (table.canHoldTerminally(r.id, r.pos.x, r.pos.y, tick)) {
          const stay = [{ x: r.pos.x, y: r.pos.y, t: tick }];
          table.reservePath(r.id, stay, true);
          plans.set(r.id, { path: stay, blocked: true });
          continue;
        }
        const blockers = new Set<string>();
        collectCurrentCellBlockers(table, r.id, r.pos, tick, blockers);
        const blocker = findEarlierBlocker(order, i, blockers);
        if (blocker && (promotedCounts.get(r.id) ?? 0) < 2) {
          promoteRobotId = r.id;
          promoteBeforeRobotId = blocker;
          break;
        }
        plans.set(r.id, { path: [{ x: r.pos.x, y: r.pos.y, t: tick }], blocked: true });
        continue;
      }

      // Fast check 2: goal claimed terminally by another robot -> stage near goal instead of spinning
      const terminalHolder = table.getTerminalHolder(goal.x, goal.y);
      if (terminalHolder && terminalHolder.robotId !== r.id) {
        const stagePath = findNearestStagingNearTarget(state.grid, table, r.id, r.pos, goal, tick);
        if (stagePath) {
          table.reservePath(r.id, stagePath, true);
          plans.set(r.id, {
            path: stagePath,
            blocked: false,
            stagingForHolder: terminalHolder.robotId,
          });
          continue;
        }
        const safePath = findSafeHoldPath(state.grid, table, r.id, r.pos, [r.homeBay], tick);
        if (safePath) {
          table.reservePath(r.id, safePath, true);
          plans.set(r.id, {
            path: safePath,
            blocked: false,
            stagingForHolder: terminalHolder.robotId,
          });
          continue;
        }
        const blockers = new Set<string>();
        collectCurrentCellBlockers(table, r.id, r.pos, tick, blockers);
        const blocker = findEarlierBlocker(order, i, blockers);
        if (blocker && (promotedCounts.get(r.id) ?? 0) < 2) {
          promoteRobotId = r.id;
          promoteBeforeRobotId = blocker;
          break;
        }
        plans.set(r.id, {
          path: [{ x: r.pos.x, y: r.pos.y, t: tick }],
          blocked: false,
          stagingForHolder: terminalHolder.robotId,
        });
        continue;
      }

      const res = findSpaceTimePath(state.grid, table, r.id, r.pos, goal, tick, {
        holdGoalTerminally: true,
      });

      if (res.path) {
        table.reservePath(r.id, res.path, true);
        plans.set(r.id, { path: res.path, blocked: false });
      } else if (!res.staticReachable) {
        const safePath = findSafeHoldPath(state.grid, table, r.id, r.pos, [r.homeBay], tick);
        if (safePath) {
          table.reservePath(r.id, safePath, true);
          plans.set(r.id, { path: safePath, blocked: true });
        } else if (table.canHoldTerminally(r.id, r.pos.x, r.pos.y, tick)) {
          const stay = [{ x: r.pos.x, y: r.pos.y, t: tick }];
          table.reservePath(r.id, stay, true);
          plans.set(r.id, { path: stay, blocked: true });
        } else {
          collectCurrentCellBlockers(table, r.id, r.pos, tick, res.blockedByRobots);
          const blocker = findEarlierBlocker(order, i, res.blockedByRobots);
          if (blocker && (promotedCounts.get(r.id) ?? 0) < 2) {
            promoteRobotId = r.id;
            promoteBeforeRobotId = blocker;
            break;
          }
          plans.set(r.id, { path: [{ x: r.pos.x, y: r.pos.y, t: tick }], blocked: true });
        }
      } else {
        // Path exists in 2D, blocked dynamically by reservations
        collectCurrentCellBlockers(table, r.id, r.pos, tick, res.blockedByRobots);
        const blocker = findEarlierBlocker(order, i, res.blockedByRobots);
        if (blocker && (promotedCounts.get(r.id) ?? 0) < 2) {
          promoteRobotId = r.id;
          promoteBeforeRobotId = blocker;
          break;
        }
        const safePath = findSafeHoldPath(state.grid, table, r.id, r.pos, [r.homeBay], tick);
        if (safePath) {
          table.reservePath(r.id, safePath, true);
          plans.set(r.id, { path: safePath, blocked: false });
        } else if (table.canHoldTerminally(r.id, r.pos.x, r.pos.y, tick)) {
          const stay = [{ x: r.pos.x, y: r.pos.y, t: tick }];
          table.reservePath(r.id, stay, true);
          plans.set(r.id, { path: stay, blocked: false });
        } else {
          plans.set(r.id, { path: [{ x: r.pos.x, y: r.pos.y, t: tick }], blocked: false });
        }
      }
    }

    if (promoteRobotId && promoteBeforeRobotId) {
      promotedCounts.set(promoteRobotId, (promotedCounts.get(promoteRobotId) ?? 0) + 1);
      const fromIdx = order.findIndex((r) => r.id === promoteRobotId);
      const toIdx = order.findIndex((r) => r.id === promoteBeforeRobotId);
      if (fromIdx > toIdx && toIdx >= 0) {
        const [moved] = order.splice(fromIdx, 1);
        order.splice(toIdx, 0, moved);
        continue;
      }
    }

    finalTable = table;
    finalPlans = plans;
    break;
  }

  for (const r of mobileRobots) {
    const entry = finalPlans.get(r.id) ?? {
      path: [{ x: r.pos.x, y: r.pos.y, t: tick }],
      blocked: true,
    };
    applyPlannedPathToRobot(
      state,
      r,
      entry.path,
      entry.blocked,
      finalTable,
      events,
      entry.stagingForHolder
    );
  }

  refreshWaitReasons(state, finalTable);
}

function findEarlierBlocker(
  order: RobotState[],
  currentIdx: number,
  blockedBy: Set<string>
): string | null {
  for (let j = 0; j < currentIdx; j++) {
    if (blockedBy.has(order[j].id)) return order[j].id;
  }
  return null;
}

function applyPlannedPathToRobot(
  state: EngineState,
  robot: RobotState,
  newPath: TimePoint[],
  targetUnreachable: boolean,
  _table: ReservationTable,
  _events: PendingEvent[],
  stagingForHolder?: string
): void {
  const prevPathStr = robot.plannedPath.map((p) => `${p.x},${p.y}`).join(';');
  const nextPathStr = newPath.map((p) => `${p.x},${p.y}`).join(';');
  const changed = prevPathStr !== nextPathStr;

  robot.plannedPath = newPath;

  if (targetUnreachable) {
    robot.status = 'BLOCKED';
    robot.waitReasonCode = 'PATH_UNREACHABLE';
    const targetName =
      robot.phase === 'TO_PICKUP'
        ? robot.targetShelfId ?? 'pickup'
        : robot.phase === 'TO_DROPOFF'
          ? robot.targetWorkstationId ?? 'workstation'
          : 'staging bay';
    robot.waitReason = `Blocked — no traversable route to ${targetName}`;
  } else {
    if (changed && robot.replannedAtTick === state.tick) {
      state.replanCount++;
    }
    if (stagingForHolder) {
      const targetName =
        robot.phase === 'TO_PICKUP'
          ? robot.targetShelfId ?? 'pickup'
          : robot.phase === 'TO_DROPOFF'
            ? robot.targetWorkstationId ?? 'dock'
            : 'bay';
      robot.waitReasonCode = 'AISLE_RESERVATION';
      robot.waitReason = `Staging for ${targetName} — waiting for ${stagingForHolder} to clear`;
    }
    if (robot.phase === 'TO_PICKUP') robot.status = 'MOVING_TO_PICKUP';
    else if (robot.phase === 'TO_DROPOFF') robot.status = 'MOVING_TO_DROPOFF';
    else if (robot.phase === 'RETURNING') robot.status = 'RETURNING';
  }
}

function refreshWaitReasons(state: EngineState, table: ReservationTable): void {
  for (const robot of state.robots) {
    if (
      robot.phase === 'IDLE' ||
      robot.phase === 'PICKING_UP' ||
      robot.phase === 'DROPPING_OFF' ||
      robot.status === 'BLOCKED'
    ) {
      continue;
    }

    const nextStep = robot.plannedPath[1];
    const goal = getGoalCellForRobot(state, robot);

    if (!nextStep || (nextStep.x === robot.pos.x && nextStep.y === robot.pos.y)) {
      if (samePoint(robot.pos, goal)) continue;

      robot.status = 'WAITING';
      if (robot.waitReason && robot.waitReason.startsWith('Staging for ')) {
        continue;
      }
      const { blockerId, desiredCell } = inferWaitBlocker(
        state.grid,
        table,
        robot.id,
        robot.pos,
        goal,
        state.tick
      );
      if (blockerId && desiredCell) {
        const blocker = state.robots.find((r) => r.id === blockerId);
        const blockerJob = blocker ? getJobForRobot(state, blocker) : undefined;
        const prioTag = blockerJob ? ` (${blockerJob.priority})` : '';
        const isBn = state.grid.cells[desiredCell.y][desiredCell.x].bottleneck;
        robot.waitReasonCode = isBn ? 'AISLE_RESERVATION' : 'CONFLICT_YIELD';
        robot.waitReason = isBn
          ? `Waiting at (${robot.pos.x},${robot.pos.y}) — ${blockerId}${prioTag} holds bottleneck (${desiredCell.x},${desiredCell.y})`
          : `Yielding at (${robot.pos.x},${robot.pos.y}) — ${blockerId}${prioTag} clearing (${desiredCell.x},${desiredCell.y})`;
      } else {
        robot.waitReasonCode = 'CONFLICT_YIELD';
        robot.waitReason = `Waiting at (${robot.pos.x},${robot.pos.y}) — awaiting space-time clearance`;
      }
    } else {
      if (robot.phase === 'TO_PICKUP') robot.status = 'MOVING_TO_PICKUP';
      else if (robot.phase === 'TO_DROPOFF') robot.status = 'MOVING_TO_DROPOFF';
      else if (robot.phase === 'RETURNING') robot.status = 'RETURNING';
      if (!robot.waitReason?.startsWith('Staging for ')) {
        robot.waitReason = null;
        robot.waitReasonCode = 'NONE';
      }
    }
  }
}

export function buildReservationTableFromState(state: EngineState): ReservationTable {
  const table = new ReservationTable(state.grid.width);
  for (const r of state.robots) {
    if (r.plannedPath.length > 0) {
      table.reservePath(r.id, r.plannedPath, true);
    } else {
      table.reservePath(r.id, [{ x: r.pos.x, y: r.pos.y, t: state.tick }], true);
    }
  }
  return table;
}

/**
 * Assigns QUEUED jobs to IDLE or RETURNING robots using priority + wait-aging score
 * and minimum obstacle-aware distance to the job's shelf pickup cell.
 */
export function assignQueuedJobs(state: EngineState): PendingEvent[] {
  const events: PendingEvent[] = [];
  const prng = createPrng(state.seed, state.prngState);

  const queuedJobs = state.jobs
    .filter((j) => j.status === 'QUEUED')
    .map((j) => {
      j.effectiveScore = computeEffectiveScore(j, state.tick);
      return j;
    })
    .sort((a, b) => {
      if (b.effectiveScore !== a.effectiveScore) return b.effectiveScore - a.effectiveScore;
      if (a.createdTick !== b.createdTick) return a.createdTick - b.createdTick;
      return a.id.localeCompare(b.id);
    });

  if (queuedJobs.length === 0) return events;

  const assignedRobots: RobotState[] = [];
  let hasUrgentPreemption = false;

  for (const job of queuedJobs) {
    const shelf = getShelfById(state.grid, job.shelfId);
    const ws = getWorkstationById(state.grid, job.workstationId);
    if (!shelf || !ws) continue;
    if (!isTraversable(state.grid, shelf.pickupCell.x, shelf.pickupCell.y)) continue;

    const eligible = state.robots.filter(
      (r) => (r.phase === 'IDLE' || r.phase === 'RETURNING') && r.currentJobId === null
    );
    if (eligible.length === 0) break;

    const distMap = computeReverseBfsMap(state.grid, shelf.pickupCell);

    let bestRobot: RobotState | null = null;
    let bestDist = Infinity;
    let bestTie = 0;

    for (const r of eligible) {
      const d = distMap[cellIndex(state.grid.width, r.pos.x, r.pos.y)];
      if (!Number.isFinite(d)) continue;
      // Slightly prefer IDLE over RETURNING on exact ties
      const scoreDist = d + (r.phase === 'RETURNING' ? 0.1 : 0);
      const tie = prng.next();
      if (scoreDist < bestDist || (scoreDist === bestDist && tie < bestTie)) {
        bestDist = scoreDist;
        bestTie = tie;
        bestRobot = r;
      }
    }

    if (!bestRobot) continue;

    job.status = 'ASSIGNED';
    job.assignedRobotId = bestRobot.id;
    job.startedTick = state.tick;

    bestRobot.phase = 'TO_PICKUP';
    bestRobot.status = 'MOVING_TO_PICKUP';
    bestRobot.currentJobId = job.id;
    bestRobot.targetShelfId = job.shelfId;
    bestRobot.targetWorkstationId = job.workstationId;
    bestRobot.carryingShelfId = null;
    bestRobot.waitTicks = 0;
    bestRobot.waitReason = null;
    bestRobot.waitReasonCode = 'NONE';
    bestRobot.plannedPath = [{ x: bestRobot.pos.x, y: bestRobot.pos.y, t: state.tick }];

    assignedRobots.push(bestRobot);
    if (job.priority === 'URGENT' || job.priority === 'HIGH') {
      hasUrgentPreemption = true;
    }

    events.push({
      kind: 'JOB_ASSIGNED',
      severity: 'info',
      message: `${bestRobot.id} assigned ${job.priority} job ${job.id} (${job.shelfId} → ${job.workstationId})`,
      robotId: bestRobot.id,
      jobId: job.id,
    });
  }

  state.prngState = prng.getState();

  if (assignedRobots.length > 0) {
    replanAllRobots(state, {
      onlyRobots: new Set(assignedRobots.map((r) => r.id)),
      reason: hasUrgentPreemption ? 'PREEMPT' : 'NORMAL',
      events,
    });
  }

  return events;
}

/**
 * Checks whether any high-priority robot has been delayed >1 tick behind lower-priority traffic
 * and triggers priority preemption replanning to prevent high-priority starvation.
 */
function checkHighPriorityPreemption(state: EngineState, events: PendingEvent[]): void {
  const delayedHigh = state.robots.find((r) => {
    if (r.status !== 'WAITING' || r.waitTicks < 2) return false;
    const job = getJobForRobot(state, r);
    return job && (job.priority === 'URGENT' || job.priority === 'HIGH');
  });

  if (delayedHigh) {
    replanAllRobots(state, { reason: 'PREEMPT', events });
    events.push({
      kind: 'PRIORITY_PREEMPTION',
      severity: 'warn',
      message: `Priority preemption triggered for ${delayedHigh.id} (${delayedHigh.currentJobId})`,
      robotId: delayedHigh.id,
      jobId: delayedHigh.currentJobId ?? undefined,
    });
  }
}

/**
 * Advances the simulation by exactly ONE discrete fixed time step.
 */
export function stepSimulationTick(state: EngineState): PendingEvent[] {
  const events: PendingEvent[] = [];
  const nextTick = state.tick + 1;

  // 1. Validate & execute planned step for t -> t + 1
  const plannedNextPos = new Map<string, Point>();
  for (const robot of state.robots) {
    if (
      (robot.phase === 'TO_PICKUP' ||
        robot.phase === 'TO_DROPOFF' ||
        robot.phase === 'RETURNING') &&
      robot.plannedPath.length >= 2 &&
      robot.plannedPath[1].t === nextTick
    ) {
      const candidate = { x: robot.plannedPath[1].x, y: robot.plannedPath[1].y };
      if (isTraversable(state.grid, candidate.x, candidate.y)) {
        plannedNextPos.set(robot.id, candidate);
      } else {
        plannedNextPos.set(robot.id, { ...robot.pos });
      }
    } else {
      plannedNextPos.set(robot.id, { ...robot.pos });
    }
  }

  // Runtime safety invariant guard: fixed-point guarantee of zero vertex or swap collisions
  let guardChanged = true;
  while (guardChanged) {
    guardChanged = false;

    // Stationary robots keep their cell; any robot trying to move onto a stationary robot holds
    const stationaryKeys = new Set<string>();
    for (const r of state.robots) {
      const nextP = plannedNextPos.get(r.id)!;
      if (samePoint(nextP, r.pos)) {
        stationaryKeys.add(`${r.pos.x},${r.pos.y}`);
      }
    }
    for (const r of state.robots) {
      const nextP = plannedNextPos.get(r.id)!;
      if (!samePoint(nextP, r.pos) && stationaryKeys.has(`${nextP.x},${nextP.y}`)) {
        plannedNextPos.set(r.id, { ...r.pos });
        guardChanged = true;
      }
    }

    // Two moving robots aiming for the same cell -> lower-score one holds
    const claimedBy = new Map<string, RobotState>();
    for (const r of state.robots) {
      const nextP = plannedNextPos.get(r.id)!;
      const key = `${nextP.x},${nextP.y}`;
      const existing = claimedBy.get(key);
      if (existing) {
        const rScore = getRobotPlanningScore(state, r);
        const eScore = getRobotPlanningScore(state, existing);
        if (rScore > eScore) {
          plannedNextPos.set(existing.id, { ...existing.pos });
          claimedBy.set(key, r);
        } else {
          plannedNextPos.set(r.id, { ...r.pos });
        }
        guardChanged = true;
      } else {
        claimedBy.set(key, r);
      }
    }

    // Two robots swapping positions -> both hold
    for (let i = 0; i < state.robots.length; i++) {
      for (let j = i + 1; j < state.robots.length; j++) {
        const a = state.robots[i];
        const b = state.robots[j];
        const aNext = plannedNextPos.get(a.id)!;
        const bNext = plannedNextPos.get(b.id)!;
        if (samePoint(aNext, b.pos) && samePoint(bNext, a.pos)) {
          plannedNextPos.set(a.id, { ...a.pos });
          plannedNextPos.set(b.id, { ...b.pos });
          guardChanged = true;
        }
      }
    }
  }

  // 2. Commit moves and phase transitions
  let needReplan = false;
  const replanCandidates = new Set<string>();

  for (const robot of state.robots) {
    const prevPos = { ...robot.pos };
    const nextPos = plannedNextPos.get(robot.id)!;
    const moved = !samePoint(prevPos, nextPos);

    if (moved) {
      robot.heading = computeHeading(prevPos, nextPos);
      robot.pos = nextPos;
      robot.totalDistance += 1;
      robot.waitTicks = 0;
      robot.waitReason = null;
      robot.waitReasonCode = 'NONE';
    } else if (
      robot.phase === 'TO_PICKUP' ||
      robot.phase === 'TO_DROPOFF' ||
      robot.phase === 'RETURNING'
    ) {
      robot.waitTicks += 1;
      robot.totalWaitTicks += 1;
    }

    if (robot.plannedPath.length >= 2 && robot.plannedPath[1].t === nextTick) {
      robot.plannedPath = robot.plannedPath.slice(1);
    } else {
      robot.plannedPath = [{ x: robot.pos.x, y: robot.pos.y, t: nextTick }];
    }

    // Advance phase transitions
    if (robot.phase === 'TO_PICKUP' && robot.targetShelfId) {
      const shelf = getShelfById(state.grid, robot.targetShelfId);
      if (shelf && samePoint(robot.pos, shelf.pickupCell)) {
        robot.phase = 'PICKING_UP';
        robot.status = 'PICKING_UP';
        robot.dwellRemaining = PICKUP_DWELL_TICKS;
        robot.waitTicks = 0;
        const job = getJobForRobot(state, robot);
        if (job) job.status = 'PICKING_UP';
        events.push({
          kind: 'JOB_PICKUP',
          severity: 'info',
          message: `${robot.id} arrived at ${shelf.id} pickup pad (${shelf.pickupCell.x},${shelf.pickupCell.y})`,
          robotId: robot.id,
          jobId: job?.id,
          cell: shelf.pickupCell,
        });
      }
    } else if (robot.phase === 'PICKING_UP') {
      robot.dwellRemaining -= 1;
      if (robot.dwellRemaining <= 0) {
        robot.carryingShelfId = robot.targetShelfId;
        robot.phase = 'TO_DROPOFF';
        robot.status = 'MOVING_TO_DROPOFF';
        robot.waitReason = null;
        robot.waitReasonCode = 'NONE';
        const job = getJobForRobot(state, robot);
        if (job) job.status = 'IN_TRANSIT';
        needReplan = true;
        replanCandidates.add(robot.id);
      }
    } else if (robot.phase === 'TO_DROPOFF' && robot.targetWorkstationId) {
      const ws = getWorkstationById(state.grid, robot.targetWorkstationId);
      if (ws && samePoint(robot.pos, ws.cell)) {
        robot.phase = 'DROPPING_OFF';
        robot.status = 'DROPPING_OFF';
        robot.dwellRemaining = DROPOFF_DWELL_TICKS;
        robot.waitTicks = 0;
      }
    } else if (robot.phase === 'DROPPING_OFF') {
      robot.dwellRemaining -= 1;
      if (robot.dwellRemaining <= 0) {
        const job = getJobForRobot(state, robot);
        if (job) {
          job.status = 'COMPLETED';
          job.completedTick = nextTick;
          events.push({
            kind: 'JOB_COMPLETED',
            severity: 'success',
            message: `${robot.id} completed ${job.id} (${job.shelfId} delivered to ${job.workstationId})`,
            robotId: robot.id,
            jobId: job.id,
            cell: { ...robot.pos },
          });
        }
        robot.completedJobs += 1;
        robot.carryingShelfId = null;
        robot.currentJobId = null;
        robot.targetShelfId = null;
        robot.targetWorkstationId = null;
        robot.waitReason = null;
        robot.waitReasonCode = 'NONE';

        if (samePoint(robot.pos, robot.homeBay)) {
          robot.phase = 'IDLE';
          robot.status = 'IDLE';
        } else {
          robot.phase = 'RETURNING';
          robot.status = 'RETURNING';
          needReplan = true;
          replanCandidates.add(robot.id);
        }
      }
    } else if (robot.phase === 'RETURNING') {
      const goal = getGoalCellForRobot(state, robot);
      if (samePoint(robot.pos, goal)) {
        robot.phase = 'IDLE';
        robot.status = 'IDLE';
        robot.waitReason = null;
        robot.waitReasonCode = 'NONE';
      }
    }
  }

  state.tick = nextTick;

  // 3. Assign queued jobs to available robots
  const assignEvents = assignQueuedJobs(state);
  events.push(...assignEvents);

  // 4. Plan / validate paths for active & blocked/waiting robots
  for (const r of state.robots) {
    if (r.status === 'BLOCKED' || r.status === 'WAITING') {
      if (r.plannedPath.length <= 1) {
        needReplan = true;
        replanCandidates.add(r.id);
      }
    }
  }

  if (needReplan) {
    replanAllRobots(state, {
      onlyRobots: replanCandidates,
      reason: 'NORMAL',
      events,
    });
  } else {
    replanAllRobots(state, { reason: 'NORMAL', events });
  }

  // 5. Anti-starvation preemption check for delayed HIGH/URGENT jobs
  checkHighPriorityPreemption(state, events);

  return events;
}

export function createTransportJob(
  state: EngineState,
  shelfId: string,
  workstationId: string,
  priority: JobPriority
): { job?: TransportJob; events: PendingEvent[]; error?: string } {
  const shelf = getShelfById(state.grid, shelfId);
  if (!shelf) return { events: [], error: `Unknown shelf: ${shelfId}` };
  const ws = getWorkstationById(state.grid, workstationId);
  if (!ws) return { events: [], error: `Unknown workstation: ${workstationId}` };

  const id = `J-${String(state.nextJobNum).padStart(3, '0')}`;
  state.nextJobNum += 1;

  const job: TransportJob = {
    id,
    shelfId,
    workstationId,
    priority,
    status: 'QUEUED',
    assignedRobotId: null,
    createdTick: state.tick,
    startedTick: null,
    completedTick: null,
    effectiveScore: PRIORITY_BASE_WEIGHT[priority],
  };

  state.jobs.push(job);

  const events: PendingEvent[] = [
    {
      kind: 'JOB_CREATED',
      severity: priority === 'URGENT' ? 'warn' : 'info',
      message: `Job ${job.id} created [${priority}]: ${shelfId} (${shelf.sku}) → ${workstationId}`,
      jobId: job.id,
    },
  ];

  const assignEvents = assignQueuedJobs(state);
  events.push(...assignEvents);

  return { job, events };
}

export function cancelQueuedJob(
  state: EngineState,
  jobId: string
): { ok: boolean; events: PendingEvent[]; error?: string } {
  const job = state.jobs.find((j) => j.id === jobId);
  if (!job) return { ok: false, events: [], error: `Job ${jobId} not found` };
  if (job.status !== 'QUEUED') {
    return { ok: false, events: [], error: `Only QUEUED jobs can be cancelled (${job.status})` };
  }
  job.status = 'CANCELLED';
  return {
    ok: true,
    events: [
      {
        kind: 'JOB_CANCELLED',
        severity: 'info',
        message: `Queued job ${job.id} cancelled`,
        jobId: job.id,
      },
    ],
  };
}

/**
 * Toggles or sets a traversable grid cell's blocked obstacle state and immediately
 * triggers dynamic replanning for affected robots.
 */
export function setCellBlocked(
  state: EngineState,
  x: number,
  y: number,
  blocked?: boolean
): { ok: boolean; blocked?: boolean; events: PendingEvent[]; error?: string } {
  if (x < 0 || x >= state.grid.width || y < 0 || y >= state.grid.height) {
    return { ok: false, events: [], error: `Coordinates (${x},${y}) out of bounds` };
  }

  const cell = state.grid.cells[y][x];
  if (cell.type === 'WALL' || cell.type === 'SHELF') {
    return {
      ok: false,
      events: [],
      error: `Cannot toggle obstacle on structural ${cell.type.toLowerCase()} at (${x},${y})`,
    };
  }

  const nextBlocked = blocked !== undefined ? blocked : !cell.blocked;
  if (nextBlocked === cell.blocked) {
    return { ok: true, blocked: nextBlocked, events: [] };
  }

  if (nextBlocked) {
    const occupant = state.robots.find((r) => r.pos.x === x && r.pos.y === y);
    if (occupant) {
      return {
        ok: false,
        events: [],
        error: `Cannot block cell (${x},${y}) while ${occupant.id} occupies it`,
      };
    }
  }

  cell.blocked = nextBlocked;

  const events: PendingEvent[] = [
    {
      kind: nextBlocked ? 'OBSTACLE_ADDED' : 'OBSTACLE_REMOVED',
      severity: nextBlocked ? 'alert' : 'success',
      message: nextBlocked
        ? `Obstacle placed at (${x},${y}) — checking affected routes`
        : `Obstacle cleared at (${x},${y}) — resuming blocked routes`,
      cell: { x, y },
    },
  ];

  // Track which robots had paths crossing (x,y) before replan
  const affectedRobots = state.robots.filter((r) => {
    if (nextBlocked) {
      return r.plannedPath.some((wp) => wp.x === x && wp.y === y);
    }
    return r.status === 'BLOCKED' || r.status === 'WAITING' || r.phase !== 'IDLE';
  });

  const previousPaths = new Map<string, string>();
  for (const r of affectedRobots) {
    previousPaths.set(r.id, r.plannedPath.map((p) => `${p.x},${p.y}`).join(';'));
    if (nextBlocked) {
      r.replannedAtTick = state.tick;
    }
  }

  if (!nextBlocked) {
    const assignEvents = assignQueuedJobs(state);
    events.push(...assignEvents);
  }

  replanAllRobots(state, {
    reason: 'OBSTACLE',
    events,
  });

  // Emit clear replan/blocked events for each affected robot
  for (const r of affectedRobots) {
    const newStr = r.plannedPath.map((p) => `${p.x},${p.y}`).join(';');
    if (r.status === 'BLOCKED') {
      events.push({
        kind: 'ROBOT_BLOCKED',
        severity: 'alert',
        message: `${r.id} blocked: ${r.waitReason ?? 'no route available'}`,
        robotId: r.id,
        jobId: r.currentJobId ?? undefined,
        cell: { x, y },
      });
    } else if (nextBlocked && newStr !== previousPaths.get(r.id)) {
      events.push({
        kind: 'ROBOT_REPLANNED',
        severity: 'warn',
        message: `${r.id} stopped before (${x},${y}) and replanned route (${Math.max(0, r.plannedPath.length - 1)} steps)`,
        robotId: r.id,
        jobId: r.currentJobId ?? undefined,
        cell: { x, y },
      });
    }
  }

  return { ok: true, blocked: nextBlocked, events };
}

export function computeStats(state: EngineState): SimStats {
  let completedJobs = 0;
  let activeJobs = 0;
  let queuedJobs = 0;
  for (const j of state.jobs) {
    if (j.status === 'COMPLETED') completedJobs++;
    else if (j.status === 'QUEUED') queuedJobs++;
    else if (j.status !== 'CANCELLED') activeJobs++;
  }

  let waitingRobots = 0;
  let blockedRobots = 0;
  let totalMoves = 0;
  for (const r of state.robots) {
    if (r.status === 'WAITING') waitingRobots++;
    if (r.status === 'BLOCKED') blockedRobots++;
    totalMoves += r.totalDistance;
  }

  let blockedCellsCount = 0;
  for (let y = 0; y < state.grid.height; y++) {
    for (let x = 0; x < state.grid.width; x++) {
      if (state.grid.cells[y][x].blocked) blockedCellsCount++;
    }
  }

  return {
    completedJobs,
    activeJobs,
    queuedJobs,
    waitingRobots,
    blockedRobots,
    blockedCellsCount,
    totalMoves,
    replanCount: state.replanCount,
  };
}
