---
phase: v4-05-screen-specs-discovery
plan: 02
subsystem: ui
tags: [screen-specs, feed, explore, react-query, gsap-flip, thiings-grid, zustand, infinite-scroll]

requires:
  - phase: v4-05-01
    provides: SCR-DISC-01 and SCR-DISC-02 screen specs (Home and Search)
  - phase: v4-03-01
    provides: FLW-01 Discovery Flow document (cross-reference target)

provides:
  - SCR-DISC-03-feed.md — Feed page spec with VerticalFeed, IntersectionObserver infinite scroll, FeedTabs
  - SCR-DISC-04-explore.md — Explore page spec with ThiingsGrid physics canvas, hierarchical filters, responsive cell sizing

affects:
  - v4-06 (Creation-AI screens)
  - v4-07 (User System screens)
  - Any AI agent working on /feed or /explore routes

tech-stack:
  added: []
  patterns:
    - "ThiingsGrid is a physics-based spiral canvas (not CSS columns) — cell sizes are fixed px, not responsive columns"
    - "ExploreFilterBar/Sheet uses hierarchicalFilterStore (mock data) disconnected from the actual API filter (filterStore.activeFilter)"
    - "FeedTabs (Following/ForYou/Trending) are UI-only — all tabs fetch identical data (sort:recent)"

key-files:
  created:
    - specs/screens/discovery/SCR-DISC-03-feed.md
    - specs/screens/discovery/SCR-DISC-04-explore.md
  modified: []

key-decisions:
  - "FeedCard in components/ (not DS FeedCardBase) is the actual feed card — it wraps DS FeedCard and adds GSAP FLIP + social metadata"
  - "ExploreClient does NOT render ExploreHeader or CategoryFilter — those components exist but are unused in the current page orchestrator"
  - "hierarchicalFilterStore selections (category/media/cast/context) are not passed to useInfinitePosts — ExploreClient reads only filterStore.activeFilter"
  - "ThiingsGrid infinite scroll triggers when maxVisibleIndex approaches items.length - 50 (PRELOAD_MARGIN), not at page bottom"
  - "ExploreSortControls is UI-only — sort selection does not affect useInfinitePosts params"

patterns-established:
  - "NOT-IMPL tagging: UI-only features (FeedTabs, sort controls, hierarchical filters) tagged with ⚠️ NOT-IMPL per v4.0 spec rules"
  - "Unused component documentation: ExploreHeader and CategoryFilter noted as existing but not rendered — AI agents should not assume they are active"

duration: 12min
completed: 2026-02-19
---

# Phase v4-05 Plan 02: Discovery Screen Specs (Feed + Explore) Summary

**Feed screen uses VerticalFeed (IntersectionObserver sentinel, responsive 1-4 col grid) and FeedTabs (UI-only, not wired to API); Explore screen uses ThiingsGrid physics spiral canvas with hierarchicalFilterStore (mock data) disconnected from the actual API filter**

## Performance

- **Duration:** 12 min
- **Started:** 2026-02-19T13:49:36Z
- **Completed:** 2026-02-19T14:02:00Z
- **Tasks:** 2
- **Files created:** 2

## Accomplishments

- SCR-DISC-03: Feed page fully documented — VerticalFeed grid layout, IntersectionObserver infinite scroll, tab UI, filterStore + searchStore integration, GSAP FLIP card transitions
- SCR-DISC-04: Explore page fully documented — ThiingsGrid physics canvas, hierarchical filter system (UI-only), responsive cell sizing (mobile 180x225 / desktop 400x500), stale path correction
- All 21 component file paths verified against filesystem — zero stale paths

## Task Commits

1. **Task 1: Write SCR-DISC-03-feed.md** - `a963a70` (docs)
2. **Task 2: Write SCR-DISC-04-explore.md** - `e530ff3` (docs)

## Files Created/Modified

- `specs/screens/discovery/SCR-DISC-03-feed.md` — 125 lines; Feed page spec with VerticalFeed, infinite scroll, FeedTabs analysis
- `specs/screens/discovery/SCR-DISC-04-explore.md` — 159 lines; Explore page spec with ThiingsGrid, hierarchical filters, responsive canvas

## Decisions Made

- **FeedCard vs FeedCardBase:** The actual card in feed is `packages/web/lib/components/FeedCard.tsx` (not DS FeedCardBase). It wraps DS `FeedCard` and adds GSAP FLIP, social metadata, useSpots, AccountAvatar, FollowButton.
- **ExploreClient unused components:** `ExploreHeader` and `CategoryFilter` exist in explore/ but ExploreClient does not render them. Documented as "exists but not rendered" to prevent AI agents from assuming they are active.
- **Hierarchical filter disconnect:** `ExploreFilterBar` and `ExploreFilterSheet` use `hierarchicalFilterStore` with mock data (`getMockCategories`, etc.). `ExploreClient` reads only `filterStore.activeFilter` for the actual API call. These two filter systems are disconnected.
- **ThiingsGrid is not a grid:** It is a physics-based spiral canvas with drag momentum. Cell count and layout depend on canvas pan position, not viewport columns. This is distinct from CSS grid or masonry.
- **FeedTabs are UI-only:** `activeTab` state exists locally but is not passed to `useInfinitePosts`. All three tabs (Following/ForYou/Trending) fetch identical data.

## Deviations from Plan

None — plan executed exactly as written. All source files read, paths verified, specs written within line budget.

## Issues Encountered

None.

## User Setup Required

None — documentation-only plan.

## Next Phase Readiness

- Discovery bundle (SCR-DISC-01 through SCR-DISC-04) is now complete
- v4-06 (Creation-AI screens) can begin: verify requestStore step enum + POST /api/v1/posts/analyze response shape (noted in STATE.md pending todos)
- v4-07 (User System screens) ready after v4-06: verify authStore user/session type

---
*Phase: v4-05-screen-specs-discovery*
*Completed: 2026-02-19*
