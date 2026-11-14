import * as THREE from 'three';
import { L } from '../core/layout.js';
import { Batch, G, dmesh, mat } from '../core/gfx.js';
import { makeGlass } from '../fx/glass.js';

const ST = L.store;
const FLOOR = 0.18;
const CEIL = 3.05;
const T = 0.2;

export function buildStore(scene, TX) {
  const b = new Batch();
  const dyn = new THREE.Group();
  dyn.name = 'store-dynamic';
  scene.add(dyn);

  /* ------------------------------ walls ---------------------------- */
  // back + left
  b.box(ST.x1 - ST.x0, ST.h, T, 'wall', (ST.x0 + ST.x1) / 2, ST.h / 2, ST.z0 + T / 2, { outline: 0.001 });
  b.box(T, ST.h, ST.z1 - ST.z0, 'wallSide', ST.x0 + T / 2, ST.h / 2, (ST.z0 + ST.z1) / 2, { outline: 0.001 });

  // right wall with a side window (z -6.6 .. -4.6, y 0.9 .. 2.6)
  const rx = ST.x1 - T / 2;
  b.box(T, ST.h, 0.6, 'wallSide', rx, ST.h / 2, -6.9, { outline: 0.001 });
  b.box(T, ST.h, 5.2, 'wallSide', rx, ST.h / 2, -2.0, { outline: 0.001 });
  b.box(T, 0.9, 2.0, 'wallSide', rx, 0.45, -5.6, { outline: 0.0009 });
  b.box(T, ST.h - 2.6, 2.0, 'wallSide', rx, 2.6 + (ST.h - 2.6) / 2, -5.6, { outline: 0.0009 });
  // side window frame + glass
  b.box(0.14, 0.1, 2.1, 'trim', ST.x1 - 0.05, 0.92, -5.6, { outline: 0.0006 });
  b.box(0.14, 0.1, 2.1, 'trim', ST.x1 - 0.05, 2.58, -5.6, { outline: 0.0006 });
  b.box(0.14, 1.7, 0.09, 'trim', ST.x1 - 0.05, 1.75, -6.58, { outline: 0.0006 });
  b.box(0.14, 1.7, 0.09, 'trim', ST.x1 - 0.05, 1.75, -4.62, { outline: 0.0006 });
  const sideGlass = new THREE.Mesh(new THREE.PlaneGeometry(1.94, 1.62), makeGlass(1.94, 1.62, { opacity: 0.07 }));
  sideGlass.rotation.y = Math.PI / 2;
  sideGlass.position.set(ST.x1 - 0.06, 1.75, -5.6);
  sideGlass.renderOrder = 3;
  dyn.add(sideGlass);

  /* --------------------------- front facade ------------------------ */
  const fz = ST.z1 - T / 2;
  const W = ST.x1 - ST.x0;
  b.box(W, 0.30, T, 'wallDim', (ST.x0 + ST.x1) / 2, 0.15, fz, { outline: 0.0009 });
  b.box(W, 0.36, T, 'wall', (ST.x0 + ST.x1) / 2, 3.23, fz, { outline: 0.0009 });
  // sign backing + parapet
  b.box(W, 1.0, T + 0.04, 'wall', (ST.x0 + ST.x1) / 2, 3.90, fz, { outline: 0.001 });
  b.box(W, 0.55, T, 'wallDim', (ST.x0 + ST.x1) / 2, 4.675, fz, { outline: 0.001 });
  b.box(T, 0.55, ST.z1 - ST.z0, 'wallDim', ST.x0 + T / 2, 4.675, (ST.z0 + ST.z1) / 2, { outline: 0.001 });
  b.box(T, 0.55, ST.z1 - ST.z0, 'wallDim', ST.x1 - T / 2, 4.675, (ST.z0 + ST.z1) / 2, { outline: 0.001 });
  b.box(W, 0.55, T, 'wallDim', (ST.x0 + ST.x1) / 2, 4.675, ST.z0 + T / 2, { outline: 0.001 });
  // roof deck
  b.box(W - 0.1, 0.12, ST.z1 - ST.z0 - 0.1, 'roof', (ST.x0 + ST.x1) / 2, 4.46, (ST.z0 + ST.z1) / 2, { outline: 0.0008 });
  // roof membrane seams + drains
  for (let i = 0; i < 5; i++) {
    b.box(W - 0.24, 0.012, 0.07, 'roofSeam', (ST.x0 + ST.x1) / 2, 4.523, -6.3 + i * 1.6, { outline: 0 });
  }
  for (const [dx, dz] of [[-7.1, 0.15], [2.15, -6.7]]) {
    b.cyl(0.15, 0.15, 0.05, 12, 'metalDark', dx, 4.53, dz, { outline: 0.0004 });
    b.cyl(0.10, 0.10, 0.09, 10, 'metalDeep', dx, 4.57, dz, { outline: 0.0003 });
  }
  // access hatch + cable tray + dish
  b.rbox(0.92, 0.16, 0.92, 0.04, 'metalDark', -1.0, 4.60, -5.7, { outline: 0.0007 });
  b.box(0.30, 0.05, 0.06, 'metal', -1.0, 4.70, -5.7, { outline: 0.0003 });
  b.box(0.26, 0.09, 5.2, 'metalDark', 2.18, 4.57, -3.7, { outline: 0.0005 });
  b.strut([1.95, 4.52, -1.35], [1.95, 4.86, -1.35], 0.035, 'metalDark', { outline: 0.0004 });
  b.cyl(0.36, 0.32, 0.07, 16, 'white', 1.95, 4.92, -1.28, { rx: -0.95, outline: 0.0007 });
  b.strut([1.95, 4.90, -1.30], [1.95, 5.02, -1.02], 0.018, 'metalDark', { outline: 0.0003 });
  b.cyl(0.11, 0.11, 0.42, 10, 'metal', -4.1, 4.73, -1.1, { outline: 0.0006 });
  b.cyl(0.15, 0.13, 0.07, 10, 'metalDark', -4.1, 4.97, -1.1, { outline: 0.0004 });

  // sign faces
  const signFront = new THREE.Mesh(new THREE.PlaneGeometry(W - 0.06, 0.98), mat('signFace'));
  signFront.position.set((ST.x0 + ST.x1) / 2, 3.90, ST.z1 + 0.045);
  dyn.add(signFront);
  const signRight = new THREE.Mesh(new THREE.PlaneGeometry(ST.z1 - ST.z0 - 0.06, 0.98), mat('signSide'));
  signRight.rotation.y = Math.PI / 2;
  signRight.position.set(ST.x1 + 0.015, 3.90, (ST.z0 + ST.z1) / 2);
  dyn.add(signRight);
  // stripe band under the sign, wrapping the corner
  b.plane(W - 0.06, 0.16, 'bandStripe', (ST.x0 + ST.x1) / 2, 3.32, ST.z1 + 0.016, { uvScale: [10, 1] });
  b.plane(ST.z1 - ST.z0 - 0.06, 0.16, 'bandStripe', ST.x1 + 0.016, 3.32, (ST.z0 + ST.z1) / 2, { ry: Math.PI / 2, uvScale: [8, 1] });

  // mullions + rails
  const mull = [-7.6, -5.85, -4.1, -2.35, -0.45, 1.65, 2.6];
  for (const x of mull) {
    b.box(0.11, 2.75, 0.17, 'trim', x, 1.675, ST.z1 - 0.06, { outline: 0.0006 });
  }
  b.box(W, 0.12, 0.19, 'trim', (ST.x0 + ST.x1) / 2, 3.00, ST.z1 - 0.06, { outline: 0.0006 });
  b.box(W, 0.11, 0.19, 'trim', (ST.x0 + ST.x1) / 2, 0.33, ST.z1 - 0.06, { outline: 0.0006 });
  b.box(0.26, ST.h, 0.26, 'wall', ST.x1 - 0.13, ST.h / 2, ST.z1 - 0.13, { outline: 0.001 });

  // fixed glazing
  const spans = [[-7.6, -5.85], [-5.85, -4.1], [-4.1, -2.35], [-2.35, -0.45], [1.65, 2.6]];
  const panes = [];
  for (const [a, c] of spans) {
    const w = c - a - 0.12;
    const p = new THREE.Mesh(new THREE.PlaneGeometry(w, 2.58), makeGlass(w, 2.58));
    p.position.set((a + c) / 2, 1.68, ST.z1 - 0.045);
    p.renderOrder = 3;
    dyn.add(p);
    panes.push(p);
  }

  /* ------------------------- automatic doors ----------------------- */
  const dw = 1.0, dh = 2.70;
  const doorZ = ST.z1 + 0.055;
  b.box(2.5, 0.20, 0.26, 'trim', 0.6, 3.00, doorZ, { outline: 0.0007 });
  b.box(0.34, 0.10, 0.14, 'metalDark', 0.6, 2.86, doorZ + 0.12, { outline: 0.0005 });
  b.box(2.2, 0.03, 0.30, 'metalDark', 0.6, FLOOR + 0.005, doorZ, { outline: 0 });

  const makeDoorPanel = () => {
    const g = new THREE.Group();
    const frame = new Batch();
    frame.box(dw, 0.09, 0.07, 'trim', 0, dh / 2 - 0.045, 0, { outline: 0.0005 });
    frame.box(dw, 0.14, 0.07, 'trim', 0, -dh / 2 + 0.07, 0, { outline: 0.0005 });
    frame.box(0.07, dh, 0.07, 'trim', -dw / 2 + 0.035, 0, 0, { outline: 0.0005 });
    frame.box(0.07, dh, 0.07, 'trim', dw / 2 - 0.035, 0, 0, { outline: 0.0005 });
    frame.box(dw - 0.1, 0.05, 0.08, 'metal', 0, -0.30, 0.01, { outline: 0.0004 });
    frame.flush(g, 'doorframe');
    const gl = new THREE.Mesh(new THREE.PlaneGeometry(dw - 0.14, dh - 0.24), makeGlass(dw - 0.14, dh - 0.24, { opacity: 0.07 }));
    gl.renderOrder = 3;
    g.add(gl);
    // safety sticker strip
    const st = new THREE.Mesh(new THREE.PlaneGeometry(dw - 0.2, 0.10), mat('bandStripe'));
    st.position.set(0, 0.30, 0.045);
    g.add(st);
    return g;
  };
  const doorL = makeDoorPanel(), doorR = makeDoorPanel();
  doorL.position.set(L.door.x0 + dw / 2, FLOOR + dh / 2, doorZ);
  doorR.position.set(L.door.x1 - dw / 2, FLOOR + dh / 2, doorZ);
  dyn.add(doorL, doorR);
  const doorLX = doorL.position.x, doorRX = doorR.position.x;

  /* ------------------------------ canopy --------------------------- */
  const ay = L.awn.y, at = L.awn.t;
  b.box(W + 0.1, at, L.awn.front - ST.z1, 'wall', (ST.x0 + ST.x1) / 2, ay, (ST.z1 + L.awn.front) / 2, { outline: 0.0009 });
  b.box(W + 0.14, 0.10, 0.10, 'trim', (ST.x0 + ST.x1) / 2, ay - at / 2 - 0.03, L.awn.front - 0.03, { outline: 0.0006 });
  b.box(L.awn.side - ST.x1, at, ST.z1 - ST.z0, 'wall', (ST.x1 + L.awn.side) / 2, ay, (ST.z0 + ST.z1) / 2, { outline: 0.0009 });
  b.box(0.10, 0.10, ST.z1 - ST.z0, 'trim', L.awn.side - 0.03, ay - at / 2 - 0.03, (ST.z0 + ST.z1) / 2, { outline: 0.0006 });
  // sheet-metal cap on top of the canopy
  b.box(W + 0.06, 0.03, L.awn.front - ST.z1 - 0.05, 'metalDark', (ST.x0 + ST.x1) / 2, ay + at / 2 + 0.012, (ST.z1 + L.awn.front) / 2, { outline: 0 });
  b.box(L.awn.side - ST.x1 - 0.05, 0.03, ST.z1 - ST.z0 - 0.06, 'metalDark', (ST.x1 + L.awn.side) / 2, ay + at / 2 + 0.012, (ST.z0 + ST.z1) / 2, { outline: 0 });
  // striped valance wrapping the canopy edge
  b.plane(W + 0.1, at, 'bandStripe', (ST.x0 + ST.x1) / 2, ay, L.awn.front + 0.006, { uvScale: [16, 1] });
  b.plane(ST.z1 - ST.z0, at, 'bandStripe', L.awn.side + 0.006, ay, (ST.z0 + ST.z1) / 2, { ry: Math.PI / 2, uvScale: [12, 1] });
  // tension rods
  for (const x of [-6.4, -3.0, 0.6, 2.0]) {
    b.strut([x, ay + 0.9, ST.z1 + 0.02], [x, ay + 0.09, L.awn.front - 0.12], 0.022, 'metal', { outline: 0.0004 });
  }
  for (const z of [-6.0, -3.4, -0.9]) {
    b.strut([ST.x1 + 0.02, ay + 0.9, z], [L.awn.side - 0.12, ay + 0.09, z], 0.022, 'metal', { outline: 0.0004 });
  }
  // downlights under the canopy
  const dl = [];
  for (let i = 0; i < 6; i++) {
    const x = -6.9 + i * 1.85;
    b.cyl(0.13, 0.15, 0.06, 12, 'metalDark', x, ay - at / 2 - 0.03, 1.35, { outline: 0.0004 });
    const d = new THREE.Mesh(new THREE.CircleGeometry(0.12, 14), mat('lightPanel'));
    d.rotation.x = Math.PI / 2;
    d.position.set(x, ay - at / 2 - 0.065, 1.35);
    dyn.add(d); dl.push(d);
  }
  for (let i = 0; i < 4; i++) {
    const z = -6.4 + i * 1.9;
    b.cyl(0.12, 0.14, 0.06, 12, 'metalDark', 3.0, ay - at / 2 - 0.03, z, { outline: 0.0004 });
    const d = new THREE.Mesh(new THREE.CircleGeometry(0.11, 14), mat('lightPanel'));
    d.rotation.x = Math.PI / 2;
    d.position.set(3.0, ay - at / 2 - 0.065, z);
    dyn.add(d); dl.push(d);
  }

  /* ---------------------------- entrance --------------------------- */
  b.rbox(2.3, 0.035, 0.95, 0.02, 'rubber', 0.6, FLOOR + 0.018, 1.22, { outline: 0.0005 });
  b.rbox(2.1, 0.02, 0.75, 0.02, 'metalDeep', 0.6, FLOOR + 0.032, 1.22, { outline: 0 });
  b.plane(1.7, 0.16, 'bandStripe', 0.6, FLOOR + 0.045, 1.22, { rx: -Math.PI / 2, uvScale: [6, 1] });
  // small step
  b.box(2.4, 0.05, 0.22, 'walkEdge', 0.6, 0.155, 0.78, { outline: 0.0004 });

  // blade sign near the corner
  b.box(1.05, 0.56, 0.09, 'metalDark', 3.05, 2.95, 0.18, { outline: 0.0007 });
  const bladeA = new THREE.Mesh(new THREE.PlaneGeometry(0.98, 0.49), mat('signSmall'));
  bladeA.position.set(3.05, 2.95, 0.232);
  const bladeB = bladeA.clone(); bladeB.position.z = 0.128; bladeB.rotation.y = Math.PI;
  dyn.add(bladeA, bladeB);
  b.strut([2.62, 3.2, 0.18], [3.0, 3.2, 0.18], 0.03, 'metal', { outline: 0.0004 });

  /* ------------------------------ roof kit ------------------------- */
  const roofY = 4.52;
  const acUnit = (x, z, ry, key = 'metal') => {
    const g = new THREE.Group();
    const bb = new Batch();
    bb.rbox(1.15, 0.82, 0.58, 0.05, key, 0, 0.41, 0, { outline: 0.0008 });
    bb.box(1.05, 0.06, 0.5, 'metalDark', 0, 0.84, 0, { outline: 0.0005 });
    bb.box(0.12, 0.14, 0.12, 'metalDark', -0.45, 0.07, 0.2, { outline: 0.0004 });
    bb.box(0.12, 0.14, 0.12, 'metalDark', 0.45, 0.07, 0.2, { outline: 0.0004 });
    bb.box(0.30, 0.5, 0.04, 'metalDark', 0.40, 0.42, 0.30, { outline: 0.0004 });
    bb.flush(g, 'ac');
    const gr = new THREE.Mesh(new THREE.PlaneGeometry(0.66, 0.66), new THREE.MeshBasicMaterial({
      map: TX.grille, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    }));
    gr.position.set(-0.16, 0.44, 0.295);
    g.add(gr);
    const fan = new THREE.Group();
    for (let i = 0; i < 5; i++) {
      const bl = new THREE.Mesh(new THREE.PlaneGeometry(0.26, 0.10), mat('metalDark'));
      bl.position.set(Math.cos(i / 5 * 6.283) * 0.15, Math.sin(i / 5 * 6.283) * 0.15, 0);
      bl.rotation.z = i / 5 * 6.283 + 0.5;
      fan.add(bl);
    }
    fan.position.set(-0.16, 0.44, 0.27);
    g.add(fan);
    g.position.set(x, roofY, z);
    g.rotation.y = ry;
    dyn.add(g);
    return fan;
  };
  const fans = [];
  fans.push(acUnit(-5.2, -5.2, 0));
  fans.push(acUnit(-3.6, -5.2, 0));
  // wall-hung units
  const wallAC = (x, y, z, ry, wallX) => {
    const f = acUnit(x, z, ry);
    const g = f.parent;
    g.position.y = y;
    b.strut([wallX, y + 0.06, z - 0.35], [x, y + 0.06, z - 0.35], 0.03, 'metalDark', { outline: 0.0004 });
    b.strut([wallX, y + 0.06, z + 0.35], [x, y + 0.06, z + 0.35], 0.03, 'metalDark', { outline: 0.0004 });
    return f;
  };
  fans.push(wallAC(2.92, 2.28, -3.9, Math.PI / 2, ST.x1));
  fans.push(wallAC(-7.92, 2.30, -3.2, -Math.PI / 2, ST.x0));
  fans.push(wallAC(-7.92, 1.20, -5.4, -Math.PI / 2, ST.x0));

  // ducts, vent, tank, antenna
  b.rbox(1.1, 0.5, 1.5, 0.06, 'metal', 1.1, roofY + 0.25, -3.0, { outline: 0.0008 });
  b.cyl(0.2, 0.2, 0.75, 12, 'metal', 0.4, roofY + 0.38, -6.2, { outline: 0.0007 });
  b.cyl(0.3, 0.26, 0.14, 12, 'metalDark', 0.4, roofY + 0.80, -6.2, { outline: 0.0006 });
  b.cyl(0.55, 0.55, 0.95, 16, 'white', -6.6, roofY + 0.75, -2.0, { outline: 0.0008 });
  b.cyl(0.58, 0.58, 0.08, 16, 'metal', -6.6, roofY + 1.25, -2.0, { outline: 0.0006 });
  for (let i = 0; i < 4; i++) {
    const a = i / 4 * 6.283 + 0.78;
    b.box(0.08, 0.3, 0.08, 'metalDark', -6.6 + Math.cos(a) * 0.42, roofY + 0.15, -2.0 + Math.sin(a) * 0.42, { outline: 0.0004 });
  }
  b.strut([2.0, roofY, -6.6], [2.0, roofY + 1.5, -6.6], 0.035, 'metal', { outline: 0.0005 });
  for (let i = 0; i < 3; i++) {
    b.strut([1.65, roofY + 1.0 + i * 0.22, -6.6], [2.35, roofY + 1.0 + i * 0.22, -6.6], 0.018, 'metal', { outline: 0.0003 });
  }
  b.box(0.5, 0.1, 0.5, 'metalDark', -1.6, roofY + 0.05, -1.4, { outline: 0.0005 });

  /* --------------------- exterior wall fixtures -------------------- */
  // downpipes
  for (const [x, z] of [[ST.x0 + 0.06, ST.z1 - 0.06], [ST.x1 - 0.06, ST.z0 + 0.06], [ST.x0 + 0.06, ST.z0 + 0.06]]) {
    b.cyl(0.055, 0.055, 4.3, 8, 'metal', x, 2.15, z, { outline: 0.0005 });
    b.cyl(0.07, 0.07, 0.5, 8, 'metal', x, 0.25, z, { outline: 0.0004, rz: 0.3 });
  }
  // community bulletin board on the side wall
  b.box(0.08, 1.0, 1.35, 'wood', ST.x1 + 0.05, 1.95, -0.35, { outline: 0.0007 });
  b.plane(1.25, 0.92, 'bulletin', ST.x1 + 0.095, 1.95, -0.35, { ry: Math.PI / 2 });
  b.box(0.30, 0.05, 1.45, 'wood', ST.x1 + 0.16, 2.50, -0.35, { outline: 0.0005, rz: 0.0 });
  // wall posters near the entrance
  b.plane(0.52, 0.74, 'posterC', -0.95, 1.55, ST.z1 + 0.02, {});
  b.plane(0.52, 0.74, 'posterA', 2.15, 1.55, ST.z1 + 0.02, {});
  // window ad band (inside face of the glass)
  const adCols = ['posterA', 'posterB', 'posterC', 'posterD'];
  const adX = [-6.9, -5.1, -3.3, -1.5];
  adX.forEach((x, i) => {
    b.plane(0.62, 0.88, adCols[i], x, 2.15, ST.z1 - 0.10, {});
  });
  adX.forEach((x, i) => {
    b.plane(0.58, 0.34, adCols[(i + 2) % 4], x + 0.75, 0.72, ST.z1 - 0.10, {});
  });
  // hanging noren above the door (inside)
  b.plane(1.9, 0.42, 'noren', 0.6, 2.62, ST.z1 - 0.30, {});

  b.flush(scene, 'store-shell');

  /* ---------------------------- animation -------------------------- */
  const signMats = [mat('signFace'), mat('signSide')];
  const smallMats = [mat('signSmall')];
  let nextDoor = 6 + Math.random() * 6;
  let doorPhase = -1, doorT = 0;
  let flickT = 0, nextFlick = 5 + Math.random() * 7, flickDur = 0;
  const baseCol = new THREE.Color('#ffffff');

  function update(t, dt) {
    // door cycle
    if (doorPhase < 0 && t > nextDoor) { doorPhase = 0; doorT = 0; }
    let open = 0;
    if (doorPhase >= 0) {
      doorT += dt;
      const O = 0.85, HOLD = 3.4, C = 1.0;
      if (doorT < O) open = ease(doorT / O);
      else if (doorT < O + HOLD) open = 1;
      else if (doorT < O + HOLD + C) open = 1 - ease((doorT - O - HOLD) / C);
      else { doorPhase = -1; nextDoor = t + 11 + Math.random() * 12; open = 0; }
    }
    doorL.position.x = doorLX - open * 0.98;
    doorR.position.x = doorRX + open * 0.98;

    // sign flicker: gentle mains hum + rare stutter
    if (t > nextFlick) { flickDur = 0.16 + Math.random() * 0.22; nextFlick = t + 7 + Math.random() * 11; flickT = 0; }
    let k = 1.0 + Math.sin(t * 37.0) * 0.012 + Math.sin(t * 11.3) * 0.018;
    if (flickDur > 0) {
      flickT += dt;
      if (flickT < flickDur) {
        const s = Math.sin(flickT * 90) > 0.1 ? 1 : 0.35;
        k *= s;
      } else flickDur = 0;
    }
    signMats.forEach(m => m.color.setScalar(k));
    const k2 = 0.82 + 0.18 * Math.abs(Math.sin(t * 2.1)) + (flickDur > 0 && flickT < flickDur ? -0.4 : 0);
    smallMats.forEach(m => m.color.setScalar(Math.max(0.25, k2)));
    baseCol.setScalar(k);
    return { doorOpen: open, signLevel: k };
  }

  return { dyn, update, doorL, doorR, fans, signLevelMat: baseCol };
}

function ease(x) { return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2; }