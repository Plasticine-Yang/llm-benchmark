/**
 * 动效系统 —— 让这座微缩模型“活着”，但保持克制。
 * ・持续降雨（自定义 Shader 的拉丝雨滴）
 * ・屋檐滴水 / 落水管滴水（滚动贴图）
 * ・地面积水涟漪（全局共享的涟漪 uniform，被所有积水材质采样）
 * ・招牌 / 灯箱轻微闪烁
 * ・自动门偶尔开合
 * ・雨水沿玻璃滑落
 * ・远处交通信号灯缓慢变化
 * ・湿地面倒影（CubeCamera 环境探针，一次性烘焙 + 动态刷新）
 */
import * as THREE from 'three';
import { BASE, STORE, ROAD, LIGHTS, TIME } from './config.js';
import { glow, groundPlane, panel, toon, halo } from './toon.js';
import * as TX from './textures.js';

/* ================================================================== 降雨 */
export function buildRain(scene) {
  const COUNT = 4200;
  const W = 18, H = 15, D = 18;
  const pos = new Float32Array(COUNT * 3);
  const seed = new Float32Array(COUNT);
  const len = new Float32Array(COUNT);
  for (let i = 0; i < COUNT; i++) {
    pos[i * 3 + 0] = (Math.random() - 0.5) * W;
    pos[i * 3 + 1] = Math.random() * H;
    pos[i * 3 + 2] = (Math.random() - 0.5) * D;
    seed[i] = Math.random() * 100;
    len[i] = 0.55 + Math.random() * 0.9;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
  geo.setAttribute('aLen', new THREE.BufferAttribute(len, 1));
  geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, H / 2, 0), Math.max(W, H, D));

  const uniforms = {
    uTime: { value: 0 },
    uMap: { value: TX.rainStreakTexture() },
    uH: { value: H },
    uSpeed: { value: 17.0 },
    uWind: { value: new THREE.Vector2(0.32, 0.16) },
    uSize: { value: 20.0 },
    uOpacity: { value: 0.72 },
    uColor: { value: new THREE.Color(0xd6e8ff) },
    uFogColor: { value: new THREE.Color(0x0d1626) },
    uFogNear: { value: 16.0 },
    uFogFar: { value: 42.0 },
  };
  const mat = new THREE.ShaderMaterial({
    uniforms,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */`
      attribute float aSeed;
      attribute float aLen;
      uniform float uTime, uH, uSpeed, uSize;
      uniform vec2 uWind;
      varying float vFade;
      varying vec2 vUv;
      void main() {
        vUv = uv;
        vec3 p = position;
        float t = uTime * uSpeed + aSeed * 7.0;
        float y = mod(p.y - t, uH);
        p.y = y;
        p.x += (uH - y) * uWind.x * 0.06 + sin(t * 0.4 + aSeed) * 0.16;
        p.z += (uH - y) * uWind.y * 0.06;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = uSize * aLen / max(-mv.z, 0.6);
        vFade = clamp(1.0 - (y / uH) * 0.35, 0.0, 1.0);
      }`,
    fragmentShader: /* glsl */`
      uniform sampler2D uMap;
      uniform float uOpacity;
      uniform vec3 uColor, uFogColor;
      uniform float uFogNear, uFogFar;
      varying float vFade;
      varying vec2 vUv;
      void main() {
        vec4 tex = texture2D(uMap, vUv);
        float a = tex.a * uOpacity * vFade;
        if (a < 0.006) discard;
        vec3 col = mix(uColor, uFogColor, 0.12);
        gl_FragColor = vec4(col * tex.rgb, a);
      }`,
  });
  const pts = new THREE.Points(geo, mat);
  pts.name = 'rain';
  pts.frustumCulled = false;
  scene.add(pts);

  // 远处雨幕：只在底座之外很远处放薄薄几片，避免糊住近景
  const veilMat = new THREE.MeshBasicMaterial({
    map: TX.rainGlassTexture(), transparent: true, opacity: 0.05,
    blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: true,
  });
  const veils = [];
  [[-30, 8, 0, 26, 14, Math.PI / 2], [30, 8, 0, 26, 14, Math.PI / 2],
   [0, 8, -32, 26, 14, 0], [0, 8, 30, 26, 14, 0]].forEach(([x, y, z, w, h, rotY]) => {
    const v = panel({ w, h, x, y, z, mat: veilMat.clone(), rotY });
    v.renderOrder = 1;
    v.userData.veil = true;
    scene.add(v);
    veils.push(v);
  });

  return {
    points: pts,
    veils,
    update(t, camera) {
      uniforms.uTime.value = t;
      // 雨区跟随相机（吸附网格，避免雨滴随相机“滑动”）
      pts.position.x = Math.round(camera.position.x / 2) * 2;
      pts.position.z = Math.round(camera.position.z / 2) * 2;
      veils.forEach((v, i) => {
        if (v.material.map) v.material.map.offset.y = (t * 0.35 + i * 0.13) % 1;
      });
    },
  };
}

