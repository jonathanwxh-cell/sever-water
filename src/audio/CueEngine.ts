// ============================================================================
// AUDIO ENGINE — Cue music management
// ============================================================================
import { CUE_PATHS } from './cues';

const FADE_INTERVAL_MS = 50;
const MUSIC_BASE_SCALE = 0.4;  // default music level relative to master volume; lower = quieter relative to narration

export class CueEngine {
  cues: Record<number, HTMLAudioElement> = {};
  cueScales: Record<number, number> = {};
  // Per-cue active fade interval. Starting a new fade on a cue cancels the previous one
  // so two fades can't race against the same audio.volume property.
  private fadeTimers: Record<number, ReturnType<typeof setInterval>> = {};
  activeCue = 0;
  masterVolume = 0.8;
  userInteracted = false;

  constructor() {
    this.buildCues();
  }

  private buildCues() {
    const makeCue = (src: string) => {
      const a = new Audio(src);
      a.loop = true;
      a.volume = 0;
      return a;
    };
    this.cues = {};
    this.cueScales = {};
    for (const [numStr, path] of Object.entries(CUE_PATHS)) {
      const num = Number(numStr);
      this.cues[num] = makeCue(path);
      this.cueScales[num] = MUSIC_BASE_SCALE;
    }
  }

  rebuild() {
    Object.values(this.cues).forEach((a) => {
      try { a.pause(); a.src = ''; a.load(); } catch { /* ignore */ }
    });
    this.clearTimers();
    this.activeCue = 0;
    this.buildCues();
  }

  private cancelFade(cueNum: number) {
    const t = this.fadeTimers[cueNum];
    if (t !== undefined) {
      clearInterval(t);
      delete this.fadeTimers[cueNum];
    }
  }

  private startFade(cueNum: number, tick: () => boolean) {
    this.cancelFade(cueNum);
    const t = setInterval(() => {
      if (tick()) {
        clearInterval(t);
        if (this.fadeTimers[cueNum] === t) delete this.fadeTimers[cueNum];
      }
    }, FADE_INTERVAL_MS);
    this.fadeTimers[cueNum] = t;
  }

  clearTimers() {
    Object.values(this.fadeTimers).forEach((t) => clearInterval(t));
    this.fadeTimers = {};
  }

  markInteracted() {
    this.userInteracted = true;
  }

  playCue(cueNum: number, fadeSec = 0) {
    if (!this.userInteracted) return;
    const audio = this.cues[cueNum];
    if (!audio) return;
    this.cueScales[cueNum] = MUSIC_BASE_SCALE;
    this.cancelFade(cueNum);
    audio.currentTime = 0;
    const target = this.masterVolume * this.cueScales[cueNum];
    if (fadeSec > 0) {
      audio.volume = 0;
      audio.play().catch(() => {});
      const start = Date.now();
      this.startFade(cueNum, () => {
        const p = Math.min((Date.now() - start) / 1000 / fadeSec, 1);
        audio.volume = target * p;
        return p >= 1;
      });
    } else {
      audio.volume = target;
      audio.play().catch(() => {});
    }
    this.activeCue = cueNum;
  }

  fadeOutCue(cueNum: number, durationSec = 2) {
    const audio = this.cues[cueNum];
    if (!audio) return;
    const startVol = audio.volume;
    const start = Date.now();
    this.startFade(cueNum, () => {
      const p = Math.min((Date.now() - start) / 1000 / durationSec, 1);
      audio.volume = startVol * (1 - p);
      if (p >= 1) {
        audio.pause();
        return true;
      }
      return false;
    });
    if (this.activeCue === cueNum) this.activeCue = 0;
  }

  hardMute(cueNum: number) {
    const audio = this.cues[cueNum];
    if (audio) {
      this.cancelFade(cueNum);
      audio.volume = 0;
    }
  }

  fadeInCue(cueNum: number, durationSec = 3, targetScale = MUSIC_BASE_SCALE) {
    if (!this.userInteracted) return;
    const audio = this.cues[cueNum];
    if (!audio) return;
    this.cueScales[cueNum] = targetScale;
    const target = this.masterVolume * targetScale;
    // Already at target and no fade in flight — nothing to do.
    if (!audio.paused && audio.volume > 0.01 && this.fadeTimers[cueNum] === undefined) return;
    if (audio.paused) {
      audio.currentTime = 0;
      audio.play().catch(() => {});
    }
    const startVol = audio.volume;
    const start = Date.now();
    this.startFade(cueNum, () => {
      const p = Math.min((Date.now() - start) / 1000 / durationSec, 1);
      audio.volume = startVol + (target - startVol) * p;
      return p >= 1;
    });
    this.activeCue = cueNum;
  }

  setVolume(v: number) {
    this.masterVolume = Math.max(0, Math.min(1, v));
    Object.entries(this.cues).forEach(([numStr, a]) => {
      const num = Number(numStr);
      if (!a.paused && a.volume > 0) {
        a.volume = this.masterVolume * (this.cueScales[num] ?? 1.0);
      }
    });
  }

  stopAll() {
    this.clearTimers();
    Object.values(this.cues).forEach((a) => { a.pause(); a.currentTime = 0; a.volume = 0; });
    this.activeCue = 0;
  }
}
