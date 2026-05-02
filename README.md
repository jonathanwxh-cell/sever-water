# 断水 · Sever Water

[![CI](https://github.com/jonathanwxh-cell/sever-water/actions/workflows/ci.yml/badge.svg)](https://github.com/jonathanwxh-cell/sever-water/actions/workflows/ci.yml)
[![Status: Act 1 complete](https://img.shields.io/badge/status-Act%201%20complete%20%C2%B7%20Act%202%20WIP-blue)](#status)
[![License: Proprietary](https://img.shields.io/badge/license-proprietary-lightgrey)](LICENSE)

A cinematic interactive fiction game set in a wuxia world. Built with React, TypeScript, and Tailwind CSS.

Act 1 follows **Shen Mo of Cold Mountain** — a young swordsman carrying a sealed letter through a rain-soaked gorge, where three hired knives are waiting. Every choice reshapes the story's emotional landscape through a hidden four-pole heart state system.

## Demo

**Play it:** **[wuxia.alyoechosys.dev](https://wuxia.alyoechosys.dev/)**

<!-- Add a gameplay screenshot or animated GIF here:
     ![Sever Water — Act 1 opening](docs/screenshot-opening.png)
     Recommended: 1280×720 PNG of the title screen + one mid-scene moment. -->

## Architecture

```
src/
├── components/
│   └── Game.tsx          # Main game engine — audio, image crossfade, node advancement
├── data.ts               # Act 1 script nodes — all narration, dialogue, choices, branching
├── state.ts              # Heart state machine + callback resolver + flag tracking
├── main.tsx              # Entry point — mounts Game directly
├── index.css             # Tailwind + custom fonts + transitions
└── data.test.ts          # Data integrity tests (node graph, choice branches)
└── state.test.ts         # State logic tests (choices, flags, callbacks)
```

### How it works

- **Node graph** (`data.ts`) — every line of narration, dialogue, and choice is a `GameNode` in a directed graph. The player walks the graph by clicking/pressing space.
- **Heart state** (`state.ts`) — four hidden poles (`澄 serene`, `怨 vengeful`, `惑 conflicted`, `冷 hardened`) accumulate silently based on player choices. The player never sees these numbers.
- **Callback resolver** — three dialogue lines in Act 1 vary based on flag combinations. For example, Liu Ruyan's "So you're one of those" carries a different intonation if you tended her wound silently (B2 flag) vs. if you swore an open debt (A2).
- **CueEngine** — manages three looping music tracks with smooth fade-in/fade-out transitions tied to scene changes.
- **NarrationEngine** — single-track voiceover playback with skip-on-click support.

### The three choices

| Choice | A | B | C |
|--------|---|---|---|
| **1 — The Letter** | Hand it over | Attack silently | "Who sent you?" |
| **2 — The Debt** | Swear openly | Tend her wound | Ask why she intervened |
| **3 — The Departure** | Ride for Cold Mountain | Stay until dawn | Bring her with you |

Each choice sets a flag (A1–C3) and shifts one heart pole. Act 2 will read these to determine narrative trajectory.

## Getting started

```bash
npm install
npm run dev
```

The dev server starts at `http://localhost:5173`.

### Build for production

```bash
npm run build
```

Output goes to `dist/`.

### Run tests

```bash
npm test
```

Tests run via **vitest**. Two test suites:
- `src/state.test.ts` — choice effects, flag/heart-state accumulation, callback resolver logic, edge cases, three full playthrough paths.
- `src/data.test.ts` — node graph integrity, choice branch wiring, dead-node detection.

## Asset organization

```
public/assets/
├── audio/          # Music cues (cue1_mountain_gate_v0.mp3, etc.)
├── narration/      # Voiceover files (nar_a1_s1_01_opening.mp3, etc.)
└── images/         # Scene images (b1_08_style_anchor_moon.png, etc.)
```

See `src/data.ts` for the full asset map.

## Tech stack

- **React 19** + **TypeScript**
- **Vite** for bundling
- **Tailwind CSS 3** for styling
- **EB Garamond** + **Noto Serif SC** for typography
- **vitest** for testing

## Status

**Act 1 complete.** Act 2 in development. See [CHANGELOG.md](CHANGELOG.md) for release history.

## Contributing

This is a private project; external contributions are not currently accepted. If you're working on this codebase, see the [pull request template](.github/PULL_REQUEST_TEMPLATE.md) and ensure `npm run lint`, `npm test`, and `npm run build` all pass before opening a PR.

## License

Proprietary — all rights reserved. See [LICENSE](LICENSE).
