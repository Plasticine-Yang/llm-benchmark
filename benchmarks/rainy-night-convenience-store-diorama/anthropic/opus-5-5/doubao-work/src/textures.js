import * as THREE from 'three';
import { rng } from './util.js';

export const FONT = '"Hiragino Sans","Hiragino Kaku Gothic ProN","Noto Sans JP","Noto Sans CJK JP","Yu Gothic","Meiryo","PingFang SC",sans-serif';
export const FONT_R = '"Hiragino Maru Gothic ProN","Hiragino Sans","Noto Sans JP","Yu Gothic",sans-serif';

function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return [c, c.getContext('2d')];
}
function tex(c, o = {}) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = o.linear ? THREE.NoColorSpace : THREE.SRGBColorSpace;
  t.anisotropy = 8;
  if (o.repeat) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
  }
  t.needsUpdate = true;
  return t;
}
function rr(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}
function star(g, cx, cy, R, r, n = 5) {
  g.beginPath();
  for (let i = 0; i < n * 2; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / n;
    const rad = i % 2 ? r : R;
    g.lineTo(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad);
  }
  g.closePath();
}
function txt(g, s, x, y, size, color, o = {}) {
  g.save();
  g.font = `${o.weight || 800} ${size}px ${o.font || FONT}`;
  g.fillStyle = color;
  g.textAlign = o.align || 'center';
  g.textBaseline = 'middle';
  if (o.maxW) {
    const w = g.measureText(s).width;
    if (w > o.maxW) {
      g.translate(x, y);
      g.scale(o.maxW / w, 1);
      g.fillText(s, 0, 0);
      g.restore();
      return;
    }
  }
  g.fillText(s, x, y);
  g.restore();
}

/* ------------------------------------------------------------------ brand */
export const BRAND = { teal: '#16a6a0', orange: '#ff8a3d', cream: '#fff8ea', navy: '#1d3b63' };

