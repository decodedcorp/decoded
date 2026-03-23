use sea_orm_migration::{prelude::*, schema::*};

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // categories 테이블 생성
        manager
            .create_table(
                Table::create()
                    .table(Categories::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(Categories::Id)
                            .uuid()
                            .not_null()
                            .primary_key()
                            .comment("Category ID"),
                    )
                    .col(
                        ColumnDef::new(Categories::Code)
                            .string_len(50)
                            .not_null()
                            .unique_key()
                            .comment("Category code (e.g., 'fashion', 'living', 'tech', 'beauty')"),
                    )
                    .col(
                        ColumnDef::new(Categories::Name)
                            .json()
                            .not_null()
                            .comment("Multilingual category name JSONB: {\"ko\": \"패션\", \"en\": \"Fashion\", \"ja\": \"ファッション\"}"),
                    )
                    .col(
                        ColumnDef::new(Categories::IconUrl)
                            .text()
                            .comment("Icon image URL"),
                    )
                    .col(
                        ColumnDef::new(Categories::ColorHex)
                            .string_len(7)
                            .comment("Color hex code (e.g., #FF5733)"),
                    )
                    .col(
                        ColumnDef::new(Categories::Description)
                            .json()
                            .comment("Multilingual description JSONB"),
                    )
                    .col(
                        ColumnDef::new(Categories::DisplayOrder)
                            .integer()
                            .not_null()
                            .default(0)
                            .comment("Display order for sorting"),
                    )
                    .col(
                        ColumnDef::new(Categories::IsActive)
                            .boolean()
                            .not_null()
                            .default(true)
                            .comment("Active status (inactive categories cannot be selected)"),
                    )
                    .col(
                        timestamp_with_time_zone(Categories::CreatedAt)
                            .default(Expr::current_timestamp())
                            .comment("Record creation timestamp"),
                    )
                    .col(
                        timestamp_with_time_zone(Categories::UpdatedAt)
                            .default(Expr::current_timestamp())
                            .comment("Record last update timestamp"),
                    )
                    .to_owned(),
            )
            .await?;

        // updated_at 자동 업데이트 트리거 추가
        manager
            .get_connection()
            .execute_unprepared(
                r#"
                CREATE TRIGGER update_categories_updated_at
                BEFORE UPDATE ON categories
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column();
                "#,
            )
            .await?;

        // 인덱스 생성
        manager
            .create_index(
                Index::create()
                    .name("idx_categories_code")
                    .table(Categories::Table)
                    .col(Categories::Code)
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .name("idx_categories_is_active")
                    .table(Categories::Table)
                    .col(Categories::IsActive)
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .name("idx_categories_display_order")
                    .table(Categories::Table)
                    .col(Categories::DisplayOrder)
                    .to_owned(),
            )
            .await?;

        // 초기 카테고리 데이터 삽입
        manager
            .get_connection()
            .execute_unprepared(
                r#"
                INSERT INTO categories (id, code, name, display_order) VALUES
                    (gen_random_uuid(), 'fashion', '{"ko": "패션", "en": "Fashion", "ja": "ファッション"}', 1),
                    (gen_random_uuid(), 'living', '{"ko": "리빙", "en": "Living", "ja": "リビング"}', 2),
                    (gen_random_uuid(), 'tech', '{"ko": "테크", "en": "Tech", "ja": "テック"}', 3),
                    (gen_random_uuid(), 'beauty', '{"ko": "뷰티", "en": "Beauty", "ja": "ビューティー"}', 4)
                ON CONFLICT (code) DO NOTHING;
                "#,
            )
            .await?;

        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // 트리거 삭제
        manager
            .get_connection()
            .execute_unprepared(
                "DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;",
            )
            .await?;

        // categories 테이블 삭제
        manager
            .drop_table(Table::drop().table(Categories::Table).to_owned())
            .await
    }
}

#[derive(DeriveIden)]
enum Categories {
    Table,
    Id,
    Code,
    Name,
    IconUrl,
    ColorHex,
    Description,
    DisplayOrder,
    IsActive,
    CreatedAt,
    UpdatedAt,
}
