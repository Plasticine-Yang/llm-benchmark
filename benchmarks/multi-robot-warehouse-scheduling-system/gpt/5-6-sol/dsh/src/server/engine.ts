import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import type { Job, LogEntry, Point, Priority, Robot, SimulationState, WarehouseMap } from "../shared/types.js";
import { createWarehouse, manhattan, pointKey, samePoint } from "./map.js";
import { findPath, isTraversable, staticObstacles } from "./pathfinding.js";

const HORIZON = 48;
const MAX_EVENTS = 160;
const WAIT = "Waiting for a safe time-slot — route reserved by another robot";

type Listener = (state: SimulationState, kind: "snapshot" | "update") => void;

interface ReservationTable {
  vertices: Set<string>;
  edges: Set<string>;
}

const vertexKey = (point: Point, time: number) => `${time}:${pointKey(point)}`;
const edgeKey = (from: Point, to: Point, time: number) => `${time}:${pointKey(from)}>${pointKey(to)}`;
const clone = <T>(value: T): T => structuredClone(value);

export class SimulationEngine {
  private state: SimulationState;
  private timer: NodeJS.Timeout | null = null;
  private readonly listeners = new Set<Listener>();

  constructor(private readonly statePath: string, private readonly defaultSeed = 73421) {
    this.state = this.loadOrCreate();
    if (this.state.running) this.startTimer();
  }

  getState(): SimulationState {
    return clone(this.state);
  }

