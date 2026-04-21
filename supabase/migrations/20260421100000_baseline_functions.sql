SET check_function_bodies = false;
SET client_min_messages = warning;

-- Name: admin_daily_metrics(timestamp with time zone, timestamp with time zone); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.admin_daily_metrics(p_from_ts timestamp with time zone, p_to_ts timestamp with time zone) RETURNS TABLE(day date, clicks integer, searches integer, dau integer)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
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


--
-- Name: admin_distinct_user_count(timestamp with time zone, timestamp with time zone); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.admin_distinct_user_count(p_from_ts timestamp with time zone, p_to_ts timestamp with time zone) RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
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


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
BEGIN
    INSERT INTO public.users (id, email, username, display_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'display_name', SPLIT_PART(NEW.email, '@', 1))
    );
    RETURN NEW;
END;
$$;


--
-- Name: FUNCTION handle_new_user(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.handle_new_user() IS 'Supabase Auth에서 새 사용자 생성 시 public.users 테이블에 자동으로 레코드 생성';


--
-- Name: is_admin(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_admin(user_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM public.users WHERE id = user_id),
    false
  );
$$;


--
-- Name: search_similar(extensions.vector, integer, character varying); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.search_similar(query_embedding extensions.vector, match_count integer DEFAULT 10, filter_type character varying DEFAULT NULL::character varying) RETURNS TABLE(entity_type character varying, entity_id uuid, content_text text, similarity double precision)
    LANGUAGE plpgsql
    SET search_path TO ''
    AS $$
BEGIN
    RETURN QUERY
    SELECT e.entity_type, e.entity_id, e.content_text,
           1 - (e.embedding <=> query_embedding) AS similarity
    FROM public.embeddings e
    WHERE (filter_type IS NULL OR e.entity_type = filter_type)
    ORDER BY e.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: update_magazine_status(uuid, character varying, uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_magazine_status(p_magazine_id uuid, p_new_status character varying, p_admin_user_id uuid, p_rejection_reason text DEFAULT NULL::text) RETURNS SETOF public.post_magazines
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'warehouse', 'pg_temp'
    AS $$
DECLARE
  v_before public.post_magazines;
  v_after public.post_magazines;
  v_action TEXT;
  v_caller UUID := auth.uid();
BEGIN
  IF v_caller IS NOT NULL AND v_caller <> p_admin_user_id THEN
    RAISE EXCEPTION 'caller_mismatch' USING ERRCODE = 'P0003';
  END IF;

  IF NOT public.is_admin(p_admin_user_id) THEN
    RAISE EXCEPTION 'caller_not_admin' USING ERRCODE = 'P0003';
  END IF;

  IF p_rejection_reason IS NOT NULL AND length(p_rejection_reason) > 2000 THEN
    RAISE EXCEPTION 'rejection_reason_too_long' USING ERRCODE = 'P0001';
  END IF;

  SELECT * INTO v_before FROM public.post_magazines
    WHERE id = p_magazine_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'magazine_not_found' USING ERRCODE = 'P0002';
  END IF;

  IF NOT (
    (v_before.status = 'draft'     AND p_new_status = 'pending')   OR
    (v_before.status = 'pending'   AND p_new_status = 'published') OR
    (v_before.status = 'pending'   AND p_new_status = 'rejected')  OR
    (v_before.status = 'rejected'  AND p_new_status = 'pending')   OR
    (v_before.status = 'published' AND p_new_status = 'draft')
  ) THEN
    RAISE EXCEPTION 'invalid_transition: % -> %', v_before.status, p_new_status
      USING ERRCODE = 'P0001';
  END IF;

  IF p_new_status = 'rejected' AND (p_rejection_reason IS NULL OR length(trim(p_rejection_reason)) = 0) THEN
    RAISE EXCEPTION 'rejection_reason_required' USING ERRCODE = 'P0001';
  END IF;

  UPDATE public.post_magazines
  SET status = p_new_status,
      approved_by = CASE WHEN p_new_status = 'published' THEN p_admin_user_id ELSE approved_by END,
      published_at = CASE WHEN p_new_status = 'published' THEN now() ELSE published_at END,
      rejection_reason = CASE WHEN p_new_status = 'rejected' THEN p_rejection_reason ELSE NULL END,
      updated_at = now()
  WHERE id = p_magazine_id
  RETURNING * INTO v_after;

  v_action := CASE p_new_status
    WHEN 'published' THEN 'magazine_approve'
    WHEN 'rejected'  THEN 'magazine_reject'
    WHEN 'pending'   THEN 'magazine_submit'
    WHEN 'draft'     THEN 'magazine_unpublish'
    ELSE 'magazine_status_change'
  END;

  INSERT INTO warehouse.admin_audit_log (
    admin_user_id, action, target_table, target_id,
    before_state, after_state, metadata
  ) VALUES (
    p_admin_user_id, v_action, 'post_magazines', p_magazine_id,
    row_to_json(v_before)::jsonb,
    row_to_json(v_after)::jsonb,
    jsonb_build_object('rejection_reason', p_rejection_reason)
  );

  RETURN NEXT v_after;
END;
$$;


--
