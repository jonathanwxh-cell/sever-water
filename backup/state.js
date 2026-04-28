/**
 * State Logic Agent Implementation
 * Sever Water (断水) — Act 1 State Machine
 * 
 * Implements Section 5 of the Kimi Swarm Brief verbatim.
 * DO NOT modify field names, do not add state variables.
 */

// Heart-state: tracks accumulated drift across four poles (hidden from player)
const heartState = {
  cheng: 0,   // 澄 serene
  yuan: 0,    // 怨 vengeful
  huo: 0,     // 惑 conflicted
  leng: 0     // 冷 hardened
};

// Flags: tracks specific narrative events for callbacks
const flags = {
  A1: false,  // Gave up letter
  B1: false,  // Fought, kept letter
  C1: false,  // Asked, not acted
  A2: false,  // Swore debt openly
  B2: false,  // Acted silently
  C2: false,  // Asked the hard question
  A3: false,  // Duty Before Debt
  B3: false,  // Debt Before Duty
  C3: false   // The Impossible Both
};

function applyChoice(choiceId) {
  const effects = {
    "1A": () => { heartState.leng += 1; flags.A1 = true; },
    "1B": () => { heartState.cheng += 1; flags.B1 = true; },
    "1C": () => { heartState.huo += 1; flags.C1 = true; },
    "2A": () => { heartState.cheng += 1; flags.A2 = true; },
    "2B": () => { heartState.huo += 1; flags.B2 = true; },
    "2C": () => { heartState.leng += 1; flags.C2 = true; },
    "3A": () => { heartState.yuan += 1; flags.A3 = true; },
    "3B": () => { heartState.cheng += 1; flags.B3 = true; },
    "3C": () => { heartState.huo += 1; flags.C3 = true; }
  };

  if (!effects[choiceId]) {
    throw new Error(`Invalid choice ID: ${choiceId}`);
  }

  effects[choiceId]();
}

/**
 * Reset state to initial values.
 * Used for testing and scene restarts.
 */
function resetState() {
  heartState.cheng = 0;
  heartState.yuan = 0;
  heartState.huo = 0;
  heartState.leng = 0;

  flags.A1 = false;
  flags.B1 = false;
  flags.C1 = false;
  flags.A2 = false;
  flags.B2 = false;
  flags.C2 = false;
  flags.A3 = false;
  flags.B3 = false;
  flags.C3 = false;
}

/**
 * Get current state snapshot (for testing / internal use).
 * Never exposed to the player UI.
 */
function getStateSnapshot() {
  return {
    heartState: { ...heartState },
    flags: { ...flags }
  };
}

// ============================================================================
// Callback Resolver — Act 1 dialogue branches
// Three dialogue lines in the script vary based on flags.
// ============================================================================

/**
 * 1. Junior Disciple Lu's dialogue in Scene 3 (Choice 3A path)
 *    If flag A1 OR C1 is true, Lu Yuan's lines reference the protagonist 
 *    hesitating or leaving the letter behind.
 * 
 * @returns {boolean} true if callback variant should be rendered
 */
function shouldRenderLuYuanHesitationCallback() {
  return flags.A1 === true || flags.C1 === true;
}

/**
 * 2. Liu Ruyan's "So you're one of those" line at dawn (Scene 3, Choice 3B path)
 *    If flag B2 is true, render with intonation marker `(recognition)`;
 *    otherwise render with marker `(flat)`.
 * 
 * @returns {string} "recognition" or "flat"
 */
function getLiuRuyanOneOfThoseIntonation() {
  return flags.B2 === true ? "recognition" : "flat";
}

/**
 * 3. Liu Ruyan's "You ask too many questions" line during the ride (Scene 3, Choice 3C path)
 *    Only render this line at all if flags C3 AND C2 are both true.
 *    Otherwise the line does not occur.
 * 
 * @returns {boolean} true if the line should be rendered
 */
function shouldRenderTooManyQuestions() {
  return flags.C3 === true && flags.C2 === true;
}

// ============================================================================
// Exports (Node.js compatible)
// ============================================================================

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    heartState,
    flags,
    applyChoice,
    resetState,
    getStateSnapshot,
    shouldRenderLuYuanHesitationCallback,
    getLiuRuyanOneOfThoseIntonation,
    shouldRenderTooManyQuestions
  };
}
