import * as THREE from 'three';
import { STORE, SIDEWALK_Y, PALETTE } from './config.js';
import {
  addBox,
  addCylinder,
  addPlane,
  addGroundPlane,
  addRodBetween,
  addTube,
  addRoundedBox,
  addGlowSprite,
  addGroundGlow,
  toon,
  basic,
  physical,
  planeMaterial,
  canvasTexture,
  vendingTexture,
  noticeBoardTexture,
  JP_FONT,
  LATIN_FONT,
  drawStar,
} from './lib.js';

const topY = SIDEWALK_Y + 0.02;

/* ------------------------------------------------------------------ */
/* Utility poles & wires                                              */
/* ------------------------------------------------------------------ */

function utilityPole(parent, x, z, height, ctx, opts = {}) {
  const g = new THREE.Group();
  g.position.set(x, SIDEWALK_Y, z);
  parent.add(g);
  const concrete = toon(0x8b8d85);
  const metal = toon(0x3a4148);
  const dark = toon(0x252e35);
  addCylinder(g, 0.075, 0.14, height, concrete, 0, height / 2, 0, { segments: 8, cast: true });
  // Banded foot and climbing bolts.
  addCylinder(g, 0.135, 0.155, 0.22, toon(0x676c68), 0, 0.11, 0, { segments: 8, cast: true });
  addCylinder(g, 0.105, 0.13, 0.1, metal, 0, height * 0.52, 0, { segments: 8, cast: true });
  for (let i = 0; i < 7; i++) {
    addBox(g, 0.19, 0.018, 0.018, metal, 0, 1.1 + i * 0.62, 0.085, { cast: false });
    addBox(g, 0.018, 0.024, 0.15, metal, 0, 1.14 + i * 0.62, 0.16, { cast: false });
  }
  // Crossarms.
  const armY = height - 0.95;
  addBox(g, 1.48, 0.09, 0.11, dark, 0, armY, 0, { cast: true });
  addBox(g, 1.0, 0.08, 0.1, dark, 0.04, armY - 0.7, 0, { cast: true });
  for (const ax of [-0.55, 0, 0.55]) {
    addCylinder(g, 0.034, 0.034, 0.17, toon(0xd5d0ba), ax, armY + 0.13, 0, { segments: 7, cast: false });
    addCylinder(g, 0.12, 0.12, 0.03, toon(0x7e8580), ax, armY + 0.04, 0, { segments: 8, cast: false });
  }
  // Pole transformer and junction box.
  addCylinder(g, 0.27, 0.27, 0.61, toon(0x878b84), 0.26, height - 2.25, -0.02, { segments: 12, cast: true });
  addCylinder(g, 0.3, 0.3, 0.035, toon(0x5d6868), 0.26, height - 1.93, -0.02, { segments: 12, cast: false });
  addBox(g, 0.31, 0.46, 0.22, toon(0x505854), -0.28, height - 2.7, 0.1, { cast: true });
  addBox(g, 0.23, 0.035, 0.015, basic(0x2e3938), -0.28, height - 2.58, 0.216, { cast: false });
  // Street lamp bracket halfway up.
  addRodBetween(g, [0.04, height * 0.48, 0], [0.63, height * 0.48, 0.1], 0.022, metal, { cast: false });
  addBox(g, 0.17, 0.06, 0.12, dark, 0.68, height * 0.48 + 0.03, 0.1, { cast: true });
  // Small plaque.
  addBox(g, 0.2, 0.29, 0.018, toon(0xc7c3af), 0, 2.35, 0.132, { cast: false });
  addBox(g, 0.15, 0.04, 0.006, basic(0x353f3e), 0, 2.39, 0.143, { cast: false });
  addBox(g, 0.12, 0.018, 0.006, basic(0x59645f), 0, 2.33, 0.143, { cast: false });
  // Cables hugging the pole.
  addTube(g, [[-0.08, height - 0.78, 0], [-0.12, height - 1.2, 0.03], [-0.3, height - 2.1, 0.08], [-0.3, height - 2.78, 0.1], [-0.26, height - 3.2, 0.04]], 0.018, dark, { segments: 15, radialSegments: 4 });
  addTube(g, [[0.05, height - 0.78, 0], [0.15, height - 1.7, 0.05], [0.22, height - 2.5, 0.03], [0.5, height - 3.1, 0.1], [0.52, 0.4, 0.1]], 0.018, dark, { segments: 18, radialSegments: 4 });
  if (opts.withTransformer !== false) {
    addGlowSprite(g, 0xffd8a2, 0.55, 0.26, height - 1.95, 0.3, 0.08);
  }
  return g;
}

function sag(a, b, sagAmount, n = 22) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const x = a[0] + (b[0] - a[0]) * t;
    const z = a[2] + (b[2] - a[2]) * t;
    const y = a[1] + (b[1] - a[1]) * t - Math.sin(Math.PI * t) * sagAmount;
    pts.push([x, y, z]);
  }
  return pts;
}

function utilityPoles(parent, ctx) {
  const poleA = utilityPole(parent, 5.72, -0.62, 8.25, ctx);
  const poleB = utilityPole(parent, -5.62, -5.02, 7.3, ctx, { withTransformer: false });
  const wireMat = toon(0x111a22, { outline: false });
  wireMat.userData.outlineParameters = { visible: false };

  const starts = [
    [5.34, 7.9, -0.62],
    [5.56, 7.64, -0.55],
    [5.78, 7.38, -0.62],
    [6.02, 7.58, -0.7],
  ];
  const ends = [
    [-5.39, 6.8, -5.02],
    [-5.19, 6.66, -5.08],
    [-5.59, 6.72, -5.15],
    [-5.42, 6.54, -4.88],
  ];
  for (let i = 0; i < starts.length; i++) {
    const pts = sag(starts[i], ends[i], 0.55 + i * 0.06, 28);
    addTube(parent, pts, 0.012 + i * 0.0015, wireMat, { segments: 54, radialSegments: 3, cast: false });
  }

  // Service drops from the near pole to the shop eave and neighbouring roofline.
  addTube(parent, sag([5.7, 6.25, -0.63], [2.25, 4.08, 0.4], 0.2, 18), 0.01, wireMat, { segments: 38, radialSegments: 3 });
  addTube(parent, sag([5.64, 6.08, -0.7], [-3.98, 3.72, -1.2], 0.36, 18), 0.009, wireMat, { segments: 38, radialSegments: 3 });
  addTube(parent, sag([-5.6, 6.72, -5.0], [-5.28, 5.4, 1.55], 0.16, 18), 0.011, wireMat, { segments: 34, radialSegments: 3 });


  // Warning tags flutter, very slightly.
  const tags = [];
  for (let i = 0; i < 3; i++) {
    const tag = addBox(parent, 0.14, 0.18, 0.01, toon(i === 1 ? 0xd4c15b : 0x80ad8d, { side: THREE.DoubleSide }), 4.9 + i * 0.33, 5.75 - i * 0.1, 0.45 + i * 0.1, {
      cast: false,
      receive: false,
    });
    tag.rotation.z = 0.12 * (i - 1);
    tags.push({ mesh: tag, phase: i * 0.8 });
  }
  ctx.updaters.push({
    update(t) {
      for (const tag of tags) {
        tag.mesh.rotation.z = 0.12 + Math.sin(t * 1.8 + tag.phase) * 0.055;
      }
    },
  });

  // A small lamp on the near pole, as if the alley light reaches up there.
  addGlowSprite(parent, 0xffd49b, 0.9, 5.16, 4.02, -0.58, 0.1);
}

