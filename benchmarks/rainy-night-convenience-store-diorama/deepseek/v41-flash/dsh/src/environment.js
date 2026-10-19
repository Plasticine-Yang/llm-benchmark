/**
 * 环境：正方形底座、雨夜街道、人行道、小巷、积水倒影、背景楼群、天空与雾。
 * 湿滑路面的倒影采用「环境立方体探针（CubeCamera）」实现 —— 廉价但足够湿润，
 * 并且能真实反射便利店的暖光与霓虹。
 */
import * as THREE from 'three';
import { BASE, ROAD, WALK, ALLEY, PARKING, STORE, LIGHTS, SUN, PAL } from './config.js';
import { toon, glow, cube, groundPlane, panel, cyl, halo, wetSurface } from './toon.js';
import * as TX from './textures.js';

/* =============================================================== 天空与雾 */
export function buildSky(scene) {
  const uniforms = {
    uTop: { value: new THREE.Color(0x070c18) },
    uMid: { value: new THREE.Color(0x122036) },
    uBot: { value: new THREE.Color(0x2e3d55) },
    uGlow: { value: new THREE.Color(0x8a6446) },
    uGlowPos: { value: new THREE.Vector2(0.62, 0.14) }, // 城市光污染的方位
  };
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(150, 32, 20),
    new THREE.ShaderMaterial({
      uniforms,
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
      vertexShader: /* glsl */`
        varying vec3 vPos;
        void main() { vPos = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: /* glsl */`
        uniform vec3 uTop, uMid, uBot, uGlow;
        uniform vec2 uGlowPos;
        varying vec3 vPos;
        void main() {
          vec3 d = normalize(vPos);
          float h = clamp(d.y * 0.5 + 0.5, 0.0, 1.0);
          vec3 col = mix(uBot, uMid, smoothstep(0.42, 0.62, h));
          col = mix(col, uTop, smoothstep(0.6, 0.95, h));
          // 云层压暗（雨云）
          float cloud = sin(d.x * 6.0 + d.z * 4.0) * 0.5 + 0.5;
          cloud *= sin(d.z * 9.0 - d.x * 3.0) * 0.5 + 0.5;
          col = mix(col, uTop * 1.25, cloud * 0.45 * smoothstep(0.35, 0.8, h));
          // 城市光污染：地平线附近暖色辉光
          float ang = atan(d.z, d.x) / 6.2831853 + 0.5;
          float dist = abs(ang - uGlowPos.x);
          dist = min(dist, 1.0 - dist);
          float glowAmt = exp(-dist * 5.5) * pow(1.0 - abs(d.y), 6.0);
          col += uGlow * glowAmt * 0.9;
          gl_FragColor = vec4(col, 1.0);
        }`,
    }),
  );
  sky.name = 'sky';
  sky.frustumCulled = false;
  scene.add(sky);
  return sky;
}

/* ================================================================= 底座 */
export function buildBase(scene) {
  const g = new THREE.Group();
  g.name = 'base';

  // 底座侧面：微缩模型常见的「层压木/亚克力」切面质感
  const sideMat = toon(0x2b3346, { steps: 3 });
  const sideDark = toon(0x1a2130, { steps: 3 });
  const topMat = toon(0x3b4356, { steps: 4 });
  const slab = new THREE.Mesh(
    new THREE.BoxGeometry(BASE.size, BASE.thickness, BASE.size),
    [sideMat, sideMat, topMat, sideDark, sideDark, sideDark],
  );
  slab.position.y = -BASE.thickness / 2;
  slab.receiveShadow = true;
  g.add(slab);

  // 底座上沿的深色压边：像模型的亚克力边框，把整个场景“收”进方框里
  const rimW = 0.5;
  const rimMat = toon(0x232b3c, { steps: 3 });
  const half = BASE.size / 2;
  [
    { w: BASE.size, d: rimW, x: 0, z: -half + rimW / 2 },
    { w: BASE.size, d: rimW, x: 0, z: half - rimW / 2 },
    { w: rimW, d: BASE.size, x: -half + rimW / 2, z: 0 },
    { w: rimW, d: BASE.size, x: half - rimW / 2, z: 0 },
  ].forEach((e) => g.add(cube({ ...e, h: 0.055, y: 0.004, mat: rimMat, outline: 0.35 })));

  // 顶面细网格（模型刻度感）
  const gridMat = glow(0x7f93b8, { transparent: true, opacity: 0.10, depthWrite: false });
  const grid = new THREE.Group();
  for (let i = -BASE.size / 2; i <= BASE.size / 2; i += BASE.grid) {
    grid.add(groundPlane({ w: BASE.size, d: 0.035, x: 0, y: 0.005, z: i, mat: gridMat }));
    grid.add(groundPlane({ w: 0.035, d: BASE.size, x: i, y: 0.005, z: 0, mat: gridMat }));
  }
  grid.name = 'baseGrid';
  g.add(grid);

  // 底座边缘高光线，强调“摆件”轮廓
  const edgeMat = glow(0x9fb6dd, { transparent: true, opacity: 0.2, depthWrite: false });
  [[0, half], [0, -half], [half, 0], [-half, 0]].forEach(([x, z], i) => {
    const vertical = i >= 2;
    g.add(groundPlane({
      w: vertical ? 0.06 : BASE.size, d: vertical ? BASE.size : 0.06,
      x, z, y: 0.008, mat: edgeMat,
    }));
  });

  scene.add(g);
  return g;
}

/* =============================================================== 路面与铺装 */
export function buildStreets(scene) {
  const g = new THREE.Group();
  g.name = 'streets';

  // 整个底座顶面铺沥青（作为“街区地面”基底）
  const roadMat = wetSurface(0x353d4c, { map: TX.roadTexture(), roughness: 0.24, metalness: 0.4, envIntensity: 0.9 });
  g.add(groundPlane({ w: BASE.size, d: BASE.size, y: 0, mat: roadMat }));

  // ---- 人行道板（含路缘石）
  const walkMat = wetSurface(0x5d6678, { map: TX.sidewalkTexture(), roughness: 0.34, metalness: 0.3, envIntensity: 0.75 });
  const curbMat = toon(PAL.curb, { steps: 5 });
  const addWalk = (x0, x1, z0, z1, y, lips = true) => {
    const w = x1 - x0, d = z1 - z0, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
    const m = cube({ w, h: y, d, x: cx, y: 0, z: cz, mat: walkMat, outline: 0.5 });
    m.receiveShadow = true;
    g.add(m);
    if (!lips) return;
    const lip = 0.22;
    [
      { w, d: lip, x: cx, z: z1 - lip / 2 }, { w, d: lip, x: cx, z: z0 + lip / 2 },
      { w: lip, d, x: x0 + lip / 2, z: cz }, { w: lip, d, x: x1 - lip / 2, z: cz },
    ].forEach((e) => g.add(cube({ ...e, h: y + 0.03, mat: curbMat, outline: 0.35 })));
  };
  addWalk(WALK.south.x0, WALK.south.x1, WALK.south.z0, WALK.south.z1, WALK.south.y);
  addWalk(WALK.west.x0, WALK.west.x1, WALK.west.z0, WALK.west.z1, WALK.west.y);
  addWalk(WALK.alley.x0, WALK.alley.x1, WALK.alley.z0, WALK.alley.z1, WALK.alley.y);

  // ---- 便利店前场（混凝土铺装 + 黄色禁停格），把店铺与街道连起来
  const apronMat = wetSurface(0x4a5262, { map: TX.sidewalkTexture(), roughness: 0.34, metalness: 0.26, envIntensity: 0.7 });
  g.add(groundPlane({ w: 12.6, d: 4.6, x: 0.0, y: ROAD.curbH + 0.001, z: 4.2, mat: apronMat }));
  const hatchMat = glow(0xe8c65a, { transparent: true, opacity: 0.5, depthWrite: false });
  for (let i = 0; i < 7; i++) {
    g.add(groundPlane({ w: 0.16, d: 2.0, x: -5.6 + i * 0.9, y: ROAD.curbH + 0.006, z: 2.2, mat: hatchMat, rotY: 0.6 }));
  }

  // ---- 路面标线
  const lineMat = glow(0xe7edf6, { transparent: true, opacity: 0.78, depthWrite: false });
  const dimLine = glow(0xd6dded, { transparent: true, opacity: 0.45, depthWrite: false });
  const LY = ROAD.laneY;

  for (let x = -BASE.size / 2 + 2; x < BASE.size / 2 - 2; x += 4.4) {
    if (x > -13.0 && x < -6.0) continue; // 路口处断开
    g.add(groundPlane({ w: 3.0, d: 0.16, x: x + 1.5, y: LY, z: 12.0, mat: lineMat }));
  }
  g.add(groundPlane({ w: BASE.size, d: 0.14, x: 0, y: LY, z: 9.35, mat: dimLine }));
  g.add(groundPlane({ w: BASE.size, d: 0.14, x: 0, y: LY, z: 14.75, mat: dimLine }));
  for (let z = -BASE.size / 2 + 2; z < 8.2; z += 4.4) {
    g.add(groundPlane({ w: 0.16, d: 3.0, x: -12.0, y: LY, z: z + 1.5, mat: lineMat }));
  }
  g.add(groundPlane({ w: 0.14, d: BASE.size, x: -9.35, y: LY, z: 0, mat: dimLine }));
  g.add(groundPlane({ w: 0.14, d: BASE.size, x: -14.7, y: LY, z: 0, mat: dimLine }));

  // 停止线
  g.add(groundPlane({ w: 3.4, d: 0.4, x: -4.4, y: LY + 0.002, z: 9.6, mat: lineMat }));
  g.add(groundPlane({ w: 0.4, d: 3.0, x: -9.0, y: LY + 0.002, z: 4.4, mat: lineMat }));

  // ---- 斑马线（反光条）
  const cwMat = wetSurface(0xf2f6fb, {
    map: TX.crosswalkTexture(), transparent: true, opacity: 0.92,
    roughness: 0.22, metalness: 0.3, envIntensity: 1.1,
  });
  g.add(groundPlane({ w: 3.0, d: 6.0, x: -4.4, y: LY + 0.004, z: 12.0, mat: cwMat, renderOrder: 1 }));
  [[-6.4, 10.6], [-2.4, 10.6]].forEach(([x, z]) => {
    const d = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 1.5), lineMat);
    d.rotation.set(-Math.PI / 2, 0, Math.PI / 4);
    d.position.set(x, LY + 0.003, z);
    g.add(d);
  });

  // ---- 排水沟与井盖
  const drainMat = toon(0x59617a, { map: TX.drainTexture(), steps: 3 });
  for (let x = -6.0; x <= 15.0; x += 2.6) {
    g.add(groundPlane({ w: 0.5, d: 0.34, x, y: ROAD.curbH + 0.002, z: 8.55, mat: drainMat }));
  }
  for (let z = -14.0; z <= 8.0; z += 2.6) {
    g.add(groundPlane({ w: 0.34, d: 0.5, x: -8.5, y: ROAD.curbH + 0.002, z, mat: drainMat }));
  }
  const holeMat = toon(0x11151f, { steps: 2 });
  for (let x = -5.0; x <= 15.0; x += 5.2) {
    g.add(panel({ w: 0.44, h: 0.12, x, y: ROAD.curbH - 0.07, z: 8.8 - 0.001, mat: holeMat }));
  }

  const manhole = toon(0x6d7686, { map: TX.manholeTexture(), steps: 4, transparent: true });
  manhole.alphaTest = 0.5;
  g.add(groundPlane({ w: 1.5, d: 1.5, x: 2.6, y: LY + 0.002, z: 11.6, mat: manhole }));
  g.add(groundPlane({ w: 1.2, d: 1.2, x: -11.9, y: LY + 0.002, z: -4.0, mat: manhole }));
  g.add(groundPlane({ w: 1.1, d: 1.1, x: 4.2, y: ROAD.curbH + 0.004, z: 5.4, mat: manhole }));

  scene.add(g);
  return g;
}

/* ================================================================= 积水 */
export function buildPuddles(scene) {
  const g = new THREE.Group();
  g.name = 'puddles';
  const spots = [
    // [x, z, w, d, rotY, seed, y]
    [-4.2, 11.2, 4.4, 2.6, 0.12, 1.4, ROAD.laneY + 0.006],
    [-0.8, 13.4, 3.2, 2.0, -0.2, 2.7, ROAD.laneY + 0.006],
    [4.8, 11.0, 3.6, 2.4, 0.35, 3.1, ROAD.laneY + 0.006],
    [10.2, 12.8, 2.8, 1.9, -0.5, 4.2, ROAD.laneY + 0.006],
    [-11.6, 12.6, 3.0, 2.4, 0.22, 5.5, ROAD.laneY + 0.006],
    [-12.6, -1.4, 2.4, 3.0, -0.15, 6.1, ROAD.laneY + 0.006],
    [-12.0, -8.6, 2.6, 2.6, 0.4, 7.3, ROAD.laneY + 0.006],
    [-3.4, 7.6, 2.6, 1.2, 0.05, 8.4, ROAD.curbH + 0.004],
    [2.6, 7.7, 2.2, 1.1, -0.08, 9.6, ROAD.curbH + 0.004],
    [10.0, 7.8, 2.4, 1.2, 0.1, 10.2, ROAD.curbH + 0.004],
    [-7.7, 2.0, 1.2, 2.6, 0.0, 11.7, ROAD.curbH + 0.004],
    [-7.7, -6.0, 1.2, 2.4, 0.0, 12.3, ROAD.curbH + 0.004],
    [7.4, 3.4, 1.3, 2.2, 0.0, 13.5, ROAD.curbH + 0.004],
    [-0.6, 4.6, 2.0, 1.6, 0.3, 14.8, ROAD.curbH + 0.004],
    [-5.0, 6.0, 1.8, 1.0, 0.1, 15.9, ROAD.curbH + 0.004],
    [1.4, 6.1, 1.6, 0.9, -0.2, 16.4, ROAD.curbH + 0.004],
    [-2.0, 2.9, 3.2, 1.4, 0.0, 17.2, ROAD.curbH + 0.004],
  ];

  const normalMap = TX.waterNormalTexture();
  normalMap.repeat.set(2.2, 2.2);
  const masks = {};
  spots.forEach(([x, z, w, d, rotY, seed, y]) => {
    const key = `m${seed}`;
    if (!masks[key]) masks[key] = TX.puddleMask(seed);
    const mat = new THREE.MeshPhysicalMaterial({
      color: 0x2a3a52,
      metalness: 0.9,
      roughness: 0.07,
      transparent: true,
      opacity: 0.92,
      envMapIntensity: 1.5,
      normalMap,
      normalScale: new THREE.Vector2(0.32, 0.32),
      alphaMap: masks[key],
      depthWrite: false,
      side: THREE.FrontSide,
    });
    const p = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat);
    p.rotation.set(-Math.PI / 2, 0, rotY);
    p.position.set(x, y, z);
    p.renderOrder = 2;
    g.add(p);
  });
  scene.add(g);
  return g;
}

/* ================================================== 雨滴涟漪（积水上的扩散圆环） */
export function buildRippleLayer(scene) {
  const uniforms = {
    uTime: { value: 0 },
    uRipples: { value: null },
    uRippleTex: { value: TX.rippleTexture() },
    uIntensity: { value: 1.0 },
  };
  const mat = new THREE.ShaderMaterial({
    uniforms,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.FrontSide,
    vertexShader: /* glsl */`
      varying vec3 vWorld;
      varying vec2 vUv;
      void main() {
        vUv = uv;
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorld = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }`,
    fragmentShader: /* glsl */`
      uniform float uTime, uIntensity;
      uniform vec4 uRipples[14];
      varying vec3 vWorld;
      varying vec2 vUv;
      void main() {
        float acc = 0.0;
        float acc2 = 0.0;
        for (int i = 0; i < 14; i++) {
          vec4 r = uRipples[i];
          if (r.z < 0.0) continue;
          float dist = distance(vWorld.xz, r.xy);
          float radius = r.z * 1.25;
          float band = smoothstep(0.10, 0.0, abs(dist - radius));
          float wave = sin((dist - radius) * 22.0);
          float life = 1.0 - r.z;
          acc += band * life * 0.85;
          acc2 += band * wave * life * 0.35;
        }
        if (acc < 0.004) discard;
        vec3 col = vec3(0.62, 0.78, 1.0) * acc + vec3(1.0) * acc2;
        gl_FragColor = vec4(col * uIntensity, clamp(acc * 0.9, 0.0, 1.0));
      }`,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(BASE.size, BASE.size), mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = ROAD.laneY + 0.018;
  mesh.renderOrder = 6;
  mesh.name = 'rippleLayer';
  scene.add(mesh);
  return { mesh, uniforms };
}

/* ================================================================ 背景楼群 */
export function buildNeighbors(scene) {
  const g = new THREE.Group();
  g.name = 'neighbors';

  // ---- 便利店北侧：两层商住楼（挡住北面视线，形成街角包裹感）
  g.add(makeBuilding({
    x: 1.6, z: -13.6, w: 13.0, d: 6.6, h: 7.0, floors: 2,
    wallCol: 0x66708a, winCol: 0xffd9a0, litRatio: 0.34,
  }));
  // ---- 小巷东侧：贴着巷子的旧楼
  g.add(makeBuilding({
    x: 12.6, z: -13.6, w: 6.6, d: 6.6, h: 6.2, floors: 2,
    wallCol: 0x5f6a80, winCol: 0xffe6c0, litRatio: 0.24,
  }));
  // ---- 地块西侧：贴着横街的小楼（便利店西侧，隔一条人行道）
  g.add(makeBuilding({
    x: -12.2, z: -8.0, w: 6.4, d: 7.0, h: 5.4, floors: 2,
    wallCol: 0x3f4658, winCol: 0xffe0b0, litRatio: 0.2,
  }));
  // ---- 横街对面（西侧）：两栋沿街楼，压住底座西边
  g.add(makeBuilding({
    x: -19.8, z: 1.6, w: 6.4, d: 12.0, h: 8.6, floors: 3,
    wallCol: 0x4d566c, winCol: 0xfff0c8, litRatio: 0.34,
  }));
  g.add(makeBuilding({
    x: -19.8, z: -9.6, w: 6.4, d: 9.6, h: 6.6, floors: 2,
    wallCol: 0x6b6058, winCol: 0xffd9a0, litRatio: 0.22,
  }));
  // ---- 主路南侧：远处的沿街楼
  g.add(makeBuilding({
    x: 5.0, z: 19.4, w: 15.0, d: 6.0, h: 7.4, floors: 2,
    wallCol: 0x555e72, winCol: 0xffe6c0, litRatio: 0.3,
  }));

  // ---- 远景城市剪影（底座之外的“世界感”）
  const farMat = toon(0x1b2438, { steps: 3 });
  const rnd = mulberry32(20241019);
  const ring = [];
  for (let i = 0; i < 52; i++) {
    const a = (i / 52) * Math.PI * 2 + rnd() * 0.06;
    const r = 40 + rnd() * 30;
    const w = 4 + rnd() * 9, h = 7 + rnd() * 24, d = 4 + rnd() * 9;
    ring.push(cube({ w, h, d, x: Math.cos(a) * r, y: -1.2, z: Math.sin(a) * r, mat: farMat, rotY: -a }));
    const winMat = glow(0xffd9a0, { transparent: true, opacity: 0.5, depthWrite: false });
    for (let k = 0; k < 4; k++) {
      if (rnd() > 0.42) continue;
      ring.push(panel({
        w: 0.7, h: 1.0,
        x: Math.cos(a) * r - Math.sin(a) * (w / 2 + 0.02),
        y: 3 + rnd() * (h - 4),
        z: Math.sin(a) * r + Math.cos(a) * (d / 2 + 0.02),
        mat: winMat, rotY: -a,
      }));
    }
  }
  const farGroup = new THREE.Group();
  farGroup.name = 'skyline';
  ring.forEach((o) => farGroup.add(o));
  g.add(farGroup);

  scene.add(g);
  return g;
}

/** 生成一栋带亮窗的楼（窗户为自发光小块） */
function makeBuilding({ x, z, w, d, h, floors = 2, wallCol = 0x8f9bb2, winCol = 0xffd9a0, litRatio = 0.3, rotY = 0 }) {
  const grp = new THREE.Group();
  grp.position.set(x, 0, z);
  grp.rotation.y = rotY;

  const wallMat = toon(wallCol, { map: TX.buildingTexture(), steps: 5 });
  const body = cube({ w, h, d, x: 0, y: 0, z: 0, mat: wallMat, outline: 0.9 });
  body.castShadow = true;
  body.receiveShadow = true;
  grp.add(body);

  // 女儿墙
  grp.add(cube({ w: w + 0.3, h: 0.35, d: d + 0.3, x: 0, y: h, z: 0, mat: toon(0x6f7889, { steps: 4 }), outline: 0.5 }));
  // 屋顶水箱 / 通风管
  grp.add(cyl({ rTop: 0.5, h: 1.0, x: w * 0.25, y: h + 0.3, z: -d * 0.2, mat: toon(0x7d8698, { steps: 4 }), outline: 0.6 }));
  grp.add(cyl({ rTop: 0.18, h: 0.9, x: -w * 0.3, y: h + 0.3, z: d * 0.25, mat: toon(0x5c6577, { steps: 4 }) }));

  const rnd = mulberry32(Math.floor((Math.abs(x) * 131 + Math.abs(z) * 977 + w * 37) * 100) & 0xffff);
  const rows = Math.max(1, Math.floor((h - 1.4) / 2.4));
  const winH = 1.05, winW = 0.85;
  const litMat = glow(winCol, { transparent: true, opacity: 0.92, depthWrite: false });
  const darkMat = toon(0x222c40, { steps: 2 });
  for (let r = 0; r < rows; r++) {
    const y = 1.9 + r * ((h - 2.4) / Math.max(1, rows));
    for (let i = 0; i < Math.floor(w / 1.5); i++) {
      const wx = -w / 2 + 0.95 + i * 1.5;
      const lit = rnd() < litRatio;
      grp.add(panel({ w: winW, h: winH, x: wx, y, z: d / 2 + 0.012, mat: lit ? litMat : darkMat }));
      grp.add(panel({ w: winW, h: winH, x: wx, y, z: -d / 2 - 0.012, mat: lit ? litMat : darkMat, rotY: Math.PI }));
      grp.add(panel({ w: winW + 0.16, h: 0.07, x: wx, y: y - winH / 2 - 0.06, z: d / 2 + 0.02, mat: toon(0x5b6478, { steps: 3 }) }));
    }
    for (let i = 0; i < Math.floor(d / 2.0); i++) {
      const wz = -d / 2 + 1.0 + i * 2.0;
      const lit = rnd() < litRatio * 0.7;
      grp.add(panel({ w: winW, h: winH, x: w / 2 + 0.012, y, z: wz, mat: lit ? litMat : darkMat, rotY: Math.PI / 2 }));
    }
  }
  return grp;
}

/* -------------------------------------------------------------- 小巷内容 */
export function buildAlley(scene) {
  const g = new THREE.Group();
  g.name = 'alley';
  const { x0, x1, z0, z1 } = ALLEY;

  // 巷内地面（更暗更湿）
  const alleyMat = wetSurface(0x262c3a, { map: TX.roadTexture(), roughness: 0.34, metalness: 0.28, envIntensity: 0.7 });
  g.add(groundPlane({ w: x1 - x0, d: z1 - z0, x: (x0 + x1) / 2, y: ROAD.curbH + 0.005, z: (z0 + z1) / 2, mat: alleyMat }));

  // 巷口上方的过梁 + 门牌
  g.add(cube({ w: x1 - x0 + 0.5, h: 0.5, d: 0.5, x: (x0 + x1) / 2, y: 2.75, z: 6.55, mat: toon(0x555d70, { steps: 4 }), outline: 0.6 }));

  // 巷尾封墙（死巷），带一扇卷帘门
  const brick = toon(0x6a7284, { map: TX.alleyBrickTexture(), steps: 4 });
  g.add(cube({ w: x1 - x0 + 0.4, h: 4.2, d: 0.4, x: (x0 + x1) / 2, y: ROAD.curbH, z: z0 - 0.2, mat: brick, outline: 0.8 }));
  g.add(cube({ w: 1.1, h: 1.7, d: 0.12, x: x0 + 0.75, y: ROAD.curbH, z: z0 + 0.06, mat: toon(0x8f98a9, { steps: 4 }), outline: 0.5 }));

  // 便利店东墙外：管道与防火梯
  const pipeMat = toon(0x59617a, { steps: 3 });
  [[1.4, 0.9], [1.4, 2.4]].forEach(([y, r]) => {
    g.add(cyl({ rTop: 0.1, h: 9.0, x: x0 - 0.2, y, z: -1.8, mat: pipeMat, rotX: Math.PI / 2, anchor: 'center' }));
  });
  const ladderMat = toon(0x4a5262, { steps: 3 });
  for (let i = 0; i < 8; i++) {
    g.add(cube({ w: 1.2, h: 0.06, d: 0.06, x: x0 - 0.5, y: 1.1 + i * 0.32, z: -4.4, mat: ladderMat }));
  }
  g.add(cyl({ rTop: 0.04, h: 2.6, x: x0 - 1.1, y: 1.1, z: -4.4, mat: ladderMat }));
  g.add(cyl({ rTop: 0.04, h: 2.6, x: x0 + 0.1, y: 1.1, z: -4.4, mat: ladderMat }));

  // 堆叠的啤酒箱 / 塑料筐
  const crateMats = [toon(0xc23b3b, { steps: 4 }), toon(0x2f6bb0, { steps: 4 }), toon(0x3f8a52, { steps: 4 })];
  for (let i = 0; i < 6; i++) {
    const cx = x1 - 0.55;
    const cz = -7.4 + i * 0.6;
    g.add(cube({ w: 0.5, h: 0.32, d: 0.54, x: cx, y: ROAD.curbH, z: cz, mat: crateMats[i % 3], outline: 0.5 }));
  }
  // 垃圾袋堆
  const bagMat = toon(0x2a3140, { steps: 3 });
  [[x1 - 0.5, -2.4], [x1 - 0.62, -1.8], [x1 - 0.44, -1.9]].forEach(([x, z], i) => {
    const bag = new THREE.Mesh(new THREE.SphereGeometry(0.3 + i * 0.03, 10, 8), bagMat);
    bag.position.set(x, ROAD.curbH + 0.26, z);
    bag.scale.y = 0.85;
    g.add(bag);
  });

  // 巷口小霓虹招牌 + 暖色小灯
  const neonMat = glow(0xff6fa8, { transparent: true, opacity: 0.95 });
  neonMat.map = TX.neonSignTexture('スナック', '#ff6fa8');
  g.add(panel({ w: 0.9, h: 0.45, x: x0 + 1.1, y: 3.05, z: 6.3, mat: neonMat }));
  const nHalo = halo(0xff6fa8, 2.4, 0.3);
  nHalo.position.set(x0 + 1.1, 3.05, 6.4);
  g.add(nHalo);

  const alleyLampMat = glow(0xffcf8f, { transparent: true, opacity: 0.9 });
  g.add(panel({ w: 0.36, h: 0.14, x: x0 - 0.12, y: 2.6, z: 1.4, mat: alleyLampMat, rotY: -Math.PI / 2 }));
  const al = new THREE.PointLight(0xffb066, 6, 7, 2);
  al.position.set(x0 + 0.6, 2.5, 1.4);
  g.add(al);
  // 巷子深处的冷色小灯（层次感）
  const deepMat = glow(0x8fd6ff, { transparent: true, opacity: 0.75 });
  g.add(panel({ w: 0.3, h: 0.12, x: x0 + 1.5, y: 2.3, z: -6.0, mat: deepMat }));
  const dl = new THREE.PointLight(0x8fd6ff, 4, 6, 2);
  dl.position.set(x0 + 1.2, 2.2, -6.0);
  g.add(dl);

  scene.add(g);
  return g;
}

/* =============================================================== 停车位 */
export function buildParkingLot(scene) {
  const g = new THREE.Group();
  g.name = 'parkingLot';
  const { x0, x1, z0, z1, bays } = PARKING;
  const y = ROAD.curbH + 0.012;

  // 混凝土铺装
  const mat = wetSurface(0x4e5768, { map: TX.sidewalkTexture(), roughness: 0.32, metalness: 0.28, envIntensity: 0.8 });
  g.add(groundPlane({ w: x1 - x0, d: z1 - z0, x: (x0 + x1) / 2, y: y, z: (z0 + z1) / 2, mat }));

  // 车位线
  const lineMat = glow(0xe7edf6, { transparent: true, opacity: 0.72, depthWrite: false });
  const bayH = (z1 - z0) / bays;
  for (let i = 0; i <= bays; i++) {
    g.add(groundPlane({ w: x1 - x0, d: 0.12, x: (x0 + x1) / 2, y: y + 0.004, z: z0 + i * bayH, mat: lineMat }));
  }
  g.add(groundPlane({ w: 0.12, d: z1 - z0, x: x0 + 0.06, y: y + 0.004, z: (z0 + z1) / 2, mat: lineMat }));
  g.add(groundPlane({ w: 0.12, d: z1 - z0, x: x1 - 0.06, y: y + 0.004, z: (z0 + z1) / 2, mat: lineMat }));

  // 车挡（挡车器）
  const stopMat = toon(0xd8dde6, { steps: 4 });
  for (let i = 0; i < bays; i++) {
    g.add(cube({ w: 0.22, h: 0.14, d: 1.2, x: x0 + 0.4, y: y + 0.01, z: z0 + bayH * (i + 0.5), mat: stopMat, outline: 0.35 }));
  }

  // “P” 立牌
  const poleMat = toon(0x8f98a9, { steps: 4 });
  g.add(cyl({ rTop: 0.05, h: 2.3, x: x0 + 0.3, y: y, z: z1 + 0.3, mat: poleMat, seg: 8, outline: 0.4 }));
  const signMat = glow(0xffffff, { map: TX.roadSignTexture('parking'), transparent: true });
  g.add(panel({ w: 0.66, h: 0.66, x: x0 + 0.3, y: y + 2.0, z: z1 + 0.32, mat: signMat }));

  // 停一辆小车（正对便利店西窗）
  const car = makeCar(0x5b7fa8);
  car.position.set(x0 + 2.5, y, z0 + bayH * 2.5);
  car.rotation.y = Math.PI / 2;
  g.add(car);
  // 另一辆空位只留水洼

  scene.add(g);
  return g;
}

/** 低多边形小型车（纯色块 + 明确的轮廓线） */
export function makeCar(color = 0x5b7fa8) {
  const car = new THREE.Group();
  const bodyMat = toon(color, { steps: 4 });
  const glassMat = toon(0x2b3a4e, { steps: 3 });
  car.add(cube({ w: 1.75, h: 0.55, d: 4.0, x: 0, y: 0.32, z: 0, mat: bodyMat, outline: 0.9 }));
  car.add(cube({ w: 1.6, h: 0.5, d: 2.1, x: 0, y: 0.85, z: -0.15, mat: bodyMat, outline: 0.7 }));
  car.add(cube({ w: 1.63, h: 0.4, d: 2.0, x: 0, y: 0.88, z: -0.15, mat: glassMat }));
  [[-0.85, 1.3], [0.85, 1.3], [-0.85, -1.3], [0.85, -1.3]].forEach(([wx, wz]) => {
    const w = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.1, 8, 14), toon(0x1f242e, { steps: 3 }));
    w.rotation.y = Math.PI / 2;
    w.position.set(wx, 0.3, wz);
    car.add(w);
  });
  [[-0.55, 2.0], [0.55, 2.0]].forEach(([lx, lz]) => {
    car.add(cube({ w: 0.34, h: 0.14, d: 0.06, x: lx, y: 0.5, z: lz, mat: glow(0xfff0cf, { transparent: true, opacity: 0.8 }), anchor: 'center' }));
  });
  [[-0.55, -2.0], [0.55, -2.0]].forEach(([lx, lz]) => {
    car.add(cube({ w: 0.34, h: 0.14, d: 0.06, x: lx, y: 0.5, z: lz, mat: glow(0xff5a4d, { transparent: true, opacity: 0.75 }), anchor: 'center' }));
  });
  // 车顶雨水反光
  car.add(cube({ w: 1.5, h: 0.02, d: 1.9, x: 0, y: 1.11, z: -0.15, mat: glow(0xbfd8ff, { transparent: true, opacity: 0.16 }) }));
  return car;
}

/* ---------------------------------------------------------------- 其他道具 */
export function buildWires(scene) {
  const g = new THREE.Group();
  g.name = 'wires';
  const poleMat = toon(0x4b5364, { steps: 4 });
  const wireMat = new THREE.LineBasicMaterial({ color: 0x1b2230, transparent: true, opacity: 0.9 });

  const poles = [
    { x: LIGHTS.pole.x, z: LIGHTS.pole.z, h: 9.6 },     // 街角电线杆
    { x: LIGHTS.pole2.x, z: LIGHTS.pole2.z, h: 9.0 },   // 东侧第二根
    { x: -15.6, z: 7.2, h: 9.2 },                       // 横街街角
    { x: -16.0, z: -9.0, h: 9.0 },                      // 横街西侧
    { x: 9.6, z: -15.6, h: 8.6 },                       // 巷尾方向
  ];

  poles.forEach((p, i) => {
    const pole = cyl({ rTop: 0.16, rBot: 0.22, h: p.h, x: p.x, y: 0, z: p.z, mat: poleMat, seg: 10, outline: 0.8 });
    pole.castShadow = true;
    g.add(pole);
    // 变压器
    if (i < 2) {
      g.add(cyl({ rTop: 0.3, rBot: 0.3, h: 0.7, x: p.x + 0.42, y: p.h - 1.9, z: p.z, mat: toon(0x6b7484, { steps: 4 }), seg: 10, outline: 0.6 }));
      g.add(cyl({ rTop: 0.3, rBot: 0.3, h: 0.7, x: p.x - 0.42, y: p.h - 1.9, z: p.z, mat: toon(0x6b7484, { steps: 4 }), seg: 10, outline: 0.6 }));
    }
    // 横担
    g.add(cube({ w: 1.9, h: 0.1, d: 0.1, x: p.x, y: p.h - 0.7, z: p.z, mat: poleMat, anchor: 'center' }));
    g.add(cube({ w: 1.5, h: 0.1, d: 0.1, x: p.x, y: p.h - 1.2, z: p.z, mat: poleMat, anchor: 'center' }));
    // 绝缘子
    [-0.8, 0, 0.8].forEach((o) => {
      g.add(cyl({ rTop: 0.07, h: 0.22, x: p.x + o, y: p.h - 0.66, z: p.z, mat: toon(0x8b93a4, { steps: 4 }), seg: 8 }));
    });
  });

  // 电线：在电线杆之间画下垂的弧线
  const links = [
    [0, 1], [0, 2], [0, 3], [3, 4], [2, 3],
  ];
  links.forEach(([a, b], li) => {
    const A = poles[a], B = poles[b];
    for (let k = 0; k < 3; k++) {
      const yA = A.h - 0.62 - k * 0.5;
      const yB = B.h - 0.62 - k * 0.5;
      const sag = 0.55 + k * 0.22 + li * 0.05;
      const pts = [];
      for (let t = 0; t <= 14; t++) {
        const u = t / 14;
        pts.push(new THREE.Vector3(
          A.x + (B.x - A.x) * u,
          yA + (yB - yA) * u - Math.sin(u * Math.PI) * sag,
          A.z + (B.z - A.z) * u,
        ));
      }
      const curve = new THREE.CatmullRomCurve3(pts);
      const geo = new THREE.BufferGeometry().setFromPoints(curve.getPoints(20));
      g.add(new THREE.Line(geo, wireMat));
    }
  });
  scene.add(g);
  return g;
}

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export { mulberry32 };
