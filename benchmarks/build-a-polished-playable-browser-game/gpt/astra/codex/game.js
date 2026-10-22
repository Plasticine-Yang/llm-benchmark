import { drawScene, drawPelican, drawShadow, drawFish, drawSparkle, drawObstacle, drawParticles, palette } from './art.js';

const element = (identifier) => document.getElementById(identifier);
const canvas = element('game-canvas');
const context = canvas.getContext('2d', { alpha: false });
const stage = element('game-stage');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const coarsePointer = window.matchMedia('(pointer: coarse)').matches;
const storageKey = 'pelican-pedal-club-v1';
const formatNumber = (value) => Math.floor(value).toLocaleString('en-US');
const clamp = (value, minimum, maximum) => Math.max(minimum, Math.min(maximum, value));
const random = (minimum, maximum) => minimum + Math.random() * (maximum - minimum);
const ui = {
  start: element('start-screen'), hud: element('game-hud'), controls: element('ride-controls'), pause: element('pause-screen'), over: element('gameover-screen'),
  score: element('score'), fish: element('fish-count'), distance: element('distance'), hearts: element('hearts'), combo: element('combo-label'), boost: element('boost-fill'), toast: element('game-toast'),
};

let storageAvailable = true;
let records = [];
let riderName = 'YOU';
let muted = false;
try {
  const saved = JSON.parse(localStorage.getItem(storageKey) || '{}');
  records = Array.isArray(saved.records) ? saved.records.filter((record) => record && Number.isFinite(record.score) && record.score >= 0 && record.score <= 1e9 && Number.isFinite(record.distance) && record.distance >= 0 && typeof record.name === 'string').sort((first, second) => second.score - first.score).slice(0, 5) : [];
  riderName = typeof saved.name === 'string' ? saved.name.replace(/[^a-z0-9]/gi, '').slice(0, 3).toUpperCase() || 'YOU' : 'YOU';
  muted = saved.muted === true;
} catch { storageAvailable = false; }

function persist() {
  try { localStorage.setItem(storageKey, JSON.stringify({ records, name: riderName, muted })); }
  catch { storageAvailable = false; }
  element('storage-note').textContent = storageAvailable ? 'Your top 5 rides, saved on this device.' : 'Storage is unavailable. Rides are saved for this visit.';
}

class CoastalSounds {
  constructor() { this.context = null; this.nextNote = 0; this.step = 0; }
  unlock() {
    try {
      if (!this.context) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) return;
        this.context = new AudioContextClass();
        this.master = this.context.createGain();
        this.master.gain.value = muted ? 0 : 0.32;
        this.master.connect(this.context.destination);
      }
      if (this.context.state === 'suspended') this.context.resume().catch(() => {});
      this.nextNote = this.context.currentTime + 0.1;
    } catch { this.context = null; }
  }
  setMuted(value) {
    if (!this.context) return;
    this.master.gain.setTargetAtTime(value ? 0 : 0.32, this.context.currentTime, 0.04);
  }
  tone(frequency, duration, volume = 0.15, type = 'sine', delay = 0, target = frequency) {
    if (!this.context || muted) return;
    const start = this.context.currentTime + delay;
    const oscillator = this.context.createOscillator();
    const envelope = this.context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, target), start + duration);
    envelope.gain.setValueAtTime(0, start);
    envelope.gain.linearRampToValueAtTime(volume, start + 0.008);
    envelope.gain.exponentialRampToValueAtTime(0.001, start + duration);
    oscillator.connect(envelope);
    envelope.connect(this.master);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.03);
    oscillator.onended = () => { oscillator.disconnect(); envelope.disconnect(); };
  }
  jump(second) {
    this.tone(second ? 390 : 230, 0.16, 0.13, 'sine', 0, second ? 830 : 510);
    this.tone(second ? 590 : 350, 0.13, 0.05, 'triangle', 0.025, second ? 990 : 690);
  }
  fish(streak) {
    const notes = [659.25, 783.99, 880, 1046.5, 1174.66];
    const frequency = notes[(streak - 1) % notes.length];
    this.tone(frequency, 0.18, 0.12, 'sine');
    this.tone(frequency * 2, 0.12, 0.035, 'triangle', 0.025);
  }
  reward() { [523.25, 659.25, 783.99, 1046.5].forEach((frequency, index) => this.tone(frequency, 0.24, 0.12, 'sine', index * 0.08)); }
  hit() { this.tone(130, 0.24, 0.26, 'triangle', 0, 43); this.tone(84, 0.13, 0.17, 'sine', 0.03, 28); }
  finish() { [392, 329.63, 261.63].forEach((frequency, index) => this.tone(frequency, 0.4, 0.13, 'triangle', index * 0.15)); }
  music(active) {
    if (!this.context || muted || !active) return;
    const current = this.context.currentTime;
    if (this.nextNote < current - 0.15) this.nextNote = current + 0.05;
    if (this.nextNote > current + 0.08) return;
    const melody = [523.25, 0, 659.25, 783.99, 659.25, 0, 587.33, 0, 493.88, 0, 587.33, 739.99, 659.25, 0, 587.33, 0, 440, 0, 523.25, 659.25, 587.33, 0, 523.25, 0, 392, 0, 493.88, 587.33, 523.25, 0, 392, 0];
    const note = melody[this.step % melody.length];
    const delay = Math.max(0, this.nextNote - current);
    if (note) this.tone(note, 0.23, 0.035, 'sine', delay);
    if (this.step % 4 === 0) this.tone([130.81, 146.83, 110, 98][Math.floor(this.step / 8) % 4], 0.35, 0.045, 'sine', delay);
    this.step += 1;
    this.nextNote += 0.2857;
  }
}

