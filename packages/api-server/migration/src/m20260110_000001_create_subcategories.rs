use sea_orm_migration::{prelude::*, schema::*};

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // subcategories 테이블 생성
        manager
            .create_table(
                Table::create()
                    .table(Subcategories::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(Subcategories::Id)
                            .uuid()
                            .not_null()
                            .primary_key()
                            .comment("Subcategory ID"),
                    )
                    .col(
                        ColumnDef::new(Subcategories::CategoryId)
                            .uuid()
                            .not_null()
                            .comment("Parent category ID (references categories)"),
                    )
                    .col(
                        ColumnDef::new(Subcategories::Code)
                            .string_len(50)
                            .not_null()
                            .comment("Subcategory code (e.g., 'headwear', 'tops', 'smartphone')"),
                    )
                    .col(
                        ColumnDef::new(Subcategories::Name)
                            .json()
                            .not_null()
                            .comment("Multilingual subcategory name JSONB: {\"ko\": \"모자\", \"en\": \"Headwear\"}"),
                    )
                    .col(
                        ColumnDef::new(Subcategories::Description)
                            .json()
                            .comment("Multilingual description JSONB"),
                    )
                    .col(
                        ColumnDef::new(Subcategories::DisplayOrder)
                            .integer()
                            .not_null()
                            .default(0)
                            .comment("Display order for sorting"),
                    )
                    .col(
                        ColumnDef::new(Subcategories::IsActive)
                            .boolean()
                            .not_null()
                            .default(true)
                            .comment("Active status"),
                    )
                    .col(
                        timestamp_with_time_zone(Subcategories::CreatedAt)
                            .default(Expr::current_timestamp())
                            .comment("Record creation timestamp"),
                    )
                    .col(
                        timestamp_with_time_zone(Subcategories::UpdatedAt)
                            .default(Expr::current_timestamp())
                            .comment("Record last update timestamp"),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_subcategories_category_id")
                            .from(Subcategories::Table, Subcategories::CategoryId)
                            .to(Categories::Table, Categories::Id)
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .to_owned(),
            )
            .await?;

        // Unique constraint: (category_id, code)
        manager
            .create_index(
                Index::create()
                    .name("idx_subcategories_category_code_unique")
                    .table(Subcategories::Table)
                    .col(Subcategories::CategoryId)
                    .col(Subcategories::Code)
                    .unique()
                    .to_owned(),
            )
            .await?;

        // 인덱스 생성
        manager
            .create_index(
                Index::create()
                    .name("idx_subcategories_category_id")
                    .table(Subcategories::Table)
                    .col(Subcategories::CategoryId)
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .name("idx_subcategories_is_active")
                    .table(Subcategories::Table)
                    .col(Subcategories::IsActive)
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .name("idx_subcategories_display_order")
                    .table(Subcategories::Table)
                    .col(Subcategories::DisplayOrder)
                    .to_owned(),
            )
            .await?;

        // updated_at 자동 업데이트 트리거 추가
        manager
            .get_connection()
            .execute_unprepared(
                r#"
                CREATE TRIGGER update_subcategories_updated_at
                BEFORE UPDATE ON subcategories
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
            .execute_unprepared(
                "DROP TRIGGER IF EXISTS update_subcategories_updated_at ON subcategories;",
            )
            .await?;

        // subcategories 테이블 삭제
        manager
            .drop_table(Table::drop().table(Subcategories::Table).to_owned())
            .await
    }
}

#[derive(DeriveIden)]
enum Subcategories {
    Table,
    Id,
    CategoryId,
    Code,
    Name,
    Description,
    DisplayOrder,
    IsActive,
    CreatedAt,
    UpdatedAt,
}

#[derive(DeriveIden)]
enum Categories {
    Table,
    Id,
}
