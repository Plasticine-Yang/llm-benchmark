export class SpatialAudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private panner: PannerNode | null = null;
  private sources: (AudioBufferSourceNode | OscillatorNode)[] = [];
  private running = false;
  private muted = false;
  private suspendTimer = 0;
  private readonly level = 0.16;

  private ensure() {
    if (this.ctx) return;
    const ctx = new AudioContext();
    this.ctx = ctx;

    this.master = ctx.createGain();
    this.master.gain.value = 0;
    this.master.connect(ctx.destination);

    this.panner = ctx.createPanner();
    this.panner.panningModel = 'HRTF';
    this.panner.distanceModel = 'inverse';
    this.panner.refDistance = 1;
    this.panner.rolloffFactor = 0.5;
    this.panner.positionX.value = 0;
    this.panner.positionY.value = 0;
    this.panner.positionZ.value = -2.2;
    this.panner.connect(this.master);

    // airy pink-noise bed, orbiting through the HRTF panner
    const len = Math.floor(ctx.sampleRate * 2);
    const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < len; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.969 * b2 + white * 0.153852;
      b3 = 0.8665 * b3 + white * 0.3104856;
      b4 = 0.55 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.016898;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;
    const bandpass = ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.value = 880;
    bandpass.Q.value = 0.9;
    const noiseGain = ctx.createGain();
    noiseGain.gain.value = 0.55;
    noise.connect(bandpass).connect(noiseGain).connect(this.panner);
    noise.start();
    this.sources.push(noise);

    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.07;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 240;
    lfo.connect(lfoGain).connect(bandpass.frequency);
    lfo.start();
    this.sources.push(lfo);

    // warm static pad at the listener's center
    const padGain = ctx.createGain();
    padGain.gain.value = 0.05;
    const padFilter = ctx.createBiquadFilter();
    padFilter.type = 'lowpass';
    padFilter.frequency.value = 420;
    padGain.connect(padFilter).connect(this.master);
    for (const freq of [110, 164.81, 220]) {
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      osc.detune.value = (Math.random() - 0.5) * 7;
      osc.connect(padGain);
      osc.start();
      this.sources.push(osc);
    }
  }

  private rampTo(value: number, seconds: number) {
    if (!this.ctx || !this.master) return;
    const t = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(t);
    this.master.gain.setValueAtTime(this.master.gain.value, t);
    this.master.gain.linearRampToValueAtTime(value, t + seconds);
  }

  async start() {
    this.ensure();
    if (!this.ctx) return;
    window.clearTimeout(this.suspendTimer);
    if (this.ctx.state === 'suspended') await this.ctx.resume();
    this.running = true;
    this.rampTo(this.muted ? 0 : this.level, 0.9);
  }

  stop() {
    this.running = false;
    this.rampTo(0, 0.45);
    window.clearTimeout(this.suspendTimer);
    this.suspendTimer = window.setTimeout(() => {
      if (!this.running && this.ctx && this.ctx.state === 'running') {
        void this.ctx.suspend();
      }
    }, 700);
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    if (this.ctx) this.rampTo(muted || !this.running ? 0 : this.level, 0.35);
  }

  setAngle(azimuth: number, elevation = 0) {
    if (!this.ctx || !this.panner) return;
    const r = 2.2;
    const t = this.ctx.currentTime;
    const x = Math.sin(azimuth) * r * Math.cos(elevation);
    const y = Math.sin(elevation) * r;
    const z = -Math.cos(azimuth) * r * Math.cos(elevation);
    this.panner.positionX.setTargetAtTime(x, t, 0.06);
    this.panner.positionY.setTargetAtTime(y, t, 0.06);
    this.panner.positionZ.setTargetAtTime(z, t, 0.06);
  }

  dispose() {
    window.clearTimeout(this.suspendTimer);
    this.running = false;
    for (const s of this.sources) {
      try {
        s.stop();
      } catch {
        /* already stopped */
      }
    }
    this.sources = [];
    if (this.ctx) {
      void this.ctx.close();
      this.ctx = null;
      this.master = null;
      this.panner = null;
    }
  }
}