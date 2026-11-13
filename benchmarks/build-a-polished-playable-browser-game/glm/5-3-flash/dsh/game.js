/* ============================================================
   PELICAN EXPRESS — a juicy sunset endless-runner
   Single-file engine: fixed-timestep update, canvas renderer,
   WebAudio synth SFX, localStorage high scores.
   ============================================================ */
'use strict';

/* ---------------- Canvas & sizing ---------------- */
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d', { alpha: false });
let W = 0, H = 0, DPR = 1, GY = 0;            // GY = ground line y
let skyCache = null;

function resize() {
  DPR = Math.min(window.devicePixelRatio || 1, 2);
  W = window.innerWidth;
  H = window.innerHeight;
  canvas.width = Math.round(W * DPR);
  canvas.height = Math.round(H * DPR);
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  GY = Math.round(H * 0.78);
  buildSky();
  buildScenery();
}
window.addEventListener('resize', resize);

/* ---------------- Tiny helpers ---------------- */
const rand = (a, b) => a + Math.random() * (b - a);
const randi = (a, b) => Math.floor(rand(a, b + 1));
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const TAU = Math.PI * 2;

function seeded(n) {           // deterministic pseudo-random from integer
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

/* ---------------- Audio (synth, no assets) ---------------- */
let AC = null, master = null, muted = false;
function initAudio() {
  if (AC) { if (AC.state === 'suspended') AC.resume(); return; }
  try {
    AC = new (window.AudioContext || window.webkitAudioContext)();
    master = AC.createGain();
    master.gain.value = muted ? 0 : 0.5;
    master.connect(AC.destination);
  } catch (e) { AC = null; }
}
function tone(freq, dur, type, vol, slideTo, delay) {
  if (!AC || muted) return;
  const t0 = AC.currentTime + (delay || 0);
  const o = AC.createOscillator(), g = AC.createGain();
  o.type = type || 'sine';
  o.frequency.setValueAtTime(freq, t0);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  g.gain.setValueAtTime(vol || 0.2, t0);
  g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  o.connect(g); g.connect(master);
  o.start(t0); o.stop(t0 + dur + 0.02);
}
function noise(dur, vol, delay) {
  if (!AC || muted) return;
  const t0 = AC.currentTime + (delay || 0);
  const len = Math.floor(AC.sampleRate * dur);
  const buf = AC.createBuffer(1, len, AC.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = AC.createBufferSource(); src.buffer = buf;
  const g = AC.createGain(); g.gain.value = vol || 0.2;
  const f = AC.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 900;
  src.connect(f); f.connect(g); g.connect(master);
  src.start(t0);
}
const SFX = {
  jump()   { tone(320, 0.18, 'square', 0.12, 640); },
  land()   { noise(0.09, 0.16); tone(140, 0.1, 'sine', 0.18, 80); },
  fish(c)  { const p = 660 * Math.pow(1.06, Math.min(c, 12)); tone(p, 0.12, 'sine', 0.16, p * 1.5); },
  crash()  { noise(0.4, 0.4); tone(220, 0.5, 'sawtooth', 0.22, 55); tone(180, 0.35, 'square', 0.14, 40, 0.05); },
  click()  { tone(500, 0.07, 'square', 0.1, 700); },
  record() { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.16, 'triangle', 0.16, null, i * 0.11)); },
  mile()   { tone(880, 0.1, 'triangle', 0.14, 1175); tone(1175, 0.14, 'triangle', 0.12, null, 0.09); },
};

/* ---------------- High scores (localStorage) ---------------- */
const HS_KEY = 'pelicanExpress.scores.v1';
function loadScores() {
  try { return JSON.parse(localStorage.getItem(HS_KEY)) || []; }
  catch (e) { return []; }
}
function saveScores(list) {
  try { localStorage.setItem(HS_KEY, JSON.stringify(list)); } catch (e) {}
}
function renderScoreTable(listEl, scores, freshIdx) {
  listEl.innerHTML = '';
  scores.slice(0, 5).forEach((s, i) => {
    const li = document.createElement('li');
    if (i === freshIdx) li.className = 'fresh';
    const d = new Date(s.t);
    const ds = `${d.getMonth() + 1}/${d.getDate()}`;
    li.innerHTML = `<span><b>#${i + 1}</b>${s.f}🐟 · ${ds}</span><span class="pts">${s.s}</span>`;
    listEl.appendChild(li);
  });
}
function refreshTables(freshIdx) {
  const scores = loadScores();
  const show = scores.length > 0;
  for (const [tbl, listEl] of [[el.scoresStart, el.scoresListStart], [el.scoresOver, el.scoresListOver]]) {
    tbl.classList.toggle('hidden', !show);
    if (show) renderScoreTable(listEl, scores, freshIdx);
  }
  el.bestStart.textContent = scores.length ? scores[0].s : 0;
}

/* ---------------- DOM refs ---------------- */
const $ = (id) => document.getElementById(id);
const el = {
  hud: $('hud'), score: $('score'), fishCount: $('fish-count'), combo: $('combo'),
  mute: $('btn-mute'), pause: $('btn-pause'),
  scrStart: $('screen-start'), btnStart: $('btn-start'), bestStart: $('best-start'),
  scoresStart: $('scores-start'), scoresListStart: $('scores-list-start'),
  scrPause: $('screen-pause'), btnResume: $('btn-resume'), btnQuit: $('btn-quit'),
  scrOver: $('screen-over'), overTitle: $('over-title'), overSub: $('over-sub'),
  overScore: $('over-score'), overFish: $('over-fish'), overDist: $('over-dist'),
  newRecord: $('new-record'), scoresOver: $('scores-over'), scoresListOver: $('scores-list-over'),
  btnRetry: $('btn-retry'),
};

/* ---------------- Game constants ---------------- */
const CFG = {
  gravity: 2600,
  jumpV: 1030,
  jumpCut: 0.42,          // velocity kept on early release
  coyote: 0.09,
  buffer: 0.11,
  fastFall: 4200,
  startSpeed: 330,
  maxSpeed: 760,
  rampTime: 95,           // seconds to reach max speed
  playerX: 0.2,           // fraction of width
  standW: 40, standH: 72,
  duckW: 44,  duckH: 34,
  wheelR: 17,
};

