# Quick Task 048: Magazine Personal Edition -> Modal

**Status:** Complete
**Commit:** acb6d1b
**Date:** 2026-03-05

## Changes

### PersonalIssueClient.tsx
- Added `isOpen` / `onClose` props (modal interface)
- Wrapped in fixed fullscreen overlay (z-70) with GSAP fade-in/fade-out
- Changed `<a>` links to `<button>` elements for close actions
- On close: resets personalStatus to idle, then calls onClose

### GenerateMyEdition.tsx
- Replaced `router.push("/magazine/personal")` with `onGenerate` callback prop
- Removed unused `useRouter` import

### DailyEditorialClient.tsx
- Added `isPersonalModalOpen` state
- Renders `PersonalIssueClient` as modal overlay
- Passes `onGenerate` callback to `GenerateMyEdition`

### /magazine/personal/page.tsx
- Changed to redirect to `/magazine` (preserves URL if bookmarked)
