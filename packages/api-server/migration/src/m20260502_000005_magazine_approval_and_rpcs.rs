use sea_orm_migration::prelude::*;

/// Magazine approval workflow: `is_admin()` function + `post_magazines.approved_by` +
/// `post_magazines.rejection_reason` + `update_magazine_status()` RPC (admin-guarded).
///
/// Consolidates four Supabase migrations:
/// - `20260417120000_magazine_approval_fields.sql`
/// - `20260417120001_update_magazine_status_rpc.sql` (skipped — superseded by admin_guard)
/// - `20260417120002_update_magazine_status_rpc_admin_guard.sql`  (this version)
/// - `20260417120003_revoke_anon_from_admin_rpcs.sql`
///
/// The approved_by FK points at `public.users(id)` (not `auth.users`) — matches the
/// decoupling from PR #267.
#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        let conn = manager.get_connection();

        // 1) is_admin(uuid) function
        conn.execute_unprepared(
            r#"
            CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
            RETURNS boolean
            LANGUAGE sql
            SECURITY DEFINER
            STABLE
            SET search_path = public, pg_temp
            AS $fn$
              SELECT COALESCE(
                (SELECT is_admin FROM public.users WHERE id = user_id),
                false
              );
            $fn$;

            REVOKE ALL ON FUNCTION public.is_admin(uuid) FROM PUBLIC;

            DO $$
            BEGIN
                IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
                    GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated, service_role;
                    REVOKE EXECUTE ON FUNCTION public.is_admin(uuid) FROM anon;
                END IF;
            END $$;
            "#,
        )
        .await?;

        // 2) post_magazines approval columns + status check + index + RLS update policy
        conn.execute_unprepared(
            r#"
            ALTER TABLE public.post_magazines
                ADD COLUMN IF NOT EXISTS approved_by UUID;
            ALTER TABLE public.post_magazines
                ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

            ALTER TABLE public.post_magazines
                DROP CONSTRAINT IF EXISTS post_magazines_approved_by_fkey;
            ALTER TABLE public.post_magazines
                ADD CONSTRAINT post_magazines_approved_by_fkey
                FOREIGN KEY (approved_by) REFERENCES public.users(id) ON DELETE SET NULL;

            UPDATE public.post_magazines SET status = 'draft' WHERE status IS NULL;

            ALTER TABLE public.post_magazines
                DROP CONSTRAINT IF EXISTS post_magazines_status_check;
            ALTER TABLE public.post_magazines
                ADD CONSTRAINT post_magazines_status_check
                CHECK (status IN ('draft', 'pending', 'published', 'rejected'));

            CREATE INDEX IF NOT EXISTS post_magazines_status_idx
                ON public.post_magazines(status)
                WHERE status IN ('pending', 'draft');

            DROP POLICY IF EXISTS "admin_can_update_magazines" ON public.post_magazines;
            CREATE POLICY "admin_can_update_magazines"
                ON public.post_magazines FOR UPDATE
                USING (public.is_admin(auth.uid()))
                WITH CHECK (public.is_admin(auth.uid()));
            "#,
        )
        .await?;

        // 3) update_magazine_status RPC (admin-guarded version — matches
        //    supabase/migrations/20260417120002_update_magazine_status_rpc_admin_guard.sql)
        conn.execute_unprepared(
            r#"
            CREATE OR REPLACE FUNCTION public.update_magazine_status(
              p_magazine_id UUID,
              p_new_status VARCHAR,
              p_admin_user_id UUID,
              p_rejection_reason TEXT DEFAULT NULL
            ) RETURNS SETOF public.post_magazines
            LANGUAGE plpgsql
            SECURITY DEFINER
            SET search_path = public, warehouse, pg_temp
            AS $fn$
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
            $fn$;

            REVOKE ALL ON FUNCTION public.update_magazine_status(UUID, VARCHAR, UUID, TEXT) FROM PUBLIC;

            DO $$
            BEGIN
                IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
                    REVOKE EXECUTE ON FUNCTION public.update_magazine_status(UUID, VARCHAR, UUID, TEXT) FROM authenticated;
                    GRANT EXECUTE ON FUNCTION public.update_magazine_status(UUID, VARCHAR, UUID, TEXT) TO service_role;
                END IF;
            END $$;
            "#,
        )
        .await?;

        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        let _ = manager;
        Ok(())
    }
}
