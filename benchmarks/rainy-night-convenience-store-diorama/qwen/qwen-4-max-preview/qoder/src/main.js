import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

import { buildTextures, setAniso } from './core/tex.js';
import { buildMaterials, FOG_COLOR, FOG_DENSITY } from './core/gfx.js';
import { buildGround } from './scene/ground.js';
import { buildStore } from './scene/store.js';
import { buildInterior } from './scene/interior.js';
import { buildStreet } from './scene/street.js';
import { buildRain } from './fx/rain.js';
import { buildAtmosphere } from './fx/atmos.js';
import { glassUniforms } from './fx/glass.js';

/* ------------------------------ renderer ---------------------------- */
const renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: false,
  powerPreference: 'high-performance',
  stencil: false,
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
renderer.setSize(Math.max(1, window.innerWidth), Math.max(1, window.innerHeight));
renderer.setClearColor(FOG_COLOR, 1);
renderer.toneMapping = THREE.NoToneMapping;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.shadowMap.autoUpdate = false;
document.body.appendChild(renderer.domElement);

setAniso(Math.min(8, renderer.capabilities.getMaxAnisotropy()));

/* -------------------------------- scene ----------------------------- */
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(FOG_COLOR, FOG_DENSITY);

const camera = new THREE.PerspectiveCamera(30, Math.max(1, window.innerWidth) / Math.max(1, window.innerHeight), 0.5, 320);
const TARGET = new THREE.Vector3(-0.4, -0.9, -0.4);
const AZIMUTH = THREE.MathUtils.degToRad(42.31);
const HOME_DIR = new THREE.Vector3(30.4, 15.9, 33.4).normalize();
const HOME = new THREE.Vector3(30.0, 17.5, 33.0);

// silhouette probes: base corners plus the tallest props on the plate
const PROBES = [];
for (const x of [-12, 12]) for (const z of [-12, 12]) {
  PROBES.push(new THREE.Vector3(x, -1.05, z), new THREE.Vector3(x, 0, z));
}
for (const p of [[-10.6, 7.2, -6.4], [-4.2, 6.4, -10.4], [11.2, 4.5, -3.0], [-8.0, 5.0, 11.5],
  [4.5, 7.4, 5.15], [-11.0, 6.7, 0.3], [11.15, 6.3, -6.0], [-2.5, 5.0, -3.3], [11.05, 5.1, 10.95]]) {
  PROBES.push(new THREE.Vector3(p[0], p[1], p[2]));
}

// Solve distance + height so the whole plate stays framed at any aspect ratio.
// Tall screens look down steeper, otherwise the square base drowns in empty sky.
const _p = new THREE.Vector3();
function frame() {
  const aspect = Math.max(1, window.innerWidth) / Math.max(1, window.innerHeight);
  camera.aspect = aspect;
  camera.fov = THREE.MathUtils.clamp(46.5 / Math.min(aspect, 1.55), 30, 62);
  camera.updateProjectionMatrix();
  const k = THREE.MathUtils.clamp((1.35 - aspect) / 0.9, 0, 1);
  const elev = THREE.MathUtils.degToRad(19.4 + 17.0 * k);
  HOME_DIR.set(Math.sin(AZIMUTH) * Math.cos(elev), Math.sin(elev), Math.cos(AZIMUTH) * Math.cos(elev));

  const th = Math.tan(THREE.MathUtils.degToRad(camera.fov) * 0.5);
  let d = Math.max(12.0 / th, 18.4 / (th * aspect));
  TARGET.set(-0.4, 0, -0.4);
  for (let i = 0; i < 7; i++) {
    camera.position.copy(TARGET).addScaledVector(HOME_DIR, d);
    camera.lookAt(TARGET);
    camera.updateMatrixWorld(true);
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
    for (const p of PROBES) {
      _p.copy(p).project(camera);
      if (_p.x < x0) x0 = _p.x;
      if (_p.x > x1) x1 = _p.x;
      if (_p.y < y0) y0 = _p.y;
      if (_p.y > y1) y1 = _p.y;
    }
    d = THREE.MathUtils.clamp(d * Math.max(x1 - x0, y1 - y0) / 1.84, 18, 150);
    TARGET.y += (y0 + y1) * 0.5 * th * d / Math.cos(elev);
  }
  HOME.copy(TARGET).addScaledVector(HOME_DIR, d);
}
frame();
camera.position.copy(TARGET).addScaledVector(HOME_DIR, HOME.distanceTo(TARGET) * 1.32);
camera.lookAt(TARGET);

