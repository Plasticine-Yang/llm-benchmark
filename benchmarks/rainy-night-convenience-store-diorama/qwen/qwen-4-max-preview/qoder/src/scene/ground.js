import * as THREE from 'three';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { L } from '../core/layout.js';
import { Batch, G, PAL, FOG_COLOR, FOG_DENSITY } from '../core/gfx.js';

const S = 2048, HALF = L.half;
const px = (v) => (v + HALF) / (2 * HALF) * S;
const pw = (v) => v / (2 * HALF) * S;

function canvas(size) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  return c;
}
function asTex(c, linear) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = linear ? THREE.NoColorSpace : THREE.SRGBColorSpace;
  t.anisotropy = 8;
  t.needsUpdate = true;
  return t;
}
function blob(g, cx, cy, r, seed, wob = 0.34) {
  g.beginPath();
  const n = 18;
  for (let i = 0; i <= n; i++) {
    const a = i / n * Math.PI * 2;
    const k = 1 + Math.sin(a * 3 + seed) * wob * 0.5 + Math.sin(a * 5.7 + seed * 2.3) * wob * 0.32;
    const x = cx + Math.cos(a) * r * k, y = cy + Math.sin(a) * r * k * 0.72;
    i ? g.lineTo(x, y) : g.moveTo(x, y);
  }
  g.closePath();
}

export const PUDDLES = [
  [3.6, 5.0, 1.5], [0.4, 7.4, 1.9], [-3.2, 8.6, 1.35], [7.6, 3.2, 1.25],
  [8.4, 8.2, 1.6], [-8.4, 4.2, 1.5], [-6.6, 2.6, 0.95], [6.2, -2.4, 1.15],
  [7.4, -7.6, 1.3], [-1.2, 10.9, 1.1], [10.9, 5.6, 0.9], [-10.4, 8.9, 1.2],
  [1.9, 3.1, 0.85], [-2.6, 4.6, 1.05], [4.3, 1.6, 0.7], [-8.9, -0.2, 0.8],
];

