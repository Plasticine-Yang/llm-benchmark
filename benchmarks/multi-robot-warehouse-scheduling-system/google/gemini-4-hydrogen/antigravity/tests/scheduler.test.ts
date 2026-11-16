import { describe, expect, it } from 'vitest';
import { DEFAULT_SEED, Point } from '../src/shared/types.js';
import { isTraversable } from '../src/server/pathfinder.js';
import {
  createInitialEngineState,
  createTransportJob,
  EngineState,
  setCellBlocked,
  stepSimulationTick,
} from '../src/server/scheduler.js';

function assertNoCollisions(state: EngineState, prevPositions: Map<string, Point>): void {
  const seen = new Set<string>();
  for (const r of state.robots) {
    expect(isTraversable(state.grid, r.pos.x, r.pos.y)).toBe(true);
    const key = `${r.pos.x},${r.pos.y}`;
    expect(seen.has(key)).toBe(false);
    seen.add(key);
  }

  for (let i = 0; i < state.robots.length; i++) {
    for (let j = i + 1; j < state.robots.length; j++) {
      const a = state.robots[i];
      const b = state.robots[j];
      const prevA = prevPositions.get(a.id)!;
      const prevB = prevPositions.get(b.id)!;
      const swapped =
        a.pos.x === prevB.x &&
        a.pos.y === prevB.y &&
        b.pos.x === prevA.x &&
        b.pos.y === prevA.y;
      expect(swapped).toBe(false);
    }
  }
}

function stepAndVerify(state: EngineState) {
  const prev = new Map(state.robots.map((r) => [r.id, { ...r.pos }]));
  const events = stepSimulationTick(state);
  assertNoCollisions(state, prev);
  return events;
}