/* -------------------------------- lights ---------------------------- */
const hemi = new THREE.HemisphereLight(new THREE.Color('#41568a'), new THREE.Color('#0b1020'), 0.85);
scene.add(hemi);

// cool moon / city key from behind-left, the only shadow caster
const key = new THREE.DirectionalLight(new THREE.Color('#a8c6ff'), 1.15);
key.position.set(-15, 21, 13);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
key.shadow.camera.left = -17;
key.shadow.camera.right = 17;
key.shadow.camera.top = 17;
key.shadow.camera.bottom = -17;
key.shadow.camera.near = 2;
key.shadow.camera.far = 62;
key.shadow.bias = -0.0006;
key.shadow.normalBias = 0.022;
key.shadow.radius = 2.2;
scene.add(key);

// warm bounce off the shop front, and a magenta rim from the alley neon
const bounce = new THREE.DirectionalLight(new THREE.Color('#ffb877'), 0.42);
bounce.position.set(6, 4.5, 12);
scene.add(bounce);
const rim = new THREE.DirectionalLight(new THREE.Color('#ff5f96'), 0.24);
rim.position.set(-13, 5, -9);
scene.add(rim);

// entrance spill — the warm pool that leaks out of the automatic door
const doorLight = new THREE.PointLight(new THREE.Color('#ffcf94'), 4.5, 9.5, 1.7);
doorLight.position.set(0.6, 2.15, 1.05);
scene.add(doorLight);
const signLight = new THREE.PointLight(new THREE.Color('#9ff0cc'), 0.6, 4.2, 2.0);
signLight.position.set(-2.5, 3.30, 2.55);
scene.add(signLight);

/* -------------------------------- content --------------------------- */
const T = buildTextures();
buildMaterials(T);

const atmos = buildAtmosphere(scene);
const ground = buildGround(scene, T);
const store = buildStore(scene, T);
const interior = buildInterior(scene, T);
const street = buildStreet(scene, T);
const rain = buildRain(scene, { steamSrc: interior.steamSrc, lamps: street.lampPositions });

renderer.shadowMap.needsUpdate = true;

/* ------------------------------- controls --------------------------- */
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.copy(TARGET);
controls.enableDamping = true;
controls.dampingFactor = 0.055;
controls.rotateSpeed = 0.62;
controls.zoomSpeed = 0.78;
controls.panSpeed = 0.5;
controls.enablePan = false;
controls.minDistance = 14;
controls.maxDistance = 95;
controls.minPolarAngle = 0.20;
controls.maxPolarAngle = 1.415;
controls.autoRotate = false;
controls.autoRotateSpeed = 0.0;

let idle = 0;
let touched = false;
const wake = () => { idle = 0; touched = true; controls.autoRotate = false; controls.autoRotateSpeed = 0; };
renderer.domElement.addEventListener('pointerdown', () => { wake(); document.body.classList.add('dragging'); });
window.addEventListener('pointerup', () => document.body.classList.remove('dragging'));
renderer.domElement.addEventListener('wheel', wake, { passive: true });
renderer.domElement.addEventListener('touchstart', wake, { passive: true });
window.addEventListener('contextmenu', e => e.preventDefault());

/* ------------------------------ composer ---------------------------- */
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));

const bloom = new UnrealBloomPass(
  new THREE.Vector2(Math.max(1, window.innerWidth), Math.max(1, window.innerHeight)), 0.34, 0.55, 0.86);
composer.addPass(bloom);

