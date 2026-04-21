use sea_orm_migration::{prelude::*, schema::*};

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // comments 테이블 생성
        manager
            .create_table(
                Table::create()
                    .table(Comments::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(Comments::Id)
                            .uuid()
                            .not_null()
                            .primary_key()
                            .comment("Comment ID"),
                    )
                    .col(
                        ColumnDef::new(Comments::PostId)
                            .uuid()
                            .not_null()
                            .comment("Post ID (references posts)"),
                    )
                    .col(
                        ColumnDef::new(Comments::UserId)
                            .uuid()
                            .not_null()
                            .comment("User ID (references users)"),
                    )
                    .col(
                        ColumnDef::new(Comments::ParentId)
                            .uuid()
                            .null()
                            .comment("Parent comment ID (for replies, self-reference)"),
                    )
                    .col(
                        ColumnDef::new(Comments::Content)
                            .text()
                            .not_null()
                            .comment("Comment content"),
                    )
                    .col(
                        timestamp_with_time_zone(Comments::CreatedAt)
                            .default(Expr::current_timestamp())
                            .comment("Comment creation timestamp"),
                    )
                    .col(
                        timestamp_with_time_zone(Comments::UpdatedAt)
                            .default(Expr::current_timestamp())
                            .comment("Comment last update timestamp"),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_comments_post_id")
                            .from(Comments::Table, Comments::PostId)
                            .to(Posts::Table, Posts::Id)
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_comments_user_id")
                            .from(Comments::Table, Comments::UserId)
                            .to(Users::Table, Users::Id)
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_comments_parent_id")
                            .from(Comments::Table, Comments::ParentId)
                            .to(Comments::Table, Comments::Id)
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .to_owned(),
            )
            .await?;

        // post_id 인덱스 (댓글 목록 조회 시 사용)
        manager
            .create_index(
                Index::create()
                    .name("idx_comments_post_id")
                    .table(Comments::Table)
                    .col(Comments::PostId)
                    .to_owned(),
            )
            .await?;

        // user_id 인덱스 (사용자별 댓글 조회 시 사용)
        manager
            .create_index(
                Index::create()
                    .name("idx_comments_user_id")
                    .table(Comments::Table)
                    .col(Comments::UserId)
                    .to_owned(),
            )
            .await?;

        // parent_id 인덱스 (대댓글 조회 시 사용)
        manager
            .create_index(
                Index::create()
                    .name("idx_comments_parent_id")
                    .table(Comments::Table)
                    .col(Comments::ParentId)
                    .to_owned(),
            )
            .await?;

        // updated_at 자동 업데이트 트리거 추가
        manager
            .get_connection()
            .execute_unprepared(
                r#"
                CREATE TRIGGER update_comments_updated_at
                BEFORE UPDATE ON comments
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column();
                "#,
            )
            .await?;

        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // 트리거 삭제
        manager
            .get_connection()
            .execute_unprepared("DROP TRIGGER IF EXISTS update_comments_updated_at ON comments;")
            .await?;

        // comments 테이블 삭제
        manager
            .drop_table(Table::drop().table(Comments::Table).to_owned())
            .await
    }
}

#[derive(DeriveIden)]
enum Comments {
    Table,
    Id,
    PostId,
    UserId,
    ParentId,
    Content,
    CreatedAt,
    UpdatedAt,
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
