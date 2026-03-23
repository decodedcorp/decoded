---
gsd_state_version: 1.0
milestone: v6.0
milestone_name: Behavioral Intelligence & Dynamic UI
status: unknown
stopped_at: Completed 40-02-PLAN.md
last_updated: "2026-03-23T12:56:16.862Z"
progress:
  total_phases: 38
  completed_phases: 36
  total_plans: 84
  completed_plans: 83
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-23)

**Core value:** 완전한 사용자 경험 — 일관된 디자인 시스템과 실제 데이터
**Current focus:** Phase 41 — next phase of v9.0 API Generation

## Current Position

Phase: 40 (codegen-pipeline-and-custom-mutator) — COMPLETE
Plan: 2 of 2 (all plans done)

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
- [Phase 39]: zod pinned to ^3.25 (NOT v4) — Orval zod v4 compat bugs #2249/#2304 active
- [Phase 39]: httpClient: axios explicit in orval.config.ts — Orval 8 defaults to fetch without this setting
- [Phase 39]: input.target '../api-server/openapi.json' — Orval resolves paths relative to config file (packages/web/)
- [Phase 39]: OpenAPI 3.1.0 confirmed — Orval 8.5.3 handles natively, no preprocessing script needed
- [Phase 39]: 4 duplicate operationIds found (list_posts, list_badges, list_solutions, list_spots) — backend PR required before Phase 40 codegen; fix via explicit operation_id = 'admin_list_*' in utoipa annotations
- [Phase 39]: Backend local dev port is 8000 (not 3001 as documented); spec URL: http://localhost:8000/api-docs/openapi.json
- [Phase 40-codegen-pipeline-and-custom-mutator]: baseURL empty string in customInstance — OpenAPI paths include /api/v1/ prefix to prevent double-prefix
- [Phase 40-codegen-pipeline-and-custom-mutator]: hooks block is sibling of input/output in orval.config.ts — placing inside output causes silent failure
- [Phase 40]: Turbo task name must exactly match package script name — generate:api task name required (not generate) for Turborepo to dispatch correctly

### Blockers/Concerns

- **Phase 39 RESOLVED:** OpenAPI spec is 3.1.0 — Orval 8.5.3 handles natively, no preprocessing needed
- **Phase 39 RESOLVED:** No Handler/snake_case suffix issues found in operationIds
- **Phase 40 RESOLVED:** Duplicate operationIds fixed in backend (d694b9ac); codegen pipeline fully operational
- **v6.0 (paused)**: Privacy compliance — PIPA/GDPR disclosure required before behavioral tracking ships

### Pending Todos

**From v2-09-03 Visual QA:**

1. Quick task: Fix images page raw JSON error exposure (API error handling - major UX/security)

## Session Continuity

Last session: 2026-03-23T12:56:16.859Z
Stopped at: Completed 40-02-PLAN.md
Resume file: None

Next step: `/gsd:plan-phase 39`

---

_Created: 2026-02-05_
_Last updated: 2026-03-23 after v9.0 roadmap created (Phases 39-43)_