function logo(g, cx, cy, s) {
  g.save();
  g.fillStyle = BRAND.orange;
  g.beginPath();
  g.arc(cx, cy, s, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#fff';
  star(g, cx, cy, s * 0.68, s * 0.3);
  g.fill();
  g.restore();
}

export function fasciaTexture(width = 2048, label = true) {
  const [c, g] = canvas(width, 256);
  g.fillStyle = BRAND.cream;
  g.fillRect(0, 0, width, 256);
  // brand stripes
  g.fillStyle = BRAND.teal;
  g.fillRect(0, 168, width, 40);
  g.fillStyle = BRAND.orange;
  g.fillRect(0, 208, width, 22);
  g.fillStyle = '#e94e5b';
  g.fillRect(0, 230, width, 10);
  if (label) {
    logo(g, 150, 88, 62);
    txt(g, 'ほしぞらマート', 600, 86, 112, BRAND.navy, { font: FONT_R, maxW: 720 });
    txt(g, 'HOSHIZORA MART', 1360, 98, 64, BRAND.teal, { weight: 900, maxW: 480 });
    txt(g, '24H', width - 140, 88, 92, BRAND.orange, { weight: 900 });
  } else {
    txt(g, 'ほしぞらマート  ·  HOSHIZORA MART  ·  OPEN 24H', width / 2, 88, 84, BRAND.navy, { font: FONT_R, maxW: width - 120 });
  }
  return tex(c);
}

export function poleSignTexture() {
  const [c, g] = canvas(512, 512);
  g.fillStyle = BRAND.cream;
  g.fillRect(0, 0, 512, 512);
  g.fillStyle = BRAND.teal;
  g.fillRect(0, 360, 512, 70);
  g.fillStyle = BRAND.orange;
  g.fillRect(0, 430, 512, 40);
  g.fillStyle = '#e94e5b';
  g.fillRect(0, 470, 512, 42);
  logo(g, 256, 150, 110);
  txt(g, 'ほしぞら', 256, 310, 74, BRAND.navy, { font: FONT_R });
  txt(g, 'OPEN 24H', 256, 396, 48, '#fff', { weight: 900 });
  return tex(c);
}

export function parkingSignTexture() {
  const [c, g] = canvas(256, 256);
  g.fillStyle = '#1f5fbf';
  rr(g, 8, 8, 240, 240, 26);
  g.fill();
  g.strokeStyle = '#fff';
  g.lineWidth = 8;
  rr(g, 20, 20, 216, 216, 18);
  g.stroke();
  txt(g, 'P', 128, 120, 170, '#fff', { weight: 900 });
  txt(g, '1台', 128, 214, 34, '#fff');
  return tex(c);
}

/* ---------------------------------------------------------------- posters */
const POSTERS = [
  { bg: '#ffe2a8', a: '#e2552e', t1: 'おでん', t2: '全品70円', t3: 'SALE', ill: 'oden' },
  { bg: '#ffd6e3', a: '#d9437a', t1: '新発売', t2: 'いちごミルク', t3: '¥158', ill: 'milk' },
  { bg: '#d8f1ff', a: '#1f6fbf', t1: 'からあげ', t2: 'フェア', t3: '増量中', ill: 'karaage' },
  { bg: '#e6f7d6', a: '#2c8a3c', t1: '秋の', t2: 'おにぎり祭', t3: '2個で¥250', ill: 'onigiri' },
  { bg: '#fff3c4', a: '#9a5c00', t1: 'ホット', t2: 'コーヒー', t3: 'S ¥110', ill: 'coffee' },
  { bg: '#efe1ff', a: '#6a3bb5', t1: '肉まん', t2: 'あんまん', t3: 'ふかふか', ill: 'bun' },
];
function drawIll(g, kind, cx, cy, s) {
  g.save();
  g.lineWidth = s * 0.05;
  g.strokeStyle = '#3a2a22';
  const f = (col) => { g.fillStyle = col; g.fill(); g.stroke(); };
  if (kind === 'oden') {
    g.beginPath(); g.arc(cx - s * 0.3, cy, s * 0.22, 0, 7); f('#fff6d8');
    g.beginPath(); g.moveTo(cx, cy - s * 0.3); g.lineTo(cx + s * 0.25, cy + s * 0.2); g.lineTo(cx - s * 0.2, cy + s * 0.2); g.closePath(); f('#8b8f9a');
    g.beginPath(); g.rect(cx + s * 0.2, cy - s * 0.2, s * 0.3, s * 0.36); f('#f3e2b8');
  } else if (kind === 'milk') {
    rr(g, cx - s * 0.2, cy - s * 0.4, s * 0.4, s * 0.8, s * 0.06); f('#ffffff');
    g.beginPath(); g.rect(cx - s * 0.2, cy - s * 0.05, s * 0.4, s * 0.3); f('#ff8fb1');
  } else if (kind === 'karaage') {
    for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(cx - s * 0.25 + i * s * 0.25, cy + (i % 2) * s * 0.1, s * 0.18, 0, 7); f('#d9862e'); }
  } else if (kind === 'onigiri') {
    g.beginPath(); g.moveTo(cx, cy - s * 0.38); g.quadraticCurveTo(cx + s * 0.42, cy + s * 0.32, cx, cy + s * 0.32); g.quadraticCurveTo(cx - s * 0.42, cy + s * 0.32, cx, cy - s * 0.38); f('#ffffff');
    g.beginPath(); g.rect(cx - s * 0.14, cy + s * 0.05, s * 0.28, s * 0.27); f('#1d2b22');
  } else if (kind === 'coffee') {
    g.beginPath(); g.moveTo(cx - s * 0.25, cy - s * 0.3); g.lineTo(cx + s * 0.25, cy - s * 0.3); g.lineTo(cx + s * 0.18, cy + s * 0.35); g.lineTo(cx - s * 0.18, cy + s * 0.35); g.closePath(); f('#fffaf0');
    g.beginPath(); g.rect(cx - s * 0.22, cy - s * 0.06, s * 0.44, s * 0.16); f('#7a4a2a');
  } else {
    g.beginPath(); g.ellipse(cx - s * 0.2, cy, s * 0.24, s * 0.2, 0, 0, 7); f('#fff8f0');
    g.beginPath(); g.ellipse(cx + s * 0.22, cy + s * 0.05, s * 0.22, s * 0.18, 0, 0, 7); f('#f4e9ff');
  }
  g.restore();
}
const posterCache = [];
export function posterTexture(i) {
  i %= POSTERS.length;
  if (posterCache[i]) return posterCache[i];
  const p = POSTERS[i];
  const [c, g] = canvas(256, 360);
  g.fillStyle = p.bg;
  g.fillRect(0, 0, 256, 360);
  g.fillStyle = p.a;
  g.fillRect(0, 0, 256, 70);
  txt(g, p.t1, 128, 38, 46, '#fff');
  drawIll(g, p.ill, 128, 160, 150);
  txt(g, p.t2, 128, 268, 40, p.a, { maxW: 230 });
  g.fillStyle = p.a;
  rr(g, 40, 300, 176, 46, 23);
  g.fill();
  txt(g, p.t3, 128, 324, 30, '#fff', { maxW: 160 });
  posterCache[i] = tex(c);
  return posterCache[i];
}

