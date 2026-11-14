import * as THREE from 'three';

const JP = '"Yu Gothic","Hiragino Kaku Gothic ProN","Meiryo","Noto Sans JP",sans-serif';
const LAT = '"Trebuchet MS","Segoe UI",sans-serif';

let MAX_ANISO = 8;
export function setAniso(a) { MAX_ANISO = a; }

function mk(w, h, draw, o = {}) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  g.imageSmoothingEnabled = true;
  draw(g, w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = o.linear ? THREE.NoColorSpace : THREE.SRGBColorSpace;
  t.anisotropy = MAX_ANISO;
  if (o.repeat) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(o.repeat[0], o.repeat[1]);
  } else {
    t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  }
  t.needsUpdate = true;
  return t;
}

function rr(g, x, y, w, h, r) {
  const rad = Math.min(r, w / 2, h / 2);
  g.beginPath();
  g.moveTo(x + rad, y);
  g.arcTo(x + w, y, x + w, y + h, rad);
  g.arcTo(x + w, y + h, x, y + h, rad);
  g.arcTo(x, y + h, x, y, rad);
  g.arcTo(x, y, x + w, y, rad);
  g.closePath();
}
function fillRR(g, x, y, w, h, r, col) { rr(g, x, y, w, h, r); g.fillStyle = col; g.fill(); }
function txt(g, s, x, y, size, col, o = {}) {
  g.font = `${o.weight || 'bold'} ${size}px ${o.lat ? LAT : JP}`;
  g.fillStyle = col;
  g.textAlign = o.align || 'center';
  g.textBaseline = o.base || 'middle';
  if (o.stroke) { g.lineWidth = o.stroke; g.strokeStyle = o.strokeCol || '#ffffff'; g.strokeText(s, x, y); }
  g.fillText(s, x, y);
}
function lg(g, x0, y0, x1, y1, stops) {
  const gr = g.createLinearGradient(x0, y0, x1, y1);
  stops.forEach(s => gr.addColorStop(s[0], s[1]));
  return gr;
}
function speckle(g, w, h, n, col, a, size = 2) {
  g.save(); g.globalAlpha = a; g.fillStyle = col;
  for (let i = 0; i < n; i++) {
    const x = Math.random() * w, y = Math.random() * h;
    g.fillRect(x, y, size * (0.5 + Math.random()), size * (0.5 + Math.random()));
  }
  g.restore();
}
function fakeLines(g, x, y, w, n, lh, col, a = 0.55) {
  g.save(); g.globalAlpha = a; g.fillStyle = col;
  for (let i = 0; i < n; i++) {
    const ww = w * (0.45 + Math.random() * 0.55);
    g.fillRect(x, y + i * lh, ww, Math.max(1, lh * 0.42));
  }
  g.restore();
}

