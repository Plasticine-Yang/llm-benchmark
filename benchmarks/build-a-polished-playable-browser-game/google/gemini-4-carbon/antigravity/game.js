(function () {
  "use strict";

  const STORAGE_SCORES_KEY = "pelican_pedal_highscores_v1";
  const STORAGE_NAME_KEY = "pelican_pedal_rider_name_v1";
  const STORAGE_THEME_KEY = "pelican_pedal_theme_v1";

  const POUCH_FEVER_TARGET = 10;
  const FEVER_DURATION = 6.5;
  const COMBO_MAX_TIME = 4.0;
  const PIXELS_PER_METER = 38;

  function clamp(v, min, max) {
    return v < min ? min : v > max ? max : v;
  }

  function randRange(min, max) {
    return min + Math.random() * (max - min);
  }

  class PelicanGame {
    constructor() {
      this.canvas = document.getElementById("game-canvas");
      this.renderer = new window.PelicanRenderer(this.canvas);
      this.audio = window.PelicanAudio;

      this._bindDOM();
      this._initPools();

      this.riderName = this._loadString(STORAGE_NAME_KEY, "BARNABY");
      this.themeIndex = parseInt(this._loadString(STORAGE_THEME_KEY, "0"), 10) || 0;
      this.highScores = this._loadHighScores();
      this.currentRunRecordId = null;

      this.state = {
        mode: "menu", // "menu" | "playing" | "paused" | "gameover"
        time: 0,
        isTouch: "ontouchstart" in window || navigator.maxTouchPoints > 0,
        themeIndex: this.themeIndex,
        worldScroll: 0,
        distance: 0,
        score: 0,
        fishCaught: 0,
        fishChain: 0,
        fishChainTimer: 0,
        comboCount: 0,
        comboMult: 1,
        maxComboMult: 1,
        comboTimer: 0,
        pouchCount: 0,
        feverTimer: 0,
        tutorialTimer: 7.5,
        hitstopTimer: 0,
        gameOverDelay: 0,
        gameOverCardShown: false,
        overGap: false,
        nextChunkX: 520,
        chunkIndex: 0,
        camera: {
          trauma: 0,
          shakeX: 0,
          shakeY: 0,
          zoom: 1,
          targetZoom: 1
        },
        player: this._createInitialPlayer(),
        entities: [],
        gaps: [],
        fish: [],
        particles: this.particlePool,
        popups: this.popupPool,
        trail: []
      };

      // Input state
      this.input = {
        holdingJump: false,
        holdingTuck: false,
        jumpBuffer: 0,
        coyoteTime: 0,
        activeTouches: new Map(),
        mouseDown: false
      };

      if (this.state.isTouch) {
        document.body.classList.add("touch-device");
      }

      this._syncThemeUI();
      this._syncNameInputs();
      this._syncMuteUI();
      this._renderLeaderboards();

      this._setupEvents();
      this.renderer.resize();
      this._resetWorldForMenu();

      this.lastFrameTime = performance.now();
      requestAnimationFrame((now) => this._frame(now));
    }

    _createInitialPlayer() {
      return {
        worldX: 210,
        screenX: 210,
        h: 0,
        vy: 0,
        speed: 440,
        speedBoost: 0,
        wheelAngle: 0,
        pedalAngle: 0,
        pitch: 0,
        flipAngle: 0,
        flipVel: 0,
        squashX: 1,
        squashY: 1,
        tuckBlend: 0,
        tuckCharge: 0,
        isDiving: false,
        flapsUsed: 0,
        wingOpen: 0,
        wingFlapPhase: 0,
        pouchFill: 0,
        pouchJiggle: 0,
        pouchJiggleVel: 0,
        neckSpring: 0,
        neckSpringVel: 0,
        grindingRail: null,
        grindTickTimer: 0
      };
    }

    _initPools() {
      this.particlePool = [];
      for (let i = 0; i < 420; i++) {
        this.particlePool.push({
          active: false,
          worldSpace: true,
          kind: "circle",
          x: 0,
          h: 0,
          vx: 0,
          vh: 0,
          gravity: 0,
          size: 4,
          rot: 0,
          vrot: 0,
          color: "#ffffff",
          life: 0,
          maxLife: 1
        });
      }

      this.popupPool = [];
      for (let i = 0; i < 28; i++) {
        this.popupPool.push({
          active: false,
          x: 0,
          h: 0,
          text: "",
          color: "#ffd147",
          big: false,
          life: 0,
          maxLife: 0.9
        });
      }
    }

    _bindDOM() {
      this.dom = {
        hud: document.getElementById("hud"),
        hudScore: document.getElementById("hud-score"),
        hudDistance: document.getElementById("hud-distance"),
        hudComboPill: document.getElementById("hud-combo-pill"),
        hudComboMult: document.getElementById("hud-combo-mult"),
        hudComboBar: document.getElementById("hud-combo-bar"),
        hudPouchPill: document.getElementById("hud-pouch-pill"),
        hudPouchLabel: document.getElementById("hud-pouch-label"),
        hudPouchCount: document.getElementById("hud-pouch-count"),
        hudPouchBar: document.getElementById("hud-pouch-bar"),
        btnHudMute: document.getElementById("btn-hud-mute"),
        iconSoundOn: document.getElementById("icon-sound-on"),
        iconSoundOff: document.getElementById("icon-sound-off"),
        btnHudPause: document.getElementById("btn-hud-pause"),
        touchLeftBadge: document.getElementById("touch-left-badge"),
        touchRightBadge: document.getElementById("touch-right-badge"),

        startOverlay: document.getElementById("start-overlay"),
        styleNameLabel: document.getElementById("style-name-label"),
        swatchBtns: Array.from(document.querySelectorAll(".swatch-btn")),
        btnStartPlay: document.getElementById("btn-start-play"),
        btnStartMute: document.getElementById("btn-start-mute"),
        startMuteLabel: document.getElementById("start-mute-label"),
        riderNameStart: document.getElementById("rider-name-start"),
        startLeaderboard: document.getElementById("start-leaderboard"),

        pauseOverlay: document.getElementById("pause-overlay"),
        btnPauseResume: document.getElementById("btn-pause-resume"),
        btnPauseRestart: document.getElementById("btn-pause-restart"),
        btnPauseMute: document.getElementById("btn-pause-mute"),
        pauseMuteLabel: document.getElementById("pause-mute-label"),
        btnPauseMenu: document.getElementById("btn-pause-menu"),

        gameoverOverlay: document.getElementById("gameover-overlay"),
        newRecordBadge: document.getElementById("new-record-badge"),
        gameoverReason: document.getElementById("gameover-reason"),
        goScore: document.getElementById("go-score"),
        goDistance: document.getElementById("go-distance"),
        goFish: document.getElementById("go-fish"),
        goCombo: document.getElementById("go-combo"),
        btnGoRestart: document.getElementById("btn-go-restart"),
        btnGoMenu: document.getElementById("btn-go-menu"),
        riderNameGo: document.getElementById("rider-name-go"),
        goLeaderboard: document.getElementById("go-leaderboard")
      };
    }

    // ==================== PERSISTENCE & LEADERBOARD ====================
    _loadString(key, fallback) {
      try {
        const v = localStorage.getItem(key);
        return v !== null ? v : fallback;
      } catch (_) {
        return fallback;
      }
    }

    _saveString(key, val) {
      try {
        localStorage.setItem(key, val);
      } catch (_) {}
    }

    _loadHighScores() {
      try {
        const raw = localStorage.getItem(STORAGE_SCORES_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed.slice(0, 5);
          }
        }
      } catch (_) {}

      // Seed friendly local boardwalk rivals until beaten!
      return [
        { id: "seed1", name: "CAPTAIN", score: 4200, distance: 260, combo: 5 },
        { id: "seed2", name: "SANDY", score: 2650, distance: 175, combo: 4 },
        { id: "seed3", name: "GULLIVER", score: 1400, distance: 98, combo: 3 }
      ];
    }

    _saveHighScores() {
      try {
        localStorage.setItem(STORAGE_SCORES_KEY, JSON.stringify(this.highScores.slice(0, 5)));
      } catch (_) {}
    }

    _recordRunScore(score, distance, maxCombo) {
      const cleanName = (this.riderName || "BARNABY").trim().toUpperCase().slice(0, 10) || "BARNABY";
      const prevBest = this.highScores.length > 0 ? this.highScores[0].score : 0;
      const isNewTop = score > prevBest && score > 0;

      const entry = {
        id: "run_" + Date.now() + "_" + Math.floor(Math.random() * 9999),
        name: cleanName,
        score: Math.round(score),
        distance: Math.round(distance),
        combo: maxCombo
      };

      this.highScores.push(entry);
      this.highScores.sort((a, b) => b.score - a.score);
      this.highScores = this.highScores.slice(0, 5);

      const madeBoard = this.highScores.some((item) => item.id === entry.id);
      this.currentRunRecordId = madeBoard ? entry.id : null;
      this._saveHighScores();
      this._renderLeaderboards();
      return isNewTop;
    }

    _updateRiderName(newName) {
      const cleaned = newName.replace(/[^a-zA-Z0-9 _-]/g, "").toUpperCase().slice(0, 10);
      this.riderName = cleaned || "BARNABY";
      this._saveString(STORAGE_NAME_KEY, this.riderName);

      // Update active run entry live if on leaderboard
      if (this.currentRunRecordId) {
        for (let i = 0; i < this.highScores.length; i++) {
          if (this.highScores[i].id === this.currentRunRecordId) {
            this.highScores[i].name = this.riderName;
          }
        }
        this._saveHighScores();
        this._renderLeaderboards();
      }
    }

    _renderLeaderboards() {
      [this.dom.startLeaderboard, this.dom.goLeaderboard].forEach((listEl) => {
        if (!listEl) return;
        listEl.innerHTML = "";
        if (this.highScores.length === 0) {
          const empty = document.createElement("li");
          empty.className = "lb-empty";
          empty.textContent = "No rides recorded yet — hop on!";
          listEl.appendChild(empty);
          return;
        }

        this.highScores.forEach((entry, idx) => {
          const li = document.createElement("li");
          li.className = "lb-row" + (entry.id === this.currentRunRecordId ? " current-run" : "");

          const rank = document.createElement("span");
          rank.className = "lb-rank";
          rank.textContent = "#" + (idx + 1);

          const name = document.createElement("span");
          name.className = "lb-name";
          name.textContent = entry.name;

          const meta = document.createElement("span");
          meta.className = "lb-meta";
          meta.textContent = `${entry.distance}m • x${entry.combo}`;

          const sc = document.createElement("span");
          sc.className = "lb-score";
          sc.textContent = entry.score.toLocaleString();

          li.appendChild(rank);
          li.appendChild(name);
          li.appendChild(meta);
          li.appendChild(sc);
          listEl.appendChild(li);
        });
      });
    }

    // ==================== UI & EVENTS ====================
    _syncThemeUI() {
      const themes = this.renderer.getThemes();
      const idx = this.themeIndex % themes.length;
      this.state.themeIndex = idx;
      this.dom.styleNameLabel.textContent = "Cruiser: " + themes[idx].name;
      this.dom.swatchBtns.forEach((btn, bIdx) => {
        btn.classList.toggle("active", bIdx === idx);
      });
    }

    _syncNameInputs() {
      this.dom.riderNameStart.value = this.riderName;
      this.dom.riderNameGo.value = this.riderName;
    }

    _syncMuteUI() {
      const muted = this.audio.isMuted();
      const label = muted ? "Sound: OFF" : "Sound: ON";
      this.dom.startMuteLabel.textContent = label;
      this.dom.pauseMuteLabel.textContent = label;
      this.dom.iconSoundOn.style.display = muted ? "none" : "block";
      this.dom.iconSoundOff.style.display = muted ? "block" : "none";
    }

    _setupEvents() {
      window.addEventListener("resize", () => {
        this.renderer.resize();
      });

      document.addEventListener("visibilitychange", () => {
        if (document.hidden && this.state.mode === "playing") {
          this.pauseGame();
        }
      });

      // Theme swatches
      this.dom.swatchBtns.forEach((btn) => {
        btn.addEventListener("click", () => {
          this.themeIndex = parseInt(btn.dataset.theme, 10) || 0;
          this._saveString(STORAGE_THEME_KEY, String(this.themeIndex));
          this._syncThemeUI();
          this.audio.playBell();
          this.state.player.squashY = 1.15;
          this.state.player.squashX = 0.88;
        });
      });

      // Rider name inputs
      const onNameInput = (e) => {
        this._updateRiderName(e.target.value);
        if (e.target === this.dom.riderNameStart) {
          this.dom.riderNameGo.value = this.riderName;
        } else {
          this.dom.riderNameStart.value = this.riderName;
        }
      };
      this.dom.riderNameStart.addEventListener("input", onNameInput);
      this.dom.riderNameGo.addEventListener("input", onNameInput);

      // Menu / HUD / Pause / Game Over buttons
      this.dom.btnStartPlay.addEventListener("click", () => this.startGame());
      this.dom.btnHudPause.addEventListener("click", () => {
        if (this.state.mode === "playing") this.pauseGame();
        else if (this.state.mode === "paused") this.resumeGame();
      });

      const handleMuteToggle = () => {
        this.audio.toggleMute();
        this._syncMuteUI();
      };
      this.dom.btnHudMute.addEventListener("click", handleMuteToggle);
      this.dom.btnStartMute.addEventListener("click", handleMuteToggle);
      this.dom.btnPauseMute.addEventListener("click", handleMuteToggle);

      this.dom.btnPauseResume.addEventListener("click", () => this.resumeGame());
      this.dom.btnPauseRestart.addEventListener("click", () => this.startGame());
      this.dom.btnPauseMenu.addEventListener("click", () => this.returnToMenu());

      this.dom.btnGoRestart.addEventListener("click", () => this.startGame());
      this.dom.btnGoMenu.addEventListener("click", () => this.returnToMenu());

      // Keyboard controls
      window.addEventListener("keydown", (e) => this._onKeyDown(e));
      window.addEventListener("keyup", (e) => this._onKeyUp(e));

      // Multi-touch controls on canvas
      this.canvas.addEventListener("touchstart", (e) => this._onTouchStart(e), { passive: false });
      this.canvas.addEventListener("touchmove", (e) => this._onTouchMove(e), { passive: false });
      this.canvas.addEventListener("touchend", (e) => this._onTouchEnd(e), { passive: false });
      this.canvas.addEventListener("touchcancel", (e) => this._onTouchEnd(e), { passive: false });

      // Mouse convenience on canvas
      this.canvas.addEventListener("mousedown", (e) => {
        if (this.state.mode !== "playing") return;
        if (e.button === 0) {
          this.input.mouseDown = true;
          const rect = this.canvas.getBoundingClientRect();
          const relX = (e.clientX - rect.left) / Math.max(1, rect.width);
          if (relX < 0.25) {
            this._pressTuck();
          } else {
            this._pressJump();
          }
        } else if (e.button === 2) {
          this._pressTuck();
        }
      });

      window.addEventListener("mouseup", () => {
        if (!this.input.mouseDown) return;
        this.input.mouseDown = false;
        if (this.input.holdingJump) this._releaseJump();
        if (this.input.holdingTuck) this._releaseTuck();
      });

      this.canvas.addEventListener("contextmenu", (e) => e.preventDefault());
    }

    _onKeyDown(e) {
      // Allow typing in Rider Name input without triggering shortcuts!
      if (document.activeElement && document.activeElement.tagName === "INPUT") {
        if (e.key === "Enter" || e.key === "Escape") {
          document.activeElement.blur();
        }
        return;
      }

      const code = e.code;
      const isJumpKey = code === "Space" || code === "ArrowUp" || code === "KeyW";
      const isTuckKey = code === "ArrowDown" || code === "KeyS" || code === "ShiftLeft" || code === "ShiftRight";

      if (isJumpKey || isTuckKey) {
        e.preventDefault();
      }

      if (e.repeat) return;

      if (code === "KeyM") {
        this.audio.toggleMute();
        this._syncMuteUI();
        return;
      }

      if (this.state.mode === "menu") {
        if (code === "Space" || code === "Enter") {
          this.startGame();
        }
        return;
      }

      if (this.state.mode === "playing") {
        if (code === "KeyP" || code === "Escape") {
          this.pauseGame();
          return;
        }
        if (code === "KeyR") {
          this.startGame();
          return;
        }
        if (isJumpKey) this._pressJump();
        if (isTuckKey) this._pressTuck();
        return;
      }

      if (this.state.mode === "paused") {
        if (code === "KeyP" || code === "Escape" || code === "Space") {
          this.resumeGame();
        } else if (code === "KeyR") {
          this.startGame();
        }
        return;
      }

      if (this.state.mode === "gameover") {
        if (code === "KeyR") {
          this.startGame();
        } else if ((code === "Space" || code === "Enter") && this.state.gameOverDelay <= 0.15) {
          this.startGame();
        }
      }
    }

    _onKeyUp(e) {
      const code = e.code;
      if (code === "Space" || code === "ArrowUp" || code === "KeyW") {
        this._releaseJump();
      }
      if (code === "ArrowDown" || code === "KeyS" || code === "ShiftLeft" || code === "ShiftRight") {
        this._releaseTuck();
      }
    }

    _onTouchStart(e) {
      if (!this.state.isTouch) {
        this.state.isTouch = true;
        document.body.classList.add("touch-device");
      }
      if (this.state.mode !== "playing") return;
      e.preventDefault();
      this.audio.unlock();

      const rect = this.canvas.getBoundingClientRect();
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        const relX = (t.clientX - rect.left) / Math.max(1, rect.width);
        const role = relX < 0.4 ? "tuck" : "jump";
        this.input.activeTouches.set(t.identifier, {
          role,
          startX: t.clientX,
          startY: t.clientY
        });

        if (role === "jump") {
          this._pressJump();
        } else {
          this._pressTuck();
        }
      }
      this._syncTouchBadges();
    }

    _onTouchMove(e) {
      if (this.state.mode !== "playing") return;
      e.preventDefault();

      // One-handed swipe down anywhere converts a jump touch into a Dive-Slam / Tuck!
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        const info = this.input.activeTouches.get(t.identifier);
        if (!info) continue;
        const dy = t.clientY - info.startY;
        const dx = Math.abs(t.clientX - info.startX);
        if (info.role === "jump" && dy > 34 && dy > dx * 1.1) {
          info.role = "tuck";
          this._recomputeTouchHolds();
          this._pressTuck();
          this._syncTouchBadges();
        }
      }
    }

    _onTouchEnd(e) {
      if (this.state.mode !== "playing") {
        this.input.activeTouches.clear();
        this._syncTouchBadges();
        return;
      }
      e.preventDefault();

      for (let i = 0; i < e.changedTouches.length; i++) {
        this.input.activeTouches.delete(e.changedTouches[i].identifier);
      }
      this._recomputeTouchHolds();
      this._syncTouchBadges();
    }

    _recomputeTouchHolds() {
      let hasJump = false;
      let hasTuck = false;
      this.input.activeTouches.forEach((info) => {
        if (info.role === "jump") hasJump = true;
        if (info.role === "tuck") hasTuck = true;
      });

      if (!hasJump && this.input.holdingJump) this._releaseJump();
      if (!hasTuck && this.input.holdingTuck) this._releaseTuck();
    }

    _syncTouchBadges() {
      let hasJump = false;
      let hasTuck = false;
      this.input.activeTouches.forEach((info) => {
        if (info.role === "jump") hasJump = true;
        if (info.role === "tuck") hasTuck = true;
      });
      this.dom.touchLeftBadge.classList.toggle("pressed", hasTuck);
      this.dom.touchRightBadge.classList.toggle("pressed", hasJump);
    }

    // ==================== CORE ACTIONS ====================
    _pressJump() {
      this.input.holdingJump = true;
      this.input.jumpBuffer = 0.13;
      this._tryConsumeJump();
    }

    _releaseJump() {
      this.input.holdingJump = false;
      const p = this.state.player;
      // Variable jump height cut when releasing early on first hop
      if (p.vy > 240 && p.flapsUsed === 0) {
        p.vy *= 0.62;
      }
    }

    _pressTuck() {
      this.input.holdingTuck = true;
      const p = this.state.player;
      const onSurface = p.grindingRail !== null || (!this.state.overGap && p.h <= 2);

      if (!onSurface && !p.isDiving) {
        // Mid-air Aero Dive-Slam!
        p.isDiving = true;
        p.vy = Math.min(p.vy, -900);
        p.squashX = 0.82;
        p.squashY = 1.24;
        this.audio.playDive();
        this._spawnFeathers(p.worldX, p.h + 36, 5);
      }
    }

    _releaseTuck() {
      const p = this.state.player;
      if (this.input.holdingTuck && p.tuckCharge >= 0.35 && (p.h <= 4 || p.grindingRail)) {
        // Charged Aero Drift Boost!
        p.speedBoost = Math.max(p.speedBoost, 135);
        p.pitch = -0.18;
        this._awardStunt(45, "DRIFT BOOST!", "#38bdf8", false);
        this.audio.playStuntChime();
        this._spawnSparks(p.worldX - 24, p.h + 6, 10, "#38bdf8");
      }
      this.input.holdingTuck = false;
      p.tuckCharge = 0;
    }

    _tryConsumeJump() {
      if (this.input.jumpBuffer <= 0 || this.state.mode !== "playing") return;
      const p = this.state.player;
      const onGround = !this.state.overGap && p.h <= 3 && p.vy <= 20;

      if (p.grindingRail) {
        // Rail Pop!
        const nearTip = p.worldX > p.grindingRail.x + p.grindingRail.w - 75;
        p.grindingRail = null;
        this.audio.setGrindActive(false);
        p.vy = 640;
        p.flapsUsed = 0;
        p.isDiving = false;
        p.squashX = 0.84;
        p.squashY = 1.2;
        this.input.jumpBuffer = 0;
        this.input.coyoteTime = 0;
        this.audio.playJump();
        this._spawnSparks(p.worldX, p.h, 12, "#fde047");

        if (nearTip) {
          p.flipVel = -Math.PI * 2 / 0.56;
          this._awardStunt(95, "RAIL FLIP! +95", "#ffb800", true);
        } else {
          this._awardStunt(60, "RAIL POP! +60", "#fde047", false);
        }
        return;
      }

      if (onGround || this.input.coyoteTime > 0) {
        // Crisp Bunny Hop!
        p.h = Math.max(0, p.h);
        p.vy = 635;
        p.flapsUsed = 0;
        p.isDiving = false;
        p.pitch = -0.22;
        p.squashX = 0.84;
        p.squashY = 1.2;
        p.neckSpringVel = 120;
        this.input.jumpBuffer = 0;
        this.input.coyoteTime = 0;
        this.audio.playJump();
        this._spawnDust(p.worldX - 20, 2, 7);
        this._spawnFeathers(p.worldX - 6, p.h + 32, 4);
        return;
      }

      if (p.flapsUsed < 1) {
        // Mid-air Big Wing Flap!
        p.flapsUsed = 1;
        p.isDiving = false;
        p.vy = Math.max(p.vy * 0.3 + 530, 565);
        p.wingOpen = 1;
        p.wingFlapPhase = 0;
        p.squashX = 0.88;
        p.squashY = 1.16;
        p.pouchJiggleVel += 9;
        this.input.jumpBuffer = 0;
        this.audio.playFlap();
        this._spawnFeathers(p.worldX - 8, p.h + 38, 11);
        this._spawnRing(p.worldX, p.h + 24, 12, "#fffaf0");
      }
    }

    // ==================== GAME STATE TRANSITIONS ====================
    _resetWorldForMenu() {
      const s = this.state;
      s.mode = "menu";
      s.worldScroll = 0;
      s.distance = 0;
      s.feverTimer = 0;
      s.entities.length = 0;
      s.gaps.length = 0;
      s.fish.length = 0;
      s.trail.length = 0;
      s.player = this._createInitialPlayer();
      s.player.speed = 290;

      // Spawn cheerful fish arcs for the Start Screen attract loop
      for (let x = 420; x < 2200; x += 340) {
        this._spawnFishArc(x, 220, 18, 92, 6, false);
      }

      this.dom.hud.classList.add("hidden");
      this.dom.startOverlay.classList.remove("hidden");
      this.dom.pauseOverlay.classList.add("hidden");
      this.dom.gameoverOverlay.classList.add("hidden");
      this.audio.stopMusic();
    }

    startGame() {
      this.audio.unlock();
      this.audio.playBell();
      this.audio.setFever(false);
      this.audio.startMusic();
      this.audio.setMusicPaused(false);

      const s = this.state;
      s.mode = "playing";
      s.worldScroll = 0;
      s.distance = 0;
      s.score = 0;
      s.fishCaught = 0;
      s.fishChain = 0;
      s.fishChainTimer = 0;
      s.comboCount = 0;
      s.comboMult = 1;
      s.maxComboMult = 1;
      s.comboTimer = 0;
      s.pouchCount = 0;
      s.feverTimer = 0;
      s.hitstopTimer = 0;
      s.gameOverDelay = 0;
      s.gameOverCardShown = false;
      s.overGap = false;
      s.entities.length = 0;
      s.gaps.length = 0;
      s.fish.length = 0;
      s.trail.length = 0;
      this.currentRunRecordId = null;

      for (let i = 0; i < this.particlePool.length; i++) this.particlePool[i].active = false;
      for (let i = 0; i < this.popupPool.length; i++) this.popupPool[i].active = false;

      s.player = this._createInitialPlayer();
      s.player.pitch = -0.2; // Joyful opening wheelie!
      s.player.speedBoost = 70;
      s.camera.trauma = 0.16;
      s.camera.zoom = 1.03;
      s.camera.targetZoom = 1.0;

      this.input.holdingJump = false;
      this.input.holdingTuck = false;
      this.input.jumpBuffer = 0;
      this.input.coyoteTime = 0;
      this.input.activeTouches.clear();
      this._syncTouchBadges();

      // Spawn opening welcome boardwalk encounters right away (fun in < 3 seconds!)
      s.nextChunkX = 500;
      s.chunkIndex = 0;
      while (s.nextChunkX < 2400) {
        this._spawnNextChunk();
      }

      this.dom.startOverlay.classList.add("hidden");
      this.dom.pauseOverlay.classList.add("hidden");
      this.dom.gameoverOverlay.classList.add("hidden");
      this.dom.hud.classList.remove("hidden");
      this._updateHUD(true);
    }

    pauseGame() {
      if (this.state.mode !== "playing") return;
      this.state.mode = "paused";
      this.input.holdingJump = false;
      this.input.holdingTuck = false;
      this.input.activeTouches.clear();
      this._syncTouchBadges();
      this.audio.setMusicPaused(true);
      this.dom.pauseOverlay.classList.remove("hidden");
    }

    resumeGame() {
      if (this.state.mode !== "paused") return;
      this.state.mode = "playing";
      this.dom.pauseOverlay.classList.add("hidden");
      this.audio.setMusicPaused(false);
      this.lastFrameTime = performance.now();
    }

    returnToMenu() {
      this._resetWorldForMenu();
      this._renderLeaderboards();
    }

    _triggerGameOver(reasonText) {
      if (this.state.mode === "gameover") return;
      const s = this.state;
      s.mode = "gameover";
      s.hitstopTimer = 0.055;
      s.gameOverDelay = 0.42;
      s.gameOverCardShown = false;
      s.feverTimer = 0;

      const p = s.player;
      p.grindingRail = null;
      p.vy = Math.max(p.vy, 340);
      p.pitch = -0.55;
      s.camera.trauma = 0.72;

      this.input.holdingJump = false;
      this.input.holdingTuck = false;
      this.input.activeTouches.clear();
      this._syncTouchBadges();

      this.audio.setFever(false);
      this.audio.stopMusic();
      this.audio.playCrash();

      this._spawnFeathers(p.worldX, Math.max(10, p.h + 30), 22);
      this._spawnRing(p.worldX, Math.max(10, p.h + 24), 20, "#ff5e4d");

      // Immediately save run to local leaderboard so instant restart never loses your score!
      const isNewTop = this._recordRunScore(s.score, s.distance, s.maxComboMult);

      this.dom.gameoverReason.textContent = reasonText;
      this.dom.goScore.textContent = Math.round(s.score).toLocaleString();
      this.dom.goDistance.textContent = Math.round(s.distance) + "m";
      this.dom.goFish.textContent = String(s.fishCaught);
      this.dom.goCombo.textContent = "x" + s.maxComboMult;
      this.dom.newRecordBadge.classList.toggle("hidden", !isNewTop);
      this._updateHUD(true);
    }

    // ==================== CHUNK PATTERN DIRECTOR ====================
    _spawnFishArc(startX, width, startH, peakH, count, includeRare) {
      for (let i = 0; i < count; i++) {
        const t = count === 1 ? 0.5 : i / (count - 1);
        const fx = startX + t * width;
        const arc = 4 * t * (1 - t);
        const fh = startH + arc * (peakH - startH);
        const isRare = includeRare && i === Math.floor(count / 2);
        this.state.fish.push({
          active: true,
          x: fx,
          h: fh,
          gold: i % 2 === 1,
          rare: isRare,
          phase: i * 0.55
        });
      }
    }

    _spawnFishLine(startX, spacing, count, h, rareLast) {
      for (let i = 0; i < count; i++) {
        this.state.fish.push({
          active: true,
          x: startX + i * spacing,
          h,
          gold: i % 2 === 0,
          rare: !!(rareLast && i === count - 1),
          phase: i * 0.45
        });
      }
    }

    _addEntity(props) {
      this.state.entities.push(
        Object.assign(
          {
            active: true,
            x: 0,
            h: 0,
            w: 46,
            clearance: 50,
            phase: Math.random() * 6.28,
            bounceAnim: 0,
            smashed: false,
            smashY: 0,
            smashVy: 0,
            smashRot: 0,
            passed: false
          },
          props
        )
      );
    }

    _spawnNextChunk() {
      const s = this.state;
      const x = s.nextChunkX;
      const idx = s.chunkIndex++;
      const dist = x / PIXELS_PER_METER;

      // Pick curated encounter: Chunk 0 & 1 are guaranteed joyful intro chunks!
      let pattern;
      if (idx === 0) {
        pattern = 0; // Immediate fish arc + Umbrella bounce + high rainbow koi!
      } else if (idx === 1) {
        pattern = 1; // Classic crab hop + wooden fish crate smash
      } else if (idx === 2) {
        pattern = 2; // Pier rail grind + launch ramp!
      } else if (idx === 3) {
        pattern = 3; // Low pier banner (teaches Aero-Tuck) + fish line
      } else if (idx % 6 === 0) {
        pattern = 9; // Joyful Fish Frenzy breather wave!
      } else {
        const maxPool = dist > 160 ? 9 : 7;
        pattern = 1 + Math.floor(Math.random() * maxPool);
      }

      let chunkSpan = 560;

      switch (pattern) {
        case 0: {
          // Opening 3-second hook: Sardine arc -> Beach Umbrella -> High Rainbow Koi!
          this._spawnFishArc(x, 190, 24, 88, 5, false);
          this._addEntity({ type: "umbrella", x: x + 235, h: 74, w: 88 });
          this._spawnFishArc(x + 265, 220, 125, 195, 5, true);
          chunkSpan = 560;
          break;
        }
        case 1: {
          // Snappy Crab + Smashable Fish Crate
          this._addEntity({ type: "crab", x: x + 110, h: 28, w: 34 });
          this._spawnFishArc(x + 30, 160, 26, 98, 5, false);

          this._addEntity({ type: "crate", x: x + 360, h: 46, w: 46 });
          this._spawnFishArc(x + 300, 140, 58, 110, 4, false);
          chunkSpan = 540;
          break;
        }
        case 2: {
          // Launch Ramp -> Brass Pier Grind Rail -> Crab under dismount
          this._addEntity({ type: "ramp", x: x + 40, h: 38, w: 86 });
          this._addEntity({ type: "rail", x: x + 185, h: 86, w: 280 });
          this._spawnFishLine(x + 205, 44, 6, 114, true);
          this._addEntity({ type: "crab", x: x + 445, h: 28, w: 34 });
          chunkSpan = 600;
          break;
        }
        case 3: {
          // Overhead Low-Clearance Banner (Aero-Tuck!) + optional high-flap bonus
          this._addEntity({ type: "banner", x: x + 90, w: 138, clearance: 50 });
          this._spawnFishLine(x + 70, 36, 6, 22, false);
          this._spawnFishArc(x + 80, 150, 140, 185, 3, true);
          chunkSpan = 450;
          break;
        }
        case 4: {
          // Crate Smash Alley (2 crates + Umbrella)
          this._addEntity({ type: "crate", x: x + 90, h: 46, w: 46 });
          this._addEntity({ type: "crate", x: x + 230, h: 46, w: 46 });
          this._spawnFishLine(x + 90, 70, 3, 78, false);
          this._addEntity({ type: "umbrella", x: x + 380, h: 76, w: 86 });
          this._spawnFishArc(x + 410, 180, 130, 205, 5, true);
          chunkSpan = 640;
          break;
        }
        case 5: {
          // Bandit Seagull Patrol (Duck under OR Head-Bop across!)
          this._addEntity({ type: "gull", x: x + 160, h: 82, w: 44 });
          this._addEntity({ type: "gull", x: x + 340, h: 112, w: 44 });
          this._spawnFishLine(x + 110, 48, 5, 24, false);
          this._spawnFishArc(x + 150, 210, 108, 168, 4, true);
          chunkSpan = 540;
          break;
        }
        case 6: {
          // Staircase Grind Rails!
          this._addEntity({ type: "rail", x: x + 50, h: 64, w: 190 });
          this._spawnFishLine(x + 70, 44, 4, 92, false);
          this._addEntity({ type: "rail", x: x + 290, h: 118, w: 210 });
          this._spawnFishLine(x + 315, 44, 4, 146, true);
          this._addEntity({ type: "crab", x: x + 390, h: 28, w: 34 });
          chunkSpan = 620;
          break;
        }
        case 7: {
          // High-Low Dockyard Combo: Crab -> Low Banner -> Launch Ramp
          this._addEntity({ type: "crab", x: x + 75, h: 28, w: 34 });
          this._spawnFishArc(x + 15, 120, 26, 92, 4, false);
          this._addEntity({ type: "banner", x: x + 275, w: 130, clearance: 50 });
          this._spawnFishLine(x + 265, 36, 4, 22, false);
          this._addEntity({ type: "ramp", x: x + 485, h: 40, w: 86 });
          this._spawnFishArc(x + 585, 190, 95, 175, 5, true);
          chunkSpan = 800;
          break;
        }
        case 8: {
          // Tidal Pier Water Gap with Ramp + Elevated Grind Rail Option!
          const gapW = clamp(185 + dist * 0.08, 185, 255);
          this._addEntity({ type: "ramp", x: x + 55, h: 40, w: 88 });
          s.gaps.push({ x: x + 148, w: gapW });
          this._spawnFishArc(x + 150, gapW + 40, 85, 165, 6, true);
          if (Math.random() > 0.45) {
            this._addEntity({ type: "rail", x: x + 180, h: 88, w: gapW - 20 });
          }
          chunkSpan = 260 + gapW + 170;
          break;
        }
        default: {
          // Pattern 9: Fish Frenzy Shoal + Dual Umbrellas!
          this._spawnFishArc(x + 30, 170, 28, 95, 6, false);
          this._addEntity({ type: "umbrella", x: x + 230, h: 74, w: 88 });
          this._spawnFishArc(x + 260, 180, 130, 200, 6, true);
          this._addEntity({ type: "umbrella", x: x + 465, h: 86, w: 88 });
          this._spawnFishArc(x + 495, 170, 140, 210, 5, false);
          chunkSpan = 720;
          break;
        }
      }

      // Add slight breathing room as speed rises so reaction window stays fair
      const speedBreathing = clamp((s.player.speed - 440) * 0.32, 0, 140);
      s.nextChunkX = x + chunkSpan + speedBreathing;
    }

    // ==================== SCORING, STUNTS & FEVER ====================
    _awardStunt(basePoints, label, color, big) {
      const s = this.state;
      s.comboCount++;
      s.comboTimer = COMBO_MAX_TIME;
      s.comboMult = Math.min(8, 1 + Math.floor(s.comboCount / 2));
      if (s.comboMult > s.maxComboMult) {
        s.maxComboMult = s.comboMult;
      }

      const feverBonus = s.feverTimer > 0 ? 2 : 1;
      const totalPts = basePoints * s.comboMult * feverBonus;
      s.score += totalPts;

      this._spawnPopup(s.player.worldX + 16, s.player.h + 74, label, color, big);
      this.dom.hudComboPill.classList.remove("pop");
      void this.dom.hudComboPill.offsetWidth;
      this.dom.hudComboPill.classList.add("pop");
    }

    _collectFish(f) {
      f.active = false;
      const s = this.state;
      const p = s.player;

      s.fishCaught++;
      s.fishChain = s.fishChainTimer > 0 ? s.fishChain + 1 : 0;
      s.fishChainTimer = 1.1;

      // Refresh combo timer & bump combo every 5 fish!
      if (s.comboTimer > 0) {
        s.comboTimer = Math.min(COMBO_MAX_TIME, s.comboTimer + 0.85);
      } else {
        s.comboTimer = COMBO_MAX_TIME * 0.7;
      }
      if (s.fishCaught % 5 === 0) {
        s.comboCount++;
        s.comboMult = Math.min(8, 1 + Math.floor(s.comboCount / 2));
        if (s.comboMult > s.maxComboMult) s.maxComboMult = s.comboMult;
      }

      const feverMult = s.feverTimer > 0 ? 2 : 1;
      const pts = (f.rare ? 60 : 15) * s.comboMult * feverMult;
      s.score += pts;

      // Spring jiggle on Barnaby's throat pouch!
      p.pouchJiggleVel += f.rare ? 16 : 9.5;
      this.audio.playFish(s.fishChain, f.rare);

      // Particle burst
      this._spawnSparks(f.x, f.h, f.rare ? 12 : 5, f.rare ? "#fde047" : "#7dd3fc");
      if (f.rare) {
        this._spawnPopup(f.x, f.h + 24, `RAINBOW KOI! +${pts}`, "#fde047", true);
        this._spawnRing(f.x, f.h, 14, "#fde047");
      }

      // Charge Pouch Fever (unless already in Fever, where fish extend score!)
      if (s.feverTimer <= 0) {
        s.pouchCount = Math.min(POUCH_FEVER_TARGET, s.pouchCount + (f.rare ? 3 : 1));
        if (s.pouchCount >= POUCH_FEVER_TARGET) {
          this._activatePouchFever();
        }
      }
    }

    _activatePouchFever() {
      const s = this.state;
      const p = s.player;
      s.pouchCount = 0;
      s.feverTimer = FEVER_DURATION;
      s.hitstopTimer = 0.045;
      s.camera.trauma = 0.45;
      s.camera.zoom = 1.07;

      p.pouchJiggleVel = 24;
      p.squashX = 1.24;
      p.squashY = 0.8;
      p.pitch = -0.22;

      this.audio.setFever(true);
      this.audio.playFever();
      this._spawnRing(p.worldX + 10, p.h + 38, 24, "#ffb800");
      this._spawnFeathers(p.worldX, p.h + 40, 16);
      this._awardStunt(150, "GULP! SUNSET FEVER!", "#ffb800", true);
    }

    // ==================== PARTICLES & POPUPS ====================
    _allocParticle() {
      for (let i = 0; i < this.particlePool.length; i++) {
        if (!this.particlePool[i].active) return this.particlePool[i];
      }
      return this.particlePool[0];
    }

    _spawnFeathers(wx, h, count) {
      for (let i = 0; i < count; i++) {
        const pt = this._allocParticle();
        pt.active = true;
        pt.worldSpace = true;
        pt.kind = "feather";
        pt.x = wx + randRange(-14, 14);
        pt.h = h + randRange(-10, 12);
        pt.vx = randRange(-120, 90);
        pt.vh = randRange(30, 210);
        pt.gravity = 360;
        pt.size = randRange(5.5, 9);
        pt.rot = randRange(0, 6.28);
        pt.vrot = randRange(-7, 7);
        pt.color = i % 3 === 0 ? "#fde8c8" : "#fffdf7";
        pt.life = pt.maxLife = randRange(0.45, 0.85);
      }
    }

    _spawnDust(wx, h, count) {
      for (let i = 0; i < count; i++) {
        const pt = this._allocParticle();
        pt.active = true;
        pt.worldSpace = true;
        pt.kind = "circle";
        pt.x = wx + randRange(-12, 12);
        pt.h = h + randRange(0, 8);
        pt.vx = randRange(-130, -20);
        pt.vh = randRange(20, 95);
        pt.gravity = 160;
        pt.size = randRange(4, 8.5);
        pt.color = "rgba(254, 242, 214, 0.85)";
        pt.life = pt.maxLife = randRange(0.25, 0.45);
      }
    }

    _spawnSparks(wx, h, count, color) {
      for (let i = 0; i < count; i++) {
        const pt = this._allocParticle();
        pt.active = true;
        pt.worldSpace = true;
        pt.kind = "spark";
        pt.x = wx + randRange(-6, 6);
        pt.h = h + randRange(-4, 6);
        const ang = randRange(0.3, 2.8);
        const spd = randRange(90, 290);
        pt.vx = Math.cos(ang) * spd - 90;
        pt.vh = Math.sin(ang) * spd;
        pt.gravity = 680;
        pt.size = randRange(3, 5.5);
        pt.rot = Math.atan2(-pt.vh, pt.vx);
        pt.vrot = 0;
        pt.color = color;
        pt.life = pt.maxLife = randRange(0.22, 0.44);
      }
    }

    _spawnSplinters(wx, h, count) {
      for (let i = 0; i < count; i++) {
        const pt = this._allocParticle();
        pt.active = true;
        pt.worldSpace = true;
        pt.kind = "splinter";
        pt.x = wx + randRange(-16, 16);
        pt.h = h + randRange(6, 38);
        pt.vx = randRange(-180, 220);
        pt.vh = randRange(120, 380);
        pt.gravity = 980;
        pt.size = randRange(6, 11);
        pt.rot = randRange(0, 6.28);
        pt.vrot = randRange(-12, 12);
        pt.color = i % 2 === 0 ? "#d99b52" : "#a16227";
        pt.life = pt.maxLife = randRange(0.45, 0.75);
      }
    }

    _spawnWaterSplash(wx, h, count) {
      for (let i = 0; i < count; i++) {
        const pt = this._allocParticle();
        pt.active = true;
        pt.worldSpace = true;
        pt.kind = "circle";
        pt.x = wx + randRange(-22, 22);
        pt.h = h;
        pt.vx = randRange(-150, 150);
        pt.vh = randRange(180, 440);
        pt.gravity = 980;
        pt.size = randRange(4, 8);
        pt.color = i % 2 === 0 ? "#e0f2fe" : "#38bdf8";
        pt.life = pt.maxLife = randRange(0.35, 0.7);
      }
    }

    _spawnRing(wx, h, size, color) {
      const pt = this._allocParticle();
      pt.active = true;
      pt.worldSpace = true;
      pt.kind = "ring";
      pt.x = wx;
      pt.h = h;
      pt.vx = 0;
      pt.vh = 0;
      pt.gravity = 0;
      pt.size = size;
      pt.color = color;
      pt.life = pt.maxLife = 0.34;
    }

    _spawnPopup(wx, h, text, color, big) {
      let targetH = clamp(h, 52, 260);
      const sx = wx - this.state.worldScroll;

      // Cascade vertically if another popup is nearby so rapid stunts never overlap!
      for (let k = 0; k < this.popupPool.length; k++) {
        const other = this.popupPool[k];
        if (other.active && Math.abs(other.screenX - sx) < 160 && Math.abs(other.h - targetH) < 28) {
          targetH = Math.min(320, other.h + 28);
        }
      }

      for (let i = 0; i < this.popupPool.length; i++) {
        const pop = this.popupPool[i];
        if (!pop.active) {
          pop.active = true;
          pop.screenX = sx;
          pop.h = targetH;
          pop.text = text;
          pop.color = color;
          pop.big = !!big;
          pop.life = pop.maxLife = big ? 1.0 : 0.8;
          return;
        }
      }
    }

    // ==================== MAIN SIMULATION LOOP ====================
    _frame(now) {
      const rawDt = (now - this.lastFrameTime) / 1000;
      this.lastFrameTime = now;
      const dt = Math.min(Math.max(rawDt, 0.001), 0.05);

      if (this.state.mode === "menu") {
        this._updateMenuAttract(dt);
      } else if (this.state.mode === "playing") {
        this._updatePlaying(dt);
      } else if (this.state.mode === "gameover") {
        this._updateGameOver(dt);
      }

      this.renderer.render(this.state);
      requestAnimationFrame((t) => this._frame(t));
    }

    _updateMenuAttract(dt) {
      const s = this.state;
      const p = s.player;
      s.time += dt;

      p.screenX = clamp(Math.round(this.renderer.viewW * 0.22), 135, 250);
      p.worldX += p.speed * dt;
      s.worldScroll = p.worldX - p.screenX;
      s.distance = p.worldX / PIXELS_PER_METER;

      p.wheelAngle += (p.speed * dt) / 19;
      p.pedalAngle += (p.speed * dt) / 28;
      p.squashX += (1 - p.squashX) * Math.min(1, dt * 12);
      p.squashY += (1 - p.squashY) * Math.min(1, dt * 12);

      // Gentle attract hops for fish
      for (let i = 0; i < s.fish.length; i++) {
        const f = s.fish[i];
        if (!f.active) continue;
        if (f.x - p.worldX < 95 && f.x - p.worldX > 40 && p.h <= 1 && f.h > 55) {
          p.vy = 560;
        }
        if (Math.hypot(f.x - (p.worldX + 10), f.h - (p.h + 40)) < 44) {
          f.active = false;
          p.pouchJiggleVel += 8;
          this._spawnSparks(f.x, f.h, 5, "#7dd3fc");
        }
      }

      if (p.h > 0 || p.vy > 0) {
        p.h += p.vy * dt;
        p.vy -= 1700 * dt;
        if (p.h <= 0) {
          p.h = 0;
          p.vy = 0;
        }
      }

      // Respawn attract fish ahead
      const farthest = s.fish.length > 0 ? s.fish[s.fish.length - 1].x : p.worldX;
      if (farthest < p.worldX + 1400) {
        this._spawnFishArc(farthest + 340, 220, 20, 95, 6, false);
      }
      if (s.fish.length > 40) {
        s.fish = s.fish.filter((f) => f.x > s.worldScroll - 80);
      }

      this._updateSpringsAndParticles(dt);
    }

    _updatePlaying(dt) {
      const s = this.state;
      s.time += dt;

      if (s.tutorialTimer > 0) {
        s.tutorialTimer = Math.max(0, s.tutorialTimer - dt);
      }

      // Hitstop freeze frames for punchy crate smashes / bops!
      if (s.hitstopTimer > 0) {
        s.hitstopTimer -= dt;
        this._updateCamera(dt);
        this._updateParticlesOnly(dt * 0.35);
        return;
      }

      const p = s.player;
      const prevH = p.h;
      const prevWorldX = p.worldX;

      // Update input timers
      if (this.input.jumpBuffer > 0) {
        this.input.jumpBuffer = Math.max(0, this.input.jumpBuffer - dt);
        this._tryConsumeJump();
      }
      if (this.input.coyoteTime > 0) {
        this.input.coyoteTime = Math.max(0, this.input.coyoteTime - dt);
      }

      // Fever countdown
      if (s.feverTimer > 0) {
        s.feverTimer = Math.max(0, s.feverTimer - dt);
        if (s.feverTimer === 0) {
          this.audio.setFever(false);
        }
      }

      // Combo decay
      if (s.comboTimer > 0) {
        s.comboTimer = Math.max(0, s.comboTimer - dt);
        if (s.comboTimer === 0) {
          s.comboCount = 0;
          s.comboMult = 1;
        }
      }
      if (s.fishChainTimer > 0) {
        s.fishChainTimer = Math.max(0, s.fishChainTimer - dt);
      }

      // Speed progression (snappy right away, smooth ramp up to 760)
      const targetBaseSpeed = Math.min(760, 445 + s.distance * 0.42);
      p.speed += (targetBaseSpeed - p.speed) * Math.min(1, dt * 3);
      p.speedBoost = Math.max(0, p.speedBoost - 190 * dt);

      const feverSpeedMult = s.feverTimer > 0 ? 1.26 : 1.0;
      const effectiveSpeed = (p.speed + p.speedBoost) * feverSpeedMult;

      // Advance world position & distance score
      p.screenX = clamp(Math.round(this.renderer.viewW * 0.22), 135, 250);
      const dx = effectiveSpeed * dt;
      p.worldX += dx;
      s.worldScroll = p.worldX - p.screenX;

      const prevDist = s.distance;
      s.distance = p.worldX / PIXELS_PER_METER;
      s.score += (s.distance - prevDist) * 10 * s.comboMult * (s.feverTimer > 0 ? 2 : 1);

      // Spin cruiser wheels & pedals
      p.wheelAngle += dx / 19;
      p.pedalAngle += (p.grindingRail ? dx * 0.25 : dx) / 27;

      // Aero-Tuck blending & drift spark charge
      const wantTuck = this.input.holdingTuck && (p.h <= 4 || p.grindingRail !== null);
      const tuckTarget = wantTuck || p.isDiving ? 1 : 0;
      p.tuckBlend += (tuckTarget - p.tuckBlend) * Math.min(1, dt * 18);

      if (wantTuck) {
        p.tuckCharge = Math.min(1, p.tuckCharge + dt * 1.8);
        if (p.tuckCharge > 0.35 && Math.random() < 0.55) {
          this._spawnSparks(p.worldX - 28, p.h + 4, 1, "#38bdf8");
        }
      }

      // Check if currently over a pier water gap
      s.overGap = false;
      for (let i = 0; i < s.gaps.length; i++) {
        const g = s.gaps[i];
        if (p.worldX > g.x + 14 && p.worldX < g.x + g.w - 14) {
          s.overGap = true;
          break;
        }
      }

      // Vertical physics / Rail grinding
      if (p.grindingRail) {
        const rail = p.grindingRail;
        p.h = rail.h;
        p.vy = 0;
        p.pitch += (-0.11 - p.pitch) * Math.min(1, dt * 14);
        this.audio.setGrindActive(true, (effectiveSpeed - 440) / 400);

        if (Math.random() < 0.75) {
          this._spawnSparks(p.worldX - 18, p.h + 2, 2, "#fde047");
        }

        p.grindTickTimer += dt;
        if (p.grindTickTimer >= 0.14) {
          p.grindTickTimer = 0;
          s.score += 18 * s.comboMult;
          s.comboTimer = COMBO_MAX_TIME;
        }

        if (p.worldX > rail.x + rail.w) {
          // Rolled off end of rail
          p.grindingRail = null;
          this.audio.setGrindActive(false);
          this.input.coyoteTime = 0.11;
          p.vy = 110;
        }
      } else {
        this.audio.setGrindActive(false);

        const isGliding = this.input.holdingJump && p.vy < 0 && !p.isDiving;
        let gravity = p.vy > 0 ? (this.input.holdingJump ? 1480 : 2350) : 1960;
        if (p.isDiving) gravity = 3200;

        p.vy -= gravity * dt;
        if (isGliding) {
          p.vy = Math.max(p.vy, -135);
          p.wingOpen += (1 - p.wingOpen) * Math.min(1, dt * 14);
          p.wingFlapPhase += dt * 7;
        } else if (p.h > 4) {
          p.wingOpen += ((p.flapsUsed > 0 ? 0.65 : 0.2) - p.wingOpen) * Math.min(1, dt * 10);
          p.wingFlapPhase += dt * 16;
        } else {
          p.wingOpen += (0 - p.wingOpen) * Math.min(1, dt * 16);
        }

        p.h += p.vy * dt;

        // Ground touchdown (when NOT over a pier water gap)
        if (!s.overGap && p.h <= 0 && prevH >= -12) {
          const impactSpeed = Math.abs(p.vy);
          p.h = 0;
          p.vy = 0;
          p.flapsUsed = 0;
          p.flipAngle = 0;
          p.flipVel = 0;

          if (impactSpeed > 180) {
            const norm = clamp(impactSpeed / 850, 0.15, 1);
            p.squashX = 1 + norm * 0.24;
            p.squashY = 1 - norm * 0.22;
            p.neckSpringVel -= norm * 160;
            p.pouchJiggleVel += norm * 10;
            this.audio.playLand(norm);
            this._spawnDust(p.worldX - 18, 2, p.isDiving ? 11 : 5);

            if (p.isDiving) {
              s.camera.trauma = Math.max(s.camera.trauma, 0.24);
              p.speedBoost = Math.max(p.speedBoost, 95);
              this._spawnRing(p.worldX, 6, 14, "#fffaf0");
            }
          }
          p.isDiving = false;
          this._tryConsumeJump();
        } else if (prevH <= 1 && p.h <= 1 && s.overGap) {
          // Just rode off pier edge into gap -> grant Coyote Time!
          this.input.coyoteTime = 0.11;
        }

        // Pitch follows vertical velocity smoothly
        const targetPitch = s.feverTimer > 0 && p.h <= 2
          ? -0.14
          : clamp(-p.vy * 0.00034, -0.32, 0.34);
        p.pitch += (targetPitch - p.pitch) * Math.min(1, dt * 12);
      }

      // 360° Stunt Flip rotation
      if (p.flipVel !== 0) {
        p.flipAngle += p.flipVel * dt;
        if (Math.abs(p.flipAngle) >= Math.PI * 2) {
          p.flipAngle = 0;
          p.flipVel = 0;
        }
      }

      // Pier Gap Deep Water Check
      if (p.h < -34) {
        if (s.feverTimer > 0) {
          // Sunset Fever auto-wing rescue!
          p.h = 4;
          p.vy = 720;
          p.flapsUsed = 0;
          this.audio.playFlap();
          this._spawnWaterSplash(p.worldX, 0, 16);
          this._spawnPopup(p.worldX, 65, "FEVER WING SAVE!", "#38bdf8", true);
        } else {
          this._spawnWaterSplash(p.worldX, 0, 22);
          this._triggerGameOver("Splashed into the pier tide!");
          return;
        }
      }

      // Evaluate Entities (Rails, Ramps, Umbrellas, Crates, Gulls, Banners, Crabs)
      this._updateEntitiesAndCollisions(dt, prevWorldX, prevH);
      if (s.mode === "gameover") return;

      // Evaluate Fish Pickups & Fever Magnet
      this._updateFish(dt);

      // Spawn upcoming boardwalk chunks & prune passed objects
      while (s.nextChunkX < s.worldScroll + this.renderer.viewW + 650) {
        this._spawnNextChunk();
      }
      this._pruneOldWorldObjects();

      // Record ribbon trail point
      s.trail.push({ x: p.worldX - 18, h: p.h + 28 });
      const maxTrail = s.feverTimer > 0 ? 18 : 10;
      while (s.trail.length > maxTrail) s.trail.shift();

      this._updateSpringsAndParticles(dt);
      this._updateHUD(false);
    }

    _updateEntitiesAndCollisions(dt, prevWorldX, prevH) {
      const s = this.state;
      const p = s.player;
      const isFever = s.feverTimer > 0;

      const pLeft = p.worldX - 18;
      const pRight = p.worldX + 20;
      const pBottom = p.h + 4;
      const pTop = p.h + (p.tuckBlend > 0.55 ? 36 : 64);

      for (let i = 0; i < s.entities.length; i++) {
        const e = s.entities[i];
        if (!e.active) continue;

        if (e.bounceAnim > 0) {
          e.bounceAnim = Math.max(0, e.bounceAnim - dt * 3.5);
        }

        // Flying smashed hazard animation (from Fever Smash or Gull Bop!)
        if (e.smashed) {
          e.smashY += e.smashVy * dt;
          e.smashVy += 920 * dt;
          e.smashRot += 9 * dt;
          if (e.type !== "crate") {
            e.x += 180 * dt;
          }
          continue;
        }

        if (e.type === "gull") {
          e.x -= 68 * dt;
        }

        // 1. PIER GRIND RAIL
        if (e.type === "rail") {
          if (
            p.grindingRail !== e &&
            p.vy <= 45 &&
            p.worldX >= e.x - 10 &&
            p.worldX <= e.x + e.w - 8 &&
            prevH >= e.h - 14 &&
            p.h <= e.h + 12
          ) {
            p.grindingRail = e;
            p.grindTickTimer = 0;
            p.h = e.h;
            p.vy = 0;
            p.flapsUsed = 0;
            p.isDiving = false;
            p.flipAngle = 0;
            p.flipVel = 0;
            p.squashX = 1.14;
            p.squashY = 0.88;
            this.audio.playLand(0.4);
            this._spawnSparks(p.worldX, e.h, 10, "#fde047");
            this._awardStunt(55, "PIER GRIND!", "#fde047", false);
          }
          continue;
        }

        // 2. WOODEN LAUNCH RAMP
        if (e.type === "ramp") {
          if (p.worldX >= e.x && p.worldX <= e.x + e.w + 14 && p.h <= e.h + 14) {
            const t = clamp((p.worldX - e.x) / e.w, 0, 1);
            const rampH = t * e.h;
            if (p.h <= rampH + 8) {
              p.h = rampH;
              p.pitch = -0.32;
              if (prevWorldX <= e.x + e.w && p.worldX >= e.x + e.w - 6 && !e.passed) {
                e.passed = true;
                p.vy = Math.max(p.vy, 695);
                p.speedBoost = Math.max(p.speedBoost, 115);
                p.flapsUsed = 0;
                p.isDiving = false;
                p.flipVel = -(Math.PI * 2) / 0.62;
                this.audio.playJump();
                this.audio.playStuntChime();
                this._spawnFeathers(p.worldX, p.h + 30, 8);
                this._awardStunt(120, "360° RAMP FLIP!", "#ffb800", true);
              }
            }
          }
          continue;
        }

        // 3. STRIPED BEACH UMBRELLA (Purely helpful high-bounce springboard!)
        if (e.type === "umbrella") {
          if (
            p.vy <= 70 &&
            Math.abs(p.worldX - e.x) <= e.w * 0.54 &&
            p.h >= e.h - 24 &&
            p.h <= e.h + 18
          ) {
            const slam = p.isDiving;
            e.bounceAnim = 1;
            p.h = e.h + 10;
            p.vy = slam ? 815 : 705;
            p.flapsUsed = 0;
            p.isDiving = false;
            p.squashX = 0.8;
            p.squashY = 1.25;
            p.pouchJiggleVel += 14;
            s.camera.trauma = Math.max(s.camera.trauma, slam ? 0.32 : 0.18);

            this.audio.playBounce();
            this._spawnRing(e.x, e.h + 6, 18, "#38bdf8");
            this._spawnFeathers(p.worldX, p.h + 24, 9);
            this._awardStunt(
              slam ? 135 : 85,
              slam ? "SLAM BOUNCE! +135" : "UMBRELLA BOUNCE!",
              "#38bdf8",
              slam
            );
          }
          continue;
        }

        // 4. SMASHABLE WOODEN FISH CRATE
        if (e.type === "crate") {
          const cLeft = e.x - e.w * 0.5;
          const cRight = e.x + e.w * 0.5;
          const overlapsX = pRight > cLeft && pLeft < cRight;
          const overlapsY = pBottom < e.h && pTop > 0;

          if (overlapsX && overlapsY) {
            const landedOnTop = (p.vy <= 20 && prevH >= e.h - 18) || p.isDiving || isFever;
            if (landedOnTop) {
              e.smashed = true;
              e.active = false;
              s.hitstopTimer = 0.032;
              s.camera.trauma = Math.max(s.camera.trauma, 0.34);

              if (!isFever) {
                p.h = Math.max(p.h, e.h);
                p.vy = 575;
                p.flapsUsed = 0;
                p.isDiving = false;
              }
              p.squashX = 1.22;
              p.squashY = 0.8;
              this.audio.playCrateSmash();
              this._spawnSplinters(e.x, 10, 12);
              this._spawnRing(e.x, e.h * 0.6, 16, "#ffb800");

              // Spill 3 bonus golden fish ahead!
              for (let k = 0; k < 3; k++) {
                s.fish.push({
                  active: true,
                  x: e.x + 55 + k * 38,
                  h: 65 + k * 22,
                  gold: true,
                  rare: k === 2,
                  phase: k
                });
              }

              this._awardStunt(110, "CRATE SMASH!", "#ffb800", true);
            } else {
              this._triggerGameOver("Clipped a wooden bait crate — jump or Dive-Slam on top!");
              return;
            }
          }
          continue;
        }

        // 5. BANDIT SEAGULL
        if (e.type === "gull") {
          const gLeft = e.x - 20;
          const gRight = e.x + 20;
          const gBottom = e.h - 11;
          const gTop = e.h + 12;

          if (pRight > gLeft && pLeft < gRight) {
            // Check head-bop from above!
            if ((p.vy <= 50 && pBottom >= gBottom - 6 && pBottom <= gTop + 14) || (isFever && pTop > gBottom && pBottom < gTop)) {
              e.smashed = true;
              e.smashVy = -220;
              s.hitstopTimer = 0.035;
              s.camera.trauma = Math.max(s.camera.trauma, 0.28);

              if (!isFever) {
                p.vy = 635;
                p.flapsUsed = 0;
                p.isDiving = false;
              }
              this.audio.playGullBop();
              this._spawnFeathers(e.x, e.h, 12);
              this._spawnRing(e.x, e.h, 16, "#ff5e4d");
              this._awardStunt(130, "GULL BOP!", "#ff5e4d", true);
              continue;
            }

            // Direct beak collision
            if (pTop > gBottom && pBottom < gTop) {
              this._triggerGameOver("Bonked heads with a bandit seagull!");
              return;
            }

            // Close shave duck underneath!
            if (!e.passed && pTop <= gBottom && gBottom - pTop < 32) {
              e.passed = true;
              this._awardStunt(50, "DUCKED! +50", "#22c55e", false);
            }
          }
          continue;
        }

        // 6. OVERHEAD LOW-CLEARANCE PIER BANNER
        if (e.type === "banner") {
          const bLeft = e.x + 6;
          const bRight = e.x + e.w - 6;
          const beamBottom = e.clearance; // 50
          const beamTop = e.clearance + 52; // 102

          if (pRight > bLeft && pLeft < bRight) {
            if (pTop > beamBottom && pBottom < beamTop) {
              if (isFever) {
                e.smashed = true;
                e.active = false;
                s.camera.trauma = Math.max(s.camera.trauma, 0.3);
                this._spawnSplinters(e.x + e.w * 0.5, beamBottom, 12);
                this._awardStunt(100, "FEVER SMASH!", "#ffb800", false);
              } else {
                this._triggerGameOver("Bonked a low pier sign — hold Down / Left to Aero-Tuck!");
                return;
              }
            } else if (!e.passed && pTop <= beamBottom && p.worldX > e.x + e.w * 0.5) {
              e.passed = true;
              this.audio.playStuntChime();
              this._awardStunt(75, "LIMBO TUCK! +75", "#22c55e", false);
            }
          }
          continue;
        }

        // 7. SNAPPY KING CRAB
        if (e.type === "crab") {
          const cLeft = e.x - 15;
          const cRight = e.x + 15;
          if (pRight > cLeft && pLeft < cRight && pBottom < 26) {
            if (isFever) {
              e.smashed = true;
              e.smashVy = -380;
              s.camera.trauma = Math.max(s.camera.trauma, 0.25);
              this.audio.playBounce();
              this._spawnRing(e.x, 18, 15, "#ffb800");
              this._awardStunt(100, "CRAB LAUNCH!", "#ffb800", false);
            } else {
              this._triggerGameOver("Pinched by a snappy boardwalk crab!");
              return;
            }
          } else if (!e.passed && pLeft > cRight && p.h > 0 && p.h < 68) {
            e.passed = true;
            this._awardStunt(35, "CLOSE HOP!", "#fde047", false);
          }
        }
      }
    }

    _updateFish(dt) {
      const s = this.state;
      const p = s.player;
      const beakX = p.worldX + 14;
      const beakH = p.h + (p.tuckBlend > 0.5 ? 24 : 42);
      const magnet = s.feverTimer > 0;

      for (let i = 0; i < s.fish.length; i++) {
        const f = s.fish[i];
        if (!f.active) continue;

        const dx = beakX - f.x;
        const dh = beakH - f.h;
        const dist = Math.hypot(dx, dh);

        if (magnet && dist < 245) {
          const pull = Math.min(1, dt * 13);
          f.x += dx * pull;
          f.h += dh * pull;
        }

        if (dist < 46) {
          this._collectFish(f);
        }
      }
    }

    _pruneOldWorldObjects() {
      const s = this.state;
      const cutoff = s.worldScroll - 220;
      if (s.entities.length > 28) {
        s.entities = s.entities.filter((e) => e.active && e.x + (e.w || 60) > cutoff);
      }
      if (s.fish.length > 65) {
        s.fish = s.fish.filter((f) => f.active && f.x > cutoff);
      }
      if (s.gaps.length > 8) {
        s.gaps = s.gaps.filter((g) => g.x + g.w > cutoff);
      }
    }

    _updateGameOver(dt) {
      const s = this.state;
      s.time += dt;

      if (s.hitstopTimer > 0) {
        s.hitstopTimer -= dt;
        this._updateCamera(dt);
        return;
      }

      const p = s.player;
      if (p.h > 0 || p.vy > 0) {
        p.vy -= 1800 * dt;
        p.h += p.vy * dt;
        if (!s.overGap && p.h <= 0) {
          p.h = 0;
          p.vy = -p.vy * 0.28;
          if (Math.abs(p.vy) < 60) p.vy = 0;
        }
      }
      p.pitch += (0 - p.pitch) * Math.min(1, dt * 6);

      if (s.gameOverDelay > 0) {
        s.gameOverDelay = Math.max(0, s.gameOverDelay - dt);
        if (s.gameOverDelay === 0 && !s.gameOverCardShown) {
          s.gameOverCardShown = true;
          this.dom.gameoverOverlay.classList.remove("hidden");
        }
      }

      this._updateSpringsAndParticles(dt);
    }

    _updateSpringsAndParticles(dt) {
      const s = this.state;
      const p = s.player;

      // Squash & stretch recovery
      p.squashX += (1 - p.squashX) * Math.min(1, dt * 14);
      p.squashY += (1 - p.squashY) * Math.min(1, dt * 14);

      // Gular throat pouch fill & harmonic spring jiggle!
      const targetPouch = s.feverTimer > 0 ? 0.95 : s.pouchCount / POUCH_FEVER_TARGET;
      p.pouchFill += (targetPouch - p.pouchFill) * Math.min(1, dt * 10);

      const springForce = -170 * p.pouchJiggle - 11 * p.pouchJiggleVel;
      p.pouchJiggleVel += springForce * dt;
      p.pouchJiggle = clamp(p.pouchJiggle + p.pouchJiggleVel * dt, -0.5, 0.85);

      // Neck bob spring
      const neckForce = -150 * p.neckSpring - 12 * p.neckSpringVel;
      p.neckSpringVel += neckForce * dt;
      p.neckSpring = clamp(p.neckSpring + p.neckSpringVel * dt, -8, 8);

      this._updateCamera(dt);
      this._updateParticlesOnly(dt);
    }

    _updateCamera(dt) {
      const cam = this.state.camera;
      if (cam.trauma > 0) {
        cam.trauma = Math.max(0, cam.trauma - dt * 2.3);
        const mag = cam.trauma * cam.trauma * 18;
        cam.shakeX = (Math.random() * 2 - 1) * mag;
        cam.shakeY = (Math.random() * 2 - 1) * mag;
      } else {
        cam.shakeX = 0;
        cam.shakeY = 0;
      }

      const desiredZoom = this.state.feverTimer > 0 ? 1.035 : 1.0;
      cam.zoom += (desiredZoom - cam.zoom) * Math.min(1, dt * 6);
    }

    _updateParticlesOnly(dt) {
      for (let i = 0; i < this.particlePool.length; i++) {
        const pt = this.particlePool[i];
        if (!pt.active) continue;
        pt.life -= dt;
        if (pt.life <= 0) {
          pt.active = false;
          continue;
        }
        pt.x += pt.vx * dt;
        pt.h += pt.vh * dt;
        pt.vh -= pt.gravity * dt;
        pt.rot += pt.vrot * dt;
        if (pt.kind === "feather") {
          pt.vx *= 1 - Math.min(0.9, dt * 3.5);
          pt.vh = Math.max(pt.vh, -65); // Feathers flutter down gently!
        }
      }

      for (let i = 0; i < this.popupPool.length; i++) {
        const pop = this.popupPool[i];
        if (!pop.active) continue;
        pop.life -= dt;
        pop.h += 38 * dt;
        if (pop.life <= 0) pop.active = false;
      }
    }

    _updateHUD(force) {
      const s = this.state;
      const roundedScore = Math.round(s.score);
      const roundedDist = Math.round(s.distance);

      if (force || this._lastHudScore !== roundedScore) {
        this._lastHudScore = roundedScore;
        this.dom.hudScore.textContent = roundedScore.toLocaleString();
      }
      if (force || this._lastHudDist !== roundedDist) {
        this._lastHudDist = roundedDist;
        this.dom.hudDistance.textContent = roundedDist + " m";
      }

      const feverActive = s.feverTimer > 0;
      const dispMult = s.comboMult * (feverActive ? 2 : 1);
      if (force || this._lastDispMult !== dispMult) {
        this._lastDispMult = dispMult;
        this.dom.hudComboMult.textContent = "x" + dispMult;
        this.dom.hudComboPill.classList.toggle("active", dispMult > 1);
      }
      const comboPct = s.comboTimer > 0 ? (s.comboTimer / COMBO_MAX_TIME) * 100 : 0;
      this.dom.hudComboBar.style.width = comboPct.toFixed(1) + "%";

      this.dom.hudPouchPill.classList.toggle("fever", feverActive);
      if (feverActive) {
        this.dom.hudPouchLabel.textContent = "SUNSET FEVER!";
        this.dom.hudPouchCount.textContent = s.feverTimer.toFixed(1) + "s";
        this.dom.hudPouchBar.style.width = ((s.feverTimer / FEVER_DURATION) * 100).toFixed(1) + "%";
      } else {
        this.dom.hudPouchLabel.textContent = "Pouch Fever";
        this.dom.hudPouchCount.textContent = `${s.pouchCount} / ${POUCH_FEVER_TARGET}`;
        this.dom.hudPouchBar.style.width = ((s.pouchCount / POUCH_FEVER_TARGET) * 100).toFixed(1) + "%";
      }
    }
  }

  window.addEventListener("DOMContentLoaded", () => {
    window.pelicanGame = new PelicanGame();
  });
})();
