---
title: "#239 — admin dashboard RPC (unbounded row fetch 제거)"
owner: human
status: draft
updated: 2026-04-17
tags: [db, api]
---

# #239 — admin dashboard RPC (unbounded row fetch 제거)

**Status**: Design approved (2026-04-17)
**Branch**: `perf/239-admin-dashboard-rpc`
**Worktree**: `.worktrees/239-admin-dashboard` (PORT=3005)
**Priority**: `priority: high` (프로덕션 지표 silent truncation)

## 1. 문제 정의

`packages/web/lib/api/admin/dashboard.ts`의 두 함수가 Supabase 기본 `.select()` 1000 row cap에 걸려 관리자 대시보드 지표를 silently 잘못 계산한다.

- **`fetchDashboardStats`** (L77–155): DAU/MAU 계산에 `user_events.user_id`를 최대 30일 전체 fetch 후 JS `Set` dedupe. 1000 row 초과 시 MAU가 silently 낮게 표시.
- **`fetchChartData`** (L165–261): 4개 로그 테이블(`view_logs`, `click_logs`, `search_logs`, `user_events`)을 최대 90일 unbounded fetch. 동일한 1000 row 절단 + OOM 리스크.

`fetchTodaySummary` (L266–306)는 이미 `count: exact, head: true`만 사용 → **스코프 밖, 수정 없음**.

## 2. 제약 · 전제

