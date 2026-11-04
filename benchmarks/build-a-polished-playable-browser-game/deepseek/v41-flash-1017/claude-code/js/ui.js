'use strict';

(function () {
  /* roundRect fallback for older Safari */
  if (typeof CanvasRenderingContext2D !== 'undefined' && !CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
      const rr = Math.min(typeof r === 'number' ? r : 0, Math.abs(w) / 2, Math.abs(h) / 2);
      this.moveTo(x + rr, y);
      this.arcTo(x + w, y, x + w, y + h, rr);
      this.arcTo(x + w, y + h, x, y + h, rr);
      this.arcTo(x, y + h, x, y, rr);
      this.arcTo(x, y, x + w, y, rr);
      this.closePath();
      return this;
    };
  }

  const { game, player, view, hooks } = PG;

  const $ = (id) => document.getElementById(id);
  const el = {
    hud: $('hud'),
    score: $('score'),
    dist: $('dist'),
    best: $('best'),
    combo: $('combo'),
    comboX: $('combo-x'),
    menu: $('menu'),
    pause: $('pause'),
    over: $('over'),
    menuScores: $('menu-scores'),
    overScores: $('over-scores'),
    finalScore: $('final-score'),
    finalDist: $('final-dist'),
    finalBest: $('final-best'),
    record: $('record'),
    hint: $('hint'),
    rotate: $('rotate'),
    btnPlay: $('btn-play'),
    btnAgain: $('btn-again'),
    btnMenu: $('btn-menu'),
    btnResume: $('btn-resume'),
    btnRestartPause: $('btn-restart-pause'),
    btnQuit: $('btn-quit'),
    btnSound: $('btn-sound'),
    btnPause: $('btn-pause'),
  };

  const fmt = (n) => Math.floor(n).toLocaleString('en-US');

  let hudScore = -1;
  let hudDist = -1;
  let hudBest = -1;
  let lastMult = 1;
  let hintOn = false;
  let lastMode = null;
  let rafLast = performance.now();
  let acc = 0;

  /* --------------------------- overlays ---------------------------- */

  function toggle(el2, show) {
    el2.classList.toggle('hidden', !show);
  }

  function renderScores(listEl, highlightId) {
    const list = game.scores.slice(0, 5);
    if (!list.length) {
      listEl.innerHTML = '<li class="scores-empty">No rides yet — set the pace.</li>';
      return;
    }
    let html = '';
    list.forEach((s, i) => {
      const me = highlightId && s.id === highlightId ? ' me' : '';
      const date = new Date(s.date || Date.now());
      const ds = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      html +=
        '<li class="' + me.trim() + '">' +
        '<span class="rank">' + (i + 1) + '</span>' +
        '<span class="sc">' + fmt(s.score) + '</span>' +
        '<span class="ds">' + (s.dist || 0) + ' m</span>' +
        '<span class="dt">' + ds + '</span>' +
        '</li>';
    });
    listEl.innerHTML = html;
  }

  function syncSound() {
    el.btnSound.textContent = game.muted ? '✕' : '♪';
    el.btnSound.classList.toggle('off', game.muted);
    el.btnSound.setAttribute('aria-pressed', String(!game.muted));
  }

  function resetHudCache() {
    hudScore = -1;
    hudDist = -1;
    hudBest = -1;
    lastMult = 1;
  }

  function showMenu() {
    PG.quitToMenu();
    toggle(el.menu, true);
    toggle(el.pause, false);
    toggle(el.over, false);
    el.hud.classList.add('hidden');
    el.hint.classList.add('hidden');
    hintOn = false;
    renderScores(el.menuScores, null);
    resetHudCache();
    rafLast = performance.now();
    acc = 0;
  }

  function play() {
    PG.startGame();
    toggle(el.menu, false);
    toggle(el.pause, false);
    toggle(el.over, false);
    el.hud.classList.remove('hidden');
    el.hint.classList.remove('hidden');
    hintOn = true;
    resetHudCache();
    rafLast = performance.now();
    acc = 0;
  }

  function resume() {
    if (game.mode !== 'paused') return;
    PG.togglePause();
    toggle(el.pause, false);
    rafLast = performance.now();
    acc = 0;
  }

  function pauseGame() {
    if (game.mode !== 'playing') return;
    PG.togglePause();
    toggle(el.pause, true);
  }

  function pauseToggle() {
    if (game.mode === 'playing') pauseGame();
    else if (game.mode === 'paused') resume();
  }

  hooks.onGameOver = function () {
    el.finalScore.textContent = fmt(game.runScore);
    el.finalDist.textContent = game.runDist + ' m';
    el.finalBest.textContent = fmt(game.best);
    toggle(el.record, game.newBest);
    renderScores(el.overScores, game.lastScoreId);
    renderScores(el.menuScores, null);
    toggle(el.over, true);
    el.hint.classList.add('hidden');
    hintOn = false;
    hudBest = -1;
  };

  /* ---------------------------- buttons ---------------------------- */

  function bind(button, fn) {
    button.addEventListener('click', function (e) {
      e.preventDefault();
      button.blur();
      fn();
    });
  }

  bind(el.btnPlay, play);
  bind(el.btnAgain, play);
  bind(el.btnMenu, showMenu);
  bind(el.btnResume, resume);
  bind(el.btnRestartPause, play);
  bind(el.btnQuit, showMenu);

  el.btnPause.addEventListener('click', function (e) {
    e.preventDefault();
    el.btnPause.blur();
    pauseToggle();
  });

  el.btnSound.addEventListener('click', function (e) {
    e.preventDefault();
    el.btnSound.blur();
    PG.toggleMute();
    syncSound();
  });

  /* tapping the start panel backdrop starts the ride */
  el.menu.addEventListener('pointerdown', function (e) {
    if (e.target.closest('button, a, ol, .scores-block')) return;
    play();
  });

  /* ----------------------------- input ----------------------------- */

  const JUMP_KEYS = { Space: 1, ArrowUp: 1, KeyW: 1 };

  window.addEventListener('keydown', function (e) {
    if (JUMP_KEYS[e.code]) {
      e.preventDefault();
      if (e.repeat) return;

      if (game.mode === 'menu') play();
      else if (game.mode === 'over') play();
      else if (game.mode === 'paused') resume();
      else if (game.mode === 'playing') PG.pressJump();
      return;
    }

    if (e.code === 'KeyP' || e.code === 'Escape') {
      e.preventDefault();
      if (!e.repeat) pauseToggle();
      return;
    }

    if (e.code === 'Enter') {
      if (game.mode === 'menu' || game.mode === 'over') {
        e.preventDefault();
        play();
      }
      return;
    }

    if (e.code === 'KeyM') {
      PG.toggleMute();
      syncSound();
    }
  }, { passive: false });

  window.addEventListener('keyup', function (e) {
    if (JUMP_KEYS[e.code]) PG.releaseJump();
  });

  PG.canvas.addEventListener('pointerdown', function (e) {
    e.preventDefault();
    if (game.mode === 'playing') PG.pressJump();
  }, { passive: false });

  window.addEventListener('pointerup', function () {
    PG.releaseJump();
  });

  window.addEventListener('pointercancel', function () {
    PG.releaseJump();
  });

  PG.canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });

  /* --------------------------- lifecycle --------------------------- */

  document.addEventListener('visibilitychange', function () {
    if (document.hidden && game.mode === 'playing') pauseGame();
  });

  window.addEventListener('blur', function () {
    if (game.mode === 'playing') pauseGame();
  });

  let resizeTimer = 0;
  function onResize() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      PG.resize();
    }, 60);
  }

  window.addEventListener('resize', onResize);
  window.addEventListener('orientationchange', onResize);

  /* ----------------------------- loop ------------------------------ */

  function syncHud() {
    const s = Math.floor(game.score);
    if (s !== hudScore) {
      el.score.textContent = fmt(s);
      hudScore = s;
    }

    const d = Math.floor(game.dist / 50);
    if (d !== hudDist) {
      el.dist.textContent = d + ' m';
      hudDist = d;
    }

    if (game.best !== hudBest) {
      el.best.textContent = fmt(game.best);
      hudBest = game.best;
    }

    const showCombo = game.mode === 'playing' && game.mult > 1 && game.comboTimer > 0;
    el.combo.classList.toggle('show', showCombo);
    if (game.mult !== lastMult) {
      if (game.mult > 1) {
        el.comboX.textContent = 'x' + game.mult;
        el.combo.classList.remove('bump');
        void el.combo.offsetWidth;
        el.combo.classList.add('bump');
      }
      lastMult = game.mult;
    }

    const shouldHint = game.mode === 'playing' && game.hintTimer > 0;
    if (shouldHint !== hintOn) {
      hintOn = shouldHint;
      el.hint.classList.toggle('hidden', !shouldHint);
    }
  }

  function frame(now) {
    requestAnimationFrame(frame);

    let dt = (now - rafLast) / 1000;
    rafLast = now;
    if (!isFinite(dt) || dt < 0) dt = 0;
    dt = Math.min(dt, 0.05);

    if (game.timeScale < 1 && game.mode !== 'paused') {
      game.timeScale = Math.min(1, game.timeScale + dt * 1.6);
    }

    const scaled = game.mode === 'paused' ? 0 : dt * game.timeScale;
    acc += scaled;

    const step = 1 / 120;
    let guard = 0;
    while (acc >= step && guard < 6) {
      PG.update(step);
      acc -= step;
      guard += 1;
    }
    if (guard >= 6) acc = 0;

    PG.render(dt);
    syncHud();

    if (game.mode !== lastMode) {
      lastMode = game.mode;
      if (game.mode === 'playing' && !el.pause.classList.contains('hidden')) {
        toggle(el.pause, false);
      }
    }
  }

  /* ------------------------------ boot ----------------------------- */

  renderScores(el.menuScores, null);
  syncSound();

  const coarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
  if (coarse) {
    document.querySelectorAll('.key-hint').forEach(function (k) { k.textContent = 'TAP'; });
    el.hint.innerHTML = '<span>TAP TO FLAP</span>';
  }

  if (window.innerWidth < 700 && window.innerHeight > window.innerWidth) {
    el.rotate.classList.remove('hidden');
    setTimeout(function () {
      el.rotate.classList.add('hidden');
    }, 4200);
  }

  // keep the canvas crisp if the browser window is moved between screens
  if (window.matchMedia) {
    const mq = window.matchMedia('(resolution: 1dppx)');
    if (mq.addEventListener) mq.addEventListener('change', onResize);
  }

  requestAnimationFrame(function (t) {
    rafLast = t;
    requestAnimationFrame(frame);
  });
})();
