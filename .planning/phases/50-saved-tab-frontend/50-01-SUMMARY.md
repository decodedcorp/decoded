---
phase: 50-saved-tab-frontend
plan: "01"
subsystem: profile/saved-tab
tags: [saved-tab, infinite-scroll, mock-removal, dead-code]
dependency_graph:
  requires: [Phase 48 (saved API endpoint), Phase 49 (TriesGrid pattern)]
  provides: [SavedGrid with real API data, mock-free collectionStore]
  affects: [Profile page Saved tab]
tech_stack:
  added: []
  patterns: [useInfiniteQuery with raw function, native IntersectionObserver, conditional Image rendering]
key_files:
  created: []
  modified:
    - packages/web/lib/components/profile/SavedGrid.tsx
    - packages/web/lib/stores/collectionStore.ts
    - packages/web/lib/components/collection/index.ts
  deleted:
    - packages/web/lib/components/collection/PinGrid.tsx
    - packages/web/lib/components/collection/PinCard.tsx
    - packages/web/lib/components/collection/BoardGrid.tsx
    - packages/web/lib/components/collection/BoardCard.tsx
    - packages/web/lib/components/collection/CollageView.tsx
    - packages/web/lib/components/collection/CollectionHeader.tsx
decisions:
  - "getMySaved raw function used (not useGetMySaved hook) for infinite pagination — same pattern as Phase 49 TriesGrid and Phase 41 useUserActivities"
  - "Native IntersectionObserver used for infinite scroll sentinel — react-intersection-observer not installed"
  - "Conditional Image rendering for null post_thumbnail_url — never pass null to next/image src"
  - "CollectionShareSheet kept in index.ts — unrelated to pins/boards, preserved for future use"
metrics:
  duration: "2 minutes"
  completed_date: "2026-03-26"
  tasks_completed: 2
  tasks_total: 2
  files_modified: 3
  files_deleted: 6
---

# Phase 50 Plan 01: Saved Tab Frontend Summary

**One-liner:** SavedGrid rewritten with useInfiniteQuery + getMySaved API, MOCK_PINS/MOCK_BOARDS removed, 6 dead collection components deleted.

## What Was Built

Completed the Profile page Saved tab by replacing the mock-data-driven collectionStore implementation with real API data. The SavedGrid now fetches from the `/api/v1/users/me/saved` endpoint using infinite pagination, matching the TriesGrid pattern from Phase 49.

## Tasks Completed

| Task | Name | Commit | Key Changes |
|------|------|--------|-------------|
| 1 | Rewrite SavedGrid with useInfiniteQuery | 36c69ceb | SavedGrid.tsx rewritten (139 insertions, 53 deletions) |
| 2 | Remove mock data + delete dead components | 9ae10b34 | collectionStore cleaned, 6 files deleted (429 deletions) |

## Key Implementation Details

**SavedGrid.tsx** now follows the TriesGrid.tsx pattern exactly:
- `useInfiniteQuery` with `getMySaved` raw function (queryKey: `/api/v1/users/me/saved`)
- Native `IntersectionObserver` sentinel at col-span-full for infinite scroll trigger
- Loading: 4-item skeleton grid (aspect-[3/4], animate-pulse)
- Error: "Failed to load saved posts" + Retry button
- Empty: Bookmark icon + "저장한 포스트가 없습니다" + sub-text
- Cards: Link to `/images/${item.post_id}`, conditional Image rendering for null thumbnails, gradient overlay with title + ko-KR date

**collectionStore.ts** mock data removed:
- MOCK_PINS (8 items, lines 38-119) deleted
- MOCK_BOARDS (3 items, lines 121-154) deleted
- `loadCollection` converted to no-op

**6 dead collection components** deleted (PinGrid, PinCard, BoardGrid, BoardCard, CollageView, CollectionHeader)

## Deviations from Plan

None - plan executed exactly as written.

## Verification Results

- `bun run typecheck`: 0 errors
- `grep -r "MOCK_PINS|MOCK_BOARDS" packages/web/lib/`: 0 matches
- `grep "collectionStore" SavedGrid.tsx`: 0 matches
- `grep "useInfiniteQuery" SavedGrid.tsx`: match found (import + usage)
- `grep "getMySaved" SavedGrid.tsx`: match found (import + queryFn)
- All 6 dead component files confirmed deleted

## Self-Check: PASSED

Files exist:
- FOUND: packages/web/lib/components/profile/SavedGrid.tsx
- FOUND: packages/web/lib/stores/collectionStore.ts
- FOUND: packages/web/lib/components/collection/index.ts

Commits exist:
- FOUND: 36c69ceb (feat: rewrite SavedGrid)
- FOUND: 9ae10b34 (chore: remove mock data + delete dead components)
