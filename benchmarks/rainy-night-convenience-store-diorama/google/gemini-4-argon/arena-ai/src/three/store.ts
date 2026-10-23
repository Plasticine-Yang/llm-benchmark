import * as THREE from 'three';
import { BOX, CYL, PLANE, put, toon, glow, glassMat, decal } from './materials';
import {
  makeStoreSign,
  makePoleSign,
  makeSideSign,
  makeVending,
  makePoster,
  makeMagazine,
  makeDrinkCase,
  makeBentoCase,
  makeStoreFloor,
  makeSoftDot,
  makeGlassSheen,
} from './textures';

/* store footprint: x ∈ [-8, 2.5], z ∈ [-11, -3] */
export const STORE = {
  x0: -8,
  x1: 2.5,
  z0: -11,
  z1: -3,
  h: 4.3,
  ceil: 3.42,
};

const C = {
  facade: 0xf1f4f0,
  facadeShade: 0xd9dee0,
  navy: 0x1f2a44,
  green: 0x1fa46b,
  blue: 0x2b7fd4,
  orange: 0xf2762e,
  alu: 0xb6c0cb,
  aluDark: 0x77828f,
  innerWall: 0xf7f4ec,
  shelf: 0xeaeef1,
  shelfFrame: 0x98a2ae,
  warm: 0xffe7bd,
};

/* ---------- instanced product filler ---------- */
class Instancer {
  private items: { m: THREE.Matrix4; c: THREE.Color }[] = [];
  private unit = new THREE.BoxGeometry(1, 1, 1);
  constructor(private mat: THREE.Material) {}
  add(
    x: number,
    y: number,
    z: number,
    sx: number,
    sy: number,
    sz: number,
    color: number,
    rotY = 0
  ) {
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, rotY, 0));
    m.compose(
      new THREE.Vector3(x, y, z),
      q,
      new THREE.Vector3(sx, sy, sz)
    );
    this.items.push({ m, c: new THREE.Color(color) });
  }
  build(parent: THREE.Object3D) {
    if (this.items.length === 0) return null;
    const im = new THREE.InstancedMesh(this.unit, this.mat, this.items.length);
    this.items.forEach((it, i) => {
      im.setMatrixAt(i, it.m);
      im.setColorAt(i, it.c);
    });
    im.instanceMatrix.needsUpdate = true;
    if (im.instanceColor) im.instanceColor.needsUpdate = true;
    im.castShadow = false;
    im.receiveShadow = false;
    parent.add(im);
    return im;
  }
}

const PRODUCT_COLORS = [
  0xe2574c, 0xf0b429, 0x4aa3df, 0x69c07a, 0xe77fb8, 0xf5f0e6, 0xb57edc,
  0xff9f45, 0x57c7d4, 0xd84f7a, 0xf7d154, 0x8fbf6a,
];
const pick = <T,>(arr: T[], i: number): T => arr[i % arr.length];

export interface StoreResult {
  group: THREE.Group;
  update: (t: number, dt: number) => void;
  doorOpen: () => number;
  neonLights: { pos: THREE.Vector3; color: THREE.Color; radius: number; base: number }[];
}

