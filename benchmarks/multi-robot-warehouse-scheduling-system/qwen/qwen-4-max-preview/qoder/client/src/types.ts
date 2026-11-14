export interface Pt { x: number; y: number }

export interface Shelf { id: string; x: number; y: number; w: number; h: number; faces: Pt[] }
export interface Station { id: string; x: number; y: number }

export interface Meta {
  w: number;
  h: number;
  cells: number[];
  corridor: number[];
  shelves: Shelf[];
  stations: Station[];
  homes: Pt[];
  robotCount: number;
  cellTypes: { EMPTY: number; WALL: number; SHELF: number; STATION: number };
}

export type Phase = 'idle' | 'toPick' | 'loading' | 'toDrop' | 'unloading' | 'relocating';

export interface RobotView {
  id: string;
  color: string;
  x: number;
  y: number;
  home: Pt;
  phase: Phase;
  jobId: string | null;
  priority: number | null;
  shelfId: string | null;
  stationId: string | null;
  path: Pt[];
  stuckTicks: number;
  waitingOn: string | null;
  waitReason: string | null;
  planFailed: boolean;
  distanceTravelled: number;
  jobsDone: number;
  relocateTarget: Pt | null;
}

export type JobStatus = 'queued' | 'assigned' | 'carrying' | 'done' | 'cancelled';

export interface Job {
  id: string;
  shelfId: string;
  stationId: string;
  priority: number;
  status: JobStatus;
  robotId: string | null;
  createdAtTick: number;
  assignedAtTick: number | null;
  pickedAtTick: number | null;
  completedAtTick: number | null;
}

export interface LogEntry { id: number; tick: number; level: string; text: string }

export interface Stats {
  created: number;
  completed: number;
  cancelled: number;
  replans: number;
  deadlockResolutions: number;
  yields: number;
  violations: number;
  invariantChecks: number;
}

export interface Constants {
  HORIZON: number;
  LOAD_TICKS: number;
  UNLOAD_TICKS: number;
  STUCK_TICKS: number;
  ESCALATE_TICKS: number;
  AGING_TICKS: number;
}

export interface Snapshot {
  type: 'snapshot';
  seq: number;
  runId: number;
  tick: number;
  running: boolean;
  tps: number;
  seed: number;
  blocked: number[];
  robots: RobotView[];
  jobs: Job[];
  logs: LogEntry[];
  stats: Stats;
  meta: Meta;
  constants: Constants;
}

export interface Delta {
  type: 'delta';
  seq: number;
  runId: number;
  tick: number;
  running: boolean;
  tps: number;
  seed: number;
  blocked: number[];
  robots: RobotView[];
  jobs: Job[];
  stats: Stats;
  logs: LogEntry[];
}

export type SimMessage = Snapshot | Delta;

export interface SimState {
  seq: number;
  runId: number;
  tick: number;
  running: boolean;
  tps: number;
  seed: number;
  blocked: number[];
  robots: RobotView[];
  jobs: Job[];
  logs: LogEntry[];
  stats: Stats;
  meta: Meta | null;
  constants: Constants | null;
}

export type ConnectionStatus = 'connecting' | 'live' | 'reconnecting' | 'offline';
export type Transport = 'websocket' | 'sse' | 'none';
export type MapMode = 'inspect' | 'block' | 'shelf' | 'station';