---
phase: m7-03-the-decoded-studio
plan: "03"
subsystem: ui
tags: [spline, 3d, zustand, sonner, tailwind, magazine, collection]

requires:
  - phase: m7-03-02
    provides: useSplineBridge + useSplineEvents + StudioHUD + CollectionClient orchestrator

provides:
  - IssueDetailPanel with responsive layout (mobile bottom sheet / desktop sidebar), Open/Share/Remove actions
  - CollectionShareSheet with Copy Link (clipboard) and Web Share API
  - EmptyStudio overlay with CTA to /magazine/personal
  - BookshelfViewFallback with WebGL unavailability banner and header navigation
  - SplineStudio fully self-contained with all 2D HTML overlays (StudioHUD + IssueDetailPanel + EmptyStudio)
  - removeFromCollection action in magazineStore

affects: [collection page, magazine collection UX]

tech-stack:
  added: []
  patterns:
    - "Self-managed overlay: components read studioStore.cameraState internally, no external visible prop needed"
    - "SplineStudio as full composition root: 3D canvas + all 2D overlays in one component"
    - "Inline confirmation pattern: destructive actions show confirmation inline within the panel"

key-files:
  created:
    - packages/web/lib/components/collection/IssueDetailPanel.tsx
    - packages/web/lib/components/collection/CollectionShareSheet.tsx
    - packages/web/lib/components/collection/EmptyStudio.tsx
  modified:
    - packages/web/lib/components/collection/studio/SplineStudio.tsx
    - packages/web/lib/components/collection/BookshelfViewFallback.tsx
    - packages/web/lib/components/collection/CollectionClient.tsx
    - packages/web/lib/components/collection/index.ts
    - packages/web/lib/stores/magazineStore.ts

key-decisions:
  - "IssueDetailPanel is prop-less — reads focusedIssueId and cameraState from studioStore directly, avoids prop drilling through CollectionClient"
  - "SplineStudio renders all 2D overlays (StudioHUD + IssueDetailPanel + EmptyStudio) as siblings; CollectionClient only orchestrates loading/WebGL detection"
  - "Remove confirmation is inline within IssueDetailPanel panel (not a modal) to preserve spatial context"
  - "removeFromCollection added to magazineStore since no external API endpoint exists yet — mock console.log for the DELETE call"

patterns-established:
  - "Overlay self-management: each overlay reads studioStore.cameraState to decide visibility — no conditional rendering at parent level"
  - "CollectionShareSheet is intentionally self-contained with Tailwind (not DS BottomSheet) to avoid coupling"

requirements-completed: []

duration: 5min
completed: 2026-03-12
---

# Phase m7-03 Plan 03: 2D HTML Overlays + Fallback Summary

**Responsive IssueDetailPanel (mobile bottom sheet / desktop sidebar) with Open/Share/Remove actions, CollectionShareSheet with clipboard + Web Share API, EmptyStudio CTA overlay, and self-contained SplineStudio composition with all overlays.**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-03-12T06:45:52Z
- **Completed:** 2026-03-12T06:50:50Z
- **Tasks:** 3 of 3 (Task 3 = human-verify checkpoint — approved)
- **Files modified:** 7

## Accomplishments
- IssueDetailPanel: responsive layout (mobile bottom-sheet, desktop right-sidebar), self-managed via studioStore, full Open/Share/Remove workflow with inline confirmation and Sonner toasts
- CollectionShareSheet: Copy Link with clipboard API + Sonner toast, Web Share API conditional on browser support
- EmptyStudio: centered overlay CTA showing only when collection is empty AND Spline is loaded
- SplineStudio refactored to composition root — renders all 2D HTML overlays as siblings
- BookshelfViewFallback: added WebGL unavailability banner + back button header
- magazineStore: added `removeFromCollection(id)` action

## Task Commits

Each task was committed atomically:

1. **Task 1: IssueDetailPanel + CollectionShareSheet + EmptyStudio** - `4e4bc72` (feat)
2. **Task 2: Wire overlays into SplineStudio + BookshelfViewFallback + barrel exports** - `7ce3957` (feat)

## Files Created/Modified
- `packages/web/lib/components/collection/IssueDetailPanel.tsx` - Prop-less overlay, reads studioStore, responsive mobile/desktop layout, full action set
- `packages/web/lib/components/collection/CollectionShareSheet.tsx` - Bottom sheet with clipboard + Web Share
- `packages/web/lib/components/collection/EmptyStudio.tsx` - Centered CTA overlay, visibility self-managed
- `packages/web/lib/components/collection/studio/SplineStudio.tsx` - Added StudioHUD + IssueDetailPanel + EmptyStudio as overlay siblings
- `packages/web/lib/components/collection/BookshelfViewFallback.tsx` - Added banner + back header
- `packages/web/lib/components/collection/CollectionClient.tsx` - Simplified — SplineStudio handles overlays
- `packages/web/lib/components/collection/index.ts` - Added CollectionShareSheet, EmptyStudio, StudioHUD exports
- `packages/web/lib/stores/magazineStore.ts` - Added removeFromCollection action

## Decisions Made
- IssueDetailPanel made prop-less to avoid prop drilling — reads studioStore directly
- SplineStudio acts as composition root for all studio UI (3D + 2D overlays)
- Remove confirmation rendered inline in panel (not modal) for spatial coherence
- removeFromCollection added to magazineStore; actual DELETE API is mocked with console.log

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added removeFromCollection to magazineStore**
- **Found during:** Task 1 (IssueDetailPanel Remove action)
- **Issue:** Plan specified filtering collectionIssues on remove, but magazineStore had no removeFromCollection action — IssueDetailPanel had no way to update store state
- **Fix:** Added `removeFromCollection(id: string)` action to MagazineState interface and store implementation
- **Files modified:** packages/web/lib/stores/magazineStore.ts
- **Verification:** TypeScript compilation passes; IssueDetailPanel correctly calls removeFromCollection
- **Committed in:** 4e4bc72 (Task 1 commit)

**2. [Rule 1 - Bug] Fixed CollectionClient IssueDetailPanel prop mismatch**
- **Found during:** Task 1 verification (TypeScript error)
- **Issue:** CollectionClient was passing `issue` and `onClose` props to IssueDetailPanel, but new prop-less version accepts no props
- **Fix:** Removed focusedIssue computation, handleClose callback, and prop passing from CollectionClient
- **Files modified:** packages/web/lib/components/collection/CollectionClient.tsx
- **Verification:** TypeScript passes with zero errors
- **Committed in:** 4e4bc72 (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (1 missing critical, 1 bug)
**Impact on plan:** Both auto-fixes necessary for correctness. No scope creep.

## Issues Encountered
None — clean TypeScript compilation on first full check after each task.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All 2D HTML overlays complete, wired, and human-verified (Task 3 checkpoint approved)
- m7-03 phase is complete — Spline Studio collection page fully built with 3D canvas, overlays, fallback, and loader
- Ready for next phase: actual Spline scene file (.splinecode) design in Spline Pro editor and deployment

---
*Phase: m7-03-the-decoded-studio*
*Completed: 2026-03-12*
