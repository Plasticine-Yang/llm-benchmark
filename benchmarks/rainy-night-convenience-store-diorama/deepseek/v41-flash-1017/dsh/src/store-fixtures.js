import * as THREE from 'three';
import {
  addBox,
  addCylinder,
  addPlane,
  addGroundPlane,
  addRoundedBox,
  addGlowSprite,
  addGroundGlow,
  toon,
  basic,
  physical,
  planeMaterial,
  canvasTexture,
  coffeeMenuTexture,
  promoStripTexture,
  magazineTexture,
  shelfTagTexture,
  getSharedGlowTexture,
  mulberry32,
  JP_FONT,
  LATIN_FONT,
  drawStar,
  outlineOff,
} from './lib.js';

/* ------------------------------------------------------------------ */
/* Texture odds and ends                                              */
/* ------------------------------------------------------------------ */

function fridgeHeaderTexture() {
  return canvasTexture(1024, 220, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, '#e5fff9');
    g.addColorStop(0.5, '#f7fffb');
    g.addColorStop(1, '#d8fbf2');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#245d5e';
    ctx.font = `700 78px ${LATIN_FONT}`;
    ctx.textAlign = 'left';
    ctx.letterSpacing = '3px';
    ctx.fillText('DRINKS', 38, 100);
    ctx.letterSpacing = '0px';
    ctx.font = `700 39px ${JP_FONT}`;
    ctx.fillStyle = '#3a7674';
    ctx.fillText('つめたい飲みもの', 46, 160);
    const cx = w - 105;
    ctx.fillStyle = '#77cdbd';
    ctx.beginPath();
    ctx.arc(cx, 104, 64, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff9e8';
    ctx.beginPath();
    ctx.arc(cx, 91, 36, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(cx - 23, 85, 46, 62);
    ctx.fillStyle = '#83d8c9';
    ctx.beginPath();
    ctx.arc(cx, 92, 25, 0, Math.PI * 2);
    ctx.fill();
    drawStar(ctx, cx, 92, 18, 5, '#fffcfa', 4);
  });
}

function bentoHeaderTexture() {
  return canvasTexture(900, 240, (ctx, w, h) => {
    ctx.fillStyle = '#fff1d1';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#2f5f54';
    ctx.font = `700 74px ${JP_FONT}`;
    ctx.textAlign = 'left';
    ctx.fillText('お弁当・おにぎり', 46, 108);
    ctx.fillStyle = '#bc7950';
    ctx.font = `700 27px ${LATIN_FONT}`;
    ctx.letterSpacing = '4px';
    ctx.fillText('FRESH  EVERY  MORNING', 52, 168);
    ctx.letterSpacing = '0px';
    ctx.fillStyle = '#fdf8e9';
    ctx.beginPath();
    ctx.moveTo(w - 122, 55);
    ctx.lineTo(w - 44, 188);
    ctx.lineTo(w - 200, 188);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#263d3a';
    ctx.fillRect(w - 144, 136, 44, 56);
    ctx.fillStyle = '#d97451';
    ctx.beginPath();
    ctx.arc(w - 120, 112, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#6db8a4';
    ctx.fillRect(0, h - 16, w, 16);
  });
}

function posScreenTexture() {
  return canvasTexture(640, 400, (ctx, w, h) => {
    ctx.fillStyle = '#1b4446';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#c9f1df';
    ctx.font = `700 29px ${JP_FONT}`;
    ctx.fillText('ほしぞらマート', 28, 48);
    ctx.fillStyle = 'rgba(151,227,206,0.18)';
    ctx.fillRect(22, 70, w - 44, 2);
    const rows = [
      ['おにぎり 鮭', '¥138'],
      ['ホットコーヒー', '¥100'],
      ['おでん 盛合せ', '¥260'],
    ];
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = i === 2 ? '#bff4df' : 'rgba(206,240,225,0.78)';
      ctx.font = `500 25px ${JP_FONT}`;
      ctx.textAlign = 'left';
      ctx.fillText(rows[i][0], 26, 124 + i * 40);
      ctx.textAlign = 'right';
      ctx.font = `600 24px ${LATIN_FONT}`;
      ctx.fillText(rows[i][1], w - 30, 124 + i * 40);
    }
    ctx.fillStyle = '#89e1c9';
    ctx.fillRect(20, 276, w - 40, 1);
    ctx.textAlign = 'left';
    ctx.font = `700 34px ${JP_FONT}`;
    ctx.fillStyle = '#ffedc2';
    ctx.fillText('合計', 28, 332);
    ctx.textAlign = 'right';
    ctx.font = `800 54px ${LATIN_FONT}`;
    ctx.fillText('¥498', w - 32, 338);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#74d4bd';
    ctx.font = `600 17px ${LATIN_FONT}`;
    ctx.fillText('THANK YOU  /  またお越しください', w / 2, 380);
  });
}

/* ------------------------------------------------------------------ */
/* Refrigerated drinks                                                */
/* ------------------------------------------------------------------ */

