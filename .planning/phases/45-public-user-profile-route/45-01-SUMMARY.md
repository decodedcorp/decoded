---
phase: 45-public-user-profile-route
plan: 01
subsystem: ui
tags: [next.js, react-query, zustand, profile, routing, public-profile]

# Dependency graph
requires:
  - phase: 44-auth-guard
    provides: proxy.ts auth middleware (public route intentionally excluded)
  - phase: 41-01
    provides: useUser(userId) hook for fetching public user data
provides:
  - /profile/[userId] Server Component page with generateMetadata
  - PublicProfileClient with explicit data from useUser(userId), no Zustand store pollution
  - Self-redirect when viewer is the profile owner
  - 404 UserNotFound UI for non-existent userId
  - Public profile visibility gating (hides Ink, ActivityTabs, SavedGrid, edit, settings)
affects:
  - 46-follow-system (follow/unfollow button slot ready in public profile header)
  - social features (public profile route is prerequisite for linking users)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Server Component async params pattern (Promise<{ userId }>) from posts/[id]/page.tsx
    - Standalone public client component (NOT extending ProfileClient) to prevent Zustand profileStore pollution
    - Inline stats grid with explicit UserResponse data instead of store-dependent StatsCards/ArchiveStats
    - Inline badge/ranking placeholders instead of store-reading BadgeGrid/RankingList components

key-files:
  created:
    - packages/web/app/profile/[userId]/page.tsx
    - packages/web/app/profile/[userId]/PublicProfileClient.tsx
  modified: []

key-decisions:
  - "PublicProfileClient is standalone (not extending ProfileClient) — prevents Zustand profileStore being polluted with another user's data"
  - "ProfileHeaderCard (design-system) used instead of ProfileHeader (component) — design-system component accepts explicit props, profile component reads from store"
  - "BadgeGrid and RankingList replaced with inline placeholders — both components read from profileStore which would show logged-in user's data"
  - "FollowStats rendered with followers=0 following=0 — real follow data requires Phase 46 follow system API"
  - "useProfileExtras(userId) works for any userId (no auth) — StyleDNACard can show target user's style DNA"

patterns-established:
  - "Public profile pattern: use explicit prop-driven components only, avoid any component that reads from Zustand profileStore"
  - "Self-redirect guard: useMe() + useEffect comparing me.id === userId → router.replace('/profile')"

requirements-completed: [ROUTE-01, ROUTE-02]

# Metrics
duration: 10min
completed: 2026-03-26
---

# Phase 45 Plan 01: Public User Profile Route Summary

**`/profile/[userId]` route with explicit-data rendering via useUser(userId), self-redirect guard, 404 UI, and full private-section gating (no profileStore pollution)**

## Performance

- **Duration:** ~10 min
- **Started:** 2026-03-26T13:50:00Z
- **Completed:** 2026-03-26T13:56:17Z
- **Tasks:** 2
- **Files modified:** 2 (both new)

## Accomplishments
- Created `/profile/[userId]` Server Component with generateMetadata and async params pattern
- Built PublicProfileClient that fetches only from useUser(userId) — no Zustand profileStore involvement
- Implemented self-redirect: when logged-in user views their own userId, route.replace("/profile")
- Implemented 404 handling with UserNotFound UI showing "이 유저를 찾을 수 없습니다" and home link
- Inline stats grid (total_points, rank) replaces store-dependent StatsCards and ArchiveStats
- Badge and ranking placeholder sections ("No badges yet" / "Not ranked yet") prevent store pollution
- All private items hidden: InkEconomyCard, ActivityTabs, SavedGrid, TriesGrid, Settings gear, edit button

## Task Commits

Each task was committed atomically:

1. **Task 1: Create page.tsx Server Component for /profile/[userId]** - `74ab210d` (feat)
2. **Task 2: Create PublicProfileClient with visibility gating, placeholders, and edge case handling** - `d93516bb` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `packages/web/app/profile/[userId]/page.tsx` - Server Component with generateMetadata and async params, renders PublicProfileClient
- `packages/web/app/profile/[userId]/PublicProfileClient.tsx` - Client Component with useUser(userId) data fetching, self-redirect, 404/error handling, public-only visibility

## Decisions Made
- PublicProfileClient is a standalone component (not extending ProfileClient) to prevent Zustand profileStore being polluted with another user's data
- ProfileHeaderCard (design-system, explicit props) used instead of ProfileHeader (reads profileStore)
- BadgeGrid and RankingList replaced by inline placeholders since both components read from profileStore
- FollowStats rendered with followers=0 following=0 — real follow counts come in Phase 46+
- useProfileExtras(userId) works for any userId without auth, so StyleDNACard shows real target user data

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

TypeScript typecheck via `bunx tsc --noEmit` shows pre-existing "Cannot find module" errors for lucide-react, next/link, next/navigation, and axios in the worktree environment (same errors appear in existing ProfileClient.tsx — missing node_modules in worktree). No logic-level type errors were introduced.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- `/profile/[userId]` public route is ready for use
- Follow button slot is available in ProfileHeaderCard's `actions` prop — Phase 46 can add follow/unfollow CTA
- FollowStats with 0/0 defaults is wired up — Phase 46 replaces with real follower/following counts
- BadgeGrid placeholder can be replaced with a public badge API once available

---
*Phase: 45-public-user-profile-route*
*Completed: 2026-03-26*
