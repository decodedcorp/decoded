---
phase: quick-047
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - packages/web/lib/components/magazine/EditorialHero.tsx
  - packages/web/lib/components/magazine/EditorialItemShowcase.tsx
  - packages/web/lib/components/magazine/AmbientParticles.tsx
  - packages/web/lib/components/magazine/GrainOverlay.tsx
  - packages/web/lib/components/magazine/GenerateMyEdition.tsx
  - packages/web/app/magazine/DailyEditorialClient.tsx
  - packages/web/lib/components/magazine/index.ts
autonomous: true

must_haves:
  truths:
    - "Daily editorial page renders a cinematic full-black layout with grain texture"
    - "Hero section shows oversized title with text-behind-image depth layering"
    - "Item cards are asymmetrically placed with chartreuse glow borders"
    - "Ambient particles drift across the page"
    - "CTA pulses with neon chartreuse border animation"
    - "All sections animate on scroll via GSAP ScrollTrigger"
  artifacts:
    - path: "packages/web/lib/components/magazine/EditorialHero.tsx"
      provides: "Cinematic hero with depth-layered text and parallax"
    - path: "packages/web/lib/components/magazine/EditorialItemShowcase.tsx"
      provides: "Asymmetric item cards with glow borders"
    - path: "packages/web/lib/components/magazine/AmbientParticles.tsx"
      provides: "Drifting ambient particles"
    - path: "packages/web/lib/components/magazine/GrainOverlay.tsx"
      provides: "CSS grain texture overlay"
    - path: "packages/web/lib/components/magazine/GenerateMyEdition.tsx"
      provides: "Redesigned CTA with pulsing glow"
    - path: "packages/web/app/magazine/DailyEditorialClient.tsx"
      provides: "Hardcoded cinematic page assembling all sections"
  key_links:
    - from: "DailyEditorialClient.tsx"
      to: "magazineStore"
      via: "useMagazineStore hook for currentIssue data"
    - from: "DailyEditorialClient.tsx"
      to: "EditorialHero, EditorialItemShowcase, AmbientParticles, GrainOverlay, GenerateMyEdition"
      via: "direct component imports"
---

<objective>
Completely redesign the Daily Editorial page as a hyper-cinematic mobile editorial experience with matte obsidian background, text-behind-image depth layering, asymmetric item cards with chartreuse glow, ambient particles, grain texture, and GSAP scroll animations.

Purpose: Transform the generic MagazineRenderer-based daily editorial into a bespoke cinematic page that feels like a high-end fashion editorial.
Output: 4 new components + 2 rewritten components = full cinematic editorial page at /magazine
</objective>

<execution_context>
@/Users/kiyeol/.claude-pers/get-shit-done/workflows/execute-plan.md
@/Users/kiyeol/.claude-pers/get-shit-done/templates/summary.md
</execution_context>

<context>
@packages/web/app/magazine/DailyEditorialClient.tsx
@packages/web/lib/components/magazine/GenerateMyEdition.tsx
@packages/web/lib/components/magazine/DecodingParticles.tsx
@packages/web/lib/components/magazine/types.ts
@packages/web/lib/components/magazine/mock/daily-editorial.json
@packages/web/lib/stores/magazineStore.ts
@packages/web/lib/components/magazine/index.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create cinematic sub-components (EditorialHero, EditorialItemShowcase, AmbientParticles, GrainOverlay)</name>
  <files>
    packages/web/lib/components/magazine/EditorialHero.tsx
    packages/web/lib/components/magazine/EditorialItemShowcase.tsx
    packages/web/lib/components/magazine/AmbientParticles.tsx
    packages/web/lib/components/magazine/GrainOverlay.tsx
  </files>
  <action>
Create 4 new components. All use "use client" and import gsap + ScrollTrigger.

**GrainOverlay.tsx** — Fixed overlay with CSS noise grain effect:
- Use a CSS `background-image` with a tiny inline SVG noise pattern or CSS `filter: url(#noise)` with an SVG filter
- Simplest approach: use a repeating radial-gradient trick or a pseudo-element with `background: url()` pointing to a generated noise. Best: use CSS animation of a large semi-transparent noise PNG (or generate via canvas). Simplest viable: a `::before` pseudo with a subtle repeating-conic-gradient or just `opacity: 0.03` white noise image from picsum/placeholder.
- Actually simplest and most performant: use a `<svg>` with `<feTurbulence>` filter rendered on a full-screen div. This is pure CSS/SVG, no external assets.
- Component: renders a fixed full-screen div with pointer-events-none, z-30, containing an SVG filter `<feTurbulence baseFrequency="0.65" numOctaves="3" />` applied via CSS `filter: url(#grain)`. Opacity ~0.04-0.06 for subtlety.

