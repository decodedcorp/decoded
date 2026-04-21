use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // 1. trending 정렬 최적화: partial index (active posts only)
        manager
            .get_connection()
            .execute_unprepared(
                "CREATE INDEX IF NOT EXISTS idx_posts_trending_active \
                 ON posts (trending_score DESC NULLS LAST, created_at DESC) \
                 WHERE status = 'active' AND (post_type IS NULL OR post_type != 'try')",
            )
            .await?;

        // 2. solutions status + spot_id: has_solutions 서브쿼리 최적화
        manager
            .get_connection()
            .execute_unprepared(
                "CREATE INDEX IF NOT EXISTS idx_solutions_active_spot_id \
                 ON solutions (spot_id) \
                 WHERE status = 'active'",
            )
            .await?;

        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .get_connection()
            .execute_unprepared("DROP INDEX IF EXISTS idx_posts_trending_active")
            .await?;
        manager
            .get_connection()
            .execute_unprepared("DROP INDEX IF EXISTS idx_solutions_active_spot_id")
            .await?;
        Ok(())
    }
}
