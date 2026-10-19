/**
 * 街角道具：自动贩卖机、自行车、雨伞架、垃圾桶、路灯、路牌、
 * 护栏、空调外机、海报栏、配电箱、消火栓、停车位、共享单车……
 * 全部围绕便利店门口与街角排布，形成紧凑、有层次的微缩景观。
 */
import * as THREE from 'three';
import { LIGHTS, ROAD, WALK, STORE } from './config.js';
import { toon, glow, cube, panel, groundPlane, cyl, sphere, halo, wetSurface } from './toon.js';
import { makeCar } from './environment.js';
import * as TX from './textures.js';
import { mulberry32 } from './environment.js';

const FLOOR = STORE.floorY;

export function buildProps(scene) {
  const g = new THREE.Group();
  g.name = 'props';

  buildVendingMachines(g);
  buildBicycles(g);
  buildUmbrellaStand(g);
  buildBins(g);
  buildStreetLamp(g);
  buildRoadSigns(g);
  buildGuardrail(g);
  buildParking(g);
  buildACUnits(g);
  buildBulletinBoard(g);
  buildUtilityBox(g);
  buildScooter(g);
  buildTrees(g);
  buildNeonRow(g);

  scene.add(g);
  return g;
}

/* ============================================================ 自动贩卖机 */
function buildVendingMachines(g) {
  const grp = new THREE.Group();
  grp.name = 'vending';

  const mk = (x, z, rotY, hue, drinkRows = 4) => {
    const m = new THREE.Group();
    m.position.set(x, ROAD.curbH, z);
    m.rotation.y = rotY;
    const W = 1.15, H = 1.92, D = 0.75;
    const bodyMat = toon(0xe6eaf1, { steps: 5 });

    // 机体
    m.add(cube({ w: W, h: H, d: D, x: 0, y: 0, z: 0, mat: bodyMat, outline: 0.9 }));
    // 侧面品牌色带
    m.add(cube({ w: W + 0.02, h: 0.5, d: D + 0.02, x: 0, y: 0.05, z: 0, mat: toon(hue, { steps: 4 }), outline: 0.4 }));
    // 正面玻璃橱窗
    const faceMat = glow(0xf4fbff, { transparent: true, opacity: 0.92 });
    m.add(panel({ w: W - 0.16, h: H - 0.62, x: 0, y: 0.62, z: D / 2 + 0.011, mat: faceMat }));
    // 商品（一排排彩色罐子）
    const cols = [0xe8636f, 0x59a8e0, 0xf0c04a, 0x6fc48c, 0xf2f2f0, 0x9a7de0];
    for (let r = 0; r < drinkRows; r++) {
      for (let i = 0; i < 5; i++) {
        m.add(cyl({
          rTop: 0.052, h: 0.16,
          x: -W / 2 + 0.22 + i * 0.18, y: 0.72 + r * 0.28, z: D / 2 - 0.12,
          mat: toon(cols[(r * 5 + i) % cols.length], { steps: 4 }), seg: 8,
        }));
      }
      m.add(cube({ w: W - 0.2, h: 0.03, d: 0.16, x: 0, y: 0.88 + r * 0.28, z: D / 2 - 0.12, mat: toon(0xc9cfd9, { steps: 3 }) }));
    }
    // 顶灯箱
    const headMat = glow(0xffffff, { transparent: true, opacity: 0.95 });
    headMat.map = TX.posterTexture(1);
    m.add(panel({ w: W - 0.1, h: 0.42, x: 0, y: H - 0.3, z: D / 2 + 0.012, mat: headMat }));
    // 投币口 / 按钮面板
    m.add(cube({ w: 0.3, h: 0.5, d: 0.06, x: -W / 2 + 0.3, y: 0.72, z: D / 2 + 0.03, mat: toon(0x4b5262, { steps: 4 }), outline: 0.35 }));
    m.add(cube({ w: 0.1, h: 0.03, d: 0.02, x: -W / 2 + 0.3, y: 0.86, z: D / 2 + 0.07, mat: glow(0x8fe0ff, { transparent: true }) }));
    // 取物口
    m.add(cube({ w: 0.44, h: 0.3, d: 0.05, x: W / 2 - 0.32, y: 0.28, z: D / 2 + 0.02, mat: toon(0x22283a, { steps: 3 }) }));
    // 底部出风口
    m.add(cube({ w: W - 0.2, h: 0.1, d: 0.03, x: 0, y: 0.04, z: D / 2 + 0.02, mat: toon(0x5b6478, { steps: 3 }) }));

    // 溢出的光
    const vh = halo(hue, 3.0, 0.28);
    vh.position.set(0, 1.0, D / 2 + 0.3);
    m.add(vh);
    const pl = new THREE.PointLight(hue, 7, 4.2, 2);
    pl.position.set(0, 1.2, D / 2 + 0.4);
    m.add(pl);
    grp.add(m);
    return m;
  };

  // 两台并排靠在便利店南墙东段（门口右侧，正对街角）
  mk(3.45, STORE.z1 + 0.52, 0, 0xd8342b, 4);
  mk(4.72, STORE.z1 + 0.52, 0, 0x1f7fd8, 4);
  // 巷口内侧一台（旧机型，冷色调）
  mk(7.9, 5.2, -Math.PI / 2, 0x2f8f6a, 3);
  return grp;
}