/* ============================================================== 屋檐滴水 */
export function buildDrips(scene) {
  const grp = new THREE.Group();
  grp.name = 'drips';
  const mat = () => {
    const m = new THREE.MeshBasicMaterial({
      map: TX.dripTexture(), transparent: true, opacity: 0.55,
      blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: true,
    });
    m.map = m.map.clone();
    m.map.wrapS = m.map.wrapT = THREE.RepeatWrapping;
    m.map.repeat.set(1, 2.2);
    m.map.needsUpdate = true;
    return m;
  };
  const dropAt = (x, y0, y1, z, rotY = 0, speed = 1.0) => {
    const m = mat();
    const h = y1 - y0;
    const p = panel({ w: 0.16, h, x, y: y0 + h / 2, z, mat: m, rotY });
    p.userData.drip = { speed, phase: Math.random() };
    grp.add(p);
    return p;
  };

  // 雨棚外沿（南面）滴水
  const awY0 = STORE.awningY - 0.36;
  for (let x = -6.6; x <= 6.8; x += 1.25) {
    dropAt(x, ROAD.curbH, awY0, STORE.z1 + 1.28, 0, 0.8 + Math.random() * 0.7);
  }
  // 西侧雨棚滴水
  for (let z = -7.6; z <= 0.8; z += 1.4) {
    dropAt(STORE.x0 - 1.3, ROAD.curbH, awY0, z, Math.PI / 2, 0.8 + Math.random() * 0.6);
  }
  // 落水管（北墙 + 东墙拐角）
  [[STORE.x0 - 0.16, -8.0, 0], [STORE.x1 + 0.16, -8.0, 0], [STORE.x0 - 0.16, 1.4, 0]].forEach(([x, z]) => {
    const pipeMat = toon(0x8f98a9, { steps: 4 });
    const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, STORE.wallH + 0.5, 8), pipeMat);
    pipe.position.set(x, STORE.floorY + (STORE.wallH + 0.5) / 2, z);
    grp.add(pipe);
    dropAt(x, ROAD.curbH, STORE.floorY + 0.3, z, 0, 1.25);
  });

  scene.add(grp);
  return {
    group: grp,
    update(t) {
      grp.children.forEach((c) => {
        const d = c.userData.drip;
        if (!d) return;
        const m = c.material;
        m.map.offset.y = -((t * d.speed + d.phase) % 1) * 1.0;
        m.opacity = 0.32 + 0.3 * Math.abs(Math.sin((t * d.speed + d.phase) * Math.PI * 2));
      });
    },
  };
}

/* =============================================================== 涟漪池 */
export function buildRipples() {
  const MAX = 14;
  const arr = [];
  for (let i = 0; i < MAX; i++) arr.push(new THREE.Vector4(0, 0, -1, Math.random() * 10));
  const ripples = { value: arr, max: MAX };

  const respawn = (v, i) => {
    // 落点集中在便利店周边街道与门口
    const cx = Math.random() < 0.6 ? 2.0 : -3.0;
    const cz = Math.random() < 0.6 ? 6.0 : 11.0;
    v.set(
      cx + (Math.random() - 0.5) * 18,
      cz + (Math.random() - 0.5) * 10,
      -1,
      Math.random() * 100,
    );
  };
  arr.forEach((v, i) => respawn(v, i));

  return {
    value: arr,
    update(dt, t) {
      for (let i = 0; i < arr.length; i++) {
        const v = arr[i];
        if (v.z < 0) {
          if (Math.random() < dt * 2.2) { v.z = 0; }
        } else {
          v.z += dt / (0.75 + (v.w % 1) * 0.8);
          if (v.z >= 1) respawn(v, i);
        }
      }
    },
  };
}

