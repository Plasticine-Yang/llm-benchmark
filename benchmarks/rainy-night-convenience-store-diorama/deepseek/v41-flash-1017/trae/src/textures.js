import * as THREE from 'three';

const JP = '"Hiragino Sans","Hiragino Kaku Gothic ProN","Yu Gothic","Noto Sans JP",sans-serif';

function C(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

export function canvasTexture(canvas, { repeat = null, srgb = true, filter = true } = {}) {
  const t = new THREE.CanvasTexture(canvas);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  if (repeat) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(repeat[0], repeat[1]);
  }
  if (!filter) {
    t.magFilter = THREE.NearestFilter;
  }
  t.needsUpdate = true;
  return t;
}

function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function roundRect(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.lineTo(x + w - r, y);
  g.quadraticCurveTo(x + w, y, x + w, y + r);
  g.lineTo(x + w, y + h - r);
  g.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  g.lineTo(x + r, y + h);
  g.quadraticCurveTo(x, y + h, x, y + h - r);
  g.lineTo(x, y + r);
  g.quadraticCurveTo(x, y, x + r, y);
  g.closePath();
}

function verticalGradient(g, x, y, w, h, stops) {
  const grd = g.createLinearGradient(x, y, x, y + h);
  for (const [p, c] of stops) grd.addColorStop(p, c);
  g.fillStyle = grd;
  g.fillRect(x, y, w, h);
}

/* ---------------------------------------------------------------- 地面 */