/* ================================================================ 自行车 */
function buildBicycles(g) {
  const grp = new THREE.Group();
  grp.name = 'bicycles';
  const frameMat = toon(0x3f6fa8, { steps: 4 });
  const tireMat = toon(0x22262f, { steps: 3 });
  const rimMat = toon(0xc6ccd6, { steps: 4 });
  const basketMat = toon(0x9aa3b4, { steps: 4 });
  const seatMat = toon(0x2b3040, { steps: 3 });

  const mkBike = (x, z, rotY, colMat) => {
    const b = new THREE.Group();
    b.position.set(x, ROAD.curbH, z);
    b.rotation.y = rotY;
    const fm = colMat || frameMat;

    // 轮子
    const wheel = (wx) => {
      const w = new THREE.Mesh(new THREE.TorusGeometry(0.33, 0.035, 8, 22), tireMat);
      w.rotation.y = Math.PI / 2;
      w.position.set(wx, 0.34, 0);
      b.add(w);
      const rim = new THREE.Mesh(new THREE.TorusGeometry(0.29, 0.014, 6, 20), rimMat);
      rim.rotation.y = Math.PI / 2;
      rim.position.set(wx, 0.34, 0);
      b.add(rim);
      for (let i = 0; i < 6; i++) {
        const sp = cyl({ rTop: 0.006, h: 0.56, x: wx, y: 0.34, z: 0, mat: rimMat, seg: 4, anchor: 'center' });
        sp.rotation.set(0, Math.PI / 2, (i * Math.PI) / 6);
        b.add(sp);
      }
      const hub = cyl({ rTop: 0.04, h: 0.08, x: wx, y: 0.34, z: 0, mat: rimMat, seg: 8, anchor: 'center', rotZ: Math.PI / 2 });
      b.add(hub);
    };
    wheel(-0.52);
    wheel(0.52);

    // 车架（几根斜梁）
    const tube = (x1, y1, x2, y2, r = 0.028) => {
      const dx = x2 - x1, dy = y2 - y1;
      const len = Math.hypot(dx, dy);
      const t = cyl({ rTop: r, h: len, x: (x1 + x2) / 2, y: (y1 + y2) / 2, z: 0, mat: fm, seg: 6, anchor: 'center' });
      t.rotation.z = Math.atan2(dy, dx) - Math.PI / 2;
      b.add(t);
    };
    tube(-0.52, 0.34, -0.1, 0.78);      // 后下叉到座管
    tube(-0.1, 0.78, 0.42, 0.62);       // 上管
    tube(-0.1, 0.34, -0.1, 0.78);       // 座管
    tube(-0.1, 0.34, 0.42, 0.62);       // 下管
    tube(0.42, 0.62, 0.52, 0.34);       // 前叉
    tube(0.42, 0.62, 0.42, 0.92);       // 头管
    tube(-0.1, 0.78, -0.16, 0.88);      // 座管上端

    // 车把
    const bar = cyl({ rTop: 0.018, h: 0.5, x: 0.44, y: 0.94, z: 0, mat: toon(0x2b3040, { steps: 3 }), seg: 6, anchor: 'center' });
    bar.rotation.x = Math.PI / 2;
    b.add(bar);
    // 车座
    b.add(cube({ w: 0.26, h: 0.06, d: 0.14, x: -0.16, y: 0.9, z: 0, mat: seatMat, anchor: 'center', outline: 0.35 }));
    // 车筐
    b.add(cube({ w: 0.32, h: 0.24, d: 0.28, x: 0.46, y: 0.78, z: 0, mat: basketMat, anchor: 'center', outline: 0.4 }));
    // 挡泥板
    const fender = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.02, 6, 16, Math.PI * 0.7), fm);
    fender.rotation.set(0, Math.PI / 2, -0.3);
    fender.position.set(-0.52, 0.36, 0);
    b.add(fender);
    // 脚撑
    b.add(cyl({ rTop: 0.012, h: 0.32, x: -0.2, y: 0, z: 0.1, mat: rimMat, seg: 5, rotX: 0.25 }));
    // 反光片
    b.add(cube({ w: 0.05, h: 0.05, d: 0.02, x: -0.56, y: 0.5, z: 0, mat: glow(0xff5a4d, { transparent: true }), anchor: 'center' }));

    grp.add(b);
    return b;
  };

  // 门口左侧的自行车停放区（靠雨棚外沿）
  mkBike(-4.9, STORE.z1 + 1.2, 0.1, toon(0x3f6fa8, { steps: 4 }));
  mkBike(-3.7, STORE.z1 + 1.45, -0.05, toon(0x9a4b6b, { steps: 4 }));
  mkBike(-5.9, STORE.z1 + 1.55, 0.2, toon(0x8a8f4b, { steps: 4 }));
  // 一辆斜靠在电线杆旁
  const b3 = mkBike(LIGHTS.pole.x + 0.8, LIGHTS.pole.z + 0.25, 1.35, toon(0x4f8a5e, { steps: 4 }));
  b3.rotation.z = 0.06;
  return grp;
}

