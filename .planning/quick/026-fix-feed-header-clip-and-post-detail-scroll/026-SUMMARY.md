---
phase: quick-026
plan: 01
subsystem: ui
tags: [next.js, layout, responsive, gsap, scroll]

# Dependency graph
requires:
  - phase: v2-design-overhaul
    provides: ConditionalNav + MainContentWrapper global layout system
  - phase: quick-023
    provides: PostDetailPage with editorial hero design
provides:
  - Feed page without duplicate headers or padding conflicts
  - Post detail page with full-bleed hero under transparent header
  - Correct viewport height calculations for responsive layouts
affects: [future-layout-changes, header-modifications]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Negative margin technique to counteract wrapper padding for full-bleed content
    - 100dvh for mobile-friendly viewport calculations
    - Account for global layout padding in child pages

key-files:
  created: []
  modified:
    - packages/web/app/feed/page.tsx
    - packages/web/lib/components/detail/PostDetailPage.tsx

key-decisions:
  - "Use negative margin to pull hero content under fixed header for editorial full-bleed effect"
  - "Remove page-level headers/padding when global layout already provides them"
  - "Use 100dvh instead of 100vh for better mobile viewport handling"

patterns-established:
  - "When ConditionalNav + MainContentWrapper handle headers globally, child pages must NOT add their own headers or padding"
  - "For full-bleed hero sections: apply negative margin equal to MainContentWrapper padding (-mt-14 md:-mt-[72px])"
  - "Height calculations must account for all chrome: mobile (header + bottom nav = 120px), desktop (header only = 72px)"

# Metrics
duration: 2.5min
completed: 2026-02-12
---

# Quick Task 026: Feed Header Clip and Post Detail Scroll Summary

**Eliminated duplicate headers and double padding from feed page; enabled full-bleed editorial hero on post detail pages with negative margin technique**

## Performance

- **Duration:** 2.5 min
- **Started:** 2026-02-12T09:04:00Z
- **Completed:** 2026-02-12T09:06:31Z
- **Tasks:** 2 (plus verification checkpoint)
- **Files modified:** 2

## Accomplishments

- Feed page now renders without duplicate headers (removed conflicting Header component)
- Feed page uses correct viewport height accounting for mobile bottom nav (120px) and desktop header (72px)
- Post detail hero extends full-bleed to viewport top, visible behind semi-transparent fixed header
- All three post detail states (content, loading, error) properly handle full-bleed layout

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix Feed Page Duplicate Header and Double Padding** - `d2641bf` (fix)
2. **Task 2: Fix Post Detail Page Scroll Clipping with Full-Bleed Hero** - `8afb9c0` (fix)

## Files Created/Modified

- `packages/web/app/feed/page.tsx` - Removed duplicate Header component and redundant main wrapper; corrected viewport height calculation to h-[calc(100dvh-120px)] md:h-[calc(100dvh-72px)]
- `packages/web/lib/components/detail/PostDetailPage.tsx` - Added negative top margin (-mt-14 md:-mt-[72px]) to all three wrapper states (main content, loading skeleton, error state) to counteract MainContentWrapper padding

## Decisions Made

1. **Negative margin technique for full-bleed hero:** Applied `-mt-14 md:-mt-[72px]` to pull content up and counteract the global `MainContentWrapper` padding. This allows the hero to sit flush at viewport top behind the semi-transparent header, creating an immersive editorial feel.

2. **Remove page-level headers when global layout provides them:** The feed page was rendering a duplicate `<Header />` component even though `ConditionalNav` in the global layout already handles all header rendering. Removed to prevent double headers.

3. **Use 100dvh for mobile viewport:** Changed from `100vh` to `100dvh` (dynamic viewport height) for better handling of mobile browser chrome that changes size during scroll.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - both fixes were straightforward layout adjustments with no unexpected complications. Build passed on first attempt after each change.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

**Ready for production:** Both fixes improve visual quality and user experience without breaking changes.

**Pattern established:** The negative margin technique for full-bleed content is now documented and can be reused for other editorial-style pages that need to extend content under the fixed header.

**No blockers:** All verification passed (build successful, code review approved).

---
*Phase: quick-026*
*Completed: 2026-02-12*
