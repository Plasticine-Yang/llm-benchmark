import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { Pass, FullScreenQuad } from 'three/examples/jsm/postprocessing/Pass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

import { LAYER, SLAB } from './layout.js';
import { shared } from './materials.js';
import { buildGround } from './ground.js';
import { buildShop } from './shop.js';
import { buildStreet } from './street.js';
import { buildRain } from './rain.js';
import { skyTexture } from './textures.js';

// ----------------------------------------------------------------------------- renderer
const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
const DPR = Math.min(window.devicePixelRatio || 1, 2);
renderer.setPixelRatio(DPR);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.NeutralToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = skyTexture();

const camera = new THREE.PerspectiveCamera(30, window.innerWidth / window.innerHeight, 0.5, 200);
camera.position.set(12.5, 12.0, 23.5);
camera.layers.enableAll();

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(-0.6, 1.0, 0.0);
controls.enableDamping = true;
controls.dampingFactor = 0.07;
controls.minDistance = 7;
controls.maxDistance = 60;
controls.maxPolarAngle = Math.PI * 0.49;
controls.minPolarAngle = 0.08;
controls.rotateSpeed = 0.7;
controls.zoomSpeed = 0.9;
controls.panSpeed = 0.6;
controls.screenSpacePanning = true;
controls.update();
const panLimit = 6;
controls.addEventListener('change', () => {
  const t = controls.target;
  const cx = THREE.MathUtils.clamp(t.x, -panLimit, panLimit);
  const cy = THREE.MathUtils.clamp(t.y, -1, 5);
  const cz = THREE.MathUtils.clamp(t.z, -panLimit, panLimit);
  if (cx !== t.x || cy !== t.y || cz !== t.z) {
    const d = new THREE.Vector3(cx - t.x, cy - t.y, cz - t.z);
    t.add(d);
    camera.position.add(d);
  }
});

// ----------------------------------------------------------------------------- lights
const hemi = new THREE.HemisphereLight('#7d93c9', '#2a2433', 1.05);
scene.add(hemi);
const amb = new THREE.AmbientLight('#4a5680', 0.55);
scene.add(amb);
const moon = new THREE.DirectionalLight('#9fb4ff', 1.15);
moon.position.set(-8, 16, 6);
moon.target.position.set(0, 0, 0);
moon.castShadow = true;
moon.shadow.mapSize.set(2048, 2048);
moon.shadow.camera.left = -11;
moon.shadow.camera.right = 11;
moon.shadow.camera.top = 11;
moon.shadow.camera.bottom = -11;
moon.shadow.camera.near = 1;
moon.shadow.camera.far = 40;
moon.shadow.bias = -0.0006;
moon.shadow.normalBias = 0.02;
scene.add(moon, moon.target);

// ----------------------------------------------------------------------------- content
const updaters = [];
const lights = [];
buildGround(scene, updaters);
const shop = buildShop(scene, updaters, lights);
buildStreet(scene, updaters, lights);
buildRain(scene, updaters, shop);

scene.traverse((o) => {
  if (!o.isMesh) return;
  const fx = o.layers.mask === 1 << LAYER.FX;
  const isGround = o.layers.mask === 1 << LAYER.GROUND;
  const transparent = Array.isArray(o.material) ? false : o.material.transparent;
  const basic = o.material && o.material.isMeshBasicMaterial;
  if (!fx && !transparent && !basic) {
    o.castShadow = !isGround && !o.isInstancedMesh;
    o.receiveShadow = true;
  }
  if (isGround) o.receiveShadow = true;
});

