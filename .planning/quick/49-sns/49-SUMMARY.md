---
quick_task: 049
name: SNS Slot Machine Animation on PersonalizeBanner
status: complete
completed: 2026-03-05
duration: ~3min
commits:
  - hash: 5805697
    type: feat
    description: Add SNS slot machine animation to PersonalizeBanner
  - hash: 4052182
    type: chore
    description: Update types and mock data for SNS slot machine
key_files:
  modified:
    - packages/web/lib/components/main-renewal/PersonalizeBanner.tsx
    - packages/web/lib/components/main-renewal/types.ts
    - packages/web/lib/components/main-renewal/mock/personalize-banner.json
tags: [gsap, animation, slot-machine, personalize-banner, main-page]
---

# Quick Task 049: SNS Slot Machine Animation Summary

GSAP-powered slot machine animation cycling through SNS names (Instagram, Facebook, YouTube, TikTok, Pinterest, X) in PersonalizeBanner headline with theme accent color.

## What Changed

### PersonalizeBanner Component
- Replaced static "핀터레스트" headline with slot machine animation
- Headline structure: "당신의 [SNS NAME] 를 한 권의 잡지로" where SNS name cycles every 2 seconds
- GSAP vertical slide animation: current name slides up and fades out, new name slides up from below
- SNS name rendered in `text-mag-accent` for theme accent color
- Overflow-hidden container masks the animation edges
- All existing GSAP scroll-trigger animations preserved (text fade-up, CTA slide-up)
- Supports optional `snsNames` from data prop, falls back to built-in list

### Types & Mock Data
- Added optional `snsNames?: string[]` field to `PersonalizeBannerData` interface
- Updated mock headline to generic format
- Added `snsNames` array to mock JSON for configurability

## Deviations from Plan

None - plan executed exactly as written.

## Verification

- TypeScript compilation: clean (no errors)
- Existing scroll-trigger animations intact
- Animation uses GSAP (already imported, no new dependencies)
