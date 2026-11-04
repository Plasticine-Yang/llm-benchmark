import * as THREE from 'three';
import { SIDEWALK_Y, PYLON, STREET_LAMP, VENDING, BINS, POLE_A, POLE_B, TRAFFIC } from './layout.js';
import { toon, box, cylinder, addOutline, unlit, sprite, tubeBetween } from './materials.js';
import {
  makePylonSignTexture,
  makeVendingTexture,
  makeStopSignTexture,
  makeRoadSign,
  makeGlowTexture,
  makeNoticeBoardTexture,
  makePosterTexture,
  makeShutterTexture,
  makeNoboriTexture,
  makeNeonTexture,
} from './textures.js';

const glowTex = makeGlowTexture();

function glow(color, size, opacity = 0.9) {
  const s = sprite(glowTex, color, size, opacity);
  s.material.depthTest = true;
  return s;
}

/* ------------------------------------------------------------ 立式灯箱 */
function createPylon(root) {
  const g = new THREE.Group();
  const poleMat = toon(0x5c6068);
  const base = box(0.7, 0.18, 0.7, toon(0x4a4e54), { outline: true, thick: 0.012 });
  base.position.y = 0.09;
  g.add(base);
  const pole = cylinder(0.095, 0.11, 2.2, 10, poleMat, { outline: true, thick: 0.008 });
  pole.position.y = 1.24;
  g.add(pole);

  const tex = makePylonSignTexture();
  const face = new THREE.MeshBasicMaterial({ map: tex });
  const capMat = toon(0x3c4148);
  const mats = [capMat, capMat, capMat, capMat, face, face];
  const sign = new THREE.Mesh(new THREE.BoxGeometry(0.8, 2.95, 0.17), mats);
  sign.position.y = 3.82;
  sign.castShadow = false;
  g.add(sign);
  const frame = box(0.9, 3.05, 0.1, capMat, { outline: true, thick: 0.012, cast: false });
  frame.position.y = 3.82;
  g.add(frame);
  const cap = box(0.9, 0.1, 0.26, capMat, { outline: true, thick: 0.01 });
  cap.position.y = 5.38;
  g.add(cap);
  const halo = glow(0xbfffe4, 2.8, 0.26);
  halo.position.set(0, 3.9, 0.35);
  g.add(halo);

  g.position.set(PYLON.x, SIDEWALK_Y, PYLON.z);
  root.add(g);
  return { face, halo, group: g };
}

/* ------------------------------------------------------------ 自动贩卖机 */
function createVending(root) {
  const g = new THREE.Group();
  const bodyMat = toon(0xdfe6ec);
  const body = box(0.98, 1.92, 0.74, bodyMat, { outline: true, thick: 0.02 });
  body.position.y = 0.96;
  g.add(body);
  const tex = makeVendingTexture();
  const front = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 1.8), new THREE.MeshBasicMaterial({ map: tex }));
  front.position.set(0, 1.0, 0.376);
  g.add(front);
  const top = box(1.02, 0.08, 0.78, toon(0x9aa4ad), { outline: true, thick: 0.012 });
  top.position.y = 1.95;
  g.add(top);
  // 侧面海报
  const sideTex = makePosterTexture('drink');
  const side = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.85), new THREE.MeshBasicMaterial({ map: sideTex }));
  side.rotation.y = Math.PI / 2;
  side.position.set(0.5, 1.2, 0);
  g.add(side);

  const halo = glow(0xa8e8ff, 2.0, 0.32);
  halo.position.set(0, 1.05, 0.55);
  g.add(halo);

  const light = new THREE.PointLight(0xbfe9ff, 3.0, 5, 2);
  light.position.set(0, 1.3, 0.9);
  g.add(light);

  g.position.set(VENDING.x, SIDEWALK_Y, VENDING.z);
  root.add(g);
  return g;
}

