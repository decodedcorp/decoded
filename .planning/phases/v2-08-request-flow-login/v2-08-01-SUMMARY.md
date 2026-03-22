---
phase: v2-08-request-flow-login
plan: 01
subsystem: ui
tags: [request-flow, design-system, decoded-pen, step-indicator, dropzone, zustand]

# Dependency graph
requires:
  - phase: v2-01-design-system-foundation
    provides: Design tokens (colors, spacing, typography)
  - phase: v2-02-core-interactive-components
    provides: Button, Input components with variants
provides:
  - 3-step Request flow (Upload, Detect, Details)
  - decoded.pen styled StepIndicator (3 dots, no connecting lines)
  - decoded.pen styled RequestFlowHeader (56px height)
  - decoded.pen styled DropZone (dashed border, design tokens)
  - Integrated Submit in Details step
affects: [v2-08-request-flow-login, request-flow, upload-flow]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "3-step flow pattern: Upload → Detect → Details (Submit merged)"
    - "StepIndicator: Primary color for active/completed, #3D3D3D for incomplete"
    - "RequestFlowHeader: 56px height with centered StepIndicator"
    - "DropZone: decoded.pen dashed border with design tokens"

key-files:
  created: []
  modified:
    - packages/web/lib/stores/requestStore.ts
    - packages/web/lib/components/request/StepIndicator.tsx
    - packages/web/lib/components/request/RequestFlowHeader.tsx
    - packages/web/lib/components/request/DropZone.tsx
    - packages/web/lib/components/request/DetailsStep.tsx
    - packages/web/lib/components/request/RequestModal.tsx

key-decisions:
  - "Consolidate 4-step flow to 3 steps by merging Submit into Details"
  - "Remove connecting lines between step dots for cleaner UI"
  - "Use Primary color (#D9FC69) for active/completed steps"
  - "Remove title text from RequestFlowHeader, center StepIndicator only"
  - "Replace Camera icon with Upload icon in DropZone"

patterns-established:
  - "Step consolidation: Merge final confirmation step into details form"
  - "StepIndicator: Fixed 8px dots with 8px gap, no scale on active"
  - "DropZone: Design system tokens (border-border, bg-muted, text-muted-foreground)"

# Metrics
duration: 4min
completed: 2026-02-05
---

# Phase v2-08 Plan 01: Request Flow Design System Summary

**3-step Request flow with decoded.pen styling (StepIndicator, RequestFlowHeader, DropZone) and integrated Submit in Details**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-05T10:46:11Z
- **Completed:** 2026-02-05T10:50:23Z
- **Tasks:** 3
- **Files modified:** 6

## Accomplishments
- Consolidated 4-step flow to 3 steps (Upload, Detect, Details) by merging Submit into Details
- Applied decoded.pen design system to StepIndicator (3 dots, Primary color, no connecting lines)
- Updated RequestFlowHeader to 56px height with centered StepIndicator
- Styled DropZone with decoded.pen tokens (dashed border, design system colors)
- Integrated Submit button into DetailsStep with loading states and error handling

## Task Commits

Each task was committed atomically:

1. **Task 1: Update RequestStore and StepIndicator for 3-step flow** - `17498d0` (feat)
2. **Task 2: Update RequestFlowHeader and DropZone with decoded.pen styling** - `ac3b9f1` (feat)
3. **Task 3: Integrate Submit functionality into DetailsStep** - `792a8e1` (feat)

**Formatting:** `f872c47` (style: prettier auto-format)

## Files Created/Modified
- `packages/web/lib/stores/requestStore.ts` - Changed RequestStep type from 1|2|3|4 to 1|2|3, updated canProceedToNextStep
- `packages/web/lib/components/request/StepIndicator.tsx` - 3 dots without connecting lines, Primary color for active/completed
- `packages/web/lib/components/request/RequestFlowHeader.tsx` - 56px height, centered StepIndicator, removed title text
- `packages/web/lib/components/request/DropZone.tsx` - Design system tokens (border-border, bg-muted), Upload icon, removed keyboard hint
- `packages/web/lib/components/request/DetailsStep.tsx` - Integrated Submit button with loading/error states, category loading handling
- `packages/web/lib/components/request/RequestModal.tsx` - Removed Step 4 rendering, updated STEP_TITLES, pass onClose to DetailsStep

## Decisions Made

**1. 3-step flow consolidation**
- Merged Submit step into Details step to reduce user friction
- Submit button appears at bottom of Details form
- Validation and loading states handled inline

**2. StepIndicator simplification**
- Removed connecting lines between dots per decoded.pen spec
- Fixed 8px size with 8px gap (no scale effect on active)
- Active/completed steps use Primary color (#D9FC69)
- Incomplete steps use #3D3D3D for clear visual hierarchy

**3. RequestFlowHeader layout**
- 56px height (h-14) per decoded.pen specification
- Removed title text, StepIndicator is centered by itself
- Clean layout: back arrow | StepIndicator | close X

**4. DropZone design tokens**
- Replaced foreground/XX colors with design system tokens
- border-border, bg-background, bg-muted, text-muted-foreground
- Upload icon instead of Camera icon for consistency
- Removed keyboard shortcut hint for cleaner UI

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Request flow now uses decoded.pen design system
- Ready for Detection step and Details step UI refinements (v2-08-02)
- Submit functionality integrated and tested

---
*Phase: v2-08-request-flow-login*
*Completed: 2026-02-05*
