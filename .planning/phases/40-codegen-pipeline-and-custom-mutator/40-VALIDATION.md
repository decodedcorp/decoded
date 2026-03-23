---
phase: 40
slug: codegen-pipeline-and-custom-mutator
status: draft
nyquist_compliant: false
wave_0_complete: false
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

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 40-01-01 | 01 | 1 | INFRA-02 | unit + typecheck | `bun run typecheck` | ❌ W0 | ⬜ pending |
| 40-02-01 | 02 | 1 | INFRA-04, INFRA-05 | codegen + typecheck | `bun run generate:api && bun run typecheck` | ❌ W0 | ⬜ pending |
| 40-03-01 | 03 | 2 | INFRA-03, SPEC-04 | pipeline + smoke | `turbo generate && bun run typecheck` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `packages/web/lib/api/generated/` — directory created by codegen (Plan 40-02 output)
- [ ] `packages/web/lib/api/mutator.ts` — custom mutator file (Plan 40-01 output)

*Existing vitest + typecheck infrastructure covers validation needs.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Double-prefix URL check | INFRA-02 | Network tab inspection | Start dev server, trigger API call, verify URL has single `/api/v1/` prefix |
| JWT token presence | INFRA-02 | Requires auth session | Login to app, trigger API call, check Authorization header in Network tab |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
