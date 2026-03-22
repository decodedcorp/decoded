---
phase: quick-027
plan: 01
subsystem: ui
tags: [gsap, post-detail, image-positioning, z-index, modal, object-contain]

# Dependency graph
requires:
  - phase: quick-026
    provides: "Fixed feed header clip and post detail scroll issues"
provides:
  - Hero image displays fully without cropping using object-contain
  - Spot markers visible and positioned relative to displayed image area
  - Modal drawer properly integrates PostDetailContent with conditional animations
affects: [post-detail, image-detail-modal, hero-section]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "object-contain with dimension tracking for letterboxed image positioning"
    - "ResizeObserver + natural image dimensions for accurate spot marker placement"
    - "isModal prop pattern for conditional animations in different contexts"

key-files:
  created: []
  modified:
    - packages/web/lib/components/detail/PostDetailContent.tsx
    - packages/web/lib/components/detail/ImageDetailModal.tsx

key-decisions:
  - "Use object-contain instead of object-cover to prevent image cropping"
  - "Calculate actual displayed image rect to position spots within visible area"
  - "Disable ScrollTrigger parallax animations when PostDetailContent rendered in modal"
  - "Increase spot marker z-index from z-10 to z-20 for visibility above gradient"

patterns-established:
  - "Image dimension tracking: useState + onLoad + ResizeObserver pattern for accurate positioning in letterboxed images"
  - "Conditional animation: isModal flag to skip ScrollTrigger when component rendered in drawer with custom scroll container"

# Metrics
duration: 3min
completed: 2026-02-12
---

# Quick Task 027: Fix Post Detail Image Clip and Spots

**Hero image displays fully with object-contain, spot markers visible at correct positions, modal drawer integrates PostDetailContent with conditional ScrollTrigger animations**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-12T09:08:09Z
- **Completed:** 2026-02-12T09:11:31Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Hero image shows full content without cropping (object-contain with black background)
- Spot markers visible and positioned relative to actual displayed image area
- Modal drawer properly renders PostDetailContent with disabled ScrollTrigger parallax
- Debug console logs cleaned up (development-only guard)

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix Hero Image Clipping and Spot Marker Visibility** - `55b5afc` (feat)
2. **Task 2: Fix Modal Sidebar Animation and PostDetailContent Integration** - `ad09695` (feat)

## Files Created/Modified
- `packages/web/lib/components/detail/PostDetailContent.tsx` - Added image dimension tracking, spot positioning calculation, isModal prop support
- `packages/web/lib/components/detail/ImageDetailModal.tsx` - Pass isModal and scrollContainerRef props, clean up debug logs

## Decisions Made

1. **Object-contain over dynamic height**: Chose to keep fixed hero height with object-contain (letterboxed) instead of dynamic height that adapts to image aspect ratio. This preserves layout consistency and scroll position predictability while showing the full image.

2. **Pixel-based spot positioning with fallback**: Calculate spot positions in pixels based on actual displayed image rect when dimensions are available, with percentage-based fallback for graceful degradation during load.

3. **isModal prop for animation control**: Added explicit prop to control ScrollTrigger animations rather than auto-detecting scroll container, making the behavior predictable and explicit.

4. **z-index layering**: Established clear z-index stack: image (base), gradient (z-0), title (z-10), spots (z-20) to ensure all elements visible and layered correctly.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - implementation proceeded smoothly following the plan's detailed root cause analysis and fix approach.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Post detail page visual quality improvements complete. Hero images display fully, spot markers are visible and interactive, modal animations work smoothly in both full-page and drawer contexts.

**Next focus areas:**
- Continue addressing visual QA issues from v2-09-03 (images page raw JSON error exposure remains)
- Test post detail page with various image aspect ratios to verify letterboxing behavior
- Verify spot marker positioning accuracy with real post data

---
*Phase: quick-027*
*Completed: 2026-02-12*
