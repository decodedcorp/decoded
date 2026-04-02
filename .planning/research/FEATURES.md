# Feature Research

**Domain:** Editorial/Explore content discovery flow — fashion media platform (K-pop celebrity style)
**Researched:** 2026-04-01
**Confidence:** HIGH (primary sources: codebase + OpenAPI spec; web search for UX pattern validation)

---

## Context: What Already Exists

This is a SUBSEQUENT MILESTONE. The following are already shipped and working:

| Component | Status | File |
|-----------|--------|------|
| `ExploreClient` — Pinterest masonry, infinite scroll, category filter | SHIPPED | `app/explore/ExploreClient.tsx` |
| `ExploreCardCell` — GSAP FLIP transition, editorial title overlay | SHIPPED | `lib/components/explore/ExploreCardCell.tsx` |
| `ExploreFilterBar` / `ExploreFilterSheet` | SHIPPED | `lib/components/explore/` |
| `@modal/(.)posts/[id]` intercepting route — side drawer | SHIPPED | `app/@modal/(.)posts/[id]/page.tsx` |
| `ImageDetailModal` — GSAP FLIP side drawer, SpotDot overlays | SHIPPED | `lib/components/detail/ImageDetailModal.tsx` |
| `ImageDetailPage` — full-page detail with LenisProvider | SHIPPED | `lib/components/detail/ImageDetailPage.tsx` |
| `ImageDetailPreview` — lightweight modal preview content | SHIPPED | `lib/components/detail/ImageDetailPreview.tsx` |
| `/posts/[id]` full-page route | SHIPPED | `app/posts/[id]/page.tsx` |
| Editorial page reusing ExploreClient with `hasMagazine` prop | SHIPPED | `app/editorial/page.tsx` |
| REST API `GET /api/v1/posts` (artist_name, group_name, context, category, sort) | SHIPPED | Backend |

**Critical gap found in research:** `has_magazine` filter is in the frontend type `PostsListParams` (line 215 of `lib/api/mutation-types.ts`) but NOT in the backend OpenAPI spec. The current `useInfinitePosts` hook uses a Supabase direct query without the magazine filter applied — there is an explicit code comment: `// Note: hasMagazine filter not yet supported via Supabase query`. The Editorial page silently shows the same content as Explore. This is the P0 blocker.

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist in a fashion content discovery platform. Missing these = product feels incomplete or broken.

| Feature | Why Expected | Complexity | Depends On | Notes |
|---------|--------------|------------|------------|-------|
| Editorial tab shows only magazine-linked posts | Users clicking "Editorial" expect curated content, not all posts | LOW | Backend `has_magazine` query param OR Supabase `.not("magazine_id", "is", null)` | Currently `hasMagazine` prop passed to hook but filter not applied — silent failure shows all posts same as Explore |
| Card click opens detail side drawer | Pinterest/Instagram — every discovery platform does card-to-detail expansion | LOW | Already wired: ExploreCardCell links `/posts/${imageId}`, intercepting route renders ImageDetailModal | Flow architecture exists; needs real data flowing through it end-to-end |
| Detail drawer shows spot count on card | Users want a quality signal: does this post have decoded items before clicking | LOW | `spot_count` in `Post` API response schema | `PostGridItem.spotCount` hardcoded to `0` in `useInfinitePosts` mapping — one-line fix |
| Detail drawer shows product name/thumbnail for spotted items | Users expect to see what was identified (the "decoded" value proposition) | MEDIUM | `PostDetailResponse.spots[].top_solution` exists in API schema | `usePostDetailForImage` uses Supabase direct query; misses `top_solution.thumbnail_url` and `affiliate_url` — needs REST API switch |
| Loading/skeleton state for infinite scroll | Standard expectation for image-heavy feeds | LOW | Already exists as `ExploreSkeletonCell` | Already shipped |
| Error state with retry | Users expect graceful degradation | LOW | Already exists in ExploreClient | Already shipped |
| Empty state when filter returns no results | Users need feedback on "no content here" | LOW | Already exists in ExploreClient | Already shipped |
| Close/back navigation from drawer | ESC key, backdrop click, swipe down on mobile | LOW | Already wired in `ImageDetailModal` | Already shipped |
| "View Full Page" from drawer | Power users want the full editorial context without re-navigating | LOW | Already wired via `handleMaximize` + `Maximize2` button | Already shipped |

### Differentiators (Competitive Advantage)

