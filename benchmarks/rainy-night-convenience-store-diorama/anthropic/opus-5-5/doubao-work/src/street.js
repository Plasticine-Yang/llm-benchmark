import * as THREE from 'three';
import { L, SLAB, LAYER } from './layout.js';
import { toon, glowMat, box, rbox, boxMM, mesh, cyl, plane, rod, G, rng, noOutline } from './util.js';
import { glassMat } from './materials.js';
import * as T from './textures.js';

const F = SLAB;

export function buildStreet(scene, updaters, lights) {
  const root = new THREE.Group();
  root.name = 'street';
  scene.add(root);
  const M = {
    pole: toon('#8d939b'),
    poleDark: toon('#4a4f57'),
    concrete: toon('#a8a69f'),
    black: toon('#22262d'),
    steel: toon('#b9bfc6'),
    rail: toon('#e9ecef'),
    railStripe: toon('#d8b02a'),
    green: toon('#3c7a52'),
    wood: toon('#7a5638'),
  };

  // ------------------------------------------------------------ vending machines (right of the door, under canopy)
  const vm = (x, z, ry, theme) => {
    const g = new THREE.Group();
    g.position.set(x, F, z);
    g.rotation.y = ry;
    root.add(g);
    rbox(g, 0.72, 1.82, 0.62, toon(theme ? '#d93a3a' : '#f4f7fb'), 0, 0, 0, 0.04);
    const face = plane(g, 0.64, 1.74, glowMat('#ffffff', 1.05, { map: T.vendingTexture(theme) }), 0, 0.92, 0.312);
    noOutline(face);
    box(g, 0.74, 0.08, 0.66, M.black, 0, 1.82, 0);
    const lt = box(g, 0.6, 0.03, 0.02, glowMat('#e8f6ff', 2.2), 0, 1.79, 0.31);
    noOutline(lt);
    // coin return / slot
    box(g, 0.5, 0.12, 0.06, M.black, 0, 0.2, 0.3);
    const pl = new THREE.PointLight(theme ? '#ff8a8a' : '#cfe8ff', 2.2, 2.6, 1.8);
    pl.position.set(0, 1.0, 0.7);
    g.add(pl);
    lights.push(pl);
    return g;
  };
  vm(2.3, 1.55, 0, 0);
  vm(3.03, 1.55, 0, 1);
  // recycle bins next to vending
  const bin = (x, z, col, label) => {
    const g = new THREE.Group();
    g.position.set(x, F, z);
    root.add(g);
    rbox(g, 0.3, 0.68, 0.3, toon(col), 0, 0, 0, 0.03);
    mesh(g, G.cyl(0.07, 0.07, 0.01, 14), M.black, 0, 0.62, 0.151, [Math.PI / 2, 0, 0]);
    const lb = plane(g, 0.24, 0.08, toon('#ffffff', { map: T.stickerTexture(label, '#ffffff', '#333333', 192, 64), unique: true }), 0, 0.45, 0.152);
    noOutline(lb);
    return g;
  };
  bin(1.75, 1.6, '#2f7de1', 'カン');
  bin(-0.15, 1.6, '#3fb36b', 'ペット');
  bin(-0.5, 1.6, '#ff8a3d', 'もえる');
  bin(-0.85, 1.6, '#9aa4b2', 'びん');

  // ------------------------------------------------------------ umbrella stand (left of door)
  {
    const g = new THREE.Group();
    g.position.set(0.2, F, 1.45);
    root.add(g);
    box(g, 0.5, 0.05, 0.22, M.steel, 0, 0, 0);
    box(g, 0.5, 0.04, 0.22, M.steel, 0, 0.45, 0);
    for (const x of [-0.24, 0.24]) box(g, 0.025, 0.5, 0.025, M.steel, x, 0, 0);
    const cols = ['#9fd9ff', '#ff7fb0', '#ffffff', '#1c2a44', '#ffe14d', '#59c96b'];
    for (let i = 0; i < 6; i++) {
      const x = -0.2 + i * 0.08;
      const lean = (i % 2 ? 0.08 : -0.06);
      const u = new THREE.Group();
      u.position.set(x, 0.03, (i % 2) * 0.05 - 0.02);
      u.rotation.z = lean;
      g.add(u);
      mesh(u, G.cyl(0.012, 0.045, 0.62, 8), toon(cols[i], { opacity: i === 0 ? 0.7 : 1 }), 0, 0.33, 0);
      // J handle
      rod(u, [0, 0.64, 0], [0, 0.72, 0], 0.008, M.black);
      mesh(u, new THREE.TorusGeometry(0.025, 0.008, 6, 10, Math.PI), M.black, 0.025, 0.72, 0, [0, 0, 0]);
    }
  }

  // ------------------------------------------------------------ bicycles (front-left, near alley)
  const bike = (x, z, ry, col) => {
    const g = new THREE.Group();
    g.position.set(x, F, z);
    g.rotation.y = ry;
    root.add(g);
    const wheelG = new THREE.TorusGeometry(0.27, 0.022, 8, 28);
    const wm = M.black;
    const frame = toon(col);
    mesh(g, wheelG, wm, -0.42, 0.29, 0);
    mesh(g, wheelG, wm, 0.42, 0.29, 0);
    for (const wx of [-0.42, 0.42]) {
      for (let k = 0; k < 6; k++) {
        const a = (k / 6) * Math.PI;
        rod(g, [wx + Math.cos(a) * 0.25, 0.29 + Math.sin(a) * 0.25, 0], [wx - Math.cos(a) * 0.25, 0.29 - Math.sin(a) * 0.25, 0], 0.004, M.steel, 4);
      }
    }
    const P = {
      rear: [-0.42, 0.29, 0], crank: [-0.02, 0.27, 0], seat: [-0.17, 0.72, 0], head: [0.3, 0.74, 0], front: [0.42, 0.29, 0],
    };
    rod(g, P.rear, P.crank, 0.018, frame);
    rod(g, P.rear, P.seat, 0.016, frame);
    rod(g, P.crank, P.seat, 0.022, frame);
    rod(g, P.crank, P.head, 0.024, frame); // step-through mama-chari
    rod(g, P.head, P.front, 0.018, frame);
    rod(g, P.seat, [-0.2, 0.8, 0], 0.012, M.steel);
    rbox(g, 0.22, 0.05, 0.12, M.black, -0.2, 0.8, 0, 0.02);
    rod(g, P.head, [0.27, 0.95, 0], 0.014, M.steel);
    rod(g, [0.22, 0.97, -0.24], [0.22, 0.97, 0.24], 0.012, M.steel);
    for (const s of [-1, 1]) mesh(g, G.cyl(0.018, 0.018, 0.1, 8), M.black, 0.22, 0.97, s * 0.26, [Math.PI / 2, 0, 0]);
    // basket
    const bk = new THREE.Group();
    bk.position.set(0.5, 0.8, 0);
    g.add(bk);
    box(bk, 0.3, 0.02, 0.32, M.steel, 0, 0, 0);
    for (const [bx, bz, w, d] of [[-0.15, 0, 0.012, 0.32], [0.15, 0, 0.012, 0.32], [0, -0.16, 0.3, 0.012], [0, 0.16, 0.3, 0.012]]) box(bk, w, 0.2, d, M.steel, bx, 0, bz);
    // rear rack + mudguards
    box(g, 0.3, 0.02, 0.14, M.steel, -0.38, 0.62, 0);
    mesh(g, new THREE.TorusGeometry(0.3, 0.012, 4, 16, Math.PI * 0.8), M.steel, 0.42, 0.29, 0, [0, 0, Math.PI * 0.1]);
    mesh(g, new THREE.TorusGeometry(0.3, 0.012, 4, 16, Math.PI * 0.8), M.steel, -0.42, 0.29, 0, [0, 0, Math.PI * 0.1]);
    // lamp + stand
    mesh(g, G.cyl(0.04, 0.03, 0.06, 10), toon('#ffe9a8', { glow: 0.6 }), 0.38, 0.6, 0, [0, 0, Math.PI / 2]);
    rod(g, [-0.4, 0.29, 0.04], [-0.45, 0.0, 0.16], 0.008, M.steel);
    g.rotation.x = 0.0;
    g.rotation.z = 0;
    return g;
  };
  bike(-2.75, 1.65, Math.PI / 2 - 0.12, '#e2552e');
  bike(-2.25, 1.62, Math.PI / 2 + 0.08, '#9fd9ff');
  // bicycle rack bar
  rod(root, [-3.05, F + 0.3, 1.2], [-1.95, F + 0.3, 1.2], 0.02, M.steel);
  for (const x of [-3.0, -2.0]) rod(root, [x, F, 1.2], [x, F + 0.3, 1.2], 0.02, M.steel);

  // ------------------------------------------------------------ parking stoppers, cones
  for (const x of [-2.3, -0.7]) box(root, 0.8, 0.1, 0.14, toon('#d0cfc8'), x, F, 2.15);
  for (const x of [-2.66, -1.94, -1.06, -0.34]) box(root, 0.06, 0.012, 0.15, toon('#e9c23a'), x, F + 0.1, 2.15);
  const cone = (x, z) => {
    const g = new THREE.Group();
    g.position.set(x, F, z);
    root.add(g);
    box(g, 0.22, 0.025, 0.22, M.black, 0, 0, 0);
    mesh(g, G.cyl(0.02, 0.09, 0.38, 14), toon('#ff6a2a'), 0, 0.21, 0);
    mesh(g, G.cyl(0.055, 0.07, 0.08, 14), toon('#ffffff'), 0, 0.22, 0);
  };
  cone(0.55, 2.75);
  // parking sign
  {
    rod(root, [0.9, F, 3.0], [0.9, F + 1.6, 3.0], 0.025, M.pole);
    const s = plane(root, 0.4, 0.4, toon('#ffffff', { map: T.parkingSignTexture(), glow: 0.25, unique: true }), 0.9, F + 1.4, 3.03);
    s.name = 'parkingSign';
    box(root, 0.42, 0.42, 0.02, M.steel, 0.9, F + 1.19, 3.015);
  }

  // ------------------------------------------------------------ pole sign (corner)
  {
    const x = -3.05, z = 2.95;
    cyl(root, 0.08, 3.4, M.pole, x, F, z, 14);
    const g = new THREE.Group();
    g.position.set(x, F + 3.95, z);
    g.rotation.y = Math.PI / 4;
    root.add(g);
    rbox(g, 1.0, 1.0, 0.24, toon('#e8e3d8'), 0, -0.5, 0, 0.05);
    const t = T.poleSignTexture();
    const m = glowMat('#ffffff', 1.2, { map: t });
    const a = plane(g, 0.9, 0.9, m, 0, 0, 0.122);
    const b = plane(g, 0.9, 0.9, m, 0, 0, -0.122, Math.PI);
    noOutline(a); noOutline(b);
    updaters.push((dt, time) => {
      const k = 1.2 * (1 + 0.03 * Math.sin(time * 37) * Math.sin(time * 0.9));
      m.color.setScalar(k);
    });
    const pl = new THREE.PointLight('#fff2dd', 2.5, 4, 1.8);
    pl.position.set(x, F + 3.6, z + 0.6);
    root.add(pl);
    lights.push(pl);
  }

  // ------------------------------------------------------------ nobori flags
  const flagGroup = [];
  const nobori = (x, z, text, bg, fg) => {
    const g = new THREE.Group();
    g.position.set(x, F, z);
    root.add(g);
    cyl(g, 0.09, 0.12, toon('#2a2e35'), 0, 0, 0, 12);
    rod(g, [0, 0, 0], [0, 1.9, 0], 0.012, M.steel);
    rod(g, [0, 1.88, 0], [0.32, 1.88, 0], 0.008, M.steel);
    const geo = new THREE.PlaneGeometry(0.3, 1.25, 1, 8);
    const fm = toon('#ffffff', { map: T.noboriTexture(text, bg, fg), side: THREE.DoubleSide, unique: true });
    const f = new THREE.Mesh(geo, fm);
    f.position.set(0.165, 1.25, 0);
    g.add(f);
    const base = geo.attributes.position.array.slice();
    flagGroup.push({ geo, base, ph: x * 3 });
    return g;
  };
  nobori(-1.45, 3.05, 'おでん', '#ffe14d', '#d8232a');
  nobori(3.25, 0.35, '肉まん', '#ffffff', '#e2552e');
  updaters.push((dt, time) => {
    for (const fl of flagGroup) {
      const p = fl.geo.attributes.position;
      for (let i = 0; i < p.count; i++) {
        const bx = fl.base[i * 3], by = fl.base[i * 3 + 1];
        const k = (bx + 0.15) / 0.3;
        p.setZ(i, Math.sin(time * 2.2 + by * 3 + fl.ph) * 0.03 * k);
      }
      p.needsUpdate = true;
      fl.geo.computeVertexNormals();
    }
  });

  // ------------------------------------------------------------ AC units on the shop side & alley
  const acUnit = (x, y, z, ry) => {
    const g = new THREE.Group();
    g.position.set(x, y, z);
    g.rotation.y = ry;
    root.add(g);
    rbox(g, 0.7, 0.5, 0.26, toon('#e7e5df'), 0, 0, 0, 0.02);
    mesh(g, G.cyl(0.18, 0.18, 0.01, 20), toon('#3a3e45'), -0.1, 0.25, 0.131, [Math.PI / 2, 0, 0]);
    const fan = new THREE.Group();
    fan.position.set(-0.1, 0.25, 0.137);
    g.add(fan);
    for (let i = 0; i < 3; i++) {
      const bl = box(fan, 0.15, 0.05, 0.005, toon('#8a8f97'), 0.075, -0.025, 0);
      bl.geometry = G.box(0.15, 0.05, 0.005);
      const piv = new THREE.Group();
      piv.rotation.z = (i * Math.PI * 2) / 3;
      fan.add(piv);
      piv.add(bl);
    }
    for (let i = 0; i < 6; i++) box(g, 0.005, 0.36, 0.006, toon('#9aa0a8'), -0.26 + i * 0.065, 0.07, 0.134);
    updaters.push((dt) => { fan.rotation.z -= dt * 6; });
    // pipes
    rod(g, [0.25, 0.4, -0.13], [0.25, 0.9, -0.13], 0.025, toon('#f0eee8'));
    return g;
  };
  acUnit(-3.45, F + 0.05, -1.2, Math.PI / 2);
  acUnit(-3.45, F + 0.05, -2.3, Math.PI / 2);
  acUnit(-4.15, F + 1.45, -3.8, -Math.PI / 2);
  // rack under ac
  for (const z of [-1.2, -2.3]) box(root, 0.3, 0.05, 0.75, M.steel, -3.42, F, z);

  // ------------------------------------------------------------ alley: trash station net, crates, gate, lamp
  {
    // garbage net cage
    const g = new THREE.Group();
    g.position.set(-3.9, F, -5.4);
    root.add(g);
    const net = toon('#2d8a5a', { opacity: 0.85 });
    boxMM(g, -0.35, 0, -0.5, 0.35, 0.65, 0.5, toon('#2d8a5a', { opacity: 0.35 }));
    for (const [x, z] of [[-0.35, -0.5], [0.35, -0.5], [-0.35, 0.5], [0.35, 0.5]]) box(g, 0.03, 0.65, 0.03, net, x, 0, z);
    for (let i = 0; i < 3; i++) {
      const bag = mesh(g, G.sphere(0.2, 10, 8), toon('#f2f2ea', { opacity: 0.9 }), -0.12 + (i % 2) * 0.22, 0.18 + Math.floor(i / 2) * 0.22, -0.2 + i * 0.18);
      bag.scale.set(1, 0.85, 1);
    }
    // beer crates
    for (let i = 0; i < 3; i++) box(root, 0.42, 0.28, 0.32, toon(i % 2 ? '#d93a3a' : '#e9c23a'), -3.85, F + i * 0.28, -6.35);
    // gate at alley end
    for (let x = -4.35; x <= -3.25; x += 0.12) rod(root, [x, F, -6.75], [x, F + 1.1, -6.75], 0.01, M.poleDark);
    rod(root, [-4.4, F + 1.05, -6.75], [-3.2, F + 1.05, -6.75], 0.02, M.poleDark);
    rod(root, [-4.4, F + 0.1, -6.75], [-3.2, F + 0.1, -6.75], 0.02, M.poleDark);
    // wall-mounted alley lamp on the shop's left wall
    const lg = new THREE.Group();
    lg.position.set(L.shop.x0 - 0.02, 2.2, -1.75);
    root.add(lg);
    rod(lg, [0, 0, 0], [-0.3, 0.05, 0], 0.012, M.poleDark);
    mesh(lg, G.cyl(0.04, 0.12, 0.08, 14), M.poleDark, -0.32, 0.02, 0);
    const bulb = mesh(lg, G.sphere(0.045), glowMat('#ffd59a', 3.0), -0.32, -0.03, 0);
    noOutline(bulb);
    const pl = new THREE.PointLight('#ffc98a', 3, 4.5, 1.6);
    pl.position.set(L.shop.x0 - 0.4, 2.0, -1.75);
    root.add(pl);
    lights.push(pl);
    const flickBulb = { n: 2 };
    updaters.push((dt, time) => {
      flickBulb.n -= dt;
      let k = 1;
      if (flickBulb.n < 0) { if (flickBulb.n < -0.4) flickBulb.n = 5 + Math.random() * 6; k = Math.random() < 0.5 ? 0.2 : 1; }
      bulb.material.color.setRGB(1 * 3 * k, 0.835 * 3 * k, 0.6 * 3 * k);
      pl.intensity = 3 * k;
    });
    // cat silhouette asleep under eave? (not a person) small sleeping cat
    const cat = new THREE.Group();
    cat.position.set(-3.5, F + 0.55, -2.3);
    root.add(cat);
    const cm = toon('#3b3a40');
    mesh(cat, G.sphere(0.12, 12, 8), cm, 0, 0.08, 0).scale.set(1.3, 0.7, 0.9);
    mesh(cat, G.sphere(0.07, 10, 8), cm, 0.13, 0.12, 0.03);
    for (const s of [-1, 1]) mesh(cat, new THREE.ConeGeometry(0.025, 0.05, 4), cm, 0.15, 0.19, 0.03 + s * 0.035);
    const tail = rod(cat, [-0.14, 0.04, 0], [-0.05, 0.03, 0.14], 0.018, cm);
    updaters.push((dt, time) => { cat.children[0].scale.y = 0.7 + Math.sin(time * 1.6) * 0.03; tail.rotation.y = Math.sin(time * 0.8) * 0.1; });
  }

  // ------------------------------------------------------------ neighbour building (closed tobacco shop + house) on the left
  {
    const n = L.neighbor;
    const g = new THREE.Group();
    root.add(g);
    const sid = T.sidingTexture('#c9b8a0');
    sid.repeat.set(3, 2);
    const wall = toon('#ffffff', { map: sid, unique: true });
    const H1 = 2.6, H2 = 4.9;
    boxMM(g, n.x0 + 0.1, F, n.z0 + 0.1, n.x1, F + H1, n.z1, wall);
    boxMM(g, n.x0 + 0.1, F + H1, n.z0 + 0.1, n.x1 - 0.15, F + H2, n.z1 - 0.6, wall);
    // ground floor: shutter shop front facing +z
    boxMM(g, n.x0 + 0.3, F, n.z1, n.x1 - 0.3, F + 2.0, n.z1 + 0.02, toon('#ffffff', { map: T.shutterTexture(), unique: true }));
    boxMM(g, n.x0 + 0.1, F + 2.0, n.z1, n.x1, F + 2.35, n.z1 + 0.04, toon('#d8232a'));
    const ts = plane(g, 1.2, 0.3, glowMat('#ffffff', 0.85, { map: T.tabacoSignTexture() }), (n.x0 + n.x1) / 2, F + 2.18, n.z1 + 0.045);
    noOutline(ts);
    // small awning
    const aw = new THREE.Group();
    aw.position.set((n.x0 + n.x1) / 2, F + 2.4, n.z1 + 0.04);
    aw.rotation.x = 0.35;
    g.add(aw);
    for (let i = 0; i < 8; i++) box(aw, (n.x1 - n.x0 - 0.2) / 8, 0.03, 0.6, toon(i % 2 ? '#ffffff' : '#2c8a3c'), -((n.x1 - n.x0 - 0.2) / 2) + ((i + 0.5) * (n.x1 - n.x0 - 0.2)) / 8, 0, 0.3);
    // bench + tobacco vending
    box(g, 0.9, 0.05, 0.3, M.wood, -6.1, F + 0.4, n.z1 + 0.55);
    for (const x of [-6.45, -5.75]) box(g, 0.05, 0.4, 0.26, M.wood, x, F, n.z1 + 0.55);
    rbox(g, 0.55, 1.5, 0.45, toon('#3a4a6a'), -4.95, F, n.z1 + 0.3, 0.03);
    const tv = plane(g, 0.46, 0.8, glowMat('#c9dcff', 0.7, { map: T.cigaretteTexture() }), -4.95, F + 1.0, n.z1 + 0.526);
    noOutline(tv);
    // upper floor windows (some lit)
    const winLit = toon('#ffffff', { map: T.curtainTexture(32), glow: 0.9, unique: true });
    const winLit2 = toon('#ffffff', { map: T.curtainTexture(200), glow: 0.6, unique: true });
    const winDark = toon('#2b3346');
    const win = (x, y, z, ry, mat) => {
      const w = new THREE.Group();
      w.position.set(x, y, z);
      w.rotation.y = ry;
      g.add(w);
      box(w, 0.8, 0.9, 0.04, toon('#7c8590'), 0, 0, 0);
      const p = plane(w, 0.7, 0.8, mat, 0, 0.45, 0.022);
      p.layers.set(LAYER.NO_OUTLINE);
      box(w, 0.025, 0.8, 0.01, toon('#7c8590'), 0, 0.05, 0.03);
      box(w, 0.9, 0.04, 0.15, toon('#6f7882'), 0, -0.03, 0.06);
      return w;
    };
    win(-6.0, F + 3.2, n.z1 - 0.58, 0, winLit);
    win(-5.0, F + 3.2, n.z1 - 0.58, 0, winDark);
    win(n.x1 - 0.13, F + 3.2, -1.5, Math.PI / 2, winLit2);
    win(n.x1 - 0.13, F + 3.2, -4.0, Math.PI / 2, winDark);
    win(n.x1 + 0.02, F + 1.0, -4.5, Math.PI / 2, winDark);
    const pl = new THREE.PointLight('#ffb070', 1.5, 3, 2);
    pl.position.set(-6.0, F + 3.6, n.z1 + 0.1);
    g.add(pl);
    lights.push(pl);
    // balcony with laundry pole on upper floor front
    boxMM(g, -6.7, F + H1, n.z1 - 0.6, -4.7, F + H1 + 0.06, n.z1 + 0.1, toon('#b9bfc6'));
    for (let x = -6.65; x <= -4.7; x += 0.12) rod(g, [x, F + H1, n.z1 + 0.08], [x, F + H1 + 0.75, n.z1 + 0.08], 0.008, M.poleDark);
    rod(g, [-6.7, F + H1 + 0.75, n.z1 + 0.08], [-4.7, F + H1 + 0.75, n.z1 + 0.08], 0.018, M.poleDark);
    rod(g, [-6.6, F + H1 + 1.5, n.z1 - 0.3], [-4.8, F + H1 + 1.5, n.z1 - 0.3], 0.012, M.steel);
    // plants on balcony
    for (const x of [-6.4, -6.0]) {
      cyl(g, 0.1, 0.16, toon('#b0643a'), x, F + H1 + 0.06, n.z1 - 0.2, 10, 0.12);
      mesh(g, G.sphere(0.16, 10, 8), M.green, x, F + H1 + 0.32, n.z1 - 0.2);
    }
    // gable roof
    const rw = n.x1 - 0.15 - (n.x0 + 0.1) + 0.5;
    const rd = n.z1 - 0.6 - (n.z0 + 0.1) + 0.5;
    const rx = (n.x0 + 0.1 + n.x1 - 0.15) / 2;
    const rz = (n.z0 + 0.1 + n.z1 - 0.6) / 2;
    const roofM = toon('#4a5a72');
    const ang = 0.42;
    for (const s of [-1, 1]) {
      const r = mesh(g, G.box(rw / 2 / Math.cos(ang) + 0.05, 0.08, rd), roofM, rx + s * rw / 4, F + H2 + Math.tan(ang) * rw / 4, rz, [0, 0, -s * ang]);
      r.name = 'neighborRoof';
    }
    // gable triangles
    const tri = new THREE.Shape();
    tri.moveTo(-rw / 2 + 0.25, 0); tri.lineTo(rw / 2 - 0.25, 0); tri.lineTo(0, Math.tan(ang) * (rw / 2 - 0.25)); tri.closePath();
    const tg = new THREE.ShapeGeometry(tri);
    for (const z of [n.z0 + 0.1, n.z1 - 0.6]) {
      const m = mesh(g, tg, wall, rx, F + H2, z + (z > rz ? 0.001 : -0.001), [0, z > rz ? 0 : Math.PI, 0]);
      m.material.side = THREE.DoubleSide;
    }
    // first floor roof skirt over shop front
    boxMM(g, n.x0 + 0.05, F + H1 - 0.02, n.z1 - 0.6, n.x1 + 0.05, F + H1 + 0.04, n.z1 + 0.05, toon('#5a6a82'));
    // drain pipe
    rod(g, [n.x1 - 0.05, F, n.z1 - 0.05], [n.x1 - 0.05, F + H1, n.z1 - 0.05], 0.035, toon('#c9c3b8'));
    // block wall at the back boundary
    const bw = T.blockWallTexture();
    bw.repeat.set(4, 1);
    const bwm = toon('#ffffff', { map: bw, unique: true });
    boxMM(root, L.shop.x0, F, -6.95, 3.35, F + 0.85, -6.75, bwm);
    boxMM(root, 3.25, F, -6.95, 3.4, F + 0.85, -3.1, bwm);
    // shrubs behind the shop
    for (let i = 0; i < 9; i++) {
      const x = -2.9 + i * 0.7;
      mesh(root, G.sphere(0.32, 10, 8), toon(i % 2 ? '#3c7a52' : '#336c48'), x, F + 0.3 + (i % 3) * 0.04, -6.45).scale.set(1, 0.9, 0.8);
    }
    // trees behind the wall
    for (const [x, z] of [[-1.6, -6.4], [1.6, -6.3]]) {
      cyl(root, 0.08, 1.6, M.wood, x, F, z, 10);
      mesh(root, G.sphere(0.65, 12, 10), toon('#2f6644'), x, F + 2.0, z).scale.set(1, 1.1, 1);
      mesh(root, G.sphere(0.45, 12, 10), toon('#3c7a52'), x + 0.3, F + 2.4, z + 0.2);
    }
    // bulletin board on the block wall next to the alley entrance (faces +z)
    const bb = new THREE.Group();
    bb.position.set(-5.7, F, 3.0);
    root.add(bb);
    for (const x of [-0.55, 0.55]) box(bb, 0.06, 1.65, 0.06, M.wood, x, 0, 0);
    box(bb, 1.3, 0.8, 0.06, M.wood, 0, 0.75, 0);
    plane(bb, 1.2, 0.72, toon('#ffffff', { map: T.bulletinTexture(), unique: true }), 0, 1.15, 0.032);
    const roof = box(bb, 1.45, 0.05, 0.3, toon('#4a5a72'), 0, 1.6, 0.06);
    roof.rotation.x = 0.25;
    const bl = mesh(bb, G.box(0.25, 0.03, 0.06), glowMat('#fff2d0', 2.2), 0, 1.57, 0.12);
    noOutline(bl);
    const bpl = new THREE.PointLight('#fff2d0', 0.9, 1.6, 2);
    bpl.position.set(0, 1.4, 0.45);
    bb.add(bpl);
    lights.push(bpl);
  }

  // ------------------------------------------------------------ guardrails on the corner
  const rail = (x0, z0, x1, z1) => {
    const len = Math.hypot(x1 - x0, z1 - z0);
    const n = Math.max(2, Math.round(len / 1.0) + 1);
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1);
      const x = x0 + (x1 - x0) * t, z = z0 + (z1 - z0) * t;
      cyl(root, 0.03, 0.8, M.rail, x, F, z, 10);
      mesh(root, G.cyl(0.035, 0.035, 0.05, 10), M.railStripe, x, F + 0.7, z);
    }
    rod(root, [x0, F + 0.78, z0], [x1, F + 0.78, z1], 0.03, M.rail);
    rod(root, [x0, F + 0.45, z0], [x1, F + 0.45, z1], 0.022, M.rail);
  };
  rail(-6.8, 3.75, -3.4, 3.75);
  rail(-0.5, 3.75, 2.4, 3.75);
  rail(3.85, -6.8, 3.85, -3.2);
  rail(3.85, -1.0, 3.85, 2.3);
  // corner bollards
  for (const [x, z] of [[3.85, 3.0], [3.3, 3.75]]) {
    cyl(root, 0.06, 0.75, toon('#f2c230'), x, F, z, 12);
    mesh(root, G.cyl(0.065, 0.065, 0.07, 12), M.black, x, F + 0.55, z);
  }
  // corner curved mirror
  {
    const x = -4.3, z = 3.1;
    cyl(root, 0.04, 2.6, toon('#ff7a2a'), x, F, z, 10);
    const mg = new THREE.Group();
    mg.position.set(x, F + 2.45, z);
    mg.rotation.y = Math.PI * 0.15;
    root.add(mg);
    mesh(mg, G.cyl(0.32, 0.32, 0.06, 24), toon('#ff7a2a'), 0, 0, 0.06, [Math.PI / 2, 0, 0]);
    const mr = mesh(mg, new THREE.SphereGeometry(0.3, 20, 12, 0, Math.PI * 2, 0, 0.5), toon('#bcd6ee', { emissive: '#6080b0', ei: 0.6 }), 0, 0, 0.09, [Math.PI / 2, 0, 0]);
    mr.layers.set(LAYER.NO_OUTLINE);
    mr.scale.set(1, 0.4, 1);
  }

  // ------------------------------------------------------------ street lights
  const streetLight = (x, z, ry) => {
    const g = new THREE.Group();
    g.position.set(x, F, z);
    g.rotation.y = ry;
    root.add(g);
    cyl(g, 0.06, 4.0, M.pole, 0, 0, 0, 12, 0.045);
    rod(g, [0, 4.0, 0], [0, 4.2, 0.25], 0.04, M.pole);
    rod(g, [0, 4.2, 0.25], [0, 4.22, 0.85], 0.035, M.pole);
    rbox(g, 0.18, 0.08, 0.5, toon('#6f757d'), 0, 4.15, 0.95, 0.03);
    const lens = mesh(g, G.box(0.14, 0.01, 0.42), glowMat('#dceaff', 3.2), 0, 4.145, 0.95);
    noOutline(lens);
    // light cone (volumetric haze)
    const coneG = new THREE.ConeGeometry(1.0, 4.0, 24, 1, true);
    coneG.translate(0, -2.0, 0);
    const cm = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
      uniforms: { uCol: { value: new THREE.Color('#9fc2ff') } },
      vertexShader: 'varying vec3 vP; varying vec3 vN; varying vec3 vV; void main(){ vP = position; vec4 w = modelMatrix*vec4(position,1.); vN = normalize(mat3(modelMatrix)*normal); vV = normalize(cameraPosition - w.xyz); gl_Position = projectionMatrix*viewMatrix*w; }',
      fragmentShader: 'uniform vec3 uCol; varying vec3 vP; varying vec3 vN; varying vec3 vV; void main(){ float t = clamp(-vP.y/4.0,0.,1.); float rim = pow(abs(dot(vN, vV)), 1.5); gl_FragColor = vec4(uCol, (1.0-t)*0.11*rim); }',
    });
    const cone = mesh(g, coneG, cm, 0, 4.13, 0.95);
    cone.layers.set(LAYER.FX);
    const pl = new THREE.PointLight('#bcd4ff', 6, 6.5, 1.4);
    pl.position.set(0, 3.9, 0.95);
    g.add(pl);
    lights.push(pl);
    return g;
  };
  streetLight(-4.8, 3.92, 0);
  streetLight(3.98, -4.5, Math.PI / 2);
  streetLight(6.55, 6.5, -Math.PI * 0.75);

  // ------------------------------------------------------------ utility poles & wires
  const poles = [];
  const utilityPole = (x, z, ry, extra) => {
    const g = new THREE.Group();
    g.position.set(x, F, z);
    g.rotation.y = ry;
    root.add(g);
    cyl(g, 0.11, 6.1, M.concrete, 0, 0, 0, 14, 0.085);
    // yellow-black guard sleeve
    for (let i = 0; i < 6; i++) mesh(g, G.cyl(0.117, 0.117, 0.16, 14), toon(i % 2 ? '#1c1c1c' : '#f2c230'), 0, 0.3 + i * 0.16, 0);
    // step bolts
    for (let i = 0; i < 9; i++) {
      const y = 2.0 + i * 0.4;
      rod(g, [0, y, 0], [(i % 2 ? 1 : -1) * 0.28, y, 0], 0.012, M.poleDark);
    }
    // cross arms
    const arms = [5.75, 5.3];
    for (const y of arms) {
      box(g, 1.4, 0.08, 0.08, M.poleDark, 0, y, 0);
      for (const ax of [-0.6, -0.2, 0.2, 0.6]) {
        mesh(g, G.cyl(0.035, 0.045, 0.1, 10), toon('#e8e2d6'), ax, y + 0.13, 0);
      }
    }
    // transformer
    if (extra) {
      cyl(g, 0.24, 0.62, toon('#8f969e'), 0, 4.2, 0.32, 16);
      mesh(g, G.cyl(0.26, 0.26, 0.05, 16), toon('#6f757d'), 0, 4.84, 0.32);
      box(g, 0.1, 0.4, 0.15, M.poleDark, 0, 4.3, 0.12);
    }
    // sign plate on pole
    const pg = plane(g, 0.18, 0.62, toon('#ffffff', { map: T.noboriTexture('星町２丁目', '#1f4fa6', '#ffffff'), unique: true }), 0, 2.4, 0.115);
    noOutline(pg);
    poles.push({ g, arms });
    return g;
  };
  utilityPole(-6.75, 3.65, 0, true);
  utilityPole(3.72, 3.62, Math.PI / 4, false);
  utilityPole(3.72, -6.7, Math.PI / 2, true);
  // poles on the far side for wires to cross the road
  utilityPole(6.75, 6.75, Math.PI / 4, false);

  root.updateMatrixWorld(true);
  const armPoint = (pi, arm, ax) => {
    const p = poles[pi];
    const v = new THREE.Vector3(ax, p.arms[arm] + 0.18, 0);
    return p.g.localToWorld(v);
  };
  const wireMat = new THREE.MeshBasicMaterial({ color: 0x14161c });
  const wire = (a, b, sag, r = 0.008) => {
    const mid = a.clone().add(b).multiplyScalar(0.5);
    mid.y -= sag;
    const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
    const m = new THREE.Mesh(new THREE.TubeGeometry(curve, 24, r, 4, false), wireMat);
    root.add(m);
    noOutline(m);
    return m;
  };
  const pairs = [[0, 1], [1, 2], [1, 3]];
  for (const [i, j] of pairs) {
    for (const arm of [0, 1]) for (const ax of [-0.6, 0.2, 0.6]) {
      const d = armPoint(i, arm, ax).distanceTo(armPoint(j, arm, ax));
      wire(armPoint(i, arm, ax), armPoint(j, arm, ax), d * 0.05 + arm * 0.05, 0.009);
    }
  }
  // service drops to the shop / neighbour
  wire(armPoint(1, 1, -0.2), new THREE.Vector3(2.55, 2.9, 0.6), 0.25, 0.007);
  wire(armPoint(0, 1, 0.2), new THREE.Vector3(-4.55, 3.4, 0.9), 0.2, 0.007);
  // wires leaving the diorama (cut at the edge, like a model)
  wire(armPoint(0, 0, -0.6), new THREE.Vector3(-7, 5.6, -0.5), 0.15, 0.009);
  wire(armPoint(2, 0, 0.6), new THREE.Vector3(3.9, 5.7, -7), 0.05, 0.009);
  wire(armPoint(3, 0, -0.6), new THREE.Vector3(7, 5.95, 3.0), 0.12, 0.009);
  wire(armPoint(3, 0, 0.6), new THREE.Vector3(3.0, 5.95, 7), 0.12, 0.009);

  // ------------------------------------------------------------ road signs
  {
    // stop sign + street name plate (corner)
    const x = 3.95, z = 3.3;
    rod(root, [x, F, z], [x, F + 2.4, z], 0.03, M.pole);
    const sg = new THREE.Group();
    sg.position.set(x, F + 2.25, z);
    sg.rotation.y = Math.PI * 0.25;
    root.add(sg);
    const st = plane(sg, 0.55, 0.55, toon('#ffffff', { map: T.stopSignTexture(), unique: true }), 0, 0, 0.04);
    st.material.transparent = true;
    st.material.alphaTest = 0.5;
    const sn = new THREE.Group();
    sn.position.set(x, F + 1.75, z);
    root.add(sn);
    const plate = plane(sn, 0.72, 0.22, toon('#ffffff', { map: T.streetPlateTexture('星町二丁目', 'Hoshimachi 2-chome'), glow: 0.2, unique: true }), 0, 0, 0.035);
    box(sn, 0.74, 0.24, 0.03, M.steel, 0, -0.12, 0.012);
    plate.name = 'streetPlate';
    // crossing sign on the other side
    rod(root, [6.6, F, 2.55], [6.6, F + 2.5, 2.55], 0.03, M.pole);
    plane(root, 0.5, 0.5, toon('#ffffff', { map: T.crossingSignTexture(), glow: 0.15, unique: true }), 6.6, F + 2.25, 2.58, -Math.PI / 2).rotation.y = -Math.PI / 2;
    box(root, 0.52, 0.52, 0.02, M.steel, 6.62, F + 2.0, 2.55).rotation.y = Math.PI / 2;
    // bus stop pole on far sidewalk
    const bx = -2.8, bz = 6.7;
    cyl(root, 0.18, 0.12, toon('#cfcfcf'), bx, F, bz, 14);
    rod(root, [bx, F, bz], [bx, F + 1.9, bz], 0.03, M.steel);
    const bs = mesh(root, G.cyl(0.25, 0.25, 0.02, 24), toon('#ffffff', { map: T.busStopTexture(), unique: true }), bx, F + 1.95, bz, [Math.PI / 2, 0, 0]);
    bs.rotation.set(Math.PI / 2, Math.PI, 0);
    const tt = box(root, 0.36, 0.5, 0.03, toon('#ffffff', { glow: 0.5 }), bx, F + 1.1, bz - 0.04);
    tt.name = 'timetable';
  }

  // ------------------------------------------------------------ traffic signals (the distant changing lights)
  const signals = [];
  const signal = (x, z, ry, armLen) => {
    const g = new THREE.Group();
    g.position.set(x, F, z);
    g.rotation.y = ry;
    root.add(g);
    cyl(g, 0.07, 4.6, M.pole, 0, 0, 0, 12);
    rod(g, [0, 4.4, 0], [armLen, 4.4, 0], 0.045, M.pole);
    const head = new THREE.Group();
    head.position.set(armLen - 0.3, 4.4, 0.04);
    g.add(head);
    rbox(head, 1.0, 0.32, 0.18, toon('#c7ccd2'), 0, -0.16, 0, 0.04);
    const cols = ['#22e6a0', '#ffb020', '#ff3b30'];
    const lamps = cols.map((c, i) => {
      const hood = mesh(head, new THREE.CylinderGeometry(0.12, 0.12, 0.12, 16, 1, true, -Math.PI / 2, Math.PI), toon('#9aa0a8', { side: THREE.DoubleSide }), -0.32 + i * 0.32, 0.08, 0.13, [Math.PI / 2, 0, 0]);
      hood.rotation.set(Math.PI / 2, 0, 0);
      const l = mesh(head, G.cyl(0.11, 0.11, 0.02, 18), glowMat('#222', 1), -0.32 + i * 0.32, 0, 0.1, [Math.PI / 2, 0, 0]);
      noOutline(l);
      l.userData.on = new THREE.Color(c).multiplyScalar(3.2);
      l.userData.off = new THREE.Color(c).multiplyScalar(0.12);
      return l;
    });
    // pedestrian signal on the pole
    const ph = new THREE.Group();
    ph.position.set(0.12, 2.5, 0);
    ph.rotation.y = -Math.PI / 2;
    g.add(ph);
    rbox(ph, 0.24, 0.48, 0.14, toon('#c7ccd2'), 0, 0, 0, 0.03);
    const pr = mesh(ph, G.plane(0.18, 0.18), glowMat('#ff3b30', 1), 0, 0.35, 0.072);
    const pg = mesh(ph, G.plane(0.18, 0.18), glowMat('#22e6a0', 1), 0, 0.12, 0.072);
    noOutline(pr); noOutline(pg);
    const pl = new THREE.PointLight('#ff3b30', 1.4, 3.5, 2);
    pl.position.set(armLen - 0.3, 4.1, 0.6);
    g.add(pl);
    signals.push({ lamps, pr, pg, pl });
    return g;
  };
  signal(6.65, 3.85, Math.PI, 1.9); // controls road A (cars heading -x)
  signal(4.2, 6.6, -Math.PI / 2, 1.9); // controls road B
  // phase cycle
  const cyc = [
    { a: 0, b: 2, d: 7 },
    { a: 1, b: 2, d: 2.5 },
    { a: 2, b: 2, d: 1.5 },
    { a: 2, b: 0, d: 7 },
    { a: 2, b: 1, d: 2.5 },
    { a: 2, b: 2, d: 1.5 },
  ];
  const total = cyc.reduce((s, c) => s + c.d, 0);
  const tmpC = new THREE.Color();
  updaters.push((dt, time) => {
    let t = (time + 3) % total;
    let ph = cyc[0];
    let rem = 0;
    for (const c of cyc) { if (t < c.d) { ph = c; rem = c.d - t; break; } t -= c.d; }
    signals.forEach((s, si) => {
      const st = si === 0 ? ph.a : ph.b;
      s.lamps.forEach((l, i) => l.material.color.copy(i === st ? l.userData.on : l.userData.off));
      s.pl.color.set(['#22e6a0', '#ffb020', '#ff3b30'][st]);
      // pedestrians cross the road controlled by the *other* signal: green when this one is red
      const walk = st === 2 && (si === 0 ? ph.b : ph.a) !== 2 ? false : st === 2;
      const blink = walk && rem < 2.5 && cyc.indexOf(ph) % 3 === 0 ? (Math.floor(time * 4) % 2) : 1;
      s.pg.material.color.copy(tmpC.set('#22e6a0').multiplyScalar(walk ? 2.6 * blink + 0.1 : 0.1));
      s.pr.material.color.copy(tmpC.set('#ff3b30').multiplyScalar(walk ? 0.1 : 2.6));
    });
  });

  // ------------------------------------------------------------ distant passing car lights (subtle, on the edge)
  return root;
}
