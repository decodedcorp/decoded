---
phase: v4-04-screen-specs-detail-view
plan: 01
subsystem: ui
tags: [screen-spec, detail-view, gsap-flip, hotspot, post-detail, transition-store, interactive-showcase]

# Dependency graph
requires:
  - phase: v4-03-flow-documents
    provides: FLW-02 detail flow with interaction states and transition table
  - phase: v4-02-shared-foundation
    provides: component-registry, store-map, api-contracts, data-models shared references

provides:
  - SCR-VIEW-01: Post/Image detail page spec with verified component map, mobile+desktop wireframes, EARS requirements
  - SCR-VIEW-02: Spot/Hotspot interaction layer spec with state transitions and FLIP animation documentation

affects:
  - v4-04 plans 02-04 (SCR-VIEW-03/04 will reference these base specs)
  - v4-05 discovery screens (no direct dependency, parallel)
  - Any AI agent modifying detail view components

# Tech tracking
tech-stack:
  added: []
  patterns:
    - FLIP animation via useFlipEnter/useFlipExit hooks reading from transitionStore
    - ScrollTrigger-driven active index in InteractiveShowcase (image flow)
    - Dual rendering path: PostDetailContent (post flow) vs ImageDetailContent (legacy image flow)

key-files:
  created:
    - specs/screens/detail/SCR-VIEW-01-post-detail.md
    - specs/screens/detail/SCR-VIEW-02-spot-hotspot.md
  modified: []

key-decisions:
  - "/images/[id] server-redirects to /posts/[id] — ImageDetailPage is now used only for the intercepted parallel modal route"
  - "PostDetailContent renders inline spot dot markers (animate-ping), not DS Hotspot — DS Hotspot is used in ImageCanvas (image flow)"
  - "useSpotCardSync hook is for request/detect flow only; detail view spot state is local activeIndex in InteractiveShowcase"
  - "transitionStore.selectedId tracks the image being FLIP-transitioned (not per-spot panel selection)"
  - "Hotspot tap → BottomSheet flow is ⚠️ NOT-IMPL in PostDetailContent; current post flow uses DecodedItemsSection expandable cards"

patterns-established:
  - "SCR-VIEW-0N: Screen specs document implementation status truthfully (NOT-IMPL for missing features, not speculative)"
  - "Dual-route coverage: primary route documented fully, secondary route documented as delta or redirect"

# Metrics
duration: 4min
completed: 2026-02-19
---

# Phase v4-04 Plan 01: Post Detail + Hotspot Interaction Screen Specs Summary

**Two screen specs covering /posts/[id] detail page and its spot/hotspot interaction layer, with 33 verified file paths and accurate implementation status for FLIP animation, inline spot markers, and InteractiveShowcase scroll-driven activation.**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-02-19T13:04:56Z
- **Completed:** 2026-02-19T13:08:17Z
- **Tasks:** 2
- **Files created:** 2 (specs only — documentation milestone, no code changes)

## Accomplishments

- SCR-VIEW-01 documents both `/posts/[id]` and `/images/[id]` routes with the key finding that `/images/[id]` server-redirects to `/posts/[id]`, and `ImageDetailPage` is now only used for the intercepted parallel modal route
- SCR-VIEW-02 documents the split between the image flow (DS Hotspot + InteractiveShowcase + ScrollTrigger) and the post flow (inline dots + DecodedItemsSection), with the Hotspot→BottomSheet panel correctly marked `⚠️ NOT-IMPL`
- All 33 `packages/web/` file paths across both specs verified against filesystem — zero stale paths

## Task Commits

1. **Task 1: Write SCR-VIEW-01-post-detail.md** - `8c7aaa1` (docs)
2. **Task 2: Write SCR-VIEW-02-spot-hotspot.md** - `10edc50` (docs)

**Plan metadata:** _(pending final commit)_

## Files Created

- `specs/screens/detail/SCR-VIEW-01-post-detail.md` — Post/Image detail screen spec (159 lines): component map, mobile+desktop wireframes, EARS requirements, route delta, FLIP animation requirements
- `specs/screens/detail/SCR-VIEW-02-spot-hotspot.md` — Spot/Hotspot interaction layer spec (149 lines): interaction states table, FLIP sequence, mobile/desktop breakpoint table, EARS requirements

## Decisions Made

- **`/images/[id]` is a server redirect, not a separate page.** `ImageDetailPage` component still exists but serves only the intercepted parallel modal route (`@modal/(.)images/[id]`). Spec documents this as "Route Delta" for clarity.
- **PostDetailContent uses inline spot dots, not DS Hotspot.** The DS `Hotspot` component is only used in `ImageCanvas` (legacy image flow). The post flow renders custom `div` elements with Tailwind `animate-ping`. This is `⚠️ NOT-IMPL` (using DS Hotspot in post flow is `📋 PLANNED`).
- **`transitionStore.selectedId` is for FLIP transition, not spot selection.** Per-spot active state is local `activeIndex` in `InteractiveShowcase`. The store-map note about "tracks which spot is active" was a pre-existing inaccuracy — corrected in SCR-VIEW-02.
- **`useSpotCardSync` is request/detect only.** The hook takes `DetectedSpot[]` from `requestStore`, not from the detail view. It is not used in detail page components.

## Deviations from Plan

None — plan executed exactly as written. All paths verified, all stale paths from STALE-PATHS-AUDIT.md (SpotMarker, SpotOverlay, SpotPopup) correctly omitted (they don't exist) with the underlying features marked `⚠️ NOT-IMPL`.

## Issues Encountered

- The plan expected DS Hotspot to be used in PostDetailContent. Codebase inspection revealed inline div elements are used instead. Spec documents this accurately rather than speculatively — existing behavior first, then NOT-IMPL tag for the DS Hotspot migration path.

## Next Phase Readiness

- SCR-VIEW-03 (Item/Solution detail) and SCR-VIEW-04 (Related content) can proceed — both specs cross-reference back to SCR-VIEW-01/02
- The `DecodedItemsSection` component (`packages/web/lib/components/detail/DecodedItemsSection.tsx`) is the primary entry point for SCR-VIEW-03 content
- No blockers

---
*Phase: v4-04-screen-specs-detail-view*
*Completed: 2026-02-19*