export function stickerTexture(text, bg, fg, w = 256, h = 96) {
  const [c, g] = canvas(w, h);
  g.fillStyle = bg;
  rr(g, 0, 0, w, h, h * 0.2);
  g.fill();
  txt(g, text, w / 2, h / 2 + 2, h * 0.5, fg, { maxW: w - 20 });
  return tex(c);
}

/* ------------------------------------------------------------ vending */
export function vendingTexture(theme = 0) {
  const [c, g] = canvas(256, 512);
  const r = rng(11 + theme * 7);
  const body = theme ? '#d93a3a' : '#f4f7fb';
  g.fillStyle = body;
  g.fillRect(0, 0, 256, 512);
  // display window
  g.fillStyle = '#eaf6ff';
  rr(g, 16, 18, 224, 300, 10);
  g.fill();
  const cols = ['#e64a4a', '#2f7de1', '#f2b632', '#3fb36b', '#8b5a2b', '#ffffff', '#ff7fb0', '#1c2a44', '#9fd9ff'];
  for (let row = 0; row < 4; row++) {
    const y = 32 + row * 72;
    g.fillStyle = 'rgba(30,60,90,0.12)';
    g.fillRect(22, y + 56, 212, 6);
    for (let k = 0; k < 6; k++) {
      const x = 30 + k * 34;
      const col = cols[Math.floor(r() * cols.length)];
      g.fillStyle = col;
      rr(g, x, y + (r() < 0.5 ? 6 : 14), 24, r() < 0.5 ? 48 : 40, 6);
      g.fill();
      g.fillStyle = 'rgba(255,255,255,0.75)';
      g.fillRect(x + 3, y + 26, 18, 8);
      // price buttons
      g.fillStyle = '#22d06a';
      g.fillRect(x + 2, y + 64, 20, 5);
    }
  }
  // lower panel
  g.fillStyle = theme ? '#b72c2c' : '#dfe6ee';
  g.fillRect(0, 330, 256, 182);
  g.fillStyle = '#1b2533';
  rr(g, 150, 344, 80, 44, 6);
  g.fill();
  txt(g, '¥130', 190, 366, 26, '#ff5a3c');
  g.fillStyle = '#3a4656';
  rr(g, 24, 344, 100, 30, 6);
  g.fill();
  txt(g, theme ? 'つめた〜い' : 'あったか〜い', 74, 360, 18, theme ? '#7fd3ff' : '#ff8a5c', { maxW: 92 });
  g.fillStyle = '#121a26';
  rr(g, 30, 420, 196, 64, 8);
  g.fill();
  txt(g, theme ? 'COLA' : 'DRINK', 128, 405, 22, theme ? '#fff' : '#2f7de1', { weight: 900 });
  return tex(c);
}

