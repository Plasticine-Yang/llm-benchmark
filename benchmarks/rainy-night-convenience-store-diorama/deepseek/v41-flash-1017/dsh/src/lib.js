import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { PALETTE } from './config.js';

export const JP_FONT = '"Hiragino Sans", "Hiragino Kaku Gothic ProN", "Yu Gothic", "Noto Sans JP", sans-serif';
export const JP_SERIF = '"Hiragino Mincho ProN", "Yu Mincho", "Times New Roman", serif';
export const LATIN_FONT = '"Avenir Next", "Futura", "Helvetica Neue", sans-serif';

let _gradient = null;
export function toonGradient() {
  if (_gradient) return _gradient;
  const data = new Uint8Array([32, 52, 84, 122, 180, 228, 255]);
  _gradient = new THREE.DataTexture(data, data.length, 1, THREE.RedFormat);
  _gradient.minFilter = THREE.NearestFilter;
  _gradient.magFilter = THREE.NearestFilter;
  _gradient.generateMipmaps = false;
  _gradient.needsUpdate = true;
  return _gradient;
}

export function outlineOff(material) {
  material.userData.outlineParameters = { visible: false };
  return material;
}

export function toon(color, opts = {}) {
  const mat = new THREE.MeshToonMaterial({
    color,
    gradientMap: toonGradient(),
    side: opts.side ?? THREE.FrontSide,
    transparent: opts.transparent ?? false,
    opacity: opts.opacity ?? 1,
    map: opts.map ?? null,
    alphaMap: opts.alphaMap ?? null,
    vertexColors: opts.vertexColors ?? false,
    emissive: opts.emissive ?? 0x000000,
    emissiveIntensity: opts.emissiveIntensity ?? 1,
    depthWrite: opts.depthWrite ?? true,
    fog: opts.fog ?? true,
  });
  if (opts.outline === false) outlineOff(mat);
  if (opts.name) mat.name = opts.name;
  return mat;
}

export function basic(color, opts = {}) {
  const mat = new THREE.MeshBasicMaterial({
    color,
    map: opts.map ?? null,
    transparent: opts.transparent ?? !!opts.map,
    opacity: opts.opacity ?? 1,
    alphaTest: opts.alphaTest ?? 0,
    side: opts.side ?? THREE.FrontSide,
    depthWrite: opts.depthWrite ?? true,
    depthTest: opts.depthTest ?? true,
    blending: opts.blending ?? THREE.NormalBlending,
    toneMapped: opts.toneMapped ?? false,
    fog: opts.fog ?? false,
  });
  mat.userData.outlineParameters = { visible: false };
  return mat;
}

export function glowMaterial(color, opacity = 0.35) {
  return basic(color, {
    transparent: true,
    opacity,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  });
}

export function physical(color, opts = {}) {
  const mat = new THREE.MeshPhysicalMaterial({
    color,
    roughness: opts.roughness ?? 0.22,
    metalness: opts.metalness ?? 0.18,
    clearcoat: opts.clearcoat ?? 1,
    clearcoatRoughness: opts.clearcoatRoughness ?? 0.08,
    envMapIntensity: opts.envMapIntensity ?? 1.0,
    transparent: opts.transparent ?? false,
    opacity: opts.opacity ?? 1,
    map: opts.map ?? null,
    side: opts.side ?? THREE.FrontSide,
    depthWrite: opts.depthWrite ?? true,
    emissive: opts.emissive ?? 0x000000,
    emissiveIntensity: opts.emissiveIntensity ?? 1,
  });
  if (opts.outline === false) outlineOff(mat);
  return mat;
}

export function standard(color, opts = {}) {
  const mat = new THREE.MeshStandardMaterial({
    color,
    roughness: opts.roughness ?? 0.55,
    metalness: opts.metalness ?? 0.0,
    map: opts.map ?? null,
    transparent: opts.transparent ?? false,
    opacity: opts.opacity ?? 1,
    side: opts.side ?? THREE.FrontSide,
    depthWrite: opts.depthWrite ?? true,
    envMapIntensity: opts.envMapIntensity ?? 0.5,
    emissive: opts.emissive ?? 0x000000,
    emissiveIntensity: opts.emissiveIntensity ?? 1,
  });
  if (opts.outline === false) outlineOff(mat);
  return mat;
}

/* ------------------------------------------------------------------ */
/* Procedural canvas textures                                          */
/* ------------------------------------------------------------------ */

export function canvasTexture(w, h, draw, opts = {}) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  draw(ctx, w, h);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = opts.linear ? THREE.NoColorSpace : THREE.SRGBColorSpace;
  tex.anisotropy = opts.anisotropy ?? 8;
  if (opts.repeat) {
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(opts.repeat[0], opts.repeat[1]);
  }
  return tex;
}

export function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

