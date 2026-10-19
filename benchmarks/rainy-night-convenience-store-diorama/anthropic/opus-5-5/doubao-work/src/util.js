import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

/** Objects on this layer are rendered normally but skipped by the outline (normal/depth) pass. */
export const NO_OUTLINE = 1;

let _grad = null;
/** 3-step toon ramp shared by every cel-shaded material. */
export function gradientMap() {
  if (_grad) return _grad;
  const t = new THREE.DataTexture(new Uint8Array([92, 172, 255]), 3, 1, THREE.RedFormat);
  t.minFilter = THREE.NearestFilter;
  t.magFilter = THREE.NearestFilter;
  t.generateMipmaps = false;
  t.needsUpdate = true;
  _grad = t;
  return t;
}

const matCache = new Map();
/**
 * Cel-shaded material.
 *  o.glow      self illumination factor (emissive = color * glow) – used for the bright shop interior
 *  o.emissive  explicit emissive color, o.ei intensity
 */
export function toon(color, o = {}) {
  const cacheable = !o.map && !o.emissiveMap && !o.unique;
  const key = cacheable
    ? `${color}|${o.glow || 0}|${o.emissive || ''}|${o.ei || 0}|${o.side || 0}|${o.opacity ?? 1}`
    : null;
  if (key && matCache.has(key)) return matCache.get(key);
  const m = new THREE.MeshToonMaterial({ color: new THREE.Color(color), gradientMap: gradientMap() });
  if (o.map) m.map = o.map;
  if (o.side !== undefined) m.side = o.side;
  if (o.opacity !== undefined && o.opacity < 1) {
    m.transparent = true;
    m.opacity = o.opacity;
    m.depthWrite = false;
  }
  if (o.glow) {
    m.emissive = new THREE.Color(color);
    m.emissiveIntensity = o.glow;
    if (o.map) m.emissiveMap = o.map;
  }
  if (o.emissive) {
    m.emissive = new THREE.Color(o.emissive);
    m.emissiveIntensity = o.ei ?? 1;
    if (o.emissiveMap) m.emissiveMap = o.emissiveMap;
  }
  if (key) matCache.set(key, m);
  return m;
}

/** Unlit (light emitting) material. k > 1 pushes it into the bloom range. */
export function glowMat(color, k = 1, o = {}) {
  const m = new THREE.MeshBasicMaterial({
    color: new THREE.Color(color).multiplyScalar(k),
    map: o.map || null,
    side: o.side ?? THREE.FrontSide,
  });
  if (o.opacity !== undefined) {
    m.transparent = true;
    m.opacity = o.opacity;
    m.depthWrite = false;
  }
  return m;
}

/** Toon material whose emissive term is multiplied by the per-instance colour (for products / bottles). */
export function instanceGlowToon(map, glow = 0.4) {
  const m = new THREE.MeshToonMaterial({ color: 0xffffff, gradientMap: gradientMap(), map: map || null });
  m.emissive = new THREE.Color(0xffffff);
  m.emissiveIntensity = glow;
  m.onBeforeCompile = (s) => {
    s.fragmentShader = s.fragmentShader.replace(
      'vec3 totalEmissiveRadiance = emissive;',
      `vec3 totalEmissiveRadiance = emissive;
       #ifdef USE_COLOR
         totalEmissiveRadiance *= vColor.rgb;
       #endif
       #ifdef USE_MAP
         totalEmissiveRadiance *= texture2D( map, vMapUv ).rgb;
       #endif`
    );
  };
  m.customProgramCacheKey = () => 'instanceGlowToon';
  return m;
}

const geoCache = new Map();
function cached(key, make) {
  if (!geoCache.has(key)) geoCache.set(key, make());
  return geoCache.get(key);
}
export const G = {
  box: (w, h, d) => cached(`b${w},${h},${d}`, () => new THREE.BoxGeometry(w, h, d)),
  rbox: (w, h, d, r = 0.04, s = 2) => cached(`r${w},${h},${d},${r},${s}`, () => new RoundedBoxGeometry(w, h, d, s, r)),
  cyl: (rt, rb, h, seg = 16) => cached(`c${rt},${rb},${h},${seg}`, () => new THREE.CylinderGeometry(rt, rb, h, seg)),
  plane: (w, h) => cached(`p${w},${h}`, () => new THREE.PlaneGeometry(w, h)),
  sphere: (r, ws = 12, hs = 8) => cached(`s${r},${ws},${hs}`, () => new THREE.SphereGeometry(r, ws, hs)),
};