/* ------------------------------------------------------------ signs */
export function stopSignTexture() {
  const [c, g] = canvas(256, 256);
  g.clearRect(0, 0, 256, 256);
  g.fillStyle = '#ffffff';
  g.beginPath(); g.moveTo(8, 20); g.lineTo(248, 20); g.lineTo(128, 236); g.closePath(); g.fill();
  g.fillStyle = '#d8232a';
  g.beginPath(); g.moveTo(26, 30); g.lineTo(230, 30); g.lineTo(128, 214); g.closePath(); g.fill();
  txt(g, '止まれ', 128, 86, 52, '#fff');
  return tex(c);
}
export function streetPlateTexture(text, sub) {
  const [c, g] = canvas(512, 160);
  g.fillStyle = '#1f4fa6';
  rr(g, 0, 0, 512, 160, 18);
  g.fill();
  g.strokeStyle = '#fff';
  g.lineWidth = 6;
  rr(g, 10, 10, 492, 140, 12);
  g.stroke();
  txt(g, text, 256, 66, 62, '#fff', { maxW: 460 });
  txt(g, sub, 256, 124, 30, '#dfe9ff', { weight: 600, maxW: 460 });
  return tex(c);
}
export function crossingSignTexture() {
  const [c, g] = canvas(256, 256);
  g.fillStyle = '#1f5fbf';
  g.fillRect(0, 0, 256, 256);
  g.strokeStyle = '#fff';
  g.lineWidth = 8;
  g.strokeRect(12, 12, 232, 232);
  g.fillStyle = '#fff';
  g.beginPath(); g.moveTo(128, 34); g.lineTo(226, 206); g.lineTo(30, 206); g.closePath(); g.fill();
  g.fillStyle = '#1b1b1b';
  g.beginPath(); g.arc(132, 96, 12, 0, 7); g.fill();
  g.lineWidth = 9; g.strokeStyle = '#1b1b1b'; g.lineCap = 'round';
  g.beginPath(); g.moveTo(130, 112); g.lineTo(122, 150); g.lineTo(104, 182); g.moveTo(122, 150); g.lineTo(146, 182); g.moveTo(128, 124); g.lineTo(150, 140); g.moveTo(126, 122); g.lineTo(104, 140); g.stroke();
  for (let i = 0; i < 4; i++) { g.fillRect(70 + i * 32, 192, 18, 8); }
  return tex(c);
}
export function busStopTexture() {
  const [c, g] = canvas(256, 256);
  g.fillStyle = '#fff';
  g.beginPath(); g.arc(128, 128, 124, 0, 7); g.fill();
  g.fillStyle = '#e04a2a';
  g.beginPath(); g.arc(128, 128, 112, 0, 7); g.fill();
  g.fillStyle = '#fff';
  g.beginPath(); g.arc(128, 128, 84, 0, 7); g.fill();
  txt(g, 'バス', 128, 104, 46, '#e04a2a');
  txt(g, '星町二丁目', 128, 156, 26, '#333');
  return tex(c);
}

/* ------------------------------------------------------------ interior */
export function floorTexture(wm, dm) {
  const ppm = 160;
  const W = Math.round(wm * ppm), D = Math.round(dm * ppm);
  const [c, g] = canvas(W, D);
  g.fillStyle = '#f2ece0';
  g.fillRect(0, 0, W, D);
  const t = 0.4 * ppm;
  const r = rng(5);
  for (let y = 0; y < D; y += t) for (let x = 0; x < W; x += t) {
    const v = 236 + Math.floor(r() * 10);
    g.fillStyle = `rgb(${v},${v - 6},${v - 18})`;
    g.fillRect(x + 1, y + 1, t - 2, t - 2);
  }
  g.strokeStyle = 'rgba(160,150,130,0.35)';
  g.lineWidth = 2;
  for (let x = 0; x < W; x += t) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, D); g.stroke(); }
  for (let y = 0; y < D; y += t) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
  return { canvas: c, g, ppm, tex: () => tex(c) };
}
export function finishFloor(f, guides) {
  const { g, ppm } = f;
  for (const gd of guides) {
    const x = gd.x * ppm, y = gd.z * ppm;
    if (gd.type === 'foot') {
      g.save(); g.translate(x, y); g.rotate(gd.rot || 0);
      g.fillStyle = '#2f9bd6';
      g.beginPath(); g.ellipse(-9, 0, 7, 15, 0, 0, 7); g.fill();
      g.beginPath(); g.ellipse(9, -6, 7, 15, 0, 0, 7); g.fill();
      g.restore();
    } else if (gd.type === 'arrow') {
      g.save(); g.translate(x, y); g.rotate(gd.rot || 0);
      g.fillStyle = '#ff8a3d';
      g.beginPath(); g.moveTo(0, -40); g.lineTo(30, 0); g.lineTo(12, 0); g.lineTo(12, 40); g.lineTo(-12, 40); g.lineTo(-12, 0); g.lineTo(-30, 0); g.closePath(); g.fill();
      g.restore();
    } else if (gd.type === 'label') {
      g.save(); g.translate(x, y); g.rotate(gd.rot || 0);
      g.fillStyle = '#16a6a0'; rr(g, -90, -22, 180, 44, 22); g.fill();
      txt(g, gd.text, 0, 1, 26, '#fff', { maxW: 160 });
      g.restore();
    } else if (gd.type === 'line') {
      g.fillStyle = '#f2c230';
      g.fillRect(x, y, gd.w * ppm, gd.d * ppm);
    }
  }
  return f.tex();
}

