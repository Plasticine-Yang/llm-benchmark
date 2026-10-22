import { loadMuted, saveMuted } from './storage';

const PENTATONIC_FREQS = [
  523.25, // C5
  587.33, // D5
  659.25, // E5
  783.99, // G5
  880.0, // A5
  1046.5, // C6
  1174.66, // D6
  1318.51, // E6
];

class SoundEngine {
  private ctx: AudioContext | null = null;
  private muted: boolean = loadMuted();

  public isMuted(): boolean {
    return this.muted;
  }

  public setMuted(mute: boolean): void {
    this.muted = mute;
    saveMuted(mute);
  }

  public toggleMute(): boolean {
    this.setMuted(!this.muted);
    if (!this.muted) {
      this.unlock();
      this.playBell();
    }
    return this.muted;
  }

  public unlock(): void {
    if (this.muted) return;
    try {
      if (!this.ctx) {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
    } catch {
      // Ignore audio errors on restricted environments
    }
  }

  private ensureContext(): AudioContext | null {
    if (this.muted) return null;
    if (!this.ctx) {
      this.unlock();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public playHop(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(190, now);
    osc.frequency.exponentialRampToValueAtTime(460, now + 0.11);

    gain.gain.setValueAtTime(0.16, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.14);
  }

  public playLand(intensity = 0.6): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const vol = Math.min(0.2, Math.max(0.04, intensity * 0.16));

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(135, now);
    osc.frequency.exponentialRampToValueAtTime(52, now + 0.08);

    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.095);
  }

  public playPedalTick(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(850, now);
    osc.frequency.exponentialRampToValueAtTime(320, now + 0.018);

    gain.gain.setValueAtTime(0.022, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.022);
  }

  public playFish(chainIndex: number, isGolden: boolean): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const freq =
      PENTATONIC_FREQS[Math.min(chainIndex, PENTATONIC_FREQS.length - 1)];

    // Juicy gulp pop
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq * 0.78, now);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.18, now + 0.075);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.15);

    if (isGolden) {
      // Extra golden harmonic sparkle
      const sparkle = ctx.createOscillator();
      const sGain = ctx.createGain();
      sparkle.type = 'triangle';
      sparkle.frequency.setValueAtTime(freq * 1.5, now + 0.04);
      sparkle.frequency.exponentialRampToValueAtTime(freq * 2.0, now + 0.22);

      sGain.gain.setValueAtTime(0.14, now + 0.04);
      sGain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);

      sparkle.connect(sGain);
      sGain.connect(ctx.destination);
      sparkle.start(now + 0.04);
      sparkle.stop(now + 0.25);
    }
  }

  public playBell(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Two-stroke classic brass bicycle bell ("bring-bring!")
    const ring = (offset: number) => {
      const freqs = [2120, 3180, 4290];
      freqs.forEach((f, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now + offset);

        const amp = idx === 0 ? 0.11 : 0.045;
        gain.gain.setValueAtTime(amp, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.0008, now + offset + 0.34);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + offset);
        osc.stop(now + offset + 0.35);
      });
    };

    ring(0);
    ring(0.085);
  }

  public playAwningBounce(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(165, now);
    osc.frequency.exponentialRampToValueAtTime(590, now + 0.2);

    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.25);
  }

  public playRampLaunch(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(680, now + 0.16);

    gain.gain.setValueAtTime(0.16, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.19);
  }

  public playFlipComplete(flipCount: number): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const base = flipCount > 1 ? 659.25 : 523.25;
    const notes = [base, base * 1.25, base * 1.5, base * 2];

    notes.forEach((f, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, now + i * 0.045);

      gain.gain.setValueAtTime(0.14, now + i * 0.045);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.045 + 0.22);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.045);
      osc.stop(now + i * 0.045 + 0.24);
    });
  }

  public playFeverStart(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Joyful Gulp + Coastal Fanfare
    const chord = [523.25, 659.25, 783.99, 1046.5, 1318.5];
    chord.forEach((f, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';

      // Soften with lowpass filter for warm brass feel
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2200, now + i * 0.055);

      osc.frequency.setValueAtTime(f, now + i * 0.055);
      gain.gain.setValueAtTime(0.09, now + i * 0.055);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.055 + 0.36);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.055);
      osc.stop(now + i * 0.055 + 0.38);
    });
  }

  public playDive(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.12);

    gain.gain.setValueAtTime(0.13, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.14);
  }

  public playSmash(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(280, now);
    osc.frequency.exponentialRampToValueAtTime(640, now + 0.09);

    gain.gain.setValueAtTime(0.11, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.12);
  }

  public playNearMiss(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(740, now);
    osc.frequency.exponentialRampToValueAtTime(1120, now + 0.09);

    gain.gain.setValueAtTime(0.09, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.12);
  }

  public playCrash(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Low crash thud
    const thud = ctx.createOscillator();
    const tGain = ctx.createGain();
    thud.type = 'triangle';
    thud.frequency.setValueAtTime(150, now);
    thud.frequency.exponentialRampToValueAtTime(38, now + 0.28);

    tGain.gain.setValueAtTime(0.28, now);
    tGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    thud.connect(tGain);
    tGain.connect(ctx.destination);
    thud.start(now);
    thud.stop(now + 0.32);

    // Comical pelican squawk ("HONK-wark!")
    const squawk = ctx.createOscillator();
    const sFilter = ctx.createBiquadFilter();
    const sGain = ctx.createGain();
    squawk.type = 'sawtooth';
    squawk.frequency.setValueAtTime(430, now + 0.03);
    squawk.frequency.linearRampToValueAtTime(590, now + 0.09);
    squawk.frequency.exponentialRampToValueAtTime(230, now + 0.28);

    sFilter.type = 'bandpass';
    sFilter.frequency.setValueAtTime(1100, now + 0.03);
    sFilter.Q.setValueAtTime(3.2, now + 0.03);

    sGain.gain.setValueAtTime(0.18, now + 0.03);
    sGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    squawk.connect(sFilter);
    sFilter.connect(sGain);
    sGain.connect(ctx.destination);
    squawk.start(now + 0.03);
    squawk.stop(now + 0.32);
  }
}

export const sound = new SoundEngine();
