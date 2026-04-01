---
phase: 52-editorial-filter-fix
plan: 01
subsystem: api
tags: [supabase, react-query, editorial, filtering, useInfinitePosts]

# Dependency graph
requires:
  - phase: 51-data-validation
    provides: "Confirmed 169 editorial posts exist with post_magazine_id"
provides:
  - "hasMagazine Supabase filter active in useInfinitePosts"
  - "Editorial page shows only magazine-linked posts"
affects: [52-02, 53-detail-migration]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Conditional Supabase .not() filter with boolean guard"

key-files:
  created:
    - packages/web/tests/hasMagazine-filter.test.ts
  modified:
    - packages/web/lib/hooks/useImages.ts

key-decisions:
  - "Used if (hasMagazine) guard (truthy check) rather than strict === true, so undefined defaults to no-filter"

patterns-established:
  - "Supabase conditional filter: if (flag) { query = query.not(...) } pattern for optional query narrowing"

requirements-completed: [FILT-01]

# Metrics
duration: 3min
completed: 2026-04-01
---

# Phase 52 Plan 01: Activate hasMagazine Supabase Filter Summary

**Activated .not("post_magazine_id", "is", null) conditional filter in useInfinitePosts so /editorial shows only magazine-linked posts (~169) while /explore remains unfiltered (~603)**

## Performance

- **Duration:** 3 min
- **Started:** 2026-04-01T10:12:45Z
- **Completed:** 2026-04-01T10:15:23Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments
- Replaced placeholder comment with working hasMagazine filter in useInfinitePosts
- TDD: 3 test cases covering hasMagazine=true, false, and undefined scenarios
- TypeScript compilation verified (no new errors introduced)

## Task Commits

Each task was committed atomically:

1. **Task 1: Activate hasMagazine Supabase filter** (TDD)
   - `9fc8ca1d` (test: add failing test for hasMagazine filter — RED)
   - `b3f735dd` (feat: activate hasMagazine filter — GREEN)

## Files Created/Modified
- `packages/web/tests/hasMagazine-filter.test.ts` - Unit tests verifying hasMagazine filter behavior with mocked Supabase client
- `packages/web/lib/hooks/useImages.ts` - Replaced comment on line 204 with `if (hasMagazine) { query = query.not("post_magazine_id", "is", null); }`

## Decisions Made
- Used truthy check `if (hasMagazine)` rather than strict `=== true` — consistent with how ExploreClient passes `hasMagazine: hasMagazine ?? false` (undefined coerces to false)
- No refactor phase needed — the 3-line change is minimal and well-placed in the existing filter chain

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Pre-existing TypeScript errors in profile components (followers_count, getMySaved) and generated API types are unrelated to this change — out of scope

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Plan 02 (verification) can proceed — filter is active
- Manual verification: /editorial should show ~169 posts, /explore should show ~603 posts (unchanged)
- Phase 53 (detail-migration) dependency on post_magazine_id is now testable end-to-end

## Self-Check: PASSED

- FOUND: packages/web/tests/hasMagazine-filter.test.ts
- FOUND: packages/web/lib/hooks/useImages.ts
- FOUND: 9fc8ca1d (RED commit)
- FOUND: b3f735dd (GREEN commit)

---
*Phase: 52-editorial-filter-fix*
*Completed: 2026-04-01*
