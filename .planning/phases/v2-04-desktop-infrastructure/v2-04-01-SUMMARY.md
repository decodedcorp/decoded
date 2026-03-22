---
phase: v2-04-desktop-infrastructure
plan: 01
subsystem: design-system
tags: [header, navigation, responsive, desktop, mobile]

requires:
  - v2-03-03 # Card components (ProfileHeaderCard pattern)

provides:
  - design-system/desktop-header.tsx # Desktop navigation header
  - design-system/mobile-header.tsx # Mobile compact header

affects:
  - v2-04-03 # Will use these headers in layout integration
  - v2-05 # Future footer and layout composition

tech-stack:
  added:
    - lucide-react icons (Search, Bell, SlidersHorizontal)
  patterns:
    - CVA variant-based component styling
    - Responsive breakpoint-driven visibility (md:hidden, hidden md:flex)
    - Zustand store integration for auth state

key-files:
  created:
    - packages/web/lib/design-system/desktop-header.tsx
    - packages/web/lib/design-system/mobile-header.tsx
  modified:
    - packages/web/lib/design-system/index.ts

decisions:
  - decision: Desktop header replaces sidebar navigation
    rationale: Modern web UX pattern, more screen space for content
    impact: Changes desktop navigation from left sidebar to top header
    ref: .planning/phases/v2-04-desktop-infrastructure/CONTEXT.md

  - decision: Separate components for desktop and mobile headers
    rationale: Clean separation of concerns, easier to maintain responsive behavior
    impact: Two distinct components instead of one responsive component

  - decision: Height tokens (64px desktop, 56px mobile)
    rationale: Standard header heights from decoded.pen design system
    impact: Consistent spacing across application

metrics:
  duration: 203 seconds
  completed: 2026-01-29
---

# Phase v2-04 Plan 01: Header Components Summary

> Responsive navigation headers for desktop and mobile viewports

## One-liner
Created DesktopHeader (64px, md+) and MobileHeader (56px, <md) with navigation, search, and auth UI using design-system patterns

## What Was Built

### DesktopHeader Component
**File:** `packages/web/lib/design-system/desktop-header.tsx`

Sticky header for desktop viewports (768px+) with three sections:

**Left Section:**
- DecodedLogo component (48x16, links to home)
- ASCII art logo with configurable animation

**Center Section:**
- Horizontal navigation: Home, Discover, Create
- Active state detection via usePathname()
- Styling: active (foreground + medium), inactive (muted-foreground + hover)

**Right Section:**
- Search icon button (triggers search expansion - handler passed as prop)
- Conditional auth UI from useAuthStore:
  - **Logged out:** Login button (outline variant)
  - **Logged in:** Notification bell + Avatar placeholder (initials circle)

**Features:**
- CVA variants: `default` (bg-background/95 + border) | `transparent`
- Height: 64px (--header-height-desktop)
- z-index: 30 (from tokens.zIndex.header)
- Backdrop blur for translucency
- Hidden on mobile (md:hidden pattern)

**Props Interface:**
```typescript
interface DesktopHeaderProps {
  variant?: 'default' | 'transparent';
  onSearchClick?: () => void;
  className?: string;
}
```

### MobileHeader Component
**File:** `packages/web/lib/design-system/mobile-header.tsx`

Compact header for mobile viewports (<768px):

**Left Section:**
- DecodedLogo (48x14, links to home)
- Hue rotation enabled for visual interest

**Right Section:**
- Search icon button
- Filter icon button (SlidersHorizontal, optional via `showFilter` prop)

**Features:**
- CVA variants: `default` (bg-background/80) | `transparent`
- Height: 56px (--header-height-mobile)
- Stronger backdrop blur (backdrop-blur-md)
- Visible only on mobile (md:hidden)

**Props Interface:**
```typescript
interface MobileHeaderProps {
  variant?: 'default' | 'transparent';
  onSearchClick?: () => void;
  onFilterClick?: () => void;
  showFilter?: boolean; // default: true
  className?: string;
}
```

### Design System Integration
**File:** `packages/web/lib/design-system/index.ts`

Added barrel exports:
```typescript
// Header Components
export { DesktopHeader, desktopHeaderVariants } from './desktop-header';
export type { DesktopHeaderProps } from './desktop-header';

export { MobileHeader, mobileHeaderVariants } from './mobile-header';
export type { MobileHeaderProps } from './mobile-header';
```

**Usage:**
```typescript
import { DesktopHeader, MobileHeader } from '@/lib/design-system';
```

## Deviations from Plan

None - plan executed exactly as written.

**Note:** Task 3 (export from index.ts) was completed as part of v2-04-02 work but is documented here for completeness. The commits d3ef7b3 and 9d9c1ed created the components, and commit ab7a58c added the exports.

## Implementation Details

### Navigation Pattern
Used Next.js `usePathname()` for active route detection:
```typescript
const pathname = usePathname();
const isActive = pathname === href;
```

