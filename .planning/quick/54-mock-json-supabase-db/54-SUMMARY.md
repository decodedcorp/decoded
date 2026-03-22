---
phase: quick-054
plan: 01
subsystem: main-page
tags: [supabase, server-component, data-fetching]
dependency_graph:
  requires: [main-page.server.ts]
  provides: [async-page-with-db-queries]
  affects: [packages/web/app/page.tsx]
tech_stack:
  patterns: [async-server-component, promise-all-parallel-fetch, dynamic-import-fallback]
key_files:
  modified:
    - packages/web/app/page.tsx
decisions:
  - Used dynamic import for mock fallback to avoid bundling mock JSON when DB data available
  - Used repeating aspectRatio pattern array for masonry height variation since DB posts lack this metadata
metrics:
  duration: 78s
  completed: "2026-03-05T11:39:14Z"
  tasks_completed: 1
  tasks_total: 1
---

# Quick Task 054: Replace Mock JSON with Supabase DB Queries

Async server component fetching real posts from Supabase for hero and grid sections, with dynamic-import mock fallback.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Replace hero + grid mock imports with Supabase queries | 31bf1cf | packages/web/app/page.tsx |

## Changes Made

### Task 1: Replace hero + grid mock imports with Supabase queries

- Converted `Home()` to `async function Home()` (Server Component)
- Added `fetchFeaturedPostServer` and `fetchWeeklyBestPostsServer` imports from `main-page.server.ts`
- Removed static mock JSON imports for hero and grid data
- Added `Promise.all` parallel fetch for featured post and weekly best posts
- Mapped `PostData` to `MainHeroData` for hero section (artist name, R2 CDN image, post link)
- Mapped `PostData[]` to `GridItemData[]` for grid section with repeating aspectRatio pattern
- Added dynamic import fallback: if DB returns null/empty, mock JSON loads lazily
- PersonalizeBanner mock import left unchanged

## Deviations from Plan

None - plan executed exactly as written.

## Out-of-Scope Issues Found

- `packages/web/app/lab/texture-swap/page.tsx` has a pre-existing build error (`ssr: false` not allowed in Server Components with `next/dynamic`). Not related to this task.

## Verification

- TypeScript compilation: PASSED (no type errors in page.tsx)
- Build: pre-existing error in unrelated file (texture-swap); page.tsx itself compiles cleanly
