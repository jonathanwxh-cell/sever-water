/**
 * Unit Tests — State Logic Agent
 * Sever Water (断水) — Act 1 State Machine
 *
 * Runs verification checklist from Section 9 of the brief.
 */

const assert = require('assert');
const {
  applyChoice,
  resetState,
  getStateSnapshot,
  shouldRenderLuYuanHesitationCallback,
  getLiuRuyanOneOfThoseIntonation,
  shouldRenderTooManyQuestions
} = require('./state.js');

let passCount = 0;
let failCount = 0;

function test(name, fn) {
  try {
    fn();
    passCount++;
    console.log(`  ✓ ${name}`);
  } catch (e) {
    failCount++;
    console.log(`  ✗ ${name}`);
    console.log(`    ${e.message}`);
  }
}

function assertEqual(actual, expected, msg) {
  if (actual !== expected) {
    throw new Error(`${msg}: expected ${expected}, got ${actual}`);
  }
}

function assertDeepEqual(actual, expected, msg) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${msg}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

console.log('\n========================================');
console.log('STATE LOGIC UNIT TESTS');
console.log('========================================\n');

// ============================================================================
// Test 1: Choice 1A — Gave up letter
// ============================================================================
console.log('--- Choice 1A ---');
test('Choice 1A sets heartState.leng to +1', () => {
  resetState();
  applyChoice('1A');
  const snap = getStateSnapshot();
  assertEqual(snap.heartState.leng, 1, 'leng should be 1');
});

test('Choice 1A does not affect other heart states', () => {
  resetState();
  applyChoice('1A');
  const snap = getStateSnapshot();
  assertEqual(snap.heartState.cheng, 0, 'cheng should be 0');
  assertEqual(snap.heartState.yuan, 0, 'yuan should be 0');
  assertEqual(snap.heartState.huo, 0, 'huo should be 0');
});

test('Choice 1A sets flag A1', () => {
  resetState();
  applyChoice('1A');
  const snap = getStateSnapshot();
  assertEqual(snap.flags.A1, true, 'A1 should be true');
});

test('Choice 1A does not set other flags', () => {
  resetState();
  applyChoice('1A');
  const snap = getStateSnapshot();
  const falseFlags = ['B1', 'C1', 'A2', 'B2', 'C2', 'A3', 'B3', 'C3'];
  falseFlags.forEach(f => assertEqual(snap.flags[f], false, `${f} should be false`));
});

// ============================================================================
// Test 2: Choice 1B — Fought, kept letter
// ============================================================================
console.log('\n--- Choice 1B ---');
test('Choice 1B sets heartState.cheng to +1', () => {
  resetState();
  applyChoice('1B');
  const snap = getStateSnapshot();
  assertEqual(snap.heartState.cheng, 1, 'cheng should be 1');
});

test('Choice 1B sets flag B1', () => {
  resetState();
  applyChoice('1B');
  const snap = getStateSnapshot();
  assertEqual(snap.flags.B1, true, 'B1 should be true');
});

// ============================================================================
// Test 3: Choice 1C — Asked, not acted
// ============================================================================
console.log('\n--- Choice 1C ---');
test('Choice 1C sets heartState.huo to +1', () => {
  resetState();
  applyChoice('1C');
  const snap = getStateSnapshot();
  assertEqual(snap.heartState.huo, 1, 'huo should be 1');
});

test('Choice 1C sets flag C1', () => {
  resetState();
  applyChoice('1C');
  const snap = getStateSnapshot();
  assertEqual(snap.flags.C1, true, 'C1 should be true');
});

// ============================================================================
// Test 4: Choice 2A — Swore debt openly
// ============================================================================
console.log('\n--- Choice 2A ---');
test('Choice 2A sets heartState.cheng to +1 (cumulative)', () => {
  resetState();
  applyChoice('1A'); // leng +1
  applyChoice('2A'); // cheng +1
  const snap = getStateSnapshot();
  assertEqual(snap.heartState.cheng, 1, 'cheng should be 1');
  assertEqual(snap.heartState.leng, 1, 'leng should still be 1');
});

test('Choice 2A sets flag A2', () => {
  resetState();
  applyChoice('2A');
  const snap = getStateSnapshot();
  assertEqual(snap.flags.A2, true, 'A2 should be true');
});

// ============================================================================
// Test 5: Choice 2B — Acted silently
// ============================================================================
console.log('\n--- Choice 2B ---');
test('Choice 2B sets heartState.huo to +1', () => {
  resetState();
  applyChoice('2B');
  const snap = getStateSnapshot();
  assertEqual(snap.heartState.huo, 1, 'huo should be 1');
});

