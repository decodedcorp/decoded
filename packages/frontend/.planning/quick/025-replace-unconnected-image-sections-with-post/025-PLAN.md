---
phase: quick
plan: 025
type: execute
wave: 1
depends_on: []
files_modified:
  - packages/web/app/images/page.tsx
  - packages/web/app/images/ImagesClient.tsx
  - packages/web/app/images/ImageCard.tsx
  - packages/web/app/images/[id]/page.tsx
  - packages/web/lib/components/detail/ImageDetailPage.tsx
  - packages/web/lib/components/detail/ImageDetailModal.tsx
  - packages/web/lib/components/detail/ImageDetailContent.tsx
  - packages/web/lib/components/detail/RelatedImages.tsx
  - packages/web/lib/components/detail/PostDetailContent.tsx
autonomous: true

must_haves:
  truths:
    - "/images page shows posts from the posts table via REST API, not from the old image table"
    - "/images/[id] detail page fetches and displays post data with spots/solutions, not old image+item data"
    - "Related Images section in both image detail and post detail uses posts data instead of post_image join table on old image table"
    - "All image grid cards link to /posts/[id] instead of /images/[id]"
    - "No runtime errors when navigating /images and /images/[id] routes"
  artifacts:
    - path: "packages/web/app/images/ImagesClient.tsx"
      provides: "Post-based infinite grid replacing image-table-based grid"
    - path: "packages/web/app/images/ImageCard.tsx"
      provides: "Card component using PostGridItem type instead of ImageRow"
    - path: "packages/web/lib/components/detail/ImageDetailPage.tsx"
      provides: "Detail page using usePostById instead of useImageById"
    - path: "packages/web/lib/components/detail/RelatedImages.tsx"
      provides: "Related posts section using posts API instead of fetchRelatedImagesByAccount"
  key_links:
    - from: "packages/web/app/images/ImagesClient.tsx"
      to: "/api/v1/posts"
      via: "useInfinitePosts hook"
      pattern: "useInfinitePosts"
    - from: "packages/web/lib/components/detail/ImageDetailPage.tsx"
      to: "supabase posts table"
      via: "usePostById hook"
      pattern: "usePostById"
---

<objective>
Replace all unconnected image-table-based sections with post-based data.

Purpose: The project has migrated from an `image` table (old schema: image, item, post, post_image) to a `posts` table (new schema: posts, spots, solutions). The `/images` route and its detail page still query the old `image` table via shared package queries (fetchImageById, fetchUnifiedImages, fetchRelatedImagesByAccount) which either error out or return incomplete data. These must be replaced with working post-based data fetching.

Output:
- `/images` page uses `useInfinitePosts` (REST API) instead of `useInfiniteFilteredImages` (old image table)
- `/images/[id]` detail page redirects to or renders as `/posts/[id]` using `usePostById`
- `RelatedImages` component fetches recent posts by same artist instead of using old `post_image` join table
- All grid cards link to `/posts/[id]` instead of `/images/[id]`
</objective>

<execution_context>
@/Users/kiyeol/.claude-pers/get-shit-done/workflows/execute-plan.md
@/Users/kiyeol/.claude-pers/get-shit-done/templates/summary.md
</execution_context>

<context>
Key existing patterns to follow:
- Explore page (`packages/web/app/explore/ExploreClient.tsx`) already uses `useInfinitePosts` from `lib/hooks/useImages.ts` (REST API) -- follow this pattern for Images page
- Post detail page (`packages/web/app/posts/[id]/page.tsx`) uses `usePostById` from `lib/hooks/usePosts.ts` -- follow this pattern for Image detail
- `PostDetailContent` component (`lib/components/detail/PostDetailContent.tsx`) renders post with spots/solutions -- reuse this for image detail

Files that define working post-based hooks (DO NOT MODIFY these):
- `packages/web/lib/hooks/usePosts.ts` -- usePostById, useInfinitePosts (REST API)
- `packages/web/lib/hooks/useImages.ts` -- useInfinitePosts (REST API, PostGridItem type)
- `packages/web/lib/api/posts.ts` -- fetchPosts (REST API client)
- `packages/web/lib/supabase/queries/posts.ts` -- fetchPostWithSpotsAndSolutions (Supabase client)

