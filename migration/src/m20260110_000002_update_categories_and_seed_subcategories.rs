use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // 기존 카테고리 삭제 (Seed 데이터 재생성을 위해)
        manager
            .get_connection()
            .execute_unprepared("DELETE FROM categories;")
            .await?;

        // 새로운 5개 메인 카테고리 삽입
        manager
            .get_connection()
            .execute_unprepared(
                r#"
                INSERT INTO categories (id, code, name, display_order) VALUES
                    (gen_random_uuid(), 'wearables', '{"ko": "패션 아이템", "en": "Wearables"}', 1),
                    (gen_random_uuid(), 'electronics', '{"ko": "전자기기", "en": "Electronics"}', 2),
                    (gen_random_uuid(), 'vehicles', '{"ko": "탈것", "en": "Vehicles"}', 3),
                    (gen_random_uuid(), 'living', '{"ko": "리빙", "en": "Living"}', 4),
                    (gen_random_uuid(), 'beauty', '{"ko": "뷰티", "en": "Beauty"}', 5)
                ON CONFLICT (code) DO NOTHING;
                "#,
            )
            .await?;

        // 서브카테고리 Seed 데이터 삽입
        // Wearables 서브카테고리
        manager
            .get_connection()
            .execute_unprepared(
                r#"
                INSERT INTO subcategories (id, category_id, code, name, display_order)
                SELECT 
                    gen_random_uuid(),
                    c.id,
                    unnest(ARRAY['headwear', 'eyewear', 'accessories', 'tops', 'bottoms', 'shoes', 'bags']),
                    unnest(ARRAY[
                        '{"ko": "모자", "en": "Headwear"}',
                        '{"ko": "안경", "en": "Eyewear"}',
                        '{"ko": "액세서리", "en": "Accessories"}',
                        '{"ko": "상의", "en": "Tops"}',
                        '{"ko": "하의", "en": "Bottoms"}',
                        '{"ko": "신발", "en": "Shoes"}',
                        '{"ko": "가방", "en": "Bags"}'
                    ]::jsonb[]),
                    generate_series(1, 7)
                FROM categories c
                WHERE c.code = 'wearables';
                "#,
            )
            .await?;

        // Electronics 서브카테고리
        manager
            .get_connection()
            .execute_unprepared(
                r#"
                INSERT INTO subcategories (id, category_id, code, name, display_order)
                SELECT 
                    gen_random_uuid(),
                    c.id,
                    unnest(ARRAY['smartphone', 'earphones', 'tablet', 'laptop', 'camera']),
                    unnest(ARRAY[
                        '{"ko": "스마트폰", "en": "Smartphone"}',
                        '{"ko": "이어폰", "en": "Earphones"}',
                        '{"ko": "태블릿", "en": "Tablet"}',
                        '{"ko": "노트북", "en": "Laptop"}',
                        '{"ko": "카메라", "en": "Camera"}'
                    ]::jsonb[]),
                    generate_series(1, 5)
                FROM categories c
                WHERE c.code = 'electronics';
                "#,
            )
            .await?;

        // Vehicles 서브카테고리
        manager
            .get_connection()
            .execute_unprepared(
                r#"
                INSERT INTO subcategories (id, category_id, code, name, display_order)
                SELECT 
                    gen_random_uuid(),
                    c.id,
                    unnest(ARRAY['car', 'motorcycle', 'bicycle']),
                    unnest(ARRAY[
                        '{"ko": "자동차", "en": "Car"}',
                        '{"ko": "오토바이", "en": "Motorcycle"}',
                        '{"ko": "자전거", "en": "Bicycle"}'
                    ]::jsonb[]),
                    generate_series(1, 3)
                FROM categories c
                WHERE c.code = 'vehicles';
                "#,
            )
            .await?;

        // Living 서브카테고리
        manager
            .get_connection()
            .execute_unprepared(
                r#"
                INSERT INTO subcategories (id, category_id, code, name, display_order)
                SELECT 
                    gen_random_uuid(),
                    c.id,
                    unnest(ARRAY['furniture', 'lighting', 'decor', 'kitchenware']),
                    unnest(ARRAY[
                        '{"ko": "가구", "en": "Furniture"}',
                        '{"ko": "조명", "en": "Lighting"}',
                        '{"ko": "데코", "en": "Decor"}',
                        '{"ko": "주방용품", "en": "Kitchenware"}'
                    ]::jsonb[]),
                    generate_series(1, 4)
                FROM categories c
                WHERE c.code = 'living';
                "#,
            )
            .await?;

        // Beauty 서브카테고리
        manager
            .get_connection()
            .execute_unprepared(
                r#"
                INSERT INTO subcategories (id, category_id, code, name, display_order)
                SELECT 
                    gen_random_uuid(),
                    c.id,
                    unnest(ARRAY['makeup', 'skincare', 'haircare', 'fragrance']),
                    unnest(ARRAY[
                        '{"ko": "메이크업", "en": "Makeup"}',
                        '{"ko": "스킨케어", "en": "Skincare"}',
                        '{"ko": "헤어케어", "en": "Haircare"}',
                        '{"ko": "향수", "en": "Fragrance"}'
                    ]::jsonb[]),
                    generate_series(1, 4)
                FROM categories c
                WHERE c.code = 'beauty';
                "#,
            )
            .await?;

        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // Seed 데이터 롤백 (모든 데이터 삭제)
        manager
            .get_connection()
            .execute_unprepared("DELETE FROM subcategories;")
            .await?;

        manager
            .get_connection()
            .execute_unprepared("DELETE FROM categories;")
            .await?;

        // 기존 4개 카테고리 복원
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
}

#[derive(DeriveIden)]
#[allow(dead_code)]
enum Categories {
    Table,
}

#[derive(DeriveIden)]
#[allow(dead_code)]
enum Subcategories {
    Table,
}
