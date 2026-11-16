(function (global) {
  'use strict';

  const PelicanGame = (global.PelicanGame = global.PelicanGame || {});
  const CFG = PelicanGame.CONFIG;
  const Storage = PelicanGame.Storage;
  const Audio = PelicanGame.Audio;
  const Particles = PelicanGame.Particles;
  const World = PelicanGame.World;
  const PelicanRider = PelicanGame.PelicanRider;

  const STATE = {
    TITLE: 'TITLE',
    PLAYING: 'PLAYING',
    PAUSED: 'PAUSED',
    GAME_OVER: 'GAME_OVER'
  };

  if (global.CanvasRenderingContext2D && !global.CanvasRenderingContext2D.prototype.roundRect) {
    global.CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
      const rad = Math.min(r || 0, Math.abs(w) / 2, Math.abs(h) / 2);
      this.beginPath();
      this.moveTo(x + rad, y);
      this.lineTo(x + w - rad, y);
      this.quadraticCurveTo(x + w, y, x + w, y + rad);
      this.lineTo(x + w, y + h - rad);
      this.quadraticCurveTo(x + w, y + h, x + w - rad, y + h);
      this.lineTo(x + rad, y + h);
      this.quadraticCurveTo(x, y + h, x, y + h - rad);
      this.lineTo(x, y + rad);
      this.quadraticCurveTo(x, y, x + rad, y);
      this.closePath();
      return this;
    };
  }

  function rectsOverlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  class GameController {
    constructor() {
      this.canvas = document.getElementById('game-canvas');
      this.ctx = this.canvas.getContext('2d', { alpha: false });

      // Overlay & HUD elements
      this.hudEl = document.getElementById('hud');
      this.startEl = document.getElementById('start-screen');
      this.scoresEl = document.getElementById('highscores-screen');
      this.pauseEl = document.getElementById('pause-screen');
      this.gameOverEl = document.getElementById('gameover-screen');

      this.heartsRowEl = document.getElementById('hearts-row');
      this.feverWrapEl = document.querySelector('.fever-wrap');
      this.feverFillEl = document.getElementById('fever-fill');
      this.feverTextEl = document.getElementById('fever-text');
      this.scoreValueEl = document.getElementById('score-value');
      this.comboBadgeEl = document.getElementById('combo-badge');
      this.comboMultEl = document.getElementById('combo-mult');
      this.comboTimerFillEl = document.getElementById('combo-timer-fill');
      this.distanceValueEl = document.getElementById('distance-value');
      this.fishValueEl = document.getElementById('fish-value');
      this.bestValueEl = document.getElementById('best-value');
      this.liveHintEl = document.getElementById('live-hint');
      this.touchControlsEl = document.getElementById('touch-controls');

      this.scoresTbodyEl = document.getElementById('scores-tbody');
      this.goScoreEl = document.getElementById('go-score');
      this.goDistEl = document.getElementById('go-distance');
      this.goFishEl = document.getElementById('go-fish');
      this.goComboEl = document.getElementById('go-combo');
      this.goBadgeEl = document.getElementById('gameover-badge');
      this.goTitleEl = document.getElementById('gameover-title');
      this.newRecordBannerEl = document.getElementById('new-record-banner');
      this.newRecordTextEl = document.getElementById('new-record-text');
      this.nameEntryRowEl = document.getElementById('name-entry-row');
      this.riderNameInputEl = document.getElementById('rider-name-input');
      this.goLeaderboardEl = document.getElementById('go-leaderboard');

      this.pelican = new PelicanRider();
      this.state = STATE.TITLE;
      this.lastTime = 0;
      this.globalTime = 0;
      this.runTime = 0;

      // Camera & viewport
      this.cssWidth = 960;
      this.cssHeight = 540;
      this.dpr = 1;
      this.scale = 1;
      this.viewWorldWidth = 960;
      this.viewWorldHeight = 540;
      this.camY = 0;
      this.shakeTrauma = 0;
      this.hitstopTimer = 0;

      // Run metrics
      this.score = 0;
      this.distanceMeters = 0;
      this.fishCount = 0;
      this.comboCount = 0;
      this.comboMult = 1;
      this.bestCombo = 1;
      this.comboTimer = 0;
      this.feverValue = 0;
      this.feverTimer = 0;
      this.tricksLanded = 0;
      this.gameOverAge = 0;
      this.lastRecordedEntryId = null;

      // Input state
      this.keys = new Set();
      this.touchActions = new Map();
      this.canvasTouchJump = false;
      this.canvasJumpPointerId = null;
      this.input = { left: false, right: false, down: false, jumpHeld: false };

      // Settings & UI cache
      this.settings = Storage.loadSettings();
      Audio.initFromSettings(this.settings.muted);
      this.isTouchDevice = ('ontouchstart' in global) || (navigator.maxTouchPoints > 0);
      this.uiCache = {
        score: -1,
        dist: -1,
        fish: -1,
        hearts: -1,
        comboMult: -1,
        feverPct: -1,
        feverActive: null,
        best: -1
      };

      this._initHeartsDom();
      this._bindEvents();
      this._handleResize();
      this._syncMuteUI();
      this._syncTouchVisibility();
      this._refreshBestBadge();

      requestAnimationFrame((ts) => this._loop(ts));
    }

    _initHeartsDom() {
      this.heartsRowEl.innerHTML = '';
      for (let i = 0; i < CFG.MAX_HEARTS; i += 1) {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.setAttribute('class', 'heart-icon');
        svg.innerHTML = '<path fill="#ff5470" stroke="#fff" stroke-width="1.6" d="M12 20.4s-7.4-4.7-9.2-9.4C1.5 7.7 3.5 4.2 7 4.2c2 0 3.7 1.1 5 2.7 1.3-1.6 3-2.7 5-2.7 3.5 0 5.5 3.5 4.2 6.8-1.8 4.7-9.2 9.4-9.2 9.4z"/>';
        this.heartsRowEl.appendChild(svg);
      }
    }

    _bindEvents() {
      global.addEventListener('resize', () => this._handleResize());
      document.addEventListener('visibilitychange', () => {
        if (document.hidden && this.state === STATE.PLAYING) {
          this.pauseGame();
        }
      });

      // Keyboard input
      global.addEventListener('keydown', (e) => this._onKeyDown(e));
      global.addEventListener('keyup', (e) => this._onKeyUp(e));

      // Menu buttons
      document.getElementById('btn-start').addEventListener('click', () => {
        Audio.unlock();
        this.startNewRun();
      });
      document.getElementById('btn-open-scores').addEventListener('click', () => {
        Audio.unlock();
        this._openHighScores();
      });
      document.getElementById('btn-close-scores').addEventListener('click', () => {
        this.scoresEl.classList.add('hidden');
        this.startEl.classList.remove('hidden');
      });
      document.getElementById('btn-play-from-scores').addEventListener('click', () => {
        Audio.unlock();
        this.scoresEl.classList.add('hidden');
        this.startNewRun();
      });
      document.getElementById('btn-reset-scores').addEventListener('click', () => {
        Storage.resetScores();
        this._renderFullHighScores();
        this._refreshBestBadge();
      });

      document.getElementById('btn-pause').addEventListener('click', () => this.togglePause());
      document.getElementById('btn-resume').addEventListener('click', () => this.resumeGame());
      document.getElementById('btn-restart-pause').addEventListener('click', () => this.startNewRun());
      document.getElementById('btn-quit-title').addEventListener('click', () => this.returnToTitle());

      document.getElementById('btn-restart-gameover').addEventListener('click', () => this.startNewRun());
      document.getElementById('btn-title-gameover').addEventListener('click', () => this.returnToTitle());

      document.getElementById('btn-save-name').addEventListener('click', () => this._commitRiderName());
      this.riderNameInputEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this._commitRiderName();
          this.riderNameInputEl.blur();
        }
      });

      // Audio toggles
      document.getElementById('btn-mute-start').addEventListener('click', () => this.toggleMute());
      document.getElementById('btn-mute-hud').addEventListener('click', () => this.toggleMute());
      document.getElementById('btn-mute-pause').addEventListener('click', () => this.toggleMute());

      // Touch control toggle button
      document.getElementById('btn-touch-toggle').addEventListener('click', () => {
        const currentlyShown = !this.touchControlsEl.classList.contains('hidden');
        Storage.saveSettings({ touchMode: currentlyShown ? 'off' : 'on' });
        this.settings = Storage.loadSettings();
        this._syncTouchVisibility();
      });

      // Multi-touch pointer bindings on virtual buttons
      const touchBtns = this.touchControlsEl.querySelectorAll('.touch-btn');
      touchBtns.forEach((btn) => {
        const action = btn.getAttribute('data-action');
        btn.addEventListener('pointerdown', (e) => {
          e.preventDefault();
          e.stopPropagation();
          Audio.unlock();
          this.isTouchDevice = true;
          this.touchActions.set(e.pointerId, { action, btn });
          btn.classList.add('pressed');
          if (btn.setPointerCapture) {
            try { btn.setPointerCapture(e.pointerId); } catch (_err) {}
          }
          if (action === 'jump' && this.state === STATE.PLAYING) {
            this.pelican.queueJump();
          }
          this._recomputeInput();
        });

        const release = (e) => {
          const rec = this.touchActions.get(e.pointerId);
          if (rec) {
            rec.btn.classList.remove('pressed');
            this.touchActions.delete(e.pointerId);
            this._recomputeInput();
          }
        };
        btn.addEventListener('pointerup', release);
        btn.addEventListener('pointercancel', release);
        btn.addEventListener('lostpointercapture', release);
      });

      // Tap anywhere on open canvas during play for responsive Jump / Flap!
      this.canvas.addEventListener('pointerdown', (e) => {
        Audio.unlock();
        if (e.pointerType === 'touch') {
          this.isTouchDevice = true;
          this._syncTouchVisibility();
        }
        if (this.state === STATE.PLAYING) {
          this.canvasTouchJump = true;
          this.canvasJumpPointerId = e.pointerId;
          this.pelican.queueJump();
          this._recomputeInput();
        }
      });
      const releaseCanvasJump = (e) => {
        if (this.canvasTouchJump && (this.canvasJumpPointerId === null || e.pointerId === this.canvasJumpPointerId)) {
          this.canvasTouchJump = false;
          this.canvasJumpPointerId = null;
          this._recomputeInput();
        }
      };
      global.addEventListener('pointerup', releaseCanvasJump);
      global.addEventListener('pointercancel', releaseCanvasJump);
    }

    _onKeyDown(e) {
      Audio.unlock();

      // Let rider name field type normally
      if (document.activeElement === this.riderNameInputEl) {
        return;
      }

      const code = e.code;
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].indexOf(code) !== -1) {
        e.preventDefault();
      }

      if (code === 'KeyM' && !e.repeat) {
        this.toggleMute();
        return;
      }

      if (code === 'KeyP' || code === 'Escape') {
        if (!e.repeat && (this.state === STATE.PLAYING || this.state === STATE.PAUSED)) {
          this.togglePause();
        }
        return;
      }

      if (code === 'KeyR' && !e.repeat) {
        if (this.state === STATE.PLAYING || this.state === STATE.PAUSED || this.state === STATE.GAME_OVER) {
          this.startNewRun();
        }
        return;
      }

      if (this.state === STATE.TITLE) {
        if ((code === 'Space' || code === 'Enter') && !e.repeat) {
          if (!this.scoresEl.classList.contains('hidden')) {
            this.scoresEl.classList.add('hidden');
          }
          this.startNewRun();
        }
        return;
      }

      if (this.state === STATE.GAME_OVER) {
        if ((code === 'Space' || code === 'Enter') && !e.repeat && this.gameOverAge > 0.35) {
          this.startNewRun();
        }
        return;
      }

      if (this.state === STATE.PLAYING) {
        const wasJump = this._isJumpKey(code);
        this.keys.add(code);
        if (wasJump && !e.repeat) {
          this.pelican.queueJump();
        }
        this._recomputeInput();
      }
    }

    _onKeyUp(e) {
      this.keys.delete(e.code);
      this._recomputeInput();
    }

    _isJumpKey(code) {
      return code === 'Space' || code === 'ArrowUp' || code === 'KeyW';
    }

    _recomputeInput() {
      let left = this.keys.has('ArrowLeft') || this.keys.has('KeyA');
      let right = this.keys.has('ArrowRight') || this.keys.has('KeyD');
      let down = this.keys.has('ArrowDown') || this.keys.has('KeyS');
      let jumpHeld = this.canvasTouchJump || this.keys.has('Space') || this.keys.has('ArrowUp') || this.keys.has('KeyW');

      this.touchActions.forEach((rec) => {
        if (rec.action === 'left') left = true;
        if (rec.action === 'right') right = true;
        if (rec.action === 'down') down = true;
        if (rec.action === 'jump') jumpHeld = true;
      });

      this.input.left = left;
      this.input.right = right;
      this.input.down = down;
      this.input.jumpHeld = jumpHeld;
    }

    _handleResize() {
      this.cssWidth = Math.max(320, global.innerWidth);
      this.cssHeight = Math.max(320, global.innerHeight);
      this.dpr = Math.min(global.devicePixelRatio || 1, 2);

      this.canvas.width = Math.round(this.cssWidth * this.dpr);
      this.canvas.height = Math.round(this.cssHeight * this.dpr);

      this.scale = Math.min(
        this.cssHeight / CFG.VIRTUAL_BASE_HEIGHT,
        this.cssWidth / CFG.MIN_VIEW_WIDTH
      );
      this.viewWorldWidth = this.cssWidth / this.scale;
      this.viewWorldHeight = this.cssHeight / this.scale;
    }

    _syncTouchVisibility() {
      const mode = this.settings.touchMode || 'auto';
      const show = mode === 'on' || (mode === 'auto' && this.isTouchDevice);
      this.touchControlsEl.classList.toggle('hidden', !show);
    }

    toggleMute() {
      const nextMuted = !Audio.muted;
      Audio.setMuted(nextMuted);
      Storage.saveSettings({ muted: nextMuted });
      this.settings = Storage.loadSettings();
      if (!nextMuted) Audio.unlock();
      this._syncMuteUI();
    }

    _syncMuteUI() {
      const muted = Audio.muted;
      document.getElementById('mute-start-label').textContent = muted ? '🔇 Sound Off' : '🔊 Sound On';
      document.getElementById('btn-mute-pause').textContent = muted ? '🔇 Sound Off' : '🔊 Sound On';
      const onIcon = document.querySelector('#btn-mute-hud .icon-sound-on');
      const offIcon = document.querySelector('#btn-mute-hud .icon-sound-off');
      if (onIcon && offIcon) {
        onIcon.classList.toggle('hidden', muted);
        offIcon.classList.toggle('hidden', !muted);
      }
    }

    _refreshBestBadge() {
      const best = Storage.getBestScore();
      if (this.uiCache.best !== best) {
        this.uiCache.best = best;
        this.bestValueEl.textContent = best.toLocaleString();
      }
    }

    _clearInputs() {
      this.keys.clear();
      this.touchActions.forEach((rec) => {
        if (rec && rec.btn) rec.btn.classList.remove('pressed');
      });
      this.touchActions.clear();
      this.canvasTouchJump = false;
      this.canvasJumpPointerId = null;
      this._recomputeInput();
    }

    startNewRun() {
      this.state = STATE.PLAYING;
      this.runTime = 0;
      this.score = 0;
      this.distanceMeters = 0;
      this.fishCount = 0;
      this.comboCount = 0;
      this.comboMult = 1;
      this.bestCombo = 1;
      this.comboTimer = 0;
      this.feverValue = 0;
      this.feverTimer = 0;
      this.tricksLanded = 0;
      this.shakeTrauma = 0;
      this.hitstopTimer = 0;
      this.camY = 0;
      this.lastRecordedEntryId = null;

      this._clearInputs();

      World.reset();
      Particles.clear();
      this.pelican.reset();
      this.pelican.x = this._playerAnchorWorldX();

      // Hide overlays, show HUD
      this.startEl.classList.add('hidden');
      this.scoresEl.classList.add('hidden');
      this.pauseEl.classList.add('hidden');
      this.gameOverEl.classList.add('hidden');
      this.hudEl.classList.remove('hidden');

      this._syncTouchVisibility();
      this.liveHintEl.innerHTML = this.isTouchDevice
        ? '<span>Tap <strong>JUMP</strong> twice for <strong>WING-FLAP</strong> • Hold <strong>WHEELIE</strong> or <strong>DUCK</strong>!</span>'
        : '<span>Hold <strong>JUMP</strong> higher • Tap mid-air to <strong>WING-FLAP</strong> • <strong>↓</strong> to Dive/Duck!</span>';
      this.liveHintEl.classList.remove('hidden');
      this._refreshBestBadge();
      this._syncHud(true);

      Audio.playBell();
    }

    togglePause() {
      if (this.state === STATE.PLAYING) {
        this.pauseGame();
      } else if (this.state === STATE.PAUSED) {
        this.resumeGame();
      }
    }

    pauseGame() {
      if (this.state !== STATE.PLAYING) return;
      this.state = STATE.PAUSED;
      this._clearInputs();
      this.pauseEl.classList.remove('hidden');
    }

    resumeGame() {
      if (this.state !== STATE.PAUSED) return;
      this.state = STATE.PLAYING;
      this.pauseEl.classList.add('hidden');
      this.lastTime = performance.now();
    }

    returnToTitle() {
      this.state = STATE.TITLE;
      this._clearInputs();

      World.reset();
      Particles.clear();
      this.pelican.reset();

      this.hudEl.classList.add('hidden');
      this.pauseEl.classList.add('hidden');
      this.gameOverEl.classList.add('hidden');
      this.scoresEl.classList.add('hidden');
      this.startEl.classList.remove('hidden');
    }

    _openHighScores() {
      this._renderFullHighScores();
      this.startEl.classList.add('hidden');
      this.scoresEl.classList.remove('hidden');
    }

    _renderFullHighScores() {
      const list = Storage.loadScores();
      this.scoresTbodyEl.innerHTML = '';
      list.forEach((entry, idx) => {
        const tr = document.createElement('tr');
        if (idx < 3) tr.className = 'top-' + (idx + 1);
        const medal = idx === 0 ? '👑 1' : String(idx + 1);
        tr.innerHTML =
          '<td>' + medal + '</td>' +
          '<td>' + this._escapeHtml(entry.name) + '</td>' +
          '<td>' + entry.score.toLocaleString() + '</td>' +
          '<td>' + entry.distance + ' m</td>' +
          '<td>' + entry.fish + '</td>';
        this.scoresTbodyEl.appendChild(tr);
      });
    }

    _commitRiderName() {
      const clean = Storage.sanitizeName(this.riderNameInputEl.value);
      this.riderNameInputEl.value = clean;
      const updated = Storage.updateEntryName(this.lastRecordedEntryId, clean);
      this._renderGameOverLeaderboard(updated);
      this._refreshBestBadge();
    }

    _escapeHtml(str) {
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    }

    _playerAnchorWorldX() {
      return World.scrollX + this.viewWorldWidth * CFG.PLAYER_SCREEN_X_RATIO;
    }

    _addShake(amount) {
      this.shakeTrauma = Math.min(1, this.shakeTrauma + amount);
    }

    _awardPoints(basePoints, label, x, y, color, scale) {
      const feverBonus = this.feverTimer > 0 ? 2 : 0;
      const mult = Math.min(CFG.MAX_COMBO_MULT + 2, this.comboMult + feverBonus);
      const pts = Math.round(basePoints * mult);
      this.score += pts;

      if (label) {
        Particles.addPopup(x, y, label + ' +' + pts, color || '#fff4cf', scale || 1);
      } else {
        Particles.addPopup(x, y, '+' + pts, color || '#fff4cf', scale || 0.92);
      }
      return pts;
    }

    _bumpCombo(steps, feverGain) {
      this.comboCount += steps || 1;
      this.comboTimer = CFG.COMBO_DURATION;
      this.comboMult = Math.min(CFG.MAX_COMBO_MULT, 1 + Math.floor(this.comboCount / 3));
      if (this.comboMult > this.bestCombo) {
        this.bestCombo = this.comboMult;
      }

      if (this.feverTimer <= 0 && feverGain > 0) {
        this.feverValue = Math.min(CFG.FEVER_MAX, this.feverValue + feverGain);
        if (this.feverValue >= CFG.FEVER_MAX) {
          this._activateFever();
        }
      }
    }

    _activateFever() {
      this.feverTimer = CFG.FEVER_DURATION;
      this.feverValue = CFG.FEVER_MAX;
      this._addShake(0.45);
      Particles.emitConfetti(this.pelican.x, this.pelican.y - 55, 24);
      Particles.emitRing(this.pelican.x, this.pelican.y - 45, '#ffd166', 110);
      Particles.addPopup(this.pelican.x, this.pelican.y - 105, 'PELICAN FEVER!', '#ffd166', 1.25);
      Audio.playBell();
    }

    _damagePelican(reasonLabel) {
      if (this.pelican.invulnTimer > 0 || this.feverTimer > 0) return;

      this.pelican.hearts -= 1;
      this.pelican.invulnTimer = CFG.INVULN_DURATION;
      this.pelican.triggerSquawk();
      this.comboCount = 0;
      this.comboMult = 1;
      this.comboTimer = 0;

      this._addShake(0.7);
      this.hitstopTimer = 0.055;
      Particles.emitFeathers(this.pelican.x, this.pelican.y - 50, 12, 1.3);
      Particles.addPopup(this.pelican.x, this.pelican.y - 95, reasonLabel || 'OUCH!', '#ff6b4a', 1.15);
      Audio.playHit();

      if (this.pelican.hearts <= 0) {
        this._triggerGameOver(false);
      }
    }

    _triggerGameOver(fellInSea) {
      this.state = STATE.GAME_OVER;
      this.pelican.dead = true;
      this.gameOverAge = 0;
      this._clearInputs();

      const finalScore = Math.round(this.score);
      const finalDist = Math.round(this.distanceMeters);
      const result = Storage.recordRun({
        name: this.settings.riderName || 'PELI',
        score: finalScore,
        distance: finalDist,
        fish: this.fishCount
      });
      this.lastRecordedEntryId = result.entryId;

      this.hudEl.classList.add('hidden');
      this.gameOverEl.classList.remove('hidden');

      this.goBadgeEl.textContent = fellInSea ? 'SPLASHED INTO THE BAY!' : 'WIPEOUT AT THE PIER!';
      this.goTitleEl.textContent = result.isNewTop ? 'Boardwalk Legend!' : 'What a Ride!';
      this.goScoreEl.textContent = finalScore.toLocaleString();
      this.goDistEl.textContent = finalDist + ' m';
      this.goFishEl.textContent = String(this.fishCount);
      this.goComboEl.textContent = 'x' + this.bestCombo;

      if (result.madeBoard) {
        this.newRecordBannerEl.classList.remove('hidden');
        this.newRecordTextEl.textContent = result.isNewTop
          ? 'NEW #1 HIGH SCORE!'
          : 'RANK #' + result.rank + ' ON BOARDWALK!';
        this.nameEntryRowEl.classList.remove('hidden');
        this.riderNameInputEl.value = this.settings.riderName || 'PELI';
      } else {
        this.newRecordBannerEl.classList.add('hidden');
        this.nameEntryRowEl.classList.add('hidden');
      }

      this._renderGameOverLeaderboard(result.scores);
      this._refreshBestBadge();
      Audio.playGameOver(result.isNewTop);
    }

    _renderGameOverLeaderboard(list) {
      this.goLeaderboardEl.innerHTML = '';
      const top = list.slice(0, 5);
      top.forEach((entry, idx) => {
        const li = document.createElement('li');
        li.className = 'mini-lb-item' + (entry.id === this.lastRecordedEntryId ? ' is-current' : '');
        li.innerHTML =
          '<span class="lb-rank">#' + (idx + 1) + '</span>' +
          '<span class="lb-name">' + this._escapeHtml(entry.name) + '</span>' +
          '<span class="lb-dist">' + entry.distance + 'm</span>' +
          '<span class="lb-score">' + entry.score.toLocaleString() + '</span>';
        this.goLeaderboardEl.appendChild(li);
      });
    }

    _loop(timestamp) {
      if (!this.lastTime) this.lastTime = timestamp;
      let dt = (timestamp - this.lastTime) / 1000;
      this.lastTime = timestamp;
      dt = Math.min(dt, 0.05); // clamp delta for smooth tab-return safety

      this.globalTime += dt;

      if (this.state === STATE.TITLE) {
        this._updateTitleIdle(dt);
      } else if (this.state === STATE.PLAYING) {
        this._updatePlaying(dt);
      } else if (this.state === STATE.GAME_OVER) {
        this.gameOverAge += dt;
        Particles.update(dt, 0);
      }

      this._render();
      requestAnimationFrame((ts) => this._loop(ts));
    }

    _updateTitleIdle(dt) {
      const idleSpeed = 190;
      const dx = idleSpeed * dt;
      World.scrollX += dx;
      this.pelican.x = this._playerAnchorWorldX();
      this.pelican.y = CFG.GROUND_Y;
      this.pelican.wheelRot += dx / 16;
      this.pelican.pedalPhase += (dx / 16) * 0.72;
      for (let i = 1; i < this.pelican.scarf.length; i += 1) {
        const prev = this.pelican.scarf[i - 1];
        const seg = this.pelican.scarf[i];
        seg.x = prev.x - 8.5;
        seg.y = prev.y + Math.sin(this.globalTime * 12 - i * 1.1) * 2.5;
      }
      for (let i = 0; i < World.clouds.length; i += 1) {
        const c = World.clouds[i];
        c.x -= c.speed * dt;
        if (c.x < -180) c.x = this.viewWorldWidth + 160;
      }
    }

    _updatePlaying(dt) {
      if (this.hitstopTimer > 0) {
        this.hitstopTimer = Math.max(0, this.hitstopTimer - dt);
        this.shakeTrauma = Math.max(0, this.shakeTrauma - dt * 1.4);
        return;
      }

      this.runTime += dt;
      if (this.runTime > 6.5 && !this.liveHintEl.classList.contains('hidden')) {
        this.liveHintEl.classList.add('hidden');
      }

      if (this.shakeTrauma > 0) {
        this.shakeTrauma = Math.max(0, this.shakeTrauma - dt * 2.6);
      }

      // Fever countdown
      const feverActive = this.feverTimer > 0;
      if (feverActive) {
        this.feverTimer = Math.max(0, this.feverTimer - dt);
        this.feverValue = (this.feverTimer / CFG.FEVER_DURATION) * CFG.FEVER_MAX;
        if (Math.random() < dt * 28) {
          Particles.emitSparks(this.pelican.x - 18, this.pelican.y - 36, 1, '#ffd166');
        }
      }

      // Combo countdown
      if (this.comboTimer > 0) {
        this.comboTimer -= dt;
        if (this.comboTimer <= 0) {
          this.comboTimer = 0;
          this.comboCount = 0;
          this.comboMult = 1;
        }
      }

      // Track previous X for distance score
      const prevX = this.pelican.x;

      this.pelican.update(
        dt,
        this.runTime,
        this.input,
        World,
        Particles,
        Audio,
        feverActive,
        {
          onRampLaunch: (rx, ry) => {
            this._awardPoints(60, 'LAUNCH', rx, ry, '#a8f2ff', 0.95);
            this._bumpCombo(1, 5);
          },
          onAirFlip: (isBack, count, fx, fy) => {
            const label = (count > 1 ? count + 'x ' : '') + (isBack ? 'BACKFLIP' : 'FRONTFLIP');
            Particles.addPopup(fx, fy, label + '!', '#ffd166', 1.12);
          },
          onFlipsLanded: (flips, lx, ly) => {
            this.tricksLanded += flips;
            this._bumpCombo(flips * 2, flips * 16);
            this._awardPoints(flips * 220, 'FLIP LANDED', lx, ly, '#ffd166', 1.18);
            this._addShake(0.28);
            Particles.emitConfetti(this.pelican.x, this.pelican.y - 30, 14);
          },
          onDiveLand: () => {
            this._addShake(0.24);
          },
          onBadLanding: () => {
            this._damagePelican('WIPED OUT!');
          },
          onWheelieTick: (wx, wy) => {
            this._bumpCombo(1, 3);
            this._awardPoints(35, 'WHEELIE', wx, wy, '#ffb703', 0.9);
          }
        }
      );

      const dx = this.pelican.x - prevX;
      this.distanceMeters += dx / CFG.PIXELS_PER_METER;
      this.score += (dx / CFG.PIXELS_PER_METER) * 4;

      // Keep pelican anchored comfortably on screen while scrolling world
      const targetScroll = this.pelican.x - this.viewWorldWidth * CFG.PLAYER_SCREEN_X_RATIO;
      const worldDx = Math.max(0, targetScroll - World.scrollX);
      World.update(dt, worldDx, this.viewWorldWidth, CFG.MAX_HEARTS - this.pelican.hearts);

      // Speed lines during sprint, boost pad, or Fever
      if (feverActive || this.pelican.boostPadTimer > 0 || (this.input.right && this.pelican.onGround)) {
        if (Math.random() < dt * (feverActive ? 32 : 18)) {
          Particles.emitSpeedLine(this.viewWorldWidth, this.viewWorldHeight);
        }
      }

      // Collectibles check + beak snap anticipation
      this._checkCollectibles();

      // Entities collision check (pads, umbrellas, surfboards, crabs, crates, gulls)
      this._checkEntities();

      // Ocean fall check
      if (this.pelican.y > CFG.GROUND_Y + 102) {
        Particles.emitSplash(this.pelican.x, CFG.GROUND_Y + 55, 22);
        Audio.playSplash();
        this._addShake(0.65);

        this.pelican.hearts -= 1;
        this.comboCount = 0;
        this.comboMult = 1;
        this.comboTimer = 0;

        if (this.pelican.hearts <= 0) {
          this._triggerGameOver(true);
        } else {
          // Rescue onto pier ahead of gap!
          let safeX = this.pelican.x + 80;
          for (let tries = 0; tries < 6; tries += 1) {
            if (World.getSurfaceAt(safeX).solid) break;
            safeX += 48;
          }
          this.pelican.x = safeX;
          World.scrollX = safeX - this.viewWorldWidth * CFG.PLAYER_SCREEN_X_RATIO;
          this.pelican.y = CFG.GROUND_Y - 120;
          this.pelican.vy = -440;
          this.pelican.angle = 0;
          this.pelican.diving = false;
          this.pelican.flapAvailable = true;
          this.pelican.invulnTimer = 1.9;
          Particles.addPopup(this.pelican.x, this.pelican.y - 40, 'SPLASH RESCUE!', '#a8f2ff', 1.15);
        }
      }

      // Smooth camera vertical follow when flying high
      const targetCamY = Math.min(0, this.pelican.y - (CFG.GROUND_Y - 110)) * 0.48;
      this.camY += (targetCamY - this.camY) * Math.min(1, dt * 6);

      Particles.update(dt, worldDx);
      this._syncHud(false);
    }

    _checkCollectibles() {
      const scoop = this.pelican.getScoopCenter();
      const feverActive = this.feverTimer > 0;
      const scoopRadius = feverActive ? 54 : 42;

      for (let i = 0; i < World.collectibles.length; i += 1) {
        const c = World.collectibles[i];
        if (c.collected) continue;

        const dx = c.x - scoop.x;
        const dy = c.y - scoop.y;
        const distSq = dx * dx + dy * dy;

        // Open beak wide when fish is right ahead!
        if (dx > -10 && dx < 135 && Math.abs(dy) < 75) {
          this.pelican.triggerBeakOpen();
        }

        const hitR = scoopRadius + c.r;
        if (distSq <= hitR * hitR) {
          c.collected = true;
          if (c.type === 'heart') {
            this.pelican.hearts = Math.min(CFG.MAX_HEARTS, this.pelican.hearts + 1);
            Particles.emitConfetti(c.x, c.y, 12);
            Particles.addPopup(c.x, c.y - 20, '+1 HEART!', '#ff758f', 1.1);
            Audio.playHeart();
          } else {
            const isGold = c.type === 'snapper';
            this.fishCount += 1;
            this.pelican.triggerGulp();
            this._bumpCombo(1, isGold ? 16 : 7);
            this._awardPoints(isGold ? 110 : 40, null, c.x, c.y - 16, isGold ? '#ffd166' : '#a8f2ff', isGold ? 1.1 : 0.92);
            Particles.emitSplash(c.x, c.y, isGold ? 9 : 5, isGold ? '#ffd166' : '#c2f5ff');
            Audio.playFish(this.comboCount, isGold);
          }
        }
      }
    }

    _checkEntities() {
      const box = this.pelican.getHurtbox();
      const feverActive = this.feverTimer > 0;

      for (let i = 0; i < World.entities.length; i += 1) {
        const e = World.entities[i];
        if (e.smashed) continue;

        // Check near-miss / gull swoop-dodge reward once behind player
        if ((e.type === 'crab' || e.type === 'crate' || e.type === 'gull') && !e.nearMissAwarded) {
          if (e.x + e.w < box.x - 4) {
            e.nearMissAwarded = true;
            const verticalGap = Math.min(
              Math.abs((box.y + box.h) - e.y),
              Math.abs(box.y - (e.y + e.h))
            );
            if (e.type === 'gull' && this.pelican.ducking && verticalGap < 54) {
              this._bumpCombo(1, 10);
              this._awardPoints(150, 'SWOOP DODGE', this.pelican.x, this.pelican.y - 82, '#2ec4b6', 1.05);
              Audio.playTrick();
            } else if (verticalGap < 46) {
              this._bumpCombo(1, 8);
              this._awardPoints(120, 'CLOSE CALL', this.pelican.x, this.pelican.y - 82, '#ffe08a', 1.0);
            }
          }
        }

        if (e.type === 'boost_pad') {
          if (!e.triggered && rectsOverlap(box, { x: e.x, y: e.y - 14, w: e.w, h: e.h + 18 })) {
            e.triggered = true;
            this.pelican.boostPadTimer = CFG.BOOST_PAD_DURATION;
            this._bumpCombo(1, 8);
            this._awardPoints(100, 'TURBO', e.x + e.w * 0.5, e.y - 36, '#2ec4b6', 1.05);
            Particles.emitSparks(this.pelican.x - 20, this.pelican.y - 6, 12, '#2ec4b6');
            Audio.playBoost();
          }
          continue;
        }

        if (e.type === 'umbrella') {
          const padBox = { x: e.x + 4, y: e.y - 6, w: e.w - 8, h: e.h * 0.65 };
          if (rectsOverlap(box, padBox) && this.pelican.vy >= -80) {
            const isSuper = this.pelican.diving;
            const vy = isSuper ? CFG.UMBRELLA_SUPER_BOUNCE_VY : CFG.UMBRELLA_BOUNCE_VY;
            this.pelican.y = e.y - 4;
            this.pelican.bounce(vy, true, Particles);
            e.squash = 1;
            e.nearMissAwarded = true;
            this._bumpCombo(1, 12);
            this._awardPoints(isSuper ? 240 : 140, isSuper ? 'SUPER BOING' : 'BOING', e.x + e.w * 0.5, e.y - 26, '#ff9f1c', 1.1);
            Particles.emitConfetti(e.x + e.w * 0.5, e.y, 12);
            Particles.emitRing(e.x + e.w * 0.5, e.y + 8, '#ffd166', 70);
            this._addShake(isSuper ? 0.36 : 0.2);
            Audio.playBounce(isSuper);
          }
          continue;
        }

        if (e.type === 'surfboard') {
          const surfBox = { x: e.x + 2, y: e.y - 8, w: e.w - 4, h: e.h + 8 };
          if (rectsOverlap(box, surfBox) && this.pelican.vy >= 0) {
            this.pelican.y = e.y - 2;
            this.pelican.bounce(-650, true, Particles);
            e.squash = 1;
            this._bumpCombo(1, 12);
            this._awardPoints(180, 'WAVE BOUNCE', e.x + e.w * 0.5, e.y - 28, '#a8f2ff', 1.1);
            Particles.emitSplash(e.x + e.w * 0.5, e.y + 8, 14);
            Audio.playBounce(false);
          }
          continue;
        }

        // Forgiving 72% hitbox for hazards
        const shrinkX = e.w * 0.16;
        const shrinkY = e.h * 0.14;
        const hazBox = {
          x: e.x + shrinkX,
          y: e.y + shrinkY,
          w: e.w - shrinkX * 2,
          h: e.h - shrinkY * 2
        };

        if (!rectsOverlap(box, hazBox)) continue;

        // Fever Smash!
        if (feverActive) {
          this._smashEntity(e, 'FEVER SMASH', 200);
          continue;
        }

        // Dive-Slam crate smash!
        if (e.type === 'crate' && (this.pelican.diving || (this.pelican.vy > 140 && box.y + box.h <= e.y + e.h * 0.62))) {
          this.pelican.bounce(CFG.CRATE_SMASH_BOUNCE_VY, true, Particles);
          this._smashEntity(e, 'CRATE SMASH', 200);
          continue;
        }

        // Seagull bounce from above!
        if (e.type === 'gull' && this.pelican.vy > 30 && box.y + box.h <= e.y + e.h * 0.65) {
          this.pelican.bounce(CFG.GULL_BOUNCE_VY, true, Particles);
          this._smashEntity(e, 'GULL BOUNCE', 300);
          Audio.playBounce(true);
          continue;
        }

        // Otherwise take a hit
        e.nearMissAwarded = true;
        this._damagePelican(e.type === 'crab' ? 'PINCHED!' : e.type === 'gull' ? 'BONK!' : 'CRASH!');
      }
    }

    _smashEntity(e, label, basePoints) {
      e.smashed = true;
      e.nearMissAwarded = true;
      e.vx = 280 + Math.random() * 140;
      e.vy = -520 - Math.random() * 160;
      e.vrot = (Math.random() > 0.5 ? 1 : -1) * 11;

      this._bumpCombo(1, 10);
      this._awardPoints(basePoints, label, e.x + e.w * 0.5, e.y - 20, '#ffd166', 1.15);
      this._addShake(0.4);
      this.hitstopTimer = 0.04;

      if (e.type === 'crate') {
        Particles.emitSplinters(e.x + e.w * 0.5, e.y + e.h * 0.5, 12);
      } else {
        Particles.emitFeathers(e.x + e.w * 0.5, e.y + e.h * 0.5, 8, 1.1);
      }
      Particles.emitRing(e.x + e.w * 0.5, e.y + e.h * 0.5, '#ff9f1c', 64);
      Audio.playSmash();
    }

    _syncHud(force) {
      const scoreInt = Math.floor(this.score);
      if (force || this.uiCache.score !== scoreInt) {
        this.uiCache.score = scoreInt;
        this.scoreValueEl.textContent = scoreInt.toLocaleString();
      }

      const distInt = Math.floor(this.distanceMeters);
      if (force || this.uiCache.dist !== distInt) {
        this.uiCache.dist = distInt;
        this.distanceValueEl.textContent = distInt + ' m';
      }

      if (force || this.uiCache.fish !== this.fishCount) {
        this.uiCache.fish = this.fishCount;
        this.fishValueEl.textContent = '🐟 ' + this.fishCount;
      }

      if (force || this.uiCache.hearts !== this.pelican.hearts) {
        this.uiCache.hearts = this.pelican.hearts;
        const icons = this.heartsRowEl.children;
        for (let i = 0; i < icons.length; i += 1) {
          icons[i].classList.toggle('lost', i >= this.pelican.hearts);
        }
      }

      const feverActive = this.feverTimer > 0;
      const feverPct = Math.round((this.feverValue / CFG.FEVER_MAX) * 100);
      if (force || this.uiCache.feverPct !== feverPct || this.uiCache.feverActive !== feverActive) {
        this.uiCache.feverPct = feverPct;
        this.uiCache.feverActive = feverActive;
        this.feverFillEl.style.width = feverPct + '%';
        this.feverWrapEl.classList.toggle('active', feverActive);
        this.feverTextEl.textContent = feverActive ? 'FEVER x2!' : 'FEVER';
      }

      const effMult = this.comboMult + (feverActive ? 2 : 0);
      const showCombo = effMult > 1 || this.comboTimer > 0;
      this.comboBadgeEl.classList.toggle('hidden', !showCombo);
      if (showCombo) {
        if (force || this.uiCache.comboMult !== effMult) {
          this.uiCache.comboMult = effMult;
          this.comboMultEl.textContent = 'x' + effMult;
        }
        const pct = this.comboTimer > 0 ? Math.max(0, Math.min(1, this.comboTimer / CFG.COMBO_DURATION)) : 1;
        this.comboTimerFillEl.style.transform = 'scaleX(' + pct.toFixed(2) + ')';
      }
    }

    _render() {
      const ctx = this.ctx;
      const theme = World.getTheme(this.distanceMeters);

      // Compute responsive ground vertical placement (keeps boardwalk clear of mobile touch buttons)
      const isTallPortrait = this.viewWorldHeight > 660;
      const groundTargetScreenY = isTallPortrait
        ? this.viewWorldHeight * 0.62
        : this.viewWorldHeight * 0.75;
      const baseCamY = CFG.GROUND_Y - groundTargetScreenY;
      const totalCamY = baseCamY + this.camY;

      // Trauma-based screen shake
      let shakeX = 0;
      let shakeY = 0;
      if (this.shakeTrauma > 0.005) {
        const mag = this.shakeTrauma * this.shakeTrauma * 14;
        shakeX = (Math.random() * 2 - 1) * mag;
        shakeY = (Math.random() * 2 - 1) * mag;
      }

      ctx.save();
      ctx.scale(this.dpr * this.scale, this.dpr * this.scale);
      ctx.translate(shakeX, shakeY);

      // 1) Parallax Sky, Sun, Clouds, Ocean, Sailboats
      World.drawBackdrop(ctx, this.viewWorldWidth, this.viewWorldHeight, totalCamY, theme, this.globalTime);

      // 2) World-space Boardwalk, Ramps, Collectibles, Obstacles, Particles, Pelican
      ctx.save();
      ctx.translate(-World.scrollX, -totalCamY);

      World.drawBoardwalk(ctx, World.scrollX, this.viewWorldWidth, theme, this.globalTime);
      this.pelican.draw(ctx, this.globalTime, this.feverTimer > 0, theme.lanternGlow);
      Particles.drawWorld(ctx);

      ctx.restore();

      // 3) Screen-space gull warning indicators & speed streaks
      if (this.state === STATE.PLAYING) {
        World.drawGullWarnings(ctx, World.scrollX, this.viewWorldWidth, totalCamY);
        Particles.drawScreenOverlay(ctx);
      }

      ctx.restore();
    }
  }

  PelicanGame.App = new GameController();
})(window);
