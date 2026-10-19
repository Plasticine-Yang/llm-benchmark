import * as THREE from 'three';
import { L, SLAB, LAYER } from './layout.js';
import {
  toon, glowMat, box, rbox, boxMM, mesh, cyl, plane, rod, G, Batch, UNIT, rng, pick, noOutline, instanceGlowToon,
} from './util.js';
import { glassMat, shared } from './materials.js';
import * as T from './textures.js';

const F = SLAB; // interior floor
const S = L.shop;

const PALETTE = ['#ff5a5a', '#ffb03a', '#ffe14d', '#59c96b', '#3fa7ff', '#6b6bff', '#ff7fc0', '#ffffff', '#ff8a3d', '#22c6b8', '#c46bff', '#e8e2d0', '#d64040', '#2f7de1'];
const DRINKS = ['#ffffff', '#ff6464', '#ffd23a', '#3fb36b', '#2f7de1', '#ff9a3d', '#9fd9ff', '#c88a4a', '#1c2a44', '#ff7fb0', '#e9f7ff', '#7a4a2a'];

let RBOX_UNIT = null;
function rboxUnit() {
  if (!RBOX_UNIT) {
    RBOX_UNIT = G.rbox(1, 1, 1, 0.18, 2).clone();
    RBOX_UNIT.translate(0, 0.5, 0);
  }
  return RBOX_UNIT;
}

