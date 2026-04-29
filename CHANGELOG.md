# Changelog

## v0.4.0 — Return to Form (2026-04-29)

### Added
- **Return-to-title flow**: Ending screen shows "Begin Anew" with full state/audio reset
- **Scene HUD**: Persistent scene name, location, mood overlay during gameplay
- **Persistent advance affordance**: Tap-to-continue always visible, not just on text changes
- **Cinematic choice overlay**: Full-screen 3-column grid with intent + outcome separation
- **Autosave**: Progress saved at scene headings; load on return visit
- **Image crossfade**: Proper prev/next image transitions with requestAnimationFrame

### Changed
- **Game.tsx decomposed**: 672 → 324 lines, extracted 7 sub-components + 4 audio modules
- **Lint clean**: 0 errors, 0 warnings (eslint-plugin-react-hooks v7 compat)
- **Stripped scaffolding**: Removed unused radix-ui, react-router, shadcn/ui dependencies
- **Bundle size**: 224 KB (down from ~500 KB with all radix packages)

### Fixed
- Title image renders on first paint (useState initializer)
- Narration skip no longer locked by busy guard
- Audio engine rebuilds on restart (stale Audio elements)
- Choice button double-fire protection
- Image transition uses functional setState (no stale closures)
- Volume control preserves per-cue fade scale

## v0.3.0 — Stability Hardening (2026-04-29)

### Fixed
- 5 blank-screen crashes (stale advance, narration lock, audio cue collision)
- Save/load validates schema before applying
- Advance function split into lifecycle phases
- 42 unit tests covering all state + data contracts