/* ============================================================== 雨伞架 */
function buildUmbrellaStand(g) {
  const grp = new THREE.Group();
  grp.name = 'umbrellaStand';
  const x = STORE.doorX + 1.35, z = STORE.z1 + 0.72;
  const frameMat = toon(0xb9c1cf, { steps: 4 });
  // 伞桶
  grp.add(cyl({ rTop: 0.24, rBot: 0.2, h: 0.72, x, y: ROAD.curbH, z, mat: frameMat, seg: 14, outline: 0.6 }));
  grp.add(cyl({ rTop: 0.26, rBot: 0.26, h: 0.05, x, y: ROAD.curbH + 0.72, z, mat: toon(0xd8dde6, { steps: 4 }), seg: 14 }));
  // 伞（几把彩色长柄伞）
  const cols = [0xe8636f, 0x59a8e0, 0xf0c04a, 0x6fc48c];
  cols.forEach((c, i) => {
    const a = (i / cols.length) * Math.PI * 2 + 0.4;
    const ux = x + Math.cos(a) * 0.08, uz = z + Math.sin(a) * 0.08;
    const h = 1.0 + (i % 2) * 0.08;
    grp.add(cyl({ rTop: 0.028, h, x: ux, y: ROAD.curbH + 0.3, z: uz, mat: toon(c, { steps: 4 }), seg: 8, rotX: Math.sin(a) * 0.12, rotZ: -Math.cos(a) * 0.12, outline: 0.4 }));
    // 伞尖
    grp.add(cyl({ rTop: 0.004, h: 0.16, x: ux, y: ROAD.curbH + 0.3 + h, z: uz, mat: toon(0x9aa3b4, { steps: 3 }), seg: 6 }));
  });
  // 一把撑开晾着的伞（靠在墙上）
  const open = new THREE.Group();
  const canopy = new THREE.Mesh(new THREE.ConeGeometry(0.52, 0.34, 8, 1, true), toon(0x2f5f8f, { steps: 4, side: THREE.DoubleSide }));
  canopy.position.y = 0.9;
  open.add(canopy);
  open.add(cyl({ rTop: 0.018, h: 0.9, x: 0, y: 0.45, z: 0, mat: toon(0x9aa3b4, { steps: 3 }), seg: 6 }));
  open.position.set(STORE.x0 + 0.3, ROAD.curbH, STORE.z1 + 1.05);
  open.rotation.z = 0.12;
  grp.add(open);
  return grp;
}

/* =============================================================== 垃圾桶 */
function buildBins(g) {
  const grp = new THREE.Group();
  grp.name = 'bins';
  const x = STORE.doorX + 2.55, z = STORE.z1 + 0.7;
  const bodyMat = toon(0x6d7686, { steps: 4 });
  const lidMat = toon(0x4a5262, { steps: 4 });
  // 三分类垃圾桶
  const labels = [0xe8636f, 0x59a8e0, 0x6fc48c];
  labels.forEach((c, i) => {
    const bx = x + i * 0.44;
    grp.add(cube({ w: 0.4, h: 0.72, d: 0.4, x: bx, y: ROAD.curbH, z, mat: bodyMat, outline: 0.55 }));
    grp.add(cube({ w: 0.44, h: 0.08, d: 0.44, x: bx, y: ROAD.curbH + 0.72, z, mat: lidMat, outline: 0.4 }));
    // 投入口
    grp.add(cyl({ rTop: 0.09, h: 0.03, x: bx, y: ROAD.curbH + 0.8, z: z - 0.06, mat: toon(0x1a1f2b, { steps: 3 }), seg: 10 }));
    // 分类色标
    grp.add(panel({ w: 0.3, h: 0.16, x: bx, y: ROAD.curbH + 0.5, z: z + 0.205, mat: glow(c, { transparent: true, opacity: 0.9 }) }));
  });
  // 一个装满的塑料袋放在旁边
  const bag = sphere({ r: 0.24, x: x - 0.5, y: ROAD.curbH + 0.22, z: z + 0.16, mat: toon(0x333c4e, { steps: 3 }), sx: 1, sy: 0.9, sz: 1 });
  grp.add(bag);
  return grp;
}

/* ================================================================ 路灯 */
function buildStreetLamp(g) {
  const grp = new THREE.Group();
  grp.name = 'streetLamp';
  const { x, z } = LIGHTS.streetLamp;
  const poleMat = toon(0x7d8698, { steps: 4 });
  const H = 5.4;
  grp.add(cyl({ rTop: 0.09, rBot: 0.13, h: H, x, y: ROAD.curbH, z, mat: poleMat, seg: 12, outline: 0.7 }));
  grp.add(cyl({ rTop: 0.2, h: 0.16, x, y: ROAD.curbH, z, mat: toon(0x59617a, { steps: 4 }), seg: 12 }));
  // 弯臂
  const arm = new THREE.Group();
  const a1 = cyl({ rTop: 0.06, h: 0.9, x: 0, y: 0, z: 0, mat: poleMat, seg: 8, rotZ: Math.PI / 2 - 0.25, anchor: 'center' });
  a1.position.set(-0.4, H - 0.1, 0);
  arm.add(a1);
  arm.position.set(x, ROAD.curbH, z);
  grp.add(arm);
  // 灯头
  const lampX = x - 0.85, lampY = ROAD.curbH + H + 0.12;
  grp.add(cube({ w: 0.62, h: 0.14, d: 0.36, x: lampX, y: lampY, z, mat: toon(0xd8dde6, { steps: 4 }), outline: 0.5 }));
  const bulbMat = glow(0xfff0cf, { transparent: true, opacity: 0.98 });
  grp.add(groundPlane({ w: 0.5, d: 0.28, x: lampX, y: lampY - 0.02, z, mat: bulbMat, renderOrder: 4 }));
  // 灯光
  const pl = new THREE.PointLight(0xffd9a0, 62, 21, 2);
  pl.position.set(lampX, lampY - 0.2, z);
  pl.castShadow = false;
  grp.add(pl);
  // 灯下光锥（体积感）
  const coneMat = new THREE.MeshBasicMaterial({
    color: 0xffe2b0, transparent: true, opacity: 0.055,
    blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: true,
  });
  const cone = new THREE.Mesh(new THREE.ConeGeometry(2.6, 5.6, 20, 1, true), coneMat);
  cone.position.set(lampX, lampY - 2.9, z);
  grp.add(cone);
  // 灯杆上的小旗 / 广告牌
  grp.add(panel({ w: 0.34, h: 0.9, x: x + 0.12, y: ROAD.curbH + 3.2, z, mat: glow(0xffd166, { transparent: true, opacity: 0.85 }), rotY: Math.PI / 2 }));
  return grp;
}

