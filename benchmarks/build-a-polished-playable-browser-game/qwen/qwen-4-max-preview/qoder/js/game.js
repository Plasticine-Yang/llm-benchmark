/* PELICAN PEDAL — simulation: physics, spawning, collisions, scoring, render */
(function (global) {
  'use strict';
  var P = global.PP, C = P.C, A = global.PPActors, S = global.PPScenery, AU = global.PPAudio;
  var TAU = P.TAU, clamp = P.clamp, lerp = P.lerp, rand = P.rand, randi = P.randi, pick = P.pick;

  var DIFF = {
    chill:   { lives: 5, base: 300, ramp: 2.3, max: 560, spacing: 1.28, label: 'CHILL' },
    classic: { lives: 3, base: 345, ramp: 3.2, max: 665, spacing: 1.00, label: 'CLASSIC' },
    turbo:   { lives: 2, base: 420, ramp: 4.4, max: 790, spacing: 0.84, label: 'TURBO' }
  };

  var GRAV = 2150, JUMP_V = 775, FLAP_V = 640, HOLD_T = 0.22;
  var STAND_H = 92, DUCK_H = 52, HALF_W = 25;

  function Game(canvas) {
    this.canvas = canvas;
    this.g = canvas.getContext('2d', { alpha: false });
    this.parts = new P.Particles(760);
    this.floats = new P.Floaters(30);
    this.cam = new P.Camera();
    this.ents = [];
    this.view = null;
    this.state = 'menu';
    this.diffKey = P.Store.get('diff', 'classic');
    if (!DIFF[this.diffKey]) this.diffKey = 'classic';
    this.t = 0;
    this.freeze = 0;
    this.flash = 0; this.flashCol = C.danger;
    this.held = { jump: false, duck: false };
    this.jumpBuf = 0;
    this.toastCb = null;
    this.hudCb = null;
    this.overCb = null;
    this.menuT = 0;
    this.lowFx = false;
    this.resize();
    this.resetRun(true);
  }

  /* ------------------------------ layout ------------------------------ */
  Game.prototype.resize = function () {
    var cv = this.canvas;
    var cssW = Math.max(1, cv.clientWidth), cssH = Math.max(1, cv.clientHeight);
    var dpr = Math.min(global.devicePixelRatio || 1, 2);
    cv.width = Math.round(cssW * dpr); cv.height = Math.round(cssH * dpr);
    var vh = 540;
    var vw = clamp(Math.round(cssW / cssH * vh), 560, 1280);
    var scale = Math.min(cssW / vw, cssH / vh);
    var offX = (cssW - vw * scale) / 2, offY = (cssH - vh * scale) / 2;
    this.view = {
      vw: vw, vh: vh, scale: scale, dpr: dpr, offX: offX, offY: offY,
      gy: 430, horizon: 250, seaBottom: 322,
      left: -offX / scale, top: -offY / scale,
      right: vw + offX / scale, bottom: vh + offY / scale,
      px: clamp(vw * 0.26, 130, 300),
      speedScale: clamp(vw / 960, 0.78, 1.06)
    };
    S.build(this.view, this.g);
    if (this.p) this.p.x = this.state === 'menu' ? this.menuX() : this.view.px;
  };

  Game.prototype.menuX = function () {
    var v = this.view;
    return v.vw > 760 ? v.vw * 0.66 : v.vw * 0.5;
  };

  /* ------------------------------- run -------------------------------- */
  Game.prototype.resetRun = function (menuMode) {
    var d = DIFF[this.diffKey];
    this.diff = d;
    this.ents.length = 0;
    this.parts.clear(); this.floats.clear(); this.cam.reset();
    this.wx = 0; this.camX = 0; this.runT = 0; this.speed = d.base;
    this.score = 0; this.streak = 0; this.mult = 1; this.bestMult = 1;
    this.fishCount = 0; this.maxAir = 0; this.smashes = 0;
    this.lives = menuMode ? 3 : d.lives; this.maxLives = d.lives;
    this.boostMeter = 0; this.boostT = 0; this.dip = 1; this.trailAcc = 0;
    this.nextX = 620; this.tier = 0; this.milestone = 0;
    this.freeze = 0; this.flash = 0; this.introDone = !!menuMode;
    this.jumpBuf = 0; this.held.jump = false; this.held.duck = false;
    this.p = {
      x: menuMode ? this.menuX() : this.view.px, y: this.view.gy, vy: 0, grounded: true, duck: 0,
      flapUsed: false, hold: 0, coyote: 0, air: 0, wheel: 0, crank: 0,
      sx: 1, sy: 1, lean: 0, blink: 0, blinkT: rand(1.5, 4), invuln: 0,
      hurt: 0, pouch: 0, flap: 0, flapT: 0, slamming: false, rampRef: null,
      tumble: 0, tumbleV: 0, dead: false
    };
    this.emitHud(true);
  };

  Game.prototype.start = function (diffKey) {
    if (diffKey && DIFF[diffKey]) { this.diffKey = diffKey; P.Store.set('diff', diffKey); }
    this.resetRun(false);
    this.state = 'play';
    AU.resume(); AU.startMusic(); AU.duckMusic(0.5); AU.setIntensity(0);
    this.toast('GO!');
  };
  Game.prototype.pause = function () {
    if (this.state !== 'play') return false;
    this.state = 'pause'; AU.duckMusic(0.12); return true;
  };
  Game.prototype.resume = function () {
    if (this.state !== 'pause') return false;
    this.state = 'play'; AU.resume(); AU.duckMusic(0.5); return true;
  };
  Game.prototype.toMenu = function () {
    this.state = 'menu'; this.resetRun(true); AU.duckMusic(0.32); AU.setIntensity(0);
  };
  Game.prototype.gameOver = function () {
    if (this.state === 'over') return;
    this.state = 'over';
    this.p.dead = true;
    this.p.tumbleV = rand(-7, -3);
    this.p.vy = -420;
    this.cam.kick(1);
    this.flash = 0.7; this.flashCol = C.danger;
    AU.stopMusic(0.5); AU.sfx('over');
    this.burst(this.p.x + this.camX, this.p.y - 50, 26, C.bone, P.FEATHER);
    if (this.overCb) this.overCb(this.stats());
  };
  Game.prototype.stats = function () {
    return {
      score: Math.floor(this.score), metres: Math.floor(this.wx / 45),
      fish: this.fishCount, mult: this.bestMult, air: this.maxAir,
      diff: this.diffKey, smashes: this.smashes
    };
  };

  /* ------------------------------ input ------------------------------- */
  Game.prototype.pressJump = function () {
    this.held.jump = true;
    if (this.state === 'play') this.jumpBuf = 0.13;
  };
  Game.prototype.releaseJump = function () { this.held.jump = false; this.p.hold = 0; };
  Game.prototype.pressDuck = function () { this.held.duck = true; };
  Game.prototype.releaseDuck = function () { this.held.duck = false; };
  Game.prototype.pressBoost = function () {
    if (this.state !== 'play' || this.boostT > 0 || this.boostMeter < 100) return false;
    this.boostT = 3.4; this.boostMeter = 100;
    this.cam.kick(0.5); this.flash = 0.35; this.flashCol = C.cyan;
    AU.sfx('boost'); AU.setIntensity(1);
    this.toast('TAILWIND!');
    var wx = this.p.x + this.camX;
    this.parts.spawn(P.RING, wx, this.p.y - 46, 0, 0, 0.5, 40, C.cyan, 0, 0);
    this.burst(wx, this.p.y - 46, 26, C.lime, P.SPARK, 460);
    return true;
  };

  /* ----------------------------- helpers ------------------------------ */
  Game.prototype.toast = function (txt) { if (this.toastCb) this.toastCb(txt); };
  Game.prototype.emitHud = function (force) { if (this.hudCb) this.hudCb(this, force); };

  Game.prototype.burst = function (x, y, n, col, kind, spd) {
    spd = spd || 260;
    for (var i = 0; i < n; i++) {
      var a = rand(0, TAU), v = rand(spd * 0.3, spd);
      this.parts.spawn(kind, x, y, Math.cos(a) * v, Math.sin(a) * v - 60,
        rand(0.35, 0.85), kind === P.FEATHER ? rand(4, 8) : rand(2, 5),
        col, kind === P.FEATHER ? 420 : 900, kind === P.FEATHER ? 1.4 : 0.7);
    }
  };

  Game.prototype.addScore = function (n, x, y, label, col) {
    this.score += n;
    if (label) this.floats.add(x, y, label, col || C.gold, n >= 100 ? 24 : 19);
  };

  /* ----------------------------- patterns ----------------------------- */
  function fish(x, y, gold) { return { t: 'fish', x: x, y: y, by: y, gold: !!gold, ph: rand(0, TAU), dead: false }; }
  function crab(x) { return { t: 'crab', x: x, y: 0, ph: rand(0, TAU), dead: false }; }
  function buoy(x) { return { t: 'buoy', x: x, y: 0, dead: false }; }
  function gull(x, y) { return { t: 'gull', x: x, y: y, by: y, ph: rand(0, TAU), dead: false }; }
  function ramp(x, w, h) { return { t: 'ramp', x: x, w: w, h: h, dead: false }; }
  function gap(x, w) { return { t: 'gap', x: x, w: w, dead: false }; }
  function banner(x, w, clear) { return { t: 'banner', x: x, w: w, clear: clear, dead: false }; }
  function feather(x, y) { return { t: 'feather', x: x, y: y, by: y, ph: rand(0, TAU), dead: false }; }

  Game.prototype.patterns = function () {
    var gy = this.view.gy;
    function arc(x0, n, dx, base, lift, gold) {
      var out = [];
      for (var i = 0; i < n; i++) {
        var p = n === 1 ? 0.5 : i / (n - 1);
        out.push(fish(x0 + i * dx, base - Math.sin(p * Math.PI) * lift, gold && i === Math.floor(n / 2)));
      }
      return out;
    }
    return {
      intro: function (x) {
        var e = [fish(x + 40, gy - 46), fish(x + 96, gy - 46), fish(x + 152, gy - 46), ramp(x + 230, 92, 58)];
        e = e.concat(arc(x + 370, 7, 52, gy - 92, 108));
        e.push(crab(x + 800));
        e = e.concat(arc(x + 740, 3, 46, gy - 60, 52));
        return { w: 900, e: e };
      },
      line: function (x) {
        var n = randi(4, 6), e = [];
        for (var i = 0; i < n; i++) e.push(fish(x + 50 + i * 52, gy - 46 - (i % 2) * 8));
        return { w: 50 + n * 52 + 40, e: e };
      },
      rampArc: function (x) {
        var e = [ramp(x + 30, 92, 60)].concat(arc(x + 180, 7, 54, gy - 96, 118));
        return { w: 180 + 7 * 54 + 90, e: e };
      },
      crabHop: function (x) {
        var e = [crab(x + 130)].concat(arc(x + 60, 5, 44, gy - 62, 74));
        return { w: 300, e: e };
      },
      crabPair: function (x) {
        var e = [crab(x + 110), crab(x + 330)];
        e = e.concat(arc(x + 50, 4, 42, gy - 62, 66));
        e = e.concat(arc(x + 272, 4, 42, gy - 62, 66));
        return { w: 470, e: e };
      },
      gullDuck: function (x) {
        var e = [gull(x + 150, gy - 92), gull(x + 360, gy - 92)];
        for (var i = 0; i < 6; i++) e.push(fish(x + 90 + i * 56, gy - 28));
        return { w: 480, e: e };
      },
      gapJump: function (x) {
        var w = randi(120, 165);
        var e = [gap(x + 90, w)].concat(arc(x + 70, 5, (w + 60) / 4, gy - 70, 78));
        return { w: 90 + w + 130, e: e };
      },
      buoySlalom: function (x) {
        var e = [buoy(x + 110), buoy(x + 300)];
        e = e.concat(arc(x + 150, 4, 44, gy - 96, 56));
        return { w: 420, e: e };
      },
      bannerDuck: function (x) {
        var e = [banner(x + 110, 116, 64)];
        for (var i = 0; i < 4; i++) e.push(fish(x + 100 + i * 44, gy - 26));
        e.push(fish(x + 330, gy - 46));
        return { w: 400, e: e };
      },
      goldHigh: function (x) {
        var e = [ramp(x + 30, 96, 66)];
        e = e.concat(arc(x + 170, 5, 52, gy - 110, 96));
        e.push(fish(x + 170 + 5 * 52 + 30, gy - 236, true));
        e.push(feather(x + 170 + 5 * 52 + 120, gy - 150));
        return { w: 640, e: e };
      },
      slamRow: function (x) {
        var e = [ramp(x + 20, 100, 74), crab(x + 250), crab(x + 308), crab(x + 366)];
        e = e.concat(arc(x + 180, 5, 50, gy - 150, 60));
        return { w: 500, e: e };
      },
      stairs: function (x) {
        var e = [ramp(x + 30, 84, 52), buoy(x + 250), ramp(x + 400, 84, 62)];
        e = e.concat(arc(x + 150, 4, 46, gy - 100, 60));
        e = e.concat(arc(x + 520, 5, 52, gy - 110, 104, true));
        return { w: 830, e: e };
      },
      gauntlet: function (x) {
        var e = [crab(x + 120), gull(x + 330, gy - 92), buoy(x + 540), gap(x + 700, 140)];
        e = e.concat(arc(x + 60, 4, 42, gy - 62, 62));
        for (var i = 0; i < 3; i++) e.push(fish(x + 280 + i * 48, gy - 28));
        e = e.concat(arc(x + 680, 5, 50, gy - 74, 82));
        return { w: 940, e: e };
      },
      featherRun: function (x) {
        var e = [feather(x + 160, gy - 128)];
        e = e.concat(arc(x + 60, 5, 50, gy - 60, 70));
        return { w: 340, e: e };
      }
    };
  };

  var TIERS = [
    ['line', 'rampArc', 'crabHop'],
    ['line', 'rampArc', 'crabHop', 'gullDuck', 'gapJump', 'buoySlalom'],
    ['rampArc', 'crabPair', 'gullDuck', 'gapJump', 'buoySlalom', 'bannerDuck', 'goldHigh', 'featherRun'],
    ['crabPair', 'gullDuck', 'gapJump', 'slamRow', 'bannerDuck', 'goldHigh', 'stairs', 'buoySlalom'],
    ['gauntlet', 'slamRow', 'stairs', 'crabPair', 'goldHigh', 'gapJump', 'gullDuck']
  ];

  Game.prototype.spawnAhead = function () {
    var horizon = this.camX + this.view.vw + 500;
    var pats = this.patterns();
    var guard = 0;
    while (this.nextX < horizon && guard++ < 6) {
      var pat;
      if (!this.introDone) { pat = pats.intro(this.nextX); this.introDone = true; }
      else {
        var pool = TIERS[Math.min(TIERS.length - 1, this.tier)];
        var name = pick(pool);
        if (name === this.lastPat && pool.length > 1) name = pick(pool);
        this.lastPat = name;
        pat = pats[name](this.nextX);
      }
      for (var i = 0; i < pat.e.length; i++) this.ents.push(pat.e[i]);
      var spacing = clamp(this.speed * 0.52, 165, 330) * this.diff.spacing;
      this.nextX += pat.w + spacing;
    }
  };

  /* ------------------------------ update ------------------------------ */
  Game.prototype.update = function (dt) {
    this.t += dt;
    var p = this.p, v = this.view;

    if (this.state === 'pause') { this.cam.update(dt, 1); return; }

    if (this.freeze > 0) {
      this.freeze -= dt;
      this.parts.update(dt * 0.25);
      this.cam.update(dt, this.boostT > 0 ? 1.045 : 1);
      this.flash = Math.max(0, this.flash - dt * 2.2);
      return;
    }

    if (this.state === 'menu') { this.updateMenu(dt); return; }

    var playing = this.state === 'play';
    if (playing) this.runT += dt;

    /* speed */
    var target = Math.min(this.diff.base + this.runT * this.diff.ramp, this.diff.max) * v.speedScale;
    this.dip = P.approach(this.dip, 1, dt * 0.55);
    var bm = this.boostT > 0 ? 1.5 : 1;
    this.speed = playing ? target * this.dip * bm : Math.max(0, this.speed - 900 * dt);
    if (this.boostT > 0) {
      this.boostT -= dt;
      this.boostMeter = Math.max(0, this.boostT / 3.4 * 100);
      if (this.boostT <= 0) { AU.sfx('boostEnd'); AU.setIntensity(clamp(this.runT / 70, 0, 0.7)); }
    }
    this.wx += this.speed * dt;
    this.camX = this.wx - p.x;

    if (playing) {
      this.score += this.speed * dt * 0.05 * (this.boostT > 0 ? 2 : 1);
      var newTier = Math.min(TIERS.length - 1, Math.floor(this.runT / 17));
      if (newTier !== this.tier) {
        this.tier = newTier;
        this.toast('SPEED UP · ' + Math.floor(this.wx / 45) + 'm');
        this.cam.kick(0.22);
        AU.setIntensity(clamp(this.runT / 70, 0, 0.7));
      }
      var m = Math.floor(this.wx / 45 / 250);
      if (m > this.milestone) { this.milestone = m; this.toast(m * 250 + ' METRES!'); AU.sfx('life'); }
      this.spawnAhead();
    }

    /* ---- ground support / ramps / gaps ---- */
    var support = v.gy, onRamp = null, overGap = null, i, e;
    for (i = 0; i < this.ents.length; i++) {
      e = this.ents[i];
      if (e.dead) continue;
      if (e.t === 'ramp' && this.wx >= e.x && this.wx <= e.x + e.w) {
        var f = (this.wx - e.x) / e.w;
        var yy = v.gy - e.h * f;
        if (yy < support) { support = yy; onRamp = e; }
      } else if (e.t === 'gap' && this.wx > e.x + 4 && this.wx < e.x + e.w - 4) {
        overGap = e;
      }
    }
    if (overGap) support = 1e9;

    if (p.rampRef && p.rampRef !== onRamp && p.grounded && !overGap) {
      p.vy = -(940 + this.speed * 0.32);
      p.grounded = false; p.flapUsed = false; p.hold = 0; p.coyote = 0;
      p.sx = 0.84; p.sy = 1.2;
      AU.sfx('ramp'); this.cam.kick(0.24);
      this.burst(this.wx, p.y, 14, C.gold, P.SPARK, 320);
      this.parts.spawn(P.RING, this.wx, p.y, 0, 0, 0.4, 26, C.amber, 0, 0);
    }
    p.rampRef = onRamp;

    /* ---- vertical motion ---- */
    this.jumpBuf = Math.max(0, this.jumpBuf - dt);
    p.coyote = Math.max(0, p.coyote - dt);

    if (playing && !p.dead) {
      if (this.jumpBuf > 0 && (p.grounded || p.coyote > 0)) {
        p.vy = -JUMP_V; p.grounded = false; p.coyote = 0; this.jumpBuf = 0;
        p.hold = HOLD_T; p.flapUsed = false; p.sx = 0.85; p.sy = 1.18;
        AU.sfx('jump');
        this.dust(this.wx, v.gy, 8, 1);
      } else if (this.jumpBuf > 0 && !p.grounded && !p.flapUsed) {
        p.vy = -FLAP_V; p.flapUsed = true; this.jumpBuf = 0; p.flapT = 0.42;
        p.hold = HOLD_T * 0.8; p.sx = 1.12; p.sy = 0.9;
        AU.sfx('flap'); this.cam.kick(0.1);
        this.burst(this.wx - 10, p.y - 60, 9, C.bone, P.FEATHER, 220);
        this.parts.spawn(P.RING, this.wx - 6, p.y - 58, 0, 0, 0.34, 20, C.bone, 0, 0);
      }
    }

    var duckTarget = this.held.duck ? (p.grounded ? 1 : 0.55) : 0;
    p.duck = P.approach(p.duck, duckTarget, dt * 7);

    if (!p.grounded) {
      var gmul = 1;
      if (this.held.jump && p.hold > 0 && p.vy < 0) { gmul = 0.52; p.hold -= dt; }
      if (this.held.duck && p.vy > -120) { gmul = 1.9; p.slamming = p.vy > 620; }
      else p.slamming = false;
      p.vy += GRAV * gmul * dt;
      p.vy = Math.min(p.vy, 1750);
      p.y += p.vy * dt;
      p.air += dt;
      if (p.air > this.maxAir) this.maxAir = p.air;

      if (p.y >= support && p.vy > 0 && support < 1e8) {
        if (p.dead) { p.y = support; p.vy = 0; p.grounded = true; }
        else this.land(support);
      } else if (p.y > v.gy + 130) {
        this.crash('gap', overGap);
      }
    } else {
      if (support > 1e8) {
        p.grounded = false; p.vy = 40; p.coyote = 0.09; p.air = 0;
      } else {
        p.y = support;
        p.air = 0; p.slamming = false;
        p.coyote = 0.09;
        if (this.jumpBuf === 0 && !this.held.jump) p.hold = 0;
      }
    }

    /* ---- rider animation state ---- */
    p.wheel += this.speed / 16.4 * dt;
    p.crank += this.speed / 46 * dt;
    p.sx = P.approach(p.sx, 1, dt * 2.6);
    p.sy = P.approach(p.sy, 1, dt * 2.6);
    var leanT = clamp(p.vy * 0.00028, -0.3, 0.34) + (onRamp && p.grounded ? -0.5 : 0) - (this.boostT > 0 ? 0.1 : 0);
    if (p.dead) { p.tumble += p.tumbleV * dt; leanT = p.tumble; }
    p.lean = lerp(p.lean, leanT, Math.min(1, dt * (p.dead ? 20 : 9)));
    p.flapT = Math.max(0, p.flapT - dt);
    var fl = p.flapT > 0 ? Math.sin((1 - p.flapT / 0.42) * Math.PI) : (p.grounded ? 0 : 0.22 + Math.sin(this.t * 13) * 0.16);
    p.flap = lerp(p.flap, fl, Math.min(1, dt * 18));
    p.pouch = Math.max(0, p.pouch - dt * 0.35);
    p.invuln = Math.max(0, p.invuln - dt);
    p.hurt = Math.max(0, p.hurt - dt);
    p.blinkT -= dt;
    if (p.blinkT <= 0) { p.blink = 1; p.blinkT = rand(2.2, 5.5); }
    p.blink = Math.max(0, p.blink - dt * 7);

    /* ---- entities ---- */
    var cull = this.camX - 160;
    for (i = this.ents.length - 1; i >= 0; i--) {
      e = this.ents[i];
      if (e.dead || e.x + (e.w || 40) < cull) { this.ents.splice(i, 1); continue; }
      if (e.t === 'gull') { e.x -= 74 * dt; e.y = e.by + Math.sin(this.t * 2.6 + e.ph) * 5; }
      else if (e.t === 'crab') { e.x -= 22 * dt; }
      else if (e.t === 'fish' || e.t === 'feather') { e.y = e.by + Math.sin(this.t * 3 + e.ph) * 5; }
    }

    if (playing && !p.dead) this.collide();

    /* ---- boost trail ---- */
    if (this.boostT > 0) {
      this.trailAcc += dt * 46;
      while (this.trailAcc >= 1) {
        this.trailAcc -= 1;
        this.parts.spawn(P.STREAK, this.wx - rand(6, 54), p.y - rand(8, 94),
          -rand(620, 1050), 0, rand(0.2, 0.36), rand(30, 78),
          Math.random() < 0.5 ? C.cyan : C.magenta, 0, 0);
      }
    } else this.trailAcc = 0;
    if (p.slamming) {
      this.parts.spawn(P.SPARK, this.wx + rand(-14, 14), p.y - rand(0, 40), 0, -rand(120, 260),
        0.25, rand(2, 4), C.amber, 200, 0.4);
    }

    this.parts.update(dt);
    this.floats.update(dt);
    this.cam.update(dt, this.boostT > 0 ? 1.045 : (p.dead ? 1.06 : 1));
    this.flash = Math.max(0, this.flash - dt * 2.2);
    this.emitHud(false);
  };

  Game.prototype.updateMenu = function (dt) {
    var p = this.p, v = this.view;
    this.menuT += dt;
    this.speed = 210;
    this.wx += this.speed * dt;
    this.camX = this.wx - p.x;
    p.wheel += this.speed / 16.4 * dt;
    p.crank += this.speed / 46 * dt;
    p.blinkT -= dt;
    if (p.blinkT <= 0) { p.blink = 1; p.blinkT = rand(2, 5); }
    p.blink = Math.max(0, p.blink - dt * 7);
    if (p.grounded && this.menuT > 2.4) {
      this.menuT = 0; p.vy = -600; p.grounded = false; p.sx = 0.86; p.sy = 1.16; p.flapT = 0.42;
      this.dust(this.wx, v.gy, 6, 0.7);
    }
    if (!p.grounded) {
      p.vy += GRAV * dt; p.y += p.vy * dt;
      if (p.y >= v.gy) { p.y = v.gy; p.grounded = true; p.vy = 0; p.sx = 1.16; p.sy = 0.86; this.dust(this.wx, v.gy, 7, 0.7); }
    }
    p.sx = P.approach(p.sx, 1, dt * 2.6); p.sy = P.approach(p.sy, 1, dt * 2.6);
    p.flapT = Math.max(0, p.flapT - dt);
    var fl = p.flapT > 0 ? Math.sin((1 - p.flapT / 0.42) * Math.PI) : (p.grounded ? 0 : 0.2);
    p.flap = lerp(p.flap, fl, Math.min(1, dt * 18));
    p.lean = lerp(p.lean, clamp(p.vy * 0.0003, -0.26, 0.3), Math.min(1, dt * 8));
    p.pouch = 0.4 + Math.sin(this.t) * 0.1;
    if (Math.random() < dt * 2.2) {
      this.parts.spawn(P.FEATHER, this.camX + v.right + 20, rand(v.top + 40, v.gy - 60),
        -rand(60, 140), rand(-10, 30), rand(2.4, 4), rand(3, 6), 'rgba(255,243,226,.7)', 12, 0.2, rand(-2, 2));
    }
    this.parts.update(dt);
    this.floats.update(dt);
    this.cam.update(dt, 1);
    this.flash = Math.max(0, this.flash - dt * 2.2);
  };

  Game.prototype.dust = function (x, y, n, power) {
    for (var i = 0; i < n; i++) {
      this.parts.spawn(P.DUST, x + rand(-18, 18), y - rand(0, 6),
        rand(-160, 60) * power, -rand(20, 130) * power, rand(0.3, 0.65),
        rand(4, 10), 'rgba(255,222,180,.9)', 260, 1.6);
    }
  };

  Game.prototype.land = function (y) {
    var p = this.p;
    var impact = clamp(p.vy / 1400, 0.15, 1);
    var wasSlam = p.slamming;
    p.y = y; p.vy = 0; p.grounded = true; p.flapUsed = false; p.slamming = false;
    p.sx = 1 + 0.24 * impact; p.sy = 1 - 0.22 * impact;
    this.dust(this.wx, y, 5 + Math.floor(impact * 8), 0.6 + impact);
    AU.sfx('land', impact);
    if (p.air > 0.5) {
      var bonus = Math.round(p.air * 80) * (this.boostT > 0 ? 2 : 1);
      this.addScore(bonus, this.wx, y - 110, 'AIR +' + bonus, C.cyan);
      AU.sfx('fish', Math.min(8, Math.floor(p.air * 4)));
    }
    p.air = 0;
    if (wasSlam) {
      this.cam.kick(0.55);
      this.freeze = 0.05;
      AU.sfx('slam');
      this.parts.spawn(P.RING, this.wx, y - 4, 0, 0, 0.45, 34, C.amber, 0, 0);
      this.parts.spawn(P.RING, this.wx, y - 4, 0, 0, 0.6, 52, C.bone, 0, 0);
      this.dust(this.wx, y, 16, 1.6);
      var killed = 0;
      for (var i = 0; i < this.ents.length; i++) {
        var e = this.ents[i];
        if (e.dead || (e.t !== 'crab' && e.t !== 'buoy')) continue;
        if (Math.abs(e.x - this.wx) < 138) { this.smash(e); killed++; }
      }
      if (killed) {
        var pts = killed * 30 * this.mult;
        this.addScore(pts, this.wx, y - 140, 'SLAM ×' + killed + ' +' + pts, C.coral);
        this.toast(killed > 1 ? 'CRAB CRUSH!' : 'SLAM!');
      }
    } else {
      this.cam.kick(0.08 + impact * 0.14);
    }
  };

  Game.prototype.smash = function (e) {
    e.dead = true;
    this.smashes++;
    var y = e.t === 'gull' ? e.y : this.view.gy - 20;
    this.burst(e.x, y, 14, e.t === 'gull' ? C.bone : C.coral, P.SHARD, 340);
    this.burst(e.x, y, 8, C.gold, P.SPARK, 300);
    this.parts.spawn(P.RING, e.x, y, 0, 0, 0.32, 18, C.gold, 0, 0);
    AU.sfx('smash');
  };

  Game.prototype.crash = function (kind, gapRef) {
    var p = this.p;
    if (p.invuln > 0 || this.boostT > 0 || p.dead) return;
    this.lives--;
    this.streak = 0; this.mult = 1;
    this.dip = 0.5;
    p.invuln = 1.6; p.hurt = 1.1;
    p.sx = 1.3; p.sy = 0.72;
    this.freeze = 0.085;
    this.flash = 0.6; this.flashCol = C.danger;
    this.cam.kick(0.95);
    AU.sfx('crash');
    this.burst(this.wx, p.y - 50, 18, C.bone, P.FEATHER, 340);
    this.burst(this.wx, p.y - 30, 14, C.danger, P.SPARK, 380);
    this.dust(this.wx, this.view.gy, 14, 1.4);
    this.floats.add(this.wx, p.y - 120, kind === 'gap' ? 'SPLASH!' : 'OUCH!', C.danger, 24);
    if (gapRef) { this.wx = gapRef.x + gapRef.w + 24; p.y = this.view.gy; p.vy = 0; p.grounded = true; }
    else if (p.y > this.view.gy) { p.y = this.view.gy; p.vy = 0; p.grounded = true; }
    this.emitHud(true);
    if (this.lives <= 0) this.gameOver();
    else this.toast(this.lives === 1 ? 'LAST FEATHER!' : 'SHAKE IT OFF');
  };

  /* ---------------------------- collisions ---------------------------- */
  Game.prototype.collide = function () {
    var p = this.p, gy = this.view.gy;
    var h = lerp(STAND_H, DUCK_H, p.duck);
    var top = p.y - h, bot = p.y - 4;
    var lx = this.wx - HALF_W, rx = this.wx + HALF_W;
    var cx = this.wx + 8, cy = p.y - h * 0.55;

    for (var i = 0; i < this.ents.length; i++) {
      var e = this.ents[i];
      if (e.dead) continue;
      if (e.x - this.camX > this.view.vw + 80 || e.x - this.camX < -120) continue;

      if (e.t === 'fish' || e.t === 'feather') {
        var rr = e.t === 'feather' ? 46 : (e.gold ? 48 : 42);
        if (Math.abs(e.x - cx) < rr && Math.abs(e.y - cy) < rr + 6) {
          e.dead = true;
          if (e.t === 'feather') {
            if (this.lives < this.maxLives) { this.lives++; AU.sfx('life'); this.floats.add(e.x, e.y - 20, '+1 FEATHER', C.lime, 20); }
            else { this.addScore(150, e.x, e.y - 20, '+150', C.lime); AU.sfx('gold'); }
            this.boostMeter = Math.min(100, this.boostMeter + 25);
            this.burst(e.x, e.y, 14, C.lime, P.SPARK, 280);
            this.emitHud(true);
          } else {
            this.streak++; this.fishCount++;
            var nm = Math.min(8, 1 + Math.floor(this.streak / 6));
            if (nm !== this.mult) {
              this.mult = nm; this.bestMult = Math.max(this.bestMult, nm);
              this.toast('COMBO ×' + nm); this.cam.kick(0.14);
              this.parts.spawn(P.RING, cx, cy, 0, 0, 0.45, 30, C.gold, 0, 0);
            }
            this.bestMult = Math.max(this.bestMult, this.mult);
            var base = e.gold ? 100 : 10;
            var pts = base * this.mult * (this.boostT > 0 ? 2 : 1);
            this.addScore(pts, e.x, e.y - 16, '+' + pts, e.gold ? C.gold : C.cyan);
            this.boostMeter = Math.min(100, this.boostMeter + (e.gold ? 100 : 7));
            p.pouch = Math.min(1, p.pouch + (e.gold ? 0.6 : 0.16));
            this.burst(e.x, e.y, e.gold ? 20 : 7, e.gold ? C.gold : C.cyan, P.SPARK, e.gold ? 340 : 200);
            if (e.gold) {
              AU.sfx('gold'); this.cam.kick(0.3); this.flash = 0.22; this.flashCol = C.gold;
              this.parts.spawn(P.RING, e.x, e.y, 0, 0, 0.5, 26, C.gold, 0, 0);
              this.toast('GOLDEN FISH!');
            } else AU.sfx('fish', this.streak);
            this.emitHud(true);
          }
        }
        continue;
      }

      if (e.t === 'gap' || e.t === 'ramp') continue;

      var ex1, ex2, ey1, ey2;
      if (e.t === 'crab') { ex1 = e.x - 19; ex2 = e.x + 19; ey1 = gy - 30; ey2 = gy; }
      else if (e.t === 'buoy') { ex1 = e.x - 14; ex2 = e.x + 14; ey1 = gy - 50; ey2 = gy; }
      else if (e.t === 'gull') { ex1 = e.x - 19; ex2 = e.x + 22; ey1 = e.y - 13; ey2 = e.y + 11; }
      else if (e.t === 'banner') { ex1 = e.x + 4; ex2 = e.x + e.w - 4; ey1 = this.view.top - 400; ey2 = gy - e.clear; }
      else continue;

      if (rx > ex1 && lx < ex2 && bot > ey1 && top < ey2) {
        if (this.boostT > 0) {
          this.smash(e);
          this.addScore(25 * this.mult, e.x, ey1 - 20, '+' + 25 * this.mult, C.cyan);
          this.cam.kick(0.2);
        } else if (p.invuln > 0) {
          continue;
        } else if (p.slamming && (e.t === 'crab' || e.t === 'buoy') && bot < ey1 + 34) {
          this.smash(e);
          this.addScore(30 * this.mult, e.x, ey1 - 20, '+' + 30 * this.mult, C.coral);
          p.vy = -430; p.flapUsed = false;
          this.cam.kick(0.35); this.freeze = 0.04;
        } else {
          if (e.t !== 'banner') this.smash(e);
          this.crash(e.t);
          return;
        }
      }
    }
  };

  /* ------------------------------ render ------------------------------ */
  Game.prototype.draw = function () {
    var g = this.g, v = this.view, p = this.p, i, e;
    g.setTransform(v.dpr, 0, 0, v.dpr, 0, 0);
    g.translate(v.offX, v.offY);
    g.scale(v.scale, v.scale);

    g.save();
    var cx = v.vw * 0.5, cy = v.vh * 0.55;
    g.translate(cx + this.cam.x, cy + this.cam.y);
    g.rotate(this.cam.rot);
    g.scale(this.cam.zoom, this.cam.zoom);
    g.translate(-cx, -cy);

    g.fillStyle = C.ink;
    g.fillRect(v.left - 40, v.top - 40, v.right - v.left + 80, v.bottom - v.top + 80);

    var dt = 1 / 60;
    S.sky(g, v, this.t, this.state === 'pause' ? 0 : dt);
    S.islands(g, v, this.camX, this.t);
    S.sea(g, v, this.camX, this.t);
    S.dunes(g, v, this.camX, this.t);
    S.beach(g, v, this.camX, this.t);
    S.mid(g, v, this.camX, this.t);

    var gaps = [];
    for (i = 0; i < this.ents.length; i++) {
      e = this.ents[i];
      if (e.t === 'gap' && !e.dead) gaps.push(e);
    }
    S.deck(g, v, this.camX, gaps);
    S.fore(g, v, this.camX, this.t);

    var sx, gy = v.gy;
    // ground actors
    for (i = 0; i < this.ents.length; i++) {
      e = this.ents[i];
      if (e.dead) continue;
      sx = e.x - this.camX;
      if (sx < -160 || sx > v.vw + 200) continue;
      if (e.t === 'ramp') A.ramp(g, sx, gy, e.w, e.h);
      else if (e.t === 'banner') A.banner(g, sx, gy - e.clear, e.w, 108, this.t, v.top);
      else if (e.t === 'crab') { A.shadow(g, sx, gy + 2, 20, 0.3); A.crab(g, sx, gy - 14, this.t + e.ph); }
      else if (e.t === 'buoy') { A.shadow(g, sx, gy + 2, 16, 0.3); A.buoy(g, sx, gy, this.t); }
    }

    // rider shadow
    var airH = clamp((gy - p.y) / 220, 0, 1);
    var menuMode = this.state === 'menu';
    A.shadow(g, p.x, gy + 3, (menuMode ? 48 : 34) * (1 - airH * 0.45), 0.34 * (1 - airH * 0.6));

    if (menuMode) {
      g.save();
      g.globalCompositeOperation = 'lighter';
      var spot = g.createRadialGradient(p.x, gy - 60, 8, p.x, gy - 60, 190);
      spot.addColorStop(0, 'rgba(255,176,32,.30)');
      spot.addColorStop(0.5, 'rgba(255,61,139,.12)');
      spot.addColorStop(1, 'rgba(255,61,139,0)');
      g.fillStyle = spot;
      g.beginPath(); g.arc(p.x, gy - 60, 190, 0, TAU); g.fill();
      g.restore();
    }

    // rider
    var blinkOut = p.invuln > 0 && Math.floor(this.t * 22) % 2 === 0;
    if (!blinkOut) {
      g.save();
      g.translate(p.x, p.y);
      if (menuMode) g.scale(1.45, 1.45);
      A.rider(g, {
        duck: p.duck, flap: p.flap, lean: p.lean, sx: p.sx, sy: p.sy,
        wheel: p.wheel, crank: p.crank, speed: this.speed, vy: p.vy,
        boost: this.boostT > 0 ? clamp(this.boostT / 0.4, 0, 1) : 0,
        pouch: p.pouch, blink: p.blink, hurt: p.hurt > 0
      });
      g.restore();
    }

    // airborne actors + pickups
    for (i = 0; i < this.ents.length; i++) {
      e = this.ents[i];
      if (e.dead) continue;
      sx = e.x - this.camX;
      if (sx < -80 || sx > v.vw + 120) continue;
      if (e.t === 'fish') A.fish(g, sx, e.y, this.t + e.ph, e.gold, e.gold ? 1.25 : 1);
      else if (e.t === 'feather') A.feather(g, sx, e.y, this.t + e.ph);
      else if (e.t === 'gull') A.gull(g, sx, e.y, this.t + e.ph);
    }

    this.parts.draw(g, this.camX);
    this.floats.draw(g, this.camX);

    // boost speed lines
    if (this.boostT > 0) {
      g.save();
      g.globalCompositeOperation = 'lighter';
      var a = clamp(this.boostT / 3.4, 0, 1);
      for (i = 0; i < 14; i++) {
        var ly = v.top + ((this.t * 900 + i * 137) % (v.bottom - v.top));
        var lw = 90 + (i % 5) * 60;
        g.fillStyle = i % 3 ? 'rgba(55,225,255,' + (0.12 * a).toFixed(3) + ')' : 'rgba(255,61,139,' + (0.12 * a).toFixed(3) + ')';
        g.fillRect(v.right - ((this.t * 1500 + i * 211) % (v.right - v.left + 400)), ly, lw, 2);
      }
      g.restore();
    }

    g.restore();

    // full-screen flash
    if (this.flash > 0.001) {
      g.save();
      g.globalCompositeOperation = 'lighter';
      g.globalAlpha = this.flash * 0.4;
      g.fillStyle = this.flashCol;
      g.fillRect(v.left, v.top, v.right - v.left, v.bottom - v.top);
      g.restore();
    }

    S.vignette(g, v);
    if (!this.lowFx) S.grain(g, v, this.t);

    if (this.state === 'pause') {
      g.save();
      g.fillStyle = 'rgba(13,6,32,.35)';
      g.fillRect(v.left, v.top, v.right - v.left, v.bottom - v.top);
      g.restore();
    }
  };

  global.PPGame = Game;
  global.PPDiff = DIFF;
})(window);