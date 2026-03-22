---
phase: m7-02-main-page-renewal
plan: 02
subsystem: ui
tags: [gsap, scroll-trigger, masonry, parallax, css-columns, next-image]

requires:
  - phase: m7-01-magazine-frontend-mock
    provides: "Magazine theme system (mag-* CSS vars, tailwind utilities)"
provides:
  - "MasonryGrid with CSS columns masonry layout"
  - "MasonryGridItem with parallax scroll and spot overlay"
  - "PersonalizeBanner with suction animation CTA"
affects: [m7-02-03 page assembly]

tech-stack:
  added: []
  patterns:
    - "CSS columns for masonry layout (no external library)"
    - "GSAP ScrollTrigger scrub for scroll-linked animations"
    - "Spot overlay with neon glow markers on hover"

key-files:
  created:
    - packages/web/lib/components/main-renewal/MasonryGrid.tsx
    - packages/web/lib/components/main-renewal/MasonryGridItem.tsx
    - packages/web/lib/components/main-renewal/PersonalizeBanner.tsx
  modified: []

key-decisions:
  - "CSS columns over CSS Grid for masonry -- true vertical fill without JS measurement"
  - "GSAP context pattern for cleanup -- scoped to component ref, revert on unmount"

patterns-established:
  - "Masonry: CSS columns-1/2/3/4 with break-inside-avoid for variable-height grid"
  - "Spot overlay: conditional render with GSAP stagger fade-in on hover"
  - "Suction animation: scattered absolute-positioned images converge via ScrollTrigger scrub"

requirements-completed: []

duration: 2min
completed: 2026-03-05
---

# Phase m7-02 Plan 02: MasonryGrid + PersonalizeBanner Summary

**CSS columns masonry grid with GSAP parallax/spot-overlay and suction-animation PersonalizeBanner CTA**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-05T08:49:50Z
- **Completed:** 2026-03-05T08:52:05Z
- **Tasks:** 2
- **Files created:** 3

## Accomplishments
- MasonryGrid with CSS `columns` for true masonry layout (1-4 columns responsive)
- MasonryGridItem with GSAP ScrollTrigger parallax, staggered entry animation, and spot overlay with neon glow markers
- PersonalizeBanner with 5-image suction animation converging to center on scroll
- All animations GSAP-based with proper context cleanup on unmount

## Task Commits

Each task was committed atomically:

1. **Task 1: MasonryGrid + MasonryGridItem** - `d18409d` (feat)
2. **Task 2: PersonalizeBanner with Suction Animation** - `dc89e96` (feat)

## Files Created/Modified
- `packages/web/lib/components/main-renewal/MasonryGrid.tsx` - CSS columns masonry container with "DECODED PICKS" header
- `packages/web/lib/components/main-renewal/MasonryGridItem.tsx` - Grid card with parallax, entry animation, spot overlay
- `packages/web/lib/components/main-renewal/PersonalizeBanner.tsx` - Soft wall CTA with suction animation

## Decisions Made
- CSS `columns` chosen over CSS Grid masonry (not widely supported) and external libraries -- gives true vertical-fill masonry without JS measurement
- Used GSAP `gsap.context()` scoped to component ref for all animations -- clean revert on unmount
- Spot marker animation uses `back.out(2)` ease for playful bounce-in effect
- PersonalizeBanner uses absolute positioning with percentage-based scatter positions for responsive behavior

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All 3 components ready for page assembly in Plan 03
- Types from Plan 01 `types.ts` already compatible (GridItemData, PersonalizeBannerData)
- MainHero (Plan 01) + MasonryGrid + PersonalizeBanner form the complete section set

---
*Phase: m7-02-main-page-renewal*
*Completed: 2026-03-05*
