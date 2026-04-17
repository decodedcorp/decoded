# #239 Admin Dashboard RPC Refactor — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace unbounded Supabase `.select()` queries in `packages/web/lib/api/admin/dashboard.ts` with two `SECURITY DEFINER` Postgres RPCs so admin dashboard DAU/MAU and time-series charts reflect real metrics instead of silently truncating at the 1000-row cap.

**Architecture:** New migration `20260417130000_admin_dashboard_rpcs.sql` adds (1) `view_logs(created_at)` index, (2) `admin_distinct_user_count(from, to) → int`, (3) `admin_daily_metrics(from, to) → setof(day, clicks, searches, dau)`. Both RPCs use in-function `is_admin(auth.uid())` guard plus range caps (366 days, `isfinite`) to prevent DoS. `dashboard.ts` drops JS `Set` aggregation and calls `supabase.rpc(...)` instead. `fetchTodaySummary` is untouched (already count-only).

**Tech Stack:** Postgres (Supabase), TypeScript, Next.js 16, Vitest, Supabase CLI.

**Spec:** `docs/superpowers/specs/2026-04-17-issue-239-admin-dashboard-rpc-design.md`

**Branch:** `perf/239-admin-dashboard-rpc` (worktree `.worktrees/239-admin-dashboard`, PORT=3005)

---

## File Structure

| File                                                          | Action         | Responsibility                                                                                                                           |
| ------------------------------------------------------------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `supabase/migrations/20260417130000_admin_dashboard_rpcs.sql` | Create         | `view_logs(created_at)` index + 2 RPCs + GRANT/REVOKE.                                                                                   |
| `packages/web/lib/supabase/types.ts`                          | Modify (regen) | Adds `admin_distinct_user_count` / `admin_daily_metrics` RPC type signatures (machine-generated).                                        |
| `packages/web/lib/api/admin/dashboard.ts`                     | Modify         | Replace JS aggregation in `fetchDashboardStats` and `fetchChartData` with `supabase.rpc(...)`. Keep `fetchTodaySummary`, helpers, types. |
| `packages/web/lib/api/admin/__tests__/dashboard.test.ts`      | Create         | Vitest unit tests with mocked Supabase client — `auth.test.ts` style.                                                                    |

No other files change. API route handlers (`app/api/v1/admin/dashboard/{stats,chart,today}/route.ts`) re-export `dashboard.ts` fetchers with no signature change, so they need no edits.

---

## Task 1: SQL Migration — index + 2 RPCs

**Files:**

- Create: `supabase/migrations/20260417130000_admin_dashboard_rpcs.sql`

- [ ] **Step 1.1: Create migration file**

Create `supabase/migrations/20260417130000_admin_dashboard_rpcs.sql` with the following exact content:

```sql
-- #239 admin dashboard: unbounded row fetch 제거를 위한 RPC 2종 + view_logs 인덱스.
-- Auth divergence from PR #246: 이 RPC들은 authenticated role에 EXECUTE GRANT를 유지한다.
-- 사유: dashboard.ts는 cookie-session anon client(admin user JWT)로 호출된다. service_role
-- 전용으로 제한하면 별도 클라이언트 레이어가 필요해진다. 보완책으로 함수 내부에서
-- auth.uid() IS NULL 체크 + public.is_admin(auth.uid()) 가드를 수행한다.

-- ── view_logs(created_at) 인덱스 — 나머지 3 로그 테이블은 이미 보유 ────────
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_view_logs_created_at
  ON public.view_logs(created_at);

-- ── RPC #1: 기간 내 distinct user_id 개수 (DAU/MAU) ────────────────────
CREATE OR REPLACE FUNCTION public.admin_distinct_user_count(
  p_from_ts TIMESTAMPTZ,
  p_to_ts   TIMESTAMPTZ
) RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  IF p_from_ts IS NULL OR p_to_ts IS NULL
     OR NOT isfinite(p_from_ts) OR NOT isfinite(p_to_ts)
     OR p_to_ts <= p_from_ts THEN
    RAISE EXCEPTION 'invalid_range' USING ERRCODE = 'P0001';
  END IF;

  IF (p_to_ts - p_from_ts) > INTERVAL '366 days' THEN
    RAISE EXCEPTION 'range_too_large' USING ERRCODE = 'P0001';
  END IF;

  SELECT COUNT(DISTINCT user_id)::INTEGER
  INTO v_count
  FROM public.user_events
  WHERE created_at >= p_from_ts
    AND created_at <  p_to_ts;

  RETURN COALESCE(v_count, 0);
END;
$$;

REVOKE ALL     ON FUNCTION public.admin_distinct_user_count(TIMESTAMPTZ, TIMESTAMPTZ) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_distinct_user_count(TIMESTAMPTZ, TIMESTAMPTZ) FROM anon;
GRANT  EXECUTE ON FUNCTION public.admin_distinct_user_count(TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated, service_role;


-- ── RPC #2: 일별 (clicks, searches, dau) 집계 ─────────────────────────
CREATE OR REPLACE FUNCTION public.admin_daily_metrics(
  p_from_ts TIMESTAMPTZ,
  p_to_ts   TIMESTAMPTZ
) RETURNS TABLE (
  day      DATE,
  clicks   INTEGER,
  searches INTEGER,
  dau      INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  IF p_from_ts IS NULL OR p_to_ts IS NULL
     OR NOT isfinite(p_from_ts) OR NOT isfinite(p_to_ts)
     OR p_to_ts <= p_from_ts THEN
    RAISE EXCEPTION 'invalid_range' USING ERRCODE = 'P0001';
  END IF;

  IF (p_to_ts - p_from_ts) > INTERVAL '366 days' THEN
    RAISE EXCEPTION 'range_too_large' USING ERRCODE = 'P0001';
  END IF;

  RETURN QUERY
  WITH
    c AS (
      SELECT date_trunc('day', created_at)::date AS d, COUNT(*)::int AS n
      FROM public.click_logs
      WHERE created_at >= p_from_ts AND created_at < p_to_ts
      GROUP BY 1
    ),
    s AS (
      SELECT date_trunc('day', created_at)::date AS d, COUNT(*)::int AS n
      FROM public.search_logs
      WHERE created_at >= p_from_ts AND created_at < p_to_ts
      GROUP BY 1
    ),
    e AS (
      SELECT date_trunc('day', created_at)::date AS d,
             COUNT(DISTINCT user_id)::int AS n
      FROM public.user_events
      WHERE created_at >= p_from_ts AND created_at < p_to_ts
      GROUP BY 1
    ),
    days AS (
      SELECT generate_series(
        date_trunc('day', p_from_ts)::date,
        (date_trunc('day', p_to_ts) - INTERVAL '1 day')::date,
        INTERVAL '1 day'
      )::date AS d
    )
  SELECT
    days.d,
    COALESCE(c.n, 0),
    COALESCE(s.n, 0),
    COALESCE(e.n, 0)
  FROM days
  LEFT JOIN c USING (d)
  LEFT JOIN s USING (d)
  LEFT JOIN e USING (d)
  ORDER BY days.d;
END;
$$;

REVOKE ALL     ON FUNCTION public.admin_daily_metrics(TIMESTAMPTZ, TIMESTAMPTZ) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_daily_metrics(TIMESTAMPTZ, TIMESTAMPTZ) FROM anon;
GRANT  EXECUTE ON FUNCTION public.admin_daily_metrics(TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated, service_role;
```

- [ ] **Step 1.2: Apply to local Supabase**

Pre-requisite: local Supabase stack must be running. If not:

```bash
supabase start
```

Then apply migrations (repo root):

```bash
supabase db reset --local   # or: supabase migration up --local
```

Expected: migration output lists `20260417130000_admin_dashboard_rpcs.sql` applied. No errors.

If CONCURRENT index creation complains inside a transaction, split the index to a separate statement with `COMMIT;` before it. `supabase db reset` handles this automatically for local; in production it runs each migration in its own transaction.

- [ ] **Step 1.3: Verify function signatures exist in DB**

Run:

```bash
supabase db psql --local -c "\\df public.admin_distinct_user_count" -c "\\df public.admin_daily_metrics"
```

Expected: both functions listed with argument types `timestamp with time zone, timestamp with time zone` and `SECURITY DEFINER`.

- [ ] **Step 1.4: Verify anon is denied**

Run:

```bash
supabase db psql --local -c "SET ROLE anon; SELECT public.admin_distinct_user_count(now() - interval '1 day', now());"
```

Expected: `ERROR:  permission denied for function admin_distinct_user_count` (role anon has no EXECUTE).

Reset role: `RESET ROLE;`

- [ ] **Step 1.5: Verify authenticated non-admin is rejected**

Run:

```bash
supabase db psql --local <<'SQL'
SET ROLE authenticated;
SET request.jwt.claims = '{"sub":"00000000-0000-0000-0000-000000000000"}';
SELECT public.admin_distinct_user_count(now() - interval '1 day', now());
SQL
```

Expected: `ERROR:  forbidden` with SQLSTATE `42501`.

- [ ] **Step 1.6: Verify range guard**

Run:

```bash
supabase db psql --local -c "SELECT public.admin_distinct_user_count(now(), now() - interval '1 day');"
```

Expected: `ERROR:  invalid_range` SQLSTATE `P0001`.

```bash
supabase db psql --local -c "SELECT public.admin_distinct_user_count(now() - interval '400 days', now());"
```

Expected: `ERROR:  range_too_large` SQLSTATE `P0001`.

```bash
supabase db psql --local -c "SELECT public.admin_distinct_user_count('infinity'::timestamptz, now());"
```

Expected: `ERROR:  invalid_range` SQLSTATE `P0001`.

- [ ] **Step 1.7: Verify `view_logs` index exists**

Run:

```bash
supabase db psql --local -c "\\d public.view_logs"
```

Expected output includes: `"idx_view_logs_created_at" btree (created_at)`.

- [ ] **Step 1.8: Commit migration**

```bash
git add supabase/migrations/20260417130000_admin_dashboard_rpcs.sql
git commit -m "$(cat <<'EOF'
feat(db): add admin_dashboard RPCs with is_admin guard (#239)

- admin_distinct_user_count(from_ts, to_ts) → INTEGER
- admin_daily_metrics(from_ts, to_ts) → SETOF(day, clicks, searches, dau)
- auth.uid() NULL + is_admin guard, 366-day range cap, isfinite check
- view_logs(created_at) index (other 3 log tables already indexed)
- REVOKE from anon; GRANT to authenticated, service_role

Refs #239

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Regenerate Supabase types.ts

**Files:**

- Modify: `packages/web/lib/supabase/types.ts`

- [ ] **Step 2.1: Regenerate types**

Run (repo root):

```bash
supabase gen types typescript --local > packages/web/lib/supabase/types.ts
```

- [ ] **Step 2.2: Verify new RPCs are present**

Run:

```bash
grep -n "admin_distinct_user_count\|admin_daily_metrics" packages/web/lib/supabase/types.ts
```

Expected: both function names appear (inside a `Functions:` block) with `Args` and `Returns` types.

- [ ] **Step 2.3: Typecheck**

Run:

```bash
cd packages/web && bun run typecheck
```

Expected: no new errors. (Existing errors unrelated to this change are acceptable but should be noted.)

- [ ] **Step 2.4: Commit type regeneration**

```bash
git add packages/web/lib/supabase/types.ts
git commit -m "$(cat <<'EOF'
chore(supabase): regen types after #239 RPCs

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: TDD — `fetchDashboardStats` refactor

**Files:**

- Create: `packages/web/lib/api/admin/__tests__/dashboard.test.ts`
- Modify: `packages/web/lib/api/admin/dashboard.ts` (L77–L155)

- [ ] **Step 3.1: Write failing test — RPC called with correct 4 ranges**

Create `packages/web/lib/api/admin/__tests__/dashboard.test.ts` with the following content:

```ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

type RpcArgs = { p_from_ts: string; p_to_ts: string };

const rpcMock = vi.fn();
const fromMock = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: async () => ({
    rpc: (name: string, args: RpcArgs) => rpcMock(name, args),
    from: (table: string) => fromMock(table),
  }),
}));

function countMock(value: number | null) {
  return {
    select: () => Promise.resolve({ count: value, error: null }),
  };
}

describe("fetchDashboardStats", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Freeze clock to 2026-04-17T05:00:00Z so UTC-day boundaries are deterministic.
    vi.setSystemTime(new Date("2026-04-17T05:00:00Z"));
    rpcMock.mockReset();
    fromMock.mockReset();
    fromMock.mockImplementation(() => countMock(10));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("calls admin_distinct_user_count 4 times with correct half-open ranges", async () => {
    rpcMock.mockResolvedValue({ data: 0, error: null });
    const { fetchDashboardStats } = await import("../dashboard");
    await fetchDashboardStats();

    const calls = rpcMock.mock.calls.filter(
      ([name]) => name === "admin_distinct_user_count",
    );
    expect(calls).toHaveLength(4);

    const today = "2026-04-17T00:00:00.000Z";
    const tomorrow = "2026-04-18T00:00:00.000Z";
    const yesterday = "2026-04-16T00:00:00.000Z";
    const d30ago = "2026-03-18T00:00:00.000Z";
    const d60ago = "2026-02-16T00:00:00.000Z";

    const argsList = calls.map(([, args]) => args);
    expect(argsList).toContainEqual({ p_from_ts: today, p_to_ts: tomorrow });
    expect(argsList).toContainEqual({ p_from_ts: d30ago, p_to_ts: tomorrow });
    expect(argsList).toContainEqual({ p_from_ts: yesterday, p_to_ts: today });
    expect(argsList).toContainEqual({ p_from_ts: d60ago, p_to_ts: d30ago });
  });
});
```

- [ ] **Step 3.2: Run test to verify it fails**

Run:

```bash
cd packages/web && bun test lib/api/admin/__tests__/dashboard.test.ts
```

Expected: FAIL. Current `fetchDashboardStats` calls `supabase.from("user_events").select("user_id")...` — not `supabase.rpc("admin_distinct_user_count", ...)`. Assertion on RPC call count (0 ≠ 4) should fail.

- [ ] **Step 3.3: Refactor `fetchDashboardStats`**

Open `packages/web/lib/api/admin/dashboard.ts` and replace the body of `fetchDashboardStats` (L77–L155) with:

```ts
export async function fetchDashboardStats(): Promise<KPIStats> {
  const supabase = await createSupabaseServerClient();

  const today = todayStartUTC();
  const tomorrow = daysAgoUTC(-1);
  const yesterday = daysAgoUTC(1);
  const d30ago = daysAgoUTC(30);
  const d60ago = daysAgoUTC(60);

  const ranges = {
    dau: { from: today, to: tomorrow },
    mau: { from: d30ago, to: tomorrow },
    prevDau: { from: yesterday, to: today },
    prevMau: { from: d60ago, to: d30ago },
  } as const;

  try {
    const [
      { count: postCount },
      { count: itemCount },
      { count: userCount },
      { data: dau, error: e1 },
      { data: mau, error: e2 },
      { data: prevDau, error: e3 },
      { data: prevMau, error: e4 },
    ] = await Promise.all([
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase.from("post" as any).select("*", { count: "exact", head: true }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase.from("item" as any).select("*", { count: "exact", head: true }),
      supabase.from("users").select("*", { count: "exact", head: true }),
      supabase.rpc("admin_distinct_user_count", {
        p_from_ts: ranges.dau.from.toISOString(),
        p_to_ts: ranges.dau.to.toISOString(),
      }),
      supabase.rpc("admin_distinct_user_count", {
        p_from_ts: ranges.mau.from.toISOString(),
        p_to_ts: ranges.mau.to.toISOString(),
      }),
      supabase.rpc("admin_distinct_user_count", {
        p_from_ts: ranges.prevDau.from.toISOString(),
        p_to_ts: ranges.prevDau.to.toISOString(),
      }),
      supabase.rpc("admin_distinct_user_count", {
        p_from_ts: ranges.prevMau.from.toISOString(),
        p_to_ts: ranges.prevMau.to.toISOString(),
      }),
    ]);

    if (e1 || e2 || e3 || e4) throw e1 ?? e2 ?? e3 ?? e4;

    const dauN = (dau as number | null) ?? 0;
    const mauN = (mau as number | null) ?? 0;
    const prevDauN = (prevDau as number | null) ?? 0;
    const prevMauN = (prevMau as number | null) ?? 0;

    return {
      dau: dauN,
      mau: mauN,
      totalUsers: userCount ?? 0,
      totalPosts: postCount ?? 0,
      totalSolutions: itemCount ?? 0,
      dauDelta: calcDelta(dauN, prevDauN),
      mauDelta: calcDelta(mauN, prevMauN),
      totalUsersDelta: 0,
      totalPostsDelta: 0,
      totalSolutionsDelta: 0,
    };
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.error("[fetchDashboardStats] Supabase error:", err);
    }
    return {
      dau: 0,
      mau: 0,
      totalUsers: 0,
      totalPosts: 0,
      totalSolutions: 0,
    };
  }
}
```

