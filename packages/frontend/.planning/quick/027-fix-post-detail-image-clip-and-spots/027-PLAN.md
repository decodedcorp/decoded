---
phase: quick-027
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - packages/web/lib/components/detail/PostDetailContent.tsx
  - packages/web/lib/components/detail/ImageDetailModal.tsx
autonomous: true

must_haves:
  truths:
    - "Hero image in PostDetailContent displays without clipping, showing the full image with object-contain or proper aspect-ratio scaling instead of hard-cropping tall images"
    - "Spot markers (green dots) are visible on the hero image at correct positions, rendered above the gradient overlay"
    - "Modal sidebar animation slides in from right on desktop with GSAP, matching the previous smooth behavior"
  artifacts:
    - path: "packages/web/lib/components/detail/PostDetailContent.tsx"
      provides: "Post detail hero with proper image sizing and visible spot markers"
    - path: "packages/web/lib/components/detail/ImageDetailModal.tsx"
      provides: "Modal with correct sidebar slide-in animation"
  key_links:
    - from: "PostDetailContent hero section"
      to: "spot markers div"
      via: "z-index ordering: spots must be above gradient overlay"
      pattern: "z-\\[?[12]0\\]?"
    - from: "PostDetailContent hero image"
      to: "CSS sizing"
      via: "object-contain or aspect-ratio for non-cropping display"
      pattern: "object-contain|aspect-ratio"
---

<objective>
Fix three visual issues on the Post Detail page:
1. Hero image is clipped/cropped - tall or wide images get cut off by the fixed `h-[426px]` hero container with `object-cover`
2. Spot markers (item position dots) are invisible - they exist in DOM but are hidden behind the gradient overlay or have incorrect z-ordering
3. Modal sidebar animation needs restoration - ensure the GSAP slide-in animation from right (desktop) and bottom (mobile) works smoothly

Purpose: The post detail page is the core content view. Image clipping hides important visual content, invisible spots make item discovery impossible, and animation smoothness affects perceived quality.

Output: A properly displaying post detail page where images show fully, spots are visible and interactive, and the modal transition is smooth.
</objective>

<execution_context>
@/Users/kiyeol/.claude-pers/get-shit-done/workflows/execute-plan.md
@/Users/kiyeol/.claude-pers/get-shit-done/templates/summary.md
</execution_context>

<context>
@packages/web/lib/components/detail/PostDetailContent.tsx
@packages/web/lib/components/detail/PostDetailPage.tsx
@packages/web/lib/components/detail/ImageDetailModal.tsx
@packages/web/lib/components/detail/HeroSection.tsx
@packages/web/lib/design-system/hotspot.tsx
@packages/web/lib/supabase/queries/posts.ts

## Root Cause Analysis

### Issue 1: Hero Image Clipping

**Current code (PostDetailContent.tsx, lines 156-176):**
The hero container has a FIXED height: `h-[426px] md:h-[60vh] md:max-h-[600px]` and the image uses `object-cover`. This means:
- Portrait/tall images get their sides cropped
- Landscape/wide images get their top/bottom cropped
- The fixed height doesn't adapt to the image's natural aspect ratio

**Fix approach:**
Replace the fixed-height hero with a responsive approach that respects the image's aspect ratio while capping the max height. Options:
- Use `aspect-auto` with `max-h-[70vh]` and `object-contain` on a dark background
- Or use a relative container that sizes to the image, with `max-h-[70vh]` cap
- Keep `overflow-hidden` on the container for the Ken Burns animation to work
- The gradient overlay and title content should still position at the bottom
- The spot markers need to be positioned relative to the VISIBLE image area, not the container

The simplest fix: change the hero to use `object-contain` instead of `object-cover` so the full image is visible within the container. Add a dark background behind the image so letterboxing looks intentional. Keep the fixed height constraints for layout consistency.

### Issue 2: Spot Markers Not Visible

