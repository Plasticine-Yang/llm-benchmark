import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

import { sharedOutlineResolution } from './utils/toonFactory.js';
import { buildBaseAndStreets } from './scene/buildBaseAndStreets.js';
import { buildStoreInterior } from './scene/buildStoreInterior.js';
import { buildConvenienceStore } from './scene/buildConvenienceStore.js';
import { buildExteriorProps } from './scene/buildExteriorProps.js';
import { buildAtmosphere } from './scene/buildAtmosphere.js';

function init() {
  const width = window.innerWidth;
  const height = window.innerHeight;

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(width, height);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.06;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  document.body.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x080d1b);

  const camera = new THREE.PerspectiveCamera(36, width / height, 0.2, 200);
  camera.position.set(16.6, 11.4, 17.2);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(-0.35, 1.55, -0.35);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.minDistance = 5.5;
  controls.maxDistance = 42.0;
  controls.minPolarAngle = 0.14;
  controls.maxPolarAngle = Math.PI * 0.53;
  controls.update();

  // --- Lighting Rig: Cold Rainy Night Indigo vs Warm Cozy Interior Lantern ---
  const hemiLight = new THREE.HemisphereLight(0x5275ba, 0x1a2138, 0.94);
  scene.add(hemiLight);

  const moonDirLight = new THREE.DirectionalLight(0x8bb6ff, 1.05);
  moonDirLight.position.set(-10.5, 17.0, -7.5);
  moonDirLight.castShadow = true;
  moonDirLight.shadow.mapSize.set(2048, 2048);
  moonDirLight.shadow.camera.near = 2.0;
  moonDirLight.shadow.camera.far = 42.0;
  moonDirLight.shadow.camera.left = -13;
  moonDirLight.shadow.camera.right = 13;
  moonDirLight.shadow.camera.top = 13;
  moonDirLight.shadow.camera.bottom = -13;
  moonDirLight.shadow.bias = -0.0005;
  moonDirLight.shadow.normalBias = 0.025;
  scene.add(moonDirLight);

  // Store interior warm lighting (bright cozy contrast against rainy exterior)
  const storeWarmLeft = new THREE.PointLight(0xffdfb0, 10.5, 9.5, 1.45);
  storeWarmLeft.position.set(-2.35, 2.78, -2.05);
  scene.add(storeWarmLeft);

  const storeWarmRight = new THREE.PointLight(0xffe7c2, 9.5, 8.5, 1.45);
  storeWarmRight.position.set(0.85, 2.74, -1.75);
  scene.add(storeWarmRight);

  const chillerCoolLight = new THREE.PointLight(0xd9f2ff, 4.8, 5.5, 1.5);
  chillerCoolLight.position.set(0.55, 2.05, -4.35);
  scene.add(chillerCoolLight);

  // Storefront awning warm spill (boosts gently when automatic doors open)
  const doorWarmLight = new THREE.PointLight(0xffd798, 5.5, 7.5, 1.55);
  doorWarmLight.position.set(0.19, 2.68, 1.62);
  scene.add(doorWarmLight);

  // Vending machines cool-cyan bounce onto right sidewalk
  const vendingLight = new THREE.PointLight(0x7ed8ff, 4.6, 5.8, 1.55);
  vendingLight.position.set(3.08, 1.42, -3.75);
  scene.add(vendingLight);

  // Streetlight cool cyan pool on side street & corner crosswalk
  const streetLampLight = new THREE.PointLight(0x9ad8ff, 6.8, 10.5, 1.45);
  streetLampLight.position.set(5.22, 4.85, -2.05);
  scene.add(streetLampLight);

  // Narrow alley warm amber porch lantern
  const alleyLanternLight = new THREE.PointLight(0xffb45c, 5.2, 6.8, 1.55);
  alleyLanternLight.position.set(-6.45, 2.48, -1.95);
  scene.add(alleyLanternLight);

  // Distant traffic signal cycling glow
  const signalPointLight = new THREE.PointLight(0x38f29e, 3.0, 6.5, 1.5);
  signalPointLight.position.set(7.15, 3.85, -6.10);
  scene.add(signalPointLight);

  // --- Assemble Diorama Modules ---
  const baseAndStreets = buildBaseAndStreets(scene);
  const storeInterior = buildStoreInterior();
  const convenienceStore = buildConvenienceStore();
  const exteriorProps = buildExteriorProps();
  const atmosphere = buildAtmosphere(convenienceStore.dripAnchors);

  scene.add(
    baseAndStreets.group,
    storeInterior.group,
    convenienceStore.group,
    exteriorProps.group,
    atmosphere.group
  );

  // --- Post-Processing Pipeline (MSAA HDR Target -> Subtle Anime Bloom -> ToneMap Output) ---
  const renderTarget = new THREE.WebGLRenderTarget(width, height, {
    type: THREE.HalfFloatType,
    samples: 4,
  });
  const composer = new EffectComposer(renderer, renderTarget);
  composer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  composer.setSize(width, height);

  const renderPass = new RenderPass(scene, camera);
  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(width, height),
    0.26, // strength: delicate anime halation
    0.42, // radius
    0.86  // threshold: only glowing signs/lamps/ceilings bloom
  );
  const outputPass = new OutputPass();

  composer.addPass(renderPass);
  composer.addPass(bloomPass);
  composer.addPass(outputPass);

  // --- Resize Handler ---
  const onResize = () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio, 2);

    camera.aspect = w / h;
    camera.updateProjectionMatrix();

    renderer.setPixelRatio(dpr);
    renderer.setSize(w, h);
    composer.setPixelRatio(dpr);
    composer.setSize(w, h);
    bloomPass.resolution.set(w, h);
    sharedOutlineResolution.set(w, h);
  };
  window.addEventListener('resize', onResize);

  // --- Animation Loop ---
  const clock = new THREE.Clock();
  const animate = () => {
    requestAnimationFrame(animate);
    const dt = clock.getDelta();
    const elapsed = clock.elapsedTime;

    controls.update();

    const activeSignalColor = exteriorProps.update(elapsed, signalPointLight);
    convenienceStore.update(elapsed, doorWarmLight);
    baseAndStreets.update(elapsed, activeSignalColor);
    atmosphere.update(dt, elapsed);

    composer.render();
  };

  animate();
}

init();
