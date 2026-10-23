import * as THREE from 'three';

/* ---------------- cel shading ramp ---------------- */
function makeRamp(steps: number[]): THREE.DataTexture {
  const data = new Uint8Array(steps.length * 4);
  steps.forEach((s, i) => {
    const v = Math.round(s * 255);
    data[i * 4] = v;
    data[i * 4 + 1] = v;
    data[i * 4 + 2] = v;
    data[i * 4 + 3] = 255;
  });
  const t = new THREE.DataTexture(data, steps.length, 1, THREE.RGBAFormat);
  t.minFilter = THREE.NearestFilter;
  t.magFilter = THREE.NearestFilter;
  t.generateMipmaps = false;
  t.needsUpdate = true;
  return t;
}

const RAMP_SOFT = makeRamp([0.36, 0.62, 0.82, 1.0]);
const RAMP_HARD = makeRamp([0.3, 0.72, 1.0]);

export function clearMaterialCache(): void {
  cache.forEach((m) => m.dispose());
  cache.clear();
}

export interface ToonOpts {
  emissive?: number;
  emissiveIntensity?: number;
  map?: THREE.Texture | null;
  emissiveMap?: THREE.Texture | null;
  rough?: boolean;
  side?: THREE.Side;
  flat?: boolean;
}

const cache = new Map<string, THREE.MeshToonMaterial>();

/** Shared, cached toon material — keeps draw-call state changes low. */
export function toon(color: number, o: ToonOpts = {}): THREE.MeshToonMaterial {
  const key = [
    color,
    o.emissive ?? -1,
    o.emissiveIntensity ?? 1,
    o.map?.uuid ?? '',
    o.emissiveMap?.uuid ?? '',
    o.rough ? 1 : 0,
    o.side ?? 0,
    o.flat ? 1 : 0,
  ].join('|');
  const hit = cache.get(key);
  if (hit) return hit;

  const m = new THREE.MeshToonMaterial({
    color,
    gradientMap: o.rough ? RAMP_HARD : RAMP_SOFT,
    side: o.side ?? THREE.FrontSide,
  });
  if (o.map) m.map = o.map;
  if (o.emissiveMap) m.emissiveMap = o.emissiveMap;
  if (o.emissive !== undefined) {
    m.emissive = new THREE.Color(o.emissive);
    m.emissiveIntensity = o.emissiveIntensity ?? 1;
  }
  cache.set(key, m);
  return m;
}

/** Unlit, fully bright surface — used for neon, lamp lenses and light boxes. */
export function glow(
  color: number,
  map: THREE.Texture | null = null,
  opacity = 1
): THREE.MeshBasicMaterial {
  return new THREE.MeshBasicMaterial({
    color,
    map,
    transparent: opacity < 1,
    opacity,
    toneMapped: false,
    fog: false,
  });
}

export function glassMat(tint = 0x9fd4ff, opacity = 0.13) {
  return new THREE.MeshPhysicalMaterial({
    color: tint,
    transparent: true,
    opacity,
    roughness: 0.06,
    metalness: 0,
    side: THREE.DoubleSide,
    depthWrite: false,
    envMapIntensity: 1.4,
  });
}

/* ---------------- inverted-hull outline ---------------- */
export const OUTLINE_COLOR = new THREE.Color(0x0a0f1e);

export const outlineMaterial = new THREE.ShaderMaterial({
  uniforms: {
    uThickness: { value: 0.00125 },
    uColor: { value: OUTLINE_COLOR },
  },
  vertexShader: /* glsl */ `
    uniform float uThickness;
    void main() {
      vec4 mv = modelViewMatrix * vec4(position, 1.0);
      vec3 n = normalize(normalMatrix * normal);
      float d = max(0.05, -mv.z);
      mv.xy += n.xy * uThickness * d;
      gl_Position = projectionMatrix * mv;
    }
  `,
  fragmentShader: /* glsl */ `
    uniform vec3 uColor;
    void main() {
      gl_FragColor = vec4(uColor, 1.0);
    }
  `,
  side: THREE.BackSide,
  depthWrite: true,
  transparent: false,
});

/* ---------------- scene-graph helpers ---------------- */
export interface PutOpts {
  pos?: [number, number, number];
  rot?: [number, number, number];
  scale?: [number, number, number];
  outline?: number | boolean;
  cast?: boolean;
  recv?: boolean;
  order?: number;
}

export function put(
  parent: THREE.Object3D,
  geo: THREE.BufferGeometry,
  mat: THREE.Material,
  o: PutOpts = {}
): THREE.Mesh {
  const m = new THREE.Mesh(geo, mat);
  if (o.pos) m.position.set(o.pos[0], o.pos[1], o.pos[2]);
  if (o.rot) m.rotation.set(o.rot[0], o.rot[1], o.rot[2]);
  if (o.scale) m.scale.set(o.scale[0], o.scale[1], o.scale[2]);
  m.castShadow = o.cast ?? false;
  m.receiveShadow = o.recv ?? false;
  if (o.order !== undefined) m.renderOrder = o.order;
  parent.add(m);

  if (o.outline) {
    const twin = new THREE.Mesh(geo, outlineMaterial);
    twin.castShadow = false;
    twin.receiveShadow = false;
    twin.renderOrder = -1;
    if (typeof o.outline === 'number') {
      const mat2 = outlineMaterial.clone();
      mat2.uniforms.uThickness.value = o.outline;
      twin.material = mat2;
    }
    m.add(twin);
  }
  return m;
}

export const BOX = (w: number, h: number, d: number) =>
  new THREE.BoxGeometry(w, h, d);
export const CYL = (
  rt: number,
  rb: number,
  h: number,
  seg = 14,
  open = false
) => new THREE.CylinderGeometry(rt, rb, h, seg, 1, open);
export const PLANE = (w: number, h: number) => new THREE.PlaneGeometry(w, h);

/** Flat decal placed just above a surface. */
export function decal(
  parent: THREE.Object3D,
  w: number,
  d: number,
  mat: THREE.Material,
  x: number,
  y: number,
  z: number,
  rotY = 0
) {
  const m = new THREE.Mesh(PLANE(w, d), mat);
  m.rotation.set(-Math.PI / 2, 0, rotY);
  m.position.set(x, y, z);
  m.receiveShadow = false;
  m.renderOrder = 2;
  parent.add(m);
  return m;
}

/** Clone a material with a new texture repeat (used for tiled surfaces). */
export function withRepeat(
  mat: THREE.Material,
  rx: number,
  ry: number
): THREE.Material {
  const m = (mat as THREE.MeshToonMaterial).clone();
  const src = (mat as THREE.MeshToonMaterial).map;
  if (src) {
    const t = src.clone();
    t.needsUpdate = true;
    t.repeat.set(rx, ry);
    m.map = t;
  }
  return m;
}