function buildFridge(parent) {
  const x0 = -3.88;
  const x1 = -0.26;
  const w = x1 - x0;
  const cx = (x0 + x1) / 2;
  const front = -3.98;
  const dark = toon(0x214846);
  const frame = toon(0x355a56);
  const bright = new THREE.MeshBasicMaterial({ color: 0xe9fcf8, toneMapped: false });
  bright.userData.outlineParameters = { visible: false };
  addBox(parent, w + 0.1, 0.14, 0.5, dark, cx, 0.28, -4.22, { cast: true });
  addBox(parent, w + 0.1, 0.14, 0.55, dark, cx, 2.38, -4.22, { cast: true });
  addBox(parent, 0.1, 2.15, 0.54, frame, x0 - 0.02, 1.34, -4.22, { cast: true });
  addBox(parent, 0.1, 2.15, 0.54, frame, x1 + 0.02, 1.34, -4.22, { cast: true });
  addPlane(parent, w - 0.02, 2.03, bright, cx, 1.33, -4.415);

  const shelfYs = [0.46, 0.91, 1.36, 1.81];
  for (const y of shelfYs) {
    addBox(parent, w - 0.06, 0.035, 0.4, toon(0xdee0d1), cx, y, -4.22, { cast: false });
    addBox(parent, w - 0.06, 0.018, 0.025, toon(0x6f9d94), cx, y + 0.02, front + 0.2, { cast: false });
    addBox(parent, w - 0.08, 0.018, 0.28, basic(0xd6f2eb, { transparent: true, opacity: 0.4 }), cx, y - 0.01, -4.2, { cast: false });
  }

  const rng = mulberry32(37);
  const canGeo = new THREE.CylinderGeometry(0.052, 0.052, 0.19, 8);
  const canMat = toon(0xffffff, { outline: false });
  outlineOff(canMat);
  const bottleColors = [
    0xf17c63, 0x70c9d5, 0xf1d477, 0x8bc78b, 0xefa0b6, 0x7b9dd4, 0xd69b60,
    0x9bd4c2, 0xe6eee2, 0xba78a0, 0xc85d47, 0x72926f, 0xf4e4bb, 0x58b7a4,
  ];
  const count = 4 * 18;
  const inst = new THREE.InstancedMesh(canGeo, canMat, count);
  inst.castShadow = false;
  inst.receiveShadow = false;
  const m = new THREE.Matrix4();
  let idx = 0;
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 18; col++) {
      const px = x0 + 0.16 + col * ((w - 0.3) / 17);
      const py = shelfYs[row] + 0.12;
      const pz = -4.17 + (rng() - 0.5) * 0.025;
      const height = 0.19 + rng() * 0.09;
      m.makeScale(1, height / 0.19, 1);
      m.setPosition(px, py + (height - 0.19) * 0.5, pz);
      inst.setMatrixAt(idx, m);
      inst.setColorAt(idx, new THREE.Color(bottleColors[(row * 5 + col) % bottleColors.length]));
      idx++;
    }
  }
  inst.instanceMatrix.needsUpdate = true;
  if (inst.instanceColor) inst.instanceColor.needsUpdate = true;
  parent.add(inst);

  const bandGeo = new THREE.CylinderGeometry(0.053, 0.053, 0.045, 8);
  const bandMat = basic(0xf8f3df, { transparent: true, opacity: 0.72 });
  const bands = new THREE.InstancedMesh(bandGeo, bandMat, count);
  bands.castShadow = false;
  idx = 0;
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 18; col++) {
      const px = x0 + 0.16 + col * ((w - 0.3) / 17);
      const py = shelfYs[row] + 0.13;
      m.makeScale(1, 1, 1);
      m.setPosition(px, py + 0.015, -4.17);
      bands.setMatrixAt(idx, m);
      idx++;
    }
  }
  bands.instanceMatrix.needsUpdate = true;
  parent.add(bands);

  const doorW = w / 4;
  for (let i = 0; i < 4; i++) {
    const x = x0 + doorW * (i + 0.5);
    addBox(parent, doorW - 0.035, 2.03, 0.03, physical(0x9edbd4, {
      transparent: true,
      opacity: 0.16,
      roughness: 0.06,
      metalness: 0.1,
      clearcoat: 1,
      side: THREE.DoubleSide,
      depthWrite: false,
      outline: false,
    }), x, 1.34, front, { cast: false });
    addBox(parent, 0.045, 2.06, 0.05, frame, x - doorW / 2 + 0.01, 1.34, front + 0.01, { cast: true });
    addBox(parent, 0.03, 0.67, 0.035, toon(0xb5bca9), x + doorW / 2 - 0.12, 1.37, front + 0.055, { cast: false });
    if (i < 3) addBox(parent, 0.035, 2.06, 0.06, frame, x + doorW / 2, 1.34, front + 0.02, { cast: true });
  }
  addBox(parent, w + 0.15, 0.3, 0.08, dark, cx, 2.55, front - 0.04, { cast: true });
  addPlane(parent, w + 0.02, 0.28, planeMaterial(fridgeHeaderTexture()), cx, 2.55, front + 0.005);
  addGlowSprite(parent, 0xbdf7ef, 3.9, cx, 1.5, -4.3, 0.11);
  addGroundGlow(parent, 0xc1f7ef, 3.5, 1.3, cx, -3.3, 0.13, 0.178);

  addBox(parent, 0.55, 0.06, 0.24, toon(0x486a60), x1 + 0.24, 0.92, front + 0.08, { cast: false });
  const tag = canvasTexture(384, 200, (ctx2, w2, h2) => {
    ctx2.fillStyle = '#f3ead3';
    ctx2.fillRect(0, 0, w2, h2);
    ctx2.fillStyle = '#335d59';
    ctx2.font = `700 44px ${JP_FONT}`;
    ctx2.textAlign = 'center';
    ctx2.fillText('冷たいお茶', w2 / 2, 76);
    ctx2.fillStyle = '#c46d4d';
    ctx2.font = `700 31px ${LATIN_FONT}`;
    ctx2.fillText('NEW  ¥108', w2 / 2, 132);
  });
  addPlane(parent, 0.42, 0.22, planeMaterial(tag), x1 + 0.5, 1.14, -4.2, { ry: Math.PI / 2, renderOrder: 3 });
}

/* ------------------------------------------------------------------ */
/* Dry goods shelves                                                  */
/* ------------------------------------------------------------------ */

