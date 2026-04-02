# Project Research Summary

**Project:** decoded v11.0 — Explore & Editorial Data Integration
**Domain:** Incremental data integration — connecting existing Explore/Editorial UI to REST API with working editorial filter and detail page flow
**Researched:** 2026-04-01
**Confidence:** HIGH

## Executive Summary

v11.0 is a data-wiring milestone, not a feature-build. The UI components, routing architecture, animation system, and detail page flow are already built and working. Three specific integration gaps are silently preventing the platform from functioning as designed: (1) the editorial filter is wired end-to-end in React but the Supabase query never applies the `has_magazine` condition, making `/editorial` indistinguishable from `/explore`; (2) `spot_count` is hardcoded to `0` in the grid list mapping, stripping the discovery quality signal from every card; (3) `usePostDetailForImage` uses a Supabase direct query that never returns `post_magazine_id`, so the magazine metadata section in the side drawer is always empty. Every fix is a surgical modification to an existing file — no new components, no new routes, no new stores.

The recommended approach is to fix the three data gaps in dependency order: editorial filter first (validates data exists), then detail hook migration to REST (unlocks magazine drawer and SpotDot quality), then spot count badge (validates enrichment path). A fourth fix — replacing `window.location.href` with `router.push` in `handleMaximize` — is independent and removes a full browser reload from the maximize flow. The long-term correct path for `has_magazine` filtering is to add the parameter to `openapi.json` and regenerate via Orval; the fast unblocking path is a one-line Supabase query addition. Both are valid, with the Supabase path appropriate for v11.0 and the REST API path suitable for v11.x once the OpenAPI spec is updated.

