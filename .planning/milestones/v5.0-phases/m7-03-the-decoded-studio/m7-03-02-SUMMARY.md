---
phase: m7-03-the-decoded-studio
plan: "02"
subsystem: ui
tags: [spline, 3d, zustand, react, magazine, collection, webgl]

requires:
  - phase: m7-03-01
    provides: studioStore (focusIssue/unfocus), useSplineRuntime, SplineStudio, StudioLoader

provides:
  - useSplineBridge: magazineStore.collectionIssues synced to Spline variables (Vol_Label_N, Title_N, Visible_N, Cover_Texture_N) with MAX_SLOTS=8
  - useSplineEvents: Spline mouseDown/hover events -> focusIssue/unfocus semantic actions + Escape key handler
  - CollectionClient: WebGL detection + dynamic SplineStudio import (ssr:false) + BookshelfViewFallback + StudioHUD
  - StudioHUD: fixed header overlay with back button, title, #eafd67 issue count badge

affects: [m7-03-03]

tech-stack:
  added: []
  patterns:
    - "useSplineBridge: separate syncIssues and syncFocusedIndex effects keyed on issue IDs"
    - "Cover texture: setVariable first (official API), material.layers fallback for runtime texture swap"
    - "useSplineEvents: use semantic store actions (focusIssue/unfocus) not raw setters"
    - "StudioHUD: opacity-only fade-in with pointerEvents toggle (no layout shift)"

key-files:
  created:
    - packages/web/lib/components/collection/StudioHUD.tsx
  modified:
    - packages/web/lib/components/collection/studio/useSplineBridge.ts
    - packages/web/lib/components/collection/studio/useSplineEvents.ts
    - packages/web/lib/components/collection/CollectionClient.tsx

key-decisions:
  - "useSplineEvents uses focusIssue/unfocus semantic actions (not raw setFocusedIssueId + setCameraState) for clean store interface"
  - "Cover_Texture_N: try setVariable first (scene may expose it), then fall back to material.layers API"
  - "StudioHUD fades in via CSS opacity transition after splineLoaded=true, pointerEvents toggled to prevent click-through"

requirements-completed: []

duration: 15min
completed: 2026-03-12
---

# Phase m7-03 Plan 02: Data Bridge + StudioHUD Summary

**magazineStore->Spline variable sync via useSplineBridge, Spline click/hover/Escape events mapped to studioStore semantic actions via useSplineEvents, and StudioHUD fixed header overlay with #eafd67 issue count badge**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-03-12T06:40:00Z
- **Completed:** 2026-03-12T06:55:00Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- useSplineBridge syncs all 8 magazine slots (Vol_Label_N, Title_N, Visible_N, Cover_Texture_N) to Spline, managing visible/hidden state
- useSplineEvents maps Magazine_N clicks to focusIssue(id), non-book clicks to unfocus(), hover to cursor feedback, Escape key to unfocus
- StudioHUD renders as fixed overlay with back button (triggers exit camera state + router.back()), title, and #eafd67 issue count badge
- CollectionClient wires StudioHUD into the main 3D studio view

## Task Commits

1. **Task 1: useSplineBridge + useSplineEvents** - `e67fb1b` (feat)
2. **Task 2: StudioHUD + CollectionClient wiring** - `6b99b88` (feat)

## Files Created/Modified
- `packages/web/lib/components/collection/StudioHUD.tsx` - Fixed header overlay with back, title, issue count badge
- `packages/web/lib/components/collection/studio/useSplineBridge.ts` - Added Cover_Texture_N setVariable call before material layer fallback
- `packages/web/lib/components/collection/studio/useSplineEvents.ts` - Refactored to use focusIssue/unfocus semantic actions
- `packages/web/lib/components/collection/CollectionClient.tsx` - Added StudioHUD import and render

## Decisions Made
- useSplineEvents now uses semantic store actions (`focusIssue`/`unfocus`) instead of raw setters for a cleaner interface aligned with the store's intended API
- Cover texture strategy: `setVariable("Cover_Texture_N", url)` attempted first (works if scene exposes string variable), then material.layers fallback for runtime texture swap
- StudioHUD visibility uses CSS opacity + pointerEvents toggle rather than conditional render to preserve layout and enable smooth fade-in

## Deviations from Plan

Wave 1 (m7-03-01) had already created useSplineBridge.ts and useSplineEvents.ts with initial implementations. This plan refined them:

### Auto-fixed Issues

**1. [Rule 1 - Bug] useSplineEvents used raw store setters instead of semantic actions**
- **Found during:** Task 1 review
- **Issue:** Implementation used `setFocusedIssueId` + `setCameraState` directly instead of `focusIssue(id)` / `unfocus()` as the plan specified
- **Fix:** Refactored to use `focusIssue` and `unfocus` from studioStore, removing dead `cameraState` selector import
- **Files modified:** useSplineEvents.ts
- **Verification:** TypeScript passes cleanly
- **Committed in:** e67fb1b

---

**Total deviations:** 1 auto-fixed (Rule 1 - bug)
**Impact on plan:** Aligns event handling with the store's semantic action API. No scope creep.

## Issues Encountered
None - both hooks were pre-created in Wave 1; this plan refined and completed them.

## Next Phase Readiness
- Data bridge complete: React state flows to Spline variables bidirectionally
- Event bridge complete: user interactions in 3D map back to React state
- StudioHUD provides navigation UI
- Ready for m7-03-03: BookshelfView fallback refinement and collection page integration

---
*Phase: m7-03-the-decoded-studio*
*Completed: 2026-03-12*
