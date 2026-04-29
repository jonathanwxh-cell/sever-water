# Sever Water — Development Improvement Spec

You are helping improve an existing React + TypeScript + Vite interactive fiction game called **Sever Water (断水)**.

The goal is not to rewrite the whole app. Please make small, safe improvements that preserve the current game, story, visuals, and audio behavior.

## Current App

Repo: `jonathanwxh-cell/sever-water`

Main files:

- `src/components/Game.tsx` — main game component, node advancement, audio, image transitions, choice handling
- `src/data.ts` — story node graph, choices, images, audio references
- `src/state.ts` — hidden heart-state system, flags, callbacks, localStorage persistence
- `src/state.test.ts` — Vitest state tests

The game already works as a prototype. The requested work is to harden it so Act 2 can build on it safely.

---

## Priority 1 — Prevent double-click / double-choice state corruption

### Problem

Choices mutate global hidden state through `applyChoice(choiceId)`.

Currently, if the player taps/clicks a choice multiple times quickly, the same choice may be applied more than once. That can incorrectly increment heart-state counters and set up multiple delayed advances.

### Required change

In `Game.tsx`, make `handleChoice()` idempotent while a choice is being processed.

Use the existing `busyRef`, or add a separate `choiceLockedRef` if that keeps the logic cleaner.

Expected behavior:

- First click on a choice is accepted.
- Further clicks before the next node appears are ignored.
- `applyChoice(choiceId)` must only run once per selected choice.

Suggested implementation shape:

```ts
const handleChoice = useCallback((choiceId: string) => {
  if (busyRef.current) return;
  busyRef.current = true;

  applyChoice(choiceId);

  const choice = choiceOptions.find((c) => c.id === choiceId);
  if (choice) {
    setNodes((prev) => [
      ...prev,
      { id: `choice_${choiceId}`, text: choice.text, type: 'narration' as const },
    ]);
  }

  setShowChoices(false);
  setChoiceOptions([]);

  const currentNode = gameNodes[curNodeRef.current];
  const nextId = currentNode.next || 'act1_end';
  const resolvedNextId = resolveCallbackNode(choiceId, nextId);

  saveProgress(resolvedNextId);

  setTimeout(() => {
    busyRef.current = false;
    advance(resolvedNextId);
  }, CHOICE_ADVANCE_MS);
}, [choiceOptions, advance]);
```

Important: do not create a bug where `advance()` refuses to run because `busyRef.current` is still true. If needed, split the meaning into two refs:

```ts
const advancingRef = useRef(false);
const choiceLockedRef = useRef(false);
```

Keep the code simple.

---

## Priority 2 — Save final Act 1 state correctly

### Problem

The game currently saves progress mostly at scene boundaries. The final Act 1 choice mutates state, but the resulting final state may not be saved reliably for Act 2.

Act 2 will need to read:

- selected flags: `A1/B1/C1`, `A2/B2/C2`, `A3/B3/C3`
- hidden heart state: `cheng`, `yuan`, `huo`, `leng`
- final current node or act completion marker

### Required change

Persist state after every valid choice, not only at scene headings.

In `state.ts`, keep the existing `saveProgress(currentNodeId)` API unless a better minimal API is needed.

After `applyChoice(choiceId)`, call `saveProgress(...)` with the resolved next node ID or current checkpoint.

Expected outcome:

- After selecting the third choice, refreshing the page should preserve the final flags and heart state.
- `loadProgress()` should restore the same state.

---

## Priority 3 — Add graph integrity tests

### Problem

Current tests cover state transitions, but not the story graph itself. Future Act 2 work may accidentally introduce broken `next` references or callback targets.

### Required tests

Add a new test file, for example:

`src/data.test.ts`

Tests should verify:

1. Every `node.next` points to an existing node.
2. Every choice ID is accepted by `applyChoice()`.
3. Every callback node used by `resolveCallbackNode()` exists in `gameNodes`.
4. Every image/audio/narration path is a non-empty string when present.

Example direction:

```ts
import { describe, it, expect } from 'vitest';
import { gameNodes } from './data';
import { applyChoice, resetState } from './state';

describe('game node graph integrity', () => {
  it('all next references point to existing nodes', () => {
    for (const node of Object.values(gameNodes)) {
      if (node.next) {
        expect(gameNodes[node.next], `${node.id} -> ${node.next}`).toBeDefined();
      }
    }
  });

  it('all choice IDs are valid state choices', () => {
    for (const node of Object.values(gameNodes)) {
      for (const choice of node.choices ?? []) {
        resetState();
        expect(() => applyChoice(choice.id)).not.toThrow();
      }
    }
  });

  it('callback nodes exist', () => {
    expect(gameNodes.callback_3a_lu).toBeDefined();
    expect(gameNodes.callback_3b_liu).toBeDefined();
    expect(gameNodes.callback_3b_liu_recognition).toBeDefined();
    expect(gameNodes.callback_3c_too_many).toBeDefined();
  });

  it('asset paths are non-empty strings when present', () => {
    for (const node of Object.values(gameNodes)) {
      if (node.image) expect(node.image.src).toMatch(/^\/assets\//);
      if (node.narrationAudio) expect(node.narrationAudio).toMatch(/^\/assets\//);
    }
  });
});
```

---

## Priority 4 — Improve save validation

### Problem

`loadProgress()` trusts `localStorage` shape. If localStorage contains stale or malformed data, the state may become partially invalid.

### Required change

Add lightweight validation before assigning saved data into `heartState` and `flags`.

Expected behavior:

- Invalid save data returns `null`.
- Invalid save data should be cleared from localStorage.
- Valid save data still restores normally.

Suggested helper:

```ts
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
```

---

## Priority 5 — Reduce repeated Choice 3 outcome text

### Problem

Some choice option text already includes the full consequence of the decision. Then callback nodes may repeat or extend the same moment, creating duplicated narrative beats.

Do not rewrite the story heavily. Just clean up the structure if it is simple.

### Preferred design

Separate choice display text from outcome text.

Current shape:

```ts
interface ChoiceOption {
  id: string;
  label: string;
  text: string;
}
```

Possible improved shape:

```ts
interface ChoiceOption {
  id: string;
  label: string;
  preview: string;
  outcome?: string;
}
```

Rendering:

- Button shows `label` and `preview`.
- After selection, append `outcome` if present.
- Callback nodes should contain only conditional extra lines.

If this change touches too many nodes, skip the refactor and only remove the obvious repeated lines from Choice 3 / callback nodes.

---

## Priority 6 — Keep changes small and safe

Please avoid:

- full rewrite
- replacing the story engine
- changing creative text unnecessarily
- changing visual style
- changing audio behavior except where needed for bugs
- adding new libraries

Please do:

- preserve existing architecture
- keep TypeScript strictness passing
- keep tests passing with `npm run test`
- run build with `npm run build`
- keep commits focused

---

## Acceptance Criteria

The work is complete when:

1. Rapid double-clicking a choice does not double-apply state.
2. Final Act 1 choice state is saved and restored correctly.
3. `npm run test` passes.
4. `npm run build` passes.
5. New graph integrity tests exist.
6. Existing story flow still works from title screen to `END OF ACT 1`.
7. No major UI/style changes were introduced.

---

## Suggested Implementation Order

1. Add graph integrity tests first.
2. Fix choice locking.
3. Fix save-after-choice behavior.
4. Add save validation.
5. Lightly clean up repeated Choice 3 text only if safe.
6. Run test/build.
7. Report exactly what changed and any remaining risks.
