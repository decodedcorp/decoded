use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // comment 컬럼 추가
        manager
            .alter_table(
                Table::alter()
                    .table(Solutions::Table)
                    .add_column(
                        ColumnDef::new(Solutions::Comment)
                            .text()
                            .null()
                            .comment("Solver 코멘트 (상품 설명과 구분)"),
                    )
                    .to_owned(),
            )
            .await?;

        // COMMENT 추가 (PostgreSQL)
        manager
            .get_connection()
            .execute_unprepared(
                "COMMENT ON COLUMN solutions.comment IS 'Solver 코멘트 (상품 설명과 구분)';",
            )
            .await?;

        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // comment 컬럼 삭제
        manager
            .alter_table(
                Table::alter()
                    .table(Solutions::Table)
                    .drop_column(Solutions::Comment)
                    .to_owned(),
            )
            .await
    }
}

#[derive(DeriveIden)]
enum Solutions {
    Table,
    Comment,
}
