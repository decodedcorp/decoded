# Quick Task 260402-qix: explore 페이지 필터 제거

## Changes

### ExploreClient.tsx
- Removed `ExploreFilterBar` (desktop), filter toggle button + `ExploreFilterSheet` (mobile)
- Removed `useHierarchicalFilterStore` usage (mediaId, castId, breadcrumb, hasActiveFilters)
- Removed `mediaName`, `castName` params from `useInfinitePosts`
- Simplified empty state messages (no filter references)
- Simplified AnimatePresence key

### TrendingArtistsSection.tsx
- Removed `useHierarchicalFilterStore` import and `setCast` usage
- Removed `handleArtistClick` filter handler (artist cards no longer set filters)

### ArtistProfileCard.tsx
- Made `onClick` prop optional (no longer required since filter click removed)

### explore/index.ts
- Removed exports: `ExploreFilterBar`, `ExploreFilterSheet`, `CategoryFilter`, `FilterChip`, `ExploreSortControls`

## Files Modified
- `packages/web/app/explore/ExploreClient.tsx`
- `packages/web/lib/components/explore/index.ts`
- `packages/web/lib/components/explore/TrendingArtistsSection.tsx`
- `packages/web/lib/components/explore/ArtistProfileCard.tsx`
