import * as THREE from 'three';
import {
  addBox,
  addCylinder,
  addPlane,
  addGroundPlane,
  addGlowSprite,
  addTube,
  toon,
  basic,
  physical,
  planeMaterial,
  canvasTexture,
  promoPosterTexture,
  promoStripTexture,
  windowDecalTexture,
  JP_FONT,
  LATIN_FONT,
  drawStar,
} from './lib.js';
import { buildFixtures } from './store-fixtures.js';

/* ------------------------------------------------------------------ */
/* Interior lights and hanging shop furniture                         */
/* ------------------------------------------------------------------ */

export function buildInteriorLighting(parent, ctx) {
  const beam = toon(0x4b5d5c);
  const housing = toon(0xd8c7a8);
  const cableMat = toon(0x333f40);
  const lightMats = [];
  const fixtures = [
    [-2.35, 2.72, -0.45, 1.55],
    [-2.25, 2.72, -2.2, 1.55],
    [0.35, 2.72, -2.75, 1.2],
    [0.55, 2.72, -0.55, 1.1],
  ];
  for (const [x, y, z, w] of fixtures) {
    addBox(parent, w, 0.075, 0.22, housing, x, y, z, { cast: false });
    const diff = new THREE.Mesh(new THREE.BoxGeometry(w - 0.09, 0.015, 0.17), basic(0xffeac3));
    diff.position.set(x, y - 0.045, z);
    parent.add(diff);
    lightMats.push(diff.material);
    addGlowSprite(parent, 0xffd9a1, w * 1.15, x, y - 0.12, z, 0.09);
    for (const dx of [-w * 0.36, w * 0.36]) {
      addCylinder(parent, 0.006, 0.006, 1.25, cableMat, x + dx, y + 0.65, z, { segments: 4, cast: false });
    }
  }

  for (const z of [-3.55, -1.7, 0.1]) {
    addBox(parent, 5.8, 0.06, 0.06, beam, -0.95, 3.88, z, { cast: false });
  }
  for (const x of [-3.5, -1.5, 0.6, 1.9]) {
    addBox(parent, 0.06, 0.06, 5.95, beam, x, 3.92, -1.35, { cast: false });
  }

  ctx.lights.push({ type: 'point', color: 0xffd49a, intensity: 26.0, distance: 8.2, pos: [-1.9, 2.46, -1.15] });
  ctx.lights.push({ type: 'point', color: 0xffbd7c, intensity: 20.0, distance: 7.2, pos: [0.9, 2.38, -2.65] });
  ctx.lights.push({ type: 'point', color: 0xffd59a, intensity: 11.0, distance: 4.8, pos: [1.1, 2.15, 0.75] });
  ctx.lights.push({ type: 'point', color: 0xffc37f, intensity: 22.0, distance: 6.8, pos: [1.25, 2.25, 2.35] });
  ctx.lights.push({ type: 'point', color: 0xffe3bd, intensity: 7.0, distance: 3.8, pos: [1.55, 1.95, -3.95] });

  ctx.updaters.push({
    update(t) {
      const pulse = 0.985 + Math.sin(t * 0.36) * 0.012 + Math.sin(t * 2.1) * 0.004;
      for (const mat of lightMats) mat.color.setRGB(1.0 * pulse, 0.916 * pulse, 0.76 * pulse);
    },
  });
}

/* ------------------------------------------------------------------ */
/* Signage and interior props                                         */
/* ------------------------------------------------------------------ */

function clockTexture() {
  return canvasTexture(512, 512, (ctx, w, h) => {
    ctx.fillStyle = '#f6edda';
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, 238, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#2d5150';
    ctx.lineWidth = 15;
    ctx.stroke();
    ctx.fillStyle = '#345756';
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
      ctx.save();
      ctx.translate(w / 2 + Math.cos(a) * 196, h / 2 + Math.sin(a) * 196);
      ctx.rotate(a + Math.PI / 2);
      ctx.fillRect(-5, -15, 10, 30);
      ctx.restore();
    }
    ctx.font = `700 29px ${LATIN_FONT}`;
    ctx.fillStyle = '#57706c';
    ctx.textAlign = 'center';
    ctx.fillText('HOSHIZORA', w / 2, 172);
    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.rotate(((1 + 47 / 60) / 12) * Math.PI * 2);
    ctx.fillStyle = '#294642';
    ctx.fillRect(-8, -106, 16, 120);
    ctx.restore();
    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.rotate((47 / 60) * Math.PI * 2);
    ctx.fillStyle = '#2d4b48';
    ctx.fillRect(-5, -188, 10, 202);
    ctx.fillStyle = '#ce7957';
    ctx.fillRect(-2, -196, 4, 210);
    ctx.restore();
    ctx.fillStyle = '#d9855e';
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(45,75,73,0.28)';
    ctx.font = `600 16px ${LATIN_FONT}`;
    ctx.fillText('2:17 AM', w / 2, 382);
  });
}

