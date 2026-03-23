---
phase: 41-read-hook-migration
plan: "04"
subsystem: hooks/api
tags: [orval, codegen, migration, types, cleanup, roadmap-sc-5]
dependency_graph:
  requires:
    - packages/web/lib/api/generated/models/index.ts
    - packages/web/lib/api/generated/models/postDetailResponse.ts
    - packages/web/lib/api/generated/models/spotWithTopSolution.ts
    - packages/web/lib/api/generated/models/updatePostDto.ts
    - packages/web/lib/api/generated/models/createSpotDto.ts
    - packages/web/lib/api/generated/models/updateSpotDto.ts
    - packages/web/lib/api/generated/models/updateUserDto.ts
    - packages/web/lib/api/generated/models/userStatsResponse.ts
  provides:
    - packages/web/lib/api/mutation-types.ts (manual mutation/upload/server types)
    - ROADMAP SC-5 complete: types.ts deleted
    - generated/models as single source of truth for read types
  affects:
    - packages/web/lib/api/client.ts
    - packages/web/lib/api/posts.ts
    - packages/web/lib/api/spots.ts
    - packages/web/lib/api/solutions.ts
    - packages/web/lib/api/adapters/postDetailToImageDetail.ts
    - packages/web/lib/hooks/usePosts.ts
    - packages/web/lib/hooks/useSpots.ts
    - packages/web/lib/hooks/useSolutions.ts
    - packages/web/lib/hooks/useImages.ts
    - packages/web/lib/hooks/useProfile.ts
    - packages/web/lib/stores/profileStore.ts
    - packages/web/lib/utils/main-page-mapper.ts
    - packages/web/app/images/ImageCard.tsx
    - packages/web/lib/components/detail/ImageDetailContent.tsx
    - packages/web/lib/components/detail/SolutionLinkForm.tsx
    - packages/web/lib/components/detail/magazine/ (5 files)
    - packages/web/lib/components/main/DecodedSolutionsSection.tsx
    - packages/web/lib/components/request/MetadataInputForm.tsx
tech_stack:
  added: []
  patterns:
    - Types split pattern: generated/models for read types, mutation-types.ts for mutation/upload/server types
    - ManualUpdateSolutionDto alias for solution mutation DTO (incompatible shape vs generated UpdateSolutionDto)
key_files:
  created:
    - packages/web/lib/api/mutation-types.ts
  modified:
    - packages/web/lib/api/client.ts
    - packages/web/lib/api/index.ts
    - packages/web/lib/api/posts.ts
    - packages/web/lib/api/spots.ts
    - packages/web/lib/api/solutions.ts
    - packages/web/lib/api/adapters/postDetailToImageDetail.ts
    - packages/web/lib/hooks/usePosts.ts
    - packages/web/lib/hooks/useSpots.ts
    - packages/web/lib/hooks/useSolutions.ts
    - packages/web/lib/hooks/useImages.ts
    - packages/web/lib/hooks/useProfile.ts
    - packages/web/lib/stores/profileStore.ts
    - packages/web/lib/utils/main-page-mapper.ts
    - packages/web/app/images/ImageCard.tsx
    - packages/web/lib/components/detail/ImageDetailContent.tsx
    - packages/web/lib/components/detail/SolutionLinkForm.tsx
    - packages/web/lib/components/detail/magazine/MagazineCelebSection.tsx
    - packages/web/lib/components/detail/magazine/MagazineContent.tsx
    - packages/web/lib/components/detail/magazine/MagazineEditorialSection.tsx
    - packages/web/lib/components/detail/magazine/MagazineItemsSection.tsx
    - packages/web/lib/components/detail/magazine/MagazineRelatedSection.tsx
    - packages/web/lib/components/main/DecodedSolutionsSection.tsx
    - packages/web/lib/components/request/MetadataInputForm.tsx
  deleted:
    - packages/web/lib/api/types.ts
decisions:
  - "PostDetailResponse/SpotWithTopSolution/TopSolutionSummary imported from generated/models (structurally equivalent to manual versions)"
  - "UpdatePostDto imported from generated/models (compatible superset — generated adds optional status field)"
  - "UpdateUserDto imported from generated/models (same fields, nullable annotations only differ)"
  - "UserStatsResponse imported from generated/models (rank is non-nullable string in generated vs null in manual; profileStore only uses total_* fields, not rank)"
  - "CreateSpotDto/UpdateSpotDto imported from generated/models (compatible; UpdateSpotDto generated adds optional status field)"
  - "CreateSolutionDto kept in mutation-types.ts per plan requirement (used by active mutation path)"
  - "ManualUpdateSolutionDto introduced in mutation-types.ts — generated UpdateSolutionDto has only description/metadata/title; manual version has product_url/product_name/brand/price/currency/image_url (Phase 42 will reconcile)"
  - "Admin hooks (useDashboard, useAiCost, useAudit, usePipeline, useServerLogs) confirmed unchanged per MIG-04"
  - "Supabase ./types imports in lib/supabase/ are unrelated Supabase Database schema types — not affected by this migration"
metrics:
  duration_seconds: 420
  completed_date: "2026-03-23"
  tasks_completed: 1
  tasks_total: 1
  files_modified: 23
  files_deleted: 1
  files_created: 1
---

# Phase 41 Plan 04: Types.ts Deletion and Mutation Types Relocation Summary

**One-liner:** types.ts deleted per ROADMAP SC-5; mutation/upload/server types relocated to mutation-types.ts; 21 consumer files updated to import from generated/models or mutation-types; TypeScript exits 0.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Delete types.ts, create mutation-types.ts, update all consumers | d027d920 | 24 files (23 modified, 1 created, 1 deleted) |

## What Was Built

**types.ts DELETED** per ROADMAP SC-5. Generated models are now the single source of truth for all read types.

