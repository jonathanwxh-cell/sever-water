# Sever Water — UX Redesign Spec

This spec is for improving the UX and game flow of **Sever Water (断水)**, a React + TypeScript + Vite interactive fiction / visual novel prototype.

The current game works technically, but the experience feels unclear: choices are too long, images feel passive, the text panel behaves like a scrolling transcript, and the player is not always sure what moment they are in.

The goal is to turn the app from a **scrolling illustrated prose reader** into a **cinematic visual-novel-style decision experience**.

---

## 1. Product Direction

### Current feel

The current UI feels like:

> A long story page with background images and occasional buttons.

### Desired feel

The desired UI should feel like:

> A cinematic wuxia visual novel where each beat is staged, each image has a role, and each choice feels like a decisive moral/action moment.

### UX principles

1. **One emotional beat at a time.**
   The main screen should not feel like a full scrolling transcript.

2. **Choices should be decisions, not spoilers.**
   Choice buttons should show short action + intent only. The full prose outcome appears after selection.

3. **Images should behave like shots, not wallpaper.**
   Each major image should clarify the scene, character, threat, or decision.

4. **The player should always know the moment.**
   Show subtle scene/location/mood metadata.

5. **Do not expose hidden stats.**
   Keep `cheng`, `yuan`, `huo`, `leng` hidden. Consequences can be hinted poetically, not numerically.

---

## 2. Non-Goals

Do not do these:

- Do not rewrite the whole app.
- Do not replace React, TypeScript, Vite, or Tailwind.
- Do not replace the story engine with a new framework.
- Do not expose hidden heart-state values to the player.
- Do not heavily rewrite the prose.
- Do not add new libraries unless absolutely necessary.
- Do not change the core state logic unless required by the UX changes.

---

## 3. Main Files

Work mainly in:

- `src/components/Game.tsx`
- `src/data.ts`
- `src/index.css`
- optionally `src/state.ts` if save/progress behavior needs light adjustment
- optionally add tests in `src/data.test.ts` or update existing tests

---

## 4. Highest-Priority UX Fix — Choice Data Model

### Problem

Currently `ChoiceOption` has only:

```ts
export interface ChoiceOption {
  id: string;
  label: string;
  text: string;
}
```

The same `text` is shown inside the button and then appended as narration after the player chooses.

This makes the button too long and spoils the result before the player chooses.

### Required change

Split choice copy into three fields:

```ts
export interface ChoiceOption {
  id: string;
  label: string;      // short visible action
  intent: string;     // one-line emotional / moral meaning
  outcome: string;    // full prose shown after player selects
}
```

### Button display

Only show:

- `label`
- `intent`

Do **not** show `outcome` before the player chooses.

### After selection

Append `outcome` as a narration node.

### Example conversion

Current:

```ts
{
  id: '1A',
  label: 'A) Hand it over.',
  text: 'Your teacher\'s last instruction to you. But his first instruction...'
}
```

New:

```ts
{
  id: '1A',
  label: 'Hand over the letter',
  intent: 'Survive the gorge. Carry the shame later.',
  outcome: 'Your teacher\'s last instruction to you. But his first instruction — the one that shaped every day since you were a child — was to survive. You cannot deliver a letter if you are dead. You hold it out into the rain. The paper will be ruined before he reads it anyway.'
}
```

### Target choice style

Choices should feel like this:

```text
Hand over the letter
Survive the gorge. Carry the shame later.
```

Not like this:

```text
A) Hand it over.
Your teacher's last instruction to you. But his first instruction...
```

---

## 5. Choice Copy Rewrite Guidance

Keep the existing outcome prose mostly intact. Only rewrite the visible `label` and `intent`.

### Choice 1 — Letter

Prompt: `WHAT DO YOU DO WITH THE LETTER?`

Suggested cards:

```ts
{
  id: '1A',
  label: 'Hand over the letter',
  intent: 'Survive the gorge. Carry the shame later.',
  outcome: existing full prose
}
```

