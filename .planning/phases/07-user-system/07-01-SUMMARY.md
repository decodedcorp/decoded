---
phase: 07-user-system
plan: "01"
subsystem: auth
tags: [authStore, oauth, google, supabase, profile, react-query]

requires:
  - phase: v4-06-screen-specs-creation-ai
    provides: "Screen spec format and patterns established (EARS, mobile-first, 200-line limit, NOT-IMPL tagging)"
provides:
  - "SCR-USER-01: Login screen spec — Google OAuth, DomeGallery background, authStore state machine, guest login"
  - "SCR-USER-02: Profile screen spec — real/mock data inventory, ProfileEditModal, 4 activity tabs, API-error-driven auth"
  - "SCR-USER-03: Earnings stub spec — NOT-IMPL documentation with StatsCards alert as only reference"
affects:
  - v4-08-next-version-draft
  - v4-09-cleanup

tech-stack:
  added: []
  patterns:
    - "selectIsAuthenticated (!!user || isGuest) vs selectIsLoggedIn (!!user) — documented distinction"
    - "API-error-driven auth pattern: no middleware on /profile, 401 → error component (not login redirect)"
    - "Real vs mock data inventory table as spec section — REAL/MOCK/NOT-IMPL tags per row"

key-files:
  created:
    - specs/screens/user/SCR-USER-01-login.md
    - specs/screens/user/SCR-USER-02-profile.md
    - specs/screens/user/SCR-USER-03-earnings.md

key-decisions:
  - "Middleware only protects /admin/:path* — /login and /profile have no route-level auth guard"
  - "Profile auth is API-response-driven: useMe() error → ProfileError component, not redirect to /login"
  - "StatsCards shows 3 cards (Posts/Solutions/Points), not 4 — no Spots stat card"
  - "SCR-USER-03 is a minimal stub (60 lines) — no design or flow to document for NOT-IMPL screen"

patterns-established:
  - "NOT-IMPL stub spec: Route N/A, 50-80 lines, lists only what does exist + requirement tags"

duration: 22min
completed: 2026-02-20
---

# Phase 7 Plan 1: User System Screen Specs Summary

**Three screen specs for the User System bundle: Google OAuth login with DomeGallery background and authStore state machine (selectIsAuthenticated vs selectIsLoggedIn), profile page with explicit real/mock data inventory (user info real, all activity tabs mock), and earnings NOT-IMPL stub documenting only the StatsCards alert.**

## Performance

- **Duration:** ~22 min
- **Started:** 2026-02-20T00:00Z
- **Completed:** 2026-02-20T00:22Z
- **Tasks:** 2
- **Files created:** 3

## Accomplishments

- SCR-USER-01 documents the Google OAuth flow (Kakao/Apple NOT-IMPL), DomeGallery animated background, authStore state transitions with key selector distinction (`selectIsAuthenticated` vs `selectIsLoggedIn`), and guest login — all paths verified against filesystem
- SCR-USER-02 provides explicit REAL/MOCK inventory for every data section: user info and stats are real API data; badges, rankings, follow counts, and all 4 activity tab contents are mock arrays in component files
- SCR-USER-03 correctly documents that no earnings screen, route, or API exists — only a `alert()` call in StatsCards

## Task Commits

1. **Task 1: SCR-USER-01 login screen spec** — `12fd989` (docs)
2. **Task 2: SCR-USER-02 profile + SCR-USER-03 earnings specs** — `0c206a3` (docs)

## Files Created

- `specs/screens/user/SCR-USER-01-login.md` — Login spec: Google OAuth flow, authStore selectors, DomeGallery, guest login, 138 lines
- `specs/screens/user/SCR-USER-02-profile.md` — Profile spec: real/mock inventory, ProfileEditModal, 4 activity tabs, auth pattern, 157 lines
- `specs/screens/user/SCR-USER-03-earnings.md` — Earnings stub: NOT-IMPL, StatsCards alert reference, 60 lines

## Decisions Made

- Middleware only protects `/admin/:path*` — confirmed from authStore code. Neither `/login` nor `/profile` has a route-level guard. `/profile` uses API-error-driven auth (any fetch error → ProfileError component, no redirect to `/login`).
- StatsCards renders 3 cards (Posts, Solutions, Points) — not 4. Posts card taps to alert too (not just Points). Both alerts documented with exact Korean text from source.
- `BadgeModalMode` is `"single" | "all" | null` — not `"closed" | "detail" | "list"` as stated in plan. Documented correctly from source.
- `isEditModalOpen` is local `useState` in ProfileClient, not in profileStore. profileStore only holds `badgeModalMode` and `selectedBadge`.

## Deviations from Plan

None — plan executed exactly as written. One minor correction: plan listed `BadgeModalMode` as `"closed" | "detail" | "list"` but actual code uses `"single" | "all" | null` — corrected in spec from source code inspection.

## Issues Encountered

None.

## Next Phase Readiness

- All User System screen specs complete (SCR-USER-01 through SCR-USER-03)
- v4-07 phase complete — ready for v4-08 (Next Version Draft)
- Key auth patterns documented for any future auth work: selectIsAuthenticated vs selectIsLoggedIn selector distinction, API-error-driven profile auth

---
*Phase: 07-user-system*
*Completed: 2026-02-20*
