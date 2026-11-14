/* World part 1 — textures, plinth, street corner, store shell and bright interior */
'use strict';

const PAL = {
  asphalt: 0x161f30, road: 0x121b2b, walk: 0x47576e, curb: 0x35435a,
  cream: 0xd8d6cc, wall: 0xe3ddcd, teal: 0x116074, teal2: 0x1aa89a,
  coral: 0xef8a63, navy: 0x22304a, ink: 0x1a2438, metal: 0x8795a8,
  warm: 0xffe0a8, wood: 0xc9a679, glass: 0xa9d8ef, yellow: 0xf2d06b
};
const SNACK = [0xf6cf70, 0xee8b69, 0x8ec8e8, 0xa9d7a2, 0xf2a2bc, 0xc9b0ec, 0xf3ecdc, 0xe76d5d, 0x7fc8c0, 0xf0b357];
const DRINK = [0x65c0e6, 0xf0a259, 0x8ad3a4, 0xf28b8b, 0xf5dc79, 0xb2a4e8, 0xe8f2f6, 0x59a8d6, 0xe5749a, 0x9ad06a];
const POSTER_COLORS = ['#f29a7a', '#79b8cf', '#e8c86a', '#a5c98c', '#c9a0d8', '#ef8f9c'];

/* ---------- canvas texture helpers ---------- */
function fitText(c, text, x, y, maxW, size, weight, color, align) {
  c.save();
  c.fillStyle = color; c.textAlign = align || 'center'; c.textBaseline = 'middle';
  let s = size;
  c.font = (weight || 900) + ' ' + s + 'px ' + FONT;
  while (c.measureText(text).width > maxW && s > 7) {
    s -= 1; c.font = (weight || 900) + ' ' + s + 'px ' + FONT;
  }
  c.fillText(text, x, y);
  c.restore();
  return s;
}

function texAsphalt() {
  return makeTexture(512, 512, (c, w, h) => {
    c.fillStyle = '#141d2e'; c.fillRect(0, 0, w, h);
    for (let i = 0; i < 9000; i++) {
      const v = W.rr(0, 1);
      c.fillStyle = v > 0.5 ? 'rgba(120,165,215,0.045)' : 'rgba(2,6,16,0.16)';
      c.fillRect(W.rr(0, w), W.rr(0, h), W.rr(0.5, 2.4), W.rr(0.5, 2.4));
    }
    for (let i = 0; i < 34; i++) {
      c.fillStyle = 'rgba(120,155,190,0.035)';
      c.fillRect(W.rr(0, w), W.rr(0, h), W.rr(20, 150), W.rr(1, 5));
    }
  }, { repeat: [5, 5] });
}

function texGrid(bg, line, cells) {
  return makeTexture(128, 128, (c, w, h) => {
    c.fillStyle = bg; c.fillRect(0, 0, w, h);
    c.strokeStyle = line; c.lineWidth = 2;
    for (let i = 0; i <= cells; i++) {
      const p = i * w / cells;
      c.beginPath(); c.moveTo(p, 0); c.lineTo(p, h); c.stroke();
      c.beginPath(); c.moveTo(0, p); c.lineTo(w, p); c.stroke();
    }
    for (let i = 0; i < 180; i++) {
      c.fillStyle = 'rgba(255,255,255,0.035)';
      c.fillRect(W.rr(0, w), W.rr(0, h), 1.4, 1.4);
    }
  }, { repeat: [1, 1] });
}