/* ================================================================ 路牌 */
function buildRoadSigns(g) {
  const grp = new THREE.Group();
  grp.name = 'roadSigns';
  const poleMat = toon(0x8f98a9, { steps: 4 });

  const mkSign = (x, z, texKind, w, h, y, rotY, poleH = 2.6, poleR = 0.05) => {
    const s = new THREE.Group();
    s.position.set(x, ROAD.curbH, z);
    s.rotation.y = rotY;
    s.add(cyl({ rTop: poleR, h: poleH, x: 0, y: 0, z: 0, mat: poleMat, seg: 8, outline: 0.4 }));
    const faceMat = glow(0xffffff, { map: TX.roadSignTexture(texKind), transparent: true });
    s.add(panel({ w, h, x: 0, y, z: 0.02, mat: faceMat }));
    // 双面
    s.add(panel({ w, h, x: 0, y, z: -0.02, mat: faceMat, rotY: Math.PI }));
    grp.add(s);
    return s;
  };

  // 街角：便利店指示牌 + 驻车场
  mkSign(-6.05, 7.3, 'konbini', 1.1, 0.5, 2.3, 0.35, 2.7);
  mkSign(8.1, 7.5, 'parking', 0.72, 0.72, 2.35, -0.25, 2.8);
  // 巷口：止まれ + 驻车禁止
  mkSign(7.35, 6.9, 'stop', 0.72, 0.72, 2.15, 0.2, 2.5);
  mkSign(6.2, 4.6, 'noParking', 0.6, 0.6, 2.3, -Math.PI / 2 + 0.1, 2.6);
  // 横街侧：便利店导视
  mkSign(-8.35, 1.2, 'konbini', 1.1, 0.5, 2.3, -Math.PI / 2, 2.7);

  // 公交站牌（横街旁，简单的日本社区巴士站）
  const busPole = new THREE.Group();
  busPole.position.set(-15.9, ROAD.curbH, 4.4);
  busPole.add(cyl({ rTop: 0.05, h: 2.9, x: 0, y: 0, z: 0, mat: poleMat, seg: 8, outline: 0.4 }));
  const busPlate = glow(0xffffff, { transparent: true, opacity: 0.9 });
  busPlate.map = TX.roadSignTexture('konbini');
  busPole.add(panel({ w: 0.55, h: 0.55, x: 0, y: 2.65, z: 0.03, mat: busPlate }));
  busPole.add(panel({ w: 0.34, h: 0.5, x: 0, y: 1.9, z: 0.03, mat: glow(0xdfe8f5, { transparent: true, opacity: 0.85 }) }));
  grp.add(busPole);

  // 人行横道信号灯（街角，红/绿小人灯箱）
  const pedSignal = new THREE.Group();
  pedSignal.name = 'signals';
  const psX = -6.9, psZ = 9.4;
  pedSignal.position.set(psX, ROAD.curbH, psZ);
  pedSignal.rotation.y = Math.PI;
  pedSignal.add(cyl({ rTop: 0.055, h: 3.1, x: 0, y: 0, z: 0, mat: poleMat, seg: 8, outline: 0.4 }));
  pedSignal.add(cube({ w: 0.34, h: 0.62, d: 0.22, x: 0, y: 3.05, z: 0, mat: toon(0x3b4250, { steps: 3 }), anchor: 'center', outline: 0.45 }));
  const pedLenses = [0x5ee08a, 0xff4d4d].map((c, i) => {
    const lm = glow(c, { transparent: true, opacity: 1 });
    const l = new THREE.Mesh(new THREE.CircleGeometry(0.1, 12), lm);
    l.position.set(0, 3.22 - i * 0.34, 0.13);
    pedSignal.add(l);
    return l;
  });
  pedSignal.userData.lenses = pedLenses;
  pedSignal.userData.pedestrian = true;
  pedSignal.userData.cycle = 3.5;
  grp.add(pedSignal);

  // 车道导向箭头（主路东行方向）
  const arrowMat = glow(0xe7edf6, { transparent: true, opacity: 0.6, depthWrite: false });
  const mkArrow = (x, z, rotY) => {
    const a = new THREE.Group();
    a.position.set(x, ROAD.laneY + 0.004, z);
    a.rotation.y = rotY;
    a.add(groundPlane({ w: 0.18, d: 1.1, x: 0, y: 0, z: 0.3, mat: arrowMat }));
    const head = new THREE.Mesh(new THREE.CircleGeometry(0.34, 3), arrowMat);
    head.rotation.set(-Math.PI / 2, 0, Math.PI);
    head.position.set(0, 0, -0.42);
    a.add(head);
    grp.add(a);
  };
  mkArrow(2.0, 10.9, 0);
  mkArrow(9.0, 10.9, 0);
  mkArrow(-11.0, 13.3, Math.PI);

  // 街角凸面镜
  const mirrorGroup = new THREE.Group();
  const mx = -6.2, mz = 7.0;
  mirrorGroup.add(cyl({ rTop: 0.055, h: 2.4, x: mx, y: ROAD.curbH, z: mz, mat: poleMat, seg: 8 }));
  const mirrorMat = wetSurface(0x9fb8cc, { roughness: 0.1, metalness: 0.55, envIntensity: 2.0 });
  const dish = new THREE.Mesh(new THREE.SphereGeometry(0.4, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2.4), toon(0xd8dde6, { steps: 4, side: THREE.DoubleSide }));
  dish.position.set(mx, ROAD.curbH + 2.4, mz);
  dish.rotation.set(Math.PI * 0.62, -0.5, 0);
  mirrorGroup.add(dish);
  const glassFace = new THREE.Mesh(new THREE.SphereGeometry(0.38, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2.4), mirrorMat);
  glassFace.position.copy(dish.position);
  glassFace.rotation.copy(dish.rotation);
  glassFace.scale.set(1, 0.98, 1);
  mirrorGroup.add(glassFace);
  grp.add(mirrorGroup);

  // 街角信号灯（远处，带微弱变化）
  const signals = new THREE.Group();
  signals.name = 'signals';
  const sig = (x, z, rotY) => {
    const s = new THREE.Group();
    s.position.set(x, 0, z);
    s.rotation.y = rotY;
    s.add(cyl({ rTop: 0.07, h: 4.6, x: 0, y: 0, z: 0, mat: poleMat, seg: 10, outline: 0.5 }));
    s.add(cyl({ rTop: 0.06, h: 1.6, x: 0.8, y: 4.3, z: 0, mat: poleMat, seg: 8, rotZ: Math.PI / 2, anchor: 'center' }));
    const box = cube({ w: 1.0, h: 0.34, d: 0.24, x: 1.6, y: 4.3, z: 0, mat: toon(0x3b4250, { steps: 3 }), anchor: 'center', outline: 0.5 });
    s.add(box);
    const lensColors = [0xff4d4d, 0xffd166, 0x5ee08a];
    const lenses = lensColors.map((c, i) => {
      const lm = glow(c, { transparent: true, opacity: 1 });
      const l = new THREE.Mesh(new THREE.CircleGeometry(0.12, 14), lm);
      l.position.set(1.6 - 0.3 + i * 0.3, 4.3, 0.13);
      l.userData.lensIndex = i;
      s.add(l);
      return l;
    });
    s.userData.lenses = lenses;
    s.userData.cycle = Math.random() * 6;
    grp.add(s);
    return s;
  };
  sig(LIGHTS.signals.far.x, LIGHTS.signals.far.z, 0.1);
  sig(LIGHTS.signals.near.x, LIGHTS.signals.near.z, Math.PI - 0.1);
  grp.userData.signals = grp.children.filter((c) => c.name === 'signals');

  return grp;
}

