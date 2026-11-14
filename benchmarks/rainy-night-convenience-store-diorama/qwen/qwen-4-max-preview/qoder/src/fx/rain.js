import * as THREE from 'three';
import { L } from '../core/layout.js';
import { seeded } from '../core/gfx.js';

/* ---------------------- instanced quad plumbing -------------------- */
function iquads(count, attrs, material, order) {
  const base = new THREE.PlaneGeometry(1, 1);
  const g = new THREE.InstancedBufferGeometry();
  g.index = base.index;
  g.setAttribute('position', base.getAttribute('position'));
  g.setAttribute('uv', base.getAttribute('uv'));
  g.instanceCount = count;
  for (const k in attrs) g.setAttribute(k, new THREE.InstancedBufferAttribute(attrs[k].data, attrs[k].size));
  const m = new THREE.Mesh(g, material);
  m.frustumCulled = false;
  m.renderOrder = order === undefined ? 6 : order;
  return m;
}
const arr = (n, s) => ({ data: new Float32Array(n * s), size: s });

const EXCLUDE = [
  [L.store.x0 - 0.15, L.awn.side + 0.1, L.store.z0 - 0.15, L.awn.front + 0.1],
  [L.leftBlock.x0, L.leftBlock.x1, L.leftBlock.z0, L.leftBlock.z1],
  [L.backBlock.x0, L.backBlock.x1, L.backBlock.z0, L.backBlock.z1],
  [L.rightBlock.x0, L.rightBlock.x1, L.rightBlock.z0, L.rightBlock.z1],
  [L.farBlock.x0, L.farBlock.x1, L.farBlock.z0, L.farBlock.z1],
];
function blocked(x, z) {
  for (const [a, b, c, d] of EXCLUDE) if (x > a && x < b && z > c && z < d) return true;
  return false;
}
function onWalk(x, z) {
  for (const [a, b, c, d] of L.walk) if (x >= a && x <= b && z >= c && z <= d) return true;
  return false;
}

const BILLBOARD = /* glsl */`
  uniform vec3 uCamRight;
  uniform vec3 uCamUp;
`;

