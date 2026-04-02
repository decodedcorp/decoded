---
phase: 45
slug: public-user-profile-route
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-26
---

# Phase 45 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (existing project setup) |
| **Config file** | `packages/web/vitest.config.ts` |
| **Quick run command** | `cd packages/web && bun run test --run` |
| **Full suite command** | `cd packages/web && bun run test --run` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd packages/web && bun run test --run`
- **After every plan wave:** Run `cd packages/web && bun run test --run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 45-01-01 | 01 | 1 | ROUTE-01 | manual | Browser check `/profile/{userId}` renders | N/A | ⬜ pending |
| 45-01-02 | 01 | 1 | ROUTE-02 | manual | Browser check private items hidden on public profile | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. This phase is primarily UI routing and conditional rendering — automated unit tests would test implementation details rather than behavior.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Public profile renders with avatar, name, bio, stats | ROUTE-01 | Visual UI rendering | Navigate to `/profile/{validUserId}`, verify profile header, bio, and stats display |
| Private items hidden on other user's profile | ROUTE-02 | Conditional rendering requires auth context | Log in as user A, navigate to `/profile/{userB}`, verify Saved tab, Ink card, edit button are hidden |
| Own userId redirects to /profile | ROUTE-01 | Redirect behavior | Log in, navigate to `/profile/{ownId}`, verify redirect to `/profile` |
| Invalid userId shows 404 UI | ROUTE-01 | Error state rendering | Navigate to `/profile/nonexistent-id`, verify 404 UI displays |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
