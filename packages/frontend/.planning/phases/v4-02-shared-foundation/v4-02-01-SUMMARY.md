---
phase: v4-02
plan: "01"
subsystem: shared-documentation
tags: [design-system, api, data-models, documentation, spec]

dependency_graph:
  requires:
    - v4-01-01: archive foundation (stale path audit, snapshot)
    - v4-01-02: spec templates and README
  provides:
    - specs/_shared/component-registry.md (35+ component catalog)
    - specs/_shared/data-models.md (TypeScript type catalog)
    - specs/_shared/api-contracts.md (24 user-facing endpoints)
  affects:
    - v4-03: Flow documents (reference component-registry + api-contracts)
    - v4-04: Detail View specs (reference SpotDetail, Hotspot, data-models)
    - v4-05: Discovery specs (reference GridCard, ProductCard, PostsListParams)
    - v4-06: Creation-AI specs (reference analyze/upload contracts, DetectedItem)
    - v4-07: User System specs (reference UserResponse, ProfileHeaderCard)

tech_stack:
  added: []
  patterns:
    - Hybrid format: summary table at top + detailed sections (component-registry)
    - TypeScript code blocks as primary type documentation (data-models)
    - Full OpenAPI-style endpoint documentation (api-contracts)

key_files:
  created:
    - specs/_shared/component-registry.md
    - specs/_shared/data-models.md
    - specs/_shared/api-contracts.md
  modified: []

key_decisions:
  - id: KD-01
    decision: All 34 design system file paths verified against filesystem before publishing — zero guessed paths
    rationale: Core v4.0 requirement; AI agents must not reference non-existent paths
  - id: KD-02
    decision: Component registry uses compact prop tables (not TypeScript interface copies) while data-models uses TypeScript code blocks
    rationale: Per v4.0 anti-feature rules + locked user decision (CONTEXT.md)
  - id: KD-03
    decision: API contracts documents debug-env route as existing but not user-facing (not formally documented)
    rationale: Route is not env-guarded; honest disclosure without inflating user-facing surface
  - id: KD-04
    decision: API vs DB type differences explicitly noted (spots.subcategory_id vs API category_id, Solution field differences)
    rationale: Prevents confusion when AI agents compare DB schema against API response shapes

patterns_established:
  - summary-table-then-sections: Component registry pattern usable in future composite registries
  - type-source-map: Top-level entity→file mapping table in data-models.md
  - endpoint-index: Quick-reference table at top of api-contracts.md

metrics:
  duration: "~5 minutes (1771501296→1771501617 epoch)"
  completed: "2026-02-19"
---

# Phase v4-02 Plan 01: Shared Foundation Reference Documents Summary

**One-liner:** Three AI-ready shared reference documents covering 52 components, 24 TypeScript types, and 24 API endpoints with verified file paths.

---

## Performance

- **Tasks completed:** 3/3
- **Duration:** ~5 minutes
- **Deviations:** None

---

## Accomplishments

1. **component-registry.md** — Design system catalog with 52 rows in summary table (35+ components + skeleton variants). Grouped into Primitive (17), Composite (26), Feature (9) tiers. Every file path verified against filesystem. Compact prop tables, no TypeScript interface copies.

2. **data-models.md** — TypeScript type catalog with 24-row Type Source Map. TypeScript code blocks copied from source files for all major entities. Documents API-vs-DB type differences. Covers: Content (Post, CreatePost, CreatePostWithSolution), Discovery (Spot, Solution), User (UserResponse, Stats, Activities), System (Category, Badge), AI (DetectedItem, AnalyzeResponse), Legacy (ItemRow, UiItem).

3. **api-contracts.md** — Full endpoint reference with 24-row index table. Every exported HTTP method handler documented with: method, path, query params, request body, response shape, auth requirement, handler file path, and client function name. Covers all 17 user-facing route files.

---

## Task Commits

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create component-registry.md | 7935041 | specs/_shared/component-registry.md |
| 2 | Create data-models.md | 34b2b46 | specs/_shared/data-models.md |
| 3 | Create api-contracts.md | b21c6bd | specs/_shared/api-contracts.md |

---

## Files Created

| File | Size | Content |
|------|------|---------|
| `specs/_shared/component-registry.md` | 693 lines | 52-row summary table + detailed sections for all 3 tiers |
| `specs/_shared/data-models.md` | 654 lines | 24-row Type Source Map + TypeScript code blocks for all entities |
| `specs/_shared/api-contracts.md` | 693 lines | 24-row endpoint index + full endpoint documentation |

## Files Modified

None — documentation-only plan.

---

## Decisions Made

| Decision | Rationale | Impact |
|----------|-----------|--------|
| Component registry: prop tables, not interface copies | v4.0 anti-feature rule | Compact, scannable format without TypeScript noise |
| Data-models: TypeScript code blocks as primary format | Locked user decision from CONTEXT.md | AI agents get exact type shapes without reading source |
| Document API vs DB differences explicitly | Prevents confusion for AI agents comparing types | Notes on subcategory_id abstraction, Solution field differences |
| debug-env: noted as existing, not formally documented | Honest disclosure; not user-facing | No inflated API surface |
| Skeleton variants included in summary table | More complete coverage for loading state specs | 52 rows vs 35+ minimum |

---

## Deviations from Plan

None — plan executed exactly as written.

---

## Issues Encountered

None.

---

## User Setup Required

None — documentation-only plan, no code changes, no environment setup needed.

---

## Next Phase Readiness

**v4-02-02** (store-map.md + injection-guide.md) can begin immediately.

**Pending todos carried forward to STATE.md:**
- Before v4-04: Verify `transitionStore` shape + `useFlipTransition.ts` (FLIP animation pattern)
- Before v4-06: Verify `requestStore` step enum values + `POST /api/v1/posts/analyze` response shape
- Before v4-07: Verify `authStore` user/session type + auth-conditional rendering patterns

**Quality gates passed:**
- All 34 component file paths verified (OK)
- All 17 route handler file paths verified (OK)
- All 3 source type files exist and read (OK)
- 52 component rows > 35 minimum (OK)
- 24 API endpoints documented (OK)
- No TypeScript interfaces in component-registry (OK)
- No i18n sections, version history, placeholder sections (OK)