const sounds = new CoastalSounds();
let state = 'menu';
let worldWidth = 1200;
const worldHeight = 600;
let renderScale = 1;
let ground = 498;
let playerScale = 0.73;
let playerHorizontal = 240;
let baseSpeed = 300;
let scroll = 0;
let rideTime = 0;
let totalTime = 0;
let distance = 0;
let fishPoints = 0;
let score = 0;
let fishCount = 0;
let streak = 0;
let multiplier = 1;
let bestMultiplier = 1;
let lives = 3;
let breeze = 100;
let boosting = false;
let boostExhausted = false;
let boostHeld = false;
let jumpHeld = false;
let jumpBuffer = 0;
let obstacles = [];
let fishes = [];
let particles = [];
let floatingLabels = [];
let nextObstacleAt = 0;
let obstacleCount = 0;
let cameraShake = 0;
let scorePunch = 0;
let toastRemaining = 0;
let crashRemaining = 0;
let hudRemaining = 0;
let nextMilestone = 100;
let hintShown = false;
let resumeAfterDialog = false;
let currentRecordId = null;
let lastFrameTime = 0;
let accumulator = 0;
let particleAccumulator = 0;
let activeJumpPointer = null;
let activeBoostPointer = null;
const player = { height: 0, velocity: 0, jumps: 0, pedal: 0, lean: 0, flap: 0, invincible: 0, landSquash: 0 };

function resize() {
  const bounds = stage.getBoundingClientRect();
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  const previousWidth = worldWidth;
  worldWidth = bounds.width / bounds.height * worldHeight;
  canvas.width = Math.round(bounds.width * pixelRatio);
  canvas.height = Math.round(bounds.height * pixelRatio);
  renderScale = canvas.height / worldHeight;
  ground = worldWidth < 620 && state !== 'menu' ? 465 : 498;
  playerScale = worldWidth < 620 ? 0.59 : 0.73;
  playerHorizontal = worldWidth < 620 ? Math.max(77, worldWidth * 0.22) : Math.min(280, worldWidth * 0.235);
  baseSpeed = clamp(worldWidth * 0.35, 140, 310);
  if (state === 'playing' && Math.abs(worldWidth - previousWidth) > 100) {
    for (const obstacle of obstacles) obstacle.scale = worldWidth < 620 ? 0.72 : 0.88;
  }
}

new ResizeObserver(resize).observe(stage);
window.addEventListener('orientationchange', () => { if (state === 'playing') pauseGame(); });
resize();

function toast(message, duration = 2) {
  ui.toast.textContent = message;
  ui.toast.classList.add('visible');
  toastRemaining = duration;
}

function makeParticles(horizontal, vertical, count, colors, kind = 'confetti', strength = 1) {
  const available = Math.max(0, 150 - particles.length);
  for (let index = 0; index < Math.min(count, available); index += 1) {
    const life = random(0.35, 0.75);
    particles.push({ horizontal, vertical, velocityX: random(-120, 130) * strength, velocityY: random(-190, -35) * strength, size: random(3, 7), color: colors[index % colors.length], life, maxLife: life, rotation: random(0, 6.28), spin: random(-6, 6), kind });
  }
}

function floatText(message, horizontal, vertical, color = '#b47735', large = false) {
  floatingLabels.push({ message, horizontal, vertical, life: large ? 1.2 : 0.8, maxLife: large ? 1.2 : 0.8, color, large });
  if (floatingLabels.length > 12) floatingLabels.shift();
}

function refreshSoundButton() {
  element('sound-button').setAttribute('aria-label', muted ? 'Turn sound on' : 'Mute sound');
  element('sound-button').setAttribute('aria-pressed', String(muted));
  element('sound-button').title = muted ? 'Turn sound on (M)' : 'Mute sound (M)';
  element('sound-button').querySelector('use').setAttribute('href', muted ? '#icon-mute' : '#icon-sound');
}

