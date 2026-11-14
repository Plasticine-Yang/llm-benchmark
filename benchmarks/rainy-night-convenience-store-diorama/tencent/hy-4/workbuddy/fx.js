/* Subtle life: rain, ripples, eave drips, glass runnels, flicker, doors, steam, signals */
'use strict';

const FX = {
  rainSets: [], ripples: [], drips: [], glassDrops: [], steam: [],
  flickerables: [], reflectables: [], doorPool: null,
  rainY: 18, wind: -0.55
};

FX.init = function () {
  this.buildRain();
  this.buildRipples();
  this.buildDrips();
  this.buildGlassDrops();
  this.buildSteam();
  this.buildWaterThreads();

  for (const g of (W.anim.signGlows || [])) this.flickerables.push({ o: g, base: g.material.opacity, k: W.rr(0, 6), fast: true });
  for (const g of (W.anim.vendingGlows || [])) this.flickerables.push({ o: g, base: g.material.opacity, k: W.rr(0, 6), fast: false });
  for (const g of (W.anim.lampGlows || [])) this.flickerables.push({ o: g, base: g.material.opacity, k: W.rr(0, 6), fast: false });
  for (const p of (W.anim.reflect || [])) this.reflectables.push({ o: p, base: p.material.opacity, k: W.rr(0, 6) });

  this.doorPool = pool(-3.95, -1.55, 3.2, 2.0, 0xffd49a, 0.0, 0.176);
  this.doorPool.renderOrder = 4;

  onTick((dt, t) => this.update(dt, t));
};

/* ---------------- rain ---------------- */
FX.buildRain = function () {
  const specs = [
    { n: 1450, color: 0xd2ecff, op: 0.42, len: [0.45, 1.0], speed: [15, 24] },
    { n: 950, color: 0x8dbce2, op: 0.22, len: [0.30, 0.65], speed: [10, 17] }
  ];
  for (const s of specs) {
    const pos = new Float32Array(s.n * 6);
    const drops = [];
    for (let i = 0; i < s.n; i++) {
      drops.push(this.spawnDrop(true));
      const d = drops[i];
      pos[i * 6] = d.x; pos[i * 6 + 1] = d.y; pos[i * 6 + 2] = d.z;
      pos[i * 6 + 3] = d.x + this.wind * d.len * 0.10; pos[i * 6 + 4] = d.y - d.len; pos[i * 6 + 5] = d.z;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const m = new THREE.LineBasicMaterial({
      color: s.color, transparent: true, opacity: s.op,
      blending: THREE.AdditiveBlending, depthWrite: false, depthTest: true
    });
    const lines = new THREE.LineSegments(g, m);
    lines.frustumCulled = false;
    lines.renderOrder = 6;
    W.scene.add(lines);
    this.rainSets.push({ pos, drops, geo: g, speed: s.speed, len: s.len, n: s.n, mat: m });
  }
};

FX.spawnDrop = function (initial) {
  let x = W.rr(-16.5, 16.5), z = W.rr(-16.5, 16.5), y = initial ? W.rr(0, 19) : W.rr(15, 20);
  /* keep rain out of the shop interior */
  if (x > -8.9 && x < 2.4 && z > -10.5 && z < -2.3) z = W.rr(0.0, 12.0);
  return { x, y, z, len: W.rr(0.3, 1.0), v: W.rr(12, 24) };
};

/* ---------------- ripples ---------------- */
FX.buildRipples = function () {
  for (let i = 0; i < 52; i++) {
    const mat = texMat(W.tex.ring, 0, true);
    const m = flatQuad(1, 1, 0, -30, 0.044, mat, 0, 4);
    m.visible = false;
    this.ripples.push({ m, mat, active: false, t: 0, dur: 1, size: 1 });
  }
};
FX.spawnRipple = function (x, z, scale) {
  for (const r of this.ripples) {
    if (r.active) continue;
    r.active = true; r.t = 0; r.dur = W.rr(0.9, 1.6);
    r.size = (scale || 1) * W.rr(0.55, 1.15);
    r.m.position.set(x + W.rr(-0.12, 0.12), 0.044 + W.rr(0, 0.004), z + W.rr(-0.12, 0.12));
    r.m.visible = true;
    r.mat.opacity = 0.62;
    return;
  }
};

/* ---------------- eave drips ---------------- */
FX.buildDrips = function () {
  const pts = W.anim.eave || [];
  for (let i = 0; i < 34; i++) {
    const p = pts[Math.floor(W.rand() * pts.length)] || { x: 0, y: 3.8, z: -0.9 };
    const s = new THREE.Sprite(new THREE.SpriteMaterial({
      map: W.tex.drop, color: 0xd6efff, transparent: true, opacity: W.rr(0.35, 0.75),
      blending: THREE.AdditiveBlending, depthWrite: false
    }));
    s.scale.set(0.075, 0.25, 1);
    s.position.set(p.x, W.rr(0.2, 3.8), p.z);
    W.scene.add(s);
    this.drips.push({ s, x: p.x, z: p.z, y: s.position.y, v: W.rr(3.2, 5.4), wait: W.rr(0, 1.5) });
  }
};
FX.buildWaterThreads = function () {
  /* faint continuous runnels at a few canopy corners */
  const pts = [[-9.15, -0.90], [-6.2, -0.90], [-1.0, -0.90], [3.58, -0.90], [3.66, -4.0], [3.66, -8.4]];
  this.threads = [];
  for (const p of pts) {
    const mat = solidMat(0xa9d8f0, 0.10, true);
    const m = frontQuad(0.035, 3.55, p[0], 1.95, p[1] + 0.02, mat, { renderOrder: 6 });
    this.threads.push({ m, mat, k: W.rr(0, 6) });
  }
};

/* ---------------- rain running down the glass ---------------- */
FX.buildGlassDrops = function () {
  const panes = W.anim.panes || [];
  if (!panes.length) return;
  for (let i = 0; i < 40; i++) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({
      map: W.tex.drop, color: 0xdff3ff, transparent: true, opacity: W.rr(0.20, 0.55),
      blending: THREE.AdditiveBlending, depthWrite: false
    }));
    s.scale.set(W.rr(0.045, 0.085), W.rr(0.18, 0.38), 1);
    W.scene.add(s);
    this.glassDrops.push({ s, pane: null, y: 0, v: 0, wait: W.rr(0, 4) });
  }
};
FX.resetGlassDrop = function (d, panes) {
  const p = panes[Math.floor(W.rand() * panes.length)];
  d.pane = p;
  d.y = p.y + p.h * W.rr(0.1, 0.48);
  d.v = W.rr(0.28, 0.95);
  d.wait = W.rr(0, 3.5);
  if (p.dir === 'side') d.s.position.set(p.x + 0.03, d.y, p.z + W.rr(-p.w / 2 + 0.1, p.w / 2 - 0.1));
  else d.s.position.set(p.x + W.rr(-p.w / 2 + 0.1, p.w / 2 - 0.1), d.y, p.z + 0.03);
};