  subscribe(listener: Listener): () => void {
    listener(this.getState(), "snapshot");
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  createJob(shelfId: string, workstationId: string, priority: Priority): Job {
    if (!this.state.map.shelves.some((shelf) => shelf.id === shelfId)) throw new Error("Unknown shelf");
    if (!this.state.map.workstations.some((station) => station.id === workstationId)) throw new Error("Unknown workstation");
    if (![1, 2, 3, 4, 5].includes(priority)) throw new Error("Priority must be between 1 and 5");

    const serial = this.state.jobs.reduce((max, job) => Math.max(max, Number(job.id.slice(2)) || 0), 0) + 1;
    const job: Job = {
      id: `J-${String(serial).padStart(3, "0")}`,
      shelfId,
      workstationId,
      priority,
      status: "QUEUED",
      robotId: null,
      createdTick: this.state.tick,
      assignedTick: null,
      completedTick: null,
    };
    this.state.jobs.push(job);
    this.log("JOB", `${job.id} queued · ${shelfId} → ${workstationId} · priority ${priority}`);
    this.assignJobs();
    this.planAllRoutes();
    this.commit();
    return clone(job);
  }

  setRunning(running: boolean): void {
    if (this.state.running === running) return;
    this.state.running = running;
    this.log("CONTROL", running ? "Simulation resumed" : "Simulation paused");
    if (running) this.startTimer();
    else this.stopTimer();
    this.commit();
  }

  singleStep(): void {
    if (this.state.running) throw new Error("Pause the simulation before single-stepping");
    this.advance();
  }

  reset(): void {
    const wasRunning = this.state.running;
    const previousSequence = this.state.sequence;
    this.stopTimer();
    this.state = this.createInitialState(this.state.seed);
    // Sequence is a run-independent stream cursor. Tick resets, sequence never does.
    this.state.sequence = previousSequence;
    this.state.running = wasRunning;
    this.log("SYSTEM", `Deterministic run reset · seed ${this.state.seed}`);
    this.commit();
    if (wasRunning) this.startTimer();
  }

  setBlocked(point: Point, blocked: boolean): void {
    if (!isTraversable({ ...this.state.map, blocked: [] }, point)) throw new Error("Only open floor cells can be changed");
    if (blocked && this.state.robots.some((robot) => samePoint(robot.position, point))) {
      throw new Error("Cannot block a cell currently occupied by a robot");
    }
    const exists = this.state.map.blocked.some((cell) => samePoint(cell, point));
    if (blocked === exists) return;

    if (blocked) this.state.map.blocked.push({ ...point });
    else this.state.map.blocked = this.state.map.blocked.filter((cell) => !samePoint(cell, point));

    const affected = this.state.robots.filter((robot) => robot.route.some((cell) => samePoint(cell, point)));
    for (const robot of affected) {
      robot.route = [{ ...robot.position }];
      robot.waitingReason = blocked ? "Route invalidated by a new obstacle — replanning" : null;
    }
    this.log("BLOCK", `${blocked ? "Blocked" : "Reopened"} cell ${point.x},${point.y}${affected.length ? ` · replanning ${affected.map((r) => r.name).join(", ")}` : ""}`);
    this.planAllRoutes();
    this.commit();
  }

  shutdown(): void {
    this.stopTimer();
    this.persist();
  }

  private createInitialState(seed: number): SimulationState {
    const { map, robots } = createWarehouse(seed);
    return {
      schemaVersion: 1,
      seed,
      sequence: 0,
      tick: 0,
      running: false,
      stepMs: 650,
      map,
      robots,
      jobs: [],
      events: [],
      metrics: { moves: 0, waits: 0, completedJobs: 0 },
    };
  }

  private loadOrCreate(): SimulationState {
    try {
      if (existsSync(this.statePath)) {
        const loaded = JSON.parse(readFileSync(this.statePath, "utf8")) as SimulationState;
        if (loaded.schemaVersion === 1) return loaded;
      }
    } catch (error) {
      console.error("Could not load persisted state; starting deterministic run", error);
    }
    return this.createInitialState(this.defaultSeed);
  }

  private startTimer(): void {
    if (this.timer) return;
    this.timer = setInterval(() => this.advance(), this.state.stepMs);
  }

  private stopTimer(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  private advance(): void {
    this.state.tick += 1;
    this.assignJobs();
    this.planAllRoutes();

    for (const robot of this.state.robots) {
      if (!robot.goal) continue;
      const next = robot.route[1];
      if (next && !samePoint(next, robot.position)) {
        if (staticObstacles(this.state.map).has(pointKey(next))) {
          robot.waitingReason = "Stopped before a newly blocked cell — replanning";
          robot.route = [{ ...robot.position }];
          this.state.metrics.waits += 1;
          this.log("WAIT", `${robot.name} stopped before obstacle at ${next.x},${next.y}`);
          continue;
        }
        robot.position = { ...next };
        robot.distance += 1;
        this.state.metrics.moves += 1;
        robot.route.shift();
        robot.waitingReason = null;
      } else {
        this.state.metrics.waits += 1;
        robot.waitingReason ||= WAIT;
      }
      this.handleArrival(robot);
    }

    this.assignJobs();
    this.planAllRoutes();
    this.commit();
  }

  private handleArrival(robot: Robot): void {
    if (!robot.goal || !samePoint(robot.position, robot.goal)) return;
    if (robot.mode === "RETURNING") {
      robot.goal = null;
      robot.mode = "IDLE";
      robot.route = [{ ...robot.position }];
      robot.waitingReason = null;
      return;
    }
    if (!robot.jobId) return;
    const job = this.state.jobs.find((candidate) => candidate.id === robot.jobId);
    if (!job) return;

    if (robot.mode === "TO_PICKUP") {
      const station = this.state.map.workstations.find((candidate) => candidate.id === job.workstationId)!;
      job.status = "TO_WORKSTATION";
      robot.mode = "TO_WORKSTATION";
      robot.goal = { ...station.position };
      robot.route = [{ ...robot.position }];
      this.log("JOB", `${robot.name} picked ${job.shelfId} · heading to ${station.label}`);
      return;
    }

    job.status = "COMPLETED";
    job.completedTick = this.state.tick;
    robot.jobId = null;
    robot.goal = { ...robot.home };
    robot.mode = "RETURNING";
    robot.route = [{ ...robot.position }];
    robot.waitingReason = null;
    robot.completedJobs += 1;
    this.state.metrics.completedJobs += 1;
    this.log("JOB", `${robot.name} delivered ${job.id} · ${job.shelfId} complete`);
  }

  private assignJobs(): void {
    const idle = new Set(this.state.robots.filter((robot) => !robot.jobId && robot.mode === "IDLE").map((robot) => robot.id));
    const queued = this.state.jobs
      .filter((job) => job.status === "QUEUED")
      .sort((a, b) => this.effectivePriority(b) - this.effectivePriority(a) || a.createdTick - b.createdTick || a.id.localeCompare(b.id));

    for (const job of queued) {
      const shelf = this.state.map.shelves.find((candidate) => candidate.id === job.shelfId)!;
      const candidates = this.state.robots
        .filter((robot) => idle.has(robot.id))
        .map((robot) => ({ robot, path: findPath(this.state.map, robot.position, shelf.pickup) }))
        .filter((candidate): candidate is { robot: Robot; path: Point[] } => candidate.path !== null)
        .sort((a, b) => a.path.length - b.path.length || a.robot.id.localeCompare(b.robot.id));
      const selected = candidates[0];
      if (!selected) continue;

      job.robotId = selected.robot.id;
      job.status = "TO_PICKUP";
      job.assignedTick = this.state.tick;
      selected.robot.jobId = job.id;
      selected.robot.mode = "TO_PICKUP";
      selected.robot.goal = { ...shelf.pickup };
      selected.robot.route = selected.path;
      selected.robot.waitingReason = null;
      idle.delete(selected.robot.id);
      this.log("JOB", `${job.id} assigned to ${selected.robot.name} · score ${this.effectivePriority(job)}`);
    }
  }

  private effectivePriority(job: Job): number {
    // Aging increases the score every 12 ticks, guaranteeing queued work overtakes newer jobs.
    return job.priority * 100 + Math.floor((this.state.tick - job.createdTick) / 12) * 110;
  }

  private planAllRoutes(): void {
    const table: ReservationTable = { vertices: new Set(), edges: new Set() };
    // Every not-yet-planned robot owns its current cell for the immediate next step.
    // This keeps execution safe while still allowing the space-time search to plan
    // that robot out of a bottleneck on later time layers.
    for (const robot of this.state.robots) {
      table.vertices.add(vertexKey(robot.position, 0));
      table.vertices.add(vertexKey(robot.position, 1));
    }
    const parked = this.state.robots.filter((robot) => !robot.goal);
    for (const robot of parked) this.reserve([{ ...robot.position }], table, true);

    const active = this.state.robots
      .filter((robot) => robot.goal)
      .sort((a, b) => {
        const jobA = this.state.jobs.find((job) => job.id === a.jobId);
        const jobB = this.state.jobs.find((job) => job.id === b.jobId);
        const scoreA = jobA ? this.effectivePriority(jobA) : -1000;
        const scoreB = jobB ? this.effectivePriority(jobB) : -1000;
        const ageA = jobA?.createdTick ?? this.state.tick;
        const ageB = jobB?.createdTick ?? this.state.tick;
        const waitA = a.waitingReason ? 25 : 0;
        const waitB = b.waitingReason ? 25 : 0;
        return scoreB + waitB - scoreA - waitA || ageA - ageB || a.id.localeCompare(b.id);
      });

    for (const robot of active) {
      // Release this robot's temporary ownership so waiting in place is a valid,
      // explicit space-time action; all other robots remain protected at t+1.
      table.vertices.delete(vertexKey(robot.position, 1));
      const path = this.spaceTimePath(robot.position, robot.goal!, table);
      if (path) {
        robot.route = path;
        robot.waitingReason = path.length > 1 && samePoint(path[0], path[1]) ? WAIT : null;
        this.reserve(path, table, true);
      } else {
        robot.route = [{ ...robot.position }];
        robot.waitingReason = "No conflict-free horizon available — yielding and retrying next tick";
        this.reserve(robot.route, table, true);
      }
    }
  }

  private spaceTimePath(start: Point, goal: Point, table: ReservationTable): Point[] | null {
    if (samePoint(start, goal)) return [{ ...start }];
    const obstacles = staticObstacles(this.state.map);
    obstacles.delete(pointKey(start));
    type Node = { point: Point; time: number; cost: number; parent: Node | null };
    const open: Node[] = [{ point: { ...start }, time: 0, cost: 0, parent: null }];
    const best = new Map<string, number>([[vertexKey(start, 0), 0]]);
    const directions = [{ x: 1, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 0, y: -1 }, { x: 0, y: 0 }];

    while (open.length) {
      open.sort((a, b) => (a.cost + manhattan(a.point, goal)) - (b.cost + manhattan(b.point, goal)) || a.time - b.time || a.point.y - b.point.y || a.point.x - b.point.x);
      const current = open.shift()!;
      if (samePoint(current.point, goal)) {
        const path: Point[] = [];
        let cursor: Node | null = current;
        while (cursor) {
          path.push(cursor.point);
          cursor = cursor.parent;
        }
        return path.reverse();
      }
      if (current.time >= HORIZON) continue;

      for (const direction of directions) {
        const next = { x: current.point.x + direction.x, y: current.point.y + direction.y };
        const nextTime = current.time + 1;
        if (next.x <= 0 || next.y <= 0 || next.x >= this.state.map.width - 1 || next.y >= this.state.map.height - 1) continue;
        if (obstacles.has(pointKey(next))) continue;
        if (table.vertices.has(vertexKey(next, nextTime))) continue;
        // Reverse-edge lookup prevents two robots swapping cells in the same step.
        if (table.edges.has(edgeKey(next, current.point, nextTime))) continue;
        const stateKey = vertexKey(next, nextTime);
        const cost = current.cost + 1 + (direction.x === 0 && direction.y === 0 ? 0.15 : 0);
        if ((best.get(stateKey) ?? Infinity) <= cost) continue;
        best.set(stateKey, cost);
        open.push({ point: next, time: nextTime, cost, parent: current });
      }
    }
    return null;
  }

  private reserve(path: Point[], table: ReservationTable, holdGoal: boolean): void {
    for (let time = 1; time <= HORIZON; time += 1) {
      const current = path[Math.min(time, path.length - 1)];
      const previous = path[Math.min(time - 1, path.length - 1)];
      if (!holdGoal && time >= path.length) break;
      table.vertices.add(vertexKey(current, time));
      table.edges.add(edgeKey(previous, current, time));
    }
  }

  private log(type: LogEntry["type"], message: string): void {
    const entry: LogEntry = {
      id: `${this.state.tick}-${this.state.sequence + 1}-${this.state.events.length}`,
      sequence: this.state.sequence + 1,
      tick: this.state.tick,
      type,
      message,
    };
    this.state.events.unshift(entry);
    this.state.events = this.state.events.slice(0, MAX_EVENTS);
  }

  private commit(): void {
    this.state.sequence += 1;
    this.persist();
    const snapshot = this.getState();
    for (const listener of this.listeners) listener(snapshot, "update");
  }

  private persist(): void {
    mkdirSync(dirname(this.statePath), { recursive: true });
    const temporary = `${this.statePath}.tmp`;
    writeFileSync(temporary, JSON.stringify(this.state, null, 2));
    renameSync(temporary, this.statePath);
  }
}
