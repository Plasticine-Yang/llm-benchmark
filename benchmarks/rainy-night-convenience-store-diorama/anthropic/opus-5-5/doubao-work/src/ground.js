import * as THREE from 'three';
import { HALF, SLAB, L, LAYER } from './layout.js';
import { toon, box, mesh, G, rng, rbox, glowMat } from './util.js';
import { wetToon, shared } from './materials.js';
import { plinthSideTexture, strataTexture, plaqueTexture, concreteTexture } from './textures.js';

const S = 2048;
const P = S / (HALF * 2);
const px = (x) => (x + HALF) * P;
const pz = (z) => (z + HALF) * P;

function rect(g, x0, z0, x1, z1, col) {
  g.fillStyle = col;
  g.fillRect(px(x0), pz(z0), (x1 - x0) * P, (z1 - z0) * P);
}
function noise(g, x0, z0, x1, z1, n, seed, cols, size = [1, 3]) {
  const r = rng(seed);
  for (let i = 0; i < n; i++) {
    g.fillStyle = cols[Math.floor(r() * cols.length)];
    const s = size[0] + r() * (size[1] - size[0]);
    g.fillRect(px(x0 + r() * (x1 - x0)), pz(z0 + r() * (z1 - z0)), s, s);
  }
}
function tiles(g, x0, z0, x1, z1, t, a, b, line, seed) {
  const r = rng(seed);
  for (let z = z0; z < z1 - 1e-6; z += t) for (let x = x0; x < x1 - 1e-6; x += t) {
    g.fillStyle = r() < 0.5 ? a : b;
    g.fillRect(px(x), pz(z), Math.min(t, x1 - x) * P, Math.min(t, z1 - z) * P);
  }
  g.strokeStyle = line;
  g.lineWidth = 1.5;
  for (let x = x0; x <= x1 + 1e-6; x += t) { g.beginPath(); g.moveTo(px(x), pz(z0)); g.lineTo(px(x), pz(z1)); g.stroke(); }
  for (let z = z0; z <= z1 + 1e-6; z += t) { g.beginPath(); g.moveTo(px(x0), pz(z)); g.lineTo(px(x1), pz(z)); g.stroke(); }
}
function tactile(g, x0, z0, x1, z1) {
  const t = 0.12;
  for (let z = z0; z < z1 - 1e-6; z += t) for (let x = x0; x < x1 - 1e-6; x += t) {
    g.fillStyle = '#e8b923';
    g.fillRect(px(x) + 1, pz(z) + 1, t * P - 2, t * P - 2);
    g.fillStyle = '#c99a12';
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
      g.beginPath();
      g.arc(px(x + 0.03 + i * 0.06), pz(z + 0.03 + j * 0.06), 2.2, 0, 7);
      g.fill();
    }
  }
}
function grate(g, cx, cz, w, d, alongX) {
  rect(g, cx - w / 2, cz - d / 2, cx + w / 2, cz + d / 2, '#23252c');
  g.fillStyle = '#5a5d66';
  const n = 7;
  for (let i = 0; i < n; i++) {
    if (alongX) g.fillRect(px(cx - w / 2) + 3, pz(cz - d / 2 + (i + 0.5) * d / n) - 1.5, w * P - 6, 3);
    else g.fillRect(px(cx - w / 2 + (i + 0.5) * w / n) - 1.5, pz(cz - d / 2) + 3, 3, d * P - 6);
  }
}
function dashes(g, x0, z0, x1, z1, w, on, off) {
  g.fillStyle = '#f2f2ee';
  const horiz = Math.abs(x1 - x0) > Math.abs(z1 - z0);
  if (horiz) for (let x = x0; x < x1; x += on + off) g.fillRect(px(x), pz(z0 - w / 2), Math.min(on, x1 - x) * P, w * P);
  else for (let z = z0; z < z1; z += on + off) g.fillRect(px(x0 - w / 2), pz(z), w * P, Math.min(on, z1 - z) * P);
}
function manhole(g, cx, cz) {
  g.save();
  g.translate(px(cx), pz(cz));
  g.fillStyle = '#4b4a4f';
  g.beginPath(); g.arc(0, 0, 0.33 * P, 0, 7); g.fill();
  g.strokeStyle = '#2e2d33'; g.lineWidth = 4;
  g.beginPath(); g.arc(0, 0, 0.3 * P, 0, 7); g.stroke();
  g.strokeStyle = '#66656c'; g.lineWidth = 3;
  for (let i = 0; i < 6; i++) { g.beginPath(); g.arc(0, 0, (0.06 + i * 0.04) * P, 0, 7); g.stroke(); }
  g.fillStyle = '#2e2d33';
  for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; g.fillRect(Math.cos(a) * 0.22 * P - 3, Math.sin(a) * 0.22 * P - 3, 6, 6); }
  g.restore();
}
function diamond(g, cx, cz, alongX) {
  g.save();
  g.translate(px(cx), pz(cz));
  if (!alongX) g.rotate(Math.PI / 2);
  g.strokeStyle = '#ecece6';
  g.lineWidth = 0.07 * P;
  g.beginPath();
  g.moveTo(-0.9 * P, 0); g.lineTo(0, -0.3 * P); g.lineTo(0.9 * P, 0); g.lineTo(0, 0.3 * P); g.closePath();
  g.stroke();
  g.restore();
}

