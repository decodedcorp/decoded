---
phase: quick
plan: 260319-sdd
subsystem: main/HeroSection
tags: [neon-glow, toggle, animation, hero]
dependency_graph:
  requires: []
  provides: [HeroSection neon glow toggle]
  affects: [packages/web/lib/components/main/HeroSection.tsx]
tech_stack:
  added: []
  patterns: [AnimatePresence crossfade, useState toggle, CSS drop-shadow glow]
key_files:
  modified:
    - packages/web/lib/components/main/HeroSection.tsx
decisions:
  - AnimatePresence mode="sync" used so both images can overlap during crossfade
  - drop-shadow applied via inline style (not Tailwind) for triple-layer glow precision
  - Button placed at z-30 to sit above gradient overlays (z-10) and content (z-20)
metrics:
  duration: 5m
  completed: 2026-03-19
  tasks_completed: 1
  files_modified: 1
---

# Quick Task 260319-sdd: Hero Neon Glow Toggle Summary

**One-liner:** HeroSection gains a sparkle toggle button (top-right) that crossfades between the normal editorial image and 04_neon_glow.png with triple #eafd67 drop-shadow CSS glow.

## Tasks Completed

| Task | Name                                | Commit   | Files                                            |
| ---- | ----------------------------------- | -------- | ------------------------------------------------ |
| 1    | Add neon glow toggle to HeroSection | 14ed5d43 | packages/web/lib/components/main/HeroSection.tsx |

## What Was Built

Added a neon glow toggle to `HeroSection.tsx`:

1. **Toggle button** — absolute-positioned top-right (top-6 right-6 / md:top-8 md:right-8), z-30, 40x40px rounded-full with `backdrop-blur-sm`. Inactive: `bg-white/10 border-white/20`. Active: `bg-primary/20 border-primary/40` with icon color `#eafd67`. `whileTap={{ scale: 0.9 }}` for tactile feedback.

2. **Sparkle icon** — inline 4-point star SVG path, color transitions between `text-white/60` and `text-[#eafd67]`.

3. **Crossfade animation** — `AnimatePresence mode="sync"` wraps two keyed `motion.div` wrappers (`key="neon"` / `key="normal"`), each fading in/out over 0.6s. Both images use `absolute inset-0` so they overlap cleanly during transition.

4. **Neon image** — `/lab-assets/neon-test/04_neon_glow.png` at `opacity-90` with inline style `filter: drop-shadow(0 0 6px #eafd67) drop-shadow(0 0 15px #eafd67) drop-shadow(0 0 30px #eafd67)`.

5. **Normal image** — unchanged: `opacity-70 grayscale-[10%]`.

## Deviations from Plan

None - plan executed exactly as written.

## Self-Check: PASSED

- packages/web/lib/components/main/HeroSection.tsx: FOUND
- Commit 14ed5d43: FOUND
