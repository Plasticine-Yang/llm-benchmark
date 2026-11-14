/* World part 2 — every street-corner prop sitting on the plinth */
'use strict';

function bar(a, b, r, color, mat) {
  const A = new THREE.Vector3(a[0], a[1], a[2]), B = new THREE.Vector3(b[0], b[1], b[2]);
  const dir = B.clone().sub(A), len = dir.length();
  const g = new THREE.CylinderGeometry(r, r, len, 7);
  const m = new THREE.Mesh(g, mat || faceMaterials(color, {}));
  m.position.copy(A).add(B).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  W.scene.add(m);
  return m;
}
function negXQuad(w, h, x, y, z, mat, opts) {
  return panel(w, h, x, y, z, [0, -Math.PI / 2, 0], mat, opts);
}

function buildProps() {
  W.anim.vendingGlows = [];
  W.anim.lampGlows = [];
  buildNeighbor();
  buildAlley();
  buildVending();
  buildUmbrellas();
  buildBins();
  buildBicycles();
  buildLamps();
  buildPolesAndWires();
  buildRoadSigns();
  buildGuardrails();
  buildParking();
  buildNoticeBoard();
  buildAC();
  buildPlants();
  buildSignals();
  buildSmallStuff();
  buildDripPoints();
}

/* ---------- neighbouring apartment across the alley ---------- */
function buildNeighbor() {
  const cx = -11.70, cz = -7.80;
  box(2.60, 7.20, 10.40, cx, 3.60, cz, 0x22304a);
  box(2.80, 0.28, 10.60, cx, 7.30, cz, 0x1e2a40, { fine: true });
  box(2.68, 0.10, 10.48, cx, 2.45, cz, 0x4a5a72, { fine: true, edge: false });
  box(2.68, 0.10, 10.48, cx, 4.85, cz, 0x4a5a72, { fine: true, edge: false });
  /* balconies facing the alley (+x) */
  for (const by of [2.52, 4.92]) {
    box(0.62, 0.09, 9.6, -10.10, by, cz, 0x60708a, { fine: true });
    for (let z = -12.4; z <= -3.2; z += 0.42) {
      box(0.05, 0.78, 0.05, -9.82, by + 0.45, z, 0x8c9aad, { edge: false });
    }
    box(0.05, 0.09, 9.6, -9.82, by + 0.86, cz, 0xa2b0c0, { edge: false });
    for (let i = 0; i < 4; i++) {
      const z = -11.6 + i * 2.4;
      box(0.34, 0.55, 0.62, -9.95, by + 0.38, z, 0x8fa2b6, { edge: false }); // laundry / AC boxes
    }
  }
  /* lit windows on the alley wall (+x) */
  const winTex = texWindowLit();
  for (const z of [-11.3, -9.4, -7.5, -5.6, -3.7]) {
    for (const y of [1.35, 3.75, 6.10]) {
      const lit = W.rand() > 0.35;
      sideQuad(0.78, 1.02, -10.38, y, z,
        lit ? texMat(winTex, 1, false) : solidMat(0x16233a, 1, false), { renderOrder: 2 });
      box(0.06, 1.12, 0.92, -10.36, y, z, 0x465872, { edge: false });
      if (lit) glow(-10.20, y, z, 1.5, 1.8, 0xffce83, 0.11);
    }
  }
  /* front facade windows (+z) */
  for (const x of [-12.35, -11.05]) {
    for (const y of [1.35, 3.75, 6.10]) {
      const lit = W.rand() > 0.5;
      frontQuad(0.82, 1.02, x, y, -2.58,
        lit ? texMat(winTex, 1, false) : solidMat(0x16233a, 1, false), { renderOrder: 2 });
      if (lit) glow(x, y, -2.35, 1.4, 1.7, 0xffce83, 0.10);
    }
  }
  /* ground floor shop front + awning */
  box(1.9, 2.05, 0.10, -11.7, 1.03, -2.52, 0x3a4a62, { fine: true });
  frontQuad(1.6, 1.4, -11.7, 0.95, -2.45, solidMat(0x1b2b42, 1, false), { renderOrder: 2 });
  frontQuad(1.2, 0.32, -11.7, 2.25, -2.43, texMat(texLabel('雨宮荘', '', '#e9dcc0', '#3c4a60', 320, 96), 1, false), { renderOrder: 2 });
  box(2.2, 0.10, 0.72, -11.7, 2.52, -2.18, 0x9c6d63, { fine: true });
  box(0.06, 0.5, 0.06, -12.7, 2.27, -1.85, 0x8b98a6, { edge: false });
  box(0.06, 0.5, 0.06, -10.7, 2.27, -1.85, 0x8b98a6, { edge: false });
  /* poster board on the front wall */
  box(1.35, 1.05, 0.08, -12.72, 1.15, -2.48, 0x8a7052, { fine: true });
  frontQuad(1.20, 0.90, -12.72, 1.15, -2.42, texMat(texPoster('町内会', '秋の夜まつり', '#e8c86a', 'お知らせ'), 1, false), { renderOrder: 2 });
  /* roof details */
  box(0.9, 0.7, 0.9, -12.2, 7.80, -10.8, 0x556579, { fine: true });
  cylinder(0.04, 0.04, 1.5, -11.2, 8.05, -11.5, 0x8090a3, { seg: 5, edge: false });
  bar([-11.2, 8.8, -11.5], [-10.3, 8.8, -11.5], 0.02, 0x8090a3);
  /* vertical drain pipe on alley wall */
  for (const z of [-4.0, -11.9]) cylinder(0.055, 0.055, 6.9, -10.34, 3.5, z, 0x718197, { seg: 7, edge: false });
  /* small lamp over the alley wall */
  negXQuad(0.34, 0.30, -10.32, 2.85, -3.1, solidMat(0xffd69a, 1, false), { renderOrder: 2 });
  W.anim.lampGlows.push(glow(-10.10, 2.85, -3.1, 1.9, 1.7, 0xffc078, 0.30));
  pool(-9.7, -3.1, 1.0, 1.6, 0xffbe78, 0.18, 0.020);
}