function makeShelfUnit(parent, opts) {
  const { x, z, width, depth, color = 0x436d65 } = opts;
  const baseMat = toon(0x2b3f3b);
  const shelfMat = toon(color);
  const edgeMat = toon(0x7a5c40);
  const sideMat = toon(0x2e4b47);
  const topY = 1.26;
  addBox(parent, width + 0.06, 0.11, depth + 0.06, baseMat, x, 0.27, z, { cast: true });
  addBox(parent, width, 1.1, 0.055, shelfMat, x, 0.82, z - depth / 2 + 0.025, { cast: true });
  addBox(parent, 0.055, 1.1, depth, sideMat, x - width / 2 + 0.025, 0.82, z, { cast: true });
  addBox(parent, 0.055, 1.1, depth, sideMat, x + width / 2 - 0.025, 0.82, z, { cast: true });
  // Open front: just a low kick rail, so the colourful merchandise is legible
  // both through the glazing and from the cutaway roof.
  addBox(parent, width - 0.05, 0.1, 0.045, shelfMat, x, 0.22, z + depth / 2 - 0.025, { cast: true });
  addBox(parent, width, 0.035, 0.035, edgeMat, x, topY - 0.03, z + depth / 2 - 0.021, { cast: true });
  for (const y of [0.32, 0.62, 0.92, 1.22]) {
    addBox(parent, width - 0.1, 0.035, depth - 0.06, edgeMat, x, y, z, { cast: false, receive: true });
    addBox(parent, width - 0.11, 0.045, 0.025, shelfMat, x, y + 0.032, z + depth / 2 - 0.03, { cast: false });
    addBox(parent, width - 0.1, 0.018, 0.028, basic(0x6ea28d, { transparent: true, opacity: 0.55 }), x, y + 0.033, z + depth / 2 + 0.005, { cast: false });
    // A tiny warm strip under every shelf turns the merchandise into little
    // illuminated diorama pieces.
    if (y > 0.35) {
      addBox(parent, width - 0.16, 0.009, 0.014, basic(0xffe0ad, { transparent: true, opacity: 0.8 }), x, y - 0.012, z + depth / 2 + 0.006, { cast: false });
    }
  }
  addBox(parent, width - 0.14, 0.11, depth - 0.1, toon(0x1e3835), x, 0.165, z, { cast: false });
  return { x, z, width, depth, tiers: [0.355, 0.655, 0.955, 1.25] };
}

function shelfProducts(parent, unit, rng) {
  const colors = [0xf05b45, 0xffbf45, 0x42a384, 0x3d8fb0, 0xe04f83, 0xffe7a9, 0x556fc1, 0xd06b31, 0x6fae4f, 0xee9b3b, 0xe6d8b4, 0x2f8f86];
  const positions = [];
  const scales = [];
  const instanceColors = [];
  const count = 160;
  for (let tier = 0; tier < 4; tier++) {
    const y = unit.tiers[tier];
    let cursor = -unit.width / 2 + 0.16;
    while (cursor < unit.width / 2 - 0.12) {
      if (rng() > 0.92) {
        cursor += 0.18;
        continue;
      }
      const w = 0.1 + rng() * 0.13;
      const h = 0.13 + rng() * 0.14;
      const d = 0.07 + rng() * 0.08;
      const x = unit.x + cursor + w / 2;
      const z = unit.z + unit.depth * 0.16 + rng() * 0.08;
      positions.push([x, y + h / 2, z]);
      scales.push([w, h, d]);
      instanceColors.push(new THREE.Color(colors[Math.floor(rng() * colors.length)]));
      cursor += w + 0.035 + rng() * 0.055;
      if (positions.length >= count) break;
    }
    if (positions.length >= count) break;
  }
  const geo = new THREE.BoxGeometry(1, 1, 1);
  const mat = toon(0xffffff, { outline: false });
  outlineOff(mat);
  const inst = new THREE.InstancedMesh(geo, mat, positions.length);
  inst.castShadow = false;
  inst.receiveShadow = true;
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const s = new THREE.Vector3();
  const p = new THREE.Vector3();
  for (let i = 0; i < positions.length; i++) {
    p.set(...positions[i]);
    s.set(...scales[i]);
    q.setFromEuler(new THREE.Euler(0, (rng() - 0.5) * 0.06, 0));
    m.compose(p, q, s);
    inst.setMatrixAt(i, m);
    inst.setColorAt(i, instanceColors[i]);
  }
  inst.instanceMatrix.needsUpdate = true;
  if (inst.instanceColor) inst.instanceColor.needsUpdate = true;
  parent.add(inst);

  for (let i = 0; i < 2; i++) {
    const accent = i ? '#68a88e' : '#df7653';
    const mat = planeMaterial(shelfTagTexture(accent));
    for (let j = 0; j < 2; j++) {
      addPlane(parent, 0.15, 0.075, mat, unit.x - unit.width * 0.3 + j * unit.width * 0.55, unit.tiers[2] + 0.09, unit.z + unit.depth / 2 + 0.045, { renderOrder: 3 });
    }
  }
  const pop = canvasTexture(256, 320, (ctx2, w, h) => {
    ctx2.fillStyle = '#f5df91';
    ctx2.fillRect(0, 0, w, h);
    ctx2.fillStyle = '#be4d36';
    ctx2.font = `700 44px ${JP_FONT}`;
    ctx2.textAlign = 'center';
    ctx2.fillText('新発売', w / 2, 80);
    ctx2.fillStyle = '#294c44';
    ctx2.font = `800 68px ${LATIN_FONT}`;
    ctx2.fillText('NEW', w / 2, 168);
    ctx2.fillStyle = '#d4774f';
    ctx2.beginPath();
    ctx2.arc(w / 2, 248, 38, 0, Math.PI * 2);
    ctx2.fill();
    drawStar(ctx2, w / 2, 248, 21, 6, '#fff2cc', 4);
  });
  const popMat = planeMaterial(pop, { side: THREE.DoubleSide, transparent: true });
  for (let i = 0; i < 4; i++) {
    const px = unit.x - unit.width * 0.36 + i * unit.width * 0.23;
    addPlane(parent, 0.115, 0.145, popMat, px, unit.tiers[1] + 0.22, unit.z + unit.depth / 2 + 0.06, { renderOrder: 4 });
  }
  return inst;
}

function shelfHeader(parent, x, y, z, width, kind) {
  addBox(parent, width, 0.24, 0.04, toon(0x2f4e49), x, y, z, { cast: true });
  addPlane(parent, width - 0.025, 0.205, planeMaterial(promoStripTexture(kind)), x, y, z + 0.026);
  addBox(parent, width, 0.02, 0.05, basic(0xf1dfb5), x, y + 0.125, z + 0.005, { cast: false });
}