/* ------------------------- painted asphalt ------------------------- */
function groundTexture(T) {
  const c = canvas(S), g = c.getContext('2d');
  const X = px, W = pw;

  g.fillStyle = '#171d2b'; g.fillRect(0, 0, S, S);

  // asphalt fields ---------------------------------------------------
  const road = (x0, x1, z0, z1, tone) => {
    g.fillStyle = tone;
    g.fillRect(X(x0), X(z0), W(x1 - x0), W(z1 - z0));
  };
  road(-12, 12, L.frontRoad.z0, L.frontRoad.z1, '#1c2333');
  road(L.sideRoad.x0, L.sideRoad.x1, -12, 12, '#1e2536');
  road(L.parking.x0, L.parking.x1, L.parking.z0, L.parking.z1, '#212939');

  // aggregate + wear
  g.save();
  for (let i = 0; i < 26000; i++) {
    const x = Math.random() * S, y = Math.random() * S;
    const v = Math.random();
    g.fillStyle = v > 0.5 ? 'rgba(126,142,170,0.055)' : 'rgba(8,11,18,0.10)';
    g.fillRect(x, y, 2 + v * 3, 2 + v * 3);
  }
  g.restore();

  // patches & cracks
  g.strokeStyle = 'rgba(10,13,20,0.5)'; g.lineWidth = 3;
  for (let i = 0; i < 26; i++) {
    const x = Math.random() * S, y = Math.random() * S;
    g.beginPath(); g.moveTo(x, y);
    let cx = x, cy = y;
    for (let k = 0; k < 5; k++) {
      cx += (Math.random() - 0.5) * 130; cy += (Math.random() - 0.5) * 130;
      g.lineTo(cx, cy);
    }
    g.stroke();
  }
  for (let i = 0; i < 8; i++) {
    const x = Math.random() * S, y = Math.random() * S;
    blob(g, x, y, 60 + Math.random() * 120, i * 3.1);
    g.fillStyle = 'rgba(38,46,64,0.35)'; g.fill();
  }
  // tyre polish along traffic lanes
  g.save(); g.globalAlpha = 0.16; g.fillStyle = '#39445c';
  g.fillRect(X(-12), X(7.1), W(24), W(0.9));
  g.fillRect(X(-12), X(9.0), W(24), W(0.9));
  g.fillRect(X(6.1), X(-12), W(0.9), W(24));
  g.fillRect(X(8.6), X(-12), W(0.9), W(24));
  g.restore();

  // lane markings ----------------------------------------------------
  const wear = (alpha) => `rgba(226,232,240,${alpha})`;
  g.fillStyle = wear(0.62);
  for (let x = -11.4; x < 4.4; x += 1.6) g.fillRect(X(x), X(8.24), W(0.9), W(0.14));
  for (let z = -11.4; z < 0.4; z += 1.6) g.fillRect(X(7.54), X(z), W(0.14), W(0.9));
  for (let z = 10.0; z < 12; z += 1.6) g.fillRect(X(7.54), X(z), W(0.14), W(0.9));

  // crosswalk A — over the front road, bars run along Z
  g.fillStyle = wear(0.72);
  for (let i = 0; i < 6; i++) {
    const x = 5.55 + i * 0.82;
    g.fillRect(X(x), X(6.25), W(0.5), W(4.1));
  }
  // crosswalk B — over the side road, bars run along X
  for (let i = 0; i < 4; i++) {
    const z = 1.15 + i * 0.82;
    g.fillRect(X(5.25), X(z), W(4.7), W(0.5));
  }
  // stop line + diamond
  g.fillStyle = wear(0.6);
  g.fillRect(X(5.25), X(4.42), W(4.7), W(0.22));
  g.save();
  g.translate(X(7.6), X(-1.4)); g.rotate(Math.PI / 4);
  g.strokeStyle = wear(0.5); g.lineWidth = W(0.14);
  g.strokeRect(-W(0.75), -W(0.75), W(1.5), W(1.5));
  g.restore();
  // directional arrow on the side road
  g.save(); g.translate(X(6.3), X(-5.4)); g.fillStyle = wear(0.45);
  g.beginPath();
  g.moveTo(0, -W(0.9)); g.lineTo(W(0.42), -W(0.2)); g.lineTo(W(0.16), -W(0.2));
  g.lineTo(W(0.16), W(0.9)); g.lineTo(-W(0.16), W(0.9)); g.lineTo(-W(0.16), -W(0.2));
  g.lineTo(-W(0.42), -W(0.2)); g.closePath(); g.fill();
  g.restore();

  // parking bays ------------------------------------------------------
  g.strokeStyle = wear(0.55); g.lineWidth = W(0.11);
  const P = L.parking;
  for (let i = 0; i <= 2; i++) {
    const x = P.x0 + 0.25 + i * 3.1;
    g.beginPath(); g.moveTo(X(x), X(P.z0 + 0.2)); g.lineTo(X(x), X(P.z1 - 0.15)); g.stroke();
  }
  g.beginPath(); g.moveTo(X(P.x0 + 0.25), X(P.z0 + 0.2)); g.lineTo(X(P.x1 - 0.25), X(P.z0 + 0.2)); g.stroke();
  g.save();
  g.fillStyle = wear(0.4);
  g.font = `bold ${W(1.1)}px "Trebuchet MS",sans-serif`;
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText('P', X(-10.1), X(3.2));
  g.fillText('P', X(-7.0), X(3.2));
  g.restore();

  // gutters along the kerbs -------------------------------------------
  const gutter = (x0, x1, z0, z1) => {
    g.fillStyle = '#121722';
    g.fillRect(X(x0), X(z0), W(x1 - x0), W(z1 - z0));
    g.fillStyle = 'rgba(120,138,166,0.20)';
    if (x1 - x0 > z1 - z0) {
      for (let x = x0; x < x1; x += 0.26) g.fillRect(X(x), X(z0) + 2, W(0.12), W(z1 - z0) - 4);
    } else {
      for (let z = z0; z < z1; z += 0.26) g.fillRect(X(x0) + 2, X(z), W(x1 - x0) - 4, W(0.12));
    }
  };
  gutter(-12, 5.0, 6.0, 6.34);
  gutter(5.0, 5.34, -12, 6.0);
  gutter(-12, 12, 10.26, 10.6);
  gutter(9.86, 10.2, -12, 10.6);
  // catch basin at the corner
  g.fillStyle = '#0e131d'; g.fillRect(X(5.05), X(5.5), W(0.85), W(0.85));
  g.fillStyle = 'rgba(130,150,180,0.25)';
  for (let i = 0; i < 6; i++) g.fillRect(X(5.12), X(5.58 + i * 0.13), W(0.71), W(0.06));

  // manholes -----------------------------------------------------------
  const mh = T.manhole.image;
  g.drawImage(mh, X(1.6) - W(0.62), X(8.4) - W(0.62), W(1.24), W(1.24));
  g.drawImage(mh, X(8.0) - W(0.55), X(-3.4) - W(0.55), W(1.1), W(1.1));
  g.drawImage(mh, X(-9.4) - W(0.5), X(7.6) - W(0.5), W(1.0), W(1.0));

  // puddle darkening ----------------------------------------------------
  PUDDLES.forEach((p, i) => {
    blob(g, X(p[0]), X(p[1]), W(p[2]), i * 2.7);
    g.fillStyle = 'rgba(9,13,22,0.55)'; g.fill();
  });

  // grime near kerbs
  g.save(); g.globalAlpha = 0.3;
  const grd = g.createLinearGradient(0, X(6.0), 0, X(7.0));
  grd.addColorStop(0, '#05070c'); grd.addColorStop(1, 'rgba(5,7,12,0)');
  g.fillStyle = grd; g.fillRect(X(-12), X(6.0), W(24), W(1.0));
  const grd2 = g.createLinearGradient(X(5.0), 0, X(6.0), 0);
  grd2.addColorStop(0, '#05070c'); grd2.addColorStop(1, 'rgba(5,7,12,0)');
  g.fillStyle = grd2; g.fillRect(X(5.0), X(-12), W(1.0), W(24));
  g.restore();

  return asTex(c, false);
}