/* ---------- narrow alley ---------- */
function buildAlley() {
  /* wet alley floor already darker; add grates, crates, pipes */
  for (let z = -9.8; z < -2.6; z += 0.55) floorQuad(1.6, 0.18, -9.5, z, 0.016, solidMat(0x101b2d, 0.8, false), { renderOrder: 1 });
  box(0.16, 0.10, 7.1, -9.5, 0.02, -6.2, 0x2d3a4e, { edge: false });
  /* vending machine at the end of the alley, warm amber */
  box(1.30, 1.95, 0.72, -9.45, 1.14, -9.55, 0x9a4f3c, { fine: true });
  frontQuad(1.18, 1.78, -9.45, 1.14, -9.16, texMat(texVending('あたたかい', '#a8543a', true), 1, false), { renderOrder: 2 });
  const g = glow(-9.45, 1.2, -9.0, 2.6, 3.0, 0xffb066, 0.30);
  W.anim.vendingGlows.push(g);
  pool(-9.45, -8.5, 1.5, 2.4, 0xffa860, 0.22, 0.019);
  shadow(-9.45, -9.3, 1.7, 1.2, 0.35, 0.018);
  /* stacked crates + delivery boxes */
  for (let i = 0; i < 3; i++) {
    box(0.52, 0.38, 0.52, -9.85, 0.19 + i * 0.38, -4.7, i % 2 ? 0x7c8a72 : 0x9a8a68, { fine: true });
    box(0.54, 0.05, 0.10, -9.85, 0.19 + i * 0.38, -4.42, 0x4c5a48, { edge: false });
  }
  box(0.62, 0.48, 0.55, -9.85, 0.24, -3.75, 0x6c7f8c, { fine: true });
  /* "no bicycle parking" sign on the alley wall */
  negXQuad(0.72, 0.52, -10.31, 1.95, -5.3, texMat(texLabel('駐輪禁止', 'NO BICYCLES', '#f7f2e4', '#b3453c', 320, 220), 1, false), { renderOrder: 2 });
  /* wall pipes */
  for (let i = 0; i < 3; i++) cylinder(0.045, 0.045, 4.4, -10.30, 2.4, -8.6 + i * 0.16, 0x6d7d90, { seg: 6, edge: false });
  box(0.10, 0.10, 1.1, -10.25, 4.55, -8.2, 0x6d7d90, { edge: false });
  /* a narrow wall lamp deeper in the alley */
  negXQuad(0.26, 0.22, -10.30, 3.5, -8.0, solidMat(0xffe3ae, 1, false), { renderOrder: 2 });
  W.anim.lampGlows.push(glow(-10.05, 3.5, -8.0, 1.7, 1.5, 0xffd08a, 0.26));
  /* poster peeling on the alley wall */
  negXQuad(0.62, 0.88, -10.30, 1.30, -6.6, texMat(texPoster('ライブ', '雨宮ホール', '#c9a0d8', 'LIVE'), 1, false), { renderOrder: 2 });
}

/* ---------- vending machines ---------- */
function buildVending() {
  const specs = [
    { x: 2.78, z: -9.55, brand: 'MIRAI DRINKS', col: '#16607f', warm: false },
    { x: 2.78, z: -8.25, brand: 'あたたかい', col: '#a8543a', warm: true }
  ];
  for (const s of specs) {
    box(0.78, 1.98, 1.18, s.x, 1.15, s.z, 0xdfe7ec, { fine: true });
    box(0.06, 1.80, 1.06, s.x + 0.41, 1.16, s.z, s.warm ? 0x8a4b38 : 0x155b78, { edge: false });
    sideQuad(1.10, 1.82, s.x + 0.45, 1.16, s.z, texMat(texVending(s.brand, s.col, s.warm), 1, false), { renderOrder: 2 });
    box(0.10, 0.10, 0.28, s.x + 0.48, 0.55, s.z + 0.3, 0x394957, { edge: false });
    const gl = glow(s.x + 0.65, 1.25, s.z, 2.3, 3.1, s.warm ? 0xffab64 : 0x69d2ee, 0.46);
    W.anim.vendingGlows.push(gl);
    pool(s.x + 1.0, s.z, 1.3, 1.8, s.warm ? 0xffaa62 : 0x62c8ea, 0.24, 0.172);
    shadow(s.x, s.z, 1.2, 1.6, 0.36, 0.168);
  }
  /* a third machine on the far block, facing the side street */
  box(0.78, 1.90, 1.10, 9.62, 1.10, 1.9, 0xd8e4ea, { fine: true });
  negXQuad(1.02, 1.74, 9.20, 1.10, 1.9, texMat(texVending('COLD DRINKS', '#16607f', false), 1, false), { renderOrder: 2 });
  W.anim.vendingGlows.push(glow(9.0, 1.2, 1.9, 1.8, 2.6, 0x6cd0ec, 0.26));
  pool(8.5, 1.9, 1.2, 1.8, 0x5fc4e4, 0.18, 0.019);
}