/* ---------------- State ---------------- */
const S = { START: 0, PLAY: 1, PAUSE: 2, DYING: 3, OVER: 4 };
let state = S.START;
let last = 0, acc = 0;
const STEP = 1 / 120;

const player = {
  y: 0, vy: 0, onGround: true,
  ducking: false, duckHeldKey: false, duckHeldTouch: false,
  coyote: 0, buffer: 0, jumpHeld: false,
  squash: 0, stretch: 0,      // deformed scale offsets
  legPhase: 0, crashed: false, crashT: 0,
};
let speed = CFG.startSpeed;
let dist = 0;                 // world distance scrolled (px)
let fishScore = 0, fishGot = 0, score = 0;
let combo = 0, comboT = 0, comboBest = 0;
let nextMilestone = 500;
let obstacles = [], fishes = [], parts = [], popups = [], speedLines = [];
let nextSpawnDist = 0, nextFishDist = 0, lastGroundObsX = -1e9;
let shakeT = 0, shakeMag = 0, flashT = 0, timeScale = 1;
let overLockT = 0, dieT = 0;
let clouds = [], palms = [], lamps = [];
let hudScore = -1, hudFish = -1;

/* ---------------- Scenery (rebuilt on resize) ---------------- */
function buildSky() {
  const c = document.createElement('canvas');
  c.width = 2; c.height = Math.max(2, Math.round(H));
  const g = c.getContext('2d');
  const grad = g.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0.00, '#221048');
  grad.addColorStop(0.30, '#5b2a86');
  grad.addColorStop(0.52, '#c0457c');
  grad.addColorStop(0.68, '#ff7b54');
  grad.addColorStop(0.80, '#ffb45e');
  grad.addColorStop(1.00, '#ffd98e');
  g.fillStyle = grad;
  g.fillRect(0, 0, 2, H);
  skyCache = c;
}
function buildScenery() {
  clouds = [];
  const n = Math.max(5, Math.round(W / 260));
  for (let i = 0; i < n; i++) {
    clouds.push({
      x: seeded(i * 3 + 1) * (W + 300),
      y: H * (0.08 + seeded(i * 3 + 2) * 0.34),
      s: 0.6 + seeded(i * 3 + 3) * 1.1,
      sp: 8 + seeded(i * 7) * 14,
    });
  }
  palms = [];
  const pn = Math.ceil(W / 340) + 2;
  for (let i = 0; i < pn; i++) {
    palms.push({
      x: i * 340 + seeded(i * 11) * 160,
      h: H * (0.30 + seeded(i * 13) * 0.18),
      lean: (seeded(i * 17) - 0.5) * 0.3,
    });
  }
  lamps = [];
  const ln = Math.ceil(W / 620) + 1;
  for (let i = 0; i < ln; i++) lamps.push({ x: i * 620 + 120 });
}

/* ---------------- Input ---------------- */
const keys = new Set();
function pressJump() {
  initAudio();
  if (state === S.START) { startGame(); return; }
  if (state === S.OVER) { if (overLockT <= 0) restart(); return; }
  if (state === S.PLAY) player.buffer = CFG.buffer;
  if (state === S.PAUSE) togglePause();
}
function releaseJump() { player.jumpHeld = false; }
function setDuckKey(v) { player.duckHeldKey = v; }

window.addEventListener('keydown', (e) => {
  if (e.repeat) return;
  const k = e.code;
  if (['Space', 'ArrowUp', 'ArrowDown', 'KeyW', 'KeyS'].includes(k)) e.preventDefault();
  keys.add(k);
  if (k === 'Space' || k === 'ArrowUp' || k === 'KeyW' || k === 'Enter') {
    player.jumpHeld = true; pressJump();
  }
  if (k === 'ArrowDown' || k === 'KeyS') setDuckKey(true);
  if (k === 'KeyP' || k === 'Escape') {
    if (state === S.PLAY || state === S.PAUSE) togglePause();
  }
  if (k === 'KeyM') toggleMute();
  if (k === 'KeyR' && state === S.OVER && overLockT <= 0) restart();
});
window.addEventListener('keyup', (e) => {
  const k = e.code;
  keys.delete(k);
  if (k === 'Space' || k === 'ArrowUp' || k === 'KeyW' || k === 'Enter') releaseJump();
  if (k === 'ArrowDown' || k === 'KeyS') setDuckKey(false);
});

/* Touch: tap = jump; swipe down (or 2nd finger) = duck */
let activeTouch = null; // {id, y0, t0, turnedDuck}
canvas.addEventListener('touchstart', (e) => {
  e.preventDefault();
  initAudio();
  for (const t of e.changedTouches) {
    if (state === S.PLAY) {
      if (activeTouch === null) {
        activeTouch = { id: t.identifier, y0: t.clientY, t0: performance.now(), turnedDuck: false };
        pressJump();
      } else {
        player.duckHeldTouch = true;   // 2nd finger holds the duck
      }
    } else {
      pressJump();
    }
  }
}, { passive: false });
canvas.addEventListener('touchmove', (e) => {
  e.preventDefault();
  if (!activeTouch) return;
  for (const t of e.changedTouches) {
    if (t.identifier === activeTouch.id) {
      if (!activeTouch.turnedDuck && t.clientY - activeTouch.y0 > 42) {
        activeTouch.turnedDuck = true;
        player.duckHeldTouch = true;
      }
    }
  }
}, { passive: false });
function endTouch(e) {
  for (const t of e.changedTouches) {
    if (activeTouch && t.identifier === activeTouch.id) {
      activeTouch = null;
      player.duckHeldTouch = false;
    } else {
      player.duckHeldTouch = false;
    }
  }
}
canvas.addEventListener('touchend', (e) => { e.preventDefault(); endTouch(e); }, { passive: false });
canvas.addEventListener('touchcancel', (e) => { endTouch(e); }, { passive: false });

document.addEventListener('visibilitychange', () => {
  if (document.hidden && state === S.PLAY) togglePause(true);
});

