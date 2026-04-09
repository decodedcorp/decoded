use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .alter_table(
                Table::alter()
                    .table(Alias::new("posts"))
                    .add_column(ColumnDef::new(Alias::new("image_width")).integer().null())
                    .add_column(ColumnDef::new(Alias::new("image_height")).integer().null())
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .alter_table(
                Table::alter()
                    .table(Alias::new("posts"))
                    .drop_column(Alias::new("image_width"))
                    .drop_column(Alias::new("image_height"))
                    .to_owned(),
            )
            .await
    }
}