/* ------------------------------------------------------------ 垃圾桶 */
function createBins(root) {
  const g = new THREE.Group();
  const colors = [0x3f7fbf, 0xd8604c, 0x4fa06c];
  const labels = ['かん・びん', 'ペット', 'もえる'];
  colors.forEach((c, i) => {
    const b = box(0.42, 0.86, 0.4, toon(c), { outline: true, thick: 0.014 });
    b.position.set(i * 0.48, 0.43, 0);
    g.add(b);
    const lid = box(0.46, 0.08, 0.44, toon(0x2f343a), { outline: true, thick: 0.008 });
    lid.position.set(i * 0.48, 0.9, 0);
    g.add(lid);
    const label = new THREE.Mesh(
      new THREE.PlaneGeometry(0.3, 0.16),
      new THREE.MeshBasicMaterial({ color: 0xf5f2e6 })
    );
    label.position.set(i * 0.48, 0.62, 0.21);
    g.add(label);
  });
  g.position.set(BINS.x, SIDEWALK_Y, BINS.z);
  root.add(g);
}

/* ------------------------------------------------------------ 自行车 */
function createBicycle(root, x, z, rotY, color = 0x8e3f3f, y = SIDEWALK_Y) {
  const g = new THREE.Group();
  const frameMat = toon(color);
  const darkMat = toon(0x2b2f35);
  const chrome = toon(0xb9c0c7);

  const wheelGeo = new THREE.TorusGeometry(0.33, 0.028, 6, 20);
  for (const wz of [-0.62, 0.62]) {
    const w = new THREE.Mesh(wheelGeo, darkMat);
    w.rotation.y = Math.PI / 2;
    w.position.set(0, 0.45, wz);
    w.castShadow = true;
    addOutline(w, 0.01);
    g.add(w);
    const hub = cylinder(0.035, 0.035, 0.09, 8, chrome, { cast: false });
    hub.rotation.z = Math.PI / 2;
    hub.position.set(0, 0.45, wz);
    g.add(hub);
    // 辐条
    for (let i = 0; i < 6; i++) {
      const spoke = cylinder(0.005, 0.005, 0.63, 3, chrome, { cast: false });
      spoke.rotation.x = (i / 6) * Math.PI;
      spoke.position.set(0, 0.45, wz);
      g.add(spoke);
    }
  }

  const p = (y, z) => new THREE.Vector3(0, y, z);
  const tubes = [
    [p(0.45, -0.06), p(0.94, -0.26)],
    [p(0.92, -0.24), p(0.98, 0.34)],
    [p(0.46, -0.06), p(0.9, 0.36)],
    [p(0.45, -0.06), p(0.45, -0.62)],
    [p(0.92, -0.24), p(0.45, -0.62)],
    [p(0.9, 0.36), p(0.45, 0.62)],
    [p(0.98, 0.34), p(0.86, 0.44)],
    [p(0.46, -0.06), p(0.45, 0.45)],
  ];
  for (const [a, b] of tubes) {
    const t = tubeBetween(a, b, 0.022, frameMat, 6);
    addOutline(t, 0.008);
    g.add(t);
  }
  // 车把
  const bar = cylinder(0.017, 0.017, 0.46, 6, chrome, { cast: false });
  bar.rotation.z = Math.PI / 2;
  bar.position.set(0, 1.0, 0.46);
  g.add(bar);
  for (const dx of [-0.21, 0.21]) {
    const grip = cylinder(0.024, 0.024, 0.1, 6, darkMat, { cast: false });
    grip.rotation.z = Math.PI / 2;
    grip.position.set(dx, 1.0, 0.46);
    g.add(grip);
  }
  // 车座
  const saddle = box(0.14, 0.06, 0.28, darkMat, { outline: true, thick: 0.008 });
  saddle.position.set(0, 0.99, -0.32);
  g.add(saddle);
  // 前筐
  const basketMats = toon(0x8a929a);
  const basket = box(0.36, 0.24, 0.28, basketMats, { outline: true, thick: 0.008 });
  basket.position.set(0, 0.86, 0.66);
  g.add(basket);
  const basketHole = box(0.3, 0.16, 0.22, toon(0x2b2f35), { cast: false });
  basketHole.position.set(0, 0.9, 0.66);
  g.add(basketHole);
  // 后货架
  const rack = box(0.2, 0.03, 0.44, chrome, { cast: false });
  rack.position.set(0, 0.82, -0.58);
  g.add(rack);
  // 挡泥板
  for (const wz of [-0.62, 0.62]) {
    const f = new THREE.Mesh(new THREE.TorusGeometry(0.37, 0.02, 4, 14, Math.PI * 0.8), toon(0x3a3f45));
    f.rotation.y = Math.PI / 2;
    f.rotation.z = 0.7;
    f.position.set(0, 0.45, wz);
    g.add(f);
  }
  // 脚撑
  const stand = tubeBetween(p(0.42, -0.28), new THREE.Vector3(0.16, 0.02, -0.4), 0.012, chrome, 4);
  g.add(stand);
  // 车灯
  const lamp = box(0.08, 0.1, 0.1, unlit(0xfff0c8), { cast: false });
  lamp.position.set(0, 0.88, 0.7);
  g.add(lamp);

  g.position.set(x, y, z);
  g.rotation.y = rotY;
  g.rotation.z = 0.05;
  root.add(g);
  return g;
}

