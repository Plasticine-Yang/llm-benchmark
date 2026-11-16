import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import {
  DEFAULT_TICK_INTERVAL_MS,
  JobPriority,
  JobStatus,
  Point,
  RobotState,
  SimEvent,
  TransportJob,
} from '../shared/types.js';
import { EngineState } from './scheduler.js';
import { generateWarehouse } from './warehouseGenerator.js';

export interface PersistedSnapshot {
  state: EngineState;
  seq: number;
  running: boolean;
  tickIntervalMs: number;
  events: SimEvent[];
}

interface SimMetaRow {
  run_id: string;
  seed: string;
  seq: number;
  tick: number;
  running: number;
  tick_interval_ms: number;
  prng_state: number;
  next_job_num: number;
  replan_count: number;
  blocked_cells_json: string;
  robots_json: string;
}

interface JobRow {
  id: string;
  shelf_id: string;
  workstation_id: string;
  priority: JobPriority;
  status: JobStatus;
  assigned_robot_id: string | null;
  created_tick: number;
  started_tick: number | null;
  completed_tick: number | null;
  effective_score: number;
}

interface EventRow {
  id: string;
  seq: number;
  tick: number;
  kind: SimEvent['kind'];
  severity: SimEvent['severity'];
  message: string;
  robot_id: string | null;
  job_id: string | null;
  cell_json: string | null;
  timestamp: string;
}

export class WarehouseStore {
  private readonly db: DatabaseSync;

  constructor(dbPath: string) {
    if (dbPath !== ':memory:') {
      fs.mkdirSync(path.dirname(dbPath), { recursive: true });
    }
    this.db = new DatabaseSync(dbPath);
    if (dbPath !== ':memory:') {
      this.db.exec('PRAGMA journal_mode = WAL; PRAGMA synchronous = NORMAL;');
    }
    this.initSchema();
  }