/* ------------------------------------------------------------------ */
/* Street lamp                                                        */
/* ------------------------------------------------------------------ */

function coneAlphaTexture() {
  return canvasTexture(128, 512, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, 'rgba(255,255,255,0)');
    g.addColorStop(0.18, 'rgba(255,255,255,0.42)');
    g.addColorStop(0.8, 'rgba(255,255,255,0.12)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  });
}

function streetLight(parent, ctx) {
  const g = new THREE.Group();
  g.position.set(3.14, topY, 2.78);
  parent.add(g);
  const poleMat = toon(0x263d45);
  const metal = toon(0x364b51);
  const lampMat = basic(0xfff0c2);
  const lampHousing = toon(0x253a40);
  addCylinder(g, 0.095, 0.16, 0.34, toon(0x465b5d), 0, 0.17, 0, { segments: 10 });
  addCylinder(g, 0.055, 0.085, 4.28, poleMat, 0, 2.42, 0, { segments: 9, cast: true });
  addCylinder(g, 0.085, 0.075, 0.1, metal, 0, 4.55, 0, { segments: 9, cast: true });
  // Small utility boxes on the mast.
  addBox(g, 0.21, 0.46, 0.17, toon(0x4b5c5c), 0.08, 1.72, 0, { cast: true });
  addBox(g, 0.15, 0.02, 0.012, toon(0x1b262a), 0.08, 1.81, 0.09, { cast: false });
  addBox(g, 0.05, 0.05, 0.03, basic(0xe3b36f), 0.08, 1.56, 0.09, { cast: false });

  const armPts = [
    [0, 4.43, 0],
    [0.18, 4.63, 0.02],
    [0.49, 4.72, 0.08],
    [0.78, 4.68, 0.14],
    [0.92, 4.59, 0.18],
  ];
  addTube(g, armPts, 0.04, poleMat, { segments: 22, radialSegments: 6, cast: true });
  addTube(g, [[0.1, 4.55, 0], [0.4, 4.54, 0.07], [0.72, 4.51, 0.14]], 0.018, metal, { segments: 12, radialSegments: 4 });
  // Lamp head, a clean little capsule pointing over the parking corner.
  addRoundedBox(g, 0.62, 0.09, 0.24, 0.045, lampHousing, 1.04, 4.58, 0.22, { segments: 2, cast: true });
  addBox(g, 0.48, 0.025, 0.16, lampMat, 1.05, 4.525, 0.22, { cast: false });
  addBox(g, 0.18, 0.06, 0.18, lampHousing, 0.8, 4.585, 0.22, { cast: false });
  // A little frosted opal globe catches the rain and makes the lamp legible from afar.
  const globe = new THREE.Mesh(new THREE.SphereGeometry(0.145, 12, 9), basic(0xfff1ca));
  globe.position.set(1.05, 4.43, 0.22);
  g.add(globe);
  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.145, 0.018, 4, 12), metal);
  collar.position.set(1.05, 4.52, 0.22);
  collar.rotation.x = Math.PI / 2;
  g.add(collar);
  addGlowSprite(g, 0xffe4a7, 1.5, 1.05, 4.43, 0.22, 0.42);
  addGlowSprite(g, 0xfff3d2, 0.62, 1.05, 4.42, 0.22, 0.4);

  // Soft volume of light in the rain.
  const coneGeo = new THREE.ConeGeometry(1.65, 3.95, 28, 1, true);
  const coneMat = basic(0xffecc4, {
    map: coneAlphaTexture(),
    transparent: true,
    opacity: 0.105,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const cone = new THREE.Mesh(coneGeo, coneMat);
  cone.position.set(1.05, 2.45, 0.22);
  g.add(cone);
  const innerCone = new THREE.Mesh(new THREE.ConeGeometry(0.75, 3.7, 20, 1, true), basic(0xffe5af, {
    map: coneAlphaTexture(),
    transparent: true,
    opacity: 0.055,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  }));
  innerCone.position.set(1.05, 2.5, 0.22);
  g.add(innerCone);

  addGroundGlow(parent, 0xffe6b3, 3.1, 3.4, 4.16, 3.04, 0.22, 0.052);
  addGroundGlow(parent, 0xffcf86, 1.5, 1.5, 4.16, 3.04, 0.16, 0.053);
  ctx.lights.push({
    type: 'point',
    color: 0xffda9b,
    intensity: 13.0,
    distance: 7.8,
    pos: [4.19, 4.24, 3.0],
  });

  // Street name plate hugging the lamp post.
  const signTex = canvasTexture(1024, 280, (ctx2, w, h) => {
    ctx2.fillStyle = '#24607a';
    roundFill(ctx2, 0, 0, w, h, 18);
    ctx2.strokeStyle = '#d8eef1';
    ctx2.lineWidth = 9;
    ctx2.strokeRect(14, 14, w - 28, h - 28);
    ctx2.fillStyle = '#f0f6e9';
    ctx2.font = `700 82px ${JP_FONT}`;
    ctx2.textAlign = 'left';
    ctx2.fillText('星見町二丁目', 62, 135);
    ctx2.font = `700 34px ${LATIN_FONT}`;
    ctx2.letterSpacing = '4px';
    ctx2.fillStyle = '#bce4e8';
    ctx2.fillText('HOSHIZORA-MACHI 2', 66, 206);
    ctx2.textAlign = 'right';
    ctx2.font = `700 31px ${LATIN_FONT}`;
    ctx2.fillStyle = '#d9edf0';
    ctx2.fillText('雨 / 夜間', w - 58, 206);
    drawStar(ctx2, w - 90, 101, 44, 14, '#f4c27f', 4);
  });
  addBox(g, 0.98, 0.31, 0.055, toon(0x344c52), 0, 2.46, 0.07, { cast: true });
  addPlane(g, 0.92, 0.26, planeMaterial(signTex), 0, 2.46, 0.103);
  // Small lower sign: watch for bicycles.
  const smallTex = canvasTexture(512, 340, (ctx2, w, h) => {
    ctx2.fillStyle = '#ebdfc0';
    ctx2.fillRect(0, 0, w, h);
    ctx2.strokeStyle = '#b24e3d';
    ctx2.lineWidth = 22;
    ctx2.strokeRect(18, 18, w - 36, h - 36);
    ctx2.fillStyle = '#5f4833';
    ctx2.font = `700 44px ${JP_FONT}`;
    ctx2.textAlign = 'center';
    ctx2.fillText('自転車', w / 2, 140);
    ctx2.fillText('注意', w / 2, 200);
    ctx2.font = `700 24px ${LATIN_FONT}`;
    ctx2.fillText('WATCH FOR BIKES', w / 2, 268);
  });
  addBox(g, 0.46, 0.32, 0.03, toon(0x685c48), 0, 1.55, 0.085, { cast: false });
  addPlane(g, 0.42, 0.27, planeMaterial(smallTex), 0, 1.55, 0.105);

  return g;
}

function roundFill(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  ctx.fill();
}

/* ------------------------------------------------------------------ */
/* Traffic signal                                                     */
/* ------------------------------------------------------------------ */

function trafficSignal(parent, ctx) {
  const g = new THREE.Group();
  g.position.set(5.74, SIDEWALK_Y, -5.18);
  parent.add(g);
  const poleMat = toon(0x3d4b4d);
  addCylinder(g, 0.07, 0.09, 3.82, poleMat, 0, 1.91, 0, { segments: 8, cast: true });
  addCylinder(g, 0.1, 0.12, 0.18, toon(0x707973), 0, 0.09, 0, { segments: 8, cast: true });
  addBox(g, 0.94, 0.35, 0.22, toon(0x222f32), 0.32, 3.62, 0, { cast: true });
  // Hooded visors.
  for (let i = 0; i < 3; i++) {
    const x = -0.05 + i * 0.37;
    addBox(g, 0.35, 0.06, 0.28, toon(0x1a2428), x, 3.795, 0.09, { cast: true, rx: -0.1 });
  }
  const lensMats = [];
  const lensColors = [0x5f2627, 0x675524, 0x1c5548];
  for (let i = 0; i < 3; i++) {
    const mat = basic(lensColors[i]);
    const lens = new THREE.Mesh(new THREE.CircleGeometry(0.105, 20), mat);
    lens.position.set(-0.05 + i * 0.37, 3.62, 0.12);
    g.add(lens);
    lensMats.push(mat);
  }
  const glow = addGlowSprite(g, 0x69f2bd, 1.15, 0.69, 3.62, 0.2, 0.36);
  const redGlow = addGlowSprite(g, 0xff7565, 0.75, -0.05, 3.62, 0.2, 0.0);
  const amberGlow = addGlowSprite(g, 0xffd26d, 0.8, 0.32, 3.62, 0.2, 0.0);
  // Horizontal backing plate and a little hood.
  addBox(g, 0.98, 0.06, 0.28, toon(0x151f23), 0.32, 3.84, 0.06, { cast: true });
  addBox(g, 0.22, 0.22, 0.2, toon(0x354143), 0.32, 3.3, 0.02, { cast: true });
  addGlowSprite(g, 0x95f7d0, 0.6, 0.32, 3.3, 0.14, 0.15);

  // Pedestrian signal lower down.
  addBox(g, 0.28, 0.46, 0.2, toon(0x263436), 0.04, 2.28, 0, { cast: true });
  const pedRed = basic(0xff6b61);
  const pedGreen = basic(0x57e6b2);
  const pedRedMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.17, 0.16), pedRed);
  pedRedMesh.position.set(0.04, 2.39, 0.11);
  g.add(pedRedMesh);
  const pedGreenMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.17, 0.16), pedGreen);
  pedGreenMesh.position.set(0.04, 2.18, 0.11);
  g.add(pedGreenMesh);
  const pedGlow = addGlowSprite(g, 0x8cf4cc, 0.58, 0.04, 2.18, 0.14, 0.16);
  addGlowSprite(g, 0xffe2a8, 0.9, 0.32, 3.75, 0.3, 0.06);

  const signalColors = [0xff6b60, 0xffd36b, 0x69f2bd];
  const darkColors = [0x231012, 0x241e0f, 0x081511];
  ctx.updaters.push({
    update(t) {
      const phase = (t + 4.5) % 15;
      let active = 2;
      if (phase > 7.0 && phase < 9.2) active = 1;
      else if (phase >= 9.2) active = 0;
      for (let i = 0; i < 3; i++) {
        lensMats[i].color.setHex(i === active ? signalColors[i] : darkColors[i]);
      }
      glow.material.opacity = active === 2 ? 0.34 : 0.0;
      amberGlow.material.opacity = active === 1 ? 0.25 : 0.0;
      redGlow.material.opacity = active === 0 ? 0.25 : 0.0;
      const walk = active === 2 ? Math.sin(t * 3.4) > -0.5 : false;
      pedGreen.color.setHex(walk ? 0x57e6b2 : 0x143d35);
      pedRed.color.setHex(!walk ? 0xff6b61 : 0x501f20);
      pedGlow.material.opacity = walk ? 0.16 : 0.09;
      pedGlow.material.color.setHex(walk ? 0x8cf4cc : 0xff9d8d);
    },
  });

  addGroundGlow(parent, 0x6cf1bd, 0.85, 0.8, 5.35, -4.6, 0.12, 0.048);
}