/* ------------------------------------------------------------ 伞架 */
function createUmbrellaStand(root) {
  const g = new THREE.Group();
  const stand = box(0.34, 0.44, 0.34, toon(0x7b828b), { outline: true, thick: 0.01 });
  stand.position.y = 0.22;
  g.add(stand);
  const colors = [0x384a63, 0x8e3f3f, 0xcfd6dd];
  colors.forEach((c, i) => {
    const umb = new THREE.Mesh(new THREE.ConeGeometry(0.075, 0.86, 8), toon(c));
    umb.position.set(-0.09 + i * 0.09, 0.62, (i - 1) * 0.06);
    umb.rotation.z = (i - 1) * 0.1;
    umb.rotation.x = (i - 1) * 0.05;
    umb.castShadow = true;
    addOutline(umb, 0.008);
    g.add(umb);
    const tip = cylinder(0.008, 0.008, 0.1, 4, toon(0x2b2f35), { cast: false });
    tip.position.set(-0.09 + i * 0.09, 1.06, (i - 1) * 0.06);
    g.add(tip);
  });
  g.position.set(3.25, SIDEWALK_Y, 1.42);
  root.add(g);
}

/* ------------------------------------------------------------ 护栏 */
function createGuardrail(root, x0, z0, x1, z1) {
  const g = new THREE.Group();
  const mat = toon(0xe4e2d8);
  const len = Math.hypot(x1 - x0, z1 - z0);
  const dir = new THREE.Vector3(x1 - x0, 0, z1 - z0).normalize();
  const n = Math.max(2, Math.round(len / 1.6));
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const px = x0 + (x1 - x0) * t;
    const pz = z0 + (z1 - z0) * t;
    const post = cylinder(0.045, 0.05, 0.82, 8, mat, { outline: true, thick: 0.008 });
    post.position.set(px, 0.41, pz);
    g.add(post);
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 6), mat);
    cap.position.set(px, 0.84, pz);
    g.add(cap);
    if (i < n) {
      const nx = x0 + (x1 - x0) * ((i + 1) / n);
      const nz = z0 + (z1 - z0) * ((i + 1) / n);
      for (const h of [0.44, 0.74]) {
        const a = new THREE.Vector3(px, h, pz);
        const b = new THREE.Vector3(nx, h, nz);
        const rail = tubeBetween(a, b, 0.032, mat, 8);
        addOutline(rail, 0.008);
        g.add(rail);
      }
      const refl = box(0.09, 0.07, 0.03, unlit(0xffa040), { cast: false });
      refl.position.set(px, 0.62, pz);
      g.add(refl);
    }
  }
  root.add(g);
  return g;
}