The primary risk is invisible: each of the three gaps looks like it is wired in the code (the props, hooks, and adapter all exist) but none actually works end-to-end against live data. The "looks done but isn't" nature of these bugs means the milestone cannot be declared complete without an explicit end-to-end smoke test: click a card in `/editorial` → verify only magazine-linked posts appear → open drawer → verify `magazineId` is non-null → verify magazine title/brands/style tags render → click Maximize2 → verify smooth navigation to full page without hard reload. Real data with `post_magazine_title IS NOT NULL` must exist in the database for visual validation; if it does not, the editorial automation pipeline (issue #38) is an external dependency.

---

## Key Findings

### Recommended Stack

No new dependencies. The entire v11.0 milestone is achievable with the existing stack. The correct data-fetching path for grid list is `listPosts()` (Orval-generated, via BFF proxy to Rust/Axum), but the Supabase direct path in `useInfinitePosts` is an acceptable short-term fix for unblocking editorial validation without a backend change. For detail data, the generated `getPost()` function with the existing `postDetailToImageDetail` adapter is the correct migration target.

**Core technologies in play:**
- **TanStack Query 5.90.11**: `useInfiniteQuery` pattern in `useInfinitePosts` — must be preserved; do not swap for Orval-generated `useListPosts` (single-page, not infinite)
- **Orval 8.5.3**: Source of truth for typed API hooks — `openapi.json` must be updated before `has_magazine` can enter generated types; run `bun run generate:api` after any spec change
- **GSAP 3.13.0 + Flip plugin**: FLIP animation already working in `ExploreCardCell`; `transitionStore` bridges grid click to modal entry animation
- **Next.js App Router intercepting routes**: `@modal/(.)posts/[id]` intercepts from root-depth routes only — works correctly from `/explore` and `/editorial`; would break from any nested route
- **Supabase JS 2.86.0**: Used for grid list and detail queries today; `post_magazine_title` already denormalized in `posts` table — filter addition requires no schema change

### Expected Features

**Must have (table stakes for v11.0):**
- Editorial tab shows only magazine-linked posts — currently shows identical content to Explore; silent filter failure
- SpotDot with `top_solution` data in side drawer — requires migrating `usePostDetailForImage` from Supabase to REST API `getPost`
- Spot count badge on grid cards — currently hardcoded `0`; one field mapping change in `useInfinitePosts`
- End-to-end flow smoke test — card click → drawer → full page with real data, no mock

**Should have (improvements that fall out of the above fixes):**
- AI summary in detail drawer — becomes available automatically when `usePostDetailForImage` switches to REST API (`ai_summary` is in `PostDetailResponse`)
- Editorial title overlay meaningful — `ExploreCardCell` already renders `item.editorialTitle`; becomes non-null once editorial filter works
- Animated maximize navigation — replace `window.location.href` hard reload with GSAP-animated `router.push` in `handleMaximize`
- Sort controls wired — `ExploreSortControls` exists but sort state wiring to `useInfinitePosts` needs verification

**Defer to v11.x / v12.0+:**
- `has_magazine` via REST API (backend OpenAPI spec update + Rust regeneration) — correct long-term path but not a v11.0 blocker
- Artist profile cards in Explore — requires new `/artists` backend endpoints
- Trending section — `trending_score` column population in production unverified
- Magazine-specific layout views in Explore — `/magazine` is the correct home for full editorial layouts
- Search within Explore — Posts API has no search parameter; disable until `/api/v1/search/posts` exists

### Architecture Approach

The architecture is already correct — the problem is three data gaps, not structural issues. `ExploreClient` is the shared grid engine for both `/explore` and `/editorial` (via `hasMagazine` prop). `@modal/(.)posts/[id]` is the intercepting route that renders `ImageDetailModal` as a side drawer. `transitionStore` bridges the GSAP FLIP state from grid click to modal entry animation. The only structural recommendation is to resist adding more editorial-specific props to `ExploreClient` beyond the existing `hasMagazine` flag — if editorial needs fundamentally different behavior, create a thin `EditorialClient` wrapper instead.

**Major components and their responsibilities:**
1. **`useInfinitePosts`** — grid list data; needs `hasMagazine` Supabase filter + real `spotCount` mapping (2 changes, 1 file)
2. **`usePostDetailForImage`** — detail data; needs migration from Supabase direct to `getPost` REST via existing `postDetailToImageDetail` adapter (1 hook refactor)
3. **`useImageModalAnimation.handleMaximize`** — replace `window.location.href` with `router.push` after GSAP animate-out (4-line change)
4. **`ExploreCardCell`** — add spot count badge UI when `spotCount > 0` (additive UI change)
5. **`openapi.json`** (v11.x target) — add `has_magazine` boolean query param to `GET /api/v1/posts`, then `bun run generate:api`

### Critical Pitfalls

1. **`hasMagazine` filter accepted by hook but never applied** — the React Query key includes `hasMagazine` (caching is correct) but the Supabase `.from("posts")` query body contains an explicit `// Note: hasMagazine filter not yet supported` comment. Add `.not("post_magazine_title", "is", null)` when `hasMagazine === true`. Without this, Editorial page is identical to Explore and the milestone cannot be demonstrated.

2. **Orval generates `useQuery` (single-page), not `useInfiniteQuery`** — importing the generated `useListPosts` hook into `ExploreClient` will silently break infinite scroll. Keep the hand-written `useInfinitePosts` wrapper; if migrating to REST, call the `listPosts` fetch function inside a custom `useInfiniteQuery`, not via the generated hook.

3. **`post_magazine_id` never returned by `usePostDetailForImage`** — `fetchPostWithSpotsAndSolutions` is a Supabase query that predates the magazine feature and does not return `post_magazine_id`. This means `magazineId` is always `undefined` in `ImageDetailModal` and the magazine metadata drawer section never renders. Fix: migrate hook to `getPost` REST + `postDetailToImageDetail` adapter.

4. **N+1 solution data per card** — `spot_count` from the list response is appropriate for card badges. Full `SpotWithTopSolution[]` detail is only in `PostDetailResponse` (single-post endpoint). Never call `getPost` per visible card in the grid — this fires 40+ requests per page load. Load detail data only when the modal opens.

5. **`window.location.href` in `handleMaximize` causes full browser reload** — clears React Query cache, skips GSAP cleanup animation, and corrupts browser history. Replace with GSAP animate-out followed by `router.push`. The `router` instance is already in scope.

---

## Implications for Roadmap

Based on research, a 6-phase structure is recommended for v11.0:

### Phase 1: Data Validation Gate
**Rationale:** Before writing any code, confirm editorial posts exist in the database. All subsequent phases require `post_magazine_title IS NOT NULL` rows to validate visually. This is a zero-code gate that prevents building in the dark.
**Delivers:** SQL query result confirming how many `posts` rows have `post_magazine_title` populated; documents dependency on editorial automation (#38) if zero rows found
**Addresses:** Prerequisite for all other phases
**Avoids:** Building and "fixing" the editorial filter with no data to verify the fix worked

### Phase 2: Editorial Filter Fix
**Rationale:** This is the P0 blocker. Until the `hasMagazine` Supabase filter is applied, `/editorial` shows all posts — the tab has no distinct identity. Everything else builds on editorial data being correctly filtered.
**Delivers:** `/editorial` shows only magazine-linked posts; `ExploreCardCell` editorial title overlays become meaningful
**Addresses:** Table stakes — "Editorial tab shows only magazine-linked posts"
**Avoids:** Pitfall 1 (silent filter failure), Pitfall 6 (prop coupling — keep single `hasMagazine` prop, no new editorial flags)
**Files:** `packages/web/lib/hooks/useImages.ts` — 1-line Supabase filter addition

### Phase 3: Detail Data Migration (REST API)
**Rationale:** `usePostDetailForImage` must switch from Supabase to REST `getPost` before magazine drawer content can be validated. The `postDetailToImageDetail` adapter already exists — this is hook plumbing, not new architecture. Unlocks magazine metadata, AI summary, and SpotDot top_solution in a single refactor.
**Delivers:** `post_magazine_id` present in detail response; magazine title, brands, style tags render in side drawer; `ai_summary` in `ImageDetailPreview`; SpotDot `top_solution` data (thumbnail + affiliate URL)
**Addresses:** Table stakes — "SpotDot with REST API data"; differentiator — "AI summary in drawer"
**Avoids:** Pitfall 7 (Supabase detail missing `post_magazine_id`), Pitfall 5 (N+1 — detail loaded on modal open only, not per card)
**Files:** `packages/web/lib/hooks/useImages.ts` — `usePostDetailForImage` refactor

### Phase 4: Spot Count Badge on Grid Cards
**Rationale:** After Phase 2 confirms editorial filter and Phase 3 confirms detail data, add the spot count signal to the grid. Depends on Phase 2 to validate editorial cards look correct before adding badge UI.
**Delivers:** Spot count badge on cards with `spotCount > 0`; real `spotCount` values from Supabase batch query or REST `PostListItem.spot_count`
**Addresses:** Table stakes — "Spot count badge wired"; differentiator — "Decoded quality signal on discovery grid"
**Avoids:** Pitfall 5 (N+1 — use list-level `spot_count`, not per-card `getPost` calls); `ThiingsGrid MAX_RENDER_CELLS = 300` performance trap (count badge is lightweight, not full SpotDot overlay)
**Files:** `useImages.ts`, `ExploreCardCell.tsx`, optionally `ThiingsGrid.tsx`

### Phase 5: Maximize Navigation Fix
**Rationale:** Independent fix that removes a hard browser reload from the maximize flow. Logically grouped at the end to validate the full Explore → drawer → full page journey works smoothly.
**Delivers:** Animated soft navigation from modal to full page; browser history preserved; React Query cache intact after maximize
**Addresses:** Table stakes — "View Full Page from drawer without reload"
**Avoids:** Pitfall 2 (`window.location.href` corruption of history and cache)
**Files:** `packages/web/lib/hooks/useImageModalAnimation.ts` — `handleMaximize` replacement

### Phase 6: End-to-End Verification
**Rationale:** The "looks done but isn't" nature of this milestone requires explicit end-to-end smoke testing before declaring the milestone complete. Eight specific checklist items must be verified against real data.
**Delivers:** Manual or Playwright verification: Explore card click → drawer renders with magazine data → Maximize2 → full page; Editorial tab shows only magazine posts; spot count badges appear on appropriate cards; `editorialTitle` overlay visible on editorial cards
**Addresses:** All table stakes; guards against all 8 items in the "looks done but isn't" checklist from PITFALLS.md

### Phase Ordering Rationale

- Data validation before code because all three data fixes need live data to verify their correctness
- Editorial filter before detail migration because it is the fastest fix (1 line) and unlocks the largest visible change
- Detail migration before spot count badge because it confirms the data pipeline through hook/adapter/component chain is sound
- Maximize fix is independent and last because it is low-risk and self-contained
- End-to-end verification as a distinct final phase because each fix can appear correct in isolation while the integration fails

### Research Flags

Phases that are straightforward (skip additional research):
- **Phase 2 (Editorial Filter):** One-line Supabase query change; pattern is clear from codebase inspection
- **Phase 4 (Spot Count Badge):** Batch query pattern documented in ARCHITECTURE.md; well-established
- **Phase 5 (Maximize Fix):** GSAP animate-out pattern documented in ARCHITECTURE.md; `router` already in scope

Phases that need validation before implementation:
- **Phase 1 (Data Gate):** If zero rows with `post_magazine_title IS NOT NULL` exist in production, editorial automation (#38) is a blocking external dependency — escalate before implementing anything
- **Phase 3 (Detail Migration):** Confirm `postDetailToImageDetail` adapter handles the full `PostDetailResponse → ImageDetail` mapping including `spots[].center` fractions for SpotDot positioning before committing to the hook refactor

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All findings from live codebase + OpenAPI spec + Rust source; no library assumptions or training-data guesses |
| Features | HIGH | Direct codebase inspection + OpenAPI spec verification; UX patterns from secondary sources (MEDIUM weight) |
| Architecture | HIGH | Component boundaries and data flows traced through actual files with line numbers; no structural inference |
| Pitfalls | HIGH | Each pitfall derived from direct codebase inspection; code comments and hardcoded values cited with line numbers |

**Overall confidence:** HIGH

### Gaps to Address

- **`postDetailToImageDetail` adapter completeness:** The adapter is confirmed to exist and to map `post_magazine_id`, but full field coverage (especially `spots[].center` fractions for SpotDot positioning and `top_solution` shape) was not exhaustively verified. Check before Phase 3 implementation begins.
- **Editorial data availability in production/dev:** If the `posts` table has zero rows with `post_magazine_title IS NOT NULL`, visual validation of Phases 2-4 is impossible. Phase 1 resolves this question — if empty, editorial automation (#38) is the actual v11.0 blocker.
- **`trending_score` production data quality:** `sort=trending` param exists in the backend but score population in production is unverified. Trending sort is correctly deferred to v12.0+ but should be validated before entering any roadmap phase.
- **ThiingsGrid `GridItem` type extensibility:** Research recommends adding `spotCount?: number` to the `GridItem` type in `ThiingsGrid.tsx`. The exact current type shape was not inspected — confirm before Phase 4 implementation to avoid type conflicts.

---

## Sources

### Primary (HIGH confidence — direct codebase inspection)
- `packages/web/lib/hooks/useImages.ts` — `useInfinitePosts` Supabase direct impl, `hasMagazine` not applied, `spotCount: 0` hardcoded, `usePostDetailForImage` Supabase path
- `packages/api-server/openapi.json` — confirmed `has_magazine` absent from `GET /api/v1/posts` params; `PostDetailResponse` schema inspection
- `packages/api-server/src/domains/posts/dto.rs` (line 178-180) + `service.rs` (line 562-563) — `has_magazine` implemented in Rust, not exposed in spec
- `packages/web/lib/components/detail/ImageDetailModal.tsx` — side drawer, `usePostMagazine` wiring, GSAP animation refs
- `packages/web/lib/hooks/useImageModalAnimation.ts` — `handleMaximize` hard reload via `window.location.href`
- `packages/web/lib/components/explore/ExploreCardCell.tsx` — FLIP capture, `editorialTitle` overlay, `href=/posts/${imageId}`
- `packages/web/app/@modal/(.)posts/[id]/page.tsx` — intercepting route depth (root-level, correct)
- `packages/web/lib/api/generated/models/listPostsParams.ts` — confirms `has_magazine` absent from generated types
- `packages/web/lib/api/adapters/postDetailToImageDetail.ts` — adapter confirmed to exist; maps `post_magazine_id`
- `packages/web/lib/components/ThiingsGrid.tsx` — `MAX_RENDER_CELLS = 300`, `onReachEnd` callback pattern

### Secondary (MEDIUM confidence — UX pattern validation)
- [Cards design pattern — UI Patterns](https://ui-patterns.com/patterns/cards)
- [Pagination vs Infinite Scroll patterns](https://uxpatterns.dev/pattern-guide/pagination-vs-infinite-scroll)
- [Fashion product detail page examples](https://commerce-ui.com/insights/best-21-fashion-pdp-examples-in-2024)

---
*Research completed: 2026-04-01*
*Ready for roadmap: yes*
