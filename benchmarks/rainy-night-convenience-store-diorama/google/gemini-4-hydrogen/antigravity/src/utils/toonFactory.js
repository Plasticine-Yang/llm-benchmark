import * as THREE from 'three';

// Shared screen resolution uniform updated on window resize
export const sharedOutlineResolution = new THREE.Vector2(
  typeof window !== 'undefined' ? window.innerWidth : 1280,
  typeof window !== 'undefined' ? window.innerHeight : 720
);

// Cache stepped gradient textures & smooth-normal geometries
const gradientCache = new Map();
const smoothGeometryCache = new WeakMap();
const outlineMaterialCache = new Map();

/**
 * Generates a crisp anime cel-shading gradient DataTexture with narrow
 * anti-aliased transitions so surfaces keep clean 2D bands without aliasing shimmer.
 */
export function createToonGradient(bands = [0.30, 0.66, 1.0], thresholds = [0.35, 0.70]) {
  const key = `${bands.join(',')}|${thresholds.join(',')}`;
  if (gradientCache.has(key)) return gradientCache.get(key);

  const width = 128;
  const data = new Uint8Array(width * 4);
  const edgeWidth = 0.025;

  for (let i = 0; i < width; i++) {
    const t = i / (width - 1);
    let val = bands[0];
    for (let b = 0; b < thresholds.length; b++) {
      const th = thresholds[b];
      const nextVal = bands[b + 1];
      const s = THREE.MathUtils.smoothstep(t, th - edgeWidth, th + edgeWidth);
      val = THREE.MathUtils.lerp(val, nextVal, s);
    }
    const c = Math.round(THREE.MathUtils.clamp(val, 0, 1) * 255);
    const idx = i * 4;
    data[idx] = c;
    data[idx + 1] = c;
    data[idx + 2] = c;
    data[idx + 3] = 255;
  }

  const tex = new THREE.DataTexture(data, width, 1, THREE.RGBAFormat);
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.generateMipmaps = false;
  tex.needsUpdate = true;
  gradientCache.set(key, tex);
  return tex;
}

/**
 * Creates an anime cel-shaded MeshToonMaterial enhanced with cool indigo
 * shadow hue-shifting, Fresnel rim lighting, and optional wet cel-specular.
 */
export function createCelMaterial({
  color = 0xffffff,
  map = null,
  emissive = 0x000000,
  emissiveMap = null,
  emissiveIntensity = 1.0,
  transparent = false,
  opacity = 1.0,
  side = THREE.FrontSide,
  gradientBands = [0.30, 0.66, 1.0],
  gradientThresholds = [0.34, 0.69],
  rimColor = 0x7cb8ff,
  rimStrength = 0.28,
  shadowTint = 0x26315c,
  shadowTintStrength = 0.42,
  wetness = 0.0,
  depthWrite = true,
  polygonOffset = false,
  polygonOffsetFactor = 0,
  polygonOffsetUnits = 0,
} = {}) {
  const material = new THREE.MeshToonMaterial({
    color,
    map,
    emissive,
    emissiveMap,
    emissiveIntensity,
    transparent,
    opacity,
    side,
    depthWrite,
    polygonOffset,
    polygonOffsetFactor,
    polygonOffsetUnits,
    gradientMap: createToonGradient(gradientBands, gradientThresholds),
  });

  material.userData.celUniforms = {
    uRimColor: { value: new THREE.Color(rimColor) },
    uRimStrength: { value: rimStrength },
    uShadowTint: { value: new THREE.Color(shadowTint) },
    uShadowTintStrength: { value: shadowTintStrength },
    uWetness: { value: wetness },
  };

  material.customProgramCacheKey = () => 'anime-cel-v1';
  material.onBeforeCompile = (shader) => {
    const u = material.userData.celUniforms;
    shader.uniforms.uRimColor = u.uRimColor;
    shader.uniforms.uRimStrength = u.uRimStrength;
    shader.uniforms.uShadowTint = u.uShadowTint;
    shader.uniforms.uShadowTintStrength = u.uShadowTintStrength;
    shader.uniforms.uWetness = u.uWetness;

    shader.fragmentShader = shader.fragmentShader
      .replace(
        'void main() {',
        `uniform vec3 uRimColor;
uniform float uRimStrength;
uniform vec3 uShadowTint;
uniform float uShadowTintStrength;
uniform float uWetness;
void main() {`
      )
      .replace(
        'vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;',
        `vec3 baseLit = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
        float litLum = dot(baseLit, vec3(0.299, 0.587, 0.114));
        float shadowFactor = 1.0 - smoothstep(0.06, 0.36, litLum);
        vec3 tintedLit = mix(baseLit, max(baseLit, diffuseColor.rgb * uShadowTint * 0.92), shadowFactor * uShadowTintStrength);

        vec3 celViewDir = normalize(geometryViewDir);
        float fresnel = 1.0 - max(dot(normalize(geometryNormal), celViewDir), 0.0);
        float rimStep = smoothstep(0.60, 0.74, fresnel);
        vec3 rimLight = uRimColor * rimStep * uRimStrength * (0.35 + 0.65 * clamp(litLum * 1.5, 0.0, 1.0));

        vec3 wetHalf = normalize(vec3(0.22, 0.88, 0.42) + celViewDir);
        float wetSpec = smoothstep(0.86, 0.90, pow(max(dot(normalize(geometryNormal), wetHalf), 0.0), 16.0));
        vec3 wetGlow = vec3(0.76, 0.90, 1.0) * wetSpec * uWetness * 0.48;

        vec3 outgoingLight = tintedLit + rimLight + wetGlow + totalEmissiveRadiance;`
      );
  };

  return material;
}