/* ------------------------------------------------------------ 电线杆 */
function createPole(root, x, z, { transformer = false, lampArm = false } = {}) {
  const g = new THREE.Group();
  const mat = toon(0x6f6a63);
  const pole = cylinder(0.14, 0.19, 9.2, 10, mat, { outline: true, thick: 0.014 });
  pole.position.y = 4.6;
  g.add(pole);
  for (const y of [1.4, 4.8]) {
    const band = cylinder(0.2, 0.2, 0.09, 10, toon(0x4a4a4a), { cast: false });
    band.position.y = y;
    g.add(band);
  }
  const armMat = toon(0x565049);
  for (const [y, w] of [[7.9, 2.5], [8.5, 2.0]]) {
    const arm = box(w, 0.11, 0.16, armMat, { outline: true, thick: 0.008 });
    arm.position.set(0, y, 0);
    g.add(arm);
    for (const dx of [-w / 2 + 0.2, 0, w / 2 - 0.2]) {
      const ins = cylinder(0.06, 0.07, 0.16, 8, toon(0xd8d6cc), { cast: false });
      ins.position.set(dx, y + 0.13, 0);
      g.add(ins);
    }
  }
  if (transformer) {
    const drum = cylinder(0.3, 0.3, 0.8, 12, toon(0x8a8f95), { outline: true, thick: 0.012 });
    drum.position.set(0.1, 6.7, 0.28);
    g.add(drum);
    const top = cylinder(0.32, 0.32, 0.06, 12, toon(0x71767c), { cast: false });
    top.position.set(0.1, 7.12, 0.28);
    g.add(top);
  }
  if (lampArm) {
    const armCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 6.3, 0),
      new THREE.Vector3(0, 6.9, 0.6),
      new THREE.Vector3(0, 7.0, 1.5),
    ]);
    const arm = new THREE.Mesh(new THREE.TubeGeometry(armCurve, 12, 0.045, 6, false), toon(0x7d838a));
    arm.castShadow = true;
    g.add(arm);
    const head = box(0.5, 0.12, 0.24, toon(0x5d636b), { outline: true, thick: 0.008 });
    head.position.set(0, 6.96, 1.62);
    g.add(head);
    const lens = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.18), unlit(0xfff0cc));
    lens.rotation.x = Math.PI / 2;
    lens.position.set(0, 6.89, 1.62);
    g.add(lens);
    const halo = glow(0xffe6b8, 2.6, 0.55);
    halo.position.set(0, 6.85, 1.62);
    g.add(halo);
  }
  g.position.set(x, SIDEWALK_Y, z);
  root.add(g);
  return g;
}

function wire(root, a, b, sag = 0.45, radius = 0.018) {
  const mid = new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5);
  mid.y -= sag;
  const curve = new THREE.CatmullRomCurve3([a, mid, b]);
  const geo = new THREE.TubeGeometry(curve, 20, radius, 4, false);
  const m = new THREE.Mesh(geo, toon(0x1d222b));
  root.add(m);
}

/* ------------------------------------------------------------ 路灯 */
function createStreetLamp(root) {
  const g = new THREE.Group();
  const mat = toon(0x6d747c);
  const base = cylinder(0.17, 0.2, 0.35, 10, toon(0x4a4e54), { outline: true, thick: 0.01 });
  base.position.y = 0.17;
  g.add(base);
  const pole = cylinder(0.07, 0.09, 4.4, 10, mat, { outline: true, thick: 0.01 });
  pole.position.y = 2.4;
  g.add(pole);
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 4.5, 0),
    new THREE.Vector3(0, 4.95, 0.5),
    new THREE.Vector3(0, 5.0, 1.0),
  ]);
  const arm = new THREE.Mesh(new THREE.TubeGeometry(curve, 12, 0.055, 6, false), mat);
  arm.castShadow = true;
  addOutline(arm, 0.008);
  g.add(arm);
  const head = box(0.42, 0.14, 0.62, toon(0x4d535b), { outline: true, thick: 0.01 });
  head.position.set(0, 4.96, 1.1);
  head.rotation.x = 0.06;
  g.add(head);
  const lens = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.5), unlit(0xfff3d6));
  lens.rotation.x = Math.PI / 2;
  lens.position.set(0, 4.88, 1.1);
  g.add(lens);

  const halo = glow(0xffe2b0, 2.7, 0.3);
  halo.position.set(0, 4.85, 1.1);
  g.add(halo);

  g.position.set(STREET_LAMP.x, SIDEWALK_Y, STREET_LAMP.z);
  root.add(g);

  const spot = new THREE.SpotLight(0xffdda8, 38, 16, Math.PI / 4.2, 0.55, 1.6);
  spot.position.set(STREET_LAMP.x, SIDEWALK_Y + 4.9, STREET_LAMP.z + 1.1);
  spot.target.position.set(STREET_LAMP.x, 0, STREET_LAMP.z + 1.6);
  root.add(spot);
  root.add(spot.target);
  return { halo, spot };
}

