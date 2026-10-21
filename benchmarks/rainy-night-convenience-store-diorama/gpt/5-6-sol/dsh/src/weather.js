import * as THREE from 'three';
import { C } from './palette.js';
import { box, glow, group, plane, standard, toon } from './modeling.js';
import { rainStreakTexture, windowGlowTexture } from './textures.js';

function createRain(parent) {
  const count = 1350;
  const positions = new Float32Array(count * 6);
  const seeds = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const x = -9 + Math.random() * 18;
    const y = .7 + Math.random() * 10;
    const z = -9 + Math.random() * 18;
    const len = .18 + Math.random() * .38;
    const drift = .05 + Math.random() * .08;
    const k = i * 6;
    positions[k] = x;
    positions[k + 1] = y;
    positions[k + 2] = z;
    positions[k + 3] = x - drift;
    positions[k + 4] = y - len;
    positions[k + 5] = z + drift * .35;
    seeds[i] = Math.random();
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const material = new THREE.LineBasicMaterial({
    color: 0xbde8f7,
    transparent: true,
    opacity: .23,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const rain = new THREE.LineSegments(geometry, material);
  rain.name = 'continuous-anime-rain';
  rain.frustumCulled = false;
  rain.renderOrder = 8;
  parent.add(rain);
  return { rain, positions, seeds, count };
}

function createDrips(parent) {
  const drips = [];
  for (let i = 0; i < 26; i++) {
    const x = -5.65 + i * .36;
    const drop = box('canopy-water-drip', [.018, .16 + Math.random() * .2, .018], [x, 3.8, 2.22], glow(0xbdebf7, .6), parent, { outline: false, castShadow: false });
    drop.material.transparent = true;
    drop.material.opacity = .42 + Math.random() * .25;
    drips.push({ mesh: drop, phase: Math.random() * 10, speed: .7 + Math.random() * .8, baseY: 3.8 });
  }
  for (let i = 0; i < 7; i++) {
    const drop = box('roof-runoff-drop', [.024, .3 + Math.random() * .35, .024], [3.72, 4.8 - i * .02, -3.8 + i * .8], glow(0xc0eaf6, .5), parent, { outline: false, castShadow: false });
    drop.material.transparent = true;
    drop.material.opacity = .4;
    drips.push({ mesh: drop, phase: Math.random() * 10, speed: .8 + Math.random(), baseY: 4.8 });
  }
  return drips;
}

function createPuddles(parent) {
  const puddles = [];
  const puddleData = [
    [-3.2, 5.35, 3.7, 1.05, C.teal],
    [1.55, 5.85, 2.4, .75, C.warm],
    [6.25, 1.65, 1.45, .52, C.coral],
    [6.8, -2.3, 1.3, .6, C.blue],
    [-1.0, 3.98, 1.6, .38, C.warm],
    [-6.5, 6.7, 1.55, .43, C.blue],
    [4.7, -5.4, 1.2, .33, C.teal],
  ];
  for (const [x, z, w, h, color] of puddleData) {
    const shape = new THREE.Shape();
    const pts = 18;
    for (let i = 0; i < pts; i++) {
      const a = (i / pts) * Math.PI * 2;
      const wobble = .82 + Math.sin(i * 2.4) * .08 + Math.cos(i * 4.3) * .06;
      const px = Math.cos(a) * w * .5 * wobble;
      const py = Math.sin(a) * h * .5 * wobble;
      if (i === 0) shape.moveTo(px, py); else shape.lineTo(px, py);
    }
    const mat = new THREE.MeshStandardMaterial({
      color: 0x284861,
      emissive: color,
      emissiveIntensity: .08,
      transparent: true,
      opacity: .48,
      roughness: .12,
      metalness: .28,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const puddle = new THREE.Mesh(new THREE.ShapeGeometry(shape), mat);
    puddle.name = 'reflective-puddle';
    puddle.rotation.x = -Math.PI / 2;
    puddle.position.set(x, .47, z);
    puddle.renderOrder = 2;
    parent.add(puddle);
    const rings = [];
    for (let r = 0; r < 3; r++) {
      const ringMat = new THREE.MeshBasicMaterial({ color: 0xb7e5f2, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false });
      const ring = new THREE.Mesh(new THREE.RingGeometry(.08, .105, 24), ringMat);
      ring.name = 'puddle-ripple';
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(x + (r - 1) * w * .15, .485 + r * .001, z + ((r % 2) - .5) * h * .2);
      ring.scale.setScalar(.2);
      ring.renderOrder = 7;
      parent.add(ring);
      rings.push({ mesh: ring, phase: r / 3 });
    }
    puddles.push({ mesh: puddle, rings });
  }
  return puddles;
}

function createReflections(parent) {
  const reflectionGroup = group('stylized-neon-reflections', parent);
  const texture = windowGlowTexture();
  const strips = [
    [-3.5, 4.45, .9, 3.4, C.teal],
    [-1.8, 4.35, .65, 2.8, C.coral],
    [.3, 4.55, 1.15, 3.6, C.warm],
    [2.05, 4.35, .95, 2.7, C.warm],
  ];
  for (const [x, z, w, h, color] of strips) {
    const mat = new THREE.MeshBasicMaterial({
      map: texture,
      color,
      transparent: true,
      opacity: .2,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const mesh = plane('neon-wet-road-reflection', [w, h], [x, .482, z], mat, reflectionGroup, { outline: false, renderOrder: 3 });
    mesh.rotation.z = (x % 2) * .04;
  }
  // Cross street reflections.
  for (let i = 0; i < 4; i++) {
    const mat = new THREE.MeshBasicMaterial({ color: i % 2 ? C.coral : C.blue, transparent: true, opacity: .08, blending: THREE.AdditiveBlending, depthWrite: false });
    plane('signal-road-reflection', [.45, 2.1], [6.55 + i * .25, .483, -3.4], mat, reflectionGroup, { outline: false, renderOrder: 3 });
  }
  return reflectionGroup;
}

function createGlassRain(parent) {
  const texture = rainStreakTexture();
  const panes = [];
  const mat = new THREE.MeshBasicMaterial({ map: texture, transparent: true, opacity: .52, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
  const front = plane('moving-front-glass-rain', [8.95, 3.35], [-1.14, 2.65, 1.47], mat, parent, { rotation: [0, 0, 0], outline: false, renderOrder: 7 });
  panes.push(front);
  const sideMat = mat.clone();
  sideMat.map = texture.clone();
  sideMat.map.needsUpdate = true;
  const side = plane('moving-side-glass-rain', [3.25, 3.3], [3.715, 2.65, -1.45], sideMat, parent, { rotation: [0, Math.PI / 2, 0], outline: false, renderOrder: 7 });
  panes.push(side);
  return panes;
}

export function buildWeather(parent) {
  const rain = createRain(parent);
  const drips = createDrips(parent);
  const puddles = createPuddles(parent);
  const reflections = createReflections(parent);
  const glassPanes = createGlassRain(parent);
  return { rain, drips, puddles, reflections, glassPanes };
}

export function updateWeather(weather, time, delta) {
  const { rain, drips, puddles, reflections, glassPanes } = weather;
  const arr = rain.positions;
  for (let i = 0; i < rain.count; i++) {
    const k = i * 6;
    const velocity = (7.5 + rain.seeds[i] * 5.5) * delta;
    arr[k + 1] -= velocity;
    arr[k + 4] -= velocity;
    arr[k] -= delta * .42;
    arr[k + 3] -= delta * .42;
    if (arr[k + 4] < .46) {
      const reset = 9.5 + Math.random() * 2.5;
      const len = arr[k + 1] - arr[k + 4];
      arr[k + 1] = reset;
      arr[k + 4] = reset - len;
      arr[k] = -9 + Math.random() * 18;
      arr[k + 3] = arr[k] - .06;
      arr[k + 2] = -9 + Math.random() * 18;
      arr[k + 5] = arr[k + 2] + .03;
    }
  }
  rain.rain.geometry.attributes.position.needsUpdate = true;
  rain.rain.material.opacity = .21 + Math.sin(time * .8) * .02;

  for (const drip of drips) {
    const p = (time * drip.speed + drip.phase) % 1;
    drip.mesh.position.y = drip.baseY - p * 2.8;
    drip.mesh.scale.y = .35 + p * .75;
    drip.mesh.material.opacity = Math.sin(p * Math.PI) * .65;
  }

  for (const puddle of puddles) {
    puddle.mesh.material.emissiveIntensity = .065 + Math.sin(time * .7 + puddle.mesh.position.x) * .02;
    for (const ring of puddle.rings) {
      const p = (time * .32 + ring.phase) % 1;
      ring.mesh.scale.setScalar(.25 + p * 3.2);
      ring.mesh.material.opacity = Math.sin(p * Math.PI) * .27;
    }
  }

  reflections.children.forEach((mesh, i) => {
    mesh.material.opacity = (i < 4 ? .16 : .06) + Math.sin(time * 1.2 + i) * .025;
    mesh.scale.x = 1 + Math.sin(time * 1.65 + i * 2.1) * .06;
  });

  for (const pane of glassPanes) {
    if (pane.material.map) {
      pane.material.map.offset.y = -(time * .075) % 1;
      pane.material.map.offset.x = Math.sin(time * .17) * .015;
    }
  }
}
