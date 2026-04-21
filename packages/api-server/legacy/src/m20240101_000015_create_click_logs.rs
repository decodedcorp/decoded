use sea_orm_migration::{prelude::*, schema::*};

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // click_logs 테이블 생성
        manager
            .create_table(
                Table::create()
                    .table(ClickLogs::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(ClickLogs::Id)
                            .uuid()
                            .not_null()
                            .primary_key()
                            .comment("Click log ID"),
                    )
                    .col(
                        ColumnDef::new(ClickLogs::UserId)
                            .uuid()
                            .null()
                            .comment("User ID (references users, nullable for anonymous clicks)"),
                    )
                    .col(
                        ColumnDef::new(ClickLogs::SolutionId)
                            .uuid()
                            .not_null()
                            .comment("Solution ID (references solutions)"),
                    )
                    .col(
                        ColumnDef::new(ClickLogs::IpAddress)
                            .string_len(45)
                            .not_null()
                            .comment("IP address (IPv4 or IPv6)"),
                    )
                    .col(
                        ColumnDef::new(ClickLogs::UserAgent)
                            .text()
                            .null()
                            .comment("User agent string"),
                    )
                    .col(
                        ColumnDef::new(ClickLogs::Referrer)
                            .text()
                            .null()
                            .comment("HTTP referrer URL"),
                    )
                    .col(
                        timestamp_with_time_zone(ClickLogs::CreatedAt)
                            .default(Expr::current_timestamp())
                            .not_null()
                            .comment("Click timestamp"),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_click_logs_user_id")
                            .from(ClickLogs::Table, ClickLogs::UserId)
                            .to(Users::Table, Users::Id)
                            .on_delete(ForeignKeyAction::SetNull),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_click_logs_solution_id")
                            .from(ClickLogs::Table, ClickLogs::SolutionId)
                            .to(Solutions::Table, Solutions::Id)
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .to_owned(),
            )
            .await?;

        // 인덱스 추가
        manager
            .create_index(
                Index::create()
                    .name("idx_click_logs_solution_id")
                    .table(ClickLogs::Table)
                    .col(ClickLogs::SolutionId)
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .name("idx_click_logs_user_id")
                    .table(ClickLogs::Table)
                    .col(ClickLogs::UserId)
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .name("idx_click_logs_created_at")
                    .table(ClickLogs::Table)
                    .col(ClickLogs::CreatedAt)
                    .to_owned(),
            )
            .await?;

        // 부정 클릭 방지를 위한 복합 인덱스 (user_id + solution_id + created_at)
        manager
            .create_index(
                Index::create()
                    .name("idx_click_logs_user_solution_created")
                    .table(ClickLogs::Table)
                    .col(ClickLogs::UserId)
                    .col(ClickLogs::SolutionId)
                    .col(ClickLogs::CreatedAt)
                    .to_owned(),
            )
            .await?;

        // IP 기반 Rate Limiting을 위한 인덱스
        manager
            .create_index(
                Index::create()
                    .name("idx_click_logs_ip_created")
                    .table(ClickLogs::Table)
                    .col(ClickLogs::IpAddress)
                    .col(ClickLogs::CreatedAt)
                    .to_owned(),
            )
            .await?;

        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(ClickLogs::Table).to_owned())
            .await
    }
}

#[derive(DeriveIden)]
enum ClickLogs {
    Table,
    Id,
    UserId,
    SolutionId,
    IpAddress,
    UserAgent,
    Referrer,
    CreatedAt,
}

#[derive(DeriveIden)]
enum Users {
    Table,
    Id,
}

#[derive(DeriveIden)]
enum Solutions {
    Table,
    Id,
}
