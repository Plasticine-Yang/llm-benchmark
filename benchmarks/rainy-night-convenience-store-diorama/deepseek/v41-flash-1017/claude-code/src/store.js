import * as THREE from 'three';
import {
  PAL, GRAD4, toon, basic, box, plane, cyl, addOutline, glow, canvasTex, rr,
  signTexture, verticalSignTexture, coldDrinksTexture, odenSignTexture, coffeeSignTexture,
  drinkPosterTexture, salePosterTexture, magazineTexture, floorTileTexture, floorGuideTexture,
  hotCaseTexture, windowGlassTexture,
} from './lib.js';

export function buildStore(scene) {
  const root = new THREE.Group();
  scene.add(root);

  const updaters = [];

  /* ---------------- materials ---------------- */
  const wallMat = toon(0xafa38b);
  const wallDark = toon(0xbab09c);
  const frameMat = toon(0x2c3b3c);
  const kickMat = toon(0x173432);
  const roofMat = toon(0x3a3e4a);
  const metalMat = toon(0x8c939f);
  const shelfMat = toon(0x969c96);
  const shelfMetal = toon(0x9aa2ad);
  const darkMat = toon(0x22252d);
  const floorMat = toon(0xb2a58b, { map: floorTileTexture() });
  const ceilMat = toon(0xc9bb9e);
  const glassMat = basic(0x9fd0e8, {
    transparent: true, opacity: 0.02, depthWrite: false,
    side: THREE.DoubleSide, toneMapped: true,
  });
  const glassTint = basic(0x9fd0e8, {
    transparent: true, opacity: 0.035, depthWrite: false,
    side: THREE.DoubleSide, toneMapped: true,
  });
  const warmGlowMat = basic(0xfff0cf, { toneMapped: true });

  /* ---------------- shell ---------------- */
  // floor slab + interior floor
  box(root, 4.2, 0.16, 3.8, -0.6, 0.08, -1.2, toon(0x6b665c), { outline: 0.008 });
  plane(root, 4.0, 3.58, -0.6, 0.165, -1.2, floorMat, { rx: -Math.PI / 2 });
  const aoMat = basic(0x15120e, { transparent: true, opacity: 0.34, depthWrite: false, toneMapped: true });
  function aoPlane(w, d, x, z, opacity = 0.34) {
    const mat = opacity === 0.34 ? aoMat : basic(0x15120e, { transparent: true, opacity, depthWrite: false, toneMapped: true });
    plane(root, w, d, x, 0.171, z, mat, { rx: -Math.PI / 2 });
  }
  aoPlane(3.5, 0.62, -0.8, -2.72, 0.40);
  aoPlane(0.95, 1.95, -1.75, -1.45, 0.30);
  aoPlane(0.95, 1.95, -0.45, -1.45, 0.30);
  aoPlane(0.95, 1.35, 0.95, -0.20, 0.30);
  aoPlane(0.90, 0.90, -1.96, 0.06, 0.28);
  aoPlane(0.42, 1.95, -2.44, -0.55, 0.30);
  aoPlane(0.55, 0.45, 1.08, -2.62, 0.30);
  aoPlane(0.80, 0.30, -1.75, -0.48, 0.28);
  aoPlane(0.80, 0.30, -0.45, -0.48, 0.28);

  // back + left walls
  box(root, 4.2, 3.0, 0.14, -0.6, 1.5, -3.06, wallMat, { outline: 0.009 });
  box(root, 0.14, 3.0, 3.8, -2.66, 1.5, -1.2, wallMat, { outline: 0.009 });

  // front kick panel and top fascia
  box(root, 4.2, 0.36, 0.10, -0.6, 0.34, 0.66, kickMat);
  box(root, 4.2, 0.60, 0.12, -0.6, 2.70, 0.66, wallMat);
  box(root, 0.10, 0.36, 3.8, 1.46, 0.34, -1.2, kickMat);
  box(root, 0.12, 0.60, 3.8, 1.46, 2.70, -1.2, wallMat);

  // corner columns / mullions
  const colMat = toon(0xc9c0ad);
  box(root, 0.16, 3.0, 0.16, -2.62, 1.5, 0.62, colMat, { outline: 0.008 });
  box(root, 0.16, 3.0, 0.16, 1.42, 1.5, 0.62, colMat, { outline: 0.008 });
  box(root, 0.16, 3.0, 0.16, 1.42, 1.5, -3.0, colMat, { outline: 0.008 });
  box(root, 0.16, 3.0, 0.16, -2.62, 1.5, -3.0, colMat, { outline: 0.008 });

  // glass panes (front window A, front window B, side run)
  plane(root, 1.80, 1.80, -1.66, 1.42, 0.70, glassMat);
  plane(root, 0.66, 1.80, 1.06, 1.42, 0.70, glassMat);
  plane(root, 3.54, 1.80, 1.47, 1.42, -1.20, glassTint, { ry: Math.PI / 2 });

  // subtle glass sheen strips
  const sheenTex = windowGlassTexture();
  const sheenMat = basic(0xffffff, { map: sheenTex, transparent: true, opacity: 0.01, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: true });
  plane(root, 1.7, 1.7, -1.66, 1.42, 0.715, sheenMat);
  plane(root, 0.6, 1.7, 1.06, 1.42, 0.715, sheenMat);
  const sideSheen = plane(root, 3.4, 1.7, 1.482, 1.42, -1.2, sheenMat, { ry: Math.PI / 2 });
  sideSheen.material = sheenMat;

  // window frames
  const frameThick = 0.055;
  const frameDepth = 0.09;
  const addV = (x, z, h = 1.9, y = 1.4) => box(root, frameThick, h, frameDepth, x, y, z, frameMat);
  const addH = (x, y, w, z = 0.69) => box(root, w, frameThick, frameDepth, x, y, z, frameMat);
  addV(-2.58, 0.69); addV(-1.66, 0.69); addV(-0.74, 0.69);
  addV(0.72, 0.69); addV(1.40, 0.69);
  addH(-1.66, 0.50, 1.84); addH(-1.66, 2.34, 1.84);
  addH(1.06, 0.50, 0.70); addH(1.06, 2.34, 0.70);
  // side frames
  for (const z of [-2.98, -1.85, -0.70, 0.58]) {
    box(root, 0.09, 1.9, 0.055, 1.465, 1.4, z, frameMat);
  }
  box(root, 0.09, 0.055, 3.56, 1.465, 0.50, -1.2, frameMat);
  box(root, 0.09, 0.055, 3.56, 1.465, 2.34, -1.2, frameMat);

  /* ---------------- entrance doors ---------------- */
  const doorGroup = new THREE.Group();
  root.add(doorGroup);
  const doorL = new THREE.Group();
  const doorR = new THREE.Group();
  doorL.position.set(-0.34, 0, 0.715);
  doorR.position.set(0.34, 0, 0.715);
  doorGroup.add(doorL, doorR);

  const doorStickerTex = canvasTex(256, 96, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    g.fillStyle = 'rgba(250,246,234,0.92)';
    rr(g, 6, 6, w - 12, h - 12, 8); g.fill();
    g.fillStyle = '#2b6a60';
    g.font = 'bold 38px "Hiragino Sans", sans-serif';
    g.textAlign = 'center';
    g.fillText('自動ドア', w / 2, 62);
    g.textAlign = 'left';
  });

  function makeDoorPanel(g) {
    const w = 0.60, h = 1.78;
    box(g, w, 0.06, 0.055, 0, h / 2 + 0.53, 0, frameMat);
    box(g, w, 0.08, 0.055, 0, 0.52, 0, frameMat);
    box(g, 0.05, h, 0.055, -w / 2 + 0.025, h / 2 + 0.55, 0, frameMat);
    box(g, 0.05, h, 0.055, w / 2 - 0.025, h / 2 + 0.55, 0, frameMat);
    plane(g, w - 0.09, h - 0.12, 0, h / 2 + 0.55, 0.02, glassMat);
    // handle
    box(g, 0.025, 0.5, 0.025, w / 2 - 0.10, 1.35, 0.05, metalMat);
    plane(g, 0.3, 0.11, 0, 1.05, 0.035, basic(0xffffff, { map: doorStickerTex, transparent: true, depthWrite: false }));
  }
  makeDoorPanel(doorL);
  makeDoorPanel(doorR);

  // door header + sensor
  box(root, 1.55, 0.10, 0.12, 0, 2.39, 0.69, frameMat);
  box(root, 0.30, 0.10, 0.10, 0, 2.47, 0.76, darkMat);
  const sensorLed = new THREE.Mesh(new THREE.SphereGeometry(0.016, 8, 8), basic(0xff5b4d));
  sensorLed.position.set(0.08, 2.47, 0.815);
  root.add(sensorLed);

  // door mat
  const matMat = toon(0x5a3038);
  box(root, 1.30, 0.022, 0.62, 0, 0.116, 1.02, matMat);
  box(root, 1.24, 0.012, 0.56, 0, 0.128, 1.02, toon(0x6b3b42));

  /* ---------------- canopy ---------------- */
  const canopyMat = toon(0x173833);
  const canopyTrim = toon(0x2a6057);
  const canopyFront = box(root, 4.42, 0.075, 0.72, -0.58, 2.32, 1.06, canopyMat, { outline: 0.007 });
  canopyFront.name = 'canopyFront';
  canopyFront.receiveShadow = false;
  box(root, 4.42, 0.16, 0.06, -0.58, 2.255, 1.44, canopyTrim);
  box(root, 4.30, 0.032, 0.028, -0.58, 2.238, 1.468, basic(0xffe0b0, { toneMapped: true }));
  const canopySide = box(root, 0.72, 0.075, 3.86, 1.86, 2.32, -1.18, canopyMat, { outline: 0.007 });
  canopySide.name = 'canopySide';
  canopySide.receiveShadow = false;
  box(root, 0.06, 0.16, 3.86, 2.23, 2.255, -1.18, canopyTrim);
  box(root, 0.028, 0.032, 3.78, 2.258, 2.238, -1.18, basic(0xffe0b0, { toneMapped: true }));

  // underside warm light strips
  box(root, 3.75, 0.022, 0.055, -0.58, 2.283, 1.18, warmGlowMat);
  box(root, 0.055, 0.022, 3.1, 1.93, 2.283, -1.15, warmGlowMat);
  for (const x of [-2.15, -1.2, -0.25, 0.7]) {
    const d = new THREE.Mesh(new THREE.CircleGeometry(0.055, 12), basic(0xffe9bd, { toneMapped: true }));
    d.name = 'canopyDisc';
    d.rotation.x = Math.PI / 2;
    d.position.set(x, 2.281, 1.0);
    root.add(d);
  }
  // canopy support rods
  const rodMat = toon(0x4a525c);
  for (const x of [-2.3, 1.1]) {
    const a = new THREE.Vector3(x, 2.12, 0.72);
    const b = new THREE.Vector3(x, 2.30, 1.38);
    const dir = new THREE.Vector3().subVectors(b, a);
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, dir.length(), 6), rodMat);
    rod.position.copy(a).addScaledVector(dir, 0.5);
    rod.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
    root.add(rod);
  }

  /* ---------------- signage ---------------- */
  const signTex = signTexture();
  const signMat = basic(0xffffff, { map: signTex, toneMapped: true });
  const signBackMat = toon(0xf0e5cf, { emissive: 0x3a2c18, emissiveIntensity: 0.5 });
  box(root, 4.24, 0.58, 0.10, -0.6, 2.70, 0.715, signBackMat);
  plane(root, 4.16, 0.54, -0.6, 2.70, 0.772, signMat);

  const sideSignMat = basic(0xffffff, { map: signTex, toneMapped: true });
  box(root, 0.10, 0.58, 3.8, 1.505, 2.70, -1.2, signBackMat);
  plane(root, 3.74, 0.54, 1.562, 2.70, -1.2, sideSignMat, { ry: Math.PI / 2 });

  const signGlowFront = glow(root, 0xffd9a0, 5.2, 0.20, -0.6, 2.72, 1.05);
  const signGlowSide = glow(root, 0xffd9a0, 3.8, 0.11, 1.85, 2.72, -1.2);
  const signGlowTeal = glow(root, 0x4fe0c8, 3.2, 0.07, -0.6, 2.68, 0.95);
  signGlowFront.name = 'signGlow';
  signGlowSide.name = 'signGlow';
  signGlowTeal.name = 'signGlow';

  // vertical corner sign
  const vSignTex = verticalSignTexture();
  const vSignMat = basic(0xffffff, { map: vSignTex, toneMapped: true });
  const vFrameMat = toon(0x263432);
  box(root, 0.42, 1.66, 0.20, 1.28, 3.98, 0.70, vFrameMat, { outline: 0.006 });
  plane(root, 0.38, 1.60, 1.28, 3.98, 0.802, vSignMat);
  const vSideMat = basic(0xffffff, { map: vSignTex, toneMapped: true });
  plane(root, 0.38, 1.60, 1.494, 3.98, 0.70, vSideMat, { ry: Math.PI / 2 });
  box(root, 0.07, 1.1, 0.07, 1.28, 3.24, 0.70, vFrameMat);
  const vGlow = glow(root, 0x8ff2de, 1.8, 0.20, 1.28, 3.98, 0.95);
  const vGlow2 = glow(root, 0xffc98a, 1.4, 0.16, 1.28, 4.05, 0.70);

  /* ---------------- roof ---------------- */
  box(root, 4.44, 0.16, 4.02, -0.6, 3.10, -1.2, roofMat);
  box(root, 4.44, 0.28, 0.08, -0.6, 3.30, 0.79, roofMat);
  box(root, 4.44, 0.28, 0.08, -0.6, 3.30, -3.19, roofMat);
  box(root, 0.08, 0.28, 4.02, -2.78, 3.30, -1.2, roofMat);
  box(root, 0.08, 0.28, 4.02, 1.58, 3.30, -1.2, roofMat);

  // rooftop AC + vent + antenna
  const acMat = toon(0xb8bdc6);
  const ac = box(root, 0.78, 0.52, 0.5, -1.55, 3.44, -2.15, acMat, { outline: 0.006 });
  const fanRing = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.018, 6, 20), toon(0x3a4049));
  fanRing.position.set(-1.55, 3.44, -1.895);
  root.add(fanRing);
  const fanDisc = new THREE.Mesh(new THREE.CircleGeometry(0.16, 16), toon(0x22262e));
  fanDisc.position.set(-1.55, 3.44, -1.897);
  root.add(fanDisc);
  for (let i = 0; i < 3; i++) {
    const blade = box(root, 0.12, 0.02, 0.04, -1.55, 3.44, -1.9, toon(0x5d636e));
    blade.rotation.z = (i / 3) * Math.PI * 2;
    blade.position.x = -1.55 + Math.cos((i / 3) * Math.PI * 2) * 0.07;
    blade.position.y = 3.44 + Math.sin((i / 3) * Math.PI * 2) * 0.07;
  }
  cyl(root, 0.10, 0.10, 0.55, 0.55, 3.46, -2.55, toon(0x8b929c), { outline: 0.005 });
  cyl(root, 0.06, 0.06, 0.7, 0.9, 3.55, -2.35, toon(0x8b929c));
  cyl(root, 0.018, 0.018, 1.4, 1.15, 3.9, -2.7, toon(0x3f444d));
  box(root, 0.7, 0.03, 0.03, 1.15, 4.35, -2.7, toon(0x3f444d));
  box(root, 0.5, 0.03, 0.03, 1.15, 4.15, -2.7, toon(0x3f444d));
  box(root, 0.38, 0.26, 0.38, -2.35, 3.31, -0.2, toon(0x5e6470));
  box(root, 0.38, 0.26, 0.38, -2.35, 3.57, -0.2, toon(0x4d5360));

  /* ---------------- interior: ceiling + lights ---------------- */
  box(root, 4.2, 0.06, 3.8, -0.6, 2.46, -1.2, ceilMat);
  for (const z of [-2.05, -0.65]) {
    for (const x of [-1.75, -0.6, 0.55]) {
      box(root, 0.92, 0.02, 0.30, x, 2.425, z, basic(0xfff3d6, { toneMapped: true }));
    }
  }
  const l1 = new THREE.PointLight(0xfff0d8, 4.2, 7.5, 2);
  l1.position.set(-0.9, 2.24, -0.55);
  root.add(l1);
  const l2 = new THREE.PointLight(0xfff0d8, 3.6, 7.5, 2);
  l2.position.set(0.15, 2.24, -2.15);
  root.add(l2);
  const l3 = new THREE.PointLight(0xffd2a0, 3.2, 6, 2);
  l3.position.set(0.8, 2.2, -0.1);
  root.add(l3);
  const coolerLight = new THREE.PointLight(0xbfe4ff, 6.0, 5.0, 2);
  coolerLight.position.set(-0.8, 1.55, -2.45);
  root.add(coolerLight);
  const canopyLight = new THREE.SpotLight(0xffc98c, 8.0, 5.5, 1.10, 0.8, 2);
  canopyLight.position.set(-0.4, 2.24, 1.20);
  canopyLight.target.position.set(-0.4, 0, 1.4);
  root.add(canopyLight, canopyLight.target);
  const canopyLight2 = new THREE.SpotLight(0xffc98c, 6.0, 5.0, 1.10, 0.8, 2);
  canopyLight2.position.set(1.95, 2.24, -1.1);
  canopyLight2.target.position.set(1.9, 0, -1.2);
  root.add(canopyLight2, canopyLight2.target);
  const canopyGlow = glow(root, 0xffcf9c, 2.8, 0.30, -0.2, 2.15, 1.55);
  // warm light spilling out onto the pavement
  const spill = new THREE.PointLight(0xffb878, 4.5, 5.5, 2);
  spill.position.set(-0.2, 1.25, 2.0);
  root.add(spill);
  const spill2 = new THREE.PointLight(0xffb878, 3.5, 4.8, 2);
  spill2.position.set(2.7, 1.25, -1.1);
  root.add(spill2);
  glow(root, 0xffb878, 2.0, 0.10, -0.2, 0.7, 1.9);
  glow(root, 0xffb878, 1.5, 0.08, 2.6, 0.7, -1.1);

  // interior accent spots
  function shopSpot(x, z, tx, tz, intensity, angle = 0.7, color = 0xffd8a8) {
    const s = new THREE.SpotLight(color, intensity, 6.0, angle, 0.85, 2);
    s.position.set(x, 2.40, z);
    s.target.position.set(tx, 0.75, tz);
    root.add(s, s.target);
  }
  shopSpot(-1.75, -1.1, -1.75, -1.1, 6.0);
  shopSpot(-0.45, -1.7, -0.45, -1.7, 5.5);
  shopSpot(0.9, -0.2, 0.9, -0.2, 4.5);
  shopSpot(-1.9, 0.1, -1.9, 0.1, 4.0);

  // dark ceiling soffit frames the bright interior
  box(root, 4.0, 0.14, 0.10, -0.6, 2.37, 0.54, toon(0x2c4a46));
  box(root, 0.10, 0.14, 3.6, -2.55, 2.37, -1.2, toon(0x2c4a46));
  box(root, 4.0, 0.14, 0.10, -0.6, 2.37, -2.95, toon(0x2c4a46));

  /* ---------------- back cooler ---------------- */
  const coolerBody = toon(0x8f9aa0);
  box(root, 3.4, 0.12, 0.55, -0.8, 2.22, -2.72, coolerBody, { outline: 0.005 });
  box(root, 3.4, 0.20, 0.55, -0.8, 0.28, -2.72, coolerBody, { outline: 0.005 });
  box(root, 0.10, 2.08, 0.55, -2.45, 1.22, -2.72, coolerBody, { outline: 0.005 });
  box(root, 0.10, 2.08, 0.55, 0.85, 1.22, -2.72, coolerBody, { outline: 0.005 });
  plane(root, 3.30, 1.94, -0.8, 1.26, -2.985, basic(0x35748c, { toneMapped: true }));
  // shelf boards
  for (const y of [0.55, 0.95, 1.35, 1.75]) {
    box(root, 3.24, 0.035, 0.38, -0.8, y, -2.75, toon(0xaeb6be));
    box(root, 3.24, 0.055, 0.03, -0.8, y + 0.005, -2.555, toon(0x3a4048));
    for (let i = 0; i < 8; i++) {
      box(root, 0.10, 0.032, 0.012, -2.28 + i * 0.42, y + 0.02, -2.537, basic(0xf7f2e4, { toneMapped: true }));
    }
  }
  // bottles
  const bottleCount = 4 * 24;
  const bottleGeo = new THREE.CylinderGeometry(0.058, 0.064, 0.31, 8);
  const bottleMat = new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: true });
  const bottles = new THREE.InstancedMesh(bottleGeo, bottleMat, bottleCount);
  bottles.frustumCulled = false;
  const dummy = new THREE.Object3D();
  const bcol = new THREE.Color();
  let bi = 0;
  const drinkColors = [0xe25b4d, 0x3f8fd0, 0xe7b84b, 0x5aa86b, 0x8b62b8, 0xd87c3a, 0x3fa6a0, 0xcf5f8e, 0xd9d4c8, 0x6fc7e8];
  for (let row = 0; row < 4; row++) {
    for (let i = 0; i < 24; i++) {
      const x = -2.40 + i * 0.135;
      const y = [0.55, 0.95, 1.35, 1.75][row] + 0.155;
      dummy.position.set(x, y, -2.79);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      bottles.setMatrixAt(bi, dummy.matrix);
      bcol.setHex(drinkColors[(row * 5 + i) % drinkColors.length]);
      bcol.offsetHSL((Math.random() - 0.5) * 0.03, 0.20, -0.14);
      bottles.setColorAt(bi, bcol);
      bi++;
    }
  }
  bottles.instanceColor.needsUpdate = true;
  root.add(bottles);

  // cooler doors
  const coolReflMat = basic(0xffffff, {
    map: windowGlassTexture(), transparent: true, opacity: 0.06,
    blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: true,
  });
  for (let i = 0; i < 4; i++) {
    const x = -2.075 + i * 0.85;
    box(root, 0.035, 1.95, 0.06, x - 0.41, 1.25, -2.44, frameMat);
    box(root, 0.035, 1.95, 0.06, x + 0.41, 1.25, -2.44, frameMat);
    box(root, 0.82, 0.05, 0.06, x, 2.21, -2.44, frameMat);
    box(root, 0.82, 0.05, 0.06, x, 0.28, -2.44, frameMat);
    plane(root, 0.76, 1.86, x, 1.25, -2.435, basic(0xcfe9f7, { transparent: true, opacity: 0.10, depthWrite: false, side: THREE.DoubleSide }));
    // handle
    box(root, 0.02, 0.42, 0.03, x + 0.36, 1.25, -2.40, metalMat);
    plane(root, 0.74, 1.82, x, 1.25, -2.432, coolReflMat);
  }
  plane(root, 3.2, 0.34, -0.8, 2.34, -2.98, basic(0xffffff, { map: coldDrinksTexture(), toneMapped: false }));
  glow(root, 0xbfe9ff, 4.4, 0.42, -0.8, 1.5, -2.25);
  // cooler header strip
  plane(root, 3.2, 0.24, -0.8, 2.18, -2.43, basic(0xffffff, { map: coldDrinksTexture(), toneMapped: true }));
  // prominent cooler header at eye level
  const coolHeader = new THREE.Group();
  coolHeader.position.set(-0.8, 1.72, -1.55);
  root.add(coolHeader);
  box(coolHeader, 2.92, 0.30, 0.05, 0, 0, 0, toon(0x2a5a66), { outline: 0.004 });
  plane(coolHeader, 2.86, 0.26, 0, 0, 0.032, basic(0xffffff, { map: coldDrinksTexture(), toneMapped: true }));
  box(coolHeader, 2.9, 0.02, 0.03, 0, 0.14, 0.04, basic(0x8ff2de, { toneMapped: true }));
  box(coolHeader, 2.9, 0.02, 0.03, 0, -0.14, 0.04, basic(0x8ff2de, { toneMapped: true }));
  for (const sx of [-1.15, 1.15]) box(coolHeader, 0.01, 0.62, 0.01, sx, 0.46, 0, toon(0x3a3d45));
  glow(root, 0x8ff2de, 2.4, 0.14, -0.8, 1.72, -1.40);
  // cooler interior light bars
  for (const y of [0.72, 1.12, 1.52, 1.92]) {
    box(root, 3.15, 0.018, 0.02, -0.8, y, -2.94, basic(0xe8f8ff, { toneMapped: true }));
  }

  /* ---------------- gondola shelves ---------------- */
  function gondola(cx) {
    box(root, 0.68, 0.30, 1.80, cx, 0.31, -1.45, shelfMat, { outline: 0.006 });
    box(root, 0.05, 0.56, 1.80, cx, 0.73, -1.45, toon(0x2f5a54), { outline: 0.006 });
    for (const side of [-1, 1]) {
      for (const y of [0.50, 0.80]) {
        box(root, 0.36, 0.035, 1.80, cx + side * 0.19, y, -1.45, shelfMat);
        box(root, 0.025, 0.06, 1.76, cx + side * 0.36, y - 0.03, -1.45, toon(0x3a4048));
        box(root, 0.02, 0.03, 1.76, cx + side * 0.374, y - 0.02, -1.45, basic(0xf7f2e4, { toneMapped: true }));
      }
      box(root, 0.05, 0.08, 1.72, cx + side * 0.34, 1.06, -1.45, toon(0x3c6f66));
    }
    box(root, 0.62, 0.06, 1.78, cx, 1.02, -1.45, toon(0x2f5a54), { outline: 0.004 });
  }
  gondola(-1.75);
  gondola(-0.45);

  // products (instanced)
  const prodPositions = [];
  for (const cx of [-1.75, -0.45]) {
    for (const side of [-1, 1]) {
      for (const y of [0.50, 0.80]) {
        for (let i = 0; i < 14; i++) {
          const z = -2.30 + i * 0.125;
          prodPositions.push([cx + side * 0.27, y + 0.09, z]);
        }
      }
    }
  }
  const prodGeo = new THREE.BoxGeometry(0.085, 0.17, 0.07);
  const prodMat = new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: true });
  const products = new THREE.InstancedMesh(prodGeo, prodMat, prodPositions.length);
  products.frustumCulled = false;
  const pcol = new THREE.Color();
  prodPositions.forEach((p, i) => {
    dummy.position.set(p[0], p[1], p[2]);
    dummy.rotation.set(0, Math.PI / 2, 0);
    dummy.updateMatrix();
    products.setMatrixAt(i, dummy.matrix);
    pcol.setHSL(Math.random(), 0.80 + Math.random() * 0.20, 0.28 + Math.random() * 0.16);
    products.setColorAt(i, pcol);
  });
  products.instanceColor.needsUpdate = true;
  root.add(products);

  // colorful endcaps facing the entrance
  const catColors = [0xd95c5c, 0x4f9ad0, 0xe9c24b, 0x6bb07c, 0xc77bb0, 0xef8b3c, 0x8b62b8, 0x3fa6a0];
  for (const cx of [-1.75, -0.45]) {
    box(root, 0.72, 1.00, 0.22, cx, 0.66, -0.48, toon(0xc2b7a2));
    for (let i = 0; i < 3; i++) {
      box(root, 0.68, 0.03, 0.20, cx, 0.30 + i * 0.30, -0.48, toon(0x8b8270));
      for (let j = 0; j < 5; j++) {
        box(root, 0.125, 0.17, 0.07, cx - 0.27 + j * 0.135, 0.40 + i * 0.30, -0.355, toon(catColors[(i * 5 + j + (cx < -1 ? 2 : 0)) % 8]));
      }
    }
    // category board
    const catTex = canvasTex(256, 96, (g, w, h) => {
      g.fillStyle = '#1e5a52'; g.fillRect(0, 0, w, h);
      g.strokeStyle = '#7fe0c8'; g.lineWidth = 4; g.strokeRect(4, 4, w - 8, h - 8);
      g.fillStyle = '#f4fff9'; g.font = 'bold 42px "Hiragino Sans", sans-serif';
      g.textAlign = 'center'; g.fillText(cx < -1 ? 'お菓子' : '日用品', w / 2, 62); g.textAlign = 'left';
    });
    plane(root, 0.58, 0.21, cx, 1.24, -0.362, basic(0xffffff, { map: catTex, toneMapped: true }));
  }

  /* ---------------- magazine rack + poster lightbox ---------------- */
  const magTex = [0, 1, 2, 3, 4, 5].map((i) => magazineTexture(i));
  box(root, 0.34, 0.40, 1.92, -2.44, 0.36, -0.55, shelfMat, { outline: 0.004 });
  box(root, 0.06, 1.20, 1.92, -2.60, 1.00, -0.55, shelfMat, { outline: 0.004 });
  for (let s = 0; s < 3; s++) {
    const y = 0.66 + s * 0.28;
    const shelf = box(root, 0.30, 0.035, 1.86, -2.45, y, -0.55, shelfMat);
    shelf.rotation.z = -0.28;
    for (let i = 0; i < 5; i++) {
      const tex = magTex[(s * 5 + i) % 6];
      const m = plane(root, 0.21, 0.27, -2.375, y + 0.12, -1.32 + i * 0.38, basic(0xffffff, { map: tex, side: THREE.DoubleSide, toneMapped: true }), { ry: Math.PI / 2, rz: 0 });
      m.rotation.z = -0.28;
    }
  }
  // poster lightbox on left wall
  const posterTex = drinkPosterTexture();
  box(root, 0.10, 0.98, 0.72, -2.60, 1.78, -1.52, toon(0x374a49));
  plane(root, 0.64, 0.88, -2.54, 1.78, -1.52, basic(0xffffff, { map: posterTex, toneMapped: false }), { ry: Math.PI / 2 });
  glow(root, 0xa8f0d8, 0.9, 0.10, -2.35, 1.78, -1.52);
  const saleTex = salePosterTexture();
  plane(root, 0.40, 0.5, -2.57, 1.62, 0.18, basic(0xffffff, { map: saleTex, toneMapped: true }), { ry: Math.PI / 2 });

  /* ---------------- onigiri case ---------------- */
  box(root, 0.76, 0.74, 0.76, -1.96, 0.53, 0.06, toon(0xd3c9b6), { outline: 0.005 });
  box(root, 0.78, 0.05, 0.78, -1.96, 0.925, 0.06, toon(0x3d6f66));
  const hood = box(root, 0.76, 0.50, 0.76, -1.96, 1.18, 0.06, glassMat);
  hood.castShadow = false;
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      box(root, 0.025, 0.50, 0.025, -1.96 + sx * 0.37, 1.18, 0.06 + sz * 0.37, frameMat);
    }
  }
  box(root, 0.78, 0.045, 0.78, -1.96, 1.44, 0.06, toon(0x3d6f66));
  const onigiriMat = toon(0xf7f4ea);
  const noriMat = toon(0x22352b);
  for (let i = 0; i < 6; i++) {
    const ox = -2.20 + (i % 3) * 0.19;
    const oz = -0.08 + Math.floor(i / 3) * 0.26;
    const rice = new THREE.Mesh(new THREE.CylinderGeometry(0.078, 0.078, 0.055, 3), onigiriMat);
    rice.rotation.x = Math.PI / 2;
    rice.rotation.z = Math.PI;
    rice.position.set(ox, 0.985, oz);
    root.add(rice);
    box(root, 0.062, 0.062, 0.06, ox, 0.955, oz + 0.005, noriMat);
    const fillCol = [0xf08a6a, 0xd96a5a, 0x6b8a4a, 0xe8b84a][i % 4];
    const fill = new THREE.Mesh(new THREE.SphereGeometry(0.028, 6, 5), toon(fillCol));
    fill.scale.set(1, 0.55, 0.5);
    fill.position.set(ox, 1.012, oz + 0.012);
    root.add(fill);
  }
  // warm glow inside the onigiri case
  plane(root, 0.62, 0.62, -1.96, 1.40, 0.06, basic(0xfff0cc, { toneMapped: true }), { rx: Math.PI / 2 });
  plane(root, 0.52, 0.10, -1.96, 1.14, 0.446, basic(0xffffff, {
    map: canvasTex(256, 48, (g, w, h) => {
      g.fillStyle = '#f7f2e4'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#2b6a60'; g.font = 'bold 28px "Hiragino Sans", sans-serif';
      g.textAlign = 'center'; g.fillText('おにぎり  ¥130', w / 2, 34); g.textAlign = 'left';
    }), toneMapped: true,
  }), { ry: 0 });

  /* ---------------- service counter ---------------- */
  const counterMat = toon(0xbfae94);
  const counterTop = toon(0x3a3d45);
  box(root, 0.82, 0.86, 1.22, 0.95, 0.59, -0.20, counterMat, { outline: 0.006 });
  box(root, 0.90, 0.055, 1.30, 0.95, 1.035, -0.20, toon(0x5a4433), { outline: 0.003 });
  box(root, 0.86, 0.07, 1.26, 0.95, 0.48, -0.20, toon(0x2e6a60));
  box(root, 0.84, 0.52, 0.025, 0.95, 0.64, 0.414, toon(0x24524c), { outline: 0.003 });
  box(root, 0.84, 0.025, 0.03, 0.95, 0.915, 0.416, basic(0x8a6a45, { toneMapped: true }));
  box(root, 0.84, 0.16, 0.04, 0.95, 0.20, 0.42, toon(0x3f424b));
  // register
  box(root, 0.26, 0.12, 0.30, 0.82, 1.12, 0.28, toon(0x2c3038), { outline: 0.003 });
  const screen = box(root, 0.30, 0.22, 0.025, 0.82, 1.26, 0.20, toon(0x1b1f26));
  screen.rotation.x = -0.28;
  const screenFace = plane(root, 0.25, 0.17, 0.82, 1.265, 0.215, basic(0x8ff0d8, { toneMapped: true }), { rx: -0.28 });
  screenFace.position.z = 0.218;
  plane(root, 0.24, 0.17, 0.82, 1.265, 0.221, basic(0x0f3a35, { toneMapped: true, transparent: true, opacity: 0.35 }), { rx: -0.28 });
  // coffee machine
  box(root, 0.34, 0.50, 0.34, 1.10, 1.30, -0.64, toon(0x33363d), { outline: 0.005 });
  plane(root, 0.26, 0.20, 1.10, 1.36, -0.465, basic(0xffffff, { map: coffeeSignTexture(), toneMapped: false }), {});
  box(root, 0.24, 0.02, 0.10, 1.10, 1.12, -0.44, toon(0x8b929c));
  cyl(root, 0.035, 0.03, 0.07, 1.10, 1.06, -0.43, toon(0xf2ead8), { seg: 10 });
  glow(root, 0xffb06a, 0.45, 0.14, 1.10, 1.30, -0.40);
  // oden warmer
  box(root, 0.46, 0.11, 0.36, 1.04, 1.10, -0.27, toon(0x9aa1aa), { outline: 0.003 });
  const odenCols = [0xf1e2bd, 0xe9d49a, 0x8d8378, 0xdc8b76, 0xbfc9a8, 0xd9b46a];
  for (let i = 0; i < 6; i++) {
    const ox = 0.88 + (i % 3) * 0.15;
    const oz = -0.36 + Math.floor(i / 3) * 0.16;
    box(root, 0.13, 0.08, 0.14, ox, 1.15, oz, toon(odenCols[i]));
    box(root, 0.14, 0.012, 0.15, ox, 1.192, oz, basic(0x6b4a2a, { transparent: true, opacity: 0.4 }));
  }
  box(root, 0.46, 0.012, 0.36, 1.04, 1.25, -0.27, basic(0xbfe8ff, { transparent: true, opacity: 0.18, depthWrite: false }));
  // hot snack case
  box(root, 0.42, 0.34, 0.30, 0.88, 1.23, 0.02, toon(0x3b3f48), { outline: 0.003 });
  box(root, 0.42, 0.012, 0.30, 0.88, 1.41, 0.02, basic(0xffe3b0, { toneMapped: true }));
  for (let i = 0; i < 4; i++) {
    box(root, 0.08, 0.07, 0.08, 0.75 + (i % 2) * 0.18, 1.30, -0.06 + Math.floor(i / 2) * 0.14, toon(0xd9a34a));
  }
  plane(root, 0.34, 0.12, 0.88, 1.18, 0.175, basic(0xffffff, { map: hotCaseTexture(), toneMapped: false }));
  // cup stack + small shelf behind counter
  for (let i = 0; i < 3; i++) cyl(root, 0.045, 0.035, 0.10, 1.30, 1.10 + i * 0.045, 0.28, toon(0xf2ecdc), { seg: 10 });
  box(root, 0.12, 1.05, 0.9, 1.37, 1.42, -0.5, toon(0xd8d1c1));
  for (let i = 0; i < 3; i++) {
    box(root, 0.10, 0.16, 0.12, 1.30, 1.05 + i * 0.22, -0.72, toon([0x4f9ad0, 0xe9c24b, 0xd95c5c][i]));
  }

  // bento corner beside the cooler
  box(root, 0.44, 1.22, 0.34, 1.08, 0.77, -2.62, toon(0xbdb29e), { outline: 0.005 });
  for (const y of [0.44, 0.74, 1.04]) {
    box(root, 0.40, 0.03, 0.32, 1.08, y, -2.62, toon(0x8b8270));
    for (let i = 0; i < 2; i++) {
      box(root, 0.16, 0.075, 0.12, 0.98 + i * 0.19, y + 0.06, -2.47, toon([0xd9a34a, 0xb8564a, 0x7a9a5a, 0xe0c080, 0xc47a5a, 0x9a7a4a][(i + Math.round(y * 10)) % 6]));
      box(root, 0.10, 0.02, 0.125, 0.98 + i * 0.19, y + 0.10, -2.47, toon(0xf4efe2));
    }
  }
  plane(root, 0.36, 0.13, 1.08, 1.43, -2.45, basic(0xffffff, {
    map: canvasTex(256, 96, (g, w, h) => {
      g.fillStyle = '#f6efe0'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#a5462f'; g.font = 'bold 44px "Hiragino Sans", sans-serif';
      g.textAlign = 'center'; g.fillText('お弁当', w / 2, 64); g.textAlign = 'left';
    }), toneMapped: true,
  }));

  // pendant lamp over the counter
  const pendant = new THREE.Group();
  pendant.position.set(0.95, 2.14, -0.24);
  root.add(pendant);
  cyl(pendant, 0.008, 0.008, 0.34, 0, 0.17, 0, toon(0x3a3d45), { seg: 5 });
  cyl(pendant, 0.17, 0.11, 0.17, 0, 0, 0, toon(0x24524c), { seg: 16, open: true, outline: 0.003 });
  const pendDisc = new THREE.Mesh(new THREE.CircleGeometry(0.145, 16), basic(0xffe3b0, { toneMapped: true }));
  pendDisc.rotation.x = Math.PI / 2;
  pendDisc.position.y = -0.08;
  pendant.add(pendDisc);
  glow(root, 0xffc98a, 0.9, 0.16, 0.95, 2.02, -0.24);
  const pendLight = new THREE.PointLight(0xffd0a0, 1.5, 2.4, 2);
  pendLight.position.set(0.95, 2.0, -0.24);
  root.add(pendLight);

  // poster lightbox near the back-left
  box(root, 0.08, 0.92, 0.62, -2.60, 1.56, -2.22, toon(0x374a49));
  plane(root, 0.54, 0.82, -2.55, 1.56, -2.22, basic(0xffffff, { map: drinkPosterTexture(), toneMapped: true }), { ry: Math.PI / 2 });
  glow(root, 0x9fe8d0, 0.8, 0.08, -2.40, 1.56, -2.22);

  // wall-mounted magazine rack, visible above the onigiri case
  box(root, 0.06, 0.72, 1.60, -2.60, 1.68, -0.55, shelfMat, { outline: 0.004 });
  for (let s = 0; s < 3; s++) {
    const y = 1.40 + s * 0.24;
    box(root, 0.16, 0.025, 1.56, -2.54, y, -0.55, shelfMat);
    for (let i = 0; i < 4; i++) {
      plane(root, 0.20, 0.20, -2.455, y + 0.12, -1.18 + i * 0.38, basic(0xffffff, { map: magTex[(s * 4 + i) % 6], side: THREE.DoubleSide, toneMapped: true }), { ry: Math.PI / 2 });
    }
  }
  box(root, 1.0, 0.02, 0.02, -2.53, 2.02, -0.55, basic(0xffe0b0, { toneMapped: true }));


  // cigarette / snack wall behind the register
  box(root, 0.06, 0.95, 1.35, 1.40, 1.55, -0.25, shelfMat, { outline: 0.004 });
  for (let s = 0; s < 3; s++) {
    const y = 1.18 + s * 0.28;
    box(root, 0.14, 0.025, 1.31, 1.35, y, -0.25, shelfMat);
    for (let i = 0; i < 6; i++) {
      box(root, 0.09, 0.15, 0.10, 1.31, y + 0.09, -0.80 + i * 0.21, toon([0xd95c5c, 0x4f9ad0, 0xe9c24b, 0x6bb07c, 0xc77bb0, 0xef8b3c][i]));
    }
  }
  box(root, 1.25, 0.02, 0.02, 1.31, 1.98, -0.25, basic(0xffe0b0, { toneMapped: true }));

  // wall clock above the magazines
  const clock = new THREE.Group();
  clock.position.set(-2.56, 2.18, -0.55);
  root.add(clock);
  const clockFace = new THREE.Mesh(new THREE.CircleGeometry(0.15, 20), basic(0xf4efe2, { toneMapped: true }));
  clockFace.rotation.y = Math.PI / 2;
  clock.add(clockFace);
  const clockRim = new THREE.Mesh(new THREE.TorusGeometry(0.155, 0.014, 6, 24), toon(0x2c3b3c));
  clockRim.rotation.y = Math.PI / 2;
  clock.add(clockRim);
  for (const [len, ang] of [[0.09, -0.4], [0.12, 1.9]]) {
    const hand = box(clock, 0.006, len, 0.012, 0.01, 0, 0, toon(0x2c3038));
    hand.rotation.x = ang;
    hand.position.y = Math.cos(ang) * len * 0.5;
    hand.position.z = Math.sin(ang) * len * 0.5;
  }

  // floor guide stripe
  box(root, 0.07, 0.008, 1.2, 0.35, 0.172, -0.15, basic(0x2f8f80, { toneMapped: true }));

  // window poster inside the left pane
  const salePoster = new THREE.Group();
  salePoster.position.set(-1.25, 1.62, 0.30);
  root.add(salePoster);
  box(salePoster, 0.56, 0.72, 0.025, 0, 0, 0, toon(0xf6efe0), { outline: 0.004 });
  plane(salePoster, 0.52, 0.68, 0, 0, 0.016, basic(0xffffff, { map: salePosterTexture(), toneMapped: true }));
  box(salePoster, 0.008, 0.42, 0.008, -0.2, 0.56, 0, toon(0x3a3d45));
  box(salePoster, 0.008, 0.42, 0.008, 0.2, 0.56, 0, toon(0x3a3d45));
  glow(root, 0xffd9a0, 0.8, 0.08, -1.25, 1.6, 0.5);

  // hanging signs
  const odenTex = odenSignTexture();
  const coffeeTex = coffeeSignTexture();
  function hangSign(x, y, z, w, h, tex, ry = 0) {
    const g = new THREE.Group();
    g.position.set(x, y, z);
    g.rotation.y = ry;
    root.add(g);
    box(g, w, h, 0.03, 0, 0, 0, toon(0xf6efdd));
    plane(g, w - 0.04, h - 0.04, 0, 0, 0.018, basic(0xffffff, { map: tex, toneMapped: false }));
    plane(g, w - 0.04, h - 0.04, 0, 0, -0.018, basic(0xffffff, { map: tex, toneMapped: false }), { ry: Math.PI });
    for (const sx of [-w / 2 + 0.05, w / 2 - 0.05]) {
      box(g, 0.008, 0.24, 0.008, sx, h / 2 + 0.12, 0, toon(0x3a3d45));
    }
    return g;
  }
  hangSign(0.15, 2.15, -0.05, 0.52, 0.26, odenTex);
  hangSign(1.05, 2.10, -0.62, 0.46, 0.23, coffeeTex, Math.PI / 2);

  // colorful banners hanging near the front glass
  const bannerDefs = [
    ['SALE', '#e8573f', '#fff3dc'],
    ['NEW', '#1f8f7c', '#f2fff9'],
    ['100円', '#d85a8a', '#fff2f7'],
  ];
  bannerDefs.forEach((b, i) => {
    const tex = canvasTex(160, 384, (g, w, h) => {
      g.fillStyle = b[1];
      g.fillRect(0, 0, w, h);
      g.strokeStyle = 'rgba(255,255,255,0.65)';
      g.lineWidth = 6;
      g.strokeRect(8, 8, w - 16, h - 16);
      g.fillStyle = b[2];
      g.font = 'bold 46px "Helvetica Neue", Arial, sans-serif';
      g.textAlign = 'center';
      g.fillText(b[0], w / 2, 132);
      g.font = 'bold 20px "Hiragino Sans", sans-serif';
      g.fillText('HOT MART', w / 2, 300);
      g.font = '16px "Hiragino Sans", sans-serif';
      g.fillText('おすすめ', w / 2, 330);
      g.textAlign = 'left';
    });
    const x = -2.25 + i * 0.42;
    plane(root, 0.17, 0.40, x, 1.82, 0.24, basic(0xffffff, { map: tex, side: THREE.DoubleSide, toneMapped: false }));
    box(root, 0.008, 0.28, 0.008, x - 0.06, 2.16, 0.24, toon(0x3a3d45));
    box(root, 0.008, 0.28, 0.008, x + 0.06, 2.16, 0.24, toon(0x3a3d45));
  });

  // snack shelf high on the left wall
  box(root, 0.16, 0.04, 1.7, -2.52, 1.52, -0.65, shelfMat);
  for (let i = 0; i < 8; i++) {
    box(root, 0.12, 0.19, 0.11, -2.45, 1.64, -1.35 + i * 0.2, toon([0xd95c5c, 0x4f9ad0, 0xe9c24b, 0x6bb07c, 0xc77bb0, 0xef8b3c, 0x8b62b8, 0x3fa6a0][i]));
  }

  // window decals
  function decal(text, bg, fg, x, y) {
    const tex = canvasTex(256, 128, (g, w, h) => {
      g.clearRect(0, 0, w, h);
      g.fillStyle = bg;
      rr(g, 8, 8, w - 16, h - 16, 16); g.fill();
      g.fillStyle = fg;
      g.font = 'bold 52px "Hiragino Sans", sans-serif';
      g.textAlign = 'center';
      g.fillText(text, w / 2, 80);
      g.textAlign = 'left';
    });
    plane(root, 0.30, 0.15, x, y, 0.734, basic(0xffffff, { map: tex, transparent: true, depthWrite: false, toneMapped: true }));
  }
  decal('ATM', '#1b4f9c', '#eaf2ff', -2.15, 1.08);
  decal('コーヒー', '#5a3a26', '#ffe8c8', 1.05, 1.02);
  decal('24H', '#d26a2e', '#fff3e2', -0.95, 1.02);

  // staff door + lockers
  box(root, 0.06, 1.90, 0.70, -2.60, 1.11, -2.42, toon(0x6f6a60), { outline: 0.004 });
  box(root, 0.02, 1.86, 0.64, -2.565, 1.11, -2.42, toon(0x7d766a));
  box(root, 0.03, 0.10, 0.03, -2.545, 1.10, -2.12, toon(0xb7ad98));
  plane(root, 0.26, 0.10, -2.545, 1.72, -2.42, basic(0xffffff, {
    map: canvasTex(256, 96, (g, w, h) => {
      g.fillStyle = '#e9e2d2'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#5a554b'; g.font = 'bold 34px "Helvetica Neue", Arial, sans-serif';
      g.textAlign = 'center'; g.fillText('STAFF ONLY', w / 2, 58); g.textAlign = 'left';
    }), toneMapped: true,
  }), { ry: Math.PI / 2 });
  box(root, 0.32, 1.05, 0.36, -2.42, 0.69, -1.92, toon(0x8d8a80), { outline: 0.003 });
  box(root, 0.32, 1.05, 0.36, -2.42, 0.69, -1.52, toon(0x8d8a80), { outline: 0.003 });
  for (const z of [-1.92, -1.52]) {
    box(root, 0.02, 0.10, 0.02, -2.25, 0.9, z, toon(0xc9c2b2));
    box(root, 0.02, 0.02, 0.16, -2.25, 0.72, z, toon(0x4a4d55));
  }

  // interior floor guide + ceiling camera
  plane(root, 1.10, 0.72, 0.0, 0.172, 0.18, basic(0xffffff, { map: floorGuideTexture(), transparent: true, depthWrite: false, toneMapped: true }), { rx: -Math.PI / 2 });
  const dome = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), toon(0x2a2d34));
  dome.position.set(0.9, 2.43, 0.35);
  dome.rotation.x = Math.PI;
  root.add(dome);

  // steam above oden
  const steam = [];
  for (let i = 0; i < 3; i++) {
    const s = glow(root, 0xfff1d8, 0.30, 0.05, 1.0 + (i - 1) * 0.12, 1.30, -0.27);
    steam.push({ s, phase: i * 2.1 });
  }

  /* ---------------- sign flicker ---------------- */
  let flickerTimer = 4 + Math.random() * 4;
  let flickerLeft = 0;
  const signMats = [signMat, sideSignMat, vSignMat, vSideMat];
  updaters.push((dt, t) => {
    flickerTimer -= dt;
    let k = 1;
    if (flickerLeft > 0) {
      flickerLeft -= dt;
      k = (Math.sin(t * 74) > -0.1) ? 1 : 0.42;
    } else if (flickerTimer <= 0) {
      flickerLeft = 0.16 + Math.random() * 0.22;
      flickerTimer = 5 + Math.random() * 7;
    }
    for (const m of signMats) m.color.setScalar(0.72 + 0.28 * k);
    signGlowFront.material.opacity = 0.13 * (0.55 + 0.45 * k);
    signGlowSide.material.opacity = 0.11 * (0.55 + 0.45 * k);
    signGlowTeal.material.opacity = 0.07 * (0.55 + 0.45 * k);
    vGlow.material.opacity = 0.20 * (0.6 + 0.4 * k);
    vGlow2.material.opacity = 0.16 * (0.6 + 0.4 * k);
    // steam
    for (const st of steam) {
      const p = ((t * 0.25 + st.phase) % 1);
      st.s.position.y = 1.30 + p * 0.45;
      st.s.material.opacity = 0.05 * (1 - p);
      st.s.scale.setScalar(0.26 + p * 0.25);
    }
  });

  /* ---------------- automatic door ---------------- */
  let doorTimer = 4.5;
  let doorOpen = 0;
  let doorTarget = 0;
  let holdTimer = 0;
  updaters.push((dt) => {
    doorTimer -= dt;
    if (doorTimer <= 0 && doorTarget === 0) {
      doorTarget = 1;
      holdTimer = 2.4;
      doorTimer = 10 + Math.random() * 8;
    }
    if (doorTarget === 1) {
      doorOpen = Math.min(1, doorOpen + dt * 1.35);
      if (doorOpen >= 1) {
        holdTimer -= dt;
        if (holdTimer <= 0) doorTarget = 0;
      }
    } else {
      doorOpen = Math.max(0, doorOpen - dt * 0.85);
    }
    const e = doorOpen * doorOpen * (3 - 2 * doorOpen);
    doorL.position.x = -0.34 - e * 0.58;
    doorR.position.x = 0.34 + e * 0.58;
  });

  return {
    group: root,
    update(dt, t) {
      for (const u of updaters) u(dt, t);
    },
  };
}
