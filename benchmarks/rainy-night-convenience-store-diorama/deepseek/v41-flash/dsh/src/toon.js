/**
 * 三渲二（Cel / Toon）材质系统
 * ・MeshToonMaterial + 阶梯 gradientMap：干净的色阶分层，无写实高光
 * ・反向外壳描边（inverted hull）：明确的日式动画轮廓线
 * ・共享材质库 + 工具函数：圆角盒、画布贴图平面、发光光斑
 */
import * as THREE from 'three';
import { PAL } from './config.js';

/* ---------------------------------------------------------------- 阶梯色阶 */
let rampTex = null;
export function gradientMap(steps = 5) {
  if (rampTex) return rampTex;
  const data = new Uint8Array(steps);
  for (let i = 0; i < steps; i++) {
    // 偏亮的色阶分布：暗部不完全死黑，符合动画赛璐璐的分层感
    data[i] = Math.round(255 * Math.pow((i + 1) / steps, 0.85) * 0.96 + 12);
  }
  const tex = new THREE.DataTexture(data, steps, 1, THREE.RedFormat);
  tex.minFilter = THREE.NearestFilter;
  tex.magFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  tex.needsUpdate = true;
  rampTex = tex;
  return tex;
}

/* ---------------------------------------------------------------- 基础材质 */
export function toon(color, opt = {}) {
  const { map = null, steps = 5, emissive = 0x000000, emissiveMap = null, emissiveIntensity = 1,
    transparent = false, opacity = 1, side = THREE.FrontSide, fog = true, alphaTest = 0 } = opt;
  const m = new THREE.MeshToonMaterial({
    color,
    map,
    gradientMap: gradientMap(steps),
    emissive,
    emissiveMap,
    emissiveIntensity,
    transparent,
    opacity,
    side,
    fog,
    alphaTest,
  });
  m.userData.isToon = true;
  // 注意：three 的 MeshToonMaterial 不支持 envMap（着色器里没有 USE_ENVMAP 分支），
  // 因此湿地面反射改用独立的 wetSurface()（MeshPhysicalMaterial）实现。
  return m;
}

/** 自发光（灯箱 / 招牌 / 店内灯带）：不受阶梯明暗影响，保持“亮”的平面感 */
export function glow(color, opt = {}) {
  const { map = null, intensity = 1.0, transparent = false, opacity = 1, side = THREE.FrontSide,
    fog = true, depthWrite = true, toneMapped = true } = opt;
  const m = new THREE.MeshBasicMaterial({
    color, map, transparent, opacity, side, fog, depthWrite, toneMapped,
  });
  m.userData.baseColor = new THREE.Color(color);
  m.userData.glowIntensity = intensity;
  m.userData.isGlow = true;
  return m;
}

/**
 * 玻璃：三渲二风格的透明面 —— 以「看得进店内」为第一优先，
 * 只用极淡的蓝调 + 雨痕贴图表达玻璃的存在，避免环境反射把室内糊掉。
 */
export function glass(opt = {}) {
  const { opacity = 0.08, color = 0xdcf0ff, map = null, side = THREE.DoubleSide, blending } = opt;
  const m = new THREE.MeshBasicMaterial({
    color,
    map,
    transparent: true,
    opacity,
    side,
    depthWrite: false,
    blending: blending ?? THREE.NormalBlending,
    fog: true,
  });
  m.userData.isGlass = true;
  return m;
}

/** 玻璃高光条：一条沿玻璃斜向的加色亮带，替代写实高光 */
export function glassHighlight(w, h, opacity = 0.13) {
  const c = document.createElement('canvas');
  c.width = 128; c.height = 128;
  const ctx = c.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, 128, 128);
  g.addColorStop(0.0, 'rgba(255,255,255,0)');
  g.addColorStop(0.42, 'rgba(255,255,255,0)');
  g.addColorStop(0.5, 'rgba(255,255,255,1)');
  g.addColorStop(0.58, 'rgba(255,255,255,0)');
  g.addColorStop(1.0, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.MeshBasicMaterial({
    map: t, transparent: true, opacity, blending: THREE.AdditiveBlending,
    depthWrite: false, side: THREE.DoubleSide, fog: true,
  });
  const mesh = new THREE.Mesh(plane(w, h), m);
  mesh.userData.isGlassHighlight = true;
  return mesh;
}