/* ---------- umbrella stand, umbrellas ---------- */
function buildUmbrellas() {
  const sx = -6.85, sz = -1.90;
  /* metal stand */
  for (const dx of [-0.42, 0.42]) for (const dz of [-0.20, 0.20])
    box(0.045, 0.82, 0.045, sx + dx, 0.57, sz + dz, 0x93a3b2, { edge: false });
  box(0.92, 0.05, 0.46, sx, 0.99, sz, 0x9cabb9, { fine: true });
  box(0.92, 0.05, 0.46, sx, 0.20, sz, 0x8595a5, { fine: true });
  for (let i = 0; i < 4; i++) box(0.80, 0.035, 0.035, sx, 0.99, sz - 0.15 + i * 0.10, 0xaebdca, { edge: false });
  const cols = [0xe0655c, 0x3f5f8e, 0xf0c058, 0x8ec7d8, 0xd48cb0];
  for (let i = 0; i < 5; i++) {
    const x = sx - 0.34 + i * 0.17, z = sz - 0.08 + (i % 2) * 0.16;
    cylinder(0.045, 0.055, 1.05, x, 0.72, z, cols[i], { seg: 7, edge: false, rot: [W.rr(-0.08, 0.08), 0, W.rr(-0.08, 0.08)] });
    cylinder(0.008, 0.008, 0.16, x, 1.32, z, 0x8a99a8, { seg: 5, edge: false });
    cylinder(0.012, 0.012, 0.12, x + 0.045, 1.40, z, 0x5b4a3a, { seg: 5, edge: false, rot: [0, 0, Math.PI / 2] });
  }
  shadow(sx, sz, 1.3, 0.9, 0.32, 0.168);

  /* one open transparent vinyl umbrella, leaning by the wall */
  const ox = -8.15, oz = -1.55;
  const canopy = new THREE.Mesh(
    new THREE.ConeGeometry(0.78, 0.34, 10, 1, false),
    new THREE.MeshBasicMaterial({ color: 0xb7e2ef, transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false })
  );
  canopy.position.set(ox, 1.55, oz);
  canopy.rotation.z = 0.30; canopy.rotation.x = -0.14;
  W.scene.add(canopy);
  outlineChild(canopy, canopy.geometry, 0x2a4358, 0.55);
  for (let i = 0; i < 10; i++) {
    const a = i / 10 * Math.PI * 2;
    bar([ox, 1.53, oz], [ox + Math.cos(a) * 0.76, 1.39, oz + Math.sin(a) * 0.76], 0.008, 0x6d95a8);
  }
  bar([ox, 1.50, oz], [ox - 0.22, 0.18, oz + 0.08], 0.018, 0xa9b9c4);
  cylinder(0.02, 0.02, 0.12, ox - 0.22, 0.16, oz + 0.08, 0x4b5a68, { seg: 6, edge: false, rot: [Math.PI / 2, 0, 0] });
}

/* ---------- bins / post box ---------- */
function buildBins() {
  function bin(x, z, text, col) {
    box(0.62, 0.82, 0.56, x, 0.57, z, col, { fine: true });
    box(0.66, 0.09, 0.60, x, 1.01, z, 0x3e4c5e, { fine: true });
    frontQuad(0.50, 0.34, x, 0.66, z + 0.29, texMat(texLabel(text, '', '#f4f0e2', '#3b4a5e', 320, 150), 1, false), { renderOrder: 2 });
    box(0.30, 0.04, 0.03, x, 0.93, z + 0.30, 0x222d3c, { edge: false });
    shadow(x, z, 0.9, 0.8, 0.34, 0.168);
  }
  bin(-5.95, -1.90, '燃やすごみ', 0x5c8d7a);
  bin(-5.20, -1.90, 'びん・かん', 0x5a7996);
  bin(4.02, 0.05, 'ごみ箱', 0x6c8079);
  /* classic red Japanese post box */
  cylinder(0.30, 0.32, 0.90, 1.95, 0.61, 0.22, 0xcf4a3f, { seg: 12, fine: true });
  cylinder(0.36, 0.30, 0.16, 1.95, 1.11, 0.22, 0xd85a4a, { seg: 12, fine: true });
  box(0.34, 0.09, 0.04, 1.95, 0.92, 0.53, 0x2b3542, { edge: false });
  frontQuad(0.36, 0.22, 1.95, 0.55, 0.53, texMat(texLabel('〒', '', '#f7ead4', '#b23c32', 160, 100), 1, false), { renderOrder: 2 });
  shadow(1.95, 0.22, 0.9, 0.9, 0.34, 0.168);
}

