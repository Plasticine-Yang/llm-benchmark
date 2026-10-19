/**
 * 程序化贴图（全部用 Canvas 2D 现场绘制，零外部资源依赖）
 * 风格：干净的赛璐璐平涂 + 轻微手绘质感，服务于三渲二的整体观感。
 */
import * as THREE from 'three';
import { BRAND } from './config.js';

const JP_FONT = '"Hiragino Sans", "Hiragino Kaku Gothic ProN", "Yu Gothic", "Noto Sans JP", "PingFang SC", "Microsoft YaHei", sans-serif';
const EN_FONT = '"Avenir Next", "Futura", "Helvetica Neue", Arial, sans-serif';

const cache = new Map();
function canvasTex(key, w, h, draw, opt = {}) {
  if (cache.has(key)) return cache.get(key);
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  draw(ctx, w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = opt.linear ? THREE.NoColorSpace : THREE.SRGBColorSpace;
  t.anisotropy = 4;
  if (opt.repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(opt.repeat[0], opt.repeat[1]); }
  if (opt.wrap) { t.wrapS = t.wrapT = THREE.RepeatWrapping; }
  t.needsUpdate = true;
  cache.set(key, t);
  return t;
}

/* ------------------------------------------------------------------ 基础噪声 */
export function noiseTexture() {
  return canvasTex('noise', 256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, w, h);
    const img = ctx.getImageData(0, 0, w, h);
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      const n = 128 + (Math.random() - 0.5) * 90;
      d[i] = d[i + 1] = d[i + 2] = n;
    }
    ctx.putImageData(img, 0, 0);
    // 柔和斑块
    for (let i = 0; i < 60; i++) {
      const x = Math.random() * w, y = Math.random() * h, r = 6 + Math.random() * 40;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      const a = 0.04 + Math.random() * 0.08;
      g.addColorStop(0, `rgba(255,255,255,${a})`);
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    }
  }, { linear: true, wrap: true, repeat: [8, 8] });
}

/* ---------------------------------------------------------------- 路面 / 地砖 */
export function roadTexture() {
  return canvasTex('road', 512, 512, (ctx, w, h) => {
    ctx.fillStyle = '#4a5162';
    ctx.fillRect(0, 0, w, h);
    // 沥青颗粒
    for (let i = 0; i < 5200; i++) {
      const x = Math.random() * w, y = Math.random() * h;
      const a = 0.02 + Math.random() * 0.07;
      ctx.fillStyle = Math.random() > 0.5 ? `rgba(255,255,255,${a})` : `rgba(0,0,0,${a * 1.4})`;
      ctx.fillRect(x, y, 1 + Math.random() * 2, 1 + Math.random() * 2);
    }
    // 湿痕（长条拉丝，暗示积水方向）
    for (let i = 0; i < 26; i++) {
      const x = Math.random() * w;
      const g = ctx.createLinearGradient(x, 0, x + 30, h);
      g.addColorStop(0, 'rgba(255,255,255,0)');
      g.addColorStop(0.5, `rgba(190,215,255,${0.03 + Math.random() * 0.05})`);
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.fillRect(x, 0, 12 + Math.random() * 40, h);
    }
  }, { wrap: true, repeat: [3, 3] });
}

