# Stack Research: v11.0 Explore & Editorial Data Integration

**Domain:** Incremental data integration — connecting Explore/Editorial UI to REST API with detail page flow
**Researched:** 2026-04-01
**Confidence:** HIGH (all findings from live codebase + OpenAPI spec + Rust source)

---

## Summary

v11.0 requires NO new library installations. The entire milestone is achievable using the existing stack. The work is a data-layer fix: migrating `useInfinitePosts` from a direct Supabase query to the generated REST API client, exposing `has_magazine` as a proper filter parameter in the OpenAPI spec, and wiring the Explore card → side drawer → full page detail flow end-to-end. All integration points are already in place.

---

## What Is Already in Place (Do NOT Re-Introduce)

Every technology listed here is installed and working. These are integration points, not additions.

### Data Fetching

| Layer | Technology | Version | Relevant to v11.0 |
|-------|------------|---------|-------------------|
| Server state | TanStack React Query | 5.90.11 | `useInfinitePosts` uses `useInfiniteQuery` — continue this pattern |
| Generated hooks | Orval 8.5.3 | — | `listPosts()` in `lib/api/generated/posts/posts.ts` — the correct fetch function to switch to |
| HTTP proxy | Next.js API route | — | `GET /api/v1/posts` proxy at `app/api/v1/posts/route.ts` already forwards all query params verbatim |
| Magazine fetch | `fetchPostMagazine()` | — | `lib/api/posts.ts` — fetches `post-magazines/{id}` — already implemented and working |
| React Query hook | `usePostMagazine()` | — | `lib/hooks/useImages.ts` — already wired in `ImageDetailModal` |
| Detail adapter | `postDetailToImageDetail()` | — | `lib/api/adapters/postDetailToImageDetail.ts` — maps `PostDetailResponse` → `ImageDetail` |

### Detail Page Connection (Explore → Modal → Full Page)

| Pattern | File | Status |
|---------|------|--------|
| Intercepting route (modal) | `app/@modal/(.)posts/[id]/page.tsx` | Working — renders `ImageDetailModal` when navigating from grid |
| Side drawer component | `lib/components/detail/ImageDetailModal.tsx` | Working — GSAP FLIP animation + touch swipe dismiss |
| Full page route | `app/posts/[id]/page.tsx` | Working — renders `ImageDetailPage` |
| FLIP transition store | `lib/stores/transitionStore.ts` | Working — `setTransition()` captures origin rect before navigation |
| Card-to-detail link | `lib/components/explore/ExploreCardCell.tsx` | Working — `href=/posts/${imageId}` with `scroll={false}` |
| Maximize to full page | `ImageDetailModal` → `handleMaximize()` | Working — `router.replace(`/posts/${imageId}`)` |

### Editorial Data Types

All types needed for v11.0 are already defined:

| Type/Interface | File | Notes |
|----------------|------|-------|
| `PostMagazineResponse` | `lib/api/mutation-types.ts` | Complete — `id`, `layout_json`, `status`, `related_editorials` |
| `PostMagazineLayout` | `lib/api/mutation-types.ts` | Complete — `editorial`, `celeb_list`, `items`, `related_items`, `design_spec` |
| `post_magazine_title` | Generated `PostListItem` model | Already returned in `GET /api/v1/posts` list response |
| `post_magazine_id` | Generated `PostDetailResponse` model | Already returned in `GET /api/v1/posts/{id}` detail response |
| `ImageDetailWithPostOwner` | `lib/api/adapters/postDetailToImageDetail.ts` | Includes `post_magazine_id` field — wired to `usePostMagazine()` in modal |

---

## The One Gap to Fix: `has_magazine` Filter Not in OpenAPI Spec

### Problem

**Backend service DOES implement the filter** (`packages/api-server/src/domains/posts/service.rs`, line 562-563):
```rust
// has_magazine 필터: true = post_magazine_id가 있는 post만 (editorial 탭용)
if query.has_magazine == Some(true) {
```

**Backend DTO DOES have the field** (`packages/api-server/src/domains/posts/dto.rs`, line 178-180):
```rust
/// 매거진(editorial) 보유 여부. true = post_magazine_id가 있는 post만
pub has_magazine: Option<bool>,
```

**But the OpenAPI spec does NOT expose it** (`packages/api-server/openapi.json` — `GET /api/v1/posts` parameters):

Confirmed parameters in spec: `artist_name`, `group_name`, `context`, `category`, `user_id`, `sort`, `page`, `per_page`. `has_magazine` is absent.

**Consequence chain:**
1. Generated `ListPostsParams` (`lib/api/generated/models/listPostsParams.ts`) lacks `has_magazine`
2. `useInfinitePosts` cannot use `listPosts()` for editorial filtering
3. `useInfinitePosts` falls back to direct Supabase query with comment: `// Note: hasMagazine filter not yet supported via Supabase query`
4. Editorial page (`/editorial`) calls `ExploreClient hasMagazine` but filtering is silently ignored

### Fix: Update OpenAPI Spec + Regenerate (RECOMMENDED)

