import * as THREE from 'three';

/* ------------------------------------------------------------------ */
/*  Palette                                                            */
/* ------------------------------------------------------------------ */
export const PAL = {
  ink: 0x090c14,
  night: 0x070a14,
  asphalt: 0x272c3c,
  sidewalk: 0x787f93,
  curb: 0x686f83,
  cream: 0xe6ddcb,
  teal: 0x1f5a54,
  tealBright: 0x3fd9bd,
  orange: 0xf08a3c,
  warm: 0xffca8c,
  glass: 0xa9d8f0,
};

/* ------------------------------------------------------------------ */
/*  Toon helpers                                                       */
/* ------------------------------------------------------------------ */
function makeGradient(steps, vals) {
  const data = new Uint8Array(steps * 4);
  for (let i = 0; i < steps; i++) {
    const v = vals[i];
    data[i * 4] = v;
    data[i * 4 + 1] = v;
    data[i * 4 + 2] = v;
    data[i * 4 + 3] = 255;
  }
  const t = new THREE.DataTexture(data, steps, 1, THREE.RGBAFormat);
  t.minFilter = THREE.NearestFilter;
  t.magFilter = THREE.NearestFilter;
  t.needsUpdate = true;
  return t;
}

export const GRAD4 = makeGradient(4, [46, 122, 198, 255]);
export const GRAD3 = makeGradient(3, [58, 150, 255]);

export function toon(color, opts = {}) {
  return new THREE.MeshToonMaterial({
    color,
    gradientMap: opts.gradient || GRAD4,
    emissive: opts.emissive !== undefined ? opts.emissive : 0x000000,
    emissiveIntensity: opts.emissiveIntensity !== undefined ? opts.emissiveIntensity : 1,
    map: opts.map || null,
    transparent: !!opts.transparent,
    opacity: opts.opacity !== undefined ? opts.opacity : 1,
    side: opts.side || THREE.FrontSide,
    depthWrite: opts.depthWrite !== undefined ? opts.depthWrite : true,
    toneMapped: opts.toneMapped !== undefined ? opts.toneMapped : true,
  });
}

export function basic(color, opts = {}) {
  return new THREE.MeshBasicMaterial({
    color,
    map: opts.map || null,
    transparent: !!opts.transparent,
    opacity: opts.opacity !== undefined ? opts.opacity : 1,
    side: opts.side || THREE.FrontSide,
    depthWrite: opts.depthWrite !== undefined ? opts.depthWrite : true,
    blending: opts.blending || THREE.NormalBlending,
    toneMapped: opts.toneMapped !== undefined ? opts.toneMapped : false,
  });
}

/* ------------------------------------------------------------------ */
/*  Outlines (inverted hull)                                           */
/* ------------------------------------------------------------------ */
const outlineMats = new Map();
function outlineMaterial(thickness) {
  const key = thickness.toFixed(4);
  if (!outlineMats.has(key)) {
    outlineMats.set(key, new THREE.ShaderMaterial({
      uniforms: {
        uThickness: { value: thickness },
        uColor: { value: new THREE.Color(0x080b14) },
      },
      vertexShader: `
        uniform float uThickness;
        void main() {
          vec3 p = position + normalize(normal) * uThickness;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
        }`,
      fragmentShader: `
        uniform vec3 uColor;
        void main() { gl_FragColor = vec4(uColor, 1.0); }`,
      side: THREE.BackSide,
    }));
  }
  return outlineMats.get(key);
}

export function addOutline(mesh, thickness = 0.009) {
  const o = new THREE.Mesh(mesh.geometry, outlineMaterial(thickness));
  o.castShadow = false;
  o.receiveShadow = false;
  o.renderOrder = -1;
  mesh.add(o);
  return o;
}

/* ------------------------------------------------------------------ */
/*  Primitive helpers                                                  */
/* ------------------------------------------------------------------ */
export function box(parent, w, h, d, x, y, z, mat, opts = {}) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  if (opts.ry) m.rotation.y = opts.ry;
  if (opts.rx) m.rotation.x = opts.rx;
  if (opts.rz) m.rotation.z = opts.rz;
  m.castShadow = opts.cast !== false;
  m.receiveShadow = opts.receive !== false;
  parent.add(m);
  if (opts.outline) addOutline(m, opts.outline === true ? 0.009 : opts.outline);
  return m;
}

export function plane(parent, w, h, x, y, z, mat, opts = {}) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  m.position.set(x, y, z);
  if (opts.rx) m.rotation.x = opts.rx;
  if (opts.ry) m.rotation.y = opts.ry;
  if (opts.rz) m.rotation.z = opts.rz;
  m.castShadow = !!opts.cast;
  m.receiveShadow = opts.receive !== false;
  parent.add(m);
  return m;
}

export function cyl(parent, rt, rb, h, x, y, z, mat, opts = {}) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, opts.seg || 12, 1, !!opts.open), mat);
  m.position.set(x, y, z);
  if (opts.rx) m.rotation.x = opts.rx;
  if (opts.ry) m.rotation.y = opts.ry;
  if (opts.rz) m.rotation.z = opts.rz;
  m.castShadow = opts.cast !== false;
  m.receiveShadow = opts.receive !== false;
  parent.add(m);
  if (opts.outline) addOutline(m, opts.outline === true ? 0.008 : opts.outline);
  return m;
}

