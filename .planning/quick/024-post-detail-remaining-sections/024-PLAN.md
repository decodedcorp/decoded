---
phase: quick
plan: 024
type: execute
wave: 1
depends_on: ["023"]
files_modified:
  - packages/web/lib/components/detail/DecodedItemsSection.tsx
  - packages/web/lib/components/detail/GallerySection.tsx
  - packages/web/lib/components/detail/ShopCarouselSection.tsx
  - packages/web/lib/components/detail/RelatedLooksSection.tsx
  - packages/web/lib/components/detail/PostDetailContent.tsx
autonomous: true

must_haves:
  truths:
    - "Decoded Items section shows selectable item list with expandable detail card"
    - "Gallery section renders a responsive image grid from related images"
    - "Shop the Look carousel displays product cards with horizontal scroll"
    - "Related Looks section shows masonry-style grid of related post images"
    - "All sections render conditionally - only when data exists"
  artifacts:
    - path: "packages/web/lib/components/detail/DecodedItemsSection.tsx"
      provides: "Decoded Items with item list + expandable detail card"
    - path: "packages/web/lib/components/detail/GallerySection.tsx"
      provides: "Gallery image grid section"
    - path: "packages/web/lib/components/detail/ShopCarouselSection.tsx"
      provides: "Shop the Look horizontal product carousel"
    - path: "packages/web/lib/components/detail/RelatedLooksSection.tsx"
      provides: "Related Looks masonry grid"
    - path: "packages/web/lib/components/detail/PostDetailContent.tsx"
      provides: "Orchestrates all sections with conditional rendering"
  key_links:
    - from: "PostDetailContent.tsx"
      to: "DecodedItemsSection.tsx"
      via: "spots + solutions data"
    - from: "PostDetailContent.tsx"
      to: "GallerySection.tsx"
      via: "useRelatedImagesByAccount hook"
    - from: "PostDetailContent.tsx"
      to: "ShopCarouselSection.tsx"
      via: "solutions array"
    - from: "PostDetailContent.tsx"
      to: "RelatedLooksSection.tsx"
      via: "useRelatedImagesByAccount hook"
---

<objective>
Build the 4 remaining Post Detail page sections to match the decoded.pen design:
1. Decoded Items (redesign from ShopGrid to list+expandable card)
2. Gallery ("More from this Look")
3. Shop the Look (product carousel)
4. Related Looks (masonry grid)

Purpose: Complete the post detail page to match the full decoded.pen design spec, replacing the current basic ShopGrid with a richer, more editorial layout.
Output: 4 new section components + updated PostDetailContent orchestrator.
</objective>

<execution_context>
@/Users/kiyeol/.claude-pers/get-shit-done/workflows/execute-plan.md
</execution_context>

<context>
@packages/web/lib/components/detail/PostDetailContent.tsx
@packages/web/lib/components/detail/ShopGrid.tsx
@packages/web/lib/components/detail/RelatedImages.tsx
@packages/web/lib/supabase/queries/posts.ts
@packages/web/lib/supabase/types.ts
@packages/web/lib/components/detail/types.ts
@docs/pencil-screen/decoded_post_detail_desktop_260205.png
@docs/pencil-screen/decoded_post_detail_mobile_260205.png
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create DecodedItemsSection and ShopCarouselSection components</name>
  <files>
    packages/web/lib/components/detail/DecodedItemsSection.tsx
    packages/web/lib/components/detail/ShopCarouselSection.tsx
  </files>
  <action>
**DecodedItemsSection.tsx** -- Replaces the current ShopGrid for post detail.

Props: `{ spots: SpotRow[]; solutions: SolutionRow[]; }` (import from `@/lib/supabase/types`)

State: `selectedIndex: number` (default 0, first item selected)

Build a combined spot+solution data array by matching `solution.spot_id === spot.id`. Each entry: `{ spot, solution, title, brand, price, thumbnailUrl, description, matchType }`. Brand comes from extracting from solution.title pattern or solution.keywords. Price: format `solution.price_amount` with `solution.price_currency`. Description: `solution.description`.

**MOBILE layout** (default, shown below md breakpoint):

Section header matching decoded.pen pattern:
- Label: "SPOT SOLUTIONS" -- Inter 9px semibold, tracking-[3px], text-muted-foreground
- Title: "Decoded Items" -- Playfair Display (use `font-serif`) 24px bold, text-foreground
- "View All" link on right if items > 3: Inter 13px medium, text-primary

Item list (vertical, gap-3):
- Each item row: card bg, rounded-xl, padding-3, flex row, items-center, gap-3
  - Thumbnail: 64x64px, rounded-lg, object-cover, bg-secondary fallback
  - Content (flex-1, vertical, gap-1):
    - Title: Inter 14px semibold, text-foreground, line-clamp-1
    - Brand + Price: Inter 12px normal, text-muted-foreground (format: "BRAND . $PRICE")
  - Chevron-right icon: 20px, text-muted-foreground
  - When selected (selectedIndex matches): bg-primary instead of bg-card, all text becomes primary-foreground