function buildSnackShelves(parent, rng) {
  const unitA = makeShelfUnit(parent, { x: -2.08, z: -0.34, width: 1.9, depth: 0.68 });
  const unitB = makeShelfUnit(parent, { x: -2.08, z: -1.57, width: 1.9, depth: 0.68, color: 0x4a6b5b });
  shelfProducts(parent, unitA, rng);
  shelfProducts(parent, unitB, rng);
  shelfHeader(parent, -2.08, 1.48, 0.03, 1.45, 'snack');
  shelfHeader(parent, -2.08, 1.48, -1.2, 1.35, 'daily');
  // Two thin uprights for the floating aisle header.
  for (const hx of [-2.72, -1.44]) addCylinder(parent, 0.012, 0.012, 0.23, toon(0x4e645e), hx, 1.34, 0.03, { segments: 5, cast: false });
  // Promotional stacks on top, so the shop stays visually rich through the cutaway.
  const topColors = [0xd87051, 0xe3b55e, 0x67a68f, 0x647f9b, 0xdf8ca0];
  for (let i = 0; i < 7; i++) {
    addBox(parent, 0.19 + (i % 3) * 0.04, 0.2 + (i % 2) * 0.08, 0.15, toon(topColors[i % topColors.length]), -2.8 + i * 0.23, 1.38, 0.04, {
      cast: true,
      ry: (i % 3 - 1) * 0.07,
    });
    addBox(parent, 0.1, 0.065, 0.012, basic(0xf8f0d6, { transparent: true, opacity: 0.85 }), -2.8 + i * 0.23, 1.36, 0.12, { cast: false });
  }
  for (let i = 0; i < 5; i++) {
    addCylinder(parent, 0.075, 0.075, 0.2, toon(i % 2 ? 0xd9765c : 0xe9c982), -1.75 + i * 0.19, 1.38, -1.2, { segments: 9, cast: true });
  }

  const tagMat = planeMaterial(shelfTagTexture('#e17251'));
  for (const x of [-2.88, -1.23]) {
    addPlane(parent, 0.14, 0.07, tagMat, x, 1.1, 0.345, { renderOrder: 3 });
  }

  // A little cardboard noodle display at the end of the aisle.
  const bin = new THREE.Group();
  bin.position.set(-1.13, 0.17, 0.34);
  bin.rotation.y = -0.24;
  parent.add(bin);
  addBox(bin, 0.52, 0.36, 0.4, toon(0xc59a5b), 0, 0.18, 0, { cast: true });
  addBox(bin, 0.48, 0.31, 0.02, toon(0xdbb77b), 0, 0.2, 0.21, { cast: false });
  for (let i = 0; i < 6; i++) {
    addCylinder(bin, 0.06, 0.055, 0.16, toon(0xf3e4bf), -0.18 + (i % 3) * 0.16, 0.36 + Math.floor(i / 3) * 0.02, -0.05 + (i % 2) * 0.1, {
      segments: 8,
      cast: true,
    });
    addCylinder(bin, 0.061, 0.061, 0.035, toon(i % 2 ? 0xc25d43 : 0xe0a45e), -0.18 + (i % 3) * 0.16, 0.44, -0.05 + (i % 2) * 0.1, {
      segments: 8,
      cast: false,
    });
  }
  const binTag = canvasTexture(512, 256, (ctx2, w, h) => {
    ctx2.fillStyle = '#f0d9a7';
    ctx2.fillRect(0, 0, w, h);
    ctx2.fillStyle = '#b2563d';
    ctx2.font = `700 52px ${JP_FONT}`;
    ctx2.textAlign = 'center';
    ctx2.fillText('カップ麺', w / 2, 95);
    ctx2.fillStyle = '#3d5950';
    ctx2.font = `700 27px ${LATIN_FONT}`;
    ctx2.fillText('HOT & READY  /  ¥198', w / 2, 152);
    drawStar(ctx2, w / 2, 199, 22, 6, '#dd9860', 4);
  });
  addPlane(bin, 0.47, 0.23, planeMaterial(binTag), 0, 0.21, 0.218, { renderOrder: 3 });
}

/* ------------------------------------------------------------------ */
/* Magazines, ice cream and ready meals                               */
/* ------------------------------------------------------------------ */

function buildMagazines(parent) {
  const rack = new THREE.Group();
  rack.position.set(-3.27, 0.17, 1.1);
  parent.add(rack);
  const frameMat = toon(0x3c5a54);
  const wood = toon(0x8d6b4e);
  addBox(rack, 1.55, 0.08, 0.46, frameMat, 0, 0.32, 0, { cast: true });
  addBox(rack, 1.55, 0.07, 0.4, wood, 0, 0.87, 0.03, { cast: true });
  addBox(rack, 1.55, 0.05, 0.32, wood, 0, 0.57, 0.001, { cast: true });
  addBox(rack, 1.55, 0.05, 0.26, wood, 0, 0.36, -0.03, { cast: true });
  addBox(rack, 0.06, 0.62, 0.45, frameMat, -0.78, 0.6, 0, { cast: true });
  addBox(rack, 0.06, 0.62, 0.45, frameMat, 0.78, 0.6, 0, { cast: true });
  for (let tier = 0; tier < 3; tier++) {
    const y = 0.39 + tier * 0.24;
    for (let i = 0; i < 4; i++) {
      const x = -0.57 + i * 0.38;
      addPlane(rack, 0.285, 0.37, planeMaterial(magazineTexture((tier * 4 + i) % 6)), x, y + 0.18, 0.05 + tier * 0.035, {
        rx: -0.28,
        renderOrder: 3,
      });
      addBox(rack, 0.29, 0.02, 0.03, toon(0xe8dfc8), x, y + 0.015, 0.08 + tier * 0.035, { cast: false });
    }
  }
  addBox(rack, 1.44, 0.03, 0.06, basic(0xf2eedc, { transparent: true, opacity: 0.65 }), 0, 0.905, 0.22, { cast: false });
  for (let i = 0; i < 3; i++) {
    addBox(rack, 0.43, 0.015, 0.27, toon(0xd5d1bd), 0.33, 0.915 + i * 0.018, 0.02 - i * 0.01, { cast: false, ry: 0.04 * i });
  }
  const tex = canvasTexture(768, 128, (ctx2, w, h) => {
    ctx2.fillStyle = '#e9dfc6';
    ctx2.fillRect(0, 0, w, h);
    ctx2.fillStyle = '#385952';
    ctx2.font = `700 48px ${JP_FONT}`;
    ctx2.textAlign = 'center';
    ctx2.fillText('雑誌 ・ コミック ・ 新聞', w / 2, 83);
    ctx2.fillStyle = '#d47b54';
    ctx2.fillRect(20, 0, 5, h);
  });
  addBox(rack, 1.56, 0.17, 0.055, toon(0x2d4b48), 0, 1.06, 0.04, { cast: true });
  addPlane(rack, 1.51, 0.14, planeMaterial(tex), 0, 1.06, 0.071);
  addGlowSprite(rack, 0xffd7a4, 0.9, 0, 1.16, 0.1, 0.06);
}

