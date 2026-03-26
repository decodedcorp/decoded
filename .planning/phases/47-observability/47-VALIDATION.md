---
phase: 47
slug: observability
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
| **Framework** | grep + cargo check + config validation |
| **Config file** | N/A (Sentry config files) |
| **Quick run command** | `grep -r "Sentry.init\|sentry::init\|sentry_sdk.init" packages/` |
| **Full suite command** | `cd packages/web && bunx next build 2>&1 | head -20` |
| **Estimated runtime** | ~60 seconds |

---

## Sampling Rate

- **After every task commit:** grep for Sentry init calls
- **After every plan wave:** Build check (Next.js)
- **Before `/gsd:verify-work`:** Full build must succeed
- **Max feedback latency:** 60 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | Status |
|---------|------|------|-------------|-----------|-------------------|--------|
| 47-01-T1 | 01 | 1 | OBS-01 | grep | `grep -r "withSentryConfig" packages/web/next.config.* && grep -r "Sentry.init" packages/web/sentry.*.ts` | ⬜ pending |
| 47-01-T2 | 01 | 1 | OBS-02 | grep | `grep -r "reportWebVitals\|web-vitals\|@sentry/nextjs" packages/web/` | ⬜ pending |
| 47-02-T1 | 02 | 1 | OBS-01 | grep | `grep -r "sentry::init\|sentry_tracing" packages/api-server/src/` | ⬜ pending |
| 47-02-T2 | 02 | 1 | OBS-01 | grep | `grep -r "sentry_sdk.init" packages/ai-server/` | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

*Existing infrastructure covers all phase requirements.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Sentry receives events | OBS-01 | Requires Sentry DSN + running services | Trigger error, check Sentry dashboard |
| Web Vitals appear in Sentry | OBS-02 | Requires browser + Sentry dashboard | Load page, check Performance tab |
| Cross-service trace propagation | OBS-01 | Requires all 3 services running | Trigger AI analyze → check trace spans |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
