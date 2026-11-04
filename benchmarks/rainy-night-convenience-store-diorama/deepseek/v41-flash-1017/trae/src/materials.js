import * as THREE from 'three';

// 三渲二：4 阶明暗阶梯
const rampData = new Uint8Array([
  78, 82, 96, 255,
  142, 148, 164, 255,
  206, 212, 226, 255,
  255, 255, 255, 255,
]);
const rampTex = new THREE.DataTexture(rampData, 4, 1, THREE.RGBAFormat);
rampTex.minFilter = THREE.NearestFilter;
rampTex.magFilter = THREE.NearestFilter;
rampTex.generateMipmaps = false;
rampTex.needsUpdate = true;

export function toon(color, opts = {}) {
  return new THREE.MeshToonMaterial({ color, gradientMap: rampTex, ...opts });
}

export function emissiveToon(color, emissive = 0x000000, opts = {}) {
  return new THREE.MeshToonMaterial({ color, gradientMap: rampTex, emissive, ...opts });
}

export function unlit(color, opts = {}) {
  return new THREE.MeshBasicMaterial({ color, ...opts });
}

const outlineCache = new Map();
export function outlineMaterial(thickness = 0.016, color = 0x0c111c) {
  const key = `${thickness.toFixed(3)}_${color}`;
  if (outlineCache.has(key)) return outlineCache.get(key);
  const m = new THREE.ShaderMaterial({
    uniforms: {
      uThickness: { value: thickness },
      uColor: { value: new THREE.Color(color) },
    },
    vertexShader: /* glsl */ `
      uniform float uThickness;
      void main() {
        vec3 n = normalize(normalMatrix * normal);
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        float d = clamp(-mv.z * 0.05, 0.4, 3.0);
        mv.xyz += n * uThickness * d;
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      void main() {
        gl_FragColor = vec4(uColor, 1.0);
        #include <colorspace_fragment>
      }
    `,
    side: THREE.BackSide,
  });
  outlineCache.set(key, m);
  return m;
}

// 给实体加“反向外扩”描边，形成卡通轮廓线
export function addOutline(mesh, thickness = 0.016) {
  if (!mesh.geometry) return mesh;
  const o = new THREE.Mesh(mesh.geometry, outlineMaterial(thickness));
  o.castShadow = false;
  o.receiveShadow = false;
  o.raycast = () => {};
  o.renderOrder = (mesh.renderOrder || 0) - 1;
  mesh.add(o);
  return mesh;
}

export function box(w, h, d, material, { outline = false, thick = 0.016, cast = true, receive = true } = {}) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  m.castShadow = cast;
  m.receiveShadow = receive;
  if (outline) addOutline(m, thick);
  return m;
}

export function cylinder(rTop, rBottom, h, radiusSegments, material, opts = {}) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBottom, h, radiusSegments), material);
  m.castShadow = opts.cast !== false;
  m.receiveShadow = opts.receive !== false;
  if (opts.outline) addOutline(m, opts.thick || 0.016);
  return m;
}

export function plane(w, h, material) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), material);
  m.receiveShadow = true;
  return m;
}

// 两点之间的圆柱（用于自行车车架、栏杆、电线等）
export function tubeBetween(a, b, radius, material, segments = 8) {
  const dir = new THREE.Vector3().subVectors(b, a);
  const len = dir.length();
  const geo = new THREE.CylinderGeometry(radius, radius, len, segments);
  geo.translate(0, len / 2, 0);
  const mesh = new THREE.Mesh(geo, material);
  mesh.position.copy(a);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  mesh.castShadow = true;
  return mesh;
}

export function sprite(tex, color, scale, opacity = 0.8) {
  const s = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: tex,
      color,
      transparent: true,
      opacity,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  s.scale.set(scale, scale, 1);
  return s;
}

export const PALETTE = {
  wall: 0xe9e2d1,
  wallShade: 0xd8cfba,
  trim: 0x2c333d,
  metal: 0x8f98a3,
  darkMetal: 0x333a44,
  sidewalk: 0x8d8a80,
  curb: 0xb5b0a3,
  asphalt: 0x3a3d43,
  interiorFloor: 0xd9d2c0,
  interiorWall: 0xf0e8d8,
  shelf: 0xe8e6dd,
  warm: 0xffd9a0,
  cool: 0x8fd8ff,
};