/* --------------------------- wetness mask -------------------------- */
function wetTexture() {
  const c = canvas(1024), g = c.getContext('2d');
  const k = 1024 / S;
  const X = (v) => px(v) * k, W = (v) => pw(v) * k;
  g.fillStyle = '#3a3a3a'; g.fillRect(0, 0, 1024, 1024);
  const field = (x0, x1, z0, z1, v) => {
    g.fillStyle = `rgb(${v},${v},${v})`;
    g.fillRect(X(x0), X(z0), W(x1 - x0), W(z1 - z0));
  };
  field(-12, 12, L.frontRoad.z0, L.frontRoad.z1, 130);
  field(L.sideRoad.x0, L.sideRoad.x1, -12, 12, 138);
  field(L.parking.x0, L.parking.x1, L.parking.z0, L.parking.z1, 120);
  // painted markings are rougher than bare asphalt
  g.fillStyle = 'rgba(60,60,60,0.55)';
  for (let i = 0; i < 6; i++) g.fillRect(X(5.55 + i * 0.82), X(6.25), W(0.5), W(4.1));
  for (let i = 0; i < 4; i++) g.fillRect(X(5.25), X(1.15 + i * 0.82), W(4.7), W(0.5));
  // puddles
  PUDDLES.forEach((p, i) => {
    blob(g, X(p[0]), X(p[1]), W(p[2]), i * 2.7);
    const gr = g.createRadialGradient(X(p[0]), X(p[1]), 0, X(p[0]), X(p[1]), W(p[2]));
    gr.addColorStop(0, 'rgba(255,255,255,1)');
    gr.addColorStop(0.72, 'rgba(245,245,245,0.95)');
    gr.addColorStop(1, 'rgba(150,150,150,0)');
    g.fillStyle = gr; g.fill();
  });
  // damp streaks
  g.save(); g.globalAlpha = 0.25;
  for (let i = 0; i < 60; i++) {
    const x = Math.random() * 1024, y = Math.random() * 1024;
    blob(g, x, y, 20 + Math.random() * 70, i);
    g.fillStyle = '#9a9a9a'; g.fill();
  }
  g.restore();
  return asTex(c, true);
}

