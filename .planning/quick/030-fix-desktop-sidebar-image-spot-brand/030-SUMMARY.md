---
phase: quick-030
plan: 01
subsystem: ui
tags: [modal, gsap, animation, design-system, hotspot, image-detail]

# Dependency graph
requires:
  - phase: quick-027
    provides: object-contain pattern with ResizeObserver and pixel-based spot positioning
provides:
  - Desktop sidebar scroll containment (drawer overflow fix)
  - Floating image with object-contain and full visibility (no crop)
  - Spot markers on floating image with brand-derived colors
  - Brand color support in Hotspot design system component
affects: [design-system, post-detail, image-modal]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "ResizeObserver + onLoad pattern for contained image dimensions"
    - "Pixel-based spot positioning with getContainedImageRect()"
    - "Deterministic brand color generation via string hash"
    - "Optional color override in design system components"

key-files:
  created: []
  modified:
    - packages/web/lib/components/detail/ImageDetailModal.tsx
    - packages/web/lib/design-system/hotspot.tsx

key-decisions:
  - "Use object-contain with dark background instead of object-cover to show full image"
  - "Apply brand color to spots via deterministic hash function (hsl hue from string hash)"
  - "Position spots using pixel offsets within contained image rect (not raw percentages)"
  - "Change drawer overflow from visible to hidden for proper scroll containment"

patterns-established:
  - "Brand color extraction: keywords[0] → title first word → fallback"
  - "Hotspot color prop allows inline style backgroundColor override"
  - "Floating image sizing: 70% of left space width, 75% viewport height"

# Metrics
duration: 4min
completed: 2026-02-12
---

# Quick Task 030: Fix Desktop Sidebar Image Spot Brand

**Desktop modal drawer with scroll containment, full-visible floating image (object-contain), and brand-colored spot markers using design system Hotspot component**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-12T09:31:50Z
- **Completed:** 2026-02-12T09:36:12Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Fixed desktop sidebar scroll issue by changing drawer overflow from visible to hidden
- Converted floating image from object-cover to object-contain with dark background (full image visible)
- Added numbered spot markers on floating image with brand-specific colors
- Extended Hotspot design system component to support optional brand color override
- Implemented deterministic brand color generation via string hash function

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix Desktop Sidebar Scroll and Left-Side Image Display** - `8fb8fa4` (feat)
2. **Task 2: Add Brand Color Support to Hotspot Component** - `4c99cb3` (feat)

## Files Created/Modified
- `packages/web/lib/components/detail/ImageDetailModal.tsx` - Fixed drawer overflow, floating image object-contain, added spot markers with ResizeObserver tracking
- `packages/web/lib/design-system/hotspot.tsx` - Added optional color prop with backgroundColor style override

## Decisions Made

**1. Object-contain over object-cover**
- Rationale: Show full image without cropping, letterboxed in dark background for visual consistency

**2. Deterministic brand color via hash**
- Rationale: No brand color data in DB, but need consistent colors per brand
- Implementation: String hash → hue (0-360) → `hsl(hue, 70%, 50%)`
- Ensures same brand always gets same color across app

**3. Pixel-based spot positioning**
- Rationale: object-contain means spots at raw percentages would be incorrectly positioned
- Solution: Reuse quick-027 pattern (ResizeObserver + getContainedImageRect + pixel offsets)

**4. Drawer overflow hidden**
- Rationale: overflow-visible allowed content to visually escape drawer bounds
- Fix: Change to overflow-hidden, internal scroll container handles scrolling

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - implementation straightforward using established patterns from quick-027.

## Next Phase Readiness

- Desktop modal drawer experience now polished and consistent with post detail page
- Spot markers work correctly on both hero image (PostDetailContent) and floating image (ImageDetailModal)
- Hotspot design system component now supports brand colors for future use cases
- No blockers or concerns

---
*Phase: quick-030*
*Completed: 2026-02-12*
