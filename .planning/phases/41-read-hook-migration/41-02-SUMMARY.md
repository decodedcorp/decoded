---
phase: 41-read-hook-migration
plan: "02"
subsystem: hooks/api
tags: [orval, codegen, react-query, migration, comments, spots, solutions]
dependency_graph:
  requires:
    - packages/web/lib/api/generated/comments/comments.ts
    - packages/web/lib/api/generated/spots/spots.ts
    - packages/web/lib/api/generated/solutions/solutions.ts
    - packages/web/lib/api/generated/models/index.ts
  provides:
    - Migrated useComments using generated useListComments hook
    - Migrated useSpots using generated useListSpots hook
    - Migrated useSolutions using generated useListSolutions hook
    - useAllSolutionsForSpots uses generated listSolutions raw function
    - Manual API files retain only mutation functions for Phase 42
  affects:
    - packages/web/lib/hooks/useComments.ts
    - packages/web/lib/hooks/useSpots.ts
    - packages/web/lib/hooks/useSolutions.ts
    - packages/web/lib/api/comments.ts
    - packages/web/lib/api/spots.ts
    - packages/web/lib/api/solutions.ts
    - packages/web/lib/api/index.ts
    - packages/web/lib/components/shared/CommentSection.tsx
    - packages/web/lib/components/detail/ItemDetailCard.tsx
    - packages/web/lib/components/detail/types.ts
    - packages/web/lib/components/main/StyleCard.tsx
tech_stack:
  added: []
  patterns:
    - Import-alias pattern for generated hooks (useListCommentsGenerated, useListSpotsGenerated, useListSolutionsGenerated)
    - Cache key preservation via commentKeys.list() / spotKeys.list() / solutionKeys.list() passed into generated hook query option
    - Aliased generated SolutionListItem as GeneratedSolutionListItem to avoid name collision with manual types
    - setQueryData<any> on mutation hooks for transition period (Phase 42 will fix properly)
key_files:
  created: []
  modified:
    - packages/web/lib/hooks/useComments.ts
    - packages/web/lib/hooks/useSpots.ts
    - packages/web/lib/hooks/useSolutions.ts
    - packages/web/lib/api/comments.ts
    - packages/web/lib/api/spots.ts
    - packages/web/lib/api/solutions.ts
    - packages/web/lib/api/index.ts
    - packages/web/lib/components/shared/CommentSection.tsx
    - packages/web/lib/components/detail/ItemDetailCard.tsx
    - packages/web/lib/components/detail/types.ts
    - packages/web/lib/components/main/StyleCard.tsx
  deleted: []
decisions:
  - "Split import pattern: read hooks import from generated, mutation functions still import from manual API files"
  - "Aliased generated SolutionListItem as GeneratedSolutionListItem to prevent collision with manual SolutionListItem from @/lib/api/types used by mutation hooks"
  - "setQueryData<any> on useCreateSpot/useUpdateSpot/useDeleteSpot for transition period — cache now holds SpotListItem[] from generated hook but mutation type annotation was Spot[]; Phase 42 will wire properly"
  - "SolutionLike.metadata widened to unknown to accept generated SolutionListItem — parseSolutionMetadata already runtime-guards with typeof !== 'object'"
metrics:
  duration_seconds: 285
  completed_date: "2026-03-23"
  tasks_completed: 2
  tasks_total: 2
  files_modified: 11
  files_deleted: 0
---

# Phase 41 Plan 02: Read Hook Migration (Comments, Spots, Solutions) Summary

**One-liner:** Comments, spots, and solutions read hooks migrated to Orval-generated hooks via import-alias pattern with preserved cache keys; manual files retain only mutation functions for Phase 42.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Migrate comments, spots, solutions read hooks to generated hooks | 56181c66 | useComments.ts, useSpots.ts, useSolutions.ts + 4 downstream component fixes |
| 2 | Remove read functions from manual API files, update index.ts | 7428f2de | comments.ts, spots.ts, solutions.ts, index.ts |

## What Was Built

Three hook domains migrated from manual `fetchX` calls to Orval-generated hooks:

**useComments.ts:**
- `useComments` now wraps `useListCommentsGenerated` (was `useQuery` + `fetchComments`)
- Preserves `commentKeys.list(postId)` cache key via `query.queryKey`
- Old import `{ fetchComments, type CommentResponse } from "@/lib/api/comments"` removed
- New imports: `useListComments as useListCommentsGenerated` from generated, `CommentResponse` from generated models
- `useCreateComment` and `useDeleteComment` unchanged — still import from `@/lib/api/comments`
- `flatCount` and `useCommentCount` updated to use generated `CommentResponse` type