/* ---------- bicycles ---------- */
function buildBicycle(cx, cz, scale, lean, color) {
  const s = scale || 1, y0 = 0.16;
  const wheelZ = [cz - 0.55 * s, cz + 0.55 * s], wy = y0 + 0.36 * s;
  const wheelMat = faceMaterials(0x2b3746, {});
  for (const z of wheelZ) {
    const t = new THREE.Mesh(new THREE.TorusGeometry(0.36 * s, 0.038 * s, 6, 18), wheelMat);
    t.position.set(cx, wy, z); t.rotation.y = Math.PI / 2;
    W.scene.add(t);
    outlineChild(t, t.geometry, 0x121c2c, 0.7);
    for (let i = 0; i < 8; i++) {
      const a = i / 8 * Math.PI;
      bar([cx, wy, z], [cx, wy + Math.sin(a) * 0.34 * s, z + Math.cos(a) * 0.34 * s], 0.006 * s, 0xa7b6c2);
    }
    cylinder(0.05 * s, 0.05 * s, 0.09 * s, cx, wy, z, 0xa8b6c2, { seg: 7, edge: false, rot: [Math.PI / 2, 0, 0] });
  }
  const frame = color || 0x4f8fa8;
  const A = [cx, wy, wheelZ[0]], B = [cx, wy, wheelZ[1]];
  const seat = [cx, y0 + 0.92 * s, cz - 0.12 * s];
  const head = [cx, y0 + 0.94 * s, cz + 0.42 * s];
  const crank = [cx, y0 + 0.42 * s, cz + 0.04 * s];
  bar(A, seat, 0.025 * s, frame); bar(seat, crank, 0.025 * s, frame);
  bar(crank, head, 0.025 * s, frame); bar(head, B, 0.025 * s, frame);
  bar(A, crank, 0.022 * s, frame); bar(seat, head, 0.022 * s, frame);
  /* saddle + handlebar */
  box(0.16 * s, 0.06 * s, 0.32 * s, cx, y0 + 0.96 * s, cz - 0.14 * s, 0x33404f, { fine: true, edge: false });
  bar([cx - 0.26 * s, y0 + 1.02 * s, cz + 0.44 * s], [cx + 0.26 * s, y0 + 1.02 * s, cz + 0.44 * s], 0.022 * s, 0x9aa8b4);
  bar([cx - 0.26 * s, y0 + 1.02 * s, cz + 0.44 * s], [cx - 0.26 * s, y0 + 1.02 * s, cz + 0.36 * s], 0.02 * s, 0x2d3946);
  bar([cx + 0.26 * s, y0 + 1.02 * s, cz + 0.44 * s], [cx + 0.26 * s, y0 + 1.02 * s, cz + 0.36 * s], 0.02 * s, 0x2d3946);
  /* front basket */
  box(0.46 * s, 0.26 * s, 0.32 * s, cx, y0 + 0.98 * s, cz + 0.66 * s, 0x9aa7b1, { fine: true });
  for (let i = 0; i < 4; i++) box(0.02, 0.24 * s, 0.32 * s, cx - 0.18 * s + i * 0.12 * s, y0 + 0.98 * s, cz + 0.82 * s, 0xbfcbd2, { edge: false });
  box(0.42 * s, 0.05 * s, 0.28 * s, cx, y0 + 1.12 * s, cz + 0.66 * s, 0xa9d8e6, { edge: false }); // rain cover
  /* fenders + rear light + kickstand */
  bar([cx, wy + 0.40 * s, cz - 0.20 * s], [cx, wy + 0.30 * s, cz - 0.72 * s], 0.018 * s, 0xa7b6c2);
  box(0.10 * s, 0.08 * s, 0.05 * s, cx, y0 + 0.74 * s, cz - 0.72 * s, 0xe8614f, { edge: false });
  bar([cx, y0 + 0.42 * s, cz - 0.02 * s], [cx + 0.16 * s, y0 + 0.02, cz - 0.16 * s], 0.015 * s, 0x7c8b98);
  if (lean) for (const m of []) { /* no-op */ }
  shadow(cx, cz, 1.1 * s, 1.9 * s, 0.32, 0.168);
}
function buildBicycles() {
  buildBicycle(3.62, -3.55, 1.0, false, 0x4f8fa8);
  buildBicycle(-9.28, -7.10, 0.82, true, 0xb2766a);
}

/* ---------- street lamps ---------- */
function buildLamp(x, z, h, armDir, tintColor) {
  cylinder(0.15, 0.19, 0.30, x, 0.15, z, 0x4a586b, { seg: 10, fine: true });
  cylinder(0.075, 0.11, h, x, h / 2, z, 0x637385, { seg: 10, fine: true });
  const hx = x + armDir[0] * 1.35, hz = z + armDir[1] * 1.35;
  tube([[x, h - 0.10, z], [x + armDir[0] * 0.55, h + 0.16, z + armDir[1] * 0.55], [hx, h - 0.02, hz]], 0.045, 0x637385);
  box(0.78, 0.14, 0.40, hx, h - 0.10, hz, 0x8c9aa8, { fine: true });
  box(0.66, 0.05, 0.32, hx, h - 0.19, hz, 0xfff2cf, { edge: false, shade: false });
  const g = glow(hx, h - 0.30, hz, 3.4, 2.8, tintColor || 0xffd79a, 0.55);
  W.anim.lampGlows.push(g);
  glow(hx, h - 0.34, hz, 6.0, 4.8, tintColor || 0xffd79a, 0.20);
  pool(hx, hz, 2.2, 2.9, tintColor || 0xffd79a, 0.40, 0.033);
  W.anim.reflect.push(pool(hx, hz - 0.9, 1.2, 5.0, tintColor || 0xffd79a, 0.30, 0.034));
  shadow(x, z, 0.9, 0.9, 0.30, 0.020);
}
function buildLamps() {
  buildLamp(-1.30, 5.55, 6.30, [0, -1], 0xffd79a);
  buildLamp(11.60, -10.30, 4.60, [-1, 0], 0xbfe0f5);
  buildLamp(-10.20, 5.70, 5.10, [0, -1], 0xbfe0f5);
  /* small wall lamps on the store front */
  for (const x of [-7.7, 1.5]) {
    box(0.22, 0.28, 0.10, x, 3.20, SZ1 + 0.10, 0xffe9bd, { shade: false, edge: false });
    W.anim.lampGlows.push(glow(x, 3.1, SZ1 + 0.30, 1.5, 1.5, 0xffd9a0, 0.26));
  }
}