/* ---------------- Buttons ---------------- */
el.btnStart.addEventListener('click', () => { initAudio(); startGame(); });
el.btnRetry.addEventListener('click', () => { if (overLockT <= 0) restart(); });
el.btnResume.addEventListener('click', () => togglePause());
el.btnQuit.addEventListener('click', () => quitToStart());
el.pause.addEventListener('click', () => { if (state === S.PLAY || state === S.PAUSE) togglePause(); });
el.mute.addEventListener('click', toggleMute);
function toggleMute() {
  muted = !muted;
  el.mute.textContent = muted ? '🔇' : '🔊';
  try { localStorage.setItem('pelicanExpress.muted', muted ? '1' : '0'); } catch (e) {}
  if (master) master.gain.value = muted ? 0 : 0.5;
}
try { if (localStorage.getItem('pelicanExpress.muted') === '1') { muted = true; el.mute.textContent = '🔇'; } } catch (e) {}

/* ---------------- Flow control ---------------- */
function show(elm, on) { elm.classList.toggle('hidden', !on); }
function startGame() {
  resetRun();
  state = S.PLAY;
  show(el.scrStart, false); show(el.scrOver, false); show(el.scrPause, false);
  show(el.hud, true);
  SFX.click();
}
function restart() { startGame(); }
function quitToStart() {
  state = S.START;
  combo = 0;
  el.combo.classList.add('hidden');
  show(el.scrPause, false); show(el.scrOver, false); show(el.scrStart, true);
  show(el.hud, false);
  refreshTables(-1);
  SFX.click();
}
function togglePause(force) {
  if (state === S.PLAY) {
    state = S.PAUSE;
    show(el.scrPause, true);
  } else if (state === S.PAUSE && !force) {
    state = S.PLAY;
    show(el.scrPause, false);
    last = performance.now();
  }
  SFX.click();
}
function resetRun() {
  speed = CFG.startSpeed;
  dist = 0; fishScore = 0; fishGot = 0; score = 0;
  combo = 0; comboT = 0; comboBest = 0; nextMilestone = 500;
  obstacles = []; fishes = []; parts = []; popups = []; speedLines = [];
  nextSpawnDist = 520; nextFishDist = 260; lastGroundObsX = -1e9;
  shakeT = 0; flashT = 0; timeScale = 1;
  player.y = 0; player.vy = 0; player.onGround = true;
  player.duckHeldKey = false; player.duckHeldTouch = false;
  player.coyote = 0; player.buffer = 0; player.jumpHeld = false;
  player.squash = 0; player.stretch = 0; player.crashed = false;
  hudScore = -1; hudFish = -1;
  updateHUD(true);
}

/* ---------------- Spawning ---------------- */
function speedRamp() {
  return lerp(CFG.startSpeed, CFG.maxSpeed, clamp(dist / (CFG.rampTime * CFG.startSpeed * 1.15), 0, 1));
}
function spawnObstacle() {
  const d = clamp(dist / 9000, 0, 1);         // difficulty 0..1
  const roll = Math.random();
  let type;
  if (roll < 0.34) type = 'cone';
  else if (roll < 0.58) type = 'crate';
  else if (roll < 0.72 && d > 0.15) type = 'crate2';
  else if (roll < 0.92 && d > 0.08) type = 'gull';
  else type = 'cone';
  if (type === 'gull') {
    obstacles.push({
      type, x: W + 80, w: 46, h: 34,
      baseY: GY - 40 - rand(0, 14),           // bottom edge of the gull
      phase: rand(0, TAU), bobA: rand(4, 9),
    });
  } else {
    const jumpLen = speed * 0.62;
    if (W + 80 - lastGroundObsX < jumpLen + 130) return; // fairness gap
    const h = type === 'cone' ? randi(30, 38) : type === 'crate' ? 46 : 78;
    const w = type === 'cone' ? 34 : type === 'crate' ? 44 : 44;
    obstacles.push({ type, x: W + 80, w, h, baseY: GY });
    lastGroundObsX = W + 80;
  }
}
function spawnFishPattern() {
  const roll = Math.random();
  const x0 = W + 60;
  if (roll < 0.4) {
    // ground line of 4
    for (let i = 0; i < 4; i++) fishes.push({ x: x0 + i * 46, y: GY - 46, r: 13, t: rand(0, TAU), got: false });
  } else if (roll < 0.75) {
    // arc — invites a jump
    const n = 6, span = 260;
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1);
      fishes.push({
        x: x0 + t * span, y: GY - 60 - Math.sin(t * Math.PI) * 110,
        r: 13, t: rand(0, TAU), got: false,
      });
    }
  } else {
    // single high-value golden fish
    fishes.push({ x: x0, y: GY - 130 - rand(0, 40), r: 17, t: 0, got: false, gold: true });
  }
}

