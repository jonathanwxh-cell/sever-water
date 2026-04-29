import { useState, useEffect, useRef, useCallback } from 'react';
import { gameNodes, type GameNode, type ChoiceOption } from '../data';
import { applyChoice, shouldRenderLuYuanHesitationCallback, shouldRenderTooManyQuestions, getLiuRuyanOneOfThoseIntonation, resetState, saveProgress, loadProgress, clearProgress } from '../state';

// ============================================================================
// AUDIO ENGINE — Cue music management
// ============================================================================
const FADE_INTERVAL_MS = 50;

class CueEngine {
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
      try { a.pause(); a.src = ''; a.load(); } catch {}
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

// ============================================================================
// NARRATION ENGINE — Single-track audio
// ============================================================================
class NarrationEngine {
  audio: HTMLAudioElement | null = null;

  play(src: string, volume: number, onEnd?: () => void) {
    this.stop();
    const a = new Audio(src);
    a.volume = volume;
    a.onended = () => {
      if (this.audio === a) { this.audio = null; onEnd?.(); }
    };
    a.onerror = () => {
      if (this.audio === a) { this.audio = null; onEnd?.(); }
    };
    a.play().catch(() => {
      if (this.audio === a) { this.audio = null; onEnd?.(); }
    });
    this.audio = a;
  }

  stop() {
    if (this.audio) {
      this.audio.pause();
      this.audio.src = '';
      this.audio.load();
      this.audio = null;
    }
  }

  isPlaying() {
    return this.audio !== null && !this.audio.paused;
  }
}

// ============================================================================
// CALLBACK RESOLVER
// ============================================================================
function resolveCallbackNode(choiceId: string, defaultNext: string): string {
  if (choiceId === '3A' && shouldRenderLuYuanHesitationCallback()) return 'callback_3a_lu';
  if (choiceId === '3B') return getLiuRuyanOneOfThoseIntonation() === 'recognition' ? 'callback_3b_liu_recognition' : 'callback_3b_liu';
  if (choiceId === '3C' && shouldRenderTooManyQuestions()) return 'callback_3c_too_many';
  return defaultNext;
}

// ============================================================================
// GAME COMPONENT
// ============================================================================
const TITLE_DELAY_MS = 2000;
const CHOICE_ADVANCE_MS = 500;
const BUSY_LOCK_MS = 400;

const VISIBLE_NODE_LIMIT = 3;

export default function Game() {
  const [nodes, setNodes] = useState<GameNode[]>([]);
  const [phase, setPhase] = useState<'title' | 'playing' | 'ended'>('title');
  const [titleFade, setTitleFade] = useState(false);
  const [showChoices, setShowChoices] = useState(false);
  const [choiceOptions, setChoiceOptions] = useState<ChoiceOption[]>([]);
  const [choicePrompt, setChoicePrompt] = useState('');
  const [currentImg, setCurrentImg] = useState<string | null>(
    '/assets/images/b1_08_style_anchor_moon.png'
  );
  const [prevImg, setPrevImg] = useState<string | null>(null);
  const [prevImgFading, setPrevImgFading] = useState(false);
  const [narrationActive, setNarrationActive] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [showVolSlider, setShowVolSlider] = useState(false);
  const [sceneMeta, setSceneMeta] = useState<{ scene?: string; location?: string; mood?: string }>({});

  const cueRef = useRef(new CueEngine());
  const narrRef = useRef(new NarrationEngine());
  const curNodeRef = useRef('title');
  const scrollRef = useRef<HTMLDivElement>(null);
  const advancingRef = useRef(false);
  const choiceLockedRef = useRef(false);

  // SCROLL
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [nodes, showChoices]);

  // VOLUME
  useEffect(() => {
    cueRef.current.setVolume(volume);
    if (narrRef.current.audio) narrRef.current.audio.volume = volume;
  }, [volume]);

  // CLEANUP
  useEffect(() => {
    return () => { cueRef.current.stopAll(); narrRef.current.stop(); };
  }, []);

