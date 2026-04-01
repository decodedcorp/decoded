# Architecture Research

**Domain:** Explore & Editorial Data Integration — detail page connection, spot/solution display
**Researched:** 2026-04-01
**Confidence:** HIGH (all findings from direct codebase inspection + OpenAPI spec analysis)

## Current Architecture Overview

```
┌──────────────────────────────────────────────────────────────────────────┐
│                          Next.js App Router (packages/web)               │
├─────────────────────────────┬───────────────────────────────────────────┤
│  /explore  (page.tsx)       │  /editorial  (page.tsx)                   │
│  @modal parallel route      │  = <ExploreClient hasMagazine />          │
├─────────────────────────────┴───────────────────────────────────────────┤
│                   ExploreClient.tsx  (shared grid engine)                │
│   props: hasMagazine?: boolean                                           │
│   ┌──────────────────────────────────────────────────────────────────┐   │
│   │  useInfinitePosts({ category, hasMagazine })                     │   │
│   │   ↓ Supabase direct (hasMagazine filter NOT applied — bug)      │   │
│   │  ThiingsGrid (virtual infinite scroll, FLIP-aware)              │   │
│   │  ExploreCardCell (Link → /posts/[id], captures FLIP state)      │   │
│   └──────────────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────────────┤
│  filterStore (category)   searchStore (query)   transitionStore (FLIP)  │
├─────────────────────────────────────────────────────────────────────────┤
│     @modal/(.)posts/[id]  (App Router intercepting route)               │
│     ↓ ImageDetailModal (side drawer, GSAP mount/close/swipe animation)  │
│       ├── usePostDetailForImage  → Supabase: posts + spots + solutions  │
│       ├── usePostMagazine        → REST: /api/v1/post-magazines/:id     │
│       ├── ImageDetailPreview (tags, summary, CTA)                       │
│       └── SpotDot overlays (positioned by spot.center fractions)        │
├─────────────────────────────────────────────────────────────────────────┤
│     /posts/[id]  (full page — direct URL access or Maximize button)     │
│     ↓ ImageDetailPage → ImageDetailContent (full editorial layout)       │
│       └── usePostDetailForImage (same hook as modal)                    │
└─────────────────────────────────────────────────────────────────────────┘

Data Sources:
  Supabase direct ← useInfinitePosts  (grid list — bypasses REST API)
  Supabase direct ← usePostDetailForImage  (post + spots + solutions detail)
  REST API        ← usePostMagazine  (/api/v1/post-magazines/:id)
  Orval-generated ← listPosts, getPost  (exist but unused by grid/detail flows)
```

## Critical Findings from Codebase Inspection

### Finding 1: `hasMagazine` Filter Is Silently Ignored

`useInfinitePosts` in `packages/web/lib/hooks/useImages.ts` accepts `hasMagazine?: boolean` but the Supabase query body contains an explicit comment: "Note: hasMagazine filter not yet supported via Supabase query" (line 204). The filter parameter is accepted, stored in the React Query key, but never applied to the actual query. Editorial page (`/editorial/page.tsx`) passes `hasMagazine` but receives all posts — no editorial filtering.

**Fix:** The Supabase `posts` table already stores `post_magazine_title`. The query in `useInfinitePosts` already reads `post.post_magazine_title` (line 237). Adding `.not("post_magazine_title", "is", null)` when `hasMagazine === true` is a one-line fix that requires no backend changes.

### Finding 2: REST API Has No `has_magazine` Filter Param

Inspecting `packages/api-server/openapi.json`, the `GET /api/v1/posts` endpoint has these parameters: `artist_name`, `group_name`, `context`, `category`, `user_id`, `sort`, `page`, `per_page`. There is no `has_magazine` or `has_solutions` parameter. The `PostsListParams` type in `mutation-types.ts` (used only by `fetchPostsServer` for server components) includes `has_magazine?: boolean` and `has_solutions?: boolean`, but these are not backed by the actual backend endpoint.

**Implication:** Any migration from Supabase direct to REST API for the editorial filter requires a backend change first. This is a future milestone concern, not a v11.0 blocker.

### Finding 3: `spot_count` Always Returns 0 in Grid

`useInfinitePosts` maps each post to `PostGridItem` with `spotCount: 0` hardcoded (line 228 in `useImages.ts`). The Supabase query selects `*` from the `posts` table but does NOT join `spots`. The REST API `PaginatedResponse_PostListItem` schema includes `spot_count` as a proper computed field. To show real spot counts on grid cards, the list query must either join the `spots` table or migrate to the REST API.

