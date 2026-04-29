# Changelog

All notable changes to *Sever Water* (断水) are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/) loosely, with a literary slant. Dates are in ISO 8601. Versions before v0.3.0 were never tagged but are documented retroactively for completeness.

---

## [Unreleased]

*Add entries here as work progresses. Promote to a versioned section when tagging a release.*

### Added

### Changed

### Fixed

### Removed

### Engineering notes

---

## [v0.3.0-act1] — 2026-04-29

### Act 1 — Stable Mobile Build

The first build that feels right. Mobile-first UX redesigned around the literary register the project was designed for. All known stability bugs fixed. Return-to-title with save preservation. Audio polished across every state transition.

### Added

- **Dynamic viewport for mobile Safari.** `100dvh` and `safe-area-inset-bottom` so text never hides behind iOS Safari's collapsing toolbar. This was the single biggest UX win in the redesign — the game stopped feeling broken on phones.
- **Cinematic choice overlay.** Choice moments now stop time. Full-screen dimmed background, three cards (label + intent only), no spoiler prose visible until selection. On mobile, cards stack vertically; on desktop, three columns.
- **Persistent scene HUD.** Subtle top-left text showing act, location, and mood (e.g. `ACT I · THE DEBT / ONE-LINE SKY · RAIN`). Anchors the player without becoming a dashboard.
- **Visible node limit.** The text panel now shows only the last 3 paragraphs at any time, replacing the accumulating-transcript pattern with cinematic staging.
- **Persistent advance affordance.** A single, clearly visible "Tap to continue" / "Tap to skip narration" indicator at the bottom of the screen, above iOS chrome. Replaces the two confused affordances (floating skip badge + invisible bottom hint) the original build had.
- **Return to title feature.** Top-right home button accessible at any point during gameplay. Crossfades audio from current cue to title music (Cue 1), crossfades image from current scene to title image. Save state preserved.
- **Continue vs. Begin Anew.** Title screen now distinguishes resumable saves ("Tap to continue" with subtle "Begin Anew" link) from fresh starts ("Tap to begin"). Players always land on the title screen first, never auto-resumed silently.
- **Image transition stability.** Functional state updates in `setImage` eliminate stale closure bugs that previously caused blank or wrong images during rapid skipping.
- **Save validation on load.** localStorage data is validated before applying. Corrupt saves are cleared rather than crashing the game.
- **Graph integrity tests.** Vitest suite verifies all `next` references point to real nodes, all choice IDs are valid state inputs, all callback nodes exist, all asset paths use the `/assets/` prefix, all choice nodes have at least 2 options. Catches a class of regression that would otherwise only surface during manual playtest.
- **Choice double-click protection.** `choiceLockedRef` separate from `advancingRef` prevents rapid clicks from double-applying state.

### Changed

- **`ChoiceOption` data model split into `label` / `intent` / `outcome`.** Buttons show only the action label and a one-line intent. Full prose appears as narration after selection. Eliminates the spoiler problem where players could read the consequence of each choice before committing.
- **Image / text proportion rebalanced for mobile.** 55% image / 45% text on mobile portrait, 65/35 on desktop. Gives literary prose room to breathe on the small screen.
- **Choice button copy rewritten in literary register.** "Hand it over" became "Hand over the letter / Survive the gorge. Carry the shame later." All 9 choices got short label + aphoristic intent, matching the project's wuxia voice.
- **Narration line height increased to `leading-loose`.** Paragraph spacing increased to `mb-6`. Text breathes more, feels less like a web article.
- **Text panel gradient softened.** From a hard black band to a smooth fade from solid black at the bottom to transparent at the top. No more visible seam between image and text.
- **Background music behavior on return-to-title.** When the player clicks home, non-title cues fade out over 2 seconds, title music starts after 1.5 seconds. If already on title music, leave it. If no music playing (e.g. during the silence cue), start title music immediately.
- **Title-tap audio guard.** Tapping the title to continue no longer restarts Cue 1 if it's already playing — eliminates the audible drop-and-fade-back-in hiccup on the return-to-title-then-continue flow.

### Fixed