/* ------------------------------------------------------------ 路牌 */
function createSigns(root) {
  const g = new THREE.Group();
  const pole = cylinder(0.04, 0.045, 2.9, 8, toon(0x9aa1a8), { outline: true, thick: 0.007 });
  pole.position.set(0, 1.45, 0);
  g.add(pole);

  const stop = new THREE.Mesh(
    new THREE.PlaneGeometry(0.66, 0.66),
    new THREE.MeshBasicMaterial({ map: makeStopSignTexture(), transparent: true, side: THREE.DoubleSide })
  );
  stop.position.set(0, 2.66, 0.03);
  g.add(stop);

  const parkTex = makeRoadSign('P', '#1f5fa8', '#ffffff', 200, 260);
  const park = new THREE.Mesh(new THREE.PlaneGeometry(0.46, 0.6), new THREE.MeshBasicMaterial({ map: parkTex }));
  park.position.set(0, 1.95, 0.03);
  g.add(park);

  const plateTex = makeRoadSign('ひだまり通り', '#f2efe4', '#3c4a42', 512, 128);
  const plate = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.4), new THREE.MeshBasicMaterial({ map: plateTex }));
  plate.position.set(0.6, 3.05, 0.03);
  g.add(plate);

  g.position.set(-5.15, SIDEWALK_Y, 2.6);
  root.add(g);
}

/* ------------------------------------------------------------ 信号灯 */
function createTrafficLight(root) {
  const g = new THREE.Group();
  const mat = toon(0x5f666e);
  const pole = cylinder(0.08, 0.1, 5.5, 10, mat, { outline: true, thick: 0.012 });
  pole.position.y = 2.75;
  g.add(pole);
  const arm = box(3.6, 0.12, 0.12, mat, { outline: true, thick: 0.008 });
  arm.position.set(1.8, 5.35, 0);
  g.add(arm);
  const head = box(1.3, 0.44, 0.3, toon(0x3c434b), { outline: true, thick: 0.01 });
  head.position.set(3.3, 5.1, 0.05);
  g.add(head);
  const lensMats = [];
  const lensColors = [0xff4b3e, 0xffc23f, 0x3fe08a];
  for (let i = 0; i < 3; i++) {
    const m = new THREE.MeshBasicMaterial({ color: lensColors[i] });
    lensMats.push(m);
    const lens = new THREE.Mesh(new THREE.CircleGeometry(0.14, 16), m);
    lens.position.set(3.3 - 0.42 + i * 0.42, 5.1, 0.21);
    g.add(lens);
    const hood = box(0.36, 0.06, 0.16, toon(0x2c323a), { cast: false });
    hood.position.set(3.3 - 0.42 + i * 0.42, 5.27, 0.24);
    g.add(hood);
  }
  // 行人灯
  const pedHead = box(0.34, 0.6, 0.24, toon(0x3c434b), { outline: true, thick: 0.008 });
  pedHead.position.set(0.02, 2.55, 0.2);
  g.add(pedHead);
  const pedRed = new THREE.MeshBasicMaterial({ color: 0xff5040 });
  const pedGreen = new THREE.MeshBasicMaterial({ color: 0x44e08a });
  const pr = new THREE.Mesh(new THREE.CircleGeometry(0.1, 14), pedRed);
  pr.position.set(0.02, 2.7, 0.33);
  g.add(pr);
  const pgn = new THREE.Mesh(new THREE.CircleGeometry(0.1, 14), pedGreen);
  pgn.position.set(0.02, 2.4, 0.33);
  g.add(pgn);
  g.position.set(TRAFFIC.x, SIDEWALK_Y, TRAFFIC.z);
  root.add(g);

  const hg = glow(0x60ffa0, 1.8, 0.5);
  hg.position.set(TRAFFIC.x + 3.3, SIDEWALK_Y + 5.1, TRAFFIC.z + 0.4);
  root.add(hg);

  return { lensMats, pedRed, pedGreen, halo: hg };
}

