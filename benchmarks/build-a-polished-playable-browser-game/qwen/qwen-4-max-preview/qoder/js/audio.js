/* PELICAN PEDAL — synthesised audio (no external files): SFX + sunset surf loop */
(function (global) {
  'use strict';

  var ctx = null, master = null, sfxBus = null, musicBus = null, comp = null;
  var noiseBuf = null, muted = false, ready = false;
  var musicOn = false, timer = null, nextTime = 0, step = 0, intensity = 0;
  var BPM = 104, SPB = 60 / BPM / 2; // eighth notes

  // Am — F — C — G, one bar each
  var BASS = [55.00, 43.65, 65.41, 49.00];
  var CHORDS = [
    [220.00, 261.63, 329.63, 440.00],
    [174.61, 220.00, 261.63, 349.23],
    [261.63, 329.63, 392.00, 523.25],
    [196.00, 246.94, 293.66, 392.00]
  ];

  function now() { return ctx ? ctx.currentTime : 0; }

  function init() {
    if (ready) return true;
    var AC = global.AudioContext || global.webkitAudioContext;
    if (!AC) return false;
    try { ctx = new AC(); } catch (e) { return false; }

    comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14; comp.knee.value = 22; comp.ratio.value = 8;
    comp.attack.value = 0.004; comp.release.value = 0.22;

    master = ctx.createGain();
    master.gain.value = muted ? 0 : 0.9;
    sfxBus = ctx.createGain(); sfxBus.gain.value = 0.85;
    musicBus = ctx.createGain(); musicBus.gain.value = 0.0;

    sfxBus.connect(comp); musicBus.connect(comp);
    comp.connect(master); master.connect(ctx.destination);

    var len = Math.floor(ctx.sampleRate * 1.2);
    noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
    var d = noiseBuf.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;

    ready = true;
    return true;
  }

  function resume() {
    if (!ready && !init()) return;
    if (ctx.state === 'suspended') ctx.resume();
  }

  function env(node, t, a, peak, d, sustain) {
    var g = node.gain;
    g.cancelScheduledValues(t);
    g.setValueAtTime(0.0001, t);
    g.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + a);
    g.exponentialRampToValueAtTime(Math.max(0.0002, sustain || 0.0001), t + a + d);
  }

  function tone(o) {
    if (!ready || muted) return;
    var t = o.at || now();
    var osc = ctx.createOscillator();
    var g = ctx.createGain();
    osc.type = o.type || 'sine';
    osc.frequency.setValueAtTime(o.f0, t);
    if (o.f1 !== undefined) {
      if (o.bend === 'lin') osc.frequency.linearRampToValueAtTime(o.f1, t + (o.dur || 0.2));
      else osc.frequency.exponentialRampToValueAtTime(Math.max(1, o.f1), t + (o.dur || 0.2));
    }
    var dest = o.bus || sfxBus;
    if (o.filter) {
      var f = ctx.createBiquadFilter();
      f.type = 'lowpass'; f.frequency.setValueAtTime(o.filter, t);
      if (o.filter1) f.frequency.exponentialRampToValueAtTime(o.filter1, t + (o.dur || 0.2));
      f.Q.value = o.q || 1;
      osc.connect(f); f.connect(g);
    } else osc.connect(g);
    g.connect(dest);
    env(g, t, o.a || 0.006, o.peak || 0.3, o.d || 0.18, o.s);
    osc.start(t);
    osc.stop(t + (o.a || 0.006) + (o.d || 0.18) + 0.06);
  }

  function noise(o) {
    if (!ready || muted) return;
    var t = o.at || now();
    var src = ctx.createBufferSource();
    src.buffer = noiseBuf;
    src.playbackRate.value = o.rate || 1;
    var f = ctx.createBiquadFilter();
    f.type = o.type || 'bandpass';
    f.frequency.setValueAtTime(o.f0 || 900, t);
    if (o.f1) f.frequency.exponentialRampToValueAtTime(Math.max(40, o.f1), t + (o.dur || 0.2));
    f.Q.value = o.q || 1.1;
    var g = ctx.createGain();
    src.connect(f); f.connect(g); g.connect(o.bus || sfxBus);
    env(g, t, o.a || 0.005, o.peak || 0.25, o.d || 0.18, o.s);
    src.start(t, Math.random() * 0.4);
    src.stop(t + (o.a || 0.005) + (o.d || 0.18) + 0.08);
  }

  /* ------------------------------- SFX -------------------------------- */
  var SFX = {
    jump: function () {
      tone({ type: 'triangle', f0: 300, f1: 720, dur: 0.13, peak: 0.26, a: 0.004, d: 0.14 });
      noise({ f0: 1400, f1: 500, dur: 0.1, peak: 0.09, d: 0.1, q: 0.8 });
    },
    flap: function () {
      noise({ f0: 420, f1: 2100, dur: 0.22, peak: 0.2, a: 0.02, d: 0.22, q: 0.6, type: 'bandpass' });
      tone({ type: 'sine', f0: 520, f1: 900, dur: 0.18, peak: 0.14, d: 0.2 });
    },
    land: function (power) {
      var p = Math.min(1, power || 0.5);
      noise({ f0: 260 + 200 * p, f1: 90, dur: 0.13, peak: 0.1 + 0.16 * p, d: 0.13, q: 0.7, type: 'lowpass' });
      tone({ type: 'sine', f0: 150, f1: 70, dur: 0.1, peak: 0.12 * p, d: 0.1 });
    },
    fish: function (n) {
      var scale = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24];
      var semi = scale[Math.min(scale.length - 1, n % scale.length)];
      var f = 660 * Math.pow(2, semi / 12);
      tone({ type: 'triangle', f0: f, f1: f * 1.5, dur: 0.09, peak: 0.2, a: 0.003, d: 0.13 });
      tone({ type: 'sine', f0: f * 2, peak: 0.08, a: 0.002, d: 0.09 });
    },
    gold: function () {
      var t = now();
      [0, 4, 7, 12, 16].forEach(function (s, i) {
        tone({ at: t + i * 0.045, type: 'triangle', f0: 880 * Math.pow(2, s / 12), peak: 0.19, a: 0.003, d: 0.24 });
      });
      noise({ at: t, f0: 3000, f1: 6500, dur: 0.3, peak: 0.07, d: 0.3, q: 0.5 });
    },
    crash: function () {
      noise({ f0: 1600, f1: 120, dur: 0.4, peak: 0.34, a: 0.002, d: 0.4, q: 0.5, type: 'lowpass' });
      tone({ type: 'sawtooth', f0: 220, f1: 48, dur: 0.34, peak: 0.24, d: 0.34, filter: 900, filter1: 200 });
      tone({ type: 'square', f0: 150, f1: 60, dur: 0.2, peak: 0.1, d: 0.2 });
    },
    slam: function () {
      noise({ f0: 700, f1: 60, dur: 0.32, peak: 0.32, a: 0.002, d: 0.32, q: 0.6, type: 'lowpass' });
      tone({ type: 'sine', f0: 180, f1: 40, dur: 0.28, peak: 0.3, d: 0.28 });
    },
    smash: function () {
      noise({ f0: 2400, f1: 500, dur: 0.16, peak: 0.2, d: 0.16, q: 0.9 });
      tone({ type: 'square', f0: 420, f1: 140, dur: 0.12, peak: 0.1, d: 0.12 });
    },
    boost: function () {
      var t = now();
      tone({ at: t, type: 'sawtooth', f0: 160, f1: 1400, dur: 0.5, peak: 0.2, a: 0.02, d: 0.5, filter: 500, filter1: 5200, q: 6 });
      noise({ at: t, f0: 300, f1: 5200, dur: 0.55, peak: 0.16, a: 0.03, d: 0.55, q: 0.7 });
      [0, 7, 12].forEach(function (s, i) {
        tone({ at: t + 0.05 + i * 0.05, type: 'triangle', f0: 440 * Math.pow(2, s / 12), peak: 0.14, d: 0.4 });
      });
    },
    boostEnd: function () {
      tone({ type: 'sine', f0: 700, f1: 220, dur: 0.3, peak: 0.12, d: 0.3 });
    },
    ramp: function () {
      tone({ type: 'triangle', f0: 240, f1: 1000, dur: 0.24, peak: 0.2, a: 0.005, d: 0.26 });
      noise({ f0: 800, f1: 3000, dur: 0.24, peak: 0.1, d: 0.24 });
    },
    ui: function () { tone({ type: 'triangle', f0: 520, f1: 780, dur: 0.07, peak: 0.14, d: 0.09 }); },
    back: function () { tone({ type: 'triangle', f0: 460, f1: 300, dur: 0.09, peak: 0.12, d: 0.1 }); },
    record: function () {
      var t = now();
      [0, 4, 7, 12, 19, 24].forEach(function (s, i) {
        tone({ at: t + i * 0.085, type: 'triangle', f0: 523.25 * Math.pow(2, s / 12), peak: 0.2, a: 0.004, d: 0.42 });
      });
    },
    over: function () {
      var t = now();
      [0, -3, -7, -12].forEach(function (s, i) {
        tone({ at: t + i * 0.13, type: 'triangle', f0: 392 * Math.pow(2, s / 12), peak: 0.2, a: 0.006, d: 0.45, filter: 1800 });
      });
    },
    life: function () {
      tone({ type: 'sine', f0: 880, f1: 1320, dur: 0.2, peak: 0.18, d: 0.24 });
    }
  };

  /* ------------------------------ music ------------------------------- */
  function scheduleStep(i, t) {
    var bar = Math.floor(i / 8) % 4;
    var beat = i % 8;
    var chord = CHORDS[bar];
    var hot = intensity;

    if (beat === 0 || beat === 4) {
      tone({ at: t, bus: musicBus, type: 'sine', f0: BASS[bar], peak: 0.34, a: 0.01, d: 0.42 });
      tone({ at: t, bus: musicBus, type: 'triangle', f0: BASS[bar] * 2, peak: 0.1, a: 0.01, d: 0.24, filter: 700 });
    }
    var arp = chord[(i * 3) % chord.length] * (hot > 0.5 && beat % 2 ? 2 : 1);
    tone({
      at: t, bus: musicBus, type: hot > 0.5 ? 'sawtooth' : 'triangle',
      f0: arp, peak: 0.075 + hot * 0.05, a: 0.006, d: 0.2 + hot * 0.06,
      filter: 900 + hot * 3200, q: 3
    });

    if (beat % 2 === 1) {
      noise({ at: t, bus: musicBus, f0: 6500, f1: 4200, dur: 0.05, peak: 0.035 + hot * 0.03, d: 0.05, q: 0.7, type: 'highpass' });
    }
    if (hot > 0.35 && (beat === 2 || beat === 6)) {
      noise({ at: t, bus: musicBus, f0: 220, f1: 90, dur: 0.11, peak: 0.14 * hot, d: 0.11, q: 0.6, type: 'lowpass' });
    }
    if (beat === 0) {
      tone({ at: t, bus: musicBus, type: 'sawtooth', f0: chord[0] / 2, peak: 0.05, a: 0.35, d: 1.4, filter: 520 + hot * 900, q: 1 });
      tone({ at: t, bus: musicBus, type: 'sawtooth', f0: chord[2] / 2 * 1.005, peak: 0.04, a: 0.4, d: 1.4, filter: 620 + hot * 900, q: 1 });
    }
  }

  function tick() {
    if (!ready || !musicOn) return;
    var horizon = now() + 0.18;
    var guard = 0;
    while (nextTime < horizon && guard++ < 24) {
      if (!muted) scheduleStep(step, nextTime);
      step = (step + 1) % 32;
      nextTime += SPB;
    }
    if (nextTime < now()) nextTime = now() + 0.05;
  }

  var Audio = {
    init: init,
    resume: resume,
    get muted() { return muted; },
    setMuted: function (m) {
      muted = !!m;
      if (ready) {
        master.gain.cancelScheduledValues(now());
        master.gain.setTargetAtTime(muted ? 0 : 0.9, now(), 0.03);
      }
      return muted;
    },
    sfx: function (name, arg) { if (ready && !muted && SFX[name]) SFX[name](arg); },
    startMusic: function () {
      if (!ready || musicOn) return;
      musicOn = true;
      step = 0; nextTime = now() + 0.08;
      musicBus.gain.cancelScheduledValues(now());
      musicBus.gain.setTargetAtTime(0.5, now(), 0.6);
      if (timer) clearInterval(timer);
      timer = setInterval(tick, 26);
      tick();
    },
    stopMusic: function (fade) {
      if (!ready) return;
      musicBus.gain.cancelScheduledValues(now());
      musicBus.gain.setTargetAtTime(0, now(), fade === undefined ? 0.25 : fade);
      if (timer) { clearInterval(timer); timer = null; }
      musicOn = false;
    },
    duckMusic: function (v) {
      if (!ready || !musicOn) return;
      musicBus.gain.cancelScheduledValues(now());
      musicBus.gain.setTargetAtTime(v, now(), 0.15);
    },
    setIntensity: function (v) { intensity = Math.max(0, Math.min(1, v)); }
  };

  global.PPAudio = Audio;
})(window);