import * as THREE from 'three';
import { gradientMap } from './util.js';

/** Uniforms shared by many custom materials. */
export const shared = {
  uTime: { value: 0 },
  tReflect: { value: null },
  uMirrorMatrix: { value: new THREE.Matrix4() },
  tWet: { value: null },
};

const NOISE = /* glsl */ `
float h21(vec2 p){ p = fract(p*vec2(123.34,456.21)); p += dot(p, p+45.32); return fract(p.x*p.y); }
vec3 rippleCell(vec2 p, float t){
  vec2 id = floor(p);
  vec2 f = fract(p) - 0.5;
  float h = h21(id);
  vec2 o = (vec2(h21(id+3.1), h21(id+7.7)) - 0.5) * 0.45;
  float sp = 0.7 + 0.6*h;
  float tt = t*sp + h*10.0;
  float ph = fract(tt);
  float alive = step(0.35, h21(id + floor(tt)*1.37));
  vec2 d = f - o;
  float L = length(d);
  float r = ph*0.42;
  float x = (L - r) / 0.045;
  float fade = (1.0-ph)*(1.0-ph)*alive;
  float e = exp(-x*x);
  float ring = e * fade;
  float slope = -2.0*x*e*fade;
  vec2 n = L > 1e-4 ? d / L * slope : vec2(0.0);
  return vec3(n, ring);
}
`;

/**
 * Toon material for wet ground: darkens with wetness, adds rain ripples and a
 * planar reflection (sharp inside puddles, vertically smeared elsewhere – the classic anime wet asphalt look).
 */
