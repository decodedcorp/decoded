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
/// Idempotent + non-destructive on prod:
/// - `CREATE SCHEMA IF NOT EXISTS auth` → no-op where `auth` exists
/// - `CREATE TABLE IF NOT EXISTS auth.users` → no-op where it exists (prod has GoTrue-managed
///   table with many more columns; we never touch it)
///
/// Registered at the TOP of `Migrator::migrations()` so on fresh local it runs before the
/// 2024-dated table migrations. On prod it runs once (after existing migrations complete),
/// but because the schema+table already exist, it's a no-op.
#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .get_connection()
            .execute_unprepared(
                r#"
                CREATE SCHEMA IF NOT EXISTS auth;

                -- Minimal stub — prod's real auth.users has dozens more columns,
                -- all of which we leave untouched. We only care that `id` exists
                -- as the FK target for public.users.
                CREATE TABLE IF NOT EXISTS auth.users (
                    id uuid PRIMARY KEY
                );
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
