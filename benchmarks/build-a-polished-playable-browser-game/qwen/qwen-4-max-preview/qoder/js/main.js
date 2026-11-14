/* PELICAN PEDAL — boot, fixed-step loop, input, HUD and screens */
(function (global) {
  'use strict';
  var P = global.PP, AU = global.PPAudio, C = P.C;
  var $ = function (id) { return document.getElementById(id); };

  var canvas = $('stage');
  var game = new global.PPGame(canvas);
  global.__pelican = game;

  var el = {
    hud: $('hud'), score: $('score'), dist: $('dist'), hudBest: $('hudBest'),
    combo: $('combo'), mult: $('mult'), comboFill: $('comboFill'), lives: $('lives'),
    boost: $('btnBoost'), boostFill: $('boostFill'), speedFill: $('speedFill'), speedTxt: $('speedTxt'),
    toast: $('toast'), touch: $('touch'), padJump: $('padJump'), padDuck: $('padDuck'),
    btnSound: $('btnSound'), btnPause: $('btnPause'), chkSound: $('chkSound'),
    menu: $('menu'), pause: $('pause'), over: $('over'), scores: $('scores'),
    menuScores: $('menuScores'), overScores: $('overScores'), fullScores: $('fullScores'),
    pScore: $('pScore'), pDist: $('pDist'), pMult: $('pMult'),
    oScore: $('oScore'), oDist: $('oDist'), oFish: $('oFish'), oMult: $('oMult'), oAir: $('oAir'),
    overTitle: $('overTitle'), ribbon: $('recordRibbon'), nameRow: $('nameRow'),
    nameInput: $('nameInput'), savedNote: $('savedNote')
  };

  var screens = { menu: el.menu, pause: el.pause, over: el.over, scores: el.scores };
  var current = 'menu', scoresFrom = 'menu';
  var isTouch = global.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in global;
  var overLock = 0, lastEntryId = null, pendingStats = null;

  document.body.classList.toggle('is-touch', isTouch);
  el.touch.classList.toggle('on', isTouch);

  /* ------------------------------ screens ------------------------------ */
  function show(name) {
    current = name;
    for (var k in screens) screens[k].classList.toggle('show', k === name);
    var playing = name === null || name === 'pause';
    el.hud.classList.toggle('on', playing);
    el.hud.setAttribute('aria-hidden', playing ? 'false' : 'true');
    document.body.classList.toggle('playing', name === null);
    el.touch.classList.toggle('on', isTouch && name === null);
  }

  /* ---------------------------- score table ---------------------------- */
  function dateStr(ts) {
    var d = new Date(ts);
    return (d.getMonth() + 1) + '/' + d.getDate();
  }
  function renderScores(node, highlightId) {
    var list = P.Scores.list();
    node.innerHTML = '';
    if (!list.length) {
      var d = document.createElement('div');
      d.className = 'score-empty';
      d.textContent = '还没有记录 · 骑出你的第一趟落日之旅';
      node.appendChild(d);
      return;
    }
    list.forEach(function (r, i) {
      var li = document.createElement('li');
      if (r.id === highlightId) li.className = 'me';
      li.style.animationDelay = (i * 0.035) + 's';
      var rk = document.createElement('span'); rk.className = 'rk'; rk.textContent = i + 1;
      var mid = document.createElement('div');
      var nm = document.createElement('div'); nm.className = 'nm'; nm.textContent = r.name || 'PELICAN';
      var meta = document.createElement('span'); meta.className = 'meta';
      meta.textContent = r.metres + 'm · ' + r.fish + ' fish · ×' + r.mult + ' · ' +
        (r.diff || 'classic').toUpperCase() + ' · ' + dateStr(r.ts);
      mid.appendChild(nm); mid.appendChild(meta);
      var sc = document.createElement('span'); sc.className = 'sc'; sc.textContent = P.fmt(r.score);
      li.appendChild(rk); li.appendChild(mid); li.appendChild(sc);
      node.appendChild(li);
    });
  }
  function refreshTables(highlight) {
    renderScores(el.menuScores, highlight);
    renderScores(el.overScores, highlight);
    renderScores(el.fullScores, highlight);
    el.hudBest.textContent = P.fmt(P.Scores.best());
  }

  /* -------------------------------- HUD -------------------------------- */
  var cache = { score: -1, dist: -1, mult: -1, lives: -1, boost: -1, ready: -1, active: -1, speed: -1, streak: -1 };
  var hudAcc = 0;
  function updateHud(gm, force) {
    var sc = Math.floor(gm.score);
    if (sc !== cache.score) {
      cache.score = sc;
      el.score.textContent = P.fmt(sc);
    }
    var m = Math.floor(gm.wx / 45);
    if (m !== cache.dist) { cache.dist = m; el.dist.textContent = m; }
    if (gm.mult !== cache.mult) {
      cache.mult = gm.mult;
      el.mult.textContent = '×' + gm.mult;
      el.combo.dataset.on = gm.mult > 1 ? '1' : '0';
      el.combo.classList.remove('bump');
      void el.combo.offsetWidth;
      if (gm.mult > 1) el.combo.classList.add('bump');
    }
    var st = gm.streak % 6;
    if (st !== cache.streak) {
      cache.streak = st;
      el.comboFill.style.width = (gm.mult >= 8 ? 100 : st / 6 * 100) + '%';
    }
    if (gm.lives !== cache.lives || force) {
      cache.lives = gm.lives;
      el.lives.innerHTML = '';
      for (var i = 0; i < gm.maxLives; i++) {
        var f = document.createElement('i');
        if (i >= gm.lives) f.className = 'gone';
        el.lives.appendChild(f);
      }
    }
    var bp = Math.round(gm.boostMeter);
    if (bp !== cache.boost) { cache.boost = bp; el.boostFill.style.width = bp + '%'; }
    var ready = gm.boostMeter >= 100 && gm.boostT <= 0 ? 1 : 0;
    if (ready !== cache.ready) { cache.ready = ready; el.boost.dataset.ready = ready; }
    var act = gm.boostT > 0 ? 1 : 0;
    if (act !== cache.active) { cache.active = act; el.boost.dataset.active = act; }
    var kmh = Math.round(gm.speed * 0.16);
    if (kmh !== cache.speed) {
      cache.speed = kmh;
      el.speedTxt.textContent = kmh + ' km/h';
      el.speedFill.style.width = P.clamp(kmh / 130 * 100, 0, 100) + '%';
    }
  }
  game.hudCb = updateHud;

  var toastT = null;
  game.toastCb = function (txt) {
    el.toast.textContent = txt;
    el.toast.classList.remove('show');
    void el.toast.offsetWidth;
    el.toast.classList.add('show');
    if (toastT) clearTimeout(toastT);
    toastT = setTimeout(function () { el.toast.classList.remove('show'); }, 1200);
  };

  /* ---------------------------- game over ------------------------------ */
  var TITLES = ['翻车了！', '羽毛散落一地', '海鸥笑了', '下次一定', '车轮飞出去了'];
  game.overCb = function (st) {
    pendingStats = st;
    overLock = performance.now() + 500;
    var prevBest = P.Scores.best();
    var isRecord = st.score > prevBest && st.score > 0;
    el.oScore.textContent = P.fmt(st.score);
    el.oDist.textContent = st.metres;
    el.oFish.textContent = st.fish;
    el.oMult.textContent = '×' + st.mult;
    el.oAir.textContent = st.air.toFixed(1) + 's';
    el.overTitle.textContent = isRecord ? '新纪录诞生！' : TITLES[(Math.random() * TITLES.length) | 0];
    el.ribbon.classList.toggle('show', isRecord);

    lastEntryId = null;
    if (P.Scores.qualifies(st.score)) {
      var name = (P.Store.get('name', '') || 'PELICAN').slice(0, 10);
      var entry = {
        name: name, score: st.score, metres: st.metres, fish: st.fish,
        mult: st.mult, diff: st.diff, ts: Date.now()
      };
      P.Scores.add(entry);
      lastEntryId = entry.id;
      el.nameRow.classList.remove('hide');
      el.nameInput.value = name;
      el.savedNote.textContent = '已记入排行榜 · 可以改个名字';
    } else {
      el.nameRow.classList.add('hide');
      el.savedNote.textContent = st.score > 0 ? '差一点点进入前十，再来一趟！' : '一条鱼都没吃到？先试试跳跃。';
    }
    refreshTables(lastEntryId);
    if (isRecord) setTimeout(function () { AU.sfx('record'); }, 320);
    show('over');
  };

  function saveName() {
    var v = el.nameInput.value.trim().slice(0, 10) || 'PELICAN';
    el.nameInput.value = v;
    P.Store.set('name', v);
    if (lastEntryId) P.Scores.rename(lastEntryId, v);
    refreshTables(lastEntryId);
    el.savedNote.textContent = '已保存为 “' + v + '”';
    AU.sfx('ui');
    el.nameInput.blur();
  }

  /* ------------------------------ actions ------------------------------ */
  function firstGesture() {
    AU.init(); AU.resume();
    AU.setMuted(P.Store.get('muted', false));
    syncSound();
  }
  function startGame() {
    firstGesture();
    game.start(game.diffKey);
    cache.score = cache.dist = cache.mult = cache.lives = cache.boost = -1;
    cache.ready = cache.active = cache.speed = cache.streak = -1;
    updateHud(game, true);
    show(null);
    AU.sfx('ui');
  }
  function restart() {
    if (performance.now() < overLock) return;
    startGame();
  }
  function togglePause() {
    if (game.state === 'play') {
      if (game.pause()) {
        el.pScore.textContent = P.fmt(Math.floor(game.score));
        el.pDist.textContent = Math.floor(game.wx / 45);
        el.pMult.textContent = '×' + game.mult;
        el.chkSound.checked = !AU.muted;
        show('pause');
        AU.sfx('back');
      }
    } else if (game.state === 'pause') {
      if (game.resume()) { show(null); AU.sfx('ui'); }
    }
  }
  function toMenu() {
    game.toMenu();
    refreshTables(null);
    show('menu');
    AU.sfx('back');
    AU.duckMusic(0.32);
  }
  function syncSound() {
    el.btnSound.classList.toggle('muted', AU.muted);
    el.chkSound.checked = !AU.muted;
    el.btnSound.title = AU.muted ? '开启声音 (M)' : '静音 (M)';
  }
  function toggleSound() {
    AU.init();
    AU.setMuted(!AU.muted);
    P.Store.set('muted', AU.muted);
    syncSound();
    if (!AU.muted) { AU.resume(); AU.sfx('ui'); if (game.state !== 'over') AU.startMusic(); }
  }

  /* ------------------------------ wiring ------------------------------- */
  $('btnPlay').addEventListener('click', startGame);
  $('btnAgain').addEventListener('click', restart);
  $('btnRestartP').addEventListener('click', function () { overLock = 0; restart(); });
  $('btnResume').addEventListener('click', togglePause);
  $('btnQuit').addEventListener('click', toMenu);
  $('btnMenu').addEventListener('click', toMenu);
  $('btnPause').addEventListener('click', togglePause);
  $('btnSound').addEventListener('click', toggleSound);
  $('btnSaveScore').addEventListener('click', saveName);
  el.nameInput.addEventListener('keydown', function (ev) {
    ev.stopPropagation();
    if (ev.key === 'Enter') saveName();
  });
  el.chkSound.addEventListener('change', function () {
    AU.init(); AU.setMuted(!el.chkSound.checked); P.Store.set('muted', AU.muted); syncSound();
  });
  $('btnScores').addEventListener('click', function () {
    scoresFrom = 'menu'; refreshTables(null); show('scores'); AU.sfx('ui');
  });
  $('btnScoresBack').addEventListener('click', function () { show(scoresFrom); AU.sfx('back'); });
  var clearArmed = false, clearT = null;
  $('btnClear').addEventListener('click', function () {
    var b = this;
    if (!clearArmed) {
      clearArmed = true; b.textContent = '确认清空？';
      clearT = setTimeout(function () { clearArmed = false; b.textContent = '清空记录'; }, 2600);
      return;
    }
    clearTimeout(clearT); clearArmed = false; b.textContent = '清空记录';
    P.Scores.clear(); refreshTables(null); AU.sfx('back');
  });
  document.querySelectorAll('.diff-btn').forEach(function (b) {
    b.addEventListener('click', function () {
      document.querySelectorAll('.diff-btn').forEach(function (o) { o.classList.remove('on'); });
      b.classList.add('on');
      game.diffKey = b.dataset.diff;
      P.Store.set('diff', game.diffKey);
      game.diff = global.PPDiff[game.diffKey];
      AU.sfx('ui');
    });
    if (b.dataset.diff === game.diffKey) b.classList.add('on');
    else b.classList.remove('on');
  });
  el.boost.addEventListener('pointerdown', function (ev) {
    ev.preventDefault(); firstGesture(); game.pressBoost();
  });

  /* ------------------------------ keyboard ----------------------------- */
  var down = {};
  function isTyping() { return document.activeElement === el.nameInput; }

  global.addEventListener('keydown', function (ev) {
    if (isTyping()) return;
    var k = ev.code;
    if (k === 'Space' || k === 'ArrowUp' || k === 'ArrowDown' || k === 'Tab') ev.preventDefault();
    if (down[k]) return;
    down[k] = true;

    if (k === 'KeyM') { toggleSound(); return; }

    if (current === 'scores') {
      if (k === 'Escape' || k === 'Enter' || k === 'Space') { show(scoresFrom); AU.sfx('back'); }
      return;
    }
    if (game.state === 'menu') {
      if (k === 'Space' || k === 'Enter' || k === 'KeyW' || k === 'ArrowUp') startGame();
      return;
    }
    if (game.state === 'over') {
      if (k === 'KeyR' || k === 'Space' || k === 'Enter') restart();
      else if (k === 'Escape') toMenu();
      return;
    }
    if (k === 'KeyP' || k === 'Escape') { togglePause(); return; }
    if (game.state === 'pause') {
      if (k === 'Space' || k === 'Enter') togglePause();
      else if (k === 'KeyR') { overLock = 0; restart(); }
      return;
    }
    if (k === 'KeyR') { overLock = 0; restart(); return; }
    if (k === 'Space' || k === 'ArrowUp' || k === 'KeyW' || k === 'KeyJ') { firstGesture(); game.pressJump(); }
    else if (k === 'ArrowDown' || k === 'KeyS' || k === 'KeyK') game.pressDuck();
    else if (k === 'ShiftLeft' || k === 'ShiftRight' || k === 'KeyE' || k === 'KeyL') game.pressBoost();
  }, { passive: false });

  global.addEventListener('keyup', function (ev) {
    var k = ev.code;
    down[k] = false;
    if (k === 'Space' || k === 'ArrowUp' || k === 'KeyW' || k === 'KeyJ') game.releaseJump();
    else if (k === 'ArrowDown' || k === 'KeyS' || k === 'KeyK') game.releaseDuck();
  });

  /* ------------------------------- touch ------------------------------- */
  function bindPad(node, onDown, onUp) {
    node.addEventListener('pointerdown', function (ev) {
      ev.preventDefault();
      firstGesture();
      try { node.setPointerCapture(ev.pointerId); } catch (e) {}
      node.classList.add('held');
      onDown();
    });
    function end(ev) {
      if (ev) ev.preventDefault();
      node.classList.remove('held');
      onUp();
    }
    node.addEventListener('pointerup', end);
    node.addEventListener('pointercancel', end);
    node.addEventListener('lostpointercapture', end);
    node.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  }
  bindPad(el.padJump, function () { game.pressJump(); }, function () { game.releaseJump(); });
  bindPad(el.padDuck, function () { game.pressDuck(); }, function () { game.releaseDuck(); });

  var zoneMap = {};
  canvas.addEventListener('pointerdown', function (ev) {
    if (game.state === 'menu') { startGame(); return; }
    if (game.state === 'over') { restart(); return; }
    if (game.state !== 'play') return;
    firstGesture();
    var left = ev.clientX < global.innerWidth * 0.42;
    var act = (ev.pointerType === 'mouse') ? 'jump' : (left ? 'duck' : 'jump');
    zoneMap[ev.pointerId] = act;
    if (act === 'jump') game.pressJump(); else game.pressDuck();
    try { canvas.setPointerCapture(ev.pointerId); } catch (e) {}
  });
  function zoneEnd(ev) {
    var act = zoneMap[ev.pointerId];
    if (!act) return;
    delete zoneMap[ev.pointerId];
    if (act === 'jump') game.releaseJump(); else game.releaseDuck();
  }
  canvas.addEventListener('pointerup', zoneEnd);
  canvas.addEventListener('pointercancel', zoneEnd);
  canvas.addEventListener('lostpointercapture', zoneEnd);
  canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  global.addEventListener('pointerup', zoneEnd);

  /* ---------------------------- lifecycle ------------------------------ */
  function autoPause() {
    if (game.state === 'play') {
      game.pause();
      el.pScore.textContent = P.fmt(Math.floor(game.score));
      el.pDist.textContent = Math.floor(game.wx / 45);
      el.pMult.textContent = '×' + game.mult;
      el.chkSound.checked = !AU.muted;
      show('pause');
    }
    game.releaseJump(); game.releaseDuck();
    down = {};
  }
  document.addEventListener('visibilitychange', function () { if (document.hidden) autoPause(); });
  global.addEventListener('blur', autoPause);

  var resizeT = null;
  function onResize() {
    document.body.classList.toggle('portrait', global.innerHeight > global.innerWidth);
    if (resizeT) clearTimeout(resizeT);
    resizeT = setTimeout(function () { game.resize(); }, 120);
  }
  global.addEventListener('resize', onResize);
  global.addEventListener('orientationchange', onResize);
  onResize();

  /* ------------------------------- loop -------------------------------- */
  var STEP = 1 / 120, acc = 0, last = performance.now();
  var slowFrames = 0, fastFrames = 0;
  function frame(now) {
    var raw = (now - last) / 1000;
    last = now;
    if (raw > 0.25) raw = STEP;
    acc += raw;
    var steps = 0;
    while (acc >= STEP && steps < 8) { game.update(STEP); acc -= STEP; steps++; }
    if (acc > STEP * 8) acc = 0;
    game.draw();

    if (raw > 0.024) { slowFrames++; fastFrames = 0; } else { fastFrames++; if (fastFrames > 90) slowFrames = 0; }
    if (slowFrames > 45 && !game.lowFx) game.lowFx = true;
    if (fastFrames > 240 && game.lowFx) { game.lowFx = false; slowFrames = 0; }

    requestAnimationFrame(frame);
  }

  /* ------------------------------- boot -------------------------------- */
  AU.setMuted(P.Store.get('muted', false));
  syncSound();
  refreshTables(null);
  updateHud(game, true);
  show('menu');
  requestAnimationFrame(frame);
})(window);