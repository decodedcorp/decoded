use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // 1. Rename ai_metadata to metadata
        manager
            .alter_table(
                Table::alter()
                    .table(Solutions::Table)
                    .rename_column(Solutions::AiMetadata, Solutions::Metadata)
                    .to_owned(),
            )
            .await?;

        // 2. Add keywords column
        manager
            .alter_table(
                Table::alter()
                    .table(Solutions::Table)
                    .add_column(
                        ColumnDef::new(Solutions::Keywords)
                            .json_binary()
                            .null()
                            .comment("Extracted keywords from AI analysis (multi-language)"),
                    )
                    .to_owned(),
            )
            .await?;

        // 3. Update comment for metadata column (PostgreSQL specific)
        manager
            .get_connection()
            .execute_unprepared(
                "COMMENT ON COLUMN solutions.metadata IS 'Product metadata (price, brand, etc.)';",
            )
            .await?;

        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // 1. Drop keywords column
        manager
            .alter_table(
                Table::alter()
                    .table(Solutions::Table)
                    .drop_column(Solutions::Keywords)
                    .to_owned(),
            )
            .await?;

        // 2. Rename metadata back to ai_metadata
        manager
            .alter_table(
                Table::alter()
                    .table(Solutions::Table)
                    .rename_column(Solutions::Metadata, Solutions::AiMetadata)
                    .to_owned(),
            )
            .await?;

        // 3. Restore original comment
        manager
            .get_connection()
            .execute_unprepared(
                "COMMENT ON COLUMN solutions.ai_metadata IS 'Gemini 생성 메타데이터 (qa_pairs, keywords 등)';",
            )
            .await?;

        Ok(())
    }
}

#[derive(DeriveIden)]
enum Solutions {
    Table,
    AiMetadata,
    Metadata,
    Keywords,
}
