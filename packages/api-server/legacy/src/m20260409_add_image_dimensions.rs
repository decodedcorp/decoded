use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        let db = manager.get_connection();
        db.execute_unprepared(
            "ALTER TABLE posts ADD COLUMN IF NOT EXISTS image_width integer, ADD COLUMN IF NOT EXISTS image_height integer"
        ).await?;
        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .alter_table(
                Table::alter()
                    .table(Alias::new("posts"))
                    .drop_column(Alias::new("image_width"))
                    .drop_column(Alias::new("image_height"))
                    .to_owned(),
            )
            .await
    }
}
