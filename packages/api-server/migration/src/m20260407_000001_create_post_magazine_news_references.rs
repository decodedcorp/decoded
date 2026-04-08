use sea_orm_migration::prelude::*;

/// Create post_magazine_news_references table for storing filtered news article references.
#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        let db = manager.get_connection();
        db.execute_unprepared(
            "CREATE TABLE post_magazine_news_references (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                post_magazine_id UUID NOT NULL REFERENCES post_magazines(id) ON DELETE CASCADE,
                title VARCHAR NOT NULL,
                url VARCHAR NOT NULL,
                source VARCHAR NOT NULL,
                summary TEXT,
                og_title VARCHAR,
                og_description TEXT,
                og_image VARCHAR,
                og_site_name VARCHAR,
                relevance_score FLOAT NOT NULL DEFAULT 0,
                credibility_score FLOAT NOT NULL DEFAULT 0,
                matched_item VARCHAR,
                created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
            )",
        )
        .await?;

        db.execute_unprepared(
            "CREATE INDEX idx_news_refs_magazine ON post_magazine_news_references(post_magazine_id)",
        )
        .await?;

        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        let db = manager.get_connection();
        db.execute_unprepared("DROP TABLE IF EXISTS post_magazine_news_references")
            .await?;
        Ok(())
    }
}
