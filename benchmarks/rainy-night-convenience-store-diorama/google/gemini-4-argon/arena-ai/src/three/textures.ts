import * as THREE from 'three';

/** Rounded-gothic family used for all in-world Japanese signage. */
export const SIGN_FONT = '"M PLUS Rounded 1c", "Hiragino Maru Gothic ProN", "Yu Gothic", sans-serif';

function mk(w: number, h: number) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d')!;
  return { c, g };
}

function finish(c: HTMLCanvasElement, rx = 1, ry = 1) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = THREE.RepeatWrapping;
  t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(rx, ry);
  t.anisotropy = 4;
  return t;
}

function noiseDots(
  g: CanvasRenderingContext2D,
  w: number,
  h: number,
  count: number,
  colors: string[],
  size = 2
) {
  for (let i = 0; i < count; i++) {
    g.fillStyle = colors[(Math.random() * colors.length) | 0];
    g.globalAlpha = 0.14 + Math.random() * 0.4;
    const s = size * (0.5 + Math.random());
    g.fillRect(Math.random() * w, Math.random() * h, s, s);
  }
  g.globalAlpha = 1;
}

/* ---------- studio backdrop ---------- */
export function makeBackdrop(): THREE.Texture {
  const { c, g } = mk(16, 512);
  const grd = g.createLinearGradient(0, 0, 0, 512);
  grd.addColorStop(0, '#05070f');
  grd.addColorStop(0.34, '#0b1226');
  grd.addColorStop(0.62, '#182041');
  grd.addColorStop(0.82, '#2b2a4d');
  grd.addColorStop(1, '#3a2f4a');
  g.fillStyle = grd;
  g.fillRect(0, 0, 16, 512);
  // faint stars in the upper band
  for (let i = 0; i < 40; i++) {
    const y = Math.random() * 250;
    g.globalAlpha = 0.12 + Math.random() * 0.35;
    g.fillStyle = '#cfe3ff';
    g.fillRect(Math.random() * 16, y, 1, 1);
  }
  g.globalAlpha = 1;
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/* ---------- ground surfaces ---------- */
export function makeAsphalt(): THREE.Texture {
  const { c, g } = mk(256, 256);
  g.fillStyle = '#2b3140';
  g.fillRect(0, 0, 256, 256);
  noiseDots(g, 256, 256, 2600, ['#212634', '#343b4d', '#3b4256', '#1b1f2b'], 2.4);
  // soft patches
  for (let i = 0; i < 26; i++) {
    g.globalAlpha = 0.05;
    g.fillStyle = i % 2 ? '#4a5165' : '#191d28';
    g.beginPath();
    g.ellipse(
      Math.random() * 256,
      Math.random() * 256,
      18 + Math.random() * 46,
      12 + Math.random() * 30,
      Math.random() * 3,
      0,
      Math.PI * 2
    );
    g.fill();
  }
  g.globalAlpha = 1;
  // cracks
  g.strokeStyle = 'rgba(18,21,30,0.5)';
  for (let i = 0; i < 7; i++) {
    g.lineWidth = 0.8 + Math.random();
    g.beginPath();
    let x = Math.random() * 256;
    let y = Math.random() * 256;
    g.moveTo(x, y);
    for (let s = 0; s < 6; s++) {
      x += (Math.random() - 0.5) * 46;
      y += (Math.random() - 0.5) * 46;
      g.lineTo(x, y);
    }
    g.stroke();
  }
  return finish(c, 7, 7);
}

export function makeSidewalk(): THREE.Texture {
  const { c, g } = mk(256, 256);
  g.fillStyle = '#6f7686';
  g.fillRect(0, 0, 256, 256);
  // 2x2 tile grid
  for (let ty = 0; ty < 2; ty++) {
    for (let tx = 0; tx < 2; tx++) {
      const x = tx * 128;
      const y = ty * 128;
      const l = 68 + ((tx + ty) % 2) * 5;
      g.fillStyle = `rgb(${l + 34},${l + 38},${l + 50})`;
      g.fillRect(x + 4, y + 4, 120, 120);
      g.strokeStyle = 'rgba(40,46,60,0.55)';
      g.lineWidth = 4;
      g.strokeRect(x + 2, y + 2, 124, 124);
    }
  }
  noiseDots(g, 256, 256, 2200, ['#5c6474', '#7e8698', '#8b93a5', '#4e5566'], 2);
  return finish(c, 1, 1);
}

export function makeStoreFloor(): THREE.Texture {
  const { c, g } = mk(256, 256);
  g.fillStyle = '#e8e4d8';
  g.fillRect(0, 0, 256, 256);
  g.strokeStyle = 'rgba(150,150,140,0.55)';
  g.lineWidth = 2;
  for (let i = 0; i <= 4; i++) {
    g.beginPath();
    g.moveTo((i * 256) / 4, 0);
    g.lineTo((i * 256) / 4, 256);
    g.moveTo(0, (i * 256) / 4);
    g.lineTo(256, (i * 256) / 4);
    g.stroke();
  }
  noiseDots(g, 256, 256, 900, ['#dcd8cc', '#f2efe6', '#d2cec2'], 2);
  return finish(c, 9, 7);
}

/* ---------- signage ---------- */
export function makeStoreSign(): THREE.Texture {
  const { c, g } = mk(1024, 192);
  g.fillStyle = '#f4f8f6';
  g.fillRect(0, 0, 1024, 192);
  // signature wave bands
  g.fillStyle = '#1fa46b';
  g.beginPath();
  g.moveTo(0, 150);
  for (let x = 0; x <= 1024; x += 8) {
    g.lineTo(x, 150 + Math.sin(x * 0.011) * 13);
  }
  g.lineTo(1024, 192);
  g.lineTo(0, 192);
  g.closePath();
  g.fill();
  g.fillStyle = '#2b7fd4';
  g.beginPath();
  g.moveTo(0, 168);
  for (let x = 0; x <= 1024; x += 8) {
    g.lineTo(x, 168 + Math.sin(x * 0.011 + 0.6) * 10);
  }
  g.lineTo(1024, 192);
  g.lineTo(0, 192);
  g.closePath();
  g.fill();
  g.fillStyle = '#f2762e';
  g.fillRect(0, 186, 1024, 6);

  // crescent moon logo
  g.save();
  g.translate(96, 74);
  g.fillStyle = '#f7b731';
  g.beginPath();
  g.arc(0, 0, 42, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#f4f8f6';
  g.beginPath();
  g.arc(17, -13, 38, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#1c2a44';
  g.font = 'bold 26px ' + SIGN_FONT;
  g.textAlign = 'center';
  g.fillText('24h', -6, 34);
  g.restore();

  g.textAlign = 'left';
  g.fillStyle = '#16233c';
  g.font = 'bold 92px ' + SIGN_FONT;
  g.fillText('ツキミマート', 176, 106);
  g.fillStyle = '#1fa46b';
  g.font = 'bold 30px ' + SIGN_FONT;
  g.fillText('TSUKIMI  MART', 182, 142);

  g.textAlign = 'right';
  g.fillStyle = '#16233c';
  g.font = 'bold 34px ' + SIGN_FONT;
  g.fillText('24時間営業', 990, 74);
  g.fillStyle = '#e0483c';
  g.font = 'bold 24px ' + SIGN_FONT;
  g.fillText('ATM お酒 たばこ', 990, 112);
  return finish(c);
}

export function makePoleSign(): THREE.Texture {
  const { c, g } = mk(256, 512);
  g.fillStyle = '#eef5f2';
  g.fillRect(0, 0, 256, 512);
  g.fillStyle = '#1fa46b';
  g.fillRect(0, 0, 256, 26);
  g.fillRect(0, 486, 256, 26);
  g.fillStyle = '#2b7fd4';
  g.fillRect(0, 26, 256, 8);

  g.save();
  g.translate(128, 118);
  g.fillStyle = '#f7b731';
  g.beginPath();
  g.arc(0, 0, 52, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#eef5f2';
  g.beginPath();
  g.arc(21, -16, 47, 0, Math.PI * 2);
  g.fill();
  g.restore();

  g.textAlign = 'center';
  g.fillStyle = '#16233c';
  g.font = 'bold 46px ' + SIGN_FONT;
  const chars = ['ツ', 'キ', 'ミ'];
  chars.forEach((ch, i) => g.fillText(ch, 128, 232 + i * 56));
  g.fillStyle = '#e0483c';
  g.font = 'bold 34px ' + SIGN_FONT;
  g.fillText('24H', 128, 430);
  g.fillStyle = '#16233c';
  g.font = 'bold 22px ' + SIGN_FONT;
  g.fillText('OPEN', 128, 464);
  return finish(c);
}

export function makeSideSign(): THREE.Texture {
  const { c, g } = mk(128, 512);
  g.fillStyle = '#f2f7f5';
  g.fillRect(0, 0, 128, 512);
  g.fillStyle = '#1fa46b';
  g.fillRect(0, 0, 128, 18);
  g.fillStyle = '#2b7fd4';
  g.fillRect(0, 18, 128, 6);
  g.textAlign = 'center';
  g.fillStyle = '#16233c';
  g.font = 'bold 44px ' + SIGN_FONT;
  ['ツ', 'キ', 'ミ', 'マ', 'ー', 'ト'].forEach((ch, i) =>
    g.fillText(ch, 64, 96 + i * 62)
  );
  return finish(c);
}

/* ---------- vending machines ---------- */
export function makeVending(kind: 'drink' | 'coffee' | 'water'): THREE.Texture {
  const { c, g } = mk(256, 512);
  const body =
    kind === 'drink' ? '#d8453c' : kind === 'coffee' ? '#2f3b63' : '#2c8fb8';
  const accent =
    kind === 'drink' ? '#ffd23f' : kind === 'coffee' ? '#e8a13a' : '#bdeeff';
  g.fillStyle = body;
  g.fillRect(0, 0, 256, 512);
  g.fillStyle = 'rgba(0,0,0,0.22)';
  g.fillRect(0, 0, 256, 74);
  // top brand band
  g.fillStyle = accent;
  g.fillRect(14, 20, 228, 40);
  g.fillStyle = '#1a1f2e';
  g.font = 'bold 26px ' + SIGN_FONT;
  g.textAlign = 'center';
  g.fillText(
    kind === 'drink' ? 'つめたい' : kind === 'coffee' ? 'COFFEE' : '天然水',
    128,
    49
  );
  g.fillStyle = '#f6f8fb';
  g.font = 'bold 15px ' + SIGN_FONT;
  g.fillText(kind === 'coffee' ? '挽きたて' : 'あたたかい もあります', 128, 70);

  // drink grid behind glass
  g.fillStyle = 'rgba(12,18,30,0.72)';
  g.fillRect(14, 86, 176, 286);
  const cols = 4;
  const rows = 5;
  for (let r = 0; r < rows; r++) {
    for (let cc = 0; cc < cols; cc++) {
      const x = 22 + cc * 42;
      const y = 94 + r * 55;
      const hue = [
        '#ff8a3d',
        '#4fd1c5',
        '#f6e05e',
        '#fc8181',
        '#90cdf4',
        '#9ae6b4',
      ][(r * cols + cc) % 6];
      // shelf
      g.fillStyle = 'rgba(255,255,255,0.16)';
      g.fillRect(x - 4, y + 44, 42, 4);
      // bottle
      g.fillStyle = hue;
      if ((r + cc) % 3 === 0) {
        g.fillRect(x + 8, y + 6, 20, 38);
        g.fillRect(x + 13, y, 10, 8);
      } else {
        g.beginPath();
        g.roundRect(x + 7, y + 8, 22, 36, 5);
        g.fill();
        g.fillStyle = 'rgba(255,255,255,0.55)';
        g.fillRect(x + 9, y + 20, 18, 9);
      }
      // price tag
      g.fillStyle = '#f2f5f9';
      g.fillRect(x + 4, y + 48, 28, 7);
    }
  }
  // glass sheen
  const gl = g.createLinearGradient(14, 86, 190, 372);
  gl.addColorStop(0, 'rgba(255,255,255,0.24)');
  gl.addColorStop(0.4, 'rgba(255,255,255,0.03)');
  gl.addColorStop(1, 'rgba(255,255,255,0.16)');
  g.fillStyle = gl;
  g.fillRect(14, 86, 176, 286);

  // selection buttons
  for (let r = 0; r < rows; r++) {
    g.fillStyle = r % 2 ? '#ff6b6b' : '#7ee08a';
    g.beginPath();
    g.arc(204, 112 + r * 55, 7, 0, Math.PI * 2);
    g.fill();
  }
  // dispenser + coin slot
  g.fillStyle = 'rgba(0,0,0,0.45)';
  g.fillRect(20, 388, 150, 62);
  g.fillStyle = '#12161f';
  g.fillRect(30, 398, 130, 42);
  g.fillStyle = accent;
  g.fillRect(196, 388, 40, 30);
  g.fillStyle = '#12161f';
  g.fillRect(206, 396, 20, 14);
  g.fillStyle = '#e9edf3';
  g.fillRect(196, 428, 40, 20);
  // bottom vent
  g.fillStyle = 'rgba(0,0,0,0.3)';
  for (let i = 0; i < 8; i++) g.fillRect(20 + i * 27, 468, 18, 26);
  return finish(c);
}

/* ---------- posters / magazines ---------- */
export function makePoster(i: number): THREE.Texture {
  const { c, g } = mk(256, 356);
  const schemes = [
    ['#ffd9a0', '#ef5b5b', '#2b3a67'],
    ['#bfe3ff', '#2f9bd8', '#132a45'],
    ['#d7f5c9', '#3fae5a', '#1d3b2a'],
    ['#ffe3f0', '#e2549b', '#3d1f33'],
    ['#fff3b0', '#e9a72c', '#3a2a10'],
  ];
  const [bg, main, ink] = schemes[i % schemes.length];
  g.fillStyle = bg;
  g.fillRect(0, 0, 256, 356);
  g.strokeStyle = '#ffffff';
  g.lineWidth = 8;
  g.strokeRect(4, 4, 248, 348);

  // big graphic
  g.fillStyle = main;
  if (i % 3 === 0) {
    g.beginPath();
    g.arc(128, 132, 78, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = bg;
    g.beginPath();
    g.arc(158, 108, 66, 0, Math.PI * 2);
    g.fill();
  } else if (i % 3 === 1) {
    g.beginPath();
    g.moveTo(128, 46);
    g.lineTo(214, 208);
    g.lineTo(42, 208);
    g.closePath();
    g.fill();
  } else {
    for (let k = 0; k < 5; k++) {
      g.globalAlpha = 0.85;
      g.fillRect(28 + k * 8, 60 + k * 22, 200 - k * 16, 16);
    }
    g.globalAlpha = 1;
  }

  g.fillStyle = ink;
  g.textAlign = 'center';
  g.font = 'bold 40px ' + SIGN_FONT;
  const titles = ['新作弁当', '冬の甘味', 'あったか', '夜のおとも', 'ポイント2倍'];
  g.fillText(titles[i % titles.length], 128, 264);
  g.font = 'bold 22px ' + SIGN_FONT;
  g.fillText('12/1 → 12/25', 128, 298);
  g.fillStyle = main;
  g.fillRect(46, 314, 164, 26);
  g.fillStyle = '#fff';
  g.font = 'bold 19px ' + SIGN_FONT;
  g.fillText('くわしくは店内で', 128, 333);
  return finish(c);
}

export function makeMagazine(i: number): THREE.Texture {
  const { c, g } = mk(128, 176);
  const bg = ['#f2f4f8', '#1d2740', '#fdecec', '#eaf6ea', '#fff6e0'][i % 5];
  g.fillStyle = bg;
  g.fillRect(0, 0, 128, 176);
  const ink = bg === '#1d2740' ? '#ffffff' : '#1d2740';
  g.fillStyle = ['#e2545f', '#3f8fd4', '#e0a13a', '#5aa469'][i % 4];
  g.fillRect(10, 44, 108, 74);
  g.fillStyle = 'rgba(255,255,255,0.5)';
  g.beginPath();
  g.arc(64, 78, 26, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = ink;
  g.textAlign = 'center';
  g.font = 'bold 26px ' + SIGN_FONT;
  g.fillText(['月刊', '週刊', '特集', '漫画'][i % 4], 64, 34);
  g.font = 'bold 13px ' + SIGN_FONT;
  for (let k = 0; k < 3; k++) g.fillRect(14, 128 + k * 13, 100 - k * 22, 7);
  return finish(c);
}

/* ---------- product shelves ---------- */
export function makeDrinkCase(): THREE.Texture {
  const { c, g } = mk(512, 256);
  g.fillStyle = '#dfe9f2';
  g.fillRect(0, 0, 512, 256);
  for (let r = 0; r < 3; r++) {
    const y = 12 + r * 82;
    g.fillStyle = '#c3d0dd';
    g.fillRect(0, y + 66, 512, 8);
    for (let i = 0; i < 16; i++) {
      const x = 8 + i * 31;
      const hue = [
        '#e2574c',
        '#4aa3df',
        '#69c07a',
        '#f0b429',
        '#b57edc',
        '#f2f5f9',
      ][(i + r * 3) % 6];
      g.fillStyle = hue;
      g.beginPath();
      g.roundRect(x, y + 12, 22, 54, 4);
      g.fill();
      g.fillStyle = 'rgba(255,255,255,0.62)';
      g.fillRect(x + 2, y + 30, 18, 12);
      g.fillStyle = hue;
      g.fillRect(x + 7, y + 2, 8, 12);
    }
  }
  return finish(c);
}

export function makeBentoCase(): THREE.Texture {
  const { c, g } = mk(512, 256);
  g.fillStyle = '#f3efe4';
  g.fillRect(0, 0, 512, 256);
  for (let r = 0; r < 3; r++) {
    const y = 8 + r * 84;
    g.fillStyle = '#ddd6c4';
    g.fillRect(0, y + 70, 512, 6);
    for (let i = 0; i < 8; i++) {
      const x = 10 + i * 63;
      g.fillStyle = ['#2f3b52', '#8c3b2e', '#3f6b46', '#6b4a86'][i % 4];
      g.beginPath();
      g.roundRect(x, y + 16, 54, 46, 4);
      g.fill();
      g.fillStyle = '#f7f3e8';
      g.fillRect(x + 5, y + 22, 44, 16);
      g.fillStyle = '#e0a13a';
      g.fillRect(x + 8, y + 42, 14, 10);
      g.fillStyle = '#d8564a';
      g.fillRect(x + 26, y + 42, 10, 10);
      g.fillStyle = '#f9d71c';
      g.beginPath();
      g.moveTo(x + 44, y + 52);
      g.lineTo(x + 52, y + 38);
      g.lineTo(x + 60, y + 52);
      g.closePath();
      g.fill();
      // price tag
      g.fillStyle = '#fff';
      g.fillRect(x + 4, y + 62, 22, 8);
    }
  }
  return finish(c);
}

export function makeSnackShelf(): THREE.Texture {
  const { c, g } = mk(256, 256);
  g.fillStyle = '#efe7d6';
  g.fillRect(0, 0, 256, 256);
  for (let r = 0; r < 4; r++) {
    const y = 6 + r * 63;
    g.fillStyle = '#cbbfa6';
    g.fillRect(0, y + 52, 256, 6);
    for (let i = 0; i < 6; i++) {
      const x = 6 + i * 41;
      g.fillStyle = [
        '#e2574c',
        '#f0b429',
        '#4aa3df',
        '#69c07a',
        '#e77fb8',
        '#f5f0e6',
      ][(i * 3 + r) % 6];
      g.beginPath();
      g.roundRect(x, y + 8, 34, 44, 3);
      g.fill();
      g.fillStyle = 'rgba(255,255,255,0.7)';
      g.fillRect(x + 4, y + 20, 26, 12);
    }
  }
  return finish(c);
}

/* ---------- distant apartment facade ---------- */
export function makeFacade(): { map: THREE.Texture; emissive: THREE.Texture } {
  const W = 512;
  const H = 256;
  const a = mk(W, H);
  const b = mk(W, H);
  const g = a.g;
  const e = b.g;

  g.fillStyle = '#2a3040';
  g.fillRect(0, 0, W, H);
  e.fillStyle = '#000000';
  e.fillRect(0, 0, W, H);

  const cols = 10;
  const rows = 5;
  for (let r = 0; r < rows; r++) {
    for (let cx = 0; cx < cols; cx++) {
      const x = 12 + cx * 50;
      const y = 14 + r * 48;
      g.fillStyle = '#202634';
      g.fillRect(x, y, 34, 30);
      g.fillStyle = '#3a4256';
      g.fillRect(x - 3, y + 30, 40, 6); // balcony ledge
      g.strokeStyle = '#454e63';
      g.lineWidth = 2;
      g.strokeRect(x - 3, y + 12, 40, 20);
      const lit = Math.random();
      if (lit > 0.46) {
        const warm = Math.random() > 0.28;
        e.fillStyle = warm ? '#ffcf87' : '#9fd0ff';
        e.globalAlpha = 0.55 + Math.random() * 0.45;
        e.fillRect(x + 2, y + 2, 30, 26);
        e.globalAlpha = 1;
        g.fillStyle = warm ? '#8a6a3c' : '#4d6a86';
        g.fillRect(x + 2, y + 2, 30, 26);
      } else {
        g.fillStyle = '#141926';
        g.fillRect(x + 2, y + 2, 30, 26);
      }
    }
  }
  noiseDots(g, W, H, 1400, ['#232937', '#343c4e', '#1b202c'], 2);

  const map = finish(a.c, 1, 1);
  const emissive = finish(b.c, 1, 1);
  return { map, emissive };
}

/* ---------- storefront glass sheen ---------- */
export function makeGlassSheen(): THREE.Texture {
  const { c, g } = mk(256, 256);
  const grd = g.createLinearGradient(0, 256, 256, 0);
  grd.addColorStop(0, 'rgba(255,255,255,0)');
  grd.addColorStop(0.3, 'rgba(190,225,255,0.10)');
  grd.addColorStop(0.4, 'rgba(255,255,255,0.26)');
  grd.addColorStop(0.47, 'rgba(190,225,255,0.05)');
  grd.addColorStop(0.6, 'rgba(255,255,255,0.14)');
  grd.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, 256, 256);
  const b = g.createLinearGradient(0, 256, 0, 140);
  b.addColorStop(0, 'rgba(255,222,170,0.3)');
  b.addColorStop(1, 'rgba(255,222,170,0)');
  g.fillStyle = b;
  g.fillRect(0, 140, 256, 116);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/* ---------- soft radial sprite (steam / glow) ---------- */
export function makeSoftDot(inner = 'rgba(255,255,255,0.9)'): THREE.Texture {
  const { c, g } = mk(128, 128);
  const grd = g.createRadialGradient(64, 64, 2, 64, 64, 62);
  grd.addColorStop(0, inner);
  grd.addColorStop(0.45, 'rgba(255,255,255,0.28)');
  grd.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
