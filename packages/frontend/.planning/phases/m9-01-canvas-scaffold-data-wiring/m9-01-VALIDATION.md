---
phase: m9-01
slug: canvas-scaffold-data-wiring
status: draft
nyquist_compliant: false
nyquist_opt_out: true
nyquist_opt_out_reason: "Lab/experimental page (/lab/main-d) — visual verification via human checkpoint is the primary validation method. tsc type-checking covers compile-time correctness. Full Playwright test coverage is not required for lab features."
wave_0_complete: false
created: 2026-03-19
---

# Phase m9-01 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property               | Value                               |
| ---------------------- | ----------------------------------- |
| **Framework**          | Playwright 1.58.1 (visual QA)       |
| **Config file**        | `packages/web/playwright.config.ts` |
| **Quick run command**  | `yarn test:visual --grep "main-d"`  |
| **Full suite command** | `yarn test:visual`                  |
| **Estimated runtime**  | ~15 seconds                         |

---

## Nyquist Opt-Out

This phase explicitly opts out of Nyquist compliance. Rationale:

1. `/lab/main-d` is an **experimental lab page** — not production-facing
2. Primary validation is **visual human checkpoint** (Plan 02 Task 2)
3. Automated verification uses **`npx tsc --noEmit`** for compile-time type safety
4. Full Playwright smoke tests are optional and can be added in m9-02 when the feature stabilizes

---

## Sampling Rate

- **After every task commit:** Run `npx tsc --noEmit --project packages/web/tsconfig.json`
- **After Plan 02:** Human visual checkpoint (blocking)
- **Before `/gsd:verify-work`:** Human visual confirmation + tsc green
- **Max feedback latency:** 10 seconds (tsc only)

---

## Per-Task Verification Map

| Task ID  | Plan | Wave | Requirement               | Test Type           | Automated Command                                       | Status  |
| -------- | ---- | ---- | ------------------------- | ------------------- | ------------------------------------------------------- | ------- |
| m9-01-01 | 01   | 1    | CANV-03, DATA-01          | type-check          | `npx tsc --noEmit --project packages/web/tsconfig.json` | pending |
| m9-01-02 | 02   | 2    | CANV-01, CANV-02, DATA-02 | type-check + visual | `npx tsc --noEmit` + human checkpoint                   | pending |

_Status: pending / green / red / flaky_

---

## Manual-Only Verifications

| Behavior                 | Requirement | Why Manual            | Test Instructions                                                       |
| ------------------------ | ----------- | --------------------- | ----------------------------------------------------------------------- |
| Grain texture visible    | CANV-01     | Visual fidelity check | Navigate to /lab/main-d, verify subtle grain overlay on dark background |
| Polaroid card appearance | CANV-02     | Visual design match   | Verify white border, bottom-heavy padding, shadow, rotation angles      |
| Deterministic scatter    | CANV-03     | Hydration consistency | Refresh page 3x, verify card positions are identical each time          |
| Bottom nav glass effect  | DATA-02     | Visual design match   | Verify blur, neon hover, correct nav items                              |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify (tsc type-checking)
- [x] Nyquist opt-out explicitly declared with rationale
- [ ] Human visual checkpoint passes (Plan 02 Task 2)
- [x] No watch-mode flags
- [x] Feedback latency < 15s
- [ ] Phase verified via `/gsd:verify-work`

**Approval:** pending