/* ------------------------------------------------------------ 边界与环境 */
function createBoundary(root) {
  const wallMat = toon(0x77716a);
  const capMat = toon(0x5c5850);
  const hedgeMat = toon(0x33452f);

  const segment = (x, z, w, d, h = 1.1) => {
    const b = box(w, h, d, wallMat, { outline: true, thick: 0.02 });
    b.position.set(x, SIDEWALK_Y + h / 2, z);
    root.add(b);
    const cap = box(w + 0.08, 0.1, d + 0.08, capMat, { outline: true, thick: 0.01 });
    cap.position.set(x, SIDEWALK_Y + h + 0.05, z);
    root.add(cap);
    const hedge = box(w * 0.96, 0.7, d * 0.9, hedgeMat, { outline: true, thick: 0.016 });
    hedge.position.set(x, SIDEWALK_Y + h + 0.42, z);
    root.add(hedge);
  };
  // 左侧边界（避开前街路口）
  segment(-11.9, -4.0, 0.32, 15.8, 1.0);
  segment(-11.9, 10.35, 0.32, 3.1, 1.0);
  // 前方边界（避开左侧街道）
  segment(3.2, 11.9, 17.4, 0.32, 1.0);
  // 后方边界
  segment(1.25, -11.9, 13.3, 0.32, 1.0);

  // 右巷道围墙
  const alleyWall = box(0.34, 2.7, 15.8, toon(0x6f6a63), { outline: true, thick: 0.02 });
  alleyWall.position.set(11.9, SIDEWALK_Y + 1.35, -4.1);
  root.add(alleyWall);
  const alleyCap = box(0.42, 0.12, 15.9, capMat, { outline: true, thick: 0.01 });
  alleyCap.position.set(11.9, SIDEWALK_Y + 2.76, -4.1);
  root.add(alleyCap);
  // 卷帘门
  const shutter = new THREE.Mesh(
    new THREE.PlaneGeometry(3.4, 2.2),
    new THREE.MeshBasicMaterial({ map: makeShutterTexture() })
  );
  shutter.rotation.y = -Math.PI / 2;
  shutter.position.set(11.71, SIDEWALK_Y + 1.2, -6.2);
  root.add(shutter);
  // 后门路灯
  const lampBox = box(0.16, 0.24, 0.16, toon(0x4a4f56), { outline: true, thick: 0.006 });
  lampBox.position.set(11.62, 3.1, -3.4);
  root.add(lampBox);
  const alleyLampMat = new THREE.MeshBasicMaterial({ color: 0xffe6b8 });
  const lens = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 8), alleyLampMat);
  lens.position.set(11.55, 3.0, -3.4);
  root.add(lens);
  const alleyGlow = glow(0xffdca0, 2.2, 0.5);
  alleyGlow.position.set(11.4, 2.9, -3.4);
  root.add(alleyGlow);

  return { alleyLampMat, alleyGlow };
}

