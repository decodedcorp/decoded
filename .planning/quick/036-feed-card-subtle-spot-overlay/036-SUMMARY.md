---
phase: quick
plan: 036
subsystem: ui
tags: [react, design-system, hotspot, useSpots, feed]

# Dependency graph
requires:
  - phase: quick-033
    provides: Hotspot design system component with brand color support
  - phase: quick-030
    provides: brandToColor utility for deterministic brand colors
provides:
  - Feed cards display actual spot data from API using Hotspot design system component
  - Conditional spot fetching pattern (only when hasItems=true and postId exists)
affects: [feed, image-detail, spot-overlay]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Conditional data fetching with enabled option in useSpots
    - Replace hardcoded UI with actual API data

key-files:
  created: []
  modified:
    - packages/web/lib/components/FeedCard.tsx

key-decisions:
  - "Use inactive variant (50% opacity) for subtle, non-distracting appearance"
  - "Override Hotspot size to 12x12px (!w-3 !h-3) instead of default 24x24px for feed card context"
  - "Fetch spots conditionally only when hasItems && postId to avoid unnecessary API calls"

patterns-established:
  - "Conditional data fetching pattern: enabled: !!item.hasItems && !!item.postId"
  - "Size override pattern: !w-3 !h-3 with important prefix to override CVA defaults"

# Metrics
duration: 2min
completed: 2026-02-12
---

# Quick Task 036: Feed Card Subtle Spot Overlay

**Feed cards now display real spot positions using 12x12px inactive Hotspot markers fetched conditionally from API**

## Performance

- **Duration:** 2 min 1s
- **Started:** 2026-02-12T18:43:04Z
- **Completed:** 2026-02-12T18:45:05Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments
- Replaced hardcoded white dot indicators with actual spot data from useSpots hook
- Implemented conditional fetching (only when hasItems=true and postId exists)
- Applied subtle styling (12x12px, 50% opacity, pointer-events-none) for non-distracting preview
- Used existing Hotspot design system component for consistency

## Task Commits

Each task was committed atomically:

1. **Task 1: Add subtle spot overlay to FeedCard** - `59834da` (feat)
   - Import Hotspot from design-system and useSpots hook
   - Fetch spots conditionally when hasItems and postId exist
   - Render subtle 12x12px inactive Hotspot markers on image
   - Replace hardcoded white dot indicators with actual spot data
   - Use opacity-50 for subtle, non-distracting appearance
   - Spots are pointer-events-none and do not interfere with interactions

## Files Created/Modified
- `packages/web/lib/components/FeedCard.tsx` - Added useSpots hook integration and Hotspot rendering

## Decisions Made

**1. Size override with important prefix**
- Used `!w-3 !h-3` (12x12px) instead of default 24x24px
- Important prefix overrides CVA variant defaults
- Rationale: Feed cards need smaller, more subtle indicators than detail pages

**2. Inactive variant with additional opacity**
- Used `variant="inactive"` (50% opacity) + `opacity-50` class
- Rationale: Feed context requires subtlety - dots should hint at content, not dominate

**3. Conditional fetching pattern**
- `enabled: !!item.hasItems && !!item.postId`
- Rationale: Avoid unnecessary API calls for cards without items

**4. Category name fallback**
- `spot.category?.name?.en || spot.category?.name?.ko || "Item"`
- Rationale: Support bilingual category names, graceful fallback

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - implementation was straightforward using existing design system components.

## Next Phase Readiness

- Feed cards now show real spot data, consistent with detail page
- Pattern established for conditional data fetching based on hasItems flag
- Ready for further spot-related features (hover interactions, click navigation, etc.)

---
*Phase: quick-036*
*Completed: 2026-02-12*
