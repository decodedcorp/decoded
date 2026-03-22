---
phase: quick-60
plan: "01"
subsystem: main-page
tags: [circular-gallery, hero, spot-cards, bidirectional-sync, webgl, gsap]
dependency_graph:
  requires: []
  provides:
    - HeroItemSync bidirectional sync between MainHero SpotCards and CircularGallery
    - CircularGallery external control API (activeIndex, onActiveChange, snapTo)
  affects:
    - packages/web/app/page.tsx
    - packages/web/lib/components/ui/CircularGallery.tsx
    - packages/web/lib/components/main/TopItemsSection.tsx
    - packages/web/lib/components/main-renewal/MainHero.tsx
tech_stack:
  added: []
  patterns:
    - Imperative ref pattern for WebGL App class (appRef.current.snapTo)
    - Shared state wrapper pattern for server component composition
    - CSS transition-based active state highlighting (no extra animation library)
key_files:
  created:
    - packages/web/lib/components/main/HeroItemSync.tsx
  modified:
    - packages/web/lib/components/ui/CircularGallery.tsx
    - packages/web/lib/components/main/TopItemsSection.tsx
    - packages/web/lib/components/main-renewal/MainHero.tsx
    - packages/web/lib/components/main/index.ts
    - packages/web/app/page.tsx
decisions:
  - "SpotCard active highlight uses CSS transitions (not GSAP) for simplicity — state-driven class swapping is sufficient and keeps the component pure"
  - "decodedPickItemCards falls back to bestItemCards when decodedPick is null — no blank gallery on data miss"
  - "snapTo uses positive scroll direction (width * index) matching the gallery's natural right-scroll direction"
  - "onActiveChange fires only when lastActiveIndex changes, preventing excessive React re-renders in the rAF loop"
metrics:
  duration: ~25min
  completed_date: "2026-03-19"
  tasks_completed: 2
  files_modified: 6
---

# Quick Task 60: Spot ↔ CircularGallery Bidirectional Sync Summary

**One-liner:** Bidirectional sync wiring SpotCard clicks to WebGL gallery snap and gallery scroll to SpotCard glow highlights, with gallery data switched from bestItems to decodedPick items.

## What Was Built

### CircularGallery — External Control API

Added two props to `CircularGalleryProps`:

- `onActiveChange?: (index: number) => void` — fires when the centered item changes (checked in every rAF, guarded by `lastActiveIndex` to prevent redundant calls)
- `activeIndex?: number` — when changed externally, calls `appRef.current.snapTo(index)`

Added to `App` class:

- `originalLength` — stores pre-duplication item count for correct modulo math
- `lastActiveIndex` — tracks last fired index to debounce rAF-level callbacks
- `snapTo(index)` — public method setting `scroll.target = width * index` then calling `onCheck()` for snap alignment
- `onActiveChange` callback field stored at construction time

React component now stores `App` in `appRef` and uses a separate `useEffect` watching `activeIndex` to call `snapTo`.

### HeroItemSync — Shared State Wrapper

New `"use client"` component at `packages/web/lib/components/main/HeroItemSync.tsx`:

- Owns `activeItemIndex: number | null` state
- Derives `spotIds` array from `heroData.spots` in order (index alignment with gallery items)
- `handleSpotClick(spotId)` → finds index in spotIds → sets activeItemIndex
- `handleGalleryActiveChange(index)` → sets activeItemIndex directly
- Renders `<MainHero>` + `<TopItemsSection>` with the overlap div (`-mt-32 md:-mt-40`) previously in page.tsx

### MainHero — Clickable + Highlightable SpotCards

`SpotCard` changes:

- New props: `onClick?: () => void`, `isActive?: boolean`
- Root div: `pointer-events-none` removed → `pointer-events-auto cursor-pointer` added
- Dot: conditional `shadow-[0_0_20px_8px_...]` when isActive vs `shadow-[0_0_12px_4px_...]`
- Card container: `transition-all duration-300` + conditional `scale-105 border-[#eafd67]/30` when isActive

`MainHero` component: new props `onSpotClick` + `activeSpotId`, passed to each `SpotCard`.

### page.tsx — Data Source Switch + HeroItemSync Integration

- Replaced `MainHero` + `<div><TopItemsSection></div>` with `<HeroItemSync>`
- Added `decodedPickItemCards` computed from `decodedPick.items.slice(0, 4)` with bestItemCards fallback
- Removed `TopItemsSection` and `MainHero` from imports (now internal to HeroItemSync)

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

- FOUND: `packages/web/lib/components/main/HeroItemSync.tsx`
- FOUND: commit `bb2159c7` (Task 1 — CircularGallery + HeroItemSync)
- FOUND: commit `e71aa9e5` (Task 2 — SpotCards + page.tsx wiring)
- TypeScript: no errors in modified files (pre-existing errors in main-b.server.ts and validator.ts are unrelated)
