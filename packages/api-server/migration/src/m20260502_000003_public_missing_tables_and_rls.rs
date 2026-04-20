use sea_orm_migration::prelude::*;

/// Create `user_follows`, `user_tryon_history`, `content_reports` — tables that were
/// previously only in `packages/api-server/migration/sql/` (manual Supabase Dashboard runs).
///
/// FK direction: these tables reference `public.users(id)` instead of `auth.users(id)` —
/// matches the decoupling done by PR #267 (`m20260501_000001_decouple_auth_users_fk`).
/// On prod with PR #267 already applied, the CREATE TABLE IF NOT EXISTS no-ops and the
/// FKs are already on public.users. On fresh local, the new tables are created directly
/// against public.users.
///
/// RLS policies use `auth.uid()`. The stub from PR #267 (`m20260501_000002_auth_uid_stub`)
/// creates a local fallback so these policies compile everywhere.
#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        let conn = manager.get_connection();

        // 1) user_follows — social follow graph
        conn.execute_unprepared(
            r#"
            CREATE TABLE IF NOT EXISTS public.user_follows (
                follower_id  UUID NOT NULL,
                following_id UUID NOT NULL,
                created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
                PRIMARY KEY (follower_id, following_id)
            );

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

            CREATE INDEX IF NOT EXISTS idx_user_follows_follower_id
                ON public.user_follows (follower_id);
            CREATE INDEX IF NOT EXISTS idx_user_follows_following_id
                ON public.user_follows (following_id);

            ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;
            DROP POLICY IF EXISTS "user_follows_select_public" ON public.user_follows;
            CREATE POLICY "user_follows_select_public"
                ON public.user_follows FOR SELECT USING (true);
            "#,
        )
        .await?;

        // 2) user_tryon_history — VTON archive
        conn.execute_unprepared(
            r#"
            CREATE TABLE IF NOT EXISTS public.user_tryon_history (
                id         UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
                user_id    UUID NOT NULL,
                image_url  TEXT NOT NULL,
                created_at TIMESTAMPTZ NOT NULL DEFAULT now()
            );

            ALTER TABLE public.user_tryon_history
                DROP CONSTRAINT IF EXISTS user_tryon_history_user_id_fkey;
            ALTER TABLE public.user_tryon_history
                ADD CONSTRAINT user_tryon_history_user_id_fkey
                FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

            CREATE INDEX IF NOT EXISTS idx_user_tryon_history_user_id
                ON public.user_tryon_history (user_id);

            ALTER TABLE public.user_tryon_history ENABLE ROW LEVEL SECURITY;
            DROP POLICY IF EXISTS "user_tryon_history_select_own" ON public.user_tryon_history;
            CREATE POLICY "user_tryon_history_select_own"
                ON public.user_tryon_history FOR SELECT USING (auth.uid() = user_id);
            "#,
        )
        .await?;

        // 3) content_reports — user-reported content moderation
        conn.execute_unprepared(
            r#"
            CREATE TABLE IF NOT EXISTS public.content_reports (
                id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                target_type VARCHAR(32) NOT NULL DEFAULT 'post',
                target_id   UUID NOT NULL,
                reporter_id UUID NOT NULL,
                reason      VARCHAR(64) NOT NULL,
                details     TEXT,
                status      VARCHAR(32) NOT NULL DEFAULT 'pending',
                resolution  TEXT,
                reviewed_by UUID,
                created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
                updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
            );

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

            CREATE INDEX IF NOT EXISTS idx_content_reports_target
                ON public.content_reports (target_type, target_id);
            CREATE INDEX IF NOT EXISTS idx_content_reports_status
                ON public.content_reports (status);
            CREATE INDEX IF NOT EXISTS idx_content_reports_reporter
                ON public.content_reports (reporter_id);
            CREATE UNIQUE INDEX IF NOT EXISTS idx_content_reports_unique_per_user
                ON public.content_reports (target_type, target_id, reporter_id);

            ALTER TABLE public.content_reports ENABLE ROW LEVEL SECURITY;

            DROP POLICY IF EXISTS "content_reports_insert_own" ON public.content_reports;
            CREATE POLICY "content_reports_insert_own"
                ON public.content_reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);

            DROP POLICY IF EXISTS "content_reports_select_own" ON public.content_reports;
            CREATE POLICY "content_reports_select_own"
                ON public.content_reports FOR SELECT USING (auth.uid() = reporter_id);
            "#,
        )
        .await?;

        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // Do NOT drop these tables — they hold user data.
        let _ = manager;
        Ok(())
    }
}
