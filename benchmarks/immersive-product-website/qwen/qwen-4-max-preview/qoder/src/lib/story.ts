export const STORY_DURATION = 90;

export const STORY_CHAPTERS = [
  {
    start: 0,
    no: '01',
    title: '序 · 暗室中的乐器',
    text: '我们没有设计一副耳机，而是设计一间随身的音乐厅。',
  },
  {
    start: 18,
    no: '02',
    title: '腔体 · 让声学可见',
    text: '透明双腔体，把前后声腔的每一次呼吸都交给眼睛与耳朵。',
  },
  {
    start: 36,
    no: '03',
    title: '空间 · 你的 HRTF',
    text: '扫描耳廓，生成只属于你的头部相关传输函数。',
  },
  {
    start: 54,
    no: '04',
    title: '能量 · 42 小时',
    text: '一次充电，横跨一周的通勤与深夜。',
  },
  {
    start: 72,
    no: '05',
    title: '终章 · NOCTURNE ONE',
    text: '听见空间，而不只是声音。',
  },
];

const TAU = Math.PI * 2;
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const smooth = (v: number) => {
  const t = clamp01(v);
  return t * t * (3 - 2 * t);
};
const rand = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

function envelope(local: number, isLast: boolean) {
  const fadeIn = smooth(local / 1.4);
  const fadeOut = isLast ? 1 : smooth((18 - local) / 1.4);
  return fadeIn * fadeOut;
}

function silhouette(
  c: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  s: number,
  alpha: number,
  rot: number,
) {
  c.save();
  c.translate(cx, cy);
  c.rotate(rot);
  c.scale(s / 300, s / 300);
  c.lineWidth = 1.6;
  c.lineCap = 'round';
  c.strokeStyle = `rgba(207,217,228,${(0.75 * alpha).toFixed(3)})`;
  // headband
  c.beginPath();
  c.moveTo(-135, -10);
  c.bezierCurveTo(-135, -156, 135, -156, 135, -10);
  c.stroke();
  c.strokeStyle = `rgba(207,217,228,${(0.25 * alpha).toFixed(3)})`;
  c.beginPath();
  c.moveTo(-127, -8);
  c.bezierCurveTo(-127, -144, 127, -144, 127, -8);
  c.stroke();
  for (const side of [-1, 1]) {
    const x = side * 135;
    c.strokeStyle = `rgba(207,217,228,${(0.7 * alpha).toFixed(3)})`;
    c.beginPath();
    c.moveTo(x, -10);
    c.lineTo(x, 30);
    c.stroke();
    c.beginPath();
    c.ellipse(x, 92, 62, 76, 0, 0, TAU);
    c.stroke();
    c.strokeStyle = `rgba(207,217,228,${(0.3 * alpha).toFixed(3)})`;
    c.beginPath();
    c.ellipse(x, 92, 45, 60, 0, 0, TAU);
    c.stroke();
    c.strokeStyle = `rgba(226,172,100,${(0.8 * alpha).toFixed(3)})`;
    c.beginPath();
    c.arc(x, 92, 29, 0, TAU);
    c.stroke();
    c.fillStyle = `rgba(226,172,100,${(0.7 * alpha).toFixed(3)})`;
    c.beginPath();
    c.arc(x, 92, 4, 0, TAU);
    c.fill();
  }
  c.restore();
}

function dust(c: CanvasRenderingContext2D, w: number, h: number, t: number, alpha: number) {
  for (let i = 0; i < 26; i++) {
    const px = rand(i) * w;
    const speed = 12 + rand(i + 50) * 26;
    const py = h - ((t * speed + rand(i + 99) * h) % (h + 40));
    const r = 0.7 + rand(i + 7) * 1.5;
    const a = alpha * (0.15 + rand(i + 13) * 0.4);
    c.fillStyle = `rgba(207,217,228,${a.toFixed(3)})`;
    c.beginPath();
    c.arc(px, py, r, 0, TAU);
    c.fill();
  }
}

function drawSpaced(
  c: CanvasRenderingContext2D,
  text: string,
  cx: number,
  y: number,
  spacing: number,
) {
  const widths = [...text].map((ch) => c.measureText(ch).width);
  const total = widths.reduce((a, b) => a + b, 0) + spacing * (text.length - 1);
  let x = cx - total / 2;
  [...text].forEach((ch, i) => {
    c.fillText(ch, x + widths[i] / 2, y);
    x += widths[i] + spacing;
  });
}

