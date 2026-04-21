use sea_orm_migration::{prelude::*, schema::*};

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .create_table(
                Table::create()
                    .table(PostLikes::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(PostLikes::Id)
                            .uuid()
                            .not_null()
                            .primary_key()
                            .comment("Post like ID"),
                    )
                    .col(
                        ColumnDef::new(PostLikes::PostId)
                            .uuid()
                            .not_null()
                            .comment("Post ID (references posts)"),
                    )
                    .col(
                        ColumnDef::new(PostLikes::UserId)
                            .uuid()
                            .not_null()
                            .comment("User ID (references users)"),
                    )
                    .col(
                        timestamp_with_time_zone(PostLikes::CreatedAt)
                            .default(Expr::current_timestamp())
                            .comment("Like creation timestamp"),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_post_likes_post_id")
                            .from(PostLikes::Table, PostLikes::PostId)
                            .to(Posts::Table, Posts::Id)
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_post_likes_user_id")
                            .from(PostLikes::Table, PostLikes::UserId)
                            .to(Users::Table, Users::Id)
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .name("idx_post_likes_post_user_unique")
                    .table(PostLikes::Table)
                    .col(PostLikes::PostId)
                    .col(PostLikes::UserId)
                    .unique()
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .name("idx_post_likes_post_id")
                    .table(PostLikes::Table)
                    .col(PostLikes::PostId)
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .name("idx_post_likes_user_id")
                    .table(PostLikes::Table)
                    .col(PostLikes::UserId)
                    .to_owned(),
            )
            .await?;

        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(PostLikes::Table).to_owned())
            .await
    }
}

#[derive(DeriveIden)]
enum PostLikes {
    Table,
    Id,
    PostId,
    UserId,
    CreatedAt,
}

#[derive(DeriveIden)]
enum Posts {
    Table,
    Id,
}

#[derive(DeriveIden)]
enum Users {
    Table,
    Id,
}