/* ------------------------------------------------------- 环境反射（湿地倒影） */
export const ENV = { map: null };
const wetRegistry = new Set();

/**
 * 湿润地面材质：三渲二的“平涂色块 + 环境反射”混合。
 * MeshPhysicalMaterial 支持 scene.environment / envMap，可以真实反射便利店的暖光与霓虹，
 * 同时用较高的 roughness 保持色块感，不会变成写实镜面。
 */
export function wetSurface(color, opt = {}) {
  const { map = null, roughness = 0.34, metalness = 0.24, envIntensity = 0.85, transparent = false, opacity = 1 } = opt;
  const m = new THREE.MeshPhysicalMaterial({
    color, map, roughness, metalness,
    transparent, opacity,
    envMapIntensity: envIntensity,
    depthWrite: !transparent,
  });
  m.userData.isWet = true;
  wetRegistry.add(m);
  if (ENV.map) { m.envMap = ENV.map; m.needsUpdate = true; }
  return m;
}

/**
 * 注册环境贴图（PMREM）。在所有 wetSurface 材质创建之后调用一次即可。
 */
export function setEnvironmentMap(tex) {
  ENV.map = tex;
  wetRegistry.forEach((m) => { m.envMap = tex; m.needsUpdate = true; });
}

/* -------------------------------------------------------------- 描边（外壳） */
const outlineMat = new THREE.ShaderMaterial({
  vertexShader: /* glsl */ `
    uniform float uThickness;
    uniform vec2 uSize;
    void main() {
      vec3 p = position;
      vec3 n = normal;
      #ifdef USE_NORMAL_MAP
      #endif
      // 细薄几何（玻璃、招牌、细杆）按屏幕尺寸收缩描边，避免糊成一块
      float bbox = max(uSize.x, uSize.y);
      float scale = clamp(bbox * 0.5, 0.02, 4.0);
      float k = uThickness * scale * 0.05;
      vec4 mv = modelViewMatrix * vec4(p, 1.0);
      vec3 nv = normalize(normalMatrix * n);
      mv.xyz += nv * k * clamp(-mv.z, 0.15, 200.0) * 0.06;
      gl_Position = projectionMatrix * mv;
    }`,
  fragmentShader: /* glsl */ `
    uniform vec3 uColor;
    uniform float uOpacity;
    void main() { gl_FragColor = vec4(uColor, uOpacity); }`,
  uniforms: {
    uThickness: { value: 1.0 },
    uColor: { value: new THREE.Color(PAL.outline) },
    uOpacity: { value: 0.9 },
    uSize: { value: new THREE.Vector2(1, 1) },
  },
  side: THREE.BackSide,
  depthWrite: true,
});

/**
 * 给网格挂上反向外壳描边。
 * @param {THREE.Mesh} mesh 目标网格
 * @param {number} thickness 描边粗细
 * @param {number} opacity 描边不透明度（远景可淡一些）
 */
export function inkOutline(mesh, thickness = 1.0, opacity = 0.9) {
  if (!mesh.geometry) return null;
  const geo = mesh.geometry;
  if (!geo.boundingBox) geo.computeBoundingBox();
  const size = new THREE.Vector3();
  geo.boundingBox.getSize(size);
  const mat = outlineMat.clone();
  mat.uniforms.uThickness.value = thickness;
  mat.uniforms.uOpacity.value = opacity;
  mat.uniforms.uSize.value.set(Math.max(size.x, size.z), size.y);
  const shell = new THREE.Mesh(geo, mat);
  shell.userData.isOutline = true;
  shell.renderOrder = (mesh.renderOrder || 0) - 1;
  shell.frustumCulled = mesh.frustumCulled;
  mesh.add(shell);
  return shell;
}