// ----------------------------------------------------------------------------- planar reflection for the wet ground
const reflRT = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: 2 });
shared.tReflect.value = reflRT.texture;
const reflCam = new THREE.PerspectiveCamera();
reflCam.layers.set(LAYER.DEFAULT);
reflCam.layers.enable(LAYER.NO_OUTLINE);
const REFL_Y = SLAB * 0.65;
const _v = {
  normal: new THREE.Vector3(0, 1, 0),
  pos: new THREE.Vector3(0, REFL_Y, 0),
  cam: new THREE.Vector3(),
  rot: new THREE.Matrix4(),
  look: new THREE.Vector3(),
  view: new THREE.Vector3(),
  target: new THREE.Vector3(),
  plane: new THREE.Plane(),
  clip: new THREE.Vector4(),
  q: new THREE.Vector4(),
};
function renderReflection() {
  const v = _v;
  v.cam.setFromMatrixPosition(camera.matrixWorld);
  v.view.subVectors(v.pos, v.cam);
  if (v.view.dot(v.normal) > 0) return;
  v.view.reflect(v.normal).negate().add(v.pos);
  v.rot.extractRotation(camera.matrixWorld);
  v.look.set(0, 0, -1).applyMatrix4(v.rot).add(v.cam);
  v.target.subVectors(v.pos, v.look).reflect(v.normal).negate().add(v.pos);
  reflCam.position.copy(v.view);
  reflCam.up.set(0, 1, 0).applyMatrix4(v.rot).reflect(v.normal);
  reflCam.lookAt(v.target);
  reflCam.far = camera.far;
  reflCam.updateMatrixWorld();
  reflCam.projectionMatrix.copy(camera.projectionMatrix);
  shared.uMirrorMatrix.value.set(0.5, 0, 0, 0.5, 0, 0.5, 0, 0.5, 0, 0, 0.5, 0.5, 0, 0, 0, 1)
    .multiply(reflCam.projectionMatrix)
    .multiply(reflCam.matrixWorldInverse);
  // oblique near plane clipping
  v.plane.setFromNormalAndCoplanarPoint(v.normal, v.pos).applyMatrix4(reflCam.matrixWorldInverse);
  v.clip.set(v.plane.normal.x, v.plane.normal.y, v.plane.normal.z, v.plane.constant);
  const pm = reflCam.projectionMatrix.elements;
  v.q.x = (Math.sign(v.clip.x) + pm[8]) / pm[0];
  v.q.y = (Math.sign(v.clip.y) + pm[9]) / pm[5];
  v.q.z = -1;
  v.q.w = (1 + pm[10]) / pm[14];
  v.clip.multiplyScalar(2 / v.clip.dot(v.q));
  pm[2] = v.clip.x;
  pm[6] = v.clip.y;
  pm[10] = v.clip.z + 1 - 0.003;
  pm[14] = v.clip.w;
  reflCam.projectionMatrixInverse.copy(reflCam.projectionMatrix).invert();

  const prevShadow = renderer.shadowMap.autoUpdate;
  renderer.shadowMap.autoUpdate = false;
  renderer.setRenderTarget(reflRT);
  renderer.clear();
  renderer.render(scene, reflCam);
  renderer.shadowMap.autoUpdate = prevShadow;
}

// ----------------------------------------------------------------------------- toon outline pass
const normalFlagMat = (flag) => new THREE.ShaderMaterial({
  uniforms: { uFlag: { value: flag } },
  vertexShader: /* glsl */ `
    #include <common>
    #include <skinning_pars_vertex>
    varying vec3 vN;
    void main(){
      vec3 objectNormal = normal;
      vec3 transformed = position;
      #ifdef USE_INSTANCING
        objectNormal = mat3(instanceMatrix) * objectNormal;
        transformed = (instanceMatrix * vec4(transformed, 1.0)).xyz;
      #endif
      vN = normalize(normalMatrix * objectNormal);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.0);
    }`,
  fragmentShader: /* glsl */ `
    uniform float uFlag; varying vec3 vN;
    void main(){ vec3 n = normalize(vN) * (gl_FrontFacing ? 1.0 : -1.0); gl_FragColor = vec4(n * 0.5 + 0.5, uFlag); }`,
  side: THREE.DoubleSide,
});

