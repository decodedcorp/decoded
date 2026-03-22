---
type: quick
id: "006"
subsystem: ui
tags: [next.js, intercepting-routes, modal, gsap, request-flow]

key-files:
  created:
    - packages/web/lib/components/request/RequestFlowModal.tsx
    - packages/web/app/@modal/(.)request/upload/page.tsx
    - packages/web/app/@modal/(.)request/detect/page.tsx

patterns-established:
  - "RequestFlowModal: GSAP scale/fade animation pattern for request flow modals"
  - "Modal navigation: router.back() + store reset on close"

duration: ~5min
completed: 2026-02-05
---

# Quick Task 006: Desktop Request Page Modal

**Next.js intercepting routes for desktop modal request flow (upload/detect) with GSAP animations**

## Performance

- **Duration:** ~5 min
- **Tasks:** 3
- **Files created:** 3

## Accomplishments

- RequestFlowModal component with GSAP scale/fade animations
- Intercepting route for /request/upload with modal wrapper
- Intercepting route for /request/detect with compact split-view layout
- ESC key and backdrop click to close modal
- Automatic requestStore reset on modal close

## Task Commits

1. **Task 1: Create RequestFlowModal component** - `a0bdcad` (feat)
2. **Task 2: Create intercepting route for /request/upload** - `76fa0be` (feat)
3. **Task 3: Create intercepting route for /request/detect** - `6ae8448` (feat)

## Files Created

| File | Description |
|------|-------------|
| `packages/web/lib/components/request/RequestFlowModal.tsx` | Modal wrapper with GSAP animations, ESC/backdrop close |
| `packages/web/app/@modal/(.)request/upload/page.tsx` | Intercepting route - upload page in modal |
| `packages/web/app/@modal/(.)request/detect/page.tsx` | Intercepting route - detect page in modal with split view |

## Decisions Made

- **Modal animation pattern:** Used GSAP scale (0.95 -> 1) + fade for subtle entrance, matching existing ImageDetailModal pattern
- **Compact detect layout:** Split-view (50/50) with image left, cards right optimized for modal dimensions
- **Close behavior:** router.back() + resetRequestFlow() to maintain history and clean state
- **Mobile handling:** Intercepting routes only activate on desktop; mobile uses full page routes as before

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - TypeScript compiled without errors (pre-existing errors in shared package are unrelated).

## Verification Status

- [x] TypeScript compilation passes (no errors for request flow files)
- [x] Folder structure correct: `@modal/(.)request/upload` and `@modal/(.)request/detect`
- [x] Modal wrapper follows ImageDetailModal pattern

## Notes

- Mobile UX unchanged - intercepting routes only intercept on client-side navigation on desktop
- Direct URL access or mobile navigation will use the regular full-page routes

---
*Quick Task: 006*
*Completed: 2026-02-05*
