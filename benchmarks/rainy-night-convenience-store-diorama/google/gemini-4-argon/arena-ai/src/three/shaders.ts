import * as THREE from 'three';

export const LIGHT_SLOTS = 16;

/* =========================================================
   WET GROUND — puddles, rain ripples and smeared neon mirror
   ========================================================= */
export function createWetMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      uTime: { value: 0 },
      uCamXZ: { value: new THREE.Vector2(14, 14) },
      uLights: {
        value: Array.from({ length: LIGHT_SLOTS }, () => new THREE.Vector4()),
      },
      uLightCol: {
        value: Array.from({ length: LIGHT_SLOTS }, () => new THREE.Color(0, 0, 0)),
      },
    },
    vertexShader: /* glsl */ `
      varying vec2 vW;
      void main() {
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vW = wp.xz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: /* glsl */ `
      precision highp float;
      varying vec2 vW;
      uniform float uTime;
      uniform vec2 uCamXZ;
      uniform vec4 uLights[${LIGHT_SLOTS}];
      uniform vec3 uLightCol[${LIGHT_SLOTS}];

      float hash21(vec2 p) {
        p = fract(p * vec2(123.34, 456.21));
        p += dot(p, p + 45.32);
        return fract(p.x * p.y);
      }
      float vnoise(vec2 p) {
        vec2 i = floor(p), f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        float a = hash21(i);
        float b = hash21(i + vec2(1.0, 0.0));
        float c = hash21(i + vec2(0.0, 1.0));
        float d = hash21(i + vec2(1.0, 1.0));
        return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
      }
      float fbm(vec2 p) {
        float s = 0.0, a = 0.5;
        for (int i = 0; i < 4; i++) {
          s += a * vnoise(p);
          p = p * 2.07 + vec2(1.7, 9.2);
          a *= 0.5;
        }
        return s;
      }

      float rippleLayer(vec2 p, float t, float scale, float speed, float thresh) {
        p *= scale;
        vec2 id = floor(p);
        vec2 f = fract(p) - 0.5;
        float acc = 0.0;
        for (int y = -1; y <= 1; y++) {
          for (int x = -1; x <= 1; x++) {
            vec2 o = vec2(float(x), float(y));
            vec2 cid = id + o;
            float h = hash21(cid);
            if (h < thresh) continue;
            float phase = fract(t * speed + h * 3.7);
            vec2 ctr = o + (vec2(hash21(cid + 3.1), hash21(cid + 7.7)) - 0.5) * 0.9;
            float d = length(f - ctr);
            float r = phase * 0.52;
            float dr = (d - r) * 15.0;
            float ring = exp(-dr * dr) * (1.0 - phase);
            acc += ring;
          }
        }
        return acc;
      }

      void main() {
        vec2 p = vW;
        float t = uTime;

        // --- puddle distribution (deeper toward road centre / gutters) ---
        float n = fbm(p * 0.33 + vec2(4.2, 8.1));
        float n2 = fbm(p * 0.9 - vec2(2.0, 5.0));
        float puddle = smoothstep(0.50, 0.70, n * 0.72 + n2 * 0.34);
        float film = 0.34 + puddle * 0.66;      // everywhere is damp

        // --- raindrop ripples ---
        float rA = rippleLayer(p, t, 4.6, 0.85, 0.42);
        float rAx = rippleLayer(p + vec2(0.07, 0.0), t, 4.6, 0.85, 0.42);
        float rAz = rippleLayer(p + vec2(0.0, 0.07), t, 4.6, 0.85, 0.42);
        float rB = rippleLayer(p, t * 0.72, 2.05, 0.55, 0.62);
        float rip = clamp(rA * 0.7 + rB * 0.55, 0.0, 1.4);
        vec2 grad = vec2(rAx - rA, rAz - rA);

        // distorted sample position for wobbling reflections
        vec2 pw = p - grad * 0.62;

        // --- smeared light reflections ---
        vec3 refl = vec3(0.0);
        for (int i = 0; i < ${LIGHT_SLOTS}; i++) {
          vec4 L = uLights[i];
          float inten = L.w;
          if (inten < 0.002) continue;
          vec2 lp = L.xy;
          float rad = max(0.05, L.z);
          vec2 vdir = uCamXZ - lp;
          float vl = length(vdir);
          vdir = vl > 0.001 ? vdir / vl : vec2(0.0, 1.0);
          vec2 q = pw - lp;
          float qpar = dot(q, vdir);
          float qperp = dot(q, vec2(-vdir.y, vdir.x));
          float f = (qperp * qperp) / (rad * rad * 0.085)
                  + (qpar * qpar) / (rad * rad * 2.6);
          float streak = smoothstep(-0.30 * rad, 1.15 * rad, qpar);
          refl += uLightCol[i] * exp(-f) * inten * streak;
        }

        // --- sky sheen on the wet film ---
        vec3 sky = vec3(0.10, 0.15, 0.26) * film * 0.35;

        vec3 ripCol = vec3(0.62, 0.74, 0.92);
        vec3 col = refl * 1.35 + ripCol * rip * 0.30 * film + sky;
        col += vec3(0.012, 0.022, 0.045) * film;

        float reflLuma = dot(refl, vec3(0.33));
        float a = clamp(
          film * 0.46 + rip * 0.16 * film + reflLuma * 1.05,
          0.0,
          0.9
        );
        gl_FragColor = vec4(col, a);
      }
    `,
  });
}

/* =========================================================
   RAIN — GPU-animated streaks, zero CPU cost per frame
   ========================================================= */
export interface RainHole {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  top: number;
}

export function createRain(
  count: number,
  area: number,
  height: number,
  hole?: RainHole
) {
  const pos = new Float32Array(count * 2 * 3);
  const base = new Float32Array(count * 2 * 3);
  const rand = new Float32Array(count * 2);

  for (let i = 0; i < count; i++) {
    const x = (Math.random() - 0.5) * area * 2;
    const z = (Math.random() - 0.5) * area * 2;
    const y = Math.random() * height;
    const r = Math.random();
    for (let v = 0; v < 2; v++) {
      const k = i * 2 + v;
      pos[k * 3] = 0;
      pos[k * 3 + 1] = v; // 0 = head, 1 = tail
      pos[k * 3 + 2] = 0;
      base[k * 3] = x;
      base[k * 3 + 1] = y;
      base[k * 3 + 2] = z;
      rand[k] = r;
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aBase', new THREE.BufferAttribute(base, 3));
  geo.setAttribute('aRand', new THREE.BufferAttribute(rand, 1));
  geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), area * 3);

  const mat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uHeight: { value: height },
      uColor: { value: new THREE.Color(0xa9cdf5) },
      uOpacity: { value: 0.4 },
      uHole: {
        value: new THREE.Vector4(
          hole ? hole.minX : 1e6,
          hole ? hole.maxX : 1e6,
          hole ? hole.minZ : 1e6,
          hole ? hole.maxZ : 1e6
        ),
      },
      uHoleTop: { value: hole ? hole.top : -1.0 },
    },
    vertexShader: /* glsl */ `
      attribute vec3 aBase;
      attribute float aRand;
      uniform float uTime;
      uniform float uHeight;
      uniform vec4 uHole;
      uniform float uHoleTop;
      varying float vA;
      void main() {
        float speed = 11.5 + aRand * 7.5;
        float y = mod(aBase.y - uTime * speed, uHeight);
        float len = 0.42 + aRand * 0.62;
        vec3 p = vec3(
          aBase.x + sin(uTime * 0.5 + aRand * 24.0) * 0.08,
          y,
          aBase.z + cos(uTime * 0.42 + aRand * 17.0) * 0.06
        );
        // never let rain fall inside the roofed shop volume
        float inside = step(uHole.x, p.x) * step(p.x, uHole.y)
                     * step(uHole.z, p.z) * step(p.z, uHole.w)
                     * step(p.y, uHoleTop);
        p.y -= inside * 80.0;

        // wind slant toward -x/+z
        p.y -= position.y * len;
        p.x += position.y * len * 0.16;
        p.z -= position.y * len * 0.06;
        vA = smoothstep(0.0, 1.6, y) * (1.0 - smoothstep(uHeight - 2.2, uHeight, y));
        vA *= (0.45 + aRand * 0.75) * (1.0 - inside);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform float uOpacity;
      varying float vA;
      void main() {
        gl_FragColor = vec4(uColor, vA * uOpacity);
      }
    `,
  });

  const lines = new THREE.LineSegments(geo, mat);
  lines.frustumCulled = false;
  lines.renderOrder = 6;
  return lines;
}

/* =========================================================
   GLASS DRIPS — rain sliding down the storefront windows
   ========================================================= */
export function createGlassDripMaterial(tint: number, lanes: number) {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    uniforms: {
      uTime: { value: 0 },
      uTint: { value: new THREE.Color(tint) },
      uOpacity: { value: 0.85 },
      uLanes: { value: lanes },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      precision highp float;
      varying vec2 vUv;
      uniform float uTime;
      uniform vec3 uTint;
      uniform float uOpacity;
      uniform float uLanes;

      float h11(float n) { return fract(sin(n * 127.1) * 43758.5453); }

      float droplet(float fx, float dy, float w, float head) {
        float lx = (fx - 0.5) / 0.19;
        float lateral = exp(-lx * lx);
        float trail = (1.0 - clamp(dy / w, 0.0, 1.0)) * step(0.0, dy);
        float bd = dy / head;
        float bulb = exp(-bd * bd);
        return lateral * (trail * 0.42 + bulb * 0.9);
      }

      void main() {
        float acc = 0.0;
        float cols = uLanes;
        float lane = floor(vUv.x * cols);
        float fx = fract(vUv.x * cols);

        // three droplets per lane at different speeds / phases
        for (int k = 0; k < 3; k++) {
          float fk = float(k);
          float seed = lane * 7.13 + fk * 3.77;
          float sp = 0.055 + h11(seed) * 0.075;
          float ph = h11(seed + 11.0);
          float sub = (h11(seed + 5.0) - 0.5) * 0.42;
          float headY = fract(ph - uTime * sp) * 1.35 - 0.15;
          float dy = vUv.y - headY;
          float len = 0.18 + h11(seed + 3.0) * 0.34;
          acc += droplet(clamp(fx + sub, 0.0, 1.0), dy, len, 0.014 + h11(seed) * 0.01);
        }

        // static mist of tiny beads
        vec2 gp = vec2(floor(vUv.x * 62.0), floor(vUv.y * 40.0));
        float hh = h11(gp.x * 3.1 + gp.y * 17.7);
        if (hh > 0.86) {
          vec2 gf = vec2(fract(vUv.x * 62.0), fract(vUv.y * 40.0)) - 0.5;
          acc += exp(-dot(gf, gf) * 190.0) * 0.4;
        }

        acc = clamp(acc, 0.0, 1.0);
        gl_FragColor = vec4(uTint, acc * uOpacity * 0.72);
      }
    `,
  });
}