```ts
{
  id: '1B',
  label: 'Strike before he finishes speaking',
  intent: 'Trust the sword. Keep the mission alive.',
  outcome: existing full prose
}
```

```ts
{
  id: '1C',
  label: 'Ask who sent them',
  intent: 'Risk the moment to uncover the deeper threat.',
  outcome: existing full prose
}
```

### Choice 2 — Debt

Prompt: `WHAT DO YOU OFFER IN RETURN?`

Suggested cards:

```ts
{
  id: '2A',
  label: 'Speak a life-debt aloud',
  intent: 'Make the debt real by giving it witnesses.',
  outcome: existing full prose
}
```

```ts
{
  id: '2B',
  label: 'Tend her wound in silence',
  intent: 'Let action carry what words would cheapen.',
  outcome: existing full prose
}
```

```ts
{
  id: '2C',
  label: 'Ask why she saved you',
  intent: 'Refuse gratitude until the truth is named.',
  outcome: existing full prose
}
```

### Choice 3 — Departure

Prompt: `WHAT DO YOU DO?`

Suggested cards:

```ts
{
  id: '3A',
  label: 'Ride for Cold Mountain now',
  intent: 'Choose sect and teacher before all debts.',
  outcome: existing full prose, but avoid repeating callback text
}
```

```ts
{
  id: '3B',
  label: 'Stay until dawn',
  intent: 'Give the woman who bled for you a waking farewell.',
  outcome: existing full prose, but remove duplicated “So you’re one of those” if callback handles it
}
```

```ts
{
  id: '3C',
  label: 'Bring her with you',
  intent: 'Make the impossible choice: both debt and duty.',
  outcome: existing full prose
}
```

Important: Choice 3 currently risks repeating narrative beats with callback nodes. Clean this gently.

---

## 6. Choice Presentation Redesign

### Problem

Choices currently appear inside the lower scrolling text panel as full-width paragraph buttons.

They should instead feel like a staged decision moment.

### Required UI behavior

When `showChoices === true`:

1. Dim the image background.
2. Hide or de-emphasize the normal text transcript.
3. Show the choice prompt centered above the cards.
4. Show 3 decision cards.
5. Cards should be compact, readable, and clearly clickable.
6. On mobile, stack cards vertically.
7. On desktop, use 3 columns if space allows.

### Suggested JSX shape

```tsx
{showChoices && choiceOptions.length > 0 && (
  <div className="absolute inset-0 z-30 flex items-end md:items-center justify-center bg-black/45 px-5 py-8">
    <div className="w-full max-w-5xl">
      <p className="text-center text-white/50 tracking-[0.3em] text-xs md:text-sm uppercase mb-5">
        {choicePrompt}
      </p>

      <div className="grid gap-3 md:grid-cols-3">
        {choiceOptions.map((choice) => (
          <button
            key={choice.id}
            onClick={(e) => {
              e.stopPropagation();
              handleChoice(choice.id);
            }}
            className="group min-h-36 md:min-h-44 text-left border border-white/20 bg-black/60 hover:bg-white/10 hover:border-white/40 px-5 py-5 transition-colors"
          >
            <div className="text-white/35 text-xs tracking-widest mb-4">
              {choice.id}
            </div>
            <div className="text-white/95 text-xl md:text-2xl font-serif leading-tight">
              {choice.label}
            </div>
            <div className="text-white/55 text-sm md:text-base font-serif leading-relaxed mt-3">
              {choice.intent}
            </div>
          </button>
        ))}
      </div>
    </div>
  </div>
)}
```

This should replace the current choice rendering inside the text panel, or at least take visual priority over it.

---

## 7. Main Reading Flow Redesign

### Problem

The game currently appends many nodes into a scrollable text panel. This makes it feel like a transcript rather than a staged experience.

### Required direction

Show fewer text beats at once.

Preferred option:

- Show only the current node plus maybe the previous 1–2 recent nodes.
- Keep full transcript support for later, but do not make it the main screen.

Simpler implementation:

