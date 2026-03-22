---
phase: v2-03-card-components
plan: 03
subsystem: design-system
tags: [card, feed-card, profile-header-card, components, design-system, refactor]
requires:
  - v2-03-01 # Base Card component
provides:
  - FeedCard design-system component with image/overlay support
  - ProfileHeaderCard component for user profile display
  - Refactored existing FeedCard and ProfileHeader using Card base
affects:
  - Future content stream implementations
  - Profile page layouts
  - Feed layouts
tech-stack:
  added: []
  patterns:
    - Image-based card composition with overlay slots
    - User profile card with avatar/stats layout
    - Component refactoring to use design-system base
key-files:
  created:
    - packages/web/lib/design-system/feed-card.tsx
    - packages/web/lib/design-system/profile-header-card.tsx
  modified:
    - packages/web/lib/components/FeedCard.tsx
    - packages/web/lib/components/profile/ProfileHeader.tsx
    - packages/web/lib/design-system/index.ts
decisions:
  - decision: "FeedCard design-system base vs. feature component separation"
    rationale: "Design-system provides base FeedCard for composition, feature component adds GSAP Flip animations"
    phase: v2-03
    plan: 03
  - decision: "ProfileHeaderCard layout structure"
    rationale: "Avatar + info in flex row, optional stats row below with dividers for clean separation"
    phase: v2-03
    plan: 03
  - decision: "Preserve existing functionality during refactoring"
    rationale: "Maintain GSAP Flip animations and store integrations while migrating to Card base"
    phase: v2-03
    plan: 03
metrics:
  duration: 3.5 minutes
  completed: 2026-01-29
---

# Phase v2-03 Plan 03: FeedCard and ProfileHeaderCard Components Summary

**One-liner:** Created image-based FeedCard and user ProfileHeaderCard components with refactored implementations using design-system Card base.

## What Was Built

### Task 1: FeedCard Design-System Component (669ba98)
Created base FeedCard component in design-system for image-based content cards:
- 4:5 aspect ratio (Instagram-style) with flexible aspect options (1:1, 16:9)
- Overlay slot for badges/counts positioned bottom-right
- Optional footer children slot
- Interactive hover state with shadow elevation
- Link integration with Next.js Link wrapper
- FeedCardSkeleton for loading states

**Exports:**
- `FeedCard` (design-system base version)
- `FeedCardProps`
- `FeedCardSkeleton`

### Task 2: ProfileHeaderCard Component (d64dff7)
Created ProfileHeaderCard for user profile display:
- Avatar with image or initials fallback (60px mobile, 80px desktop)
- Display name and username with truncation
- Optional bio with line-clamp-2
- Optional stats row with dividers (followers, posts, etc.)
- Action buttons slot for settings/logout
- ProfileHeaderCardSkeleton for loading states

**Layout:**
```
┌────────────────────────────────────────┐
│  ┌──────┐                              │
│  │Avatar│  Display Name        [Actions]│
│  │      │  @username                    │
│  └──────┘  Bio text (max 2 lines)      │
├────────────────────────────────────────┤
│  [Stat 1]  [Stat 2]  [Stat 3]          │
└────────────────────────────────────────┘
```

**Exports:**
- `ProfileHeaderCard`
- `ProfileHeaderCardProps`
- `ProfileHeaderCardSkeleton`

### Task 3: Component Refactoring (7968cb9)
Refactored existing feature components to use design-system Card base:

**FeedCard.tsx:**
- Replaced `<article>` element with `<Card interactive>` component
- Preserved GSAP Flip animation setup
- Preserved `useTransitionStore` integration
- Preserved `handleClick` for FLIP state capture
- Updated `FeedCardSkeleton` to use Card

**ProfileHeader.tsx:**
- Replaced `motion.section` with `motion.div` wrapping `<Card>`
- Preserved `useProfileStore` and `useAuthStore` integrations
- Preserved `handleSettingsClick` and `handleLogout` functionality
- Maintained avatar image/initials logic

**design-system/index.ts:**
- Added `FeedCardBase` and `FeedCardBaseSkeleton` exports (aliased from feed-card.tsx)
- Added `ProfileHeaderCard` and `ProfileHeaderCardSkeleton` exports
- Exported corresponding type definitions

## Decisions Made

### 1. FeedCard Design-System vs. Feature Component Separation
**Context:** Need both reusable base and feature-specific FLIP animations

**Decision:** Design-system provides base FeedCard for composition, feature component adds GSAP Flip logic

**Rationale:**
- Design-system component focuses on visual layout and structure
- Feature component adds FLIP animation behavior specific to feed transitions
- Separation allows reuse of base without animation overhead

**Trade-offs:**
- Two components with similar names (FeedCard base vs. FeedCard feature)
- Exported as `FeedCardBase` to distinguish from feature version
- Added complexity but maintains single responsibility principle

### 2. ProfileHeaderCard Layout Structure
**Context:** User profile display needs avatar, name, bio, and actions

**Decision:** Avatar + info in horizontal flex row, optional stats below with dividers

