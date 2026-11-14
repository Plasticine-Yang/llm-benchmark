import * as THREE from 'three';
import { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

/* ------------------------------------------------------------------ *
 *  Palette — rainy-night konbini: indigo asphalt, warm interior,
 *  konbini green / orange / cyan signage, neon magenta + signal red.
 * ------------------------------------------------------------------ */
export const PAL = {
  voidDeep:   '#05070f',
  nightDeep:  '#0a0f1e',
  nightMid:   '#141d33',
  nightSoft:  '#22304f',
  outline:    '#080b14',

  asphalt:    '#1b2233',
  asphaltHi:  '#2a3550',
  curb:       '#79839a',
  sidewalk:   '#4d566b',
  sidewalkHi: '#6a7488',

  cream:      '#ece5d6',
  creamDim:   '#cdc6b8',
  white:      '#f6f8fc',
  metal:      '#9aa8bd',
  metalDark:  '#485468',
  metalDeep:  '#2b3446',
  concrete:   '#8b93a3',
  roof:       '#39425a',
  wood:       '#9a7550',

  green:      '#2fbf71',
  greenDeep:  '#12805a',
  orange:     '#ff8a3d',
  cyan:       '#38c9ff',
  cyanDeep:   '#1a7fb8',
  magenta:    '#ff4d8d',
  amber:      '#ffb020',
  red:        '#e8402f',
  navy:       '#26325a',
  violet:     '#7b5cff',

  warmLight:  '#ffd9a0',
  warmDeep:   '#ff9f45',
  intFloor:   '#f3e8d2',
  intWall:    '#fbf5e9',
  intShelf:   '#e9edf4',
  coolLight:  '#cfe4ff',
};

export const FOG_COLOR = new THREE.Color('#070c18');
export const FOG_DENSITY = 0.0075;

/* ---------------------------- toon ramps --------------------------- */
function ramp(stops) {
  const data = new Uint8Array(stops);
  const t = new THREE.DataTexture(data, stops.length, 1, THREE.RedFormat);
  t.minFilter = t.magFilter = THREE.NearestFilter;
  t.generateMipmaps = false;
  t.needsUpdate = true;
  return t;
}
export const RAMPS = {
  hard: ramp([46, 120, 196, 255]),
  soft: ramp([70, 138, 200, 238, 255]),
  flat: ramp([150, 205, 240, 255]),
  two:  ramp([96, 255]),
};

/* --------------------------- material lib -------------------------- */
const MATS = new Map();
export function mat(key) {
  const m = MATS.get(key);
  if (!m) throw new Error('unknown material: ' + key);
  return m;
}
export function defMat(key, opts) {
  const m = new THREE.MeshToonMaterial(opts);
  MATS.set(key, m);
  return m;
}
export function defBasic(key, opts) {
  const m = new THREE.MeshBasicMaterial(opts);
  MATS.set(key, m);
  return m;
}
export function hasMat(key) { return MATS.has(key); }

function toon(color, o = {}) {
  return {
    color: new THREE.Color(color),
    gradientMap: RAMPS[o.ramp || 'soft'],
    emissive: new THREE.Color(o.emissive || '#000000'),
    emissiveIntensity: o.ei === undefined ? 1 : o.ei,
    map: o.map || null,
    transparent: !!o.transparent,
    opacity: o.opacity === undefined ? 1 : o.opacity,
    side: o.side || THREE.FrontSide,
    vertexColors: !!o.vc,
    depthWrite: o.depthWrite === undefined ? true : o.depthWrite,
    fog: true,
    ...o.extra,
  };
}

export function buildMaterials(T) {
  // exterior shell ---------------------------------------------------
  defMat('baseSide',  toon('#0d1120', { ramp: 'two' }));
  defMat('baseTrim',  toon('#1d2740', { ramp: 'two' }));
  defMat('basePlate', toon('#8fa6c8', { ramp: 'flat', emissive: '#1b2740', ei: 0.6 }));
  defMat('curb',      toon(PAL.curb, { ramp: 'hard' }));
  defMat('walk',      toon(PAL.sidewalk, { map: T.tile, ramp: 'soft' }));
  defMat('walkEdge',  toon(PAL.sidewalkHi, { ramp: 'hard' }));
  defMat('gutter',    toon('#39415a', { map: T.grate, ramp: 'hard' }));
  defMat('wall',      toon(PAL.cream, { ramp: 'soft' }));
  defMat('wallDim',   toon(PAL.creamDim, { ramp: 'soft' }));
  defMat('wallSide',  toon('#d8d2c4', { ramp: 'soft' }));
  defMat('trim',      toon('#b9c3d4', { ramp: 'hard' }));
  defMat('metal',     toon(PAL.metal, { ramp: 'hard' }));
  defMat('metalDark', toon(PAL.metalDark, { ramp: 'hard' }));
  defMat('metalDeep', toon(PAL.metalDeep, { ramp: 'hard' }));
  defMat('concrete',  toon(PAL.concrete, { ramp: 'soft' }));
  defMat('roof',      toon('#333a4a', { ramp: 'hard' }));
  defMat('roofSeam',  toon('#3d4557', { ramp: 'hard' }));
  defMat('wood',      toon(PAL.wood, { ramp: 'soft' }));
  defMat('rubber',    toon('#161b26', { ramp: 'two' }));
  defMat('white',     toon(PAL.white, { ramp: 'soft' }));
  defMat('navy',      toon(PAL.navy, { ramp: 'soft' }));
  defMat('red',       toon(PAL.red, { ramp: 'soft' }));
  defMat('green',     toon(PAL.green, { ramp: 'soft' }));
  defMat('orange',    toon(PAL.orange, { ramp: 'soft' }));
  defMat('cyanP',     toon(PAL.cyan, { ramp: 'soft' }));
  defMat('magentaP',  toon(PAL.magenta, { ramp: 'soft' }));
  defMat('amberP',    toon(PAL.amber, { ramp: 'soft' }));
  defMat('darkGlass', toon('#131a2c', { ramp: 'two' }));
  defMat('neighbor',  toon('#414d6e', { ramp: 'flat', emissive: '#131b30', ei: 0.7 }));
  defMat('neighbor2', toon('#4a5678', { ramp: 'flat', emissive: '#161e34', ei: 0.7 }));
  defMat('neighborBand', toon('#5a6688', { ramp: 'hard', emissive: '#161e34', ei: 0.6 }));
  defMat('neighborBase', toon('#333d59', { ramp: 'flat', emissive: '#101728', ei: 0.7 }));
  defMat('hedge',     toon('#22463a', { ramp: 'hard' }));
  defMat('vanBody',   toon('#e4ebf2', { ramp: 'soft' }));
  defMat('vanPanel',  toon('#3b7f8c', { ramp: 'soft' }));
  defMat('vanGlass',  toon('#1b2740', { ramp: 'two' }));
  defMat('post',      toon('#d8342a', { ramp: 'soft' }));

  // interior — emissive-lifted so it always reads warm & bright ------
  const IW = { emissive: '#4a3418', ei: 0.55, ramp: 'flat' };
  defMat('intFloor',  toon(PAL.intFloor, { map: T.intFloor, ...IW, emissive: '#4d3a1c', ei: 0.6 }));
  defMat('intWall',   toon(PAL.intWall, { ...IW }));
  defMat('intCeil',   toon('#fdf8ee', { ...IW, ei: 0.7 }));
  defMat('intShelf',  toon(PAL.intShelf, { ...IW, ei: 0.5 }));
  defMat('intShelfBack', toon('#dfe5ef', { ...IW, ei: 0.5 }));
  defMat('intCounter',toon('#e4e9f2', { ...IW, ei: 0.5 }));
  defMat('intTrim',   toon('#c8d2e2', { ...IW, ei: 0.45 }));
  defMat('intWood',   toon('#c79a63', { ...IW, emissive: '#5a3c18', ei: 0.6 }));
  defMat('intDark',   toon('#5d6577', { ...IW, emissive: '#3a2c16', ei: 0.5 }));
  defMat('intMetal',  toon('#c3ccdb', { ...IW, ei: 0.5 }));
  defMat('intRed',    toon('#e8503c', { ...IW, emissive: '#5a1e10', ei: 0.6 }));
  defMat('intGreen',  toon('#3fc27c', { ...IW, emissive: '#144a2c', ei: 0.6 }));
  defMat('intNavy',   toon('#3a4a7a', { ...IW, emissive: '#1e2440', ei: 0.6 }));
  defMat('oden',      toon('#c98a3e', { ...IW, emissive: '#8a4a10', ei: 0.9 }));
  defMat('products',  toon('#ffffff', { vc: true, map: T.pkg, ...IW, ei: 0.5 }));
  defMat('productsPlain', toon('#ffffff', { vc: true, ...IW, ei: 0.5 }));
  defMat('bottles',   toon('#ffffff', { vc: true, map: T.bottle, ...IW, ei: 0.55 }));
  defMat('magazines', toon('#ffffff', { vc: true, map: T.mag, ...IW, ei: 0.55 }));

  // unlit / emissive faces -------------------------------------------
  defBasic('lightPanel', { color: '#fff4dd', fog: true });
  defBasic('lightPanelCool', { color: '#e6f4ff', fog: true });
  defBasic('signFace',   { map: T.sign, fog: true });
  defBasic('signSide',   { map: T.signSide, fog: true });
  defBasic('signSmall',  { map: T.signSmall, fog: true });
  defBasic('bandStripe', { map: T.stripe, fog: true });
  defBasic('vendFront',  { map: T.vend, fog: true });
  defBasic('vendFront2', { map: T.vend2, fog: true });
  defBasic('vendTop',    { map: T.vendTop, fog: true });
  defBasic('posterA',    { map: T.posterA, fog: true, side: THREE.DoubleSide });
  defBasic('posterB',    { map: T.posterB, fog: true, side: THREE.DoubleSide });
  defBasic('posterC',    { map: T.posterC, fog: true, side: THREE.DoubleSide });
  defBasic('posterD',    { map: T.posterD, fog: true, side: THREE.DoubleSide });
  defBasic('noren',      { map: T.noren, fog: true, side: THREE.DoubleSide });
  defBasic('menuBoard',  { map: T.menu, fog: true });
  defBasic('roadSign',   { map: T.roadSign, fog: true, side: THREE.DoubleSide });
  defBasic('stopSign',   { map: T.stopSign, fog: true, side: THREE.DoubleSide });
  defBasic('bulletin',   { map: T.bulletin, fog: true });
  defBasic('binLabel',   { map: T.binLabel, fog: true });
  defBasic('atmScreen',  { map: T.atm, fog: true });
  defBasic('posScreen',  { map: T.pos, fog: true });
  defBasic('coffeeFace', { map: T.coffee, fog: true });
  defBasic('grille',     { map: T.grille, fog: true });
  defBasic('shutter',    { map: T.shutter, fog: true, side: THREE.DoubleSide });
  defBasic('manhole',    { map: T.manhole, fog: true });
  defBasic('neonGreen',  { color: '#5cffb0', fog: true });
  defBasic('neonCyan',   { color: '#7fe0ff', fog: true });
  defBasic('neonWarm',   { color: '#ffd08a', fog: true });
  defBasic('neonMagenta',{ color: '#ff77ab', fog: true });
  defBasic('neonRed',    { color: '#ff5a4a', fog: true });
  defBasic('neonAmber',  { color: '#ffc24d', fog: true });
  defBasic('headlamp',   { color: '#fff0cf', fog: true });
  defBasic('taillamp',   { color: '#ff5a4a', fog: true });
  defBasic('windowLit',  { color: '#ffcf8f', fog: true });
  defBasic('windowLitCool', { color: '#9fc4ff', fog: true });
  defBasic('odenGlow',   { color: '#ffb861', fog: true });
  defBasic('coolerGlow', { color: '#dff2ff', fog: true });
  defBasic('floorGuide', { map: T.guide, transparent: true, fog: true, depthWrite: false });
}

/* ----------------------------- outlines ---------------------------- */
export const outlineUniforms = {
  uScale: { value: 1.55 },
  uColor: { value: new THREE.Color(PAL.outline) },
  uFogColor: { value: FOG_COLOR },
  uFogDensity: { value: FOG_DENSITY },
};
export const outlineMaterial = new THREE.ShaderMaterial({
  uniforms: outlineUniforms,
  side: THREE.BackSide,
  vertexShader: /* glsl */`
    attribute float aWidth;
    uniform float uScale;
    uniform float uFogDensity;
    varying float vFog;
    void main() {
      vec4 mv = modelViewMatrix * vec4(position, 1.0);
      vec3 n = normalize(normalMatrix * normal);
      mv.xyz += n * aWidth * uScale * max(-mv.z, 0.2);
      vFog = 1.0 - exp(-uFogDensity * uFogDensity * mv.z * mv.z);
      gl_Position = projectionMatrix * mv;
    }`,
  fragmentShader: /* glsl */`
    uniform vec3 uColor;
    uniform vec3 uFogColor;
    varying float vFog;
    void main() {
      gl_FragColor = vec4(mix(uColor, uFogColor, clamp(vFog, 0.0, 1.0)), 1.0);
    }`,
});

const outlineCache = new Map();
function outlineGeoFor(geo) {
  let g = outlineCache.get(geo.uuid);
  if (g) return g;
  const pos = new THREE.BufferGeometry();
  pos.setAttribute('position', geo.getAttribute('position').clone());
  const merged = mergeVertices(pos, 1e-4);
  merged.computeVertexNormals();
  g = merged.toNonIndexed();
  merged.dispose();
  pos.dispose();
  outlineCache.set(geo.uuid, g);
  return g;
}

const geoCache = new Map();
function cached(key, make) {
  let g = geoCache.get(key);
  if (!g) { g = make(); geoCache.set(key, g); }
  return g;
}
export const G = {
  box: (w, h, d) => cached(`b${w},${h},${d}`, () => new THREE.BoxGeometry(w, h, d).toNonIndexed()),
  rbox: (w, h, d, r, s = 1) => cached(`r${w},${h},${d},${r},${s}`, () => new RoundedBoxGeometry(w, h, d, s, r)),
  cyl: (rt, rb, h, seg = 12) => cached(`c${rt},${rb},${h},${seg}`, () => new THREE.CylinderGeometry(rt, rb, h, seg).toNonIndexed()),
  plane: (w, h) => cached(`p${w},${h}`, () => new THREE.PlaneGeometry(w, h).toNonIndexed()),
  sphere: (r, s = 12) => cached(`s${r},${s}`, () => new THREE.SphereGeometry(r, s, Math.max(6, s / 2)).toNonIndexed()),
  torus: (r, t, s = 8, rs = 20) => cached(`t${r},${t},${s},${rs}`, () => new THREE.TorusGeometry(r, t, s, rs).toNonIndexed()),
  cone: (r, h, s = 12) => cached(`k${r},${h},${s}`, () => new THREE.ConeGeometry(r, h, s).toNonIndexed()),
};

/* ------------------------- static geo batcher ---------------------- */
const _m4 = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _e = new THREE.Euler();
const _v = new THREE.Vector3();
const _s = new THREE.Vector3();
const _c = new THREE.Color();

export function xform(x, y, z, o = {}) {
  _e.set(o.rx || 0, o.ry || 0, o.rz || 0);
  _q.setFromEuler(_e);
  _v.set(x, y, z);
  _s.set(o.sx === undefined ? 1 : o.sx, o.sy === undefined ? 1 : o.sy, o.sz === undefined ? 1 : o.sz);
  return _m4.compose(_v, _q, _s);
}

export class Batch {
  constructor() {
    this.groups = new Map();
    this.outlines = [];
  }
  /** generic add: geometry is cloned + transformed, never mutated */
  add(geo, key, x, y, z, o = {}) {
    const m = xform(x, y, z, o).clone();
    const g = geo.clone().applyMatrix4(m);
    if (g.index) g.setIndex(null);
    for (const name of Object.keys(g.attributes)) {
      if (name !== 'position' && name !== 'normal' && name !== 'uv') g.deleteAttribute(name);
    }
    if (!g.getAttribute('uv')) {
      const n = g.getAttribute('position').count;
      g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(n * 2), 2));
    }
    if (o.uvScale || o.uvOffset) {
      const uv = g.getAttribute('uv');
      const su = o.uvScale ? o.uvScale[0] : 1, sv = o.uvScale ? o.uvScale[1] : 1;
      const ou = o.uvOffset ? o.uvOffset[0] : 0, ov = o.uvOffset ? o.uvOffset[1] : 0;
      for (let i = 0; i < uv.count; i++) {
        uv.setXY(i, uv.getX(i) * su + ou, uv.getY(i) * sv + ov);
      }
    }
    const mtl = mat(key);
    if (mtl.vertexColors) {
      const n = g.getAttribute('position').count;
      const arr = new Float32Array(n * 3);
      _c.set(o.color || '#ffffff');
      for (let i = 0; i < n; i++) { arr[i * 3] = _c.r; arr[i * 3 + 1] = _c.g; arr[i * 3 + 2] = _c.b; }
      g.setAttribute('color', new THREE.BufferAttribute(arr, 3));
    }
    let arr = this.groups.get(key);
    if (!arr) { arr = []; this.groups.set(key, arr); }
    arr.push(g);

    const w = o.outline === undefined ? 0.00085 : o.outline;
    if (w > 0) {
      const og = outlineGeoFor(geo).clone().applyMatrix4(m);
      for (const name of Object.keys(og.attributes)) {
        if (name !== 'position' && name !== 'normal') og.deleteAttribute(name);
      }
      const n = og.getAttribute('position').count;
      const wa = new Float32Array(n).fill(w);
      og.setAttribute('aWidth', new THREE.BufferAttribute(wa, 1));
      this.outlines.push(og);
    }
    return this;
  }
  box(w, h, d, key, x, y, z, o) { return this.add(G.box(w, h, d), key, x, y, z, o); }
  rbox(w, h, d, r, key, x, y, z, o) { return this.add(G.rbox(w, h, d, r, (o && o.seg) || 1), key, x, y, z, o); }
  cyl(rt, rb, h, seg, key, x, y, z, o) { return this.add(G.cyl(rt, rb, h, seg), key, x, y, z, o); }
  plane(w, h, key, x, y, z, o) { return this.add(G.plane(w, h), key, x, y, z, { outline: 0, ...o }); }
  sphere(r, key, x, y, z, o) { return this.add(G.sphere(r, (o && o.seg) || 12), key, x, y, z, o); }
  torus(r, t, key, x, y, z, o) { return this.add(G.torus(r, t, (o && o.seg) || 8, (o && o.rs) || 20), key, x, y, z, o); }
  cone(r, h, key, x, y, z, o) { return this.add(G.cone(r, h, (o && o.seg) || 12), key, x, y, z, o); }
  /** cylinder strut between two world points */
  strut(a, b, r, key, o = {}) {
    const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b);
    const dir = new THREE.Vector3().subVectors(B, A);
    const len = dir.length();
    const mid = new THREE.Vector3().addVectors(A, B).multiplyScalar(0.5);
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
    const e = new THREE.Euler().setFromQuaternion(q);
    return this.add(G.cyl(r, r, len, o.seg || 8), key, mid.x, mid.y, mid.z, { rx: e.x, ry: e.y, rz: e.z, outline: o.outline === undefined ? 0.0006 : o.outline });
  }
  flush(parent, name = 'batch') {
    const out = new THREE.Group();
    out.name = name;
    for (const [key, geos] of this.groups) {
      const merged = mergeGeometries(geos, false);
      geos.forEach(g => g.dispose());
      if (!merged) continue;
      merged.computeBoundingSphere();
      const mesh = new THREE.Mesh(merged, mat(key));
      mesh.name = name + ':' + key;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      if (mat(key).isMeshBasicMaterial) { mesh.castShadow = false; }
      out.add(mesh);
    }
    if (this.outlines.length) {
      const merged = mergeGeometries(this.outlines, false);
      this.outlines.forEach(g => g.dispose());
      if (merged) {
        merged.computeBoundingSphere();
        const om = new THREE.Mesh(merged, outlineMaterial);
        om.name = name + ':outline';
        om.castShadow = false; om.receiveShadow = false;
        out.add(om);
      }
    }
    this.groups.clear(); this.outlines.length = 0;
    parent.add(out);
    return out;
  }
}

/** standalone (dynamic) mesh with its own inverted-hull outline child */
export function dmesh(geo, key, outline = 0.00085) {
  const m = new THREE.Mesh(geo, mat(key));
  m.castShadow = true; m.receiveShadow = true;
  if (outline > 0) {
    const og = outlineGeoFor(geo).clone();
    const n = og.getAttribute('position').count;
    og.setAttribute('aWidth', new THREE.BufferAttribute(new Float32Array(n).fill(outline), 1));
    const om = new THREE.Mesh(og, outlineMaterial);
    om.castShadow = false; om.receiveShadow = false;
    m.add(om);
  }
  return m;
}

/* ------------------------------ misc ------------------------------- */
export function catenary(a, b, sag, segments = 22) {
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b);
  const pts = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const p = new THREE.Vector3().lerpVectors(A, B, t);
    p.y -= sag * 4 * t * (1 - t);
    pts.push(p);
  }
  return new THREE.CatmullRomCurve3(pts);
}

export function seeded(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}