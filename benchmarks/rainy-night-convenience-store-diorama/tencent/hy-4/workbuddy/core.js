/* Rainy-night convenience store diorama — core renderer, cel materials, orbit camera */
'use strict';

const W = {
  scene: null, camera: null, renderer: null, canvas: null,
  edgeStrong: [], edgeFine: [],
  matCache: new Map(), geoCache: new Map(),
  glows: [], ticks: [], anim: {}, tex: {},
  time: 0, rand: null
};

/* deterministic pseudo random */
(function () {
  let s = 20261114;
  W.rand = function () {
    s |= 0; s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  W.rr = function (a, b) { return a + (b - a) * W.rand(); };
  W.ri = function (a, b) { return Math.floor(W.rr(a, b + 1)); };
  W.pick = function (arr) { return arr[Math.floor(W.rand() * arr.length)]; };
})();

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const FONT = '"Yu Gothic","Hiragino Kaku Gothic ProN","Meiryo","Microsoft YaHei",sans-serif';

function tint(hex, f) {
  const c = new THREE.Color(hex);
  c.r = clamp(c.r * f, 0, 1); c.g = clamp(c.g * f, 0, 1); c.b = clamp(c.b * f, 0, 1);
  return c.getHex();
}
function mixHex(a, b, t) {
  const ca = new THREE.Color(a), cb = new THREE.Color(b);
  return new THREE.Color(ca.r + (cb.r - ca.r) * t, ca.g + (cb.g - ca.g) * t, ca.b + (cb.b - ca.b) * t).getHex();
}

/* ---------- textures ---------- */
function makeTexture(w, h, draw, opts) {
  opts = opts || {};
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  const c = cv.getContext('2d');
  draw(c, w, h);
  const t = new THREE.CanvasTexture(cv);
  t.anisotropy = 8;
  if (opts.repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(opts.repeat[0], opts.repeat[1]); }
  if (opts.wrapY) { t.wrapT = THREE.RepeatWrapping; }
  t.needsUpdate = true;
  return t;
}

function radialTexture(inner, outer) {
  return makeTexture(128, 128, (c, w, h) => {
    const g = c.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    g.addColorStop(0, inner); g.addColorStop(0.42, outer || 'rgba(255,255,255,0.35)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = g; c.fillRect(0, 0, w, h);
  });
}

function initCore() {
  const canvas = document.getElementById('stage');
  W.canvas = canvas;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.setClearColor(0x000000, 0);
  renderer.sortObjects = true;
  W.renderer = renderer;

  const scene = new THREE.Scene();
  W.scene = scene;
  const camera = new THREE.PerspectiveCamera(32, window.innerWidth / window.innerHeight, 0.5, 300);
  W.camera = camera;

  W.tex.glow = radialTexture('rgba(255,255,255,1)', 'rgba(255,255,255,0.30)');
  W.tex.shadow = radialTexture('rgba(0,0,0,0.85)', 'rgba(0,0,0,0.32)');
  W.tex.soft = makeTexture(128, 128, (c, w, h) => {
    const g = c.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    g.addColorStop(0, 'rgba(255,255,255,0.95)');
    g.addColorStop(0.35, 'rgba(255,255,255,0.45)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = g; c.fillRect(0, 0, w, h);
  });
  W.tex.ring = makeTexture(128, 128, (c, w, h) => {
    c.clearRect(0, 0, w, h);
    c.strokeStyle = 'rgba(255,255,255,0.95)';
    c.lineWidth = 4; c.beginPath(); c.arc(64, 64, 48, 0, Math.PI * 2); c.stroke();
    c.strokeStyle = 'rgba(255,255,255,0.35)';
    c.lineWidth = 2; c.beginPath(); c.arc(64, 64, 36, 0, Math.PI * 2); c.stroke();
  });
  W.tex.drop = makeTexture(32, 64, (c, w, h) => {
    const g = c.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, 'rgba(255,255,255,0)');
    g.addColorStop(0.5, 'rgba(255,255,255,0.75)');
    g.addColorStop(0.92, 'rgba(255,255,255,1)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = g; c.beginPath();
    c.moveTo(w / 2 - 3, 2); c.lineTo(w / 2 + 3, 2); c.lineTo(w / 2 + 5, h - 4);
    c.quadraticCurveTo(w / 2, h + 2, w / 2 - 5, h - 4); c.closePath(); c.fill();
  });

  initControls();
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight, false);
  });
}

