-- #151 Security fix: guard update_magazine_status RPC against non-admin callers.
--
-- Before this patch the RPC was GRANTed to `authenticated`, so any logged-in
-- user could call supabase.rpc('update_magazine_status', { p_admin_user_id: own_id })
-- from the browser and approve/reject any magazine, bypassing the Next.js
-- checkIsAdmin() gate entirely. SECURITY DEFINER also skips RLS.
--
-- Fix:
-- 1) Assert the passed p_admin_user_id is actually an admin AND equals auth.uid()
--    when called in a user session (auth.uid() is non-null).
-- 2) Revoke grant from `authenticated`; only service_role (used by the Next.js
--    admin client in `createAdminSupabaseClient`) may invoke this RPC.

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
  v_caller UUID := auth.uid();
BEGIN
  -- AuthZ: caller must be an admin. When invoked from a user session
  -- (auth.uid() non-null) we additionally require the passed admin_user_id
  -- to match the session, so a malicious caller can't stamp the audit log
  -- with someone else's UUID.
  IF v_caller IS NOT NULL AND v_caller <> p_admin_user_id THEN
    RAISE EXCEPTION 'caller_mismatch' USING ERRCODE = 'P0003';
  END IF;

  IF NOT public.is_admin(p_admin_user_id) THEN
    RAISE EXCEPTION 'caller_not_admin' USING ERRCODE = 'P0003';
  END IF;

  -- rejection_reason length guard (defense-in-depth; routes also trim/clamp).
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

-- Drop authenticated grant — Next.js admin route uses service_role client.
REVOKE ALL ON FUNCTION public.update_magazine_status(UUID, VARCHAR, UUID, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_magazine_status(UUID, VARCHAR, UUID, TEXT) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.update_magazine_status(UUID, VARCHAR, UUID, TEXT) TO service_role;