Features that set decoded apart. Not required by convention, but create the editorial/fashion-native experience.

| Feature | Value Proposition | Complexity | Depends On | Notes |
|---------|-------------------|------------|------------|-------|
| Spot dots on floating image (desktop drawer) | Users see exactly which garment is decoded — hover reveals product name | MEDIUM | `SpotDot` already rendered in `ImageDetailModal` — needs `top_solution` data from REST API | Currently mapped from Supabase spots/solutions; switching to REST API `PostDetailResponse` unlocks `top_solution.thumbnail_url` and `affiliate_url` together |
| Editorial title overlay on card grid | Magazine-native: cards carry story identity before click — the "decoded" editorial voice | LOW | Already implemented in `ExploreCardCell` — requires `post_magazine_title` field | `PostGridItem.title` mapped from `post_magazine_title ?? post.title` — works once Editorial filter is fixed |
| Spot count badge on card | Quick "decoded quality" signal — informs users which posts have fully decoded fashion | LOW | `spot_count` present in `Post` API response | Zero-cost fix in `useInfinitePosts` field mapping |
| AI summary in detail preview drawer | Decoded editorial context — platform voice beyond just a product link | LOW | `ai_summary` field in `PostDetailResponse`; `AISummarySection` already renders it | Works via REST API; Supabase fallback path may omit this field |
| Magazine accent color theming on spot dots | Editorial brand identity bleeds into UX — colored dots per magazine issue | LOW | `design_spec.accent_color` from `PostMagazineResponse`; already consumed in `ImageDetailModal` | Already implemented — depends on magazine data being fetched reliably |
| Artist/group name tag display in drawer | Fashion context: who is wearing this look — essential for K-pop fan discovery | LOW | `artist_name`, `group_name` in `PostDetailResponse`; `artistTags` rendered in `ImageDetailPreview` | Already rendered in drawer when data present; flows naturally with REST API switch |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem natural to add but should be explicitly deferred for v11.0.

| Feature | Why Requested | Why Problematic for v11.0 | Alternative |
|---------|---------------|--------------------------|-------------|
| Artist profile cards in Explore grid | Natural for K-pop fan discovery | Requires `/artists` or `/profiles` API endpoints not in current OpenAPI spec; new backend work | Defer to v12.0; use artist_name tag in drawer for now |
| Trending section / horizontal carousel at top of Explore | Seen on Instagram Explore, feels premium | `sort=trending` param exists but `trending_score` column population in production is unverified; layout complexity without data validation | Add after validating data quality; defer to v12.0 |
| Magazine-specific layout pages within Explore | Full editorial layout per issue when clicking a magazine-tagged card | Complex LayoutJSON rendering already exists at `/magazine` — duplicating in Explore breaks "Explore = discovery, Magazine = full read" mental model | Keep `/magazine` for full layout; Explore stays grid-first |
| Real-time like/save on card hover | Feels modern, seen on Unsplash/Pinterest | Requires authenticated action during scroll — increases API call density; adds auth-check complexity at grid layer | Surface like/save in detail drawer/full page; keep grid as tap-only navigation |
| Search within Explore grid | Power-user request | `useSearchStore.debouncedQuery` is consumed in `ExploreClient` but Posts API has no search parameter — returns all posts silently | Disable visible search until `/api/v1/search/posts` backend endpoint is available |
| Replacing ExploreFilterBar with horizontal tab pills | Feels cleaner on mobile | `ExploreFilterBar` and `ExploreFilterSheet` are already shipped and have Playwright visual regression baselines; replacing triggers test failures | Iterate on existing filter pattern; redesign in a dedicated design iteration |

---

## Feature Dependencies

```
[Editorial filter working]
    └──requires──> [Backend: has_magazine query param added to GET /api/v1/posts]
                       OR
                   [Supabase: .not("magazine_id", "is", null) in useInfinitePosts]
                       └──unblocks──> [Editorial card grid shows only curated magazine posts]
                       └──unblocks──> [Editorial title overlay actually meaningful]

[Spot count badge on card]
    └──requires──> [PostGridItem.spotCount wired from API spot_count field]
                       └──currently: hardcoded to 0 in useInfinitePosts mapping]

[SpotDot with top_solution data in drawer]
    └──requires──> [usePostDetailForImage switches from Supabase to REST API getPost]
                       └──unlocks──> [top_solution.thumbnail_url on SpotDot]
                       └──unlocks──> [top_solution.affiliate_url for Shop the Look]
                       └──unlocks──> [ai_summary in ImageDetailPreview]

[Magazine accent color on SpotDots]
    └──requires──> [usePostMagazine returns design_spec with accent_color]
    └──enhances──> [SpotDot visual theming per editorial]
    └──currently: works when post has valid post_magazine_id and magazine is fetched]

[End-to-end flow: card click -> drawer -> full page]
    └──currently: routing architecture exists and is wired]
    └──requires: real data flows through all three steps without error]
```

