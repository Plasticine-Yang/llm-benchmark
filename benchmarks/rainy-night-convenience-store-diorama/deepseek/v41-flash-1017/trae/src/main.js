import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';

import { createGround, createPlinth } from './ground.js';
import { createStore } from './store.js';
import { createProps } from './props.js';
import { createWeather } from './weather.js';
import { makeGroundTextures } from './textures.js';

/* --------------------------------------------------------------- 渲染器 */
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.NoToneMapping;
document.getElementById('app').appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x101827, 46, 120);

const camera = new THREE.PerspectiveCamera(30, window.innerWidth / window.innerHeight, 0.1, 400);
camera.position.set(-29.5, 16.5, 36.5);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0.5, 2.4, -1.0);
controls.enableDamping = true;
controls.dampingFactor = 0.065;
controls.enablePan = false;
controls.minDistance = 15;
controls.maxDistance = 64;
controls.minPolarAngle = 0.12;
controls.maxPolarAngle = Math.PI / 2 - 0.045;
controls.rotateSpeed = 0.62;
controls.zoomSpeed = 0.75;
controls.update();

// 初始自动旋转（用户一旦操作即停止）
controls.autoRotate = true;
controls.autoRotateSpeed = 0.38;
const stopAutoRotate = () => {
  controls.autoRotate = false;
  window.removeEventListener('pointerdown', stopAutoRotate);
  window.removeEventListener('wheel', stopAutoRotate);
};
window.addEventListener('pointerdown', stopAutoRotate);
window.addEventListener('wheel', stopAutoRotate);

// 自动取景：保证 24×24 底座与店铺主体完整入画
function fitCamera(margin = 0.94) {
  const boxes = [
    [-12.55, -0.32, -12.55, 12.55, 0.25, 12.55],
    [-3.3, 0.0, -9.3, 8.3, 7.35, 1.35],
  ];
  const corners = [];
  for (const [x0, y0, z0, x1, y1, z1] of boxes) {
    for (const x of [x0, x1]) for (const y of [y0, y1]) for (const z of [z0, z1]) corners.push(new THREE.Vector3(x, y, z));
  }
  const dir = camera.position.clone().sub(controls.target).normalize();
  let dist = camera.position.distanceTo(controls.target);
  for (let i = 0; i < 8; i++) {
    camera.position.copy(controls.target).addScaledVector(dir, dist);
    camera.lookAt(controls.target);
    camera.updateMatrixWorld();
    let m = 0;
    for (const c of corners) {
      const p = c.clone().project(camera);
      m = Math.max(m, Math.abs(p.x), Math.abs(p.y));
    }
    dist *= m / margin;
  }
  camera.position.copy(controls.target).addScaledVector(dir, dist);
  controls.update();
}
fitCamera(0.95);

/* --------------------------------------------------------------- 天空 */
const sky = new THREE.Mesh(
  new THREE.SphereGeometry(160, 32, 16),
  new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    uniforms: {
      uTop: { value: new THREE.Color(0x04060c) },
      uMid: { value: new THREE.Color(0x0b1422) },
      uHorizon: { value: new THREE.Color(0x1b2738) },
      uGlow: { value: new THREE.Color(0x3a2a24) },
    },
    vertexShader: /* glsl */ `
      varying vec3 vDir;
      void main() {
        vDir = normalize(position);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uTop;
      uniform vec3 uMid;
      uniform vec3 uHorizon;
      uniform vec3 uGlow;
      varying vec3 vDir;
      void main() {
        float h = clamp(vDir.y * 0.5 + 0.5, 0.0, 1.0);
        vec3 col = mix(uHorizon, uMid, smoothstep(0.48, 0.62, h));
        col = mix(col, uTop, smoothstep(0.6, 0.95, h));
        float glow = pow(max(0.0, 1.0 - abs(vDir.y) * 6.0), 2.0) * (0.5 + 0.5 * vDir.x * 0.2);
        col += uGlow * glow * 0.5;
        gl_FragColor = vec4(col, 1.0);
        #include <colorspace_fragment>
      }
    `,
  })
);
sky.frustumCulled = false;
scene.add(sky);

/* --------------------------------------------------------------- 灯光 */
const hemi = new THREE.HemisphereLight(0x3d5a86, 0x0a0d13, 0.8);
scene.add(hemi);

const moon = new THREE.DirectionalLight(0xa8c0ff, 1.15);
moon.position.set(-14, 22, -13);
moon.castShadow = true;
moon.shadow.mapSize.set(2048, 2048);
moon.shadow.camera.left = -17;
moon.shadow.camera.right = 17;
moon.shadow.camera.top = 17;
moon.shadow.camera.bottom = -17;
moon.shadow.camera.near = 1;
moon.shadow.camera.far = 60;
moon.shadow.bias = -0.0008;
moon.shadow.normalBias = 0.035;
scene.add(moon);

const fill = new THREE.DirectionalLight(0x7f9ecb, 0.35);
fill.position.set(16, 11, 18);
scene.add(fill);

const storeGlow = new THREE.PointLight(0xffc07a, 4.5, 10, 2);
storeGlow.position.set(3.2, 2.2, 2.6);
scene.add(storeGlow);

