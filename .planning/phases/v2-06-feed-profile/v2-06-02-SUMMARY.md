# Phase v2-06 Plan 02: Profile Desktop & Mobile Layouts Summary

**One-liner:** ProfileHeaderCard integration with stats row, 2-column desktop layout, and responsive mobile header

---

## Metadata

```yaml
phase: v2-06-feed-profile
plan: 02
subsystem: ui-profile
status: complete
type: execute
wave: 1
completed: 2026-01-29
duration: 206s (3.4 minutes)

tags:
  - profile-page
  - responsive-layout
  - design-system
  - ProfileHeaderCard
  - decoded.pen

dependencies:
  requires:
    - v2-03-03 # ProfileHeaderCard component
  provides:
    - ProfileDesktopLayout component
    - ProfileStats hook for stats formatting
    - Responsive profile page layouts
    - Badge earned/locked styling
  affects:
    - Profile page user experience
    - Stats display patterns
```

---

## What Was Done

### Objective
Implement Profile page mobile and desktop layouts with decoded.pen design system styling.

### Tasks Completed

| # | Task | Commit | Status |
|---|------|--------|--------|
| 1 | Create ProfileDesktopLayout component | 2f066cd | ✅ Complete |
| 2 | Create ProfileStats hook | d2f83ca | ✅ Complete |
| 3 | Update ProfileHeader with ProfileHeaderCard | 7f28f7b | ✅ Complete |
| 4 | Update BadgeGrid with earned/locked styling | 22bee38 | ✅ Complete |
| 5 | Update profile page with responsive layout | 7cde5c9 | ✅ Complete |

### Key Changes

#### 1. ProfileDesktopLayout Component
**File:** `packages/web/lib/components/profile/ProfileDesktopLayout.tsx`
- New 2-column desktop layout wrapper
- Left column: 320px fixed width (profile card)
- Right column: flexible width (badges + activity)
- Hidden on mobile (`hidden md:flex`)
- Max width 6xl, 32px gap between columns

#### 2. ProfileStats Hook
**File:** `packages/web/lib/components/profile/StatsCards.tsx`
- Added `ProfileStats` hook returning formatted stats array
- Stats labels updated:
  - "Accepted" → "Solutions"
  - "Earnings" → "Points"
- Maintains existing `StatsCards` component for mobile grid
- Both exports available from index

#### 3. ProfileHeader Integration
**File:** `packages/web/lib/components/profile/ProfileHeader.tsx`
- Replaced custom Card with design-system ProfileHeaderCard
- Integrated stats row (Posts, Solutions, Points)
- Edit Profile button: secondary bg, rounded-full
- Simplified action buttons layout
- Kept motion wrapper for entrance animation

#### 4. Badge Styling
**File:** `packages/web/lib/components/profile/BadgeGrid.tsx`
- Added `isLocked` prop to BadgeItem
- Locked badges: secondary bg, muted icon, lock icon overlay
- Earned badges: accent bg, color icon (existing)
- Badge count display in header: "n/n" format
- Imported Lock icon from lucide-react

#### 5. Responsive Page Layout
**File:** `packages/web/app/profile/page.tsx`
- **Mobile layout:**
  - Sticky header with back button, "Profile" title, settings button
  - Stacked content: ProfileHeader → StatsCards → BadgeGrid → RankingList
  - Padding: px-4 py-4, space-y-4
- **Desktop layout:**
  - Global Header component
  - ProfileDesktopLayout with 2 columns
  - Stats integrated into ProfileHeader (no separate StatsCards)
  - pt-16 for header offset
- Modals available on both layouts

---

## Technical Details

### Components Modified

| Component | Changes | Impact |
|-----------|---------|--------|
| ProfileDesktopLayout | New component | Desktop 2-column structure |
| ProfileStats | New hook | Stats formatting for ProfileHeaderCard |
| ProfileHeader | ProfileHeaderCard integration | Stats moved into header card |
| StatsCards | Label updates, ProfileStats export | Mobile grid + hook pattern |
| BadgeGrid | Earned/locked styling | Visual badge differentiation |
| profile/page.tsx | Responsive layouts | Mobile/desktop UX |
| profile/index.ts | Export updates | Component availability |

### Design System Integration

**ProfileHeaderCard Features Used:**
- Avatar with image/initials fallback (60px mobile, 80px desktop)
- Display name and username display
- Optional bio with line-clamp-2
- Stats row with dividers (Posts, Solutions, Points)
- Actions slot for Edit Profile + Logout buttons

**Responsive Patterns:**
- Mobile: Single-column stacked layout
- Desktop: 2-column asymmetric layout (320px + flex)
- Conditional rendering: separate mobile/desktop sections
- Design tokens: max-w-6xl, gap-8, space-y-6

### Stats Updates

| Old Label | New Label | Reason |
|-----------|-----------|--------|
| Accepted | Solutions | Emphasize contributions |
| Earnings | Points | Match decoded.pen design |

---

## Files Changed

### Created
- `packages/web/lib/components/profile/ProfileDesktopLayout.tsx`

### Modified
- `packages/web/lib/components/profile/StatsCards.tsx`
- `packages/web/lib/components/profile/ProfileHeader.tsx`
- `packages/web/lib/components/profile/BadgeGrid.tsx`
- `packages/web/app/profile/page.tsx`
- `packages/web/lib/components/profile/index.ts`

### Exports Added
- `ProfileDesktopLayout` from profile index
- `ProfileStats` from StatsCards

