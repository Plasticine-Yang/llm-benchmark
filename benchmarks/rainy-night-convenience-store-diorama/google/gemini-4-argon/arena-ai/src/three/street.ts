import * as THREE from 'three';
import { BOX, CYL, PLANE, put, toon, glow, glassMat } from './materials';
import { makeFacade, makePoster, makeSoftDot, makeVending } from './textures';

/* ---------------- shared site layout (metres ≈ units) ---------------- */
export const LAYOUT = {
  base: 24,
  roadZ0: -0.6,
  roadZ1: 5.4,
  crossX0: 5.2,
  crossX1: 11.2,
  walkTop: 0.14,
  alleyX0: -12,
  alleyX1: -8,
};

export interface NeonRef {
  pos: THREE.Vector3;
  color: THREE.Color;
  radius: number;
  base: number;
}
export interface StreetResult {
  group: THREE.Group;
  update: (t: number, dt: number) => void;
  neon: NeonRef[];
  dripPoints: THREE.Vector3[];
}

const dark = (c: number) => toon(c, { rough: true });

function catenary(
  a: THREE.Vector3,
  b: THREE.Vector3,
  sag: number,
  parent: THREE.Object3D,
  mat: THREE.Material,
  r = 0.022
) {
  const mid = a.clone().add(b).multiplyScalar(0.5);
  mid.y -= sag;
  const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
  const geo = new THREE.TubeGeometry(curve, 22, r, 4, false);
  const m = new THREE.Mesh(geo, mat);
  m.renderOrder = 0;
  parent.add(m);
  return m;
}