### Dependency Notes

- **Editorial filter is the P0 blocker.** The frontend is fully wired — `hasMagazine` prop flows from editorial page to `ExploreClient` to `useInfinitePosts`. The backend OpenAPI spec does NOT have `has_magazine` parameter (verified directly in `openapi.json`). Two resolution paths: (1) fastest — add `.not("magazine_id", "is", null)` to the Supabase query branch in `useInfinitePosts`, (2) correct long-term — add `has_magazine` to Rust backend and regenerate API client.
- **SpotDot quality requires REST API switch in `usePostDetailForImage`.** The hook currently builds item data from Supabase `spots` + `solutions` tables. Switching to the generated `getPost` client (`lib/api/generated/posts/posts`) provides `top_solution` (with thumbnail and affiliate URL), `category`, and `ai_summary` in one call. The adapter pattern already exists (`postDetailToImageDetail.ts`).
- **Spot count on card is a one-line fix.** `PostGridItem.spotCount` is `0` hardcoded in `useInfinitePosts`. The `Post` API schema includes `spot_count` as a required field. The mapping just needs `spotCount: post.spot_count`.
- **End-to-end flow depends on real magazine data existing.** If the `Editorial filter` fix is done but there are no posts with `magazine_id` in the database, the page shows empty state. This is expected behavior, not a bug — but it requires coordination with the editorial automation pipeline (#38).

---

## MVP Definition

This is a subsequent milestone. "Launch with" means what is required to complete the v11.0 milestone.

### Launch With (v11.0)

Minimum to call the Explore/Editorial data integration "complete" — no stub data, no silent failures.

- [ ] **Editorial filter working** — Apply `has_magazine` filter in `useInfinitePosts` (Supabase path: `.not("magazine_id", "is", null)`). Editorial page must show only magazine-linked posts. This is the only feature that makes Editorial a distinct page from Explore.
- [ ] **Spot count badge wired** — Wire `PostGridItem.spotCount` from API `spot_count` field in `useInfinitePosts`. Replace hardcoded `0`. Shows encoded quality signal on cards.
- [ ] **SpotDot with REST API data** — Switch `usePostDetailForImage` to use REST API `getPost` (generated client) instead of Supabase direct query. Adapter already exists — hook refactor only. Unlocks `top_solution`, `ai_summary`, and `post_magazine_id` together.
- [ ] **End-to-end flow smoke test** — Manual or Playwright: click a card in Explore → drawer opens with image + spots → Maximize2 → full page renders. Verify with real data (not mock). Confirms the integration actually works in production.

### Add After Validation (v11.x)

Add once v11.0 baseline is confirmed working in production.

- [ ] **Sort controls wired to API** — `ExploreSortControls` component exists but sort state wiring to `useInfinitePosts` needs verification. Wire `sort` param. Trigger: users request content ordering.
- [ ] **has_magazine via REST API** — Once backend adds `has_magazine` to OpenAPI spec and Rust handler, migrate `useInfinitePosts` from Supabase direct query to generated REST client. Makes the data layer consistent.

### Future Consideration (v12.0+)

- [ ] **Artist profile cards in Explore** — Requires new backend artist/profile API endpoints.
- [ ] **Trending section** — Defer until `trending_score` population in production is validated.
- [ ] **Magazine-specific layout views in Explore** — Architecture decision required; likely out of scope for discovery grid.

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Editorial filter (has_magazine Supabase fix) | HIGH — page is indistinguishable from Explore without it | LOW — one-line Supabase query addition | P1 |
| SpotDot with REST API (usePostDetailForImage refactor) | HIGH — core decoded value prop, unlocks top_solution + ai_summary | MEDIUM — hook refactor + adapter use | P1 |
| Spot count badge on card | MEDIUM — discovery quality signal | LOW — one field mapping change | P1 |
| End-to-end flow verification | HIGH — milestone cannot ship unverified | LOW — smoke test | P1 |
| AI summary in drawer | MEDIUM — differentiator; falls out of REST API switch | LOW — implicit once P1 REST API switch done | P2 |
| Sort controls wired to API | LOW — current default sort is acceptable | LOW — store + hook param wire | P2 |
| has_magazine via REST API (backend extension) | LOW for UX; MEDIUM for codebase consistency | MEDIUM — Rust backend change + regen | P2 |
| Artist profile cards | LOW for v11.0 | HIGH — new backend endpoints needed | P3 |
| Trending section | LOW — data quality unvalidated | MEDIUM | P3 |

**Priority key:**
- P1: Must have for v11.0 milestone
- P2: Add when P1 stable; good for v11.x
- P3: Future milestone

---

## Competitor Feature Analysis

| Feature | Pinterest | Instagram Explore | decoded (v11.0 target) |
|---------|-----------|-------------------|------------------------|
| Discovery grid | Masonry, infinite scroll | Grid with story rings | Masonry (ThiingsGrid), infinite scroll — matched |
| Card-to-detail transition | Expand-in-place overlay | Full-screen modal | GSAP FLIP card to side drawer — differentiator |
| Editorial vs. general content | Board-based separation | Reels vs. Posts tabs | Editorial tab via `hasMagazine` — needs filter to actually work |
| Product/spot overlay on image | Pin-based external links | Shopping tags on stories | SpotDot with precise position + top_solution — differentiator |
| AI-generated content context | None | Captions only | `ai_summary` in drawer — differentiator |
| Content filtering | Category boards | Explore topics | ExploreFilterBar with context categories — matched |
| Full editorial layouts | Collections | Instagram Guides | `/magazine` full LayoutJSON renderer — separate from Explore grid |

---

## Existing Code Impact Map

| Existing File | Current State | Required Change |
|---------------|---------------|-----------------|
| `lib/hooks/useImages.ts` — `useInfinitePosts` | `hasMagazine` received but comment says "not yet supported" | Add `.not("magazine_id", "is", null)` to Supabase query when `hasMagazine` is true |
| `lib/hooks/useImages.ts` — `useInfinitePosts` | `spotCount: 0` hardcoded in `PostGridItem` mapping | Map `spotCount: post.spot_count` from API response |
| `lib/hooks/useImages.ts` — `usePostDetailForImage` | Supabase direct query for spots + solutions | Switch to `getPost` REST API client; use existing `postDetailToImageDetail` adapter |
| `lib/components/explore/ExploreCardCell.tsx` | `spotCount` exists in `PostGridItem` type | Add spot count badge UI if `spotCount > 0` |
| `lib/components/detail/ImageDetailModal.tsx` | Already renders `SpotDot` and calls `usePostMagazine` | No change needed; benefits automatically from `usePostDetailForImage` REST API switch |

---

## Sources

- Codebase (HIGH confidence — direct inspection):
  - `packages/web/app/explore/ExploreClient.tsx`
  - `packages/web/lib/components/explore/ExploreCardCell.tsx`
  - `packages/web/lib/components/detail/ImageDetailModal.tsx`
  - `packages/web/lib/hooks/useImages.ts`
  - `packages/web/lib/supabase/queries/posts.ts`
  - `packages/web/lib/api/mutation-types.ts`
- Backend OpenAPI spec (HIGH confidence — direct verification): `packages/api-server/openapi.json`
  - `GET /api/v1/posts` has NO `has_magazine` parameter
  - `PostDetailResponse` includes `post_magazine_id`, `ai_summary`, `spots[].top_solution`
- Project plan: `.planning/PROJECT.md` (v11.0 milestone definition)
- UX pattern validation (MEDIUM confidence — general industry patterns):
  - [Cards design pattern — UI Patterns](https://ui-patterns.com/patterns/cards)
  - [Pagination vs Infinite Scroll: When to Use Each Pattern](https://uxpatterns.dev/pattern-guide/pagination-vs-infinite-scroll)
  - [Best 21 Fashion Product Detail Page Examples](https://commerce-ui.com/insights/best-21-fashion-pdp-examples-in-2024)
  - [8 Essential User Experience Design Patterns for 2025](https://www.pages.report/blog/user-experience-design-patterns)

---

*Feature research for: decoded v11.0 Explore & Editorial Data Integration*
*Researched: 2026-04-01*