- 호출 컨텍스트: Next.js Server Component → `createSupabaseServerClient()` (anon key + cookie 세션). `auth.uid()`는 로그인한 관리자 UID.
- 기존 admin 패턴: `public.is_admin(uuid)` SQL 함수 (PR #151), `update_magazine_status_rpc` SECURITY DEFINER + in-function guard (PR #224).
- `view_logs` 테이블은 `created_at` 인덱스 부재. 나머지 3개(`click_logs`, `search_logs`, `user_events`)는 보유 (`supabase/migrations/20260409075040_remote_schema.sql`).
- 관리자 read audit log는 이번 PR 스코프 외 (별도 정책 이슈).
- 지표 day 경계는 UTC 기준 유지 (기존 동작과 동일). KST 기준 day 조정은 별도 이슈.

## 3. 아키텍처

```
┌────────────────────────────────────────────────────────┐
│ Server Component (app/admin/dashboard/page.tsx)         │
│   └─ fetchDashboardStats()  ┐                          │
│   └─ fetchChartData(days)   ┤ packages/web/lib/api/    │
│   └─ fetchTodaySummary()    ┘ admin/dashboard.ts       │
│          │                                              │
│          ▼ supabase.rpc(name, args)                     │
│   createSupabaseServerClient() — anon + cookie session  │
└────────┬────────────────────────────────────────────────┘
         ▼
┌────────────────────────────────────────────────────────┐
│ Postgres (public schema)                                │
│  ├─ admin_distinct_user_count(from_ts, to_ts) → int     │
│  └─ admin_daily_metrics(from_ts, to_ts) → SETOF ROW     │
│      (day, clicks, searches, dau)                       │
│                                                         │
│  둘 다 SECURITY DEFINER + auth.uid() IS NULL 가드        │
│        + public.is_admin(auth.uid()) 가드               │
│        + 범위 상한 366일 + isfinite 검증                │
│                                                         │
│  REVOKE ALL FROM PUBLIC, anon                           │
│  GRANT EXECUTE TO authenticated, service_role           │
│  (PR #246 divergence: cookie-session authenticated      │
│   호출이 필요하므로 in-function guard로 보완)           │
└────────────────────────────────────────────────────────┘
```

## 4. 마이그레이션 — `supabase/migrations/20260417130000_admin_dashboard_rpcs.sql`

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

### 4.1 설계 근거

- **SECURITY DEFINER + in-function guard**: `update_magazine_status_rpc_admin_guard`와 동일 패턴. cookie-session 호출을 직접 받으면서도 admin 외 호출을 방어.
- **`auth.uid() IS NULL` 명시 가드**: `is_admin(NULL)`이 false를 반환한다 해도 belt-and-suspenders.
- **366일 + `isfinite` 상한**: `generate_series`가 수백만 row를 생성하는 입력(`'infinity'`, 수백년 범위)으로 DB가 stall되는 DoS 경로 차단.
- **반-오픈 구간 `[from, to)`**: 일별 경계 중복 방지. 클라이언트는 `to_ts = tomorrow 00:00 UTC`.
- **`days` CTE + LEFT JOIN COALESCE 0**: 이벤트 없는 날짜도 0으로 채움 (기존 JS 동작 보존).
- **`views` 반환 제거**: `DailyMetric`이 사용하지 않음. RPC↔TS 계약 일치. 향후 필요 시 RPC·TS 동시 확장.
- **`view_logs(created_at)` 인덱스**: 다른 3개 로그 테이블은 이미 보유. `view_logs`만 누락 → seq scan 경로 차단을 위해 본 마이그레이션에 포함.
- **에러 코드**: `42501`(insufficient_privilege, 표준) + `P0001`(invalid_input, 기존 magazine RPC와 동일 관례).

## 5. `dashboard.ts` 리팩토링

### 5.1 유지되는 요소

- 타입 정의: `DailyMetric`, `KPIStats`, `TodaySummary`
- 헬퍼: `todayStartUTC`, `daysAgoUTC`, `formatDate`, `calcDelta`
- `fetchTodaySummary` 본문 (스코프 밖)

### 5.2 `fetchDashboardStats` — 4개 기간 명시

```ts
export async function fetchDashboardStats(): Promise<KPIStats> {
  const supabase = await createSupabaseServerClient();

  const today = todayStartUTC();
  const tomorrow = daysAgoUTC(-1);
  const yesterday = daysAgoUTC(1);
  const d30ago = daysAgoUTC(30);
  const d60ago = daysAgoUTC(60);

  // 4개 distinct user 창 (half-open [from, to))
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
      supabase.from("post" as any).select("*", { count: "exact", head: true }),
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
    if (process.env.NODE_ENV === "development")
      console.error("[fetchDashboardStats] Supabase error:", err);
    return { dau: 0, mau: 0, totalUsers: 0, totalPosts: 0, totalSolutions: 0 };
  }
}
```

### 5.3 `fetchChartData`

```ts
export async function fetchChartData(
  days: number = 30,
): Promise<DailyMetric[]> {
  const clampedDays = Math.min(Math.max(1, days), 90);
  const from = daysAgoUTC(clampedDays - 1); // inclusive day boundary
  const to = daysAgoUTC(-1); // exclusive upper (tomorrow 00:00)

  const supabase = await createSupabaseServerClient();
  try {
    const { data, error } = await supabase.rpc("admin_daily_metrics", {
      p_from_ts: from.toISOString(),
      p_to_ts: to.toISOString(),
    });
    if (error) throw error;

    return (data ?? []).map((r) => ({
      date: r.day, // DATE → 'YYYY-MM-DD' ISO string
      dau: r.dau ?? 0,
      searches: r.searches ?? 0,
      clicks: r.clicks ?? 0,
    }));
  } catch (err) {
    if (process.env.NODE_ENV === "development")
      console.error("[fetchChartData] Supabase error:", err);
    return [];
  }
}
```

### 5.4 타입 재생성

마이그레이션 적용 직후 `bun run typegen:supabase` (또는 `supabase gen types typescript --linked`) 실행하여 `packages/web/lib/supabase/types.ts`에 새 RPC 시그니처 반영. `supabase.rpc("admin_daily_metrics", …)` 타입 추론 활성화 목적.

## 6. 테스트 — `packages/web/lib/api/admin/__tests__/dashboard.test.ts` (신규)

Vitest + Supabase client mock. `magazines.test.ts` 스타일 참조.

**케이스**:

1. `fetchDashboardStats` — 4개 RPC가 정확한 `(from, to)` 인자로 호출되는지 검증
2. `fetchDashboardStats` — RPC 반환값이 KPIStats로 매핑되고 delta 계산 (current=100, prev=80 → delta=25)
3. `fetchDashboardStats` — RPC 에러 시 zeros fallback
4. `fetchChartData(30)` — 1회 RPC 호출, 인자가 30일 범위, row → DailyMetric 매핑
5. `fetchChartData(120)` — days가 90으로 clamp (`to - from = 90d`)
6. `fetchChartData(0)` — clamp 1, 에러 없이 1 row 반환
7. `fetchChartData` — 에러 시 `[]` fallback
8. _(선택)_ `fetchDashboardStats` — 빈 RPC 응답(`null`) 시 0 처리

## 7. 검증 체크리스트

- [ ] 로컬 Supabase 마이그레이션 적용 성공 (`supabase migration up` 또는 동등)
- [ ] 타입 재생성: `bun run typegen:supabase`
- [ ] EXPLAIN baseline: 마이그레이션 전·후 `admin_daily_metrics` 90일 실행 계획 기록 (인덱스 효과 확인 evidence)
- [ ] anon 롤로 RPC 호출 → `42501` (PostgREST 403)
- [ ] 비-admin authenticated 유저로 호출 → `42501`
- [ ] admin 유저로 호출 → 기존 JS 집계와 수치 일치 (소규모 seed 데이터)
- [ ] `p_to_ts <= p_from_ts` → `invalid_range`
- [ ] `p_to_ts - p_from_ts > 366일` → `range_too_large`
- [ ] `'infinity'::timestamptz` 입력 → `invalid_range`
- [ ] `bun run lint` + `bunx tsc --noEmit` 통과
- [ ] `bun test packages/web/lib/api/admin/__tests__/dashboard.test.ts` green
- [ ] localhost:3005 `/admin/dashboard` 렌더 확인 (차트 + KPI 카드 정상 값)

## 8. 롤백 플랜

마이그레이션 문제 발생 시 역마이그레이션:

```sql
DROP FUNCTION IF EXISTS public.admin_daily_metrics(TIMESTAMPTZ, TIMESTAMPTZ);
DROP FUNCTION IF EXISTS public.admin_distinct_user_count(TIMESTAMPTZ, TIMESTAMPTZ);
DROP INDEX  IF EXISTS public.idx_view_logs_created_at;
```

`dashboard.ts` 변경은 독립 커밋(섹션 9)으로 분리하여 `git revert` 가능.

## 9. 커밋 분할

1. **`feat(db): add admin_dashboard RPCs with is_admin guard (#239)`** — 마이그레이션 파일만.
2. **`refactor(web/admin): use RPCs for dashboard stats/chart (#239)`** — `dashboard.ts` + 신규 테스트.
3. **`chore(supabase): regen types after #239 RPCs`** — 자동 재생성된 `types.ts` (선택, diff가 있을 때만).

## 10. 스코프 밖 (후속 이슈 후보)

- **KST day 경계 지원** — `tz` 파라미터 또는 `America/...` 등 다중 지역.
- **Admin read audit log** — `warehouse.admin_audit_log` 인서트. 정책 결정 선행 필요.
- **DailyMetric에 `views` 노출** — 차트 컴포넌트가 필요로 할 때 RPC + TS 동시 확장.
- **`user_events` 샤딩/rollup** — 장기적 스케일 대응, 현 규모에선 불필요.

## 11. 참고

- Brief: `docs/superpowers/briefs/239-admin-dashboard.md`
- 기존 admin RPC 패턴: `supabase/migrations/20260417120001_update_magazine_status_rpc.sql`
- PR #246 anon EXECUTE revoke: `supabase/migrations/20260417120003_revoke_anon_from_admin_rpcs.sql`
- `is_admin` 정의: `supabase/migrations/20260417120000_magazine_approval_fields.sql` (L5–L19)
- 영향 파일: `packages/web/lib/api/admin/dashboard.ts`
- 메모리: `[DB migration strategy]`, `[Supabase typegen]`
