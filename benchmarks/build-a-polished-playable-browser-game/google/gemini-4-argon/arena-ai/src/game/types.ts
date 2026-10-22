export type GamePhase = 'start' | 'playing' | 'paused' | 'gameover';

export type PropKind =
  | 'crab'
  | 'cone'
  | 'traps'
  | 'umbrella'
  | 'ramp'
  | 'awning'
  | 'gust';

export type FishKind = 'sardine' | 'kingfish';

export interface WorldProp {
  active: boolean;
  id: number;
  kind: PropKind;
  x: number;
  y: number; // y relative to groundY (0 = resting on boardwalk)
  width: number;
  height: number;
  passed: boolean;
  nearMissed: boolean;
  smashed: boolean;
  smashVx: number;
  smashVy: number;
  smashRot: number;
  bounceSpring: number; // for awning trampoline sag
  bounceVel: number;
  animPhase: number;
}

export interface FishItem {
  active: boolean;
  kind: FishKind;
  x: number;
  y: number; // height above ground (negative is up in screen space, stored as worldY)
  baseY: number;
  bobPhase: number;
  collected: boolean;
  magnetized: boolean;
}

export type ParticleKind =
  | 'feather'
  | 'spark'
  | 'dust'
  | 'scale'
  | 'ring'
  | 'wind'
  | 'confetti';

export interface Particle {
  active: boolean;
  kind: ParticleKind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
  rot: number;
  vRot: number;
  gravity: number;
}

export interface FloatingPopup {
  active: boolean;
  text: string;
  subtext?: string;
  x: number;
  y: number;
  vy: number;
  color: string;
  scale: number;
  life: number;
  maxLife: number;
}

export interface Seagull {
  x: number;
  y: number;
  speed: number;
  scale: number;
  flapPhase: number;
  scaredTimer: number;
  vy: number;
}

export interface Cloud {
  x: number;
  y: number;
  width: number;
  scale: number;
  speedFactor: number;
}

export interface HighScoreEntry {
  id: string;
  tag: string;
  score: number;
  distance: number;
  fish: number;
  flips: number;
  bestCombo: number;
  date: string;
}

export interface HudSnapshot {
  phase: GamePhase;
  score: number;
  bestScore: number;
  distance: number;
  fishCount: number;
  flipsCount: number;
  combo: number;
  bestCombo: number;
  comboTimerRatio: number; // 0..1
  pouchFill: number; // 0..8
  pouchMax: number;
  feverActive: boolean;
  feverRatio: number; // 0..1
  speedKmh: number;
  isNewBest: boolean;
  crashReason: string;
  lastRunId: string | null;
}
