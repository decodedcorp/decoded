---
phase: v4-01-archive-foundation
plan: 02
subsystem: documentation
tags: [specs, templates, EARS, mobile-first, flow-spec, screen-spec, AI-context]

requires: []

provides:
  - Screen spec template with EARS syntax, mobile-first layout, component map with verified file paths
  - Flow spec template with FLW-* ID format, state transitions, screen sequence diagram
  - specs/README.md rewritten for v4.0 with new directory structure, ID scheme, format rules, injection guide

affects:
  - v4-02-shared-foundation
  - v4-03-flow-documents
  - v4-04-screen-specs-detail
  - v4-05-screen-specs-discovery
  - v4-06-screen-specs-creation
  - v4-07-screen-specs-user

tech-stack:
  added: []
  patterns:
    - "EARS syntax for requirements: 'When [trigger], the system shall [behavior]'"
    - "Mobile-first spec layout: mobile wireframe primary, desktop is adaptation"
    - "200-line spec target (300-line max with justification)"
    - "Component Map table with verified filesystem paths"
    - "FLW-NN ID format for flow documents"
    - "SCR-{BUNDLE}-NN ID format for screen documents"

key-files:
  created:
    - specs/shared/templates/screen-spec-template.md
    - specs/shared/templates/flow-spec-template.md
  modified:
    - specs/README.md

key-decisions:
  - "EARS syntax adopted for all requirements in screen specs (not free-form descriptions)"
  - "Mobile wireframe is the primary layout; desktop is documented as adaptation delta"
  - "Template line limit <80 enforced (template itself); real specs target 200 lines"
  - "Anti-features explicitly excluded: i18n sections, version history, copied TS types, implementation checklists, test scenario tables"
  - "AI injection guide included in README as quick-reference table, full guide deferred to _shared/injection-guide.md (v4-02)"

patterns-established:
  - "Screen spec template: Component Map -> Layout -> Requirements -> Navigation -> Error States -> Animations"
  - "Flow spec template: Journey -> Screen Sequence -> Steps -> State Transitions -> Shared Data -> Error Recovery"
  - "All component file paths format: packages/web/lib/components/..."
  - "All store references format: packages/web/lib/stores/[store].ts"

duration: 3min
completed: 2026-02-19
---

# Phase v4-01 Plan 02: Spec Templates & README Summary

**v4.0 screen and flow spec templates with EARS syntax, mobile-first wireframes, and component path maps — plus rewritten specs/README.md with new directory structure, ID scheme, format rules, and AI injection guide**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-19T10:59:10Z
- **Completed:** 2026-02-19T11:02:07Z
- **Tasks:** 2
- **Files modified:** 3 (2 created, 1 rewritten)

## Accomplishments

- Created `specs/shared/templates/screen-spec-template.md`: 79 lines, EARS syntax, mobile-first layout with wireframe, component map table with verified file path column, error & empty states, animations section — no anti-features
- Created `specs/shared/templates/flow-spec-template.md`: 69 lines, FLW-NN ID format, screen sequence diagram, per-step state/data documentation, state transitions table, error recovery table
- Rewrote `specs/README.md` from v2.1.0 Korean spec index to v4.0 English AI-ready reference: new directory structure, ID scheme, spec format rules, AI agent injection guide, template links (91 lines, under 120 limit)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create new screen spec template** - `ca117b1` (docs)
2. **Task 2: Create flow spec template + rewrite README** - `80978bc` (docs)

**Plan metadata:** (created in this summary commit)

## Files Created/Modified

- `specs/shared/templates/screen-spec-template.md` - New v4.0 screen spec template (79 lines, EARS, mobile-first, no anti-features)
- `specs/shared/templates/flow-spec-template.md` - New v4.0 flow spec template (69 lines, FLW-* format, state transitions)
- `specs/README.md` - Rewritten for v4.0 with new structure, ID scheme, format rules, injection guide (91 lines)

## Decisions Made

- **EARS syntax** selected as the requirement format standard (over free-form descriptions) — provides consistent, unambiguous, AI-parseable requirements
- **Mobile-first** ordering enforced in template structure — mobile wireframe is the canonical design; desktop documents only the delta
- **Template line limit** set at <80 for the template file itself to model the compactness expected in real specs
- **Anti-features list** explicitly documented in README format rules and excluded from template — prevents pattern regression in future spec writing
- **AI injection guide** included as quick-reference table in README; full guide deferred to `_shared/injection-guide.md` to be created in v4-02

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- v4-02 (Shared Foundation) can proceed: templates are established for reference
- All spec writers must verify component file paths against filesystem before publishing (documented in template and README)
- `_shared/injection-guide.md` is the first deliverable needed in v4-02 to complete the injection guide referenced in README

---
*Phase: v4-01-archive-foundation*
*Completed: 2026-02-19*