/* ------------------------------------------------------------------ 几何工具 */
const boxCache = new Map();
/** 共享 BoxGeometry（大量重复构件降低内存与 draw setup 开销） */
export function box(w, h, d) {
  const key = `${w.toFixed(3)}|${h.toFixed(3)}|${d.toFixed(3)}`;
  if (!boxCache.has(key)) boxCache.set(key, new THREE.BoxGeometry(w, h, d));
  return boxCache.get(key);
}

/**
 * 立方体网格：默认以「底部中心」为锚点，便于摆放到地面上。
 * @param {object} o {w,h,d,x,y,z, mat, outline, rotY, anchor}
 */
export function cube(o) {
  const { w, h, d, x = 0, y = 0, z = 0, mat, outline = 0, rotY = 0, rotX = 0, rotZ = 0, anchor = 'bottom', name } = o;
  const m = new THREE.Mesh(box(w, h, d), mat);
  const dy = anchor === 'center' ? 0 : anchor === 'top' ? -h / 2 : h / 2;
  m.position.set(x, y + dy, z);
  m.rotation.set(rotX, rotY, rotZ);
  if (name) m.name = name;
  if (outline) inkOutline(m, outline);
  return m;
}

const planeCache = new Map();
export function plane(w, h) {
  const key = `${w.toFixed(3)}|${h.toFixed(3)}`;
  if (!planeCache.has(key)) planeCache.set(key, new THREE.PlaneGeometry(w, h));
  return planeCache.get(key);
}

/** 竖直平面（默认朝 +Z，即“朝南”） */
export function panel(o) {
  const { w, h, x = 0, y = 0, z = 0, mat, rotY = 0, rotX = 0, rotZ = 0, outline = 0, name } = o;
  const m = new THREE.Mesh(plane(w, h), mat);
  m.position.set(x, y, z);
  m.rotation.set(rotX, rotY, rotZ);
  if (name) m.name = name;
  if (outline) inkOutline(m, outline);
  return m;
}

/** 地面平面（水平，朝 +Y） */
export function groundPlane(o) {
  const { w, d, x = 0, y = 0, z = 0, mat, rotY = 0, name, renderOrder } = o;
  const m = new THREE.Mesh(plane(w, d), mat);
  m.rotation.set(-Math.PI / 2, 0, rotY);
  m.position.set(x, y, z);
  if (name) m.name = name;
  if (renderOrder !== undefined) m.renderOrder = renderOrder;
  return m;
}

/** 圆柱（默认底部锚点） */
export function cyl(o) {
  const { rTop, rBot = rTop, h, x = 0, y = 0, z = 0, mat, seg = 14, outline = 0, rotX = 0, rotY = 0, rotZ = 0, name, anchor = 'bottom' } = o;
  const g = new THREE.CylinderGeometry(rTop, rBot, h, seg, 1, false);
  const m = new THREE.Mesh(g, mat);
  const dy = anchor === 'center' ? 0 : h / 2;
  m.position.set(x, y + dy, z);
  m.rotation.set(rotX, rotY, rotZ);
  if (name) m.name = name;
  if (outline) inkOutline(m, outline);
  return m;
}

/** 球 */
export function sphere(o) {
  const { r, x = 0, y = 0, z = 0, mat, seg = 16, outline = 0, sx = 1, sy = 1, sz = 1, name } = o;
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, seg, Math.max(6, seg / 2)), mat);
  m.position.set(x, y, z);
  m.scale.set(sx, sy, sz);
  if (name) m.name = name;
  if (outline) inkOutline(m, outline);
  return m;
}

