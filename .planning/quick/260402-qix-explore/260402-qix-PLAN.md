# Quick Task 260402-qix: explore 페이지 필터 제거

## Plan 1: Remove filter UI and related code from ExploreClient

### Task 1: Remove filter imports, state, and UI from ExploreClient.tsx

**files:** `packages/web/app/explore/ExploreClient.tsx`
**action:** 
- Remove `useHierarchicalFilterStore` import and usage (mediaId, castId, breadcrumb, hasActiveFilters)
- Remove `ExploreFilterBar`, `ExploreFilterSheet` imports
- Remove `SlidersHorizontal` icon import
- Remove `filterSheetOpen` state
- Remove `mediaName`, `castName` derived variables
- Remove desktop filter bar div (line 103-105)
- Remove mobile filter toggle button div (line 108-116)
- Remove `ExploreFilterSheet` component (line 119-122)
- Remove `mediaName`, `castName` from `useInfinitePosts` params
- Clean up `hasActiveFilters()` references in empty state
- Remove `mediaId`, `castId` from AnimatePresence key

**verify:** File compiles without filter references
**done:** ExploreClient no longer renders any filter UI

### Task 2: Clean up explore component index exports

**files:** `packages/web/lib/components/explore/index.ts`
**action:**
- Remove exports for: `ExploreFilterBar`, `ExploreFilterSheet`, `CategoryFilter`, `FilterChip`, `ExploreSortControls`

**verify:** No unused exports remain
**done:** Index only exports non-filter components