/* ---------- utility poles and sagging wires ---------- */
function pole(x, z, h) {
  cylinder(0.17, 0.21, 0.34, x, 0.17, z, 0x4c5a6d, { seg: 10, fine: true });
  cylinder(0.11, 0.15, h, x, h / 2, z, 0x5d6d80, { seg: 10, fine: true });
  for (const yy of [h - 1.0, h - 1.7]) {
    box(0.13, 0.10, 1.85, x, yy, z, 0x6a7a8c, { fine: true });
    for (const dz of [-0.78, -0.26, 0.26, 0.78]) {
      cylinder(0.065, 0.05, 0.18, x, yy + 0.14, z + dz, 0xc9d7e0, { seg: 8, edge: false });
    }
  }
  box(0.42, 0.62, 0.38, x + 0.28, h - 2.45, z, 0x6e7f90, { fine: true });
  cylinder(0.03, 0.03, 2.5, x - 0.16, 1.25, z, 0x8798a8, { seg: 6, edge: false });
  shadow(x, z, 0.9, 0.9, 0.28, 0.018);
}
function wire(a, b, sag, radius, color) {
  const pts = [];
  for (let i = 0; i <= 8; i++) {
    const t = i / 8;
    pts.push([
      a[0] + (b[0] - a[0]) * t,
      a[1] + (b[1] - a[1]) * t - Math.sin(Math.PI * t) * sag,
      a[2] + (b[2] - a[2]) * t
    ]);
  }
  tube(pts, radius || 0.013, color || 0x34465e);
}
function buildPolesAndWires() {
  pole(9.65, 0.90, 8.40);
  pole(-12.05, 4.70, 7.55);
  pole(9.65, -11.00, 7.60);
  /* long crossing wires */
  for (let i = 0; i < 2; i++) {
    const dy = i * 0.30;
    wire([9.65 - i * 0.10, 7.70 - dy, 0.90 + (i - 0.5) * 0.36], [-12.05, 7.10 - dy, 4.70 + (i - 0.5) * 0.36], 0.82 + i * 0.16, 0.013);
    wire([9.65 + i * 0.08, 7.40 - dy, 0.90], [9.65, 6.65 - dy, -11.00], 0.62 + i * 0.10, 0.012);
  }
  wire([9.65, 6.40, -11.00], [2.30, 5.85, -10.25], 0.45, 0.011); // service drop to store roof
  wire([-12.05, 6.75, 4.70], [-10.40, 7.10, -9.90], 0.72, 0.012);
  /* town-name plate + direction sign on the main pole */
  frontQuad(1.95, 0.58, 9.65, 4.98, 1.06, texMat(texDirection(), 1, false), { renderOrder: 2 });
  frontQuad(0.46, 0.92, 9.65, 3.80, 1.08, texMat(texLabel('雨宮町', '二丁目', '#eef3f4', '#2c4d66', 200, 400), 1, false), { renderOrder: 2 });
  box(0.10, 0.10, 0.12, 9.65, 5.30, 1.00, 0x8b9aaa, { edge: false });
  /* warning stripe on pole base */
  for (let i = 0; i < 3; i++) box(0.235, 0.09, 0.235, 9.65, 0.35 + i * 0.22, 0.90, i % 2 ? 0xe8c35e : 0x303b4c, { edge: false });
}

/* ---------- road signs ---------- */
function buildRoadSigns() {
  /* STOP sign */
  cylinder(0.05, 0.06, 2.15, 9.35, 1.08, 2.60, 0x8c9aa8, { seg: 8, fine: true });
  frontQuad(0.88, 0.82, 9.35, 2.20, 2.60, texMat(texStop(), 1, false), { renderOrder: 2 });
  /* speed / no parking round sign */
  const speed = makeTexture(256, 256, (c, w, h) => {
    c.fillStyle = '#f7f4e9'; c.beginPath(); c.arc(128, 128, 118, 0, Math.PI * 2); c.fill();
    c.strokeStyle = '#d1493f'; c.lineWidth = 22; c.beginPath(); c.arc(128, 128, 106, 0, Math.PI * 2); c.stroke();
    fitText(c, '20', 128, 132, 180, 116, 900, '#2b3548');
  });
  frontQuad(0.62, 0.62, 9.35, 3.05, 2.60, texMat(speed, 1, false), { renderOrder: 2 });
  /* small direction plate near the corner */
  cylinder(0.045, 0.05, 2.0, 4.95, 1.0, 5.72, 0x8c9aa8, { seg: 8, edge: false });
  frontQuad(1.15, 0.36, 4.95, 2.05, 5.72, texMat(texLabel('← 駅前通り   商店街 →', '', '#1c5f8e', '#f3f8ff', 512, 160), 1, false), { renderOrder: 2 });
  /* parking P sign */
  cylinder(0.05, 0.05, 2.30, 9.75, 1.15, -8.60, 0x8c9aa8, { seg: 8, fine: true });
  frontQuad(0.72, 0.72, 9.75, 2.35, -8.60, texMat(texP(), 1, false), { renderOrder: 2 });
}

/* ---------- guardrails + bollards ---------- */
function guardSegment(x1, z1, x2, z2, n) {
  for (let i = 0; i <= n; i++) {
    const t = i / n, x = x1 + (x2 - x1) * t, z = z1 + (z2 - z1) * t;
    box(0.10, 0.92, 0.10, x, 0.59, z, 0xc4d0d8, { fine: true });
    box(0.14, 0.08, 0.14, x, 1.07, z, 0xe0e8ec, { edge: false });
  }
  const len = Math.hypot(x2 - x1, z2 - z1);
  const ang = Math.atan2(x2 - x1, z2 - z1);
  for (const yy of [0.72, 1.00]) {
    const m = box(0.075, 0.075, len, (x1 + x2) / 2, yy, (z1 + z2) / 2, 0xd3dee5, { fine: true, rot: [0, ang, 0] });
  }
}
function buildGuardrails() {
  guardSegment(9.70, 6.55, 12.70, 6.55, 4);
  guardSegment(9.35, 6.75, 9.35, 10.60, 5);
  guardSegment(-12.60, 6.55, -8.20, 6.55, 5);
  /* yellow corner bollards */
  for (const p of [[4.95, 0.30], [4.35, 0.98], [3.62, 1.18], [2.95, 1.18]]) {
    cylinder(0.075, 0.09, 0.72, p[0], 0.50, p[1], 0xd9e1e6, { seg: 9, fine: true });
    cylinder(0.082, 0.082, 0.11, p[0], 0.68, p[1], 0xf0c654, { seg: 9, edge: false });
    shadow(p[0], p[1], 0.4, 0.4, 0.28, 0.168);
  }
  /* a couple of orange traffic cones */
  for (const p of [[10.05, -2.15], [9.95, -8.85]]) {
    cylinder(0.04, 0.18, 0.52, p[0], 0.39, p[1], 0xe8733f, { seg: 9, fine: true });
    box(0.34, 0.05, 0.34, p[0], 0.16, p[1], 0x3a4552, { fine: true, edge: false });
    cylinder(0.105, 0.13, 0.09, p[0], 0.39, p[1], 0xf6f1e6, { seg: 9, edge: false });
  }
}