**Step 1** — Add `has_magazine` parameter to `openapi.json` under `GET /api/v1/posts`:
```json
{
  "name": "has_magazine",
  "in": "query",
  "description": "매거진(editorial) 보유 여부. true = post_magazine_id가 있는 post만",
  "required": false,
  "schema": {
    "type": "boolean"
  }
}
```

**Step 2** — Regenerate types:
```bash
cd packages/web && bun run generate:api
```

**Step 3** — `ListPostsParams` automatically gets `has_magazine?: boolean`

**Step 4** — Migrate `useInfinitePosts` to call `listPosts({ has_magazine: hasMagazine || undefined, ... })`

Do NOT use the alternative of manually casting `has_magazine` as an untyped query param — that creates type debt and diverges from the Orval pipeline that is the established SSOT for API types in this project.

---

## Migration: `useInfinitePosts` Supabase Direct → REST API

### Current state (problem)

`useInfinitePosts` in `lib/hooks/useImages.ts` queries Supabase directly, bypassing the REST API:
```typescript
let query = supabaseBrowserClient
  .from("posts")
  .select("*", { count: "exact" })
  .eq("status", "active")
  .not("image_url", "is", null);
// Note: hasMagazine filter not yet supported via Supabase query
```

This violates the v9.0 migration principle and means editorial filtering silently does nothing.

### Target state

Switch to the generated `listPosts()` function (via BFF proxy → Rust/Axum):
```typescript
const response = await listPosts({
  context: category !== "all" ? category : undefined,
  sort,
  page,
  per_page: limit,
  has_magazine: hasMagazine ? true : undefined,
});
```

### Data shape mapping (Supabase row → REST API `PostListItem`)

| `PostGridItem` field | Supabase direct | REST `PostListItem` |
|----------------------|-----------------|---------------------|
| `id` | `post.id` | `item.id` |
| `imageUrl` | `post.image_url` | `item.image_url` |
| `postAccount` | `post.artist_name ?? post.group_name ?? ""` | `item.artist_name` (separate field) |
| `title` (editorial) | `post.post_magazine_title ?? post.title` | `item.post_magazine_title ?? item.title` |
| `spotCount` | hardcoded `0` | `item.spot_count` (real count from DB) |
| `viewCount` | `post.view_count` | `item.view_count` |
| Pagination cursor | Supabase `range()` offset | `pagination.total_pages` + page number |

The REST API response is strictly better: `spot_count` is real, pagination is standardized, and `has_magazine` filtering works server-side.

---

## Spot/Solution Data in Cards

### What v11.0 requires

Show `spot_count` and/or solution info on Explore/Editorial cards.

### Recommendation

**Use `spot_count` from the list response for grid overlay.** Do NOT fetch full detail per card — that triggers N+1 requests for a grid of 40 items.

- `PostListItem.spot_count` (integer) is already returned in list response
- `PostGridItem` type already has `spotCount` field (mapped from REST API in `useInfinitePosts`)
- `ExploreCardCell` can render a spot count badge without any additional data fetching
- Full spot/solution detail (brand, category, thumbnail) is available when the user opens the side drawer

---

## Supporting Libraries: Existing Patterns to Leverage

All patterns are established. No new patterns needed.

### Animation (detail page connection)
- **GSAP Flip** — already used in `ExploreCardCell.tsx` for card-to-modal FLIP animation. Register pattern: `Flip.getState(target)` → `setTransition()` → modal replays from origin
- **Motion `AnimatePresence`** — already used in `ExploreClient.tsx` for filter transition
- **No new animation libraries needed**

### State management
- **`transitionStore`** — already captures FLIP origin rect + image source in `ExploreCardCell.onClick`
- **TanStack Query** — `staleTime: 1 min`, `gcTime: 5 min` already configured in `useInfinitePosts`
- **`filterStore`** — `activeFilter` already wired to `ExploreClient` and `useInfinitePosts`
- **No new stores needed**

### UI components (existing, already imported)
- `Card`, `LoadingSpinner`, `SkeletonCard` from design system — used in `ExploreClient`
- `SpotDot` — already implemented in `ImageDetailModal` for spot overlays on floating image
- `ImageDetailPreview` — already implemented as the side drawer content
- `MagazineEditorialSection`, `MagazineCelebSection`, etc. — already used in `ImageDetailContent`

---

## Generated API: Files to Touch vs. Files to Leave Alone

### NEVER manually edit

| File | Why |
|------|-----|
| `lib/api/generated/**` | Auto-generated by Orval — edit `openapi.json`, then run `bun run generate:api` |
| `lib/api/generated/zod/decodedApi.zod.ts` | Auto-generated Zod schemas |

### Edit as part of v11.0

| File | Change |
|------|--------|
| `packages/api-server/openapi.json` | Add `has_magazine` boolean query param to `GET /api/v1/posts` |
| `lib/hooks/useImages.ts` — `useInfinitePosts` | Migrate from Supabase direct to `listPosts()` generated function |
| `lib/components/explore/ExploreCardCell.tsx` | Add spot count badge overlay (optional, design-dependent) |