### Finding 4: Maximize Navigation Uses Hard Browser Reload

`useImageModalAnimation.handleMaximize` (line 278-281 in `useImageModalAnimation.ts`) calls `window.location.href = /posts/${imageId}`. This is a full browser reload — clears React Query cache, does not animate the modal out, and double-pushes browser history. `router` is already available as a parameter to the hook.

### Finding 5: Detail Data Flow Is Already Wired Correctly

`ImageDetailModal` correctly fetches `post_magazine_id` from `usePostDetailForImage`, then fetches the full magazine via `usePostMagazine`. `ImageDetailPreview` receives `magazineTitle`, `artistTags` (artist_name, group_name), `brands`, `styleTags` as props — all extracted from the magazine `layout_json`. `SpotDot` overlays are already positioned using `item.center` fractions. The detail view works end-to-end once real posts with `post_magazine_id` exist in the database.

---

## Component Responsibilities

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| `ExploreClient.tsx` | Grid orchestrator — filter state, pagination, layout | `useInfinitePosts`, `ThiingsGrid`, `filterStore`, `searchStore` |
| `ExploreCardCell.tsx` | Individual card — image, editorial title overlay, FLIP capture, navigation | `transitionStore` (write), `Link` (navigate) |
| `ThiingsGrid.tsx` | Virtual infinite scroll canvas with FLIP-aware rendering | `ExploreCardCell` via `renderItem` prop |
| `@modal/(.)posts/[id]/page.tsx` | Intercepting route shell | `ImageDetailModal` |
| `ImageDetailModal.tsx` | Side drawer container — GSAP animation, gesture close, maximize | `usePostDetailForImage`, `usePostMagazine`, `transitionStore` (read), `useImageModalAnimation` |
| `ImageDetailPreview.tsx` | Drawer content — tags, AI summary, CTA button | Props only (no direct hooks) |
| `SpotDot.tsx` | Dot overlay with label on floating image | Props only |
| `ImageDetailPage.tsx` | Full-page container — fade-in, share, lightbox | `usePostDetailForImage`, `usePostMagazine`, `ImageDetailContent` |
| `useInfinitePosts` | Data fetching for grid list | Supabase direct (needs `hasMagazine` fix + `spotCount` fix) |
| `usePostDetailForImage` | Data fetching for detail page | Supabase direct: posts + spots + solutions |
| `usePostMagazine` | Magazine metadata fetching | REST API: `/api/v1/post-magazines/:id` |
| `transitionStore` | GSAP FLIP state bridge between grid and modal | Written by `ExploreCardCell`, read by `useImageModalAnimation` |
| `filterStore` | Active category filter | Written by filter UI, read by `ExploreClient` |

---

## Data Flow

### Grid List Flow (Current — `hasMagazine` fix needed)

```
filterStore.activeFilter + hasMagazine flag
    ↓
ExploreClient → useInfinitePosts({ category, hasMagazine, limit })
    ↓
Supabase: posts table
  WHERE status = 'active'
  AND image_url IS NOT NULL
  AND context = category (if not 'all')
  [MISSING: AND post_magazine_title IS NOT NULL (when hasMagazine=true)]
    ↓
PostGridItem[] → GridItem[] (spotCount: 0 hardcoded)
    ↓
ThiingsGrid renders ExploreCardCell per item
  - image (Next/Image)
  - editorialTitle overlay (when hasMagazine && item.editorialTitle)
  - [MISSING: spot count badge]
    ↓ user clicks
transitionStore.setTransition(id, flipState, rect, imgSrc)
    ↓
Link navigates to /posts/{id} with scroll:false
```

### Detail Modal Flow (Current — `handleMaximize` fix needed)

```
App Router intercepts /posts/{id} → @modal/(.)posts/[id]
    ↓
ImageDetailModal mounts
    → useImageModalAnimation: GSAP context created, drawer slides in
    → transitionStore.originRect: floating image animates from card position
    ↓
usePostDetailForImage(id)
    → Supabase: posts + spots + solutions → ImageDetail (with items[])
    ↓
magazineId = image.post_magazine_id (from ImageDetailWithPostOwner adapter)
    → usePostMagazine(magazineId) → REST: /api/v1/post-magazines/:id
    ↓
ImageDetailPreview receives:
    magazineTitle  = magazine.layout_json.title
    artistTags     = [artist_name, group_name] (deduped, from ImageDetailWithPostOwner)
    brands         = magazine.layout_json.items[].brand (deduped)
    styleTags      = magazine.layout_json.design_spec.style_tags
    ↓
SpotDot overlays on floating image (desktop):
    positioned via item.center [fracX, fracY] × imageRect dimensions
    ↓ user clicks Maximize2
window.location.href = /posts/{id}   ← FULL RELOAD (needs fix)
```