```ts
const VISIBLE_NODE_LIMIT = 3;
const visibleNodes = nodes.slice(-VISIBLE_NODE_LIMIT);
```

Render `visibleNodes` instead of `nodes` in the main panel.

### Why

This makes each click feel like a cinematic cut or story beat instead of scrolling through a page.

### Optional transcript

If easy, add a small `Log` button later that opens the full transcript. This is optional and not required for this pass.

---

## 8. Scene Metadata / Player Orientation

### Problem

The player is often not anchored: the image, prose, and choice may not clearly communicate location, act, or emotional context.

### Required change

Add optional metadata to `GameNode`:

```ts
export interface GameNode {
  id: string;
  text: string;
  type: 'narration' | 'dialogue' | 'blockquote' | 'choice' | 'scene-heading' | 'title' | 'ending';
  speaker?: string;
  sceneLabel?: string;
  locationLabel?: string;
  moodLabel?: string;
  narrationAudio?: string;
  image?: ImageTrigger;
  audio?: AudioTrigger;
  choices?: ChoiceOption[];
  next?: string;
}
```

Add subtle HUD text in the top-left or above the text panel:

```text
ACT I · THE DEBT
ONE-LINE SKY · RAIN
```

or:

```text
WATER-GAZING PAVILION · HALF-MOON
```

### Suggested behavior

- Scene headings update the metadata.
- Regular nodes inherit the latest scene/location/mood if no new metadata is provided.
- Keep it subtle. It should not look like a dashboard.

---

## 9. Image / Shot Grammar

### Problem

Images currently act like broad background illustrations. The same image may cover too many beats.

### Required change

Add support for image intent metadata.

```ts
export interface ImageTrigger {
  src: string;
  transition: 'fade-in' | 'fade-out' | 'crossfade' | 'hold' | 'instant';
  duration?: number;
  role?: 'establishing' | 'memory' | 'threat' | 'character' | 'intimacy' | 'choice' | 'aftermath';
  focalPoint?: 'center' | 'top' | 'bottom' | 'left' | 'right';
}
```

Use `focalPoint` to control `background-position`:

```tsx
style={{
  backgroundImage: `url(${currentImg})`,
  backgroundPosition: currentImageFocalPoint ?? 'center',
}}
```

### Minimum image improvements

Use existing images for now, but make sure each choice has a dedicated visual moment.

Suggested image mapping:

- Choice 1: gorge confrontation / letter decision
- Choice 2: Liu Ruyan bleeding after rescue
- Choice 3: Lu Yuan doorway / inn room tension

### Future image asset wish list

Act 1 would benefit from 14–18 images total:

1. title moon
2. gorge establishing shot
3. Shen Mo vs three knives
4. teacher at mountain gate
5. letter close-up in rain
6. Choice 1 decision shot
7. fourth blade from above
8. Liu Ruyan rescue
9. Liu Ruyan bleeding
10. Choice 2 debt shot
11. inn exterior in rain
12. carved poem wall
13. Liu Ruyan sleeping wound
14. Shen Mo by half-moon window
15. Lu Yuan in doorway
16. Choice 3 three-obligations shot
17. ending sword/moon shot

Do not block implementation on new images. Just make the data model ready for better image grammar.

---

## 10. Text Panel Styling

### Current issue

The text panel occupies the bottom 35% of screen and behaves like a dense scrolling area.

### Desired style

Make text feel more like a cinematic caption/dialogue box:

- less dense
- stronger contrast
- more breathing room
- current speaker more visually distinct
- dialogue and narration visually different

### Suggested adjustments

- Use max width around `max-w-2xl` or `max-w-3xl`.
- Increase line height.
- Use slightly larger dialogue text.
- Add subtle background blur or gradient.
- Keep text panel from feeling like a web article.

Example:

```tsx
<div className="absolute bottom-0 left-0 w-full min-h-[30%] max-h-[42%] flex flex-col justify-end bg-gradient-to-t from-black via-black/85 to-transparent">
  <div className="max-w-3xl mx-auto w-full px-6 pb-10 pt-16">
    {visibleNodes.map(renderNode)}
  </div>
</div>
```

