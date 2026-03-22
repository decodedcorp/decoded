---
phase: m7-03-the-decoded-studio
plan: 01
subsystem: ui
tags: [spline, splinetool, 3d, zustand, webgl, studio, magazine, collection]

# Dependency graph
requires:
  - phase: m7-02-main-page-renewal
    provides: "magazineStore with collectionIssues, MagazineIssue types"
provides:
  - "studioStore camera state machine with loading/entry/browse/focused/exit states + focusIssue/unfocus actions"
  - "useSplineRuntime hook with Application ref, findObject, triggerEvent, setVar, transitionCamera"
  - "SplineStudio component wired to studioStore + magazineStore + useSplineRuntime"
  - "StudioLoader full-screen neon loading screen with visible prop for fade-out"
  - "TextureSwapSpike component for manual validation of material.layers texture approach"
  - "public/spline/ directory for self-hosted .splinecode scene files"
affects:
  - m7-03-02
  - m7-03-the-decoded-studio

# Tech tracking
tech-stack:
  added:
    - "@splinetool/react-spline ^4.1.0 (already installed)"
    - "@splinetool/runtime ^1.12.67 (already installed)"
  patterns:
    - "useSplineRuntime: capture Application ref via onLoad callback, expose typed control methods"
    - "studioStore camera state machine: loading -> entry -> browse -> focused -> exit"
    - "SplineStudio: dynamic import by consumer (ssr:false), not inside component itself"
    - "material.layers texture swap pattern via tryTextureSwap in useSplineBridge"
    - "Spline variables (String/Number/Boolean only) for data binding to scene"

key-files:
  created:
    - packages/web/lib/components/collection/studio/useSplineRuntime.ts
    - packages/web/public/spline/.gitkeep
  modified:
    - packages/web/lib/stores/studioStore.ts
    - packages/web/lib/components/collection/studio/SplineStudio.tsx
    - packages/web/lib/components/collection/StudioLoader.tsx

key-decisions:
  - "Used local scene URL /spline/decoded-studio.splinecode (self-hosted) instead of CDN URL to avoid CORS and latency issues"
  - "studioStore has both primitive setters (setFocusedIssueId) and semantic actions (focusIssue/unfocus) for ergonomic consumer API"
  - "useSplineRuntime separates runtime bridge concern from SplineStudio component for reusability"
  - "Camera focus per-book uses direct position set + requestRender (not named states) because book count is dynamic"

patterns-established:
  - "useSplineRuntime pattern: all Spline runtime access goes through this hook, never direct import"
  - "SplineStudio: consumer does dynamic import with ssr:false; SplineStudio itself is 'use client' only"
  - "useSplineBridge: silent-fail wrappers (trySetVariable/tryTextureSwap) for Spline API calls that may fail if scene variables not defined"

requirements-completed: []

# Metrics
duration: 10min
completed: 2026-03-12
---

# Phase m7-03 Plan 01: Spline Foundation Summary

**@splinetool/react-spline integration with studioStore camera state machine, useSplineRuntime hook, SplineStudio wrapper, neon StudioLoader, and TextureSwapSpike for material.layers validation**

## Performance

- **Duration:** ~10 min
- **Started:** 2026-03-12T06:30:00Z
- **Completed:** 2026-03-12T06:35:57Z
- **Tasks:** 2
- **Files modified:** 5 (created 2, modified 3)

## Accomplishments
- studioStore camera state machine complete with `focusIssue(id)` and `unfocus()` semantic transitions
- useSplineRuntime hook providing typed Application ref + findObject/triggerEvent/setVar/transitionCamera
- SplineStudio component refactored to use useSplineRuntime, local scene URL, and semantic store actions
- StudioLoader updated with `visible` prop for 300ms fade-out before unmount
- public/spline/ directory created for self-hosted .splinecode scene files
- TextureSwapSpike (pre-existing, more comprehensive than plan required) ready for manual validation

## Task Commits

Each task was committed atomically:

1. **Task 1: studioStore + useSplineRuntime + StudioLoader** - `a501418` (feat)
2. **Task 2: SplineStudio wrapper + public/spline directory** - `5a6c9ee` (feat)

**Plan metadata:** (pending final commit)

## Files Created/Modified
- `packages/web/lib/stores/studioStore.ts` - Added `focusIssue(id)` and `unfocus()` semantic actions to camera state machine
- `packages/web/lib/components/collection/studio/useSplineRuntime.ts` - NEW: typed hook with Application ref + control methods
- `packages/web/lib/components/collection/studio/SplineStudio.tsx` - Refactored to use useSplineRuntime hook, local scene path, semantic store actions
- `packages/web/lib/components/collection/StudioLoader.tsx` - Added `visible` prop with delayed-unmount fade-out
- `packages/web/public/spline/.gitkeep` - NEW: directory placeholder for self-hosted .splinecode files

## Decisions Made
- **Local scene URL**: Used `/spline/decoded-studio.splinecode` instead of CDN URL to avoid CORS and latency issues
- **Semantic actions**: Added `focusIssue/unfocus` alongside primitive setters in studioStore for ergonomic consumer API
- **Separation of concerns**: useSplineRuntime handles Application ref lifecycle; SplineStudio handles component composition
- **Per-book camera**: Direct position assignment + requestRender for dynamic book counts (not pre-defined named states)

## Deviations from Plan

Both Spline packages (`@splinetool/react-spline`, `@splinetool/runtime`) were already installed — skipped installation step. Pre-existing implementations of SplineStudio, TextureSwapSpike, useSplineBridge, and useSplineEvents existed from a prior spike; these were preserved/enhanced rather than replaced from scratch.

**1. [Rule 1 - Bug] TypeScript error in getAllObjects mapping**
- **Found during:** Task 2 (SplineStudio.tsx)
- **Issue:** `getAllObjects()` returns objects with optional `.name` property; mapping to string caused `string | undefined` type error
- **Fix:** Changed to `.map(o => o.name ?? "").filter(n => n && ...)`
- **Files modified:** SplineStudio.tsx
- **Verification:** TypeScript passes with zero errors
- **Committed in:** `5a6c9ee` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Trivial type error; no scope creep.

## Issues Encountered
- Pre-existing SplineStudio used Spline CDN URL — updated to local path as plan specified
- Pre-existing studioStore lacked `focusIssue`/`unfocus` semantic actions required by plan — added alongside existing primitive setters

## User Setup Required
None — no external service configuration required. The actual Spline scene file (`decoded-studio.splinecode`) must be designed in Spline Pro editor and placed at `packages/web/public/spline/decoded-studio.splinecode` before the 3D studio is functional.

## Next Phase Readiness
- Foundation complete: studioStore + useSplineRuntime + SplineStudio + StudioLoader all wired
- Plan 02 (data bridges: useStudioSync, IssueDetailPanel) can proceed immediately
- TextureSwapSpike available at `/lab/texture-swap` for material.layers validation during design phase
- Actual Spline scene design required before end-to-end testing is possible

## Self-Check: PASSED

All required files confirmed present:
- FOUND: studioStore.ts
- FOUND: useSplineRuntime.ts
- FOUND: SplineStudio.tsx
- FOUND: StudioLoader.tsx
- FOUND: TextureSwapSpike.tsx
- FOUND: public/spline/.gitkeep

All commits confirmed:
- FOUND: a501418 (Task 1)
- FOUND: 5a6c9ee (Task 2)

---
*Phase: m7-03-the-decoded-studio*
*Completed: 2026-03-12*
