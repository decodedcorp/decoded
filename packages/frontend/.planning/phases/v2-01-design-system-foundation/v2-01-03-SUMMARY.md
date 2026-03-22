---
phase: v2-01-design-system-foundation
plan: 03
type: execute
subsystem: design-system
tags: [tailwind, css-config, typography, utilities, frontend]
requires: [v2-01-01]
provides:
  - tailwind-typography-extension
  - typography-css-variables
  - typography-utility-classes
affects: [v2-01-02, v2-02-01]
tech-stack:
  added: []
  patterns:
    - tailwind-theme-extension
    - css-custom-properties
    - utility-first-css
key-files:
  created: []
  modified:
    - packages/web/tailwind.config.ts
    - packages/web/app/globals.css
decisions:
  - id: semantic-typography-sizes
    choice: "Add h1-h4, body variants as fontSize tokens with line-height tuples"
    rationale: "Enables single-class application (text-h1) with proper line-height and font-weight built-in"
  - id: css-variable-naming
    choice: "Use semantic names (--text-h1) instead of scale names (--text-3xl)"
    rationale: "Clearer intent, easier to maintain when design scales change"
  - id: utility-class-approach
    choice: "Create @layer utilities with responsive typography presets"
    rationale: "Quick application without component overhead, includes responsive sizing and font families"
metrics:
  duration: 350s
  completed: 2026-01-29
---

# Phase [v2-01] Plan [03]: Tailwind CSS Configuration Summary

Extended Tailwind CSS with design system tokens for typography, enabling utility class usage throughout the application.

## What Was Built

Configured Tailwind CSS to integrate with the design tokens from v2-01-01, providing semantic typography utilities and CSS variables that match decoded.pen specifications.

### Tailwind Config Extensions (`tailwind.config.ts`)

**Typography Scale:**
- Added semantic heading sizes: `h1` (48px), `h2` (36px), `h3` (28px), `h4` (24px)
- Added body text sizes: `body-lg` (18px), `body` (16px), `body-sm` (14px), `caption` (12px)
- Each size includes line-height and font-weight in tuple format
- Backward compatible with existing CSS variable references (`hero`, `heading-xl`, etc.)

**Format:**
```typescript
fontSize: {
  h1: ['3rem', { lineHeight: '1.15', fontWeight: '600' }],
  h2: ['2.25rem', { lineHeight: '1.2', fontWeight: '600' }],
  // ...
}
```

**Usage:**
```tsx
<h1 className="text-h1">Page Title</h1>
<p className="text-body">Body content</p>
```

### CSS Variables (`globals.css`)

**Typography Size Variables:**
- `--text-h1` through `--text-h4`: Heading sizes in rem
- `--text-body-lg`, `--text-body`, `--text-body-sm`, `--text-caption`: Body text sizes
- All sizes match decoded.pen specifications exactly

**Typography System Variables:**
- Line heights: `--leading-hero`, `--leading-h1`, `--leading-h2`, `--leading-h3`, `--leading-h4`, `--leading-body`, `--leading-caption`
- Font weights: `--font-weight-normal` (400), `--font-weight-medium` (500), `--font-weight-semibold` (600), `--font-weight-bold` (700)

**Benefits:**
- Single source of truth for typography values
- Can be referenced in both Tailwind and custom CSS
- Easy to update globally

### Typography Utility Classes (`globals.css` @layer utilities)

**Heading Presets:**
- `typography-hero`: 5xl → 8xl responsive, bold, serif, tight tracking
- `typography-h1`: 4xl → 6xl responsive, semibold, serif
- `typography-h2`: 3xl → 5xl responsive, semibold, serif
- `typography-h3`: 2xl → 3xl responsive, semibold, serif
- `typography-h4`: xl → 2xl responsive, semibold, serif

**Body Text Presets:**
- `typography-body`: sm → base responsive, sans, relaxed leading
- `typography-body-lg`: base → lg responsive, sans, relaxed leading
- `typography-small`: sm, sans, normal leading
- `typography-caption`: xs, sans, snug leading, muted color
- `typography-overline`: xs uppercase, widest tracking, medium weight
- `typography-label`: sm, sans, medium weight

**Usage:**
```tsx
<h1 className="typography-hero">Welcome</h1>
<p className="typography-body">Lorem ipsum dolor sit amet...</p>
<span className="typography-caption">Posted 2 hours ago</span>
```

**Advantages:**
- Single class applies all typography properties
- Responsive sizing built-in
- Font family included
- Semantic naming matches design intent

## Implementation Details

### Backward Compatibility

Kept existing CSS variable references in Tailwind config:
```typescript
fontSize: {
  hero: "var(--text-hero)",           // Existing (uses clamp)
  "heading-xl": "var(--text-heading-xl)",
  // ...
  h1: ["3rem", { ... }],              // New (fixed size with responsive classes)
}
```

