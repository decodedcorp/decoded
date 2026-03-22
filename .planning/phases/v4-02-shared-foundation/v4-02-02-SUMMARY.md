---
phase: v4-02
plan: "02"
subsystem: shared-documentation
tags: [zustand, stores, ai-injection, design-system, navigation, spec]

dependency_graph:
  requires:
    - v4-02-01: component-registry, data-models, api-contracts (cross-referenced in injection-guide and CMN specs)
  provides:
    - specs/_shared/store-map.md (6 Zustand stores with state shapes, transitions, screen usage)
    - specs/_shared/injection-guide.md (AI context loading protocol for 7 task types)
    - specs/shared/components/CMN-01-header.md (updated — DesktopHeader + MobileHeader)
    - specs/shared/components/CMN-02-footer.md (updated — DesktopFooter)
    - specs/shared/components/CMN-03-mobile-nav.md (updated — NavBar + NavItem)
  affects:
    - v4-03: Flow documents (injection-guide defines loading protocol for flow work)
    - v4-04: Detail View specs (transitionStore FLIP pattern deferral resolves here; store-map provides state context)
    - v4-05: Discovery specs (filterStore, searchStore documented in store-map)
    - v4-06: Creation-AI specs (requestStore step detail deferral resolves here)
    - v4-07: User System specs (authStore, profileStore documented in store-map)
    - all phases: injection-guide is the loading protocol every AI agent session should follow

tech_stack:
  added: []
  patterns:
    - EARS syntax for CMN requirements ("When [trigger], the system shall [behavior]")
    - Component map table pattern for shared component specs (breakpoint → component → file → visibility)
    - Decision tree format for AI protocol documentation

key_files:
  created:
    - specs/_shared/store-map.md
    - specs/_shared/injection-guide.md
  modified:
    - specs/shared/components/CMN-01-header.md
    - specs/shared/components/CMN-02-footer.md
    - specs/shared/components/CMN-03-mobile-nav.md

key_decisions:
  - id: KD-01
    decision: searchStore and filterStore documented as shared package implementations (packages/shared/stores/) re-exported via web stubs
    rationale: Web store files are 5–6 line re-exports; actual implementation is in shared package — documenting source of truth, not stub
  - id: KD-02
    decision: requestStore documents basic step flow (1→2→3) without verifying step enum detail; transitionStore documents state shape without FLIP pattern internals
    rationale: Per STATE.md pending todos — requestStore detail deferred to v4-06, transitionStore FLIP deferred to v4-04
  - id: KD-03
    decision: CMN specs fully rewritten (not appended) — 693 lines removed, 154 added across 3 files
    rationale: Old specs had anti-features (version history, implementation checklists, i18n sections, unverified component paths) that violated v4.0 spec rules; cleaner to rewrite than patch
  - id: KD-04
    decision: injection-guide.md includes context budget table with approximate line counts and token estimates
    rationale: AI agents benefit from knowing the cost of loading each file; prevents over-loading context with all 5 shared files for simple tasks

patterns_established:
  - store-map-format: State table + actions table + transitions diagram + used-by section per store
  - cmn-spec-format: Frontmatter + component map table + EARS requirements + no implementation checklists
  - injection-protocol: Decision tree → per-task reference tables → file inventory → loading priority rules → context budget

metrics:
  duration: "~3 minutes (1771501783→1771501987 epoch)"
  completed: "2026-02-19"
---

# Phase v4-02 Plan 02: Store Map + Injection Guide + CMN Updates Summary

**One-liner:** Store map documenting 6 Zustand stores with transitions, injection guide with 7-task-type decision tree, and 3 CMN specs fully rewritten to reference v2.0 design system.

---

## Performance

- **Tasks completed:** 3/3
- **Duration:** ~3 minutes
- **Deviations:** 1 (discovery — searchStore/filterStore are in shared package, not web stubs)

---

## Accomplishments

1. **store-map.md** — 325 lines covering all 6 Zustand stores. authStore fully documented (7 state fields, 6 actions, 7 selectors, state transitions). searchStore documented from `packages/shared/stores/searchStore.ts` (URL sync capable). filterStore documented (simple single-field store). requestStore documented with 3-step flow and deferral note for v4-06. transitionStore documented with state shape and FLIP deferral note for v4-04. profileStore fully documented (mock→API hydration pattern).

2. **injection-guide.md** — 220 lines. Decision tree for 7 task types. Per-task reference tables with required/optional files and loading order. Full file inventory table covering all 10 current spec files plus future screen/flow bundles. Loading priority rules. Context budget table with approximate line counts.

