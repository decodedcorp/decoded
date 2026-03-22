---
phase: v2-07-search-image-detail
plan: 02
subsystem: ui
tags: [gsap, scroll-trigger, framer-motion, lightbox, parallax, animations]

# Dependency graph
requires:
  - phase: v2-01-core-foundation
    provides: Component structure, design system foundation
provides:
  - Hero section with decoded.pen styling (426px mobile height, gradient overlay)
  - GSAP scroll animations (parallax effect, title fade-out)
  - Lightbox component for fullscreen image viewing with zoom
  - Fixed action buttons with enhanced hover effects
affects: [v2-07-03, image-detail, search-ui]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - GSAP ScrollTrigger for scroll-linked animations
    - Framer Motion AnimatePresence for modal transitions
    - Lightbox pattern with keyboard, backdrop, and button close handlers

key-files:
  created:
    - packages/web/lib/components/detail/Lightbox.tsx
  modified:
    - packages/web/lib/components/detail/HeroSection.tsx
    - packages/web/lib/components/detail/ImageDetailPage.tsx
    - packages/web/lib/components/detail/ImageDetailContent.tsx

key-decisions:
  - "Mobile hero fixed at 426px per decoded.pen spec, desktop 60vh max 600px"
  - "Simple zoom toggle (scale 1.5) instead of complex zoom library"
  - "Title fade-out completes at 30% scroll for smooth transition"
  - "Lightbox z-[60] to stack above header (z-50)"

patterns-established:
  - "Hero section accepts onClick prop for lightbox integration"
  - "Scroll animations disabled in modal mode (isModal prop)"
  - "Lightbox closes via X button, Escape key, or backdrop click"

# Metrics
duration: 3min
completed: 2026-02-05
---

# Phase v2-07 Plan 02: Image Detail Hero & Animations Summary

**Hero section with decoded.pen styling (426px mobile), GSAP parallax scroll, title fade-out, and fullscreen zoomable lightbox**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-05T10:03:50Z
- **Completed:** 2026-02-05T10:06:28Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments
- Hero section updated with decoded.pen design spec (426px mobile height, Playfair Display typography)
- Enhanced scroll animations: parallax image movement, smooth title fade-out
- Fullscreen lightbox with zoom, keyboard shortcuts, and smooth transitions
- Action buttons enhanced with hover:scale-105 effect

## Task Commits

Each task was committed atomically:

1. **Task 1: Update HeroSection with decoded.pen styling and enhanced scroll animations** - `ce5c9f3` (feat)
2. **Task 2: Create Lightbox component for fullscreen image view** - `207bf4a` (feat)
3. **Task 3: Integrate Lightbox with ImageDetailPage and enhance action buttons** - `bafd323` (feat)

## Files Created/Modified
- `packages/web/lib/components/detail/Lightbox.tsx` - Fullscreen image viewer with zoom, keyboard/backdrop close
- `packages/web/lib/components/detail/HeroSection.tsx` - Updated heights (426px mobile, 60vh desktop), enhanced scroll animations, onClick handler
- `packages/web/lib/components/detail/ImageDetailPage.tsx` - Lightbox state management and rendering
- `packages/web/lib/components/detail/ImageDetailContent.tsx` - onHeroClick prop wiring

## Decisions Made

**1. Mobile hero height: 426px fixed per decoded.pen spec**
- Rationale: Design spec explicitly calls for 426px mobile height for consistent editorial aesthetic

**2. Desktop hero height: 60vh max 600px**
- Rationale: Balanced proportions on larger screens while maintaining immersive feel

**3. Simple zoom toggle (scale 1.5) instead of complex zoom library**
- Rationale: CONTEXT.md "Claude's discretion" - basic zoom sufficient for MVP, keeps bundle small

**4. Title fade completes at 30% scroll**
- Rationale: Smooth transition before user scrolls past hero section entirely

**5. Parallax ratio ~0.3 (image moves 100px over hero height)**
- Rationale: Subtle parallax effect that enhances depth without disorienting user

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - all features implemented as planned with no blocking issues.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Hero section fully functional with decoded.pen styling
- Scroll animations working correctly (parallax + fade)
- Lightbox ready for integration with other image views
- Ready for: Search UI implementation (v2-07-03), related images, shop grid refinements

**Blockers/Concerns:** None - all success criteria met.

---
*Phase: v2-07-search-image-detail*
*Completed: 2026-02-05*