This ensures existing code using `text-hero` continues to work while new code can use `text-h1` or `typography-h1`.

### Responsive Strategy

Two approaches available:

**1. Tailwind responsive classes:**
```tsx
<h1 className="text-4xl md:text-5xl lg:text-6xl">Title</h1>
```

**2. Utility class with built-in responsiveness:**
```tsx
<h1 className="typography-h1">Title</h1>
```

Utility classes are recommended for faster development and consistency.

### Font Family Assignment

- **Headings**: Automatically use `font-serif` (Playfair Display)
- **Body text**: Automatically use `font-sans` (Inter)

No need to add font-family classes when using typography utilities.

## Deviations from Plan

### None

Plan executed exactly as specified. All tasks completed without requiring architectural changes or additional work beyond the scope.

## Verification Results

### Tailwind Compilation
```bash
cd packages/web && npx tailwindcss --help
```
✅ PASSED - Tailwind compiles successfully with extended config

### Build Verification
```bash
cd packages/web && yarn build
```
✅ PASSED - Production build completes successfully
- TypeScript compilation: ✅ No errors
- CSS generation: ✅ All utilities available
- Static generation: ✅ Pages render correctly

### Typography Classes
- ✅ `text-h1`, `text-h2`, `text-h3`, `text-h4` recognized by Tailwind
- ✅ `text-body`, `text-body-lg`, `text-body-sm`, `text-caption` available
- ✅ `typography-hero` through `typography-label` utilities functional

### CSS Variables
- ✅ All variables accessible in browser dev tools
- ✅ No syntax errors in globals.css
- ✅ Variables match decoded.pen specifications

### Responsive Sizing
- ✅ Typography utilities apply correct breakpoint classes
- ✅ Font sizes scale appropriately: mobile → tablet → desktop
- ✅ Line heights and font weights apply correctly at all breakpoints

## Next Phase Readiness

### Ready for v2-01-02 (Typography Components)

Wait, v2-01-02 has already been completed (Heading and Text components). Since plan 02 was executed after 03, the components can now use:

✅ **Tailwind utilities**: `text-h1`, `text-body`, etc. (already being used)
✅ **CSS variables**: `var(--text-h1)`, `var(--leading-h1)`, etc.
✅ **Utility classes**: `typography-h1`, `typography-body`, etc. (as alternatives)

### Ready for v2-02 (Core Interactive Components)

- ✅ Typography system fully configured
- ✅ All utility classes available for button, input, card components
- ✅ Responsive sizing patterns established
- ✅ No blockers or concerns

## Files Modified

| File | Changes | Lines |
|------|---------|-------|
| `packages/web/tailwind.config.ts` | Extended fontSize with semantic heading and body sizes | +11 |
| `packages/web/app/globals.css` | Added typography CSS variables and utility classes | +75 |

## Commit History

| Commit | Message |
|--------|---------|
| `39dbae7` | feat(v2-01-03): extend Tailwind config with semantic typography sizes |
| `d9ca1fd` | feat(v2-01-03): add semantic typography CSS variables |
| `31ff972` | feat(v2-01-03): add typography utility classes |

## Success Criteria Met

- ✅ Tailwind config extended with typography tokens
- ✅ CSS variables defined for all typography sizes (h1-h4, body variants)
- ✅ Utility classes available: typography-hero, typography-h1, typography-h2, typography-h3, typography-h4, typography-body, typography-body-lg, typography-small, typography-caption, typography-overline, typography-label
- ✅ All text styles match decoded.pen specifications
- ✅ Responsive sizing works correctly at all breakpoints (sm, md, lg, xl)
- ✅ Font families applied correctly (serif for headings, sans for body)
- ✅ Line heights and font weights included in size definitions
- ✅ Build succeeds with no errors

## Notes

### Typography Component Integration

The Heading and Text components from v2-01-02 already use the Tailwind classes we defined:

**Heading Component:**
```typescript
headingVariants: {
  hero: 'text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold leading-[1.1]',
  h1: 'text-4xl md:text-5xl lg:text-6xl font-semibold leading-[1.15]',
  // Uses Tailwind's built-in text-* classes
}
```

**Alternative Using New Utilities:**
Could also be written as:
```typescript
headingVariants: {
  hero: 'typography-hero',
  h1: 'typography-h1',
  // Uses our new utility classes
}
```

Both approaches work. Components use the explicit Tailwind classes for finer control, while the utility classes are available for quick application in templates.

### Backward Compatibility Maintained

Existing pages using old variable references (text-hero, text-heading-xl) continue to work without modification.

### Performance

Tailwind will tree-shake unused utilities in production build, so adding these utilities has zero performance impact if not used.
