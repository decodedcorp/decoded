---
phase: v2-03-card-components
plan: 02
subsystem: ui
tags: [react, next-js, design-system, card-components, tailwind, cva]

# Dependency graph
requires:
  - phase: v2-03-01
    provides: Base Card component with variants and slot composition
provides:
  - ProductCard component for item display with image, brand, name, price, badge
  - GridCard component for gallery layouts with configurable aspect ratios
  - Refactored ItemCard using base Card composition
  - Skeleton variants for all card types
affects: [v2-03-03, v2-05, v2-06, home-page, explore-page, feed-page, profile-page]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "ProductCard composable pattern - base Card + product-specific layout"
    - "GridCard overlay pattern - optional ReactNode for badges/actions/counts"
    - "Badge variant styling - TOP/NEW/BEST/SALE with color coding"
    - "Aspect ratio flexibility - 1/1, 3/4, 4/3, 4/5, 16/9 support"

key-files:
  created:
    - packages/web/lib/design-system/product-card.tsx
    - packages/web/lib/design-system/grid-card.tsx
  modified:
    - packages/web/lib/components/main/ItemCard.tsx
    - packages/web/lib/design-system/index.ts

key-decisions:
  - "ProductCard uses Link wrapper when link provided, div wrapper when onClick provided"
  - "GridCard has p-0 on Card for full-image display, unlike ProductCard with p-3 content area"
  - "Badge styles extracted to const object for reusability (TOP/NEW/BEST/SALE)"
  - "ItemCard preserves motion animation wrapper, composes base Card internally"

patterns-established:
  - "Card composition pattern: import Card/CardContent, compose with domain-specific content"
  - "Conditional wrapper pattern: Link vs div vs bare content based on link/onClick props"
  - "Skeleton matching: skeleton structure mirrors actual component layout"

# Metrics
duration: 3min
completed: 2026-01-29
---

# Phase v2-03 Plan 02: Content Cards Summary

**ProductCard and GridCard with aspect ratios, badges, overlays; ItemCard refactored to base Card composition**

## Performance

- **Duration:** 3 min
- **Started:** 2026-01-29T11:12:52Z
- **Completed:** 2026-01-29T11:15:52Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments
- ProductCard component with image, brand, name, price, originalPrice, badge (TOP/NEW/BEST/SALE)
- GridCard component for gallery layouts with flexible aspect ratios and overlay support
- ItemCard refactored to use base Card component, maintaining existing functionality
- All skeleton variants implemented for loading states

## Task Commits

Each task was committed atomically:

1. **Task 1: Create ProductCard component** - `8c4bc5e` (feat)
2. **Task 2: Create GridCard component** - `ad6703f` (feat)
3. **Task 3: Refactor ItemCard to use base Card and export from design-system** - `5b71860` (refactor)

## Files Created/Modified
- `packages/web/lib/design-system/product-card.tsx` - ProductCard with image, brand, name, price, badge support
- `packages/web/lib/design-system/grid-card.tsx` - GridCard for gallery layouts with aspect ratio and overlay
- `packages/web/lib/components/main/ItemCard.tsx` - Refactored to use Card from design-system
- `packages/web/lib/design-system/index.ts` - Added ProductCard and GridCard barrel exports

## Decisions Made

**1. ProductCard wrapper strategy:**
- Use Link wrapper when `link` provided without `onClick`
- Use div wrapper when `onClick` provided (allows custom click handling)
- Return bare content when neither (for use in custom wrappers)

**2. GridCard padding override:**
- GridCard uses `p-0` override on Card component (full-image display)
- ProductCard keeps default `size="sm"` padding for content area

**3. Badge style extraction:**
- Badge styles extracted to `badgeStyles` const object
- Enables consistent badge styling across ProductCard and ItemCard
- Supports TOP (primary), NEW (blue), BEST (amber), SALE (destructive)

**4. ItemCard preservation:**
- Kept motion animation wrapper for existing stagger animations
- Replaced inline card styling with Card component composition
- Maintained all existing props and functionality

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

**1. Prettier formatting warnings:**
- **Issue:** ESLint reported 6 Prettier formatting violations after initial implementation
- **Resolution:** Ran `npx prettier --write` on all affected files
- **Verification:** ESLint passed with --max-warnings 0

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

**Ready for v2-03-03 (Feed and Profile Cards):**
- Base Card component established (v2-03-01)
- ProductCard pattern demonstrates image + content composition
- GridCard pattern demonstrates full-image cards with overlays
- ItemCard demonstrates real-world Card usage with animations

**Card component ecosystem complete:**
- ✅ Base Card with variants (default, elevated, outline, ghost)
- ✅ ProductCard for e-commerce item display
- ✅ GridCard for gallery/collection layouts
- ⏳ FeedCard for social feed items (next)
- ⏳ ProfileHeaderCard for user profiles (next)

**No blockers:**
- All components type-safe and linted
- Skeleton variants ready for loading states
- Exports available in design-system barrel

---
*Phase: v2-03-card-components*
*Completed: 2026-01-29*