test('Choice 2B sets flag B2', () => {
  resetState();
  applyChoice('2B');
  const snap = getStateSnapshot();
  assertEqual(snap.flags.B2, true, 'B2 should be true');
});

// ============================================================================
// Test 6: Choice 2C — Asked the hard question
// ============================================================================
console.log('\n--- Choice 2C ---');
test('Choice 2C sets heartState.leng to +1', () => {
  resetState();
  applyChoice('2C');
  const snap = getStateSnapshot();
  assertEqual(snap.heartState.leng, 1, 'leng should be 1');
});

test('Choice 2C sets flag C2', () => {
  resetState();
  applyChoice('2C');
  const snap = getStateSnapshot();
  assertEqual(snap.flags.C2, true, 'C2 should be true');
});

// ============================================================================
// Test 7: Choice 3A — Duty Before Debt
// ============================================================================
console.log('\n--- Choice 3A ---');
test('Choice 3A sets heartState.yuan to +1', () => {
  resetState();
  applyChoice('3A');
  const snap = getStateSnapshot();
  assertEqual(snap.heartState.yuan, 1, 'yuan should be 1');
});

test('Choice 3A sets flag A3', () => {
  resetState();
  applyChoice('3A');
  const snap = getStateSnapshot();
  assertEqual(snap.flags.A3, true, 'A3 should be true');
});

// ============================================================================
// Test 8: Choice 3B — Debt Before Duty
// ============================================================================
console.log('\n--- Choice 3B ---');
test('Choice 3B sets heartState.cheng to +1', () => {
  resetState();
  applyChoice('3B');
  const snap = getStateSnapshot();
  assertEqual(snap.heartState.cheng, 1, 'cheng should be 1');
});

test('Choice 3B sets flag B3', () => {
  resetState();
  applyChoice('3B');
  const snap = getStateSnapshot();
  assertEqual(snap.flags.B3, true, 'B3 should be true');
});

// ============================================================================
// Test 9: Choice 3C — The Impossible Both
// ============================================================================
console.log('\n--- Choice 3C ---');
test('Choice 3C sets heartState.huo to +1', () => {
  resetState();
  applyChoice('3C');
  const snap = getStateSnapshot();
  assertEqual(snap.heartState.huo, 1, 'huo should be 1');
});

test('Choice 3C sets flag C3', () => {
  resetState();
  applyChoice('3C');
  const snap = getStateSnapshot();
  assertEqual(snap.flags.C3, true, 'C3 should be true');
});

// ============================================================================
// Test 10: Full playthrough — all choices accumulate correctly
// ============================================================================
console.log('\n--- Full Playthrough ---');
test('Playthrough 1A→2B→3C produces correct final state', () => {
  resetState();
  applyChoice('1A');
  applyChoice('2B');
  applyChoice('3C');
  const snap = getStateSnapshot();
  assertEqual(snap.heartState.leng, 1, 'leng should be 1');
  assertEqual(snap.heartState.huo, 2, 'huo should be 2');
  assertEqual(snap.heartState.cheng, 0, 'cheng should be 0');
  assertEqual(snap.heartState.yuan, 0, 'yuan should be 0');
  assertEqual(snap.flags.A1, true, 'A1 should be true');
  assertEqual(snap.flags.B2, true, 'B2 should be true');
  assertEqual(snap.flags.C3, true, 'C3 should be true');
});

test('Playthrough 1B→2A→3B produces correct final state', () => {
  resetState();
  applyChoice('1B');
  applyChoice('2A');
  applyChoice('3B');
  const snap = getStateSnapshot();
  assertEqual(snap.heartState.cheng, 3, 'cheng should be 3');
  assertEqual(snap.heartState.leng, 0, 'leng should be 0');
  assertEqual(snap.heartState.huo, 0, 'huo should be 0');
  assertEqual(snap.heartState.yuan, 0, 'yuan should be 0');
  assertEqual(snap.flags.B1, true, 'B1 should be true');
  assertEqual(snap.flags.A2, true, 'A2 should be true');
  assertEqual(snap.flags.B3, true, 'B3 should be true');
});

test('Playthrough 1C→2C→3A produces correct final state', () => {
  resetState();
  applyChoice('1C');
  applyChoice('2C');
  applyChoice('3A');
  const snap = getStateSnapshot();
  assertEqual(snap.heartState.huo, 1, 'huo should be 1');
  assertEqual(snap.heartState.leng, 1, 'leng should be 1');
  assertEqual(snap.heartState.yuan, 1, 'yuan should be 1');
  assertEqual(snap.heartState.cheng, 0, 'cheng should be 0');
  assertEqual(snap.flags.C1, true, 'C1 should be true');
  assertEqual(snap.flags.C2, true, 'C2 should be true');
  assertEqual(snap.flags.A3, true, 'A3 should be true');
});