export function makeGroundTextures() {
  const S = 2048;
  const c = C(S, S);
  const g = c.getContext('2d');
  const rand = rng(20241107);
  const px = (x) => ((x + 12) / 24) * S;
  const pz = (z) => ((12 - z) / 24) * S;
  const rectOf = (x0, z0, x1, z1) => [px(x0), pz(z1), (x1 - x0) / 24 * S, (z1 - z0) / 24 * S];

  // ---- 人行道底色 + 砖缝
  g.fillStyle = '#5f5c55';
  g.fillRect(0, 0, S, S);
  g.strokeStyle = 'rgba(72,69,62,0.7)';
  g.lineWidth = 2;
  const tile = 0.75;
  for (let x = -12; x <= 12; x += tile) {
    g.beginPath();
    g.moveTo(px(x), 0);
    g.lineTo(px(x), S);
    g.stroke();
  }
  for (let z = -12; z <= 12; z += tile) {
    g.beginPath();
    g.moveTo(0, pz(z));
    g.lineTo(S, pz(z));
    g.stroke();
  }
  // 砖面细微明暗
  for (let i = 0; i < 2600; i++) {
    const x = rand() * S;
    const y = rand() * S;
    g.fillStyle = rand() > 0.5 ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.05)';
    g.fillRect(x, y, 2 + rand() * 10, 2 + rand() * 10);
  }

  // ---- 车行道
  const roads = [
    [-12, 4.0, 12, 8.8],
    [-10.2, -12, -5.6, 12],
    [8.0, -12, 11.6, 1.0],
    [-3.0, -12, 8.0, -9.0],
  ];
  for (const [x0, z0, x1, z1] of roads) {
    const [rx, ry, rw, rh] = rectOf(x0, z0, x1, z1);
    g.fillStyle = '#43464c';
    g.fillRect(rx, ry, rw, rh);
    // 沥青颗粒
    const n = Math.floor((rw * rh) / 220);
    for (let i = 0; i < n; i++) {
      const x = rx + rand() * rw;
      const y = ry + rand() * rh;
      const a = 0.04 + rand() * 0.1;
      g.fillStyle = rand() > 0.45 ? `rgba(140,145,152,${a})` : `rgba(12,14,18,${a + 0.05})`;
      g.fillRect(x, y, 1 + rand() * 3, 1 + rand() * 3);
    }
    // 补丁 / 修补痕迹
    for (let i = 0; i < 5; i++) {
      const w = 0.6 + rand() * 2.4;
      const h = 0.5 + rand() * 1.6;
      const x = x0 + rand() * Math.max(0.1, x1 - x0 - w);
      const z = z0 + rand() * Math.max(0.1, z1 - z0 - h);
      g.fillStyle = `rgba(24,26,31,${0.12 + rand() * 0.15})`;
      g.fillRect(px(x), pz(z + h), (w / 24) * S, (h / 24) * S);
    }
  }
  // 轮胎痕迹
  g.strokeStyle = 'rgba(18,20,24,0.16)';
  g.lineWidth = 26;
  g.beginPath();
  g.moveTo(px(-12), pz(6.15));
  g.lineTo(px(12), pz(6.15));
  g.moveTo(px(-12), pz(7.55));
  g.lineTo(px(12), pz(7.55));
  g.moveTo(px(-8.35), pz(-12));
  g.lineTo(px(-8.35), pz(12));
  g.moveTo(px(-6.55), pz(-12));
  g.lineTo(px(-6.55), pz(12));
  g.stroke();

  // 井盖
  for (const [mx, mz, r] of [[-7.7, 5.35, 0.44], [1.2, 7.6, 0.38], [-7.9, -3.4, 0.4]]) {
    g.save();
    g.beginPath();
    g.arc(px(mx), pz(mz), (r / 24) * S, 0, Math.PI * 2);
    g.fillStyle = '#2b2d31';
    g.fill();
    g.strokeStyle = 'rgba(150,150,140,0.35)';
    g.lineWidth = 3;
    g.stroke();
    g.strokeStyle = 'rgba(130,132,128,0.22)';
    g.lineWidth = 2;
    for (let i = 1; i < 5; i++) {
      g.beginPath();
      g.arc(px(mx), pz(mz), ((r * i) / 5 / 24) * S, 0, Math.PI * 2);
      g.stroke();
    }
    g.restore();
  }

  // 排水沟（路缘）
  g.fillStyle = 'rgba(22,24,28,0.85)';
  g.fillRect(px(-5.6), pz(4.18), (17.6 / 24) * S, (0.26 / 24) * S);
  g.fillRect(px(-10.32), pz(12), (0.26 / 24) * S, (24 / 24) * S);
  g.fillRect(px(-5.6), pz(8.94), (0.26 / 24) * S, (3.1 / 24) * S);

  // ---- 道路标线
  g.fillStyle = 'rgba(222,220,206,0.82)';
  const dash = (x0, z0, x1, z1, w) => {
    g.fillRect(px(x0), pz(z1) - (w / 24) * S * 0, (Math.abs(x1 - x0) / 24) * S, (w / 24) * S);
  };
  // 前街中心虚线
  for (let x = -5.2; x < 11.6; x += 5.0) {
    dash(x, 6.32, x + 2.4, 6.44, 0.12);
  }
  // 左街中心虚线
  for (let z = -11.4; z < 11.4; z += 5.0) {
    g.fillRect(px(-7.96), pz(z + 2.4), (0.12 / 24) * S, (2.4 / 24) * S);
  }
  // 停止线
  g.fillRect(px(-10.05), pz(4.62), (4.4 / 24) * S, (0.42 / 24) * S);
  // 斑马线（跨前街）
  for (let z = 4.3; z < 8.6; z += 0.84) {
    g.fillStyle = `rgba(226,224,210,${0.72 + rand() * 0.12})`;
    g.fillRect(px(-4.7), pz(z + 0.42), (2.6 / 24) * S, (0.42 / 24) * S);
  }
  // 斑马线（跨左街）
  for (let x = -10.0; x < -5.7; x += 0.84) {
    g.fillStyle = `rgba(226,224,210,${0.7 + rand() * 0.12})`;
    g.fillRect(px(x), pz(3.62), (0.42 / 24) * S, (2.62 / 24) * S);
  }
  // 停车位
  g.strokeStyle = 'rgba(224,222,208,0.7)';
  g.lineWidth = 9;
  g.strokeRect(px(3.9), pz(6.3), (3.9 / 24) * S, (2.0 / 24) * S);
  g.beginPath();
  g.moveTo(px(5.85), pz(6.3));
  g.lineTo(px(5.85), pz(4.3));
  g.stroke();
  g.fillStyle = 'rgba(224,222,208,0.6)';
  g.font = `bold ${Math.round((1.0 / 24) * S)}px ${JP}`;
  g.fillText('P', px(4.55), pz(5.02));
  // 止まれ + 箭头
  g.save();
  g.translate(px(-8.6), pz(6.5));
  g.rotate(-Math.PI / 2);
  g.fillStyle = 'rgba(220,218,202,0.62)';
  g.font = `bold ${Math.round((0.95 / 24) * S)}px ${JP}`;
  g.textAlign = 'center';
  g.fillText('止まれ', 0, 0);
  g.restore();
  g.save();
  g.translate(px(-7.88), pz(-1.6));
  g.fillStyle = 'rgba(220,218,202,0.55)';
  g.beginPath();
  g.moveTo(0, -(1.0 / 24) * S);
  g.lineTo((0.55 / 24) * S, 0);
  g.lineTo((0.2 / 24) * S, 0);
  g.lineTo((0.2 / 24) * S, (1.3 / 24) * S);
  g.lineTo(-(0.2 / 24) * S, (1.3 / 24) * S);
  g.lineTo(-(0.2 / 24) * S, 0);
  g.lineTo(-(0.55 / 24) * S, 0);
  g.closePath();
  g.fill();
  g.restore();

  // 黄色盲道
  const tactile = (x0, z0, x1, z1) => {
    g.fillStyle = 'rgba(196,158,58,0.8)';
    g.fillRect(px(x0), pz(z1), ((x1 - x0) / 24) * S, ((z1 - z0) / 24) * S);
    g.fillStyle = 'rgba(120,94,32,0.5)';
    const step = 0.16;
    for (let x = x0 + 0.06; x < x1; x += step) {
      for (let z = z0 + 0.06; z < z1; z += step) {
        g.beginPath();
        g.arc(px(x), pz(z), 1.6, 0, Math.PI * 2);
        g.fill();
      }
    }
  };
  tactile(-4.95, 3.42, -1.75, 3.78);
  tactile(-5.55, 1.15, -5.2, 3.4);
  tactile(3.2, 3.42, 7.2, 3.78);

  // ---- 夜色压暗
  g.fillStyle = 'rgba(12,18,32,0.34)';
  g.fillRect(0, 0, S, S);

  // ---- 烘焙灯光洒落
  const pool = (x, z, r, inner, outer) => {
    const grd = g.createRadialGradient(px(x), pz(z), 0, px(x), pz(z), (r / 24) * S);
    grd.addColorStop(0, inner);
    grd.addColorStop(1, outer);
    g.fillStyle = grd;
    g.fillRect(0, 0, S, S);
  };
  g.globalCompositeOperation = 'lighter';
  // 店前暖光（窗光）
  for (let i = 0; i < 7; i++) {
    const wx = -2.2 + i * 1.45;
    const grd = g.createLinearGradient(px(wx), pz(1.0), px(wx), pz(3.9));
    grd.addColorStop(0, 'rgba(255,206,138,0.5)');
    grd.addColorStop(0.45, 'rgba(255,196,120,0.22)');
    grd.addColorStop(1, 'rgba(255,190,110,0)');
    g.fillStyle = grd;
    g.fillRect(px(wx - 0.62), pz(3.9), (1.24 / 24) * S, (2.9 / 24) * S);
  }
  // 门口更亮
  pool(2.0, 2.0, 2.9, 'rgba(255,214,150,0.5)', 'rgba(255,200,130,0)');
  // 左侧橱窗洒光
  for (let i = 0; i < 5; i++) {
    const wz = -7.6 + i * 1.7;
    const grd = g.createLinearGradient(px(-3.0), pz(wz), px(-5.7), pz(wz));
    grd.addColorStop(0, 'rgba(255,203,132,0.42)');
    grd.addColorStop(1, 'rgba(255,190,110,0)');
    g.fillStyle = grd;
    g.fillRect(px(-5.7), pz(wz + 0.62), (2.7 / 24) * S, (1.24 / 24) * S);
  }
  // 路灯
  pool(-4.95, 3.5, 3.4, 'rgba(255,226,175,0.5)', 'rgba(255,220,160,0)');
  pool(-4.6, 5.6, 4.2, 'rgba(255,228,180,0.3)', 'rgba(255,220,160,0)');
  // 灯箱招牌
  pool(-4.85, 1.5, 1.9, 'rgba(196,255,228,0.4)', 'rgba(180,255,220,0)');
  // 自动贩卖机
  pool(9.35, 3.5, 2.4, 'rgba(190,240,255,0.4)', 'rgba(170,225,255,0)');
  // 便利店招牌带溢光
  pool(2.2, 1.65, 4.6, 'rgba(255,236,190,0.24)', 'rgba(255,230,180,0)');
  g.globalCompositeOperation = 'source-over';

  // ---- 积水（暗色 + 边缘）
  const puddles = [];
  const addPuddle = (x, z, rx, rz, rot = 0) => puddles.push({ x, z, rx, rz, rot });
  addPuddle(-3.4, 4.55, 1.5, 0.55, 0.06);
  addPuddle(0.6, 4.5, 1.1, 0.42, -0.05);
  addPuddle(4.2, 4.62, 1.8, 0.5, 0.02);
  addPuddle(7.5, 4.5, 1.2, 0.45, 0.08);
  addPuddle(-6.7, 4.7, 0.9, 0.85, 0.3);
  addPuddle(-6.9, 2.2, 0.85, 0.5, 0);
  addPuddle(-8.4, 7.0, 1.2, 0.7, 0.4);
  addPuddle(1.6, 7.9, 1.5, 0.55, 0);
  addPuddle(5.4, 6.9, 1.0, 0.4, 0.2);
  addPuddle(-4.2, 2.2, 0.85, 0.45, 0);
  addPuddle(9.9, 1.2, 1.1, 0.8, 0.5);
  addPuddle(9.8, -2.6, 1.3, 0.9, 0.2);
  addPuddle(5.6, -10.3, 1.4, 0.7, 0.1);
  addPuddle(-1.2, 0.2, 0.8, 0.4, 0);
  addPuddle(-8.2, -6.2, 1.0, 0.65, 0.3);
  addPuddle(2.4, 10.1, 1.1, 0.5, 0);
  for (const p of puddles) {
    g.save();
    g.translate(px(p.x), pz(p.z));
    g.rotate(p.rot);
    const grd = g.createRadialGradient(0, 0, 0, 0, 0, (Math.max(p.rx, p.rz) / 24) * S);
    grd.addColorStop(0, 'rgba(16,24,36,0.55)');
    grd.addColorStop(0.72, 'rgba(16,24,36,0.4)');
    grd.addColorStop(1, 'rgba(16,24,36,0)');
    g.fillStyle = grd;
    g.beginPath();
    g.ellipse(0, 0, (p.rx / 24) * S, (p.rz / 24) * S, 0, 0, Math.PI * 2);
    g.fill();
    g.restore();
  }

  // ---- 水面遮罩（低分辨率，模糊）
  const PS = 512;
  const pc = C(PS, PS);
  const pg = pc.getContext('2d');
  pg.fillStyle = '#000';
  pg.fillRect(0, 0, PS, PS);
  pg.filter = 'blur(7px)';
  const ppx = (x) => ((x + 12) / 24) * PS;
  const ppz = (z) => ((12 - z) / 24) * PS;
  for (const p of puddles) {
    pg.save();
    pg.translate(ppx(p.x), ppz(p.z));
    pg.rotate(p.rot);
    pg.fillStyle = 'rgba(255,255,255,0.95)';
    pg.beginPath();
    pg.ellipse(0, 0, (p.rx / 24) * PS, (p.rz / 24) * PS, 0, 0, Math.PI * 2);
    pg.fill();
    pg.restore();
  }
  // 整体湿润感
  pg.fillStyle = 'rgba(255,255,255,0.16)';
  pg.fillRect(0, 0, PS, PS);

  return {
    map: canvasTexture(c),
    puddle: canvasTexture(pc, { srgb: false }),
    puddleList: puddles,
  };
}