function bannerTexture(kind) {
  const specs = {
    coffee: { bg: '#f2e6cc', fg: '#2d5150', accent: '#cf7b52', big: 'COFFEE', jp: 'あったか〜い', price: '¥100' },
    oden: { bg: '#2e5653', fg: '#fff3dc', accent: '#e7a464', big: 'ODEN', jp: 'おでん', price: 'はじめました' },
    fresh: { bg: '#f6e4d0', fg: '#3d4d46', accent: '#6fb7a3', big: 'FRESH', jp: 'おにぎり', price: '毎日炊きたて' },
  };
  const s = specs[kind] ?? specs.coffee;
  return canvasTexture(320, 900, (ctx, w, h) => {
    ctx.fillStyle = s.bg;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = s.accent;
    ctx.fillRect(0, 0, w, 22);
    ctx.fillRect(0, h - 22, w, 22);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = s.fg;
    ctx.font = `800 56px ${LATIN_FONT}`;
    ctx.fillText(s.big, w / 2, 120);
    ctx.strokeStyle = s.accent;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(46, 165);
    ctx.lineTo(w - 46, 165);
    ctx.stroke();
    ctx.font = `700 40px ${JP_FONT}`;
    ctx.fillText(s.jp, w / 2, 238);
    ctx.font = `800 64px ${JP_FONT}`;
    ctx.fillStyle = s.accent;
    ctx.fillText(s.price, w / 2, 360);
    ctx.strokeStyle = s.fg;
    ctx.lineWidth = 5;
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.beginPath();
    ctx.roundRect(80, 430, 160, 134, 12);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = s.accent;
    ctx.fillRect(80, 478, 160, 38);
    ctx.fillStyle = s.fg;
    ctx.font = `700 18px ${JP_FONT}`;
    ctx.fillText('ほしぞらマート', w / 2, 520);
    ctx.beginPath();
    ctx.arc(249, 464, 28, -1.3, 1.3);
    ctx.stroke();
    ctx.fillStyle = s.fg;
    ctx.font = `600 20px ${JP_FONT}`;
    ctx.fillText('星見町二丁目店', w / 2, 660);
    drawStar(ctx, w / 2, 760, 37, 10, s.accent, 4);
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    for (let i = 0; i < 5; i++) ctx.fillRect(48, 815 + i * 8, w - 96, 2);
  });
}