/** 圆角盒（用 Box + 圆角倒角替代，简单可靠） */
export function roundedBox(o) {
  const { w, h, d, radius = 0.06, ...rest } = o;
  const g = new THREE.BoxGeometry(w, h, d, 2, 2, 2);
  // 轻度球化边缘：把顶点向包围盒内侧挤压，形成柔和的倒角观感
  const pos = g.attributes.position;
  const half = new THREE.Vector3(w / 2, h / 2, d / 2);
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const inner = new THREE.Vector3(
      Math.sign(v.x) * (half.x - radius),
      Math.sign(v.y) * (half.y - radius),
      Math.sign(v.z) * (half.z - radius),
    );
    const dir = v.clone().sub(inner);
    if (dir.lengthSq() > 1e-8) {
      dir.normalize().multiplyScalar(Math.min(radius, dir.length()));
      v.copy(inner).add(dir);
      pos.setXYZ(i, v.x, v.y, v.z);
    }
  }
  g.computeVertexNormals();
  const m = new THREE.Mesh(g, rest.mat);
  const dy = rest.anchor === 'center' ? 0 : h / 2;
  m.position.set(rest.x || 0, (rest.y || 0) + dy, rest.z || 0);
  m.rotation.set(rest.rotX || 0, rest.rotY || 0, rest.rotZ || 0);
  if (rest.outline) inkOutline(m, rest.outline);
  return m;
}

/* ------------------------------------------------------------------ 光斑辉光 */
let glowTex = null;
export function glowSpriteTexture() {
  if (glowTex) return glowTex;
  const s = 128;
  const c = document.createElement('canvas');
  c.width = c.height = s;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  g.addColorStop(0.0, 'rgba(255,255,255,1)');
  g.addColorStop(0.25, 'rgba(255,255,255,0.55)');
  g.addColorStop(0.55, 'rgba(255,255,255,0.16)');
  g.addColorStop(1.0, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, s, s);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  glowTex = t;
  return t;
}

/** 广告牌式辉光光斑（加色混合，营造霓虹在湿空气中的扩散） */
export function halo(color, size = 1.6, opacity = 0.45) {
  const mat = new THREE.SpriteMaterial({
    map: glowSpriteTexture(),
    color,
    transparent: true,
    opacity,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    fog: true,
  });
  const s = new THREE.Sprite(mat);
  s.scale.set(size, size, 1);
  return s;
}

/* ---------------------------------------------------------------- 材质缓存 */
const matCache = new Map();
export function mat(key, factory) {
  if (!matCache.has(key)) matCache.set(key, factory());
  return matCache.get(key);
}

/** 材质库（全场景共享，保证材质表现统一、干净） */
export const M = {
  get building() { return mat('building', () => toon(PAL.building)); },
  get buildingDark() { return mat('buildingDark', () => toon(PAL.buildingDark)); },
  get buildingWarm() { return mat('buildingWarm', () => toon(PAL.buildingWarm)); },
  get storeWall() { return mat('storeWall', () => toon(PAL.storeWall)); },
  get storeTrim() { return mat('storeTrim', () => toon(PAL.storeTrim)); },
  get storeFloor() { return mat('storeFloor', () => toon(PAL.storeFloor)); },
  get shelf() { return mat('shelf', () => toon(PAL.shelf)); },
  get shelfDark() { return mat('shelfDark', () => toon(0xc3c8d2)); },
  get metal() { return mat('metal', () => toon(PAL.metal)); },
  get metalDark() { return mat('metalDark', () => toon(PAL.metalDark)); },
  get curb() { return mat('curb', () => toon(PAL.curb)); },
  get wood() { return mat('wood', () => toon(PAL.wood)); },
  get concrete() { return mat('concrete', () => toon(0x9aa2b0)); },
  get plasticWhite() { return mat('plasticWhite', () => toon(0xe8ebf0)); },
  get plasticGray() { return mat('plasticGray', () => toon(0x6d7686)); },
  get rubber() { return mat('rubber', () => toon(0x2b3040)); },
  get warmGlow() { return mat('warmGlow', () => glow(0xfff0cf, { intensity: 1 })); },
  get coolGlow() { return mat('coolGlow', () => glow(0xd6f0ff, { intensity: 1 })); },
  get doorGlass() { return mat('doorGlass', () => glass({ opacity: 0.22 })); },
};