export function drawStory(c: CanvasRenderingContext2D, w: number, h: number, t: number) {
  const idx = Math.min(4, Math.floor(t / 18));
  const local = t - idx * 18;
  const env = envelope(local, idx === 4);
  const R = Math.min(w, h) * 0.36;
  const cx = w / 2;
  const cy = h / 2;

  const bg = c.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, '#16181d');
  bg.addColorStop(1, '#0b0c0f');
  c.fillStyle = bg;
  c.fillRect(0, 0, w, h);

  c.textAlign = 'center';
  c.textBaseline = 'middle';

  if (idx === 0) {
    // volumetric cone
    const cone = c.createLinearGradient(0, 0, 0, h);
    cone.addColorStop(0, `rgba(226,172,100,${(0.09 * env).toFixed(3)})`);
    cone.addColorStop(1, 'rgba(226,172,100,0)');
    c.fillStyle = cone;
    c.beginPath();
    c.moveTo(cx - w * 0.05, 0);
    c.lineTo(cx + w * 0.05, 0);
    c.lineTo(cx + w * 0.34, h);
    c.lineTo(cx - w * 0.34, h);
    c.closePath();
    c.fill();
    dust(c, w, h, t, env);
    silhouette(c, cx, cy + h * 0.03, Math.min(w, h) * 0.62, env, Math.sin(t * 0.25) * 0.02);
  } else if (idx === 1) {
    c.strokeStyle = `rgba(207,217,228,${(0.1 * env).toFixed(3)})`;
    c.lineWidth = 1;
    for (const k of [0.3, 0.5, 0.7, 0.9]) {
      c.beginPath();
      c.arc(cx, cy, R * k, 0, TAU);
      c.stroke();
    }
    for (let i = 0; i < 3; i++) {
      const p = (local * 0.3 + i / 3) % 1;
      c.strokeStyle = `rgba(207,217,228,${((1 - p) * 0.45 * env).toFixed(3)})`;
      c.lineWidth = 1.4;
      c.beginPath();
      c.arc(cx, cy, p * R, 0, TAU);
      c.stroke();
    }
    for (const side of [-1, 1]) {
      c.strokeStyle = `rgba(226,172,100,${(0.55 * env).toFixed(3)})`;
      c.lineWidth = 1.6;
      c.beginPath();
      c.arc(cx + side * R * 0.17, cy, R * 0.3, 0, TAU);
      c.stroke();
    }
    c.strokeStyle = `rgba(207,217,228,${(0.2 * env).toFixed(3)})`;
    c.beginPath();
    c.moveTo(cx - R, cy);
    c.lineTo(cx + R, cy);
    c.moveTo(cx, cy - R);
    c.lineTo(cx, cy + R);
    c.stroke();
    silhouette(c, cx, cy, Math.min(w, h) * 0.2, env * 0.5, 0);
  } else if (idx === 2) {
    const rot = local * 0.18;
    c.strokeStyle = `rgba(207,217,228,${(0.12 * env).toFixed(3)})`;
    c.lineWidth = 1;
    c.beginPath();
    c.arc(cx, cy, R * 0.62, 0, TAU);
    c.stroke();
    const active = Math.floor(local / 2.25) % 8;
    for (let i = 0; i < 8; i++) {
      const a = (i * TAU) / 8 + rot - Math.PI / 2;
      const x = cx + Math.cos(a) * R * 0.62;
      const y = cy + Math.sin(a) * R * 0.62;
      const isActive = i === active;
      c.strokeStyle = `rgba(207,217,228,${(0.12 * env).toFixed(3)})`;
      c.beginPath();
      c.moveTo(cx, cy);
      c.lineTo(x, y);
      c.stroke();
      c.fillStyle = isActive
        ? `rgba(226,172,100,${env.toFixed(3)})`
        : `rgba(207,217,228,${(0.75 * env).toFixed(3)})`;
      c.beginPath();
      c.arc(x, y, isActive ? 5 : 3, 0, TAU);
      c.fill();
      if (isActive) {
        const p = (local * 0.9) % 1;
        c.strokeStyle = `rgba(226,172,100,${((1 - p) * 0.5 * env).toFixed(3)})`;
        c.beginPath();
        c.arc(x, y, 6 + p * R * 0.24, 0, TAU);
        c.stroke();
      }
    }
    c.fillStyle = '#14161a';
    c.strokeStyle = `rgba(207,217,228,${(0.6 * env).toFixed(3)})`;
    c.lineWidth = 1.5;
    c.beginPath();
    c.arc(cx, cy, R * 0.13, 0, TAU);
    c.fill();
    c.stroke();
    // morphing HRTF curve
    c.strokeStyle = `rgba(134,167,196,${(0.5 * env).toFixed(3)})`;
    c.lineWidth = 1.4;
    c.beginPath();
    for (let x = 0; x <= w; x += 6) {
      const y =
        h * 0.84 +
        Math.sin(x * 0.018 + local * 1.2) * 9 +
        Math.sin(x * 0.005 - local * 0.7) * 14;
      if (x === 0) c.moveTo(x, y);
      else c.lineTo(x, y);
    }
    c.stroke();
  } else if (idx === 3) {
    const prog = smooth(local / 13);
    const start = (-210 * Math.PI) / 180;
    const sweep = (240 * Math.PI) / 180;
    c.lineWidth = 6;
    c.lineCap = 'round';
    c.strokeStyle = `rgba(207,217,228,${(0.12 * env).toFixed(3)})`;
    c.beginPath();
    c.arc(cx, cy, R * 0.52, start, start + sweep);
    c.stroke();
    c.strokeStyle = `rgba(226,172,100,${(0.9 * env).toFixed(3)})`;
    c.beginPath();
    c.arc(cx, cy, R * 0.52, start, start + sweep * prog);
    c.stroke();
    c.lineWidth = 1;
    for (let i = 0; i <= 12; i++) {
      const a = start + (sweep * i) / 12;
      c.strokeStyle = `rgba(207,217,228,${(0.2 * env).toFixed(3)})`;
      c.beginPath();
      c.moveTo(cx + Math.cos(a) * R * 0.6, cy + Math.sin(a) * R * 0.6);
      c.lineTo(cx + Math.cos(a) * R * 0.66, cy + Math.sin(a) * R * 0.66);
      c.stroke();
    }
    c.fillStyle = `rgba(238,241,245,${env.toFixed(3)})`;
    c.font = `600 ${Math.min(w * 0.13, 76)}px "IBM Plex Mono", monospace`;
    c.fillText('42', cx, cy - 8);
    c.fillStyle = `rgba(131,140,151,${env.toFixed(3)})`;
    c.font = '12px "IBM Plex Mono", "Microsoft YaHei", monospace';
    c.fillText('HOURS · 续航', cx, cy + Math.min(w * 0.09, 52));
    for (let i = 0; i < 16; i++) {
      const px = cx + (rand(i) - 0.5) * w * 0.7;
      const py = h - ((local * (26 + rand(i + 3) * 30) + rand(i + 8) * h) % h);
      c.fillStyle = `rgba(226,172,100,${(0.3 * env * rand(i + 5)).toFixed(3)})`;
      c.beginPath();
      c.arc(px, py, 1.4, 0, TAU);
      c.fill();
    }
  } else {
    silhouette(c, cx, cy - h * 0.02, Math.min(w, h) * 0.5, env * 0.16, 0);
    c.strokeStyle = `rgba(226,172,100,${(0.9 * env).toFixed(3)})`;
    c.lineWidth = 1.8;
    c.beginPath();
    c.arc(cx, h * 0.24, 22, 0, TAU);
    c.stroke();
    c.fillStyle = `rgba(238,241,245,${env.toFixed(3)})`;
    c.beginPath();
    c.arc(cx, h * 0.24, 4, 0, TAU);
    c.fill();
    c.fillStyle = `rgba(238,241,245,${env.toFixed(3)})`;
    c.font = `700 ${Math.min(w * 0.085, 62)}px "Outfit Variable", "Microsoft YaHei", sans-serif`;
    drawSpaced(c, 'NOCTURNE', cx, h * 0.5, Math.min(w * 0.014, 10));
    c.fillStyle = `rgba(131,140,151,${env.toFixed(3)})`;
    c.font = '13px "IBM Plex Mono", monospace';
    drawSpaced(c, 'ONE · 2026', cx, h * 0.5 + Math.min(w * 0.07, 52), 6);
    const priceEnv = smooth((local - 9) / 2.5);
    c.fillStyle = `rgba(226,172,100,${(priceEnv * env).toFixed(3)})`;
    c.font = `500 ${Math.min(w * 0.045, 28)}px "IBM Plex Mono", monospace`;
    c.fillText('¥3,499', cx, h * 0.78);
  }

  // vignette + grain-free vignette for depth
  const vig = c.createRadialGradient(cx, cy, Math.min(w, h) * 0.3, cx, cy, Math.max(w, h) * 0.75);
  vig.addColorStop(0, 'rgba(8,9,11,0)');
  vig.addColorStop(1, 'rgba(8,9,11,0.55)');
  c.fillStyle = vig;
  c.fillRect(0, 0, w, h);
}