function staffDoorTexture() {
  return canvasTexture(512, 768, (ctx, w, h) => {
    ctx.fillStyle = '#2e5c5a';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(255,248,227,0.32)';
    ctx.lineWidth = 5;
    ctx.strokeRect(30, 30, w - 60, h - 60);
    ctx.fillStyle = '#1d3d3e';
    ctx.fillRect(66, 72, w - 132, 252);
    ctx.fillStyle = 'rgba(164,223,208,0.26)';
    ctx.fillRect(78, 84, w - 156, 228);
    ctx.fillStyle = '#fff4da';
    ctx.font = `700 36px ${LATIN_FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText('STAFF ONLY', w / 2, 408);
    ctx.fillStyle = '#b8dfd1';
    ctx.font = `700 23px ${JP_FONT}`;
    ctx.fillText('関係者以外立入禁止', w / 2, 452);
    ctx.strokeStyle = '#7db4a5';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(102, 492);
    ctx.lineTo(w - 102, 492);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,246,222,0.68)';
    ctx.font = `700 19px ${JP_FONT}`;
    ctx.fillText('HOSHIZORA MART  /  BACK ROOM', w / 2, 535);
    ctx.fillStyle = '#b9a676';
    ctx.fillRect(w - 94, 380, 24, 96);
  });
}

function buildBackRoom(parent, innerBack) {
  addBox(parent, 1.02, 2.25, 0.08, toon(0x244844), 0.42, 1.27, innerBack + 0.045, { cast: true });
  addPlane(parent, 0.9, 2.12, planeMaterial(staffDoorTexture()), 0.42, 1.28, innerBack + 0.09);
  addBox(parent, 1.12, 0.06, 0.12, toon(0xb9ad91), 0.42, 2.37, innerBack + 0.06, { cast: true });
  addBox(parent, 0.08, 2.22, 0.12, toon(0xb9ad91), -0.11, 1.29, innerBack + 0.06, { cast: true });
  addBox(parent, 0.08, 2.22, 0.12, toon(0xb9ad91), 0.95, 1.29, innerBack + 0.06, { cast: true });
  addBox(parent, 0.045, 0.12, 0.04, basic(0xf5e7c2), 0.82, 1.16, innerBack + 0.14, { cast: false });
  const staffSignTex = canvasTexture(512, 128, (ctx, w, h) => {
    ctx.fillStyle = '#204b45';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#83d6bf';
    ctx.lineWidth = 4;
    ctx.strokeRect(8, 8, w - 16, h - 16);
    ctx.fillStyle = '#f1f1df';
    ctx.font = `700 35px ${LATIN_FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText('STAFF ONLY', w / 2, 54);
    ctx.fillStyle = '#9cdcc8';
    ctx.font = `700 23px ${JP_FONT}`;
    ctx.fillText('関係者以外立入禁止', w / 2, 92);
  });
  addBox(parent, 0.78, 0.19, 0.06, toon(0x182e2d), 0.42, 2.58, innerBack + 0.09, { cast: true });
  addPlane(parent, 0.72, 0.16, planeMaterial(staffSignTex), 0.42, 2.58, innerBack + 0.125);
  addGlowSprite(parent, 0x8fe7d1, 0.65, 0.42, 2.5, innerBack + 0.16, 0.08);

  const clock = new THREE.Mesh(new THREE.CircleGeometry(0.27, 36), basic(0xffffff, { map: clockTexture() }));
  clock.position.set(-2.62, 3.48, innerBack + 0.09);
  parent.add(clock);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.02, 5, 32), toon(0x365b58));
  rim.position.copy(clock.position);
  parent.add(rim);

  // A deep teal accent wall over the fridges gives the bright interior a
  // strong graphic silhouette, and carries the shop's after-hours message.
  addBox(parent, 5.9, 1.35, 0.045, toon(0x173f41), -0.02, 3.36, innerBack + 0.018, { cast: false });
  addBox(parent, 5.9, 0.028, 0.055, toon(0xc89c65), -0.02, 2.7, innerBack + 0.026, { cast: false });
  addBox(parent, 5.9, 0.025, 0.055, toon(0x6e9b87), -0.02, 4.02, innerBack + 0.026, { cast: false });
  const wallText = canvasTexture(1400, 220, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(255,242,213,0.9)';
    ctx.font = `700 64px ${JP_FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText('今日も、おつかれさま。', w / 2, 92);
    ctx.fillStyle = 'rgba(154,218,198,0.85)';
    ctx.font = `600 22px ${LATIN_FONT}`;
    ctx.letterSpacing = '6px';
    ctx.fillText('A  LITTLE  LIGHT  FOR  THE  RAINY  NIGHT', w / 2, 139);
    ctx.letterSpacing = '0px';
    ctx.fillStyle = 'rgba(232,174,112,0.55)';
    ctx.fillRect(w / 2 - 180, 166, 360, 2);
    drawStar(ctx, w - 120, 84, 28, 8, '#e8bb7b', 4);
  });
  addPlane(parent, 3.0, 0.46, basic(0xffffff, { map: wallText, transparent: true, depthWrite: false }), -0.98, 3.5, innerBack + 0.055);
  // A little backlit menu / promotion board, mounted off-centre.
  const promo = canvasTexture(760, 280, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, '#203d3e');
    g.addColorStop(1, '#102d32');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#d4ac72';
    ctx.lineWidth = 5;
    ctx.strokeRect(12, 12, w - 24, h - 24);
    ctx.fillStyle = '#f5e7c7';
    ctx.font = `700 40px ${JP_FONT}`;
    ctx.textAlign = 'left';
    ctx.fillText('ホットスナック', 36, 82);
    ctx.fillStyle = '#eeb679';
    ctx.font = `700 27px ${LATIN_FONT}`;
    ctx.fillText('FRIED CHICKEN  /  CROQUETTE', 38, 125);
    ctx.fillStyle = '#9edac4';
    ctx.font = `700 34px ${JP_FONT}`;
    ctx.fillText('できたて  ¥198〜', 38, 192);
    ctx.strokeStyle = 'rgba(200,151,99,0.7)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(38, 215);
    ctx.lineTo(w - 38, 215);
    ctx.stroke();
    drawStar(ctx, w - 91, 130, 34, 9, '#dba66e', 4);
    ctx.fillStyle = 'rgba(255,242,210,0.52)';
    ctx.font = `600 17px ${JP_FONT}`;
    ctx.fillText('22:00 まで 揚げたてをお届けします', 38, 246);
  });
  addBox(parent, 1.92, 0.73, 0.055, toon(0x163132), 1.0, 3.0, innerBack + 0.06, { cast: true });
  addPlane(parent, 1.82, 0.65, planeMaterial(promo), 1.0, 3.0, innerBack + 0.098);
  addGlowSprite(parent, 0xffd7a1, 1.4, 1.0, 3.0, innerBack + 0.15, 0.04);
  // A second lightbox gives the wall a strong horizontal rhythm.
  const hotBoard = canvasTexture(1120, 220, (ctx3, w, h) => {
    ctx3.fillStyle = '#f4e5c5';
    ctx3.fillRect(0, 0, w, h);
    ctx3.fillStyle = '#2d5a50';
    ctx3.font = `700 56px ${JP_FONT}`;
    ctx3.textAlign = 'left';
    ctx3.fillText('できたて ホットスナック', 38, 86);
    ctx3.fillStyle = '#bf6549';
    ctx3.font = `700 35px ${JP_FONT}`;
    ctx3.fillText('からあげ  ¥198  /  コロッケ  ¥128  /  フランク  ¥158', 40, 144);
    ctx3.fillStyle = '#547f74';
    ctx3.font = `600 20px ${LATIN_FONT}`;
    ctx3.letterSpacing = '3px';
    ctx3.fillText('FRESHLY FRIED  /  HOSHIZORA MART', 42, 184);
    ctx3.letterSpacing = '0px';
    ctx3.fillStyle = '#e4a260';
    ctx3.fillRect(0, h - 15, w, 15);
    drawStar(ctx3, w - 78, 82, 28, 8, '#db9354', 4);
  });
  addBox(parent, 2.75, 0.58, 0.045, toon(0x23423e), -2.22, 3.05, innerBack + 0.055, { cast: true });
  addPlane(parent, 2.67, 0.51, planeMaterial(hotBoard), -2.22, 3.05, innerBack + 0.082);
  addGlowSprite(parent, 0xffd7a0, 1.4, -2.22, 3.05, innerBack + 0.12, 0.03);

  // A slim strip of coloured tiled band along the wall base.
  for (let i = 0; i < 14; i++) {
    addBox(parent, 0.28, 0.12, 0.025, toon(i % 3 === 0 ? 0xe5ae70 : i % 3 === 1 ? 0x67a893 : 0xd76f58), -3.25 + i * 0.34, 2.78, innerBack + 0.028, { cast: false });
  }
}

function buildHangingSigns(parent, ctx) {
  const hanging = [];
  const specs = [
    { x: -2.05, z: -0.52, y: 2.38, text: 'お菓子・スナック', sub: 'SNACKS & SWEETS' },
    { x: -2.0, z: -1.78, y: 2.38, text: '日用品・雑貨', sub: 'DAILY GOODS' },
    { x: 0.56, z: -2.9, y: 2.22, text: 'レジ', sub: 'CHECKOUT' },
  ];
  for (let i = 0; i < specs.length; i++) {
    const spec = specs[i];
    const pivot = new THREE.Group();
    pivot.position.set(spec.x, spec.y + 0.52, spec.z);
    parent.add(pivot);
    const tex = canvasTexture(960, 260, (ctx2, w, h) => {
      ctx2.fillStyle = i === 2 ? '#2e5c55' : '#f3ead4';
      ctx2.fillRect(0, 0, w, h);
      ctx2.strokeStyle = i === 2 ? '#8ce0c8' : '#557f72';
      ctx2.lineWidth = 6;
      ctx2.strokeRect(8, 8, w - 16, h - 16);
      ctx2.fillStyle = i === 2 ? '#f5ecd7' : '#315b51';
      ctx2.font = `700 68px ${JP_FONT}`;
      ctx2.textAlign = 'center';
      ctx2.fillText(spec.text, w / 2, 107);
      ctx2.fillStyle = i === 2 ? '#9ce7d2' : '#8b7058';
      ctx2.font = `700 27px ${LATIN_FONT}`;
      ctx2.letterSpacing = '3px';
      ctx2.fillText(spec.sub, w / 2, 165);
      ctx2.letterSpacing = '0px';
      drawStar(ctx2, w / 2, 213, 15, 4, i === 2 ? '#f0c37d' : '#d8895b', 4);
    });
    addBox(pivot, 1.14, 0.33, 0.04, toon(0x2c4d49), 0, -0.29, 0, { cast: false });
    addPlane(pivot, 1.08, 0.28, planeMaterial(tex), 0, -0.29, 0.021);
    addPlane(pivot, 1.08, 0.28, planeMaterial(tex), 0, -0.29, -0.021, { ry: Math.PI });
    addCylinder(pivot, 0.007, 0.007, 0.55, toon(0x3a4644), -0.47, 0.02, 0, { segments: 4, cast: false });
    addCylinder(pivot, 0.007, 0.007, 0.55, toon(0x3a4644), 0.47, 0.02, 0, { segments: 4, cast: false });
    hanging.push({ pivot, phase: i * 1.7 });
  }
  ctx.updaters.push({
    update(t) {
      for (const h of hanging) {
        h.pivot.rotation.y = Math.sin(t * 0.55 + h.phase) * 0.018;
        h.pivot.rotation.z = Math.sin(t * 0.7 + h.phase) * 0.012;
      }
    },
  });

  const banners = [];
  for (let i = 0; i < 2; i++) {
    const x = i === 0 ? -3.16 : 1.88;
    const z = 1.47;
    const pivot = new THREE.Group();
    pivot.position.set(x, 2.62, z);
    parent.add(pivot);
    addCylinder(pivot, 0.006, 0.006, 0.23, toon(0x3e4a47), 0, 0.03, 0, { segments: 4, cast: false });
    const tex = bannerTexture(i === 0 ? 'coffee' : 'fresh');
    addPlane(pivot, 0.31, 0.78, planeMaterial(tex), 0, -0.38, 0.002, { renderOrder: 3 });
    addPlane(pivot, 0.31, 0.78, planeMaterial(tex), 0, -0.38, -0.002, { ry: Math.PI, renderOrder: 3 });
    addCylinder(pivot, 0.008, 0.008, 0.32, toon(0x5e4d3b), 0, -0.79, 0, { rz: Math.PI / 2, cast: false });
    banners.push({ pivot, phase: i * 2.2 });
  }
  ctx.updaters.push({
    update(t) {
      for (const b of banners) {
        b.pivot.rotation.z = Math.sin(t * 1.1 + b.phase) * 0.03;
        b.pivot.rotation.y = Math.sin(t * 0.7 + b.phase) * 0.02;
      }
    },
  });
}

function buildInteriorProps(parent, ctx, floorY, innerBack) {
  buildHangingSigns(parent, ctx);
  addPlane(parent, 0.44, 0.61, planeMaterial(promoPosterTexture('oden')), -0.05, 3.26, innerBack + 0.09);
  addPlane(parent, 0.46, 0.64, planeMaterial(promoPosterTexture('bento')), 1.04, 3.28, innerBack + 0.12);
  addPlane(parent, 0.44, 0.61, planeMaterial(promoPosterTexture('milk')), -2.65, 2.94, innerBack + 0.07);

  addCylinder(parent, 0.16, 0.13, 0.5, toon(0x667a70), 1.62, floorY + 0.25, -3.2, { segments: 10, cast: true });
  addCylinder(parent, 0.17, 0.17, 0.04, toon(0x3d4d47), 1.62, floorY + 0.52, -3.2, { segments: 10, cast: true });
  addBox(parent, 0.3, 0.02, 0.3, basic(0x9fd7c9, { transparent: true, opacity: 0.4 }), 1.62, floorY + 0.54, -3.2, { cast: false });

  addCylinder(parent, 0.17, 0.17, 0.03, toon(0x3c5754), 1.86, 3.22, innerBack + 0.07, { rx: Math.PI / 2, segments: 18, cast: false });
  addCylinder(parent, 0.14, 0.14, 0.01, basic(0xf2ead6), 1.86, 3.22, innerBack + 0.085, { rx: Math.PI / 2, segments: 18, cast: false });

  const pathMat = basic(0x8fc6ad, { transparent: true, opacity: 0.55 });
  addGroundPlane(parent, 0.12, 2.4, pathMat, 1.42, floorY + 0.007, 0.28);
  addGroundPlane(parent, 0.08, 2.4, basic(0xe5a568, { transparent: true, opacity: 0.4 }), 1.25, floorY + 0.008, 0.28);
  addGroundPlane(parent, 2.0, 0.06, basic(0x7fc9b2, { transparent: true, opacity: 0.28 }), -2.05, floorY + 0.007, 0.4);
  addGroundPlane(parent, 0.07, 1.3, basic(0xd3a36a, { transparent: true, opacity: 0.3 }), -0.82, floorY + 0.007, -1.36);
  const arrowTex = canvasTexture(512, 512, (ctx2, w, h) => {
    ctx2.clearRect(0, 0, w, h);
    ctx2.fillStyle = 'rgba(245,239,218,0.72)';
    ctx2.beginPath();
    ctx2.moveTo(w / 2, 42);
    ctx2.lineTo(w - 74, 205);
    ctx2.lineTo(w / 2 + 44, 190);
    ctx2.lineTo(w / 2 + 44, 460);
    ctx2.lineTo(w / 2 - 44, 460);
    ctx2.lineTo(w / 2 - 44, 190);
    ctx2.lineTo(74, 205);
    ctx2.closePath();
    ctx2.fill();
  });
  addGroundPlane(parent, 0.42, 0.42, basic(0xffffff, { map: arrowTex, transparent: true, depthWrite: false, opacity: 0.75 }), 1.42, floorY + 0.009, 0.86);
  addGroundPlane(parent, 0.4, 0.4, basic(0xffffff, { map: arrowTex, transparent: true, depthWrite: false, opacity: 0.62 }), 1.42, floorY + 0.009, -1.53, { rotation: Math.PI });

  addBox(parent, 0.65, 1.65, 0.34, toon(0x697a70), 1.76, floorY + 0.825, -3.55, { cast: true });
  for (let i = 0; i < 2; i++) addBox(parent, 0.54, 0.04, 0.02, toon(0x44564f), 1.76, floorY + 0.56 + i * 0.55, -3.37, { cast: false });
  addBox(parent, 0.03, 0.09, 0.02, toon(0x253e3a), 1.85, floorY + 0.9, -3.37, { cast: false });
  addBox(parent, 0.56, 0.12, 0.02, toon(0x3f5d54), 1.76, floorY + 1.76, -3.37, { cast: false });
  addBox(parent, 0.32, 0.38, 0.04, toon(0x476d64), 1.72, floorY + 0.88, -3.36, { cast: false, rz: -0.05 });

  const tinyPlant = new THREE.Group();
  tinyPlant.position.set(-0.98, floorY, -2.14);
  parent.add(tinyPlant);
  addCylinder(tinyPlant, 0.09, 0.075, 0.17, toon(0x776650), 0, 0.085, 0, { segments: 8, cast: true });
  for (let i = 0; i < 5; i++) {
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.09, 5, 4), toon(i % 2 ? 0x4f785e : 0x6a906e));
    leaf.scale.set(1, 1.4, 0.5);
    leaf.position.set((i - 2) * 0.04, 0.23 + (i % 3) * 0.05, (i % 2 - 0.5) * 0.08);
    leaf.rotation.z = (i - 2) * 0.35;
    leaf.castShadow = true;
    tinyPlant.add(leaf);
  }

  addGroundPlane(parent, 0.8, 0.28, basic(0xffffff, { map: windowDecalTexture('welcome'), transparent: true, depthWrite: false, opacity: 0.2 }), 1.22, floorY + 0.009, 1.23);

  // The tall left wall is visible over the window display. Give it a hand-
  // painted mural rather than a blank cream surface.
  const mural = canvasTexture(1200, 720, (ctx2, w, h) => {
    const g = ctx2.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#eedfc1');
    g.addColorStop(1, '#d9c39d');
    ctx2.fillStyle = g;
    ctx2.fillRect(0, 0, w, h);
    ctx2.fillStyle = '#1e4b49';
    ctx2.beginPath();
    ctx2.moveTo(0, h * 0.72);
    ctx2.quadraticCurveTo(w * 0.26, h * 0.4, w * 0.52, h * 0.7);
    ctx2.quadraticCurveTo(w * 0.76, h * 0.93, w, h * 0.62);
    ctx2.lineTo(w, h);
    ctx2.lineTo(0, h);
    ctx2.closePath();
    ctx2.fill();
    ctx2.fillStyle = '#6db7a1';
    ctx2.beginPath();
    ctx2.moveTo(0, h * 0.83);
    ctx2.quadraticCurveTo(w * 0.3, h * 0.58, w * 0.58, h * 0.84);
    ctx2.quadraticCurveTo(w * 0.8, h * 1.02, w, h * 0.76);
    ctx2.lineTo(w, h);
    ctx2.lineTo(0, h);
    ctx2.closePath();
    ctx2.fill();
    ctx2.fillStyle = '#df8358';
    ctx2.beginPath();
    ctx2.arc(w * 0.17, h * 0.25, 82, 0, Math.PI * 2);
    ctx2.fill();
    ctx2.fillStyle = '#f1e5c7';
    ctx2.beginPath();
    ctx2.arc(w * 0.17, h * 0.25, 59, 0, Math.PI * 2);
    ctx2.fill();
    ctx2.fillStyle = '#32534e';
    ctx2.font = `700 72px ${JP_FONT}`;
    ctx2.textAlign = 'left';
    ctx2.fillText('雨の日も、', 280, 170);
    ctx2.fillText('いつもの場所で。', 280, 260);
    ctx2.fillStyle = '#a36f4e';
    ctx2.font = `600 25px ${LATIN_FONT}`;
    ctx2.letterSpacing = '5px';
    ctx2.fillText('HOSHIZORA MART  /  星見町', 286, 318);
    ctx2.letterSpacing = '0px';
    for (let i = 0; i < 4; i++) {
      ctx2.fillStyle = 'rgba(255,244,220,0.62)';
      ctx2.fillRect(282, 366 + i * 16, 380 - i * 35, 3);
    }
    drawStar(ctx2, 1020, 112, 44, 12, '#e6b56e', 4);
    for (let i = 0; i < 3; i++) {
      const x = 860 + i * 85;
      ctx2.strokeStyle = 'rgba(255,244,219,0.48)';
      ctx2.lineWidth = 6;
      ctx2.beginPath();
      ctx2.arc(x, 470, 62, Math.PI, Math.PI * 2);
      ctx2.stroke();
      ctx2.beginPath();
      ctx2.moveTo(x, 470);
      ctx2.lineTo(x, 610);
      ctx2.stroke();
      ctx2.strokeStyle = 'rgba(255,244,219,0.32)';
      ctx2.beginPath();
      ctx2.arc(x - 30, 610, 30, 0, Math.PI * 0.5);
      ctx2.stroke();
    }
  });
  addBox(parent, 0.055, 1.2, 3.25, toon(0x294c48), -3.9, 3.22, -0.5, { cast: false });
  addPlane(parent, 3.14, 1.12, planeMaterial(mural), -3.865, 3.22, -0.5, { ry: Math.PI / 2, renderOrder: 2 });
  addBox(parent, 0.075, 0.035, 3.3, toon(0x8b6e4b), -3.9, 3.83, -0.5, { cast: false });
  addGlowSprite(parent, 0xffd7a2, 2.0, -3.77, 3.18, -0.5, 0.035);
  addBox(parent, 0.05, 0.035, 2.65, basic(0xffd59b, { transparent: true, opacity: 0.8 }), -3.88, 2.58, -0.3, { cast: false });
  addGlowSprite(parent, 0xffc783, 2.7, -3.8, 2.55, -0.3, 0.07);

  // A little festival garland of fabric pennants across the cutaway interior.
  const garland = new THREE.Group();
  parent.add(garland);
  const curvePoints = [];
  for (let i = 0; i <= 24; i++) {
    const c = i / 24;
    curvePoints.push([-3.55 + c * 5.3, 3.54 + Math.sin(Math.PI * c) * 0.18, -2.75]);
  }
  addTube(garland, curvePoints, 0.006, toon(0x5e5141), { segments: 30, radialSegments: 4, cast: false });
  const flagColors = [0xd96e50, 0xf0d18a, 0x6bb09b, 0xf4e7ca, 0x577f92, 0xd78c9f];
  const flagGeom = new THREE.ShapeGeometry((() => {
    const sh = new THREE.Shape();
    sh.moveTo(-0.075, 0);
    sh.lineTo(0.075, 0);
    sh.lineTo(0, -0.16);
    sh.closePath();
    return sh;
  })());
  const flagMatCache = flagColors.map((c) => basic(c, { side: THREE.DoubleSide }));
  const flags = [];
  for (let i = 0; i < 15; i++) {
    const c = (i + 0.5) / 15;
    const x = -3.55 + c * 5.3;
    const y = 3.54 + Math.sin(Math.PI * c) * 0.18 - 0.025;
    const pivot = new THREE.Group();
    pivot.position.set(x, y, -2.745);
    parent.add(pivot);
    const flag = new THREE.Mesh(flagGeom, flagMatCache[i % flagMatCache.length]);
    flag.position.y = 0;
    pivot.add(flag);
    const line = new THREE.Mesh(new THREE.BoxGeometry(0.002, 0.04, 0.002), toon(0x6c5d4b));
    line.position.y = 0.012;
    pivot.add(line);
    flags.push({ pivot, phase: i * 0.8 });
  }
  // A string of tiny warm bulbs along the same sagging line.
  for (let i = 0; i < 8; i++) {
    const c = (i + 0.4) / 8;
    const x = -3.55 + c * 5.3;
    const y = 3.54 + Math.sin(Math.PI * c) * 0.18 - 0.02;
    addGlowSprite(garland, 0xffd79f, 0.16, x, y, -2.74, 0.08);
  }
  ctx.updaters.push({
    update(t) {
      for (const f of flags) {
        f.pivot.rotation.z = Math.sin(t * 1.35 + f.phase) * 0.055;
        f.pivot.rotation.x = Math.cos(t * 0.9 + f.phase * 0.7) * 0.025;
      }
    },
  });

  // A few little things on the window line: recipe cards and a customer bell.
  const cards = canvasTexture(512, 300, (ctx2, w, h) => {
    ctx2.fillStyle = '#f2ead4';
    ctx2.fillRect(0, 0, w, h);
    ctx2.strokeStyle = '#88b5a5';
    ctx2.lineWidth = 4;
    ctx2.strokeRect(14, 14, w - 28, h - 28);
    ctx2.fillStyle = '#3e675e';
    ctx2.font = `700 45px ${JP_FONT}`;
    ctx2.textAlign = 'center';
    ctx2.fillText('今月の おすすめ', w / 2, 84);
    ctx2.fillStyle = '#ce7653';
    ctx2.font = `700 30px ${JP_FONT}`;
    ctx2.fillText('星のクリームパン', w / 2, 145);
    ctx2.fillStyle = '#53685e';
    ctx2.font = `700 22px ${JP_FONT}`;
    ctx2.fillText('ほかほか、焼きたて。', w / 2, 195);
    for (let i = 0; i < 3; i++) {
      ctx2.fillStyle = 'rgba(104,137,122,0.35)';
      ctx2.fillRect(84, 228 + i * 15, w - 168, 3);
    }
    drawStar(ctx2, w - 72, 72, 22, 6, '#dca865', 4);
  });
  addBox(parent, 0.43, 0.27, 0.035, toon(0x7c6750), -3.72, 1.33, 1.55, { cast: true, ry: 0.12 });
  addPlane(parent, 0.39, 0.23, planeMaterial(cards), -3.72, 1.33, 1.574, { ry: 0.12, renderOrder: 3 });
  addCylinder(parent, 0.09, 0.08, 0.035, toon(0xb5a27f), 0.9, floorY + 0.04, 1.25, { segments: 12, cast: false });
}

/* ------------------------------------------------------------------ */
/* Public                                                             */
/* ------------------------------------------------------------------ */

export function buildInterior(parent, ctx, floorY, innerBack) {
  buildFixtures(parent, ctx);
  buildBackRoom(parent, innerBack);
  buildInteriorProps(parent, ctx, floorY, innerBack);

  addGroundPlane(parent, 1.2, 0.4, toon(0x4f665a), 1.225, floorY + 0.005, 1.5);
  addBox(parent, 1.02, 0.02, 0.55, toon(0x415449), 1.225, floorY + 0.012, 1.52, { cast: false });
}