export function buildStreet(): StreetResult {
  const group = new THREE.Group();
  const anims: ((t: number, dt: number) => void)[] = [];
  const neon: NeonRef[] = [];
  const dripPoints: THREE.Vector3[] = [];

  const steel = dark(0x8d97a1);
  const steelDark = dark(0x5c6672);
  const white = dark(0xe8ecef);

  /* ================= street lamp ================= */
  const lamp = new THREE.Group();
  lamp.position.set(4.62, LAYOUT.walkTop, -0.95);
  group.add(lamp);
  put(lamp, CYL(0.28, 0.34, 0.22, 12), steelDark, { pos: [0, 0.11, 0], outline: true });
  put(lamp, CYL(0.085, 0.11, 4.5, 12), dark(0x3f4b5c), { pos: [0, 2.3, 0], cast: true, outline: true });
  // curved arm
  const arm = new THREE.Mesh(
    new THREE.TorusGeometry(0.62, 0.055, 6, 14, Math.PI * 0.55),
    dark(0x3f4b5c)
  );
  arm.position.set(0, 4.5, 0);
  arm.rotation.set(0, Math.PI * 0.75, Math.PI * 0.06);
  lamp.add(arm);
  const headX = -0.42;
  const headZ = 0.42;
  put(lamp, BOX(0.62, 0.16, 0.3), dark(0x39424d), { pos: [headX, 4.42, headZ], rot: [0, 0.7, 0], cast: true, outline: true });
  const lampLens = put(lamp, BOX(0.5, 0.05, 0.22), glow(0xfff0cd), { pos: [headX, 4.33, headZ], rot: [0, 0.7, 0] });
  const lampLight = new THREE.PointLight(0xffe2b0, 7.5, 15, 1.8);
  lampLight.position.set(headX, 4.2, headZ);
  lampLight.castShadow = false;
  lamp.add(lampLight);
  // visible light cone catching the rain
  const cone = new THREE.Mesh(
    new THREE.ConeGeometry(2.5, 4.3, 20, 1, true),
    new THREE.MeshBasicMaterial({
      color: 0xffe6bb,
      transparent: true,
      opacity: 0.055,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      toneMapped: false,
    })
  );
  cone.position.set(headX, 2.15, headZ);
  cone.renderOrder = 5;
  lamp.add(cone);
  neon.push({
    pos: new THREE.Vector3(4.62 + headX, 0.2, -0.95 + headZ),
    color: new THREE.Color(0xffdfae),
    radius: 4.0,
    base: 0.75,
  });
  anims.push((t) => {
    const f = 0.94 + Math.sin(t * 7.3) * 0.03 + (Math.random() > 0.995 ? -0.25 : 0);
    lampLight.intensity = 7.5 * f;
    (lampLens.material as THREE.MeshBasicMaterial).color.setScalar(0.9 * f + 0.1);
    (cone.material as THREE.MeshBasicMaterial).opacity = 0.05 * f;
  });

  /* ================= utility poles + wires ================= */
  const wireMat = dark(0x2a3140);
  const poleData: { x: number; z: number; h: number }[] = [
    { x: 4.95, z: -7.4, h: 8.4 },
    { x: 11.55, z: 1.6, h: 8.0 },
    { x: -11.5, z: 6.6, h: 7.6 },
  ];
  const poleTops: THREE.Vector3[] = [];

  poleData.forEach((p, idx) => {
    const g = new THREE.Group();
    g.position.set(p.x, LAYOUT.walkTop, p.z);
    group.add(g);
    put(g, CYL(0.5, 0.62, 0.3, 10), dark(0x6b7280), { pos: [0, 0.15, 0], outline: true });
    put(g, CYL(0.15, 0.21, p.h, 12), dark(0x9aa1ab), { pos: [0, p.h / 2, 0], cast: true, outline: true });
    // climbing steps
    for (let s = 0; s < 7; s++) {
      put(g, BOX(0.26, 0.035, 0.05), steelDark, { pos: [0.19, 1.2 + s * 0.62, 0] });
    }
    // cross arms
    const armY = [p.h - 0.9, p.h - 1.7];
    armY.forEach((ay, ai) => {
      put(g, BOX(2.5 - ai * 0.4, 0.1, 0.1), steelDark, { pos: [0, ay, 0], cast: true, outline: true });
      for (let i = -2; i <= 2; i++) {
        if (i === 0) continue;
        put(g, CYL(0.035, 0.035, 0.24, 6), dark(0xd8dde2), { pos: [i * 0.52, ay + 0.16, 0] });
      }
    });
    // transformers
    put(g, CYL(0.2, 0.2, 0.52, 12), dark(0x7d8794), { pos: [0.3, p.h - 2.6, 0.16], cast: true, outline: true });
    put(g, CYL(0.2, 0.2, 0.52, 12), dark(0x7d8794), { pos: [0.3, p.h - 2.6, -0.2], cast: true, outline: true });
    put(g, BOX(0.3, 0.34, 0.24), dark(0x6f7a87), { pos: [-0.28, p.h - 3.2, 0], outline: true });
    // small street-number plate
    put(g, PLANE(0.3, 0.2), new THREE.MeshBasicMaterial({ color: 0xe6edf5, toneMapped: false }), { pos: [0.17, 3.1, 0.06], rot: [0, Math.PI / 2, 0] });
    poleTops.push(new THREE.Vector3(p.x, p.h - 0.9, p.z));
    if (idx === 0) {
      // store-side pole carries the service drop to the building
      catenary(
        new THREE.Vector3(p.x, p.h - 0.9, p.z),
        new THREE.Vector3(2.62, 3.9, -6.2),
        0.9,
        group,
        wireMat,
        0.02
      );
    }
  });

  // main spans between poles
  catenary(poleTops[0], poleTops[1], 1.25, group, wireMat);
  catenary(poleTops[1], poleTops[2], 1.5, group, wireMat);
  catenary(
    poleTops[0].clone().setY(poleTops[0].y - 0.8),
    poleTops[2].clone().setY(poleTops[2].y - 0.8),
    1.9,
    group,
    wireMat
  );
  // wires running off the edges of the diorama
  catenary(poleTops[1], new THREE.Vector3(12.6, 6.4, 3.4), 0.7, group, wireMat);
  catenary(poleTops[2], new THREE.Vector3(-12.6, 5.9, 8.4), 0.7, group, wireMat);
  catenary(poleTops[0], new THREE.Vector3(5.6, 6.6, -12.6), 0.8, group, wireMat);

  /* ================= corner guardrails ================= */
  function guardrail(
    x0: number,
    z0: number,
    x1: number,
    z1: number,
    posts: number
  ) {
    const dx = x1 - x0;
    const dz = z1 - z0;
    const len = Math.hypot(dx, dz);
    const ang = Math.atan2(dx, dz);
    const g = new THREE.Group();
    g.position.set((x0 + x1) / 2, LAYOUT.walkTop, (z0 + z1) / 2);
    g.rotation.y = ang;
    group.add(g);
    put(g, CYL(0.05, 0.05, len, 10), dark(0xc9d2da), { pos: [0, 0.72, 0], rot: [Math.PI / 2, 0, 0], cast: true, outline: true });
    put(g, CYL(0.035, 0.035, len, 8), dark(0xaab4bd), { pos: [0, 0.44, 0], rot: [Math.PI / 2, 0, 0] });
    for (let i = 0; i <= posts; i++) {
      const t = -len / 2 + (i * len) / posts;
      put(g, CYL(0.045, 0.05, 0.86, 8), steelDark, { pos: [0, 0.43, t], outline: true });
    }
  }
  guardrail(2.72, -0.78, 4.98, -0.78, 3);
  guardrail(5.0, -0.95, 5.0, -2.85, 2);
  guardrail(-11.9, -0.78, -9.0, -0.78, 3);
  guardrail(5.4, 5.62, 8.4, 5.62, 3);

  /* ================= traffic light (distant, cycling) ================= */
  const tl = new THREE.Group();
  tl.position.set(11.35, LAYOUT.walkTop, 6.5);
  tl.rotation.y = -0.8;
  group.add(tl);
  put(tl, CYL(0.09, 0.12, 3.5, 10), dark(0x3f4b5c), { pos: [0, 1.75, 0], cast: true, outline: true });
  put(tl, CYL(0.055, 0.055, 1.5, 8), dark(0x3f4b5c), { pos: [-0.7, 3.4, 0], rot: [0, 0, Math.PI / 2] });
  const head = new THREE.Group();
  head.position.set(-1.5, 3.4, 0);
  head.rotation.y = Math.PI - 0.12;
  tl.add(head);
  put(head, BOX(0.42, 1.16, 0.3), dark(0x2b3440), { outline: true });
  const lensColors = [0xff4b3e, 0xffc53d, 0x4ade80];
  const lensMats = lensColors.map(
    (c) => new THREE.MeshBasicMaterial({ color: c, toneMapped: false })
  );
  const lenses: THREE.Mesh[] = [];
  lensColors.forEach((_, i) => {
    const l = put(head, CYL(0.13, 0.13, 0.06, 14), lensMats[i], { pos: [0.17, 0.38 - i * 0.38, 0], rot: [0, 0, Math.PI / 2] });
    lenses.push(l);
    put(head, CYL(0.17, 0.19, 0.1, 14, true), dark(0x1b232e), { pos: [0.22, 0.38 - i * 0.38, 0], rot: [0, 0, Math.PI / 2] });
  });
  const tlLight = new THREE.PointLight(0x4ade80, 1.6, 8, 2);
  tlLight.position.set(-1.2, 3.4, 0);
  tl.add(tlLight);
  const tlNeon: NeonRef = {
    pos: new THREE.Vector3(10.0, 0, 6.4),
    color: new THREE.Color(0x4ade80),
    radius: 3.4,
    base: 0.4,
  };
  neon.push(tlNeon);
  const TL_CYCLE = 11.5;
  anims.push((t) => {
    const p = t % TL_CYCLE;
    let active = 2;
    if (p < 5.2) active = 2;
    else if (p < 6.6) active = 1;
    else active = 0;
    lenses.forEach((l, i) => {
      const on = i === active;
      const m = l.material as THREE.MeshBasicMaterial;
      m.color.set(lensColors[i]).multiplyScalar(on ? 1 : 0.07);
      m.toneMapped = false;
    });
    tlLight.color.set(lensColors[active]);
    tlLight.intensity = 1.5;
    tlNeon.color.set(lensColors[active]);
  });

  /* ================= road sign pole ================= */
  const sign = new THREE.Group();
  sign.position.set(2.72, LAYOUT.walkTop, -2.62);
  group.add(sign);
  put(sign, CYL(0.05, 0.06, 2.5, 10), steel, { pos: [0, 1.25, 0], cast: true, outline: true });
  // round no-parking sign
  const round = new THREE.Group();
  round.position.set(0, 2.42, 0);
  round.rotation.y = 0.5;
  sign.add(round);
  put(round, CYL(0.3, 0.3, 0.04, 20), dark(0xe9eef2), { rot: [Math.PI / 2, 0, 0], outline: true });
  put(round, new THREE.TorusGeometry(0.28, 0.045, 6, 22), dark(0xd8402f), { rot: [0, 0, 0], pos: [0, 0, 0.03] });
  put(round, BOX(0.42, 0.07, 0.03), dark(0x2b62b9), { pos: [0, 0.06, 0.035], rot: [0, 0, 0.6] });
  put(round, BOX(0.42, 0.07, 0.03), dark(0x2b62b9), { pos: [0, -0.06, 0.035], rot: [0, 0, 0.6] });
  // rectangular street-name plate
  put(sign, BOX(0.86, 0.24, 0.035), dark(0x1f6b3f), { pos: [0, 1.86, 0], rot: [0, 0.4, 0], cast: true, outline: true });
  put(sign, PLANE(0.78, 0.16), new THREE.MeshBasicMaterial({ color: 0xf2f7f2, toneMapped: false }), { pos: [0, 1.86, 0.025], rot: [0, 0.4, 0] });

  /* ================= mailbox ================= */
  const post = new THREE.Group();
  post.position.set(3.7, LAYOUT.walkTop, -2.5);
  group.add(post);
  put(post, CYL(0.24, 0.24, 0.9, 14), dark(0xd0402f), { pos: [0, 0.55, 0], cast: true, outline: true });
  const dome = put(post, new THREE.SphereGeometry(0.24, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2), dark(0xd0402f), { pos: [0, 1.0, 0], outline: true });
  dome.rotation.y = 0;
  put(post, BOX(0.3, 0.035, 0.06), dark(0x2b3440), { pos: [0, 0.86, 0.22] });
  put(post, PLANE(0.2, 0.14), new THREE.MeshBasicMaterial({ color: 0xf6f1e4, toneMapped: false }), { pos: [0, 0.62, 0.245] });

  /* ================= bicycles + parking zone ================= */
  function bicycle(color: number, scale = 1) {
    const b = new THREE.Group();
    const frame = dark(color);
    const wheelR = 0.34;
    [-0.52, 0.52].forEach((wx) => {
      const w = new THREE.Group();
      w.position.set(wx, wheelR, 0);
      b.add(w);
      put(w, new THREE.TorusGeometry(wheelR, 0.035, 6, 20), dark(0x22282f), { rot: [0, 0, 0], outline: true });
      put(w, CYL(0.05, 0.05, 0.06, 8), steel, { rot: [Math.PI / 2, 0, 0] });
      for (let s = 0; s < 6; s++) {
        put(w, BOX(wheelR * 2 - 0.08, 0.012, 0.012), dark(0xc3ccd4), { rot: [(s * Math.PI) / 6, 0, 0] });
      }
    });
    // frame tubes
    const tube = (ax: number, ay: number, bx: number, by: number, r = 0.03) => {
      const a = new THREE.Vector3(ax, ay, 0);
      const c = new THREE.Vector3(bx, by, 0);
      const len = a.distanceTo(c);
      const mid = a.clone().add(c).multiplyScalar(0.5);
      const m = put(b, CYL(r, r, len, 8), frame, { pos: [mid.x, mid.y, 0], cast: true });
      m.rotation.z = Math.atan2(c.y - a.y, c.x - a.x) - Math.PI / 2;
      return m;
    };
    tube(-0.52, wheelR, -0.1, 0.24);
    tube(-0.1, 0.24, 0.06, 0.62);
    tube(0.06, 0.62, 0.52, wheelR);
    tube(-0.52, wheelR, 0.06, 0.62);
    tube(-0.1, 0.24, 0.3, 0.24);
    tube(0.3, 0.24, 0.52, wheelR);
    tube(0.06, 0.62, 0.16, 0.86);
    // saddle + handlebar + basket
    put(b, BOX(0.26, 0.06, 0.13), dark(0x2c333c), { pos: [-0.16, 0.88, 0], outline: true });
    put(b, CYL(0.025, 0.025, 0.42, 8), steel, { pos: [0.16, 0.98, 0], rot: [Math.PI / 2, 0, 0] });
    put(b, CYL(0.025, 0.025, 0.2, 8), steel, { pos: [0.16, 0.8, 0] });
    put(b, BOX(0.34, 0.24, 0.3), dark(0xb9a37e), { pos: [0.34, 0.86, 0], outline: true });
    put(b, CYL(0.09, 0.09, 0.03, 10), steelDark, { pos: [-0.1, 0.24, 0.11], rot: [Math.PI / 2, 0, 0] });
    put(b, CYL(0.09, 0.09, 0.03, 10), steelDark, { pos: [-0.1, 0.24, -0.11], rot: [Math.PI / 2, 0, 0] });
    // kickstand
    put(b, CYL(0.02, 0.02, 0.32, 6), steelDark, { pos: [-0.02, 0.14, 0.09], rot: [0.3, 0, 0.2] });
    b.scale.setScalar(scale);
    return b;
  }

  const bike1 = bicycle(0x3f7fa8);
  bike1.position.set(3.35, LAYOUT.walkTop, -2.05);
  bike1.rotation.y = Math.PI * 0.52;
  group.add(bike1);
  const bike2 = bicycle(0xc25a4a, 0.94);
  bike2.position.set(4.1, LAYOUT.walkTop, -2.1);
  bike2.rotation.y = Math.PI * 0.46;
  group.add(bike2);
  // third bicycle leaning in the alley
  const bike3 = bicycle(0x6a7a8c, 0.96);
  bike3.position.set(-8.5, 0, -4.4);
  bike3.rotation.set(0, Math.PI * 0.5, 0.16);
  group.add(bike3);

  /* ================= umbrella stand ================= */
  const umb = new THREE.Group();
  umb.position.set(-1.35, LAYOUT.walkTop, -1.72);
  group.add(umb);
  put(umb, BOX(0.5, 0.34, 0.34), dark(0x9aa4ad), { pos: [0, 0.17, 0], cast: true, outline: true });
  put(umb, CYL(0.24, 0.24, 0.05, 14), steelDark, { pos: [0, 0.36, 0] });
  const umbColors = [0xd8402f, 0x2b62b9, 0xf0f4f8, 0x2f9e52, 0xe8b23a];
  umbColors.forEach((c, i) => {
    const a = (i / umbColors.length) * Math.PI * 2;
    const ux = Math.cos(a) * 0.13;
    const uz = Math.sin(a) * 0.11;
    const tilt = 0.18 + (i % 3) * 0.07;
    const g2 = new THREE.Group();
    g2.position.set(ux, 0.3, uz);
    g2.rotation.set(tilt * Math.cos(a), 0, tilt * Math.sin(a));
    umb.add(g2);
    put(g2, CYL(0.016, 0.016, 0.95, 6), dark(0x3a424c), { pos: [0, 0.55, 0] });
    const canopy = put(g2, new THREE.ConeGeometry(0.26, 0.3, 9), dark(c), { pos: [0, 0.95, 0], outline: true });
    canopy.rotation.y = i;
    put(g2, new THREE.TorusGeometry(0.045, 0.014, 5, 10, Math.PI), dark(0x3a424c), { pos: [0, 0.06, 0.03], rot: [Math.PI, 0, 0] });
  });

  /* ================= trash station ================= */
  const trash = new THREE.Group();
  trash.position.set(1.95, LAYOUT.walkTop, -1.78);
  group.add(trash);
  put(trash, BOX(1.5, 0.08, 0.62), dark(0x8d97a1), { pos: [0, 0.04, 0], recv: true, outline: true });
  for (let i = 0; i < 3; i++) {
    const bx = -0.48 + i * 0.48;
    put(trash, BOX(0.44, 0.72, 0.5), white, { pos: [bx, 0.44, 0], cast: true, outline: true });
    put(trash, BOX(0.46, 0.08, 0.52), dark([0x2f9e52, 0x2b7fd4, 0xd8402f][i]), { pos: [bx, 0.83, 0], outline: true });
    put(trash, CYL(0.1, 0.1, 0.03, 12), dark(0x2b3440), { pos: [bx, 0.88, 0] });
    put(trash, PLANE(0.26, 0.2), new THREE.MeshBasicMaterial({ color: [0x2f9e52, 0x2b7fd4, 0xd8402f][i], toneMapped: false }), { pos: [bx, 0.56, 0.26] });
  }
  // little roof
  put(trash, BOX(1.66, 0.07, 0.74), dark(0x6f7a87), { pos: [0, 1.28, 0], cast: true, outline: true });
  [-0.76, 0.76].forEach((px) =>
    put(trash, CYL(0.03, 0.03, 1.2, 6), steel, { pos: [px, 0.66, 0.28] })
  );
  put(trash, PLANE(0.6, 0.24), new THREE.MeshBasicMaterial({ map: makePoster(1), toneMapped: false }), { pos: [0, 1.02, 0.32] });
  dripPoints.push(new THREE.Vector3(1.95 - 0.78, 1.32, -1.78 + 0.35));
  dripPoints.push(new THREE.Vector3(1.95 + 0.78, 1.32, -1.78 + 0.35));

  /* ================= A-frame sign + bulletin board ================= */
  const aframe = new THREE.Group();
  aframe.position.set(-3.6, LAYOUT.walkTop, -1.62);
  aframe.rotation.y = -0.22;
  group.add(aframe);
  put(aframe, BOX(0.62, 0.86, 0.04), dark(0x2b3440), { pos: [0, 0.46, 0.12], rot: [-0.14, 0, 0], cast: true, outline: true });
  put(aframe, BOX(0.62, 0.86, 0.04), dark(0x2b3440), { pos: [0, 0.46, -0.12], rot: [0.14, 0, 0], cast: true, outline: true });
  put(aframe, PLANE(0.52, 0.72), new THREE.MeshBasicMaterial({ map: makePoster(0), toneMapped: false }), { pos: [0, 0.47, 0.15], rot: [-0.14, 0, 0], order: 1 });

  const board = new THREE.Group();
  board.position.set(-2.35, LAYOUT.walkTop, -1.35);
  board.rotation.y = 0.32;
  group.add(board);
  put(board, BOX(0.9, 1.24, 0.07), dark(0x6b5a45), { pos: [0, 1.0, 0], cast: true, outline: true });
  put(board, PLANE(0.78, 1.06), new THREE.MeshBasicMaterial({ map: makePoster(3), toneMapped: false }), { pos: [0, 1.02, 0.045], order: 1 });
  put(board, PLANE(0.34, 0.46), new THREE.MeshBasicMaterial({ map: makePoster(2), toneMapped: false }), { pos: [-0.2, 1.24, 0.05], order: 2 });
  [-0.34, 0.34].forEach((lx) =>
    put(board, CYL(0.045, 0.045, 0.8, 8), dark(0x5a4c3a), { pos: [lx, 0.4, 0] })
  );

  /* ================= street tree ================= */
  const tree = new THREE.Group();
  tree.position.set(-9.6, LAYOUT.walkTop, -1.85);
  group.add(tree);
  put(tree, BOX(1.0, 0.1, 1.0), dark(0x4a5260), { pos: [0, 0.02, 0], recv: true });
  put(tree, CYL(0.11, 0.15, 1.5, 8), dark(0x5c4632), { pos: [0, 0.75, 0], cast: true, outline: true });
  const foliage = dark(0x2f5c46);
  [[0, 2.0, 0, 0.72], [0.42, 1.72, 0.2, 0.5], [-0.38, 1.78, -0.16, 0.52], [0.1, 2.42, -0.1, 0.48]].forEach(
    ([fx, fy, fz, fr]) => {
      const s = put(tree, new THREE.IcosahedronGeometry(fr, 0), foliage, { pos: [fx, fy, fz], cast: true, outline: true });
      s.rotation.set(fx * 3, fy, fz * 2);
    }
  );
  anims.push((t) => {
    tree.rotation.z = Math.sin(t * 0.9) * 0.008;
  });

  /* ================= parked kei car + bays ================= */
  const car = new THREE.Group();
  car.position.set(-8.9, 0, 4.42);
  car.rotation.y = Math.PI;
  group.add(car);
  const carBody = dark(0x39506b);
  put(car, BOX(3.1, 0.62, 1.42), carBody, { pos: [0, 0.62, 0], cast: true, recv: true, outline: true });
  put(car, BOX(2.1, 0.62, 1.34), carBody, { pos: [-0.12, 1.2, 0], cast: true, outline: true });
  put(car, BOX(2.0, 0.44, 1.28), glassMat(0x9fc4e8, 0.42), { pos: [-0.12, 1.2, 0], order: 3 });
  [-1.05, 1.05].forEach((wx) =>
    [-0.72, 0.72].forEach((wz) => {
      put(car, CYL(0.31, 0.31, 0.2, 14), dark(0x1c222a), { pos: [wx, 0.31, wz], rot: [Math.PI / 2, 0, 0], cast: true, outline: true });
      put(car, CYL(0.15, 0.15, 0.22, 10), dark(0xb9c2cb), { pos: [wx, 0.31, wz], rot: [Math.PI / 2, 0, 0] });
    })
  );
  const tailL = put(car, BOX(0.08, 0.2, 0.34), glow(0xff3b2f), { pos: [-1.56, 0.72, 0.44] });
  const tailR = put(car, BOX(0.08, 0.2, 0.34), glow(0xff3b2f), { pos: [-1.56, 0.72, -0.44] });
  put(car, BOX(0.08, 0.18, 0.32), glow(0xfff3d0), { pos: [1.56, 0.72, 0.44] });
  put(car, BOX(0.08, 0.18, 0.32), glow(0xfff3d0), { pos: [1.56, 0.72, -0.44] });
  put(car, BOX(1.2, 0.06, 0.3), dark(0x22282f), { pos: [0, 0.4, 0.74] });
  const carGlow = new THREE.PointLight(0xff4030, 1.1, 3.4, 2);
  carGlow.position.set(-1.9, 0.75, 0);
  car.add(carGlow);
  neon.push({ pos: new THREE.Vector3(-10.6, 0, 4.4), color: new THREE.Color(0xff4a3a), radius: 1.8, base: 0.35 });
  anims.push((t) => {
    const brake = Math.sin(t * 0.5) > 0.86 ? 1 : 0.35;
    carGlow.intensity = 1.1 * brake;
    (tailL.material as THREE.MeshBasicMaterial).color.setScalar(brake);
    (tailR.material as THREE.MeshBasicMaterial).color.setRGB(brake, brake * 0.2, brake * 0.16);
  });

  /* ================= alley dressing ================= */
  const alley = new THREE.Group();
  group.add(alley);
  // dark void closing the alley
  put(alley, PLANE(4, 3.4), dark(0x0d1220), { pos: [-10, 1.7, -11.05] });
  // fence + gate
  for (let i = 0; i < 9; i++) {
    put(alley, BOX(0.045, 1.5, 0.045), steelDark, { pos: [-11.7 + i * 0.42, 0.75, -10.6] });
  }
  put(alley, BOX(3.6, 0.06, 0.06), steelDark, { pos: [-10, 1.46, -10.6] });
  put(alley, BOX(3.6, 0.06, 0.06), steelDark, { pos: [-10, 0.32, -10.6] });
  // dumpster + crates
  put(alley, BOX(1.3, 0.9, 0.8), dark(0x4a5a4f), { pos: [-11.1, 0.45, -6.4], cast: true, outline: true });
  put(alley, BOX(1.36, 0.1, 0.86), dark(0x39463d), { pos: [-11.1, 0.94, -6.4], outline: true });
  // hanging lantern
  const lantern = put(alley, new THREE.SphereGeometry(0.15, 12, 10), glow(0xffb46b), { pos: [-9.4, 2.3, -4.2] });
  put(alley, CYL(0.012, 0.012, 0.7, 5), steelDark, { pos: [-9.4, 2.68, -4.2] });
  const lanternLight = new THREE.PointLight(0xffa657, 2.2, 5.5, 2);
  lanternLight.position.set(-9.4, 2.25, -4.2);
  alley.add(lanternLight);
  neon.push({ pos: new THREE.Vector3(-9.4, 0, -4.2), color: new THREE.Color(0xffa657), radius: 2.2, base: 0.45 });
  anims.push((t) => {
    const sway = Math.sin(t * 1.1) * 0.06;
    lantern.position.x = -9.4 + sway;
    lanternLight.intensity = 2.1 + Math.sin(t * 8.3) * 0.12;
    lanternLight.position.x = -9.4 + sway;
  });

  /* ================= distant block across the road ================= */
  const bg = new THREE.Group();
  group.add(bg);
  const facade = makeFacade();
  const facadeMat = new THREE.MeshToonMaterial({
    color: 0xffffff,
    map: facade.map,
    emissiveMap: facade.emissive,
    emissive: 0xffffff,
    emissiveIntensity: 1.15,
  });
  const bgBody = dark(0x2b3242);

  // apartment block
  const apt = new THREE.Group();
  apt.position.set(-2.6, 0, 9.9);
  bg.add(apt);
  put(apt, BOX(15.5, 7.6, 4.4), bgBody, { pos: [0, 3.8, 0], cast: true, recv: true, outline: true });
  put(apt, PLANE(15.2, 7.2), facadeMat, { pos: [0, 3.9, -2.24], rot: [0, Math.PI, 0], order: 1 });
  put(apt, BOX(15.9, 0.34, 4.8), dark(0x39414f), { pos: [0, 7.75, 0], outline: true });
  // rooftop water tank + AC
  put(apt, CYL(0.7, 0.7, 1.3, 12), dark(0x59636f), { pos: [4.6, 8.6, 0.4], cast: true, outline: true });
  put(apt, BOX(1.4, 0.7, 0.9), dark(0x6f7a87), { pos: [-4.4, 8.3, 0.6], outline: true });
  // ground-floor shopfront with a warm lantern sign
  put(apt, BOX(4.6, 1.5, 0.3), glow(0xffcf87), { pos: [-4.6, 1.4, -2.3] });
  neon.push({ pos: new THREE.Vector3(-7.2, 0, 7.0), color: new THREE.Color(0xffbe7d), radius: 3.6, base: 0.5 });
  put(apt, CYL(0.28, 0.28, 0.42, 12), glow(0xff6a4d), { pos: [-2.0, 2.4, -2.4] });
  // vertical neon sign on the block
  const neonSign = put(apt, BOX(0.5, 2.6, 0.14), glow(0x59d8ff), { pos: [5.4, 4.4, -2.3], outline: true });
  neon.push({ pos: new THREE.Vector3(2.8, 0, 7.0), color: new THREE.Color(0x59d8ff), radius: 3.2, base: 0.42 });
  anims.push((t) => {
    const f = Math.sin(t * 2.6) > 0.94 ? 0.35 : 1;
    (neonSign.material as THREE.MeshBasicMaterial).color.setScalar(0.35 + 0.65 * f);
  });

  // smaller building on the right
  const b2 = new THREE.Group();
  b2.position.set(9.4, 0, 10.2);
  bg.add(b2);
  const facade2 = makeFacade();
  put(b2, BOX(6.6, 5.2, 3.8), dark(0x333a4a), { pos: [0, 2.6, 0], cast: true, outline: true });
  put(b2, PLANE(6.3, 4.8), new THREE.MeshToonMaterial({
    color: 0xffffff,
    map: facade2.map,
    emissiveMap: facade2.emissive,
    emissive: 0xffffff,
    emissiveIntensity: 1.0,
  }), { pos: [0, 2.7, -1.94], rot: [0, Math.PI, 0], order: 1 });
  put(b2, BOX(6.9, 0.3, 4.1), dark(0x3f4757), { pos: [0, 5.32, 0], outline: true });

  // low wall + distant vending machine glow on the far left
  put(bg, BOX(4.4, 1.5, 0.3), dark(0x3a4252), { pos: [-10.0, 0.89, 6.6], outline: true });
  const farVend = put(bg, PLANE(0.9, 1.8), new THREE.MeshBasicMaterial({ map: makeVending('water'), toneMapped: false }), { pos: [-10.0, 1.19, 6.42], order: 1 });
  neon.push({ pos: new THREE.Vector3(-10.0, 0, 6.1), color: new THREE.Color(0x6fd8ff), radius: 2.4, base: 0.4 });
  anims.push((t) => {
    (farVend.material as THREE.MeshBasicMaterial).color.setScalar(0.92 + Math.sin(t * 3.4) * 0.06);
  });

  // far-side street furniture
  put(group, CYL(0.07, 0.09, 3.4, 10), dark(0x3f4b5c), { pos: [-4.6, 1.7 + LAYOUT.walkTop, 6.4], cast: true, outline: true });
  const farLampLens = put(group, BOX(0.4, 0.1, 0.22), glow(0xffe0a8), { pos: [-4.6, 3.5 + LAYOUT.walkTop, 6.0], outline: true });
  neon.push({ pos: new THREE.Vector3(-4.6, 0, 6.0), color: new THREE.Color(0xffdca0), radius: 3.0, base: 0.45 });
  anims.push((t) => {
    (farLampLens.material as THREE.MeshBasicMaterial).color.setScalar(0.9 + Math.sin(t * 5.1) * 0.08);
  });

  // bollards along the far sidewalk
  for (let i = 0; i < 5; i++) {
    put(group, CYL(0.07, 0.08, 0.72, 8), dark(0xc9d2da), { pos: [-1.4 + i * 1.5, LAYOUT.walkTop + 0.36, 5.55], outline: true });
    put(group, CYL(0.075, 0.075, 0.06, 8), glow(0xffcf6b), { pos: [-1.4 + i * 1.5, LAYOUT.walkTop + 0.72, 5.55] });
  }

  const update = (t: number, dt: number) => {
    for (const a of anims) a(t, dt);
  };

  return { group, update, neon, dripPoints };
}

/* soft glow sprite factory reused by the diorama for light halos */
export function haloSprite(color: number, size: number, opacity = 0.4) {
  const s = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: makeSoftDot('rgba(255,255,255,1)'),
      color,
      transparent: true,
      opacity,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
    })
  );
  s.scale.setScalar(size);
  s.renderOrder = 5;
  return s;
}
