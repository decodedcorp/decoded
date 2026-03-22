use sea_orm_migration::{prelude::*, schema::*};

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // badges 테이블 생성
        manager
            .create_table(
                Table::create()
                    .table(Badges::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(Badges::Id)
                            .uuid()
                            .not_null()
                            .primary_key()
                            .comment("Badge ID"),
                    )
                    .col(
                        ColumnDef::new(Badges::Type)
                            .string_len(50)
                            .not_null()
                            .comment("Badge type: specialist | category | achievement | milestone"),
                    )
                    .col(
                        ColumnDef::new(Badges::Name)
                            .string_len(255)
                            .not_null()
                            .comment("Badge name"),
                    )
                    .col(
                        ColumnDef::new(Badges::Description)
                            .text()
                            .comment("Badge description"),
                    )
                    .col(
                        ColumnDef::new(Badges::IconUrl)
                            .text()
                            .comment("Badge icon URL"),
                    )
                    .col(
                        ColumnDef::new(Badges::Criteria)
                            .json_binary()
                            .not_null()
                            .comment("Badge criteria (JSONB): { type, target, threshold }"),
                    )
                    .col(
                        ColumnDef::new(Badges::Rarity)
                            .string_len(20)
                            .not_null()
                            .default("common")
                            .comment("Badge rarity: common | rare | epic | legendary"),
                    )
                    .col(
                        timestamp_with_time_zone(Badges::CreatedAt)
                            .default(Expr::current_timestamp())
                            .comment("Badge creation timestamp"),
                    )
                    .col(
                        timestamp_with_time_zone(Badges::UpdatedAt)
                            .default(Expr::current_timestamp())
                            .comment("Badge update timestamp"),
                    )
                    .to_owned(),
            )
            .await?;

        // 인덱스 추가
        manager
            .create_index(
                Index::create()
                    .name("idx_badges_type")
                    .table(Badges::Table)
                    .col(Badges::Type)
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .name("idx_badges_rarity")
                    .table(Badges::Table)
                    .col(Badges::Rarity)
                    .to_owned(),
            )
            .await?;

        // updated_at 자동 업데이트 트리거 함수 (이미 존재하는 경우 무시)
        manager
            .get_connection()
            .execute_unprepared(
                r#"
                CREATE OR REPLACE FUNCTION update_updated_at_column()
                RETURNS TRIGGER AS $$
                BEGIN
                    NEW.updated_at = NOW();
                    RETURN NEW;
                END;
                $$ LANGUAGE plpgsql;
                "#,
            )
            .await?;

        // updated_at 트리거 생성
        manager
            .get_connection()
            .execute_unprepared(
                r#"
                CREATE TRIGGER update_badges_updated_at
                BEFORE UPDATE ON badges
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column();
                "#,
            )
            .await?;

        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(Badges::Table).to_owned())
            .await
    }
}

#[derive(DeriveIden)]
enum Badges {
    Table,
    Id,
    Type,
    Name,
    Description,
    IconUrl,
    Criteria,
    Rarity,
    CreatedAt,
    UpdatedAt,
}