- **Choice hang.** Removing the premature `busyRef.current = true` in `handleChoice` that was preventing the delayed `advance` from running after a choice was selected.
- **Skip-narration freeze.** When the player skipped narration during the 400ms post-transition window, `advance` would refuse to run because `busyRef` was still set from the previous transition. Added explicit `advancingRef = false` in the skip path.
- **No music on restart.** After completing Act 1 and clicking "Play Again," title music never started. Refactored the audio engine to fully rebuild Audio elements on restart rather than trying to reuse paused-and-reset ones.
- **Silence cue resume.** After the bell-strike line in Scene 2 hard-muted Cue 2, the subsequent fade-back-in failed because of an early-return guard checking `audio.paused` (a muted-but-playing track is not paused). Refactored `fadeInCue` to handle the muted-but-playing case correctly.
- **Volume scaling lost across volume slider changes.** When Cue 2 was at 60% post-silence and the user adjusted the master volume, the cue jumped to 100% master volume. Added per-cue scale factors preserved across volume changes.
- **Narration audio cut off mid-paragraph.** The original swarm split single paragraphs across multiple nodes, but narration audio files covered the full original paragraph. Merged the split nodes back together so audio plays continuously over the text it accompanies.
- **Title image not rendered on first paint.** Original code waited for `useEffect` to set the title image, producing a black flash on initial load. Set the title image as the initial state value of `currentImg`.
- **`advancingRef` not actually engaged.** During the busy-state refactor, the line that set `advancingRef.current = true` inside `advance()` was accidentally deleted, breaking the busy-lock entirely. Restored the line after the null check.
- **Black flash on return-to-title.** Original implementation set `currentImg` to `null` before re-rendering the title image, producing a brief black screen. Replaced with a proper crossfade from the current scene image to the title image.
- **Choice 3B path showing duplicated dialogue.** "So you're one of those" line was rendered both in the choice outcome and in the callback node. Removed it from the outcome — the callback now owns this line exclusively.
- **localStorage corruption crashed the game.** Added type-safe validation before applying loaded save data. Corrupt saves are cleared and the game starts fresh.

### Removed

- **Dead `post_choice3` router node.** Was a stub that never got visited because the routing happened in `Game.tsx` via `resolveCallbackNode`. Removed both the node and the unused `choiceBranches` export.
- **Backup test directory.** Migrated `backup/state.test.js` (a hand-mirrored CommonJS file) to `src/state.test.ts` (vitest, importing from real source). Single source of truth for state machine logic.
- **Mid-game auto-resume on page load.** Previously a save would silently auto-resume on page refresh. Now the title screen always appears first and the player chooses to continue. Standard pattern, also makes return-to-title behave consistently.

### Engineering notes

- The `BUSY_LOCK_MS = 400` change exposed a class of dormant bugs in code paths that called `advance()` outside the normal flow. Each one required explicit busy-flag handling. Pattern worth remembering: any non-standard advance call needs `advancingRef.current = false` set just before calling `advance`.
- Stateful refs in React (`useRef` holding heavy objects like `CueEngine`) need explicit rebuild paths, not just cleanup methods. The "no music on restart" bug came from trying to reuse Audio elements after `pause()` + `currentTime = 0`. Fresh objects always work; stale objects sometimes don't.
- The Kimi swarm one-shot output was 80% correct, 20% subtle bugs. The subtle bugs were not detectable by the swarm's own QA agent (which rubber-stamped autosave even though it wasn't implemented). Manual code review caught what the swarm missed.

---

## [v0.2.0-stabilization] — 2026-04-28 (untagged)

### Round 1 fixes after the initial swarm build

The Kimi swarm produced a working playable on first attempt, but several bugs only surface during real playthrough. This phase addressed them.

### Added

- **Autosave at scene boundaries.** Implemented localStorage save/load with `saveProgress`, `loadProgress`, `clearProgress` functions. Saves fire on `scene-heading` and `title` nodes.
- **Vitest test infrastructure.** Migrated from a hand-mirrored CommonJS test file to vitest with TypeScript, importing the real `state.ts` directly.

### Fixed

- **Audio cue scale factors lost on volume change** — added per-cue scaling preserved across master volume adjustments.
- **Silence cue resume failed** — `fadeInCue` was returning early on muted-but-playing tracks.
- **Choice button text doubled with subsequent narration** — narration paragraphs were rendered twice.
- **Image transition timing mismatch** — CSS transition was 1000ms but JS cleanup used 2000ms.
- **Busy lock at 50ms too short for image transitions** — raised to 400ms.