3. **CMN-01-header.md** — Fully rewritten. Was 375 lines (anti-features: implementation checklist, i18n, notification polling code snippets, unverified paths). Now 98 lines. Documents MobileHeader + DesktopHeader with verified paths, EARS requirements, nav items table, search trigger pattern.

4. **CMN-02-footer.md** — Fully rewritten. Was 293 lines. Now 81 lines. Documents DesktopFooter with verified path, section breakdown, mobile accordion behavior, newsletter prop pattern, EARS requirements.

5. **CMN-03-mobile-nav.md** — Fully rewritten. Was 137 lines. Now 84 lines. Documents NavBar + NavItem with verified paths, current 4-item nav table (Home, Explore, Request disabled, Profile disabled), EARS requirements, layout spacing notes.

---

## Task Commits

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create store-map.md | 5c71019 | specs/_shared/store-map.md |
| 2 | Create injection-guide.md | 4cfc28f | specs/_shared/injection-guide.md |
| 3 | Update CMN-01/02/03 specs | b73096b | specs/shared/components/CMN-01-header.md, CMN-02-footer.md, CMN-03-mobile-nav.md |

---

## Files Created

| File | Lines | Content |
|------|-------|---------|
| `specs/_shared/store-map.md` | 325 | Store→Screen Matrix + 6 store sections with state/actions/transitions/screen usage |
| `specs/_shared/injection-guide.md` | 220 | Decision tree + 7 task-type reference tables + file inventory + context budget |

## Files Modified

| File | Before | After | Change |
|------|--------|-------|--------|
| `specs/shared/components/CMN-01-header.md` | 375 lines | 98 lines | Full rewrite — EARS syntax, verified paths, removed anti-features |
| `specs/shared/components/CMN-02-footer.md` | 293 lines | 81 lines | Full rewrite — EARS syntax, verified paths, removed anti-features |
| `specs/shared/components/CMN-03-mobile-nav.md` | 137 lines | 84 lines | Full rewrite — EARS syntax, verified paths, removed anti-features |

---

## Decisions Made

| Decision | Rationale | Impact |
|----------|-----------|--------|
| Document shared package stores as source of truth | Web stubs are re-exports; actual implementation in packages/shared/stores/ | Store map accurately reflects where state lives |
| Defer requestStore step detail to v4-06 | STATE.md pending todo; risk of documenting incorrectly without full Creation-AI spec context | Clear deferral note in store-map; task unblocked |
| Defer transitionStore FLIP internals to v4-04 | STATE.md pending todo; useFlipTransition.ts needs verification | State shape documented; FLIP pattern deferred cleanly |
| Fully rewrite CMN specs (not append) | Old specs had anti-features violating v4.0 rules; 693 lines → 154 lines | Cleaner, compact specs that AI agents can load efficiently |

---

## Deviations from Plan

### Discovery — searchStore and filterStore implementations in shared package

**Found during:** Task 1 (reading store files)
**Issue:** Plan described searchStore and filterStore as web package files. Actual web files (`packages/web/lib/stores/searchStore.ts`, `filterStore.ts`) are 5–6 line re-export stubs. Real implementations are in `packages/shared/stores/`.
**Fix:** Read the shared package implementations and documented those as the source of truth. Web stub paths noted as the import path; shared package paths noted as the file location.
**Files modified:** None — store-map.md written correctly from the start.
**Classification:** Rule 3 (Blocking) — had to find actual implementations to document them accurately.

---

## Issues Encountered

None beyond the searchStore/filterStore discovery noted above.

---

## User Setup Required

None — documentation-only plan, no code changes, no environment setup needed.

---

## Next Phase Readiness

**v4-02 phase complete.** All 5 `specs/_shared/` files exist: component-registry.md, data-models.md, api-contracts.md, store-map.md, injection-guide.md.

**v4-03** (Flow Documents) can begin immediately. injection-guide.md defines the loading protocol for flow work.

**Pending todos carried forward (unchanged from v4-02-01):**
- Before v4-04: Verify `transitionStore` shape + `useFlipTransition.ts` (FLIP animation pattern) — now partially resolved (state shape documented); integration details remain
- Before v4-06: Verify `requestStore` step enum values + `POST /api/v1/posts/analyze` response shape
- Before v4-07: Verify `authStore` user/session type + auth-conditional rendering patterns

**Quality gates passed:**
- All 5 shared files exist in `specs/_shared/` (OK)
- Store map covers all 6 stores (OK)
- searchStore/filterStore verified in shared package (OK)
- CMN-01/02/03 reference verified design system paths (OK)
- All CMN specs use EARS syntax (OK)
- All CMN specs under 100 lines (98, 81, 84) (OK)
- CMN-03-modals.md and CMN-04-toasts.md not modified (OK)
- injection-guide.md has 7 task types with decision tree (OK)
- No anti-features in any document (OK)