/* --------------------------------------------------------------- 场景内容 */
const groundTextures = makeGroundTextures();
const ground = createGround(scene, renderer, groundTextures);
const plinth = createPlinth(scene);
// 底座位于镜面以下，独立图层：只给主相机看，避免遮挡反射
plinth.traverse((o) => o.layers.set(1));
camera.layers.enable(1);
const store = createStore(scene);
const props = createProps(scene);
const weather = createWeather(scene);

/* --------------------------------------------------------------- 后期 */
const composer = new EffectComposer(renderer);
composer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
composer.addPass(new RenderPass(scene, camera));

const bloom = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  0.5,
  0.7,
  0.86
);
composer.addPass(bloom);

const output = new OutputPass();
composer.addPass(output);

const gradePass = new ShaderPass({
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: 0 },
    uAspect: { value: window.innerWidth / window.innerHeight },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float uTime;
    uniform float uAspect;
    varying vec2 vUv;
    void main() {
      vec2 uv = vUv;
      vec4 col = texture2D(tDiffuse, uv);
      // 轻微色差
      float ca = 0.0009;
      vec2 d = uv - 0.5;
      col.r = texture2D(tDiffuse, uv + d * ca).r;
      col.b = texture2D(tDiffuse, uv - d * ca).b;
      // 暗角
      float vig = smoothstep(0.92, 0.28, length((uv - 0.5) * vec2(uAspect * 0.62 + 0.38, 1.0)));
      col.rgb *= mix(0.5, 1.0, vig);
      // 饱和度 / 冷暖分离
      float lum = dot(col.rgb, vec3(0.299, 0.587, 0.114));
      col.rgb = mix(vec3(lum), col.rgb, 1.13);
      col.rgb *= mix(vec3(0.93, 0.98, 1.1), vec3(1.05, 1.0, 0.93), smoothstep(0.15, 0.85, lum));
      col.rgb *= 1.05;
      // 细微颗粒
      float g = fract(sin(dot(uv * vec2(914.3, 733.7) + uTime * 0.05, vec2(12.9898, 78.233))) * 43758.5453);
      col.rgb += (g - 0.5) * 0.022;
      gl_FragColor = col;
    }
  `,
});
composer.addPass(gradePass);

/* --------------------------------------------------------------- 动态 */
const SIGN_BASE = new THREE.Color(0xffffff);
let doorOpen = 0;
const trafficCycle = 15;

function updateDoor(dt, t) {
  const cycle = t % 12.5;
  const target = cycle > 4.2 && cycle < 9.4 ? 1 : 0;
  doorOpen += (target - doorOpen) * Math.min(1, dt * 4.2);
  const slide = doorOpen * 0.84;
  if (store.doorPanels) {
    store.doorPanels[0].position.x = 1.58 - slide;
    store.doorPanels[1].position.x = 2.42 + slide;
  }
}

function updateFlicker(t) {
  const grain = Math.sin(t * 12.7) * Math.sin(t * 3.1);
  let v = 0.96 + 0.04 * Math.sin(t * 1.7);
  if (grain > 0.93) v = 0.62 + Math.random() * 0.1;
  for (const m of store.signMats) m.color.copy(SIGN_BASE).multiplyScalar(v);
  if (props.pylon) {
    props.pylon.face.color.copy(SIGN_BASE).multiplyScalar(0.9 + 0.1 * Math.sin(t * 0.9));
    props.pylon.halo.material.opacity = 0.28 + 0.06 * Math.sin(t * 1.3);
  }
  // 巷灯闪烁
  if (props.boundary) {
    const f = Math.sin(t * 8.3) * Math.sin(t * 2.7);
    const on = f > -0.86 ? 1 : 0.25;
    props.boundary.alleyLampMat.color.setHex(0xffe6b8).multiplyScalar(on);
    props.boundary.alleyGlow.material.opacity = 0.45 * on;
  }
}

function updateTraffic(t) {
  const p = t % trafficCycle;
  const state = p < 7.2 ? 0 : p < 9.0 ? 1 : 2; // 绿 / 黄 / 红
  const cols = [0x3fe08a, 0xffc23f, 0xff4b3e];
  const dims = [0x123a2a, 0x3a3220, 0x3a1a16];
  props.traffic.lensMats.forEach((m, i) => {
    m.color.setHex(i === state ? cols[i] : dims[i]);
  });
  props.traffic.halo.material.color.setHex(cols[state]);
  props.traffic.halo.material.opacity = 0.4 + 0.12 * Math.sin(t * 3.0);
  props.traffic.pedRed.color.setHex(state === 2 ? 0xff5040 : 0x3a1a16);
  props.traffic.pedGreen.color.setHex(state === 0 ? 0x44e08a : 0x123a2a);
}

const clock = new THREE.Clock();
let elapsed = 0;

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  elapsed += dt;

  controls.update();
  camera.updateMatrixWorld();

  for (const m of ground.materials) {
    m.uniforms.uTime.value = elapsed;
    m.uniforms.uCamPos.value.copy(camera.position);
  }

  weather.update(dt, elapsed);
  updateDoor(dt, elapsed);
  updateFlicker(elapsed);
  updateTraffic(elapsed);
  props.lamp.halo.material.opacity = 0.46 + 0.05 * Math.sin(elapsed * 2.3);

  gradePass.uniforms.uTime.value = elapsed;
  composer.render();
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
  gradePass.uniforms.uAspect.value = window.innerWidth / window.innerHeight;
});

animate();

// 淡入
requestAnimationFrame(() => {
  document.body.classList.add('ready');
});