/* ------------------------------------------------------------ 巷子杂物 */
function createAlleyClutter(root) {
  const g = new THREE.Group();
  // 啤酒箱堆
  for (let i = 0; i < 4; i++) {
    const crate = box(0.52, 0.32, 0.36, toon(i % 2 ? 0xb64a3c : 0x3f6b9c), { outline: true, thick: 0.008 });
    crate.position.set((i % 2) * 0.06, 0.16 + Math.floor(i / 2) * 0.33, (i % 2) * 0.36);
    g.add(crate);
  }
  const ac = box(0.6, 0.5, 0.36, toon(0xc7c2b5), { outline: true, thick: 0.012 });
  ac.position.set(1.3, 0.26, 1.2);
  g.add(ac);
  const pipe = cylinder(0.05, 0.05, 2.6, 8, toon(0x8b9199), { cast: false });
  pipe.position.set(1.55, 1.4, 1.2);
  g.add(pipe);
  // 交通锥
  const cone = new THREE.Mesh(new THREE.ConeGeometry(0.17, 0.52, 10), toon(0xe0653f));
  cone.position.set(0.4, 0.26, 1.7);
  cone.castShadow = true;
  addOutline(cone, 0.008);
  g.add(cone);
  const coneBase = box(0.36, 0.04, 0.36, toon(0xd9593a), { cast: false });
  coneBase.position.set(0.4, 0.02, 1.7);
  g.add(coneBase);
  g.position.set(8.9, 0.12, -2.2);
  root.add(g);
}

/* ------------------------------------------------------------ 门口立牌 */
function createAFrame(root) {
  const g = new THREE.Group();
  const boardMat = toon(0x3b4149);
  for (const s of [-1, 1]) {
    const b = box(0.6, 0.9, 0.03, boardMat, { outline: true, thick: 0.008 });
    b.position.set(0, 0.55, s * 0.16);
    b.rotation.x = s * 0.16;
    g.add(b);
    const poster = new THREE.Mesh(
      new THREE.PlaneGeometry(0.5, 0.72),
      new THREE.MeshBasicMaterial({ map: makePosterTexture('karaage') })
    );
    poster.position.set(0, 0.55, s * 0.19);
    poster.rotation.x = s * 0.16;
    if (s === 1) poster.rotation.y = Math.PI;
    g.add(poster);
  }
  const top = box(0.62, 0.04, 0.06, boardMat, { cast: false });
  top.position.set(0, 1.0, 0);
  g.add(top);
  g.position.set(4.25, SIDEWALK_Y, 1.62);
  root.add(g);
}

/* ------------------------------------------------------------ 红色邮筒 */
function createPostBox(root) {
  const g = new THREE.Group();
  const red = new THREE.MeshToonMaterial({ color: 0xc0392b, emissive: 0x2a0806 });
  const base = cylinder(0.3, 0.34, 0.12, 12, toon(0x8e2b22), { outline: true, thick: 0.008 });
  base.position.y = 0.06;
  g.add(base);
  const body = cylinder(0.28, 0.3, 1.02, 14, red, { outline: true, thick: 0.012 });
  body.position.y = 0.62;
  g.add(body);
  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.28, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), red);
  cap.position.y = 1.13;
  cap.castShadow = true;
  addOutline(cap, 0.01);
  g.add(cap);
  const slot = box(0.34, 0.07, 0.06, toon(0x241a18), { cast: false });
  slot.position.set(0, 0.96, 0.27);
  g.add(slot);
  const plate = box(0.26, 0.16, 0.03, unlit(0xf2e8d4), { cast: false });
  plate.position.set(0, 0.68, 0.29);
  g.add(plate);
  const plate2 = box(0.26, 0.16, 0.03, unlit(0xe8dcc4), { cast: false });
  plate2.position.set(0, 0.45, 0.29);
  g.add(plate2);
  g.position.set(6.35, 0.02, 2.55);
  g.rotation.y = 0.15;
  root.add(g);
}

/* ------------------------------------------------------------ 巷内霓虹与旗帜 */
function createAlleyNeon(root) {
  const tex = makeNeonTexture();
  const face = new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide });
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 1.55), face);
  sign.rotation.y = -Math.PI / 2;
  sign.position.set(11.6, 2.5, -6.3);
  root.add(sign);
  const frame = box(0.06, 1.63, 0.7, toon(0x2a2028), { outline: true, thick: 0.008 });
  frame.position.set(11.63, 2.5, -6.3);
  root.add(frame);
  const halo = glow(0xff6f9a, 2.6, 0.4);
  halo.position.set(11.3, 2.5, -6.3);
  root.add(halo);
  const light = new THREE.PointLight(0xff77a2, 2.2, 5.5, 2);
  light.position.set(11.2, 2.3, -6.3);
  root.add(light);
  return { halo, light };
}

