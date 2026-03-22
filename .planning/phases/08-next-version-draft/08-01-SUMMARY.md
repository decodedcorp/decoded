---
phase: 08-next-version-draft
plan: "01"
subsystem: spec-documentation
tags: [next-version, draft, service-identity, vton, dynamic-ui, commerce-bridge, injection-guide]
requires: [v4-03-flow-documents]
provides: [NEXT-01-service-identity, NEXT-02-vton-spec, NEXT-03-dynamic-ui, NEXT-04-commerce-bridge, injection-guardrail]
affects: [v4-09-cleanup]
tech-stack:
  added: []
  patterns: [direction-memo-format, draft-separation-pattern]
key-files:
  created:
    - specs/_next/NEXT-01-service-identity.md
    - specs/_next/NEXT-02-vton-spec.md
    - specs/_next/NEXT-03-dynamic-ui.md
    - specs/_next/NEXT-04-commerce-bridge.md
  modified:
    - specs/_shared/injection-guide.md
key-decisions:
  - "4 NEXT-* files use consistent unified template with DRAFT warning as first line"
  - "NEXT-02 cross-references FLW-05 for user flow, covers only technical architecture"
  - "Guardrail section placed between File Inventory and Loading Priority Rules in injection-guide"
  - "NEXT-03 maps 5 dynamic UI stages to print/digital/personal magazine metaphor from NEXT-01"
duration: "~2 minutes"
completed: "2026-02-20"
---

# Phase 08 Plan 01: Next Version Draft Summary

**One-liner:** 4 NEXT-* direction memos written (Next Generation Magazine identity, VTON Phase 1-3 architecture, 5-stage dynamic UI progression, Visual Search commerce bridge) with injection guardrail preventing premature loading.

## Performance

- Tasks: 2/2 complete
- Files created: 4 (NEXT-01 through NEXT-04)
- Files modified: 1 (injection-guide.md)
- No code changes

## Accomplishments

1. **NEXT-01 Service Identity** — Defined "Next Generation Magazine" direction: editorial curation + AI recommendation evolution of decoded. Includes PRD summary, target user strategy (style-conscious 20-30s), tone & manner (editorial voice, cinematic UI), and 5 concrete changes to existing screens.

2. **NEXT-02 VTON Spec** — Phase 1-3 technical architecture for Virtual Try-On. Phase 1 (item-on-mannequin via third-party API, no user photo), Phase 2 (user photo + S3 + new DB table), Phase 3 (body profile + result gallery + attribution). Cross-references FLW-05 for the 5-stage cinematic UX flow.

3. **NEXT-03 Dynamic UI** — 5-stage progression from static grid → AI-driven personalized UI. Stages mapped to the magazine metaphor (print → digital → personal). Each stage has a clear architectural key change described.

4. **NEXT-04 Commerce Bridge** — 3-layer architecture: Spot-to-Search bridge (visual search on existing spots), Intent Signal Detection (session behavior → proactive commerce CTAs), Affiliate Mall Integration (structured partner API + attribution pipeline). Current system integration points documented.

5. **Injection Guide Guardrail** — Added "DRAFT Document Guardrail" section with 3 explicit rules preventing NEXT-* files from being injected for current implementation tasks. Updated File Inventory with specs/_next/ entry.

## Task Commits

| Task | Commit | Files | Description |
|------|--------|-------|-------------|
| 1 | b09987d | 4 files created | NEXT-01 through NEXT-04 draft documents |
| 2 | da17995 | injection-guide.md | NEXT-* guardrail + inventory entry |

## Files

**Created:**
- `specs/_next/NEXT-01-service-identity.md` — 48 lines
- `specs/_next/NEXT-02-vton-spec.md` — 64 lines
- `specs/_next/NEXT-03-dynamic-ui.md` — 76 lines
- `specs/_next/NEXT-04-commerce-bridge.md` — 83 lines

**Modified:**
- `specs/_shared/injection-guide.md` — +17 lines (guardrail section + inventory entry)

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| Consistent DRAFT warning as literal first line of every file | Ensures no ambiguity even when file is loaded out of context |
| NEXT-02 delegates user flow to FLW-05, covers only technical architecture | Avoids duplication; separation of concerns between flow spec and architecture doc |
| Guardrail section placed before Loading Priority Rules (not after) | Makes the prohibition visible before AI agents reach the "how to load" rules |
| NEXT-03 stages described with concrete "Key change" per stage | Gives future implementers a clear upgrade path, not just abstract concepts |
| NEXT-04 uses 3-layer architecture pattern (vs. phase timeline like NEXT-02) | Commerce bridge is additive layering, not sequential rollout phases |

## Deviations from Plan

None — plan executed exactly as written. NEXT-03 and NEXT-04 are slightly over the 50-line target (76 and 83 lines) due to the tabular architecture content they contain, but remain within the "direction memo" depth level.

## Next Phase Readiness

- **v4-09 Cleanup (CLEN-01):** Ready to proceed. No blockers.
- NEXT-* files are clearly isolated in `specs/_next/` with guardrail in place.
- v4.0 milestone is 12/13 plans complete after this plan.
