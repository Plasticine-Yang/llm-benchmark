(function () {
  "use strict";

  if (typeof CanvasRenderingContext2D !== "undefined" && !CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
      const radius = Math.min(typeof r === "number" ? r : 0, Math.abs(w) * 0.5, Math.abs(h) * 0.5);
      this.moveTo(x + radius, y);
      this.arcTo(x + w, y, x + w, y + h, radius);
      this.arcTo(x + w, y + h, x, y + h, radius);
      this.arcTo(x, y + h, x, y, radius);
      this.arcTo(x, y, x + w, y, radius);
      this.closePath();
      return this;
    };
  }

  const BIKE_THEMES = [
    {
      name: "Coral Sailor",
      frame: "#ff5e4d",
      frameDark: "#c83728",
      fender: "#fff6e5",
      hatStyle: "sailor",
      hatMain: "#ffffff",
      hatBand: "#1d3557",
      streamers: ["#ff5e4d", "#ffb800", "#38bdf8"]
    },
    {
      name: "Seafoam Captain",
      frame: "#0ea5a4",
      frameDark: "#0b6e6d",
      fender: "#e6fffb",
      hatStyle: "captain",
      hatMain: "#16263b",
      hatBand: "#ffb800",
      streamers: ["#0ea5a4", "#fde047", "#ffffff"]
    },
    {
      name: "Sunburst Aviator",
      frame: "#ffb800",
      frameDark: "#cc8400",
      fender: "#fffbeb",
      hatStyle: "aviator",
      hatMain: "#7c4a21",
      hatBand: "#38bdf8",
      streamers: ["#ffb800", "#ff5e4d", "#fffbeb"]
    },
    {
      name: "Twilight Flyer",
      frame: "#7c3aed",
      frameDark: "#5b21b6",
      fender: "#f5f3ff",
      hatStyle: "beret",
      hatMain: "#ec4899",
      hatBand: "#fde047",
      streamers: ["#ec4899", "#38bdf8", "#fde047"]
    }
  ];

  // Time-of-day coastal palettes (RGB arrays for smooth interpolation)
  const SKY_STAGES = [
    {
      // Sunny Morning
      skyTop: [28, 146, 232],
      skyMid: [103, 203, 248],
      skyHorizon: [254, 243, 199],
      sunColor: [255, 245, 180],
      sunYFrac: 0.22,
      island: [56, 118, 148],
      pierFar: [45, 92, 122],
      seaTop: [2, 132, 199],
      seaBottom: [12, 74, 110],
      foam: [224, 247, 255],
      deckTop: [225, 181, 126],
      deckSide: [168, 116, 68],
      nightAlpha: 0.0
    },
    {
      // Golden Sunset Pier
      skyTop: [67, 56, 145],
      skyMid: [244, 114, 92],
      skyHorizon: [253, 224, 110],
      sunColor: [255, 196, 82],
      sunYFrac: 0.42,
      island: [76, 53, 98],
      pierFar: [64, 42, 82],
      seaTop: [185, 78, 108],
      seaBottom: [49, 46, 105],
      foam: [255, 226, 180],
      deckTop: [216, 158, 106],
      deckSide: [148, 92, 58],
      nightAlpha: 0.45
    },
    {
      // Starlight Carnival Night
      skyTop: [15, 23, 58],
      skyMid: [38, 52, 112],
      skyHorizon: [88, 92, 162],
      sunColor: [244, 248, 255],
      sunYFrac: 0.19,
      island: [24, 34, 68],
      pierFar: [19, 28, 58],
      seaTop: [17, 72, 116],
      seaBottom: [10, 34, 66],
      foam: [145, 242, 255],
      deckTop: [176, 138, 102],
      deckSide: [112, 78, 52],
      nightAlpha: 1.0
    }
  ];

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function lerpRgb(c1, c2, t) {
    const r = Math.round(lerp(c1[0], c2[0], t));
    const g = Math.round(lerp(c1[1], c2[1], t));
    const b = Math.round(lerp(c1[2], c2[2], t));
    return `rgb(${r},${g},${b})`;
  }

  function clamp(v, min, max) {
    return v < min ? min : v > max ? max : v;
  }

  function solveTwoBoneIK(hx, hy, tx, ty, l1, l2) {
    const dx = tx - hx;
    const dy = ty - hy;
    const rawDist = Math.hypot(dx, dy) || 0.001;
    const minD = Math.abs(l1 - l2) + 0.5;
    const maxD = l1 + l2 - 0.5;
    const d = clamp(rawDist, minD, maxD);
    const base = Math.atan2(dy, dx);
    const cosAngle = clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1);
    const angle = Math.acos(cosAngle);
    // Knee bends forward (+x direction when riding right)
    const kneeAngle = base - angle;
    return {
      kx: hx + Math.cos(kneeAngle) * l1,
      ky: hy + Math.sin(kneeAngle) * l1
    };
  }

  class PelicanRenderer {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext("2d", { alpha: false });
      this.dpr = 1;
      this.viewW = 960;
      this.viewH = 540;
      this.groundY = 415;

      // Decorative background clouds & stars (seeded once, zero allocation)
      this.clouds = [];
      for (let i = 0; i < 7; i++) {
        this.clouds.push({
          x: i * 210 + (i % 3) * 45,
          yFrac: 0.08 + (i % 4) * 0.065,
          scale: 0.7 + (i % 3) * 0.28,
          speed: 12 + (i % 4) * 6
        });
      }

      this.stars = [];
      for (let i = 0; i < 38; i++) {
        this.stars.push({
          xFrac: ((i * 73) % 100) / 100,
          yFrac: ((i * 41) % 48) / 100 + 0.03,
          r: 1 + (i % 3) * 0.65,
          phase: i * 0.9
        });
      }

      this.sailboats = [
        { x: 240, scale: 0.85, speed: 9 },
        { x: 760, scale: 0.62, speed: 6 },
        { x: 1180, scale: 0.95, speed: 12 }
      ];
    }

    getThemes() {
      return BIKE_THEMES;
    }

    resize() {
      const rect = this.canvas.getBoundingClientRect();
      const cssW = Math.max(320, rect.width || window.innerWidth);
      const cssH = Math.max(320, rect.height || window.innerHeight);
      this.dpr = Math.min(window.devicePixelRatio || 1, 2);

      this.canvas.width = Math.round(cssW * this.dpr);
      this.canvas.height = Math.round(cssH * this.dpr);

      const aspect = cssW / cssH;
      if (aspect >= 1.0) {
        // Landscape desktop / mobile — strictly preserve aspect ratio so circles stay circular!
        this.viewW = clamp(Math.round(540 * aspect), 840, 1240);
        this.viewH = Math.round(this.viewW / aspect);
        this.groundY = Math.round(this.viewH * 0.77);
      } else {
        // Portrait mobile / tablet — crisp larger framing & thumb space below deck
        this.viewW = 630;
        this.viewH = Math.round(this.viewW / aspect);
        this.groundY = Math.round(this.viewH * 0.68);
      }
    }

    _computePalette(distance) {
      // Smoothly cycle through Morning -> Sunset -> Night -> Morning every 900m
      const cyclePos = ((distance % 1350) / 450);
      const idxA = Math.floor(cyclePos) % SKY_STAGES.length;
      const idxB = (idxA + 1) % SKY_STAGES.length;
      const rawT = cyclePos - Math.floor(cyclePos);
      // Smoothstep mostly during transitions
      const t = clamp((rawT - 0.55) / 0.45, 0, 1);
      const smoothT = t * t * (3 - 2 * t);

      const A = SKY_STAGES[idxA];
      const B = SKY_STAGES[idxB];
      return {
        skyTop: lerpRgb(A.skyTop, B.skyTop, smoothT),
        skyMid: lerpRgb(A.skyMid, B.skyMid, smoothT),
        skyHorizon: lerpRgb(A.skyHorizon, B.skyHorizon, smoothT),
        sunColor: lerpRgb(A.sunColor, B.sunColor, smoothT),
        sunYFrac: lerp(A.sunYFrac, B.sunYFrac, smoothT),
        island: lerpRgb(A.island, B.island, smoothT),
        pierFar: lerpRgb(A.pierFar, B.pierFar, smoothT),
        seaTop: lerpRgb(A.seaTop, B.seaTop, smoothT),
        seaBottom: lerpRgb(A.seaBottom, B.seaBottom, smoothT),
        foam: lerpRgb(A.foam, B.foam, smoothT),
        deckTop: lerpRgb(A.deckTop, B.deckTop, smoothT),
        deckSide: lerpRgb(A.deckSide, B.deckSide, smoothT),
        nightAlpha: lerp(A.nightAlpha, B.nightAlpha, smoothT)
      };
    }

    render(state) {
      const ctx = this.ctx;
      const scaleX = this.canvas.width / this.viewW;
      const scaleY = this.canvas.height / this.viewH;

      ctx.save();
      ctx.scale(scaleX, scaleY);

      // Apply camera shake & subtle fever zoom
      const shakeX = state.camera.shakeX;
      const shakeY = state.camera.shakeY;
      const zoom = state.camera.zoom;
      if (zoom !== 1 || shakeX !== 0 || shakeY !== 0) {
        const cx = this.viewW * 0.35;
        const cy = this.groundY - 60;
        ctx.translate(cx + shakeX, cy + shakeY);
        ctx.scale(zoom, zoom);
        ctx.translate(-cx, -cy);
      }

      const pal = this._computePalette(state.distance);
      const worldX = state.worldScroll;
      const time = state.time;

      this._drawSkyAndCelestials(ctx, pal, worldX, time, state.feverTimer > 0);
      this._drawHorizonScenery(ctx, pal, worldX, time);
      this._drawOcean(ctx, pal, worldX, time);
      this._drawBoardwalk(ctx, pal, worldX, time, state.gaps);

      // Draw background props (umbrellas, banners posts, rails, ramps)
      this._drawPropsAndHazards(ctx, state, time, "back");

      // Draw collectible fish
      this._drawFishList(ctx, state.fish, worldX, time);

      // Draw speed ribbon trail behind Barnaby
      this._drawRibbonTrail(ctx, state);

      // Draw Hero: Barnaby the Pelican & Beach Cruiser
      this._drawPelicanAndBike(ctx, state, time);

      // Draw foreground hazards (crabs, crates, bandit gulls, banner beams)
      this._drawPropsAndHazards(ctx, state, time, "front");

      // Foreground ocean splash foam in pier gaps
      this._drawGapFoam(ctx, pal, state.gaps, worldX, time);

      // Pooled particles
      this._drawParticles(ctx, state.particles, worldX);

      // Floating stunt/score callouts
      this._drawPopups(ctx, state.popups, worldX);

      // Fever sunburst vignette & speed lines
      if (state.feverTimer > 0) {
        this._drawFeverOverlay(ctx, state.feverTimer, time);
      }

      // First-run subtle floating world control prompt
      if (state.mode === "playing" && state.tutorialTimer > 0) {
        this._drawWorldTutorialHint(ctx, state);
      }

      ctx.restore();
    }

    _drawSkyAndCelestials(ctx, pal, worldX, time, isFever) {
      const horizonY = this.groundY - 82;
      const skyGrad = ctx.createLinearGradient(0, 0, 0, horizonY);
      skyGrad.addColorStop(0, pal.skyTop);
      skyGrad.addColorStop(0.62, pal.skyMid);
      skyGrad.addColorStop(1, pal.skyHorizon);
      ctx.fillStyle = skyGrad;
      ctx.fillRect(-40, -40, this.viewW + 80, horizonY + 55);

      // Stars at sunset / night
      if (pal.nightAlpha > 0.08) {
        ctx.fillStyle = "#ffffff";
        for (let i = 0; i < this.stars.length; i++) {
          const s = this.stars[i];
          const twinkle = 0.45 + 0.55 * Math.sin(time * 2.8 + s.phase);
          ctx.globalAlpha = pal.nightAlpha * twinkle * 0.9;
          ctx.beginPath();
          ctx.arc(s.xFrac * this.viewW, s.yFrac * horizonY, s.r, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      }

      // Sun / Moon with layered atmospheric glow
      const sunX = this.viewW * 0.74;
      const sunY = horizonY * pal.sunYFrac + 28;
      const sunR = isFever ? 46 + Math.sin(time * 10) * 3 : 42;

      ctx.fillStyle = pal.sunColor;
      ctx.globalAlpha = 0.16;
      ctx.beginPath();
      ctx.arc(sunX, sunY, sunR * 2.1, 0, Math.PI * 2);
      ctx.fill();

      ctx.globalAlpha = 0.32;
      ctx.beginPath();
      ctx.arc(sunX, sunY, sunR * 1.42, 0, Math.PI * 2);
      ctx.fill();

      ctx.globalAlpha = 1;
      ctx.beginPath();
      ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
      ctx.fill();

      // Puffy coastal clouds
      const span = 1520;
      for (let i = 0; i < this.clouds.length; i++) {
        const c = this.clouds[i];
        const cx = ((c.x - worldX * 0.045 - time * c.speed) % span + span) % span - 140;
        const cy = c.yFrac * horizonY + 18;
        this._drawCloud(ctx, cx, cy, c.scale, pal.nightAlpha);
      }
    }

    _drawCloud(ctx, x, y, scale, nightAlpha) {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(scale, scale);
      ctx.fillStyle = nightAlpha > 0.6 ? "rgba(185, 200, 240, 0.25)" : "rgba(255, 252, 245, 0.85)";
      ctx.beginPath();
      ctx.arc(0, 0, 24, 0, Math.PI * 2);
      ctx.arc(24, -7, 30, 0, Math.PI * 2);
      ctx.arc(54, -2, 24, 0, Math.PI * 2);
      ctx.arc(74, 6, 17, 0, Math.PI * 2);
      ctx.arc(-20, 7, 17, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    _drawHorizonScenery(ctx, pal, worldX, time) {
      const horizonY = this.groundY - 82;
      const span = 1600;

      // Distant coastal headland + lighthouse
      const headX = ((950 - worldX * 0.08) % span + span) % span - 240;
      ctx.fillStyle = pal.island;
      ctx.beginPath();
      ctx.moveTo(headX - 180, horizonY + 4);
      ctx.quadraticCurveTo(headX - 60, horizonY - 46, headX + 40, horizonY - 28);
      ctx.quadraticCurveTo(headX + 125, horizonY - 14, headX + 210, horizonY + 4);
      ctx.closePath();
      ctx.fill();

      // Lighthouse on headland crest
      const lhx = headX + 12;
      const lhy = horizonY - 31;
      // Searchlight beam at sunset/night
      if (pal.nightAlpha > 0.2) {
        const sweep = Math.sin(time * 1.4) * 0.22;
        ctx.save();
        ctx.translate(lhx, lhy - 28);
        ctx.rotate(sweep);
        ctx.fillStyle = `rgba(255, 242, 165, ${0.22 * pal.nightAlpha})`;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-220, -45);
        ctx.lineTo(-220, 18);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
      ctx.fillStyle = "#fffaf0";
      ctx.beginPath();
      ctx.moveTo(lhx - 6, lhy + 4);
      ctx.lineTo(lhx - 4, lhy - 26);
      ctx.lineTo(lhx + 4, lhy - 26);
      ctx.lineTo(lhx + 6, lhy + 4);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#ef4444";
      ctx.fillRect(lhx - 4.5, lhy - 16, 9, 6);
      ctx.fillStyle = "#fde047";
      ctx.beginPath();
      ctx.arc(lhx, lhy - 28, 3.5, 0, Math.PI * 2);
      ctx.fill();

      // Distant amusement pier with rotating Ferris Wheel
      const pierX = ((380 - worldX * 0.14) % span + span) % span - 220;
      ctx.fillStyle = pal.pierFar;
      ctx.fillRect(pierX - 90, horizonY - 8, 220, 12);
      for (let p = -80; p <= 120; p += 25) {
        ctx.fillRect(pierX + p, horizonY - 4, 3, 14);
      }

      // Ferris wheel
      const fwx = pierX + 25;
      const fwy = horizonY - 52;
      const fwr = 38;
      ctx.strokeStyle = pal.pierFar;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(fwx - 18, horizonY - 6);
      ctx.lineTo(fwx, fwy);
      ctx.lineTo(fwx + 18, horizonY - 6);
      ctx.stroke();

      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.arc(fwx, fwy, fwr, 0, Math.PI * 2);
      ctx.stroke();

      for (let k = 0; k < 8; k++) {
        const ang = time * 0.35 + (k * Math.PI) / 4;
        const gx = fwx + Math.cos(ang) * fwr;
        const gy = fwy + Math.sin(ang) * fwr;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(fwx, fwy);
        ctx.lineTo(gx, gy);
        ctx.stroke();

        ctx.fillStyle = pal.nightAlpha > 0.3 ? "#fde047" : pal.pierFar;
        ctx.beginPath();
        ctx.arc(gx, gy, 3.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    _drawOcean(ctx, pal, worldX, time) {
      const horizonY = this.groundY - 82;
      const seaH = this.viewH - horizonY + 40;

      const seaGrad = ctx.createLinearGradient(0, horizonY, 0, this.viewH);
      seaGrad.addColorStop(0, pal.seaTop);
      seaGrad.addColorStop(1, pal.seaBottom);
      ctx.fillStyle = seaGrad;
      ctx.fillRect(-40, horizonY, this.viewW + 80, seaH);

      // Shimmering sun reflection path on waves
      const sunX = this.viewW * 0.74;
      ctx.fillStyle = pal.sunColor;
      ctx.globalAlpha = 0.25;
      for (let i = 0; i < 9; i++) {
        const ry = horizonY + 8 + i * 9;
        const w = (48 - i * 3.5) + Math.sin(time * 4 + i * 1.3) * 10;
        const rx = sunX + Math.sin(time * 2.5 + i) * 8 - w * 0.5;
        ctx.fillRect(rx, ry, Math.max(8, w), 3);
      }
      ctx.globalAlpha = 1;

      // Sailboats on mid-ocean
      const span = 1400;
      for (let i = 0; i < this.sailboats.length; i++) {
        const b = this.sailboats[i];
        const bx = ((b.x - worldX * 0.18 - time * b.speed) % span + span) % span - 80;
        const by = horizonY + 14 + i * 9 + Math.sin(time * 2.2 + i) * 2;
        ctx.save();
        ctx.translate(bx, by);
        ctx.scale(b.scale, b.scale);
        ctx.fillStyle = "#fffaf0";
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -24);
        ctx.lineTo(14, -4);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "#ff5e4d";
        ctx.beginPath();
        ctx.moveTo(-2, -2);
        ctx.lineTo(-2, -18);
        ctx.lineTo(-10, -3);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "#16263b";
        ctx.beginPath();
        ctx.moveTo(-12, 0);
        ctx.lineTo(16, 0);
        ctx.lineTo(11, 5);
        ctx.lineTo(-8, 5);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      // Animated wave swells
      for (let layer = 0; layer < 2; layer++) {
        const baseY = horizonY + 34 + layer * 28;
        const speed = layer === 0 ? 0.32 : 0.52;
        const waveAmp = layer === 0 ? 4.5 : 6.5;
        ctx.strokeStyle = pal.foam;
        ctx.globalAlpha = layer === 0 ? 0.28 : 0.42;
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        for (let x = -20; x <= this.viewW + 20; x += 24) {
          const wy = baseY + Math.sin((x + worldX * speed) * 0.025 + time * (2 + layer)) * waveAmp;
          if (x === -20) ctx.moveTo(x, wy);
          else ctx.lineTo(x, wy);
        }
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }

    _isInGap(worldPos, gaps) {
      for (let i = 0; i < gaps.length; i++) {
        const g = gaps[i];
        if (worldPos > g.x && worldPos < g.x + g.w) return true;
      }
      return false;
    }

    _drawBoardwalk(ctx, pal, worldX, time, gaps) {
      const gy = this.groundY;
      const viewLeftWorld = worldX;
      const viewRightWorld = worldX + this.viewW;

      // 1. Overhead pier string-light posts & fairy lights every 360px
      const postStep = 360;
      const firstPost = Math.floor((viewLeftWorld - 380) / postStep) * postStep;
      for (let wx = firstPost; wx <= viewRightWorld + 380; wx += postStep) {
        if (this._isInGap(wx, gaps)) continue;
        const sx = wx - worldX;

        // Post
        ctx.fillStyle = "#5c3d28";
        ctx.fillRect(sx - 4, gy - 168, 8, 168);
        ctx.fillStyle = "#16263b";
        ctx.fillRect(sx - 6, gy - 172, 12, 6);

        // String wire to next post if next post also exists
        const nextWx = wx + postStep;
        if (!this._isInGap(nextWx, gaps)) {
          const nsx = nextWx - worldX;
          ctx.strokeStyle = "rgba(22, 38, 59, 0.55)";
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.moveTo(sx, gy - 166);
          ctx.quadraticCurveTo((sx + nsx) * 0.5, gy - 134, nsx, gy - 166);
          ctx.stroke();

          // Warm fairy bulbs along catenary curve
          for (let b = 1; b <= 5; b++) {
            const t = b / 6;
            const bx = lerp(sx, nsx, t);
            const sag = 4 * t * (1 - t) * 32;
            const by = gy - 166 + sag;

            if (pal.nightAlpha > 0.15) {
              ctx.fillStyle = `rgba(255, 210, 90, ${0.35 * pal.nightAlpha})`;
              ctx.beginPath();
              ctx.arc(bx, by + 3, 9, 0, Math.PI * 2);
              ctx.fill();
            }
            ctx.fillStyle = b % 2 === 0 ? "#ffe066" : "#ff9f43";
            ctx.beginPath();
            ctx.arc(bx, by + 3, 3.2, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      // 2. Build solid deck segments (cutting out pier water gaps)
      const segments = [];
      let cursor = viewLeftWorld - 60;
      const end = viewRightWorld + 60;

      // Gaps are sorted by x
      for (let i = 0; i < gaps.length; i++) {
        const g = gaps[i];
        if (g.x + g.w <= cursor || g.x >= end) continue;
        if (g.x > cursor) {
          segments.push({ wStart: cursor, wEnd: g.x, leftEdge: cursor > viewLeftWorld - 50, rightEdge: true });
        }
        cursor = Math.max(cursor, g.x + g.w);
      }
      if (cursor < end) {
        segments.push({ wStart: cursor, wEnd: end, leftEdge: cursor > viewLeftWorld - 50, rightEdge: false });
      }

      // 3. Draw timber pilings, white background railing & wooden deck for each solid segment
      for (let s = 0; s < segments.length; s++) {
        const seg = segments[s];
        const x1 = seg.wStart - worldX;
        const x2 = seg.wEnd - worldX;
        const width = x2 - x1;
        if (width <= 1) continue;

        // Underwater / under-deck timber pilings every 130px
        const pilingStep = 130;
        const firstPiling = Math.ceil(seg.wStart / pilingStep) * pilingStep;
        for (let pw = firstPiling; pw <= seg.wEnd - 12; pw += pilingStep) {
          const px = pw - worldX;
          ctx.fillStyle = "#4a2f1d";
          ctx.fillRect(px - 9, gy + 20, 18, this.viewH - gy);
          ctx.fillStyle = "#352012";
          ctx.fillRect(px + 2, gy + 20, 7, this.viewH - gy);
          // Barnacle/wet band
          ctx.fillStyle = "rgba(14, 165, 164, 0.35)";
          ctx.fillRect(px - 9, gy + 55, 18, 18);
        }

        // White coastal guardrail behind bike lane
        ctx.fillStyle = "rgba(255, 250, 240, 0.88)";
        ctx.strokeStyle = "#16263b";
        ctx.lineWidth = 2;
        ctx.fillRect(x1, gy - 36, width, 7);
        ctx.strokeRect(x1, gy - 36, width, 7);
        ctx.fillRect(x1, gy - 20, width, 5);

        const railPostStep = 90;
        const firstRP = Math.ceil(seg.wStart / railPostStep) * railPostStep;
        for (let rw = firstRP; rw <= seg.wEnd - 6; rw += railPostStep) {
          const rx = rw - worldX;
          ctx.fillStyle = "#fffaf0";
          ctx.fillRect(rx - 4, gy - 41, 8, 41);
          ctx.strokeRect(rx - 4, gy - 41, 8, 41);
        }

        // Main boardwalk deck surface
        ctx.fillStyle = pal.deckTop;
        ctx.fillRect(x1, gy, width, 18);

        // Side beam fascia
        ctx.fillStyle = pal.deckSide;
        ctx.fillRect(x1, gy + 18, width, 16);

        // Crisp ink outlines
        ctx.strokeStyle = "#16263b";
        ctx.lineWidth = 2.8;
        ctx.beginPath();
        ctx.moveTo(x1, gy);
        ctx.lineTo(x2, gy);
        ctx.moveTo(x1, gy + 34);
        ctx.lineTo(x2, gy + 34);
        ctx.stroke();

        // Plank seams scrolling smoothly
        const plankStep = 34;
        const firstPlank = Math.ceil(seg.wStart / plankStep) * plankStep;
        ctx.strokeStyle = "rgba(22, 38, 59, 0.35)";
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        for (let kw = firstPlank; kw < seg.wEnd; kw += plankStep) {
          const kx = kw - worldX;
          ctx.moveTo(kx, gy + 1);
          ctx.lineTo(kx - 5, gy + 18);
          ctx.moveTo(kx - 5, gy + 18);
          ctx.lineTo(kx - 5, gy + 33);
        }
        ctx.stroke();

        // Striped pier warning bollards at gap edges!
        if (seg.rightEdge) {
          this._drawGapBollard(ctx, x2 - 10, gy);
        }
        if (seg.leftEdge) {
          this._drawGapBollard(ctx, x1 + 10, gy);
        }
      }
    }

    _drawGapBollard(ctx, x, gy) {
      ctx.save();
      ctx.translate(x, gy);
      ctx.fillStyle = "#ffb800";
      ctx.strokeStyle = "#16263b";
      ctx.lineWidth = 2.2;
      ctx.fillRect(-6, -26, 12, 26);
      ctx.fillStyle = "#ff5e4d";
      ctx.fillRect(-6, -20, 12, 7);
      ctx.fillRect(-6, -8, 12, 5);
      ctx.strokeRect(-6, -26, 12, 26);
      ctx.restore();
    }

    _drawGapFoam(ctx, pal, gaps, worldX, time) {
      const gy = this.groundY;
      for (let i = 0; i < gaps.length; i++) {
        const g = gaps[i];
        const x1 = g.x - worldX;
        const x2 = x1 + g.w;
        if (x2 < -40 || x1 > this.viewW + 40) continue;

        // Sparkling water surface inside the pier gap
        const waterY = gy + 28;
        ctx.fillStyle = "#0ea5e9";
        ctx.fillRect(x1, waterY, g.w, this.viewH - waterY + 20);

        // Animated splashing foam crests
        ctx.fillStyle = pal.foam;
        ctx.beginPath();
        ctx.moveTo(x1, waterY + 12);
        for (let x = x1; x <= x2; x += 16) {
          const wy = waterY + Math.sin(x * 0.08 + time * 7.5) * 5;
          ctx.lineTo(x, wy);
        }
        ctx.lineTo(x2, waterY + 12);
        ctx.closePath();
        ctx.fill();
      }
    }

    // ==================== OBSTACLES & INTERACTIVE PROPS ====================
    _drawPropsAndHazards(ctx, state, time, pass) {
      const worldX = state.worldScroll;
      const gy = this.groundY;
      const list = state.entities;

      for (let i = 0; i < list.length; i++) {
        const e = list[i];
        if (!e.active) continue;
        const sx = e.x - worldX;
        if (sx + (e.w || 80) < -90 || sx - 90 > this.viewW) continue;

        if (pass === "back") {
          if (e.type === "umbrella") this._drawUmbrella(ctx, e, sx, gy, time);
          else if (e.type === "ramp") this._drawRamp(ctx, e, sx, gy);
          else if (e.type === "rail") this._drawRail(ctx, e, sx, gy);
          else if (e.type === "banner") this._drawBannerBack(ctx, e, sx, gy);
        } else {
          if (e.type === "crab") this._drawCrab(ctx, e, sx, gy, time);
          else if (e.type === "crate") this._drawCrate(ctx, e, sx, gy);
          else if (e.type === "gull") this._drawBanditGull(ctx, e, sx, gy, time);
          else if (e.type === "banner") this._drawBannerFront(ctx, e, sx, gy, time);
        }
      }
    }

    _drawUmbrella(ctx, e, sx, gy, time) {
      const bounceT = e.bounceAnim || 0;
      const squashY = 1 - Math.sin(bounceT * Math.PI) * 0.28;
      const squashX = 1 + Math.sin(bounceT * Math.PI) * 0.24;
      const topY = gy - e.h;

      ctx.save();
      // Wooden pole behind lane
      ctx.strokeStyle = "#7c4a21";
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(sx, gy);
      ctx.lineTo(sx, topY + 12);
      ctx.stroke();

      // Canopy
      ctx.translate(sx, topY + 14);
      ctx.scale(squashX, squashY);

      const r = e.w * 0.52;
      const colors = ["#ff5e4d", "#fffaf0", "#38bdf8", "#fffaf0", "#ffb800"];
      ctx.strokeStyle = "#16263b";
      ctx.lineWidth = 2.4;
      for (let p = 0; p < 5; p++) {
        const xStart = -r + (p * 2 * r) / 5;
        const xEnd = -r + ((p + 1) * 2 * r) / 5;
        ctx.fillStyle = colors[p];
        ctx.beginPath();
        ctx.moveTo(0, -24);
        ctx.quadraticCurveTo(xStart * 0.68, -14, xStart, 4);
        ctx.quadraticCurveTo((xStart + xEnd) * 0.5, 11, xEnd, 4);
        ctx.quadraticCurveTo(xEnd * 0.68, -14, 0, -24);
        ctx.fill();
        ctx.stroke();
      }

      // Finial knob
      ctx.fillStyle = "#ffb800";
      ctx.beginPath();
      ctx.arc(0, -26, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.restore();
    }

    _drawRamp(ctx, e, sx, gy) {
      ctx.save();
      ctx.translate(sx, gy);
      // Angled wooden launch kicker
      ctx.fillStyle = "#e79c3f";
      ctx.strokeStyle = "#16263b";
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(e.w, -e.h);
      ctx.lineTo(e.w, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Bright yellow boost chevrons
      ctx.strokeStyle = "#fff7b2";
      ctx.lineWidth = 3;
      for (let i = 0; i < 2; i++) {
        const bx = e.w * (0.38 + i * 0.28);
        const by = -e.h * (0.25 + i * 0.26);
        ctx.beginPath();
        ctx.moveTo(bx - 8, by + 6);
        ctx.lineTo(bx + 2, by - 2);
        ctx.lineTo(bx - 4, by - 8);
        ctx.stroke();
      }
      ctx.restore();
    }

    _drawRail(ctx, e, sx, gy) {
      const ry = gy - e.h;
      ctx.save();

      // Support stanchions
      ctx.fillStyle = "#334155";
      ctx.strokeStyle = "#16263b";
      ctx.lineWidth = 2;
      const posts = Math.max(2, Math.round(e.w / 130) + 1);
      for (let i = 0; i < posts; i++) {
        const px = sx + 12 + (i * (e.w - 24)) / (posts - 1);
        ctx.fillRect(px - 3.5, ry + 6, 7, e.h - 6);
        ctx.strokeRect(px - 3.5, ry + 6, 7, e.h - 6);
      }

      // Polished brass & teak grind bar
      ctx.fillStyle = "#f59e0b";
      ctx.strokeStyle = "#16263b";
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.roundRect(sx, ry, e.w, 11, 5.5);
      ctx.fill();
      ctx.stroke();

      // Specular highlight strip
      ctx.fillStyle = "#fef08a";
      ctx.fillRect(sx + 6, ry + 2.2, e.w - 12, 3);
      ctx.restore();
    }

    _drawBannerBack(ctx, e, sx, gy) {
      ctx.fillStyle = "#6b4423";
      ctx.strokeStyle = "#16263b";
      ctx.lineWidth = 2.4;
      ctx.fillRect(sx + 4, gy - 122, 9, 122);
      ctx.strokeRect(sx + 4, gy - 122, 9, 122);
      ctx.fillRect(sx + e.w - 13, gy - 122, 9, 122);
      ctx.strokeRect(sx + e.w - 13, gy - 122, 9, 122);
    }

    _drawBannerFront(ctx, e, sx, gy, time) {
      // Overhead beam sits from clearance (e.clearance = 50) up to 114
      const bottomY = gy - e.clearance;
      const beamH = 54;
      const topY = bottomY - beamH;

      ctx.save();
      // Hanging buoy pennants fluttering underneath
      for (let p = 0; p < 4; p++) {
        const px = sx + 18 + (p * (e.w - 36)) / 3;
        const sway = Math.sin(time * 6 + p) * 3;
        ctx.fillStyle = p % 2 === 0 ? "#ff5e4d" : "#38bdf8";
        ctx.beginPath();
        ctx.moveTo(px - 7, bottomY - 2);
        ctx.lineTo(px + 7, bottomY - 2);
        ctx.lineTo(px + sway, bottomY + 10);
        ctx.closePath();
        ctx.fill();
      }

      // Main sign board
      ctx.fillStyle = "#fffaf0";
      ctx.strokeStyle = "#16263b";
      ctx.lineWidth = 2.8;
      ctx.beginPath();
      ctx.roundRect(sx, topY, e.w, beamH, 8);
      ctx.fill();
      ctx.stroke();

      // Red/gold hazard bar at bottom edge
      ctx.fillStyle = "#ff5e4d";
      ctx.fillRect(sx + 3, bottomY - 12, e.w - 6, 9);

      // Sign text "↓ DUCK"
      ctx.fillStyle = "#16263b";
      ctx.font = '900 14px "Avenir Next Rounded", system-ui, sans-serif';
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("↓ LOW PIER", sx + e.w * 0.5, topY + 22);
      ctx.restore();
    }

    _drawCrab(ctx, e, sx, gy, time) {
      ctx.save();
      const scuttle = Math.sin(time * 16 + e.phase) * 2.5;
      if (e.smashed) {
        ctx.translate(sx, gy - 24 + e.smashY);
        ctx.rotate(e.smashRot);
      } else {
        ctx.translate(sx, gy - 16 + Math.abs(scuttle) * 0.6);
      }

      // 6 little legs
      ctx.strokeStyle = "#b91c1c";
      ctx.lineWidth = 3;
      for (let side = -1; side <= 1; side += 2) {
        for (let l = 0; l < 3; l++) {
          const legWag = Math.sin(time * 20 + l * 1.4 + side) * 4;
          ctx.beginPath();
          ctx.moveTo(side * 12, 2 + l * 2);
          ctx.lineTo(side * (22 + l * 2), 6 + legWag * 0.4);
          ctx.lineTo(side * (25 + l), 15);
          ctx.stroke();
        }
      }

      // Raised snapping claws!
      const pinch = Math.abs(Math.sin(time * 8 + e.phase)) * 0.35;
      for (let side = -1; side <= 1; side += 2) {
        ctx.save();
        ctx.translate(side * 15, -8);
        ctx.rotate(side * 0.35);
        ctx.fillStyle = "#ef4444";
        ctx.strokeStyle = "#16263b";
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.arc(0, -10, 9, 0.2 + pinch, Math.PI * 1.85 - pinch);
        ctx.lineTo(0, -10);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }

      // Shell body
      ctx.fillStyle = "#ff4438";
      ctx.strokeStyle = "#16263b";
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.ellipse(0, 0, 19, 13, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Eye stalks + grumpy eyebrows
      for (let side = -1; side <= 1; side += 2) {
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(side * 6.5, -13, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "#16263b";
        ctx.beginPath();
        ctx.arc(side * 6, -13, 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.beginPath();
      ctx.moveTo(-11, -18);
      ctx.lineTo(-2, -15);
      ctx.moveTo(11, -18);
      ctx.lineTo(2, -15);
      ctx.stroke();

      ctx.restore();
    }

    _drawCrate(ctx, e, sx, gy) {
      if (e.smashed) return;
      const size = e.h;
      const left = sx - e.w * 0.5;
      const top = gy - size;

      ctx.save();
      ctx.fillStyle = "#d99b52";
      ctx.strokeStyle = "#16263b";
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.roundRect(left, top, e.w, size, 5);
      ctx.fill();
      ctx.stroke();

      // Inner recessed panel & diagonal brace
      ctx.fillStyle = "#c2813a";
      ctx.fillRect(left + 6, top + 6, e.w - 12, size - 12);
      ctx.strokeStyle = "#7c4a21";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(left + 6, top + 6);
      ctx.lineTo(left + e.w - 6, top + size - 6);
      ctx.moveTo(left + e.w - 6, top + 6);
      ctx.lineTo(left + 6, top + size - 6);
      ctx.stroke();

      // Tiny fish stencil icon so players know fish are inside!
      ctx.fillStyle = "#fff4cc";
      ctx.beginPath();
      ctx.ellipse(sx - 2, top + size * 0.5, 9, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(sx + 6, top + size * 0.5);
      ctx.lineTo(sx + 13, top + size * 0.5 - 5);
      ctx.lineTo(sx + 13, top + size * 0.5 + 5);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    }

    _drawBanditGull(ctx, e, sx, gy, time) {
      const bob = e.smashed ? e.smashY : Math.sin(time * 7 + e.phase) * 7;
      const sy = gy - e.h + bob;

      ctx.save();
      ctx.translate(sx, sy);
      if (e.smashed) {
        ctx.rotate(e.smashRot);
      }

      const flap = Math.sin(time * 15 + e.phase) * 14;

      // Back wing
      ctx.fillStyle = "#64748b";
      ctx.strokeStyle = "#16263b";
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(2, -4);
      ctx.quadraticCurveTo(10, -22 - flap * 0.6, 22, -14 - flap);
      ctx.lineTo(10, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      //Gull body (facing left toward Barnaby!)
      ctx.fillStyle = "#f8fafc";
      ctx.beginPath();
      ctx.ellipse(0, 0, 21, 11, -0.08, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Tail
      ctx.fillStyle = "#334155";
      ctx.beginPath();
      ctx.moveTo(18, -3);
      ctx.lineTo(29, -8);
      ctx.lineTo(28, 4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Red pirate bandana!
      ctx.fillStyle = "#ef4444";
      ctx.beginPath();
      ctx.arc(-13, -7, 8.5, Math.PI, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      // Bandana tails
      ctx.beginPath();
      ctx.moveTo(-5, -8);
      ctx.lineTo(4, -13);
      ctx.lineTo(2, -7);
      ctx.fill();

      // Beak
      ctx.fillStyle = "#ffb800";
      ctx.beginPath();
      ctx.moveTo(-19, -5);
      ctx.lineTo(-33, -1);
      ctx.lineTo(-19, 3);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Angry eye
      ctx.fillStyle = "#16263b";
      ctx.beginPath();
      ctx.arc(-15, -4, 2.2, 0, Math.PI * 2);
      ctx.fill();

      // Front wing
      ctx.fillStyle = "#cbd5e1";
      ctx.beginPath();
      ctx.moveTo(-2, -1);
      ctx.quadraticCurveTo(6, -20 + flap, 18, -12 + flap * 1.2);
      ctx.lineTo(10, 4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.restore();
    }

    _drawFishList(ctx, fishList, worldX, time) {
      const gy = this.groundY;
      for (let i = 0; i < fishList.length; i++) {
        const f = fishList[i];
        if (!f.active) continue;
        const sx = f.x - worldX;
        if (sx < -40 || sx > this.viewW + 40) continue;

        const bob = Math.sin(time * 6.5 + f.phase) * 4.5;
        const sy = gy - f.h + bob;

        ctx.save();
        ctx.translate(sx, sy);
        ctx.rotate(Math.sin(time * 8 + f.phase) * 0.14);

        const isRare = f.rare;
        const scale = isRare ? 1.32 : 1.0;
        ctx.scale(scale, scale);

        // Soft glow ring
        ctx.fillStyle = isRare ? "rgba(255, 215, 0, 0.32)" : "rgba(56, 189, 248, 0.22)";
        ctx.beginPath();
        ctx.arc(0, 0, 15, 0, Math.PI * 2);
        ctx.fill();

        // Tail fin (facing left so Barnaby scoops them head-first!)
        const wag = Math.sin(time * 18 + f.phase) * 3;
        ctx.fillStyle = isRare ? "#ff5e4d" : "#f59e0b";
        ctx.strokeStyle = "#16263b";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(9, 0);
        ctx.lineTo(18, -7 + wag * 0.5);
        ctx.lineTo(16, 0);
        ctx.lineTo(18, 7 + wag * 0.5);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Fish body
        if (isRare) {
          const hue = Math.round((time * 220 + i * 30) % 360);
          ctx.fillStyle = `hsl(${hue}, 92%, 62%)`;
        } else {
          ctx.fillStyle = f.gold ? "#ffd147" : "#7dd3fc";
        }
        ctx.beginPath();
        ctx.ellipse(-1, 0, 11.5, 6.8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Belly shine & cute eye
        ctx.fillStyle = "rgba(255, 255, 255, 0.65)";
        ctx.beginPath();
        ctx.ellipse(-2, -2.2, 6.5, 2, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#16263b";
        ctx.beginPath();
        ctx.arc(-6.5, -1, 1.8, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }
    }

    // ==================== HERO: BARNABY THE PELICAN & BICYCLE ====================
    _drawRibbonTrail(ctx, state) {
      const trail = state.trail;
      if (trail.length < 2) return;
      const worldX = state.worldScroll;
      const gy = this.groundY;
      const isFever = state.feverTimer > 0;

      ctx.save();
      for (let i = 1; i < trail.length; i++) {
        const p0 = trail[i - 1];
        const p1 = trail[i];
        const x0 = p0.x - worldX;
        const y0 = gy - p0.h;
        const x1 = p1.x - worldX;
        const y1 = gy - p1.h;
        const t = i / trail.length;

        ctx.lineCap = "round";
        if (isFever) {
          const hue = (i * 22 + state.time * 360) % 360;
          ctx.strokeStyle = `hsla(${hue}, 95%, 60%, ${t * 0.65})`;
          ctx.lineWidth = t * 14;
        } else {
          ctx.strokeStyle = `rgba(255, 250, 240, ${t * 0.35})`;
          ctx.lineWidth = t * 6;
        }
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
        ctx.stroke();
      }
      ctx.restore();
    }

    _drawPelicanAndBike(ctx, state, time) {
      const p = state.player;
      const theme = BIKE_THEMES[state.themeIndex % BIKE_THEMES.length];
      const sx = p.screenX;
      const sy = this.groundY - p.h;

      ctx.save();

      // Soft contact shadow on boardwalk when over solid deck
      if (!state.overGap && p.h >= -5) {
        const shadowScale = clamp(1 - p.h / 280, 0.22, 1);
        ctx.fillStyle = `rgba(22, 38, 59, ${0.26 * shadowScale})`;
        ctx.beginPath();
        ctx.ellipse(sx, this.groundY + 4, 42 * shadowScale, 6.5 * shadowScale, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      // Fever aura behind Barnaby
      if (state.feverTimer > 0) {
        const pulse = 58 + Math.sin(time * 18) * 6;
        ctx.fillStyle = "rgba(255, 200, 40, 0.24)";
        ctx.beginPath();
        ctx.arc(sx + 2, sy - 38, pulse, 0, Math.PI * 2);
        ctx.fill();
      }

      // Transform around tire contact point for squash/stretch, wheelie pitch & 360° flips!
      ctx.translate(sx, sy);
      ctx.scale(p.squashX, p.squashY);

      // Rotate around bicycle center of mass (0, -34)
      ctx.translate(0, -34);
      ctx.rotate(p.pitch + p.flipAngle);
      ctx.translate(0, 34);

      const wheelR = 19;
      const rearWX = -28;
      const frontWX = 28;
      const wheelY = -wheelR;
      const crankX = -3;
      const crankY = -20;
      const crankR = 9.5;
      const seatX = -16;
      const seatY = -43;
      const headTubeX = 20;
      const headTubeY = -44;
      const barGripX = 13;
      const barGripY = -56;

      // Pedal positions from wheel rotation
      const pedAngleR = p.pedalAngle;
      const pedAngleL = p.pedalAngle + Math.PI;
      const pedRX = crankX + Math.cos(pedAngleR) * crankR;
      const pedRY = crankY + Math.sin(pedAngleR) * crankR;
      const pedLX = crankX + Math.cos(pedAngleL) * crankR;
      const pedLY = crankY + Math.sin(pedAngleL) * crankR;

      // Hip position of Barnaby on cruiser saddle
      const tuck = p.tuckBlend; // 0 = upright, 1 = aero crouch
      const hipX = seatX + 2;
      const hipY = seatY - 7 + tuck * 3;

      // 1. BACK PELICAN LEG (2-bone IK!)
      this._drawPelicanLeg(ctx, hipX, hipY, pedLX, pedLY, "#d95d16", false);

      // 2. BICYCLE WHEELS
      this._drawBikeWheel(ctx, rearWX, wheelY, wheelR, p.wheelAngle, theme);
      this._drawBikeWheel(ctx, frontWX, wheelY, wheelR, p.wheelAngle, theme);

      // 3. VINTAGE CRUISER FRAME
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      // Chainstay & chain guard
      ctx.strokeStyle = "#16263b";
      ctx.lineWidth = 6.5;
      ctx.beginPath();
      ctx.moveTo(rearWX, wheelY);
      ctx.lineTo(crankX, crankY);
      ctx.lineTo(seatX, seatY + 3);
      ctx.lineTo(rearWX, wheelY);
      // Curved beach-cruiser top & down tubes!
      ctx.moveTo(crankX, crankY);
      ctx.quadraticCurveTo(10, -24, headTubeX, headTubeY + 8);
      ctx.moveTo(seatX, seatY + 5);
      ctx.quadraticCurveTo(4, -49, headTubeX, headTubeY);
      // Front fork
      ctx.moveTo(headTubeX - 1, headTubeY + 9);
      ctx.lineTo(frontWX, wheelY);
      ctx.stroke();

      // Inner painted frame color
      ctx.strokeStyle = theme.frame;
      ctx.lineWidth = 3.6;
      ctx.beginPath();
      ctx.moveTo(rearWX, wheelY);
      ctx.lineTo(crankX, crankY);
      ctx.lineTo(seatX, seatY + 3);
      ctx.lineTo(rearWX, wheelY);
      ctx.moveTo(crankX, crankY);
      ctx.quadraticCurveTo(10, -24, headTubeX, headTubeY + 8);
      ctx.moveTo(seatX, seatY + 5);
      ctx.quadraticCurveTo(4, -49, headTubeX, headTubeY);
      ctx.moveTo(headTubeX - 1, headTubeY + 9);
      ctx.lineTo(frontWX, wheelY);
      ctx.stroke();

      // Chrome handlebars + brass bell
      ctx.strokeStyle = "#e2e8f0";
      ctx.lineWidth = 3.2;
      ctx.beginPath();
      ctx.moveTo(headTubeX, headTubeY);
      ctx.lineTo(headTubeX - 2, -55);
      ctx.quadraticCurveTo(headTubeX - 4, -59, barGripX, barGripY);
      ctx.stroke();

      // Brass bike bell
      ctx.fillStyle = "#ffb800";
      ctx.strokeStyle = "#16263b";
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(headTubeX + 2, -57, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Wicker front basket with a peeking fish!
      ctx.fillStyle = "#d4944e";
      ctx.strokeStyle = "#16263b";
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.roundRect(headTubeX + 3, -53, 14, 13, 3);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = "#8c5823";
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(headTubeX + 4, -47);
      ctx.lineTo(headTubeX + 16, -47);
      ctx.stroke();

      // Leather cruiser saddle
      ctx.fillStyle = "#5c3317";
      ctx.strokeStyle = "#16263b";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(seatX - 1, seatY, 9.5, 4, -0.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Sprocket & front crank
      ctx.fillStyle = "#cbd5e1";
      ctx.beginPath();
      ctx.arc(crankX, crankY, 5.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(crankX, crankY);
      ctx.lineTo(pedRX, pedRY);
      ctx.stroke();

      // 4. BACK WING (when flapping / gliding in midair)
      if (p.wingOpen > 0.05) {
        this._drawSpreadWing(ctx, hipX + 6, hipY - 16, p.wingOpen, p.wingFlapPhase, true);
      }

      // 5. PELICAN PLUMP BODY & TAIL
      const bodyTilt = -0.18 - tuck * 0.42;
      ctx.save();
      ctx.translate(hipX + 3, hipY - 12 + tuck * 5);
      ctx.rotate(bodyTilt);

      // Tail feathers wagging
      const tailWag = Math.sin(time * 14) * 0.12;
      ctx.fillStyle = "#fffaf0";
      ctx.strokeStyle = "#16263b";
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(-14, 2);
      ctx.lineTo(-27, -4 + tailWag * 14);
      ctx.lineTo(-23, 3 + tailWag * 10);
      ctx.lineTo(-26, 8 + tailWag * 8);
      ctx.lineTo(-12, 8);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Plump feathered torso
      ctx.fillStyle = "#fffdf7";
      ctx.beginPath();
      ctx.ellipse(0, 0, 18, 14, 0.15, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Soft warm underbelly shading
      ctx.fillStyle = "#fde8c8";
      ctx.beginPath();
      ctx.ellipse(2, 5, 13, 6, 0.12, 0, Math.PI);
      ctx.fill();
      ctx.restore();

      // 6. FRONT PELICAN LEG (2-bone IK wrapping front pedal!)
      this._drawPelicanLeg(ctx, hipX, hipY, pedRX, pedRY, "#ff7b1c", true);

      // 7. S-CURVED NECK, HEAD, GIANT BEAK & SPRING GULAR POUCH!
      const neckBaseX = hipX + 14 + tuck * 4;
      const neckBaseY = hipY - 19 + tuck * 8;
      const headBob = p.neckSpring;
      const headX = lerp(neckBaseX + 3, neckBaseX + 19, tuck);
      const headY = lerp(neckBaseY - 25 + headBob, neckBaseY - 5 + headBob * 0.5, tuck);

      // Graceful curved neck
      ctx.strokeStyle = "#16263b";
      ctx.lineWidth = 13.5;
      ctx.beginPath();
      ctx.moveTo(neckBaseX, neckBaseY);
      ctx.quadraticCurveTo(neckBaseX - 6 + tuck * 8, (neckBaseY + headY) * 0.5 + 3, headX, headY);
      ctx.stroke();

      ctx.strokeStyle = "#fffdf7";
      ctx.lineWidth = 9;
      ctx.beginPath();
      ctx.moveTo(neckBaseX, neckBaseY);
      ctx.quadraticCurveTo(neckBaseX - 6 + tuck * 8, (neckBaseY + headY) * 0.5 + 3, headX, headY);
      ctx.stroke();

      // Head + Beak + Elastic Throat Pouch
      ctx.save();
      ctx.translate(headX, headY);
      ctx.rotate(tuck * 0.18 + clamp(-p.vy * 0.00022, -0.18, 0.22));

      // Elastic Gular Throat Pouch! (Inflates with fish & wobbles with spring physics!)
      const pouchDepth = 9 + p.pouchFill * 19 + p.pouchJiggle * 8;
      const beakLen = 33;

      ctx.fillStyle = state.feverTimer > 0 ? "#ffb800" : "#ff8533";
      ctx.strokeStyle = "#16263b";
      ctx.lineWidth = 2.3;
      ctx.beginPath();
      ctx.moveTo(3, 1);
      ctx.bezierCurveTo(6, pouchDepth * 1.15, beakLen - 4, pouchDepth * 1.2, beakLen - 2, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Subtle fish bulge crease lines on pouch when stuffed
      if (p.pouchFill > 0.15) {
        ctx.strokeStyle = "rgba(180, 65, 12, 0.45)";
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.arc(16, pouchDepth * 0.48, 5 + p.pouchFill * 4, 0.2, Math.PI - 0.3);
        ctx.stroke();
      }

      // Pelicans' iconic golden upper bill + hooked coral tip
      ctx.fillStyle = "#ffd147";
      ctx.strokeStyle = "#16263b";
      ctx.lineWidth = 2.3;
      ctx.beginPath();
      ctx.moveTo(2, -5);
      ctx.lineTo(beakLen, -3);
      ctx.quadraticCurveTo(beakLen + 4, 0, beakLen + 1, 4);
      ctx.lineTo(beakLen - 3, 1);
      ctx.lineTo(2, 1.5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Coral beak hook accent
      ctx.fillStyle = "#ff5e4d";
      ctx.beginPath();
      ctx.arc(beakLen, 0.5, 2.6, 0, Math.PI * 2);
      ctx.fill();

      // Round feathered head
      ctx.fillStyle = "#fffdf7";
      ctx.beginPath();
      ctx.arc(0, -2, 10.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Cheek blush
      ctx.fillStyle = "rgba(255, 94, 77, 0.35)";
      ctx.beginPath();
      ctx.arc(2, 2, 3.2, 0, Math.PI * 2);
      ctx.fill();

      // Expressive Cartoon Eye
      this._drawPelicanEye(ctx, 3.5, -4, state, p, time);

      // Jaunty Hat (bobs slightly on big jumps!)
      this._drawPelicanHat(ctx, -2, -11 - clamp(p.vy * 0.006, -1, 5), theme);

      // Dizzy crash stars if wiped out
      if (state.mode === "gameover") {
        for (let st = 0; st < 3; st++) {
          const ang = time * 5.5 + (st * Math.PI * 2) / 3;
          const sxStar = Math.cos(ang) * 16;
          const syStar = -22 + Math.sin(ang) * 5;
          ctx.fillStyle = "#ffd147";
          ctx.beginPath();
          ctx.arc(sxStar, syStar, 3.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.restore();

      // 8. FRONT WING (either gripping handlebars OR spread wide in flight!)
      if (p.wingOpen > 0.12) {
        this._drawSpreadWing(ctx, hipX + 4, hipY - 14, p.wingOpen, p.wingFlapPhase, false);
      } else {
        // Wing reaching forward to grip cruiser handlebars!
        const shoulderX = hipX + 6;
        const shoulderY = hipY - 15 + tuck * 5;
        ctx.fillStyle = "#fffaf0";
        ctx.strokeStyle = "#16263b";
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.moveTo(shoulderX - 4, shoulderY - 3);
        ctx.quadraticCurveTo((shoulderX + barGripX) * 0.5 - 3, shoulderY + 10, barGripX + 2, barGripY + 1);
        ctx.quadraticCurveTo(barGripX + 4, barGripY - 4, shoulderX + 5, shoulderY - 5);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }

      // 9. Handlebar streamers fluttering in the coastal wind!
      for (let s = 0; s < theme.streamers.length; s++) {
        ctx.strokeStyle = theme.streamers[s];
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(barGripX, barGripY + 1);
        const wave1 = Math.sin(time * 18 + s * 1.7) * 5;
        const wave2 = Math.cos(time * 15 + s * 2.1) * 7;
        ctx.quadraticCurveTo(barGripX - 14, barGripY + 4 + s * 2 + wave1, barGripX - 28, barGripY + 2 + s * 3 + wave2);
        ctx.stroke();
      }

      ctx.restore();
    }

    _drawPelicanLeg(ctx, hx, hy, px, py, color, isFront) {
      const l1 = 17.5;
      const l2 = 17.5;
      const { kx, ky } = solveTwoBoneIK(hx, hy, px, py, l1, l2);

      ctx.save();
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      // Outline
      ctx.strokeStyle = "#16263b";
      ctx.lineWidth = isFront ? 7.2 : 6.4;
      ctx.beginPath();
      ctx.moveTo(hx, hy);
      ctx.lineTo(kx, ky);
      ctx.lineTo(px, py);
      ctx.stroke();

      // Orange leg fill
      ctx.strokeStyle = color;
      ctx.lineWidth = isFront ? 3.8 : 3.2;
      ctx.beginPath();
      ctx.moveTo(hx, hy);
      ctx.lineTo(kx, ky);
      ctx.lineTo(px, py);
      ctx.stroke();

      // Big webbed foot on pedal!
      ctx.fillStyle = color;
      ctx.strokeStyle = "#16263b";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(px - 3, py - 2);
      ctx.lineTo(px + 12, py - 2);
      ctx.lineTo(px + 10, py + 4);
      ctx.lineTo(px - 4, py + 3);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Pedal platform
      ctx.fillStyle = "#1e293b";
      ctx.fillRect(px - 5, py + 2, 11, 3.5);
      ctx.restore();
    }

    _drawBikeWheel(ctx, wx, wy, r, angle, theme) {
      ctx.save();
      ctx.translate(wx, wy);

      // Spokes
      ctx.save();
      ctx.rotate(angle);
      ctx.strokeStyle = "rgba(226, 232, 240, 0.9)";
      ctx.lineWidth = 1.4;
      for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI) / 3;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * -(r - 4), Math.sin(a) * -(r - 4));
        ctx.lineTo(Math.cos(a) * (r - 4), Math.sin(a) * (r - 4));
        ctx.stroke();
      }
      ctx.restore();

      // Cream whitewall inner rim
      ctx.strokeStyle = "#fffaf0";
      ctx.lineWidth = 4.5;
      ctx.beginPath();
      ctx.arc(0, 0, r - 3.2, 0, Math.PI * 2);
      ctx.stroke();

      // Dark rubber tire tread
      ctx.strokeStyle = "#16263b";
      ctx.lineWidth = 4.2;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.stroke();

      // Painted cruiser fender over top half of wheel
      ctx.strokeStyle = "#16263b";
      ctx.lineWidth = 5.5;
      ctx.beginPath();
      ctx.arc(0, 0, r + 3.2, Math.PI * 1.08, Math.PI * 1.88);
      ctx.stroke();
      ctx.strokeStyle = theme.fender;
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.arc(0, 0, r + 3.2, Math.PI * 1.08, Math.PI * 1.88);
      ctx.stroke();

      // Hub
      ctx.fillStyle = theme.frame;
      ctx.beginPath();
      ctx.arc(0, 0, 3.6, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    _drawSpreadWing(ctx, sx, sy, openAmt, phase, isBack) {
      ctx.save();
      ctx.translate(sx, sy);
      const flapAngle = Math.sin(phase) * 0.55 - 0.25;
      ctx.rotate(isBack ? flapAngle - 0.25 : flapAngle);
      ctx.scale(openAmt, openAmt);

      // Pelican white wing with black flight tips!
      ctx.fillStyle = isBack ? "#e2e8f0" : "#fffdf7";
      ctx.strokeStyle = "#16263b";
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(-18, -28, -42, -24);
      ctx.lineTo(-34, -13);
      ctx.lineTo(-40, -7);
      ctx.lineTo(-28, -2);
      ctx.quadraticCurveTo(-14, 7, 2, 4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Iconic black primary wingtips
      ctx.fillStyle = "#1e293b";
      ctx.beginPath();
      ctx.moveTo(-28, -22);
      ctx.lineTo(-42, -24);
      ctx.lineTo(-34, -13);
      ctx.lineTo(-40, -7);
      ctx.lineTo(-26, -4);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    }

    _drawPelicanEye(ctx, ex, ey, state, p, time) {
      if (state.mode === "gameover") {
        // Comical X eye
        ctx.strokeStyle = "#16263b";
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(ex - 3, ey - 3);
        ctx.lineTo(ex + 3, ey + 3);
        ctx.moveTo(ex + 3, ey - 3);
        ctx.lineTo(ex - 3, ey + 3);
        ctx.stroke();
        return;
      }

      const blink = (time % 3.8) > 3.68;
      if (blink) {
        ctx.strokeStyle = "#16263b";
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(ex - 3.5, ey);
        ctx.lineTo(ex + 3.5, ey);
        ctx.stroke();
        return;
      }

      if (state.feverTimer > 0) {
        // Happy arched star-struck eye!
        ctx.strokeStyle = "#16263b";
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.arc(ex, ey + 1, 3.8, Math.PI, 0);
        ctx.stroke();
        return;
      }

      ctx.fillStyle = "#ffffff";
      ctx.strokeStyle = "#16263b";
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(ex, ey, 4.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#16263b";
      ctx.beginPath();
      ctx.arc(ex + 1, ey, 2.1, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(ex + 1.7, ey - 0.9, 0.8, 0, Math.PI * 2);
      ctx.fill();
    }

    _drawPelicanHat(ctx, hx, hy, theme) {
      ctx.save();
      ctx.translate(hx, hy);
      ctx.rotate(-0.14);
      ctx.strokeStyle = "#16263b";
      ctx.lineWidth = 2;

      if (theme.hatStyle === "sailor") {
        ctx.fillStyle = theme.hatMain;
        ctx.beginPath();
        ctx.moveTo(-8, 2);
        ctx.lineTo(-10, -6);
        ctx.quadraticCurveTo(0, -10, 10, -6);
        ctx.lineTo(8, 2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = theme.hatBand;
        ctx.fillRect(-8, -1, 16, 3.2);
      } else if (theme.hatStyle === "captain") {
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.ellipse(0, -4, 10, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = theme.hatMain;
        ctx.fillRect(-7, -3, 14, 4);
        // Visor
        ctx.beginPath();
        ctx.moveTo(2, 0);
        ctx.lineTo(13, 2);
        ctx.lineTo(5, 3);
        ctx.closePath();
        ctx.fill();
      } else if (theme.hatStyle === "aviator") {
        ctx.fillStyle = theme.hatMain;
        ctx.beginPath();
        ctx.arc(0, 1, 9.5, Math.PI, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        // Goggles on forehead
        ctx.fillStyle = theme.hatBand;
        ctx.beginPath();
        ctx.arc(4, -2, 3.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      } else {
        // Beret + pom-pom
        ctx.fillStyle = theme.hatMain;
        ctx.beginPath();
        ctx.ellipse(-1, -3, 10.5, 5, -0.15, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = theme.hatBand;
        ctx.beginPath();
        ctx.arc(-2, -9, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }

    // ==================== PARTICLES, POPUPS & FEVER OVERLAY ====================
    _drawParticles(ctx, pool, worldX) {
      const gy = this.groundY;
      for (let i = 0; i < pool.length; i++) {
        const pt = pool[i];
        if (!pt.active) continue;
        const sx = pt.worldSpace ? pt.x - worldX : pt.x;
        const sy = gy - pt.h;
        if (sx < -40 || sx > this.viewW + 40) continue;

        const lifeRatio = clamp(pt.life / pt.maxLife, 0, 1);
        ctx.save();
        ctx.globalAlpha = lifeRatio;
        ctx.translate(sx, sy);

        if (pt.kind === "ring") {
          const r = pt.size * (1 + (1 - lifeRatio) * 2.4);
          ctx.strokeStyle = pt.color;
          ctx.lineWidth = 3 * lifeRatio;
          ctx.beginPath();
          ctx.arc(0, 0, r, 0, Math.PI * 2);
          ctx.stroke();
        } else if (pt.kind === "feather") {
          ctx.rotate(pt.rot);
          ctx.fillStyle = pt.color;
          ctx.strokeStyle = "#16263b";
          ctx.lineWidth = 1.3;
          ctx.beginPath();
          ctx.ellipse(0, 0, pt.size, pt.size * 0.42, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        } else if (pt.kind === "splinter") {
          ctx.rotate(pt.rot);
          ctx.fillStyle = pt.color;
          ctx.strokeStyle = "#16263b";
          ctx.lineWidth = 1.4;
          ctx.fillRect(-pt.size, -pt.size * 0.3, pt.size * 2, pt.size * 0.6);
          ctx.strokeRect(-pt.size, -pt.size * 0.3, pt.size * 2, pt.size * 0.6);
        } else if (pt.kind === "spark") {
          ctx.rotate(pt.rot);
          ctx.fillStyle = pt.color;
          ctx.fillRect(-pt.size * 1.4, -pt.size * 0.35, pt.size * 2.8, pt.size * 0.7);
        } else {
          // Dust / water droplet / confetti circle
          ctx.fillStyle = pt.color;
          ctx.beginPath();
          ctx.arc(0, 0, pt.size * (0.4 + lifeRatio * 0.6), 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }
    }

    _drawPopups(ctx, popups) {
      const gy = this.groundY;
      ctx.save();
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      for (let i = 0; i < popups.length; i++) {
        const pop = popups[i];
        if (!pop.active) continue;
        const sx = clamp(pop.screenX, 96, this.viewW - 96);
        const sy = gy - pop.h;
        const t = 1 - pop.life / pop.maxLife;
        const scale = t < 0.16 ? 0.55 + (t / 0.16) * 0.6 : 1.15 - (t - 0.16) * 0.18;
        const alpha = t > 0.68 ? (1 - t) / 0.32 : 1;

        ctx.save();
        ctx.globalAlpha = clamp(alpha, 0, 1);
        ctx.translate(sx, sy);
        ctx.scale(scale, scale);

        ctx.font = `900 ${pop.big ? 20 : 15.5}px "Avenir Next Rounded", "Trebuchet MS", system-ui, sans-serif`;
        ctx.lineWidth = 4.5;
        ctx.strokeStyle = "#16263b";
        ctx.strokeText(pop.text, 0, 0);
        ctx.fillStyle = pop.color;
        ctx.fillText(pop.text, 0, 0);
        ctx.restore();
      }
      ctx.restore();
    }

    _drawFeverOverlay(ctx, feverTimer, time) {
      const fade = clamp(feverTimer / 0.6, 0, 1);
      ctx.save();
      // Crisp anime speed lines along top & bottom edges
      ctx.strokeStyle = `rgba(255, 240, 150, ${0.32 * fade})`;
      ctx.lineWidth = 2.5;
      for (let i = 0; i < 10; i++) {
        const y = ((i * 59 + time * 180) % this.viewH);
        const len = 70 + (i % 3) * 45;
        const x = this.viewW - ((time * 950 + i * 173) % (this.viewW + 200));
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + len, y);
        ctx.stroke();
      }
      ctx.restore();
    }

    _drawWorldTutorialHint(ctx, state) {
      const alpha = clamp(state.tutorialTimer / 1.0, 0, 0.92);
      ctx.save();
      ctx.globalAlpha = alpha;
      const cx = this.viewW * 0.5;
      const isPortrait = this.viewH > 680;
      const cy = isPortrait ? this.groundY - 255 : 88;
      const text = state.isTouch
        ? "TAP RIGHT: Jump / Flap  •  LEFT or SWIPE ↓: Tuck / Dive"
        : "SPACE / ↑ : Jump, Flap & Glide   •   S / ↓ : Aero-Tuck & Dive-Slam!";

      ctx.font = `800 ${isPortrait ? 13 : 13.5}px "Avenir Next Rounded", system-ui, sans-serif`;
      const tw = ctx.measureText(text).width + 26;
      ctx.fillStyle = "rgba(22, 38, 59, 0.74)";
      ctx.beginPath();
      ctx.roundRect(cx - tw * 0.5, cy - 16, tw, 32, 16);
      ctx.fill();

      ctx.fillStyle = "#fffaf0";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(text, cx, cy);
      ctx.restore();
    }
  }

  window.PelicanRenderer = PelicanRenderer;
})();
