import { useEffect, useReducer, useRef, useCallback, useState } from 'react';
import { gameNodes, type GameNode, type ChoiceOption } from '../data';
import {
  applyChoice,
  resetState,
  saveProgress,
  readProgress,
  restoreProgress,
  clearProgress,
  type SaveData,
} from '../state';
import resolveCallbackNode from '../game/callback';
import useAudioEngines from '../audio/useAudioEngines';
import TitleScreen from "./TitleScreen";
import SceneHud from "./SceneHud";
import TextPanel from "./TextPanel";
import ChoiceOverlay from "./ChoiceOverlay";
import AudioControls from "./AudioControls";
import AdvanceAffordance from "./AdvanceAffordance";


// ============================================================================
// GAME COMPONENT
// ============================================================================
const TITLE_DELAY_MS = 450;
const CHOICE_ADVANCE_MS = 260;
const SHORT_LOCK_MS = 150;     // baseline click-debounce when no visual transition
const LOCK_BUFFER_MS = 50;     // small grace period after image fade completes

type ImageWithFocalPoint = NonNullable<GameNode['image']> & {
  focalPoint?: string;
};

type AdvanceOptions = {
  replace?: boolean;
};

function getFocalPoint(image?: GameNode['image']): string {
  return (image as ImageWithFocalPoint | undefined)?.focalPoint ?? 'center';
}

function isUsableSave(save: SaveData | null): save is SaveData {
  return !!(save && save.currentNodeId !== 'title' && gameNodes[save.currentNodeId]);
}

// ============================================================================
// Image state — owns crossfade. Reducer reads previous state synchronously,
// so no parallel ref is needed to mirror current image src/position.
// ============================================================================
type ImageState = {
  current: { src: string | null; position: string };
  prev: { src: string | null; position: string; fading: boolean };
};

type ImageAction =
  | { type: 'set'; src: string; position: string }       // crossfade to new image
  | { type: 'reposition'; position: string }              // same src, change focal point
  | { type: 'start-fade' }                                // begin prev-fade animation
  | { type: 'clear-prev' }                                // remove prev after fade
  | { type: 'force'; src: string | null; position: string }; // hard reset, no crossfade

function imageReducer(state: ImageState, action: ImageAction): ImageState {
  switch (action.type) {
    case 'set':
      if (state.current.src === action.src) {
        return { ...state, current: { src: action.src, position: action.position } };
      }
      return {
        current: { src: action.src, position: action.position },
        prev: { src: state.current.src, position: state.current.position, fading: false },
      };
    case 'reposition':
      return { ...state, current: { ...state.current, position: action.position } };
    case 'start-fade':
      return { ...state, prev: { ...state.prev, fading: true } };
    case 'clear-prev':
      return { ...state, prev: { src: null, position: state.prev.position, fading: false } };
    case 'force':
      return {
        current: { src: action.src, position: action.position },
        prev: { src: null, position: action.position, fading: false },
      };
  }
}

function initialImageState(): ImageState {
  const titleNode = gameNodes['title'];
  const pos = getFocalPoint(titleNode.image);
  return {
    current: { src: titleNode.image?.src ?? null, position: pos },
    prev: { src: null, position: pos, fading: false },
  };
}