/* =========================================================
   FINAL GRADE — vignette, grain, gentle chromatic aberration
   ========================================================= */
export const GradeShader = {
  uniforms: {
    tDiffuse: { value: null as THREE.Texture | null },
    uTime: { value: 0 },
    uVignette: { value: 1.05 },
    uGrain: { value: 0.045 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    precision highp float;
    uniform sampler2D tDiffuse;
    uniform float uTime;
    uniform float uVignette;
    uniform float uGrain;
    varying vec2 vUv;

    float rnd(vec2 p) {
      return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
    }

    void main() {
      vec2 uv = vUv;
      vec2 c = uv - 0.5;
      float d = length(c);

      // subtle chromatic aberration toward the frame edges
      float ab = 0.0016 + d * 0.0035;
      vec3 col;
      col.r = texture2D(tDiffuse, uv - c * ab).r;
      col.g = texture2D(tDiffuse, uv).g;
      col.b = texture2D(tDiffuse, uv + c * ab).b;

      // cool shadows / warm highlights split tone
      float luma = dot(col, vec3(0.299, 0.587, 0.114));
      col = mix(col, col * vec3(0.92, 0.98, 1.14), (1.0 - luma) * 0.55);
      col = mix(col, col * vec3(1.08, 1.02, 0.94), luma * 0.35);

      // vignette
      float vig = smoothstep(0.92, 0.24, d * uVignette);
      col *= mix(0.55, 1.0, vig);

      // film grain
      float g = rnd(uv * vec2(1024.0, 768.0) + fract(uTime) * 91.7) - 0.5;
      col += g * uGrain;

      gl_FragColor = vec4(col, 1.0);
    }
  `,
};