  // IMAGE
  const setImage = useCallback((src?: string, duration = 1) => {
    if (!src || src === currentImg) return;
    setPrevImg(currentImg);
    setCurrentImg(src);
    requestAnimationFrame(() => setPrevImgFading(true));
    setTimeout(() => { setPrevImg(null); setPrevImgFading(false); }, duration * 1000);
  }, [currentImg]);

  // AUDIO TRIGGERS
  const handleAudio = useCallback((node: GameNode) => {
    if (!node.audio) return;
    const { action, cue, duration, volume: vol } = node.audio;
    const e = cueRef.current;
    switch (action) {
      case 'play': e.playCue(cue, duration || 0); break;
      case 'fade-out': e.fadeOutCue(cue, duration || 2); break;
      case 'hard-mute': e.hardMute(cue); break;
      case 'fade-in': e.fadeInCue(cue, duration || 3, vol || 0.6); break;
    }
  }, []);

  // ADVANCE
  const advance = useCallback((nodeId: string) => {
    if (advancingRef.current) return;
    const node = gameNodes[nodeId];
    if (!node) return;

    curNodeRef.current = nodeId;

    if (node.sceneLabel || node.locationLabel || node.moodLabel) {
      setSceneMeta((prev) => ({
        scene: node.sceneLabel ?? prev.scene,
        location: node.locationLabel ?? prev.location,
        mood: node.moodLabel ?? prev.mood,
      }));
    }

    if (node.type === 'scene-heading' || node.type === 'title') {
      saveProgress(nodeId);
    }

    if (node.type === 'ending') setPhase('ended');
    else if (node.type !== 'title') setPhase('playing');

    if (node.image) setImage(node.image.src, node.image.duration || 1);
    handleAudio(node);

    narrRef.current.stop();
    if (node.narrationAudio) {
      setNarrationActive(true);
      narrRef.current.play(node.narrationAudio, volume, () => setNarrationActive(false));
    } else {
      setNarrationActive(false);
    }

    if (node.type === 'choice') {
      setNodes([node]);
      setChoicePrompt(node.text);
      setChoiceOptions(node.choices || []);
      setShowChoices(true);
    } else {
      setNodes((prev) => [...prev, node]);
      setShowChoices(false);
      setChoiceOptions([]);
    }

    setTimeout(() => { advancingRef.current = false; }, BUSY_LOCK_MS);
  }, [handleAudio, setImage, volume]);

  // CLICK
  const handleClick = useCallback(() => {
    if (!cueRef.current.userInteracted) cueRef.current.markInteracted();

    if (narrationActive && phase === 'playing') {
      narrRef.current.stop();
      setNarrationActive(false);
      const node = gameNodes[curNodeRef.current];
      if (node?.next) {
        advancingRef.current = false;
        advance(node.next);
      }
      return;
    }

    if (showChoices || phase === 'ended') return;

    if (phase === 'title') {
      if (!titleFade) {
        setTitleFade(true);
        cueRef.current.playCue(1, 2);
        setTimeout(() => { setPhase('playing'); advance('scene1_heading'); }, TITLE_DELAY_MS);
      }
      return;
    }

    const node = gameNodes[curNodeRef.current];
    if (!node?.next) return;
    advance(node.next);
  }, [phase, titleFade, showChoices, narrationActive, advance]);

  // CHOICE
  const handleChoice = useCallback((choiceId: string) => {
    if (choiceLockedRef.current) return;
    choiceLockedRef.current = true;

    applyChoice(choiceId);

    const choice = choiceOptions.find((c) => c.id === choiceId);
    if (choice) {
      setNodes((prev) => [...prev, { id: `choice_${choiceId}`, text: choice.outcome, type: 'narration' as const }]);
    }

    setShowChoices(false);
    setChoiceOptions([]);

    const currentNode = gameNodes[curNodeRef.current];
    const nextId = currentNode.next || 'act1_end';
    const resolvedNextId = resolveCallbackNode(choiceId, nextId);

    saveProgress(resolvedNextId);

    setTimeout(() => {
      choiceLockedRef.current = false;
      advance(resolvedNextId);
    }, CHOICE_ADVANCE_MS);
  }, [choiceOptions, advance]);