const GradeShader = {
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: 0 },
    uRes: { value: new THREE.Vector2(1, 1) },
    uVignette: { value: 0.42 },
    uGrain: { value: 0.030 },
    uAberration: { value: 0.0016 },
  },
  vertexShader: /* glsl */`
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: /* glsl */`
    uniform sampler2D tDiffuse;
    uniform float uTime, uVignette, uGrain, uAberration;
    uniform vec2 uRes;
    varying vec2 vUv;

    float hash(vec2 p) {
      p = fract(p * vec2(443.897, 441.423));
      p += dot(p, p + 19.19);
      return fract((p.x + p.y) * p.x);
    }

    void main() {
      vec2 c = vUv - 0.5;
      float r2 = dot(c, c);

      // lens fringe: only bites towards the corners
      vec2 off = c * uAberration * (0.35 + r2 * 3.4);
      vec3 col;
      col.r = texture2D(tDiffuse, vUv + off).r;
      col.g = texture2D(tDiffuse, vUv).g;
      col.b = texture2D(tDiffuse, vUv - off).b;

      // night grade: lift the shadows a touch into blue, keep highlights warm
      float lum = dot(col, vec3(0.2126, 0.7152, 0.0722));
      col = mix(col, col * vec3(0.90, 0.96, 1.10) + vec3(0.004, 0.008, 0.020), (1.0 - smoothstep(0.0, 0.35, lum)) * 0.85);
      col *= mix(vec3(1.0), vec3(1.05, 1.005, 0.96), smoothstep(0.45, 1.0, lum));
      col = mix(vec3(lum), col, 1.06);

      // vignette
      float vig = 1.0 - uVignette * smoothstep(0.10, 0.78, r2 * 1.9);
      col *= vig;

      // fine film grain, stronger in the dark
      float g = hash(vUv * uRes + fract(uTime) * 311.7) - 0.5;
      col += g * uGrain * (0.35 + 0.65 * (1.0 - lum));

      gl_FragColor = vec4(max(col, 0.0), 1.0);
    }`,
};
const grade = new ShaderPass(GradeShader);
composer.addPass(grade);
composer.addPass(new OutputPass());

/* -------------------------------- resize ---------------------------- */
let vw = 0, vh = 0;
function resize() {
  const w = Math.max(1, window.innerWidth), h = Math.max(1, window.innerHeight);
  vw = w; vh = h;
  const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
  renderer.setPixelRatio(dpr);
  renderer.setSize(w, h);
  composer.setPixelRatio(dpr);
  composer.setSize(w, h);
  grade.uniforms.uRes.value.set(w * dpr, h * dpr);
  frame();
  controls.maxDistance = Math.max(95, HOME.distanceTo(TARGET) * 1.7);
  if (!touched) {
    controls.target.copy(TARGET);
    camera.position.copy(HOME);
  } else {
    // keep the model in view when the viewport changes under the user's hands
    const d = camera.position.distanceTo(controls.target);
    const fit = HOME.distanceTo(TARGET);
    if (d > fit * 1.9 || d < fit * 0.35) {
      camera.position.sub(controls.target).setLength(fit).add(controls.target);
    }
  }
  renderer.shadowMap.needsUpdate = true;
}
window.addEventListener('resize', resize);
resize();

/* --------------------------------- loop ----------------------------- */
const clock = new THREE.Clock();
let t = 0;
let intro = 0;
let ready = false;
const introFrom = TARGET.clone().addScaledVector(HOME_DIR, HOME.distanceTo(TARGET) * 1.32);
camera.position.copy(introFrom);
const easeOut = x => 1 - Math.pow(1 - x, 3);

function tick() {
  requestAnimationFrame(tick);
  const dt = Math.min(clock.getDelta(), 0.05);
  if (window.innerWidth !== vw || window.innerHeight !== vh) resize();
  if (vw < 2 || vh < 2) return;
  t += dt;

  if (intro < 1) {
    intro = Math.min(1, intro + dt / 3.0);
    camera.position.lerpVectors(introFrom, HOME, easeOut(intro));
  } else {
    idle += dt;
    if (idle > 5.5) {
      controls.autoRotate = true;
      controls.autoRotateSpeed = Math.min(0.20, controls.autoRotateSpeed + dt * 0.09);
    }
  }

  const s = store.update(t, dt);
  const i = interior.update(t);
  street.update(t, dt);
  ground.update(t, 0.86 + (s.signLevel - 1) * 0.5 + s.doorOpen * 0.16);
  rain.update(t, camera);
  atmos.update(t);
  glassUniforms.uTime.value = t;

  for (let k = 0; k < store.fans.length; k++) {
    store.fans[k].rotation.z -= dt * (2.4 + k * 0.55);
  }

  doorLight.intensity = 3.9 + s.doorOpen * 2.0 + i.panelLevel * 0.6;
  signLight.intensity = 0.58 * s.signLevel;
  bloom.strength = 0.34 + (s.signLevel - 1) * 0.25;
  grade.uniforms.uTime.value = t;

  controls.update();
  composer.render();

  if (!ready) {
    ready = true;
    renderer.domElement.classList.add('ready');
  }
}
tick();