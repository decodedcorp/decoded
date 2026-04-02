---
phase: 56-explore-ui-enhancement
plan: "01"
subsystem: design-system/components
tags: [css-variables, brand-color, spot-marker, ui-consistency]
dependency_graph:
  requires: []
  provides: [D-01, D-02]
  affects:
    - packages/web/lib/components/detail/SpotDot.tsx
    - packages/web/lib/components/main-renewal/HeroSpotMarker.tsx
tech_stack:
  added: []
  patterns:
    - CSS variable via inline style (backgroundColor/color/borderColor)
    - Tailwind class removal + style prop for CSS variable coloring
key_files:
  created: []
  modified:
    - packages/web/lib/components/detail/SpotDot.tsx
    - packages/web/lib/components/main-renewal/HeroSpotMarker.tsx
decisions:
  - "Keep rgba() for connector line borderTop and drop-shadow filter — CSS variables in inline JS filter strings are unreliable; add comment noting rgba matches --mag-accent"
  - "borderColor hover state uses var(--mag-accent) directly (no opacity) — acceptable slight brightness increase"
metrics:
  duration: "~10 minutes"
  completed: "2026-04-02"
  tasks_completed: 2
  files_modified: 2
---

# Phase 56 Plan 01: Spot Marker Brand Color Unification Summary

**One-liner:** Unified SpotDot and HeroSpotMarker to use `var(--mag-accent)` CSS variable for neon yellow brand color, replacing `hsl(var(--primary))` fallback and `bg-[#eafd67]`/`text-[#eafd67]` Tailwind classes.

## What Was Built

Two spot marker components now share the same brand color source via the `--mag-accent` CSS variable defined in `globals.css`. This ensures consistent neon yellow (#eafd67) rendering across the main page hero and detail page spot annotations.

## Tasks Completed

| Task | Description | Commit | Files |
|------|-------------|--------|-------|
| 1 | Unify SpotDot default color to brand CSS variable | b19e90a1 | SpotDot.tsx |
| 2 | Replace hardcoded hex colors in HeroSpotMarker with CSS variable | 6333fb61 | HeroSpotMarker.tsx |

## Changes Summary

### SpotDot.tsx
- Line 23: `"hsl(var(--primary))"` → `"var(--mag-accent)"` as the default dotColor fallback
- `accentColor` prop override mechanism preserved

### HeroSpotMarker.tsx
- Removed `bg-[#eafd67]` from dot and ping divs; replaced with `style={{ backgroundColor: "var(--mag-accent)" }}`
- Removed `text-[#eafd67]` from price text; replaced with `style={{ color: "var(--mag-accent)" }}`
- Replaced `"rgba(234,253,103,0.5)"` in hovered borderColor with `"var(--mag-accent)"`
- Kept `rgba(234,253,103,...)` for connector borderTop and drop-shadow filter with comments — CSS variables in inline JS filter strings are unreliable

## Verification Results

- `var(--mag-accent)` appears 5 times across both files (1 in SpotDot, 4 in HeroSpotMarker)
- Zero `bg-[#eafd67]` or `text-[#eafd67]` Tailwind classes remain
- TypeScript: no new errors introduced (pre-existing 1399 errors are from unrelated generated types)

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

- [x] `packages/web/lib/components/detail/SpotDot.tsx` modified — verified via grep
- [x] `packages/web/lib/components/main-renewal/HeroSpotMarker.tsx` modified — verified via grep
- [x] Commit b19e90a1 exists
- [x] Commit 6333fb61 exists