export function buildShop(scene, updaters, lights) {
  const root = new THREE.Group();
  root.name = 'shop';
  scene.add(root);
  const r = rng(2024);

  const prodMat = instanceGlowToon(null, 0.22);
  const bottleMat = instanceGlowToon(null, 0.35);
  const B = {
    box: new Batch(UNIT.box, prodMat),
    bag: new Batch(rboxUnit(), prodMat),
    cyl: new Batch(UNIT.cyl, bottleMat),
    cup: new Batch(UNIT.cup, prodMat),
    tri: new Batch(UNIT.tri, prodMat),
    ball: new Batch(UNIT.sphere, prodMat),
  };

  const M = {
    wallOut: toon('#e9e4da', { map: T.sidingTexture('#e6e0d4'), unique: true }),
    wallIn: toon('#f4f1ea', { glow: 0.28 }),
    frame: toon('#b9c0c8'),
    frameDark: toon('#59606b'),
    kick: toon('#3d4450'),
    ceiling: toon('#fbfaf6', { glow: 0.38 }),
    shelf: toon('#f2f2f0', { glow: 0.26 }),
    shelfDark: toon('#5d6470', { glow: 0.2 }),
    counter: toon('#f7f3ea', { glow: 0.24 }),
    counterTop: toon('#d8cfc0', { glow: 0.3 }),
    steel: toon('#c3c9d0', { glow: 0.3 }),
    black: toon('#22262d', { glow: 0.12 }),
    teal: toon(T.BRAND.teal, { glow: 0.35 }),
    orange: toon(T.BRAND.orange, { glow: 0.35 }),
    roof: new THREE.MeshBasicMaterial({ color: new THREE.Color('#4c505b') }),
    parapet: toon('#dcd7cc'),
  };

  // ======================================================== floor & ceiling
  const fl = T.floorTexture(S.x1 - S.x0, S.z1 - S.z0);
  const g2l = (x, z) => ({ x: x - S.x0, z: z - S.z0 });
  const guides = [];
  for (let i = 0; i < 4; i++) guides.push({ type: 'foot', ...g2l(1.65, -0.75 + i * 0.4), rot: 0 });
  guides.push({ type: 'label', ...g2l(1.3, -0.55), text: 'レジ待ち', rot: -Math.PI / 2 });
  guides.push({ type: 'arrow', ...g2l(1.35, 0.55), rot: 0 });
  guides.push({ type: 'arrow', ...g2l(0.2, -0.4), rot: -Math.PI / 2 });
  guides.push({ type: 'line', ...g2l(0.85, -0.98), w: 1.7, d: 0.04 });
  const floorTex = T.finishFloor(fl, guides);
  const floorMat = toon('#ffffff', { map: floorTex, glow: 0.3, unique: true });
  const floor = mesh(root, G.plane(S.x1 - S.x0, S.z1 - S.z0), floorMat, (S.x0 + S.x1) / 2, F + 0.004, (S.z0 + S.z1) / 2, [-Math.PI / 2, 0, 0]);
  floor.name = 'shopFloor';

  const CEIL = 2.9;
  plane(root, S.x1 - S.x0, S.z1 - S.z0, M.ceiling, (S.x0 + S.x1) / 2, CEIL, (S.z0 + S.z1) / 2, 0, Math.PI / 2);
  // light strips
  const tubes = [];
  const tubeMat = glowMat('#fffaf0', 2.2);
  for (const x of [-2.3, -1.1, 0.1, 1.3]) {
    const t = box(root, 0.12, 0.04, 3.2, tubeMat, x, CEIL - 0.05, -1.1);
    noOutline(t);
    tubes.push(t);
    box(root, 0.18, 0.03, 3.3, M.steel, x, CEIL - 0.02, -1.1);
  }

  // ======================================================== shell walls
  const WT = 0.1;
  // left wall (alley side)
  boxMM(root, S.x0, F, S.z0, S.x0 + WT, CEIL + 0.15, S.z1, M.wallIn);
  // back wall
  boxMM(root, S.x0, F, S.z0, S.x1, CEIL + 0.15, S.z0 + WT, M.wallIn);
  // outer skins (siding)
  const sideSkin = (w, h, x, y, z, ry) => {
    const t = T.sidingTexture('#e6e0d4');
    t.repeat.set(w / 1.6, h / 1.6);
    const m = toon('#ffffff', { map: t, unique: true });
    plane(root, w, h, m, x, y, z, ry);
  };
  sideSkin(S.z1 - S.z0, CEIL + 0.15 - F, S.x0 - 0.002, (CEIL + 0.15 + F) / 2, (S.z0 + S.z1) / 2, -Math.PI / 2);
  sideSkin(S.x1 - S.x0, CEIL + 0.15 - F, (S.x0 + S.x1) / 2, (CEIL + 0.15 + F) / 2, S.z0 - 0.002, Math.PI);
  // side solid section (rear part of the right facade)
  const SIDE_GLASS_Z0 = -1.95;
  boxMM(root, S.x1 - WT, F, S.z0, S.x1, CEIL + 0.15, SIDE_GLASS_Z0, M.wallIn);
  sideSkin(SIDE_GLASS_Z0 - S.z0, CEIL + 0.15 - F, S.x1 + 0.002, (CEIL + 0.15 + F) / 2, (S.z0 + SIDE_GLASS_Z0) / 2, Math.PI / 2);
  // back room partition
  const PZ = -2.0, PX = 1.2;
  boxMM(root, PX, F, PZ - 0.06, S.x1, CEIL, PZ, M.wallIn);
  boxMM(root, PX, F, S.z0, PX + 0.06, CEIL, PZ, M.wallIn);

  // ======================================================== facades (glass)
  const GL_Y0 = F + 0.14, GL_Y1 = 2.35, HEAD = 2.42;
  const DOOR = { x0: 0.75, x1: 1.95, h: 2.15 };
  // kick plates & header beams
  boxMM(root, S.x0, F, S.z1 - 0.08, S.x1, GL_Y0, S.z1, M.kick);
  boxMM(root, S.x1 - 0.08, F, SIDE_GLASS_Z0, S.x1, GL_Y0, S.z1, M.kick);
  boxMM(root, S.x0, GL_Y1, S.z1 - 0.1, S.x1, HEAD, S.z1, M.frame);
  boxMM(root, S.x1 - 0.1, GL_Y1, SIDE_GLASS_Z0, S.x1, HEAD, S.z1, M.frame);
  // above header: inner wall to ceiling
  boxMM(root, S.x0, HEAD, S.z1 - 0.1, S.x1, CEIL + 0.15, S.z1 - 0.04, M.wallIn);
  boxMM(root, S.x1 - 0.1, HEAD, SIDE_GLASS_Z0, S.x1 - 0.04, CEIL + 0.15, S.z1, M.wallIn);
  // corner post & mullions
  boxMM(root, S.x1 - 0.1, F, S.z1 - 0.1, S.x1, HEAD, S.z1, M.frame);
  boxMM(root, S.x0, F, S.z1 - 0.1, S.x0 + 0.1, HEAD, S.z1, M.frame);
  const frontMullions = [-2.0, -0.8, DOOR.x0 - 0.04, DOOR.x1 + 0.04];
  for (const x of frontMullions) boxMM(root, x - 0.035, GL_Y0, S.z1 - 0.08, x + 0.035, GL_Y1, S.z1 - 0.01, M.frame);
  for (const z of [-0.95, 0.0]) boxMM(root, S.x1 - 0.08, GL_Y0, z - 0.035, S.x1 - 0.01, GL_Y1, z + 0.035, M.frame);
  // transom above the door
  boxMM(root, DOOR.x0, DOOR.h, S.z1 - 0.08, DOOR.x1, DOOR.h + 0.05, S.z1 - 0.01, M.frame);
  // door sensor
  box(root, 0.36, 0.08, 0.1, M.black, (DOOR.x0 + DOOR.x1) / 2, DOOR.h + 0.06, S.z1 + 0.02);
  const sensorLed = box(root, 0.04, 0.02, 0.01, glowMat('#ff3030', 2), (DOOR.x0 + DOOR.x1) / 2 + 0.12, DOOR.h + 0.09, S.z1 + 0.071);
  noOutline(sensorLed);

  // fixed glass panes
  const gm = glassMat({ alpha: 0.07, top: GL_Y1 });
  const pane = (x0, x1, z, y0 = GL_Y0, y1 = GL_Y1) => {
    const p = plane(root, x1 - x0, y1 - y0, gm, (x0 + x1) / 2, (y0 + y1) / 2, z);
    p.layers.set(LAYER.FX);
    p.renderOrder = 2;
    return p;
  };
  pane(S.x0 + 0.1, DOOR.x0 - 0.04, S.z1 - 0.045);
  pane(DOOR.x1 + 0.04, S.x1 - 0.1, S.z1 - 0.045);
  pane(DOOR.x0, DOOR.x1, S.z1 - 0.045, DOOR.h + 0.05, GL_Y1);
  const sp = plane(root, S.z1 - 0.1 - SIDE_GLASS_Z0, GL_Y1 - GL_Y0, gm, S.x1 - 0.045, (GL_Y0 + GL_Y1) / 2, (SIDE_GLASS_Z0 + S.z1 - 0.1) / 2, Math.PI / 2);
  sp.layers.set(LAYER.FX);
  sp.renderOrder = 2;

  // ======================================================== automatic doors
  const doorGroup = new THREE.Group();
  root.add(doorGroup);
  const leafW = (DOOR.x1 - DOOR.x0) / 2 + 0.02;
  const leafH = DOOR.h - F - 0.01;
  const leaves = [];
  const leafGlass = glassMat({ alpha: 0.08, top: DOOR.h });
  const stickerAuto = T.stickerTexture('自動ドア', '#16a6a0', '#ffffff', 256, 64);
  const stickerOpen = T.stickerTexture('OPEN 24H', '#ff8a3d', '#ffffff', 256, 64);
  for (let i = 0; i < 2; i++) {
    const leaf = new THREE.Group();
    const cx = DOOR.x0 + leafW / 2 + i * (leafW - 0.04);
    leaf.position.set(cx, F, S.z1 - 0.03);
    leaf.userData.base = cx;
    leaf.userData.dir = i === 0 ? -1 : 1;
    doorGroup.add(leaf);
    const fr = 0.035;
    box(leaf, leafW, fr, 0.035, M.frame, 0, 0, 0);
    box(leaf, leafW, fr, 0.035, M.frame, 0, leafH - fr, 0);
    box(leaf, fr, leafH, 0.035, M.frame, -leafW / 2 + fr / 2, 0, 0);
    box(leaf, fr, leafH, 0.035, M.frame, leafW / 2 - fr / 2, 0, 0);
    const gp = plane(leaf, leafW - fr * 2, leafH - fr * 2, leafGlass, 0, leafH / 2, 0.004);
    gp.layers.set(LAYER.FX);
    gp.renderOrder = 3;
    const st = plane(leaf, 0.36, 0.09, toon('#ffffff', { map: i ? stickerOpen : stickerAuto, glow: 0.3, unique: true }), 0, 1.05, 0.022);
    noOutline(st);
    leaves.push(leaf);
  }
  const doorState = { t: 0, open: 0, next: 4, phase: 'closed', hold: 0 };
  updaters.push((dt, time) => {
    const s = doorState;
    s.next -= dt;
    if (s.phase === 'closed' && s.next <= 0) { s.phase = 'opening'; }
    if (s.phase === 'opening') { s.open = Math.min(1, s.open + dt / 0.9); if (s.open >= 1) { s.phase = 'open'; s.hold = 2.2 + Math.random() * 1.5; } }
    else if (s.phase === 'open') { s.hold -= dt; if (s.hold <= 0) s.phase = 'closing'; }
    else if (s.phase === 'closing') { s.open = Math.max(0, s.open - dt / 1.2); if (s.open <= 0) { s.phase = 'closed'; s.next = 7 + Math.random() * 8; } }
    const e = s.open * s.open * (3 - 2 * s.open);
    for (const lf of leaves) lf.position.x = lf.userData.base + lf.userData.dir * e * (leafW - 0.06);
    sensorLed.material.color.setRGB(e > 0.01 ? 0.3 : 2, e > 0.01 ? 2 : 0.3, 0.3);
  });

  // door mat
  const matTex = T.stickerTexture('いらっしゃいませ', '#2b3240', '#9fe0da', 512, 160);
  const dm = plane(root, 1.15, 0.5, toon('#ffffff', { map: matTex, unique: true }), (DOOR.x0 + DOOR.x1) / 2, F + 0.012, S.z1 + 0.35, 0, -Math.PI / 2);
  box(root, 1.2, 0.01, 0.55, toon('#1e232b'), (DOOR.x0 + DOOR.x1) / 2, F, S.z1 + 0.35);
  dm.layers.set(LAYER.NO_OUTLINE);
  // interior mat
  const im = plane(root, 1.1, 0.5, toon('#3a4252', { glow: 0.2 }), (DOOR.x0 + DOOR.x1) / 2, F + 0.009, S.z1 - 0.4, 0, -Math.PI / 2);
  im.layers.set(LAYER.NO_OUTLINE);

  // ======================================================== fascia sign & canopy
  const signY0 = 2.44, signY1 = 3.0;
  const fasciaFront = T.fasciaTexture(2048, true);
  const fasciaSide = T.fasciaTexture(1536, false);
  const signMats = [];
  const mkSign = (map, k) => {
    const m = glowMat('#ffffff', k, { map });
    m.userData.k = k;
    signMats.push(m);
    return m;
  };
  boxMM(root, S.x0 - 0.05, signY0 - 0.02, S.z1, S.x1 + 0.12, signY1 + 0.04, S.z1 + 0.12, M.parapet);
  boxMM(root, S.x1, signY0 - 0.02, S.z0, S.x1 + 0.12, signY1 + 0.04, S.z1 + 0.12, M.parapet);
  const sf = plane(root, S.x1 - S.x0 + 0.1, signY1 - signY0, mkSign(fasciaFront, 0.95), (S.x0 + S.x1 + 0.07) / 2, (signY0 + signY1) / 2, S.z1 + 0.122);
  const ss = plane(root, S.z1 - S.z0 + 0.06, signY1 - signY0, mkSign(fasciaSide, 0.95), S.x1 + 0.122, (signY0 + signY1) / 2, (S.z0 + S.z1 + 0.06) / 2, Math.PI / 2);
  sf.name = 'fasciaFront';
  ss.name = 'fasciaSide';

  // canopy (front + side, sloping down outwards)
  const canopyMat = toon('#f3efe6');
  const canopyUnder = toon('#d9d4ca', { glow: 0.15 });
  const trim = toon(T.BRAND.teal, { glow: 0.2 });
  const CD = L.canopy.depth, CY = L.canopy.y, slope = 0.12;
  const front = new THREE.Group();
  front.position.set((S.x0 + S.x1 + 0.12) / 2, CY, S.z1 + 0.12);
  front.rotation.x = slope;
  root.add(front);
  box(front, S.x1 - S.x0 + 0.17 + CD, 0.05, CD, canopyMat, CD / 2, 0, CD / 2);
  box(front, S.x1 - S.x0 + 0.17 + CD, 0.09, 0.04, trim, CD / 2, -0.04, CD);
  const side = new THREE.Group();
  side.position.set(S.x1 + 0.12, CY, (SIDE_GLASS_Z0 - 0.1 + S.z1 + 0.12) / 2);
  side.rotation.z = -slope;
  root.add(side);
  const sideLen = S.z1 + 0.12 - SIDE_GLASS_Z0 + 0.1;
  box(side, CD, 0.05, sideLen, canopyMat, CD / 2, 0, 0);
  box(side, 0.04, 0.09, sideLen, trim, CD, -0.04, 0);
  // underside downlights
  const dl = glowMat('#fff2d6', 2.4);
  for (let x = S.x0 + 0.4; x < S.x1; x += 1.1) {
    const d = mesh(front, G.cyl(0.06, 0.06, 0.012, 12), dl, x - (S.x0 + S.x1 + 0.12) / 2, -0.03, CD * 0.45);
    noOutline(d);
  }
  for (let z = -1.6; z < 1.0; z += 1.0) {
    const d = mesh(side, G.cyl(0.06, 0.06, 0.012, 12), dl, CD * 0.45, -0.03, z - (SIDE_GLASS_Z0 - 0.1 + S.z1 + 0.12) / 2);
    noOutline(d);
  }
  // drip line data for the rain module
  const frontEdgeZ = S.z1 + 0.12 + CD * Math.cos(slope);
  const frontEdgeY = CY - CD * Math.sin(slope) - 0.06;
  const sideEdgeX = S.x1 + 0.12 + CD * Math.cos(slope);

  // flicker of signs
  const flick = { t: 0, until: 0, next: 3 };
  updaters.push((dt, time) => {
    flick.next -= dt;
    let k = 1 + 0.025 * Math.sin(time * 50) * Math.sin(time * 1.3);
    if (flick.next <= 0) { flick.until = 0.35 + Math.random() * 0.5; flick.next = 4 + Math.random() * 7; }
    if (flick.until > 0) {
      flick.until -= dt;
      k = Math.random() < 0.45 ? 0.55 + Math.random() * 0.25 : 1;
    }
    for (const m of signMats) m.color.setScalar(m.userData.k * k);
  });

  // ======================================================== roof
  boxMM(root, S.x0 - 0.05, CEIL + 0.15, S.z0 - 0.05, S.x1 + 0.05, CEIL + 0.2, S.z1 + 0.05, M.roof);
  // parapet on the back & left
  boxMM(root, S.x0 - 0.05, CEIL + 0.2, S.z0 - 0.05, S.x1 + 0.05, signY1 + 0.04, S.z0 + 0.05, M.parapet);
  boxMM(root, S.x0 - 0.05, CEIL + 0.2, S.z0 - 0.05, S.x0 + 0.05, signY1 + 0.04, S.z1, M.parapet);
  // rooftop units
  const unitMat = toon('#cfd3d8');
  for (const [x, z] of [[-2.2, -2.2], [-1.1, -2.2]]) {
    rbox(root, 0.8, 0.55, 0.42, unitMat, x, CEIL + 0.2, z, 0.03);
    const fan = mesh(root, G.cyl(0.17, 0.17, 0.01, 18), toon('#2b2f36'), x, CEIL + 0.2 + 0.3, z + 0.212, [Math.PI / 2, 0, 0]);
    fan.name = 'roofFan';
    updaters.push((dt) => { fan.rotation.y += dt * 4; });
  }
  rod(root, [-2.2, CEIL + 0.3, -1.98], [-2.2, CEIL + 0.3, -1.3], 0.025, toon('#9aa0a8'));
  rod(root, [-2.2, CEIL + 0.3, -1.3], [0.4, CEIL + 0.3, -1.3], 0.025, toon('#9aa0a8'));
  box(root, 0.5, 0.25, 0.5, toon('#b8bcc2'), 0.9, CEIL + 0.2, -2.3);
  cyl(root, 0.1, 0.3, toon('#8f949b'), 1.7, CEIL + 0.2, -0.4, 12);
  mesh(root, G.cyl(0.16, 0.16, 0.04, 14), toon('#6e737a'), 1.7, CEIL + 0.52, -0.4);
  // roof puddle tint
  const rp = plane(root, 2.0, 1.2, new THREE.MeshBasicMaterial({ color: new THREE.Color('#3a3e48') }), 0.2, CEIL + 0.205, -0.4, 0, -Math.PI / 2);
  rp.layers.set(LAYER.NO_OUTLINE);

  // ======================================================== interior lights
  const pl1 = new THREE.PointLight('#ffe9c7', 4.5, 7, 1.6);
  pl1.position.set(-1.2, 2.6, -0.9);
  const pl2 = new THREE.PointLight('#fff1d8', 3.5, 6, 1.6);
  pl2.position.set(1.3, 2.6, -0.4);
  root.add(pl1, pl2);
  // spill to the outside
  const spill = new THREE.PointLight('#ffd9a0', 3.2, 6.5, 1.5);
  spill.position.set(-0.6, 1.4, 1.5);
  const spill2 = new THREE.PointLight('#ffd9a0', 2.2, 5, 1.5);
  spill2.position.set(3.0, 1.4, -0.5);
  root.add(spill, spill2);
  lights.push(pl1, pl2, spill, spill2);

  // ======================================================== drink cooler (back wall)
  {
    const x0 = -2.6, x1 = PX - 0.02, z0 = S.z0 + WT, z1 = S.z0 + WT + 0.62, y1 = F + 2.05;
    const n = 7;
    const dw = (x1 - x0) / n;
    boxMM(root, x0, F, z0, x1, F + 0.12, z1, M.black);
    boxMM(root, x0, y1, z0, x1, y1 + 0.32, z1, M.black);
    const hdr = T.stickerTexture('つめた〜いドリンク  COLD DRINKS', '#1f6fbf', '#ffffff', 1024, 96);
    const h = plane(root, x1 - x0 - 0.1, 0.24, glowMat('#ffffff', 1.1, { map: hdr }), (x0 + x1) / 2, y1 + 0.16, z1 + 0.002);
    noOutline(h);
    // glowing back panel
    plane(root, x1 - x0, y1 - F - 0.12, glowMat('#eef6ff', 1.05), (x0 + x1) / 2, (F + 0.12 + y1) / 2, z0 + 0.01);
    // shelves & bottles
    const shelfYs = [0.16, 0.52, 0.88, 1.24, 1.6];
    for (const sy of shelfYs) {
      const y = F + sy;
      box(root, x1 - x0, 0.02, z1 - z0 - 0.05, M.steel, (x0 + x1) / 2, y, (z0 + z1) / 2 - 0.02);
      const tall = sy < 0.5 ? 0.3 : sy > 1.5 ? 0.18 : 0.24;
      for (let x = x0 + 0.04; x < x1 - 0.03; x += 0.07) {
        const col = pick(r, DRINKS);
        const can = tall < 0.2;
        for (let k = 0; k < 2; k++) {
          const z = z1 - 0.12 - k * 0.16;
          B.cyl.add(x, y + 0.02, z, 0.055, can ? 0.15 : tall, 0.055, col);
          if (!can) B.cyl.add(x, y + 0.02 + tall, z, 0.025, 0.035, 0.025, '#f4f4f4');
        }
      }
    }
    // door frames and handles
    for (let i = 0; i <= n; i++) {
      const x = x0 + i * dw;
      boxMM(root, x - 0.02, F + 0.12, z1 - 0.02, x + 0.02, y1, z1 + 0.02, M.black);
    }
    for (let i = 0; i < n; i++) {
      const hx = x0 + i * dw + (i % 2 ? 0.07 : dw - 0.07);
      box(root, 0.025, 0.7, 0.04, M.steel, hx, F + 0.75, z1 + 0.04);
      const pr = plane(root, 0.12, 0.05, toon('#ffffff', { map: T.stickerTexture(i % 2 ? '¥140' : '¥160', '#ffe14d', '#d8232a', 128, 48), glow: 0.4, unique: true }), x0 + i * dw + dw / 2, F + 1.85, z1 + 0.025);
      noOutline(pr);
    }
    const cg = plane(root, x1 - x0, y1 - F - 0.12, glassMat({ alpha: 0.05, drops: 0, tint: 0xe0f2ff }), (x0 + x1) / 2, (F + 0.12 + y1) / 2, z1 + 0.012);
    cg.layers.set(LAYER.FX);
  }

  // ======================================================== bento / onigiri case (left wall)
  {
    const x0 = S.x0 + WT, x1 = x0 + 0.58, z0 = -2.75, z1 = 0.05;
    boxMM(root, x0, F, z0, x1, F + 0.42, z1, M.shelfDark);
    boxMM(root, x0, F + 0.42, z0, x0 + 0.08, F + 1.95, z1, M.shelf);
    boxMM(root, x0, F + 1.75, z0, x1 - 0.05, F + 1.95, z1, M.shelf);
    boxMM(root, x0, F + 0.42, z0 - 0.04, x1, F + 1.95, z0, M.shelf);
    boxMM(root, x0, F + 0.42, z1, x1, F + 1.95, z1 + 0.04, M.shelf);
    const sg = T.stickerTexture('おにぎり・お弁当・サンド', '#2c8a3c', '#ffffff', 1024, 120);
    const s = plane(root, z1 - z0 - 0.1, 0.17, glowMat('#ffffff', 1.1, { map: sg }), x1 - 0.049, F + 1.85, (z0 + z1) / 2, Math.PI / 2);
    noOutline(s);
    plane(root, z1 - z0, 1.33, glowMat('#fff7e8', 0.95), x0 + 0.081, F + 1.08, (z0 + z1) / 2, Math.PI / 2);
    const lamp = box(root, 0.04, 0.03, z1 - z0 - 0.1, glowMat('#ffffff', 2), x1 - 0.12, F + 1.72, (z0 + z1) / 2);
    noOutline(lamp);
    const decks = [0.45, 0.78, 1.1, 1.42];
    decks.forEach((dy, di) => {
      const y = F + dy;
      const depth = 0.48 - di * 0.06;
      box(root, depth, 0.02, z1 - z0, M.steel, x0 + 0.08 + depth / 2, y, (z0 + z1) / 2);
      box(root, 0.015, 0.05, z1 - z0, toon('#ffe14d', { glow: 0.5 }), x0 + 0.08 + depth, y, (z0 + z1) / 2);
      for (let z = z0 + 0.08; z < z1 - 0.05; z += 0.11) {
        if (di === 0) {
          // bento boxes
          const col = pick(r, ['#e04a2a', '#2c8a3c', '#d9862e', '#1c2a44', '#ffffff']);
          B.box.add(x0 + 0.2, y + 0.02, z, 0.2, 0.05, 0.1, '#1b1b1b');
          B.box.add(x0 + 0.2, y + 0.07, z, 0.19, 0.012, 0.095, col);
          B.box.add(x0 + 0.42, y + 0.02, z, 0.2, 0.05, 0.1, '#1b1b1b');
          B.box.add(x0 + 0.42, y + 0.07, z, 0.19, 0.012, 0.095, pick(r, ['#d9862e', '#f2c230', '#5fbf4a']));
        } else if (di === 1) {
          // sandwiches + noodles
          if (r() < 0.5) B.tri.add(x0 + 0.3, y + 0.02, z, 0.08, 0.16, 0.12, pick(r, ['#fff3c4', '#ffd6a0', '#e6f7d6']), Math.PI / 2);
          else B.cyl.add(x0 + 0.3, y + 0.02, z, 0.1, 0.06, 0.1, pick(r, ['#f2e3c0', '#e8d6b0']));
          B.box.add(x0 + 0.45, y + 0.02, z, 0.1, 0.11, 0.08, pick(r, ['#ffffff', '#ff7fb0', '#ffe14d', '#9fd9ff']));
        } else {
          // onigiri rows
          for (const xx of [0.18, 0.3, 0.42].slice(0, di === 3 ? 2 : 3)) {
            B.tri.add(x0 + xx, y + 0.02, z, 0.09, 0.12, 0.09, '#fbfbf6', Math.PI / 2);
            B.box.add(x0 + xx + 0.002, y + 0.02, z, 0.05, 0.05, 0.092, '#1d2b22', Math.PI / 2);
            B.box.add(x0 + xx + 0.003, y + 0.09, z, 0.04, 0.012, 0.093, pick(r, ['#e04a2a', '#2f7de1', '#2c8a3c', '#f2c230']), Math.PI / 2);
          }
        }
      }
    });
  }

  // ======================================================== gondolas
  for (const gx of [-1.75, -0.45]) {
    const z0 = -1.95, z1 = 0.05, W = 0.6, H = 1.35;
    boxMM(root, gx - W / 2, F, z0, gx + W / 2, F + 0.1, z1, M.shelfDark);
    boxMM(root, gx - 0.03, F + 0.1, z0, gx + 0.03, F + H, z1, M.shelf);
    box(root, W + 0.04, 0.03, z1 - z0 + 0.02, M.shelf, gx, F + H, (z0 + z1) / 2);
    const levels = [0.1, 0.42, 0.74, 1.06];
    for (const side of [-1, 1]) {
      levels.forEach((ly, li) => {
        const y = F + ly;
        const sx = gx + side * (W / 4 + 0.015);
        if (li > 0) box(root, W / 2 - 0.03, 0.02, z1 - z0, M.shelf, sx, y, (z0 + z1) / 2);
        const strip = box(root, 0.012, 0.04, z1 - z0, toon(li % 2 ? '#ffe14d' : '#ffffff', { glow: 0.5 }), gx + side * (W / 2 - 0.01), y - 0.01, (z0 + z1) / 2);
        noOutline(strip);
        const kind = (Math.floor((gx + 3) * 3) + li + (side > 0 ? 1 : 0)) % 4;
        for (let z = z0 + 0.06; z < z1 - 0.04;) {
          const col = pick(r, PALETTE);
          if (kind === 0) {
            // snack bags
            const w = 0.12 + r() * 0.05;
            B.bag.add(sx + side * 0.02, y + 0.02, z + w / 2, 0.07, 0.2 + r() * 0.06, w, col, 0, 0, side * 0.12);
            z += w + 0.012;
          } else if (kind === 1) {
            // cup noodles
            for (const dx of [-0.07, 0.06]) B.cup.add(sx + side * dx, y + 0.02, z + 0.05, 0.1, 0.12, 0.1, col);
            B.cup.add(sx + side * 0.06, y + 0.14, z + 0.05, 0.1, 0.12, 0.1, col);
            z += 0.115;
          } else if (kind === 2) {
            // boxes (biscuits, tissue)
            const w = 0.08 + r() * 0.06;
            B.box.add(sx, y + 0.02, z + w / 2, 0.2, 0.12 + r() * 0.12, w, col);
            z += w + 0.01;
          } else {
            // bottles / daily goods
            B.cyl.add(sx + side * 0.04, y + 0.02, z + 0.04, 0.07, 0.16 + r() * 0.08, 0.07, col);
            B.cyl.add(sx - side * 0.05, y + 0.02, z + 0.04, 0.07, 0.14 + r() * 0.06, 0.07, col);
            z += 0.09;
          }
        }
      });
    }
    // end cap facing the window
    boxMM(root, gx - W / 2, F, z1, gx + W / 2, F + 1.0, z1 + 0.3, M.shelf);
    for (let i = 0; i < 3; i++) for (let k = 0; k < 2; k++) {
      B.box.add(gx - 0.18 + i * 0.18, F + 1.0, z1 + 0.08 + k * 0.14, 0.15, 0.13, 0.12, gx < -1 ? '#ff7fb0' : '#ffb03a');
      B.box.add(gx - 0.18 + i * 0.18, F + 1.13, z1 + 0.08 + k * 0.14, 0.15, 0.13, 0.12, gx < -1 ? '#ffffff' : '#ff5a5a');
    }
    const pop = plane(root, 0.5, 0.24, toon('#ffffff', { map: T.stickerTexture(gx < -1 ? '新商品!' : '期間限定', gx < -1 ? '#d9437a' : '#e2552e', '#ffffff', 256, 120), glow: 0.5, unique: true }), gx, F + 0.62, z1 + 0.302);
    noOutline(pop);
    // hanging aisle sign
    const hs = T.stickerTexture(gx < -1 ? 'お菓子・パン' : '日用品・カップ麺', '#16a6a0', '#ffffff', 512, 110);
    rod(root, [gx, CEIL, -0.9], [gx, 2.42, -0.9], 0.006, M.steel);
    const sgn = box(root, 0.04, 0.22, 1.0, M.teal, gx, 2.22, -0.9);
    plane(root, 1.0, 0.22, glowMat('#ffffff', 1, { map: hs }), gx + 0.021, 2.33, -0.9, Math.PI / 2);
    plane(root, 1.0, 0.22, glowMat('#ffffff', 1, { map: hs }), gx - 0.021, 2.33, -0.9, -Math.PI / 2);
    sgn.position.y = 2.33;
  }

  // ======================================================== counter
  {
    const x0 = 0.9, x1 = 2.45, z0 = -1.55, z1 = -1.05, h = 0.92;
    boxMM(root, x0, F, z0, x1, F + h, z1, M.counter);
    boxMM(root, x0 - 0.02, F + h, z0 - 0.02, x1 + 0.02, F + h + 0.04, z1 + 0.04, M.counterTop);
    boxMM(root, x0, F, z1, x1, F + 0.08, z1 + 0.02, M.black);
    const ct = T.fasciaTexture(1024, false);
    const panel = plane(root, x1 - x0 - 0.1, 0.18, toon('#ffffff', { map: ct, glow: 0.5, unique: true }), (x0 + x1) / 2, F + 0.65, z1 + 0.002);
    noOutline(panel);
    const top = F + h + 0.04;
    // POS registers
    for (const x of [1.25, 2.1]) {
      box(root, 0.3, 0.1, 0.26, M.black, x, top, z0 + 0.2);
      const scr = mesh(root, G.box(0.28, 0.2, 0.02), M.black, x, top + 0.24, z0 + 0.18, [-0.35, 0, 0]);
      const glow = mesh(root, G.plane(0.24, 0.16), glowMat('#7fd3ff', 1.4), x, top + 0.245, z0 + 0.193, [-0.35, 0, 0]);
      noOutline(glow);
      const cd = mesh(root, G.plane(0.14, 0.09), glowMat('#4be38a', 1.2), x + 0.05, top + 0.2, z0 + 0.163, [-0.35, Math.PI, 0]);
      noOutline(cd);
      box(root, 0.18, 0.04, 0.14, M.steel, x - 0.18, top, z1 - 0.12);
      box(root, 0.1, 0.12, 0.08, M.black, x + 0.18, top, z1 - 0.12);
    }
    // hot snack case
    {
      const cx = 1.68, w = 0.5, d = 0.34, hh = 0.36;
      box(root, w, 0.04, d, M.black, cx, top, (z0 + z1) / 2);
      box(root, w, 0.04, d, M.orange, cx, top + hh, (z0 + z1) / 2);
      const hg = box(root, w - 0.02, hh - 0.04, d - 0.02, glassMat({ alpha: 0.12, drops: 0, tint: 0xfff0d0 }), cx, top + 0.04, (z0 + z1) / 2);
      hg.layers.set(LAYER.FX);
      const inner = box(root, w - 0.04, 0.01, d - 0.04, glowMat('#ffcf80', 1.3), cx, top + 0.05, (z0 + z1) / 2);
      noOutline(inner);
      for (let i = 0; i < 6; i++) {
        B.ball.add(cx - 0.18 + (i % 3) * 0.18, top + 0.07, (z0 + z1) / 2 + (i < 3 ? -0.06 : 0.06), 0.1, 0.08, 0.1, pick(r, ['#d9862e', '#c86a2a', '#e7b04a']));
        B.ball.add(cx - 0.18 + (i % 3) * 0.18, top + 0.19, (z0 + z1) / 2 + (i < 3 ? -0.06 : 0.06), 0.1, 0.08, 0.1, pick(r, ['#fff6e8', '#f3e2b8']));
      }
      box(root, w - 0.04, 0.015, d - 0.04, M.steel, cx, top + 0.17, (z0 + z1) / 2);
      const hl = new THREE.PointLight('#ffb060', 1.2, 1.5, 2);
      hl.position.set(cx, top + 0.25, z1 + 0.1);
      root.add(hl);
    }
    // oden pot (on the counter, customer side)
    {
      const cx = 1.0, cz = -1.2;
      box(root, 0.36, 0.14, 0.3, M.steel, cx + 0.05, top, cz);
      const broth = box(root, 0.32, 0.01, 0.26, toon('#d9a64a', { glow: 0.6 }), cx + 0.05, top + 0.13, cz);
      noOutline(broth);
      for (const dx of [-0.05, 0.05]) box(root, 0.005, 0.03, 0.26, M.steel, cx + 0.05 + dx, top + 0.12, cz);
      box(root, 0.32, 0.03, 0.005, M.steel, cx + 0.05, top + 0.12, cz);
      for (let i = 0; i < 9; i++) {
        const px = cx - 0.07 + (i % 3) * 0.1, pz = cz - 0.08 + Math.floor(i / 3) * 0.08;
        const k = i % 3;
        if (k === 0) B.ball.add(px, top + 0.125, pz, 0.06, 0.04, 0.06, '#fff6d8');
        else if (k === 1) B.tri.add(px, top + 0.115, pz, 0.06, 0.06, 0.06, '#8b8f9a', 0, Math.PI / 2);
        else B.box.add(px, top + 0.12, pz, 0.06, 0.03, 0.05, '#f3e2b8');
      }
      // steam
      const steamMat = new THREE.SpriteMaterial({ color: 0xffffff, transparent: true, opacity: 0.18, depthWrite: false });
      const puffs = [];
      for (let i = 0; i < 6; i++) {
        const sp = new THREE.Sprite(steamMat.clone());
        sp.layers.set(LAYER.FX);
        sp.userData.ph = i / 6;
        root.add(sp);
        puffs.push(sp);
      }
      updaters.push((dt, time) => {
        for (const p of puffs) {
          const t = (time * 0.25 + p.userData.ph) % 1;
          p.position.set(cx + 0.05 + Math.sin(t * 6 + p.userData.ph * 9) * 0.04, top + 0.16 + t * 0.45, cz + Math.cos(t * 5) * 0.03);
          const s = 0.06 + t * 0.14;
          p.scale.set(s, s, 1);
          p.material.opacity = 0.22 * Math.sin(t * Math.PI);
        }
      });
    }
    // little extras on the counter front
    box(root, 0.12, 0.14, 0.08, glassMat({ alpha: 0.25, drops: 0, tint: 0xffe9a8 }), 1.48, top, z1 - 0.06).layers.set(LAYER.FX);
    box(root, 0.18, 0.06, 0.08, M.orange, 2.35, top, z1 - 0.08);
    // menu board
    const mb = plane(root, 1.5, 0.37, glowMat('#ffffff', 1.05, { map: T.menuBoardTexture() }), (x0 + x1) / 2, 2.55, -1.3);
    noOutline(mb);
    box(root, 1.54, 0.41, 0.03, M.black, (x0 + x1) / 2, 2.365, -1.317);
    rod(root, [x0 + 0.2, CEIL, -1.31], [x0 + 0.2, 2.74, -1.31], 0.005, M.steel);
    rod(root, [x1 - 0.2, CEIL, -1.31], [x1 - 0.2, 2.74, -1.31], 0.005, M.steel);
  }
  // back counter, cigarette shelf, staff door (on the partition wall, facing +z)
  {
    boxMM(root, 1.85, F, PZ, S.x1 - 0.12, F + 0.9, PZ + 0.32, M.counter);
    box(root, 0.36, 0.22, 0.26, M.black, 2.05, F + 0.9, PZ + 0.16);
    const mw = plane(root, 0.22, 0.12, glowMat('#ffcc66', 0.8), 2.0, F + 1.01, PZ + 0.292);
    noOutline(mw);
    box(root, 0.3, 0.16, 0.24, M.steel, 2.36, F + 0.9, PZ + 0.16);
    const cg = plane(root, 0.62, 0.8, glowMat('#ffffff', 1.0, { map: T.cigaretteTexture() }), 2.18, F + 1.65, PZ + 0.02);
    noOutline(cg);
    boxMM(root, 1.86, F + 1.22, PZ, 2.5, F + 1.25, PZ + 0.12, M.steel);
    boxMM(root, 1.86, F + 2.05, PZ, 2.5, F + 2.1, PZ + 0.12, M.black);
    // staff door
    const sd = plane(root, 0.48, 1.95, toon('#ffffff', { map: T.staffDoorTexture(), glow: 0.35, unique: true }), 1.53, F + 0.98, PZ + 0.004);
    boxMM(root, 1.27, F, PZ, 1.29, F + 2.0, PZ + 0.03, M.frameDark);
    boxMM(root, 1.77, F, PZ, 1.79, F + 2.0, PZ + 0.03, M.frameDark);
    boxMM(root, 1.27, F + 1.96, PZ, 1.79, F + 2.0, PZ + 0.03, M.frameDark);
    sd.name = 'staffDoor';
    // clock
    mesh(root, G.cyl(0.13, 0.13, 0.03, 24), toon('#ffffff', { glow: 0.5 }), 1.53, 2.45, PZ + 0.02, [Math.PI / 2, 0, 0]);
    rod(root, [1.53, 2.45, PZ + 0.04], [1.53, 2.54, PZ + 0.04], 0.006, M.black);
    rod(root, [1.53, 2.45, PZ + 0.04], [1.59, 2.43, PZ + 0.04], 0.006, M.black);
  }
  // coffee station
  {
    const x = 0.45, z = -1.32;
    boxMM(root, x - 0.3, F, z - 0.25, x + 0.3, F + 0.9, z + 0.22, M.counter);
    rbox(root, 0.32, 0.5, 0.32, toon('#2a2e35', { glow: 0.15 }), x - 0.08, F + 0.9, z - 0.04, 0.04);
    const scr = plane(root, 0.14, 0.1, glowMat('#ffb070', 1.4), x - 0.08, F + 1.24, z + 0.121);
    noOutline(scr);
    box(root, 0.2, 0.03, 0.12, M.steel, x - 0.08, F + 0.94, z + 0.07);
    for (const dz of [-0.12, 0.02]) cyl(root, 0.04, 0.32, glassMat({ alpha: 0.3, drops: 0, tint: 0xffffff }), x + 0.18, F + 0.9, z + dz, 12).layers.set(LAYER.FX);
    for (let i = 0; i < 5; i++) B.cup.add(x + 0.18, F + 0.92 + i * 0.05, z - 0.12, 0.07, 0.07, 0.07, '#fffaf0');
    const csig = T.stickerTexture('セルフコーヒー ¥110', '#7a4a2a', '#ffffff', 512, 96);
    const cs = plane(root, 0.55, 0.1, glowMat('#ffffff', 1, { map: csig }), x, F + 1.6, z - 0.249 + 0.001);
    noOutline(cs);
    box(root, 0.6, 0.02, 0.4, M.counter, x, F + 1.5, z - 0.05).visible = false;
  }
  // ice cream freezer
  {
    const x0 = 1.95, x1 = 2.45, z0 = -0.75, z1 = 0.1;
    boxMM(root, x0, F, z0, x1, F + 0.78, z1, toon('#ffffff', { glow: 0.4 }));
    box(root, x1 - x0, 0.06, z1 - z0, M.teal, (x0 + x1) / 2, F + 0.55, (z0 + z1) / 2).scale.set(1.01, 1, 1.01);
    const ib = box(root, x1 - x0 - 0.06, 0.01, z1 - z0 - 0.06, glowMat('#dff3ff', 1.2), (x0 + x1) / 2, F + 0.66, (z0 + z1) / 2);
    noOutline(ib);
    for (let i = 0; i < 14; i++) B.box.add(x0 + 0.08 + (i % 3) * 0.14, F + 0.67, z0 + 0.07 + Math.floor(i / 3) * 0.15, 0.11, 0.06, 0.12, pick(r, ['#ff7fb0', '#ffffff', '#ffe14d', '#3fa7ff', '#7a4a2a', '#59c96b']));
    const lid = box(root, x1 - x0, 0.015, z1 - z0, glassMat({ alpha: 0.12, drops: 0 }), (x0 + x1) / 2, F + 0.78, (z0 + z1) / 2);
    lid.layers.set(LAYER.FX);
    const ip = plane(root, 0.42, 0.16, toon('#ffffff', { map: T.stickerTexture('ICE  アイス', '#3fa7ff', '#ffffff', 256, 96), glow: 0.5, unique: true }), (x0 + x1) / 2, F + 0.33, z1 + 0.002);
    noOutline(ip);
  }
  // magazine rack along the front window
  {
    const x0 = -2.5, x1 = 0.5, z0 = 0.5, z1 = 0.86;
    boxMM(root, x0, F, z0, x1, F + 0.42, z1, M.shelfDark);
    const back = mesh(root, G.box(x1 - x0, 0.6, 0.03), M.shelf, (x0 + x1) / 2, F + 0.7, z0 + 0.02);
    back.name = 'magBack';
    boxMM(root, x0, F + 0.95, z0, x1, F + 0.98, z0 + 0.3, M.shelf);
    // magazines lean towards the store (face -z)
    const mags = [];
    for (let i = 0; i < 8; i++) mags.push(toon('#ffffff', { map: T.magazineTexture(i), glow: 0.45, unique: true }));
    for (let x = x0 + 0.12, i = 0; x < x1 - 0.1; x += 0.2, i++) {
      const m = mesh(root, G.plane(0.17, 0.23), mags[i % 8], x, F + 0.62, z0 - 0.005, [0.25, Math.PI, 0]);
      noOutline(m);
      const m2 = mesh(root, G.plane(0.17, 0.23), mags[(i + 3) % 8], x, F + 0.3, z0 - 0.04, [0.25, Math.PI, 0]);
      noOutline(m2);
      B.box.add(x, F + 0.98, z0 + 0.15, 0.13, 0.04 + (i % 3) * 0.02, 0.2, pick(r, PALETTE));
    }
    // window posters facing outside
    for (let i = 0; i < 4; i++) {
      const p = plane(root, 0.42, 0.59, toon('#ffffff', { map: T.posterTexture(i), glow: 0.55, unique: true }), -2.45 + i * 0.85 + (i > 1 ? 0.05 : 0), 1.92, S.z1 - 0.06);
      noOutline(p);
    }
    for (let i = 0; i < 2; i++) {
      const p = plane(root, 0.42, 0.59, toon('#ffffff', { map: T.posterTexture(4 + i), glow: 0.55, unique: true }), S.x1 - 0.06, 1.92, -1.45 + i * 1.0 + 0.5, Math.PI / 2);
      noOutline(p);
    }
  }
  // ATM in the front-left corner
  {
    const x0 = S.x0 + WT, z = 0.15;
    rbox(root, 0.42, 1.45, 0.42, toon('#ffffff', { map: T.atmTexture(), glow: 0.4, unique: true }), x0 + 0.21, F, z, 0.03);
  }
  // umbrella bag stand inside door
  {
    cyl(root, 0.08, 0.6, M.steel, 0.55, F, 0.7, 12);
    const bag = box(root, 0.06, 0.3, 0.1, toon('#e9f6ff', { glow: 0.4 }), 0.55, F + 0.6, 0.7);
    bag.rotation.z = 0.1;
  }

  // build all product batches
  for (const k in B) B[k].build(root, false);

  return {
    root,
    canopy: { frontEdgeZ, frontEdgeY, sideEdgeX, x0: S.x0 - 0.05, x1: sideEdgeX, z0: SIDE_GLASS_Z0 - 0.1 },
    door: DOOR,
  };
}
