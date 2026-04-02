---
phase: 56-explore-ui-enhancement
plan: "02"
subsystem: explore-filter
tags: [explore, hierarchical-filter, supabase, tanstack-query]
dependency_graph:
  requires: []
  provides: [hierarchical-filter-wired-to-explore-grid]
  affects: [explore-grid-data, filter-bar-interactions]
tech_stack:
  added: []
  patterns: [zustand-store-consumption, tanstack-query-cache-keys, supabase-query-chaining]
key_files:
  created: []
  modified:
    - packages/web/lib/hooks/useImages.ts
    - packages/web/app/explore/ExploreClient.tsx
decisions:
  - "contextType from hierarchical store takes precedence over flat category filter — when contextType is set, flat .eq('context', category) is skipped to avoid double .eq() conflict"
  - "mediaId and castId use .ilike() approximations (group_name / artist_name) because store data is mock, not DB FKs"
  - "hierCategory from hierarchical store is NOT passed as category override — flat activeFilter remains primary category source per plan D-05"
metrics:
  duration: 8min
  completed_date: "2026-04-02"
  tasks: 2
  files: 2
---

# Phase 56 Plan 02: Hierarchical Filter Wiring Summary

Wire the hierarchical filter store (category/media/cast/context) to useInfinitePosts so ExploreFilterBar selections actually filter the Explore grid data — contextType maps to posts.context column, mediaId/castId use ilike approximations.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Add hierarchical filter params to useInfinitePosts | 766cddcc | packages/web/lib/hooks/useImages.ts |
| 2 | Wire ExploreClient to hierarchical filter store | a5e5b6ff | packages/web/app/explore/ExploreClient.tsx |

## What Was Built

### Task 1: useInfinitePosts extension (`useImages.ts`)

Extended `useInfinitePosts` with three new optional params:
- `mediaId?: string` — mapped to `.ilike("group_name", ...)` (mock data approximation)
- `castId?: string` — mapped to `.ilike("artist_name", ...)` (mock data approximation)
- `contextType?: string` — mapped to `.eq("context", contextType)` (confirmed working)

All three added to the TanStack Query cache key so filter changes trigger a refetch.

Precedence guard: when `contextType` is set, the flat `category` filter is skipped to prevent double `.eq("context", ...)` conflict.

### Task 2: ExploreClient wiring (`ExploreClient.tsx`)

- Imported `useHierarchicalFilterStore` from `@decoded/shared/stores/hierarchicalFilterStore`
- Destructured `mediaId`, `castId`, `contextType` (and `hierCategory` — not passed per plan)
- Passed all three to `useInfinitePosts` call

## Deviations from Plan

None - plan executed exactly as written.

## Verification

- `grep -n 'useHierarchicalFilterStore' packages/web/app/explore/ExploreClient.tsx` — import on line 9, usage on line 35
- `grep -n 'contextType|mediaId|castId' packages/web/lib/hooks/useImages.ts` — 18 occurrences (params, destructure, queryKey, queryFn)
- `cd packages/web && bunx tsc --noEmit` — 0 errors
- `cd packages/web && bun run build` — build succeeded

## Self-Check: PASSED

- packages/web/lib/hooks/useImages.ts — FOUND (modified)
- packages/web/app/explore/ExploreClient.tsx — FOUND (modified)
- Commit 766cddcc — FOUND
- Commit a5e5b6ff — FOUND