  // RESTART
  const handleRestart = useCallback(() => {
    resetState();
    clearProgress();
    cueRef.current.rebuild();
    narrRef.current.stop();
    setNodes([]);
    setPhase('title');
    setTitleFade(false);
    setShowChoices(false);
    setChoiceOptions([]);
    setChoicePrompt('');
    setCurrentImg(null);
    setPrevImg(null);
    setPrevImgFading(false);
    setNarrationActive(false);
    setSceneMeta({});
    curNodeRef.current = 'title';
    advancingRef.current = false;
    choiceLockedRef.current = false;
    const t = gameNodes['title'];
    if (t.image) setCurrentImg(t.image.src);
  }, []);

  // KEYBOARD
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); handleClick(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleClick]);

  // RENDER NODE
  const renderNode = (node: GameNode) => {
    switch (node.type) {
      case 'scene-heading':
        return <div key={node.id} className="py-4 mt-2"><h2 className="text-lg md:text-xl font-serif text-white/60 tracking-widest uppercase">{node.text}</h2></div>;
      case 'narration':
        return <p key={node.id} className="text-base md:text-lg font-serif text-white/90 leading-loose mb-6 whitespace-pre-line">{node.text}</p>;
      case 'dialogue':
        return (
          <div key={node.id} className="mb-4">
            {node.speaker && <span className="text-sm font-serif text-white/50 uppercase tracking-wider block mb-1">{node.speaker}</span>}
            <p className="text-base md:text-lg font-serif text-white/95 leading-relaxed pl-4 border-l-2 border-white/20">{node.text}</p>
          </div>
        );
      case 'blockquote':
        return <blockquote key={node.id} className="text-center py-6 my-4"><p className="text-xl md:text-2xl font-serif text-white/80 italic tracking-wide">{node.text}</p></blockquote>;
      case 'ending':
        return (
          <div key={node.id} className="py-8 text-center">
            <h2 className="text-3xl md:text-4xl font-serif text-white tracking-widest">{node.text}</h2>
            <p className="text-white/50 mt-4 font-serif">To be continued...</p>
            <button onClick={(e) => { e.stopPropagation(); handleRestart(); }} className="mt-6 px-4 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-sm transition-colors">
              <span className="text-white/90 font-serif text-base">Play Again</span>
            </button>
          </div>
        );
      default:
        return <p key={node.id} className="text-base font-serif text-white/90 leading-loose mb-6 whitespace-pre-line">{node.text}</p>;
    }
  };

  // INIT
  useEffect(() => {
    const save = loadProgress();
    if (save && save.currentNodeId !== 'title') {
      curNodeRef.current = save.currentNodeId;
      setPhase('playing');
      cueRef.current.markInteracted();
      advance(save.currentNodeId);
    } else {
      const t = gameNodes['title'];
      if (t.image) setCurrentImg(t.image.src);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // RENDER
  return (
    <div className="relative w-full h-screen overflow-hidden bg-black select-none" onClick={handleClick}>
      {/* IMAGES */}
      <div className="absolute top-0 left-0 w-full h-[55%] md:h-[65%] overflow-hidden">
        {prevImg && <div className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000" style={{ backgroundImage: `url(${prevImg})`, opacity: prevImgFading ? 0 : 1 }} />}
        {currentImg && <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${currentImg})` }} />}
        <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
      </div>

      {/* TITLE */}
      {phase === 'title' && (
        <div className={`absolute inset-0 z-20 flex flex-col items-center justify-center cursor-pointer transition-opacity duration-2000 ${titleFade ? 'opacity-0' : 'opacity-100'}`} onClick={(e) => { e.stopPropagation(); handleClick(); }}>
          <h1 className="text-6xl md:text-8xl font-serif text-white tracking-widest mb-6 drop-shadow-lg">断水</h1>
          <p className="text-xl md:text-2xl font-serif text-white/80 tracking-wide drop-shadow-md">SEVER WATER</p>
          <p className="text-lg md:text-xl font-serif text-white/60 tracking-widest mt-2 drop-shadow-md">ACT 1 · THE DEBT</p>
          <p className="text-xs font-serif text-white/30 tracking-widest mt-12 animate-pulse uppercase">Click anywhere to begin</p>
        </div>
      )}

      {/* SCENE HUD */}
      {phase === 'playing' && (sceneMeta.scene || sceneMeta.location || sceneMeta.mood) && (
        <div className="absolute top-4 left-4 z-20 pointer-events-none safe-top">
          {sceneMeta.scene && (
            <div className="text-white/50 text-[10px] md:text-xs tracking-[0.3em] uppercase font-serif drop-shadow-md">
              {sceneMeta.scene}
            </div>
          )}
          {(sceneMeta.location || sceneMeta.mood) && (
            <div className="text-white/40 text-[10px] md:text-xs tracking-[0.25em] uppercase font-serif mt-1 drop-shadow-md">
              {[sceneMeta.location, sceneMeta.mood].filter(Boolean).join(' · ')}
            </div>
          )}
        </div>
      )}

      {/* TEXT PANEL */}
      {phase !== 'title' && !showChoices && (
        <div className="absolute bottom-0 left-0 w-full h-[45%] md:h-[35%] flex flex-col bg-gradient-to-t from-black via-black/95 via-65% to-transparent pointer-events-none">
          <div className="flex-1 overflow-y-auto px-6 pt-12 pb-20 md:pb-12 pointer-events-auto">
            <div className="max-w-3xl mx-auto">
              {nodes.slice(-VISIBLE_NODE_LIMIT).map(renderNode)}

              <div ref={scrollRef} />
            </div>
          </div>
        </div>
      )}

      {/* CHOICE OVERLAY */}
      {showChoices && choiceOptions.length > 0 && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-end md:justify-center bg-black/60 px-5 pt-16 pb-10 safe-bottom safe-top overflow-y-auto" onClick={(e) => e.stopPropagation()}>
          <div className="w-full max-w-5xl">
            <p className="text-center text-white/50 tracking-[0.3em] text-xs md:text-sm uppercase mb-6">
              {choicePrompt}
            </p>
            <div className="flex flex-col gap-3 md:grid md:grid-cols-3">
              {choiceOptions.map((choice) => (
                <button
                  key={choice.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleChoice(choice.id);
                  }}
                  className="text-left border border-white/20 bg-black/70 hover:bg-white/10 hover:border-white/40 active:bg-white/15 px-5 py-5 transition-colors min-h-[8rem]"
                >
                  <div className="text-white/35 text-xs tracking-widest mb-3">
                    {choice.id}
                  </div>
                  <div className="text-white/95 text-lg md:text-xl font-serif leading-tight">
                    {choice.label}
                  </div>
                  <div className="text-white/55 text-sm font-serif leading-relaxed mt-2">
                    {choice.intent}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* VOLUME */}
      <div className="absolute top-4 right-4 z-50">
        <button onClick={(e) => { e.stopPropagation(); setShowVolSlider(!showVolSlider); }} className="text-white/50 hover:text-white/80 p-2" aria-label="Volume">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" /></svg>
        </button>
        {showVolSlider && (
          <div className="absolute top-full right-0 mt-2 p-3 bg-black/80 rounded-sm" onClick={(e) => e.stopPropagation()}>
            <input type="range" min="0" max="1" step="0.01" value={volume} onChange={(e) => setVolume(parseFloat(e.target.value))} className="w-24 accent-white/60" />
          </div>
        )}
      </div>
    </div>
  );
}
