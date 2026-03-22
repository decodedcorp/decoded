use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // Add link_type column to solutions table
        manager
            .alter_table(
                Table::alter()
                    .table(Solutions::Table)
                    .add_column(
                        ColumnDef::new(Solutions::LinkType)
                            .string_len(20)
                            .null()
                            .default("other")
                            .comment("Link type: product | article | video | other"),
                    )
                    .to_owned(),
            )
            .await?;

        // Add comment (PostgreSQL specific)
        manager
            .get_connection()
            .execute_unprepared(
                "COMMENT ON COLUMN solutions.link_type IS 'Link type: product | article | video | other';",
            )
            .await?;

        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // Drop link_type column
        manager
            .alter_table(
                Table::alter()
                    .table(Solutions::Table)
                    .drop_column(Solutions::LinkType)
                    .to_owned(),
            )
            .await
    }
}

#[derive(DeriveIden)]
enum Solutions {
    Table,
    LinkType,
}
