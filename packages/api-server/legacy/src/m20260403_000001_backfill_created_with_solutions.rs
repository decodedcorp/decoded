use sea_orm_migration::prelude::*;

/// Backfill created_with_solutions for legacy posts (null → true/false)
///
/// Logic:
///   - Posts that have at least one solution (via spots) → true
///   - All remaining null posts → false
#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        let db = manager.get_connection();

        // Posts with solutions → true
        db.execute_unprepared(
            r#"
            UPDATE posts
            SET created_with_solutions = true
            WHERE created_with_solutions IS NULL
              AND id IN (
                SELECT DISTINCT sp.post_id
                FROM spots sp
                INNER JOIN solutions sol ON sol.spot_id = sp.id
              )
            "#,
        )
        .await?;

        // Remaining null posts → false
        db.execute_unprepared(
            r#"
            UPDATE posts
            SET created_with_solutions = false
            WHERE created_with_solutions IS NULL
            "#,
        )
        .await?;

        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        let db = manager.get_connection();

        // Revert: reset to null (we can't know which were originally null)
        db.execute_unprepared(
            r#"
            UPDATE posts
            SET created_with_solutions = NULL
            "#,
        )
        .await?;

        Ok(())
    }
}