export function tubeBetween(parent, a, b, radius, mat, opts = {}) {
  const dir = new THREE.Vector3().subVectors(b, a);
  const len = dir.length();
  const m = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, len, opts.seg || 6, 1), mat);
  m.position.copy(a).addScaledVector(dir, 0.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  m.castShadow = opts.cast !== false;
  m.receiveShadow = opts.receive !== false;
  parent.add(m);
  return m;
}

export function puddleGeo(radius, seed = 0) {
  const shape = new THREE.Shape();
  const N = 32;
  for (let i = 0; i <= N; i++) {
    const a = (i / N) * Math.PI * 2;
    const r = radius * (0.72 + 0.18 * Math.sin(a * 3 + seed) + 0.10 * Math.sin(a * 7 + seed * 2.7));
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r * 0.62;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  const g = new THREE.ShapeGeometry(shape, 1);
  g.rotateX(-Math.PI / 2);
  return g;
}

/* ------------------------------------------------------------------ */
/*  Glow sprites                                                       */
/* ------------------------------------------------------------------ */
let glowTex = null;
export function getGlowTexture() {
  if (glowTex) return glowTex;
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  grd.addColorStop(0.0, 'rgba(255,255,255,1)');
  grd.addColorStop(0.18, 'rgba(255,255,255,0.72)');
  grd.addColorStop(0.45, 'rgba(255,255,255,0.22)');
  grd.addColorStop(0.75, 'rgba(255,255,255,0.045)');
  grd.addColorStop(1.0, 'rgba(255,255,255,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, 256, 256);
  glowTex = new THREE.CanvasTexture(c);
  glowTex.colorSpace = THREE.SRGBColorSpace;
  return glowTex;
}

export function glow(parent, color, size, opacity = 0.55, x = 0, y = 0, z = 0) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({
    map: getGlowTexture(),
    color,
    transparent: true,
    opacity,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    depthTest: true,
    toneMapped: false,
    fog: false,
  }));
  s.position.set(x, y, z);
  s.scale.set(size, size, 1);
  parent.add(s);
  return s;
}

/* ------------------------------------------------------------------ */
/*  Canvas texture helpers                                             */
/* ------------------------------------------------------------------ */
export function canvasTex(w, h, draw, opts = {}) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d');
  draw(g, w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  if (opts.repeat) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(opts.repeat[0], opts.repeat[1]);
  }
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
export { rr };

/* ------------------------------------------------------------------ */
/*  Textures                                                           */
/* ------------------------------------------------------------------ */
export function asphaltTexture() {
  return canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = '#252a39';
    g.fillRect(0, 0, w, h);
    for (let i = 0; i < 700; i++) {
      const x = Math.random() * w, y = Math.random() * h;
      const r = Math.random() * 2.4 + 0.4;
      const v = Math.random();
      g.fillStyle = v > 0.5 ? `rgba(120,132,160,${0.02 + Math.random() * 0.08})` : `rgba(6,8,14,${0.05 + Math.random() * 0.12})`;
      g.beginPath();
      g.arc(x, y, r, 0, Math.PI * 2);
      g.fill();
    }
    for (let i = 0; i < 14; i++) {
      const x = Math.random() * w, y = Math.random() * h;
      const grd = g.createRadialGradient(x, y, 0, x, y, 30 + Math.random() * 70);
      grd.addColorStop(0, 'rgba(90,102,130,0.05)');
      grd.addColorStop(1, 'rgba(90,102,130,0)');
      g.fillStyle = grd;
      g.fillRect(x - 100, y - 100, 200, 200);
    }
  }, { repeat: [5, 5] });
}

export function sidewalkTexture() {
  return canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = '#7b8295';
    g.fillRect(0, 0, w, h);
    const s = 128;
    for (let y = 0; y < h; y += s) {
      for (let x = 0; x < w; x += s) {
        const v = 0.92 + Math.random() * 0.08;
        g.fillStyle = `rgba(${Math.round(123 * v)},${Math.round(130 * v)},${Math.round(149 * v)},1)`;
        g.fillRect(x + 1, y + 1, s - 2, s - 2);
      }
    }
    g.strokeStyle = 'rgba(38,43,56,0.75)';
    g.lineWidth = 3;
    for (let i = 0; i <= w; i += s) {
      g.beginPath(); g.moveTo(i, 0); g.lineTo(i, h); g.stroke();
      g.beginPath(); g.moveTo(0, i); g.lineTo(w, i); g.stroke();
    }
    for (let i = 0; i < 900; i++) {
      g.fillStyle = `rgba(30,34,45,${Math.random() * 0.07})`;
      g.fillRect(Math.random() * w, Math.random() * h, 2, 2);
    }
  }, { repeat: [5, 2] });
}

export function floorTileTexture() {
  return canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = '#e8dfcb';
    g.fillRect(0, 0, w, h);
    const s = 128;
    for (let y = 0; y < h; y += s) {
      for (let x = 0; x < w; x += s) {
        const v = 0.955 + Math.random() * 0.045;
        g.fillStyle = `rgba(${Math.round(232 * v)},${Math.round(223 * v)},${Math.round(203 * v)},1)`;
        g.fillRect(x + 1, y + 1, s - 2, s - 2);
      }
    }
    g.strokeStyle = 'rgba(168,155,132,0.55)';
    g.lineWidth = 2;
    for (let i = 0; i <= w; i += s) {
      g.beginPath(); g.moveTo(i, 0); g.lineTo(i, h); g.stroke();
      g.beginPath(); g.moveTo(0, i); g.lineTo(w, i); g.stroke();
    }
  }, { repeat: [4, 4] });
}

