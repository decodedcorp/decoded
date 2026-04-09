use sea_orm_migration::{prelude::*, schema::*};

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .create_table(
                Table::create()
                    .table(TrySpotTags::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(TrySpotTags::Id)
                            .uuid()
                            .not_null()
                            .primary_key()
                            .comment("Try-Spot tag ID"),
                    )
                    .col(
                        ColumnDef::new(TrySpotTags::TryPostId)
                            .uuid()
                            .not_null()
                            .comment("Try post ID (references posts)"),
                    )
                    .col(
                        ColumnDef::new(TrySpotTags::SpotId)
                            .uuid()
                            .not_null()
                            .comment("Spot ID (references spots)"),
                    )
                    .col(
                        timestamp_with_time_zone(TrySpotTags::CreatedAt)
                            .default(Expr::current_timestamp())
                            .comment("Tag creation timestamp"),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_try_spot_tags_try_post_id")
                            .from(TrySpotTags::Table, TrySpotTags::TryPostId)
                            .to(Posts::Table, Posts::Id)
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_try_spot_tags_spot_id")
                            .from(TrySpotTags::Table, TrySpotTags::SpotId)
                            .to(Spots::Table, Spots::Id)
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .to_owned(),
            )
            .await?;

        // (try_post_id, spot_id) 유니크 인덱스
        manager
            .create_index(
                Index::create()
                    .name("idx_try_spot_tags_try_post_spot_unique")
                    .table(TrySpotTags::Table)
                    .col(TrySpotTags::TryPostId)
                    .col(TrySpotTags::SpotId)
                    .unique()
                    .to_owned(),
            )
            .await?;

        // spot_id 인덱스 (스팟별 Try 조회용)
        manager
            .create_index(
                Index::create()
                    .name("idx_try_spot_tags_spot_id")
                    .table(TrySpotTags::Table)
                    .col(TrySpotTags::SpotId)
                    .to_owned(),
            )
            .await?;

        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(TrySpotTags::Table).to_owned())
            .await
    }
}

#[derive(DeriveIden)]
enum TrySpotTags {
    Table,
    Id,
    TryPostId,
    SpotId,
    CreatedAt,
}

#[derive(DeriveIden)]
enum Posts {
    Table,
    Id,
}

#[derive(DeriveIden)]
enum Spots {
    Table,
    Id,
}
