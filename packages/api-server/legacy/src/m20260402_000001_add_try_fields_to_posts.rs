use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // parent_post_id 컬럼 추가
        manager
            .alter_table(
                Table::alter()
                    .table(Posts::Table)
                    .add_column(
                        ColumnDef::new(Posts::ParentPostId)
                            .uuid()
                            .null()
                            .comment("Try 포스트의 원본 포스트 ID (null이면 일반 포스트)"),
                    )
                    .to_owned(),
            )
            .await?;

        // post_type 컬럼 추가
        manager
            .alter_table(
                Table::alter()
                    .table(Posts::Table)
                    .add_column(
                        ColumnDef::new(Posts::PostType)
                            .string_len(20)
                            .null()
                            .comment("post: 일반, try: 사용자 시도 공유"),
                    )
                    .to_owned(),
            )
            .await?;

        // 자기참조 FK
        manager
            .create_foreign_key(
                ForeignKey::create()
                    .name("fk_posts_parent_post_id")
                    .from(Posts::Table, Posts::ParentPostId)
                    .to(Posts::Table, Posts::Id)
                    .on_delete(ForeignKeyAction::SetNull)
                    .to_owned(),
            )
            .await?;

        // parent_post_id 인덱스
        manager
            .create_index(
                Index::create()
                    .name("idx_posts_parent_post_id")
                    .table(Posts::Table)
                    .col(Posts::ParentPostId)
                    .to_owned(),
            )
            .await?;

        // post_type 인덱스
        manager
            .create_index(
                Index::create()
                    .name("idx_posts_post_type")
                    .table(Posts::Table)
                    .col(Posts::PostType)
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
                    .name("fk_posts_parent_post_id")
                    .to_owned(),
            )
            .await?;

        manager
            .alter_table(
                Table::alter()
                    .table(Posts::Table)
                    .drop_column(Posts::ParentPostId)
                    .drop_column(Posts::PostType)
                    .to_owned(),
            )
            .await
    }
}

#[derive(DeriveIden)]
enum Posts {
    Table,
    Id,
    ParentPostId,
    PostType,
}
