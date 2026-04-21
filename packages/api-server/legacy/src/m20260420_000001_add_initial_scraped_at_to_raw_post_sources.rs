use sea_orm_migration::prelude::*;

/// #214 — add `initial_scraped_at` to `warehouse.raw_post_sources`.
///
/// The ai-server scheduler uses this column to distinguish between the first
/// "deep" scrape of a newly registered source and subsequent incremental
/// scrapes. Idempotent so reruns and prod-already-has-it are both safe.
#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        let db = manager.get_connection();
        db.execute_unprepared(
            r#"
            ALTER TABLE "warehouse"."raw_post_sources"
              ADD COLUMN IF NOT EXISTS "initial_scraped_at" timestamp with time zone;
            "#,
        )
        .await?;
        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        let db = manager.get_connection();
        db.execute_unprepared(
            r#"ALTER TABLE "warehouse"."raw_post_sources"
                 DROP COLUMN IF EXISTS "initial_scraped_at";"#,
        )
        .await?;
        Ok(())
    }
}
