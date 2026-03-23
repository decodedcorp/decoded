---
phase: 41-read-hook-migration
plan: "03"
subsystem: hooks/api
tags: [orval, codegen, react-query, migration, users, posts]
dependency_graph:
  requires:
    - packages/web/lib/api/generated/users/users.ts
    - packages/web/lib/api/generated/posts/posts.ts
    - packages/web/lib/api/generated/models/index.ts
  provides:
    - useMe migrated to useGetMyProfile generated hook
    - useUserStats migrated to useGetMyStats generated hook
    - useUser migrated to useGetUserProfile generated hook
    - useUserActivities uses getMyActivities raw function for infinite query
    - useInfinitePosts in usePosts.ts uses generated listPosts function
    - useImages.ts imports listPosts/getPost from generated (fetchPosts/fetchPostDetail removed)
    - users.ts deleted entirely
    - posts.ts retains only mutations/upload/server/magazine functions
  affects:
    - packages/web/lib/hooks/useProfile.ts
    - packages/web/lib/hooks/usePosts.ts
    - packages/web/lib/hooks/useImages.ts
    - packages/web/lib/api/users.ts (deleted)
    - packages/web/lib/api/posts.ts
    - packages/web/lib/api/index.ts
    - packages/web/lib/stores/profileStore.ts
    - packages/web/lib/components/profile/ActivityItemCard.tsx
    - packages/web/lib/components/main/DecodedSolutionsSection.tsx
tech_stack:
  added: []
  patterns:
    - useGetMyProfile/useGetMyStats/useGetUserProfile replace manual useQuery + fetchMe/fetchUserStats/fetchUserById
    - getMyActivities raw function used in useInfiniteQuery queryFn (generated hook is not infinite)
    - listPosts raw function used in useInfiniteQuery queryFn in usePosts.ts
    - updateMe inlined into useProfile.ts from deleted users.ts (Phase 42 will replace with generated mutation)
    - profileStore imports UserResponse from generated/models (broader nullable field handling)
    - ActivityItemCard uses generated PaginatedResponseUserActivityItemDataItem (title is string|null|undefined)
key_files:
  created: []
  modified:
    - packages/web/lib/hooks/useProfile.ts
    - packages/web/lib/hooks/usePosts.ts
    - packages/web/lib/hooks/useImages.ts
    - packages/web/lib/api/posts.ts
    - packages/web/lib/api/index.ts
    - packages/web/lib/stores/profileStore.ts
    - packages/web/lib/components/profile/ActivityItemCard.tsx
    - packages/web/lib/components/main/DecodedSolutionsSection.tsx
  deleted:
    - packages/web/lib/api/users.ts
decisions:
  - "updateMe inlined into useProfile.ts instead of keeping users.ts alive — cleanest deletion boundary; Phase 42 will replace with generated useUpdateMyProfile mutation"
  - "useUserActivities uses getMyActivities raw function in useInfiniteQuery — generated useGetMyActivities is regular useQuery (not infinite); infinite pagination requires manual composition"
  - "useInfinitePosts in usePosts.ts uses listPosts raw function — infinite query requires manual queryFn, not the generated hook"
  - "useImages.ts useInfinitePosts (Supabase-direct) NOT migrated — it uses different data shape and is out of scope for REST API migration"
  - "usePostMagazine in useImages.ts unchanged — fetchPostMagazine has no generated equivalent (post-magazines endpoint not in OpenAPI spec)"
  - "profileStore imports UserResponse from generated/models — avatar_url is string|null|undefined in generated vs string|null in manual; store already uses || undefined fallback"
  - "ActivityItemCard uses PaginatedResponseUserActivityItemDataItem — generated title is string|null|undefined vs string|undefined in manual type"
  - "DecodedSolutionsSection uses getPost cast via (r as PromiseFulfilledResult<unknown>).value as PostDetailResponse — generated and manual PostDetailResponse are structurally equivalent in practice"
metrics:
  duration_seconds: 382
  completed_date: "2026-03-23"
  tasks_completed: 2
  tasks_total: 2
  files_modified: 8
  files_deleted: 1
---

# Phase 41 Plan 03: Read Hook Migration (Users, Posts) Summary

**One-liner:** Users domain migrated from Supabase auth metadata to backend REST via generated hooks; posts read hooks consolidated into generated listPosts/getPost; users.ts deleted; posts.ts retains only mutations/upload/server/magazine functions.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Migrate user hooks in useProfile.ts and delete users.ts | dc826e33 | useProfile.ts, users.ts (del), index.ts, profileStore.ts, ActivityItemCard.tsx |
| 2 | Migrate posts read hooks in usePosts.ts and useImages.ts, clean up posts.ts | 267f9497 | usePosts.ts, useImages.ts, posts.ts, DecodedSolutionsSection.tsx |

## What Was Built