/* ---------- parking space + tiny kei car ---------- */
function buildParking() {
  const line = solidMat(0xdce9ef, 0.82, false);
  const y = 0.138;
  floorQuad(3.20, 0.075, 11.15, -8.25, y, line, { renderOrder: 1 });
  floorQuad(0.075, 5.65, 9.55, -5.45, y, line, { renderOrder: 1 });
  floorQuad(0.075, 5.65, 12.75, -5.45, y, line, { renderOrder: 1 });
  floorQuad(0.075, 2.85, 11.15, -6.95, y, line, { renderOrder: 1 });
  floorQuad(3.20, 0.075, 11.15, -2.65, y, line, { renderOrder: 1 });
  box(1.30, 0.14, 0.20, 11.15, 0.20, -8.05, 0xd8c98c, { fine: true, edge: false });

  /* kei car, facing the camera (+z) */
  const cx = 11.15, cz = -5.25;
  box(1.52, 0.62, 2.45, cx, 0.51, cz, 0xe9f0f2, { fine: true });
  box(1.36, 0.60, 1.35, cx, 1.10, cz - 0.18, 0xd6e3ea, { fine: true });
  box(1.40, 0.08, 1.40, cx, 1.43, cz - 0.18, 0xeef5f7, { fine: true, edge: false });
  /* windows */
  backQuad(1.16, 0.46, cx, 1.13, cz - 0.87, solidMat(0x3c5c72, 1, false), { renderOrder: 2 });
  frontQuad(1.16, 0.42, cx, 1.13, cz + 0.51, solidMat(0x46677e, 1, false), { renderOrder: 2 });
  sideQuad(1.15, 0.40, cx + 0.69, 1.13, cz - 0.18, solidMat(0x46677e, 1, false), { renderOrder: 2 });
  negXQuad(1.15, 0.40, cx - 0.69, 1.13, cz - 0.18, solidMat(0x46677e, 1, false), { renderOrder: 2 });
  /* wheels */
  for (const dx of [-0.76, 0.76]) for (const dz of [-0.80, 0.80]) {
    cylinder(0.27, 0.27, 0.14, cx + dx, 0.30, cz + dz, 0x2b3644, { seg: 12, fine: true, rot: [0, 0, Math.PI / 2] });
    cylinder(0.13, 0.13, 0.15, cx + dx * 1.03, 0.30, cz + dz, 0xaab8c2, { seg: 10, edge: false, rot: [0, 0, Math.PI / 2] });
  }
  /* lamps, grille, mirrors, plate */
  for (const dx of [-0.52, 0.52]) box(0.30, 0.14, 0.05, cx + dx, 0.60, cz + 1.24, 0xfff3cf, { edge: false });
  for (const dx of [-0.52, 0.52]) box(0.26, 0.12, 0.05, cx + dx, 0.60, cz - 1.24, 0xd85c52, { edge: false });
  box(0.66, 0.14, 0.05, cx, 0.42, cz + 1.25, 0x546472, { edge: false });
  box(0.42, 0.12, 0.05, cx, 0.30, cz + 1.26, texMat(texLabel('雨宮 300', '', '#f2f6e8', '#2d4a5e', 320, 90), 1, false), { edge: false, renderOrder: 2 });
  for (const dx of [-0.78, 0.78]) box(0.16, 0.10, 0.20, cx + dx, 1.02, cz + 0.35, 0xcdd9e0, { fine: true, edge: false });
  shadow(cx, cz, 2.0, 3.0, 0.42, 0.136);
  pool(cx + 0.3, cz + 1.6, 1.2, 1.8, 0x9fd8ee, 0.12, 0.140);
}

/* ---------- community notice board ---------- */
function buildNoticeBoard() {
  const x = 10.55, z = 3.45;
  for (const dx of [-0.78, 0.78]) box(0.09, 1.05, 0.09, x + dx, 0.60, z, 0x8b7a60, { fine: true });
  box(1.90, 1.28, 0.12, x, 1.55, z, 0xb5a079, { fine: true });
  box(2.05, 0.10, 0.34, x, 2.24, z, 0x4e6272, { fine: true });
  frontQuad(1.76, 1.14, x, 1.55, z + 0.07, solidMat(0xd9c79c, 1, false), { renderOrder: 2 });
  const notes = [
    ['町内会だより', '#f2efe2', '#3c5064'], ['秋まつり', '#f5c9a8', '#914c38'],
    ['迷い猫を探しています', '#e6f0e2', '#3d6b52'], ['資源ごみ', '#e3eef7', '#315f80'],
    ['夜間パトロール', '#f3e3e8', '#8a4a63'], ['掲示板', '#f6eecb', '#7a6532']
  ];
  for (let i = 0; i < 6; i++) {
    const px = x - 0.57 + (i % 3) * 0.57, py = 1.86 - Math.floor(i / 3) * 0.60;
    frontQuad(0.50, 0.52, px, py, z + 0.09, texMat(texLabel(notes[i][0], '', notes[i][1], notes[i][2], 200, 200), 1, false), { renderOrder: 3 });
  }
  shadow(x, z, 2.1, 0.7, 0.30, 0.136);
  glow(x, 1.6, z + 0.5, 2.6, 2.0, 0xffd9a0, 0.08);
}