**Current code (PostDetailContent.tsx, lines 181-195):**
Spot markers are rendered inside the hero container with `z-10`, BUT:
1. The gradient overlay div (line 178) sits at `absolute inset-0` with NO z-index, which in DOM order comes AFTER the image but BEFORE the spot markers... actually, looking at the code order: image -> gradient overlay -> spot markers -> title. The spot markers DO come after the gradient in DOM order.
2. BUT the spot markers use `position_left` and `position_top` as percentages relative to the CONTAINER, not the displayed image. With `object-cover`, the image is cropped, so percentage positions don't align with what's visible. With `object-contain`, the image will be letterboxed, so percentages need to map to the image area only.
3. The gradient overlay has `absolute inset-0` which covers everything. Spot markers have `z-10` which should be above.
4. The TITLE div also has `absolute inset-0` with content at bottom. Its z-index is implicit (no explicit z-class). If it creates a new stacking context, spots at `z-10` might still be behind it.

**Fix approach:**
- Ensure spot markers have a high enough z-index (at minimum `z-20`) to sit above both the gradient (`z-0` implicit) and the title area
- Wrap spots in their own positioned container with explicit z-ordering
- When using `object-contain`, calculate the actual displayed image rect to correctly position spots within the visible image area (not the full container)
- Add a pulsing animation so spots are clearly noticeable (the design system Hotspot component has `animate-pulse-soft`)

### Issue 3: Modal Sidebar Animation

**Current code (ImageDetailModal.tsx):**
The sidebar animation is already implemented with GSAP:
- Desktop: drawer slides from `x: "100%"` to `x: "0%"` (right to left)
- Mobile: drawer slides from `y: "100%"` to `y: "0%"` (bottom to top)
- The floating image does a FLIP animation from grid position to left side

**Potential issues:**
- The PostDetailContent rendered inside the modal drawer might cause layout issues (hero with negative margin `-mt-14` conflicting with drawer scroll container)
- The `PostDetailContent` uses `useGSAP` with `ScrollTrigger` but inside the modal, the scroll container is NOT window - it's the drawer's `scrollContainerRef`. This means ScrollTrigger won't work correctly (it defaults to window scroller)
- The `renderContent()` passes `<PostDetailContent postDetail={postDetail} />` without the `isModal` flag or `scrollContainerRef`

**Fix approach:**
- Pass `isModal` and `scrollContainerRef` props to PostDetailContent when rendered inside ImageDetailModal
- Disable or adapt ScrollTrigger-based animations when in modal context
- Ensure the hero section doesn't use negative margin when inside modal (since modal has its own layout)
</context>

<tasks>