### Target Flow for v11.0

```
Editorial filter (hasMagazine=true):
  Supabase query adds: .not("post_magazine_title", "is", null)
  → shows only posts with magazine content

Grid cards:
  spotCount: real value (either from Supabase spots JOIN or REST API migration)
  → ExploreCardCell renders spot count badge when spotCount > 0

Modal maximize:
  Animate modal out (GSAP: backdrop + drawer opacity 0)
  → router.push(/posts/{id})   ← soft navigation, preserves history
```

---

## Recommended Project Structure Changes

```
packages/web/
├── lib/
│   ├── hooks/
│   │   └── useImages.ts           # MODIFY (2 changes):
│   │                              #   1. Add hasMagazine Supabase filter
│   │                              #   2. Add spotCount from spots JOIN or REST
│   │
│   ├── components/
│   │   ├── explore/
│   │   │   └── ExploreCardCell.tsx  # MODIFY: add spot count badge UI
│   │   │
│   │   └── detail/
│   │       └── ImageDetailModal.tsx # no change (data flow already correct)
│   │
│   └── ThiingsGrid.tsx             # MAYBE MODIFY: add spotCount to GridItem type
│
└── lib/hooks/
    └── useImageModalAnimation.ts   # MODIFY: handleMaximize → router.push
```

No new routes, no new stores, no new hooks. All changes are modifications to existing files.

---

## Architectural Patterns

### Pattern 1: Fix `hasMagazine` Filter in Supabase Query

**What:** Add `.not("post_magazine_title", "is", null)` to the Supabase query in `useInfinitePosts` when `hasMagazine === true`.

**When to use:** Required for Editorial page to show only magazine-linked posts.

**Trade-offs:** Keeps Supabase direct (not ideal long-term vs REST API), but zero backend changes and immediately unblocks editorial data validation.

```typescript
// useImages.ts — inside useInfinitePosts queryFn, after existing filters:
if (hasMagazine) {
  query = query.not("post_magazine_title", "is", null);
}
```

### Pattern 2: Spot Count via Supabase Aggregate (short-term)

**What:** In `useInfinitePosts`, after the main posts query, do a single batch query for spot counts across all returned post IDs. Map counts back to PostGridItem.

**When to use:** When REST API migration is not yet done but real spot counts are needed.

**Trade-offs:** Two Supabase queries per page instead of one. Acceptable for grid loads with 40 items per page. Not needed if migrating to REST API which already returns `spot_count`.

```typescript
// After main posts query, inside queryFn:
const postIds = (data ?? []).map((p: any) => p.id);
const { data: spotCounts } = await supabaseBrowserClient
  .from("spots")
  .select("post_id")
  .in("post_id", postIds);

const countMap: Record<string, number> = {};
(spotCounts ?? []).forEach((s: any) => {
  countMap[s.post_id] = (countMap[s.post_id] ?? 0) + 1;
});

// Then in the items mapping:
spotCount: countMap[post.id] ?? 0,
```

### Pattern 3: Animated Soft Navigation for Maximize

**What:** In `handleMaximize`, animate modal out via GSAP then call `router.push()` instead of hard-reloading via `window.location.href`.

**When to use:** Immediately. The `router` instance is already passed into the hook.

**Trade-offs:** Adds a short animation delay (200ms) before navigation. Preserves browser history, React Query cache, and provides a smooth transition.

```typescript
// useImageModalAnimation.ts — replace handleMaximize:
const handleMaximize = useCallback(() => {
  if (isClosing || !ctxRef.current) return;
  setIsClosing(true);

  ctxRef.current.add(() => {
    gsap.to(
      [backdropRef.current, drawerRef.current],
      {
        opacity: 0,
        duration: 0.2,
        ease: "power2.in",
        onComplete: () => {
          reset();
          router.push(`/posts/${imageId}`);
        },
      }
    );
  });
}, [imageId, isClosing, router, reset]); // eslint-disable-line react-hooks/exhaustive-deps
```

