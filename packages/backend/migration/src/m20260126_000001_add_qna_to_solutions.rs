use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // qna JSONB 컬럼 추가
        manager
            .alter_table(
                Table::alter()
                    .table(Solutions::Table)
                    .add_column(
                        ColumnDef::new(Solutions::Qna)
                            .json_binary()
                            .null()
                            .comment("Question and Answer pairs from Gemini analysis"),
                    )
                    .to_owned(),
            )
            .await?;

        // COMMENT 추가 (PostgreSQL)
        manager
            .get_connection()
            .execute_unprepared(
                "COMMENT ON COLUMN solutions.qna IS 'Question and Answer pairs from Gemini analysis';",
            )
            .await?;

        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // qna 컬럼 삭제
        manager
            .alter_table(
                Table::alter()
                    .table(Solutions::Table)
                    .drop_column(Solutions::Qna)
                    .to_owned(),
            )
            .await
    }
}

#[derive(DeriveIden)]
enum Solutions {
    Table,
    Qna,
}