function createNobori(root) {
  const tex = makeNoboriTexture();
  const g = new THREE.Group();
  const pole = cylinder(0.025, 0.025, 2.5, 6, toon(0xa8aeb5), { cast: false });
  pole.position.y = 1.25;
  g.add(pole);
  const arm = box(0.36, 0.03, 0.03, toon(0xa8aeb5), { cast: false });
  arm.position.set(0.18, 2.4, 0);
  g.add(arm);
  const cloth = new THREE.Mesh(new THREE.PlaneGeometry(0.52, 1.6), new THREE.MeshBasicMaterial({ map: tex, color: 0xcfc9ba, side: THREE.DoubleSide }));
  cloth.position.set(0.28, 1.6, 0);
  g.add(cloth);
  const base = cylinder(0.16, 0.2, 0.1, 10, toon(0x4a4e54), { cast: false });
  base.position.y = 0.05;
  g.add(base);
  g.position.set(4.55, 0.02, 2.35);
  g.rotation.y = -0.12;
  root.add(g);
}

function createPottedPlant(root, x, z) {
  const g = new THREE.Group();
  const pot = cylinder(0.16, 0.2, 0.3, 10, toon(0x8a5a44), { outline: true, thick: 0.008 });
  pot.position.y = 0.15;
  g.add(pot);
  for (let i = 0; i < 6; i++) {
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.14, 6, 5), toon(0x2f5133));
    const a = (i / 6) * Math.PI * 2;
    leaf.position.set(Math.cos(a) * 0.12, 0.38 + (i % 3) * 0.1, Math.sin(a) * 0.12);
    leaf.scale.set(1, 0.7, 1);
    g.add(leaf);
  }
  g.position.set(x, 0.02, z);
  root.add(g);
}

/* ------------------------------------------------------------ 出口 */
export function createProps(scene) {
  const root = new THREE.Group();
  const pylon = createPylon(root);
  createVending(root);
  createBins(root);
  createBicycle(root, -3.55, -2.35, Math.PI / 2 + 0.06, 0x8e3f3f);
  createBicycle(root, 9.6, -1.2, Math.PI / 2 - 0.1, 0x3f5f7a, 0);
  createUmbrellaStand(root);
  createGuardrail(root, -0.4, 8.8, 4.9, 8.8);
  createGuardrail(root, 6.1, 8.8, 11.2, 8.8);
  createGuardrail(root, -10.1, 9.2, -10.1, 11.4);
  createPole(root, POLE_A.x, POLE_A.z, { transformer: true, lampArm: true });
  createPole(root, POLE_B.x, POLE_B.z, {});
  // 电线
  const y = SIDEWALK_Y;
  for (const [h, sag] of [[8.03, 0.5], [8.63, 0.6], [7.75, 0.45]]) {
    wire(root, new THREE.Vector3(POLE_A.x, y + h, POLE_A.z), new THREE.Vector3(POLE_B.x, y + h, POLE_B.z), sag);
  }
  // 引入线
  wire(root, new THREE.Vector3(POLE_A.x, y + 7.7, POLE_A.z), new THREE.Vector3(-1.2, 6.7, 0.85), 0.6, 0.015);
  wire(root, new THREE.Vector3(POLE_A.x, y + 7.4, POLE_A.z), new THREE.Vector3(2.6, 6.72, 0.9), 0.7, 0.015);
  wire(root, new THREE.Vector3(POLE_A.x, y + 7.4, POLE_A.z), new THREE.Vector3(-2.6, 6.9, -3.2), 0.8, 0.013);

  const lamp = createStreetLamp(root);
  createSigns(root);
  const traffic = createTrafficLight(root);
  const boundary = createBoundary(root);
  createAlleyClutter(root);
  createAFrame(root);
  const neon = createAlleyNeon(root);
  createNobori(root);
  createPostBox(root);
  createPottedPlant(root, 10.15, 3.35);
  createPottedPlant(root, -5.15, 1.55);
  scene.add(root);
  return { pylon, lamp, traffic, boundary, neon };
}
