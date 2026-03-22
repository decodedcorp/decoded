---
phase: m7-02-main-page-renewal
plan: 01
subsystem: ui
tags: [gsap, tilt-animation, neon-glow, hero, main-page, mock-data]

# Dependency graph
requires:
  - phase: m7-01-magazine-frontend-mock
    provides: mag-* Tailwind theme system, Playfair Display font, GSAP patterns
provides:
  - MainHeroData, GridItemData, PersonalizeBannerData TypeScript types
  - MainHero component with GSAP tilt animation and cinematic entry
  - NeonGlow reusable background effect component
  - Mock data fixtures for hero, grid, and personalize sections
affects: [m7-02-02, m7-02-03]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "GSAP mousemove tilt with hover media query guard"
    - "NeonGlow radial gradient layers with CSS drift animations"
    - "Noise grain overlay via external SVG"

key-files:
  created:
    - packages/web/lib/components/main-renewal/types.ts
    - packages/web/lib/components/main-renewal/MainHero.tsx
    - packages/web/lib/components/main-renewal/NeonGlow.tsx
    - packages/web/lib/components/main-renewal/mock/main-hero.json
    - packages/web/lib/components/main-renewal/mock/main-grid-items.json
    - packages/web/lib/components/main-renewal/mock/personalize-banner.json
  modified:
    - packages/web/tailwind.config.ts

key-decisions:
  - "NeonGlow uses CSS animations (not GSAP) for ambient drift -- lighter on performance"
  - "Tilt uses matchMedia('(hover: hover)') to disable on touch devices"

patterns-established:
  - "main-renewal/ directory separate from main/ -- old page stays intact until wired in Plan 03"
  - "NeonGlow as reusable decorative layer with color/intensity props"

requirements-completed: []

# Metrics
duration: 3min
completed: 2026-03-05
---

# Phase m7-02 Plan 01: Types + Mock Data + MainHero Summary

**Cinematic MainHero with GSAP mouse-tilt, NeonGlow radial gradients, noise grain overlay, and TypeScript types/mock data for all main page sections**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-05T08:49:45Z
- **Completed:** 2026-03-05T08:52:13Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- MainHero component with GSAP tilt animation on celebrity name (desktop-only via hover media query)
- NeonGlow component with 3 layered radial gradients and ambient CSS drift animations
- GSAP cinematic entry timeline: staggered fade-up for bg, glow, label, name, title, CTA
- TypeScript types for all 3 main page sections (hero, grid, banner)
- 3 mock data fixtures with realistic Korean fashion content

## Task Commits

Each task was committed atomically:

1. **Task 1: Types + Mock Data for Main Page Renewal** - `058780a` (feat)
2. **Task 2: MainHero Component with Tilt + NeonGlow + Noise** - `6df0da4` (feat)

## Files Created/Modified
- `packages/web/lib/components/main-renewal/types.ts` - MainHeroData, GridItemData, GridItemSpot, PersonalizeBannerData types
- `packages/web/lib/components/main-renewal/MainHero.tsx` - Cinematic hero with GSAP tilt + entry timeline
- `packages/web/lib/components/main-renewal/NeonGlow.tsx` - Reusable neon glow with layered radial gradients
- `packages/web/lib/components/main-renewal/mock/main-hero.json` - NEWJEANS editorial mock data
- `packages/web/lib/components/main-renewal/mock/main-grid-items.json` - 8 grid items with spots and varied aspect ratios
- `packages/web/lib/components/main-renewal/mock/personalize-banner.json` - Korean personalize CTA mock
- `packages/web/tailwind.config.ts` - Added neon-drift keyframe animations

## Decisions Made
- NeonGlow uses CSS animations for ambient drift (lighter than GSAP for decorative motion)
- Tilt detection uses `window.matchMedia('(hover: hover)')` rather than user-agent sniffing
- Perspective (800px) applied inline to the name element for 3D tilt effect
- CTA button uses border + mag-accent fill on hover (not solid white like old HeroSection)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Types and mock data ready for Plan 02 (MasonryGrid + PersonalizeBanner)
- NeonGlow is reusable and can be applied to other sections
- mag-* theme colors from m7-01 confirmed working in main-renewal context

---
*Phase: m7-02-main-page-renewal*
*Completed: 2026-03-05*