/* ------------------------------------------------------------------ */
/* Vending machine + bins                                             */
/* ------------------------------------------------------------------ */

function vendingMachine(parent, ctx, opts = {}) {
  const x = opts.x ?? 2.62;
  const z = opts.z ?? -3.35;
  const ry = opts.ry ?? 0;
  const g = new THREE.Group();
  g.position.set(x, topY, z);
  g.rotation.y = ry;
  parent.add(g);
  const bodyMat = toon(0x1f3942);
  const edge = toon(0x09202a);
  addRoundedBox(g, 0.72, 1.92, 1.03, 0.055, bodyMat, 0, 0.96, 0, { segments: 2, cast: true });
  addBox(g, 0.74, 0.09, 1.05, edge, 0, 1.955, 0, { cast: true });
  addBox(g, 0.66, 0.04, 0.93, edge, 0, 0.04, 0, { cast: true });
  // Display face.
  const tex = vendingTexture();
  addPlane(g, 1.0, 1.78, planeMaterial(tex), 0.366, 1.01, 0.0, { ry: Math.PI / 2 });
  // Glowing side spill and selection rails.
  addBox(g, 0.015, 1.48, 0.018, basic(0x73e9d4, { transparent: true, opacity: 0.62 }), 0.372, 1.03, 0.49, { cast: false });
  addBox(g, 0.015, 1.48, 0.018, basic(0xff8fb4, { transparent: true, opacity: 0.46 }), 0.372, 1.03, -0.49, { cast: false });
  addBox(g, 0.055, 0.16, 0.15, toon(0x0b2229), 0.39, 0.49, 0.31, { cast: false });
  addBox(g, 0.02, 0.055, 0.14, basic(0x101d20), 0.424, 0.5, 0.31, { cast: false });
  addBox(g, 0.08, 0.15, 0.27, toon(0xb9dfd5), 0.39, 0.2, -0.32, { cast: false });
  addBox(g, 0.018, 0.04, 0.22, basic(0x1c3031), 0.43, 0.22, -0.32, { cast: false });
  addBox(g, 0.05, 0.05, 0.05, toon(0x576462), 0.27, 0.17, 0.48, { cast: true, ry: 0.3 });
  addGlowSprite(g, 0x84e9e1, 1.75, 0.48, 1.25, 0.0, 0.16);
  addGlowSprite(g, 0xff90be, 1.2, 0.57, 0.84, -0.42, 0.12);
  const lightX = x + Math.cos(ry) * 0.48;
  const lightZ = z - Math.sin(ry) * 0.48;
  ctx.lights.push({ type: 'point', color: 0x9cefe4, intensity: 8.5, distance: 3.8, pos: [lightX, 1.34, lightZ] });
  addGroundGlow(parent, 0x79e7dd, 1.7, 1.8, x, z + 0.58, 0.12, 0.158);
  addGroundGlow(parent, 0xff8fb5, 0.85, 1.2, x + 0.2, z + 1.0, 0.08, 0.158);

  // A tidy little recycling crate beside the machine.
  addBox(g, 0.34, 0.28, 0.42, toon(0x9fc9bf), 0.48, 0.14, 0.66, { cast: true });
  addBox(g, 0.28, 0.06, 0.36, toon(0x31584f), 0.48, 0.21, 0.66, { cast: false });
  addCylinder(g, 0.04, 0.04, 0.17, toon(0xe7ece0), 0.48, 0.34, 0.72, { segments: 8, cast: false, rz: 0.2 });
}

