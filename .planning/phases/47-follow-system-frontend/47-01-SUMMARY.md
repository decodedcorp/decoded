---
phase: 47-follow-system-frontend
plan: "01"
subsystem: ui
tags: [react, typescript, orval, openapi, profile, follow-system]

# Dependency graph
requires:
  - phase: 46-follow-system-backend
    provides: followers_count/following_count fields in Rust UserResponse DTO and database queries
provides:
  - OpenAPI spec updated with followers_count/following_count in UserResponse schema
  - Orval-generated TypeScript UserResponse type with follow count fields
  - FollowStats component with 0/0 defaults (not 1234/567)
  - ProfileClient wired to real follow counts from useMe()
  - PublicProfileClient wired to real follow counts from useUser() at both mobile and desktop layouts
affects: [48-follow-system-actions, profile-pages, public-profile]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "openapi.json manual edit via python3 -c for minified JSON files (not string-level edits)"
    - "snake_case field names preserved through Orval codegen (followers_count not followersCount)"

key-files:
  created: []
  modified:
    - packages/api-server/openapi.json
    - packages/web/lib/components/profile/FollowStats.tsx
    - packages/web/app/profile/ProfileClient.tsx
    - packages/web/app/profile/[userId]/PublicProfileClient.tsx

key-decisions:
  - "Use python3 -c to parse/modify minified openapi.json — string-level edits on single-line JSON are error-prone"
  - "UserResponse fields remain snake_case (followers_count) in generated TypeScript — Orval does not camelCase by default"
  - "ProfileClient uses userData?.followers_count ?? 0 (optional chaining) because userData can be undefined before load"
  - "PublicProfileClient uses userData.followers_count directly (non-null) because userData is guarded at line 189"

patterns-established:
  - "Option B openapi.json update: python3 json.load/dump with separators=(',', ':') for single-line output"

requirements-completed: [FLLW-04, FLLW-05]

# Metrics
duration: 4min
completed: 2026-03-26
---

# Phase 47 Plan 01: Follow System Frontend Summary

**OpenAPI spec updated with follow count fields, Orval types regenerated, and real follower/following counts wired into FollowStats on both my-profile and public-profile pages**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-03-26T14:57:53Z
- **Completed:** 2026-03-26T15:01:23Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- Updated `packages/api-server/openapi.json` with `followers_count` and `following_count` in UserResponse schema (required fields)
- Regenerated TypeScript types via Orval — `UserResponse` now includes `followers_count: number` and `following_count: number`
- Changed `FollowStats` default values from `1234`/`567` to `0`/`0`
- `ProfileClient` now passes `userData?.followers_count ?? 0` and `userData?.following_count ?? 0` from `useMe()`
- `PublicProfileClient` passes `userData.followers_count` and `userData.following_count` at both mobile (~line 257) and desktop (~line 313) layouts

## Task Commits

Each task was committed atomically:

1. **Task 1: Update OpenAPI spec and regenerate types (FLLW-04)** - `c8758fbc` (feat)
2. **Task 2: Wire real follow data into FollowStats (FLLW-05)** - `e93359fa` (feat)

## Files Created/Modified

- `packages/api-server/openapi.json` - Added `followers_count`/`following_count` to UserResponse schema and required array
- `packages/web/lib/components/profile/FollowStats.tsx` - Changed default values from 1234/567 to 0/0
- `packages/web/app/profile/ProfileClient.tsx` - Wired real follow counts from useMe() hook
- `packages/web/app/profile/[userId]/PublicProfileClient.tsx` - Wired real follow counts at both mobile and desktop FollowStats instances

## Decisions Made

- Used `python3 -c` with `json.load`/`json.dump` to modify the minified single-line `openapi.json` — direct string edits on minified JSON are fragile
- Orval preserves snake_case field names from the OpenAPI spec — no camelCase conversion; TypeScript fields are `followers_count`/`following_count`
- `ProfileClient` uses optional chaining (`userData?.followers_count ?? 0`) since `userData` can be undefined before data loads
- `PublicProfileClient` uses direct access (`userData.followers_count`) since `userData` is guarded non-null past the early-return check at line 189

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed TDZ (Temporal Dead Zone) error in ProfileClient.tsx**
- **Found during:** Task 2 (Wire real follow data into FollowStats)
- **Issue:** `isError` and `error` constants were declared with `const` at lines 272-273, but used in a `useEffect` closure at line 263 — TypeScript error TS2448 "Block-scoped variable used before its declaration"
- **Fix:** Moved `isLoading`, `isError`, and `error` const declarations to before the `useEffect` that references them
- **Files modified:** `packages/web/app/profile/ProfileClient.tsx`
- **Verification:** `bun run typecheck` passes with zero errors
- **Committed in:** `e93359fa` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - Bug)
**Impact on plan:** Pre-existing bug in file touched by Task 2. Fix was necessary for typecheck to pass. No scope creep.

## Issues Encountered

- `bun run generate:api` initially failed with "orval: command not found" — worktree node_modules not populated. Ran `bun install` at repo root to install dependencies, then codegen succeeded.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Follow system frontend data flow is complete: backend counts → OpenAPI spec → generated types → UI components
- Both profile pages now display real follower/following counts from the API
- Ready for follow/unfollow action buttons (Phase 48)

---
*Phase: 47-follow-system-frontend*
*Completed: 2026-03-26*