export function sidewalkTexture() {
  return canvasTex('walk', 256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#8f97a8';
    ctx.fillRect(0, 0, w, h);
    // 2×2 铺装分格
    const n = 4, s = w / n;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      const tint = 0.5 + Math.random() * 0.5;
      ctx.fillStyle = `rgba(255,255,255,${0.03 * tint})`;
      ctx.fillRect(i * s + 1, j * s + 1, s - 2, s - 2);
      ctx.strokeStyle = 'rgba(30,36,48,0.30)';
      ctx.lineWidth = 2;
      ctx.strokeRect(i * s, j * s, s, s);
    }
    for (let i = 0; i < 900; i++) {
      ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.05})`;
      ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2);
    }
  }, { wrap: true, repeat: [6, 6] });
}

export function buildingTexture() {
  return canvasTex('bldg', 256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#8d97ab';
    ctx.fillRect(0, 0, w, h);
    // 竖向挂板
    for (let x = 0; x < w; x += 16) {
      ctx.fillStyle = 'rgba(255,255,255,0.05)';
      ctx.fillRect(x, 0, 8, h);
      ctx.fillStyle = 'rgba(20,26,40,0.22)';
      ctx.fillRect(x + 14, 0, 2, h);
    }
    // 雨水垂痕
    for (let i = 0; i < 22; i++) {
      const x = Math.random() * w;
      ctx.fillStyle = `rgba(40,55,80,${0.05 + Math.random() * 0.1})`;
      ctx.fillRect(x, Math.random() * h * 0.5, 2 + Math.random() * 5, h);
    }
  }, { wrap: true, repeat: [2, 2] });
}

export function alleyBrickTexture() {
  return canvasTex('alley', 256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#5d6474';
    ctx.fillRect(0, 0, w, h);
    const bh = 18, bw = 46;
    for (let y = 0, r = 0; y < h; y += bh, r++) {
      for (let x = -bw; x < w; x += bw) {
        const ox = (r % 2) * bw * 0.5;
        ctx.fillStyle = `rgba(${120 + Math.random() * 30},${124 + Math.random() * 28},${140 + Math.random() * 26},1)`;
        ctx.fillRect(x + ox + 1, y + 1, bw - 3, bh - 3);
      }
    }
    ctx.fillStyle = 'rgba(12,16,26,0.35)';
    for (let i = 0; i < 40; i++) ctx.fillRect(Math.random() * w, Math.random() * h, 3 + Math.random() * 8, 2 + Math.random() * 3);
  }, { wrap: true, repeat: [3, 3] });
}

export function storeFloorTexture() {
  return canvasTex('storeFloor', 256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#cfc9bb';
    ctx.fillRect(0, 0, w, h);
    const n = 8, s = w / n;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      const v = Math.random() * 0.05;
      ctx.fillStyle = `rgba(255,255,255,${v})`;
      ctx.fillRect(i * s, j * s, s, s);
      ctx.strokeStyle = 'rgba(120,115,105,0.28)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(i * s, j * s, s, s);
    }
  }, { wrap: true, repeat: [4, 4] });
}

/* -------------------------------------------------------------------- 招牌 */
export function signBoardTexture() {
  return canvasTex('signBoard', 1024, 256, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(0.55, '#f4f8ff');
    g.addColorStop(1, '#e2ebfa');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    // 品牌色块
    ctx.fillStyle = '#1f9dd8';
    ctx.fillRect(0, 0, 18, h);
    ctx.fillRect(0, h - 14, w, 14);

    // 圆形 LOGO
    const cx = 132, cy = h / 2;
    ctx.fillStyle = '#1f9dd8';
    ctx.beginPath(); ctx.arc(cx, cy, 78, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(cx, cy, 62, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#1f9dd8';
    ctx.font = `700 74px ${EN_FONT}`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(BRAND.short, cx, cy + 4);

    // 日文主字
    ctx.fillStyle = '#123c58';
    ctx.font = `700 96px ${JP_FONT}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(BRAND.jp, 250, h / 2 + 12);

    // 英文副字
    ctx.fillStyle = '#3f7fa4';
    ctx.font = `600 34px ${EN_FONT}`;
    ctx.fillText(BRAND.en, 254, h / 2 + 58);

    // 24H 角标
    ctx.fillStyle = '#ff5a4d';
    ctx.beginPath();
    const rx = w - 168, ry = 42, rw = 132, rh = 62, r = 14;
    ctx.moveTo(rx + r, ry);
    ctx.arcTo(rx + rw, ry, rx + rw, ry + rh, r);
    ctx.arcTo(rx + rw, ry + rh, rx, ry + rh, r);
    ctx.arcTo(rx, ry + rh, rx, ry, r);
    ctx.arcTo(rx, ry, rx + rw, ry, r);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = `800 40px ${EN_FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText('24H', rx + rw / 2, ry + 46);
  });
}

export function bladeSignTexture() {
  return canvasTex('bladeSign', 256, 1024, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, w, 0);
    g.addColorStop(0, '#f6fbff');
    g.addColorStop(0.5, '#ffffff');
    g.addColorStop(1, '#dce8f8');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#1f9dd8';
    ctx.fillRect(0, 0, w, 16);
    ctx.fillRect(0, h - 16, w, 16);

    // 竖排日文
    const chars = BRAND.jp.split('');
    ctx.fillStyle = '#12405e';
    ctx.font = `700 118px ${JP_FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    chars.forEach((ch, i) => ctx.fillText(ch, w / 2, 150 + i * 138));

    // 底部 24H
    ctx.fillStyle = '#ff5a4d';
    ctx.font = `800 62px ${EN_FONT}`;
    ctx.fillText('24H', w / 2, h - 78);
  });
}

