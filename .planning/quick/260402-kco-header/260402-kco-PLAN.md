---
phase: quick
plan: 260402-kco
type: execute
wave: 1
depends_on: []
files_modified:
  - packages/web/lib/components/ConditionalNav.tsx
  - packages/web/lib/design-system/mobile-header.tsx
autonomous: true
requirements: ["mobile-header-bottom-nav", "mobile-logo-only-top"]

must_haves:
  truths:
    - "On mobile (<md), navigation items appear at the bottom of the screen (MobileNavBar already does this)"
    - "On mobile (<md), only the logo is shown at the top (no search, bell, filter, admin icons)"
    - "On desktop (md+), SmartNav remains unchanged"
  artifacts:
    - path: "packages/web/lib/design-system/mobile-header.tsx"
      provides: "Simplified mobile top bar with logo only"
    - path: "packages/web/lib/components/ConditionalNav.tsx"
      provides: "Conditional rendering logic for mobile vs desktop nav"
  key_links:
    - from: "packages/web/lib/components/ConditionalNav.tsx"
      to: "packages/web/lib/design-system/mobile-header.tsx"
      via: "MobileHeader import"
      pattern: "MobileHeader"
---

<objective>
Adjust the main page mobile responsive layout so that:
1. On mobile, the top header shows ONLY the logo (remove search, bell, filter, admin icons)
2. On mobile, the bottom navigation bar continues to handle navigation (already implemented via MobileNavBar)
3. Desktop layout (SmartNav) remains completely unchanged

Purpose: Standard mobile UX pattern -- minimal top bar with logo, bottom nav for thumb-reachable navigation.
Output: Updated MobileHeader (logo-only) and ConditionalNav (unchanged structure, already correct).
</objective>

<execution_context>
@/Users/kiyeol/.claude-pers/get-shit-done/workflows/execute-plan.md
@/Users/kiyeol/.claude-pers/get-shit-done/templates/summary.md
</execution_context>

<context>
@packages/web/lib/design-system/mobile-header.tsx
@packages/web/lib/components/ConditionalNav.tsx
@packages/web/lib/components/MobileNavBar.tsx
@packages/web/lib/components/main-renewal/SmartNav.tsx
@packages/web/app/layout.tsx

Current architecture:
- ConditionalNav renders: SmartNav (desktop md+), MobileHeader (mobile <md), MobileNavBar (mobile bottom)
- MobileHeader: logo + search + bell + admin shield + filter icons at top
- MobileNavBar: Home/Search/Editorial/Upload/Profile at bottom (already correct)
- SmartNav: full desktop header with logo, nav links, actions (hidden on mobile, no changes needed)
- MainContentWrapper: applies pt-14 (mobile) / pt-[72px] (desktop) top padding, pb-16 (mobile) / pb-0 (desktop) bottom padding
- Home page (pathname === "/") manages its own padding (no MainContentWrapper padding)

Key: MobileNavBar already handles bottom nav. The task is to simplify MobileHeader to logo-only.
</context>

<tasks>

<task type="auto">
  <name>Task 1: Simplify MobileHeader to logo-only on mobile</name>
  <files>packages/web/lib/design-system/mobile-header.tsx</files>
  <action>
Strip the MobileHeader component to show ONLY the DecodedLogo on mobile. Remove:
- Search icon button
- Bell/notifications button
- Admin Shield link
- Filter icon button
- All associated props (onSearchClick, onFilterClick, showFilter) -- mark as deprecated or remove
- Remove unused imports: Search, SlidersHorizontal, Bell, Shield
- Remove useAuthStore usage (no longer needed without admin icon)

The resulting component should be a simple fixed top bar with:
- Same positioning: fixed top-0, z-40, md:hidden, backdrop-blur-md
- Same height: 56px
- DecodedLogo centered or left-aligned (keep current left alignment with -ml-4 offset)
- Link to "/" wrapping the logo

Keep the CVA variants and MobileHeaderProps interface (but simplify -- remove callback/filter props).
Keep the className and variant props for flexibility.

The component should be minimal: ~30-40 lines.
  </action>
  <verify>
    <automated>cd /Users/kiyeol/development/decoded/decoded-monorepo && npx tsc --noEmit --project packages/web/tsconfig.json 2>&1 | head -30</automated>
  </verify>
  <done>MobileHeader renders only the DecodedLogo on mobile. No search/bell/filter/admin icons. TypeScript compiles without errors.</done>
</task>

<task type="auto">
  <name>Task 2: Update ConditionalNav and verify no broken imports</name>
  <files>packages/web/lib/components/ConditionalNav.tsx</files>
  <action>
ConditionalNav currently passes no props to MobileHeader (line 34: `<MobileHeader />`), so if Task 1 removes props correctly, this file needs NO changes.

However, verify that:
1. No other files pass onSearchClick/onFilterClick/showFilter props to MobileHeader
2. If any consumers pass removed props, update them to remove those props

Search the codebase for MobileHeader usage:
- `grep -r "MobileHeader" packages/web/ --include="*.tsx" --include="*.ts"`
- `grep -r "onSearchClick\|onFilterClick\|showFilter" packages/web/ --include="*.tsx" --include="*.ts"`

Fix any broken references. The design-system index.ts barrel export should still export MobileHeader and MobileHeaderProps (with simplified interface).
  </action>
  <verify>
    <automated>cd /Users/kiyeol/development/decoded/decoded-monorepo && npx tsc --noEmit --project packages/web/tsconfig.json 2>&1 | tail -5</automated>
  </verify>
  <done>All MobileHeader consumers compile. No broken imports or prop mismatches. Mobile shows logo-only top bar, desktop SmartNav unchanged.</done>
</task>

</tasks>

<verification>
1. `npx tsc --noEmit --project packages/web/tsconfig.json` passes
2. Visual check: On mobile viewport (<768px), top bar shows only the Decoded logo. Bottom nav bar shows Home/Search/Editorial/Upload/Profile icons.
3. Visual check: On desktop viewport (>=768px), SmartNav shows full header with logo, nav links, and action icons. No bottom nav bar visible.
</verification>

<success_criteria>
- Mobile top bar: logo only, no utility icons
- Mobile bottom nav: unchanged (Home, Search, Editorial, Upload, Profile)
- Desktop header: unchanged (SmartNav with full navigation)
- TypeScript compiles without errors
</success_criteria>

<output>
After completion, create `.planning/quick/260402-kco-header/260402-kco-SUMMARY.md`
</output>
