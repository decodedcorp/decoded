---
phase: m8-01
slug: event-tracking-infrastructure
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-12
---

# Phase m8-01 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Playwright (e2e) — no unit test framework detected |
| **Config file** | `packages/web/playwright.config.ts` |
| **Quick run command** | `cd packages/web && npx playwright test --project=chromium` |
| **Full suite command** | `cd packages/web && npx playwright test` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Dev console verification (NODE_ENV=development logging)
- **After every plan wave:** Supabase dashboard — verify `user_events` rows exist after manual interaction
- **Before `/gsd:verify-work`:** CLEAN-01 Playwright test green + manual smoke of all 4 TRACK requirements
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| m8-01-01-01 | 01 | 1 | TRACK-01 | manual smoke | Dev console + Supabase table | N/A | ⬜ pending |
| m8-01-02-01 | 02 | 1 | TRACK-04 | manual smoke | Dev console batch logs | N/A | ⬜ pending |
| m8-01-03-01 | 03 | 2 | TRACK-01 | manual smoke | Click event in dev console | N/A | ⬜ pending |
| m8-01-03-02 | 03 | 2 | TRACK-02 | manual smoke | Hover 3s + dev console | N/A | ⬜ pending |
| m8-01-03-03 | 03 | 2 | TRACK-03 | manual smoke | Scroll page + dev console | N/A | ⬜ pending |
| m8-01-04-01 | 04 | 1 | CLEAN-01 | e2e | `cd packages/web && npx playwright test --grep "DataSourcesCard"` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `packages/web/tests/profile-cleanup.spec.ts` — Playwright test asserting DataSourcesCard is not rendered on `/profile` page (covers CLEAN-01)

*TRACK-01 through TRACK-04 rely on dev-mode console logging and manual Supabase table inspection. Acceptable given fire-and-forget nature of analytics events.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Click events recorded in Supabase | TRACK-01 | No unit test framework; fire-and-forget analytics | 1. Open dev server 2. Click a post 3. Check dev console for `[Track] post_click` log 4. Check Supabase `user_events` table |
| 3s dwell event fires | TRACK-02 | IntersectionObserver hard to simulate in e2e | 1. Open feed page 2. Hover/view a card for 3+ seconds 3. Check dev console for `[Track] dwell_time` log |
| Scroll milestones fire once each | TRACK-03 | Scroll behavior + dedup needs visual verification | 1. Open any page 2. Scroll to bottom 3. Verify 4 events (25/50/75/100%) in dev console 4. Scroll up and down again — no duplicates |
| UI not blocked during batch flush | TRACK-04 | Performance perception is manual | 1. Interact rapidly (clicks, scrolls) 2. Verify no jank/stutter 3. Check dev console shows batch flush at 20 events or 30s timer |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