export function lightboxTexture() {
  return canvasTex('lightbox', 512, 256, (ctx, w, h) => {
    ctx.fillStyle = '#fffdf6';
    ctx.fillRect(0, 0, w, h);
    // 促销条纹
    for (let i = -h; i < w; i += 46) {
      ctx.fillStyle = 'rgba(255,214,120,0.35)';
      ctx.beginPath();
      ctx.moveTo(i, h); ctx.lineTo(i + 20, h); ctx.lineTo(i + 20 + h, 0); ctx.lineTo(i + h, 0);
      ctx.closePath(); ctx.fill();
    }
    ctx.fillStyle = '#e8452f';
    ctx.font = `800 92px ${JP_FONT}`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('新商品入荷', w / 2, 92);
    ctx.fillStyle = '#2a3550';
    ctx.font = `700 56px ${JP_FONT}`;
    ctx.fillText('おにぎり 100円', w / 2, 182);
  });
}

/* -------------------------------------------------------------------- 海报 */
function posterBase(ctx, w, h, c1, c2) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, c1);
  g.addColorStop(1, c2);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = 'rgba(255,255,255,0.9)';
  ctx.lineWidth = 8;
  ctx.strokeRect(4, 4, w - 8, h - 8);
}

export function posterTexture(i = 0) {
  const variants = [
    (ctx, w, h) => {
      posterBase(ctx, w, h, '#ffe9a8', '#ffb457');
      ctx.fillStyle = '#7a3b12';
      ctx.font = `800 84px ${JP_FONT}`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('新発売', w / 2, 110);
      ctx.fillStyle = '#e8452f';
      ctx.font = `900 110px ${EN_FONT}`;
      ctx.fillText('SALE', w / 2, 250);
      ctx.fillStyle = '#2a3550';
      ctx.font = `700 52px ${JP_FONT}`;
      ctx.fillText('全品 2割引', w / 2, 350);
      // 商品剪影
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      ctx.beginPath(); ctx.ellipse(w / 2, 430, 90, 52, 0, 0, Math.PI * 2); ctx.fill();
    },
    (ctx, w, h) => {
      posterBase(ctx, w, h, '#cfeaff', '#7fc4ee');
      ctx.fillStyle = '#12405e';
      ctx.font = `800 76px ${JP_FONT}`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('ホットコーヒー', w / 2, 130);
      ctx.fillStyle = '#2b6f9c';
      ctx.font = `700 54px ${JP_FONT}`;
      ctx.fillText('あたたかい一杯を', w / 2, 230);
      // 咖啡杯
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.moveTo(w / 2 - 70, 300); ctx.lineTo(w / 2 + 70, 300);
      ctx.lineTo(w / 2 + 52, 440); ctx.lineTo(w / 2 - 52, 440); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#8a5a3b';
      ctx.fillRect(w / 2 - 62, 322, 124, 22);
      ctx.strokeStyle = 'rgba(255,255,255,0.85)';
      ctx.lineWidth = 12;
      ctx.beginPath(); ctx.arc(w / 2 + 84, 372, 30, -1.1, 1.1); ctx.stroke();
    },
    (ctx, w, h) => {
      posterBase(ctx, w, h, '#ffd9e6', '#ff9fbf');
      ctx.fillStyle = '#8c1f4d';
      ctx.font = `800 78px ${JP_FONT}`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('アイス', w / 2, 120);
      ctx.font = `800 78px ${JP_FONT}`;
      ctx.fillText('新作入荷', w / 2, 210);
      ctx.fillStyle = '#fff';
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.arc(w / 2 - 120 + i * 120, 350, 46, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = ['#ffe9a8', '#c7f0d8', '#ffd9e6'][i];
        ctx.fill();
        ctx.fillStyle = '#fff';
      }
      ctx.fillStyle = '#8c1f4d';
      ctx.font = `700 46px ${JP_FONT}`;
      ctx.fillText('コンビニスイーツ', w / 2, 452);
    },
  ];
  const v = variants[i % variants.length];
  return canvasTex(`poster${i}`, 420, 560, v);
}

