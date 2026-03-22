# [SCR-VTON-04] Result Viewer
> Route: result state within `/vton` | Status: proposed | Updated: 2026-03-05
> Milestone: M7 (AI Magazine & Archive Expansion)
> Architecture: NEXT-02 (VTON Technical Architecture — Phase 1 MVP)
> Parent: SCR-VTON-01 (Try-on Studio)

## Purpose

User compares their original photo against the AI try-on result using an interactive before/after slider, then acts on the result (save, share, shop, or try another item).

## Component Map

| Region | Component | File | Props/Notes |
|--------|-----------|------|-------------|
| Result root | VtonResultViewer | `packages/web/lib/components/vton/VtonResultViewer.tsx` | originalUrl, resultUrl, selectedItem |
| Comparison slider | BeforeAfterSlider | `packages/web/lib/components/vton/BeforeAfterSlider.tsx` | beforeUrl, afterUrl, initialPosition: 50 |
| Item info strip | VtonItemInfo | `packages/web/lib/components/vton/VtonItemInfo.tsx` | brand, name, price, affiliateUrl |
| Action bar | VtonResultActions | `packages/web/lib/components/vton/VtonResultActions.tsx` | onTryAnother, onShopNow, onSave, onShare |
| Header | Back + Share button | inline in VtonResultViewer | mobile minimal; desktop DesktopHeader |

> All file paths are proposed (components not yet created). Verify against filesystem before implementation.

## Layout

### Mobile (default)

```
┌──────────────────────────────────────┐
│ [< Back]                   [Share]   │
├──────────────────────────────────────┤
│                                      │
│  ┌────────────────────────────────┐  │
│  │  [BEFORE]    |<|>  [AFTER]    │  │  <- BeforeAfterSlider
│  │  [Original]  |     [Try-on]   │  │     divider draggable
│  │   photo      |     result     │  │
│  │              |                │  │
│  └────────────────────────────────┘  │
│                                      │
│  Jacket — CELINE — W2,850,000        │  <- VtonItemInfo
│                                      │
│  [Try Another]  [Shop Now]  [Save]   │  <- VtonResultActions
│                                      │
└──────────────────────────────────────┘
│ [NavBar]                             │
└──────────────────────────────────────┘
```

### Desktop (>=768px)