Expanded detail card (shown below the list when an item is selected):
- Container: bg-secondary, rounded-xl, padding-4, vertical layout, gap-3
- Header row (horizontal, gap-3):
  - Image: 80x100px, rounded-lg, object-cover
  - Info (vertical, gap-1.5):
    - Badge: inline-flex, bg-primary, rounded-[4px], px-1.5 py-0.5, text: "EXACT MATCH" (or matchType if available) -- 8px bold white, tracking-[0.5px]
    - Title: Inter 14px semibold, text-foreground
    - Brand: Inter 12px normal, text-muted-foreground
    - Price: Inter 16px bold, text-primary
- Styling tip section (if description exists):
  - Label: "STYLING TIP" -- 9px semibold, tracking-[1px], text-muted-foreground
  - Text: 12px normal, leading-[1.4], text-foreground
- Action row (horizontal, gap-2):
  - "Shop Now" button: flex-1, bg-primary, rounded-lg, py-2.5 px-3.5, center, gap-1.5
    - ShoppingBag icon (16px) + "Shop Now" text (13px semibold) -- both primary-foreground
    - Links to solution.original_url (or affiliate_url) in new tab
  - Save button: bg-card, rounded-lg, py-2.5 px-3.5, center
    - Bookmark icon (16px), text-foreground

**DESKTOP layout** (md and above):
- Use `md:flex md:flex-row md:gap-6` wrapper
- Left side (md:w-[400px] md:flex-shrink-0): header + item list (same structure)
- Right side (md:flex-1): expanded detail card with larger dimensions:
  - Image: 140x180px
  - Title: 20px bold
  - Price: 24px bold
  - Tip text: 14px, leading-[1.6]
  - "SIMILAR OPTIONS" section (if more than 1 solution for same spot): row of 80x80 thumbnails + "+N" more indicator
  - Action row: Shop Now + Save + Share (share-2 icon) buttons

Animate with GSAP: stagger item list on scroll into view.

---

**ShopCarouselSection.tsx** -- Product carousel below the gallery.

Props: `{ solutions: SolutionRow[]; }` (reuses solution data as product cards)

Section header:
- Label: "CURATED SELECTION" -- Inter 9px semibold, tracking-[3px], text-muted-foreground
- Title: "Shop the Look" -- font-serif (Playfair Display) 28px bold mobile / 32px desktop

**MOBILE**: Horizontal scroll container with snap-x. Left padding 24px for header alignment.
Each product card: 140px width, bg-card/50 with border border-border/10, rounded-xl, padding-2, vertical layout, gap-2.5
- Image: fill width, 160px height, rounded-lg, object-cover
- Info (vertical, gap-1):
  - Brand: Inter 9px semibold, tracking-[1px], text-muted-foreground, uppercase
  - Name: font-serif 13px semibold, text-foreground, line-clamp-1
  - Price: Inter 11px semibold, text-primary
- "View Details" button: full width, 32px height, bg-primary (first card) or bg-secondary (rest), rounded-md, center, Inter 11px semibold

**DESKTOP**: Same header + nav arrows (left: secondary bg 48px circle, right: primary bg 48px circle).
Product cards: 280px width, image 280px height. Horizontal scroll with overflow-x-auto.

Use useRef + scroll helper for nav arrows. Hide arrows on mobile.
  </action>
  <verify>
    - `cd /Users/kiyeol/development/decoded/decoded-app && npx tsc --noEmit --project packages/web/tsconfig.json 2>&1 | head -30` passes with no errors in the new files
    - Both components render conditionally (return null if no data)
  </verify>
  <done>
    - DecodedItemsSection renders item list with selectable expandable detail card, mobile + desktop layouts
    - ShopCarouselSection renders horizontal product card carousel with decoded.pen styling
    - Both components have proper TypeScript types, no `any`
  </done>
</task>

<task type="auto">
  <name>Task 2: Create GallerySection and RelatedLooksSection, wire all into PostDetailContent</name>
  <files>
    packages/web/lib/components/detail/GallerySection.tsx
    packages/web/lib/components/detail/RelatedLooksSection.tsx
    packages/web/lib/components/detail/PostDetailContent.tsx
  </files>
  <action>
**GallerySection.tsx** -- "More from this Look" image grid.

Props: `{ images: Array<{ id: string; image_url: string | null }>; }` (accepts any array of objects with id + image_url)

Only render if `images.length > 0`.

Section header:
- Label: "MORE FROM THIS LOOK" mobile / "PHOTO GALLERY" desktop -- Inter 9px/10px semibold, tracking-[3px], text-muted-foreground
- Title: "Gallery" mobile (24px serif bold) / "More from this Look" desktop (32px serif bold)

**MOBILE** (bg-card, padding-6, gap-4):
- Row 1: 3 equal-width images, 140px height, rounded-lg, gap-3, object-cover
- Row 2: 2 equal-width images, 140px height, rounded-lg, gap-3, object-cover
- If fewer than 5 images, fill available slots (row 1 up to 3, row 2 remainder)
- If fewer than 3 images, single row with all images

