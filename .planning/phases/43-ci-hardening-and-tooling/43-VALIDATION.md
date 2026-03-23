---
phase: 43
slug: ci-hardening-and-tooling
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-24
---

# Phase 43 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (to be installed in Wave 0) |
| **Config file** | packages/web/vitest.config.ts (Wave 0 installs) |
| **Quick run command** | `cd packages/web && bun run test -- --run` |
| **Full suite command** | `cd packages/web && bun run test -- --run` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd packages/web && bun run test -- --run`
- **After every plan wave:** Run `cd packages/web && bun run test -- --run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 43-01-01 | 01 | 1 | CI-03 | manual | `git ls-files packages/web/lib/api/generated/ \| grep -v .gitkeep` | N/A | ⬜ pending |
| 43-01-02 | 01 | 1 | CI-01, CI-02 | manual | `bash packages/web/scripts/pre-push.sh` | N/A | ⬜ pending |
| 43-02-01 | 02 | 1 | CI-04 | manual | doc review | N/A | ⬜ pending |
| 43-02-02 | 02 | 1 | CI-05 | manual | doc review | N/A | ⬜ pending |
| 43-03-01 | 03 | 2 | TEST-01 | unit | `cd packages/web && bun run test -- --run` | ❌ W0 | ⬜ pending |
| 43-03-02 | 03 | 2 | TOOL-01 | manual | `grep 'generated' CLAUDE.md` | N/A | ⬜ pending |
| 43-03-03 | 03 | 2 | TOOL-02, TOOL-03 | manual | doc review | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `vitest` + `@vitejs/plugin-react` — install test framework (no test runner currently)
- [ ] `packages/web/vitest.config.ts` — config with path aliases matching tsconfig
- [ ] `packages/web/tests/zod-schema.test.ts` — stub for Zod schema validation (TEST-01)

*Vitest is needed because no unit test runner exists; only Playwright E2E tests exist.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| .gitignore blocks generated files | CI-03 | Git behavior not testable in unit tests | `git add packages/web/lib/api/generated/test.ts && git status` should show nothing |
| pre-push.sh blocks drift | CI-01, CI-02 | Shell script execution | Run `bash packages/web/scripts/pre-push.sh` after modifying a generated file |
| Documentation completeness | CI-04, CI-05, TOOL-02, TOOL-03 | Prose quality | Review docs for accuracy and completeness |
| CLAUDE.md generated file protection | TOOL-01 | Agent behavior | Verify CLAUDE.md contains generated file rules |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