/* ========================================================= 闪烁与信号灯 */
export function buildFlickers(signs) {
  const targets = [];
  // 招牌轻微闪烁（类似旧灯管的电压不稳）
  if (signs.boardMat) {
    signs.boardMat.userData.flicker = { base: 1.0, seed: 0.0, amp: 0.055, speed: 7.3, glitch: 0.02 };
    targets.push(signs.boardMat);
  }
  if (signs.bladeMats) {
    signs.bladeMats.forEach((m, i) => {
      m.userData.flicker = { base: 1.0, seed: i * 2.7, amp: 0.09, speed: 11.0, glitch: 0.045 };
      targets.push(m);
    });
  }
  if (signs.lightbox) {
    signs.lightbox.material.userData.flicker = { base: 1.0, seed: 1.4, amp: 0.07, speed: 9.4, glitch: 0.03 };
    targets.push(signs.lightbox.material);
  }
  return {
    targets,
    update(t) {
      targets.forEach((m) => {
        const f = m.userData.flicker;
        if (!f) return;
        let k = f.base + Math.sin(t * f.speed + f.seed) * f.amp + Math.sin(t * f.speed * 3.1 + f.seed * 2) * f.amp * 0.4;
        // 偶发的短促“打嗝”，像灯管接触不良
        const g = Math.sin(t * 1.7 + f.seed * 5.0);
        if (g > 0.995) k *= 1 - f.glitch * 6;
        m.color.copy(m.userData.baseColor || m.color).multiplyScalar(Math.max(0.6, k));
      });
    },
  };
}

export function buildSignals(propsGroup) {
  const signals = propsGroup.children.filter((c) => c.name === 'signals');
  const state = signals.map((s) => ({ node: s, phase: Math.random() * 12 }));
  const cycle = 12.0;
  return {
    update(t) {
      state.forEach((st) => {
        const s = st.node;
        if (s.userData.pedestrian) {
          // 行人信号：绿灯走 / 红灯停，与车行信号错开
          const local = (t + s.userData.cycle) % cycle;
          const walk = local < 6.0;
          (s.userData.lenses || []).forEach((l, i) => {
            const on = walk ? i === 0 : i === 1;
            const flick = on ? 0.9 + Math.sin(t * (walk ? 2.2 : 9.0) + i) * (walk ? 0.06 : 0.05) : 0;
            l.material.opacity = on ? flick : 0.12;
            l.material.color.copy(l.material.userData.baseColor).multiplyScalar(on ? 1 : 0.16);
          });
          return;
        }
        const local = (t + st.phase) % cycle;
        // 0-6 绿灯, 6-7.5 黄灯, 7.5-12 红灯
        let active = 2;
        if (local < 6.0) active = 2;
        else if (local < 7.5) active = 1;
        else active = 0;
        (s.userData.lenses || []).forEach((l, i) => {
          const on = i === active;
          const flick = on ? 0.92 + Math.sin(t * 9.0 + i) * 0.05 : 0.0;
          l.material.opacity = on ? flick : 0.14;
          l.material.color.copy(l.material.userData.baseColor).multiplyScalar(on ? 1.0 : 0.18);
        });
      });
    },
  };
}

/* ============================================================== 自动门 */
export function buildDoorController(door) {
  const period = TIME.doorPeriod;
  const slide = door.panelW + 0.02;
  let open = 0;
  return {
    get openness() { return open; },
    update(t) {
      const c = ((t % period) + period) % period;
      let target = 0;
      if (c > 3.0 && c < 10.0) target = 1;            // 有人进出的时段
      // 平滑逼近，带一点门机的机械感
      open += (target - open) * 0.09;
      if (Math.abs(target - open) < 0.004) open = target;
      const e = open * open * (3 - 2 * open);
      door.left.position.x = door.closedX - e * slide;
      door.right.position.x = -door.closedX + e * slide;
      // 开门时的轻微机芯抖动
      const jitter = e > 0.02 && e < 0.98 ? Math.sin(t * 42) * 0.004 : 0;
      door.left.position.z = jitter;
      door.right.position.z = -jitter;
    },
  };
}

