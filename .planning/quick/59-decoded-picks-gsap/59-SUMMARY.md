---
phase: quick-59
plan: "01"
subsystem: main-page-animations
tags: [gsap, scroll-trigger, animation, framer-motion, main-page]
dependency_graph:
  requires: []
  provides: [GSAP ScrollTrigger animations for DecodedPickSection]
  affects: [packages/web/lib/components/main/DecodedPickSection.tsx]
tech_stack:
  added: []
  patterns:
    [useGSAP hook with scope, ScrollTrigger with toggleActions, parallax scrub]
key_files:
  created: []
  modified:
    - packages/web/lib/components/main/DecodedPickSection.tsx
decisions:
  - Keep AnimatePresence + reactive motion.div for spot hover (clip-path animation) — GSAP does not provide a clean API for reactive state-driven clip-path
  - overlayRef animated via GSAP fromTo with delay 0.6 inside same scrollTrigger trigger as image — avoids double trigger setup
  - style={{ opacity: 0 }} on all GSAP-animated elements — prevents content flash before GSAP initializes
metrics:
  duration: "~10 minutes"
  completed: "2026-03-19"
  tasks_completed: 1
  files_modified: 1
---

# Phase quick-59 Plan 01: DecodedPickSection GSAP ScrollTrigger Animations Summary

GSAP ScrollTrigger scroll animations replacing framer-motion whileInView in DecodedPickSection — header slides from left, spotlight image scales up with parallax scrub, item cards stagger from right, CTA fades up.

## Objective

Replace framer-motion `whileInView` entrance animations in `DecodedPickSection` with GSAP ScrollTrigger for more impactful, scroll-driven animations consistent with the rest of the main page.

## Tasks Completed

| #   | Task                                                      | Commit     | Files                    |
| --- | --------------------------------------------------------- | ---------- | ------------------------ |
| 1   | Replace framer-motion whileInView with GSAP ScrollTrigger | `01dc6c96` | `DecodedPickSection.tsx` |

## What Was Built

### Animation Changes

**Header (Editor's Choice + Decoded's Pick)**

- `motion.div` with `whileInView` replaced by plain `<div ref={headerRef} style={{ opacity: 0 }}>`
- GSAP `fromTo`: `{ opacity: 0, x: -60 }` → `{ opacity: 1, x: 0 }`, duration 1.2s, `power3.out`
- ScrollTrigger: `start: "top 85%"`, `toggleActions: "play none none none"`

**Spotlight Image**

- `motion.div` with `whileInView` replaced by plain `<div ref={imageWrapperRef} style={{ opacity: 0 }}>`
- GSAP reveal: `{ opacity: 0, scale: 0.92, y: 60 }` → `{ opacity: 1, scale: 1, y: 0 }`, duration 1.4s, `power2.out`
- Parallax scrub: `y: -40` over full scroll range (`start: "top bottom"`, `end: "bottom top"`, `scrub: true`)

**Overlay Text (artistName + title inside image)**

- `motion.div` with `animate` replaced by plain `<div ref={overlayRef} style={{ opacity: 0 }}>`
- GSAP: `{ opacity: 0, x: -20 }` → `{ opacity: 1, x: 0 }`, delay 0.6s, triggered by image wrapper

**Item Cards**

- `motion.div` with `whileInView` replaced by `<div className="decoded-pick-item" style={{ opacity: 0 }}>`
- GSAP stagger: `{ opacity: 0, x: 60, y: 20 }` → `{ opacity: 1, x: 0, y: 0 }`, stagger 0.12s, `power3.out`
- ScrollTrigger: `start: "top 80%"`, targets via `.decoded-pick-item` class selector

**CTA Link**

- Plain `<Link ref={ctaRef} style={{ opacity: 0 }}>`
- GSAP: `{ opacity: 0, y: 20 }` → `{ opacity: 1, y: 0 }`, duration 0.6s, `power2.out`

### Kept Unchanged

- `motion.div` for spotlight color clipping mask (reactive `animate` based on `activeSpotId` state)
- `AnimatePresence` + `motion.div` for spot ping/tooltip hover effects
- All spot interactivity (`onMouseEnter`, `onMouseLeave`, `onClick`)

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

- File exists: `packages/web/lib/components/main/DecodedPickSection.tsx` — FOUND
- Commit `01dc6c96` — FOUND
- No TypeScript errors in DecodedPickSection.tsx (pre-existing unrelated errors in other files excluded)
- `ScrollTrigger` present in file — CONFIRMED
- `AnimatePresence` preserved for spot hover — CONFIRMED
- All `whileInView` patterns removed — CONFIRMED
