export interface Point {
  x: number;
  y: number;
}

export interface TimePoint extends Point {
  t: number;
}

export type CellType =
  | 'FLOOR'
  | 'WALL'
  | 'SHELF'
  | 'PICKUP'
  | 'WORKSTATION'
  | 'STAGING';

export interface GridCell {
  x: number;
  y: number;
  type: CellType;
  blocked: boolean;
  bottleneck: boolean;
  shelfId?: string;
  pickupForShelfId?: string;
  workstationId?: string;
  stagingForRobotId?: string;
}

export interface ShelfInfo {
  id: string;
  sku: string;
  cell: Point;
  pickupCell: Point;
  zone: 'NW' | 'NE' | 'SW' | 'SE';
}

export interface WorkstationInfo {
  id: string;
  name: string;
  cell: Point;
}

export interface WarehouseGrid {
  width: number;
  height: number;
  cells: GridCell[][];
  shelves: ShelfInfo[];
  workstations: WorkstationInfo[];
  stagingBays: Point[];
  bottleneckCells: Point[];
}

export type JobPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

export type JobStatus =
  | 'QUEUED'
  | 'ASSIGNED'
  | 'PICKING_UP'
  | 'IN_TRANSIT'
  | 'COMPLETED'
  | 'CANCELLED';

export interface TransportJob {
  id: string;
  shelfId: string;
  workstationId: string;
  priority: JobPriority;
  status: JobStatus;
  assignedRobotId: string | null;
  createdTick: number;
  startedTick: number | null;
  completedTick: number | null;
  effectiveScore: number;
}

export type RobotPhase =
  | 'IDLE'
  | 'TO_PICKUP'
  | 'PICKING_UP'
  | 'TO_DROPOFF'
  | 'DROPPING_OFF'
  | 'RETURNING';

export type RobotStatus =
  | 'IDLE'
  | 'MOVING_TO_PICKUP'
  | 'PICKING_UP'
  | 'MOVING_TO_DROPOFF'
  | 'DROPPING_OFF'
  | 'RETURNING'
  | 'WAITING'
  | 'BLOCKED';

export type WaitReasonCode =
  | 'NONE'
  | 'CONFLICT_YIELD'
  | 'AISLE_RESERVATION'
  | 'OBSTACLE_REPLAN'
  | 'PATH_UNREACHABLE'
  | 'PREEMPTED_BY_HIGH_PRIORITY'
  | 'PICKUP_DWELL'
  | 'DROPOFF_DWELL';

export type Heading = 'N' | 'S' | 'E' | 'W' | 'NONE';

export interface RobotState {
  id: string;
  color: string;
  pos: Point;
  homeBay: Point;
  heading: Heading;
  phase: RobotPhase;
  status: RobotStatus;
  currentJobId: string | null;
  targetShelfId: string | null;
  targetWorkstationId: string | null;
  carryingShelfId: string | null;
  dwellRemaining: number;
  plannedPath: TimePoint[];
  waitReason: string | null;
  waitReasonCode: WaitReasonCode;
  waitTicks: number;
  totalWaitTicks: number;
  totalDistance: number;
  completedJobs: number;
  replannedAtTick: number | null;
}

export type EventKind =
  | 'SIM_STARTED'
  | 'SIM_PAUSED'
  | 'SIM_RESUMED'
  | 'SIM_STEPPED'
  | 'SIM_RESET'
  | 'JOB_CREATED'
  | 'JOB_ASSIGNED'
  | 'JOB_PICKUP'
  | 'JOB_COMPLETED'
  | 'JOB_CANCELLED'
  | 'OBSTACLE_ADDED'
  | 'OBSTACLE_REMOVED'
  | 'ROBOT_REPLANNED'
  | 'ROBOT_WAITING'
  | 'ROBOT_BLOCKED'
  | 'PRIORITY_PREEMPTION';

export interface SimEvent {
  id: string;
  seq: number;
  tick: number;
  kind: EventKind;
  severity: 'info' | 'warn' | 'alert' | 'success';
  message: string;
  robotId?: string;
  jobId?: string;
  cell?: Point;
  timestamp: string;
}

export interface SimStats {
  completedJobs: number;
  activeJobs: number;
  queuedJobs: number;
  waitingRobots: number;
  blockedRobots: number;
  blockedCellsCount: number;
  totalMoves: number;
  replanCount: number;
}

export interface SimulationSnapshot {
  runId: string;
  seed: string;
  seq: number;
  tick: number;
  running: boolean;
  tickIntervalMs: number;
  grid: WarehouseGrid;
  robots: RobotState[];
  jobs: TransportJob[];
  events: SimEvent[];
  stats: SimStats;
}

export interface SimulationUpdatePayload {
  runId: string;
  seed: string;
  seq: number;
  tick: number;
  running: boolean;
  tickIntervalMs: number;
  blockedCells: Point[];
  robots: RobotState[];
  jobs: TransportJob[];
  newEvents: SimEvent[];
  stats: SimStats;
  grid?: WarehouseGrid;
}

export type WsServerMessage =
  | {
      type: 'SNAPSHOT';
      seq: number;
      data: SimulationSnapshot;
    }
  | {
      type: 'STATE_UPDATE';
      seq: number;
      reason: string;
      data: SimulationUpdatePayload;
    }
  | {
      type: 'ERROR';
      message: string;
    };

export type WsClientMessage =
  | { type: 'REQUEST_SNAPSHOT' }
  | { type: 'PING' };

export const DEFAULT_SEED = 'warehouse-alpha-2026';
export const PICKUP_DWELL_TICKS = 2;
export const DROPOFF_DWELL_TICKS = 2;
export const DEFAULT_TICK_INTERVAL_MS = 350;
