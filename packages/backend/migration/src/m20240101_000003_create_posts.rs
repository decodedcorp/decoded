use sea_orm_migration::{prelude::*, schema::*};

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // posts 테이블 생성
        manager
            .create_table(
                Table::create()
                    .table(Posts::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(Posts::Id)
                            .uuid()
                            .not_null()
                            .primary_key()
                            .comment("Post ID"),
                    )
                    .col(
                        ColumnDef::new(Posts::UserId)
                            .uuid()
                            .not_null()
                            .comment("User ID (references users)"),
                    )
                    .col(
                        ColumnDef::new(Posts::ImageUrl)
                            .text()
                            .not_null()
                            .comment("Cloudflare image URL"),
                    )
                    .col(
                        ColumnDef::new(Posts::MediaType)
                            .string_len(50)
                            .not_null()
                            .comment("Media type: mv | drama | movie | youtube | variety | event | paparazzi | commercial"),
                    )
                    .col(
                        ColumnDef::new(Posts::MediaTitle)
                            .string_len(255)
                            .not_null()
                            .comment("Media title (drama name, MV name, etc.)"),
                    )
                    .col(
                        ColumnDef::new(Posts::MediaMetadata)
                            .json()
                            .comment("Media metadata JSONB: { platform, timestamp, season, episode, year, ... }"),
                    )
                    .col(
                        ColumnDef::new(Posts::GroupName)
                            .string_len(100)
                            .comment("Group name (e.g., BLACKPINK) - AI suggested, user confirmed/modified"),
                    )
                    .col(
                        ColumnDef::new(Posts::ArtistName)
                            .string_len(100)
                            .comment("Artist name (e.g., Jennie) - AI suggested, user confirmed/modified"),
                    )
                    .col(
                        ColumnDef::new(Posts::Context)
                            .string_len(50)
                            .comment("Context: airport | stage | mv | red_carpet | etc"),
                    )
                    .col(
                        ColumnDef::new(Posts::ViewCount)
                            .integer()
                            .not_null()
                            .default(0)
                            .comment("Post view count"),
                    )
                    .col(
                        ColumnDef::new(Posts::Status)
                            .string_len(20)
                            .not_null()
                            .default("active")
                            .comment("Post status: active | hidden"),
                    )
                    .col(
                        timestamp_with_time_zone(Posts::CreatedAt)
                            .default(Expr::current_timestamp())
                            .comment("Record creation timestamp"),
                    )
                    .col(
                        timestamp_with_time_zone(Posts::UpdatedAt)
                            .default(Expr::current_timestamp())
                            .comment("Record last update timestamp"),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_posts_user_id")
                            .from(Posts::Table, Posts::UserId)
                            .to(Users::Table, Users::Id)
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .to_owned(),
            )
            .await?;

        // updated_at 자동 업데이트 트리거 추가
        manager
            .get_connection()
            .execute_unprepared(
                r#"
                CREATE TRIGGER update_posts_updated_at
                BEFORE UPDATE ON posts
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column();
                "#,
            )
            .await?;

        // 인덱스 생성
        manager
            .create_index(
                Index::create()
                    .name("idx_posts_user_id")
                    .table(Posts::Table)
                    .col(Posts::UserId)
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .name("idx_posts_artist_name")
                    .table(Posts::Table)
                    .col(Posts::ArtistName)
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .name("idx_posts_group_name")
                    .table(Posts::Table)
                    .col(Posts::GroupName)
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .name("idx_posts_context")
                    .table(Posts::Table)
                    .col(Posts::Context)
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .name("idx_posts_created_at")
                    .table(Posts::Table)
                    .col(Posts::CreatedAt)
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .name("idx_posts_status")
                    .table(Posts::Table)
                    .col(Posts::Status)
                    .to_owned(),
            )
            .await?;

        // pg_trgm 확장 활성화 (텍스트 검색용)
        manager
            .get_connection()
            .execute_unprepared("CREATE EXTENSION IF NOT EXISTS pg_trgm;")
            .await?;

        // artist_name, group_name에 대한 GIN 인덱스 생성 (pg_trgm 사용)
        manager
            .get_connection()
            .execute_unprepared(
                r#"
                CREATE INDEX IF NOT EXISTS idx_posts_artist_name_trgm 
                ON posts USING gin (artist_name gin_trgm_ops);
                "#,
            )
            .await?;

        manager
            .get_connection()
            .execute_unprepared(
                r#"
                CREATE INDEX IF NOT EXISTS idx_posts_group_name_trgm 
                ON posts USING gin (group_name gin_trgm_ops);
                "#,
            )
            .await?;

        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // 트리거 삭제
        manager
            .get_connection()
            .execute_unprepared("DROP TRIGGER IF EXISTS update_posts_updated_at ON posts;")
            .await?;

        // posts 테이블 삭제
        manager
            .drop_table(Table::drop().table(Posts::Table).to_owned())
            .await
    }
}

#[derive(DeriveIden)]
enum Posts {
    Table,
    Id,
    UserId,
    ImageUrl,
    MediaType,
    MediaTitle,
    MediaMetadata,
    GroupName,
    ArtistName,
    Context,
    ViewCount,
    Status,
    CreatedAt,
    UpdatedAt,
}

#[derive(DeriveIden)]
enum Users {
    Table,
    Id,
}
