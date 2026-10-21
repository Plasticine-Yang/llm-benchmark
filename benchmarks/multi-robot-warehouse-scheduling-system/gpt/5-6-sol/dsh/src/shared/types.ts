export interface Point { x: number; y: number }
export type Priority = 1 | 2 | 3 | 4 | 5;
export type RobotMode = "IDLE" | "TO_PICKUP" | "TO_WORKSTATION" | "RETURNING";
export type JobStatus = "QUEUED" | "TO_PICKUP" | "TO_WORKSTATION" | "COMPLETED";

export interface Shelf {
  id: string;
  label: string;
  position: Point;
  pickup: Point;
}

export interface Workstation {
  id: string;
  label: string;
  position: Point;
  color: string;
}

export interface WarehouseMap {
  width: number;
  height: number;
  walls: Point[];
  shelves: Shelf[];
  workstations: Workstation[];
  bottlenecks: Point[];
  blocked: Point[];
}

export interface Robot {
  id: string;
  name: string;
  color: string;
  position: Point;
  home: Point;
  mode: RobotMode;
  jobId: string | null;
  goal: Point | null;
  route: Point[];
  waitingReason: string | null;
  completedJobs: number;
  distance: number;
}

export interface Job {
  id: string;
  shelfId: string;
  workstationId: string;
  priority: Priority;
  status: JobStatus;
  robotId: string | null;
  createdTick: number;
  assignedTick: number | null;
  completedTick: number | null;
}

export interface LogEntry {
  id: string;
  sequence: number;
  tick: number;
  type: "SYSTEM" | "JOB" | "MOVE" | "WAIT" | "BLOCK" | "CONTROL";
  message: string;
}

export interface SimulationState {
  schemaVersion: 1;
  seed: number;
  sequence: number;
  tick: number;
  running: boolean;
  stepMs: number;
  map: WarehouseMap;
  robots: Robot[];
  jobs: Job[];
  events: LogEntry[];
  metrics: { moves: number; waits: number; completedJobs: number };
}

export interface StreamEnvelope {
  sequence: number;
  kind: "snapshot" | "update";
  state: SimulationState;
}
