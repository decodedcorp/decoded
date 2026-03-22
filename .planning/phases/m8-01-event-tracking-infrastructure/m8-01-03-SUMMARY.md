---
phase: m8-01-event-tracking-infrastructure
plan: 03
subsystem: ui
tags: [tracking, zustand, react, behaviorStore, events, analytics]

# Dependency graph
requires:
  - phase: m8-01-01
    provides: Supabase events table, POST /api/v1/events route
  - phase: m8-01-02
    provides: behaviorStore, useTrackEvent, useTrackDwellTime, useTrackScrollDepth, initFlushTimer

provides:
  - EventFlushProvider wired in layout.tsx (flush timer + scroll depth global)
  - post_click events in FeedCard (feed) and ExploreCardCell (explore)
  - dwell_time events in FeedCard via useTrackDwellTime
  - scroll_depth events globally via EventFlushProvider
  - category_filter events in ExploreFilterBar
  - search_query events in SearchInput on submit
  - post_view events in ImageDetailPage and ImageDetailModal on mount
  - spot_click events in ShopGrid View Details button

affects: [m8-02-personalized-feed, m8-03-dynamic-ui]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - EventFlushProvider client component pattern — wraps layout children for global effect hooks (flush timer, scroll depth)
    - track() call in existing click handlers — minimal, non-disruptive event wiring
    - useEffect([imageId]) for page-level view events — fires once per entity on mount

key-files:
  created:
    - packages/web/app/EventFlushProvider.tsx
  modified:
    - packages/web/app/layout.tsx
    - packages/web/lib/components/FeedCard.tsx
    - packages/web/lib/components/explore/ExploreCardCell.tsx
    - packages/web/lib/components/explore/ExploreFilterBar.tsx
    - packages/web/lib/components/search/SearchInput.tsx
    - packages/web/lib/components/detail/ImageDetailPage.tsx
    - packages/web/lib/components/detail/ImageDetailModal.tsx
    - packages/web/lib/components/detail/ShopGrid.tsx

key-decisions:
  - "EventFlushProvider as separate 'use client' component in app/ — layout.tsx is Server Component so hooks cannot be called directly"
  - "post_view wired in both ImageDetailPage (direct URL) and ImageDetailModal (intercepting route) — ensures coverage for both navigation paths"
  - "spot_click fires on View Details button in ShopGrid — most explicit user intent signal for spot interaction"
  - "dwellRef attached via article wrapper in FeedCard — avoids forwardRef casting complexity on Card design system component"

patterns-established:
  - "Global effect hooks (flush timer, scroll depth) belong in EventFlushProvider, not in individual feature components"
  - "track() call placed at top of click handlers before navigation side-effects — ensures event fires before page unload"
  - "useTrackDwellTime attached to outermost card wrapper article element"

requirements-completed: [TRACK-01, TRACK-02, TRACK-03]

# Metrics
duration: 15min
completed: 2026-03-12
---

# Phase m8-01 Plan 03: Component Event Wiring Summary

**7 behavioral event types wired to real UI: post_click/view/dwell_time in feed, category_filter/scroll_depth in explore, search_query in search overlay, spot_click in post detail**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-03-12T09:15:00Z
- **Completed:** 2026-03-12T09:27:13Z
- **Tasks:** 2
- **Files modified:** 8 (+ 1 created)

## Accomplishments

- Created `EventFlushProvider` client component — initialized in `layout.tsx` to register 30s flush timer and global scroll depth tracking across all pages
- Wired `dwell_time` + `post_click` in `FeedCard` (source: feed), `post_click` in `ExploreCardCell` (source: explore), `category_filter` in `ExploreFilterBar`
- Wired `search_query` in `SearchInput` on submit, `post_view` in `ImageDetailPage` + `ImageDetailModal` on mount, `spot_click` in `ShopGrid` View Details button

## Task Commits

1. **Task 1: flush timer + scroll/dwell/click/filter events** - `f2660055` (feat)
2. **Task 2: post_view and spot_click events** - `cc3a01c3` (feat)

## Files Created/Modified

- `packages/web/app/EventFlushProvider.tsx` — New client component: initFlushTimer + useTrackScrollDepth
- `packages/web/app/layout.tsx` — Added EventFlushProvider inside AppProviders
- `packages/web/lib/components/FeedCard.tsx` — Added useTrackDwellTime ref on article wrapper + post_click in handleClick
- `packages/web/lib/components/explore/ExploreCardCell.tsx` — Added post_click tracking in handleClick
- `packages/web/lib/components/explore/ExploreFilterBar.tsx` — Added category_filter tracking in handleCategorySelect
- `packages/web/lib/components/search/SearchInput.tsx` — Added search_query tracking in handleSearch
- `packages/web/lib/components/detail/ImageDetailPage.tsx` — Added post_view tracking in useEffect on imageId
- `packages/web/lib/components/detail/ImageDetailModal.tsx` — Added post_view tracking in useEffect on imageId
- `packages/web/lib/components/detail/ShopGrid.tsx` — Added spot_click tracking in View Details button onClick

## Decisions Made

- `EventFlushProvider` as separate `'use client'` file — `layout.tsx` is a Server Component and cannot call React hooks directly
- Both `ImageDetailPage` and `ImageDetailModal` wire `post_view` — the two navigation paths to post detail (direct URL and intercepting route) both need coverage
- `spot_click` placed on "View Details" button (not just card hover) — explicit click intent is the right signal for recommendation scoring

## Deviations from Plan

**1. [Rule 2 - Missing Critical] Added post_view to ImageDetailModal**
- **Found during:** Task 2 (post_view wiring)
- **Issue:** Plan mentioned `PostDetail.tsx` but the actual intercepting-route modal (`ImageDetailModal.tsx`) was not listed — omitting it would miss all modal navigation post_view events
- **Fix:** Added `useTrackEvent` + post_view useEffect to `ImageDetailModal.tsx` alongside `ImageDetailPage.tsx`
- **Files modified:** packages/web/lib/components/detail/ImageDetailModal.tsx
- **Committed in:** cc3a01c3 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (missing critical coverage)
**Impact on plan:** Necessary for complete post_view coverage. No scope creep.

## Issues Encountered

None — TypeScript compiled clean after both tasks.

## User Setup Required

None - all changes are client-side wiring of existing hooks and stores.

## Next Phase Readiness

- All 7 event types (post_click, post_view, spot_click, search_query, category_filter, dwell_time, scroll_depth) firing from real UI interactions
- Events are queued in behaviorStore, flushed every 30s via sendBeacon to `/api/v1/events`
- Phase m8-01 infrastructure complete — ready for m8-02 (Personalized Feed) which needs accumulated behavioral data

---
*Phase: m8-01-event-tracking-infrastructure*
*Completed: 2026-03-12*
