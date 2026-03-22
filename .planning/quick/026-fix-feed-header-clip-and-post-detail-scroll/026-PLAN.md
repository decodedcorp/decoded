---
phase: quick-026
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - packages/web/app/feed/page.tsx
  - packages/web/app/posts/[id]/page.tsx
  - packages/web/lib/components/detail/PostDetailPage.tsx
  - packages/web/lib/components/detail/PostDetailContent.tsx
autonomous: true

must_haves:
  truths:
    - "Feed page images are fully visible without being clipped by headers"
    - "Feed page does not render duplicate headers (no double Header + ConditionalNav)"
    - "Post detail page content scrolls without visual clipping or cut-off"
    - "Post detail hero image displays full-bleed under the fixed header"
  artifacts:
    - path: "packages/web/app/feed/page.tsx"
      provides: "Feed page without duplicate header or double padding"
    - path: "packages/web/lib/components/detail/PostDetailPage.tsx"
      provides: "Post detail with correct scroll and full-bleed hero"
  key_links:
    - from: "packages/web/app/feed/page.tsx"
      to: "packages/web/lib/components/ConditionalNav.tsx"
      via: "Global layout provides headers; feed page must NOT add its own"
      pattern: "MainContentWrapper"
---

<objective>
Fix two visual clipping bugs: (1) Feed page images clipped by overlapping headers and double padding, (2) Post detail page content clipping during scroll.

Purpose: Both pages have layout issues caused by conflict between the global layout's header/padding system (ConditionalNav + MainContentWrapper) and page-level redundant header/padding. These cause images to be hidden behind headers and content to clip during scroll.

Output: Clean feed page without duplicate headers, and properly scrolling post detail page with full-bleed hero.
</objective>

<execution_context>
@/Users/kiyeol/.claude-pers/get-shit-done/workflows/execute-plan.md
@/Users/kiyeol/.claude-pers/get-shit-done/templates/summary.md
</execution_context>

<context>
## Root Cause Analysis

### Issue 1: Feed Header Clipping

The feed page (`app/feed/page.tsx`) has THREE problems:

1. **Duplicate header**: It renders `<Header />` (the old mobile-only header from `lib/components/Header.tsx`), but the global `layout.tsx` already renders `ConditionalNav` which includes both `DesktopHeader` and `MobileHeader`. This means mobile users see TWO headers stacked.

2. **Double padding**: The feed page wraps content in `<main className="min-h-screen bg-background pt-14 pb-14 md:pt-16 md:pb-0">`, but the global `MainContentWrapper` already applies `pt-14 md:pt-[72px] pb-16 md:pb-0`. The content gets pushed down by BOTH paddings.

3. **Fixed height miscalculation**: `h-[calc(100vh-3.5rem)]` doesn't account for the actual header height (72px on desktop from MainContentWrapper, not 3.5rem/56px). And since there's double padding, the calculation is wrong regardless.

**Fix approach**: Remove the duplicate `<Header />` import and the redundant `<main>` wrapper. The feed page content should render directly since the global layout handles all header padding. Adjust the height calc to account for the actual MainContentWrapper padding.

### Issue 2: Post Detail Scroll Clipping

The post detail page has TWO related problems:

1. **Hero not full-bleed**: The global `MainContentWrapper` adds `pt-14 md:pt-[72px]`, pushing the hero section down. For an editorial detail page, the hero image should go edge-to-edge, extending UNDER the fixed header (which is already semi-transparent with `backdrop-blur`). The hero needs negative margin to pull up into the header space.

2. **GSAP ScrollTrigger offset**: The parallax animation uses `start: "top top"` which assumes the hero starts at viewport top. With `MainContentWrapper` padding, the trigger point is offset, causing the scroll animation to fire too early or clip content unexpectedly.

