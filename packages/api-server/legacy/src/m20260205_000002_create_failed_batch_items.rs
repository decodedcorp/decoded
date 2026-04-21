use sea_orm_migration::{prelude::*, schema::*};

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .create_table(
                Table::create()
                    .table(FailedBatchItems::Table)
                    .if_not_exists()
                    .col(uuid(FailedBatchItems::Id).primary_key())
                    .col(
                        ColumnDef::new(FailedBatchItems::ItemId)
                            .string_len(255)
                            .not_null(),
                    )
                    .col(
                        ColumnDef::new(FailedBatchItems::BatchId)
                            .string_len(255)
                            .not_null(),
                    )
                    .col(text(FailedBatchItems::Url).not_null())
                    .col(
                        ColumnDef::new(FailedBatchItems::Status)
                            .string_len(50)
                            .not_null(),
                    )
                    .col(text_null(FailedBatchItems::ErrorMessage))
                    .col(integer(FailedBatchItems::RetryCount).not_null().default(0))
                    .col(timestamp_with_time_zone(FailedBatchItems::NextRetryAt).not_null())
                    .col(
                        timestamp_with_time_zone(FailedBatchItems::CreatedAt)
                            .default(Expr::current_timestamp()),
                    )
                    .col(
                        timestamp_with_time_zone(FailedBatchItems::UpdatedAt)
                            .default(Expr::current_timestamp()),
                    )
                    .to_owned(),
            )
            .await?;

        // 재시도 대상 조회용 인덱스 (retry_count < 3 조건 포함)
        manager
            .create_index(
                Index::create()
                    .name("idx_failed_items_retry")
                    .table(FailedBatchItems::Table)
                    .col(FailedBatchItems::NextRetryAt)
                    .to_owned(),
            )
            .await?;

        // item_id 조회용 인덱스
        manager
            .create_index(
                Index::create()
                    .name("idx_failed_items_item_id")
                    .table(FailedBatchItems::Table)
                    .col(FailedBatchItems::ItemId)
                    .to_owned(),
            )
            .await?;

        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(FailedBatchItems::Table).to_owned())
            .await
    }
}

#[derive(DeriveIden)]
enum FailedBatchItems {
    Table,
    Id,
    ItemId,
    BatchId,
    Url,
    Status,
    ErrorMessage,
    RetryCount,
    NextRetryAt,
    CreatedAt,
    UpdatedAt,
}