- [ ] **Step 3.4: Run test to verify it passes**

Run:

```bash
cd packages/web && bun test lib/api/admin/__tests__/dashboard.test.ts
```

Expected: PASS. The `argsList` contains all 4 expected ranges.

- [ ] **Step 3.5: Add delta + fallback tests**

Append to `packages/web/lib/api/admin/__tests__/dashboard.test.ts` inside the `describe("fetchDashboardStats", ...)` block:

```ts
it("maps RPC values to KPIStats and computes deltas", async () => {
  rpcMock.mockImplementation((_name, args: RpcArgs) => {
    const tomorrow = "2026-04-18T00:00:00.000Z";
    if (
      args.p_to_ts === tomorrow &&
      args.p_from_ts === "2026-04-17T00:00:00.000Z"
    )
      return Promise.resolve({ data: 100, error: null }); // dau
    if (
      args.p_to_ts === tomorrow &&
      args.p_from_ts === "2026-03-18T00:00:00.000Z"
    )
      return Promise.resolve({ data: 1000, error: null }); // mau
    if (args.p_from_ts === "2026-04-16T00:00:00.000Z")
      return Promise.resolve({ data: 80, error: null }); // prevDau
    return Promise.resolve({ data: 800, error: null }); // prevMau
  });
  fromMock.mockImplementation((t: string) => {
    if (t === "post") return countMock(42);
    if (t === "item") return countMock(17);
    if (t === "users") return countMock(500);
    return countMock(0);
  });

  const { fetchDashboardStats } = await import("../dashboard");
  const stats = await fetchDashboardStats();

  expect(stats.dau).toBe(100);
  expect(stats.mau).toBe(1000);
  expect(stats.totalUsers).toBe(500);
  expect(stats.totalPosts).toBe(42);
  expect(stats.totalSolutions).toBe(17);
  expect(stats.dauDelta).toBe(25); // (100-80)/80 * 100 = 25.0
  expect(stats.mauDelta).toBe(25); // (1000-800)/800 * 100 = 25.0
});

it("returns zeros on RPC error", async () => {
  rpcMock.mockResolvedValue({ data: null, error: new Error("boom") });
  const { fetchDashboardStats } = await import("../dashboard");
  const stats = await fetchDashboardStats();
  expect(stats).toMatchObject({
    dau: 0,
    mau: 0,
    totalUsers: 0,
    totalPosts: 0,
    totalSolutions: 0,
  });
});

it("treats null RPC data as 0", async () => {
  rpcMock.mockResolvedValue({ data: null, error: null });
  const { fetchDashboardStats } = await import("../dashboard");
  const stats = await fetchDashboardStats();
  expect(stats.dau).toBe(0);
  expect(stats.mau).toBe(0);
});
```

- [ ] **Step 3.6: Run all fetchDashboardStats tests**

Run:

```bash
cd packages/web && bun test lib/api/admin/__tests__/dashboard.test.ts
```

Expected: all 4 tests in `describe("fetchDashboardStats")` PASS.

---

## Task 4: TDD — `fetchChartData` refactor

**Files:**

- Modify: `packages/web/lib/api/admin/__tests__/dashboard.test.ts` (append block)
- Modify: `packages/web/lib/api/admin/dashboard.ts` (L165–L261)

- [ ] **Step 4.1: Write failing tests**

Append to `packages/web/lib/api/admin/__tests__/dashboard.test.ts` (after the `fetchDashboardStats` `describe` block, same file):