function toggleSound() {
  muted = !muted;
  sounds.unlock();
  sounds.setMuted(muted);
  refreshSoundButton();
  persist();
  if (!muted) sounds.tone(659, 0.12, 0.1);
}

function refreshBest() { element('menu-best').textContent = records.length ? formatNumber(records[0].score) : '—'; }

function updateHud(force = false) {
  if (!force && hudRemaining > 0) return;
  hudRemaining = 0.05;
  ui.score.textContent = String(Math.floor(score)).padStart(5, '0');
  ui.fish.textContent = String(fishCount);
  ui.distance.textContent = `${Math.floor(distance)} m`;
  ui.combo.textContent = streak >= 5 ? `×${multiplier} MULTIPLIER · ${streak} FISH STREAK` : streak > 0 ? `${streak} / 5 FISH TO A MULTIPLIER` : 'LET THE GOOD TIMES ROLL';
  ui.combo.classList.toggle('on', streak >= 5);
  ui.boost.style.transform = `scaleX(${breeze / 100})`;
  ui.boost.classList.toggle('active', boosting);
  Array.from(ui.hearts.children).forEach((heart, index) => heart.classList.toggle('lost', index >= lives));
  ui.hearts.setAttribute('aria-label', `${lives} ${lives === 1 ? 'life' : 'lives'} remaining`);
}

function resetControls() {
  heldJumpKeys.clear();
  heldBoostKeys.clear();
  jumpHeld = false;
  boostHeld = false;
  boostExhausted = false;
  boosting = false;
  jumpBuffer = 0;
  activeJumpPointer = null;
  activeBoostPointer = null;
}

function addFish(position, height, phase = 0) { fishes.push({ position, height, phase, collected: false, missed: false }); }

function spawnObstacle(position, initial = false) {
  const types = ['cone', 'castle', 'crate', 'crab'];
  const type = initial ? 'cone' : types[Math.floor(Math.random() * types.length)];
  const scale = worldWidth < 620 ? 0.72 : 0.88;
  const width = type === 'crab' ? 46 : type === 'castle' ? 58 : 46;
  const height = type === 'crab' ? 31 : 50;
  obstacles.push({ position, horizontal: 0, type, width, height, scale, hit: false, passed: false });
  const spacing = baseSpeed * 0.22;
  const heights = [65, 99, 135, 153, 135, 99, 65];
  for (let index = 0; index < heights.length; index += 1) addFish(position + (index - 3) * spacing, heights[index] * (worldWidth < 620 ? 0.88 : 1), index * 0.4);
  obstacleCount += 1;
}

function startGame() {
  document.querySelectorAll('dialog[open]').forEach((dialog) => { resumeAfterDialog = false; dialog.close(); });
  state = 'playing';
  stage.classList.add('playing');
  resize();
  scroll = 0;
  rideTime = 0;
  distance = 0;
  score = 0;
  fishPoints = 0;
  fishCount = 0;
  streak = 0;
  multiplier = 1;
  bestMultiplier = 1;
  lives = 3;
  breeze = 100;
  obstacles = [];
  fishes = [];
  particles = [];
  floatingLabels = [];
  cameraShake = 0;
  scorePunch = 0;
  obstacleCount = 0;
  nextMilestone = 100;
  hintShown = false;
  currentRecordId = null;
  particleAccumulator = 0;
  Object.assign(player, { height: 0, velocity: 0, jumps: 0, pedal: 0, lean: 0, flap: 0, invincible: 0, landSquash: 0 });
  resetControls();
  for (let index = 0; index < 5; index += 1) addFish(baseSpeed * (1.2 + index * 0.24), 52, index * 0.3);
  nextObstacleAt = baseSpeed * 4.4;
  spawnObstacle(nextObstacleAt, true);
  nextObstacleAt += baseSpeed * 3.7;
  ui.start.hidden = true;
  ui.hud.hidden = false;
  ui.controls.hidden = false;
  ui.pause.hidden = true;
  ui.over.hidden = true;
  element('start-button').blur();
  element('restart-button').blur();
  element('rider-name').blur();
  sounds.unlock();
  sounds.reward();
  updateHud(true);
  toast(coarsePointer ? 'Tap to hop. Tap again to flap!' : 'SPACE to hop. Again to flap!', 2.8);
  if (coarsePointer && stage.getBoundingClientRect().bottom > window.innerHeight) {
    window.scrollTo({ top: window.scrollY + stage.getBoundingClientRect().top - 10, behavior: reducedMotion ? 'instant' : 'smooth' });
  }
}

