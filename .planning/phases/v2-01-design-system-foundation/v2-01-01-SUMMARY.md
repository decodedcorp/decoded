---
phase: v2-01-design-system-foundation
plan: 01
type: execute
subsystem: design-system
tags: [design-tokens, typography, colors, spacing, frontend]
requires: []
provides:
  - design-tokens-module
  - typography-scales
  - responsive-typography
  - semantic-colors
  - spacing-system
affects: [v2-01-02]
tech-stack:
  added: []
  patterns:
    - design-tokens
    - css-variables
    - type-safe-tokens
key-files:
  created:
    - packages/web/lib/design-system/tokens.ts
    - packages/web/lib/design-system/index.ts
  modified: []
decisions:
  - id: design-tokens-structure
    choice: "Export const objects with 'as const' for type inference"
    rationale: "Enables TypeScript to infer exact literal types, providing better autocomplete and type safety"
  - id: color-token-approach
    choice: "Reference CSS variables instead of hardcoded values"
    rationale: "Maintains single source of truth in globals.css, supports light/dark mode without code changes"
  - id: responsive-typography-format
    choice: "Use Tailwind class names for responsive scales"
    rationale: "Easier to apply in components, consistent with existing codebase patterns"
metrics:
  duration: 92s
  completed: 2026-01-29
---

# Phase [v2-01] Plan [01]: Design Tokens Foundation Summary

Design tokens module with typography, colors, spacing, and responsive scales extracted from decoded.pen.

## What Was Built

Created a comprehensive design tokens system that serves as the single source of truth for design values across the application.

### Design Tokens Module (`tokens.ts`)

**Typography System:**
- Font families: Playfair Display (serif), Inter (sans), JetBrains Mono (mono)
- Typography scales: hero (64px), h1 (48px), h2 (36px), h3 (28px), h4 (24px), body (16px), small (14px), caption (12px)
- All scales include fontSize, lineHeight, fontWeight, fontFamily, letterSpacing

**Responsive Typography:**
- Page title: 24px (mobile) → 30px (tablet) → 36px (desktop)
- Section title: 20px (mobile) → 24px (tablet/desktop)
- Card title: 16px (mobile) → 18px (tablet/desktop)
- Body: 14px (mobile) → 16px (tablet/desktop)
- Caption: 12px (mobile/tablet) → 14px (desktop)

**Color Tokens:**
- All semantic colors reference CSS variables from globals.css
- Includes: background, foreground, primary, secondary, muted, accent, destructive
- UI colors: border, input, ring
- Component colors: card, popover, sidebar
- Chart colors: chart-1 through chart-5
- Main page colors: mainBg, mainCtaBg, mainAccent

**Spacing System:**
- Based on 4px base unit (from spacing.md)
- Scale: 0px → 2px → 4px → 6px → 8px → 10px → 12px → 16px → 20px → 24px → 32px → 40px → 48px → 64px → 80px → 96px → 128px

**Additional Tokens:**
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px), 2xl (1536px)
- Shadows: 2xs, xs, sm, md, lg, xl, 2xl (reference CSS variables)
- Border radius: none, sm, md, lg, xl, 2xl, full, main
- Z-index scale: base (0) → floating (10) → dropdown (20) → header (30) → sidebar (40) → modalBackdrop (50) → modal (60) → toast (70) → tooltip (100)

**TypeScript Types:**
- Exported types for all token categories: `TypographySize`, `ResponsiveTypography`, `ColorToken`, `SpacingToken`, `BreakpointToken`, `ShadowToken`, `BorderRadiusToken`, `ZIndexToken`

### Module Structure

```
packages/web/lib/design-system/
├── tokens.ts     # All design token exports
└── index.ts      # Barrel export
```

## Implementation Details

### Type Safety Approach

Used `as const` assertions on all token objects to enable:
1. Exact literal type inference (e.g., `"16px"` not just `string`)
2. IDE autocomplete for all token keys
3. Type errors when using non-existent tokens

### Color Token Strategy

Instead of hardcoding color values, we reference CSS custom properties:
```typescript
primary: 'var(--primary)',  // Not '#9FFF00'
```

**Benefits:**
- Single source of truth (globals.css)
- Automatic light/dark mode support
- No code changes needed for color adjustments

### Responsive Typography Format

Responsive scales use Tailwind class names:
```typescript
pageTitle: {
  mobile: 'text-2xl',   // Directly usable in className
  tablet: 'text-3xl',
  desktop: 'text-4xl',
}
```

This enables easy responsive application:
```tsx
<h1 className={responsiveTypography.pageTitle.mobile + ' md:' + responsiveTypography.pageTitle.tablet}>
```

## Deviations from Plan

### Consolidated Tasks

**Original plan:** Task 1 (basic tokens) + Task 2 (responsive typography) as separate tasks.

**Actual implementation:** Combined both tasks into a single tokens.ts file.

**Rationale:**
- Responsive typography is a natural extension of the base typography system
- Having both in one file maintains cohesion
- Avoids unnecessary file modifications and commits
- Still follows single responsibility (all typography concerns)

**Classification:** Efficiency optimization (Rule not applicable - this is a planning deviation, not a code issue)

## Verification Results

### TypeScript Compilation
```bash
cd packages/web && npx tsc --noEmit
```
✅ PASSED - No type errors

### Import Verification
```typescript
import { typography, responsiveTypography, colors, spacing } from '@/lib/design-system';
```
✅ PASSED - All exports accessible

### Token Value Validation
- ✅ Typography sizes match decoded.pen (64px, 48px, 36px, 28px, 24px)
- ✅ Responsive scales match typography.md table
- ✅ Spacing follows 4px base unit from spacing.md
- ✅ Colors reference correct CSS variables from globals.css
- ✅ Shadows reference correct CSS variables
- ✅ Z-index scale matches spacing.md

## Next Phase Readiness

### Ready for v2-01-02 (Tailwind Configuration)
- ✅ Design tokens module complete and importable
- ✅ All token categories available for Tailwind theme extension
- ✅ TypeScript types exported for type-safe usage
- ✅ No blockers or concerns

### Integration Points
The tokens module can now be:
1. Imported in tailwind.config.ts to extend theme
2. Used directly in components for inline styles
3. Referenced in utility functions for style composition
4. Type-checked with exported TypeScript types

## Files Created

| File | Purpose | Exports |
|------|---------|---------|
| `packages/web/lib/design-system/tokens.ts` | Design token definitions | `typography`, `responsiveTypography`, `colors`, `spacing`, `breakpoints`, `shadows`, `borderRadius`, `zIndex`, type exports |
| `packages/web/lib/design-system/index.ts` | Barrel export | Re-exports all from tokens.ts |

## Commit History

| Commit | Message |
|--------|---------|
| `debeb59` | feat(v2-01-01): create design tokens file with typography, colors, and spacing |

## Success Criteria Met

- ✅ Design tokens file created with all required exports
- ✅ TypeScript types properly inferred with `as const`
- ✅ Values match decoded.pen and documentation specifications
- ✅ File can be imported from any component
- ✅ Typography scales include hero, h1-h4, body, small, caption
- ✅ Responsive typography scales match documentation table
- ✅ Spacing based on 4px base unit
- ✅ Colors reference CSS variables for theme support
- ✅ No TypeScript compilation errors
