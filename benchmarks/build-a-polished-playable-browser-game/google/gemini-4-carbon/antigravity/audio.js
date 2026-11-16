(function () {
  "use strict";

  const PENTATONIC = [
    523.25, // C5
    587.33, // D5
    659.25, // E5
    783.99, // G5
    880.00, // A5
    1046.50, // C6
    1174.66, // D6
    1318.51, // E6
    1567.98, // G6
    1760.00  // A6
  ];

  // Sunny C-major / F-major / G7 boardwalk bass & marimba pattern
  const BASS_STEPS = [
    130.81, 0, 196.00, 164.81,  174.61, 0, 220.00, 261.63,
    130.81, 0, 196.00, 164.81,  196.00, 0, 246.94, 293.66
  ];
  const CHORD_MELODY = [
    523.25, 0, 659.25, 783.99,  698.46, 0, 880.00, 698.46,
    659.25, 587.33, 523.25, 0,  587.33, 0, 783.99, 659.25
  ];

  class PelicanAudioEngine {
    constructor() {
      this.ctx = null;
      this.master = null;
      this.sfxGain = null;
      this.musicGain = null;
      this.noiseBuffer = null;
      this.muted = this._loadMute();

      // Continuous rail grind nodes
      this.grindSource = null;
      this.grindFilter = null;
      this.grindGain = null;
      this.isGrinding = false;

      // Lightweight procedural groove state
      this.musicPlaying = false;
      this.feverMode = false;
      this.stepIndex = 0;
      this.nextNoteTime = 0;
      this.schedulerId = null;
    }

    _loadMute() {
      try {
        return localStorage.getItem("pelican_pedal_muted") === "1";
      } catch (_) {
        return false;
      }
    }

    _saveMute() {
      try {
        localStorage.setItem("pelican_pedal_muted", this.muted ? "1" : "0");
      } catch (_) {
        // Ignore storage restrictions
      }
    }

    unlock() {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        this.ctx = new AudioCtx();

        this.master = this.ctx.createGain();
        this.master.gain.value = this.muted ? 0 : 0.85;
        this.master.connect(this.ctx.destination);

        this.sfxGain = this.ctx.createGain();
        this.sfxGain.gain.value = 0.85;
        this.sfxGain.connect(this.master);

        this.musicGain = this.ctx.createGain();
        this.musicGain.gain.value = 0.24;
        this.musicGain.connect(this.master);

        this._buildNoiseBuffer();
      }
      if (this.ctx && this.ctx.state === "suspended") {
        this.ctx.resume().catch(() => {});
      }
    }

    _buildNoiseBuffer() {
      if (!this.ctx) return;
      const sampleRate = this.ctx.sampleRate;
      const length = sampleRate * 1.2;
      const buffer = this.ctx.createBuffer(1, length, sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < length; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      this.noiseBuffer = buffer;
    }

    toggleMute() {
      this.muted = !this.muted;
      this._saveMute();
      this.unlock();
      if (this.master && this.ctx) {
        const now = this.ctx.currentTime;
        this.master.gain.cancelScheduledValues(now);
        this.master.gain.setTargetAtTime(this.muted ? 0 : 0.85, now, 0.02);
      }
      return this.muted;
    }

    isMuted() {
      return this.muted;
    }

    // --- Procedural Music Loop ---
    startMusic() {
      this.unlock();
      if (!this.ctx || this.musicPlaying) return;
      this.musicPlaying = true;
      this.stepIndex = 0;
      this.nextNoteTime = this.ctx.currentTime + 0.05;
      if (this.musicGain) {
        this.musicGain.gain.setTargetAtTime(0.24, this.ctx.currentTime, 0.08);
      }
      this._scheduleTick();
    }

    setMusicPaused(paused) {
      if (!this.ctx || !this.musicGain) return;
      const now = this.ctx.currentTime;
      this.musicGain.gain.setTargetAtTime(paused ? 0.0 : 0.24, now, 0.05);
      if (paused) {
        this.setGrindActive(false);
      }
    }

    stopMusic() {
      this.musicPlaying = false;
      if (this.schedulerId) {
        clearTimeout(this.schedulerId);
        this.schedulerId = null;
      }
      this.setGrindActive(false);
    }

    setFever(active) {
      this.feverMode = !!active;
    }

    _scheduleTick() {
      if (!this.musicPlaying || !this.ctx) return;
      const tempo = this.feverMode ? 146 : 124;
      const sixteenth = 60 / tempo / 4;

      while (this.nextNoteTime < this.ctx.currentTime + 0.14) {
        if (!this.muted) {
          this._playGrooveStep(this.stepIndex, this.nextNoteTime, sixteenth);
        }
        this.nextNoteTime += sixteenth;
        this.stepIndex = (this.stepIndex + 1) % 16;
      }

      this.schedulerId = setTimeout(() => this._scheduleTick(), 45);
    }

    _playGrooveStep(step, time, dur) {
      if (!this.ctx || !this.musicGain) return;

      // Upright coastal bass
      const bassFreq = BASS_STEPS[step];
      if (bassFreq > 0) {
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(bassFreq, time);
        g.gain.setValueAtTime(0.001, time);
        g.gain.linearRampToValueAtTime(0.32, time + 0.012);
        g.gain.exponentialRampToValueAtTime(0.001, time + dur * 1.75);
        osc.connect(g);
        g.connect(this.musicGain);
        osc.start(time);
        osc.stop(time + dur * 1.8);
      }

      // Sunny wooden marimba pluck
      const melFreq = CHORD_MELODY[step];
      if (melFreq > 0) {
        const pitch = this.feverMode ? melFreq * 1.12246 : melFreq; // Whole step lift in Fever!
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(pitch, time);
        g.gain.setValueAtTime(0.001, time);
        g.gain.linearRampToValueAtTime(0.18, time + 0.006);
        g.gain.exponentialRampToValueAtTime(0.001, time + dur * 1.3);
        osc.connect(g);
        g.connect(this.musicGain);
        osc.start(time);
        osc.stop(time + dur * 1.35);
      }

      // Light shaker / rim groove on offbeats
      if (step % 2 === 1 && this.noiseBuffer) {
        const src = this.ctx.createBufferSource();
        src.buffer = this.noiseBuffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = "highpass";
        filter.frequency.value = step % 4 === 3 ? 6500 : 8500;
        const g = this.ctx.createGain();
        const amp = step % 4 === 3 ? 0.075 : 0.035;
        g.gain.setValueAtTime(amp, time);
        g.gain.exponentialRampToValueAtTime(0.001, time + 0.035);
        src.connect(filter);
        filter.connect(g);
        g.connect(this.musicGain);
        src.start(time);
        src.stop(time + 0.04);
      }
    }

    // --- Sound Effects ---
    playBell() {
      this.unlock();
      if (!this.ctx || this.muted) return;
      const now = this.ctx.currentTime;
      // Classic bicycle double "brring-brring!"
      [0, 0.11].forEach((offset) => {
        const t = now + offset;
        [1396.9, 2793.8, 4186.0].forEach((freq, idx) => {
          const osc = this.ctx.createOscillator();
          const g = this.ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, t);
          const peak = idx === 0 ? 0.22 : idx === 1 ? 0.11 : 0.06;
          g.gain.setValueAtTime(0.001, t);
          g.gain.linearRampToValueAtTime(peak, t + 0.005);
          g.gain.exponentialRampToValueAtTime(0.0008, t + (idx === 0 ? 0.48 : 0.22));
          osc.connect(g);
          g.connect(this.sfxGain);
          osc.start(t);
          osc.stop(t + 0.5);
        });
      });
    }

    playJump() {
      this.unlock();
      if (!this.ctx || this.muted) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(190, t);
      osc.frequency.exponentialRampToValueAtTime(520, t + 0.13);
      g.gain.setValueAtTime(0.28, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
      osc.connect(g);
      g.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.16);
    }

    playFlap() {
      this.unlock();
      if (!this.ctx || this.muted) return;
      const t = this.ctx.currentTime;

      // Feather air whoosh
      if (this.noiseBuffer) {
        const src = this.ctx.createBufferSource();
        src.buffer = this.noiseBuffer;
        const bp = this.ctx.createBiquadFilter();
        bp.type = "bandpass";
        bp.frequency.setValueAtTime(600, t);
        bp.frequency.exponentialRampToValueAtTime(1900, t + 0.14);
        bp.Q.value = 1.4;

        const ng = this.ctx.createGain();
        ng.gain.setValueAtTime(0.32, t);
        ng.gain.exponentialRampToValueAtTime(0.001, t + 0.16);

        src.connect(bp);
        bp.connect(ng);
        ng.connect(this.sfxGain);
        src.start(t);
        src.stop(t + 0.17);
      }

      // Warm upward lift chirp
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(310, t);
      osc.frequency.exponentialRampToValueAtTime(680, t + 0.12);
      g.gain.setValueAtTime(0.18, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.13);
      osc.connect(g);
      g.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.14);
    }

    playLand(intensity = 0.5) {
      this.unlock();
      if (!this.ctx || this.muted) return;
      const t = this.ctx.currentTime;
      const amp = Math.min(0.35, 0.08 + intensity * 0.22);
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(135, t);
      osc.frequency.exponentialRampToValueAtTime(48, t + 0.09);
      g.gain.setValueAtTime(amp, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.095);
      osc.connect(g);
      g.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.1);
    }

    playDive() {
      this.unlock();
      if (!this.ctx || this.muted) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(680, t);
      osc.frequency.exponentialRampToValueAtTime(180, t + 0.16);
      g.gain.setValueAtTime(0.18, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.17);
      osc.connect(g);
      g.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.18);
    }

    playFish(chainIndex = 0, isRare = false) {
      this.unlock();
      if (!this.ctx || this.muted) return;
      const t = this.ctx.currentTime;
      const note = PENTATONIC[Math.min(chainIndex, PENTATONIC.length - 1)];

      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(note, t);
      osc.frequency.exponentialRampToValueAtTime(note * 1.02, t + 0.09);
      g.gain.setValueAtTime(0.001, t);
      g.gain.linearRampToValueAtTime(0.24, t + 0.008);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
      osc.connect(g);
      g.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.19);

      if (isRare) {
        // Sparkle harmonic chord for Rainbow Koi
        [1.25, 1.5, 2.0].forEach((mult, idx) => {
          const o2 = this.ctx.createOscillator();
          const g2 = this.ctx.createGain();
          o2.type = "triangle";
          const st = t + idx * 0.035;
          o2.frequency.setValueAtTime(note * mult, st);
          g2.gain.setValueAtTime(0.16, st);
          g2.gain.exponentialRampToValueAtTime(0.001, st + 0.24);
          o2.connect(g2);
          g2.connect(this.sfxGain);
          o2.start(st);
          o2.stop(st + 0.25);
        });
      }
    }

    playBounce() {
      this.unlock();
      if (!this.ctx || this.muted) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(175, t);
      osc.frequency.exponentialRampToValueAtTime(640, t + 0.19);
      g.gain.setValueAtTime(0.34, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.24);
      osc.connect(g);
      g.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.25);
    }

    playGullBop() {
      this.unlock();
      if (!this.ctx || this.muted) return;
      const t = this.ctx.currentTime;
      this.playBounce();

      // Funny cartoon seagull squawk
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(980, t + 0.02);
      osc.frequency.exponentialRampToValueAtTime(520, t + 0.16);
      const bp = this.ctx.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.value = 1400;
      bp.Q.value = 3.2;

      g.gain.setValueAtTime(0.16, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
      osc.connect(bp);
      bp.connect(g);
      g.connect(this.sfxGain);
      osc.start(t + 0.02);
      osc.stop(t + 0.19);
    }

    playCrateSmash() {
      this.unlock();
      if (!this.ctx || this.muted) return;
      const t = this.ctx.currentTime;

      if (this.noiseBuffer) {
        const src = this.ctx.createBufferSource();
        src.buffer = this.noiseBuffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = "bandpass";
        filter.frequency.value = 900;
        filter.Q.value = 0.9;
        const g = this.ctx.createGain();
        g.gain.setValueAtTime(0.38, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
        src.connect(filter);
        filter.connect(g);
        g.connect(this.sfxGain);
        src.start(t);
        src.stop(t + 0.17);
      }

      // Woody knock
      [210, 315].forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = "triangle";
        const st = t + idx * 0.025;
        osc.frequency.setValueAtTime(freq, st);
        osc.frequency.exponentialRampToValueAtTime(85, st + 0.09);
        g.gain.setValueAtTime(0.28, st);
        g.gain.exponentialRampToValueAtTime(0.001, st + 0.1);
        osc.connect(g);
        g.connect(this.sfxGain);
        osc.start(st);
        osc.stop(st + 0.11);
      });
    }

    playStuntChime() {
      this.unlock();
      if (!this.ctx || this.muted) return;
      const t = this.ctx.currentTime;
      [659.25, 880, 1046.5].forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = "triangle";
        const st = t + idx * 0.04;
        osc.frequency.setValueAtTime(freq, st);
        g.gain.setValueAtTime(0.16, st);
        g.gain.exponentialRampToValueAtTime(0.001, st + 0.18);
        osc.connect(g);
        g.connect(this.sfxGain);
        osc.start(st);
        osc.stop(st + 0.19);
      });
    }

    playFever() {
      this.unlock();
      if (!this.ctx || this.muted) return;
      const t = this.ctx.currentTime;

      // Comical big GULP!
      const gulp = this.ctx.createOscillator();
      const gg = this.ctx.createGain();
      gulp.type = "sine";
      gulp.frequency.setValueAtTime(280, t);
      gulp.frequency.exponentialRampToValueAtTime(110, t + 0.09);
      gulp.frequency.exponentialRampToValueAtTime(540, t + 0.18);
      gg.gain.setValueAtTime(0.32, t);
      gg.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
      gulp.connect(gg);
      gg.connect(this.sfxGain);
      gulp.start(t);
      gulp.stop(t + 0.21);

      // Sunburst fanfare chord
      [523.25, 659.25, 783.99, 987.77, 1174.66, 1567.98].forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = "triangle";
        const st = t + 0.08 + i * 0.045;
        osc.frequency.setValueAtTime(freq, st);
        g.gain.setValueAtTime(0.2, st);
        g.gain.exponentialRampToValueAtTime(0.001, st + 0.42);
        osc.connect(g);
        g.connect(this.sfxGain);
        osc.start(st);
        osc.stop(st + 0.44);
      });

      this.playBell();
    }

    playCrash() {
      this.unlock();
      if (!this.ctx || this.muted) return;
      const t = this.ctx.currentTime;
      this.setGrindActive(false);

      // Crash noise burst
      if (this.noiseBuffer) {
        const src = this.ctx.createBufferSource();
        src.buffer = this.noiseBuffer;
        const lp = this.ctx.createBiquadFilter();
        lp.type = "lowpass";
        lp.frequency.setValueAtTime(2200, t);
        lp.frequency.exponentialRampToValueAtTime(240, t + 0.35);
        const g = this.ctx.createGain();
        g.gain.setValueAtTime(0.42, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.38);
        src.connect(lp);
        lp.connect(g);
        g.connect(this.sfxGain);
        src.start(t);
        src.stop(t + 0.4);
      }

      // Sad pelican honk
      const honk = this.ctx.createOscillator();
      const hg = this.ctx.createGain();
      honk.type = "sawtooth";
      honk.frequency.setValueAtTime(340, t + 0.06);
      honk.frequency.linearRampToValueAtTime(250, t + 0.22);
      honk.frequency.exponentialRampToValueAtTime(145, t + 0.48);

      const bp = this.ctx.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.value = 720;
      bp.Q.value = 2.6;

      hg.gain.setValueAtTime(0.24, t + 0.06);
      hg.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
      honk.connect(bp);
      bp.connect(hg);
      hg.connect(this.sfxGain);
      honk.start(t + 0.06);
      honk.stop(t + 0.52);
    }

    setGrindActive(active, speedNorm = 0.5) {
      if (!this.ctx || !this.noiseBuffer) return;
      const now = this.ctx.currentTime;

      if (active && !this.muted) {
        if (!this.isGrinding) {
          this.isGrinding = true;
          const src = this.ctx.createBufferSource();
          src.buffer = this.noiseBuffer;
          src.loop = true;

          const filter = this.ctx.createBiquadFilter();
          filter.type = "bandpass";
          filter.frequency.value = 2400 + speedNorm * 1200;
          filter.Q.value = 3.5;

          const g = this.ctx.createGain();
          g.gain.setValueAtTime(0.001, now);
          g.gain.linearRampToValueAtTime(0.16, now + 0.03);

          src.connect(filter);
          filter.connect(g);
          g.connect(this.sfxGain);
          src.start(now);

          this.grindSource = src;
          this.grindFilter = filter;
          this.grindGain = g;
        } else if (this.grindFilter) {
          this.grindFilter.frequency.setTargetAtTime(2400 + speedNorm * 1200, now, 0.05);
        }
      } else if (this.isGrinding) {
        this.isGrinding = false;
        if (this.grindGain && this.grindSource) {
          const g = this.grindGain;
          const s = this.grindSource;
          g.gain.cancelScheduledValues(now);
          g.gain.setTargetAtTime(0.0001, now, 0.025);
          setTimeout(() => {
            try { s.stop(); s.disconnect(); } catch (_) {}
          }, 90);
        }
        this.grindSource = null;
        this.grindFilter = null;
        this.grindGain = null;
      }
    }
  }

  window.PelicanAudio = new PelicanAudioEngine();
})();