function buildIceCreamFreezer(parent) {
  const g = new THREE.Group();
  g.position.set(-3.15, 0.17, 0.18);
  parent.add(g);
  const white = toon(0xdde3d7);
  const teal = toon(0x3f7771);
  addRoundedBox(g, 0.98, 0.7, 0.62, 0.04, white, 0, 0.35, 0, { segments: 2, cast: true });
  addBox(g, 0.99, 0.11, 0.64, teal, 0, 0.14, 0, { cast: true });
  addBox(g, 0.96, 0.03, 0.57, toon(0x152c31), 0, 0.74, 0, { cast: false });
  for (const off of [-0.17, 0.17]) {
    addBox(g, 0.48, 0.015, 0.52, physical(0xabe1e0, {
      transparent: true,
      opacity: 0.32,
      roughness: 0.03,
      metalness: 0.1,
      clearcoat: 1,
      depthWrite: false,
      outline: false,
    }), off, 0.79, 0, { cast: false });
    addBox(g, 0.44, 0.02, 0.05, toon(0xbac5b9), off, 0.8, 0.2, { cast: false });
  }
  const rng = mulberry32(51);
  const colors = [0xf4dfb0, 0xdc7c8f, 0x72a9c2, 0x6a9a7d, 0xf0b55e];
  for (let i = 0; i < 8; i++) {
    addBox(g, 0.18, 0.12, 0.16, toon(colors[i % colors.length]), -0.34 + (i % 4) * 0.22, 0.81 + Math.floor(i / 4) * 0.08, -0.11 + (i % 2) * 0.2, {
      cast: false,
      ry: rng() * 0.4,
    });
  }
  const decal = canvasTexture(512, 300, (ctx2, w, h) => {
    ctx2.fillStyle = '#f2f0e2';
    ctx2.fillRect(0, 0, w, h);
    ctx2.fillStyle = '#497f78';
    ctx2.font = `700 68px ${LATIN_FONT}`;
    ctx2.textAlign = 'center';
    ctx2.fillText('ICE CREAM', w / 2, 112);
    ctx2.fillStyle = '#d5845a';
    ctx2.font = `700 39px ${JP_FONT}`;
    ctx2.fillText('つめたくて、しあわせ。', w / 2, 175);
    ctx2.strokeStyle = '#7bb2a6';
    ctx2.lineWidth = 4;
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      ctx2.beginPath();
      ctx2.moveTo(w / 2 + Math.cos(a) * 24, 242 + Math.sin(a) * 24);
      ctx2.lineTo(w / 2 + Math.cos(a) * 42, 242 + Math.sin(a) * 42);
      ctx2.stroke();
    }
    ctx2.fillStyle = '#4f8078';
    ctx2.font = `700 21px ${JP_FONT}`;
    ctx2.fillText('雨の夜も ひんやり', w / 2, 286);
  });
  addPlane(g, 0.72, 0.42, planeMaterial(decal), 0, 0.45, 0.313);
  addGlowSprite(g, 0xbee8e7, 0.95, 0, 0.84, 0.1, 0.08);
}

function addOnigiri(parent, x, y, z, flavorColor, rotY = 0) {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  g.rotation.y = rotY;
  parent.add(g);
  const shape = new THREE.Shape();
  shape.moveTo(0, 0.12);
  shape.quadraticCurveTo(0.065, 0.04, 0.11, -0.075);
  shape.quadraticCurveTo(0, -0.115, -0.11, -0.075);
  shape.quadraticCurveTo(-0.065, 0.04, 0, 0.12);
  const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.065, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: 0.008, bevelThickness: 0.006 });
  const body = new THREE.Mesh(geo, toon(0xfffdf3));
  body.castShadow = true;
  g.add(body);
  addPlane(g, 0.1, 0.105, toon(0x243433, { side: THREE.DoubleSide }), 0, -0.042, 0.039);
  addBox(g, 0.035, 0.032, 0.012, toon(flavorColor), 0, 0.02, 0.038, { cast: false }).rotation.z = 0.2;
  return g;
}

