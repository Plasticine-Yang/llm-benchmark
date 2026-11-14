/* PELICAN PEDAL — shared math, palette, storage, particle + camera systems */
(function (global) {
  'use strict';

  var TAU = Math.PI * 2;

  var C = {
    ink: '#0D0620', night: '#1B0F33', dusk: '#33165A', violet: '#6A2E8F',
    magenta: '#FF3D8B', coral: '#FF6B4A', amber: '#FFB020', gold: '#FFD84D',
    teal: '#12C2B0', cyan: '#37E1FF', lime: '#B8F135', danger: '#FF4757',
    bone: '#FFF3E2', sand: '#F2C48A', sandDark: '#D89B5E',
    sea: '#1C7FA8', seaDeep: '#123C6B', slate: '#4A5A87', slateDark: '#2E3A5C',
    chrome: '#D8E4F0', pouch: '#FF9E5E', pouchDeep: '#F2704B'
  };

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function rand(a, b) { return a + Math.random() * (b - a); }
  function randi(a, b) { return Math.floor(a + Math.random() * (b - a + 1)); }
  function pick(arr) { return arr[(Math.random() * arr.length) | 0]; }
  function chance(p) { return Math.random() < p; }
  function approach(v, t, s) { return v < t ? Math.min(v + s, t) : Math.max(v - s, t); }
  function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }
  function easeOutBack(t) { var c = 1.7; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); }
  function fmt(n) { return Math.floor(n).toLocaleString('en-US'); }

  /* ------------------------------ storage ------------------------------ */
  var KEY = 'pelican-pedal.v1';

  function readAll() {
    try {
      var raw = global.localStorage.getItem(KEY);
      if (!raw) return {};
      var o = JSON.parse(raw);
      return (o && typeof o === 'object') ? o : {};
    } catch (e) { return {}; }
  }
  function writeAll(o) {
    try { global.localStorage.setItem(KEY, JSON.stringify(o)); } catch (e) { /* private mode */ }
  }

  var Store = {
    get: function (k, d) { var o = readAll(); return o[k] === undefined ? d : o[k]; },
    set: function (k, v) { var o = readAll(); o[k] = v; writeAll(o); }
  };

  var Scores = {
    list: function () {
      var l = Store.get('scores', []);
      return Array.isArray(l) ? l : [];
    },
    best: function () {
      var l = Scores.list();
      return l.length ? l[0].score : 0;
    },
    qualifies: function (score) {
      var l = Scores.list();
      return score > 0 && (l.length < 10 || score > l[l.length - 1].score);
    },
    add: function (entry) {
      var l = Scores.list();
      entry.id = 'r' + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36);
      l.push(entry);
      l.sort(function (a, b) { return b.score - a.score; });
      l = l.slice(0, 10);
      Store.set('scores', l);
      return l.indexOf(entry);
    },
    rename: function (id, name) {
      var l = Scores.list();
      for (var i = 0; i < l.length; i++) if (l[i].id === id) l[i].name = name;
      Store.set('scores', l);
    },
    clear: function () { Store.set('scores', []); }
  };

  /* ----------------------------- particles ----------------------------- */
  /* Fixed-capacity pool: no allocation during play. */
  function Particles(cap) {
    this.cap = cap || 720;
    this.n = 0;
    var n = this.cap;
    this.x = new Float32Array(n); this.y = new Float32Array(n);
    this.vx = new Float32Array(n); this.vy = new Float32Array(n);
    this.life = new Float32Array(n); this.max = new Float32Array(n);
    this.size = new Float32Array(n); this.rot = new Float32Array(n);
    this.spin = new Float32Array(n); this.grav = new Float32Array(n);
    this.drag = new Float32Array(n);
    this.kind = new Uint8Array(n);   // 0 spark 1 dust 2 feather 3 ring 4 shard 5 streak
    this.col = new Array(n);
  }
  // kind constants
  var SPARK = 0, DUST = 1, FEATHER = 2, RING = 3, SHARD = 4, STREAK = 5;

  Particles.prototype.spawn = function (kind, x, y, vx, vy, life, size, col, grav, drag, spin) {
    var i;
    if (this.n < this.cap) { i = this.n++; }
    else { i = (Math.random() * this.cap) | 0; }
    this.x[i] = x; this.y[i] = y; this.vx[i] = vx; this.vy[i] = vy;
    this.life[i] = life; this.max[i] = life; this.size[i] = size;
    this.col[i] = col; this.grav[i] = grav === undefined ? 900 : grav;
    this.drag[i] = drag === undefined ? 0.6 : drag;
    this.rot[i] = Math.random() * TAU; this.spin[i] = spin === undefined ? rand(-8, 8) : spin;
    this.kind[i] = kind;
    return i;
  };
  Particles.prototype.update = function (dt) {
    var i = 0, n = this.n;
    while (i < n) {
      this.life[i] -= dt;
      if (this.life[i] <= 0) {
        n--;
        this.x[i] = this.x[n]; this.y[i] = this.y[n]; this.vx[i] = this.vx[n]; this.vy[i] = this.vy[n];
        this.life[i] = this.life[n]; this.max[i] = this.max[n]; this.size[i] = this.size[n];
        this.rot[i] = this.rot[n]; this.spin[i] = this.spin[n]; this.grav[i] = this.grav[n];
        this.drag[i] = this.drag[n]; this.kind[i] = this.kind[n]; this.col[i] = this.col[n];
        continue;
      }
      var d = Math.max(0, 1 - this.drag[i] * dt);
      this.vx[i] *= d;
      this.vy[i] = this.vy[i] * d + this.grav[i] * dt;
      this.x[i] += this.vx[i] * dt;
      this.y[i] += this.vy[i] * dt;
      this.rot[i] += this.spin[i] * dt;
      i++;
    }
    this.n = n;
  };
  Particles.prototype.clear = function () { this.n = 0; };

  Particles.prototype.draw = function (g, camX) {
    var n = this.n, i, t, s, k;
    // additive pass: sparks / rings / streaks
    g.globalCompositeOperation = 'lighter';
    for (i = 0; i < n; i++) {
      k = this.kind[i];
      if (k === DUST || k === FEATHER || k === SHARD) continue;
      t = this.life[i] / this.max[i];
      var px = this.x[i] - camX, py = this.y[i];
      g.fillStyle = this.col[i];
      if (k === RING) {
        s = this.size[i] * (1.6 - t * 1.1);
        g.globalAlpha = t * 0.75;
        g.lineWidth = Math.max(1, 5 * t);
        g.strokeStyle = this.col[i];
        g.beginPath(); g.arc(px, py, s, 0, TAU); g.stroke();
      } else if (k === STREAK) {
        s = this.size[i];
        var len = s * (0.9 + t * 1.5), hh = Math.max(0.9, s * 0.062);
        g.globalAlpha = t * 0.5;
        g.beginPath();
        g.moveTo(px, py);
        g.quadraticCurveTo(px + len * 0.5, py - hh, px + len, py);
        g.quadraticCurveTo(px + len * 0.5, py + hh, px, py);
        g.fill();
      } else {
        s = this.size[i] * (0.35 + t * 0.8);
        g.globalAlpha = Math.min(1, t * 1.5);
        g.beginPath(); g.arc(px, py, s, 0, TAU); g.fill();
      }
    }
    // normal pass: dust / feathers / shards
    g.globalCompositeOperation = 'source-over';
    for (i = 0; i < n; i++) {
      k = this.kind[i];
      if (k === SPARK || k === RING || k === STREAK) continue;
      t = this.life[i] / this.max[i];
      g.save();
      g.translate(this.x[i] - camX, this.y[i]);
      g.rotate(this.rot[i]);
      g.globalAlpha = k === DUST ? t * 0.5 : Math.min(1, t * 1.8);
      g.fillStyle = this.col[i];
      s = this.size[i];
      if (k === DUST) {
        g.beginPath(); g.arc(0, 0, s * (1.5 - t * 0.6), 0, TAU); g.fill();
      } else if (k === FEATHER) {
        g.beginPath();
        g.moveTo(0, -s); g.quadraticCurveTo(s * 0.72, -s * 0.1, 0, s);
        g.quadraticCurveTo(-s * 0.72, -s * 0.1, 0, -s);
        g.fill();
      } else {
        g.fillRect(-s * 0.5, -s * 0.5, s, s * 0.8);
      }
      g.restore();
    }
    g.globalAlpha = 1;
  };

  /* --------------------------- floating text --------------------------- */
  function Floaters(cap) { this.cap = cap || 28; this.items = []; }
  Floaters.prototype.add = function (x, y, text, col, size, vy) {
    if (this.items.length >= this.cap) this.items.shift();
    this.items.push({ x: x, y: y, t: 0, life: 0.95, text: text, col: col || C.gold, size: size || 20, vy: vy === undefined ? -78 : vy });
  };
  Floaters.prototype.update = function (dt) {
    for (var i = this.items.length - 1; i >= 0; i--) {
      var f = this.items[i];
      f.t += dt; f.y += f.vy * dt; f.vy *= Math.max(0, 1 - 1.6 * dt);
      if (f.t >= f.life) this.items.splice(i, 1);
    }
  };
  Floaters.prototype.clear = function () { this.items.length = 0; };
  Floaters.prototype.draw = function (g, camX) {
    for (var i = 0; i < this.items.length; i++) {
      var f = this.items[i], p = f.t / f.life;
      var sc = p < 0.2 ? easeOutBack(p / 0.2) : 1;
      g.save();
      g.globalAlpha = p > 0.65 ? 1 - (p - 0.65) / 0.35 : 1;
      g.translate(f.x - camX, f.y);
      g.scale(sc, sc);
      g.font = '800 ' + f.size + 'px ui-monospace, Consolas, monospace';
      g.textAlign = 'center'; g.textBaseline = 'middle';
      g.lineWidth = 4; g.strokeStyle = 'rgba(13,6,32,.8)';
      g.strokeText(f.text, 0, 0);
      g.fillStyle = f.col;
      g.fillText(f.text, 0, 0);
      g.restore();
    }
    g.globalAlpha = 1;
  };

  /* ------------------------------ camera ------------------------------- */
  function Camera() { this.trauma = 0; this.x = 0; this.y = 0; this.rot = 0; this.zoom = 1; this.t = 0; }
  Camera.prototype.kick = function (amount) { this.trauma = Math.min(1, this.trauma + amount); };
  Camera.prototype.update = function (dt, targetZoom) {
    this.t += dt;
    this.trauma = Math.max(0, this.trauma - dt * 1.75);
    var s = this.trauma * this.trauma;
    var a = this.t * 47;
    this.x = (Math.sin(a * 1.7) + Math.sin(a * 3.1) * 0.5) * 17 * s;
    this.y = (Math.cos(a * 2.3) + Math.sin(a * 4.7) * 0.5) * 15 * s;
    this.rot = Math.sin(a * 1.9) * 0.022 * s;
    this.zoom = lerp(this.zoom, targetZoom === undefined ? 1 : targetZoom, Math.min(1, dt * 6));
  };
  Camera.prototype.reset = function () { this.trauma = 0; this.x = this.y = this.rot = 0; this.zoom = 1; };

  global.PP = {
    TAU: TAU, C: C,
    clamp: clamp, lerp: lerp, rand: rand, randi: randi, pick: pick, chance: chance,
    approach: approach, easeOutCubic: easeOutCubic, easeOutBack: easeOutBack, fmt: fmt,
    Store: Store, Scores: Scores,
    Particles: Particles, Floaters: Floaters, Camera: Camera,
    SPARK: SPARK, DUST: DUST, FEATHER: FEATHER, RING: RING, SHARD: SHARD, STREAK: STREAK
  };
})(window);