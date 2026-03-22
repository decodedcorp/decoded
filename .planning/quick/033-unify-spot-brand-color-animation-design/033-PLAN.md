---
phase: quick
plan: 033
type: execute
wave: 1
depends_on: []
files_modified:
  - packages/web/lib/design-system/hotspot.tsx
  - packages/web/lib/components/request/SpotMarker.tsx
  - packages/web/lib/components/request/DetectionView.tsx
  - packages/web/app/globals.css
  - packages/web/tailwind.config.ts
autonomous: true

must_haves:
  truths:
    - "All spot/hotspot markers across the app use the design system Hotspot component"
    - "Brand colors render consistently via brandToColor utility on all spot markers"
    - "Spot markers have unified animation: spot-reveal on entry, pulse-soft when idle"
    - "Request flow spot markers show brand color glow instead of hardcoded OKLCH"
  artifacts:
    - path: "packages/web/lib/design-system/hotspot.tsx"
      provides: "Unified Hotspot component with reveal animation, glow, and selected state support"
      contains: "animate-spot-reveal"
    - path: "packages/web/lib/components/request/DetectionView.tsx"
      provides: "Detection view using design system Hotspot instead of SpotMarker"
      contains: "import { Hotspot }"
  key_links:
    - from: "packages/web/lib/components/request/DetectionView.tsx"
      to: "packages/web/lib/design-system/hotspot.tsx"
      via: "import { Hotspot } from @/lib/design-system"
      pattern: "import.*Hotspot.*design-system"
---

<objective>
Unify SpotMarker and Hotspot into a single design system component with consistent brand colors, animations, and states.

Purpose: Eliminate duplicate spot/hotspot implementations. SpotMarker (request flow) and Hotspot (design system) serve the same visual purpose but diverge in styling, animation, and brand color approach. Consolidating into one component reduces tech debt and ensures visual consistency across image detail views and request detection flows.

Output: Enhanced Hotspot component replaces SpotMarker everywhere. SpotMarker file becomes a thin re-export wrapper for backward compatibility.
</objective>

<execution_context>
@/Users/kiyeol/.claude-pers/get-shit-done/workflows/execute-plan.md
@/Users/kiyeol/.claude-pers/get-shit-done/templates/summary.md
</execution_context>

<context>
@packages/web/lib/design-system/hotspot.tsx
@packages/web/lib/components/request/SpotMarker.tsx
@packages/web/lib/components/request/DetectionView.tsx
@packages/web/lib/components/detail/ImageDetailModal.tsx
@packages/web/app/globals.css
@packages/web/tailwind.config.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Enhance Hotspot component with reveal animation, glow, and selected state</name>
  <files>
    packages/web/lib/design-system/hotspot.tsx
    packages/web/tailwind.config.ts
    packages/web/app/globals.css
  </files>
  <action>
Enhance the design system Hotspot component to absorb SpotMarker's capabilities:

1. **Add new props to HotspotProps interface:**
   - `selected?: boolean` -- selected state (scale-125 + enhanced glow)
   - `revealing?: boolean` -- triggers spot-reveal entry animation
   - `revealDelay?: number` -- animation delay in ms (for stagger based on Y position)
   - `glow?: boolean` -- enables glow boxShadow effect (default false)

2. **Add `selected` variant behavior:**
   - When `selected=true`: apply `scale-125` transform and enhanced glow shadow
   - When `selected=false` (default): standard appearance
   - Selected state does NOT change the variant -- it's orthogonal to default/numbered/inactive

3. **Add reveal animation support:**
   - When `revealing=true`: apply `animate-spot-reveal` class, set `opacity: 0` initially (animation fills forward to opacity 1), apply `animationDelay` from `revealDelay` prop
   - When `revealing=false` (default): no entry animation

4. **Add glow boxShadow:**
   - Use CSS custom property `--hotspot-color` set to the `color` prop value (fallback to theme primary via `oklch(0.9519 0.1739 115.8446)`)
   - Selected glow: `0 0 12px var(--hotspot-color), 0 0 24px color-mix(in oklch, var(--hotspot-color) 50%, transparent)`
   - Default glow: `0 0 8px color-mix(in oklch, var(--hotspot-color) 50%, transparent)`
   - Only apply glow when `glow={true}` is passed