export function noticeBoardTexture() {
  return canvasTex('notice', 512, 320, (ctx, w, h) => {
    ctx.fillStyle = '#4a3f34';
    ctx.fillRect(0, 0, w, h);
    const sheets = [
      ['#f6f2e4', 24, 22, 150, 120], ['#ffe9a8', 190, 30, 130, 100],
      ['#dff0ff', 336, 24, 152, 130], ['#f6f2e4', 40, 168, 190, 126],
      ['#ffe0e6', 250, 172, 120, 118],
    ];
    sheets.forEach(([c, x, y, sw, sh], i) => {
      ctx.save();
      ctx.translate(x + sw / 2, y + sh / 2);
      ctx.rotate((i - 2) * 0.035);
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.fillRect(-sw / 2 + 3, -sh / 2 + 4, sw, sh);
      ctx.fillStyle = c;
      ctx.fillRect(-sw / 2, -sh / 2, sw, sh);
      ctx.fillStyle = 'rgba(60,60,70,0.75)';
      for (let l = 0; l < 5; l++) {
        const lw = sw * (0.4 + Math.random() * 0.45);
        ctx.fillRect(-sw / 2 + 12, -sh / 2 + 26 + l * 16, lw, 5);
      }
      ctx.fillStyle = i % 2 ? '#e8452f' : '#1f9dd8';
      ctx.fillRect(-sw / 2 + 10, -sh / 2 + 8, sw * 0.5, 12);
      ctx.restore();
    });
  });
}