/* ---------- AC outdoor units ---------- */
function acUnit(x, y, z, face) {
  const w = face === 'x' ? 0.34 : 0.90;
  const d = face === 'x' ? 0.90 : 0.34;
  box(w, 0.72, d, x, y, z, 0xb6c2c9, { fine: true });
  const fx = face === 'x' ? x - 0.18 : x;
  const fz = face === 'x' ? z : z + 0.18;
  const disc = cylinder(0.26, 0.26, 0.035, fx, y, fz, 0x5c6c7a, { seg: 16, edge: false, rot: face === 'x' ? [0, 0, Math.PI / 2] : [Math.PI / 2, 0, 0] });
  for (let i = 0; i < 4; i++) {
    const a = i * Math.PI / 4;
    if (face === 'x') bar([fx - 0.02, y, fz], [fx - 0.02, y + Math.sin(a) * 0.23, fz + Math.cos(a) * 0.23], 0.012, 0x8fa0ad);
    else bar([fx, y, fz + 0.02], [fx + Math.cos(a) * 0.23, y + Math.sin(a) * 0.23, fz + 0.02], 0.012, 0x8fa0ad);
  }
  for (let i = 0; i < 2; i++) cylinder(0.035, 0.035, 1.5, x + (face === 'x' ? 0 : 0.3 + i * 0.1), y + 0.55, z, 0x8d9ba7, { seg: 6, edge: false });
}
function buildAC() {
  acUnit(-8.82, 1.35, -5.30, 'x');
  acUnit(-8.82, 1.35, -7.35, 'x');
  acUnit(-8.82, 2.65, -6.30, 'x');
  /* brackets */
  for (const z of [-5.3, -7.35]) {
    box(0.42, 0.06, 0.06, -8.75, 0.95, z - 0.35, 0x71828f, { edge: false });
    box(0.42, 0.06, 0.06, -8.75, 0.95, z + 0.35, 0x71828f, { edge: false });
  }
}

/* ---------- planters and small street trees ---------- */
function shrub(x, z, y, s, color) {
  for (let i = 0; i < 5; i++) {
    const m = new THREE.Mesh(new THREE.IcosahedronGeometry(W.rr(0.20, 0.30) * s, 0),
      faceMaterials(i % 2 ? color : tint(color, 0.82), {}));
    m.position.set(x + W.rr(-0.20, 0.20) * s, y + W.rr(0.22, 0.46) * s, z + W.rr(-0.20, 0.20) * s);
    W.scene.add(m);
    outlineChild(m, m.geometry, 0x1d332c, 0.55);
  }
}
function buildPlants() {
  for (const p of [[-5.45, -1.78], [-2.42, -1.78]]) {
    cylinder(0.23, 0.17, 0.36, p[0], 0.34, p[1], 0xb4785c, { seg: 10, fine: true });
    cylinder(0.25, 0.25, 0.06, p[0], 0.53, p[1], 0xc98a68, { seg: 10, edge: false });
    shrub(p[0], p[1], 0.52, 0.85, 0x4e8a6b);
    shadow(p[0], p[1], 0.7, 0.7, 0.30, 0.168);
  }
  /* two small street trees framing the far corners */
  for (const p of [[-11.80, 9.10], [11.85, 9.10]]) {
    cylinder(0.13, 0.19, 1.65, p[0], 0.95, p[1], 0x5d5044, { seg: 8, fine: true });
    shrub(p[0], p[1], 1.55, 1.35, 0x47795f);
    shrub(p[0] + 0.2, p[1] - 0.2, 1.85, 1.0, 0x5a8f6c);
    box(1.25, 0.20, 1.25, p[0], 0.23, p[1], 0x6a7480, { fine: true });
    shadow(p[0], p[1], 1.5, 1.5, 0.30, 0.136);
  }
  /* scattered wet leaves on the asphalt */
  const leafCols = [0xc96a63, 0xd99656, 0xb07a72, 0x9c8b5a];
  for (let i = 0; i < 22; i++) {
    const x = W.rr(-11.5, 11.5), z = W.rr(-1.0, 5.8);
    if (x > 2.1 && x < 4.6 && z < 0.7) continue;
    flatQuad(0.13, 0.07, x, z, 0.036, solidMat(W.pick(leafCols), 0.72, false), W.rr(0, 3.14), 2);
  }
}

/* ---------- traffic signals ---------- */
function signal(x, z, h, scale) {
  const s = scale || 1;
  cylinder(0.06 * s, 0.08 * s, h, x, h / 2, z, 0x5b6a7c, { seg: 8, fine: true });
  bar([x, h - 0.15 * s, z], [x - 0.85 * s, h - 0.15 * s, z], 0.045 * s, 0x5b6a7c);
  const bx = x - 0.85 * s, by = h - 0.60 * s;
  box(0.30 * s, 0.92 * s, 0.28 * s, bx, by, z, 0x2b3949, { fine: true });
  const lamps = [], glows = [];
  for (let i = 0; i < 3; i++) {
    const ly = by + (1 - i) * 0.28 * s;
    const mat = new THREE.MeshBasicMaterial({ color: 0x33404c, side: THREE.DoubleSide });
    const c = new THREE.Mesh(new THREE.CircleGeometry(0.10 * s, 14), mat);
    c.position.set(bx, ly, z + 0.15 * s);
    W.scene.add(c);
    lamps.push(mat);
    const gl = glow(bx, ly, z + 0.28 * s, 0.55 * s, 0.55 * s, 0xff6655, 0.0);
    glows.push(gl);
    box(0.30 * s, 0.035 * s, 0.10 * s, bx, ly + 0.13 * s, z + 0.16 * s, 0x1b2735, { edge: false });
  }
  shadow(x, z, 0.7 * s, 0.7 * s, 0.28, 0.020);
  return { lamps, glows, x: bx, z: z };
}
function buildSignals() {
  const a = signal(9.05, 5.55, 3.45, 1.0);
  const b = signal(6.95, -12.10, 2.70, 0.72);
  W.anim.traffic = [a, b];
  W.anim.trafficPool = pool(8.0, 4.3, 0.7, 1.8, 0xd8584a, 0.14, 0.034);
  /* pedestrian signal near the front crossing */
  cylinder(0.05, 0.06, 2.10, 4.55, 1.05, 5.75, 0x5b6a7c, { seg: 8, edge: false });
  box(0.28, 0.36, 0.16, 4.55, 2.20, 5.75, 0x2b3949, { fine: true });
  frontQuad(0.20, 0.26, 4.55, 2.20, 5.84, solidMat(0x69dca2, 1, false), { renderOrder: 2 });
  glow(4.55, 2.20, 5.95, 0.7, 0.8, 0x69dca2, 0.22);
}

