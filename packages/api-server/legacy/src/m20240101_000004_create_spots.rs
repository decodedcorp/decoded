use sea_orm_migration::{prelude::*, schema::*};

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // spots 테이블 생성
        manager
            .create_table(
                Table::create()
                    .table(Spots::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(Spots::Id)
                            .uuid()
                            .not_null()
                            .primary_key()
                            .comment("Spot ID"),
                    )
                    .col(
                        ColumnDef::new(Spots::PostId)
                            .uuid()
                            .not_null()
                            .comment("Post ID (references posts)"),
                    )
                    .col(
                        ColumnDef::new(Spots::UserId)
                            .uuid()
                            .not_null()
                            .comment("User ID (references users)"),
                    )
                    .col(
                        ColumnDef::new(Spots::PositionLeft)
                            .text()
                            .not_null()
                            .comment("Position left (percentage 0-100)"),
                    )
                    .col(
                        ColumnDef::new(Spots::PositionTop)
                            .text()
                            .not_null()
                            .comment("Position top (percentage 0-100)"),
                    )
                    .col(
                        ColumnDef::new(Spots::CategoryId)
                            .uuid()
                            .not_null()
                            .comment("Category ID (references categories)"),
                    )
                    .col(
                        ColumnDef::new(Spots::Status)
                            .string_len(20)
                            .not_null()
                            .default("open")
                            .comment("Spot status: open | resolved"),
                    )
                    .col(
                        timestamp_with_time_zone(Spots::CreatedAt)
                            .default(Expr::current_timestamp())
                            .comment("Record creation timestamp"),
                    )
                    .col(
                        timestamp_with_time_zone(Spots::UpdatedAt)
                            .default(Expr::current_timestamp())
                            .comment("Record last update timestamp"),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_spots_post_id")
                            .from(Spots::Table, Spots::PostId)
                            .to(Posts::Table, Posts::Id)
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_spots_user_id")
                            .from(Spots::Table, Spots::UserId)
                            .to(Users::Table, Users::Id)
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_spots_category_id")
                            .from(Spots::Table, Spots::CategoryId)
                            .to(Categories::Table, Categories::Id),
                    )
                    .to_owned(),
            )
            .await?;

        // updated_at 자동 업데이트 트리거 추가
        manager
            .get_connection()
            .execute_unprepared(
                r#"
                CREATE TRIGGER update_spots_updated_at
                BEFORE UPDATE ON spots
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column();
                "#,
            )
            .await?;

        // 인덱스 생성
        manager
            .create_index(
                Index::create()
                    .name("idx_spots_post_id")
                    .table(Spots::Table)
                    .col(Spots::PostId)
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .name("idx_spots_category_id")
                    .table(Spots::Table)
                    .col(Spots::CategoryId)
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .name("idx_spots_status")
                    .table(Spots::Table)
                    .col(Spots::Status)
                    .to_owned(),
            )
            .await?;

        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // 트리거 삭제
        manager
            .get_connection()
            .execute_unprepared("DROP TRIGGER IF EXISTS update_spots_updated_at ON spots;")
            .await?;

        // spots 테이블 삭제
        manager
            .drop_table(Table::drop().table(Spots::Table).to_owned())
            .await
    }
}

#[derive(DeriveIden)]
enum Spots {
    Table,
    Id,
    PostId,
    UserId,
    PositionLeft,
    PositionTop,
    CategoryId,
    Status,
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

#[derive(DeriveIden)]
enum Categories {
    Table,
    Id,
}