/* ---------------- steam from the oden counter ---------------- */
FX.buildSteam = function () {
  const o = W.anim.steam || { x: -1.85, y: 1.25, z: -3.55 };
  for (let i = 0; i < 10; i++) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({
      map: W.tex.soft, color: 0xfff2dc, transparent: true, opacity: 0,
      blending: THREE.AdditiveBlending, depthWrite: false, depthTest: true
    }));
    W.scene.add(s);
    this.steam.push({ s, t: W.rr(0, 3), dur: W.rr(2.2, 3.6), ox: W.rr(-0.55, 0.55), oz: W.rr(-0.14, 0.14), o });
  }
};

/* ---------------- per-frame ---------------- */
FX.update = function (dt, t) {
  /* rain */
  for (const set of this.rainSets) {
    const p = set.pos;
    for (let i = 0; i < set.n; i++) {
      const d = set.drops[i];
      d.y -= d.v * dt;
      d.x += this.wind * dt;
      if (d.y < 0.05) {
        const n = this.spawnDrop(false);
        d.x = n.x; d.y = n.y; d.z = n.z; d.v = n.v; d.len = n.len;
      }
      const j = i * 6;
      p[j] = d.x; p[j + 1] = d.y; p[j + 2] = d.z;
      p[j + 3] = d.x + this.wind * d.len * 0.10; p[j + 4] = d.y - d.len; p[j + 5] = d.z + 0.03;
    }
    set.geo.attributes.position.needsUpdate = true;
    set.mat.opacity = (set.mat.opacity * 0.9 + (set.speed[0] < 18 ? 0.22 : 0.42) * 0.1) * (1 + Math.sin(t * 0.7) * 0.02);
  }

  /* ambient ripples on puddles */
  if (W.rand() < dt * 13) {
    const ps = W.anim.puddles || [];
    if (ps.length) { const p = ps[Math.floor(W.rand() * ps.length)]; this.spawnRipple(p.x, p.z, p.r); }
  }
  for (const r of this.ripples) {
    if (!r.active) continue;
    r.t += dt;
    const k = r.t / r.dur;
    if (k >= 1) { r.active = false; r.m.visible = false; continue; }
    const s = (0.18 + k * 1.35) * r.size;
    r.m.scale.set(s, 1, s);
    r.mat.opacity = 0.62 * (1 - k) * (1 - k);
  }

  /* eave drips */
  for (const d of this.drips) {
    if (d.wait > 0) { d.wait -= dt; d.s.material.opacity = 0; continue; }
    d.s.material.opacity = 0.62;
    d.y -= d.v * dt;
    d.s.position.y = d.y;
    if (d.y < 0.20) {
      this.spawnRipple(d.x, d.z + 0.10, 0.55);
      const p = (W.anim.eave || [])[Math.floor(W.rand() * (W.anim.eave || [1]).length)] || { x: 0, z: -0.9 };
      d.x = p.x; d.z = p.z; d.y = 3.80; d.v = W.rr(3.2, 5.4); d.wait = W.rr(0.25, 2.4);
      d.s.position.set(d.x, d.y, d.z);
    }
  }
  for (const th of this.threads || []) th.mat.opacity = 0.07 + 0.045 * (0.5 + 0.5 * Math.sin(t * 2.1 + th.k));

  /* rain sliding down the shop windows */
  if (W.anim.glassTex) W.anim.glassTex.offset.y = (W.anim.glassTex.offset.y - dt * 0.075) % 1;
  const panes = W.anim.panes || [];
  for (const d of this.glassDrops) {
    if (!d.pane) { if (panes.length) this.resetGlassDrop(d, panes); continue; }
    if (d.wait > 0) { d.wait -= dt; d.s.material.opacity = 0; continue; }
    d.y -= d.v * dt;
    d.v += dt * 0.55;
    d.s.position.y = d.y;
    d.s.material.opacity = 0.42 * Math.min(1, (d.y - (d.pane.y - d.pane.h / 2)) / 0.5);
    if (d.y < d.pane.y - d.pane.h / 2 + 0.08) this.resetGlassDrop(d, panes);
  }
  if (W.anim.glassMat) W.anim.glassMat.opacity = 0.15 + 0.025 * Math.sin(t * 0.8);

  /* neon / lamp flicker */
  for (const f of this.flickerables) {
    let v = 0.91 + 0.09 * Math.sin(t * (f.fast ? 1.9 : 0.9) + f.k) + 0.02 * Math.sin(t * 7.3 + f.k * 3);
    if (f.fast) {
      const phase = (t * 0.16 + f.k * 0.1) % 1;
      if (phase > 0.972 && phase < 0.985) v *= 0.28;
      if (phase > 0.985 && phase < 0.993) v *= 0.65;
    }
    f.o.material.opacity = f.base * clamp(v, 0.15, 1.15);
  }
  for (const r of this.reflectables) {
    r.o.material.opacity = r.base * (0.88 + 0.12 * Math.sin(t * 1.3 + r.k));
  }
  /* one interior fluorescent tube flickers briefly now and then */
  if (W.anim.ceilingMat) {
    const ph = (t * 0.12) % 1;
    const dim = (ph > 0.93 && ph < 0.945) || (ph > 0.955 && ph < 0.962);
    W.anim.ceilingMat.color.setHex(dim ? 0x8d8468 : 0xfff6da);
  }

  /* automatic sliding door */
  const cycle = (t + 2.0) % 15.0;
  let open = 0;
  if (cycle < 7.4) open = 0;
  else if (cycle < 8.7) open = smooth((cycle - 7.4) / 1.3);
  else if (cycle < 12.2) open = 1;
  else if (cycle < 13.6) open = 1 - smooth((cycle - 12.2) / 1.4);
  if (W.anim.doorL) W.anim.doorL.position.x = W.anim.doorBaseL - open * 1.06;
  if (W.anim.doorR) W.anim.doorR.position.x = W.anim.doorBaseR + open * 1.06;
  if (W.anim.doorSensor) W.anim.doorSensor.material.color.setHex(open > 0.2 ? 0x8bf0a8 : 0xe8756a);
  if (this.doorPool) this.doorPool.material.opacity = 0.06 + open * 0.30;

  /* steam */
  for (const s of this.steam) {
    s.t += dt;
    const k = (s.t % s.dur) / s.dur;
    s.s.position.set(s.o.x + s.ox + Math.sin(k * 5 + s.ox * 6) * 0.12, s.o.y + k * 1.25, s.o.z + s.oz + k * 0.18);
    const sc = 0.28 + k * 0.85;
    s.s.scale.set(sc, sc * 1.3, 1);
    s.s.material.opacity = 0.16 * Math.sin(Math.PI * k);
  }

  /* distant traffic signal, gentle cycle */
  const sigs = W.anim.traffic || [];
  for (let si = 0; si < sigs.length; si++) {
    const sg = sigs[si];
    const ph = ((t + si * 5.5) % 19.0);
    let idx = 0; // 0 red, 1 yellow, 2 green (top to bottom)
    if (ph < 8.0) idx = 0;
    else if (ph < 16.0) idx = 2;
    else if (ph < 17.6) idx = 1;
    else idx = 0;
    const cols = [0xff5f52, 0xffc95a, 0x67d894];
    for (let i = 0; i < 3; i++) {
      const on = i === idx;
      sg.lamps[i].color.setHex(on ? cols[i] : 0x35414d);
      sg.glows[i].material.color.setHex(cols[i]);
      sg.glows[i].material.opacity = on ? (0.30 + 0.05 * Math.sin(t * 1.7)) : 0;
    }
  }
  if (W.anim.trafficPool) {
    const ph = (t % 19.0);
    W.anim.trafficPool.material.color.setHex(ph < 8 ? 0xd8584a : (ph < 16 ? 0x57b57f : 0xd9a353));
  }
};

function smooth(k) { k = clamp(k, 0, 1); return k * k * (3 - 2 * k); }