### Removed

- **Dead `post_choice3` router node.** Routing was actually handled in `Game.tsx` via the callback resolver.
- **`choiceBranches` export.** Never imported anywhere.

### Critical hotfixes (same day)

- **Choice hang** — removed premature `busyRef = true` in `handleChoice` that was blocking the delayed `advance`.
- **Skip narration freeze** — added busy override in narration-skip path.
- **No music on restart** — `CueEngine` now fully rebuilds Audio elements via `rebuild()` instead of trying to reuse paused ones.
- **Title image not on first paint** — set as initial state rather than waiting for `useEffect`.

### Asset deployment

- 13 ink-wash images committed to `public/assets/images/` (8 character/style references, 5 scene illustrations).
- 9 narration audio files committed to `public/assets/narration/` after MiniMax TTS generation.

---

## [v0.1.0-initial] — 2026-04-28 (untagged)

### Initial release — Kimi swarm one-shot build

The first playable version of *Sever Water* (断水) Act 1, assembled by a multi-agent swarm from a single brief.

### Project structure

- React 19 + TypeScript + Vite + Tailwind frontend
- State machine in `src/state.ts` with 4-pole heart state (澄 serene / 怨 vengeful / 惑 conflicted / 冷 hardened) and 9 narrative flags
- Story graph in `src/data.ts` as a directed node graph
- Audio engine (`CueEngine`) for music cues with crossfade, hard-mute, and fade-in
- Narration engine (`NarrationEngine`) for single-track TTS playback
- Callback resolver for flag-dependent dialogue branching
- `Game.tsx` component handling all rendering and state transitions

### Story content

- **Act 1 · The Debt** — three scenes, three choices, nine flagged outcomes
  - Scene 1 — One-Line Sky (gorge confrontation)
  - Scene 2 — The Third Shadow (rescue and debt)
  - Scene 3 — The Inn at Crossing-Stone (impossible choice)
- Hidden state across four heart-poles plus 9 narrative flags
- Three flag-dependent callback dialogues in Scene 3
- One ending node (Act 1 transition, four endings deferred to Acts 2-3)

### Asset references

- 8 reference images (character portraits, location anchors, style anchor)
- 5 scene illustrations
- 3 music cues (Mountain Gate, One-Line Sky, Water-Gazing Pavilion)
- 9 narration paragraphs flagged for TTS generation
- Single Act 1 script (~3,500 words) preserving classical Chinese phrases (一线天, 断水剑法, 寒山, 望水楼, 山月不知心里事)

### Engineering scope

- State machine with applyChoice, callback resolution, reset
- Audio cue management with master volume control
- Image rendering with crossfade transitions
- Choice rendering with click handling
- Title screen with fade-in music
- "Play Again" restart at end of act
- Test suite covering all 9 choices, callback resolver, full playthroughs

---

## Pre-release notes

The project began as a literary wuxia choice game in the style of Jin Yong (金庸) and Gu Long (古龙), with the visual register of Wong Kar-wai's *Ashes of Time* (东邪西毒). The pipeline was designed around AI-assisted creative work:

- **Script:** DeepSeek
- **Visuals:** ChatGPT Images 2.0
- **Music:** MiniMax Music 2.6
- **Narration:** MiniMax Speech
- **Code assembly:** Kimi multi-agent swarm
- **Code review and iteration:** human-in-the-loop with Claude

The framework explicitly favored restraint over visual variety, sparse music with deliberate silence, and prose-led literary moments rather than dashboard UX. Acts 2 and 3 are planned but not yet drafted.

---

## Future work

- **Act 2** — script, images, music, narration. Heart-state thresholds begin influencing branching paths.
- **Act 3** — climactic act with four ending paths determined by accumulated heart-state and flags.
- **Endings module** — four narrative endings, each with its own visual and audio treatment.
- **Optional UX polish** — transcript view, keyboard navigation, accessibility improvements, possible PWA install flow for iOS.
- **Possible future port** — Tauri or Electron desktop wrapper, post-Act 3, if Steam release becomes a goal.
