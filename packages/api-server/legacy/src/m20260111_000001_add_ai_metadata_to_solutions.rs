use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // ai_metadata JSONB 컬럼 추가
        manager
            .alter_table(
                Table::alter()
                    .table(Solutions::Table)
                    .add_column(
                        ColumnDef::new(Solutions::AiMetadata)
                            .json_binary()
                            .null()
                            .comment("Gemini 생성 메타데이터 (qa_pairs, keywords 등)"),
                    )
                    .to_owned(),
            )
            .await?;

        // COMMENT 추가 (PostgreSQL)
        manager
            .get_connection()
            .execute_unprepared(
                "COMMENT ON COLUMN solutions.ai_metadata IS 'Gemini 생성 메타데이터 (qa_pairs, keywords 등)';",
            )
            .await?;

        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // ai_metadata 컬럼 삭제
        manager
            .alter_table(
                Table::alter()
                    .table(Solutions::Table)
                    .drop_column(Solutions::AiMetadata)
                    .to_owned(),
            )
            .await
    }
}

#[derive(DeriveIden)]
enum Solutions {
    Table,
    AiMetadata,
}
