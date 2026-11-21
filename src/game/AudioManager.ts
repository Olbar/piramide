import type { GameSettings } from '../core/types';

type SfxName =
  | 'jump' | 'land' | 'key' | 'door' | 'secret' | 'death' | 'hint' | 'lever'
  | 'fire' | 'rock' | 'whoosh' | 'victory' | 'chest' | 'note' | 'step' | 'crumble' | 'achievement';

export class AudioManager {
  private ctx: AudioContext | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicNodes: OscillatorNode[] = [];
  private musicTimer: number | null = null;
  private settings: GameSettings = { musicVolume: 0.6, sfxVolume: 0.8 };
  private musicPlaying = false;

  private ensure(): AudioContext | null {
    if (typeof AudioContext === 'undefined') return null;
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.musicGain = this.ctx.createGain();
      this.musicGain.connect(this.ctx.destination);
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.connect(this.ctx.destination);
      this.applyVolumes();
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
    return this.ctx;
  }

  setSettings(settings: GameSettings): void {
    this.settings = settings;
    this.applyVolumes();
  }

  private applyVolumes(): void {
    if (this.musicGain) this.musicGain.gain.value = this.settings.musicVolume * 0.25;
    if (this.sfxGain) this.sfxGain.gain.value = this.settings.sfxVolume;
  }

  startMusic(): void {
    const ctx = this.ensure();
    if (!ctx || !this.musicGain || this.musicPlaying) return;
    this.musicPlaying = true;
    const scale = [110, 130.81, 146.83, 164.81, 196, 220, 261.63];
    const drone = ctx.createOscillator();
    drone.type = 'sine';
    drone.frequency.value = 55;
    const droneGain = ctx.createGain();
    droneGain.gain.value = 0.35;
    drone.connect(droneGain).connect(this.musicGain);
    drone.start();
    this.musicNodes.push(drone);

    const drone2 = ctx.createOscillator();
    drone2.type = 'triangle';
    drone2.frequency.value = 82.41;
    const drone2Gain = ctx.createGain();
    drone2Gain.gain.value = 0.18;
    drone2.connect(drone2Gain).connect(this.musicGain);
    drone2.start();
    this.musicNodes.push(drone2);

    const playNote = () => {
      if (!this.musicPlaying || !this.ctx || !this.musicGain) return;
      const freq = scale[Math.floor(Math.random() * scale.length)] * (Math.random() < 0.3 ? 2 : 1);
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const gain = this.ctx.createGain();
      const now = this.ctx.currentTime;
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.22, now + 0.4);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 2.8);
      osc.connect(gain).connect(this.musicGain);
      osc.start(now);
      osc.stop(now + 3);
      this.musicTimer = window.setTimeout(playNote, 1800 + Math.random() * 2600);
    };
    playNote();
  }

  stopMusic(): void {
    this.musicPlaying = false;
    if (this.musicTimer !== null) {
      clearTimeout(this.musicTimer);
      this.musicTimer = null;
    }
    for (const node of this.musicNodes) {
      try {
        node.stop();
      } catch {
        // уже остановлен
      }
    }
    this.musicNodes = [];
  }

  play(name: SfxName): void {
    const ctx = this.ensure();
    if (!ctx || !this.sfxGain) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain).connect(this.sfxGain);

    const presets: Record<SfxName, { type: OscillatorType; f0: number; f1: number; dur: number; vol: number }> = {
      jump: { type: 'square', f0: 240, f1: 480, dur: 0.14, vol: 0.12 },
      land: { type: 'triangle', f0: 160, f1: 70, dur: 0.1, vol: 0.14 },
      key: { type: 'sine', f0: 660, f1: 1320, dur: 0.3, vol: 0.2 },
      door: { type: 'sawtooth', f0: 90, f1: 55, dur: 0.5, vol: 0.16 },
      secret: { type: 'sine', f0: 523, f1: 1046, dur: 0.45, vol: 0.2 },
      death: { type: 'sawtooth', f0: 300, f1: 40, dur: 0.6, vol: 0.22 },
      hint: { type: 'sine', f0: 880, f1: 660, dur: 0.25, vol: 0.14 },
      lever: { type: 'square', f0: 180, f1: 260, dur: 0.1, vol: 0.14 },
      fire: { type: 'sawtooth', f0: 120, f1: 320, dur: 0.3, vol: 0.1 },
      rock: { type: 'triangle', f0: 100, f1: 45, dur: 0.25, vol: 0.2 },
      whoosh: { type: 'sine', f0: 400, f1: 120, dur: 0.25, vol: 0.08 },
      victory: { type: 'sine', f0: 523, f1: 1568, dur: 1.2, vol: 0.22 },
      chest: { type: 'triangle', f0: 392, f1: 784, dur: 0.35, vol: 0.18 },
      note: { type: 'sine', f0: 740, f1: 988, dur: 0.25, vol: 0.14 },
      step: { type: 'triangle', f0: 120, f1: 90, dur: 0.05, vol: 0.05 },
      crumble: { type: 'sawtooth', f0: 200, f1: 60, dur: 0.35, vol: 0.12 },
      achievement: { type: 'sine', f0: 660, f1: 1760, dur: 0.6, vol: 0.2 },
    };
    const p = presets[name];
    osc.type = p.type;
    osc.frequency.setValueAtTime(p.f0, now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(p.f1, 1), now + p.dur);
    gain.gain.setValueAtTime(p.vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + p.dur);
    osc.start(now);
    osc.stop(now + p.dur + 0.05);
  }
}

export const audio = new AudioManager();