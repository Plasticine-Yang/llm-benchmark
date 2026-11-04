import * as THREE from 'three';
import { buildStore } from './store.js';
import { buildStreet } from './street.js';
import { buildWeather } from './weather.js';

/* ------------------------------------------------------------------ */
/*  Renderer                                                           */
/* ------------------------------------------------------------------ */
const app = document.getElementById('app');
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.40;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
app.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x05070e);
scene.fog = new THREE.FogExp2(0x090d18, 0.023);

const camera = new THREE.PerspectiveCamera(33, window.innerWidth / window.innerHeight, 0.1, 200);

/* ------------------------------------------------------------------ */
/*  Sky dome                                                           */
/* ------------------------------------------------------------------ */
{
  const skyGeo = new THREE.SphereGeometry(55, 32, 20);
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: {
      uTop: { value: new THREE.Color(0x02040a) },
      uBottom: { value: new THREE.Color(0x1d2c4e) },
      uGlow: { value: new THREE.Color(0x486a9c) },
    },
    vertexShader: `
      varying vec3 vPos;
      void main() {
        vPos = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: `
      varying vec3 vPos;
      uniform vec3 uTop;
      uniform vec3 uBottom;
      uniform vec3 uGlow;
      void main() {
        vec3 n = normalize(vPos);
        float h = n.y;
        float t = smoothstep(-0.18, 0.72, h);
        vec3 c = mix(uBottom, uTop, t);
        float horizon = exp(-abs(h) * 5.5);
        c += uGlow * horizon * 0.35;
        float haze = exp(-max(h, 0.0) * 12.0);
        c += vec3(0.02, 0.028, 0.045) * haze;
        gl_FragColor = vec4(c, 1.0);
      }`,
  });
  const sky = new THREE.Mesh(skyGeo, skyMat);
  sky.frustumCulled = false;
  scene.add(sky);
}

/* ------------------------------------------------------------------ */
/*  Global lighting                                                    */
/* ------------------------------------------------------------------ */
const hemi = new THREE.HemisphereLight(0x3d578c, 0x0a0c14, 0.86);
scene.add(hemi);

const moon = new THREE.DirectionalLight(0x9db4ef, 1.72);
moon.position.set(-7.5, 10.5, 6.0);
moon.castShadow = true;
moon.shadow.mapSize.set(2048, 2048);
moon.shadow.camera.left = -7.5;
moon.shadow.camera.right = 7.5;
moon.shadow.camera.top = 7.5;
moon.shadow.camera.bottom = -7.5;
moon.shadow.camera.near = 1;
moon.shadow.camera.far = 32;
moon.shadow.bias = -0.0006;
moon.shadow.normalBias = 0.025;
scene.add(moon);
scene.add(moon.target);

const rim = new THREE.DirectionalLight(0x6f95d8, 0.52);
rim.position.set(6, 5, -7);
scene.add(rim);

const fill = new THREE.DirectionalLight(0x7f9fd0, 0.55);
fill.position.set(7, 4, 8);
scene.add(fill);

const ambient = new THREE.AmbientLight(0x222b44, 0.45);
scene.add(ambient);

/* ------------------------------------------------------------------ */
/*  World                                                              */
/* ------------------------------------------------------------------ */
const street = buildStreet(scene);
const store = buildStore(scene);
const weather = buildWeather(scene, street.puddleSpots);

/* ------------------------------------------------------------------ */
/*  Orbit camera                                                       */
/* ------------------------------------------------------------------ */
const target = new THREE.Vector3(0, 1.10, 0.15);
const view = {
  theta: 0.58,
  phi: 1.02,
  radius: 16.0,
  targetTheta: 0.58,
  targetPhi: 1.02,
  targetRadius: 16.0,
};
let lastInteraction = -100;
const clock = new THREE.Clock();
let elapsed = 0;


function updateCamera(dt, t) {
  if (t - lastInteraction > 6.0) {
    view.targetTheta += 0.028 * dt;
  }
  const k = 1 - Math.pow(0.0015, dt);
  view.theta += (view.targetTheta - view.theta) * k;
  view.phi += (view.targetPhi - view.phi) * k;
  view.radius += (view.targetRadius - view.radius) * k;
  const sp = Math.sin(view.phi);
  camera.position.set(
    target.x + view.radius * sp * Math.sin(view.theta),
    target.y + view.radius * Math.cos(view.phi),
    target.z + view.radius * sp * Math.cos(view.theta)
  );
  camera.lookAt(target);
}
updateCamera(1, 0);

/* pointer controls */
const pointers = new Map();
let dragging = false;
let lastX = 0, lastY = 0;
let pinchDist = 0;
const el = renderer.domElement;
el.style.touchAction = 'none';

function markInteraction() {
  lastInteraction = elapsed;
}

el.addEventListener('pointerdown', (e) => {
  el.setPointerCapture(e.pointerId);
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (pointers.size === 1) {
    dragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
  } else if (pointers.size === 2) {
    const [a, b] = [...pointers.values()];
    pinchDist = Math.hypot(a.x - b.x, a.y - b.y);
  }
  markInteraction();
});

el.addEventListener('pointermove', (e) => {
  if (!pointers.has(e.pointerId)) return;
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (pointers.size === 2) {
    const [a, b] = [...pointers.values()];
    const d = Math.hypot(a.x - b.x, a.y - b.y);
    if (pinchDist > 0) {
      view.targetRadius = THREE.MathUtils.clamp(view.targetRadius * (pinchDist / d), 8.0, 24.0);
    }
    pinchDist = d;
    markInteraction();
    return;
  }
  if (!dragging) return;
  const dx = e.clientX - lastX;
  const dy = e.clientY - lastY;
  lastX = e.clientX;
  lastY = e.clientY;
  view.targetTheta -= dx * 0.0052;
  view.targetPhi = THREE.MathUtils.clamp(view.targetPhi - dy * 0.0042, 0.22, 1.43);
  markInteraction();
});

function endPointer(e) {
  pointers.delete(e.pointerId);
  if (pointers.size === 0) {
    dragging = false;
    pinchDist = 0;
  } else if (pointers.size === 1) {
    const p = [...pointers.values()][0];
    lastX = p.x;
    lastY = p.y;
    dragging = true;
  }
  markInteraction();
}
el.addEventListener('pointerup', endPointer);
el.addEventListener('pointercancel', endPointer);
el.addEventListener('pointerleave', (e) => {
  if (pointers.has(e.pointerId)) endPointer(e);
});

el.addEventListener('wheel', (e) => {
  e.preventDefault();
  view.targetRadius = THREE.MathUtils.clamp(view.targetRadius + e.deltaY * 0.011, 8.0, 24.0);
  markInteraction();
}, { passive: false });

el.addEventListener('contextmenu', (e) => e.preventDefault());

/* ------------------------------------------------------------------ */
/*  Resize + loop                                                      */
/* ------------------------------------------------------------------ */
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
});

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  elapsed += dt;
  updateCamera(dt, elapsed);
  store.update(dt, elapsed);
  street.update(dt, elapsed);
  weather.update(dt, elapsed);
  renderer.render(scene, camera);
}
animate();
