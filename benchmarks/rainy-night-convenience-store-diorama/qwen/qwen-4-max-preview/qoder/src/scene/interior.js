import * as THREE from 'three';
import { L } from '../core/layout.js';
import { Batch, G, mat, seeded } from '../core/gfx.js';
import { makeInnerGlass } from '../fx/glass.js';

const FLOOR = 0.18, CEIL = 3.05;
const IX0 = -7.35, IX1 = 2.35, IZ0 = -6.95, IZ1 = 0.45;

const SNACK = ['#e8503c', '#f2a03c', '#f6d24b', '#5fbf6a', '#4aa8e0', '#8a6fd8',
  '#f06292', '#f4f1e6', '#3fc2b0', '#e0762f', '#c94f7c', '#7fc44a',
  '#ffffff', '#ffd9a0', '#5c8fd8', '#d84a4a'];
const DRINK = ['#3f9b52', '#7b4a2a', '#4fb6e8', '#9fd8ff', '#ff9a2e', '#c8e04a',
  '#d8a86a', '#c0392b', '#4fd8c0', '#c9a27a', '#9b59b6', '#f2d24b', '#e8eef5'];

export function buildInterior(scene, TX) {
  const b = new Batch();
  const dyn = new THREE.Group(); dyn.name = 'interior-dyn';
  scene.add(dyn);
  const rnd = seeded(20261114);
  const pick = (a) => a[Math.floor(rnd() * a.length)];

  /* ------------------------- floor & ceiling ----------------------- */
  b.plane(IX1 - IX0, IZ1 - IZ0, 'intFloor', (IX0 + IX1) / 2, FLOOR, (IZ0 + IZ1) / 2,
    { rx: -Math.PI / 2, uvScale: [(IX1 - IX0) / 1.6, (IZ1 - IZ0) / 1.6] });
  b.plane(IX1 - IX0, IZ1 - IZ0, 'intCeil', (IX0 + IX1) / 2, CEIL, (IZ0 + IZ1) / 2, { rx: Math.PI / 2 });
  // ceiling grid + light panels
  for (let i = 0; i < 5; i++) {
    b.box(IX1 - IX0, 0.05, 0.05, 'intTrim', (IX0 + IX1) / 2, CEIL - 0.03, IZ0 + 0.9 + i * 1.5, { outline: 0 });
  }
  const panels = [];
  for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) {
    const x = -6.3 + c * 2.4, z = -6.0 + r * 2.4;
    b.box(1.7, 0.07, 0.42, 'intTrim', x, CEIL - 0.04, z, { outline: 0 });
    const p = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.34), mat('lightPanel'));
    p.rotation.x = Math.PI / 2;
    p.position.set(x, CEIL - 0.08, z);
    dyn.add(p); panels.push(p);
  }
  // floor guide arrows toward the register
  b.plane(3.4, 0.34, 'floorGuide', -1.4, FLOOR + 0.006, -1.15, { rx: -Math.PI / 2, uvScale: [3, 1] });
  b.plane(0.34, 1.8, 'floorGuide', 0.55, FLOOR + 0.006, -1.9, { rx: -Math.PI / 2, rz: Math.PI / 2, uvScale: [2, 1] });

  /* --------------------------- drink cooler ------------------------ */
  const cz = IZ0 + 0.36, cx0 = -7.0, cx1 = 0.0, ch = 2.25;
  b.box(cx1 - cx0, ch, 0.72, 'intShelf', (cx0 + cx1) / 2, FLOOR + ch / 2, cz, { outline: 0.0008 });
  b.box(cx1 - cx0 + 0.1, 0.22, 0.78, 'intTrim', (cx0 + cx1) / 2, FLOOR + ch + 0.11, cz, { outline: 0.0007 });
  b.plane(cx1 - cx0 - 0.1, 0.18, 'bandStripe', (cx0 + cx1) / 2, FLOOR + ch + 0.11, cz + 0.40, { uvScale: [8, 1] });
  const doors = 5, dw = (cx1 - cx0) / doors;
  for (let d = 0; d < doors; d++) {
    const x = cx0 + dw * (d + 0.5);
    // glowing cavity
    b.plane(dw - 0.14, ch - 0.24, 'coolerGlow', x, FLOOR + ch / 2, cz + 0.30, {});
    b.box(0.05, ch - 0.2, 0.05, 'intMetal', x - dw / 2 + 0.05, FLOOR + ch / 2, cz + 0.34, { outline: 0.0004 });
    // shelves + bottles
    for (let s = 0; s < 4; s++) {
      const y = FLOOR + 0.30 + s * 0.48;
      b.box(dw - 0.14, 0.03, 0.34, 'intMetal', x, y, cz + 0.16, { outline: 0.0003 });
      b.plane(dw - 0.16, 0.02, 'lightPanelCool', x, y + 0.44, cz + 0.30, { rx: -Math.PI / 2 });
      const n = 7;
      for (let i = 0; i < n; i++) {
        const bx = x - dw / 2 + 0.16 + i * ((dw - 0.3) / (n - 1));
        const col = DRINK[(d * 4 + s + i) % DRINK.length];
        if ((i + s) % 3 === 0) {
          b.cyl(0.042, 0.042, 0.135, 8, 'bottles', bx, y + 0.085, cz + 0.16, { color: col, outline: 0 });
        } else {
          b.cyl(0.038, 0.042, 0.215, 8, 'bottles', bx, y + 0.12, cz + 0.16, { color: col, outline: 0 });
          b.cyl(0.020, 0.020, 0.045, 6, 'intTrim', bx, y + 0.245, cz + 0.16, { outline: 0 });
        }
      }
    }
    // glass door
    const gd = new THREE.Mesh(new THREE.PlaneGeometry(dw - 0.10, ch - 0.20), makeInnerGlass({ opacity: 0.13 }));
    gd.position.set(x, FLOOR + ch / 2, cz + 0.375);
    gd.renderOrder = 2;
    dyn.add(gd);
    b.box(0.05, ch - 0.16, 0.05, 'intMetal', x + dw / 2 - 0.06, FLOOR + ch / 2, cz + 0.39, { outline: 0.0004 });
    b.box(0.04, 0.5, 0.04, 'intTrim', x + dw / 2 - 0.13, FLOOR + 1.1, cz + 0.42, { outline: 0.0003 });
  }

  /* ----------------------- back door + ATM ------------------------- */
  b.box(0.95, 2.1, 0.08, 'intTrim', 0.72, FLOOR + 1.05, IZ0 + 0.06, { outline: 0.0007 });
  b.box(0.75, 0.5, 0.04, 'intDark', 0.72, FLOOR + 1.55, IZ0 + 0.11, { outline: 0.0004 });
  b.box(0.06, 0.16, 0.06, 'intMetal', 1.08, FLOOR + 1.05, IZ0 + 0.13, { outline: 0.0003 });
  b.plane(0.62, 0.18, 'posterC', 0.72, FLOOR + 1.95, IZ0 + 0.12, {});
  // ATM
  b.rbox(0.78, 1.85, 0.62, 0.04, 'intTrim', 1.82, FLOOR + 0.925, IZ0 + 0.34, { outline: 0.0008 });
  b.plane(0.52, 0.78, 'atmScreen', 1.82, FLOOR + 1.28, IZ0 + 0.66, {});
  b.box(0.78, 0.16, 0.64, 'intGreen', 1.82, FLOOR + 1.88, IZ0 + 0.34, { outline: 0.0006 });
  b.plane(0.6, 0.12, 'bandStripe', 1.82, FLOOR + 1.88, IZ0 + 0.67, { uvScale: [4, 1] });

  /* --------------------------- gondola aisles ---------------------- */
  const products = (x0, x1, y, z, d, face) => {
    let x = x0;
    while (x < x1 - 0.10) {
      const w = 0.11 + rnd() * 0.11;
      if (x + w > x1) break;
      if (rnd() < 0.08) { x += w + 0.03; continue; }
      const h = 0.13 + rnd() * 0.13;
      const dd = Math.min(d - 0.04, 0.13 + rnd() * 0.09);
      const key = rnd() < 0.62 ? 'products' : 'productsPlain';
      b.box(w, h, dd, key, x + w / 2, y + h / 2, z + face * (d / 2 - dd / 2 - 0.02),
        { color: pick(SNACK), outline: 0 });
      if (rnd() < 0.3) {
        b.box(w * 0.9, h * 0.55, dd * 0.8, key, x + w / 2, y + h + h * 0.28, z + face * (d / 2 - dd / 2 - 0.02),
          { color: pick(SNACK), outline: 0 });
      }
      x += w + 0.018;
    }
  };
  const gondola = (x0, x1, z, h, levels) => {
    const w = x1 - x0, d = 0.74;
    b.box(w, 0.14, d, 'intTrim', (x0 + x1) / 2, FLOOR + 0.07, z, { outline: 0.0006 });
    b.box(w, h, 0.07, 'intShelfBack', (x0 + x1) / 2, FLOOR + h / 2, z, { outline: 0.0006 });
    b.box(0.07, h, d, 'intShelf', x0 + 0.035, FLOOR + h / 2, z, { outline: 0.0005 });
    b.box(0.07, h, d, 'intShelf', x1 - 0.035, FLOOR + h / 2, z, { outline: 0.0005 });
    for (let s = 0; s < levels; s++) {
      const y = FLOOR + 0.20 + s * ((h - 0.28) / levels);
      for (const face of [1, -1]) {
        b.box(w - 0.1, 0.035, d / 2 - 0.05, 'intShelf', (x0 + x1) / 2, y, z + face * (d / 4 + 0.01), { outline: 0.0003 });
        b.box(w - 0.1, 0.045, 0.02, 'intRed', (x0 + x1) / 2, y + 0.01, z + face * (d / 2 - 0.03), { outline: 0 });
        products(x0 + 0.12, x1 - 0.12, y + 0.02, z, d / 2 - 0.04, face);
      }
    }
    // top header card
    b.box(w - 0.1, 0.16, 0.05, 'intRed', (x0 + x1) / 2, FLOOR + h + 0.06, z, { outline: 0.0004 });
    b.plane(w - 0.2, 0.12, 'bandStripe', (x0 + x1) / 2, FLOOR + h + 0.06, z + 0.03, { uvScale: [6, 1] });
  };
  gondola(-6.6, -1.4, -4.30, 1.55, 4);
  gondola(-6.6, -1.4, -2.75, 1.55, 4);

  // left-wall shelving
  const wallShelf = (z0, z1, h, levels) => {
    const d = 0.46, x = IX0 + d / 2 + 0.02;
    b.box(d, h, z1 - z0, 'intShelfBack', x, FLOOR + h / 2, (z0 + z1) / 2, { outline: 0.0006 });
    for (let s = 0; s < levels; s++) {
      const y = FLOOR + 0.22 + s * ((h - 0.3) / levels);
      b.box(d - 0.04, 0.035, z1 - z0 - 0.08, 'intShelf', x + 0.02, y, (z0 + z1) / 2, { outline: 0.0003 });
      let z = z0 + 0.12;
      while (z < z1 - 0.14) {
        const w = 0.12 + rnd() * 0.10;
        const hh = 0.14 + rnd() * 0.12;
        b.box(0.15 + rnd() * 0.06, hh, w, rnd() < 0.6 ? 'products' : 'productsPlain',
          x + 0.06, y + hh / 2 + 0.02, z + w / 2, { color: pick(SNACK), outline: 0 });
        z += w + 0.02;
      }
    }
  };
  wallShelf(-6.4, -4.9, 1.9, 5);
  wallShelf(-4.7, -3.2, 1.9, 5);

  /* --------------------- bento / onigiri open case ----------------- */
  const bx0 = -6.9, bx1 = -3.9, bz = -0.30;
  b.box(bx1 - bx0, 0.85, 0.62, 'intShelf', (bx0 + bx1) / 2, FLOOR + 0.425, bz, { outline: 0.0008 });
  b.box(bx1 - bx0 + 0.08, 0.10, 0.70, 'intTrim', (bx0 + bx1) / 2, FLOOR + 0.90, bz, { outline: 0.0006 });
  for (let s = 0; s < 3; s++) {
    const y = FLOOR + 0.95 + s * 0.34;
    const zz = bz - 0.10 + s * 0.06;
    b.box(bx1 - bx0, 0.04, 0.46, 'intShelf', (bx0 + bx1) / 2, y, zz, { rx: -0.22, outline: 0.0004 });
    b.box(bx1 - bx0, 0.05, 0.03, 'intGreen', (bx0 + bx1) / 2, y + 0.03, zz + 0.22, { outline: 0 });
    let x = bx0 + 0.14;
    while (x < bx1 - 0.2) {
      const w = 0.20 + rnd() * 0.08;
      const col = s === 2 ? ['#f4f1e6', '#e8e2d0', '#ffffff'][Math.floor(rnd() * 3)] : pick(SNACK);
      b.box(w, 0.075, 0.30, 'productsPlain', x + w / 2, y + 0.075, zz + 0.02, { rx: -0.22, color: col, outline: 0 });
      b.box(w * 0.55, 0.03, 0.16, 'productsPlain', x + w / 2, y + 0.12, zz + 0.05,
        { rx: -0.22, color: s === 2 ? '#2b2b2b' : pick(SNACK), outline: 0 });
      x += w + 0.035;
    }
  }
  b.box(bx1 - bx0 + 0.08, 0.30, 0.10, 'intGreen', (bx0 + bx1) / 2, FLOOR + 2.05, bz - 0.16, { outline: 0.0006 });
  b.plane(bx1 - bx0 - 0.1, 0.22, 'bandStripe', (bx0 + bx1) / 2, FLOOR + 2.05, bz - 0.10, { uvScale: [6, 1] });

  /* --------------------------- magazine rack ----------------------- */
  const mx0 = -3.55, mx1 = -1.75, mz = -0.32;
  b.box(mx1 - mx0, 1.30, 0.44, 'intShelf', (mx0 + mx1) / 2, FLOOR + 0.65, mz, { outline: 0.0008 });
  for (let s = 0; s < 3; s++) {
    const y = FLOOR + 0.42 + s * 0.42;
    b.box(mx1 - mx0 - 0.06, 0.03, 0.36, 'intTrim', (mx0 + mx1) / 2, y, mz + 0.04, { rx: -0.34, outline: 0.0003 });
    let x = mx0 + 0.10;
    while (x < mx1 - 0.16) {
      const w = 0.19 + rnd() * 0.05;
      b.box(w, 0.30, 0.025, 'magazines', x + w / 2, y + 0.16, mz + 0.14, { rx: -0.34, color: pick(SNACK), outline: 0 });
      x += w + 0.022;
    }
  }
  b.box(mx1 - mx0, 0.22, 0.10, 'intNavy', (mx0 + mx1) / 2, FLOOR + 1.42, mz - 0.10, { outline: 0.0005 });
  b.plane(mx1 - mx0 - 0.1, 0.16, 'bandStripe', (mx0 + mx1) / 2, FLOOR + 1.42, mz - 0.04, { uvScale: [4, 1] });

  /* ------------------------- checkout counter ---------------------- */
  const cxc0 = -0.30, cxc1 = 2.20, czc = -2.05;
  b.rbox(cxc1 - cxc0, 0.98, 0.80, 0.03, 'intCounter', (cxc0 + cxc1) / 2, FLOOR + 0.49, czc, { outline: 0.0009 });
  b.box(cxc1 - cxc0 + 0.08, 0.06, 0.90, 'intTrim', (cxc0 + cxc1) / 2, FLOOR + 1.00, czc, { outline: 0.0006 });
  b.box(cxc1 - cxc0, 0.14, 0.04, 'intGreen', (cxc0 + cxc1) / 2, FLOOR + 0.86, czc + 0.41, { outline: 0.0004 });
  b.plane(cxc1 - cxc0 - 0.1, 0.10, 'bandStripe', (cxc0 + cxc1) / 2, FLOOR + 0.86, czc + 0.435, { uvScale: [6, 1] });
  // return leg
  b.rbox(0.80, 0.98, 1.10, 0.03, 'intCounter', 1.80, FLOOR + 0.49, -1.20, { outline: 0.0009 });
  b.box(0.88, 0.06, 1.18, 'intTrim', 1.80, FLOOR + 1.00, -1.20, { outline: 0.0006 });

  // POS registers
  const register = (x, z) => {
    b.box(0.46, 0.10, 0.36, 'intDark', x, FLOOR + 1.08, z, { outline: 0.0005 });
    b.box(0.34, 0.26, 0.05, 'intDark', x, FLOOR + 1.26, z - 0.10, { rx: 0.22, outline: 0.0005 });
    b.plane(0.30, 0.22, 'posScreen', x, FLOOR + 1.27, z - 0.073, { rx: 0.22 });
    b.box(0.22, 0.16, 0.04, 'intDark', x + 0.30, FLOOR + 1.16, z + 0.14, { rx: -0.35, outline: 0.0004 });
    b.plane(0.19, 0.13, 'posScreen', x + 0.30, FLOOR + 1.17, z + 0.163, { rx: -0.35 });
    b.box(0.14, 0.05, 0.20, 'intTrim', x - 0.30, FLOOR + 1.06, z + 0.06, { outline: 0.0003 });
    b.box(0.10, 0.09, 0.10, 'intDark', x - 0.30, FLOOR + 1.12, z - 0.10, { outline: 0.0003 });
  };
  register(0.30, czc);
  register(1.35, czc);
  // impulse racks on the counter
  for (let i = 0; i < 5; i++) {
    b.box(0.10, 0.14, 0.08, 'products', -0.05 + i * 0.13, FLOOR + 1.10, czc + 0.30, { color: pick(SNACK), outline: 0 });
  }
  b.box(0.30, 0.22, 0.22, 'productsPlain', 2.02, FLOOR + 1.14, -0.75, { color: '#e8503c', outline: 0.0004 });

  /* ------------------------ back counter line ---------------------- */
  const bz2 = -3.35;
  b.rbox(2.6, 0.92, 0.72, 0.03, 'intCounter', 1.05, FLOOR + 0.46, bz2, { outline: 0.0009 });
  b.box(2.68, 0.06, 0.80, 'intTrim', 1.05, FLOOR + 0.95, bz2, { outline: 0.0006 });
  b.box(2.6, 0.62, 0.06, 'intShelfBack', 1.05, FLOOR + 1.30, bz2 - 0.36, { outline: 0.0006 });

  // oden pot
  b.box(0.78, 0.20, 0.56, 'intMetal', 0.10, FLOOR + 1.08, bz2, { outline: 0.0006 });
  b.box(0.70, 0.06, 0.48, 'oden', 0.10, FLOOR + 1.19, bz2, { outline: 0.0004 });
  for (let i = 0; i < 3; i++) b.box(0.02, 0.10, 0.46, 'intMetal', -0.13 + i * 0.23, FLOOR + 1.24, bz2, { outline: 0 });
  for (let i = 0; i < 12; i++) {
    const ox = -0.20 + (i % 4) * 0.14, oz = bz2 - 0.14 + Math.floor(i / 4) * 0.14;
    const kind = i % 3;
    if (kind === 0) b.cyl(0.045, 0.045, 0.05, 8, 'productsPlain', ox, FLOOR + 1.25, oz, { color: '#e8d8a8', outline: 0 });
    else if (kind === 1) b.box(0.08, 0.05, 0.08, 'productsPlain', ox, FLOOR + 1.25, oz, { color: '#d8b070', outline: 0 });
    else b.sphere(0.04, 'productsPlain', ox, FLOOR + 1.26, oz, { color: '#f0e8d0', outline: 0, seg: 8 });
  }
  const odenGlass = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.30, 0.54), makeInnerGlass({ color: '#ffd9a8', opacity: 0.14 }));
  odenGlass.position.set(0.10, FLOOR + 1.36, bz2);
  odenGlass.renderOrder = 2;
  dyn.add(odenGlass);
  b.box(0.80, 0.04, 0.58, 'intMetal', 0.10, FLOOR + 1.52, bz2, { outline: 0.0004 });
  const odenLamp = new THREE.Mesh(new THREE.PlaneGeometry(0.68, 0.46), mat('odenGlow'));
  odenLamp.rotation.x = Math.PI / 2;
  odenLamp.position.set(0.10, FLOOR + 1.49, bz2);
  dyn.add(odenLamp);

  // hot snack warmer
  b.box(0.62, 0.46, 0.50, 'intMetal', 0.95, FLOOR + 1.21, bz2, { outline: 0.0006 });
  const hotGlass = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.40, 0.46), makeInnerGlass({ color: '#ffcf90', opacity: 0.13 }));
  hotGlass.position.set(0.95, FLOOR + 1.22, bz2);
  hotGlass.renderOrder = 2;
  dyn.add(hotGlass);
  for (let s = 0; s < 2; s++) for (let i = 0; i < 4; i++) {
    b.box(0.11, 0.09, 0.12, 'productsPlain', 0.74 + i * 0.14, FLOOR + 1.08 + s * 0.19, bz2 + 0.02,
      { color: ['#e8a33c', '#d8863c', '#f0c060'][i % 3], outline: 0 });
  }
  const hotLamp = new THREE.Mesh(new THREE.PlaneGeometry(0.52, 0.40), mat('odenGlow'));
  hotLamp.rotation.x = Math.PI / 2;
  hotLamp.position.set(0.95, FLOOR + 1.40, bz2);
  dyn.add(hotLamp);

  // steamed bun case
  b.box(0.46, 0.42, 0.44, 'intMetal', 1.62, FLOOR + 1.19, bz2, { outline: 0.0006 });
  const bunGlass = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.36, 0.40), makeInnerGlass({ color: '#ffe0b0', opacity: 0.13 }));
  bunGlass.position.set(1.62, FLOOR + 1.20, bz2);
  bunGlass.renderOrder = 2;
  dyn.add(bunGlass);
  for (let s = 0; s < 2; s++) for (let i = 0; i < 3; i++) {
    b.sphere(0.055, 'productsPlain', 1.48 + i * 0.14, FLOOR + 1.08 + s * 0.17, bz2, { color: '#f6ecd8', outline: 0, seg: 8 });
  }

  // coffee machine against the right wall
  b.rbox(0.56, 1.05, 0.52, 0.03, 'intDark', 2.02, FLOOR + 1.50, bz2 - 0.02, { outline: 0.0007 });
  b.plane(0.44, 0.86, 'coffeeFace', 2.02, FLOOR + 1.52, bz2 + 0.25, {});
  b.box(0.56, 0.06, 0.54, 'intMetal', 2.02, FLOOR + 2.05, bz2 - 0.02, { outline: 0.0004 });
  // cup stack
  for (let i = 0; i < 4; i++) b.cyl(0.045, 0.035, 0.09, 8, 'intTrim', 1.72, FLOOR + 1.03 + i * 0.02, bz2 + 0.24, { outline: 0 });

  // menu light box above the back counter
  b.box(2.5, 0.62, 0.10, 'intDark', 1.05, FLOOR + 2.30, bz2 - 0.30, { outline: 0.0007 });
  b.plane(2.38, 0.54, 'menuBoard', 1.05, FLOOR + 2.30, bz2 - 0.243, {});
  b.strut([0.2, CEIL, bz2 - 0.30], [0.2, FLOOR + 2.62, bz2 - 0.30], 0.015, 'intMetal', { outline: 0 });
  b.strut([1.9, CEIL, bz2 - 0.30], [1.9, FLOOR + 2.62, bz2 - 0.30], 0.015, 'intMetal', { outline: 0 });

  /* -------------------------- freezer chest ------------------------ */
  b.rbox(0.72, 0.86, 1.70, 0.04, 'intTrim', 1.94, FLOOR + 0.43, -5.10, { outline: 0.0008 });
  b.box(0.66, 0.06, 1.62, 'intMetal', 1.94, FLOOR + 0.88, -5.10, { outline: 0.0005 });
  const freeGlass = new THREE.Mesh(new THREE.PlaneGeometry(0.60, 1.54), makeInnerGlass({ color: '#cfe8ff', opacity: 0.20 }));
  freeGlass.rotation.x = -Math.PI / 2;
  freeGlass.position.set(1.94, FLOOR + 0.92, -5.10);
  freeGlass.renderOrder = 2;
  dyn.add(freeGlass);
  for (let i = 0; i < 10; i++) {
    b.box(0.24, 0.10, 0.14, 'products', 1.80 + (i % 2) * 0.28, FLOOR + 0.80, -5.75 + Math.floor(i / 2) * 0.32,
      { color: pick(SNACK), outline: 0 });
  }
  b.plane(0.60, 0.20, 'bandStripe', 1.575, FLOOR + 0.62, -5.10, { ry: -Math.PI / 2, uvScale: [4, 1] });

  /* ------------------------ wall decor / signs --------------------- */
  b.plane(0.66, 0.94, 'posterB', IX0 + 0.03, 2.10, -2.30, { ry: Math.PI / 2 });
  b.plane(0.66, 0.94, 'posterD', IX0 + 0.03, 2.10, -1.30, { ry: Math.PI / 2 });
  b.box(0.06, 0.9, 1.3, 'intDark', IX0 + 0.04, 2.05, -4.05, { outline: 0.0005 });
  b.plane(1.2, 0.8, 'menuBoard', IX0 + 0.08, 2.05, -4.05, { ry: Math.PI / 2 });
  // hanging aisle signs
  const hang = (x, z, w, key) => {
    b.box(w, 0.26, 0.05, key, x, CEIL - 0.42, z, { outline: 0.0005 });
    b.plane(w - 0.08, 0.18, 'bandStripe', x, CEIL - 0.42, z + 0.03, { uvScale: [4, 1] });
    b.strut([x - w / 2 + 0.1, CEIL, z], [x - w / 2 + 0.1, CEIL - 0.29, z], 0.012, 'intMetal', { outline: 0 });
    b.strut([x + w / 2 - 0.1, CEIL, z], [x + w / 2 - 0.1, CEIL - 0.29, z], 0.012, 'intMetal', { outline: 0 });
  };
  hang(-4.0, -3.55, 1.5, 'intRed');
  hang(0.9, -2.05, 1.2, 'intGreen');
  hang(-5.4, -0.30, 1.4, 'intNavy');
  // security mirror
  b.sphere(0.16, 'intMetal', -7.0, CEIL - 0.30, 0.10, { outline: 0.0004, seg: 10 });
  b.strut([-7.0, CEIL, 0.10], [-7.0, CEIL - 0.18, 0.10], 0.02, 'intMetal', { outline: 0 });
  // indoor bins near the door
  for (let i = 0; i < 2; i++) {
    b.rbox(0.34, 0.62, 0.34, 0.03, i ? 'intNavy' : 'intTrim', -0.95 + i * 0.40, FLOOR + 0.31, -0.05, { outline: 0.0006 });
    b.box(0.30, 0.05, 0.30, 'intDark', -0.95 + i * 0.40, FLOOR + 0.64, -0.05, { outline: 0.0003 });
  }
  // umbrella stand inside
  b.cyl(0.16, 0.16, 0.5, 12, 'intMetal', 2.15, FLOOR + 0.25, -0.30, { outline: 0.0006 });

  b.flush(scene, 'interior');

  /* ------------------------------ lights --------------------------- */
  const lights = [];
  const addPoint = (x, y, z, col, inten, dist) => {
    const p = new THREE.PointLight(new THREE.Color(col), inten, dist, 1.5);
    p.position.set(x, y, z);
    scene.add(p); lights.push(p);
    return p;
  };
  addPoint(-4.2, 2.70, -3.2, '#ffe0b0', 7.5, 13);
  addPoint(1.0, 2.55, -2.2, '#ffdca8', 5.5, 11);

  const steamSrc = [
    [0.10, FLOOR + 1.55, bz2],
    [0.95, FLOOR + 1.45, bz2],
    [1.62, FLOOR + 1.42, bz2],
  ];

  const lazyPanel = panels[5];
  lazyPanel.material = mat('lightPanel').clone();
  function update(t) {
    // one ceiling tube has a lazy start-up stutter
    const k = (Math.sin(t * 0.7) > 0.985) ? 0.55 + 0.45 * Math.abs(Math.sin(t * 40)) : 1.0;
    lazyPanel.material.color.setScalar(k);
    return { panelLevel: k };
  }

  return { dyn, update, lights, panels, steamSrc };
}