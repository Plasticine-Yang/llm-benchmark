(function (global) {
  'use strict';

  const PelicanGame = (global.PelicanGame = global.PelicanGame || {});
  const CFG = PelicanGame.CONFIG;

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function lerpColor(c1, c2, t) {
    const r = Math.round(lerp(c1[0], c2[0], t));
    const g = Math.round(lerp(c1[1], c2[1], t));
    const b = Math.round(lerp(c1[2], c2[2], t));
    return 'rgb(' + r + ',' + g + ',' + b + ')';
  }

  class WorldManager {
    constructor() {
      this.scrollX = 0;
      this.nextSpawnX = 0;
      this.openingStep = 0;
      this.lastPattern = -1;

      this.gaps = [];
      this.ramps = [];
      this.collectibles = [];
      this.entities = [];

      // Pre-seeded ambient background props
      this.clouds = [];
      this.sailboats = [];
      this.stars = [];
      this._initBackdrop();
    }

    _initBackdrop() {
      this.clouds = [];
      for (let i = 0; i < 8; i += 1) {
        this.clouds.push({
          x: i * 240 + Math.random() * 120,
          y: 44 + Math.random() * 125,
          scale: 0.7 + Math.random() * 0.7,
          speed: 14 + Math.random() * 14
        });
      }

      this.sailboats = [];
      for (let i = 0; i < 4; i += 1) {
        this.sailboats.push({
          x: i * 420 + 180,
          scale: 0.75 + Math.random() * 0.45,
          hullColor: i % 2 === 0 ? '#ff6b4a' : '#2ec4b6',
          sailColor: i % 2 === 0 ? '#fff9ef' : '#ffe4a8',
          bobPhase: Math.random() * Math.PI * 2
        });
      }

      this.stars = [];
      for (let i = 0; i < 36; i += 1) {
        this.stars.push({
          x: Math.random() * 1400,
          y: 16 + Math.random() * 210,
          r: 0.9 + Math.random() * 1.6,
          phase: Math.random() * Math.PI * 2
        });
      }
    }

    reset() {
      this.scrollX = 0;
      this.nextSpawnX = 480;
      this.openingStep = 0;
      this.lastPattern = -1;
      this.gaps.length = 0;
      this.ramps.length = 0;
      this.collectibles.length = 0;
      this.entities.length = 0;
    }

    getTheme(distanceMeters) {
      const phases = CFG.SKY_PHASES;
      const cycleMeters = 180;
      const pos = (distanceMeters / cycleMeters) % phases.length;
      const i0 = Math.floor(pos) % phases.length;
      const i1 = (i0 + 1) % phases.length;
      const t = pos - Math.floor(pos);
      const smooth = t * t * (3 - 2 * t);
      const p0 = phases[i0];
      const p1 = phases[i1];

      return {
        skyTop: lerpColor(p0.skyTop, p1.skyTop, smooth),
        skyBottom: lerpColor(p0.skyBottom, p1.skyBottom, smooth),
        sunColor: lerpColor(p0.sunColor, p1.sunColor, smooth),
        sunY: lerp(p0.sunY, p1.sunY, smooth),
        oceanTop: lerpColor(p0.oceanTop, p1.oceanTop, smooth),
        oceanBottom: lerpColor(p0.oceanBottom, p1.oceanBottom, smooth),
        cloudAlpha: lerp(p0.cloudAlpha, p1.cloudAlpha, smooth),
        starsAlpha: lerp(p0.starsAlpha, p1.starsAlpha, smooth),
        lanternGlow: lerp(p0.starsAlpha, p1.starsAlpha, smooth)
      };
    }

    update(dt, worldDx, viewWorldWidth, missingHearts) {
      this.scrollX += worldDx;

      // Scroll clouds gently
      for (let i = 0; i < this.clouds.length; i += 1) {
        const c = this.clouds[i];
        c.x -= c.speed * dt + worldDx * 0.06;
        if (c.x < -180) {
          c.x = Math.max(viewWorldWidth + 140, 1250) + Math.random() * 140;
          c.y = 42 + Math.random() * 125;
        }
      }

      // Spawn ahead of camera right edge
      const spawnHorizon = this.scrollX + viewWorldWidth + 680;
      while (this.nextSpawnX < spawnHorizon) {
        this._spawnNextChunk(missingHearts);
      }

      // Update dynamic entities (gulls, crabs, smashed items)
      for (let i = 0; i < this.entities.length; i += 1) {
        const e = this.entities[i];
        e.animTime = (e.animTime || 0) + dt;

        if (e.smashed) {
          e.x += e.vx * dt;
          e.y += e.vy * dt;
          e.vy += 1500 * dt;
          e.rot = (e.rot || 0) + e.vrot * dt;
          continue;
        }

        if (e.type === 'gull') {
          e.x -= e.flySpeed * dt;
          e.y = e.baseY + Math.sin(e.animTime * 4.5 + e.phase) * 9;
        } else if (e.type === 'crab') {
          e.x = e.anchorX + Math.sin(e.animTime * 2.6 + e.phase) * e.patrolRange;
        } else if (e.type === 'surfboard') {
          e.y = e.baseY + Math.sin(e.animTime * 3.4) * 5;
        }

        if (e.squash > 0) {
          e.squash = Math.max(0, e.squash - dt * 4.5);
        }
      }

      // Prune entities behind camera
      const pruneX = this.scrollX - 280;
      this.gaps = this.gaps.filter((g) => g.x + g.w > pruneX);
      this.ramps = this.ramps.filter((r) => r.x + r.w > pruneX);
      this.collectibles = this.collectibles.filter((c) => !c.collected && c.x > pruneX);
      this.entities = this.entities.filter((e) => e.x + (e.w || 60) > pruneX && e.y < CFG.GROUND_Y + 420);
    }

    _spawnFishArc(startX, count, spacing, baseY, arcHeight, goldIndices) {
      for (let i = 0; i < count; i += 1) {
        const t = count > 1 ? i / (count - 1) : 0.5;
        const arc = Math.sin(t * Math.PI) * arcHeight;
        const isGold = goldIndices && goldIndices.indexOf(i) !== -1;
        this.collectibles.push({
          type: isGold ? 'snapper' : 'sardine',
          x: startX + i * spacing,
          y: baseY - arc,
          r: isGold ? 16 : 13,
          phase: i * 0.65,
          collected: false
        });
      }
    }

    _maybeSpawnHeart(x, y, missingHearts) {
      if (missingHearts > 0 && Math.random() < 0.24) {
        this.collectibles.push({
          type: 'heart',
          x,
          y,
          r: 17,
          phase: Math.random() * 4,
          collected: false
        });
      }
    }

    _spawnNextChunk(missingHearts) {
      const x = this.nextSpawnX;
      const gY = CFG.GROUND_Y;
      const distM = x / CFG.PIXELS_PER_METER;
      const diff = Math.min(1, distM / 550);

      // Scripted joyful first 10 seconds!
      if (this.openingStep === 0) {
        // 1) Immediate welcoming sardine wave
        this._spawnFishArc(x, 5, 58, gY - 38, 34, [4]);
        this.nextSpawnX = x + 390;
        this.openingStep = 1;
        return;
      }
      if (this.openingStep === 1) {
        // 2) Boost pad -> Ramp -> Sky fish arc!
        this.entities.push({ type: 'boost_pad', x, y: gY - 6, w: 68, h: 12 });
        this.ramps.push({ x: x + 150, w: 120, h: 46 });
        this._spawnFishArc(x + 290, 5, 62, gY - 115, 75, [2, 4]);
        this.nextSpawnX = x + 680;
        this.openingStep = 2;
        return;
      }
      if (this.openingStep === 2) {
        // 3) Bouncy striped beach umbrella + golden sky line
        this.entities.push({ type: 'umbrella', x: x + 40, y: gY - 46, w: 72, h: 46, squash: 0 });
        this._spawnFishArc(x + 125, 4, 62, gY - 145, 55, [1, 3]);
        this.nextSpawnX = x + 470;
        this.openingStep = 3;
        return;
      }
      if (this.openingStep === 3) {
        // 4) First scuttling sand crab with guiding jump arc
        this.entities.push({
          type: 'crab',
          x: x + 70,
          anchorX: x + 70,
          y: gY - 26,
          w: 44,
          h: 28,
          patrolRange: 22,
          phase: 0.4
        });
        this._spawnFishArc(x + 12, 3, 58, gY - 95, 38, [1]);
        this.nextSpawnX = x + 380;
        this.openingStep = 4;
        return;
      }
      if (this.openingStep === 4) {
        // 5) First gentle pier bay gap with ramp lip + fish bridge
        this.ramps.push({ x, w: 92, h: 30 });
        this.gaps.push({ x: x + 92, w: 150 });
        this._spawnFishArc(x + 108, 4, 52, gY - 92, 46, [2]);
        this.nextSpawnX = x + 420;
        this.openingStep = 5;
        return;
      }
      if (this.openingStep === 5) {
        // 6) First swooping seagull with low ducking fish reward
        this._spawnFishArc(x + 40, 4, 54, gY - 26, 0, [3]);
        this.entities.push({
          type: 'gull',
          x: x + 360,
          y: gY - 76,
          baseY: gY - 76,
          w: 52,
          h: 30,
          flySpeed: 135,
          phase: 0.2
        });
        this.nextSpawnX = x + 520;
        this.openingStep = 6;
        return;
      }

      // Pick varied patterns cleanly without repeating the same pattern back-to-back
      let pattern = Math.floor(Math.random() * 8);
      if (pattern === this.lastPattern) {
        pattern = (pattern + 1 + Math.floor(Math.random() * 3)) % 8;
      }
      this.lastPattern = pattern;

      const pad = lerp(195, 130, diff);

      switch (pattern) {
        case 0: {
          // Sardine Wave + Boost Straightaway
          this.entities.push({ type: 'boost_pad', x: x + 20, y: gY - 6, w: 70, h: 12 });
          this._spawnFishArc(x + 115, 6, 56, gY - 40, 45, [5]);
          this.nextSpawnX = x + 480 + pad;
          break;
        }
        case 1: {
          // Boardwalk Ramp + High Golden Ring + Optional Crate below
          this.ramps.push({ x, w: 125, h: 48 });
          this._spawnFishArc(x + 150, 5, 64, gY - 125, 80, [2, 4]);
          if (diff > 0.15) {
            this.entities.push({ type: 'crate', x: x + 230, y: gY - 46, w: 48, h: 46 });
          }
          this._maybeSpawnHeart(x + 280, gY - 210, missingHearts);
          this.nextSpawnX = x + 520 + pad;
          break;
        }
        case 2: {
          // Crab Rhythm Alley (2 spaced crabs with jump fish arcs)
          this.entities.push({
            type: 'crab',
            x: x + 40,
            anchorX: x + 40,
            y: gY - 26,
            w: 44,
            h: 28,
            patrolRange: 26,
            phase: Math.random() * 3
          });
          this._spawnFishArc(x - 10, 3, 54, gY - 96, 36, [1]);

          const secondOffset = lerp(310, 260, diff);
          this.entities.push({
            type: 'crab',
            x: x + secondOffset,
            anchorX: x + secondOffset,
            y: gY - 26,
            w: 44,
            h: 28,
            patrolRange: 28,
            phase: Math.random() * 3
          });
          this._spawnFishArc(x + secondOffset - 45, 3, 54, gY - 96, 36, [2]);
          this.nextSpawnX = x + secondOffset + 190 + pad;
          break;
        }
        case 3: {
          // Umbrella Bounce Park over Crates
          this.entities.push({ type: 'umbrella', x: x + 30, y: gY - 46, w: 74, h: 46, squash: 0 });
          this.entities.push({ type: 'crate', x: x + 190, y: gY - 46, w: 48, h: 46 });
          if (diff > 0.35) {
            this.entities.push({ type: 'crate', x: x + 240, y: gY - 46, w: 48, h: 46 });
          }
          this._spawnFishArc(x + 115, 5, 58, gY - 150, 60, [2, 4]);
          this._maybeSpawnHeart(x + 235, gY - 220, missingHearts);
          this.nextSpawnX = x + 450 + pad;
          break;
        }
        case 4: {
          // Pier Bay Jump (or wide bay with mid-bay surfboard!)
          if (diff > 0.28 && Math.random() < 0.65) {
            // Wide bay with bouncy floating surfboard
            this.ramps.push({ x, w: 88, h: 32 });
            this.gaps.push({ x: x + 88, w: 350 });
            this.entities.push({
              type: 'surfboard',
              x: x + 215,
              y: gY + 12,
              baseY: gY + 12,
              w: 92,
              h: 22,
              squash: 0
            });
            this._spawnFishArc(x + 135, 5, 56, gY - 108, 52, [2, 4]);
            this.nextSpawnX = x + 520 + pad;
          } else {
            const gapW = lerp(155, 225, diff);
            this.ramps.push({ x, w: 94, h: 34 });
            this.gaps.push({ x: x + 94, w: gapW });
            this._spawnFishArc(x + 104, 4, Math.max(46, gapW / 4), gY - 96, 48, [2]);
            this.nextSpawnX = x + 150 + gapW + pad;
          }
          break;
        }
        case 5: {
          // Seagull Swoop Lane (reward low duck OR gull-stomp high fish!)
          this._spawnFishArc(x + 20, 4, 52, gY - 26, 0, [3]);
          this._spawnFishArc(x + 90, 3, 56, gY - 155, 28, [1]);
          this.entities.push({
            type: 'gull',
            x: x + 370,
            y: gY - 76,
            baseY: gY - 76,
            w: 52,
            h: 30,
            flySpeed: lerp(145, 225, diff),
            phase: Math.random() * 4
          });
          this.nextSpawnX = x + 470 + pad;
          break;
        }
        case 6: {
          // Crate Smasher Alley (umbrella or ramp setting up Dive-Slam on crates!)
          this.entities.push({ type: 'crate', x: x + 80, y: gY - 46, w: 48, h: 46 });
          this._spawnFishArc(x + 35, 3, 52, gY - 110, 34, [1]);
          this.entities.push({ type: 'umbrella', x: x + 230, y: gY - 46, w: 72, h: 46, squash: 0 });
          this._spawnFishArc(x + 320, 4, 58, gY - 145, 50, [2, 3]);
          this.nextSpawnX = x + 540 + pad;
          break;
        }
        default: {
          // Double Ramp Pier Festival
          this.ramps.push({ x, w: 112, h: 42 });
          this._spawnFishArc(x + 130, 4, 58, gY - 115, 55, [2]);
          this.entities.push({ type: 'boost_pad', x: x + 360, y: gY - 6, w: 68, h: 12 });
          this.ramps.push({ x: x + 460, w: 120, h: 48 });
          this._spawnFishArc(x + 605, 5, 62, gY - 135, 70, [2, 4]);
          this.nextSpawnX = x + 890 + pad;
          break;
        }
      }
    }

    getSurfaceAt(worldX) {
      const gY = CFG.GROUND_Y;

      // Check ramps first (ramps sit on solid deck)
      for (let i = 0; i < this.ramps.length; i += 1) {
        const r = this.ramps[i];
        if (worldX >= r.x && worldX <= r.x + r.w) {
          const t = (worldX - r.x) / r.w;
          return {
            solid: true,
            y: gY - r.h * Math.pow(t, 1.15),
            onRamp: true,
            rampProgress: t,
            slope: -(r.h * 1.15 * Math.pow(Math.max(0.05, t), 0.15)) / r.w
          };
        }
      }

      // Check pier gaps
      for (let i = 0; i < this.gaps.length; i += 1) {
        const gap = this.gaps[i];
        if (worldX > gap.x + 10 && worldX < gap.x + gap.w - 10) {
          return { solid: false, y: gY + 300, onRamp: false, slope: 0 };
        }
      }

      return { solid: true, y: gY, onRamp: false, slope: 0 };
    }

    drawBackdrop(ctx, viewWidth, viewHeight, camY, theme, time) {
      // Sky gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, viewHeight);
      skyGrad.addColorStop(0, theme.skyTop);
      skyGrad.addColorStop(0.75, theme.skyBottom);
      skyGrad.addColorStop(1, theme.oceanTop);
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, viewWidth, viewHeight);

      // Stars at twilight
      if (theme.starsAlpha > 0.03) {
        ctx.save();
        for (let i = 0; i < this.stars.length; i += 1) {
          const s = this.stars[i];
          const sx = ((s.x - this.scrollX * 0.02) % viewWidth + viewWidth) % viewWidth;
          const twinkle = 0.55 + 0.45 * Math.sin(time * 3.2 + s.phase);
          ctx.globalAlpha = theme.starsAlpha * twinkle;
          ctx.fillStyle = '#fff9de';
          ctx.beginPath();
          ctx.arc(sx, s.y, s.r, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      // Sun / Moon orb
      const sunX = viewWidth * 0.76;
      const sunY = theme.sunY - camY * 0.15;
      ctx.save();
      ctx.globalAlpha = 0.22;
      ctx.fillStyle = theme.sunColor;
      ctx.beginPath();
      ctx.arc(sunX, sunY, 64, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 0.95;
      ctx.beginPath();
      ctx.arc(sunX, sunY, 38, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Fluffy coastal clouds
      ctx.save();
      ctx.globalAlpha = theme.cloudAlpha;
      ctx.fillStyle = '#fffaf0';
      for (let i = 0; i < this.clouds.length; i += 1) {
        const c = this.clouds[i];
        if (c.x > viewWidth + 160 || c.x < -180) continue;
        this._drawCloud(ctx, c.x, c.y - camY * 0.15, c.scale);
      }
      ctx.restore();

      // Distant coastal headland silhouette
      const horizonY = CFG.GROUND_Y - 56 - camY;
      ctx.save();
      ctx.fillStyle = 'rgba(34, 84, 114, 0.28)';
      ctx.beginPath();
      ctx.moveTo(0, horizonY + 50);
      const hillSpan = 440;
      const hillOffset = -(this.scrollX * 0.08) % hillSpan;
      for (let x = hillOffset - hillSpan; x <= viewWidth + hillSpan; x += hillSpan) {
        ctx.quadraticCurveTo(x + hillSpan * 0.28, horizonY - 24, x + hillSpan * 0.55, horizonY + 8);
        ctx.quadraticCurveTo(x + hillSpan * 0.8, horizonY + 26, x + hillSpan, horizonY + 12);
      }
      ctx.lineTo(viewWidth, horizonY + 120);
      ctx.lineTo(0, horizonY + 120);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // Ocean base behind pier
      const waterTopY = CFG.GROUND_Y + 24 - camY;
      const waterGrad = ctx.createLinearGradient(0, waterTopY, 0, viewHeight);
      waterGrad.addColorStop(0, theme.oceanTop);
      waterGrad.addColorStop(1, theme.oceanBottom);
      ctx.fillStyle = waterGrad;
      ctx.fillRect(0, waterTopY - 24, viewWidth, viewHeight - waterTopY + 40);

      // Sun shimmer on ocean
      ctx.save();
      ctx.fillStyle = 'rgba(255, 240, 180, 0.16)';
      for (let row = 0; row < 5; row += 1) {
        const ry = waterTopY + row * 18;
        const rw = 64 - row * 7 + Math.sin(time * 3 + row) * 12;
        ctx.beginPath();
        ctx.ellipse(sunX + Math.sin(time * 2 + row) * 8, ry, rw, 4, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // Parallax sailboats on the horizon
      for (let i = 0; i < this.sailboats.length; i += 1) {
        const b = this.sailboats[i];
        const wrapW = Math.max(1500, viewWidth + 400);
        const bx = (((b.x - this.scrollX * 0.14) % wrapW) + wrapW) % wrapW - 100;
        const by = waterTopY - 12 + Math.sin(time * 2.1 + b.bobPhase) * 2.5;
        this._drawSailboat(ctx, bx, by, b.scale, b.hullColor, b.sailColor);
      }

      // Rolling background wave ribbon
      ctx.save();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.beginPath();
      ctx.moveTo(0, waterTopY + 30);
      for (let x = 0; x <= viewWidth + 30; x += 28) {
        const wy = waterTopY - 6 + Math.sin((x + this.scrollX * 0.25) * 0.03 + time * 2.6) * 4;
        ctx.lineTo(x, wy);
      }
      ctx.lineTo(viewWidth, waterTopY + 30);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    drawBoardwalk(ctx, viewLeft, viewWidth, theme, time) {
      const gY = CFG.GROUND_Y;
      const viewRight = viewLeft + viewWidth;

      // Build solid boardwalk segments between gaps
      const segments = [];
      let cursor = viewLeft - 40;
      const sortedGaps = this.gaps.slice().sort((a, b) => a.x - b.x);
      for (let i = 0; i < sortedGaps.length; i += 1) {
        const gap = sortedGaps[i];
        if (gap.x + gap.w < viewLeft - 40) continue;
        if (gap.x > viewRight + 40) break;
        if (gap.x > cursor) {
          segments.push({ x1: cursor, x2: Math.min(gap.x, viewRight + 60) });
        }
        cursor = Math.max(cursor, gap.x + gap.w);
      }
      if (cursor < viewRight + 60) {
        segments.push({ x1: cursor, x2: viewRight + 60 });
      }

      // Draw wooden pilings & pier railing posts along boardwalk
      const postStep = 140;
      const firstPost = Math.floor((viewLeft - 60) / postStep) * postStep;
      for (let px = firstPost; px <= viewRight + 60; px += postStep) {
        const inGap = this.gaps.some((g) => px > g.x - 10 && px < g.x + g.w + 10);
        if (inGap) continue;

        // Under-pier piling into ocean
        ctx.fillStyle = '#5a3a22';
        ctx.fillRect(px - 8, gY + 18, 16, 720);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.fillRect(px - 6, gY + 18, 4, 720);

        // Background railing bollard
        ctx.fillStyle = '#8b5732';
        ctx.fillRect(px - 6, gY - 40, 12, 42);
        ctx.fillStyle = '#d49a6a';
        ctx.fillRect(px - 8, gY - 44, 16, 6);

        // Lantern on every 2nd post
        if (Math.abs(Math.round(px / postStep)) % 2 === 0) {
          if (theme.lanternGlow > 0.08) {
            ctx.save();
            ctx.globalAlpha = theme.lanternGlow * 0.42;
            ctx.fillStyle = '#ffd166';
            ctx.beginPath();
            ctx.arc(px, gY - 52, 26, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }
          ctx.fillStyle = theme.lanternGlow > 0.2 ? '#ffe082' : '#fff4d4';
          ctx.beginPath();
          ctx.arc(px, gY - 51, 5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Draw each solid boardwalk span
      for (let s = 0; s < segments.length; s += 1) {
        const seg = segments[s];
        const w = seg.x2 - seg.x1;
        if (w <= 0) continue;

        // Under-beam shadow
        ctx.fillStyle = '#623a1e';
        ctx.fillRect(seg.x1, gY + 10, w, 16);

        // Top sunlit plank surface
        ctx.fillStyle = '#d79658';
        ctx.fillRect(seg.x1, gY - 2, w, 14);

        // Crisp top rim highlight
        ctx.fillStyle = '#f3be83';
        ctx.fillRect(seg.x1, gY - 2, w, 4);

        // Painted coastal teal bike-lane stripe
        ctx.fillStyle = '#2ec4b6';
        ctx.fillRect(seg.x1, gY + 4, w, 3);

        // Plank divider seams
        ctx.fillStyle = 'rgba(84, 46, 20, 0.35)';
        const seamStart = Math.floor(seg.x1 / 34) * 34;
        for (let sx = seamStart; sx <= seg.x2; sx += 34) {
          if (sx >= seg.x1 && sx <= seg.x2 - 2) {
            ctx.fillRect(sx, gY - 2, 2, 14);
          }
        }
      }

      // Draw wooden launch ramps
      for (let i = 0; i < this.ramps.length; i += 1) {
        const r = this.ramps[i];
        if (r.x + r.w < viewLeft - 40 || r.x > viewRight + 40) continue;
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(r.x, gY);
        ctx.quadraticCurveTo(r.x + r.w * 0.55, gY - r.h * 0.28, r.x + r.w, gY - r.h);
        ctx.lineTo(r.x + r.w, gY + 2);
        ctx.closePath();
        ctx.fillStyle = '#c87a3d';
        ctx.fill();

        // Bright ramp deck edge & chevron stripes
        ctx.strokeStyle = '#ffd166';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(r.x + 2, gY - 1);
        ctx.quadraticCurveTo(r.x + r.w * 0.55, gY - r.h * 0.28 - 1, r.x + r.w, gY - r.h - 1);
        ctx.stroke();
        ctx.restore();
      }

      // Draw collectibles
      for (let i = 0; i < this.collectibles.length; i += 1) {
        const c = this.collectibles[i];
        if (c.collected || c.x < viewLeft - 40 || c.x > viewRight + 40) continue;
        const bobY = c.y + Math.sin(time * 5 + c.phase) * 4;
        if (c.type === 'heart') {
          this._drawHeartPickup(ctx, c.x, bobY, time + c.phase);
        } else {
          this._drawFish(ctx, c.x, bobY, c.type === 'snapper', time + c.phase);
        }
      }

      // Draw entities (boost pads, umbrellas, surfboards, crabs, crates, gulls)
      for (let i = 0; i < this.entities.length; i += 1) {
        const e = this.entities[i];
        if (e.x + 100 < viewLeft || e.x - 100 > viewRight) continue;
        ctx.save();
        if (e.smashed) {
          ctx.translate(e.x + e.w * 0.5, e.y + e.h * 0.5);
          ctx.rotate(e.rot || 0);
          ctx.translate(-(e.x + e.w * 0.5), -(e.y + e.h * 0.5));
        }
        switch (e.type) {
          case 'boost_pad':
            this._drawBoostPad(ctx, e, time);
            break;
          case 'umbrella':
            this._drawUmbrella(ctx, e);
            break;
          case 'surfboard':
            this._drawSurfboard(ctx, e);
            break;
          case 'crab':
            this._drawCrab(ctx, e, time);
            break;
          case 'crate':
            this._drawCrate(ctx, e);
            break;
          case 'gull':
            this._drawSeagull(ctx, e, time);
            break;
        }
        ctx.restore();
      }

      // Foreground gentle water wave strip along bottom edge of pier
      ctx.save();
      ctx.fillStyle = 'rgba(22, 146, 174, 0.48)';
      ctx.beginPath();
      const fgWaveY = gY + 62;
      ctx.moveTo(viewLeft - 20, gY + 900);
      for (let x = viewLeft - 20; x <= viewRight + 30; x += 26) {
        const wy = fgWaveY + Math.sin(x * 0.038 + time * 4.2) * 5;
        ctx.lineTo(x, wy);
      }
      ctx.lineTo(viewRight + 30, gY + 900);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    drawGullWarnings(ctx, viewLeft, viewWidth, camY) {
      const rightEdge = viewLeft + viewWidth;
      for (let i = 0; i < this.entities.length; i += 1) {
        const e = this.entities[i];
        if (e.type !== 'gull' || e.smashed) continue;
        const ahead = e.x - rightEdge;
        if (ahead > 0 && ahead < 440) {
          const screenX = viewWidth - 36;
          const screenY = e.y - camY + 12;
          const pulse = 0.88 + 0.14 * Math.sin(ahead * 0.06);
          ctx.save();
          ctx.translate(screenX, screenY);
          ctx.scale(pulse, pulse);
          ctx.fillStyle = '#ff6b4a';
          ctx.strokeStyle = '#fff9ef';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(0, 0, 15, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = '#fff';
          ctx.font = '900 15px "Fredoka", sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('!', 0, 1);
          ctx.restore();
        }
      }
    }

    _drawCloud(ctx, x, y, s) {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(s, s);
      ctx.beginPath();
      ctx.arc(0, 0, 22, 0, Math.PI * 2);
      ctx.arc(24, -8, 28, 0, Math.PI * 2);
      ctx.arc(54, -2, 22, 0, Math.PI * 2);
      ctx.arc(26, 8, 24, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    _drawSailboat(ctx, x, y, s, hullColor, sailColor) {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(s, s);
      // Sail
      ctx.fillStyle = sailColor;
      ctx.beginPath();
      ctx.moveTo(0, -34);
      ctx.lineTo(18, -5);
      ctx.lineTo(-2, -5);
      ctx.closePath();
      ctx.fill();
      // Mast
      ctx.fillStyle = '#7b4f2c';
      ctx.fillRect(-2, -36, 2.5, 34);
      // Hull
      ctx.fillStyle = hullColor;
      ctx.beginPath();
      ctx.moveTo(-16, -2);
      ctx.lineTo(18, -2);
      ctx.lineTo(12, 8);
      ctx.lineTo(-11, 8);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    _drawFish(ctx, x, y, isGold, t) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(Math.sin(t * 1.4) * 0.14);

      // Soft sparkle halo
      ctx.fillStyle = isGold ? 'rgba(255, 214, 70, 0.28)' : 'rgba(168, 244, 255, 0.24)';
      ctx.beginPath();
      ctx.arc(0, 0, isGold ? 18 : 15, 0, Math.PI * 2);
      ctx.fill();

      // Tail fin
      ctx.fillStyle = isGold ? '#ff9f1c' : '#2ec4b6';
      ctx.beginPath();
      ctx.moveTo(8, 0);
      ctx.lineTo(16, -7);
      ctx.lineTo(16, 7);
      ctx.closePath();
      ctx.fill();

      // Body
      ctx.fillStyle = isGold ? '#ffd166' : '#a8e6f5';
      ctx.beginPath();
      ctx.ellipse(-1, 0, 11, 6.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = isGold ? '#b56700' : '#13536d';
      ctx.lineWidth = 1.6;
      ctx.stroke();

      // Belly sheen
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(-2, -2, 6, 2, 0, 0, Math.PI * 2);
      ctx.fill();

      // Eye
      ctx.fillStyle = '#13293d';
      ctx.beginPath();
      ctx.arc(-6, -1, 1.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    _drawHeartPickup(ctx, x, y, t) {
      const pulse = 1 + Math.sin(t * 2.5) * 0.08;
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(pulse, pulse);
      ctx.fillStyle = 'rgba(255, 107, 129, 0.28)';
      ctx.beginPath();
      ctx.arc(0, 0, 20, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ff5470';
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 8);
      ctx.bezierCurveTo(-13, -1, -13, -11, -5, -11);
      ctx.bezierCurveTo(-1, -11, 0, -7, 0, -6);
      ctx.bezierCurveTo(0, -7, 1, -11, 5, -11);
      ctx.bezierCurveTo(13, -11, 13, -1, 0, 8);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    _drawBoostPad(ctx, e, time) {
      ctx.save();
      ctx.translate(e.x, e.y);
      ctx.fillStyle = '#13293d';
      ctx.beginPath();
      ctx.roundRect(0, 0, e.w, e.h, 5);
      ctx.fill();

      const shift = (time * 38) % 16;
      ctx.strokeStyle = '#2ec4b6';
      ctx.lineWidth = 3;
      for (let cx = 10 + shift * 0.4; cx < e.w - 8; cx += 16) {
        ctx.beginPath();
        ctx.moveTo(cx - 5, 2);
        ctx.lineTo(cx + 2, e.h * 0.5);
        ctx.lineTo(cx - 5, e.h - 2);
        ctx.stroke();
      }
      ctx.restore();
    }

    _drawUmbrella(ctx, e) {
      const sq = e.squash || 0;
      const sx = 1 + sq * 0.28;
      const sy = 1 - sq * 0.28;
      const cx = e.x + e.w * 0.5;
      const by = e.y + e.h;

      ctx.save();
      ctx.translate(cx, by);
      ctx.scale(sx, sy);

      // Pole
      ctx.fillStyle = '#e7dcc8';
      ctx.fillRect(-3, -e.h + 10, 6, e.h - 10);

      // Canopy stripes
      ctx.beginPath();
      ctx.arc(0, -e.h + 24, e.w * 0.5, Math.PI, 0);
      ctx.closePath();
      ctx.fillStyle = '#fff9ef';
      ctx.fill();
      ctx.strokeStyle = '#13293d';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Coral wedges
      ctx.fillStyle = '#ff6b4a';
      ctx.beginPath();
      ctx.moveTo(0, -e.h + 24);
      ctx.arc(0, -e.h + 24, e.w * 0.5, Math.PI, Math.PI * 1.33);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(0, -e.h + 24);
      ctx.arc(0, -e.h + 24, e.w * 0.5, Math.PI * 1.67, 0);
      ctx.closePath();
      ctx.fill();

      // Top finial
      ctx.fillStyle = '#ffb703';
      ctx.beginPath();
      ctx.arc(0, -e.h - 13, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    _drawSurfboard(ctx, e) {
      const sq = e.squash || 0;
      ctx.save();
      ctx.translate(e.x + e.w * 0.5, e.y + e.h * 0.5 + sq * 8);
      ctx.scale(1 + sq * 0.12, 1 - sq * 0.25);

      ctx.fillStyle = '#ffd166';
      ctx.strokeStyle = '#13293d';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.ellipse(0, 0, e.w * 0.5, e.h * 0.45, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Racing stripe
      ctx.fillStyle = '#ff6b4a';
      ctx.fillRect(-e.w * 0.36, -3, e.w * 0.72, 6);
      ctx.restore();
    }

    _drawCrab(ctx, e, time) {
      const cx = e.x + e.w * 0.5;
      const cy = e.y + e.h * 0.55;
      const pinch = Math.sin(time * 12 + e.phase) * 0.35;
      const legBob = Math.sin(time * 16 + e.phase) * 2.5;

      ctx.save();
      ctx.translate(cx, cy);

      // Legs
      ctx.strokeStyle = '#c8341c';
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      for (let side = -1; side <= 1; side += 2) {
        for (let l = 0; l < 3; l += 1) {
          const lx = side * (11 + l * 4);
          const ly = 5 + ((l % 2 === 0) ? legBob : -legBob);
          ctx.beginPath();
          ctx.moveTo(side * 9, 2);
          ctx.lineTo(lx, ly + 4);
          ctx.stroke();
        }
      }

      // Claws snapping
      for (let side = -1; side <= 1; side += 2) {
        ctx.save();
        ctx.translate(side * 18, -7);
        ctx.rotate(side * pinch);
        ctx.fillStyle = '#ff5738';
        ctx.strokeStyle = '#7d1b0c';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.arc(0, 0, 6.5, 0.4, Math.PI * 1.75);
        ctx.lineTo(0, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }

      // Shell
      ctx.fillStyle = '#ff5738';
      ctx.strokeStyle = '#7d1b0c';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(0, 1, 16, 11, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Angry cute eyes
      for (let side = -1; side <= 1; side += 2) {
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(side * 6, -9, 3.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#13293d';
        ctx.beginPath();
        ctx.arc(side * 6, -9, 1.8, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    _drawCrate(ctx, e) {
      ctx.save();
      ctx.translate(e.x, e.y);

      ctx.fillStyle = '#c88246';
      ctx.strokeStyle = '#5c3312';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.roundRect(0, 0, e.w, e.h, 5);
      ctx.fill();
      ctx.stroke();

      // Cross brace
      ctx.strokeStyle = '#9c5b28';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(6, 6);
      ctx.lineTo(e.w - 6, e.h - 6);
      ctx.moveTo(e.w - 6, 6);
      ctx.lineTo(6, e.h - 6);
      ctx.stroke();

      // Inner frame rim
      ctx.strokeStyle = '#e4a76a';
      ctx.lineWidth = 2;
      ctx.strokeRect(4, 4, e.w - 8, e.h - 8);
      ctx.restore();
    }

    _drawSeagull(ctx, e, time) {
      const cx = e.x + e.w * 0.5;
      const cy = e.y + e.h * 0.5;
      const flap = Math.sin(time * 16 + e.phase) * 14;

      ctx.save();
      ctx.translate(cx, cy);

      // Back wing
      ctx.fillStyle = '#d3dee8';
      ctx.beginPath();
      ctx.moveTo(-2, -2);
      ctx.quadraticCurveTo(6, -18 + flap * 0.7, 18, -8 + flap);
      ctx.lineTo(4, 2);
      ctx.closePath();
      ctx.fill();

      // Body
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#233b52';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.ellipse(0, 1, 18, 9.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Head & cheeky brow
      ctx.beginPath();
      ctx.arc(-14, -4, 7.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Yellow beak pointing left
      ctx.fillStyle = '#ffb703';
      ctx.beginPath();
      ctx.moveTo(-20, -4);
      ctx.lineTo(-30, -1);
      ctx.lineTo(-20, 2);
      ctx.closePath();
      ctx.fill();

      // Eye
      ctx.fillStyle = '#13293d';
      ctx.beginPath();
      ctx.arc(-15, -5.5, 1.7, 0, Math.PI * 2);
      ctx.fill();

      // Front wing
      ctx.fillStyle = '#eef4f8';
      ctx.strokeStyle = '#233b52';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-4, 0);
      ctx.quadraticCurveTo(8, -22 - flap * 0.85, 22, -6 - flap);
      ctx.lineTo(6, 5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.restore();
    }
  }

  PelicanGame.World = new WorldManager();
})(window);
