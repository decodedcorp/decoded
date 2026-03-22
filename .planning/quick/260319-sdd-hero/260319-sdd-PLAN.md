---
phase: quick
plan: 260319-sdd
type: execute
wave: 1
depends_on: []
files_modified:
  - packages/web/lib/components/main/HeroSection.tsx
autonomous: true
requirements: [QUICK-SDD]
must_haves:
  truths:
    - "Hero section shows a toggle button in the top-right corner"
    - "Clicking the button switches the background from the normal image to the neon glow version"
    - "Clicking again switches back to the normal image"
    - "Neon glow mode uses the CSS drop-shadow glow effect on the neon outline image"
  artifacts:
    - path: "packages/web/lib/components/main/HeroSection.tsx"
      provides: "Hero with neon glow toggle"
      contains: "04_neon_glow"
  key_links:
    - from: "HeroSection toggle button"
      to: "/lab-assets/neon-test/04_neon_glow.png"
      via: "useState toggle swapping image src"
      pattern: "neon.*glow"
---

<objective>
Add a neon glow toggle button to the HeroSection top-right corner. When toggled, the hero background switches from the normal editorial image to the neon outline glow version (04_neon_glow.png) with CSS drop-shadow glow effects in #eafd67.

Purpose: Visual flair — lets users see the neon-outlined version of the hero image.
Output: Updated HeroSection.tsx with toggle functionality.
</objective>

<execution_context>
@/Users/kiyeol/.claude-pers/get-shit-done/workflows/execute-plan.md
@/Users/kiyeol/.claude-pers/get-shit-done/templates/summary.md
</execution_context>

<context>
@packages/web/lib/components/main/HeroSection.tsx

<interfaces>
From packages/web/lib/components/main/HeroSection.tsx:
```typescript
export interface HeroData {
  artistName: string;
  title: string;
  subtitle: string;
  imageUrl?: string;
  link: string;
}
```

Neon glow asset path: `/lab-assets/neon-test/04_neon_glow.png`

CSS glow technique from lab (neon-glow page step 3):

```css
filter: drop-shadow(0 0 6px #eafd67) drop-shadow(0 0 15px #eafd67)
  drop-shadow(0 0 30px #eafd67);
```

</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add neon glow toggle to HeroSection</name>
  <files>packages/web/lib/components/main/HeroSection.tsx</files>
  <action>
    Modify HeroSection.tsx to add a neon glow toggle:

    1. Add `useState<boolean>(false)` for `isNeonMode` state.

    2. Add a toggle button in the top-right corner of the section (absolute positioned, z-30, top-6 right-6 on mobile, top-8 right-8 on md+):
       - Use a sparkle/glow SVG icon (inline SVG — a simple 4-point star/sparkle shape).
       - Style: 40x40px, rounded-full, bg-white/10 backdrop-blur-sm border border-white/20, hover:bg-white/20 transition.
       - When `isNeonMode` is true: bg-primary/20, border-primary/40, icon color primary (#eafd67).
       - When false: icon color white/60.
       - Add `motion` wrapper with whileTap={{ scale: 0.9 }} for tactile feedback.

    3. Modify the background image rendering:
       - When `isNeonMode` is true AND `data.imageUrl` exists:
         - Show `/lab-assets/neon-test/04_neon_glow.png` instead of `data.imageUrl`.
         - Remove `grayscale-[10%]` class, keep `object-cover`.
         - Change opacity from `opacity-70` to `opacity-90`.
         - Add inline style: `filter: drop-shadow(0 0 6px #eafd67) drop-shadow(0 0 15px #eafd67) drop-shadow(0 0 30px #eafd67)`.
       - When false: show original `data.imageUrl` with original classes (unchanged).

    4. Add a smooth crossfade transition between modes:
       - Use `AnimatePresence` + `motion.div` with `key={isNeonMode ? 'neon' : 'normal'}`.
       - Fade in/out with opacity 0 -> 1 over 0.6s.
       - Both images render simultaneously during transition (absolute positioned).

    5. Keep all existing content (labels, text, buttons, scroll indicator) unchanged — only the background image and the new toggle button are affected.

    IMPORTANT: Import `AnimatePresence` from `motion/react` (already used in the project, NOT from `framer-motion`). Use `useState` from `react`.

  </action>
  <verify>
    <automated>cd /Users/kiyeol/development/decoded/decoded-app && npx tsc --noEmit packages/web/lib/components/main/HeroSection.tsx 2>&1 | head -20</automated>
  </verify>
  <done>
    - Toggle button visible in top-right corner of hero section
    - Clicking toggles between normal image and neon glow image with drop-shadow effect
    - Smooth crossfade animation between modes
    - Button shows active state (primary color) when neon mode is on
    - TypeScript compiles without errors
  </done>
</task>

</tasks>

<verification>
- TypeScript compilation passes
- HeroSection renders without errors
- Toggle button is visible and functional
- Neon glow image displays with CSS glow effect when toggled
</verification>

<success_criteria>

- Hero section has a sparkle toggle button at top-right
- Normal mode: shows original editorial image (unchanged from current behavior)
- Neon mode: shows 04_neon_glow.png with #eafd67 drop-shadow glow effect
- Smooth crossfade transition between modes
- Button shows active/inactive visual state
  </success_criteria>

<output>
After completion, create `.planning/quick/260319-sdd-hero/260319-sdd-SUMMARY.md`
</output>
