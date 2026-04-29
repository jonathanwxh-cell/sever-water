import { useRef, type MutableRefObject } from 'react';
import { CueEngine } from './CueEngine';
import { NarrationEngine } from './NarrationEngine';

// useLazyRef: like useRef but the initializer runs at most once (vs.
// useRef(new X()) which constructs a fresh X on every render and discards it).
// Without this, every state change in Game produced 3 orphan cue Audio
// elements and a fresh NarrationEngine, observable in DevTools.
function useLazyRef<T>(init: () => T): MutableRefObject<T> {
  const ref = useRef<T | null>(null);
  if (ref.current === null) ref.current = init();
  return ref as MutableRefObject<T>;
}

export default function useAudioEngines() {
  const cueRef = useLazyRef(() => new CueEngine());
  const narrRef = useLazyRef(() => new NarrationEngine());
  return { cue: cueRef.current, narr: narrRef.current };
}
