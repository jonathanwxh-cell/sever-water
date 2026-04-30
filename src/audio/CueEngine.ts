// ============================================================================
// AUDIO ENGINE — Cue music management
// ============================================================================
const FADE_INTERVAL_MS = 50;

export class CueEngine {
  cues: Record<number, HTMLAudioElement> = {};
  cueScales: Record<number, number> = { 1: 1.0, 2: 1.0, 3: 1.0 };
  activeCue = 0;
  masterVolume = 0.8;
  userInteracted = false;
  timers: ReturnType<typeof setInterval>[] = [];

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
    this.cues = {
      1: makeCue('/assets/audio/cue1_mountain_gate_v0.mp3'),
      2: makeCue('/assets/audio/cue2_one_line_sky_v0.mp3'),
      3: makeCue('/assets/audio/cue3_water_gazing_pavilion_v0.mp3'),
    };
    this.cueScales = { 1: 1.0, 2: 1.0, 3: 1.0 };
  }

  rebuild() {
    Object.values(this.cues).forEach((a) => {
      try { a.pause(); a.src = ''; a.load(); } catch { /* ignore */ }
    });
    this.clearTimers();
    this.activeCue = 0;
    this.buildCues();
  }

  private addTimer(t: ReturnType<typeof setInterval>) {
    this.timers.push(t);
  }

  private removeTimer(t: ReturnType<typeof setInterval>) {
    this.timers = this.timers.filter((x) => x !== t);
  }

  clearTimers() {
    this.timers.forEach((t) => clearInterval(t));
    this.timers = [];
  }

  markInteracted() {
    this.userInteracted = true;
  }

  playCue(cueNum: number, fadeSec = 0) {
    if (!this.userInteracted) return;
    const audio = this.cues[cueNum];
    if (!audio) return;
    this.cueScales[cueNum] = 1.0;
    audio.currentTime = 0;
    if (fadeSec > 0) {
      audio.volume = 0;
      audio.play().catch(() => {});
      const target = this.masterVolume;
      const start = Date.now();
      const t = setInterval(() => {
        const p = Math.min((Date.now() - start) / 1000 / fadeSec, 1);
        audio.volume = target * p;
        if (p >= 1) { clearInterval(t); this.removeTimer(t); }
      }, FADE_INTERVAL_MS);
      this.addTimer(t);
    } else {
      audio.volume = this.masterVolume;
      audio.play().catch(() => {});
    }
    this.activeCue = cueNum;
  }

  fadeOutCue(cueNum: number, durationSec = 2) {
    const audio = this.cues[cueNum];
    if (!audio) return;
    const startVol = audio.volume;
    const start = Date.now();
    const t = setInterval(() => {
      const p = Math.min((Date.now() - start) / 1000 / durationSec, 1);
      audio.volume = startVol * (1 - p);
      if (p >= 1) {
        audio.pause();
        clearInterval(t);
        this.removeTimer(t);
      }
    }, FADE_INTERVAL_MS);
    this.addTimer(t);
    if (this.activeCue === cueNum) this.activeCue = 0;
  }

  hardMute(cueNum: number) {
    const audio = this.cues[cueNum];
    if (audio) audio.volume = 0;
  }

  fadeInCue(cueNum: number, durationSec = 3, targetScale = 0.6) {
    if (!this.userInteracted) return;
    const audio = this.cues[cueNum];
    if (!audio) return;
    this.cueScales[cueNum] = targetScale;
    const target = this.masterVolume * targetScale;
    if (!audio.paused && audio.volume > 0.01) return;
    if (audio.paused) {
      audio.currentTime = 0;
      audio.play().catch(() => {});
    }
    const startVol = audio.volume;
    const start = Date.now();
    const t = setInterval(() => {
      const p = Math.min((Date.now() - start) / 1000 / durationSec, 1);
      audio.volume = startVol + (target - startVol) * p;
      if (p >= 1) { clearInterval(t); this.removeTimer(t); }
    }, FADE_INTERVAL_MS);
    this.addTimer(t);
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
