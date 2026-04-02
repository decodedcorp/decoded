---
phase: quick-260402-jjo
plan: 01
subsystem: explore
tags: [bugfix, layout-shift, skeleton, resize-observer]
dependency_graph:
  requires: []
  provides: [explore-layout-stability]
  affects: [packages/web/lib/components/explore/TrendingArtistsSection.tsx, packages/web/lib/components/ThiingsGrid.tsx]
tech_stack:
  added: []
  patterns: [skeleton-placeholder, resize-observer-grid-recalc]
key_files:
  created: []
  modified:
    - packages/web/lib/components/explore/TrendingArtistsSection.tsx
    - packages/web/lib/components/ThiingsGrid.tsx
decisions:
  - "Split isLoading from no-data condition in TrendingArtistsSection -- loading shows skeleton, no data returns null"
  - "ResizeObserver on ThiingsGrid container -- updateGridItems has internal needsUpdate guard so debounce unnecessary"
  - "SSR guard with typeof ResizeObserver check for server-side rendering safety"
metrics:
  duration: ~4min
  completed: 2026-04-02
  tasks: 2/2
---

# Quick Task 260402-jjo: Explore Page Layout Shift Fix Summary

Fix explore page bottom empty space caused by TrendingArtistsSection returning null during loading and ThiingsGrid not recalculating on container resize.

## What Changed

### Task 1: TrendingArtistsSection skeleton placeholder (5bc2d66a)

**Problem:** `isLoading` condition returned `null`, causing flex-1 ThiingsGrid to measure at full container height. When data loaded and the section appeared (~72px), the grid area shrank but ThiingsGrid kept stale dimensions.

**Fix:** Split the early return into two conditions:
- `isLoading` -> render a skeleton section matching the real section's height (~72px) with `animate-pulse`
- `!artists || artists.length < 3` -> still returns null (no layout reservation needed for empty state)

The skeleton mirrors the actual section structure: label placeholder (h-2.5 w-24) + 5 circular avatar placeholders (w-12 h-12).

### Task 2: ThiingsGrid ResizeObserver (df346845)

**Problem:** ThiingsGrid class component only recalculated grid items when props changed or physics engine updated. Container resize (from sibling elements loading) was not detected.

**Fix:** Added `ResizeObserver` on `containerRef` in `componentDidMount` that calls `updateGridItems()` on resize. The existing `needsUpdate` guard inside `updateGridItems` prevents unnecessary `setState` calls, so no debounce is needed.

- `typeof ResizeObserver !== "undefined"` guard ensures SSR safety
- Cleanup via `disconnect()` + null in `componentWillUnmount`

## Files Modified

| File | Change |
|------|--------|
| `packages/web/lib/components/explore/TrendingArtistsSection.tsx` | Split loading/no-data conditions, added skeleton placeholder |
| `packages/web/lib/components/ThiingsGrid.tsx` | Added ResizeObserver field, setup in componentDidMount, cleanup in componentWillUnmount |

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | 5bc2d66a | Skeleton placeholder in TrendingArtistsSection |
| 2 | df346845 | ResizeObserver in ThiingsGrid |

## Deviations from Plan

None -- plan executed exactly as written.

## Known Stubs

None.

## Self-Check: PASSED

- [x] TrendingArtistsSection.tsx exists and modified
- [x] ThiingsGrid.tsx exists and modified
- [x] SUMMARY.md created
- [x] Commit 5bc2d66a found
- [x] Commit df346845 found
- [x] No TypeScript errors in modified files
