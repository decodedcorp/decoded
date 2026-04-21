use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .create_table(
                Table::create()
                    .table(CurationPosts::Table)
                    .if_not_exists()
                    .col(ColumnDef::new(CurationPosts::CurationId).uuid().not_null())
                    .col(ColumnDef::new(CurationPosts::PostId).uuid().not_null())
                    .col(
                        ColumnDef::new(CurationPosts::DisplayOrder)
                            .integer()
                            .not_null()
                            .default(0),
                    )
                    .primary_key(
                        Index::create()
                            .col(CurationPosts::CurationId)
                            .col(CurationPosts::PostId),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_curation_posts_curation_id")
                            .from(CurationPosts::Table, CurationPosts::CurationId)
                            .to(Curations::Table, Curations::Id)
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_curation_posts_post_id")
                            .from(CurationPosts::Table, CurationPosts::PostId)
                            .to(Posts::Table, Posts::Id)
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .to_owned(),
            )
            .await?;

        // 인덱스
        manager
            .create_index(
                Index::create()
                    .if_not_exists()
                    .name("idx_curation_posts_curation_id_display_order")
                    .table(CurationPosts::Table)
                    .col(CurationPosts::CurationId)
                    .col(CurationPosts::DisplayOrder)
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .if_not_exists()
                    .name("idx_curation_posts_post_id")
                    .table(CurationPosts::Table)
                    .col(CurationPosts::PostId)
                    .to_owned(),
            )
            .await?;

        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(CurationPosts::Table).to_owned())
            .await
    }
}

#[derive(Iden)]
enum CurationPosts {
    Table,
    CurationId,
    PostId,
    DisplayOrder,
}

#[derive(Iden)]
enum Curations {
    Table,
    Id,
}

#[derive(Iden)]
enum Posts {
    Table,
    Id,
}
