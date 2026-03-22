# SCR-USER-03: Earnings Screen

**ID:** SCR-USER-03
**Route:** N/A — not implemented
**Status:** NOT-IMPL
**Flow:** FLW-04 — User Authentication

> See: [SCR-USER-02](./SCR-USER-02-profile.md) — StatsCards Points tap triggers earnings alert

> **Note:** ROADMAP success criterion describes intended scope (click tracking, settlement flow, period-based data). This spec documents actual implementation state per code: NOT-IMPL.

---

## Purpose

Earnings dashboard for affiliate click tracking, settlement history, and period-based revenue display — planned feature, not yet built.

---

## Implementation Status

**No route exists.** No component. No API endpoint. The only in-codebase reference:

```
StatsCards.tsx — handleEarningsClick():
  console.log("Navigate to /profile/earnings - not yet implemented")
  alert("수익 페이지는 아직 구현되지 않았습니다.")
```

---

## Existing Data Points

| What exists | Where | Notes |
|-------------|-------|-------|
| `total_points` field | `UserStatsResponse` (API) | Returned by `GET /api/v1/users/me/stats` |
| Points display | `StatsCards.tsx` — "Points" card | Renders `formatCurrency(stats.totalEarnings)` |
| Entry point | Points card tap → `alert()` | No navigation, just alert |

---

## Planned Scope (from requirements, NOT implemented)

- Click tracking: affiliate link tap counts per item/period
- Settlement flow: payout request and status
- Period-based data: revenue breakdown by day/week/month

---

## Entry Point

Profile (`/profile`) → StatsCards → Points card tap → `alert('수익 페이지는 아직 구현되지 않았습니다.')`

---

## Requirements

- When user taps Points stat card, the system shall show `alert('수익 페이지는 아직 구현되지 않았습니다.')`. — **IMPL** (alert only)
- Earnings dashboard with click tracking, settlement flow, and period-based revenue display. — **NOT-IMPL**
- Earnings API endpoint (`GET /api/v1/users/me/earnings`). — **NOT-IMPL**
