---
phase: v2-04-desktop-infrastructure
plan: 03
subsystem: ui
tags: [react, next.js, navigation, layout, design-system]

# Dependency graph
requires:
  - phase: v2-04-01
    provides: DesktopHeader and MobileHeader components
  - phase: v2-04-02
    provides: DesktopFooter component
provides:
  - Integrated header-based navigation in ConditionalNav
  - Root layout with footer integration
  - MainContentWrapper with top-based padding (no sidebar offset)
  - Deprecated Sidebar component with migration path
affects: [v2-05-home-explore, v2-06-feed-profile, v2-07-search-detail]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Top-based navigation pattern (headers replace sidebar)"
    - "Flex column layout with mt-auto footer positioning"

key-files:
  created: []
  modified:
    - packages/web/lib/components/ConditionalNav.tsx
    - packages/web/app/layout.tsx
    - packages/web/lib/components/Sidebar.tsx

key-decisions:
  - "Flex column wrapper in layout for proper footer positioning"
  - "Preserve Sidebar file with deprecation notices for reference"
  - "Use pt-14 md:pt-16 for header padding (56px mobile, 64px desktop)"
  - "Use pb-14 md:pb-0 for bottom nav padding (mobile only)"

patterns-established:
  - "Header-based navigation: DesktopHeader (md+), MobileHeader (<md), MobileNavBar (mobile bottom)"
  - "MainContentWrapper: top padding for headers, bottom padding for mobile nav"
  - "Footer positioning: mt-auto in flex column container for sticky bottom"

# Metrics
duration: 2min
completed: 2026-01-29
---

# Phase v2-04 Plan 03: Layout Integration Summary

**Replaced sidebar navigation with header-based layout using DesktopHeader, MobileHeader, and DesktopFooter components**

## Performance

- **Duration:** 2 min
- **Started:** 2026-01-29T11:49:17Z
- **Completed:** 2026-01-29T11:51:08Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments
- Integrated DesktopHeader and MobileHeader into ConditionalNav
- Removed sidebar margin offset from MainContentWrapper
- Added DesktopFooter to root layout with proper flex positioning
- Deprecated Sidebar component with clear migration path

## Task Commits

Each task was committed atomically:

1. **Task 1: Update ConditionalNav to use header-based navigation** - `3d1a711` (feat)
2. **Task 2: Integrate DesktopFooter into root layout** - `66932f8` (feat)
3. **Task 3: Deprecate Sidebar component** - `8b42a72` (chore)

## Files Created/Modified
- `packages/web/lib/components/ConditionalNav.tsx` - Replaced Sidebar with DesktopHeader + MobileHeader
- `packages/web/app/layout.tsx` - Added flex column wrapper and DesktopFooter integration
- `packages/web/lib/components/Sidebar.tsx` - Marked as deprecated with runtime warning

## Decisions Made

**Flex Column Layout Approach:**
- Wrapped AppProviders content in `flex flex-col min-h-screen` container
- Used `mt-auto` on footer for proper bottom positioning
- Enables footer to stick to bottom on short pages

**Sidebar Preservation:**
- Kept Sidebar file with deprecation notices instead of deletion
- Provides reference during transition period
- Added runtime warning in development mode
- Safe to delete after v2.0 launch

**Padding Strategy:**
- Desktop: 64px top header (pt-16)
- Mobile: 56px top header (pt-14) + 56px bottom nav (pb-14)
- No sidebar offset margin needed

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - integration was straightforward with all design system components already implemented.

## Next Phase Readiness

Desktop infrastructure phase (v2-04) is now complete:
- ✅ v2-04-01: Header components created
- ✅ v2-04-02: Footer component created
- ✅ v2-04-03: All components integrated into layout

**Ready for v2-05 (Home & Explore Pages):**
- Navigation structure in place
- Header/footer components available
- Layout wrapper provides proper spacing
- Responsive breakpoints configured

**Note:** Search and filter functionality in headers will be implemented in v2-07 (Search & Image Detail) phase.

---
*Phase: v2-04-desktop-infrastructure*
*Completed: 2026-01-29*
