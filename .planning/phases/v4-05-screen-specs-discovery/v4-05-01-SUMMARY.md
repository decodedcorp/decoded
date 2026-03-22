---
phase: v4-05-screen-specs-discovery
plan: 01
subsystem: ui
tags: [screen-spec, home, search, zustand, gsap, motion, ssr, next.js]

requires:
  - phase: v4-04-screen-specs-detail-view
    provides: screen spec format established (EARS requirements, wireframes, component maps)
  - phase: v4-03-flow-documents
    provides: FLW-01 discovery flow for navigation contract cross-references
  - phase: v4-01-archive-foundation
    provides: STALE-PATHS-AUDIT.md documenting moved/missing component paths

provides:
  - SCR-DISC-01-home.md: Home page spec with SSR pattern, 10 section components, Motion animations
  - SCR-DISC-02-search.md: Search overlay spec with searchStore state machine and multi-tab results

affects:
  - v4-05-02 (SCR-DISC-03 and SCR-DISC-04 — will cross-reference these specs)
  - v4-06-creation-ai (may reference search as a discovery entry point)
  - v4-07-user-system (search accessible from all headers)

tech-stack:
  added: []
  patterns:
    - SSR-first home page pattern (async page.tsx fetching all data via Promise.all; passing as props to client HomeAnimatedContent)
    - Motion whileInView fade-up pattern for section scroll animations
    - searchStore debounce pattern (setQuery → debouncedQuery gate → React Query enabled)
    - URL ↔ store bidirectional sync via useSearchURLSync (skipInitialSync for SSR-initialized pages)

key-files:
  created:
    - specs/screens/discovery/SCR-DISC-01-home.md
    - specs/screens/discovery/SCR-DISC-02-search.md
  modified: []

key-decisions:
  - "HomeClient.tsx at app/HomeClient.tsx is a legacy vertical-feed component NOT used by the current home page; current home uses HomeAnimatedContent with SSR data"
  - "Search is a full-screen page route (/search), not a modal overlay — SearchPageClient renders fixed inset-0 z-50"
  - "Search tabs are All/People/Media/Items (not the old DISC-02 filter tabs described in stale specs)"
  - "useGroupedSearch enabled guard is debouncedQuery.length >= 2; shorter queries do not trigger API"

patterns-established:
  - "Component Map note block documents stale path corrections inline (not as separate section)"
  - "searchStore state transitions use code block format showing the full state machine flow"

duration: 3min
completed: 2026-02-19
---

# Phase v4-05 Plan 01: Home and Search Screen Specs Summary

**Two Discovery screen specs with all component paths verified: SSR home page (10 sections, Motion animations) and full-screen search with searchStore state machine and four-tab results.**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-19T13:48:39Z
- **Completed:** 2026-02-19T13:51:49Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- SCR-DISC-01 documents the home page with all 10 active section components verified on filesystem, SSR data fetching via `Promise.all`, and Motion `whileInView` animation pattern.
- SCR-DISC-02 documents the full-screen search page with 17 verified component/hook paths, searchStore state machine (idle→query→debounced→results), and URL sync pattern.
- Stale path corrections applied: HomeClient is not the current home page entry point (HomeAnimatedContent is); CardCell/CardSkeleton marked NOT-IMPL.

## Task Commits

1. **Task 1: Write SCR-DISC-01-home.md** - `c7a4b17` (feat)
2. **Task 2: Write SCR-DISC-02-search.md** - `750fecc` (feat)

**Plan metadata:** (this commit)

## Files Created/Modified

- `specs/screens/discovery/SCR-DISC-01-home.md` — Home page spec (195 lines): 10 verified section components, SSR data pattern, Motion animations, mobile+desktop wireframes, EARS requirements
- `specs/screens/discovery/SCR-DISC-02-search.md` — Search screen spec (186 lines): 17 verified paths, searchStore state transitions, URL sync, 4-tab results, mobile+desktop wireframes, EARS requirements

## Decisions Made

- **HomeClient is legacy:** `app/HomeClient.tsx` exists but is a vertical-feed component from an older design. The current home page uses `HomeAnimatedContent` with SSR props. Spec reflects the actual implemented pattern.
- **Search is a page, not an overlay:** SCR-DISC-02 route is `/search` — `SearchPageClient` renders a `fixed inset-0 z-50` full-screen UI within the page, not as a modal parallel route. Wireframes and layout description updated accordingly.
- **Search tab labels:** Actual tabs are All/People/Media/Items (from SearchTabs.tsx) — not the filter-based tabs described in the v2.1.0 stale specs.
- **Debounce threshold:** `useGroupedSearch` enables API calls only when `debouncedQuery.length >= 2`; single-character queries do not fire.

## Deviations from Plan

None — plan executed exactly as written. All specified file paths were found at expected locations. The one key finding (HomeClient is legacy, not current home page entry) was anticipated by the plan's stale path correction instructions.

## Issues Encountered

None.

## User Setup Required

None — documentation-only phase.

## Next Phase Readiness

- SCR-DISC-01 and SCR-DISC-02 ready for v4-05-02 (SCR-DISC-03 Explore and SCR-DISC-04 Image Grid)
- Both specs cross-reference each other and FLW-01 correctly
- searchStore state machine documented as authoritative reference for any search feature work

---
*Phase: v4-05-screen-specs-discovery*
*Completed: 2026-02-19*
