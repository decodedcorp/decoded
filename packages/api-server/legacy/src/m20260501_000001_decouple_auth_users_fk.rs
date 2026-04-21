use sea_orm_migration::prelude::*;

/// Decouple all `auth.users` FKs to `public.users` equivalents.
///
/// Why: Path X-1 (#267) requires public schema to stand alone on plain Postgres.
/// `auth.users` only exists when Supabase GoTrue is running; local dev doesn't have it.
/// `public.users` is already kept in sync with `auth.users` via the handle_new_user trigger
/// (see legacy/sql/01_auth_trigger_handle_new_user.sql), so `public.users.id` is the
/// authoritative application-side identity.
///
/// Idempotent: every step uses `DROP CONSTRAINT IF EXISTS` + `ADD CONSTRAINT` wrapped in
/// `IF EXISTS` table checks. Prod (where old constraints exist) and fresh local (where
/// some tables — content_reports, user_follows, user_tryon_history — haven't been created
/// yet because they still live in legacy/sql/*) both converge safely.
#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        let conn = manager.get_connection();

        // 1) public.users: drop FK to auth.users(id). public.users is now standalone.
        //    The handle_new_user trigger continues to insert rows when Supabase auth
        //    creates users — it is NOT a FK constraint, so removing the FK is safe.
        conn.execute_unprepared(
            r#"
            DO $$
            BEGIN
                IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'users') THEN
                    ALTER TABLE public.users DROP CONSTRAINT IF EXISTS fk_users_auth_users;
                    ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_id_fkey;
                END IF;
            END $$;
            "#,
        )
        .await?;

        // 2) public.post_magazines.approved_by → public.users(id) ON DELETE SET NULL
        conn.execute_unprepared(
            r#"
            DO $$
            BEGIN
                IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'post_magazines')
                   AND EXISTS (SELECT 1 FROM information_schema.columns
                               WHERE table_schema = 'public' AND table_name = 'post_magazines'
                                 AND column_name = 'approved_by') THEN
                    ALTER TABLE public.post_magazines
                        DROP CONSTRAINT IF EXISTS post_magazines_approved_by_fkey;
                    ALTER TABLE public.post_magazines
                        ADD CONSTRAINT post_magazines_approved_by_fkey
                        FOREIGN KEY (approved_by) REFERENCES public.users(id) ON DELETE SET NULL;
                END IF;
            END $$;
            "#,
        )
        .await?;

        // 3) public.user_follows: follower_id + following_id → public.users(id) CASCADE
        //    (table comes from legacy/sql/04_user_follows.sql — may be absent locally)
        conn.execute_unprepared(
            r#"
            DO $$
            BEGIN
                IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_follows') THEN
                    ALTER TABLE public.user_follows
                        DROP CONSTRAINT IF EXISTS user_follows_follower_id_fkey;
                    ALTER TABLE public.user_follows
                        ADD CONSTRAINT user_follows_follower_id_fkey
                        FOREIGN KEY (follower_id) REFERENCES public.users(id) ON DELETE CASCADE;

                    ALTER TABLE public.user_follows
                        DROP CONSTRAINT IF EXISTS user_follows_following_id_fkey;
                    ALTER TABLE public.user_follows
                        ADD CONSTRAINT user_follows_following_id_fkey
                        FOREIGN KEY (following_id) REFERENCES public.users(id) ON DELETE CASCADE;
                END IF;
            END $$;
            "#,
        )
        .await?;

        // 4) public.user_tryon_history.user_id → public.users(id) CASCADE
        //    (table comes from legacy/sql/05_user_tryon_history.sql)
        conn.execute_unprepared(
            r#"
            DO $$
            BEGIN
                IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_tryon_history') THEN
                    ALTER TABLE public.user_tryon_history
                        DROP CONSTRAINT IF EXISTS user_tryon_history_user_id_fkey;
                    ALTER TABLE public.user_tryon_history
                        ADD CONSTRAINT user_tryon_history_user_id_fkey
                        FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
                END IF;
            END $$;
            "#,
        )
        .await?;

        // 5) public.content_reports.{reporter_id,reviewed_by} → public.users(id)
        //    (table comes from legacy/sql/06_content_reports.sql)
        conn.execute_unprepared(
            r#"
            DO $$
            BEGIN
                IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'content_reports') THEN
                    ALTER TABLE public.content_reports
                        DROP CONSTRAINT IF EXISTS content_reports_reporter_id_fkey;
                    ALTER TABLE public.content_reports
                        ADD CONSTRAINT content_reports_reporter_id_fkey
                        FOREIGN KEY (reporter_id) REFERENCES public.users(id) ON DELETE CASCADE;

                    ALTER TABLE public.content_reports
                        DROP CONSTRAINT IF EXISTS content_reports_reviewed_by_fkey;
                    ALTER TABLE public.content_reports
                        ADD CONSTRAINT content_reports_reviewed_by_fkey
                        FOREIGN KEY (reviewed_by) REFERENCES public.users(id);
                END IF;
            END $$;
            "#,
        )
        .await?;

        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // Reverting is only meaningful when auth.users exists (i.e., on Supabase).
        // On plain Postgres the auth schema may be absent or just a stub — do nothing.
        let conn = manager.get_connection();

        conn.execute_unprepared(
            r#"
            DO $$
            BEGIN
                -- Only revert if auth.users is a real table (not the local stub schema).
                IF NOT EXISTS (
                    SELECT 1 FROM pg_tables WHERE schemaname = 'auth' AND tablename = 'users'
                ) THEN
                    RETURN;
                END IF;

                IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'users') THEN
                    ALTER TABLE public.users DROP CONSTRAINT IF EXISTS fk_users_auth_users;
                    ALTER TABLE public.users
                        ADD CONSTRAINT fk_users_auth_users
                        FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
                END IF;

                IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'post_magazines') THEN
                    ALTER TABLE public.post_magazines
                        DROP CONSTRAINT IF EXISTS post_magazines_approved_by_fkey;
                    ALTER TABLE public.post_magazines
                        ADD CONSTRAINT post_magazines_approved_by_fkey
                        FOREIGN KEY (approved_by) REFERENCES auth.users(id) ON DELETE SET NULL;
                END IF;

                IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_follows') THEN
                    ALTER TABLE public.user_follows
                        DROP CONSTRAINT IF EXISTS user_follows_follower_id_fkey;
                    ALTER TABLE public.user_follows
                        ADD CONSTRAINT user_follows_follower_id_fkey
                        FOREIGN KEY (follower_id) REFERENCES auth.users(id) ON DELETE CASCADE;

                    ALTER TABLE public.user_follows
                        DROP CONSTRAINT IF EXISTS user_follows_following_id_fkey;
                    ALTER TABLE public.user_follows
                        ADD CONSTRAINT user_follows_following_id_fkey
                        FOREIGN KEY (following_id) REFERENCES auth.users(id) ON DELETE CASCADE;
                END IF;

                IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_tryon_history') THEN
                    ALTER TABLE public.user_tryon_history
                        DROP CONSTRAINT IF EXISTS user_tryon_history_user_id_fkey;
                    ALTER TABLE public.user_tryon_history
                        ADD CONSTRAINT user_tryon_history_user_id_fkey
                        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
                END IF;

                IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'content_reports') THEN
                    ALTER TABLE public.content_reports
                        DROP CONSTRAINT IF EXISTS content_reports_reporter_id_fkey;
                    ALTER TABLE public.content_reports
                        ADD CONSTRAINT content_reports_reporter_id_fkey
                        FOREIGN KEY (reporter_id) REFERENCES auth.users(id) ON DELETE CASCADE;

                    ALTER TABLE public.content_reports
                        DROP CONSTRAINT IF EXISTS content_reports_reviewed_by_fkey;
                    ALTER TABLE public.content_reports
                        ADD CONSTRAINT content_reports_reviewed_by_fkey
                        FOREIGN KEY (reviewed_by) REFERENCES auth.users(id);
                END IF;
            END $$;
            "#,
        )
        .await?;

        Ok(())
    }
}