/* ============================== RAIN =============================== */
function makeRain(scene, rnd) {
  const N = 3200;
  const aPos = arr(N, 3), aRand = arr(N, 4);
  let i = 0, guard = 0;
  while (i < N && guard < N * 40) {
    guard++;
    const x = -11.85 + rnd() * 23.7, z = -11.85 + rnd() * 23.7;
    if (blocked(x, z)) continue;
    aPos.data[i * 3] = x; aPos.data[i * 3 + 1] = 0; aPos.data[i * 3 + 2] = z;
    aRand.data[i * 4] = 0.62 + rnd() * 0.55;
    aRand.data[i * 4 + 1] = 0.20 + rnd() * 0.34;
    aRand.data[i * 4 + 2] = rnd();
    aRand.data[i * 4 + 3] = 0.010 + rnd() * 0.013;
    i++;
  }
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 }, uTop: { value: 11.5 }, uBottom: { value: 0.02 },
      uWind: { value: new THREE.Vector2(0.16, 0.07) },
      uColor: { value: new THREE.Color('#a8ccff') },
      uOpacity: { value: 0.20 },
      uCamRight: { value: new THREE.Vector3(1, 0, 0) },
    },
    vertexShader: /* glsl */`
      attribute vec3 aPos; attribute vec4 aRand;
      uniform float uTime, uTop, uBottom;
      uniform vec2 uWind; uniform vec3 uCamRight;
      varying vec2 vUv; varying float vFade;
      void main() {
        float t = fract(uTime * aRand.x + aRand.z);
        float y = mix(uTop, uBottom, t);
        vec3 c = vec3(aPos.x, y, aPos.z);
        vec3 up = normalize(vec3(uWind.x, 1.0, uWind.y));
        vec3 toCam = normalize(cameraPosition - c);
        vec3 right = normalize(cross(up, toCam));
        vec3 wp = c + right * (position.x * aRand.w) + up * (position.y * aRand.y);
        vUv = uv;
        vFade = smoothstep(0.0, 0.05, t) * (1.0 - smoothstep(0.90, 1.0, t));
        gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.0);
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uColor; uniform float uOpacity;
      varying vec2 vUv; varying float vFade;
      void main() {
        float a = 1.0 - abs(vUv.x - 0.5) * 2.0;
        a = pow(a, 1.4);
        a *= smoothstep(0.0, 0.30, vUv.y) * (1.0 - smoothstep(0.62, 1.0, vUv.y));
        gl_FragColor = vec4(uColor, a * uOpacity * vFade);
      }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  const m = iquads(i, { aPos, aRand }, mat, 7);
  scene.add(m);
  return mat;
}

/* ============================ SPLASHES ============================= */
function makeSplashes(scene, rnd, dripPoints) {
  const N = 300 + dripPoints.length;
  const aPos = arr(N, 3), aRand = arr(N, 4);
  let i = 0, guard = 0;
  while (i < N - dripPoints.length && guard < N * 40) {
    guard++;
    const x = -11.7 + rnd() * 23.4, z = -11.7 + rnd() * 23.4;
    if (blocked(x, z)) continue;
    const y = onWalk(x, z) ? L.walkY + 0.012 : 0.032;
    aPos.data[i * 3] = x; aPos.data[i * 3 + 1] = y; aPos.data[i * 3 + 2] = z;
    aRand.data[i * 4] = 0.9 + rnd() * 1.5;
    aRand.data[i * 4 + 1] = rnd();
    aRand.data[i * 4 + 2] = 0.035 + rnd() * 0.070;
    aRand.data[i * 4 + 3] = 0.30;
    i++;
  }
  for (const d of dripPoints) {
    aPos.data[i * 3] = d.x; aPos.data[i * 3 + 1] = d.y; aPos.data[i * 3 + 2] = d.z;
    aRand.data[i * 4] = d.speed;
    aRand.data[i * 4 + 1] = d.phase;
    aRand.data[i * 4 + 2] = 0.075 + rnd() * 0.045;
    aRand.data[i * 4 + 3] = 0.42;
    i++;
  }
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uColor: { value: new THREE.Color('#b8d8ff') },
      uOpacity: { value: 0.26 },
    },
    vertexShader: /* glsl */`
      attribute vec3 aPos; attribute vec4 aRand;
      uniform float uTime;
      varying vec2 vUv; varying float vA;
      void main() {
        float ph = fract(uTime * aRand.x + aRand.y);
        float duty = aRand.w;
        float k = ph / duty;
        float r = aRand.z * (0.25 + 0.75 * k);
        vec3 wp = aPos + vec3(position.x * r * 2.0, 0.0, position.y * r * 2.0);
        vUv = uv;
        vA = (1.0 - k) * step(k, 1.0) * smoothstep(0.0, 0.12, k);
        gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.0);
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uColor; uniform float uOpacity;
      varying vec2 vUv; varying float vA;
      void main() {
        float d = length(vUv - 0.5) * 2.0;
        float ring = exp(-pow((d - 0.80) / 0.20, 2.0));
        float core = exp(-pow(d / 0.30, 2.0)) * 0.35;
        gl_FragColor = vec4(uColor, (ring + core) * vA * uOpacity);
      }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  const m = iquads(i, { aPos, aRand }, mat, 5);
  scene.add(m);
  return mat;
}

