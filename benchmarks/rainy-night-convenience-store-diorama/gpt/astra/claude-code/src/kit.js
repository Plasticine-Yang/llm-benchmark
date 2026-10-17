import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const materialCache = new Map();
const gradient = new THREE.DataTexture(new Uint8Array([0, 0, 18, 48, 110, 174, 224, 255]), 8, 1, THREE.RedFormat);
gradient.minFilter = gradient.magFilter = THREE.NearestFilter;
gradient.needsUpdate = true;
const edgeMaterial = new THREE.LineBasicMaterial({ color: '#182637', transparent: true, opacity: 0.36 });
export const C = {
  cream: '#f1e7ce', paper: '#fff3d7', teal: '#3c9b91', darkTeal: '#225560',
  orange: '#ed975e', coral: '#d66a66', ink: '#223243', metal: '#657d89',
  blue: '#517a95', yellow: '#e6b95b', black: '#192730', white: '#dfe9e4',
};
export function material(color, opts = {}) {
  if (color?.isMaterial) return color;
  const key = JSON.stringify([color, opts]);
  if (!materialCache.has(key)) {
    const { emissive, intensity, opacity, standard, roughness, metalness, side, ...rest } = opts;
    const props = { color, ...rest };
    if (emissive) { props.emissive = emissive; props.emissiveIntensity = intensity ?? 1; }
    if (opacity !== undefined) { props.transparent = true; props.opacity = opacity; props.depthWrite = false; }
    if (side) props.side = side;
    materialCache.set(key, standard
      ? new THREE.MeshStandardMaterial({ ...props, roughness: roughness ?? 0.65, metalness: metalness ?? 0.1 })
      : new THREE.MeshToonMaterial({ ...props, gradientMap: gradient }));
  }
  return materialCache.get(key);
}
export function group(parent, pos = [0, 0, 0], rot = [0, 0, 0]) {
  const g = new THREE.Group(); g.position.set(...pos); g.rotation.set(...rot); parent.add(g); return g;
}
export function mesh(parent, geometry, pos, color, opts = {}) {
  const { outline = false, rotation, shadow = true, ...matOpts } = opts;
  const m = new THREE.Mesh(geometry, material(color, matOpts));
  m.position.set(...pos); if (rotation) m.rotation.set(...rotation);
  m.castShadow = shadow && !m.material.transparent;
  m.receiveShadow = !m.material.transparent;
  parent.add(m);
  if (outline) {
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geometry, 25), edgeMaterial);
    m.add(edges);
  }
  return m;
}
export function box(parent, pos, size, color, opts = {}) {
  const { bevel = 0, ...other } = opts;
  const geo = bevel > 0
    ? new RoundedBoxGeometry(...size, 1, bevel)
    : new THREE.BoxGeometry(...size);
  return mesh(parent, geo, pos, color, other);
}
export function cylinder(parent, pos, rt, rb, height, color, opts = {}) {
  const { segments = 12, ...other } = opts;
  return mesh(parent, new THREE.CylinderGeometry(rt, rb, height, segments), pos, color, other);
}
export function sphere(parent, pos, radius, color, opts = {}) {
  return mesh(parent, new THREE.SphereGeometry(radius, 12, 8), pos, color, opts);
}
export function torus(parent, pos, radius, thickness, color, opts = {}) {
  return mesh(parent, new THREE.TorusGeometry(radius, thickness, 6, 28), pos, color, opts);
}
export function rod(parent, a, b, radius, color, opts = {}) {
  const va = new THREE.Vector3(...a), vb = new THREE.Vector3(...b);
  const r = cylinder(parent, va.clone().add(vb).multiplyScalar(0.5).toArray(), radius, radius, va.distanceTo(vb), color, opts);
  r.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), vb.sub(va).normalize());
  return r;
}
export function tube(parent, points, radius, color, opts = {}) {
  const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)));
  return mesh(parent, new THREE.TubeGeometry(curve, Math.max(16, points.length * 6), radius, 6, false), [0, 0, 0], color, opts);
}
export function canvasTexture(width, height, draw) {
  const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
  draw(canvas.getContext('2d'), width, height);
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4; return texture;
}
export function plane(parent, pos, size, mat, rotation = [0, 0, 0]) {
  return mesh(parent, new THREE.PlaneGeometry(...size), pos, mat, { rotation, shadow: false });
}
export function label(parent, text, pos, size, opts = {}) {
  const { bg = C.cream, color = C.ink, font = '700', vertical = false, rotation = [0,0,0], emissive = 0, border = null } = opts;
  const width = 1024, height = Math.max(96, Math.round(1024 * size[1] / size[0]));
  const tex = canvasTexture(width, height, (ctx, w, h) => {
    ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
    if (border) { ctx.strokeStyle = border; ctx.lineWidth = h * 0.035; ctx.strokeRect(8, 8, w - 16, h - 16); }
    ctx.fillStyle = color; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const lines = text.split('\n');
    const maxSize = Math.min(h * 0.65 / lines.length, w / Math.max(...lines.map(l => l.length)) * 1.5);
    ctx.font = `${font} ${maxSize}px "Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif`;
    lines.forEach((line, i) => ctx.fillText(line, w / 2, h / 2 + (i - (lines.length - 1) / 2) * maxSize * 1.4, w * .9));
  });
  const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: .8, emissiveMap: tex, emissive: '#ffffff', emissiveIntensity: emissive, side: THREE.DoubleSide });
  return plane(parent, pos, size, mat, rotation);
}
export function polygon(parent, points, depth, color, pos = [0,0,0], opts = {}) {
  const shape = new THREE.Shape(); points.forEach(([x, y], i) => i ? shape.lineTo(x,y) : shape.moveTo(x,y)); shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false });
  return mesh(parent, geo, pos, color, opts);
}
export function glowTexture() {
  return canvasTexture(128, 128, (ctx, w, h) => {
    const grad = ctx.createRadialGradient(w/2, h/2, 0, w/2, h/2, w/2);
    grad.addColorStop(0, 'rgba(255,255,255,0.9)'); grad.addColorStop(.18, 'rgba(255,255,255,0.35)'); grad.addColorStop(.5, 'rgba(255,255,255,0.08)'); grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad; ctx.fillRect(0,0,w,h);
  });
}
const haloTex = glowTexture();
export function halo(parent, pos, color, scale = 1, opacity = .2) {
  const m = new THREE.SpriteMaterial({ map: haloTex, color, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending });
  const s = new THREE.Sprite(m); s.position.set(...pos); s.scale.set(scale,scale,scale); parent.add(s); return s;
}
export function light(parent, pos, color, intensity, distance = 6) {
  const l = new THREE.PointLight(color, intensity, distance, 2); l.position.set(...pos); parent.add(l); return l;
}
export function rng(seed = 47) {
  return () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
}

