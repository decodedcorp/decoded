-- #151 update_magazine_status RPC
-- UPDATE post_magazines + INSERT warehouse.admin_audit_log 원자 처리
-- 상태 전이 검증: draft→pending, pending→published/rejected, rejected→pending, published→draft
-- rejected 시 rejection_reason 필수

CREATE OR REPLACE FUNCTION public.update_magazine_status(
  p_magazine_id UUID,
  p_new_status VARCHAR,
  p_admin_user_id UUID,
  p_rejection_reason TEXT DEFAULT NULL
) RETURNS SETOF public.post_magazines
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, warehouse, pg_temp
AS $$
DECLARE
  v_before public.post_magazines;
  v_after public.post_magazines;
  v_action TEXT;
BEGIN
  SELECT * INTO v_before FROM public.post_magazines
    WHERE id = p_magazine_id FOR UPDATE;

  IF v_before IS NULL THEN
    RAISE EXCEPTION 'magazine_not_found' USING ERRCODE = 'P0002';
  END IF;

  -- 전이 유효성
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

  RETURN QUERY SELECT * FROM public.post_magazines WHERE id = p_magazine_id;
END;
$$;

REVOKE ALL ON FUNCTION public.update_magazine_status(UUID, VARCHAR, UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_magazine_status(UUID, VARCHAR, UUID, TEXT) TO authenticated, service_role;