function paintGround() {
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const g = c.getContext('2d');
  // asphalt
  rect(g, -7, -7, 7, 7, '#3d4150');
  noise(g, -7, -7, 7, 7, 26000, 1, ['#474b5b', '#353846', '#4f5262', '#30333f'], [1, 3]);
  // repair patches & tyre wear
  g.globalAlpha = 0.5;
  rect(g, -2.5, 4.6, -1.1, 5.0, '#343744');
  rect(g, 4.8, -4.2, 5.2, -2.6, '#343744');
  rect(g, 0.4, 5.4, 1.9, 5.95, '#363946');
  g.globalAlpha = 0.18;
  for (const z of [4.5, 4.75, 5.55, 5.8]) rect(g, -7, z - 0.07, 7, z + 0.07, '#22242d');
  for (const x of [4.6, 4.85, 5.65, 5.95]) rect(g, x - 0.07, -7, x + 0.07, 7, '#22242d');
  g.globalAlpha = 1;

  // ---- our block (raised) -------------------------------------------------
  // lot / apron concrete
  rect(g, -4.4, -7, 3.4, 3.2, '#7c7d86');
  noise(g, -4.4, -7, 3.4, 3.2, 9000, 2, ['#858690', '#72737c', '#8c8d96'], [1, 3]);
  g.strokeStyle = 'rgba(40,40,48,0.55)';
  g.lineWidth = 2;
  for (let x = -4.4; x <= 3.4; x += 1.3) { g.beginPath(); g.moveTo(px(x), pz(-7)); g.lineTo(px(x), pz(3.2)); g.stroke(); }
  for (let z = -7; z <= 3.2; z += 1.1) { g.beginPath(); g.moveTo(px(-4.4), pz(z)); g.lineTo(px(3.4), pz(z)); g.stroke(); }
  // alley (darker, with covered drain in the middle)
  rect(g, -4.4, -7, -3.2, 1.0, '#61626b');
  noise(g, -4.4, -7, -3.2, 1.0, 2500, 3, ['#6c6d76', '#55565e'], [1, 3]);
  for (let z = -6.9; z < 0.9; z += 0.5) {
    rect(g, -3.95, z, -3.65, z + 0.46, '#8a8b92');
    if (Math.round(z * 2) % 3 === 0) grate(g, -3.8, z + 0.23, 0.26, 0.4, true);
  }
  // neighbour front (brown tiles)
  tiles(g, -7, 1.2, -4.4, 3.2, 0.3, '#8a6f5d', '#7d6352', 'rgba(50,35,28,0.6)', 4);
  // parking lines
  g.fillStyle = '#efefe8';
  for (const x of [-3.1, -1.5, 0.1]) g.fillRect(px(x) - 4, pz(1.95), 8, 1.2 * P);
  g.fillRect(px(-3.1), pz(3.1), 3.2 * P, 7);
  g.font = `900 ${0.42 * P}px sans-serif`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillStyle = 'rgba(239,239,232,0.9)';
  g.fillText('1', px(-2.3), pz(2.85));
  g.fillText('2', px(-0.7), pz(2.85));
  // sidewalks
  tiles(g, -7, 3.2, 4.1, 4.0, 0.2, '#8e8b95', '#84818c', 'rgba(55,55,62,0.5)', 5);
  tiles(g, 3.4, -7, 4.1, 3.2, 0.2, '#8e8b95', '#84818c', 'rgba(55,55,62,0.5)', 6);
  rect(g, -7, 3.88, 4.1, 4.0, '#b4b3b8');
  rect(g, 3.98, -7, 4.1, 4.0, '#b4b3b8');
  rect(g, 3.4, 3.2, 3.52, -7 + 0.0001, '#b4b3b8');
  // tactile paving at the crossings
  tactile(g, 2.6, 3.62, 3.8, 3.86);
  tactile(g, 3.72, 2.5, 3.96, 3.7);
  tactile(g, 3.5, 3.62, 3.74, 3.86);
  // ---- far sidewalks --------------------------------------------------------
  tiles(g, -7, 6.3, 4.1, 7, 0.2, '#8e8b95', '#84818c', 'rgba(55,55,62,0.5)', 7);
  tiles(g, 6.4, -7, 7, 4.0, 0.2, '#8e8b95', '#84818c', 'rgba(55,55,62,0.5)', 8);
  tiles(g, 6.4, 6.3, 7, 7, 0.2, '#8e8b95', '#84818c', 'rgba(55,55,62,0.5)', 9);
  rect(g, -7, 6.3, 4.1, 6.42, '#b4b3b8');
  rect(g, 6.4, -7, 6.52, 4.0, '#b4b3b8');
  rect(g, 6.4, 6.3, 7, 6.42, '#b4b3b8');
  rect(g, 6.4, 6.3, 6.52, 7, '#b4b3b8');
  tactile(g, 2.6, 6.44, 3.8, 6.68);
  tactile(g, 6.54, 2.5, 6.78, 3.7);

  // ---- road furniture -------------------------------------------------------
  // concrete gutters along all curbs
  const gut = '#6c6d75';
  rect(g, -7, 4.0, 4.1, 4.22, gut);
  rect(g, 4.1, -7, 4.32, 4.0, gut);
  rect(g, -7, 6.08, 4.1, 6.3, gut);
  rect(g, 6.18, -7, 6.4, 4.0, gut);
  rect(g, 6.4, 6.08, 7, 6.3, gut);
  rect(g, 4.1, 6.3, 4.32, 7, gut);
  rect(g, 6.4, 4.0, 7, 4.22, gut);
  for (const x of [-5.8, -2.6, 1.2]) { grate(g, x, 4.11, 0.42, 0.2, false); grate(g, x + 0.4, 6.19, 0.42, 0.2, false); }
  for (const z of [-5.6, -2.6, 0.8]) { grate(g, 4.21, z, 0.2, 0.42, true); grate(g, 6.29, z + 0.6, 0.2, 0.42, true); }
  // edge lines
  rect(g, -7, 4.3, 2.4, 4.36, '#ecece6');
  rect(g, -7, 5.96, 2.4, 6.02, '#ecece6');
  rect(g, 4.4, -7, 4.46, 2.3, '#ecece6');
  rect(g, 6.06, -7, 6.12, 2.3, '#ecece6');
  // centre dashes
  dashes(g, -7, 5.15, 2.2, 5.15, 0.1, 0.8, 0.6);
  dashes(g, 5.25, -7, 5.25, 2.1, 0.1, 0.8, 0.6);
  // stop lines
  rect(g, 2.25, 4.32, 2.42, 5.15, '#f4f4ee');
  rect(g, 5.25, 2.15, 6.4, 2.32, '#f4f4ee');
  // crossings (bars parallel to traffic)
  for (let z = 4.18; z < 6.2; z += 0.42) rect(g, 2.6, z, 3.8, z + 0.22, '#f4f4ee');
  for (let x = 4.24; x < 6.3; x += 0.42) rect(g, x, 2.5, x + 0.22, 3.7, '#f4f4ee');
  // diamond "crossing ahead" marks
  diamond(g, -0.6, 4.72, true);
  diamond(g, 5.82, -0.4, false);
  // manholes
  manhole(g, 0.9, 5.55);
  manhole(g, 4.85, -3.6);
  manhole(g, 5.3, 5.1);
  // worn paint
  noise(g, -7, 4, 7, 6.3, 4000, 12, ['rgba(61,65,80,0.7)'], [2, 5]);
  noise(g, 4.1, -7, 6.4, 7, 3000, 13, ['rgba(61,65,80,0.7)'], [2, 5]);

  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 16;
  return t;
}