<task type="auto">
  <name>Task 1: Fix Hero Image Clipping and Spot Marker Visibility</name>
  <files>
    packages/web/lib/components/detail/PostDetailContent.tsx
  </files>
  <action>
    **Part A: Fix hero image display to prevent clipping**

    In the hero section (around line 156-236), change the image display strategy:

    1. Keep the hero container height constraints but switch to a flexible approach:
       - Container: keep `relative w-full overflow-hidden` but change height to `min-h-[300px] max-h-[70vh]` (remove the fixed `h-[426px]` and rigid responsive heights)
       - Alternatively, for layout stability, keep the fixed height but switch the image from `object-cover` to `object-contain`:
         - Image class: change `h-full w-full object-cover` to `h-full w-full object-contain`
         - Add `bg-black` to the hero container so letterbox bars are black (matching editorial feel)
       - The second approach (object-contain + bg-black) is simpler and preserves layout consistency. Use this approach.

    2. Update the hero container div (line 156-158):
       ```tsx
       <div
         ref={heroRef}
         className="relative w-full overflow-hidden bg-black h-[426px] md:h-[60vh] md:max-h-[600px]"
       >
       ```

    3. Update the image element (line 162-168):
       ```tsx
       <img
         ref={imageRef}
         src={post.image_url!}
         alt={heroTitle}
         className="h-full w-full object-contain will-change-transform"
         loading="eager"
       />
       ```

    **Part B: Fix spot marker visibility and positioning**

    The spots are currently positioned using `position_left` and `position_top` as percentages of the container. With `object-contain`, the image may not fill the full container, so spots need to be positioned relative to the actual visible image area.

    1. Add state tracking for the actual displayed image dimensions (similar to ImageCanvas pattern):
       ```tsx
       const [naturalSize, setNaturalSize] = useState<{width: number; height: number} | null>(null);
       const [containerSize, setContainerSize] = useState<{width: number; height: number} | null>(null);
       ```

    2. Add `onLoad` handler to the hero image to capture natural dimensions:
       ```tsx
       onLoad={(e) => {
         setNaturalSize({
           width: e.currentTarget.naturalWidth,
           height: e.currentTarget.naturalHeight,
         });
       }}
       ```

    3. Add a `useEffect` with `ResizeObserver` on `heroRef` to track container size.

    4. Create a helper function `getContainedImageRect()` that calculates the actual displayed image rect within the container when using `object-contain`:
       ```tsx
       const getContainedImageRect = () => {
         if (!naturalSize || !containerSize) return null;
         const containerAspect = containerSize.width / containerSize.height;
         const imageAspect = naturalSize.width / naturalSize.height;

         let width, height, left, top;
         if (imageAspect > containerAspect) {
           // Image is wider - fits width, letterboxed top/bottom
           width = containerSize.width;
           height = width / imageAspect;
           left = 0;
           top = (containerSize.height - height) / 2;
         } else {
           // Image is taller - fits height, letterboxed left/right
           height = containerSize.height;
           width = height * imageAspect;
           top = 0;
           left = (containerSize.width - width) / 2;
         }
         return { width, height, left, top };
       };
       ```

    5. Update spot marker positioning to use the contained image rect:
       ```tsx
       {spots.map((spot) => {
         const imageRect = getContainedImageRect();
         const spotLeft = imageRect
           ? imageRect.left + (parseFloat(spot.position_left) / 100) * imageRect.width
           : undefined;
         const spotTop = imageRect
           ? imageRect.top + (parseFloat(spot.position_top) / 100) * imageRect.height
           : undefined;

         return (
           <div
             key={spot.id}
             className="absolute w-6 h-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/80 bg-primary shadow-lg cursor-pointer hover:scale-125 transition-transform z-20"
             style={
               imageRect
                 ? { left: `${spotLeft}px`, top: `${spotTop}px` }
                 : {
                     left: `${parseFloat(spot.position_left)}%`,
                     top: `${parseFloat(spot.position_top)}%`,
                   }
             }
             title={solutions.find((s) => s.spot_id === spot.id)?.title || "Item"}
           >
             <span className="absolute inset-0 rounded-full animate-ping bg-primary/30" />
           </div>
         );
       })}
       ```

    6. Ensure z-index layering is correct:
       - Image: no z-index (base layer)
       - Gradient overlay: `z-0` or no z-index
       - Spot markers: `z-20` (was `z-10`, increase to be safely above gradient AND title)
       - Title content: `z-10`

    **Part C: Add isModal prop support**

    Add `isModal` and `scrollContainerRef` optional props to PostDetailContent:
    ```tsx
    type Props = {
      postDetail: PostDetail;
      isModal?: boolean;
      scrollContainerRef?: React.RefObject<HTMLElement>;
    };
    ```

    When `isModal` is true:
    - Skip the negative margin on hero (it's inside a drawer, not under the global header)
    - Skip ScrollTrigger-based parallax animations (the scroll container is the drawer, not window)
    - Reduce hero height: `h-[300px] md:h-[45vh]` instead of the full-page sizes

    Wrap the `useGSAP` ScrollTrigger animations in a condition:
    ```tsx
    useGSAP(() => {
      if (!heroRef.current || !imageRef.current || !titleRef.current) return;
      const ctx = gsap.context(() => {
        // Ken Burns entrance - always
        gsap.fromTo(imageRef.current, { scale: 1.15 }, { scale: 1.0, duration: 2, ease: "power2.out" });
        // Title reveal - always
        gsap.fromTo(titleRef.current, { y: "60%", opacity: 0 }, { y: 0, opacity: 1, duration: 1.5, delay: 0.5, ease: "expo.out" });

        // Parallax + title fade - only when NOT in modal
        if (!isModal) {
          gsap.to(imageRef.current, { y: 100, ease: "none", scrollTrigger: { trigger: heroRef.current, start: "top top", end: "bottom top", scrub: true } });
          gsap.to(titleRef.current, { opacity: 0, y: -50, ease: "none", scrollTrigger: { trigger: heroRef.current, start: "top top", end: "30% top", scrub: true } });
        }
      }, heroRef);
      return () => ctx.revert();
    }, [isModal]);
    ```

    This ensures that when PostDetailContent is rendered inside the modal drawer, the scroll-dependent animations don't interfere with the drawer's own scroll container.
  </action>
  <verify>
    1. `yarn --cwd packages/web build` passes without errors
    2. Navigate to `/posts/[id]` with a tall/portrait image: the full image should be visible (letterboxed with black bars on sides if needed), not cropped
    3. Spot markers (green dots) should be visible on the image at the correct positions corresponding to detected items
    4. Spots should pulse with animation and be interactive (hover shows title tooltip)
    5. The gradient overlay at the bottom of the hero should still be visible
    6. The title, account badge, and meta info at the bottom of the hero should still be visible and properly layered
  </verify>
  <done>
    Hero image displays fully without cropping (using object-contain with black background). Spot markers are visible at correct positions relative to the displayed image area, with z-index above the gradient overlay. Spots pulse with animation and show tooltip on hover.
  </done>
</task>

<task type="auto">
  <name>Task 2: Fix Modal Sidebar Animation and PostDetailContent Integration</name>
  <files>
    packages/web/lib/components/detail/ImageDetailModal.tsx
  </files>
  <action>
    Update `ImageDetailModal.tsx` to pass the correct props to `PostDetailContent` when rendering inside the modal drawer.

    1. In the `renderContent()` function (around line 384), change:
       ```tsx
       // Before:
       return <PostDetailContent postDetail={postDetail} />;

       // After:
       return (
         <PostDetailContent
           postDetail={postDetail}
           isModal={true}
           scrollContainerRef={scrollContainerRef}
         />
       );
       ```

    2. Verify the GSAP enter animation is correct. The current code (lines 259-292) sets initial states and animates:
       - Desktop: `x: "100%"` -> `x: "0%"` (slide from right)
       - Mobile: `y: "100%"` -> `y: "0%"` (slide from bottom)

       This looks correct. If the user reports the animation "was better before", the issue is likely that PostDetailContent's ScrollTrigger animations are conflicting with the modal's scroll container. Passing `isModal={true}` (from Task 1) should fix this by disabling ScrollTrigger-based animations inside the modal.

    3. Clean up the debug `console.log` statements that clutter the console:
       - Remove or wrap in `process.env.NODE_ENV === 'development'` guard the `useEffect` console logs on lines 33-42 and 391-402
       - Keep the error console statements

    4. The `scrollContainerRef` type needs to match. In ImageDetailModal, it's `useRef<HTMLDivElement>(null)`. The PostDetailContent prop expects `React.RefObject<HTMLElement>`. Since `HTMLDivElement extends HTMLElement`, this should be compatible. If TypeScript complains, cast it: `scrollContainerRef={scrollContainerRef as React.RefObject<HTMLElement>}`.
  </action>
  <verify>
    1. `yarn --cwd packages/web build` passes without errors
    2. Click a post card from any grid view (explore, feed, profile) - the modal should slide in smoothly from the right (desktop) or bottom (mobile)
    3. Inside the modal, the PostDetailContent should render correctly WITHOUT layout issues (no extra negative margin, no broken scroll)
    4. Scrolling within the modal drawer should work smoothly without ScrollTrigger errors in console
    5. The floating image on the left side (desktop) should animate from the grid position to its target
    6. Closing the modal should animate smoothly (fade out + slide out)
    7. No excessive console.log spam in browser devtools
  </verify>
  <done>
    Modal renders PostDetailContent with isModal flag, preventing ScrollTrigger conflicts. Sidebar animation works smoothly on both desktop and mobile. Debug console logs are cleaned up.
  </done>
</task>

</tasks>

<verification>
- `yarn --cwd packages/web build` completes without errors
- No TypeScript errors in modified files
- Hero image shows fully without cropping on post detail page
- Spot markers are visible and correctly positioned on the hero image
- Modal sidebar animation slides in smoothly from right (desktop) / bottom (mobile)
- ScrollTrigger animations work on full page but are disabled in modal context
- No console.log spam from debug statements
</verification>

<success_criteria>
1. Post detail hero image displays the full image without cropping (object-contain + black bg)
2. Spot markers (green dots) are visible on the hero image at the correct item positions
3. Spots have pulse animation and show tooltip on hover
4. Modal sidebar animation slides in smoothly with GSAP
5. PostDetailContent works correctly in both full-page and modal contexts
6. Build passes without errors
</success_criteria>

<output>
After completion, create `.planning/quick/027-fix-post-detail-image-clip-and-spots/027-SUMMARY.md`
</output>
