---
phase: 56-explore-ui-enhancement
plan: "03"
subsystem: detail-page
tags: [brand-color, magazine, editorial, d-06, d-07, d-08]
dependency_graph:
  requires: []
  provides: [detail-brand-color-unified]
  affects: [ImageDetailContent, MagazineEditorialSection, MagazineContent, ImageDetailModal, ImageDetailPreview]
tech_stack:
  added: []
  patterns: [CSS variable --mag-accent, opacity-based alpha instead of hex+alpha concat]
key_files:
  created: []
  modified:
    - packages/web/lib/components/detail/ImageDetailContent.tsx
    - packages/web/lib/components/detail/magazine/MagazineEditorialSection.tsx
    - packages/web/lib/components/detail/magazine/MagazineContent.tsx
    - packages/web/lib/components/detail/ImageDetailModal.tsx
    - packages/web/lib/components/detail/ImageDetailPreview.tsx
decisions:
  - "accentColor is always 'var(--mag-accent)' — per-post design_spec.accent_color override removed from all detail components"
  - "Pull quote accent lines use backgroundColor: var(--mag-accent) with opacity: 0.3 — avoids hex+alpha concatenation which breaks on CSS variable strings"
  - "MagazineEditorialSection accentStyle is now hardcoded to brand color — component self-sufficient regardless of prop value"
metrics:
  duration: "8 minutes"
  completed_date: "2026-04-02"
  tasks_completed: 2
  files_modified: 5
---

# Phase 56 Plan 03: Detail Page Brand Color Unification Summary

Brand color unification across all detail page components — `accentColor` is always `"var(--mag-accent)"` (neon yellow `#eafd67`) replacing per-post `design_spec.accent_color` overrides.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Replace per-post accent with brand color in ImageDetailContent | f44ae010 | ImageDetailContent.tsx |
| 2 | Update MagazineEditorialSection and MagazineContent accent fallbacks | 4845f014 | MagazineEditorialSection.tsx, MagazineContent.tsx, ImageDetailModal.tsx, ImageDetailPreview.tsx |

## What Was Built

Three plan-specified files plus two additional detail components (ImageDetailModal, ImageDetailPreview) were updated to use the global brand color `var(--mag-accent)` for all magazine accent styling. The per-post `design_spec.accent_color` override pattern is fully eliminated from the detail page.

Key changes:
- `ImageDetailContent.tsx`: `accentColor` now always `"var(--mag-accent)"`, `magazineCssVars` simplified (always set)
- `MagazineEditorialSection.tsx`: `accentStyle` hardcoded to brand color; pull quote accent line decorations use `backgroundColor: "var(--mag-accent)", opacity: 0.3` instead of `${accentColor}4D` hex concatenation (which breaks on CSS variable strings)
- `MagazineContent.tsx`: `accentColor` always `"var(--mag-accent)"`, `cssVars` always set
- `ImageDetailModal.tsx` + `ImageDetailPreview.tsx`: same pattern applied (D-08 auto-fix)

D-07 verified: `useTextLayout` import and invocation preserved in `MagazineEditorialSection.tsx`.
D-06 verified: No `PostBadge` import or JSX in any detail component.

## Decisions Made

1. **`accentColor = "var(--mag-accent)"`** — single-source brand color assignment at each component root; child components receive CSS variable string rather than hex
2. **opacity: 0.3 instead of hex+alpha** — `${accentColor}4D` pattern breaks when `accentColor` is a CSS variable reference (not a hex string); opacity approach works universally
3. **MagazineEditorialSection self-sufficient** — accentStyle no longer depends on prop; component always renders with brand color regardless of what parent passes

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Correctness] Fixed ImageDetailModal and ImageDetailPreview per-post accent_color**
- **Found during:** Task 2 verification (`grep -rn 'design_spec.*accent_color' packages/web/lib/components/detail/`)
- **Issue:** Plan verification required 0 results across entire `detail/` directory, but `ImageDetailModal.tsx` (line 225) and `ImageDetailPreview.tsx` (line 69) still used `design_spec.accent_color`
- **Fix:** Applied same brand color unification pattern to both files; also cleaned up `|| 'hsl(var(--primary) / 0.3)'` fallback in ImageDetailPreview blockquote border
- **Files modified:** `ImageDetailModal.tsx`, `ImageDetailPreview.tsx`
- **Commit:** 4845f014

## Verification Results

1. `grep -rn 'design_spec.*accent_color' packages/web/lib/components/detail/` (excluding comments) — 0 results
2. `grep -rn 'var(--mag-accent)' packages/web/lib/components/detail/` — 8 matches across 5 files
3. `grep -rn 'PostBadge' packages/web/lib/components/detail/` — only comment (no import/JSX)
4. `grep -n 'useTextLayout' packages/web/lib/components/detail/magazine/MagazineEditorialSection.tsx` — lines 8 and 26 (D-07 preserved)
5. TypeScript errors in worktree are pre-existing "Cannot find module" from missing node_modules — no errors in our modified files' code logic

## Self-Check: PASSED

- packages/web/lib/components/detail/ImageDetailContent.tsx — FOUND (modified)
- packages/web/lib/components/detail/magazine/MagazineEditorialSection.tsx — FOUND (modified)
- packages/web/lib/components/detail/magazine/MagazineContent.tsx — FOUND (modified)
- packages/web/lib/components/detail/ImageDetailModal.tsx — FOUND (modified)
- packages/web/lib/components/detail/ImageDetailPreview.tsx — FOUND (modified)
- Commit f44ae010 — FOUND
- Commit 4845f014 — FOUND