/* ========================== EAVE DRIPS ============================= */
function makeDrips(scene, rnd, points) {
  const N = points.length;
  const aPos = arr(N, 3), aRand = arr(N, 4);
  points.forEach((d, i) => {
    aPos.data[i * 3] = d.x; aPos.data[i * 3 + 1] = d.top; aPos.data[i * 3 + 2] = d.z;
    aRand.data[i * 4] = d.speed;
    aRand.data[i * 4 + 1] = 0.07 + rnd() * 0.07;
    aRand.data[i * 4 + 2] = d.phase;
    aRand.data[i * 4 + 3] = d.y;
  });
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uColor: { value: new THREE.Color('#cfe6ff') },
      uOpacity: { value: 0.72 },
      uCamRight: { value: new THREE.Vector3(1, 0, 0) },
    },
    vertexShader: /* glsl */`
      attribute vec3 aPos; attribute vec4 aRand;
      uniform float uTime; uniform vec3 uCamRight;
      varying vec2 vUv; varying float vA;
      void main() {
        float t = fract(uTime * aRand.x + aRand.z);
        float k = t * t;
        float y = mix(aPos.y, aRand.w, k);
        vec3 c = vec3(aPos.x, y, aPos.z);
        vec3 right = normalize(vec3(uCamRight.x, 0.0, uCamRight.z));
        float len = aRand.y * (0.5 + k * 1.6);
        vec3 wp = c + right * (position.x * 0.022) + vec3(0.0, 1.0, 0.0) * (position.y * len);
        vUv = uv;
        vA = smoothstep(0.0, 0.08, t) * (1.0 - smoothstep(0.90, 1.0, t));
        gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.0);
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uColor; uniform float uOpacity;
      varying vec2 vUv; varying float vA;
      void main() {
        float a = 1.0 - abs(vUv.x - 0.5) * 2.0;
        a *= smoothstep(0.0, 0.25, vUv.y) * (1.0 - smoothstep(0.7, 1.0, vUv.y));
        gl_FragColor = vec4(uColor, a * vA * uOpacity);
      }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  const m = iquads(N, { aPos, aRand }, mat, 7);
  scene.add(m);
  return mat;
}

/* ============================= STEAM =============================== */
function makeSteam(scene, rnd, sources) {
  const per = 26, N = sources.length * per;
  const aPos = arr(N, 3), aRand = arr(N, 4), aCol = arr(N, 3);
  let i = 0;
  for (const s of sources) {
    for (let k = 0; k < per; k++, i++) {
      aPos.data[i * 3] = s[0] + (rnd() - 0.5) * (s[3] || 0.3);
      aPos.data[i * 3 + 1] = s[1];
      aPos.data[i * 3 + 2] = s[2] + (rnd() - 0.5) * (s[3] || 0.3);
      aRand.data[i * 4] = 0.16 + rnd() * 0.16;
      aRand.data[i * 4 + 1] = s[4] || 1.1;
      aRand.data[i * 4 + 2] = rnd();
      aRand.data[i * 4 + 3] = (s[5] || 0.28) * (0.6 + rnd() * 0.8);
      const c = new THREE.Color(s[6] || '#ffd9b0');
      aCol.data[i * 3] = c.r; aCol.data[i * 3 + 1] = c.g; aCol.data[i * 3 + 2] = c.b;
    }
  }
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 }, uOpacity: { value: 0.16 },
      uCamRight: { value: new THREE.Vector3(1, 0, 0) },
      uCamUp: { value: new THREE.Vector3(0, 1, 0) },
    },
    vertexShader: /* glsl */`
      attribute vec3 aPos; attribute vec4 aRand; attribute vec3 aCol;
      uniform float uTime; uniform vec3 uCamRight, uCamUp;
      varying vec2 vUv; varying float vA; varying vec3 vCol;
      void main() {
        float ph = fract(uTime * aRand.x + aRand.z);
        float sc = aRand.w * (0.30 + ph * 1.5);
        vec3 c = aPos;
        c.y += ph * aRand.y;
        c.x += sin(ph * 5.0 + aRand.z * 30.0) * 0.13 * ph;
        c.z += cos(ph * 4.2 + aRand.z * 21.0) * 0.11 * ph;
        vec3 wp = c + uCamRight * (position.x * sc) + uCamUp * (position.y * sc);
        vUv = uv; vCol = aCol;
        vA = sin(ph * 3.14159) * (1.0 - ph * 0.35);
        gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.0);
      }`,
    fragmentShader: /* glsl */`
      uniform float uOpacity;
      varying vec2 vUv; varying float vA; varying vec3 vCol;
      void main() {
        float d = length(vUv - 0.5) * 2.0;
        float a = exp(-pow(d / 0.62, 2.0)) * (1.0 - smoothstep(0.75, 1.0, d));
        gl_FragColor = vec4(vCol, a * vA * uOpacity);
      }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  const m = iquads(N, { aPos, aRand, aCol }, mat, 6);
  scene.add(m);
  return mat;
}

