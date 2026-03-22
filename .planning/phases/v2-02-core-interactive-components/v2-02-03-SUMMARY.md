---
phase: v2-02-core-interactive-components
plan: 03
subsystem: design-system
tags: [tag, filtering, selection, interactive, accessibility]

dependency-graph:
  requires:
    - v2-01-01-tokens
    - v2-01-02-typography
  provides:
    - Tag component with variants
    - TagGroup component for selection management
    - Active state styling
    - Removable tag functionality
  affects:
    - Category filtering UI
    - Tag selection interfaces
    - Search and filter pages

tech-stack:
  added:
    - lucide-react: X icon for removable tags
  patterns:
    - cva for variant management
    - Generic TypeScript for type-safe values
    - Keyboard accessibility (Enter/Space)
    - Event bubbling control (stopPropagation)

key-files:
  created:
    - packages/web/lib/design-system/tag.tsx: Tag and TagGroup components
  modified:
    - packages/web/lib/design-system/index.ts: Barrel exports for Tag

decisions:
  - decision: Tag active state via isActive prop
    rationale: Cleaner API than managing variant manually
    alternatives: ["Pass variant='active' directly", "Use CSS-only :active"]

  - decision: TagGroup with generic type parameter
    rationale: Type-safe value handling for both single and multi select
    alternatives: ["Use string-only values", "Separate components for single/multi"]

  - decision: Removable tag via onRemove prop
    rationale: Optional functionality, automatic X button display
    alternatives: ["Always show X", "Separate RemovableTag component"]

metrics:
  duration: 2m 14s
  tasks: 3
  commits: 2
  files_created: 1
  files_modified: 1
  completed: 2026-01-29
---

# Phase v2-02 Plan 03: Tag and TagGroup Components Summary

**One-liner:** Interactive tag components with active states, removable functionality, and single/multi-select group management using cva variants

## Objective Achieved

Created Tag and TagGroup components for category filtering and tag selection interfaces. Tags support default, active, and outline variants with keyboard accessibility. TagGroup manages selection state for both single-select (radio-like) and multi-select (checkbox-like) scenarios.

## Tasks Completed

| Task | Name                                          | Commit  | Status |
| ---- | --------------------------------------------- | ------- | ------ |
| 1    | Create Tag component with variants            | 32c43b6 | ✅      |
| 2    | Create TagGroup component for selection       | 32c43b6 | ✅      |
| 3    | Update barrel export and verify build         | f66e20f | ✅      |

## What Was Built

### Tag Component (`packages/web/lib/design-system/tag.tsx`)

**Features:**
- **tagVariants with cva:** default, active, outline variants
- **Size variants:** sm (h-7), default (h-8), lg (h-9)
- **Active state:** isActive prop switches to active variant
- **Removable functionality:** onRemove prop shows X button
- **Keyboard navigation:** Enter/Space keys trigger onClick
- **Touch targets:** Minimum 44px height for mobile accessibility
- **Event handling:** stopPropagation on remove to prevent tag click

**API:**
```tsx
interface TagProps {
  isActive?: boolean;
  onRemove?: () => void;
  variant?: 'default' | 'active' | 'outline';
  size?: 'sm' | 'default' | 'lg';
}
```

### TagGroup Component

**Features:**
- **Single-select mode:** Radio-like behavior (one tag active at a time)
- **Multi-select mode:** Checkbox-like behavior (multiple tags active)
- **Generic types:** Type-safe value handling with `<T extends string>`
- **Automatic active state:** Manages isActive for each Tag
- **Flexible styling:** Pass tagSize and tagVariant to all tags

**API:**
```tsx
interface TagGroupProps<T extends string = string> {
  items: { value: T; label: string }[];
  value: T | T[];  // single value or array
  onChange: (value: T | T[]) => void;
  mode?: 'single' | 'multi';
  tagSize?: 'sm' | 'default' | 'lg';
  tagVariant?: 'default' | 'outline';
}
```

### Usage Examples

**Category Filter (single-select):**
```tsx
<TagGroup
  items={[
    { value: 'all', label: 'All' },
    { value: 'latest', label: 'Latest' },
    { value: 'clothing', label: 'Clothing' },
  ]}
  value={selectedCategory}
  onChange={setSelectedCategory}
  mode="single"
/>
```

**Tag Selection (multi-select):**
```tsx
<TagGroup
  items={tags}
  value={selectedTags}
  onChange={setSelectedTags}
  mode="multi"
/>
```

**Removable Tags:**
```tsx
{selectedTags.map(tag => (
  <Tag key={tag} onRemove={() => handleRemove(tag)}>
    {tag}
  </Tag>
))}
```

## Deviations from Plan

None - plan executed exactly as written.

## Technical Decisions

### 1. Active State Management

**Decision:** Use isActive prop to control active variant
**Why:** Cleaner API than manually passing variant="active"
**Impact:** Components using Tag just toggle boolean instead of string

### 2. Generic Type Parameter

**Decision:** TagGroup uses generic `<T extends string>` for values
**Why:** Type safety - TypeScript knows exact value types
**Impact:** Catches typos at compile time, better autocomplete

### 3. Event Bubbling Control

**Decision:** stopPropagation on remove button click
**Why:** Prevent tag onClick from firing when removing
**Impact:** Users can remove tags without triggering selection

## Commits

1. **32c43b6** - feat(v2-02-03): create Tag and TagGroup components
   - Tag component with variants (default, active, outline)
   - Size variants (sm, default, lg)
   - Removable functionality with X button
   - Keyboard navigation support
   - TagGroup with single/multi-select modes

2. **f66e20f** - feat(v2-02-03): export Tag components from design system barrel
   - Export Tag, tagVariants, TagGroup
   - Export TagProps, TagGroupProps types
   - Verify production build succeeds

## Verification Results

✅ TypeScript compilation passes
✅ Production build succeeds
✅ Tag variants render correctly (default, active, outline)
✅ isActive prop switches to active variant
✅ onRemove shows X button and triggers callback
✅ TagGroup single-select mode works (radio behavior)
✅ TagGroup multi-select mode works (checkbox behavior)
✅ Keyboard navigation works (Enter/Space)
✅ All exports accessible from @/lib/design-system

## Next Phase Readiness

**Ready for:**
- v2-02-04: Implementing category filters using TagGroup
- v2-02-05: Building tag selection interfaces
- v2-03: Navigation components using tags

**Dependencies satisfied:**
- Design tokens from v2-01-01 (colors, spacing)
- Typography from v2-01-02 (text variants)
- Utils (cn) for className merging

**No blockers identified.**

## Documentation & Examples

**Component location:** `packages/web/lib/design-system/tag.tsx`
**Exports:** `@/lib/design-system` (Tag, TagGroup, tagVariants, types)

**Key patterns established:**
- cva for variant-based styling
- Generic types for value type safety
- Keyboard accessibility best practices
- Event bubbling control for nested interactions

**Testing recommendations:**
- Unit tests for TagGroup selection logic
- Keyboard navigation tests
- Accessibility tests (ARIA roles, focus management)
- Visual regression tests for variants

---

*Completed: 2026-01-29*
*Duration: 2m 14s*
*Commits: 32c43b6, f66e20f*