function returnHome() {
  state = 'menu';
  stage.classList.remove('playing');
  resetControls();
  ui.start.hidden = false;
  ui.hud.hidden = true;
  ui.controls.hidden = true;
  ui.pause.hidden = true;
  ui.over.hidden = true;
  ui.toast.classList.remove('visible');
  particles = [];
  floatingLabels = [];
  cameraShake = 0;
  resize();
  refreshBest();
}

function pauseGame() {
  if (state !== 'playing') return;
  state = 'paused';
  resetControls();
  ui.pause.hidden = false;
  ui.toast.classList.remove('visible');
  element('resume-button').focus({ preventScroll: true });
}

function resumeGame() {
  if (state !== 'paused') return;
  state = 'playing';
  resetControls();
  ui.pause.hidden = true;
  sounds.unlock();
  element('resume-button').blur();
}

function togglePause() { if (state === 'playing') pauseGame(); else if (state === 'paused') resumeGame(); }

function jump() {
  if (state !== 'playing') return;
  if (player.jumps >= 2) { jumpBuffer = 0.12; return; }
  const secondJump = player.jumps === 1;
  player.velocity = secondJump ? 470 : 530;
  player.jumps += 1;
  player.flap = 0;
  player.landSquash = 0;
  jumpBuffer = 0;
  makeParticles(playerHorizontal - 16, ground - player.height - 4, secondJump ? 10 : 7, secondJump ? ['#fff9e9', '#e8eacb', '#bdc7a8'] : ['#c5bb94', '#e2d5ab', '#efe4c1'], secondJump ? 'confetti' : 'dust', secondJump ? 0.65 : 0.5);
  if (secondJump) floatText('FLAP!', playerHorizontal + 8, ground - player.height - 148 * playerScale, '#6e8d67');
  sounds.jump(secondJump);
}

function collectFish(fish, horizontal) {
  fish.collected = true;
  streak += 1;
  fishCount += 1;
  const previousMultiplier = multiplier;
  multiplier = Math.min(4, 1 + Math.floor(streak / 5));
  bestMultiplier = Math.max(bestMultiplier, multiplier);
  const reward = 25 * multiplier;
  fishPoints += reward;
  breeze = Math.min(100, breeze + 7);
  scorePunch = 1;
  makeParticles(horizontal, ground - fish.height, 9, ['#ecc35f', '#f9df99', '#fff6da', '#c6b273'], 'spark', 0.75);
  floatText(`+${reward}`, horizontal, ground - fish.height - 15);
  sounds.fish(streak);
  if (multiplier > previousMultiplier) {
    toast(`A FINE SCHOOL OF FISH!  ×${multiplier}`, 1.7);
    sounds.reward();
    makeParticles(playerHorizontal, ground - player.height - 135, 18, ['#e9b75c', '#f4e2a5', '#89ac85', '#ed8c63']);
    if (!reducedMotion) cameraShake = 2.5;
  }
}

function hitObstacle(obstacle) {
  obstacle.hit = true;
  lives -= 1;
  streak = 0;
  multiplier = 1;
  player.invincible = 1.7;
  player.velocity = 230;
  player.height = Math.max(4, player.height);
  player.jumps = Math.max(1, player.jumps);
  if (!reducedMotion) cameraShake = 10;
  makeParticles(obstacle.horizontal, ground - 25, 26, ['#ed8a5c', '#f1cb7c', '#fff3d4', '#789271'], 'confetti', 1.3);
  sounds.hit();
  if (lives > 0) toast(lives === 1 ? 'ONE HEART. STILL PLENTY OF SPIRIT.' : 'A LITTLE WOBBLE. KEEP ROLLING!', 1.8);
  else {
    state = 'crashing';
    crashRemaining = 0.62;
    resetControls();
    ui.toast.classList.remove('visible');
  }
  updateHud(true);
}

function finishRide() {
  state = 'over';
  const finalScore = Math.floor(score);
  const previousBest = records[0]?.score || 0;
  currentRecordId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  records.push({ id: currentRecordId, name: riderName, score: finalScore, distance: Math.floor(distance), fish: fishCount, date: new Date().toISOString() });
  records.sort((first, second) => second.score - first.score);
  records = records.slice(0, 5);
  persist();
  refreshBest();
  element('final-score').textContent = formatNumber(finalScore);
  element('final-fish').textContent = String(fishCount);
  element('final-distance').textContent = String(Math.floor(distance));
  element('final-combo').textContent = `×${bestMultiplier}`;
  element('rider-name').value = riderName;
  element('gameover-eyebrow').textContent = finalScore > previousBest ? 'A NEW PERSONAL BEST. LOOK AT YOU!' : 'THAT’S ONE FOR THE SCRAPBOOK';
  ui.over.hidden = false;
  ui.controls.hidden = true;
  if (finalScore > previousBest) sounds.reward(); else sounds.finish();
  element('restart-button').focus({ preventScroll: true });
}