/* ---------- cel-shaded box helpers ---------- */
function faceMaterials(color, opts) {
  const key = color + '|' + (opts.shade === false ? 'f' : 's') + '|' + (opts.opacity || 1);
  if (W.matCache.has(key)) return W.matCache.get(key);
  const f = (k) => new THREE.MeshBasicMaterial({
    color: opts.shade === false ? color : tint(color, k),
    transparent: (opts.opacity || 1) < 1, opacity: opts.opacity || 1,
    depthWrite: (opts.opacity || 1) >= 1,
    polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1,
    side: THREE.FrontSide
  });
  const m = [f(0.84), f(0.74), f(1.24), f(0.60), f(1.0), f(0.79)];
  W.matCache.set(key, m);
  return m;
}

function boxGeo(w, h, d) {
  const key = w.toFixed(3) + '_' + h.toFixed(3) + '_' + d.toFixed(3);
  if (!W.geoCache.has(key)) W.geoCache.set(key, new THREE.BoxGeometry(w, h, d));
  return W.geoCache.get(key);
}

function pushEdges(geo, matrix, fine) {
  const eg = new THREE.EdgesGeometry(geo, 18);
  const p = eg.attributes.position.array;
  const v = new THREE.Vector3();
  const arr = fine ? W.edgeFine : W.edgeStrong;
  for (let i = 0; i < p.length; i += 3) {
    v.set(p[i], p[i + 1], p[i + 2]).applyMatrix4(matrix);
    arr.push(v.x, v.y, v.z);
  }
  eg.dispose();
}

function outlineChild(mesh, geo, color, opacity) {
  const eg = new THREE.EdgesGeometry(geo, 18);
  const l = new THREE.LineSegments(eg, new THREE.LineBasicMaterial({
    color: color === undefined ? 0x16203a : color, transparent: true,
    opacity: opacity === undefined ? 0.7 : opacity
  }));
  l.renderOrder = 4;
  mesh.add(l);
  return l;
}

/** axis-aligned / simply rotated box. opts: mat, shade, opacity, edge, fine, rot, outline */
function box(w, h, d, x, y, z, color, opts) {
  opts = opts || {};
  const geo = boxGeo(w, h, d);
  const mat = opts.mat || faceMaterials(color === undefined ? 0xffffff : color, opts);
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  if (opts.rot) m.rotation.set(opts.rot[0] || 0, opts.rot[1] || 0, opts.rot[2] || 0);
  if (opts.renderOrder !== undefined) m.renderOrder = opts.renderOrder;
  (opts.parent || W.scene).add(m);
  m.updateMatrix();
  if (opts.edge !== false) pushEdges(geo, m.matrix, !!opts.fine);
  if (opts.outline) outlineChild(m, geo);
  return m;
}

/** flat panel with baked rotation, world-space positioned */
function panel(w, h, x, y, z, rot, mat, opts) {
  opts = opts || {};
  const g = new THREE.PlaneGeometry(w, h);
  if (rot) {
    if (rot[0]) g.rotateX(rot[0]);
    if (rot[1]) g.rotateY(rot[1]);
    if (rot[2]) g.rotateZ(rot[2]);
  }
  const m = new THREE.Mesh(g, mat);
  m.position.set(x, y, z);
  if (opts.renderOrder !== undefined) m.renderOrder = opts.renderOrder;
  (opts.parent || W.scene).add(m);
  if (opts.edge) { m.updateMatrix(); pushEdges(g, m.matrix, true); }
  return m;
}

function solidMat(color, opacity, additive) {
  const op = opacity === undefined ? 1 : opacity;
  return new THREE.MeshBasicMaterial({
    color, transparent: op < 1 || !!additive, opacity: op,
    side: THREE.DoubleSide, depthWrite: op >= 1 && !additive,
    blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
    polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1
  });
}
function texMat(texture, opacity, additive) {
  const op = opacity === undefined ? 1 : opacity;
  return new THREE.MeshBasicMaterial({
    map: texture, transparent: op < 1 || !!additive, opacity: op,
    side: THREE.DoubleSide, depthWrite: op >= 1 && !additive,
    blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
    polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1
  });
}

