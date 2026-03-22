---
phase: quick
plan: 020
subsystem: ui
tags: [request-flow, spot-creation, manual-detection, upload-ui]

# Dependency graph
requires:
  - phase: quick-019
    provides: Manual spot creation flow with SpotMarker and DetectionView components
provides:
  - Unified upload + spot creation page removing separate /detect step
  - Direct spot creation UI integrated into upload flow
  - Spot list panel with solution input capability
affects: [request-flow, upload-experience]

# Tech tracking
tech-stack:
  added: []
  patterns: [unified-upload-spot-flow, inline-solution-input]

key-files:
  created: []
  modified:
    - packages/web/app/request/upload/page.tsx

key-decisions:
  - "Merge upload and spot creation into single page"
  - "Use DetectionView component for spot creation after upload"
  - "Navigate to /request/details instead of /request/detect"
  - "Enable Next button only when spots exist"

patterns-established:
  - "Spot creation immediately after upload without page navigation"
  - "Inline solution input within spot list panel"
  - "Upload loading state while image uploads"

# Metrics
duration: 2min
completed: 2026-02-05
---

# Quick Task 020: Request Upload Direct Spot UI

**Unified upload and spot creation into single page with direct image tapping for spot placement**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-05T13:36:00Z
- **Completed:** 2026-02-05T13:38:30Z
- **Tasks:** 3 (consolidated into 1 commit)
- **Files modified:** 1

## Accomplishments
- Merged upload and spot creation into single page flow
- User can tap directly on uploaded image to add spots
- Spot list panel shows all spots with edit/delete capability
- Solution input integrated inline when spot is selected
- Removed navigation to /request/detect page

## Task Commits

All three tasks were consolidated into a single comprehensive commit:

1. **Tasks 1-3: Integrate spot creation into upload page** - `8b08a6c` (feat)

## Files Created/Modified
- `packages/web/app/request/upload/page.tsx` - Complete upload flow with integrated spot creation UI

## Decisions Made

**1. Single-page upload + spot flow**
- Instead of separate /upload and /detect pages, unified into one experience
- User sees immediate feedback after upload completes
- Reduces navigation friction

**2. DetectionView integration**
- Reused existing DetectionView component for spot visualization
- Maintained consistent spot marker appearance and behavior
- Leveraged crosshair cursor for spot creation mode

**3. Spot list panel layout**
- Desktop: Side-by-side (image + spot list)
- Mobile: Vertical layout (image on top, list below)
- Responsive with overflow scroll on spot list

**4. Navigation change**
- Changed from `/request/detect` to `/request/details`
- Next button enables only when `detectedSpots.length > 0`
- Clean removal of intermediate detect page

## Deviations from Plan

None - plan executed exactly as written. All three tasks were completed in a single comprehensive implementation.

## Issues Encountered

None - implementation proceeded smoothly using existing components and store actions.

## Next Phase Readiness

Upload flow now provides:
- Direct spot creation without page navigation
- Inline solution input for each spot
- Clean progression to details/submit step

Ready for:
- Integration with details page
- Final submission flow
- Testing end-to-end request creation

---
*Quick task: 020*
*Completed: 2026-02-05*
