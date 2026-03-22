---
phase: m10-01
slug: package-manager-migration
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-03-22
---

# Phase m10-01 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property               | Value                                                                                   |
| ---------------------- | --------------------------------------------------------------------------------------- |
| **Framework**          | Shell smoke checks (no test framework — all PKG requirements are infrastructure checks) |
| **Config file**        | N/A                                                                                     |
| **Quick run command**  | `bun install && bun run build`                                                          |
| **Full suite command** | `bun install --frozen-lockfile && bun run build && bun run lint`                        |
| **Estimated runtime**  | ~60 seconds                                                                             |

---

## Sampling Rate

- **After every task commit:** Run `bun install && bun run build`
- **After every wave merge:** Run `bun install --frozen-lockfile && bun run build && bun run lint`
- **Phase gate:** All 5 PKG requirements verified before `/gsd:verify-work`

---

## Requirements → Test Map

| Req ID | Behavior                             | Test Type | Automated Command                                                                                     | Wave |
| ------ | ------------------------------------ | --------- | ----------------------------------------------------------------------------------------------------- | ---- |
| PKG-01 | bun install completes without errors | smoke     | `bun install 2>&1; echo "Exit: $?"`                                                                   | 1    |
| PKG-02 | Yarn artifacts absent from repo      | smoke     | `test ! -f .yarnrc.yml && test ! -d .yarn && test ! -f yarn.lock && echo PASS`                        | 1    |
| PKG-03 | bun.lock exists and is git-tracked   | smoke     | `git ls-files bun.lock \| grep -q bun.lock && echo PASS`                                              | 1    |
| PKG-04 | Next.js dev server starts            | smoke     | `timeout 15 bun run dev &; sleep 10; curl -s http://localhost:3000 > /dev/null && echo PASS; kill %1` | 2    |
| PKG-05 | Production build succeeds            | build     | `bun run build && echo PASS`                                                                          | 2    |

---

## Wave 0 Gaps

- [x] No automated test files needed — all PKG requirements are infrastructure/smoke checks
- [x] Verification: manual checklist execution (install, artifact removal, lockfile, dev, build)
- [x] bun 1.3.10 already installed on system — no install step needed

_(All PKG requirements are infrastructure smoke checks, not unit tests. No new test files needed.)_

---

_Phase: m10-01-package-manager-migration_
_Validation strategy created: 2026-03-22_