/**
 * Computes angle-weighted smoothed normals across shared vertex positions and
 * stores them in `aSmoothNormal` so inverted-hull outlines stay watertight at sharp corners.
 */
export function createSmoothNormalGeometry(sourceGeom) {
  if (smoothGeometryCache.has(sourceGeom)) {
    return smoothGeometryCache.get(sourceGeom);
  }

  const geom = sourceGeom.clone();
  const posAttr = geom.getAttribute('position');
  const count = posAttr.count;
  const indexAttr = geom.getIndex();

  const accumMap = new Map();
  const vA = new THREE.Vector3();
  const vB = new THREE.Vector3();
  const vC = new THREE.Vector3();
  const ab = new THREE.Vector3();
  const ac = new THREE.Vector3();
  const bc = new THREE.Vector3();
  const ba = new THREE.Vector3();
  const ca = new THREE.Vector3();
  const cb = new THREE.Vector3();
  const faceNormal = new THREE.Vector3();

  const keyFor = (i) => {
    const x = Math.round(posAttr.getX(i) * 10000);
    const y = Math.round(posAttr.getY(i) * 10000);
    const z = Math.round(posAttr.getZ(i) * 10000);
    return `${x},${y},${z}`;
  };

  const addNormal = (idx, weight) => {
    const k = keyFor(idx);
    let vec = accumMap.get(k);
    if (!vec) {
      vec = new THREE.Vector3();
      accumMap.set(k, vec);
    }
    vec.addScaledVector(faceNormal, weight);
  };

  const triCount = indexAttr ? indexAttr.count / 3 : count / 3;
  for (let t = 0; t < triCount; t++) {
    const iA = indexAttr ? indexAttr.getX(t * 3) : t * 3;
    const iB = indexAttr ? indexAttr.getX(t * 3 + 1) : t * 3 + 1;
    const iC = indexAttr ? indexAttr.getX(t * 3 + 2) : t * 3 + 2;

    vA.fromBufferAttribute(posAttr, iA);
    vB.fromBufferAttribute(posAttr, iB);
    vC.fromBufferAttribute(posAttr, iC);

    ab.subVectors(vB, vA);
    ac.subVectors(vC, vA);
    faceNormal.crossVectors(ab, ac);
    if (faceNormal.lengthSq() < 1e-12) continue;
    faceNormal.normalize();

    // Angle weights at each corner ensure equal contribution on boxes of any aspect ratio
    ba.copy(ab).negate();
    bc.subVectors(vC, vB);
    ca.copy(ac).negate();
    cb.copy(bc).negate();

    const angA = Math.acos(THREE.MathUtils.clamp(ab.clone().normalize().dot(ac.clone().normalize()), -1, 1));
    const angB = Math.acos(THREE.MathUtils.clamp(ba.normalize().dot(bc.normalize()), -1, 1));
    const angC = Math.acos(THREE.MathUtils.clamp(ca.normalize().dot(cb.normalize()), -1, 1));

    addNormal(iA, angA);
    addNormal(iB, angB);
    addNormal(iC, angC);
  }

  const smoothArray = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const vec = accumMap.get(keyFor(i));
    if (vec && vec.lengthSq() > 1e-10) {
      const n = vec.clone().normalize();
      smoothArray[i * 3] = n.x;
      smoothArray[i * 3 + 1] = n.y;
      smoothArray[i * 3 + 2] = n.z;
    } else {
      const normAttr = geom.getAttribute('normal');
      smoothArray[i * 3] = normAttr ? normAttr.getX(i) : 0;
      smoothArray[i * 3 + 1] = normAttr ? normAttr.getY(i) : 1;
      smoothArray[i * 3 + 2] = normAttr ? normAttr.getZ(i) : 0;
    }
  }

  geom.setAttribute('aSmoothNormal', new THREE.BufferAttribute(smoothArray, 3));
  smoothGeometryCache.set(sourceGeom, geom);
  return geom;
}