export function signTexture() {
  return canvasTex(1024, 256, (g, w, h) => {
    const grd = g.createLinearGradient(0, 0, 0, h);
    grd.addColorStop(0, '#fdf7e8');
    grd.addColorStop(1, '#efe4ce');
    g.fillStyle = grd;
    g.fillRect(0, 0, w, h);
    g.fillStyle = '#13514a';
    g.fillRect(0, 0, w, 16);
    g.fillRect(0, h - 16, w, 16);
    g.fillStyle = '#f08a3c';
    g.fillRect(0, 0, 22, h);
    g.fillStyle = '#13514a';
    g.font = 'bold 112px "Hiragino Sans", "Yu Gothic", "Noto Sans JP", sans-serif';
    g.textBaseline = 'middle';
    g.fillText('HOT MART', 72, 108);
    g.font = 'bold 40px "Hiragino Sans", "Yu Gothic", "Noto Sans JP", sans-serif';
    g.fillStyle = '#2b6a60';
    g.fillText('ほっとマート', 76, 186);
    g.font = '600 24px "Helvetica Neue", Arial, sans-serif';
    g.fillStyle = '#6f7f78';
    g.fillText('OPEN 24 HOURS  /  年中無休', 78, 224);
    // 24H badge
    g.fillStyle = '#ef8b3c';
    rr(g, 790, 62, 168, 132, 18); g.fill();
    g.fillStyle = '#fff8ea';
    g.font = 'bold 78px "Helvetica Neue", Arial, sans-serif';
    g.textAlign = 'center';
    g.fillText('24H', 874, 132);
    g.font = 'bold 22px "Hiragino Sans", sans-serif';
    g.fillText('営業中', 874, 172);
    g.textAlign = 'left';
    // little logo mark
    g.fillStyle = '#13514a';
    g.beginPath(); g.arc(742, 128, 30, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#f6efe0';
    g.font = 'bold 30px "Helvetica Neue", Arial, sans-serif';
    g.textAlign = 'center';
    g.fillText('H', 742, 140);
    g.textAlign = 'left';
  });
}

export function verticalSignTexture() {
  return canvasTex(256, 1024, (g, w, h) => {
    const grd = g.createLinearGradient(0, 0, 0, h);
    grd.addColorStop(0, '#fdf7e8');
    grd.addColorStop(1, '#ece0c8');
    g.fillStyle = grd;
    g.fillRect(0, 0, w, h);
    g.fillStyle = '#13514a';
    g.fillRect(0, 0, w, 18);
    g.fillRect(0, h - 18, w, 18);
    g.fillStyle = '#f08a3c';
    g.fillRect(0, 0, 14, h);
    g.fillStyle = '#13514a';
    g.font = 'bold 84px "Helvetica Neue", Arial, sans-serif';
    g.textAlign = 'center';
    const letters = 'HOT MART';
    for (let i = 0; i < letters.length; i++) {
      g.fillText(letters[i], 142, 128 + i * 82);
    }
    g.font = 'bold 30px "Hiragino Sans", "Yu Gothic", sans-serif';
    g.fillStyle = '#2b6a60';
    const jp = 'ほっとマート';
    for (let i = 0; i < jp.length; i++) {
      g.fillText(jp[i], 142, 772 + i * 30);
    }
    g.fillStyle = '#ef8b3c';
    rr(g, 46, 916, 164, 74, 14); g.fill();
    g.fillStyle = '#fff8ea';
    g.font = 'bold 54px "Helvetica Neue", Arial, sans-serif';
    g.fillText('24H', 128, 966);
    g.textAlign = 'left';
  });
}

export function vendingTexture(scheme = 0) {
  const A = scheme === 0
    ? { body: '#f4f2ec', head: '#d8443f', head2: '#a92f2c', accent: '#d8443f', label: '#333' }
    : { body: '#eef2f6', head: '#2a63a8', head2: '#1d4677', accent: '#2a63a8', label: '#333' };
  return canvasTex(512, 1024, (g, w, h) => {
    g.fillStyle = A.body;
    g.fillRect(0, 0, w, h);
    const hg = g.createLinearGradient(0, 0, 0, 150);
    hg.addColorStop(0, A.head);
    hg.addColorStop(1, A.head2);
    g.fillStyle = hg;
    g.fillRect(0, 0, w, 150);
    g.fillStyle = '#ffffff';
    g.font = 'bold 58px "Hiragino Sans", "Yu Gothic", sans-serif';
    g.textAlign = 'center';
    g.fillText(scheme === 0 ? 'つめたい飲みもの' : 'あったか〜い', w / 2, 92);
    g.font = 'bold 22px "Helvetica Neue", Arial, sans-serif';
    g.fillStyle = 'rgba(255,255,255,0.8)';
    g.fillText('DRINKS  /  COLD & HOT', w / 2, 128);

    const cols = 4, rows = 4;
    const cw = 104, ch = 128, ox = 34, oy = 188;
    const colors = ['#e25b4d', '#3f8fd0', '#e7b84b', '#5aa86b', '#8b62b8', '#d87c3a', '#3fa6a0', '#cf5f8e'];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = ox + c * (cw + 8);
        const y = oy + r * (ch + 18);
        g.fillStyle = '#dfe5e8';
        g.fillRect(x - 4, y - 6, cw + 8, ch + 12);
        // can / bottle
        const col = colors[(r * cols + c) % colors.length];
        g.fillStyle = col;
        if ((r + c) % 3 === 0) {
          rr(g, x + 22, y + 22, cw - 44, ch - 46, 10); g.fill();
          g.fillStyle = '#f6f6f2';
          g.fillRect(x + 26, y + 48, cw - 52, 26);
          g.fillStyle = col;
          g.fillRect(x + 40, y + 14, cw - 80, 12);
        } else {
          rr(g, x + 28, y + 12, cw - 56, ch - 30, 9); g.fill();
          g.fillStyle = 'rgba(255,255,255,0.85)';
          g.fillRect(x + 32, y + 40, cw - 64, 20);
          g.fillStyle = '#2d3339';
          g.font = 'bold 14px "Helvetica Neue", Arial, sans-serif';
          g.textAlign = 'center';
          g.fillText('¥130', x + cw / 2, y + ch - 22);
        }
        g.fillStyle = '#f6f6f2';
        g.fillRect(x + 8, y + ch - 14, cw - 16, 22);
        g.fillStyle = '#3b4148';
        g.font = 'bold 13px "Helvetica Neue", Arial, sans-serif';
        g.textAlign = 'center';
        g.fillText('¥130', x + cw / 2, y + ch + 2);
      }
    }
    // coin / buttons strip
    g.fillStyle = '#d7dde1';
    g.fillRect(0, 878, w, 146);
    g.fillStyle = '#333a40';
    rr(g, 60, 906, 120, 52, 8); g.fill();
    g.fillStyle = '#7fe0c0';
    g.fillRect(210, 916, 84, 14);
    g.fillStyle = '#ffcf6a';
    g.fillRect(210, 940, 84, 14);
    g.fillStyle = '#2b3138';
    rr(g, 344, 902, 108, 72, 8); g.fill();
    g.fillStyle = '#9aa3aa';
    g.fillRect(358, 916, 80, 10);
    g.fillStyle = '#c8d0d6';
    g.font = 'bold 16px "Hiragino Sans", sans-serif';
    g.textAlign = 'center';
    g.fillText('つめた〜い', w / 2, 1000);
    g.textAlign = 'left';
  });
}

