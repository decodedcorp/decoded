---
phase: m9-01-canvas-scaffold-data-wiring
plan: "02"
subsystem: main-d-canvas
tags:
  [
    polaroid-card,
    scatter-canvas,
    collage,
    bottom-nav,
    server-component,
    sticker-canvas,
  ]
dependency_graph:
  requires:
    - "m9-01-01 (types.ts, scatter.ts, main-d.server.ts)"
  provides:
    - "MainPageD component (packages/web/lib/components/main-d/MainPageD.tsx)"
    - "PolaroidCard component with varied aspect ratios (packages/web/lib/components/main-d/PolaroidCard.tsx)"
    - "BottomNav component (packages/web/lib/components/main-d/BottomNav.tsx)"
    - "/lab/main-d page route (packages/web/app/lab/main-d/page.tsx)"
    - "Organic collage scatter engine: hero/medium/small tier system, center-cluster bias"
    - "trendingKeywords prop wired through MainPageD for m9-03"
  affects:
    - "m9-02 (drag/peel interactions build on PolaroidCard)"
    - "m9-03 (wordmark section consumes trendingKeywords from MainPageD)"
tech_stack:
  added: []
  patterns:
    - "Tier-based card sizing: hero clamp(180px,28vw,340px) / medium clamp(110px,17vw,210px) / small clamp(70px,10vw,130px)"
    - "Center-cluster bias: hero cards blended 45% toward canvas center, medium 20%, small 0%"
    - "Rotation by tier: hero ±15°, medium ±20°, small ±25°"
    - "Z-index stratification by tier: hero z20+, medium z10+, small z5+"
    - "Varied aspect ratios deterministic per card: 2/3, 3/4, 1/1, 4/3, 3/2"
    - "Server component parallel data fetch (Promise.all) pattern"
    - "Grain texture via inline SVG feTurbulence (copied from main-b)"
    - "BottomNav glass morphism pill (rgba blur + neon border)"
key_files:
  created:
    - packages/web/app/lab/main-d/page.tsx
    - packages/web/lib/components/main-d/MainPageD.tsx
    - packages/web/lib/components/main-d/PolaroidCard.tsx
    - packages/web/lib/components/main-d/BottomNav.tsx
  modified:
    - packages/web/lib/components/main-d/scatter.ts
    - packages/web/lib/components/main-d/types.ts
    - packages/web/lib/components/main-d/index.ts
decisions:
  - "Replaced 4×3 zone grid with free-placement center-cluster algorithm — zones produce grid-like layout, not organic collage"
  - "Tier system (hero/medium/small) drives size, rotation range, z-index, and center bias from one place"
  - "aspectRatio added to ScatterPosition type — 5 ratios keep PolaroidCard fully data-driven"
  - "trendingKeywords prop accepted as _trendingKeywords in MainPageD — intentionally unused in m9-01, wired for m9-03"
  - "Mobile: overflow-y-auto on outer + min-h-[150vh] md:min-h-0 to allow scroll when cards exceed viewport"
  - "Priority Image loading on first 3 cards (index 0-2) to improve LCP"
metrics:
  duration: "45 minutes"
  completed_date: "2026-03-19"
  tasks_completed: 2
  files_created: 4
  files_modified: 3
---

# Phase m9-01 Plan 02: Organic Collage Sticker Canvas Summary

**Organic collage canvas at /lab/main-d with hero/medium/small tier system, center-cluster bias, varied aspect ratios, and ±25° rotation — real post images as physical-feel scattered polaroids on a dark canvas**

## Tasks Completed

| #   | Task                                              | Commit   | Files                                                                        |
| --- | ------------------------------------------------- | -------- | ---------------------------------------------------------------------------- |
| 1   | Page route + MainPageD + PolaroidCard + BottomNav | 75be17f9 | page.tsx, MainPageD.tsx, PolaroidCard.tsx, BottomNav.tsx, index.ts (updated) |
| 2   | Visual feedback: organic collage scatter fix      | 11418b46 | scatter.ts, types.ts, PolaroidCard.tsx, MainPageD.tsx                        |

## What Was Built

### Task 1: Page Route + UI Components

**`packages/web/app/lab/main-d/page.tsx`** — Server component:

- `export const dynamic = "force-dynamic"` prevents caching
- Fetches posts and trendingKeywords in parallel via `Promise.all`
- Falls back to centered "No posts found" message on dark background if empty
- Passes both arrays to `<MainPageD>`

**`packages/web/lib/components/main-d/MainPageD.tsx`** — Root client component:

- Dark canvas: `background: #0d0d0d`, `height: 100vh`, `minHeight: 700`
- Inner canvas: `overflow: visible` — prevents rotated card clipping
- Mobile: outer container is `overflow-y-auto`, inner gets `min-h-[150vh] md:min-h-0`
- Maps posts → `computeScatterPosition(id, index, posts.length)` → `<PolaroidCard>`
- `priority={true}` on first 3 cards (index 0, 1, 2)
- SVG grain texture overlay at `z-20`, `pointer-events-none`
- `<BottomNav />` at `z-30`
- `trendingKeywords` prop accepted but held for m9-03 (`_trendingKeywords`)

**`packages/web/lib/components/main-d/PolaroidCard.tsx`** — Individual polaroid card:

- `absolute` positioning via `position.top`, `position.left`, `position.width`, `position.zIndex`
- `transform: rotate(${position.rotate}deg)` from scatter engine
- White frame: `background: #ffffff`, `padding: 5px 5px 22px 5px`
- Tier-aware shadow: hero `0 8px 40px rgba(0,0,0,0.75)` vs standard `0 4px 20px rgba(0,0,0,0.6)`
- `<Image fill>` with `object-cover`, `aspectRatio: position.aspectRatio` (varies per card)
- `sizes="(max-width: 768px) 40vw, 28vw"` (updated for larger hero card sizes)
- `priority` prop forwarded to Next.js Image

**`packages/web/lib/components/main-d/BottomNav.tsx`** — Glass morphism pill nav:

- Verbatim copy of MainPageB BottomNav pattern
- Nav items: Home(/), Search(/search), Editorial(/editorial), Profile(/profile)
- Lucide icons: Home, Search, BookOpen, User
- Style: `rgba(20,20,20,0.7)`, `backdrop-filter: blur(16px)`, neon border
- `z-30` (above grain + cards)

### Task 2: Organic Collage Scatter Fix

**`packages/web/lib/components/main-d/scatter.ts`** — Complete rewrite:

- **Tier system**: `getTier()` classifies each card as hero/medium/small based on index + seeded random
  - index 0 is always hero; ~1 more hero among early cards; ~25% small; rest medium
- **Center-cluster bias**: `getPosition()` blends raw position toward center (45% for hero, 20% for medium, 0% for small)
- **Size by tier**: hero `clamp(180px, 28vw, 340px)` / medium `clamp(110px, 17vw, 210px)` / small `clamp(70px, 10vw, 130px)`
- **Rotation by tier**: hero ±15° / medium ±20° / small ±25°
- **Z-index by tier**: hero z20–z28 / medium z10–z18 / small z5–z13
- **Aspect ratio**: one of 5 ratios (2/3, 3/4, 1/1, 4/3, 3/2) deterministic per card

**`packages/web/lib/components/main-d/types.ts`** — ScatterPosition extended:

- Added `tier: "hero" | "medium" | "small"` field
- Added `aspectRatio: string` field
- Updated rotate comment: range -25 to +25 (was -12 to +12)
- Updated zIndex comment: range 1-30 (was 1-20)

## Deviations from Plan

### Auto-fixed Issues

**1. [User Feedback - Visual] Rebuilt scatter engine for organic collage feel**

- **Found during:** Task 2 visual verification
- **Issue:** 4×3 zone grid produced visually regular, grid-like card distribution — user feedback: "전혀 콜라주 느낌이 안 난다" (doesn't look like a collage at all). Root causes: even distribution, 0.85–1.2× size variation too narrow, uniform square aspect ratios, ±12° rotation too subtle.
- **Fix:** Complete rewrite of scatter.ts with hero/medium/small tier system, center-cluster bias positioning, dramatic size variation (hero 2–3× larger), 5 varied aspect ratios, wider rotation ranges (±15° to ±25°). ScatterPosition type extended with `tier` and `aspectRatio` fields. PolaroidCard updated to use position.aspectRatio and tier-aware shadow.
- **Files modified:** scatter.ts, types.ts, PolaroidCard.tsx, MainPageD.tsx
- **Verification:** TypeScript reports zero errors in main-d files. Deterministic output maintained (same djb2 PRNG, same inputs → same positions).
- **Committed in:** `11418b46`

---

**Total deviations:** 1 (visual quality iteration directed by user feedback)
**Impact on plan:** Scatter engine rebuilt and ScatterPosition type extended. Core architecture (server component, card structure, BottomNav, grain overlay) unchanged. No scope creep.

## Issues Encountered

None beyond the visual feedback iteration documented above.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `/lab/main-d` renders an organic collage of real post images with hero/medium/small card hierarchy
- `computeScatterPosition(id, index, total)` API is stable — m9-02 builds GSAP drag on top of it
- `trendingKeywords` data pipeline is wired through MainPageD and ready for m9-03 wordmark section
- PolaroidCard is fully data-driven (no internal state) — ready for m9-02 to add hover + drag via ref

## Self-Check: PASSED

All key files confirmed on disk. Commits 75be17f9 and 11418b46 confirmed in git log.

---

_Phase: m9-01-canvas-scaffold-data-wiring_
_Completed: 2026-03-19_