/* ============================================================== 街角护栏 */
function buildGuardrail(g) {
  const grp = new THREE.Group();
  grp.name = 'guardrail';
  const railMat = toon(0x9aa3b4, { steps: 4 });
  const postMat = toon(0x7d8698, { steps: 4 });

  const run = (x0, x1, z) => {
    for (let x = x0; x <= x1 + 0.01; x += 1.3) {
      grp.add(cyl({ rTop: 0.045, h: 0.78, x, y: ROAD.curbH, z, mat: postMat, seg: 8, outline: 0.35 }));
    }
    // 两道横管
    [0.68, 0.36].forEach((y) => {
      const t = cyl({ rTop: 0.035, h: x1 - x0, x: (x0 + x1) / 2, y: ROAD.curbH + y, z, mat: railMat, seg: 8, rotZ: Math.PI / 2, anchor: 'center', outline: 0.35 });
      grp.add(t);
    });
  };
  const runZ = (z0, z1, x) => {
    for (let z = z0; z <= z1 + 0.01; z += 1.3) {
      grp.add(cyl({ rTop: 0.045, h: 0.78, x, y: ROAD.curbH, z, mat: postMat, seg: 8, outline: 0.35 }));
    }
    [0.68, 0.36].forEach((y) => {
      const t = cyl({ rTop: 0.035, h: z1 - z0, x, y: ROAD.curbH + y, z: (z0 + z1) / 2, mat: railMat, seg: 8, rotX: Math.PI / 2, anchor: 'center', outline: 0.35 });
      grp.add(t);
    });
  };

  // 便利店门口一侧（留出出入口）
  run(-1.2, 1.0, ROAD.main.z0 + 0.35);
  run(6.4, 12.6, ROAD.main.z0 + 0.35);
  // 横街一侧
  runZ(-4.0, 3.2, ROAD.side.x1 - 0.35);

  // 电线杆上的防撞护条 + 街角圆形反光柱
  const bol = toon(0xd8dde6, { steps: 4 });
  [[-6.9, 7.6], [5.4, 7.9], [-7.7, -3.0]].forEach(([x, z]) => {
    grp.add(cyl({ rTop: 0.075, h: 0.85, x, y: ROAD.curbH, z, mat: bol, seg: 10, outline: 0.4 }));
    grp.add(cyl({ rTop: 0.08, h: 0.12, x, y: ROAD.curbH + 0.62, z, mat: glow(0xffd166, { transparent: true, opacity: 0.85 }), seg: 10 }));
  });
  return grp;
}