/** horizontal quad, size w (x) by d (z) */
function floorQuad(w, d, x, z, y, mat, opts) {
  const o = Object.assign({}, opts || {});
  if (o.renderOrder === undefined) o.renderOrder = 1;
  return panel(w, d, x, y, z, [-Math.PI / 2, 0, 0], mat, o);
}
/** vertical quad facing +z */
function frontQuad(w, h, x, y, z, mat, opts) {
  return panel(w, h, x, y, z, [0, 0, 0], mat, opts);
}
/** vertical quad facing +x */
function sideQuad(w, h, x, y, z, mat, opts) {
  return panel(w, h, x, y, z, [0, Math.PI / 2, 0], mat, opts);
}
/** vertical quad facing -z */
function backQuad(w, h, x, y, z, mat, opts) {
  return panel(w, h, x, y, z, [0, Math.PI, 0], mat, opts);
}

/** additive camera-facing halo */
function glow(x, y, z, sx, sy, color, opacity, parent) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({
    map: W.tex.glow, color, transparent: true, opacity,
    blending: THREE.AdditiveBlending, depthWrite: false, depthTest: true
  }));
  s.position.set(x, y, z);
  s.scale.set(sx, sy, 1);
  (parent || W.scene).add(s);
  return s;
}

/** soft elliptical light pool on wet ground */
function pool(x, z, sx, sz, color, opacity, y) {
  const m = floorQuad(1, 1, x, z, y === undefined ? 0.035 : y,
    texMat(W.tex.glow, opacity, true), { renderOrder: 3 });
  m.material.color.setHex(color);
  m.scale.set(sx, 1, sz);
  return m;
}

/** soft contact shadow */
function shadow(x, z, sx, sz, opacity, y) {
  return floorQuad(1, 1, x, z, y === undefined ? 0.022 : y,
    texMat(W.tex.shadow, opacity, false), { renderOrder: 2 })
    .scale.set(sx, 1, sz);
}

function cylinder(rt, rb, h, x, y, z, color, opts) {
  opts = opts || {};
  const g = new THREE.CylinderGeometry(rt, rb, h, opts.seg || 10, 1, false);
  const m = new THREE.Mesh(g, opts.mat || faceMaterials(color, opts));
  m.position.set(x, y, z);
  if (opts.rot) m.rotation.set(opts.rot[0] || 0, opts.rot[1] || 0, opts.rot[2] || 0);
  (opts.parent || W.scene).add(m);
  m.updateMatrix();
  if (opts.edge !== false) pushEdges(g, m.matrix, !!opts.fine);
  return m;
}

function tube(points, radius, color, opacity) {
  const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(p[0], p[1], p[2])));
  const g = new THREE.TubeGeometry(curve, Math.max(12, points.length * 6), radius, 5, false);
  const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({
    color, transparent: opacity !== undefined && opacity < 1, opacity: opacity === undefined ? 1 : opacity
  }));
  W.scene.add(m);
  return m;
}

function finishEdges() {
  const mk = (arr, color, opacity, order) => {
    if (!arr.length) return;
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(arr, 3));
    const l = new THREE.LineSegments(g, new THREE.LineBasicMaterial({
      color, transparent: true, opacity, depthTest: true, depthWrite: false
    }));
    l.renderOrder = order;
    W.scene.add(l);
  };
  mk(W.edgeStrong, 0x111a2e, 0.72, 5);
  mk(W.edgeFine, 0x1a2740, 0.48, 5);
}

function onTick(fn) { W.ticks.push(fn); }

/* ---------- orbit / zoom / pan controls ---------- */
const CTRL = {
  theta: 0.60, phi: 1.135, radius: 40.0,
  target: new THREE.Vector3(0, 2.2, 0),
  vTheta: 0, vPhi: 0, lastInput: 0, dragging: false, pinch: false
};
W.CTRL = CTRL;

