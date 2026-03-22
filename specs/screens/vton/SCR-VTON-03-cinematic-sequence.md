# [SCR-VTON-03] Cinematic Generation Sequence
> Route: full-screen overlay within `/vton` | Status: proposed | Updated: 2026-03-05
> Milestone: M7 (AI Magazine & Archive Expansion)
> Architecture: NEXT-02 (VTON Technical Architecture — Phase 1 MVP)
> Flow: FLW-05 (VTON 5-stage cinematic sequence)
> Parent: SCR-VTON-01 (Try-on Studio)

## Purpose

User watches a 5-stage cinematic animation while the VTON API processes their try-on request, providing visual engagement during API latency and communicating generation progress.

## Component Map

| Region | Component | File | Props/Notes |
|--------|-----------|------|-------------|
| Sequence root | VtonCinematicSequence | `packages/web/lib/components/vton/VtonCinematicSequence.tsx` | full-screen overlay, orchestrates all stages |
| Stage 1 | PickDropStage | `packages/web/lib/components/vton/stages/PickDropStage.tsx` | itemImageUrl, photoRect |
| Stage 2 | ChicBlurStage | `packages/web/lib/components/vton/stages/ChicBlurStage.tsx` | userPhotoUrl, itemImageUrl |
| Stage 3 | BlueprintStage | `packages/web/lib/components/vton/stages/BlueprintStage.tsx` | SVG wireframe lines, accent color |
| Stage 4 | MagicFlipStage | `packages/web/lib/components/vton/stages/MagicFlipStage.tsx` | Y-axis flip card |
| Stage 5 | MorphingLoopStage | `packages/web/lib/components/vton/stages/MorphingLoopStage.tsx` | loops until `vtonStore.resultImageUrl` resolves |
| Progress bar | ProgressGlow | `packages/web/lib/components/vton/ProgressGlow.tsx` | progress: 0-100, accentColor: #eafd67 |
| Status text | VariableWeightText | `packages/web/lib/components/vton/VariableWeightText.tsx` | label string, animates font-weight |

> All file paths are proposed (components not yet created). Verify against filesystem before implementation.

## Layout

```
┌──────────────────────────────────────────┐
│  (full-screen overlay, bg: #050505)       │
│                                          │
│                                          │
│      [Stage animation area]              │
│      (fills ~70vh, centered)             │
│                                          │
│                                          │
│  "Creating your look..."                 │  <- VariableWeightText
│                                          │
│  [======== progress bar ========]        │  <- ProgressGlow, accent #eafd67
│                                          │
│  Stage label: "Blueprinting your fit"    │  <- per-stage subtitle
│                                          │
└──────────────────────────────────────────┘
```

The overlay sits above `VtonStudio` (`z-index: 40`) and below the mobile NavBar (`z-index: 50`). On desktop, DesktopHeader is hidden while the overlay is active.

## Stage Specifications