/* ============================================================== 停车位 */
function buildParking(g) {
  const grp = new THREE.Group();
  grp.name = 'parking';
  const lineMat = glow(0xe7edf6, { transparent: true, opacity: 0.7, depthWrite: false });
  const y = ROAD.laneY + 0.006;
  // 主路沿街的 3 个路边停车位（便利店东侧）
  const x0 = 8.6, x1 = 15.0;
  for (let i = 0; i <= 3; i++) {
    const x = x0 + (i * (x1 - x0)) / 3;
    grp.add(groundPlane({ w: 0.12, d: 2.7, x, y, z: ROAD.main.z0 + 1.55, mat: lineMat }));
  }
  grp.add(groundPlane({ w: x1 - x0, d: 0.12, x: (x0 + x1) / 2, y, z: ROAD.main.z0 + 2.85, mat: lineMat }));
  // 车位里的两辆车
  const car1 = makeCar(0x9aa3b4);
  car1.position.set(x0 + 1.1, ROAD.laneY, ROAD.main.z0 + 1.5);
  grp.add(car1);
  const car2 = makeCar(0x8a4b5b);
  car2.position.set(x0 + 3.4, ROAD.laneY, ROAD.main.z0 + 1.5);
  car2.rotation.y = 0.03;
  grp.add(car2);
  return grp;
}

/* ============================================================ 空调外机 */
function buildACUnits(g) {
  const grp = new THREE.Group();
  grp.name = 'acUnits';
  const shellMat = toon(0xb9c1cf, { steps: 4 });
  const fanMat = toon(0x5b6478, { steps: 3 });
  const mk = (x, y, z, rotY = 0, w = 0.85) => {
    const u = new THREE.Group();
    u.position.set(x, y, z);
    u.rotation.y = rotY;
    u.add(cube({ w, h: 0.58, d: 0.34, x: 0, y: 0, z: 0, mat: shellMat, outline: 0.6 }));
    const fan = new THREE.Mesh(new THREE.CircleGeometry(0.2, 16), fanMat);
    fan.position.set(0, 0, 0.18);
    u.add(fan);
    u.add(cyl({ rTop: 0.21, h: 0.03, x: 0, y: 0, z: 0.2, mat: shellMat, seg: 16, rotX: Math.PI / 2, anchor: 'center' }));
    // 支架
    u.add(cube({ w: w + 0.1, h: 0.05, d: 0.1, x: 0, y: -0.3, z: -0.14, mat: toon(0x6b7484, { steps: 3 }) }));
    grp.add(u);
    return u;
  };
  // 便利店南墙西段（面向街角，最显眼）
  mk(-5.2, 2.5, STORE.z1 + 0.25, 0, 0.8);
  mk(-5.2, 3.4, 0.6, 0, 0.8);
  // 小巷内的外机（贴着便利店东墙）
  mk(STORE.x1 + 0.28, 2.2, -1.2, -Math.PI / 2, 0.75);
  mk(STORE.x1 + 0.28, 3.1, -4.8, -Math.PI / 2, 0.75);
  // 北侧楼上
  mk(-2.6, 4.8, -10.2, 0, 0.9);
  mk(2.4, 4.8, -10.2, 0, 0.9);
  return grp;
}

/* ============================================================= 公告栏 */
function buildBulletinBoard(g) {
  const grp = new THREE.Group();
  grp.name = 'bulletin';
  const x = -6.15, z = 5.4;
  const frameMat = toon(0x6b5a48, { steps: 4 });
  const postMat = toon(0x8a7a62, { steps: 4 });
  grp.add(cyl({ rTop: 0.06, h: 2.1, x: x - 0.85, y: ROAD.curbH, z, mat: postMat, seg: 8, outline: 0.4 }));
  grp.add(cyl({ rTop: 0.06, h: 2.1, x: x + 0.85, y: ROAD.curbH, z, mat: postMat, seg: 8, outline: 0.4 }));
  grp.add(cube({ w: 2.0, h: 1.2, d: 0.12, x, y: ROAD.curbH + 0.75, z, mat: frameMat, outline: 0.7 }));
  const boardMat = glow(0xffffff, { map: TX.noticeBoardTexture() });
  grp.add(panel({ w: 1.86, h: 1.08, x, y: ROAD.curbH + 1.35, z: z + 0.07, mat: boardMat }));
  // 顶部小雨檐
  grp.add(cube({ w: 2.15, h: 0.08, d: 0.4, x, y: ROAD.curbH + 2.05, z: z + 0.06, mat: toon(0x5b4b3c, { steps: 4 }), outline: 0.4 }));
  return grp;
}

