'use strict';

(function () {
  const { ctx, view, game, player, TAU } = PG;
  const clamp = PG.clamp;
  const lerp = PG.lerp;
  const rand = PG.rand;
  const smooth = (t) => t * t * (3 - 2 * t);

  let glowSprite = null;
  function getGlow() {
    if (!glowSprite) {
      glowSprite = document.createElement('canvas');
      glowSprite.width = 128;
      glowSprite.height = 128;
      const g = glowSprite.getContext('2d');
      const rg = g.createRadialGradient(64, 64, 2, 64, 64, 64);
      rg.addColorStop(0, 'rgba(255,228,140,.55)');
      rg.addColorStop(0.5, 'rgba(255,210,90,.2)');
      rg.addColorStop(1, 'rgba(255,200,60,0)');
      g.fillStyle = rg;
      g.fillRect(0, 0, 128, 128);
    }
    return glowSprite;
  }

  const C = {
    cream: '#fff6e6',
    cream2: '#ffe8c8',
    ink: '#12313a',
    teal: '#0f5c66',
    teal2: '#1a8a8f',
    coral: '#ff6b57',
    coralDark: '#c93d2d',
    orange: '#ff9a3c',
    orangeDeep: '#e0702a',
    gold: '#ffc94d',
    sand: '#f2d6a0',
    sandDark: '#d8b273',
    wood: '#c98f4e',
    woodDark: '#a76f37',
  };

  /* --------------------------- palettes ---------------------------- */

  const SKIES = [
    { // clear day
      skyTop: [112, 204, 224], skyMid: [186, 231, 235], skyLow: [255, 233, 198],
      seaTop: [56, 166, 172], seaBot: [22, 96, 112],
      sun: [255, 246, 208], hillFar: [104, 158, 154], hillNear: [56, 116, 120],
      foam: [255, 255, 255], night: 0,
    },
    { // golden hour
      skyTop: [255, 168, 98], skyMid: [255, 206, 152], skyLow: [255, 240, 206],
      seaTop: [64, 158, 158], seaBot: [28, 100, 114],
      sun: [255, 232, 170], hillFar: [128, 134, 126], hillNear: [66, 102, 106],
      foam: [255, 250, 235], night: 0.05,
    },
    { // dusk
      skyTop: [82, 66, 124], skyMid: [190, 90, 110], skyLow: [255, 154, 104],
      seaTop: [48, 100, 124], seaBot: [22, 62, 84],
      sun: [255, 188, 138], hillFar: [72, 68, 94], hillNear: [38, 52, 72],
      foam: [255, 214, 190], night: 0.32,
    },
    { // night
      skyTop: [10, 20, 48], skyMid: [28, 44, 84], skyLow: [70, 90, 138],
      seaTop: [24, 54, 80], seaBot: [10, 28, 48],
      sun: [232, 240, 255], hillFar: [32, 46, 74], hillNear: [16, 30, 52],
      foam: [196, 222, 255], night: 1,
    },
    { // deep night (holds the mood)
      skyTop: [12, 24, 54], skyMid: [30, 46, 86], skyLow: [66, 86, 132],
      seaTop: [22, 52, 78], seaBot: [9, 26, 46],
      sun: [232, 240, 255], hillFar: [30, 44, 72], hillNear: [15, 28, 50],
      foam: [190, 218, 252], night: 1,
    },
    { // dawn
      skyTop: [122, 126, 176], skyMid: [232, 156, 152], skyLow: [255, 204, 170],
      seaTop: [54, 104, 124], seaBot: [26, 64, 86],
      sun: [255, 226, 190], hillFar: [92, 88, 108], hillNear: [48, 60, 78],
      foam: [255, 232, 220], night: 0.15,
    },
  ];

  const mix = (a, b, t) => [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t,
  ];

  const rgb = (c, a) =>
    a == null
      ? 'rgb(' + (c[0] | 0) + ',' + (c[1] | 0) + ',' + (c[2] | 0) + ')'
      : 'rgba(' + (c[0] | 0) + ',' + (c[1] | 0) + ',' + (c[2] | 0) + ',' + a + ')';

  function getPalette() {
    const p = ((game.scroll / 36000) % 1 + 1) % 1;
    const f = p * SKIES.length;
    const i0 = Math.floor(f) % SKIES.length;
    const i1 = (i0 + 1) % SKIES.length;
    const t = smooth(f % 1);
    const a = SKIES[i0];
    const b = SKIES[i1];
    return {
      skyTop: mix(a.skyTop, b.skyTop, t),
      skyMid: mix(a.skyMid, b.skyMid, t),
      skyLow: mix(a.skyLow, b.skyLow, t),
      seaTop: mix(a.seaTop, b.seaTop, t),
      seaBot: mix(a.seaBot, b.seaBot, t),
      sun: mix(a.sun, b.sun, t),
      hillFar: mix(a.hillFar, b.hillFar, t),
      hillNear: mix(a.hillNear, b.hillNear, t),
      foam: mix(a.foam, b.foam, t),
      night: lerp(a.night, b.night, t),
    };
  }

  /* ---------------------------- scenery ---------------------------- */

  const sc = {
    w: 0, h: 0,
    clouds: [], birds: [], stars: [], grass: [], palms: [], pebbles: [], boats: [], islands: [],
  };

  function ensureScenery() {
    if (sc.w === view.W && sc.h === view.H) return;
    sc.w = view.W;
    sc.h = view.H;

    sc.clouds = [];
    const n = Math.max(4, Math.round(view.W / 300));
    for (let i = 0; i < n; i++) {
      sc.clouds.push({
        x: rand(0, view.W + 300),
        y: rand(view.H * 0.07, view.H * 0.32),
        s: rand(0.55, 1.25),
        v: rand(3, 10),
      });
    }

    sc.birds = [];
    for (let i = 0; i < 5; i++) {
      sc.birds.push({
        x: rand(0, view.W),
        y: rand(view.H * 0.1, view.H * 0.28),
        s: rand(0.6, 1.2),
        v: rand(9, 18),
        ph: rand(0, TAU),
      });
    }

    sc.stars = [];
    for (let i = 0; i < 80; i++) {
      sc.stars.push({
        x: rand(0, view.W),
        y: rand(0, view.horizon * 0.9),
        r: rand(0.5, 1.7),
        ph: rand(0, TAU),
      });
    }

    sc.grass = [];
    for (let i = 0; i < 30; i++) {
      sc.grass.push({
        x: rand(-40, view.W + 40),
        h: rand(0.35, 1),
        w: rand(0.7, 1.4),
        ph: rand(0, TAU),
      });
    }

    sc.palms = [];
    const palmN = Math.max(3, Math.round(view.W / 220));
    for (let i = 0; i < palmN; i++) {
      sc.palms.push({
        x: (i / palmN) * view.W + rand(-40, 40),
        s: rand(0.66, 1.05),
        ph: rand(0, TAU),
      });
    }

    sc.pebbles = [];
    for (let i = 0; i < 46; i++) {
      sc.pebbles.push({
        x: rand(0, view.W),
        y: rand(view.groundY + 16, view.H - 6),
        r: rand(1, 2.6),
        c: Math.random() < 0.5 ? 'rgba(160,118,62,.35)' : 'rgba(255,255,255,.4)',
      });
    }

    sc.islands = [];
    for (let i = 0; i < 3; i++) {
      sc.islands.push({
        x: rand(0, view.W + 300),
        w: rand(80, 150),
        h: rand(6, 14),
        ph: rand(0, TAU),
      });
    }

    sc.boats = [];
    for (let i = 0; i < 2; i++) {
      sc.boats.push({
        x: rand(0, view.W),
        y: view.horizon + rand(10, 40),
        s: rand(0.7, 1.1),
      });
    }
  }

  /* ----------------------------- sky ------------------------------- */

  function drawSky(pal) {
    const g = ctx.createLinearGradient(0, 0, 0, view.horizon + 40);
    g.addColorStop(0, rgb(pal.skyTop));
    g.addColorStop(0.58, rgb(pal.skyMid));
    g.addColorStop(1, rgb(pal.skyLow));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, view.W, view.horizon + 40);
  }

  function drawStars(pal) {
    if (pal.night < 0.03) return;
    for (const s of sc.stars) {
      const tw = 0.45 + 0.55 * Math.abs(Math.sin(game.t * 1.4 + s.ph));
      ctx.globalAlpha = pal.night * tw * 0.9;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function drawSun(pal) {
    const U = view.U;
    const x = view.W * 0.78;
    const y = view.horizon - view.H * 0.245;
    const r = 34 * U;

    const g = ctx.createRadialGradient(x, y, r * 0.4, x, y, r * 5.2);
    g.addColorStop(0, rgb(pal.sun, 0.38));
    g.addColorStop(0.45, rgb(pal.sun, 0.12));
    g.addColorStop(1, rgb(pal.sun, 0));
    ctx.fillStyle = g;
    ctx.fillRect(x - r * 5.2, y - r * 5.2, r * 10.4, r * 10.4);

    ctx.fillStyle = rgb(pal.sun);
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.fill();

    if (pal.night > 0.55) {
      ctx.fillStyle = rgb(pal.skyTop, 0.1);
      ctx.beginPath();
      ctx.arc(x - r * 0.3, y - r * 0.18, r * 0.16, 0, TAU);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x + r * 0.26, y + r * 0.24, r * 0.1, 0, TAU);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x + r * 0.02, y - r * 0.46, r * 0.06, 0, TAU);
      ctx.fill();
    }
  }

  function drawClouds(pal, dt) {
    const U = view.U;
    const speed = game.speed;
    for (const c of sc.clouds) {
      c.x -= (c.v + speed * 0.018) * dt;
      if (c.x < -220) {
        c.x = view.W + 220;
        c.y = rand(view.H * 0.07, view.H * 0.32);
      }
      const s = c.s * U;
      const a = 0.42 - pal.night * 0.3;
      ctx.fillStyle = rgb(mix(pal.skyLow, [255, 255, 255], 0.75), a);
      const y = c.y;
      const x = c.x;
      ctx.beginPath();
      ctx.arc(x, y, 26 * s, 0, TAU);
      ctx.arc(x + 30 * s, y - 8 * s, 20 * s, 0, TAU);
      ctx.arc(x - 28 * s, y + 2 * s, 18 * s, 0, TAU);
      ctx.arc(x + 8 * s, y + 8 * s, 22 * s, 0, TAU);
      ctx.fill();
      ctx.fillRect(x - 44 * s, y + 6 * s, 90 * s, 14 * s);
    }
  }

  function drawBirds(pal, dt) {
    const U = view.U;
    ctx.strokeStyle = rgb(mix(pal.hillNear, [10, 20, 30], 0.5), 0.55);
    ctx.lineWidth = 1.8 * U;
    ctx.lineCap = 'round';
    for (const b of sc.birds) {
      b.x -= (b.v + game.speed * 0.02) * dt;
      if (b.x < -60) {
        b.x = view.W + 60;
        b.y = rand(view.H * 0.1, view.H * 0.28);
      }
      const flap = Math.sin(game.t * 6 + b.ph) * 5 * U;
      const s = b.s * U;
      ctx.beginPath();
      ctx.moveTo(b.x - 9 * s, b.y + flap * 0.4);
      ctx.quadraticCurveTo(b.x - 4 * s, b.y - 4 * s, b.x, b.y);
      ctx.quadraticCurveTo(b.x + 4 * s, b.y - 4 * s, b.x + 9 * s, b.y + flap * 0.4);
      ctx.stroke();
    }
  }

  function drawHills(pal) {
    const U = view.U;
    const baseY = view.horizon + 8;

    ctx.fillStyle = rgb(pal.hillFar, 0.9);
    ctx.beginPath();
    ctx.moveTo(0, baseY + 30);
    const off1 = (game.scroll * 0.045) % 600;
    for (let x = -40; x <= view.W + 40; x += 22) {
      const y = baseY - 16 * U
        - Math.sin((x + off1) * 0.0055) * 13 * U
        - Math.sin((x + off1) * 0.013 + 1.7) * 7 * U;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(view.W + 40, baseY + 40);
    ctx.lineTo(-40, baseY + 40);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = rgb(pal.hillNear, 0.95);
    ctx.beginPath();
    ctx.moveTo(0, baseY + 40);
    const off2 = (game.scroll * 0.09) % 600;
    for (let x = -40; x <= view.W + 40; x += 20) {
      const y = baseY + 4 * U
        - Math.sin((x + off2) * 0.008 + 0.6) * 10 * U
        - Math.sin((x + off2) * 0.019 + 2.4) * 4 * U;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(view.W + 40, baseY + 60);
    ctx.lineTo(-40, baseY + 60);
    ctx.closePath();
    ctx.fill();

    // distant islands
    const span = view.W + 360;
    const offI = (game.scroll * 0.02) % span;
    ctx.fillStyle = rgb(pal.hillNear, 0.85);
    for (const isl of sc.islands) {
      let x = ((isl.x - offI) % span + span) % span - 180;
      const y = view.horizon + 3;
      ctx.beginPath();
      ctx.moveTo(x - isl.w * 0.5, y);
      ctx.quadraticCurveTo(x - isl.w * 0.18, y - isl.h, x, y - isl.h);
      ctx.quadraticCurveTo(x + isl.w * 0.18, y - isl.h, x + isl.w * 0.5, y);
      ctx.closePath();
      ctx.fill();

      // tiny palm on the island
      ctx.strokeStyle = rgb(pal.hillNear, 0.85);
      ctx.lineWidth = 1.1;
      const px = x + isl.w * 0.08;
      const py = y - isl.h;
      ctx.beginPath();
      ctx.moveTo(px, py + 1);
      ctx.quadraticCurveTo(px - 1, py - 5, px + 0.5, py - 9);
      ctx.stroke();
      for (let k = -1; k <= 1; k++) {
        ctx.beginPath();
        ctx.moveTo(px + 0.5, py - 9);
        ctx.quadraticCurveTo(px + k * 3, py - 12, px + k * 6, py - 11.5);
        ctx.stroke();
      }
    }
  }

  function drawSea(pal) {
    const U = view.U;
    const top = view.horizon + 6;
    const bottom = view.groundY;
    const g = ctx.createLinearGradient(0, top, 0, bottom);
    g.addColorStop(0, rgb(pal.seaTop));
    g.addColorStop(1, rgb(pal.seaBot));
    ctx.fillStyle = g;
    ctx.fillRect(0, top, view.W, bottom - top);

    // horizon haze
    const haze = ctx.createLinearGradient(0, top, 0, top + 40 * U);
    haze.addColorStop(0, rgb(pal.skyLow, 0.45));
    haze.addColorStop(1, rgb(pal.skyLow, 0));
    ctx.fillStyle = haze;
    ctx.fillRect(0, top, view.W, 40 * U);

    // wave bands
    for (let b = 0; b < 3; b++) {
      const y0 = top + (bottom - top) * (0.28 + b * 0.23);
      const off = game.scroll * (0.035 + b * 0.025) + b * 160;
      ctx.beginPath();
      for (let x = -10; x <= view.W + 10; x += 16) {
        const y = y0 + Math.sin((x + off) * 0.017 + b * 1.3) * 3.2 * U;
        if (x === -10) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = rgb(pal.foam, 0.2 - b * 0.045);
      ctx.lineWidth = (2.2 - b * 0.4) * U;
      ctx.stroke();
    }

    // glints
    ctx.strokeStyle = rgb(pal.foam, 0.5 - pal.night * 0.25);
    ctx.lineWidth = 1.4 * U;
    ctx.lineCap = 'round';
    for (let i = 0; i < 22; i++) {
      const seed = i * 127.31;
      const y = top + ((Math.sin(seed) * 0.5 + 0.5) * (bottom - top) * 0.9) + 8 * U;
      const speed = 0.2 + (i % 5) * 0.05;
      const x = ((seed * 37 + game.scroll * speed) % (view.W + 120)) - 60;
      const len = (4 + (i % 4) * 3) * U;
      ctx.globalAlpha = 0.35 + 0.3 * Math.sin(game.t * 2 + i);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + len, y);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // sun glitter
    const sunX = view.W * 0.78;
    ctx.strokeStyle = rgb(pal.sun, 0.4);
    ctx.lineWidth = 1.6 * U;
    for (let i = 0; i < 16; i++) {
      const seed = i * 63.7;
      const yy = top + 14 * U + ((i / 16) * (bottom - top) * 0.9);
      const spread = 14 * U + (i / 16) * 46 * U;
      const xx = sunX + Math.sin(game.t * 1.2 + seed) * spread * 0.4;
      const len = (5 + (i % 5) * 4) * U * (0.5 + (i / 16));
      ctx.globalAlpha = 0.25 + 0.2 * Math.sin(game.t * 1.7 + i);
      ctx.beginPath();
      ctx.moveTo(xx - len, yy);
      ctx.lineTo(xx + len, yy);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // little sailboats
    for (const b of sc.boats) {
      const x = ((b.x - game.scroll * 0.02) % (view.W + 200) + view.W + 200) % (view.W + 200) - 100;
      const s = b.s * U;
      const y = b.y + Math.sin(game.t * 1.1 + b.x) * 1.5;
      ctx.fillStyle = rgb(pal.foam, 0.55);
      ctx.beginPath();
      ctx.moveTo(x, y - 26 * s);
      ctx.lineTo(x + 14 * s, y - 2 * s);
      ctx.lineTo(x - 2 * s, y - 2 * s);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = rgb(pal.hillNear, 0.65);
      ctx.beginPath();
      ctx.moveTo(x - 8 * s, y);
      ctx.lineTo(x + 12 * s, y);
      ctx.lineTo(x + 8 * s, y + 4 * s);
      ctx.lineTo(x - 5 * s, y + 4 * s);
      ctx.closePath();
      ctx.fill();
    }
  }

  function drawBeach() {
    const U = view.U;
    const gy = view.groundY;
    const g = ctx.createLinearGradient(0, gy, 0, view.H);
    g.addColorStop(0, '#f6ddab');
    g.addColorStop(0.5, '#eed09a');
    g.addColorStop(1, '#dcb87c');
    ctx.fillStyle = g;
    ctx.fillRect(0, gy, view.W, view.H - gy);

    // boardwalk edge
    ctx.fillStyle = 'rgba(255,255,255,.45)';
    ctx.fillRect(0, gy, view.W, 2.5 * U);
    ctx.fillStyle = 'rgba(120,86,40,.22)';
    ctx.fillRect(0, gy + 2.5 * U, view.W, 4 * U);

    // plank seams + alternating tint
    const step = 48 * U;
    const off = (game.scroll * 0.92) % step;
    ctx.fillStyle = 'rgba(150,110,58,.055)';
    for (let i = -1; i * step - off < view.W + step; i++) {
      if (i % 2 !== 0) continue;
      const x = i * step - off;
      ctx.fillRect(x, gy + 4 * U, step, view.H - gy);
    }
    ctx.strokeStyle = 'rgba(150,110,58,.3)';
    ctx.lineWidth = 1.4 * U;
    for (let x = -off; x < view.W + step; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, gy + 6 * U);
      ctx.lineTo(x, view.H);
      ctx.stroke();
    }

    // wood grain flecks
    ctx.fillStyle = 'rgba(150,110,58,.16)';
    for (let i = 0; i < 26; i++) {
      const seed = i * 91.7;
      const gx = ((seed * 53 - game.scroll * 0.92) % (view.W + 40) + view.W + 40) % (view.W + 40) - 20;
      const gyy = gy + 14 * U + ((Math.sin(seed) * 0.5 + 0.5) * (view.H - gy - 24 * U));
      ctx.fillRect(gx, gyy, (5 + (i % 4) * 4) * U, 1.3 * U);
    }

    // long horizontal joints
    ctx.strokeStyle = 'rgba(150,110,58,.22)';
    for (let i = 1; i <= 2; i++) {
      const y = gy + (view.H - gy) * (i / 3);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(view.W, y);
      ctx.stroke();
    }

    // pebbles / shells
    for (const p of sc.pebbles) {
      const x = ((p.x - game.scroll) % view.W + view.W) % view.W;
      ctx.fillStyle = p.c;
      ctx.beginPath();
      ctx.arc(x, p.y, p.r * U, 0, TAU);
      ctx.fill();
    }
  }

  function drawSandbar(pal) {
    const U = view.U;
    const gy = view.groundY;
    const top = gy - 26 * U;

    ctx.fillStyle = '#e7c98f';
    ctx.beginPath();
    ctx.moveTo(0, gy);
    ctx.lineTo(0, top + 5 * U);
    const off = (game.scroll * 0.25) % 400;
    for (let x = 0; x <= view.W + 20; x += 20) {
      const y = top + Math.sin((x + off) * 0.012) * 3.5 * U
        + Math.sin((x + off) * 0.031 + 2) * 1.6 * U;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(view.W + 20, gy);
    ctx.closePath();
    ctx.fill();

    // wet-sand shadow
    ctx.fillStyle = 'rgba(90, 70, 40, .16)';
    ctx.fillRect(0, gy - 5 * U, view.W, 5 * U);
  }

  function drawPalms(pal) {
    const U = view.U;
    const span = view.W + 520;
    const off = (game.scroll * 0.5) % span;
    ctx.lineCap = 'round';

    for (const p of sc.palms) {
      let x = ((p.x - off) % span + span) % span - 260;
      if (x < -220 || x > view.W + 220) continue;
      const s = p.s * U;
      const baseY = view.groundY - 3 * U;
      const sway = Math.sin(game.t * 0.9 + p.ph) * 0.05;

      ctx.save();
      ctx.translate(x, baseY);
      ctx.scale(s, s);
      ctx.globalAlpha = 0.94;

      ctx.strokeStyle = 'rgba(40,78,70,.92)';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(-9, -66, 5, -118);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(34,92,78,.92)';
      ctx.lineWidth = 4.5;
      for (let i = 0; i < 6; i++) {
        const a = -Math.PI * 0.92 + i * (Math.PI * 0.78 / 5) + sway;
        const len = 34 + (i % 2) * 9;
        ctx.beginPath();
        ctx.moveTo(5, -118);
        ctx.quadraticCurveTo(
          5 + Math.cos(a) * len * 0.55,
          -118 + Math.sin(a) * len * 0.55 - 7,
          5 + Math.cos(a) * len,
          -118 + Math.sin(a) * len
        );
        ctx.stroke();
      }

      // coconuts
      ctx.fillStyle = 'rgba(40,70,52,.9)';
      ctx.beginPath();
      ctx.arc(1, -114, 3.2, 0, TAU);
      ctx.arc(9, -112, 2.6, 0, TAU);
      ctx.fill();

      ctx.restore();
    }
  }

  function drawForeground() {
    const U = view.U;
    const baseY = view.H + 6;
    const span = view.W + 200;
    const off = (game.scroll * 1.5) % span;

    ctx.fillStyle = 'rgba(20,62,60,.5)';
    for (const g of sc.grass) {
      let x = ((g.x - off) % span + span) % span - 100;
      const h = 34 * U * g.h;
      const sway = Math.sin(game.t * 2 + g.ph) * 5 * U;
      ctx.beginPath();
      ctx.moveTo(x - 3 * U * g.w, baseY);
      ctx.quadraticCurveTo(x + sway * 0.4, baseY - h * 0.6, x + sway, baseY - h);
      ctx.quadraticCurveTo(x + sway * 0.5 + 2 * U, baseY - h * 0.55, x + 4 * U * g.w, baseY);
      ctx.closePath();
      ctx.fill();
    }

    // soft bottom haze
    const g2 = ctx.createLinearGradient(0, view.H - 46 * U, 0, view.H);
    g2.addColorStop(0, 'rgba(8,40,44,0)');
    g2.addColorStop(1, 'rgba(8,40,44,.32)');
    ctx.fillStyle = g2;
    ctx.fillRect(0, view.H - 46 * U, view.W, 46 * U);
  }

  /* --------------------------- obstacles --------------------------- */

  function drawCone(x, gy, w, h) {
    const U = view.U;
    const half = w / 2;
    // base
    ctx.fillStyle = '#d0522f';
    ctx.beginPath();
    ctx.roundRect(x - half, gy - 5 * U, w, 5 * U, 2 * U);
    ctx.fill();

    // body
    ctx.fillStyle = '#ff7a3d';
    ctx.beginPath();
    ctx.moveTo(x - half * 0.82, gy - 3 * U);
    ctx.lineTo(x - half * 0.2, gy - h);
    ctx.lineTo(x + half * 0.2, gy - h);
    ctx.lineTo(x + half * 0.82, gy - 3 * U);
    ctx.closePath();
    ctx.fill();

    // white band
    ctx.fillStyle = 'rgba(255,248,232,.92)';
    ctx.beginPath();
    ctx.moveTo(x - half * 0.55, gy - h * 0.44);
    ctx.lineTo(x + half * 0.55, gy - h * 0.44);
    ctx.lineTo(x + half * 0.44, gy - h * 0.64);
    ctx.lineTo(x - half * 0.44, gy - h * 0.64);
    ctx.closePath();
    ctx.fill();

    // highlight
    ctx.fillStyle = 'rgba(255,255,255,.22)';
    ctx.beginPath();
    ctx.moveTo(x - half * 0.62, gy - 4 * U);
    ctx.lineTo(x - half * 0.14, gy - h * 0.96);
    ctx.lineTo(x - half * 0.04, gy - h * 0.96);
    ctx.lineTo(x - half * 0.42, gy - 4 * U);
    ctx.closePath();
    ctx.fill();
  }

  function drawCrate(x, gy, w, h) {
    const U = view.U;
    const half = w / 2;
    ctx.fillStyle = C.wood;
    ctx.beginPath();
    ctx.roundRect(x - half, gy - h, w, h, 3 * U);
    ctx.fill();
    ctx.strokeStyle = C.woodDark;
    ctx.lineWidth = 2 * U;
    ctx.stroke();

    // planks
    ctx.strokeStyle = 'rgba(120,74,32,.55)';
    ctx.lineWidth = 1.6 * U;
    for (let i = 1; i < 4; i++) {
      const y = gy - h + (h / 4) * i;
      ctx.beginPath();
      ctx.moveTo(x - half + 3 * U, y);
      ctx.lineTo(x + half - 3 * U, y);
      ctx.stroke();
    }
    // cross brace
    ctx.strokeStyle = 'rgba(120,74,32,.5)';
    ctx.lineWidth = 2.2 * U;
    ctx.beginPath();
    ctx.moveTo(x - half + 4 * U, gy - 4 * U);
    ctx.lineTo(x + half - 4 * U, gy - h + 4 * U);
    ctx.stroke();

    // teal strap
    ctx.fillStyle = C.teal2;
    ctx.fillRect(x - half, gy - h * 0.72, w, 5 * U);
    ctx.fillStyle = 'rgba(255,255,255,.18)';
    ctx.fillRect(x - half, gy - h * 0.72, w, 1.6 * U);
  }

  function drawCooler(x, gy, w, h) {
    const U = view.U;
    const half = w / 2;
    ctx.fillStyle = '#1b8a8f';
    ctx.beginPath();
    ctx.roundRect(x - half, gy - h, w, h, 4 * U);
    ctx.fill();
    ctx.fillStyle = '#2aa9a8';
    ctx.beginPath();
    ctx.roundRect(x - half + 2 * U, gy - h + 2 * U, w - 4 * U, h * 0.55, 3 * U);
    ctx.fill();

    // lid
    ctx.fillStyle = '#fff6e6';
    ctx.beginPath();
    ctx.roundRect(x - half - 1.5 * U, gy - h - 5 * U, w + 3 * U, 8 * U, 3 * U);
    ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,.12)';
    ctx.fillRect(x - half - 1.5 * U, gy - h + 2 * U, w + 3 * U, 1.6 * U);

    // handle
    ctx.strokeStyle = '#e8dcc4';
    ctx.lineWidth = 2.2 * U;
    ctx.beginPath();
    ctx.arc(x, gy - h - 8 * U, 7 * U, Math.PI, 0);
    ctx.stroke();
  }

  function drawCrab(x, gy, w, h, t) {
    const U = view.U;
    const leg = Math.sin(t * 10) * 2 * U;
    ctx.strokeStyle = '#b8392a';
    ctx.lineWidth = 2.6 * U;
    ctx.lineCap = 'round';
    for (let i = -1; i <= 1; i += 2) {
      for (let k = 0; k < 3; k++) {
        ctx.beginPath();
        ctx.moveTo(x + i * (w * 0.28 + k * 4 * U), gy - h * 0.5);
        ctx.lineTo(x + i * (w * 0.46 + k * 5 * U), gy - 1 + (k % 2 ? leg : -leg));
        ctx.stroke();
      }
    }

    // body
    ctx.fillStyle = '#e85a41';
    ctx.beginPath();
    ctx.ellipse(x, gy - h * 0.58, w * 0.36, h * 0.42, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.18)';
    ctx.beginPath();
    ctx.ellipse(x - w * 0.1, gy - h * 0.7, w * 0.16, h * 0.14, 0, 0, TAU);
    ctx.fill();

    // claws
    ctx.fillStyle = '#f06a4f';
    for (let i = -1; i <= 1; i += 2) {
      const cx = x + i * (w * 0.44);
      const cy = gy - h * 0.95 + (i > 0 ? leg : -leg);
      ctx.beginPath();
      ctx.ellipse(cx, cy, 7 * U, 5 * U, i * 0.5, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = '#b8392a';
      ctx.lineWidth = 1.4 * U;
      ctx.beginPath();
      ctx.moveTo(cx + i * 4 * U, cy - 2 * U);
      ctx.lineTo(cx + i * 8 * U, cy + 1 * U);
      ctx.stroke();
    }

    // eyes
    ctx.strokeStyle = '#8f2c1f';
    ctx.lineWidth = 1.6 * U;
    for (let i = -1; i <= 1; i += 2) {
      ctx.beginPath();
      ctx.moveTo(x + i * 5 * U, gy - h * 0.82);
      ctx.lineTo(x + i * 5 * U, gy - h * 1.1);
      ctx.stroke();
      ctx.fillStyle = '#fff6e6';
      ctx.beginPath();
      ctx.arc(x + i * 5 * U, gy - h * 1.14, 2.6 * U, 0, TAU);
      ctx.fill();
      ctx.fillStyle = C.ink;
      ctx.beginPath();
      ctx.arc(x + i * 5 * U, gy - h * 1.14, 1.2 * U, 0, TAU);
      ctx.fill();
    }
  }

  function drawObstacles() {
    const gy = view.groundY;
    for (const o of game.obstacles) {
      const x = o.x;
      if (x < -120 || x > view.W + 160) continue;
      if (o.type === 'cone') drawCone(x, gy, o.w, o.h);
      else if (o.type === 'crate') drawCrate(x, gy, o.w, o.h);
      else if (o.type === 'cooler') drawCooler(x, gy, o.w, o.h);
      else if (o.type === 'crab') drawCrab(x, gy, o.w, o.h, o.t);
    }
  }

  /* ----------------------------- fish ------------------------------ */

  function drawFish(f) {
    const U = view.U;
    const x = f.x;
    const y = view.groundY - f.y + Math.sin(f.ph) * 3 * U;

    const glow = getGlow();
    ctx.drawImage(glow, x - 28 * U, y - 28 * U, 56 * U, 56 * U);

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.sin(f.ph * 0.7) * 0.12);

    // tail
    ctx.fillStyle = '#ffb43f';
    ctx.beginPath();
    ctx.moveTo(-7 * U, 0);
    ctx.lineTo(-18 * U, -8 * U);
    ctx.lineTo(-15 * U, 0);
    ctx.lineTo(-18 * U, 8 * U);
    ctx.closePath();
    ctx.fill();

    // body
    ctx.fillStyle = '#ffd35e';
    ctx.beginPath();
    ctx.ellipse(1 * U, 0, 12 * U, 7.5 * U, 0, 0, TAU);
    ctx.fill();

    // belly shine
    ctx.fillStyle = 'rgba(255,255,255,.55)';
    ctx.beginPath();
    ctx.ellipse(2 * U, 2.4 * U, 7.5 * U, 3.6 * U, 0, 0, TAU);
    ctx.fill();

    // fin
    ctx.fillStyle = '#ffbf4a';
    ctx.beginPath();
    ctx.moveTo(-1 * U, -6.5 * U);
    ctx.lineTo(3 * U, -11 * U);
    ctx.lineTo(6 * U, -6 * U);
    ctx.closePath();
    ctx.fill();

    // eye
    ctx.fillStyle = '#5a2b08';
    ctx.beginPath();
    ctx.arc(8 * U, -1.4 * U, 1.7 * U, 0, TAU);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.85)';
    ctx.beginPath();
    ctx.arc(8.6 * U, -2 * U, 0.6 * U, 0, TAU);
    ctx.fill();

    ctx.restore();
  }

  /* ---------------------------- player ----------------------------- */

  function ik(ax, ay, bx, by, l1, l2) {
    const dx = bx - ax;
    const dy = by - ay;
    let d = Math.hypot(dx, dy);
    d = Math.max(0.001, Math.min(d, l1 + l2 - 0.01));
    const a = (l1 * l1 - l2 * l2 + d * d) / (2 * d);
    const hh = Math.sqrt(Math.max(0, l1 * l1 - a * a));
    const mx = ax + (dx / d) * a;
    const my = ay + (dy / d) * a;
    const nx = (-dy / d) * hh;
    const ny = (dx / d) * hh;
    const k1 = { x: mx + nx, y: my + ny };
    const k2 = { x: mx - nx, y: my - ny };
    return k1.x > k2.x ? k1 : k2;
  }

  function drawWheel(x, y, r, angle) {
    ctx.save();
    ctx.translate(x, y);

    ctx.strokeStyle = '#1d2a2e';
    ctx.lineWidth = 4.6;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, TAU);
    ctx.stroke();

    ctx.strokeStyle = '#f4e6c8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, r - 2.6, 0, TAU);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(244,230,200,.75)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 4; i++) {
      const a = angle + (i * Math.PI) / 4;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * (r - 3), Math.sin(a) * (r - 3));
      ctx.lineTo(-Math.cos(a) * (r - 3), -Math.sin(a) * (r - 3));
      ctx.stroke();
    }

    ctx.fillStyle = C.coral;
    ctx.beginPath();
    ctx.arc(0, 0, 2.4, 0, TAU);
    ctx.fill();

    ctx.restore();
  }

  function drawLeg(hx, hy, fx, fy, color, lw) {
    const k = ik(hx, hy, fx, fy, 19, 19);
    ctx.strokeStyle = color;
    ctx.lineWidth = lw;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(hx, hy);
    ctx.lineTo(k.x, k.y);
    ctx.lineTo(fx, fy);
    ctx.stroke();

    ctx.fillStyle = C.orangeDeep;
    ctx.beginPath();
    ctx.ellipse(fx + 1.5, fy + 0.5, 4.2, 2.2, 0, 0, TAU);
    ctx.fill();
  }

  function drawPelicanBody(t) {
    // tail feathers
    ctx.fillStyle = '#ffe6c4';
    ctx.beginPath();
    ctx.moveTo(-18, -64);
    ctx.lineTo(-33, -71);
    ctx.lineTo(-29, -61);
    ctx.lineTo(-34, -55);
    ctx.lineTo(-17, -54);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(214, 170, 120, .55)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // body
    ctx.fillStyle = C.cream;
    ctx.beginPath();
    ctx.ellipse(-2, -66, 20, 15, -0.16, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = 'rgba(226, 186, 136, .55)';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // belly shade
    ctx.fillStyle = 'rgba(255, 214, 160, .32)';
    ctx.beginPath();
    ctx.ellipse(-1, -58.5, 15, 7, -0.12, 0, TAU);
    ctx.fill();

    // neck
    ctx.strokeStyle = C.cream;
    ctx.lineWidth = 9.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(7, -77);
    ctx.quadraticCurveTo(17, -86, 21, -92);
    ctx.stroke();

    // head
    ctx.fillStyle = C.cream;
    ctx.beginPath();
    ctx.arc(26, -96, 9.5, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = 'rgba(226, 186, 136, .45)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // beak
    ctx.fillStyle = C.orange;
    ctx.beginPath();
    ctx.moveTo(33, -100);
    ctx.quadraticCurveTo(52, -98, 62, -92);
    ctx.quadraticCurveTo(50, -86, 34, -88);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(180, 88, 28, .5)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // pouch
    ctx.fillStyle = '#ffb257';
    ctx.beginPath();
    ctx.moveTo(35, -89);
    ctx.quadraticCurveTo(50, -85, 60, -91);
    ctx.quadraticCurveTo(50, -78, 37, -82);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = C.orangeDeep;
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(34, -91);
    ctx.quadraticCurveTo(47, -88, 61, -92);
    ctx.stroke();

    // nostril
    ctx.fillStyle = 'rgba(160, 76, 24, .55)';
    ctx.beginPath();
    ctx.ellipse(40, -96.5, 2.2, 1.1, -0.1, 0, TAU);
    ctx.fill();

    // eye
    const blink = Math.sin(t * 0.8) > 0.985;
    if (blink) {
      ctx.strokeStyle = C.ink;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(28.5, -94);
      ctx.lineTo(32.5, -94);
      ctx.stroke();
    } else {
      ctx.fillStyle = C.ink;
      ctx.beginPath();
      ctx.arc(30.5, -94, 2.1, 0, TAU);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.92)';
      ctx.beginPath();
      ctx.arc(31.2, -94.7, 0.7, 0, TAU);
      ctx.fill();
    }

    // helmet
    ctx.fillStyle = C.teal2;
    ctx.beginPath();
    ctx.arc(25.5, -97.5, 9.9, Math.PI * 1.0, Math.PI * 2.0);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.22)';
    ctx.beginPath();
    ctx.arc(23, -100, 5.6, Math.PI * 1.08, Math.PI * 1.62);
    ctx.fill();
    // brim
    ctx.fillStyle = C.teal;
    ctx.beginPath();
    ctx.moveTo(32, -98.5);
    ctx.lineTo(39, -96.5);
    ctx.lineTo(32, -95.6);
    ctx.closePath();
    ctx.fill();
    // strap
    ctx.strokeStyle = C.teal;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(19, -96);
    ctx.lineTo(18, -90);
    ctx.stroke();

    // scarf
    const s1 = Math.sin(t * 5) * 2.5;
    const s2 = Math.sin(t * 5 + 1.1) * 3.5;
    ctx.strokeStyle = C.coral;
    ctx.lineWidth = 4.2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(15, -87);
    ctx.quadraticCurveTo(3, -89 + s1, -8, -83 + s2);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,.28)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(14, -88.5);
    ctx.quadraticCurveTo(3, -90 + s1, -7, -84.5 + s2);
    ctx.stroke();
  }

  function drawWing(t, airborne) {
    const flap = airborne
      ? Math.sin(t * 20) * 0.75 - 0.35
      : Math.sin(player.wheel * 2) * 0.06 - 0.16;
    const lift = Math.sin(t * 20) * 3;

    ctx.save();
    ctx.translate(2, -72);
    ctx.rotate(flap);

    ctx.fillStyle = C.cream2;
    ctx.strokeStyle = 'rgba(212, 168, 112, .7)';
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(5, -5);
    ctx.quadraticCurveTo(-8, -10 + lift * 0.4, -17, -2 + lift * 0.5);
    ctx.quadraticCurveTo(-12, 5 + lift * 0.4, 4, 4);
    ctx.quadraticCurveTo(9, 0, 5, -5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // dark feather tips
    ctx.fillStyle = 'rgba(30, 54, 60, .55)';
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(-12 + i * 3.4, -3 + lift * 0.5 + i * 1.3);
      ctx.lineTo(-17 + i * 3.4, 1 + lift * 0.5 + i * 1.5);
      ctx.lineTo(-11 + i * 3.4, 2 + lift * 0.5 + i * 1.3);
      ctx.closePath();
      ctx.fill();
    }
    ctx.strokeStyle = 'rgba(196, 148, 92, .6)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(-4 + i * 3.2, -4 + lift * 0.4);
      ctx.quadraticCurveTo(-11 + i * 3.2, -2 + lift * 0.4, -15 + i * 3.2, 1 + lift * 0.4);
      ctx.stroke();
    }

    ctx.restore();
  }

  function drawPlayer() {
    if (game.mode === 'menu' && view.W < 861) return;

    const U = view.U;
    const px = (game.mode === 'menu' ? view.W * 0.72 : player.x) + player.crashX;
    const py = view.groundY - player.h;
    const bob = player.grounded ? Math.sin(player.wheel * 2) * 0.9 * U : 0;

    // shadow
    const air = clamp(player.h / (170 * U), 0, 1);
    ctx.save();
    ctx.globalAlpha = 0.3 * (1 - air * 0.7);
    ctx.fillStyle = '#7a5a2c';
    ctx.beginPath();
    ctx.ellipse(px, view.groundY + 3 * U, 34 * U * (1 - air * 0.3), 7 * U * (1 - air * 0.35), 0, 0, TAU);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.translate(px, py + bob);

    // squash / stretch around the wheels
    const sq = player.squash;
    ctx.translate(0, 0);
    ctx.scale(1 + (1 - sq) * 0.55, sq);

    // tilt in air / tumble on crash
    if (game.mode === 'crashing') {
      ctx.translate(0, -44 * U);
      ctx.rotate(player.crashRot);
      ctx.translate(0, 44 * U);
    } else if (!player.grounded) {
      ctx.translate(0, -44 * U);
      ctx.rotate(clamp(-player.vy / (3000 * U), -0.14, 0.18));
      ctx.translate(0, 44 * U);
    }

    ctx.scale(U, U);

    const R = 16;
    const rearX = -24;
    const frontX = 26;
    const hubY = -R;

    // far leg (behind frame)
    const a = player.crank;
    const p1x = Math.cos(a) * 8;
    const p1y = -22 + Math.sin(a) * 8;
    const p2x = Math.cos(a + Math.PI) * 8;
    const p2y = -22 + Math.sin(a + Math.PI) * 8;
    drawLeg(-5, -52, p2x, p2y, '#d9762c', 3.4);

    // wheels
    drawWheel(rearX, hubY, R, player.wheel);
    drawWheel(frontX, hubY, R, player.wheel);

    // frame
    ctx.strokeStyle = C.coral;
    ctx.lineWidth = 3.6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(rearX, hubY);
    ctx.lineTo(-8, -46);
    ctx.lineTo(18, -50);
    ctx.lineTo(0, -22);
    ctx.closePath();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(18, -50);
    ctx.lineTo(frontX, hubY);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, -22);
    ctx.lineTo(rearX, hubY);
    ctx.stroke();

    // seat post + saddle
    ctx.strokeStyle = '#c9bda4';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(-8, -46);
    ctx.lineTo(-9, -51);
    ctx.stroke();
    ctx.fillStyle = C.ink;
    ctx.beginPath();
    ctx.ellipse(-9, -52.5, 7.5, 2.8, -0.08, 0, TAU);
    ctx.fill();

    // handlebar
    ctx.strokeStyle = '#c9bda4';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(18, -50);
    ctx.lineTo(21, -57);
    ctx.quadraticCurveTo(22, -60, 15, -60);
    ctx.stroke();
    ctx.fillStyle = C.ink;
    ctx.beginPath();
    ctx.roundRect(11.5, -61.6, 6, 3.2, 1.5);
    ctx.fill();

    // chainring
    ctx.strokeStyle = '#8f8775';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(0, -22, 5.5, 0, TAU);
    ctx.stroke();

    // rear basket with a snack poking out
    ctx.fillStyle = C.teal2;
    ctx.beginPath();
    ctx.roundRect(-32, -59, 14, 12, 2.5);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.35)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 2; i++) {
      ctx.beginPath();
      ctx.moveTo(-30, -55 + i * 4);
      ctx.lineTo(-20, -55 + i * 4);
      ctx.stroke();
    }
    ctx.fillStyle = C.gold;
    ctx.beginPath();
    ctx.moveTo(-27, -59);
    ctx.lineTo(-32, -68);
    ctx.lineTo(-24, -64);
    ctx.closePath();
    ctx.fill();

    // water bottle
    ctx.save();
    ctx.translate(9, -38);
    ctx.rotate(-0.55);
    ctx.fillStyle = C.teal2;
    ctx.beginPath();
    ctx.roundRect(-2.5, -5.5, 5, 11, 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.4)';
    ctx.fillRect(-2.5, -3.5, 1.6, 7);
    ctx.restore();

    // near leg
    drawLeg(-5, -52, p1x, p1y, C.orange, 3.8);

    // pedals
    ctx.fillStyle = C.ink;
    ctx.beginPath();
    ctx.roundRect(p1x - 3.5, p1y - 1.2, 7, 2.6, 1.2);
    ctx.fill();
    ctx.beginPath();
    ctx.roundRect(p2x - 3.5, p2y - 1.2, 7, 2.6, 1.2);
    ctx.fill();

    // pelican
    drawPelicanBody(game.t);
    drawWing(game.t, !player.grounded || game.mode === 'crashing');

    ctx.restore();
  }

  /* --------------------------- particles --------------------------- */

  function drawParticles() {
    const U = view.U;
    for (const p of game.particles) {
      const a = clamp(p.life / p.max, 0, 1);
      ctx.globalAlpha = a;

      if (p.type === 'dust') {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (0.6 + (1 - a) * 0.8), 0, TAU);
        ctx.fill();
      } else if (p.type === 'spark') {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        const s = p.size;
        ctx.beginPath();
        ctx.moveTo(0, -s);
        ctx.lineTo(s * 0.35, -s * 0.35);
        ctx.lineTo(s, 0);
        ctx.lineTo(s * 0.35, s * 0.35);
        ctx.lineTo(0, s);
        ctx.lineTo(-s * 0.35, s * 0.35);
        ctx.lineTo(-s, 0);
        ctx.lineTo(-s * 0.35, -s * 0.35);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      } else if (p.type === 'feather') {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, p.size, p.size * 0.38, 0, 0, TAU);
        ctx.fill();
        ctx.strokeStyle = 'rgba(190,150,105,.4)';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(-p.size * 0.8, 0);
        ctx.lineTo(p.size * 0.8, 0);
        ctx.stroke();
        ctx.restore();
      } else if (p.type === 'ring') {
        const k = 1 - a;
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 2.4 * U * (1 - k * 0.6);
        ctx.globalAlpha = a * 0.7;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size + k * 46 * U, 0, TAU);
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
  }

  function drawPopups() {
    const U = view.U;
    for (const p of game.popups) {
      const a = clamp(p.life / p.max, 0, 1);
      const grow = 1 + (1 - a) * 0.12;
      ctx.save();
      ctx.globalAlpha = Math.min(1, a * 1.6);
      ctx.translate(p.x, p.y);
      ctx.scale(grow * p.scale, grow * p.scale);
      ctx.font = '900 ' + Math.round(17 * U) + 'px "Avenir Next", "Trebuchet MS", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.lineWidth = 4 * U;
      ctx.strokeStyle = 'rgba(8,40,45,.55)';
      ctx.strokeText(p.text, 0, 0);
      ctx.fillStyle = p.color;
      ctx.fillText(p.text, 0, 0);
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }

  /* --------------------------- speed lines ------------------------- */

  const streaks = [];
  for (let i = 0; i < 16; i++) {
    streaks.push({ x: Math.random(), y: rand(0.12, 0.86), len: rand(0.03, 0.12), v: rand(0.7, 1.6) });
  }

  function drawSpeedLines(dt) {
    const intensity = clamp((game.speed / Math.max(1, game.baseSpeed) - 1.08) / 0.65, 0, 1);
    if (intensity <= 0.01) return;
    ctx.strokeStyle = 'rgba(255,250,235,' + (0.16 * intensity) + ')';
    ctx.lineWidth = 1.6 * view.U;
    ctx.lineCap = 'round';
    for (const s of streaks) {
      s.x -= (game.speed * dt * s.v) / Math.max(1, view.W) * 1.6;
      if (s.x < -0.2) {
        s.x = 1.2;
        s.y = rand(0.12, 0.86);
      }
      const x = s.x * view.W;
      const y = s.y * view.H;
      const len = s.len * view.W;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + len, y);
      ctx.stroke();
    }
  }

  /* ---------------------------- render ----------------------------- */

  function render(dt) {
    ensureScenery();

    const pal = getPalette();
    const vdt = game.mode === 'paused' ? 0 : dt;

    let sx = 0;
    let sy = 0;
    if (game.shake > 0.001) {
      const mag = game.shake * game.shake * 17 * view.U;
      sx = rand(-mag, mag);
      sy = rand(-mag, mag);
    }

    ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
    ctx.save();
    ctx.translate(sx, sy);

    drawSky(pal);
    drawStars(pal);
    drawSun(pal);
    drawClouds(pal, vdt);
    drawBirds(pal, vdt);
    drawHills(pal);
    drawSea(pal);
    drawSandbar(pal);
    drawPalms(pal);
    drawBeach();

    drawFishLayer();
    drawObstacles();
    drawPlayer();
    drawParticles();
    drawPopups();
    drawSpeedLines(vdt);
    drawForeground();

    ctx.restore();

    if (game.flash > 0.001) {
      ctx.fillStyle = 'rgba(255,248,235,' + (game.flash * 0.55) + ')';
      ctx.fillRect(0, 0, view.W, view.H);
    }
  }

  function drawFishLayer() {
    for (const f of game.fishes) {
      if (f.x < -60 || f.x > view.W + 80) continue;
      drawFish(f);
    }
  }

  PG.render = render;
})();