/* ========================================================== 玻璃雨水流动 */
export function buildGlassRain(storeGroup) {
  const items = [];
  storeGroup.traverse((o) => {
    if (o.userData && o.userData.glassScroll && o.material && o.material.map) {
      items.push(o);
    }
  });
  return {
    update(t) {
      items.forEach((o, i) => {
        const m = o.material;
        if (!m.map) return;
        m.map.offset.y = -((t * 0.055 + i * 0.21) % 1) * 0.9;
        if (m.userData && m.userData.isGlass) {
          m.opacity = 0.12 + 0.05 * Math.sin(t * 0.7 + i);
        }
      });
    },
  };
}

/* ==================================================== 湿地面反射探针 */
/**
 * 用 CubeCamera 从街角高度拍摄一次场景，得到「街景立方体贴图」：
 *  · 原始 cube 贴图交给积水 ShaderMaterial（samplerCube）做实时扰动反射
 *  · 经 PMREM 处理后的版本交给 wetSurface（MeshPhysicalMaterial）作为 envMap
 */
export function buildReflectionProbe(renderer, scene) {
  const rt = new THREE.WebGLCubeRenderTarget(256, {
    generateMipmaps: false,
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    type: THREE.UnsignedByteType,
    colorSpace: THREE.SRGBColorSpace,
  });
  const cubeCam = new THREE.CubeCamera(0.4, 160, rt);
  cubeCam.position.set(0.5, 1.5, 2.8);
  scene.add(cubeCam);

  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileCubemapShader();
  let envMap = null;
  let bakedOnce = false;

  const bake = () => {
    cubeCam.update(renderer, scene);
    if (envMap) envMap.dispose();
    envMap = pmrem.fromCubemap(rt.texture).texture;
    return envMap;
  };

  return {
    cubeCam,
    get envMap() { return envMap; },
    get cubeTexture() { return rt.texture; },
    get baked() { return bakedOnce; },
    bake() { bakedOnce = true; return bake(); },
  };
}

/* ===================================================== 水面倒影光斑 */
export function buildGlowPools(scene, storeGroup) {
  // 招牌 / 灯箱在湿地面上的拉长倒影（简单的加色光斑，配合立方体反射一起使用）
  const grp = new THREE.Group();
  grp.name = 'glowPools';
  const mk = (x, z, w, d, color, opacity, rotY = 0) => {
    const m = glow(color, { transparent: true, opacity, depthWrite: false });
    const p = groundPlane({ w, d, x, y: ROAD.curbH + 0.008, z, mat: m, rotY, renderOrder: 3 });
    p.userData.base = opacity;
    grp.add(p);
    return p;
  };
  // 店门口暖光洒在湿路面
  mk(-2.0, STORE.z1 + 1.6, 6.6, 3.6, 0xffd9a0, 0.17);
  mk(2.8, STORE.z1 + 1.2, 3.6, 2.4, 0xffd9a0, 0.14);
  // 贩卖机的红光
  mk(4.1, STORE.z1 + 1.7, 2.8, 2.2, 0xff6a5a, 0.11);
  // 路灯下的冷白光池
  mk(LIGHTS.streetLamp.x - 0.85, LIGHTS.streetLamp.z + 0.9, 5.4, 4.8, 0xffe6bd, 0.12);
  // 横街侧的招牌倒影（西向招牌）
  mk(STORE.x0 - 2.4, -3.4, 3.2, 5.2, 0x9fd8ff, 0.11);
  // 巷口霓虹
  mk(7.4, 5.4, 1.8, 3.0, 0xff6fa8, 0.12);
  // 冷柜透过西窗的冷白光池
  mk(-8.6, 0.0, 2.4, 4.0, 0xa9dcff, 0.09);

  scene.add(grp);
  return {
    update(t) {
      grp.children.forEach((p, i) => {
        const base = p.userData.base || 0.1;
        p.material.opacity = base * (0.86 + 0.14 * Math.sin(t * 1.4 + i));
      });
    },
  };
}
