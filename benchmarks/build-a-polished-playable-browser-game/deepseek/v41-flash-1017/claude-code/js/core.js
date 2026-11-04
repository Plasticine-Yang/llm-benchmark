'use strict';

window.PG = (function () {
  /* ------------------------------------------------------------------ *
   *  Pelican Pedal — core state, physics, spawning, audio, persistence  *
   * ------------------------------------------------------------------ */

  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d', { alpha: false });

  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const lerp = (a, b, t) => a + (b - a) * t;
  const rand = (a, b) => a + Math.random() * (b - a);
  const TAU = Math.PI * 2;
  const smooth = (t) => t * t * (3 - 2 * t);

  const view = {
    W: 0, H: 0, dpr: 1, U: 1,
    groundY: 0, horizon: 0, changed: true,
  };

  const game = {
    mode: 'menu',          // menu | playing | paused | crashing | over
    t: 0,
    scroll: 0,
    dist: 0,
    score: 0,
    best: 0,
    baseSpeed: 320,
    speed: 0,
    diff: 0,
    streak: 0,
    mult: 1,
    comboTimer: 0,
    comboPop: 0,
    nextObstacle: 0,
    nextFish: 0,
    obstacles: [],
    fishes: [],
    particles: [],
    popups: [],
    shake: 0,
    flash: 0,
    crashTimer: 0,
    timeScale: 1,
    muted: false,
    scores: [],
    runScore: 0,
    runDist: 0,
    newBest: false,
    lastScoreId: null,
    hintTimer: 0,
    reduced: false,
  };

  const player = {
    x: 0, h: 0, vy: 0,
    grounded: true, jumps: 0,
    squash: 1, wheel: 0, crank: 0, flap: 0,
    buffer: 0, dustT: 0,
    crashX: 0, crashRot: 0, crashVX: 0,
  };

  const hooks = { onGameOver: null };

  /* ----------------------------- audio ----------------------------- */

  let actx = null;
  let noiseBuf = null;

  function ac() {
    if (!actx) {
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        actx = AC ? new AC() : null;
      } catch (e) { actx = null; }
    }
    if (actx && actx.state === 'suspended') actx.resume().catch(() => {});
    return actx;
  }

  function tone(freq, dur, type, vol, slideTo, delay) {
    if (game.muted) return;
    const a = ac();
    if (!a) return;
    const t0 = a.currentTime + (delay || 0);
    const o = a.createOscillator();
    const g = a.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, t0);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g);
    g.connect(a.destination);
    o.start(t0);
    o.stop(t0 + dur + 0.03);
  }

  function noise(dur, vol, cutoff) {
    if (game.muted) return;
    const a = ac();
    if (!a) return;
    if (!noiseBuf) {
      noiseBuf = a.createBuffer(1, Math.floor(a.sampleRate * 0.4), a.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    const src = a.createBufferSource();
    src.buffer = noiseBuf;
    const f = a.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = cutoff || 1400;
    const g = a.createGain();
    const now = a.currentTime;
    g.gain.setValueAtTime(Math.max(0.0002, vol), now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    src.connect(f); f.connect(g); g.connect(a.destination);
    src.start(now);
    src.stop(now + dur);
  }

  const sfx = {
    jump() { tone(300, 0.16, 'triangle', 0.14, 620); },
    flap() { noise(0.14, 0.09, 2000); tone(430, 0.13, 'sine', 0.09, 760); },
    coin(mult) {
      const base = 620 * Math.pow(1.059, Math.min(mult, 8));
      tone(base, 0.09, 'triangle', 0.11);
      tone(base * 1.5, 0.15, 'sine', 0.075, base * 1.5, 0.05);
    },
    land(hard) {
      if (hard) { tone(120, 0.14, 'sine', 0.17, 58); noise(0.1, 0.1, 700); }
      else noise(0.045, 0.03, 900);
    },
    crash() {
      noise(0.4, 0.26, 1000);
      tone(170, 0.34, 'sawtooth', 0.14, 50);
      tone(86, 0.5, 'sine', 0.17, 40);
    },
    ui() { tone(540, 0.06, 'square', 0.04); },
  };

  /* --------------------------- persistence -------------------------- */

  const KEY = 'pelican-pedal-v1';

  function loadStore() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return;
      const d = JSON.parse(raw);
      if (Array.isArray(d.scores)) {
        game.scores = d.scores
          .filter((s) => s && typeof s.score === 'number')
          .slice(0, 6);
      }
      if (typeof d.best === 'number') game.best = d.best;
      if (typeof d.muted === 'boolean') game.muted = d.muted;
    } catch (e) { /* storage may be unavailable */ }
  }

  function saveStore() {
    try {
      localStorage.setItem(KEY, JSON.stringify({
        scores: game.scores.slice(0, 6),
        best: game.best,
        muted: game.muted,
      }));
    } catch (e) { /* ignore */ }
  }

  /* ----------------------------- layout ----------------------------- */

  function resize() {
    const r = canvas.getBoundingClientRect();
    const W = Math.max(1, Math.round(r.width));
    const H = Math.max(1, Math.round(r.height));

    view.W = W;
    view.H = H;
    view.dpr = clamp(window.devicePixelRatio || 1, 1, 2);
    canvas.width = Math.round(W * view.dpr);
    canvas.height = Math.round(H * view.dpr);
    ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);

    view.U = clamp(Math.min(H / 760, W / 520), 0.5, 1.35);
    view.groundY = Math.round(H * 0.84);
    view.horizon = Math.round(H * 0.43);
    view.changed = true;

    player.x = Math.round(W * 0.27);
    game.baseSpeed = clamp(W * 0.42, 220 * view.U, 620 * view.U);

    if (game.mode === 'menu') game.speed = game.baseSpeed * 0.35;
  }

  /* ---------------------------- particles --------------------------- */

  function addParticle(p) {
    if (game.particles.length > 320) return;
    p.life = p.life || 0.6;
    p.max = p.life;
    p.rot = p.rot || 0;
    p.vr = p.vr || 0;
    p.g = p.g || 0;
    p.size = p.size || 3;
    p.drag = p.drag || 0;
    game.particles.push(p);
  }

  function dustBurst(x, y, n, power) {
    const U = view.U;
    for (let i = 0; i < n; i++) {
      addParticle({
        type: 'dust',
        x: x + rand(-10, 10) * U,
        y: y + rand(-2, 1),
        vx: rand(-100, 30) * U - game.speed * 0.12,
        vy: rand(-130, -20) * U * (power || 1),
        life: rand(0.3, 0.65),
        size: rand(3, 8) * U,
        color: Math.random() < 0.4 ? '#f6dfae' : '#e6c48b',
        g: 150 * U,
        drag: 1.4,
      });
    }
  }

  function featherBurst(x, y, n) {
    const U = view.U;
    for (let i = 0; i < n; i++) {
      addParticle({
        type: 'feather',
        x, y,
        vx: rand(-240, 240) * U,
        vy: rand(-340, -30) * U,
        life: rand(0.7, 1.5),
        size: rand(5, 10) * U,
        color: Math.random() < 0.55 ? '#fff4de' : '#ffe1bb',
        g: 240 * U,
        drag: 0.7,
        rot: rand(0, TAU),
        vr: rand(-9, 9),
      });
    }
  }

  function sparkle(x, y, n) {
    const U = view.U;
    for (let i = 0; i < n; i++) {
      addParticle({
        type: 'spark',
        x, y,
        vx: rand(-170, 170) * U,
        vy: rand(-210, 60) * U,
        life: rand(0.28, 0.6),
        size: rand(2, 5) * U,
        color: Math.random() < 0.5 ? '#ffe07a' : '#ffc94d',
        g: 280 * U,
        drag: 2.2,
        rot: rand(0, TAU),
      });
    }
  }

  function ringBurst(x, y) {
    addParticle({
      type: 'ring', x, y,
      vx: 0, vy: 0,
      life: 0.36, size: 6 * view.U,
      color: '#ffe7a8', g: 0, drag: 0,
    });
  }

  function popup(x, y, text, color, scale) {
    game.popups.push({
      x, y, text,
      color: color || '#fff4de',
      life: 0.85, max: 0.85,
      scale: scale || 1,
    });
  }

  /* --------------------------- world reset -------------------------- */

  function resetWorld() {
    game.dist = 0;
    game.score = 0;
    game.diff = 0;
    game.streak = 0;
    game.mult = 1;
    game.comboTimer = 0;
    game.comboPop = 0;
    game.nextObstacle = 1.45;
    game.nextFish = 0.5;
    game.obstacles.length = 0;
    game.fishes.length = 0;
    game.particles.length = 0;
    game.popups.length = 0;
    game.shake = 0;
    game.flash = 0;
    game.crashTimer = 0;
    game.timeScale = 1;
    game.newBest = false;
    game.lastScoreId = null;
    game.hintTimer = 3.4;
    game.speed = game.baseSpeed;

    player.h = 0;
    player.vy = 0;
    player.grounded = true;
    player.jumps = 0;
    player.squash = 1;
    player.wheel = 0;
    player.crank = 0;
    player.flap = 0;
    player.buffer = 0;
    player.dustT = 0;
    player.crashX = 0;
    player.crashRot = 0;
    player.crashVX = 0;
  }

  function startGame() {
    resetWorld();
    game.mode = 'playing';
    ac();
    sfx.ui();
  }

  function quitToMenu() {
    game.mode = 'menu';
    game.speed = game.baseSpeed * 0.35;
    game.obstacles.length = 0;
    game.fishes.length = 0;
    game.particles.length = 0;
    game.popups.length = 0;
    game.shake = 0;
    game.flash = 0;
    game.timeScale = 1;
    game.streak = 0;
    game.mult = 1;
    player.h = 0;
    player.vy = 0;
    player.grounded = true;
    player.jumps = 0;
    player.crashX = 0;
    player.crashRot = 0;
    player.flap = 0;
    player.buffer = 0;
  }

  function togglePause() {
    if (game.mode === 'playing') { game.mode = 'paused'; return true; }
    if (game.mode === 'paused') { game.mode = 'playing'; return true; }
    return false;
  }

  function toggleMute() {
    game.muted = !game.muted;
    saveStore();
    if (!game.muted) sfx.ui();
    return game.muted;
  }

  /* ----------------------------- actions ---------------------------- */

  function pressJump() {
    if (game.mode !== 'playing') return;
    const U = view.U;

    if (player.grounded) {
      player.vy = 560 * U;
      player.grounded = false;
      player.jumps = 1;
      player.squash = 1.16;
      dustBurst(player.x - 24 * U, view.groundY, 5, 0.8);
      sfx.jump();
    } else if (player.jumps < 2) {
      player.vy = 500 * U;
      player.jumps = 2;
      player.flap = 1;
      player.squash = 1.1;
      ringBurst(player.x, view.groundY - player.h - 34 * U);
      featherBurst(player.x - 6 * U, view.groundY - player.h - 40 * U, 3);
      sfx.flap();
    } else if (player.h < 30 * U) {
      player.buffer = 0.12;
    }
  }

  function releaseJump() {
    if (game.mode !== 'playing') return;
    if (player.vy > 160 * view.U) player.vy *= 0.55;
  }

  /* ---------------------------- spawning ---------------------------- */

  const TYPES = [
    { key: 'cone', w: 30, h: 36, weight: 3, minDiff: 0 },
    { key: 'crate', w: 40, h: 50, weight: 2, minDiff: 0 },
    { key: 'cooler', w: 34, h: 42, weight: 2, minDiff: 0.08 },
    { key: 'crab', w: 46, h: 26, weight: 1, minDiff: 0.2 },
  ];

  function pickType() {
    let total = 0;
    for (const t of TYPES) if (game.diff >= t.minDiff) total += t.weight;
    let r = Math.random() * total;
    for (const t of TYPES) {
      if (game.diff < t.minDiff) continue;
      r -= t.weight;
      if (r <= 0) return t;
    }
    return TYPES[0];
  }

  function spawnObstacle() {
    const U = view.U;
    const type = pickType();
    const x = view.W + 90 * U;
    const o = {
      type: type.key,
      x,
      w: type.w * U,
      h: type.h * U,
      t: rand(0, 10),
      vx: type.key === 'crab' ? 26 * U : 0,
    };
    game.obstacles.push(o);

    if (game.diff > 0.28 && Math.random() < 0.28) {
      const t2 = Math.random() < 0.55 ? TYPES[0] : TYPES[1];
      const gap = rand(62, 96) * U;
      game.obstacles.push({
        type: t2.key,
        x: x + (type.w + t2.w) * 0.5 * U + gap,
        w: t2.w * U,
        h: t2.h * U,
        t: rand(0, 10),
        vx: 0,
      });
    }

    const base = lerp(1.5, 0.98, game.diff);
    game.nextObstacle = base * rand(0.9, 1.35);
  }

  function spawnFishArc() {
    const U = view.U;
    const cx = view.W + 150 * U;

    for (const o of game.obstacles) {
      if (Math.abs(o.x - cx) < 260 * U) return;
    }

    const n = 3 + Math.floor(Math.random() * 3);
    const span = rand(130, 200) * U;
    const base = rand(110, 190) * U;
    const peak = rand(26, 54) * U;

    for (let i = 0; i < n; i++) {
      const f = n === 1 ? 0.5 : i / (n - 1);
      game.fishes.push({
        x: cx + (f - 0.5) * span,
        y: base + Math.sin(f * Math.PI) * peak,
        ph: rand(0, TAU),
        got: false,
      });
    }
  }

  /* --------------------------- game events -------------------------- */

  function collectFish(f, index) {
    game.fishes.splice(index, 1);
    game.streak += 1;
    game.mult = Math.min(8, game.streak);
    const pts = 10 * game.mult;
    game.score += pts;
    game.comboTimer = 3.0;
    game.comboPop = 1;

    const sx = f.x;
    const sy = view.groundY - f.y;
    popup(sx, sy - 8, '+' + pts, game.mult > 1 ? '#ffd45e' : '#fff4de', 1 + game.mult * 0.04);
    sparkle(sx, sy, 7 + game.mult);
    ringBurst(sx, sy);
    sfx.coin(game.mult);
    game.shake = Math.max(game.shake, 0.05);
  }

  function land(impact) {
    const U = view.U;
    const hard = impact > 400 * U;
    player.squash = hard ? 0.74 : 0.88;
    dustBurst(player.x - 20 * U, view.groundY, hard ? 10 : 4, hard ? 1.25 : 0.8);
    if (hard) {
      game.shake = Math.max(game.shake, 0.34);
      sfx.land(true);
    } else {
      sfx.land(false);
    }
  }

  function crash() {
    if (game.mode !== 'playing') return;
    const U = view.U;
    game.mode = 'crashing';
    game.crashTimer = 0;
    game.timeScale = 0.24;
    game.shake = 1;
    game.flash = 0.85;
    game.streak = 0;
    game.mult = 1;

    player.vy = 340 * U;
    player.grounded = false;
    player.crashVX = -150 * U;
    player.crashRot = 0;

    featherBurst(player.x, view.groundY - player.h - 50 * U, 26);
    dustBurst(player.x, view.groundY, 12, 1.4);
    sfx.crash();
  }

  function gameOver() {
    if (game.mode === 'over') return;
    game.mode = 'over';
    game.timeScale = 1;

    const sc = Math.floor(game.score);
    const meters = Math.floor(game.dist / 50);
    game.runScore = sc;
    game.runDist = meters;
    game.newBest = sc > game.best;

    if (sc > game.best) game.best = sc;

    if (sc > 0) {
      const entry = {
        score: sc,
        dist: meters,
        date: Date.now(),
        id: Date.now() + '-' + Math.random().toString(36).slice(2, 7),
      };
      game.lastScoreId = entry.id;
      game.scores.push(entry);
      game.scores.sort((a, b) => b.score - a.score);
      game.scores = game.scores.slice(0, 6);
    } else {
      game.lastScoreId = null;
    }

    saveStore();
    if (typeof hooks.onGameOver === 'function') hooks.onGameOver();
  }

  /* ------------------------------ update ---------------------------- */

  function updateParticles(dt) {
    const speed = game.speed;
    for (let i = game.particles.length - 1; i >= 0; i--) {
      const p = game.particles[i];
      p.life -= dt;
      if (p.life <= 0) { game.particles.splice(i, 1); continue; }
      p.vy += p.g * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rot += p.vr * dt;
      if (p.drag) {
        const d = Math.max(0, 1 - p.drag * dt);
        p.vx *= d;
        p.vy *= d;
      }
      if (p.type === 'dust') p.x -= speed * dt * 0.18;
    }
  }

  function updatePopups(dt) {
    const speed = game.speed;
    for (let i = game.popups.length - 1; i >= 0; i--) {
      const p = game.popups[i];
      p.life -= dt;
      if (p.life <= 0) { game.popups.splice(i, 1); continue; }
      p.y -= 62 * view.U * dt;
      p.x -= speed * dt * 0.5;
    }
  }

  function update(dt) {
    game.t += dt;

    if (game.mode === 'menu') {
      game.speed = game.baseSpeed * 0.35;
      game.scroll += game.speed * dt;
      player.wheel += (game.speed * dt) / (16 * view.U);
      player.crank = player.wheel * 0.9;
      player.flap = Math.max(0, player.flap - dt * 3);
      updateParticles(dt);
      updatePopups(dt);
      game.shake = Math.max(0, game.shake - dt * 2);
      game.flash = Math.max(0, game.flash - dt * 3);
      return;
    }

    if (game.mode === 'paused') return;

    if (game.mode === 'over') {
      updateParticles(dt * 0.3);
      updatePopups(dt * 0.5);
      game.shake = Math.max(0, game.shake - dt * 2);
      game.flash = Math.max(0, game.flash - dt * 3);
      return;
    }

    if (game.mode === 'crashing') {
      const U = view.U;
      game.crashTimer += dt;
      game.speed *= Math.max(0, 1 - dt * 4);
      game.scroll += game.speed * dt;

      player.vy -= 980 * U * dt;
      player.h += player.vy * dt;
      player.crashX += player.crashVX * dt;
      player.crashRot += dt * 5;
      if (player.h < 0) {
        player.h = 0;
        player.vy *= -0.22;
        player.crashVX *= 0.6;
        if (player.vy < 40 * U) player.vy = 0;
      }

      updateParticles(dt);
      updatePopups(dt);
      game.shake = Math.max(0, game.shake - dt * 1.9);
      game.flash = Math.max(0, game.flash - dt * 3);
      game.timeScale = Math.min(1, game.timeScale + dt * 1.5);

      if (game.crashTimer > 0.95) gameOver();
      return;
    }

    /* ---- playing ---- */
    const U = view.U;
    game.diff = Math.min(1, game.dist / 16000);
    game.speed = game.baseSpeed * (1 + 0.7 * game.diff);
    game.scroll += game.speed * dt;
    game.dist += game.speed * dt;
    game.score += game.speed * dt * 0.055;

    if (game.comboTimer > 0) {
      game.comboTimer -= dt;
      if (game.comboTimer <= 0) {
        game.streak = 0;
        game.mult = 1;
      }
    }
    game.comboPop = Math.max(0, game.comboPop - dt * 3.5);
    game.hintTimer = Math.max(0, game.hintTimer - dt);

    if (player.buffer > 0) player.buffer -= dt;

    player.vy -= 1180 * U * dt;
    player.h += player.vy * dt;

    if (player.h <= 0) {
      const impact = -player.vy;
      const wasAir = !player.grounded;
      player.h = 0;
      player.vy = 0;
      player.grounded = true;
      player.jumps = 0;
      if (wasAir) land(impact);
      if (player.buffer > 0) {
        player.buffer = 0;
        pressJump();
      }
    } else {
      player.grounded = false;
    }

    player.squash += (1 - player.squash) * Math.min(1, dt * 11);
    player.flap = Math.max(0, player.flap - dt * 3);
    player.wheel += (game.speed * dt) / (16 * U);
    player.crank = player.wheel * 0.9;

    if (player.grounded) {
      player.dustT -= dt;
      if (player.dustT <= 0) {
        player.dustT = 0.075;
        addParticle({
          type: 'dust',
          x: player.x - 26 * U,
          y: view.groundY - 1,
          vx: -game.speed * 0.45 + rand(-25, 25) * U,
          vy: rand(-55, -10) * U,
          life: rand(0.22, 0.44),
          size: rand(2, 4.5) * U,
          color: '#eed3a1',
          g: 150 * U,
          drag: 1.6,
        });
      }
    }

    game.nextObstacle -= dt;
    if (game.nextObstacle <= 0) spawnObstacle();

    game.nextFish -= dt;
    if (game.nextFish <= 0) {
      spawnFishArc();
      game.nextFish = rand(2.1, 3.8) * (1 - 0.18 * game.diff);
    }

    /* obstacles */
    const pb = {
      x1: player.x - 15 * U,
      x2: player.x + 17 * U,
      y1: player.h + 8 * U,
      y2: player.h + 82 * U,
    };

    for (let i = game.obstacles.length - 1; i >= 0; i--) {
      const o = game.obstacles[i];
      o.x -= (game.speed + o.vx) * dt;
      o.t += dt;

      if (o.x < -120 * U) {
        game.obstacles.splice(i, 1);
        continue;
      }

      const ox1 = o.x - o.w * 0.5 + 4 * U;
      const ox2 = o.x + o.w * 0.5 - 4 * U;
      if (pb.x2 > ox1 && pb.x1 < ox2 && pb.y1 < o.h - 3 * U) {
        crash();
        return;
      }
    }

    /* fish */
    const cy = player.h + 44 * U;
    for (let i = game.fishes.length - 1; i >= 0; i--) {
      const f = game.fishes[i];
      f.x -= game.speed * dt;
      f.ph += dt * 3;

      let dx = player.x - f.x;
      let dy = cy - f.y;
      const magnet = 92 * U;
      if (dx * dx + dy * dy < magnet * magnet && Math.abs(dy) < 62 * U) {
        const pull = Math.min(1, dt * 8);
        f.x += dx * pull;
        f.y += dy * pull;
        dx = player.x - f.x;
        dy = cy - f.y;
      }

      const r = 34 * U;
      if (dx * dx + dy * dy < r * r) {
        collectFish(f, i);
        continue;
      }
      if (f.x < -80 * U) game.fishes.splice(i, 1);
    }

    updateParticles(dt);
    updatePopups(dt);

    game.shake = Math.max(0, game.shake - dt * 2.2);
    game.flash = Math.max(0, game.flash - dt * 3);
  }

  /* ------------------------------ boot ------------------------------ */

  loadStore();
  resize();

  const api = {
    canvas, ctx, view, game, player, hooks,
    resize,
    startGame,
    restart: startGame,
    quitToMenu,
    togglePause,
    toggleMute,
    pressJump,
    releaseJump,
    update,
    saveStore,
    rand, clamp, lerp, TAU,
  };

  return api;
})();
