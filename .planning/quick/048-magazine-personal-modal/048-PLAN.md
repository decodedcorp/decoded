# Quick Task 048: Magazine Personal Page -> Modal

**Type:** quick
**Description:** Convert /magazine/personal page behavior to modal overlay on magazine page
**Created:** 2026-03-05

## Context

Currently `GenerateMyEdition` button navigates to `/magazine/personal` (separate page).
User wants this to open as a modal overlay on the magazine page instead.

## Tasks

### Task 1: Convert PersonalIssueClient to modal and integrate into DailyEditorialClient

**files:**
- `packages/web/lib/components/magazine/PersonalIssueClient.tsx`
- `packages/web/lib/components/magazine/GenerateMyEdition.tsx`
- `packages/web/app/magazine/DailyEditorialClient.tsx`

**action:**
1. Add `isOpen` and `onClose` props to `PersonalIssueClient` — wrap content in a fixed fullscreen modal overlay with z-50
2. Update `GenerateMyEdition` to accept an `onGenerate` callback prop instead of using `router.push`
3. In `DailyEditorialClient`, add state for modal open/close, render `PersonalIssueClient` as modal, pass `onGenerate` to `GenerateMyEdition`
4. The modal should have smooth open/close transitions
5. When modal closes, reset personalStatus to idle

**verify:** Modal opens from CTA button, shows all states (idle/generating/ready/error), closes properly
**done:** Personal edition flow works as modal overlay without page navigation
