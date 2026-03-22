use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .create_table(
                Table::create()
                    .table(Curations::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(Curations::Id)
                            .uuid()
                            .not_null()
                            .primary_key(),
                    )
                    .col(ColumnDef::new(Curations::Title).string_len(255).not_null())
                    .col(ColumnDef::new(Curations::Description).text())
                    .col(ColumnDef::new(Curations::CoverImageUrl).text())
                    .col(
                        ColumnDef::new(Curations::DisplayOrder)
                            .integer()
                            .not_null()
                            .default(0),
                    )
                    .col(
                        ColumnDef::new(Curations::IsActive)
                            .boolean()
                            .not_null()
                            .default(true),
                    )
                    .col(ColumnDef::new(Curations::CreatedAt).timestamp().not_null())
                    .col(ColumnDef::new(Curations::UpdatedAt).timestamp().not_null())
                    .to_owned(),
            )
            .await?;

        // 인덱스
        manager
            .create_index(
                Index::create()
                    .if_not_exists()
                    .name("idx_curations_is_active_display_order")
                    .table(Curations::Table)
                    .col(Curations::IsActive)
                    .col(Curations::DisplayOrder)
                    .to_owned(),
            )
            .await?;

        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(Curations::Table).to_owned())
            .await
    }
}

#[derive(Iden)]
enum Curations {
    Table,
    Id,
    Title,
    Description,
    CoverImageUrl,
    DisplayOrder,
    IsActive,
    CreatedAt,
    UpdatedAt,
}