```ts
describe("fetchChartData", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-17T05:00:00Z"));
    rpcMock.mockReset();
    fromMock.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("calls admin_daily_metrics once with 30-day half-open range", async () => {
    rpcMock.mockResolvedValue({ data: [], error: null });
    const { fetchChartData } = await import("../dashboard");
    await fetchChartData(30);

    expect(rpcMock).toHaveBeenCalledTimes(1);
    const [name, args] = rpcMock.mock.calls[0];
    expect(name).toBe("admin_daily_metrics");
    expect(args).toEqual({
      p_from_ts: "2026-03-19T00:00:00.000Z", // daysAgoUTC(29): today - 29d
      p_to_ts: "2026-04-18T00:00:00.000Z", // daysAgoUTC(-1): tomorrow 00:00Z
    });
  });

  it("clamps days to 90", async () => {
    rpcMock.mockResolvedValue({ data: [], error: null });
    const { fetchChartData } = await import("../dashboard");
    await fetchChartData(120);

    const [, args] = rpcMock.mock.calls[0];
    // 90-day inclusive window: from = daysAgoUTC(89)
    expect(args.p_from_ts).toBe("2026-01-18T00:00:00.000Z");
    expect(args.p_to_ts).toBe("2026-04-18T00:00:00.000Z");
  });

  it("clamps days to minimum 1", async () => {
    rpcMock.mockResolvedValue({ data: [], error: null });
    const { fetchChartData } = await import("../dashboard");
    await fetchChartData(0);

    const [, args] = rpcMock.mock.calls[0];
    expect(args.p_from_ts).toBe("2026-04-17T00:00:00.000Z");
    expect(args.p_to_ts).toBe("2026-04-18T00:00:00.000Z");
  });

  it("maps RPC rows to DailyMetric", async () => {
    rpcMock.mockResolvedValue({
      data: [
        { day: "2026-04-16", clicks: 5, searches: 3, dau: 10 },
        { day: "2026-04-17", clicks: 7, searches: 1, dau: 12 },
      ],
      error: null,
    });
    const { fetchChartData } = await import("../dashboard");
    const out = await fetchChartData(2);

    expect(out).toEqual([
      { date: "2026-04-16", dau: 10, searches: 3, clicks: 5 },
      { date: "2026-04-17", dau: 12, searches: 1, clicks: 7 },
    ]);
  });

  it("returns [] on RPC error", async () => {
    rpcMock.mockResolvedValue({ data: null, error: new Error("boom") });
    const { fetchChartData } = await import("../dashboard");
    const out = await fetchChartData(30);
    expect(out).toEqual([]);
  });

  it("handles null RPC fields with 0 fallback", async () => {
    rpcMock.mockResolvedValue({
      data: [{ day: "2026-04-17", clicks: null, searches: null, dau: null }],
      error: null,
    });
    const { fetchChartData } = await import("../dashboard");
    const out = await fetchChartData(1);
    expect(out).toEqual([
      { date: "2026-04-17", dau: 0, searches: 0, clicks: 0 },
    ]);
  });
});
```

- [ ] **Step 4.2: Run tests — expect failure**

Run:

```bash
cd packages/web && bun test lib/api/admin/__tests__/dashboard.test.ts
```

Expected: new `fetchChartData` tests FAIL. Current implementation calls `.from("view_logs")...` / `.from("click_logs")...` etc., not `.rpc("admin_daily_metrics", ...)`.

- [ ] **Step 4.3: Refactor `fetchChartData`**

Open `packages/web/lib/api/admin/dashboard.ts` and replace the body of `fetchChartData` (L165–L261) with:

```ts
export async function fetchChartData(
  days: number = 30,
): Promise<DailyMetric[]> {
  const clampedDays = Math.min(Math.max(1, days), 90);
  const from = daysAgoUTC(clampedDays - 1);
  const to = daysAgoUTC(-1);

  const supabase = await createSupabaseServerClient();

  try {
    const { data, error } = await supabase.rpc("admin_daily_metrics", {
      p_from_ts: from.toISOString(),
      p_to_ts: to.toISOString(),
    });
    if (error) throw error;

    return (data ?? []).map((r) => ({
      date: r.day,
      dau: r.dau ?? 0,
      searches: r.searches ?? 0,
      clicks: r.clicks ?? 0,
    }));
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.error("[fetchChartData] Supabase error:", err);
    }
    return [];
  }
}
```