/* ---------------- Update (fixed step) ---------------- */
function update(dt) {
  if (state === S.DYING) {
    dieT += dt;
    timeScale = lerp(timeScale, 0.12, dt * 6);
    stepWorld(dt * timeScale, true);
    stepParticles(dt);
    if (dieT > 0.85) doGameOver();
    return;
  }
  if (state !== S.PLAY) { stepParticles(dt); return; }

  speed = speedRamp();
  stepWorld(dt, false);
  updateHUD();

  // combo timer
  if (combo > 0) {
    comboT -= dt;
    if (comboT <= 0) { combo = 0; el.combo.classList.add('hidden'); }
  }
  if (score >= nextMilestone) {
    nextMilestone += 500;
    popups.push({ x: CFG.playerX * W + 40, y: player.screenY0 - 120, txt: nextMilestone - 500 + '! ★', life: 1.1, size: 26, color: '#ffc75f', vy: -55 });
    flashT = 0.22;
    SFX.mile();
  }
}
function stepWorld(dt, dying) {
  dist += speed * dt;

  // --- player physics ---
  const p = player;
  p.ducking = (p.duckHeldKey || p.duckHeldTouch) && (p.onGround || p.vy > -80);
  p.buffer -= dt; p.coyote -= dt;
  if (!dying) {
    if (p.buffer > 0 && (p.onGround || p.coyote > 0)) {
      p.vy = -CFG.jumpV;
      p.onGround = false; p.coyote = 0; p.buffer = 0;
      p.stretch = 1;
      burst(p.px + 6, GY, 8, '#e8d5b0', { up: 130, spread: 150, size: [2, 5], grav: 500, life: 0.5 });
      SFX.jump();
    }
    p.vy += CFG.gravity * dt * (p.vy > 0 || p.duckHeldKey || p.duckHeldTouch ? (p.duckHeldKey || p.duckHeldTouch ? CFG.fastFall / CFG.gravity + 1 : 1) : 1);
    if (!p.jumpHeld && p.vy < -320) p.vy = -320 + (p.vy + 320) * CFG.jumpCut;
    p.y += p.vy * dt;
    if (p.y >= 0) {          // y is offset above ground (0 = on ground)
      if (!p.onGround) {
        p.onGround = true;
        p.squash = 1;
        shake(Math.abs(p.vy) > 900 ? 7 : 3, 0.16);
        burst(p.px + 4, GY, 10, '#e8d5b0', { up: 90, spread: 220, size: [2, 6], grav: 420, life: 0.55 });
        SFX.land();
      }
      p.y = 0; p.vy = 0;
    } else {
      if (p.onGround) { p.onGround = false; p.coyote = CFG.coyote; }
    }
    p.squash = Math.max(0, p.squash - dt * 5);
    p.stretch = Math.max(0, p.stretch - dt * 5);
    p.legPhase += speed * dt * 0.045;
  }

  const px = CFG.playerX * W;
  p.px = px;
  p.screenY0 = GY + p.y;

  // riding dust
  if (!dying && p.onGround && Math.random() < dt * 22) {
    parts.push(mkPart(px - 24, GY - 2, rand(-40, -10), rand(-60, -15), rand(2, 4), 'rgba(240,220,180,0.55)', 0.5, 260));
  }
  // speed lines
  if (speed > 480) {
    const n = speed > 640 ? 3 : 1;
    for (let i = 0; i < n; i++) {
      if (Math.random() < dt * 26) speedLines.push({ x: W + 20, y: rand(H * 0.1, GY - 20), len: rand(60, 150), v: speed * rand(1.6, 2.2), a: rand(0.1, 0.3) });
    }
  }

  // --- spawns ---
  if (!dying) {
    if (dist >= nextSpawnDist) {
      spawnObstacle();
      nextSpawnDist = dist + rand(340, 560) + (1 - clamp((speed - CFG.startSpeed) / (CFG.maxSpeed - CFG.startSpeed), 0, 1)) * 320;
    }
    if (dist >= nextFishDist) {
      spawnFishPattern();
      nextFishDist = dist + rand(380, 760);
    }
  }

  // --- move entities ---
  const dx = speed * dt;
  for (const o of obstacles) {
    o.x -= dx;
    if (o.type === 'gull') {
      o.phase += dt * 3;
      o.wingT = (o.wingT || 0) + dt * 14;
    }
  }
  obstacles = obstacles.filter(o => o.x > -120);
  for (const f of fishes) { f.x -= dx; f.t += dt * 5; }
  fishes = fishes.filter(f => f.x > -40 && !f.got);

  // speed lines
  for (const l of speedLines) l.x -= l.v * dt;
  speedLines = speedLines.filter(l => l.x + l.len > 0);

  // --- collisions ---
  if (!dying) {
    const pw = p.ducking ? CFG.duckW : CFG.standW;
    const ph = p.ducking ? CFG.duckH : CFG.standH;
    const pl = px - pw / 2, pr = px + pw / 2;
    const pt = GY + p.y - ph, pb = GY + p.y;
    const hb = { l: pl + 6, r: pr - 8, t: pt + 6, b: pb - 2 };

    for (const o of obstacles) {
      let ol = o.x - o.w / 2, or_ = o.x + o.w / 2, ot, ob;
      if (o.type === 'gull') { ob = o.baseY + Math.sin(o.phase) * o.bobA; ot = ob - o.h; }
      else { ob = o.baseY; ot = ob - o.h; }
      if (hb.r > ol + 5 && hb.l < or_ - 5 && hb.b > ot + 5 && hb.t < ob - 4) { crash(); return; }
    }
    for (const f of fishes) {
      if (f.got) continue;
      const fy = f.y + Math.sin(f.t) * 4;
      if (px + 26 > f.x - f.r && px - 26 < f.x + f.r && pb - 6 > fy - f.r && pt + 4 < fy + f.r) {
        f.got = true;
        fishGot++;
        combo = Math.min(combo + 1, 8); comboT = 2.2; comboBest = Math.max(comboBest, combo);
        const val = (f.gold ? 50 : 10) * Math.max(combo, 1);
        fishScore += val;
        popups.push({ x: f.x, y: fy - 16, txt: '+' + val, life: 0.8, size: f.gold ? 24 : 17, color: f.gold ? '#ffe27a' : '#ffd98e', vy: -60 });
        burst(f.x, fy, f.gold ? 16 : 9, f.gold ? '#ffe27a' : '#ffd98e', { up: 160, spread: 300, size: [2, 5], grav: 300, life: 0.6, glow: true });
        flashT = Math.max(flashT, f.gold ? 0.16 : 0.08);
        SFX.fish(combo + (f.gold ? 4 : 0));
        if (combo >= 2) { el.combo.textContent = '×' + combo + ' COMBO'; el.combo.classList.remove('hidden'); }
      }
    }
  }
  score = Math.floor(dist / 12) + fishScore;
  stepParticles(dt);
}
function stepParticles(dt) {
  for (const p of parts) {
    p.life -= dt;
    p.x += p.vx * dt; p.y += p.vy * dt;
    p.vy += p.grav * dt;
    if (p.sway) p.x += Math.sin(p.life * 9) * 30 * dt;
    if (p.rot !== undefined) p.rot += p.rotV * dt;
  }
  parts = parts.filter(p => p.life > 0);
  for (const q of popups) { q.life -= dt; q.y += q.vy * dt; q.vy *= 0.94; }
  popups = popups.filter(q => q.life > 0);
  for (const c of clouds) { c.x -= c.sp * 0.016 * (state === S.PLAY || state === S.DYING ? 1 : 0.4); if (c.x < -180) c.x = W + 180; }
  shakeT -= dt; flashT -= dt;
}
function crash() {
  state = S.DYING;
  player.crashed = true; dieT = 0;
  shake(16, 0.55);
  flashT = 0.3;
  const px = CFG.playerX * W, py = GY + player.y - 50;
  for (let i = 0; i < 14; i++) {
    const a = rand(0, TAU);
    parts.push({
      x: px + rand(-10, 10), y: py + rand(-20, 20),
      vx: Math.cos(a) * rand(60, 260) - speed * 0.3, vy: Math.sin(a) * rand(60, 220) - 120,
      size: rand(4, 9), color: '#fffaf0', life: rand(0.8, 1.6), grav: 260,
      sway: true, rot: rand(0, TAU), rotV: rand(-6, 6), feather: true,
    });
  }
  burst(px, py, 20, '#ffb45e', { up: 260, spread: 500, size: [2, 6], grav: 500, life: 0.7 });
  SFX.crash();
  if (navigator.vibrate) { try { navigator.vibrate([60, 40, 80]); } catch (e) {} }
}
function doGameOver() {
  state = S.OVER;
  overLockT = 0.45;
  combo = 0;
  el.combo.classList.add('hidden');
  const scores = loadScores();
  const entry = { s: score, f: fishGot, t: Date.now() };
  let freshIdx = -1;
  if (score > 0) {
    scores.push(entry);
    scores.sort((a, b) => b.s - a.s);
    freshIdx = scores.indexOf(entry);
    if (freshIdx > 4) freshIdx = -1;
    saveScores(scores.slice(0, 5));
  }
  const isRecord = freshIdx === 0;
  el.overTitle.textContent = isRecord ? 'NEW BEST!' : 'WIPEOUT!';
  el.overSub.textContent = isRecord ? 'The flock salutes you. 🐦' : pickDeathLine();
  el.overScore.textContent = score;
  el.overFish.textContent = fishGot;
  el.overDist.textContent = Math.floor(dist / 40);
  show(el.newRecord, isRecord && score > 0);
  show(el.scrOver, true);
  refreshTables(freshIdx);
  if (isRecord) SFX.record();
}
function pickDeathLine() {
  return ['The pelican ate sand.', 'Cones: 1 — Pelican: 0.', 'That seagull holds a grudge.', 'Nice hop. Wrong timing.', 'The boardwalk wins again.'][randi(0, 4)];
}
function shake(mag, dur) { shakeMag = Math.max(shakeMag, mag); shakeT = Math.max(shakeT, dur); }

