---
phase: quick-60
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - packages/web/app/page.tsx
  - packages/web/lib/components/ui/CircularGallery.tsx
  - packages/web/lib/components/main/TopItemsSection.tsx
  - packages/web/lib/components/main-renewal/MainHero.tsx
  - packages/web/lib/components/main/HeroItemSync.tsx
autonomous: true
requirements: [QUICK-60]

must_haves:
  truths:
    - "TopItemsSection shows decodedPick items instead of bestItems"
    - "Clicking a SpotCard in MainHero scrolls CircularGallery to that item"
    - "Dragging/scrolling CircularGallery highlights the corresponding SpotCard in MainHero"
  artifacts:
    - path: "packages/web/lib/components/main/HeroItemSync.tsx"
      provides: "Client wrapper managing shared activeItemIndex state between MainHero and TopItemsSection"
    - path: "packages/web/lib/components/ui/CircularGallery.tsx"
      provides: "onActiveChange callback and activeIndex prop for external control"
    - path: "packages/web/lib/components/main-renewal/MainHero.tsx"
      provides: "Clickable SpotCards with activeSpotId glow/scale highlight"
  key_links:
    - from: "packages/web/lib/components/main/HeroItemSync.tsx"
      to: "MainHero + TopItemsSection"
      via: "activeItemIndex state + callbacks"
      pattern: "useState.*activeItemIndex"
    - from: "packages/web/lib/components/ui/CircularGallery.tsx"
      to: "HeroItemSync"
      via: "onActiveChange callback firing on scroll snap"
      pattern: "onActiveChange.*index"
    - from: "packages/web/lib/components/main-renewal/MainHero.tsx"
      to: "HeroItemSync"
      via: "onSpotClick callback"
      pattern: "onSpotClick.*id"
---

<objective>
Wire bidirectional sync between MainHero spot annotations and the CircularGallery in TopItemsSection, plus switch TopItemsSection data source from bestItems to decodedPick items.

Purpose: Clicking a hero spot snaps the gallery to that item; scrolling the gallery highlights the corresponding hero spot. The gallery shows the same items annotated on the hero image.
Output: HeroItemSync client wrapper, updated CircularGallery with external control API, updated MainHero with clickable+highlightable SpotCards.
</objective>

<execution_context>
@/Users/kiyeol/.claude-pers/get-shit-done/workflows/execute-plan.md
@/Users/kiyeol/.claude-pers/get-shit-done/templates/summary.md
</execution_context>

<context>
@packages/web/app/page.tsx
@packages/web/lib/components/ui/CircularGallery.tsx
@packages/web/lib/components/main/TopItemsSection.tsx
@packages/web/lib/components/main-renewal/MainHero.tsx
@packages/web/lib/components/main-renewal/types.ts
@packages/web/lib/components/main/ItemCard.tsx

<interfaces>
<!-- Key types the executor needs -->

From packages/web/lib/components/main-renewal/types.ts:

```typescript
export interface HeroSpotAnnotation {
  id: string;
  x: number;
  y: number;
  label: string;
  brand?: string;
  side: "left" | "right";
}

export interface MainHeroData {
  celebrityName: string;
  editorialTitle: string;
  editorialSubtitle?: string;
  heroImageUrl: string;
  ctaLink: string;
  ctaLabel?: string;
  spots?: HeroSpotAnnotation[];
}
```

From packages/web/lib/components/main/ItemCard.tsx:

```typescript
export interface ItemCardData {
  id: string;
  brand: string;
  name: string;
  imageUrl?: string;
  link: string;
}
```

From CircularGallery.tsx App class (internal scroll state):

```typescript
// App.scroll = { ease, current, target, last }
// To snap to item N: scroll.target = width * N (where width = medias[0].width)
// Active item = Math.round(Math.abs(scroll.current) / width) % originalItemCount
// Items are doubled internally: mediasImages = items.concat(items)
```

</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add external control API to CircularGallery + create HeroItemSync wrapper</name>
  <files>
    packages/web/lib/components/ui/CircularGallery.tsx
    packages/web/lib/components/main/TopItemsSection.tsx
    packages/web/lib/components/main/HeroItemSync.tsx
    packages/web/lib/components/main/index.ts
  </files>
  <action>
**CircularGallery.tsx** — Add two new props to `CircularGalleryProps` and the component:

1. `onActiveChange?: (index: number) => void` — called when the active (centered) item changes.
2. `activeIndex?: number` — when set externally, snaps gallery to that index.

Implementation in `App` class:

- Add `onActiveChange` callback and `activeIndex` to constructor config. Store `originalLength` (items.length before doubling).
- In `update()` loop: after lerp, compute `currentActive = Math.round(Math.abs(this.scroll.current) / this.medias[0].width) % this.originalLength`. If `currentActive !== this.lastActiveIndex`, call `this.onActiveChange?.(currentActive)` and store `this.lastActiveIndex = currentActive`.
- Add public method `snapTo(index: number)`: sets `this.scroll.target = this.medias[0].width * index` (positive direction). Call `this.onCheck()` after to ensure snapping.

In the React component:

- Store `App` instance in a ref (`appRef`).
- Pass `onActiveChange` into App config.
- Use a `useEffect` watching `activeIndex`: when it changes (and is not undefined), call `appRef.current?.snapTo(activeIndex)`.

**TopItemsSection.tsx** — Add new props:

- `onActiveChange?: (index: number) => void` — pass through to CircularGallery.
- `activeIndex?: number` — pass through to CircularGallery.

**HeroItemSync.tsx** — New "use client" component:

- Props: `heroData: MainHeroData`, `items: ItemCardData[]` (the decodedPick items for the gallery).
- State: `activeItemIndex: number | null` (initially null).
- Derives `spotIds` array from `heroData.spots` (maps spot.id in order).
- `handleSpotClick(spotId: string)`: finds index in spotIds, sets activeItemIndex.
- `handleGalleryActiveChange(index: number)`: sets activeItemIndex to index.
- Renders `<MainHero>` with `onSpotClick={handleSpotClick}` and `activeSpotId={spotIds[activeItemIndex]}`.
- Renders `<TopItemsSection>` wrapped in `<div className="relative z-10 -mt-32 md:-mt-40">` with `items={items}`, `onActiveChange={handleGalleryActiveChange}`, `activeIndex={activeItemIndex ?? undefined}`.

**index.ts** — Add export: `export { HeroItemSync } from "./HeroItemSync";`
</action>
<verify>
<automated>cd /Users/kiyeol/development/decoded/decoded-app && npx tsc --noEmit --project packages/web/tsconfig.json 2>&1 | head -40</automated>
</verify>
<done>CircularGallery accepts activeIndex and onActiveChange. HeroItemSync wraps both MainHero and TopItemsSection with shared state. TypeScript compiles without errors.</done>
</task>

<task type="auto">
  <name>Task 2: Make SpotCards clickable + highlightable in MainHero, wire page.tsx</name>
  <files>
    packages/web/lib/components/main-renewal/MainHero.tsx
    packages/web/app/page.tsx
  </files>
  <action>
**MainHero.tsx** — Add two new props to `MainHeroProps`:
- `onSpotClick?: (spotId: string) => void`
- `activeSpotId?: string`

Pass these down to `SpotCard`:

- Add `onClick?: () => void` and `isActive?: boolean` props to SpotCard.
- Remove `pointer-events-none` from the SpotCard root div. Add `cursor-pointer` and an `onClick` handler that calls `onClick?.()`.
- Keep the spots container (`z-[3]`) as `pointer-events-none` but add `pointer-events-auto` to each individual SpotCard div so they are clickable without blocking other layers.
- When `isActive` is true, apply a glow/scale animation to the SpotCard:
  - Use GSAP or Tailwind transition: scale the card to 1.08, add a brighter glow `shadow-[0_0_20px_6px_rgba(234,253,103,0.5)]` on the dot, and increase card border opacity to `border-[#eafd67]/30`.
  - When `isActive` becomes false, revert to normal state.
  - Use a CSS transition approach (simpler): conditionally apply classes based on `isActive` prop. E.g., on the dot: `${isActive ? 'bg-[#eafd67] shadow-[0_0_20px_8px_rgba(234,253,103,0.7)]' : 'bg-[#eafd67] shadow-[0_0_12px_4px_rgba(234,253,103,0.6)]'}`. On the card container: `${isActive ? 'scale-105 border-[#eafd67]/30' : ''}` with `transition-all duration-300`.

In MainHero component: map spots with `onSpotClick` and `activeSpotId`:

```tsx
<SpotCard
  key={spot.id}
  spot={spot}
  index={i}
  onClick={() => onSpotClick?.(spot.id)}
  isActive={activeSpotId === spot.id}
/>
```

**page.tsx** — Replace the separate `<MainHero>` + `<div><TopItemsSection></div>` with `<HeroItemSync>`:

1. Import `HeroItemSync` from `@/lib/components/main`.
2. Build `decodedPickItemCards` from `decodedPick.items` (same shape as `bestItemCards` but using decodedPick data):

```typescript
const decodedPickItemCards: ItemCardData[] = decodedPick
  ? decodedPick.items.slice(0, 4).map((item) => ({
      id: String(item.id),
      brand: item.brand || "Unknown",
      name: item.name || item.label,
      imageUrl: item.imageUrl || undefined,
      link: `/items/${item.id}`,
    }))
  : bestItemCards; // fallback to bestItems if no decodedPick
```

3. Replace the Hero + TopItems render block with:

```tsx
<HeroItemSync
  heroData={heroData as MainHeroData}
  items={decodedPickItemCards}
/>
```

4. Keep `bestItemCards` computation (used as fallback and possibly in DynamicHomeFeed's `sectionData.bestItemCards`).
   </action>
   <verify>
   <automated>cd /Users/kiyeol/development/decoded/decoded-app && npx tsc --noEmit --project packages/web/tsconfig.json 2>&1 | head -40</automated>
   </verify>
   <done>SpotCards in MainHero are clickable and highlight when active. page.tsx uses HeroItemSync with decodedPick items. Full bidirectional sync works: spot click snaps gallery, gallery scroll highlights spot. TypeScript compiles cleanly.</done>
   </task>

</tasks>

<verification>
1. `npx tsc --noEmit` passes with no type errors
2. `yarn dev` — home page loads without console errors
3. Visual check: CircularGallery shows decodedPick items (same as hero spots), not bestItems
4. Click a SpotCard on hero -> gallery snaps to that item
5. Drag/scroll gallery -> corresponding SpotCard gets glow highlight
</verification>

<success_criteria>

- TopItemsSection data source changed from bestItems to decodedPick.items
- Bidirectional sync between hero spots and gallery active item works
- SpotCards are clickable (pointer-events enabled) with visual highlight on active state
- No TypeScript errors, no runtime errors on page load
  </success_criteria>

<output>
After completion, create `.planning/quick/60-spot-circulargallery/60-SUMMARY.md`
</output>