export function drinkPosterTexture() {
  return canvasTex(512, 768, (g, w, h) => {
    const grd = g.createLinearGradient(0, 0, w, h);
    grd.addColorStop(0, '#1e6e63');
    grd.addColorStop(0.55, '#2f9e86');
    grd.addColorStop(1, '#8fd8b8');
    g.fillStyle = grd;
    g.fillRect(0, 0, w, h);
    for (let i = 0; i < 22; i++) {
      g.fillStyle = `rgba(255,255,255,${0.03 + Math.random() * 0.05})`;
      g.beginPath();
      g.arc(Math.random() * w, Math.random() * h, 8 + Math.random() * 40, 0, Math.PI * 2);
      g.fill();
    }
    g.fillStyle = 'rgba(255,255,255,0.92)';
    g.font = 'bold 34px "Hiragino Sans", sans-serif';
    g.fillText('新発売', 46, 90);
    g.font = 'bold 92px "Hiragino Sans", "Yu Gothic", sans-serif';
    g.fillStyle = '#ffffff';
    g.fillText('抹茶', 44, 190);
    g.fillText('ラテ', 44, 282);
    g.font = 'bold 28px "Hiragino Sans", sans-serif';
    g.fillStyle = 'rgba(255,255,255,0.86)';
    g.fillText('宇治抹茶使用 / あたたかい', 46, 330);
    // cup
    g.save();
    g.translate(300, 500);
    g.rotate(-0.08);
    g.fillStyle = '#f7f2e6';
    g.beginPath();
    g.moveTo(-80, -130);
    g.lineTo(80, -130);
    g.lineTo(58, 150);
    g.lineTo(-58, 150);
    g.closePath();
    g.fill();
    g.fillStyle = '#7aae4a';
    g.fillRect(-80, -90, 160, 46);
    g.fillStyle = '#5e8f37';
    g.fillRect(-80, -44, 160, 18);
    g.fillStyle = '#ffffff';
    g.fillRect(-80, -130, 160, 40);
    g.fillStyle = '#2c5b3a';
    g.font = 'bold 26px "Helvetica Neue", Arial, sans-serif';
    g.textAlign = 'center';
    g.fillText('MATCHA', 0, -100);
    g.fillStyle = '#f2ead8';
    g.fillRect(-76, -148, 152, 20);
    g.restore();
    g.fillStyle = '#f08a3c';
    rr(g, 46, 640, 210, 64, 10); g.fill();
    g.fillStyle = '#fff8ea';
    g.font = 'bold 34px "Helvetica Neue", Arial, sans-serif';
    g.fillText('¥158', 76, 685);
    g.textAlign = 'left';
  });
}

