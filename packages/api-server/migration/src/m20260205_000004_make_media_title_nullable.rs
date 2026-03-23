use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // media_title 컬럼을 nullable로 변경
        manager
            .alter_table(
                Table::alter()
                    .table(Posts::Table)
                    .modify_column(ColumnDef::new(Posts::MediaTitle).string_len(255).null())
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // 롤백: media_title을 NOT NULL로 되돌림
        // 주의: NULL 값이 있는 경우 실패할 수 있음
        manager
            .alter_table(
                Table::alter()
                    .table(Posts::Table)
                    .modify_column(ColumnDef::new(Posts::MediaTitle).string_len(255).not_null())
                    .to_owned(),
            )
            .await
    }
}

#[derive(DeriveIden)]
enum Posts {
    Table,
    MediaTitle,
}
