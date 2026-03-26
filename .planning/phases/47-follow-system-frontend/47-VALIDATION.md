---
phase: 47
slug: follow-system-frontend
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-26
---

# Phase 47 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest / typecheck |
| **Config file** | `packages/web/vitest.config.ts` |
| **Quick run command** | `cd packages/web && bun run typecheck` |
| **Full suite command** | `cd packages/web && bun run typecheck` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd packages/web && bun run typecheck`
- **After every plan wave:** Run typecheck
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 47-01-01 | 01 | 1 | FLLW-04 | automated | `bun run generate:api` exit code | N/A | ⬜ pending |
| 47-01-02 | 01 | 1 | FLLW-05 | manual | Browser check FollowStats shows real data | N/A | ⬜ pending |

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| FollowStats shows real count on /profile | FLLW-05 | Requires live API + auth | Log in, go to /profile, verify follow counts |
| Public profile shows target user's follow count | FLLW-05 | Requires live API | Navigate to /profile/{userId}, verify counts |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
