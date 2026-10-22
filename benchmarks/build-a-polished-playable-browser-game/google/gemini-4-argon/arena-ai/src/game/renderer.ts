import {
  Cloud,
  FishItem,
  FloatingPopup,
  Particle,
  Seagull,
  WorldProp,
} from './types';

export interface RenderState {
  width: number;
  height: number;
  groundY: number;
  time: number;
  distancePx: number;
  speed: number;
  feverFactor: number; // 0..1 smooth blend
  shakeX: number;
  shakeY: number;
  shakeRot: number;

  // Player state
  playerX: number;
  playerY: number; // 0 = tires on ground, negative = above ground
  playerVy: number;
  playerAngle: number; // radians
  grounded: boolean;
  tucking: boolean;
  crashed: boolean;
  wheelAngle: number;
  pedalAngle: number;
  squashX: number;
  squashY: number;
  pouchFill: number;
  pouchMax: number;
  pouchJiggle: number;
  mouthOpen: number; // 0..1
  bellRingTimer: number;
  flipProgressRad: number;

  // World entities
  clouds: Cloud[];
  seagulls: Seagull[];
  props: WorldProp[];
  fish: FishItem[];
  particles: Particle[];
  popups: FloatingPopup[];
}

function lerpColor(a: string, b: string, t: number): string {
  const ah = parseInt(a.replace('#', ''), 16);
  const bh = parseInt(b.replace('#', ''), 16);
  const ar = (ah >> 16) & 255;
  const ag = (ah >> 8) & 255;
  const ab = ah & 255;
  const br = (bh >> 16) & 255;
  const bg = (bh >> 8) & 255;
  const bb = bh & 255;
  const rr = Math.round(ar + (br - ar) * t);
  const rg = Math.round(ag + (bg - ag) * t);
  const rb = Math.round(ab + (bb - ab) * t);
  return `rgb(${rr}, ${rg}, ${rb})`;
}

// 2-bone analytical Inverse Kinematics for pelican leg (hip -> knee -> pedal)
function solveLegIK(
  hipX: number,
  hipY: number,
  footX: number,
  footY: number,
  thighLen: number,
  shinLen: number
): { kneeX: number; kneeY: number } {
  const dx = footX - hipX;
  const dy = footY - hipY;
  const distSq = dx * dx + dy * dy;
  const maxReach = thighLen + shinLen - 0.5;
  const dist = Math.min(Math.max(Math.sqrt(distSq), 4), maxReach);

  const cosAngle =
    (thighLen * thighLen + dist * dist - shinLen * shinLen) /
    (2 * thighLen * dist);
  const clampedCos = Math.max(-1, Math.min(1, cosAngle));
  const baseAngle = Math.atan2(dy, dx);
  // Bend knee forward (clockwise/up-right relative to hip->foot)
  const kneeAngle = baseAngle - Math.acos(clampedCos);

  return {
    kneeX: hipX + Math.cos(kneeAngle) * thighLen,
    kneeY: hipY + Math.sin(kneeAngle) * thighLen,
  };
}