/* ============================================================ 配电箱 */
function buildUtilityBox(g) {
  const grp = new THREE.Group();
  grp.name = 'utilityBox';
  const mat = toon(0x9aa3b4, { steps: 4 });
  const mk = (x, z, rotY, w = 0.7) => {
    const u = new THREE.Group();
    u.position.set(x, ROAD.curbH, z);
    u.rotation.y = rotY;
    u.add(cube({ w, h: 1.15, d: 0.3, x: 0, y: 0, z: 0, mat, outline: 0.6 }));
    u.add(cube({ w: w + 0.06, h: 0.06, d: 0.36, x: 0, y: 1.15, z: 0, mat: toon(0x7d8698, { steps: 4 }) }));
    u.add(cyl({ rTop: 0.03, h: 0.1, x: w / 2 - 0.12, y: 0.6, z: 0.16, mat: toon(0x5b6478, { steps: 3 }), seg: 6, rotX: Math.PI / 2, anchor: 'center' }));
    // 警示贴
    u.add(panel({ w: 0.3, h: 0.2, x: -w / 2 + 0.2, y: 0.75, z: 0.16, mat: glow(0xffd166, { transparent: true, opacity: 0.85 }) }));
    grp.add(u);
  };
  mk(-7.35, 3.4, -Math.PI / 2);
  mk(-7.35, -9.2, -Math.PI / 2);
  mk(8.05, -9.4, 0);
  // 消火栓
  const hyd = new THREE.Group();
  hyd.add(cyl({ rTop: 0.13, h: 0.75, x: 0, y: ROAD.curbH, z: 0, mat: toon(0xc8342b, { steps: 4 }), seg: 10, outline: 0.5 }));
  hyd.add(sphere({ r: 0.15, x: 0, y: ROAD.curbH + 0.78, z: 0, mat: toon(0xc8342b, { steps: 4 }), seg: 12, outline: 0.5 }));
  hyd.add(cyl({ rTop: 0.06, h: 0.34, x: 0, y: ROAD.curbH + 0.55, z: 0, mat: toon(0x9aa3b4, { steps: 3 }), seg: 8, rotZ: Math.PI / 2, anchor: 'center' }));
  hyd.position.set(-7.6, 0, 6.4);
  grp.add(hyd);
  return grp;
}

/* ======================================================== 街对面的霓虹招牌 */
function buildNeonRow(g) {
  const grp = new THREE.Group();
  grp.name = 'neonRow';
  const frameMat = toon(0x2a3040, { steps: 3 });

  // 竖排霓虹招牌（贴在横街对面楼的东立面，朝便利店方向）
  const mk = (x, y, z, w, h, text, color, rotY = Math.PI / 2) => {
    const m = glow(color, { transparent: true, opacity: 0.96 });
    m.map = TX.neonSignTexture(text, '#' + new THREE.Color(color).getHexString());
    const p = panel({ w, h, x, y, z, mat: m, rotY });
    grp.add(p);
    // 边框
    grp.add(cube({
      w: rotY === Math.PI / 2 ? 0.08 : w + 0.12, h: h + 0.12,
      d: rotY === Math.PI / 2 ? w + 0.12 : 0.08,
      x: x + (rotY === Math.PI / 2 ? -0.05 : 0), y: y - h / 2 - 0.06, z: z + (rotY === Math.PI / 2 ? 0 : -0.05),
      mat: frameMat, outline: 0.4,
    }));
    const hl = halo(color, Math.max(w, h) * 3.2, 0.3);
    hl.position.set(x + (rotY === Math.PI / 2 ? 0.5 : 0), y, z + (rotY === Math.PI / 2 ? 0 : 0.5));
    grp.add(hl);
    return p;
  };

  // 西侧沿街楼：南立面（朝主路，hero 视角可见）
  mk(-20.9, 5.4, 7.68, 1.9, 0.62, '居酒屋', 0xff5a4d, 0);
  mk(-18.4, 6.6, 7.68, 0.5, 1.5, 'ラーメン', 0xffc23a, 0);
  mk(-17.4, 4.2, 7.68, 1.5, 0.55, 'スナック', 0xff6fa8, 0);
  // 西侧沿街楼：东立面（朝横街，转到西侧时可见）
  mk(-16.5, 5.6, 2.6, 0.5, 1.6, 'カラオケ', 0x6fe6ff);
  mk(-16.5, 4.6, 0.2, 0.5, 1.5, '焼鳥', 0xffc23a);
  // 北侧楼上的一块横向灯箱（朝南，正对便利店屋顶方向）
  const wide = glow(0xffffff, { transparent: true, opacity: 0.95 });
  wide.map = TX.lightboxTexture();
  grp.add(panel({ w: 2.6, h: 0.7, x: 2.0, y: 5.2, z: -10.24, mat: wide }));

  // 霓虹溢出的光（照亮街对面的湿路面）
  const lights = [
    { x: -18.6, y: 5.4, z: 9.4, c: 0xff6a5a, i: 18, d: 13 },
    { x: -17.0, y: 4.4, z: 9.2, c: 0xff8fc0, i: 13, d: 11 },
    { x: -15.6, y: 5.6, z: 2.6, c: 0x7fe0ff, i: 12, d: 12 },
  ];
  lights.forEach((l) => {
    const pl = new THREE.PointLight(l.c, l.i, l.d, 2);
    pl.position.set(l.x, l.y, l.z);
    grp.add(pl);
  });

  // 红灯笼（居酒屋门口）
  const lantern = new THREE.Group();
  lantern.position.set(-20.9, 2.5, 9.2);
  const lanMat = glow(0xff5a4d, { transparent: true, opacity: 0.9 });
  for (let i = 0; i < 3; i++) {
    const l = lantern.clone();
    l.position.set(-21.9 + i * 1.0, 2.5, 9.2);
    l.scale.set(1, 1.25, 1);
    grp.add(l);
  }
  lantern.add(new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 10), lanMat));
  lantern.scale.set(1, 1.25, 1);
  grp.add(lantern);
  const lanLight = new THREE.PointLight(0xff7a5a, 7, 6, 2);
  lanLight.position.set(-20.7, 2.5, 9.0);
  grp.add(lanLight);

  return grp;
}

