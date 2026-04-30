import { useState, useEffect, useRef, useCallback } from 'react';
import { gameNodes, type GameNode, type ChoiceOption } from '../data';
import { applyChoice, resetState, saveProgress, loadProgress, clearProgress } from '../state';
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
const TITLE_DELAY_MS = 2000;
const CHOICE_ADVANCE_MS = 500;
const BUSY_LOCK_MS = 400;


export default function Game() {
  const titleNode = gameNodes['title'];
  const titleImagePosition = titleNode.image?.focalPoint ?? 'center';

  const [nodes, setNodes] = useState<GameNode[]>([]);
  const [phase, setPhase] = useState<'title' | 'playing' | 'ended'>('title');
  const [titleFade, setTitleFade] = useState(false);
  const [showChoices, setShowChoices] = useState(false);
  const [choiceOptions, setChoiceOptions] = useState<ChoiceOption[]>([]);
  const [choicePrompt, setChoicePrompt] = useState('');
  const [currentImg, setCurrentImg] = useState<string | null>(() => titleNode.image ? titleNode.image.src : null);
  const [currentImgPosition, setCurrentImgPosition] = useState<string>(titleImagePosition);
  const [prevImg, setPrevImg] = useState<string | null>(null);
  const [prevImgPosition, setPrevImgPosition] = useState<string>(titleImagePosition);
  const [prevImgFading, setPrevImgFading] = useState(false);
  const [narrationActive, setNarrationActive] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [sceneMeta, setSceneMeta] = useState<{ scene?: string; location?: string; mood?: string }>({});
  const [hasSave, setHasSave] = useState(() => {
    const save = loadProgress();
    return !!(save && save.currentNodeId !== 'title');
  });

  const { cue: cueRef, narr: narrRef } = useAudioEngines();
  
  const curNodeRef = useRef(((): string => {
    const save = loadProgress();
    return save && save.currentNodeId !== 'title' ? save.currentNodeId : 'title';
  })());
  const currentImgRef = useRef<string | null>(currentImg);
  const currentImgPositionRef = useRef<string>(currentImgPosition);
  const advancingRef = useRef(false);
  const choiceLockedRef = useRef(false);
  const choiceResolvingRef = useRef(false);

  // VOLUME
  useEffect(() => {
    cueRef.setVolume(volume);
    if (narrRef.audio) narrRef.audio.volume = volume;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [volume]);

  // CLEANUP
  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    return () => { cueRef.stopAll(); narrRef.stop(); };
  }, []);
  /* eslint-enable react-hooks/exhaustive-deps */

  // IMAGE
  const setImage = useCallback((src?: string, duration = 1, focalPoint = 'center') => {
    if (!src) return;

    const previousImage = currentImgRef.current;
    const previousPosition = currentImgPositionRef.current;

    if (previousImage === src) {
      currentImgPositionRef.current = focalPoint;
      setCurrentImgPosition(focalPoint);
      return;
    }

    setPrevImg(previousImage);
    setPrevImgPosition(previousPosition);
    currentImgRef.current = src;
    currentImgPositionRef.current = focalPoint;
    setCurrentImg(src);
    setCurrentImgPosition(focalPoint);

    requestAnimationFrame(() => setPrevImgFading(true));
    setTimeout(() => { setPrevImg(null); setPrevImgFading(false); }, duration * 1000);
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
      case 'fade-in': e.fadeInCue(cue, duration || 3, vol || 0.6); break;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ADVANCE
  const advance = useCallback((nodeId: string) => {
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

    if (node.image) setImage(node.image.src, node.image.duration ?? 1, node.image.focalPoint ?? 'center');
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
      setNodes((prev) => [...prev, node]);
      setShowChoices(false);
      setChoiceOptions([]);
    }

    setTimeout(() => { advancingRef.current = false; }, BUSY_LOCK_MS);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handleAudio, setImage, volume]);

  // CLICK
  const handleClick = useCallback(() => {
    if (choiceResolvingRef.current) return;
    if (!cueRef.userInteracted) cueRef.markInteracted();

    if (narrationActive && phase === 'playing') {
      narrRef.stop();
      setNarrationActive(false);
      return;
    }

    if (showChoices || phase === 'ended') return;

    if (phase === 'title') {
      if (!titleFade) {
        setTitleFade(true);
        if (cueRef.activeCue !== 1) {
          cueRef.playCue(1, 2);
        }
        setTimeout(() => {
          setPhase('playing');
          const save = loadProgress();
          if (save && save.currentNodeId !== 'title' && gameNodes[save.currentNodeId]) {
            curNodeRef.current = save.currentNodeId;
            advance(save.currentNodeId);
          } else {
            advance('scene1_heading');
          }
        }, TITLE_DELAY_MS);
      }
      return;
    }

    const node = gameNodes[curNodeRef.current];
    if (!node?.next) return;
    advance(node.next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, titleFade, showChoices, narrationActive, advance]);

  // CHOICE
  const handleChoice = useCallback((choiceId: string) => {
    if (choiceLockedRef.current || choiceResolvingRef.current) return;
    choiceLockedRef.current = true;
    choiceResolvingRef.current = true;

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
    setNodes([]);
    setPhase('title');
    setTitleFade(false);
    setShowChoices(false);
    setChoiceOptions([]);
    setChoicePrompt('');
    setCurrentImg(null);
    currentImgRef.current = null;
    setCurrentImgPosition('center');
    currentImgPositionRef.current = 'center';
    setPrevImg(null);
    setPrevImgPosition('center');
    setPrevImgFading(false);
    setNarrationActive(false);
    setSceneMeta({});
    setHasSave(false);
    curNodeRef.current = 'title';
    advancingRef.current = false;
    choiceLockedRef.current = false;
    choiceResolvingRef.current = false;
    const t = gameNodes['title'];
    if (t.image) {
      const pos = t.image.focalPoint ?? 'center';
      currentImgRef.current = t.image.src;
      currentImgPositionRef.current = pos;
      setCurrentImg(t.image.src);
      setCurrentImgPosition(pos);
    }
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

    setPhase('title');
    setTitleFade(false);
    setShowChoices(false);
    setChoiceOptions([]);
    setChoicePrompt('');
    setSceneMeta({});

    const t = gameNodes['title'];
    if (t.image) {
      setImage(t.image.src, t.image.duration ?? 1, t.image.focalPoint ?? 'center');
    }

    curNodeRef.current = 'title';
    advancingRef.current = false;
    choiceLockedRef.current = false;
    choiceResolvingRef.current = false;
    const save = loadProgress();
    setHasSave(!!(save && save.currentNodeId !== 'title'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setImage]);

  // BEGIN ANEW (from title screen)
  const handleBeginAnew = useCallback(() => {
    resetState();
    clearProgress();
    setHasSave(false);
    curNodeRef.current = 'title';
  }, []);

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
        {prevImg && <div className="absolute inset-0 bg-cover transition-opacity duration-1000" style={{ backgroundImage: `url(${prevImg})`, backgroundPosition: prevImgPosition, opacity: prevImgFading ? 0 : 1 }} />}
        {currentImg && <div className="absolute inset-0 bg-cover" style={{ backgroundImage: `url(${currentImg})`, backgroundPosition: currentImgPosition }} />}
        <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
      </div>

      {/* TITLE */}
      {phase === 'title' && (
        <TitleScreen
          titleFade={titleFade}
          hasSave={hasSave}
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