**mutation-types.ts CREATED** at `packages/web/lib/api/mutation-types.ts` containing:
- `ApiError` — used by client.ts error handling
- `UploadResponse` — used by posts.ts uploadImage
- `AnalyzeRequest`, `AnalyzeResponse`, `AnalyzeMetadata`, `DetectedItem` — AI image analysis
- `ExtractPostMetadataRequest`, `ExtractPostMetadataResponse` — post metadata extraction
- `MediaSourceType`, `MediaSource`, `SpotRequest`, `ContextType`, `MediaMetadataItem` — post creation
- `CreatePostRequest`, `CreatePostResponse`, `SpotSolution`, `SpotWithSolutionRequest`, `CreatePostWithSolutionRequest` — post creation mutations
- `Post`, `PostUser`, `PostMediaSource`, `PostsListPagination`, `PostsListResponse`, `PostsListParams` — list types used by server-side fetch
- `PostResponse` — update post response (different shape from generated PostResponse)
- `Spot`, `SpotListResponse` — spot mutation types (different from generated SpotListItem)
- `Solution`, `SolutionListItem`, `CreateSolutionDto`, `ManualUpdateSolutionDto` — solution mutation types
- `ExtractMetadataRequest`, `ExtractMetadataResponse`, `ConvertAffiliateRequest`, `ConvertAffiliateResponse` — utility functions
- PostMagazine types (PostMagazineResponse, PostMagazineLayout, and all sub-types) — no generated equivalents
- `apiToStoreCoord`, `storeToApiCoord` — coordinate conversion utilities

**Consumer import updates (21 files):**
- `client.ts`: `ApiError` from `./mutation-types`
- `posts.ts`: all mutation/upload types from `./mutation-types`, `UpdatePostDto` from `./generated/models`
- `spots.ts`: `Spot` from `./mutation-types`, `CreateSpotDto/UpdateSpotDto` from `./generated/models`
- `solutions.ts`: `Solution, CreateSolutionDto, ManualUpdateSolutionDto` from `./mutation-types`
- `adapters/postDetailToImageDetail.ts`: `PostDetailResponse, SpotWithTopSolution` from `generated/models`
- `hooks/usePosts.ts`: `Post, PostsListResponse, PostsListParams, PostResponse` from `mutation-types`, `UpdatePostDto` from `generated/models`
- `hooks/useSpots.ts`: `Spot` from `mutation-types`, `CreateSpotDto/UpdateSpotDto` from `generated/models`
- `hooks/useSolutions.ts`: all solution mutation types from `mutation-types`, `CreateSolutionDto` from `mutation-types`
- `hooks/useImages.ts`: `Post, PostsListParams, PostMagazineResponse` from `mutation-types`
- `hooks/useProfile.ts`: `UpdateUserDto` from `generated/models`
- `stores/profileStore.ts`: `UserStatsResponse` from `generated/models`
- `utils/main-page-mapper.ts`: `Post` from `mutation-types`
- `app/images/ImageCard.tsx`: `Post` from `mutation-types`
- `components/detail/ImageDetailContent.tsx`: magazine types from `mutation-types`
- `components/detail/SolutionLinkForm.tsx`: `ExtractMetadataResponse` from `mutation-types`
- `components/detail/magazine/*.tsx` (5 files): magazine sub-types from `mutation-types`
- `components/main/DecodedSolutionsSection.tsx`: `PostDetailResponse, SpotWithTopSolution` from `generated/models`
- `components/request/MetadataInputForm.tsx`: `ContextType, MediaSourceType` from `mutation-types`

**index.ts updated**: `export * from "./types"` replaced with `export * from "./mutation-types"`

**Admin hooks confirmed unchanged**: useDashboard, useAiCost, useAudit, usePipeline, useServerLogs — all import from their own `@/lib/api/admin/` modules only, per MIG-04.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] ManualUpdateSolutionDto introduced instead of UpdateSolutionDto**
- **Found during:** Task 1 (type analysis)
- **Issue:** Generated `UpdateSolutionDto` only has `description, metadata, title`. Manual `UpdateSolutionDto` has `product_url, product_name, brand, price, currency, image_url` — completely different shape used by active mutation code.
- **Fix:** Renamed to `ManualUpdateSolutionDto` in mutation-types.ts to avoid name collision with generated type. Both solutions.ts and useSolutions.ts updated to use `ManualUpdateSolutionDto`.
- **Files modified:** `packages/web/lib/api/mutation-types.ts`, `solutions.ts`, `useSolutions.ts`
- **Commit:** d027d920

## Verification

- `bunx tsc --noEmit` exits 0 after all changes
- `packages/web/lib/api/types.ts` does not exist (deleted)
- Zero grep matches for `@/lib/api/types` across lib/ and app/ (excluding supabase/Database types and local component types)
- All 5 admin hooks confirmed free of any types.ts imports
- mutation-types.ts contains: UploadResponse, CreatePostRequest, Spot, CreateSolutionDto, apiToStoreCoord
- mutation-types.ts does NOT contain: MyBadgesResponse, ApiEarnedBadgeItem, ApiMyRankingDetail, RankingListResponse

## Self-Check: PASSED

Files exist:
- `packages/web/lib/api/mutation-types.ts` — FOUND
- `packages/web/lib/api/index.ts` — FOUND (contains `from "./mutation-types"`)
- `packages/web/lib/api/types.ts` — NOT EXISTS (correctly deleted)
- `packages/web/lib/api/client.ts` — FOUND
- `packages/web/lib/api/posts.ts` — FOUND
- `packages/web/lib/api/spots.ts` — FOUND
- `packages/web/lib/api/solutions.ts` — FOUND

Commits verified:
- d027d920 — FOUND