export function starPath(ctx, cx, cy, outer, inner, points = 4) {
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = -Math.PI / 2 + (Math.PI * i) / points;
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

export function drawStar(ctx, cx, cy, outer, inner, color, points = 4) {
  starPath(ctx, cx, cy, outer, inner, points);
  ctx.fillStyle = color;
  ctx.fill();
}

export function drawSparkle(ctx, x, y, r, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = color;
  for (let i = 0; i < 4; i++) {
    ctx.rotate(Math.PI / 2);
    ctx.beginPath();
    ctx.moveTo(0, -r);
    ctx.quadraticCurveTo(r * 0.12, -r * 0.15, 0, 0);
    ctx.quadraticCurveTo(-r * 0.12, -r * 0.15, 0, -r);
    ctx.fill();
  }
  ctx.restore();
}

export function brandSignTexture(variant = 'front') {
  const side = variant === 'side';
  const W = side ? 960 : 1280;
  const H = 256;
  return canvasTexture(W, H, (ctx) => {
    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, '#0a3037');
    bg.addColorStop(0.45, '#0e3c40');
    bg.addColorStop(1, '#082a35');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Retro-anime speed lines / halftone texture in the teal panel.
    ctx.globalAlpha = 0.09;
    ctx.strokeStyle = '#b9fff2';
    ctx.lineWidth = 2;
    for (let x = -200; x < W + 200; x += 36) {
      ctx.beginPath();
      ctx.moveTo(x, H);
      ctx.lineTo(x + 190, 0);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // Warm left emblem.
    ctx.fillStyle = '#f08758';
    ctx.beginPath();
    ctx.arc(124, 125, 77, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.16)';
    ctx.beginPath();
    ctx.arc(112, 108, 60, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fff0cc';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(124, 125, 66, -0.5, 2.2);
    ctx.stroke();
    drawStar(ctx, 129, 120, 44, 10, '#fff4d6', 4);
    drawSparkle(ctx, 69, 77, 14, '#fff4d6');

    const textX = side ? 230 : 236;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#fff7e4';
    ctx.shadowColor = 'rgba(255,193,120,0.38)';
    ctx.shadowBlur = 16;
    ctx.font = `700 ${side ? 78 : 80}px ${JP_FONT}`;
    ctx.fillText('ほしぞらマート', textX, 100);
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#a9e8d6';
    ctx.font = `700 ${side ? 26 : 28}px ${LATIN_FONT}`;
    ctx.letterSpacing = '4px';
    ctx.fillText('HOSHIZORA  MART', textX + 3, 161);
    ctx.letterSpacing = '0px';
    ctx.fillStyle = 'rgba(255,247,228,0.72)';
    ctx.font = `500 22px ${JP_FONT}`;
    ctx.fillText(side ? '星見町店  /  24 HOURS' : '星見町二丁目店  /  OPEN 24 HOURS', textX + 3, 197);

    // 24H roundel.
    const cx = W - 112;
    ctx.fillStyle = '#ffd28a';
    ctx.beginPath();
    ctx.arc(cx, 122, 63, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#12373b';
    ctx.font = `800 44px ${LATIN_FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText('24H', cx, 113);
    ctx.font = `700 17px ${JP_FONT}`;
    ctx.fillText('年中無休', cx, 150);

    // Bottom stripes.
    ctx.fillStyle = '#f08a57';
    ctx.fillRect(0, H - 18, W, 8);
    ctx.fillStyle = '#75d8c3';
    ctx.fillRect(0, H - 8, W, 8);

    // Glass sheen.
    const sheen = ctx.createLinearGradient(0, 0, W * 0.85, H);
    sheen.addColorStop(0, 'rgba(255,255,255,0.0)');
    sheen.addColorStop(0.45, 'rgba(255,255,255,0.07)');
    sheen.addColorStop(0.55, 'rgba(255,255,255,0.0)');
    ctx.fillStyle = sheen;
    ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = 'rgba(255,246,218,0.35)';
    ctx.lineWidth = 3;
    ctx.strokeRect(8, 8, W - 16, H - 16);
  });
}

export function plaqueTexture() {
  return canvasTexture(1024, 160, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#b29562');
    g.addColorStop(0.32, '#ddc38f');
    g.addColorStop(0.7, '#9c7e4e');
    g.addColorStop(1, '#6e5535');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(58,41,21,0.7)';
    ctx.lineWidth = 6;
    ctx.strokeRect(9, 9, w - 18, h - 18);
    ctx.strokeStyle = 'rgba(255,245,211,0.35)';
    ctx.lineWidth = 2;
    ctx.strokeRect(19, 19, w - 38, h - 38);
    drawStar(ctx, 95, 80, 27, 7, '#4c3820', 4);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#3b2b18';
    ctx.font = `700 37px ${JP_SERIF}`;
    ctx.fillText('星見町 ・ 雨の交差点', 146, 64);
    ctx.font = `600 20px ${LATIN_FONT}`;
    ctx.letterSpacing = '4px';
    ctx.fillStyle = 'rgba(58,42,23,0.85)';
    ctx.fillText('HOSHIZORA-MACHI  /  A RAINY NIGHT', 149, 108);
    ctx.textAlign = 'right';
    ctx.font = `600 22px ${LATIN_FONT}`;
    ctx.fillText('No. 0412', w - 54, 82);
  });
}

export function vendingTexture() {
  return canvasTexture(512, 960, (ctx, w, h) => {
    ctx.fillStyle = '#132e37';
    ctx.fillRect(0, 0, w, h);
    const body = ctx.createLinearGradient(0, 0, 0, h);
    body.addColorStop(0, '#1a4048');
    body.addColorStop(0.45, '#0b252f');
    body.addColorStop(1, '#122e39');
    ctx.fillStyle = body;
    ctx.fillRect(20, 20, w - 40, h - 40);
    ctx.strokeStyle = '#5fe6d3';
    ctx.lineWidth = 4;
    roundRect(ctx, 20, 20, w - 40, h - 40, 24);
    ctx.stroke();

    // Title.
    ctx.fillStyle = '#e9fff7';
    ctx.textAlign = 'center';
    ctx.font = `800 37px ${LATIN_FONT}`;
    ctx.letterSpacing = '5px';
    ctx.fillText('DRINK  STAND', w / 2, 82);
    ctx.letterSpacing = '0px';
    ctx.fillStyle = '#73dfd0';
    ctx.font = `600 18px ${JP_FONT}`;
    ctx.fillText('つめた〜い  /  ICE COLD', w / 2, 113);

    // Glowing product window.
    const wx = 47;
    const wy = 142;
    const ww = w - 94;
    const wh = 500;
    const win = ctx.createLinearGradient(0, wy, 0, wy + wh);
    win.addColorStop(0, '#eafff9');
    win.addColorStop(0.5, '#c9f5ee');
    win.addColorStop(1, '#aee8e4');
    ctx.fillStyle = win;
    roundRect(ctx, wx, wy, ww, wh, 12);
    ctx.fill();

    const drinks = [
      ['#ff775e', '#ffd18d', 'CITRUS'], ['#71c8ff', '#e9fbff', 'AQUA'],
      ['#71d9a6', '#efffd5', 'TEA'], ['#ff97ba', '#ffe4ee', 'PEACH'],
      ['#f4d15a', '#fff5c1', 'LEMON'], ['#8b7bff', '#e7e0ff', 'SODA'],
    ];
    const rowY = [166, 292, 418, 544];
    for (let row = 0; row < 4; row++) {
      ctx.fillStyle = 'rgba(22,84,88,0.16)';
      ctx.fillRect(wx + 8, rowY[row] + 100, ww - 16, 2);
      for (let col = 0; col < 6; col++) {
        const d = drinks[(row * 2 + col) % drinks.length];
        const x = wx + 21 + col * 62;
        const y = rowY[row] + (row === 3 ? 4 : 0);
        const dh = row === 3 ? 80 : 92;
        ctx.fillStyle = 'rgba(16,40,47,0.22)';
        roundRect(ctx, x + 3, y + 6, 48, dh, 8);
        ctx.fill();
        const g = ctx.createLinearGradient(x, y, x + 48, y + dh);
        g.addColorStop(0, d[1]);
        g.addColorStop(0.25, d[0]);
        g.addColorStop(1, d[0]);
        ctx.fillStyle = g;
        roundRect(ctx, x, y, 48, dh, 8);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.62)';
        roundRect(ctx, x + 7, y + 7, 8, dh - 16, 4);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        roundRect(ctx, x + 4, y + 33, 40, 25, 4);
        ctx.fill();
        ctx.fillStyle = d[0];
        ctx.font = `800 11px ${LATIN_FONT}`;
        ctx.textAlign = 'center';
        ctx.fillText(d[2], x + 24, y + 50);
        ctx.fillStyle = '#19444a';
        ctx.font = `700 10px ${JP_FONT}`;
        ctx.fillText('¥130', x + 24, y + dh - 8);
      }
    }

    // Selection buttons / LEDs.
    const by = 680;
    ctx.fillStyle = '#0a1d24';
    roundRect(ctx, 47, by, w - 94, 110, 10);
    ctx.fill();
    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 6; c++) {
        ctx.fillStyle = c === 2 && r === 0 ? '#ff9b79' : 'rgba(105,227,210,0.8)';
        ctx.beginPath();
        ctx.arc(81 + c * 58, 714 + r * 39, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(233,255,248,0.78)';
        ctx.font = `600 10px ${LATIN_FONT}`;
        ctx.textAlign = 'center';
        ctx.fillText(String(r * 6 + c + 1).padStart(2, '0'), 81 + c * 58, 736 + r * 39);
      }
    }

    // Coin / card panel.
    ctx.fillStyle = '#e7f8ec';
    roundRect(ctx, 47, 815, w - 94, 80, 9);
    ctx.fill();
    ctx.fillStyle = '#17343b';
    ctx.fillRect(66, 836, 96, 10);
    ctx.fillRect(66, 858, 72, 7);
    ctx.fillStyle = '#ff8c68';
    roundRect(ctx, 320, 830, 116, 45, 7);
    ctx.fill();
    ctx.fillStyle = '#fff7e6';
    ctx.font = `800 20px ${LATIN_FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText('IC', 378, 861);
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.fillRect(30, 30, 12, h - 60);
    ctx.fillStyle = '#8ff2de';
    ctx.font = `700 14px ${JP_FONT}`;
    ctx.fillText('雨の日も、ひんやり。', w / 2, 930);
  });
}

export function coffeeMenuTexture() {
  return canvasTexture(900, 420, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#fff6df');
    g.addColorStop(1, '#efd9b4');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#173d3e';
    ctx.fillRect(0, 0, w, 78);
    ctx.fillStyle = '#fff6df';
    ctx.font = `700 38px ${JP_FONT}`;
    ctx.textAlign = 'left';
    ctx.fillText('こだわりコーヒー', 38, 53);
    ctx.fillStyle = '#7adbc6';
    ctx.font = `700 19px ${LATIN_FONT}`;
    ctx.letterSpacing = '4px';
    ctx.fillText('FRESHLY BREWED', 440, 50);
    ctx.letterSpacing = '0px';

    const cups = [
      { x: 130, label: 'HOT', price: '¥100', color: '#8b4f2e', accent: '#e3a26f' },
      { x: 402, label: 'ICE', price: '¥120', color: '#356975', accent: '#9bd9d0' },
      { x: 674, label: 'LATTE', price: '¥160', color: '#b57a4a', accent: '#ffd4a1' },
    ];
    for (const c of cups) {
      const cx = c.x;
      ctx.fillStyle = 'rgba(27,58,60,0.1)';
      ctx.beginPath();
      ctx.ellipse(cx, 330, 84, 18, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fdfbf4';
      roundRect(ctx, cx - 53, 182, 106, 136, 12);
      ctx.fill();
      ctx.strokeStyle = '#2a5353';
      ctx.lineWidth = 4;
      roundRect(ctx, cx - 53, 182, 106, 136, 12);
      ctx.stroke();
      ctx.fillStyle = c.color;
      roundRect(ctx, cx - 46, 222, 92, 66, 6);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,247,230,0.7)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(cx, 254, 24, 0, Math.PI * 2);
      ctx.stroke();
      drawStar(ctx, cx, 254, 14, 4, '#fff6df', 4);
      ctx.fillStyle = '#204748';
      ctx.font = `800 25px ${LATIN_FONT}`;
      ctx.textAlign = 'center';
      ctx.fillText(c.label, cx, 156);
      ctx.fillStyle = '#e2704f';
      ctx.font = `800 40px ${JP_FONT}`;
      ctx.fillText(c.price, cx, 366);
      ctx.strokeStyle = 'rgba(190,151,104,0.55)';
      ctx.beginPath();
      ctx.moveTo(cx - 62, 384);
      ctx.lineTo(cx + 62, 384);
      ctx.stroke();
    }
    // steam doodles
    ctx.strokeStyle = 'rgba(255,255,255,0.8)';
    ctx.lineWidth = 4;
    for (const x of [101, 375, 647]) {
      ctx.beginPath();
      ctx.moveTo(x, 178);
      ctx.bezierCurveTo(x - 16, 156, x + 14, 140, x - 4, 118);
      ctx.stroke();
    }
  });
}

export function promoPosterTexture(kind = 'coffee') {
  return canvasTexture(512, 720, (ctx, w, h) => {
    ctx.textBaseline = 'alphabetic';
    if (kind === 'coffee') {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, '#f8dfb1');
      g.addColorStop(1, '#dc995f');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#183f40';
      ctx.font = `800 76px ${JP_FONT}`;
      ctx.textAlign = 'left';
      ctx.fillText('あったかい', 42, 112);
      ctx.fillText('コーヒー', 42, 190);
      ctx.fillStyle = '#bb5438';
      ctx.font = `700 28px ${LATIN_FONT}`;
      ctx.letterSpacing = '5px';
      ctx.fillText('HOT COFFEE', 44, 238);
      ctx.letterSpacing = '0px';
      // cup
      ctx.fillStyle = '#fbf6e9';
      roundRect(ctx, 112, 322, 274, 254, 30);
      ctx.fill();
      ctx.strokeStyle = '#244948';
      ctx.lineWidth = 8;
      roundRect(ctx, 112, 322, 274, 254, 30);
      ctx.stroke();
      ctx.fillStyle = '#7f5034';
      ctx.fillRect(112, 390, 274, 116);
      ctx.fillStyle = '#f4dfc5';
      ctx.font = `700 34px ${JP_FONT}`;
      ctx.textAlign = 'center';
      ctx.fillText('ほしぞらブレンド', 249, 455);
      ctx.strokeStyle = '#f6ead4';
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.arc(438, 412, 41, -1.2, 1.2);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.72)';
      ctx.lineWidth = 8;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(202 + i * 48, 306);
        ctx.bezierCurveTo(188 + i * 48, 265, 224 + i * 48, 245, 203 + i * 48, 206);
        ctx.stroke();
      }
      ctx.fillStyle = '#f7f0dc';
      ctx.beginPath();
      ctx.arc(411, 196, 86, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#e06b48';
      ctx.font = `800 66px ${JP_FONT}`;
      ctx.textAlign = 'center';
      ctx.fillText('100', 411, 209);
      ctx.font = `700 24px ${JP_FONT}`;
      ctx.fillText('円', 411, 250);
      drawStar(ctx, 410, 126, 23, 6, '#f4ce87', 4);
      ctx.fillStyle = '#153d40';
      ctx.font = `600 22px ${JP_FONT}`;
      ctx.textAlign = 'left';
      ctx.fillText('朝も夜も、いい香り。', 44, 655);
      ctx.strokeStyle = 'rgba(24,63,64,0.4)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(44, 681);
      ctx.lineTo(468, 681);
      ctx.stroke();
    } else if (kind === 'onigiri') {
      ctx.fillStyle = '#f2f0d8';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#65b7a7';
      ctx.fillRect(0, 0, w, 262);
      ctx.fillStyle = '#fff9e7';
      ctx.font = `800 67px ${JP_FONT}`;
      ctx.textAlign = 'center';
      ctx.fillText('おにぎり', 256, 116);
      ctx.font = `800 100px ${JP_FONT}`;
      ctx.fillText('100円', 256, 222);
      ctx.font = `700 25px ${JP_FONT}`;
      ctx.fillText('毎日炊きたて  /  新米', 256, 310);
      // rice triangle
      ctx.fillStyle = '#fffdf6';
      ctx.strokeStyle = '#28534f';
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.moveTo(256, 348);
      ctx.quadraticCurveTo(290, 402, 402, 578);
      ctx.quadraticCurveTo(256, 626, 108, 578);
      ctx.quadraticCurveTo(218, 403, 256, 348);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#1d3534';
      roundRect(ctx, 201, 462, 110, 146, 12);
      ctx.fill();
      ctx.fillStyle = '#f3a976';
      ctx.beginPath();
      ctx.arc(251, 420, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#224543';
      ctx.font = `700 24px ${JP_FONT}`;
      ctx.textAlign = 'left';
      ctx.fillText('鮭・ツナ・梅 あります。', 45, 663);
      drawSparkle(ctx, 435, 345, 20, '#f0b25e');
    } else if (kind === 'milk') {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, '#ffd9df');
      g.addColorStop(1, '#e69cac');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#fff3e6';
      ctx.font = `800 78px ${JP_FONT}`;
      ctx.textAlign = 'left';
      ctx.fillText('いちご', 45, 115);
      ctx.fillText('ミルク', 45, 206);
      ctx.fillStyle = '#b54e67';
      ctx.font = `700 26px ${LATIN_FONT}`;
      ctx.letterSpacing = '5px';
      ctx.fillText('NEW  /  LIMITED', 48, 254);
      // carton
      ctx.fillStyle = '#fff9f0';
      ctx.strokeStyle = '#803f4f';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(144, 315);
      ctx.lineTo(349, 290);
      ctx.lineTo(349, 603);
      ctx.lineTo(144, 624);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#f38a9c';
      ctx.fillRect(144, 426, 205, 112);
      ctx.fillStyle = '#fff8e8';
      ctx.font = `700 25px ${JP_FONT}`;
      ctx.textAlign = 'center';
      ctx.fillText('星空いちご', 247, 479);
      ctx.fillStyle = '#c34f65';
      ctx.beginPath();
      ctx.arc(247, 394, 34, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#5f9c5d';
      ctx.beginPath();
      ctx.ellipse(247, 358, 18, 8, -0.3, 0, Math.PI * 2);
      ctx.fill();
      drawStar(ctx, 427, 349, 31, 9, '#fff2d7', 4);
      ctx.fillStyle = '#a5445a';
      ctx.font = `700 33px ${JP_FONT}`;
      ctx.textAlign = 'left';
      ctx.fillText('いちごの季節。', 46, 664);
    } else if (kind === 'bento') {
      ctx.fillStyle = '#f3b86a';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#173d3e';
      ctx.fillRect(0, 0, w, 58);
      ctx.fillStyle = '#fff2d5';
      ctx.font = `700 23px ${JP_FONT}`;
      ctx.textAlign = 'left';
      ctx.fillText('星見町 深夜食堂', 37, 39);
      ctx.fillStyle = '#254747';
      ctx.font = `800 76px ${JP_FONT}`;
      ctx.fillText('のり弁', 42, 169);
      ctx.fillText('全部', 42, 255);
      ctx.fillText('のせ', 42, 341);
      // bento box
      ctx.fillStyle = '#2d2923';
      roundRect(ctx, 175, 360, 301, 222, 20);
      ctx.fill();
      ctx.fillStyle = '#f5edcf';
      roundRect(ctx, 190, 374, 271, 196, 12);
      ctx.fill();
      ctx.fillStyle = '#fff9e8';
      roundRect(ctx, 202, 386, 131, 137, 8);
      ctx.fill();
      ctx.fillStyle = '#3b3e2e';
      roundRect(ctx, 208, 454, 118, 63, 5);
      ctx.fill();
      ctx.fillStyle = '#d86b47';
      ctx.beginPath();
      ctx.arc(377, 431, 34, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#edb86e';
      ctx.beginPath();
      ctx.arc(386, 469, 24, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#50865e';
      ctx.beginPath();
      ctx.arc(352, 480, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#e06a48';
      ctx.font = `800 60px ${JP_FONT}`;
      ctx.textAlign = 'center';
      ctx.fillText('¥398', 255, 651);
      drawStar(ctx, 431, 273, 27, 8, '#fff0cf', 4);
    } else {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, '#173e44');
      g.addColorStop(1, '#0b2731');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#75ddc9';
      ctx.lineWidth = 5;
      roundRect(ctx, 26, 26, w - 52, h - 52, 18);
      ctx.stroke();
      ctx.fillStyle = '#75ddc9';
      ctx.font = `700 24px ${LATIN_FONT}`;
      ctx.letterSpacing = '5px';
      ctx.textAlign = 'center';
      ctx.fillText('HOSHIZORA MART', 256, 100);
      ctx.letterSpacing = '0px';
      ctx.fillStyle = '#fff5dd';
      ctx.font = `800 72px ${JP_FONT}`;
      ctx.fillText('おでん', 256, 227);
      ctx.font = `700 40px ${JP_FONT}`;
      ctx.fillText('はじめました', 256, 291);
      ctx.strokeStyle = '#e8b06b';
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.arc(256, 438, 105, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#e8b06b';
      ctx.beginPath();
      ctx.arc(256, 438, 79, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#58452e';
      ctx.beginPath();
      ctx.arc(229, 420, 23, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f4e8ca';
      ctx.beginPath();
      ctx.arc(286, 464, 21, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#e5d3ac';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(222, 494);
      ctx.lineTo(290, 445);
      ctx.stroke();
      ctx.fillStyle = '#fff3d2';
      ctx.font = `700 22px ${JP_FONT}`;
      ctx.fillText('だいこん・たまご・こんにゃく', 256, 594);
      drawSparkle(ctx, 411, 196, 19, '#ffe5b8');
      drawSparkle(ctx, 100, 548, 13, '#ffe5b8');
    }
  });
}

export function windowDecalTexture(type = 'open') {
  return canvasTexture(512, 256, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    if (type === 'open') {
      ctx.strokeStyle = '#f4f1dc';
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.arc(256, 125, 98, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#f4f1dc';
      ctx.font = `800 52px ${LATIN_FONT}`;
      ctx.fillText('24 HOURS', 256, 110);
      ctx.font = `700 27px ${JP_FONT}`;
      ctx.fillText('年中無休', 256, 162);
    } else if (type === 'welcome') {
      ctx.fillStyle = 'rgba(248,243,225,0.9)';
      ctx.font = `700 47px ${JP_FONT}`;
      ctx.fillText('いらっしゃいませ', 256, 118);
      ctx.strokeStyle = '#f4f1dc';
      ctx.lineWidth = 4;
      roundRect(ctx, 32, 34, 448, 158, 18);
      ctx.stroke();
    } else if (type === 'auto') {
      ctx.fillStyle = '#bfe9dc';
      ctx.font = `700 33px ${JP_FONT}`;
      ctx.fillText('自動ドア', 256, 80);
      ctx.fillStyle = '#f6f0db';
      ctx.font = `800 32px ${LATIN_FONT}`;
      ctx.fillText('AUTOMATIC DOOR', 256, 130);
      ctx.strokeStyle = '#bdebd9';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(146, 187);
      ctx.lineTo(256, 187);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(230, 165);
      ctx.lineTo(258, 187);
      ctx.lineTo(230, 209);
      ctx.stroke();
    } else if (type === 'payment') {
      ctx.fillStyle = '#f5f3e5';
      ctx.font = `700 28px ${LATIN_FONT}`;
      ctx.fillText('CASH  /  IC  /  QR', 256, 90);
      ctx.fillStyle = '#88e5d2';
      ctx.font = `700 25px ${JP_FONT}`;
      ctx.fillText('各種キャッシュレス', 256, 144);
    } else {
      ctx.fillStyle = '#f5f1dd';
      ctx.font = `700 31px ${JP_FONT}`;
      ctx.fillText('コーヒー', 256, 92);
      ctx.font = `700 20px ${LATIN_FONT}`;
      ctx.fillText('HOT & ICE', 256, 138);
    }
  });
}

export function promoStripTexture(kind = 'snack') {
  return canvasTexture(1024, 256, (ctx, w, h) => {
    if (kind === 'snack') {
      ctx.fillStyle = '#f0d088';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#4a3330';
      ctx.font = `800 74px ${JP_FONT}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('お菓子  ／  SNACKS', w / 2, h / 2);
      ctx.fillStyle = '#d9674e';
      ctx.fillRect(0, 0, w, 16);
      ctx.fillStyle = '#66b8a1';
      ctx.fillRect(0, h - 14, w, 14);
    } else if (kind === 'bento') {
      ctx.fillStyle = '#e6efe2';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#28554f';
      ctx.font = `800 72px ${JP_FONT}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('おにぎり・お弁当', w / 2, h / 2 + 2);
      ctx.fillStyle = '#e18a52';
      ctx.fillRect(0, h - 17, w, 17);
    } else if (kind === 'drink') {
      ctx.fillStyle = '#dff4f0';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#2b6766';
      ctx.font = `800 70px ${JP_FONT}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('つめたい 飲みもの', w / 2, h / 2);
      ctx.fillStyle = '#6abaac';
      ctx.fillRect(0, 0, w, 14);
    } else {
      ctx.fillStyle = '#f0e4c4';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#294b47';
      ctx.font = `800 64px ${JP_FONT}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('日用品・雑貨', w / 2, h / 2);
      ctx.fillStyle = '#e3a15e';
      ctx.fillRect(0, 0, 18, h);
    }
  });
}

export function noticeBoardTexture() {
  return canvasTexture(480, 640, (ctx, w, h) => {
    ctx.fillStyle = '#4e3a2d';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#bcaa86';
    ctx.fillRect(18, 18, w - 36, h - 36);
    const papers = [
      [45, 58, 176, 236, '#f5e7c9', '#bd5741', '星見町<br>夏祭り'],
      [245, 70, 178, 190, '#e6ede1', '#3f7061', '防災訓練<br>のお知らせ'],
      [58, 325, 160, 220, '#f0dbb2', '#9d6e43', '猫の<br>里親募集'],
      [244, 288, 180, 260, '#f7edda', '#405f72', '商店街<br>売出し'],
    ];
    for (const [x, y, pw, ph, bg, col] of papers) {
      ctx.save();
      ctx.translate(x + pw / 2, y + ph / 2);
      ctx.rotate((Math.random() - 0.5) * 0.05);
      ctx.fillStyle = 'rgba(54,38,25,0.22)';
      ctx.fillRect(-pw / 2 + 5, -ph / 2 + 6, pw, ph);
      ctx.fillStyle = bg;
      ctx.fillRect(-pw / 2, -ph / 2, pw, ph);
      ctx.fillStyle = 'rgba(83,63,44,0.24)';
      for (let i = 0; i < 7; i++) {
        ctx.fillRect(-pw / 2 + 16, 20 + i * 18, pw * (0.35 + Math.random() * 0.4), 5);
      }
      ctx.fillStyle = col;
      ctx.font = `700 ${pw > 170 ? 27 : 21}px ${JP_FONT}`;
      ctx.textAlign = 'center';
      ctx.fillText(['まちの', 'おしらせ'][x % 2], 0, -ph / 2 + 49);
      // photo blocks + thick headline lines
      ctx.fillStyle = 'rgba(255,255,255,0.38)';
      ctx.fillRect(-pw / 2 + 15, 66, pw - 30, 76);
      ctx.strokeStyle = col;
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.moveTo(-pw / 2 + 20, 100);
      ctx.bezierCurveTo(-20, 40, 20, 150, pw / 2 - 18, 94);
      ctx.stroke();
      ctx.fillStyle = '#4f3d2c';
      for (let i = 0; i < 5; i++) {
        ctx.fillRect(-pw / 2 + 18, ph / 2 - 78 + i * 13, pw * (0.52 + Math.random() * 0.3), 4);
      }
      ctx.fillStyle = '#d26d50';
      ctx.beginPath();
      ctx.arc(pw / 2 - 23, ph / 2 - 23, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.fillStyle = 'rgba(38,28,20,0.2)';
    ctx.fillRect(0, 0, w, 8);
  });
}

export function magazineTexture(i = 0) {
  const palettes = [
    ['#e86969', '#ffe7c2', '#fff6dd', 'CITY'],
    ['#4e8ccf', '#e5f4ff', '#ffffff', 'WEEK'],
    ['#e8b65a', '#3e3a30', '#fff6da', 'POP'],
    ['#65ad93', '#f1f0d6', '#ffffff', 'LIFE'],
    ['#b17db5', '#f5e4f1', '#ffffff', 'STYLE'],
    ['#dd8761', '#f9e9cd', '#ffffff', 'COOK'],
  ];
  const c = palettes[i % palettes.length];
  return canvasTexture(300, 400, (ctx, w, h) => {
    ctx.fillStyle = c[0];
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    ctx.beginPath();
    ctx.arc(60, 85, 95, 0, Math.PI * 2);
    ctx.fill();
    ctx.save();
    ctx.translate(w / 2, 170 + i * 19);
    ctx.rotate(0.11);
    ctx.fillStyle = c[1];
    roundRect(ctx, -88, -60, 176, 174, 12);
    ctx.fill();
    ctx.strokeStyle = 'rgba(40,39,34,0.25)';
    ctx.lineWidth = 5;
    roundRect(ctx, -88, -60, 176, 174, 12);
    ctx.stroke();
    ctx.fillStyle = c[0];
    ctx.beginPath();
    ctx.arc(-20, 5, 47, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = c[2];
    ctx.beginPath();
    ctx.arc(28, 34, 31, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = '#202c31';
    ctx.font = `800 42px ${LATIN_FONT}`;
    ctx.textAlign = 'left';
    ctx.fillText(c[3], 22, 48);
    ctx.fillStyle = '#fff8e9';
    ctx.font = `700 20px ${JP_FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText(['特集 雨の日の過ごし方', '今月の小さな幸せ', 'おうちカフェ', '静かな夜の音楽', '私の好きな街', '深夜ごはん'][i % 6], w / 2, h - 36);
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillRect(21, 65, 110, 7);
    ctx.fillRect(21, 80, 77, 6);
  });
}

export function reflectionTexture(colors, seed = 7, density = 22) {
  let state = seed * 1973;
  const random = () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0xffffffff;
  };
  return canvasTexture(512, 768, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    const halo = ctx.createLinearGradient(0, 0, 0, h);
    halo.addColorStop(0, 'rgba(255,255,255,0.11)');
    halo.addColorStop(0.4, 'rgba(255,255,255,0.04)');
    halo.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = halo;
    ctx.fillRect(0, 0, w, h);
    ctx.filter = 'blur(3px)';
    for (let i = 0; i < density; i++) {
      const x = random() * w;
      const col = colors[Math.floor(random() * colors.length)];
      const width = 4 + random() * 26;
      const start = 16 + random() * 100;
      const len = 200 + random() * (h * 0.82);
      const grad = ctx.createLinearGradient(0, start, 0, start + len);
      grad.addColorStop(0, col);
      grad.addColorStop(0.28, col);
      grad.addColorStop(0.72, 'rgba(0,0,0,0)');
      ctx.globalAlpha = 0.12 + random() * 0.46;
      ctx.fillStyle = grad;
      ctx.fillRect(x - width / 2, start, width, len);
      if (random() > 0.54) {
        ctx.globalAlpha = 0.09 + random() * 0.22;
        ctx.fillRect(x - width * 0.9, start + 14, width * 0.7, len * 0.7);
      }
    }
    ctx.filter = 'blur(1px)';
    for (let i = 0; i < 28; i++) {
      ctx.globalAlpha = 0.15 + random() * 0.35;
      ctx.fillStyle = colors[Math.floor(random() * colors.length)];
      const x = random() * w;
      const y = random() * h * 0.55;
      ctx.fillRect(x, y, 2 + random() * 15, 2 + random() * 6);
    }
    ctx.globalAlpha = 1;
    ctx.filter = 'none';
  });
}

export function glowTexture() {
  return canvasTexture(256, 256, (ctx, w, h) => {
    const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.15, 'rgba(255,255,255,0.72)');
    g.addColorStop(0.42, 'rgba(255,255,255,0.17)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  });
}

export function softSpotTexture() {
  return canvasTexture(512, 512, (ctx, w, h) => {
    const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    g.addColorStop(0, 'rgba(255,255,255,0.7)');
    g.addColorStop(0.35, 'rgba(255,255,255,0.24)');
    g.addColorStop(0.7, 'rgba(255,255,255,0.04)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  });
}

export function glassStreakTexture() {
  return canvasTexture(64, 512, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, 'rgba(220,246,255,0)');
    g.addColorStop(0.15, 'rgba(220,246,255,0.2)');
    g.addColorStop(0.62, 'rgba(220,246,255,0.55)');
    g.addColorStop(0.9, 'rgba(240,253,255,0.9)');
    g.addColorStop(0.94, 'rgba(255,255,255,0.95)');
    g.addColorStop(1, 'rgba(220,246,255,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(w / 2, h * 0.7, w * 0.19, h * 0.28, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(w * 0.4, h * 0.1, w * 0.2, h * 0.78);
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.beginPath();
    ctx.ellipse(w / 2, h * 0.72, w * 0.23, h * 0.07, 0, 0, Math.PI * 2);
    ctx.fill();
  });
}

export function rainTexture() {
  return canvasTexture(32, 256, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, 'rgba(255,255,255,0)');
    g.addColorStop(0.22, 'rgba(208,240,255,0.1)');
    g.addColorStop(0.7, 'rgba(208,240,255,0.56)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(w * 0.36, 0, w * 0.26, h);
    ctx.filter = 'blur(1px)';
    ctx.fillStyle = 'rgba(225,250,255,0.55)';
    ctx.fillRect(w * 0.46, 0, w * 0.08, h);
  });
}

export function tactileTexture() {
  return canvasTexture(256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#d1ae5f';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(255,235,173,0.55)';
    for (let y = 18; y < h; y += 34) {
      for (let x = 18; x < w; x += 34) {
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.strokeStyle = 'rgba(115,80,32,0.28)';
    ctx.lineWidth = 2;
    for (let y = 0; y < h; y += 34) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
  }, { repeat: [1, 1] });
}

export function manholeTexture() {
  return canvasTexture(512, 512, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#27313e';
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, 244, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#667181';
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, 230, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(120,133,150,0.65)';
    ctx.lineWidth = 4;
    for (let r = 60; r < 218; r += 26) {
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, r, 0, Math.PI * 2);
      ctx.stroke();
    }
    for (let i = 0; i < 20; i++) {
      const a = (i / 20) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(w / 2 + Math.cos(a) * 58, h / 2 + Math.sin(a) * 58);
      ctx.lineTo(w / 2 + Math.cos(a) * 208, h / 2 + Math.sin(a) * 208);
      ctx.stroke();
    }
    ctx.fillStyle = '#394553';
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, 64, 0, Math.PI * 2);
    ctx.fill();
    drawStar(ctx, w / 2, h / 2, 42, 11, '#9aa5b3', 4);
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, 246, -2.2, 0.2);
    ctx.stroke();
  });
}

export function roadStopTexture() {
  return canvasTexture(512, 512, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(243,244,225,0.9)';
    ctx.font = `800 170px ${JP_FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('止まれ', w / 2, h / 2);
    ctx.globalCompositeOperation = 'destination-out';
    ctx.globalAlpha = 0.1;
    for (let i = 0; i < 80; i++) {
      ctx.fillRect(Math.random() * w, Math.random() * h, 20 + Math.random() * 40, 2 + Math.random() * 5);
    }
  });
}

export function asphaltTexture() {
  let seed = 89;
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  return canvasTexture(1024, 1024, (ctx, w, h) => {
    ctx.fillStyle = '#151a25';
    ctx.fillRect(0, 0, w, h);
    const light = ctx.createRadialGradient(w * 0.3, h * 0.35, 0, w * 0.3, h * 0.35, w * 0.7);
    light.addColorStop(0, 'rgba(70,83,102,0.12)');
    light.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = light;
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 6500; i++) {
      const c = Math.floor(24 + random() * 26);
      ctx.fillStyle = `rgba(${c},${c + 5},${c + 12},${0.12 + random() * 0.18})`;
      const s = random() * 2.2 + 0.4;
      ctx.fillRect(random() * w, random() * h, s, s);
    }
    for (let i = 0; i < 18; i++) {
      ctx.strokeStyle = `rgba(5,8,13,${0.18 + random() * 0.28})`;
      ctx.lineWidth = 1 + random() * 2;
      ctx.beginPath();
      const x = random() * w;
      const y = random() * h;
      ctx.moveTo(x, y);
      ctx.bezierCurveTo(x + random() * 120, y + random() * 60, x + random() * 240, y - random() * 30, x + 260, y + random() * 140);
      ctx.stroke();
    }
    for (let i = 0; i < 30; i++) {
      ctx.strokeStyle = 'rgba(160,177,196,0.06)';
      ctx.lineWidth = 1 + random() * 3;
      ctx.beginPath();
      ctx.moveTo(random() * w, 0);
      ctx.lineTo(random() * w, h);
      ctx.stroke();
    }
  }, { repeat: [3, 3] });
}

export function pavingTexture() {
  let seed = 23;
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  return canvasTexture(1024, 1024, (ctx, w, h) => {
    ctx.fillStyle = '#626d7a';
    ctx.fillRect(0, 0, w, h);
    const rows = 8;
    const cols = 6;
    const tw = w / cols;
    const th = h / rows;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const offset = r % 2 === 0 ? 0 : tw * 0.5;
        const x = (c * tw + offset) % w;
        const y = r * th;
        const tone = 91 + random() * 26;
        ctx.fillStyle = `rgba(${tone - 4},${tone + 2},${tone + 15},1)`;
        ctx.fillRect(x + 3, y + 3, tw - 6, th - 6);
        if (x + tw > w) {
          ctx.fillRect(x - w + 3, y + 3, tw - 6, th - 6);
        }
        ctx.fillStyle = 'rgba(255,255,255,0.05)';
        ctx.fillRect(x + 3, y + 3, tw - 6, 4);
        ctx.fillStyle = 'rgba(28,36,48,0.18)';
        ctx.fillRect(x + 3, y + th - 10, tw - 6, 7);
        if (random() > 0.78) {
          ctx.strokeStyle = 'rgba(39,47,57,0.4)';
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          const px = x + tw * (0.2 + random() * 0.6);
          const py = y + th * 0.3;
          ctx.moveTo(px, py);
          ctx.lineTo(px + random() * 22 - 11, py + 20 + random() * 25);
          ctx.lineTo(px + random() * 40 - 20, py + 48);
          ctx.stroke();
        }
      }
    }
    // dark, wet joints
    ctx.strokeStyle = 'rgba(26,32,42,0.8)';
    ctx.lineWidth = 5;
    for (let r = 0; r <= rows; r++) {
      ctx.beginPath();
      ctx.moveTo(0, r * th);
      ctx.lineTo(w, r * th);
      ctx.stroke();
    }
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        const offset = r % 2 === 0 ? 0 : tw * 0.5;
        const x = (c * tw + offset) % w;
        ctx.beginPath();
        ctx.moveTo(x, r * th);
        ctx.lineTo(x, (r + 1) * th);
        ctx.stroke();
      }
    }
    const wet = ctx.createLinearGradient(0, 0, w, h);
    wet.addColorStop(0, 'rgba(10,20,34,0.05)');
    wet.addColorStop(0.45, 'rgba(20,42,58,0.26)');
    wet.addColorStop(1, 'rgba(7,13,22,0.1)');
    ctx.fillStyle = wet;
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 60; i++) {
      ctx.fillStyle = `rgba(177,205,216,${0.02 + random() * 0.05})`;
      ctx.fillRect(random() * w, random() * h, 18 + random() * 60, 2 + random() * 4);
    }
  }, { repeat: [4, 4] });
}

export function floorTileTexture() {
  return canvasTexture(1024, 1024, (ctx, w, h) => {
    ctx.fillStyle = '#d7d0bd';
    ctx.fillRect(0, 0, w, h);
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const even = (r + c) % 2 === 0;
        ctx.fillStyle = even ? '#ded6c2' : '#d2c9b5';
        ctx.fillRect(c * 128 + 3, r * 128 + 3, 122, 122);
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.fillRect(c * 128 + 3, r * 128 + 3, 122, 3);
      }
    }
    ctx.strokeStyle = 'rgba(86,88,78,0.34)';
    ctx.lineWidth = 2;
    for (let i = 0; i <= 8; i++) {
      ctx.beginPath();
      ctx.moveTo(0, i * 128);
      ctx.lineTo(w, i * 128);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(i * 128, 0);
      ctx.lineTo(i * 128, h);
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(124,176,158,0.18)';
    ctx.fillRect(0, 420, w, 14);
    ctx.fillStyle = 'rgba(216,150,88,0.16)';
    ctx.fillRect(0, 456, w, 9);
  }, { repeat: [1.6, 1.6] });
}

export function shelfTagTexture(accent = '#e36f4f') {
  return canvasTexture(256, 128, (ctx, w, h) => {
    ctx.fillStyle = '#f8f1db';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(83,75,54,0.25)';
    ctx.lineWidth = 3;
    ctx.strokeRect(2, 2, w - 4, h - 4);
    ctx.fillStyle = accent;
    roundRect(ctx, 10, 16, 68, 38, 6);
    ctx.fill();
    ctx.fillStyle = '#fffaf0';
    ctx.font = `700 23px ${JP_FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText('NEW', 44, 44);
    ctx.fillStyle = '#313731';
    ctx.textAlign = 'left';
    ctx.font = `700 29px ${JP_FONT}`;
    ctx.fillText('¥138', 94, 48);
    ctx.fillStyle = 'rgba(55,59,49,0.55)';
    ctx.font = `600 15px ${JP_FONT}`;
    ctx.fillText('税込 / おすすめ', 95, 81);
    ctx.fillStyle = 'rgba(35,41,36,0.18)';
    for (let i = 0; i < 5; i++) {
      ctx.fillRect(10, 94 + i * 5, 100 + i * 21, 2);
    }
    ctx.fillStyle = accent;
    ctx.fillRect(0, h - 8, w, 8);
  });
}

/* ------------------------------------------------------------------ */
/* Geometry & scene helpers                                            */
/* ------------------------------------------------------------------ */

const boxCache = new Map();
const cylCache = new Map();

function boxGeometry(w, h, d) {
  const key = `${w.toFixed(3)}:${h.toFixed(3)}:${d.toFixed(3)}`;
  let g = boxCache.get(key);
  if (!g) {
    g = new THREE.BoxGeometry(w, h, d);
    boxCache.set(key, g);
  }
  return g;
}

export function addBox(parent, w, h, d, material, x = 0, y = 0, z = 0, opts = {}) {
  const mesh = new THREE.Mesh(boxGeometry(w, h, d), material);
  mesh.position.set(x, y, z);
  if (opts.rx) mesh.rotation.x = opts.rx;
  if (opts.ry) mesh.rotation.y = opts.ry;
  if (opts.rz) mesh.rotation.z = opts.rz;
  mesh.castShadow = opts.cast ?? true;
  mesh.receiveShadow = opts.receive ?? true;
  if (opts.name) mesh.name = opts.name;
  parent.add(mesh);
  return mesh;
}

export function addRoundedBox(parent, w, h, d, radius, material, x = 0, y = 0, z = 0, opts = {}) {
  const seg = opts.segments ?? 2;
  const g = new RoundedBoxGeometry(w, h, d, seg, radius);
  const mesh = new THREE.Mesh(g, material);
  mesh.position.set(x, y, z);
  mesh.castShadow = opts.cast ?? true;
  mesh.receiveShadow = opts.receive ?? true;
  parent.add(mesh);
  return mesh;
}

export function addCylinder(parent, rt, rb, h, material, x = 0, y = 0, z = 0, opts = {}) {
  const seg = opts.segments ?? 10;
  const key = `${rt.toFixed(3)}:${rb.toFixed(3)}:${h.toFixed(3)}:${seg}`;
  let g = cylCache.get(key);
  if (!g) {
    g = new THREE.CylinderGeometry(rt, rb, h, seg);
    cylCache.set(key, g);
  }
  const mesh = new THREE.Mesh(g, material);
  mesh.position.set(x, y, z);
  if (opts.rx) mesh.rotation.x = opts.rx;
  if (opts.ry) mesh.rotation.y = opts.ry;
  if (opts.rz) mesh.rotation.z = opts.rz;
  mesh.castShadow = opts.cast ?? true;
  mesh.receiveShadow = opts.receive ?? true;
  parent.add(mesh);
  return mesh;
}

export function addPlane(parent, w, h, material, x = 0, y = 0, z = 0, opts = {}) {
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), material);
  mesh.position.set(x, y, z);
  if (opts.rx !== undefined) mesh.rotation.x = opts.rx;
  if (opts.ry !== undefined) mesh.rotation.y = opts.ry;
  if (opts.rz !== undefined) mesh.rotation.z = opts.rz;
  mesh.castShadow = opts.cast ?? false;
  mesh.receiveShadow = opts.receive ?? false;
  if (opts.name) mesh.name = opts.name;
  parent.add(mesh);
  return mesh;
}

export function addGroundPlane(parent, w, d, material, x = 0, y = 0, z = 0, opts = {}) {
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, d), material);
  mesh.rotation.x = -Math.PI / 2;
  mesh.rotation.z = opts.rotation ?? 0;
  mesh.position.set(x, y, z);
  mesh.receiveShadow = opts.receive ?? true;
  mesh.castShadow = false;
  mesh.renderOrder = opts.renderOrder ?? 0;
  parent.add(mesh);
  return mesh;
}

export function addRodBetween(parent, a, b, radius, material, opts = {}) {
  const va = new THREE.Vector3(...a);
  const vb = new THREE.Vector3(...b);
  const dir = vb.clone().sub(va);
  const len = dir.length();
  const geo = new THREE.CylinderGeometry(radius, radius, len, opts.segments ?? 6);
  const mesh = new THREE.Mesh(geo, material);
  mesh.position.copy(va).add(vb).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  mesh.castShadow = opts.cast ?? true;
  mesh.receiveShadow = opts.receive ?? true;
  parent.add(mesh);
  return mesh;
}

export function addTube(parent, points, radius, material, opts = {}) {
  const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)));
  const geo = new THREE.TubeGeometry(curve, opts.segments ?? 24, radius, opts.radialSegments ?? 4, false);
  const mesh = new THREE.Mesh(geo, material);
  mesh.castShadow = opts.cast ?? false;
  mesh.receiveShadow = opts.receive ?? false;
  parent.add(mesh);
  return mesh;
}

export function addGlowSprite(parent, color, size, x, y, z, opacity = 0.38) {
  const tex = getSharedGlowTexture();
  const mat = new THREE.SpriteMaterial({
    map: tex,
    color,
    transparent: true,
    opacity,
    depthWrite: false,
    depthTest: true,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
  });
  const sprite = new THREE.Sprite(mat);
  sprite.position.set(x, y, z);
  sprite.scale.set(size, size, 1);
  sprite.renderOrder = 8;
  parent.add(sprite);
  return sprite;
}

let _spotTexture = null;
export function addGroundGlow(parent, color, w, d, x, z, opacity = 0.3, y = 0.03) {
  _spotTexture ??= softSpotTexture();
  const mat = new THREE.MeshBasicMaterial({
    map: _spotTexture,
    color,
    transparent: true,
    opacity,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
  });
  mat.userData.outlineParameters = { visible: false };
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(x, y, z);
  mesh.renderOrder = 3;
  parent.add(mesh);
  return mesh;
}

let _glowTexture = null;
export function getSharedGlowTexture() {
  _glowTexture ??= glowTexture();
  return _glowTexture;
}

let _streakTexture = null;
export function getSharedStreakTexture() {
  _streakTexture ??= glassStreakTexture();
  return _streakTexture;
}

export function planeMaterial(tex, opts = {}) {
  return basic(0xffffff, {
    map: tex,
    transparent: opts.transparent ?? false,
    opacity: opts.opacity ?? 1,
    alphaTest: opts.alphaTest ?? 0,
    depthWrite: opts.depthWrite ?? true,
    side: opts.side ?? THREE.FrontSide,
    blending: opts.blending ?? THREE.NormalBlending,
  });
}

export function textPlane(parent, tex, w, h, x, y, z, opts = {}) {
  const mat = opts.material ?? planeMaterial(tex, { transparent: opts.transparent ?? true, opacity: opts.opacity ?? 1 });
  const mesh = addPlane(parent, w, h, mat, x, y, z, {
    rx: opts.rx,
    ry: opts.ry,
    rz: opts.rz,
    renderOrder: opts.renderOrder,
  });
  return mesh;
}

export function makeShapeGeometry(points, curves = false) {
  const shape = new THREE.Shape();
  points.forEach((p, i) => {
    if (i === 0) shape.moveTo(p[0], p[1]);
    else if (curves) shape.quadraticCurveTo(p[0], p[1], p[2], p[3]);
    else shape.lineTo(p[0], p[1]);
  });
  shape.closePath();
  return new THREE.ShapeGeometry(shape);
}

export function puddleGeometry(rx, rz, seed = 3, irregularity = 0.18, segments = 26) {
  let s = seed * 6521;
  const rnd = () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
  const shape = new THREE.Shape();
  for (let i = 0; i < segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    const n = 1 + (rnd() - 0.5) * irregularity * 2 + Math.sin(a * 3 + seed) * irregularity * 0.4;
    const x = Math.cos(a) * rx * n;
    const y = Math.sin(a) * rz * n;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();
  return new THREE.ShapeGeometry(shape, 2);
}

export function easyInOut(t) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

export function mulberry32(seed) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pick(rng, arr) {
  return arr[Math.floor(rng() * arr.length)];
}

export function enableShadows(obj, cast = true, receive = true) {
  obj.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = cast;
      child.receiveShadow = receive;
    }
  });
}

export function createBokehSprite(color, size, opacity = 0.12) {
  const mat = new THREE.SpriteMaterial({
    map: getSharedGlowTexture(),
    color,
    transparent: true,
    opacity,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
  });
  const s = new THREE.Sprite(mat);
  s.scale.set(size, size, 1);
  return s;
}