export function renderGame(
  ctx: CanvasRenderingContext2D,
  s: RenderState
): void {
  const { width, height, groundY, time, distancePx, feverFactor } = s;

  ctx.save();

  // Apply damped screen shake around screen center
  if (
    Math.abs(s.shakeX) > 0.05 ||
    Math.abs(s.shakeY) > 0.05 ||
    Math.abs(s.shakeRot) > 0.0002
  ) {
    ctx.translate(width * 0.5 + s.shakeX, height * 0.5 + s.shakeY);
    ctx.rotate(s.shakeRot);
    ctx.translate(-width * 0.5, -height * 0.5);
  }

  // 1. SKY GRADIENT (transitions warm golden during Pelican Zoomies!)
  const skyGrad = ctx.createLinearGradient(0, 0, 0, groundY);
  const topSky = lerpColor('#22B8CF', '#F59E0B', feverFactor * 0.55);
  const midSky = lerpColor('#7DD3FC', '#FDE68A', feverFactor * 0.65);
  const lowSky = lerpColor('#FEF3C7', '#FFEDD5', feverFactor * 0.5);
  skyGrad.addColorStop(0, topSky);
  skyGrad.addColorStop(0.62, midSky);
  skyGrad.addColorStop(1, lowSky);
  ctx.fillStyle = skyGrad;
  ctx.fillRect(-20, -20, width + 40, groundY + 30);

  // Sun & warm coastal halo
  const sunX = width * 0.78;
  const sunY = Math.max(78, groundY * 0.24);
  const sunRadius = Math.min(width, height) * 0.068;

  const haloGrad = ctx.createRadialGradient(
    sunX,
    sunY,
    sunRadius * 0.4,
    sunX,
    sunY,
    sunRadius * 3.4
  );
  haloGrad.addColorStop(0, 'rgba(254, 249, 195, 0.75)');
  haloGrad.addColorStop(0.45, 'rgba(253, 224, 71, 0.22)');
  haloGrad.addColorStop(1, 'rgba(253, 224, 71, 0)');
  ctx.fillStyle = haloGrad;
  ctx.beginPath();
  ctx.arc(sunX, sunY, sunRadius * 3.4, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#FEF9C3';
  ctx.beginPath();
  ctx.arc(sunX, sunY, sunRadius, 0, Math.PI * 2);
  ctx.fill();

  // Clouds
  drawClouds(ctx, s.clouds);

  // 2. DISTANT HEADLAND, LIGHTHOUSE & OCEAN (0.15x - 0.25x Parallax)
  const horizonY = groundY - 86;
  drawDistantCoastAndOcean(ctx, width, horizonY, groundY, distancePx, time);

  // 3. MIDGROUND PIER, FERRIS WHEEL & PALMS (0.45x Parallax)
  drawMidgroundPier(ctx, width, horizonY, groundY, distancePx, time);

  // Drifting / reactive coastal seagulls
  drawSeagulls(ctx, s.seagulls, time);

  // Fever speed lines in sky if Zoomies active
  if (feverFactor > 0.05) {
    drawFeverSpeedLines(ctx, width, groundY, time, feverFactor);
  }

  // 4. BOARDWALK DECK, RAILINGS & PILINGS (1.0x Parallax)
  drawBoardwalk(ctx, width, height, groundY, distancePx, time);

  // 5. COLLECTIBLE FISH
  drawFishItems(ctx, s.fish, groundY, time);

  // 6. INTERACTIVE PROPS & HAZARDS (behind/around player)
  drawWorldProps(ctx, s.props, groundY, time);

  // 7. PLAYER SHADOW ON BOARDWALK
  drawPlayerShadow(ctx, s);

  // 8. PELICAN ON VINTAGE CRUISER BICYCLE
  drawPelicanOnBicycle(ctx, s);

  // 9. PARTICLES (Feathers, Gold Scales, Sparks, Dust)
  drawParticles(ctx, s.particles);

  // 10. FLOATING SCORE CALLOUTS
  drawPopups(ctx, s.popups);

  ctx.restore();
}

function drawClouds(ctx: CanvasRenderingContext2D, clouds: Cloud[]): void {
  ctx.fillStyle = 'rgba(255, 255, 255, 0.82)';
  for (let i = 0; i < clouds.length; i++) {
    const c = clouds[i];
    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.scale(c.scale, c.scale);
    ctx.beginPath();
    ctx.arc(0, 0, 24, Math.PI * 0.5, Math.PI * 1.5);
    ctx.arc(22, -12, 26, Math.PI, Math.PI * 2);
    ctx.arc(50, -6, 22, Math.PI, Math.PI * 2);
    ctx.arc(68, 2, 18, Math.PI * 1.5, Math.PI * 0.5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

function drawDistantCoastAndOcean(
  ctx: CanvasRenderingContext2D,
  width: number,
  horizonY: number,
  groundY: number,
  distancePx: number,
  time: number
): void {
  // Distant misty islands & lighthouse headland (0.12x parallax)
  const headPeriod = 1400;
  const headOffset = -((distancePx * 0.12) % headPeriod);

  for (let base = headOffset - headPeriod; base < width + headPeriod; base += headPeriod) {
    // Soft coastal hill
    ctx.fillStyle = '#7DD3FC';
    ctx.beginPath();
    ctx.moveTo(base + 120, horizonY + 4);
    ctx.quadraticCurveTo(base + 290, horizonY - 52, base + 470, horizonY + 4);
    ctx.closePath();
    ctx.fill();

    // Closer headland with lighthouse
    ctx.fillStyle = '#38BDF8';
    ctx.beginPath();
    ctx.moveTo(base + 320, horizonY + 4);
    ctx.quadraticCurveTo(base + 430, horizonY - 36, base + 560, horizonY + 4);
    ctx.closePath();
    ctx.fill();

    // Classic red-and-white coastal lighthouse
    const lx = base + 435;
    const ly = horizonY - 26;
    ctx.fillStyle = '#F8FAFC';
    ctx.beginPath();
    ctx.moveTo(lx - 7, ly + 10);
    ctx.lineTo(lx - 4, ly - 28);
    ctx.lineTo(lx + 4, ly - 28);
    ctx.lineTo(lx + 7, ly + 10);
    ctx.closePath();
    ctx.fill();

    // Red lighthouse stripes
    ctx.fillStyle = '#EF4444';
    ctx.fillRect(lx - 5.5, ly - 18, 11, 7);
    ctx.fillRect(lx - 6.2, ly - 4, 12.4, 7);

    // Lighthouse lantern cap
    ctx.fillStyle = '#1E293B';
    ctx.fillRect(lx - 5, ly - 33, 10, 5);
    ctx.fillStyle = '#FEF08A';
    ctx.fillRect(lx - 3, ly - 32, 6, 3);
  }

  // Deep azure ocean strip
  const oceanGrad = ctx.createLinearGradient(0, horizonY, 0, groundY);
  oceanGrad.addColorStop(0, '#0284C7');
  oceanGrad.addColorStop(0.65, '#0369A1');
  oceanGrad.addColorStop(1, '#0EA5E9');
  ctx.fillStyle = oceanGrad;
  ctx.fillRect(0, horizonY, width, groundY - horizonY + 8);

  // Sparkling sun glints on water
  ctx.fillStyle = 'rgba(254, 249, 195, 0.45)';
  const glintCount = 18;
  for (let i = 0; i < glintCount; i++) {
    const gx =
      ((i * 137 + Math.sin(time * 1.4 + i) * 18 - distancePx * 0.22) %
        (width + 80) +
        width +
        80) %
        (width + 80) -
      40;
    const gy = horizonY + 8 + ((i * 23) % Math.max(16, groundY - horizonY - 18));
    const gw = 10 + Math.sin(time * 3 + i * 1.7) * 6;
    if (gw > 2) {
      ctx.fillRect(gx, gy, gw, 2.2);
    }
  }

  // Little distant white sailboats (0.2x parallax)
  const boatPeriod = 480;
  const boatOffset = -((distancePx * 0.2 + time * 8) % boatPeriod);
  for (let bx = boatOffset; bx < width + boatPeriod; bx += boatPeriod) {
    const by = horizonY + 18 + Math.sin(time * 2 + bx * 0.02) * 1.8;
    // Hull
    ctx.fillStyle = '#FEF3C7';
    ctx.beginPath();
    ctx.moveTo(bx - 12, by);
    ctx.lineTo(bx + 12, by);
    ctx.lineTo(bx + 8, by + 5);
    ctx.lineTo(bx - 9, by + 5);
    ctx.closePath();
    ctx.fill();
    // Main sail
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.moveTo(bx - 1, by - 1);
    ctx.lineTo(bx - 1, by - 22);
    ctx.lineTo(bx + 11, by - 2);
    ctx.closePath();
    ctx.fill();
    // Jib sail
    ctx.fillStyle = '#FCA5A5';
    ctx.beginPath();
    ctx.moveTo(bx - 3, by - 1);
    ctx.lineTo(bx - 3, by - 17);
    ctx.lineTo(bx - 11, by - 2);
    ctx.closePath();
    ctx.fill();
  }
}

function drawMidgroundPier(
  ctx: CanvasRenderingContext2D,
  width: number,
  horizonY: number,
  groundY: number,
  distancePx: number,
  time: number
): void {
  const pierPeriod = 920;
  const offset = -((distancePx * 0.42) % pierPeriod);
  const pierDeckY = horizonY + 42;

  for (let px = offset - pierPeriod; px < width + pierPeriod; px += pierPeriod) {
    // Distant amusement pier section (260px wide)
    const startX = px + 140;
    const pierW = 280;

    // Pier pilings
    ctx.fillStyle = '#075985';
    for (let post = startX + 12; post < startX + pierW; post += 28) {
      ctx.fillRect(post, pierDeckY, 5, 28);
    }

    // Pier deck
    ctx.fillStyle = '#92400E';
    ctx.fillRect(startX, pierDeckY - 4, pierW, 6);

    // Vintage Coastal Ferris Wheel!
    const wheelCx = startX + 95;
    const wheelCy = pierDeckY - 52;
    const wheelR = 42;

    // Support A-frame
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(wheelCx - 24, pierDeckY - 4);
    ctx.lineTo(wheelCx, wheelCy);
    ctx.lineTo(wheelCx + 24, pierDeckY - 4);
    ctx.stroke();

    // Outer wheel rim
    ctx.strokeStyle = '#FEF9C3';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(wheelCx, wheelCy, wheelR, 0, Math.PI * 2);
    ctx.stroke();

    // Rotating spokes & colorful gondolas
    const gondolaColors = ['#EF4444', '#F59E0B', '#10B981', '#38BDF8'];
    for (let g = 0; g < 8; g++) {
      const ang = time * 0.35 + (g * Math.PI) / 4;
      const gx = wheelCx + Math.cos(ang) * wheelR;
      const gy = wheelCy + Math.sin(ang) * wheelR;
      ctx.strokeStyle = 'rgba(254, 249, 195, 0.55)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(wheelCx, wheelCy);
      ctx.lineTo(gx, gy);
      ctx.stroke();

      ctx.fillStyle = gondolaColors[g % gondolaColors.length];
      ctx.beginPath();
      ctx.arc(gx, gy + 3, 4.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Little striped pier pavilion tent
    const tentX = startX + 195;
    ctx.fillStyle = '#FFFBEB';
    ctx.fillRect(tentX, pierDeckY - 24, 52, 20);
    ctx.fillStyle = '#EF4444';
    ctx.beginPath();
    ctx.moveTo(tentX - 5, pierDeckY - 24);
    ctx.lineTo(tentX + 26, pierDeckY - 40);
    ctx.lineTo(tentX + 57, pierDeckY - 24);
    ctx.closePath();
    ctx.fill();

    // Swaying coastal palm silhouettes along sandbar (closer 0.55x feel)
    const palmSpots = [px + 540, px + 595, px + 820];
    // Small sandy spit under palms
    ctx.fillStyle = '#FDE68A';
    ctx.beginPath();
    ctx.ellipse(px + 570, groundY - 22, 95, 12, 0, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(px + 820, groundY - 22, 65, 10, 0, Math.PI, Math.PI * 2);
    ctx.fill();

    palmSpots.forEach((treeX, idx) => {
      const sway = Math.sin(time * 1.8 + idx * 1.4) * 5;
      const baseY = groundY - 24;
      const topX = treeX + 10 + sway;
      const topY = baseY - (56 + (idx % 2) * 14);

      // Curved palm trunk
      ctx.strokeStyle = '#92400E';
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(treeX, baseY);
      ctx.quadraticCurveTo(treeX + 2, (baseY + topY) * 0.5, topX, topY);
      ctx.stroke();

      // Palm fronds
      ctx.strokeStyle = '#15803D';
      ctx.lineWidth = 3.5;
      const frondAngles = [-2.5, -1.9, -1.1, -0.4, 0.3];
      frondAngles.forEach((fa) => {
        const fx = topX + Math.cos(fa) * 24;
        const fy = topY + Math.sin(fa) * 16 + 8;
        ctx.beginPath();
        ctx.moveTo(topX, topY);
        ctx.quadraticCurveTo(
          (topX + fx) * 0.5,
          Math.min(topY, fy) - 8,
          fx,
          fy
        );
        ctx.stroke();
      });
    });
  }
}

function drawSeagulls(
  ctx: CanvasRenderingContext2D,
  seagulls: Seagull[],
  time: number
): void {
  ctx.strokeStyle = '#F8FAFC';
  ctx.lineCap = 'round';
  for (let i = 0; i < seagulls.length; i++) {
    const g = seagulls[i];
    const flapSpeed = g.scaredTimer > 0 ? 18 : 6.5;
    const flap = Math.sin(time * flapSpeed + g.flapPhase) * 7 * g.scale;
    ctx.save();
    ctx.translate(g.x, g.y);
    ctx.lineWidth = 2.4 * g.scale;
    ctx.beginPath();
    ctx.moveTo(-11 * g.scale, flap);
    ctx.quadraticCurveTo(-5 * g.scale, -5 * g.scale, 0, 0);
    ctx.quadraticCurveTo(5 * g.scale, -5 * g.scale, 11 * g.scale, flap);
    ctx.stroke();
    ctx.restore();
  }
}

function drawFeverSpeedLines(
  ctx: CanvasRenderingContext2D,
  width: number,
  groundY: number,
  time: number,
  feverFactor: number
): void {
  ctx.save();
  ctx.globalAlpha = feverFactor * 0.35;
  ctx.strokeStyle = '#FEF9C3';
  ctx.lineWidth = 2.5;
  for (let i = 0; i < 10; i++) {
    const y = 40 + ((i * 67) % Math.max(80, groundY - 70));
    const len = 90 + (i % 3) * 55;
    const x =
      width - (((time * 1350 + i * 210) % (width + len * 2)) - len);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + len, y);
    ctx.stroke();
  }
  ctx.restore();
}

function drawBoardwalk(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  groundY: number,
  distancePx: number,
  time: number
): void {
  // White coastal railing behind the riding lane
  const railHeight = 36;
  const railTop = groundY - railHeight;
  const postSpacing = 96;
  const postOffset = -(distancePx % postSpacing);

  // Horizontal white rails
  ctx.fillStyle = '#E2E8F0';
  ctx.fillRect(0, railTop + 5, width, 4.5);
  ctx.fillRect(0, railTop + 19, width, 4);
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, railTop + 4, width, 2);

  for (let x = postOffset - postSpacing; x < width + postSpacing; x += postSpacing) {
    // Railing post
    ctx.fillStyle = '#CBD5E1';
    ctx.fillRect(x, railTop, 9, railHeight);
    ctx.fillStyle = '#F8FAFC';
    ctx.fillRect(x + 1, railTop, 6, railHeight);
    // Cute rounded post cap
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(x + 4.5, railTop, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Under-boardwalk ocean surf & wooden pilings
  const underTop = groundY + 26;
  const surfGrad = ctx.createLinearGradient(0, underTop, 0, height);
  surfGrad.addColorStop(0, '#0369A1');
  surfGrad.addColorStop(0.35, '#0284C7');
  surfGrad.addColorStop(1, '#0F172A');
  ctx.fillStyle = surfGrad;
  ctx.fillRect(0, underTop, width, Math.max(0, height - underTop));

  // Heavy wooden pier pilings under the boardwalk
  const pilingSpacing = 144;
  const pilingOffset = -(distancePx % pilingSpacing);
  for (
    let x = pilingOffset - pilingSpacing;
    x < width + pilingSpacing;
    x += pilingSpacing
  ) {
    ctx.fillStyle = '#451A03';
    ctx.fillRect(x + 16, underTop - 2, 20, height - underTop + 10);
    ctx.fillStyle = '#78350F';
    ctx.fillRect(x + 18, underTop - 2, 8, height - underTop + 10);

    // White seafoam splash around piling base
    const foamY = Math.min(height - 14, underTop + 34);
    const foamPulse = Math.sin(time * 4 + x * 0.05) * 3;
    ctx.fillStyle = 'rgba(224, 242, 254, 0.65)';
    ctx.beginPath();
    ctx.ellipse(x + 26, foamY, 20 + foamPulse, 4.5, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Main Boardwalk Timber Deck (groundY to groundY + 28)
  const deckGrad = ctx.createLinearGradient(0, groundY, 0, groundY + 28);
  deckGrad.addColorStop(0, '#F59E0B');
  deckGrad.addColorStop(0.18, '#D97706');
  deckGrad.addColorStop(0.78, '#B45309');
  deckGrad.addColorStop(1, '#78350F');
  ctx.fillStyle = deckGrad;
  ctx.fillRect(0, groundY, width, 28);

  // Top sunlit edge highlight
  ctx.fillStyle = '#FDE68A';
  ctx.fillRect(0, groundY, width, 2.5);

  // Scrolling individual timber plank seams & nail heads (gives vivid 60fps speed feel!)
  const plankW = 34;
  const plankOffset = -(distancePx % plankW);
  let plankIndex = Math.floor(distancePx / plankW);

  for (let x = plankOffset - plankW; x < width + plankW; x += plankW) {
    plankIndex++;
    // Subtle alternating plank tint
    if (plankIndex % 3 === 0) {
      ctx.fillStyle = 'rgba(120, 53, 15, 0.14)';
      ctx.fillRect(x, groundY + 2.5, plankW - 2, 20);
    } else if (plankIndex % 5 === 0) {
      ctx.fillStyle = 'rgba(254, 243, 199, 0.12)';
      ctx.fillRect(x, groundY + 2.5, plankW - 2, 20);
    }

    // Diagonal perspective plank seam
    ctx.strokeStyle = '#78350F';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, groundY);
    ctx.lineTo(x - 6, groundY + 23);
    ctx.stroke();

    // Nail heads
    ctx.fillStyle = '#451A03';
    ctx.fillRect(x + 6, groundY + 5, 2.2, 2.2);
    ctx.fillRect(x + 3, groundY + 17, 2.2, 2.2);
  }

  // Dark side trim beam under planks
  ctx.fillStyle = '#451A03';
  ctx.fillRect(0, groundY + 23, width, 6);
}

function drawFishItems(
  ctx: CanvasRenderingContext2D,
  fishList: FishItem[],
  groundY: number,
  time: number
): void {
  for (let i = 0; i < fishList.length; i++) {
    const f = fishList[i];
    if (!f.active || f.collected) continue;

    const bob = Math.sin(time * 5.5 + f.bobPhase) * 4.5;
    const fx = f.x;
    const fy = groundY + f.y + bob;
    const isGold = f.kind === 'kingfish';
    const scale = isGold ? 1.28 : 1.0;
    const tailWag = Math.sin(time * 14 + f.bobPhase) * 0.25;

    ctx.save();
    ctx.translate(fx, fy);
    ctx.scale(scale, scale);

    // Soft halo for readability against sky/pier
    ctx.fillStyle = isGold
      ? 'rgba(250, 204, 21, 0.34)'
      : 'rgba(255, 255, 255, 0.28)';
    ctx.beginPath();
    ctx.arc(0, 0, 17, 0, Math.PI * 2);
    ctx.fill();

    // Wiggling tail fin (facing left toward pelican!)
    ctx.save();
    ctx.translate(11, 0);
    ctx.rotate(tailWag);
    ctx.fillStyle = isGold ? '#D97706' : '#0284C7';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(9, -7);
    ctx.lineTo(7, 0);
    ctx.lineTo(9, 7);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Plump fish body
    ctx.fillStyle = isGold ? '#FACC15' : '#38BDF8';
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, 0, 13, 7.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Shimmering belly highlight
    ctx.fillStyle = isGold ? '#FEF9C3' : '#E0F2FE';
    ctx.beginPath();
    ctx.ellipse(-1, 2.2, 9.5, 3.4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Cute fish eye (facing left)
    ctx.fillStyle = '#0F172A';
    ctx.beginPath();
    ctx.arc(-7, -1.5, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(-7.6, -2.1, 0.8, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

function drawWorldProps(
  ctx: CanvasRenderingContext2D,
  props: WorldProp[],
  groundY: number,
  time: number
): void {
  for (let i = 0; i < props.length; i++) {
    const p = props[i];
    if (!p.active) continue;

    ctx.save();
    const drawX = p.x;
    const drawY = groundY + p.y;
    ctx.translate(drawX, drawY);
    if (p.smashed) {
      ctx.rotate(p.smashRot);
    }

    switch (p.kind) {
      case 'ramp': {
        // Wooden Kicker Ramp (inviting bright chevron launchpad!)
        const w = p.width;
        const h = p.height;
        ctx.fillStyle = '#92400E';
        ctx.strokeStyle = '#1E293B';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(-w * 0.5, 0);
        ctx.lineTo(w * 0.5, -h);
        ctx.lineTo(w * 0.5, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Bright yellow top launch deck strip
        ctx.strokeStyle = '#FACC15';
        ctx.lineWidth = 5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-w * 0.46, -1.5);
        ctx.lineTo(w * 0.48, -h);
        ctx.stroke();

        // Painted upward booster arrow
        ctx.fillStyle = '#FEF08A';
        ctx.beginPath();
        ctx.arc(w * 0.12, -h * 0.35, 5, 0, Math.PI * 2);
        ctx.fill();
        break;
      }

      case 'awning': {
        // Elevated Striped Beach Cafe Awning (Trampoline on top, open path underneath!)
        const w = p.width;
        const canopyTopY = -p.height + p.bounceSpring;
        const canopyH = 24;

        // Background support poles down to boardwalk
        ctx.strokeStyle = '#64748B';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(-w * 0.42, 0);
        ctx.lineTo(-w * 0.42, canopyTopY + 12);
        ctx.moveTo(w * 0.42, 0);
        ctx.lineTo(w * 0.42, canopyTopY + 12);
        ctx.stroke();

        // Elastic curved canopy top
        const sag = p.bounceSpring * 1.3;
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(-w * 0.5, canopyTopY + canopyH);
        ctx.lineTo(-w * 0.44, canopyTopY);
        ctx.quadraticCurveTo(0, canopyTopY + sag, w * 0.44, canopyTopY);
        ctx.lineTo(w * 0.5, canopyTopY + canopyH);
        ctx.closePath();
        ctx.fillStyle = '#EF4444';
        ctx.fill();
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = '#1E293B';
        ctx.stroke();

        // Alternating cream stripes
        ctx.fillStyle = '#FEF3C7';
        const stripes = 5;
        const sw = w / stripes;
        for (let sIdx = 1; sIdx < stripes; sIdx += 2) {
          const sx = -w * 0.5 + sIdx * sw;
          ctx.fillRect(sx, canopyTopY + 2 + sag * 0.3, sw, canopyH - 3);
        }

        // Scalloped fringe along bottom of awning
        const scallops = 7;
        const scW = w / scallops;
        for (let c = 0; c < scallops; c++) {
          ctx.fillStyle = c % 2 === 0 ? '#EF4444' : '#FEF3C7';
          ctx.beginPath();
          ctx.arc(
            -w * 0.5 + scW * (c + 0.5),
            canopyTopY + canopyH,
            scW * 0.5,
            0,
            Math.PI
          );
          ctx.fill();
          ctx.strokeStyle = '#1E293B';
          ctx.lineWidth = 1.6;
          ctx.stroke();
        }
        ctx.restore();
        break;
      }

      case 'gust': {
        // Swirling Tailwind Boost Ring!
        const pulse = Math.sin(time * 7 + p.animPhase) * 3;
        ctx.strokeStyle = '#2DD4BF';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.ellipse(0, 0, 14, 34 + pulse, 0, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = '#FEF9C3';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(3, 0, 9, 24 - pulse * 0.5, 0, 0, Math.PI * 2);
        ctx.stroke();
        break;
      }

      case 'crab': {
        // Snappy Crimson Pier Crab!
        const scuttle = Math.sin(time * 15 + p.animPhase) * 3;
        const pinch = Math.abs(Math.sin(time * 8 + p.animPhase)) * 0.35;

        // Scuttling legs
        ctx.strokeStyle = '#991B1B';
        ctx.lineWidth = 2.6;
        ctx.lineCap = 'round';
        for (let leg = -1; leg <= 1; leg++) {
          const ly = -8 + leg * 3;
          ctx.beginPath();
          ctx.moveTo(-10, ly);
          ctx.lineTo(-22, ly - 4 + scuttle * leg);
          ctx.lineTo(-25, 0);
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(10, ly);
          ctx.lineTo(22, ly - 4 - scuttle * leg);
          ctx.lineTo(25, 0);
          ctx.stroke();
        }

        // Raised snapping claws
        [-1, 1].forEach((dir) => {
          ctx.save();
          ctx.translate(dir * 14, -20);
          ctx.rotate(dir * (0.3 - pinch));
          ctx.fillStyle = '#EF4444';
          ctx.strokeStyle = '#0F172A';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(0, -6, 7.5, 0.2, Math.PI * 1.75);
          ctx.lineTo(0, -6);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          ctx.restore();
        });

        // Crab shell
        ctx.fillStyle = '#DC2626';
        ctx.strokeStyle = '#0F172A';
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.ellipse(0, -13, 17, 11, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Googly eye stalks
        [-6, 6].forEach((ex) => {
          ctx.strokeStyle = '#DC2626';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(ex, -22);
          ctx.lineTo(ex, -29);
          ctx.stroke();

          ctx.fillStyle = '#FFFFFF';
          ctx.strokeStyle = '#0F172A';
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.arc(ex, -30, 4.2, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#0F172A';
          ctx.beginPath();
          ctx.arc(ex - 1, -30, 1.8, 0, Math.PI * 2);
          ctx.fill();
        });
        break;
      }

      case 'cone': {
        // High-contrast Boardwalk Hazard Cone
        const h = p.height;
        const w = p.width;

        // Base plate
        ctx.fillStyle = '#1E293B';
        ctx.fillRect(-w * 0.55, -6, w * 1.1, 6);

        // Orange cone body
        ctx.fillStyle = '#F97316';
        ctx.strokeStyle = '#0F172A';
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.moveTo(-w * 0.42, -5);
        ctx.lineTo(-5, -h);
        ctx.lineTo(5, -h);
        ctx.lineTo(w * 0.42, -5);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Reflective white stripes
        ctx.fillStyle = '#F8FAFC';
        ctx.beginPath();
        ctx.moveTo(-w * 0.28, -h * 0.36);
        ctx.lineTo(w * 0.28, -h * 0.36);
        ctx.lineTo(w * 0.21, -h * 0.56);
        ctx.lineTo(-w * 0.21, -h * 0.56);
        ctx.closePath();
        ctx.fill();
        break;
      }

      case 'traps': {
        // Stacked Wooden Lobster Traps + Red Warning Buoy (taller jump challenge)
        const w = p.width;
        const boxH = 27;

        for (let stack = 0; stack < 2; stack++) {
          const by = -stack * boxH;
          ctx.fillStyle = stack === 0 ? '#B45309' : '#D97706';
          ctx.strokeStyle = '#0F172A';
          ctx.lineWidth = 2.3;
          ctx.fillRect(-w * 0.5, by - boxH, w, boxH - 1);
          ctx.strokeRect(-w * 0.5, by - boxH, w, boxH - 1);

          // Wooden slats & net arch
          ctx.fillStyle = '#451A03';
          ctx.beginPath();
          ctx.arc(0, by - 4, 8, Math.PI, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = '#FDE68A';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(-w * 0.46, by - boxH * 0.5);
          ctx.lineTo(w * 0.46, by - boxH * 0.5);
          ctx.stroke();
        }

        // Red & white buoy perched on top
        ctx.fillStyle = '#EF4444';
        ctx.strokeStyle = '#0F172A';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(4, -boxH * 2 - 7, 7, 9, 0.25, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        break;
      }

      case 'umbrella': {
        // Runaway Spinning Beach Umbrella hovering at head-height (Duck under OR Jump over!)
        const spin = Math.sin(time * 9 + p.animPhase) * 4;
        // Ground shadow so height is super clear!
        if (!p.smashed) {
          ctx.fillStyle = 'rgba(15, 23, 42, 0.22)';
          ctx.beginPath();
          ctx.ellipse(0, -p.y + 4, 24, 5, 0, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.save();
        ctx.translate(0, spin * 0.6);
        ctx.rotate(-0.25 + Math.sin(time * 5 + p.animPhase) * 0.08);

        // Wooden umbrella pole pointing forward-left
        ctx.strokeStyle = '#FEF3C7';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(-24, 2);
        ctx.lineTo(22, -4);
        ctx.stroke();

        // Colorful striped beach umbrella canopy
        ctx.fillStyle = '#EC4899';
        ctx.strokeStyle = '#0F172A';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(4, 0, 26, -Math.PI * 0.48, Math.PI * 0.48);
        ctx.quadraticCurveTo(-4, 0, 4, -26);
        ctx.fill();
        ctx.stroke();

        // Yellow middle stripe wedge
        ctx.fillStyle = '#FACC15';
        ctx.beginPath();
        ctx.moveTo(30, 0);
        ctx.arc(4, 0, 26, -0.35, 0.35);
        ctx.closePath();
        ctx.fill();

        ctx.restore();

        // Subtle animated downward chevron beneath umbrella showing open duck lane
        if (!p.smashed) {
          const bobCue = Math.sin(time * 8 + p.animPhase) * 2.5;
          ctx.strokeStyle = '#FEF08A';
          ctx.lineWidth = 2.6;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.beginPath();
          ctx.moveTo(-7, 22 + bobCue);
          ctx.lineTo(0, 28 + bobCue);
          ctx.lineTo(7, 22 + bobCue);
          ctx.stroke();
        }
        break;
      }
    }

    ctx.restore();
  }
}

function drawPlayerShadow(
  ctx: CanvasRenderingContext2D,
  s: RenderState
): void {
  const heightAboveBoardwalk = Math.max(0, -s.playerY);
  const shadowScale = Math.max(0.28, 1 - heightAboveBoardwalk / 290);
  const alpha = Math.max(0.08, 0.34 * shadowScale);

  ctx.save();
  ctx.translate(s.playerX, s.groundY + 4);
  ctx.scale(shadowScale * s.squashX, shadowScale);
  ctx.fillStyle = `rgba(69, 26, 3, ${alpha.toFixed(3)})`;
  ctx.beginPath();
  ctx.ellipse(0, 0, 46, 7.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawPelicanOnBicycle(
  ctx: CanvasRenderingContext2D,
  s: RenderState
): void {
  const {
    playerX,
    groundY,
    playerY,
    playerAngle,
    wheelAngle,
    pedalAngle,
    squashX,
    squashY,
    tucking,
    crashed,
    pouchFill,
    pouchMax,
    pouchJiggle,
    mouthOpen,
    bellRingTimer,
    feverFactor,
    flipProgressRad,
    grounded,
    time,
  } = s;

  ctx.save();
  // Pivot around wheel-base center when airborne, or ground contact when grounded
  const pivotOffsetY = grounded ? 0 : -26;
  ctx.translate(playerX, groundY + playerY + pivotOffsetY);

  // Subtle helpful air-flip progress halo when rotating in mid-air
  if (!grounded && Math.abs(flipProgressRad) > 0.35 && !crashed) {
    const pct = Math.min(1, (Math.abs(flipProgressRad) % (Math.PI * 2)) / (Math.PI * 2));
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(0, -14, 56, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = pct > 0.78 ? '#4ADE80' : '#FACC15';
    ctx.lineWidth = 4.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(0, -14, 56, -Math.PI * 0.5, -Math.PI * 0.5 - pct * Math.PI * 2, true);
    ctx.stroke();
    ctx.restore();
  }

  // Golden Pelican Zoomies aura!
  if (feverFactor > 0.05) {
    ctx.save();
    const auraGrad = ctx.createRadialGradient(0, -20, 12, 0, -20, 74);
    auraGrad.addColorStop(0, `rgba(254, 240, 138, ${0.55 * feverFactor})`);
    auraGrad.addColorStop(0.6, `rgba(251, 146, 60, ${0.28 * feverFactor})`);
    auraGrad.addColorStop(1, 'rgba(251, 146, 60, 0)');
    ctx.fillStyle = auraGrad;
    ctx.beginPath();
    ctx.arc(-4, -20, 74, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  ctx.rotate(playerAngle);
  ctx.scale(squashX, squashY);
  ctx.translate(0, -pivotOffsetY);

  // Coordinates relative to tire-ground contact point (0, 0)
  const rearWheelX = -28;
  const frontWheelX = 30;
  const wheelY = -19;
  const wheelR = 18;
  const crankX = -3;
  const crankY = -18;
  const pedalRadius = 9.5;

  // Compute left (far) & right (near) pedal positions
  const farPedalX = crankX + Math.cos(pedalAngle + Math.PI) * pedalRadius;
  const farPedalY = crankY + Math.sin(pedalAngle + Math.PI) * pedalRadius;
  const nearPedalX = crankX + Math.cos(pedalAngle) * pedalRadius;
  const nearPedalY = crankY + Math.sin(pedalAngle) * pedalRadius;

  // Pelican hip position on saddle
  const hipX = tucking ? -12 : -15;
  const hipY = tucking ? -46 : -51;

  // --- A. FAR PELICAN LEG (behind bicycle frame) ---
  drawPelicanLeg(ctx, hipX + 2, hipY, farPedalX, farPedalY, '#EA580C', '#C2410C');

  // --- B. BICYCLE WHEELS ---
  drawBicycleWheel(ctx, rearWheelX, wheelY, wheelR, wheelAngle);
  drawBicycleWheel(ctx, frontWheelX, wheelY, wheelR, wheelAngle);

  // Vintage cruiser fenders
  ctx.strokeStyle = '#DC2626';
  ctx.lineWidth = 4.5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(rearWheelX, wheelY, wheelR + 3.5, Math.PI * 0.92, Math.PI * 1.85);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(frontWheelX, wheelY, wheelR + 3.5, Math.PI * 1.08, Math.PI * 1.78);
  ctx.stroke();

  // --- C. VINTAGE RED STEP-THROUGH CRUISER FRAME ---
  const seatTubeTopX = -15;
  const seatTubeTopY = -43;
  const headTubeTopX = 21;
  const headTubeTopY = -45;
  const headTubeBotX = 24;
  const headTubeBotY = -33;

  // Chainstay & chain guard
  ctx.strokeStyle = '#1E293B';
  ctx.lineWidth = 6.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(rearWheelX, wheelY);
  ctx.lineTo(crankX, crankY);
  ctx.lineTo(seatTubeTopX, seatTubeTopY);
  ctx.lineTo(rearWheelX, wheelY);
  // Swooping step-through cruiser tubes
  ctx.moveTo(crankX, crankY);
  ctx.quadraticCurveTo(10, -22, headTubeBotX, headTubeBotY);
  ctx.moveTo(seatTubeTopX + 2, seatTubeTopY + 9);
  ctx.quadraticCurveTo(6, -28, headTubeTopX, headTubeTopY - 3);
  // Front fork
  ctx.moveTo(frontWheelX, wheelY);
  ctx.lineTo(headTubeTopX, headTubeTopY);
  ctx.stroke();

  // Bright Cruiser Red inner frame stroke
  ctx.strokeStyle = '#EF4444';
  ctx.lineWidth = 3.8;
  ctx.beginPath();
  ctx.moveTo(rearWheelX, wheelY);
  ctx.lineTo(crankX, crankY);
  ctx.lineTo(seatTubeTopX, seatTubeTopY);
  ctx.lineTo(rearWheelX, wheelY);
  ctx.moveTo(crankX, crankY);
  ctx.quadraticCurveTo(10, -22, headTubeBotX, headTubeBotY);
  ctx.moveTo(seatTubeTopX + 2, seatTubeTopY + 9);
  ctx.quadraticCurveTo(6, -28, headTubeTopX, headTubeTopY - 3);
  ctx.moveTo(frontWheelX, wheelY);
  ctx.lineTo(headTubeTopX, headTubeTopY);
  ctx.stroke();

  // Chrome Seatpost & Handlebars
  const handleGripX = 14;
  const handleGripY = -56;
  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 3.4;
  ctx.beginPath();
  // Stem + swept-back cruiser handlebar
  ctx.moveTo(headTubeTopX, headTubeTopY);
  ctx.lineTo(19, -55);
  ctx.quadraticCurveTo(21, -59, handleGripX, handleGripY);
  ctx.stroke();

  // Flowing Handlebar Streamers!
  const streamerWave = Math.sin(time * 18) * 4;
  ctx.strokeStyle = '#FACC15';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(handleGripX, handleGripY);
  ctx.quadraticCurveTo(handleGripX - 10, handleGripY + 3 + streamerWave, handleGripX - 20, handleGripY + 6 - streamerWave * 0.5);
  ctx.stroke();
  ctx.strokeStyle = '#FB7185';
  ctx.beginPath();
  ctx.moveTo(handleGripX, handleGripY + 1);
  ctx.quadraticCurveTo(handleGripX - 9, handleGripY + 7 - streamerWave, handleGripX - 18, handleGripY + 10 + streamerWave * 0.5);
  ctx.stroke();

  // Shiny Brass Bicycle Bell on handlebars!
  const bellShake = bellRingTimer > 0 ? Math.sin(time * 55) * 1.8 : 0;
  ctx.fillStyle = '#FBBF24';
  ctx.strokeStyle = '#0F172A';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(20 + bellShake, -59, 4.2, Math.PI, Math.PI * 2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  if (bellRingTimer > 0) {
    // Sonic ring arcs!
    ctx.strokeStyle = '#FEF08A';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(21, -62, 8 + (0.35 - bellRingTimer) * 18, -Math.PI * 0.85, -Math.PI * 0.15);
    ctx.stroke();
  }

  // Leather Cruiser Saddle
  ctx.fillStyle = '#78350F';
  ctx.strokeStyle = '#0F172A';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(seatTubeTopX - 2, seatTubeTopY - 4, 10, 4, -0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Crankset & Chainring
  ctx.fillStyle = '#CBD5E1';
  ctx.strokeStyle = '#0F172A';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(crankX, crankY, 6.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Near crank arm & pedal
  ctx.strokeStyle = '#64748B';
  ctx.lineWidth = 2.8;
  ctx.beginPath();
  ctx.moveTo(crankX, crankY);
  ctx.lineTo(nearPedalX, nearPedalY);
  ctx.stroke();
  ctx.fillStyle = '#1E293B';
  ctx.fillRect(nearPedalX - 4.5, nearPedalY - 2, 9, 4);

  // --- D. PELICAN TORSO, NECK, CAP & EXPANDING POUCH ---
  ctx.save();
  const bodyLean = tucking ? 0.42 : 0.08 + Math.sin(pedalAngle * 2) * 0.025;
  ctx.translate(hipX, hipY - 2);
  ctx.rotate(bodyLean);

  // Tail feathers perking out the back
  const tailWag = Math.sin(time * 12) * 0.08;
  ctx.save();
  ctx.translate(-14, -2);
  ctx.rotate(tailWag);
  ctx.fillStyle = '#F8FAFC';
  ctx.strokeStyle = '#0F172A';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(4, -5);
  ctx.lineTo(-14, -12);
  ctx.lineTo(-9, -3);
  ctx.lineTo(-15, -1);
  ctx.lineTo(3, 4);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // Plump Pelican Body
  ctx.fillStyle = '#F8FAFC';
  ctx.strokeStyle = '#0F172A';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.ellipse(2, -8, 19, 14.5, -0.25, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Soft warm belly shading
  ctx.fillStyle = '#E2E8F0';
  ctx.beginPath();
  ctx.ellipse(3, -3, 14, 7.5, -0.2, 0, Math.PI);
  ctx.fill();

  // Graceful S-curved Pelican Neck reaching up
  const headX = tucking ? 20 : 15;
  const headY = tucking ? -28 : -37;

  ctx.strokeStyle = '#0F172A';
  ctx.lineWidth = 13.5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(10, -14);
  ctx.quadraticCurveTo(6, -26, headX, headY);
  ctx.stroke();

  ctx.strokeStyle = '#F8FAFC';
  ctx.lineWidth = 9;
  ctx.beginPath();
  ctx.moveTo(10, -14);
  ctx.quadraticCurveTo(6, -26, headX, headY);
  ctx.stroke();

  // Pelican Wing (reaches toward handlebars or flaps excitedly in midair!)
  const wingFlap = !grounded
    ? -0.45 + Math.sin(time * 20) * 0.35
    : Math.sin(pedalAngle) * 0.08;
  ctx.save();
  ctx.translate(4, -12);
  ctx.rotate(wingFlap);
  ctx.fillStyle = '#FFFFFF';
  ctx.strokeStyle = '#0F172A';
  ctx.lineWidth = 2.3;
  ctx.beginPath();
  ctx.moveTo(-6, -4);
  ctx.quadraticCurveTo(14, -9, 21, 3);
  ctx.quadraticCurveTo(8, 9, -8, 5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // Dark coastal pelican primary wingtip accent
  ctx.fillStyle = '#334155';
  ctx.beginPath();
  ctx.moveTo(11, -1);
  ctx.quadraticCurveTo(18, -1, 20, 3);
  ctx.quadraticCurveTo(14, 5, 9, 3);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // --- PELICAN HEAD, COMICAL GULAR POUCH & SAILOR CAP ---
  ctx.save();
  ctx.translate(headX, headY);
  // Counter-rotate slightly during tuck so pelican still looks ahead down the boardwalk!
  ctx.rotate(tucking ? -0.32 : -0.04);

  // Round white head
  ctx.fillStyle = '#F8FAFC';
  ctx.strokeStyle = '#0F172A';
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.arc(0, 0, 10.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // EXPANDABLE ORANGE GULAR THROAT POUCH!
  // Grows noticeably as pouchFill (0..8) increases + springy jiggle!
  const fillRatio = Math.min(1, pouchFill / Math.max(1, pouchMax));
  const pouchDepth = 13 + fillRatio * 14 + pouchJiggle * 6 + mouthOpen * 5;
  const pouchBellyX = 15 + fillRatio * 3;

  const pouchGrad = ctx.createLinearGradient(8, -2, 16, pouchDepth);
  pouchGrad.addColorStop(0, '#FBBF24');
  pouchGrad.addColorStop(0.45, '#F97316');
  pouchGrad.addColorStop(1, '#EA580C');

  ctx.fillStyle = pouchGrad;
  ctx.strokeStyle = '#0F172A';
  ctx.lineWidth = 2.3;
  ctx.beginPath();
  ctx.moveTo(5, 1);
  ctx.lineTo(34, -1 + mouthOpen * 3);
  ctx.bezierCurveTo(
    33,
    pouchDepth * 0.85,
    pouchBellyX,
    pouchDepth + 4,
    2,
    6
  );
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Subtle comical fish lump ridges on pouch when holding fish!
  if (pouchFill > 0) {
    ctx.strokeStyle = 'rgba(154, 52, 18, 0.35)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(16, pouchDepth * 0.45, 5 + fillRatio * 3, 0.2, Math.PI * 0.85);
    ctx.stroke();
  }

  // Long Upper Golden Pelican Bill (tilts up when gulping a fish!)
  ctx.save();
  ctx.translate(6, -3);
  ctx.rotate(-mouthOpen * 0.35);
  ctx.fillStyle = '#FBBF24';
  ctx.strokeStyle = '#0F172A';
  ctx.lineWidth = 2.3;
  ctx.beginPath();
  ctx.moveTo(0, -3.5);
  ctx.lineTo(28, -2);
  // Iconic hooked pink-coral pelican bill tip!
  ctx.quadraticCurveTo(32, -1, 30, 3.5);
  ctx.lineTo(0, 3.5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#FB7185';
  ctx.beginPath();
  ctx.arc(28.5, 0.8, 2.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Expressive Eye!
  ctx.fillStyle = '#FEF9C3';
  ctx.strokeStyle = '#0F172A';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.arc(3.5, -2.5, 4.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  if (crashed) {
    // Comical X eye when crashed
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(1.5, -4.5);
    ctx.lineTo(5.5, -0.5);
    ctx.moveTo(5.5, -4.5);
    ctx.lineTo(1.5, -0.5);
    ctx.stroke();
  } else {
    // Crisp lively pupil
    const pupilR = !grounded && Math.abs(flipProgressRad) > 0.3 ? 1.6 : 2.3;
    ctx.fillStyle = '#0F172A';
    ctx.beginPath();
    ctx.arc(4.6, -2.5, pupilR, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(3.8, -3.4, 0.9, 0, Math.PI * 2);
    ctx.fill();

    // Cool determined brow during Tuck or Fever Zoomies!
    if (tucking || feverFactor > 0.3) {
      ctx.strokeStyle = '#0F172A';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(-0.5, -6.5);
      ctx.lineTo(7.5, -4.5);
      ctx.stroke();
    }
  }

  // Jaunty Blue & White Coastal Sailor Cap + Fluttering Ribbon!
  ctx.save();
  ctx.translate(-2, -9.5);
  ctx.rotate(-0.18);
  // Fluttering blue cap tails
  const ribbonWave = Math.sin(time * 20) * 3;
  ctx.strokeStyle = '#1D4ED8';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(-7, 2);
  ctx.quadraticCurveTo(-14, 3 + ribbonWave, -19, 6 - ribbonWave * 0.5);
  ctx.stroke();

  // Sailor cap band & puffed crown
  ctx.fillStyle = '#FFFFFF';
  ctx.strokeStyle = '#0F172A';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(0, -2, 8.5, 4.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#0284C7';
  ctx.fillRect(-7, 0, 14, 3.5);
  ctx.strokeRect(-7, 0, 14, 3.5);
  ctx.restore();

  ctx.restore(); // end head
  ctx.restore(); // end torso

  // --- E. NEAR PELICAN LEG (in front of bicycle frame) ---
  drawPelicanLeg(ctx, hipX, hipY, nearPedalX, nearPedalY, '#F97316', '#EA580C');

  ctx.restore();
}

function drawPelicanLeg(
  ctx: CanvasRenderingContext2D,
  hipX: number,
  hipY: number,
  pedalX: number,
  pedalY: number,
  legColor: string,
  footColor: string
): void {
  const { kneeX, kneeY } = solveLegIK(hipX, hipY, pedalX, pedalY, 21, 21);

  // Dark outline for leg readability
  ctx.strokeStyle = '#0F172A';
  ctx.lineWidth = 6.2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(hipX, hipY);
  ctx.lineTo(kneeX, kneeY);
  ctx.lineTo(pedalX, pedalY);
  ctx.stroke();

  // Bright orange bird leg
  ctx.strokeStyle = legColor;
  ctx.lineWidth = 3.4;
  ctx.beginPath();
  ctx.moveTo(hipX, hipY);
  ctx.lineTo(kneeX, kneeY);
  ctx.lineTo(pedalX, pedalY);
  ctx.stroke();

  // Comical webbed pelican foot on the pedal!
  ctx.fillStyle = footColor;
  ctx.strokeStyle = '#0F172A';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(pedalX - 3, pedalY - 2);
  ctx.lineTo(pedalX + 9, pedalY - 2);
  ctx.lineTo(pedalX + 7, pedalY + 3);
  ctx.lineTo(pedalX - 4, pedalY + 2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

function drawBicycleWheel(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  angle: number
): void {
  // Rotating spokes
  ctx.strokeStyle = 'rgba(241, 245, 249, 0.85)';
  ctx.lineWidth = 1.5;
  const spokeCount = 6;
  for (let i = 0; i < spokeCount; i++) {
    const a = angle + (i * Math.PI) / (spokeCount * 0.5);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(a) * (r - 3), cy + Math.sin(a) * (r - 3));
    ctx.stroke();
  }

  // Cream whitewall inner tire ring
  ctx.strokeStyle = '#FEF3C7';
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.arc(cx, cy, r - 2.8, 0, Math.PI * 2);
  ctx.stroke();

  // Outer rubber tire
  ctx.strokeStyle = '#1E293B';
  ctx.lineWidth = 4.2;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();

  // Chrome hub
  ctx.fillStyle = '#E2E8F0';
  ctx.beginPath();
  ctx.arc(cx, cy, 3.2, 0, Math.PI * 2);
  ctx.fill();
}

function drawParticles(
  ctx: CanvasRenderingContext2D,
  particles: Particle[]
): void {
  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    if (!p.active) continue;

    const progress = p.life / p.maxLife;
    const alpha = Math.max(0, p.alpha * (1 - progress));
    if (alpha <= 0.01) continue;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);

    if (p.kind === 'feather') {
      // Fluttering coastal white/cream feather!
      ctx.fillStyle = p.color;
      ctx.strokeStyle = 'rgba(15, 23, 42, 0.45)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.ellipse(0, 0, p.size * 1.35, p.size * 0.52, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      // Feather quill line
      ctx.beginPath();
      ctx.moveTo(-p.size * 1.4, 0);
      ctx.lineTo(p.size * 1.4, 0);
      ctx.stroke();
    } else if (p.kind === 'ring') {
      const ringRadius = p.size * (0.4 + progress * 1.7);
      ctx.strokeStyle = p.color;
      ctx.lineWidth = Math.max(1.5, 4 * (1 - progress));
      ctx.beginPath();
      ctx.arc(0, 0, ringRadius, 0, Math.PI * 2);
      ctx.stroke();
    } else if (p.kind === 'wind') {
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 2.4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-p.size, 0);
      ctx.lineTo(p.size, 0);
      ctx.stroke();
    } else if (p.kind === 'scale' || p.kind === 'spark') {
      // Sparkling 4-point star or diamond scale
      const sz = p.size * (1 - progress * 0.4);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.moveTo(0, -sz);
      ctx.lineTo(sz * 0.55, 0);
      ctx.lineTo(0, sz);
      ctx.lineTo(-sz * 0.55, 0);
      ctx.closePath();
      ctx.fill();
    } else {
      // Dust puff / confetti circle
      const sz = p.size * (p.kind === 'dust' ? 0.7 + progress * 0.7 : 1);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(0, 0, sz, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}

function drawPopups(
  ctx: CanvasRenderingContext2D,
  popups: FloatingPopup[]
): void {
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  for (let i = 0; i < popups.length; i++) {
    const pop = popups[i];
    if (!pop.active) continue;

    const progress = pop.life / pop.maxLife;
    // Snappy pop-in spring scale in first 18% of lifetime
    const springScale =
      progress < 0.18
        ? 0.5 + (progress / 0.18) * 0.65
        : 1.15 - ((progress - 0.18) / 0.82) * 0.15;
    const alpha = progress > 0.68 ? 1 - (progress - 0.68) / 0.32 : 1;

    ctx.save();
    ctx.globalAlpha = Math.max(0, alpha);
    ctx.translate(pop.x, pop.y);
    ctx.scale(pop.scale * springScale, pop.scale * springScale);

    ctx.font = `700 22px 'Fredoka', system-ui, sans-serif`;
    ctx.lineJoin = 'round';
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#0F172A';
    ctx.strokeText(pop.text, 0, 0);
    ctx.fillStyle = pop.color;
    ctx.fillText(pop.text, 0, 0);

    if (pop.subtext) {
      ctx.font = `700 13px 'Plus Jakarta Sans', system-ui, sans-serif`;
      ctx.lineWidth = 3.5;
      ctx.strokeText(pop.subtext, 0, 20);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(pop.subtext, 0, 20);
    }

    ctx.restore();
  }
}