export function buildStore(): StoreResult {
  const group = new THREE.Group();
  const anims: ((t: number, dt: number) => void)[] = [];
  const neon: StoreResult['neonLights'] = [];
  let doorOpenAmount = 0;

  const shell = new THREE.Group();
  group.add(shell);

  /* ============ SHELL ============ */
  const wallMat = toon(C.facade, { rough: true });
  const wallShade = toon(C.facadeShade, { rough: true });
  const navyMat = toon(C.navy, { rough: true });

  const W = STORE.x1 - STORE.x0; // 10.5
  const D = STORE.z1 - STORE.z0; // 8
  const cx = (STORE.x0 + STORE.x1) / 2; // -2.75
  const cz = (STORE.z0 + STORE.z1) / 2; // -7

  // back wall
  put(shell, BOX(W, STORE.h, 0.16), wallMat, { pos: [cx, STORE.h / 2, STORE.z0 - 0.08], cast: true, recv: true, outline: true });
  // left wall (alley side)
  put(shell, BOX(0.16, STORE.h, D), wallShade, { pos: [STORE.x0 - 0.08, STORE.h / 2, cz], cast: true, recv: true, outline: true });
  // right wall — split around the corner window (z ∈ [-6.0,-3.6])
  put(shell, BOX(0.16, STORE.h, 5.0), wallMat, { pos: [STORE.x1 + 0.08, STORE.h / 2, -8.5], cast: true, recv: true, outline: true });
  put(shell, BOX(0.16, STORE.h, 0.6), wallMat, { pos: [STORE.x1 + 0.08, STORE.h / 2, -3.3], cast: true, recv: true, outline: true });
  put(shell, BOX(0.16, 1.8, 2.4), wallMat, { pos: [STORE.x1 + 0.08, 3.4, -4.8], cast: true, outline: true });
  put(shell, BOX(0.16, 0.75, 2.4), wallMat, { pos: [STORE.x1 + 0.08, 0.375, -4.8], cast: true, outline: true });

  // roof slab + parapet
  put(shell, BOX(W + 0.5, 0.22, D + 0.5), toon(0xc8cdd2, { rough: true }), { pos: [cx, STORE.h + 0.11, cz], cast: true, recv: true, outline: true });
  const para = toon(0xdfe4e6, { rough: true });
  put(shell, BOX(W + 0.5, 0.5, 0.14), para, { pos: [cx, STORE.h + 0.45, STORE.z1 + 0.18], outline: true });
  put(shell, BOX(W + 0.5, 0.5, 0.14), para, { pos: [cx, STORE.h + 0.45, STORE.z0 - 0.18], outline: true });
  put(shell, BOX(0.14, 0.5, D + 0.5), para, { pos: [STORE.x0 - 0.18, STORE.h + 0.45, cz], outline: true });
  put(shell, BOX(0.14, 0.5, D + 0.5), para, { pos: [STORE.x1 + 0.18, STORE.h + 0.45, cz], outline: true });

  // rooftop equipment
  const roofEq = toon(0x9aa4ad, { rough: true });
  for (let i = 0; i < 3; i++) {
    const rx = -6.4 + i * 2.4;
    put(shell, BOX(1.5, 0.7, 0.95), roofEq, { pos: [rx, STORE.h + 0.57, -9.4], cast: true, outline: true });
    const fan = put(shell, CYL(0.34, 0.34, 0.06, 12), toon(0x5f6873), { pos: [rx, STORE.h + 0.94, -9.4], outline: true });
    const blades = new THREE.Group();
    fan.add(blades);
    for (let b = 0; b < 3; b++) {
      put(blades, BOX(0.6, 0.03, 0.13), toon(0x8a939d), { rot: [0, (b * Math.PI * 2) / 3, 0] });
    }
    const speed = 1.6 + i * 0.7;
    anims.push((t) => { blades.rotation.y = t * speed; });
  }
  // water tank
  put(shell, CYL(0.62, 0.62, 1.15, 14), toon(0x6f7f8c, { rough: true }), { pos: [1.3, STORE.h + 0.8, -9.9], cast: true, outline: true });
  put(shell, CYL(0.68, 0.68, 0.1, 14), toon(0x55636f), { pos: [1.3, STORE.h + 1.4, -9.9], outline: true });
  // pipes on roof
  put(shell, CYL(0.07, 0.07, 6.5, 8), toon(0x8d97a1), { pos: [-1.2, STORE.h + 0.28, -6.5], rot: [0, 0, Math.PI / 2] });

  /* ============ INTERIOR ============ */
  const inner = new THREE.Group();
  group.add(inner);

  // floor
  const floorMat = toon(0xffffff, { map: makeStoreFloor(), emissive: 0x6b5636, emissiveIntensity: 0.55 });
  const floor = put(inner, PLANE(W + 0.06, D + 0.06), floorMat, { pos: [cx, 0.06, cz], rot: [-Math.PI / 2, 0, 0], recv: true });
  floor.renderOrder = 1;

  // floor guide stripe (地面导视)
  const guideMat = toon(0x3fae5a, { emissive: 0x2f8f48, emissiveIntensity: 0.45 });
  decal(inner, 0.17, 5.4, guideMat, -1.55, 0.075, -6.9);
  decal(inner, 0.17, 1.6, guideMat, -3.6, 0.075, -4.2);
  // floor sticker arrow
  const arrow = new THREE.Shape();
  arrow.moveTo(0, 0.34); arrow.lineTo(0.26, -0.06); arrow.lineTo(0.1, -0.06);
  arrow.lineTo(0.1, -0.34); arrow.lineTo(-0.1, -0.34); arrow.lineTo(-0.1, -0.06);
  arrow.lineTo(-0.26, -0.06); arrow.closePath();
  const arrowMesh = new THREE.Mesh(
    new THREE.ShapeGeometry(arrow),
    new THREE.MeshBasicMaterial({ color: 0x2f9e52, transparent: true, opacity: 0.8, toneMapped: false })
  );
  arrowMesh.rotation.set(-Math.PI / 2, 0, 0);
  arrowMesh.position.set(-1.55, 0.078, -5.05);
  arrowMesh.renderOrder = 2;
  inner.add(arrowMesh);

  // ceiling
  put(inner, BOX(W - 0.3, 0.1, D - 0.3), toon(0xf3f1ea, { emissive: 0x3a3325, emissiveIntensity: 0.35 }), { pos: [cx, STORE.ceil + 0.05, cz] });
  // ceiling light boxes (店内灯箱)
  const lightBoxMat = glow(0xfff3d6);
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 2; j++) {
      const lx = -6.6 + i * 2.6;
      const lz = -5.2 + j * 3.6;
      put(inner, BOX(1.7, 0.07, 0.95), lightBoxMat, { pos: [lx, STORE.ceil - 0.02, lz], order: 1 });
      put(inner, BOX(1.82, 0.06, 1.06), toon(0xd6dbe0), { pos: [lx, STORE.ceil + 0.02, lz] });
    }
  }

  // interior lights
  const addInnerLight = (x: number, z: number, i: number, col = 0xffe6bd) => {
    const l = new THREE.PointLight(col, i, 11, 1.7);
    l.position.set(x, STORE.ceil - 0.4, z);
    inner.add(l);
  };
  addInnerLight(-5.4, -5.2, 12);
  addInnerLight(-1.5, -5.2, 11);
  addInnerLight(-5.4, -8.8, 9);
  addInnerLight(0.9, -7.0, 8, 0xffdca8);

  /* --- back wall: drink cooler cases (饮料柜) --- */
  const coolerBody = toon(0xdfe5ea, { rough: true });
  const coolerInner = toon(0xffffff, { map: makeDrinkCase(), emissive: 0xffffff, emissiveIntensity: 0.62, emissiveMap: makeDrinkCase() });
  const glassM = glassMat(0xbfe4ff, 0.1);
  for (let i = 0; i < 4; i++) {
    const ux = -7.15 + i * 1.62;
    const g = new THREE.Group();
    g.position.set(ux, 0, -10.5);
    inner.add(g);
    put(g, BOX(1.56, 2.16, 0.72), coolerBody, { pos: [0, 1.08, 0], outline: true });
    put(g, PLANE(1.4, 1.86), coolerInner, { pos: [0, 1.05, -0.3], rot: [0, 0, 0] });
    // glass doors
    for (let d = 0; d < 2; d++) {
      const dx = -0.36 + d * 0.72;
      put(g, PLANE(0.68, 1.84), glassM, { pos: [dx, 1.05, 0.37], order: 3 });
      put(g, BOX(0.05, 1.9, 0.06), toon(C.aluDark), { pos: [dx - 0.34, 1.05, 0.37], outline: true });
      put(g, BOX(0.05, 1.9, 0.06), toon(C.aluDark), { pos: [dx + 0.34, 1.05, 0.37], outline: true });
      put(g, BOX(0.05, 0.5, 0.07), toon(0x39424d), { pos: [dx + (d === 0 ? 0.3 : -0.3), 1.25, 0.42] });
    }
    put(g, BOX(1.6, 0.16, 0.76), glow(0xeaf6ff), { pos: [0, 2.14, 0] });
    put(g, BOX(1.5, 0.12, 0.05), toon(0x2f9e52, { emissive: 0x2f9e52, emissiveIntensity: 0.5 }), { pos: [0, 0.16, 0.38] });
  }
  neon.push({
    pos: new THREE.Vector3(-4.7, 0, -10.1),
    color: new THREE.Color(0xcfeaff),
    radius: 5.2,
    base: 0.4,
  });

  // staff lockers (储物柜)
  const lockerMat = toon(0x8fa3b8, { rough: true });
  for (let i = 0; i < 6; i++) {
    const lx = -1.42 + i * 0.31;
    put(inner, BOX(0.29, 1.92, 0.5), lockerMat, { pos: [lx, 0.96, -10.62], outline: true });
    put(inner, BOX(0.2, 0.05, 0.02), toon(0x5d6f80), { pos: [lx, 1.3, -10.36] });
    put(inner, BOX(0.16, 0.1, 0.02), toon(0x3f4c59), { pos: [lx, 1.7, -10.36] });
  }

  // back-room door (后场门)
  put(inner, BOX(0.98, 2.14, 0.1), toon(0xcfd6dc, { rough: true }), { pos: [0.92, 1.07, -10.78], outline: true });
  put(inner, PLANE(0.4, 0.4), glassMat(0xdff0ff, 0.34), { pos: [0.92, 1.62, -10.72], order: 3 });
  put(inner, BOX(0.34, 0.12, 0.03), toon(0x2f9e52), { pos: [0.92, 1.28, -10.72] });
  put(inner, BOX(0.06, 0.22, 0.06), toon(0x8d97a1), { pos: [1.28, 1.05, -10.7] });

  /* --- gondola shelves (货架) --- */
  const products = new Instancer(toon(0xffffff, { rough: true }));
  const shelfBoard = toon(C.shelf, { rough: true });
  const shelfUp = toon(C.shelfFrame, { rough: true });

  const gondolaZ0 = -9.7;
  const gondolaZ1 = -6.0;
  const levels = [0.42, 0.82, 1.22, 1.6];
  [-6.85, -4.95, -3.05].forEach((gx, gi) => {
    const len = gondolaZ1 - gondolaZ0;
    const g = new THREE.Group();
    g.position.set(gx, 0, (gondolaZ0 + gondolaZ1) / 2);
    inner.add(g);
    put(g, BOX(0.74, 0.28, len), toon(0xc3ccd4), { pos: [0, 0.14, 0], outline: true });
    // uprights
    for (let u = 0; u <= 3; u++) {
      const uz = -len / 2 + (u * len) / 3;
      put(g, BOX(0.76, 1.78, 0.05), shelfUp, { pos: [0, 0.95, uz], outline: true });
    }
    levels.forEach((ly) => {
      put(g, BOX(0.78, 0.045, len), shelfBoard, { pos: [0, ly, 0] });
      // products both sides
      const steps = 15;
      for (let s = 0; s < steps; s++) {
        const pz = -len / 2 + 0.18 + (s * (len - 0.36)) / (steps - 1);
        for (const side of [-1, 1]) {
          const col = pick(PRODUCT_COLORS, s * 3 + gi * 5 + (side > 0 ? 1 : 0));
          const h = 0.2 + ((s + gi) % 3) * 0.035;
          products.add(gx + side * 0.28, ly + h / 2 + 0.03, (gondolaZ0 + gondolaZ1) / 2 + pz, 0.14, h, 0.17, col);
          products.add(gx + side * 0.1, ly + h / 2 + 0.03, (gondolaZ0 + gondolaZ1) / 2 + pz, 0.14, h, 0.17, pick(PRODUCT_COLORS, s + gi + 4));
        }
      }
      // price rail
      put(g, BOX(0.8, 0.05, len), toon(0xf3f6f8), { pos: [0, ly + 0.045, 0] });
    });
    // top sign plate
    put(g, BOX(0.76, 0.3, len), toon(0x2f9e52, { emissive: 0x1f7a3c, emissiveIntensity: 0.5 }), { pos: [0, 1.92, 0], outline: true });
  });
  products.build(inner);

  // end-cap display at the front of the middle gondola
  const endcap = new THREE.Group();
  endcap.position.set(-4.95, 0, -5.6);
  inner.add(endcap);
  put(endcap, BOX(0.9, 1.3, 0.7), toon(0xe6ebef, { rough: true }), { pos: [0, 0.65, 0], outline: true });
  const snack = new Instancer(toon(0xffffff, { rough: true }));
  for (let l = 0; l < 3; l++) {
    for (let s = 0; s < 4; s++) {
      snack.add(-0.3 + s * 0.2, 0.42 + l * 0.36, 0.3, 0.16, 0.22, 0.1, pick(PRODUCT_COLORS, l * 4 + s + 2));
    }
    put(endcap, BOX(0.86, 0.04, 0.66), shelfBoard, { pos: [0, 0.3 + l * 0.36, 0] });
  }
  snack.build(endcap);
  put(endcap, PLANE(0.8, 0.34), new THREE.MeshBasicMaterial({ map: makePoster(3), toneMapped: false }), { pos: [0, 1.48, 0.02], rot: [0, 0, 0] });

  /* --- chest freezer (冰柜) front-left --- */
  const freezer = new THREE.Group();
  freezer.position.set(-6.5, 0, -4.1);
  inner.add(freezer);
  put(freezer, BOX(2.5, 0.92, 1.0), toon(0xe9eef2, { rough: true }), { pos: [0, 0.46, 0], outline: true });
  put(freezer, BOX(2.4, 0.3, 0.9), toon(0x3f6b8c, { emissive: 0x25506e, emissiveIntensity: 0.4 }), { pos: [0, 0.62, 0] });
  const ice = new Instancer(toon(0xffffff, { rough: true }));
  for (let i = 0; i < 26; i++) {
    ice.add(-1.05 + (i % 9) * 0.24, 0.78, -0.3 + Math.floor(i / 9) * 0.28, 0.2, 0.13, 0.22, pick(PRODUCT_COLORS, i + 7));
  }
  ice.build(freezer);
  put(freezer, BOX(2.44, 0.06, 0.94), glassMat(0xcfeaff, 0.2), { pos: [0, 0.9, 0], order: 3 });
  put(freezer, PLANE(2.3, 0.34), new THREE.MeshBasicMaterial({ map: makePoster(2), toneMapped: false }), { pos: [0, 0.34, 0.51] });

  /* --- bento / onigiri open case (便当区・饭团) by the corner window --- */
  const bento = new THREE.Group();
  bento.position.set(1.85, 0, -7.4);
  inner.add(bento);
  put(bento, BOX(0.78, 1.42, 3.5), toon(0xe4e9ed, { rough: true }), { pos: [0, 0.71, 0], outline: true });
  const bentoTex = makeBentoCase();
  const bentoBack = toon(0xffffff, { map: bentoTex, emissive: 0xffffff, emissiveMap: bentoTex, emissiveIntensity: 0.5 });
  put(bento, PLANE(3.3, 1.1), bentoBack, { pos: [-0.36, 0.86, 0], rot: [0, -Math.PI / 2, 0] });
  const bentoBoxes = new Instancer(toon(0xffffff, { rough: true }));
  for (let l = 0; l < 3; l++) {
    const ly = 0.5 + l * 0.38;
    put(bento, BOX(0.62, 0.04, 3.36), shelfBoard, { pos: [-0.06, ly, 0], rot: [0, 0, 0.16] });
    for (let s = 0; s < 9; s++) {
      const pz = -1.5 + s * 0.36;
      bentoBoxes.add(-0.08, ly + 0.1, pz, 0.3, 0.12, 0.26, pick([0x2f3b52, 0x8c3b2e, 0x3f6b46, 0x6b4a86, 0xd8564a], s + l));
      if (l < 2 && s % 2 === 0) {
        // onigiri triangle
        bentoBoxes.add(-0.08, ly + 0.24, pz, 0.16, 0.15, 0.1, 0xfdfaf0);
      }
    }
  }
  bentoBoxes.build(bento);
  put(bento, BOX(0.1, 0.1, 3.5), glow(0xfff2d8), { pos: [-0.3, 1.38, 0] });

  /* --- magazine rack (杂志架) on the right wall --- */
  const rack = new THREE.Group();
  rack.position.set(2.1, 0, -8.9);
  inner.add(rack);
  put(rack, BOX(0.5, 1.62, 2.1), toon(0xdfe4e8, { rough: true }), { pos: [0, 0.81, 0], outline: true });
  const magTex = [makeMagazine(0), makeMagazine(1), makeMagazine(2), makeMagazine(3), makeMagazine(4)];
  for (let l = 0; l < 3; l++) {
    const ly = 0.5 + l * 0.44;
    put(rack, BOX(0.44, 0.035, 2.0), shelfBoard, { pos: [-0.02, ly, 0], rot: [0, 0, 0.3] });
    for (let s = 0; s < 6; s++) {
      const mz = -0.85 + s * 0.34;
      put(rack, PLANE(0.26, 0.36), new THREE.MeshBasicMaterial({ map: pick(magTex, s + l), toneMapped: false }), { pos: [-0.2, ly + 0.2, mz], rot: [-0.32, -Math.PI / 2, 0] });
    }
  }

  /* --- register counter (收银台) --- */
  const reg = new THREE.Group();
  reg.position.set(-0.9, 0, -4.35);
  inner.add(reg);
  put(reg, BOX(2.5, 0.94, 0.72), toon(0xe7e2d5, { rough: true }), { pos: [0, 0.47, 0], outline: true });
  put(reg, BOX(2.56, 0.06, 0.78), toon(0x9aa3ac), { pos: [0, 0.97, 0] });
  put(reg, BOX(2.4, 0.16, 0.05), toon(0x2f9e52, { emissive: 0x2f9e52, emissiveIntensity: 0.55 }), { pos: [0, 0.72, 0.37] });
  // register terminal
  put(reg, BOX(0.42, 0.1, 0.34), toon(0x39424d), { pos: [-0.6, 1.05, 0.02], outline: true });
  put(reg, BOX(0.34, 0.24, 0.05), glow(0x9fe6ff), { pos: [-0.6, 1.2, -0.1], rot: [-0.32, 0, 0] });
  // candy display on counter
  const candy = new Instancer(toon(0xffffff, { rough: true }));
  for (let i = 0; i < 22; i++) {
    candy.add(0.35 + (i % 6) * 0.16, 1.14, -0.2 + Math.floor(i / 6) * 0.14, 0.12, 0.16, 0.1, pick(PRODUCT_COLORS, i));
  }
  candy.build(reg);
  put(reg, BOX(1.05, 0.4, 0.5), glassMat(0xdff2ff, 0.16), { pos: [0.72, 1.2, -0.06], order: 3 });

  // service shelf behind register
  put(inner, BOX(2.5, 2.05, 0.42), toon(0xe9eef1, { rough: true }), { pos: [-0.9, 1.02, -5.1], outline: true });
  const tabs = new Instancer(toon(0xffffff, { rough: true }));
  for (let r = 0; r < 5; r++) {
    for (let s = 0; s < 12; s++) {
      tabs.add(-1.95 + s * 0.19, 0.5 + r * 0.32, -4.92, 0.15, 0.22, 0.09, pick([0xc9a227, 0x3f6b8c, 0xa8452f, 0x4a6b3f, 0x6b4a86, 0xdfe4e8], r + s));
    }
  }
  tabs.build(inner);
  put(inner, BOX(2.4, 0.22, 0.06), glow(0xfff0cf), { pos: [-0.9, 2.16, -4.94] });

  // illuminated menu board (店内灯箱)
  put(inner, PLANE(1.5, 0.72), new THREE.MeshBasicMaterial({ map: makePoster(4), toneMapped: false }), { pos: [-0.9, 2.72, -5.15], order: 1 });
  put(inner, BOX(1.62, 0.84, 0.08), toon(0x39424d), { pos: [-0.9, 2.72, -5.2], outline: true });

  /* --- coffee machine (咖啡机) --- */
  const coffee = new THREE.Group();
  coffee.position.set(-2.75, 0, -4.4);
  inner.add(coffee);
  put(coffee, BOX(0.95, 0.92, 0.6), toon(0xdcd7cb), { pos: [0, 0.46, 0], outline: true });
  put(coffee, BOX(0.62, 0.72, 0.46), toon(0x2f3b52, { rough: true }), { pos: [0, 1.28, -0.02], outline: true });
  const coffeeGlowMat = glow(0xff9d4d);
  const coffeeGlow = put(coffee, BOX(0.4, 0.16, 0.04), coffeeGlowMat, { pos: [0, 1.44, 0.22] });
  put(coffee, CYL(0.05, 0.045, 0.13, 10), toon(0xf3f6f8), { pos: [0, 0.99, 0.1] });
  put(coffee, CYL(0.05, 0.045, 0.13, 10), toon(0xf3f6f8), { pos: [0.14, 0.99, 0.1] });
  anims.push((t) => {
    coffeeGlowMat.color.setHSL(0.07, 0.9, 0.55 + Math.sin(t * 2.2) * 0.08);
    coffeeGlow.scale.setScalar(1 + Math.sin(t * 2.2) * 0.02);
  });
  // cup stack
  for (let i = 0; i < 4; i++) {
    put(coffee, CYL(0.075, 0.06, 0.05, 10), toon(0xf6f2e8), { pos: [-0.3, 0.95 + i * 0.048, 0.05] });
  }

  /* --- oden counter (关东煮柜台) with steam --- */
  const oden = new THREE.Group();
  oden.position.set(0.95, 0, -4.35);
  inner.add(oden);
  put(oden, BOX(1.25, 0.94, 0.72), toon(0xe7e2d5, { rough: true }), { pos: [0, 0.47, 0], outline: true });
  put(oden, BOX(1.15, 0.2, 0.6), toon(0xb9c6cf), { pos: [0, 1.0, 0], outline: true });
  const odenBroth = put(oden, BOX(1.05, 0.06, 0.5), glow(0xffc46b), { pos: [0, 1.09, 0] });
  // divider grid
  for (let i = 0; i < 4; i++) put(oden, BOX(0.02, 0.08, 0.5), toon(0x9aa8b2), { pos: [-0.42 + i * 0.28, 1.11, 0] });
  for (let i = 0; i < 2; i++) put(oden, BOX(1.05, 0.08, 0.02), toon(0x9aa8b2), { pos: [0, 1.11, -0.16 + i * 0.32] });
  // skewered items
  const odenItems = new Instancer(toon(0xffffff, { rough: true }));
  for (let i = 0; i < 12; i++) {
    odenItems.add(-0.45 + (i % 5) * 0.22, 1.14, -0.18 + Math.floor(i / 5) * 0.2, 0.13, 0.09, 0.13, pick([0xf0d9a8, 0xe8b47c, 0xf6efe0, 0xd98c4a], i));
  }
  odenItems.build(oden);
  put(oden, BOX(1.2, 0.3, 0.04), glassMat(0xffe9c9, 0.16), { pos: [0, 1.28, 0.34], rot: [-0.24, 0, 0], order: 3 });
  put(oden, PLANE(1.1, 0.2), new THREE.MeshBasicMaterial({ map: makePoster(1), toneMapped: false }), { pos: [0, 0.66, 0.37] });

  // steam sprites
  const steamTex = makeSoftDot('rgba(255,240,220,0.85)');
  const steam: THREE.Sprite[] = [];
  for (let i = 0; i < 9; i++) {
    const s = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: steamTex,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
      })
    );
    s.scale.setScalar(0.3);
    s.position.set(0.95 + (Math.random() - 0.5) * 0.9, 1.2, -4.35 + (Math.random() - 0.5) * 0.4);
    s.renderOrder = 5;
    inner.add(s);
    steam.push(s);
  }
  const steamSeed = steam.map(() => Math.random());
  anims.push((t) => {
    steam.forEach((s, i) => {
      const p = (t * 0.24 + steamSeed[i]) % 1;
      s.position.y = 1.15 + p * 1.5;
      s.position.x = 0.95 + Math.sin(p * 5 + steamSeed[i] * 9) * 0.16;
      const sc = 0.22 + p * 0.55;
      s.scale.setScalar(sc);
      (s.material as THREE.SpriteMaterial).opacity = Math.sin(p * Math.PI) * 0.3;
    });
  });

  /* --- interior posters + hanging banners (宣传海报) --- */
  const posterMats = [0, 1, 2, 3, 4].map(
    (i) => new THREE.MeshBasicMaterial({ map: makePoster(i), toneMapped: false })
  );
  for (let i = 0; i < 3; i++) {
    put(inner, PLANE(0.66, 0.92), posterMats[i], { pos: [-6.9 + i * 1.7, 2.72, -10.68], order: 1 });
  }
  put(inner, PLANE(0.8, 1.1), posterMats[3], { pos: [-7.86, 2.1, -7.2], rot: [0, Math.PI / 2, 0], order: 1 });
  // hanging banners
  for (let i = 0; i < 2; i++) {
    const bx = -5.6 + i * 3.1;
    put(inner, PLANE(1.5, 0.5), posterMats[(i + 1) % 5], { pos: [bx, STORE.ceil - 0.42, -6.4], order: 1 });
    put(inner, BOX(0.02, 0.3, 0.02), toon(0x9aa3ac), { pos: [bx - 0.7, STORE.ceil - 0.06, -6.4] });
    put(inner, BOX(0.02, 0.3, 0.02), toon(0x9aa3ac), { pos: [bx + 0.7, STORE.ceil - 0.06, -6.4] });
  }

  /* ============ FACADE ============ */
  const facade = new THREE.Group();
  group.add(facade);
  const FZ = STORE.z1; // -3

  // solid left segment (behind vending machines)
  put(facade, BOX(3.4, 3.2, 0.18), wallMat, { pos: [-6.3, 1.6, FZ - 0.09], cast: true, recv: true, outline: true });
  // corner column
  put(facade, BOX(0.3, 3.2, 0.2), wallMat, { pos: [2.35, 1.6, FZ - 0.1], cast: true, outline: true });
  // fascia band above the glass
  put(facade, BOX(W, 0.42, 0.26), toon(C.facadeShade, { rough: true }), { pos: [cx, 3.31, FZ - 0.05], cast: true, outline: true });
  put(facade, BOX(W + 0.1, 0.1, 0.3), toon(C.green, { emissive: 0x14724a, emissiveIntensity: 0.4 }), { pos: [cx, 3.08, FZ - 0.02] });
  // kick plate under the glass
  put(facade, BOX(7.0, 0.2, 0.22), navyMat, { pos: [-1.15, 0.1, FZ - 0.06], outline: true });
  // upper wall band carrying the signboard
  put(facade, BOX(W + 0.2, 0.95, 0.2), wallMat, { pos: [cx, 3.86, FZ - 0.09], cast: true, outline: true });

  /* --- main signboard --- */
  const signGroup = new THREE.Group();
  signGroup.position.set(cx + 0.3, 3.86, FZ - 0.1);
  facade.add(signGroup);
  put(signGroup, BOX(9.4, 1.0, 0.34), toon(0xeef2f0, { rough: true }), { pos: [0, 0, -0.12], cast: true, outline: true });
  put(signGroup, PLANE(9.2, 0.92), new THREE.MeshBasicMaterial({ map: makeStoreSign(), toneMapped: false }), { pos: [0, 0, 0.08], order: 1 });
  // glass cover sheen
  put(signGroup, PLANE(9.2, 0.92), glassMat(0xffffff, 0.06), { pos: [0, 0, 0.11], order: 4 });
  const signLight = new THREE.PointLight(0xdff5e8, 6, 12, 1.8);
  signLight.position.set(0, -0.3, 1.1);
  signGroup.add(signLight);
  neon.push({ pos: new THREE.Vector3(cx + 0.3, 3.5, FZ + 0.6), color: new THREE.Color(0xbff0d8), radius: 4.2, base: 0.62 });

  // small flickering neon segment on the sign edge
  const flickerBar = put(signGroup, BOX(1.5, 0.09, 0.06), glow(0x7dffcf), { pos: [-3.2, -0.52, 0.1] });
  anims.push((t) => {
    const n = Math.sin(t * 21.3) * Math.sin(t * 7.1) * Math.sin(t * 3.3);
    const on = n > -0.55 ? 1 : 0.12 + Math.random() * 0.2;
    (flickerBar.material as THREE.MeshBasicMaterial).color.setRGB(
      0.49 * on,
      1.0 * on,
      0.81 * on
    );
    signLight.intensity = 5.4 + on * 1.1 + Math.sin(t * 1.7) * 0.25;
  });

  /* --- awning / canopy (屋檐雨棚) --- */
  const awnZ0 = FZ;
  const awnZ1 = FZ + 1.25;
  const awn = new THREE.Group();
  facade.add(awn);
  const AWN_CX = -1.15;
  put(awn, BOX(7.2, 0.14, 1.3), toon(0xe9edf0, { rough: true }), { pos: [AWN_CX, 3.0, awnZ0 + 0.62], cast: true, outline: true });
  put(awn, BOX(7.2, 0.2, 0.1), navyMat, { pos: [AWN_CX, 2.95, awnZ1 - 0.04], outline: true });
  // LED strip under the front edge
  const ledStrip = put(awn, BOX(7.0, 0.05, 0.05), glow(0xfff0cf), { pos: [AWN_CX, 2.88, awnZ1 - 0.12] });
  const awnLight = new THREE.PointLight(0xffe6bd, 3.4, 7.5, 2);
  awnLight.position.set(AWN_CX, 2.7, awnZ1 - 0.5);
  awn.add(awnLight);
  // support brackets
  [-3.1, 0, 3.1].forEach((bx) => {
    put(awn, BOX(0.09, 0.5, 0.09), toon(C.aluDark), { pos: [AWN_CX + bx, 2.72, awnZ1 - 0.2] });
  });
  neon.push({ pos: new THREE.Vector3(AWN_CX, 0, awnZ1 + 0.25), color: new THREE.Color(0xffdca8), radius: 4.0, base: 0.5 });

  /* --- storefront glazing + mullions --- */
  const glass = glassMat(0xa8d8ff, 0.12);
  const mullion = toon(C.aluDark, { rough: true });
  const GX0 = -4.6;
  const GX1 = 2.2;
  const mullions = [-4.6, -3.3, -2.0, -0.7, 1.7, 2.2];
  // verticals
  mullions.forEach((mx) => {
    put(facade, BOX(0.09, 2.9, 0.12), mullion, { pos: [mx, 1.65, FZ + 0.02], outline: true });
  });
  put(facade, BOX(GX1 - GX0, 0.1, 0.13), mullion, { pos: [(GX0 + GX1) / 2, 3.06, FZ + 0.02] });
  put(facade, BOX(GX1 - GX0, 0.1, 0.13), mullion, { pos: [(GX0 + GX1) / 2, 0.22, FZ + 0.02] });

  // fixed glass panes
  const paneSpans: [number, number][] = [
    [-4.6, -3.3], [-3.3, -2.0], [-2.0, -0.7], [1.7, 2.2],
  ];
  paneSpans.forEach(([a, b]) => {
    put(facade, PLANE(b - a - 0.09, 2.74), glass, { pos: [(a + b) / 2, 1.65, FZ + 0.01], order: 3 });
  });
  // transom above doors
  put(facade, PLANE(2.3, 0.55), glass, { pos: [0.5, 2.72, FZ + 0.01], order: 3 });
  put(facade, BOX(2.5, 0.1, 0.13), mullion, { pos: [0.5, 2.42, FZ + 0.02] });

  /* --- automatic sliding doors (自动门) --- */
  const doorFrame = toon(C.alu, { rough: true });
  const leaves: THREE.Group[] = [];
  for (let i = 0; i < 2; i++) {
    const leaf = new THREE.Group();
    leaf.position.set(i === 0 ? -0.075 : 1.075, 0, FZ + 0.06);
    facade.add(leaf);
    leaves.push(leaf);
    put(leaf, BOX(1.15, 2.3, 0.07), doorFrame, { pos: [0, 1.15, 0], outline: true });
    put(leaf, PLANE(0.98, 2.06), glassMat(0xbfe0ff, 0.14), { pos: [0, 1.16, 0.045], order: 3 });
    put(leaf, BOX(1.15, 0.16, 0.09), toon(i === 0 ? C.green : C.blue, { emissive: 0x0d3d5c, emissiveIntensity: 0.3 }), { pos: [0, 2.22, 0] });
    // frosted safety band
    put(leaf, PLANE(0.98, 0.16), new THREE.MeshBasicMaterial({ color: 0xf3f7fa, transparent: true, opacity: 0.6 }), { pos: [0, 1.16, 0.05], order: 4 });
  }
  const leafClosed = [-0.075, 1.075];
  const leafOpen = [-1.2, 2.2];

  // door sensor + motion sign
  put(facade, BOX(0.5, 0.12, 0.14), toon(0x39424d), { pos: [0.5, 2.52, FZ + 0.12], outline: true });
  const sensorLed = put(facade, BOX(0.08, 0.05, 0.03), glow(0x66ff9d), { pos: [0.5, 2.5, FZ + 0.2] });

  // doormat (门口地垫)
  put(facade, BOX(2.3, 0.045, 1.0), toon(0x2f5d43, { rough: true }), { pos: [0.5, 0.165, FZ + 0.85], recv: true, outline: true });
  put(facade, BOX(2.1, 0.01, 0.8), toon(0x3f7d59), { pos: [0.5, 0.19, FZ + 0.85] });

  // warm light spill onto the pavement (grows when the doors open)
  const spillTex = makeSoftDot('rgba(255,226,178,0.95)');
  const spill = new THREE.Mesh(
    PLANE(6.4, 4.2),
    new THREE.MeshBasicMaterial({
      map: spillTex,
      transparent: true,
      opacity: 0.34,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
    })
  );
  spill.rotation.x = -Math.PI / 2;
  spill.position.set(-1.0, 0.19, FZ + 2.1);
  spill.renderOrder = 5;
  facade.add(spill);

  /* --- glass rain droplets + reflection sheen --- */
  const dripMat = (lanes: number) => new THREE.Mesh(PLANE(1, 1), dripFactory(lanes));
  const dripPanes: THREE.Mesh[] = [];
  paneSpans.forEach(([a, b]) => {
    const d = dripMat(18);
    d.scale.set(b - a - 0.1, 2.72, 1);
    d.position.set((a + b) / 2, 1.65, FZ + 0.075);
    d.renderOrder = 6;
    facade.add(d);
    dripPanes.push(d);
  });
  const doorDrip = dripMat(24);
  doorDrip.scale.set(2.24, 2.28, 1);
  doorDrip.position.set(0.5, 1.16, FZ + 0.13);
  doorDrip.renderOrder = 6;
  facade.add(doorDrip);
  dripPanes.push(doorDrip);

  // diagonal glass sheen across the whole storefront
  const sheen = new THREE.Mesh(
    PLANE(6.9, 2.78),
    new THREE.MeshBasicMaterial({
      map: makeGlassSheen(),
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
      fog: false,
    })
  );
  sheen.position.set(-1.15, 1.66, FZ + 0.045);
  sheen.renderOrder = 4;
  facade.add(sheen);

  // right-wall corner window
  put(facade, PLANE(2.3, 2.0), glass, { pos: [STORE.x1 + 0.1, 1.5, -4.8], rot: [0, Math.PI / 2, 0], order: 3 });
  const sideDrip = dripMat(14);
  sideDrip.scale.set(2.28, 1.98, 1);
  sideDrip.position.set(STORE.x1 + 0.16, 1.5, -4.8);
  sideDrip.rotation.y = Math.PI / 2;
  sideDrip.renderOrder = 6;
  facade.add(sideDrip);
  dripPanes.push(sideDrip);
  [[-6.0], [-3.6]].forEach(([wz]) => {
    put(facade, BOX(0.12, 2.1, 0.1), mullion, { pos: [STORE.x1 + 0.1, 1.5, wz], outline: true });
  });
  put(facade, BOX(0.13, 0.1, 2.5), mullion, { pos: [STORE.x1 + 0.1, 2.52, -4.8] });
  put(facade, BOX(0.13, 0.1, 2.5), mullion, { pos: [STORE.x1 + 0.1, 0.46, -4.8] });

  // window posters (贴窗海报) seen from outside
  put(facade, PLANE(0.72, 1.0), posterMats[0], { pos: [-4.0, 1.75, FZ - 0.06], rot: [0, Math.PI, 0], order: 2 });
  put(facade, PLANE(0.72, 1.0), posterMats[2], { pos: [-1.4, 1.75, FZ - 0.06], rot: [0, Math.PI, 0], order: 2 });
  put(facade, PLANE(0.5, 0.7), posterMats[4], { pos: [1.95, 1.9, FZ - 0.06], rot: [0, Math.PI, 0], order: 2 });

  // side sign on the right wall
  put(facade, BOX(0.12, 2.5, 0.62), new THREE.MeshBasicMaterial({ map: makeSideSign(), toneMapped: false }), { pos: [STORE.x1 + 0.2, 2.5, -7.4], outline: true, cast: true });

  /* --- vending machines (自动贩卖机) --- */
  const vendKinds: ('drink' | 'coffee' | 'water')[] = ['drink', 'coffee', 'water'];
  const vendGlowColors = [0xff5a4d, 0x5f8fe0, 0x59cfe8];
  vendKinds.forEach((k, i) => {
    const vx = -7.55 + i * 1.0;
    const g = new THREE.Group();
    g.position.set(vx, 0.14, FZ + 0.42);
    facade.add(g);
    put(g, BOX(0.96, 1.92, 0.8), toon(0x2b3340, { rough: true }), { pos: [0, 0.96, 0], cast: true, recv: true, outline: true });
    const faceTex = makeVending(k);
    const face = put(g, PLANE(0.88, 1.78), new THREE.MeshBasicMaterial({ map: faceTex, toneMapped: false }), { pos: [0, 0.98, 0.41], order: 1 });
    put(g, BOX(1.02, 0.1, 0.9), toon(0x39424d), { pos: [0, 1.96, -0.02], outline: true });
    const vl = i < 2 ? new THREE.PointLight(vendGlowColors[i], 2.4, 5.2, 2) : null;
    if (vl) {
      vl.position.set(0, 1.1, 0.95);
      g.add(vl);
    }
    neon.push({
      pos: new THREE.Vector3(vx, 1.0, FZ + 1.0),
      color: new THREE.Color(vendGlowColors[i]),
      radius: 2.4,
      base: 0.55,
    });
    const base = 2.4;
    anims.push((t) => {
      const f = k === 'coffee' && Math.sin(t * 3.1 + i) > 0.985 ? 0.35 : 1;
      if (vl) vl.intensity = base * f;
      (face.material as THREE.MeshBasicMaterial).color.setScalar(0.9 + f * 0.1);
    });
  });
  // vending canopy
  put(facade, BOX(3.4, 0.12, 1.15), toon(0xe6eaee, { rough: true }), { pos: [-6.43, 2.42, FZ + 0.5], cast: true, outline: true });
  put(facade, BOX(3.4, 0.16, 0.08), navyMat, { pos: [-6.43, 2.36, FZ + 1.05] });
  // recycling bin beside the machines
  const bin = new THREE.Group();
  bin.position.set(-4.83, 0.14, FZ + 0.42);
  facade.add(bin);
  put(bin, BOX(0.5, 0.92, 0.6), toon(0xdfe4e8, { rough: true }), { pos: [0, 0.46, 0], cast: true, outline: true });
  for (let i = 0; i < 3; i++) {
    put(bin, CYL(0.075, 0.075, 0.05, 12), toon([0x2f9e52, 0x2b7fd4, 0xe0483c][i]), { pos: [-0.15 + i * 0.15, 0.94, 0] });
  }
  put(bin, PLANE(0.4, 0.18), new THREE.MeshBasicMaterial({ map: makePoster(4), toneMapped: false }), { pos: [0, 0.6, 0.31] });

  /* --- alley side: back door, pipes, AC units, wall lamp --- */
  const alley = new THREE.Group();
  group.add(alley);
  put(alley, BOX(1.0, 2.15, 0.12), toon(0xb9c2cb, { rough: true }), { pos: [STORE.x0 - 0.14, 1.07, -8.2], rot: [0, Math.PI / 2, 0], outline: true });
  // pipes
  put(alley, CYL(0.09, 0.09, 7.4, 8), toon(0x8d97a1), { pos: [STORE.x0 - 0.22, 0.5, cz], rot: [Math.PI / 2, 0, 0] });
  put(alley, CYL(0.07, 0.07, 4.1, 8), toon(0x77828f), { pos: [STORE.x0 - 0.34, 2.05, cz], rot: [0, 0, 0] });
  // AC outdoor units (空调外机)
  const acFans: THREE.Object3D[] = [];
  [[-9.4, 0], [-7.4, 0], [-9.1, 2.6]].forEach(([az, ay], i) => {
    const ac = new THREE.Group();
    ac.position.set(STORE.x0 - 0.62, 0.42 + ay, az);
    alley.add(ac);
    put(ac, BOX(0.5, 0.78, 0.92), toon(0xd5dade, { rough: true }), { pos: [0, 0, 0], cast: true, outline: true });
    const grille = put(ac, CYL(0.3, 0.3, 0.06, 16), toon(0x6f7a85), { pos: [-0.26, 0.04, 0], rot: [0, 0, Math.PI / 2] });
    const blades = new THREE.Group();
    grille.add(blades);
    for (let b = 0; b < 3; b++) put(blades, BOX(0.04, 0.52, 0.1), toon(0x9aa4ad), { rot: [(b * Math.PI) / 3, 0, 0] });
    acFans.push(blades);
    if (i === 2) put(ac, BOX(0.6, 0.1, 1.0), toon(0xb9c2cb), { pos: [0.05, -0.44, 0] });
  });
  anims.push((t) => {
    acFans.forEach((f, i) => { f.rotation.x = t * (5.5 + i * 1.3); });
  });
  // dim alley wall lamp
  const alleyLamp = put(alley, BOX(0.22, 0.12, 0.14), glow(0xffcf8a), { pos: [STORE.x0 - 0.2, 2.6, -5.2], rot: [0, 0, 0] });
  const alleyLight = new THREE.PointLight(0xffb46b, 2.6, 6.5, 2);
  alleyLight.position.set(STORE.x0 - 0.9, 2.5, -5.2);
  alley.add(alleyLight);
  neon.push({ pos: new THREE.Vector3(STORE.x0 - 0.9, 2.4, -5.2), color: new THREE.Color(0xffb46b), radius: 2.6, base: 0.4 });
  anims.push((t) => {
    const f = 0.82 + Math.sin(t * 9.1) * 0.06 + (Math.random() > 0.985 ? -0.35 : 0);
    alleyLight.intensity = 2.6 * f;
    (alleyLamp.material as THREE.MeshBasicMaterial).color.setScalar(0.85 * f + 0.15);
  });
  // crates in the alley
  [[-10.9, -9.6, 0.5], [-10.6, -8.8, 0.36], [-11.2, -6.2, 0.44]].forEach(([ax, az, s]) => {
    put(alley, BOX(s, s, s), toon(0x8a6a45, { rough: true }), { pos: [ax, s / 2, az], cast: true, outline: true });
  });

  /* ============ DOOR + SIGN STATE MACHINE ============ */
  let doorState: 'closed' | 'opening' | 'open' | 'closing' = 'closed';
  let doorTimer = 4.5;
  const DOOR_SPEED = 1.35;

  anims.push((t, dt) => {
    doorTimer -= dt;
    if (doorState === 'closed' && doorTimer <= 0) {
      doorState = 'opening';
    } else if (doorState === 'opening') {
      doorOpenAmount = Math.min(1, doorOpenAmount + dt * DOOR_SPEED);
      if (doorOpenAmount >= 1) {
        doorState = 'open';
        doorTimer = 1.9 + Math.random() * 1.6;
      }
    } else if (doorState === 'open' && doorTimer <= 0) {
      doorState = 'closing';
    } else if (doorState === 'closing') {
      doorOpenAmount = Math.max(0, doorOpenAmount - dt * DOOR_SPEED * 0.85);
      if (doorOpenAmount <= 0) {
        doorState = 'closed';
        doorTimer = 5.5 + Math.random() * 6.5;
      }
    }
    const e = doorOpenAmount * doorOpenAmount * (3 - 2 * doorOpenAmount);
    leaves.forEach((leaf, i) => {
      leaf.position.x = THREE.MathUtils.lerp(leafClosed[i], leafOpen[i], e);
    });
    // interior light spills further when the doors slide open
    (spill.material as THREE.MeshBasicMaterial).opacity = 0.3 + e * 0.3;
    spill.scale.set(1 + e * 0.14, 1 + e * 0.3, 1);
    (sensorLed.material as THREE.MeshBasicMaterial).color.setRGB(
      doorState === 'closed' ? 0.2 : 0.4,
      doorState === 'closed' ? 1.0 : 0.4,
      doorState === 'closed' ? 0.6 : 0.3
    );
    // gentle breathing of the interior lighting
    awnLight.intensity = 3.2 + Math.sin(t * 1.3) * 0.18;
    (ledStrip.material as THREE.MeshBasicMaterial).color.setScalar(
      0.94 + Math.sin(t * 1.3) * 0.06
    );
    (odenBroth.material as THREE.MeshBasicMaterial).color.setHSL(
      0.09,
      0.85,
      0.6 + Math.sin(t * 2.4) * 0.04
    );
  });

  const update = (t: number, dt: number) => {
    for (const a of anims) a(t, dt);
  };

  return {
    group,
    update,
    doorOpen: () => doorOpenAmount,
    neonLights: neon,
  };
}