### Already correct, no changes needed

| File | Status |
|------|--------|
| `lib/api/mutation-types.ts` — `PostsListParams` | `has_magazine?: boolean` already defined |
| `lib/api/posts.ts` — `buildPostsQueryString` | Already handles `has_magazine` param |
| `app/api/v1/posts/route.ts` | Already forwards all query params to backend |
| `app/@modal/(.)posts/[id]/page.tsx` | Intercepting route already works for `/posts/[id]` |
| `lib/components/detail/ImageDetailModal.tsx` | Side drawer + FLIP + magazine data already wired |
| `lib/api/adapters/postDetailToImageDetail.ts` | Maps `post_magazine_id` correctly |

---

## What NOT to Add

| Do Not Add | Why | What to Use Instead |
|------------|-----|---------------------|
| SWR | React Query 5 handles all caching needs | `@tanstack/react-query` 5.90.11 |
| Apollo / GraphQL | Backend is REST + Supabase, no GraphQL layer | Orval-generated hooks + `customInstance` |
| React-window / react-virtual | `ThiingsGrid` already handles viewport-based rendering | `ThiingsGrid` (existing) |
| New Zustand `editorialStore` | No new state shape needed — filter is a query param, magazine data cached by React Query | Existing `filterStore` + React Query |
| Direct Supabase queries for new editorial data | Violates v9.0 migration pattern | `listPosts()` generated hook via BFF proxy |
| New proxy routes for editorial | `app/api/v1/posts/route.ts` already proxies all query params including `has_magazine` | Existing proxy |
| Manually casting `has_magazine` as untyped param | Creates type debt, diverges from Orval SSOT | Update `openapi.json` + regenerate |

---

## Version Compatibility

No upgrades or changes needed. All packages are compatible.

| Package | Current Version | Notes |
|---------|----------------|-------|
| @tanstack/react-query | 5.90.11 | `useInfiniteQuery` v5 API in use — `initialPageParam`, typed `InfiniteData<T>` |
| Orval | 8.5.3 | Config at `packages/web/orval.config.ts` — no config changes needed |
| @supabase/supabase-js | 2.86.0 | Keep for auth and non-posts Supabase queries |
| Zod | 3.25 | Generated schemas auto-updated when running `bun run generate:api` |
| GSAP | 3.13.0 | `Flip` plugin already registered in `ExploreCardCell` |

---

## Installation

No new packages. This milestone is a data-wiring exercise.

```bash
# After updating openapi.json with has_magazine parameter:
cd packages/web && bun run generate:api
```

---

## Alternatives Considered

| Recommended | Alternative | Why Not |
|-------------|-------------|---------|
| Update `openapi.json` + regenerate for `has_magazine` | Manually pass as untyped query param | Creates type debt; diverges from Orval SSOT established in v9.0 |
| Migrate `useInfinitePosts` to `listPosts()` (REST API) | Keep Supabase direct + add has_magazine filter | Supabase filter requires knowing the DB schema; REST API filter is already implemented in Rust service |
| `spot_count` badge from list response | Fetch spot detail per card in grid | N+1 request pattern — 40 cards = 40 extra API calls on grid render |
| Reuse existing `ImageDetailModal` for editorial | Build separate `EditorialDetailModal` | Same component already handles `post_magazine_id` and conditionally renders `MagazineEditorialSection` |

---

## Sources

- `packages/web/lib/hooks/useImages.ts` — `useInfinitePosts` Supabase direct implementation with `// Note: hasMagazine filter not yet supported` comment (HIGH confidence — live code)
- `packages/web/lib/api/generated/models/listPostsParams.ts` — confirms `has_magazine` absent from generated types (HIGH confidence — generated from spec)
- `packages/api-server/openapi.json` — direct inspection confirms `has_magazine` absent from `GET /api/v1/posts` params section (HIGH confidence — source of truth)
- `packages/api-server/src/domains/posts/service.rs` (line 562-563) — confirms `has_magazine` implemented in Rust service (HIGH confidence — Rust source)
- `packages/api-server/src/domains/posts/dto.rs` (line 178-180) — confirms `has_magazine` field in DTO (HIGH confidence — Rust source)
- `packages/web/lib/components/explore/ExploreCardCell.tsx` — GSAP FLIP + `href=/posts/${imageId}` already working (HIGH confidence — live code)
- `packages/web/app/@modal/(.)posts/[id]/page.tsx` — intercepting route renders `ImageDetailModal` (HIGH confidence — live code)
- `packages/web/lib/components/detail/ImageDetailModal.tsx` — full side drawer + `usePostMagazine` already wired (HIGH confidence — live code)
- `packages/web/lib/api/adapters/postDetailToImageDetail.ts` — `post_magazine_id` mapped correctly in adapter (HIGH confidence — live code)
- `packages/api-server/src/domains/post_magazines/handlers.rs` — `GET /post-magazines/{id}` route confirmed (HIGH confidence — Rust source)

---

*Stack research for: v11.0 Explore & Editorial Data Integration*
*Researched: 2026-04-01*
