---
phase: v2-05-home-explore-pages
plan: 03
subsystem: ui
tags: [react, nextjs, design-system, card-components, gsap, flip-animation]

# Dependency graph
requires:
  - phase: v2-03-card-components
    provides: Card, CardContent, GridCard design-system components
  - phase: v2-05-01
    provides: Home page section structure
  - phase: v2-05-02
    provides: Explore page with CategoryFilter
provides:
  - ItemCard and StyleCard using design-system Card components on Home page
  - ExploreCardCell component using design-system Card for Explore grid
  - Consistent card styling across Home and Explore pages with hover effects
  - FLIP page transitions preserved for explore -> detail navigation
affects: [v2-06-feed-profile, v2-07-search-image-detail]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Use design-system Card components for all card-based UI
    - Extract grid cells into dedicated components for reusability
    - Preserve FLIP animations in custom Link wrappers when needed

key-files:
  created:
    - packages/web/lib/components/explore/ExploreCardCell.tsx
  modified:
    - packages/web/lib/components/main/StyleCard.tsx
    - packages/web/app/explore/ExploreClient.tsx
    - packages/web/lib/components/explore/index.ts

key-decisions:
  - "ItemCard already used design-system components correctly (no changes needed)"
  - "StyleCard refactored from inline div to Card with interactive prop"
  - "ExploreCardCell wraps Card in Link for FLIP animation control"
  - "Removed 120+ lines of inline CardCell/SkeletonCard from ExploreClient"

patterns-established:
  - "Card hover effects via interactive prop instead of manual Tailwind classes"
  - "Dedicated cell components for grid rendering (ExploreCardCell pattern)"
  - "Skeleton components co-located with cell components"

# Metrics
duration: 4min
completed: 2026-01-29
---

# Phase v2-05 Plan 03: Card Component Integration Summary

**Home and Explore pages now use design-system Card components for consistent styling, reduced code duplication, and unified hover effects**

## Performance

- **Duration:** 4 min
- **Started:** 2026-01-29T12:32:57Z
- **Completed:** 2026-01-29T12:36:38Z
- **Tasks:** 5 (1 verification only, 4 with code changes)
- **Files modified:** 3
- **Lines removed:** 130+ (inline card components)

## Accomplishments

- **Verified ItemCard already using design-system** - No changes needed, already correctly implemented
- **Refactored StyleCard** - Replaced inline div with Card component, added Image with hover zoom
- **Created ExploreCardCell** - Extracted 90+ lines of inline CardCell into reusable component
- **Cleaned up ExploreClient** - Removed 120+ lines of inline component definitions
- **Consistent card styling** - All cards use Card variant="default" size="sm" interactive

## Task Commits

Each task was committed atomically:

1. **Task 1: Verify ItemCard design-system** - _(no commit - already correct)_
2. **Task 2: Update StyleCard** - `4f66fdc` (feat)
3. **Task 3: Create ExploreCardCell** - `33f58f7` (feat)
4. **Task 4: Update ExploreClient** - `ce91269` (refactor)
5. **Task 5: Update explore barrel** - `5f27c8c` (feat)

## Files Created/Modified

### Created
- `packages/web/lib/components/explore/ExploreCardCell.tsx` - Card cell component for ThiingsGrid with FLIP transitions, includes ExploreSkeletonCell

### Modified
- `packages/web/lib/components/main/StyleCard.tsx` - Replaced inline div with design-system Card, added Image with hover scale
- `packages/web/app/explore/ExploreClient.tsx` - Removed inline CardCell/SkeletonCard definitions (~120 lines), now uses ExploreCardCell
- `packages/web/lib/components/explore/index.ts` - Added ExploreCardCell and ExploreSkeletonCell exports

## Decisions Made

1. **ItemCard already correct** - Verified it already uses design-system Card and CardContent, no changes needed
2. **StyleCard aspect ratios preserved** - Kept variant-based aspect ratios (large: 4/3, medium: 3/4, small: square)
3. **Custom Link wrapper for FLIP** - ExploreCardCell wraps Card in Link to control onClick for FLIP animation capture
4. **Co-located skeleton component** - ExploreSkeletonCell defined in same file as ExploreCardCell for easy maintenance

## Deviations from Plan

None - plan executed exactly as written. All components updated to use design-system Card components without issues.

## Issues Encountered

None - all components integrated smoothly with design-system Card.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

✅ **Ready for v2-06 (Feed & Profile Pages)**
- Card component patterns established and validated
- FLIP transitions working with design-system components
- Loading skeletons consistent with card styling

✅ **Design system integration complete**
- All Home page cards use design-system components
- All Explore page cards use design-system components
- Consistent hover states via interactive prop

**No blockers or concerns**

---
*Phase: v2-05-home-explore-pages*
*Completed: 2026-01-29*
