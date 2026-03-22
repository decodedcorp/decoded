---
phase: quick
plan: 033
subsystem: ui
tags: [design-system, hotspot, spot-marker, animation, gsap, tailwind]

# Dependency graph
requires:
  - phase: quick-030
    provides: "Deterministic brand color for Hotspot component"
provides:
  - "Unified Hotspot component with all spot/marker capabilities"
  - "brandToColor utility as shared design system export"
  - "SpotMarker deprecated re-export for backward compatibility"
  - "spot-reveal animation in Tailwind config"
affects: [design-system, request-flow, image-detail]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Design system components absorb feature-specific implementations"
    - "Deprecated re-exports maintain backward compatibility during migration"
    - "Animation keyframes defined in both Tailwind config and globals.css"

key-files:
  created: []
  modified:
    - packages/web/lib/design-system/hotspot.tsx
    - packages/web/lib/design-system/index.ts
    - packages/web/tailwind.config.ts
    - packages/web/lib/components/request/SpotMarker.tsx
    - packages/web/lib/components/request/DetectionView.tsx
    - packages/web/lib/components/detail/ImageDetailModal.tsx

key-decisions:
  - "Hotspot absorbs SpotMarker functionality instead of creating separate component"
  - "SpotMarker becomes deprecated re-export wrapper for gradual migration"
  - "brandToColor extracted as shared utility for consistent brand colors"
  - "Glow effects use CSS custom property --hotspot-color for flexibility"
  - "spot-reveal animation in both Tailwind and globals.css for compatibility"

patterns-established:
  - "Selected state (scale-125 + enhanced glow) orthogonal to variant"
  - "Reveal animation delay calculated from Y position for stagger effect"
  - "Glow intensity varies by selection state (8px default, 12px+24px selected)"

# Metrics
duration: 4min
completed: 2026-02-12
---

# Quick Task 033: Unify Spot/Brand Color/Animation Design

**Consolidated SpotMarker and Hotspot into single design system component with reveal animation, brand color glow, and selected state support**

## Performance

- **Duration:** 4 min (237 seconds)
- **Started:** 2026-02-12T11:29:33Z
- **Completed:** 2026-02-12T11:33:30Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Unified duplicate spot marker implementations (SpotMarker → Hotspot)
- Enhanced Hotspot with reveal animation, glow effects, and selected state
- Extracted brandToColor utility for reusable deterministic brand colors
- Converted SpotMarker to backward-compatible deprecated re-export
- Added spot-reveal keyframes to Tailwind config for standardization

## Task Commits

Each task was committed atomically:

1. **Task 1: Enhance Hotspot component with reveal animation, glow, and selected state** - `b92b4c4` (feat)
2. **Task 2: Replace SpotMarker with Hotspot and create compatibility wrapper** - `034312f` (refactor)

## Files Created/Modified

- `packages/web/lib/design-system/hotspot.tsx` - Added brandToColor utility, selected/revealing/glow props, enhanced with animation and shadow support
- `packages/web/lib/design-system/index.ts` - Export brandToColor from hotspot module
- `packages/web/tailwind.config.ts` - Added spot-reveal animation and keyframes to theme.extend
- `packages/web/lib/components/request/SpotMarker.tsx` - Converted to deprecated re-export wrapper with migration guide
- `packages/web/lib/components/request/DetectionView.tsx` - Replaced SpotMarker with Hotspot (numbered variant, glow, reveal animation)
- `packages/web/lib/components/detail/ImageDetailModal.tsx` - Import brandToColor from design-system instead of local definition

## Decisions Made

1. **Hotspot absorbs SpotMarker instead of separate component**
   - Rationale: Both serve identical visual purpose (item markers on images). Consolidating reduces tech debt and ensures consistency.

2. **SpotMarker becomes deprecated re-export, not deleted**
   - Rationale: Maintains backward compatibility. Future code can gradually migrate to Hotspot. Migration guide provided in JSDoc.

3. **brandToColor extracted as shared utility**
   - Rationale: Deterministic brand color generation needed across multiple components. Shared utility prevents code duplication.

4. **Glow effects via CSS custom property --hotspot-color**
   - Rationale: Allows dynamic color overrides while maintaining consistent glow intensity calculation.

5. **spot-reveal animation in both Tailwind config and globals.css**
   - Rationale: Tailwind config enables Tailwind utilities (animate-spot-reveal), globals.css maintained for existing references. No conflicts, ensures compatibility.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

**Export missing from design-system barrel:**
- Issue: Initial build failed because brandToColor wasn't exported from lib/design-system/index.ts
- Resolution: Added brandToColor to Hotspot component export line in index.ts
- Verification: Build passed after adding export

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Hotspot component is now the single source of truth for all spot/marker UI
- SpotMarker can be gradually phased out (currently safe via re-export)
- brandToColor available for any component needing consistent brand colors
- Animation system unified in Tailwind config for easy reference

### Tech Debt Reduced

- Eliminated duplicate SpotMarker implementation
- Consolidated animation definitions (spot-reveal now in Tailwind)
- Removed inline brandToColor duplications

### Potential Future Work

- Migrate remaining SpotMarker references to Hotspot (low priority - re-export works)
- Consider removing globals.css spot-reveal definition once Tailwind adoption complete
- Add unit tests for brandToColor deterministic hashing

---
*Phase: quick-033*
*Completed: 2026-02-12*
