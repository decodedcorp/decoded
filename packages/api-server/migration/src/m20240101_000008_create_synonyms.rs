use sea_orm_migration::{prelude::*, schema::*};

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // synonyms 테이블 생성
        manager
            .create_table(
                Table::create()
                    .table(Synonyms::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(Synonyms::Id)
                            .uuid()
                            .not_null()
                            .primary_key()
                            .comment("Synonym ID"),
                    )
                    .col(
                        ColumnDef::new(Synonyms::Type)
                            .string_len(50)
                            .not_null()
                            .comment(
                                "Synonym type: 'artist' | 'group' | 'location' | 'brand' | 'other'",
                            ),
                    )
                    .col(
                        ColumnDef::new(Synonyms::Canonical)
                            .string_len(255)
                            .not_null()
                            .comment("Canonical form (e.g., 'Jennie')"),
                    )
                    .col(
                        ColumnDef::new(Synonyms::Synonyms)
                            .array(ColumnType::Text)
                            .not_null()
                            .comment("Synonym array (e.g., ['제니', 'JENNIE', 'jennie'])"),
                    )
                    .col(
                        ColumnDef::new(Synonyms::IsActive)
                            .boolean()
                            .not_null()
                            .default(true)
                            .comment("Active status"),
                    )
                    .col(
                        timestamp_with_time_zone(Synonyms::CreatedAt)
                            .default(Expr::current_timestamp())
                            .comment("Record creation timestamp"),
                    )
                    .col(
                        timestamp_with_time_zone(Synonyms::UpdatedAt)
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
                CREATE TRIGGER update_synonyms_updated_at
                BEFORE UPDATE ON synonyms
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column();
                "#,
            )
            .await?;

        // 인덱스 생성
        manager
            .create_index(
                Index::create()
                    .name("idx_synonyms_type")
                    .table(Synonyms::Table)
                    .col(Synonyms::Type)
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .name("idx_synonyms_canonical")
                    .table(Synonyms::Table)
                    .col(Synonyms::Canonical)
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .name("idx_synonyms_is_active")
                    .table(Synonyms::Table)
                    .col(Synonyms::IsActive)
                    .to_owned(),
            )
            .await?;

        // 초기 동의어 데이터 삽입
        manager
            .get_connection()
            .execute_unprepared(
                r#"
                INSERT INTO synonyms (id, type, canonical, synonyms) VALUES
                    (gen_random_uuid(), 'artist', 'Jennie', ARRAY['제니', 'JENNIE', 'jennie', '김제니']),
                    (gen_random_uuid(), 'artist', 'Rosé', ARRAY['로제', 'Rose', 'ROSÉ', '박채영']),
                    (gen_random_uuid(), 'artist', 'Lisa', ARRAY['리사', 'LISA', 'lisa']),
                    (gen_random_uuid(), 'artist', 'Jisoo', ARRAY['지수', 'JISOO', 'jisoo', '김지수']),
                    (gen_random_uuid(), 'group', 'BLACKPINK', ARRAY['블랙핑크', 'blackpink', 'BP', '블핑']),
                    (gen_random_uuid(), 'group', 'BTS', ARRAY['방탄소년단', 'bts', 'Bangtan', '방탄']),
                    (gen_random_uuid(), 'location', 'ICN', ARRAY['인천공항', 'Incheon Airport', '인천국제공항']),
                    (gen_random_uuid(), 'location', 'LAX', ARRAY['LA공항', 'Los Angeles Airport']),
                    (gen_random_uuid(), 'brand', 'Chanel', ARRAY['샤넬', 'chanel', 'CHANEL']);
                "#,
            )
            .await?;

        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // 트리거 삭제
        manager
            .get_connection()
            .execute_unprepared("DROP TRIGGER IF EXISTS update_synonyms_updated_at ON synonyms;")
            .await?;

        // synonyms 테이블 삭제
        manager
            .drop_table(Table::drop().table(Synonyms::Table).to_owned())
            .await
    }
}

#[derive(DeriveIden)]
#[allow(clippy::enum_variant_names)] // 컬럼 iden이 테이블명과 동일할 수 있음
enum Synonyms {
    Table,
    Id,
    Type,
    Canonical,
    Synonyms,
    IsActive,
    CreatedAt,
    UpdatedAt,
}