export function menuBoardTexture() {
  const [c, g] = canvas(1024, 256);
  g.fillStyle = '#2b1d16';
  g.fillRect(0, 0, 1024, 256);
  g.fillStyle = '#ff8a3d';
  g.fillRect(0, 0, 1024, 54);
  txt(g, 'ホットスナック ・ HOT SNACK', 512, 28, 34, '#fff');
  const items = [['からあげ', '¥238', '#d9862e'], ['コロッケ', '¥98', '#e7b04a'], ['肉まん', '¥150', '#fff6e8'], ['アメリカンドッグ', '¥130', '#c86a2a'], ['おでん', '¥70〜', '#f3e2b8']];
  items.forEach((it, i) => {
    const x = 102 + i * 205;
    g.fillStyle = it[2];
    g.beginPath(); g.arc(x, 120, 42, 0, 7); g.fill();
    g.strokeStyle = 'rgba(0,0,0,0.25)'; g.lineWidth = 4; g.stroke();
    txt(g, it[0], x, 188, 28, '#fff3dd', { maxW: 190 });
    txt(g, it[1], x, 226, 28, '#ffcf5a');
  });
  return tex(c);
}
export function cigaretteTexture() {
  const [c, g] = canvas(512, 256);
  g.fillStyle = '#20242c';
  g.fillRect(0, 0, 512, 256);
  const r = rng(77);
  const cols = ['#ffffff', '#1d4fa0', '#c9262c', '#d8b04a', '#2e8a5a', '#8a2a8a', '#e6e6e6', '#111'];
  for (let row = 0; row < 4; row++) for (let k = 0; k < 16; k++) {
    const x = 6 + k * 31.5, y = 8 + row * 62;
    g.fillStyle = cols[Math.floor(r() * cols.length)];
    g.fillRect(x, y, 26, 44);
    g.fillStyle = 'rgba(255,255,255,0.6)';
    g.fillRect(x + 4, y + 8, 18, 6);
    g.fillStyle = '#ffd25a';
    g.fillRect(x + 2, y + 48, 22, 5);
  }
  return tex(c);
}
export function magazineTexture(i) {
  const [c, g] = canvas(128, 170);
  const r = rng(300 + i * 13);
  const pal = [['#ff6b8b', '#fff'], ['#2f7de1', '#ffe45a'], ['#ffd23a', '#e2342e'], ['#24c0a8', '#fff'], ['#ffffff', '#e2342e'], ['#a066ff', '#fff'], ['#ff9a3d', '#1c2a44'], ['#1c2a44', '#ff5a8a']];
  const [bg, fg] = pal[i % pal.length];
  g.fillStyle = bg;
  g.fillRect(0, 0, 128, 170);
  g.fillStyle = fg;
  g.fillRect(0, 0, 128, 34);
  txt(g, ['JUMP', 'WEEK', 'MANGA', 'ANIME', 'CAR', 'GOURMET', 'GAME', 'IDOL'][i % 8], 64, 18, 26, bg, { weight: 900, maxW: 120 });
  g.fillStyle = `hsl(${Math.floor(r() * 360)},60%,${60 + r() * 20}%)`;
  g.beginPath(); g.arc(64, 98, 36, 0, 7); g.fill();
  g.fillStyle = 'rgba(255,255,255,0.85)';
  g.fillRect(10, 140, 70, 10);
  g.fillRect(10, 154, 50, 8);
  return tex(c);
}
export function bentoTexture() {
  const [c, g] = canvas(256, 128);
  // 4 bento lids in a strip: each 64x128 -> used via instanced uv? we keep a single generic lid
  g.fillStyle = '#1b1b1b';
  g.fillRect(0, 0, 256, 128);
  g.fillStyle = '#fbfbf6';
  rr(g, 10, 10, 130, 108, 10); g.fill();
  g.fillStyle = '#e04a2a'; g.beginPath(); g.arc(75, 64, 9, 0, 7); g.fill();
  g.fillStyle = '#d9862e'; rr(g, 150, 12, 96, 50, 12); g.fill();
  g.fillStyle = '#5fbf4a'; rr(g, 150, 70, 44, 46, 10); g.fill();
  g.fillStyle = '#f2c230'; rr(g, 200, 70, 46, 46, 10); g.fill();
  return tex(c);
}
export function labelTexture() {
  // generic package texture: product colour stays, a white label band + small stripe
  const [c, g] = canvas(64, 128);
  g.fillStyle = '#ffffff';
  g.fillRect(0, 0, 64, 128);
  g.fillStyle = '#ffffff';
  g.fillRect(0, 0, 64, 128);
  // tint will multiply: keep top/bottom full white (=> product colour), mid band light
  g.fillStyle = '#ffffff';
  g.fillRect(0, 0, 64, 128);
  g.fillStyle = '#f7f7f7';
  g.fillRect(0, 46, 64, 36);
  g.fillStyle = 'rgba(0,0,0,0.35)';
  g.fillRect(8, 56, 48, 6);
  g.fillRect(8, 68, 32, 5);
  return tex(c);
}
export function staffDoorTexture() {
  const [c, g] = canvas(128, 256);
  g.fillStyle = '#c9ccd3';
  g.fillRect(0, 0, 128, 256);
  g.fillStyle = '#e8eaee';
  g.fillRect(28, 30, 72, 50);
  g.fillStyle = '#16a6a0';
  rr(g, 18, 100, 92, 30, 6); g.fill();
  txt(g, 'STAFF ONLY', 64, 116, 16, '#fff', { maxW: 84 });
  g.fillStyle = '#7a7e86';
  g.fillRect(96, 140, 16, 6);
  return tex(c);
}
export function atmTexture() {
  const [c, g] = canvas(128, 256);
  g.fillStyle = '#dfe5ee';
  g.fillRect(0, 0, 128, 256);
  g.fillStyle = '#1f5fbf';
  g.fillRect(0, 0, 128, 44);
  txt(g, 'ATM', 64, 23, 30, '#fff', { weight: 900 });
  g.fillStyle = '#3ad0ff';
  g.fillRect(18, 70, 92, 62);
  txt(g, 'いらっしゃいませ', 64, 100, 11, '#0b3350');
  g.fillStyle = '#9aa4b2';
  g.fillRect(24, 150, 80, 30);
  g.fillStyle = '#20262e';
  g.fillRect(30, 196, 68, 8);
  return tex(c);
}