/* ---------------- Particles ---------------- */
function mkPart(x, y, vx, vy, size, color, life, grav) {
  return { x, y, vx, vy, size, color, life, grav };
}
function burst(x, y, n, color, o) {
  o = o || {};
  for (let i = 0; i < n; i++) {
    const a = rand(-Math.PI, 0);
    const sp = rand(o.spread ? o.spread * 0.3 : 60, o.spread || 220);
    parts.push({
      x, y,
      vx: Math.cos(a) * sp * 0.6 + rand(-40, 40),
      vy: Math.sin(a) * sp - (o.up || 60),
      size: rand((o.size || [2, 4])[0], (o.size || [2, 4])[1]),
      color, life: rand(0.3, o.life || 0.6), grav: o.grav || 400,
      glow: o.glow,
    });
  }
}

/* ---------------- HUD ---------------- */
function updateHUD(force) {
  if (score !== hudScore || force) {
    hudScore = score;
    el.score.textContent = score;
    el.score.classList.add('pop');
    setTimeout(() => el.score.classList.remove('pop'), 90);
  }
  if (fishGot !== hudFish || force) { hudFish = fishGot; el.fishCount.textContent = fishGot; }
}

/* ---------------- Rendering ---------------- */
function render(now) {
  const shx = shakeT > 0 ? rand(-1, 1) * shakeMag * (shakeT * 3) : 0;
  const shy = shakeT > 0 ? rand(-1, 1) * shakeMag * (shakeT * 3) : 0;

  ctx.save();
  ctx.translate(shx, shy);

  // sky
  ctx.drawImage(skyCache, 0, -20, W, H + 20);

  // sun
  const sunX = W * 0.72, sunY = GY - H * 0.24;
  const sg = ctx.createRadialGradient(sunX, sunY, 8, sunX, sunY, H * 0.22);
  sg.addColorStop(0, 'rgba(255,230,170,0.95)');
  sg.addColorStop(0.25, 'rgba(255,180,110,0.55)');
  sg.addColorStop(1, 'rgba(255,150,90,0)');
  ctx.fillStyle = sg;
  ctx.fillRect(sunX - H * 0.25, sunY - H * 0.25, H * 0.5, H * 0.5);
  ctx.fillStyle = '#ffe9b0';
  ctx.beginPath(); ctx.arc(sunX, sunY, H * 0.055, 0, TAU); ctx.fill();
  // sun water reflection stripes
  ctx.globalAlpha = 0.25;
  ctx.fillStyle = '#ffe9b0';
  for (let i = 0; i < 5; i++) {
    const yy = GY - H * 0.2 + i * 14;
    ctx.fillRect(sunX - (46 - i * 7), yy, (46 - i * 7) * 2, 3);
  }
  ctx.globalAlpha = 1;

  // stars (top)
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  for (let i = 0; i < 26; i++) {
    const sx = (seeded(i * 5) * W * 1.2 - dist * 0.01) % W;
    const sy = seeded(i * 5 + 1) * H * 0.22;
    ctx.globalAlpha = 0.25 + 0.35 * Math.abs(Math.sin(now * 0.001 + i));
    ctx.fillRect((sx + W) % W, sy, 2, 2);
  }
  ctx.globalAlpha = 1;

  // clouds
  for (const c of clouds) drawCloud(c.x, c.y, c.s);

  // distant hills
  const par1 = -(dist * 0.12) % 900;
  ctx.fillStyle = 'rgba(70,30,90,0.55)';
  for (let k = -1; k < Math.ceil(W / 900) + 1; k++) {
    drawHills(k * 900 + par1, GY - 26, 900, H * 0.13);
  }

  // ocean band
  const oceanTop = GY - H * 0.2;
  const og = ctx.createLinearGradient(0, oceanTop, 0, GY);
  og.addColorStop(0, 'rgba(120,60,130,0.85)');
  og.addColorStop(1, 'rgba(60,26,80,0.9)');
  ctx.fillStyle = og;
  ctx.fillRect(0, oceanTop, W, H * 0.2);
  // shimmering waves
  ctx.strokeStyle = 'rgba(255,200,140,0.35)';
  ctx.lineWidth = 1.5;
  const wOff = (dist * 0.25) % 90;
  for (let yy = oceanTop + 10; yy < GY - 6; yy += 18) {
    ctx.beginPath();
    for (let xx = -90 + wOff * ((yy / 18) % 3 === 0 ? 1 : 0.6); xx < W + 90; xx += 90) {
      ctx.moveTo(xx, yy); ctx.lineTo(xx + 34, yy);
    }
    ctx.stroke();
  }

  // palms (silhouettes, parallax 0.45)
  const par2 = -(dist * 0.45);
  ctx.fillStyle = '#2a1030';
  for (const p of palms) {
    let x = p.x + par2;
    x = ((x % (W + 700)) + W + 700) % (W + 700) - 350;
    drawPalm(x, GY + 2, p.h, p.lean);
  }
  // lamps (parallax 0.75)
  const par3 = -(dist * 0.75);
  ctx.fillStyle = '#1c0b26';
  for (const l of lamps) {
    let x = l.x + par3;
    x = ((x % (W + 640)) + W + 640) % (W + 640) - 320;
    drawLamp(x, GY + 2, H * 0.24);
  }

  // boardwalk ground
  const gg = ctx.createLinearGradient(0, GY, 0, H);
  gg.addColorStop(0, '#8a5a3b');
  gg.addColorStop(0.12, '#6e4229');
  gg.addColorStop(1, '#3f2418');
  ctx.fillStyle = gg;
  ctx.fillRect(0, GY, W, H - GY);
  ctx.fillStyle = 'rgba(255,190,120,0.5)';
  ctx.fillRect(0, GY, W, 3);
  // plank seams
  ctx.strokeStyle = 'rgba(30,14,8,0.55)';
  ctx.lineWidth = 2;
  const seam = 90, so = (dist % seam);
  ctx.beginPath();
  for (let x = -so; x < W + seam; x += seam) { ctx.moveTo(x, GY + 4); ctx.lineTo(x - 8, H); }
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,200,140,0.12)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let yy = GY + 16; yy < H; yy += 22) { ctx.moveTo(0, yy); ctx.lineTo(W, yy); }
  ctx.stroke();

  // speed lines
  ctx.lineWidth = 2;
  for (const l of speedLines) {
    ctx.strokeStyle = `rgba(255,240,220,${l.a})`;
    ctx.beginPath(); ctx.moveTo(l.x, l.y); ctx.lineTo(l.x + l.len, l.y); ctx.stroke();
  }

  // entities
  for (const o of obstacles) drawObstacle(o);
  for (const f of fishes) drawFish(f);
  drawRider(now);

  // particles
  for (const p of parts) drawPart(p);

  // popups
  ctx.textAlign = 'center';
  for (const q of popups) {
    ctx.globalAlpha = clamp(q.life * 1.6, 0, 1);
    ctx.font = `900 ${q.size}px "Avenir Next", Futura, sans-serif`;
    ctx.fillStyle = q.color;
    ctx.strokeStyle = 'rgba(20,10,30,0.6)';
    ctx.lineWidth = 3;
    ctx.strokeText(q.txt, q.x, q.y);
    ctx.fillText(q.txt, q.x, q.y);
  }
  ctx.globalAlpha = 1;

  // vignette
  const vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.45, W / 2, H / 2, H * 0.95);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(15,5,25,0.45)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, W, H);

  // flash
  if (flashT > 0) {
    ctx.fillStyle = `rgba(255,235,200,${flashT * 1.2})`;
    ctx.fillRect(0, 0, W, H);
  }
  ctx.restore();
}

