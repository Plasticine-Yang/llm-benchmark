/**
 * 雨夜便利店街角 · 微缩立体模型（三渲二）
 * 入口：初始化渲染器 / 相机 / 场景，组装所有子系统，驱动动画循环。
 * 观察方式：自由拖拽旋转、滚轮缩放（OrbitControls），画面中没有任何 UI 元素。
 */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { SUN, ROAD } from './config.js';
import { buildSky, buildBase, buildStreets, buildPuddles, buildRippleLayer, buildNeighbors, buildAlley, buildParkingLot, buildWires } from './environment.js';
import { setEnvironmentMap } from './toon.js';
import { buildStore } from './store.js';
import { buildProps } from './props.js';
import {
  buildRain, buildDrips, buildRipples, buildFlickers, buildSignals,
  buildDoorController, buildGlassRain, buildReflectionProbe, buildGlowPools,
} from './effects.js';
import { buildComposer } from './post.js';

const params = new URLSearchParams(location.search);

/* ---------------------------------------------------------------- 渲染器 */
const canvas = document.getElementById('stage');
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  powerPreference: 'high-performance',
  alpha: false,
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
// 色调映射与 sRGB 编码统一放在后期链里完成（场景先渲染进线性 HDR 缓冲）
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.NoToneMapping;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

/* ------------------------------------------------------------------ 场景 */
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a1120);
scene.fog = new THREE.FogExp2(0x14243c, 0.0115);

const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.2, 600);
camera.position.set(-11.0, 12.5, 19.0);
// 便于逐角度审阅：?cam=x,y,z&target=x,y,z&fov=36
const numList = (key, def) => {
  const v = params.get(key);
  if (!v) return def;
  const a = v.split(',').map(Number);
  return a.length === 3 && a.every((n) => Number.isFinite(n)) ? a : def;
};
camera.position.fromArray(numList('cam', camera.position.toArray()));
camera.fov = Number(params.get('fov')) || 40;
camera.updateProjectionMatrix();

const controls = new OrbitControls(camera, canvas);
controls.target.fromArray(numList('target', [-1.0, 1.2, -2.5]));
controls.enableDamping = true;
controls.dampingFactor = 0.055;
controls.minDistance = 9;
controls.maxDistance = 110;
controls.minPolarAngle = 0.18;
controls.maxPolarAngle = Math.PI / 2 - 0.05;
controls.rotateSpeed = 0.85;
controls.zoomSpeed = 0.85;
controls.panSpeed = 0.7;
controls.autoRotate = params.has('shot') ? false : true;
controls.autoRotateSpeed = -0.34;
controls.update();

/* ---------------------------------------------------------------- 灯光 */
const hemi = new THREE.HemisphereLight(0x8ab0ee, 0x101624, 0.62);
hemi.position.set(0, 30, 0);
scene.add(hemi);

const key = new THREE.DirectionalLight(SUN.key, 0.78);
key.position.set(-24, 34, 20);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
key.shadow.camera.near = 6;
key.shadow.camera.far = 120;
key.shadow.camera.left = -32;
key.shadow.camera.right = 32;
key.shadow.camera.top = 32;
key.shadow.camera.bottom = -32;
key.shadow.bias = -0.0006;
key.shadow.normalBias = 0.035;
scene.add(key);

const fill = new THREE.DirectionalLight(SUN.fill, 0.5);
fill.position.set(18, 16, -26);
scene.add(fill);

// 便利店门口的整体溢出光（把湿路面照出暖色）
const spill = new THREE.PointLight(0xffd9a0, 26, 20, 2);
spill.position.set(-1.6, 3.0, 3.4);
scene.add(spill);

/* ------------------------------------------------------------ 组装场景 */
buildSky(scene);
buildBase(scene);
buildStreets(scene);
buildNeighbors(scene);
buildAlley(scene);
buildParkingLot(scene);

const store = buildStore(scene);
const propsGroup = buildProps(scene);
buildWires(scene);

/* --------------------------------------------------- 反射探针（湿地倒影） */
// 场景搭好后再拍摄环境：此时便利店、招牌、路灯都已就位。
const probe = buildReflectionProbe(renderer, scene);
const envMap = probe.bake();
setEnvironmentMap(envMap);
scene.environment = envMap;

buildPuddles(scene);

const ripples = buildRipples();
const rippleLayer = buildRippleLayer(scene);
rippleLayer.uniforms.uRipples.value = ripples.value;

const rain = buildRain(scene);
const drips = buildDrips(scene);
const flickers = buildFlickers(store.signs);
const signals = buildSignals(propsGroup);
const door = buildDoorController(store.door);
const glassRain = buildGlassRain(store.group);
const glowPools = buildGlowPools(scene);

/* ------------------------------------------------------------- 后期处理 */
const post = buildComposer(renderer, scene, camera);

/* ------------------------------------------------------------ 交互与循环 */
let userTouched = false;
const stopAuto = () => { userTouched = true; controls.autoRotate = false; };
['pointerdown', 'wheel', 'touchstart', 'keydown'].forEach((e) => canvas.addEventListener(e, stopAuto, { passive: true }));

function resize() {
  const w = window.innerWidth, h = window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
  post.setSize(w, h);
}
window.addEventListener('resize', resize);
resize();

let elapsed = 0;

function frame() {
  const dt = Math.min(clock.getDelta(), 0.05);
  elapsed += dt;
  const t = elapsed;

  ripples.update(dt, t);
  rippleLayer.uniforms.uTime.value = t;
  rain.update(t, camera);
  drips.update(t);
  flickers.update(t);
  signals.update(t);
  door.update(t);
  glassRain.update(t);
  glowPools.update(t);

  controls.update();
  if (params.has('plain')) {
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.render(scene, camera);
  } else {
    post.render(t);
  }
  requestAnimationFrame(frame);
}

const clock = new THREE.Clock();
document.getElementById('boot').classList.add('done');
requestAnimationFrame(frame);

// 便于调试：暴露少量句柄（不影响画面）
// 调试开关（?nohemi=1&nokey=1&nospill=1&noenv=1&noint=1）—— 不影响默认画面
if (params.has('nohemi')) hemi.intensity = 0;
if (params.has('nokey')) key.intensity = 0;
if (params.has('nofill')) fill.intensity = 0;
if (params.has('nospill')) spill.intensity = 0;
if (params.has('noenv')) {
  scene.environment = null;
  scene.traverse((o) => {
    if (o.material && o.material.isWet) { o.material.envMap = null; o.material.needsUpdate = true; }
  });
}
if (params.has('noint')) {
  store.group.traverse((o) => { if (o.isPointLight || o.isAmbientLight) o.intensity = 0; });
}
if (params.has('noemis')) {
  store.group.traverse((o) => {
    const mats = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : [];
    mats.forEach((m) => { if (m.emissive) m.emissiveIntensity = 0; });
  });
}

window.__DIORAMA__ = { scene, camera, renderer, controls, store, probe, post };
