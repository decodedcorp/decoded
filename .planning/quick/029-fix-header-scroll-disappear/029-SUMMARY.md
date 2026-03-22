---
phase: quick-029
plan: 01
subsystem: ui
tags: [z-index, header, css, stacking-context, design-system]

# Dependency graph
requires:
  - phase: v2-04-desktop-infrastructure
    provides: DesktopHeader and MobileHeader components
  - phase: quick-026
    provides: Understanding of z-index conflicts with fixed headers
provides:
  - Fixed header z-index hierarchy (headers z-40, content z-20, modals z-50+)
  - Consistent z-index token documentation
affects: [all pages with fixed headers, future z-index decisions]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Headers at z-40, content sections at z-20 or below, modals/overlays at z-50+"
    - "Stacking context awareness for relative + z-index interactions"

key-files:
  created: []
  modified:
    - packages/web/lib/design-system/desktop-header.tsx
    - packages/web/lib/design-system/mobile-header.tsx
    - packages/web/lib/components/main/DecodedPickSection.tsx
    - packages/web/lib/design-system/tokens.ts

key-decisions:
  - "Headers use z-40 (swapped with deprecated sidebar level)"
  - "Content sections stay at z-20 or below"
  - "Modals/overlays remain at z-50+ (no conflicts)"

patterns-established:
  - "Clear z-index hierarchy: content (z-20) < header (z-40) < modal (z-50+)"

# Metrics
duration: 1min
completed: 2026-02-12
---

# Quick Task 029: Fix Header Scroll Disappear

**Headers raised to z-40 and content sections lowered to z-20, eliminating scroll-based stacking conflicts while preserving visual overlap effects**

## Performance

- **Duration:** 1 min
- **Started:** 2026-02-12T09:28:48Z
- **Completed:** 2026-02-12T09:29:28Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Fixed header disappearing behind DecodedPickSection when scrolling home page
- Established clear z-index hierarchy across all pages
- Updated token documentation to match actual implementation
- Preserved DecodedPickSection's rounded-top visual overlap on HeroSection

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix z-index hierarchy** - `c8ff602` (fix)
2. **Task 2: Update token documentation** - `2e53b8a` (docs)

## Files Created/Modified
- `packages/web/lib/design-system/desktop-header.tsx` - Changed z-30 to z-40 in CVA base
- `packages/web/lib/design-system/mobile-header.tsx` - Changed z-30 to z-40 in CVA base
- `packages/web/lib/components/main/DecodedPickSection.tsx` - Changed z-30 to z-20 in section className
- `packages/web/lib/design-system/tokens.ts` - Updated zIndex.header from 30 to 40

## Decisions Made

**1. Headers take z-40 (swap with deprecated sidebar)**
- Rationale: Sidebar at z-40 is deprecated in this app (desktop uses header now), so headers taking that level is appropriate
- Clear separation: content (z-20), headers (z-40), modals (z-50+)

**2. DecodedPickSection lowered to z-20**
- Only needs to be above HeroSection background (z-0 to z-20 relative to hero internals)
- The `relative` + `-mt-20` creates the visual overlap effect
- z-20 is sufficient for overlap to render correctly above the hero

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - straightforward z-index adjustment with clear root cause identified in plan.

## Next Phase Readiness

- Z-index hierarchy now clear and documented
- Future content sections should use z-20 or below to avoid header conflicts
- Modal/overlay elements (z-50+) unaffected
- Ready for visual QA regression testing

---
*Phase: quick-029*
*Completed: 2026-02-12*