export function wetToon(map, o = {}) {
  const m = new THREE.MeshToonMaterial({ color: o.color ?? 0xffffff, map, gradientMap: gradientMap() });
  const own = {
    uWetBase: { value: o.wet ?? 0.35 },
    uGlint: { value: o.glint ?? 0 },
    uReflBoost: { value: o.refl ?? 1 },
  };
  m.userData.wet = own;
  m.onBeforeCompile = (s) => {
    Object.assign(s.uniforms, own, {
      uTime: shared.uTime,
      tReflect: shared.tReflect,
      uMirrorMatrix: shared.uMirrorMatrix,
      tWet: shared.tWet,
    });
    s.vertexShader = s.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vWPos;')
      .replace('#include <project_vertex>', '#include <project_vertex>\nvWPos = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    s.fragmentShader = s.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
         varying vec3 vWPos;
         uniform float uTime; uniform sampler2D tReflect; uniform mat4 uMirrorMatrix; uniform sampler2D tWet;
         uniform float uWetBase; uniform float uGlint; uniform float uReflBoost;
         ${NOISE}`
      )
      .replace(
        '#include <map_fragment>',
        `#include <map_fragment>
         vec4 wm = texture2D(tWet, (vWPos.xz + 7.0) / 14.0);
         float dry = wm.g;
         float puddle = smoothstep(0.47, 0.53, wm.r) * (1.0 - dry);
         float wetB = uWetBase * (1.0 - dry);
         vec3 rp = rippleCell(vWPos.xz*3.2, uTime) + rippleCell(vWPos.xz*4.6 + 17.0, uTime*1.17 + 0.5);
         rp *= (1.0 - dry);
         float paint = smoothstep(0.55, 0.75, dot(diffuseColor.rgb, vec3(0.333)));
         diffuseColor.rgb *= mix(1.0, 0.42, puddle) * (1.0 - 0.3*wetB);`
      )
      .replace(
        '#include <opaque_fragment>',
        `#include <opaque_fragment>
         {
           vec4 pr = uMirrorMatrix * vec4(vWPos, 1.0);
           vec2 ruv = pr.xy / pr.w;
           vec2 dist = rp.xy * 0.03 * (0.35 + puddle);
           vec3 V = normalize(cameraPosition - vWPos);
           float cosT = clamp(V.y, 0.0, 1.0);
           float fres = 0.32 + 0.68 * pow(1.0 - cosT, 2.5);
           vec3 sharp = texture2D(tReflect, ruv + dist).rgb;
           vec3 blur = vec3(0.0);
           for (int i = 0; i < 6; i++) {
             float k = float(i) / 5.0;
             blur += texture2D(tReflect, ruv + dist + vec2((h21(vWPos.xz*40.0)-0.5)*0.004, (k - 0.25) * 0.075)).rgb;
           }
           blur /= 6.0;
           vec3 refl = mix(blur, sharp, puddle);
           float amt = mix(wetB * 0.6, 1.0, puddle) * fres * uReflBoost;
           gl_FragColor.rgb = mix(gl_FragColor.rgb, gl_FragColor.rgb * 0.75, puddle * 0.4) + refl * amt;
           gl_FragColor.rgb += vec3(0.55, 0.68, 0.9) * rp.z * (0.05 + 0.35 * puddle);
           if (uGlint > 0.0) {
             vec2 gc = floor(vWPos.xz * 55.0);
             float g = step(0.982, h21(gc + floor(uTime * 2.0 + h21(gc) * 7.0)));
             gl_FragColor.rgb += vec3(0.9, 0.95, 1.0) * g * paint * uGlint * (0.6 + 0.6 * fres);
           }
         }`
      );
  };
  m.customProgramCacheKey = () => 'wetToon';
  return m;
}

/** Glass with procedurally sliding raindrops. */
export function glassMat(o = {}) {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    uniforms: {
      uTime: shared.uTime,
      uTint: { value: new THREE.Color(o.tint ?? 0xbfe6ff) },
      uAlpha: { value: o.alpha ?? 0.1 },
      uDrops: { value: o.drops ?? 1 },
      uTop: { value: o.top ?? 2.5 },
    },
    vertexShader: /* glsl */ `
      varying vec3 vW; varying vec3 vN;
      void main(){
        vec4 w = modelMatrix * vec4(position, 1.0);
        vW = w.xyz;
        vN = normalize(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * viewMatrix * w;
      }`,
    fragmentShader: /* glsl */ `
      uniform float uTime; uniform vec3 uTint; uniform float uAlpha; uniform float uDrops; uniform float uTop;
      varying vec3 vW; varying vec3 vN;
      float h21(vec2 p){ p = fract(p*vec2(123.34,456.21)); p += dot(p, p+45.32); return fract(p.x*p.y); }
      void main(){
        float u = abs(vN.z) > abs(vN.x) ? vW.x : vW.z;
        float v = vW.y;
        // static beads
        vec2 g = vec2(u, v) * 26.0;
        vec2 id = floor(g);
        vec2 f = fract(g) - 0.5;
        float h = h21(id);
        vec2 o = (vec2(h21(id + 7.1), h21(id + 3.3)) - 0.5) * 0.5;
        float r = 0.1 + 0.16 * h21(id + 1.7);
        float bead = h > 0.62 ? smoothstep(r, r * 0.45, length(f - o)) : 0.0;
        // running drops
        float colW = 0.085;
        float cx = floor(u / colW);
        float cf = fract(u / colW) - 0.5;
        float s = h21(vec2(cx, 9.1));
        float isOn = step(0.45, s);
        float speed = 0.18 + 0.55 * h21(vec2(cx, 2.3));
        float H = uTop + 0.6;
        float cyc = uTime * speed / H + s * 7.0;
        float head = uTop - fract(cyc) * H;
        float dy = v - head;
        float wob = sin(v * 9.0 + s * 20.0) * 0.18 + sin(v * 23.0 + s * 3.0) * 0.06;
        float dx = cf - (s - 0.5) * 0.5 - wob;
        float headM = smoothstep(0.36, 0.18, length(vec2(dx, dy / colW * 0.55)));
        float trail = step(0.0, dy) * smoothstep(0.7, 0.0, dy) * smoothstep(0.12, 0.03, abs(dx));
        float tb = fract(dy * 14.0);
        trail *= 0.45 + 0.55 * smoothstep(0.5, 0.2, abs(tb - 0.5));
        float m = max(bead * 0.75, isOn * max(headM, trail * 0.55)) * uDrops;
        vec3 col = uTint + m * vec3(0.75, 0.88, 1.0) * 0.9;
        float a = uAlpha + m * 0.32;
        gl_FragColor = vec4(col, a);
      }`,
  });
}
