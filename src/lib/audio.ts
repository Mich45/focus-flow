/**
 * Audio engine (FR-A). Bundled ambient tracks are synthesized as filtered noise
 * via Web Audio — no audio files, tiny bundle, offline. User-imported (and any
 * file-backed bundled) tracks play through an HTMLAudioElement with looping +
 * seeking. Ambient and chime have independent volumes (FR-A3/A6).
 *
 * Autoplay: browsers/webviews block audio before a user gesture, so the context
 * is created lazily and `resume()`d from explicit user actions.
 */

export type AmbientTone = "rain" | "forest" | "cafe" | "lofi" | "waves" | "noise";

const TONE_FREQ: Record<AmbientTone, number> = {
  rain: 1400,
  forest: 700,
  cafe: 500,
  lofi: 600,
  waves: 420,
  noise: 5000,
};

export type ChimeId = "soft" | "bell" | "blocks";

const CHIMES: Record<ChimeId, number[]> = {
  soft: [880, 1320],
  bell: [1568, 2093],
  blocks: [660, 880, 1100],
};

export interface FileStatus {
  isFile: boolean;
  current: number;
  duration: number;
  paused: boolean;
}

class AudioEngine {
  private ctx: AudioContext | null = null;
  private noise: AudioBufferSourceNode | null = null;
  private filter: BiquadFilterNode | null = null;
  private ambientGain: GainNode | null = null;
  private el: HTMLAudioElement | null = null;
  private currentSrc: string | null = null;
  private source: "synth" | "file" | null = null;
  private volume = 0.5;
  private loopFiles = true;

  /** Create/resume the context. Call from a user gesture. Safe to call often. */
  ensure(): boolean {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return false;
    if (!this.ctx) {
      this.ctx = new AC();
      const buf = this.ctx.createBuffer(1, this.ctx.sampleRate * 2, this.ctx.sampleRate);
      const data = buf.getChannelData(0);
      let last = 0;
      for (let i = 0; i < data.length; i++) {
        const w = Math.random() * 2 - 1;
        last = (last + 0.02 * w) / 1.02;
        data[i] = last * 3.2;
      }
      this.noise = this.ctx.createBufferSource();
      this.noise.buffer = buf;
      this.noise.loop = true;
      this.filter = this.ctx.createBiquadFilter();
      this.filter.type = "lowpass";
      this.filter.frequency.value = 900;
      this.ambientGain = this.ctx.createGain();
      this.ambientGain.gain.value = 0;
      this.noise.connect(this.filter);
      this.filter.connect(this.ambientGain);
      this.ambientGain.connect(this.ctx.destination);
      this.noise.start();
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
    return true;
  }

  setVolume(v: number) {
    this.volume = v;
    if (this.source === "synth" && this.ambientGain && this.ctx) {
      this.ambientGain.gain.setTargetAtTime(v * 0.28, this.ctx.currentTime, 0.2);
    } else if (this.source === "file" && this.el) {
      this.el.volume = v;
    }
  }

  setLoop(v: boolean) {
    this.loopFiles = v;
    if (this.el) this.el.loop = v;
  }

  /** Play a synthesized bundled tone. */
  playTone(tone: AmbientTone) {
    if (!this.ensure() || !this.filter || !this.ctx || !this.ambientGain) return;
    if (this.el) this.el.pause();
    this.source = "synth";
    this.filter.frequency.setTargetAtTime(TONE_FREQ[tone], this.ctx.currentTime, 0.2);
    this.ambientGain.gain.setTargetAtTime(this.volume * 0.28, this.ctx.currentTime, 0.25);
  }

  /** Play (or resume) a file-backed track. Only re-seeks when the track changes. */
  playFile(src: string) {
    this.ensure();
    this.muteSynth();
    if (!this.el) this.el = new Audio();
    this.el.loop = this.loopFiles;
    this.source = "file";
    if (this.currentSrc !== src) {
      this.currentSrc = src;
      this.el.src = src; // new track: start from 0
    }
    this.el.volume = this.volume;
    void this.el.play().catch(() => {});
  }

  /** Pause output but keep the source + playback position (for resume). */
  pauseOutput() {
    this.muteSynth();
    if (this.el) this.el.pause();
  }

  /** Full stop (e.g. teardown). */
  stop() {
    this.pauseOutput();
    this.source = null;
  }

  seek(secs: number) {
    if (this.el) this.el.currentTime = secs;
  }

  fileStatus(): FileStatus {
    if (this.source === "file" && this.el) {
      return {
        isFile: true,
        current: this.el.currentTime || 0,
        duration: Number.isFinite(this.el.duration) ? this.el.duration : 0,
        paused: this.el.paused,
      };
    }
    return { isFile: false, current: 0, duration: 0, paused: true };
  }

  /** One-shot end-of-session chime (FR-A6). */
  playChime(id: ChimeId, volume: number) {
    if (volume <= 0 || !this.ensure() || !this.ctx) return;
    const freqs = CHIMES[id] ?? CHIMES.soft;
    freqs.forEach((f, i) => {
      const o = this.ctx!.createOscillator();
      const g = this.ctx!.createGain();
      o.type = "sine";
      o.frequency.value = f;
      o.connect(g);
      g.connect(this.ctx!.destination);
      const t = this.ctx!.currentTime + i * 0.16;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.18 * volume, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
      o.start(t);
      o.stop(t + 0.55);
    });
  }

  private muteSynth() {
    if (this.ambientGain && this.ctx) {
      this.ambientGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.2);
    }
  }
}

export const audioEngine = new AudioEngine();