**AmbientParticles.tsx** — Drifting ambient chartreuse particles:
- Unlike DecodingParticles (converges to center), these float randomly across the viewport in slow, drifting arcs.
- 15-20 small circles (4-8px), color `#eafd67` with varying opacity (0.15-0.4).
- Each particle starts at a random position, drifts in a random direction with slight sine-wave wobble over 8-15 second duration, then repositions and repeats.
- Use GSAP for animation. Component accepts `isActive: boolean` prop.
- Fixed position, pointer-events-none, z-20.
- No images needed, just colored circles.

**EditorialHero.tsx** — Cinematic hero section with text-behind-image depth:
- Props: `{ title: string; subtitle?: string; coverImageUrl: string; images: string[] }` where `images` comes from layout_json grid-gallery data or item images.
- Structure (top to bottom within ~100vh section):
  1. Small caps label at top: "FEATURED NARRATIVE" in mag-text/50, tracking-[0.3em]
  2. Oversized title split into characters or words. Use absolute positioning to layer:
     - Title text layer (z-10) — font-size clamp(3rem, 12vw, 6rem), font-bold, uppercase, text-mag-text
     - Celebrity/cover images (z-20) — 2-3 images from data at varying sizes (40-60% width), positioned to overlap the title text, creating depth illusion where images appear IN FRONT of some title letters
     - A second copy of parts of the title (z-30) — selected words rendered again on top of images, creating the "text goes behind AND in front" layering
  3. Subtitle text below: Korean-style editorial subtitle, e.g. from data subtitle, in text-mag-text/60, text-sm
  4. "VIEW EDITORIAL" small text with a thin line, tracking-widest
- GSAP ScrollTrigger: parallax on images (scrub: true, y offset based on scroll), fade-up on text elements with stagger
- Use useRef + useEffect for GSAP setup, clean up with gsap.context().revert()
- Add a slight glitch offset effect on one image: `transform: translate(4px, -2px)` with a subtle `box-shadow: -4px 2px 0 #eafd67` to simulate glitch displacement

**EditorialItemShowcase.tsx** — Asymmetric item cards:
- Props: `{ items: Array<{ item_id: string; image_url: string; brand: string; name: string; price: string }> }`
- NOT a grid layout. Each item is positioned with explicit Tailwind classes for asymmetry:
  - Item 0: `w-[55%] ml-[5%] -rotate-1`
  - Item 1: `w-[45%] ml-[45%] rotate-2 -mt-8`
  - Add more patterns if more items exist
- Each card: relative container with:
  - Image with `rounded-lg`
  - Border: `ring-1 ring-[#eafd67]/40` with `shadow-[0_0_20px_rgba(234,253,103,0.15)]` for glow effect
  - Brand name (uppercase, text-xs, tracking-wider, text-mag-text/50) positioned absolutely at top-left
  - Price badge absolutely positioned at bottom-right with bg-mag-bg/80 backdrop-blur
  - Item name below image in text-sm
- GSAP ScrollTrigger per card: staggered fade-up + slight rotation correction on enter
- Section title above: "CURATED ITEMS" or similar label in same style as hero section labels
  </action>
  <verify>
All 4 files exist and have no TypeScript errors:
```bash
cd packages/web && npx tsc --noEmit --pretty 2>&1 | grep -E "(EditorialHero|EditorialItemShowcase|AmbientParticles|GrainOverlay)" || echo "No type errors in new components"
```
  </verify>
  <done>4 new editorial components created with GSAP animations, proper TypeScript types, and "use client" directives</done>
</task>

<task type="auto">
  <name>Task 2: Rewrite DailyEditorialClient + GenerateMyEdition + update barrel export</name>
  <files>
    packages/web/app/magazine/DailyEditorialClient.tsx
    packages/web/lib/components/magazine/GenerateMyEdition.tsx
    packages/web/lib/components/magazine/index.ts
  </files>
  <action>
**GenerateMyEdition.tsx** — Redesign with pulsing neon glow:
- Keep same router.push("/magazine/personal") behavior
- New visual design:
  - Full-width button with `border border-[#eafd67]` and pulsing glow animation
  - Pulsing effect: use CSS `@keyframes pulse-glow` with `box-shadow` alternating between `0 0 10px rgba(234,253,103,0.3)` and `0 0 30px rgba(234,253,103,0.6)`. Apply via Tailwind arbitrary `animate-[pulse-glow_2s_ease-in-out_infinite]` and define keyframes inline with a `<style>` tag or in the component.
  - Actually better: use GSAP timeline for the pulse since GSAP is already loaded. `gsap.to(buttonRef, { boxShadow: '0 0 30px rgba(234,253,103,0.5)', repeat: -1, yoyo: true, duration: 1.5, ease: 'sine.inOut' })`
  - Text: "Generate My Edition" in text-lg font-bold, text-mag-accent
  - Subtitle: "AI가 큐레이션한 나만의 에디토리얼" in text-sm text-mag-text/50
  - ArrowRight icon on right side
