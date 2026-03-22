---
phase: v2-06-feed-profile
plan: "01"
subsystem: feed-ui
tags: [feed, layout, design-system, responsive, decoded.pen]
requires: [v2-05-03]
provides:
  - feed-responsive-layout
  - feed-card-info-styling
  - feed-header-component
affects: [v2-06-02, v2-07-01]
tech-stack:
  added: []
  patterns: [responsive-grid, flex-column-layout, gradient-overlays]
key-files:
  created:
    - packages/web/lib/components/feed/FeedHeader.tsx
    - packages/web/lib/components/feed/index.ts
  modified:
    - packages/web/lib/components/FeedCard.tsx
    - packages/web/lib/components/VerticalFeed.tsx
    - packages/web/app/feed/FeedClient.tsx
    - packages/web/app/feed/page.tsx
decisions:
  - id: feed-header-desktop-only
    title: "Feed header hidden on mobile for space efficiency"
    rationale: "Mobile has limited vertical space and needs to prioritize content over headers"
    alternatives: ["Show smaller header on mobile"]
  - id: grid-layout-responsive
    title: "Responsive grid layout (1/2/3 columns)"
    rationale: "Decoded.pen design system specifies multi-column layout for desktop, single for mobile"
    alternatives: ["Keep single column on all devices"]
  - id: source-badge-gradient
    title: "Instagram/TikTok source badges with platform-specific gradients"
    rationale: "Platform recognition through branded visual styling"
    alternatives: ["Use generic badge colors"]
  - id: relative-time-format
    title: "Relative time format (1m, 2h, 3d)"
    rationale: "Matches social media conventions for recent content"
    alternatives: ["Show absolute timestamps"]
metrics:
  duration: 8m 30s
  completed: 2026-01-29
---

# Phase v2-06 Plan 01: Feed Page Layout & Styling Summary

**One-liner:** Responsive grid feed layout with decoded.pen card info styling (source badges, account names, relative time)

## What Was Built

Implemented Feed page mobile and desktop layouts with decoded.pen design system styling:

1. **FeedHeader Component**
   - Desktop-only header with "Latest Feed" title
   - Playfair Display 36px (font-serif text-4xl)
   - Horizontal padding: px-12 lg:px-16
   - Vertical padding: pt-8 pb-6

2. **Responsive Grid Layout**
   - Mobile: 1 column (grid-cols-1)
   - Tablet: 2 columns (md:grid-cols-2)
   - Desktop: 3 columns (lg:grid-cols-3)
   - Updated max-width and padding for larger screens

3. **FeedCard Info Styling**
   - Source badge with Instagram/TikTok gradients (top left)
   - Item count badge (top right)
   - Bottom gradient overlay (from-black/70 via-black/40 to-transparent)
   - Account name (Inter 16px semibold)
   - Relative time (Inter 12px, white/70 opacity)

4. **Layout Integration**
   - Flex column layout in FeedClient
   - FeedHeader above VerticalFeed
   - Proper header padding compensation in page.tsx
   - All state layouts updated (loading, error, empty, success)

## Deviations from Plan

None - plan executed exactly as written.

## Technical Implementation

### Components Created

```typescript
// FeedHeader.tsx
export function FeedHeader() {
  return (
    <div className="hidden md:block px-12 lg:px-16 pt-8 pb-6">
      <Heading variant="h1" className="font-serif text-4xl">
        Latest Feed
      </Heading>
    </div>
  );
}
```

### Helper Functions Added

```typescript
// Source badge styling
function getSourceBadgeStyles(source?: string): string {
  switch (source?.toLowerCase()) {
    case "instagram":
      return "bg-gradient-to-r from-[#F58529] via-[#DD2A7B] to-[#8134AF]";
    case "tiktok":
      return "bg-black";
    default:
      return "bg-muted-foreground/60";
  }
}

// Relative time formatting
function formatRelativeTime(date?: Date | string): string {
  // Returns: "Just now", "5m", "2h", "3d", or date string
}
```

### Layout Structure

```tsx
// FeedClient.tsx - All states use this pattern
<div className="flex flex-col h-full">
  <FeedHeader />
  <div className="flex-1 relative">
    <div className="h-full">
      <VerticalFeed ... />
    </div>
  </div>
</div>
```

### Responsive Grid Pattern

```tsx
// VerticalFeed.tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
  {items.map((item, index) => (
    <FeedCard key={item.id} item={item} index={index} priority={index < 3} />
  ))}
</div>
```

## Decisions Made

### Feed Header Desktop-Only
**Decision:** Hide feed header on mobile (hidden md:block)

