---
gsd_state_version: 1.0
milestone: v6.0
milestone_name: Behavioral Intelligence & Dynamic UI
status: unknown
stopped_at: Completed m10-01-01-PLAN.md
last_updated: "2026-03-22T13:35:27.878Z"
progress:
  total_phases: 36
  completed_phases: 34
  total_plans: 80
  completed_plans: 79
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-22)

**Core value:** 완전한 사용자 경험 — 일관된 디자인 시스템과 실제 데이터
**Current focus:** Phase m10-01 — Package Manager Migration

## Current Position

Phase: m10-01 (Package Manager Migration) — EXECUTING
Plan: 1 of 2

## Milestone Summary

| Milestone                    | Phases | Plans   | Status     | Date       |
| ---------------------------- | ------ | ------- | ---------- | ---------- |
| v1.0 Documentation           | 5      | 5       | Shipped    | 2026-01-29 |
| v1.1 API Integration         | 5      | 13      | Shipped    | 2026-01-29 |
| v2.0 Design Overhaul         | 9      | 26      | Shipped    | 2026-02-05 |
| v2.1 Design System           | 6      | 14      | Shipped    | 2026-02-06 |
| v3.0 Admin Panel             | 6      | 12      | Shipped    | 2026-02-19 |
| v4.0 Spec Overhaul           | 9      | 13      | Shipped    | 2026-02-20 |
| v5.0 AI Magazine             | 3      | 11      | Shipped    | 2026-03-12 |
| v6.0 Behavioral Intelligence | 3      | 10      | Paused     | -          |
| v7.0 Sticker Canvas          | 3      | 8       | Paused     | -          |
| **v8.0 Monorepo & Bun**      | **4**  | **TBD** | **Active** | -          |

## Accumulated Context

### Decisions

Recent decisions affecting v8.0:

- [v8.0 research]: Yarn 4 Berry lockfile has no direct migration path — use pnpm as intermediary (`pnpm import` then `bun install`)
- [v8.0 research]: `turbo prune --docker` is broken with bun (issues #10782, #11007) — use full COPY pattern in Dockerfiles
- [v8.0 research]: Backend (packages/backend) must stay OUTSIDE bun workspaces array — thin package.json wrapper for Turborepo only
- [v8.0 research]: Root workspaces must be explicit list, NOT `packages/*` glob — prevents accidental backend inclusion
- [v8.0 research]: GSAP Club private registry requires project-level `bunfig.toml` fix (bun bug #9804)
- [v8.0 research]: git subtree squash strategy must be consistent — pick one and never mix
- [Phase m10-01]: bun hoisted strategy with publicHoistPattern=[*] to replicate Yarn 4 node-modules behavior
- [Phase m10-01]: React version split is correct: web@18.3.1 nested, mobile@19.1.0 nested, root hoists 19.1.0

### Pending Todos

**From v2-09-03 Visual QA:**

1. Quick task: Fix images page raw JSON error exposure (API error handling - major UX/security)

### Blockers/Concerns

- **v8.0 m10-01**: GSAP Club private registry auth breaks under bun (bun bug #9804) — must verify `bunfig.toml` fix before phase complete
- **v8.0 m10-01**: Version drift risk after pnpm intermediary migration — manual diff of key package versions required
- **v6.0 (paused)**: Privacy compliance — PIPA/GDPR disclosure required before behavioral tracking ships

## Session Continuity

Last session: 2026-03-22T13:35:27.875Z
Stopped at: Completed m10-01-01-PLAN.md
Resume file: None

---

_Created: 2026-02-05_
_Last updated: 2026-03-22 after v8.0 roadmap creation_