/* ---------------- light pools (R warm / G cool / B neon) ------------- */
function poolTexture() {
  const c = canvas(512), g = c.getContext('2d');
  const X = (v) => (v + HALF) / (2 * HALF) * 512, W = (v) => v / (2 * HALF) * 512;
  g.fillStyle = '#000000'; g.fillRect(0, 0, 512, 512);
  g.globalCompositeOperation = 'lighter';
  const pool = (x, z, r, ch, a, sy = 1) => {
    g.save(); g.translate(X(x), X(z)); g.scale(1, sy);
    const gr = g.createRadialGradient(0, 0, 0, 0, 0, W(r));
    const col = ch === 0 ? '255,0,0' : ch === 1 ? '0,255,0' : '0,0,255';
    gr.addColorStop(0, `rgba(${col},${a})`);
    gr.addColorStop(0.45, `rgba(${col},${a * 0.45})`);
    gr.addColorStop(1, `rgba(${col},0)`);
    g.fillStyle = gr;
    g.beginPath(); g.arc(0, 0, W(r), 0, 7); g.fill();
    g.restore();
  };
  // warm spill from the shop front
  pool(-2.4, 1.9, 5.4, 0, 0.85, 0.62);
  pool(0.6, 2.6, 3.4, 0, 0.95, 0.75);
  pool(-5.6, 1.6, 3.2, 0, 0.6, 0.6);
  pool(-2.0, 5.4, 4.6, 0, 0.34, 0.5);
  pool(-8.4, 3.4, 3.0, 0, 0.30, 0.8);
  // cool street lamps
  pool(4.4, 3.0, 3.6, 1, 0.62);
  pool(4.4, -4.6, 3.2, 1, 0.45);
  pool(9.4, 10.9, 3.0, 1, 0.40);
  pool(4.2, 9.9, 3.0, 1, 0.42);
  // vending machines + alley neon
  pool(3.9, -1.6, 2.6, 1, 0.58, 1.3);
  pool(3.9, -3.6, 2.2, 0, 0.46, 1.2);
  pool(-8.45, -1.4, 1.8, 2, 0.42, 1.4);
  pool(11.2, 6.4, 1.8, 2, 0.22);
  return asTex(c, true);
}

/* --------------------- contact shadow / AO map --------------------- */
function aoTexture() {
  const c = canvas(1024), g = c.getContext('2d');
  const X = (v) => (v + HALF) / (2 * HALF) * 1024, W = (v) => v / (2 * HALF) * 1024;
  g.fillStyle = '#ffffff'; g.fillRect(0, 0, 1024, 1024);
  const soft = (x0, x1, z0, z1, blur, a) => {
    g.save();
    g.filter = `blur(${blur}px)`;
    g.fillStyle = `rgba(0,0,0,${a})`;
    g.fillRect(X(x0), X(z0), W(x1 - x0), W(z1 - z0));
    g.restore();
  };
  const st = L.store;
  soft(st.x0 - 0.5, st.x1 + 0.5, st.z0 - 0.5, st.z1 + 0.5, 26, 0.85);
  soft(L.leftBlock.x0, L.leftBlock.x1 + 0.4, L.leftBlock.z0, L.leftBlock.z1 + 0.5, 22, 0.8);
  soft(L.backBlock.x0, L.backBlock.x1, L.backBlock.z0, L.backBlock.z1 + 0.4, 22, 0.8);
  soft(L.rightBlock.x0 - 0.4, L.rightBlock.x1, L.rightBlock.z0, L.rightBlock.z1, 20, 0.75);
  soft(L.farBlock.x0, L.farBlock.x1, L.farBlock.z0 - 0.4, L.farBlock.z1, 20, 0.7);
  // props
  const spot = (x, z, r, a) => {
    g.save(); g.filter = 'blur(9px)';
    const gr = g.createRadialGradient(X(x), X(z), 0, X(x), X(z), W(r));
    gr.addColorStop(0, `rgba(0,0,0,${a})`); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.beginPath(); g.arc(X(x), X(z), W(r), 0, 7); g.fill();
    g.restore();
  };
  spot(3.15, -1.5, 1.1, 0.8); spot(3.15, -3.5, 1.1, 0.8);
  spot(4.25, -5.4, 0.9, 0.6); spot(4.3, 2.2, 0.7, 0.7);
  spot(4.5, 3.4, 0.6, 0.7); spot(-8.5, -2.4, 1.0, 0.7);
  spot(-4.6, 1.5, 0.6, 0.6); spot(2.2, 1.6, 0.6, 0.6);
  spot(-10.1, 2.0, 0.8, 0.5); spot(-7.0, 2.0, 0.8, 0.5);
  spot(11.1, 11.0, 0.7, 0.6); spot(-1.0, 11.2, 0.8, 0.5);
  return asTex(c, true);
}