**useProfile.ts (user hooks migration):**
- `useMe` now wraps `useGetMyProfile` (was `useQuery` + `fetchMe` — Supabase auth metadata → backend REST)
- `useUserStats` now wraps `useGetMyStats` (was `useQuery` + `fetchUserStats` — Supabase count queries → backend REST)
- `useUser` now wraps `useGetUserProfile` (was `useQuery` + `fetchUserById` — stub → backend REST)
- `useUserActivities` now uses `getMyActivities` raw function in `useInfiniteQuery` (generated hook is regular `useQuery`, not infinite)
- All hooks preserve original cache keys via `profileKeys.me()`, `profileKeys.stats()`, `profileKeys.activities()`, `profileKeys.user()`
- `updateMe` function inlined from deleted `users.ts` — mutation path for Phase 42
- Old imports `{ fetchMe, updateMe, fetchUserStats, fetchUserActivities, fetchUserById } from "@/lib/api/users"` removed

**usePosts.ts migration:**
- `useInfinitePosts` now uses `listPosts` from generated (was `fetchPosts` from manual posts.ts)
- Cache key, shape (`PostsPage`), and `getNextPageParam` logic preserved
- `useUpdatePost`, `useDeletePost` unchanged — still import from `@/lib/api/posts`

**useImages.ts migration:**
- `fetchPosts` and `fetchPostDetail` imports removed from `@/lib/api/posts`
- `listPosts` and `getPost` imported from `@/lib/api/generated/posts/posts`
- `usePostMagazine` unchanged — `fetchPostMagazine` has no generated equivalent
- Supabase-direct `useInfinitePosts` NOT migrated — different data shape, out of scope

**posts.ts cleanup:**
- `fetchPosts` removed — replaced by generated `listPosts`
- `fetchPostDetail` removed — replaced by generated `getPost`
- `buildPostsQueryString` kept (used by `fetchPostsServer`)
- All upload, create, update, delete, server, and magazine functions preserved

**Deleted:**
- `lib/api/users.ts` — all read functions replaced by generated hooks; `updateMe` moved inline

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] profileStore.ts: UserResponse type mismatch after hook migration**
- **Found during:** Task 1 (TypeScript compile check)
- **Issue:** `profileStore.ts` imported `UserResponse` from `@/lib/api/types` (manual: `avatar_url: string | null`). After migration, `useMe` returns generated `UserResponse` (`avatar_url?: string | null | undefined`). TS2345 in `ProfileClient.tsx` line 233 (`setUserFromApi(userData)`).
- **Fix:** Updated `profileStore.ts` to import `UserResponse` from `@/lib/api/generated/models`. The store's `setUserFromApi` already uses `|| undefined` fallback so runtime behavior is identical.
- **Files modified:** `packages/web/lib/stores/profileStore.ts`
- **Commit:** dc826e33

**2. [Rule 1 - Bug] ActivityItemCard.tsx: activity item title type mismatch**
- **Found during:** Task 1 (TypeScript compile check)
- **Issue:** `ProfileClient.tsx` line 306 passes `activityItems` (from `useUserActivities` infinite query) to `ActivityItemCard`. Generated `PaginatedResponseUserActivityItemDataItem.title` is `string | null | undefined` but manual `UserActivityItem.title` was `string | undefined`. TS2322 on null.
- **Fix:** Updated `ActivityItemCard.tsx` to accept `PaginatedResponseUserActivityItemDataItem` from generated models. Also switched `UserActivityType` import to generated (const object with same `"post" | "spot" | "solution"` values).
- **Files modified:** `packages/web/lib/components/profile/ActivityItemCard.tsx`
- **Commit:** dc826e33

**3. [Rule 1 - Bug] DecodedSolutionsSection.tsx: fetchPostDetail removed from posts.ts**
- **Found during:** Task 2 (TypeScript compile check)
- **Issue:** `DecodedSolutionsSection.tsx` imported `fetchPostDetail` directly from `@/lib/api/posts`. After removing `fetchPostDetail` from posts.ts, TS2305 error.
- **Fix:** Replaced `fetchPostDetail` with generated `getPost`. Used `(r as PromiseFulfilledResult<unknown>).value as PostDetailResponse` cast pattern to bridge type gap between generated and manual `PostDetailResponse`.
- **Files modified:** `packages/web/lib/components/main/DecodedSolutionsSection.tsx`
- **Commit:** 267f9497

## Verification

- `bunx tsc --noEmit` exits 0 after both tasks
- No remaining imports of `fetchMe`, `fetchUserStats`, `fetchUserById`, `fetchUserActivities` in app or lib
- No remaining imports of `fetchPosts` or `fetchPostDetail` in app or lib
- `users.ts` deleted, confirmed not referenced anywhere
- `usePostMagazine` unchanged, still imports `fetchPostMagazine` from manual `posts.ts`
- All mutation hooks unchanged

## Self-Check: PASSED

Files exist:
- `packages/web/lib/hooks/useProfile.ts` — FOUND
- `packages/web/lib/hooks/usePosts.ts` — FOUND
- `packages/web/lib/hooks/useImages.ts` — FOUND
- `packages/web/lib/api/posts.ts` — FOUND
- `packages/web/lib/api/index.ts` — FOUND
- `packages/web/lib/stores/profileStore.ts` — FOUND
- `packages/web/lib/components/profile/ActivityItemCard.tsx` — FOUND
- `packages/web/lib/components/main/DecodedSolutionsSection.tsx` — FOUND
- `packages/web/lib/api/users.ts` — NOT EXISTS (correctly deleted)

Commits verified:
- dc826e33 — FOUND
- 267f9497 — FOUND