function updateEffects(delta) {
  for (const particle of particles) {
    particle.life -= delta;
    particle.horizontal += particle.velocityX * delta;
    particle.vertical += particle.velocityY * delta;
    particle.velocityY += (particle.kind === 'dust' ? 60 : 380) * delta;
    particle.rotation += particle.spin * delta;
  }
  particles = particles.filter((particle) => particle.life > 0);
  for (const label of floatingLabels) { label.life -= delta; label.vertical -= 36 * delta; }
  floatingLabels = floatingLabels.filter((label) => label.life > 0);
  cameraShake = Math.max(0, cameraShake - delta * 26);
  scorePunch = Math.max(0, scorePunch - delta * 4.5);
  if (toastRemaining > 0) {
    toastRemaining -= delta;
    if (toastRemaining <= 0) ui.toast.classList.remove('visible');
  }
}

function update(delta) {
  if (state === 'paused' || state === 'over') return;
  if (state === 'menu') {
    if (!reducedMotion) totalTime += delta;
    return;
  }
  totalTime += delta;
  updateEffects(delta);
  hudRemaining -= delta;
  if (state === 'crashing') {
    crashRemaining -= delta;
    player.velocity -= 1200 * delta;
    player.height = Math.max(0, player.height + player.velocity * delta);
    player.lean += delta * 2.8;
    if (crashRemaining <= 0) finishRide();
    return;
  }
  rideTime += delta;
  boosting = boostHeld && breeze > 0 && !boostExhausted;
  if (boosting) {
    breeze = Math.max(0, breeze - delta * 34);
    if (breeze === 0) boostExhausted = true;
  } else breeze = Math.min(100, breeze + delta * 8);
  const difficulty = 1 + Math.min(0.55, distance / 1150);
  const speed = baseSpeed * difficulty * (boosting ? 1.48 : 1);
  scroll += speed * delta;
  distance += speed * delta / 13;
  score = Math.floor(distance * 2) + fishPoints;
  player.pedal += speed * delta / 28;
  player.flap += delta;
  player.invincible = Math.max(0, player.invincible - delta);
  player.landSquash = Math.max(0, player.landSquash - delta * 5);
  jumpBuffer = Math.max(0, jumpBuffer - delta);
  if (player.height > 0 || player.velocity > 0) {
    player.velocity -= 1570 * delta * (jumpHeld && player.velocity > 0 ? 0.7 : 1);
    player.height += player.velocity * delta;
    if (player.height <= 0) {
      player.height = 0;
      const landingSpeed = -player.velocity;
      player.velocity = 0;
      player.jumps = 0;
      player.landSquash = Math.min(1, landingSpeed / 650);
      makeParticles(playerHorizontal - 22, ground, 8, ['#d2c69e', '#e3d6ad', '#f0e4c1'], 'dust', 0.55);
      if (landingSpeed > 400 && !reducedMotion) cameraShake = Math.max(cameraShake, 2.2);
      if (jumpBuffer > 0) jump();
    }
  }
  const leanTarget = player.height > 0 ? -player.velocity * 0.00024 : boosting ? -0.06 : 0;
  player.lean += (leanTarget - player.lean) * Math.min(1, delta * 12);
  particleAccumulator += delta;
  if (player.height < 2 && particleAccumulator > (boosting ? 0.04 : 0.12)) {
    particleAccumulator = 0;
    makeParticles(playerHorizontal - 67 * playerScale, ground - 3, 1, boosting ? ['#f0c26e', '#e6d5a2'] : ['#d9cba1'], 'dust', 0.17);
    const particle = particles[particles.length - 1];
    if (particle) { particle.velocityX = -speed * 0.35; particle.velocityY = -random(5, 20); particle.size = boosting ? 7 : 4; }
  }

  while (nextObstacleAt < scroll + worldWidth + baseSpeed) {
    spawnObstacle(nextObstacleAt);
    const gap = baseSpeed * random(2.8, 3.8);
    if (obstacleCount % 2 === 0) {
      for (let index = 0; index < 4; index += 1) addFish(nextObstacleAt + gap * 0.5 + index * baseSpeed * 0.19, 53, index * 0.3);
    }
    nextObstacleAt += gap;
  }

  const playerLeft = playerHorizontal - 43 * playerScale;
  const playerRight = playerHorizontal + 47 * playerScale;
  const playerBottom = ground - player.height - 5;
  const playerTop = ground - player.height - 158 * playerScale;
  for (const obstacle of obstacles) {
    obstacle.horizontal = playerHorizontal + obstacle.position - scroll;
    const halfWidth = obstacle.width * obstacle.scale * 0.42;
    const obstacleTop = ground - obstacle.height * obstacle.scale;
    if (!obstacle.hit && player.invincible <= 0 && playerRight > obstacle.horizontal - halfWidth && playerLeft < obstacle.horizontal + halfWidth && playerBottom > obstacleTop + 5 && playerTop < ground - 4) {
      hitObstacle(obstacle);
      if (state !== 'playing') break;
    }
    if (!obstacle.passed && obstacle.horizontal + halfWidth < playerLeft) {
      obstacle.passed = true;
      if (!obstacle.hit && player.height > 5) {
        fishPoints += 15;
        floatText('CLEAN HOP +15', playerHorizontal, ground - player.height - 156 * playerScale, '#50795b');
      }
    }
  }
  obstacles = obstacles.filter((obstacle) => obstacle.horizontal > -110);

  if (state === 'playing') {
    for (const fish of fishes) {
      if (fish.collected || fish.missed) continue;
      const horizontal = playerHorizontal + fish.position - scroll;
      const vertical = ground - fish.height + Math.sin(totalTime * 3 + fish.phase) * 3;
      const collectionLeft = playerHorizontal - 48 * playerScale;
      const collectionRight = playerHorizontal + 102 * playerScale;
      const collectionTop = ground - player.height - 205 * playerScale;
      const collectionBottom = ground - player.height - 9;
      if (horizontal > collectionLeft - 10 && horizontal < collectionRight + 10 && vertical > collectionTop - 10 && vertical < collectionBottom + 12) collectFish(fish, horizontal);
      else if (horizontal < collectionLeft - 20) { fish.missed = true; streak = 0; multiplier = 1; }
    }
  }
  fishes = fishes.filter((fish) => !fish.collected && playerHorizontal + fish.position - scroll > -50);
  if (!hintShown && rideTime > 2.8 && player.jumps === 0) {
    hintShown = true;
    toast(coarsePointer ? 'BEACH GEAR AHEAD. TAP TO HOP!' : 'BEACH GEAR AHEAD. SPACE TO HOP!', 1.7);
  }
  if (distance >= nextMilestone) {
    toast(`${nextMilestone} m · SUNSHINE FOR MILES`, 2);
    nextMilestone += 100;
    sounds.reward();
    makeParticles(playerHorizontal, ground - player.height - 145, 22, ['#ebc16d', '#8fac83', '#f6e2a3', '#e58b67']);
  }
  updateHud();
  sounds.music(true);
}

