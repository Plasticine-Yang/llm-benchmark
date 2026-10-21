import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import './style.css';
import { C } from './palette.js';
import { buildEnvironment } from './environment.js';
import { buildStore } from './store.js';
import { buildWeather, updateWeather } from './weather.js';

const canvas = document.querySelector('#scene');
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: true,
  powerPreference: 'high-performance',
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.04;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x09101e);
scene.fog = new THREE.FogExp2(0x0a1221, .025);

const camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, .1, 100);
camera.position.set(18.3, 14.7, 21.4);
camera.lookAt(0, 2.2, 0);

const controls = new OrbitControls(camera, canvas);
controls.target.set(-.25, 2.05, -.45);
controls.enableDamping = true;
controls.dampingFactor = .055;
controls.enablePan = true;
controls.panSpeed = .65;
controls.rotateSpeed = .48;
controls.zoomSpeed = .8;
controls.minDistance = 15;
controls.maxDistance = 40;
controls.minPolarAngle = .35;
controls.maxPolarAngle = Math.PI * .49;
controls.autoRotate = false;
controls.touches = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN };
controls.update();

const world = new THREE.Group();
world.name = 'rainy-night-konbini-diorama';
world.rotation.y = -.04;
scene.add(world);

// A cool ambient wash, with a warm directional key from the storefront.
const hemi = new THREE.HemisphereLight(0x7394c8, 0x172235, 1.55);
scene.add(hemi);
const moon = new THREE.DirectionalLight(0x9eb9e8, 2.2);
moon.position.set(-8, 16, 10);
moon.castShadow = true;
moon.shadow.mapSize.set(1024, 1024);
moon.shadow.camera.left = -12;
moon.shadow.camera.right = 12;
moon.shadow.camera.top = 12;
moon.shadow.camera.bottom = -12;
moon.shadow.camera.near = 2;
moon.shadow.camera.far = 40;
moon.shadow.bias = -.0008;
scene.add(moon);
const rim = new THREE.DirectionalLight(0x2d78a9, 1.25);
rim.position.set(12, 8, -10);
scene.add(rim);

const environment = buildEnvironment(world);
const storeResult = buildStore(environment.base);
const weather = buildWeather(environment.base);

// Subtle store spill lights create warm/cool contrast on the wet street.
const spillA = new THREE.SpotLight(C.warm, 8.2, 11, .7, .7, 1.5);
spillA.position.set(-1.2, 4.1, 2.05);
spillA.target.position.set(-1.1, .25, 6.0);
spillA.castShadow = false;
world.add(spillA, spillA.target);
const spillB = new THREE.SpotLight(C.teal, 3.2, 8, .75, .8, 1.7);
spillB.position.set(-4.2, 4.3, 2.0);
spillB.target.position.set(-4.1, .3, 5.3);
world.add(spillB, spillB.target);

const AnimeFinishShader = {
  uniforms: {
    tDiffuse: { value: null },
    resolution: { value: new THREE.Vector2(window.innerWidth * renderer.getPixelRatio(), window.innerHeight * renderer.getPixelRatio()) },
    time: { value: 0 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform vec2 resolution;
    uniform float time;
    varying vec2 vUv;

    float rand(vec2 co) {
      return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
    }

    void main() {
      vec2 uv = vUv;
      vec3 color = texture2D(tDiffuse, uv).rgb;
      float luma = dot(color, vec3(.299, .587, .114));
      color = mix(vec3(luma), color, 1.1);
      color = pow(color, vec3(.96));
      float grain = (rand(uv * resolution + floor(time * 12.0)) - .5) * .016;
      float scan = sin(uv.y * resolution.y * .55) * .0025;
      float vignette = smoothstep(.78, .2, distance(uv, vec2(.5)));
      color += grain + scan;
      color *= .9 + vignette * .12;
      gl_FragColor = vec4(color, 1.0);
    }
  `,
};

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const animePass = new ShaderPass(AnimeFinishShader);
composer.addPass(animePass);
composer.addPass(new OutputPass());

const clock = new THREE.Clock();
let elapsed = 0;
let doorCycleOffset = 0;

function updateAutomaticDoors(t) {
  // A gentle 12-second cycle, mostly closed with a short open pause.
  const phase = (t + doorCycleOffset) % 12;
  let openness = 0;
  if (phase > 6.8 && phase < 7.8) openness = THREE.MathUtils.smoothstep(phase, 6.8, 7.8);
  else if (phase >= 7.8 && phase < 9.0) openness = 1;
  else if (phase >= 9.0 && phase < 10.1) openness = 1 - THREE.MathUtils.smoothstep(phase, 9.0, 10.1);
  for (const door of storeResult.animations.doors) {
    door.object.position.x = door.baseX + door.direction * openness * .52;
  }
}

function updateLights(t) {
  const subtleFlicker = .96 + Math.sin(t * 2.1) * .015 + Math.sin(t * 7.7) * .008;
  storeResult.animations.flickerMaterials.forEach((mat, i) => {
    mat.emissiveIntensity = (i === 0 ? 1.04 : .75) * subtleFlicker;
  });
  environment.animations.flickerMaterials.forEach((mat) => {
    mat.emissiveIntensity = 2.0 * (.97 + Math.sin(t * 3.5) * .025);
  });
  const signalIndex = Math.floor((t % 18) / 6);
  environment.animations.signalLamps.forEach((mat, i) => {
    mat.emissiveIntensity = i === signalIndex ? 1.65 : .06;
  });
}

function animate() {
  requestAnimationFrame(animate);
  const delta = Math.min(clock.getDelta(), .05);
  elapsed += delta;
  controls.update();
  updateAutomaticDoors(elapsed);
  updateLights(elapsed);
  updateWeather(weather, elapsed, delta);
  animePass.uniforms.time.value = elapsed;
  composer.render();
}

function resize() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.setSize(width, height);
  composer.setSize(width, height);
  animePass.uniforms.resolution.value.set(width * renderer.getPixelRatio(), height * renderer.getPixelRatio());
}

window.addEventListener('resize', resize);
window.addEventListener('dblclick', () => {
  doorCycleOffset = 7.15 - elapsed % 12;
});

animate();
