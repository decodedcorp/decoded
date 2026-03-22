---
phase: quick-051
plan: 01
subsystem: database
tags: [supabase, react-query, profile, useQuery]

requires:
  - phase: v1.1
    provides: Supabase client and query patterns
provides:
  - Profile Supabase queries (fetchPostsByUserProfile, fetchSpotsByUser, fetchSolutionsByUser)
  - Real DB data in PostsGrid, SpotsList, SolutionsList, ProfileBio components
affects: [profile]

tech-stack:
  added: []
  patterns: [profile-scoped Supabase queries with useQuery integration]

key-files:
  created:
    - packages/web/lib/supabase/queries/profile.ts
  modified:
    - packages/web/lib/components/profile/PostsGrid.tsx
    - packages/web/lib/components/profile/SpotsList.tsx
    - packages/web/lib/components/profile/SolutionsList.tsx
    - packages/web/lib/components/profile/ProfileBio.tsx
    - packages/web/app/profile/ProfileClient.tsx

key-decisions:
  - "Kept userId as optional prop for backward compatibility -- components work with either passed data or self-fetching"
  - "Removed unused PostsGrid/SpotsList/SolutionsList imports from ProfileClient since they are not rendered there"

patterns-established:
  - "Profile query pattern: useQuery with ['profile', entity, userId] key and enabled: !!userId"

requirements-completed: [QUICK-051]

duration: 2min
completed: 2026-03-05
---

# Quick Task 051: Profile DB Wiring Summary

**Replace 4 mock data arrays in profile components with real Supabase queries using useQuery**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-05T11:27:01Z
- **Completed:** 2026-03-05T11:29:17Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Created profile.ts query layer with 3 user-scoped Supabase queries
- Wired PostsGrid, SpotsList, SolutionsList to fetch real data via useQuery
- ProfileBio now shows real bio from useMe() data instead of mock text
- All 4 mock data arrays removed (MOCK_POSTS, MOCK_SPOTS, MOCK_SOLUTIONS, MOCK_SOCIAL_LINKS)

## Task Commits

1. **Task 1: Create Supabase profile queries and wire PostsGrid + SpotsList + SolutionsList** - `ad9f40f` (feat)
2. **Task 2: Wire ProfileBio with real data and connect userId in ProfileClient** - `8d86dbf` (feat)

## Files Created/Modified
- `packages/web/lib/supabase/queries/profile.ts` - New query layer with fetchPostsByUserProfile, fetchSpotsByUser, fetchSolutionsByUser
- `packages/web/lib/components/profile/PostsGrid.tsx` - Replaced mock with useQuery, added loading/empty states
- `packages/web/lib/components/profile/SpotsList.tsx` - Replaced mock with useQuery, added loading/empty states
- `packages/web/lib/components/profile/SolutionsList.tsx` - Replaced mock with useQuery, added formatPrice helper
- `packages/web/lib/components/profile/ProfileBio.tsx` - Removed mock bio/links, shows "No bio yet" placeholder
- `packages/web/app/profile/ProfileClient.tsx` - Passes userData.bio to ProfileBio, removed unused imports

## Decisions Made
- Kept userId as optional prop so components can work with either passed data or self-fetching via useQuery
- Used subcategory_id as spot label (will show UUID until subcategory name join is added)
- Removed unused PostsGrid/SpotsList/SolutionsList imports from ProfileClient since renderTabContent uses ActivityItemCard instead

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

Pre-existing TypeScript error in collection/index.ts referencing deleted StudioHUD module (unrelated to this task).

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Profile components ready to display real data when userId is provided
- PostsGrid/SpotsList/SolutionsList can be rendered in ProfileClient when the tab system switches from ActivityItemCard to dedicated components

## Self-Check: PASSED

All 6 files verified present. Both commits (ad9f40f, 8d86dbf) verified in git log.

---
*Quick Task: 051-db*
*Completed: 2026-03-05*