**useSpots.ts:**
- `useSpots` now wraps `useListSpotsGenerated` (was `useQuery` + `fetchSpots`)
- Return type changed from `Spot[]` to `SpotListItem[]` (generated)
- `useCreateSpot`, `useUpdateSpot`, `useDeleteSpot` still import from `@/lib/api/spots`
- `setQueryData<Spot[]>` changed to `setQueryData<any>` — transition period until Phase 42

**useSolutions.ts:**
- `useSolutions` now wraps `useListSolutionsGenerated` (was `useQuery` + `fetchSolutions`)
- `useAllSolutionsForSpots` now uses `listSolutions` raw function from generated (for `useQueries`)
- Generated `SolutionListItem` aliased as `GeneratedSolutionListItem` to avoid collision with manual type
- All 7 mutation hooks unchanged — still import from `@/lib/api/solutions`

**Manual API file cleanup:**
- `comments.ts`: `fetchComments` removed; `createComment`, `deleteComment`, `CommentResponse`, `CommentUser`, `CreateCommentDto` preserved
- `spots.ts`: `fetchSpots` removed (and unused `SpotListResponse` import); mutation functions preserved
- `solutions.ts`: `fetchSolutions` removed (and unused `SolutionListItem` import); 7 mutation functions preserved
- `index.ts`: `fetchSpots` and `fetchSolutions` removed from re-exports; mutation exports unchanged

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] CommentSection.tsx: import updated to generated CommentResponse**
- **Found during:** Task 1 (TypeScript compile check)
- **Issue:** `CommentSection.tsx` imported `CommentResponse` from `@/lib/api/comments` (manual type: `created_at: number`). After hook migration, `useComments` returns generated `CommentResponse` (`created_at: string`). Type mismatch TS2322.
- **Fix:** Updated import to `from "@/lib/api/generated/models"`. Also fixed `comment.created_at * 1000` to `new Date(comment.created_at)` since the field changed from Unix timestamp (number) to ISO date string.
- **Files modified:** `packages/web/lib/components/shared/CommentSection.tsx`
- **Commit:** 56181c66

**2. [Rule 1 - Bug] StyleCard.tsx: solution_count field not in generated SpotListItem**
- **Found during:** Task 1 (TypeScript compile check)
- **Issue:** `StyleCard.tsx` accesses `s.solution_count` on spots from `useSpots`. Generated `SpotListItem` does not include `solution_count` (field exists in backend but was not included in the OpenAPI spec's SpotListItem schema).
- **Fix:** Guarded with `(s as unknown as { solution_count?: number }).solution_count` — the `?? 0` fallback was already in place.
- **Files modified:** `packages/web/lib/components/main/StyleCard.tsx`
- **Commit:** 56181c66

**3. [Rule 1 - Bug] SolutionLike.metadata widened from Record<string,unknown>|null to unknown**
- **Found during:** Task 1 (TypeScript compile check)
- **Issue:** `ImageDetailContent.tsx` calls `solutionToShopItem(solution, base)` where `solution` is generated `SolutionListItem` with `metadata?: unknown`. `SolutionLike.metadata` expected `Record<string,unknown>|null`, causing TS2345.
- **Fix:** Widened `SolutionLike.metadata` to `unknown` and updated `parseSolutionMetadata` signature from `Record<string,unknown>|null|undefined` to `unknown` — the function body already has a `typeof !== "object"` guard so runtime behavior is identical.
- **Files modified:** `packages/web/lib/components/detail/types.ts`, `packages/web/lib/components/detail/ItemDetailCard.tsx`
- **Commit:** 56181c66

## Verification

- `bunx tsc --noEmit` exits 0 after both tasks
- No remaining imports of `fetchComments`, `fetchSpots`, `fetchSolutions` in app or lib (grep confirmed only unrelated Supabase query functions with similar names remain)
- All mutation hooks unchanged and still import from manual API files
- `useAllSolutionsForSpots` uses raw `listSolutions` from generated (not the hook, as required for `useQueries`)

## Self-Check: PASSED

Files exist:
- `packages/web/lib/hooks/useComments.ts` — FOUND
- `packages/web/lib/hooks/useSpots.ts` — FOUND
- `packages/web/lib/hooks/useSolutions.ts` — FOUND
- `packages/web/lib/api/comments.ts` — FOUND
- `packages/web/lib/api/spots.ts` — FOUND
- `packages/web/lib/api/solutions.ts` — FOUND
- `packages/web/lib/api/index.ts` — FOUND

Commits verified:
- 56181c66 — FOUND
- 7428f2de — FOUND