5. **Move `spot-reveal` keyframes into tailwind.config.ts** alongside `pulse-soft`:
   - Add to `theme.extend.animation`: `'spot-reveal': 'spot-reveal 0.4s ease-out forwards'`
   - Add to `theme.extend.keyframes`: the spot-reveal keyframes (scale 0 -> 1.3 -> 1 with opacity)
   - Keep the CSS in globals.css as well for backward compat (it won't conflict)

6. **Keep existing behavior intact:**
   - The `color` prop for brand color override must continue working
   - The `pulse-soft` animation on default variant stays
   - All accessibility attributes (aria-label, button element, focus ring) preserved
   - The CVA variants remain: default, numbered, inactive

7. **Export a `brandToColor` utility** from hotspot.tsx:
   - Extract the `brandToColor` function currently inline in ImageDetailModal.tsx
   - Signature: `export function brandToColor(brand: string): string`
   - Implementation: deterministic hash -> `hsl(hash%360, 70%, 50%)`
   - This allows any consumer to generate consistent brand colors
  </action>
  <verify>
    Run `cd /Users/kiyeol/development/decoded/decoded-app && yarn build` -- should compile with no errors.
    Grep hotspot.tsx for: `selected`, `revealing`, `revealDelay`, `glow`, `brandToColor`, `animate-spot-reveal`.
  </verify>
  <done>
    Hotspot component supports all SpotMarker capabilities: selected state with glow, reveal animation with delay, brand color glow. brandToColor is exported as a reusable utility. Build passes.
  </done>
</task>

<task type="auto">
  <name>Task 2: Replace SpotMarker with Hotspot in DetectionView and create compatibility wrapper</name>
  <files>
    packages/web/lib/components/request/SpotMarker.tsx
    packages/web/lib/components/request/DetectionView.tsx
    packages/web/lib/components/detail/ImageDetailModal.tsx
  </files>
  <action>
1. **Update DetectionView.tsx to use Hotspot instead of SpotMarker:**
   - Replace `import { SpotMarker } from "./SpotMarker"` with `import { Hotspot } from "@/lib/design-system"`
   - Map each `spot` to a Hotspot:
     ```tsx
     <Hotspot
       variant="numbered"
       number={spot.index}
       position={{ x: spot.center.x * 100, y: spot.center.y * 100 }}
       selected={selectedSpotId === spot.id}
       revealing={isRevealing}
       revealDelay={spot.center.y * 1000}
       glow={true}
       label={`Spot ${spot.index}${spot.label ? `: ${spot.label}` : ""}`}
       onClick={() => onSpotClick?.(spot)}
     />
     ```
   - Note: `spot.center.x` is 0-1 normalized, Hotspot expects 0-100 percentage, so multiply by 100
   - Remove the z-10 from individual markers -- Hotspot is already `absolute` positioned

2. **Convert SpotMarker.tsx to a thin re-export wrapper:**
   - Keep the file for backward compatibility (other files may import types or reference it)
   - Replace the full implementation with:
     ```tsx
     "use client";
     export { Hotspot as SpotMarker } from "@/lib/design-system";
     export type { HotspotProps as SpotMarkerProps } from "@/lib/design-system";
     ```
   - Add a deprecation JSDoc comment: `/** @deprecated Use Hotspot from @/lib/design-system instead */`

3. **Update ImageDetailModal.tsx:**
   - Replace inline `brandToColor` function with import: `import { Hotspot, brandToColor } from "@/lib/design-system"`
   - Remove the local `brandToColor` function definition (around line 377-383)
   - The Hotspot usage stays the same (already uses `<Hotspot color={brandToColor(brand)}>`)
  </action>
  <verify>
    Run `cd /Users/kiyeol/development/decoded/decoded-app && yarn build` -- should compile with no errors.
    Grep DetectionView.tsx for `import.*Hotspot.*design-system` -- should find the import.
    Grep ImageDetailModal.tsx for `import.*brandToColor.*design-system` -- should find the import.
    Grep SpotMarker.tsx for `@deprecated` -- should find deprecation notice.
  </verify>
  <done>
    DetectionView uses Hotspot from design system with numbered variant, brand glow, reveal animation, and selected state. SpotMarker.tsx is a deprecated re-export wrapper. ImageDetailModal imports brandToColor from the shared utility. Build passes with no errors.
  </done>
</task>

</tasks>

<verification>
1. `yarn build` passes with no TypeScript or compilation errors
2. `grep -r "SpotMarker" packages/web/lib/components/request/DetectionView.tsx` returns no results (replaced with Hotspot)
3. `grep "brandToColor" packages/web/lib/design-system/hotspot.tsx` confirms utility is exported
4. `grep "brandToColor" packages/web/lib/components/detail/ImageDetailModal.tsx` shows import from design-system, not local definition
5. `grep "@deprecated" packages/web/lib/components/request/SpotMarker.tsx` confirms deprecation notice
6. Visual verification: request flow spots should render with numbered circles, glow, and reveal animation; image detail spots should render with brand-colored circles
</verification>

<success_criteria>
- Single source of truth: Hotspot component handles all spot/marker use cases
- SpotMarker is a deprecated re-export, not a duplicate implementation
- brandToColor is a shared utility, not duplicated inline
- Animations (spot-reveal, pulse-soft) are both available via Tailwind config
- All existing spot/hotspot rendering continues to work visually
- Build compiles cleanly with no errors
</success_criteria>

<output>
After completion, create `.planning/quick/033-unify-spot-brand-color-animation-design/033-SUMMARY.md`
</output>
