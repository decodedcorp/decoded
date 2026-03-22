---
phase: quick
plan: 025
subsystem: data-layer
tags: [react-query, rest-api, posts, supabase, migration]

# Dependency graph
requires:
  - phase: quick-023
    provides: PostDetailContent component with post-based rendering
  - phase: quick-024
    provides: Post detail page sections (Decoded Items, Gallery, Shop, Related)
provides:
  - /images page using posts REST API instead of deprecated image table
  - /images/[id] redirects to /posts/[id]
  - Related content sections using posts API by artist name
  - Complete migration from image-table schema to posts-table schema
affects: [future-detail-pages, future-grid-views, related-content-patterns]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - useInfinitePosts for grid pagination via REST API
    - Post type from REST API instead of ImageRow from Supabase
    - Redirect pattern for deprecated routes

key-files:
  created: []
  modified:
    - packages/web/app/images/page.tsx
    - packages/web/app/images/ImagesClient.tsx
    - packages/web/app/images/ImageCard.tsx
    - packages/web/app/images/[id]/page.tsx
    - packages/web/lib/components/detail/ImageDetailPage.tsx
    - packages/web/lib/components/detail/ImageDetailModal.tsx
    - packages/web/lib/components/detail/PostDetailContent.tsx
    - packages/web/lib/components/detail/GallerySection.tsx
    - packages/web/lib/components/detail/RelatedLooksSection.tsx
    - packages/web/lib/components/detail/RelatedImages.tsx
    - packages/web/lib/components/detail/ImageDetailContent.tsx

key-decisions:
  - "Use CSR-only for /images page (no SSR initial posts) - simpler type handling"
  - "Redirect /images/[id] permanently to /posts/[id] instead of dual implementation"
  - "Update prop name from currentImageId to currentPostId in RelatedImages for clarity"

patterns-established:
  - "Grid pages use useInfinitePosts from @/lib/hooks/usePosts"
  - "Detail pages use usePostById from @/lib/hooks/usePosts"
  - "Related content queries filter by artistName parameter"
  - "All image-related links point to /posts/[id] instead of /images/[id]"

# Metrics
duration: 6min
completed: 2026-02-12
---

# Quick Task 025: Replace Unconnected Image Sections with Post Data

**/images page and detail routes now use posts REST API, completing migration from deprecated image table schema**

## Performance

- **Duration:** 6 minutes
- **Started:** 2026-02-12T18:27:50Z
- **Completed:** 2026-02-12T18:34:43Z
- **Tasks:** 3
- **Files modified:** 11

## Accomplishments
- /images grid page displays posts from REST API via useInfinitePosts
- /images/[id] redirects to /posts/[id] to avoid maintaining dual detail implementations
- Related content sections (Gallery, Related Looks) fetch posts by artist name
- All image grid cards and related content link to /posts/[id]
- Zero references to deprecated useImageById, useInfiniteFilteredImages, or useRelatedImagesByAccount in active code paths

## Task Commits

Each task was committed atomically:

1. **Task 1: Replace /images grid page with post-based data fetching** - `972147d` (feat)
2. **Task 2: Replace /images/[id] detail with post detail redirect/render** - `b211c5e` (feat)
3. **Task 3: Replace RelatedImages with post-based related content** - `a420e82` (feat)

## Files Created/Modified

**Task 1: /images grid (3 files)**
- `packages/web/app/images/page.tsx` - Removed SSR fetch, now CSR-only
- `packages/web/app/images/ImagesClient.tsx` - Replaced useInfiniteFilteredImages with useInfinitePosts (REST API)
- `packages/web/app/images/ImageCard.tsx` - Accepts Post type, links to /posts/[id], displays spot count badge

**Task 2: /images/[id] detail (3 files)**
- `packages/web/app/images/[id]/page.tsx` - Permanent redirect to /posts/[id]
- `packages/web/lib/components/detail/ImageDetailPage.tsx` - Replaced useImageById with usePostById, renders PostDetailContent
- `packages/web/lib/components/detail/ImageDetailModal.tsx` - Replaced useImageById with usePostById, removed ImageCanvas/normalizeItem dependencies

**Task 3: Related content (5 files)**
- `packages/web/lib/components/detail/PostDetailContent.tsx` - Replaced useRelatedImagesByAccount with useInfinitePosts filtered by artistName
- `packages/web/lib/components/detail/GallerySection.tsx` - Links to /posts/[id] instead of /images/[id]
- `packages/web/lib/components/detail/RelatedLooksSection.tsx` - Links to /posts/[id] instead of /images/[id]
- `packages/web/lib/components/detail/RelatedImages.tsx` - Replaced useRelatedImagesByAccount with useInfinitePosts, updated prop name to currentPostId
- `packages/web/lib/components/detail/ImageDetailContent.tsx` - Updated RelatedImages prop name for consistency (legacy code path)

## Decisions Made

1. **CSR-only for /images page**: Removed SSR initial posts fetch to simplify type handling. The useInfinitePosts hook returns Post[] (REST API type) while fetchLatestPostsServer returns PostRow[] (Supabase type). CSR-only eliminates the type mismatch and is acceptable since the page loads quickly via REST API.

2. **Redirect instead of dual implementation**: /images/[id] now permanently redirects to /posts/[id] instead of maintaining separate implementations. This eliminates code duplication and ensures users always see the post detail page with full spot/solution data.

3. **Prop name update**: Changed RelatedImages prop from `currentImageId` to `currentPostId` for clarity, reflecting the migration to post-based data.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

**Type mismatch between PostRow and Post**: Initial attempt to use SSR-fetched PostRow[] as initialPosts for useInfinitePosts hook failed because hook returns Post[] (REST API type). Resolved by switching to CSR-only approach, removing the SSR fetch entirely.

## Next Phase Readiness

✅ **Migration complete**: All /images routes now use posts table data via REST API. Old image table queries (useImageById, useInfiniteFilteredImages, useRelatedImagesByAccount) are no longer referenced in active code paths.

⚠️ **Legacy components remain**: ImageDetailContent, ImageCanvas, and useNormalizedItems still exist but are unused (no imports). These can be removed in a cleanup task.

✅ **Build verification**: `yarn build` passes with no type errors. All routes compile successfully.

---
*Quick Task: 025*
*Completed: 2026-02-12*