**Rationale:**
- Avatar prominence in left position (standard pattern)
- Flexible layout with min-w-0 for text truncation
- Stats row separated by border and dividers for visual hierarchy
- Responsive sizing (60px → 80px avatar on desktop)

**Alternatives Considered:**
- Vertical layout: Less space-efficient on mobile
- Stats inline with name: Too crowded
- Grid layout: Over-engineered for current needs

### 3. Preserve Existing Functionality During Refactoring
**Context:** Existing FeedCard and ProfileHeader have critical integrations

**Decision:** Maintain all GSAP Flip animations and store connections while migrating to Card base

**Rationale:**
- GSAP Flip in FeedCard is core to feed → detail page transitions
- ProfileHeader store integrations manage auth state and user data
- Refactoring should improve structure without breaking behavior

**Implementation:**
- Kept `useTransitionStore`, `handleClick`, and Flip.getState in FeedCard
- Kept `useProfileStore`, `useAuthStore`, and logout flow in ProfileHeader
- Only replaced container elements (article → Card, section → Card)

## Technical Highlights

### Image-Based Card Composition
FeedCard demonstrates clean composition pattern:
```tsx
<Card interactive className="overflow-hidden p-0">
  <div className={cn("relative bg-muted", aspectRatioClasses[aspectRatio])}>
    <Image src={imageUrl} alt={alt} fill />
    <div className="absolute bottom-3 right-3">{overlay}</div>
  </div>
  {children && <div className="p-4">{children}</div>}
</Card>
```

### Avatar Fallback Pattern
ProfileHeaderCard implements initials fallback:
```tsx
{avatarUrl ? (
  <Image src={avatarUrl} alt={`${displayName} avatar`} fill />
) : (
  <div className="flex h-full w-full items-center justify-center bg-primary">
    {getInitials(displayName)}
  </div>
)}
```

### Stats Row with Dividers
Flexible stats display using divide utilities:
```tsx
<div className="flex items-center divide-x divide-border">
  {stats.map((stat, i) => (
    <div key={i} className="flex-1 flex-col items-center">
      <div className="text-lg font-bold">{stat.value}</div>
      <div className="text-xs text-muted-foreground">{stat.label}</div>
    </div>
  ))}
</div>
```

## Testing & Verification

### TypeScript Compilation
```bash
cd packages/web && npx tsc --noEmit
```
**Result:** ✅ No errors

### ESLint Checks
```bash
npx eslint lib/design-system/feed-card.tsx lib/design-system/profile-header-card.tsx \
  lib/components/FeedCard.tsx lib/components/profile/ProfileHeader.tsx --max-warnings 2
```
**Result:** ✅ 2 acceptable warnings (unused _error, img vs Image - both intentional)

### Functionality Preservation
```bash
# Verify FeedCard preserves FLIP integration
grep -l "useTransitionStore\|Flip" lib/components/FeedCard.tsx

# Verify ProfileHeader preserves store integrations
grep -l "useProfileStore\|useAuthStore" lib/components/profile/ProfileHeader.tsx
```
**Result:** ✅ Both files found, integrations preserved

### Export Verification
```bash
grep -E "FeedCard|ProfileHeaderCard" lib/design-system/index.ts
```
**Result:** ✅ All exports present:
- `FeedCardBase`, `FeedCardBaseSkeleton`, `FeedCardBaseProps`
- `ProfileHeaderCard`, `ProfileHeaderCardSkeleton`, `ProfileHeaderCardProps`

## Deviations from Plan

### Auto-fixed Issues

None - plan executed exactly as written.

## Next Phase Readiness

### For v2-03-04 (Overlay Components)
**Ready:** FeedCard overlay slot ready for Badge and ItemCount components

**Provides:**
- Overlay positioning (bottom-right absolute)
- Transparent passthrough for custom content

### For v2-03-05 (Skeleton Loading)
**Ready:** Both components have skeleton variants

**Provides:**
- FeedCardBaseSkeleton with image placeholder
- ProfileHeaderCardSkeleton with avatar/name/bio placeholders

### For Future Feed Pages
**Ready:** Refactored FeedCard maintains FLIP animations

**Provides:**
- Base Card styling consistency
- GSAP Flip transition support
- Interactive hover states

## Files Changed

### Created (2 files)
- `packages/web/lib/design-system/feed-card.tsx` (191 lines)
- `packages/web/lib/design-system/profile-header-card.tsx` (222 lines)

### Modified (3 files)
- `packages/web/lib/components/FeedCard.tsx` (replaced article with Card)
- `packages/web/lib/components/profile/ProfileHeader.tsx` (replaced motion.section with Card)
- `packages/web/lib/design-system/index.ts` (added 4 export lines)

## Commits

| Commit | Type | Description |
|--------|------|-------------|
| 669ba98 | feat | Add FeedCard design-system component |
| d64dff7 | feat | Add ProfileHeaderCard component |
| 7968cb9 | refactor | Refactor FeedCard and ProfileHeader to use Card component |

---

**Status:** ✅ Complete
**Plan Duration:** ~3.5 minutes
**Total Changes:** +413 lines (created), ~66 lines changed (refactored)
