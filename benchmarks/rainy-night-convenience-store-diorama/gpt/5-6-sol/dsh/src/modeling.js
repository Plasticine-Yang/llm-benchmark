import * as THREE from 'three';
import { C } from './palette.js';

const gradient = new THREE.DataTexture(
  new Uint8Array([
    30, 38, 58, 255,
    90, 105, 125, 255,
    180, 190, 190, 255,
    255, 255, 246, 255,
  ]),
  4,
  1,
  THREE.RGBAFormat,
);
gradient.needsUpdate = true;
gradient.magFilter = THREE.NearestFilter;
gradient.minFilter = THREE.NearestFilter;
gradient.colorSpace = THREE.SRGBColorSpace;

export function toon(color, options = {}) {
  return new THREE.MeshToonMaterial({
    color,
    gradientMap: gradient,
    ...options,
  });
}

export function standard(color, options = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: .72, metalness: .02, ...options });
}

export function glow(color, intensity = 1.7, options = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    emissive: color,
    emissiveIntensity: intensity,
    roughness: .4,
    toneMapped: false,
    ...options,
  });
}

export function glass(color = C.glass, opacity = .26) {
  return new THREE.MeshPhysicalMaterial({
    color,
    transparent: true,
    opacity,
    roughness: .18,
    metalness: 0,
    transmission: .08,
    thickness: .05,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
}

export function outline(mesh, color = C.ink, threshold = 32, opacity = .88) {
  const edges = new THREE.LineSegments(
    new THREE.EdgesGeometry(mesh.geometry, threshold),
    new THREE.LineBasicMaterial({ color, transparent: opacity < 1, opacity }),
  );
  edges.renderOrder = 4;
  mesh.add(edges);
  return mesh;
}

export function box(name, size, position, material, parent, opts = {}) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
  mesh.name = name;
  mesh.position.set(...position);
  if (opts.rotation) mesh.rotation.set(...opts.rotation);
  mesh.castShadow = opts.castShadow ?? true;
  mesh.receiveShadow = opts.receiveShadow ?? true;
  parent?.add(mesh);
  if (opts.outline !== false) outline(mesh, opts.outlineColor ?? C.ink, opts.threshold ?? 32, opts.outlineOpacity ?? .72);
  return mesh;
}

export function cylinder(name, radiusTop, radiusBottom, height, position, material, parent, opts = {}) {
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(radiusTop, radiusBottom, height, opts.segments ?? 12),
    material,
  );
  mesh.name = name;
  mesh.position.set(...position);
  if (opts.rotation) mesh.rotation.set(...opts.rotation);
  mesh.castShadow = opts.castShadow ?? true;
  mesh.receiveShadow = opts.receiveShadow ?? true;
  parent?.add(mesh);
  if (opts.outline !== false) outline(mesh, opts.outlineColor ?? C.ink, opts.threshold ?? 38, opts.outlineOpacity ?? .66);
  return mesh;
}

export function plane(name, size, position, material, parent, opts = {}) {
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(...size), material);
  mesh.name = name;
  mesh.position.set(...position);
  mesh.rotation.set(...(opts.rotation ?? [-Math.PI / 2, 0, 0]));
  mesh.receiveShadow = opts.receiveShadow ?? true;
  mesh.renderOrder = opts.renderOrder ?? 0;
  parent?.add(mesh);
  if (opts.outline) outline(mesh, opts.outlineColor ?? C.ink, 32, opts.outlineOpacity ?? .6);
  return mesh;
}

export function sprite(name, texture, size, position, parent, opts = {}) {
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: opts.transparent ?? true,
    side: THREE.DoubleSide,
    toneMapped: opts.toneMapped ?? true,
    opacity: opts.opacity ?? 1,
    depthWrite: opts.depthWrite ?? true,
  });
  const mesh = plane(name, size, position, material, parent, {
    rotation: opts.rotation ?? [0, 0, 0],
    receiveShadow: false,
    renderOrder: opts.renderOrder ?? 2,
    outline: opts.outline ?? false,
  });
  return mesh;
}

export function group(name, parent, position = [0, 0, 0]) {
  const g = new THREE.Group();
  g.name = name;
  g.position.set(...position);
  parent?.add(g);
  return g;
}

export function tube(name, points, radius, material, parent, opts = {}) {
  const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)));
  const mesh = new THREE.Mesh(
    new THREE.TubeGeometry(curve, opts.segments ?? 30, radius, opts.radialSegments ?? 6, false),
    material,
  );
  mesh.name = name;
  mesh.castShadow = opts.castShadow ?? true;
  parent?.add(mesh);
  if (opts.outline) outline(mesh, C.ink, 35, .55);
  return mesh;
}

export function frameWindow(parent, center, width, height, options = {}) {
  const [x, y, z] = center;
  const frameMat = options.frameMat ?? toon(C.inkSoft);
  const thick = options.thickness ?? .1;
  const depth = options.depth ?? .11;
  box('window-frame-top', [width, thick, depth], [x, y + height / 2, z], frameMat, parent);
  box('window-frame-bottom', [width, thick, depth], [x, y - height / 2, z], frameMat, parent);
  box('window-frame-left', [thick, height, depth], [x - width / 2, y, z], frameMat, parent);
  box('window-frame-right', [thick, height, depth], [x + width / 2, y, z], frameMat, parent);
  if (options.centerBar) box('window-center-bar', [thick * .72, height, depth], [x, y, z], frameMat, parent);
  const pane = plane('rainy-glass', [width - thick, height - thick], [x, y, z + (options.frontOffset ?? .01)], glass(options.glassColor, options.opacity ?? .2), parent, { rotation: [0, 0, 0], renderOrder: 5 });
  return pane;
}

export function makeTextPlane(texture, size, position, parent, options = {}) {
  const material = options.emissive
    ? new THREE.MeshStandardMaterial({ map: texture, emissiveMap: texture, emissive: 0xffffff, emissiveIntensity: options.intensity ?? 1.1, toneMapped: false })
    : new THREE.MeshBasicMaterial({ map: texture, toneMapped: true });
  const mesh = plane(options.name ?? 'printed-sign', size, position, material, parent, {
    rotation: options.rotation ?? [0, 0, 0],
    outline: options.outline ?? true,
    outlineOpacity: .65,
    renderOrder: options.renderOrder ?? 3,
  });
  return mesh;
}

export function setShadowRecursive(object, cast = true, receive = true) {
  object.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = cast;
      child.receiveShadow = receive;
    }
  });
}