function paintWetMap() {
  const N = 512;
  const k = N / 14;
  const c = document.createElement('canvas');
  c.width = c.height = N;
  const g = c.getContext('2d');
  g.fillStyle = '#000';
  g.fillRect(0, 0, N, N);
  g.globalCompositeOperation = 'lighter';
  g.filter = 'blur(5px)';
  const blob = (x, z, rx, rz, rot = 0, v = 255) => {
    g.fillStyle = `rgb(${v},0,0)`;
    g.beginPath();
    g.ellipse((x + 7) * k, (z + 7) * k, rx * k, rz * k, rot, 0, Math.PI * 2);
    g.fill();
  };
  const r = rng(42);
  const puddles = [
    [-5.4, 4.45, 1.3, 0.38], [-1.0, 4.4, 0.9, 0.3], [1.3, 5.75, 0.8, 0.32], [-3.6, 5.6, 0.7, 0.28],
    [5.1, 5.0, 1.1, 0.75, 0.4], [6.0, 4.4, 0.5, 0.3], [4.5, -2.0, 0.36, 1.1], [4.55, -5.6, 0.34, 0.9],
    [5.95, 0.9, 0.4, 0.7], [5.6, -4.8, 0.3, 0.5], [3.2, 5.2, 0.5, 0.4],
    [-2.3, 2.55, 0.75, 0.38], [1.3, 2.45, 0.7, 0.3], [-0.6, 2.95, 0.4, 0.2], [2.9, 2.6, 0.38, 0.28],
    [-3.8, -1.6, 0.42, 0.9], [-3.8, -4.6, 0.4, 0.7], [0.2, -5.1, 0.9, 0.5], [-2.0, -4.2, 0.5, 0.3], [2.9, -5.6, 0.4, 0.6],
    [-3.0, 3.6, 0.35, 0.18], [3.75, -3.4, 0.22, 0.4], [-6.0, 6.65, 0.6, 0.2], [6.7, -2.2, 0.2, 0.6], [-5.6, 2.4, 0.5, 0.3],
  ];
  for (const p of puddles) blob(p[0], p[1], p[2], p[3], p[4] || 0);
  // small random spots
  for (let i = 0; i < 40; i++) blob(-7 + r() * 14, -7 + r() * 14, 0.08 + r() * 0.18, 0.06 + r() * 0.14, r() * 3, 230);
  // dry areas (green)
  g.filter = 'blur(6px)';
  const dry = (x0, z0, x1, z1, v) => {
    g.fillStyle = `rgb(0,${v},0)`;
    g.fillRect((x0 + 7) * k, (z0 + 7) * k, (x1 - x0) * k, (z1 - z0) * k);
  };
  dry(L.shop.x0 - 0.05, L.shop.z0 - 0.05, L.shop.x1 + 0.05, L.shop.z1 + 0.05, 255);
  dry(L.shop.x0 - 0.1, L.shop.z1, L.shop.x1 + 0.55, L.shop.z1 + 0.6, 200);
  dry(L.shop.x1, -1.95, L.shop.x1 + 0.55, L.shop.z1 + 0.6, 200);
  dry(L.neighbor.x0, L.neighbor.z0, L.neighbor.x1 + 0.25, L.neighbor.z1 + 0.75, 230);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.NoColorSpace;
  t.flipY = false;
  t.needsUpdate = true;
  return t;
}