export function salePosterTexture() {
  return canvasTex(512, 640, (g, w, h) => {
    g.fillStyle = '#f4d33f';
    g.fillRect(0, 0, w, h);
    g.fillStyle = '#d8443f';
    g.fillRect(0, 0, w, 120);
    g.fillStyle = '#fff6dc';
    g.font = 'bold 74px "Helvetica Neue", Arial, sans-serif';
    g.textAlign = 'center';
    g.fillText('SALE', w / 2, 88);
    g.fillStyle = '#c8372f';
    g.font = 'bold 190px "Helvetica Neue", Arial, sans-serif';
    g.fillText('20', w / 2 - 38, 340);
    g.font = 'bold 80px "Helvetica Neue", Arial, sans-serif';
    g.fillText('%', w / 2 + 140, 330);
    g.fillStyle = '#2e2a24';
    g.font = 'bold 40px "Hiragino Sans", sans-serif';
    g.fillText('お弁当・おにぎり', w / 2, 430);
    g.fillText('全品対象', w / 2, 486);
    g.font = 'bold 24px "Hiragino Sans", sans-serif';
    g.fillStyle = '#6a5c3d';
    g.fillText('本日 20:00 まで', w / 2, 548);
    g.fillStyle = '#d8443f';
    g.fillRect(60, 590, w - 120, 8);
    g.textAlign = 'left';
  });
}

export function festivalPosterTexture() {
  return canvasTex(512, 640, (g, w, h) => {
    const grd = g.createLinearGradient(0, 0, 0, h);
    grd.addColorStop(0, '#101a3c');
    grd.addColorStop(1, '#2a1a44');
    g.fillStyle = grd;
    g.fillRect(0, 0, w, h);
    const cols = ['#ffcf6a', '#ff7f9f', '#7fd8ff', '#b48cff'];
    for (let i = 0; i < 6; i++) {
      const x = 80 + Math.random() * 350;
      const y = 120 + Math.random() * 220;
      const r = 26 + Math.random() * 34;
      g.strokeStyle = cols[i % cols.length];
      g.lineWidth = 3;
      for (let k = 0; k < 12; k++) {
        const a = (k / 12) * Math.PI * 2;
        g.beginPath();
        g.moveTo(x, y);
        g.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
        g.stroke();
        g.beginPath();
        g.arc(x + Math.cos(a) * r * 1.25, y + Math.sin(a) * r * 1.25, 2.5, 0, Math.PI * 2);
        g.fillStyle = cols[i % cols.length];
        g.fill();
      }
    }
    g.fillStyle = '#fff4dc';
    g.font = 'bold 64px "Hiragino Sans", "Yu Gothic", sans-serif';
    g.textAlign = 'center';
    g.fillText('夏祭り', w / 2, 460);
    g.font = 'bold 26px "Hiragino Sans", sans-serif';
    g.fillStyle = '#ffcf6a';
    g.fillText('8.24 SAT  19:00〜', w / 2, 510);
    g.font = '22px "Hiragino Sans", sans-serif';
    g.fillStyle = 'rgba(255,255,255,0.72)';
    g.fillText('桜町二丁目 商店街', w / 2, 552);
    g.textAlign = 'left';
  });
}