- [ ] **Step 4.4: Run tests — expect pass**

Run:

```bash
cd packages/web && bun test lib/api/admin/__tests__/dashboard.test.ts
```

Expected: all tests PASS (both `fetchDashboardStats` and `fetchChartData` blocks).

- [ ] **Step 4.5: Typecheck + lint**

Run:

```bash
cd packages/web && bun run typecheck && bun run lint
```

Expected: no new errors. Accept pre-existing warnings unrelated to this change.

- [ ] **Step 4.6: Commit refactor + tests**

```bash
git add packages/web/lib/api/admin/dashboard.ts packages/web/lib/api/admin/__tests__/dashboard.test.ts
git commit -m "$(cat <<'EOF'
refactor(web/admin): use RPCs for dashboard stats/chart (#239)

- fetchDashboardStats calls admin_distinct_user_count × 4 (DAU/MAU + prev)
- fetchChartData calls admin_daily_metrics once (replaces 4-table fetch)
- Drops JS Set dedupe + per-day Map aggregation
- Adds vitest unit tests covering call args, clamping, error fallback
- fetchTodaySummary unchanged (already count-only, out of scope)

Fixes #239

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: End-to-end verification

**Files:** (read-only verification)

- `packages/web/app/admin/dashboard/page.tsx` (or route that renders dashboard)
- Browser: `http://localhost:3005/admin/dashboard`

- [ ] **Step 5.1: Start dev server**

Run:

```bash
PORT=3005 bun run dev
```

Watch console — no Supabase errors on boot.

- [ ] **Step 5.2: Log in as admin in browser**

Open `http://localhost:3005/admin/dashboard` as a user whose `users.is_admin = true`.

- [ ] **Step 5.3: Verify KPI cards render**

Page should show DAU / MAU / totalUsers / totalPosts / totalSolutions cards with non-zero numeric values (assuming seed data exists). If all show `0`, check:

- Dev-tools Network tab: are the RPC calls returning `200` with numeric body?
- Supabase Studio logs: are the RPCs raising errors?

- [ ] **Step 5.4: Verify chart renders**

Chart should show 30 days of data points. Spot-check that:

- x-axis spans ~30 days ending today
- y-axis values are non-negative
- No infinite render loops or hydration warnings in console

- [ ] **Step 5.5: Capture EXPLAIN baseline (evidence for future index decisions)**

Run:

```bash
supabase db psql --local <<'SQL'
SET ROLE authenticated;
SET request.jwt.claims = '{"sub":"<local-admin-uuid>"}';  -- replace with real admin
EXPLAIN ANALYZE SELECT * FROM public.admin_daily_metrics(now() - interval '90 days', now() + interval '1 day');
SQL
```

Capture the output and paste into the PR description under "EXPLAIN baseline". This is evidence for whether further indexes are needed. No code change here — documentation only.

- [ ] **Step 5.6: (No commit — verification only)**

---

## Task 6: PR preparation

- [ ] **Step 6.1: Push branch**

```bash
git push -u origin perf/239-admin-dashboard-rpc
```

- [ ] **Step 6.2: Open PR against `dev`**

Use `gh pr create --base dev --title "perf(#239): admin dashboard RPC refactor — fix silent truncation"`.

PR body should include:

- Link to spec: `docs/superpowers/specs/2026-04-17-issue-239-admin-dashboard-rpc-design.md`
- Closes: `#239`
- EXPLAIN ANALYZE output from Step 5.5
- Test plan checklist (copy from spec §7)

- [ ] **Step 6.3: PRD sync note**

Add a comment on the PR referencing the `db-migration-sync` flow — migration `20260417130000_admin_dashboard_rpcs.sql` must be applied to PRD DEV Supabase before the PR merges to `main`. See project memory `[DB migration strategy]`.

---

## Rollback

If anything goes wrong in PRD after merge:

```sql
DROP FUNCTION IF EXISTS public.admin_daily_metrics(TIMESTAMPTZ, TIMESTAMPTZ);
DROP FUNCTION IF EXISTS public.admin_distinct_user_count(TIMESTAMPTZ, TIMESTAMPTZ);
DROP INDEX  IF EXISTS public.idx_view_logs_created_at;
```

Then `git revert` the three commits (migration, typegen, refactor).
