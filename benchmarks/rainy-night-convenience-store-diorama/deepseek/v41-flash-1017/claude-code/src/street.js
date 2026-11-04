import * as THREE from 'three';
import {
  PAL, toon, basic, box, plane, cyl, tubeBetween, addOutline, glow, canvasTex, rr, puddleGeo,
  asphaltTexture, sidewalkTexture, grateTexture, manholeTexture, stopTexture,
  plaqueTexture, streetSignTexture, buildingTexture, neighborWindowTexture,
  snackSignTexture, catPosterTexture, noticeBoardTexture, vendingTexture, getGlowTexture,
} from './lib.js';

/* ground height for rain splashes / puddles */
export function groundY(x, z) {
  if (z >= 0.7 && z <= 1.9) return 0.1;
  if (x >= 1.5 && x <= 2.7 && z <= 1.9) return 0.1;
  if (z >= 4.2 || x >= 4.2) return 0.1;
  return 0;
}

export function buildStreet(scene) {
  const root = new THREE.Group();
  scene.add(root);
  const updaters = [];

  /* ================================================================ */
  /*  Diorama base                                                     */
  /* ================================================================ */
  const baseDark = toon(0x0e1119);
  const baseMid = toon(0x1a1e2a);
  const baseTop = toon(0x232838);
  box(root, 9.72, 0.28, 9.72, 0, -0.76, 0, baseDark);
  box(root, 9.56, 0.24, 9.56, 0, -0.50, 0, baseMid);
  box(root, 9.42, 0.22, 9.42, 0, -0.27, 0, toon(0x202532));
  box(root, 9.30, 0.16, 9.30, 0, -0.08, 0, baseTop);
  // thin rim light around the plinth
  const rimMat = basic(0x2b8f83, { transparent: true, opacity: 0.55, toneMapped: true });
  box(root, 9.34, 0.012, 0.02, 0, -0.012, 4.66, rimMat);
  box(root, 9.34, 0.012, 0.02, 0, -0.012, -4.66, rimMat);
  box(root, 0.02, 0.012, 9.34, 4.66, -0.012, 0, rimMat);
  box(root, 0.02, 0.012, 9.34, -4.66, -0.012, 0, rimMat);
  // plaque
  plane(root, 1.65, 0.40, 0, -0.44, 4.856, basic(0xffffff, { map: plaqueTexture(), toneMapped: true }));

  /* ================================================================ */
  /*  Roads & sidewalks                                                */
  /* ================================================================ */
  const asphaltMat = toon(0xffffff, { map: asphaltTexture() });
  plane(root, 9.3, 9.3, 0, 0.002, 0, asphaltMat, { rx: -Math.PI / 2 });


  const walkSide = toon(0x6d7486);
  const walkTopMat = toon(0xffffff, { map: sidewalkTexture() });

  // front sidewalk (z 0.7 .. 1.9)
  box(root, 9.3, 0.10, 1.2, 0, 0.05, 1.3, walkSide);
  plane(root, 9.28, 1.18, 0, 0.102, 1.3, walkTopMat, { rx: -Math.PI / 2 });
  // side sidewalk (x 1.5 .. 2.7, z -4.65 .. 0.7)
  box(root, 1.2, 0.10, 5.35, 2.1, 0.05, -1.975, walkSide);
  plane(root, 1.18, 5.33, 2.1, 0.102, -1.975, walkTopMat, { rx: -Math.PI / 2 });
  // far sidewalk strips
  box(root, 9.3, 0.10, 0.45, 0, 0.05, 4.425, walkSide);
  plane(root, 9.28, 0.43, 0, 0.102, 4.425, walkTopMat, { rx: -Math.PI / 2 });
  box(root, 0.45, 0.10, 8.85, 4.425, 0.05, -0.225, walkSide);
  plane(root, 0.43, 8.83, 4.425, 0.102, -0.225, walkTopMat, { rx: -Math.PI / 2 });

  // curbs
  const curbMat = toon(0x8c92a2);
  box(root, 9.3, 0.15, 0.12, 0, 0.075, 1.92, curbMat);
  box(root, 0.12, 0.15, 6.5, 2.72, 0.075, -1.3, curbMat);
  box(root, 9.3, 0.15, 0.12, 0, 0.075, 4.18, curbMat);
  box(root, 0.12, 0.15, 8.85, 4.18, 0.075, -0.225, curbMat);

  // gutters with grates
  const gutterMat = toon(0x141821);
  box(root, 9.2, 0.012, 0.18, 0, 0.006, 2.05, gutterMat);
  box(root, 0.18, 0.012, 6.4, 2.85, 0.006, -1.3, gutterMat);
  const grateMat = basic(0xffffff, { map: grateTexture(), toneMapped: true });
  plane(root, 9.2, 0.16, 0, 0.013, 2.05, grateMat, { rx: -Math.PI / 2 });
  plane(root, 0.16, 6.4, 2.85, 0.013, -1.3, grateMat, { rx: -Math.PI / 2, rz: Math.PI / 2 });

  /* ---------------- road paint ---------------- */
  const paintMat = toon(0xd7dde7);
  const cross = [];
  for (let i = 0; i < 5; i++) {
    cross.push(box(root, 3.3, 0.012, 0.24, -1.0, 0.012, 2.28 + i * 0.39, paintMat));
  }
  // stop line + text on the side street
  box(root, 1.25, 0.012, 0.10, 3.45, 0.012, 1.55, paintMat);
  const stopMat = basic(0xffffff, { map: stopTexture(), transparent: true, depthWrite: false, toneMapped: true });
  plane(root, 1.1, 0.55, 3.45, 0.014, 1.15, stopMat, { rx: -Math.PI / 2 });
  // lane dashes
  for (const x of [-4.0, -3.1, 1.3, 2.2, 3.2]) {
    box(root, 0.55, 0.012, 0.07, x, 0.012, 3.08, paintMat);
  }
  for (const z of [-4.2, -0.9, 0.3, 1.15]) {
    box(root, 0.07, 0.012, 0.55, 3.45, 0.012, z, paintMat);
  }
  // parking bay
  box(root, 0.07, 0.012, 1.75, 2.9, 0.012, -2.55, paintMat);
  box(root, 0.07, 0.012, 1.75, 4.1, 0.012, -2.55, paintMat);
  box(root, 1.27, 0.012, 0.07, 3.5, 0.012, -3.42, paintMat);
  box(root, 0.9, 0.12, 0.18, 3.5, 0.06, -3.1, toon(0x9aa0ac));

  // manhole
  const manhole = new THREE.Mesh(new THREE.CircleGeometry(0.34, 24), basic(0xffffff, { map: manholeTexture(), toneMapped: true }));
  manhole.rotation.x = -Math.PI / 2;
  manhole.position.set(0.6, 0.014, 2.75);
  root.add(manhole);
  const mhRing = new THREE.Mesh(new THREE.TorusGeometry(0.345, 0.02, 6, 28), toon(0x555b68));
  mhRing.rotation.x = -Math.PI / 2;
  mhRing.position.set(0.6, 0.015, 2.75);
  root.add(mhRing);

  /* ---------------- puddles ---------------- */
  const puddleMat = basic(0x0a1420, { transparent: true, opacity: 0.58, depthWrite: false, toneMapped: true });
  const puddleMat2 = basic(0x0d1a2a, { transparent: true, opacity: 0.45, depthWrite: false, toneMapped: true });
  const puddles = [
    [2.16, 1.18, 0.36, 1], [-0.12, 1.38, 0.30, 2], [-3.38, 1.10, 0.32, 3],
    [0.42, 3.22, 0.52, 4], [-2.25, 2.95, 0.42, 5], [3.38, -0.62, 0.44, 6],
    [3.30, -2.95, 0.30, 7], [-3.18, 3.62, 0.38, 8], [2.30, -3.9, 0.28, 9],
  ];
  for (const [x, z, r, s] of puddles) {
    const m = new THREE.Mesh(puddleGeo(r, s * 1.7), s % 2 ? puddleMat2 : puddleMat);
    m.position.set(x, groundY(x, z) + 0.006, z);
    m.renderOrder = 2;
    root.add(m);
  }

  /* ================================================================ */
  /*  Wet reflection streaks                                           */
  /* ================================================================ */
  // streak texture is defined in lib; build locally once
  const streakTex = makeStreakTexture();
  const reflMats = [];
  function reflection(x, z, w, l, color, opacity, rot = 0, y = null) {
    const mat = basic(0xffffff, {
      map: streakTex, color, transparent: true, opacity,
      blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false,
    });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, l), mat);
    m.rotation.x = -Math.PI / 2;
    m.rotation.z = rot;
    m.position.set(x, y === null ? (groundY(x, z) + 0.014) : y, z);
    m.renderOrder = 3;
    root.add(m);
    reflMats.push({ mat, base: opacity, phase: Math.random() * 6.28, speed: 0.7 + Math.random() * 1.4 });
    return m;
  }
  // storefront warm + sign teal
  // sidewalk pool directly under the shopfront
  reflection(-0.6, 1.30, 4.45, 1.15, 0xffb374, 0.55, 0, 0.108);
  reflection(-0.6, 1.30, 4.10, 1.10, 0x4fe0c8, 0.30, 0, 0.109);
  reflection(0.0, 1.35, 1.40, 1.00, 0xffd6a0, 0.65, 0, 0.109);
  reflection(-0.6, 1.30, 4.00, 1.05, 0x5ff0d0, 0.26, 0, 0.110);
  reflection(-0.1, 1.05, 1.0, 0.9, 0xffd7a0, 0.20, 0, 0.109);
  reflection(1.05, 1.02, 0.55, 0.8, 0xffd7a0, 0.17, 0, 0.109);
  // and its continuation on the wet road
  reflection(-0.6, 2.85, 4.5, 1.9, 0xffb374, 0.35, 0, 0.016);
  reflection(-0.6, 2.85, 4.1, 1.7, 0x4fe0c8, 0.24, 0, 0.017);
  reflection(0.0, 2.6, 1.4, 1.4, 0xffd6a0, 0.42, 0, 0.017);
  reflection(-0.6, 2.9, 4.0, 1.8, 0x5ff0d0, 0.18, 0, 0.018);
  // side of the store
  reflection(2.1, -1.2, 3.4, 1.1, 0xffb374, 0.46, Math.PI / 2, 0.108);
  reflection(3.15, -1.2, 3.4, 1.3, 0xffb374, 0.30, Math.PI / 2, 0.016);
  reflection(3.2, -0.85, 1.0, 1.4, 0x9fe8ff, 0.82, Math.PI / 2, 0.016);
  reflection(3.2, -1.75, 1.0, 1.4, 0xff8a8a, 0.70, Math.PI / 2, 0.016);
  reflection(2.3, -0.85, 0.9, 0.8, 0x9fe8ff, 0.42, Math.PI / 2, 0.109);
  reflection(2.3, -1.75, 0.9, 0.8, 0xff8a8a, 0.36, Math.PI / 2, 0.109);
  reflection(2.55, 2.65, 1.7, 2.4, 0xffcf9c, 0.52);
  reflection(-3.12, 1.55, 0.55, 1.2, 0xff7fb0, 0.46);
  reflection(-3.15, -0.25, 0.6, 1.4, 0xffb878, 0.26);
  reflection(0.0, 3.2, 8.2, 2.4, 0x6d8fc4, 0.05);
  const trafficRefl = reflection(3.4, -3.45, 0.55, 1.5, 0xff5b4d, 0.0);
  // (the traffic streak above is animated separately)

  /* ================================================================ */
  /*  Street lamp + pedestrian signal                                  */
  /* ================================================================ */
  const poleMat = toon(0x4a505c);
  const lampPole = new THREE.Group();
  lampPole.position.set(3.5, 0.1, 1.55);
  root.add(lampPole);
  cyl(lampPole, 0.13, 0.15, 0.26, 0, 0.13, 0, toon(0x3a3f4a));
  cyl(lampPole, 0.05, 0.06, 3.8, 0, 2.02, 0, poleMat, { outline: 0.005 });
  box(lampPole, 0.08, 0.08, 0.95, 0, 3.86, 0.44, poleMat);
  box(lampPole, 0.30, 0.11, 0.52, 0, 3.82, 0.90, toon(0x2d323b));
  box(lampPole, 0.26, 0.03, 0.46, 0, 3.755, 0.90, basic(0xffe8bd, { toneMapped: true }));
  box(lampPole, 0.32, 0.018, 0.54, 0, 3.775, 0.90, basic(0xffe2ae, { toneMapped: true }));
  const lampFace = plane(lampPole, 0.24, 0.42, 0, 3.752, 0.90, basic(0xfff1ce, { toneMapped: true }), { rx: Math.PI / 2 });
  lampFace.rotation.z = 0;
  const lampGlow = glow(root, 0xffd9a4, 3.0, 0.24, 3.5, 3.72, 2.45);
  lampGlow.material.depthTest = false;
  const lampCore = glow(root, 0xfff0cc, 1.2, 0.45, 3.5, 3.76, 2.45);
  lampCore.material.depthTest = false;
  const lampPoint = new THREE.PointLight(0xffd9a4, 5.0, 4.5, 2);
  lampPoint.position.set(3.5, 3.6, 2.45);
  root.add(lampPoint);
  // volumetric cone
  const coneMat = basic(0xffd9a4, {
    transparent: true, opacity: 0.028, depthWrite: false,
    blending: THREE.AdditiveBlending, side: THREE.DoubleSide, toneMapped: true,
  });
  const cone = new THREE.Mesh(new THREE.ConeGeometry(1.65, 3.6, 24, 1, true), coneMat);
  cone.name = "lampCone";
  cone.position.set(3.5, 1.92, 2.45);
  root.add(cone);
  // spotlight
  const spot = new THREE.SpotLight(0xffcf9c, 125, 11, 0.95, 0.65, 2);
  spot.position.set(3.5, 3.78, 2.45);
  spot.target.position.set(3.2, 0, 2.75);
  spot.castShadow = true;
  spot.shadow.mapSize.set(1024, 1024);
  spot.shadow.bias = -0.0008;
  spot.shadow.normalBias = 0.02;
  root.add(spot, spot.target);

  // pedestrian signal on lamp pole
  const pedGroup = new THREE.Group();
  pedGroup.position.set(3.5, 2.62, 1.67);
  root.add(pedGroup);
  box(pedGroup, 0.19, 0.44, 0.11, 0, 0, 0, toon(0x24282f));
  const pedRed = new THREE.Mesh(new THREE.CircleGeometry(0.055, 12), basic(0x481a1a, { toneMapped: true }));
  pedRed.position.set(0, 0.10, 0.061);
  pedGroup.add(pedRed);
  const pedGreen = new THREE.Mesh(new THREE.CircleGeometry(0.055, 12), basic(0x1a3f2a, { toneMapped: true }));
  pedGreen.position.set(0, -0.10, 0.061);
  pedGroup.add(pedGreen);
  const pedRedGlow = glow(pedGroup, 0xff4d3d, 0.5, 0.0, 0, 0.10, 0.10);
  const pedGreenGlow = glow(pedGroup, 0x54ffa0, 0.5, 0.0, 0, -0.10, 0.10);

  /* ================================================================ */
  /*  Utility poles + wires                                            */
  /* ================================================================ */
  const concrete = toon(0x777d88);
  const wireMat = new THREE.MeshBasicMaterial({ color: 0x0a0c12, toneMapped: true });
  function utilityPole(x, z, transformer = false) {
    const g = new THREE.Group();
    g.position.set(x, 0.1, z);
    root.add(g);
    cyl(g, 0.075, 0.10, 5.6, 0, 2.8, 0, concrete, { outline: 0.005 });
    for (const y of [5.15, 5.45]) {
      box(g, 0.07, 0.07, 1.15, 0, y, 0, toon(0x5d626c));
      for (const dz of [-0.36, 0, 0.36]) {
        cyl(g, 0.045, 0.05, 0.10, 0, y + 0.09, dz, toon(0xd8d2c4), { seg: 8 });
      }
    }
    if (transformer) {
      cyl(g, 0.19, 0.19, 0.58, 0.19, 4.45, 0, toon(0x8b919c), { seg: 14 });
      box(g, 0.06, 0.06, 0.45, 0.02, 4.72, 0, toon(0x4b505a));
      box(g, 0.06, 0.06, 0.45, 0.02, 4.18, 0, toon(0x4b505a));
    }
    return g;
  }
  utilityPole(-4.0, 1.55, true);
  utilityPole(4.0, 1.55, false);

  function wire(a, b, sag, radius = 0.012) {
    const mid = new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5);
    mid.y -= sag;
    const curve = new THREE.CatmullRomCurve3([a, mid, b]);
    const geo = new THREE.TubeGeometry(curve, 36, radius, 4, false);
    const m = new THREE.Mesh(geo, wireMat);
    m.castShadow = false;
    root.add(m);
    return m;
  }
  for (const [y, dz] of [[5.52, -0.18], [5.52, 0.18]]) {
    wire(new THREE.Vector3(-4.0, y, 1.55 + dz), new THREE.Vector3(4.0, y, 1.55 + dz), 0.45, 0.011);
  }
  wire(new THREE.Vector3(-4.0, 5.3, 1.55), new THREE.Vector3(-2.62, 3.25, 0.5), 0.28, 0.009);
  wire(new THREE.Vector3(4.0, 5.2, 1.55), new THREE.Vector3(4.3, 3.0, -4.0), 0.35, 0.008);

  // street name sign on pole
  plane(root, 0.78, 0.24, -4.0, 2.72, 1.65, basic(0xffffff, { map: streetSignTexture(), toneMapped: true }));
  box(root, 0.04, 0.26, 0.02, -4.0, 2.72, 1.63, toon(0x3d434d));
  // small cat poster on the pole
  plane(root, 0.24, 0.32, -3.93, 1.7, 1.66, basic(0xffffff, { map: catPosterTexture(), toneMapped: true }));
  glow(root, 0xffcf9c, 1.6, 0.07, -4.0, 3.3, 1.8);

  /* ================================================================ */
  /*  Guardrail                                                        */
  /* ================================================================ */
  const railMat = toon(0xcfd5df);
  function guardrail(x1, z1, x2, z2, count) {
    const g = new THREE.Group();
    root.add(g);
    for (let i = 0; i <= count; i++) {
      const t = i / count;
      const x = x1 + (x2 - x1) * t;
      const z = z1 + (z2 - z1) * t;
      box(g, 0.055, 0.55, 0.055, x, 0.375, z, railMat);
    }
    for (const y of [0.40, 0.58]) {
      tubeBetween(g, new THREE.Vector3(x1, y, z1), new THREE.Vector3(x2, y, z2), 0.022, railMat, { seg: 8 });
    }
    return g;
  }
  guardrail(-4.35, 4.30, -1.25, 4.30, 7);
  guardrail(1.35, 4.30, 3.95, 4.30, 6);
  guardrail(4.30, -1.35, 4.30, 1.0, 5);

  // far-side street lamp over the crosswalk
  const lamp2 = new THREE.Group();
  lamp2.position.set(-3.55, 0.1, 4.28);
  root.add(lamp2);
  cyl(lamp2, 0.11, 0.13, 0.22, 0, 0.11, 0, toon(0x3a3f4a));
  cyl(lamp2, 0.04, 0.05, 3.2, 0, 1.7, 0, poleMat, { outline: 0.004 });
  box(lamp2, 0.07, 0.07, 0.85, 0, 3.24, -0.40, poleMat);
  box(lamp2, 0.26, 0.09, 0.42, 0, 3.20, -0.80, toon(0x2d323b));
  box(lamp2, 0.22, 0.02, 0.36, 0, 3.15, -0.80, basic(0xffe8bd, { toneMapped: true }));
  box(lamp2, 0.27, 0.015, 0.42, 0, 3.165, -0.80, basic(0xffe2ae, { toneMapped: true }));
  const lamp2Glow = glow(root, 0xffd9a4, 2.4, 0.18, -3.55, 3.12, 3.46);
  lamp2Glow.material.depthTest = false;
  const lamp2Core = glow(root, 0xfff0cc, 0.9, 0.35, -3.55, 3.14, 3.46);
  lamp2Core.material.depthTest = false;
  const lamp2Point = new THREE.PointLight(0xffd2a0, 10.0, 7.5, 2);
  lamp2Point.position.set(-3.55, 3.0, 3.46);
  root.add(lamp2Point);
  reflection(-3.55, 3.35, 1.2, 1.9, 0xffcf9c, 0.40);
  // soft light pools under the lamps
  const poolTex = getGlowTexture();
  function lightPool(x, z, size, color, opacity) {
    const mat = basic(0xffffff, { map: poolTex, color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(size, size), mat);
    m.rotation.x = -Math.PI / 2;
    m.position.set(x, groundY(x, z) + 0.02, z);
    m.renderOrder = 4;
    root.add(m);
  }
  lightPool(3.5, 2.7, 3.6, 0xffcf9c, 0.12);
  lightPool(-3.55, 3.5, 3.1, 0xffcf9c, 0.10);

  // convex traffic mirror at the corner
  const mirrorPole = new THREE.Group();
  mirrorPole.position.set(-4.28, 0.1, 1.62);
  root.add(mirrorPole);
  cyl(mirrorPole, 0.04, 0.05, 2.55, 0, 1.28, 0, toon(0x8a5a35), { outline: 0.004 });
  box(mirrorPole, 0.06, 0.06, 0.28, 0, 2.52, 0.13, toon(0x8a5a35));
  const mirrorTex = canvasTex(256, 256, (g, w, h) => {
    const grd = g.createRadialGradient(w * 0.36, h * 0.30, 6, w * 0.5, h * 0.5, w * 0.62);
    grd.addColorStop(0, '#dbe9ff');
    grd.addColorStop(0.32, '#8aa4c4');
    grd.addColorStop(0.7, '#3f4d63');
    grd.addColorStop(1, '#1b2433');
    g.fillStyle = grd;
    g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(255,255,255,0.25)';
    g.beginPath(); g.ellipse(w * 0.35, h * 0.26, 52, 22, -0.6, 0, Math.PI * 2); g.fill();
    g.strokeStyle = 'rgba(230,240,255,0.5)';
    g.lineWidth = 5;
    g.beginPath(); g.arc(w / 2, h / 2, w * 0.40, 0, Math.PI * 2); g.stroke();
  });
  const mirror = new THREE.Mesh(new THREE.CircleGeometry(0.30, 28), basic(0xffffff, { map: mirrorTex, toneMapped: true }));
  mirror.position.set(0, 2.48, 0.30);
  mirrorPole.add(mirror);
  const mirrorRim = new THREE.Mesh(new THREE.TorusGeometry(0.305, 0.028, 8, 30), toon(0xe08a3c));
  mirrorRim.position.set(0, 2.48, 0.30);
  mirrorPole.add(mirrorRim);
  const mirrorBack = new THREE.Mesh(new THREE.CylinderGeometry(0.31, 0.31, 0.05, 24), toon(0x3b3f49));
  mirrorBack.rotation.x = Math.PI / 2;
  mirrorBack.position.set(0, 2.48, 0.26);
  mirrorPole.add(mirrorBack);

  /* ================================================================ */
  /*  Vending machines                                                 */
  /* ================================================================ */
  function vending(z, scheme) {
    const g = new THREE.Group();
    g.position.set(1.95, 0.1, z);
    root.add(g);
    const bodyCol = scheme === 0 ? 0xe9e6dd : 0xdfe6ec;
    box(g, 0.64, 1.88, 0.90, 0, 0.94, 0, toon(bodyCol), { outline: 0.007 });
    box(g, 0.66, 0.10, 0.92, 0, 1.90, 0, toon(scheme === 0 ? 0xb63a36 : 0x2b5f9e));
    plane(g, 0.86, 1.74, 0.322, 0.94, 0, basic(0xffffff, { map: vendingTexture(scheme), toneMapped: false }), { ry: Math.PI / 2 });
    box(g, 0.10, 0.22, 0.52, 0.36, 0.42, 0, toon(0x2a2d34));
    box(g, 0.05, 0.02, 0.30, 0.39, 0.31, 0, toon(0x15181e));
    glow(g, scheme === 0 ? 0xffd2c4 : 0xcfe8ff, 1.5, 0.15, 0.55, 1.15, 0);
    const l = new THREE.PointLight(scheme === 0 ? 0xffb9a0 : 0xa8d8ff, 2.4, 2.6, 2);
    l.position.set(0.7, 1.2, 0);
    g.add(l);
    return g;
  }
  vending(-0.85, 0);
  vending(-1.75, 1);

  /* ================================================================ */
  /*  Bicycle                                                          */
  /* ================================================================ */
  const bike = new THREE.Group();
  bike.position.set(2.18, 0.1, -2.52);
  bike.rotation.y = Math.PI / 2;
  root.add(bike);
  const bikeFrame = toon(0x335f5c);
  const bikeDark = toon(0x22262e);
  const chrome = toon(0x9aa2ad);
  const wheelGeo = new THREE.TorusGeometry(0.29, 0.018, 6, 22);
  const spokeGeo = new THREE.CylinderGeometry(0.004, 0.004, 0.55, 4);
  for (const wx of [-0.44, 0.44]) {
    const wheel = new THREE.Mesh(wheelGeo, bikeDark);
    wheel.position.set(wx, 0.30, 0);
    bike.add(wheel);
    for (let i = 0; i < 6; i++) {
      const sp = new THREE.Mesh(spokeGeo, chrome);
      sp.position.set(wx, 0.30, 0);
      sp.rotation.z = (i / 6) * Math.PI;
      bike.add(sp);
    }
  }
  const p = (x, y) => new THREE.Vector3(x, y, 0);
  const bb = p(0.02, 0.33);
  const seat = p(-0.12, 0.68);
  const head = p(0.37, 0.60);
  tubeBetween(bike, p(-0.44, 0.30), bb, 0.017, bikeFrame);
  tubeBetween(bike, p(-0.44, 0.30), seat, 0.015, bikeFrame);
  tubeBetween(bike, bb, seat, 0.019, bikeFrame);
  tubeBetween(bike, bb, head, 0.019, bikeFrame);
  tubeBetween(bike, seat, head, 0.017, bikeFrame);
  tubeBetween(bike, p(0.44, 0.30), head, 0.017, chrome);
  tubeBetween(bike, p(-0.44, 0.30), p(-0.44, 0.30), 0.01, bikeDark);
  tubeBetween(bike, p(-0.44, 0.30), p(-0.30, 0.44), 0.012, bikeFrame);
  tubeBetween(bike, bb, p(0.20, 0.26), 0.012, bikeFrame);
  box(bike, 0.22, 0.05, 0.10, -0.10, 0.73, 0, toon(0x1f232b));
  box(bike, 0.06, 0.10, 0.06, -0.10, 0.69, 0, bikeDark);
  // handlebar
  tubeBetween(bike, head, p(0.38, 0.76), 0.015, chrome);
  box(bike, 0.04, 0.04, 0.42, 0.38, 0.76, 0, chrome);
  for (const dz of [-0.21, 0.21]) box(bike, 0.05, 0.05, 0.10, 0.38, 0.76, dz, bikeDark);
  // front basket
  const basket = new THREE.Group();
  basket.position.set(0.45, 0.62, 0);
  bike.add(basket);
  for (let i = 0; i < 4; i++) {
    box(basket, 0.24, 0.015, 0.015, 0, 0.02 + i * 0.05, -0.09, chrome);
    box(basket, 0.24, 0.015, 0.015, 0, 0.02 + i * 0.05, 0.09, chrome);
  }
  for (let i = 0; i < 4; i++) {
    box(basket, 0.015, 0.015, 0.19, -0.11 + i * 0.075, 0.02, 0, chrome);
  }
  // rear rack + kickstand + reflector
  box(bike, 0.30, 0.02, 0.20, -0.38, 0.55, 0, chrome);
  tubeBetween(bike, p(-0.36, 0.54), p(-0.48, 0.30), 0.008, chrome);
  tubeBetween(bike, bb, p(0.12, 0.10), 0.01, bikeDark);
  box(bike, 0.04, 0.07, 0.03, -0.48, 0.44, 0, basic(0xd8453c, { toneMapped: true }));

  /* ================================================================ */
  /*  Bins / umbrella stand / notice board                             */
  /* ================================================================ */
  const binLabels = canvasTex(128, 128, (g, w, h) => {
    g.fillStyle = '#f4f1e8';
    g.fillRect(0, 0, w, h);
    g.fillStyle = '#2b6a60';
    g.font = 'bold 22px "Hiragino Sans", sans-serif';
    g.textAlign = 'center';
    g.fillText('かん', w / 2, 34);
    g.fillText('びん', w / 2, 78);
    g.strokeStyle = '#2b6a60';
    g.lineWidth = 4;
    g.beginPath(); g.arc(w / 2, 96, 14, 0, Math.PI * 2); g.stroke();
    g.textAlign = 'left';
  });
  function bin(x, z, col) {
    box(root, 0.34, 0.56, 0.34, x, 0.38, z, toon(col), { outline: 0.005 });
    box(root, 0.38, 0.06, 0.38, x, 0.69, z, toon(0x333840));
    box(root, 0.22, 0.10, 0.02, x, 0.58, z + 0.171, basic(0x0a0c10));
    plane(root, 0.20, 0.20, x, 0.40, z + 0.173, basic(0xffffff, { map: binLabels, toneMapped: true }));
  }
  bin(-2.42, 0.98, 0x3f6f9c);
  bin(-2.03, 0.98, 0x6c717c);

  // umbrella stand
  const umbStand = new THREE.Group();
  umbStand.position.set(1.02, 0.1, 1.02);
  root.add(umbStand);
  cyl(umbStand, 0.17, 0.15, 0.42, 0, 0.21, 0, toon(0x384049), { seg: 14, outline: 0.005 });
  cyl(umbStand, 0.14, 0.14, 0.03, 0, 0.42, 0, toon(0x1f242b), { seg: 14 });
  const umbCols = [0x8fd8f0, 0xf0a8c0, 0xdfe8f0, 0x9fb8e8];
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + 0.4;
    const ux = Math.cos(a) * 0.055;
    const uz = Math.sin(a) * 0.055;
    const shaft = cyl(umbStand, 0.008, 0.008, 0.78, ux, 0.72, uz, toon(0x30343b), { seg: 5 });
    shaft.rotation.z = Math.cos(a) * 0.10;
    shaft.rotation.x = Math.sin(a) * 0.10;
    const canopy = new THREE.Mesh(
      new THREE.ConeGeometry(0.075, 0.28, 8, 1, true),
      basic(umbCols[i], { transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false, toneMapped: true })
    );
    canopy.position.set(ux * 1.5, 0.78, uz * 1.5);
    canopy.rotation.z = Math.cos(a) * 0.10;
    canopy.rotation.x = Math.sin(a) * 0.10;
    umbStand.add(canopy);
  }

  // notice board near the alley mouth
  const nb = new THREE.Group();
  nb.position.set(-3.08, 0.1, 1.36);
  root.add(nb);
  box(nb, 0.05, 1.30, 0.05, -0.36, 0.65, 0, toon(0x4c4338));
  box(nb, 0.05, 1.30, 0.05, 0.36, 0.65, 0, toon(0x4c4338));
  box(nb, 0.86, 1.06, 0.06, 0, 1.18, 0, toon(0x5a4a38), { outline: 0.005 });
  plane(nb, 0.80, 1.00, 0, 1.18, 0.035, basic(0xffffff, { map: noticeBoardTexture(), toneMapped: true }));
  box(nb, 0.96, 0.05, 0.20, 0, 1.75, 0, toon(0x3f362c));
  glow(nb, 0xffcf9c, 0.8, 0.10, 0, 1.55, 0.15);

  /* ================================================================ */
  /*  Alley, neighbor building, service side                           */
  /* ================================================================ */
  // neighbor building (left)
  const neighborMat = toon(0x47434f);
  box(root, 1.2, 3.4, 4.3, -4.05, 1.7, -1.45, neighborMat, { outline: 0.01 });
  box(root, 1.24, 0.18, 4.34, -4.05, 3.48, -1.45, toon(0x35313c));
  box(root, 1.2, 0.24, 0.10, -4.05, 3.58, 0.70, toon(0x35313c));
  for (const y of [1.05, 1.62, 2.19, 2.76]) {
    box(root, 1.18, 0.012, 0.012, -4.05, y, 0.704, toon(0x3a3741));
  }
  // windows on front
  const winLit = neighborWindowTexture(true);
  const winDark = neighborWindowTexture(false);
  plane(root, 0.58, 0.72, -4.22, 2.55, 0.706, basic(0xffffff, { map: winLit, toneMapped: true }));
  box(root, 0.66, 0.06, 0.08, -4.22, 2.15, 0.71, toon(0x55505a));
  plane(root, 0.50, 0.62, -3.66, 1.55, 0.706, basic(0xffffff, { map: winDark, toneMapped: true }));
  box(root, 0.58, 0.05, 0.08, -3.66, 1.20, 0.71, toon(0x55505a));
  // ground floor door + porch light
  box(root, 0.42, 1.05, 0.06, -3.72, 0.62, 0.705, toon(0x2c2932));
  box(root, 0.05, 1.05, 0.06, -3.94, 0.62, 0.705, toon(0x55505a));
  box(root, 0.05, 1.05, 0.06, -3.50, 0.62, 0.705, toon(0x55505a));
  box(root, 0.10, 0.06, 0.10, -3.72, 1.32, 0.76, toon(0x2c3038));
  glow(root, 0xffc27a, 0.7, 0.18, -3.72, 1.30, 0.86);
  const porchLight = new THREE.PointLight(0xffb878, 1.2, 2.2, 2);
  porchLight.position.set(-3.72, 1.3, 0.95);
  root.add(porchLight);
  // vertical snack sign
  const snackTex = snackSignTexture();
  box(root, 0.30, 1.02, 0.12, -3.83, 2.65, 0.76, toon(0x2b1c2a), { outline: 0.004 });
  plane(root, 0.28, 0.98, -3.83, 2.65, 0.823, basic(0xffffff, { map: snackTex, toneMapped: false }));
  const snackGlow = glow(root, 0xff7fb0, 1.1, 0.20, -3.83, 2.65, 0.92);
  const snackLight = new THREE.PointLight(0xff7fb0, 2.2, 3.0, 2);
  snackLight.position.set(-3.5, 2.6, 1.1);
  root.add(snackLight);
  // drain pipe + roof bits
  cyl(root, 0.045, 0.045, 3.3, -3.51, 1.75, 0.58, toon(0x5c5f68));
  box(root, 0.7, 0.55, 0.7, -4.3, 3.85, -2.3, toon(0x4b4e58));
  cyl(root, 0.32, 0.32, 0.62, -4.15, 4.35, -1.1, toon(0x737883), { seg: 14 });
  box(root, 0.03, 1.2, 0.03, -3.7, 4.1, -0.4, toon(0x3a3d45));
  // air conditioner on neighbor wall
  const acBox = box(root, 0.24, 0.42, 0.56, -3.36, 2.95, -0.5, toon(0xbfc4cc), { outline: 0.004 });
  const acRing = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.014, 5, 16), toon(0x3a3f49));
  acRing.rotation.y = Math.PI / 2;
  acRing.position.set(-3.23, 2.95, -0.5);
  root.add(acRing);

  // alley floor detail
  plane(root, 0.72, 3.7, -3.08, 0.006, -1.1, basic(0x1a1d26, { toneMapped: true }), { rx: -Math.PI / 2 });
  // alley clutter
  const crateCols = [0x8a3b35, 0x2f4d6e, 0x8a3b35];
  for (let i = 0; i < 3; i++) {
    box(root, 0.34, 0.28, 0.34, -3.12, 0.14 + i * 0.29, -2.55, toon(crateCols[i]), { outline: 0.004 });
    box(root, 0.30, 0.03, 0.03, -3.12, 0.22 + i * 0.29, -2.38, toon(0x2a2a30));
  }
  const bagMat = toon(0x1c1f27);
  for (let i = 0; i < 3; i++) {
    const bag = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), bagMat);
    bag.scale.set(1.1, 0.75, 1.0);
    bag.position.set(-3.18 + (i - 1) * 0.16, 0.13, -1.55 + (i % 2) * 0.16);
    bag.castShadow = true;
    root.add(bag);
  }
  // alley wall lamp
  box(root, 0.12, 0.10, 0.16, -3.38, 2.18, -0.35, toon(0x2c3038));
  plane(root, 0.08, 0.12, -3.29, 2.16, -0.35, basic(0xffe0b0, { toneMapped: true }), { ry: Math.PI / 2 });
  const alleyGlow = glow(root, 0xffb070, 1.3, 0.20, -3.3, 2.1, -0.35);
  const alleyLight = new THREE.PointLight(0xffb070, 2.6, 3.4, 2);
  alleyLight.position.set(-3.2, 2.05, -0.35);
  root.add(alleyLight);
  // pipes along alley wall
  for (const dz of [-2.4, -1.9]) {
    cyl(root, 0.035, 0.035, 2.9, -3.44, 1.55, dz, toon(0x5a5e68));
  }

  // back service area
  plane(root, 4.2, 1.55, -0.6, 0.006, -3.9, basic(0x1a1d26, { toneMapped: true }), { rx: -Math.PI / 2 });
  box(root, 0.82, 1.9, 0.06, 0.3, 1.0, -3.15, toon(0x4a4c54), { outline: 0.005 });
  box(root, 0.72, 0.10, 0.02, 0.3, 1.72, -3.11, toon(0x2a2c33));
  plane(root, 0.32, 0.12, 0.3, 1.48, -3.115, basic(0xffffff, {
    map: canvasTex(256, 96, (g, w, h) => {
      g.fillStyle = '#d9d2c4'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#5a554b'; g.font = 'bold 34px "Hiragino Sans", sans-serif';
      g.textAlign = 'center'; g.fillText('STAFF ONLY', w / 2, 58); g.textAlign = 'left';
    }), toneMapped: true,
  }));
  box(root, 0.08, 0.06, 0.16, 0.3, 2.12, -3.2, toon(0x2c3038));
  glow(root, 0xffc27a, 1.0, 0.14, 0.3, 2.05, -3.3);
  const backLight = new THREE.PointLight(0xffb070, 2.0, 3.0, 2);
  backLight.position.set(0.3, 2.0, -3.4);
  root.add(backLight);
  // back AC + crates
  const backAc = box(root, 0.6, 0.46, 0.28, 1.0, 0.33, -3.45, toon(0xc2c7ce), { outline: 0.004 });
  const backRing = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.014, 5, 16), toon(0x3a3f49));
  backRing.position.set(1.0, 0.36, -3.30);
  root.add(backRing);
  cyl(root, 0.02, 0.02, 1.4, 1.28, 0.8, -3.45, toon(0x4e525b));
  for (let i = 0; i < 2; i++) {
    box(root, 0.36, 0.30, 0.36, -1.9, 0.15 + i * 0.31, -3.75, toon(i ? 0x2f4d6e : 0x8a3b35), { outline: 0.004 });
  }
  for (let i = 0; i < 2; i++) {
    const bag = new THREE.Mesh(new THREE.SphereGeometry(0.17, 10, 8), bagMat);
    bag.scale.set(1.15, 0.72, 1.0);
    bag.position.set(-1.2 + i * 0.28, 0.13, -3.9);
    bag.castShadow = true;
    root.add(bag);
  }
  plane(root, 0.6, 0.02, -0.6, 0.012, -3.9, basic(0x0b0e15, { transparent: true, opacity: 0.7, toneMapped: true }), { rx: -Math.PI / 2 });

  /* ================================================================ */
  /*  Far buildings + traffic signal + parking sign                    */
  /* ================================================================ */
  // low hedges soften the far edge of the diorama
  const hedgeMat = toon(0x24382f);
  const hedgeMat2 = toon(0x2d4638);
  for (const [x, z, w] of [[-2.9, 4.52, 2.8], [2.8, 4.52, 2.4], [4.52, -3.1, 2.4]]) {
    const alongX = w > 0 && Math.abs(x) < 4;
    if (alongX) {
      box(root, w, 0.45, 0.26, x, 0.33, z, hedgeMat, { outline: 0.004 });
      for (let i = 0; i < 5; i++) {
        const b = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 6), hedgeMat2);
        b.position.set(x - w / 2 + 0.3 + i * (w - 0.6) / 4, 0.55, z);
        b.scale.set(1.1, 0.8, 1);
        root.add(b);
      }
    } else {
      box(root, 0.26, 0.45, w, x, 0.33, z, hedgeMat, { outline: 0.004 });
      for (let i = 0; i < 4; i++) {
        const b = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 6), hedgeMat2);
        b.position.set(x, 0.55, z - w / 2 + 0.3 + i * (w - 0.6) / 3);
        b.scale.set(1, 0.8, 1.1);
        root.add(b);
      }
    }
  }

  // parking sign
  cyl(root, 0.035, 0.035, 2.2, 4.36, 1.2, -1.45, toon(0x555b67), { seg: 8 });
  const pTex = canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#1b4f9c'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#f2f4f8'; g.lineWidth = 12; g.strokeRect(10, 10, w - 20, h - 20);
    g.fillStyle = '#f2f4f8'; g.font = 'bold 150px "Helvetica Neue", Arial, sans-serif';
    g.textAlign = 'center'; g.fillText('P', w / 2, 178);
    g.font = 'bold 20px "Hiragino Sans", sans-serif'; g.fillText('月極', w / 2, 218); g.textAlign = 'left';
  });
  plane(root, 0.44, 0.44, 4.36, 2.1, -1.42, basic(0xffffff, { map: pTex, toneMapped: true }));
  plane(root, 0.44, 0.44, 4.36, 2.1, -1.48, basic(0xffffff, { map: pTex, toneMapped: true }), { ry: Math.PI });

  // traffic signal (far corner)
  const tGroup = new THREE.Group();
  tGroup.position.set(4.28, 0.1, -4.02);
  root.add(tGroup);
  cyl(tGroup, 0.05, 0.06, 3.2, 0, 1.6, 0, toon(0x4a505c));
  box(tGroup, 0.92, 0.075, 0.075, -0.46, 3.18, 0, toon(0x4a505c));
  box(tGroup, 0.30, 0.74, 0.18, -0.88, 3.02, 0.02, toon(0x24282f), { outline: 0.004 });
  const sigCols = [0xff4a3d, 0xffc14a, 0x4dff9a];
  const sigMats = [];
  const sigGlows = [];
  const sigY = [3.26, 3.02, 2.78];
  for (let i = 0; i < 3; i++) {
    const mat = basic(0x331111, { toneMapped: true });
    sigMats.push(mat);
    const c = new THREE.Mesh(new THREE.CircleGeometry(0.082, 14), mat);
    c.position.set(-0.88, sigY[i], 0.115);
    tGroup.add(c);
    box(tGroup, 0.20, 0.035, 0.12, -0.88, sigY[i] + 0.105, 0.12, toon(0x1b1e24));
    sigGlows.push(glow(tGroup, sigCols[i], 0.65, 0.0, -0.88, sigY[i], 0.22));
  }
  const trafficPoint = new THREE.PointLight(0xff4a3d, 0, 2.5, 2);
  trafficPoint.position.set(3.6, 2.9, -3.9);
  root.add(trafficPoint);

  /* ================================================================ */
  /*  Animations                                                       */
  /* ================================================================ */
  let sigTimer = 0;
  let sigState = 0; // 0 green, 1 amber, 2 red
  const durations = [5.2, 1.2, 5.0];
  updaters.push((dt, t) => {
    sigTimer += dt;
    if (sigTimer > durations[sigState]) {
      sigTimer = 0;
      sigState = (sigState + 1) % 3;
    }
    const active = [2, 1, 0][sigState];
    for (let i = 0; i < 3; i++) {
      const on = i === active;
      sigMats[i].color.setHex(on ? sigCols[i] : 0x2a2f38);
      sigGlows[i].material.opacity = on ? 0.5 : 0.0;
    }
    const col = sigCols[active];
    trafficPoint.color.setHex(col);
    trafficPoint.intensity = 1.4;
    // pedestrian signal is inverse of vehicle green/red
    const pedGreenOn = sigState === 2;
    pedRed.material.color.setHex(!pedGreenOn ? 0xff4a3d : 0x3a1a1a);
    pedGreen.material.color.setHex(pedGreenOn ? 0x54ffa0 : 0x1a3f2a);
    pedRedGlow.material.opacity = !pedGreenOn ? 0.42 : 0.0;
    pedGreenGlow.material.opacity = pedGreenOn ? 0.42 : 0.0;
    trafficRefl.material.color.setHex(col);
    trafficRefl.material.opacity = 0.40;
    // wet reflection shimmer
    for (const r of reflMats) {
      if (r.mat === trafficRefl.material) continue;
      r.mat.opacity = r.base * (0.86 + 0.14 * Math.sin(t * r.speed + r.phase));
    }
    snackGlow.material.opacity = 0.20 * (0.82 + 0.18 * Math.sin(t * 1.7));
    alleyGlow.material.opacity = 0.20 * (0.9 + 0.1 * Math.sin(t * 2.3));
  });

  return {
    group: root,
    update(dt, t) {
      for (const u of updaters) u(dt, t);
    },
    puddleSpots: puddles,
  };
}

/* ------------------------------------------------------------------ */
/*  reflection streak texture                                          */
/* ------------------------------------------------------------------ */
function makeStreakTexture() {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 512;
  const g = c.getContext('2d');
  const img = g.createImageData(128, 512);
  for (let y = 0; y < 512; y++) {
    const v = y / 511;
    const fade = Math.pow(1 - v, 0.95) * Math.min(1, v * 5 + 0.22);
    for (let x = 0; x < 128; x++) {
      const u = x / 127;
      const edge = Math.min(1, u / 0.15) * Math.min(1, (1 - u) / 0.15);
      const band = 0.74 + 0.26 * Math.sin(u * 34 + Math.sin(u * 9) * 2.0);
      const ripple = 0.86 + 0.14 * Math.sin(v * 52 + u * 17);
      const a = Math.max(0, Math.min(1, edge * fade * band * ripple * 1.35));
      const i = (y * 128 + x) * 4;
      img.data[i] = 255;
      img.data[i + 1] = 255;
      img.data[i + 2] = 255;
      img.data[i + 3] = Math.round(a * 255);
    }
  }
  g.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  return t;
}
