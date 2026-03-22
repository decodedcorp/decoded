---
phase: m8-01-event-tracking-infrastructure
plan: 04
subsystem: ui
tags: [react, profile, cleanup, dead-code]

# Dependency graph
requires: []
provides:
  - "DataSourcesCard unimplemented UI removed from profile page"
  - "ProfileClient.tsx cleaned of useSocialAccounts hook call"
  - "CLEAN-01 requirement satisfied"
affects: [profile]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Dead code removal: delete component file + barrel export + all call sites atomically"

key-files:
  created: []
  modified:
    - packages/web/app/profile/ProfileClient.tsx
    - packages/web/lib/components/profile/index.ts
  deleted:
    - packages/web/lib/components/profile/DataSourcesCard.tsx

key-decisions:
  - "useSocialAccounts hook definition in useProfile.ts is retained — only ProfileClient.tsx call site removed, hook may be reused elsewhere"
  - "DB queries for social accounts (queries/profile.ts) are retained — table exists and data may be used by future features"

patterns-established:
  - "Unimplemented feature UI: remove component + barrel export + all JSX call sites; keep underlying data hooks and DB queries"

requirements-completed: [CLEAN-01]

# Metrics
duration: 2min
completed: 2026-03-12
---

# Phase m8-01 Plan 04: DataSourcesCard Removal Summary

**Deleted unimplemented Instagram/Pinterest social accounts UI (DataSourcesCard) from profile page, removing component file, barrel export, hook call, and both mobile/desktop JSX usages**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-12T09:17:47Z
- **Completed:** 2026-03-12T09:20:10Z
- **Tasks:** 1
- **Files modified:** 3 (1 deleted, 2 modified)

## Accomplishments
- Deleted `DataSourcesCard.tsx` (91 lines of unimplemented Instagram/Pinterest UI)
- Removed `DataSourcesCard` export from `profile/index.ts` barrel
- Removed `DataSourcesCard` import, `useSocialAccounts` hook call, and both JSX render sites (mobile + desktop) from `ProfileClient.tsx`
- TypeScript compiles cleanly with no errors after removal

## Task Commits

Each task was committed atomically:

1. **Task 1: DataSourcesCard 파일 삭제 + 참조 정리** - `0a550823` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `packages/web/lib/components/profile/DataSourcesCard.tsx` - DELETED (91 lines removed)
- `packages/web/lib/components/profile/index.ts` - Removed `export { DataSourcesCard }` line
- `packages/web/app/profile/ProfileClient.tsx` - Removed DataSourcesCard import, useSocialAccounts import, hook call, and 2 JSX usages

## Decisions Made
- Kept `useSocialAccounts` hook definition in `useProfile.ts` — per plan decision, hook may be needed elsewhere
- Kept Supabase DB queries for social accounts — table exists in DB, data layer should remain

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Profile page renders cleanly without unimplemented feature UI
- CLEAN-01 requirement satisfied
- Phase m8-01 cleanup tasks complete

---
*Phase: m8-01-event-tracking-infrastructure*
*Completed: 2026-03-12*
