---
phase: 42-mutation-migration-cache-wiring
plan: "03"
subsystem: api
tags: [orval, dead-code-removal, typescript, mutation-types, api-cleanup]

# Dependency graph
requires:
  - phase: 42-01
    provides: All mutation hooks migrated from comments/spots/solutions/posts to generated code
  - phase: 42-02
    provides: useUpdateProfile migrated to generated updateMyProfile

provides:
  - comments.ts, spots.ts, solutions.ts deleted from lib/api/
  - posts.ts retains only upload/create/analyze/server-fetch/magazine functions
  - index.ts barrel is clean — no references to deleted files
  - mutation-types.ts reduced: Solution, SolutionListItem, CreateSolutionDto, ManualUpdateSolutionDto, ExtractMetadata*/ConvertAffiliate*, Spot, SpotListResponse, PostResponse removed
  - client.ts preserved for postLikes.ts, savedPosts.ts, posts.ts consumers
  - MIG-07 requirement fulfilled

affects:
  - Any future consumer importing from @/lib/api/index — barrel no longer includes spots/solutions/comments exports
  - mutation-types.ts is now focused on upload, post creation, server-fetch, and magazine types only

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Dead code deletion: manual API wrappers removed after all mutation hooks migrated to generated code"
    - "Barrel cleanup: index.ts re-exports aligned with surviving files only"

key-files:
  created: []
  modified:
    - packages/web/lib/api/posts.ts
    - packages/web/lib/api/index.ts
    - packages/web/lib/api/mutation-types.ts
  deleted:
    - packages/web/lib/api/comments.ts
    - packages/web/lib/api/spots.ts
    - packages/web/lib/api/solutions.ts

key-decisions:
  - "Solution, Spot types removed from mutation-types.ts — no consumers outside deleted files after 42-01 migration"
  - "PostResponse (manual) removed — usePosts.ts imports PostResponse from generated/models; the mutation-types version was only used by the now-deleted updatePost function"
  - "fetchPostsServer and fetchPostMagazine added to index.ts barrel — these server-side functions exist in posts.ts and are valid barrel exports for downstream consumers"
  - "client.ts preserved — postLikes.ts, savedPosts.ts, and posts.ts still call apiClient/getAuthToken directly"

patterns-established:
  - "Phase 42 complete: all manual API mutation wrappers replaced by generated hooks; only upload/multipart/server-only functions remain manual"

requirements-completed: [MIG-07]

# Metrics
duration: ~8min
completed: 2026-03-23
---

# Phase 42 Plan 03: Dead API File Deletion & Barrel Cleanup Summary

**comments.ts, spots.ts, solutions.ts deleted; posts.ts stripped of updatePost/deletePost; index.ts and mutation-types.ts cleaned of all dead references — MIG-07 complete, Phase 42 done**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-03-23T14:49:00Z
- **Completed:** 2026-03-23T14:57:00Z
- **Tasks:** 1
- **Files deleted:** 3 (comments.ts, spots.ts, solutions.ts)
- **Files modified:** 3 (posts.ts, index.ts, mutation-types.ts)

## Accomplishments

- Deleted `packages/web/lib/api/comments.ts` — createComment/deleteComment already migrated to generated hooks in 42-01
- Deleted `packages/web/lib/api/spots.ts` — createSpot/updateSpot/deleteSpot already migrated to generated hooks in 42-01
- Deleted `packages/web/lib/api/solutions.ts` — all 7 solution mutation functions already migrated to generated hooks in 42-01
- Removed `updatePost` and `deletePost` functions from `posts.ts` — usePosts.ts calls generated functions directly after 42-01
- Removed `import type { UpdatePostDto } from "./generated/models"` and `PostResponse` from posts.ts imports (only used by the now-deleted functions)
- Updated `index.ts`: removed re-exports for deleted files (spots, solutions, comments); added `fetchPostsServer` and `fetchPostMagazine` to the posts barrel
- Cleaned `mutation-types.ts`: removed 9 types/interfaces that had no remaining consumers outside the deleted files: `Solution`, `SolutionListItem`, `CreateSolutionDto`, `ManualUpdateSolutionDto`, `ExtractMetadataRequest`, `ExtractMetadataResponse`, `ConvertAffiliateRequest`, `ConvertAffiliateResponse`, `Spot`, `SpotListResponse`, `PostResponse`
- Net: 479 lines deleted, 4 lines added (barrel exports for fetchPostsServer/fetchPostMagazine)
- TypeScript compiles cleanly (`bunx tsc --noEmit` exits 0)

## Task Commits

1. **Task 1: Delete dead API wrappers, clean posts.ts/index.ts/mutation-types.ts** - `af14e2eb` (feat)

## Files Created/Modified

- `packages/web/lib/api/comments.ts` — DELETED
- `packages/web/lib/api/spots.ts` — DELETED
- `packages/web/lib/api/solutions.ts` — DELETED
- `packages/web/lib/api/posts.ts` — updatePost/deletePost removed; UpdatePostDto/PostResponse imports removed
- `packages/web/lib/api/index.ts` — spots/solutions/comments re-exports removed; fetchPostsServer/fetchPostMagazine added to barrel
- `packages/web/lib/api/mutation-types.ts` — 9 dead types removed; PostResponse section removed; comment updated

## Decisions Made

- **PostResponse kept in generated/models, removed from mutation-types**: `usePosts.ts` imports `PostResponse` from `@/lib/api/generated/models` — the manual `PostResponse` in mutation-types was only used as the return type of `updatePost`. Removing it avoids ambiguity.
- **Solution/Spot types removed**: No non-deleted file imported these from mutation-types. Generated equivalents (`SpotResponse`, `SolutionListItem`) are available in `@/lib/api/generated/models`.
- **fetchPostsServer/fetchPostMagazine added to barrel**: These server-only functions exist in posts.ts and are valid public exports that downstream server components may import via the barrel.

## Deviations from Plan

None — plan executed exactly as written. All pre-deletion grep checks returned 0 matches (except index.ts re-exports, which were cleaned in the same task). TypeScript validated cleanly on first attempt.

## Self-Check: PASSED

- `packages/web/lib/api/comments.ts` — DELETED (PASS)
- `packages/web/lib/api/spots.ts` — DELETED (PASS)
- `packages/web/lib/api/solutions.ts` — DELETED (PASS)
- `packages/web/lib/api/posts.ts` — EXISTS; updatePost/deletePost absent (PASS)
- `packages/web/lib/api/client.ts` — EXISTS, preserved (PASS)
- `packages/web/lib/api/postLikes.ts` — EXISTS, preserved (PASS)
- `packages/web/lib/api/savedPosts.ts` — EXISTS, preserved (PASS)
- `grep -c "updatePost" posts.ts` — 0 (PASS)
- `grep -c "deletePost" posts.ts` — 0 (PASS)
- `grep -c "uploadImage" posts.ts` — 1 (PASS)
- `grep -c "fetchPostsServer" posts.ts` — 2 (PASS)
- `grep -c "from \"./spots\"" index.ts` — 0 (PASS)
- `grep -c "from \"./solutions\"" index.ts` — 0 (PASS)
- `grep -c "from \"./comments\"" index.ts` — 0 (PASS)
- No `@/lib/api/comments` imports anywhere (PASS)
- No `@/lib/api/spots` imports anywhere (PASS)
- No `@/lib/api/solutions` imports anywhere (PASS)
- `bunx tsc --noEmit` — exits 0 (PASS)
- Commit `af14e2eb` — EXISTS (PASS)

---
*Phase: 42-mutation-migration-cache-wiring*
*Completed: 2026-03-23*
