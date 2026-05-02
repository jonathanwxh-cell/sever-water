# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed
- **Save schema versioned.** Save data now carries `version: 1`; mismatched versions are rejected on load instead of silently loading partial data.
- **State module hardened.** `heartState` and `flags` are now module-private. Public API (`applyChoice`, `getStateSnapshot`, `resetState`, `restoreProgress`) is unchanged; external mutation is no longer possible.
- **Cue audio paths externalised.** Moved cue file paths from `CueEngine` into `src/audio/cues.ts` so future acts can register cues without touching the engine.
- **Image crossfade state consolidated.** Replaced five `useState` hooks plus two parallel refs in `Game.tsx` with a single `useReducer`. Eliminates the dual source-of-truth between state and refs.
- **Advance lock is completion-tied.** Replaced fixed 260 ms `BUSY_LOCK_MS` with a per-node lock derived from the actual transition: image-bearing nodes lock for the full fade plus a small buffer, plain text nodes use a short click-debounce. Lock is cleared on unmount, restart, and return-to-title.

### Fixed
- **Audio fade race.** Per-cue active fade interval is now tracked and cancelled before starting a new fade. Previously, two fades on the same cue could race against `audio.volume`.

## [0.4.1] — 2026-04-30

Mobile stabilization, Mandarin narration, and audio mix.

### Added
- **Mandarin narration**: replaced English voiceover with Mandarin TTS (Xiaomi MiMo v2.5) across Act 1.
- **Build-safe focal-point support**: `Game.tsx` renderer can honor optional image focal points (`top`, `center`, `bottom`) without requiring a story-data rewrite.
- **End-of-act save marker**: `act1_end` is now a saved boundary for future Act 2 handoff.

### Changed
- **Single tap surface**: root `Game` container is the only normal tap-to-advance surface; `TextPanel` and `TitleScreen` no longer call the global advance handler.
- **Narration skip is non-destructive on mobile**: tapping during narration stops audio only; a second tap advances. Prevents accidental text skips on phones.
- **Image transitions respect `node.image.duration`**: previously forced 1000 ms cleanup for all fades.
- **Music ceiling applied consistently**: all fade-in cues now share the same target scale.
- **Default music volume lowered** for narration intelligibility.
- Removed old English narration takes from `public/assets/narration/`.

### Fixed
- **Vercel build unblocked**: `src/audio/` was being ignored by `.gitignore` due to a glob mismatch.
- **Continue-from-title** reloads the saved node from `localStorage` instead of relying on a stale in-memory `curNodeRef`.
- **Post-choice transition guard** blocks taps during the short delay between choice selection and callback routing.
- **Duplicate tap handling** removed from `TextPanel` and `TitleScreen`; `Begin Anew` and `Play Again` remain explicitly tappable.

## [0.4.0] — 2026-04-29 — Return to Form

### Added
- **Return-to-title flow**: ending screen shows "Begin Anew" with full state/audio reset.
- **Scene HUD**: persistent scene name, location, and mood overlay during gameplay.
- **Persistent advance affordance**: tap-to-continue always visible, not just on text changes.
- **Cinematic choice overlay**: full-screen 3-column grid with intent + outcome separation.
- **Autosave**: progress saved at scene headings; load on return visit.
- **Image crossfade**: prev/next image transitions with `requestAnimationFrame`.

### Changed
- **`Game.tsx` decomposed**: 672 → 324 lines, extracted 7 sub-components and 4 audio modules.
- **Lint clean**: 0 errors, 0 warnings (eslint-plugin-react-hooks v7 compat).
- **Stripped scaffolding**: removed unused radix-ui, react-router, and shadcn/ui dependencies.
- **Bundle size**: 224 KB (down from ~500 KB with all radix packages).

### Fixed
- Title image renders on first paint (`useState` initializer).
- Narration skip no longer locked by busy guard.
- Audio engine rebuilds on restart (stale `Audio` elements).
- Choice button double-fire protection.
- Image transition uses functional `setState` (no stale closures).
- Volume control preserves per-cue fade scale.

## [0.3.0] — 2026-04-29 — Stability Hardening

### Fixed
- 5 blank-screen crashes (stale advance, narration lock, audio cue collision).
- Save/load validates schema before applying.
- Advance function split into lifecycle phases.

### Added
- 42 unit tests covering all state and data contracts.

[Unreleased]: https://github.com/jonathanwxh-cell/sever-water/compare/v0.4.1...HEAD
[0.4.1]: https://github.com/jonathanwxh-cell/sever-water/compare/v0.4.0...v0.4.1
[0.4.0]: https://github.com/jonathanwxh-cell/sever-water/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/jonathanwxh-cell/sever-water/releases/tag/v0.3.0