/** Horizontal quad with world-mapped UVs (u = (x+7)/14, v = 1-(z+7)/14). */
function topQuad(x0, z0, x1, z1, y) {
  const g = new THREE.BufferGeometry();
  const u = (x) => (x + HALF) / (2 * HALF);
  const v = (z) => 1 - (z + HALF) / (2 * HALF);
  g.setAttribute('position', new THREE.Float32BufferAttribute([x0, y, z1, x1, y, z1, x1, y, z0, x0, y, z0], 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute([0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0], 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute([u(x0), v(z1), u(x1), v(z1), u(x1), v(z0), u(x0), v(z0)], 2));
  g.setIndex([0, 1, 2, 0, 2, 3]);
  return g;
}

export function buildGround(scene, updaters) {
  const root = new THREE.Group();
  root.name = 'ground';
  scene.add(root);

  const groundTex = paintGround();
  shared.tWet.value = paintWetMap();
  const wet = wetToon(groundTex, { wet: 0.55, glint: 1.0 });

  const quads = [
    [-7, -7, 7, 7, 0],
    // our block
    [-7, -7, 4.1, 4.0, SLAB],
    // far sidewalks
    [-7, 6.3, 4.1, 7, SLAB],
    [6.4, -7, 7, 4.0, SLAB],
    [6.4, 6.3, 7, 7, SLAB],
  ];
  for (const q of quads) {
    const m = new THREE.Mesh(topQuad(...q), wet);
    m.layers.set(LAYER.GROUND);
    root.add(m);
  }
  // curb faces
  const curb = toon('#9a9aa2');
  const curbFace = (x0, z0, x1, z1) => {
    const w = Math.max(x1 - x0, 0.02), d = Math.max(z1 - z0, 0.02);
    box(root, +w.toFixed(3), SLAB, +d.toFixed(3), curb, (x0 + x1) / 2, 0, (z0 + z1) / 2);
  };
  curbFace(-7, 3.99, 4.1, 4.0);
  curbFace(4.09, -7, 4.1, 4.0);
  curbFace(-7, 6.3, 4.1, 6.31);
  curbFace(4.1, 6.3, 4.11, 7);
  curbFace(6.4, -7, 6.41, 4.0);
  curbFace(6.4, 3.99, 7, 4.0);
  curbFace(6.4, 6.3, 7, 6.31);
  curbFace(6.4, 6.3, 6.41, 7);

  // metal storm drain inlets (slightly raised)
  const metal = toon('#2a2c33');
  for (const [x, z, w, d] of [[-5.8, 4.11, 0.42, 0.2], [-2.6, 4.11, 0.42, 0.2], [1.2, 4.11, 0.42, 0.2], [4.21, -2.6, 0.2, 0.42], [4.21, 0.8, 0.2, 0.42]]) {
    const gr = new THREE.Group();
    gr.position.set(x, 0.004, z);
    root.add(gr);
    box(gr, w + 0.04, 0.012, d + 0.04, metal, 0, 0, 0);
  }

  // flowing water in gutters
  const flowMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: { uTime: shared.uTime, uDir: { value: 1 } },
    vertexShader: /* glsl */ `varying vec2 vUv; varying vec3 vW; void main(){ vUv = uv; vec4 w = modelMatrix*vec4(position,1.); vW = w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }`,
    fragmentShader: /* glsl */ `
      uniform float uTime; varying vec2 vUv; varying vec3 vW;
      float h(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }
      void main(){
        float s = vUv.x * 40.0 - uTime * 2.2;
        float lane = vUv.y * 6.0;
        float id = floor(lane);
        float f = fract(s + h(vec2(id, 1.0)) * 7.0);
        float streak = smoothstep(0.0, 0.08, f) * smoothstep(0.55, 0.1, f);
        float edge = smoothstep(0.0, 0.25, vUv.y) * smoothstep(1.0, 0.75, vUv.y);
        vec3 col = vec3(0.55, 0.7, 0.95);
        gl_FragColor = vec4(col, (0.05 + streak * 0.22) * edge);
      }`,
  });
  const flow = (x0, z0, x1, z1, along) => {
    const w = x1 - x0, d = z1 - z0;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(along === 'x' ? w : d, along === 'x' ? d : w), flowMat);
    m.rotation.x = -Math.PI / 2;
    if (along === 'z') m.rotation.z = -Math.PI / 2;
    m.position.set((x0 + x1) / 2, 0.006, (z0 + z1) / 2);
    m.layers.set(LAYER.FX);
    m.userData.dynamic = true;
    root.add(m);
  };
  flow(-7, 4.02, 4.1, 4.2, 'x');
  flow(4.12, -7, 4.3, 4.0, 'z');
  flow(-7, 6.1, 4.1, 6.28, 'x');
  flow(6.2, -7, 6.38, 4.0, 'z');

  buildPlinth(scene);
  return root;
}

