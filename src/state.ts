/**
 * State Logic Agent Implementation
 * Sever Water (断水) — Act 1 State Machine
 *
 * Implements Section 5 of the Kimi Swarm Brief verbatim.
 * DO NOT modify field names, do not add state variables.
 */

export interface HeartState {
  cheng: number;   // 澄 serene
  yuan: number;    // 怨 vengeful
  huo: number;     // 惑 conflicted
  leng: number;    // 冷 hardened
}

export interface Flags {
  A1: boolean;  // Gave up letter
  B1: boolean;  // Fought, kept letter
  C1: boolean;  // Asked, not acted
  A2: boolean;  // Swore debt openly
  B2: boolean;  // Acted silently
  C2: boolean;  // Asked the hard question
  A3: boolean;  // Duty Before Debt
  B3: boolean;  // Debt Before Duty
  C3: boolean;  // The Impossible Both
}

export interface StateSnapshot {
  heartState: HeartState;
  flags: Flags;
}

const INITIAL_HEART: HeartState = { cheng: 0, yuan: 0, huo: 0, leng: 0 };
const INITIAL_FLAGS: Flags = { A1: false, B1: false, C1: false, A2: false, B2: false, C2: false, A3: false, B3: false, C3: false };

export const heartState: HeartState = { ...INITIAL_HEART };
export const flags: Flags = { ...INITIAL_FLAGS };

export function applyChoice(choiceId: string): void {
  const effects: Record<string, () => void> = {
    "1A": () => { heartState.leng += 1; flags.A1 = true; },
    "1B": () => { heartState.cheng += 1; flags.B1 = true; },
    "1C": () => { heartState.huo += 1; flags.C1 = true; },
    "2A": () => { heartState.cheng += 1; flags.A2 = true; },
    "2B": () => { heartState.huo += 1; flags.B2 = true; },
    "2C": () => { heartState.leng += 1; flags.C2 = true; },
    "3A": () => { heartState.yuan += 1; flags.A3 = true; },
    "3B": () => { heartState.cheng += 1; flags.B3 = true; },
    "3C": () => { heartState.huo += 1; flags.C3 = true; },
  };

  if (!effects[choiceId]) {
    throw new Error(`Invalid choice ID: ${choiceId}`);
  }

  effects[choiceId]();
}

export function resetState(): void {
  Object.assign(heartState, INITIAL_HEART);
  Object.assign(flags, INITIAL_FLAGS);
}

export function getStateSnapshot(): StateSnapshot {
  return {
    heartState: { ...heartState },
    flags: { ...flags },
  };
}

// ============================================================================
// Callback Resolver — Act 1 dialogue branches
// ============================================================================

export function shouldRenderLuYuanHesitationCallback(): boolean {
  return flags.A1 || flags.C1;
}

export function getLiuRuyanOneOfThoseIntonation(): "recognition" | "flat" {
  return flags.B2 ? "recognition" : "flat";
}

export function shouldRenderTooManyQuestions(): boolean {
  return flags.C3 && flags.C2;
}

// ============================================================================
// Persistence — autosave at scene boundaries
// ============================================================================
const SAVE_KEY = 'sever_water_act1_save';

export interface SaveData {
  heartState: HeartState;
  flags: Flags;
  currentNodeId: string;
  timestamp: number;
}

export function saveProgress(currentNodeId: string): void {
  try {
    const data: SaveData = {
      heartState: { ...heartState },
      flags: { ...flags },
      currentNodeId,
      timestamp: Date.now(),
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch {
    // localStorage may be disabled — silently ignore
  }
}

function isValidSaveData(value: unknown): value is SaveData {
  if (!value || typeof value !== 'object') return false;
  const data = value as Partial<SaveData>;
  if (typeof data.currentNodeId !== 'string') return false;
  if (typeof data.timestamp !== 'number') return false;
  if (!data.heartState || !data.flags) return false;
  const h = data.heartState as Partial<HeartState>;
  const f = data.flags as Partial<Flags>;
  return (
    typeof h.cheng === 'number' &&
    typeof h.yuan === 'number' &&
    typeof h.huo === 'number' &&
    typeof h.leng === 'number' &&
    typeof f.A1 === 'boolean' &&
    typeof f.B1 === 'boolean' &&
    typeof f.C1 === 'boolean' &&
    typeof f.A2 === 'boolean' &&
    typeof f.B2 === 'boolean' &&
    typeof f.C2 === 'boolean' &&
    typeof f.A3 === 'boolean' &&
    typeof f.B3 === 'boolean' &&
    typeof f.C3 === 'boolean'
  );
}

export function readProgress(): SaveData | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!isValidSaveData(parsed)) {
      localStorage.removeItem(SAVE_KEY);
      return null;
    }
    return parsed;
  } catch {
    try { localStorage.removeItem(SAVE_KEY); } catch { /* ignore */ }
    return null;
  }
}

export function restoreProgress(data: SaveData): void {
  Object.assign(heartState, data.heartState);
  Object.assign(flags, data.flags);
}

export function loadProgress(): SaveData | null {
  const data = readProgress();
  if (!data) return null;
  restoreProgress(data);
  return data;
}

export function clearProgress(): void {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch {
    // ignore
  }
}