/* ---------------------------- wet shader --------------------------- */
const WET_COMMON = /* glsl */`
  uniform sampler2D tDiffuse;
  uniform sampler2D tBase;
  uniform sampler2D tWet;
  uniform sampler2D tPool;
  uniform sampler2D tAO;
  uniform mat4 textureMatrix;
  uniform mat4 uLocalMat;
  uniform float uTime;
  uniform float uWetScale;
  uniform float uWarm;
  uniform float uTileScale;
  uniform float uUseTile;
  uniform vec3 uTileTexel;
  uniform sampler2D tTile;
  uniform vec3 uFogColor;
  uniform float uFogDensity;
  varying vec4 vProj;
  varying vec3 vWorld;
  varying vec2 vMap;

  float hash21(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }
  // returns vec3(height, dH/dx, dH/dy) — analytic gradient, one 3x3 tap
  vec3 ringField(vec2 p, float t, float scale, float speed, float amp) {
    vec2 gp = p * scale;
    vec2 id = floor(gp);
    vec2 f = fract(gp) - 0.5;
    vec3 acc = vec3(0.0);
    for (int y = -1; y <= 1; y++) {
      for (int x = -1; x <= 1; x++) {
        vec2 o = vec2(float(x), float(y));
        vec2 cid = id + o;
        float h = hash21(cid);
        if (h < 0.40) continue;
        float h2 = hash21(cid + 7.13);
        vec2 dv = f - (o + vec2(h, h2) - 0.5);
        float ph = fract(t * speed + h2 * 5.1);
        float d = max(length(dv), 1e-4);
        float rad = ph * 0.40;
        float w = 0.055 + ph * 0.05;
        float u = (d - rad) / w;
        float env = (1.0 - ph) * smoothstep(0.0, 0.10, ph) * amp;
        float e = exp(-u * u) * env;
        float de = -2.0 * u / w * e;
        acc.x += e;
        acc.yz += (dv / d) * de * 0.055;
      }
    }
    return acc;
  }
  vec3 waterField(vec2 p, float t) {
    vec3 a = ringField(p, t, 3.2, 1.05, 0.62);
    float sx = p.x * 1.7 + t * 0.6;
    float sz = p.y * 1.9 - t * 0.45;
    float k = 0.055;
    a.x += sin(sx) * sin(sz) * k;
    a.y += cos(sx) * sin(sz) * k * 1.7;
    a.z += sin(sx) * cos(sz) * k * 1.9;
    return a;
  }
`;

