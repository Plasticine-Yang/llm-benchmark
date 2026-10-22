import { renderGame, RenderState } from './renderer';
import { sound } from './sound';
import { loadHighScores, loadRiderTag, saveHighScore } from './storage';
import {
  Cloud,
  FishItem,
  FishKind,
  FloatingPopup,
  GamePhase,
  HudSnapshot,
  Particle,
  ParticleKind,
  PropKind,
  Seagull,
  WorldProp,
} from './types';

const MAX_PARTICLES = 360;
const MAX_POPUPS = 28;
const MAX_PROPS = 32;
const MAX_FISH = 64;
const POUCH_MAX = 8;
const FEVER_DURATION = 5.0;
const COMBO_DURATION = 4.2;

export class PelicanGameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private rafId: number | null = null;
  private lastFrameMs = 0;

  // Viewport logical CSS pixels
  private width = 960;
  private height = 540;
  private dpr = 1;
  private groundY = 420;

  // Game Phase & Stats
  private phase: GamePhase = 'start';
  private time = 0;
  private score = 0;
  private bestScore = 0;
  private distancePx = 0;
  private fishCount = 0;
  private flipsCount = 0;
  private combo = 1;
  private bestCombo = 1;
  private comboTimer = 0;
  private fishChain = 0;
  private fishChainTimer = 0;
  private isNewBest = false;
  private crashReason = '';
  private lastRunId: string | null = null;
  private crashDelayTimer = 0;

  // Speed & Boosts
  private baseSpeed = 365;
  private currentSpeed = 365;
  private landingBoostTimer = 0;
  private pouchFill = 0;
  private feverTimer = 0;
  private feverGraceTimer = 0;
  private feverVisual = 0;

  // Juicy Feedback (Hit-stop & Damped Screen Shake)
  private hitStopTimer = 0;
  private shakeTrauma = 0;
  private shakeX = 0;
  private shakeY = 0;
  private shakeRot = 0;

  // Player Physics & Procedural Rig
  private playerX = 190;
  private playerY = 0; // <= 0; 0 is tires on ground
  private playerVy = 0;
  private playerAngle = 0;
  private grounded = true;
  private tucking = false;
  private crashed = false;
  private diveActive = false;

  // Jump / Air-Flip Timers
  private jumpHeld = false;
  private tuckHeld = false;
  private jumpHoldTime = 0;
  private jumpBufferTimer = 0;
  private coyoteTimer = 0;
  private airTime = 0;
  private flipAccumRad = 0;
  private flipsInCurrentJump = 0;
  private flipEngagedInAir = false;

  // Procedural Spring Animations
  private wheelAngle = 0;
  private pedalAngle = 0;
  private lastPedalHalfTurn = 0;
  private squashY = 1;
  private squashVel = 0;
  private pouchJiggle = 0;
  private pouchJiggleVel = 0;
  private mouthOpen = 0;
  private bellRingTimer = 0;

  // Level Spawning
  private nextSpawnX = 680;
  private propIdCounter = 1;
  private patternCount = 0;

  // Pre-allocated Object Pools (zero per-frame GC allocations)
  private clouds: Cloud[] = [];
  private seagulls: Seagull[] = [];
  private props: WorldProp[] = [];
  private fish: FishItem[] = [];
  private particles: Particle[] = [];
  private popups: FloatingPopup[] = [];

  // HUD Sync Callback
  private onHudChange: (snapshot: HudSnapshot) => void;
  private hudSyncAccum = 0;

  constructor(
    canvas: HTMLCanvasElement,
    onHudChange: (snapshot: HudSnapshot) => void
  ) {
    this.canvas = canvas;
    const context = canvas.getContext('2d', { alpha: false });
    if (!context) {
      throw new Error('Could not initialize 2D canvas context');
    }
    this.ctx = context;
    this.onHudChange = onHudChange;

    const scores = loadHighScores();
    this.bestScore = scores.length > 0 ? scores[0].score : 0;

    this.initPools();
    this.handleResize();
    this.initAmbientScene();
    this.emitHud(true);
  }

  private initPools(): void {
    for (let i = 0; i < MAX_PARTICLES; i++) {
      this.particles.push({
        active: false,
        kind: 'feather',
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        size: 5,
        color: '#FFFFFF',
        alpha: 1,
        life: 0,
        maxLife: 1,
        rot: 0,
        vRot: 0,
        gravity: 0,
      });
    }

    for (let i = 0; i < MAX_POPUPS; i++) {
      this.popups.push({
        active: false,
        text: '',
        x: 0,
        y: 0,
        vy: -50,
        color: '#FACC15',
        scale: 1,
        life: 0,
        maxLife: 0.9,
      });
    }

    for (let i = 0; i < MAX_PROPS; i++) {
      this.props.push({
        active: false,
        id: 0,
        kind: 'crab',
        x: 0,
        y: 0,
        width: 40,
        height: 30,
        passed: false,
        nearMissed: false,
        smashed: false,
        smashVx: 0,
        smashVy: 0,
        smashRot: 0,
        bounceSpring: 0,
        bounceVel: 0,
        animPhase: 0,
      });
    }

    for (let i = 0; i < MAX_FISH; i++) {
      this.fish.push({
        active: false,
        kind: 'sardine',
        x: 0,
        y: 0,
        baseY: 0,
        bobPhase: 0,
        collected: false,
        magnetized: false,
      });
    }
  }

  private initAmbientScene(): void {
    this.clouds = [];
    for (let i = 0; i < 6; i++) {
      this.clouds.push({
        x: (i * this.width) / 5 + Math.random() * 90,
        y: 44 + (i % 3) * 42 + Math.random() * 18,
        width: 90,
        scale: 0.65 + (i % 3) * 0.24,
        speedFactor: 0.05 + (i % 3) * 0.025,
      });
    }

    this.seagulls = [];
    for (let i = 0; i < 5; i++) {
      this.seagulls.push({
        x: 140 + i * 220 + Math.random() * 80,
        y: 85 + (i % 3) * 38,
        speed: 24 + Math.random() * 22,
        scale: 0.7 + (i % 3) * 0.22,
        flapPhase: Math.random() * Math.PI * 2,
        scaredTimer: 0,
        vy: 0,
      });
    }
  }

  public handleResize(): void {
    const rect = this.canvas.parentElement?.getBoundingClientRect();
    const cssW = Math.max(320, rect ? rect.width : window.innerWidth);
    const cssH = Math.max(320, rect ? rect.height : window.innerHeight);

    // Zoom camera slightly out on narrow mobile viewports so forward sightline stays generous
    const worldScale = cssW < 540 ? 0.78 : cssW < 768 ? 0.88 : 1.0;

    this.width = Math.floor(cssW / worldScale);
    this.height = Math.floor(cssH / worldScale);
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);

    this.canvas.width = Math.floor(cssW * this.dpr);
    this.canvas.height = Math.floor(cssH * this.dpr);
    this.ctx.setTransform(
      this.dpr * worldScale,
      0,
      0,
      this.dpr * worldScale,
      0,
      0
    );

    // Position boardwalk comfortably in lower quarter
    this.groundY = Math.floor(this.height * (cssW < 640 ? 0.76 : 0.79));
    this.playerX = Math.floor(
      Math.min(230, Math.max(106, this.width * (cssW < 640 ? 0.22 : 0.2)))
    );
  }

  public startLoop(): void {
    if (this.rafId !== null) return;
    this.lastFrameMs = performance.now();
    const tick = (now: number) => {
      const rawDt = (now - this.lastFrameMs) / 1000;
      this.lastFrameMs = now;
      // Clamp dt to prevent physics tunneling after tab switch
      const dt = Math.min(0.05, Math.max(0.001, rawDt));

      this.update(dt);
      this.render();
      this.rafId = requestAnimationFrame(tick);
    };
    this.rafId = requestAnimationFrame(tick);
  }

  public destroy(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  // --- PUBLIC GAME FLOW ACTIONS ---

  public startRun(): void {
    sound.unlock();
    sound.playBell();

    const scores = loadHighScores();
    this.bestScore = scores.length > 0 ? scores[0].score : 0;

    this.phase = 'playing';
    this.score = 0;
    this.distancePx = 0;
    this.fishCount = 0;
    this.flipsCount = 0;
    this.combo = 1;
    this.bestCombo = 1;
    this.comboTimer = 0;
    this.fishChain = 0;
    this.fishChainTimer = 0;
    this.isNewBest = false;
    this.crashReason = '';
    this.lastRunId = null;
    this.crashDelayTimer = 0;

    this.baseSpeed = 380;
    this.currentSpeed = 380;
    this.landingBoostTimer = 0.45; // Snappy initial pedal burst!
    this.pouchFill = 0;
    this.feverTimer = 0;
    this.feverGraceTimer = 0;
    this.feverVisual = 0;

    this.hitStopTimer = 0;
    this.shakeTrauma = 0.15;

    this.playerY = 0;
    this.playerVy = 0;
    this.playerAngle = 0;
    this.grounded = true;
    this.tucking = false;
    this.crashed = false;
    this.diveActive = false;

    this.jumpHeld = false;
    this.tuckHeld = false;
    this.jumpHoldTime = 0;
    this.jumpBufferTimer = 0;
    this.coyoteTimer = 0;
    this.airTime = 0;
    this.flipAccumRad = 0;
    this.flipsInCurrentJump = 0;
    this.flipEngagedInAir = false;

    this.squashY = 0.84;
    this.squashVel = 2.5;
    this.pouchJiggle = 0.5;
    this.pouchJiggleVel = 0;
    this.mouthOpen = 0;
    this.bellRingTimer = 0.35;

    // Clear active entities
    for (let i = 0; i < this.props.length; i++) this.props[i].active = false;
    for (let i = 0; i < this.fish.length; i++) this.fish[i].active = false;
    for (let i = 0; i < this.particles.length; i++)
      this.particles[i].active = false;
    for (let i = 0; i < this.popups.length; i++) this.popups[i].active = false;

    // Burst joyful kickoff feathers & boardwalk dust!
    this.emitFeathers(this.playerX - 18, this.groundY - 40, 6);
    this.emitDust(this.playerX - 28, this.groundY, 8);

    // Seed an immediately fun, hand-crafted opening 8 seconds right ahead!
    this.patternCount = 0;
    this.seedOpeningHook();

    this.emitHud(true);
  }

  public pause(): void {
    if (this.phase === 'playing' && !this.crashed) {
      this.phase = 'paused';
      this.jumpHeld = false;
      this.tuckHeld = false;
      this.emitHud(true);
    }
  }

  public resume(): void {
    if (this.phase === 'paused') {
      sound.unlock();
      this.phase = 'playing';
      this.lastFrameMs = performance.now();
      this.emitHud(true);
    }
  }

  public togglePause(): void {
    if (this.phase === 'playing') this.pause();
    else if (this.phase === 'paused') this.resume();
  }

  public quitToStart(): void {
    this.phase = 'start';
    this.crashed = false;
    this.playerY = 0;
    this.playerVy = 0;
    this.playerAngle = 0;
    this.grounded = true;
    this.tucking = false;
    this.feverTimer = 0;
    this.feverVisual = 0;
    this.pouchFill = 0;
    for (let i = 0; i < this.props.length; i++) this.props[i].active = false;
    for (let i = 0; i < this.fish.length; i++) this.fish[i].active = false;
    const scores = loadHighScores();
    this.bestScore = scores.length > 0 ? scores[0].score : 0;
    this.emitHud(true);
  }

  public refreshBestScore(): void {
    const scores = loadHighScores();
    this.bestScore = scores.length > 0 ? scores[0].score : 0;
    this.emitHud(true);
  }

  // --- INPUT CONTROLS (Tight Keyboard + Touch) ---

  public setJumpInput(pressed: boolean): void {
    sound.unlock();
    if (this.phase !== 'playing' || this.crashed) return;

    if (pressed && !this.jumpHeld) {
      this.jumpHeld = true;
      this.jumpBufferTimer = 0.135; // 135ms generous jump buffer!
      if (!this.grounded && this.coyoteTimer <= 0) {
        // Player explicitly pressed & held in mid-air -> engage instant backflip spin!
        this.flipEngagedInAir = true;
      }
    } else if (!pressed) {
      this.jumpHeld = false;
      this.flipEngagedInAir = false;
    }
  }

  public setTuckInput(pressed: boolean): void {
    sound.unlock();
    if (this.phase !== 'playing' || this.crashed) return;

    if (pressed && !this.tuckHeld) {
      this.tuckHeld = true;
      if (!this.grounded && !this.diveActive) {
        // Mid-air Stomp Dive!
        this.diveActive = true;
        this.flipEngagedInAir = false;
        this.playerVy = Math.max(this.playerVy + 420, 760);
        sound.playDive();
        this.emitWind(this.playerX, this.groundY + this.playerY - 30, 5);
      }
    } else if (!pressed) {
      this.tuckHeld = false;
    }
  }

  public ringBell(): void {
    sound.unlock();
    sound.playBell();
    this.bellRingTimer = 0.35;
    this.pouchJiggleVel += 4.5;

    if (this.phase === 'start' && this.grounded) {
      this.grounded = false;
      this.playerVy = -430;
      this.squashY = 1.18;
      this.emitFeathers(this.playerX - 10, this.groundY - 40, 4);
    }

    // Startle nearby cosmetic seagulls so the world reacts playfully!
    for (let i = 0; i < this.seagulls.length; i++) {
      const g = this.seagulls[i];
      if (g.x > -20 && g.x < this.width + 40) {
        g.scaredTimer = 1.1;
        g.vy = -55 - Math.random() * 45;
      }
    }
  }

  // --- CURATED FIRST-10-SECONDS HOOK + PROCEDURAL COASTAL PATTERNS ---

  private seedOpeningHook(): void {
    const startX = this.playerX + 270;

    // 1. Immediate inviting low Sardine curve (0.6s into the ride!)
    this.spawnFishArc(startX, 5, 42, -32, -92);

    // 2. Wooden Kicker Ramp + High Flip Rainbow + Golden Kingfish (~2.2s in!)
    const rampX = startX + 360;
    this.spawnProp('ramp', rampX, 0);
    this.spawnFishArc(rampX + 75, 5, 46, -135, -205, 2);

    // 3. Striped Cafe Awning Bounce Pad (~4.4s in!)
    const awningX = rampX + 490;
    this.spawnProp('awning', awningX, 0);
    this.spawnFishLine(awningX - 45, 3, 44, -24); // lower path fish under awning
    this.spawnFishArc(awningX + 40, 4, 46, -165, -230, 3); // upper bounce reward!

    // 4. First Snappy Crimson Pier Crab (~6.6s in!)
    const crabX = awningX + 430;
    this.spawnProp('crab', crabX, 0);
    this.spawnFishArc(crabX - 70, 5, 38, -55, -125);

    this.nextSpawnX = crabX + 390;
  }

  private spawnNextPattern(): void {
    this.patternCount++;
    const difficulty = Math.min(1, this.distancePx / 18000);
    // Fair spacing scales smoothly with speed so jumps NEVER become impossible
    const speedFactor = this.baseSpeed / 380;
    const gap = (340 + Math.random() * 110) * speedFactor;
    const x = this.nextSpawnX;

    // Choose varied, fun coastal set-pieces
    const roll = Math.random();

    if (roll < 0.18) {
      // Pattern A: Pier Crab + Inviting Sardine Jump Arc
      this.spawnProp('crab', x, 0);
      this.spawnFishArc(x - 76, 5, 40, -45, -130, 2);
      this.nextSpawnX = x + gap;
    } else if (roll < 0.34) {
      // Pattern B: Wooden Kicker Ramp -> Striped Awning Sky Combo!
      this.spawnProp('ramp', x, 0);
      this.spawnFishArc(x + 70, 4, 45, -140, -200);
      const awningX = x + 310 * speedFactor;
      this.spawnProp('awning', awningX, 0);
      this.spawnFishArc(awningX + 60, 5, 44, -175, -245, 2);
      if (difficulty > 0.25) {
        this.spawnProp('cone', awningX + 10, 0);
      }
      this.nextSpawnX = awningX + gap * 1.1;
    } else if (roll < 0.48 && this.patternCount >= 2) {
      // Pattern C: Runaway Low Beach Umbrella (Aero-Tuck underneath OR High-Hop over!)
      this.spawnProp('umbrella', x, -58);
      // Trail of sardines along the boardwalk encouraging a sleek Aero-Tuck!
      this.spawnFishLine(x - 70, 4, 46, -24);
      // Plus a Golden Kingfish high above for high-jumpers!
      this.spawnSingleFish('kingfish', x, -148);
      this.nextSpawnX = x + gap;
    } else if (roll < 0.62) {
      // Pattern D: Lobster Trap Vault + Tailwind Gust Ring
      this.spawnProp('traps', x, 0);
      this.spawnFishArc(x - 85, 5, 42, -65, -160, 2);
      if (Math.random() < 0.65) {
        this.spawnProp('gust', x + 150, -115);
      }
      this.nextSpawnX = x + gap * 1.05;
    } else if (roll < 0.78) {
      // Pattern E: Striped Cafe Awning Trampoline Chain!
      this.spawnProp('cone', x - 115, 0);
      this.spawnProp('awning', x + 40, 0);
      this.spawnFishArc(x + 60, 4, 45, -160, -225);
      const secondAwningX = x + 340 * speedFactor;
      this.spawnProp('awning', secondAwningX, 0);
      this.spawnProp('crab', secondAwningX, 0);
      this.spawnFishArc(secondAwningX + 55, 4, 46, -170, -240, 1);
      this.nextSpawnX = secondAwningX + gap;
    } else if (roll < 0.9 && difficulty > 0.15) {
      // Pattern F: Double Rhythm Hop (Cone -> Crab with rhythmic spacing)
      this.spawnProp('cone', x, 0);
      this.spawnFishArc(x - 60, 3, 42, -55, -115);
      const secondX = x + 285 * speedFactor;
      this.spawnProp('crab', secondX, 0);
      this.spawnFishArc(secondX - 60, 4, 42, -55, -130, 2);
      this.nextSpawnX = secondX + gap;
    } else {
      // Pattern G: Kicker Ramp Big Air over Lobster Traps!
      this.spawnProp('ramp', x, 0);
      this.spawnProp('traps', x + 145 * speedFactor, 0);
      this.spawnFishArc(x + 55, 6, 44, -135, -225, 3);
      this.nextSpawnX = x + 145 * speedFactor + gap;
    }
  }

  private spawnProp(kind: PropKind, x: number, y: number): WorldProp | null {
    for (let i = 0; i < this.props.length; i++) {
      const p = this.props[i];
      if (!p.active) {
        p.active = true;
        p.id = this.propIdCounter++;
        p.kind = kind;
        p.x = x;
        p.y = y;
        p.passed = false;
        p.nearMissed = false;
        p.smashed = false;
        p.smashVx = 0;
        p.smashVy = 0;
        p.smashRot = 0;
        p.bounceSpring = 0;
        p.bounceVel = 0;
        p.animPhase = Math.random() * Math.PI * 2;

        switch (kind) {
          case 'crab':
            p.width = 40;
            p.height = 30;
            break;
          case 'cone':
            p.width = 32;
            p.height = 42;
            break;
          case 'traps':
            p.width = 44;
            p.height = 58;
            break;
          case 'umbrella':
            p.width = 44;
            p.height = 38;
            break;
          case 'ramp':
            p.width = 76;
            p.height = 34;
            break;
          case 'awning':
            p.width = 132;
            p.height = 104;
            break;
          case 'gust':
            p.width = 36;
            p.height = 68;
            break;
        }
        return p;
      }
    }
    return null;
  }

  private spawnSingleFish(kind: FishKind, x: number, y: number): void {
    for (let i = 0; i < this.fish.length; i++) {
      const f = this.fish[i];
      if (!f.active) {
        f.active = true;
        f.kind = kind;
        f.x = x;
        f.y = y;
        f.baseY = y;
        f.bobPhase = x * 0.03;
        f.collected = false;
        f.magnetized = false;
        return;
      }
    }
  }

  private spawnFishArc(
    startX: number,
    count: number,
    stepX: number,
    edgeY: number,
    peakY: number,
    goldenIndex = -1
  ): void {
    for (let i = 0; i < count; i++) {
      const t = count === 1 ? 0.5 : i / (count - 1);
      const parabola = 4 * t * (1 - t); // 0 at ends, 1 at middle
      const y = edgeY + (peakY - edgeY) * parabola;
      const kind: FishKind = i === goldenIndex ? 'kingfish' : 'sardine';
      this.spawnSingleFish(kind, startX + i * stepX, y);
    }
  }

  private spawnFishLine(
    startX: number,
    count: number,
    stepX: number,
    y: number
  ): void {
    for (let i = 0; i < count; i++) {
      this.spawnSingleFish('sardine', startX + i * stepX, y);
    }
  }

  // --- MAIN 60FPS UPDATE ---

  private update(dt: number): void {
    this.time += dt;

    // Bell vibration timer
    if (this.bellRingTimer > 0) {
      this.bellRingTimer = Math.max(0, this.bellRingTimer - dt);
    }

    // Mouth gulp decay
    if (this.mouthOpen > 0) {
      this.mouthOpen = Math.max(0, this.mouthOpen - dt * 4.5);
    }

    // Damped spring physics for bicycle squash-and-stretch & pelican pouch jiggle
    const squashForce = (1 - this.squashY) * 190;
    this.squashVel = (this.squashVel + squashForce * dt) * Math.exp(-14 * dt);
    this.squashY += this.squashVel * dt;

    const pouchForce = -this.pouchJiggle * 170;
    this.pouchJiggleVel =
      (this.pouchJiggleVel + pouchForce * dt) * Math.exp(-10 * dt);
    this.pouchJiggle += this.pouchJiggleVel * dt;

    // Screen Shake decay
    if (this.shakeTrauma > 0) {
      this.shakeTrauma = Math.max(0, this.shakeTrauma - dt * 2.4);
      const mag = this.shakeTrauma * this.shakeTrauma;
      this.shakeX = (Math.random() * 2 - 1) * 18 * mag;
      this.shakeY = (Math.random() * 2 - 1) * 16 * mag;
      this.shakeRot = (Math.random() * 2 - 1) * 0.025 * mag;
    } else {
      this.shakeX = 0;
      this.shakeY = 0;
      this.shakeRot = 0;
    }

    // Always update particles & popups so impacts stay juicy even in hitstop/gameover
    this.updateParticles(dt);
    this.updatePopups(dt);

    if (this.phase === 'paused') {
      return;
    }

    if (this.phase === 'start') {
      // Live, charming background ride on Start Screen!
      const cruiseSpeed = 245;
      this.distancePx += cruiseSpeed * dt;
      this.wheelAngle += (cruiseSpeed * dt) / 18;
      this.pedalAngle += (cruiseSpeed * dt) / 34;
      if (!this.grounded) {
        this.playerVy += 1900 * dt;
        this.playerY += this.playerVy * dt;
        this.playerAngle = Math.max(-0.22, Math.min(0.18, this.playerVy * 0.0003));
        if (this.playerY >= 0) {
          this.playerY = 0;
          this.playerVy = 0;
          this.playerAngle = 0;
          this.grounded = true;
          this.squashY = 0.82;
          this.emitDust(this.playerX - 22, this.groundY, 5);
        }
      }
      this.updateAmbientEntities(dt, cruiseSpeed);
      return;
    }

    // Hit-stop micro-freeze for meaty impact weight!
    if (this.hitStopTimer > 0) {
      this.hitStopTimer = Math.max(0, this.hitStopTimer - dt);
      return;
    }

    if (this.crashed) {
      // Comical crash tumble settle before showing Game Over modal
      this.currentSpeed = Math.max(0, this.currentSpeed - 620 * dt);
      this.distancePx += this.currentSpeed * dt;
      this.wheelAngle += (this.currentSpeed * dt) / 18;

      if (this.playerY < 0 || this.playerVy < 0) {
        this.playerVy += 1950 * dt;
        this.playerY += this.playerVy * dt;
        this.playerAngle += 4.2 * dt;
        if (this.playerY >= 0) {
          this.playerY = 0;
          this.playerVy = -this.playerVy * 0.28;
          if (Math.abs(this.playerVy) < 90) this.playerVy = 0;
          this.emitDust(this.playerX, this.groundY, 6);
        }
      }

      this.updateAmbientEntities(dt, this.currentSpeed);
      this.scrollWorldEntities(dt, this.currentSpeed);

      if (this.phase === 'playing') {
        this.crashDelayTimer -= dt;
        if (this.crashDelayTimer <= 0) {
          this.finalizeGameOver();
        }
      }
      return;
    }

    // --- ACTIVE GAMEPLAY UPDATE ---

    // Gradually ramp base boardwalk speed with distance (capped so it stays fun & fair!)
    const targetBaseSpeed = Math.min(680, 385 + (this.distancePx / 1000) * 14);
    this.baseSpeed += (targetBaseSpeed - this.baseSpeed) * Math.min(1, dt * 2);

    // Fever Zoomies timer
    if (this.feverTimer > 0) {
      this.feverTimer -= dt;
      this.feverVisual = Math.min(1, this.feverVisual + dt * 5);
      if (Math.random() < 0.45) {
        this.emitParticle(
          'spark',
          this.playerX - 24 + Math.random() * 20,
          this.groundY + this.playerY - 25 - Math.random() * 35,
          -120 - Math.random() * 80,
          (Math.random() - 0.5) * 60,
          4 + Math.random() * 3,
          Math.random() < 0.5 ? '#FEF08A' : '#FB923C',
          0.35
        );
      }
      if (this.feverTimer <= 0) {
        this.feverTimer = 0;
        this.feverGraceTimer = 0.85; // Fair grace window coming out of Zoomies!
      }
    } else {
      this.feverVisual = Math.max(0, this.feverVisual - dt * 3);
    }

    if (this.feverGraceTimer > 0) {
      this.feverGraceTimer = Math.max(0, this.feverGraceTimer - dt);
    }

    if (this.landingBoostTimer > 0) {
      this.landingBoostTimer = Math.max(0, this.landingBoostTimer - dt);
    }

    // Aero Tuck on ground
    this.tucking = this.grounded && this.tuckHeld;

    // Effective forward speed
    let speedMult = 1.0;
    if (this.feverTimer > 0) speedMult += 0.34;
    if (this.landingBoostTimer > 0) speedMult += 0.22;
    if (this.tucking) speedMult += 0.16;

    const targetSpeed = this.baseSpeed * speedMult;
    this.currentSpeed +=
      (targetSpeed - this.currentSpeed) * Math.min(1, dt * 8);

    // Advance distance & passive pedaling score
    const frameDx = this.currentSpeed * dt;
    this.distancePx += frameDx;

    const feverMult = this.feverTimer > 0 ? 2 : 1;
    const tuckBonus = this.tucking ? 1.35 : 1.0;
    this.score += (frameDx * 0.045 * tuckBonus * feverMult);
    if (Math.floor(this.score) > this.bestScore && this.bestScore > 0) {
      this.isNewBest = true;
    }

    // Combo decay timer
    if (this.combo > 1) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) {
        this.combo = 1;
        this.comboTimer = 0;
      }
    }

    if (this.fishChainTimer > 0) {
      this.fishChainTimer -= dt;
      if (this.fishChainTimer <= 0) {
        this.fishChain = 0;
      }
    }

    // Rotate bicycle wheels & cranks with subtle wooden cadence tick
    this.wheelAngle += frameDx / 18;
    const pedalRate = this.grounded
      ? frameDx / 32
      : this.flipEngagedInAir
      ? dt * 14
      : dt * 5;
    this.pedalAngle += pedalRate;
    const halfTurns = Math.floor(this.pedalAngle / Math.PI);
    if (halfTurns > this.lastPedalHalfTurn) {
      this.lastPedalHalfTurn = halfTurns;
      if (this.grounded) {
        sound.playPedalTick();
        if (this.tucking) {
          this.emitWind(this.playerX - 38, this.groundY - 32, 1);
        }
      }
    }

    // --- JUMP, COYOTE TIME, BUFFER & BACKFLIP PHYSICS ---
    if (this.jumpBufferTimer > 0) {
      this.jumpBufferTimer = Math.max(0, this.jumpBufferTimer - dt);
    }

    if (this.grounded) {
      this.coyoteTimer = 0.105; // 105ms coyote time
      this.airTime = 0;
    } else {
      this.coyoteTimer = Math.max(0, this.coyoteTimer - dt);
      this.airTime += dt;
    }

    // Execute Bunny-Hop if buffered and eligible!
    if (this.jumpBufferTimer > 0 && (this.grounded || this.coyoteTimer > 0)) {
      this.executeBunnyHop();
    }

    if (!this.grounded) {
      // Variable jump hold lift during first 175ms of ascent
      if (this.jumpHeld && this.jumpHoldTime < 0.175 && this.playerVy < 0 && !this.diveActive) {
        this.jumpHoldTime += dt;
        this.playerVy -= 1080 * dt;
      }

      // Gravity
      const gravity = this.diveActive ? 2900 : 2050;
      this.playerVy += gravity * dt;
      this.playerY += this.playerVy * dt;

      // Air Rotation (Backflip vs Smooth Upright Leveling)
      const shouldSpinFlip =
        !this.diveActive &&
        this.jumpHeld &&
        (this.flipEngagedInAir || this.airTime > 0.165);

      if (shouldSpinFlip) {
        const spinSpeed = -8.9; // Fast, joyful backflip cadence (~0.7s per 360°)
        const dAng = spinSpeed * dt;
        this.playerAngle += dAng;
        this.flipAccumRad += Math.abs(dAng);

        if (Math.random() < 0.5) {
          this.emitParticle(
            'wind',
            this.playerX + (Math.random() - 0.5) * 40,
            this.groundY + this.playerY - 26 + (Math.random() - 0.5) * 40,
            -90,
            0,
            10,
            'rgba(255,255,255,0.75)',
            0.2
          );
        }

        // Check completed 360° Backflips! (generous 5.75 rad threshold for final snap)
        const completedCount = Math.floor((this.flipAccumRad + 0.48) / (Math.PI * 2));
        if (completedCount > this.flipsInCurrentJump) {
          this.flipsInCurrentJump = completedCount;
          this.onBackflipCompleted(completedCount);
        }
      } else {
        // Smoothly level bicycle toward nearest upright multiple of 2*PI!
        const nearestTwoPi =
          Math.round(this.playerAngle / (Math.PI * 2)) * (Math.PI * 2);
        // Add subtle natural pitch following vertical velocity when not flipping
        const naturalPitch = this.diveActive
          ? 0.28
          : Math.max(-0.26, Math.min(0.22, this.playerVy * 0.00035));
        const targetAng = nearestTwoPi + naturalPitch;
        this.playerAngle +=
          (targetAng - this.playerAngle) * Math.min(1, dt * 13);
      }

      // Check landing on Boardwalk
      if (this.playerY >= 0) {
        this.handleBoardwalkLanding();
      }
    } else {
      // Smoothly settle angle on boardwalk (slight lively wheelie during boost!)
      const targetGroundAngle =
        this.landingBoostTimer > 0 && !this.tucking ? -0.11 : 0;
      this.playerAngle +=
        (targetGroundAngle - this.playerAngle) * Math.min(1, dt * 16);
    }

    // --- UPDATE WORLD ENTITIES & COLLISIONS ---
    this.updateAmbientEntities(dt, this.currentSpeed);
    this.scrollWorldEntities(dt, this.currentSpeed);
    this.checkFishCollection(dt);
    this.checkPropInteractions();

    // Spawn ahead seamlessly
    while (this.nextSpawnX < this.width + 480) {
      this.spawnNextPattern();
    }

    // Throttled HUD sync (~15Hz) so React UI stays ultra lightweight
    this.hudSyncAccum += dt;
    if (this.hudSyncAccum >= 0.065) {
      this.hudSyncAccum = 0;
      this.emitHud(false);
    }
  }

  private executeBunnyHop(): void {
    this.grounded = false;
    this.tucking = false;
    this.diveActive = false;
    this.coyoteTimer = 0;
    this.jumpBufferTimer = 0;
    this.jumpHoldTime = 0;
    this.airTime = 0;
    this.flipAccumRad = 0;
    this.flipsInCurrentJump = 0;
    this.flipEngagedInAir = false;
    this.playerAngle = this.normalizeAngle(this.playerAngle);

    this.playerVy = -575;
    // Snappy vertical stretch on takeoff!
    this.squashY = 1.22;
    this.squashVel = -1.5;
    this.pouchJiggleVel -= 5;

    sound.playHop();
    this.emitDust(this.playerX - 24, this.groundY, 5);
    this.emitFeathers(this.playerX - 10, this.groundY - 42, 3);
  }

  private onBackflipCompleted(countInJump: number): void {
    this.flipsCount++;
    this.bumpCombo(1);

    const feverMult = this.feverTimer > 0 ? 2 : 1;
    const basePts = countInJump === 1 ? 150 : countInJump === 2 ? 300 : 500;
    const earned = basePts * this.combo * feverMult;
    this.score += earned;

    const label =
      countInJump === 1
        ? `BACKFLIP! +${earned}`
        : countInJump === 2
        ? `DOUBLE FLIP! +${earned}`
        : `MEGA FLIP! +${earned}`;

    this.spawnPopup(
      label,
      this.playerX,
      this.groundY + this.playerY - 78,
      '#4ADE80',
      1.18,
      this.combo > 1 ? `${this.combo}x COMBO` : undefined
    );

    sound.playFlipComplete(countInJump);
    this.emitFeathers(
      this.playerX,
      this.groundY + this.playerY - 34,
      8
    );
    this.emitRing(
      this.playerX,
      this.groundY + this.playerY - 28,
      '#4ADE80',
      38
    );
    this.emitHud(true);
  }

  private handleBoardwalkLanding(): void {
    const impactSpeed = this.playerVy;
    this.playerY = 0;
    this.playerVy = 0;
    this.grounded = true;

    const normAng = this.normalizeAngle(this.playerAngle);
    // Crash only if severely upside-down on landing (> ~82 degrees off upright) and not in Fever!
    if (
      Math.abs(normAng) > 1.43 &&
      this.feverTimer <= 0 &&
      this.feverGraceTimer <= 0
    ) {
      this.triggerCrash('Botched a greedy backflip!');
      return;
    }

    this.playerAngle = normAng * 0.25;

    // Satisfying tire squash on landing!
    const intensity = Math.min(1, impactSpeed / 900);
    this.squashY = Math.max(0.72, 1 - intensity * 0.26);
    this.squashVel = 1.8;
    this.pouchJiggleVel += intensity * 8;

    sound.playLand(intensity);
    this.emitDust(this.playerX - 24, this.groundY, Math.round(4 + intensity * 6));
    this.emitDust(this.playerX + 26, this.groundY, Math.round(3 + intensity * 5));

    if (this.diveActive) {
      this.shakeTrauma = Math.max(this.shakeTrauma, 0.28);
      this.diveActive = false;
    }

    // Reward clean flip landings with a forward speed burst + bell ring!
    if (this.flipsInCurrentJump > 0) {
      this.landingBoostTimer = 1.15;
      this.shakeTrauma = Math.max(this.shakeTrauma, 0.26);
      sound.playBell();
      this.bellRingTimer = 0.35;
      this.emitSparks(this.playerX - 28, this.groundY - 2, 10, '#FACC15');
    }

    this.flipAccumRad = 0;
    this.flipsInCurrentJump = 0;
    this.flipEngagedInAir = false;
  }

  private checkFishCollection(dt: number): void {
    // Beak & body collection center
    const px = this.playerX + 12;
    const py = this.groundY + this.playerY - (this.tucking ? 30 : 42);
    const magnetRange = this.feverTimer > 0 ? 230 : 62;
    const catchRadius = 46;

    for (let i = 0; i < this.fish.length; i++) {
      const f = this.fish[i];
      if (!f.active || f.collected) continue;

      const fy = this.groundY + f.y;
      const dx = px - f.x;
      const dy = py - fy;
      const distSq = dx * dx + dy * dy;

      // Magnet pull when close or during Pelican Zoomies!
      if (distSq < magnetRange * magnetRange) {
        f.magnetized = true;
      }

      if (f.magnetized) {
        const pullSpeed = this.feverTimer > 0 ? 14 : 9;
        f.x += dx * Math.min(1, dt * pullSpeed);
        f.y += (py - this.groundY - f.y) * Math.min(1, dt * pullSpeed);
      }

      if (distSq < catchRadius * catchRadius) {
        f.collected = true;
        f.active = false;
        this.onFishCaught(f.kind, f.x, fy);
      }
    }
  }

  private onFishCaught(kind: FishKind, fx: number, fy: number): void {
    const isGold = kind === 'kingfish';
    this.fishCount++;
    this.mouthOpen = 1.0;
    this.pouchJiggleVel += isGold ? 11 : 6.5;

    // Refresh combo timer so stringing fish between tricks keeps multiplier alive!
    if (this.combo > 1) {
      this.comboTimer = Math.min(COMBO_DURATION, this.comboTimer + 0.9);
    }

    // Musical ascending chain!
    this.fishChain = Math.min(7, this.fishChain + 1);
    this.fishChainTimer = 0.85;
    sound.playFish(this.fishChain - 1, isGold);

    const feverMult = this.feverTimer > 0 ? 2 : 1;
    const basePts = isGold ? 100 : 25;
    const pts = basePts * this.combo * feverMult;
    this.score += pts;

    if (isGold) {
      this.bumpCombo(1);
      this.spawnPopup(`KINGFISH! +${pts}`, fx, fy - 18, '#FACC15', 1.12);
      this.emitSparks(fx, fy, 12, '#FACC15');
    } else {
      this.spawnPopup(`+${pts}`, fx, fy - 12, '#FEF08A', 0.88);
      this.emitSparks(fx, fy, 5, '#7DD3FC');
    }

    // Fill Pelican Gular Throat Pouch!
    if (this.feverTimer <= 0) {
      this.pouchFill = Math.min(POUCH_MAX, this.pouchFill + (isGold ? 2 : 1));
      if (this.pouchFill >= POUCH_MAX) {
        this.activatePelicanZoomies();
      }
    }

    this.emitHud(true);
  }

  private activatePelicanZoomies(): void {
    this.pouchFill = 0;
    this.feverTimer = FEVER_DURATION;
    this.hitStopTimer = 0.045;
    this.shakeTrauma = Math.max(this.shakeTrauma, 0.45);
    this.pouchJiggleVel += 16;
    this.bumpCombo(1);

    sound.playFeverStart();
    this.spawnPopup(
      'PELICAN ZOOMIES!',
      this.playerX + 30,
      this.groundY + this.playerY - 88,
      '#FACC15',
      1.3,
      '2x SCORE • INVINCIBLE SMASH!'
    );
    this.emitRing(
      this.playerX,
      this.groundY + this.playerY - 35,
      '#FACC15',
      65
    );
    this.emitFeathers(this.playerX, this.groundY + this.playerY - 35, 12);
  }

  private checkPropInteractions(): void {
    const px = this.playerX;
    const pyBottom = this.playerY; // 0 on boardwalk, negative in air
    const playerHalfW = 24;
    const playerHeight = this.tucking ? 34 : 62;
    const pyTop = pyBottom - playerHeight;

    for (let i = 0; i < this.props.length; i++) {
      const p = this.props[i];
      if (!p.active || p.smashed) continue;

      const dx = p.x - px;

      // 1. HELPFUL WOODEN KICKER RAMP
      if (p.kind === 'ramp') {
        if (!p.passed && Math.abs(dx) < p.width * 0.48 && pyBottom >= -22) {
          p.passed = true;
          this.grounded = false;
          this.diveActive = false;
          this.playerY = -p.height - 2;
          this.playerVy = -720; // Big exhilarating ramp launch!
          this.airTime = 0.18;
          this.flipAccumRad = 0;
          this.flipsInCurrentJump = 0;
          this.playerAngle = -0.32;
          this.squashY = 1.24;
          this.landingBoostTimer = Math.max(this.landingBoostTimer, 0.7);

          sound.playRampLaunch();
          this.emitSparks(p.x + 24, this.groundY - p.height, 9, '#FACC15');
          this.emitFeathers(px, this.groundY - 45, 5);
          this.spawnPopup('LAUNCH! +50', px, this.groundY - 76, '#FDE047', 0.96);
          this.score += 50 * this.combo;
        }
        continue;
      }

      // 2. STRIPED BEACH CAFE AWNING (Trampoline on top, safe lane underneath!)
      if (p.kind === 'awning') {
        const canopyTop = -p.height;
        const withinCanopyX = Math.abs(dx) < p.width * 0.48;
        // Bounce if descending near canopy roof!
        if (
          withinCanopyX &&
          this.playerVy >= -40 &&
          pyBottom >= canopyTop - 16 &&
          pyBottom <= canopyTop + 26
        ) {
          const megaBounce = this.diveActive;
          this.diveActive = false;
          this.grounded = false;
          this.playerY = canopyTop - 4;
          this.playerVy = megaBounce ? -860 : -735;
          this.airTime = 0.18;
          this.playerAngle = this.normalizeAngle(this.playerAngle) * 0.2 - 0.18;
          this.flipAccumRad = 0;
          this.flipsInCurrentJump = 0;
          this.squashY = 0.74;
          this.squashVel = 3.5;

          // Animate elastic canopy sag!
          p.bounceSpring = megaBounce ? 22 : 15;
          p.bounceVel = 0;

          this.bumpCombo(1);
          const pts = (megaBounce ? 120 : 75) * this.combo;
          this.score += pts;

          if (megaBounce) {
            this.hitStopTimer = 0.038;
            this.shakeTrauma = Math.max(this.shakeTrauma, 0.32);
          }

          sound.playAwningBounce();
          this.emitRing(
            px,
            this.groundY + canopyTop,
            '#FB7185',
            megaBounce ? 52 : 38
          );
          this.emitFeathers(px, this.groundY + canopyTop - 20, 6);
          this.spawnPopup(
            megaBounce ? `MEGA BOING! +${pts}` : `BOING! +${pts}`,
            px,
            this.groundY + canopyTop - 42,
            '#FDA4AF',
            megaBounce ? 1.15 : 1.0,
            `${this.combo}x COMBO`
          );
          this.emitHud(true);
        }
        continue;
      }

      // 3. TAILWIND GUST RING
      if (p.kind === 'gust') {
        if (
          !p.passed &&
          Math.abs(dx) < 34 &&
          Math.abs((pyBottom - 30) - p.y) < 48
        ) {
          p.passed = true;
          p.active = false;
          this.landingBoostTimer = 1.4;
          this.playerVy = Math.min(this.playerVy, -260);
          this.bumpCombo(1);
          const pts = 80 * this.combo;
          this.score += pts;
          sound.playRampLaunch();
          this.emitRing(p.x, this.groundY + p.y, '#2DD4BF', 48);
          this.emitWind(px, this.groundY + p.y, 8);
          this.spawnPopup(`TAILWIND! +${pts}`, p.x, this.groundY + p.y - 30, '#5EEAD4', 1.05);
          this.emitHud(true);
        }
        continue;
      }

      // 4. HAZARDS (Crab, Cone, Lobster Traps, Low Umbrella)
      // Tight, fair hitboxes (slightly smaller than visual sprite so grazes feel heroic!)
      const hazHalfW = p.width * 0.36;
      let hazTop = p.y - p.height * 0.84;
      let hazBottom = p.y;

      if (p.kind === 'umbrella') {
        // Hovering umbrella canopy occupies [y - 22, y + 14] -> leaves bottom 44px open for Aero Tuck!
        hazTop = p.y - 22;
        hazBottom = p.y + 14;
      }

      const overlapX = Math.abs(dx) < playerHalfW + hazHalfW;
      const overlapY = pyBottom > hazTop && pyTop < hazBottom;

      if (overlapX && overlapY) {
        if (this.feverTimer > 0 || this.feverGraceTimer > 0) {
          // SMASH HAZARD COMICALLY IN PELICAN ZOOMIES!
          p.smashed = true;
          p.smashVx = this.currentSpeed * 1.35 + 220;
          p.smashVy = -460 - Math.random() * 180;
          this.shakeTrauma = Math.max(this.shakeTrauma, 0.3);
          const pts = 80 * this.combo;
          this.score += pts;
          sound.playSmash();
          this.emitSparks(p.x, this.groundY + p.y - 16, 12, '#FB923C');
          this.spawnPopup(`SMASH! +${pts}`, p.x, this.groundY + p.y - 38, '#FB923C', 1.08);
          this.emitHud(true);
        } else {
          // Trigger Crash!
          const reasonMap: Record<string, string> = {
            crab: 'Pinched by a snappy pier crab!',
            cone: 'Clipped a boardwalk cone!',
            traps: 'Tangled in stacked lobster traps!',
            umbrella: 'Bonked a runaway beach umbrella!',
          };
          this.triggerCrash(reasonMap[p.kind] || 'Wiped out on the boardwalk!');
          return;
        }
      } else if (!p.nearMissed && dx < -playerHalfW && dx > -playerHalfW - 45) {
        // Check Near-Miss ("CLOSE SHAVE!") when skimming within 24px of hazard!
        const verticalClearance = Math.min(
          Math.abs(pyBottom - hazTop),
          Math.abs(pyTop - hazBottom)
        );
        if (verticalClearance < 26) {
          p.nearMissed = true;
          const pts = 45 * this.combo;
          this.score += pts;
          sound.playNearMiss();
          this.emitSparks(px, this.groundY + pyBottom - 16, 6, '#38BDF8');
          this.spawnPopup(
            `CLOSE SHAVE! +${pts}`,
            px + 10,
            this.groundY + pyTop - 16,
            '#38BDF8',
            0.94
          );
        }
      }
    }
  }

  private bumpCombo(amount: number): void {
    this.combo = Math.min(10, this.combo + amount);
    if (this.combo > this.bestCombo) {
      this.bestCombo = this.combo;
    }
    this.comboTimer = COMBO_DURATION;
  }

  private triggerCrash(reason: string): void {
    this.crashed = true;
    this.crashReason = reason;
    this.crashDelayTimer = 0.55; // Brief comedic tumble before modal slides in
    this.hitStopTimer = 0.065;
    this.shakeTrauma = 0.85;
    this.playerVy = -360;
    this.grounded = false;

    sound.playCrash();
    this.emitFeathers(this.playerX, this.groundY + this.playerY - 32, 22);
    this.emitSparks(this.playerX, this.groundY + this.playerY - 20, 14, '#EF4444');
    this.emitDust(this.playerX, this.groundY, 12);
    this.spawnPopup(
      'SQUAWK!!',
      this.playerX,
      this.groundY + this.playerY - 68,
      '#FCA5A5',
      1.25
    );
  }

  private finalizeGameOver(): void {
    const finalScore = Math.floor(this.score);
    const finalDist = Math.floor(this.distancePx / 16);
    const saved = saveHighScore({
      tag: loadRiderTag(),
      score: finalScore,
      distance: finalDist,
      fish: this.fishCount,
      flips: this.flipsCount,
      bestCombo: this.bestCombo,
    });

    this.bestScore = saved.scores.length > 0 ? saved.scores[0].score : finalScore;
    this.isNewBest = saved.isNewBest;
    this.lastRunId = saved.madeLeaderboard ? saved.savedId : null;
    this.phase = 'gameover';
    this.emitHud(true);
  }

  private normalizeAngle(rad: number): number {
    let a = rad % (Math.PI * 2);
    if (a > Math.PI) a -= Math.PI * 2;
    if (a < -Math.PI) a += Math.PI * 2;
    return a;
  }

  // --- WORLD SCROLLING & POOLS ---

  private updateAmbientEntities(dt: number, speed: number): void {
    for (let i = 0; i < this.clouds.length; i++) {
      const c = this.clouds[i];
      c.x -= (speed * c.speedFactor + 8) * dt;
      if (c.x < -140) {
        c.x = this.width + 100 + Math.random() * 80;
        c.y = 38 + Math.random() * Math.max(60, this.groundY * 0.34);
      }
    }

    for (let i = 0; i < this.seagulls.length; i++) {
      const g = this.seagulls[i];
      if (g.scaredTimer > 0) {
        g.scaredTimer -= dt;
        g.y += g.vy * dt;
        g.x += 55 * dt;
      } else {
        g.x -= (speed * 0.14 + g.speed) * dt;
        g.y += Math.sin(this.time * 2 + g.flapPhase) * 8 * dt;
      }

      if (g.x < -60 || g.y < -40 || g.x > this.width + 160) {
        g.x = this.width + 60 + Math.random() * 140;
        g.y = 70 + Math.random() * Math.max(70, this.groundY * 0.38);
        g.scaredTimer = 0;
        g.vy = 0;
      }
    }
  }

  private scrollWorldEntities(dt: number, speed: number): void {
    const dx = speed * dt;
    this.nextSpawnX -= dx;

    for (let i = 0; i < this.props.length; i++) {
      const p = this.props[i];
      if (!p.active) continue;

      if (p.smashed) {
        p.x += (p.smashVx - speed) * dt;
        p.y += p.smashVy * dt;
        p.smashVy += 1400 * dt;
        p.smashRot += 11 * dt;
        if (p.x > this.width + 150 || p.y > 220) {
          p.active = false;
        }
        continue;
      }

      p.x -= dx;
      // Subtlecrab scuttling motion!
      if (p.kind === 'crab') {
        p.x += Math.sin(this.time * 6 + p.animPhase) * 28 * dt;
      }

      // Awning trampoline spring recovery
      if (p.kind === 'awning' && (Math.abs(p.bounceSpring) > 0.05 || Math.abs(p.bounceVel) > 0.05)) {
        const force = -p.bounceSpring * 210;
        p.bounceVel = (p.bounceVel + force * dt) * Math.exp(-9 * dt);
        p.bounceSpring += p.bounceVel * dt;
      }

      if (p.x < -180) {
        p.active = false;
      }
    }

    for (let i = 0; i < this.fish.length; i++) {
      const f = this.fish[i];
      if (!f.active) continue;
      if (!f.magnetized) {
        f.x -= dx;
      }
      if (f.x < -80) {
        f.active = false;
      }
    }
  }

  // --- PARTICLE & POPUP POOL EMITTERS ---

  private emitParticle(
    kind: ParticleKind,
    x: number,
    y: number,
    vx: number,
    vy: number,
    size: number,
    color: string,
    maxLife: number,
    gravity = 0
  ): void {
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      if (!p.active) {
        p.active = true;
        p.kind = kind;
        p.x = x;
        p.y = y;
        p.vx = vx;
        p.vy = vy;
        p.size = size;
        p.color = color;
        p.alpha = 1;
        p.life = 0;
        p.maxLife = maxLife;
        p.rot = Math.random() * Math.PI * 2;
        p.vRot = (Math.random() - 0.5) * 9;
        p.gravity = gravity;
        return;
      }
    }
  }

  private emitFeathers(x: number, y: number, count: number): void {
    for (let i = 0; i < count; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = 55 + Math.random() * 140;
      this.emitParticle(
        'feather',
        x + (Math.random() - 0.5) * 16,
        y + (Math.random() - 0.5) * 16,
        Math.cos(ang) * spd - 50,
        Math.sin(ang) * spd - 60,
        5.5 + Math.random() * 3.5,
        Math.random() < 0.75 ? '#FFFFFF' : '#FEF3C7',
        0.65 + Math.random() * 0.45,
        240
      );
    }
  }

  private emitDust(x: number, y: number, count: number): void {
    for (let i = 0; i < count; i++) {
      this.emitParticle(
        'dust',
        x + (Math.random() - 0.5) * 14,
        y - 2,
        -60 - Math.random() * 110,
        -20 - Math.random() * 65,
        4 + Math.random() * 5,
        Math.random() < 0.5 ? '#FDE68A' : '#FDBA74',
        0.32 + Math.random() * 0.2,
        80
      );
    }
  }

  private emitSparks(
    x: number,
    y: number,
    count: number,
    color: string
  ): void {
    for (let i = 0; i < count; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = 80 + Math.random() * 190;
      this.emitParticle(
        'spark',
        x,
        y,
        Math.cos(ang) * spd,
        Math.sin(ang) * spd - 40,
        5 + Math.random() * 4,
        color,
        0.35 + Math.random() * 0.22,
        360
      );
    }
  }

  private emitRing(x: number, y: number, color: string, size: number): void {
    this.emitParticle('ring', x, y, 0, 0, size, color, 0.36, 0);
  }

  private emitWind(x: number, y: number, count: number): void {
    for (let i = 0; i < count; i++) {
      this.emitParticle(
        'wind',
        x + (Math.random() - 0.5) * 26,
        y + (Math.random() - 0.5) * 28,
        -220 - Math.random() * 140,
        (Math.random() - 0.5) * 20,
        12 + Math.random() * 10,
        'rgba(255, 255, 255, 0.8)',
        0.22,
        0
      );
    }
  }

  private updateParticles(dt: number): void {
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      if (!p.active) continue;
      p.life += dt;
      if (p.life >= p.maxLife) {
        p.active = false;
        continue;
      }

      p.vy += p.gravity * dt;
      if (p.kind === 'feather') {
        // Gentle air drag + leaf-like flutter sway!
        p.vx *= Math.exp(-3 * dt);
        p.vy = Math.min(p.vy, 95);
        p.x += (p.vx + Math.sin(this.time * 10 + i) * 32) * dt;
        p.y += p.vy * dt;
        p.rot = Math.sin(this.time * 8 + i) * 0.6;
      } else {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.rot += p.vRot * dt;
      }
    }
  }

  private spawnPopup(
    text: string,
    x: number,
    y: number,
    color: string,
    scale = 1,
    subtext?: string
  ): void {
    for (let i = 0; i < this.popups.length; i++) {
      const pop = this.popups[i];
      if (!pop.active) {
        pop.active = true;
        pop.text = text;
        pop.subtext = subtext;
        pop.x = Math.max(75, Math.min(this.width - 75, x));
        pop.y = Math.max(68, y);
        pop.vy = -58;
        pop.color = color;
        pop.scale = scale;
        pop.life = 0;
        pop.maxLife = 0.92;
        return;
      }
    }
  }

  private updatePopups(dt: number): void {
    for (let i = 0; i < this.popups.length; i++) {
      const pop = this.popups[i];
      if (!pop.active) continue;
      pop.life += dt;
      if (pop.life >= pop.maxLife) {
        pop.active = false;
        continue;
      }
      pop.y += pop.vy * dt;
      pop.vy *= Math.exp(-2.2 * dt);
    }
  }

  // --- RENDER & HUD SNAPSHOT ---

  private render(): void {
    const squashX = 1 / Math.max(0.65, this.squashY);

    const state: RenderState = {
      width: this.width,
      height: this.height,
      groundY: this.groundY,
      time: this.time,
      distancePx: this.distancePx,
      speed: this.currentSpeed,
      feverFactor: this.feverVisual,
      shakeX: this.shakeX,
      shakeY: this.shakeY,
      shakeRot: this.shakeRot,
      playerX: this.playerX,
      playerY: this.playerY,
      playerVy: this.playerVy,
      playerAngle: this.playerAngle,
      grounded: this.grounded,
      tucking: this.tucking,
      crashed: this.crashed,
      wheelAngle: this.wheelAngle,
      pedalAngle: this.pedalAngle,
      squashX,
      squashY: this.squashY,
      pouchFill: this.pouchFill,
      pouchMax: POUCH_MAX,
      pouchJiggle: this.pouchJiggle,
      mouthOpen: this.mouthOpen,
      bellRingTimer: this.bellRingTimer,
      flipProgressRad: this.flipAccumRad,
      clouds: this.clouds,
      seagulls: this.seagulls,
      props: this.props,
      fish: this.fish,
      particles: this.particles,
      popups: this.popups,
    };

    renderGame(this.ctx, state);
  }

  private emitHud(force: boolean): void {
    if (!force && this.phase !== 'playing') return;
    const scoreInt = Math.floor(this.score);
    this.onHudChange({
      phase: this.phase,
      score: scoreInt,
      bestScore: Math.max(this.bestScore, scoreInt),
      distance: Math.floor(this.distancePx / 16),
      fishCount: this.fishCount,
      flipsCount: this.flipsCount,
      combo: this.combo,
      bestCombo: this.bestCombo,
      comboTimerRatio:
        this.combo > 1 ? Math.max(0, this.comboTimer / COMBO_DURATION) : 0,
      pouchFill: this.pouchFill,
      pouchMax: POUCH_MAX,
      feverActive: this.feverTimer > 0,
      feverRatio:
        this.feverTimer > 0 ? Math.max(0, this.feverTimer / FEVER_DURATION) : 0,
      speedKmh: Math.round((this.currentSpeed / 380) * 28),
      isNewBest: this.isNewBest,
      crashReason: this.crashReason,
      lastRunId: this.lastRunId,
    });
  }
}