function getOutlineMaterial(thickness = 1.65, color = 0x13172c) {
  const key = `${thickness.toFixed(2)}|${color}`;
  if (outlineMaterialCache.has(key)) return outlineMaterialCache.get(key);

  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uThickness: { value: thickness },
      uColor: { value: new THREE.Color(color) },
      uResolution: { value: sharedOutlineResolution },
    },
    vertexShader: `
      attribute vec3 aSmoothNormal;
      uniform float uThickness;
      uniform vec2 uResolution;
      void main() {
        vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
        vec4 clipPos = projectionMatrix * mvPos;
        vec3 viewNormal = normalize(normalMatrix * aSmoothNormal);
        vec2 clipNormal = (projectionMatrix * vec4(viewNormal, 0.0)).xy;
        float len = length(clipNormal);
        vec2 dir = len > 1e-5 ? (clipNormal / len) : vec2(0.0);
        float distScale = clamp(12.5 / max(clipPos.w, 1.0), 0.55, 1.45);
        clipPos.xy += dir * uThickness * distScale * (2.0 * clipPos.w / uResolution);
        gl_Position = clipPos;
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      void main() {
        gl_FragColor = vec4(uColor, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
    side: THREE.BackSide,
    depthWrite: true,
  });

  outlineMaterialCache.set(key, mat);
  return mat;
}

/**
 * Attaches a watertight inverted-hull ink outline mesh as a child of `mesh`.
 */
export function addOutline(mesh, thickness = 1.65, color = 0x13172c) {
  const smoothGeom = createSmoothNormalGeometry(mesh.geometry);
  const outlineMat = getOutlineMaterial(thickness, color);
  const outlineMesh = new THREE.Mesh(smoothGeom, outlineMat);
  outlineMesh.castShadow = false;
  outlineMesh.receiveShadow = false;
  outlineMesh.renderOrder = -1;
  mesh.add(outlineMesh);
  return outlineMesh;
}

/**
 * Attaches clean architectural crease ink lines for panel seams, frames, and edges.
 */
export function addCreaseLines(mesh, thresholdAngle = 32, color = 0x171c36, opacity = 0.65) {
  const edges = new THREE.EdgesGeometry(mesh.geometry, thresholdAngle);
  const lineMat = new THREE.LineBasicMaterial({
    color,
    transparent: opacity < 1,
    opacity,
  });
  const lines = new THREE.LineSegments(edges, lineMat);
  lines.castShadow = false;
  lines.receiveShadow = false;
  mesh.add(lines);
  return lines;
}

/**
 * Convenience helper to create a cel-shaded mesh with shadow flags and optional outline/creases.
 */
export function createCelMesh(
  geometry,
  materialOptions,
  {
    outline = true,
    outlineThickness = 1.6,
    outlineColor = 0x13172c,
    crease = false,
    creaseAngle = 32,
    creaseOpacity = 0.58,
    castShadow = true,
    receiveShadow = true,
  } = {}
) {
  const mat = materialOptions?.isMaterial ? materialOptions : createCelMaterial(materialOptions);
  const mesh = new THREE.Mesh(geometry, mat);
  mesh.castShadow = castShadow;
  mesh.receiveShadow = receiveShadow;
  if (outline) {
    addOutline(mesh, outlineThickness, outlineColor);
  }
  if (crease) {
    addCreaseLines(mesh, creaseAngle, outlineColor, creaseOpacity);
  }
  return mesh;
}

/**
 * Draws a crisp procedural CanvasTexture for Japanese signage, labels, road markings,
 * magazines, posters, vending displays, and interior textures.
 */
export function createCanvasTexture(width, height, drawFn, { srgb = true, repeat = null, anisotropy = 8 } = {}) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  drawFn(ctx, width, height);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  tex.anisotropy = anisotropy;
  if (repeat) {
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(repeat[0], repeat[1]);
  }
  tex.needsUpdate = true;
  return tex;
}
