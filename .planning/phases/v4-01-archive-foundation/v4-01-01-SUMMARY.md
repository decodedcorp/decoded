---
phase: v4-01-archive-foundation
plan: 01
subsystem: docs
tags: [archive, specs, audit, v4-overhaul]

# Dependency graph
requires: []
provides:
  - "Complete v2.1.0 snapshot of all specs/ files in specs/_archive/v2.1.0/"
  - "STALE-PATHS-AUDIT.md: 60 stale paths identified across 13 spec files"
  - "ARCHIVE-INFO.md marker with archive date and reason"
affects:
  - v4-04-screen-specs-detail-view
  - v4-05-screen-specs-discovery
  - v4-06-screen-specs-creation-ai
  - v4-07-screen-specs-user-system

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Archive convention: specs/_archive/{version}/ for pre-restructure snapshots"
    - "Stale path audit: verify all packages/web/ references against filesystem before spec rewrite"

key-files:
  created:
    - specs/_archive/v2.1.0/ (57 files total)
    - specs/_archive/v2.1.0/ARCHIVE-INFO.md
    - specs/_archive/v2.1.0/STALE-PATHS-AUDIT.md
  modified: []

key-decisions:
  - "Archive is read-only snapshot — do not modify files in specs/_archive/v2.1.0/"
  - "60 stale paths found; will be corrected in v4-04 through v4-07 when screen specs are rewritten"
  - "grid/ThiingsGrid.tsx moved to ThiingsGrid.tsx; app/HomeClient.tsx moved from lib/ — these are renames not deletions"

patterns-established:
  - "Stale path pattern: Most unimplemented features (voting, comments, filter components) have no corresponding files"
  - "Profile sub-pages: all user-system sub-pages (activity, earnings, settings) use single page.tsx with tab routing"

# Metrics
duration: 4min
completed: 2026-02-19
---

# Phase v4-01 Plan 01: Archive Foundation Summary

**Complete v2.1.0 spec snapshot (56 files) archived to specs/_archive/v2.1.0/ with stale path audit identifying 60 missing component references across 13 spec files**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-19T10:58:09Z
- **Completed:** 2026-02-19T11:02:11Z
- **Tasks:** 2
- **Files created:** 57 (56 archived + STALE-PATHS-AUDIT.md)

## Accomplishments

- Archived all 56 current specs/ files to specs/_archive/v2.1.0/ as a read-only v2.1.0 snapshot
- Identified 60 stale file path references out of 87 total unique paths across 13 spec files
- Documented stale paths by spec file, component type, and recommended action for v4-04 through v4-07

## Task Commits

Each task was committed atomically:

1. **Task 1: Copy specs/ to specs/_archive/v2.1.0/** - `972f729` (chore)
2. **Task 2: Audit stale file paths in existing specs** - `f6b9ac4` (docs)

## Files Created/Modified

- `specs/_archive/v2.1.0/` - Complete copy of all specs/ files at v2.1.0 state
- `specs/_archive/v2.1.0/ARCHIVE-INFO.md` - Archive marker with date, reason, and instructions
- `specs/_archive/v2.1.0/STALE-PATHS-AUDIT.md` - Comprehensive stale path audit: 60 stale out of 87 references

## Decisions Made

- Archive is read-only — ARCHIVE-INFO.md explicitly states "Do not edit files in this directory"
- Stale paths are documented but NOT fixed — fixing happens in v4-04 through v4-07 per plan scope
- `grid/ThiingsGrid.tsx` and `lib/components/HomeClient.tsx` are path renames (files exist at new locations), not deletions

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None. File counts: source had 56 files at archive time; 2 additional files (ARCHIVE-INFO.md, STALE-PATHS-AUDIT.md) added to archive after rsync as specified in plan.

## Stale Path Highlights (for v4-04 through v4-07)

The audit found three major categories of stale paths:

1. **Unimplemented features** (voting, comments, filter components) — components never built; specs describe planned functionality
2. **Profile sub-pages** — user-system uses single `profile/page.tsx` with tab routing; no sub-pages exist
3. **Path renames** — `grid/ThiingsGrid.tsx` → `ThiingsGrid.tsx`; `lib/components/HomeClient.tsx` → `app/HomeClient.tsx`

Full details in `specs/_archive/v2.1.0/STALE-PATHS-AUDIT.md`.

## Next Phase Readiness

- v4-01-02: Archive complete; can now proceed to phase 2 (shared foundation specs)
- v4-04 through v4-07: STALE-PATHS-AUDIT.md provides actionable checklist for each screen spec rewrite
- No blockers

---
*Phase: v4-01-archive-foundation*
*Completed: 2026-02-19*