function render() {
  context.setTransform(renderScale, 0, 0, renderScale, 0, 0);
  context.fillStyle = '#f6ebce';
  context.fillRect(0, 0, worldWidth + 2, worldHeight + 2);
  context.save();
  if (cameraShake > 0.1 && !reducedMotion) context.translate(random(-cameraShake, cameraShake) * 0.45, random(-cameraShake, cameraShake) * 0.45);
  context.lineCap = 'round';
  context.lineJoin = 'round';
  const isMenu = state === 'menu';
  const sceneScroll = isMenu ? totalTime * (reducedMotion ? 0 : 12) : scroll;
  drawScene(context, worldWidth, worldHeight, totalTime, sceneScroll, isMenu, ground);

  if (isMenu) {
    const mobile = worldWidth < 620;
    const heroScale = mobile ? Math.min(1.05, worldWidth / 388) : Math.min(1.67, worldWidth / 670);
    const heroHorizontal = mobile ? worldWidth * 0.435 : worldWidth * 0.724;
    const heroVertical = ground - 2 + (reducedMotion ? 0 : Math.sin(totalTime * 3) * 1.1);
    drawShadow(context, heroHorizontal, ground, heroScale, 0, 0.9);
    drawPelican(context, { horizontal: heroHorizontal, vertical: heroVertical, scale: heroScale, pedal: totalTime * 3.3, time: totalTime, lean: -0.025, menu: true });
    if (!mobile) {
      drawFish(context, heroHorizontal + 184, ground - 111, totalTime, 0.63, false);
      drawFish(context, heroHorizontal + 217, ground - 143, totalTime + 0.5, 0.5, false);
      drawSparkle(context, heroHorizontal + 219, ground - 96, 5, '#c0a65d');
      drawSparkle(context, heroHorizontal - 131, ground - 297, 6, '#b2a867');
      drawSparkle(context, heroHorizontal + 151, ground - 224, 4, '#cea95e');
    } else {
      drawSparkle(context, heroHorizontal - 73, ground - 150, 5, '#bca36a');
      drawFish(context, heroHorizontal + 110, ground - 115, totalTime, 0.48, false);
    }
  } else {
    if (boosting && !reducedMotion) {
      context.globalAlpha = 0.35;
      context.strokeStyle = '#fff9df';
      context.lineWidth = 2;
      for (let index = 0; index < 10; index += 1) {
        const horizontal = (worldWidth - (totalTime * 800 + index * 163) % worldWidth);
        const vertical = 160 + (index * 77) % (ground - 170);
        context.beginPath();
        context.moveTo(horizontal, vertical);
        context.lineTo(horizontal + 30 + index % 3 * 10, vertical);
        context.stroke();
      }
      context.globalAlpha = 1;
    }
    for (const fish of fishes) {
      const horizontal = playerHorizontal + fish.position - scroll;
      if (!fish.collected && horizontal > -40 && horizontal < worldWidth + 40) drawFish(context, horizontal, ground - fish.height, totalTime + fish.phase / 3, worldWidth < 620 ? 0.69 : 0.82);
    }
    for (const obstacle of obstacles) {
      if (obstacle.horizontal > -100 && obstacle.horizontal < worldWidth + 100) {
        context.globalAlpha = obstacle.hit ? 0.48 : 1;
        drawObstacle(context, obstacle, ground, totalTime);
        context.globalAlpha = 1;
      }
    }
    drawShadow(context, playerHorizontal, ground, playerScale, player.height);
    context.save();
    if (player.landSquash > 0) {
      context.translate(playerHorizontal, ground);
      context.scale(1 + player.landSquash * 0.065, 1 - player.landSquash * 0.075);
      context.translate(-playerHorizontal, -ground);
    }
    drawPelican(context, { horizontal: playerHorizontal, vertical: ground - player.height, scale: playerScale, pedal: player.pedal, time: totalTime, airborne: player.height > 10, boosting, invincible: player.invincible > 0 && state !== 'crashing' && state !== 'over', lean: player.lean, flap: player.flap });
    context.restore();
    drawParticles(context, particles);
    for (const label of floatingLabels) {
      context.save();
      context.globalAlpha = Math.min(1, label.life / label.maxLife * 2);
      context.font = `700 ${label.large ? 18 : worldWidth < 620 ? 11 : 13}px "DM Sans", sans-serif`;
      context.textAlign = 'center';
      context.fillStyle = '#fff7e3';
      context.strokeStyle = '#fff7e3';
      context.lineWidth = 3;
      context.strokeText(label.message, label.horizontal, label.vertical);
      context.fillStyle = label.color;
      context.fillText(label.message, label.horizontal, label.vertical);
      context.restore();
    }
    ui.score.style.transform = reducedMotion ? '' : `scale(${1 + scorePunch * 0.055})`;
    ui.score.style.transformOrigin = 'left center';
  }
  context.restore();
}