const WET_VERT = /* glsl */`
  ${WET_COMMON}
  void main() {
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWorld = wp.xyz;
    vProj = textureMatrix * uLocalMat * vec4(position, 1.0);
    vMap = (wp.xz + ${HALF.toFixed(1)}) / ${(2 * HALF).toFixed(1)};
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

const WET_FRAG = /* glsl */`
  ${WET_COMMON}
  vec3 tapRefl(vec4 pr, vec2 o) {
    vec4 q = pr; q.xy += o * q.w;
    return texture2DProj(tDiffuse, q).rgb;
  }
  void main() {
    vec2 muv = vMap;
    vec3 base = mix(texture2D(tBase, muv).rgb, texture2D(tTile, muv * uTileScale).rgb, uUseTile);
    float ao = texture2D(tAO, muv).r;
    base *= mix(1.0, ao, 0.9);
    float wet = clamp(texture2D(tWet, muv).r * uWetScale, 0.0, 1.0);

    float t = uTime;
    vec3 wf = waterField(vWorld.xz, t);
    vec2 grad = clamp(wf.yz, -1.2, 1.2);

    vec3 V = normalize(cameraPosition - vWorld);
    float fres = pow(1.0 - clamp(V.y, 0.0, 1.0), 3.0);
    float amt = wet * mix(0.34, 1.30, fres);

    vec2 off = grad * 0.0085 * wet;
    vec4 pr = vProj;
    pr.xy += off * pr.w;
    float blur = 0.0014 + wet * 0.0034;
    vec3 refl = tapRefl(pr, vec2(0.0)) * 0.36;
    refl += tapRefl(pr, vec2(blur, 0.0)) * 0.16;
    refl += tapRefl(pr, vec2(-blur, 0.0)) * 0.16;
    refl += tapRefl(pr, vec2(0.0, blur * 1.6)) * 0.16;
    refl += tapRefl(pr, vec2(0.0, -blur * 1.6)) * 0.16;

    vec3 col = base * mix(1.0, 0.60, wet);
    col += refl * amt;

    float crest = smoothstep(0.16, 0.52, length(grad));
    col += vec3(0.34, 0.48, 0.72) * crest * wet * 0.085;

    vec3 pool = texture2D(tPool, muv).rgb;
    col += vec3(1.00, 0.66, 0.34) * pool.r * uWarm * 0.80;
    col += vec3(0.48, 0.66, 1.00) * pool.g * 0.52;
    col += vec3(0.86, 0.42, 0.92) * pool.b * 0.34;

    float d = length(cameraPosition - vWorld);
    float fog = 1.0 - exp(-uFogDensity * uFogDensity * d * d);
    col = mix(col, uFogColor, clamp(fog, 0.0, 1.0));

    gl_FragColor = vec4(col, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

function wetUniforms(shared, base, wetScale, useTile) {
  return {
    tDiffuse: shared.tDiffuse,
    textureMatrix: shared.textureMatrix,
    color: shared.color,
    tBase: { value: base },
    tWet: shared.tWet,
    tPool: shared.tPool,
    tAO: shared.tAO,
    tTile: shared.tTile,
    uLocalMat: { value: new THREE.Matrix4() },
    uTime: shared.uTime,
    uWetScale: { value: wetScale },
    uWarm: shared.uWarm,
    uTileScale: { value: 10 },
    uUseTile: { value: useTile ? 1 : 0 },
    uTileTexel: { value: new THREE.Vector3() },
    uFogColor: { value: FOG_COLOR },
    uFogDensity: { value: FOG_DENSITY },
  };
}

/* ------------------------------ build ------------------------------ */
export function buildGround(scene, T) {
  const batch = new Batch();

  // collectible base plate — each inner step sits slightly proud of the
  // outer one so the rim reads as a machined display base under the road
  batch.add(G.rbox(24, 0.95, 24, 0.14, 2), 'baseSide', 0, -0.515, 0, { outline: 0.0011 });
  batch.add(G.rbox(23.9, 0.10, 23.9, 0.05, 1), 'baseTrim', 0, -0.07, 0, { outline: 0 });
  batch.add(G.rbox(23.72, 0.06, 23.72, 0.03, 1), 'basePlate', 0, -0.03, 0, { outline: 0 });

  // kerb segments -------------------------------------------------------
  const kerb = (x0, x1, z0, z1) => {
    const w = x1 - x0, d = z1 - z0;
    batch.box(w, 0.17, d, 'walkEdge', (x0 + x1) / 2, 0.085, (z0 + z1) / 2, { outline: 0.0006 });
  };
  kerb(4.86, 5.0, -12, 0.9);
  kerb(4.86, 5.0, 0.9, 6.0);
  kerb(-11.7, -5.2, 0.9, 1.04);
  kerb(-5.34, -5.2, 0.9, 6.0);
  kerb(-11.84, -11.7, 0.9, 6.0);
  kerb(-5.2, 5.0, 5.86, 6.0);
  kerb(-12, -11.7, 5.86, 6.0);
  kerb(-12, 12, 10.6, 10.74);
  kerb(10.2, 10.34, -12, 10.6);

  // wheel stops in the parking bays
  for (const x of [-10.1, -7.0]) {
    batch.rbox(1.5, 0.18, 0.28, 0.06, 'concrete', x, 0.09, 1.55, { outline: 0.0007 });
  }

  // tactile paving near the corner ramp
  const tactile = new THREE.CanvasTexture((() => {
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const g = c.getContext('2d');
    g.fillStyle = '#c8a83a'; g.fillRect(0, 0, 128, 128);
    g.fillStyle = '#e0c04a';
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
      g.beginPath(); g.arc(16 + i * 32, 16 + j * 32, 9, 0, 7); g.fill();
    }
    g.fillStyle = 'rgba(90,72,20,0.35)';
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
      g.beginPath(); g.arc(18 + i * 32, 18 + j * 32, 5, 0, 7); g.fill();
    }
    return c;
  })());
  tactile.colorSpace = THREE.SRGBColorSpace;
  tactile.wrapS = tactile.wrapT = THREE.RepeatWrapping;
  const tmat = new THREE.MeshToonMaterial({ color: '#ffffff', map: tactile, gradientMap: null });
  const addTactile = (w, d, x, z, rep) => {
    const geo = new THREE.PlaneGeometry(w, d).toNonIndexed();
    const uv = geo.getAttribute('uv');
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * rep[0], uv.getY(i) * rep[1]);
    const m = new THREE.Mesh(geo, tmat);
    m.rotation.x = -Math.PI / 2;
    m.position.set(x, L.walkY + 0.004, z);
    m.receiveShadow = true;
    scene.add(m);
  };
  addTactile(1.8, 0.6, 4.0, 5.5, [6, 2]);
  addTactile(0.6, 1.8, 4.5, 4.3, [2, 6]);
  addTactile(1.6, 0.6, 6.6, 11.0, [5, 2]);

  batch.flush(scene, 'ground-static');

  // ---------------- reflective wet road ----------------
  const baseTex = groundTexture(T);
  const shared = {
    tDiffuse: { value: null },
    textureMatrix: { value: null },
    color: { value: null },
    tWet: { value: wetTexture() },
    tPool: { value: poolTexture() },
    tAO: { value: aoTexture() },
    tTile: { value: T.tile },
    uTime: { value: 0 },
    uWarm: { value: 1 },
  };

  const geo = new THREE.PlaneGeometry(23.7, 23.7, 1, 1);
  const reflector = new Reflector(geo, {
    textureWidth: 1024, textureHeight: 1024, clipBias: 0.004, multisample: 0,
    shader: {
      name: 'WetRoad',
      uniforms: wetUniforms(shared, baseTex, 1.0, false),
      vertexShader: WET_VERT,
      fragmentShader: WET_FRAG,
    },
  });
  reflector.rotation.x = -Math.PI / 2;
  reflector.position.y = 0.022;
  reflector.name = 'wetRoad';
  reflector.updateMatrixWorld(true);
  // share the live uniform objects so both surfaces stay in sync
  reflector.material.uniforms.tBase.value = baseTex;
  reflector.material.uniforms.tWet = shared.tWet;
  reflector.material.uniforms.tPool = shared.tPool;
  reflector.material.uniforms.tAO = shared.tAO;
  reflector.material.uniforms.tTile = shared.tTile;
  reflector.material.uniforms.uTime = shared.uTime;
  reflector.material.uniforms.uWarm = shared.uWarm;
  shared.tDiffuse = reflector.material.uniforms.tDiffuse;
  shared.textureMatrix = reflector.material.uniforms.textureMatrix;
  shared.color = reflector.material.uniforms.color;
  scene.add(reflector);

  // ---------------- raised sidewalk (shares the reflection) ----------
  const invRef = reflector.matrixWorld.clone().invert();
  const walkGeos = [];
  for (const [x0, x1, z0, z1] of L.walk) {
    const gg = new THREE.PlaneGeometry(x1 - x0, z1 - z0).toNonIndexed();
    gg.rotateX(-Math.PI / 2);
    gg.translate((x0 + x1) / 2, L.walkY, (z0 + z1) / 2);
    walkGeos.push(gg);
  }
  const walkGeo = mergeGeometries(walkGeos, false);
  walkGeos.forEach(g => g.dispose());
  const walkMat = new THREE.ShaderMaterial({
    uniforms: wetUniforms(shared, baseTex, 0.52, true),
    vertexShader: WET_VERT,
    fragmentShader: WET_FRAG,
  });
  walkMat.uniforms.uLocalMat.value.copy(invRef);
  const walkMesh = new THREE.Mesh(walkGeo, walkMat);
  walkMesh.name = 'sidewalk';
  scene.add(walkMesh);

  // the sidewalk samples the reflection target, so it must not be drawn
  // while that target is being rendered (framebuffer feedback loop)
  const reflectBefore = reflector.onBeforeRender;
  reflector.onBeforeRender = function (renderer, sc, cam, geo, material, group) {
    walkMesh.visible = false;
    reflectBefore.call(this, renderer, sc, cam, geo, material, group);
    walkMesh.visible = true;
  };

  return {
    reflector,
    uniforms: shared,
    update(t, warm) {
      shared.uTime.value = t;
      shared.uWarm.value = warm;
    },
  };
}