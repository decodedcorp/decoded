use sea_orm_migration::{prelude::*, schema::*};

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .create_table(
                Table::create()
                    .table(SavedPosts::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(SavedPosts::Id)
                            .uuid()
                            .not_null()
                            .primary_key()
                            .comment("Saved post ID"),
                    )
                    .col(
                        ColumnDef::new(SavedPosts::PostId)
                            .uuid()
                            .not_null()
                            .comment("Post ID (references posts)"),
                    )
                    .col(
                        ColumnDef::new(SavedPosts::UserId)
                            .uuid()
                            .not_null()
                            .comment("User ID (references users)"),
                    )
                    .col(
                        timestamp_with_time_zone(SavedPosts::CreatedAt)
                            .default(Expr::current_timestamp())
                            .comment("Save creation timestamp"),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_saved_posts_post_id")
                            .from(SavedPosts::Table, SavedPosts::PostId)
                            .to(Posts::Table, Posts::Id)
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_saved_posts_user_id")
                            .from(SavedPosts::Table, SavedPosts::UserId)
                            .to(Users::Table, Users::Id)
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .name("idx_saved_posts_post_user_unique")
                    .table(SavedPosts::Table)
                    .col(SavedPosts::PostId)
                    .col(SavedPosts::UserId)
                    .unique()
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .name("idx_saved_posts_post_id")
                    .table(SavedPosts::Table)
                    .col(SavedPosts::PostId)
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .name("idx_saved_posts_user_id")
                    .table(SavedPosts::Table)
                    .col(SavedPosts::UserId)
                    .to_owned(),
            )
            .await?;

        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(SavedPosts::Table).to_owned())
            .await
    }
}

#[derive(DeriveIden)]
enum SavedPosts {
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