function buildBentoCase(parent) {
  const g = new THREE.Group();
  g.position.set(-3.5, 0.17, -2.15);
  parent.add(g);
  const green = toon(0x38655e);
  const cream = toon(0xeee2c8);
  const metal = toon(0x9aa69f);
  addBox(g, 0.52, 0.62, 1.5, cream, 0, 0.34, 0, { cast: true });
  addBox(g, 0.54, 0.09, 1.53, green, 0, 0.72, 0, { cast: true });
  addBox(g, 0.46, 0.02, 1.42, toon(0xbad4c9), 0, 0.76, 0, { cast: false });
  addBox(g, 0.4, 0.025, 1.35, basic(0xdffcf2, { transparent: true, opacity: 0.42 }), 0.02, 0.63, 0, { cast: false });
  addBox(g, 0.025, 0.78, 1.43, physical(0xa9e0dd, {
    transparent: true,
    opacity: 0.2,
    roughness: 0.04,
    metalness: 0.05,
    clearcoat: 1,
    depthWrite: false,
    outline: false,
  }), 0.29, 1.16, 0, { cast: false });
  addBox(g, 0.035, 0.05, 1.45, metal, 0.29, 1.56, 0, { cast: true });
  addBox(g, 0.035, 0.05, 1.45, metal, 0.29, 0.75, 0, { cast: true });
  const bentoColors = [0xb75d45, 0x669f78, 0xd8b15c, 0x7c8f56, 0xdb8662];
  const rng = mulberry32(61);
  for (let i = 0; i < 5; i++) {
    const z = -0.57 + i * 0.27;
    const gg = new THREE.Group();
    gg.position.set(0.03, 0.79, z);
    g.add(gg);
    addBox(gg, 0.18, 0.055, 0.23, toon(0x27302c), 0, 0.03, 0, { cast: true, ry: (rng() - 0.5) * 0.06 });
    addBox(gg, 0.16, 0.02, 0.21, toon(0xfffbee), 0, 0.064, 0, { cast: false });
    addBox(gg, 0.08, 0.02, 0.095, toon(bentoColors[i % bentoColors.length]), -0.025, 0.076, -0.03, { cast: false });
    addBox(gg, 0.055, 0.025, 0.06, toon(0xf3c66b), 0.04, 0.078, 0.03, { cast: false });
    addBox(gg, 0.045, 0.02, 0.045, toon(0x527e55), 0.04, 0.075, -0.045, { cast: false });
  }
  const onigiriColors = [0xd87958, 0x81ad74, 0xd6af5f, 0xc75b6f];
  for (let i = 0; i < 4; i++) {
    addOnigiri(g, 0.02, 0.93, -0.49 + i * 0.28, onigiriColors[i], Math.PI / 2 + (rng() - 0.5) * 0.18);
  }
  const tags = [['おにぎり', '¥138'], ['のり弁', '¥398'], ['から揚げ', '¥348']];
  tags.forEach((t, i) => {
    const tex = canvasTexture(256, 128, (ctx2, w, h) => {
      ctx2.fillStyle = '#f8f0d7';
      ctx2.fillRect(0, 0, w, h);
      ctx2.fillStyle = '#39615a';
      ctx2.font = `700 30px ${JP_FONT}`;
      ctx2.textAlign = 'center';
      ctx2.fillText(t[0], w / 2, 46);
      ctx2.fillStyle = '#d36f50';
      ctx2.font = `700 38px ${LATIN_FONT}`;
      ctx2.fillText(t[1], w / 2, 95);
    });
    addPlane(g, 0.18, 0.09, planeMaterial(tex), 0.293, 1.3 - i * 0.13, -0.44 + i * 0.28, { ry: Math.PI / 2, renderOrder: 4 });
  });
  addBox(g, 0.06, 0.48, 1.53, toon(0x31534c), 0.24, 1.92, 0, { cast: true });
  addPlane(g, 1.48, 0.42, planeMaterial(bentoHeaderTexture()), 0.274, 1.92, 0, { ry: Math.PI / 2, renderOrder: 5 });
  addGlowSprite(g, 0xffe2b5, 1.15, 0.34, 1.75, 0.1, 0.08);
  addGroundGlow(parent, 0xffe4b3, 0.85, 1.65, -2.98, -2.1, 0.12, 0.179);
}

/* ------------------------------------------------------------------ */
/* Counter, hot food, coffee                                          */
/* ------------------------------------------------------------------ */

function makeSteam(parent, ctx, origin, count, height, spread, rate, color, opacity) {
  const group = new THREE.Group();
  group.position.copy(origin);
  parent.add(group);
  const parts = [];
  for (let i = 0; i < count; i++) {
    const mat = new THREE.SpriteMaterial({
      map: getSharedGlowTexture(),
      color,
      transparent: true,
      opacity,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
    });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(0.06, 0.14, 1);
    group.add(sprite);
    parts.push({ sprite, phase: i / count, drift: (i % 2 ? 1 : -1) * 0.08 });
  }
  ctx.updaters.push({
    update(t) {
      for (const p of parts) {
        const c = (t * rate + p.phase) % 1;
        p.sprite.position.set(p.drift * Math.sin(c * 4 + p.phase * 9) + c * 0.12, c * height, Math.cos(c * 5 + p.phase) * spread * 0.3);
        p.sprite.material.opacity = Math.max(0, (1 - c) * opacity * Math.min(1, c * 7));
        const sc = 0.05 + c * spread * 2.2;
        p.sprite.scale.set(sc, sc * 1.8, 1);
      }
    },
  });
}

