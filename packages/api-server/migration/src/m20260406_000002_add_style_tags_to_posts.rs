use sea_orm_migration::prelude::*;

/// Add style_tags JSONB column to posts for AI-extracted fashion style keywords
#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .alter_table(
                Table::alter()
                    .table(Alias::new("posts"))
                    .add_column(
                        ColumnDef::new(Alias::new("style_tags"))
                            .json_binary()
                            .null(),
                    )
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .alter_table(
                Table::alter()
                    .table(Alias::new("posts"))
                    .drop_column(Alias::new("style_tags"))
                    .to_owned(),
            )
            .await
    }
}