function frame(timestamp) {
  const elapsed = lastFrameTime ? Math.min((timestamp - lastFrameTime) / 1000, 0.05) : 1 / 60;
  lastFrameTime = timestamp;
  accumulator += elapsed;
  const step = 1 / 120;
  while (accumulator >= step) { update(step); accumulator -= step; }
  render();
  requestAnimationFrame(frame);
}

function renderLeaderboard() {
  const rows = element('leaderboard-rows');
  rows.replaceChildren();
  records.forEach((record, index) => {
    const row = document.createElement('div');
    row.className = 'leaderboard-row';
    for (const value of [String(index + 1).padStart(2, '0'), record.name, `${record.distance} m`, formatNumber(record.score)]) {
      const cell = document.createElement('span');
      cell.textContent = value;
      row.append(cell);
    }
    rows.append(row);
  });
  element('leaderboard-empty').hidden = records.length > 0;
  element('storage-note').textContent = storageAvailable ? 'Your top 5 rides, saved on this device.' : 'Storage is unavailable. Rides are saved for this visit.';
}

function openDialog(identifier) {
  if (document.querySelector('dialog[open]')) return;
  resumeAfterDialog = state === 'playing';
  if (state === 'playing') pauseGame();
  if (identifier === 'leaderboard-dialog') renderLeaderboard();
  element(identifier).showModal();
}

for (const dialog of document.querySelectorAll('dialog')) {
  dialog.addEventListener('close', () => {
    if (resumeAfterDialog && state === 'paused') resumeGame();
    resumeAfterDialog = false;
  });
  dialog.addEventListener('click', (event) => {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
  });
}

