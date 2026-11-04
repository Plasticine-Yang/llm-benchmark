import * as THREE from 'three';
import { basic, plane, glow, glassRainTexture, puddleGeo } from './lib.js';
import { groundY } from './street.js';

function insideCovered(x, z) {
  // store body + canopy
  if (x > -2.95 && x < 2.48 && z > -3.25 && z < 1.65) return true;
  // neighbor building
  if (x > -4.72 && x < -3.38 && z > -3.7 && z < 0.8) return true;
  return false;
}

function randomSpot() {
  for (let k = 0; k < 30; k++) {
    const x = -5.2 + Math.random() * 10.4;
    const z = -5.2 + Math.random() * 10.4;
    if (!insideCovered(x, z)) return [x, z];
  }
  return [5.1, 5.1];
}

export function buildWeather(scene, puddleSpots = []) {
  const root = new THREE.Group();
  scene.add(root);
  const updaters = [];

  /* ---------------------------------------------------------------- */
  /*  Rain streaks                                                     */
  /* ---------------------------------------------------------------- */
  const COUNT = 1500;
  const positions = new Float32Array(COUNT * 6);
  const drops = [];
  for (let i = 0; i < COUNT; i++) {
    const [x, z] = randomSpot();
    const y = Math.random() * 8.5;
    const len = 0.20 + Math.random() * 0.38;
    const speed = 6.5 + Math.random() * 5.0;
    drops.push({ x, y, z, len, speed });
    positions[i * 6 + 0] = x;
    positions[i * 6 + 1] = y;
    positions[i * 6 + 2] = z;
    positions[i * 6 + 3] = x + 0.045 * len;
    positions[i * 6 + 4] = y - len;
    positions[i * 6 + 5] = z - 0.02 * len;
  }
  const rainGeo = new THREE.BufferGeometry();
  rainGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage));
  const rainMat = new THREE.LineBasicMaterial({
    color: 0xa8c6e8,
    transparent: true,
    opacity: 0.34,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    toneMapped: true,
  });
  const rain = new THREE.LineSegments(rainGeo, rainMat);
  rain.frustumCulled = false;
  root.add(rain);

  updaters.push((dt) => {
    const pos = rainGeo.attributes.position.array;
    for (let i = 0; i < COUNT; i++) {
      const d = drops[i];
      d.y -= d.speed * dt;
      d.x += 0.35 * dt;
      if (d.y < 0.0) {
        const [x, z] = randomSpot();
        d.x = x;
        d.z = z;
        d.y = 7.5 + Math.random() * 2.0;
        d.len = 0.20 + Math.random() * 0.38;
        d.speed = 6.5 + Math.random() * 5.0;
      }
      const o = i * 6;
      pos[o] = d.x;
      pos[o + 1] = d.y;
      pos[o + 2] = d.z;
      pos[o + 3] = d.x + 0.045 * d.len;
      pos[o + 4] = d.y - d.len;
      pos[o + 5] = d.z - 0.02 * d.len;
    }
    rainGeo.attributes.position.needsUpdate = true;
  });

  /* ---------------------------------------------------------------- */
  /*  Splash rings                                                     */
  /* ---------------------------------------------------------------- */
  const ringGeo = new THREE.RingGeometry(0.55, 0.72, 16);
  const splashes = [];
  for (let i = 0; i < 46; i++) {
    const mat = basic(0x9fc4e8, {
      transparent: true, opacity: 0, blending: THREE.AdditiveBlending,
      depthWrite: false, side: THREE.DoubleSide, toneMapped: true,
    });
    const m = new THREE.Mesh(ringGeo, mat);
    m.rotation.x = -Math.PI / 2;
    const [x, z] = randomSpot();
    m.position.set(x, groundY(x, z) + 0.018, z);
    m.scale.setScalar(0.001);
    root.add(m);
    splashes.push({ m, mat, t: Math.random(), speed: 1.1 + Math.random() * 1.6, x, z });
  }
  updaters.push((dt) => {
    for (const s of splashes) {
      s.t += dt * s.speed;
      if (s.t >= 1) {
        s.t = 0;
        const [x, z] = randomSpot();
        s.x = x; s.z = z;
        s.m.position.set(x, groundY(x, z) + 0.018, z);
      }
      const p = s.t;
      const sc = 0.02 + p * 0.30;
      s.m.scale.setScalar(sc);
      s.mat.opacity = (1 - p) * 0.38;
    }
  });

  /* ---------------------------------------------------------------- */
  /*  Puddle ripples                                                   */
  /* ---------------------------------------------------------------- */
  const ripples = [];
  const usablePuddles = puddleSpots.length ? puddleSpots : [[0, 3, 0.5, 1]];
  for (let i = 0; i < 34; i++) {
    const mat = basic(0xb8d8f0, {
      transparent: true, opacity: 0, blending: THREE.AdditiveBlending,
      depthWrite: false, side: THREE.DoubleSide, toneMapped: true,
    });
    const m = new THREE.Mesh(new THREE.RingGeometry(0.62, 0.70, 20), mat);
    m.rotation.x = -Math.PI / 2;
    root.add(m);
    ripples.push({ m, mat, t: Math.random(), speed: 0.5 + Math.random() * 0.8, spot: usablePuddles[i % usablePuddles.length] });
  }
  updaters.push((dt) => {
    for (const r of ripples) {
      r.t += dt * r.speed;
      if (r.t >= 1) {
        r.t = 0;
        const [cx, cz, rad] = r.spot;
        const a = Math.random() * Math.PI * 2;
        const rr = Math.random() * rad * 0.55;
        const x = cx + Math.cos(a) * rr;
        const z = cz + Math.sin(a) * rr * 0.65;
        r.m.position.set(x, groundY(cx, cz) + 0.026, z);
      }
      const p = r.t;
      r.m.scale.setScalar(0.05 + p * 0.24);
      r.mat.opacity = (1 - p) * 0.26;
    }
  });

  /* ---------------------------------------------------------------- */
  /*  Drips from the canopy                                            */
  /* ---------------------------------------------------------------- */
  const dripMat = basic(0xd7ecff, { transparent: true, opacity: 0.55, toneMapped: true });
  const drips = [];
  for (let i = 0; i < 16; i++) {
    const front = i < 11;
    const x = front ? (-2.55 + Math.random() * 4.0) : 2.36;
    const z = front ? 1.40 : (-2.9 + Math.random() * 3.4);
    const g = new THREE.Mesh(new THREE.SphereGeometry(0.022, 6, 6), dripMat);
    g.scale.set(1, 2.4, 1);
    const topY = 2.27;
    g.position.set(x, topY - Math.random() * 1.2, z);
    root.add(g);
    const ringMat = basic(0xbfe0ff, { transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: true });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(x, groundY(x, z) + 0.02, z);
    ring.scale.setScalar(0.001);
    root.add(ring);
    drips.push({
      g, ring, ringMat, x, z, y: topY - Math.random() * 1.5,
      speed: 1.4 + Math.random() * 1.4, delay: Math.random() * 2.4, ringT: 1,
    });
  }
  updaters.push((dt) => {
    for (const d of drips) {
      if (d.delay > 0) {
        d.delay -= dt;
        d.g.visible = false;
        continue;
      }
      d.g.visible = true;
      d.y -= d.speed * dt;
      d.g.position.y = d.y;
      const floor = groundY(d.x, d.z);
      if (d.y <= floor + 0.02) {
        d.ringT = 0;
        d.delay = 0.5 + Math.random() * 2.8;
        d.y = 2.27;
        d.g.position.y = d.y;
      }
      if (d.ringT < 1) {
        d.ringT = Math.min(1, d.ringT + dt * 2.4);
        const p = d.ringT;
        d.ring.scale.setScalar(0.01 + p * 0.11);
        d.ringMat.opacity = (1 - p) * 0.45;
      } else {
        d.ringMat.opacity = 0;
      }
    }
  });

  /* ---------------------------------------------------------------- */
  /*  Rain running down the glass                                      */
  /* ---------------------------------------------------------------- */
  const glassLayers = [];
  const baseTex = glassRainTexture();
  function addGlassRain(w, h, x, y, z, ry, opacity, speed, repeat) {
    const tex = baseTex.clone();
    tex.needsUpdate = true;
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(repeat[0], repeat[1]);
    const mat = basic(0xcfe8ff, {
      map: tex, transparent: true, opacity,
      blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: true,
      side: THREE.DoubleSide,
    });
    plane(root, w, h, x, y, z, mat, { ry });
    glassLayers.push({ tex, speed });
  }
  addGlassRain(1.80, 1.76, -1.66, 1.42, 0.724, 0, 0.025, 0.035, [1, 1]);
  addGlassRain(1.80, 1.76, -1.66, 1.42, 0.726, 0, 0.008, 0.065, [2, 1.4]);
  addGlassRain(0.66, 1.76, 1.06, 1.42, 0.724, 0, 0.025, 0.040, [1, 1]);
  addGlassRain(3.54, 1.76, 1.476, 1.42, -1.2, Math.PI / 2, 0.025, 0.032, [2, 1]);
  addGlassRain(3.54, 1.76, 1.474, 1.42, -1.2, Math.PI / 2, 0.008, 0.060, [3, 1.3]);

  updaters.push((dt) => {
    for (const l of glassLayers) {
      l.tex.offset.y -= dt * l.speed;
      l.tex.offset.x += dt * l.speed * 0.08;
    }
  });

  /* ---------------------------------------------------------------- */
  /*  Low mist                                                         */
  /* ---------------------------------------------------------------- */
  const mists = [];
  for (let i = 0; i < 5; i++) {
    const s = glow(root, 0x7f9fd0, 3.2 + Math.random() * 2.0, 0.028, -4 + Math.random() * 8, 0.35, -3 + Math.random() * 7);
    mists.push({ s, phase: Math.random() * 6.28 });
  }
  updaters.push((dt, t) => {
    for (const m of mists) {
      m.s.material.opacity = 0.028 * (0.8 + 0.2 * Math.sin(t * 0.35 + m.phase));
    }
  });

  return {
    group: root,
    update(dt, t) {
      for (const u of updaters) u(dt, t);
    },
  };
}
