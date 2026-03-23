---
phase: 42-mutation-migration-cache-wiring
plan: "02"
subsystem: api
tags: [orval, tanstack-query, react-query, mutation, cache, generated-code, typescript, profile]

# Dependency graph
requires:
  - phase: 42-01
    provides: Mutation hooks migrated for comments/spots/solutions/posts

provides:
  - useUpdateProfile calls generated updateMyProfile (PATCH /api/v1/users/me) instead of inline Supabase auth.updateUser
  - rank: null as any hack eliminated — backend returns proper rank string
  - supabaseBrowserClient import removed from useProfile.ts
  - Zustand profileStore.setUserFromApi sync preserved in onSuccess
  - React Query cache setQueryData + invalidateQueries preserved in onSuccess

affects:
  - 42-03 (manual API file deletion — useProfile.ts no longer imports supabase client for mutations)
  - Any consumer of useUpdateProfile (profile edit forms)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Generated raw function (updateMyProfile) replaces inline Supabase auth wrapper in mutation hook"
    - "Type-safe setQueryData: updateMyProfile and useGetMyProfile both return UserResponse — no cast needed"

key-files:
  created: []
  modified:
    - packages/web/lib/hooks/useProfile.ts

key-decisions:
  - "updateMyProfile(data) called directly as mutationFn — the generated raw function takes BodyType<UpdateUserDto> which is compatible with UpdateUserDto"
  - "supabaseBrowserClient import removed entirely — no other hook in useProfile.ts used it (dashboard hooks use @/lib/supabase/queries/profile which imports its own client)"
  - "onSuccess block kept exactly as-is — setQueryData is now type-safe because both REST endpoint and GET hook return UserResponse"

patterns-established:
  - "Profile mutation now fully on REST path: PATCH /api/v1/users/me updates backend user table directly"

requirements-completed: [MIG-06]

# Metrics
duration: ~5min
completed: 2026-03-23
---

# Phase 42 Plan 02: Profile Mutation Migration Summary

**useUpdateProfile migrated to call generated updateMyProfile (PATCH /api/v1/users/me), eliminating the inline Supabase auth.updateUser wrapper and the rank: null as any type hack**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-03-23T14:49:46Z
- **Completed:** 2026-03-23T14:51:00Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments

- Replaced 42-line inline `updateMe` function (which called `supabaseBrowserClient.auth.updateUser`) with a single call to `updateMyProfile(data)` from the generated client
- Removed `supabaseBrowserClient` import from `useProfile.ts` — no longer needed for mutation
- Added `updateMyProfile` to the existing import block from `@/lib/api/generated/users/users`
- Eliminated the `rank: null as any` type hack — backend REST endpoint returns a proper `UserResponse` with a real `rank` string
- Preserved the entire `onSuccess` block unchanged: `setQueryData(profileKeys.me(), updatedUser)`, dynamic import of `useProfileStore.getState().setUserFromApi(updatedUser)`, and `invalidateQueries({ queryKey: profileKeys.me() })`
- TypeScript compiles cleanly with no errors

## Task Commits

1. **Task 1: Replace inline updateMe with generated updateMyProfile** - `eb4acbf8` (feat)

## Files Created/Modified

- `packages/web/lib/hooks/useProfile.ts` — `updateMe` function removed; `supabaseBrowserClient` import removed; `updateMyProfile` added to generated import; `mutationFn` updated

## Decisions Made

- **Direct call to raw function**: `updateMyProfile(data)` is called directly as `mutationFn`. The generated raw function signature accepts `BodyType<UpdateUserDto>` which is structurally compatible with `UpdateUserDto` — no wrapper needed.
- **setQueryData is now type-safe**: Previously `updateMe` returned a manually constructed `UserResponse` with `rank: null as any`. Now `updateMyProfile` returns a real `UserResponse` from the backend, making `setQueryData(profileKeys.me(), updatedUser)` fully type-safe.
- **supabaseBrowserClient removed**: Confirmed that no other hook in `useProfile.ts` directly imports `supabaseBrowserClient`. The profile dashboard hooks (`useProfileExtras`, `useSocialAccounts`, `useTryOnCount`) use `@/lib/supabase/queries/profile` which imports its own Supabase client internally.

## Deviations from Plan

None — plan executed exactly as written. The three edits (import update, updateMe removal, mutationFn update) were straightforward and TypeScript validated cleanly on first attempt.

## Self-Check: PASSED

- `packages/web/lib/hooks/useProfile.ts` — EXISTS, modified correctly
- Commit `eb4acbf8` — EXISTS
- `grep -c "supabaseBrowserClient"` — 0 (PASS)
- `grep "updateMyProfile"` — import + mutationFn (PASS)
- `grep "setUserFromApi"` — present in onSuccess (PASS)
- `bunx tsc --noEmit` — exits 0 (PASS)

---
*Phase: 42-mutation-migration-cache-wiring*
*Completed: 2026-03-23*