export default function Game() {
  const [nodes, setNodes] = useState<GameNode[]>([]);
  const [phase, setPhase] = useState<'title' | 'playing' | 'ended'>('title');
  const [titleFade, setTitleFade] = useState(false);
  const [showChoices, setShowChoices] = useState(false);
  const [choiceOptions, setChoiceOptions] = useState<ChoiceOption[]>([]);
  const [choicePrompt, setChoicePrompt] = useState('');
  const [image, dispatchImage] = useReducer(imageReducer, undefined, initialImageState);
  const [narrationActive, setNarrationActive] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [sceneMeta, setSceneMeta] = useState<{ scene?: string; location?: string; mood?: string }>({});
  const [hasSave, setHasSave] = useState(() => isUsableSave(readProgress()));

  const { cue: cueRef, narr: narrRef } = useAudioEngines();

  const curNodeRef = useRef('title');
  const advancingRef = useRef(false);
  const advanceUnlockRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const choiceLockedRef = useRef(false);
  const choiceResolvingRef = useRef(false);
  const titleStartingRef = useRef(false);

  // VOLUME
  useEffect(() => {
    cueRef.setVolume(volume);
    if (narrRef.audio) narrRef.audio.volume = volume;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [volume]);

  // CLEANUP
  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    return () => {
      cueRef.stopAll();
      narrRef.stop();
      if (advanceUnlockRef.current) clearTimeout(advanceUnlockRef.current);
    };
  }, []);
  /* eslint-enable react-hooks/exhaustive-deps */

  // IMAGE — crossfade orchestration
  const setImage = useCallback((src?: string, duration = 1, focalPoint = 'center') => {
    if (!src) return;
    dispatchImage({ type: 'set', src, position: focalPoint });
    requestAnimationFrame(() => dispatchImage({ type: 'start-fade' }));
    setTimeout(() => dispatchImage({ type: 'clear-prev' }), duration * 1000);
  }, []);

  // AUDIO TRIGGERS
  const handleAudio = useCallback((node: GameNode) => {
    if (!node.audio) return;
    const { action, cue, duration, volume: vol } = node.audio;
    const e = cueRef;
    switch (action) {
      case 'play': e.playCue(cue, duration || 0); break;
      case 'fade-out': e.fadeOutCue(cue, duration || 2); break;
      case 'hard-mute': e.hardMute(cue); break;
      case 'fade-in': e.fadeInCue(cue, duration || 3, vol); break;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ADVANCE — lock duration is derived from the node's actual transition,
  // not a fixed timer. Image-bearing nodes lock for the full fade; plain
  // text nodes use a short click-debounce only.
  const advance = useCallback((nodeId: string, options: AdvanceOptions = {}) => {
    if (advancingRef.current) return;
    const node = gameNodes[nodeId];
    if (!node) return;
    advancingRef.current = true;

    curNodeRef.current = nodeId;

    if (node.sceneLabel || node.locationLabel || node.moodLabel) {
      setSceneMeta((prev) => ({
        scene: node.sceneLabel ?? prev.scene,
        location: node.locationLabel ?? prev.location,
        mood: node.moodLabel ?? prev.mood,
      }));
    }

    if (node.type === 'scene-heading' || node.type === 'title' || node.type === 'ending') {
      saveProgress(nodeId);
    }

    if (node.type === 'ending') setPhase('ended');
    else if (node.type !== 'title') setPhase('playing');

    let lockMs = SHORT_LOCK_MS;
    if (node.image) {
      const dur = node.image.duration ?? 1;
      setImage(node.image.src, dur, getFocalPoint(node.image));
      lockMs = Math.max(SHORT_LOCK_MS, dur * 1000 + LOCK_BUFFER_MS);
    }
    handleAudio(node);

    narrRef.stop();
    if (node.narrationAudio) {
      setNarrationActive(true);
      narrRef.play(node.narrationAudio, volume, () => setNarrationActive(false));
    } else {
      setNarrationActive(false);
    }

    if (node.type === 'choice') {
      setNodes([node]);
      setChoicePrompt(node.text);
      setChoiceOptions(node.choices || []);
      setShowChoices(true);
    } else {
      setNodes((prev) => {
        if (options.replace) return [node];
        if (prev[prev.length - 1]?.id === node.id) return prev;
        return [...prev, node];
      });
      setShowChoices(false);
      setChoiceOptions([]);
    }

    if (advanceUnlockRef.current) clearTimeout(advanceUnlockRef.current);
    advanceUnlockRef.current = setTimeout(() => {
      advancingRef.current = false;
      advanceUnlockRef.current = null;
    }, lockMs);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handleAudio, setImage, volume]);

  // TITLE START / RESUME
  const beginFromTitle = useCallback((mode: 'resume' | 'restart' = 'resume') => {
    if (titleStartingRef.current) return;
    titleStartingRef.current = true;

    if (!cueRef.userInteracted) cueRef.markInteracted();
    narrRef.stop();
    advancingRef.current = false;
    choiceLockedRef.current = false;
    choiceResolvingRef.current = false;

    let targetNodeId = 'scene1_heading';

    if (mode === 'restart') {
      resetState();
      clearProgress();
      setHasSave(false);
    } else {
      const save = readProgress();
      if (isUsableSave(save)) {
        restoreProgress(save);
        targetNodeId = save.currentNodeId;
      } else {
        resetState();
        clearProgress();
        setHasSave(false);
      }
    }

    setNodes([]);
    setSceneMeta({});
    setShowChoices(false);
    setChoiceOptions([]);
    setChoicePrompt('');
    setNarrationActive(false);
    setTitleFade(true);

    if (cueRef.activeCue !== 1) {
      cueRef.playCue(1, 2);
    }

    setTimeout(() => {
      setPhase('playing');
      advance(targetNodeId, { replace: true });
      titleStartingRef.current = false;
    }, TITLE_DELAY_MS);
  }, [advance, cueRef, narrRef]);

  // CLICK
  const handleClick = useCallback(() => {
    if (choiceResolvingRef.current) return;
    if (!cueRef.userInteracted) cueRef.markInteracted();

    if (phase === 'title') {
      beginFromTitle('resume');
      return;
    }

    if (narrationActive && phase === 'playing') {
      narrRef.stop();
      setNarrationActive(false);
      return;
    }

    if (showChoices || phase === 'ended') return;

    const node = gameNodes[curNodeRef.current];
    if (!node?.next) return;
    advance(node.next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, showChoices, narrationActive, advance, beginFromTitle]);

  // CHOICE
  const handleChoice = useCallback((choiceId: string) => {
    if (choiceLockedRef.current || choiceResolvingRef.current) return;
    choiceLockedRef.current = true;
    choiceResolvingRef.current = true;

    applyChoice(choiceId);

    const choice = choiceOptions.find((c) => c.id === choiceId);
    if (choice) {
      setNodes([{ id: `choice_${choiceId}`, text: choice.outcome, type: 'narration' as const }]);
    }

    setShowChoices(false);
    setChoiceOptions([]);

    const currentNode = gameNodes[curNodeRef.current];
    const nextId = currentNode.next || 'act1_end';
    const resolvedNextId = resolveCallbackNode(choiceId, nextId);

    saveProgress(resolvedNextId);

    setTimeout(() => {
      choiceLockedRef.current = false;
      choiceResolvingRef.current = false;
      advance(resolvedNextId);
    }, CHOICE_ADVANCE_MS);
  }, [choiceOptions, advance]);

  // RESTART
  const handleRestart = useCallback(() => {
    resetState();
    clearProgress();
    cueRef.rebuild();
    narrRef.stop();
    if (advanceUnlockRef.current) {
      clearTimeout(advanceUnlockRef.current);
      advanceUnlockRef.current = null;
    }
    setNodes([]);
    setPhase('title');
    setTitleFade(false);
    setShowChoices(false);
    setChoiceOptions([]);
    setChoicePrompt('');
    setNarrationActive(false);
    setSceneMeta({});
    setHasSave(false);
    curNodeRef.current = 'title';
    advancingRef.current = false;
    choiceLockedRef.current = false;
    choiceResolvingRef.current = false;
    titleStartingRef.current = false;
    const t = gameNodes['title'];
    dispatchImage({ type: 'force', src: t.image?.src ?? null, position: getFocalPoint(t.image) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleReturnToTitle = useCallback(() => {
    narrRef.stop();
    setNarrationActive(false);

    const activeCue = cueRef.activeCue;
    if (activeCue && activeCue !== 1) {
      cueRef.fadeOutCue(activeCue, 2);
      setTimeout(() => {
        cueRef.playCue(1, 2);
      }, 1500);
    } else if (activeCue === 0) {
      cueRef.playCue(1, 2);
    }

    setNodes([]);
    setPhase('title');
    setTitleFade(false);
    setShowChoices(false);
    setChoiceOptions([]);
    setChoicePrompt('');
    setSceneMeta({});

    const t = gameNodes['title'];
    if (t.image) {
      setImage(t.image.src, t.image.duration ?? 1, getFocalPoint(t.image));
    }

    curNodeRef.current = 'title';
    advancingRef.current = false;
    if (advanceUnlockRef.current) {
      clearTimeout(advanceUnlockRef.current);
      advanceUnlockRef.current = null;
    }
    choiceLockedRef.current = false;
    choiceResolvingRef.current = false;
    titleStartingRef.current = false;
    setHasSave(isUsableSave(readProgress()));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setImage]);

  // BEGIN ANEW (from title screen)
  const handleBeginAnew = useCallback(() => {
    beginFromTitle('restart');
  }, [beginFromTitle]);

  // KEYBOARD
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); handleClick(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleClick]);

  // RENDER
  return (
    <div className="relative w-full h-screen-dynamic overflow-hidden bg-black select-none safe-bottom safe-top" onClick={handleClick}>
      {/* IMAGES */}
      <div className="absolute top-0 left-0 w-full h-[55%] md:h-[65%] overflow-hidden">
        {image.prev.src && <div className="scene-image absolute inset-0 bg-cover transition-opacity duration-1000" style={{ backgroundImage: `url(${image.prev.src})`, backgroundPosition: image.prev.position, opacity: image.prev.fading ? 0 : 1 }} />}
        {image.current.src && <div className="scene-image absolute inset-0 bg-cover" style={{ backgroundImage: `url(${image.current.src})`, backgroundPosition: image.current.position }} />}
        <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
      </div>

      {/* TITLE */}
      {phase === 'title' && (
        <TitleScreen
          titleFade={titleFade}
          hasSave={hasSave}
          onStart={() => beginFromTitle('resume')}
          onBeginAnew={handleBeginAnew}
        />
      )}

      {/* SCENE HUD */}
      {phase === 'playing' && <SceneHud sceneMeta={sceneMeta} />}

      {/* TEXT PANEL */}
      {phase !== 'title' && !showChoices && (
        <TextPanel nodes={nodes} onRestart={handleRestart} />
      )}

      {/* CHOICE OVERLAY */}
      {showChoices && choiceOptions.length > 0 && (
        <ChoiceOverlay choicePrompt={choicePrompt} choiceOptions={choiceOptions} onChoice={handleChoice} />
      )}

      {/* TOP-RIGHT CONTROLS */}
      <AudioControls phase={phase} volume={volume} onVolumeChange={setVolume} onReturnToTitle={handleReturnToTitle} />

      {/* ADVANCE AFFORDANCE */}
      {phase === 'playing' && !showChoices && (
        <AdvanceAffordance narrationActive={narrationActive} />
      )}
    </div>
  );
}
