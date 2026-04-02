---
phase: 53-detail-data-migration
plan: 01
subsystem: detail-data-migration
tags: [rest-migration, supabase-removal, spot-thumbnail, useImages]
dependency_graph:
  requires: []
  provides: [usePostDetailForImage-REST, SpotDot-thumbnail]
  affects: [ImageDetailModal, SpotDot, useImages]
tech_stack:
  added: []
  patterns: [REST-adapter, graceful-degradation]
key_files:
  modified:
    - packages/web/lib/hooks/useImages.ts
    - packages/web/lib/components/detail/SpotDot.tsx
    - packages/web/lib/components/detail/ImageDetailModal.tsx
decisions:
  - "usePostDetailForImage migrated from Supabase fetchPostWithSpotsAndSolutions to REST getPost + postDetailToImageDetail adapter"
  - "SpotDot thumbnailUrl renders above dot (bottom-full positioning) to avoid overlap with tooltip below"
  - "Graceful degradation: try/catch returns null on getPost error to preserve existing error UI"
metrics:
  duration: "~2m 15s"
  completed_date: "2026-04-02"
  tasks_completed: 2
  files_modified: 3
---

# Phase 53 Plan 01: Detail Data Migration - REST Migration Summary

REST migration of `usePostDetailForImage` from Supabase direct query to `getPost` + `postDetailToImageDetail` adapter, plus spot thumbnail support in SpotDot.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Replace usePostDetailForImage queryFn with REST getPost + adapter | 3e1edfdf | packages/web/lib/hooks/useImages.ts |
| 2 | Add thumbnailUrl prop to SpotDot and pass it from ImageDetailModal | 86969a34 | packages/web/lib/components/detail/SpotDot.tsx, packages/web/lib/components/detail/ImageDetailModal.tsx |

## What Was Built

**Task 1 — REST migration:**
- Replaced ~100 lines of manual Supabase spot/solution mapping in `usePostDetailForImage` with 15-line REST call
- `queryFn` now calls `getPost(postId)` then `postDetailToImageDetail(response, postId)`
- Removed unused imports: `fetchPostWithSpotsAndSolutions`, `fetchPostMagazine`, `listPosts`, `Post`, `PostsListParams`, `ItemRow`
- Deleted local `parsePosition` helper (adapter has its own copy)
- Same queryKey `["posts", "detail", "image", postId]`, same `enabled`/`staleTime`/`gcTime` options preserved

**Task 2 — SpotDot thumbnail:**
- Added `thumbnailUrl?: string | null` to `SpotDotProps` type
- Renders `<img>` above the dot using `bottom-full` positioning when URL is present
- `ImageDetailModal` passes `item.cropped_image_path` as `thumbnailUrl` prop to each SpotDot

## Success Criteria Verification

- [x] `usePostDetailForImage` uses REST `getPost`, not Supabase `fetchPostWithSpotsAndSolutions`
- [x] `post_magazine_id`, `ai_summary`, `artist_name`, `group_name` flow from API to drawer (via adapter)
- [x] `SpotDot` renders top_solution thumbnail above the dot marker
- [x] No TypeScript errors (`bun x tsc --noEmit` exits clean)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing cleanup] Removed additional unused imports**
- **Found during:** Task 1
- **Issue:** `fetchPostMagazine`, `listPosts`, `Post`, `PostsListParams` were imported but not used in the file after the migration
- **Fix:** Removed these imports to keep the file clean and avoid lint noise
- **Files modified:** packages/web/lib/hooks/useImages.ts
- **Commit:** 3e1edfdf

## Self-Check: PASSED

Files verified:
- FOUND: packages/web/lib/hooks/useImages.ts
- FOUND: packages/web/lib/components/detail/SpotDot.tsx
- FOUND: packages/web/lib/components/detail/ImageDetailModal.tsx

Commits verified:
- FOUND: 3e1edfdf
- FOUND: 86969a34