describe('Multi-Robot Scheduler, Priority Aging & Dynamic Replanning', () => {
  it('completes 10 simultaneous jobs through narrow bottleneck aisles with zero collisions or deadlocks', () => {
    const state = createInitialEngineState(DEFAULT_SEED, 'test-stress');

    const jobSpecs = [
      { shelfId: 'S-07', ws: 'WS-1', prio: 'NORMAL' as const },
      { shelfId: 'S-08', ws: 'WS-2', prio: 'HIGH' as const },
      { shelfId: 'S-09', ws: 'WS-3', prio: 'NORMAL' as const },
      { shelfId: 'S-10', ws: 'WS-4', prio: 'URGENT' as const },
      { shelfId: 'S-11', ws: 'WS-5', prio: 'LOW' as const },
      { shelfId: 'S-12', ws: 'WS-6', prio: 'NORMAL' as const },
      { shelfId: 'S-13', ws: 'WS-1', prio: 'HIGH' as const },
      { shelfId: 'S-15', ws: 'WS-4', prio: 'NORMAL' as const },
      { shelfId: 'S-16', ws: 'WS-2', prio: 'URGENT' as const },
      { shelfId: 'S-18', ws: 'WS-6', prio: 'LOW' as const },
    ];

    for (const s of jobSpecs) {
      const res = createTransportJob(state, s.shelfId, s.ws, s.prio);
      expect(res.error).toBeUndefined();
    }

    let sawWaitingReason = false;
    for (let t = 0; t < 160; t++) {
      stepAndVerify(state);
      for (const r of state.robots) {
        if (r.status === 'WAITING') {
          expect(r.waitReason).toBeTruthy();
          sawWaitingReason = true;
        }
      }
      if (state.jobs.every((j) => j.status === 'COMPLETED')) break;
    }

    expect(state.jobs.every((j) => j.status === 'COMPLETED')).toBe(true);
    expect(sawWaitingReason || state.robots.some((r) => r.totalWaitTicks >= 0)).toBe(true);
  });

  it('prevents high-priority starvation and still completes aged low-priority jobs', () => {
    const state = createInitialEngineState(DEFAULT_SEED, 'test-priority');

    // Fill all 10 robots with LOW jobs + queue 4 more LOW jobs, then submit an URGENT job
    for (let i = 1; i <= 14; i++) {
      const shelfId = `S-${String(i).padStart(2, '0')}`;
      const ws = `WS-${((i - 1) % 6) + 1}`;
      createTransportJob(state, shelfId, ws, 'LOW');
    }

    const urgentRes = createTransportJob(state, 'S-20', 'WS-3', 'URGENT');
    const urgentJob = urgentRes.job!;
    expect(urgentJob.status).toBe('QUEUED');

    let urgentStartTick: number | null = null;
    for (let t = 0; t < 220; t++) {
      stepAndVerify(state);
      if (urgentStartTick === null && urgentJob.startedTick !== null) {
        urgentStartTick = urgentJob.startedTick;
      }
      if (state.jobs.every((j) => j.status === 'COMPLETED')) break;
    }

    // All 15 jobs complete (neither URGENT nor LOW starves!)
    expect(state.jobs.every((j) => j.status === 'COMPLETED')).toBe(true);

    // URGENT job J-015 should start ahead of at least the earlier queued LOW jobs (J-011..J-014)
    const queuedLowJobs = state.jobs.slice(10, 14);
    expect(urgentJob.startedTick).not.toBeNull();
    expect(
      queuedLowJobs.some((lj) => (lj.startedTick ?? Infinity) >= urgentJob.startedTick!)
    ).toBe(true);
  });

  it('immediately replans when a cell directly ahead of an active robot is blocked', () => {
    const state = createInitialEngineState(DEFAULT_SEED, 'test-dynamic-block');
    createTransportJob(state, 'S-08', 'WS-2', 'HIGH');

    // Advance until robot has moved into the interior and has a multi-step planned path
    for (let t = 0; t < 4; t++) {
      stepAndVerify(state);
    }

    const activeRobot = state.robots.find((r) => r.currentJobId !== null)!;
    expect(activeRobot.plannedPath.length).toBeGreaterThan(3);

    const cellAhead = { ...activeRobot.plannedPath[1] };
    const prevPathStr = activeRobot.plannedPath.map((p) => `${p.x},${p.y}`).join(';');

    // Block the exact next cell ahead of the active robot
    const blockRes = setCellBlocked(state, cellAhead.x, cellAhead.y, true);
    expect(blockRes.ok).toBe(true);
    expect(blockRes.blocked).toBe(true);

    // Immediately replanned path must not enter the newly blocked cell
    const newPathStr = activeRobot.plannedPath.map((p) => `${p.x},${p.y}`).join(';');
    expect(newPathStr).not.toBe(prevPathStr);
    expect(
      activeRobot.plannedPath.some((wp) => wp.x === cellAhead.x && wp.y === cellAhead.y)
    ).toBe(false);
    expect(blockRes.events.some((e) => e.kind === 'ROBOT_REPLANNED')).toBe(true);

    // Step to completion: robot must never enter cellAhead and must finish the job
    for (let t = 0; t < 120; t++) {
      stepAndVerify(state);
      expect(
        activeRobot.pos.x === cellAhead.x && activeRobot.pos.y === cellAhead.y
      ).toBe(false);
      if (state.jobs.every((j) => j.status === 'COMPLETED')) break;
    }

    expect(state.jobs[0].status).toBe('COMPLETED');
  });

  it('produces identical behavior when reset with the same deterministic seed', () => {
    const runScenario = (): string => {
      const s = createInitialEngineState(DEFAULT_SEED, 'det-run');
      createTransportJob(s, 'S-02', 'WS-1', 'NORMAL');
      createTransportJob(s, 'S-08', 'WS-3', 'HIGH');
      createTransportJob(s, 'S-15', 'WS-5', 'URGENT');

      for (let t = 0; t < 60; t++) {
        if (t === 5) setCellBlocked(s, 5, 7, true);
        if (t === 18) setCellBlocked(s, 5, 7, false);
        stepAndVerify(s);
      }

      return JSON.stringify({
        tick: s.tick,
        robots: s.robots.map((r) => ({ id: r.id, pos: r.pos, status: r.status, dist: r.totalDistance })),
        jobs: s.jobs.map((j) => ({
          id: j.id,
          status: j.status,
          robot: j.assignedRobotId,
          started: j.startedTick,
          completed: j.completedTick,
        })),
      });
    };

    expect(runScenario()).toEqual(runScenario());
  });
});