export function mesh(parent, geo, mat, x = 0, y = 0, z = 0, rot) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  if (rot) m.rotation.set(rot[0] || 0, rot[1] || 0, rot[2] || 0);
  parent.add(m);
  return m;
}
/** Box whose bottom sits on y. */
export function box(parent, w, h, d, mat, x, y, z, rot) {
  return mesh(parent, G.box(w, h, d), mat, x, y + h / 2, z, rot);
}
export function rbox(parent, w, h, d, mat, x, y, z, r = 0.04, rot) {
  return mesh(parent, G.rbox(w, h, d, r), mat, x, y + h / 2, z, rot);
}
/** Axis aligned box from min/max corners. */
export function boxMM(parent, x0, y0, z0, x1, y1, z1, mat) {
  return mesh(parent, G.box(+(x1 - x0).toFixed(4), +(y1 - y0).toFixed(4), +(z1 - z0).toFixed(4)), mat, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
}
/** Cylinder whose bottom sits on y. */
export function cyl(parent, r, h, mat, x, y, z, seg = 16, rTop) {
  return mesh(parent, G.cyl(rTop ?? r, r, h, seg), mat, x, y + h / 2, z);
}
/** Cylinder between two points. */
export function rod(parent, a, b, r, mat, seg = 8) {
  const A = new THREE.Vector3(...a);
  const B = new THREE.Vector3(...b);
  const len = A.distanceTo(B);
  const m = new THREE.Mesh(G.cyl(r, r, +len.toFixed(4), seg), mat);
  m.position.copy(A).add(B).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), B.clone().sub(A).normalize());
  parent.add(m);
  return m;
}
/** Plane facing +z by default; ry rotates it about Y. */
export function plane(parent, w, h, mat, x, y, z, ry = 0, rx = 0) {
  return mesh(parent, G.plane(w, h), mat, x, y, z, [rx, ry, 0]);
}
export function noOutline(o) {
  o.traverse((c) => c.layers.set(NO_OUTLINE));
  return o;
}
export function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}
export function pick(r, arr) {
  return arr[Math.floor(r() * arr.length) % arr.length];
}

/** Collects many small items and turns them into a single InstancedMesh. */
export class Batch {
  constructor(geo, mat) {
    this.geo = geo;
    this.mat = mat;
    this.items = [];
  }
  add(x, y, z, sx, sy, sz, color, ry = 0, rx = 0, rz = 0) {
    this.items.push({ x, y, z, sx, sy, sz, color, ry, rx, rz });
  }
  build(parent, outline = false) {
    if (!this.items.length) return null;
    const im = new THREE.InstancedMesh(this.geo, this.mat, this.items.length);
    const o = new THREE.Object3D();
    const c = new THREE.Color();
    this.items.forEach((it, i) => {
      o.position.set(it.x, it.y, it.z);
      o.rotation.set(it.rx, it.ry, it.rz);
      o.scale.set(it.sx, it.sy, it.sz);
      o.updateMatrix();
      im.setMatrixAt(i, o.matrix);
      im.setColorAt(i, c.set(it.color));
    });
    im.instanceMatrix.needsUpdate = true;
    if (im.instanceColor) im.instanceColor.needsUpdate = true;
    parent.add(im);
    if (!outline) noOutline(im);
    return im;
  }
}

/** Unit geometries with the origin at the bottom centre, handy for Batch. */
export const UNIT = {
  box: (() => { const g = new THREE.BoxGeometry(1, 1, 1); g.translate(0, 0.5, 0); return g; })(),
  cyl: (() => { const g = new THREE.CylinderGeometry(0.5, 0.5, 1, 14); g.translate(0, 0.5, 0); return g; })(),
  cup: (() => { const g = new THREE.CylinderGeometry(0.5, 0.38, 1, 14); g.translate(0, 0.5, 0); return g; })(),
  tri: (() => { const g = new THREE.CylinderGeometry(0.5, 0.5, 1, 3); g.rotateX(Math.PI / 2); g.translate(0, 0.25, 0); return g; })(),
  sphere: (() => { const g = new THREE.SphereGeometry(0.5, 12, 8); g.translate(0, 0.5, 0); return g; })(),
};