class ToonOutlinePass extends Pass {
  constructor(scene, camera) {
    super();
    this.scene = scene;
    this.camera = camera;
    this.colorRT = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: 4 });
    this.normalRT = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType });
    this.normalRT.depthTexture = new THREE.DepthTexture(1, 1);
    this.normalRT.depthTexture.type = THREE.UnsignedIntType;
    this.matOn = normalFlagMat(1);
    this.matOff = normalFlagMat(0);
    this.quad = new FullScreenQuad(new THREE.ShaderMaterial({
      uniforms: {
        tColor: { value: this.colorRT.texture },
        tNormal: { value: this.normalRT.texture },
        tDepth: { value: this.normalRT.depthTexture },
        uRes: { value: new THREE.Vector2(1, 1) },
        uNear: { value: camera.near },
        uFar: { value: camera.far },
        uW: { value: 1 },
      },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
      fragmentShader: /* glsl */ `
        uniform sampler2D tColor; uniform sampler2D tNormal; uniform sampler2D tDepth;
        uniform vec2 uRes; uniform float uNear; uniform float uFar; uniform float uW;
        varying vec2 vUv;
        float lin(float d){ float z = d * 2.0 - 1.0; return (2.0 * uNear * uFar) / (uFar + uNear - z * (uFar - uNear)); }
        void main(){
          vec4 col = texture2D(tColor, vUv);
          vec2 px = uW / uRes;
          vec4 nc = texture2D(tNormal, vUv);
          float dc = lin(texture2D(tDepth, vUv).r);
          float eN = 0.0, eD = 0.0;
          vec2 offs[4]; offs[0] = vec2(px.x, 0.0); offs[1] = vec2(-px.x, 0.0); offs[2] = vec2(0.0, px.y); offs[3] = vec2(0.0, -px.y);
          float flag = nc.a;
          for (int i = 0; i < 4; i++) {
            vec4 n = texture2D(tNormal, vUv + offs[i]);
            float d = lin(texture2D(tDepth, vUv + offs[i]).r);
            // only draw on the nearer side of a silhouette so lines stay crisp
            float nearer = step(dc, d + 0.0001);
            eD = max(eD, nearer * smoothstep(0.012, 0.03, (d - dc) / dc));
            float nd = length(n.rgb - nc.rgb) * step(0.5, n.a + nc.a) * step(abs(d - dc) / dc, 0.05);
            eN = max(eN, smoothstep(0.45, 0.75, nd));
          }
          float e = max(eD, eN * 0.85) * flag;
          float distFade = smoothstep(90.0, 30.0, dc);
          e *= distFade;
          vec3 ink = col.rgb * 0.22 + vec3(0.025, 0.028, 0.055);
          gl_FragColor = vec4(mix(col.rgb, ink, e * 0.92), 1.0);
        }`,
    }));
  }
  setSize(w, h) {
    this.colorRT.setSize(w, h);
    this.normalRT.setSize(w, h);
    this.quad.material.uniforms.uRes.value.set(w, h);
    this.quad.material.uniforms.uW.value = Math.max(1, (w / window.innerWidth) * 0.85);
  }
  render(renderer, writeBuffer) {
    const cam = this.camera;
    const mask = cam.layers.mask;
    const bg = this.scene.background;
    // colour
    renderer.setRenderTarget(this.colorRT);
    renderer.clear();
    renderer.render(this.scene, cam);
    // normals + outline flag
    this.scene.background = null;
    const prevAuto = renderer.shadowMap.autoUpdate;
    renderer.shadowMap.autoUpdate = false;
    const cc = renderer.getClearColor(new THREE.Color());
    const ca = renderer.getClearAlpha();
    renderer.setClearColor(0x000000, 0);
    renderer.setRenderTarget(this.normalRT);
    renderer.clear();
    cam.layers.set(LAYER.DEFAULT);
    cam.layers.enable(LAYER.GROUND);
    this.scene.overrideMaterial = this.matOn;
    renderer.render(this.scene, cam);
    renderer.autoClear = false;
    cam.layers.set(LAYER.NO_OUTLINE);
    this.scene.overrideMaterial = this.matOff;
    renderer.render(this.scene, cam);
    renderer.autoClear = true;
    this.scene.overrideMaterial = null;
    cam.layers.mask = mask;
    renderer.setClearColor(cc, ca);
    this.scene.background = bg;
    renderer.shadowMap.autoUpdate = prevAuto;
    // composite
    this.quad.material.uniforms.uNear.value = cam.near;
    this.quad.material.uniforms.uFar.value = cam.far;
    renderer.setRenderTarget(this.renderToScreen ? null : writeBuffer);
    this.quad.render(renderer);
  }
}

