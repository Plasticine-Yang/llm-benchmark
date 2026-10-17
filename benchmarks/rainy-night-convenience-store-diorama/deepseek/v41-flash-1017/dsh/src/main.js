import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { OutlineEffect } from 'three/addons/effects/OutlineEffect.js';
import { buildEnvironment } from './environment.js';
import { buildStore } from './store.js';
import { buildProps } from './props.js';
import { buildWeather } from './weather.js';
import { mulberry32 } from './lib.js';
import { STORE } from './config.js';

THREE.ColorManagement.enabled = true;

const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

/* ------------------------------------------------------------------ */
/* Renderer                                                           */
/* ------------------------------------------------------------------ */

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: true,
  powerPreference: 'high-performance',
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000, 0);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.36;
renderer.domElement.setAttribute('aria-label', '雨夜のコンビニ街角ジオラマ');
renderer.domElement.style.cursor = 'grab';
document.getElementById('stage').appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = null;
scene.fog = new THREE.FogExp2(0x08111d, 0.0185);

const camera = new THREE.PerspectiveCamera(38, window.innerWidth / window.innerHeight, 0.1, 80);
camera.position.set(11.85, 10.2, 16.45);

const orbit = new OrbitControls(camera, renderer.domElement);
orbit.target.set(-0.1, 1.1, -0.2);
orbit.enableDamping = true;
orbit.dampingFactor = 0.055;
orbit.enablePan = false;
orbit.rotateSpeed = 0.52;
orbit.zoomSpeed = 0.7;
orbit.minDistance = 8.5;
orbit.maxDistance = 30;
orbit.minPolarAngle = 0.46;
orbit.maxPolarAngle = 1.36;
orbit.update();

const effect = new OutlineEffect(renderer, {
  defaultThickness: 0.0029,
  defaultColor: [0.015, 0.025, 0.048],
  defaultAlpha: 0.88,
});

/* ------------------------------------------------------------------ */
/* Lighting and environment                                           */
/* ------------------------------------------------------------------ */

const hemi = new THREE.HemisphereLight(0x7f9bc7, 0x11151e, 1.18);
scene.add(hemi);
const ambient = new THREE.AmbientLight(0x617899, 0.55);
scene.add(ambient);

const moon = new THREE.DirectionalLight(0x9dbde9, 2.12);
moon.position.set(-7.5, 11.5, -5.5);
moon.target.position.set(0.2, 0.3, 0.2);
moon.castShadow = true;
moon.shadow.mapSize.set(2048, 2048);
moon.shadow.camera.left = -9.5;
moon.shadow.camera.right = 9.5;
moon.shadow.camera.top = 9.5;
moon.shadow.camera.bottom = -9.5;
moon.shadow.camera.near = 0.5;
moon.shadow.camera.far = 32;
moon.shadow.bias = -0.0006;
moon.shadow.normalBias = 0.022;
scene.add(moon, moon.target);

// A cold rim from behind the shops to separate silhouettes from the night.
const rim = new THREE.DirectionalLight(0x6599c0, 0.78);
rim.position.set(6.0, 4.8, -8.5);
rim.target.position.set(-0.5, 1.1, 0.2);
scene.add(rim, rim.target);

// A little warm bounce from the street itself, kept low and broad.
const streetFill = new THREE.DirectionalLight(0xc19369, 0.22);
streetFill.position.set(1.5, 2.0, 8.0);
streetFill.target.position.set(0, 1.0, 0);
scene.add(streetFill, streetFill.target);

function createEnvironment() {
  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = 512;
  const ctx = c.getContext('2d');
  const sky = ctx.createLinearGradient(0, 0, 0, 512);
  sky.addColorStop(0, '#0b1424');
  sky.addColorStop(0.38, '#1c2c43');
  sky.addColorStop(0.53, '#26374e');
  sky.addColorStop(0.58, '#0e1620');
  sky.addColorStop(1, '#03060b');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, 1024, 512);

  // A soft, blurry night city horizon encoded in the environment reflections.
  ctx.filter = 'blur(18px)';
  const warm = ctx.createLinearGradient(140, 240, 480, 380);
  warm.addColorStop(0, 'rgba(255,189,120,0)');
  warm.addColorStop(0.3, 'rgba(255,189,120,0.72)');
  warm.addColorStop(0.72, 'rgba(255,145,92,0.5)');
  warm.addColorStop(1, 'rgba(255,199,135,0)');
  ctx.fillStyle = warm;
  ctx.fillRect(80, 280, 500, 90);
  ctx.fillStyle = 'rgba(90,231,210,0.48)';
  ctx.fillRect(700, 290, 200, 24);
  ctx.fillStyle = 'rgba(255,140,177,0.34)';
  ctx.fillRect(560, 318, 110, 16);
  ctx.fillStyle = 'rgba(164,216,255,0.24)';
  ctx.fillRect(230, 252, 30, 140);
  ctx.fillStyle = 'rgba(255,236,195,0.85)';
  ctx.fillRect(360, 277, 18, 18);
  ctx.fillRect(422, 290, 13, 13);
  ctx.filter = 'blur(5px)';
  ctx.fillStyle = 'rgba(100,223,210,0.7)';
  ctx.fillRect(250, 323, 420, 4);
  ctx.fillStyle = 'rgba(255,188,123,0.55)';
  ctx.fillRect(160, 341, 300, 3);
  ctx.filter = 'none';
  // Rain-dark ground.
  ctx.fillStyle = 'rgba(2,5,9,0.8)';
  ctx.fillRect(0, 365, 1024, 147);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.mapping = THREE.EquirectangularReflectionMapping;
  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();
  const env = pmrem.fromEquirectangular(tex).texture;
  tex.dispose();
  pmrem.dispose();
  return env;
}
scene.environment = createEnvironment();

