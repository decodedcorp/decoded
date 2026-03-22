---
phase: v4-03-flow-documents
plan: 01
subsystem: docs
tags: [flows, navigation, user-journey, mermaid, spec, vton-draft]

requires:
  - phase: v4-02-shared-foundation
    provides: store-map.md, api-contracts.md, component-registry.md — all cross-referenced from flow documents

provides:
  - FLW-01: Content discovery navigation contract (Home → Search/Explore/Feed/Images → Detail)
  - FLW-02: Detail view interaction contract (Image/Post Detail → Spot → Solution → Shopping)
  - FLW-03: Content creation step-by-step flow (Upload → AI Detect → Spot Edit → Solution → Submit)
  - FLW-04: User authentication flow (Login → OAuth → Profile → Activity → Earnings)
  - FLW-05: VTON fitting flow DRAFT (Pick&Drop → Chic Blur → Blueprint → Magic Flip → Morphing Loop)

affects:
  - v4-04-detail-view (references FLW-02 for screen context)
  - v4-05-discovery (references FLW-01 for screen context)
  - v4-06-creation-ai (references FLW-03 for screen context)
  - v4-07-user-system (references FLW-04 for screen context)

tech-stack:
  added: []
  patterns:
    - "Flow documents use Mermaid diagram + transition table format (established for v4-03 phase)"
    - "Flow boundary: what/when (navigation contracts) — how (UI/component behavior) is screen spec territory"
    - "DRAFT flow pattern: top-of-file status banner + explicit approval gate section"

key-files:
  created:
    - specs/flows/FLW-01-discovery.md
    - specs/flows/FLW-02-detail.md
    - specs/flows/FLW-03-creation.md
    - specs/flows/FLW-04-user.md
    - specs/flows/FLW-05-vton.md
  modified: []

key-decisions:
  - "Mermaid diagram type chosen per flow: flowchart for navigation-heavy (FLW-01, FLW-03), stateDiagram for interaction-state-heavy (FLW-02, FLW-04)"
  - "FLW-02 treated as interaction-state flow (within single page), not navigation flow"
  - "Transition tables use 5 columns: From | Trigger | To | Store Changes | Data Fetched"
  - "FLW-05 kept under 150 lines as a high-level outline only — no API or store references (not yet implemented)"

patterns-established:
  - "Flow files: Mermaid diagram at top, transition table below, store/API references at bottom"
  - "Cross-references use relative path links (FLW-02-detail.md) not absolute"
  - "requestStore step flow documented inline in FLW-03 as a progression block"

duration: 3min
completed: 2026-02-19
---

# Phase v4-03 Plan 01: Flow Documents Summary

**5 user journey flow contracts written (FLW-01 through FLW-05) establishing navigation boundaries for all screen specs in v4-04 through v4-07**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-02-19T12:34:18Z
- **Completed:** 2026-02-19T12:37:11Z
- **Tasks:** 2
- **Files modified:** 5 created

## Accomplishments

- FLW-01 through FLW-04: Finalized flow documents with Mermaid diagrams and transition tables covering all major user journeys
- FLW-05: DRAFT VTON flow with explicit status banner and approval gate, outlining 5-stage fitting sequence
- All files cross-reference each other at journey boundaries and reference `_shared/` files for store/API details

## Task Commits

Each task was committed atomically:

1. **Task 1: Write FLW-01 (Discovery) and FLW-02 (Detail) flow documents** - `544b04b` (docs)
2. **Task 2: Write FLW-03 (Creation), FLW-04 (User), and FLW-05 (VTON DRAFT) flow documents** - `b7abc60` (docs)

**Plan metadata:** (this commit)

## Files Created/Modified

- `specs/flows/FLW-01-discovery.md` — Home → Search/Explore/Feed/Images → Detail navigation contract (72 lines)
- `specs/flows/FLW-02-detail.md` — Image/Post Detail interaction state flow with FLIP animation context (85 lines)
- `specs/flows/FLW-03-creation.md` — Upload → AI Detect → Spot Edit → Solution → Submit with requestStore step flow (88 lines)
- `specs/flows/FLW-04-user.md` — OAuth login → Profile → Activity with authStore transitions and auth-conditional table (105 lines)
- `specs/flows/FLW-05-vton.md` — DRAFT VTON fitting flow outline (73 lines)

## Decisions Made

- **Mermaid diagram type varies by flow nature:** Navigation-heavy flows (FLW-01, FLW-03) use `flowchart TD`; interaction-state-heavy flows (FLW-02, FLW-04) use `stateDiagram-v2` for clearer state progression
- **FLW-02 framed as interaction-state flow:** The detail view is largely a single page with internal state changes (spot selection, solution panel) rather than route navigation — stateDiagram captures this better
- **Transition tables use 5 columns:** From | Trigger | To | Store Changes | Data/API — provides maximum useful context per row without duplication
- **FLW-05 kept minimal:** No codebase references (no implementation exists), no API specs — purely a conceptual outline at ~73 lines

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- v4-04 (Detail View screen specs) can now reference FLW-02 for cross-screen navigation context
- v4-05 (Discovery screen specs) can now reference FLW-01
- v4-06 (Creation-AI screen specs) can now reference FLW-03
- v4-07 (User System screen specs) can now reference FLW-04
- FLW-05 (VTON) remains DRAFT — screen specs for VTON must not be written until approval

---
*Phase: v4-03-flow-documents*
*Completed: 2026-02-19*