// Flatten static solids into material batches; animated doors and weather remain independent.
export function batchStatic(root) {
  root.updateMatrixWorld(true);
  const batches = new Map(), edgeGeometries = [], remove = [];
  root.traverse(obj => {
    if (!obj.isMesh && !obj.isLineSegments) return;
    let p = obj;
    while (p && p !== root.parent) { if (p.userData.dynamic) return; p = p.parent; }
    if (obj.isMesh && (obj.material.transparent || obj.material.map || obj.material.isShaderMaterial)) return;
    const geom = obj.geometry.clone(); geom.applyMatrix4(obj.matrixWorld);
    if (obj.isLineSegments) { edgeGeometries.push(geom); remove.push(obj); return; }
    const key = `${obj.material.uuid}_${obj.castShadow}_${obj.receiveShadow}`;
    if (!batches.has(key)) batches.set(key, { material: obj.material, geometries: [], cast: obj.castShadow, receive: obj.receiveShadow });
    // Standardize to the attributes shared by all procedural geometries.
    for (const attribute of Object.keys(geom.attributes)) if (!['position','normal','uv'].includes(attribute)) geom.deleteAttribute(attribute);
    batches.get(key).geometries.push(geom.index ? geom.toNonIndexed() : geom); remove.push(obj);
  });
  // Keep children such as textured labels and glass in their original world transforms.
  for (const obj of remove) {
    for (const child of [...obj.children]) {
      if (!remove.includes(child)) root.attach(child);
    }
  }
  remove.forEach(obj => obj.removeFromParent());
  for (const batch of batches.values()) {
    const geometry = mergeGeometries(batch.geometries, false);
    if (!geometry) continue;
    const m = new THREE.Mesh(geometry, batch.material); m.castShadow = batch.cast; m.receiveShadow = batch.receive; root.add(m);
    batch.geometries.forEach(g => g.dispose());
  }
  if (edgeGeometries.length) {
    const lines = new THREE.LineSegments(mergeGeometries(edgeGeometries.map(g => g.index ? g.toNonIndexed() : g), false), edgeMaterial);
    root.add(lines); edgeGeometries.forEach(g => g.dispose());
  }
}
