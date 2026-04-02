---
phase: quick
plan: 260402-j3i
subsystem: explore-filters
tags: [bug-fix, explore, filters, sort, hierarchical-filter]
dependency_graph:
  requires: []
  provides: [explore-filter-sort-wired, explore-outside-click-dismiss, explore-legacy-filter-removed]
  affects: [ExploreClient, useInfinitePosts, ExploreFilterBar]
tech_stack:
  added: []
  patterns: [hierarchical-filter-breadcrumb-name-extraction, outside-click-mousedown-ref]
key_files:
  modified:
    - packages/web/app/explore/ExploreClient.tsx
    - packages/web/lib/hooks/useImages.ts
    - packages/web/lib/components/explore/ExploreFilterBar.tsx
decisions:
  - Derived mediaName/castName from breadcrumb labels (not mediaId/castId slugs) to match DB display name ilike queries
  - Used mousedown (not click) for outside-click handler to avoid race with the toggle button's click event
  - contextType param added to useInfinitePosts alongside mediaName/castName for complete filter wiring
metrics:
  duration: "~20 minutes"
  completed_date: "2026-04-02T04:54:57Z"
  tasks: 2
  files_modified: 3
---

# Quick Task 260402-j3i: Explore Filter System Bug Fixes Summary

**One-liner:** Removed dead legacy filterStore from ExploreClient, wired sort state and hierarchical media/cast display-name filters into useInfinitePosts, and added outside-click dropdown dismiss to ExploreFilterBar.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Remove legacy filterStore + wire sort + pass name-based filter params | `253f43d2` | `ExploreClient.tsx` |
| 2 | Rename useInfinitePosts params to mediaName/castName + outside-click dismiss | `6262e049` | `useImages.ts`, `ExploreFilterBar.tsx` |

## Changes Made

### ExploreClient.tsx
- Removed `useFilterStore` import and `activeFilter` state usage (Bug 3)
- Added `useHierarchicalFilterStore` import; destructures `category`, `mediaId`, `castId`, `contextType`, `breadcrumb`, `hasActiveFilters`
- Derives `mediaName` and `castName` from breadcrumb level 2/3 labels respectively
- Added `sortOption` state (`useState<SortOption>("recent")`) wired to `useInfinitePosts` and `ExploreFilterBar`
- Passes `onSortChange={setSortOption}` prop to `<ExploreFilterBar />`
- Replaced `AnimatePresence` key `activeFilter + debouncedQuery` with `${hierCategory}-${mediaId}-${castId}-${contextType}-${debouncedQuery}` (Bug 4 stable key)
- Replaced empty-state `activeFilter !== "all"` checks with `hasActiveFilters()` calls

### useImages.ts (useInfinitePosts)
- Renamed `artistName`→`mediaName`, `groupName`→`castName` in function signature and query key (Bug 2)
- Added `contextType` param with direct `eq("context", contextType)` filter
- Updated ilike query comments to reference "hierarchical filter" source

### ExploreFilterBar.tsx
- Added `useEffect` and `useRef` to React import (removed unused `useMemo`)
- Added `const dropdownRef = useRef<HTMLDivElement>(null)` for container ref
- Added `useEffect` with `mousedown` event listener that calls `setOpenDropdown(null)` when click is outside `dropdownRef.current` (Bug 5)
- Applied `ref={dropdownRef}` to the outer container `<div>` wrapping filter chips and dropdown row

## Verification

- TypeScript compiles clean: `./node_modules/.bin/tsc --noEmit` — no output (success)
- `filterStore` references in ExploreClient: `grep -n "filterStore" ExploreClient.tsx` — no matches

## Deviations from Plan

### Auto-added functionality

**1. [Rule 2 - Missing] Added `contextType` param to `useInfinitePosts`**
- **Found during:** Task 1 (ExploreClient wiring)
- **Issue:** ExploreClient passes `contextType` from hierarchicalFilterStore but useInfinitePosts had no param for it — the category param was the old filterStore's `activeFilter` concept
- **Fix:** Added `contextType?: string` param with `eq("context", contextType)` Supabase filter
- **Files modified:** `packages/web/lib/hooks/useImages.ts`
- **Commit:** `6262e049`

**2. [Rule 1 - Bug] Removed unused `useMemo` import from ExploreFilterBar**
- **Found during:** Task 2 (adding useEffect/useRef imports)
- **Issue:** `useMemo` was imported but never used in the component body — would cause ESLint warning
- **Fix:** Removed `useMemo` from the import statement
- **Files modified:** `packages/web/lib/components/explore/ExploreFilterBar.tsx`
- **Commit:** `6262e049`

## Known Stubs

None — all filter params are now wired to real data sources (hierarchicalFilterStore breadcrumb labels and contextType).

## Self-Check: PASSED

- `packages/web/app/explore/ExploreClient.tsx` — FOUND
- `packages/web/lib/hooks/useImages.ts` — FOUND
- `packages/web/lib/components/explore/ExploreFilterBar.tsx` — FOUND
- Commit `253f43d2` — FOUND
- Commit `6262e049` — FOUND
