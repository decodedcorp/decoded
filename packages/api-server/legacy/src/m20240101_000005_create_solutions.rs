use sea_orm_migration::{prelude::*, schema::*};

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // solutions 테이블 생성
        manager
            .create_table(
                Table::create()
                    .table(Solutions::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(Solutions::Id)
                            .uuid()
                            .not_null()
                            .primary_key()
                            .comment("Solution ID"),
                    )
                    .col(
                        ColumnDef::new(Solutions::SpotId)
                            .uuid()
                            .not_null()
                            .comment("Spot ID (references spots)"),
                    )
                    .col(
                        ColumnDef::new(Solutions::UserId)
                            .uuid()
                            .not_null()
                            .comment("User ID (references users)"),
                    )
                    .col(
                        ColumnDef::new(Solutions::MatchType)
                            .string_len(20)
                            .null()
                            .comment(
                                "Match type: perfect | close | NULL (determined when adopted)",
                            ),
                    )
                    .col(
                        ColumnDef::new(Solutions::ProductName)
                            .string_len(255)
                            .not_null()
                            .comment("Product name"),
                    )
                    .col(
                        ColumnDef::new(Solutions::Brand)
                            .string_len(100)
                            .null()
                            .comment("Brand name"),
                    )
                    .col(
                        ColumnDef::new(Solutions::PriceAmount)
                            .decimal_len(12, 2)
                            .null()
                            .comment("Price amount"),
                    )
                    .col(
                        ColumnDef::new(Solutions::PriceCurrency)
                            .string_len(10)
                            .not_null()
                            .default("KRW")
                            .comment("Price currency (KRW, USD, etc.)"),
                    )
                    .col(
                        ColumnDef::new(Solutions::OriginalUrl)
                            .text()
                            .null()
                            .comment("Original product URL"),
                    )
                    .col(
                        ColumnDef::new(Solutions::AffiliateUrl)
                            .text()
                            .null()
                            .comment("Affiliate link URL"),
                    )
                    .col(
                        ColumnDef::new(Solutions::ThumbnailUrl)
                            .text()
                            .null()
                            .comment("Product thumbnail image URL"),
                    )
                    .col(
                        ColumnDef::new(Solutions::Description)
                            .text()
                            .null()
                            .comment("Product description"),
                    )
                    .col(
                        ColumnDef::new(Solutions::AccurateCount)
                            .integer()
                            .not_null()
                            .default(0)
                            .comment("Number of accurate votes"),
                    )
                    .col(
                        ColumnDef::new(Solutions::DifferentCount)
                            .integer()
                            .not_null()
                            .default(0)
                            .comment("Number of different votes"),
                    )
                    .col(
                        ColumnDef::new(Solutions::IsVerified)
                            .boolean()
                            .not_null()
                            .default(false)
                            .comment("Whether solution is verified (accurate >= 5 AND 80%+)"),
                    )
                    .col(
                        ColumnDef::new(Solutions::IsAdopted)
                            .boolean()
                            .not_null()
                            .default(false)
                            .comment("Whether solution is adopted by Spotter"),
                    )
                    .col(
                        ColumnDef::new(Solutions::AdoptedAt)
                            .timestamp_with_time_zone()
                            .null()
                            .comment("Timestamp when solution was adopted"),
                    )
                    .col(
                        ColumnDef::new(Solutions::ClickCount)
                            .integer()
                            .not_null()
                            .default(0)
                            .comment("Number of clicks on affiliate link"),
                    )
                    .col(
                        ColumnDef::new(Solutions::PurchaseCount)
                            .integer()
                            .not_null()
                            .default(0)
                            .comment("Number of purchases via affiliate link"),
                    )
                    .col(
                        ColumnDef::new(Solutions::Status)
                            .string_len(20)
                            .not_null()
                            .default("active")
                            .comment("Solution status: active | hidden"),
                    )
                    .col(
                        timestamp_with_time_zone(Solutions::CreatedAt)
                            .default(Expr::current_timestamp())
                            .comment("Record creation timestamp"),
                    )
                    .col(
                        timestamp_with_time_zone(Solutions::UpdatedAt)
                            .default(Expr::current_timestamp())
                            .comment("Record last update timestamp"),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_solutions_spot_id")
                            .from(Solutions::Table, Solutions::SpotId)
                            .to(Spots::Table, Spots::Id)
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_solutions_user_id")
                            .from(Solutions::Table, Solutions::UserId)
                            .to(Users::Table, Users::Id)
                            .on_delete(ForeignKeyAction::Cascade),
                    )
                    .to_owned(),
            )
            .await?;

        // 인덱스 생성
        manager
            .create_index(
                Index::create()
                    .name("idx_solutions_spot_id")
                    .table(Solutions::Table)
                    .col(Solutions::SpotId)
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .name("idx_solutions_user_id")
                    .table(Solutions::Table)
                    .col(Solutions::UserId)
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .name("idx_solutions_is_verified")
                    .table(Solutions::Table)
                    .col(Solutions::IsVerified)
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .name("idx_solutions_is_adopted")
                    .table(Solutions::Table)
                    .col(Solutions::IsAdopted)
                    .to_owned(),
            )
            .await?;

        // match_type에 대한 인덱스 (pg_trgm 확장 필요)
        manager
            .create_index(
                Index::create()
                    .name("idx_solutions_match_type")
                    .table(Solutions::Table)
                    .col(Solutions::MatchType)
                    .to_owned(),
            )
            .await?;

        // updated_at 자동 업데이트 트리거 추가
        manager
            .get_connection()
            .execute_unprepared(
                r#"
                CREATE TRIGGER update_solutions_updated_at
                BEFORE UPDATE ON solutions
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
            .execute_unprepared("DROP TRIGGER IF EXISTS update_solutions_updated_at ON solutions;")
            .await?;

        // solutions 테이블 삭제
        manager
            .drop_table(Table::drop().table(Solutions::Table).to_owned())
            .await
    }
}

#[derive(DeriveIden)]
enum Solutions {
    Table,
    Id,
    SpotId,
    UserId,
    MatchType,
    ProductName,
    Brand,
    PriceAmount,
    PriceCurrency,
    OriginalUrl,
    AffiliateUrl,
    ThumbnailUrl,
    Description,
    AccurateCount,
    DifferentCount,
    IsVerified,
    IsAdopted,
    AdoptedAt,
    ClickCount,
    PurchaseCount,
    Status,
    CreatedAt,
    UpdatedAt,
}

#[derive(DeriveIden)]
enum Spots {
    Table,
    Id,
}

#[derive(DeriveIden)]
enum Users {
    Table,
    Id,
}
