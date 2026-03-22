---
phase: quick-023
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - packages/web/lib/components/detail/PostDetailContent.tsx
  - packages/web/lib/components/detail/PostDetailPage.tsx
autonomous: true

must_haves:
  truths:
    - "Post detail page displays hero image with gradient overlay matching decoded.pen Image Detail design (full-bleed image, bottom gradient, title overlay)"
    - "Post detail page shows artist/group name in pill badge with green dot indicator on the hero"
    - "Post detail page shows article content with magazine-style drop cap typography matching ImageDetailContent editorial style"
    - "Post detail page shows spot solutions as SpotCard/SpotDetail components from the design system instead of raw ShopGrid"
    - "Post detail page has proper loading skeleton and error states using design system components"
    - "Post detail page is responsive: mobile (393px) and desktop (1440px) layouts"
  artifacts:
    - path: "packages/web/lib/components/detail/PostDetailContent.tsx"
      provides: "Redesigned post detail content matching decoded.pen design language"
      min_lines: 120
    - path: "packages/web/lib/components/detail/PostDetailPage.tsx"
      provides: "Post detail page wrapper with proper loading/error states"
      min_lines: 60
  key_links:
    - from: "PostDetailPage.tsx"
      to: "PostDetailContent.tsx"
      via: "component render"
      pattern: "<PostDetailContent"
    - from: "PostDetailContent.tsx"
      to: "@/lib/design-system"
      via: "design system imports"
      pattern: "from.*@/lib/design-system"
    - from: "PostDetailContent.tsx"
      to: "ShopGrid"
      via: "items display"
      pattern: "<ShopGrid"
---

<objective>
Redesign the Post Detail page (`/posts/[id]`) to match the decoded.pen design system and align with the established ImageDetailContent editorial quality.

Purpose: Currently the post detail page is a bare-bones implementation with a plain hero section, basic text display, and minimal styling. The Image Detail page has a polished magazine-style editorial layout with hero parallax, drop-cap typography, chromatic analysis, and rich shop carousel. The post detail page needs the same design quality treatment.

Output: A fully redesigned PostDetailContent.tsx and PostDetailPage.tsx that deliver a cohesive editorial experience matching the decoded.pen Image Detail design language.
</objective>

<execution_context>
@/Users/kiyeol/.claude-pers/get-shit-done/workflows/execute-plan.md
@/Users/kiyeol/.claude-pers/get-shit-done/templates/summary.md
</execution_context>

<context>
@packages/web/lib/components/detail/PostDetailContent.tsx
@packages/web/lib/components/detail/PostDetailPage.tsx
@packages/web/lib/components/detail/ImageDetailContent.tsx
@packages/web/lib/components/detail/HeroSection.tsx
@packages/web/lib/components/detail/ShopGrid.tsx
@packages/web/lib/components/detail/ArticleContent.tsx
@packages/web/lib/components/detail/types.ts
@packages/web/lib/design-system/index.ts
@packages/web/lib/supabase/queries/posts.ts
@packages/web/lib/hooks/usePosts.ts
@docs/design-system/patterns.md
@docs/design-system/decoded.pen (Page 5: Image Detail - reference for hero/spot/shop patterns)
</context>

<tasks>

<task type="auto">
  <name>Task 1: Redesign PostDetailPage.tsx with design-system loading/error states</name>
  <files>packages/web/lib/components/detail/PostDetailPage.tsx</files>
  <action>
Redesign PostDetailPage.tsx to use design system components for loading and error states, and integrate properly with the page layout.

**Loading state:**
- Use a full-page skeleton layout instead of plain "Loading..." text
- Show a skeleton hero (aspect-ratio container with animated pulse)
- Show skeleton content blocks below (3-4 pulse bars for text, skeleton cards for items)
- Import LoadingSpinner or use Tailwind animate-pulse

**Error state:**
- Use the Page Error pattern from patterns.md: Card with AlertCircle icon, Heading h3, Text for message
- Import Card, Heading, Text from design system
- Add a "Go Back" button using router.back()
- Style with destructive color for error icon

