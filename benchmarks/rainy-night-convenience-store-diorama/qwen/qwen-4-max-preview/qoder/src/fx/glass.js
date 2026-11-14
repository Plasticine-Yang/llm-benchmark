import * as THREE from 'three';
import { FOG_COLOR, FOG_DENSITY } from '../core/gfx.js';

const VERT = /* glsl */`
  varying vec2 vUv;
  varying vec3 vWorld;
  varying vec3 vNormalW;
  void main() {
    vUv = uv;
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWorld = wp.xyz;
    vNormalW = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

const FRAG = /* glsl */`
  uniform float uTime;
  uniform vec2 uSize;
  uniform vec3 uTint;
  uniform float uOpacity;
  uniform float uRain;
  uniform float uWarmSide;
  uniform vec3 uFogColor;
  uniform float uFogDensity;
  varying vec2 vUv;
  varying vec3 vWorld;
  varying vec3 vNormalW;

  float h21(vec2 p) {
    p = fract(p * vec2(127.31, 311.7));
    p += dot(p, p + 34.42);
    return fract(p.x * p.y);
  }

  // beads + running trails on the pane
  vec2 drops(vec2 st, float t, float seed) {
    vec2 g = st;
    vec2 id = floor(g);
    vec2 f = fract(g) - 0.5;
    float bead = 0.0, trail = 0.0;
    for (int y = -1; y <= 1; y++) {
      for (int x = -1; x <= 0; x++) {
        vec2 o = vec2(float(x), float(y));
        vec2 cid = id + o + seed;
        float a = h21(cid), b = h21(cid + 11.7);
        float run = step(0.55, b);
        float sp = 0.10 + a * 0.30;
        float ph = fract(t * sp * (0.35 + run) + a * 5.3);
        float dy = mix(0.0, 0.5 - ph * 1.15, run);
        float dx = (a - 0.5) * 0.62 + sin(ph * 9.0 + a * 20.0) * 0.05 * run;
        vec2 d = f - (o + vec2(dx, dy));
        float r = 0.055 + b * 0.045;
        bead += smoothstep(r, r * 0.25, length(d * vec2(1.0, 0.82)));
        float tr = smoothstep(0.030, 0.0, abs(d.x)) *
                   smoothstep(0.0, 0.06, d.y) * (1.0 - smoothstep(0.10, 0.62, d.y)) * run;
        trail += tr * (0.30 + 0.35 * b);
      }
    }
    return vec2(bead, trail);
  }

  void main() {
    vec3 V = normalize(cameraPosition - vWorld);
    vec3 N = normalize(vNormalW);
    float fres = pow(1.0 - abs(dot(V, N)), 3.0);

    vec2 st = vUv * uSize * 3.4;
    vec2 d1 = drops(st, uTime, 0.0);
    vec2 d2 = drops(st * 1.87 + 19.3, uTime * 1.25, 41.0);
    float bead = clamp(d1.x + d2.x * 0.65, 0.0, 1.6);
    float trail = clamp(d1.y + d2.y * 0.5, 0.0, 1.0);
    float water = (bead + trail * 0.55) * uRain;

    vec3 col = uTint * (0.30 + fres * 1.5);
    // warm interior bleeding through the wet pane
    col += vec3(1.0, 0.72, 0.42) * uWarmSide * (0.10 + 0.16 * (1.0 - vUv.y));
    // droplets act as tiny lenses: bright core + specular pin
    col += vec3(0.62, 0.76, 0.98) * water * 0.55;
    col += vec3(1.0) * pow(bead * uRain, 3.0) * 0.55;

    float alpha = uOpacity + fres * 0.30 + water * 0.30;
    alpha = clamp(alpha, 0.0, 0.92);

    float dist = length(cameraPosition - vWorld);
    float fog = 1.0 - exp(-uFogDensity * uFogDensity * dist * dist);
    col = mix(col, uFogColor, clamp(fog, 0.0, 1.0) * 0.85);

    gl_FragColor = vec4(col, alpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

export const glassUniforms = {
  uTime: { value: 0 },
  uRain: { value: 1 },
};

export function makeGlass(w, h, o = {}) {
  const m = new THREE.ShaderMaterial({
    uniforms: {
      uTime: glassUniforms.uTime,
      uRain: glassUniforms.uRain,
      uSize: { value: new THREE.Vector2(w, h) },
      uTint: { value: new THREE.Color(o.tint || '#4a6c96') },
      uOpacity: { value: o.opacity === undefined ? 0.085 : o.opacity },
      uWarmSide: { value: o.warm === undefined ? 1.0 : o.warm },
      uFogColor: { value: FOG_COLOR },
      uFogDensity: { value: FOG_DENSITY },
    },
    vertexShader: VERT,
    fragmentShader: FRAG,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  return m;
}

/** plain interior-facing glass (cooler, no rain) */
export function makeInnerGlass(o = {}) {
  return new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(o.color || '#bfe0f5'),
    transparent: true,
    opacity: o.opacity === undefined ? 0.16 : o.opacity,
    roughness: 0.12,
    metalness: 0,
    transmission: 0,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
}