/* ================================================================ 街树 */
function buildTrees(g) {
  const grp = new THREE.Group();
  grp.name = 'trees';
  const trunkMat = toon(0x4a3b30, { steps: 3 });
  const leafMats = [toon(0x2f4a3a, { steps: 4 }), toon(0x35543f, { steps: 4 }), toon(0x28402f, { steps: 4 })];

  const mk = (x, z, scale = 1, seed = 1) => {
    const t = new THREE.Group();
    t.position.set(x, ROAD.curbH, z);
    t.scale.setScalar(scale);
    // 树池
    t.add(cube({ w: 1.0, h: 0.12, d: 1.0, x: 0, y: 0, z: 0, mat: toon(0x59617a, { steps: 4 }), outline: 0.4 }));
    // 树干
    t.add(cyl({ rTop: 0.1, rBot: 0.14, h: 2.5, x: 0, y: 0.1, z: 0, mat: trunkMat, seg: 8, outline: 0.6 }));
    // 枝条
    [[0.5, 2.0, 0.4], [-0.45, 2.3, -0.3]].forEach(([ax, ay, az], i) => {
      const b = cyl({ rTop: 0.05, h: 1.1, x: ax, y: ay, z: az, mat: trunkMat, seg: 6, rotZ: i ? 0.7 : -0.7, rotX: az * 0.6, outline: 0.4 });
      t.add(b);
    });
    // 树冠（几个球体团块，剪影清楚）
    const rnd = (() => { let a = seed * 7919; return () => { a = (a * 1103515245 + 12345) & 0x7fffffff; return a / 0x7fffffff; }; })();
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2;
      const r = 0.55 + rnd() * 0.35;
      const rr = 0.6 + rnd() * 0.4;
      const leaf = sphere({
        r,
        x: Math.cos(a) * rr, y: 2.9 + rnd() * 0.9, z: Math.sin(a) * rr,
        mat: leafMats[i % 3], seg: 12, outline: 0.7,
        sx: 1, sy: 0.85, sz: 1,
      });
      t.add(leaf);
    }
    t.add(sphere({ r: 0.95, x: 0, y: 3.5, z: 0, mat: leafMats[1], seg: 14, outline: 0.8, sy: 0.8 }));
    grp.add(t);
    return t;
  };
  mk(12.6, 7.9, 1.0, 3);
  mk(15.6, 7.9, 0.92, 7);
  mk(-15.9, -2.0, 0.95, 11);
  return grp;
}

/* ============================================================ 小型摩托 */
function buildScooter(g) {
  const grp = new THREE.Group();
  grp.name = 'scooter';
  const s = new THREE.Group();
  const bodyMat = toon(0xd8dde6, { steps: 4 });
  const darkMat = toon(0x2b3040, { steps: 3 });
  s.add(cube({ w: 0.42, h: 0.4, d: 1.1, x: 0, y: 0.42, z: 0.1, mat: bodyMat, outline: 0.6 }));
  s.add(cube({ w: 0.36, h: 0.5, d: 0.42, x: 0, y: 0.62, z: -0.6, mat: bodyMat, outline: 0.5 }));
  s.add(cube({ w: 0.34, h: 0.3, d: 0.3, x: 0, y: 0.9, z: -0.62, mat: darkMat }));
  // 车把
  const bar = cyl({ rTop: 0.02, h: 0.5, x: 0, y: 1.02, z: -0.62, mat: darkMat, seg: 6, anchor: 'center' });
  bar.rotation.z = Math.PI / 2;
  s.add(bar);
  s.add(cube({ w: 0.3, h: 0.16, d: 0.08, x: 0, y: 0.98, z: -0.5, mat: glow(0xfff0cf, { transparent: true, opacity: 0.75 }), anchor: 'center' }));
  // 座垫
  s.add(cube({ w: 0.34, h: 0.12, d: 0.5, x: 0, y: 0.86, z: 0.28, mat: darkMat, anchor: 'center', outline: 0.4 }));
  // 轮
  [0.62, -0.62].forEach((wz) => {
    const w = new THREE.Mesh(new THREE.TorusGeometry(0.19, 0.07, 8, 14), darkMat);
    w.rotation.y = Math.PI / 2;
    w.position.set(0, 0.2, wz);
    s.add(w);
  });
  // 后箱
  s.add(cube({ w: 0.38, h: 0.32, d: 0.36, x: 0, y: 0.98, z: 0.6, mat: toon(0xc8342b, { steps: 4 }), outline: 0.5 }));
  s.position.set(-7.05, ROAD.curbH, -1.4);
  s.rotation.y = Math.PI / 2 + 0.15;
  s.rotation.z = 0.04;
  grp.add(s);
  return grp;
}