document.querySelectorAll('[data-close]').forEach((button) => button.addEventListener('click', () => element(button.dataset.close).close()));
element('help-done').addEventListener('click', () => element('help-dialog').close());
element('start-button').addEventListener('click', startGame);
element('restart-button').addEventListener('click', startGame);
element('pause-restart').addEventListener('click', startGame);
element('resume-button').addEventListener('click', resumeGame);
element('pause-button').addEventListener('click', pauseGame);
element('back-home').addEventListener('click', returnHome);
element('home-button').addEventListener('click', returnHome);
element('sound-button').addEventListener('click', toggleSound);
element('help-button').addEventListener('click', () => openDialog('help-dialog'));
element('leaderboard-button').addEventListener('click', () => openDialog('leaderboard-dialog'));
element('personal-best').addEventListener('click', () => openDialog('leaderboard-dialog'));
element('results-leaderboard').addEventListener('click', () => openDialog('leaderboard-dialog'));
element('rider-name').addEventListener('input', (event) => {
  const value = event.target.value.replace(/[^a-z0-9]/gi, '').slice(0, 3).toUpperCase();
  event.target.value = value;
  riderName = value || 'YOU';
  const record = records.find((saved) => saved.id === currentRecordId);
  if (record) record.name = riderName;
  persist();
});

const jumpCodes = new Set(['Space', 'ArrowUp', 'KeyW']);
const boostCodes = new Set(['ShiftLeft', 'ShiftRight', 'ArrowRight']);
const heldJumpKeys = new Set();
const heldBoostKeys = new Set();

document.addEventListener('keydown', (event) => {
  if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement || event.ctrlKey || event.metaKey || event.altKey) return;
  if (document.querySelector('dialog[open]')) return;
  if (event.target.closest?.('button') && (event.code === 'Space' || event.code === 'Enter')) return;
  if (jumpCodes.has(event.code)) {
    event.preventDefault();
    if (event.repeat) return;
    heldJumpKeys.add(event.code);
    if (state === 'menu' || state === 'over') startGame();
    else if (state === 'playing') { jumpHeld = true; jump(); }
  } else if (boostCodes.has(event.code)) {
    if (state === 'playing') {
      event.preventDefault();
      if (!event.repeat) { heldBoostKeys.add(event.code); boostHeld = true; boostExhausted = false; }
    }
  } else if (event.code === 'KeyP' || event.code === 'Escape') {
    event.preventDefault();
    if (!event.repeat) togglePause();
  } else if (event.code === 'KeyR') {
    event.preventDefault();
    if (!event.repeat) startGame();
  } else if (event.code === 'KeyM' && !event.repeat) toggleSound();
});

document.addEventListener('keyup', (event) => {
  if (jumpCodes.has(event.code)) {
    heldJumpKeys.delete(event.code);
    jumpHeld = heldJumpKeys.size > 0 || activeJumpPointer !== null;
    if (!jumpHeld && player.velocity > 150) player.velocity *= 0.72;
  }
  if (boostCodes.has(event.code)) {
    heldBoostKeys.delete(event.code);
    boostHeld = heldBoostKeys.size > 0 || activeBoostPointer !== null;
    if (!boostHeld) boostExhausted = false;
  }
});

function attachJumpControl(target) {
  target.addEventListener('pointerdown', (event) => {
    if (state !== 'playing' || event.button > 0) return;
    event.preventDefault();
    event.stopPropagation();
    activeJumpPointer = event.pointerId;
    jumpHeld = true;
    target.setPointerCapture(event.pointerId);
    jump();
  });
  const release = (event) => {
    if (event.pointerId !== activeJumpPointer) return;
    activeJumpPointer = null;
    jumpHeld = heldJumpKeys.size > 0;
    if (!jumpHeld && player.velocity > 150) player.velocity *= 0.72;
  };
  target.addEventListener('pointerup', release);
  target.addEventListener('pointercancel', release);
  target.addEventListener('lostpointercapture', release);
}

attachJumpControl(canvas);
attachJumpControl(element('touch-jump'));
element('touch-boost').addEventListener('pointerdown', (event) => {
  if (state !== 'playing') return;
  event.preventDefault();
  event.stopPropagation();
  activeBoostPointer = event.pointerId;
  boostHeld = true;
  boostExhausted = false;
  event.currentTarget.setPointerCapture(event.pointerId);
});
for (const eventName of ['pointerup', 'pointercancel', 'lostpointercapture']) {
  element('touch-boost').addEventListener(eventName, (event) => {
    if (event.pointerId !== activeBoostPointer) return;
    activeBoostPointer = null;
    boostHeld = heldBoostKeys.size > 0;
    if (!boostHeld) boostExhausted = false;
  });
}

function handleUnfocus() {
  heldJumpKeys.clear();
  heldBoostKeys.clear();
  resetControls();
  if (state === 'playing') pauseGame();
}

window.addEventListener('blur', handleUnfocus);
document.addEventListener('visibilitychange', () => { if (document.hidden) handleUnfocus(); lastFrameTime = 0; });
stage.addEventListener('contextmenu', (event) => event.preventDefault());
refreshSoundButton();
refreshBest();
requestAnimationFrame(frame);
