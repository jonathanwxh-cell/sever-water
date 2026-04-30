# Mobile Stabilization Changelog

Date: 2026-04-30

This change log documents the mobile-first interaction stabilization pass applied after the cinematic choice-overlay refactor.

## Summary

The game is designed primarily for mobile. This pass reduces accidental double-tap / over-tap behavior, makes narration skipping less destructive, fixes continue-from-title behavior, and prepares image rendering for better mobile crop control.

## Changed

- Removed duplicate child tap handling from the text panel and title screen.
  - The root `Game` container is now the single normal tap-to-advance surface.
  - `TextPanel` no longer calls the global advance handler itself.
  - `TitleScreen` no longer calls the global advance handler itself.
  - Specific buttons such as `Begin Anew` and `Play Again` remain explicitly tappable.

- Changed narration skip behavior for mobile.
  - Before: tapping during narration stopped narration and immediately advanced to the next node.
  - After: tapping during narration only stops the current narration audio. The player taps again to continue.
  - This prevents accidental text skips on phones.

- Added post-choice transition guarding.
  - Introduced a choice-resolution guard to block normal taps during the short delay between selecting a choice and advancing to the callback / next node.
  - This prevents mobile taps from interfering with callback routing after a choice.

- Fixed continue-from-title behavior.
  - Returning to title now preserves the save marker correctly.
  - Continuing from title reloads the saved node from `localStorage` instead of relying on a stale in-memory `curNodeRef`.

- Saved progress at ending nodes.
  - `act1_end` now becomes a real saved marker for future Act 2 handoff.

- Improved image transition handling.
  - `node.image.duration` is now respected instead of forcing a fixed 1000ms cleanup for all image fades.
  - Image state now tracks both current and previous image positions for cleaner crossfades.

- Added build-safe focal-point support in `Game.tsx`.
  - The renderer can now honor optional image focal points without requiring an immediate full story-data rewrite.
  - Future content passes can add per-image mobile crop hints such as `top`, `center`, or `bottom`.

## Files changed

- `src/components/Game.tsx`
- `src/components/TextPanel.tsx`
- `src/components/TitleScreen.tsx`
- `MOBILE_STABILIZATION_CHANGELOG.md`

## Manual QA focus

Please verify on mobile Safari / iPhone viewport:

1. Tap title to begin.
2. Tap once during narration — audio should stop, text should remain.
3. Tap again — the game should advance.
4. Select a choice and tap rapidly afterward — it should not skip or double-route.
5. Use home / return-to-title, then tap continue — it should resume from the saved node.
6. Reach `END OF ACT 1`, refresh, and confirm the ending save marker behaves correctly.
7. Tap `Play Again` — it should remain tappable despite the text panel no longer consuming global taps.

## Notes

This pass intentionally does not add new visuals or rewrite story content. The next meaningful visual improvement should be a dedicated image asset pass with mobile focal points added directly in `src/data.ts`.