/* ------------------------------------------------------------ neighbour */
export function shutterTexture() {
  const [c, g] = canvas(256, 256);
  g.fillStyle = '#9aa3ad';
  g.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 256; y += 10) {
    g.fillStyle = '#b6bec7';
    g.fillRect(0, y, 256, 5);
    g.fillStyle = '#7d8691';
    g.fillRect(0, y + 8, 256, 2);
  }
  g.fillStyle = 'rgba(60,40,30,0.25)';
  g.fillRect(0, 200, 256, 56);
  txt(g, '本日休業', 128, 120, 30, 'rgba(40,40,60,0.55)', { weight: 600 });
  return tex(c);
}
export function tabacoSignTexture() {
  const [c, g] = canvas(256, 96);
  g.fillStyle = '#d8232a';
  g.fillRect(0, 0, 256, 96);
  g.fillStyle = '#fff';
  g.fillRect(8, 8, 240, 80);
  txt(g, 'たばこ', 128, 50, 54, '#d8232a', { weight: 900 });
  return tex(c);
}
export function curtainTexture(hue = 30) {
  const [c, g] = canvas(128, 128);
  const grd = g.createLinearGradient(0, 0, 0, 128);
  grd.addColorStop(0, `hsl(${hue},80%,78%)`);
  grd.addColorStop(1, `hsl(${hue},70%,62%)`);
  g.fillStyle = grd;
  g.fillRect(0, 0, 128, 128);
  for (let x = 0; x < 128; x += 16) {
    g.fillStyle = 'rgba(120,60,20,0.18)';
    g.fillRect(x, 0, 6, 128);
  }
  g.fillStyle = 'rgba(60,40,30,0.35)';
  g.fillRect(84, 60, 18, 40); // potted plant silhouette
  g.beginPath(); g.arc(93, 52, 16, 0, 7); g.fill();
  return tex(c);
}
export function bulletinTexture() {
  const [c, g] = canvas(512, 320);
  g.fillStyle = '#7a5a3a';
  g.fillRect(0, 0, 512, 320);
  g.fillStyle = '#c8a878';
  g.fillRect(14, 14, 484, 292);
  const papers = [
    [30, 28, 150, 200, '#fff', '町内会', 'お知らせ', '#1f4fa6'],
    [196, 30, 130, 170, '#ffe9a8', '秋祭り', '10/26(日)', '#d8232a'],
    [340, 26, 140, 120, '#e9f4ff', '防犯', 'パトロール', '#1f6fbf'],
    [342, 158, 140, 130, '#fff', '迷い猫', 'さがしています', '#333'],
    [200, 214, 128, 80, '#d8ffd8', 'ゴミ出し', '火・金', '#2c8a3c'],
    [36, 240, 140, 56, '#ffd6e3', '献血', '', '#d9437a'],
  ];
  for (const [x, y, w, h, bg, t1, t2, fc] of papers) {
    g.fillStyle = 'rgba(0,0,0,0.2)';
    g.fillRect(x + 4, y + 4, w, h);
    g.fillStyle = bg;
    g.fillRect(x, y, w, h);
    txt(g, t1, x + w / 2, y + Math.min(32, h * 0.32), Math.min(32, h * 0.36), fc, { maxW: w - 14 });
    if (t2) txt(g, t2, x + w / 2, y + Math.min(70, h * 0.7), 20, '#444', { weight: 600, maxW: w - 14 });
    g.fillStyle = '#e04a2a';
    g.beginPath(); g.arc(x + w / 2, y + 6, 5, 0, 7); g.fill();
    if (t1 === '迷い猫') {
      g.fillStyle = '#555';
      g.beginPath(); g.arc(x + w / 2, y + 100, 18, 0, 7); g.fill();
      g.beginPath(); g.moveTo(x + w / 2 - 16, y + 90); g.lineTo(x + w / 2 - 10, y + 72); g.lineTo(x + w / 2 - 2, y + 86); g.fill();
      g.beginPath(); g.moveTo(x + w / 2 + 16, y + 90); g.lineTo(x + w / 2 + 10, y + 72); g.lineTo(x + w / 2 + 2, y + 86); g.fill();
    }
  }
  return tex(c);
}
export function plaqueTexture() {
  const [c, g] = canvas(1024, 160);
  const grd = g.createLinearGradient(0, 0, 0, 160);
  grd.addColorStop(0, '#e9c97a');
  grd.addColorStop(0.5, '#c9a052');
  grd.addColorStop(1, '#9c7634');
  g.fillStyle = grd;
  g.fillRect(0, 0, 1024, 160);
  g.strokeStyle = 'rgba(60,40,10,0.6)';
  g.lineWidth = 6;
  g.strokeRect(12, 12, 1000, 136);
  txt(g, '雨夜のコンビニ', 512, 66, 62, '#3b2a10', { font: FONT_R });
  txt(g, 'RAINY NIGHT KONBINI  —  1/80 SCALE DIORAMA', 512, 122, 26, '#4a3616', { weight: 700 });
  return tex(c);
}
export function plinthSideTexture() {
  const [c, g] = canvas(1024, 128);
  // wood grain
  g.fillStyle = '#3a2618';
  g.fillRect(0, 0, 1024, 128);
  const r = rng(9);
  for (let i = 0; i < 70; i++) {
    g.strokeStyle = `rgba(${90 + r() * 40},${55 + r() * 25},${30 + r() * 15},0.35)`;
    g.lineWidth = 1 + r() * 3;
    const y = r() * 128;
    g.beginPath();
    g.moveTo(0, y);
    for (let x = 0; x <= 1024; x += 64) g.lineTo(x, y + Math.sin(x * 0.01 + i) * 4);
    g.stroke();
  }
  return tex(c, { repeat: true });
}
export function strataTexture() {
  // cross section of the base: asphalt / gravel / soil
  const [c, g] = canvas(1024, 128);
  g.fillStyle = '#2a2a33';
  g.fillRect(0, 0, 1024, 20);
  g.fillStyle = '#6b6560';
  g.fillRect(0, 20, 1024, 26);
  g.fillStyle = '#4a3a2e';
  g.fillRect(0, 46, 1024, 82);
  const r = rng(21);
  for (let i = 0; i < 600; i++) {
    const y = 20 + r() * 108;
    g.fillStyle = y < 46 ? `rgba(200,195,185,${0.2 + r() * 0.3})` : `rgba(30,20,14,${0.2 + r() * 0.3})`;
    g.beginPath(); g.arc(r() * 1024, y, 1 + r() * 3, 0, 7); g.fill();
  }
  return tex(c, { repeat: true });
}
export function concreteTexture(seed = 1, base = '#9b9a97') {
  const [c, g] = canvas(256, 256);
  g.fillStyle = base;
  g.fillRect(0, 0, 256, 256);
  const r = rng(seed);
  for (let i = 0; i < 900; i++) {
    g.fillStyle = `rgba(${r() < 0.5 ? 255 : 0},${r() < 0.5 ? 255 : 0},${r() < 0.5 ? 255 : 0},0.04)`;
    g.fillRect(r() * 256, r() * 256, 2 + r() * 6, 2 + r() * 6);
  }
  return tex(c, { repeat: true });
}
export function blockWallTexture() {
  const [c, g] = canvas(256, 128);
  g.fillStyle = '#a7a39c';
  g.fillRect(0, 0, 256, 128);
  g.strokeStyle = '#7f7b74';
  g.lineWidth = 3;
  for (let y = 0; y <= 128; y += 32) { g.beginPath(); g.moveTo(0, y); g.lineTo(256, y); g.stroke(); }
  for (let row = 0; row < 4; row++) for (let x = (row % 2) * 32; x <= 256; x += 64) { g.beginPath(); g.moveTo(x, row * 32); g.lineTo(x, row * 32 + 32); g.stroke(); }
  g.fillStyle = 'rgba(40,60,40,0.25)';
  g.fillRect(0, 108, 256, 20);
  return tex(c, { repeat: true });
}
export function sidingTexture(col = '#c9b8a0') {
  const [c, g] = canvas(256, 256);
  g.fillStyle = col;
  g.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 256; y += 16) {
    g.fillStyle = 'rgba(0,0,0,0.12)';
    g.fillRect(0, y + 13, 256, 3);
    g.fillStyle = 'rgba(255,255,255,0.12)';
    g.fillRect(0, y, 256, 2);
  }
  // rain streak stains
  const r = rng(4);
  for (let i = 0; i < 18; i++) {
    const x = r() * 256;
    const grd = g.createLinearGradient(0, 0, 0, 256);
    grd.addColorStop(0, 'rgba(40,40,50,0.18)');
    grd.addColorStop(1, 'rgba(40,40,50,0)');
    g.fillStyle = grd;
    g.fillRect(x, 0, 2 + r() * 4, 80 + r() * 170);
  }
  return tex(c, { repeat: true });
}
export function skyTexture() {
  const [c, g] = canvas(16, 512);
  const grd = g.createLinearGradient(0, 0, 0, 512);
  grd.addColorStop(0, '#0b1020');
  grd.addColorStop(0.55, '#1a2140');
  grd.addColorStop(1, '#2b2a4a');
  g.fillStyle = grd;
  g.fillRect(0, 0, 16, 512);
  const t = tex(c);
  return t;
}
export function noboriTexture(text, bg, fg) {
  const [c, g] = canvas(96, 384);
  g.fillStyle = bg;
  g.fillRect(0, 0, 96, 384);
  g.fillStyle = fg;
  g.fillRect(0, 0, 96, 22);
  g.fillRect(0, 362, 96, 22);
  const chars = [...text];
  const step = 320 / chars.length;
  chars.forEach((ch, i) => txt(g, ch, 48, 50 + i * step + step / 2 - 16, Math.min(70, step * 0.9), fg));
  return tex(c);
}