/* --- scene pieces --- */
function drawCloud(x, y, s) {
  ctx.fillStyle = 'rgba(255,190,160,0.30)';
  ctx.beginPath();
  ctx.ellipse(x, y, 52 * s, 15 * s, 0, 0, TAU);
  ctx.ellipse(x + 34 * s, y - 8 * s, 34 * s, 12 * s, 0, 0, TAU);
  ctx.ellipse(x - 30 * s, y + 3 * s, 30 * s, 10 * s, 0, 0, TAU);
  ctx.fill();
}
function drawHills(x, base, w, h) {
  ctx.beginPath();
  ctx.moveTo(x, base);
  for (let i = 0; i <= 8; i++) {
    const t = i / 8;
    ctx.lineTo(x + t * w, base - h * (0.4 + 0.6 * Math.abs(Math.sin(t * 5 + x * 0.001))));
  }
  ctx.lineTo(x + w, base);
  ctx.closePath(); ctx.fill();
}
function drawPalm(x, gy, h, lean) {
  ctx.save();
  ctx.translate(x, gy);
  ctx.strokeStyle = '#2a1030';
  ctx.lineWidth = 9;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(lean * h * 0.4, -h * 0.55, lean * h + 14, -h);
  ctx.stroke();
  const tx = lean * h + 14, ty = -h;
  ctx.fillStyle = '#2a1030';
  for (let i = 0; i < 6; i++) {
    const a = -Math.PI * 0.95 + i * Math.PI * 0.32;
    ctx.beginPath();
    ctx.moveTo(tx, ty);
    ctx.quadraticCurveTo(tx + Math.cos(a) * 34, ty + Math.sin(a) * 20 - 8, tx + Math.cos(a) * 58, ty + Math.sin(a) * 34 + 6);
    ctx.quadraticCurveTo(tx + Math.cos(a) * 34, ty + Math.sin(a) * 20 + 4, tx, ty + 4);
    ctx.fill();
  }
  ctx.restore();
}
function drawLamp(x, gy, h) {
  ctx.save();
  ctx.translate(x, gy);
  ctx.fillRect(-3, -h, 6, h);
  ctx.beginPath();
  ctx.arc(0, -h, 9, Math.PI, 0);
  ctx.fill();
  // warm glow
  const g = ctx.createRadialGradient(0, -h + 3, 2, 0, -h + 3, 42);
  g.addColorStop(0, 'rgba(255,220,140,0.8)');
  g.addColorStop(1, 'rgba(255,220,140,0)');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(0, -h + 3, 42, 0, TAU); ctx.fill();
  ctx.restore();
}