function buildCounter(parent, ctx) {
  const g = new THREE.Group();
  g.position.set(0.3, 0.17, -2.56);
  parent.add(g);
  const wood = toon(0xa8794d);
  const woodDark = toon(0x7f5638);
  const teal = toon(0x2f5a55);
  const topMat = toon(0xe3d7bf);
  const metal = toon(0x9ca9a2);
  addBox(g, 2.2, 0.84, 0.68, wood, 0, 0.45, 0, { cast: true });
  addBox(g, 2.24, 0.075, 0.72, topMat, 0, 0.9, 0, { cast: true });
  addBox(g, 2.25, 0.035, 0.03, teal, 0, 0.86, 0.36, { cast: false });
  addBox(g, 2.08, 0.06, 0.02, teal, 0, 0.24, 0.345, { cast: false });
  addBox(g, 2.14, 0.05, 0.64, toon(0x5f4937), 0, 0.05, 0, { cast: false });
  for (const x of [-0.72, 0, 0.72]) addBox(g, 0.025, 0.67, 0.025, woodDark, x, 0.5, 0.345, { cast: false });

  addBox(g, 0.36, 0.2, 0.26, toon(0x273e3d), -0.04, 1.04, -0.07, { cast: true });
  addBox(g, 0.35, 0.035, 0.24, toon(0x53635e), -0.04, 1.15, -0.07, { cast: true });
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.2), basic(0xffffff, { map: posScreenTexture() }));
  screen.position.set(-0.04, 1.47, -0.01);
  screen.rotation.x = -0.28;
  g.add(screen);
  addBox(g, 0.05, 0.28, 0.05, toon(0x384a47), -0.04, 1.29, -0.06, { cast: false });
  addBox(g, 0.23, 0.035, 0.17, toon(0x44534e), -0.04, 1.24, 0.13, { cast: true });
  addBox(g, 0.16, 0.05, 0.12, toon(0x293c3b), 0.43, 0.96, 0.18, { cast: true });
  addBox(g, 0.03, 0.01, 0.1, basic(0xff7468), 0.43, 0.99, 0.18, { cast: false });
  addBox(g, 0.16, 0.12, 0.03, toon(0x243a38), 0.8, 1.08, 0.22, { cast: true });
  const custTex = canvasTexture(384, 256, (ctx2, w, h) => {
    ctx2.fillStyle = '#204341';
    ctx2.fillRect(0, 0, w, h);
    ctx2.fillStyle = '#83e4c8';
    ctx2.font = `700 30px ${JP_FONT}`;
    ctx2.textAlign = 'center';
    ctx2.fillText('いらっしゃいませ', w / 2, 50);
    ctx2.fillStyle = '#f6eacd';
    ctx2.font = `800 65px ${LATIN_FONT}`;
    ctx2.fillText('¥498', w / 2, 130);
    ctx2.fillStyle = '#7dcfba';
    ctx2.font = `600 20px ${JP_FONT}`;
    ctx2.fillText('ポイント 12P', w / 2, 180);
    ctx2.fillStyle = '#dec590';
    ctx2.font = `600 17px ${LATIN_FONT}`;
    ctx2.fillText('THANK YOU', w / 2, 218);
  });
  const cust = new THREE.Mesh(new THREE.PlaneGeometry(0.14, 0.1), basic(0xffffff, { map: custTex }));
  cust.position.set(0.8, 1.08, 0.238);
  g.add(cust);
  addBox(g, 1.12, 0.5, 0.015, physical(0xb0e1db, {
    transparent: true,
    opacity: 0.18,
    roughness: 0.05,
    metalness: 0.04,
    clearcoat: 1,
    depthWrite: false,
    outline: false,
  }), 0.43, 1.28, 0.25, { cast: false });
  addBox(g, 0.015, 0.52, 0.02, metal, -0.13, 1.28, 0.25, { cast: false });
  addBox(g, 0.015, 0.52, 0.02, metal, 0.99, 1.28, 0.25, { cast: false });

  // Hot snack case.
  const hot = new THREE.Group();
  hot.position.set(-0.73, 0.94, -0.02);
  g.add(hot);
  addBox(hot, 0.58, 0.46, 0.48, toon(0x355b55), 0, 0.23, 0, { cast: true });
  addBox(hot, 0.52, 0.02, 0.42, basic(0xffca7c), 0, 0.37, 0, { cast: false });
  addBox(hot, 0.54, 0.02, 0.44, basic(0xffdda0), 0, 0.18, 0, { cast: false });
  const fried = [0xe5a348, 0xd78346, 0xf2be63];
  for (let i = 0; i < 7; i++) {
    addBox(hot, 0.1, 0.07, 0.08, toon(fried[i % 3]), -0.19 + (i % 4) * 0.12, 0.39 + Math.floor(i / 4) * 0.02, -0.08 + (i % 2) * 0.13, {
      cast: false,
      ry: i * 0.4,
    });
  }
  addBox(hot, 0.54, 0.27, 0.4, physical(0xbde8df, {
    transparent: true,
    opacity: 0.22,
    roughness: 0.02,
    metalness: 0.05,
    clearcoat: 1,
    depthWrite: false,
    outline: false,
  }), 0, 0.46, 0, { cast: false });
  const hotTex = canvasTexture(512, 180, (ctx2, w, h) => {
    ctx2.fillStyle = '#f7e4b6';
    ctx2.fillRect(0, 0, w, h);
    ctx2.fillStyle = '#a85039';
    ctx2.font = `700 46px ${LATIN_FONT}`;
    ctx2.textAlign = 'center';
    ctx2.fillText('HOT SNACK', w / 2, 74);
    ctx2.fillStyle = '#496a5e';
    ctx2.font = `700 25px ${JP_FONT}`;
    ctx2.fillText('揚げたて ・ からあげ', w / 2, 120);
    ctx2.fillStyle = '#e4a45a';
    ctx2.fillRect(60, 144, w - 120, 3);
  });
  addPlane(hot, 0.4, 0.14, planeMaterial(hotTex), 0, 0.33, 0.244, { renderOrder: 4 });
  addGlowSprite(hot, 0xffc47d, 0.65, 0, 0.54, 0.1, 0.16);

  // Oden counter.
  const oden = new THREE.Group();
  oden.position.set(0.88, 0.94, -0.02);
  g.add(oden);
  addRoundedBox(oden, 0.64, 0.16, 0.46, 0.025, toon(0x8a8c7c), 0, 0.09, 0, { segments: 2, cast: true });
  addBox(oden, 0.58, 0.045, 0.4, toon(0xc1874f), 0, 0.155, 0, { cast: false });
  for (let i = 1; i < 3; i++) addBox(oden, 0.012, 0.12, 0.39, toon(0x867d67), -0.31 + i * 0.205, 0.09, 0, { cast: false });
  addBox(oden, 0.58, 0.012, 0.012, toon(0x867d67), 0, 0.09, -0.12, { cast: false });
  addCylinder(oden, 0.075, 0.075, 0.05, toon(0xd7c28c), -0.18, 0.18, 0.02, { segments: 10, cast: false });
  addCylinder(oden, 0.065, 0.07, 0.065, toon(0xf2ddad), 0.02, 0.19, -0.07, { segments: 9, cast: false });
  addCylinder(oden, 0.075, 0.075, 0.04, toon(0x8e6c4b), 0.16, 0.18, 0.04, { segments: 8, cast: false });
  addCylinder(oden, 0.05, 0.05, 0.16, toon(0xd0a26e), -0.12, 0.2, -0.1, { segments: 8, cast: false, rz: 0.1 });
  addCylinder(oden, 0.06, 0.06, 0.06, toon(0xe9d9ad), 0.13, 0.19, -0.1, { segments: 8, cast: false });
  addBox(oden, 0.35, 0.09, 0.3, physical(0xb8dad3, {
    transparent: true,
    opacity: 0.22,
    roughness: 0.03,
    metalness: 0.04,
    clearcoat: 1,
    depthWrite: false,
    outline: false,
  }), 0, 0.25, 0, { cast: false });
  const odenTex = canvasTexture(512, 160, (ctx2, w, h) => {
    ctx2.fillStyle = '#f5e9c9';
    ctx2.fillRect(0, 0, w, h);
    ctx2.fillStyle = '#a9583e';
    ctx2.font = `700 47px ${JP_FONT}`;
    ctx2.textAlign = 'center';
    ctx2.fillText('おでん', w / 2, 67);
    ctx2.fillStyle = '#59726a';
    ctx2.font = `700 22px ${JP_FONT}`;
    ctx2.fillText('だいこん・たまご・こんにゃく', w / 2, 108);
    ctx2.fillStyle = '#d18d4f';
    ctx2.font = `700 20px ${LATIN_FONT}`;
    ctx2.fillText('WARM & READY', w / 2, 137);
  });
  addPlane(oden, 0.37, 0.12, planeMaterial(odenTex), 0, 0.52, 0.22, { renderOrder: 3 });
  addBox(oden, 0.02, 0.22, 0.02, metal, -0.28, 0.39, 0.18, { cast: false });
  addBox(oden, 0.02, 0.22, 0.02, metal, 0.28, 0.39, 0.18, { cast: false });

  makeSteam(parent, ctx, new THREE.Vector3(0.3 + 0.88, 1.37, -2.56), 8, 0.8, 0.16, 0.19, 0xfff2da, 0.13);
  makeSteam(parent, ctx, new THREE.Vector3(0.3 - 0.73, 1.4, -2.56), 5, 0.55, 0.2, 0.13, 0xffefd0, 0.08);

  addBox(g, 0.3, 0.18, 0.22, toon(0xc7bda6), 0.3, 1.0, -0.3, { cast: false });
  addBox(g, 0.1, 0.009, 0.16, basic(0xf2ead2), 0.3, 1.096, -0.3, { cast: false });
  addCylinder(g, 0.07, 0.07, 0.2, toon(0xe9e4d5), 0.64, 1.05, -0.4, { segments: 9, cast: false });

  const basketMat = toon(0xb86755);
  for (let i = 0; i < 4; i++) {
    addBox(parent, 0.38, 0.15, 0.3, basketMat, 1.94, 0.26 + i * 0.145, 1.48, { cast: true, ry: 0.08 });
    addBox(parent, 0.32, 0.03, 0.24, toon(0x7d4238), 1.94, 0.33 + i * 0.145, 1.48, { cast: false });
  }
  addGroundGlow(parent, 0xffdb9e, 2.5, 1.4, 0.7, -1.9, 0.1, 0.181);
}