// ============================================================================
// Callback Resolver Tests
// ============================================================================
console.log('\n--- Callback Resolver: Lu Yuan Hesitation (A1 or C1) ---');
test('Lu Yuan callback renders when A1 is true', () => {
  resetState();
  applyChoice('1A');
  assertEqual(shouldRenderLuYuanHesitationCallback(), true, 'should render when A1 true');
});

test('Lu Yuan callback renders when C1 is true', () => {
  resetState();
  applyChoice('1C');
  assertEqual(shouldRenderLuYuanHesitationCallback(), true, 'should render when C1 true');
});

test('Lu Yuan callback does NOT render when only B1 is true', () => {
  resetState();
  applyChoice('1B');
  assertEqual(shouldRenderLuYuanHesitationCallback(), false, 'should NOT render when only B1 true');
});

test('Lu Yuan callback does NOT render when no Scene 1 flags set', () => {
  resetState();
  assertEqual(shouldRenderLuYuanHesitationCallback(), false, 'should NOT render when no flags set');
});

console.log('\n--- Callback Resolver: Liu Ruyan "one of those" (B2) ---');
test('Intonation is "recognition" when B2 is true', () => {
  resetState();
  applyChoice('2B');
  assertEqual(getLiuRuyanOneOfThoseIntonation(), 'recognition', 'should be recognition');
});

test('Intonation is "flat" when B2 is false', () => {
  resetState();
  applyChoice('2A');
  assertEqual(getLiuRuyanOneOfThoseIntonation(), 'flat', 'should be flat');
});

test('Intonation is "flat" when no Scene 2 choice made', () => {
  resetState();
  assertEqual(getLiuRuyanOneOfThoseIntonation(), 'flat', 'should be flat');
});

console.log('\n--- Callback Resolver: "too many questions" (C3 AND C2) ---');
test('Line renders when both C3 and C2 are true', () => {
  resetState();
  applyChoice('2C');
  applyChoice('3C');
  assertEqual(shouldRenderTooManyQuestions(), true, 'should render when both true');
});

test('Line does NOT render when only C2 is true', () => {
  resetState();
  applyChoice('2C');
  applyChoice('3A');
  assertEqual(shouldRenderTooManyQuestions(), false, 'should NOT render when only C2');
});

test('Line does NOT render when only C3 is true', () => {
  resetState();
  applyChoice('2B');
  applyChoice('3C');
  assertEqual(shouldRenderTooManyQuestions(), false, 'should NOT render when only C3');
});

test('Line does NOT render when neither C2 nor C3 are true', () => {
  resetState();
  assertEqual(shouldRenderTooManyQuestions(), false, 'should NOT render when neither');
});

// ============================================================================
// Edge Case Tests
// ============================================================================
console.log('\n--- Edge Cases ---');
test('Invalid choice ID throws error', () => {
  resetState();
  let threw = false;
  try {
    applyChoice('99Z');
  } catch (e) {
    threw = true;
  }
  assertEqual(threw, true, 'should throw on invalid choice');
});

test('Reset state clears all heart states', () => {
  resetState();
  applyChoice('1A');
  applyChoice('2B');
  applyChoice('3C');
  resetState();
  const snap = getStateSnapshot();
  assertEqual(snap.heartState.cheng, 0, 'cheng should be 0');
  assertEqual(snap.heartState.yuan, 0, 'yuan should be 0');
  assertEqual(snap.heartState.huo, 0, 'huo should be 0');
  assertEqual(snap.heartState.leng, 0, 'leng should be 0');
});

test('Reset state clears all flags', () => {
  resetState();
  applyChoice('1A');
  applyChoice('2B');
  applyChoice('3C');
  resetState();
  const snap = getStateSnapshot();
  const allFlags = ['A1', 'B1', 'C1', 'A2', 'B2', 'C2', 'A3', 'B3', 'C3'];
  allFlags.forEach(f => assertEqual(snap.flags[f], false, `${f} should be false`));
});

// ============================================================================
// Summary
// ============================================================================
console.log('\n========================================');
console.log(`RESULTS: ${passCount} passed, ${failCount} failed`);
console.log('========================================\n');

if (failCount > 0) {
  process.exit(1);
}
