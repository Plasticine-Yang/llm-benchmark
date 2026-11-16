(function (global) {
  'use strict';

  const PelicanGame = (global.PelicanGame = global.PelicanGame || {});

  const PENTATONIC = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 1174.66, 1318.51];

  class SoundEngine {
    constructor() {
      this.ctx = null;
      this.master = null;
      this.muted = false;
      this.noiseBuffer = null;
    }

    initFromSettings(muted) {
      this.muted = Boolean(muted);
    }

    setMuted(muted) {
      this.muted = Boolean(muted);
      if (this.master && this.ctx) {
        this.master.gain.setTargetAtTime(this.muted ? 0 : 0.34, this.ctx.currentTime, 0.015);
      }
    }

    unlock() {
      if (this.muted) return;
      const AudioCtx = global.AudioContext || global.webkitAudioContext;
      if (!AudioCtx) return;

      if (!this.ctx) {
        try {
          this.ctx = new AudioCtx();
          this.master = this.ctx.createGain();
          this.master.gain.value = this.muted ? 0 : 0.34;
          this.master.connect(this.ctx.destination);
          this.noiseBuffer = this._createNoiseBuffer();
        } catch (_err) {
          this.ctx = null;
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
    }

    _ready() {
      if (this.muted) return false;
      if (!this.ctx) this.unlock();
      return Boolean(this.ctx && this.ctx.state === 'running');
    }

    _createNoiseBuffer() {
      const len = Math.floor(this.ctx.sampleRate * 0.6);
      const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i += 1) {
        data[i] = Math.random() * 2 - 1;
      }
      return buf;
    }

    _tone(freq, endFreq, duration, type, volume, delay) {
      if (!this._ready()) return;
      const t = this.ctx.currentTime + (delay || 0);
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type || 'sine';
      osc.frequency.setValueAtTime(freq, t);
      if (endFreq && endFreq !== freq) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), t + duration);
      }
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.linearRampToValueAtTime(volume || 0.25, t + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
      osc.connect(gain);
      gain.connect(this.master);
      osc.start(t);
      osc.stop(t + duration + 0.02);
    }

    _noise(duration, filterFreq, q, volume, endFilterFreq) {
      if (!this._ready() || !this.noiseBuffer) return;
      const t = this.ctx.currentTime;
      const src = this.ctx.createBufferSource();
      src.buffer = this.noiseBuffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(filterFreq || 800, t);
      if (endFilterFreq) {
        filter.frequency.exponentialRampToValueAtTime(Math.max(60, endFilterFreq), t + duration);
      }
      filter.Q.value = q || 1.2;

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.linearRampToValueAtTime(volume || 0.2, t + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);

      src.connect(filter);
      filter.connect(gain);
      gain.connect(this.master);
      src.start(t);
      src.stop(t + duration + 0.02);
    }

    playFish(comboCount, isGold) {
      const idx = Math.min(PENTATONIC.length - 1, Math.max(0, comboCount % PENTATONIC.length));
      const freq = PENTATONIC[idx];
      this._tone(freq, freq * 1.06, 0.14, 'triangle', 0.28, 0);
      this._tone(freq * 1.5, freq * 1.5, 0.1, 'sine', 0.12, 0.02);
      if (isGold) {
        this._tone(freq * 2, freq * 2.02, 0.18, 'sine', 0.2, 0.05);
      }
    }

    playJump() {
      this._tone(210, 480, 0.14, 'triangle', 0.26, 0);
    }

    playFlap() {
      this._noise(0.14, 950, 0.9, 0.22, 380);
      this._tone(260, 410, 0.11, 'sine', 0.16, 0);
    }

    playLand() {
      this._tone(135, 58, 0.08, 'triangle', 0.2, 0);
    }

    playBounce(isSuper) {
      const top = isSuper ? 780 : 620;
      this._tone(180, top, 0.22, 'sine', 0.3, 0);
      this._tone(270, top * 1.15, 0.18, 'triangle', 0.16, 0.02);
    }

    playTrick() {
      this._tone(587.33, 587.33, 0.1, 'triangle', 0.24, 0);
      this._tone(880, 880, 0.16, 'triangle', 0.26, 0.06);
    }

    playSmash() {
      this._noise(0.12, 650, 1.0, 0.28, 220);
      this._tone(190, 75, 0.13, 'sawtooth', 0.2, 0);
    }

    playBell() {
      // Vintage bicycle bell ding-ding!
      this._tone(1760, 1740, 0.22, 'sine', 0.22, 0);
      this._tone(2640, 2620, 0.18, 'sine', 0.11, 0);
      this._tone(1760, 1740, 0.26, 'sine', 0.24, 0.09);
      this._tone(2640, 2620, 0.2, 'sine', 0.12, 0.09);
    }

    playBoost() {
      this._noise(0.22, 500, 0.8, 0.24, 1800);
      this._tone(320, 680, 0.18, 'sawtooth', 0.14, 0);
    }

    playHit() {
      this._tone(240, 85, 0.2, 'sawtooth', 0.28, 0);
      // Pelican squawk
      this._tone(540, 390, 0.12, 'square', 0.12, 0.03);
      this._noise(0.14, 700, 1.1, 0.22, 260);
    }

    playSplash() {
      this._noise(0.32, 1200, 0.7, 0.34, 300);
      this._tone(240, 95, 0.22, 'sine', 0.2, 0);
    }

    playHeart() {
      this._tone(523.25, 523.25, 0.12, 'sine', 0.22, 0);
      this._tone(659.25, 659.25, 0.12, 'sine', 0.22, 0.07);
      this._tone(783.99, 783.99, 0.22, 'sine', 0.24, 0.14);
    }

    playGameOver(isNewRecord) {
      if (isNewRecord) {
        const notes = [523.25, 659.25, 783.99, 1046.5];
        notes.forEach((n, idx) => {
          this._tone(n, n, 0.2, 'triangle', 0.25, idx * 0.09);
        });
      } else {
        const notes = [392.0, 349.23, 311.13, 261.63];
        notes.forEach((n, idx) => {
          this._tone(n, n * 0.96, 0.2, 'triangle', 0.2, idx * 0.1);
        });
      }
    }
  }

  PelicanGame.Audio = new SoundEngine();
})(window);
