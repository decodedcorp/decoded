use sea_orm_migration::{prelude::*, schema::*};

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // settlements 테이블 생성 (구조만, Phase 17에서 데이터 삽입)
        manager
            .create_table(
                Table::create()
                    .table(Settlements::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(Settlements::Id)
                            .uuid()
                            .not_null()
                            .primary_key()
                            .comment("Settlement ID"),
                    )
                    .col(
                        ColumnDef::new(Settlements::UserId)
                            .uuid()
                            .not_null()
                            .comment("User ID (references users)"),
                    )
                    .col(
                        ColumnDef::new(Settlements::Amount)
                            .decimal_len(12, 2)
                            .not_null()
                            .comment("Settlement amount"),
                    )
                    .col(
                        ColumnDef::new(Settlements::Currency)
                            .string_len(10)
                            .not_null()
                            .default("KRW")
                            .comment("Currency code (KRW, USD, etc.)"),
                    )
                    .col(
                        ColumnDef::new(Settlements::Status)
                            .string_len(20)
                            .not_null()
                            .default("pending")
                            .comment("Settlement status: pending | processing | completed | failed"),
                    )
                    .col(
                        ColumnDef::new(Settlements::BankInfo)
                            .json_binary()
                            .null()
                            .comment("Bank account information (JSONB): { bank_code, account_number, account_holder }"),
                    )
                    .col(
                        ColumnDef::new(Settlements::ProcessedAt)
                            .timestamp_with_time_zone()
                            .null()
                            .comment("Settlement processing timestamp"),
                    )
                    .col(
                        timestamp_with_time_zone(Settlements::CreatedAt)
                            .default(Expr::current_timestamp())
                            .not_null()
                            .comment("Settlement creation timestamp"),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_settlements_user_id")
                            .from(Settlements::Table, Settlements::UserId)
                            .to(Users::Table, Users::Id)
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .to_owned(),
            )
            .await?;

        // 인덱스 추가
        manager
            .create_index(
                Index::create()
                    .name("idx_settlements_user_id")
                    .table(Settlements::Table)
                    .col(Settlements::UserId)
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .name("idx_settlements_status")
                    .table(Settlements::Table)
                    .col(Settlements::Status)
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .name("idx_settlements_created_at")
                    .table(Settlements::Table)
                    .col(Settlements::CreatedAt)
                    .to_owned(),
            )
            .await?;

        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(Settlements::Table).to_owned())
            .await
    }
}

#[derive(DeriveIden)]
enum Settlements {
    Table,
    Id,
    UserId,
    Amount,
    Currency,
    Status,
    BankInfo,
    ProcessedAt,
    CreatedAt,
}

#[derive(DeriveIden)]
enum Users {
    Table,
    Id,
}