export function catPosterTexture() {
  return canvasTex(512, 640, (g, w, h) => {
    g.fillStyle = '#f6f2e8';
    g.fillRect(0, 0, w, h);
    g.fillStyle = '#d8443f';
    g.font = 'bold 42px "Hiragino Sans", sans-serif';
    g.textAlign = 'center';
    g.fillText('さがしています', w / 2, 76);
    g.fillStyle = '#e7dccb';
    g.beginPath();
    g.arc(w / 2, 280, 130, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#8b7a63';
    g.beginPath();
    g.arc(w / 2, 300, 66, 0, Math.PI * 2);
    g.fill();
    g.beginPath();
    g.moveTo(w / 2 - 60, 250); g.lineTo(w / 2 - 28, 196); g.lineTo(w / 2 - 6, 246); g.fill();
    g.beginPath();
    g.moveTo(w / 2 + 60, 250); g.lineTo(w / 2 + 28, 196); g.lineTo(w / 2 + 6, 246); g.fill();
    g.fillStyle = '#2d2a26';
    g.beginPath(); g.arc(w / 2 - 24, 288, 6, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.arc(w / 2 + 24, 288, 6, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#d8443f';
    g.font = 'bold 30px "Hiragino Sans", sans-serif';
    g.fillText('ミケ  /  オス 3歳', w / 2, 470);
    g.fillStyle = '#4a443c';
    g.font = '22px "Hiragino Sans", sans-serif';
    g.fillText('桜町二丁目付近で', w / 2, 522);
    g.fillText('見かけた方はご連絡ください', w / 2, 552);
    g.fillStyle = '#8b8174';
    g.font = '18px "Helvetica Neue", Arial, sans-serif';
    g.fillText('090-XXXX-XXXX', w / 2, 596);
    g.textAlign = 'left';
  });
}

export function noticeBoardTexture() {
  return canvasTex(512, 640, (g, w, h) => {
    g.fillStyle = '#5c4630';
    g.fillRect(0, 0, w, h);
    g.fillStyle = '#8a6a45';
    g.fillRect(10, 10, w - 20, h - 20);
    for (let i = 0; i < 300; i++) {
      g.fillStyle = `rgba(60,42,26,${Math.random() * 0.08})`;
      g.fillRect(Math.random() * w, Math.random() * h, 3, 2);
    }
    const cards = [
      { x: 42, y: 52, w: 190, h: 236, c: '#f4d33f' },
      { x: 272, y: 44, w: 190, h: 200, c: '#f6f2e8' },
      { x: 58, y: 330, w: 176, h: 210, c: '#cfe4f2' },
      { x: 276, y: 296, w: 180, h: 250, c: '#f2dede' },
    ];
    const words = [['SALE', '20%OFF'], ['夏祭り', '8.24'], ['迷い猫', 'さがしてます'], ['防災', '避難場所']];
    cards.forEach((c, i) => {
      g.save();
      g.translate(c.x + c.w / 2, c.y + c.h / 2);
      g.rotate((Math.random() - 0.5) * 0.05);
      g.fillStyle = c.c;
      g.fillRect(-c.w / 2, -c.h / 2, c.w, c.h);
      g.fillStyle = '#3c3730';
      g.font = `bold ${i === 0 ? 40 : 28}px "Hiragino Sans", sans-serif`;
      g.textAlign = 'center';
      g.fillText(words[i][0], 0, -c.h / 2 + 60);
      g.font = '20px "Hiragino Sans", sans-serif';
      g.fillText(words[i][1], 0, -c.h / 2 + 100);
      g.fillStyle = 'rgba(40,36,30,0.35)';
      g.fillRect(-c.w / 2 + 24, -c.h / 2 + 130, c.w - 48, 3);
      g.fillRect(-c.w / 2 + 24, -c.h / 2 + 150, c.w - 70, 3);
      g.fillRect(-c.w / 2 + 24, -c.h / 2 + 170, c.w - 56, 3);
      g.restore();
      // tape
      g.fillStyle = 'rgba(230,220,190,0.55)';
      g.fillRect(c.x + c.w / 2 - 26, c.y - 10, 52, 20);
    });
    g.textAlign = 'left';
  });
}

export function magazineTexture(i) {
  const themes = [
    { bg: '#e94f64', title: 'ANIME', sub: 'NEW SEASON' },
    { bg: '#3f7fd4', title: 'CAR', sub: 'NIGHT DRIVE' },
    { bg: '#f0c33c', title: 'GAME', sub: 'RPG特集' },
    { bg: '#59b98a', title: 'TRAVEL', sub: '京都の夏' },
    { bg: '#9a6fd0', title: 'FASHION', sub: 'AUTUMN' },
    { bg: '#ef8b3c', title: 'FOOD', sub: '深夜めし' },
  ];
  const t = themes[i % themes.length];
  return canvasTex(256, 340, (g, w, h) => {
    g.fillStyle = t.bg;
    g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(255,255,255,0.16)';
    g.beginPath();
    g.arc(w * 0.72, h * 0.36, 74, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = 'rgba(20,20,30,0.25)';
    g.fillRect(0, h - 88, w, 88);
    g.fillStyle = '#ffffff';
    g.font = 'bold 42px "Helvetica Neue", Arial, sans-serif';
    g.fillText(t.title, 18, 56);
    g.font = 'bold 18px "Hiragino Sans", sans-serif';
    g.fillText(t.sub, 20, 84);
    g.fillStyle = 'rgba(255,255,255,0.9)';
    g.font = 'bold 16px "Helvetica Neue", Arial, sans-serif';
    g.fillText('2024 / 09', 18, h - 20);
    // simple cover illustration
    g.fillStyle = 'rgba(255,255,255,0.9)';
    g.beginPath();
    g.arc(w * 0.5, h * 0.56, 46, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = t.bg;
    g.beginPath();
    g.arc(w * 0.5, h * 0.56, 36, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = 'rgba(255,255,255,0.85)';
    g.fillRect(18, h - 112, 60, 6);
  });
}

export function coldDrinksTexture() {
  return canvasTex(1024, 192, (g, w, h) => {
    g.fillStyle = '#0f4b45';
    g.fillRect(0, 0, w, h);
    g.fillStyle = '#3fd9bd';
    g.fillRect(0, 0, w, 10);
    g.fillStyle = '#f6efe0';
    g.font = 'bold 82px "Helvetica Neue", Arial, sans-serif';
    g.textAlign = 'center';
    g.fillText('COLD DRINKS', w / 2, 104);
    g.font = 'bold 30px "Hiragino Sans", sans-serif';
    g.fillStyle = '#9fe8d8';
    g.fillText('つめた〜い飲みもの', w / 2, 156);
    g.textAlign = 'left';
  });
}

export function odenSignTexture() {
  return canvasTex(512, 256, (g, w, h) => {
    g.fillStyle = '#fff6e2';
    g.fillRect(0, 0, w, h);
    g.strokeStyle = '#c2482f';
    g.lineWidth = 10;
    g.strokeRect(8, 8, w - 16, h - 16);
    g.fillStyle = '#c2482f';
    g.font = 'bold 100px "Hiragino Sans", "Yu Gothic", sans-serif';
    g.textAlign = 'center';
    g.fillText('おでん', w / 2, 132);
    g.font = 'bold 32px "Hiragino Sans", sans-serif';
    g.fillStyle = '#7a4a32';
    g.fillText('あったか〜い', w / 2, 192);
    g.textAlign = 'left';
  });
}

export function coffeeSignTexture() {
  return canvasTex(512, 256, (g, w, h) => {
    g.fillStyle = '#2b211c';
    g.fillRect(0, 0, w, h);
    g.strokeStyle = '#c9a06a';
    g.lineWidth = 8;
    g.strokeRect(8, 8, w - 16, h - 16);
    g.fillStyle = '#f0d3a6';
    g.font = 'bold 78px "Helvetica Neue", Arial, sans-serif';
    g.textAlign = 'center';
    g.fillText('HOT COFFEE', w / 2, 112);
    g.font = 'bold 30px "Hiragino Sans", sans-serif';
    g.fillStyle = '#c9a06a';
    g.fillText('挽きたて  /  ¥150', w / 2, 170);
    g.textAlign = 'left';
  });
}

export function streetSignTexture() {
  return canvasTex(512, 160, (g, w, h) => {
    g.fillStyle = '#174a91';
    g.fillRect(0, 0, w, h);
    g.strokeStyle = '#f2f4f8';
    g.lineWidth = 8;
    g.strokeRect(8, 8, w - 16, h - 16);
    g.fillStyle = '#f2f4f8';
    g.font = 'bold 52px "Hiragino Sans", sans-serif';
    g.textAlign = 'center';
    g.fillText('桜町二丁目', w / 2, 76);
    g.font = '22px "Helvetica Neue", Arial, sans-serif';
    g.fillText('SAKURA-MACHI 2', w / 2, 116);
    g.textAlign = 'left';
  });
}

export function plaqueTexture() {
  return canvasTex(512, 128, (g, w, h) => {
    const grd = g.createLinearGradient(0, 0, 0, h);
    grd.addColorStop(0, '#a8864f');
    grd.addColorStop(0.5, '#8a6a3a');
    grd.addColorStop(1, '#6e5228');
    g.fillStyle = grd;
    g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(245,232,200,0.5)';
    g.lineWidth = 3;
    g.strokeRect(10, 10, w - 20, h - 20);
    g.fillStyle = '#f2e6c8';
    g.font = 'bold 34px "Hiragino Sans", serif';
    g.textAlign = 'center';
    g.fillText('雨夜のコンビニ', w / 2, 60);
    g.font = '18px "Helvetica Neue", Arial, sans-serif';
    g.fillStyle = 'rgba(242,230,200,0.75)';
    g.fillText('HOT MART  ·  1 : 64  ·  NIGHT DIORAMA', w / 2, 96);
    g.textAlign = 'left';
  });
}

export function grateTexture() {
  return canvasTex(128, 64, (g, w, h) => {
    g.fillStyle = '#171b24';
    g.fillRect(0, 0, w, h);
    g.fillStyle = '#2d3441';
    for (let i = 0; i < 8; i++) {
      g.fillRect(4, 5 + i * 7.4, w - 8, 3.4);
    }
    g.strokeStyle = '#3c4554';
    g.lineWidth = 2;
    g.strokeRect(1, 1, w - 2, h - 2);
  }, { repeat: [10, 1] });
}

export function manholeTexture() {
  return canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#3a3f4c';
    g.fillRect(0, 0, w, h);
    g.strokeStyle = '#565d6c';
    g.lineWidth = 4;
    g.beginPath(); g.arc(128, 128, 112, 0, Math.PI * 2); g.stroke();
    g.beginPath(); g.arc(128, 128, 86, 0, Math.PI * 2); g.stroke();
    g.fillStyle = '#4a5060';
    for (let i = 0; i < 28; i++) {
      const a = (i / 28) * Math.PI * 2;
      g.save();
      g.translate(128 + Math.cos(a) * 100, 128 + Math.sin(a) * 100);
      g.rotate(a);
      g.fillRect(-4, -2, 8, 4);
      g.restore();
    }
    g.fillStyle = '#2e333e';
    g.beginPath(); g.arc(128, 128, 40, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#565d6c';
    g.font = 'bold 20px "Helvetica Neue", Arial, sans-serif';
    g.textAlign = 'center';
    g.fillText('桜町', 128, 134);
    g.textAlign = 'left';
  });
}

export function stopTexture() {
  return canvasTex(512, 256, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    g.fillStyle = 'rgba(232,238,246,0.92)';
    g.font = 'bold 150px "Hiragino Sans", "Yu Gothic", sans-serif';
    g.textAlign = 'center';
    g.fillText('止まれ', w / 2, 170);
    g.textAlign = 'left';
  });
}

export function glassRainTexture() {
  return canvasTex(256, 512, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    for (let i = 0; i < 90; i++) {
      const x = Math.random() * w;
      const y = Math.random() * h;
      const len = 8 + Math.random() * 55;
      const grd = g.createLinearGradient(x, y, x, y + len);
      grd.addColorStop(0, 'rgba(205,232,255,0)');
      grd.addColorStop(0.5, `rgba(220,240,255,${0.10 + Math.random() * 0.22})`);
      grd.addColorStop(1, 'rgba(205,232,255,0)');
      g.strokeStyle = grd;
      g.lineWidth = 0.8 + Math.random() * 1.4;
      g.beginPath();
      g.moveTo(x, y);
      g.lineTo(x + (Math.random() - 0.5) * 3, y + len);
      g.stroke();
    }
    for (let i = 0; i < 55; i++) {
      const x = Math.random() * w;
      const y = Math.random() * h;
      const r = 1.2 + Math.random() * 3.2;
      g.fillStyle = `rgba(225,243,255,${0.15 + Math.random() * 0.3})`;
      g.beginPath();
      g.ellipse(x, y, r * 0.7, r, 0, 0, Math.PI * 2);
      g.fill();
    }
  }, { repeat: [1, 1] });
}

export function buildingTexture(seed = 1, cols = 6, rows = 7) {
  return canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = seed % 2 ? '#161a26' : '#1a1d2a';
    g.fillRect(0, 0, w, h);
    const cw = w / cols, ch = h / rows;
    let s = seed * 9301 + 49297;
    const rnd = () => {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = c * cw + cw * 0.18;
        const y = r * ch + ch * 0.18;
        const ww = cw * 0.64, hh = ch * 0.52;
        g.fillStyle = '#0c0f18';
        g.fillRect(x - 2, y - 2, ww + 4, hh + 4);
        const v = rnd();
        if (v > 0.74) {
          const warm = rnd() > 0.35;
          g.fillStyle = warm ? 'rgba(255,203,132,0.88)' : 'rgba(150,195,255,0.62)';
        } else {
          g.fillStyle = v > 0.4 ? '#1c2334' : '#141a28';
        }
        g.fillRect(x, y, ww, hh);
        if (v > 0.74) {
          g.fillStyle = 'rgba(0,0,0,0.25)';
          g.fillRect(x, y + hh * 0.55, ww, hh * 0.45);
        }
        g.strokeStyle = 'rgba(90,100,125,0.25)';
        g.lineWidth = 1;
        g.strokeRect(x, y, ww, hh);
      }
      // balcony line
      g.fillStyle = 'rgba(70,78,98,0.35)';
      g.fillRect(0, r * ch + ch * 0.78, w, 2);
    }
    g.fillStyle = 'rgba(0,0,0,0.28)';
    g.fillRect(0, 0, w, 18);
    g.fillRect(0, h - 22, w, 22);
  });
}