| Stage | Name | Duration | Ease | Description |
|-------|------|----------|------|-------------|
| 1 | Pick & Drop | 0.8s | power2.out | Item card animates from sidebar position to center of user photo |
| 2 | Chic Blur | 1.0s | none (filter tween) | Gaussian blur applied to photo; item thumbnail dissolves into blur |
| 3 | Blueprint | 1.2s | stagger 0.1s per line | Wireframe SVG lines draw over photo, accent color (#eafd67) |
| 4 | Magic Flip | 0.6s | back.inOut | Central panel flips on Y-axis revealing "processing" state |
| 5 | Morphing Loop | 1.5s initial; loops | power1.inOut | Result morphs in; loops until API returns |

Progress bar mapping: Stage 1 = 0-20%, Stage 2 = 20-40%, Stage 3 = 40-60%, Stage 4 = 60-75%, Stage 5 loop = 75-95% (held until result), result received = 100%.

## Requirements

### Sequence Initialization

- When `vtonStore.status` changes to `'generating'`, the system shall mount `VtonCinematicSequence` as a full-screen overlay and begin the GSAP timeline from Stage 1.
- When the sequence mounts, the system shall create a GSAP context via `gsap.context(() => { ... }, containerRef)` to scope all animations.
- When the sequence mounts, the system shall capture the `DOMRect` of the `DraggableItemCard` origin via `getBoundingClientRect()` for Stage 1 start position.

### Stage 1 — Pick & Drop

- When Stage 1 begins, the system shall animate the selected item's image from its sidebar `DOMRect` origin to the center of `UserPhotoPanel` over 0.8s with `ease: "power2.out"` via `gsap.fromTo`.
- When Stage 1 completes, the system shall advance immediately to Stage 2 and update `vtonStore.generationStage = 2`.

### Stage 2 — Chic Blur

- When Stage 2 begins, the system shall tween `filter: blur(0px)` to `filter: blur(12px)` on the user photo element over 1.0s.
- When Stage 2 begins, the system shall simultaneously fade the item thumbnail opacity from 0 to 0.85 over 1.0s (dissolve into blur).
- When Stage 2 completes, the system shall advance to Stage 3 and update `vtonStore.generationStage = 3`.

### Stage 3 — Blueprint

- When Stage 3 begins, the system shall render an SVG overlay with body-mapping wireframe lines (horizontal and diagonal) on top of the blurred photo.
- When Stage 3 begins, the system shall animate each SVG path `stroke-dashoffset` from full length to 0, staggered by 0.1s per line, total 1.2s.
- All blueprint SVG strokes shall use accent color `#eafd67`.
- When Stage 3 completes, the system shall advance to Stage 4 and update `vtonStore.generationStage = 4`.

### Stage 4 — Magic Flip

- When Stage 4 begins, the system shall animate the central panel (containing the blurred photo + blueprint overlay) with a Y-axis flip: `rotateY: 0` to `rotateY: 180` at 0.3s, then swap content to "Processing..." text, then `rotateY: 180` to `rotateY: 360` completing the flip, total 0.6s with `ease: "back.inOut"`.
- The `perspective` CSS value on the container shall be set to `800px` before the flip begins.
- When Stage 4 completes, the system shall advance to Stage 5 and update `vtonStore.generationStage = 5`.

### Stage 5 — Morphing Loop

- When Stage 5 begins, the system shall play a 1.5s morph animation: the "Processing..." panel blurs and dissolves into a placeholder shimmer pattern.
- When Stage 5's initial 1.5s completes and `vtonStore.resultImageUrl` is still null, the system shall loop the shimmer morph subtly (opacity 0.6 to 1.0, 2s cycle) until the result arrives.
- When `vtonStore.resultImageUrl` is set during the loop, the system shall exit the loop, animate the progress bar to 100%, and transition to `VtonResultViewer` (see SCR-VTON-04).

### Progress Bar

- When each stage begins, the system shall tween `ProgressGlow` to the target percentage for that stage (see stage table above) with `duration: 0.5s`.
- When Stage 5 is looping, the system shall hold the bar at 95% without animated regression.
- When the result is received, the system shall tween the bar from 95% to 100% over 0.3s before starting the crossfade.

### VariableWeightText

- When each stage begins, the system shall update the status label (see labels below) and animate `font-weight` from 300 to 700 over 0.4s, then settle to 400 at stage end.
- Stage labels: Stage 1 "Picking your look", Stage 2 "Styling the fit", Stage 3 "Mapping your body", Stage 4 "Working the magic", Stage 5 "Creating your look...".

### Synchronization with vtonStore

- `vtonStore.generationStage` (number 1-5) shall be updated at each stage transition so other components (e.g., debug panels, analytics) can observe progress.
- The sequence shall be driven by the internal GSAP timeline, not by `vtonStore.generationStage` reads, to avoid React re-render interference.

### GSAP Context Cleanup

- When `VtonCinematicSequence` unmounts (result received, error, or user cancel), the system shall call `gsapContext.revert()` to remove all animations and inline styles applied during the sequence.
- When the user cancels during the sequence, the system shall call `gsapContext.revert()` then transition back to the photo + item selection state.

## State

| Store field | Type | Description |
|-------------|------|-------------|
| `vtonStore.status` | `'generating'` | Mounts this overlay |
| `vtonStore.generationStage` | `1 \| 2 \| 3 \| 4 \| 5` | Updated per stage advance |
| `vtonStore.taskId` | `string` | Used by polling hook to fetch result |
| `vtonStore.resultImageUrl` | `string \| null` | Non-null triggers loop exit |

## Navigation

| Trigger | Destination | Notes |
|---------|-------------|-------|
| Result received | VtonResultViewer (SCR-VTON-04) | Crossfade 0.8s, sequence unmounts after fade |
| API error during sequence | Error state (SCR-VTON-01) | `gsapContext.revert()`, credit refund |
| Polling timeout >90s | "Taking longer..." overlay | Keep/cancel options surfaced over sequence |
| User cancel | Photo + item selection state | `gsapContext.revert()`, `vtonStore.status = 'idle'` |

## Error & Empty States

| State | Condition | UI |
|-------|-----------|-----|
| API error (5xx) | `vtonStore.status = 'error'` during sequence | Sequence fades out; error card with retry |
| Polling timeout | Poll >90s without result | "Taking longer than expected" overlay; Keep/Cancel |
| Stage animation failure | GSAP exception | Log to console; skip to next stage silently |

## Animations

| Trigger | Type | Library | Details |
|---------|------|---------|---------|
| Stage 1 | Item card to center | GSAP | `fromTo` DOMRect origin to photo center, 0.8s, power2.out |
| Stage 2 | Gaussian blur | GSAP | `filter: blur(12px)`, 1.0s; opacity dissolve simultaneous |
| Stage 3 | SVG line draw | GSAP | `stroke-dashoffset` per path, stagger 0.1s, total 1.2s |
| Stage 4 | Y-axis flip | GSAP | `rotateY: 0→360`, 0.6s, back.inOut; perspective 800px |
| Stage 5 | Morph shimmer | GSAP | Opacity 0.6→1.0, 2s loop until result |
| Progress bar | Width tween | GSAP | Per-stage target %, 0.5s per advance |
| Font weight | Variable weight | GSAP | `fontWeight 300→700→400`, 0.4s + 0.2s |
| Result crossfade | Sequence out | GSAP | `opacity: 0, duration: 0.4s`; VtonResultViewer fades in over 0.8s |
| Unmount cleanup | Context revert | GSAP | `gsapContext.revert()` |

---

See: [SCR-VTON-01](SCR-VTON-01-try-on-studio.md) — parent screen; credit gate triggers this sequence
See: [SCR-VTON-02](SCR-VTON-02-drag-match.md) — drag & match (precedes this sequence)
See: [SCR-VTON-04](SCR-VTON-04-result-viewer.md) — result viewer (follows this sequence)
See: [FLW-05](../../flows/FLW-05-vton.md) — VTON 5-stage flow definition
