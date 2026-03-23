---
gsd_state_version: 1.0
milestone: v9.0
milestone_name: Type-Safe API Generation
status: ready_to_plan
stopped_at: Roadmap created — Phase 39 ready to plan
last_updated: "2026-03-23T18:30:00.000Z"
progress:
  total_phases: 5
  completed_phases: 0
  total_plans: 0
  completed_plans: 0
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-23)

**Core value:** 완전한 사용자 경험 — 일관된 디자인 시스템과 실제 데이터
**Current focus:** v9.0 Type-Safe API Generation — Phase 39: Setup and Spec Validation

## Current Position

Phase: 39 of 43 (Setup and Spec Validation)
Plan: — (not yet planned)
Status: Ready to plan
Last activity: 2026-03-23 — Roadmap created, 28 requirements mapped to 5 phases

Progress: [░░░░░░░░░░] 0%

## Milestone Summary

| Milestone                    | Phases | Plans | Status     | Date       |
| ---------------------------- | ------ | ----- | ---------- | ---------- |
| v1.0 Documentation           | 5      | 5     | Shipped    | 2026-01-29 |
| v1.1 API Integration         | 5      | 13    | Shipped    | 2026-01-29 |
| v2.0 Design Overhaul         | 9      | 26    | Shipped    | 2026-02-05 |
| v2.1 Design System           | 6      | 14    | Shipped    | 2026-02-06 |
| v3.0 Admin Panel             | 6      | 12    | Shipped    | 2026-02-19 |
| v4.0 Spec Overhaul           | 9      | 13    | Shipped    | 2026-02-20 |
| v5.0 AI Magazine             | 3      | 11    | Shipped    | 2026-03-12 |
| v6.0 Behavioral Intelligence | 3      | 10    | Paused     | -          |
| v7.0 Sticker Canvas          | 3      | 8     | Paused     | -          |
| v8.0 Monorepo & Bun          | 4      | 3     | Shipped    | 2026-03-23 |
| **v9.0 API Generation**      | **5**  | **-** | **Active** | -          |

## Accumulated Context

### Decisions

Recent decisions from v8.0:
- [v8.0]: bun hoisted strategy with bunfig.toml
- [v8.0]: Backend stays OUTSIDE bun workspaces (Cargo independent)
- [v8.0]: Root workspaces explicit list (not glob) to prevent backend inclusion
- [v8.0]: Fragment wrapper for ImageDetailContent (TS JSX children inference limit)
- [v8.0]: proxy.ts replaces middleware.ts (Next.js 16 convention)

v9.0 key constraints (from research):
- [v9.0]: Use zod v3 (not v4) — Orval Zod v4 compat bugs #2249/#2304 active
- [v9.0]: mutator baseURL must be empty string — OpenAPI paths already include /api/v1/
- [v9.0]: Upload endpoints excluded from Orval permanently (binary/multipart not representable)
- [v9.0]: Never put generated hooks in packages/shared (No QueryClient set error — TanStack #3595)
- [v9.0]: Migrate per-endpoint atomically — no dual hooks on same endpoint simultaneously

### Blockers/Concerns

- **Phase 39 (potentially blocking):** OpenAPI spec may be 3.1 (utoipa 4.x) which requires preprocessing before Orval can generate valid Zod — must inspect live spec first
- **Phase 39 (potentially blocking):** operationId values may have Handler/snake_case suffixes — may require backend PR before codegen is usable
- **v6.0 (paused)**: Privacy compliance — PIPA/GDPR disclosure required before behavioral tracking ships

### Pending Todos

**From v2-09-03 Visual QA:**
1. Quick task: Fix images page raw JSON error exposure (API error handling - major UX/security)

## Session Continuity

Last session: 2026-03-23T18:30:00.000Z
Stopped at: Roadmap created — 5 phases (39-43), 28/28 requirements mapped
Resume file: None

Next step: `/gsd:plan-phase 39`

---

_Created: 2026-02-05_
_Last updated: 2026-03-23 after v9.0 roadmap created (Phases 39-43)_
