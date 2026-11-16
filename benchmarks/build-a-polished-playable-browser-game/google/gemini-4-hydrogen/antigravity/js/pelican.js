(function (global) {
  'use strict';

  const PelicanGame = (global.PelicanGame = global.PelicanGame || {});
  const CFG = PelicanGame.CONFIG;

  function normalizeAngle(rad) {
    let a = rad % (Math.PI * 2);
    if (a > Math.PI) a -= Math.PI * 2;
    if (a < -Math.PI) a += Math.PI * 2;
    return a;
  }

  class PelicanRider {
    constructor() {
      this.scarf = [];
      this.reset();
    }

    reset() {
      this.x = 180;
      this.y = CFG.GROUND_Y;
      this.vy = 0;
      this.speed = CFG.BASE_SPEED;
      this.boostPadTimer = 0;

      this.onGround = true;
      this.wasOnRamp = false;
      this.coyoteTimer = 0;
      this.jumpBuffer = 0;
      this.jumpHoldTimer = 0;
      this.flapAvailable = true;
      this.diving = false;
      this.ducking = false;
      this.duckBlend = 0;

      this.angle = 0;
      this.airSpinAccum = 0;
      this.flipsCompleted = 0;
      this.wheelieTimer = 0;
      this.isWheelie = false;

      this.squashX = 1;
      this.squashY = 1;
      this.pedalPhase = 0;
      this.wheelRot = 0;

      this.wingFlapAnim = 0;
      this.beakOpen = 0;
      this.pouchBulge = 0;
      this.squawkTimer = 0;

      this.hearts = CFG.MAX_HEARTS;
      this.invulnTimer = 0;
      this.dead = false;

      this.scarf = [];
      for (let i = 0; i < 6; i += 1) {
        this.scarf.push({ x: -12 - i * 8, y: -62 });
      }
    }

    queueJump() {
      this.jumpBuffer = CFG.JUMP_BUFFER_TIME;
    }

    getHurtbox() {
      const h = this.duckBlend > 0.45 ? 46 : 74;
      return {
        x: this.x - 20,
        y: this.y - h,
        w: 40,
        h: h - 4
      };
    }

    getScoopCenter() {
      return {
        x: this.x + 18,
        y: this.y - (this.duckBlend > 0.45 ? 36 : 58)
      };
    }

    triggerBeakOpen() {
      this.beakOpen = Math.max(this.beakOpen, 0.9);
    }

    triggerGulp() {
      this.pouchBulge = 1.0;
      this.beakOpen = 0.35;
    }

    triggerSquawk() {
      this.squawkTimer = 0.45;
      this.beakOpen = 1.0;
    }

    bounce(vy, refreshFlap, particles) {
      this.vy = vy;
      this.onGround = false;
      this.diving = false;
      this.coyoteTimer = 0;
      if (refreshFlap) this.flapAvailable = true;
      this.squashX = 0.78;
      this.squashY = 1.28;
      if (particles) {
        particles.emitFeathers(this.x, this.y - 45, 4, 0.8);
      }
    }

    update(dt, elapsedSec, input, world, particles, audio, feverActive, callbacks) {
      const prevY = this.y;
      const surfaceBefore = world.getSurfaceAt(this.x);

      // Timers
      if (this.invulnTimer > 0) this.invulnTimer = Math.max(0, this.invulnTimer - dt);
      if (this.boostPadTimer > 0) this.boostPadTimer = Math.max(0, this.boostPadTimer - dt);
      if (this.jumpBuffer > 0) this.jumpBuffer = Math.max(0, this.jumpBuffer - dt);
      if (this.wingFlapAnim > 0) this.wingFlapAnim = Math.max(0, this.wingFlapAnim - dt * 3.4);
      if (this.beakOpen > 0) this.beakOpen = Math.max(0, this.beakOpen - dt * 4.2);
      if (this.pouchBulge > 0) this.pouchBulge = Math.max(0, this.pouchBulge - dt * 2.6);
      if (this.squawkTimer > 0) this.squawkTimer = Math.max(0, this.squawkTimer - dt);

      // Squash & stretch recovery
      this.squashX += (1 - this.squashX) * Math.min(1, dt * 14);
      this.squashY += (1 - this.squashY) * Math.min(1, dt * 14);

      // Target horizontal speed
      const cruiseBase = Math.min(CFG.MAX_CRUISE_SPEED, CFG.BASE_SPEED + elapsedSec * CFG.SPEED_RAMP_PER_SEC);
      let targetSpeed = cruiseBase;
      if (input.right && this.onGround) targetSpeed += CFG.PEDAL_BOOST_BONUS;
      if (this.ducking) targetSpeed += 26;
      if (this.isWheelie) targetSpeed *= 0.95;
      if (this.boostPadTimer > 0) targetSpeed += CFG.BOOST_PAD_IMPULSE;
      if (feverActive) targetSpeed += CFG.FEVER_SPEED_BONUS;

      this.speed += (targetSpeed - this.speed) * Math.min(1, dt * 6.5);
      const dx = this.speed * dt;
      this.x += dx;

      // Spin wheels & pedal crank proportional to speed
      this.wheelRot += dx / 16;
      const pedalRate = (input.right && this.onGround) ? 1.45 : 1.0;
      this.pedalPhase += (dx / 16) * 0.72 * pedalRate;

      // Ducking blend
      this.ducking = this.onGround && input.down;
      const targetDuck = (this.ducking || this.diving) ? 1 : 0;
      this.duckBlend += (targetDuck - this.duckBlend) * Math.min(1, dt * 16);

      // Handle jump or mid-air wing-flap
      if (this.jumpBuffer > 0) {
        if (this.onGround || this.coyoteTimer > 0) {
          this.jumpBuffer = 0;
          this.coyoteTimer = 0;
          this.onGround = false;
          this.diving = false;
          this.ducking = false;
          const rampBonus = surfaceBefore.onRamp ? -115 : 0;
          this.vy = CFG.JUMP_IMPULSE + rampBonus;
          this.jumpHoldTimer = CFG.JUMP_HOLD_MAX_TIME;
          this.squashX = 0.82;
          this.squashY = 1.24;
          particles.emitDust(this.x - 14, this.y, 7, -this.speed * 0.15);
          audio.playJump();
        } else if (this.flapAvailable) {
          // Wing-Flap mid-air!
          this.jumpBuffer = 0;
          this.flapAvailable = false;
          this.diving = false;
          this.vy = Math.min(this.vy * 0.15, 0) + CFG.FLAP_IMPULSE;
          this.jumpHoldTimer = 0;
          this.wingFlapAnim = 1.0;
          this.squashX = 0.86;
          this.squashY = 1.18;
          particles.emitFeathers(this.x - 6, this.y - 52, 7, 1.0);
          particles.emitRing(this.x, this.y - 42, 'rgba(255, 250, 235, 0.75)', 52);
          audio.playFlap();
        }
      }

      // Variable jump hold
      if (this.jumpHoldTimer > 0 && input.jumpHeld && this.vy < 0) {
        this.jumpHoldTimer -= dt;
      } else {
        this.jumpHoldTimer = 0;
      }

      // Dive-Slam in mid-air
      if (!this.onGround && input.down) {
        if (!this.diving) {
          this.diving = true;
          this.vy = Math.max(this.vy, CFG.DIVE_VELOCITY * 0.75);
          this.squashX = 0.8;
          this.squashY = 1.25;
        }
      }

      // Apply vertical gravity
      if (!this.onGround) {
        let gMult = 1;
        if (this.jumpHoldTimer > 0 && this.vy < 0) {
          gMult = CFG.JUMP_HOLD_GRAVITY_MULT;
        } else if (this.diving) {
          gMult = CFG.DIVE_GRAVITY_MULT;
        } else if (feverActive && this.vy > 0) {
          gMult = 0.82; // Slight heroic float during Fever
        }
        this.vy += CFG.GRAVITY * gMult * dt;
        if (this.diving) {
          this.vy = Math.min(this.vy, CFG.DIVE_VELOCITY * 1.35);
        }
        this.y += this.vy * dt;
      }

      // Surface / ground collision check
      const surfaceNow = world.getSurfaceAt(this.x);
      if (this.onGround) {
        if (surfaceNow.solid && this.y >= surfaceNow.y - 8) {
          this.y = surfaceNow.y;
          this.vy = 0;
          this.coyoteTimer = CFG.COYOTE_TIME;
          this.wasOnRamp = surfaceNow.onRamp;
        } else {
          // Rolled off ramp lip or pier edge!
          this.onGround = false;
          this.coyoteTimer = CFG.COYOTE_TIME;
          if (this.wasOnRamp && surfaceBefore.onRamp) {
            // Ramp natural launch boost!
            this.vy = -310 - Math.min(180, (this.speed - CFG.BASE_SPEED) * 0.45);
            particles.emitDust(this.x, this.y, 6, -50);
            if (callbacks && callbacks.onRampLaunch) {
              callbacks.onRampLaunch(this.x, this.y - 75);
            }
          }
          this.wasOnRamp = false;
        }
      } else {
        if (this.coyoteTimer > 0) {
          this.coyoteTimer = Math.max(0, this.coyoteTimer - dt);
        }

        // Landing onto solid ground or ramp
        if (surfaceNow.solid && this.vy >= 0 && prevY <= surfaceNow.y + 18 && this.y >= surfaceNow.y) {
          const impactVy = this.vy;
          const wasDiving = this.diving;
          this.y = surfaceNow.y;
          this.vy = 0;
          this.onGround = true;
          this.diving = false;
          this.flapAvailable = true;
          this.wasOnRamp = surfaceNow.onRamp;

          // Check flip landing!
          const norm = normalizeAngle(this.angle);
          const badAngle = !feverActive && Math.abs(norm) > CFG.LANDING_SAFE_RAD;

          if (badAngle) {
            this.angle = 0;
            this.airSpinAccum = 0;
            this.flipsCompleted = 0;
            this.squashX = 1.32;
            this.squashY = 0.72;
            if (callbacks && callbacks.onBadLanding) {
              callbacks.onBadLanding();
            }
          } else {
            this.angle = surfaceNow.onRamp ? Math.atan(surfaceNow.slope) : 0;
            if (this.flipsCompleted > 0 && callbacks && callbacks.onFlipsLanded) {
              callbacks.onFlipsLanded(this.flipsCompleted, this.x, this.y - 80);
            }
            this.airSpinAccum = 0;
            this.flipsCompleted = 0;

            const sq = Math.min(0.32, impactVy / 2200);
            this.squashX = 1 + sq;
            this.squashY = 1 - sq * 0.85;
            particles.emitDust(this.x, this.y, wasDiving ? 12 : 6, -this.speed * 0.14);
            audio.playLand();
            if (wasDiving && callbacks && callbacks.onDiveLand) {
              callbacks.onDiveLand(this.x, this.y);
            }
          }
        }
      }

      // Wheelie & Air Flip Rotation
      if (this.onGround) {
        this.airSpinAccum = 0;
        this.flipsCompleted = 0;
        const slopeAngle = surfaceNow.onRamp ? Math.atan(surfaceNow.slope) : 0;
        if (input.left && !this.ducking) {
          const target = slopeAngle + CFG.WHEELIE_TARGET_ANGLE;
          this.angle += (target - this.angle) * Math.min(1, dt * 11);
        } else {
          this.angle += (slopeAngle - this.angle) * Math.min(1, dt * 14);
        }

        if (this.angle < CFG.WHEELIE_THRESHOLD_ANGLE && !surfaceNow.onRamp) {
          this.isWheelie = true;
          this.wheelieTimer += dt;
          if (Math.random() < dt * 26) {
            particles.emitSparks(this.x - 24, this.y - 2, 1);
          }
          if (this.wheelieTimer >= CFG.WHEELIE_TICK_INTERVAL) {
            this.wheelieTimer -= CFG.WHEELIE_TICK_INTERVAL;
            if (callbacks && callbacks.onWheelieTick) {
              callbacks.onWheelieTick(this.x - 10, this.y - 78);
            }
          }
        } else {
          this.isWheelie = false;
          this.wheelieTimer = 0;
        }
      } else {
        this.isWheelie = false;
        this.wheelieTimer = 0;
        if (input.left) {
          const dA = CFG.FLIP_SPEED_BACK * dt;
          this.angle += dA;
          this.airSpinAccum += dA;
        } else if (input.right) {
          const dA = CFG.FLIP_SPEED_FRONT * dt;
          this.angle += dA;
          this.airSpinAccum += dA;
        } else {
          // Gentle auto-level assist near upright
          const norm = normalizeAngle(this.angle);
          const targetTilt = this.diving ? 0.42 : Math.max(-0.22, Math.min(0.28, this.vy * 0.00045));
          if (Math.abs(norm) < 1.15) {
            this.angle += (targetTilt - norm) * Math.min(1, dt * 6.5);
          }
        }

        // Detect full 360 flips mid-air!
        const completed = Math.floor((Math.abs(this.airSpinAccum) + 0.55) / (Math.PI * 2));
        if (completed > this.flipsCompleted) {
          const isBack = this.airSpinAccum < 0;
          this.flipsCompleted = completed;
          particles.emitConfetti(this.x, this.y - 50, 10);
          audio.playTrick();
          if (callbacks && callbacks.onAirFlip) {
            callbacks.onAirFlip(isBack, completed, this.x, this.y - 95);
          }
        }
      }

      // Update trailing scarf physics (in local space relative to neck)
      const headDrop = this.duckBlend * 22;
      const neckX = -6 + this.duckBlend * 8;
      const neckY = -62 + headDrop;
      this.scarf[0].x = neckX;
      this.scarf[0].y = neckY;
      for (let i = 1; i < this.scarf.length; i += 1) {
        const prev = this.scarf[i - 1];
        const seg = this.scarf[i];
        const wave = Math.sin(elapsedSec * 18 - i * 1.1) * (2.5 + (this.speed / 350) * 2.0);
        const targetX = prev.x - 8.5;
        const targetY = prev.y + wave * 0.45 + Math.max(-4, Math.min(5, this.vy * 0.006));
        seg.x += (targetX - seg.x) * Math.min(1, dt * 22);
        seg.y += (targetY - seg.y) * Math.min(1, dt * 22);
      }
    }

    draw(ctx, time, feverActive, lanternGlow) {
      // Blink slightly while invulnerable after taking damage
      if (this.invulnTimer > 0 && Math.floor(this.invulnTimer * 18) % 2 === 1) {
        ctx.save();
        ctx.globalAlpha = 0.48;
        this._drawRig(ctx, time, feverActive, lanternGlow);
        ctx.restore();
      } else {
        this._drawRig(ctx, time, feverActive, lanternGlow);
      }
    }

    _drawRig(ctx, time, feverActive, lanternGlow) {
      ctx.save();
      ctx.translate(this.x, this.y);

      // Rotate around rear wheel when wheelieing on ground, or around bike center in air
      if (this.onGround) {
        ctx.translate(-24, -16);
        ctx.rotate(this.angle);
        ctx.translate(24, 16);
      } else {
        ctx.translate(0, -40);
        ctx.rotate(this.angle);
        ctx.translate(0, 40);
      }

      ctx.scale(this.squashX, this.squashY);

      // Fever glowing halo behind rider
      if (feverActive) {
        const pulse = 1 + Math.sin(time * 16) * 0.08;
        ctx.save();
        ctx.globalAlpha = 0.34;
        ctx.fillStyle = '#ffd166';
        ctx.beginPath();
        ctx.arc(0, -46, 56 * pulse, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Soft ground shadow when near boardwalk
      if (this.onGround) {
        ctx.fillStyle = 'rgba(19, 41, 61, 0.24)';
        ctx.beginPath();
        ctx.ellipse(0, 2, 34, 5, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      // Headlight beam in dusk/twilight
      if (lanternGlow > 0.15) {
        ctx.save();
        ctx.globalAlpha = lanternGlow * 0.26;
        const beam = ctx.createLinearGradient(32, -46, 220, -25);
        beam.addColorStop(0, '#fff3b0');
        beam.addColorStop(1, 'rgba(255, 243, 176, 0)');
        ctx.fillStyle = beam;
        ctx.beginPath();
        ctx.moveTo(30, -46);
        ctx.lineTo(220, -82);
        ctx.lineTo(220, 6);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      // 1) Wheels
      this._drawWheel(ctx, -24, -16, 16);
      this._drawWheel(ctx, 25, -16, 16);

      // 2) Trailing Scarf (behind head/neck)
      ctx.save();
      ctx.strokeStyle = feverActive ? '#ffd166' : '#ff5a3c';
      ctx.lineWidth = 7;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(this.scarf[0].x, this.scarf[0].y);
      for (let i = 1; i < this.scarf.length; i += 1) {
        ctx.lineTo(this.scarf[i].x, this.scarf[i].y);
      }
      ctx.stroke();
      ctx.strokeStyle = '#fff3e0';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();

      // 3) Back wing (when flapping)
      if (this.wingFlapAnim > 0.02) {
        this._drawWing(ctx, -6, -54, -1, this.wingFlapAnim);
      }

      // 4) Vintage Mint Beach Cruiser Frame
      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // Frame tubes
      ctx.strokeStyle = '#1db9aa';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(-24, -16); // rear axle
      ctx.lineTo(-2, -16);  // crank bottom bracket
      ctx.lineTo(-10, -42); // seat tube
      ctx.lineTo(16, -42);  // top bar
      ctx.lineTo(-2, -16);  // down tube
      ctx.moveTo(-24, -16);
      ctx.lineTo(-10, -40); // seat stay
      ctx.stroke();

      // Front fork + stem
      ctx.strokeStyle = '#15988c';
      ctx.lineWidth = 4.5;
      ctx.beginPath();
      ctx.moveTo(25, -16);
      ctx.lineTo(14, -50);
      ctx.stroke();

      // Chrome handlebars + brass bell + front lamp
      ctx.strokeStyle = '#f2f7fa';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(14, -50);
      ctx.quadraticCurveTo(10, -56, 3, -55);
      ctx.stroke();

      // Tiny brass bell
      ctx.fillStyle = '#ffb703';
      ctx.beginPath();
      ctx.arc(10, -54, 3.2, 0, Math.PI * 2);
      ctx.fill();

      // Headlamp
      ctx.fillStyle = '#fff3b0';
      ctx.strokeStyle = '#13293d';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(22, -46, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Leather saddle
      ctx.fillStyle = '#8b4e24';
      ctx.beginPath();
      ctx.ellipse(-12, -45, 9, 4, -0.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // 5) Pelican Rider!
      const duck = this.duckBlend;
      const bodyX = -8 + duck * 7;
      const bodyY = -56 + duck * 12;
      const bodyTilt = duck * 0.48 + (this.diving ? 0.35 : 0);

      // Far leg pedaling
      const ped1X = -2 + Math.cos(this.pedalPhase + Math.PI) * 8;
      const ped1Y = -16 + Math.sin(this.pedalPhase + Math.PI) * 8;
      this._drawPelicanLeg(ctx, bodyX - 2, bodyY + 12, ped1X, ped1Y, '#e07a22');

      // Pelican plump torso
      ctx.save();
      ctx.translate(bodyX, bodyY);
      ctx.rotate(bodyTilt);

      // Tail feathers
      ctx.fillStyle = '#8f7d6a';
      ctx.beginPath();
      ctx.moveTo(-14, 4);
      ctx.lineTo(-27, -2);
      ctx.lineTo(-23, 8);
      ctx.closePath();
      ctx.fill();

      // White-cream body
      ctx.fillStyle = '#fff9ef';
      ctx.strokeStyle = '#13293d';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.ellipse(0, 2, 16, 13, -0.25, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Folded brown-slate wing (when not mid-flap)
      if (this.wingFlapAnim <= 0.05) {
        ctx.fillStyle = '#b49e84';
        ctx.strokeStyle = '#13293d';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.ellipse(-3, 2, 12, 7.5, -0.15, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }

      // Neck & Head
      const headX = 11 + duck * 3;
      const headY = -15 + duck * 8;

      ctx.fillStyle = '#fff9ef';
      ctx.strokeStyle = '#13293d';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(4, -5);
      ctx.quadraticCurveTo(8, -14, headX, headY);
      ctx.lineTo(headX + 5, headY + 6);
      ctx.quadraticCurveTo(13, 2, 10, 4);
      ctx.closePath();
      ctx.fill();

      // Head circle
      ctx.beginPath();
      ctx.arc(headX, headY, 9.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Jaunty crest tuft
      ctx.fillStyle = '#fff3dc';
      ctx.beginPath();
      ctx.moveTo(headX - 4, headY - 8);
      ctx.lineTo(headX - 10, headY - 14);
      ctx.lineTo(headX, headY - 9.5);
      ctx.closePath();
      ctx.fill();

      // Giant Pelican Beak + Elastic Pouch!
      const openAngle = this.beakOpen * 0.45 + (this.squawkTimer > 0 ? 0.25 : 0);
      const bulge = 1 + this.pouchBulge * 0.95;

      // Upper beak
      ctx.save();
      ctx.translate(headX + 6, headY - 2);
      ctx.rotate(-openAngle * 0.4);
      ctx.fillStyle = '#ffb703';
      ctx.strokeStyle = '#13293d';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, -3.5);
      ctx.lineTo(28, 0.5);
      ctx.quadraticCurveTo(30, 3.5, 25, 4.5);
      ctx.lineTo(0, 2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      // Lower gullet pouch
      ctx.save();
      ctx.translate(headX + 6, headY + 1);
      ctx.rotate(openAngle);
      ctx.fillStyle = '#ff9234';
      ctx.strokeStyle = '#13293d';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(26, 1);
      ctx.quadraticCurveTo(18, 12 * bulge, 0, 7 * bulge);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      // Aviator Goggles!
      ctx.fillStyle = '#334e68';
      ctx.fillRect(headX - 9, headY - 5.5, 11, 3.5);
      ctx.fillStyle = '#5eead4';
      ctx.strokeStyle = '#13293d';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(headX + 2.5, headY - 3.5, 4.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      // Lens shine
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(headX + 4, headY - 5, 1.4, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore(); // end torso/head

      // Front wing (when mid-flap!)
      if (this.wingFlapAnim > 0.02) {
        this._drawWing(ctx, bodyX - 1, bodyY - 2, 1, this.wingFlapAnim);
      }

      // Near leg pedaling + pedal crank
      const ped2X = -2 + Math.cos(this.pedalPhase) * 8;
      const ped2Y = -16 + Math.sin(this.pedalPhase) * 8;
      this._drawPelicanLeg(ctx, bodyX, bodyY + 12, ped2X, ped2Y, '#ff922b');

      // Pedal crank disk & pedals
      ctx.strokeStyle = '#d9e2ec';
      ctx.lineWidth = 2.8;
      ctx.beginPath();
      ctx.moveTo(ped1X, ped1Y);
      ctx.lineTo(ped2X, ped2Y);
      ctx.stroke();

      ctx.fillStyle = '#ffb703';
      ctx.beginPath();
      ctx.arc(-2, -16, 4.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#13293d';
      ctx.fillRect(ped2X - 4, ped2Y - 2, 8, 4);

      ctx.restore();
    }

    _drawWheel(ctx, cx, cy, r) {
      ctx.save();
      ctx.translate(cx, cy);

      // Tire
      ctx.strokeStyle = '#1d2d3e';
      ctx.lineWidth = 4.5;
      ctx.beginPath();
      ctx.arc(0, 0, r - 1.5, 0, Math.PI * 2);
      ctx.stroke();

      // Cream whitewall inner rim
      ctx.strokeStyle = '#fff5df';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, r - 4.5, 0, Math.PI * 2);
      ctx.stroke();

      // Rotating spokes
      ctx.rotate(this.wheelRot);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.72)';
      ctx.lineWidth = 1.4;
      for (let i = 0; i < 4; i += 1) {
        const a = (i * Math.PI) / 4;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * (r - 5), Math.sin(a) * (r - 5));
        ctx.lineTo(-Math.cos(a) * (r - 5), -Math.sin(a) * (r - 5));
        ctx.stroke();
      }

      // Hub
      ctx.fillStyle = '#ffb703';
      ctx.beginPath();
      ctx.arc(0, 0, 3.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    _drawPelicanLeg(ctx, hipX, hipY, footX, footY, color) {
      const midX = (hipX + footX) * 0.5 + 5;
      const midY = (hipY + footY) * 0.5 - 3;
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = 3.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(hipX, hipY);
      ctx.lineTo(midX, midY);
      ctx.lineTo(footX, footY);
      ctx.stroke();

      // Orange webbed foot
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.ellipse(footX + 3, footY + 1, 6, 3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    _drawWing(ctx, x, y, side, anim) {
      const sweep = Math.sin(anim * Math.PI) * 34;
      ctx.save();
      ctx.translate(x, y);
      ctx.fillStyle = side > 0 ? '#fff9ef' : '#e0d3be';
      ctx.strokeStyle = '#13293d';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(-22, -26 - sweep * 0.5, -44, -8 + sweep * 0.7);
      ctx.quadraticCurveTo(-24, 10 + sweep * 0.3, 0, 6);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
  }

  PelicanGame.PelicanRider = PelicanRider;
})(window);
