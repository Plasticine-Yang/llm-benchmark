import { WebSocket } from 'ws';
import {
  DEFAULT_SEED,
  DEFAULT_TICK_INTERVAL_MS,
  JobPriority,
  Point,
  SimEvent,
  SimulationSnapshot,
  SimulationUpdatePayload,
  WsServerMessage,
} from '../shared/types.js';
import {
  cancelQueuedJob,
  computeStats,
  createInitialEngineState,
  createTransportJob,
  EngineState,
  PendingEvent,
  replanAllRobots,
  setCellBlocked,
  stepSimulationTick,
} from './scheduler.js';
import { WarehouseStore } from './store.js';

export class SimManager {
  private state: EngineState;
  private seq: number;
  private running: boolean;
  private tickIntervalMs: number;
  private events: SimEvent[] = [];
  private timer: ReturnType<typeof setInterval> | null = null;
  private readonly clients = new Set<WebSocket>();
  private eventCounter = 0;

  constructor(private readonly store: WarehouseStore, defaultSeed = DEFAULT_SEED) {
    const loaded = this.store.load();
    if (loaded) {
      this.state = loaded.state;
      this.seq = loaded.seq;
      this.running = loaded.running;
      this.tickIntervalMs = loaded.tickIntervalMs;
      this.events = loaded.events;
      replanAllRobots(this.state, { reason: 'NORMAL' });
    } else {
      this.state = createInitialEngineState(defaultSeed);
      this.seq = 1;
      this.running = true;
      this.tickIntervalMs = DEFAULT_TICK_INTERVAL_MS;
      const bootEvent = this.buildEvents(
        [
          {
            kind: 'SIM_STARTED',
            severity: 'info',
            message: `Simulation initialized with deterministic seed "${defaultSeed}"`,
          },
        ],
        this.seq
      );
      this.events = bootEvent;
      this.store.saveState(
        this.state,
        this.seq,
        this.running,
        this.tickIntervalMs,
        bootEvent,
        true
      );
    }
  }

  startLoop(): void {
    this.stopLoop();
    if (!this.running) return;
    this.timer = setInterval(() => {
      if (this.running) {
        this.advanceOneTick();
      }
    }, this.tickIntervalMs);
  }