const GradeShader = {
  uniforms: { tDiffuse: { value: null }, uTime: shared.uTime, uRes: { value: new THREE.Vector2(1, 1) } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse; uniform float uTime; uniform vec2 uRes; varying vec2 vUv;
    float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
    void main(){
      vec4 c = texture2D(tDiffuse, vUv);
      // cool shadows, warm highlights (anime night grade)
      float l = dot(c.rgb, vec3(0.299, 0.587, 0.114));
      c.rgb += vec3(-0.004, 0.004, 0.022) * (1.0 - smoothstep(0.0, 0.5, l));
      c.rgb = mix(vec3(l), c.rgb, 1.08);
      // vignette
      vec2 q = vUv - 0.5;
      float vig = smoothstep(0.95, 0.25, length(q * vec2(uRes.x / uRes.y, 1.0)) * 0.9);
      c.rgb *= mix(0.62, 1.0, vig);
      // fine grain
      c.rgb += (h(vUv * uRes + fract(uTime) * 100.0) - 0.5) * 0.012;
      gl_FragColor = c;
    }`,
};

const composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType }));
const outlinePass = new ToonOutlinePass(scene, camera);
composer.addPass(outlinePass);
const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.42, 0.38, 0.98);
composer.addPass(bloom);
const grade = new ShaderPass(GradeShader);
composer.addPass(grade);
composer.addPass(new OutputPass());

function resize() {
  const w = window.innerWidth, h = window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
  composer.setPixelRatio(DPR);
  composer.setSize(w, h);
  reflRT.setSize(Math.round(w * DPR * 0.5), Math.round(h * DPR * 0.5));
  grade.uniforms.uRes.value.set(w * DPR, h * DPR);
}
window.addEventListener('resize', resize);
resize();

// ----------------------------------------------------------------------------- loop
const clock = new THREE.Clock();
const params = new URLSearchParams(location.search);
const fixedT = params.has('t') ? parseFloat(params.get('t')) : null;
let time = fixedT ?? 0;
function frame() {
  const dt = Math.min(clock.getDelta(), 0.05);
  time += fixedT !== null ? 0 : dt;
  shared.uTime.value = time;
  for (const u of updaters) u(fixedT !== null ? 0.016 : dt, time);
  controls.update();
  renderReflection();
  composer.render(dt);
  requestAnimationFrame(frame);
}
// optional camera presets for screenshots: ?view=front|side|top|close|inside
const views = {
  front: [[2, 7.5, 24], [-0.3, 1.2, 0]],
  side: [[24, 8, 4], [0, 1.2, 0]],
  top: [[0.5, 30, 6], [0, 0, 0]],
  close: [[7.5, 4.0, 9.5], [0, 1.3, -0.5]],
  inside: [[3.2, 2.2, 5.2], [-0.5, 1.2, -1.2]],
  back: [[-18, 14, -18], [0, 1, 0]],
};
if (views[params.get('view')]) {
  const [p, t] = views[params.get('view')];
  camera.position.set(...p);
  controls.target.set(...t);
  controls.update();
}
frame();
window.__ready = true;