```
┌──────────────────────────────────────────────────────────┐
│ [DesktopHeader]                                           │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │   [BEFORE]                  |<|>   [AFTER]        │  │
│  │   [Original photo]          |      [Try-on result]│  │
│  │                             |                     │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│   Jacket — CELINE — W2,850,000                          │
│   [Try Another]     [Shop Now]     [Save]               │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

| Element | Mobile | Desktop |
|---------|--------|---------|
| Slider orientation | Vertical divider, horizontal drag | Vertical divider, horizontal drag |
| Slider height | ~60vh | ~70vh, max 720px |
| Action bar | Single row 3 actions | Same row, larger tap targets |
| Item info | Below slider | Below slider |
| NavBar | Visible | Hidden |

## Requirements

### Entry Transition

- When `vtonStore.resultImageUrl` is set and the cinematic sequence crossfade begins, the system shall mount `VtonResultViewer` at `opacity: 0` beneath the fading sequence overlay.
- When the cinematic overlay reaches `opacity: 0` (0.4s into the 0.8s crossfade), the system shall tween `VtonResultViewer` to `opacity: 1` over 0.4s completing the crossfade.
- When `VtonResultViewer` is fully visible, `VtonCinematicSequence` shall unmount and call `gsapContext.revert()`.

### BeforeAfterSlider Implementation

- When `BeforeAfterSlider` mounts, the system shall render `beforeUrl` (original photo) and `afterUrl` (try-on result) as stacked full-bleed images within the slider container.
- The before image shall be clipped via `clip-path: inset(0 {100 - position}% 0 0)` and the after image via `clip-path: inset(0 0 0 {position}%)`, where `position` is the slider percentage (0-100, initial 50).
- When the user drags the divider handle, the system shall update `position` in real-time using `@use-gesture/react` `useDrag` hook, clamped to [5, 95] to keep both images partially visible.
- When the user releases the divider, the system shall not snap — the slider shall remain at the released position.
- When `BeforeAfterSlider` mounts, the system shall display "BEFORE" and "AFTER" labels over the respective halves, fading them out after 2s via `gsap.to(labels, { opacity: 0, delay: 2, duration: 0.5 })`.

### Try Another

- When the user taps "Try Another", the system shall set `vtonStore.status = 'idle'` and `vtonStore.selectedItem = null` while keeping `vtonStore.userPhoto` unchanged.
- When `vtonStore.status` is set to `'idle'` from the result state, the system shall unmount `VtonResultViewer` and display the photo + item selection state (SCR-VTON-02), transitioning with `opacity: 0 → 1` over 0.3s.

### Shop Now

- When the user taps "Shop Now", the system shall call `POST /api/v1/solutions/convert-affiliate` with `vtonStore.selectedItem.id` and open the returned affiliate URL in a new browser tab.
- When the affiliate conversion request fails, the system shall fall back to opening `selectedItem.affiliateUrl` directly in a new tab.

### Save to Device

- When the user taps "Save", the system shall attempt `navigator.share({ files: [resultImageFile] })` (Web Share API level 2) if the API and file sharing are supported.
- When Web Share API level 2 is not supported, the system shall trigger a programmatic download via a temporary `<a download>` element pointing to `vtonStore.resultImageUrl`.
- When the download link is created, the system shall show a transient "Saving..." toast (Sonner) that resolves to "Saved" on success or "Save failed, try again" on error.

### Share Composite

- When the user taps "Share" (header button), the system shall generate a composite canvas image: original photo on the left half, try-on result on the right, with a "Decoded VTON" watermark at the bottom.
- When the canvas image is generated, the system shall invoke `navigator.share({ title: "{brand} {name} — Try-On", files: [compositeFile] })`.
- When Web Share API is not supported, the system shall copy the result image URL to the clipboard and show a "Link copied" toast (Sonner).

## State

| Store field | Type | Description |
|-------------|------|-------------|
| `vtonStore.resultImageUrl` | `string` | Try-on result image URL; drives VtonResultViewer mount |
| `vtonStore.userPhoto` | `File \| null` | Original photo; kept on "Try Another" |
| `vtonStore.selectedItem` | `SolutionRow` | Displayed in VtonItemInfo; used for Shop Now |
| `vtonStore.status` | `'ready'` | Mounts this viewer; reset to `'idle'` on Try Another |

## Navigation

| Trigger | Destination | Notes |
|---------|-------------|-------|
| "Try Another" | Photo + item selection (SCR-VTON-02) | `vtonStore.status = 'idle'`, photo kept |
| "Shop Now" | External affiliate URL | New tab; affiliate conversion via API |
| "Save" | Device gallery / download | Web Share or `<a download>` |
| "Share" | OS share sheet | Web Share API or clipboard fallback |
| Back button | Previous screen (post detail or magazine) | router.back(); `vtonStore.reset()` |

## Error & Empty States

| State | Condition | UI |
|-------|-----------|-----|
| Result load error | `resultImageUrl` returns 404/5xx | "Generation failed" card; retry at no additional credit cost |
| Share not supported | Web Share API unavailable | Clipboard copy fallback + "Link copied" toast |
| Save failed | Download fetch error | "Save failed, try again" toast (Sonner) |
| Affiliate error | `/convert-affiliate` 5xx | Direct fallback to `affiliateUrl`; no error shown to user |
| Canvas generation error | `toBlob` fails | Share button disabled; log error |

## Animations

| Trigger | Type | Library | Details |
|---------|------|---------|---------|
| Entry crossfade | Fade in | GSAP | `opacity: 0 → 1`, 0.4s, starts at cinematic sequence 0.4s mark |
| BEFORE/AFTER labels | Fade out | GSAP | `opacity: 1 → 0`, delay: 2s, duration: 0.5s |
| Slider drag | Clip-path update | @use-gesture/react + CSS | Real-time, no easing; `clip-path` updated on `useDrag` |
| Try Another exit | Fade out | GSAP | `opacity: 1 → 0`, 0.2s; selection state fades in 0.3s |
| Save toast | Slide in | Sonner | Default Sonner toast animation |

---

See: [SCR-VTON-01](SCR-VTON-01-try-on-studio.md) — parent screen; full state and credit gate
See: [SCR-VTON-03](SCR-VTON-03-cinematic-sequence.md) — cinematic sequence (precedes this viewer)
See: [SCR-VIEW-03](../detail/SCR-VIEW-03-item-solution.md) — item/solution (same Shop Now flow)
See: [NEXT-02](../../_next/NEXT-02-vton-spec.md) — VTON architecture (Phase 2: result persistence)
