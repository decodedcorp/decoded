use sea_orm_migration::{prelude::*, schema::*};

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // view_logs 테이블 생성
        manager
            .create_table(
                Table::create()
                    .table(ViewLogs::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(ViewLogs::Id)
                            .uuid()
                            .not_null()
                            .primary_key()
                            .comment("View log ID"),
                    )
                    .col(
                        ColumnDef::new(ViewLogs::UserId)
                            .uuid()
                            .null()
                            .comment("User ID (references users, nullable for anonymous views)"),
                    )
                    .col(
                        ColumnDef::new(ViewLogs::ReferenceType)
                            .string_len(20)
                            .not_null()
                            .comment("Reference type: 'post' or 'spot'"),
                    )
                    .col(
                        ColumnDef::new(ViewLogs::ReferenceId)
                            .uuid()
                            .not_null()
                            .comment("Referenced Post or Spot ID"),
                    )
                    .col(
                        timestamp_with_time_zone(ViewLogs::CreatedAt)
                            .default(Expr::current_timestamp())
                            .not_null()
                            .comment("View timestamp"),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_view_logs_user_id")
                            .from(ViewLogs::Table, ViewLogs::UserId)
                            .to(Users::Table, Users::Id)
                            .on_delete(ForeignKeyAction::SetNull),
                    )
                    .to_owned(),
            )
            .await?;

        // 인덱스 추가
        manager
            .create_index(
                Index::create()
                    .name("idx_view_logs_user_id")
                    .table(ViewLogs::Table)
                    .col(ViewLogs::UserId)
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .name("idx_view_logs_reference")
                    .table(ViewLogs::Table)
                    .col(ViewLogs::ReferenceType)
                    .col(ViewLogs::ReferenceId)
                    .to_owned(),
            )
            .await?;

        // 중복 조회 방지 및 뱃지 조건 체크를 위한 복합 인덱스
        manager
            .create_index(
                Index::create()
                    .name("idx_view_logs_user_reference_created")
                    .table(ViewLogs::Table)
                    .col(ViewLogs::UserId)
                    .col(ViewLogs::ReferenceType)
                    .col(ViewLogs::ReferenceId)
                    .col(ViewLogs::CreatedAt)
                    .to_owned(),
            )
            .await?;

        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(ViewLogs::Table).to_owned())
            .await
    }
}

#[derive(DeriveIden)]
enum ViewLogs {
    Table,
    Id,
    UserId,
    ReferenceType,
    ReferenceId,
    CreatedAt,
}

#[derive(DeriveIden)]
enum Users {
    Table,
    Id,
}