function buildCoffeeStation(parent, ctx) {
  const g = new THREE.Group();
  g.position.set(1.58, 0.17, -4.1);
  parent.add(g);
  const wood = toon(0x9d7046);
  const teal = toon(0x315b55);
  const dark = toon(0x263b3b);
  const metal = toon(0x9aa69c);
  addBox(g, 0.92, 0.84, 0.6, wood, 0, 0.43, 0, { cast: true });
  addBox(g, 0.96, 0.06, 0.64, toon(0xe1d5ba), 0, 0.87, 0, { cast: true });
  addBox(g, 0.88, 0.035, 0.03, teal, 0, 0.83, 0.32, { cast: false });
  addRoundedBox(g, 0.42, 0.62, 0.38, 0.035, dark, 0.04, 1.21, 0.04, { segments: 2, cast: true });
  addBox(g, 0.34, 0.25, 0.025, basic(0x27434a), 0.04, 1.33, 0.24, { cast: false });
  addBox(g, 0.29, 0.2, 0.018, basic(0x9ceee0), 0.04, 1.34, 0.255, { cast: false });
  addBox(g, 0.21, 0.014, 0.012, basic(0xf7fbef), 0.04, 1.36, 0.266, { cast: false });
  addBox(g, 0.16, 0.012, 0.012, basic(0xf7fbef), 0.04, 1.32, 0.266, { cast: false });
  addBox(g, 0.07, 0.14, 0.025, metal, 0.04, 1.13, 0.24, { cast: false });
  addBox(g, 0.09, 0.04, 0.09, dark, 0.04, 1.11, 0.24, { cast: true });
  addBox(g, 0.23, 0.02, 0.17, toon(0x555f59), 0.04, 1.04, 0.22, { cast: false });
  addCylinder(g, 0.047, 0.04, 0.08, toon(0xf4ead8), 0.04, 1.0, 0.26, { segments: 8, cast: false });
  addCylinder(g, 0.047, 0.04, 0.08, toon(0xf4ead8), 0.04, 1.075, 0.26, { segments: 8, cast: false });
  addGlowSprite(g, 0x7df0dc, 0.45, 0.04, 1.35, 0.3, 0.09);
  for (let i = 0; i < 4; i++) addCylinder(g, 0.04, 0.036, 0.07, toon(0xece5d5), 0.3, 1.02 + i * 0.07, 0.12, { segments: 8, cast: false });
  addBox(g, 0.14, 0.13, 0.14, basic(0x665c4c, { transparent: true, opacity: 0.7 }), -0.26, 1.0, 0.2, { cast: false });
  addCylinder(g, 0.03, 0.03, 0.05, toon(0x303c38), -0.26, 1.09, 0.2, { segments: 8, cast: false });

  addBox(g, 1.06, 0.5, 0.05, toon(0x2c4d49), 0.04, 1.84, -0.2, { cast: true });
  addPlane(g, 1.01, 0.45, planeMaterial(coffeeMenuTexture()), 0.04, 1.84, -0.17);
  addGlowSprite(g, 0xffdcab, 0.8, 0.04, 1.82, -0.15, 0.07);
  addBox(g, 0.94, 0.04, 0.16, toon(0x8f6c49), 0.0, 1.58, 0.1, { cast: true });
  const carton = [0xe5d9c1, 0x768fa5, 0xb96850, 0xd2b46a, 0x7f9c8a, 0xc6a2b3];
  for (let i = 0; i < 8; i++) addBox(g, 0.075, 0.12, 0.08, toon(carton[i % carton.length]), -0.35 + i * 0.1, 1.66, 0.08, { cast: false });

  makeSteam(parent, ctx, new THREE.Vector3(1.62, 1.67, -3.72), 5, 0.7, 0.12, 0.18, 0xfff2dc, 0.075);
  addGroundPlane(parent, 0.9, 0.6, toon(0x3f5d54), 1.55, 0.181, -3.35);
}

/* ------------------------------------------------------------------ */
/* Public                                                             */
/* ------------------------------------------------------------------ */

export function buildFixtures(parent, ctx) {
  buildFridge(parent);
  buildBentoCase(parent);
  buildMagazines(parent);
  buildSnackShelves(parent, mulberry32(31));
  buildIceCreamFreezer(parent);
  buildCounter(parent, ctx);
  buildCoffeeStation(parent, ctx);
}
