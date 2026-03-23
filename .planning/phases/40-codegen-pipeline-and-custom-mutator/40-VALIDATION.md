---
phase: 40
slug: codegen-pipeline-and-custom-mutator
status: approved
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-23
---

# Phase 40 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (existing in packages/web) |
| **Config file** | `packages/web/vitest.config.ts` |
| **Quick run command** | `cd packages/web && bun run typecheck` |
| **Full suite command** | `cd packages/web && bun run typecheck && bun run test` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd packages/web && bun run typecheck`
- **After every plan wave:** Run `cd packages/web && bun run typecheck && bun run test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | Status |
|---------|------|------|-------------|-----------|-------------------|--------|
| 40-01-T1 | 01 | 1 | INFRA-02 | file + typecheck | `test -f packages/web/lib/api/mutator/custom-instance.ts && cd packages/web && bun run typecheck` | pending |
| 40-01-T2 | 01 | 1 | INFRA-04, INFRA-05 | config validation | `grep -q "afterAllFilesWrite" packages/web/orval.config.ts && grep -q "fileExtension.*\.zod\.ts" packages/web/orval.config.ts` | pending |
| 40-02-T1 | 02 | 2 | INFRA-03 | script + config | `grep -q '"generate:api"' packages/web/package.json && grep -q '"generate:api"' package.json && grep -q '"generate"' turbo.json` | pending |
| 40-02-T2 | 02 | 2 | SPEC-04 | pipeline + smoke | `cd packages/web && bun run generate:api && bun run typecheck && test "$(grep -rc 'api/v1/api/v1' lib/api/generated/ 2>/dev/null \| awk -F: '{s+=$2}END{print s}')" = "0"` | pending |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

All Wave 0 artifacts are created by plan tasks — no external pre-requisites:

- [x] `packages/web/lib/api/mutator/custom-instance.ts` — created by 40-01-T1
- [x] `packages/web/orval.config.ts` hooks block — created by 40-01-T2
- [x] `packages/web/lib/api/generated/` — populated by 40-02-T2 (orval generate)

*Existing vitest + typecheck infrastructure covers validation needs. No additional test scaffolding required.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Double-prefix URL check | INFRA-02 | Network tab inspection | Start dev server, trigger API call, verify URL has single `/api/v1/` prefix |
| JWT token presence | INFRA-02 | Requires auth session | Login to app, trigger API call, check Authorization header in Network tab |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify commands
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 30s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved
