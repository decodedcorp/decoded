//! System category + uncategorized subcategory for spots (retagging workflow).

use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // Parent category `system` (display last in ordered lists)
        manager
            .get_connection()
            .execute_unprepared(
                r#"
                INSERT INTO categories (id, code, name, display_order, is_active, created_at, updated_at)
                SELECT
                    gen_random_uuid(),
                    'system',
                    '{"ko": "시스템", "en": "System"}'::jsonb,
                    99,
                    true,
                    NOW(),
                    NOW()
                WHERE NOT EXISTS (SELECT 1 FROM categories WHERE code = 'system');
                "#,
            )
            .await?;

        // Subcategory `uncategorized` (unique per category_id + code)
        manager
            .get_connection()
            .execute_unprepared(
                r#"
                INSERT INTO subcategories (id, category_id, code, name, display_order, is_active, created_at, updated_at)
                SELECT
                    gen_random_uuid(),
                    c.id,
                    'uncategorized',
                    '{"ko": "카테고리 없음", "en": "Uncategorized"}'::jsonb,
                    1,
                    true,
                    NOW(),
                    NOW()
                FROM categories c
                WHERE c.code = 'system'
                  AND NOT EXISTS (
                    SELECT 1 FROM subcategories s WHERE s.category_id = c.id AND s.code = 'uncategorized'
                  );
                "#,
            )
            .await?;

        // Backfill NULL spots to uncategorized
        manager
            .get_connection()
            .execute_unprepared(
                r#"
                UPDATE spots
                SET subcategory_id = s.id
                FROM subcategories s
                INNER JOIN categories c ON c.id = s.category_id
                WHERE spots.subcategory_id IS NULL
                  AND c.code = 'system'
                  AND s.code = 'uncategorized';
                "#,
            )
            .await?;

        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .get_connection()
            .execute_unprepared(
                r#"
                UPDATE spots
                SET subcategory_id = NULL
                WHERE subcategory_id IN (
                    SELECT s.id
                    FROM subcategories s
                    INNER JOIN categories c ON c.id = s.category_id
                    WHERE c.code = 'system' AND s.code = 'uncategorized'
                );
                "#,
            )
            .await?;

        manager
            .get_connection()
            .execute_unprepared(
                "DELETE FROM subcategories WHERE code = 'uncategorized' AND category_id IN (SELECT id FROM categories WHERE code = 'system');",
            )
            .await?;

        manager
            .get_connection()
            .execute_unprepared("DELETE FROM categories WHERE code = 'system';")
            .await?;

        Ok(())
    }
}
