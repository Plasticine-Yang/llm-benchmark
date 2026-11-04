import * as THREE from 'three';
import { Reflector } from 'three/examples/jsm/objects/Reflector.js';
import { SIDEWALKS, SIDEWALK_Y } from './layout.js';
import { toon, box } from './materials.js';
import { makeGrateTexture, makePlaqueTexture } from './textures.js';

/* --------------------------------------------------------- 湿地反射材质 */
const groundVert = /* glsl */ `
  uniform mat4 textureMatrix;
  varying vec4 vUv;
  varying vec3 vWorld;
  void main() {
    vUv = textureMatrix * vec4(position, 1.0);
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWorld = wp.xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const groundFrag = /* glsl */ `
  uniform sampler2D tDiffuse;
  uniform sampler2D uMap;
  uniform sampler2D uPuddle;
  uniform float uTime;
  uniform vec3 uCamPos;
  uniform vec3 uTint;
  uniform vec3 uFogColor;
  uniform float uReflect;
  varying vec4 vUv;
  varying vec3 vWorld;

  float hash21(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  vec2 ripples(vec2 p, float t) {
    vec2 acc = vec2(0.0);
    for (int i = 0; i < 2; i++) {
      float sc = i == 0 ? 1.15 : 2.35;
      vec2 q = p * sc;
      vec2 cell = floor(q);
      vec2 f = fract(q) - 0.5;
      float ph = hash21(cell + float(i) * 13.0);
      float tt = fract(t * (0.5 + float(i) * 0.15) + ph);
      float d = length(f);
      float env = smoothstep(0.0, 0.08, tt) * (1.0 - tt);
      float ring = sin(d * 26.0 - tt * 30.0) * exp(-d * 5.0) * env;
      acc += normalize(f + 1e-4) * ring;
    }
    return acc;
  }

  void main() {
    vec2 uv = (vWorld.xz + 12.0) / 24.0;
    vec3 albedo = texture2D(uMap, uv).rgb;
    float puddle = smoothstep(0.24, 0.82, texture2D(uPuddle, uv).r);

    vec2 rip = ripples(vWorld.xz, uTime);
    vec4 uvp = vUv;
    uvp.xy += rip * mix(0.004, 0.02, puddle) * uvp.w;

    vec3 refl = texture2DProj(tDiffuse, uvp).rgb;
    vec3 refl2 = texture2DProj(tDiffuse, uvp + vec4(0.0016 * uvp.w, 0.0, 0.0, 0.0)).rgb;
    refl = mix(refl, refl2, 0.25);

    vec3 V = normalize(uCamPos - vWorld);
    float fres = pow(1.0 - clamp(V.y, 0.0, 1.0), 2.0);
    float rs = uReflect * (0.2 + 0.75 * fres) * (0.55 + 0.85 * puddle);

    vec3 col = albedo * (0.72 - 0.2 * puddle);
    col += refl * rs * uTint;
    col += vec3(0.62, 0.8, 1.0) * abs(rip.x) * puddle * 0.18;

    float dist = length(vWorld - uCamPos);
    col = mix(col, uFogColor, smoothstep(40.0, 120.0, dist) * 0.4);

    gl_FragColor = vec4(col, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

/* --------------------------------------------------------- 地面 */
export function createGround(scene, renderer, textures) {
  const uniforms = {
    color: { value: null },
    tDiffuse: { value: null },
    textureMatrix: { value: null },
    uMap: { value: textures.map },
    uPuddle: { value: textures.puddle },
    uTime: { value: 0 },
    uCamPos: { value: new THREE.Vector3() },
    uTint: { value: new THREE.Color(0xd2e2f4) },
    uFogColor: { value: new THREE.Color(0x121a28) },
    uReflect: { value: 1.25 },
  };

  const reflector = new Reflector(new THREE.PlaneGeometry(24, 24), {
    clipBias: 0.0035,
    textureWidth: 1024,
    textureHeight: 1024,
    multisample: 0,
    color: 0xffffff,
    shader: {
      name: 'WetGround',
      uniforms,
      vertexShader: groundVert,
      fragmentShader: groundFrag,
    },
  });
  reflector.rotation.x = -Math.PI / 2;
  reflector.position.y = 0.002;
  reflector.material.uniforms.uMap.value = textures.map;
  reflector.material.uniforms.uPuddle.value = textures.puddle;
  reflector.renderOrder = 0;
  scene.add(reflector);

  const group = new THREE.Group();
  group.name = 'street-details';

  // 路缘石
  const curbMat = toon(0xa9a496);
  const addCurb = (x0, z0, x1, z1, h = 0.1) => {
    const w = Math.max(0.01, x1 - x0);
    const d = Math.max(0.01, z1 - z0);
    const b = box(w, h, d, curbMat, { outline: true, thick: 0.01 });
    b.position.set((x0 + x1) / 2, h / 2 - 0.01, (z0 + z1) / 2);
    group.add(b);
  };
  addCurb(-5.6, 3.9, 12, 4.06);
  addCurb(-5.76, -12, -5.6, 4.06);
  addCurb(-12, 8.72, -10.36, 8.88);
  addCurb(-5.6, 8.72, 12, 8.88);
  addCurb(-10.36, -12, -10.2, 4.0);
  addCurb(-10.36, 8.88, -10.2, 12);
  addCurb(7.95, 0.94, 11.6, 1.1, 0.05);

  // 排水沟盖
  const grateTex = makeGrateTexture();
  const grateMat = new THREE.MeshBasicMaterial({ map: grateTex, color: 0x8d949c });
  const gratePositions = [
    [-4.3, 4.32, 0.9, 0.3],
    [-2.1, 4.32, 0.9, 0.3],
    [0.4, 4.32, 0.9, 0.3],
    [3.0, 4.32, 0.9, 0.3],
    [5.6, 4.32, 0.9, 0.3],
    [8.6, 3.94, 1.9, 0.28],
  ];
  for (const [x, z, w, d] of gratePositions) {
    const g = new THREE.Mesh(new THREE.PlaneGeometry(w, d), grateMat);
    g.rotation.x = -Math.PI / 2;
    g.position.set(x, 0.014, z);
    group.add(g);
  }
  scene.add(group);

  return {
    group,
    reflector,
    materials: [reflector.material],
  };
}

/* --------------------------------------------------------- 展示底座 */
export function createPlinth(scene) {
  const g = new THREE.Group();
  const body = toon(0x181b21);
  const rim = toon(0x0f1217);
  const brass = new THREE.MeshStandardMaterial({ color: 0x9d7c46, roughness: 0.42, metalness: 0.75 });

  const main = box(24.2, 1.0, 24.2, body, { outline: true, thick: 0.03, receive: false });
  main.position.y = -0.5;
  g.add(main);

  const lip = box(24.55, 0.14, 24.55, rim, { outline: true, thick: 0.03, receive: false });
  lip.position.y = -0.08;
  g.add(lip);

  const trim = new THREE.Mesh(new THREE.BoxGeometry(24.26, 0.04, 24.26), brass);
  trim.position.y = -0.16;
  g.add(trim);

  const foot = box(24.72, 0.26, 24.72, rim, { outline: true, thick: 0.03, receive: false });
  foot.position.y = -1.1;
  g.add(foot);

  const plaque = new THREE.Mesh(
    new THREE.PlaneGeometry(4.4, 1.1),
    new THREE.MeshBasicMaterial({ map: makePlaqueTexture() })
  );
  plaque.position.set(0, -0.52, 12.21);
  g.add(plaque);

  scene.add(g);
  return g;
}