Active styling via cn() utility:
```typescript
className={cn(
  "text-sm transition-colors",
  isActive
    ? "text-foreground font-medium"
    : "text-muted-foreground hover:text-foreground"
)}
```

### Auth Integration
DesktopHeader integrates with authStore for conditional UI:
```typescript
const user = useAuthStore((state) => state.user);

{user ? (
  // Notification bell + Avatar
) : (
  // Login button
)}
```

Avatar placeholder displays user initials:
```typescript
<span className="text-sm font-medium text-primary">
  {user.name.charAt(0).toUpperCase()}
</span>
```

### Responsive Strategy
**Desktop Header:**
- `hidden md:flex` - Hidden below 768px, flex above
- Desktop navigation, full feature set

**Mobile Header:**
- `md:hidden` - Hidden above 768px
- Compact layout, essential features only

### Styling Patterns
**CVA Variants:**
```typescript
export const desktopHeaderVariants = cva(
  "fixed top-0 left-0 right-0 z-30 w-full backdrop-blur-md transition-all hidden md:flex",
  {
    variants: {
      variant: {
        default: "bg-background/95 border-b border-border",
        transparent: "bg-transparent border-b border-transparent",
      },
    },
    defaultVariants: { variant: "default" },
  }
);
```

**Transparency for Hero Pages:**
`transparent` variant enables headers to sit over hero sections without background, letting content show through.

## Testing & Verification

### TypeScript Compilation
```bash
cd packages/web && npx tsc --noEmit
```
✅ No errors in header components (pre-existing errors unrelated)

### Linting
```bash
npx eslint lib/design-system/desktop-header.tsx lib/design-system/mobile-header.tsx
```
✅ Both components pass ESLint with no warnings

### Import Verification
```bash
# Verified barrel exports work
import { DesktopHeader, MobileHeader } from '@/lib/design-system';
```
✅ All exports available and type-safe

## Next Phase Readiness

### Ready for v2-04-03 (Layout Integration)
- ✅ Header components built and exported
- ✅ Responsive breakpoint strategy established
- ✅ Auth integration pattern demonstrated
- ⚠️ Search expansion logic not implemented (out of scope)
- ⚠️ Notification panel not implemented (out of scope)
- ⚠️ User menu dropdown not implemented (out of scope)

### Future Enhancements
**Search Expansion (v2-04-03 or later):**
- Implement search modal/dropdown triggered by onSearchClick
- Consider using Cmd+K shortcut for desktop

**User Menu (v2-05 or later):**
- Dropdown menu for avatar: Profile, Settings, Logout
- Use Radix UI DropdownMenu for accessibility

**Notification System (v2-06 or later):**
- Notification badge count on bell icon
- Notification panel/dropdown

## Artifacts Delivered

| Path | Type | Lines | Exports |
|------|------|-------|---------|
| `packages/web/lib/design-system/desktop-header.tsx` | Component | 157 | DesktopHeader, DesktopHeaderProps |
| `packages/web/lib/design-system/mobile-header.tsx` | Component | 110 | MobileHeader, MobileHeaderProps |
| `packages/web/lib/design-system/index.ts` | Barrel | +6 | Header exports |

**Total:** 267 lines of new component code

## Commits

| Task | Commit | Message |
|------|--------|---------|
| 1 | d3ef7b3 | feat(v2-04-01): create DesktopHeader component |
| 2 | 9d9c1ed | feat(v2-04-01): create MobileHeader component |
| 3 | ab7a58c* | feat(v2-04-02): export DesktopFooter from design-system barrel |

*Note: Task 3 (header exports) was included in v2-04-02 commit which also added footer exports. Header exports are lines 51-56 of index.ts.

## Learnings

### Design System Maturity
The CVA pattern for component variants continues to prove valuable:
- Type-safe variant composition
- Easy to extend with new variants
- Clean separation of base styles and variants

### Responsive Component Design
Separate components for desktop/mobile is cleaner than one mega-component:
- Easier to reason about breakpoint behavior
- Less conditional rendering complexity
- Each component optimized for its viewport

### Auth Integration Pattern
Using Zustand store selectors directly in components works well:
```typescript
const user = useAuthStore((state) => state.user);
```
No need for wrapper hooks or context providers.

### Logo Component Reuse
DecodedLogo's configurability (asciiFontSize, planeBaseHeight, enableWaves) makes it easy to adapt for different contexts:
- Desktop: larger, no waves, no hue rotation
- Mobile: smaller, no waves, hue rotation enabled

## References

- **Context:** `.planning/phases/v2-04-desktop-infrastructure/CONTEXT.md`
- **Design Tokens:** `packages/web/lib/design-system/tokens.ts`
- **Auth Store:** `packages/web/lib/stores/authStore.ts`
- **Logo Component:** `packages/web/lib/components/DecodedLogo.tsx`
- **Design Spec:** `docs/design-system/decoded.pen`
