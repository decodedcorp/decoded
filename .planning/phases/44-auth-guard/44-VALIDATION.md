---
phase: 44
slug: auth-guard
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-26
---

# Phase 44 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Playwright (E2E) + manual browser verification |
| **Config file** | `packages/web/playwright.config.ts` |
| **Quick run command** | `cd packages/web && bun run build` |
| **Full suite command** | `cd packages/web && bunx playwright test --grep auth-guard` |
| **Estimated runtime** | ~15 seconds (build) / ~30 seconds (E2E) |

---

## Sampling Rate

- **After every task commit:** Run `cd packages/web && bun run build`
- **After every plan wave:** Run `cd packages/web && bunx playwright test --grep auth-guard`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 44-01-01 | 01 | 1 | AUTH-01 | E2E | `bunx playwright test auth-guard-redirect` | ❌ W0 | ⬜ pending |
| 44-01-02 | 01 | 1 | AUTH-02 | E2E | `bunx playwright test auth-guard-401` | ❌ W0 | ⬜ pending |
| 44-01-03 | 01 | 1 | AUTH-01 | E2E | `bunx playwright test auth-guard-post-login` | ❌ W0 | ⬜ pending |
| 44-01-04 | 01 | 1 | AUTH-01, AUTH-02 | build | `bun run build` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `packages/web/tests/e2e/auth-guard.spec.ts` — stubs for AUTH-01, AUTH-02
- [ ] Playwright config updated if needed for auth-guard grep pattern

*Existing Playwright infrastructure covers framework needs.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| OAuth redirect flow | AUTH-01 | Requires real Supabase OAuth session | 1. Log out 2. Navigate to /profile 3. Complete OAuth 4. Verify redirect to /profile |
| SessionStorage persistence | AUTH-01 | OAuth callback crosses origins | 1. Click OAuth login from /profile redirect 2. Verify sessionStorage has redirect URL 3. Complete login, verify redirect |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
