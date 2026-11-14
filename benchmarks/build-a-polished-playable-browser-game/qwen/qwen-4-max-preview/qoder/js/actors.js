/* PELICAN PEDAL — the rider and every world actor, drawn procedurally */
(function (global) {
  'use strict';
  var P = global.PP, C = P.C, TAU = P.TAU, lerp = P.lerp;

  function ellipse(g, x, y, rx, ry, rot) {
    g.beginPath(); g.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), rot || 0, 0, TAU);
  }

  /* ============================ THE RIDER ============================ */
  /* s: {duck, flap, lean, sx, sy, wheel, crank, speed, boost, pouch, blink, hurt, alive} */
  function rider(g, s) {
    var d = s.duck || 0, fl = s.flap || 0, boost = s.boost || 0;
    var R = 19, rearX = -27, frontX = 29, hubY = -19;

    g.save();
    g.scale(s.sx || 1, s.sy || 1);
    g.rotate(s.lean || 0);
    g.scale(0.86, 0.86);

    /* ---- wheels ---- */
    function wheel(cx, spin) {
      g.save(); g.translate(cx, hubY);
      g.strokeStyle = '#241A38'; g.lineWidth = 5.5;
      g.beginPath(); g.arc(0, 0, R, 0, TAU); g.stroke();
      g.strokeStyle = 'rgba(216,228,240,.85)'; g.lineWidth = 1.8;
      g.beginPath(); g.arc(0, 0, R - 3.5, 0, TAU); g.stroke();
      g.save(); g.rotate(spin);
      g.strokeStyle = 'rgba(216,228,240,' + (0.5 - Math.min(0.34, s.speed / 2600)) + ')';
      g.lineWidth = 1.1;
      g.beginPath();
      for (var i = 0; i < 6; i++) {
        var a = i * Math.PI / 6;
        g.moveTo(Math.cos(a) * (R - 4), Math.sin(a) * (R - 4));
        g.lineTo(-Math.cos(a) * (R - 4), -Math.sin(a) * (R - 4));
      }
      g.stroke();
      g.restore();
      g.fillStyle = C.amber;
      g.beginPath(); g.arc(0, 0, 3, 0, TAU); g.fill();
      // tyre tread highlight
      g.strokeStyle = 'rgba(255,214,150,.35)'; g.lineWidth = 1.4;
      g.beginPath(); g.arc(0, 0, R + 1.6, -2.5, -0.7); g.stroke();
      g.restore();
    }
    wheel(rearX, s.wheel);
    wheel(frontX, s.wheel);

    /* ---- chain + crank ---- */
    var bbX = 2, bbY = -22, crankR = 11;
    g.strokeStyle = 'rgba(40,28,56,.9)'; g.lineWidth = 2;
    g.beginPath();
    g.moveTo(rearX, hubY - 3.4); g.lineTo(bbX, bbY - 6.5);
    g.moveTo(rearX, hubY + 3.4); g.lineTo(bbX, bbY + 6.5);
    g.stroke();

    var pa = s.crank, pb = s.crank + Math.PI;
    var p1x = bbX + Math.cos(pa) * crankR, p1y = bbY + Math.sin(pa) * crankR;
    var p2x = bbX + Math.cos(pb) * crankR, p2y = bbY + Math.sin(pb) * crankR;

    // far leg (behind frame)
    drawLeg(g, -6, -50 + d * 6, p2x, p2y, '#D9793F', 0.75);

    /* ---- frame ---- */
    var seatX = -9, seatY = -53 + d * 3, headX = 24, headY = -57 + d * 2;
    g.lineCap = 'round'; g.lineJoin = 'round';
    g.strokeStyle = '#0E7F79'; g.lineWidth = 6.5;
    g.beginPath();
    g.moveTo(rearX, hubY); g.lineTo(bbX, bbY); g.lineTo(seatX, seatY); g.closePath();
    g.moveTo(seatX, seatY); g.lineTo(headX, headY);
    g.moveTo(bbX, bbY); g.lineTo(headX, headY);
    g.stroke();
    g.strokeStyle = C.teal; g.lineWidth = 4;
    g.beginPath();
    g.moveTo(rearX, hubY); g.lineTo(bbX, bbY); g.lineTo(seatX, seatY); g.closePath();
    g.moveTo(seatX, seatY); g.lineTo(headX, headY);
    g.moveTo(bbX, bbY); g.lineTo(headX, headY);
    g.stroke();
    g.strokeStyle = 'rgba(184,241,53,.5)'; g.lineWidth = 1.2;
    g.beginPath(); g.moveTo(seatX + 2, seatY + 1); g.lineTo(headX - 2, headY + 1); g.stroke();

    // fork + bars
    g.strokeStyle = C.chrome; g.lineWidth = 3.4;
    g.beginPath(); g.moveTo(headX, headY); g.lineTo(frontX, hubY); g.stroke();
    g.beginPath(); g.moveTo(headX, headY - 2); g.lineTo(headX + 3, headY - 9); g.stroke();
    g.strokeStyle = '#2A1B3E'; g.lineWidth = 4.2;
    g.beginPath(); g.moveTo(headX - 4, headY - 10); g.lineTo(headX + 12, headY - 12); g.stroke();
    g.strokeStyle = C.coral; g.lineWidth = 4.6;
    g.beginPath(); g.moveTo(headX + 8, headY - 11.6); g.lineTo(headX + 13, headY - 12.2); g.stroke();

    // saddle
    g.fillStyle = '#2A1B3E';
    g.beginPath();
    g.moveTo(seatX - 10, seatY - 2); g.quadraticCurveTo(seatX + 2, seatY - 7, seatX + 9, seatY - 2);
    g.quadraticCurveTo(seatX, seatY + 2, seatX - 10, seatY - 2); g.fill();

    // front basket with the day's catch
    g.save();
    g.translate(headX + 12, headY - 2);
    g.fillStyle = '#B8763F';
    g.beginPath(); g.moveTo(-8, -8); g.lineTo(9, -8); g.lineTo(7, 5); g.lineTo(-6, 5); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(70,36,18,.5)'; g.lineWidth = 1;
    for (var bi = 0; bi < 3; bi++) { g.beginPath(); g.moveTo(-8 + bi * 0.6, -5 + bi * 4); g.lineTo(9 - bi * 0.6, -5 + bi * 4); g.stroke(); }
    var pf = Math.min(1, s.pouch || 0);
    if (pf > 0.05) {
      g.fillStyle = C.cyan;
      g.save(); g.translate(1, -9 - pf * 2); g.rotate(-0.5);
      g.beginPath(); g.moveTo(0, 0); g.lineTo(-7, -5); g.lineTo(-6, 3); g.closePath(); g.fill();
      g.restore();
    }
    g.restore();

    /* ---- pelican body ---- */
    var bodyX = -4, bodyY = -66 + d * 12, bodyRX = 27, bodyRY = 20 - d * 5;
    var tilt = -0.12 - boost * 0.1 + d * 0.22;

    // tail
    g.save(); g.translate(bodyX - 22, bodyY - 2); g.rotate(0.3 + fl * 0.3);
    g.fillStyle = C.slateDark;
    for (var t = -1; t <= 1; t++) {
      g.save(); g.rotate(t * 0.26);
      g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(-14, -3, -24, 2); g.quadraticCurveTo(-13, 5, 0, 5); g.closePath(); g.fill();
      g.restore();
    }
    g.restore();

    var bg = g.createLinearGradient(bodyX, bodyY - bodyRY, bodyX, bodyY + bodyRY);
    bg.addColorStop(0, '#FFFDF6'); bg.addColorStop(0.55, C.bone); bg.addColorStop(1, '#E7C6A8');
    g.fillStyle = bg;
    ellipse(g, bodyX, bodyY, bodyRX, bodyRY, tilt); g.fill();
    g.strokeStyle = 'rgba(120,70,60,.22)'; g.lineWidth = 1.4; g.stroke();

    // belly highlight
    g.fillStyle = 'rgba(255,255,255,.5)';
    ellipse(g, bodyX + 4, bodyY + 5, bodyRX * 0.6, bodyRY * 0.45, tilt); g.fill();

    /* ---- neck + head ---- */
    var hx = lerp(17, 30, d) + boost * 3, hy = lerp(-106, -76, d);
    var nx = bodyX + 12, ny = bodyY - 10;
    g.strokeStyle = C.bone; g.lineWidth = 15 - d * 2; g.lineCap = 'round';
    g.beginPath();
    g.moveTo(nx, ny);
    g.quadraticCurveTo(nx + 8 + d * 8, ny - 20 + d * 16, hx - 2, hy + 7);
    g.stroke();
    g.strokeStyle = 'rgba(231,198,168,.55)'; g.lineWidth = 4;
    g.beginPath();
    g.moveTo(nx + 3, ny + 2);
    g.quadraticCurveTo(nx + 10 + d * 8, ny - 16 + d * 16, hx, hy + 8);
    g.stroke();

    /* ---- scarf ---- */
    var sl = 30 + Math.min(48, s.speed * 0.062) + boost * 24;
    var sx0 = hx - 8, sy0 = hy + 13;
    var w1 = Math.sin(s.wheel * 1.6) * 7, w2 = Math.cos(s.wheel * 1.3 + 1) * 9;
    g.save();
    g.fillStyle = C.magenta;
    g.beginPath();
    g.moveTo(sx0 + 2, sy0 - 5);
    g.bezierCurveTo(sx0 - sl * 0.35, sy0 - 6 + w1, sx0 - sl * 0.68, sy0 - 12 + w2, sx0 - sl, sy0 - 4 + w1 * 0.7);
    g.lineTo(sx0 - sl + 3, sy0 + 3 + w1 * 0.7);
    g.bezierCurveTo(sx0 - sl * 0.66, sy0 + 2 + w2, sx0 - sl * 0.34, sy0 + 5 + w1, sx0 + 2, sy0 + 5);
    g.closePath(); g.fill();
    g.fillStyle = 'rgba(255,150,190,.75)';
    g.beginPath();
    g.moveTo(sx0 - sl * 0.3, sy0 - 3 + w1 * 0.6);
    g.bezierCurveTo(sx0 - sl * 0.55, sy0 - 6 + w2 * 0.7, sx0 - sl * 0.8, sy0 - 8 + w2 * 0.8, sx0 - sl + 4, sy0 - 2 + w1 * 0.7);
    g.lineTo(sx0 - sl + 5, sy0 + 1 + w1 * 0.7);
    g.bezierCurveTo(sx0 - sl * 0.78, sy0 - 4 + w2 * 0.8, sx0 - sl * 0.54, sy0 - 2 + w2 * 0.7, sx0 - sl * 0.3, sy0 + 1 + w1 * 0.6);
    g.closePath(); g.fill();
    g.fillStyle = '#D62A6E';
    ellipse(g, sx0 + 1, sy0, 5.5, 6.5, 0.2); g.fill();
    g.restore();

    /* ---- head ---- */
    g.save();
    g.translate(hx, hy);
    g.rotate(d * 0.18 - boost * 0.08);
    var hg = g.createLinearGradient(0, -12, 0, 12);
    hg.addColorStop(0, '#FFFDF6'); hg.addColorStop(1, '#EFD5B8');
    g.fillStyle = hg;
    ellipse(g, 0, 0, 13, 12.5, 0); g.fill();

    // crest
    g.strokeStyle = C.sand; g.lineWidth = 2.2;
    for (var ci = 0; ci < 3; ci++) {
      g.beginPath(); g.moveTo(-3 - ci * 2, -9);
      g.quadraticCurveTo(-8 - ci * 3, -16 - ci * 2, -12 - ci * 4 - fl * 4, -14 - ci * 3);
      g.stroke();
    }
    // goggles pushed up
    g.strokeStyle = '#2A1B3E'; g.lineWidth = 2.6;
    g.beginPath(); g.arc(0, -1, 11.5, -2.85, -0.5); g.stroke();
    g.fillStyle = 'rgba(55,225,255,.75)';
    ellipse(g, -1, -11, 5.2, 4, -0.2); g.fill();
    g.strokeStyle = '#2A1B3E'; g.lineWidth = 1.6; g.stroke();

    /* bill + pouch */
    var wob = Math.sin(s.wheel * 2.2) * (1.4 + Math.min(3.4, Math.abs(s.vy || 0) * 0.005));
    var bulge = 20 + pf * 14 + wob;
    var billLen = 48 - d * 4;
    var pg = g.createLinearGradient(6, -2, 14, bulge + 4);
    pg.addColorStop(0, '#FFC189'); pg.addColorStop(0.45, C.pouch); pg.addColorStop(1, '#E85C46');
    g.fillStyle = pg;
    g.beginPath();
    g.moveTo(6, -3);
    g.bezierCurveTo(3, bulge * 0.86, billLen * 0.62, bulge * 1.06, billLen - 2, 1.5);
    g.quadraticCurveTo(billLen * 0.5, 0.5, 6, -3);
    g.closePath(); g.fill();
    g.strokeStyle = 'rgba(170,60,45,.45)'; g.lineWidth = 1.1; g.stroke();
    g.strokeStyle = 'rgba(255,236,210,.5)'; g.lineWidth = 1.6;
    g.beginPath();
    g.moveTo(9, 1); g.quadraticCurveTo(13, bulge * 0.62, billLen * 0.5, bulge * 0.72);
    g.stroke();
    g.strokeStyle = 'rgba(180,70,50,.22)'; g.lineWidth = 0.9;
    for (var pl = 1; pl <= 2; pl++) {
      g.beginPath();
      g.moveTo(8 + pl * 9, 0);
      g.quadraticCurveTo(9 + pl * 9, bulge * 0.5, 12 + pl * 8, bulge * 0.78);
      g.stroke();
    }
    if (pf > 0.2) {
      g.save();
      g.globalAlpha = Math.min(0.75, pf);
      g.fillStyle = '#2FA8C8';
      g.translate(billLen * 0.42, bulge * 0.52);
      g.rotate(0.25);
      ellipse(g, 0, 0, 7.5 * pf, 4.2 * pf, 0); g.fill();
      g.beginPath(); g.moveTo(-6 * pf, 0); g.lineTo(-11 * pf, -3.4 * pf); g.lineTo(-11 * pf, 3.4 * pf); g.closePath(); g.fill();
      g.restore();
    }
    // upper mandible
    g.fillStyle = C.amber;
    g.beginPath();
    g.moveTo(5, -6); g.lineTo(billLen + 4, -2.4);
    g.quadraticCurveTo(billLen + 6, -0.6, billLen + 2, 0.6);
    g.quadraticCurveTo(22, -1.8, 5, -0.8); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(190,110,20,.55)'; g.lineWidth = 0.9; g.stroke();
    g.strokeStyle = 'rgba(255,240,190,.7)'; g.lineWidth = 1;
    g.beginPath(); g.moveTo(8, -4.6); g.lineTo(billLen + 1, -1.9); g.stroke();
    g.fillStyle = '#C9761A';
    g.beginPath(); g.arc(billLen + 3, -1, 1.6, 0, TAU); g.fill();

    /* eye */
    var blink = s.blink || 0;
    g.fillStyle = '#FFFDF6';
    ellipse(g, 3.5, -4.5, 4.6, 4.6 * (1 - blink * 0.92), 0); g.fill();
    if (blink < 0.6) {
      g.fillStyle = '#20142E';
      var look = boost > 0.2 ? 1.4 : 0.8;
      ellipse(g, 3.5 + look, -4.5 + (s.hurt ? 1 : 0), 2.5, 2.6 * (1 - blink), 0); g.fill();
      g.fillStyle = 'rgba(255,255,255,.9)';
      g.beginPath(); g.arc(2.6 + look, -5.6, 0.9, 0, TAU); g.fill();
    }
    if (s.hurt) {
      g.strokeStyle = '#20142E'; g.lineWidth = 1.8;
      g.beginPath(); g.moveTo(0.5, -8.5); g.lineTo(7, -6.2); g.stroke();
    }
    g.restore();

    /* ---- wing (flaps) ---- */
    var wa = -0.35 - fl * 1.55 + Math.sin(s.wheel * 0.8) * 0.05;
    g.save();
    g.translate(bodyX + 2, bodyY - 6);
    g.rotate(wa);
    var wg = g.createLinearGradient(0, -6, -34, 14);
    wg.addColorStop(0, '#EAD8C0'); wg.addColorStop(0.45, '#9C8CB4'); wg.addColorStop(1, '#3E4C74');
    g.fillStyle = wg;
    g.beginPath();
    g.moveTo(4, -4);
    g.quadraticCurveTo(-14, -12 - fl * 6, -36 - fl * 8, -2 + fl * 4);
    g.quadraticCurveTo(-18, 12 + fl * 4, 2, 8);
    g.closePath(); g.fill();
    g.strokeStyle = 'rgba(38,30,66,.5)'; g.lineWidth = 1.4; g.stroke();
    g.strokeStyle = 'rgba(255,243,226,.35)'; g.lineWidth = 1.1;
    for (var fi = 0; fi < 4; fi++) {
      g.beginPath();
      g.moveTo(-6 - fi * 7, 2 + fi * 1.2);
      g.quadraticCurveTo(-14 - fi * 7, 6 + fi, -22 - fi * 6, 3 + fi * 1.6 + fl * 3);
      g.stroke();
    }
    g.restore();

    /* ---- near leg on the pedal ---- */
    drawLeg(g, 0, -50 + d * 6, p1x, p1y, C.pouch, 1);

    // crank arms on top
    g.strokeStyle = C.chrome; g.lineWidth = 3;
    g.beginPath(); g.moveTo(bbX, bbY); g.lineTo(p1x, p1y); g.stroke();
    g.fillStyle = '#2A1B3E';
    g.save(); g.translate(p1x, p1y); g.rotate(pa * 0.2);
    g.fillRect(-5, -1.6, 10, 3.2); g.restore();
    g.fillStyle = '#3A2A4E';
    g.save(); g.translate(p2x, p2y); g.fillRect(-5, -1.6, 10, 3.2); g.restore();
    g.fillStyle = C.amber;
    g.beginPath(); g.arc(bbX, bbY, 3.4, 0, TAU); g.fill();

    if (boost > 0.02) {
      g.globalCompositeOperation = 'lighter';
      g.globalAlpha = boost * 0.5;
      g.strokeStyle = C.cyan; g.lineWidth = 3;
      ellipse(g, bodyX, bodyY, bodyRX + 6, bodyRY + 6, tilt); g.stroke();
      g.globalAlpha = 1;
      g.globalCompositeOperation = 'source-over';
    }
    g.restore();
  }

  function drawLeg(g, hipX, hipY, footX, footY, col, alpha) {
    g.save();
    g.globalAlpha = alpha;
    g.strokeStyle = col; g.lineWidth = 4.4; g.lineCap = 'round';
    var kneeX = (hipX + footX) * 0.5 + 7, kneeY = (hipY + footY) * 0.5 - 4;
    g.beginPath(); g.moveTo(hipX, hipY); g.quadraticCurveTo(kneeX, kneeY, footX, footY); g.stroke();
    g.fillStyle = col;
    g.beginPath();
    g.moveTo(footX - 5, footY - 1); g.lineTo(footX + 7, footY - 3);
    g.lineTo(footX + 6, footY + 3); g.lineTo(footX - 5, footY + 3);
    g.closePath(); g.fill();
    g.restore();
  }

  /* ============================== ACTORS ============================== */
  function shadow(g, x, y, w, a) {
    g.save(); g.globalAlpha = a;
    g.fillStyle = 'rgba(40,14,40,.75)';
    ellipse(g, x, y, w, w * 0.26, 0); g.fill();
    g.restore();
  }

  function fish(g, x, y, t, gold, sc) {
    var s = sc || 1;
    g.save();
    g.translate(x, y);
    g.rotate(Math.sin(t * 3 + x * 0.02) * 0.16);
    g.scale(s, s);
    if (gold) {
      g.globalCompositeOperation = 'lighter';
      var gl = g.createRadialGradient(0, 0, 2, 0, 0, 30);
      gl.addColorStop(0, 'rgba(255,216,77,.55)'); gl.addColorStop(1, 'rgba(255,216,77,0)');
      g.fillStyle = gl; g.beginPath(); g.arc(0, 0, 30, 0, TAU); g.fill();
      g.globalCompositeOperation = 'source-over';
    }
    var body = gold ? C.gold : C.cyan, fin = gold ? C.amber : C.teal;
    var wag = Math.sin(t * 9 + x * 0.05) * 3;
    g.fillStyle = fin;
    g.beginPath();
    g.moveTo(-9, 0); g.lineTo(-19, -7 + wag); g.lineTo(-16, 0); g.lineTo(-19, 7 + wag);
    g.closePath(); g.fill();
    g.beginPath(); g.moveTo(0, -6); g.lineTo(-4, -13); g.lineTo(5, -7); g.closePath(); g.fill();
    var bg2 = g.createLinearGradient(0, -8, 0, 8);
    bg2.addColorStop(0, '#FFFFFF'); bg2.addColorStop(0.35, body); bg2.addColorStop(1, fin);
    g.fillStyle = bg2;
    ellipse(g, 0, 0, 13, 8, 0); g.fill();
    g.strokeStyle = gold ? 'rgba(190,120,10,.5)' : 'rgba(10,90,120,.45)';
    g.lineWidth = 1.1; g.stroke();
    g.fillStyle = 'rgba(255,255,255,.55)';
    ellipse(g, 1, 3, 7, 3, 0); g.fill();
    g.fillStyle = '#1A1030';
    g.beginPath(); g.arc(7, -1.6, 1.9, 0, TAU); g.fill();
    g.fillStyle = '#fff';
    g.beginPath(); g.arc(7.7, -2.3, 0.7, 0, TAU); g.fill();
    if (gold) {
      g.globalCompositeOperation = 'lighter';
      for (var i = 0; i < 3; i++) {
        var a = t * 2.4 + i * TAU / 3, rr = 19 + Math.sin(t * 4 + i) * 3;
        g.fillStyle = 'rgba(255,243,226,.85)';
        var px = Math.cos(a) * rr, py = Math.sin(a) * rr * 0.7;
        g.beginPath();
        g.moveTo(px, py - 3); g.lineTo(px + 1.2, py); g.lineTo(px, py + 3); g.lineTo(px - 1.2, py);
        g.closePath(); g.fill();
      }
      g.globalCompositeOperation = 'source-over';
    }
    g.restore();
  }

  function crab(g, x, y, t, sc) {
    g.save(); g.translate(x, y); g.scale(sc || 1, sc || 1);
    var bob = Math.sin(t * 8) * 1.6;
    g.translate(0, bob);
    g.strokeStyle = '#C2452F'; g.lineWidth = 3; g.lineCap = 'round';
    for (var i = -1; i <= 1; i += 2) {
      for (var l = 0; l < 3; l++) {
        var ph = Math.sin(t * 11 + l * 1.4 + (i > 0 ? 1.6 : 0)) * 3;
        g.beginPath();
        g.moveTo(i * 10, 2);
        g.lineTo(i * (17 + l * 4), 6 + l * 2);
        g.lineTo(i * (19 + l * 5), 13 + ph);
        g.stroke();
      }
    }
    var snap = Math.abs(Math.sin(t * 4)) * 0.5;
    for (var c = -1; c <= 1; c += 2) {
      g.save(); g.translate(c * 17, -4); g.rotate(c * (0.3 + snap));
      g.strokeStyle = '#C2452F'; g.lineWidth = 3.4;
      g.beginPath(); g.moveTo(0, 4); g.lineTo(c * 5, -2); g.stroke();
      g.fillStyle = C.coral;
      g.beginPath();
      g.moveTo(c * 4, -3); g.lineTo(c * 14, -9 - snap * 4); g.lineTo(c * 12, -2); g.closePath(); g.fill();
      g.beginPath();
      g.moveTo(c * 4, -1); g.lineTo(c * 14, 3 + snap * 3); g.lineTo(c * 12, -1); g.closePath(); g.fill();
      g.restore();
    }
    var bg3 = g.createLinearGradient(0, -12, 0, 10);
    bg3.addColorStop(0, '#FF8A5C'); bg3.addColorStop(0.6, C.coral); bg3.addColorStop(1, '#C2452F');
    g.fillStyle = bg3;
    ellipse(g, 0, 0, 18, 12, 0); g.fill();
    g.strokeStyle = 'rgba(120,40,25,.45)'; g.lineWidth = 1.2; g.stroke();
    g.fillStyle = 'rgba(255,220,190,.4)';
    ellipse(g, -4, -5, 8, 3.4, -0.2); g.fill();
    g.strokeStyle = '#C2452F'; g.lineWidth = 2;
    for (var e = -1; e <= 1; e += 2) {
      g.beginPath(); g.moveTo(e * 5, -8); g.lineTo(e * 6, -15); g.stroke();
      g.fillStyle = '#FFF3E2';
      g.beginPath(); g.arc(e * 6, -16.5, 3.1, 0, TAU); g.fill();
      g.fillStyle = '#20142E';
      g.beginPath(); g.arc(e * 6 + 0.6, -16.5, 1.5, 0, TAU); g.fill();
    }
    g.strokeStyle = '#8E2E1E'; g.lineWidth = 1.6;
    g.beginPath(); g.arc(0, 5, 4.5, 0.25, Math.PI - 0.25); g.stroke();
    g.restore();
  }

  function gull(g, x, y, t, dir) {
    g.save(); g.translate(x, y);
    var f = Math.sin(t * 11);
    g.fillStyle = '#EFE6F2';
    ellipse(g, 0, 0, 18, 9, 0.06); g.fill();
    g.fillStyle = '#D6C9DE';
    g.beginPath(); g.moveTo(-14, -2); g.lineTo(-26, -6); g.lineTo(-24, 2); g.closePath(); g.fill();
    for (var s = -1; s <= 1; s += 2) {
      g.save();
      g.rotate(s * 0.1);
      g.fillStyle = s < 0 ? '#B9AACB' : '#F7F1FA';
      g.beginPath();
      g.moveTo(-2, -2);
      g.quadraticCurveTo(4, -16 - f * 14 * s, 20, -10 - f * 20 * s);
      g.quadraticCurveTo(8, -2, -2, 3);
      g.closePath(); g.fill();
      g.fillStyle = C.slateDark;
      g.beginPath();
      g.moveTo(16, -9 - f * 18 * s); g.lineTo(22, -10 - f * 20 * s); g.lineTo(17, -5 - f * 14 * s);
      g.closePath(); g.fill();
      g.restore();
    }
    g.fillStyle = '#FFFDF6';
    g.beginPath(); g.arc(13, -4, 7, 0, TAU); g.fill();
    g.fillStyle = C.amber;
    g.beginPath(); g.moveTo(18, -5); g.lineTo(29, -2.5); g.lineTo(18, 0); g.closePath(); g.fill();
    g.fillStyle = '#20142E';
    g.beginPath(); g.arc(15, -6, 1.7, 0, TAU); g.fill();
    g.strokeStyle = '#20142E'; g.lineWidth = 1.4;
    g.beginPath(); g.moveTo(12, -9.5); g.lineTo(17.5, -8); g.stroke();
    g.restore();
  }

  function buoy(g, x, y, t) {
    g.save(); g.translate(x, y);
    g.rotate(Math.sin(t * 2.4 + x * 0.01) * 0.05);
    g.fillStyle = '#2A1B3E';
    ellipse(g, 0, 0, 17, 5, 0); g.fill();
    var h = 50;
    g.beginPath();
    g.moveTo(-15, 0); g.quadraticCurveTo(-11, -h * 0.7, -6, -h);
    g.lineTo(6, -h); g.quadraticCurveTo(11, -h * 0.7, 15, 0);
    g.closePath();
    var bg4 = g.createLinearGradient(-15, 0, 15, 0);
    bg4.addColorStop(0, '#C2452F'); bg4.addColorStop(0.4, C.coral); bg4.addColorStop(1, '#8E2E1E');
    g.fillStyle = bg4; g.fill();
    g.save(); g.clip();
    g.fillStyle = C.bone;
    g.fillRect(-16, -h * 0.62, 32, 9);
    g.fillRect(-16, -h * 0.26, 32, 8);
    g.fillStyle = 'rgba(55,225,255,.35)';
    g.fillRect(-16, -h * 0.62, 32, 3);
    g.restore();
    g.fillStyle = C.amber;
    g.beginPath(); g.arc(0, -h - 3, 4.5, 0, TAU); g.fill();
    g.globalCompositeOperation = 'lighter';
    var gl2 = g.createRadialGradient(0, -h - 3, 1, 0, -h - 3, 16);
    gl2.addColorStop(0, 'rgba(255,176,32,' + (0.4 + 0.3 * Math.abs(Math.sin(t * 3))).toFixed(2) + ')');
    gl2.addColorStop(1, 'rgba(255,176,32,0)');
    g.fillStyle = gl2; g.beginPath(); g.arc(0, -h - 3, 16, 0, TAU); g.fill();
    g.restore();
  }

  function ramp(g, x, y, w, h) {
    g.save(); g.translate(x, y);
    g.beginPath();
    g.moveTo(0, 0); g.lineTo(w, -h); g.lineTo(w, 0); g.closePath();
    var rg = g.createLinearGradient(0, -h, w, 0);
    rg.addColorStop(0, '#FFD84D'); rg.addColorStop(0.5, C.amber); rg.addColorStop(1, '#C9761A');
    g.fillStyle = rg; g.fill();
    g.save(); g.clip();
    g.strokeStyle = 'rgba(60,26,50,.35)'; g.lineWidth = 6;
    for (var i = -2; i < 8; i++) {
      g.beginPath(); g.moveTo(i * 16, 4); g.lineTo(i * 16 + 22, -h - 4); g.stroke();
    }
    g.restore();
    g.strokeStyle = '#FFF3E2'; g.lineWidth = 3; g.lineCap = 'round';
    g.beginPath(); g.moveTo(1, -1); g.lineTo(w, -h - 1); g.stroke();
    g.globalCompositeOperation = 'lighter';
    g.strokeStyle = 'rgba(255,216,77,.55)'; g.lineWidth = 6;
    g.beginPath(); g.moveTo(1, -1); g.lineTo(w, -h - 1); g.stroke();
    g.globalCompositeOperation = 'source-over';
    g.fillStyle = 'rgba(45,20,44,.55)';
    g.fillRect(w - 5, -h, 5, h);
    g.restore();
  }

  function banner(g, x, bottomY, w, h, t, topY) {
    g.save(); g.translate(x, bottomY);
    g.strokeStyle = '#3A2050'; g.lineWidth = 3;
    g.beginPath();
    g.moveTo(6, topY - bottomY); g.lineTo(6, -h + 6);
    g.moveTo(w - 6, topY - bottomY); g.lineTo(w - 6, -h + 6);
    g.stroke();
    var bg5 = g.createLinearGradient(0, -h, 0, 0);
    bg5.addColorStop(0, '#B3255F'); bg5.addColorStop(0.45, C.magenta); bg5.addColorStop(1, '#FF6FA5');
    g.fillStyle = bg5;
    g.beginPath();
    g.moveTo(0, -h); g.lineTo(w, -h); g.lineTo(w, -12);
    var n = 5, sw = w / n;
    for (var i = n - 1; i >= 0; i--) {
      var sag = Math.sin(t * 2 + i) * 2;
      g.quadraticCurveTo(i * sw + sw * 0.5, 4 + sag, i * sw, -12);
    }
    g.closePath(); g.fill();
    g.save(); g.clip();
    g.fillStyle = 'rgba(255,243,226,.88)';
    for (var s = 0; s < n; s += 2) g.fillRect(s * sw + 4, -h + 8, sw - 8, h - 26);
    g.restore();
    g.fillStyle = 'rgba(13,6,32,.35)';
    g.fillRect(0, -h, w, 5);
    g.fillStyle = C.gold;
    g.font = '800 15px ui-monospace, Consolas, monospace';
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.lineWidth = 3; g.strokeStyle = 'rgba(13,6,32,.55)';
    g.strokeText('DUCK', w / 2, -h * 0.52);
    g.fillText('DUCK', w / 2, -h * 0.52);
    g.globalCompositeOperation = 'lighter';
    g.fillStyle = 'rgba(255,61,139,.18)';
    g.fillRect(-6, -h - 6, w + 12, h + 12);
    g.restore();
  }

  function feather(g, x, y, t) {
    g.save(); g.translate(x, y);
    g.rotate(Math.sin(t * 2) * 0.25 - 0.3);
    g.globalCompositeOperation = 'lighter';
    var gl3 = g.createRadialGradient(0, 0, 2, 0, 0, 28);
    gl3.addColorStop(0, 'rgba(255,243,226,.5)'); gl3.addColorStop(1, 'rgba(184,241,53,0)');
    g.fillStyle = gl3; g.beginPath(); g.arc(0, 0, 28, 0, TAU); g.fill();
    g.globalCompositeOperation = 'source-over';
    var fg = g.createLinearGradient(0, -16, 0, 16);
    fg.addColorStop(0, '#FFFDF6'); fg.addColorStop(1, C.lime);
    g.fillStyle = fg;
    g.beginPath();
    g.moveTo(0, -17); g.quadraticCurveTo(11, -2, 0, 17); g.quadraticCurveTo(-11, -2, 0, -17);
    g.fill();
    g.strokeStyle = 'rgba(120,160,40,.6)'; g.lineWidth = 1.2;
    g.beginPath(); g.moveTo(0, -15); g.lineTo(0, 15); g.stroke();
    g.restore();
  }

  global.PPActors = {
    rider: rider, shadow: shadow, fish: fish, crab: crab, gull: gull,
    buoy: buoy, ramp: ramp, banner: banner, feather: feather, ellipse: ellipse
  };
})(window);