function drawObstacle(o) {
  if (o.type === 'cone') {
    ctx.fillStyle = '#ff7043';
    ctx.beginPath();
    ctx.moveTo(o.x, o.baseY - o.h);
    ctx.lineTo(o.x + o.w / 2, o.baseY);
    ctx.lineTo(o.x - o.w / 2, o.baseY);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#fff3dd';
    ctx.fillRect(o.x - o.w * 0.28, o.baseY - o.h * 0.62, o.w * 0.56, o.h * 0.16);
    ctx.fillStyle = '#e05a32';
    ctx.fillRect(o.x - o.w / 2 - 3, o.baseY - 4, o.w + 6, 5);
  } else if (o.type === 'crate' || o.type === 'crate2') {
    const levels = o.type === 'crate2' ? [0, 1] : [0];
    for (const lv of levels) {
      const bx = o.x - o.w / 2, by = o.baseY - (lv + 1) * (o.h / levels.length);
      const bh = o.h / levels.length;
      ctx.fillStyle = lv === 0 && o.type === 'crate2' ? '#c98a4b' : '#b3793f';
      ctx.fillRect(bx, by, o.w, bh - 2);
      ctx.strokeStyle = 'rgba(60,30,10,0.7)';
      ctx.lineWidth = 2;
      ctx.strokeRect(bx + 1, by + 1, o.w - 2, bh - 4);
      ctx.beginPath();
      ctx.moveTo(bx + 4, by + 4); ctx.lineTo(bx + o.w - 4, by + bh - 8);
      ctx.moveTo(bx + o.w - 4, by + 4); ctx.lineTo(bx + 4, by + bh - 8);
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(255,220,170,0.25)';
    ctx.fillRect(o.x - o.w / 2, o.baseY - o.h, 5, o.h);
  } else if (o.type === 'gull') {
    const by = o.baseY + Math.sin(o.phase) * o.bobA;
    const flap = Math.sin(o.wingT || 0) * 0.9;
    ctx.save();
    ctx.translate(o.x, by - o.h / 2);
    ctx.fillStyle = '#f5eee0';
    ctx.beginPath(); ctx.ellipse(0, 0, 20, 13, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#8a8a95';
    ctx.beginPath(); ctx.arc(14, -4, 9, 0, TAU); ctx.fill();
    ctx.fillStyle = '#ffb347';
    ctx.beginPath();
    ctx.moveTo(20, -5); ctx.lineTo(34, -2); ctx.lineTo(20, 1);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#241826';
    ctx.beginPath(); ctx.arc(16, -6, 1.8, 0, TAU); ctx.fill();
    // wings
    ctx.fillStyle = '#ddd5c4';
    ctx.save();
    ctx.translate(-2, -2);
    ctx.rotate(-0.4 + flap);
    ctx.beginPath(); ctx.ellipse(-14, -4, 20, 7, -0.3, 0, TAU); ctx.fill();
    ctx.restore();
    ctx.beginPath(); ctx.ellipse(-2, 12, 13, 5, 0.2, 0, TAU); ctx.fill();
    ctx.restore();
  }
}
function drawFish(f) {
  const y = f.y + Math.sin(f.t) * 4;
  const wig = Math.sin(f.t * 2) * 0.3;
  ctx.save();
  ctx.translate(f.x, y);
  if (f.gold) {
    ctx.shadowColor = 'rgba(255,220,120,0.9)';
    ctx.shadowBlur = 14;
  }
  ctx.fillStyle = f.gold ? '#ffe27a' : '#8fd8ff';
  ctx.beginPath(); ctx.ellipse(0, 0, f.r + 3, f.r - 2, 0, 0, TAU); ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-f.r - 2, 0);
  ctx.lineTo(-f.r - 12, -7 + wig * 6);
  ctx.lineTo(-f.r - 12, 7 + wig * 6);
  ctx.closePath(); ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#1a1030';
  ctx.beginPath(); ctx.arc(f.r * 0.4, -2, 2, 0, TAU); ctx.fill();
  ctx.restore();
}
function drawPart(p) {
  const a = clamp(p.life * 2.5, 0, 1);
  ctx.globalAlpha = a;
  if (p.glow) { ctx.shadowColor = p.color; ctx.shadowBlur = 8; }
  if (p.feather) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.fillStyle = p.color;
    ctx.beginPath(); ctx.ellipse(0, 0, p.size, p.size * 0.45, 0, 0, TAU); ctx.fill();
    ctx.restore();
  } else {
    ctx.fillStyle = p.color;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.size * (0.4 + a * 0.6), 0, TAU); ctx.fill();
  }
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1;
}