- Keep GSAP ScrollTrigger fade-up on enter

**DailyEditorialClient.tsx** — Complete rewrite:
- Remove MagazineRenderer import entirely
- Keep useMagazineStore for data (currentIssue, isLoading, error, loadDailyIssue, clearError)
- Keep loading/error states as-is (MagazineSkeleton + error UI)
- When currentIssue is loaded, extract data:
  - `title` = currentIssue.title
  - `subtitle` = currentIssue.subtitle
  - `coverImageUrl` = currentIssue.cover_image_url
  - `items` = layout_json.components.filter(c => c.type === 'item-card').map(c => c.data)
  - `galleryImages` = layout_json.components.find(c => c.type === 'grid-gallery')?.data.images as string[] || []
  - `bodyText` = layout_json.components.find(c => c.type === 'text-block')?.data.content as string || ''
  - `quote` = layout_json.components.find(c => c.type === 'quote')?.data
- Render hardcoded cinematic layout (no MagazineRenderer):
  ```
  <div className="relative min-h-screen bg-mag-bg text-mag-text overflow-hidden">
    <GrainOverlay />
    <AmbientParticles isActive={true} />

    {/* Hero Section */}
    <EditorialHero
      title={title}
      subtitle={subtitle}
      coverImageUrl={coverImageUrl}
      images={galleryImages.slice(0, 3)}
    />

    {/* Body Text Section */}
    <section className="px-6 py-16 max-w-lg mx-auto">
      <p className="text-mag-text/80 text-base leading-relaxed font-light">
        {bodyText}
      </p>
    </section>

    {/* Item Showcase */}
    <EditorialItemShowcase items={items} />

    {/* Quote Section */}
    {quote && (
      <section className="px-6 py-20 text-center max-w-md mx-auto">
        <blockquote className="text-2xl font-light italic text-mag-text/90">
          "{quote.text}"
        </blockquote>
        <p className="mt-4 text-xs tracking-widest uppercase text-mag-text/40">
          {quote.attribution}
        </p>
      </section>
    )}

    {/* CTA */}
    <GenerateMyEdition />
  </div>
  ```
- Add GSAP ScrollTrigger for bodyText and quote sections (fade-up with useRef + useEffect)
- The body text and quote sections need their own refs and GSAP animations in DailyEditorialClient itself (simple fade-up on scroll)

**index.ts** — Add new exports:
- Add: `export { EditorialHero } from "./EditorialHero";`
- Add: `export { EditorialItemShowcase } from "./EditorialItemShowcase";`
- Add: `export { AmbientParticles } from "./AmbientParticles";`
- Add: `export { GrainOverlay } from "./GrainOverlay";`
- Keep all existing exports unchanged
  </action>
  <verify>
1. TypeScript check passes:
```bash
cd packages/web && npx tsc --noEmit --pretty 2>&1 | tail -5
```
2. Build succeeds:
```bash
cd packages/web && yarn build 2>&1 | tail -10
```
3. Visually verify at http://localhost:3000/magazine — page should show cinematic black layout with hero, items, particles, grain, and glowing CTA
  </verify>
  <done>
- DailyEditorialClient renders cinematic hardcoded layout (no MagazineRenderer)
- GenerateMyEdition has pulsing chartreuse glow animation
- All new components exported from barrel
- TypeScript compiles without errors
- Build succeeds
  </done>
</task>

</tasks>

<verification>
1. `cd packages/web && npx tsc --noEmit` — zero errors
2. `cd packages/web && yarn build` — succeeds
3. Navigate to /magazine — cinematic layout visible with:
   - Black background with subtle grain texture
   - Oversized title with depth-layered images
   - Asymmetric item cards with chartreuse glow
   - Drifting ambient particles
   - Pulsing CTA at bottom
   - All sections animate on scroll
4. Other magazine pages (/magazine/personal, /magazine/collection) still work — they use MagazineRenderer which is unchanged
</verification>

<success_criteria>
- Daily editorial page is a cinematic full-black experience with grain texture overlay
- Hero section has text-behind-image depth layering with oversized title
- Item cards are asymmetrically placed (not grid) with #eafd67 glow borders
- Ambient particles drift across the viewport
- "Generate My Edition" CTA pulses with neon chartreuse glow
- GSAP ScrollTrigger animates each section on scroll
- MagazineRenderer is NOT used by DailyEditorialClient (but still exported and used elsewhere)
- TypeScript compiles, build passes
</success_criteria>

<output>
After completion, create `.planning/quick/047-daily-editorial-cinematic-redesign/047-SUMMARY.md`
</output>