**DESKTOP** (md: bg-card, padding: 48px vertical / 64px horizontal, gap-8):
- Row 1: 3 equal images, 400px height, rounded-xl (12px), gap-4
- Row 2: 2 equal images, 300px height, rounded-xl (12px), gap-4
- Same adaptive logic for fewer images

Each image: Next.js Image component with fill + object-cover. Wrap in Link to `/images/{id}` if id exists. Hover: scale-105 transition 700ms.

GSAP: stagger fade-in on scroll.

---

**RelatedLooksSection.tsx** -- Masonry-style 2-column grid of related posts.

Props: `{ images: Array<{ id: string; image_url: string | null }>; displayName: string; }`

Only render if `images.length > 0`.

Section header:
- Label: `MORE FROM @${displayName.toUpperCase()}` mobile / same desktop -- Inter 9px semibold, tracking-[3px], text-muted-foreground
- Title: "Related Looks" -- font-serif 24px bold

**MOBILE + DESKTOP** (bg-card, padding-6, gap-4):
- 2-column grid with gap-3, masonry effect via alternating heights
- Column 1: first image 200px height, second image 140px height (stacked vertically, gap-3)
- Column 2: first image 140px height, second image 200px height (stacked vertically, gap-3)
- Rounded-xl, object-cover, hover scale-105 + gradient overlay with @displayName on hover

Take first 4 images from the array. Each wraps in Link to `/images/{id}`.

GSAP: stagger reveal on scroll.

---

**PostDetailContent.tsx** -- REWRITE Section 3 and add Sections 4-6.

Import the 4 new components. Import `useRelatedImagesByAccount` from `@/lib/hooks/useImages`.

At the top of the component, after existing data processing:
1. Keep existing `spots`, `solutions`, `normalizedItems`, `hasItems` logic
2. Add: `const displayName = post.artist_name || post.group_name || "Unknown";`  (already exists)
3. Add: call `useRelatedImagesByAccount(post.id, displayName)` to get related images. Handle `{ data: relatedImages }`.
4. Derive gallery/related data:
   - `galleryImages`: first 5 from relatedImages (for Gallery section)
   - `relatedLookImages`: remaining images after first 5 (for Related Looks), or if fewer total, split proportionally

Replace Section 3 (the current ShopGrid block) with:

```
{/* Section 3: Decoded Items */}
{hasItems && (
  <DecodedItemsSection spots={spots} solutions={solutions} />
)}

{/* Section 4: Gallery */}
{galleryImages && galleryImages.length > 0 && (
  <GallerySection images={galleryImages} />
)}

{/* Section 5: Shop the Look Carousel */}
{solutions.length > 0 && (
  <ShopCarouselSection solutions={solutions} />
)}

{/* Section 6: Related Looks */}
{relatedLookImages && relatedLookImages.length > 0 && (
  <RelatedLooksSection images={relatedLookImages} displayName={displayName} />
)}
```

Keep the empty state (Section 4 currently) as fallback when `!hasItems`.

Remove the ShopGrid import from PostDetailContent (it's no longer used here -- ImageDetailContent still uses it).

IMPORTANT: Do NOT remove `spotToItemRow` and `normalizeItem` imports yet -- they may still be needed elsewhere or can be cleaned up separately.

IMPORTANT: `useRelatedImagesByAccount` accepts `(currentImageId: string, account: string)`. The `post.id` serves as currentImageId (to exclude current), and `displayName` serves as account. The hook returns `{ data: PostRow[] | undefined, isLoading }`. PostRow has `id` and `image_url` fields which is exactly what GallerySection and RelatedLooksSection need.
  </action>
  <verify>
    - `cd /Users/kiyeol/development/decoded/decoded-app && npx tsc --noEmit --project packages/web/tsconfig.json 2>&1 | head -30` passes
    - `cd /Users/kiyeol/development/decoded/decoded-app && yarn build 2>&1 | tail -20` completes without errors
    - Visit a post detail page in dev to confirm sections render (those with data appear, those without gracefully hide)
  </verify>
  <done>
    - PostDetailContent renders all 4 new sections in decoded.pen order
    - Gallery section shows related images in 3+2 grid layout
    - Related Looks section shows masonry 2-column grid
    - All sections conditional -- only render when data exists
    - No TypeScript errors, build passes
  </done>
</task>

</tasks>

<verification>
1. TypeScript: `npx tsc --noEmit` passes with zero errors in detail/ directory
2. Build: `yarn build` passes
3. Visual: Post detail page shows all sections in order: Hero > Tags > Article > Decoded Items > Gallery > Shop the Look > Related Looks
4. Conditional rendering: Sections without data do not render (no empty containers, no errors)
5. Responsive: Mobile shows stacked layout, desktop shows side-by-side for Decoded Items
</verification>

<success_criteria>
- All 4 decoded.pen sections are implemented as separate components
- PostDetailContent orchestrates them with conditional rendering
- Mobile and desktop layouts match decoded.pen screenshots
- No regressions: hero, tags, article sections unchanged
- TypeScript strict, zero `any` types, build clean
</success_criteria>

<output>
After completion, update `.planning/quick/024-post-detail-remaining-sections/` with summary of what was built.
</output>