function buildPlinth(scene) {
  const root = new THREE.Group();
  root.name = 'plinth';
  scene.add(root);
  // cross section strata (asphalt / gravel / soil)
  const st = strataTexture();
  st.repeat.set(2, 1);
  const strata = toon('#ffffff', { map: st, unique: true });
  const sb = mesh(root, new THREE.BoxGeometry(14, 0.42, 14), strata, 0, -0.211, 0);
  sb.name = 'strata';
  // wooden plinth
  const wood = plinthSideTexture();
  wood.repeat.set(1.5, 1);
  const woodMat = toon('#ffffff', { map: wood, unique: true });
  rbox(root, 14.7, 0.62, 14.7, woodMat, 0, -1.04, 0, 0.06);
  // brass trim
  const brass = toon('#c9a24f', { emissive: '#3a2a10', ei: 0.4 });
  box(root, 14.76, 0.05, 14.76, brass, 0, -0.45, 0);
  box(root, 14.2, 0.03, 14.2, toon('#2a1c12'), 0, -0.43, 0);
  // felt base
  box(root, 14.5, 0.05, 14.5, toon('#1a1414'), 0, -1.09, 0);
  // plaque on the front (+z) and the right (+x) face
  const pt = plaqueTexture();
  const pm = toon('#ffffff', { map: pt, emissive: '#ffffff', emissiveMap: pt, ei: 0.25, unique: true });
  const plq = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 0.5), pm);
  plq.position.set(0, -0.73, 7.356);
  root.add(plq);
  const plq2 = plq.clone();
  plq2.rotation.y = Math.PI / 2;
  plq2.position.set(7.356, -0.73, 0);
  root.add(plq2);
  // little screws
  const scr = toon('#8a6a2a');
  for (const [x, z, ry] of [[-1.5, 7.36, 0], [1.5, 7.36, 0], [7.36, -1.5, 1], [7.36, 1.5, 1]]) {
    const s = mesh(root, G.cyl(0.03, 0.03, 0.01, 10), scr, x, -0.73, z, [Math.PI / 2, 0, 0]);
    if (ry) s.rotation.set(0, 0, Math.PI / 2);
  }
  return root;
}

export { topQuad };