---

## Recommended Build Order

Build in this sequence because each step validates the previous:

### Step 1: Data Validation Gate (no code change)

**Goal:** Confirm editorial posts exist in production/dev Supabase with non-null `post_magazine_title`.

Run in Supabase dashboard or via browser console:
```sql
SELECT id, post_magazine_title, artist_name
FROM posts
WHERE post_magazine_title IS NOT NULL
  AND status = 'active'
LIMIT 20;
```

If zero rows: the editorial automation (#38) has not yet produced posts. Steps 2-4 can still be built but cannot be visually validated. Document this as a pending dependency.

If rows exist: proceed with confidence.

**Dependency:** None. This is a prerequisite check.

### Step 2: Fix `hasMagazine` Filter (`useImages.ts`)

**File:** `packages/web/lib/hooks/useImages.ts`

**Change:** Add `hasMagazine` Supabase filter (one line). Confirm React Query key already includes `hasMagazine` (it does — line 183 of `useImages.ts` includes `hasMagazine` in the queryKey object). No cache invalidation issues.

**Validate:** Navigate to `/editorial`. With the fix applied and data existing, the grid should show only posts with magazine titles. Without the fix, both `/explore` and `/editorial` show identical results.

**Dependency:** Step 1 (need data to validate).

### Step 3: Fix Maximize Navigation (`useImageModalAnimation.ts`)

**File:** `packages/web/lib/hooks/useImageModalAnimation.ts`

**Change:** Replace `window.location.href` with animated `router.push` in `handleMaximize`. The `router` and `reset` are already in scope. Use the GSAP pattern from `handleClose` as the model.

**Validate:** Open any post in the modal drawer. Click Maximize2. Should animate out smoothly and navigate to full post page. Browser back button should return to explore grid (not a dead state).

**Dependency:** None. Independent fix.

### Step 4: Add Spot Count Display to Grid Cards

**Files (in order):**
1. `packages/web/lib/components/ThiingsGrid.tsx` — add `spotCount?: number` to `GridItem` type
2. `packages/web/lib/hooks/useImages.ts` — add spot count batch query inside `useInfinitePosts` queryFn, map to `PostGridItem.spotCount`
3. `packages/web/app/explore/ExploreClient.tsx` — pass `spotCount: item.spotCount` in the `gridItems` mapping
4. `packages/web/lib/components/explore/ExploreCardCell.tsx` — render spot count badge (e.g., `"3 spots"` pill in bottom-left, only when `spotCount > 0`)

**Validate:** Open Explore grid. Posts with spots should show a count badge. Posts without spots should not show a badge. Verify no visible performance regression (batch query runs once per page, not per card).

**Dependency:** Step 2 (verify editorial filter before adding badge to editorial cards).

---

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Supabase | Browser client (`supabaseBrowserClient`) | `posts`, `spots`, `solutions` tables. `useInfinitePosts` and `usePostDetailForImage` use this directly |
| Rust/Axum REST API | Next.js proxy route + Orval hooks | `usePostMagazine` uses REST. Grid list currently bypasses REST |
| Cloudflare R2 | Direct image URLs | `image_url` served via CDN — no proxy needed |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| `ExploreClient` ↔ `ThiingsGrid` | Props: `items: GridItem[]`, `renderItem`, `onReachEnd`, `hasMore` | `GridItem` is the data contract — `spotCount` field is the only addition needed |
| `ExploreCardCell` ↔ `transitionStore` | Zustand write: `setTransition(id, flipState, rect, imgSrc)` | Must execute before `Link` navigation for FLIP to work — order is correct (onClick fires before navigation) |
| `ImageDetailModal` ↔ `transitionStore` | Zustand read: `originRect`, `imgSrc`; write: `reset()` | Read on mount drives GSAP entry animation; reset() must be called before navigating away |
| `useInfinitePosts` ↔ `filterStore` | `filterStore.activeFilter` passed as `category` | React Query queryKey includes filter — cache auto-invalidates on category change |
| `@modal` route ↔ main layout | Next.js App Router parallel routes | `@modal/default.tsx` renders null when no modal active; App Router handles the interception |

---

## Anti-Patterns

### Anti-Pattern 1: Fetching Spot Count Per Card Inside `ExploreCardCell`

**What people do:** Add a `useQuery` call inside `ExploreCardCell` to fetch spot count for that specific post.

**Why it's wrong:** Triggers N+1 queries — one Supabase call per visible card. With 40 cards per page, this fires 40 concurrent queries on every grid render.

**Do this instead:** Batch fetch all spot counts for the current page's post IDs in a single query inside `useInfinitePosts`. Pass `spotCount` as data flowing through `PostGridItem → GridItem → ExploreCardCell`.

### Anti-Pattern 2: Using `window.location.href` for Client-Side Navigation

**What people do:** Call `window.location.href = /posts/${id}` for the modal maximize action.

**Why it's wrong:** Causes full browser reload — clears React Query cache, skips GSAP cleanup animation, corrupts browser history stack (creates two entries), and breaks the back button.

**Do this instead:** Animate the modal out first via GSAP, then call `router.push()`. The GSAP context `ctxRef.current?.revert()` runs on component unmount regardless, so cleanup is safe.

### Anti-Pattern 3: Creating a Separate EditorialClient Component

**What people do:** Copy-paste `ExploreClient.tsx` into an `EditorialClient.tsx` with the `hasMagazine` filter hardcoded.

**Why it's wrong:** Two components diverge immediately. Filter bar, skeleton states, error states, pagination logic all need to be maintained twice.

**Do this instead:** Keep `ExploreClient` as the single grid engine. The `hasMagazine` prop pattern is already the correct architecture — `editorial/page.tsx` is 4 lines: `return <ExploreClient hasMagazine />`. Any editorial-specific behavior is a branch inside the shared component.

### Anti-Pattern 4: Filtering Editorial Posts Client-Side After Full Fetch

**What people do:** Fetch all posts and then `.filter(p => p.editorialTitle)` in the component.

**Why it's wrong:** Downloads all posts to the browser before filtering. With pagination, page 1 might return 40 posts with zero editorial content, causing an empty grid despite editorial posts existing later in the dataset.

**Do this instead:** Apply the `post_magazine_title IS NOT NULL` filter at the Supabase query level so only relevant posts are fetched, paginated correctly.

---

## Scalability Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| Current (< 10k posts) | Supabase direct queries are fine. `hasMagazine` filter fix unblocks editorial immediately |
| 10k-100k posts | Migrate `useInfinitePosts` to REST API (`GET /api/v1/posts`). Add `has_magazine` backend param. REST API enables CDN caching of list responses |
| 100k+ posts | Backend needs database index on `post_magazine_title IS NOT NULL`. Cursor-based pagination (current Supabase approach) scales better than page-based at high offsets |

### Scaling Priorities

1. **First bottleneck:** Supabase direct queries from browser at high concurrency — fix: migrate list query to REST API with server-side caching (`next: { revalidate: 60 }` already used by `fetchPostsServer`)
2. **Second bottleneck:** Spot count batch query adds a second DB round-trip per page load — fix: include spot_count as computed column in REST API response (already done: `PaginatedResponse_PostListItem.spot_count` exists)

---

## Sources

- `packages/web/app/explore/ExploreClient.tsx` — shared grid engine, `hasMagazine` prop wiring
- `packages/web/app/editorial/page.tsx` — editorial page (4-line wrapper)
- `packages/web/lib/hooks/useImages.ts` — `useInfinitePosts` (Supabase direct), `usePostDetailForImage`, `usePostMagazine`
- `packages/web/lib/components/explore/ExploreCardCell.tsx` — FLIP capture, `editorialTitle` overlay, navigation link
- `packages/web/lib/components/detail/ImageDetailModal.tsx` — side drawer, `usePostMagazine` consumer, `SpotDot` positioning
- `packages/web/lib/components/detail/ImageDetailPreview.tsx` — drawer content: tags, AI summary, CTA
- `packages/web/lib/hooks/useImageModalAnimation.ts` — GSAP context, `handleMaximize` (hard reload issue)
- `packages/web/lib/stores/transitionStore.ts` — FLIP state bridge
- `packages/web/app/@modal/(.)posts/[id]/page.tsx` — intercepting route
- `packages/web/app/posts/[id]/page.tsx` — full page route
- `packages/api-server/openapi.json` — confirmed: no `has_magazine` param in `GET /api/v1/posts`; `PaginatedResponse_PostListItem` includes `spot_count` and `post_magazine_title`; `PostDetailResponse` includes `post_magazine_id`, `ai_summary`, `spots[]`

---
*Architecture research for: v11.0 Explore & Editorial Data Integration*
*Researched: 2026-04-01*