Old image-table queries to STOP using (in the files we modify):
- `useImageById` (queries `image` table)
- `useInfiniteFilteredImages` (queries `image` + `post_image` tables)
- `useRelatedImagesByAccount` (queries `post_image` + `image` tables)
- `fetchLatestImagesServer` (queries `posts` table but returns ImageRow format)

Types reference:
- `PostGridItem` (from useImages.ts): { id, imageUrl, postId, postSource, postAccount, postCreatedAt, spotCount, viewCount }
- `PostDetail` (from posts.ts): { post: PostRow, spots: SpotRow[], solutions: SolutionRow[] }
- `PostRow`: { id, user_id, image_url, media_type, media_title, media_metadata, group_name, artist_name, context, view_count, status, created_at, updated_at, trending_score }
</context>

<tasks>

<task type="auto">
  <name>Task 1: Replace /images grid page with post-based data fetching</name>
  <files>
    packages/web/app/images/page.tsx
    packages/web/app/images/ImagesClient.tsx
    packages/web/app/images/ImageCard.tsx
  </files>
  <action>
    **1. `app/images/page.tsx`** -- Replace server-side image fetch with posts fetch:
    - Remove import of `fetchLatestImagesServer` from `@/lib/supabase/queries/images.server`
    - Import `fetchPostsServer` from `@/lib/api/posts` (or use `fetchLatestPostsServer` from images.server.ts which already queries `posts` table)
    - Use `fetchLatestPostsServer(20)` which returns `PostRow[]` -- it already queries the `posts` table correctly
    - Pass `initialPosts` (PostRow[]) to ImagesClient instead of `initialImages` (ImageRow[])

    **2. `app/images/ImagesClient.tsx`** -- Replace infinite image scroll with post-based:
    - Replace `useInfiniteFilteredImages` import/usage with `useInfinitePosts` from `@/lib/hooks/useImages`
    - The `useInfinitePosts` hook returns `PostsPage` with `items: PostGridItem[]`
    - Change Props type from `{ initialImages: ImageRow[] }` to `{ initialPosts: PostRow[] }` (or remove initialData fallback -- CSR-only is fine since SSR already pre-renders)
    - Update the grid to render `PostGridItem` instead of `ImageRow`
    - Import `PostGridItem` type from `@/lib/hooks/useImages`
    - Update ImageCard usage to pass PostGridItem data
    - Keep the same grid layout (grid-cols-2 md:grid-cols-4 gap-4)
    - Keep the "Load More" infinite scroll button

    **3. `app/images/ImageCard.tsx`** -- Adapt card to show post data:
    - Change Props to accept `PostGridItem` (from `@/lib/hooks/useImages`) instead of `ImageRow`
    - Wrap card in a Link to `/posts/${item.postId}` (NOT `/images/${item.id}`)
    - Display: image thumbnail from `item.imageUrl`, account name `@${item.postAccount}`, relative time from `item.postCreatedAt`
    - Remove status badge (posts don't have pending/extracted status)
    - Remove `with_items` indicator
    - Add spot count badge if `item.spotCount > 0`
    - Keep the same card design (aspect-square, rounded-xl, shadow-md hover:shadow-lg)

    WHY linking to /posts/ instead of /images/: The old /images/[id] route queries the deprecated `image` table. Posts are the canonical entity now. Users clicking a card should go to the post detail which has full spot/solution data.
  </action>
  <verify>
    - `yarn --cwd packages/web build` succeeds without type errors
    - Navigate to `/images` in dev -- grid loads with post data from REST API
    - Click a card -- navigates to `/posts/[id]` (not `/images/[id]`)
    - "Load More" button fetches next page
  </verify>
  <done>
    /images page displays posts from REST API. Cards link to /posts/[id]. No references to old image table queries.
  </done>
</task>

<task type="auto">
  <name>Task 2: Replace /images/[id] detail with post detail redirect/render</name>
  <files>
    packages/web/app/images/[id]/page.tsx
    packages/web/lib/components/detail/ImageDetailPage.tsx
    packages/web/lib/components/detail/ImageDetailModal.tsx
  </files>
  <action>
    **Strategy:** Since `/images/[id]` now has no real purpose (the `image` table is deprecated), redirect to `/posts/[id]` or render PostDetailContent directly. Choose redirect for simplicity and to avoid maintaining two detail page implementations.

    **1. `app/images/[id]/page.tsx`** -- Redirect to posts route:
    - Import `redirect` from `next/navigation`
    - In the server component, call `redirect(`/posts/${id}`)` to permanently redirect
    - This ensures any old `/images/[id]` links (bookmarks, search engines) go to the working post detail page
    - Remove the `ImageDetailPage` import since it's no longer used here

    **2. `lib/components/detail/ImageDetailPage.tsx`** -- Update to use post data:
    - This component is still used by `ImageDetailModal` via the parallel route `@modal`
    - Replace `useImageById` with `usePostById` from `@/lib/hooks/usePosts`
    - Instead of rendering `ImageDetailContent` (which expects ImageDetail type from old schema), render `PostDetailContent` (which expects PostDetail type from new schema)
    - The post data from `usePostById` returns `PostDetail | null` with `{ post, spots, solutions }`
    - Remove Lightbox integration (PostDetailContent has its own image display)
    - Keep the loading skeleton and error state patterns
    - Keep the action buttons (like, save, share, close) and their GSAP animation
    - Update error message from "Failed to load image" to "Failed to load post"

    **3. `lib/components/detail/ImageDetailModal.tsx`** -- Update to use post data:
    - Replace `useImageById` with `usePostById` from `@/lib/hooks/usePosts`
    - Replace `ImageDetailContent` render with `PostDetailContent`
    - Remove `useNormalizedItems` and `ImageCanvas` imports (these depend on old ImageDetail type)
    - The left-side floating image can use `postDetail.post.image_url` instead of `image.image_url`
    - Remove `normalizeItem` import
    - Keep GSAP animation logic (FLIP, Ken Burns) but update image source references
    - Keep swipe gesture handlers
    - The "Maximize" button should navigate to `/posts/${imageId}` instead of `/images/${imageId}`

    WHY redirect in page.tsx: Users who arrive at /images/[id] (from old links) get seamlessly redirected to the working /posts/[id] page. The modal version (parallel route) still works for in-app navigation.
  </action>
  <verify>
    - `yarn --cwd packages/web build` succeeds without type errors
    - Navigate to `/images/[id]` directly -- redirects to `/posts/[id]`
    - Open modal from grid (parallel route) -- shows post detail content
    - "Maximize" button in modal navigates to `/posts/[id]`
    - Error and loading states display correctly
  </verify>
  <done>
    /images/[id] redirects to /posts/[id]. Modal version renders PostDetailContent with post data from usePostById. No references to old useImageById or ImageDetail type.
  </done>
</task>

<task type="auto">
  <name>Task 3: Replace RelatedImages with post-based related content</name>
  <files>
    packages/web/lib/components/detail/RelatedImages.tsx
    packages/web/lib/components/detail/PostDetailContent.tsx
  </files>
  <action>
    **1. `lib/components/detail/RelatedImages.tsx`** -- Replace image-table query with posts query:
    - Remove `useRelatedImagesByAccount` import from `@/lib/hooks/useImages`
    - Create a new query approach: use `useInfinitePosts` with `artistName` param from `@/lib/hooks/usePosts`, OR add a simpler `useRelatedPosts` query
    - Simplest approach: use the existing `useInfinitePosts` from `@/lib/hooks/usePosts` with `{ perPage: 12, artistName: account }` and take only the first page
    - Update the Props type: keep `currentImageId` (rename to `currentPostId`), keep `account` (this is the artist name), keep `isModal`
    - Update the grid to render post data: `post.image_url` for image, link to `/posts/${post.id}` (not `/images/${image.id}`)
    - Keep the GSAP stagger animation
    - Keep the "View All / Show Less" expand/collapse behavior
    - Keep the loading skeleton and empty state

    Data mapping in the grid:
    - Old: `images.map(image => ...)` with `image.id`, `image.image_url`
    - New: `posts.map(post => ...)` with `post.id` (which equals postId), `post.image_url` from PostGridItem `item.imageUrl`
    - Filter out the current post from results: `items.filter(item => item.postId !== currentPostId)`

    **2. `lib/components/detail/PostDetailContent.tsx`** -- Update RelatedImages usage:
    - The component currently calls `useRelatedImagesByAccount(post.id, displayName)` and passes results to `GallerySection` and `RelatedLooksSection`
    - Replace `useRelatedImagesByAccount` with the same approach as above: use `useInfinitePosts` with `{ perPage: 12, artistName: displayName }` from `@/lib/hooks/usePosts`
    - Filter out current post from results
    - Map the first 5 results to `GallerySection` format: `{ id: item.id, image_url: item.imageUrl }`
    - Map remaining results to `RelatedLooksSection` format: `{ id: item.id, image_url: item.imageUrl }`
    - Update `GallerySection` and `RelatedLooksSection` links: already link to `/images/[id]`, change these to `/posts/[id]` -- BUT these components are generic and receive data as props, the links are generated from the `id` field. So just ensure the `id` we pass maps correctly to post IDs.
    - Actually, check GallerySection and RelatedLooksSection: they link to `/images/${image.id}`. Since we're passing post IDs as the `id`, the links will be `/images/${postId}` which will redirect to `/posts/${postId}` (from Task 2). This is acceptable. BUT for cleanliness, update the `href` in GallerySection and RelatedLooksSection from `/images/${image.id}` to `/posts/${image.id}`. This requires also modifying those two files.

    ALSO update these two files for correct linking:
    - `lib/components/detail/GallerySection.tsx` -- Change `href={`/images/${image.id}`}` to `href={`/posts/${image.id}`}`
    - `lib/components/detail/RelatedLooksSection.tsx` -- Change `href={`/images/${image.id}`}` to `href={`/posts/${image.id}`}`
  </action>
  <verify>
    - `yarn --cwd packages/web build` succeeds without type errors
    - Navigate to `/posts/[id]` -- "More from this look" section shows related posts by the same artist
    - Related post cards link to `/posts/[id]` (not `/images/[id]`)
    - Gallery and RelatedLooks sections link to `/posts/[id]`
    - Loading and empty states work correctly
    - Expand/collapse "View All" / "Show Less" works
  </verify>
  <done>
    RelatedImages uses posts API instead of old image-table queries. PostDetailContent fetches related posts by artist name. All related content links go to /posts/[id]. No references to useRelatedImagesByAccount or old post_image join queries.
  </done>
</task>

</tasks>

<verification>
After all three tasks:
1. `yarn --cwd packages/web build` -- passes with no type errors (critical: old ImageRow/ImageDetail types should no longer be referenced in modified files)
2. `/images` route -- shows post grid from REST API, cards link to `/posts/[id]`
3. `/images/[id]` direct navigation -- redirects to `/posts/[id]`
4. `/posts/[id]` -- related sections show posts from same artist, all links go to `/posts/[id]`
5. No console errors about missing `image` table queries or RLS policy violations
6. Modal navigation (parallel route) still works for in-app transitions
</verification>

<success_criteria>
- Zero references to `useImageById`, `useInfiniteFilteredImages`, or `useRelatedImagesByAccount` in modified files
- /images page loads post data via REST API (useInfinitePosts)
- /images/[id] redirects to /posts/[id]
- All image grid cards and related content cards link to /posts/[id]
- RelatedImages component fetches data from posts API by artist name
- Build succeeds with no type errors
</success_criteria>

<output>
After completion, create `.planning/quick/025-replace-unconnected-image-sections-with-post/025-SUMMARY.md`
</output>
