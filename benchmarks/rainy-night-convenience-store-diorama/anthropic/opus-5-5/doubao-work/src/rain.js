import * as THREE from 'three';
import { HALF, SLAB, L, LAYER, groundY } from './layout.js';
import { shared } from './materials.js';
import { rng } from './util.js';

const TOP = 9.0;

/** Height at which a raindrop above (x,z) stops (roofs / canopies / ground). */
function stopHeight(x, z) {
  const s = L.shop;
  if (x > s.x0 - 0.05 && x < s.x1 + 0.05 && z > s.z0 - 0.05 && z < s.z1 + 0.05) return 3.12;
  // canopy band
  if (x > s.x0 - 0.05 && x < s.x1 + 0.84 && z > s.z0 && z < s.z1 + 0.84) return 2.3;
  const n = L.neighbor;
  if (x > n.x0 && x < n.x1 + 0.1 && z > n.z0 && z < n.z1 - 0.5) return 5.6;
  if (x > n.x0 && x < n.x1 + 0.1 && z > n.z0 && z < n.z1 + 0.6) return 2.7;
  return groundY(x, z);
}

export function buildRain(scene, updaters, shop) {
  const root = new THREE.Group();
  root.name = 'rain';
  scene.add(root);
  const r = rng(99);

  // ------------------------------------------------------------------ streaks
  {
    const COUNT = 11000;
    const base = new THREE.PlaneGeometry(1, 1);
    base.translate(0, 0.5, 0);
    const geo = new THREE.InstancedBufferGeometry();
    geo.index = base.index;
    geo.attributes.position = base.attributes.position;
    geo.attributes.uv = base.attributes.uv;
    const a = new Float32Array(COUNT * 4);
    const b = new Float32Array(COUNT * 2);
    for (let i = 0; i < COUNT; i++) {
      const x = (r() * 2 - 1) * (HALF - 0.05);
      const z = (r() * 2 - 1) * (HALF - 0.05);
      a[i * 4] = x;
      a[i * 4 + 1] = z;
      a[i * 4 + 2] = r();
      a[i * 4 + 3] = 7.5 + r() * 3.5;
      b[i * 2] = stopHeight(x, z);
      b[i * 2 + 1] = r();
    }
    geo.setAttribute('aDrop', new THREE.InstancedBufferAttribute(a, 4));
    geo.setAttribute('aInfo', new THREE.InstancedBufferAttribute(b, 2));
    geo.instanceCount = COUNT;
    const mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uTime: shared.uTime, uTop: { value: TOP } },
      vertexShader: /* glsl */ `
        attribute vec4 aDrop; attribute vec2 aInfo;
        uniform float uTime; uniform float uTop;
        varying float vA; varying vec2 vUv;
        void main(){
          float floorY = aInfo.x;
          float H = uTop - floorY;
          float y = floorY + mod(aDrop.z * H - uTime * aDrop.w, H);
          float len = 0.26 + aInfo.y * 0.22;
          vec3 wind = vec3(-0.06, 0.0, 0.035);
          vec3 c = vec3(aDrop.x, y, aDrop.y);
          vec3 viewDir = normalize(cameraPosition - c);
          vec3 right = normalize(cross(vec3(0.0, 1.0, 0.0), viewDir));
          float w = 0.011 + aInfo.y * 0.006;
          vec3 p = c + right * position.x * w + vec3(0.0, position.y * len, 0.0) + wind * position.y * len * 2.0;
          vA = smoothstep(floorY, floorY + 0.25, y) * smoothstep(uTop, uTop - 1.2, y);
          vUv = uv;
          gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
        }`,
      fragmentShader: /* glsl */ `
        varying float vA; varying vec2 vUv;
        void main(){
          float edge = 1.0 - abs(vUv.x - 0.5) * 2.0;
          float a = vA * edge * smoothstep(0.0, 0.6, vUv.y) * 0.42;
          gl_FragColor = vec4(vec3(0.62, 0.74, 0.95) * a, a);
        }`,
    });
    const m = new THREE.Mesh(geo, mat);
    m.frustumCulled = false;
    m.layers.set(LAYER.FX);
    m.renderOrder = 5;
    root.add(m);
  }

  // ------------------------------------------------------------------ splashes (droplet crowns)
  {
    const SPL = 900, DROPS = 5;
    const N = SPL * DROPS;
    const pos = new Float32Array(N * 3);
    const info = new Float32Array(N * 4);
    let k = 0;
    for (let i = 0; i < SPL; i++) {
      let x, z, tries = 0;
      do {
        x = (r() * 2 - 1) * (HALF - 0.1);
        z = (r() * 2 - 1) * (HALF - 0.1);
        tries++;
      } while (stopHeight(x, z) > 0.2 && tries < 20);
      const y = stopHeight(x, z) + 0.01;
      const ph = r();
      const rate = 0.9 + r() * 0.9;
      for (let d = 0; d < DROPS; d++) {
        pos[k * 3] = x; pos[k * 3 + 1] = y; pos[k * 3 + 2] = z;
        const ang = (d / DROPS) * Math.PI * 2 + r() * 0.8;
        info[k * 4] = ang;
        info[k * 4 + 1] = ph;
        info[k * 4 + 2] = rate;
        info[k * 4 + 3] = 0.6 + r() * 0.6;
        k++;
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('aInfo', new THREE.BufferAttribute(info, 4));
    const mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uTime: shared.uTime, uScale: { value: 600 } },
      vertexShader: /* glsl */ `
        attribute vec4 aInfo; uniform float uTime; uniform float uScale; varying float vA;
        void main(){
          float t = fract(uTime * aInfo.z + aInfo.y);
          float life = 0.28;
          float tt = t / life;
          vec3 p = position;
          float sp = 0.22 * aInfo.w;
          p.x += cos(aInfo.x) * sp * tt * 0.35;
          p.z += sin(aInfo.x) * sp * tt * 0.35;
          p.y += (tt * 0.12 - tt * tt * 0.12) * aInfo.w;
          vA = tt < 1.0 ? (1.0 - tt) : 0.0;
          vec4 mv = viewMatrix * vec4(p, 1.0);
          gl_PointSize = (tt < 1.0 ? 1.0 : 0.0) * uScale * 0.012 / -mv.z;
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: /* glsl */ `
        varying float vA;
        void main(){
          float d = length(gl_PointCoord - 0.5);
          float a = smoothstep(0.5, 0.15, d) * vA * 0.75;
          gl_FragColor = vec4(vec3(0.75, 0.85, 1.0) * a, a);
        }`,
    });
    const pts = new THREE.Points(geo, mat);
    pts.frustumCulled = false;
    pts.layers.set(LAYER.FX);
    pts.renderOrder = 6;
    root.add(pts);
    root.userData.splashMat = mat;
  }

  // ------------------------------------------------------------------ eave drips
  {
    const sources = [];
    const c = shop.canopy;
    for (let x = c.x0 + 0.06; x < c.x1 - 0.05; x += 0.17) sources.push([x + (r() - 0.5) * 0.05, c.frontEdgeY, c.frontEdgeZ - 0.01, SLAB]);
    for (let z = c.z0 + 0.06; z < c.frontEdgeZ - 0.08; z += 0.17) sources.push([c.sideEdgeX - 0.01, c.frontEdgeY, z + (r() - 0.5) * 0.05, SLAB]);
    // neighbour awning + roof skirt
    const n = L.neighbor;
    for (let x = n.x0 + 0.25; x < n.x1 - 0.1; x += 0.2) sources.push([x, SLAB + 2.4 - Math.sin(0.35) * 0.6 - 0.02, n.z1 + 0.04 + Math.cos(0.35) * 0.6, SLAB]);
    for (let z = n.z0 + 0.4; z < n.z1 - 0.7; z += 0.3) sources.push([n.x1 + 0.12, SLAB + 4.95, z, SLAB]);
    // bulletin board roof
    for (let x = -6.35; x < -5.05; x += 0.2) sources.push([x, SLAB + 1.6, 3.24, SLAB]);
    // pole sign / street light heads
    sources.push([-3.05 + 0.35, SLAB + 3.42, 2.95 + 0.35, SLAB]);
    sources.push([-3.05 - 0.35, SLAB + 3.42, 2.95 - 0.35, SLAB]);
    sources.push([-4.8, SLAB + 4.1, 3.92 + 1.18, 0]);
    sources.push([3.98 + 1.18, SLAB + 4.1, -4.5, 0]);
    // vending machine top edges
    for (const x of [2.05, 2.55, 2.8, 3.3]) sources.push([x, SLAB + 1.9, 1.88, SLAB]);

    const N = sources.length;
    const sph = new THREE.SphereGeometry(1, 8, 6);
    const geo = new THREE.InstancedBufferGeometry();
    geo.index = sph.index;
    geo.attributes.position = sph.attributes.position;
    geo.attributes.normal = sph.attributes.normal;
    const a = new Float32Array(N * 4);
    const b = new Float32Array(N * 3);
    sources.forEach((s, i) => {
      a.set([s[0], s[1], s[2], s[3]], i * 4);
      b.set([r(), 0.45 + r() * 0.9, 0.012 + r() * 0.008], i * 3);
    });
    geo.setAttribute('aSrc', new THREE.InstancedBufferAttribute(a, 4));
    geo.setAttribute('aDrip', new THREE.InstancedBufferAttribute(b, 3));
    geo.instanceCount = N;
    const dripMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: { uTime: shared.uTime },
      vertexShader: /* glsl */ `
        attribute vec4 aSrc; attribute vec3 aDrip; uniform float uTime;
        varying float vA; varying vec3 vN; varying vec3 vV;
        void main(){
          float period = 1.0 / aDrip.y;
          float t = mod(uTime + aDrip.x * period, period);
          float grow = 0.55 * period;
          float fall = sqrt(2.0 * (aSrc.y - aSrc.w) / 9.8);
          vec3 c = aSrc.xyz;
          float sy = 1.0, s = aDrip.z;
          if (t < grow) {
            float g = t / grow;
            s *= 0.4 + 0.75 * g;
            sy = 1.0 + g * 0.6;
            c.y -= s * sy;
          } else {
            float ft = t - grow;
            if (ft > fall) { s = 0.0; }
            float v = 9.8 * ft;
            c.y -= 0.5 * 9.8 * ft * ft + s;
            sy = 1.6 + min(v * 0.9, 4.0);
            s *= 0.9;
          }
          vec3 p = c + vec3(position.x * s, position.y * s * sy, position.z * s);
          vA = s > 0.0 ? 1.0 : 0.0;
          vec4 w = vec4(p, 1.0);
          vN = normalize(normal);
          vV = normalize(cameraPosition - p);
          gl_Position = projectionMatrix * viewMatrix * w;
        }`,
      fragmentShader: /* glsl */ `
        varying float vA; varying vec3 vN; varying vec3 vV;
        void main(){
          if (vA < 0.5) discard;
          float rim = 1.0 - abs(dot(vN, vV));
          vec3 col = mix(vec3(0.55, 0.7, 0.95), vec3(1.0), smoothstep(0.4, 0.9, rim));
          gl_FragColor = vec4(col * 1.1, 0.55 + rim * 0.4);
        }`,
    });
    const drips = new THREE.Mesh(geo, dripMat);
    drips.frustumCulled = false;
    drips.layers.set(LAYER.FX);
    root.add(drips);

    // impact rings under each drip
    const ring = new THREE.PlaneGeometry(1, 1);
    ring.rotateX(-Math.PI / 2);
    const rg = new THREE.InstancedBufferGeometry();
    rg.index = ring.index;
    rg.attributes.position = ring.attributes.position;
    rg.attributes.uv = ring.attributes.uv;
    rg.setAttribute('aSrc', new THREE.InstancedBufferAttribute(a, 4));
    rg.setAttribute('aDrip', new THREE.InstancedBufferAttribute(b, 3));
    rg.instanceCount = N;
    const ringMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uTime: shared.uTime },
      vertexShader: /* glsl */ `
        attribute vec4 aSrc; attribute vec3 aDrip; uniform float uTime;
        varying vec2 vUv; varying float vT;
        void main(){
          float period = 1.0 / aDrip.y;
          float t = mod(uTime + aDrip.x * period, period);
          float grow = 0.55 * period;
          float fall = sqrt(2.0 * (aSrc.y - aSrc.w) / 9.8);
          float rt = (t - grow - fall);
          if (rt < 0.0) rt += period;
          vT = rt / 0.9;
          float sz = 0.05 + vT * 0.4;
          vec3 p = vec3(aSrc.x, aSrc.w + 0.012, aSrc.z) + position * sz;
          vUv = uv;
          gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
        }`,
      fragmentShader: /* glsl */ `
        varying vec2 vUv; varying float vT;
        void main(){
          if (vT > 1.0) discard;
          float d = length(vUv - 0.5) * 2.0;
          float r1 = smoothstep(0.12, 0.0, abs(d - 0.85)) + 0.6 * smoothstep(0.1, 0.0, abs(d - 0.5));
          float a = r1 * (1.0 - vT) * 0.6;
          gl_FragColor = vec4(vec3(0.7, 0.82, 1.0) * a, a);
        }`,
    });
    const rings = new THREE.Mesh(rg, ringMat);
    rings.frustumCulled = false;
    rings.layers.set(LAYER.FX);
    root.add(rings);
  }

  return root;
}