/* ---------- shared glass-drip material factory (avoids circular import) ---------- */
import { createGlassDripMaterial } from './shaders';
const dripMats: THREE.ShaderMaterial[] = [];
function dripFactory(lanes: number) {
  const m = createGlassDripMaterial(0xcfe8ff, lanes);
  dripMats.push(m);
  return m;
}
export function updateDrips(t: number) {
  dripMats.forEach((m) => (m.uniforms.uTime.value = t));
}

export function resetDrips() {
  dripMats.forEach((m) => m.dispose());
  dripMats.length = 0;
}

/* ---------- pole sign (placed by street builder, styled by store) ---------- */
export function buildPoleSign(): { group: THREE.Group; update: (t: number) => void } {
  const g = new THREE.Group();
  put(g, CYL(0.11, 0.13, 3.1, 12), toon(0xb6c0cb, { rough: true }), { pos: [0, 1.55, 0], cast: true, outline: true });
  put(g, BOX(0.62, 0.1, 0.62), toon(0x77828f), { pos: [0, 0.06, 0], outline: true });
  const body = put(g, BOX(0.78, 1.62, 0.2), toon(0xf2f7f5, { rough: true }), { pos: [0, 3.85, 0], cast: true, outline: true });
  const faceMat = new THREE.MeshBasicMaterial({ map: makePoleSign(), toneMapped: false });
  put(g, PLANE(0.7, 1.5), faceMat, { pos: [0, 3.85, 0.11], order: 1 });
  put(g, PLANE(0.7, 1.5), faceMat, { pos: [0, 3.85, -0.11], rot: [0, Math.PI, 0], order: 1 });
  put(g, BOX(0.84, 0.1, 0.26), toon(C.green, { emissive: 0x14724a, emissiveIntensity: 0.5 }), { pos: [0, 4.7, 0] });
  put(g, BOX(0.84, 0.1, 0.26), toon(C.blue, { emissive: 0x123c66, emissiveIntensity: 0.5 }), { pos: [0, 3.0, 0] });
  const l = new THREE.PointLight(0xcfeaff, 3.2, 8, 2);
  l.position.set(0, 3.85, 0.7);
  g.add(l);
  body.name = 'poleSignBody';

  const update = (t: number) => {
    // soft neon pulse with an occasional hesitant flicker
    const flick = Math.sin(t * 13.7) > 0.992 ? 0.45 : 1;
    l.intensity = (3.0 + Math.sin(t * 2.1) * 0.22) * flick;
    faceMat.color.setScalar(0.9 * flick + 0.1);
  };
  return { group: g, update };
}