export function neighborWindowTexture(lit = true) {
  return canvasTex(256, 256, (g, w, h) => {
    if (lit) {
      const grd = g.createLinearGradient(0, 0, 0, h);
      grd.addColorStop(0, '#ffdca0');
      grd.addColorStop(1, '#e8a860');
      g.fillStyle = grd;
      g.fillRect(0, 0, w, h);
      g.fillStyle = 'rgba(120,80,40,0.22)';
      for (let i = 0; i < 6; i++) g.fillRect(12 + i * 40, 0, 10, h);
      g.fillStyle = 'rgba(60,45,30,0.35)';
      g.fillRect(0, 0, w, 14);
      g.fillRect(0, 0, 14, h);
    } else {
      g.fillStyle = '#111726';
      g.fillRect(0, 0, w, h);
      g.fillStyle = 'rgba(90,120,160,0.10)';
      g.fillRect(20, 20, w - 40, h - 40);
    }
    g.strokeStyle = '#3a3f4c';
    g.lineWidth = 10;
    g.strokeRect(5, 5, w - 10, h - 10);
    g.beginPath(); g.moveTo(w / 2, 0); g.lineTo(w / 2, h); g.stroke();
    g.beginPath(); g.moveTo(0, h / 2); g.lineTo(w, h / 2); g.stroke();
  });
}