**Rationale:** Mobile has limited vertical space with both top navigation and bottom mobile nav. Prioritizing content over header maximizes usable screen space.

**Impact:** Desktop users get clear page title context, mobile users get more content.

### Responsive Grid Columns
**Decision:** 1 column mobile, 2 tablet, 3 desktop

**Rationale:** Follows decoded.pen design system responsive patterns. Single column on mobile maintains focus and readability, multi-column on desktop utilizes screen space efficiently.

**Impact:** Better content density on larger screens while maintaining usability on mobile.

### Platform-Branded Source Badges
**Decision:** Instagram gradient (pink/purple), TikTok black, generic muted

**Rationale:** Immediate platform recognition through branded colors matches user expectations from social media.

**Impact:** Users can quickly identify content source without reading text.

### Relative Time Display
**Decision:** Show "5m", "2h", "3d" instead of full timestamps

**Rationale:** Matches social media conventions for recent content. Easier to scan than full dates.

**Impact:** More compact display, familiar UX pattern for feed-based content.

## Testing & Verification

### TypeScript Compilation
- All files compile without errors
- Type safety maintained for helper functions

### Linting
- ESLint passes (pre-existing warnings only)
- Prettier formatting applied
- No new linting errors introduced

### Layout Verification
- Feed header displays on desktop (md+)
- Feed header hidden on mobile (<md)
- Grid columns adjust responsively (1/2/3)
- Proper spacing and padding at all breakpoints

### Card Info Display
- Source badges show correct gradients
- Account names display when present
- Relative time formats correctly
- Bottom gradient overlay visible

### Functionality Preserved
- Infinite scroll still works with IntersectionObserver
- GSAP Flip animations preserved
- Loading states show skeleton cards
- Error states show retry button
- Empty states show appropriate messages

## Next Phase Readiness

### For v2-06-02 (Profile Page Layout)
- FeedHeader pattern can be adapted for ProfileHeader
- Responsive grid pattern reusable for profile sections
- Flex column layout pattern established

### For v2-07-01 (Search Page)
- Grid layout pattern proven
- Header component pattern established
- Responsive breakpoint strategy consistent

### For v2-08-01 (Image Detail)
- Card info overlay pattern (bottom gradient) can inspire detail page overlays
- Source badge styling reusable

### Blockers
None

### Concerns
None

## Files Changed

### Created (2 files)
- `packages/web/lib/components/feed/FeedHeader.tsx` - Desktop-only feed header
- `packages/web/lib/components/feed/index.ts` - Barrel export

### Modified (4 files)
- `packages/web/lib/components/FeedCard.tsx` - Added source badge, account, time with decoded.pen styling
- `packages/web/lib/components/VerticalFeed.tsx` - Changed to responsive grid layout
- `packages/web/app/feed/FeedClient.tsx` - Integrated FeedHeader, updated all state layouts
- `packages/web/app/feed/page.tsx` - Added layout wrapper with header padding

## Commit History

| Commit | Message | Files |
|--------|---------|-------|
| f7985df | feat(v2-06-01): create FeedHeader component | FeedHeader.tsx, index.ts |
| ff50194 | feat(v2-06-01): update FeedCard with decoded.pen card info styling | FeedCard.tsx |
| 8b30845 | feat(v2-06-01): update VerticalFeed to support grid layout | VerticalFeed.tsx |
| 521c4f8 | feat(v2-06-01): update FeedClient with FeedHeader integration | FeedClient.tsx |
| 7770449 | feat(v2-06-01): update feed page with layout wrapper | page.tsx |
| c3a3337 | style(v2-06-01): run prettier format | multiple files |

## Lessons Learned

### What Went Well
1. **Incremental commits** - Each task committed atomically made progress trackable
2. **Helper functions** - Extracting getSourceBadgeStyles and formatRelativeTime improved reusability
3. **Consistent patterns** - Flex column layout pattern worked across all states
4. **Preserved functionality** - All existing features (infinite scroll, FLIP animations) maintained

### What Could Improve
1. **Time formatting** - Consider extracting to shared utility for use across app
2. **Source badge styles** - Could be moved to design system tokens
3. **Skeleton state** - Could match card info overlay structure more closely

### Reusable Patterns
1. **Desktop-only header** - `hidden md:block` pattern for space-constrained mobile UX
2. **Flex column layout** - Header + flex-1 content area for consistent page structure
3. **Responsive grid** - `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` for adaptive layouts
4. **Bottom gradient overlay** - `from-black/70 via-black/40 to-transparent` for readable text on images

---

**Phase Progress:** 1/3 plans complete (33%)
**Status:** ✅ Complete
**Next:** v2-06-02 (Profile Page Layout)
