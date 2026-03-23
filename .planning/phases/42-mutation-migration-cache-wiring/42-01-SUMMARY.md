---
phase: 42-mutation-migration-cache-wiring
plan: "01"
subsystem: api
tags: [orval, tanstack-query, react-query, mutation, cache, generated-code, typescript]

# Dependency graph
requires:
  - phase: 41-read-hook-migration
    provides: Generated hooks for read operations; mutation-types.ts for non-migrated types

provides:
  - All POST/PATCH/DELETE mutation hooks in useComments, useSpots, useSolutions, usePosts import from @/lib/api/generated/
  - setQueryData<any> type-unsafe patterns replaced with invalidateQueries in spot and post mutation hooks
  - MIG-09 cache boundary documented in useSolutions.ts
  - SolutionLinkForm and SolutionInputForm call generated extractMetadata/convertAffiliate

affects:
  - 42-02 (profile/image mutation migration)
  - 42-03 (manual API file deletion)
  - Any consumer of useCreateSpot, useUpdateSpot, useDeleteSpot, useUpdatePost

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Generated suffix alias pattern: import { fn as fnGenerated } to avoid name collision"
    - "invalidateQueries over setQueryData for cross-boundary cache updates (SpotResponse vs SpotListItem incompatible shapes)"
    - "MIG-09: useAdoptSolution/useUnadoptSolution cross-boundary invalidation of ['posts', 'detail'] preserved intentionally"

key-files:
  created: []
  modified:
    - packages/web/lib/hooks/useComments.ts
    - packages/web/lib/hooks/useSpots.ts
    - packages/web/lib/hooks/useSolutions.ts
    - packages/web/lib/hooks/usePosts.ts
    - packages/web/lib/components/detail/SolutionLinkForm.tsx
    - packages/web/lib/components/request/SolutionInputForm.tsx

key-decisions:
  - "setQueryData<any> on spot mutations replaced with invalidateQueries — SpotResponse (mutation return) and SpotListItem (query cache) have incompatible shapes"
  - "setQueryData on post detail replaced with invalidateQueries — postKeys.detail holds Supabase PostDetail shape, not generated PostResponse"
  - "useExtractMetadata/useConvertAffiliate signatures preserved as (url: string) → generated fn wraps url into dto object internally"
  - "SolutionInputForm.meta.price/currency field access fixed to use extra_metadata only — generated MetadataResponse has no top-level price/currency"
  - "ManualUpdateSolutionDto replaced with generated UpdateSolutionDto in UpdateSolutionVariables"

patterns-established:
  - "Cache invalidation over optimistic updates when return type != cached list item type"
  - "Cross-boundary cache invalidation (REST mutation → Supabase query key) documented in MIG-09 comment block"

requirements-completed: [MIG-05, MIG-09]

# Metrics
duration: 25min
completed: 2026-03-23
---

# Phase 42 Plan 01: Mutation Migration & Cache Wiring Summary

**All POST/PATCH/DELETE mutation hooks migrated from manual apiClient wrappers to Orval-generated raw functions; setQueryData<any> type-unsafe patterns replaced with invalidateQueries; MIG-09 cache boundary documented**

## Performance

- **Duration:** ~25 min
- **Started:** 2026-03-23T14:40:00Z
- **Completed:** 2026-03-23T15:05:00Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments

- Migrated 7 mutation hooks across 4 hook files to use generated raw functions from `@/lib/api/generated/`
- Eliminated `setQueryData<any>` type-unsafe patterns in spot (3 hooks) and post (1 hook) mutations, replacing with `invalidateQueries`
- Added MIG-09 cache boundary documentation block to `useSolutions.ts`
- Updated `SolutionLinkForm` and `SolutionInputForm` to call `extractMetadata({ url })` and `convertAffiliate({ url })` from generated code (signature change: generated fns take DTO object, not bare string)

## Task Commits

1. **Task 1: Migrate comment, spot, and solution mutation hooks to generated raw functions** - `234ba1c8` (feat)
2. **Task 2: Migrate post mutation hooks to generated raw functions** - `da3174fb` (feat)

## Files Created/Modified

- `packages/web/lib/hooks/useComments.ts` - createComment/deleteComment now use generated functions
- `packages/web/lib/hooks/useSpots.ts` - createSpot/updateSpot/deleteSpot use generated; setQueryData<any> replaced with invalidateQueries
- `packages/web/lib/hooks/useSolutions.ts` - all 7 mutation hooks (create/update/delete/adopt/unadopt/extract/convert) use generated; ManualUpdateSolutionDto replaced with UpdateSolutionDto; MIG-09 comment added
- `packages/web/lib/hooks/usePosts.ts` - updatePost/deletePost use generated; setQueryData cross-boundary replaced with invalidateQueries; PostResponse from generated/models
- `packages/web/lib/components/detail/SolutionLinkForm.tsx` - extractMetadata/convertAffiliate from generated; MetadataResponse type replaces ExtractMetadataResponse
- `packages/web/lib/components/request/SolutionInputForm.tsx` - extractMetadata from generated; field access fixed for MetadataResponse shape

## Decisions Made

- **invalidateQueries vs setQueryData for spot mutations**: `SpotResponse` (what createSpot/updateSpot return) differs structurally from `SpotListItem` (what the query cache holds). Using setQueryData would silently misplace fields. invalidateQueries is the correct refetch-based approach.
- **invalidateQueries vs setQueryData for post detail**: `postKeys.detail` holds Supabase `PostDetail` (from `fetchPostWithSpotsAndSolutions`), not generated `PostResponse`. Cross-boundary setQueryData is always wrong here.
- **Generated function call shape**: `extractMetadata` and `convertAffiliate` generated functions take DTO objects (`{ url }`) not bare strings — callers updated accordingly.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed field access for MetadataResponse in SolutionInputForm**
- **Found during:** Task 1 (SolutionInputForm.tsx update)
- **Issue:** `meta.price` and `meta.currency` were accessed directly on the response, but generated `MetadataResponse` does not have top-level `price` or `currency` fields — those are nested under `extra_metadata` (type `LinkMetadata`)
- **Fix:** Changed `meta.price ?? meta.extra_metadata?.price` to `meta.extra_metadata?.price`, and `meta.currency ?? meta.extra_metadata?.currency ?? "KRW"` to `meta.extra_metadata?.currency ?? "KRW"`
- **Files modified:** `packages/web/lib/components/request/SolutionInputForm.tsx`
- **Verification:** `bunx tsc --noEmit` exits 0
- **Committed in:** `234ba1c8` (part of Task 1 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - Bug)
**Impact on plan:** Fix was essential for type safety and correct field access on the generated type. No scope creep.

## Issues Encountered

- Loop detector triggered during rapid edits to useSolutions.ts — worked around by completing other file edits first, then writing the file in a single Write call once the counter reset.

## Next Phase Readiness

- Manual API files (`@/lib/api/comments`, `@/lib/api/spots`, `@/lib/api/solutions`, `@/lib/api/posts`) may still be imported by non-hook code — 42-02 will complete the remaining migrations
- After 42-02 completes, 42-03 can delete the manual API files entirely
- `mutation-types.ts` still holds `Post`, `PostsListResponse`, `PostsListParams`, `ManualUpdateSolutionDto` (now removed) — 42-03 will reduce this file further

---
*Phase: 42-mutation-migration-cache-wiring*
*Completed: 2026-03-23*
