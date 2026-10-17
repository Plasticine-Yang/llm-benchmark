import * as THREE from 'three';
import { STORE, SIDEWALK_Y } from './config.js';
import {
  addBox,
  addCylinder,
  addGroundPlane,
  addPlane,
  addGlowSprite,
  basic,
  physical,
  canvasTexture,
  reflectionTexture,
  getSharedStreakTexture,
  getSharedGlowTexture,
  mulberry32,
  outlineOff,
} from './lib.js';

/* ------------------------------------------------------------------ */
/* Rain                                                               */
/* ------------------------------------------------------------------ */

function makeRain() {
  const rng = mulberry32(104);
  const count = 1350;
  const base = new THREE.PlaneGeometry(1, 1);
  const geo = new THREE.InstancedBufferGeometry();
  geo.index = base.index;
  geo.setAttribute('position', base.attributes.position);
  geo.setAttribute('uv', base.attributes.uv);
  const seeds = new Float32Array(count * 3);
  const speeds = new Float32Array(count);
  const scales = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    seeds[i * 3] = rng();
    seeds[i * 3 + 1] = rng();
    seeds[i * 3 + 2] = rng();
    speeds[i] = 3.1 + rng() * 4.3;
    scales[i] = 0.55 + rng() * rng() * 2.6;
  }
  geo.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seeds, 3));
  geo.setAttribute('aSpeed', new THREE.InstancedBufferAttribute(speeds, 1));
  geo.setAttribute('aScale', new THREE.InstancedBufferAttribute(scales, 1));
  geo.instanceCount = count;

  const uniforms = {
    uTime: { value: 0 },
    uColor: { value: new THREE.Color(0xc6e9fa) },
    uOpacity: { value: 0.3 },
    uPixelRatio: { value: Math.min(window.devicePixelRatio || 1, 2) },
  };
  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: /* glsl */ `
      attribute vec3 aSeed;
      attribute float aSpeed;
      attribute float aScale;
      uniform float uTime;
      varying vec2 vUv;
      varying float vAlpha;

      void main() {
        vUv = uv;
        float span = 10.6;
        float fall = mod(aSeed.y * span + uTime * aSpeed, span);
        vec3 world = vec3((aSeed.x - 0.5) * 14.2, 9.4 - fall, (aSeed.z - 0.5) * 14.2);

        // The shop is warm and dry inside. Hide all rain beneath its roof.
        bool inside = world.x > -4.16 && world.x < 2.28 &&
                      world.z > -4.74 && world.z < 1.88 &&
                      world.y < 5.15;

        vec4 viewPos = viewMatrix * vec4(world, 1.0);
        float len = 0.235 * aScale;
        vec2 corner = vec2(position.x * 0.0115 * aScale, (position.y + 0.5) * len);
        // Slight wind slant and flicker.
        corner.x += corner.y * 0.13 + sin(uTime * 0.5 + aSeed.z * 9.0) * 0.005;
        viewPos.xy += corner;

        float farFade = 1.0 - smoothstep(18.0, 31.0, -viewPos.z);
        float nearFade = smoothstep(2.0, 4.0, -viewPos.z);
        vAlpha = inside ? 0.0 : farFade * nearFade * (0.62 + 0.38 * aSeed.x);
        gl_Position = projectionMatrix * viewPos;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform float uOpacity;
      varying vec2 vUv;
      varying float vAlpha;
      void main() {
        float edge = smoothstep(0.0, 0.32, vUv.x) * (1.0 - smoothstep(0.68, 1.0, vUv.x));
        float tail = smoothstep(0.0, 0.28, vUv.y) * (1.0 - smoothstep(0.8, 1.0, vUv.y));
        float alpha = edge * tail * uOpacity * vAlpha;
        if (alpha < 0.008) discard;
        gl_FragColor = vec4(uColor, alpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    depthTest: true,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
  });
  material.userData.outlineParameters = { visible: false };
  const rain = new THREE.Mesh(geo, material);
  rain.frustumCulled = false;
  rain.renderOrder = 12;
  return { rain, uniforms };
}

/* ------------------------------------------------------------------ */
/* Glass drops                                                        */
/* ------------------------------------------------------------------ */

function makeGlassRain(parent, sceneRng) {
  const tex = getSharedStreakTexture();
  const streaks = [];
  const group = new THREE.Group();
  group.name = 'rain-on-glass';
  parent.add(group);
  const frontZ = STORE.front + 0.095;
  const rightX = STORE.right + 0.095;
  const rng = mulberry32(77);
  for (let i = 0; i < 34; i++) {
    // Distribute across the big left window and the narrow right pane.
    let x;
    if (i < 30) x = -3.72 + ((i + rng() * 0.8) / 30) * 4.07;
    else x = 1.95 + rng() * 0.1;
    const height = 0.16 + rng() * 0.26;
    const w = 0.018 + rng() * 0.025;
    const mat = basic(0xffffff, {
      map: tex,
      transparent: true,
      opacity: 0.42 + rng() * 0.25,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const mesh = addPlane(group, w, height, mat, x, 0.4 + rng() * 2.25, frontZ, { renderOrder: 10 });
    streaks.push({
      mesh,
      x,
      speed: 0.08 + rng() * 0.15,
      phase: rng(),
      minY: 0.37,
      maxY: 2.78,
      wobble: 0.4 + rng() * 1.6,
    });
  }
  for (let i = 0; i < 18; i++) {
    const z = -2.63 + rng() * 4.23;
    const height = 0.15 + rng() * 0.23;
    const w = 0.018 + rng() * 0.022;
    const mat = basic(0xffffff, {
      map: tex,
      transparent: true,
      opacity: 0.31 + rng() * 0.22,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const mesh = addPlane(group, w, height, mat, rightX, 0.4 + rng() * 2.18, z, { ry: Math.PI / 2, renderOrder: 10 });
    streaks.push({
      mesh,
      x: z,
      speed: 0.07 + rng() * 0.12,
      phase: rng(),
      minY: 0.37,
      maxY: 2.72,
      wobble: 0.4 + rng() * 1.2,
      side: true,
    });
  }

  // Static beads, like a thousand tiny lenses.
  const beadGeo = new THREE.SphereGeometry(0.011, 5, 4);
  const beadMat = basic(0xd9f8ff, { transparent: true, opacity: 0.5 });
  const beads = [];
  for (let i = 0; i < 54; i++) {
    const bead = new THREE.Mesh(beadGeo, beadMat);
    const front = i < 40;
    if (front) bead.position.set(-3.8 + rng() * 5.7, 0.4 + rng() * 2.27, frontZ + 0.012);
    else bead.position.set(rightX + 0.012, 0.4 + rng() * 2.2, -2.7 + rng() * 4.3);
    const s = 0.6 + rng() * 1.7;
    bead.scale.set(s, s * (1.2 + rng()), 0.6);
    group.add(bead);
    beads.push({ bead, phase: rng() * Math.PI * 2 });
  }

  // Condensation haze near the bottom of the glass.
  const hazeTex = canvasTexture(512, 256, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, h, 0, 0);
    g.addColorStop(0, 'rgba(214,243,243,0.22)');
    g.addColorStop(0.42, 'rgba(214,243,243,0.07)');
    g.addColorStop(1, 'rgba(214,243,243,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    for (let i = 0; i < 40; i++) {
      ctx.beginPath();
      ctx.arc(Math.random() * w, h * (0.55 + Math.random() * 0.45), 1 + Math.random() * 3, 0, Math.PI * 2);
      ctx.fill();
    }
  });
  addPlane(group, 5.9, 0.42, basic(0xffffff, { map: hazeTex, transparent: true, depthWrite: false }), -1.02, 0.49, frontZ + 0.005, {
    renderOrder: 9,
  });
  addPlane(group, 4.8, 0.4, basic(0xffffff, { map: hazeTex, transparent: true, depthWrite: false }), rightX + 0.005, 0.49, -0.58, {
    ry: Math.PI / 2,
    renderOrder: 9,
  });

  return {
    group,
    update(t) {
      for (const s of streaks) {
        const c = (t * s.speed + s.phase) % 1;
        const y = s.maxY - c * (s.maxY - s.minY);
        s.mesh.position.y = y;
        s.mesh.position.x = s.side ? rightX + 0.003 + Math.sin(t * 0.7 + s.phase * 8) * 0.003 : s.mesh.position.x;
        s.mesh.material.opacity = (s.side ? 0.22 : 0.36) + Math.sin(c * Math.PI) * 0.23;
        if (!s.side) {
          s.mesh.position.x = s.x + Math.sin(t * 0.35 + s.phase * 13) * 0.006;
        } else {
          s.mesh.position.z = s.x;
        }
        s.mesh.scale.y = 0.7 + Math.sin(c * Math.PI) * 0.6 + Math.sin(t * 2.2 + s.phase * 9) * 0.08;
      }
      for (const b of beads) {
        b.bead.material.opacity = 0.42 + Math.sin(t * 1.1 + b.phase) * 0.05;
      }
    },
  };
}

/* ------------------------------------------------------------------ */
/* Puddle rings                                                       */
/* ------------------------------------------------------------------ */

function makePuddleRipples(parent, puddles) {
  const rng = mulberry32(501);
  const group = new THREE.Group();
  parent.add(group);
  const rings = [];
  const ringGeo = new THREE.RingGeometry(0.72, 1.0, 28);
  ringGeo.rotateX(-Math.PI / 2);
  const valid = puddles.filter((p) => p.rx > 0.11 && p.rz > 0.1);
  for (let i = 0; i < 46; i++) {
    const p = valid.length ? valid[Math.floor(rng() * valid.length)] : { x: 0, z: 4, rx: 1, rz: 1, y: 0.04 };
    const x = p.x + (rng() - 0.5) * p.rx * 1.35;
    const z = p.z + (rng() - 0.5) * p.rz * 1.35;
    const mat = new THREE.MeshBasicMaterial({
      color: i % 5 === 0 ? 0xffe3b5 : 0xc4eefc,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      toneMapped: false,
    });
    mat.userData.outlineParameters = { visible: false };
    const ring = new THREE.Mesh(ringGeo, mat);
    ring.position.set(x, p.y + 0.008 + i * 0.00001, z);
    ring.scale.setScalar(0.1);
    ring.renderOrder = 4;
    group.add(ring);
    rings.push({
      mesh: ring,
      phase: rng(),
      duration: 0.7 + rng() * 1.2,
      delay: rng() * 3,
      maxRadius: 0.11 + rng() * 0.28,
      color: i % 5 === 0 ? 1 : 0,
    });
  }
  // Small rings where the awning runs off.
  for (let i = 0; i < 12; i++) {
    const x = -3.8 + rng() * 5.8;
    const mat = new THREE.MeshBasicMaterial({
      color: 0xceefff,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      toneMapped: false,
    });
    mat.userData.outlineParameters = { visible: false };
    const ring = new THREE.Mesh(ringGeo, mat);
    ring.position.set(x, SIDEWALK_Y + 0.02, 2.55 + rng() * 0.2);
    ring.scale.setScalar(0.06);
    group.add(ring);
    rings.push({
      mesh: ring,
      phase: rng(),
      duration: 0.55 + rng() * 0.6,
      delay: rng() * 1.5,
      maxRadius: 0.035 + rng() * 0.08,
      color: 0,
    });
  }

  return {
    group,
    update(t) {
      for (const r of rings) {
        const local = (t + r.delay) / r.duration + r.phase;
        const c = local % 1;
        r.mesh.visible = true;
        r.mesh.scale.setScalar(r.maxRadius * (0.16 + c * 1.05));
        r.mesh.material.opacity = Math.sin(c * Math.PI) * (1 - c * 0.36) * (r.color ? 0.4 : 0.28);
      }
    },
  };
}

/* ------------------------------------------------------------------ */
/* Awning drips                                                       */
/* ------------------------------------------------------------------ */

function makeDrips(parent) {
  const rng = mulberry32(909);
  const group = new THREE.Group();
  parent.add(group);
  const geo = new THREE.CapsuleGeometry(0.014, 0.15, 2, 4);
  const mat = basic(0xdaF4ff, { transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending });
  const ringGeo = new THREE.RingGeometry(0.55, 1, 18);
  ringGeo.rotateX(-Math.PI / 2);
  const drips = [];
  for (let i = 0; i < 17; i++) {
    const front = i < 12;
    const x = front ? -3.8 + rng() * 5.7 : STORE.right + 0.15 + rng() * 0.38;
    const z = front ? STORE.front + 0.62 + rng() * 0.12 : -2.5 + rng() * 4;
    const drop = new THREE.Mesh(geo, mat);
    drop.position.set(x, 2.3, z);
    drop.scale.y = 0.7 + rng() * 0.8;
    group.add(drop);
    const ringMat = basic(0xc9efff, { transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = 0; // geometry already flat
    ring.position.set(x, 0.18, z);
    ring.scale.setScalar(0.03);
    group.add(ring);
    drips.push({
      drop,
      ring,
      x,
      z,
      phase: rng(),
      speed: 0.55 + rng() * 0.42,
      side: !front,
    });
  }
  return {
    group,
    update(t) {
      for (const d of drips) {
        const c = (t * d.speed + d.phase) % 1;
        const fallWindow = 0.86;
        if (c < 0.07) {
          // Gathering at the eave.
          d.drop.visible = true;
          d.drop.position.y = 2.885;
          d.drop.scale.y = 0.25;
          d.ring.material.opacity = 0;
        } else if (c < fallWindow) {
          const p = (c - 0.07) / (fallWindow - 0.07);
          d.drop.visible = true;
          d.drop.position.y = 2.87 - p * 2.73;
          d.drop.position.x = d.x + Math.sin(t * 1.1 + d.phase * 7) * 0.006;
          d.drop.scale.y = 0.6 + p * 1.5;
          d.ring.material.opacity = 0;
        } else {
          d.drop.visible = false;
          const p = (c - fallWindow) / (1 - fallWindow);
          d.ring.position.x = d.x;
          d.ring.position.z = d.z;
          d.ring.scale.setScalar(0.025 + p * 0.11);
          d.ring.material.opacity = (1 - p) * 0.18;
        }
      }
    },
  };
}

/* ------------------------------------------------------------------ */
/* Faint steam from the storm drains                                  */
/* ------------------------------------------------------------------ */

function makeDrainSteam(parent, ctx) {
  const rng = mulberry32(818);
  const group = new THREE.Group();
  parent.add(group);
  const sources = [
    [-0.2, 0.17, 2.92],
    [3.12, 0.17, -1.65],
    [4.8, 0.06, 5.48],
  ];
  const wisps = [];
  for (let s = 0; s < sources.length; s++) {
    const [sx, sy, sz] = sources[s];
    for (let i = 0; i < 4; i++) {
      const mat = new THREE.SpriteMaterial({
        map: getSharedGlowTexture(),
        color: 0xb8d6dd,
        transparent: true,
        opacity: 0.03,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
      });
      const sp = new THREE.Sprite(mat);
      sp.position.set(sx + (rng() - 0.5) * 0.12, sy + 0.08, sz + (rng() - 0.5) * 0.12);
      sp.scale.set(0.18, 0.36, 1);
      group.add(sp);
      wisps.push({ sp, sx, sy, sz, phase: rng(), speed: 0.12 + rng() * 0.08, drift: 0.1 + rng() * 0.2 });
    }
  }
  return {
    group,
    update(t) {
      for (const w of wisps) {
        const c = (t * w.speed + w.phase) % 1;
        w.sp.position.set(w.sx + Math.sin(c * 7 + w.phase * 13) * w.drift + c * w.drift * 0.5, w.sy + 0.02 + c * 0.62, w.sz + Math.cos(c * 5 + w.phase) * w.drift * 0.3);
        w.sp.scale.set(0.15 + c * 0.42, 0.25 + c * 0.62, 1);
        w.sp.material.opacity = Math.sin(c * Math.PI) * 0.055 * (1 - c * 0.4);
      }
    },
  };
}

/* ------------------------------------------------------------------ */
/* Low mist                                                           */
/* ------------------------------------------------------------------ */

function makeMist(parent) {
  const rng = mulberry32(404);
  const group = new THREE.Group();
  parent.add(group);
  const tex = getSharedGlowTexture();
  const mists = [];
  for (let i = 0; i < 7; i++) {
    const mat = new THREE.SpriteMaterial({
      map: tex,
      color: 0xaac8d8,
      transparent: true,
      opacity: 0.026 + rng() * 0.02,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
    });
    const s = new THREE.Sprite(mat);
    s.position.set(-5.5 + rng() * 11, 0.28 + rng() * 0.4, -4.8 + rng() * 10);
    s.scale.set(3.4 + rng() * 3.4, 0.8 + rng() * 0.7, 1);
    group.add(s);
    mists.push({ s, phase: rng() * 8, sx: s.position.x, sz: s.position.z, drift: 0.1 + rng() * 0.3 });
  }
  return {
    group,
    update(t) {
      for (const m of mists) {
        m.s.position.x = m.sx + Math.sin(t * 0.04 + m.phase) * m.drift;
        m.s.position.z = m.sz + Math.cos(t * 0.03 + m.phase) * m.drift * 0.6;
        m.s.material.opacity = 0.018 + 0.014 * (0.5 + 0.5 * Math.sin(t * 0.1 + m.phase));
      }
    },
  };
}

/* ------------------------------------------------------------------ */
/* Warm patch reflections / glints                                    */
/* ------------------------------------------------------------------ */

function makeWetGlints(parent) {
  const rng = mulberry32(222);
  const group = new THREE.Group();
  parent.add(group);
  const tex = reflectionTexture(['rgba(255,212,150,0.9)', 'rgba(113,221,208,0.7)', 'rgba(255,139,169,0.5)'], 11, 8);
  const glints = [];
  for (let i = 0; i < 9; i++) {
    const mat = basic(0xffffff, {
      map: tex,
      transparent: true,
      opacity: 0.06 + rng() * 0.1,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });
    const mesh = addGroundPlane(group, 0.06 + rng() * 0.16, 0.4 + rng() * 0.8, mat, -4.0 + rng() * 9, 0.041 + rng() * 0.002, 3.1 + rng() * 2.1);
    mesh.renderOrder = 4;
    glints.push({ mesh, phase: rng() * 8, base: mat, speed: 0.45 + rng() * 0.4 });
  }
  return {
    group,
    update(t) {
      for (const g of glints) {
        g.mesh.material.opacity = 0.02 + 0.11 * Math.max(0, Math.sin(t * g.speed + g.phase));
        g.mesh.scale.x = 0.8 + Math.sin(t * 0.33 + g.phase) * 0.16;
      }
    },
  };
}

export function buildWeather(ctx) {
  const group = new THREE.Group();
  group.name = 'rain-and-atmosphere';
  ctx.scene.add(group);
  const rain = makeRain();
  group.add(rain.rain);
  const glass = makeGlassRain(group, ctx);
  const ripples = makePuddleRipples(group, ctx.puddles ?? []);
  const drips = makeDrips(group);
  const mist = makeMist(group);
  const drainSteam = makeDrainSteam(group, ctx);
  const glints = makeWetGlints(group);

  ctx.updaters.push({
    update(t) {
      rain.uniforms.uTime.value = t;
      rain.uniforms.uPixelRatio.value = Math.min(window.devicePixelRatio || 1, 2);
      glass.update(t);
      ripples.update(t);
      drips.update(t);
      mist.update(t);
      drainSteam.update(t);
      glints.update(t);
    },
  });

  return { group, rain, glass, ripples, drips, mist, glints };
}
