use sea_orm_migration::{prelude::*, schema::*};

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // search_logs 테이블 생성
        manager
            .create_table(
                Table::create()
                    .table(SearchLogs::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(SearchLogs::Id)
                            .uuid()
                            .not_null()
                            .primary_key()
                            .comment("Search log ID"),
                    )
                    .col(
                        ColumnDef::new(SearchLogs::UserId)
                            .uuid()
                            .comment("User ID (nullable for anonymous users)"),
                    )
                    .col(
                        ColumnDef::new(SearchLogs::Query)
                            .string_len(255)
                            .not_null()
                            .comment("Search query"),
                    )
                    .col(
                        ColumnDef::new(SearchLogs::Filters)
                            .json()
                            .comment("Search filters (JSONB)"),
                    )
                    .col(
                        timestamp_with_time_zone(SearchLogs::CreatedAt)
                            .default(Expr::current_timestamp())
                            .comment("Search timestamp"),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_search_logs_user_id")
                            .from(SearchLogs::Table, SearchLogs::UserId)
                            .to(Users::Table, Users::Id)
                            .on_delete(ForeignKeyAction::SetNull)
                            .on_update(ForeignKeyAction::Cascade),
                    )
                    .to_owned(),
            )
            .await?;

        // 인덱스 생성
        manager
            .create_index(
                Index::create()
                    .name("idx_search_logs_user_id")
                    .table(SearchLogs::Table)
                    .col(SearchLogs::UserId)
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .name("idx_search_logs_query")
                    .table(SearchLogs::Table)
                    .col(SearchLogs::Query)
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .name("idx_search_logs_created_at")
                    .table(SearchLogs::Table)
                    .col(SearchLogs::CreatedAt)
                    .to_owned(),
            )
            .await?;

        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // search_logs 테이블 삭제
        manager
            .drop_table(Table::drop().table(SearchLogs::Table).to_owned())
            .await
    }
}

#[derive(DeriveIden)]
enum SearchLogs {
    Table,
    Id,
    UserId,
    Query,
    Filters,
    CreatedAt,
}

#[derive(DeriveIden)]
enum Users {
    Table,
    Id,
}
