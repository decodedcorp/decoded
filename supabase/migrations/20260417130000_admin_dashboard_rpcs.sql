-- #239 admin dashboard: unbounded row fetch 제거를 위한 RPC 2종 + view_logs 인덱스.
-- Auth divergence from PR #246: 이 RPC들은 authenticated role에 EXECUTE GRANT를 유지한다.
-- 사유: dashboard.ts는 cookie-session anon client(admin user JWT)로 호출된다. service_role
-- 전용으로 제한하면 별도 클라이언트 레이어가 필요해진다. 보완책으로 함수 내부에서
-- auth.uid() IS NULL 체크 + public.is_admin(auth.uid()) 가드를 수행한다.

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
        date_trunc('day', p_to_ts - INTERVAL '1 microsecond')::date,
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
