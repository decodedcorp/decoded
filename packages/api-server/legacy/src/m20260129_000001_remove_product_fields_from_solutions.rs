use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // Drop product-specific columns from solutions table
        manager
            .alter_table(
                Table::alter()
                    .table(Solutions::Table)
                    .drop_column(Solutions::Brand)
                    .drop_column(Solutions::PriceAmount)
                    .drop_column(Solutions::PriceCurrency)
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // Restore columns (nullable to avoid data issues)
        manager
            .alter_table(
                Table::alter()
                    .table(Solutions::Table)
                    .add_column(ColumnDef::new(Solutions::Brand).string().null())
                    .add_column(ColumnDef::new(Solutions::PriceAmount).decimal().null())
                    .add_column(
                        ColumnDef::new(Solutions::PriceCurrency)
                            .string()
                            .not_null()
                            .default("KRW"),
                    )
                    .to_owned(),
            )
            .await
    }
}

#[derive(DeriveIden)]
enum Solutions {
    Table,
    Brand,
    PriceAmount,
    PriceCurrency,
}