/* ---------- extra small touches ---------- */
function buildSmallStuff() {
  /* illuminated "OPEN" plaque by the door */
  frontQuad(0.52, 0.32, -3.95, 2.55, SZ1 + 0.12, texMat(texLabel('営業中', 'OPEN 24H', '#0d5064', '#f7f1de', 256, 150), 1, false), { renderOrder: 11 });
  W.anim.signGlows.push(glow(-3.95, 2.55, SZ1 + 0.28, 1.3, 0.9, 0x8be3d2, 0.24));
  /* door-side small hanging sign */
  box(0.05, 0.55, 0.05, -2.60, 2.90, SZ1 + 0.20, 0x8b98a6, { edge: false });
  frontQuad(0.46, 0.62, -2.42, 2.62, SZ1 + 0.22, texMat(texPoster('今週の', 'おすすめ', '#f29a7a', 'PICK UP'), 0.92, false), { renderOrder: 10 });
  /* fire hydrant marker */
  cylinder(0.10, 0.12, 0.62, 0.65, 0.47, 0.35, 0xd8b44e, { seg: 9, fine: true });
  box(0.24, 0.22, 0.05, 0.65, 0.78, 0.35, 0xd8513f, { edge: false });
  /* delivery boxes near the back service area */
  for (let i = 0; i < 3; i++) box(0.55, 0.42, 0.48, -6.4 + i * 0.62, 0.21 + (i === 2 ? 0.42 : 0), -11.6, 0x8d7e63, { fine: true });
  /* small back wall + fence behind the store */
  box(11.0, 0.85, 0.22, -3.2, 0.43, -12.75, 0x38465b, { fine: true });
  for (let i = 0; i < 14; i++) box(0.05, 0.55, 0.05, -8.5 + i * 0.82, 1.12, -12.75, 0x6b7a8c, { edge: false });
  /* bench on the opposite sidewalk */
  box(1.75, 0.09, 0.48, -3.2, 0.62, 8.0, 0x8a6f52, { fine: true });
  box(1.75, 0.44, 0.08, -3.2, 0.88, 7.80, 0x8a6f52, { fine: true });
  for (const dx of [-0.75, 0.75]) box(0.08, 0.60, 0.42, -3.2 + dx, 0.30, 8.0, 0x4d5866, { edge: false });
  shadow(-3.2, 8.0, 2.1, 0.8, 0.28, 0.136);
  /* a vending-ad poster on the far wall */
  frontQuad(0.85, 1.20, 12.85, 1.05, -1.0, texMat(texPoster('雨の町', '秋の夜の散歩', '#79b8cf', '案内'), 1, false), { renderOrder: 2 });

  /* small bus-stop shelter on the opposite sidewalk */
  const bx = -7.60, bz = 8.45;
  box(2.60, 0.13, 1.25, bx, 2.36, bz, 0x40566d, { fine: true });
  box(2.70, 0.06, 0.09, bx, 2.45, bz + 0.60, 0x8fa9ba, { fine: true, edge: false });
  for (const dx of [-1.20, 1.20]) for (const dz of [-0.52, 0.52])
    box(0.08, 2.20, 0.08, bx + dx, 1.23, bz + dz, 0x8b9fb0, { fine: true, edge: false });
  box(2.30, 1.10, 0.06, bx, 1.65, bz - 0.60, 0x7fa7bb, { fine: true, edge: false });
  box(1.90, 0.09, 0.42, bx, 0.62, bz - 0.18, 0x8a7052, { fine: true });
  for (const dx of [-0.82, 0.82]) box(0.08, 0.50, 0.40, bx + dx, 0.38, bz - 0.18, 0x4d5866, { edge: false });
  frontQuad(0.46, 0.68, bx + 0.86, 1.62, bz - 0.55, texMat(texLabel('バス', '雨宮町 →', '#f6f2e4', '#2f6b8c', 200, 300), 1, false), { renderOrder: 2 });
  cylinder(0.055, 0.055, 2.65, bx + 1.75, 1.33, bz + 0.70, 0x8b9fb0, { seg: 8, fine: true });
  frontQuad(0.52, 0.52, bx + 1.75, 2.75, bz + 0.70, texMat(texP(), 1, false), { renderOrder: 2 });
  W.anim.lampGlows.push(glow(bx, 2.05, bz + 0.4, 3.0, 2.0, 0xbfe4ff, 0.20));
  pool(bx, bz + 1.1, 2.6, 1.6, 0xa9d8f5, 0.18, 0.136);
}

/* ---------- eave drip spawn points ---------- */
function buildDripPoints() {
  for (let x = -9.1; x < 3.6; x += 0.52) W.anim.eave.push({ x, y: 3.83, z: -0.88, dir: 'front' });
  for (let z = -10.1; z < -2.5; z += 0.62) W.anim.eave.push({ x: 3.66, y: 3.83, z, dir: 'side' });
}