export function snackSignTexture() {
  return canvasTex(192, 640, (g, w, h) => {
    g.fillStyle = '#2a1424';
    g.fillRect(0, 0, w, h);
    g.strokeStyle = '#ff7fb0';
    g.lineWidth = 6;
    g.strokeRect(6, 6, w - 12, h - 12);
    g.fillStyle = '#ff9fc4';
    g.font = 'bold 44px "Hiragino Sans", sans-serif';
    g.textAlign = 'center';
    g.fillText('スナック', w / 2, 96);
    g.font = 'bold 120px "Hiragino Sans", serif';
    g.fillStyle = '#ffd9e6';
    g.fillText('花', w / 2, 300);
    g.font = 'bold 26px "Hiragino Sans", sans-serif';
    g.fillStyle = '#ff9fc4';
    g.fillText('2F', w / 2, 380);
    g.fillText('営業中', w / 2, 450);
    g.fillStyle = 'rgba(255,127,176,0.5)';
    g.beginPath(); g.arc(w / 2, 540, 30, 0, Math.PI * 2); g.fill();
    g.textAlign = 'left';
  });
}

export function floorGuideTexture() {
  return canvasTex(512, 512, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    g.fillStyle = 'rgba(35,120,105,0.72)';
    rr(g, 26, 190, 250, 120, 14); g.fill();
    g.fillStyle = '#f6f2e4';
    g.font = 'bold 62px "Hiragino Sans", sans-serif';
    g.textAlign = 'center';
    g.fillText('レジ', 150, 270);
    g.fillStyle = 'rgba(35,120,105,0.72)';
    // arrow
    g.beginPath();
    g.moveTo(330, 210);
    g.lineTo(470, 250);
    g.lineTo(330, 290);
    g.lineTo(360, 250);
    g.closePath();
    g.fill();
    g.textAlign = 'left';
  });
}

export function hotCaseTexture() {
  return canvasTex(256, 128, (g, w, h) => {
    g.fillStyle = '#f7e6c2';
    g.fillRect(0, 0, w, h);
    g.fillStyle = '#c2482f';
    g.font = 'bold 44px "Hiragino Sans", sans-serif';
    g.textAlign = 'center';
    g.fillText('HOT SNACK', w / 2, 62);
    g.font = 'bold 22px "Hiragino Sans", sans-serif';
    g.fillStyle = '#7a4a32';
    g.fillText('揚げたて', w / 2, 98);
    g.textAlign = 'left';
  });
}

export function windowGlassTexture() {
  return canvasTex(128, 256, (g, w, h) => {
    const grd = g.createLinearGradient(0, 0, w, h);
    grd.addColorStop(0, 'rgba(190,225,255,0.16)');
    grd.addColorStop(0.45, 'rgba(190,225,255,0.02)');
    grd.addColorStop(0.6, 'rgba(220,240,255,0.12)');
    grd.addColorStop(1, 'rgba(190,225,255,0.03)');
    g.fillStyle = grd;
    g.fillRect(0, 0, w, h);
  });
}
