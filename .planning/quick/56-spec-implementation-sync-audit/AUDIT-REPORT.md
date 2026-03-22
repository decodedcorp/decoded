# Spec-Implementation Sync Audit Report

> Audit date: 2026-03-05
> Auditor: Claude (quick-056)

---

## Shared Specs

### component-registry.md

| # | Issue Type | Details |
|---|-----------|---------|
| 1 | MISSING_ENTRY | `SpotMarker` component exists at `packages/web/lib/design-system/spot-marker.tsx` and is exported from `index.ts` but is NOT listed in the Summary Table or documented |

**Summary:** 1 discrepancy. All other 41 component file paths verified as existing. Barrel export (`index.ts`) matches all listed components.

---

### api-contracts.md

| # | Issue Type | Details |
|---|-----------|---------|
| 1 | MISSING_ENTRY | `GET /api/v1/badges` — handler exists at `app/api/v1/badges/route.ts`, client at `lib/api/badges.ts` |
| 2 | MISSING_ENTRY | `GET /api/v1/badges/me` — handler exists at `app/api/v1/badges/me/route.ts`, client: `fetchMyBadges()` in `lib/api/badges.ts` |
| 3 | MISSING_ENTRY | `GET /api/v1/rankings` — handler exists at `app/api/v1/rankings/route.ts`, client: `fetchRankings()` in `lib/api/rankings.ts` |
| 4 | MISSING_ENTRY | `GET /api/v1/rankings/me` — handler exists at `app/api/v1/rankings/me/route.ts`, client: `fetchMyRanking()` in `lib/api/rankings.ts` |
| 5 | MISSING_ENTRY | `POST /api/v1/posts/with-solutions` (plural) — handler exists at `app/api/v1/posts/with-solutions/route.ts`, client: `createPostWithFileAndSolutions()` in `lib/api/posts.ts` |
| 6 | MISSING_ENTRY | `POST /api/v1/solutions/[solutionId]/adopt` — handler exists at `app/api/v1/solutions/[solutionId]/adopt/route.ts` |
| 7 | MISSING_ENTRY | `DELETE /api/v1/solutions/[solutionId]/adopt` — handler exists (same file as #6) |
| 8 | MISSING_ENTRY | `GET /api/v1/posts/[postId]` — handler exists at `app/api/v1/posts/[postId]/route.ts`, client: `fetchPostDetail()` in `lib/api/posts.ts` — missing from Endpoint Index (only PATCH/DELETE listed for this route) |

**Summary:** 8 discrepancies. All existing endpoint paths verified. 5 entirely new routes + 1 missing GET method + 2 adopt routes not documented.

---

### store-map.md

| # | Issue Type | Details |
|---|-----------|---------|
| 1 | OUTDATED_STATUS | `magazineStore` listed as "PROPOSED" / "not yet created" but file EXISTS at `packages/web/lib/stores/magazineStore.ts` (135 lines, implemented) |
| 2 | MISSING_ENTRY | `studioStore` exists at `packages/web/lib/stores/studioStore.ts` — manages Spline 3D camera states for the studio/dome experience. Not listed in store map |
| 3 | MISSING_ENTRY | `example-store.ts` exists at `packages/web/lib/stores/example-store.ts` — template/example store, can be ignored |

**Summary:** 2 actionable discrepancies (magazineStore status, studioStore missing). example-store is a template — will note but not add.

---

### data-models.md

| # | Issue Type | Details |
|---|-----------|---------|
| 1 | OK | `packages/web/lib/api/types.ts` — EXISTS |
| 2 | OK | `packages/web/lib/supabase/types.ts` — EXISTS |
| 3 | OK | `packages/web/lib/components/detail/types.ts` — EXISTS |

**Summary:** 0 discrepancies. All source file paths verified. Type names spot-checked and confirmed present.

---

## Screen Specs

### SCR-DISC-01 (Home)

| # | Issue Type | Details |
|---|-----------|---------|
| 1 | OK | All 14 component file paths verified as existing |

**Updated timestamp:** 2026-02-19 -> 2026-03-05

---

### SCR-DISC-02 (Search)

| # | Issue Type | Details |
|---|-----------|---------|
| 1 | OK | All 14 component/hook file paths verified as existing |

**Updated timestamp:** 2026-02-19 -> 2026-03-05

---

### SCR-DISC-03 (Feed)

| # | Issue Type | Details |
|---|-----------|---------|
| 1 | OK | All 10 component file paths verified as existing |

**Updated timestamp:** 2026-02-19 -> 2026-03-05

---

### SCR-DISC-04 (Explore)

| # | Issue Type | Details |
|---|-----------|---------|
| 1 | OK | All 13 component file paths verified as existing (including `packages/shared/stores/hierarchicalFilterStore.ts`) |

**Updated timestamp:** 2026-02-19 -> 2026-03-05

---

### SCR-VIEW-01 (Post Detail)

| # | Issue Type | Details |
|---|-----------|---------|
| 1 | STALE_PATH | `packages/web/lib/components/detail/PostDetailPage.tsx` — MISSING. Post detail route (`/posts/[id]`) uses `ImageDetailPage` directly |
| 2 | STALE_PATH | `packages/web/lib/components/detail/PostDetailContent.tsx` — MISSING. Not a separate component; content is rendered within `ImageDetailPage` and its sub-components |

**Updated timestamp:** 2026-02-19 -> 2026-03-05

---

### SCR-VIEW-02 (Spot Hotspot)

| # | Issue Type | Details |
|---|-----------|---------|
| 1 | STALE_PATH | Reference to `PostDetailContent.tsx` — file does not exist (same as SCR-VIEW-01) |

**Updated timestamp:** 2026-02-19 -> 2026-03-05

---

### SCR-VIEW-03 (Item/Solution)

| # | Issue Type | Details |
|---|-----------|---------|
| 1 | OK | All 10 component file paths verified as existing |

**Updated timestamp:** 2026-02-19 -> 2026-03-05

---

### SCR-VIEW-04 (Related Content)

| # | Issue Type | Details |
|---|-----------|---------|
| 1 | OK | All 8 component file paths verified as existing |

**Updated timestamp:** 2026-02-19 -> 2026-03-05

---

### SCR-CREA-01 (Upload)

| # | Issue Type | Details |
|---|-----------|---------|
| 1 | OK | All 9 component file paths verified as existing |

**Updated timestamp:** no update needed (no date in header)

---

### SCR-CREA-02 (AI Detect)

| # | Issue Type | Details |
|---|-----------|---------|
| 1 | OK | All 12 component file paths verified as existing |

**Updated timestamp:** no update needed

---

### SCR-CREA-03 (Edit Solution)

| # | Issue Type | Details |
|---|-----------|---------|
| 1 | OK | All 16 component file paths verified as existing |

**Updated timestamp:** no update needed

---

### SCR-USER-01 (Login)

| # | Issue Type | Details |
|---|-----------|---------|
| 1 | OK | All 8 component file paths verified as existing |

**Updated timestamp:** no update needed

---

### SCR-USER-02 (Profile)

| # | Issue Type | Details |
|---|-----------|---------|
| 1 | OK | All 18 component file paths verified as existing |

**Updated timestamp:** no update needed

---

### SCR-USER-03 (Earnings)

| # | Issue Type | Details |
|---|-----------|---------|
| 1 | OK | No file paths referenced (NOT-IMPL spec) |

**No update needed.**

---

### SCR-USER-04 (SNS Connect)

| # | Issue Type | Details |
|---|-----------|---------|
| 1 | OK | All paths marked as "proposed (not yet created)" — intentional forward-looking spec |

**No update needed.**

---

## Summary Counts

| Category | Count |
|----------|-------|
| MISSING_ENTRY (api-contracts) | 8 |
| MISSING_ENTRY (component-registry) | 1 |
| OUTDATED_STATUS (store-map) | 1 |
| MISSING_ENTRY (store-map) | 1 |
| STALE_PATH (screen specs) | 2 |
| OK (data-models) | 3 |
| **Total discrepancies** | **13** |
| **Files updated** | 6 |
