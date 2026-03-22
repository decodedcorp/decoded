use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .alter_table(
                Table::alter()
                    .table(Posts::Table)
                    .add_column(
                        ColumnDef::new(Posts::AiSummary)
                            .text()
                            .null()
                            .comment("AI가 생성한 포스트 요약 (1-2문장)"),
                    )
                    .to_owned(),
            )
            .await?;

        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .alter_table(
                Table::alter()
                    .table(Posts::Table)
                    .drop_column(Posts::AiSummary)
                    .to_owned(),
            )
            .await
    }
}

#[derive(DeriveIden)]
enum Posts {
    Table,
    AiSummary,
}
