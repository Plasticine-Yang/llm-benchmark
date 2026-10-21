import * as THREE from 'three';

function canvasTexture(width, height, paint) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  paint(ctx, width, height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

export function labelTexture({
  width = 1024,
  height = 256,
  background = '#f8f5dc',
  foreground = '#173245',
  accent = '#28b9ab',
  title = '森 MART',
  subtitle = '24時間・いつでも、ほっと。',
  border = true,
} = {}) {
  return canvasTexture(width, height, (ctx, w, h) => {
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, w, h);
    if (border) {
      ctx.fillStyle = accent;
      ctx.fillRect(0, 0, w, h * 0.13);
      ctx.fillStyle = '#ff6f6d';
      ctx.fillRect(0, h * 0.87, w, h * 0.13);
    }
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.arc(w * .12, h * .5, h * .26, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = `800 ${h * .3}px "M PLUS Rounded 1c", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('森', w * .12, h * .5);
    ctx.textAlign = 'left';
    ctx.fillStyle = foreground;
    ctx.font = `800 ${h * .36}px "M PLUS Rounded 1c", sans-serif`;
    ctx.fillText(title, w * .22, h * .48);
    ctx.fillStyle = '#58707b';
    ctx.font = `700 ${h * .11}px "M PLUS Rounded 1c", sans-serif`;
    ctx.fillText(subtitle, w * .225, h * .71);
  });
}

export function posterTexture(kind = 0) {
  const themes = [
    ['#f8d66d', '#ef625e', 'あったか\nおでん', '今夜も ほっ。'],
    ['#b4dfec', '#287c9c', '雨の日\n珈琲', '一杯 ¥120'],
    ['#e8b7ce', '#8b4d80', '秋の\n新作', '甘いごほうび'],
    ['#b8dfb0', '#267d66', 'おむすび', 'できたて気分'],
  ];
  const [bg, fg, title, sub] = themes[kind % themes.length];
  return canvasTexture(256, 384, (ctx, w, h) => {
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = fg;
    ctx.beginPath();
    ctx.arc(w * .72, h * .2, w * .32, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.9)';
    ctx.beginPath();
    ctx.arc(w * .72, h * .2, w * .19, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = fg;
    ctx.font = `800 ${w * .18}px "M PLUS Rounded 1c", sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    title.split('\n').forEach((line, i) => ctx.fillText(line, w * .09, h * (.42 + i * .16)));
    ctx.font = `700 ${w * .085}px "M PLUS Rounded 1c", sans-serif`;
    ctx.fillText(sub, w * .09, h * .82);
    ctx.strokeStyle = 'rgba(255,255,255,.8)';
    ctx.lineWidth = 8;
    ctx.strokeRect(10, 10, w - 20, h - 20);
  });
}

export function vendingTexture() {
  return canvasTexture(512, 768, (ctx, w, h) => {
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#eafaff');
    grad.addColorStop(1, '#a9dbe5');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#ef5d69';
    ctx.fillRect(0, 0, w, h * .12);
    ctx.fillStyle = '#fff';
    ctx.font = `800 ${w * .08}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('つめたい  •  あたたかい', w / 2, h * .06);
    const colors = ['#55a8d8', '#f48279', '#f3cc62', '#70bd89', '#d98ab7'];
    for (let row = 0; row < 4; row++) {
      ctx.fillStyle = 'rgba(20,53,74,.18)';
      ctx.fillRect(w * .06, h * (.15 + row * .15), w * .88, h * .125);
      for (let col = 0; col < 6; col++) {
        const x = w * (.1 + col * .145);
        const y = h * (.17 + row * .15);
        ctx.fillStyle = colors[(row + col) % colors.length];
        ctx.fillRect(x, y, w * .075, h * .07);
        ctx.fillStyle = '#f7fbef';
        ctx.fillRect(x + w * .015, y + h * .014, w * .045, h * .01);
      }
    }
    ctx.fillStyle = '#264158';
    ctx.fillRect(w * .08, h * .79, w * .52, h * .12);
    ctx.fillStyle = '#f6f7e9';
    ctx.fillRect(w * .7, h * .76, w * .2, h * .18);
    ctx.fillStyle = '#182638';
    ctx.fillRect(w * .73, h * .8, w * .14, h * .03);
  });
}

export function roadTexture() {
  return canvasTexture(512, 512, (ctx, w, h) => {
    ctx.fillStyle = '#1c2c40';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 2800; i++) {
      const v = 35 + Math.random() * 40;
      ctx.fillStyle = `rgba(${v},${v + 12},${v + 18},${Math.random() * .18})`;
      const s = Math.random() * 2.3;
      ctx.fillRect(Math.random() * w, Math.random() * h, s, s);
    }
    for (let i = 0; i < 35; i++) {
      ctx.strokeStyle = `rgba(110,145,165,${Math.random() * .05})`;
      ctx.lineWidth = Math.random() * 3;
      ctx.beginPath();
      const x = Math.random() * w;
      const y = Math.random() * h;
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.random() * 80 - 40, y + Math.random() * 80 - 40);
      ctx.stroke();
    }
  });
}

export function rainStreakTexture() {
  const texture = canvasTexture(256, 512, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.lineCap = 'round';
    for (let i = 0; i < 30; i++) {
      const x = Math.random() * w;
      const y = Math.random() * h;
      const len = 18 + Math.random() * 90;
      const grad = ctx.createLinearGradient(x, y, x, y + len);
      grad.addColorStop(0, 'rgba(220,245,255,0)');
      grad.addColorStop(.6, `rgba(220,245,255,${.08 + Math.random() * .17})`);
      grad.addColorStop(1, 'rgba(220,245,255,0)');
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1 + Math.random() * 2;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - 3, y + len);
      ctx.stroke();
    }
  });
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2);
  return texture;
}

export function windowGlowTexture() {
  return canvasTexture(64, 256, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, 'rgba(255,239,177,0)');
    g.addColorStop(.25, 'rgba(255,219,127,.55)');
    g.addColorStop(1, 'rgba(255,174,77,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  });
}
