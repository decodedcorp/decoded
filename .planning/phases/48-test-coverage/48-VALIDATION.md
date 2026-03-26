---
phase: 48
slug: test-coverage
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-27
---

# Phase 48 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 4.1.1 + @playwright/test 1.58.1 |
| **Config file** | `packages/web/vitest.config.ts`, `packages/web/playwright.config.ts` |
| **Quick run command** | `cd packages/web && bunx vitest run --reporter=verbose` |
| **Full suite command** | `cd packages/web && bunx vitest run` |
| **Estimated runtime** | ~30 seconds (unit only, E2E deferred) |

---

## Sampling Rate

- **After every task commit:** `cd packages/web && bunx vitest run --reporter=verbose`
- **After every plan wave:** Full vitest suite
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | Status |
|---------|------|------|-------------|-----------|-------------------|--------|
| 48-01-T1 | 01 | 1 | REF-05 | vitest | `cd packages/web && bunx vitest run --reporter=verbose` | ⬜ pending |
| 48-01-T2 | 01 | 1 | REF-05 | grep | `grep -r "data-testid" packages/web/lib/components/ --include="*.tsx" -l \| wc -l` | ⬜ pending |
| 48-02-T1 | 02 | 1 | E2E-01..04 | grep | `ls packages/web/tests/e2e/*.spec.ts \| wc -l` (>= 4 files) | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

*Existing vitest + playwright infrastructure covers all phase requirements.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| E2E tests pass with dev server | E2E-01..04 | Requires running dev server (worktree constraint) | After merge to main: `cd packages/web && bunx playwright test` |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