---

## 11. Interaction Feedback

### Required polish

Add clearer feedback after choice selection:

1. Immediately hide cards.
2. Show selected outcome text.
3. Optionally show a very subtle consequence line.

Example consequence lines:

```text
The letter grows heavier.
A debt has been spoken.
Silence remembers what words cannot.
The road home has opened.
```

These should be optional and poetic, not stat-like.

Implementation idea:

```ts
export interface ChoiceOption {
  id: string;
  label: string;
  intent: string;
  outcome: string;
  consequence?: string;
}
```

If `consequence` exists, render it as a small muted line after outcome.

---

## 12. Mobile UX Requirements

The game likely runs on mobile. Prioritize mobile readability.

### Requirements

- Choice cards stack vertically on small screens.
- Text should not be too small.
- Buttons should have generous tap targets.
- Avoid requiring precise tapping.
- Avoid burying choices below scroll.
- Volume button should not conflict with choice overlay.
- `Click anywhere` copy should become `Tap to continue` on mobile if easy.

Current helper `use-mobile.ts` may already exist. Use it only if useful.

---

## 13. Implementation Plan

### Step 1 — Refactor choice data

- Update `ChoiceOption` interface.
- Convert all choices in `data.ts` from `text` to `intent` + `outcome`.
- Keep prose outcome mostly unchanged.

### Step 2 — Update choice handling

- In `Game.tsx`, render `choice.label` and `choice.intent` on buttons.
- After selection, append `choice.outcome` as narration.
- If adding `consequence`, append/render it subtly.

### Step 3 — Redesign choice overlay

- Move choice rendering out of the normal lower text flow.
- Add a dimmed full-screen overlay.
- Render three cards.
- Ensure mobile stacking.

### Step 4 — Limit visible text nodes

- Render only the last 2–3 nodes in the main panel.
- Keep `nodes` state intact so transcript can be added later.

### Step 5 — Add metadata support

- Add optional `sceneLabel`, `locationLabel`, `moodLabel` to `GameNode`.
- Render subtle scene HUD.
- Populate at least scene headings and major choice nodes.

### Step 6 — Improve image handling

- Add optional `role` and `focalPoint` to `ImageTrigger`.
- Support `background-position` from `focalPoint`.
- Add image triggers to choice nodes if missing.

### Step 7 — Preserve stability fixes

While touching choice handling, also ensure:

- Double-clicking a choice does not apply the same state twice.
- Final Act 1 state is saved after the last choice.
- Tests still pass.

---

## 14. Acceptance Criteria

The UX pass is complete when:

1. Choice cards no longer show long outcome paragraphs before selection.
2. Choice cards show short action + emotional/moral intent.
3. After selection, the full outcome prose appears.
4. Choice moments appear as a cinematic overlay, not buried in the scrolling text panel.
5. The main screen shows only the current/recent story beats, not the whole transcript.
6. The player can identify the scene/location/mood from subtle metadata.
7. Images feel more connected to major story beats and choice moments.
8. Mobile choice UX is readable and tappable.
9. State logic still works.
10. `npm run test` passes.
11. `npm run build` passes.

---

## 15. Design Taste Notes

The tone should remain:

- restrained
- melancholic
- cinematic
- wuxia
- ink-wash inspired
- quiet rather than flashy

Avoid:

- gamey RPG stats UI
- neon fantasy styling
- anime-like visual clutter
- bright button colors
- heavy animations
- modern dashboard feel

Use:

- black / ink grey / white opacity
- thin borders
- cinematic gradients
- serif typography
- slow fades
- deliberate negative space

---

## 16. Final Report Required

After implementation, report:

1. Files changed.
2. Summary of UX improvements.
3. Any story text that was altered.
4. Whether `npm run test` passed.
5. Whether `npm run build` passed.
6. Any remaining UX issues or recommended image assets.