/* ------------------------------------------------------------------ */
/* The miniature                                                      */
/* ------------------------------------------------------------------ */

const ctx = {
  scene,
  lights: [],
  updaters: [],
  puddles: [],
  rng: mulberry32(412),
};

const environment = buildEnvironment(ctx);
ctx.puddles = environment.puddles;
const store = buildStore(ctx);
const props = buildProps(ctx);
const weather = buildWeather(ctx);

// Add all the practical lights that the world builders requested.
for (const spec of ctx.lights) {
  const light = new THREE.PointLight(spec.color, spec.intensity, spec.distance, 2);
  light.position.set(...spec.pos);
  scene.add(light);
}

// A soft fill right at the shop window, so the wet pavement has a warm heart.
const shopSpill = new THREE.PointLight(0xffb873, 18.0, 8.2, 2);
shopSpill.position.set(0.7, 1.55, 2.7);
scene.add(shopSpill);

// Optional translucent luminous plaques are already part of the store; a tiny
// extra glimmer keeps the sign from feeling like a flat decal.

/* ------------------------------------------------------------------ */
/* Responsive framing                                                 */
/* ------------------------------------------------------------------ */

// At narrow / portrait aspect ratios, the square diorama needs a little more
// breathing room. Keep the hero direction but step back until the whole
// collectible base and the taller street furniture fit in the frame.
function fitInitialViewToAspect() {
  const aspect = window.innerWidth / Math.max(1, window.innerHeight);
  if (aspect >= 1.45) return;
  const target = orbit.target.clone();
  const dir = camera.position.clone().sub(target).normalize();
  const startDist = camera.position.distanceTo(target);
  const pts = [
    [-6.02, 0, -6.02], [6.02, 0, -6.02], [-6.02, 0, 6.02], [6.02, 0, 6.02],
    [-6.02, -0.64, 6.02], [6.02, -0.64, 6.02],
    [STORE.left, 5.08, STORE.front], [STORE.right, 5.08, STORE.front],
    [STORE.left, 5.08, STORE.back], [STORE.right, 5.08, STORE.back],
    [-6.10, 6.35, -5.45], [-5.18, 6.35, 1.93],
    [5.72, 8.4, -0.62], [-5.62, 7.45, -5.02],
    [6.5, 4.02, -5.22], [-5.4, 4.9, -4.9],
  ].map(([x, y, z]) => new THREE.Vector3(x, y, z));
  let chosen = startDist * 3.0;
  for (let d = startDist; d <= startDist * 3.0; d += 0.22) {
    camera.position.copy(target).addScaledVector(dir, d);
    camera.lookAt(target);
    camera.updateMatrixWorld(true);
    let fits = true;
    for (const pt of pts) {
      const p = pt.clone().project(camera);
      if (Math.abs(p.x) > 0.93 || Math.abs(p.y) > 0.93) {
        fits = false;
        break;
      }
    }
    if (fits) {
      chosen = d;
      break;
    }
  }
  camera.position.copy(target).addScaledVector(dir, chosen);
  camera.lookAt(target);
  orbit.maxDistance = Math.max(orbit.maxDistance, chosen * 1.55);
  orbit.minDistance = Math.max(6.0, chosen * 0.32);
  orbit.update();
}
fitInitialViewToAspect();

/* ------------------------------------------------------------------ */
/* Interaction, sizing and render loop                                */
/* ------------------------------------------------------------------ */

let interacting = false;
let hasInteracted = false;
orbit.addEventListener('start', () => {
  interacting = true;
  hasInteracted = true;
  renderer.domElement.style.cursor = 'grabbing';
});
orbit.addEventListener('end', () => {
  interacting = false;
  renderer.domElement.style.cursor = 'grab';
});
renderer.domElement.addEventListener('pointerleave', () => {
  if (!interacting) renderer.domElement.style.cursor = 'grab';
});
renderer.domElement.addEventListener('contextmenu', (e) => e.preventDefault());

function resize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(w, h);
  effect.setSize(w, h);
  if (!hasInteracted && w / h < 1.45) {
    fitInitialViewToAspect();
  }
  for (const u of ctx.updaters) {
    if (u.resize) u.resize(w, h);
  }
}
window.addEventListener('resize', resize);

const clock = new THREE.Clock();
let elapsed = 0.0;
let hasRendered = false;

function animate() {
  const dt = Math.min(clock.getDelta(), 0.05);
  elapsed += dt * (reducedMotion ? 0.16 : 1.0);
  for (const u of ctx.updaters) {
    u.update?.(elapsed, dt);
  }
  orbit.update();
  effect.render(scene, camera);
  if (!hasRendered) {
    hasRendered = true;
    document.body.classList.add('ready');
  }
}

renderer.setAnimationLoop(animate);

// Camera stays above the diorama and within a comfortable collectible view.
// The no-pan constraint and distance clamps keep the whole little world framed.
window.addEventListener('keydown', (event) => {
  if (event.key === 'r' || event.key === 'R') {
    camera.position.set(11.85, 10.2, 16.45);
    orbit.target.set(-0.1, 1.1, -0.2);
    orbit.update();
  }
});