function initControls() {
  const el = W.canvas;
  let mode = 0, px = 0, py = 0, pinch = 0;
  const mark = () => { CTRL.lastInput = performance.now(); };

  el.addEventListener('pointerdown', e => {
    el.setPointerCapture(e.pointerId);
    mode = (e.button === 2 || e.shiftKey) ? 2 : 1;
    px = e.clientX; py = e.clientY;
    CTRL.dragging = true; CTRL.vTheta = CTRL.vPhi = 0;
    el.classList.add('dragging'); mark();
  });
  el.addEventListener('pointermove', e => {
    if (!CTRL.dragging || CTRL.pinch) return;
    const dx = e.clientX - px, dy = e.clientY - py;
    px = e.clientX; py = e.clientY;
    if (mode === 2) {
      const right = new THREE.Vector3().setFromMatrixColumn(W.camera.matrix, 0);
      const fwd = new THREE.Vector3(Math.cos(CTRL.theta), 0, -Math.sin(CTRL.theta));
      const k = CTRL.radius * 0.0011;
      CTRL.target.addScaledVector(right, -dx * k).addScaledVector(fwd, -dy * k);
      CTRL.target.x = clamp(CTRL.target.x, -7, 7);
      CTRL.target.z = clamp(CTRL.target.z, -7, 7);
      CTRL.target.y = clamp(CTRL.target.y, 0, 7);
    } else {
      CTRL.theta -= dx * 0.0055;
      CTRL.phi = clamp(CTRL.phi - dy * 0.0045, 0.22, 1.46);
      CTRL.vTheta = -dx * 0.0018;
      CTRL.vPhi = -dy * 0.0012;
    }
    mark();
  });
  const end = () => { CTRL.dragging = false; el.classList.remove('dragging'); mark(); };
  el.addEventListener('pointerup', end);
  el.addEventListener('pointercancel', end);
  el.addEventListener('contextmenu', e => e.preventDefault());
  el.addEventListener('wheel', e => {
    e.preventDefault();
    CTRL.radius = clamp(CTRL.radius * (1 + clamp(e.deltaY, -100, 100) * 0.0011), 15, 82);
    mark();
  }, { passive: false });
  el.addEventListener('dblclick', () => {
    CTRL.theta = 0.60; CTRL.phi = 1.135; CTRL.radius = 40.0;
    CTRL.target.set(0, 2.2, 0); mark();
  });

  /* touch pinch-zoom */
  const touches = new Map();
  el.addEventListener('touchstart', e => {
    for (const t of e.changedTouches) touches.set(t.identifier, { x: t.clientX, y: t.clientY });
    if (touches.size === 2) {
      const [a, b] = [...touches.values()];
      pinch = Math.hypot(a.x - b.x, a.y - b.y);
      CTRL.pinch = true;
    }
  }, { passive: true });
  el.addEventListener('touchmove', e => {
    for (const t of e.changedTouches) if (touches.has(t.identifier)) touches.set(t.identifier, { x: t.clientX, y: t.clientY });
    if (touches.size === 2) {
      const [a, b] = [...touches.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (pinch > 0) CTRL.radius = clamp(CTRL.radius * (pinch / d), 15, 82);
      pinch = d; mark(); e.preventDefault();
    }
  }, { passive: false });
  el.addEventListener('touchend', e => {
    for (const t of e.changedTouches) touches.delete(t.identifier);
    pinch = 0;
    if (touches.size < 2) CTRL.pinch = false;
  }, { passive: true });
}

function updateCamera(dt) {
  if (!CTRL.dragging) {
    CTRL.theta += CTRL.vTheta;
    CTRL.phi = clamp(CTRL.phi + CTRL.vPhi, 0.22, 1.46);
    CTRL.vTheta *= 0.90; CTRL.vPhi *= 0.90;
    if (performance.now() - CTRL.lastInput > 8000) CTRL.theta += dt * 0.007;
  }
  const sp = Math.sin(CTRL.phi), cp = Math.cos(CTRL.phi);
  W.camera.position.set(
    CTRL.target.x + CTRL.radius * sp * Math.sin(CTRL.theta),
    CTRL.target.y + CTRL.radius * cp,
    CTRL.target.z + CTRL.radius * sp * Math.cos(CTRL.theta)
  );
  W.camera.lookAt(CTRL.target);
}

/* ---------- boot ---------- */
function boot() {
  initCore();
  buildWorld();
  finishEdges();
  FX.init();
  let prev = performance.now();
  function loop(now) {
    const dt = Math.min(0.05, (now - prev) / 1000); prev = now;
    W.time += dt;
    updateCamera(dt);
    for (let i = 0; i < W.ticks.length; i++) W.ticks[i](dt, W.time);
    W.renderer.render(W.scene, W.camera);
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
}
window.addEventListener('load', boot);
