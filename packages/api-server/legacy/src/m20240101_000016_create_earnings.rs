use sea_orm_migration::{prelude::*, schema::*};

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // earnings 테이블 생성 (구조만, Phase 17에서 데이터 삽입)
        manager
            .create_table(
                Table::create()
                    .table(Earnings::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(Earnings::Id)
                            .uuid()
                            .not_null()
                            .primary_key()
                            .comment("Earning ID"),
                    )
                    .col(
                        ColumnDef::new(Earnings::UserId)
                            .uuid()
                            .not_null()
                            .comment("User ID (references users)"),
                    )
                    .col(
                        ColumnDef::new(Earnings::SolutionId)
                            .uuid()
                            .not_null()
                            .comment("Solution ID (references solutions)"),
                    )
                    .col(
                        ColumnDef::new(Earnings::Amount)
                            .decimal_len(12, 2)
                            .not_null()
                            .comment("Earning amount"),
                    )
                    .col(
                        ColumnDef::new(Earnings::Currency)
                            .string_len(10)
                            .not_null()
                            .default("KRW")
                            .comment("Currency code (KRW, USD, etc.)"),
                    )
                    .col(
                        ColumnDef::new(Earnings::Status)
                            .string_len(20)
                            .not_null()
                            .default("pending")
                            .comment("Earning status: pending | confirmed | settled"),
                    )
                    .col(
                        ColumnDef::new(Earnings::AffiliatePlatform)
                            .string_len(50)
                            .null()
                            .comment("Affiliate platform name (e.g., Rakuten)"),
                    )
                    .col(
                        timestamp_with_time_zone(Earnings::CreatedAt)
                            .default(Expr::current_timestamp())
                            .not_null()
                            .comment("Earning creation timestamp"),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_earnings_user_id")
                            .from(Earnings::Table, Earnings::UserId)
                            .to(Users::Table, Users::Id)
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_earnings_solution_id")
                            .from(Earnings::Table, Earnings::SolutionId)
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
                    .name("idx_earnings_user_id")
                    .table(Earnings::Table)
                    .col(Earnings::UserId)
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .name("idx_earnings_solution_id")
                    .table(Earnings::Table)
                    .col(Earnings::SolutionId)
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .name("idx_earnings_status")
                    .table(Earnings::Table)
                    .col(Earnings::Status)
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .name("idx_earnings_created_at")
                    .table(Earnings::Table)
                    .col(Earnings::CreatedAt)
                    .to_owned(),
            )
            .await?;

        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(Earnings::Table).to_owned())
            .await
    }
}

#[derive(DeriveIden)]
enum Earnings {
    Table,
    Id,
    UserId,
    SolutionId,
    Amount,
    Currency,
    Status,
    AffiliatePlatform,
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
