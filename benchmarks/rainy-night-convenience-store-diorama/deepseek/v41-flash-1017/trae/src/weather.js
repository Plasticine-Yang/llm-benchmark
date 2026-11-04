import * as THREE from 'three';
import { makeGlassStreakTexture } from './textures.js';

/* ------------------------------------------------------------ 雨丝 */
function createRain(scene) {
  const COUNT = 3200;
  const AREA = 26;
  const TOP = 15;
  const pos = new Float32Array(COUNT * 6);
  const drops = [];
  for (let i = 0; i < COUNT; i++) {
    drops.push({
      x: (Math.random() - 0.5) * AREA,
      y: Math.random() * TOP,
      z: (Math.random() - 0.5) * AREA,
      speed: 12 + Math.random() * 9,
      len: 0.28 + Math.random() * 0.42,
    });
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.LineBasicMaterial({
    color: 0x9fbfdc,
    transparent: true,
    opacity: 0.17,
    depthWrite: false,
  });
  const lines = new THREE.LineSegments(geo, mat);
  lines.frustumCulled = false;
  lines.renderOrder = 2;
  scene.add(lines);

  const wind = 0.9;
  return {
    object: lines,
    update(dt, t) {
      for (let i = 0; i < COUNT; i++) {
        const d = drops[i];
        d.y -= d.speed * dt;
        d.x += wind * dt;
        const inStore = d.x > -3.1 && d.x < 8.1 && d.z > -9.1 && d.z < 1.1;
        if (d.y < 7.1 && inStore) d.y = 7.1;
        if (d.y < -0.2) {
          d.y = TOP + Math.random() * 3;
          d.x = (Math.random() - 0.5) * AREA;
          d.z = (Math.random() - 0.5) * AREA;
        }
        if (d.x > AREA / 2) d.x -= AREA;
        const i6 = i * 6;
        pos[i6] = d.x;
        pos[i6 + 1] = d.y;
        pos[i6 + 2] = d.z;
        pos[i6 + 3] = d.x - 0.06;
        pos[i6 + 4] = d.y + d.len;
        pos[i6 + 5] = d.z;
      }
      geo.attributes.position.needsUpdate = true;
    },
  };
}

/* ------------------------------------------------------------ 地面溅落涟漪 */
function createSplashes(scene) {
  const COUNT = 140;
  const base = new THREE.PlaneGeometry(1, 1);
  base.rotateX(-Math.PI / 2);
  const geo = new THREE.InstancedBufferGeometry();
  geo.index = base.index;
  geo.attributes.position = base.attributes.position;
  geo.attributes.uv = base.attributes.uv;
  geo.instanceCount = COUNT;

  const centers = new Float32Array(COUNT * 3);
  const phases = new Float32Array(COUNT);
  const sizes = new Float32Array(COUNT);
  for (let i = 0; i < COUNT; i++) {
    let x = (Math.random() - 0.5) * 23;
    let z = (Math.random() - 0.5) * 23;
    // 避开店内
    if (x > -3.2 && x < 8.2 && z > -9.2 && z < 1.2) z = 1.6 + Math.random() * 9;
    centers[i * 3] = x;
    centers[i * 3 + 1] = 0.022 + Math.random() * 0.11;
    centers[i * 3 + 2] = z;
    phases[i] = Math.random();
    sizes[i] = 0.16 + Math.random() * 0.3;
  }
  geo.setAttribute('aCenter', new THREE.InstancedBufferAttribute(centers, 3));
  geo.setAttribute('aPhase', new THREE.InstancedBufferAttribute(phases, 1));
  geo.setAttribute('aSize', new THREE.InstancedBufferAttribute(sizes, 1));

  const mat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uOpacity: { value: 0.3 } },
    vertexShader: /* glsl */ `
      attribute vec3 aCenter;
      attribute float aPhase;
      attribute float aSize;
      uniform float uTime;
      varying vec2 vUv;
      varying float vFade;
      void main() {
        vUv = uv;
        float p = fract(uTime * 0.95 + aPhase);
        float s = aSize * (0.06 + p * 0.62);
        vFade = (1.0 - p) * (1.0 - p);
        vec3 pos = position * vec3(s, 1.0, s) + aCenter;
        gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(pos, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uOpacity;
      varying vec2 vUv;
      varying float vFade;
      void main() {
        float d = length(vUv - 0.5) * 2.0;
        float ring = smoothstep(0.62, 0.88, d) * (1.0 - smoothstep(0.9, 1.0, d));
        float a = ring * vFade * uOpacity;
        if (a < 0.004) discard;
        gl_FragColor = vec4(vec3(0.72, 0.86, 1.0), a);
        #include <colorspace_fragment>
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.frustumCulled = false;
  mesh.renderOrder = 3;
  scene.add(mesh);
  return { mesh, mat };
}

/* ------------------------------------------------------------ 屋檐滴水 */
function createDrips(scene) {
  const list = [];
  for (let x = -2.4; x < 7.9; x += 0.72) list.push([x, 2.79, 2.16, 2.75, 1.0]);
  for (let z = -8.4; z < 0.4; z += 0.8) list.push([-4.14, 2.79, z, 2.7, 0.95]);
  const COUNT = list.length;
  const pos = new Float32Array(COUNT * 6);
  const top = new Float32Array(COUNT * 6);
  const phase = new Float32Array(COUNT * 2);
  const speed = new Float32Array(COUNT * 2);
  const end = new Float32Array(COUNT * 2);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aTop', new THREE.BufferAttribute(top, 3));
  geo.setAttribute('aPhase', new THREE.BufferAttribute(phase, 1));
  geo.setAttribute('aSpeed', new THREE.BufferAttribute(speed, 1));
  geo.setAttribute('aEnd', new THREE.BufferAttribute(end, 1));
  for (let i = 0; i < COUNT; i++) {
    const [x, y, z, sp] = list[i];
    const ph = Math.random();
    const sd = sp * (0.75 + Math.random() * 0.5);
    for (let v = 0; v < 2; v++) {
      const k = i * 2 + v;
      top[k * 3] = x;
      top[k * 3 + 1] = y;
      top[k * 3 + 2] = z;
      phase[k] = ph;
      speed[k] = sd;
      end[k] = v;
    }
  }
  const mat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 } },
    vertexShader: /* glsl */ `
      attribute vec3 aTop;
      attribute float aPhase;
      attribute float aSpeed;
      attribute float aEnd;
      uniform float uTime;
      varying float vAlpha;
      void main() {
        float p = fract(uTime * aSpeed + aPhase);
        float y = aTop.y - p * aTop.y;
        vAlpha = smoothstep(0.0, 0.1, p) * (1.0 - smoothstep(0.75, 1.0, p));
        vec3 pos = vec3(aTop.x, y + aEnd * 0.34, aTop.z);
        gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(pos, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      varying float vAlpha;
      void main() {
        if (vAlpha < 0.02) discard;
        gl_FragColor = vec4(vec3(0.72, 0.86, 1.0), vAlpha * 0.5);
        #include <colorspace_fragment>
      }
    `,
    transparent: true,
    depthWrite: false,
  });
  const lines = new THREE.LineSegments(geo, mat);
  lines.frustumCulled = false;
  scene.add(lines);
  return { mesh: lines, mat };
}

/* ------------------------------------------------------------ 玻璃雨痕 */
function createGlassWater(scene) {
  const layers = [];
  const add = (w, h, x, y, z, rotY, speed, opacity) => {
    const tex = makeGlassStreakTexture();
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(1.9, 1.0);
    const mat = new THREE.MeshBasicMaterial({
      map: tex,
      transparent: true,
      opacity,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
    mesh.position.set(x, y, z);
    mesh.rotation.y = rotY;
    mesh.renderOrder = 4;
    scene.add(mesh);
    layers.push({ tex, speed });
  };
  add(3.45, 2.3, -0.675, 1.84, 1.005, 0, 0.06, 0.75);
  add(2.44, 2.3, 4.15, 1.84, 1.005, 0, 0.048, 0.8);
  add(8.9, 2.3, -2.995, 1.84, -4.05, Math.PI / 2, 0.052, 0.7);
  return {
    update(dt) {
      for (const l of layers) l.tex.offset.y -= l.speed * dt;
    },
  };
}

export function createWeather(scene) {
  const rain = createRain(scene);
  const splash = createSplashes(scene);
  const drip = createDrips(scene);
  const glass = createGlassWater(scene);
  return {
    update(dt, t) {
      rain.update(dt, t);
      splash.mat.uniforms.uTime.value = t;
      drip.mat.uniforms.uTime.value = t;
      glass.update(dt);
    },
  };
}