**Fix approach**: Apply negative top margin on the PostDetailPage container to pull the hero up under the header (counteracting MainContentWrapper's padding). Adjust the GSAP ScrollTrigger start points to account for the actual content position.

## Key Files

@packages/web/app/feed/page.tsx
@packages/web/app/feed/FeedClient.tsx
@packages/web/lib/components/feed/FeedHeader.tsx
@packages/web/app/posts/[id]/page.tsx
@packages/web/lib/components/detail/PostDetailPage.tsx
@packages/web/lib/components/detail/PostDetailContent.tsx
@packages/web/lib/components/ConditionalNav.tsx (global layout context - DO NOT modify)
@packages/web/app/layout.tsx (global layout - DO NOT modify)
</context>

<tasks>

<task type="auto">
  <name>Task 1: Fix Feed Page Duplicate Header and Double Padding</name>
  <files>
    packages/web/app/feed/page.tsx
  </files>
  <action>
    Remove the duplicate `<Header />` component import and rendering from `app/feed/page.tsx`. The global layout already renders `ConditionalNav` (which includes DesktopHeader + MobileHeader + MobileNavBar), so the feed page must NOT render its own header.

    Remove the redundant `<main>` wrapper with its own padding classes (`pt-14 pb-14 md:pt-16 md:pb-0`). The global `MainContentWrapper` already handles header padding (`pt-14 md:pt-[72px] pb-16 md:pb-0`).

    The feed page should render just a simple wrapper div with the FeedClient. Adjust the height calculation for the feed container:
    - Mobile: `h-[calc(100vh-3.5rem-4rem)]` (56px top header + 64px bottom nav bar)
    - Desktop: `h-[calc(100vh-72px)]` (72px desktop header, no bottom nav)
    - Use Tailwind responsive: `h-[calc(100dvh-120px)] md:h-[calc(100dvh-72px)]`
    - Use `100dvh` instead of `100vh` for better mobile viewport handling

    The resulting page.tsx should look approximately like:
    ```tsx
    import { FeedClient } from "./FeedClient";

    export default function FeedPage() {
      return (
        <div className="h-[calc(100dvh-120px)] md:h-[calc(100dvh-72px)]">
          <FeedClient />
        </div>
      );
    }
    ```

    Do NOT modify FeedClient.tsx, FeedHeader.tsx, or any other feed components - only the page wrapper.
  </action>
  <verify>
    1. Run `yarn --cwd packages/web build` to verify no build errors
    2. Visually confirm: no duplicate headers appear on /feed
    3. Visually confirm: feed images are not clipped by the header
    4. Visually confirm: feed content fills the available viewport height correctly on both mobile and desktop widths
  </verify>
  <done>
    Feed page renders without duplicate headers. Images are fully visible below the global header. No double padding. Height calculation matches actual available viewport space.
  </done>
</task>

<task type="auto">
  <name>Task 2: Fix Post Detail Page Scroll Clipping with Full-Bleed Hero</name>
  <files>
    packages/web/app/posts/[id]/page.tsx
    packages/web/lib/components/detail/PostDetailPage.tsx
    packages/web/lib/components/detail/PostDetailContent.tsx
  </files>
  <action>
    The post detail page hero should be full-bleed (extending under the semi-transparent fixed header). The global `MainContentWrapper` adds `pt-14 md:pt-[72px]` which pushes content down. To achieve full-bleed:

    **In `PostDetailPage.tsx`:**
    - Add negative top margin to the outermost wrapper to pull content up into the header padding area: `-mt-14 md:-mt-[72px]`
    - This counteracts MainContentWrapper's padding, allowing the hero to sit flush at the viewport top (under the transparent header)
    - Apply this to the main container div (the one with `ref={pageRef}`)
    - Also apply it to the loading skeleton wrapper (`min-h-screen bg-background`) and error state wrapper
    - For the loading skeleton hero, add padding-top to the skeleton content inside the hero to prevent it from being hidden under the header: the gradient overlay and text content at the bottom are fine since they're at the bottom of the hero

    **In `PostDetailContent.tsx`:**
    - The hero section already has `overflow-hidden` which is correct
    - Adjust the GSAP ScrollTrigger `start` for the parallax animation from `"top top"` to `"top 72px"` on desktop (or use a dynamic offset). Since the hero now extends to viewport top (under header), `"top top"` should actually be correct after the negative margin fix. Keep it as is unless testing reveals issues.
    - The key fix is that the hero height needs to account for the negative margin. Currently `h-[426px] md:h-[60vh] md:max-h-[600px]` - this should remain as is since the hero is meant to be this visual size, and the negative margin just repositions where it starts.

    **In `app/posts/[id]/page.tsx`:**
    - No changes needed - it's a thin wrapper.

    The visual result should be: hero image extends from the very top of the viewport (behind the semi-transparent header with backdrop-blur), creating an immersive editorial feel. As the user scrolls, the parallax effect works smoothly without content clipping.
  </action>
  <verify>
    1. Run `yarn --cwd packages/web build` to verify no build errors
    2. Navigate to any post detail page (e.g., /posts/[any-id])
    3. Visually confirm: hero image extends to the top of the viewport, visible behind the semi-transparent header
    4. Scroll down and confirm: no content clipping occurs during scroll
    5. Confirm: GSAP parallax animation on the hero image works smoothly
    6. Confirm: loading skeleton state also displays correctly (no awkward gap at top)
    7. Confirm: error state displays centered correctly
  </verify>
  <done>
    Post detail hero is full-bleed under the header. Scrolling works without content clipping. GSAP scroll animations fire at correct positions. Loading and error states display correctly.
  </done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <what-built>
    Fixed two visual clipping issues:
    1. Feed page: removed duplicate header and double padding, corrected viewport height calculation
    2. Post detail page: made hero full-bleed under the semi-transparent header, fixed scroll clipping
  </what-built>
  <how-to-verify>
    1. Open the dev server (`yarn dev` from packages/web)
    2. Navigate to `/feed`:
       - On mobile width: verify only ONE header appears at top (no duplicate)
       - Verify feed card images are fully visible, not hidden behind header
       - Scroll the feed - images load correctly with infinite scroll
    3. Navigate to any post detail page (`/posts/[id]`):
       - Verify the hero image extends to the very top of the viewport (under the blurred header)
       - Scroll down slowly - verify NO content gets clipped or cut off
       - Verify the parallax effect on the hero image is smooth
       - Verify all sections below the hero (tags, article, items, gallery) display correctly
    4. Test on both mobile and desktop viewport widths
  </how-to-verify>
  <resume-signal>Type "approved" or describe any remaining issues</resume-signal>
</task>

</tasks>

<verification>
- `yarn --cwd packages/web build` completes without errors
- No TypeScript errors in modified files
- Feed page: single header, correct padding, full viewport usage
- Post detail page: full-bleed hero, smooth scroll, no clipping
</verification>

<success_criteria>
1. Feed page shows images without header clipping on both mobile and desktop
2. Feed page does not render duplicate headers
3. Post detail page hero extends full-bleed under the transparent header
4. Post detail page scrolls without any content clipping
5. Both pages build without errors
</success_criteria>

<output>
After completion, create `.planning/quick/026-fix-feed-header-clip-and-post-detail-scroll/026-SUMMARY.md`
</output>