**Action buttons (Share/Close):**
- Keep existing Share2 and X buttons but align with decoded.pen actionButtons design:
  - 40x40 on mobile, 48x48 on desktop
  - bg-black/50 (matching decoded.pen #00000080)
  - backdrop-blur-sm
  - Add a Flag (report) button before Share (matching decoded.pen reportBtn)
- Position: fixed right-4 top-4 z-50, gap-2

**Wrapper:**
- Keep LenisProvider for smooth scroll
- Keep GSAP fade-in entrance animation
- Ensure the page has proper header padding: pt-0 (hero is full-bleed, goes behind action buttons)
  </action>
  <verify>
- `yarn build` succeeds without type errors
- Post detail page at `/posts/[id]` shows skeleton loading state before data loads
- Error state displays design-system styled card with error message
- Action buttons (report, share, close) render correctly in top-right corner
  </verify>
  <done>
- Loading state shows full-page skeleton with hero placeholder and content blocks
- Error state uses design system Card with destructive icon and "Go Back" button
- Action buttons match decoded.pen design (40px circles, semi-transparent black background)
  </done>
</task>

<task type="auto">
  <name>Task 2: Redesign PostDetailContent.tsx to match editorial design language</name>
  <files>packages/web/lib/components/detail/PostDetailContent.tsx</files>
  <action>
Completely redesign PostDetailContent.tsx to match the decoded.pen Image Detail design and the editorial quality of ImageDetailContent.tsx.

**Available PostRow data:**
- `post.image_url` - Main image
- `post.artist_name` / `post.group_name` - Display name
- `post.media_title` - Title
- `post.media_type` - Type (event, paparazzi, etc.)
- `post.media_metadata` - JSON metadata (may contain tags)
- `post.context` - Context text / article content
- `post.created_at` - Date
- `post.view_count` - Views
- `spots[]` - Item location data
- `solutions[]` - Product matches for spots

**Section 1: Hero Section (matching decoded.pen "Page 5: Image Detail")**
- Full-bleed image using post.image_url
- Height: h-[426px] on mobile, h-[60vh] md:max-h-[600px] on desktop (matches decoded.pen 426px mobile, 600px desktop)
- Gradient overlay: bg-gradient-to-t from-black/80 via-black/40 to-transparent (matches heroImageOverlay gradient)
- Bottom-aligned content (justify-end, padding-bottom):
  - Account badge pill: rounded-full bg-white/10 border border-white/20 px-4 py-2, with green dot (w-2 h-2 rounded-full bg-emerald-500) + "@{displayName}" in Inter 14px medium white
  - Hero meta row: "{solutions.length} items featured" dot-separator "Posted: {date}" in white/60 Inter 14px
- Title: Use post.media_title if available, otherwise "Post Details". Font: Playfair Display (font-serif), 64px mobile / larger desktop, font-bold, white. Positioned at bottom of hero.
- Hotspot markers: render spots on the image using the Hotspot component from design-system if spots have position data (position_left, position_top %)
- Ken Burns entrance animation: GSAP fromTo scale 1.15 -> 1.0, duration 2s (reuse HeroSection pattern)
- Parallax on scroll for full-page (not modal) using GSAP ScrollTrigger

**Section 2: Tags + Article (matching decoded.pen "Tags + Article Section")**
- Tags row: render metadata tags as pill badges using Tag component from design-system or styled spans (bg-card rounded-full px-3 py-1.5, text-muted-foreground Inter 12px medium, prefixed with #)
- Extract tags from post.media_metadata using existing extractMetadataTags function
- Article: if post.context exists, render with ArticleContent component (already has magazine-style drop cap, prose styling, blockquote treatment)
- Add section padding: px-6 py-8, gap-6 between tags and article

**Section 3: Spot Solutions (matching decoded.pen "Spot Solutions Section")**
- Section header matching decoded.pen pattern:
  - Label: "SPOT SOLUTIONS" in Inter 9px, font-semibold, tracking-[3px], text-muted-foreground
  - Title: "Decoded Items" in Playfair Display (font-serif) 24px, font-bold
  - "View All" link text on the right, text-primary, Inter 13px medium
- Background: bg-card, padding 24px, gap-16px
- List each spot with its solution using the SpotDetail component from design-system if suitable, or create inline cards matching the decoded.pen ssItem pattern:
  - Each item: thumbnail image (rounded, 80x80), title (Inter 14px medium), brand + price (Inter 12px, muted)
  - If a spot is expanded, show expanded view with description and shop button
- Fallback to ShopGrid for displaying items in carousel/grid format (keep existing ShopGrid integration as the primary display when SpotDetail components are not fully suitable)

**Section 4: Empty State**
- If no items/solutions: use the Empty State pattern from patterns.md
  - Package icon, "No Items Yet" heading, descriptive text
  - Centered, py-16

**Typography rules (from design system):**
- Headings: font-serif (Playfair Display)
- Body/UI: font-sans (Inter)
- Use semantic colors: text-foreground, text-muted-foreground
- No hardcoded color values

**DO NOT:**
- Remove existing data transformation logic (spotToItemRow, normalizeItem) - keep it for ShopGrid compatibility
- Break the existing page route at app/posts/[id]/page.tsx
- Import components that don't exist in the design system barrel export
  </action>
  <verify>
- `yarn build` succeeds without type errors
- Post detail page at `/posts/[id]` renders:
  - Full-bleed hero image with gradient and title overlay
  - Artist/group badge pill with green dot
  - Metadata tags in pill format
  - Article with magazine-style drop cap if context exists
  - Items section with "Decoded Items" header
  - ShopGrid carousel for product items
- No console errors on page load
- Page is responsive (check 393px and 1440px widths via browser DevTools)
  </verify>
  <done>
- Hero section matches decoded.pen Image Detail design: full-bleed image, gradient overlay, bottom-aligned account badge + meta + title
- Tags displayed as rounded pills from media_metadata
- Article content uses magazine-style drop cap typography
- Spot solutions section has proper header with label/title/view-all pattern
- Items render via ShopGrid with editorial styling
- Empty state uses design system Empty State pattern
- All typography follows design system rules (serif for headings, sans for body)
- Responsive layout works on mobile (393px) and desktop (1440px)
  </done>
</task>

</tasks>

<verification>
- `cd /Users/kiyeol/development/decoded/decoded-app/packages/web && yarn build` completes without errors
- Navigate to `/posts/[id]` with a valid post ID:
  - Hero image renders full-bleed with gradient overlay
  - Account badge pill visible on hero
  - Tags render if metadata exists
  - Article renders with drop cap if context exists
  - Items section header shows "Decoded Items"
  - ShopGrid displays product items
- Navigate to `/posts/invalid-id`:
  - Error state renders with design system Card and error styling
- Page is responsive at 393px (mobile) and 1440px (desktop) breakpoints
</verification>

<success_criteria>
- Post detail page visual quality matches Image Detail page editorial style
- All sections follow decoded.pen design language (hero, tags, spot solutions, shop)
- Design system components used where available (Tag, Card, Heading, Text, LoadingSpinner)
- No TypeScript errors, no console errors
- Responsive layout at mobile and desktop breakpoints
</success_criteria>

<output>
After completion, create `.planning/quick/023-post-detail-page-completion/023-SUMMARY.md`
</output>
