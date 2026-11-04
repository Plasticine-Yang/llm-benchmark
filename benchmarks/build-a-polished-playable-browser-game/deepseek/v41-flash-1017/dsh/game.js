(() => {
  "use strict";

  // ---------------------------------------------------------------- helpers
  const TAU = Math.PI * 2;
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const lerp = (a, b, t) => a + (b - a) * t;
  const damp = (a, b, speed, dt) => lerp(a, b, 1 - Math.exp(-speed * dt));
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = (arr) => arr[(Math.random() * arr.length) | 0];
  const mod = (n, m) => ((n % m) + m) % m;

  function roundRectPath(c, x, y, w, h, r) {
    const rr = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
    c.beginPath();
    c.moveTo(x + rr, y);
    c.arcTo(x + w, y, x + w, y + h, rr);
    c.arcTo(x + w, y + h, x, y + h, rr);
    c.arcTo(x, y + h, x, y, rr);
    c.arcTo(x, y, x + w, y, rr);
    c.closePath();
  }
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isTouch =
    window.matchMedia("(pointer: coarse)").matches ||
    navigator.maxTouchPoints > 0 ||
    "ontouchstart" in window;

  if (isTouch) document.body.classList.add("is-touch");

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const canvas = $("#game");
  const ctx = canvas.getContext("2d", { alpha: false });

  const ui = {
    menu: $("#menuScreen"),
    pause: $("#pauseScreen"),
    over: $("#overScreen"),
    startBtn: $("#startBtn"),
    howBtn: $("#howBtn"),
    howPanel: $("#howPanel"),
    tagInput: $("#tagInput"),
    menuScores: $("#menuScores"),
    menuBest: $("#menuBest"),
    hud: $("#hud"),
    score: $("#score"),
    distance: $("#distance"),
    fishHud: $("#fishHud"),
    hearts: $("#hearts"),
    heartEls: $$(".heart"),
    feverWrap: $("#feverWrap"),
    feverFill: $("#feverFill"),
    feverName: $("#feverName"),
    comboChip: $("#comboChip"),
    pauseBtn: $("#pauseBtn"),
    soundBtn: $("#soundBtn"),
    soundBtnPause: $("#soundBtnPause"),
    pauseScore: $("#pauseScore"),
    pauseDistance: $("#pauseDistance"),
    pauseFish: $("#pauseFish"),
    resumeBtn: $("#resumeBtn"),
    restartPauseBtn: $("#restartPauseBtn"),
    quitBtn: $("#quitBtn"),
    overTitle: $("#overTitle"),
    overKicker: $("#overKicker"),
    finalScore: $("#finalScore"),
    finalDistance: $("#finalDistance"),
    finalFish: $("#finalFish"),
    finalCombo: $("#finalCombo"),
    newBest: $("#newBest"),
    overScores: $("#overScores"),
    yourRank: $("#yourRank"),
    againBtn: $("#againBtn"),
    menuBtn: $("#menuBtn"),
    resultHint: $("#resultHint"),
    toast: $("#toast"),
    live: $("#live"),
    touchUi: $("#touchUi"),
    hopBtn: $("#hopBtn"),
    duckBtn: $("#duckBtn"),
  };

  // ---------------------------------------------------------------- storage
  const SCORE_KEY = "pelicanPedal.scores.v1";
  const TAG_KEY = "pelicanPedal.tag.v1";
  const MUTE_KEY = "pelicanPedal.muted.v1";

  function storageGet(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw == null ? fallback : raw;
    } catch (e) {
      return fallback;
    }
  }

  function storageSet(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      /* private mode / quota: keep going */
    }
  }

  function sanitizeTag(value) {
    return (value || "")
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 3);
  }

  function loadScores() {
    try {
      const parsed = JSON.parse(storageGet(SCORE_KEY, "[]"));
      if (!Array.isArray(parsed)) return [];
      return parsed
        .filter((entry) => entry && Number.isFinite(Number(entry.score)))
        .map((entry) => ({
          id: String(entry.id || Math.random().toString(36).slice(2)),
          name: sanitizeTag(entry.name) || "PEL",
          score: Math.max(0, Math.floor(Number(entry.score))),
          distance: Math.max(0, Math.floor(Number(entry.distance) || 0)),
          fish: Math.max(0, Math.floor(Number(entry.fish) || 0)),
          combo: Math.max(1, Math.floor(Number(entry.combo) || 1)),
          date: entry.date || "",
        }))
        .sort((a, b) => b.score - a.score || b.distance - a.distance)
        .slice(0, 12);
    } catch (e) {
      return [];
    }
  }

  let scores = loadScores();
  let tag = sanitizeTag(storageGet(TAG_KEY, "PEL")) || "PEL";
  ui.tagInput.value = tag;

  function bestScore() {
    return scores.length ? scores[0].score : 0;
  }

  function formatScore(value, pad = true) {
    const n = Math.max(0, Math.floor(value));
    return pad ? String(n).padStart(5, "0") : String(n);
  }

  // ---------------------------------------------------------------- audio
  const Sound = {
    ctx: null,
    master: null,
    sfxBus: null,
    musicBus: null,
    noiseBuffer: null,
    muted: storageGet(MUTE_KEY, "0") === "1",
    music: { timer: null, next: 0, step: 0, playing: false },

    init() {
      if (this.ctx) return;
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      try {
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.muted ? 0 : 0.9;
        this.master.connect(this.ctx.destination);

        this.sfxBus = this.ctx.createGain();
        this.sfxBus.gain.value = 0.55;
        this.sfxBus.connect(this.master);

        this.musicBus = this.ctx.createGain();
        this.musicBus.gain.value = 0.16;
        this.musicBus.connect(this.master);

        const length = Math.floor(this.ctx.sampleRate * 0.7);
        const buffer = this.ctx.createBuffer(1, length, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
        this.noiseBuffer = buffer;
      } catch (e) {
        this.ctx = null;
      }
    },

    unlock() {
      this.init();
      if (this.ctx && this.ctx.state === "suspended") {
        this.ctx.resume().catch(() => {});
      }
    },

    setMuted(value) {
      this.muted = !!value;
      storageSet(MUTE_KEY, this.muted ? "1" : "0");
      if (this.ctx) {
        const now = this.ctx.currentTime;
        this.master.gain.cancelScheduledValues(now);
        this.master.gain.setTargetAtTime(this.muted ? 0 : 0.9, now, 0.025);
      }
      document.body.classList.toggle("is-muted", this.muted);
      updateSoundUI();
      if (this.muted) this.stopMusic();
      else if (game.mode === "playing") this.startMusic();
    },

    toggleMute() {
      this.setMuted(!this.muted);
      this.ui();
    },

    tone(freq, duration, type, volume, when, slideTo, destination) {
      if (!this.ctx || this.muted) return;
      const t = when == null ? this.ctx.currentTime : when;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type || "triangle";
      osc.frequency.setValueAtTime(Math.max(20, freq), t);
      if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t + duration);
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, volume), t + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
      osc.connect(gain).connect(destination || this.sfxBus);
      osc.start(t);
      osc.stop(t + duration + 0.03);
    },

    noise(duration, volume, cutoff, when) {
      if (!this.ctx || this.muted || !this.noiseBuffer) return;
      const t = when == null ? this.ctx.currentTime : when;
      const src = this.ctx.createBufferSource();
      src.buffer = this.noiseBuffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(cutoff || 1200, t);
      filter.frequency.exponentialRampToValueAtTime(180, t + duration);
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(volume, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
      src.connect(filter).connect(gain).connect(this.sfxBus);
      src.start(t);
      src.stop(t + duration + 0.02);
    },

    ui() {
      this.unlock();
      this.tone(420, 0.06, "square", 0.035, null, 520);
    },

    start() {
      this.unlock();
      const t = this.ctx ? this.ctx.currentTime : 0;
      [392, 523.25, 659.25, 783.99].forEach((f, i) =>
        this.tone(f, 0.18, "triangle", 0.09, t + i * 0.075, f * 1.01)
      );
      this.noise(0.18, 0.05, 1800, t);
    },

    jump() {
      this.unlock();
      this.tone(210, 0.14, "triangle", 0.08, null, 430);
      this.tone(520, 0.08, "sine", 0.035, null, 720);
    },

    doubleJump() {
      this.unlock();
      this.tone(300, 0.18, "triangle", 0.09, null, 780);
      this.tone(880, 0.1, "sine", 0.045, null, 1160);
      this.noise(0.14, 0.035, 2400);
    },

    land(impact) {
      this.tone(95, 0.09, "sine", 0.045 + impact * 0.03, null, 55);
      this.noise(0.08, 0.02 + impact * 0.025, 700);
    },

    fish(combo) {
      this.unlock();
      const base = 540 + Math.min(7, combo) * 38;
      this.tone(base, 0.09, "sine", 0.075, null, base * 1.35);
      this.tone(base * 1.5, 0.07, "triangle", 0.04, this.ctx ? this.ctx.currentTime + 0.045 : 0, base * 1.8);
    },

    goldFish() {
      this.unlock();
      const t = this.ctx ? this.ctx.currentTime : 0;
      [784, 988, 1175, 1568].forEach((f, i) => this.tone(f, 0.16, "sine", 0.055, t + i * 0.055));
    },

    hit() {
      this.unlock();
      this.tone(120, 0.25, "sawtooth", 0.1, null, 48);
      this.tone(70, 0.3, "sine", 0.11, null, 38);
      this.noise(0.22, 0.13, 1100);
    },

    smash() {
      this.tone(150, 0.12, "square", 0.07, null, 90);
      this.noise(0.15, 0.09, 2200);
    },

    tuck() {
      this.noise(0.18, 0.04, 850);
    },

    fever() {
      this.unlock();
      const t = this.ctx ? this.ctx.currentTime : 0;
      [523, 659, 784, 1047, 1319, 1568].forEach((f, i) =>
        this.tone(f, 0.22, "triangle", 0.07, t + i * 0.065, f * 1.005)
      );
      this.noise(0.3, 0.05, 3200);
    },

    gameOver() {
      const t = this.ctx ? this.ctx.currentTime : 0;
      [392, 329.63, 261.63, 196].forEach((f, i) =>
        this.tone(f, 0.34, "triangle", 0.075, t + i * 0.13, f * 0.99)
      );
    },

    startMusic() {
      this.unlock();
      if (!this.ctx || this.muted || this.music.playing) return;
      this.music.playing = true;
      this.music.next = this.ctx.currentTime + 0.08;
      this.music.step = 0;
      this.music.timer = setInterval(() => this.scheduleMusic(), 90);
      this.scheduleMusic();
    },

    stopMusic() {
      this.music.playing = false;
      if (this.music.timer) {
        clearInterval(this.music.timer);
        this.music.timer = null;
      }
    },

    scheduleMusic() {
      if (!this.ctx || !this.music.playing) return;
      if (this.music.next < this.ctx.currentTime - 0.12) {
        this.music.next = this.ctx.currentTime + 0.06;
      }
      while (this.music.next < this.ctx.currentTime + 0.36) {
        this.musicNote(this.music.step, this.music.next);
        this.music.step = (this.music.step + 1) % 16;
        this.music.next += 0.235;
      }
    },

    musicNote(step, when) {
      const pattern = [523.25, 0, 659.25, 783.99, 0, 659.25, 587.33, 0, 523.25, 0, 783.99, 880, 0, 783.99, 659.25, 587.33];
      const bass = [130.81, 0, 0, 0, 174.61, 0, 0, 0, 146.83, 0, 0, 0, 196, 0, 0, 0];
      const note = pattern[step];
      if (note) {
        this.tone(note, 0.22, "triangle", 0.03, when, note * 1.002, this.musicBus);
        if (step % 4 === 0) this.tone(note * 2, 0.14, "sine", 0.012, when, note * 2.01, this.musicBus);
      }
      const b = bass[step];
      if (b) this.tone(b, 0.4, "sine", 0.05, when, b, this.musicBus);
      if (game.feverActive && step % 2 === 0) {
        this.tone(note ? note * 2 : 1046, 0.09, "square", 0.012, when + 0.06, null, this.musicBus);
      }
    },
  };

  document.body.classList.toggle("is-muted", Sound.muted);

  function updateSoundUI() {
    const label = Sound.muted ? "Unmute sound" : "Mute sound";
    ui.soundBtn.setAttribute("aria-label", label);
    ui.soundBtn.title = `${Sound.muted ? "Unmute" : "Mute"} sound (M)`;
    ui.soundBtnPause.innerHTML = `SOUND: <b>${Sound.muted ? "OFF" : "ON"}</b>`;
  }

  // ---------------------------------------------------------------- state
  const FEVER_TIME = 5.5;
  const COMBO_TIME = 4.4;
  const MAX_COMBO = 8;

  const game = {
    mode: "menu",
    time: 0,
    runTime: 0,
    score: 0,
    displayScore: 0,
    distance: 0,
    fish: 0,
    hearts: 3,
    combo: 1,
    comboTimer: 0,
    maxCombo: 1,
    fever: 0,
    feverActive: false,
    feverTimer: 0,
    feverCooldown: 0,
    feverSparkTimer: 0,
    speed: 330,
    speedTarget: 330,
    scroll: 0,
    shake: 0,
    flash: 0,
    flashColor: "#fff4dc",
    hitstop: 0,
    spawnCooldown: 7.4,
    tutorialStep: 0,
    scoreSaved: false,
    newBest: false,
    rank: 0,
    runId: "",
    tag,
    deathTimer: 0,
    overShownAt: 0,
    pausedAt: 0,
  };

  const player = {
    x: 0,
    y: 0,
    vy: 0,
    onGround: true,
    jumps: 0,
    jumpBuffer: 0,
    coyote: 0,
    duckHeld: false,
    duckAmount: 0,
    invuln: 0,
    hurtTimer: 0,
    pedal: 0,
    wheel: 0,
    squash: 0,
    wingLift: 0,
    deathSpin: 0,
    lastLand: 0,
  };

  const obstacles = [];
  const fish = [];
  const particles = [];
  const texts = [];
  const clouds = [];
  const birds = [];
  const deckMarks = [];

  let W = 0;
  let H = 0;
  let DPR = 1;
  let groundY = 0;
  let horizonY = 0;
  let playerScale = 1;
  let runX = 0;
  let skyCache = null;
  let seaCache = null;
  let deckGrad = null;
  let lastTime = performance.now();
  let resizeQueued = false;

  function makeScenery() {
    clouds.length = 0;
    birds.length = 0;
    deckMarks.length = 0;
    for (let i = 0; i < 7; i++) {
      clouds.push({
        x: Math.random(),
        y: 0.07 + Math.random() * 0.3,
        s: 0.55 + Math.random() * 0.9,
        speed: 0.35 + Math.random() * 0.5,
        alpha: 0.8 + Math.random() * 0.14,
      });
    }
    for (let i = 0; i < 4; i++) {
      birds.push({
        x: Math.random(),
        y: 0.13 + Math.random() * 0.22,
        s: 0.55 + Math.random() * 0.5,
        phase: Math.random() * TAU,
      });
    }
    for (let i = 0; i < 24; i++) {
      deckMarks.push({
        x: Math.random(),
        y: 0.1 + Math.random() * 0.82,
        type: i % 4,
        s: 0.5 + Math.random() * 0.8,
        phase: Math.random() * TAU,
      });
    }
  }

  function buildGradients() {
    deckGrad = ctx.createLinearGradient(0, groundY, 0, H);
    deckGrad.addColorStop(0, "#ce8b60");
    deckGrad.addColorStop(0.32, "#b36f4d");
    deckGrad.addColorStop(1, "#6e3c30");
    buildBackgroundCaches();
  }

  function buildBackgroundCaches() {
    try {
      skyCache = document.createElement("canvas");
      skyCache.width = Math.max(1, Math.round(W * DPR));
      skyCache.height = Math.max(1, Math.round((horizonY + 2) * DPR));
      const skyCtx = skyCache.getContext("2d");
      skyCtx.setTransform(DPR, 0, 0, DPR, 0, 0);
      paintSkyBase(skyCtx);

      seaCache = document.createElement("canvas");
      seaCache.width = Math.max(1, Math.round(W * DPR));
      seaCache.height = Math.max(1, Math.round(groundY * DPR));
      const seaCtx = seaCache.getContext("2d");
      seaCtx.setTransform(DPR, 0, 0, DPR, 0, 0);
      paintSeaBase(seaCtx);
    } catch (e) {
      skyCache = null;
      seaCache = null;
    }
  }

  function resize() {
    resizeQueued = false;
    W = Math.max(320, window.innerWidth);
    H = Math.max(320, window.innerHeight);
    const rawDpr = Math.min(window.devicePixelRatio || 1, 2);
    const maxPixels = 3_600_000;
    DPR = Math.max(1, Math.min(rawDpr, Math.sqrt(maxPixels / (W * H))));
    canvas.width = Math.round(W * DPR);
    canvas.height = Math.round(H * DPR);
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

    const portrait = H / W > 1.3;
    groundY = Math.round(H * (portrait ? 0.695 : 0.755));
    horizonY = Math.round(groundY - clamp(H * 0.205, 82, 188));
    playerScale = clamp(H / 820, 0.62, 1.18);
    if (W < 560) playerScale = Math.min(playerScale, 0.92);
    if (H < 480) playerScale = Math.min(playerScale, 0.72);
    runX = W < 620 ? W * 0.27 : W * 0.295;
    if (game.mode !== "menu") player.x = runX;
    else player.x = W >= 920 ? W * 0.53 : runX;

    buildGradients();
  }

  function queueResize() {
    if (resizeQueued) return;
    resizeQueued = true;
    requestAnimationFrame(resize);
  }

  // ---------------------------------------------------------------- UI / state transitions
  function setMode(mode) {
    game.mode = mode;
    document.body.classList.remove("mode-menu", "mode-playing", "mode-paused", "mode-dying", "mode-gameover");
    document.body.classList.add(`mode-${mode}`);
    ui.menu.classList.toggle("is-active", mode === "menu");
    ui.pause.classList.toggle("is-active", mode === "paused");
    ui.over.classList.toggle("is-active", mode === "gameover");
    ui.menu.setAttribute("aria-hidden", mode === "menu" ? "false" : "true");
    ui.pause.setAttribute("aria-hidden", mode === "paused" ? "false" : "true");
    ui.over.setAttribute("aria-hidden", mode === "gameover" ? "false" : "true");
  }

  function announce(message) {
    ui.live.textContent = "";
    window.setTimeout(() => {
      ui.live.textContent = message;
    }, 40);
  }

  let toastTimer = 0;
  function showToast(message, duration = 2100) {
    if (!message) return;
    ui.toast.textContent = message;
    ui.toast.classList.add("is-show");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => ui.toast.classList.remove("is-show"), duration);
  }

  function syncHearts(animateLoss) {
    ui.heartEls.forEach((el, i) => {
      el.classList.toggle("is-empty", i >= game.hearts);
      if (animateLoss && i === game.hearts) el.classList.add("is-lost");
      if (!animateLoss) el.classList.remove("is-lost");
    });
    ui.hearts.setAttribute("aria-label", `Lives remaining: ${game.hearts}`);
  }

  let lastHudScore = -1;
  let lastHudDistance = -1;
  let lastHudFish = -1;
  let lastCombo = 1;

  function syncHUD(force = false) {
    const shownScore = Math.floor(game.displayScore);
    if (force || shownScore !== lastHudScore) {
      ui.score.textContent = formatScore(shownScore);
      lastHudScore = shownScore;
    }
    const shownDistance = Math.floor(game.distance);
    if (force || shownDistance !== lastHudDistance) {
      ui.distance.textContent = `${shownDistance} M`;
      lastHudDistance = shownDistance;
    }
    if (force || game.fish !== lastHudFish) {
      ui.fishHud.textContent = `${game.fish} FISH`;
      lastHudFish = game.fish;
    }
    const pct = game.feverActive ? (game.feverTimer / FEVER_TIME) * 100 : game.fever;
    ui.feverFill.style.width = `${clamp(pct, 0, 100)}%`;
    ui.feverWrap.classList.toggle("is-fever", game.feverActive);
    ui.feverWrap.classList.toggle("is-cooling", !game.feverActive && game.feverCooldown > 0);
    ui.feverName.textContent = game.feverActive ? "FRENZY!" : game.feverCooldown > 0 ? "COOLDOWN" : "FRENZY";
    ui.comboChip.textContent = `COMBO ×${game.combo}`;
    ui.comboChip.classList.toggle("is-on", game.combo > 1 || game.feverActive);
    if (game.combo !== lastCombo) {
      if (game.combo > lastCombo) {
        ui.comboChip.classList.remove("pop");
        void ui.comboChip.offsetWidth;
        ui.comboChip.classList.add("pop");
      }
      lastCombo = game.combo;
    }
  }

  function makeRow(rank, entry, withDistance, highlight) {
    const tr = document.createElement("tr");
    if (!entry) {
      tr.className = "is-empty";
      const r = document.createElement("td");
      r.className = "rank";
      r.textContent = "—";
      tr.appendChild(r);
      const n = document.createElement("td");
      n.className = "rider";
      n.textContent = "---";
      tr.appendChild(n);
      const s = document.createElement("td");
      s.className = "pts";
      s.textContent = "-----";
      tr.appendChild(s);
      if (withDistance) {
        const d = document.createElement("td");
        d.className = "dist";
        d.textContent = "—";
        tr.appendChild(d);
      }
      return tr;
    }
    if (highlight && entry.id === game.runId) tr.className = "is-you";
    const r = document.createElement("td");
    r.className = "rank";
    r.textContent = String(rank).padStart(2, "0");
    tr.appendChild(r);
    const n = document.createElement("td");
    n.className = "rider";
    n.textContent = entry.name;
    tr.appendChild(n);
    const s = document.createElement("td");
    s.className = "pts";
    s.textContent = formatScore(entry.score);
    tr.appendChild(s);
    if (withDistance) {
      const d = document.createElement("td");
      d.className = "dist";
      d.textContent = `${entry.distance}m`;
      tr.appendChild(d);
    }
    return tr;
  }

  function renderScoreTables() {
    ui.menuScores.innerHTML = "";
    for (let i = 0; i < 5; i++) {
      ui.menuScores.appendChild(makeRow(i + 1, scores[i] || null, true, false));
    }
    ui.overScores.innerHTML = "";
    for (let i = 0; i < 5; i++) {
      ui.overScores.appendChild(makeRow(i + 1, scores[i] || null, false, true));
    }
    ui.menuBest.textContent = formatScore(bestScore());
  }

  function updatePauseStats() {
    ui.pauseScore.textContent = formatScore(game.score, false);
    ui.pauseDistance.textContent = `${Math.floor(game.distance)} m`;
    ui.pauseFish.textContent = String(game.fish);
  }

  function populateGameOver() {
    const final = Math.floor(game.score);
    ui.finalScore.textContent = formatScore(final, false);
    ui.finalDistance.textContent = `${Math.floor(game.distance)} m`;
    ui.finalFish.textContent = String(game.fish);
    ui.finalCombo.textContent = `×${game.maxCombo}`;
    ui.newBest.hidden = !game.newBest;
    ui.overTitle.textContent = game.newBest ? "NEW BEST!" : "BEACHED!";
    ui.overKicker.textContent = game.newBest ? "THE PIER REMEMBERS" : "RUN COMPLETE";
    ui.yourRank.textContent = game.rank ? `YOU • #${game.rank}` : "—";
    renderScoreTables();
  }

  function saveRun() {
    if (game.scoreSaved) return;
    game.scoreSaved = true;
    const previousBest = bestScore();
    const final = Math.floor(game.score);
    game.newBest = final > previousBest;
    const entry = {
      id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
      name: game.tag || "PEL",
      score: final,
      distance: Math.floor(game.distance),
      fish: game.fish,
      combo: game.maxCombo,
      date: new Date().toISOString(),
    };
    game.runId = entry.id;
    scores.push(entry);
    scores.sort((a, b) => b.score - a.score || b.distance - a.distance);
    scores = scores.slice(0, 12);
    storageSet(SCORE_KEY, JSON.stringify(scores));
    game.rank = scores.findIndex((s) => s.id === entry.id) + 1;
    renderScoreTables();
  }

  function syncTag() {
    const clean = sanitizeTag(ui.tagInput.value) || "PEL";
    ui.tagInput.value = clean;
    game.tag = clean;
    tag = clean;
    storageSet(TAG_KEY, clean);
  }

  // ---------------------------------------------------------------- run lifecycle
  function resetRun() {
    game.time = 0;
    game.runTime = 0;
    game.score = 0;
    game.displayScore = 0;
    game.distance = 0;
    game.fish = 0;
    game.hearts = 3;
    game.combo = 1;
    game.comboTimer = 0;
    game.maxCombo = 1;
    game.fever = 0;
    game.feverActive = false;
    game.feverTimer = 0;
    game.feverCooldown = 0;
    game.feverSparkTimer = 0;
    game.speed = 330;
    game.speedTarget = 330;
    game.scroll = 0;
    game.shake = 0;
    game.flash = 0;
    game.hitstop = 0;
    game.spawnCooldown = 7.4;
    game.tutorialStep = 0;
    game.scoreSaved = false;
    game.newBest = false;
    game.rank = 0;
    game.runId = "";
    game.deathTimer = 0;
    game.overShownAt = 0;

    player.y = 0;
    player.vy = 0;
    player.onGround = true;
    player.jumps = 0;
    player.jumpBuffer = 0;
    player.coyote = 0;
    player.duckHeld = false;
    player.duckAmount = 0;
    player.invuln = 0;
    player.hurtTimer = 0;
    player.pedal = 0;
    player.wheel = 0;
    player.squash = 0;
    player.wingLift = 0;
    player.deathSpin = 0;
    player.x = runX;

    obstacles.length = 0;
    fish.length = 0;
    particles.length = 0;
    texts.length = 0;

    lastHudScore = -1;
    lastHudDistance = -1;
    lastHudFish = -1;
    lastCombo = 1;
    syncHearts(false);
    syncHUD(true);
  }

  function startGame() {
    syncTag();
    Sound.unlock();
    resetRun();
    setMode("playing");
    Sound.start();
    Sound.startMusic();
    showToast(isTouch ? "TAP TO HOP • HOLD TUCK TO DUCK" : "SPACE / ↑ TO HOP", 2400);
    announce("Ride started. Collect fish, hop obstacles, and tuck under gulls.");
    window.setTimeout(() => {
      if (game.mode === "playing") {
        spawnFishLine(player.x + 235 * playerScale, 82 * playerScale, 4, 52 * playerScale);
      }
    }, 80);
  }

  function pauseGame() {
    if (game.mode !== "playing") return;
    game.pausedAt = performance.now();
    player.duckHeld = false;
    setDuckVisual(false);
    updatePauseStats();
    setMode("paused");
    Sound.stopMusic();
    Sound.ui();
    announce("Game paused.");
    window.setTimeout(() => ui.resumeBtn.focus({ preventScroll: true }), 80);
  }

  function resumeGame() {
    if (game.mode !== "paused") return;
    setMode("playing");
    Sound.startMusic();
    Sound.ui();
    announce("Game resumed.");
    lastTime = performance.now();
  }

  function startDeath() {
    game.mode = "dying";
    game.deathTimer = 0;
    game.shake = reducedMotion ? 6 : 23;
    game.flash = 0.48;
    game.flashColor = "#fff4dc";
    game.hitstop = 0.1;
    player.vy = -620 * playerScale;
    player.onGround = false;
    player.jumps = 2;
    player.deathSpin = 0;
    player.duckHeld = false;
    setDuckVisual(false);
    spawnFeathers(player.x, groundY - player.y - 85 * playerScale, 26);
    spawnBurst(player.x, groundY - player.y - 70 * playerScale, 18, ["#ffc24b", "#ef5b4c", "#fff4dc"]);
    Sound.stopMusic();
    Sound.gameOver();
    setMode("dying");
    announce("Wipeout! Final score incoming.");
  }

  function finishGameOver() {
    saveRun();
    populateGameOver();
    setMode("gameover");
    game.overShownAt = performance.now();
    announce(`Run over. Score ${Math.floor(game.score)}. ${game.newBest ? "New personal best!" : ""}`);
  }

  function restartGame() {
    if (game.mode === "menu") return;
    Sound.ui();
    startGame();
  }

  function quitToMenu() {
    Sound.stopMusic();
    Sound.ui();
    obstacles.length = 0;
    fish.length = 0;
    particles.length = 0;
    texts.length = 0;
    player.y = 0;
    player.vy = 0;
    player.onGround = true;
    player.duckAmount = 0;
    player.duckHeld = false;
    game.speed = 140;
    game.shake = 0;
    game.flash = 0;
    renderScoreTables();
    setMode("menu");
    announce("Back at the pier.");
  }

  // ---------------------------------------------------------------- input
  function setDuckVisual(on) {
    ui.duckBtn.classList.toggle("is-down", !!on);
  }

  function pressJump() {
    if (game.mode !== "playing") return;
    Sound.unlock();
    player.jumpBuffer = 0.13;
    tryJump();
  }

  function tryJump() {
    if (player.onGround || player.coyote > 0) {
      player.vy = -890 * playerScale;
      player.onGround = false;
      player.coyote = 0;
      player.jumps = 1;
      player.jumpBuffer = 0;
      player.squash = -0.25;
      spawnDust(player.x - 22 * playerScale, groundY, 5, 0.6);
      Sound.jump();
    } else if (player.jumps < 2) {
      player.vy = -790 * playerScale;
      player.jumps = 2;
      player.jumpBuffer = 0;
      player.wingLift = 1;
      spawnFeathers(player.x + 2 * playerScale, groundY - player.y - 95 * playerScale, 9);
      Sound.doubleJump();
    }
  }

  function releaseJump() {
    if (player.vy < -310 * playerScale) player.vy *= 0.56;
  }

  function setDuck(on) {
    if (game.mode !== "playing") {
      player.duckHeld = false;
      setDuckVisual(false);
      return;
    }
    player.duckHeld = !!on;
    setDuckVisual(on);
    if (on) Sound.tuck();
  }

  function isTypingTarget(target) {
    return target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);
  }

  document.addEventListener("keydown", (e) => {
    if (isTypingTarget(e.target)) {
      if (e.code === "Enter") e.target.blur();
      return;
    }
    const jumpKey = e.code === "Space" || e.code === "ArrowUp" || e.code === "KeyW";
    const duckKey = e.code === "ArrowDown" || e.code === "KeyS";
    if (jumpKey) e.preventDefault();
    if (duckKey) e.preventDefault();

    if (jumpKey) {
      if (e.repeat) return;
      if (game.mode === "menu") {
        startGame();
      } else if (game.mode === "gameover") {
        if (performance.now() - game.overShownAt > 220) restartGame();
      } else if (game.mode === "paused") {
        resumeGame();
      } else if (game.mode === "playing") {
        pressJump();
      }
      return;
    }

    if (duckKey) {
      if (!e.repeat && game.mode === "playing") setDuck(true);
      return;
    }

    if (e.code === "KeyP" || e.code === "Escape") {
      e.preventDefault();
      if (game.mode === "playing") pauseGame();
      else if (game.mode === "paused") resumeGame();
      else if (game.mode === "gameover" && e.code === "Escape") quitToMenu();
      return;
    }

    if (e.code === "KeyR") {
      if (game.mode !== "menu") restartGame();
      return;
    }

    if (e.code === "KeyM") {
      Sound.toggleMute();
      return;
    }

    if (e.code === "Enter" && game.mode === "menu") startGame();
  });

  document.addEventListener("keyup", (e) => {
    if (isTypingTarget(e.target)) return;
    const jumpKey = e.code === "Space" || e.code === "ArrowUp" || e.code === "KeyW";
    const duckKey = e.code === "ArrowDown" || e.code === "KeyS";
    if (jumpKey) releaseJump();
    if (duckKey) setDuck(false);
  });

  canvas.addEventListener("pointerdown", (e) => {
    if (game.mode !== "playing") return;
    e.preventDefault();
    Sound.unlock();
    pressJump();
  });

  window.addEventListener("pointerup", () => releaseJump());
  window.addEventListener("pointercancel", () => releaseJump());

  ui.hopBtn.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    e.stopPropagation();
    ui.hopBtn.classList.add("is-down");
    pressJump();
    try {
      ui.hopBtn.setPointerCapture(e.pointerId);
    } catch (err) {}
  });
  const endHop = (e) => {
    if (e) e.preventDefault();
    ui.hopBtn.classList.remove("is-down");
    releaseJump();
  };
  ui.hopBtn.addEventListener("pointerup", endHop);
  ui.hopBtn.addEventListener("pointercancel", endHop);
  ui.hopBtn.addEventListener("lostpointercapture", endHop);

  ui.duckBtn.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDuck(true);
    try {
      ui.duckBtn.setPointerCapture(e.pointerId);
    } catch (err) {}
  });
  const endDuck = (e) => {
    if (e) e.preventDefault();
    setDuck(false);
  };
  ui.duckBtn.addEventListener("pointerup", endDuck);
  ui.duckBtn.addEventListener("pointercancel", endDuck);
  ui.duckBtn.addEventListener("lostpointercapture", endDuck);

  document.addEventListener("visibilitychange", () => {
    if (document.hidden && game.mode === "playing") pauseGame();
  });

  window.addEventListener("resize", queueResize);
  window.addEventListener("orientationchange", () => {
    queueResize();
    window.setTimeout(resize, 220);
  });

  // ---------------------------------------------------------------- buttons
  ui.startBtn.addEventListener("click", () => {
    Sound.ui();
    startGame();
  });
  ui.howBtn.addEventListener("click", () => {
    Sound.ui();
    const open = ui.howPanel.hasAttribute("hidden");
    if (open) ui.howPanel.removeAttribute("hidden");
    else ui.howPanel.setAttribute("hidden", "");
    ui.howBtn.setAttribute("aria-expanded", String(open));
    ui.howBtn.textContent = open ? "GOT IT" : "HOW TO PLAY";
  });
  ui.tagInput.addEventListener("input", () => {
    const clean = sanitizeTag(ui.tagInput.value);
    if (ui.tagInput.value !== clean) ui.tagInput.value = clean;
    if (clean) {
      tag = clean;
      game.tag = clean;
      storageSet(TAG_KEY, clean);
    }
  });
  ui.tagInput.addEventListener("blur", syncTag);
  ui.tagInput.addEventListener("keydown", (e) => {
    if (e.code === "Enter") {
      e.preventDefault();
      ui.tagInput.blur();
      ui.startBtn.focus({ preventScroll: true });
    }
  });

  ui.pauseBtn.addEventListener("click", pauseGame);
  ui.soundBtn.addEventListener("click", () => Sound.toggleMute());
  ui.soundBtnPause.addEventListener("click", () => Sound.toggleMute());
  ui.resumeBtn.addEventListener("click", resumeGame);
  ui.restartPauseBtn.addEventListener("click", restartGame);
  ui.quitBtn.addEventListener("click", quitToMenu);
  ui.againBtn.addEventListener("click", restartGame);
  ui.menuBtn.addEventListener("click", quitToMenu);

  // ---------------------------------------------------------------- particles / feedback
  function addParticle(p) {
    if (particles.length > 320) particles.shift();
    particles.push(p);
  }

  function spawnDust(x, y, count, power = 1) {
    const n = reducedMotion ? Math.ceil(count * 0.4) : count;
    for (let i = 0; i < n; i++) {
      addParticle({
        x: x + rand(-18, 18) * playerScale,
        y: y + rand(-3, 4),
        vx: rand(-70, -18) * power,
        vy: rand(-90, -20) * power,
        gravity: 180,
        drag: 1.8,
        life: rand(0.32, 0.65),
        max: 0.65,
        size: rand(3, 8) * playerScale,
        color: pick(["#f3d2a4", "#d9a477", "#b97b55"]),
        shape: "circle",
        rot: rand(0, TAU),
        vr: rand(-3, 3),
      });
    }
  }

  function spawnFeathers(x, y, count) {
    const n = reducedMotion ? Math.ceil(count * 0.35) : count;
    for (let i = 0; i < n; i++) {
      addParticle({
        x: x + rand(-20, 20) * playerScale,
        y: y + rand(-18, 18) * playerScale,
        vx: rand(-170, 90) * playerScale,
        vy: rand(-220, -20) * playerScale,
        gravity: 380,
        drag: 1.1,
        life: rand(0.55, 1.25),
        max: 1.25,
        size: rand(4, 9) * playerScale,
        color: pick(["#fff4dc", "#f6e4c1", "#ffd8b0"]),
        shape: "feather",
        rot: rand(0, TAU),
        vr: rand(-7, 7),
      });
    }
  }

  function spawnBurst(x, y, count, colors, power = 1) {
    const n = reducedMotion ? Math.ceil(count * 0.35) : count;
    for (let i = 0; i < n; i++) {
      const a = rand(0, TAU);
      const sp = rand(70, 300) * power;
      addParticle({
        x,
        y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - 60,
        gravity: 420,
        drag: 1.3,
        life: rand(0.35, 0.9),
        max: 0.9,
        size: rand(2.5, 7) * playerScale,
        color: pick(colors),
        shape: Math.random() < 0.55 ? "spark" : "circle",
        rot: a,
        vr: rand(-9, 9),
      });
    }
  }

  function spawnSplash(x, y, count) {
    const n = reducedMotion ? Math.ceil(count * 0.4) : count;
    for (let i = 0; i < n; i++) {
      addParticle({
        x: x + rand(-30, 30) * playerScale,
        y: y + rand(-3, 3),
        vx: rand(-100, 80) * playerScale,
        vy: rand(-330, -120) * playerScale,
        gravity: 920,
        drag: 0.3,
        life: rand(0.35, 0.7),
        max: 0.7,
        size: rand(2, 5) * playerScale,
        color: pick(["#bde9e4", "#7ed0ce", "#fff4dc"]),
        shape: "circle",
        rot: 0,
        vr: 0,
      });
    }
  }

  function spawnRing(x, y, color, size = 24) {
    addParticle({
      x,
      y,
      vx: 0,
      vy: 0,
      gravity: 0,
      drag: 0,
      life: 0.36,
      max: 0.36,
      size,
      color,
      shape: "ring",
      rot: 0,
      vr: 0,
    });
  }

  function spawnConfetti(x, y, count) {
    const colors = ["#ffc24b", "#ef5b4c", "#fff4dc", "#7ed0ce", "#ff9a8a"];
    const n = reducedMotion ? Math.ceil(count * 0.35) : count;
    for (let i = 0; i < n; i++) {
      const a = rand(-Math.PI, 0);
      const sp = rand(140, 500);
      addParticle({
        x,
        y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        gravity: 620,
        drag: 0.7,
        life: rand(0.7, 1.5),
        max: 1.5,
        size: rand(3, 7) * playerScale,
        color: pick(colors),
        shape: "confetti",
        rot: rand(0, TAU),
        vr: rand(-12, 12),
      });
    }
  }

  function addFloat(text, x, y, color = "#fff4dc", size = 22) {
    texts.push({
      text,
      x,
      y,
      vy: -48,
      life: 0.9,
      max: 0.9,
      color,
      size: size * clamp(playerScale, 0.78, 1.15),
      rot: rand(-0.07, 0.07),
    });
  }

  function addScore(amount) {
    game.score += amount;
  }

  // ---------------------------------------------------------------- spawns
  function baseObstacle(type, x) {
    const s = playerScale;
    let w = 54;
    let h = 38;
    let alt = 0;
    if (type === "puddle") {
      w = 100;
      h = 14;
    } else if (type === "log") {
      w = 84;
      h = 34;
    } else if (type === "gull") {
      w = 60;
      h = 34;
      alt = 86;
    }
    return {
      type,
      x,
      w: w * s,
      h: h * s,
      alt: alt * s,
      phase: Math.random() * TAU,
      hit: false,
      passed: false,
      dead: false,
    };
  }

  function spawnObstacle(type, x) {
    const o = baseObstacle(type, x);
    obstacles.push(o);
    return o;
  }

  function spawnFishAt(x, alt, gold = false) {
    fish.push({
      x,
      alt: alt * playerScale,
      phase: Math.random() * TAU,
      gold,
      dead: false,
    });
  }

  function spawnFishLine(x, alt, count, gap, goldChance = 0.08) {
    const goldIndex = Math.random() < goldChance ? (Math.random() * count) | 0 : -1;
    for (let i = 0; i < count; i++) {
      spawnFishAt(x + i * gap, alt + Math.sin((i / Math.max(1, count - 1)) * Math.PI) * 12, i === goldIndex);
    }
  }

  function spawnFishArc(x, alt, count, gap) {
    const goldIndex = Math.random() < 0.1 ? (Math.random() * count) | 0 : -1;
    for (let i = 0; i < count; i++) {
      const t = count <= 1 ? 0 : i / (count - 1);
      spawnFishAt(x + (i - (count - 1) / 2) * gap, alt + Math.sin(t * Math.PI) * 34, i === goldIndex);
    }
  }

  function spawnPattern() {
    const difficulty = clamp((game.runTime - 6) / 62, 0, 1);
    let roll = Math.random();
    let type = roll < 0.3 ? "crab" : roll < 0.56 ? "puddle" : roll < 0.79 ? "log" : "gull";
    const x = W + 100;
    spawnObstacle(type, x);

    if (type === "gull") {
      spawnFishLine(W + 42, 47, 3, 58, 0.04);
      addFloat("TUCK!", W + 25, groundY - 148 * playerScale, "#ffc24b", 16);
    } else {
      const alt = type === "puddle" ? 108 : 128;
      spawnFishArc(x + 42 * playerScale, alt, 3, 62);
      if (Math.random() < 0.38) spawnFishLine(x + 190, 72, 3, 54, 0.04);
    }

    if (difficulty > 0.45 && Math.random() < 0.24) {
      const extra = pick(["crab", "log", "puddle"]);
      const extraX = x + rand(300, 430) * playerScale;
      spawnObstacle(extra, extraX);
      spawnFishArc(extraX + 40, 120, 2, 55);
    }
  }

  function updateTutorial() {
    if (game.tutorialStep === 0 && game.runTime > 0.05) {
      game.tutorialStep = 1;
    } else if (game.tutorialStep === 1 && game.runTime > 1.25) {
      game.tutorialStep = 2;
      spawnObstacle("puddle", W + 92);
      spawnFishArc(W + 92 + 42 * playerScale, 112, 3, 60);
      game.spawnCooldown = Math.max(game.spawnCooldown, 3.8);
    } else if (game.tutorialStep === 2 && game.runTime > 2.35) {
      game.tutorialStep = 3;
      spawnFishLine(player.x + 275 * playerScale, 104 * playerScale, 3, 54 * playerScale, 0);
    } else if (game.tutorialStep === 3 && game.runTime > 5.2) {
      game.tutorialStep = 4;
      spawnObstacle("gull", W + 92);
      spawnFishLine(W + 32, 47, 3, 55, 0);
      showToast(isTouch ? "HOLD TUCK TO DUCK UNDER GULLS" : "HOLD ↓ TO TUCK UNDER GULLS", 2300);
      game.spawnCooldown = Math.max(game.spawnCooldown, 2.6);
    } else if (game.tutorialStep === 4 && game.runTime > 5.45) {
      game.tutorialStep = 5;
    }
  }

  // ---------------------------------------------------------------- gameplay
  function getPlayerBox() {
    const s = playerScale;
    const topOffset = player.duckAmount > 0.55 ? 79 : 128;
    return {
      x: player.x - 27 * s,
      y: groundY - player.y - topOffset * s,
      w: 54 * s,
      h: (topOffset - 4) * s,
    };
  }

  function getObstacleBox(o) {
    if (o.type === "gull") {
      return {
        x: o.x + 7 * playerScale,
        y: groundY - o.alt - o.h + 3 * playerScale,
        w: o.w - 14 * playerScale,
        h: o.h - 6 * playerScale,
      };
    }
    return {
      x: o.x + 5 * playerScale,
      y: groundY - o.h + 2 * playerScale,
      w: o.w - 10 * playerScale,
      h: o.h - 2 * playerScale,
    };
  }

  function overlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function handleObstacleHit(o) {
    if (o.hit || o.dead) return;
    o.hit = true;
    if (game.feverActive) {
      o.dead = true;
      addScore(100);
      addFloat("SMASH +100", o.x + o.w / 2, groundY - o.alt - o.h - 26 * playerScale, "#ffc24b", 20);
      spawnBurst(o.x + o.w / 2, groundY - o.alt - o.h / 2, 18, ["#ffc24b", "#ef5b4c", "#fff4dc"], 1.2);
      spawnRing(o.x + o.w / 2, groundY - o.alt - o.h / 2, "#ffc24b", 38 * playerScale);
      game.shake = Math.max(game.shake, 8);
      Sound.smash();
      return;
    }
    if (player.invuln > 0) return;
    damagePlayer(o);
  }

  function damagePlayer(o) {
    game.hearts = Math.max(0, game.hearts - 1);
    game.combo = 1;
    game.comboTimer = 0;
    game.fever = Math.max(0, game.fever - 32);
    player.invuln = 1.35;
    player.hurtTimer = 0.42;
    player.squash = 0.7;
    game.shake = reducedMotion ? 4 : 18;
    game.flash = 0.4;
    game.flashColor = "#ef5b4c";
    game.hitstop = 0.075;
    spawnFeathers(player.x, groundY - player.y - 86 * playerScale, 16);
    spawnBurst(player.x, groundY - player.y - 65 * playerScale, 13, ["#ef5b4c", "#ffc24b", "#fff4dc"], 1.15);
    addFloat(pick(["OUCH!", "BONK!", "OOF!"]), player.x, groundY - player.y - 155 * playerScale, "#ffc24b", 28);
    if (o.type === "puddle") spawnSplash(player.x, groundY - 4, 18);
    syncHearts(true);
    Sound.hit();
    if (game.hearts <= 0) startDeath();
  }

  function rewardPass(o) {
    if (o.hit || o.dead) return;
    const bonus = o.type === "gull" ? 35 : 20;
    addScore(bonus);
    if (game.runTime < 18 || Math.random() < 0.3) {
      addFloat(
        o.type === "gull" ? `NICE TUCK +${bonus}` : `CLEAN +${bonus}`,
        o.x + o.w / 2,
        groundY - (o.type === "gull" ? o.alt + o.h + 20 : o.h + 35) * 1,
        "#fff4dc",
        15
      );
    }
  }

  function collectFish(f) {
    f.dead = true;
    const base = f.gold ? 300 : 100;
    const mult = game.combo;
    const pts = Math.round(base * mult * (game.feverActive ? 2 : 1));
    addScore(pts);
    game.fish += 1;
    game.combo = Math.min(MAX_COMBO, game.combo + 1);
    game.comboTimer = COMBO_TIME;
    game.maxCombo = Math.max(game.maxCombo, game.combo);
    if (game.feverActive) {
      game.feverTimer = Math.min(FEVER_TIME + 0.5, game.feverTimer + 0.08);
    } else if (game.feverCooldown <= 0) {
      game.fever = Math.min(100, game.fever + (f.gold ? 30 : 20));
      if (game.fever >= 100) activateFever();
    }
    const x = f.x;
    const y = groundY - f.alt;
    if (f.gold) {
      spawnBurst(x, y, 22, ["#ffc24b", "#fff3b0", "#fff4dc"], 1.1);
      spawnRing(x, y, "#ffc24b", 32 * playerScale);
      addFloat(`+${pts} GOLD!`, x, y - 25 * playerScale, "#ffc24b", 23);
      Sound.goldFish();
      game.shake = Math.max(game.shake, 5);
    } else {
      spawnBurst(x, y, 9, ["#ffc24b", "#fff4dc", "#ff9a8a"], 0.65);
      addFloat(`+${pts}`, x, y - 18 * playerScale, game.combo > 2 ? "#ffc24b" : "#fff4dc", 17);
      Sound.fish(mult);
    }
  }

  function activateFever() {
    game.feverActive = true;
    game.feverTimer = FEVER_TIME;
    game.fever = 100;
    game.shake = reducedMotion ? 4 : 10;
    game.flash = 0.28;
    game.flashColor = "#ffc24b";
    spawnConfetti(player.x, groundY - player.y - 90 * playerScale, 42);
    spawnRing(player.x, groundY - player.y - 80 * playerScale, "#ffc24b", 60 * playerScale);
    addFloat("FISH FRENZY!", player.x + 30 * playerScale, groundY - player.y - 190 * playerScale, "#ffc24b", 36);
    showToast("FISH FRENZY — SMASH THROUGH EVERYTHING!", 2400);
    Sound.fever();
    announce("Fish Frenzy! You are invincible and fish are magnetic.");
  }

  function endFever() {
    game.feverActive = false;
    game.feverTimer = 0;
    game.feverCooldown = 2.6;
    game.fever = 0;
    showToast("FRENZY OVER — STAY SHARP", 1500);
  }

  function update(dt) {
    if (game.hitstop > 0) {
      game.hitstop -= dt;
      game.shake = Math.max(0, game.shake - dt * 90);
      updateParticles(dt * 0.25);
      return;
    }

    game.time += dt;
    game.runTime += dt;
    game.flash = Math.max(0, game.flash - dt * 2.6);
    game.shake = Math.max(0, game.shake - dt * 46);
    game.displayScore = damp(game.displayScore, game.score, 12, dt);

    const baseSpeed = 330 + Math.min(350, game.runTime * 4.6);
    game.speedTarget = baseSpeed + (game.feverActive ? 155 : 0);
    game.speed = damp(game.speed, game.speedTarget, 1.9, dt);
    game.scroll += game.speed * dt;
    game.distance += (game.speed * dt) / 14;
    addScore(game.speed * dt * 0.14);

    updateTutorial();
    game.spawnCooldown -= dt;
    if (game.spawnCooldown <= 0) {
      spawnPattern();
      const diff = clamp((game.runTime - 6) / 62, 0, 1);
      game.spawnCooldown = lerp(2.35, 1.52, diff) + rand(-0.12, 0.14);
    }

    updatePlayer(dt);
    updateEntities(dt);
    updateParticles(dt);
    updateTexts(dt);

    if (game.comboTimer > 0) {
      game.comboTimer -= dt;
      if (game.comboTimer <= 0) game.combo = 1;
    }
    if (game.feverCooldown > 0) game.feverCooldown = Math.max(0, game.feverCooldown - dt);
    if (game.feverActive) {
      game.feverTimer -= dt;
      game.fever = clamp((game.feverTimer / FEVER_TIME) * 100, 0, 100);
      game.feverSparkTimer -= dt;
      if (game.feverSparkTimer <= 0) {
        game.feverSparkTimer = reducedMotion ? 0.16 : 0.055;
        const s = playerScale;
        addParticle({
          x: player.x + rand(-48, 30) * s,
          y: groundY - player.y - rand(8, 130) * s,
          vx: rand(-110, -24) * s,
          vy: rand(-70, 20) * s,
          gravity: -30,
          drag: 0.8,
          life: rand(0.25, 0.55),
          max: 0.55,
          size: rand(1.5, 3.6) * s,
          color: pick(["#ffc24b", "#fff0a8", "#ff9a8a"]),
          shape: Math.random() < 0.5 ? "spark" : "circle",
          rot: rand(0, TAU),
          vr: rand(-5, 5),
        });
      }
      if (game.feverTimer <= 0) endFever();
    }

    syncHUD();
  }

  function updatePlayer(dt) {
    const s = playerScale;
    player.invuln = Math.max(0, player.invuln - dt);
    player.hurtTimer = Math.max(0, player.hurtTimer - dt);
    player.wingLift = Math.max(0, player.wingLift - dt * 2.8);
    player.squash = damp(player.squash, 0, 10, dt);
    player.duckAmount = damp(player.duckAmount, player.duckHeld ? 1 : 0, 18, dt);
    player.pedal += dt * (player.onGround ? game.speed / (42 * s) : 2.2);
    player.wheel += dt * (game.speed / (23 * s));

    if (!player.onGround) {
      const gravity = 2680 * s * (player.duckHeld ? 1.72 : 1);
      player.vy += gravity * dt;
      player.y += player.vy * dt;
      if (player.y <= 0) {
        const impact = clamp(Math.abs(player.vy) / (1100 * s), 0, 1);
        player.y = 0;
        player.vy = 0;
        player.onGround = true;
        player.jumps = 0;
        player.squash = 0.8 + impact * 0.4;
        spawnDust(player.x - 18 * s, groundY, 5 + Math.round(impact * 5), 0.75);
        if (impact > 0.5) game.shake = Math.max(game.shake, 2 + impact * 3);
        Sound.land(impact);
        if (player.duckHeld) setDuckVisual(true);
      }
    } else {
      player.y = 0;
      player.vy = 0;
      player.coyote = 0.1;
      player.jumps = 0;
    }

    if (!player.onGround) player.coyote = Math.max(0, player.coyote - dt);
    if (player.jumpBuffer > 0) {
      player.jumpBuffer = Math.max(0, player.jumpBuffer - dt);
      if (player.onGround) tryJump();
    }
  }

  function updateEntities(dt) {
    const s = playerScale;
    const pbox = getPlayerBox();
    const targetAlt = player.y + (player.duckAmount > 0.55 ? 56 : 88) * s;

    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x -= game.speed * dt;
      o.phase += dt;
      if (!o.hit && !o.dead) {
        const box = getObstacleBox(o);
        if (overlap(pbox, box)) handleObstacleHit(o);
      }
      if (!o.passed && o.x + o.w < player.x - 25 * s) {
        o.passed = true;
        rewardPass(o);
      }
      if (o.dead || o.x + o.w < -220) obstacles.splice(i, 1);
    }

    for (let i = fish.length - 1; i >= 0; i--) {
      const f = fish[i];
      f.x -= game.speed * dt;
      f.phase += dt;
      if (game.feverActive) {
        const tx = player.x;
        const ty = groundY - targetAlt;
        const fx = f.x;
        const fy = groundY - f.alt;
        const dx = tx - fx;
        const dy = ty - fy;
        const dist = Math.hypot(dx, dy);
        if (dist < 265 * s && dist > 4) {
          const pull = 1 - Math.exp(-7 * dt);
          f.x = lerp(f.x, tx, pull);
          f.alt = lerp(f.alt, targetAlt, pull);
        }
      }
      const fx = f.x;
      const fy = groundY - f.alt + Math.sin(game.time * 3 + f.phase) * 5 * s;
      const dx = fx - player.x;
      const dy = fy - (groundY - targetAlt);
      if (!f.dead && Math.hypot(dx, dy) < 37 * s) collectFish(f);
      if (f.dead || f.x < -120) fish.splice(i, 1);
    }
  }

  function updateParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        particles.splice(i, 1);
        continue;
      }
      if (p.shape === "ring") {
        p.size += dt * 220;
        continue;
      }
      p.vy += (p.gravity || 0) * dt;
      if (p.drag) {
        const d = Math.exp(-p.drag * dt);
        p.vx *= d;
        p.vy *= d;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rot += (p.vr || 0) * dt;
    }
  }

  function updateTexts(dt) {
    for (let i = texts.length - 1; i >= 0; i--) {
      const t = texts[i];
      t.life -= dt;
      t.y += t.vy * dt;
      t.vy *= Math.exp(-2.2 * dt);
      if (t.life <= 0) texts.splice(i, 1);
    }
  }

  function updateMenu(dt) {
    game.time += dt;
    game.scroll += 145 * dt;
    game.speed = 145;
    player.x = W >= 920 ? W * 0.53 : runX;
    player.pedal += dt * 4.5;
    player.wheel += dt * 5.8;
    player.duckAmount = damp(player.duckAmount, 0, 10, dt);
    player.invuln = 0;
    player.y = 0;
    player.vy = 0;
    player.onGround = true;
    updateParticles(dt);
    updateTexts(dt);
  }

  function updateDying(dt) {
    game.deathTimer += dt;
    game.time += dt;
    game.scroll += game.speed * 0.13 * dt;
    game.flash = Math.max(0, game.flash - dt * 2.2);
    game.shake = Math.max(0, game.shake - dt * 32);
    player.vy += 1850 * playerScale * dt;
    player.y += player.vy * dt;
    player.deathSpin += dt * 4.2;
    updateParticles(dt);
    updateTexts(dt);
    if (game.deathTimer > 1.02) finishGameOver();
  }

  // ---------------------------------------------------------------- render helpers
  function drawCloud(x, y, s, alpha) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    ctx.globalAlpha = alpha;
    ctx.globalCompositeOperation = "screen";
    ctx.fillStyle = "#ffc7a6";
    ctx.beginPath();
    ctx.arc(-34, 0, 18, Math.PI, 0);
    ctx.arc(-8, -8, 25, Math.PI, 0);
    ctx.arc(22, -2, 19, Math.PI, 0);
    ctx.arc(42, 3, 13, Math.PI, 0);
    ctx.quadraticCurveTo(20, 12, -20, 11);
    ctx.quadraticCurveTo(-42, 10, -34, 0);
    ctx.fill();
    ctx.restore();
  }

  function paintSkyBase(c) {
    const grad = c.createLinearGradient(0, 0, 0, horizonY);
    grad.addColorStop(0, "#123a50");
    grad.addColorStop(0.35, "#4b5267");
    grad.addColorStop(0.62, "#b75d60");
    grad.addColorStop(0.82, "#ee7c5d");
    grad.addColorStop(1, "#ffc46b");
    c.fillStyle = grad;
    c.fillRect(0, 0, W, horizonY + 2);

    const sunX = W * 0.72;
    const sunY = horizonY - H * 0.1;
    const sunR = Math.min(W, H) * 0.085;
    const glow = c.createRadialGradient(sunX, sunY, sunR * 0.25, sunX, sunY, sunR * 4.1);
    glow.addColorStop(0, "rgba(255, 226, 154, 0.42)");
    glow.addColorStop(0.35, "rgba(255, 183, 104, 0.16)");
    glow.addColorStop(1, "rgba(255, 183, 104, 0)");
    c.fillStyle = glow;
    c.fillRect(sunX - sunR * 4.2, sunY - sunR * 4.2, sunR * 8.4, sunR * 8.4);

    c.save();
    c.beginPath();
    c.arc(sunX, sunY, sunR, 0, TAU);
    c.clip();
    c.fillStyle = "#ffdf9e";
    c.fillRect(sunX - sunR, sunY - sunR, sunR * 2, sunR * 2);
    c.fillStyle = "rgba(239, 117, 91, 0.34)";
    for (let i = 0; i < 5; i++) {
      const yy = sunY + sunR * 0.06 + i * sunR * 0.17;
      c.fillRect(sunX - sunR, yy, sunR * 2, 2.2 + i * 0.8);
    }
    c.restore();
  }

  function drawSky() {
    if (skyCache) ctx.drawImage(skyCache, 0, 0, W, horizonY + 2);
    else paintSkyBase(ctx);

    for (const c of clouds) {
      const x = mod(c.x * W - game.scroll * c.speed * 0.035 + game.time * 1.5, W + 320) - 160;
      const y = horizonY * c.y;
      drawCloud(x, y, c.s * clamp(W / 1300, 0.6, 1.2), c.alpha);
    }

    for (const b of birds) {
      const x = mod(b.x * W - game.scroll * 0.008 + game.time * 9, W + 100) - 50;
      const y = horizonY * b.y + Math.sin(game.time * 1.3 + b.phase) * 4;
      const flap = Math.sin(game.time * 4.2 + b.phase) * 3;
      ctx.strokeStyle = "rgba(13, 45, 54, 0.46)";
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(x - 8 * b.s, y);
      ctx.quadraticCurveTo(x - 4 * b.s, y - 4 * b.s + flap, x, y);
      ctx.quadraticCurveTo(x + 4 * b.s, y - 4 * b.s + flap, x + 8 * b.s, y);
      ctx.stroke();
    }
  }

  function paintSeaBase(c) {
    const grad = c.createLinearGradient(0, horizonY, 0, groundY);
    grad.addColorStop(0, "#2a7e83");
    grad.addColorStop(0.38, "#16616d");
    grad.addColorStop(1, "#0a3f4d");
    c.fillStyle = grad;
    c.fillRect(0, horizonY, W, groundY - horizonY + 2);
    drawHeadland(c);
    drawPier(c);
  }

  function drawSea() {
    if (seaCache) ctx.drawImage(seaCache, 0, 0, W, groundY);
    else paintSeaBase(ctx);

    const sunX = W * 0.72;
    for (let i = 0; i < 22; i++) {
      const p = i / 21;
      const y = horizonY + 8 + p * (groundY - horizonY - 12);
      const width = 18 + p * 92 + Math.sin(game.time * 1.2 + i * 1.9) * 9;
      const x = sunX + Math.sin(game.time * 0.8 + i * 1.4) * (4 + p * 18);
      ctx.strokeStyle = `rgba(255, 218, 144, ${0.2 * (1 - p * 0.7)})`;
      ctx.lineWidth = 1.4 + p * 1.4;
      ctx.beginPath();
      ctx.moveTo(x - width / 2, y);
      ctx.quadraticCurveTo(x, y - 1.5, x + width / 2, y);
      ctx.stroke();
    }

    const rows = 13;
    for (let i = 0; i < rows; i++) {
      const y = horizonY + 10 + (i / rows) * (groundY - horizonY - 8);
      const wave = Math.sin(game.time * 1.15 + i * 0.9) * 8;
      const offset = mod(game.scroll * (0.03 + i * 0.006) + i * 67, W + 220) - 110;
      ctx.strokeStyle = `rgba(197, 240, 231, ${0.05 + (i / rows) * 0.08})`;
      ctx.lineWidth = i > 8 ? 2 : 1;
      ctx.beginPath();
      const seg = 82 + (i % 3) * 24;
      for (let x = -seg; x < W + seg; x += seg) {
        const xx = x + offset + wave;
        ctx.moveTo(xx, y);
        ctx.quadraticCurveTo(xx + seg * 0.25, y - 2.5, xx + seg * 0.5, y);
      }
      ctx.stroke();
    }

    for (let i = 0; i < 7; i++) {
      const y = horizonY + 14 + i * 10;
      const width = 32 + i * 16;
      const x = sunX + Math.sin(game.time * 0.9 + i * 1.7) * (8 + i * 3);
      ctx.strokeStyle = `rgba(255, 220, 150, ${0.22 - i * 0.018})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x - width / 2, y);
      ctx.quadraticCurveTo(x, y - 2, x + width / 2, y);
      ctx.stroke();
    }
  }

  function drawHeadland(c) {
    c = c || ctx;
    c.save();
    c.fillStyle = "rgba(8, 44, 53, 0.62)";
    c.beginPath();
    c.moveTo(0, horizonY + 5);
    c.lineTo(0, horizonY - H * 0.035);
    c.quadraticCurveTo(W * 0.05, horizonY - H * 0.062, W * 0.105, horizonY - H * 0.022);
    c.quadraticCurveTo(W * 0.15, horizonY + 4, W * 0.21, horizonY + 5);
    c.closePath();
    c.fill();

    c.strokeStyle = "rgba(8, 44, 53, 0.62)";
    c.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
      const x = W * (0.035 + i * 0.045);
      const y = horizonY - H * (0.035 + (i % 2) * 0.015);
      c.beginPath();
      c.moveTo(x, y);
      c.quadraticCurveTo(x + 5, y - 18, x + 13, y - 23);
      c.moveTo(x + 6, y - 10);
      c.lineTo(x - 2, y - 17);
      c.moveTo(x + 9, y - 16);
      c.lineTo(x + 18, y - 20);
      c.stroke();
    }
    c.restore();
  }

  function drawPier(c) {
    c = c || ctx;
    const deckY = horizonY + 3;
    const x0 = W * 0.5;
    const x1 = W * 0.9;
    c.save();
    c.strokeStyle = "rgba(7, 37, 46, 0.66)";
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(x0, deckY);
    c.lineTo(x1, deckY);
    c.stroke();
    for (let x = x0 + 18; x < x1; x += 42) {
      c.beginPath();
      c.moveTo(x, deckY);
      c.lineTo(x, deckY + 24 + Math.sin(x * 0.07) * 4);
      c.stroke();
    }
    for (let x = x0 + 60; x < x1; x += 126) {
      const tw = 0.5 + Math.sin(game.time * 1.8 + x) * 0.5;
      c.fillStyle = `rgba(255, 194, 75, ${0.2 + tw * 0.4})`;
      c.beginPath();
      c.arc(x, deckY - 3, 1.6, 0, TAU);
      c.fill();
    }
    c.restore();
  }

  function drawBoardwalk() {
    ctx.fillStyle = deckGrad;
    ctx.fillRect(0, groundY, W, H - groundY);

    ctx.fillStyle = "#f4c58b";
    ctx.fillRect(0, groundY, W, 3);
    ctx.fillStyle = "rgba(13, 45, 54, 0.46)";
    ctx.fillRect(0, groundY + 3, W, 2);

    const deckH = H - groundY;
    const rows = 4;
    for (let row = 0; row < rows; row++) {
      const top = groundY + 8 + (row / rows) * (deckH - 8);
      const bottom = groundY + 8 + ((row + 1) / rows) * (deckH - 8);
      if (row % 2 === 0) {
        ctx.fillStyle = "rgba(255, 221, 167, 0.045)";
        ctx.fillRect(0, top, W, bottom - top);
      }
      ctx.strokeStyle = "rgba(58, 27, 23, 0.34)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, bottom);
      ctx.lineTo(W, bottom);
      ctx.stroke();

      const spacing = 86 + row * 9;
      const off = mod(game.scroll * (1 + row * 0.035) + row * 31, spacing);
      ctx.strokeStyle = "rgba(75, 37, 29, 0.28)";
      ctx.lineWidth = 1.5;
      for (let x = -off; x < W + spacing; x += spacing) {
        ctx.beginPath();
        ctx.moveTo(x, top + 2);
        ctx.lineTo(x, bottom - 1);
        ctx.stroke();
      }
      ctx.fillStyle = "rgba(255, 223, 176, 0.2)";
      for (let x = -off + spacing * 0.5; x < W + spacing; x += spacing) {
        ctx.beginPath();
        ctx.arc(x, top + 7, 1.4, 0, TAU);
        ctx.fill();
      }
    }

    for (const m of deckMarks) {
      const x = mod(m.x * W - game.scroll * 1.08, W + 100) - 50;
      const y = groundY + 20 + m.y * (deckH - 38);
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(Math.sin(m.phase + game.time * 0.4) * 0.3);
      ctx.scale(m.s, m.s);
      if (m.type === 0) {
        ctx.strokeStyle = "rgba(255, 222, 171, 0.3)";
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.arc(0, 0, 4, Math.PI, 0);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0, 2, 6, Math.PI, 0);
        ctx.stroke();
      } else if (m.type === 1) {
        ctx.fillStyle = "rgba(55, 29, 26, 0.2)";
        ctx.beginPath();
        ctx.arc(0, 0, 2, 0, TAU);
        ctx.fill();
      } else if (m.type === 2) {
        ctx.strokeStyle = "rgba(255, 222, 171, 0.22)";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(-5, 0);
        ctx.lineTo(0, -3);
        ctx.lineTo(5, 0);
        ctx.stroke();
      } else {
        ctx.fillStyle = "rgba(90, 41, 30, 0.18)";
        ctx.fillRect(-6, -1, 12, 2);
      }
      ctx.restore();
    }

    const stencilX = mod(260 - game.scroll * 0.98, W + 700) - 350;
    ctx.save();
    ctx.globalAlpha = 0.13;
    ctx.fillStyle = "#fbe0b1";
    ctx.font = `900 ${Math.max(36, 72 * playerScale)}px Impact, "Arial Narrow", sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText("PIER 12", stencilX, H - 18);
    ctx.restore();
  }

  function drawSpeedLines() {
    const intensity = clamp((game.speed - 370) / 520, 0, 1) + (game.feverActive ? 0.4 : 0);
    if (intensity <= 0.02) return;
    ctx.save();
    ctx.strokeStyle = game.feverActive ? `rgba(255, 214, 112, ${0.12 + intensity * 0.14})` : `rgba(255, 244, 220, ${0.04 + intensity * 0.1})`;
    ctx.lineWidth = 1.3;
    for (let i = 0; i < 14; i++) {
      const x = mod(W + 200 - game.scroll * (1.8 + (i % 4) * 0.3) - i * 173, W + 340) - 160;
      const y = horizonY + 30 + mod(i * 89, Math.max(60, groundY - horizonY - 50));
      const len = 30 + (i % 5) * 28;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + len, y);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawFishOne(f) {
    const s = playerScale * (f.gold ? 1.35 : 1);
    const bob = Math.sin(game.time * 3 + f.phase) * 5 * playerScale;
    const x = f.x;
    const y = groundY - f.alt + bob;
    const tilt = Math.sin(game.time * 2.2 + f.phase) * 0.12;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(tilt);
    ctx.scale(s, s);

    if (f.gold) {
      const glow = ctx.createRadialGradient(0, 0, 2, 0, 0, 28);
      glow.addColorStop(0, "rgba(255, 220, 120, 0.4)");
      glow.addColorStop(1, "rgba(255, 220, 120, 0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(0, 0, 28, 0, TAU);
      ctx.fill();
    }

    ctx.strokeStyle = "#0d2d36";
    ctx.lineWidth = 2.2;
    ctx.lineJoin = "round";
    ctx.fillStyle = f.gold ? "#ffd15e" : "#ffc24b";
    ctx.beginPath();
    ctx.ellipse(0, 0, 13, 7.5, 0, 0, TAU);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = f.gold ? "#ffb52e" : "#ef9a2e";
    ctx.beginPath();
    ctx.moveTo(-12, 0);
    ctx.lineTo(-22, -7);
    ctx.lineTo(-19, 0);
    ctx.lineTo(-22, 7);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = f.gold ? "#fff0a8" : "#ffd885";
    ctx.beginPath();
    ctx.moveTo(-3, -7);
    ctx.quadraticCurveTo(1, -14, 7, -7);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#0d2d36";
    ctx.beginPath();
    ctx.arc(6, -1.7, 1.8, 0, TAU);
    ctx.fill();
    ctx.fillStyle = "#fff4dc";
    ctx.beginPath();
    ctx.arc(6.6, -2.3, 0.65, 0, TAU);
    ctx.fill();

    ctx.strokeStyle = "rgba(255, 244, 220, 0.8)";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(0, 0, 9, -2.2, -1.2);
    ctx.stroke();

    if (f.gold) {
      ctx.fillStyle = "#fff4dc";
      ctx.beginPath();
      ctx.moveTo(-1, -15);
      ctx.lineTo(2, -20);
      ctx.lineTo(5, -15);
      ctx.lineTo(2, -12);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  function drawFish() {
    for (const f of fish) drawFishOne(f);
  }

  function drawObstacleShadow(o, wide) {
    if (o.type === "gull") {
      const alpha = 0.1;
      ctx.fillStyle = `rgba(6, 24, 29, ${alpha})`;
      ctx.beginPath();
      ctx.ellipse(o.x + o.w / 2, groundY + 7, o.w * 0.36, 5 * playerScale, 0, 0, TAU);
      ctx.fill();
      return;
    }
    ctx.fillStyle = "rgba(35, 17, 16, 0.25)";
    ctx.beginPath();
    ctx.ellipse(o.x + o.w / 2, groundY + 7, (wide ? o.w * 0.55 : o.w * 0.4), 5 * playerScale, 0, 0, TAU);
    ctx.fill();
  }

  function drawCrab(o) {
    const s = playerScale;
    const cx = o.x + o.w / 2;
    ctx.save();
    ctx.translate(cx, groundY);
    ctx.scale(s, s);
    ctx.strokeStyle = "#0d2d36";
    ctx.lineWidth = 2.2;
    ctx.lineJoin = "round";
    const wiggle = Math.sin(o.phase * 9) * 2;
    for (let side = -1; side <= 1; side += 2) {
      for (let i = 0; i < 3; i++) {
        const lx = side * (13 + i * 5);
        const ly = -10 - i * 4;
        ctx.beginPath();
        ctx.moveTo(side * 10, -13);
        ctx.quadraticCurveTo(lx, ly - 2 + wiggle * side, lx + side * 4, -2 + (i % 2) * 2);
        ctx.stroke();
      }
    }
    ctx.fillStyle = "#ef5b4c";
    ctx.beginPath();
    ctx.ellipse(0, -17, 20, 13, 0, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#ff9a8a";
    ctx.beginPath();
    ctx.ellipse(-4, -20, 9, 5, -0.15, 0, TAU);
    ctx.fill();
    ctx.fillStyle = "#0d2d36";
    for (let side = -1; side <= 1; side += 2) {
      ctx.beginPath();
      ctx.arc(side * 8, -27, 1.4, 0, TAU);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(side * 8, -27);
      ctx.lineTo(side * 9, -33);
      ctx.strokeStyle = "#0d2d36";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = "#fff4dc";
      ctx.beginPath();
      ctx.arc(side * 9, -34, 3.1, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = "#0d2d36";
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.fillStyle = "#0d2d36";
      ctx.beginPath();
      ctx.arc(side * 9, -34, 1.2, 0, TAU);
      ctx.fill();
      ctx.fillStyle = "#ef5b4c";
    }
    for (let side = -1; side <= 1; side += 2) {
      ctx.save();
      ctx.translate(side * 23, -17);
      ctx.rotate(side * 0.35 + Math.sin(o.phase * 7) * 0.08);
      ctx.fillStyle = "#ef5b4c";
      ctx.beginPath();
      ctx.ellipse(side * 5, 0, 9, 6, 0, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = "#0d2d36";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
    }
    ctx.strokeStyle = "#0d2d36";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, -14, 5, 0.2, Math.PI - 0.2);
    ctx.stroke();
    ctx.restore();
  }

  function drawPuddle(o) {
    const s = playerScale;
    const cx = o.x + o.w / 2;
    ctx.save();
    ctx.translate(cx, groundY + 3);
    ctx.scale(s, s);
    const grad = ctx.createLinearGradient(0, -10, 0, 7);
    grad.addColorStop(0, "#80d8d2");
    grad.addColorStop(0.5, "#2f9aa2");
    grad.addColorStop(1, "#17616f");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(0, -2, 48, 8.5, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = "rgba(8, 41, 49, 0.65)";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.strokeStyle = "rgba(232, 255, 247, 0.5)";
    ctx.lineWidth = 1.4;
    for (let i = 0; i < 3; i++) {
      const rx = 12 + i * 12;
      ctx.beginPath();
      ctx.ellipse(0, -2, rx, 2.3 + i * 0.5, 0, 0, Math.PI);
      ctx.stroke();
    }
    const glint = mod(game.time * 40, 50) - 25;
    ctx.fillStyle = "rgba(255, 244, 220, 0.6)";
    ctx.beginPath();
    ctx.ellipse(glint, -5, 5, 1.2, 0, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawLog(o) {
    const s = playerScale;
    const cx = o.x + o.w / 2;
    ctx.save();
    ctx.translate(cx, groundY - 13 * s);
    ctx.scale(s, s);
    ctx.strokeStyle = "#0d2d36";
    ctx.lineWidth = 2.3;
    ctx.lineJoin = "round";
    ctx.fillStyle = "#8b5438";
    ctx.beginPath();
    roundRectPath(ctx, -40, -13, 80, 24, 11);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#b9784f";
    ctx.beginPath();
    roundRectPath(ctx, -34, -10, 65, 6, 3);
    ctx.fill();
    ctx.fillStyle = "#5b3529";
    ctx.beginPath();
    ctx.ellipse(39, -1, 5, 10, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = "#d5a06d";
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.ellipse(39, -1, 2.5 - i * 0.6, 6.5 - i * 1.8, 0, 0, TAU);
      ctx.stroke();
    }
    ctx.strokeStyle = "#0d2d36";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(-20, -12);
    ctx.lineTo(-12, -5);
    ctx.moveTo(-13, -12);
    ctx.lineTo(-19, -4);
    ctx.stroke();
    ctx.fillStyle = "#7fbf82";
    ctx.beginPath();
    ctx.ellipse(-25, -13, 8, 3.5, -0.25, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawGull(o) {
    const s = playerScale;
    const cx = o.x + o.w / 2;
    const cy = groundY - o.alt - o.h / 2 + Math.sin(o.phase * 3) * 3 * s;
    const flap = Math.sin(o.phase * 10);
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(s, s);
    ctx.strokeStyle = "#0d2d36";
    ctx.lineWidth = 2.2;
    ctx.lineJoin = "round";

    ctx.fillStyle = "#fff4dc";
    ctx.beginPath();
    ctx.ellipse(0, 0, 16, 9, -0.1, 0, TAU);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#f7dfc0";
    ctx.beginPath();
    ctx.moveTo(-2, -1);
    ctx.quadraticCurveTo(-15, -18 - flap * 9, -31, -10 - flap * 7);
    ctx.quadraticCurveTo(-19, -2, -5, 3);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(1, -2);
    ctx.quadraticCurveTo(13, -20 + flap * 8, 29, -12 + flap * 7);
    ctx.quadraticCurveTo(17, -2, 6, 3);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#ffc24b";
    ctx.beginPath();
    ctx.moveTo(14, -3);
    ctx.lineTo(27, 0);
    ctx.lineTo(14, 4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#0d2d36";
    ctx.beginPath();
    ctx.arc(9, -2.5, 1.7, 0, TAU);
    ctx.fill();
    ctx.fillStyle = "#fff4dc";
    ctx.beginPath();
    ctx.arc(9.5, -3, 0.6, 0, TAU);
    ctx.fill();

    ctx.strokeStyle = "rgba(255, 244, 220, 0.55)";
    ctx.lineWidth = 1.3;
    for (let i = 0; i < 2; i++) {
      ctx.beginPath();
      ctx.moveTo(-32 - i * 10, 7 + i * 5);
      ctx.lineTo(-16 - i * 8, 7 + i * 5);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawObstacles() {
    for (const o of obstacles) {
      drawObstacleShadow(o, o.type === "puddle");
      if (o.type === "crab") drawCrab(o);
      else if (o.type === "puddle") drawPuddle(o);
      else if (o.type === "log") drawLog(o);
      else if (o.type === "gull") drawGull(o);
    }
  }

  function drawWheel(cx, cy, r, angle) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    ctx.strokeStyle = "#10262d";
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, TAU);
    ctx.stroke();
    ctx.strokeStyle = "#f6dfb9";
    ctx.lineWidth = 2.7;
    ctx.beginPath();
    ctx.arc(0, 0, r - 4, 0, TAU);
    ctx.stroke();
    ctx.strokeStyle = "rgba(255, 244, 220, 0.64)";
    ctx.lineWidth = 1.3;
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * TAU;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * 4, Math.sin(a) * 4);
      ctx.lineTo(Math.cos(a) * (r - 5), Math.sin(a) * (r - 5));
      ctx.stroke();
    }
    ctx.fillStyle = "#ffc24b";
    ctx.beginPath();
    ctx.arc(0, 0, 3.4, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = "#0d2d36";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
  }

  function drawLeg(hip, foot, color) {
    const midX = (hip.x + foot.x) / 2 + 8;
    const midY = (hip.y + foot.y) / 2 + 3;
    ctx.strokeStyle = "#0d2d36";
    ctx.lineWidth = 8;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(hip.x, hip.y);
    ctx.quadraticCurveTo(midX, midY, foot.x, foot.y);
    ctx.stroke();
    ctx.strokeStyle = color;
    ctx.lineWidth = 5;
    ctx.stroke();
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(foot.x - 4, foot.y + 1);
    ctx.lineTo(foot.x + 4, foot.y + 1);
    ctx.stroke();
  }

  function drawBike() {
    const wheelAngle = player.wheel;
    drawWheel(-42, -23, 23, wheelAngle);
    drawWheel(42, -23, 23, wheelAngle);

    // Mudguards
    ctx.strokeStyle = "#0d2d36";
    ctx.lineWidth = 8;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.arc(-42, -23, 27, Math.PI * 1.12, Math.PI * 1.86);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(42, -23, 27, Math.PI * 1.12, Math.PI * 1.86);
    ctx.stroke();
    ctx.strokeStyle = "#ef5b4c";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(-42, -23, 27, Math.PI * 1.12, Math.PI * 1.86);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(42, -23, 27, Math.PI * 1.12, Math.PI * 1.86);
    ctx.stroke();

    // Frame
    const frame = [
      [-42, -23],
      [-28, -68],
      [2, -27],
      [-42, -23],
    ];
    ctx.strokeStyle = "#0d2d36";
    ctx.lineWidth = 10;
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(frame[0][0], frame[0][1]);
    for (let i = 1; i < frame.length; i++) ctx.lineTo(frame[i][0], frame[i][1]);
    ctx.stroke();

    ctx.strokeStyle = "#127c7a";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(frame[0][0], frame[0][1]);
    for (let i = 1; i < frame.length; i++) ctx.lineTo(frame[i][0], frame[i][1]);
    ctx.stroke();

    ctx.strokeStyle = "#0d2d36";
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(-28, -68);
    ctx.lineTo(2, -27);
    ctx.lineTo(32, -62);
    ctx.lineTo(-28, -68);
    ctx.moveTo(32, -62);
    ctx.lineTo(42, -23);
    ctx.stroke();
    ctx.strokeStyle = "#2b9b91";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(-28, -68);
    ctx.lineTo(2, -27);
    ctx.lineTo(32, -62);
    ctx.lineTo(-28, -68);
    ctx.moveTo(32, -62);
    ctx.lineTo(42, -23);
    ctx.stroke();

    // Chain + chainring
    ctx.strokeStyle = "rgba(13, 45, 54, 0.65)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(2, -27);
    ctx.lineTo(-42, -23);
    ctx.stroke();
    ctx.fillStyle = "#ffc24b";
    ctx.beginPath();
    ctx.arc(2, -27, 9, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = "#0d2d36";
    ctx.lineWidth = 2.2;
    ctx.stroke();

    // Seat
    ctx.fillStyle = "#0d2d36";
    ctx.beginPath();
    ctx.ellipse(-27, -72, 15, 5.5, -0.1, 0, TAU);
    ctx.fill();
    ctx.fillStyle = "#ef5b4c";
    ctx.beginPath();
    ctx.ellipse(-27, -73, 12, 3.6, -0.1, 0, TAU);
    ctx.fill();

    // Handlebar
    ctx.strokeStyle = "#0d2d36";
    ctx.lineWidth = 8;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(32, -62);
    ctx.lineTo(35, -82);
    ctx.quadraticCurveTo(38, -87, 47, -84);
    ctx.stroke();
    ctx.strokeStyle = "#fff4dc";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(32, -62);
    ctx.lineTo(35, -82);
    ctx.quadraticCurveTo(38, -87, 47, -84);
    ctx.stroke();
    ctx.strokeStyle = "#ef5b4c";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(43, -85);
    ctx.lineTo(50, -83);
    ctx.stroke();

    // Bell
    ctx.fillStyle = "#ffc24b";
    ctx.beginPath();
    ctx.arc(38, -88, 3.4, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = "#0d2d36";
    ctx.lineWidth = 1.4;
    ctx.stroke();
  }

  function drawCrankAndLegs() {
    const crank = player.pedal;
    const bb = { x: 2, y: -27 };
    const near = { x: bb.x + Math.cos(crank) * 14, y: bb.y + Math.sin(crank) * 14 };
    const far = { x: bb.x + Math.cos(crank + Math.PI) * 14, y: bb.y + Math.sin(crank + Math.PI) * 14 };

    ctx.strokeStyle = "#0d2d36";
    ctx.lineWidth = 5;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(bb.x, bb.y);
    ctx.lineTo(far.x, far.y);
    ctx.moveTo(bb.x, bb.y);
    ctx.lineTo(near.x, near.y);
    ctx.stroke();

    ctx.fillStyle = "#ffc24b";
    ctx.beginPath();
    roundRectPath(ctx, far.x - 5, far.y - 1.5, 10, 3, 1.5);
    ctx.fill();
    ctx.beginPath();
    roundRectPath(ctx, near.x - 5, near.y - 1.5, 10, 3, 1.5);
    ctx.fill();

    const hip = { x: -7, y: -79 };
    drawLeg({ x: hip.x - 5, y: hip.y + 2 }, far, "#c56a2d");
    return { near, far, hip };
  }

  function drawScarfRibbons(anchorX, anchorY, crouch) {
    const t = game.time * 10 + player.pedal * 0.4;
    for (let k = 0; k < 2; k++) {
      const len = 49 - k * 11;
      const wave = Math.sin(t + k * 1.8) * (6 + k * 3);
      const y0 = anchorY + k * 4;
      ctx.fillStyle = k === 0 ? "#ef5b4c" : "#ff7b64";
      ctx.strokeStyle = "#0d2d36";
      ctx.lineWidth = 2.1;
      ctx.beginPath();
      ctx.moveTo(anchorX, y0);
      ctx.quadraticCurveTo(anchorX - len * 0.35, y0 - 10 + wave, anchorX - len * 0.68, y0 - 2 + wave * 0.7);
      ctx.quadraticCurveTo(anchorX - len * 0.9, y0 + 4 + wave * 0.3, anchorX - len, y0 - 2 + wave);
      ctx.lineTo(anchorX - len * 0.8, y0 + 6 + wave * 0.4);
      ctx.quadraticCurveTo(anchorX - len * 0.4, y0 + 6 + wave * 0.4, anchorX, y0 + 5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
  }

  function drawPelican() {
    const crouch = player.duckAmount;
    const bob = player.onGround ? Math.sin(player.pedal * 2) * 1.3 : 0;
    const bodyY = -88 + crouch * 9 + bob;
    const headX = 25 + crouch * 7;
    const headY = -131 + crouch * 22 + bob;
    const hurt = player.hurtTimer > 0;

    // Tail feathers
    ctx.fillStyle = "#fff4dc";
    ctx.strokeStyle = "#0d2d36";
    ctx.lineWidth = 2.7;
    ctx.lineJoin = "round";
    for (let i = 0; i < 3; i++) {
      ctx.save();
      ctx.translate(-36 - i * 3, bodyY - 2 + i * 7);
      ctx.rotate(-0.2 + i * 0.18 + Math.sin(game.time * 5 + i) * 0.04);
      ctx.beginPath();
      ctx.ellipse(-10, 0, 14, 4.5, 0, 0, TAU);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    drawScarfRibbons(7, bodyY - 22, crouch);

    // Body
    ctx.save();
    ctx.translate(0, bodyY);
    ctx.rotate(-0.09 + crouch * 0.08);
    ctx.fillStyle = "#fff4dc";
    ctx.strokeStyle = "#0d2d36";
    ctx.lineWidth = 3.4;
    ctx.beginPath();
    ctx.ellipse(-5, 0, 38, 29, 0, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "rgba(246, 196, 122, 0.18)";
    ctx.beginPath();
    ctx.ellipse(-5, 9, 29, 14, 0, 0, TAU);
    ctx.fill();
    ctx.restore();

    // Neck
    ctx.fillStyle = "#fff4dc";
    ctx.strokeStyle = "#0d2d36";
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.moveTo(5, bodyY - 7);
    ctx.bezierCurveTo(14, bodyY - 22, headX - 9, headY + 16, headX - 3, headY + 8);
    ctx.lineTo(headX + 13, headY + 8);
    ctx.bezierCurveTo(headX + 8, headY + 22, 24, bodyY - 16, 20, bodyY - 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Head
    ctx.fillStyle = "#fff4dc";
    ctx.strokeStyle = "#0d2d36";
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.arc(headX, headY, 17.5, 0, TAU);
    ctx.fill();
    ctx.stroke();

    // Beak upper
    ctx.fillStyle = "#ffb43d";
    ctx.beginPath();
    ctx.moveTo(headX + 10, headY - 7);
    ctx.quadraticCurveTo(headX + 35, headY - 6, headX + 54, headY + 3);
    ctx.quadraticCurveTo(headX + 38, headY + 7, headX + 9, headY + 3);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "rgba(255, 244, 220, 0.32)";
    ctx.beginPath();
    ctx.ellipse(headX + 29, headY - 1.5, 11, 1.6, 0.05, 0, TAU);
    ctx.fill();

    // Pouch
    ctx.fillStyle = "#ef5b4c";
    ctx.beginPath();
    ctx.moveTo(headX + 8, headY + 3);
    ctx.quadraticCurveTo(headX + 29, headY + 10, headX + 47, headY + 4);
    ctx.quadraticCurveTo(headX + 33, headY + 20, headX + 10, headY + 12);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#0d2d36";
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Nostril
    ctx.fillStyle = "#0d2d36";
    ctx.beginPath();
    ctx.ellipse(headX + 25, headY - 4.5, 1.3, 0.9, 0.2, 0, TAU);
    ctx.fill();

    // Eye
    if (hurt) {
      ctx.strokeStyle = "#0d2d36";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(headX + 1, headY - 6);
      ctx.lineTo(headX + 8, headY + 1);
      ctx.moveTo(headX + 8, headY - 6);
      ctx.lineTo(headX + 1, headY + 1);
      ctx.stroke();
    } else {
      const blink = Math.sin(game.time * 1.7) > 0.985;
      if (blink) {
        ctx.strokeStyle = "#0d2d36";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(headX + 1, headY - 3);
        ctx.lineTo(headX + 9, headY - 3);
        ctx.stroke();
      } else {
        ctx.fillStyle = "#fffaf0";
        ctx.beginPath();
        ctx.arc(headX + 5, headY - 3.5, 5.1, 0, TAU);
        ctx.fill();
        ctx.strokeStyle = "#0d2d36";
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.fillStyle = "#0d2d36";
        ctx.beginPath();
        ctx.arc(headX + 6.4, headY - 3.5, 2.3, 0, TAU);
        ctx.fill();
        ctx.fillStyle = "#fff4dc";
        ctx.beginPath();
        ctx.arc(headX + 7.2, headY - 4.4, 0.8, 0, TAU);
        ctx.fill();
      }
    }

    // Helmet
    ctx.save();
    ctx.translate(headX - 1, headY - 6);
    ctx.fillStyle = "#ef5b4c";
    ctx.strokeStyle = "#0d2d36";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 1, 17.5, Math.PI * 1.05, Math.PI * 1.95);
    ctx.quadraticCurveTo(10, -4, 17, 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#ffc24b";
    ctx.beginPath();
    ctx.moveTo(-15, -3);
    ctx.quadraticCurveTo(-1, -13, 14, -2);
    ctx.lineTo(12, 1);
    ctx.quadraticCurveTo(-1, -8, -13, 0);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#0d2d36";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = "#0d2d36";
    ctx.beginPath();
    ctx.arc(-3, -7, 1.1, 0, TAU);
    ctx.fill();
    ctx.restore();

    // Wing
    const wingLift = player.wingLift;
    ctx.fillStyle = "#fff4dc";
    ctx.strokeStyle = "#0d2d36";
    ctx.lineWidth = 2.8;
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(-4, bodyY - 18);
    ctx.bezierCurveTo(12, bodyY - 27, 30, bodyY - 17, 34, -83 - wingLift * 18);
    ctx.bezierCurveTo(27, -83 - wingLift * 15, 18, -78 - wingLift * 10, 10, bodyY - 5);
    ctx.bezierCurveTo(4, bodyY - 3, -2, bodyY - 8, -4, bodyY - 18);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = "rgba(13, 45, 54, 0.35)";
    ctx.lineWidth = 1.4;
    for (let i = 0; i < 2; i++) {
      ctx.beginPath();
      ctx.moveTo(2 + i * 7, bodyY - 10 - i * 4);
      ctx.quadraticCurveTo(17 + i * 5, bodyY - 10 - i * 5, 25 + i * 4, -84 - wingLift * 13 + i * 2);
      ctx.stroke();
    }

    // Scarf knot
    ctx.fillStyle = "#ef5b4c";
    ctx.strokeStyle = "#0d2d36";
    ctx.lineWidth = 2.3;
    ctx.beginPath();
    ctx.ellipse(10, bodyY - 25, 8, 4.5, 0.1, 0, TAU);
    ctx.fill();
    ctx.stroke();

    // Crest feathers
    ctx.strokeStyle = "#0d2d36";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(headX - 13, headY - 8);
    ctx.quadraticCurveTo(headX - 25, headY - 18, headX - 27, headY - 8);
    ctx.moveTo(headX - 12, headY - 4);
    ctx.quadraticCurveTo(headX - 25, headY - 9, headX - 25, headY + 1);
    ctx.stroke();
  }

  function drawPlayer() {
    const s = playerScale;
    const py = groundY - player.y;
    const shadowScale = clamp(1 - player.y / (340 * s), 0.25, 1);
    ctx.save();
    ctx.globalAlpha = 0.23 * shadowScale;
    ctx.fillStyle = "#081d23";
    ctx.beginPath();
    ctx.ellipse(player.x, groundY + 8, 64 * s * shadowScale, 10 * s * shadowScale, 0, 0, TAU);
    ctx.fill();
    ctx.restore();

    if (player.invuln > 0 && Math.floor(game.time * 24) % 2 === 0 && game.mode !== "dying") {
      ctx.save();
      ctx.globalAlpha = 0.45;
    } else {
      ctx.save();
    }

    ctx.translate(player.x, py);
    if (game.mode === "dying") {
      ctx.rotate(player.deathSpin);
    } else {
      const tilt = clamp(player.vy / (2300 * s), -0.13, 0.15) + player.duckAmount * 0.02;
      ctx.rotate(tilt);
    }
    ctx.scale(s, s);
    const squash = player.squash;
    if (Math.abs(squash) > 0.01 && game.mode !== "dying") {
      ctx.scale(1 + squash * 0.035, 1 - squash * 0.06);
    }

    drawBike();
    const legs = drawCrankAndLegs();
    drawPelican();
    drawLeg({ x: legs.hip.x + 3, y: legs.hip.y + 2 }, legs.near, "#e48634");
    ctx.restore();
  }

  function drawParticles() {
    for (const p of particles) {
      const alpha = clamp(p.life / p.max, 0, 1);
      ctx.save();
      ctx.globalAlpha = alpha;
      if (p.shape === "ring") {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 3 * playerScale;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, TAU);
        ctx.stroke();
      } else {
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot || 0);
        if (p.shape === "feather") {
          ctx.fillStyle = p.color;
          ctx.strokeStyle = "rgba(13, 45, 54, 0.4)";
          ctx.lineWidth = 0.9;
          ctx.beginPath();
          ctx.ellipse(0, 0, p.size * 0.55, p.size * 1.5, 0, 0, TAU);
          ctx.fill();
          ctx.stroke();
          ctx.strokeStyle = "rgba(13, 45, 54, 0.32)";
          ctx.beginPath();
          ctx.moveTo(0, -p.size * 1.3);
          ctx.lineTo(0, p.size * 1.1);
          ctx.stroke();
        } else if (p.shape === "spark") {
          ctx.fillStyle = p.color;
          ctx.beginPath();
          const r = p.size;
          ctx.moveTo(0, -r);
          ctx.lineTo(r * 0.3, -r * 0.3);
          ctx.lineTo(r, 0);
          ctx.lineTo(r * 0.3, r * 0.3);
          ctx.lineTo(0, r);
          ctx.lineTo(-r * 0.3, r * 0.3);
          ctx.lineTo(-r, 0);
          ctx.lineTo(-r * 0.3, -r * 0.3);
          ctx.closePath();
          ctx.fill();
        } else if (p.shape === "confetti") {
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size * 0.5, -p.size * 0.3, p.size, p.size * 0.6);
        } else {
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(0, 0, p.size, 0, TAU);
          ctx.fill();
        }
      }
      ctx.restore();
    }
  }

  function drawTexts() {
    for (const t of texts) {
      const alpha = clamp(t.life / t.max, 0, 1);
      const pop = 1 + Math.sin((1 - alpha) * Math.PI) * 0.12;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(t.x, t.y);
      ctx.rotate(t.rot);
      ctx.scale(pop, pop);
      ctx.font = `900 ${t.size}px Impact, "Arial Narrow", "Arial Black", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.lineJoin = "round";
      ctx.strokeStyle = "#0d2d36";
      ctx.lineWidth = Math.max(3, t.size * 0.16);
      ctx.strokeText(t.text, 0, 0);
      ctx.fillStyle = t.color;
      ctx.fillText(t.text, 0, 0);
      ctx.restore();
    }
  }

  function drawFeverTrail() {
    const s = playerScale;
    const y = groundY - player.y;
    ctx.save();
    ctx.lineCap = "round";
    for (let i = 0; i < 5; i++) {
      const off = 20 + i * 26;
      const alpha = 0.3 - i * 0.05;
      ctx.strokeStyle = i % 2 === 0 ? `rgba(255, 194, 75, ${alpha})` : `rgba(239, 91, 76, ${alpha * 0.75})`;
      ctx.lineWidth = (7 - i) * s;
      ctx.beginPath();
      ctx.moveTo(player.x - off * s, y - (28 + i * 4) * s + Math.sin(game.time * 14 + i) * 3 * s);
      ctx.lineTo(player.x - (off + 34 + i * 9) * s, y - (28 + i * 4) * s + Math.sin(game.time * 14 + i) * 3 * s);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawFeverOverlay() {
    const px = player.x;
    const py = groundY - player.y - 80 * playerScale;
    const pulse = 0.9 + Math.sin(game.time * 7) * 0.1;
    const glow = ctx.createRadialGradient(px, py, 20, px, py, 290 * playerScale * pulse);
    glow.addColorStop(0, "rgba(255, 214, 112, 0.24)");
    glow.addColorStop(0.45, "rgba(255, 194, 75, 0.08)");
    glow.addColorStop(1, "rgba(255, 194, 75, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);

    const edge = ctx.createRadialGradient(W / 2, H / 2, H * 0.22, W / 2, H / 2, H * 0.82);
    edge.addColorStop(0, "rgba(255, 194, 75, 0)");
    edge.addColorStop(1, `rgba(255, 170, 60, ${0.22 * pulse})`);
    ctx.fillStyle = edge;
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(game.time * 0.35);
    ctx.strokeStyle = "rgba(255, 220, 130, 0.13)";
    ctx.lineWidth = 2;
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * TAU;
      const r0 = 55 * playerScale;
      const r1 = (130 + (i % 3) * 35) * playerScale;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * r0, Math.sin(a) * r0);
      ctx.lineTo(Math.cos(a) * r1, Math.sin(a) * r1);
      ctx.stroke();
    }
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = "rgba(255, 224, 140, 0.3)";
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 12; i++) {
      const y = horizonY + 18 + mod(i * 73 + game.time * 40, Math.max(80, groundY - horizonY - 30));
      const x = mod(W - game.time * (350 + i * 23) - i * 97, W + 300) - 150;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + 70 + (i % 4) * 24, y);
      ctx.stroke();
    }
    ctx.restore();
  }

  function render() {
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "#0d2d36";
    ctx.fillRect(0, 0, W, H);

    const shake = game.shake;
    const sx = shake > 0.1 && !reducedMotion ? rand(-shake, shake) : 0;
    const sy = shake > 0.1 && !reducedMotion ? rand(-shake, shake) : 0;

    ctx.save();
    if (shake > 0.1 && !reducedMotion) {
      const zoom = 1 + Math.min(0.032, shake * 0.0014);
      ctx.translate(W / 2, H / 2);
      ctx.scale(zoom, zoom);
      ctx.translate(-W / 2 + sx, -H / 2 + sy);
    } else {
      ctx.translate(sx, sy);
    }
    drawSky();
    drawSea();
    drawBoardwalk();
    drawSpeedLines();
    drawObstacles();
    drawFish();
    if (game.feverActive) drawFeverTrail();
    drawPlayer();
    drawParticles();
    drawTexts();
    if (game.feverActive) drawFeverOverlay();
    ctx.restore();

    if (game.flash > 0) {
      ctx.save();
      ctx.globalAlpha = clamp(game.flash, 0, 0.65);
      ctx.fillStyle = game.flashColor;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }
  }

  // ---------------------------------------------------------------- boot
  function frame(now) {
    const raw = Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;
    if (game.mode === "playing") update(raw);
    else if (game.mode === "menu") updateMenu(raw);
    else if (game.mode === "dying") updateDying(raw);
    render();
    requestAnimationFrame(frame);
  }

  function init() {
    resize();
    makeScenery();
    renderScoreTables();
    syncHearts(false);
    syncHUD(true);
    updateSoundUI();
    setMode("menu");
    if (isTouch) {
      ui.touchUi.removeAttribute("aria-hidden");
      ui.resultHint.textContent = "TAP RIDE AGAIN FOR INSTANT RESTART";
    }
    requestAnimationFrame(frame);
  }

  init();
})();
