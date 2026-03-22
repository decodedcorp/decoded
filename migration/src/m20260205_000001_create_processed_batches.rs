use sea_orm_migration::{prelude::*, schema::*};

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .create_table(
                Table::create()
                    .table(ProcessedBatches::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(ProcessedBatches::BatchId)
                            .string_len(255)
                            .not_null()
                            .primary_key(),
                    )
                    .col(timestamp_with_time_zone(ProcessedBatches::ProcessingTimestamp).not_null())
                    .col(integer(ProcessedBatches::TotalCount).not_null())
                    .col(integer(ProcessedBatches::SuccessCount).not_null())
                    .col(integer(ProcessedBatches::PartialCount).not_null())
                    .col(integer(ProcessedBatches::FailedCount).not_null())
                    .col(integer(ProcessedBatches::ProcessingTimeMs).not_null())
                    .col(
                        timestamp_with_time_zone(ProcessedBatches::CreatedAt)
                            .default(Expr::current_timestamp()),
                    )
                    .to_owned(),
            )
            .await?;

        // 인덱스 생성 (old batches cleanup용)
        manager
            .create_index(
                Index::create()
                    .name("idx_processed_batches_created_at")
                    .table(ProcessedBatches::Table)
                    .col(ProcessedBatches::CreatedAt)
                    .to_owned(),
            )
            .await?;

        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(ProcessedBatches::Table).to_owned())
            .await
    }
}

#[derive(DeriveIden)]
enum ProcessedBatches {
    Table,
    BatchId,
    ProcessingTimestamp,
    TotalCount,
    SuccessCount,
    PartialCount,
    FailedCount,
    ProcessingTimeMs,
    CreatedAt,
}