function trashStation(parent) {
  const g = new THREE.Group();
  g.position.set(2.53, topY, 2.3);
  parent.add(g);
  addBox(g, 0.82, 0.76, 0.5, toon(0x294c4c), 0, 0.38, 0, { cast: true });
  addBox(g, 0.87, 0.08, 0.55, toon(0x183636), 0, 0.8, 0, { cast: true });
  const colors = [0xd57b52, 0x65b99e, 0x6a98be];
  const labels = ['もえる', 'かん', 'びん'];
  const texs = labels.map((label, i) => canvasTexture(256, 128, (ctx, w, h) => {
    ctx.fillStyle = 'rgba(245,243,223,0.92)';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = ['#b8513c', '#347e64', '#456e91'][i];
    ctx.font = `700 33px ${JP_FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText(label, w / 2, 57);
    ctx.font = `700 16px ${LATIN_FONT}`;
    ctx.fillText(['BURN', 'CAN', 'BOTTLE'][i], w / 2, 91);
  }));
  for (let i = 0; i < 3; i++) {
    const x = -0.27 + i * 0.27;
    addBox(g, 0.235, 0.37, 0.02, toon(0x10292a), x, 0.47, 0.255, { cast: false });
    addPlane(g, 0.22, 0.115, planeMaterial(texs[i]), x, 0.47, 0.27);
    addBox(g, 0.055, 0.15, 0.02, basic(colors[i]), x, 0.69, 0.26, { cast: false });
  }
  addBox(g, 0.64, 0.02, 0.04, toon(0x162d2e), 0, 0.19, 0.26, { cast: false });
}

/* ------------------------------------------------------------------ */
/* Bicycle                                                            */
/* ------------------------------------------------------------------ */

function bicycle(parent, ctx, opts = {}) {
  const g = new THREE.Group();
  g.position.set(opts.x ?? 2.58, topY, opts.z ?? -1.1);
  g.rotation.y = opts.ry ?? 0.07;
  g.rotation.z = opts.lean ?? -0.075;
  parent.add(g);
  const frameMat = toon(opts.color ?? 0x789c91);
  const dark = toon(0x232d30);
  const silver = toon(0xaeb8b1);
  const tireMat = toon(0x1b2528);
  const wheelZ = 0.53;
  const wheelR = 0.32;
  const wheelY = 0.33;
  for (const z of [-wheelZ, wheelZ]) {
    const wheel = new THREE.Mesh(new THREE.TorusGeometry(wheelR, 0.023, 6, 24), tireMat);
    wheel.position.set(0, wheelY, z);
    wheel.rotation.y = Math.PI / 2;
    wheel.castShadow = true;
    g.add(wheel);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(wheelR - 0.025, 0.007, 4, 24), silver);
    rim.position.set(0, wheelY, z);
    rim.rotation.y = Math.PI / 2;
    g.add(rim);
    // Spokes.
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      addRodBetween(
        g,
        [0, wheelY, z],
        [Math.sin(a) * (wheelR - 0.035), wheelY + Math.cos(a) * (wheelR - 0.035), z],
        0.0035,
        silver,
        { cast: false, segments: 4 },
      );
    }
    addCylinder(g, 0.027, 0.027, 0.075, dark, 0, wheelY, z, { rx: Math.PI / 2, segments: 8 });
    // Half fenders.
    const fender = new THREE.Mesh(new THREE.TorusGeometry(wheelR + 0.027, 0.02, 4, 18, Math.PI * 1.1), toon(0x668b83));
    fender.position.set(0, wheelY, z);
    fender.rotation.y = Math.PI / 2;
    fender.rotation.z = 0.7;
    fender.castShadow = true;
    g.add(fender);
  }
  // Frame: the classic step-through city bicycle silhouette.
  const bottom = [0, 0.22, 0];
  const seatBase = [0, 0.63, -0.16];
  const headBase = [0, 0.57, 0.31];
  addRodBetween(g, [0, wheelY, -wheelZ], seatBase, 0.018, frameMat);
  addRodBetween(g, [0, wheelY, -wheelZ], bottom, 0.016, frameMat);
  addRodBetween(g, bottom, seatBase, 0.017, frameMat);
  addRodBetween(g, bottom, [0, 0.58, 0.37], 0.018, frameMat);
  addRodBetween(g, [0, 0.58, 0.37], headBase, 0.02, frameMat);
  addRodBetween(g, [0, 0.57, 0.38], [0, wheelY, wheelZ], 0.015, silver);
  addRodBetween(g, [0, 0.58, 0.37], [0, 0.92, 0.3], 0.017, silver);
  addRodBetween(g, [-0.23, 0.9, 0.3], [0.23, 0.9, 0.3], 0.012, silver);
  // Handlebar and grips.
  addRodBetween(g, [0, 0.9, 0.3], [-0.22, 1.01, 0.35], 0.013, silver);
  addRodBetween(g, [0, 0.9, 0.3], [0.22, 1.01, 0.35], 0.013, silver);
  addCylinder(g, 0.018, 0.018, 0.1, dark, -0.23, 1.01, 0.35, { rz: Math.PI / 2, segments: 6 });
  addCylinder(g, 0.018, 0.018, 0.1, dark, 0.23, 1.01, 0.35, { rz: Math.PI / 2, segments: 6 });
  // Saddle.
  addBox(g, 0.14, 0.05, 0.28, toon(0x513a32), 0, 1.02, -0.27, { cast: true });
  addCylinder(g, 0.018, 0.018, 0.22, silver, 0, 0.91, -0.26, { segments: 6, cast: false });
  // Rear rack.
  addBox(g, 0.27, 0.025, 0.35, silver, 0, 0.63, -0.58, { cast: true });
  addRodBetween(g, [-0.12, 0.63, -0.5], [-0.12, 0.31, -0.55], 0.008, silver, { cast: false });
  addRodBetween(g, [0.12, 0.63, -0.5], [0.12, 0.31, -0.55], 0.008, silver, { cast: false });
  // Front basket.
  addBox(g, 0.33, 0.18, 0.28, toon(0x7f908a, { transparent: true, opacity: 0.8 }), 0, 0.9, 0.5, { cast: true });
  addBox(g, 0.29, 0.01, 0.24, toon(0x626f6a), 0, 0.82, 0.5, { cast: false });
  addRodBetween(g, [-0.16, 0.82, 0.5], [-0.16, 0.97, 0.5], 0.008, silver, { cast: false });
  addRodBetween(g, [0.16, 0.82, 0.5], [0.16, 0.97, 0.5], 0.008, silver, { cast: false });
  // Kickstand and chain guard.
  addRodBetween(g, [0, 0.22, -0.08], [0.15, 0.06, -0.2], 0.01, dark, { cast: false });
  addBox(g, 0.06, 0.08, 0.38, toon(0x51605c), 0, 0.35, -0.3, { cast: false });
  // A small bell and front light.
  addCylinder(g, 0.035, 0.03, 0.027, toon(0xc2c2a6), 0.12, 1.0, 0.36, { segments: 8, cast: false });
  addCylinder(g, 0.032, 0.05, 0.06, basic(0xffe2a9), 0, 0.86, 0.58, { rx: Math.PI / 2, segments: 8, cast: false });
  addGlowSprite(g, 0xffe6b0, 0.28, 0, 0.86, 0.64, 0.12);
  // Rain-slick frame highlight.
  addBox(g, 0.012, 0.012, 0.65, basic(0xc5eee1, { transparent: true, opacity: 0.45 }), 0.028, 0.56, 0.02, { rz: 0.05, cast: false });
}

/* ------------------------------------------------------------------ */
/* Small storefront props                                             */
/* ------------------------------------------------------------------ */

function umbrellaStand(parent, ctx) {
  const g = new THREE.Group();
  g.position.set(0.4, topY, 2.15);
  parent.add(g);
  const standMat = toon(0x526c69);
  addCylinder(g, 0.19, 0.17, 0.36, standMat, 0, 0.18, 0, { segments: 14, cast: true });
  addCylinder(g, 0.195, 0.195, 0.045, toon(0x293f3f), 0, 0.37, 0, { segments: 14, cast: true });
  addCylinder(g, 0.205, 0.22, 0.025, basic(0x26393a), 0, 0.01, 0, { segments: 14, cast: false });
  const umbrellaColors = [0x82b8c1, 0xe98372, 0x65a993, 0x304b59];
  for (let i = 0; i < 4; i++) {
    const a = i * 1.26;
    const rad = 0.11;
    const x = Math.cos(a) * rad;
    const z = Math.sin(a) * rad;
    const leanX = Math.cos(a) * 0.18;
    const leanZ = Math.sin(a) * 0.18;
    const topYValue = 1.4 + (i % 2) * 0.08;
    const canopy = addCylinder(g, 0.015, 0.055, 0.86, toon(umbrellaColors[i]), x + leanX * 0.5, 0.98, z + leanZ * 0.5, {
      rx: leanZ * 0.8,
      rz: -leanX * 1.05,
      segments: 7,
      cast: true,
    });
    canopy.rotation.x += 0.02;
    // Shaft and curved handle.
    const x2 = x + leanX;
    const z2 = z + leanZ;
    addRodBetween(g, [x, 0.25, z], [x2, topYValue, z2], 0.012, toon(0x596365), { cast: false, segments: 5 });
    addTube(g, [[x2, topYValue + 0.03, z2], [x2 + 0.03, topYValue + 0.12, z2], [x2 + 0.12, topYValue + 0.11, z2 + 0.02]], 0.014, toon(0x413d38), {
      segments: 8,
      radialSegments: 4,
    });
    // A tiny strap around the closed canopy.
    addCylinder(g, 0.048, 0.055, 0.02, toon(0x2d3537), x + leanX * 0.36, 0.99, z + leanZ * 0.36, {
      rx: leanZ * 0.8,
      rz: -leanX * 1.05,
      segments: 7,
      cast: false,
    });
  }
  addGroundGlow(parent, 0x8fc8c2, 0.75, 0.55, 0.4, 2.12, 0.08, 0.158);
}

function entryMat(parent) {
  const tex = canvasTexture(512, 256, (ctx, w, h) => {
    ctx.fillStyle = '#1d3b3d';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#7acbb7';
    ctx.lineWidth = 8;
    ctx.strokeRect(12, 12, w - 24, h - 24);
    ctx.strokeStyle = 'rgba(255,244,213,0.55)';
    ctx.lineWidth = 2;
    ctx.strokeRect(23, 23, w - 46, h - 46);
    ctx.fillStyle = '#f5ead2';
    ctx.textAlign = 'center';
    ctx.font = `700 46px ${JP_FONT}`;
    ctx.fillText('WELCOME', w / 2, 110);
    ctx.fillStyle = '#8edcc8';
    ctx.font = `700 26px ${JP_FONT}`;
    ctx.fillText('星見町店へ ようこそ', w / 2, 158);
    drawStar(ctx, 74, 73, 18, 5, '#ecbb7a', 4);
    drawStar(ctx, w - 74, 73, 18, 5, '#ecbb7a', 4);
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    for (let i = 0; i < 20; i++) ctx.fillRect(0, i * 13, w, 2);
  });
  addGroundPlane(parent, 1.08, 0.58, basic(0xffffff, { map: tex, depthWrite: false }), 1.225, 0.157, 2.11);
}

function noticeBoard(parent, ctx) {
  const g = new THREE.Group();
  g.position.set(-5.45, topY, 2.42);
  g.scale.setScalar(0.82);
  parent.add(g);
  const wood = toon(0x493a2e);
  const frame = toon(0x6c563d);
  addCylinder(g, 0.04, 0.05, 2.1, wood, -0.52, 1.05, 0, { segments: 8, cast: true });
  addCylinder(g, 0.04, 0.05, 2.1, wood, 0.52, 1.05, 0, { segments: 8, cast: true });
  addBox(g, 1.24, 1.58, 0.08, frame, 0, 1.53, 0.02, { cast: true });
  addBox(g, 1.11, 1.42, 0.03, toon(0x5f4e3b), 0, 1.53, 0.075, { cast: false });
  const boardTex = noticeBoardTexture();
  addPlane(g, 1.02, 1.34, planeMaterial(boardTex), 0, 1.53, 0.097);
  addBox(g, 1.35, 0.08, 0.38, toon(0x3e3329), 0, 2.36, 0.12, { rx: -0.1, cast: true });
  // Puddle at the feet.
  addBox(g, 1.2, 0.025, 0.45, physical(0x172123, { roughness: 0.12, metalness: 0.4, transparent: true, opacity: 0.5, outline: false }), 0, 0.012, 0.02, {
    cast: false,
    receive: true,
  });
  addGlowSprite(g, 0xffe0a6, 0.55, 0.38, 2.23, 0.17, 0.08);
  // A tiny lamp clamped to the frame.
  addBox(g, 0.12, 0.06, 0.14, toon(0x2d3a39), 0.4, 2.3, 0.18, { cast: true });
  addBox(g, 0.06, 0.02, 0.08, basic(0xffd69b), 0.4, 2.262, 0.27, { cast: false });
}

function aframeSign(parent) {
  const g = new THREE.Group();
  g.position.set(-3.83, topY, 2.54);
  g.rotation.y = 0.08;
  parent.add(g);
  const frame = toon(0x5e4532);
  addBox(g, 0.06, 0.92, 0.05, frame, -0.26, 0.46, 0.14, { rz: 0.18, cast: true });
  addBox(g, 0.06, 0.92, 0.05, frame, 0.26, 0.46, 0.14, { rz: -0.18, cast: true });
  addBox(g, 0.06, 0.92, 0.05, frame, -0.26, 0.46, -0.13, { rz: -0.18, cast: true });
  addBox(g, 0.06, 0.92, 0.05, frame, 0.26, 0.46, -0.13, { rz: 0.18, cast: true });
  const tex = canvasTexture(512, 640, (ctx, w, h) => {
    ctx.fillStyle = '#263f3d';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#d6b37d';
    ctx.lineWidth = 6;
    ctx.strokeRect(20, 20, w - 40, h - 40);
    ctx.fillStyle = '#f5e9ce';
    ctx.textAlign = 'center';
    ctx.font = `700 42px ${JP_FONT}`;
    ctx.fillText('ほっと', w / 2, 110);
    ctx.fillText('コーヒー', w / 2, 160);
    ctx.fillStyle = '#e1a765';
    ctx.font = `800 118px ${JP_FONT}`;
    ctx.fillText('100', w / 2, 330);
    ctx.font = `700 52px ${JP_FONT}`;
    ctx.fillText('円', w / 2, 390);
    ctx.strokeStyle = '#83d7c0';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(90, 444);
    ctx.lineTo(w - 90, 444);
    ctx.stroke();
    ctx.fillStyle = '#b8e8db';
    ctx.font = `700 26px ${JP_FONT}`;
    ctx.fillText('あたたかい一杯を', w / 2, 500);
    ctx.fillText('雨の夜に。', w / 2, 542);
    drawStar(ctx, w / 2, 604, 21, 6, '#e5b679', 4);
  });
  addBox(g, 0.53, 0.86, 0.035, toon(0x1d302f), 0, 0.56, 0.17, { rx: -0.17, cast: true });
  addPlane(g, 0.48, 0.78, planeMaterial(tex), 0, 0.56, 0.192, { rx: -0.17 });
  addBox(g, 0.53, 0.86, 0.035, toon(0x1d302f), 0, 0.56, -0.16, { rx: 0.17, cast: true });
}

function pottedPlants(parent, ctx) {
  const spots = [
    { x: -2.95, z: 2.63, s: 0.8, pot: 0x7f745d, leaf: 0x4f7b5e },
    { x: 3.03, z: 2.5, s: 0.68, pot: 0x6b5a49, leaf: 0x5b865f },
    { x: -5.05, z: 1.94, s: 0.92, pot: 0x7b6c58, leaf: 0x477657 },
  ];
  for (const sp of spots) {
    const g = new THREE.Group();
    g.position.set(sp.x, topY, sp.z);
    g.scale.setScalar(sp.s);
    parent.add(g);
    addCylinder(g, 0.21, 0.16, 0.35, toon(sp.pot), 0, 0.18, 0, { segments: 9, cast: true });
    addCylinder(g, 0.23, 0.21, 0.06, toon(0x2f3b37), 0, 0.33, 0, { segments: 9, cast: true });
    addCylinder(g, 0.18, 0.2, 0.03, toon(0x282521), 0, 0.36, 0, { segments: 9, cast: false });
    const rng = mulberryLocal(sp.leaf + sp.x);
    for (let i = 0; i < 9; i++) {
      const leafGeo = new THREE.SphereGeometry(0.13 + rng() * 0.08, 5, 4);
      const leafMat = toon(i % 3 === 0 ? 0x355f4d : i % 2 ? sp.leaf : 0x6b946d);
      const leaf = new THREE.Mesh(leafGeo, leafMat);
      leaf.position.set((rng() - 0.5) * 0.52, 0.50 + rng() * 0.42, (rng() - 0.5) * 0.45);
      leaf.scale.set(1.2, 0.55 + rng() * 0.4, 0.8);
      leaf.rotation.set(rng() * 1.2, rng() * Math.PI, rng() * 0.6);
      leaf.castShadow = true;
      g.add(leaf);
    }
    const droplets = new THREE.Group();
    g.add(droplets);
    for (let i = 0; i < 4; i++) {
      addCylinder(droplets, 0.007, 0.012, 0.08, basic(0xb8e6e3, { transparent: true, opacity: 0.7 }), (rng() - 0.5) * 0.4, 0.85 + rng() * 0.2, (rng() - 0.5) * 0.3, {
        segments: 4,
        cast: false,
      });
    }
  }
}

function mulberryLocal(seed) {
  let s = Math.abs(Math.floor(seed * 1000)) + 7;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function parkingSign(parent) {
  const g = new THREE.Group();
  g.position.set(3.29, topY, -2.3);
  parent.add(g);
  addCylinder(g, 0.035, 0.05, 2.0, toon(0x424e50), 0, 1.0, 0, { segments: 8, cast: true });
  const tex = canvasTexture(512, 512, (ctx, w, h) => {
    ctx.fillStyle = '#2b5c7b';
    roundFill(ctx, 0, 0, w, h, 12);
    ctx.strokeStyle = '#eef5ed';
    ctx.lineWidth = 16;
    ctx.strokeRect(20, 20, w - 40, h - 40);
    ctx.fillStyle = '#f4f6ec';
    ctx.font = `800 270px ${LATIN_FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText('P', w / 2, 310);
    ctx.font = `700 32px ${JP_FONT}`;
    ctx.fillText('星見町 第二駐車場', w / 2, 406);
    ctx.font = `700 26px ${LATIN_FONT}`;
    ctx.fillText('24 HOURS', w / 2, 448);
    ctx.fillStyle = '#f5c77c';
    ctx.beginPath();
    ctx.moveTo(w / 2 - 20, 468);
    ctx.lineTo(w / 2 + 20, 468);
    ctx.lineTo(w / 2, 490);
    ctx.closePath();
    ctx.fill();
  });
  addPlane(g, 0.5, 0.5, planeMaterial(tex, { side: THREE.DoubleSide }), 0, 2.02, 0.005);
  addBox(g, 0.56, 0.56, 0.045, toon(0x5d6969), 0, 2.02, -0.01, { cast: true });
  // Small supplementary arrow sign.
  const arrowTex = canvasTexture(512, 256, (ctx, w, h) => {
    ctx.fillStyle = '#2d627f';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#eff3e4';
    ctx.lineWidth = 8;
    ctx.strokeRect(12, 12, w - 24, h - 24);
    ctx.fillStyle = '#eff3e4';
    ctx.font = `700 56px ${JP_FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText('→ 空車', w / 2, 104);
    ctx.font = `700 28px ${LATIN_FONT}`;
    ctx.fillText('VACANCY', w / 2, 170);
  });
  addPlane(g, 0.58, 0.29, planeMaterial(arrowTex, { side: THREE.DoubleSide }), 0, 1.56, 0.005);
  addBox(g, 0.64, 0.32, 0.04, toon(0x5b6868), 0, 1.56, -0.01, { cast: true });
}

/* ------------------------------------------------------------------ */
/* Railings                                                           */
/* ------------------------------------------------------------------ */

function guardrailSegment(parent, start, end, opts = {}) {
  const a = new THREE.Vector3(...start);
  const b = new THREE.Vector3(...end);
  const dir = b.clone().sub(a);
  const len = dir.length();
  const count = Math.max(2, Math.round(len / 1.55));
  const railMat = toon(0xd9ded2);
  const postMat = toon(0x477265);
  for (let i = 0; i < count; i++) {
    const t = i / (count - 1);
    const p = a.clone().lerp(b, t);
    addCylinder(parent, 0.048, 0.06, 0.88, postMat, p.x, p.y + 0.44, p.z, { segments: 7, cast: true });
    addCylinder(parent, 0.07, 0.07, 0.05, toon(0xb6c4b7), p.x, p.y + 0.88, p.z, { segments: 8, cast: false });
    addCylinder(parent, 0.03, 0.03, 0.06, basic(i === count - 1 ? 0xffc77a : 0xe9f0e6), p.x, p.y + 0.78, p.z + 0.055, {
      rx: Math.PI / 2,
      segments: 6,
      cast: false,
    });
  }
  for (const h of [0.48, 0.82]) {
    addRodBetween(parent, [start[0], start[1] + h, start[2]], [end[0], end[1] + h, end[2]], 0.034, railMat, { cast: false, segments: 6 });
  }
  addRodBetween(parent, [start[0], start[1] + 0.15, start[2]], [end[0], end[1] + 0.15, end[2]], 0.022, postMat, { cast: false, segments: 6 });
}

function guardrails(parent) {
  guardrailSegment(parent, [-4.8, SIDEWALK_Y, 5.72], [-2.35, SIDEWALK_Y, 5.72]);
  guardrailSegment(parent, [3.12, SIDEWALK_Y, -4.5], [3.12, SIDEWALK_Y, -3.0]);
  guardrailSegment(parent, [5.64, SIDEWALK_Y, 1.06], [5.64, SIDEWALK_Y, 2.82]);
}

/* ------------------------------------------------------------------ */
/* Extra small things                                                 */
/* ------------------------------------------------------------------ */

function airConditioner(parent, x, y, z, ry = 0) {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  g.rotation.y = ry;
  parent.add(g);
  addRoundedBox(g, 0.58, 0.48, 0.34, 0.03, toon(0xb6b6a7), 0, 0, 0, { segments: 2, cast: true });
  addCylinder(g, 0.155, 0.155, 0.012, toon(0x4a5654), -0.09, 0.01, 0.173, { rx: Math.PI / 2, segments: 18, cast: false });
  for (let i = 0; i < 7; i++) {
    addBox(g, 0.26, 0.014, 0.012, toon(0x68716b), -0.09, -0.13 + i * 0.045, 0.176, { cast: false });
  }
  addBox(g, 0.25, 0.18, 0.015, toon(0x8f9183), 0.13, 0.03, 0.175, { cast: false });
  for (let i = 0; i < 3; i++) {
    addBox(g, 0.02, 0.05, 0.012, toon(0x636d68), -0.23 + i * 0.045, -0.12, 0.176, { cast: false });
  }
  addBox(g, 0.64, 0.045, 0.4, toon(0x686d64), 0, -0.28, 0, { cast: true });
  addRodBetween(g, [0.28, -0.25, 0.1], [0.35, -0.8, 0.12], 0.018, toon(0x545d58), { cast: false });
  addGlowSprite(g, 0x9dc2b7, 0.3, 0, 0.1, 0.1, 0.04);
}

function streetProps(ctx) {
  const group = new THREE.Group();
  group.name = 'street-props';
  ctx.scene.add(group);

  entryMat(group);
  umbrellaStand(group, ctx);
  trashStation(group);
  bicycle(group, ctx, { x: 2.57, z: -1.2, lean: -0.07, color: 0x729990 });
  noticeBoard(group, ctx);
  pottedPlants(group, ctx);
  vendingMachine(group, ctx, { x: -4.38, z: 2.34, ry: -Math.PI / 2 });
  airConditioner(group, 2.35, 2.25, -4.2, Math.PI / 2);
  airConditioner(group, -5.21, 1.65, -3.1, Math.PI / 2);
  parkingSign(group);
  guardrails(group);

  // A single drenched traffic cone by the parking bay.
  const cone = new THREE.Group();
  cone.position.set(5.18, 0.035, -2.52);
  group.add(cone);
  addBox(cone, 0.3, 0.045, 0.3, toon(0x3f3d35), 0, 0.022, 0, { cast: true });
  addCylinder(cone, 0.045, 0.14, 0.54, toon(0xdd7950), 0, 0.31, 0, { segments: 10, cast: true });
  // Two tidy reflective bands.
  addCylinder(cone, 0.093, 0.108, 0.075, toon(0xf0e5ce), 0, 0.31, 0, { segments: 10, cast: false });
  addCylinder(cone, 0.058, 0.075, 0.06, toon(0xf0e5ce), 0, 0.45, 0, { segments: 10, cast: false });

  // A tiny convex traffic mirror by the corner.
  const mirrorPole = new THREE.Group();
  mirrorPole.position.set(3.03, topY, -2.46);
  group.add(mirrorPole);
  addCylinder(mirrorPole, 0.035, 0.05, 2.9, toon(0x4f5c5e), 0, 1.45, 0, { segments: 7, cast: true });
  const mirrorBack = new THREE.Mesh(new THREE.CircleGeometry(0.36, 24), toon(0xd27b4f));
  mirrorBack.position.set(0.08, 2.65, 0.09);
  mirrorBack.rotation.y = -0.55;
  mirrorPole.add(mirrorBack);
  const mirror = new THREE.Mesh(new THREE.CircleGeometry(0.32, 24), physical(0x9fbac0, { roughness: 0.08, metalness: 0.9, outline: false }));
  mirror.position.set(0.08, 2.65, 0.095);
  mirror.rotation.y = -0.55;
  mirrorPole.add(mirror);
  addBox(mirrorPole, 0.04, 0.8, 0.04, toon(0x5b6664), 0, 2.65, 0, { rx: 0.18, cast: false });

  // Rain-darkened cardboard boxes beside the back bins.
  addBox(group, 0.55, 0.34, 0.4, toon(0x806b51), 2.1, 0.31, -5.35, { cast: true, ry: 0.16 });
  addBox(group, 0.43, 0.25, 0.33, toon(0x6f5c45), 1.95, 0.61, -5.34, { cast: true, ry: -0.08 });

  // A small stack of old magazines tied with string, waiting for recycling.
  for (let i = 0; i < 4; i++) {
    addBox(group, 0.32, 0.05, 0.42, toon(i % 2 ? 0xb5a281 : 0xcdbf9e), -3.55, 0.19 + i * 0.055, 2.69, { cast: true, ry: 0.15 + i * 0.04 });
  }
  addBox(group, 0.026, 0.2, 0.026, toon(0x6a4f37), -3.55, 0.29, 2.69, { cast: false });

  return group;
}

export function buildProps(ctx) {
  const group = streetProps(ctx);
  streetLight(group, ctx);
  utilityPoles(group, ctx);
  trafficSignal(group, ctx);
  return group;
}