/* =================================================================== */
export function buildTextures() {
  const T = {};

  /* ---- sidewalk concrete tiles (world-space UV in shader) ---- */
  T.tile = mk(512, 512, (g, w, h) => {
    g.fillStyle = '#5a6478'; g.fillRect(0, 0, w, h);
    const n = 4, s = w / n;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      const v = 0.9 + Math.random() * 0.2;
      const c = Math.round(90 * v), d = Math.round(100 * v), e = Math.round(120 * v);
      g.fillStyle = `rgb(${c},${d},${e})`;
      g.fillRect(i * s + 2, j * s + 2, s - 4, s - 4);
      g.fillStyle = 'rgba(255,255,255,0.05)';
      g.fillRect(i * s + 2, j * s + 2, s - 4, 3);
    }
    speckle(g, w, h, 2600, '#2c3446', 0.25, 2);
    speckle(g, w, h, 900, '#8b96ac', 0.18, 2);
    g.strokeStyle = 'rgba(20,26,40,0.55)'; g.lineWidth = 3;
    for (let i = 0; i <= n; i++) {
      g.beginPath(); g.moveTo(i * s, 0); g.lineTo(i * s, h); g.stroke();
      g.beginPath(); g.moveTo(0, i * s); g.lineTo(w, i * s); g.stroke();
    }
  }, { repeat: [1, 1] });

  /* ---- drain grating ---- */
  T.grate = mk(256, 256, (g, w, h) => {
    g.fillStyle = '#2a3145'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#0d1119';
    for (let i = 0; i < 8; i++) g.fillRect(10, 12 + i * 30, w - 20, 16);
    g.fillStyle = 'rgba(150,170,200,0.22)';
    for (let i = 0; i < 8; i++) g.fillRect(10, 12 + i * 30, w - 20, 3);
  }, { repeat: [1, 1] });

  /* ---- interior floor ---- */
  T.intFloor = mk(512, 512, (g, w, h) => {
    g.fillStyle = '#f0e6d0'; g.fillRect(0, 0, w, h);
    const n = 4, s = w / n;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      g.fillStyle = (i + j) % 2 ? '#f5ecd9' : '#ece1c9';
      g.fillRect(i * s, j * s, s, s);
    }
    g.strokeStyle = 'rgba(180,164,132,0.5)'; g.lineWidth = 2;
    for (let i = 0; i <= n; i++) {
      g.beginPath(); g.moveTo(i * s, 0); g.lineTo(i * s, h); g.stroke();
      g.beginPath(); g.moveTo(0, i * s); g.lineTo(w, i * s); g.stroke();
    }
    speckle(g, w, h, 1400, '#d8c9a8', 0.3, 2);
  }, { repeat: [1, 1] });

  /* ---- snack package (tinted per-instance) ---- */
  T.pkg = mk(256, 256, (g, w, h) => {
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(0,0,0,0.16)'; g.fillRect(0, 0, w, 26);
    g.fillStyle = 'rgba(255,255,255,0.95)'; g.fillRect(0, 30, w, 8);
    g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(0, h - 34, w, 34);
    g.beginPath(); g.ellipse(w / 2, h * 0.46, w * 0.36, h * 0.19, 0, 0, 7); g.fillStyle = '#ffffff'; g.fill();
    g.strokeStyle = 'rgba(0,0,0,0.25)'; g.lineWidth = 5; g.stroke();
    fakeLines(g, w * 0.24, h * 0.40, w * 0.52, 3, 16, '#3a3a3a', 0.7);
    fakeLines(g, w * 0.16, h * 0.72, w * 0.68, 2, 13, '#ffffff', 0.8);
    g.fillStyle = 'rgba(255,255,255,0.5)'; g.fillRect(w * 0.06, h * 0.1, w * 0.1, h * 0.8);
  });

  /* ---- bottle / can label ---- */
  T.bottle = mk(128, 256, (g, w, h) => {
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(255,255,255,0.98)'; g.fillRect(0, h * 0.34, w, h * 0.34);
    g.fillStyle = 'rgba(0,0,0,0.22)'; g.fillRect(0, h * 0.34, w, 5);
    g.fillStyle = 'rgba(0,0,0,0.22)'; g.fillRect(0, h * 0.68 - 5, w, 5);
    fakeLines(g, w * 0.16, h * 0.42, w * 0.68, 3, 15, '#2b2b2b', 0.75);
    g.fillStyle = 'rgba(0,0,0,0.18)'; g.fillRect(0, h * 0.06, w, 8);
    g.fillStyle = 'rgba(255,255,255,0.45)'; g.fillRect(w * 0.12, 0, w * 0.12, h);
  });

  /* ---- magazine cover ---- */
  T.mag = mk(256, 344, (g, w, h) => {
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(0,0,0,0.2)'; g.fillRect(0, 0, w, h * 0.15);
    txt(g, 'WEEKLY', w / 2, h * 0.08, 34, '#ffffff', { lat: true });
    g.beginPath(); g.arc(w * 0.5, h * 0.45, w * 0.3, 0, 7);
    g.fillStyle = 'rgba(255,255,255,0.85)'; g.fill();
    g.fillStyle = 'rgba(0,0,0,0.18)';
    g.beginPath(); g.arc(w * 0.5, h * 0.45, w * 0.2, 0, 7); g.fill();
    fakeLines(g, w * 0.1, h * 0.68, w * 0.8, 5, 18, '#1e1e1e', 0.6);
    g.fillStyle = '#1a1a1a';
    for (let i = 0; i < 14; i++) g.fillRect(w * 0.62 + i * 5, h * 0.9, 2 + (i % 3), 22);
  });

  /* ---- main store sign band ---- */
  const drawSign = (g, w, h, side) => {
    g.fillStyle = '#e6e4dc'; g.fillRect(0, 0, w, h);
    const s = h * 0.13;
    g.fillStyle = '#12a86a'; g.fillRect(0, 0, w, s);
    g.fillStyle = '#ff8a3d'; g.fillRect(0, s, w, s * 0.42);
    g.fillStyle = '#38c9ff'; g.fillRect(0, s * 1.42, w, s * 0.26);
    g.fillStyle = '#12a86a'; g.fillRect(0, h - s, w, s);
    g.fillStyle = '#ff8a3d'; g.fillRect(0, h - s * 1.42, w, s * 0.42);
    g.fillStyle = '#38c9ff'; g.fillRect(0, h - s * 1.68, w, s * 0.26);
    const cy = h * 0.5;
    // star logo
    const lx = side ? w * 0.1 : w * 0.09, r = h * 0.24;
    g.save(); g.translate(lx, cy);
    g.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + i * Math.PI / 5, rr2 = i % 2 ? r * 0.44 : r;
      g[i ? 'lineTo' : 'moveTo'](Math.cos(a) * rr2, Math.sin(a) * rr2);
    }
    g.closePath(); g.fillStyle = '#ff8a3d'; g.fill();
    g.lineWidth = h * 0.03; g.strokeStyle = '#12a86a'; g.stroke();
    g.restore();
    const nameSize = h * 0.40;
    txt(g, 'ホシノマート', side ? w * 0.42 : w * 0.40, cy - h * 0.02, nameSize, '#0f9b62', { stroke: h * 0.02, strokeCol: '#ffffff' });
    txt(g, 'HOSHINO  MART', side ? w * 0.42 : w * 0.40, cy + h * 0.24, h * 0.15, '#7c8798', { lat: true });
    // 24h pill
    const px = w * 0.80, pw = w * 0.155, ph = h * 0.42;
    fillRR(g, px - pw / 2, cy - ph / 2, pw, ph, ph * 0.3, '#12a86a');
    txt(g, '24時間', px, cy - ph * 0.16, h * 0.19, '#ffffff');
    txt(g, 'OPEN', px, cy + ph * 0.22, h * 0.15, '#d8ffe9', { lat: true });
    speckle(g, w, h, 400, '#c9c4b6', 0.12, 2);
  };
  T.sign = mk(2048, 200, (g, w, h) => drawSign(g, w, h, false));
  T.signSide = mk(1536, 200, (g, w, h) => drawSign(g, w, h, true));

  T.signSmall = mk(512, 256, (g, w, h) => {
    g.fillStyle = '#e6e4dc'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#12a86a'; g.fillRect(0, 0, w, 18); g.fillRect(0, h - 18, w, 18);
    txt(g, '営業中', w / 2, h * 0.38, 84, '#e8402f');
    txt(g, '24 HOURS', w / 2, h * 0.72, 44, '#0f9b62', { lat: true });
  });

  T.stripe = mk(512, 64, (g, w, h) => {
    g.fillStyle = '#e6e4dc'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#12a86a'; g.fillRect(0, 0, w, h * 0.42);
    g.fillStyle = '#ff8a3d'; g.fillRect(0, h * 0.42, w, h * 0.26);
    g.fillStyle = '#38c9ff'; g.fillRect(0, h * 0.68, w, h * 0.14);
  }, { repeat: [1, 1] });

  /* ---- vending machine front ---- */
  const drinkNames = ['お〜いお茶', 'コーヒー', '天然水', 'ソーダ', 'オレンジ', 'エナジー', 'ミルクティー', 'コーラ', 'スポーツ', 'カフェラテ', 'ぶどう', 'レモン'];
  const drinkCols = ['#3f9b52', '#7b4a2a', '#4fb6e8', '#7fd8ff', '#ff9a2e', '#c8e04a', '#d8a86a', '#c0392b', '#4fd8c0', '#c9a27a', '#9b59b6', '#f2d24b'];
  const drawVend = (g, w, h, theme) => {
    const bg = theme === 2 ? '#f2f4f8' : '#e9edf3';
    g.fillStyle = bg; g.fillRect(0, 0, w, h);
    // header light box
    const hh = h * 0.11;
    g.fillStyle = lg(g, 0, 0, 0, hh, [[0, theme === 2 ? '#ff5a4a' : '#1f9be0'], [1, theme === 2 ? '#c8202f' : '#0d5f96']]);
    g.fillRect(0, 0, w, hh);
    txt(g, theme === 2 ? 'あたたかい・つめたい' : 'DRINK  STATION', w / 2, hh * 0.42, h * 0.036, '#ffffff', { lat: theme !== 2 });
    txt(g, theme === 2 ? 'HOT & COLD' : 'つめた〜い', w / 2, hh * 0.78, h * 0.028, 'rgba(255,255,255,0.85)', { lat: theme === 2 });
    // display window
    const dx = w * 0.06, dy = hh + h * 0.02, dw = w * 0.88, dh = h * 0.52;
    g.fillStyle = '#0e1622'; g.fillRect(dx - 8, dy - 8, dw + 16, dh + 16);
    g.fillStyle = lg(g, 0, dy, 0, dy + dh, [[0, '#20303f'], [0.5, '#16222f'], [1, '#0d151f']]);
    g.fillRect(dx, dy, dw, dh);
    const cols = 5, rows = 3;
    const cw = dw / cols, ch = dh / rows;
    for (let r = 0; r < rows; r++) {
      // shelf light strip
      g.fillStyle = 'rgba(190,230,255,0.5)';
      g.fillRect(dx, dy + r * ch, dw, 4);
      for (let c = 0; c < cols; c++) {
        const i = (r * cols + c) % drinkNames.length;
        const cx = dx + c * cw + cw / 2, cy = dy + r * ch + ch * 0.40;
        const isCan = (r + c) % 2 === 0;
        const bw = cw * 0.40, bh = ch * 0.50;
        g.save();
        g.shadowColor = 'rgba(140,200,255,0.5)'; g.shadowBlur = 14;
        if (isCan) {
          fillRR(g, cx - bw / 2, cy - bh / 2, bw, bh, bw * 0.16, drinkCols[i]);
          g.fillStyle = 'rgba(255,255,255,0.9)'; g.fillRect(cx - bw / 2, cy - bh * 0.1, bw, bh * 0.2);
          g.fillStyle = 'rgba(220,230,240,0.95)'; fillRR(g, cx - bw / 2, cy - bh / 2, bw, bh * 0.1, 3, '#cfd8e2');
          g.fillStyle = 'rgba(255,255,255,0.28)'; g.fillRect(cx - bw * 0.36, cy - bh * 0.42, bw * 0.14, bh * 0.84);
        } else {
          g.fillStyle = drinkCols[i];
          rr(g, cx - bw / 2, cy - bh * 0.3, bw, bh * 0.8, bw * 0.2); g.fill();
          g.fillRect(cx - bw * 0.17, cy - bh * 0.52, bw * 0.34, bh * 0.24);
          fillRR(g, cx - bw * 0.2, cy - bh * 0.60, bw * 0.4, bh * 0.1, 3, '#e8eef5');
          g.fillStyle = 'rgba(255,255,255,0.92)'; g.fillRect(cx - bw / 2, cy - bh * 0.06, bw, bh * 0.26);
          g.fillStyle = 'rgba(255,255,255,0.25)'; g.fillRect(cx - bw * 0.34, cy - bh * 0.26, bw * 0.12, bh * 0.72);
        }
        g.restore();
        // price card
        const py = dy + r * ch + ch * 0.74;
        fillRR(g, cx - cw * 0.42, py, cw * 0.84, ch * 0.20, 4, '#f4f7fb');
        txt(g, '¥' + (110 + ((i * 17) % 8) * 10), cx, py + ch * 0.062, ch * 0.075, '#16202c', { lat: true });
        const hot = theme === 2 && r === 0;
        fillRR(g, cx - cw * 0.42, py + ch * 0.115, cw * 0.84, ch * 0.075, 3, hot ? '#e8402f' : '#2f9fe0');
        txt(g, hot ? 'あたたかい' : 'つめたい', cx, py + ch * 0.152, ch * 0.052, '#ffffff');
      }
    }
    // glass sheen
    g.save(); g.globalAlpha = 0.10; g.fillStyle = '#ffffff';
    g.beginPath(); g.moveTo(dx, dy + dh * 0.55); g.lineTo(dx + dw * 0.5, dy); g.lineTo(dx + dw * 0.72, dy); g.lineTo(dx, dy + dh * 0.9); g.closePath(); g.fill();
    g.restore();
    // operation panel
    const oy = dy + dh + h * 0.03;
    g.fillStyle = '#dfe4ec'; g.fillRect(dx, oy, dw, h * 0.10);
    fillRR(g, dx + dw * 0.04, oy + h * 0.018, dw * 0.30, h * 0.062, 6, '#101820');
    txt(g, '130', dx + dw * 0.19, oy + h * 0.049, h * 0.036, '#ff5a4a', { lat: true });
    fillRR(g, dx + dw * 0.40, oy + h * 0.018, dw * 0.22, h * 0.062, 6, '#2b3444');
    txt(g, 'IC', dx + dw * 0.51, oy + h * 0.049, h * 0.030, '#7fe0ff', { lat: true });
    g.fillStyle = '#8d97a8'; g.fillRect(dx + dw * 0.68, oy + h * 0.022, dw * 0.06, h * 0.054);
    g.fillStyle = '#39424f'; g.fillRect(dx + dw * 0.70, oy + h * 0.030, dw * 0.02, h * 0.038);
    g.fillStyle = '#c8ced8';
    g.beginPath(); g.arc(dx + dw * 0.86, oy + h * 0.049, h * 0.026, 0, 7); g.fill();
    g.fillStyle = '#5b6472';
    g.beginPath(); g.arc(dx + dw * 0.86, oy + h * 0.049, h * 0.014, 0, 7); g.fill();
    // dispensing bin
    const by = oy + h * 0.13;
    fillRR(g, dx + dw * 0.06, by, dw * 0.62, h * 0.13, 8, '#161d28');
    g.fillStyle = 'rgba(120,160,200,0.18)'; g.fillRect(dx + dw * 0.08, by + h * 0.012, dw * 0.58, h * 0.02);
    txt(g, '商品取出口', dx + dw * 0.37, by + h * 0.085, h * 0.030, 'rgba(190,210,235,0.55)');
    fillRR(g, dx + dw * 0.74, by, dw * 0.20, h * 0.13, 6, '#cfd6e0');
    txt(g, 'お釣り', dx + dw * 0.84, by + h * 0.04, h * 0.026, '#4a5462');
    g.fillStyle = '#2b3444'; g.fillRect(dx + dw * 0.78, by + h * 0.07, dw * 0.12, h * 0.035);
    // footer
    g.fillStyle = theme === 2 ? '#c8202f' : '#0d5f96';
    g.fillRect(0, h * 0.955, w, h * 0.045);
    speckle(g, w, h, 500, '#9aa4b2', 0.10, 2);
  };
  T.vend = mk(768, 1400, (g, w, h) => drawVend(g, w, h, 1));
  T.vend2 = mk(768, 1400, (g, w, h) => drawVend(g, w, h, 2));

  T.vendTop = mk(512, 128, (g, w, h) => {
    g.fillStyle = lg(g, 0, 0, 0, h, [[0, '#ffffff'], [1, '#cfe6ff']]);
    g.fillRect(0, 0, w, h);
    txt(g, 'ドリンク', w * 0.32, h * 0.5, h * 0.5, '#0d5f96');
    txt(g, '110円〜', w * 0.74, h * 0.5, h * 0.4, '#e8402f');
  });

  /* ---- posters ---- */
  T.posterA = mk(512, 724, (g, w, h) => {
    g.fillStyle = '#fdf3e2'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#e8402f'; g.fillRect(0, 0, w, h * 0.20);
    txt(g, '新発売', w / 2, h * 0.10, 96, '#ffffff');
    g.fillStyle = '#ffb020';
    g.beginPath(); g.arc(w / 2, h * 0.46, w * 0.30, 0, 7); g.fill();
    fillRR(g, w * 0.24, h * 0.38, w * 0.52, h * 0.17, 14, '#3a2a1c');
    fillRR(g, w * 0.27, h * 0.40, w * 0.20, h * 0.13, 8, '#f5f0e2');
    fillRR(g, w * 0.50, h * 0.40, w * 0.23, h * 0.06, 6, '#e8703c');
    fillRR(g, w * 0.50, h * 0.47, w * 0.23, h * 0.06, 6, '#7fbf4a');
    txt(g, 'こだわり弁当', w / 2, h * 0.68, 62, '#2b2118');
    txt(g, '¥ 598', w / 2, h * 0.79, 88, '#e8402f', { lat: true });
    g.fillStyle = '#12a86a'; g.fillRect(0, h * 0.88, w, h * 0.12);
    txt(g, 'ホシノマート', w / 2, h * 0.94, 44, '#ffffff');
  });
  T.posterB = mk(512, 724, (g, w, h) => {
    g.fillStyle = '#2b1d14'; g.fillRect(0, 0, w, h);
    g.fillStyle = lg(g, 0, 0, 0, h, [[0, '#4a3020'], [1, '#1c120c']]); g.fillRect(0, 0, w, h);
    txt(g, 'MACHI CAFÉ', w / 2, h * 0.13, 60, '#ffcf8f', { lat: true });
    g.fillStyle = '#f2e6d2';
    rr(g, w * 0.30, h * 0.30, w * 0.40, h * 0.26, 12); g.fill();
    g.fillStyle = '#6b4326';
    rr(g, w * 0.33, h * 0.33, w * 0.34, h * 0.10, 8); g.fill();
    g.strokeStyle = '#f2e6d2'; g.lineWidth = 14;
    g.beginPath(); g.arc(w * 0.74, h * 0.42, w * 0.09, -1.2, 1.2); g.stroke();
    g.strokeStyle = 'rgba(255,220,180,0.5)'; g.lineWidth = 8;
    for (let i = 0; i < 3; i++) {
      g.beginPath();
      g.moveTo(w * (0.40 + i * 0.10), h * 0.28);
      g.quadraticCurveTo(w * (0.44 + i * 0.10), h * 0.22, w * (0.38 + i * 0.10), h * 0.17);
      g.stroke();
    }
    txt(g, '淹れたてコーヒー', w / 2, h * 0.66, 52, '#ffe0b0');
    fillRR(g, w * 0.18, h * 0.74, w * 0.64, h * 0.10, 10, '#e8402f');
    txt(g, 'Sサイズ 100円', w / 2, h * 0.79, 46, '#ffffff');
    txt(g, '店内のコーヒーメーカーでどうぞ', w / 2, h * 0.91, 30, 'rgba(255,225,190,0.7)');
  });
  T.posterC = mk(512, 724, (g, w, h) => {
    g.fillStyle = '#eef4fb'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#1a5fa8'; g.fillRect(0, 0, w, h * 0.16);
    txt(g, 'お知らせ', w / 2, h * 0.08, 72, '#ffffff');
    g.fillStyle = '#1a5fa8';
    g.beginPath(); g.arc(w / 2, h * 0.36, w * 0.17, 0, 7); g.fill();
    g.fillStyle = '#eef4fb';
    g.beginPath(); g.arc(w / 2, h * 0.34, w * 0.07, 0, 7); g.fill();
    rr(g, w * 0.40, h * 0.40, w * 0.20, h * 0.08, 8); g.fill();
    txt(g, '防犯カメラ作動中', w / 2, h * 0.58, 50, '#12325c');
    fakeLines(g, w * 0.12, h * 0.66, w * 0.76, 6, 26, '#5a7ba8', 0.6);
    g.fillStyle = '#e8402f'; g.fillRect(w * 0.12, h * 0.88, w * 0.76, 6);
    txt(g, '地域安全協力店', w / 2, h * 0.94, 38, '#1a5fa8');
  });
  T.posterD = mk(512, 724, (g, w, h) => {
    g.fillStyle = lg(g, 0, 0, 0, h, [[0, '#2a1a4a'], [0.6, '#5a2a6a'], [1, '#8a2a5a']]);
    g.fillRect(0, 0, w, h);
    for (let i = 0; i < 5; i++) {
      const cx = w * (0.18 + Math.random() * 0.64), cy = h * (0.12 + Math.random() * 0.34);
      const col = ['#ff4d8d', '#ffb020', '#7fe0ff', '#9dff8a', '#ffffff'][i];
      g.strokeStyle = col; g.lineWidth = 3;
      for (let k = 0; k < 14; k++) {
        const a = k / 14 * Math.PI * 2, r0 = 12, r1 = 40 + Math.random() * 26;
        g.beginPath();
        g.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0);
        g.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
        g.stroke();
      }
    }
    txt(g, '夏祭り', w / 2, h * 0.60, 110, '#ffe9a8', { stroke: 8, strokeCol: '#ff4d8d' });
    txt(g, '8月15日  18:00〜', w / 2, h * 0.72, 44, '#ffffff');
    fillRR(g, w * 0.16, h * 0.80, w * 0.68, h * 0.09, 10, 'rgba(255,255,255,0.16)');
    txt(g, '商店街 中央広場', w / 2, h * 0.845, 40, '#ffd9f0');
    txt(g, '雨天決行', w / 2, h * 0.94, 34, 'rgba(255,255,255,0.7)');
  });

  T.noren = mk(512, 256, (g, w, h) => {
    g.fillStyle = '#123a6b'; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(255,255,255,0.06)';
    for (let i = 0; i < 6; i++) g.fillRect(i * w / 6, 0, 3, h);
    txt(g, 'ホシノ', w * 0.28, h * 0.45, 84, '#f4f7fb');
    txt(g, 'マート', w * 0.72, h * 0.45, 84, '#f4f7fb');
    g.fillStyle = '#ff8a3d'; g.fillRect(0, h - 16, w, 16);
  });

  T.menu = mk(1024, 384, (g, w, h) => {
    g.fillStyle = '#1d2430'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#f6f2e6'; g.fillRect(8, 8, w - 16, h - 16);
    const items = [['アメリカンドッグ', '150'], ['からあげクン', '238'], ['肉まん', '180'], ['おでん', '110']];
    const cw = (w - 16) / 4;
    items.forEach((it, i) => {
      const x = 8 + i * cw;
      g.fillStyle = i % 2 ? '#fdf6e6' : '#f3ece0'; g.fillRect(x, 8, cw, h - 16);
      g.fillStyle = ['#e8a33c', '#d8863c', '#f0d8a8', '#c88a4a'][i];
      g.beginPath(); g.arc(x + cw / 2, h * 0.36, h * 0.20, 0, 7); g.fill();
      g.fillStyle = 'rgba(255,255,255,0.35)';
      g.beginPath(); g.arc(x + cw * 0.44, h * 0.30, h * 0.07, 0, 7); g.fill();
      txt(g, it[0], x + cw / 2, h * 0.68, 34, '#2b2118');
      txt(g, '¥' + it[1], x + cw / 2, h * 0.84, 44, '#e8402f', { lat: true });
    });
    g.fillStyle = '#e8402f'; g.fillRect(8, 8, w - 16, 10);
  });

  T.roadSign = mk(512, 256, (g, w, h) => {
    g.fillStyle = '#1a5fa8'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#ffffff'; g.lineWidth = 10; g.strokeRect(14, 14, w - 28, h - 28);
    txt(g, '桜町 3', w * 0.42, h * 0.36, 74, '#ffffff');
    txt(g, 'Sakuracho', w * 0.42, h * 0.68, 40, 'rgba(255,255,255,0.85)', { lat: true });
    g.fillStyle = '#ffffff';
    g.beginPath();
    g.moveTo(w * 0.80, h * 0.28); g.lineTo(w * 0.93, h * 0.5); g.lineTo(w * 0.80, h * 0.72);
    g.closePath(); g.fill();
  });

  T.stopSign = mk(256, 256, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    g.fillStyle = '#d8342a';
    g.beginPath();
    g.moveTo(w * 0.5, h * 0.06); g.lineTo(w * 0.96, h * 0.88); g.lineTo(w * 0.04, h * 0.88);
    g.closePath(); g.fill();
    g.strokeStyle = '#ffffff'; g.lineWidth = 8; g.stroke();
    txt(g, '止まれ', w * 0.5, h * 0.62, 52, '#ffffff');
  });

  T.bulletin = mk(512, 384, (g, w, h) => {
    g.fillStyle = '#8a6a44'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#2c3a2e'; g.fillRect(14, 14, w - 28, h - 28);
    const cols = ['#f4f1e4', '#ffe9c8', '#e8f0fb', '#f8e0e8'];
    for (let i = 0; i < 4; i++) {
      const x = 30 + (i % 2) * 232, y = 30 + Math.floor(i / 2) * 168;
      g.save(); g.translate(x + 100, y + 74); g.rotate((Math.random() - 0.5) * 0.07);
      g.fillStyle = cols[i]; g.fillRect(-100, -74, 200, 148);
      g.fillStyle = ['#c8402f', '#2f7fc8', '#3a9b5a', '#a8408f'][i];
      g.fillRect(-100, -74, 200, 26);
      fakeLines(g, -84, -34, 168, 6, 18, '#4a4a4a', 0.55);
      g.restore();
      g.fillStyle = '#e8402f';
      g.beginPath(); g.arc(x + 100, y + 8, 6, 0, 7); g.fill();
    }
    txt(g, '町内掲示板', w / 2, h - 8, 22, 'rgba(255,255,255,0.5)');
  });

  T.binLabel = mk(256, 256, (g, w, h) => {
    g.fillStyle = '#f2f5f9'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#1a5fa8'; g.fillRect(0, 0, w, h * 0.22);
    txt(g, 'カン・ビン', w / 2, h * 0.11, 44, '#ffffff');
    g.strokeStyle = '#1a5fa8'; g.lineWidth = 10;
    g.beginPath(); g.arc(w * 0.34, h * 0.55, w * 0.14, 0, 7); g.stroke();
    g.strokeRect(w * 0.56, h * 0.42, w * 0.20, h * 0.28);
    txt(g, 'PET', w * 0.5, h * 0.86, 46, '#1a5fa8', { lat: true });
  });

  T.atm = mk(256, 384, (g, w, h) => {
    g.fillStyle = '#1a2230'; g.fillRect(0, 0, w, h);
    fillRR(g, 16, 16, w - 32, h * 0.44, 8, '#0d3b5c');
    txt(g, 'ATM', w / 2, h * 0.13, 44, '#7fe0ff', { lat: true });
    txt(g, 'ご利用いただけます', w / 2, h * 0.26, 22, '#cfe8ff');
    txt(g, '7:00 - 23:00', w / 2, h * 0.36, 24, '#ffffff', { lat: true });
    g.fillStyle = '#39424f';
    for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) {
      fillRR(g, 40 + c * 60, h * 0.52 + r * 40, 48, 30, 4, '#5b6472');
    }
    g.fillStyle = '#2b3444'; g.fillRect(30, h * 0.90, w - 60, 18);
  });

  T.pos = mk(256, 192, (g, w, h) => {
    g.fillStyle = '#0d2233'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#12405f'; g.fillRect(0, 0, w, 30);
    txt(g, 'レジ 01', 60, 15, 20, '#cfe8ff');
    const rows = [['おにぎり', '128'], ['お茶 500', '110'], ['弁当', '598']];
    rows.forEach((r, i) => {
      txt(g, r[0], 70, 55 + i * 28, 19, '#dff0ff', { align: 'center' });
      txt(g, r[1], 200, 55 + i * 28, 19, '#ffffff', { lat: true, align: 'center' });
    });
    g.fillStyle = '#e8402f'; g.fillRect(10, h - 46, w - 20, 36);
    txt(g, '合計  ¥836', w / 2, h - 28, 26, '#ffffff');
  });

  T.coffee = mk(256, 384, (g, w, h) => {
    g.fillStyle = '#2b3038'; g.fillRect(0, 0, w, h);
    fillRR(g, 14, 14, w - 28, h * 0.30, 8, '#101820');
    txt(g, 'MACHI CAFÉ', w / 2, h * 0.09, 28, '#ffcf8f', { lat: true });
    txt(g, 'サイズを選んでください', w / 2, h * 0.20, 19, '#cfe0f0');
    txt(g, 'S  100円 / M  180円', w / 2, h * 0.28, 20, '#ffffff');
    const labels = [['S', '#e8a33c'], ['M', '#d8863c'], ['HOT', '#e8402f'], ['ICE', '#38a9e0']];
    labels.forEach((l, i) => {
      const x = 24 + (i % 2) * 108, y = h * 0.40 + Math.floor(i / 2) * 62;
      fillRR(g, x, y, 96, 50, 8, l[1]);
      txt(g, l[0], x + 48, y + 25, 28, '#ffffff', { lat: true });
    });
    g.fillStyle = '#161c24'; g.fillRect(30, h * 0.74, w - 60, h * 0.20);
    g.fillStyle = '#39424f'; g.fillRect(w * 0.42, h * 0.72, w * 0.16, 14);
    g.fillStyle = 'rgba(255,220,180,0.25)'; g.fillRect(40, h * 0.90, w - 80, 8);
  });

  T.grille = mk(256, 256, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    g.strokeStyle = '#8d97a8'; g.lineWidth = 7;
    for (let i = 1; i <= 5; i++) { g.beginPath(); g.arc(w / 2, h / 2, i * 22, 0, 7); g.stroke(); }
    g.lineWidth = 9;
    for (let i = 0; i < 8; i++) {
      const a = i / 8 * Math.PI * 2;
      g.beginPath(); g.moveTo(w / 2, h / 2);
      g.lineTo(w / 2 + Math.cos(a) * 118, h / 2 + Math.sin(a) * 118); g.stroke();
    }
    g.fillStyle = '#6b7484'; g.beginPath(); g.arc(w / 2, h / 2, 20, 0, 7); g.fill();
  });

  T.manhole = mk(512, 512, (g, w, h) => {
    g.fillStyle = '#39414f'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#2c3340';
    g.beginPath(); g.arc(w / 2, h / 2, w * 0.47, 0, 7); g.fill();
    g.strokeStyle = '#4e5768'; g.lineWidth = 6;
    for (let i = 1; i <= 6; i++) { g.beginPath(); g.arc(w / 2, h / 2, i * 34, 0, 7); g.stroke(); }
    g.strokeStyle = '#454e5e'; g.lineWidth = 10;
    for (let i = 0; i < 24; i++) {
      const a = i / 24 * Math.PI * 2;
      g.beginPath();
      g.moveTo(w / 2 + Math.cos(a) * 60, h / 2 + Math.sin(a) * 60);
      g.lineTo(w / 2 + Math.cos(a) * 232, h / 2 + Math.sin(a) * 232);
      g.stroke();
    }
    g.fillStyle = '#5b6474';
    g.beginPath(); g.arc(w / 2, h / 2, 74, 0, 7); g.fill();
    txt(g, '汚水', w / 2, h / 2, 60, '#2c3340');
    speckle(g, w, h, 1800, '#1e242e', 0.3, 3);
  });

  T.shutter = mk(128, 128, (g, w, h) => {
    g.fillStyle = '#59637a'; g.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 8) {
      g.fillStyle = '#6d7891'; g.fillRect(0, y, w, 4);
      g.fillStyle = '#3f4859'; g.fillRect(0, y + 6, w, 2);
    }
    g.fillStyle = 'rgba(30,36,48,0.35)';
    for (let i = 0; i < 26; i++) g.fillRect(Math.random() * w, Math.random() * h, 2, 6 + Math.random() * 14);
  });
  T.shutter.wrapS = T.shutter.wrapT = THREE.RepeatWrapping;

  T.guide = mk(512, 128, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    g.fillStyle = 'rgba(240,200,60,0.85)';
    g.fillRect(0, h * 0.30, w, h * 0.40);
    g.fillStyle = 'rgba(40,32,16,0.85)';
    for (let i = 0; i < 4; i++) {
      const x = 40 + i * 120;
      g.beginPath();
      g.moveTo(x, h * 0.34); g.lineTo(x + 44, h * 0.5); g.lineTo(x, h * 0.66);
      g.closePath(); g.fill();
    }
  });

  return T;
}