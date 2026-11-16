(function (global) {
  'use strict';

  const PelicanGame = (global.PelicanGame = global.PelicanGame || {});
  const CFG = PelicanGame.CONFIG;

  class ParticleSystem {
    constructor() {
      this.particles = [];
      this.popups = [];
      this.speedLines = [];
    }

    clear() {
      this.particles.length = 0;
      this.popups.length = 0;
      this.speedLines.length = 0;
    }

    _push(p) {
      if (this.particles.length >= CFG.MAX_PARTICLES) {
        this.particles.shift();
      }
      this.particles.push(p);
    }

    emitDust(x, y, count, vxBase) {
      for (let i = 0; i < count; i += 1) {
        this._push({
          kind: 'dust',
          x: x + (Math.random() - 0.5) * 14,
          y: y + (Math.random() - 0.5) * 6,
          vx: (vxBase || -60) + (Math.random() - 0.5) * 110,
          vy: -25 - Math.random() * 80,
          size: 4 + Math.random() * 6,
          life: 0.35 + Math.random() * 0.25,
          maxLife: 0.55,
          color: Math.random() < 0.5 ? '#f5dfc2' : '#e6c39c',
          gravity: 160
        });
      }
    }

    emitSparks(x, y, count, colorOverride) {
      for (let i = 0; i < count; i += 1) {
        const angle = -Math.PI * (0.65 + Math.random() * 0.32);
        const spd = 120 + Math.random() * 190;
        this._push({
          kind: 'spark',
          x,
          y,
          vx: Math.cos(angle) * spd - 40,
          vy: Math.sin(angle) * spd,
          size: 2.2 + Math.random() * 2.8,
          life: 0.24 + Math.random() * 0.2,
          maxLife: 0.44,
          color: colorOverride || (Math.random() < 0.5 ? '#ffd166' : '#ff7b3a'),
          gravity: 520
        });
      }
    }

    emitFeathers(x, y, count, speedScale) {
      const mul = speedScale || 1;
      for (let i = 0; i < count; i += 1) {
        this._push({
          kind: 'feather',
          x: x + (Math.random() - 0.5) * 20,
          y: y + (Math.random() - 0.5) * 16,
          vx: (-70 + (Math.random() - 0.5) * 220) * mul,
          vy: (-120 - Math.random() * 160) * mul,
          size: 7 + Math.random() * 5,
          rot: Math.random() * Math.PI * 2,
          vrot: (Math.random() - 0.5) * 8,
          phase: Math.random() * Math.PI * 2,
          life: 0.65 + Math.random() * 0.45,
          maxLife: 1.05,
          color: Math.random() < 0.78 ? '#fffdf8' : '#e7dcc8',
          gravity: 220
        });
      }
    }

    emitSplash(x, y, count, tint) {
      for (let i = 0; i < count; i += 1) {
        const angle = -Math.PI * (0.15 + Math.random() * 0.7);
        const spd = 150 + Math.random() * 270;
        this._push({
          kind: 'splash',
          x,
          y,
          vx: Math.cos(angle) * spd,
          vy: Math.sin(angle) * spd,
          size: 3 + Math.random() * 4.5,
          life: 0.42 + Math.random() * 0.35,
          maxLife: 0.75,
          color: tint || (Math.random() < 0.5 ? '#a8f2ff' : '#ffffff'),
          gravity: 780
        });
      }
    }

    emitConfetti(x, y, count) {
      const palette = ['#ff6b4a', '#ffb703', '#2ec4b6', '#ffffff', '#ff9f1c'];
      for (let i = 0; i < count; i += 1) {
        const angle = Math.random() * Math.PI * 2;
        const spd = 110 + Math.random() * 260;
        this._push({
          kind: 'confetti',
          x,
          y,
          vx: Math.cos(angle) * spd,
          vy: Math.sin(angle) * spd - 120,
          size: 5 + Math.random() * 4,
          rot: Math.random() * Math.PI * 2,
          vrot: (Math.random() - 0.5) * 14,
          life: 0.55 + Math.random() * 0.4,
          maxLife: 0.95,
          color: palette[i % palette.length],
          gravity: 540
        });
      }
    }

    emitSplinters(x, y, count) {
      for (let i = 0; i < count; i += 1) {
        const angle = -Math.PI * (0.1 + Math.random() * 0.8);
        const spd = 160 + Math.random() * 250;
        this._push({
          kind: 'splinter',
          x: x + (Math.random() - 0.5) * 20,
          y: y + (Math.random() - 0.5) * 20,
          vx: Math.cos(angle) * spd,
          vy: Math.sin(angle) * spd - 40,
          size: 7 + Math.random() * 7,
          rot: Math.random() * Math.PI * 2,
          vrot: (Math.random() - 0.5) * 15,
          life: 0.5 + Math.random() * 0.35,
          maxLife: 0.85,
          color: Math.random() < 0.5 ? '#c88246' : '#9c5b28',
          gravity: 880
        });
      }
    }

    emitRing(x, y, color, endRadius) {
      this._push({
        kind: 'ring',
        x,
        y,
        vx: 0,
        vy: 0,
        size: 12,
        endRadius: endRadius || 76,
        life: 0.32,
        maxLife: 0.32,
        color: color || '#ffd166',
        gravity: 0
      });
    }

    emitSpeedLine(viewWidth, viewHeight) {
      if (this.speedLines.length > 26) return;
      this.speedLines.push({
        x: viewWidth + 40,
        y: Math.random() * viewHeight,
        len: 70 + Math.random() * 140,
        speed: 1300 + Math.random() * 700,
        alpha: 0.14 + Math.random() * 0.22
      });
    }

    addPopup(x, y, text, color, scale) {
      if (this.popups.length >= CFG.MAX_POPUPS) {
        this.popups.shift();
      }
      this.popups.push({
        x,
        y,
        vy: -76,
        text,
        color: color || '#fff4cf',
        scale: scale || 1,
        life: 0.92,
        maxLife: 0.92
      });
    }

    update(dt, worldDx) {
      for (let i = this.particles.length - 1; i >= 0; i -= 1) {
        const p = this.particles[i];
        p.life -= dt;
        if (p.life <= 0) {
          this.particles.splice(i, 1);
          continue;
        }
        p.x += p.vx * dt - (p.kind === 'ring' ? worldDx * 0.75 : worldDx * 0.3);
        p.y += p.vy * dt;
        p.vy += p.gravity * dt;

        if (p.kind === 'feather') {
          p.vx *= 1 - 2.4 * dt;
          p.vy = Math.min(p.vy, 95);
          p.x += Math.sin(p.phase + p.life * 11) * 32 * dt;
          p.rot += p.vrot * dt;
        } else if (p.kind === 'confetti' || p.kind === 'splinter') {
          p.rot += p.vrot * dt;
        }
      }

      for (let i = this.popups.length - 1; i >= 0; i -= 1) {
        const pop = this.popups[i];
        pop.life -= dt;
        if (pop.life <= 0) {
          this.popups.splice(i, 1);
          continue;
        }
        pop.y += pop.vy * dt;
        pop.vy *= 1 - 3.0 * dt;
        pop.x -= worldDx * 0.12;
      }

      for (let i = this.speedLines.length - 1; i >= 0; i -= 1) {
        const sl = this.speedLines[i];
        sl.x -= sl.speed * dt;
        if (sl.x + sl.len < -20) {
          this.speedLines.splice(i, 1);
        }
      }
    }

    drawWorld(ctx) {
      for (let i = 0; i < this.particles.length; i += 1) {
        const p = this.particles[i];
        const t = Math.max(0, p.life / p.maxLife);
        ctx.save();
        ctx.globalAlpha = Math.min(1, t * 1.35);

        if (p.kind === 'dust' || p.kind === 'splash' || p.kind === 'spark') {
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, Math.max(1, p.size * (p.kind === 'dust' ? 1.15 - t * 0.35 : t)), 0, Math.PI * 2);
          ctx.fill();
        } else if (p.kind === 'feather') {
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.ellipse(0, 0, p.size, p.size * 0.38, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = 'rgba(19, 41, 61, 0.16)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(-p.size * 0.8, 0);
          ctx.lineTo(p.size * 0.8, 0);
          ctx.stroke();
        } else if (p.kind === 'confetti') {
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size * 0.5, -p.size * 0.28, p.size, p.size * 0.56);
        } else if (p.kind === 'splinter') {
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size * 0.6, -2.5, p.size * 1.2, 5);
        } else if (p.kind === 'ring') {
          const radius = p.size + (p.endRadius - p.size) * (1 - t);
          ctx.strokeStyle = p.color;
          ctx.lineWidth = Math.max(1.5, 5 * t);
          ctx.beginPath();
          ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
          ctx.stroke();
        }

        ctx.restore();
      }

      // Floating score & trick popups
      for (let i = 0; i < this.popups.length; i += 1) {
        const pop = this.popups[i];
        const t = Math.max(0, pop.life / pop.maxLife);
        const popBounce = t > 0.82 ? 1 + (1 - t) * 1.4 : 1;
        ctx.save();
        ctx.globalAlpha = Math.min(1, t * 1.6);
        ctx.translate(pop.x, pop.y);
        ctx.scale(pop.scale * popBounce, pop.scale * popBounce);
        ctx.font = '900 19px "Fredoka", "Nunito", system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.lineWidth = 4.5;
        ctx.strokeStyle = 'rgba(19, 41, 61, 0.88)';
        ctx.strokeText(pop.text, 0, 0);
        ctx.fillStyle = pop.color;
        ctx.fillText(pop.text, 0, 0);
        ctx.restore();
      }
    }

    drawScreenOverlay(ctx) {
      if (this.speedLines.length === 0) return;
      ctx.save();
      ctx.lineCap = 'round';
      for (let i = 0; i < this.speedLines.length; i += 1) {
        const sl = this.speedLines[i];
        ctx.strokeStyle = 'rgba(255, 250, 224, ' + sl.alpha.toFixed(2) + ')';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(sl.x, sl.y);
        ctx.lineTo(sl.x + sl.len, sl.y);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  PelicanGame.Particles = new ParticleSystem();
})(window);