---

## Decisions Made

### Decision 1: Stats Integration Location
**Context:** Stats could remain separate or integrate into ProfileHeaderCard

**Decision:** Integrate stats into ProfileHeaderCard on desktop, keep separate StatsCards on mobile

**Rationale:**
- ProfileHeaderCard supports stats row natively (design system feature)
- Desktop has space for integrated card (320px column)
- Mobile benefits from separate grid cards (larger tap targets)
- Maintains responsive flexibility

**Alternatives Considered:**
- Stats in header on both mobile/desktop → Mobile cards too small
- Stats separate on both → Underutilizes ProfileHeaderCard features

**Impact:** Desktop profile card more compact, mobile UX unchanged

---

### Decision 2: Mobile Header Pattern
**Context:** Mobile could use global Header or custom header

**Decision:** Custom sticky header with back button, title, settings

**Rationale:**
- Global Header designed for navigation, not page-specific actions
- Profile page needs back-to-home and quick settings access
- Sticky header keeps actions visible during scroll
- Matches decoded.pen mobile profile patterns

**Alternatives Considered:**
- Global Header with custom actions → Less clean, navigation conflicts
- No header, floating actions → Harder to discover, visual clutter

**Impact:** Mobile profile navigation more intuitive

---

### Decision 3: Badge Locked State
**Context:** Badge data doesn't have locked state field yet

**Decision:** Add `isLocked` prop to BadgeItem, prepare styling for future data

**Rationale:**
- Design spec shows earned/locked badge distinction
- Implementation ready when API provides locked badge data
- Visual styling established (secondary bg, lock icon overlay)
- Current badges render as earned (design preview)

**Alternatives Considered:**
- Wait for API data → Delays design implementation
- Mock locked data → Confuses real vs. mock state

**Impact:** Badge styling ready for gamification features

---

### Decision 4: Desktop Layout Wrapper Pattern
**Context:** 2-column layout could be inline or extracted component

**Decision:** Extract ProfileDesktopLayout as reusable component

**Rationale:**
- Clean separation of concerns (layout vs. content)
- Reusable for other profile-like pages
- Prop-based slots (profileSection, activitySection) flexible
- Hidden on mobile via tailwind (`hidden md:flex`)

**Alternatives Considered:**
- Inline grid in page.tsx → Less reusable, harder to maintain
- CSS Grid instead of flex columns → Less flexible for content height

**Impact:** Profile layout maintainable and reusable

---

## Verification

### ✅ Tests Passed
- TypeScript compilation: ✅ No errors
- ESLint: ✅ Only pre-existing warnings
- ProfileDesktopLayout component: ✅ Created
- ProfileStats hook: ✅ Exports correctly
- ProfileHeader: ✅ Uses ProfileHeaderCard
- BadgeGrid: ✅ Earned/locked styling
- Profile page: ✅ Responsive layouts

### Manual Testing Required
- [ ] Desktop 2-column layout displays correctly (320px + flex)
- [ ] Mobile sticky header stays visible on scroll
- [ ] Stats row shows in ProfileHeader on desktop
- [ ] StatsCards grid displays on mobile
- [ ] Edit Profile button: secondary bg, rounded-full
- [ ] Badge locked styling ready for API data
- [ ] Modals open correctly on both layouts
- [ ] Back button navigates to home

---

## Deviations from Plan

**None - plan executed exactly as written.**

All tasks completed as specified:
- ProfileDesktopLayout matches spec (320px left, flex right)
- ProfileStats returns stats array for ProfileHeaderCard
- ProfileHeader uses design-system component with stats
- BadgeGrid shows earned/locked distinction
- Profile page responsive with mobile header and desktop 2-column

---

## Next Phase Readiness

### For v2-06-03 (Feed & Profile Polish)
**Ready:**
- ✅ Profile page structure complete
- ✅ Desktop 2-column layout established
- ✅ Mobile responsive patterns defined
- ✅ ProfileHeaderCard integration working
- ✅ Badge styling prepared for gamification

**Considerations:**
- Badge locked state needs API integration (v2-06-03 or gamification phase)
- View All Activity button placeholder (needs activity page)
- Stats click handlers placeholder (needs detailed activity views)

### Tech Stack Impact
**No new dependencies added**

All changes use existing:
- Design-system ProfileHeaderCard
- Tailwind responsive utilities
- Motion for animations
- Lucide React icons (Lock icon)

---

## Related Documentation

- **Design Source:** `docs/design-system/decoded.pen` (Profile page spec)
- **ProfileHeaderCard:** `packages/web/lib/design-system/profile-header-card.tsx`
- **Context:** `.planning/phases/v2-06-feed-profile/v2-06-CONTEXT.md`
- **Previous Phase:** v2-05-03 (Card Component Integration)

---

## Session Notes

**Execution Pattern:** Autonomous (no checkpoints)

**Performance:**
- 5 tasks completed in 206 seconds (3.4 minutes)
- 5 atomic commits created
- TypeScript compilation: ~10 seconds per check
- All verifications passed

**Parallel Execution:**
- v2-06-01 (Feed Page) and v2-06-02 (Profile Page) executed in parallel
- Commits interspersed in git log
- No conflicts (separate file scopes)

---

*Plan completed: 2026-01-29*
*Duration: 3.4 minutes*
*Commits: 2f066cd, d2f83ca, 7f28f7b, 22bee38, 7cde5c9*
