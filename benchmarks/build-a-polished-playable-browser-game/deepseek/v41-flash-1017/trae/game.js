/* Pelican Pedal — a tiny sunset arcade ride. */
(() => {
  'use strict';

  const TAU = Math.PI * 2;
  const FIXED = 1 / 120;
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const lerp = (a, b, t) => a + (b - a) * t;
  const rand = (a, b) => a + Math.random() * (b - a);
  const randInt = (a, b) => Math.floor(rand(a, b + 1));
  const pick = (arr) => arr[(Math.random() * arr.length) | 0];
  const reduceMotion = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const FONT = '"Arial Black", "Arial Bold", "Helvetica Neue", system-ui, sans-serif';

  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d', { alpha: false });
  const $ = (id) => document.getElementById(id);

  const dom = {
    hud: $('hud'),
    score: $('score'),
    distance: $('distance'),
    fishCount: $('fishCount'),
    comboWrap: $('comboWrap'),
    combo: $('combo'),
    comboBar: $('comboBar'),
    hearts: Array.from(document.querySelectorAll('.heart')),
    bestMini: $('bestMini'),
    frenzyWrap: $('frenzyWrap'),
    frenzyBar: $('frenzyBar'),
    startScreen: $('startScreen'),
    pauseScreen: $('pauseScreen'),
    overScreen: $('overScreen'),
    startScores: $('startScores'),
    overScores: $('overScores'),
    overScore: $('overScore'),
    overBest: $('overBest'),
    overDistance: $('overDistance'),
    overFish: $('overFish'),
    newBest: $('newBest'),
    overEyebrow: $('overEyebrow'),
    playBtn: $('playBtn'),
    pauseBtn: $('pauseBtn'),
    muteBtn: $('muteBtn'),
    resumeBtn: $('resumeBtn'),
    restartBtn: $('restartBtn'),
    menuBtn: $('menuBtn'),
    againBtn: $('againBtn'),
    overMenuBtn: $('overMenuBtn'),
    hint: $('hint')
  };

  const S = {
    mode: 'start',
    W: 1, H: 1, U: 1, DPR: 1,
    groundY: 1, horizon: 1, boardTop: 1,
    score: 0, distance: 0, fish: 0, hearts: 3,
    combo: 0, multiplier: 1, comboTimer: 0, frenzy: 0,
    elapsed: 0, speedPx: 0, timeScale: 1, slowT: 0,
    shake: 0, flash: 0,
    obstacles: [], fishes: [], particles: [], popups: [],
    spawnTimer: 2.2, lastGolden: -40, hintT: 0,
    scroll: { cloud: 0, sea: 0, palm: 0, board: 0, fore: 0 },
    menuT: 0, crashT: 0, best: 0, lastHud: 0, acc: 0,
    newBest: false, scores: [], trailT: 0
  };

  const P = {
    x: 0, y: 0, vy: 0,
    grounded: true, jumps: 0, dive: false, buffer: 0,
    spinT: 0, tilt: 0, sq: 0, invuln: 0,
    wheelAngle: 0, crank: 0, flapT: 0, scarf: 0
  };

  /* ------------------------------------------------------------------ */
  /* Sound                                                               */
  /* ------------------------------------------------------------------ */

  const audio = (() => {
    let ac = null;
    let bus = null;
    let muted = false;
    try { muted = localStorage.getItem('pelicanMuted') === '1'; } catch (e) { /* ignore */ }

    function ensure() {
      if (ac) {
        if (ac.state === 'suspended') ac.resume();
        return true;
      }
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      try {
        ac = new AC();
        bus = ac.createGain();
        bus.gain.value = muted ? 0 : 0.32;
        bus.connect(ac.destination);
      } catch (e) {
        return false;
      }
      return true;
    }

    function tone(freq, dur, opts = {}) {
      if (!ensure() || muted) return;
      const { to = null, type = 'sine', gain = 0.22, delay = 0, attack = 0.008 } = opts;
      const t0 = ac.currentTime + delay;
      const osc = ac.createOscillator();
      const g = ac.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(Math.max(20, freq), t0);
      if (to) osc.frequency.exponentialRampToValueAtTime(Math.max(20, to), t0 + dur);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), t0 + attack);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.connect(g);
      g.connect(bus);
      osc.start(t0);
      osc.stop(t0 + dur + 0.03);
    }

    function noise(dur = 0.2, opts = {}) {
      if (!ensure() || muted) return;
      const { gain = 0.18, freq = 1200, type = 'lowpass', q = 1, delay = 0 } = opts;
      const t0 = ac.currentTime + delay;
      const len = Math.max(1, Math.floor(ac.sampleRate * dur));
      const buf = ac.createBuffer(1, len, ac.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
      const src = ac.createBufferSource();
      src.buffer = buf;
      const f = ac.createBiquadFilter();
      f.type = type;
      f.frequency.value = freq;
      f.Q.value = q;
      const g = ac.createGain();
      g.gain.setValueAtTime(gain, t0);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      src.connect(f);
      f.connect(g);
      g.connect(bus);
      src.start(t0);
      src.stop(t0 + dur + 0.02);
    }

    const notes = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.51];

    return {
      unlock() { ensure(); },
      get muted() { return muted; },
      setMuted(v) {
        muted = v;
        try { localStorage.setItem('pelicanMuted', v ? '1' : '0'); } catch (e) { /* ignore */ }
        if (bus) bus.gain.value = v ? 0 : 0.32;
      },
      jump() { tone(300, 0.16, { to: 620, type: 'triangle', gain: 0.15 }); },
      flap() {
        noise(0.14, { gain: 0.11, freq: 900, type: 'bandpass', q: 0.8 });
        tone(520, 0.12, { to: 900, type: 'triangle', gain: 0.09, delay: 0.01 });
      },
      coin(step) {
        const f = notes[((step % notes.length) + notes.length) % notes.length];
        tone(f, 0.16, { type: 'triangle', gain: 0.13 });
        tone(f * 2, 0.11, { type: 'sine', gain: 0.055, delay: 0.035 });
      },
      golden() {
        [0, 0.075, 0.15, 0.225].forEach((d, i) =>
          tone(notes[3 + i], 0.24, { type: 'triangle', gain: 0.115, delay: d }));
      },
      land(hard) {
        noise(0.1, { gain: hard > 1200 ? 0.15 : 0.06, freq: 260, type: 'lowpass' });
        if (hard > 1200) tone(110, 0.12, { to: 58, type: 'sine', gain: 0.09 });
      },
      hit() {
        noise(0.35, { gain: 0.28, freq: 700, type: 'lowpass' });
        tone(180, 0.4, { to: 48, type: 'sawtooth', gain: 0.15 });
      },
      smash() {
        noise(0.16, { gain: 0.19, freq: 1800, type: 'bandpass' });
        tone(420, 0.12, { to: 180, type: 'square', gain: 0.07 });
      },
      crash() {
        noise(0.6, { gain: 0.3, freq: 500, type: 'lowpass' });
        [330, 262, 196, 147].forEach((f, i) =>
          tone(f, 0.32, { type: 'sawtooth', gain: 0.085, delay: 0.08 + i * 0.11 }));
      },
      click() { tone(660, 0.07, { type: 'square', gain: 0.055 }); },
      pause() { tone(440, 0.1, { to: 330, type: 'triangle', gain: 0.07 }); },
      dive() { noise(0.18, { gain: 0.07, freq: 1600, type: 'bandpass' }); },
      frenzyEnd() { tone(330, 0.22, { to: 220, type: 'sine', gain: 0.07 }); }
    };
  })();

  function vibrate(pattern) {
    if (!navigator.vibrate) return;
    if (navigator.userActivation && !navigator.userActivation.hasBeenActive) return;
    try { navigator.vibrate(pattern); } catch (e) { /* ignore */ }
  }

  /* ------------------------------------------------------------------ */
  /* Scores                                                              */
  /* ------------------------------------------------------------------ */

  const HS_KEY = 'pelicanPedalScores_v1';
  const fmt = (n) => Math.floor(n).toLocaleString('en-US');

  function dateStamp() {
    const d = new Date();
    return String(d.getMonth() + 1).padStart(2, '0') + '.' + String(d.getDate()).padStart(2, '0');
  }

  function loadScores() {
    let list = [];
    try {
      const raw = localStorage.getItem(HS_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        if (Array.isArray(data)) {
          list = data.filter((e) => e && Number.isFinite(e.score));
        }
      }
    } catch (e) { list = []; }
    list.sort((a, b) => b.score - a.score);
    S.scores = list.slice(0, 8);
    S.best = S.scores.length ? S.scores[0].score : 0;
  }

  function persistScores() {
    try { localStorage.setItem(HS_KEY, JSON.stringify(S.scores)); } catch (e) { /* ignore */ }
  }

  function renderScores(listEl, highlight) {
    listEl.textContent = '';
    const items = S.scores.slice(0, 5);
    if (!items.length) {
      const li = document.createElement('li');
      li.className = 'empty';
      li.textContent = 'No runs yet — the boardwalk is all yours.';
      listEl.appendChild(li);
      return;
    }
    items.forEach((entry, i) => {
      const li = document.createElement('li');
      li.className = 'score-row' + (entry === highlight ? ' highlight' : '');
      const rank = document.createElement('span');
      rank.className = 'rank';
      rank.textContent = String(i + 1).padStart(2, '0');
      const score = document.createElement('span');
      score.className = 's-score';
      score.textContent = fmt(entry.score);
      const meta = document.createElement('span');
      meta.className = 's-meta';
      meta.textContent = fmt(entry.distance || 0) + ' m · ' + (entry.date || '');
      li.append(rank, score, meta);
      listEl.appendChild(li);
    });
  }

  function animateNumber(el, target, duration = 700) {
    const start = performance.now();
    const from = 0;
    function step(now) {
      const p = clamp((now - start) / duration, 0, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(from + (target - from) * eased);
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  /* ------------------------------------------------------------------ */
  /* Canvas + world setup                                                */
  /* ------------------------------------------------------------------ */

  let skyGrad = null;
  let seaGrad = null;
  let deckGrad = null;
  let sunSprite = null;
  let vignetteGrad = null;

  function resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    S.W = w;
    S.H = h;
    S.DPR = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(w * S.DPR);
    canvas.height = Math.round(h * S.DPR);
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(S.DPR, 0, 0, S.DPR, 0, 0);

    S.U = clamp(Math.min(h / 700, w / 540), 0.6, 1.32);
    S.groundY = Math.round(h * 0.79);
    S.horizon = Math.round(h * 0.52);
    S.boardTop = Math.round(h * 0.702);

    const menu = S.mode === 'start';
    P.x = Math.round(w * (menu ? (w > 900 ? 0.72 : 0.5) : (w > 900 ? 0.28 : 0.30)));
    if (menu || S.mode === 'over') P.y = S.groundY;
    if (S.mode === 'play' && P.grounded) P.y = S.groundY;

    buildBackdrop();
    updateHearts();
  }

  function buildBackdrop() {
    skyGrad = ctx.createLinearGradient(0, -40, 0, S.groundY);
    skyGrad.addColorStop(0.0, '#171033');
    skyGrad.addColorStop(0.2, '#341b4e');
    skyGrad.addColorStop(0.42, '#722b5d');
    skyGrad.addColorStop(0.6, '#c1496a');
    skyGrad.addColorStop(0.77, '#f97a5e');
    skyGrad.addColorStop(1.0, '#ffd08a');

    seaGrad = ctx.createLinearGradient(0, S.horizon, 0, S.boardTop);
    seaGrad.addColorStop(0, '#d75d72');
    seaGrad.addColorStop(0.42, '#9c3f70');
    seaGrad.addColorStop(1, '#4b2a68');

    deckGrad = ctx.createLinearGradient(0, S.boardTop, 0, S.H);
    deckGrad.addColorStop(0, '#4a2b61');
    deckGrad.addColorStop(0.2, '#3a2354');
    deckGrad.addColorStop(0.55, '#2a1845');
    deckGrad.addColorStop(1, '#1b1030');

    vignetteGrad = ctx.createRadialGradient(S.W * 0.5, S.H * 0.44, S.H * 0.2, S.W * 0.5, S.H * 0.5, Math.max(S.W, S.H) * 0.78);
    vignetteGrad.addColorStop(0, 'rgba(12,6,24,0)');
    vignetteGrad.addColorStop(1, 'rgba(12,6,24,0.55)');

    const size = 560;
    sunSprite = document.createElement('canvas');
    sunSprite.width = size;
    sunSprite.height = size;
    const c = sunSprite.getContext('2d');
    const cx = size / 2;
    const cy = size / 2;

    const glow = c.createRadialGradient(cx, cy, 30, cx, cy, size / 2);
    glow.addColorStop(0, 'rgba(255,230,160,0.85)');
    glow.addColorStop(0.35, 'rgba(255,180,120,0.3)');
    glow.addColorStop(1, 'rgba(255,140,110,0)');
    c.fillStyle = glow;
    c.fillRect(0, 0, size, size);

    const disc = c.createLinearGradient(0, cy - 100, 0, cy + 100);
    disc.addColorStop(0, '#fff6cf');
    disc.addColorStop(0.55, '#ffd166');
    disc.addColorStop(1, '#ff9e64');
    c.fillStyle = disc;
    c.beginPath();
    c.arc(cx, cy, 96, 0, TAU);
    c.fill();

    c.save();
    c.beginPath();
    c.arc(cx, cy, 96, 0, TAU);
    c.clip();
    c.globalCompositeOperation = 'destination-out';
    for (let i = 0; i < 4; i++) {
      c.fillStyle = '#000';
      c.fillRect(cx - 110, cy + 12 + i * 23, 220, 4 + i * 2.6);
    }
    c.restore();
    c.globalCompositeOperation = 'source-over';
  }

  /* ------------------------------------------------------------------ */
  /* Flow                                                                */
  /* ------------------------------------------------------------------ */

  function updateHearts() {
    dom.hearts.forEach((heart, i) => heart.classList.toggle('lost', i >= S.hearts));
  }

  function resetRun() {
    S.score = 0;
    S.distance = 0;
    S.fish = 0;
    S.hearts = 3;
    S.combo = 0;
    S.multiplier = 1;
    S.comboTimer = 0;
    S.frenzy = 0;
    S.elapsed = 0;
    S.speedPx = 0;
    S.timeScale = 1;
    S.slowT = 0;
    S.trailT = 0;
    S.shake = 0;
    S.flash = 0;
    S.obstacles.length = 0;
    S.fishes.length = 0;
    S.particles.length = 0;
    S.popups.length = 0;
    S.spawnTimer = 2.2;
    S.lastGolden = -40;
    S.crashT = 0;
    S.newBest = false;
    S.hintT = 5;
    S.acc = 0;

    P.x = Math.round(S.W * (S.W > 900 ? 0.28 : 0.30));
    P.y = S.groundY;
    P.vy = 0;
    P.grounded = true;
    P.jumps = 0;
    P.dive = false;
    P.buffer = 0;
    P.spinT = 0;
    P.tilt = 0;
    P.sq = 0;
    P.invuln = 0;
    P.wheelAngle = 0;
    P.crank = 0;
    P.flapT = 0;

    for (let i = 0; i < 5; i++) {
      addFish(S.W * 0.8 + i * 46 * S.U, 94 + Math.sin(i * 0.8) * 12);
    }
    for (let i = 0; i < 3; i++) {
      addFish(S.W * 1.3 + i * 52 * S.U, 148 + i * 18);
    }

    updateHearts();
    updateHUD(true);
  }

  function startGame() {
    if (S.mode === 'play') return;
    audio.unlock();
    audio.click();
    resetRun();
    S.mode = 'play';
    dom.startScreen.classList.add('hidden');
    dom.pauseScreen.classList.add('hidden');
    dom.overScreen.classList.add('hidden');
    dom.hud.classList.remove('hidden');
    dom.hint.classList.remove('hidden');
    dom.bestMini.textContent = fmt(S.best);
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    S.lastHud = 0;
    updateHUD(true);
  }

  function toMenu() {
    S.mode = 'start';
    S.menuT = 0;
    S.speedPx = 0;
    S.obstacles.length = 0;
    S.fishes.length = 0;
    S.particles.length = 0;
    S.popups.length = 0;
    S.frenzy = 0;
    dom.hud.classList.add('hidden');
    dom.pauseScreen.classList.add('hidden');
    dom.overScreen.classList.add('hidden');
    dom.startScreen.classList.remove('hidden');
    dom.hint.classList.add('hidden');
    dom.frenzyWrap.classList.remove('on');
    P.x = Math.round(S.W * (S.W > 900 ? 0.72 : 0.5));
    P.y = S.groundY;
    P.vy = 0;
    P.grounded = true;
    P.tilt = 0;
    P.sq = 0;
    P.spinT = 0;
    P.invuln = 0;
    P.crank = 0;
    loadScores();
    renderScores(dom.startScores, null);
    dom.bestMini.textContent = fmt(S.best);
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
  }

  function pauseGame() {
    if (S.mode !== 'play') return;
    S.mode = 'pause';
    dom.pauseScreen.classList.remove('hidden');
    dom.hint.classList.add('hidden');
    audio.pause();
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
  }

  function resumeGame() {
    if (S.mode !== 'pause') return;
    S.mode = 'play';
    dom.pauseScreen.classList.add('hidden');
    S.acc = 0;
    last = performance.now();
    audio.click();
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
  }

  function startCrash() {
    if (S.mode !== 'play') return;
    S.mode = 'crash';
    S.crashT = 0;
    S.timeScale = 0.62;
    S.slowT = 0;
    P.invuln = 999;
    P.vy = -980 * S.U;
    P.grounded = false;
    P.sq = -0.2;
    addShake(1.7);
    S.flash = 1;
    burstFeathers(P.x, P.y - 120 * S.U, 30);
    audio.crash();
    vibrate([45, 35, 90]);
    dom.hint.classList.add('hidden');
  }

  function finishRun() {
    if (S.mode === 'over') return;
    S.mode = 'over';

    const entry = {
      score: Math.floor(S.score),
      distance: Math.floor(S.distance),
      fish: S.fish,
      date: dateStamp()
    };
    const prevBest = S.scores.length ? S.scores[0].score : 0;
    S.newBest = entry.score > prevBest && entry.score > 0;

    let highlight = null;
    if (entry.score > 0) {
      S.scores.push(entry);
      S.scores.sort((a, b) => b.score - a.score);
      S.scores = S.scores.slice(0, 8);
      if (S.scores.indexOf(entry) !== -1) highlight = entry;
      persistScores();
    }
    S.best = S.scores.length ? S.scores[0].score : 0;

    dom.overScore.textContent = '0';
    animateNumber(dom.overScore, entry.score, 750);
    dom.overBest.textContent = fmt(S.best);
    dom.overDistance.textContent = fmt(entry.distance) + ' m';
    dom.overFish.textContent = fmt(entry.fish);
    dom.newBest.classList.toggle('hidden', !S.newBest);
    dom.overEyebrow.textContent = S.newBest ? 'A new boardwalk record' : 'Run complete';
    renderScores(dom.overScores, highlight);
    dom.bestMini.textContent = fmt(S.best);
    dom.hud.classList.add('hidden');
    dom.overScreen.classList.remove('hidden');
    dom.hint.classList.add('hidden');
  }

  function updateHUD(force = false) {
    const now = performance.now();
    if (!force && now - S.lastHud < 55) return;
    S.lastHud = now;
    dom.score.textContent = fmt(S.score);
    dom.distance.textContent = fmt(S.distance) + ' m';
    dom.fishCount.textContent = fmt(S.fish) + ' fish';
    dom.comboWrap.classList.toggle('on', S.multiplier > 1);
    dom.combo.textContent = 'x' + S.multiplier;
    dom.comboBar.style.transform = 'scaleX(' + clamp(S.comboTimer / 4.5, 0, 1).toFixed(3) + ')';
    dom.frenzyWrap.classList.toggle('on', S.frenzy > 0);
    if (S.frenzy > 0) {
      dom.frenzyBar.style.transform = 'scaleX(' + clamp(S.frenzy / 7.5, 0, 1).toFixed(3) + ')';
    }
  }

  function bumpScore() {
    dom.score.classList.remove('bump');
    void dom.score.offsetWidth;
    dom.score.classList.add('bump');
  }

  /* ------------------------------------------------------------------ */
  /* Input                                                               */
  /* ------------------------------------------------------------------ */

  function doGroundJump() {
    P.grounded = false;
    P.jumps = 1;
    P.dive = false;
    P.vy = -1080 * S.U;
    P.sq = -0.42;
    P.buffer = 0;
    spawnDust(P.x - 16 * S.U, S.groundY, 5);
    addShake(0.09);
    audio.jump();
  }

  function doFlap() {
    P.jumps = 2;
    P.vy = -980 * S.U;
    P.dive = false;
    P.spinT = 0.6;
    P.flapT = 0.35;
    P.sq = -0.3;
    P.buffer = 0;
    S.score += 5;
    popup('FLAP +5', P.x, P.y - 200 * S.U, '#b8fff3', 0.8);
    burstFeathers(P.x - 10 * S.U, P.y - 110 * S.U, 5);
    addShake(0.12);
    audio.flap();
    updateHUD(true);
  }

  function onJump() {
    if (S.mode === 'start' || S.mode === 'over') { startGame(); return; }
    if (S.mode === 'pause') { resumeGame(); return; }
    if (S.mode !== 'play') return;
    audio.unlock();
    if (P.grounded) doGroundJump();
    else if (P.jumps < 2) doFlap();
    else P.buffer = 0.14;
  }

  function onDive() {
    if (S.mode !== 'play' || P.grounded || P.dive) return;
    P.dive = true;
    P.vy = Math.max(P.vy, 1600 * S.U);
    P.spinT = 0;
    spawnDust(P.x, P.y - 20 * S.U, 4);
    audio.dive();
  }

  function toggleMute() {
    const next = !audio.muted;
    audio.setMuted(next);
    dom.muteBtn.classList.toggle('muted', next);
    dom.muteBtn.setAttribute('aria-label', next ? 'Unmute sound' : 'Mute sound');
  }

  /* ------------------------------------------------------------------ */
  /* Obstacles, fish & particles                                         */
  /* ------------------------------------------------------------------ */

  function addObstacle(type, x) {
    const o = {
      type, x,
      phase: rand(0, TAU),
      dead: false,
      near: false,
      wU: 70, hU: 58,
      baseOff: 300
    };
    if (type === 'crab') { o.wU = 82; o.hU = 50; }
    else if (type === 'ball') { o.wU = 66; o.hU = 66; }
    else if (type === 'gull') { o.wU = 94; o.hU = 70; o.baseOff = 300; }
    S.obstacles.push(o);
    return o;
  }

  function obstacleBox(o) {
    const u = S.U;
    if (o.type === 'gull') {
      const cy = S.groundY - (o.baseOff + Math.sin(o.phase) * 10) * u;
      return { x: o.x - (o.wU * u) / 2, y: cy - (o.hU * u) / 2, w: o.wU * u, h: o.hU * u };
    }
    if (o.type === 'ball') {
      const bounce = ((Math.sin(o.phase) + 1) / 2) * 92 * u;
      return { x: o.x - (o.wU * u) / 2, y: S.groundY - o.hU * u - bounce, w: o.wU * u, h: o.hU * u };
    }
    return { x: o.x - (o.wU * u) / 2, y: S.groundY - o.hU * u, w: o.wU * u, h: o.hU * u };
  }

  function playerBox() {
    const w = 64 * S.U;
    const h = 150 * S.U;
    return { x: P.x - w / 2, y: P.y - h, w, h };
  }

  function addFish(x, off, color) {
    S.fishes.push({
      x,
      off,
      color: color || (Math.random() < 0.34 ? 'coral' : 'teal'),
      golden: color === 'golden',
      phase: rand(0, TAU)
    });
  }

  function fishY(f) {
    return S.groundY - f.off * S.U + Math.sin(f.phase) * 5 * S.U;
  }

  function fishArc(cx, baseOff, count, span, lift) {
    for (let i = 0; i < count; i++) {
      const t = count === 1 ? 0.5 : i / (count - 1);
      addFish(cx + (t - 0.5) * span * S.U, baseOff + Math.sin(t * Math.PI) * lift);
    }
  }

  function fishLine(cx, off, count, gap) {
    for (let i = 0; i < count; i++) {
      addFish(cx + i * gap * S.U, off + Math.sin(i * 0.9) * 9);
    }
  }

  function spawnPattern() {
    const u = S.U;
    const x = S.W + 140 * u;
    const d = clamp(S.elapsed / 95, 0, 1);

    const choices = [['rock', 26], ['fish', 12]];
    if (S.elapsed > 5) choices.push(['crab', 15]);
    if (S.elapsed > 8) choices.push(['ball', 15]);
    if (S.elapsed > 14) choices.push(['gull', 14]);
    if (S.elapsed > 20) choices.push(['double', 12]);
    if (S.elapsed > 15 && S.elapsed - S.lastGolden > 24 && S.frenzy <= 0) choices.push(['golden', 24]);

    let total = 0;
    for (const c of choices) total += c[1];
    let roll = Math.random() * total;
    let type = 'rock';
    for (const c of choices) {
      roll -= c[1];
      if (roll <= 0) { type = c[0]; break; }
    }

    switch (type) {
      case 'rock':
        addObstacle('rock', x);
        if (Math.random() < 0.75) fishArc(x, 104, 5, 168, 72);
        break;
      case 'crab':
        addObstacle('crab', x);
        if (Math.random() < 0.5) fishArc(x, 102, 3, 110, 48);
        break;
      case 'ball':
        addObstacle('ball', x);
        if (Math.random() < 0.6) fishArc(x, 118, 3, 120, 50);
        break;
      case 'gull':
        addObstacle('gull', x);
        if (Math.random() < 0.35) fishLine(x + 30 * u, 88, 3, 44);
        break;
      case 'double':
        addObstacle('rock', x);
        addObstacle('rock', x + 82 * u);
        fishArc(x + 41 * u, 116, 5, 210, 78);
        break;
      case 'golden':
        addFish(x, 205, 'golden');
        fishLine(x - 140 * u, 90, 2, 42);
        S.lastGolden = S.elapsed;
        break;
      case 'fish':
      default:
        fishLine(x, rand(78, 118), randInt(4, 6), 44);
        break;
    }

    let gap = lerp(1.5, 0.94, d) * rand(0.92, 1.22);
    if (type === 'gull' || type === 'double') gap += 0.3;
    S.spawnTimer = gap;
  }

  function addShake(amount) {
    S.shake = Math.min(1.7, S.shake + amount);
  }

  function addParticle(p) {
    if (S.particles.length > 280) S.particles.shift();
    S.particles.push(p);
  }

  function spawnDust(x, y, n) {
    const u = S.U;
    for (let i = 0; i < n; i++) {
      addParticle({
        type: 'puff',
        x: x + rand(-14, 14) * u,
        y: y - rand(0, 7) * u,
        vx: -S.speedPx * rand(0.1, 0.32) + rand(-30, 20),
        vy: rand(-100, -20) * u,
        g: 90 * u,
        drag: 2.2,
        life: rand(0.28, 0.6),
        max: 0.6,
        size: rand(3.5, 8) * u,
        rot: 0, vr: 0,
        color: Math.random() < 0.4 ? '#ffb9a8' : '#ffe9cf'
      });
    }
  }

  function burstFeathers(x, y, n) {
    const u = S.U;
    for (let i = 0; i < n; i++) {
      addParticle({
        type: 'feather',
        x: x + rand(-22, 22) * u,
        y: y + rand(-18, 18) * u,
        vx: rand(-260, 190),
        vy: rand(-420, -90) * u,
        g: 900 * u,
        drag: 1.1,
        life: rand(0.6, 1.2),
        max: 1.2,
        size: rand(5, 10) * u,
        rot: rand(0, TAU),
        vr: rand(-9, 9),
        color: Math.random() < 0.25 ? '#ffd166' : '#fff6e4'
      });
    }
  }

  function addSpark(x, y, n, color = '#ffd166') {
    const u = S.U;
    for (let i = 0; i < n; i++) {
      const a = rand(0, TAU);
      const sp = rand(40, 230) * u;
      addParticle({
        type: 'spark',
        x, y,
        vx: Math.cos(a) * sp - S.speedPx * 0.18,
        vy: Math.sin(a) * sp - 40 * u,
        g: 380 * u,
        drag: 1.5,
        life: rand(0.25, 0.6),
        max: 0.6,
        size: rand(2, 4.5) * u,
        rot: a,
        vr: rand(-4, 4),
        color
      });
    }
  }

  function shatter(o, n) {
    const b = obstacleBox(o);
    const colors = o.type === 'rock'
      ? ['#6d4a72', '#8a5d80', '#4b3158']
      : o.type === 'ball'
        ? ['#ff6b6b', '#2ec4b6', '#ffd166', '#fff4dd']
        : ['#ff8a72', '#d4555e', '#ffd166'];
    for (let i = 0; i < n; i++) {
      addParticle({
        type: 'shard',
        x: b.x + b.w * rand(0.2, 0.8),
        y: b.y + b.h * rand(0.1, 0.8),
        vx: rand(-260, 80) - S.speedPx * 0.12,
        vy: rand(-430, -80) * S.U,
        g: 1300 * S.U,
        drag: 0.6,
        life: rand(0.4, 0.85),
        max: 0.85,
        size: rand(4, 10) * S.U,
        rot: rand(0, TAU),
        vr: rand(-12, 12),
        color: pick(colors)
      });
    }
  }

  function popup(text, x, y, color = '#fff4dd', scale = 1) {
    S.popups.push({
      text, x, y,
      vx: -S.speedPx * 0.28,
      vy: -62 * S.U,
      life: 0.95,
      max: 0.95,
      color,
      scale
    });
  }

  function collectFish(f, index) {
    S.fishes.splice(index, 1);
    const y = fishY(f);
    if (f.golden) {
      S.frenzy = 7.5;
      S.score += 100;
      dom.hint.classList.add('hidden');
      popup('FISH FRENZY!', f.x, y - 24 * S.U, '#ffd166', 1.15);
      addSpark(f.x, y, 26, '#ffd166');
      addShake(0.3);
      audio.golden();
      vibrate(30);
      updateHUD(true);
      return;
    }

    S.fish++;
    S.combo++;
    S.comboTimer = 4.5;
    const nextMultiplier = Math.min(8, 1 + Math.floor(S.combo / 4));
    if (nextMultiplier > S.multiplier) {
      popup('COMBO x' + nextMultiplier, P.x, P.y - 252 * S.U, '#ffd166', 1.02);
      addShake(0.14);
    }
    S.multiplier = nextMultiplier;
    const points = 10 * S.multiplier * (S.frenzy > 0 ? 3 : 1);
    S.score += points;
    popup(
      '+' + points,
      f.x + rand(-18, 18) * S.U,
      y - 12 * S.U + rand(-7, 7) * S.U,
      S.frenzy > 0 ? '#ffd166' : '#b8fff3',
      0.9
    );
    addSpark(f.x, y, 7, S.frenzy > 0 ? '#ffd166' : '#b8fff3');
    audio.coin(S.combo - 1);
    bumpScore();
    updateHUD(true);
  }

  function damage(o) {
    if (S.mode !== 'play' || P.invuln > 0) return;
    o.dead = true;
    shatter(o, 12);

    S.hearts = Math.max(0, S.hearts - 1);
    updateHearts();
    S.combo = 0;
    S.multiplier = 1;
    S.comboTimer = 0;

    P.invuln = 1.7;
    P.grounded = false;
    P.vy = -640 * S.U;
    P.jumps = 2;
    P.dive = false;
    P.spinT = 0;
    P.sq = -0.4;

    S.slowT = 0.55;
    S.timeScale = 0.38;
    addShake(1.15);
    S.flash = 0.9;
    burstFeathers(P.x, P.y - 118 * S.U, 24);
    popup('OUCH!', P.x, P.y - 238 * S.U, '#ff8f8f', 1.12);
    audio.hit();
    vibrate([22, 26, 18]);
    updateHUD(true);

    if (S.hearts <= 0) startCrash();
  }

  function smash(o) {
    const b = obstacleBox(o);
    const cx = b.x + b.w / 2;
    const cy = b.y + b.h / 2;
    o.dead = true;
    shatter(o, 14);
    addSpark(cx, cy, 8, '#ffd166');
    S.score += 25 * S.multiplier;
    popup('+' + (25 * S.multiplier), cx, cy - 18 * S.U, '#ffd166', 0.95);
    addShake(0.3);
    audio.smash();
    updateHUD(true);
  }

  /* ------------------------------------------------------------------ */
  /* Simulation                                                          */
  /* ------------------------------------------------------------------ */

  function updateMenu(dt) {
    S.menuT += dt;
    const speed = 220 * S.U;
    S.speedPx = speed;

    P.x = Math.round(S.W * (S.W > 900 ? 0.72 : 0.5));
    P.y = S.groundY;
    P.grounded = true;
    P.tilt = -0.015;
    P.sq = 0;
    P.invuln = 0;
    P.spinT = 0;
    P.crank += dt * 3.4;
    P.wheelAngle += (speed * dt) / (38 * S.U);
    P.scarf += dt * 7;

    updateScroll(dt);
    updateParticles(dt);
    updatePopups(dt);
  }

  function updateScroll(dt) {
    S.scroll.cloud += (S.speedPx * 0.045 + 10) * dt;
    S.scroll.sea += S.speedPx * 0.16 * dt;
    S.scroll.palm += S.speedPx * 0.42 * dt;
    S.scroll.board += S.speedPx * dt;
    S.scroll.fore += S.speedPx * 1.35 * dt;
  }

  function updatePlayer(dt) {
    const u = S.U;
    P.invuln = Math.max(0, P.invuln - dt);
    P.buffer = Math.max(0, P.buffer - dt);
    P.flapT = Math.max(0, P.flapT - dt);
    P.scarf += dt * (4.5 + S.speedPx * 0.01);

    if (!P.grounded) {
      const g = 3400 * u * (P.dive ? 1.45 : 1);
      P.vy += g * dt;
      P.y += P.vy * dt;
      if (P.y >= S.groundY) {
        const impact = Math.max(0, P.vy);
        P.y = S.groundY;
        P.vy = 0;
        P.grounded = true;
        P.jumps = 0;
        P.dive = false;
        P.spinT = 0;
        P.sq = clamp(impact / (3200 * u), 0, 0.85);
        if (impact > 500 * u) {
          spawnDust(P.x - 12 * u, S.groundY, Math.min(13, 3 + Math.floor(impact / (300 * u))));
          addShake(clamp(impact / (5200 * u), 0, 0.5));
          audio.land(impact / u);
          if (impact > 1500 * u) vibrate(10);
        }
        if (P.buffer > 0) {
          P.buffer = 0;
          doGroundJump();
        }
      }
    } else {
      P.y = S.groundY;
    }

    P.sq += (0 - P.sq) * Math.min(1, dt * 10);

    let tiltTarget = 0;
    if (!P.grounded) {
      tiltTarget = clamp(P.vy / (9000 * u), -0.22, 0.3) + (P.dive ? 0.1 : 0);
    }
    P.tilt += (tiltTarget - P.tilt) * Math.min(1, dt * 10);

    const wheelFactor = P.grounded ? 1 : 0.25;
    P.wheelAngle += (S.speedPx * wheelFactor * dt) / (38 * u);
    if (P.grounded) P.crank += (S.speedPx * dt) / (62 * u);

    if (P.spinT > 0) P.spinT = Math.max(0, P.spinT - dt);
  }

  function updateObstacles(dt) {
    const speed = S.speedPx;
    for (let i = S.obstacles.length - 1; i >= 0; i--) {
      const o = S.obstacles[i];
      o.x -= speed * dt;
      if (o.type === 'crab') o.x -= 34 * S.U * dt;
      if (o.type === 'ball') o.phase += dt * 4.2;
      else o.phase += dt * (o.type === 'gull' ? 8 : 9);
      if (o.x < -280 * S.U || o.dead) S.obstacles.splice(i, 1);
    }
  }

  function updateFishes(dt) {
    const u = S.U;
    const px = P.x;
    const py = P.y - 95 * u;
    for (let i = S.fishes.length - 1; i >= 0; i--) {
      const f = S.fishes[i];
      f.x -= S.speedPx * dt;
      f.phase += dt * (f.golden ? 5 : 3);

      if (S.frenzy > 0 && !f.golden) {
        const dx = px - f.x;
        if (Math.abs(dx) < 320 * u) {
          const fy = fishY(f);
          f.x += dx * Math.min(1, dt * 8);
          f.off += ((py - fy) / u) * Math.min(1, dt * 4);
        }
      }

      const fy = fishY(f);
      const r = (f.golden ? 72 : 52) * u;
      const dx = f.x - px;
      const dy = fy - py;
      if (dx * dx + dy * dy < r * r) {
        collectFish(f, i);
        continue;
      }

      if (f.x < -120 * u) S.fishes.splice(i, 1);
    }
  }

  function updateParticles(dt) {
    for (let i = S.particles.length - 1; i >= 0; i--) {
      const p = S.particles[i];
      p.life -= dt;
      if (p.life <= 0) { S.particles.splice(i, 1); continue; }
      p.vy += p.g * dt;
      p.vx *= Math.max(0, 1 - p.drag * dt);
      p.vy *= Math.max(0, 1 - p.drag * 0.4 * dt);
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rot += p.vr * dt;
    }
  }

  function updatePopups(dt) {
    for (let i = S.popups.length - 1; i >= 0; i--) {
      const p = S.popups[i];
      p.life -= dt;
      if (p.life <= 0) { S.popups.splice(i, 1); continue; }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy *= Math.max(0, 1 - dt * 1.8);
    }
  }

  function checkCollisions() {
    if (S.mode !== 'play') return;
    const pb = playerBox();
    const pad = 4 * S.U;

    for (let i = 0; i < S.obstacles.length; i++) {
      const o = S.obstacles[i];
      if (o.dead) continue;
      const b = obstacleBox(o);
      if (
        pb.x + pb.w > b.x + pad &&
        pb.x < b.x + b.w - pad &&
        pb.y + pb.h > b.y + pad &&
        pb.y < b.y + b.h - pad
      ) {
        if (S.frenzy > 0) {
          smash(o);
        } else if (P.invuln <= 0) {
          damage(o);
        }
        if (S.mode !== 'play') return;
      }
    }

    for (const o of S.obstacles) {
      if (o.dead || o.near || o.type === 'gull') continue;
      const b = obstacleBox(o);
      if (b.x + b.w < P.x - 18 * S.U) {
        o.near = true;
        if (P.invuln <= 0 && P.y < S.groundY - 4 * S.U) {
          const clearance = b.y - P.y;
          if (clearance >= 0 && clearance < 30 * S.U) {
            const pts = 20 * S.multiplier;
            S.score += pts;
            popup('CLOSE +' + pts, P.x + 36 * S.U, P.y - 168 * S.U, '#b8fff3', 0.78);
            addSpark(P.x, P.y - 30 * S.U, 6, '#b8fff3');
            addShake(0.16);
            updateHUD(true);
          }
        }
      }
    }
  }

  function updateGame(dt) {
    if (S.mode !== 'play' && S.mode !== 'crash') return;

    if (S.mode === 'crash') {
      S.crashT += dt;
      P.vy += 3000 * S.U * dt;
      P.y += P.vy * dt;
      if (P.y > S.groundY) {
        P.y = S.groundY;
        if (P.vy > 220 * S.U) spawnDust(P.x, S.groundY, 8);
        P.vy = Math.abs(P.vy) > 300 * S.U ? -P.vy * 0.28 : 0;
      }
      S.speedPx *= Math.max(0, 1 - dt * 2.2);
      updateParticles(dt);
      updatePopups(dt);
      updateScroll(dt);
      if (S.crashT >= 1.15) finishRun();
      return;
    }

    S.elapsed += dt;
    const d = clamp(S.elapsed / 95, 0, 1);
    const u = S.U;
    const base = clamp(S.W * 0.55, 300, 880);
    const boost = S.W < 700 ? 0.58 : 0.82;
    const ramp = 0.42 + 0.58 * Math.min(1, S.elapsed / 2.2);
    let target = base * (1 + boost * d) * ramp;
    if (S.slowT > 0) target *= 0.5;
    S.slowT = Math.max(0, S.slowT - dt);
    S.speedPx += (target - S.speedPx) * Math.min(1, dt * 3.2);

    S.score += (S.speedPx * dt) / (24 * u);
    S.distance += (S.speedPx * dt) / (46 * u);

    if (S.comboTimer > 0) {
      S.comboTimer = Math.max(0, S.comboTimer - dt);
      if (S.comboTimer === 0) {
        S.combo = 0;
        S.multiplier = 1;
      }
    }

    if (S.frenzy > 0) {
      S.frenzy = Math.max(0, S.frenzy - dt);
      S.trailT += dt;
      while (S.trailT > 0.055) {
        S.trailT -= 0.055;
        addParticle({
          type: 'spark',
          x: P.x - rand(20, 52) * u,
          y: P.y - rand(30, 110) * u,
          vx: -S.speedPx * 0.32,
          vy: rand(-40, 30) * u,
          g: 0,
          drag: 1.4,
          life: rand(0.24, 0.45),
          max: 0.45,
          size: rand(2, 4.5) * u,
          rot: rand(0, TAU),
          vr: rand(-3, 3),
          color: pick(['#ffd166', '#ff8f7a', '#b8fff3'])
        });
      }
      if (S.frenzy === 0) {
        audio.frenzyEnd();
        S.trailT = 0;
      }
    }

    updatePlayer(dt);
    updateObstacles(dt);
    updateFishes(dt);
    checkCollisions();
    updateParticles(dt);
    updatePopups(dt);
    updateScroll(dt);

    S.spawnTimer -= dt;
    if (S.spawnTimer <= 0) spawnPattern();
  }

  /* ------------------------------------------------------------------ */
  /* Drawing helpers                                                     */
  /* ------------------------------------------------------------------ */

  function roundRectPath(x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  }

  function drawIsland(cx, baseY, w, h) {
    ctx.beginPath();
    ctx.moveTo(cx - w / 2, baseY);
    ctx.quadraticCurveTo(cx - w * 0.28, baseY - h * 0.95, cx - w * 0.04, baseY - h * 0.52);
    ctx.quadraticCurveTo(cx + w * 0.1, baseY - h * 1.08, cx + w * 0.24, baseY - h * 0.46);
    ctx.quadraticCurveTo(cx + w * 0.38, baseY - h * 0.16, cx + w / 2, baseY);
    ctx.closePath();
    ctx.fill();
  }

  function drawSky(t) {
    ctx.fillStyle = skyGrad;
    ctx.fillRect(-90, -90, S.W + 180, S.H + 180);

    // faint sunset stars
    for (let i = 0; i < 26; i++) {
      const x = (((i * 137.508) % 100) / 100) * S.W;
      const y = (((i * 53.71) % 100) / 100) * S.H * 0.34 + 8;
      const twinkle = 0.5 + 0.5 * Math.sin(t * 1.6 + i * 2.13);
      const alpha = (0.12 + twinkle * 0.34) * (1 - y / (S.H * 0.55));
      ctx.globalAlpha = Math.max(0, alpha);
      ctx.fillStyle = '#fff6dc';
      ctx.beginPath();
      ctx.arc(x, y, (i % 3 === 0 ? 1.6 : 1) * Math.max(1, S.U * 0.8), 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    if (sunSprite) {
      const size = Math.min(S.W * 0.92, S.H * 0.96, 810);
      const sunX = S.W * 0.755;
      const sunY = S.H * 0.33;
      ctx.globalAlpha = 0.97;
      ctx.drawImage(sunSprite, sunX - size / 2, sunY - size / 2, size, size);
      ctx.globalAlpha = 1;
    }

    ctx.fillStyle = 'rgba(47,22,68,0.72)';
    drawIsland(S.W * 0.14, S.horizon + 1, S.W * 0.24, 58);
    drawIsland(S.W * 0.62, S.horizon + 1, S.W * 0.3, 72);
    drawIsland(S.W * 1.05, S.horizon + 1, S.W * 0.22, 50);
  }

  const CLOUDS = [
    { x: 0.06, y: 0.13, s: 1.05, a: 0.11 },
    { x: 0.28, y: 0.24, s: 0.7, a: 0.08 },
    { x: 0.49, y: 0.09, s: 1.25, a: 0.09 },
    { x: 0.73, y: 0.27, s: 0.82, a: 0.08 },
    { x: 0.92, y: 0.16, s: 1.0, a: 0.1 }
  ];

  function cloudBlob(x, y, s) {
    ctx.beginPath();
    ctx.ellipse(x, y, 60 * s, 19 * s, 0, 0, TAU);
    ctx.ellipse(x - 42 * s, y + 7 * s, 31 * s, 14 * s, 0, 0, TAU);
    ctx.ellipse(x + 44 * s, y + 5 * s, 36 * s, 16 * s, 0, 0, TAU);
    ctx.ellipse(x + 8 * s, y - 10 * s, 34 * s, 17 * s, 0, 0, TAU);
    ctx.fill();
  }

  function drawClouds(t) {
    const span = S.W + 460;
    for (let i = 0; i < CLOUDS.length; i++) {
      const c = CLOUDS[i];
      let x = c.x * span - S.scroll.cloud * (0.18 + i * 0.02) * c.s;
      x = ((x % span) + span) % span - 230;
      const y = c.y * S.H;
      const s = c.s * Math.min(1.2, S.U);
      ctx.fillStyle = 'rgba(255,224,198,' + c.a + ')';
      cloudBlob(x, y, s);
      ctx.fillStyle = 'rgba(255,170,158,' + (c.a * 0.55) + ')';
      cloudBlob(x + 22 * s, y + 9 * s, s * 0.7);
    }
  }

  function drawSea(t) {
    ctx.fillStyle = seaGrad;
    ctx.fillRect(0, S.horizon, S.W, S.boardTop - S.horizon + 2);

    ctx.fillStyle = 'rgba(255,196,140,0.25)';
    ctx.fillRect(0, S.horizon, S.W, 2.5);

    const cx = S.W * 0.755;
    const top = S.horizon;
    const bottom = S.boardTop;

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 13; i++) {
      const y = top + 8 + (i / 13) * (bottom - top - 8);
      const w = (10 + i * 12) * (0.65 + 0.35 * Math.sin(t * 1.4 + i * 1.3));
      ctx.fillStyle = 'rgba(255,209,140,' + Math.max(0, 0.2 - i * 0.012) + ')';
      ctx.beginPath();
      ctx.ellipse(
        cx + Math.sin(t * 0.8 + i * 1.9) * (16 + i * 2),
        y,
        Math.max(4, w),
        2 + i * 0.25,
        0, 0, TAU
      );
      ctx.fill();
    }
    ctx.restore();

    for (let i = 0; i < 9; i++) {
      const y = top + 24 + i * ((bottom - top - 30) / 9);
      const shift = (S.scroll.sea * (0.35 + i * 0.07)) % 240;
      for (let x = -shift - 210; x < S.W + 240; x += 240) {
        const len = 34 + ((i * 47) % 68);
        ctx.fillStyle = 'rgba(255,196,160,' + (0.085 + (i % 3) * 0.028) + ')';
        ctx.fillRect(x + ((i * 61) % 90), y, len, 1.6 + (i % 2));
      }
    }
  }

  function drawPalm(x, baseY, scale) {
    const u = S.U * scale;
    ctx.save();
    ctx.translate(x, baseY);
    ctx.strokeStyle = 'rgba(43,23,69,0.78)';
    ctx.fillStyle = 'rgba(43,23,69,0.78)';
    ctx.lineCap = 'round';
    ctx.lineWidth = 8 * u;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(12 * u, -72 * u, 3 * u, -148 * u);
    ctx.stroke();

    for (let k = 0; k < 7; k++) {
      const a = -Math.PI / 2 + (k - 3) * 0.43 + Math.sin(k * 2.1) * 0.09;
      const len = (62 + (k % 3) * 13) * u;
      ctx.lineWidth = (6.5 + (k % 2)) * u;
      ctx.beginPath();
      ctx.moveTo(3 * u, -148 * u);
      ctx.quadraticCurveTo(
        3 * u + Math.cos(a) * len * 0.55,
        -148 * u + Math.sin(a) * len * 0.55 - 12 * u,
        3 * u + Math.cos(a) * len,
        -148 * u + Math.sin(a) * len + 8 * u
      );
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawPalms() {
    const spacing = Math.max(340, S.W * 0.36);
    const off = S.scroll.palm % spacing;
    const count = Math.ceil(S.W / spacing) + 2;
    for (let i = -1; i <= count; i++) {
      const x = i * spacing - off + 90;
      if (x < -240 || x > S.W + 240) continue;
      const seed = ((i % 3) + 3) % 3;
      drawPalm(x, S.boardTop + 16, 0.54 + seed * 0.07);
    }
  }

  function drawBoardwalk() {
    const y0 = S.boardTop;
    const y1 = S.groundY;

    ctx.fillStyle = '#4a2b61';
    ctx.fillRect(0, y0, S.W, y1 - y0);

    const rowH = Math.max(10, 16 * S.U);
    let row = 0;
    for (let y = y0; y < y1; y += rowH) {
      ctx.fillStyle = row % 2 ? 'rgba(255,244,221,0.035)' : 'rgba(18,9,32,0.1)';
      ctx.fillRect(0, y, S.W, rowH);
      ctx.fillStyle = 'rgba(16,8,28,0.3)';
      ctx.fillRect(0, y, S.W, 1);
      row++;
    }

    const seam = Math.max(52, 88 * S.U);
    const off = S.scroll.board % seam;
    for (let x = -off; x < S.W + seam; x += seam) {
      ctx.fillStyle = 'rgba(24,12,42,0.42)';
      ctx.fillRect(x, y0, 2, y1 - y0);
      ctx.fillStyle = 'rgba(255,244,221,0.05)';
      ctx.fillRect(x + 2, y0, 1, y1 - y0);
    }

    ctx.fillStyle = 'rgba(43,27,77,0.8)';
    ctx.fillRect(0, y0 - 8, S.W, 8);
    ctx.fillStyle = 'rgba(255,209,102,0.55)';
    ctx.fillRect(0, y0 - 3, S.W, 2);

    const postGap = Math.max(90, 130 * S.U);
    const postOff = (S.scroll.board * 0.9) % postGap;
    ctx.fillStyle = 'rgba(28,15,48,0.88)';
    for (let x = -postOff; x < S.W + postGap; x += postGap) {
      ctx.fillRect(x, y0 - 44 * S.U, 5 * S.U, 40 * S.U);
    }
    ctx.fillRect(0, y0 - 44 * S.U, S.W, 4 * S.U);

    ctx.fillStyle = deckGrad;
    ctx.fillRect(0, y1, S.W, S.H - y1);

    const faceGap = Math.max(46, 74 * S.U);
    const faceOff = (S.scroll.board * 0.75) % faceGap;
    for (let x = -faceOff; x < S.W + faceGap; x += faceGap) {
      ctx.fillStyle = 'rgba(12,6,24,0.25)';
      ctx.fillRect(x, y1, 2, S.H - y1);
    }
    for (let y = y1 + 26 * S.U; y < S.H; y += 30 * S.U) {
      ctx.fillStyle = 'rgba(255,244,221,0.035)';
      ctx.fillRect(0, y, S.W, 1);
    }

    ctx.fillStyle = 'rgba(255,209,102,0.3)';
    ctx.fillRect(0, y1 - 1, S.W, 2);
  }

  function drawForeground() {
    const u = S.U;
    ctx.fillStyle = 'rgba(16,8,30,0.9)';
    ctx.beginPath();
    ctx.moveTo(0, S.H);
    const step = Math.max(22, 38 * u);
    for (let x = 0; x <= S.W + step; x += step) {
      const wave = Math.sin((x + S.scroll.fore * 0.9) * 0.017);
      const y = S.H - (16 + wave * 10) * u;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(S.W + step, S.H);
    ctx.closePath();
    ctx.fill();
  }

  /* ------------------------------------------------------------------ */
  /* Obstacles                                                           */
  /* ------------------------------------------------------------------ */

  function drawRock(o, b) {
    const u = S.U;
    const w = o.wU * u;
    const h = o.hU * u;
    ctx.save();
    ctx.translate(o.x, S.groundY);
    ctx.fillStyle = '#5c3d66';
    ctx.strokeStyle = '#2b1b4d';
    ctx.lineWidth = 3 * u;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(-w / 2, 0);
    ctx.lineTo(-w / 2, -h * 0.48);
    ctx.lineTo(-w * 0.28, -h * 0.9);
    ctx.lineTo(-w * 0.04, -h * 0.76);
    ctx.lineTo(w * 0.22, -h * 1.02);
    ctx.lineTo(w * 0.5, -h * 0.4);
    ctx.lineTo(w * 0.44, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = 'rgba(255,244,221,0.14)';
    ctx.beginPath();
    ctx.moveTo(-w * 0.28, -h * 0.85);
    ctx.lineTo(-w * 0.05, -h * 0.73);
    ctx.lineTo(-w * 0.16, -h * 0.42);
    ctx.closePath();
    ctx.fill();

    // a little starfish clinging to the rock
    ctx.save();
    ctx.translate(-w * 0.17, -h * 0.5);
    ctx.rotate(-0.35);
    ctx.fillStyle = '#ff8a72';
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * TAU - Math.PI / 2;
      const r = (i % 2 === 0 ? 8 : 3.6) * u;
      if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
      else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    ctx.restore();
  }

  function drawCrab(o) {
    const u = S.U;
    const w = o.wU * u;
    const h = o.hU * u;
    ctx.save();
    ctx.translate(o.x, S.groundY);
    const sway = Math.sin(o.phase);

    ctx.strokeStyle = '#2b1b4d';
    ctx.lineWidth = 3 * u;
    ctx.lineCap = 'round';
    for (let side = -1; side <= 1; side += 2) {
      for (let i = 0; i < 3; i++) {
        const kick = Math.sin(o.phase + i * 0.9) * 3 * u;
        ctx.beginPath();
        ctx.moveTo(side * w * 0.16, -h * 0.34);
        ctx.lineTo(side * w * 0.36, -h * 0.1 + kick);
        ctx.stroke();
      }
    }

    // claws
    ctx.strokeStyle = '#ff7f6b';
    ctx.lineWidth = 7 * u;
    for (let side = -1; side <= 1; side += 2) {
      ctx.save();
      ctx.translate(side * w * 0.36, -h * 0.56 + sway * 2 * u);
      ctx.rotate(side * (-0.25 + sway * 0.15));
      ctx.beginPath();
      ctx.arc(0, 0, 8.5 * u, 0.55, TAU - 0.55);
      ctx.stroke();
      ctx.restore();
    }

    // body
    ctx.fillStyle = '#ff7f6b';
    ctx.strokeStyle = '#2b1b4d';
    ctx.lineWidth = 2.6 * u;
    ctx.beginPath();
    ctx.ellipse(0, -h * 0.42, w * 0.32, h * 0.36, 0, 0, TAU);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = 'rgba(255,244,221,0.25)';
    ctx.beginPath();
    ctx.ellipse(-w * 0.06, -h * 0.56, w * 0.16, h * 0.12, -0.3, 0, TAU);
    ctx.fill();

    // eye stalks
    ctx.strokeStyle = '#ff7f6b';
    ctx.lineWidth = 3 * u;
    for (let side = -1; side <= 1; side += 2) {
      ctx.beginPath();
      ctx.moveTo(side * w * 0.12, -h * 0.66);
      ctx.lineTo(side * w * 0.15, -h * 0.9);
      ctx.stroke();
      ctx.fillStyle = '#fff6e4';
      ctx.strokeStyle = '#2b1b4d';
      ctx.lineWidth = 1.6 * u;
      ctx.beginPath();
      ctx.arc(side * w * 0.15, -h * 0.94, 3.6 * u, 0, TAU);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#2b1b4d';
      ctx.beginPath();
      ctx.arc(side * w * 0.15, -h * 0.94, 1.5 * u, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawBall(o, b) {
    const u = S.U;
    const r = (o.wU * u) / 2;
    const cx = o.x;
    const cy = b.y + b.h / 2;
    const colors = ['#ff6b6b', '#fff4dd', '#2ec4b6', '#ffd166', '#ff8f7a', '#fff4dd'];
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(o.phase * 0.9);
    for (let i = 0; i < 6; i++) {
      ctx.fillStyle = colors[i];
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, r, (i / 6) * TAU, ((i + 1) / 6) * TAU);
      ctx.closePath();
      ctx.fill();
    }
    ctx.strokeStyle = '#2b1b4d';
    ctx.lineWidth = 3 * u;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, TAU);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.17, 0, TAU);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.beginPath();
    ctx.ellipse(-r * 0.38, -r * 0.42, r * 0.22, r * 0.12, -0.7, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawGull(o, b) {
    const u = S.U;
    const cx = o.x;
    const cy = b.y + b.h / 2;
    const flap = Math.sin(o.phase);
    ctx.save();
    ctx.translate(cx, cy);

    ctx.strokeStyle = '#2b1b4d';
    ctx.lineWidth = 2 * u;
    ctx.fillStyle = '#f2dfc8';
    ctx.save();
    ctx.rotate(-0.35 + flap * 0.4);
    ctx.beginPath();
    ctx.ellipse(-18 * u, -3 * u, 30 * u, 8 * u, -0.45, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = '#fff6e4';
    ctx.beginPath();
    ctx.ellipse(0, 0, 27 * u, 13 * u, 0, 0, TAU);
    ctx.fill();
    ctx.stroke();

    ctx.save();
    ctx.rotate(0.32 - flap * 0.55);
    ctx.beginPath();
    ctx.ellipse(15 * u, -5 * u, 31 * u, 9 * u, 0.35, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    ctx.beginPath();
    ctx.arc(-24 * u, -6 * u, 8.5 * u, 0, TAU);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ffb03a';
    ctx.beginPath();
    ctx.moveTo(-31 * u, -7 * u);
    ctx.lineTo(-48 * u, -3 * u);
    ctx.lineTo(-31 * u, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#2b1b4d';
    ctx.beginPath();
    ctx.arc(-26 * u, -8 * u, 1.8 * u, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawObstacles() {
    for (const o of S.obstacles) {
      const b = obstacleBox(o);
      if (o.type !== 'gull') {
        const lift = o.type === 'ball'
          ? clamp((S.groundY - (b.y + b.h)) / (110 * S.U), 0, 1)
          : 0;
        ctx.fillStyle = 'rgba(14,7,26,' + (0.28 - lift * 0.15) + ')';
        ctx.beginPath();
        ctx.ellipse(
          o.x,
          S.groundY + 4 * S.U,
          b.w * 0.55 * (1 - lift * 0.35),
          6 * S.U * (1 - lift * 0.3),
          0, 0, TAU
        );
        ctx.fill();
      }
      if (o.type === 'rock') drawRock(o, b);
      else if (o.type === 'crab') drawCrab(o);
      else if (o.type === 'ball') drawBall(o, b);
      else drawGull(o, b);
    }
  }

  /* ------------------------------------------------------------------ */
  /* Fish                                                                */
  /* ------------------------------------------------------------------ */

  function sparkleStar(x, y, r) {
    ctx.beginPath();
    ctx.moveTo(x, y - r);
    ctx.lineTo(x + r * 0.28, y - r * 0.28);
    ctx.lineTo(x + r, y);
    ctx.lineTo(x + r * 0.28, y + r * 0.28);
    ctx.lineTo(x, y + r);
    ctx.lineTo(x - r * 0.28, y + r * 0.28);
    ctx.lineTo(x - r, y);
    ctx.lineTo(x - r * 0.28, y - r * 0.28);
    ctx.closePath();
    ctx.fill();
  }

  function drawFish(f, y, t) {
    const u = S.U;
    const s = f.golden ? 1.35 : 1;
    const color = f.golden ? '#ffd166' : (f.color === 'coral' ? '#ff8f7a' : '#2ec4b6');
    ctx.save();
    ctx.translate(f.x, y);
    ctx.rotate(Math.sin(f.phase * 0.7) * 0.1);
    ctx.scale(s * u, s * u);

    // tail
    ctx.fillStyle = color;
    ctx.strokeStyle = 'rgba(43,27,77,0.85)';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(13, 0);
    ctx.lineTo(25, -9);
    ctx.lineTo(23, 0);
    ctx.lineTo(25, 9);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // body
    ctx.beginPath();
    ctx.ellipse(0, 0, 17, 11, 0, 0, TAU);
    ctx.fill();
    ctx.stroke();

    // belly
    ctx.fillStyle = 'rgba(255,244,221,0.55)';
    ctx.beginPath();
    ctx.ellipse(-1, 3.5, 11, 4.6, 0, 0, TAU);
    ctx.fill();

    // fin
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-2, -9);
    ctx.quadraticCurveTo(2, -16, 7, -9);
    ctx.stroke();

    // eye
    ctx.fillStyle = '#21163c';
    ctx.beginPath();
    ctx.arc(-9, -3, 2.2, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(-9.8, -3.8, 0.8, 0, TAU);
    ctx.fill();
    ctx.restore();

    if (f.golden) {
      ctx.save();
      ctx.translate(f.x, y);
      ctx.rotate(t * 1.8);
      ctx.fillStyle = 'rgba(255,246,207,0.95)';
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * TAU;
        sparkleStar(Math.cos(a) * 34 * u, Math.sin(a) * 34 * u, 5 * u);
      }
      ctx.restore();
    }
  }

  function drawFishes(t) {
    for (const f of S.fishes) {
      const y = fishY(f);
      if (f.golden) {
        const glow = ctx.createRadialGradient(f.x, y, 0, f.x, y, 64 * S.U);
        glow.addColorStop(0, 'rgba(255,209,102,0.45)');
        glow.addColorStop(1, 'rgba(255,209,102,0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(f.x, y, 64 * S.U, 0, TAU);
        ctx.fill();
      }
      drawFish(f, y, t);
    }
  }

  /* ------------------------------------------------------------------ */
  /* The pelican rig                                                     */
  /* ------------------------------------------------------------------ */

  function drawWheel(cx, cy, r, angle) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);

    ctx.strokeStyle = '#2b1b4d';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, TAU);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255,244,221,0.72)';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(0, 0, r - 6, 0, TAU);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255,244,221,0.5)';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * TAU;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * 4, Math.sin(a) * 4);
      ctx.lineTo(Math.cos(a) * (r - 8), Math.sin(a) * (r - 8));
      ctx.stroke();
    }

    ctx.strokeStyle = 'rgba(255,244,221,0.16)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * TAU;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * (r - 2), Math.sin(a) * (r - 2));
      ctx.lineTo(Math.cos(a) * (r + 2), Math.sin(a) * (r + 2));
      ctx.stroke();
    }

    ctx.fillStyle = '#ffd166';
    ctx.beginPath();
    ctx.arc(0, 0, 4.5, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawLeg(hx, hy, fx, fy, front) {
    const dx = fx - hx;
    const dy = fy - hy;
    const len = Math.hypot(dx, dy) || 1;
    let nx = -dy / len;
    let ny = dx / len;
    if (nx < 0) { nx = -nx; ny = -ny; }
    const mx = (hx + fx) / 2 + nx * 9;
    const my = (hy + fy) / 2 + ny * 9;

    ctx.strokeStyle = front ? '#ff9f43' : '#d97a2b';
    ctx.lineWidth = front ? 7.5 : 6.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(hx, hy);
    ctx.lineTo(mx, my);
    ctx.lineTo(fx, fy);
    ctx.stroke();

    ctx.fillStyle = front ? '#ff9f43' : '#d97a2b';
    ctx.beginPath();
    ctx.moveTo(fx - 5, fy - 3);
    ctx.lineTo(fx + 7, fy - 1);
    ctx.lineTo(fx + 5, fy + 4);
    ctx.lineTo(fx - 5, fy + 3);
    ctx.closePath();
    ctx.fill();
  }

  function drawScarf() {
    const w1 = Math.sin(P.scarf) * 5;
    const w2 = Math.cos(P.scarf * 0.8) * 4;
    ctx.strokeStyle = '#ff5d73';
    ctx.lineCap = 'round';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(34, -194);
    ctx.quadraticCurveTo(6, -203 + w1, -22, -196 + w1 * 1.4);
    ctx.quadraticCurveTo(-40, -192, -56, -202 + w1 * 1.7);
    ctx.stroke();

    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(32, -190);
    ctx.quadraticCurveTo(8, -186 + w2, -18, -184 + w2 * 1.2);
    ctx.quadraticCurveTo(-30, -182, -42, -189 + w2);
    ctx.stroke();

    ctx.fillStyle = '#ff5d73';
    ctx.beginPath();
    ctx.arc(32, -192, 8, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = 'rgba(43,27,77,0.35)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  function drawRig(x, y, tilt, spin, sq) {
    const u = S.U;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(1 + sq * 0.2, 1 - sq * 0.2);

    const bob = P.grounded ? Math.sin(P.crank * 2) * 1.5 : 0;
    ctx.translate(0, bob);
    ctx.translate(0, -112);
    ctx.rotate(tilt + spin);
    ctx.translate(0, 112);
    ctx.scale(u, u);

    // wheels
    drawWheel(-62, -38, 38, P.wheelAngle);
    drawWheel(62, -38, 38, P.wheelAngle);

    // frame
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#1b8f87';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(-62, -38);
    ctx.lineTo(-30, -104);
    ctx.lineTo(54, -108);
    ctx.lineTo(62, -38);
    ctx.moveTo(-62, -38);
    ctx.lineTo(-2, -54);
    ctx.lineTo(54, -108);
    ctx.moveTo(-30, -104);
    ctx.lineTo(-2, -54);
    ctx.stroke();

    ctx.strokeStyle = '#2ec4b6';
    ctx.lineWidth = 6.5;
    ctx.beginPath();
    ctx.moveTo(-62, -38);
    ctx.lineTo(-30, -104);
    ctx.lineTo(54, -108);
    ctx.lineTo(62, -38);
    ctx.moveTo(-62, -38);
    ctx.lineTo(-2, -54);
    ctx.lineTo(54, -108);
    ctx.moveTo(-30, -104);
    ctx.lineTo(-2, -54);
    ctx.stroke();

    // chain
    ctx.strokeStyle = 'rgba(255,244,221,0.38)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(-58, -42);
    ctx.lineTo(-3, -56);
    ctx.stroke();
    ctx.setLineDash([]);

    // crank ring
    ctx.fillStyle = '#1b8f87';
    ctx.beginPath();
    ctx.arc(-2, -54, 11.5, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,244,221,0.45)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // seat
    ctx.fillStyle = '#ff6b6b';
    ctx.strokeStyle = '#2b1b4d';
    ctx.lineWidth = 2.2;
    roundRectPath(-48, -114, 34, 10, 5);
    ctx.fill();
    ctx.stroke();

    // basket
    ctx.save();
    ctx.translate(62, -100);
    ctx.rotate(-0.05);
    ctx.fillStyle = '#e8b06f';
    ctx.strokeStyle = '#2b1b4d';
    ctx.lineWidth = 2.2;
    roundRectPath(-16, -14, 32, 28, 4);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = 'rgba(43,27,77,0.28)';
    ctx.lineWidth = 1;
    for (let i = 1; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(-16, -14 + i * 7);
      ctx.lineTo(16, -14 + i * 7);
      ctx.stroke();
    }
    for (let i = 1; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(-16 + i * 8, -14);
      ctx.lineTo(-16 + i * 8, 14);
      ctx.stroke();
    }
    // fish tails poking out
    ctx.fillStyle = '#2ec4b6';
    ctx.beginPath();
    ctx.moveTo(-8, -14);
    ctx.lineTo(-14, -24);
    ctx.lineTo(-2, -18);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ff8f7a';
    ctx.beginPath();
    ctx.moveTo(4, -14);
    ctx.lineTo(1, -26);
    ctx.lineTo(12, -17);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#2b1b4d';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(0, -14);
    ctx.lineTo(6, -24);
    ctx.stroke();
    ctx.restore();

    // far leg
    const a1 = P.crank;
    const a2 = P.crank + Math.PI;
    const pedal1 = { x: Math.cos(a1) * 17, y: -54 + Math.sin(a1) * 17 };
    const pedal2 = { x: Math.cos(a2) * 17, y: -54 + Math.sin(a2) * 17 };
    drawLeg(-6, -118, pedal2.x, pedal2.y, false);

    // tail feathers
    ctx.fillStyle = '#fff6e4';
    ctx.strokeStyle = '#2b1b4d';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(-48, -146);
    ctx.lineTo(-78, -158);
    ctx.lineTo(-64, -138);
    ctx.lineTo(-86, -136);
    ctx.lineTo(-62, -124);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // far wing
    ctx.save();
    ctx.translate(-26, -154);
    ctx.rotate(-0.52);
    ctx.fillStyle = '#f0dcc2';
    ctx.strokeStyle = '#2b1b4d';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.ellipse(0, 0, 30, 15, 0.12, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // body
    ctx.save();
    ctx.translate(-8, -142);
    ctx.rotate(-0.16);
    ctx.beginPath();
    ctx.ellipse(0, 0, 54, 41, 0, 0, TAU);
    ctx.fillStyle = '#fff6e4';
    ctx.fill();
    ctx.strokeStyle = '#2b1b4d';
    ctx.lineWidth = 2.6;
    ctx.stroke();
    ctx.fillStyle = 'rgba(244,209,174,0.5)';
    ctx.beginPath();
    ctx.ellipse(9, 12, 37, 21, 0.05, 0, TAU);
    ctx.fill();
    ctx.restore();

    // near leg
    drawLeg(2, -120, pedal1.x, pedal1.y, true);

    // neck
    ctx.strokeStyle = '#2b1b4d';
    ctx.lineWidth = 30;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(24, -164);
    ctx.quadraticCurveTo(40, -186, 46, -196);
    ctx.stroke();
    ctx.strokeStyle = '#fff6e4';
    ctx.lineWidth = 25;
    ctx.beginPath();
    ctx.moveTo(24, -164);
    ctx.quadraticCurveTo(40, -186, 46, -196);
    ctx.stroke();

    // head
    ctx.fillStyle = '#fff6e4';
    ctx.strokeStyle = '#2b1b4d';
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.arc(50, -206, 22, 0, TAU);
    ctx.fill();
    ctx.stroke();

    // beak
    ctx.fillStyle = '#ff9f43';
    ctx.strokeStyle = '#2b1b4d';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(64, -214);
    ctx.lineTo(132, -206);
    ctx.quadraticCurveTo(106, -188, 70, -190);
    ctx.quadraticCurveTo(58, -196, 64, -214);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = 'rgba(43,27,77,0.45)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(66, -207);
    ctx.quadraticCurveTo(100, -202, 130, -206);
    ctx.stroke();

    // goggles + eye
    ctx.fillStyle = 'rgba(46,196,182,0.26)';
    ctx.strokeStyle = '#ffd166';
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.arc(57, -212, 9.5, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#21163c';
    ctx.beginPath();
    ctx.arc(57.5, -212, 3.4, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(58.6, -213.3, 1.2, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = '#2b1b4d';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(46, -215);
    ctx.lineTo(34, -214);
    ctx.stroke();

    // scarf
    drawScarf();

    // near wing
    ctx.save();
    ctx.translate(8, -158);
    const flap = P.flapT > 0 ? Math.sin((1 - P.flapT / 0.35) * Math.PI) : 0;
    ctx.rotate(-0.12 - flap * 1.15);
    ctx.fillStyle = '#eed7b6';
    ctx.strokeStyle = '#2b1b4d';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(14, 2, 28, 10, 37, 23);
    ctx.bezierCurveTo(35, 30, 23, 31, 12, 26);
    ctx.bezierCurveTo(3, 21, -2, 12, 0, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = 'rgba(43,27,77,0.2)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(14, 10);
    ctx.quadraticCurveTo(24, 18, 34, 26);
    ctx.moveTo(7, 14);
    ctx.quadraticCurveTo(16, 22, 23, 28);
    ctx.stroke();
    ctx.restore();

    // handlebar grip (over the wing)
    ctx.strokeStyle = '#2b1b4d';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(54, -108);
    ctx.lineTo(50, -124);
    ctx.quadraticCurveTo(58, -130, 68, -124);
    ctx.stroke();
    ctx.strokeStyle = '#ff6b6b';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(64, -125);
    ctx.lineTo(70, -124);
    ctx.stroke();

    // little bell
    ctx.fillStyle = '#ffd166';
    ctx.beginPath();
    ctx.arc(57, -129, 3.5, 0, TAU);
    ctx.fill();

    ctx.restore();
  }

  function drawPlayer(t) {
    const u = S.U;
    const height = Math.max(0, S.groundY - P.y);
    const shrink = clamp(1 - height / (460 * u), 0.2, 1);

    if (S.frenzy > 0) {
      const glow = ctx.createRadialGradient(P.x, P.y - 100 * u, 10, P.x, P.y - 100 * u, 150 * u);
      glow.addColorStop(0, 'rgba(255,209,102,0.2)');
      glow.addColorStop(0.55, 'rgba(255,150,110,0.08)');
      glow.addColorStop(1, 'rgba(255,209,102,0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(P.x, P.y - 100 * u, 150 * u, 0, TAU);
      ctx.fill();
    }

    ctx.save();
    ctx.globalAlpha = 0.3 * shrink;
    ctx.fillStyle = '#120822';
    ctx.beginPath();
    ctx.ellipse(P.x, S.groundY + 5 * u, 84 * u * shrink, 10 * u * shrink, 0, 0, TAU);
    ctx.fill();
    ctx.restore();

    let alpha = 1;
    if (P.invuln > 0 && S.mode === 'play') {
      alpha = Math.sin(t * 42) > 0 ? 0.4 : 1;
    }
    const spin = P.spinT > 0 ? (1 - P.spinT / 0.6) * TAU : 0;
    const crashSpin = S.mode === 'crash' ? S.crashT * 7 : 0;

    ctx.globalAlpha = alpha;
    drawRig(P.x, P.y, P.tilt + crashSpin, spin, P.sq);
    ctx.globalAlpha = 1;
  }

  /* ------------------------------------------------------------------ */
  /* Particles & popups                                                  */
  /* ------------------------------------------------------------------ */

  function drawParticles() {
    for (const p of S.particles) {
      const k = clamp(p.life / p.max, 0, 1);
      ctx.globalAlpha = k;
      if (p.type === 'spark') {
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = p.color;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.beginPath();
        ctx.moveTo(0, -p.size * 2.1);
        ctx.lineTo(p.size * 0.65, 0);
        ctx.lineTo(0, p.size * 2.1);
        ctx.lineTo(-p.size * 0.65, 0);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
        ctx.globalCompositeOperation = 'source-over';
      } else if (p.type === 'feather') {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, p.size, p.size * 0.38, 0, 0, TAU);
        ctx.fill();
        ctx.strokeStyle = 'rgba(43,27,77,0.2)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-p.size, 0);
        ctx.lineTo(p.size, 0);
        ctx.stroke();
        ctx.restore();
      } else if (p.type === 'shard') {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.7);
        ctx.restore();
      } else {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (0.55 + k * 0.45), 0, TAU);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }

  function drawPopups() {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const p of S.popups) {
      const t = 1 - p.life / p.max;
      const alpha = clamp((p.life / p.max) * 1.7, 0, 1);
      const scale = p.scale * (1 + 0.24 * Math.sin(Math.min(1, t * 3.2) * Math.PI));
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.font = '900 ' + Math.round(19 * S.U * scale) + 'px ' + FONT;
      ctx.lineWidth = 5 * S.U;
      ctx.strokeStyle = 'rgba(30,15,45,0.68)';
      ctx.strokeText(p.text, p.x, p.y);
      ctx.fillStyle = p.color;
      ctx.fillText(p.text, p.x, p.y);
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }

  function drawFX(t) {
    if (S.flash > 0) {
      ctx.fillStyle = 'rgba(255,60,90,' + (S.flash * 0.32) + ')';
      ctx.fillRect(-90, -90, S.W + 180, S.H + 180);
    }
    if (S.frenzy > 0) {
      const pulse = 0.05 + 0.028 * Math.sin(t * 8);
      ctx.fillStyle = 'rgba(255,209,102,' + pulse + ')';
      ctx.fillRect(-90, -90, S.W + 180, S.H + 180);
    }

    if ((S.mode === 'play' || S.mode === 'crash') && S.speedPx > 500 * S.U) {
      const level = clamp(S.speedPx / (820 * S.U) - 0.4, 0, 0.35);
      ctx.save();
      ctx.globalAlpha = level;
      ctx.strokeStyle = '#ffe6c4';
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 7; i++) {
        const travel = (t * S.speedPx * 0.9 + i * 193) % (S.W + 300);
        const x = S.W + 150 - travel;
        const y = ((i * 0.137 + 0.06) % 1) * S.H;
        const len = (40 + ((i * 37) % 80)) * S.U;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + len, y);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  /* ------------------------------------------------------------------ */
  /* Frame loop                                                          */
  /* ------------------------------------------------------------------ */

  function draw(t) {
    ctx.save();
    if (S.shake > 0.001) {
      const amp = (reduceMotion ? 3.5 : 15) * S.shake * S.shake;
      ctx.translate(rand(-amp, amp), rand(-amp, amp));
    }
    drawSky(t);
    drawClouds(t);
    drawSea(t);
    drawPalms();
    drawBoardwalk();
    drawForeground();
    drawObstacles();
    drawFishes(t);
    drawPlayer(t);
    drawParticles();
    drawPopups();
    drawFX(t);
    ctx.restore();
  }

  let last = performance.now();

  function frame(now) {
    requestAnimationFrame(frame);
    const raw = Math.min(0.05, Math.max(0.001, (now - last) / 1000));
    last = now;

    S.shake = Math.max(0, S.shake - raw * 2.3);
    S.flash = Math.max(0, S.flash - raw * 3);
    S.timeScale += (1 - S.timeScale) * Math.min(1, raw * 8);

    if (S.mode === 'start') {
      updateMenu(raw);
    } else if (S.mode === 'play' || S.mode === 'crash') {
      S.acc += raw * (S.mode === 'crash' ? 0.58 : S.timeScale);
      let steps = 0;
      while (S.acc >= FIXED && steps < 8) {
        updateGame(FIXED);
        S.acc -= FIXED;
        steps++;
      }
      if (steps === 8) S.acc = 0;

      if (S.mode === 'play' && S.hintT > 0) {
        S.hintT -= raw;
        if (S.hintT <= 0) dom.hint.classList.add('hidden');
      }
    }

    draw(now / 1000);
    updateHUD();
  }

  /* ------------------------------------------------------------------ */
  /* Events & boot                                                       */
  /* ------------------------------------------------------------------ */

  window.addEventListener('keydown', (e) => {
    const k = e.key;
    if (k === ' ' || k === 'ArrowUp' || k === 'ArrowDown' || k === 'ArrowLeft' || k === 'ArrowRight') {
      e.preventDefault();
    }
    if (e.repeat) return;

    if (k === 'm' || k === 'M') { toggleMute(); return; }
    if (k === 'p' || k === 'P' || k === 'Escape') {
      if (S.mode === 'play') pauseGame();
      else if (S.mode === 'pause') resumeGame();
      return;
    }
    if (k === 'r' || k === 'R') {
      if (S.mode === 'over' || S.mode === 'pause') startGame();
      return;
    }
    if (k === ' ' || k === 'ArrowUp' || k === 'w' || k === 'W') {
      onJump();
      return;
    }
    if (k === 'ArrowDown' || k === 's' || k === 'S') {
      onDive();
    }
  });

  let activePointer = null;
  let pointerStartX = 0;
  let pointerStartY = 0;
  let didSwipe = false;

  canvas.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    activePointer = e.pointerId;
    pointerStartX = e.clientX;
    pointerStartY = e.clientY;
    didSwipe = false;
    if (canvas.setPointerCapture) {
      try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    }
    onJump();
  });

  canvas.addEventListener('pointermove', (e) => {
    if (e.pointerId !== activePointer) return;
    const dx = e.clientX - pointerStartX;
    const dy = e.clientY - pointerStartY;
    if (!didSwipe && dy > 34 && Math.abs(dy) > Math.abs(dx) * 1.2) {
      didSwipe = true;
      onDive();
    }
  });

  function endPointer(e) {
    if (e.pointerId === activePointer) activePointer = null;
  }
  window.addEventListener('pointerup', endPointer);
  window.addEventListener('pointercancel', endPointer);
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && S.mode === 'play') pauseGame();
  });
  window.addEventListener('blur', () => {
    if (S.mode === 'play') pauseGame();
  });

  dom.playBtn.addEventListener('click', startGame);
  dom.againBtn.addEventListener('click', startGame);
  dom.resumeBtn.addEventListener('click', resumeGame);
  dom.restartBtn.addEventListener('click', startGame);
  dom.menuBtn.addEventListener('click', toMenu);
  dom.overMenuBtn.addEventListener('click', toMenu);
  dom.pauseBtn.addEventListener('click', pauseGame);
  dom.muteBtn.addEventListener('click', toggleMute);

  window.addEventListener('resize', resize);
  window.addEventListener('orientationchange', () => setTimeout(resize, 220));

  loadScores();
  resize();
  renderScores(dom.startScores, null);
  dom.bestMini.textContent = fmt(S.best);
  dom.muteBtn.classList.toggle('muted', audio.muted);
  dom.muteBtn.setAttribute('aria-label', audio.muted ? 'Unmute sound' : 'Mute sound');
  P.x = Math.round(S.W * (S.W > 900 ? 0.72 : 0.5));
  P.y = S.groundY;

  requestAnimationFrame((now) => {
    last = now;
    frame(now);
  });
})();
