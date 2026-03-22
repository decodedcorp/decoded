use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .create_table(
                Table::create()
                    .table(PostMagazines::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(PostMagazines::Id)
                            .uuid()
                            .not_null()
                            .primary_key()
                            .extra("DEFAULT gen_random_uuid()"),
                    )
                    .col(
                        ColumnDef::new(PostMagazines::Title)
                            .string()
                            .not_null()
                            .default("Untitled"),
                    )
                    .col(ColumnDef::new(PostMagazines::Subtitle).text().null())
                    .col(ColumnDef::new(PostMagazines::Keyword).string().null())
                    .col(
                        ColumnDef::new(PostMagazines::LayoutJson)
                            .json_binary()
                            .null(),
                    )
                    .col(
                        ColumnDef::new(PostMagazines::Status)
                            .string()
                            .not_null()
                            .default("draft"),
                    )
                    .col(ColumnDef::new(PostMagazines::ReviewSummary).text().null())
                    .col(ColumnDef::new(PostMagazines::ThreadId).string().null())
                    .col(
                        ColumnDef::new(PostMagazines::ErrorLog)
                            .json_binary()
                            .default("[]"),
                    )
                    .col(
                        ColumnDef::new(PostMagazines::CreatedAt)
                            .timestamp_with_time_zone()
                            .not_null()
                            .default(Expr::current_timestamp()),
                    )
                    .col(
                        ColumnDef::new(PostMagazines::UpdatedAt)
                            .timestamp_with_time_zone()
                            .not_null()
                            .default(Expr::current_timestamp()),
                    )
                    .col(
                        ColumnDef::new(PostMagazines::PublishedAt)
                            .timestamp_with_time_zone()
                            .null(),
                    )
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .name("idx_post_magazines_status")
                    .table(PostMagazines::Table)
                    .col(PostMagazines::Status)
                    .to_owned(),
            )
            .await?;

        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(PostMagazines::Table).to_owned())
            .await
    }
}

#[derive(DeriveIden)]
enum PostMagazines {
    Table,
    Id,
    Title,
    Subtitle,
    Keyword,
    LayoutJson,
    Status,
    ReviewSummary,
    ThreadId,
    ErrorLog,
    CreatedAt,
    UpdatedAt,
    PublishedAt,
}
