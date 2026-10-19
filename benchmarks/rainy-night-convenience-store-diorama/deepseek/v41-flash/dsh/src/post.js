/**
 * 后期处理链（自建，不依赖 UnrealBloomPass —— 后者在部分软件渲染器上会输出全黑）：
 *   场景 → 线性 HDR 缓冲 → 亮部提取 → 多次高斯模糊（半分辨率）→
 *   合成（泛光 + 色调映射 + 赛璐璐调色 + 暗角 + 颗粒）→ sRGB 输出
 * 目标是“动画赛璐璐”的干净画面：灯光溢出柔和，色彩层次清楚，不追求写实电影感。
 */
import * as THREE from 'three';

const QUAD_VERT = /* glsl */`
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;

/* ------------------------------------------------------------ 亮部提取 */
const BrightShader = {
  uniforms: { tDiffuse: { value: null }, uThreshold: { value: 0.72 }, uKnee: { value: 0.35 } },
  vertexShader: QUAD_VERT,
  fragmentShader: /* glsl */`
    uniform sampler2D tDiffuse;
    uniform float uThreshold, uKnee;
    varying vec2 vUv;
    void main() {
      vec3 c = texture2D(tDiffuse, vUv).rgb;
      float l = max(c.r, max(c.g, c.b));
      // 软阈值：亮部平滑过渡，避免泛光边缘出现硬边
      float soft = clamp((l - uThreshold + uKnee) / max(uKnee * 2.0, 1e-4), 0.0, 1.0);
      float w = max(l - uThreshold, 0.0) / max(l, 1e-4) * soft;
      gl_FragColor = vec4(c * w, 1.0);
    }`,
};

/* -------------------------------------------------------------- 高斯模糊 */
const BlurShader = {
  uniforms: { tDiffuse: { value: null }, uDir: { value: new THREE.Vector2(1, 0) }, uTexel: { value: new THREE.Vector2(1 / 512, 1 / 512) } },
  vertexShader: QUAD_VERT,
  fragmentShader: /* glsl */`
    uniform sampler2D tDiffuse;
    uniform vec2 uDir, uTexel;
    varying vec2 vUv;
    void main() {
      vec2 off = uDir * uTexel;
      vec4 sum = texture2D(tDiffuse, vUv) * 0.2270270270;
      sum += texture2D(tDiffuse, vUv + off * 1.3846153846) * 0.3162162162;
      sum += texture2D(tDiffuse, vUv - off * 1.3846153846) * 0.3162162162;
      sum += texture2D(tDiffuse, vUv + off * 3.2307692308) * 0.0702702703;
      sum += texture2D(tDiffuse, vUv - off * 3.2307692308) * 0.0702702703;
      gl_FragColor = sum;
    }`,
};

/* ------------------------------------------------- 合成 + 调色 + sRGB 输出 */
const CompositeShader = {
  uniforms: {
    tScene: { value: null },
    tBloom: { value: null },
    uBloom: { value: 0.95 },
    uExposure: { value: 1.2 },
    uTime: { value: 0 },
    uVignette: { value: 0.42 },
    uGrain: { value: 0.04 },
    uSat: { value: 1.2 },
    uContrast: { value: 1.16 },
    uResolution: { value: new THREE.Vector2(1, 1) },
  },
  vertexShader: QUAD_VERT,
  fragmentShader: /* glsl */`
    uniform sampler2D tScene, tBloom;
    uniform float uBloom, uExposure, uTime, uVignette, uGrain, uSat, uContrast;
    uniform vec2 uResolution;
    varying vec2 vUv;

    // ACES 近似（与 renderer.toneMapping 保持一致的观感）
    vec3 aces(vec3 x) {
      const float a = 2.51, b = 0.03, c = 2.43, d = 0.59, e = 0.14;
      return clamp((x * (a * x + b)) / (x * (c * x + d) + e), 0.0, 1.0);
    }
    float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }

    void main() {
      vec3 scene = texture2D(tScene, vUv).rgb;
      vec3 bloom = texture2D(tBloom, vUv).rgb;

      // 泛光叠加（加色，保持霓虹的“溢出”感）
      vec3 hdr = scene + bloom * uBloom;
      hdr *= uExposure;

      vec3 col = aces(hdr);

      // 暗部偏冷、亮部偏暖 —— 雨夜与店内暖光的分野
      float l = dot(col, vec3(0.299, 0.587, 0.114));
      col = mix(col, col * vec3(0.94, 0.98, 1.08), (1.0 - l) * 0.75);
      col += vec3(0.055, 0.028, -0.008) * pow(max(l, 0.0), 2.2);

      float g = dot(col, vec3(0.299, 0.587, 0.114));
      col = mix(vec3(g), col, uSat);
      col = (col - 0.5) * uContrast + 0.5;

      // 暗角
      vec2 d = vUv - 0.5;
      float vig = smoothstep(0.92, 0.26, length(d) * 1.3);
      col *= mix(1.0, vig, uVignette);

      // 颗粒
      float n = hash(vUv * uResolution * 0.5 + fract(uTime) * 41.0) - 0.5;
      col += n * uGrain * (1.0 - l * 0.55);

      col = max(col, 0.0);
      // linear -> sRGB
      gl_FragColor = vec4(pow(col, vec3(1.0 / 2.2)), 1.0);
    }`,
};

/* ------------------------------------------------------------------ 组装 */
function makeRT(w, h, type) {
  const rt = new THREE.WebGLRenderTarget(Math.max(2, Math.floor(w)), Math.max(2, Math.floor(h)), {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    type,
    depthBuffer: true,
    stencilBuffer: false,
  });
  rt.texture.generateMipmaps = false;
  return rt;
}

export function buildComposer(renderer, scene, camera) {
  const size = renderer.getSize(new THREE.Vector2());
  const pr = Math.min(window.devicePixelRatio, 2);
  const W = Math.floor(size.x * pr), H = Math.floor(size.y * pr);

  const rtScene = makeRT(W, H, THREE.HalfFloatType);
  const rtA = makeRT(W / 2, H / 2, THREE.HalfFloatType);
  const rtB = makeRT(W / 2, H / 2, THREE.HalfFloatType);

  const quadGeo = new THREE.PlaneGeometry(2, 2);
  const quadCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const quadScene = new THREE.Scene();
  const quad = new THREE.Mesh(quadGeo, null);
  quad.frustumCulled = false;
  quadScene.add(quad);

  const brightMat = new THREE.ShaderMaterial(BrightShader);
  const blurMat = new THREE.ShaderMaterial(BlurShader);
  const compMat = new THREE.ShaderMaterial(CompositeShader);

  const render = (mat, target) => {
    quad.material = mat;
    renderer.setRenderTarget(target);
    renderer.render(quadScene, quadCam);
  };

  const api = {
    bloomStrength: 0.95,
    bloomThreshold: 0.72,
    exposure: 1.2,
    setSize(w, h) {
      const pw = Math.floor(w * pr), ph = Math.floor(h * pr);
      rtScene.setSize(pw, ph);
      rtA.setSize(Math.max(2, Math.floor(pw / 2)), Math.max(2, Math.floor(ph / 2)));
      rtB.setSize(Math.max(2, Math.floor(pw / 2)), Math.max(2, Math.floor(ph / 2)));
      compMat.uniforms.uResolution.value.set(pw, ph);
      blurMat.uniforms.uTexel.value.set(1 / (pw / 2), 1 / (ph / 2));
    },
    render(t) {
      // 1) 场景 → HDR 缓冲（线性空间）
      renderer.setRenderTarget(rtScene);
      renderer.clear();
      renderer.render(scene, camera);

      // 2) 亮部提取（半分辨率）
      brightMat.uniforms.tDiffuse.value = rtScene.texture;
      brightMat.uniforms.uThreshold.value = api.bloomThreshold;
      render(brightMat, rtA);

      // 3) 分离高斯模糊：横向 + 纵向，重复两轮扩大半径
      const texel = blurMat.uniforms.uTexel.value;
      for (let i = 0; i < 2; i++) {
        const radius = 1 + i * 1.6;
        blurMat.uniforms.tDiffuse.value = rtA.texture;
        blurMat.uniforms.uDir.value.set(radius, 0);
        render(blurMat, rtB);
        blurMat.uniforms.tDiffuse.value = rtB.texture;
        blurMat.uniforms.uDir.value.set(0, radius);
        render(blurMat, rtA);
      }
      void texel;

      // 4) 合成 → 屏幕
      compMat.uniforms.tScene.value = rtScene.texture;
      compMat.uniforms.tBloom.value = rtA.texture;
      compMat.uniforms.uBloom.value = api.bloomStrength;
      compMat.uniforms.uExposure.value = api.exposure;
      compMat.uniforms.uTime.value = t;
      render(compMat, null);
    },
  };

  api.setSize(size.x, size.y);
  return api;
}
