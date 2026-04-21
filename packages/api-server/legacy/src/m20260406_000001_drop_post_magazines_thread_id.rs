use sea_orm_migration::prelude::*;

/// Drop unused thread_id column from post_magazines (always null, no references)
#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        let db = manager.get_connection();
        db.execute_unprepared("ALTER TABLE post_magazines DROP COLUMN IF EXISTS thread_id")
            .await?;
        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        let db = manager.get_connection();
        db.execute_unprepared(
            "ALTER TABLE post_magazines ADD COLUMN IF NOT EXISTS thread_id VARCHAR NULL",
        )
        .await?;
        Ok(())
    }
}