/* --- the star: pelican on a bicycle --- */
function drawRider(now) {
  const p = player;
  const x = p.px !== undefined ? p.px : CFG.playerX * W;
  const y0 = GY + (p.y || 0);
  const dying = p.crashed;
  const t = now * 0.001;

  // squash & stretch
  const sq = 1 - p.squash * 0.22 + p.stretch * 0.12;
  const st = 1 + p.squash * 0.22 - p.stretch * 0.12;

  ctx.save();
  ctx.translate(x, y0);
  ctx.scale(sq, st);
  if (dying) {
    ctx.rotate(Math.min(dieT * 4, 1.4));
    ctx.translate(0, Math.min(dieT * 40, 26));
  }

  const wheelR = CFG.wheelR;
  const rear = { x: -22, y: -wheelR };
  const front = { x: 32, y: -wheelR };
  const crank = { x: 6, y: -19 };
  const spin = dist / wheelR;
  const airPose = !p.onGround && !dying;
  const duck = p.ducking;

  // wheels
  for (const w of [rear, front]) {
    ctx.strokeStyle = '#2b1b10';
    ctx.lineWidth = 3.5;
    ctx.beginPath(); ctx.arc(w.x, w.y, wheelR, 0, TAU); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,220,170,0.75)';
    ctx.lineWidth = 1.4;
    for (let i = 0; i < 4; i++) {
      const a = spin + i * Math.PI / 2;
      ctx.beginPath();
      ctx.moveTo(w.x - Math.cos(a) * (wheelR - 3), w.y - Math.sin(a) * (wheelR - 3));
      ctx.lineTo(w.x + Math.cos(a) * (wheelR - 3), w.y + Math.sin(a) * (wheelR - 3));
      ctx.stroke();
    }
    ctx.fillStyle = '#2b1b10';
    ctx.beginPath(); ctx.arc(w.x, w.y, 2.6, 0, TAU); ctx.fill();
  }

  // frame
  ctx.strokeStyle = '#ff6b35';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(rear.x, rear.y);
  ctx.lineTo(crank.x, crank.y);
  ctx.lineTo(front.x, front.y);
  ctx.moveTo(rear.x, rear.y);
  ctx.lineTo(-4, -44);            // seat tube top
  ctx.lineTo(crank.x, crank.y);
  ctx.lineTo(24, -46);            // head tube
  ctx.lineTo(front.x, front.y);
  ctx.stroke();
  // handlebar
  ctx.beginPath();
  ctx.moveTo(24, -46); ctx.lineTo(28, -54); ctx.lineTo(38, -54);
  ctx.stroke();

  // pedals + legs
  const crankA = spin * 1.0;
  const ped1 = { x: crank.x + Math.cos(crankA) * 10, y: crank.y + Math.sin(crankA) * 10 };
  const ped2 = { x: crank.x + Math.cos(crankA + Math.PI) * 10, y: crank.y + Math.sin(crankA + Math.PI) * 10 };
  const hip = duck ? { x: -2, y: -40 } : { x: -6, y: -58 };
  ctx.strokeStyle = '#f0a94b';
  ctx.lineWidth = 4.5;
  ctx.beginPath();
  ctx.moveTo(hip.x, hip.y);
  ctx.quadraticCurveTo((hip.x + ped1.x) / 2 + 6, (hip.y + ped1.y) / 2 + 6, ped1.x, ped1.y);
  ctx.moveTo(hip.x, hip.y);
  ctx.quadraticCurveTo((hip.x + ped2.x) / 2 + 7, (hip.y + ped2.y) / 2 + 7, ped2.x, ped2.y);
  ctx.stroke();
  ctx.fillStyle = '#2b1b10';
  ctx.fillRect(ped1.x - 5, ped1.y - 2, 10, 4);
  ctx.fillRect(ped2.x - 5, ped2.y - 2, 10, 4);

  // seat
  ctx.fillStyle = '#2b1b10';
  ctx.beginPath(); ctx.ellipse(-5, -46, 9, 4, 0, 0, TAU); ctx.fill();

  // pelican body
  const bodyY = duck ? -52 : -64;
  const bodyX = duck ? 2 : -4;
  const pitch = duck ? 0.18 : airPose ? -0.14 + p.vy * 0.00012 : 0.06 + Math.sin(t * 6) * 0.02;
  ctx.save();
  ctx.translate(bodyX, bodyY);
  ctx.rotate(pitch);
  // tail
  ctx.fillStyle = '#e8e2d2';
  ctx.beginPath();
  ctx.moveTo(-20, -2); ctx.lineTo(-38, -10); ctx.lineTo(-34, 4); ctx.closePath(); ctx.fill();
  // body
  const bg = ctx.createLinearGradient(0, -20, 0, 16);
  bg.addColorStop(0, '#ffffff');
  bg.addColorStop(1, '#d9d2c0');
  ctx.fillStyle = bg;
  ctx.beginPath(); ctx.ellipse(0, 0, 26, 16, 0, 0, TAU); ctx.fill();
  // wing (flap in air)
  const wingA = airPose ? Math.sin(t * 18) * 0.5 - 0.2 : Math.sin(t * 4) * 0.08 - 0.1;
  ctx.save();
  ctx.translate(-2, -4);
  ctx.rotate(wingA);
  ctx.fillStyle = '#cfc8b6';
  ctx.beginPath(); ctx.ellipse(-4, 2, 19, 9, 0.3, 0, TAU); ctx.fill();
  ctx.restore();
  ctx.restore();

  // neck + head
  const headX = duck ? 26 : 20;
  const headY = (duck ? -58 : -78) + (dying ? 0 : Math.sin(t * 5) * 1.5);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 9;
  ctx.beginPath();
  ctx.moveTo(bodyX + 8, bodyY - 8);
  ctx.quadraticCurveTo(bodyX + (duck ? 20 : 16), (bodyY + headY) / 2, headX, headY);
  ctx.stroke();
  // head
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.arc(headX, headY, 10, 0, TAU); ctx.fill();
  // crest
  ctx.fillStyle = '#e8e2d2';
  ctx.beginPath();
  ctx.moveTo(headX - 8, headY - 6);
  ctx.lineTo(headX - 16, headY - 14);
  ctx.lineTo(headX - 3, headY - 10);
  ctx.closePath(); ctx.fill();
  // beak + pouch
  const beakOpen = dying ? 0.5 : Math.max(0, Math.sin(t * 3) - 0.6) * 1.4;
  ctx.fillStyle = '#ff9d45';
  ctx.beginPath();
  ctx.moveTo(headX + 4, headY - 4);
  ctx.lineTo(headX + 40, headY - 1 - beakOpen * 4);
  ctx.lineTo(headX + 4, headY + 3);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#ffb347';
  ctx.beginPath();
  ctx.moveTo(headX + 4, headY + 2);
  ctx.quadraticCurveTo(headX + 24, headY + 14, headX + 38, headY - 1);
  ctx.quadraticCurveTo(headX + 20, headY + 4, headX + 4, headY + 2);
  ctx.fill();
  // eye
  ctx.fillStyle = '#1a1030';
  ctx.beginPath(); ctx.arc(headX + 5, headY - 4, 2.6, 0, TAU); ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(headX + 6, headY - 5, 1, 0, TAU); ctx.fill();

  ctx.restore();
}

/* ---------------- Main loop ---------------- */
function frame(now) {
  requestAnimationFrame(frame);
  let dt = (now - last) / 1000;
  last = now;
  if (dt > 0.25) dt = 0.25;
  overLockT -= dt;

  if (state === S.PAUSE) { render(now); return; }

  acc += dt;
  let steps = 0;
  while (acc >= STEP && steps < 6) {
    update(STEP);
    acc -= STEP;
    steps++;
  }
  render(now);
}

/* ---------------- Boot ---------------- */
resize();
player.px = CFG.playerX * W;
player.screenY0 = GY;
refreshTables(-1);
last = performance.now();
requestAnimationFrame(frame);
