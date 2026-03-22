use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .alter_table(
                Table::alter()
                    .table(Posts::Table)
                    .add_column(ColumnDef::new(Posts::PostMagazineId).uuid().null())
                    .to_owned(),
            )
            .await?;

        manager
            .create_foreign_key(
                ForeignKey::create()
                    .name("fk_posts_post_magazine_id")
                    .from(Posts::Table, Posts::PostMagazineId)
                    .to(PostMagazines::Table, PostMagazines::Id)
                    .on_delete(ForeignKeyAction::SetNull)
                    .to_owned(),
            )
            .await?;

        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_foreign_key(
                ForeignKey::drop()
                    .table(Posts::Table)
                    .name("fk_posts_post_magazine_id")
                    .to_owned(),
            )
            .await?;

        manager
            .alter_table(
                Table::alter()
                    .table(Posts::Table)
                    .drop_column(Posts::PostMagazineId)
                    .to_owned(),
            )
            .await
    }
}

#[derive(DeriveIden)]
enum Posts {
    Table,
    PostMagazineId,
}

#[derive(DeriveIden)]
enum PostMagazines {
    Table,
    Id,
}
