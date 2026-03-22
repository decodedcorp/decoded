# Quick Task 049: SNS Slot Machine Animation on PersonalizeBanner

**Type:** quick
**Goal:** Replace static "핀터레스트" text in PersonalizeBanner headline with a slot machine animation cycling through SNS names (Instagram, Facebook, YouTube, TikTok, Pinterest, X) using theme accent color

## Plan 1: SNS Slot Machine Animation

### Task 1: Update PersonalizeBanner headline with slot machine animation

**files:** `packages/web/lib/components/main-renewal/PersonalizeBanner.tsx`
**action:**
- Change headline format from static `{data.headline}` to split text with animated slot machine
- Headline structure: "당신의 `[SNS NAME]`를 한 권의 잡지로" where `[SNS NAME]` cycles
- SNS list: Instagram, Facebook, YouTube, TikTok, Pinterest, X (Twitter)
- Animation: vertical scroll (top-to-bottom slide) with GSAP or CSS animation
- Highlighted SNS name uses `text-mag-accent` (theme accent color)
- Cycle interval: ~2 seconds per name
- Smooth transition: slide up old name, slide in new name from below (slot machine effect)
- Container overflow hidden to mask incoming/outgoing text
- Keep existing GSAP scroll-trigger animations intact

**verify:** Dev server shows cycling SNS names in PersonalizeBanner headline with accent color and smooth slot machine animation
**done:** Slot machine animation replaces static "핀터레스트" text

### Task 2: Update mock data and types

**files:** `packages/web/lib/components/main-renewal/mock/personalize-banner.json`, `packages/web/lib/components/main-renewal/types.ts`
**action:**
- Update headline in mock data to template format (e.g., remove "핀터레스트" since it's now dynamic)
- Optionally add `snsNames` array to PersonalizeBannerData type and mock data, or hardcode in component
- Keep backward compatibility

**verify:** Types compile, mock data valid
**done:** Data supports new slot machine headline