  private initSchema(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS sim_meta (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        run_id TEXT NOT NULL,
        seed TEXT NOT NULL,
        seq INTEGER NOT NULL,
        tick INTEGER NOT NULL,
        running INTEGER NOT NULL,
        tick_interval_ms INTEGER NOT NULL,
        prng_state INTEGER NOT NULL,
        next_job_num INTEGER NOT NULL,
        replan_count INTEGER NOT NULL,
        blocked_cells_json TEXT NOT NULL,
        robots_json TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS jobs (
        id TEXT PRIMARY KEY,
        run_id TEXT NOT NULL,
        shelf_id TEXT NOT NULL,
        workstation_id TEXT NOT NULL,
        priority TEXT NOT NULL,
        status TEXT NOT NULL,
        assigned_robot_id TEXT,
        created_tick INTEGER NOT NULL,
        started_tick INTEGER,
        completed_tick INTEGER,
        effective_score INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS events (
        id TEXT PRIMARY KEY,
        seq INTEGER NOT NULL,
        run_id TEXT NOT NULL,
        tick INTEGER NOT NULL,
        kind TEXT NOT NULL,
        severity TEXT NOT NULL,
        message TEXT NOT NULL,
        robot_id TEXT,
        job_id TEXT,
        cell_json TEXT,
        timestamp TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_events_seq ON events(seq DESC);
    `);
  }

  load(): PersistedSnapshot | null {
    const meta = this.db
      .prepare('SELECT * FROM sim_meta WHERE id = 1')
      .get() as SimMetaRow | undefined;
    if (!meta) return null;

    const generated = generateWarehouse(meta.seed);
    const blockedCells = JSON.parse(meta.blocked_cells_json) as Point[];
    for (const pt of blockedCells) {
      if (
        pt.y >= 0 &&
        pt.y < generated.grid.height &&
        pt.x >= 0 &&
        pt.x < generated.grid.width
      ) {
        generated.grid.cells[pt.y][pt.x].blocked = true;
      }
    }

    const robots = JSON.parse(meta.robots_json) as RobotState[];

    const jobRows = this.db
      .prepare('SELECT * FROM jobs WHERE run_id = ? ORDER BY created_tick ASC, id ASC')
      .all(meta.run_id) as unknown as JobRow[];

    const jobs: TransportJob[] = jobRows.map((row) => ({
      id: row.id,
      shelfId: row.shelf_id,
      workstationId: row.workstation_id,
      priority: row.priority,
      status: row.status,
      assignedRobotId: row.assigned_robot_id,
      createdTick: row.created_tick,
      startedTick: row.started_tick,
      completedTick: row.completed_tick,
      effectiveScore: row.effective_score,
    }));

    const eventRows = this.db
      .prepare('SELECT * FROM events WHERE run_id = ? ORDER BY seq DESC LIMIT 200')
      .all(meta.run_id) as unknown as EventRow[];

    const events: SimEvent[] = eventRows.reverse().map((row) => ({
      id: row.id,
      seq: row.seq,
      tick: row.tick,
      kind: row.kind,
      severity: row.severity,
      message: row.message,
      robotId: row.robot_id ?? undefined,
      jobId: row.job_id ?? undefined,
      cell: row.cell_json ? (JSON.parse(row.cell_json) as Point) : undefined,
      timestamp: row.timestamp,
    }));

    return {
      state: {
        runId: meta.run_id,
        seed: meta.seed,
        tick: meta.tick,
        prngState: meta.prng_state,
        nextJobNum: meta.next_job_num,
        replanCount: meta.replan_count,
        grid: generated.grid,
        robots,
        jobs,
      },
      seq: meta.seq,
      running: Boolean(meta.running),
      tickIntervalMs: meta.tick_interval_ms || DEFAULT_TICK_INTERVAL_MS,
      events,
    };
  }

  saveState(
    state: EngineState,
    seq: number,
    running: boolean,
    tickIntervalMs: number,
    newEvents: SimEvent[],
    replaceRunData = false
  ): void {
    const blockedCells: Point[] = [];
    for (let y = 0; y < state.grid.height; y++) {
      for (let x = 0; x < state.grid.width; x++) {
        if (state.grid.cells[y][x].blocked) {
          blockedCells.push({ x, y });
        }
      }
    }

    this.db.exec('BEGIN IMMEDIATE');
    try {
      this.db
        .prepare(
          `INSERT INTO sim_meta (
            id, run_id, seed, seq, tick, running, tick_interval_ms,
            prng_state, next_job_num, replan_count, blocked_cells_json, robots_json, updated_at
          ) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            run_id = excluded.run_id,
            seed = excluded.seed,
            seq = excluded.seq,
            tick = excluded.tick,
            running = excluded.running,
            tick_interval_ms = excluded.tick_interval_ms,
            prng_state = excluded.prng_state,
            next_job_num = excluded.next_job_num,
            replan_count = excluded.replan_count,
            blocked_cells_json = excluded.blocked_cells_json,
            robots_json = excluded.robots_json,
            updated_at = excluded.updated_at`
        )
        .run(
          state.runId,
          state.seed,
          seq,
          state.tick,
          running ? 1 : 0,
          tickIntervalMs,
          state.prngState,
          state.nextJobNum,
          state.replanCount,
          JSON.stringify(blockedCells),
          JSON.stringify(state.robots),
          new Date().toISOString()
        );

      if (replaceRunData) {
        this.db.prepare('DELETE FROM jobs').run();
        this.db.prepare('DELETE FROM events').run();
      }

      const upsertJob = this.db.prepare(
        `INSERT INTO jobs (
          id, run_id, shelf_id, workstation_id, priority, status,
          assigned_robot_id, created_tick, started_tick, completed_tick, effective_score
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          status = excluded.status,
          assigned_robot_id = excluded.assigned_robot_id,
          started_tick = excluded.started_tick,
          completed_tick = excluded.completed_tick,
          effective_score = excluded.effective_score`
      );

      for (const job of state.jobs) {
        upsertJob.run(
          job.id,
          state.runId,
          job.shelfId,
          job.workstationId,
          job.priority,
          job.status,
          job.assignedRobotId,
          job.createdTick,
          job.startedTick,
          job.completedTick,
          job.effectiveScore
        );
      }

      if (newEvents.length > 0) {
        const insertEvent = this.db.prepare(
          `INSERT OR REPLACE INTO events (
            id, seq, run_id, tick, kind, severity, message, robot_id, job_id, cell_json, timestamp
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        );
        for (const ev of newEvents) {
          insertEvent.run(
            ev.id,
            ev.seq,
            state.runId,
            ev.tick,
            ev.kind,
            ev.severity,
            ev.message,
            ev.robotId ?? null,
            ev.jobId ?? null,
            ev.cell ? JSON.stringify(ev.cell) : null,
            ev.timestamp
          );
        }
        // Keep events table bounded to latest 300 rows
        this.db
          .prepare(
            `DELETE FROM events WHERE id NOT IN (
              SELECT id FROM events ORDER BY seq DESC LIMIT 300
            )`
          )
          .run();
      }

      this.db.exec('COMMIT');
    } catch (err) {
      this.db.exec('ROLLBACK');
      throw err;
    }
  }

  close(): void {
    this.db.close();
  }
}
