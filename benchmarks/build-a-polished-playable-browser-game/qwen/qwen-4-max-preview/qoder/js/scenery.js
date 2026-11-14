/* PELICAN PEDAL — parallax sunset boardwalk scenery (baked layers + cheap live detail) */
(function (global) {
  'use strict';
  var P = global.PP, C = P.C, TAU = P.TAU;

  var sky = null, seaGrad = null, sandGrad = null, plankPat = null, grainPat = null;
  var duneTile = null, vignette = null, V = null;
  var clouds = [], islands = [], palms = [], grass = [], props = [], shells = [];

  function mk(w, h) {
    var c = document.createElement('canvas');
    c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h));
    return c;
  }

  function bakeSky(w, h) {
    var c = mk(w, h), g = c.getContext('2d');
    var grd = g.createLinearGradient(0, 0, w * 0.25, h);
    grd.addColorStop(0, '#150A2E');
    grd.addColorStop(0.24, '#3B1361');
    grd.addColorStop(0.46, '#7A1E6B');
    grd.addColorStop(0.63, '#C93A63');
    grd.addColorStop(0.79, '#FF6B4A');
    grd.addColorStop(0.92, '#FFB020');
    grd.addColorStop(1, '#FFD84D');
    g.fillStyle = grd; g.fillRect(0, 0, w, h);

    // aurora-ish mesh wash for depth
    var m = g.createRadialGradient(w * 0.18, h * 0.12, 10, w * 0.18, h * 0.12, h * 0.9);
    m.addColorStop(0, 'rgba(55,225,255,.20)'); m.addColorStop(1, 'rgba(55,225,255,0)');
    g.fillStyle = m; g.fillRect(0, 0, w, h);
    var m2 = g.createRadialGradient(w * 0.9, h * 0.05, 10, w * 0.9, h * 0.05, h * 0.8);
    m2.addColorStop(0, 'rgba(255,61,139,.22)'); m2.addColorStop(1, 'rgba(255,61,139,0)');
    g.fillStyle = m2; g.fillRect(0, 0, w, h);

    // stars in the upper band
    for (var i = 0; i < 70; i++) {
      var sy = Math.random() * h * 0.4;
      var a = (1 - sy / (h * 0.4)) * 0.75 * Math.random();
      g.fillStyle = 'rgba(255,243,226,' + a.toFixed(3) + ')';
      var r = Math.random() < 0.85 ? 1 : 1.7;
      g.fillRect(Math.random() * w, sy, r, r);
    }

    // retro sun with scan bands
    var sx = w * 0.7, sy2 = h * 0.82, R = Math.min(h * 0.46, 132);
    var glow = g.createRadialGradient(sx, sy2, R * 0.4, sx, sy2, R * 3.1);
    glow.addColorStop(0, 'rgba(255,190,80,.55)');
    glow.addColorStop(0.4, 'rgba(255,110,70,.22)');
    glow.addColorStop(1, 'rgba(255,61,139,0)');
    g.fillStyle = glow; g.beginPath(); g.arc(sx, sy2, R * 3.1, 0, TAU); g.fill();

    var sg = g.createLinearGradient(0, sy2 - R, 0, sy2 + R);
    sg.addColorStop(0, '#FFF1C4'); sg.addColorStop(0.45, '#FFD84D');
    sg.addColorStop(0.75, '#FF9E3D'); sg.addColorStop(1, '#FF5C7A');
    g.save();
    g.beginPath(); g.arc(sx, sy2, R, 0, TAU); g.clip();
    g.fillStyle = sg; g.fillRect(sx - R, sy2 - R, R * 2, R * 2);
    g.globalCompositeOperation = 'destination-out';
    for (var b = 0; b < 9; b++) {
      var by = sy2 - R * 0.1 + b * (R * 0.16);
      g.fillRect(sx - R, by, R * 2, 2 + b * 1.5);
    }
    g.restore();
    return c;
  }

  function bakeDunes(w, h) {
    var c = mk(w, h), g = c.getContext('2d');
    g.fillStyle = '#7A3F63';
    g.beginPath(); g.moveTo(0, h);
    for (var x = 0; x <= w; x += 8) {
      var y = h - 26 - Math.sin(x / w * TAU * 2) * 12 - Math.sin(x / w * TAU * 5 + 1.3) * 6;
      g.lineTo(x, y);
    }
    g.lineTo(w, h); g.closePath(); g.fill();

    g.fillStyle = '#9B4F63';
    g.beginPath(); g.moveTo(0, h);
    for (var x2 = 0; x2 <= w; x2 += 8) {
      var y2 = h - 12 - Math.sin(x2 / w * TAU * 3 + 2.1) * 8 - Math.sin(x2 / w * TAU * 7) * 3;
      g.lineTo(x2, y2);
    }
    g.lineTo(w, h); g.closePath(); g.fill();

    // beach grass silhouettes
    g.strokeStyle = 'rgba(45,18,52,.75)'; g.lineWidth = 1.6; g.lineCap = 'round';
    for (var i = 0; i < 90; i++) {
      var gx = Math.random() * w;
      var gy = h - 14 - Math.sin(gx / w * TAU * 3 + 2.1) * 8;
      var lean = (Math.random() - 0.5) * 12;
      g.beginPath(); g.moveTo(gx, gy + 6);
      g.quadraticCurveTo(gx + lean * 0.4, gy - 8, gx + lean, gy - 16 - Math.random() * 10);
      g.stroke();
    }
    return c;
  }

  function bakePlanks() {
    var w = 52, h = 22, c = mk(w, h), g = c.getContext('2d');
    var grd = g.createLinearGradient(0, 0, 0, h);
    grd.addColorStop(0, '#E9B77C'); grd.addColorStop(0.35, '#D2955C'); grd.addColorStop(1, '#A96C42');
    g.fillStyle = grd; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(255,236,200,.5)'; g.fillRect(0, 0, w, 2);
    g.fillStyle = 'rgba(90,44,26,.55)'; g.fillRect(w - 3, 0, 3, h);
    g.strokeStyle = 'rgba(120,64,36,.28)'; g.lineWidth = 1;
    for (var i = 0; i < 4; i++) {
      var y = 4 + i * 4.5;
      g.beginPath(); g.moveTo(2, y);
      g.bezierCurveTo(w * 0.3, y + 1.4, w * 0.6, y - 1.4, w - 4, y + 0.6);
      g.stroke();
    }
    g.fillStyle = 'rgba(70,34,20,.4)';
    g.beginPath(); g.arc(8, 11, 1.5, 0, TAU); g.fill();
    g.beginPath(); g.arc(w - 12, 11, 1.5, 0, TAU); g.fill();
    return c;
  }

  function bakeGrain() {
    var s = 128, c = mk(s, s), g = c.getContext('2d');
    var img = g.createImageData(s, s), d = img.data;
    for (var i = 0; i < d.length; i += 4) {
      var v = 128 + (Math.random() - 0.5) * 255;
      d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 26;
    }
    g.putImageData(img, 0, 0);
    return c;
  }

  var Scenery = {
    build: function (view, ctx) {
      V = view;
      var w = view.right - view.left, h = view.horizon - view.top;
      sky = bakeSky(w, h);
      duneTile = bakeDunes(760, 74);
      var planks = bakePlanks();
      plankPat = ctx.createPattern(planks, 'repeat');
      grainPat = ctx.createPattern(bakeGrain(), 'repeat');

      seaGrad = ctx.createLinearGradient(0, view.horizon, 0, view.seaBottom);
      seaGrad.addColorStop(0, '#F2A05A');
      seaGrad.addColorStop(0.12, '#C9647E');
      seaGrad.addColorStop(0.4, '#3E6FA8');
      seaGrad.addColorStop(1, '#123C6B');

      sandGrad = ctx.createLinearGradient(0, view.seaBottom - 20, 0, view.bottom);
      sandGrad.addColorStop(0, '#C97A63');
      sandGrad.addColorStop(0.22, '#E0A272');
      sandGrad.addColorStop(0.6, '#C07850');
      sandGrad.addColorStop(1, '#6E3A44');

      vignette = ctx.createRadialGradient(
        view.vw * 0.5, view.vh * 0.48, Math.min(view.vw, view.vh) * 0.34,
        view.vw * 0.5, view.vh * 0.5, Math.max(view.vw, view.vh) * 0.78
      );
      vignette.addColorStop(0, 'rgba(13,6,32,0)');
      vignette.addColorStop(0.65, 'rgba(13,6,32,.18)');
      vignette.addColorStop(1, 'rgba(13,6,32,.62)');

      clouds.length = 0;
      for (var i = 0; i < 7; i++) {
        clouds.push({
          x: Math.random() * (view.vw + 400) - 200,
          y: view.top + 24 + Math.random() * (view.horizon - view.top) * 0.55,
          s: 0.5 + Math.random() * 1.1, v: 4 + Math.random() * 9,
          a: 0.1 + Math.random() * 0.22
        });
      }
      islands.length = 0;
      for (var j = 0; j < 4; j++) {
        islands.push({ x: j * 520 + Math.random() * 200, w: 150 + Math.random() * 190, h: 20 + Math.random() * 26, light: j % 2 === 0 });
      }
      palms.length = 0;
      for (var k = 0; k < 6; k++) {
        palms.push({ x: k * 430 + Math.random() * 140, h: 96 + Math.random() * 54, lean: (Math.random() - 0.5) * 0.34, seed: Math.random() * 10 });
      }
      grass.length = 0;
      for (var m = 0; m < 26; m++) {
        grass.push({ x: m * 90 + Math.random() * 50, h: 16 + Math.random() * 26, seed: Math.random() * 10 });
      }
      props.length = 0;
      var kinds = ['umbrella', 'board', 'castle', 'ball', 'umbrella', 'towel', 'castle', 'board'];
      for (var q = 0; q < kinds.length; q++) {
        props.push({ x: q * 300 + Math.random() * 120, k: kinds[q], s: 0.8 + Math.random() * 0.45, hue: Math.random() });
      }
      shells.length = 0;
      for (var z = 0; z < 30; z++) {
        shells.push({ x: z * 78 + Math.random() * 46, k: z % 3, s: 0.7 + Math.random() * 0.7, r: Math.random() * TAU });
      }
    },

    /* --- sky + sun + clouds (screen space, no scroll) --- */
    sky: function (g, view, t, dt) {
      g.drawImage(sky, view.left, view.top);
      for (var i = 0; i < clouds.length; i++) {
        var c = clouds[i];
        c.x -= c.v * dt;
        if (c.x < view.left - 260) { c.x = view.right + 120; c.y = view.top + 24 + Math.random() * (view.horizon - view.top) * 0.55; }
        g.save();
        g.globalAlpha = c.a;
        g.translate(c.x, c.y + Math.sin(t * 0.3 + i) * 3);
        g.scale(c.s, c.s);
        g.fillStyle = i % 2 ? '#FFC9A8' : '#E9A0C0';
        g.beginPath();
        g.ellipse(0, 0, 62, 11, 0, 0, TAU);
        g.ellipse(-26, -6, 30, 9, 0, 0, TAU);
        g.ellipse(24, -4, 26, 8, 0, 0, TAU);
        g.fill();
        g.restore();
      }
      g.globalAlpha = 1;
    },

    /* --- distant islands + lighthouse, slow parallax --- */
    islands: function (g, view, camX, t) {
      var px = camX * 0.06;
      g.save();
      for (var i = 0; i < islands.length; i++) {
        var o = islands[i];
        var span = 2080;
        var x = ((o.x - px) % span + span) % span - 300;
        if (x > view.right + 200 || x < view.left - 400) continue;
        var base = view.horizon + 2;
        g.fillStyle = 'rgba(58,26,74,.72)';
        g.beginPath();
        g.moveTo(x, base);
        g.quadraticCurveTo(x + o.w * 0.28, base - o.h, x + o.w * 0.52, base - o.h * 0.72);
        g.quadraticCurveTo(x + o.w * 0.78, base - o.h * 1.15, x + o.w, base);
        g.closePath(); g.fill();
        if (o.light) {
          var lx = x + o.w * 0.72, ly = base - o.h * 0.95;
          g.fillStyle = 'rgba(40,18,58,.9)';
          g.fillRect(lx - 3, ly - 20, 6, 22);
          var pulse = 0.45 + 0.55 * Math.abs(Math.sin(t * 0.9 + i));
          g.globalCompositeOperation = 'lighter';
          g.fillStyle = 'rgba(255,216,77,' + (0.85 * pulse).toFixed(3) + ')';
          g.beginPath(); g.arc(lx, ly - 21, 3.4, 0, TAU); g.fill();
          var lg = g.createRadialGradient(lx, ly - 21, 1, lx, ly - 21, 40);
          lg.addColorStop(0, 'rgba(255,216,77,' + (0.3 * pulse).toFixed(3) + ')');
          lg.addColorStop(1, 'rgba(255,216,77,0)');
          g.fillStyle = lg; g.beginPath(); g.arc(lx, ly - 21, 40, 0, TAU); g.fill();
          g.globalCompositeOperation = 'source-over';
        }
      }
      g.restore();
    },

    /* --- ocean with sun glitter + wave bands --- */
    sea: function (g, view, camX, t) {
      var top = view.horizon, bot = view.seaBottom;
      g.fillStyle = seaGrad;
      g.fillRect(view.left, top, view.right - view.left, bot - top);

      // sun column reflection
      var sx = view.vw * 0.7;
      g.save();
      g.globalCompositeOperation = 'lighter';
      for (var i = 0; i < 26; i++) {
        var p = i / 26;
        var y = top + p * (bot - top);
        var wob = Math.sin(t * 1.6 + i * 0.7) * (6 + p * 26);
        var w = (18 + p * 130) * (0.55 + 0.45 * Math.abs(Math.sin(t * 2.1 + i)));
        g.fillStyle = 'rgba(255,' + (170 + Math.floor(p * 50)) + ',90,' + (0.3 * (1 - p * 0.7)).toFixed(3) + ')';
        g.fillRect(sx - w / 2 + wob, y, w, 1.8 + p * 2);
      }
      g.restore();

      // wave crests
      g.save();
      g.strokeStyle = 'rgba(255,243,226,.3)';
      for (var b = 0; b < 4; b++) {
        var yy = top + 12 + b * ((bot - top - 14) / 4);
        var amp = 1.6 + b * 1.3, sp = 0.7 + b * 0.35;
        var off = camX * (0.08 + b * 0.05);
        g.lineWidth = 1 + b * 0.4;
        g.globalAlpha = 0.16 + b * 0.1;
        g.beginPath();
        for (var x = view.left; x <= view.right; x += 16) {
          var y2 = yy + Math.sin((x + off) * 0.017 + t * sp) * amp + Math.sin((x + off) * 0.041 - t * sp * 1.4) * amp * 0.5;
          if (x === view.left) g.moveTo(x, y2); else g.lineTo(x, y2);
        }
        g.stroke();
      }
      g.restore();

      // shore foam
      g.save();
      g.fillStyle = 'rgba(255,243,226,.5)';
      g.beginPath();
      g.moveTo(view.left, bot + 4);
      for (var xf = view.left; xf <= view.right; xf += 14) {
        g.lineTo(xf, bot - 3 + Math.sin((xf + camX * 0.2) * 0.03 + t * 2.2) * 3.4);
      }
      g.lineTo(view.right, bot + 6); g.closePath(); g.fill();
      g.restore();
    },

    /* --- sand + dunes behind the deck --- */
    dunes: function (g, view, camX, t) {
      g.fillStyle = sandGrad;
      g.fillRect(view.left, view.seaBottom - 6, view.right - view.left, view.bottom - view.seaBottom + 6);

      var px = camX * 0.22, tw = 760;
      var y = view.gy - 62;
      var start = Math.floor((px + view.left) / tw) * tw;
      for (var x = start; x < px + view.right + tw; x += tw) {
        g.drawImage(duneTile, x - px, y);
      }
      // warm haze over the far sand
      var hz = g.createLinearGradient(0, view.seaBottom - 10, 0, view.gy);
      hz.addColorStop(0, 'rgba(255,150,90,.35)');
      hz.addColorStop(1, 'rgba(255,150,90,0)');
      g.fillStyle = hz;
      g.fillRect(view.left, view.seaBottom - 10, view.right - view.left, view.gy - view.seaBottom + 10);
    },

    /* --- beach props on the sand behind the railing --- */
    beach: function (g, view, camX, t) {
      var px = camX * 0.72, span = 2400, base = view.gy - 8;
      for (var i = 0; i < props.length; i++) {
        var o = props[i];
        var x = ((o.x - px) % span + span) % span - 200;
        if (x < view.left - 120 || x > view.right + 120) continue;
        g.save();
        g.translate(x, base);
        g.scale(o.s, o.s);
        g.fillStyle = 'rgba(80,36,58,.28)';
        g.beginPath(); g.ellipse(0, 2, 26, 5, 0, 0, TAU); g.fill();
        if (o.k === 'umbrella') {
          g.strokeStyle = '#5A2A46'; g.lineWidth = 3;
          g.beginPath(); g.moveTo(0, 0); g.lineTo(-2, -52); g.stroke();
          var c1 = o.hue > 0.5 ? C.magenta : C.teal, c2 = C.bone;
          for (var s = 0; s < 6; s++) {
            g.fillStyle = s % 2 ? c1 : c2;
            g.beginPath();
            g.moveTo(-2, -52);
            g.arc(-2, -52, 34, Math.PI + s * Math.PI / 6, Math.PI + (s + 1) * Math.PI / 6);
            g.closePath(); g.fill();
          }
          g.fillStyle = 'rgba(60,24,50,.25)';
          g.beginPath(); g.ellipse(-2, -52, 34, 5, 0, 0, Math.PI); g.fill();
        } else if (o.k === 'board') {
          g.save(); g.rotate(-0.22);
          var bgb = g.createLinearGradient(-8, 0, 8, 0);
          bgb.addColorStop(0, C.amber); bgb.addColorStop(0.5, C.gold); bgb.addColorStop(1, C.coral);
          g.fillStyle = bgb;
          g.beginPath(); g.ellipse(0, -32, 9, 34, 0, 0, TAU); g.fill();
          g.strokeStyle = 'rgba(90,40,30,.4)'; g.lineWidth = 1.4;
          g.beginPath(); g.moveTo(0, -64); g.lineTo(0, 0); g.stroke();
          g.restore();
        } else if (o.k === 'castle') {
          g.fillStyle = '#C98A5E';
          g.fillRect(-20, -22, 40, 22);
          g.fillRect(-26, -34, 12, 34); g.fillRect(14, -34, 12, 34);
          g.fillStyle = '#B0714A';
          for (var b = 0; b < 3; b++) { g.fillRect(-26 + b * 5, -38, 3, 5); g.fillRect(14 + b * 5, -38, 3, 5); }
          g.fillStyle = 'rgba(70,32,40,.5)';
          g.beginPath(); g.arc(0, -6, 6, Math.PI, 0); g.fill();
          g.strokeStyle = '#5A2A46'; g.lineWidth = 1.6;
          g.beginPath(); g.moveTo(0, -22); g.lineTo(0, -34); g.stroke();
          g.fillStyle = C.cyan;
          g.beginPath(); g.moveTo(0, -34); g.lineTo(11, -31); g.lineTo(0, -28); g.closePath(); g.fill();
        } else if (o.k === 'ball') {
          var bb = Math.abs(Math.sin(t * 1.4 + o.hue * 6)) * 5;
          g.translate(0, -12 - bb);
          g.fillStyle = C.bone; g.beginPath(); g.arc(0, 0, 12, 0, TAU); g.fill();
          g.fillStyle = C.magenta; g.beginPath(); g.arc(0, 0, 12, -0.5, 1.1); g.lineTo(0, 0); g.fill();
          g.fillStyle = C.cyan; g.beginPath(); g.arc(0, 0, 12, 2.1, 3.7); g.lineTo(0, 0); g.fill();
          g.fillStyle = 'rgba(255,255,255,.5)'; g.beginPath(); g.arc(-4, -4, 3.4, 0, TAU); g.fill();
        } else {
          g.fillStyle = o.hue > 0.5 ? C.teal : C.coral;
          g.save(); g.rotate(0.06);
          g.fillRect(-24, -5, 48, 7);
          g.fillStyle = 'rgba(255,243,226,.7)';
          for (var st = 0; st < 4; st++) g.fillRect(-22 + st * 12, -5, 4, 7);
          g.restore();
        }
        g.restore();
      }
    },

    /* --- palms + railing, mid parallax --- */
    mid: function (g, view, camX, t) {
      var px = camX * 0.55, span = 2580;
      for (var i = 0; i < palms.length; i++) {
        var o = palms[i];
        var x = ((o.x - px) % span + span) % span - 260;
        if (x < view.left - 160 || x > view.right + 160) continue;
        var base = view.gy - 6;
        var sway = Math.sin(t * 0.8 + o.seed) * 0.05;
        g.save();
        g.translate(x, base);
        g.rotate(o.lean + sway);
        g.fillStyle = '#4A2247';
        g.beginPath();
        g.moveTo(-5, 0); g.quadraticCurveTo(-2, -o.h * 0.6, -3.2, -o.h);
        g.lineTo(3.2, -o.h); g.quadraticCurveTo(4, -o.h * 0.6, 5, 0);
        g.closePath(); g.fill();
        g.translate(0, -o.h);
        for (var f = 0; f < 7; f++) {
          var a = -Math.PI * 0.92 + f * (Math.PI * 0.84 / 6) + Math.sin(t * 1.1 + f + o.seed) * 0.05;
          g.save(); g.rotate(a);
          g.fillStyle = f % 2 ? '#5E2A55' : '#41203F';
          g.beginPath();
          g.moveTo(0, 0);
          g.quadraticCurveTo(30, -12, 62, -4);
          g.quadraticCurveTo(32, 6, 0, 5);
          g.closePath(); g.fill();
          g.restore();
        }
        g.fillStyle = '#7A3A50';
        g.beginPath(); g.arc(3, 4, 4, 0, TAU); g.fill();
        g.restore();
      }

      // boardwalk railing behind the rider
      var rp = camX * 0.82, step = 108;
      var ry = view.gy - 46;
      var s0 = Math.floor((rp + view.left) / step) * step;
      g.save();
      g.strokeStyle = 'rgba(74,34,71,.85)'; g.lineWidth = 5; g.lineCap = 'round';
      g.beginPath(); g.moveTo(view.left, ry); g.lineTo(view.right, ry); g.stroke();
      g.lineWidth = 3;
      g.strokeStyle = 'rgba(74,34,71,.6)';
      g.beginPath(); g.moveTo(view.left, ry + 18); g.lineTo(view.right, ry + 18); g.stroke();
      g.fillStyle = 'rgba(58,26,58,.9)';
      for (var x2 = s0; x2 < rp + view.right + step; x2 += step) {
        g.fillRect(x2 - rp - 3, ry, 6, 48);
      }
      g.restore();
    },

    /* --- the deck the pelican rides on, with gap spans --- */
    deck: function (g, view, camX, gaps) {
      var gy = view.gy, thick = 22;
      var wl = camX + view.left - 60, wr = camX + view.right + 60;
      var spans = [], cur = wl;
      var sorted = gaps.slice().sort(function (a, b) { return a.x - b.x; });
      for (var i = 0; i < sorted.length; i++) {
        var gp = sorted[i];
        if (gp.x + gp.w < wl || gp.x > wr) continue;
        if (gp.x > cur) spans.push([cur, gp.x]);
        cur = Math.max(cur, gp.x + gp.w);
      }
      if (cur < wr) spans.push([cur, wr]);

      for (var s = 0; s < spans.length; s++) {
        var a = spans[s][0], b = spans[s][1];
        var sx = a - camX, sw = b - a;
        if (sw <= 0) continue;

        // pilings + underside shadow
        g.save();
        g.translate(-camX, 0);
        g.fillStyle = 'rgba(45,20,44,.55)';
        g.fillRect(a, gy + thick, sw, 12);
        var p0 = Math.ceil(a / 150) * 150;
        for (var px = p0; px < b; px += 150) {
          g.fillStyle = '#5A2E42';
          g.fillRect(px - 7, gy + thick, 14, Math.min(78, view.bottom - gy - thick));
          g.fillStyle = 'rgba(20,8,26,.35)';
          g.fillRect(px + 2, gy + thick, 5, Math.min(78, view.bottom - gy - thick));
        }
        // planks
        g.fillStyle = plankPat;
        g.fillRect(a, gy, sw, thick);
        // top edge glow from the sunset
        g.fillStyle = 'rgba(255,214,150,.55)';
        g.fillRect(a, gy - 1.5, sw, 2.5);
        g.restore();

        // broken edges at gaps
        g.save();
        g.fillStyle = '#7A4433';
        if (a > wl + 1) {
          g.beginPath();
          g.moveTo(sx, gy); g.lineTo(sx + 7, gy + 6); g.lineTo(sx + 2, gy + 12);
          g.lineTo(sx + 8, gy + thick); g.lineTo(sx, gy + thick); g.closePath(); g.fill();
        }
        if (b < wr - 1) {
          var ex = sx + sw;
          g.beginPath();
          g.moveTo(ex, gy); g.lineTo(ex - 7, gy + 7); g.lineTo(ex - 2, gy + 13);
          g.lineTo(ex - 8, gy + thick); g.lineTo(ex, gy + thick); g.closePath(); g.fill();
        }
        g.restore();
      }

      // sea/sand visible through the gaps
      for (var k = 0; k < sorted.length; k++) {
        var gq = sorted[k];
        if (gq.x + gq.w < wl || gq.x > wr) continue;
        var gx = gq.x - camX;
        var grd = g.createLinearGradient(0, gy, 0, gy + 70);
        grd.addColorStop(0, 'rgba(20,8,30,.75)');
        grd.addColorStop(1, 'rgba(20,8,30,0)');
        g.fillStyle = grd;
        g.fillRect(gx, gy, gq.w, 70);
      }
    },

    /* --- near foreground: ripples, shells, grass, depth scrim --- */
    fore: function (g, view, camX, t) {
      var gy = view.gy, span = 2340, px = camX * 1.28;
      var deep = view.bottom - gy;

      if (deep > 40) {
        g.save();
        g.strokeStyle = 'rgba(120,58,60,.22)'; g.lineWidth = 2;
        for (var r = 0; r < 7; r++) {
          var ry = gy + 46 + r * Math.max(18, deep / 8);
          if (ry > view.bottom) break;
          var off = camX * (1.05 + r * 0.06);
          g.beginPath();
          for (var x = view.left; x <= view.right; x += 22) {
            var yy = ry + Math.sin((x + off) * 0.012 + r) * 5;
            if (x === view.left) g.moveTo(x, yy); else g.lineTo(x, yy);
          }
          g.stroke();
        }
        g.restore();

        var sp = camX * 1.12, ss = 2340;
        for (var i = 0; i < shells.length; i++) {
          var o = shells[i];
          var sx = ((o.x - sp) % ss + ss) % ss - 100;
          if (sx < view.left - 40 || sx > view.right + 40) continue;
          var sy = gy + 60 + ((i * 137) % Math.max(40, deep - 70));
          g.save();
          g.translate(sx, sy); g.rotate(o.r); g.scale(o.s, o.s);
          if (o.k === 0) {
            g.fillStyle = 'rgba(255,226,196,.55)';
            g.beginPath(); g.arc(0, 0, 7, Math.PI, 0); g.closePath(); g.fill();
            g.strokeStyle = 'rgba(150,80,70,.35)'; g.lineWidth = 1;
            for (var k = -2; k <= 2; k++) { g.beginPath(); g.moveTo(0, 0); g.lineTo(k * 3, -6.4); g.stroke(); }
          } else if (o.k === 1) {
            g.fillStyle = 'rgba(255,138,110,.5)';
            g.beginPath();
            for (var a = 0; a < 5; a++) {
              var an = a * TAU / 5 - Math.PI / 2;
              g.lineTo(Math.cos(an) * 9, Math.sin(an) * 9);
              g.lineTo(Math.cos(an + TAU / 10) * 3.6, Math.sin(an + TAU / 10) * 3.6);
            }
            g.closePath(); g.fill();
          } else {
            g.fillStyle = 'rgba(90,40,52,.22)';
            g.beginPath(); g.ellipse(0, 0, 6, 3.4, 0, 0, TAU); g.fill();
            g.beginPath(); g.ellipse(11, 5, 6, 3.4, 0, 0, TAU); g.fill();
          }
          g.restore();
        }
      }

      var base = Math.max(view.bottom + 6, gy + 96);
      g.save();
      for (var j = 0; j < grass.length; j++) {
        var og = grass[j];
        var gx = ((og.x - px) % span + span) % span - 120;
        if (gx < view.left - 60 || gx > view.right + 60) continue;
        var sway = Math.sin(t * 1.6 + og.seed) * 5;
        g.strokeStyle = 'rgba(38,16,42,.85)';
        g.lineWidth = 2.6; g.lineCap = 'round';
        for (var b = -1; b <= 1; b++) {
          g.beginPath();
          g.moveTo(gx + b * 5, base);
          g.quadraticCurveTo(gx + b * 7 + sway * 0.4, base - og.h * 0.6, gx + b * 10 + sway, base - og.h);
          g.stroke();
        }
      }
      g.restore();

      if (deep > 120) {
        var sc = g.createLinearGradient(0, gy + 40, 0, view.bottom);
        sc.addColorStop(0, 'rgba(24,10,34,0)');
        sc.addColorStop(0.55, 'rgba(24,10,34,.34)');
        sc.addColorStop(1, 'rgba(18,7,28,.72)');
        g.fillStyle = sc;
        g.fillRect(view.left, gy + 40, view.right - view.left, deep - 40);
      }
    },

    grain: function (g, view, t) {
      if (!grainPat) return;
      g.save();
      g.globalAlpha = 0.5;
      g.translate(-((t * 61) % 128), -((t * 43) % 128));
      g.fillStyle = grainPat;
      g.fillRect(view.left, view.top, view.right - view.left + 128, view.bottom - view.top + 128);
      g.restore();
    },

    vignette: function (g, view) {
      g.save();
      g.fillStyle = vignette;
      g.fillRect(view.left, view.top, view.right - view.left, view.bottom - view.top);
      g.restore();
    }
  };

  global.PPScenery = Scenery;
})(window);