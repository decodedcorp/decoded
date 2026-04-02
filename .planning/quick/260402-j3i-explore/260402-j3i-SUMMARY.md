# Quick Task 260402-j3i: Explore Filter Cleanup

**Date:** 2026-04-02
**Status:** Complete

## What was done

Removed non-working filter UI elements from `/explore` page, kept working Media/Cast filters.

### Removed
- **Category dropdown** (K-POP, K-Drama, etc.) — no DB column to filter on
- **Context dropdown** (Airport, Stage, etc.) — mock data didn't match DB context values
- **Sort controls** (Trending, Recent, Popular) — were disconnected from the query
- **Legacy `useFilterStore`** — dead code ("fashion", "beauty" keys never matched DB)

### Kept & Improved
- **Media filter** — shows all groups (NewJeans, BLACKPINK, etc.) without category dependency
- **Cast filter** — shows members after media selection
- **Outside-click dismiss** — dropdowns now close when clicking outside
- **ilike query improvement** — uses display names ("NewJeans") instead of slug IDs ("newjeans")

## Files modified

| File | Changes |
|------|---------|
| `packages/web/app/explore/ExploreClient.tsx` | Remove legacy filterStore, use mediaName/castName display names |
| `packages/web/lib/components/explore/ExploreFilterBar.tsx` | Remove Category/Context/Sort, flatten media list, add outside-click |
| `packages/web/lib/hooks/useImages.ts` | Replace mediaId/castId params with mediaName/castName |