/* ========================= HALOS + SHAFTS ========================== */
function makeHalos(scene, list) {
  const N = list.length;
  const aPos = arr(N, 3), aRand = arr(N, 4), aCol = arr(N, 3);
  list.forEach((s, i) => {
    aPos.data[i * 3] = s.p[0]; aPos.data[i * 3 + 1] = s.p[1]; aPos.data[i * 3 + 2] = s.p[2];
    aRand.data[i * 4] = s.s;
    aRand.data[i * 4 + 1] = s.i;
    aRand.data[i * 4 + 2] = s.pulse || 0;
    aRand.data[i * 4 + 3] = s.phase || 0;
    const c = new THREE.Color(s.c);
    aCol.data[i * 3] = c.r; aCol.data[i * 3 + 1] = c.g; aCol.data[i * 3 + 2] = c.b;
  });
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uCamRight: { value: new THREE.Vector3(1, 0, 0) },
      uCamUp: { value: new THREE.Vector3(0, 1, 0) },
    },
    vertexShader: /* glsl */`
      attribute vec3 aPos; attribute vec4 aRand; attribute vec3 aCol;
      uniform float uTime; uniform vec3 uCamRight, uCamUp;
      varying vec2 vUv; varying vec3 vCol; varying float vI;
      void main() {
        float pulse = 1.0 + aRand.z * sin(uTime * 5.0 + aRand.w * 12.0);
        float sc = aRand.x;
        vec3 wp = aPos + uCamRight * (position.x * sc) + uCamUp * (position.y * sc);
        vUv = uv; vCol = aCol; vI = aRand.y * pulse;
        gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.0);
      }`,
    fragmentShader: /* glsl */`
      varying vec2 vUv; varying vec3 vCol; varying float vI;
      void main() {
        float d = length(vUv - 0.5) * 2.0;
        float a = exp(-pow(d / 0.42, 2.0)) * 0.55 + exp(-pow(d / 0.85, 2.0)) * 0.20;
        a *= (1.0 - smoothstep(0.80, 1.0, d));
        gl_FragColor = vec4(vCol, a * vI);
      }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  const m = iquads(N, { aPos, aRand, aCol }, mat, 8);
  scene.add(m);
  return mat;
}

function makeShaft(scene, pos, height, radius, color, intensity) {
  const geo = new THREE.ConeGeometry(radius, height, 20, 1, true);
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(color) },
      uI: { value: intensity },
      uTime: { value: 0 },
    },
    vertexShader: /* glsl */`
      varying vec3 vN; varying vec3 vW; varying float vT;
      void main() {
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vW = wp.xyz;
        vN = normalize(mat3(modelMatrix) * normal);
        vT = uv.y;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uColor; uniform float uI; uniform float uTime;
      varying vec3 vN; varying vec3 vW; varying float vT;
      void main() {
        vec3 V = normalize(cameraPosition - vW);
        float rim = pow(1.0 - abs(dot(V, normalize(vN))), 1.6);
        float fall = pow(vT, 1.7);
        float shimmer = 0.9 + 0.1 * sin(uTime * 1.7 + vW.y * 2.0);
        gl_FragColor = vec4(uColor, (0.30 + rim * 0.85) * fall * uI * shimmer);
      }`,
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
  });
  const m = new THREE.Mesh(geo, mat);
  m.position.set(pos[0], pos[1] - height / 2, pos[2]);
  m.renderOrder = 4;
  scene.add(m);
  return mat;
}

/* ============================= BUILD =============================== */
export function buildRain(scene, opts) {
  const rnd = seeded(424242);

  // drip emission points along both canopy edges + roof parapet
  const dripPoints = [];
  const awnY = L.awn.y - L.awn.t / 2 - 0.02;
  for (let i = 0; i < 18; i++) {
    const x = L.store.x0 + 0.25 + i * ((L.store.x1 - L.store.x0 - 0.5) / 17);
    const sp = 0.55 + rnd() * 1.1;
    dripPoints.push({ x, z: L.awn.front - 0.05, top: awnY, y: L.walkY + 0.014, speed: sp, phase: rnd() });
  }
  for (let i = 0; i < 13; i++) {
    const z = L.store.z0 + 0.3 + i * ((L.store.z1 - L.store.z0 - 0.6) / 12);
    const sp = 0.55 + rnd() * 1.1;
    dripPoints.push({ x: L.awn.side - 0.05, z, top: awnY, y: L.walkY + 0.014, speed: sp, phase: rnd() });
  }
  for (let i = 0; i < 8; i++) {
    const x = L.store.x0 + 0.6 + i * 1.2;
    const sp = 0.4 + rnd() * 0.8;
    dripPoints.push({ x, z: L.store.z0 + 0.02, top: 4.9, y: L.walkY + 0.014, speed: sp, phase: rnd() });
  }

  const rain = makeRain(scene, rnd);
  const splashPoints = dripPoints.map(d => ({ x: d.x, y: d.y, z: d.z, speed: d.speed, phase: d.phase }));
  const splash = makeSplashes(scene, rnd, splashPoints);
  const drips = makeDrips(scene, rnd, dripPoints);

  const steam = makeSteam(scene, rnd, [
    [...opts.steamSrc[0], 0.5, 0.95, 0.24, '#ffcf90'],
    [...opts.steamSrc[1], 0.4, 0.85, 0.20, '#ffc070'],
    [...opts.steamSrc[2], 0.3, 0.75, 0.18, '#ffe0b0'],
    [5.45, 0.10, 5.85, 0.5, 1.6, 0.42, '#8fb4e8'],
    [-8.45, 0.20, -5.0, 0.6, 1.9, 0.5, '#7fa0d8'],
    [2.02, 1.30, -3.30, 0.16, 0.6, 0.12, '#ffd9a8'],
  ]);

  const halos = makeHalos(scene, [
    { p: opts.lamps[0], s: 2.6, i: 0.55, c: '#bcd8ff', pulse: 0.03, phase: 0.1 },
    { p: opts.lamps[1], s: 2.3, i: 0.50, c: '#bcd8ff', pulse: 0.03, phase: 0.5 },
    { p: opts.lamps[2], s: 2.1, i: 0.40, c: '#bcd8ff', pulse: 0.03, phase: 0.8 },
    { p: [-2.5, 3.90, 0.95], s: 9.5, i: 0.14, c: '#9fe8c8', pulse: 0.05, phase: 0.2 },
    { p: [2.95, 3.90, -3.3], s: 7.5, i: 0.13, c: '#9fe8c8', pulse: 0.05, phase: 0.6 },
    { p: [3.42, 1.30, -1.60], s: 2.6, i: 0.42, c: '#7fd0ff', pulse: 0.04, phase: 0.3 },
    { p: [3.42, 1.30, -2.80], s: 2.4, i: 0.38, c: '#ff9a8a', pulse: 0.04, phase: 0.7 },
    { p: [-9.75, 4.30, -0.56], s: 2.4, i: 0.50, c: '#ff5f96', pulse: 0.10, phase: 0.4 },
    { p: [-9.15, 3.10, -2.20], s: 1.7, i: 0.45, c: '#ff8a4a', pulse: 0.08, phase: 0.9 },
    { p: [0.6, 1.60, 0.9], s: 4.2, i: 0.24, c: '#ffcf90', pulse: 0.02, phase: 0.15 },
    { p: [8.6, 4.30, 11.1], s: 1.5, i: 0.30, c: '#ff6a5a', pulse: 0.06, phase: 0.25 },
  ]);

  const shafts = [
    makeShaft(scene, opts.lamps[0], opts.lamps[0][1] - 0.1, 1.9, '#9dc4ff', 0.085),
    makeShaft(scene, opts.lamps[1], opts.lamps[1][1] - 0.1, 1.7, '#9dc4ff', 0.075),
    makeShaft(scene, opts.lamps[2], opts.lamps[2][1] - 0.1, 1.5, '#9dc4ff', 0.07),
    makeShaft(scene, [0.6, 3.20, 1.30], 3.0, 1.5, '#ffbe78', 0.055),
  ];

  const right = new THREE.Vector3(), up = new THREE.Vector3();
  const mats = [rain, splash, drips, steam, halos];

  return {
    update(t, camera) {
      right.setFromMatrixColumn(camera.matrixWorld, 0).normalize();
      up.setFromMatrixColumn(camera.matrixWorld, 1).normalize();
      rain.uniforms.uTime.value = t;
      rain.uniforms.uCamRight.value.copy(right);
      splash.uniforms.uTime.value = t;
      drips.uniforms.uTime.value = t;
      drips.uniforms.uCamRight.value.copy(right);
      steam.uniforms.uTime.value = t;
      steam.uniforms.uCamRight.value.copy(right);
      steam.uniforms.uCamUp.value.copy(up);
      halos.uniforms.uTime.value = t;
      halos.uniforms.uCamRight.value.copy(right);
      halos.uniforms.uCamUp.value.copy(up);
      for (const s of shafts) s.uniforms.uTime.value = t;
    },
    setIntensity(k) {
      rain.uniforms.uOpacity.value = 0.20 * k;
      splash.uniforms.uOpacity.value = 0.26 * k;
    },
  };
}