function texTactile() {
  return makeTexture(128, 128, (c, w, h) => {
    c.fillStyle = '#d9b34e'; c.fillRect(0, 0, w, h);
    c.fillStyle = '#b8923a';
    for (let y = 16; y < 128; y += 32) for (let x = 16; x < 128; x += 32) {
      c.beginPath(); c.arc(x, y, 7, 0, Math.PI * 2); c.fill();
      c.fillStyle = 'rgba(255,238,170,0.45)';
      c.beginPath(); c.arc(x - 2, y - 2, 3.5, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#b8923a';
    }
  }, { repeat: [1, 1] });
}

function texStoreSign(cw, ch) {
  return makeTexture(cw, ch, (c, w, h) => {
    c.fillStyle = '#0d5064'; c.fillRect(0, 0, w, h);
    c.fillStyle = '#f5f0e2'; c.fillRect(0, 0, w, h * 0.09);
    c.fillStyle = '#ef8b60'; c.fillRect(0, h * 0.91, w, h * 0.09);
    c.fillStyle = '#28bda9'; c.fillRect(0, h * 0.09, w, h * 0.055);
    c.fillStyle = '#f5f0e2'; c.fillRect(0, h * 0.855, w, h * 0.055);
    /* logo mark */
    const r = h * 0.33, cx = w * 0.055, cy = h * 0.50;
    c.fillStyle = '#f7f2e4'; c.beginPath(); c.arc(cx, cy, r, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#0d5064'; c.beginPath(); c.arc(cx, cy, r * 0.72, 0, Math.PI * 2); c.fill();
    fitText(c, '24', cx, cy - h * 0.02, r * 1.35, h * 0.30, 900, '#f7f2e4');
    fitText(c, 'H', cx, cy + h * 0.19, r * 1.1, h * 0.16, 900, '#28bda9');
    fitText(c, 'みらいマート', w * 0.36, h * 0.45, w * 0.56, h * 0.46, 900, '#fcf7e8');
    fitText(c, 'MIRAI MART ・ 24時間営業中 ・ コンビニエンスストア', w * 0.36, h * 0.755, w * 0.56, h * 0.145, 700, '#9fe4da');
    /* right small tiles */
    c.fillStyle = 'rgba(255,255,255,0.16)';
    for (let i = 0; i < 3; i++) c.fillRect(w * 0.945 + i * h * 0.06, h * 0.3, h * 0.035, h * 0.4);
  });
}

function texHang(main, sub, bg, fg) {
  return makeTexture(320, 132, (c, w, h) => {
    c.fillStyle = bg || '#fff7e6'; c.fillRect(0, 0, w, h);
    c.fillStyle = 'rgba(255,255,255,0.22)'; c.fillRect(0, 0, w, 10);
    c.strokeStyle = fg || '#c9563f'; c.lineWidth = 5; c.strokeRect(7, 7, w - 14, h - 14);
    fitText(c, main, w / 2, h * 0.42, w * 0.86, 54, 900, fg || '#c9563f');
    fitText(c, sub || '', w / 2, h * 0.78, w * 0.84, 22, 700, fg || '#c9563f');
  });
}

function texPoster(title, sub, color, tag) {
  return makeTexture(256, 360, (c, w, h) => {
    c.fillStyle = '#fbf6e8'; c.fillRect(0, 0, w, h);
    c.fillStyle = color; c.fillRect(0, 0, w, 96);
    c.fillStyle = 'rgba(255,255,255,0.25)';
    for (let i = 0; i < 7; i++) { c.beginPath(); c.arc(W.rr(0, w), W.rr(0, 96), W.rr(6, 26), 0, Math.PI * 2); c.fill(); }
    fitText(c, tag || 'NEW', w / 2, 30, w * 0.6, 26, 900, '#fffdf4');
    fitText(c, title, w / 2, 68, w * 0.88, 38, 900, '#fffdf4');
    /* illustration block */
    c.fillStyle = color; c.globalAlpha = 0.22;
    c.fillRect(22, 118, w - 44, 118); c.globalAlpha = 1;
    c.fillStyle = color;
    for (let i = 0; i < 5; i++) {
      c.beginPath(); c.arc(48 + i * 40, 178 + Math.sin(i * 1.6) * 18, W.rr(12, 22), 0, Math.PI * 2); c.fill();
    }
    fitText(c, sub || '毎日のお買い物に', w / 2, 278, w * 0.88, 27, 800, '#3c4658');
    c.fillStyle = color; c.fillRect(0, 318, w, 42);
    fitText(c, 'みらいマート', w / 2, 339, w * 0.8, 25, 900, '#fffdf4');
  });
}

function texVending(brand, baseColor, warm) {
  return makeTexture(256, 512, (c, w, h) => {
    c.fillStyle = baseColor; c.fillRect(0, 0, w, h);
    c.fillStyle = 'rgba(255,255,255,0.94)'; c.fillRect(10, 12, w - 20, 62);
    fitText(c, brand, w / 2, 44, w * 0.85, 36, 900, baseColor);
    c.fillStyle = 'rgba(0,0,0,0.28)'; c.fillRect(12, 86, w - 24, 292);
    const cols = 5, rows = 5;
    for (let r = 0; r < rows; r++) for (let col = 0; col < cols; col++) {
      const colr = ['#f2a15f', '#7fc9e8', '#f2d36b', '#a8d6a0', '#ef8f9f', '#d2b6ea'][(r + col) % 6];
      const x = 24 + col * 43, y = 98 + r * 55;
      c.fillStyle = 'rgba(255,255,255,0.10)'; c.fillRect(x - 3, y - 3, 37, 46);
      c.fillStyle = colr; c.fillRect(x, y, 30, 34);
      c.fillStyle = 'rgba(255,255,255,0.75)'; c.fillRect(x + 3, y + 4, 24, 5);
      c.fillStyle = 'rgba(0,0,0,0.25)'; c.fillRect(x, y + 34, 30, 6);
      c.fillStyle = '#fff'; c.font = 'bold 12px sans-serif'; c.textAlign = 'center';
      c.fillText('¥' + (110 + r * 10), x + 15, y + 50);
    }
    c.fillStyle = 'rgba(255,255,255,0.92)'; c.fillRect(16, 390, w - 32, 44);
    fitText(c, 'つめたい ・ あたたかい', w / 2, 412, w * 0.85, 22, 800, baseColor);
    c.fillStyle = warm ? '#f0a55e' : '#62c6e8'; c.fillRect(16, 448, w - 32, 48);
    c.fillStyle = 'rgba(0,0,0,0.25)'; c.fillRect(150, 452, 74, 38);
    fitText(c, '24H 稼働中', w / 2 - 36, 472, 110, 18, 800, '#ffffff');
  });
}

function texLabel(text, sub, bg, fg, w, h) {
  w = w || 320; h = h || 128;
  return makeTexture(w, h, (c, w2, h2) => {
    c.fillStyle = bg || '#f7f3e6'; c.fillRect(0, 0, w2, h2);
    c.strokeStyle = fg || '#2b3b55'; c.lineWidth = 6; c.strokeRect(6, 6, w2 - 12, h2 - 12);
    if (sub) {
      fitText(c, text, w2 / 2, h2 * 0.40, w2 * 0.88, h2 * 0.36, 900, fg || '#2b3b55');
      fitText(c, sub, w2 / 2, h2 * 0.74, w2 * 0.86, h2 * 0.18, 700, fg || '#2b3b55');
    } else {
      fitText(c, text, w2 / 2, h2 * 0.5, w2 * 0.88, h2 * 0.48, 900, fg || '#2b3b55');
    }
  });
}

function texStop() {
  return makeTexture(256, 240, (c, w, h) => {
    c.clearRect(0, 0, w, h);
    c.fillStyle = '#e2503f'; c.beginPath();
    c.moveTo(w / 2, h - 14); c.lineTo(14, 14); c.lineTo(w - 14, 14); c.closePath(); c.fill();
    c.strokeStyle = '#fff8ec'; c.lineWidth = 12; c.stroke();
    fitText(c, '止まれ', w / 2, h * 0.62, w * 0.62, 56, 900, '#fff8ec');
  });
}
function texDirection() {
  return makeTexture(512, 160, (c, w, h) => {
    c.fillStyle = '#165a8a'; c.fillRect(0, 0, w, h);
    c.strokeStyle = 'rgba(255,255,255,0.6)'; c.lineWidth = 5; c.strokeRect(6, 6, w - 12, h - 12);
    fitText(c, 'あめのみや商店街  →', 220, h * 0.36, 400, 42, 900, '#f5f8ff');
    fitText(c, '駅前通り  ←   雨宮町二丁目', 220, h * 0.72, 410, 30, 700, '#cfe6f7');
    c.fillStyle = '#f5f8ff';
    c.beginPath(); c.moveTo(430, 60); c.lineTo(478, 80); c.lineTo(430, 100); c.closePath(); c.fill();
  });
}
function texP() {
  return makeTexture(256, 256, (c, w, h) => {
    c.fillStyle = '#1c5f9e'; c.fillRect(0, 0, w, h);
    c.strokeStyle = '#eaf4ff'; c.lineWidth = 8; c.strokeRect(10, 10, w - 20, h - 20);
    fitText(c, 'P', w / 2, h * 0.45, w * 0.7, 150, 900, '#f2f8ff');
    fitText(c, '駐車場', w / 2, h * 0.84, w * 0.8, 30, 800, '#d6e9fb');
  });
}
function texPlate() {
  return makeTexture(640, 96, (c, w, h) => {
    const g = c.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, '#b99a5c'); g.addColorStop(0.5, '#e7cf95'); g.addColorStop(1, '#a9894c');
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    c.strokeStyle = 'rgba(70,52,20,0.65)'; c.lineWidth = 3; c.strokeRect(7, 7, w - 14, h - 14);
    fitText(c, '雨の夜 ・ 街角コンビニ', w * 0.5, h * 0.38, w * 0.82, 34, 900, '#3d3119');
    fitText(c, 'RAINY NIGHT / MINIATURE DIORAMA ・ No.024', w * 0.5, h * 0.76, w * 0.82, 17, 700, '#5b4824');
  });
}
function texDoorMat() {
  return makeTexture(512, 220, (c, w, h) => {
    c.fillStyle = '#4a4a42'; c.fillRect(0, 0, w, h);
    c.strokeStyle = '#d8c38a'; c.lineWidth = 8; c.strokeRect(14, 14, w - 28, h - 28);
    for (let i = 0; i < 90; i++) {
      c.strokeStyle = 'rgba(220,210,185,0.10)'; c.lineWidth = 2;
      c.beginPath(); c.moveTo(W.rr(0, w), 0); c.lineTo(W.rr(0, w), h); c.stroke();
    }
    fitText(c, 'いらっしゃいませ', w / 2, h * 0.42, w * 0.8, 46, 900, '#e8d8a8');
    fitText(c, 'WELCOME ・ MIRAI MART', w / 2, h * 0.74, w * 0.8, 26, 800, '#cfbf94');
  });
}
function texGuide() {
  return makeTexture(256, 256, (c, w, h) => {
    c.clearRect(0, 0, w, h);
    c.strokeStyle = 'rgba(88,200,160,0.9)'; c.lineWidth = 13; c.setLineDash([26, 16]);
    c.beginPath(); c.moveTo(128, 246); c.lineTo(128, 60); c.stroke(); c.setLineDash([]);
    c.fillStyle = 'rgba(88,200,160,0.95)';
    c.beginPath(); c.moveTo(128, 16); c.lineTo(76, 82); c.lineTo(180, 82); c.closePath(); c.fill();
  });
}
function texRainStreak() {
  return makeTexture(256, 512, (c, w, h) => {
    c.clearRect(0, 0, w, h);
    for (let i = 0; i < 60; i++) {
      const x = W.rr(0, w), y = W.rr(0, h), len = W.rr(30, 180), wd = W.rr(0.8, 2.8);
      const g = c.createLinearGradient(0, y, 0, y + len);
      g.addColorStop(0, 'rgba(210,238,255,0)');
      g.addColorStop(0.25, 'rgba(210,238,255,' + W.rr(0.10, 0.42).toFixed(2) + ')');
      g.addColorStop(1, 'rgba(235,248,255,0)');
      c.fillStyle = g; c.fillRect(x, y, wd, len);
      c.fillStyle = 'rgba(235,250,255,0.45)';
      c.beginPath(); c.arc(x + wd / 2, y + len, wd * 1.6, 0, Math.PI * 2); c.fill();
    }
  }, { wrapY: true });
}
function texPuddle() {
  return makeTexture(256, 256, (c, w, h) => {
    c.clearRect(0, 0, w, h);
    const g = c.createRadialGradient(128, 128, 20, 128, 128, 122);
    g.addColorStop(0, 'rgba(44,74,104,0.72)');
    g.addColorStop(0.65, 'rgba(40,66,96,0.48)');
    g.addColorStop(0.92, 'rgba(120,170,205,0.20)');
    g.addColorStop(1, 'rgba(120,170,205,0)');
    c.fillStyle = g;
    c.beginPath();
    for (let i = 0; i <= 40; i++) {
      const a = i / 40 * Math.PI * 2;
      const r = 112 + Math.sin(a * 3.1) * 8 + Math.sin(a * 5.7 + 1.2) * 5;
      const x = 128 + Math.cos(a) * r, y = 128 + Math.sin(a) * r * 0.86;
      i ? c.lineTo(x, y) : c.moveTo(x, y);
    }
    c.closePath(); c.fill();
  });
}
function texWindowLit() {
  return makeTexture(128, 160, (c, w, h) => {
    const g = c.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#ffe9b4'); g.addColorStop(1, '#e9a95e');
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    c.fillStyle = 'rgba(80,60,40,0.20)';
    c.fillRect(0, h * 0.62, w, h * 0.38);
    c.fillStyle = 'rgba(60,50,45,0.30)';
    c.fillRect(w * 0.46, 0, 5, h); c.fillRect(0, h * 0.48, w, 4);
    c.strokeStyle = '#5a6474'; c.lineWidth = 7; c.strokeRect(3, 3, w - 6, h - 6);
  });
}

function flatQuad(w, d, x, z, y, mat, angle, order) {
  const g = new THREE.PlaneGeometry(w, d);
  g.rotateX(-Math.PI / 2);
  if (angle) g.rotateY(angle);
  const m = new THREE.Mesh(g, mat);
  m.position.set(x, y, z);
  m.renderOrder = order === undefined ? 2 : order;
  W.scene.add(m);
  return m;
}

/* ---------- constants ---------- */
const SX0 = -8.6, SX1 = 2.1, SZ0 = -10.2, SZ1 = -2.6;
const FY = 0.16, ROOF = 5.42, GLASS_TOP = 3.74;

function buildWorld() {
  W.anim.panes = [];
  W.anim.puddles = [];
  W.anim.eave = [];
  W.anim.signGlows = [];
  W.anim.reflect = [];
  buildBase();
  buildStreet();
  buildStoreShell();
  buildInterior();
  buildProps();
}

/* ---------- plinth ---------- */
function buildBase() {
  box(26, 1.25, 26, 0, -0.625, 0, 0x232f45);
  box(26.05, 0.16, 26.05, 0, -1.16, 0, 0x182338, { fine: true });
  floorQuad(25.8, 25.8, 0, 0, 0.006, texMat(texAsphalt(), 1, false));
  /* brass-ish frame */
  const rim = 0x566c88;
  box(26.1, 0.10, 0.20, 0, 0.02, 12.98, rim, { fine: true });
  box(26.1, 0.10, 0.20, 0, 0.02, -12.98, rim, { fine: true });
  box(0.20, 0.10, 26.1, 12.98, 0.02, 0, rim, { fine: true });
  box(0.20, 0.10, 26.1, -12.98, 0.02, 0, rim, { fine: true });
  frontQuad(3.5, 0.52, 0, -0.60, 13.06, texMat(texPlate(), 1, false));
  /* soft shadow beneath the model */
  flatQuad(38, 38, 0, 0, -1.29, texMat(W.tex.shadow, 0.88, false), 0, 0);
  flatQuad(29, 29, 0, 0, -1.28, texMat(W.tex.shadow, 0.55, false), 0, 0);
}

/* ---------- streets, sidewalks, markings ---------- */
function buildStreet() {
  /* road tone bands */
  floorQuad(25.8, 5.30, 0, 3.35, 0.010, solidMat(0x162033, 0.60, false), { renderOrder: 0 });
  floorQuad(4.40, 19.0, 6.80, -3.40, 0.011, solidMat(0x162033, 0.60, false), { renderOrder: 0 });
  floorQuad(25.8, 2.85, 0, -11.55, 0.011, solidMat(0x182236, 0.45, false), { renderOrder: 0 });
  floorQuad(1.75, 3.30, -9.50, -0.95, 0.012, solidMat(0x141d2e, 0.85, false), { renderOrder: 0 }); // alley mouth

  /* raised sidewalks */
  box(13.2, FY, 3.30, -2.00, FY / 2, -0.95, PAL.walk);
  box(2.50, FY, 7.60, 3.35, FY / 2, -6.40, PAL.walk);
  box(2.60, FY, 3.30, -11.70, FY / 2, -0.95, PAL.walk);
  box(26.0, 0.13, 7.00, 0, 0.065, 9.50, 0x3c4b64);
  box(4.00, 0.13, 19.0, 11.00, 0.065, -3.50, 0x3c4b64);

  const walkTex = texGrid('rgba(150,166,186,0.0)', 'rgba(26,38,58,0.30)', 4);
  walkTex.repeat.set(16, 4); walkTex.needsUpdate = true;
  floorQuad(13.2, 3.30, -2.00, -0.95, 0.163, texMat(walkTex, 0.55, false));
  const walkTex2 = texGrid('rgba(150,166,186,0.0)', 'rgba(26,38,58,0.30)', 4);
  walkTex2.repeat.set(3, 10); walkTex2.needsUpdate = true;
  floorQuad(2.50, 7.60, 3.35, -6.40, 0.164, texMat(walkTex2, 0.55, false));
  const walkTex3 = texGrid('rgba(150,166,186,0.0)', 'rgba(26,38,58,0.26)', 4);
  walkTex3.repeat.set(26, 7); walkTex3.needsUpdate = true;
  floorQuad(26.0, 7.00, 0, 9.50, 0.133, texMat(walkTex3, 0.50, false));
  const walkTex4 = texGrid('rgba(150,166,186,0.0)', 'rgba(26,38,58,0.26)', 4);
  walkTex4.repeat.set(4, 20); walkTex4.needsUpdate = true;
  floorQuad(4.00, 19.0, 11.00, -3.50, 0.134, texMat(walkTex4, 0.50, false));

  /* tactile paving */
  const tac = texTactile(); tac.repeat.set(22, 1); tac.needsUpdate = true;
  floorQuad(13.2, 0.40, -2.00, 0.48, 0.168, texMat(tac, 0.92, false));
  const tac2 = texTactile(); tac2.repeat.set(1, 13); tac2.needsUpdate = true;
  floorQuad(0.40, 7.60, 4.38, -6.40, 0.169, texMat(tac2, 0.92, false));
  const tac3 = texTactile(); tac3.repeat.set(26, 1); tac3.needsUpdate = true;
  floorQuad(26.0, 0.36, 0, 6.20, 0.136, texMat(tac3, 0.85, false));

  /* drain grates along the curbs */
  const grateMat = solidMat(0x10192a, 0.95, false);
  for (let x = -8.4; x < 4.5; x += 0.62) floorQuad(0.44, 0.24, x, 0.76, 0.017, grateMat);
  for (let z = -10.1; z < 0.7; z += 0.62) floorQuad(0.24, 0.44, 4.66, z, 0.018, grateMat);
  box(13.2, 0.05, 0.30, -2.0, 0.018, 0.76, 0x35425a, { fine: true, edge: false });
  box(0.30, 0.05, 7.60, 4.66, 0.019, -4.7, 0x35425a, { fine: true, edge: false });

  /* crosswalk A : across the front road */
  const stripeMat = solidMat(0xcfe2ec, 0.80, false);
  for (let i = 0; i < 7; i++) {
    const x = -3.15 + i * 0.86;
    floorQuad(0.50, 4.60, x, 3.25, 0.021, stripeMat);
    pool(x, 3.25, 0.42, 4.9, 0xbcd8ee, 0.10, 0.023);
  }
  floorQuad(6.5, 0.16, -0.65, 5.86, 0.022, solidMat(0xcfe2ec, 0.62, false));
  /* crosswalk B : across the side street */
  for (let i = 0; i < 6; i++) {
    const z = -2.10 + i * 0.80;
    floorQuad(3.90, 0.48, 6.75, z, 0.023, stripeMat);
    pool(6.75, z, 4.2, 0.42, 0xbcd8ee, 0.09, 0.024);
  }
  floorQuad(0.16, 6.0, 8.86, -0.10, 0.024, solidMat(0xcfe2ec, 0.55, false));
  floorQuad(25.8, 0.075, 0, 6.02, 0.020, solidMat(0x9fb6c8, 0.35, false));

  /* manholes */
  const manhole = makeTexture(256, 256, (c, w, h) => {
    c.clearRect(0, 0, w, h);
    c.fillStyle = '#3b4a5e'; c.beginPath(); c.arc(128, 128, 118, 0, Math.PI * 2); c.fill();
    c.strokeStyle = '#223044'; c.lineWidth = 8;
    c.beginPath(); c.arc(128, 128, 100, 0, Math.PI * 2); c.stroke();
    c.lineWidth = 4;
    for (let i = -3; i <= 3; i++) { c.beginPath(); c.moveTo(30, 128 + i * 24); c.lineTo(226, 128 + i * 24); c.stroke(); }
    c.fillStyle = '#6d829a';
    for (let a = 0; a < 8; a++) {
      const ang = a * Math.PI / 4;
      c.beginPath(); c.arc(128 + Math.cos(ang) * 110, 128 + Math.sin(ang) * 110, 5, 0, Math.PI * 2); c.fill();
    }
  });
  flatQuad(1.5, 1.5, 2.4, 4.6, 0.026, texMat(manhole, 0.85, false), 0.3);
  flatQuad(1.25, 1.25, 6.7, -4.6, 0.027, texMat(manhole, 0.85, false), -0.2);

  /* wet puddles */
  const pTex = texPuddle();
  const puddles = [
    [-6.9, 2.3, 3.0, 1.4], [-4.4, 4.6, 2.0, 0.9], [1.6, 1.9, 2.6, 1.2],
    [3.9, 3.1, 2.2, 1.0], [6.9, 2.5, 2.4, 1.3], [8.0, -0.8, 1.8, 1.0],
    [6.2, -6.4, 1.7, 2.8], [7.4, -9.4, 1.3, 2.0], [-1.0, 5.3, 2.8, 0.9],
    [-9.4, 3.5, 1.9, 1.0], [10.9, 4.4, 1.6, 1.1], [-11.4, 2.9, 1.5, 0.9],
    [-9.5, -5.6, 1.2, 1.8], [-9.5, -8.4, 1.1, 1.5], [11.2, -0.4, 1.4, 1.2],
    [0.8, -0.6, 1.4, 0.7]
  ];
  for (const p of puddles) {
    flatQuad(p[2], p[3], p[0], p[1], 0.030, texMat(pTex, 0.80, false), W.rr(-0.5, 0.5));
    W.anim.puddles.push({ x: p[0], z: p[1], r: Math.min(p[2], p[3]) * 0.42 });
  }

  /* neon / lamp reflections stretched on the wet asphalt */
  const refl = [
    [-3.9, 1.4, 1.5, 4.0, 0xffb96a, 0.52], [-3.9, 3.8, 1.8, 4.6, 0xffa658, 0.32],
    [-6.6, 1.6, 0.9, 3.0, 0x66d2f2, 0.40], [0.4, 1.6, 1.1, 3.4, 0xffd88a, 0.44],
    [4.9, 2.6, 1.1, 3.5, 0x4ec6f0, 0.34], [8.1, -6.5, 1.1, 3.4, 0x59d6ea, 0.32],
    [2.8, 4.4, 0.8, 3.0, 0xffebb0, 0.36], [-1.2, 4.2, 1.0, 3.4, 0xffdda0, 0.32],
    [6.6, -2.0, 1.0, 2.8, 0xf0705a, 0.28], [9.9, 1.2, 0.9, 2.8, 0xffc87a, 0.26],
    [-9.5, -6.0, 0.8, 2.4, 0xffb45e, 0.28], [-6.0, 4.9, 1.0, 2.6, 0x5aa8e8, 0.26],
    [7.4, 3.4, 0.8, 2.6, 0x8f7ce8, 0.20], [1.6, 3.0, 0.9, 2.8, 0xffcf8a, 0.30]
  ];
  for (const r of refl) W.anim.reflect.push(pool(r[0], r[1], r[2], r[3], r[4], r[5], 0.033));
}

/* ---------- store shell ---------- */
function buildStoreShell() {
  const w = SX1 - SX0, d = SZ1 - SZ0, cx = (SX0 + SX1) / 2, cz = (SZ0 + SZ1) / 2;

  /* solid walls (back, left, corner pillar) */
  box(w, ROOF - FY, 0.18, cx, (ROOF + FY) / 2, SZ0 + 0.09, PAL.wall);
  box(0.18, ROOF - FY, d, SX0 + 0.09, (ROOF + FY) / 2, cz, 0xdcd6c5);
  box(0.30, ROOF - FY, 0.30, SX1 - 0.15, (ROOF + FY) / 2, SZ1 - 0.15, PAL.cream);
  /* solid side-wall section near the back (holds vending machines + posters) */
  box(0.18, ROOF - FY, 2.55, SX1 - 0.09, (ROOF + FY) / 2, -8.93, PAL.wall);

  /* upper sign fascia */
  const signFront = texStoreSign(1024, 112);
  const signSide = texStoreSign(768, 112);
  frontQuad(10.45, 1.16, cx, 4.62, SZ1 + 0.012, texMat(signFront, 1, false), { renderOrder: 2 });
  sideQuad(7.35, 1.16, SX1 + 0.012, 4.62, -6.42, texMat(signSide, 1, false), { renderOrder: 2 });
  box(10.7, 0.10, 0.26, cx, 5.24, SZ1 + 0.02, 0xf5f0e2, { fine: true });
  box(0.26, 0.10, 7.6, SX1 + 0.02, 5.24, -6.4, 0xf5f0e2, { fine: true });
  box(10.7, 0.10, 0.26, cx, 4.00, SZ1 + 0.02, PAL.coral, { fine: true });
  box(0.26, 0.10, 7.6, SX1 + 0.02, 4.00, -6.4, PAL.coral, { fine: true });
  /* thin stripe between glass and sign */
  box(10.7, 0.10, 0.10, cx, 3.80, SZ1 + 0.04, PAL.teal2, { fine: true, edge: false });

  /* glowing sign halos */
  const sg1 = glow(cx, 4.70, SZ1 + 0.42, 12.6, 3.2, 0x63d9d0, 0.30);
  const sg2 = glow(SX1 + 0.42, 4.70, -6.4, 9.0, 3.0, 0x63d9d0, 0.26);
  W.anim.signGlows.push(sg1, sg2);
  W.anim.signGlows.push(glow(-6.0, 4.62, SZ1 + 0.16, 2.8, 1.8, 0xfff2c8, 0.28));
  W.anim.signGlows.push(glow(-1.6, 4.62, SZ1 + 0.16, 2.8, 1.8, 0xfff2c8, 0.28));
  W.anim.signGlows.push(glow(SX1 + 0.16, 4.62, -4.2, 2.4, 1.8, 0xfff2c8, 0.24));

  /* canopy / eaves : front + right L */
  box(13.5, 0.17, 1.72, -2.6, 3.93, -1.74, 0x1b5062);
  box(1.60, 0.17, 8.0, 2.90, 3.93, -6.40, 0x1b5062);
  box(13.5, 0.07, 0.10, -2.6, 3.84, -0.90, 0x7fa6b2, { fine: true, edge: false });
  box(0.10, 0.07, 8.0, 3.68, 3.84, -6.40, 0x7fa6b2, { fine: true, edge: false });
  /* canopy valance with brand stripes */
  frontQuad(13.5, 0.46, -2.6, 3.62, -0.878, texMat(makeTexture(1024, 48, (c, w2, h) => {
    c.fillStyle = '#0d5064'; c.fillRect(0, 0, w2, h);
    c.fillStyle = '#28bda9'; c.fillRect(0, 0, w2, h * 0.18);
    c.fillStyle = '#ef8b60'; c.fillRect(0, h * 0.82, w2, h * 0.18);
    for (let i = 0; i < 14; i++) {
      c.fillStyle = 'rgba(255,255,255,0.10)'; c.fillRect(i * 78 + 12, 0, 26, h);
    }
    fitText(c, 'みらいマート　MIRAI MART　24H', w2 / 2, h * 0.52, w2 * 0.86, 24, 900, '#f8f2e4');
  }), 1, false), { renderOrder: 2 });
  sideQuad(8.0, 0.46, 3.685, 3.62, -6.40, texMat(makeTexture(768, 48, (c, w2, h) => {
    c.fillStyle = '#0d5064'; c.fillRect(0, 0, w2, h);
    c.fillStyle = '#28bda9'; c.fillRect(0, 0, w2, h * 0.18);
    c.fillStyle = '#ef8b60'; c.fillRect(0, h * 0.82, w2, h * 0.18);
    fitText(c, 'MIRAI MART ・ 24H ・ コンビニ', w2 / 2, h * 0.52, w2 * 0.9, 22, 900, '#f8f2e4');
  }), 1, false), { renderOrder: 2 });
  /* under-eave downlights */
  for (let i = 0; i < 7; i++) {
    const x = -8.1 + i * 1.75;
    box(0.34, 0.05, 0.20, x, 3.83, -1.55, 0xfff4d6, { shade: false, edge: false });
    W.anim.signGlows.push(glow(x, 3.70, -1.52, 1.0, 0.8, 0xffd9a0, 0.38));
    pool(x, -1.2, 0.9, 1.8, 0xffd39a, 0.30, 0.172);
  }
  for (let i = 0; i < 4; i++) {
    const z = -9.0 + i * 1.9;
    box(0.20, 0.05, 0.34, 3.32, 3.83, z, 0xfff4d6, { shade: false, edge: false });
    W.anim.signGlows.push(glow(3.42, 3.70, z, 0.8, 0.6, 0xffd9a0, 0.25));
  }
  /* slim canopy posts */
  box(0.13, 3.75, 0.13, -9.20, 1.95, -1.02, 0xaab6c4, { fine: true });
  box(0.13, 3.75, 0.13, 3.60, 1.95, -1.02, 0xaab6c4, { fine: true });
  box(0.13, 3.75, 0.13, 3.60, 1.95, -10.10, 0xaab6c4, { fine: true });

  /* glass panes : front */
  const glassMat = new THREE.MeshBasicMaterial({
    color: 0xbfe4f5, transparent: true, opacity: 0.085,
    side: THREE.DoubleSide, depthWrite: false
  });
  const rainGlass = texRainStreak();
  rainGlass.wrapT = THREE.RepeatWrapping;
  W.anim.glassTex = rainGlass;
  const streakMat = texMat(rainGlass, 0.16, true);
  W.anim.glassMat = streakMat;

  function glassFront(x1, x2, y0, y1) {
    const ww = x2 - x1, hh = y1 - y0, xx = (x1 + x2) / 2, yy = (y0 + y1) / 2;
    frontQuad(ww, hh, xx, yy, SZ1 + 0.02, glassMat, { renderOrder: 8 });
    frontQuad(ww, hh, xx, yy, SZ1 + 0.035, streakMat, { renderOrder: 9 });
    W.anim.panes.push({ x: xx, y: yy, z: SZ1 + 0.05, w: ww, h: hh, dir: 'front' });
  }
  function glassSide(z1, z2, y0, y1) {
    const ww = z2 - z1, hh = y1 - y0, zz = (z1 + z2) / 2, yy = (y0 + y1) / 2;
    sideQuad(ww, hh, SX1 + 0.02, yy, zz, glassMat, { renderOrder: 8 });
    sideQuad(ww, hh, SX1 + 0.035, yy, zz, streakMat, { renderOrder: 9 });
    W.anim.panes.push({ x: SX1 + 0.05, y: yy, z: zz, w: ww, h: hh, dir: 'side' });
  }
  const gy0 = 0.34, gy1 = GLASS_TOP;
  glassFront(-8.45, -5.15, gy0, gy1);
  glassFront(-2.75, 2.05, gy0, gy1);
  glassSide(-7.60, -2.62, gy0, gy1);
  /* kick plate + mullions */
  box(10.5, 0.20, 0.10, cx, 0.26, SZ1 + 0.05, 0xd9d3c2, { fine: true });
  box(0.10, 0.20, 5.0, SX1 + 0.05, 0.26, -5.1, 0xd9d3c2, { fine: true });
  const frame = 0xbac7cf;
  for (const x of [-8.48, -6.80, -5.15, -2.75, -0.35, 2.08]) box(0.075, 3.45, 0.10, x, 2.02, SZ1 + 0.06, frame, { fine: true, edge: false });
  for (const z of [-7.62, -6.10, -4.55, -3.00, -2.60]) box(0.10, 3.45, 0.075, SX1 + 0.06, 2.02, z, frame, { fine: true, edge: false });
  box(10.6, 0.09, 0.10, cx, GLASS_TOP + 0.02, SZ1 + 0.06, frame, { fine: true, edge: false });
  box(0.10, 0.09, 5.05, SX1 + 0.06, GLASS_TOP + 0.02, -5.1, frame, { fine: true, edge: false });
  box(10.6, 0.055, 0.10, cx, 2.30, SZ1 + 0.065, frame, { fine: true, edge: false });
  box(0.10, 0.055, 5.05, SX1 + 0.065, 2.30, -5.1, frame, { fine: true, edge: false });

  /* automatic sliding door */
  const doorGlass = new THREE.MeshBasicMaterial({ color: 0xcfeaf6, transparent: true, opacity: 0.13, side: THREE.DoubleSide, depthWrite: false });
  const dl = box(1.16, 3.30, 0.055, -4.55, 2.01, SZ1 + 0.09, 0, { mat: doorGlass, edge: false, outline: true, renderOrder: 9 });
  const dr = box(1.16, 3.30, 0.055, -3.35, 2.01, SZ1 + 0.09, 0, { mat: doorGlass, edge: false, outline: true, renderOrder: 9 });
  for (const dm of [dl, dr]) {
    box(0.07, 3.32, 0.09, 0, 0, 0, 0, { mat: solidMat(0xb6c6d2, 1, false), edge: false, parent: dm, shade: false });
  }
  W.anim.doorL = dl; W.anim.doorR = dr;
  W.anim.doorBaseL = -4.55; W.anim.doorBaseR = -3.35;
  box(2.44, 0.30, 0.18, -3.95, 3.82, SZ1 + 0.10, 0xb9c8d2, { fine: true });
  box(0.10, 3.45, 0.12, -5.15, 2.01, SZ1 + 0.10, frame, { fine: true, edge: false });
  box(0.10, 3.45, 0.12, -2.75, 2.01, SZ1 + 0.10, frame, { fine: true, edge: false });
  const sensor = box(0.22, 0.10, 0.10, -3.95, 3.80, SZ1 + 0.20, 0, { mat: new THREE.MeshBasicMaterial({ color: 0x7ee0a2 }), edge: false });
  W.anim.doorSensor = sensor;

  /* roof slab + rooftop details */
  box(13.4, 0.24, 9.2, -3.15, ROOF + 0.12, -6.40, 0x2c3c52);
  box(13.5, 0.09, 9.3, -3.15, ROOF + 0.27, -6.40, 0x29384e, { fine: true });
  const roofGrid = texGrid('rgba(20,30,46,0.0)', 'rgba(150,180,205,0.16)', 4);
  roofGrid.repeat.set(12, 8); roofGrid.needsUpdate = true;
  floorQuad(13.3, 9.1, -3.15, -6.40, ROOF + 0.32, texMat(roofGrid, 0.75, false), { renderOrder: 1 });
  /* rooftop vents, tank, railings */
  box(1.9, 0.55, 1.2, -6.9, ROOF + 0.62, -8.3, 0x6f8498, { fine: true });
  box(1.3, 0.35, 1.0, 0.4, ROOF + 0.52, -9.1, 0x6f8498, { fine: true });
  cylinder(0.42, 0.42, 0.85, -8.6, ROOF + 0.78, -5.0, 0x647b90, { seg: 12, fine: true });
  cylinder(0.46, 0.46, 0.07, -8.6, ROOF + 1.24, -5.0, 0x8398a9, { seg: 12, fine: true });
  for (let i = 0; i < 4; i++) box(0.05, 0.42, 0.05, -9.7 + i * 0.72, ROOF + 0.55, -10.85, 0x8b9dad, { edge: false });
  box(5.2, 0.035, 0.035, -6.6, ROOF + 0.75, -10.85, 0x8b9dad, { edge: false });
  for (let i = 0; i < 3; i++) cylinder(0.16, 0.16, 0.30, -5.4 + i * 0.9, ROOF + 0.47, -9.4, 0x59708a, { seg: 10, fine: true });
  cylinder(0.05, 0.05, 1.4, 1.2, ROOF + 1.0, -8.2, 0x8b98a6, { seg: 6, fine: true });
  /* rooftop 24H pylon */
  box(2.5, 1.35, 0.30, -3.0, ROOF + 1.05, -10.0, 0x0d5064, { fine: true });
  frontQuad(2.35, 1.20, -3.0, ROOF + 1.05, -9.83, texMat(texLabel('24H', '営業中', '#0d5064', '#f6f1e2'), 1, false), { renderOrder: 2 });
  const pg = glow(-3.0, ROOF + 1.05, -9.6, 3.6, 2.4, 0x7ce0d4, 0.24);
  W.anim.signGlows.push(pg);
  /* rooftop AC + pipes */
  box(1.1, 0.8, 0.7, 1.1, ROOF + 0.7, -7.2, 0xb0bcc4, { fine: true });
  for (let i = 0; i < 3; i++) cylinder(0.035, 0.035, 1.6, -8.0 + i * 0.16, ROOF + 0.9, -10.6, 0x92a2ae, { seg: 6, edge: false });

  /* posters on the solid side wall */
  sideQuad(0.92, 1.30, SX1 + 0.012, 2.10, -9.9, texMat(texPoster('新商品', '秋の新作スイーツ', '#f29a7a', 'NEW'), 1, false), { renderOrder: 2 });
  sideQuad(0.80, 1.10, SX1 + 0.012, 2.10, -8.55, texMat(texPoster('ポイント', 'アプリでおトク', '#79b8cf', 'INFO'), 1, false), { renderOrder: 2 });
  sideQuad(0.55, 0.78, SX1 + 0.012, 0.95, -9.3, texMat(texLabel('求人', 'スタッフ募集', '#f7f1de', '#40506a', 256, 340), 1, false), { renderOrder: 2 });
  /* small posters stuck to the front glass (lower corners) */
  frontQuad(0.72, 0.98, -7.85, 1.05, SZ1 + 0.075, texMat(texPoster('コーヒー', '淹れたて 100円', '#a5c98c', 'HOT'), 0.88, false), { renderOrder: 10 });
  frontQuad(0.62, 0.86, 1.60, 1.02, SZ1 + 0.075, texMat(texPoster('おにぎり', '具だくさん', '#e8c86a', '新'), 0.86, false), { renderOrder: 10 });

  /* entrance doormat */
  floorQuad(2.25, 1.05, -3.95, -1.85, 0.171, texMat(texDoorMat(), 1, false), { renderOrder: 2 });
  box(2.30, 0.014, 1.10, -3.95, 0.160, -1.85, 0x3c3c38, { fine: true, edge: false });

  /* wet light spill in front of the store */
  pool(-3.9, -1.0, 11.0, 3.2, 0xffc078, 0.62, 0.172);
  pool(1.5, -1.0, 4.2, 2.4, 0xffd08a, 0.38, 0.172);
  pool(3.0, -5.2, 2.6, 7.2, 0xffc078, 0.38, 0.172);
  W.anim.reflect.push(pool(-3.9, 1.2, 6.6, 3.6, 0xffb466, 0.42, 0.034));
  W.anim.reflect.push(pool(-6.4, 2.0, 1.4, 3.4, 0x5fd0f0, 0.40, 0.034));
  W.anim.reflect.push(pool(0.9, 2.1, 1.3, 3.2, 0xffd27e, 0.36, 0.034));
  W.anim.reflect.push(pool(5.4, 1.6, 1.1, 3.0, 0x54c8ea, 0.34, 0.034));
}

/* ---------- interior ---------- */
function buildInterior() {
  const w = SX1 - SX0 - 0.2, d = SZ1 - SZ0 - 0.2;
  const cx = (SX0 + SX1) / 2, cz = (SZ0 + SZ1) / 2;
  const iy = FY + 0.012;

  /* floor + ceiling */
  const tile = texGrid('#efe9d8', 'rgba(140,130,110,0.42)', 4);
  tile.repeat.set(12, 9); tile.needsUpdate = true;
  floorQuad(w, d, cx, cz, iy, texMat(tile, 1, false));
  floorQuad(w, d, cx, cz, 3.70, texMat(texGrid('#fff8e8', 'rgba(190,180,160,0.35)', 3), 1, false));
  /* bright interior back wall */
  backQuad(w, 3.5, cx, 1.92, SZ0 + 0.20, solidMat(0xf3eddd, 1, false));
  sideQuad(d, 3.5, SX0 + 0.20, 1.92, cz, solidMat(0xe9e3d2, 1, false));
  /* interior warm ambience */
  for (let i = 0; i < 6; i++) glow(-7.3 + i * 1.8, 2.3, -6.2, 4.2, 3.4, 0xffdda0, 0.10);
  pool(cx, -6.2, 9.6, 6.4, 0xffd9a0, 0.22, iy + 0.004);

  /* fluorescent ceiling bars */
  const barMat = new THREE.MeshBasicMaterial({ color: 0xfff7df });
  for (let i = 0; i < 4; i++) {
    const x = -7.4 + i * 2.9;
    for (let j = 0; j < 2; j++) {
      const z = -8.6 + j * 3.4;
      const m = (i === 2 && j === 0) ? (W.anim.ceilingMat = new THREE.MeshBasicMaterial({ color: 0xfff6da })) : barMat;
      box(2.1, 0.07, 0.22, x, 3.64, z, 0, { mat: m, shade: false, edge: false });
      glow(x, 3.52, z, 2.9, 1.4, 0xfff0c6, 0.20);
    }
  }
  /* ceiling hanging category lightboxes */
  const hangs = [
    [-7.0, -4.85, 'お菓子', 'SNACKS', '#fff3dc', '#d2603f'],
    [-4.0, -4.85, 'カップ麺', 'NOODLES', '#e9f5ff', '#2f73a8'],
    [-1.0, -4.85, '日用品', 'DAILY', '#f3ecff', '#7451a8'],
    [-6.6, -9.25, 'ドリンク', 'DRINKS', '#e6f8f5', '#178f88'],
    [-3.4, -9.25, 'お弁当', 'BENTO', '#fff0e4', '#d1783c'],
    [0.9, -9.25, 'ホット', 'HOT FOODS', '#ffeaea', '#c94e4e']
  ];
  for (const h of hangs) {
    box(1.28, 0.50, 0.055, h[0], 2.92, h[1], 0xffffff, { shade: false, edge: false });
    frontQuad(1.22, 0.45, h[0], 2.92, h[1] + 0.04, texMat(texHang(h[2], h[3], h[4], h[5]), 1, false), { renderOrder: 2 });
    backQuad(1.22, 0.45, h[0], 2.92, h[1] - 0.04, texMat(texHang(h[2], h[3], h[4], h[5]), 1, false), { renderOrder: 2 });
    box(0.025, 0.55, 0.025, h[0] - 0.5, 3.40, h[1], 0x8b96a4, { edge: false });
    box(0.025, 0.55, 0.025, h[0] + 0.5, 3.40, h[1], 0x8b96a4, { edge: false });
    glow(h[0], 2.92, h[1] + 0.2, 1.8, 1.1, 0xffe7b8, 0.16);
  }

  /* ---- gondola shelves ---- */
  function gondola(gx, gz, len, category) {
    box(1.02, 0.16, len + 0.1, gx, 0.25, gz, 0xd9d4c4, { fine: true });
    for (let t = 0; t < 3; t++) {
      const y = 0.46 + t * 0.48;
      box(1.00, 0.055, len, gx, y, gz, 0xe8e3d5, { fine: true, edge: false });
      box(1.04, 0.05, 0.035, gx - 0.51, y + 0.04, gz, 0xf7f2e4, { edge: false });
      box(1.04, 0.05, 0.035, gx + 0.51, y + 0.04, gz, 0xf7f2e4, { edge: false });
      const n = Math.floor(len / 0.40);
      for (let i = 0; i < n; i++) {
        const z = gz - len / 2 + 0.22 + i * (len - 0.44) / Math.max(1, n - 1);
        for (const side of [-1, 1]) {
          const px = gx + side * 0.34;
          const ph = W.rr(0.19, 0.30);
          box(0.22, ph, 0.27, px, y + ph / 2 + 0.03, z, W.pick(SNACK), { edge: false, shade: true });
          if (W.rand() < 0.22) box(0.16, 0.10, 0.20, px + side * 0.03, y + 0.37, z, W.pick(SNACK), { edge: false });
        }
      }
      /* price tags */
      for (let i = 0; i < n; i += 2) {
        const z = gz - len / 2 + 0.22 + i * (len - 0.44) / Math.max(1, n - 1);
        box(0.055, 0.10, 0.13, gx + 0.535, y + 0.10, z, W.rand() < 0.3 ? 0xf07a5f : 0xfff6de, { edge: false });
      }
    }
    /* end cap */
    box(0.06, 1.50, 0.94, gx, 0.92, gz + len / 2 + 0.03, 0xcdd3cf, { fine: true });
    frontQuad(0.80, 0.48, gx, 1.20, gz + len / 2 + 0.07, texMat(texLabel(category, '', '#fff8e8', '#2c6a76', 256, 128), 1, false), { renderOrder: 2 });
  }
  gondola(-7.0, -6.95, 3.7, 'お菓子');
  gondola(-4.0, -6.95, 3.7, 'カップ麺');
  gondola(-1.0, -6.95, 3.7, '日用雑貨');

  /* ---- drink cooler along back wall ---- */
  const coolerX = -6.65, coolerZ = -9.72;
  box(3.30, 2.40, 0.62, coolerX, 1.36, coolerZ, 0x4a5a6c, { fine: true });
  box(3.10, 2.16, 0.05, coolerX, 1.38, coolerZ + 0.32, 0xf2fbff, { shade: false, edge: false });
  for (let r = 0; r < 5; r++) {
    const y = 0.48 + r * 0.40;
    box(3.12, 0.035, 0.10, coolerX, y, coolerZ + 0.36, 0xb9cbd6, { edge: false });
    for (let i = 0; i < 15; i++) {
      const x = coolerX - 1.45 + i * 0.207;
      cylinder(0.055, 0.055, 0.26, x, y + 0.16, coolerZ + 0.38, W.pick(DRINK), { seg: 7, edge: false });
      box(0.10, 0.05, 0.09, x, y + 0.30, coolerZ + 0.38, 0xf5f2e8, { edge: false });
    }
  }
  for (let i = 0; i < 4; i++) {
    const x = coolerX - 1.2 + i * 0.8;
    box(0.05, 2.20, 0.07, x, 1.38, coolerZ + 0.39, 0x9fb2c0, { edge: false });
  }
  glow(coolerX, 1.5, coolerZ + 0.62, 3.8, 2.8, 0xd8f4ff, 0.22);
  W.anim.signGlows.push(glow(coolerX + 1.1, 2.3, coolerZ + 0.5, 1.5, 1.2, 0xb9ecff, 0.18));

  /* ---- ice cream freezer ---- */
  box(2.05, 1.05, 0.82, -3.85, 0.69, -9.68, 0x51657a, { fine: true });
  box(1.95, 0.05, 0.72, -3.85, 1.23, -9.68, 0xbfe6f5, { shade: false, edge: false });
  for (let i = 0; i < 8; i++) {
    box(0.20, 0.12, 0.24, -4.65 + (i % 4) * 0.50, 1.16, -9.9 + Math.floor(i / 4) * 0.40, W.pick(SNACK), { edge: false });
  }
  glow(-3.85, 1.25, -9.3, 2.6, 1.5, 0x8fd8f5, 0.20);
  frontQuad(1.8, 0.42, -3.85, 0.60, -9.25, texMat(texLabel('アイス', 'ICE CREAM', '#e8f6ff', '#2b6f9e', 320, 100), 1, false), { renderOrder: 2 });

  /* ---- coffee machine ---- */
  box(0.95, 1.75, 0.55, -2.05, 1.04, -9.75, 0x3c4653, { fine: true });
  frontQuad(0.72, 0.60, -2.05, 1.45, -9.46, texMat(texLabel('COFFEE', '淹れたて', '#4a3226', '#ffd9a0', 256, 200), 1, false), { renderOrder: 2 });
  for (let i = 0; i < 4; i++) cylinder(0.07, 0.06, 0.14, -2.35 + i * 0.2, 0.95, -9.42, 0xf3ede0, { seg: 8, edge: false });
  box(0.55, 0.06, 0.28, -2.05, 0.55, -9.43, 0x222a34, { edge: false });
  glow(-2.05, 1.5, -9.3, 1.5, 1.6, 0xffb972, 0.26);

  /* ---- back door + lockers ---- */
  box(1.45, 2.45, 0.10, 1.20, 1.39, -10.03, 0x8e9aa6, { fine: true });
  frontQuad(1.28, 0.30, 1.20, 2.35, -9.96, texMat(texLabel('バックヤード', '', '#dfe8ee', '#3d5064', 384, 96), 1, false), { renderOrder: 2 });
  box(0.09, 0.09, 0.07, 1.83, 1.25, -9.94, 0xe8d9a8, { edge: false });
  for (let i = 0; i < 6; i++) {
    box(0.23, 0.42, 0.45, -0.35 + Math.floor(i / 3) * 0.25, 1.95 - (i % 3) * 0.44, -9.68, 0xa9b8c4, { fine: true });
    box(0.03, 0.05, 0.03, -0.35 + Math.floor(i / 3) * 0.25, 1.95 - (i % 3) * 0.44, -9.44, 0x46596b, { edge: false });
  }
  /* wall posters inside */
  frontQuad(1.05, 1.40, -7.9, 2.55, -10.05, texMat(texPoster('今週の', 'おすすめ', '#79b8cf', 'PICK UP'), 1, false), { renderOrder: 2 });
  frontQuad(0.85, 1.15, -0.05, 2.60, -10.05, texMat(texPoster('新発売', '季節限定', '#f29a7a', 'NEW'), 1, false), { renderOrder: 2 });

  /* ---- checkout counter ---- */
  box(2.05, 0.92, 0.82, 0.95, 0.62, -4.25, 0xd8c7a8, { fine: true });
  box(2.10, 0.07, 0.88, 0.95, 1.10, -4.25, 0xf3ead4, { fine: true });
  box(0.52, 0.28, 0.40, 0.35, 1.28, -4.28, 0x4a5563, { fine: true });
  frontQuad(0.40, 0.22, 0.35, 1.32, -4.07, solidMat(0x8fe0c8, 1, false), { renderOrder: 2 });
  box(0.30, 0.10, 0.26, 1.18, 1.19, -4.28, 0x586675, { fine: true });
  box(0.34, 0.16, 0.28, 1.62, 1.20, -4.25, 0xe8a35c, { fine: true });
  box(0.30, 0.22, 0.24, 1.60, 1.40, -4.25, 0xf3e6c8, { fine: true });
  /* receipt / small sign */
  box(0.06, 0.55, 0.06, 1.90, 1.40, -4.6, 0x9aa7b4, { edge: false });
  frontQuad(0.62, 0.34, 1.90, 1.72, -4.6, texMat(texLabel('レジ', 'REGISTER', '#fff3d8', '#c85a3c', 256, 140), 1, false), { renderOrder: 2 });
  glow(0.95, 1.4, -4.2, 2.7, 1.8, 0xffdda0, 0.14);

  /* ---- oden / hot snack counter ---- */
  box(1.85, 0.90, 0.72, -1.85, 0.61, -3.55, 0xbfae90, { fine: true });
  box(1.70, 0.06, 0.58, -1.85, 1.09, -3.55, 0xd8e4e2, { shade: false, edge: false });
  for (let i = 0; i < 7; i++) {
    box(0.16, 0.09, 0.16, -2.55 + i * 0.23, 1.15, -3.55, W.pick([0xe8c47a, 0xd8a56c, 0xf0e2c0, 0xb98c62]), { edge: false });
  }
  glow(-1.85, 1.15, -3.5, 2.2, 1.3, 0xffb26a, 0.26);
  box(1.85, 0.10, 0.10, -1.85, 1.30, -3.22, 0xb2563e, { edge: false });
  frontQuad(1.1, 0.34, -1.85, 0.66, -3.17, texMat(texLabel('おでん', 'あたたかい', '#fff0dc', '#b1503a', 320, 100), 1, false), { renderOrder: 2 });
  W.anim.steam = { x: -1.85, y: 1.25, z: -3.55 };

  /* ---- onigiri & snack display ---- */
  box(1.75, 0.78, 0.66, -7.45, 0.55, -3.65, 0xd9d0bb, { fine: true });
  box(1.65, 0.05, 0.56, -7.45, 0.96, -3.65, 0xf1ece0, { edge: false });
  for (let i = 0; i < 7; i++) {
    const x = -8.1 + i * 0.22;
    const shape = cylinder(0.14, 0.14, 0.06, x, 1.02, -3.65, 0xf7f4ea, { seg: 3, edge: false, rot: [Math.PI / 2, 0, 0] });
    box(0.10, 0.09, 0.02, x, 1.00, -3.61, 0x2c3a3a, { edge: false });
  }
  frontQuad(1.35, 0.30, -7.45, 1.32, -3.31, texMat(texLabel('おにぎり', 'ONIGIRI', '#fff6e0', '#3d7a6a', 320, 100), 1, false), { renderOrder: 2 });
  glow(-7.45, 1.10, -3.6, 2.3, 1.2, 0xffe2a8, 0.16);

  /* ---- magazine rack ---- */
  box(0.70, 1.65, 1.55, 1.55, 0.98, -6.95, 0xb9c2c8, { fine: true });
  for (let r = 0; r < 3; r++) {
    box(0.74, 0.04, 1.50, 1.55, 0.42 + r * 0.48, -6.95, 0xd8dee0, { edge: false });
    for (let i = 0; i < 9; i++) {
      const z = -7.60 + i * 0.165;
      box(0.42, 0.34, 0.09, 1.48, 0.62 + r * 0.48, z, W.pick(SNACK), { edge: false, rot: [0, 0, W.rr(-0.12, 0.12)] });
    }
  }
  /* ---- floor guidance ---- */
  floorQuad(1.15, 2.40, -3.95, -3.65, iy + 0.006, texMat(texGuide(), 0.55, false));
  floorQuad(2.1, 0.55, 0.95, -3.35, iy + 0.007, texMat(texLabel('レジ →', '', '#7ed6b4', '#ffffff', 320, 90), 0.72, false));
  for (let i = 0; i < 5; i++) floorQuad(0.44, 0.10, -7.0 + i * 2.9, -4.35, iy + 0.008, solidMat(0xf2d06b, 0.75, false));
  /* a small indoor trash + fire extinguisher */
  cylinder(0.22, 0.20, 0.62, -5.45, 0.47, -3.15, 0x6d7c8c, { seg: 10, fine: true });
  cylinder(0.10, 0.10, 0.42, -8.05, 0.37, -3.0, 0xd94f42, { seg: 8, fine: true });
}
