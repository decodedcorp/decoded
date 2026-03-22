use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // posts 테이블에 trending_score 컬럼 추가
        manager
            .alter_table(
                Table::alter()
                    .table(Posts::Table)
                    .add_column(
                        ColumnDef::new(Posts::TrendingScore)
                            .double()
                            .null()
                            .comment("Trending score calculated by batch job"),
                    )
                    .to_owned(),
            )
            .await?;

        // trending_score DESC 인덱스 추가 (트렌딩 정렬 성능 최적화)
        manager
            .create_index(
                Index::create()
                    .name("idx_posts_trending_score")
                    .table(Posts::Table)
                    .col(Posts::TrendingScore)
                    .to_owned(),
            )
            .await?;

        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // 인덱스 삭제
        manager
            .drop_index(
                Index::drop()
                    .name("idx_posts_trending_score")
                    .table(Posts::Table)
                    .to_owned(),
            )
            .await?;

        // 컬럼 삭제
        manager
            .alter_table(
                Table::alter()
                    .table(Posts::Table)
                    .drop_column(Posts::TrendingScore)
                    .to_owned(),
            )
            .await?;

        Ok(())
    }
}

#[derive(DeriveIden)]
enum Posts {
    Table,
    TrendingScore,
}
