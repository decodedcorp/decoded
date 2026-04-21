use sea_orm_migration::prelude::*;

/// Ensure `auth.users` exists before any FK migration references it.
///
/// Why: `m20240101_000001_create_users` creates a FK `public.users.id → auth.users(id)`.
/// On prod Supabase `auth.users` is managed by GoTrue and already exists. On local plain
/// Postgres it doesn't — the FK creation fails.
///
/// This migration guarantees a minimal `auth.users` table exists on local so the FK can
/// be created. Later migrations (this PR's `m20260501_000001_decouple_auth_users_fk`)
/// drop that FK entirely.
///
/// Idempotent + non-destructive in all environments (#282 fix):
/// - Wrapped in a PL/pgSQL `DO` block that first checks `information_schema.tables`.
/// - If `auth.users` already exists (Supabase self-hosted, remote Supabase, or re-run on local),
///   the block returns immediately without executing `CREATE SCHEMA` / `CREATE TABLE`.
/// - Only when `auth.users` is missing (plain Postgres first-run) do we create the schema + stub.
///
/// Why not just `CREATE TABLE IF NOT EXISTS`: Postgres evaluates CREATE privilege on the target
/// schema *before* the IF NOT EXISTS existence check, so on Supabase (where `auth` is owned by
/// `supabase_auth_admin`) the migration used to fail with `permission denied for schema auth`
/// even though it would logically be a no-op.
///
/// Registered at the TOP of `Migrator::migrations()` so on fresh local it runs before the
/// 2024-dated table migrations. On prod / Supabase it's a no-op.
#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .get_connection()
            .execute_unprepared(
                r#"
                DO $$
                BEGIN
                    IF EXISTS (
                        SELECT 1 FROM information_schema.tables
                        WHERE table_schema = 'auth' AND table_name = 'users'
                    ) THEN
                        -- auth.users already exists (Supabase self-hosted / remote). No-op.
                        RETURN;
                    END IF;

                    CREATE SCHEMA IF NOT EXISTS auth;

                    -- Minimal stub — only relevant on plain Postgres without GoTrue.
                    -- Real auth.users (managed by GoTrue) has many more columns.
                    CREATE TABLE auth.users (
                        id uuid PRIMARY KEY
                    );
                END
                $$;
                "#,
            )
            .await?;

        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // Never drop auth schema / auth.users — on prod these belong to GoTrue.
        let _ = manager;
        Ok(())
    }
}