export function magazineTexture(i = 0) {
  const cols = [['#ffd166', '#e8452f'], ['#9ad9f0', '#1f5f8c'], ['#f4a3c0', '#7c2b52'], ['#c8f0c0', '#2f6b3a']];
  const [c1, c2] = cols[i % cols.length];
  return canvasTex(`mag${i}`, 200, 280, (ctx, w, h) => {
    ctx.fillStyle = c1; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = c2; ctx.fillRect(0, 0, w, 46);
    ctx.fillStyle = '#fff';
    ctx.font = `800 30px ${JP_FONT}`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(['週刊', 'コミック', 'グルメ', 'トラベル'][i % 4], w / 2, 24);
    // 封面人像剪影（抽象）
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.beginPath(); ctx.arc(w / 2, h * 0.52, 46, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(w / 2 - 62, h);
    ctx.quadraticCurveTo(w / 2, h * 0.66, w / 2 + 62, h);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    for (let l = 0; l < 3; l++) ctx.fillRect(18, 52 + l * 18, 70 + Math.random() * 60, 7);
  });
}

/* ------------------------------------------------------------------ 商品贴图 */
export function bottleTexture(hue = 0) {
  return canvasTex(`bottle${hue}`, 64, 128, (ctx, w, h) => {
    ctx.fillStyle = `hsl(${hue}, 62%, 88%)`;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = `hsl(${hue}, 68%, 58%)`;
    ctx.fillRect(0, 34, w, 40);
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.fillRect(0, 40, w, 6);
    ctx.fillStyle = `hsl(${hue}, 40%, 30%)`;
    ctx.font = `700 15px ${EN_FONT}`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.save(); ctx.translate(w / 2, 58); ctx.rotate(-Math.PI / 2);
    ctx.fillText('DRINK', 0, 0); ctx.restore();
  });
}

export function canTexture(hue = 0) {
  return canvasTex(`can${hue}`, 64, 64, (ctx, w, h) => {
    ctx.fillStyle = `hsl(${hue}, 70%, 62%)`;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.fillRect(0, 22, w, 20);
    ctx.fillStyle = `hsl(${hue}, 60%, 34%)`;
    ctx.font = `800 16px ${EN_FONT}`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('COLD', w / 2, 32);
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillRect(6, 0, 8, h);
  });
}

export function bentoTexture() {
  return canvasTex('bento', 128, 128, (ctx, w, h) => {
    ctx.fillStyle = '#f4f1e6'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#e8452f'; ctx.fillRect(0, 0, w, 26);
    ctx.fillStyle = '#fff';
    ctx.font = `700 18px ${JP_FONT}`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('弁当', w / 2, 13);
    ctx.fillStyle = '#d9c9a8';
    ctx.beginPath(); ctx.ellipse(w / 2, 78, 46, 32, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f6f4ee';
    ctx.beginPath(); ctx.ellipse(w / 2, 74, 30, 20, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#c94f3d';
    ctx.beginPath(); ctx.arc(w / 2 - 10, 74, 8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#7fae5c';
    ctx.fillRect(w / 2 + 16, 66, 16, 12);
  });
}

export function onigiriTexture() {
  return canvasTex('onigiri', 96, 96, (ctx, w, h) => {
    ctx.fillStyle = '#f7f5ee';
    ctx.beginPath();
    ctx.moveTo(w / 2, 16);
    ctx.quadraticCurveTo(w * 0.86, h * 0.72, w * 0.7, h * 0.8);
    ctx.lineTo(w * 0.3, h * 0.8);
    ctx.quadraticCurveTo(w * 0.14, h * 0.72, w / 2, 16);
    ctx.fill();
    ctx.fillStyle = '#2f4a3a';
    ctx.fillRect(w * 0.34, h * 0.62, w * 0.32, h * 0.2);
  });
}

export function snackTexture(i = 0) {
  const hue = (i * 67) % 360;
  return canvasTex(`snack${i}`, 96, 128, (ctx, w, h) => {
    ctx.fillStyle = `hsl(${hue}, 72%, 62%)`;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.fillRect(6, h * 0.42, w - 12, 26);
    ctx.fillStyle = `hsl(${hue}, 60%, 26%)`;
    ctx.font = `800 17px ${JP_FONT}`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('スナック', w / 2, h * 0.5);
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.beginPath(); ctx.arc(w * 0.72, h * 0.24, 22, 0, Math.PI * 2); ctx.fill();
  });
}

/* --------------------------------------------------------------- 雨 / 水效果 */
export function rainStreakTexture() {
  return canvasTex('rainStreak', 32, 128, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, 'rgba(255,255,255,0)');
    g.addColorStop(0.45, 'rgba(226,240,255,0.85)');
    g.addColorStop(0.75, 'rgba(255,255,255,0.55)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(w / 2 - 2, 0, 4, h);
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillRect(w / 2 - 4, h * 0.4, 8, h * 0.35);
  });
}

export function rippleTexture() {
  return canvasTex('ripple', 128, 128, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    const cx = w / 2, cy = h / 2;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(cx, cy, 12 + i * 18, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(220,238,255,${0.5 - i * 0.13})`;
      ctx.lineWidth = 3 - i * 0.6;
      ctx.stroke();
    }
  });
}

/** 玻璃上的雨痕：细流 + 水珠，用于玻璃面的粗糙度/法线扰动 */
export function rainGlassTexture() {
  return canvasTex('rainGlass', 512, 512, (ctx, w, h) => {
    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, w, h);
    // 纵向水流
    for (let i = 0; i < 46; i++) {
      const x = Math.random() * w;
      const len = 60 + Math.random() * 380;
      const y0 = Math.random() * h;
      const grad = ctx.createLinearGradient(x, y0, x, y0 + len);
      grad.addColorStop(0, 'rgba(120,120,120,0)');
      grad.addColorStop(0.3, 'rgba(210,210,210,0.55)');
      grad.addColorStop(1, 'rgba(150,150,150,0)');
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1 + Math.random() * 3.2;
      ctx.beginPath();
      ctx.moveTo(x, y0);
      ctx.bezierCurveTo(x + (Math.random() - 0.5) * 14, y0 + len * 0.4, x + (Math.random() - 0.5) * 14, y0 + len * 0.7, x + (Math.random() - 0.5) * 10, y0 + len);
      ctx.stroke();
    }
    // 水珠
    for (let i = 0; i < 420; i++) {
      const x = Math.random() * w, y = Math.random() * h, r = 1 + Math.random() * 4.2;
      const g2 = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, 0, x, y, r);
      g2.addColorStop(0, 'rgba(255,255,255,0.95)');
      g2.addColorStop(0.6, 'rgba(190,190,190,0.5)');
      g2.addColorStop(1, 'rgba(120,120,120,0)');
      ctx.fillStyle = g2;
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    }
  }, { linear: true, wrap: true });
}

/** 水面法线贴图：细密雨点凹坑，用于让积水的环境反射产生柔和扰动 */
export function waterNormalTexture() {
  return canvasTex('waterNormal', 256, 256, (ctx, w, h) => {
    const size = 256;
    const H = new Float32Array(size * size);
    const idx = (x, y) => ((y + size) % size) * size + ((x + size) % size);
    // 大量小凹坑（雨点落水）
    const rnd = (() => { let a = 20241019; return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; })();
    for (let i = 0; i < 150; i++) {
      const cx = rnd() * size, cy = rnd() * size, r = 3 + rnd() * 9, depth = 0.5 + rnd() * 0.5;
      const R = Math.ceil(r);
      for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) {
        const d = Math.hypot(dx, dy);
        if (d > r) continue;
        const f = Math.cos((d / r) * Math.PI * 0.5);
        H[idx(Math.round(cx + dx), Math.round(cy + dy))] -= f * depth * 0.06;
      }
    }
    // 轻微起伏
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      H[idx(x, y)] += Math.sin(x * 0.19) * Math.cos(y * 0.23) * 0.006;
    }
    const img = ctx.createImageData(size, size);
    const strength = 2.6;
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      const hl = H[idx(x - 1, y)], hr = H[idx(x + 1, y)];
      const hd = H[idx(x, y - 1)], hu = H[idx(x, y + 1)];
      let nx = (hl - hr) * strength, ny = (hd - hu) * strength, nz = 1;
      const len = Math.hypot(nx, ny, nz);
      nx /= len; ny /= len; nz /= len;
      const o = idx(x, y) * 4;
      img.data[o + 0] = (nx * 0.5 + 0.5) * 255;
      img.data[o + 1] = (ny * 0.5 + 0.5) * 255;
      img.data[o + 2] = (nz * 0.5 + 0.5) * 255;
      img.data[o + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
  }, { linear: true, wrap: true });
}

/** 积水形状遮罩（柔和圆斑，用作 alphaMap） */
export function puddleMask(seed = 1) {
  return canvasTex(`puddleMask${seed}`, 256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, w, h);
    const cx = w / 2, cy = h / 2;
    // 主体不规则形状
    ctx.beginPath();
    const pts = 22;
    for (let i = 0; i <= pts; i++) {
      const a = (i / pts) * Math.PI * 2;
      const rr = 0.62 + Math.sin(a * 3 + seed) * 0.09 + Math.sin(a * 5 - seed * 2) * 0.05;
      const x = cx + Math.cos(a) * w * 0.5 * rr * 0.94;
      const y = cy + Math.sin(a) * h * 0.5 * rr * 0.82;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle = '#fff';
    ctx.fill();
    // 边缘柔化
    ctx.filter = 'blur(6px)';
    ctx.drawImage(ctx.canvas, 0, 0);
    ctx.filter = 'none';
  }, { linear: true });
}

/** 便利店地面导视（箭头 / 足元注意） */
export function floorDecalTexture() {
  return canvasTex('floorDecal', 256, 256, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(60,140,200,0.75)';
    // 箭头
    ctx.beginPath();
    ctx.moveTo(w / 2, 40);
    ctx.lineTo(w / 2 + 54, 118);
    ctx.lineTo(w / 2 + 22, 118);
    ctx.lineTo(w / 2 + 22, 200);
    ctx.lineTo(w / 2 - 22, 200);
    ctx.lineTo(w / 2 - 22, 118);
    ctx.lineTo(w / 2 - 54, 118);
    ctx.closePath();
    ctx.fill();
  });
}

/** 落水管滴水用的“水滴串”贴图 */
export function dripTexture() {
  return canvasTex('drip', 64, 256, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, 'rgba(200,230,255,0)');
    g.addColorStop(0.25, 'rgba(215,238,255,0.75)');
    g.addColorStop(0.55, 'rgba(255,255,255,0.95)');
    g.addColorStop(0.85, 'rgba(200,230,255,0.5)');
    g.addColorStop(1, 'rgba(200,230,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(w / 2 - 2, 0, 4, h);
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.beginPath(); ctx.ellipse(w / 2, h * 0.6, 4.5, 7, 0, 0, Math.PI * 2); ctx.fill();
  });
}

/* --------------------------------------------------------------- 路面标线组 */
export function crosswalkTexture() {
  return canvasTex('crosswalk', 512, 256, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(226,233,242,0.92)';
    const stripes = 7, sw = w / (stripes * 2 - 1);
    for (let i = 0; i < stripes; i++) {
      ctx.fillRect(i * sw * 2, 12, sw, h - 24);
    }
    // 磨损
    for (let i = 0; i < 700; i++) {
      ctx.fillStyle = `rgba(60,66,80,${Math.random() * 0.22})`;
      ctx.fillRect(Math.random() * w, Math.random() * h, 2 + Math.random() * 4, 2 + Math.random() * 3);
    }
  });
}

export function manholeTexture() {
  return canvasTex('manhole', 128, 128, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#6b7484';
    ctx.beginPath(); ctx.arc(w / 2, h / 2, w * 0.46, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#3c4353';
    ctx.lineWidth = 3;
    for (let r = 12; r < w * 0.44; r += 9) {
      ctx.beginPath(); ctx.arc(w / 2, h / 2, r, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.beginPath(); ctx.arc(w / 2, h / 2, w * 0.46, 0, Math.PI * 2); ctx.stroke();
  });
}

export function drainTexture() {
  return canvasTex('drain', 128, 64, (ctx, w, h) => {
    ctx.fillStyle = '#4c5364';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#232936';
    for (let i = 0; i < 9; i++) ctx.fillRect(8 + i * 13, 8, 7, h - 16);
    ctx.strokeStyle = '#7d8698';
    ctx.lineWidth = 3;
    ctx.strokeRect(2, 2, w - 4, h - 4);
  });
}

export function neonSignTexture(text = '居酒屋', color = '#ff6fa8') {
  return canvasTex(`neon${text}`, 256, 128, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.font = `800 74px ${JP_FONT}`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.shadowColor = color;
    ctx.shadowBlur = 22;
    ctx.fillStyle = '#fff8fc';
    ctx.fillText(text, w / 2, h / 2);
    ctx.shadowBlur = 10;
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.55;
    ctx.fillText(text, w / 2, h / 2);
    ctx.globalAlpha = 1;
  });
}

export function roadSignTexture(kind = 'parking') {
  const conf = {
    parking: { bg: '#1f6fb2', fg: '#ffffff', text: 'P', sub: '駐車場' },
    stop: { bg: '#c8342b', fg: '#ffffff', text: '止まれ', sub: 'STOP' },
    konbini: { bg: '#1f9dd8', fg: '#ffffff', text: 'コンビニ', sub: '100m' },
    noParking: { bg: '#1f6fb2', fg: '#ffffff', text: '駐車禁止', sub: 'NO PARKING' },
  }[kind] || {};
  return canvasTex(`roadSign${kind}`, 256, 256, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    if (kind === 'stop') {
      ctx.fillStyle = conf.bg;
      ctx.beginPath();
      ctx.moveTo(w * 0.5, 6); ctx.lineTo(w - 6, h * 0.32); ctx.lineTo(w - 6, h * 0.68);
      ctx.lineTo(w * 0.5, h - 6); ctx.lineTo(6, h * 0.68); ctx.lineTo(6, h * 0.32);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = `800 62px ${JP_FONT}`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('止まれ', w / 2, h / 2 + 4);
      return;
    }
    ctx.fillStyle = conf.bg;
    ctx.fillRect(10, 10, w - 20, h - 20);
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = 8;
    ctx.strokeRect(18, 18, w - 36, h - 36);
    ctx.fillStyle = conf.fg;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    if (kind === 'parking') {
      ctx.font = `800 150px ${EN_FONT}`;
      ctx.fillText('P', w / 2, h / 2 - 8);
      ctx.font = `700 34px ${JP_FONT}`;
      ctx.fillText(conf.sub, w / 2, h - 52);
    } else {
      ctx.font = `800 54px ${JP_FONT}`;
      ctx.fillText(conf.text, w / 2, h / 2 - 10);
      ctx.font = `700 30px ${EN_FONT}`;
      ctx.fillText(conf.sub, w / 2, h / 2 + 46);
    }
  });
}

/** 便利店门上的营业贴纸（营业中 / 24小时） */
export function doorStickerTexture() {
  return canvasTex('doorSticker', 128, 256, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#1f9dd8';
    ctx.fillRect(0, 0, w, 52);
    ctx.fillStyle = '#fff';
    ctx.font = `800 30px ${JP_FONT}`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('営業中', w / 2, 26);
    ctx.fillStyle = '#2a3550';
    ctx.font = `700 26px ${JP_FONT}`;
    ctx.fillText('24時間', w / 2, 96);
    ctx.fillText('年中無休', w / 2, 138);
    ctx.fillStyle = '#e8452f';
    ctx.fillRect(16, 168, w - 32, 44);
    ctx.fillStyle = '#fff';
    ctx.font = `800 22px ${JP_FONT}`;
    ctx.fillText('防犯カメラ', w / 2, 190);
  });
}

export { JP_FONT, EN_FONT };