  stopLoop(): void {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  attachClient(ws: WebSocket): void {
    this.clients.add(ws);
    this.sendToClient(ws, {
      type: 'SNAPSHOT',
      seq: this.seq,
      data: this.getSnapshot(),
    });

    ws.on('close', () => {
      this.clients.delete(ws);
    });
    ws.on('error', () => {
      this.clients.delete(ws);
    });
    ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw.toString()) as { type?: string };
        if (msg.type === 'REQUEST_SNAPSHOT') {
          this.sendToClient(ws, {
            type: 'SNAPSHOT',
            seq: this.seq,
            data: this.getSnapshot(),
          });
        }
      } catch {
        // Ignore malformed client WS messages
      }
    });
  }

  getClientCount(): number {
    return this.clients.size;
  }

  getSeq(): number {
    return this.seq;
  }

  getSnapshot(): SimulationSnapshot {
    return {
      runId: this.state.runId,
      seed: this.state.seed,
      seq: this.seq,
      tick: this.state.tick,
      running: this.running,
      tickIntervalMs: this.tickIntervalMs,
      grid: this.state.grid,
      robots: this.state.robots,
      jobs: this.state.jobs,
      events: this.events.slice(-150),
      stats: computeStats(this.state),
    };
  }

  private getBlockedCells(): Point[] {
    const blocked: Point[] = [];
    for (let y = 0; y < this.state.grid.height; y++) {
      for (let x = 0; x < this.state.grid.width; x++) {
        if (this.state.grid.cells[y][x].blocked) {
          blocked.push({ x, y });
        }
      }
    }
    return blocked;
  }

  private buildEvents(pending: PendingEvent[], seq: number): SimEvent[] {
    const ts = new Date().toISOString();
    return pending.map((p) => {
      this.eventCounter += 1;
      return {
        id: `ev-${seq}-${this.eventCounter}`,
        seq,
        tick: this.state.tick,
        kind: p.kind,
        severity: p.severity,
        message: p.message,
        robotId: p.robotId,
        jobId: p.jobId,
        cell: p.cell,
        timestamp: ts,
      };
    });
  }

  private commitAndBroadcast(
    reason: string,
    pendingEvents: PendingEvent[],
    options?: { replaceRunData?: boolean; sendFullSnapshot?: boolean }
  ): void {
    this.seq += 1;
    const newEvents = this.buildEvents(pendingEvents, this.seq);
    if (newEvents.length > 0) {
      this.events.push(...newEvents);
      if (this.events.length > 250) {
        this.events = this.events.slice(-200);
      }
    }

    this.store.saveState(
      this.state,
      this.seq,
      this.running,
      this.tickIntervalMs,
      newEvents,
      options?.replaceRunData ?? false
    );

    if (options?.sendFullSnapshot) {
      this.broadcast({
        type: 'SNAPSHOT',
        seq: this.seq,
        data: this.getSnapshot(),
      });
      return;
    }

    const payload: SimulationUpdatePayload = {
      runId: this.state.runId,
      seed: this.state.seed,
      seq: this.seq,
      tick: this.state.tick,
      running: this.running,
      tickIntervalMs: this.tickIntervalMs,
      blockedCells: this.getBlockedCells(),
      robots: this.state.robots,
      jobs: this.state.jobs,
      newEvents,
      stats: computeStats(this.state),
    };

    this.broadcast({
      type: 'STATE_UPDATE',
      seq: this.seq,
      reason,
      data: payload,
    });
  }

  private sendToClient(ws: WebSocket, msg: WsServerMessage): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(msg));
    }
  }

  private broadcast(msg: WsServerMessage): void {
    const serialized = JSON.stringify(msg);
    for (const client of this.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(serialized);
      }
    }
  }

  advanceOneTick(): SimulationSnapshot {
    const events = stepSimulationTick(this.state);
    this.commitAndBroadcast('TICK', events);
    return this.getSnapshot();
  }

  pause(): SimulationSnapshot {
    if (!this.running) return this.getSnapshot();
    this.running = false;
    this.stopLoop();
    this.commitAndBroadcast('SIM_PAUSED', [
      {
        kind: 'SIM_PAUSED',
        severity: 'info',
        message: `Simulation paused at tick #${this.state.tick}`,
      },
    ]);
    return this.getSnapshot();
  }

  resume(): SimulationSnapshot {
    if (this.running) return this.getSnapshot();
    this.running = true;
    this.startLoop();
    this.commitAndBroadcast('SIM_RESUMED', [
      {
        kind: 'SIM_RESUMED',
        severity: 'info',
        message: `Simulation resumed at tick #${this.state.tick}`,
      },
    ]);
    return this.getSnapshot();
  }

  stepSingle(): SimulationSnapshot {
    if (this.running) {
      this.running = false;
      this.stopLoop();
    }
    const events = stepSimulationTick(this.state);
    events.unshift({
      kind: 'SIM_STEPPED',
      severity: 'info',
      message: `Single-step advanced to tick #${this.state.tick}`,
    });
    this.commitAndBroadcast('SIM_STEPPED', events);
    return this.getSnapshot();
  }

  setSpeed(tickIntervalMs: number): SimulationSnapshot {
    const clamped = Math.max(100, Math.min(2000, Math.round(tickIntervalMs)));
    this.tickIntervalMs = clamped;
    if (this.running) {
      this.startLoop();
    }
    this.commitAndBroadcast('SPEED_CHANGED', []);
    return this.getSnapshot();
  }

  reset(seed?: string, autoStart?: boolean): SimulationSnapshot {
    const targetSeed = seed?.trim() ? seed.trim() : this.state.seed;
    const wasRunning = autoStart !== undefined ? autoStart : this.running;
    this.stopLoop();
    this.state = createInitialEngineState(targetSeed);
    this.running = wasRunning;
    this.events = [];

    this.commitAndBroadcast(
      'SIM_RESET',
      [
        {
          kind: 'SIM_RESET',
          severity: 'warn',
          message: `Simulation reset to tick #0 using deterministic seed "${targetSeed}"`,
        },
      ],
      { replaceRunData: true, sendFullSnapshot: true }
    );

    if (this.running) {
      this.startLoop();
    }
    return this.getSnapshot();
  }

  createJob(
    shelfId: string,
    workstationId: string,
    priority: JobPriority
  ): { ok: boolean; error?: string; snapshot?: SimulationSnapshot; jobId?: string } {
    const result = createTransportJob(this.state, shelfId, workstationId, priority);
    if (result.error || !result.job) {
      return { ok: false, error: result.error ?? 'Failed to create job' };
    }
    this.commitAndBroadcast('JOB_CREATED', result.events);
    return { ok: true, jobId: result.job.id, snapshot: this.getSnapshot() };
  }

  createJobBatch(
    specs: Array<{ shelfId: string; workstationId: string; priority: JobPriority }>
  ): { ok: boolean; error?: string; snapshot?: SimulationSnapshot; jobIds?: string[] } {
    const allEvents: PendingEvent[] = [];
    const jobIds: string[] = [];

    for (const spec of specs) {
      const result = createTransportJob(
        this.state,
        spec.shelfId,
        spec.workstationId,
        spec.priority
      );
      if (result.error || !result.job) {
        return { ok: false, error: result.error ?? 'Failed to create batch job' };
      }
      allEvents.push(...result.events);
      jobIds.push(result.job.id);
    }

    this.commitAndBroadcast('JOB_BATCH_CREATED', allEvents);
    return { ok: true, jobIds, snapshot: this.getSnapshot() };
  }

  cancelJob(jobId: string): { ok: boolean; error?: string; snapshot?: SimulationSnapshot } {
    const res = cancelQueuedJob(this.state, jobId);
    if (!res.ok) return { ok: false, error: res.error };
    this.commitAndBroadcast('JOB_CANCELLED', res.events);
    return { ok: true, snapshot: this.getSnapshot() };
  }

  toggleBlockCell(
    x: number,
    y: number,
    blocked?: boolean
  ): { ok: boolean; blocked?: boolean; error?: string; snapshot?: SimulationSnapshot } {
    const res = setCellBlocked(this.state, x, y, blocked);
    if (!res.ok) return { ok: false, error: res.error };
    this.commitAndBroadcast('OBSTACLE_TOGGLED', res.events);
    return { ok: true, blocked: res.blocked, snapshot: this.getSnapshot() };
  }
}
