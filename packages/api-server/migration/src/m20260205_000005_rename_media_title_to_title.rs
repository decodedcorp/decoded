use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // media_title 컬럼명을 title로 변경
        manager
            .alter_table(
                Table::alter()
                    .table(Posts::Table)
                    .rename_column(Posts::MediaTitle, Posts::Title)
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // 롤백: title을 media_title로 되돌림
        manager
            .alter_table(
                Table::alter()
                    .table(Posts::Table)
                    .rename_column(Posts::Title, Posts::MediaTitle)
                    .to_owned(),
            )
            .await
    }
}

#[derive(DeriveIden)]
enum Posts {
    Table,
    MediaTitle,
    Title,
}
