import * as THREE from 'three';
import { L } from '../core/layout.js';
import { Batch, G, mat, catenary, seeded } from '../core/gfx.js';

const WY = L.walkY;

export function buildStreet(scene, TX) {
  const b = new Batch();
  const dyn = new THREE.Group(); dyn.name = 'street-dyn';
  scene.add(dyn);
  const rnd = seeded(778811);
  const glow = [];      // emissive faces that pulse
  const windows = [];   // neighbour windows that occasionally switch

  /* =========================== vending ============================= */
  const vending = (z, key, topKey, bodyKey) => {
    const x = 2.6 + 0.375;
    b.rbox(0.75, 2.0, 1.05, 0.04, bodyKey, x, WY + 1.0, z, { outline: 0.0009 });
    b.box(0.78, 0.10, 1.09, 'metalDark', x, WY + 2.03, z, { outline: 0.0006 });
    b.box(0.80, 0.14, 1.10, 'metalDeep', x, WY + 0.07, z, { outline: 0.0006 });
    // front light box
    b.box(0.10, 0.26, 1.0, 'white', x + 0.36, WY + 2.20, z, { outline: 0.0006 });
    const top = new THREE.Mesh(new THREE.PlaneGeometry(0.96, 0.22), mat(topKey));
    top.rotation.y = Math.PI / 2;
    top.position.set(x + 0.415, WY + 2.20, z);
    dyn.add(top); glow.push(top);
    // printed front
    const face = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.86), mat(key));
    face.rotation.y = Math.PI / 2;
    face.position.set(x + 0.377, WY + 1.03, z);
    dyn.add(face); glow.push(face);
    // side ribs
    b.box(0.06, 1.9, 0.05, 'metalDark', x + 0.36, WY + 1.0, z - 0.52, { outline: 0.0004 });
    b.box(0.06, 1.9, 0.05, 'metalDark', x + 0.36, WY + 1.0, z + 0.52, { outline: 0.0004 });
    // small roof
    b.box(0.95, 0.06, 1.20, 'metalDark', x + 0.06, WY + 2.36, z, { outline: 0.0006 });
    b.strut([2.62, WY + 2.9, z - 0.5], [x + 0.4, WY + 2.38, z - 0.5], 0.02, 'metal', { outline: 0.0003 });
    b.strut([2.62, WY + 2.9, z + 0.5], [x + 0.4, WY + 2.38, z + 0.5], 0.02, 'metal', { outline: 0.0003 });
  };
  vending(-1.60, 'vendFront', 'vendTop', 'white');
  vending(-2.80, 'vendFront2', 'vendTop', 'red');

  /* =========================== bicycle ============================= */
  const bikeGroup = new THREE.Group();
  {
    const bb = new Batch();
    const R = 0.29, wr = 0.028;
    const wheel = (cx) => {
      bb.torus(R, wr, 'rubber', cx, R, 0, { outline: 0.0005, seg: 6, rs: 22 });
      bb.torus(R - 0.035, 0.014, 'metal', cx, R, 0, { outline: 0.0003, seg: 5, rs: 20 });
      for (let i = 0; i < 8; i++) {
        const a = i / 8 * Math.PI;
        bb.strut([cx - Math.cos(a) * (R - 0.04), R - Math.sin(a) * (R - 0.04), 0],
          [cx + Math.cos(a) * (R - 0.04), R + Math.sin(a) * (R - 0.04), 0], 0.006, 'metal', { outline: 0 });
      }
      bb.cyl(0.03, 0.03, 0.07, 8, 'metalDark', cx, R, 0, { rx: Math.PI / 2, outline: 0.0003 });
      // fender
      bb.torus(R + 0.045, 0.018, 'metal', cx, R, 0, { outline: 0.0003, seg: 5, rs: 12 });
    };
    wheel(-0.52); wheel(0.52);
    const F = 'cyanP';
    bb.strut([-0.52, R, 0], [-0.05, R + 0.02, 0], 0.022, F, { outline: 0.0005 });   // chain stay
    bb.strut([-0.05, R + 0.02, 0], [0.10, R + 0.50, 0], 0.024, F, { outline: 0.0005 }); // seat tube
    bb.strut([-0.52, R, 0], [0.10, R + 0.50, 0], 0.020, F, { outline: 0.0005 });   // seat stay
    bb.strut([-0.05, R + 0.02, 0], [0.40, R + 0.46, 0], 0.024, F, { outline: 0.0005 }); // down tube
    bb.strut([0.10, R + 0.50, 0], [0.40, R + 0.46, 0], 0.022, F, { outline: 0.0005 }); // top tube
    bb.strut([0.40, R + 0.46, 0], [0.52, R, 0], 0.020, 'metal', { outline: 0.0005 });  // fork
    bb.strut([0.40, R + 0.46, 0], [0.42, R + 0.66, 0], 0.020, 'metal', { outline: 0.0004 });
    bb.strut([0.42, R + 0.66, -0.19], [0.42, R + 0.66, 0.19], 0.016, 'metalDark', { outline: 0.0004 });
    bb.strut([0.42, R + 0.66, -0.19], [0.36, R + 0.63, -0.24], 0.016, 'rubber', { outline: 0.0003 });
    bb.strut([0.42, R + 0.66, 0.19], [0.36, R + 0.63, 0.24], 0.016, 'rubber', { outline: 0.0003 });
    bb.rbox(0.22, 0.05, 0.10, 0.02, 'rubber', 0.08, R + 0.56, 0, { outline: 0.0004 }); // saddle
    bb.cyl(0.055, 0.055, 0.03, 10, 'metalDark', -0.05, R + 0.02, 0, { rx: Math.PI / 2, outline: 0.0003 });
    bb.strut([-0.05, R + 0.02, 0.03], [0.02, R - 0.10, 0.09], 0.012, 'metal', { outline: 0 });
    bb.box(0.08, 0.02, 0.05, 'metalDark', 0.02, R - 0.10, 0.11, { outline: 0 });
    bb.strut([-0.05, R + 0.02, -0.03], [-0.12, R - 0.12, -0.10], 0.012, 'metal', { outline: 0 });
    // basket
    bb.box(0.26, 0.02, 0.24, 'metalDark', 0.52, R + 0.52, 0, { outline: 0.0003 });
    for (let i = 0; i < 4; i++) {
      bb.strut([0.40 + i * 0.08, R + 0.52, -0.12], [0.40 + i * 0.08, R + 0.70, -0.13], 0.007, 'metal', { outline: 0 });
      bb.strut([0.40 + i * 0.08, R + 0.52, 0.12], [0.40 + i * 0.08, R + 0.70, 0.13], 0.007, 'metal', { outline: 0 });
    }
    bb.strut([0.40, R + 0.70, -0.13], [0.64, R + 0.70, -0.13], 0.008, 'metal', { outline: 0 });
    bb.strut([0.40, R + 0.70, 0.13], [0.64, R + 0.70, 0.13], 0.008, 'metal', { outline: 0 });
    bb.strut([0.64, R + 0.52, -0.12], [0.64, R + 0.70, -0.13], 0.008, 'metal', { outline: 0 });
    bb.strut([0.64, R + 0.52, 0.12], [0.64, R + 0.70, 0.13], 0.008, 'metal', { outline: 0 });
    bb.strut([0.40, R + 0.52, -0.12], [0.64, R + 0.52, -0.12], 0.008, 'metal', { outline: 0 });
    bb.strut([0.40, R + 0.52, 0.12], [0.64, R + 0.52, 0.12], 0.008, 'metal', { outline: 0 });
    // headlamp + kickstand
    bb.cyl(0.045, 0.05, 0.06, 10, 'white', 0.50, R + 0.44, 0, { rz: Math.PI / 2, outline: 0.0003 });
    bb.strut([-0.10, R + 0.05, 0.02], [-0.20, 0.0, 0.14], 0.012, 'metalDark', { outline: 0.0003 });
    bb.flush(bikeGroup, 'bike');
  }
  bikeGroup.position.set(4.15, WY, -5.30);
  bikeGroup.rotation.y = Math.PI / 2 + 0.12;
  bikeGroup.rotation.z = -0.06;
  dyn.add(bikeGroup);
  // bike rack hoops
  for (const z of [-5.9, -4.7]) {
    b.strut([4.55, WY, z - 0.3], [4.55, WY + 0.45, z - 0.3], 0.025, 'metal', { outline: 0.0004 });
    b.strut([4.55, WY + 0.45, z - 0.3], [4.55, WY + 0.45, z + 0.3], 0.025, 'metal', { outline: 0.0004 });
    b.strut([4.55, WY + 0.45, z + 0.3], [4.55, WY, z + 0.3], 0.025, 'metal', { outline: 0.0004 });
  }

  /* ====================== umbrellas & stand ======================== */
  const closedUmbrella = (parent, x, y, z, col, tilt, ry) => {
    const g = new THREE.Group();
    const ub = new Batch();
    ub.cyl(0.012, 0.055, 0.86, 8, 'productsPlain', 0, 0.43, 0, { color: col, outline: 0.0005 });
    ub.cyl(0.008, 0.008, 0.14, 6, 'metalDark', 0, 0.93, 0, { outline: 0.0003 });
    ub.cyl(0.014, 0.014, 0.16, 6, 'wood', 0, -0.06, 0, { outline: 0.0003 });
    ub.torus(0.045, 0.012, 'wood', 0.045, -0.14, 0, { outline: 0.0003, seg: 5, rs: 10 });
    ub.box(0.03, 0.10, 0.01, 'productsPlain', 0.05, 0.55, 0, { color: '#f4f1e6', outline: 0 });
    ub.flush(g, 'umbrella');
    g.position.set(x, y, z);
    g.rotation.set(tilt, ry, tilt * 0.6);
    parent.add(g);
    return g;
  };
  b.cyl(0.19, 0.21, 0.52, 14, 'metal', 2.15, WY + 0.26, 1.45, { outline: 0.0007 });
  b.cyl(0.20, 0.20, 0.04, 14, 'metalDark', 2.15, WY + 0.53, 1.45, { outline: 0.0004 });
  b.plane(0.22, 0.16, 'binLabel', 2.15, WY + 0.32, 1.65, {});
  closedUmbrella(dyn, 2.08, WY + 0.20, 1.40, '#26325a', 0.10, 0.3);
  closedUmbrella(dyn, 2.22, WY + 0.20, 1.52, '#c8402f', -0.13, 1.1);
  closedUmbrella(dyn, 2.16, WY + 0.20, 1.36, '#cfe0ee', 0.05, 2.2);
  // one left open to dry against the side wall
  {
    const g = new THREE.Group();
    const ub = new Batch();
    ub.cone(0.46, 0.26, 'productsPlain', 0, 0.13, 0, { color: '#2f6fb8', outline: 0.0007, seg: 8 });
    ub.cyl(0.014, 0.014, 0.86, 6, 'metal', 0, -0.43, 0, { outline: 0.0004 });
    ub.torus(0.05, 0.013, 'wood', 0.05, -0.86, 0, { outline: 0.0003, seg: 5, rs: 10 });
    for (let i = 0; i < 8; i++) {
      const a = i / 8 * 6.283;
      ub.strut([0, 0.25, 0], [Math.cos(a) * 0.45, 0.02, Math.sin(a) * 0.45], 0.008, 'metal', { outline: 0 });
    }
    ub.flush(g, 'openumb');
    g.position.set(3.18, WY + 0.72, -0.30);
    g.rotation.set(0.42, 0.4, 0.30);
    dyn.add(g);
  }

  /* ============================= bins ============================== */
  const bin = (x, z, key, label) => {
    b.rbox(0.42, 0.72, 0.42, 0.04, key, x, WY + 0.36, z, { outline: 0.0008 });
    b.box(0.46, 0.07, 0.46, 'metalDark', x, WY + 0.75, z, { outline: 0.0005 });
    b.box(0.24, 0.03, 0.10, 'metalDeep', x, WY + 0.79, z, { outline: 0.0003 });
    if (label) b.plane(0.30, 0.30, 'binLabel', x, WY + 0.42, z + 0.215, {});
  };
  bin(-1.35, 1.45, 'white', true);
  bin(-0.85, 1.45, 'navy', true);

  /* ========================= A-frame poster ======================== */
  {
    const x = -2.55, z = 1.95;
    b.box(0.66, 0.94, 0.05, 'metalDark', x, WY + 0.50, z, { rx: 0.16, outline: 0.0007 });
    b.plane(0.58, 0.84, 'posterA', x, WY + 0.52, z + 0.045, { rx: 0.16 });
    b.box(0.66, 0.94, 0.05, 'metalDark', x, WY + 0.50, z - 0.42, { rx: -0.16, outline: 0.0007 });
    b.plane(0.58, 0.84, 'posterD', x, WY + 0.52, z - 0.465, { rx: -0.16, ry: Math.PI });
    b.strut([x - 0.3, WY + 0.95, z - 0.06], [x + 0.3, WY + 0.95, z - 0.06], 0.02, 'metal', { outline: 0.0003 });
  }

  /* ======================= poles, lamps, wires ===================== */
  const pole = (x, z, h, r) => {
    b.cyl(r * 0.82, r, h, 12, 'concrete', x, WY + h / 2, z, { outline: 0.0009 });
    b.cyl(r * 1.25, r * 1.3, 0.16, 12, 'metalDark', x, WY + 0.08, z, { outline: 0.0006 });
    for (let i = 0; i < 3; i++) {
      b.cyl(r * 0.9, r * 0.9, 0.05, 12, 'metalDark', x, WY + 1.6 + i * 0.12, z, { outline: 0.0003 });
    }
    b.plane(0.20, 0.30, 'posterC', x + r * 0.85, WY + 1.35, z, { ry: Math.PI / 2 });
    return h;
  };
  const P1 = [4.50, 5.15], P2 = [-11.0, 0.30], P3 = [11.15, -6.0];
  pole(P1[0], P1[1], 7.1, 0.17);
  pole(P2[0], P2[1], 6.4, 0.15);
  pole(P3[0], P3[1], 6.0, 0.14);

  // cross-arms, insulators, transformers on the main pole
  const crossArm = (x, y, z, len, ry) => {
    b.box(len, 0.09, 0.09, 'metalDark', x, y, z, { ry, outline: 0.0006 });
    const n = 4;
    for (let i = 0; i < n; i++) {
      const t = (i / (n - 1) - 0.5) * (len - 0.3);
      const ix = x + Math.cos(ry) * t, iz = z - Math.sin(ry) * t;
      b.cyl(0.045, 0.05, 0.10, 8, 'white', ix, y + 0.09, iz, { outline: 0.0003 });
      b.cyl(0.03, 0.03, 0.05, 6, 'metalDark', ix, y + 0.16, iz, { outline: 0.0002 });
    }
  };
  crossArm(P1[0], WY + 6.35, P1[1], 2.0, 0);
  crossArm(P1[0], WY + 5.75, P1[1], 1.6, 0);
  crossArm(P1[0], WY + 5.20, P1[1], 1.3, Math.PI / 2);
  crossArm(P2[0], WY + 5.70, P2[1], 1.7, 0.32);
  crossArm(P3[0], WY + 5.30, P3[1], 1.5, 0.1);
  // transformers
  for (const dz of [-0.28, 0.28]) {
    b.cyl(0.19, 0.19, 0.62, 12, 'metal', P1[0] - 0.30, WY + 4.75, P1[1] + dz, { outline: 0.0008 });
    b.cyl(0.20, 0.20, 0.05, 12, 'metalDark', P1[0] - 0.30, WY + 5.08, P1[1] + dz, { outline: 0.0004 });
    b.cyl(0.03, 0.03, 0.14, 6, 'white', P1[0] - 0.30, WY + 5.16, P1[1] + dz, { outline: 0.0002 });
  }
  b.box(0.10, 0.30, 0.62, 'metalDark', P1[0] - 0.12, WY + 4.75, P1[1], { outline: 0.0005 });
  // coiled spare cable
  b.torus(0.26, 0.035, 'rubber', P1[0] + 0.20, WY + 3.60, P1[1], { ry: Math.PI / 2, outline: 0.0005, seg: 6, rs: 18 });
  b.torus(0.22, 0.035, 'rubber', P1[0] + 0.24, WY + 3.45, P1[1], { ry: Math.PI / 2, outline: 0.0005, seg: 6, rs: 18 });

  // street lamp on the main pole
  const lampHead = (x, y, z, ry, cool, withLight = true) => {
    b.strut([x, y, z], [x + Math.cos(ry) * 0.95, y + 0.22, z - Math.sin(ry) * 0.95], 0.045, 'metalDark', { outline: 0.0005 });
    const hx = x + Math.cos(ry) * 0.95, hz = z - Math.sin(ry) * 0.95;
    b.rbox(0.62, 0.14, 0.30, 0.05, 'metalDark', hx, y + 0.20, hz, { ry, outline: 0.0007 });
    const lens = new THREE.Mesh(new THREE.PlaneGeometry(0.54, 0.24), mat(cool ? 'lightPanelCool' : 'lightPanel'));
    lens.rotation.x = Math.PI / 2;
    lens.rotation.z = -ry;
    lens.position.set(hx, y + 0.125, hz);
    dyn.add(lens); glow.push(lens);
    const L2 = new THREE.PointLight(new THREE.Color(cool ? '#bcd8ff' : '#ffd9a0'), 9, 9, 1.8);
    L2.position.set(hx, y + 0.05, hz);
    if (withLight) scene.add(L2);
    return [hx, y + 0.12, hz];
  };
  const lamp1 = lampHead(P1[0], WY + 5.0, P1[1], Math.PI * 0.78, true);
  // standalone lamp along the side road
  b.cyl(0.07, 0.10, 4.2, 10, 'metalDark', 4.45, WY + 2.1, -4.60, { outline: 0.0008 });
  b.cyl(0.16, 0.18, 0.12, 10, 'metalDeep', 4.45, WY + 0.06, -4.60, { outline: 0.0005 });
  const lamp2 = lampHead(4.45, WY + 4.1, -4.60, 0.0, true);
  // far-side pedestrian lamp — kept clear of the neighbour block so the pole stays visible
  b.cyl(0.07, 0.10, 3.4, 10, 'metalDark', 4.20, WY + 1.7, 10.85, { outline: 0.0008 });
  b.cyl(0.16, 0.18, 0.12, 10, 'metalDeep', 4.20, WY + 0.06, 10.85, { outline: 0.0005 });
  const lamp3 = lampHead(4.20, WY + 3.3, 10.85, Math.PI / 2, true);

  // wires
  const wire = (a, c, sag, r = 0.022) => {
    const curve = catenary(a, c, sag, 20);
    const geo = new THREE.TubeGeometry(curve, 20, r, 5, false);
    const m = new THREE.Mesh(geo, mat('rubber'));
    dyn.add(m);
    return m;
  };
  for (let i = 0; i < 4; i++) {
    const t = (i / 3 - 0.5) * 1.7;
    wire([P1[0] + t, WY + 6.51, P1[1]], [P2[0] + t * 0.9, WY + 5.86, P2[1] + t * 0.3], 0.85);
  }
  for (let i = 0; i < 3; i++) {
    const t = (i / 2 - 0.5) * 1.3;
    wire([P1[0] + t, WY + 5.91, P1[1]], [P1[0] + t + 0.06, WY + 5.36, P1[1] + 0.06], 0.05, 0.018);
  }
  for (let i = 0; i < 3; i++) {
    const t = (i / 2 - 0.5) * 1.2;
    wire([P1[0], WY + 5.36, P1[1] + t], [P3[0], WY + 5.46, P3[1] + t * 0.8], 1.15);
  }
  wire([P1[0], WY + 4.9, P1[1]], [2.62, WY + 3.9, 0.4], 0.35, 0.018);
  wire([P2[0], WY + 5.6, P2[1]], [-9.35, WY + 4.2, -3.0], 0.4, 0.018);
  wire([P3[0], WY + 5.2, P3[1]], [11.9, WY + 4.4, -11.6], 0.5, 0.018);

  /* ======================= signs & guardrails ====================== */
  b.box(1.30, 0.66, 0.06, 'metalDark', P1[0] + 0.02, WY + 2.85, P1[1] + 0.20, { outline: 0.0007 });
  b.plane(1.24, 0.60, 'roadSign', P1[0] + 0.02, WY + 2.85, P1[1] + 0.235, {});
  b.box(0.06, 1.5, 0.06, 'metal', 10.62, WY + 0.75, 4.10, { outline: 0.0005 });
  b.plane(0.62, 0.62, 'stopSign', 10.62, WY + 1.72, 4.13, {});
  b.box(0.66, 0.66, 0.04, 'metalDark', 10.62, WY + 1.72, 4.08, { outline: 0.0005 });

  const rail = (x0, z0, x1, z1, h = 0.85) => {
    const len = Math.hypot(x1 - x0, z1 - z0);
    const ry = Math.atan2(-(z1 - z0), x1 - x0);
    const n = Math.max(2, Math.round(len / 1.1));
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const x = x0 + (x1 - x0) * t, z = z0 + (z1 - z0) * t;
      b.cyl(0.035, 0.04, h, 8, 'white', x, WY + h / 2, z, { outline: 0.0005 });
      b.cyl(0.06, 0.07, 0.05, 8, 'metalDark', x, WY + 0.025, z, { outline: 0.0003 });
    }
    for (const yy of [h - 0.06, h * 0.5]) {
      b.strut([x0, WY + yy, z0], [x1, WY + yy, z1], 0.032, 'white', { outline: 0.0005 });
    }
  };
  rail(-5.4, 10.85, 3.4, 10.85);
  rail(10.45, 6.6, 10.45, 9.6);
  rail(-11.6, 10.85, -7.6, 10.85);

  // traffic cone at the corner
  b.cone(0.16, 0.46, 'orange', 5.95, 0.25, 5.25, { outline: 0.0006, seg: 10 });
  b.box(0.34, 0.04, 0.34, 'orange', 5.95, 0.04, 5.25, { outline: 0.0004 });
  b.cyl(0.115, 0.125, 0.07, 10, 'white', 5.95, 0.28, 5.25, { outline: 0.0003 });

  /* ========================= traffic signal ======================== */
  const signal = new THREE.Group();
  {
    const sb = new Batch();
    sb.cyl(0.09, 0.12, 4.6, 10, 'metalDark', 0, 2.3, 0, { outline: 0.0008 });
    sb.cyl(0.18, 0.20, 0.14, 10, 'metalDeep', 0, 0.07, 0, { outline: 0.0005 });
    sb.strut([0, 4.45, 0], [-2.5, 4.45, 0], 0.06, 'metalDark', { outline: 0.0006 });
    sb.strut([0, 4.05, 0], [-1.2, 4.42, 0], 0.035, 'metalDark', { outline: 0.0004 });
    sb.rbox(1.16, 0.36, 0.24, 0.05, 'metalDeep', -2.45, 4.30, 0, { outline: 0.0008 });
    sb.box(1.20, 0.05, 0.30, 'metalDark', -2.45, 4.50, 0.02, { outline: 0.0004 });
    sb.rbox(0.40, 0.66, 0.20, 0.04, 'metalDeep', -0.02, 2.55, 0.16, { outline: 0.0007 });
    sb.flush(signal, 'signal');
    signal.position.set(11.05, WY, 10.95);
    dyn.add(signal);
  }
  const lampMats = [];
  const sigLamp = (x, y, z, col, r = 0.10) => {
    const m = new THREE.Mesh(new THREE.CircleGeometry(r, 14), new THREE.MeshBasicMaterial({ color: col }));
    m.rotation.y = Math.PI / 2;
    m.position.set(x, y, z);
    signal.add(m);
    lampMats.push(m);
    return m;
  };
  // head faces +X (toward the viewer's side of the intersection)
  const sigRed = sigLamp(-2.45 + 0.0, 4.30, 0, '#ff4a3a');
  sigRed.position.set(-2.45, 4.30, 0.135); sigRed.rotation.y = 0;
  const sigAmber = sigLamp(0, 0, 0, '#ffb020');
  sigAmber.position.set(-2.45, 4.30, 0.135); sigAmber.rotation.y = 0;
  const sigGreen = sigLamp(0, 0, 0, '#3ce88a');
  sigGreen.position.set(-2.45, 4.30, 0.135); sigGreen.rotation.y = 0;
  sigRed.position.x = -2.83; sigAmber.position.x = -2.45; sigGreen.position.x = -2.07;
  const pedRed = sigLamp(0, 0, 0, '#ff4a3a', 0.075);
  pedRed.position.set(-0.02, 2.72, 0.27); pedRed.rotation.y = 0;
  const pedGreen = sigLamp(0, 0, 0, '#3ce88a', 0.075);
  pedGreen.position.set(-0.02, 2.42, 0.27); pedGreen.rotation.y = 0;

  /* ========================== neighbours =========================== */
  const WIN_WARM = '#d3a061', WIN_COOL = '#7c9cc9', WIN_OFF = '#141b2b';
  const win = (x, y, z, w, h, ry, lit, cool) => {
    b.box(w + 0.08, h + 0.08, 0.06, 'metalDeep', x, y, z, { ry, outline: 0.0005 });
    b.box(w + 0.16, 0.05, 0.11, 'neighborBand', x, y - h / 2 - 0.06, z, { ry, outline: 0.0003 });
    b.box(0.04, h, 0.10, 'metalDeep', x + Math.sin(ry) * 0.01, y, z + Math.cos(ry) * 0.01, { ry, outline: 0 });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({ color: lit ? (cool ? WIN_COOL : WIN_WARM) : WIN_OFF }));
    m.rotation.y = ry;
    m.position.set(x + Math.sin(ry) * 0.04, y, z + Math.cos(ry) * 0.04);
    dyn.add(m);
    windows.push({ mesh: m, lit, cool });
    return m;
  };
  const block = (B, key, bands) => {
    b.box(B.x1 - B.x0, B.h, B.z1 - B.z0, key, (B.x0 + B.x1) / 2, B.h / 2, (B.z0 + B.z1) / 2, { outline: 0.0011 });
    b.box(B.x1 - B.x0 + 0.14, 0.16, B.z1 - B.z0 + 0.14, 'metalDeep', (B.x0 + B.x1) / 2, B.h + 0.08, (B.z0 + B.z1) / 2, { outline: 0.0008 });
    // plinth + floor bands so the slabs read as storeys instead of blank walls
    b.box(B.x1 - B.x0 + 0.08, 0.85, B.z1 - B.z0 + 0.08, 'neighborBase', (B.x0 + B.x1) / 2, 0.425, (B.z0 + B.z1) / 2, { outline: 0.0007 });
    for (const y of bands) {
      b.box(B.x1 - B.x0 + 0.06, 0.09, B.z1 - B.z0 + 0.06, 'neighborBand', (B.x0 + B.x1) / 2, y, (B.z0 + B.z1) / 2, { outline: 0.0004 });
    }
  };
  // window grid on an outward face; ry is the face normal
  const faceGrid = (cx, cz, ry, span, y0, rows, cols, rowH, litP) => {
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const t = cols === 1 ? 0 : (c / (cols - 1) - 0.5) * span;
      win(cx + Math.cos(ry) * t, y0 + r * rowH, cz - Math.sin(ry) * t, 0.74, 0.86, ry, rnd() < litP, rnd() < 0.45);
    }
  };
  const LB = L.leftBlock, BB = L.backBlock, RB = L.rightBlock, FB = L.farBlock;
  block(LB, 'neighbor', [3.45, 5.05]);
  block(BB, 'neighbor2', [2.75, 4.15]);
  block(RB, 'neighbor', [2.25]);
  block(FB, 'neighbor2', [1.70, 3.30]);
  // outward faces get windows too — the model is meant to be orbited
  faceGrid(LB.x0 - 0.03, (LB.z0 + LB.z1) / 2, -Math.PI / 2, 7.0, 2.05, 3, 4, 1.55, 0.42);
  faceGrid((LB.x0 + LB.x1) / 2, LB.z0 - 0.03, Math.PI, 1.5, 2.05, 3, 2, 1.55, 0.42);
  faceGrid((BB.x0 + BB.x1) / 2, BB.z0 - 0.03, Math.PI, 12.4, 2.15, 2, 7, 1.45, 0.40);
  faceGrid(BB.x1 + 0.03, (BB.z0 + BB.z1) / 2, Math.PI / 2, 3.4, 2.15, 2, 3, 1.45, 0.45);
  faceGrid(RB.x1 + 0.03, (RB.z0 + RB.z1) / 2, Math.PI / 2, 12.6, 1.50, 2, 6, 1.50, 0.40);
  faceGrid((RB.x0 + RB.x1) / 2, RB.z1 + 0.03, 0, 0.9, 1.50, 2, 1, 1.50, 0.5);
  faceGrid((FB.x0 + FB.x1) / 2, FB.z1 + 0.03, 0, 8.2, 2.60, 2, 5, 1.30, 0.42);
  faceGrid(FB.x1 + 0.03, (FB.z0 + FB.z1) / 2, Math.PI / 2, 0.5, 2.60, 2, 1, 1.30, 0.5);
  // rooftop clutter
  b.rbox(1.5, 0.9, 1.1, 0.06, 'metalDeep', -10.6, LB.h + 0.6, -6.4, { outline: 0.0008 });
  b.cyl(0.34, 0.34, 0.62, 12, 'metal', -10.6, LB.h + 0.45, -2.6, { outline: 0.0007 });
  b.rbox(1.9, 0.7, 1.3, 0.06, 'metalDeep', -4.2, BB.h + 0.5, -10.4, { outline: 0.0008 });
  b.rbox(1.2, 0.8, 1.0, 0.06, 'metalDeep', 11.2, RB.h + 0.55, -3.0, { outline: 0.0008 });
  b.cyl(0.30, 0.30, 0.55, 12, 'metal', -8.0, FB.h + 0.42, 11.5, { outline: 0.0007 });
  b.strut([-3.4, FB.h + 0.16, 11.5], [-3.4, FB.h + 1.5, 11.5], 0.03, 'metal', { outline: 0.0004 });
  for (let i = 0; i < 3; i++) {
    b.strut([-3.75, FB.h + 1.0 + i * 0.2, 11.5], [-3.05, FB.h + 1.0 + i * 0.2, 11.5], 0.016, 'metal', { outline: 0.0003 });
  }
  // closed shopfronts on the two outer walls, so the back of the model reads too
  const shutter = (cx, cz, ry, w, h) => {
    const nx = Math.sin(ry), nz = Math.cos(ry);
    b.plane(w, h, 'shutter', cx + nx * 0.02, 0.90 + h / 2, cz + nz * 0.02, { ry, uvScale: [w * 0.6, 1] });
    b.box(w + 0.16, 0.14, 0.10, 'metalDeep', cx + nx * 0.03, 0.90 + h + 0.07, cz + nz * 0.03, { ry, outline: 0.0004 });
    b.box(w + 0.16, 0.10, 0.10, 'metalDeep', cx + nx * 0.03, 0.88, cz + nz * 0.03, { ry, outline: 0.0004 });
  };
  shutter(-10.4, FB.z1, 0, 1.7, 1.5);
  shutter(-7.9, FB.z1, 0, 1.7, 1.5);
  b.plane(0.95, 1.95, 'shutter', -5.2, 1.88, FB.z1 + 0.02, { uvScale: [0.6, 1.3] });
  b.plane(4.6, 0.44, 'noren', -9.15, 2.72, FB.z1 + 0.02, {});
  b.plane(0.52, 0.74, 'posterB', -3.6, 1.55, FB.z1 + 0.02, {});
  shutter(RB.x1, -8.4, Math.PI / 2, 1.8, 1.4);
  shutter(RB.x1, -5.6, Math.PI / 2, 1.8, 1.4);
  b.plane(0.95, 1.95, 'shutter', RB.x1 + 0.02, 1.88, 0.4, { ry: Math.PI / 2, uvScale: [0.6, 1.3] });
  b.plane(0.52, 0.74, 'posterD', RB.x1 + 0.02, 1.55, -2.4, { ry: Math.PI / 2 });
  // left block: small shopfront + flats above
  b.box(2.7, 0.5, 0.14, 'navy', (LB.x0 + LB.x1) / 2, 3.05, LB.z1 + 0.06, { outline: 0.0007 });
  b.plane(2.5, 0.36, 'noren', (LB.x0 + LB.x1) / 2, 3.05, LB.z1 + 0.14, {});
  b.box(2.5, 0.16, 0.7, 'metalDeep', (LB.x0 + LB.x1) / 2, 2.72, LB.z1 + 0.35, { outline: 0.0006 });
  b.box(1.6, 1.7, 0.08, 'metalDeep', -10.9, 1.05, LB.z1 + 0.04, { outline: 0.0006 });
  win(-10.9, 1.15, LB.z1 + 0.09, 1.4, 1.4, 0, true, false);
  for (let i = 0; i < 2; i++) {
    win(-11.3 + i * 1.0, 4.35, LB.z1 + 0.05, 0.62, 0.86, 0, i === 0, i === 1);
    win(-11.3 + i * 1.0, 5.55, LB.z1 + 0.05, 0.62, 0.72, 0, i === 1, false);
  }
  // vertical neon on the left block, facing the street
  b.box(0.42, 1.9, 0.14, 'metalDeep', -9.75, 4.30, LB.z1 + 0.16, { outline: 0.0007 });
  const neonV = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 1.78), new THREE.MeshBasicMaterial({ color: '#ff5f96' }));
  neonV.position.set(-9.75, 4.30, LB.z1 + 0.24);
  dyn.add(neonV); glow.push(neonV);
  for (let i = 0; i < 4; i++) {
    const ch = new THREE.Mesh(new THREE.PlaneGeometry(0.26, 0.26), new THREE.MeshBasicMaterial({ color: '#2a0c18' }));
    ch.position.set(-9.75, 4.95 - i * 0.44, LB.z1 + 0.25);
    dyn.add(ch);
  }
  // alley-mouth neon on the left block's alley face
  b.box(0.12, 0.9, 0.34, 'metalDeep', LB.x1 + 0.08, 3.10, -2.20, { outline: 0.0006 });
  const neonA = new THREE.Mesh(new THREE.PlaneGeometry(0.80, 0.28), new THREE.MeshBasicMaterial({ color: '#ff8a4a' }));
  neonA.rotation.y = Math.PI / 2;
  neonA.position.set(LB.x1 + 0.15, 3.10, -2.20);
  dyn.add(neonA); glow.push(neonA);
  const alleyLamp = new THREE.PointLight(new THREE.Color('#ff7a4a'), 5, 5.5, 2.0);
  alleyLamp.position.set(LB.x1 + 0.5, 3.0, -2.2);
  scene.add(alleyLamp);

  // back block windows
  for (let r = 0; r < 2; r++) for (let c = 0; c < 6; c++) {
    const x = -8.4 + c * 2.2, y = 3.5 + r * 1.35;
    if (x > 4.2) continue;
    win(x, y, BB.z1 + 0.03, 0.8, 0.9, 0, rnd() < 0.45, rnd() < 0.4);
  }
  b.cyl(0.42, 0.42, 0.7, 12, 'metal', -6.0, BB.h + 0.5, -9.6, { outline: 0.0008 });
  b.cyl(0.30, 0.30, 0.5, 10, 'metalDark', 1.4, BB.h + 0.4, -10.2, { outline: 0.0007 });
  b.strut([3.4, BB.h, -9.0], [3.4, BB.h + 1.4, -9.0], 0.03, 'metal', { outline: 0.0004 });
  // right block windows
  for (let r = 0; r < 2; r++) for (let c = 0; c < 4; c++) {
    win(RB.x0 - 0.03, 1.5 + r * 1.5, -10.4 + c * 3.2, 0.9, 0.9, -Math.PI / 2, rnd() < 0.5, rnd() < 0.5);
  }
  b.box(0.5, 0.16, 4.0, 'metalDeep', RB.x0 - 0.2, 2.55, -6.0, { outline: 0.0006 });
  // far block windows + hedge
  for (let c = 0; c < 5; c++) {
    win(-11.2 + c * 2.0, 2.6, FB.z0 - 0.03, 0.9, 1.0, Math.PI, rnd() < 0.5, rnd() < 0.5);
    win(-11.2 + c * 2.0, 3.9, FB.z0 - 0.03, 0.9, 0.8, Math.PI, rnd() < 0.4, rnd() < 0.6);
  }
  for (let i = 0; i < 7; i++) {
    b.rbox(1.1, 0.62, 0.7, 0.14, 'hedge', -1.6 + i * 1.15, WY + 0.31, 11.45, { outline: 0.0008 });
  }
  b.box(8.4, 0.30, 0.8, 'concrete', 2.4, WY + 0.15, 11.45, { outline: 0.0007 });

  /* ============================= alley ============================= */
  const AL = L.alley;
  b.box(0.9, 1.0, 0.7, 'metalDark', -8.45, WY + 0.5, -6.6, { outline: 0.0008 });
  b.box(0.94, 0.08, 0.74, 'metalDeep', -8.45, WY + 1.04, -6.6, { outline: 0.0005 });
  for (let i = 0; i < 3; i++) {
    b.box(0.42, 0.30, 0.42, i % 2 ? 'navy' : 'cyanP', -8.9 + (i % 2) * 0.5, WY + 0.15 + Math.floor(i / 2) * 0.31, -4.4, { outline: 0.0006 });
  }
  b.box(0.5, 0.30, 0.5, 'wood', -8.2, WY + 0.15, -3.6, { outline: 0.0006 });
  b.cyl(0.05, 0.05, 3.4, 8, 'metal', -9.20, WY + 1.7, -5.0, { outline: 0.0004 });
  b.cyl(0.05, 0.05, 3.4, 8, 'metal', -9.20, WY + 1.7, -5.3, { outline: 0.0004 });
  b.box(0.62, 1.9, 0.07, 'metalDeep', -7.68, WY + 0.95, -6.0, { ry: Math.PI / 2, outline: 0.0006 });
  b.plane(0.4, 0.28, 'posterC', -7.74, WY + 1.6, -5.6, { ry: -Math.PI / 2 });
  // alley wall lamp
  b.box(0.16, 0.12, 0.26, 'metalDark', LB.x1 + 0.1, 3.55, -4.0, { outline: 0.0004 });
  const alleyBulb = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), mat('neonWarm'));
  alleyBulb.position.set(LB.x1 + 0.2, 3.44, -4.0);
  dyn.add(alleyBulb); glow.push(alleyBulb);

  /* ======================= parking sign & misc ===================== */
  b.box(0.06, 1.6, 0.06, 'metal', -5.45, WY + 0.8, 1.30, { outline: 0.0005 });
  b.box(0.52, 0.52, 0.05, 'metalDark', -5.45, WY + 1.80, 1.30, { outline: 0.0006 });
  {
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const g = c.getContext('2d');
    g.fillStyle = '#1a5fa8'; g.fillRect(0, 0, 128, 128);
    g.fillStyle = '#ffffff'; g.font = 'bold 96px "Trebuchet MS",sans-serif';
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('P', 64, 68);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(0.46, 0.46), new THREE.MeshBasicMaterial({ map: t }));
    m.position.set(-5.45, WY + 1.80, 1.33);
    dyn.add(m);
  }
  // scattered leaves / paper bits near the kerb
  for (let i = 0; i < 14; i++) {
    const x = -11 + rnd() * 22, z = 6.4 + rnd() * 4;
    b.box(0.09 + rnd() * 0.06, 0.008, 0.06 + rnd() * 0.05, 'productsPlain', x, 0.03, z,
      { ry: rnd() * 3, color: ['#6b5a3a', '#4a5a3a', '#8a7a5a'][i % 3], outline: 0 });
  }

  /* ========================== parked kei-van ======================== */
  {
    const VX = -10.05, VZ = 3.25, VY = 0.022;
    const R = 0.27;
    for (const dx of [-0.66, 0.66]) for (const dz of [-1.06, 1.06]) {
      b.cyl(R, R, 0.17, 14, 'rubber', VX + dx, VY + R, VZ + dz, { rz: Math.PI / 2, outline: 0.0007 });
      b.cyl(0.13, 0.13, 0.19, 12, 'metal', VX + dx, VY + R, VZ + dz, { rz: Math.PI / 2, outline: 0.0004 });
    }
    b.box(1.44, 0.26, 3.10, 'metalDeep', VX, VY + 0.34, VZ, { outline: 0.0006 });
    b.rbox(1.50, 0.66, 3.30, 0.09, 'vanBody', VX, VY + 0.70, VZ, { outline: 0.0010 });
    b.rbox(1.52, 0.88, 3.22, 0.10, 'vanBody', VX, VY + 1.46, VZ, { outline: 0.0010 });
    b.rbox(1.44, 0.10, 3.06, 0.05, 'vanBody', VX, VY + 1.94, VZ, { outline: 0.0007 });
    // greenhouse
    b.plane(1.30, 0.60, 'vanGlass', VX, VY + 1.52, VZ + 1.612, {});
    b.plane(1.26, 0.54, 'vanGlass', VX, VY + 1.54, VZ - 1.612, { ry: Math.PI });
    for (const s of [-1, 1]) {
      b.plane(0.74, 0.52, 'vanGlass', VX + s * 0.762, VY + 1.52, VZ + 1.06, { ry: s * Math.PI / 2 });
      b.plane(0.62, 0.44, 'vanGlass', VX + s * 0.762, VY + 1.54, VZ + 0.20, { ry: s * Math.PI / 2 });
      b.plane(2.05, 0.30, 'vanPanel', VX + s * 0.764, VY + 1.02, VZ - 0.42, { ry: s * Math.PI / 2 });
      b.box(0.03, 0.05, 0.26, 'metalDark', VX + s * 0.768, VY + 1.16, VZ + 0.86, { outline: 0.0003 });
      b.strut([VX + s * 0.74, VY + 1.44, VZ + 1.44], [VX + s * 0.90, VY + 1.50, VZ + 1.40], 0.022, 'metalDark', { outline: 0.0003 });
      b.box(0.06, 0.15, 0.11, 'metalDeep', VX + s * 0.93, VY + 1.52, VZ + 1.39, { outline: 0.0004 });
      b.box(0.16, 0.34, 0.05, 'taillamp', VX + s * 0.64, VY + 1.22, VZ - 1.625, { outline: 0.0004 });
      b.box(0.32, 0.17, 0.05, 'headlamp', VX + s * 0.52, VY + 0.94, VZ + 1.652, { outline: 0.0004 });
      b.strut([VX + s * 0.56, VY + 1.98, VZ - 1.30], [VX + s * 0.56, VY + 1.98, VZ + 1.10], 0.024, 'metalDark', { outline: 0.0003 });
    }
    b.box(0.92, 0.17, 0.05, 'metalDark', VX, VY + 0.72, VZ + 1.653, { outline: 0.0004 });
    b.box(1.54, 0.20, 0.14, 'metalDark', VX, VY + 0.50, VZ + 1.63, { outline: 0.0005 });
    b.box(1.54, 0.20, 0.14, 'metalDark', VX, VY + 0.50, VZ - 1.63, { outline: 0.0005 });
    b.box(0.34, 0.16, 0.03, 'white', VX, VY + 0.72, VZ - 1.665, { outline: 0.0003 });
    b.box(0.30, 0.14, 0.03, 'amberP', VX, VY + 0.72, VZ + 1.668, { outline: 0.0003 });
    for (const dz of [-0.9, 0.9]) {
      b.strut([VX - 0.56, VY + 1.94, VZ + dz], [VX - 0.56, VY + 1.99, VZ + dz], 0.02, 'metalDark', { outline: 0.0002 });
      b.strut([VX + 0.56, VY + 1.94, VZ + dz], [VX + 0.56, VY + 1.99, VZ + dz], 0.02, 'metalDark', { outline: 0.0002 });
    }
    b.strut([VX - 0.44, VY + 1.28, VZ + 1.60], [VX - 0.06, VY + 1.42, VZ + 1.60], 0.012, 'rubber', { outline: 0 });
    b.strut([VX + 0.10, VY + 1.28, VZ + 1.60], [VX + 0.48, VY + 1.42, VZ + 1.60], 0.012, 'rubber', { outline: 0 });
  }

  /* ==================== far kerb: post box, bench =================== */
  {
    // 〒 post box
    const PX = 7.30, PZ = 11.42;
    b.cyl(0.29, 0.31, 1.12, 16, 'post', PX, WY + 0.56, PZ, { outline: 0.0009 });
    b.cyl(0.32, 0.32, 0.07, 16, 'post', PX, WY + 1.15, PZ, { outline: 0.0006 });
    b.sphere(0.31, 'post', PX, WY + 1.17, PZ, { sy: 0.42, outline: 0.0007, seg: 14 });
    b.cyl(0.33, 0.35, 0.10, 16, 'metalDeep', PX, WY + 0.05, PZ, { outline: 0.0005 });
    b.box(0.30, 0.06, 0.05, 'metalDeep', PX, WY + 0.94, PZ - 0.29, { outline: 0.0004 });
    b.box(0.22, 0.16, 0.03, 'white', PX, WY + 0.66, PZ - 0.305, { outline: 0.0003 });
    b.box(0.20, 0.03, 0.03, 'post', PX, WY + 0.70, PZ - 0.322, { outline: 0 });
    b.box(0.14, 0.03, 0.03, 'post', PX, WY + 0.63, PZ - 0.322, { outline: 0 });

    // bench facing the road
    const BX = 9.05, BZ = 11.38;
    for (const dx of [-0.62, 0.62]) {
      b.box(0.08, 0.42, 0.44, 'metalDark', BX + dx, WY + 0.21, BZ, { outline: 0.0005 });
      b.box(0.08, 0.50, 0.08, 'metalDark', BX + dx, WY + 0.66, BZ + 0.19, { outline: 0.0004 });
    }
    for (let i = 0; i < 3; i++) {
      b.rbox(1.46, 0.06, 0.13, 0.02, 'wood', BX, WY + 0.45, BZ - 0.16 + i * 0.16, { outline: 0.0005 });
    }
    for (let i = 0; i < 2; i++) {
      b.rbox(1.46, 0.13, 0.06, 0.02, 'wood', BX, WY + 0.72 + i * 0.19, BZ + 0.21, { outline: 0.0005 });
    }

    // planters flanking the bench
    for (const px of [6.75, 10.05]) {
      b.rbox(0.62, 0.46, 0.62, 0.05, 'concrete', px, WY + 0.23, 11.45, { outline: 0.0008 });
      b.box(0.54, 0.06, 0.54, 'metalDeep', px, WY + 0.46, 11.45, { outline: 0.0004 });
      b.sphere(0.30, 'hedge', px, WY + 0.62, 11.45, { sy: 0.78, outline: 0.0008, seg: 12 });
      b.sphere(0.19, 'hedge', px + 0.16, WY + 0.80, 11.36, { outline: 0.0006, seg: 10 });
    }

    // fire hydrant in the guardrail gap
    b.cyl(0.13, 0.16, 0.62, 12, 'amberP', -6.45, WY + 0.31, 10.80, { outline: 0.0007 });
    b.sphere(0.135, 'amberP', -6.45, WY + 0.63, 10.80, { sy: 0.7, outline: 0.0005, seg: 12 });
    b.cyl(0.19, 0.21, 0.07, 12, 'metalDeep', -6.45, WY + 0.035, 10.80, { outline: 0.0004 });
    for (const s of [-1, 1]) b.cyl(0.055, 0.055, 0.10, 8, 'amberP', -6.45 + s * 0.15, WY + 0.40, 10.80, { rz: Math.PI / 2, outline: 0.0003 });
    b.box(0.22, 0.30, 0.03, 'white', -6.45, WY + 0.34, 10.66, { outline: 0.0003 });
  }

  /* ===================== scooter on the side walk =================== */
  {
    const SX = 11.25, SZ = 5.40, R = 0.21;
    for (const dz of [-0.52, 0.52]) {
      b.cyl(R, R, 0.11, 14, 'rubber', SX, WY + R, SZ + dz, { rz: Math.PI / 2, outline: 0.0006 });
      b.cyl(0.09, 0.09, 0.13, 10, 'metal', SX, WY + R, SZ + dz, { rz: Math.PI / 2, outline: 0.0003 });
    }
    b.rbox(0.30, 0.30, 1.02, 0.10, 'magentaP', SX, WY + 0.46, SZ - 0.10, { outline: 0.0009 });
    b.rbox(0.34, 0.16, 0.52, 0.07, 'rubber', SX, WY + 0.66, SZ - 0.28, { outline: 0.0006 });
    b.rbox(0.30, 0.52, 0.34, 0.10, 'magentaP', SX, WY + 0.62, SZ + 0.44, { outline: 0.0008 });
    b.strut([SX, WY + 0.40, SZ + 0.52], [SX, WY + 1.00, SZ + 0.60], 0.035, 'metalDark', { outline: 0.0004 });
    b.strut([SX - 0.24, WY + 1.02, SZ + 0.60], [SX + 0.24, WY + 1.02, SZ + 0.60], 0.024, 'metalDark', { outline: 0.0004 });
    b.plane(0.20, 0.16, 'headlamp', SX, WY + 0.86, SZ + 0.625, {});
    b.box(0.20, 0.10, 0.04, 'taillamp', SX, WY + 0.60, SZ - 0.63, { outline: 0.0003 });
    b.box(0.26, 0.22, 0.24, 'metalDark', SX, WY + 0.80, SZ - 0.60, { outline: 0.0006 });
    b.strut([SX + 0.10, WY + 0.34, SZ - 0.05], [SX + 0.24, WY + 0.02, SZ - 0.05], 0.02, 'metalDark', { outline: 0.0003 });
  }

  b.flush(scene, 'street');

  /* =========================== animation =========================== */
  const SIG = { green: 8.5, amber: 2.0, red: 9.0 };
  const cycle = SIG.green + SIG.amber + SIG.red;
  let nextWin = 4 + rnd() * 6;
  const dim = new THREE.Color('#0e1524');

  function update(t, dt) {
    const p = t % cycle;
    const g = p < SIG.green ? 1 : 0;
    const a = p >= SIG.green && p < SIG.green + SIG.amber ? 1 : 0;
    const r = p >= SIG.green + SIG.amber ? 1 : 0;
    sigGreen.material.color.setRGB(0.05 + g * 0.20, 0.10 + g * 0.95, 0.10 + g * 0.45);
    sigAmber.material.color.setRGB(0.12 + a * 1.0, 0.09 + a * 0.62, 0.05 + a * 0.10);
    sigRed.material.color.setRGB(0.14 + r * 1.0, 0.06 + r * 0.20, 0.05 + r * 0.14);
    pedRed.material.color.setRGB(0.12 + (1 - g) * 0.95, 0.06 + (1 - g) * 0.18, 0.05 + (1 - g) * 0.12);
    pedGreen.material.color.setRGB(0.05 + g * 0.18, 0.10 + g * 0.90, 0.10 + g * 0.42);

    // neon breathing + occasional stutter on the alley sign
    const buzz = 0.90 + 0.10 * Math.sin(t * 24.0) + 0.04 * Math.sin(t * 7.3);
    const stutter = (Math.sin(t * 0.53) > 0.97) ? (Math.sin(t * 60) > 0 ? 0.25 : 1.0) : 1.0;
    neonV.material.color.setRGB(1.0 * buzz * stutter, 0.37 * buzz * stutter, 0.59 * buzz * stutter);
    neonA.material.color.setRGB(1.0 * buzz, 0.54 * buzz, 0.29 * buzz);
    alleyBulb.material.color.setRGB(1.0, 0.78 * buzz, 0.50 * buzz);

    // a neighbour window occasionally switches
    if (t > nextWin) {
      nextWin = t + 5 + rnd() * 9;
      const w = windows[Math.floor(rnd() * windows.length)];
      w.lit = !w.lit;
      w.mesh.material.color.set(w.lit ? (w.cool ? WIN_COOL : WIN_WARM) : dim);
    }
    return { lampPositions: [lamp1, lamp2, lamp3] };
  }

  return { dyn, update, glow, windows, lampPositions: [lamp1, lamp2, lamp3] };
}