/* ---------------------------------------------------------------- 招牌 */

export function makeMainSignTexture() {
  const w = 2048;
  const h = 186;
  const c = C(w, h);
  const g = c.getContext('2d');
  g.fillStyle = '#fffaf0';
  g.fillRect(0, 0, w, h);
  // 条纹
  g.fillStyle = '#1f9d6d';
  g.fillRect(0, 0, w, 13);
  g.fillStyle = '#f0a04b';
  g.fillRect(0, h - 13, w, 13);
  // 太阳 logo
  g.save();
  g.translate(88, h / 2);
  g.fillStyle = '#f0a04b';
  g.beginPath();
  g.arc(0, 0, 54, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#fffaf0';
  g.beginPath();
  g.arc(0, 0, 41, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#1f9d6d';
  g.beginPath();
  g.arc(0, 0, 29, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = '#f0a04b';
  g.lineWidth = 6;
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    g.beginPath();
    g.moveTo(Math.cos(a) * 43, Math.sin(a) * 43);
    g.lineTo(Math.cos(a) * 52, Math.sin(a) * 52);
    g.stroke();
  }
  g.restore();
  // 主文字
  g.fillStyle = '#17614a';
  g.font = `bold 92px ${JP}`;
  g.textBaseline = 'alphabetic';
  g.fillText('ひだまりマート', 168, 112);
  g.fillStyle = '#41544c';
  g.font = `600 26px ${JP}`;
  g.fillText('HIDAMARI  MART  ・  ひだまり通り店', 172, 156);
  // 24H 徽章
  g.save();
  roundRect(g, w - 288, 30, 210, 126, 18);
  g.fillStyle = '#f0a04b';
  g.fill();
  g.fillStyle = '#fffdf6';
  g.font = `bold 66px ${JP}`;
  g.textAlign = 'center';
  g.fillText('24H', w - 183, 104);
  g.font = `bold 28px ${JP}`;
  g.fillText('OPEN', w - 183, 142);
  g.restore();
  return canvasTexture(c);
}

export function makePylonSignTexture() {
  const w = 384;
  const h = 1408;
  const c = C(w, h);
  const g = c.getContext('2d');
  g.fillStyle = '#fff8ea';
  g.fillRect(0, 0, w, h);
  g.strokeStyle = '#e6d9bd';
  g.lineWidth = 12;
  g.strokeRect(6, 6, w - 12, h - 12);
  // 顶部橙块
  g.fillStyle = '#ee9640';
  g.fillRect(22, 22, w - 44, 230);
  g.fillStyle = '#fffdf7';
  g.font = `bold 132px ${JP}`;
  g.textAlign = 'center';
  g.fillText('24H', w / 2, 178);
  g.font = `600 40px ${JP}`;
  g.fillText('OPEN', w / 2, 232);
  // 竖排片假名
  g.fillStyle = '#17614a';
  g.font = `bold 92px ${JP}`;
  const chars = ['ひ', 'だ', 'ま', 'り', 'マ', 'ー', 'ト'];
  chars.forEach((ch, i) => {
    g.fillText(ch, w / 2, 360 + i * 116);
  });
  // 底部条纹
  const bands = ['#1f9d6d', '#f0a04b', '#e2604a', '#1f9d6d'];
  bands.forEach((col, i) => {
    g.fillStyle = col;
    g.fillRect(28, 1215 + i * 30, w - 56, 18);
  });
  g.fillStyle = '#3d4a44';
  g.font = `600 24px ${JP}`;
  g.fillText('HIDAMARI MART', w / 2, 1190);
  return canvasTexture(c);
}

export function makeWindowDecalTexture() {
  const c = C(512, 512);
  const g = c.getContext('2d');
  g.clearRect(0, 0, 512, 512);
  g.strokeStyle = 'rgba(255,252,240,0.85)';
  g.lineWidth = 10;
  roundRect(g, 34, 300, 444, 170, 18);
  g.stroke();
  g.fillStyle = 'rgba(255,248,228,0.92)';
  g.font = `bold 74px ${JP}`;
  g.textAlign = 'center';
  g.fillText('24H', 256, 398);
  g.font = `600 34px ${JP}`;
  g.fillText('OPEN', 256, 442);
  g.fillStyle = 'rgba(255,220,120,0.9)';
  g.font = `600 26px ${JP}`;
  g.fillText('ひだまりマート', 256, 262);
  return canvasTexture(c);
}

/* ---------------------------------------------------------------- 店内/贩卖机 */

export function makeVendingTexture() {
  const w = 512;
  const h = 1024;
  const c = C(w, h);
  const g = c.getContext('2d');
  g.fillStyle = '#eef3f7';
  g.fillRect(0, 0, w, h);
  // 顶部品牌栏
  g.fillStyle = '#183a5e';
  g.fillRect(20, 20, w - 40, 150);
  g.fillStyle = '#eaf6ff';
  g.font = `bold 62px ${JP}`;
  g.textAlign = 'left';
  g.fillText('DRINK', 44, 100);
  g.font = `600 26px ${JP}`;
  g.fillStyle = '#9fd4f0';
  g.fillText('COLD & HOT', 46, 140);
  // 山形图形
  g.fillStyle = '#3d78a8';
  g.beginPath();
  g.moveTo(330, 150);
  g.lineTo(392, 70);
  g.lineTo(430, 118);
  g.lineTo(462, 84);
  g.lineTo(486, 150);
  g.closePath();
  g.fill();
  g.fillStyle = '#f4fbff';
  g.beginPath();
  g.moveTo(366, 110);
  g.lineTo(392, 74);
  g.lineTo(418, 112);
  g.closePath();
  g.fill();

  // 商品陈列
  g.fillStyle = '#f8fcff';
  g.fillRect(20, 186, w - 40, 470);
  const cols = 4;
  const rows = 3;
  const cellW = (w - 80) / cols;
  const cellH = 140;
  const palette = ['#e2564c', '#3f8ed6', '#f2b134', '#4bb27a', '#d76aa0', '#6b56bd', '#58b6c9', '#e8873f', '#8fbf4a', '#c04f4f', '#4a7fc1', '#e5a53b'];
  for (let r = 0; r < rows; r++) {
    for (let i = 0; i < cols; i++) {
      const x = 46 + i * cellW;
      const y = 206 + r * cellH;
      const col = palette[(r * cols + i) % palette.length];
      // 罐身
      g.fillStyle = col;
      roundRect(g, x + 16, y + 10, 62, 96, 12);
      g.fill();
      g.fillStyle = 'rgba(255,255,255,0.85)';
      g.fillRect(x + 16, y + 36, 62, 16);
      g.fillStyle = 'rgba(20,30,45,0.65)';
      g.font = `600 20px ${JP}`;
      g.fillText('¥130', x + 12, y + 132);
      // 按钮灯
      g.fillStyle = r === 0 ? '#6ff0c8' : '#67c8ff';
      g.fillRect(x + 22, y + 112, 50, 6);
    }
  }
  // 投币区
  g.fillStyle = '#d7dee5';
  g.fillRect(20, 666, w - 40, 120);
  g.fillStyle = '#26323d';
  g.fillRect(56, 700, 70, 8);
  g.fillRect(56, 726, 70, 8);
  g.fillStyle = '#8f9aa4';
  g.fillRect(200, 690, 120, 70);
  g.fillStyle = '#39454f';
  g.fillRect(216, 704, 88, 42);
  g.fillStyle = '#9be8c8';
  g.font = `600 22px ${JP}`;
  g.fillText('¥', 250, 734);
  // 取物口
  g.fillStyle = '#2a333c';
  roundRect(g, 40, 830, w - 80, 140, 14);
  g.fill();
  g.fillStyle = '#151b21';
  roundRect(g, 60, 852, w - 120, 96, 10);
  g.fill();
  g.fillStyle = '#b9c4cd';
  g.font = `600 22px ${JP}`;
  g.textAlign = 'center';
  g.fillText('PUSH', w / 2, 1010);
  return canvasTexture(c);
}

export function makePosterTexture(kind) {
  const c = C(512, 720);
  const g = c.getContext('2d');
  if (kind === 'drink') {
    verticalGradient(g, 0, 0, 512, 720, [[0, '#0f3a63'], [1, '#0a1c33']]);
    g.fillStyle = '#8fe6ff';
    g.beginPath();
    g.arc(256, 560, 210, 0, Math.PI * 2);
    g.globalAlpha = 0.18;
    g.fill();
    g.globalAlpha = 1;
    // 罐
    g.fillStyle = '#dfe9f2';
    roundRect(g, 196, 300, 120, 250, 22);
    g.fill();
    g.fillStyle = '#2f7fbe';
    g.fillRect(196, 360, 120, 100);
    g.fillStyle = '#fff';
    g.fillRect(196, 394, 120, 16);
    g.fillStyle = '#ffffff';
    g.font = `bold 74px ${JP}`;
    g.textAlign = 'center';
    g.fillText('新発売', 256, 150);
    g.fillStyle = '#9fe2ff';
    g.font = `600 34px ${JP}`;
    g.fillText('つめたく、しゅわっと。', 256, 210);
    g.fillStyle = '#ffd97a';
    g.font = `bold 44px ${JP}`;
    g.fillText('¥140', 256, 640);
  } else if (kind === 'onigiri') {
    verticalGradient(g, 0, 0, 512, 720, [[0, '#fff4dd'], [1, '#f5d9b8']]);
    g.fillStyle = '#f4f1e6';
    g.beginPath();
    g.moveTo(256, 250);
    g.lineTo(392, 520);
    g.lineTo(120, 520);
    g.closePath();
    g.fill();
    g.strokeStyle = '#ded7c4';
    g.lineWidth = 6;
    g.stroke();
    g.fillStyle = '#2b4a34';
    g.fillRect(186, 430, 140, 92);
    g.fillStyle = '#e2604a';
    g.beginPath();
    g.arc(256, 400, 34, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#6b4b2a';
    g.font = `bold 82px ${JP}`;
    g.textAlign = 'center';
    g.fillText('おにぎり', 256, 150);
    g.fillStyle = '#a06a3a';
    g.font = `600 34px ${JP}`;
    g.fillText('炊きたて ・ 毎日入荷', 256, 620);
  } else if (kind === 'coffee') {
    verticalGradient(g, 0, 0, 512, 720, [[0, '#3d2417'], [1, '#1d110b']]);
    g.fillStyle = '#f0dcc0';
    g.beginPath();
    g.moveTo(170, 330);
    g.lineTo(342, 330);
    g.lineTo(316, 540);
    g.lineTo(196, 540);
    g.closePath();
    g.fill();
    g.fillStyle = '#6b3d22';
    g.beginPath();
    g.ellipse(256, 330, 86, 24, 0, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = 'rgba(240,220,190,0.5)';
    g.lineWidth = 7;
    for (let i = 0; i < 3; i++) {
      g.beginPath();
      g.moveTo(200 + i * 50, 290);
      g.bezierCurveTo(175 + i * 50, 250, 225 + i * 50, 230, 205 + i * 50, 190);
      g.stroke();
    }
    g.fillStyle = '#ffe6b8';
    g.font = `bold 74px ${JP}`;
    g.textAlign = 'center';
    g.fillText('HOT COFFEE', 256, 130);
    g.fillStyle = '#f0b46a';
    g.font = `bold 54px ${JP}`;
    g.fillText('¥120', 256, 640);
  } else if (kind === 'karaage') {
    verticalGradient(g, 0, 0, 512, 720, [[0, '#e8702c'], [1, '#b8401a']]);
    for (let i = 0; i < 8; i++) {
      const x = 120 + (i % 4) * 80;
      const y = 350 + Math.floor(i / 4) * 90;
      g.fillStyle = i % 2 ? '#f2b85a' : '#e89a3e';
      roundRect(g, x, y, 76, 70, 22);
      g.fill();
      g.strokeStyle = 'rgba(120,50,10,0.4)';
      g.lineWidth = 3;
      g.stroke();
    }
    g.fillStyle = '#fff6e0';
    g.font = `bold 78px ${JP}`;
    g.textAlign = 'center';
    g.fillText('からあげ', 256, 150);
    g.font = `600 36px ${JP}`;
    g.fillText('ジューシー 4個入', 256, 224);
    g.font = `bold 48px ${JP}`;
    g.fillText('¥220', 256, 640);
  } else {
    verticalGradient(g, 0, 0, 512, 720, [[0, '#20263a'], [1, '#10131f']]);
    g.fillStyle = '#ffd166';
    g.font = `bold 92px ${JP}`;
    g.textAlign = 'center';
    g.fillText('SALE', 256, 200);
    g.fillStyle = '#fff';
    g.font = `bold 54px ${JP}`;
    g.fillText('お弁当 20% OFF', 256, 330);
    g.font = `600 34px ${JP}`;
    g.fillStyle = '#9fb6d6';
    g.fillText('11:00 - 14:00', 256, 400);
  }
  return canvasTexture(c);
}

export function makeBannerTexture(kind) {
  const c = C(512, 224);
  const g = c.getContext('2d');
  const styles = {
    oden: { bg: '#f2a03c', fg: '#fffaf0', text: 'おでん', sub: 'ODEN  ¥90〜' },
    hot: { bg: '#e2604a', fg: '#fff6ea', text: 'ホット', sub: 'HOT SNACK' },
    coffee: { bg: '#6b4a33', fg: '#ffe8c6', text: 'COFFEE', sub: '¥120' },
    bento: { bg: '#2f7fbe', fg: '#f4fbff', text: 'お弁当', sub: 'BENTO' },
  };
  const s = styles[kind] || styles.oden;
  g.fillStyle = s.bg;
  g.fillRect(0, 0, 512, 224);
  g.strokeStyle = 'rgba(255,255,255,0.55)';
  g.lineWidth = 8;
  g.strokeRect(10, 10, 492, 204);
  g.fillStyle = s.fg;
  g.font = `bold 96px ${JP}`;
  g.textAlign = 'center';
  g.fillText(s.text, 256, 132);
  g.font = `600 30px ${JP}`;
  g.globalAlpha = 0.85;
  g.fillText(s.sub, 256, 186);
  return canvasTexture(c);
}

export function makeNoticeBoardTexture() {
  const c = C(640, 480);
  const g = c.getContext('2d');
  g.fillStyle = '#8a6a4a';
  g.fillRect(0, 0, 640, 480);
  const rand = rng(77);
  const colors = ['#f4efe2', '#f6e7c8', '#e8f0f4', '#f7dede', '#e8f7e0'];
  for (let i = 0; i < 7; i++) {
    const w = 130 + rand() * 70;
    const h = 110 + rand() * 90;
    const x = 26 + (i % 4) * 150 + rand() * 10;
    const y = 24 + Math.floor(i / 4) * 210 + rand() * 20;
    g.save();
    g.translate(x + w / 2, y + h / 2);
    g.rotate((rand() - 0.5) * 0.08);
    g.fillStyle = 'rgba(0,0,0,0.18)';
    g.fillRect(-w / 2 + 5, -h / 2 + 6, w, h);
    g.fillStyle = colors[i % colors.length];
    g.fillRect(-w / 2, -h / 2, w, h);
    g.fillStyle = 'rgba(45,50,60,0.55)';
    for (let l = 0; l < 5; l++) {
      g.fillRect(-w / 2 + 14, -h / 2 + 22 + l * 16, w - 28 - rand() * 40, 5);
    }
    g.fillStyle = 'rgba(190,70,60,0.75)';
    g.fillRect(-18, -h / 2 - 6, 36, 12);
    g.restore();
  }
  return canvasTexture(c);
}

export function makeGlassStreakTexture() {
  const w = 512;
  const h = 1024;
  const c = C(w, h);
  const g = c.getContext('2d');
  g.clearRect(0, 0, w, h);
  const rand = rng(991);
  for (let i = 0; i < 46; i++) {
    const x = rand() * w;
    const len = 120 + rand() * 700;
    const y = rand() * (h - len);
    const grd = g.createLinearGradient(0, y, 0, y + len);
    const a = 0.05 + rand() * 0.18;
    grd.addColorStop(0, 'rgba(220,240,255,0)');
    grd.addColorStop(0.35, `rgba(220,240,255,${a})`);
    grd.addColorStop(0.7, `rgba(235,248,255,${a * 1.3})`);
    grd.addColorStop(1, 'rgba(210,235,255,0)');
    g.strokeStyle = grd;
    g.lineWidth = 1 + rand() * 3.5;
    g.beginPath();
    g.moveTo(x, y);
    g.bezierCurveTo(x + (rand() - 0.5) * 18, y + len * 0.4, x + (rand() - 0.5) * 20, y + len * 0.7, x + (rand() - 0.5) * 12, y + len);
    g.stroke();
  }
  for (let i = 0; i < 220; i++) {
    const x = rand() * w;
    const y = rand() * h;
    const r = 0.7 + rand() * 2.2;
    g.fillStyle = `rgba(225,242,255,${0.1 + rand() * 0.3})`;
    g.beginPath();
    g.arc(x, y, r, 0, Math.PI * 2);
    g.fill();
  }
  return canvasTexture(c);
}

export function makeGlowTexture() {
  const c = C(128, 128);
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grd.addColorStop(0, 'rgba(255,255,255,1)');
  grd.addColorStop(0.25, 'rgba(255,255,255,0.55)');
  grd.addColorStop(0.6, 'rgba(255,255,255,0.14)');
  grd.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, 128, 128);
  return canvasTexture(c, { srgb: false });
}

export function makeGrateTexture() {
  const c = C(256, 128);
  const g = c.getContext('2d');
  g.fillStyle = '#3a3d40';
  g.fillRect(0, 0, 256, 128);
  g.fillStyle = '#17191c';
  for (let i = 0; i < 9; i++) {
    roundRect(g, 8 + i * 27, 10, 15, 108, 4);
    g.fill();
  }
  g.strokeStyle = '#5a5e62';
  g.lineWidth = 4;
  g.strokeRect(2, 2, 252, 124);
  return canvasTexture(c);
}

export function makeInteriorFloorTexture() {
  const S = 512;
  const c = C(S, S);
  const g = c.getContext('2d');
  g.fillStyle = '#d9d2c0';
  g.fillRect(0, 0, S, S);
  g.strokeStyle = 'rgba(170,162,148,0.75)';
  g.lineWidth = 2;
  for (let i = 0; i <= 4; i++) {
    g.beginPath();
    g.moveTo((i / 4) * S, 0);
    g.lineTo((i / 4) * S, S);
    g.moveTo(0, (i / 4) * S);
    g.lineTo(S, (i / 4) * S);
    g.stroke();
  }
  const rand = rng(5150);
  for (let i = 0; i < 500; i++) {
    g.fillStyle = `rgba(255,255,255,${rand() * 0.05})`;
    g.fillRect(rand() * S, rand() * S, 4, 4);
  }
  return canvasTexture(c, { repeat: [6, 6] });
}

export function makeCurtainTexture(warm = true) {
  const c = C(256, 256);
  const g = c.getContext('2d');
  verticalGradient(g, 0, 0, 256, 256, warm ? [[0, '#ffd9a1'], [1, '#f4b06a']] : [[0, '#28313f'], [1, '#141a24']]);
  for (let i = 0; i < 12; i++) {
    g.fillStyle = `rgba(${warm ? '180,120,60' : '0,0,0'},${0.08 + (i % 2) * 0.08})`;
    g.fillRect(i * 22, 0, 11, 256);
  }
  return canvasTexture(c);
}

export function makeClockTexture() {
  const c = C(256, 256);
  const g = c.getContext('2d');
  g.fillStyle = '#f7f7f2';
  g.beginPath();
  g.arc(128, 128, 120, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = '#3a3f46';
  g.lineWidth = 6;
  g.stroke();
  g.strokeStyle = '#3a3f46';
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    g.lineWidth = i % 3 === 0 ? 7 : 3;
    g.beginPath();
    g.moveTo(128 + Math.cos(a) * 96, 128 + Math.sin(a) * 96);
    g.lineTo(128 + Math.cos(a) * 110, 128 + Math.sin(a) * 110);
    g.stroke();
  }
  g.lineWidth = 8;
  g.beginPath();
  g.moveTo(128, 128);
  g.lineTo(128 + Math.cos(-1.1) * 62, 128 + Math.sin(-1.1) * 62);
  g.stroke();
  g.lineWidth = 6;
  g.beginPath();
  g.moveTo(128, 128);
  g.lineTo(128 + Math.cos(1.9) * 90, 128 + Math.sin(1.9) * 90);
  g.stroke();
  return canvasTexture(c);
}

export function makeFloorArrowTexture() {
  const c = C(256, 256);
  const g = c.getContext('2d');
  g.clearRect(0, 0, 256, 256);
  g.fillStyle = 'rgba(60,120,190,0.55)';
  g.beginPath();
  g.moveTo(128, 26);
  g.lineTo(196, 106);
  g.lineTo(156, 106);
  g.lineTo(156, 226);
  g.lineTo(100, 226);
  g.lineTo(100, 106);
  g.lineTo(60, 106);
  g.closePath();
  g.fill();
  return canvasTexture(c);
}

export function makeRoadSign(text, bg = '#1f5fa8', fg = '#ffffff', w = 256, h = 256) {
  const c = C(w, h);
  const g = c.getContext('2d');
  g.fillStyle = bg;
  g.fillRect(0, 0, w, h);
  g.strokeStyle = fg;
  g.lineWidth = 10;
  g.strokeRect(10, 10, w - 20, h - 20);
  g.fillStyle = fg;
  g.font = `bold ${Math.round(h * 0.42)}px ${JP}`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(text, w / 2, h / 2);
  return canvasTexture(c);
}

export function makeStopSignTexture() {
  const c = C(256, 256);
  const g = c.getContext('2d');
  g.clearRect(0, 0, 256, 256);
  g.fillStyle = '#f5f1e6';
  g.beginPath();
  g.moveTo(128, 244);
  g.lineTo(10, 40);
  g.lineTo(246, 40);
  g.closePath();
  g.fill();
  g.fillStyle = '#cf3b34';
  g.beginPath();
  g.moveTo(128, 228);
  g.lineTo(30, 54);
  g.lineTo(226, 54);
  g.closePath();
  g.fill();
  g.fillStyle = '#ffffff';
  g.font = `bold 74px ${JP}`;
  g.textAlign = 'center';
  g.fillText('止まれ', 128, 172);
  return canvasTexture(c);
}

export function makePlaqueTexture() {
  const c = C(512, 128);
  const g = c.getContext('2d');
  g.fillStyle = '#1d1e22';
  g.fillRect(0, 0, 512, 128);
  g.strokeStyle = '#b9925a';
  g.lineWidth = 4;
  g.strokeRect(8, 8, 496, 112);
  g.fillStyle = '#c9a86e';
  g.font = `600 40px ${JP}`;
  g.textAlign = 'center';
  g.fillText('HIDAMARI CORNER  /  1:24', 256, 78);
  return canvasTexture(c);
}

export function makeShutterTexture() {
  const c = C(256, 512);
  const g = c.getContext('2d');
  g.fillStyle = '#5c6168';
  g.fillRect(0, 0, 256, 512);
  for (let y = 0; y < 512; y += 16) {
    g.fillStyle = 'rgba(0,0,0,0.18)';
    g.fillRect(0, y, 256, 6);
    g.fillStyle = 'rgba(255,255,255,0.06)';
    g.fillRect(0, y + 6, 256, 3);
  }
  g.fillStyle = 'rgba(120,90,60,0.35)';
  g.fillRect(0, 380, 256, 20);
  return canvasTexture(c);
}


export function makeNoboriTexture() {
  const c = C(256, 768);
  const g = c.getContext('2d');
  g.fillStyle = '#f4f0e2';
  g.fillRect(0, 0, 256, 768);
  g.fillStyle = '#1f9d6d';
  g.fillRect(0, 0, 256, 96);
  g.fillStyle = '#fffdf4';
  g.font = `bold 44px ${JP}`;
  g.textAlign = 'center';
  g.fillText('OPEN', 128, 64);
  g.fillStyle = '#17614a';
  g.font = `bold 62px ${JP}`;
  const chars = ['ひ', 'だ', 'ま', 'り', 'マ', 'ー', 'ト'];
  chars.forEach((ch, i) => g.fillText(ch, 128, 190 + i * 76));
  g.fillStyle = '#f0a04b';
  g.beginPath();
  g.arc(128, 742, 18, 0, Math.PI * 2);
  g.fill();
  return canvasTexture(c);
}

export function makeNeonTexture() {
  const c = C(256, 640);
  const g = c.getContext('2d');
  g.fillStyle = '#1a1018';
  g.fillRect(0, 0, 256, 640);
  g.strokeStyle = '#ff5f8f';
  g.lineWidth = 6;
  g.strokeRect(10, 10, 236, 620);
  g.shadowColor = '#ff5f8f';
  g.shadowBlur = 26;
  g.fillStyle = '#ffe4ef';
  g.font = `bold 92px ${JP}`;
  g.textAlign = 'center';
  ['ス', 'ナ', 'ッ', 'ク'].forEach((ch, i) => g.fillText(ch, 128, 150 + i * 118));
  g.shadowBlur = 0;
  g.fillStyle = '#ffb2c9';
  g.font = `600 28px ${JP}`;
  g.fillText('SNACK  YUME', 128, 606);
  return canvasTexture(c);
}
