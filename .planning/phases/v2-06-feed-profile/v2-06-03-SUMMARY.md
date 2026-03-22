---
phase: v2-06-feed-profile
plan: 03
subsystem: ui
tags: [activity-tabs, engagement, motion, animation, lucide-react]

# Dependency graph
requires:
  - phase: v2-06-02
    provides: Profile page layouts (mobile/desktop) and component structure
  - phase: v2-03-02
    provides: Card components with interactive styling
provides:
  - Activity tabs component with underline indicator
  - AnimatePresence fade transitions for tab content
  - Empty state components for all activity types
  - Engagement actions (like, comment, share) on feed cards
affects: [v2-07-search, feed-content, profile-activity-data]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Tab navigation with underline indicator
    - AnimatePresence mode="wait" for tab transitions
    - Empty state pattern with icon + message + CTA
    - Engagement overlay on cards
    - Native share API with clipboard fallback

key-files:
  created:
    - packages/web/lib/components/profile/ActivityTabs.tsx
    - packages/web/lib/components/profile/ActivityContent.tsx
    - packages/web/lib/components/profile/EmptyState.tsx
  modified:
    - packages/web/lib/components/FeedCard.tsx
    - packages/web/app/profile/page.tsx
    - packages/web/lib/components/profile/index.ts

key-decisions:
  - "ActivityTabs: 4 tabs (posts, spots, solutions, saved) with border-bottom underline"
  - "Tab transitions: AnimatePresence mode='wait' with 0.2s fade"
  - "Engagement actions: Heart (like), MessageCircle (comment), Share2 (share)"
  - "Like animation: scale-110 + primary color when active"
  - "Share: navigator.share on mobile, clipboard copy on desktop"
  - "Empty states: tab-specific icons, messages, and CTAs"

patterns-established:
  - "Tab navigation: Use ActivityTab type with onTabChange callback"
  - "Tab content wrapper: AnimatePresence with mode='wait' for clean transitions"
  - "Empty state structure: Icon circle + message + CTA button"
  - "Engagement button pattern: Icon + optional count + hover scale"

# Metrics
duration: 3min
completed: 2026-01-29
---

# Phase v2-06 Plan 03: Activity Tabs & Engagement Summary

**Activity tabs with AnimatePresence fade transitions and engagement actions (like, comment, share) for feed cards**

## Performance

- **Duration:** 3 min
- **Started:** 2026-01-29T13:10:45Z
- **Completed:** 2026-01-29T13:14:08Z
- **Tasks:** 5
- **Files modified:** 6

## Accomplishments
- Activity tabs component with 4 tabs (Posts, Spots, Solutions, Saved)
- Tab content fade transitions (0.2s, mode="wait")
- Empty state components with tab-specific icons, messages, and CTAs
- Engagement actions overlay on FeedCard (like, comment, share)
- Like animation with scale effect and primary color on active
- Share functionality with native share API (mobile) and clipboard (desktop)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create ActivityTabs component** - `901ee2f` (feat)
2. **Task 2: Create ActivityContent wrapper with fade transitions** - `db3f94d` (feat)
3. **Task 3: Create EmptyState component** - `ea92574` (feat)
4. **Task 4: Add engagement actions to FeedCard** - `d2395b9` (feat)
5. **Task 5: Integrate activity tabs into profile page** - `3ff69b1` (feat)

**Formatting fixes:** `9c0f992` (style: prettier)

## Files Created/Modified
- `packages/web/lib/components/profile/ActivityTabs.tsx` - Tab navigation with 4 tabs and underline indicator
- `packages/web/lib/components/profile/ActivityContent.tsx` - AnimatePresence wrapper for tab content fade transitions
- `packages/web/lib/components/profile/EmptyState.tsx` - Empty state component with tab-specific icons, messages, and CTAs
- `packages/web/lib/components/FeedCard.tsx` - Added engagement actions (like, comment, share) to bottom overlay
- `packages/web/app/profile/page.tsx` - Integrated activity tabs in mobile and desktop layouts
- `packages/web/lib/components/profile/index.ts` - Added exports for ActivityTabs, ActivityContent, EmptyState

## Decisions Made

**Tab Navigation Pattern:**
- ActivityTabs uses controlled component pattern with activeTab/onTabChange props
- Underline indicator positioned absolutely at bottom of active tab
- Border-bottom separator between tabs and content

**Tab Transitions:**
- AnimatePresence mode="wait" ensures previous content fully exits before new enters
- 0.2s fade duration balances smoothness with responsiveness
- Key prop on motion.div matches activeTab to trigger animation on changes

**Empty State Strategy:**
- Tab-specific configurations for icons (FileText, MapPin, Lightbulb, Bookmark)
- CTAs link to relevant pages (posts → /request, saved → /feed) or trigger placeholder actions
- Consistent styling: 64px icon circle, muted foreground, rounded-full CTA button

**Engagement Actions:**
- Positioned in bottom gradient overlay of FeedCard (below account name/time)
- Like button toggles state with scale animation and primary color
- Share uses navigator.share API when available (mobile), clipboard as fallback (desktop)
- Count displays only shown when > 0 to reduce visual clutter

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## Next Phase Readiness

- Activity tab structure ready for data integration
- Engagement actions ready for API hookup (TODO comments in place)
- Feed cards now support like/comment/share interactions
- Profile page displays activity tabs on both mobile and desktop
- Ready for Phase v2-07 (Search & Image Detail pages)

## Notes

- Engagement actions use local state for now (likeCount, commentCount, isLiked)
- API integration for like/unlike, comments, and engagement counts deferred
- ViewAllActivityButton on profile page marked as unused - likely to be removed when tabs are fully populated
- All new components follow design-system patterns (tokens, utilities)

---
*Phase: v2-06-feed-profile*
*Completed: 2026-01-29*
