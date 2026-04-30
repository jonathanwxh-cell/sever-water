// ============================================================================
// NARRATION ENGINE — Single-track audio
// ============================================================================
// Generation counter — incremented on every play() and stop(). Each in-flight
// playback captures its own gen; pending callbacks are no-ops once gen advances.
// This is more robust than `if (this.audio === a)` because it survives even if
// multiple stop/play cycles fire before async events drain.
export class NarrationEngine {
  audio: HTMLAudioElement | null = null;
  private gen = 0;

  play(src: string, volume: number, onEnd?: () => void) {
    this.stop();
    const myGen = ++this.gen;
    const a = new Audio(src);
    a.volume = volume;
    // Assign before play() — the catch handler must see this.audio === a even
    // if the play promise rejects synchronously on some browsers.
    this.audio = a;
    const fire = () => {
      if (this.gen === myGen && this.audio === a) {
        this.audio = null;
        onEnd?.();
      }
    };
    a.onended = fire;
    a.onerror = fire;
    a.play().catch(fire);
  }

  stop() {
    // Bump generation first so any pending async callbacks (ended/error/play
    // rejections from the audio we're about to discard) become stale no-ops.
    this.gen++;
    const a = this.audio;
    this.audio = null;
    if (a) {
      // Detach handlers BEFORE pause/src clear so we don't get a synthetic
      // 'error' event from setting src='' invoking onerror after we thought
      // the engine was idle.
      a.onended = null;
      a.onerror = null;
      try {
        a.pause();
        a.currentTime = 0;
        // Release decoder buffer so the file isn't held in memory.
        a.removeAttribute('src');
        a.load();
      } catch {
        // pause/load can throw if the element is in an odd state — safe to swallow.
      }
    }
  }

  isPlaying() {
    return this.audio !== null && !this.audio.paused;
  }
}
