use sea_orm_migration::prelude::*;

/// Backfill public.* columns that live in prod (added via `supabase/migrations/`
/// remote_schema.sql) but weren't in the SeaORM migration set.
///
/// Discovered while booting api-server against fresh local Postgres: calls to
/// /api/v1/posts failed with "column users.ink_credits does not exist" because
/// the SeaORM `users` entity expects `ink_credits` + `style_dna` but the
/// `m20240101_000001_create_users` migration never created them.
///
/// Idempotent — `ADD COLUMN IF NOT EXISTS` no-ops on prod where they exist.
#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .get_connection()
            .execute_unprepared(
                r#"
                ALTER TABLE public.users
                    ADD COLUMN IF NOT EXISTS ink_credits integer NOT NULL DEFAULT 5,
                    ADD COLUMN IF NOT EXISTS style_dna jsonb,
                    ADD COLUMN IF NOT EXISTS studio_config jsonb;
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
